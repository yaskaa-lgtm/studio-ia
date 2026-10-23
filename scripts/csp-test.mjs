// CSP proof: loads dist/ pages, reports violations (must be 0), then injects an inline <script>
// and an inline style attribute to prove the meta CSP really blocks them (must be blocked).
import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '..');
const CH = process.env.HEADLESS_CHROME_DIR ?? join(homedir(), '.cache', 'hyperframes', 'chrome', 'chrome-headless-shell');
const CHROME = `${CH}/${readdirSync(CH)[0]}/chrome-headless-shell-win64/chrome-headless-shell.exe`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = await preview({ root: ROOT, logLevel: 'silent', preview: { port: 4791, strictPort: true, host: '127.0.0.1' } });
const chrome = spawn(CHROME, ['--remote-debugging-port=9791', `--user-data-dir=${join(ROOT, '_work', 'chrome-csp')}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
try {
  let v;
  for (let i = 0; i < 50 && !v; i++) v = await fetch('http://127.0.0.1:9791/json/version').then((r) => r.json()).catch(() => sleep(200));
  const ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pend = new Map();
  const events = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) (pend.get(m.id)(m.result), pend.delete(m.id));
    else events.push(m);
  });
  const send = (method, params = {}, sessionId) => new Promise((r) => { const m = { id: ++id, method, params, sessionId }; pend.set(m.id, r); ws.send(JSON.stringify(m)); });
  for (const page of ['index.html', 'mentions-legales.html', 'confidentialite.html']) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    await s('Page.enable');
    await s('Runtime.enable');
    await s('Page.addScriptToEvaluateOnNewDocument', { source: `window.__v=[];document.addEventListener('securitypolicyviolation',e=>window.__v.push(e.violatedDirective+' '+(e.blockedURI||'inline')));` });
    await s('Page.navigate', { url: `http://127.0.0.1:4791/${page}` });
    await sleep(3500);
    const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.value;
    const before = await ev('JSON.stringify(window.__v)');
    const csp = await ev(`document.querySelector('meta[http-equiv="Content-Security-Policy"]').content`);
    const probe = await ev(`(async () => {
      window.__inline = false;
      const sc = document.createElement('script'); sc.textContent = 'window.__inline = true'; document.body.append(sc);
      const d = document.createElement('div'); d.setAttribute('style', 'color: rgb(1, 2, 3)'); document.body.append(d);
      await new Promise(r => setTimeout(r, 300));
      return { inlineScriptRan: window.__inline, inlineStyleApplied: getComputedStyle(d).color === 'rgb(1, 2, 3)', violations: window.__v.slice() };
    })()`);
    console.log(JSON.stringify({ page, violationsDuringLoad: JSON.parse(before), probe }, null, 1));
    if (page === 'index.html') {
      console.log('CSP =', csp);
      // keyboard: Tab through the first focusable elements and screenshot the focus ring
      await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      const order = [];
      for (let i = 0; i < 4; i++) {
        await s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await sleep(150);
        order.push(await ev(`(document.activeElement.textContent || document.activeElement.getAttribute('aria-label') || '').trim().slice(0, 40) + ' | outline=' + getComputedStyle(document.activeElement).outlineStyle`));
      }
      console.log('TAB ORDER', JSON.stringify(order));
      const { data } = await s('Page.captureScreenshot', { format: 'png' });
      (await import('node:fs')).writeFileSync(join(ROOT, '_work', 'shots', 'focus-1440.png'), Buffer.from(data, 'base64'));
    }
    await send('Target.closeTarget', { targetId });
  }
  ws.close();
} finally {
  chrome.kill();
  await new Promise((r) => server.httpServer.close(r));
}
