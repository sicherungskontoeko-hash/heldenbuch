/* GK-08: Base64 grosser verschlüsselter Nachrichten (App-Version mit appnet.js).
   Teil A: Kodierung, Kompatibilität, hbSeal/hbOpen, Grenzen, ungültige Daten. Teil B: zwei Geräte über lokalen Broker
   (aedes, Ports 8900/8901): grosse Nachricht kommt vollständig an, zu grosse wird beim Absender abgelehnt, Wiederverbindung.
   Voraussetzung: python3 build_app.py · Aufruf: node tests/gk-b64.test.js [--browser=chromium|firefox|webkit] */
const pw = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const ROOT = path.resolve(__dirname, '..', 'app', 'www');
const BR = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').split('=')[1];
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
(async () => {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) { console.log('✘ App-Version fehlt (python3 build_app.py)'); process.exit(1); }
  const { Aedes } = require('aedes'); const wsStream = require('websocket-stream');
  const aedes = await Aedes.createBroker(); const seen = []; aedes.on('publish', (pk, client) => { if (client) seen.push({ t: pk.topic, n: pk.payload.length, p: pk.payload.length < 4000 ? String(pk.payload) : '' }); });
  const bsrv = http.createServer(); wsStream.createServer({ server: bsrv, maxPayload: 8e6 }, aedes.handle); await new Promise((r) => bsrv.listen(8900, r));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  const web = http.createServer((q, s) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
  await new Promise((r) => web.listen(8901, r));
  let b; try { b = await pw[BR].launch(); } catch (e) { console.log('✘ GK08-T07 Browser ' + BR + ' hier nicht verfügbar: ' + e.message.split('\n')[0]); process.exit(2); }
  console.log('Browser: ' + BR + ' ' + b.version());
  const errs = [];
  const mk = async (name) => { const c = await b.newContext(); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8900'); localStorage.setItem('hb_dice_fx', 'aus'); }); const pg = await c.newPage(); pg.on('pageerror', (e) => errs.push(name + ': ' + e.message)); await pg.goto('http://localhost:8901/'); await pg.waitForTimeout(700); return pg; };
  const A = await mk('A');

  /* ---------- Teil A ---------- */
  let r = await A.evaluate(() => { const sizes = [0, 1, 2, 3, 0x4000 - 1, 0x4000, 0x4000 + 1, 65536, 150000, 250000, 1000000]; const out = {};
    for (const n of sizes) { const u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = (i * 2654435761 + 7) & 255; if (n > 2) { u[0] = 0; u[1] = 255; u[n - 1] = 0; } let ok = false, err = ''; try { const back = hbUb64(hbB64(u)); ok = back.length === n && back.every((v, i) => v === u[i]); } catch (e) { err = e.message; } out[n] = ok || err; }
    return out; });
  T('GK08-T01 Byte-Roundtrip 0/1/2/3, Blockgrenze ±1, 65 536, 150 000, 250 000, 1 000 000 Bytes', Object.values(r).every((v) => v === true), r);
  r = await A.evaluate(() => { let bad = 0; const old = (u) => btoa(String.fromCharCode(...u)); for (let n = 0; n <= 300; n++) { const u = new Uint8Array(n); crypto.getRandomValues(u); if (hbB64(u) !== old(u)) bad++; } const fixed = [new Uint8Array([0]), new Uint8Array([255, 255]), new Uint8Array([0, 0, 0]), new Uint8Array(1000).fill(255)]; for (const u of fixed) if (hbB64(u) !== old(u)) bad++; return bad; });
  T('GK08-T02 Kleine Ausgaben identisch mit der bisherigen Kodierung (305 Fälle)', r === 0, r);
  r = await A.evaluate(async () => { const { key } = await hbRoomKey('gk08-test'); const pic = 'data:image/jpeg;base64,' + 'A'.repeat(1500000); const obj = { char: 'Gross', pimg: pic, rolls: Array.from({ length: 30 }, (_, i) => ({ label: 'Wurf ' + i, total: i, t: i })) }; const env = await hbSeal(key, obj); const back = await hbOpen(key, env); return { env: env.length, same: JSON.stringify(back) === JSON.stringify(obj) }; });
  T('GK08-T03 hbSeal → hbOpen mit 1,5 MB Porträtfixture', r.same && r.env < 3e6, r);
  r = await A.evaluate(async () => { const { key } = await hbRoomKey('gk08-test'); const size = (n) => hbSeal(key, { x: 'a'.repeat(n) }).then((e) => e.length).catch((e) => e.code || e.message);
    let lo = 1e6, hi = 3e6; while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); const s = await size(m); if (typeof s === 'number') lo = m; else hi = m; }
    const below = await size(lo), above = await size(lo + 1); const big = 'x'.repeat(3e6 + 1); const openBig = await hbOpen(key, big);
    let pub = 0; const p0 = HBNET.publish; HBNET.publish = function () { pub++; return p0.apply(this, arguments); }; let setErr = ''; try { await HBDB.doc('camp/gk08raum/state/meta').set({ x: 'a'.repeat(lo + 10) }); } catch (e) { setErr = e.code; } HBNET.publish = p0;
    return { maxPlain: lo, below, above, openBig, pub, setErr }; });
  T('GK08-T04 Grenze: knapp darunter gesendet, knapp darüber abgelehnt (kein Senden, kein Klartext)', typeof r.below === 'number' && r.below <= 3e6 && r.above === 'too_large' && r.pub === 0 && r.setErr === 'too_large', r);
  T('GK08-T04 Empfänger verwirft Nachrichten über 3 MB', r.openBig === null, r);
  r = await A.evaluate(async () => { const { key } = await hbRoomKey('gk08-test'); const other = (await hbRoomKey('gk08-anders')).key; const env = JSON.parse(await hbSeal(key, { a: 1 }));
    const tamper = Object.assign({}, env, { ct: env.ct.slice(0, -4) + (env.ct.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA') });
    const res = await Promise.all([hbOpen(key, JSON.stringify({ e: 1, iv: '@@@', ct: '!!!' })), hbOpen(key, JSON.stringify(tamper)), hbOpen(other, JSON.stringify(env)), hbOpen(key, JSON.stringify({ a: 1 })), hbOpen(key, 'kein json'), hbOpen(key, JSON.stringify({ e: 1, iv: env.iv, ct: 5 }))]);
    return res.map((x) => x === null); });
  T('GK08-T05 Ungültiges Base64, veränderter Geheimtext, falscher Schlüssel, Klartext: sicher verworfen', r.every(Boolean), r);

  /* ---------- Teil B ---------- */
  const B = await mk('B');
  const code = 'GK' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const N = 1200000;
  await A.evaluate(async ([code, N]) => { const ch = cur(); const big = JSON.parse(JSON.stringify(ch)); big.notes = 'Notiz '.repeat(N / 6); window.__sent = JSON.stringify(big).length; await HBDB.doc('transfer/' + code).set({ heldenbuch: 1, chars: [big], hb: [], t: Date.now() }); }, [code, N]);
  r = await B.evaluate(([code]) => new Promise((res) => { const off = HBDB.doc('transfer/' + code).onSnapshot((s) => { if (!s.exists) return; const d = s.data(); res({ len: JSON.stringify(d.chars[0]).length, notes: d.chars[0].notes.length }); setTimeout(off, 0); }); setTimeout(() => res(null), 8000); }), [code]);
  const sent = await A.evaluate(() => window.__sent);
  T('GK08-T06 Zwei Geräte: grosse Übertragung (~1,2 MB Text) kommt vollständig an', r && r.len === sent, { r, sent });
  r = await A.evaluate(async ([code]) => { let e = ''; try { await HBDB.doc('transfer/' + code + 'X').set({ x: 'a'.repeat(2600000) }); } catch (x) { e = x.code; } return e; }, [code]);
  const tooBig = seen.some((m) => m.n > 3e6);
  T('GK08-T06 Zu grosse Nachricht: beim Absender abgelehnt, nichts am Broker', r === 'too_large' && !tooBig, { r, tooBig });
  /* T08 Wiederverbindung / Warteschlange */
  const code2 = code + 'Q';
  await B.evaluate(() => { HBNET.ws && HBNET.ws.close(); });
  await A.evaluate(async ([c2]) => { await HBDB.doc('transfer/' + c2).set({ heldenbuch: 1, gross: 'z'.repeat(900000), t: Date.now() }); }, [code2]);
  await A.waitForTimeout(3500);
  r = await B.evaluate(([c2]) => new Promise((res) => { const off = HBDB.doc('transfer/' + c2).onSnapshot((s) => { if (!s.exists) return; res(s.data().gross.length); setTimeout(off, 0); }); setTimeout(() => res(null), 9000); }), [code2]);
  T('GK08-T08 Nach Verbindungsabbruch: grosse gespeicherte Nachricht kommt an', r === 900000, r);
  r = await A.evaluate(async ([c3]) => { HBNET.ws && HBNET.ws.close(); await new Promise((x) => setTimeout(x, 100)); const st0 = HBNET.state; HBDB.doc('transfer/' + c3).set({ heldenbuch: 1, gross: 'q'.repeat(800000), t: Date.now() }); return st0; }, [code + 'W']);
  await A.waitForTimeout(4000);
  const r2 = await B.evaluate(([c3]) => new Promise((res) => { const off = HBDB.doc('transfer/' + c3).onSnapshot((s) => { if (!s.exists) return; res(s.data().gross.length); setTimeout(off, 0); }); setTimeout(() => res(null), 9000); }), [code + 'W']);
  T('GK08-T08 Warteschlange: offline gesendete grosse Nachricht geht nach Wiederverbindung raus', r2 === 800000, { st: r, r2 });
  T('GK08 Broker sieht keinen Klartext', seen.every((m) => !/Notiz Notiz|zzzz|qqqq/.test(m.p)), seen.length);
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden (' + BR + ')');
  await b.close(); bsrv.close(); web.close(); aedes.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
