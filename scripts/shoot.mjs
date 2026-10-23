// Visual + console check: serves dist/ with `vite preview`, drives chrome-headless-shell over CDP,
// takes screenshots at several scroll positions and 4 viewports, collects console errors and CSP violations.
// Usage: node scripts/shoot.mjs [--only=1440x900] [--tag=name]
// Everything is started and stopped inside this process (no leftover server).
import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, '_work', 'shots');
mkdirSync(OUT, { recursive: true });
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));

const CH_BASE = process.env.HEADLESS_CHROME_DIR ?? join(homedir(), '.cache', 'hyperframes', 'chrome', 'chrome-headless-shell');
const ver = readdirSync(CH_BASE)[0];
const CHROME = `${CH_BASE}/${ver}/chrome-headless-shell-win64/chrome-headless-shell.exe`;
const PORT = 4790;
const DBG = 9790;

const VIEWPORTS = [
  { w: 390, h: 844, mobile: true },
  { w: 768, h: 1024, mobile: true },
  { w: 1440, h: 900, mobile: false },
  { w: 1920, h: 1080, mobile: false },
].filter((v) => !args.only || args.only.split(',').includes(`${v.w}x${v.h}`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = await preview({ root: ROOT, logLevel: 'silent', preview: { port: PORT, strictPort: true, host: '127.0.0.1' } });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DBG}`,
  `--user-data-dir=${join(ROOT, '_work', 'chrome-profile')}`,
  '--no-first-run',
  '--hide-scrollbars',
  '--autoplay-policy=no-user-gesture-required',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  'about:blank',
], { stdio: 'ignore' });

let report = { viewports: [] };
try {
  let ver;
  for (let i = 0; i < 50; i++) {
    try {
      ver = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json();
      break;
    } catch {
      await sleep(200);
    }
  }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) listeners.forEach((l) => l(msg));
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const m = { id: ++id, method, params };
      if (sessionId) m.sessionId = sessionId;
      const timer = setTimeout(() => {
        pending.delete(m.id);
        rej(new Error(`CDP timeout: ${method}`));
      }, 20000);
      pending.set(m.id, {
        res: (v) => (clearTimeout(timer), res(v)),
        rej: (e) => (clearTimeout(timer), rej(e)),
      });
      ws.send(JSON.stringify(m));
    });

  async function openPage({ reduced = false, noWebgl = false } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    const logs = [];
    listeners.push((msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(msg.params.type))
        logs.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
      if (msg.method === 'Runtime.exceptionThrown') logs.push(`exception: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
      if (msg.method === 'Log.entryAdded' && ['error', 'warning'].includes(msg.params.entry.level))
        logs.push(`log/${msg.params.entry.source}: ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
    });
    await s('Runtime.enable');
    await s('Log.enable');
    await s('Page.enable');
    let pre = `document.addEventListener('securitypolicyviolation', e => console.error('CSP-VIOLATION', e.violatedDirective, e.blockedURI, e.sourceFile, e.lineNumber));`;
    if (noWebgl)
      pre += `const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(t, ...a){ if (/webgl/i.test(t)) return null; return g.call(this, t, ...a); };`;
    await s('Page.addScriptToEvaluateOnNewDocument', { source: pre });
    await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    return { s, logs, targetId };
  }
  const evaluate = async (s, expr) => (await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

  const variants = [
    args.variant === 'reduced'
      ? { tag: 'reduced', reduced: true }
      : args.variant === 'nowebgl'
        ? { tag: 'nowebgl', noWebgl: true }
        : { tag: 'motion' },
  ];

  for (const variant of variants) {
    for (const vp of VIEWPORTS) {
      if (variant.only && !variant.only.includes(vp.w)) continue;
      const { s, logs, targetId } = await openPage(variant);
      await s('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile });
      await s('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile });
      const t0 = Date.now();
      await s('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
      for (let i = 0; i < 60; i++) {
        if ((await evaluate(s, 'document.readyState')) === 'complete') break;
        await sleep(100);
      }
      const loadMs = Date.now() - t0;
      await sleep(2600);
      const perf = await evaluate(
        s,
        `(() => { const n = performance.getEntriesByType('navigation')[0]; const r = performance.getEntriesByType('resource');
          return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), bytes: Math.round((n.transferSize + r.reduce((a,b)=>a+(b.transferSize||0),0))/1024), resources: r.length,
                   webgl: document.documentElement.classList.contains('has-webgl') } })()`,
      );
      const positions = await evaluate(
        s,
        `(() => { const top = (sel, dy=0) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().top + scrollY + dy) : 0; };
          const H = innerHeight; const desk = innerWidth >= 900;
          const spacer = (sel) => { const el = document.querySelector(sel); const sp = el && el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el; return sp ? sp.getBoundingClientRect().top + scrollY : 0; };
          const hero = spacer('.hero__pin'); const meth = spacer('.method__pin');
          return {
            '01-top': 0,
            '02-hero-mid': Math.round(desk ? hero + H * 0.7 : H * 0.55),
            '03-hero-end': Math.round(desk ? hero + H * 1.38 : H * 1.0),
            '04-who': top('.who', -20),
            '05-who-list': top('.who__list', -H * 0.25),
            '06-method-a': Math.round(meth + 10),
            '07-method-c': Math.round(meth + (desk ? H * 2.2 * 0.62 : top('.steps') - meth)),
            '08-reel': top('.reel', -H * 0.15),
            '09-phones': top('.phones', -H * 0.12),
            '10-pricing': top('#tarifs', 0),
            '11-plans': top('.plans', -100),
            '12-sim': top('.sim', -80),
            '13-faq': top('#faq', 0),
            '14-final': top('.final', 0),
            '15-end': document.documentElement.scrollHeight - H,
          }; })()`,
      );
      const shots = [];
      console.error(`[shoot] ${variant.tag} ${vp.w}x${vp.h} load=${loadMs}ms`);
      for (const [name, y] of Object.entries(positions)) {
        await evaluate(s, `window.scrollTo(0, ${y}); true`);
        await sleep(1400);
        const { data } = await s('Page.captureScreenshot', { format: 'png' });
        const file = join(OUT, `${variant.tag}-${vp.w}x${vp.h}-${name}.png`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        shots.push(file);
      }
      // layout problems
      const issues = await evaluate(
        s,
        `(() => { const out = []; const W = document.documentElement.clientWidth;
          if (document.documentElement.scrollWidth > W + 1) out.push('horizontal overflow: ' + document.documentElement.scrollWidth + ' > ' + W);
          document.querySelectorAll('h1,h2,h3,p,a.btn,summary,dd,.plan__amount,.who__name').forEach(el => {
            if (el.closest('.phones')) return;
            if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push('clipped: ' + el.tagName + ' ' + el.textContent.trim().slice(0,40));
            const r = el.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0) out.push('beyond right edge: ' + el.tagName + ' ' + el.textContent.trim().slice(0,40) + ' (' + Math.round(r.right) + ')');
          });
          const imgs = [...document.images].filter(i => !i.alt && i.getAttribute('alt') === null).map(i => i.src); if (imgs.length) out.push('img without alt: ' + imgs.join(','));
          return out; })()`,
      );
      // fps sample in hero (software GL in headless: indicative only)
      await evaluate(s, 'window.scrollTo(0, 0); true');
      await sleep(600);
      const fps = await evaluate(
        s,
        `new Promise(r => { let n = 0; const t0 = performance.now(); let y = 0; const f = () => { n++; y += 6; window.scrollTo(0, y); if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })`,
      );
      report.viewports.push({ variant: variant.tag, viewport: `${vp.w}x${vp.h}`, loadMs, perf, fps, issues, logs: [...new Set(logs)], shots: shots.length });
      await send('Target.closeTarget', { targetId });
    }
  }
  // legal pages console check
  for (const page of ['mentions-legales.html', 'confidentialite.html']) {
    const { s, logs, targetId } = await openPage();
    await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await s('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
    await sleep(1500);
    const { data } = await s('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, `legal-${page.replace('.html', '')}.png`), Buffer.from(data, 'base64'));
    report.viewports.push({ variant: 'legal', viewport: page, logs: [...new Set(logs)] });
    await send('Target.closeTarget', { targetId });
  }
  ws.close();
} finally {
  chrome.kill();
  await new Promise((r) => server.httpServer.close(r));
}
writeFileSync(join(OUT, `report-${args.variant ?? "motion"}-${args.only ?? "all"}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));
