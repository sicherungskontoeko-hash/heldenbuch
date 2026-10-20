/* HB-21 Online-Tisch: Verschlüsselung, Fremdzugriff, Manipulation und Wiederverbindung.
   Startet einen lokalen MQTT-Broker (aedes, Port 8890) und einen Webserver (Port 8891) für app/www.
   Voraussetzung: python3 build_app.py · Aufruf: node tests/net.test.js */
const { chromium } = require('playwright');
const { Aedes } = require('aedes'); const http = require('http'); const wsStream = require('websocket-stream');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'app', 'www');
(async () => {
  const aedes = await Aedes.createBroker(); const seen = [];
  aedes.on('publish', (pk, client) => { if (client) seen.push({ topic: pk.topic, payload: String(pk.payload) }); });
  const bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, aedes.handle); await new Promise((r) => bsrv.listen(8890, r));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  const web = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise((r) => web.listen(8891, r));
  const b = await chromium.launch(); const errs = []; const out = []; const T = (name, ok, info) => out.push({ name, ok: !!ok, info });
  const mk = async (name) => { const c = await b.newContext(); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8890'); }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); await p.goto('http://localhost:8891/'); await p.waitForTimeout(700); return { c, p }; };
  const A = await mk('SL'), B = await mk('Spieler'), X = await mk('Fremder');
  const code = 'geheimrunde-' + Math.random().toString(36).slice(2, 10);
  await A.p.evaluate((c) => { cur().name = 'Aldric Geheimname'; commit(false); joinCamp(c); setTimeout(() => saveMeta({ dm: UID }), 800); }, code);
  await B.p.evaluate((c) => { cur().name = 'Bryn Spielerin'; commit(false); joinCamp(c); }, code);
  await X.p.evaluate(() => { joinCamp('geheimrunde-falsch'); });
  await A.p.waitForTimeout(3500);
  const tA = await A.p.evaluate(() => Object.values(S.table).map((p) => p.char).sort());
  const tX = await X.p.evaluate(() => Object.values(S.table).map((p) => p.char));
  T('Beide Geräte sehen sich gegenseitig', tA.includes('Bryn Spielerin') && tA.length >= 2, tA.join(', '));
  T('Fremder mit anderem Code sieht niemanden aus der Runde', !tX.some((n) => /Aldric|Bryn/.test(n)), tX.join(', '));
  const roomMsgs = seen.filter((m) => m.payload);
  T('Broker sieht den Raumcode nicht im Themennamen', roomMsgs.every((m) => !m.topic.includes(code)), roomMsgs.slice(0, 2).map((m) => m.topic).join(' | '));
  T('Broker sieht keine Klarnamen in den Daten', roomMsgs.every((m) => !/Aldric|Bryn/.test(m.payload)), '');
  T('Alle Raumnachrichten sind verschlüsselt (AES-GCM)', roomMsgs.length > 0 && roomMsgs.every((m) => /"e":1/.test(m.payload)), roomMsgs.length + ' Nachrichten');
  /* Manipulation: Klartext-Nachricht in den Raum einschleusen */
  const topic = roomMsgs.find((m) => /players\//.test(m.topic)).topic.replace(/[^/]+$/, 'boese');
  aedes.publish({ topic, payload: Buffer.from(JSON.stringify({ char: 'Eindringling', cls: 'fig', hp: 1 })), retain: true, qos: 0 }, () => {});
  await A.p.waitForTimeout(1200);
  T('Eingeschleuste Klartext-Nachricht wird verworfen', !(await A.p.evaluate(() => Object.values(S.table).some((p) => p.char === 'Eindringling'))), '');
  /* Wiederverbindung: Broker-Verbindung kurz trennen */
  await B.p.evaluate(() => { HBNET.ws && HBNET.ws.close(); }); await B.p.waitForTimeout(3500);
  await B.p.evaluate(() => d20(5, 'Nach Wiederverbindung', { kind: 'check:dex' })); await A.p.waitForTimeout(1800);
  T('Nach Verbindungsabbruch: Spieler verbindet neu, Würfe kommen an', await A.p.evaluate(() => tableRolls().some((r) => /Nach Wiederverbindung/.test(r.label))), '');
  for (const r of out) console.log((r.ok ? '✔ ' : '✘ ') + r.name + (r.info ? ' (' + r.info + ')' : ''));
  const bad = out.filter((r) => !r.ok).length + errs.length; console.log('\n' + (out.length - out.filter((r) => !r.ok).length) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); bsrv.close(); web.close(); aedes.close(); process.exit(bad ? 1 : 0);
})();
