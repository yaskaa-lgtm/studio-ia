// Close a leftover chrome-headless-shell started by shoot.mjs (CDP Browser.close on port 9790).
const v = await (await fetch('http://127.0.0.1:9790/json/version')).json();
const ws = new WebSocket(v.webSocketDebuggerUrl);
ws.addEventListener('open', () => ws.send(JSON.stringify({ id: 1, method: 'Browser.close' })));
ws.addEventListener('close', () => process.exit(0));
setTimeout(() => process.exit(0), 3000);
