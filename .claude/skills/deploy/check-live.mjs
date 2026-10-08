// The live site, from outside: the page answers, and the game socket opens
// through the Cloudflare tunnel with compression negotiated.
//   node check-live.mjs [wss-url] [page-url]
const [wsUrl = 'wss://ws.tobyens.com', pageUrl = 'https://mtg.tobyens.com/'] = process.argv.slice(2);

const page = await fetch(pageUrl).then((r) => r.status, (e) => `unreachable (${e.cause?.code ?? e.message})`);
console.log(`page    ${pageUrl} -> ${page}`);

const t0 = Date.now();
const result = await new Promise((resolve) => {
  const ws = new WebSocket(wsUrl);
  const done = (r) => { clearTimeout(timer); try { ws.close(); } catch {} resolve(r); };
  const timer = setTimeout(() => done({ ok: false, why: 'no answer in 15 s' }), 15_000);
  ws.onopen = () => done({ ok: true, ms: Date.now() - t0, extensions: ws.extensions });
  ws.onerror = () => done({ ok: false, why: 'handshake failed' });
});
console.log(
  result.ok
    ? `socket  ${wsUrl} -> open in ${result.ms} ms, compression: ${/permessage-deflate/.test(result.extensions) ? 'on' : 'OFF'}`
    : `socket  ${wsUrl} -> ${result.why}`,
);
process.exit(page === 200 && result.ok && /permessage-deflate/.test(result.extensions) ? 0 : 1);
