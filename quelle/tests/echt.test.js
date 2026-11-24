/* Echter Online-Tisch: drei Geräte mit drei Browser-Engines über den öffentlichen Server.
   SL am Laptop (Chromium), Spielerin am iPhone (WebKit/Safari), Spieler am Android-Handy (Firefox).
   Läuft in GitHub Actions; hier im Arbeitsbereich ist der Server gesperrt.
   Aufruf: node tests/echt.test.js [--server=hivemq|emqx] [--lokal (alle Chromium, lokaler Broker)]
   Voraussetzung: python3 build_app.py */
const pw = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'app', 'www');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const LOKAL = process.argv.includes('--lokal'); const SERVER = arg('server', 'hivemq');
const SHOTS = path.join(__dirname, 'echt-bilder'); fs.mkdirSync(SHOTS, { recursive: true });
const out = []; const errs = []; const T = (n, ok, info) => { out.push({ n, ok: !!ok, info }); console.log((ok ? '✔ ' : '✘ ') + n + (info != null ? '  (' + (typeof info === 'string' ? info : JSON.stringify(info)) + ')' : '')); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(p, fn, arg, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await p.evaluate(fn, arg)) return Date.now() - t0; } catch (e) {} await wait(250); } return -1; }

(async () => {
  let broker = null, bsrv = null;
  if (LOKAL) {
    const { Aedes } = require('aedes'); const wsStream = require('websocket-stream');
    broker = await Aedes.createBroker(); bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, broker.handle); await new Promise((r) => bsrv.listen(8892, r));
  }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
  const web = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise((r) => web.listen(8893, r));

  const dev = [
    { name: 'SL am Laptop', eng: 'chromium', opts: { viewport: { width: 1280, height: 800 } } },
    { name: 'Spielerin am iPhone', eng: LOKAL ? 'chromium' : 'webkit', opts: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: 'Spieler am Android', eng: LOKAL ? 'chromium' : 'firefox', opts: { viewport: { width: 412, height: 915 }, hasTouch: true } }
  ];
  const browsers = {};
  for (const d of dev) {
    if (!browsers[d.eng]) browsers[d.eng] = await pw[d.eng].launch();
    d.ctx = await browsers[d.eng].newContext(d.opts);
    await d.ctx.addInitScript(([lokal, server]) => { localStorage.setItem('hb_dice_fx', 'aus'); if (lokal) { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8892'); } else localStorage.setItem('hb_server', server); }, [LOKAL, SERVER]);
    d.p = await d.ctx.newPage(); d.p.on('pageerror', (e) => errs.push(d.name + ': ' + e.message));
    await d.p.goto('http://localhost:8893/'); await d.p.waitForFunction(() => typeof S === 'object' && document.querySelector('#view *'), null, { timeout: 20000 });
    d.version = await browsers[d.eng].version();
  }
  const [SL, P1, P2] = dev;
  T('Engines', true, dev.map((d) => d.name + ': ' + d.eng + ' ' + d.version).join(' · '));
  T('Verschlüsselung verfügbar (crypto.subtle) auf allen Geräten', (await Promise.all(dev.map((d) => d.p.evaluate(() => !!(window.crypto && crypto.subtle))))).every(Boolean));

  const code = 'echttest-' + Math.random().toString(36).slice(2, 10);
  const mk = (d, name, cls) => d.p.evaluate(([n, c]) => { const ch = normChar(newChar({ name: n, cls: c, level: 3 })); S.chars[ch.id] = ch; S.cur = ch.id; persist('c', ch.id); }, [name, cls]);
  await mk(SL, 'Meisterin Vala', 'wiz'); await mk(P1, 'Lyra Iphone', 'rog'); await mk(P2, 'Tor Android', 'fig');
  await SL.p.evaluate((c) => { joinCamp(c); setTimeout(() => saveMeta({ dm: UID }), 1500); }, code);
  await P1.p.evaluate((c) => joinCamp(c), code); await P2.p.evaluate((c) => joinCamp(c), code);
  const seeAll = (names) => Object.values(S.table).map((p) => p.char).filter((n) => names.includes(n)).length === names.length;
  const names = ['Meisterin Vala', 'Lyra Iphone', 'Tor Android'];
  const tSee = await Promise.all(dev.map((d) => until(d.p, seeAll, names, 30000)));
  T('Alle drei Geräte sehen sich gegenseitig', tSee.every((t) => t >= 0), dev.map((d, i) => d.name + ' ' + (tSee[i] >= 0 ? tSee[i] + ' ms' : 'nie')).join(' · '));
  T('Spielleitung erkannt auf beiden Handys', (await Promise.all([P1, P2].map((d) => until(d.p, () => !!(S.meta && S.meta.dm) && !isDM(), null, 15000)))).every((t) => t >= 0));

  /* Würfe */
  await P1.p.evaluate(() => d20(4, 'Probe vom iPhone', { kind: 'check:dex' }));
  const tR1 = await until(SL.p, () => tableRolls().some((r) => /Probe vom iPhone/.test(r.label)), null, 15000);
  const tR2 = await until(P2.p, () => tableRolls().some((r) => /Probe vom iPhone/.test(r.label)), null, 15000);
  T('Wurf vom iPhone kommt bei SL und Android an', tR1 >= 0 && tR2 >= 0, 'SL ' + tR1 + ' ms · Android ' + tR2 + ' ms');
  await P2.p.evaluate(() => { S.share = true; S.secret = true; d20(2, 'Geheimer Wurf Android', { kind: 'check:wis' }); });
  const tS1 = await until(SL.p, () => tableRolls().some((r) => /Geheimer Wurf Android/.test(r.label)), null, 15000);
  await wait(2500);
  const leak = await P1.p.evaluate(() => tableRolls().some((r) => /Geheimer Wurf Android/.test(r.label)) || /Geheimer Wurf Android/.test(document.body.innerText));
  T('Wurf «nur bei der SL»: SL sieht ihn, das iPhone zeigt ihn nicht', tS1 >= 0 && !leak, 'SL ' + tS1 + ' ms');
  await P2.p.evaluate(() => { S.secret = false; });

  /* Rast für alle */
  await Promise.all([P1, P2].map((d) => d.p.evaluate(() => { const ch = cur(); ch.play.hp = 1; commit(); })));
  await SL.p.evaluate(() => XA.grpRest(null, 'long'));
  const tL = await Promise.all([P1, P2].map((d) => until(d.p, () => cur().play.hp > 1, null, 15000)));
  T('Lange Rast der SL heilt beide Handys', tL.every((t) => t >= 0), tL.map((t) => t + ' ms').join(' · '));

  /* Kampf */
  await SL.p.evaluate(() => { S.combat = { id: 'k' + Date.now(), active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 2 }], '', {}); saveCombat(S.combat); S.view = 'camp'; render(); });
  const tC = await Promise.all([P1, P2].map((d) => until(d.p, () => !!(S.combat && S.combat.active && (S.combat.npcs || []).length === 2), null, 15000)));
  T('Kampfstart der SL erscheint auf beiden Handys', tC.every((t) => t >= 0), tC.map((t) => t + ' ms').join(' · '));
  await Promise.all([P1, P2].map((d) => d.p.evaluate(() => { S.view = 'camp'; render(); })));
  await wait(1200);
  for (const d of dev) await d.p.screenshot({ path: path.join(SHOTS, d.eng + '-tisch.png') });

  /* Verbindungsabbruch am iPhone */
  await P1.ctx.setOffline(true); await P1.p.evaluate(() => { try { HBNET.ws && HBNET.ws.close(); } catch (e) {} });
  await wait(6000);
  await SL.p.evaluate(() => d20(1, 'SL würfelt während Funkloch', { kind: 'check:str' }));
  await wait(2000); await P1.ctx.setOffline(false);
  const tO = await until(P1.p, () => tableRolls().some((r) => /Funkloch/.test(r.label)), null, 40000);
  T('iPhone nach Funkloch wieder verbunden, verpasster Wurf kommt an', tO >= 0, tO + ' ms nach Rückkehr');
  await P1.p.evaluate(() => d20(6, 'Wieder da vom iPhone', { kind: 'check:dex' }));
  const tO2 = await until(SL.p, () => tableRolls().some((r) => /Wieder da vom iPhone/.test(r.label)), null, 20000);
  T('… und eigene Würfe gehen wieder raus', tO2 >= 0, tO2 + ' ms');

  /* Neustart eines Handys mitten im Spiel */
  await P2.p.reload(); await P2.p.waitForFunction(() => typeof S === 'object' && document.querySelector('#view *'), null, { timeout: 20000 });
  const tRe = await until(P2.p, (n) => S.camp && Object.values(S.table).some((p) => p.char === n) && !!(S.combat && S.combat.active), 'Meisterin Vala', 30000);
  T('Android nach Neustart: Raum, Mitspieler und laufender Kampf wieder da', tRe >= 0, tRe + ' ms');

  for (const d of dev) await d.p.screenshot({ path: path.join(SHOTS, d.eng + '-ende.png') });
  T('Keine Skriptfehler auf den Geräten', errs.length === 0, errs.slice(0, 5).join(' | ') || null);
  for (const b of Object.values(browsers)) await b.close();
  web.close(); if (bsrv) { bsrv.close(); broker.close(); }
  const bad = out.filter((r) => !r.ok).length; console.log('\n' + (out.length - bad) + ' / ' + out.length + ' bestanden (Server: ' + (LOKAL ? 'lokal' : SERVER) + ')');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('Abbruch:', e.message); process.exit(2); });
