/* Fablecrown Vault – lokaler Prüfserver (nur Test, nur Speicher, keine Cloud, keine Kosten).
   Beschreibt zugleich den Vertrag für einen späteren echten Dienst (V3, gesondert freizugeben).
   Speichert nur: SHA-256 der Wiederherstellungs-Berechtigung und der Gerätezugänge, Chiffrate, Revisionen, Zeiten.
   Fehler lassen sich einspeisen (fault/down) und alle Anfragen werden protokolliert (Prüfung «kein Klartext»).
   Als Webserver für Browsertests: node tools/vault-mock.js [Port]  (nur 127.0.0.1) */
const crypto = require('crypto');
const H = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex');
const HEXID = /^[0-9a-f]{32}$/;
function createMock(o = {}) {
  const now = o.now || (() => Date.now()); const TTL = o.ttl || 600000, HIST = o.hist || 10, MAX = o.maxBytes || 400000, MAXOBJ = o.maxObj || 2000;
  const db = {}, pairs = {}; const M = { db, pairs, calls: 0, fault: null, down: false, log: [] };
  const dev = (v, a) => { if (!v || !a || typeof a.did !== 'string') return null; const d = v.devs[a.did]; return d && d.tok === H(a.tok) ? d : null; };
  M.handle = async (m, path, x = {}) => {
    M.calls++; M.log.push(m + ' ' + path + ' ' + JSON.stringify(x.body || {}));
    if (M.down) throw new Error('offline'); const f = M.fault && (!M.fault.on || M.fault.on === m) ? M.fault : null; if (f) { if (!f.keep) M.fault = null; if (!f.after) return f; }
    const r = route(m, path, x); if (f && f.after) throw new Error('Zeitüberschreitung nach Ausführung'); return r;
  };
  function route(m, path, x) {
    const b = x.body || {}; const seg = path.split('/').filter(Boolean); /* v1 vault {vid} … | v1 pair {pid} */
    if (seg[0] !== 'v1') return { status: 404 };
    if (seg[1] === 'pair' && m === 'POST' && seg.length === 3) { const p = pairs[seg[2]]; if (!p) return { status: 404 }; delete pairs[seg[2]]; if (p.exp < now() || !db[p.vid]) return { status: 410 };
      if (!b.dev || !HEXID.test(b.dev.did) || typeof b.dev.tok !== 'string') return { status: 400 }; db[p.vid].devs[b.dev.did] = { tok: H(b.dev.tok), at: now(), seen: now() }; return { status: 200, body: { vid: p.vid, box: p.box } }; }
    if (seg[1] !== 'vault' || !HEXID.test(seg[2] || '')) return { status: 404 };
    const vid = seg[2], v = db[vid], rest = seg.slice(3);
    if (m === 'POST' && !rest.length) { if (v) return { status: 409 }; if (!b.dev || !HEXID.test(b.dev.did)) return { status: 400 }; db[vid] = { rauth: H(b.rauth), devs: { [b.dev.did]: { tok: H(b.dev.tok), at: now(), seen: now() } }, obj: {} }; return { status: 201 }; }
    if (m === 'POST' && rest[0] === 'dev' && rest.length === 1) { if (!v || v.rauth !== H(b.rauth)) return { status: 401 }; if (!b.dev || !HEXID.test(b.dev.did)) return { status: 400 }; v.devs[b.dev.did] = { tok: H(b.dev.tok), at: now(), seen: now() }; return { status: 201 }; }
    const d = dev(v, x.auth); if (!d) return { status: 401 }; d.seen = now();
    if (m === 'DELETE' && !rest.length) { delete db[vid]; for (const k of Object.keys(pairs)) if (pairs[k].vid === vid) delete pairs[k]; return { status: 200 }; }
    if (m === 'GET' && rest[0] === 'meta') { const o2 = {}; for (const [k, ob] of Object.entries(v.obj)) o2[k] = ob.rev; return { status: 200, body: o2 }; }
    if (rest[0] === 'obj' && HEXID.test(rest[1] || '')) { const ob = v.obj[rest[1]];
      if (m === 'GET' && rest.length === 2) return ob ? { status: 200, body: { rev: ob.rev, box: ob.box } } : { status: 404 };
      if (m === 'GET' && rest[2] === 'hist') return { status: 200, body: ob ? ob.hist.map((h) => ({ rev: h.rev, at: h.at, box: h.box })) : [] };
      if (m === 'PUT' && rest.length === 2) { const box = JSON.stringify(b.box || null); if (box.length > MAX) return { status: 413 }; const cur = ob ? ob.rev : 0;
        if (ob && b.rev === cur && box === JSON.stringify(ob.box)) return { status: 200, body: { rev: cur, replay: true } }; /* Wiederholung: keine zweite Änderung */
        if (b.ifMatch !== cur) return { status: 409, body: { rev: cur } }; if (b.rev !== cur + 1) return { status: 400 };
        if (!ob && Object.keys(v.obj).length >= MAXOBJ) return { status: 507 };
        const n = ob || (v.obj[rest[1]] = { hist: [] }); n.rev = b.rev; n.box = b.box; n.at = now(); n.hist.push({ rev: b.rev, box: b.box, at: n.at }); if (n.hist.length > HIST) n.hist.shift(); return { status: cur ? 200 : 201 }; } }
    if (rest[0] === 'dev') {
      if (m === 'GET' && rest.length === 1) return { status: 200, body: Object.entries(v.devs).map(([did, x2]) => ({ did, box: x2.box, at: x2.at, seen: x2.seen })) };
      if (m === 'PUT' && rest[1] === x.auth.did) { d.box = b.box; return { status: 200 }; }
      if (m === 'DELETE' && v.devs[rest[1]]) { delete v.devs[rest[1]]; return { status: 200 }; }
      return { status: 404 }; }
    if (m === 'POST' && rest[0] === 'pair') { if (!HEXID.test(b.pid || '')) return { status: 400 }; if (Object.values(pairs).filter((p) => p.vid === vid).length >= 3) return { status: 429, body: { retryMs: TTL } };
      pairs[b.pid] = { vid, box: b.box, exp: now() + TTL }; return { status: 201, body: { exp: now() + TTL } }; }
    return { status: 404 };
  }
  return M;
}
/* Browser-Adapter für vault.js: Gerätezugang im Header, Nutzdaten im Körper, nie in der URL */
function httpApi(base, fetchFn) { const f = fetchFn || fetch; return async (m, path, x = {}) => {
  const h = { 'content-type': 'application/json' }; if (x.auth) h.authorization = 'FCV ' + x.auth.did + ':' + x.auth.tok;
  const r = await f(base + path, { method: m, headers: h, body: m === 'GET' || m === 'DELETE' ? undefined : JSON.stringify(x.body || {}) });
  let body = null; try { body = await r.json(); } catch (e) {} return { status: r.status, body }; }; }
function serve(M, port, host = '127.0.0.1') { return require('http').createServer((rq, rs) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PUT,DELETE', 'access-control-allow-headers': 'content-type,authorization', 'content-type': 'application/json' };
  if (rq.method === 'OPTIONS') { rs.writeHead(204, cors); return rs.end(); }
  let raw = ''; rq.on('data', (c) => { raw += c; if (raw.length > 2e6) rq.destroy(); }); rq.on('end', async () => {
    const a = /^FCV ([0-9a-f]{32}):([0-9a-f]{64})$/.exec(rq.headers.authorization || ''); let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch (e) { rs.writeHead(400, cors); return rs.end('{}'); }
    let r; try { r = await M.handle(rq.method, rq.url, { auth: a ? { did: a[1], tok: a[2] } : null, body }); } catch (e) { rq.socket.destroy(); return; }
    rs.writeHead(r.status, cors); rs.end(JSON.stringify(r.body === undefined ? {} : r.body)); }); }).listen(port, host); }
module.exports = { createMock, httpApi, serve };
if (require.main === module) { const p = +process.argv[2] || 8920; serve(createMock(), p); console.log('Vault-Prüfserver auf http://127.0.0.1:' + p); }
