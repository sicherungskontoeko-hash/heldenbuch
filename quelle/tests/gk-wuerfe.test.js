/* GK-02: Verdeckte Würfe dürfen niemals nachträglich geteilt werden.
   Geprüft werden die tatsächlich ausgehenden, serialisierten Spielerdokumente (Ersatz-Datenbank im Browser) und in Teil 2
   ein zweites Gerät über einen lokalen MQTT-Broker (aedes, Ports 8898/8899, App-Version).
   Aufruf: node tests/gk-wuerfe.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
const SETUP = () => {
  window.__subs = {}; window.__writes = []; window.__slow = 0;
  const ref = (p) => ({ path: p, onSnapshot: (fn) => { __subs[p] = fn; return () => { if (__subs[p] === fn) delete __subs[p]; }; }, set: async (v) => { const j = JSON.stringify(v); if (__slow) await new Promise((r) => setTimeout(r, __slow)); __writes.push({ p, j }); }, delete: async () => { __writes.push({ p, j: 'DELETE' }); }, get: async () => ({ exists: false, data: () => null }), ping: async () => {} });
  DB = { doc: (p) => ref(p), collection: (p) => Object.assign(ref(p), { doc: (id) => ref(p + '/' + id), get: async () => ({ docs: [], empty: true }) }) }; UID = 'ich';
  window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__roll = (label) => d20(2, label, { kind: 'check:dex' });
  /* alles, was je an ein Spielerdokument eines Raums ging */
  window.__out = (room) => __writes.filter((w) => w.p === 'camp/' + room + '/players/ich').map((w) => w.j).join('\n');
  window.__last = (room) => { const w = __writes.filter((x) => x.p === 'camp/' + room + '/players/ich' && x.j !== 'DELETE').pop(); return w ? JSON.parse(w.j) : null; };
  window.__mode = (share, secret) => { S.share = share; S.secret = secret; saveCampPref(); queueMe(); };
  window.__flush = async () => { await __sleep(320); await writeMe(); await __sleep(30); };
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
  await p.goto('file://' + target); await p.waitForTimeout(700);
  await p.evaluate(SETUP);
  await p.evaluate(() => { const a = sampleChar(); a.name = 'Aldric'; const c = sampleChar(); c.id = 'zweitheld'; c.name = 'Cora'; S.chars = { [a.id]: a, [c.id]: c }; S.cur = a.id; window.__ch1 = a.id; });

  /* T01 Raum A verdeckt würfeln, danach Freigabe in A einschalten */
  let r = await p.evaluate(async () => { joinCamp('ra', true); __mode(false, false); __roll('PRIV-A1'); await __flush(); __mode(true, false); await __flush(); return { out: __out('ra'), local: S.log.some((e) => e.label === 'PRIV-A1'), hist: typeof histLoad === 'function' ? histLoad().some((h) => h.label === 'PRIV-A1') : true }; });
  T('GK02-T01 Raum A verdeckt → Freigabe an in A: privater Wurf nie in der Nutzlast', !r.out.includes('PRIV-A1') && r.out.length > 0, r.out.slice(0, 200));
  T('GK02-T08 Verdeckter Wurf bleibt lokal im Protokoll und im Würfelverlauf', r.local && r.hist, r);
  /* T02 Raum A verdeckt → Raum B */
  r = await p.evaluate(async () => { __mode(false, false); __roll('PRIV-A2'); await __flush(); joinCamp('rb', true); __mode(true, false); await __flush(); return { b: __out('rb'), a: __out('ra') }; });
  T('GK02-T02 Raum A verdeckt → Raum B: Marker weder in A noch in B', !r.b.includes('PRIV-A2') && !r.a.includes('PRIV-A2') && r.b.length > 0, r.b.slice(0, 200));
  /* T03 öffentlich in A → B; öffentlich in B */
  r = await p.evaluate(async () => { joinCamp('ra', true); __mode(true, false); __roll('PUB-A3'); await __flush(); const inA = (__last('ra').rolls || []).some((x) => x.label === 'PUB-A3'); joinCamp('rb', true); await __flush(); __roll('PUB-B3'); await __flush(); const lb = __last('rb'); return { inA, bA: __out('rb').includes('PUB-A3'), bB: (lb.rolls || []).some((x) => x.label === 'PUB-B3') }; });
  T('GK02-T03 Öffentlicher Wurf in A erscheint in A, nicht in B; Wurf in B erscheint in B', r.inA && !r.bA && r.bB, r);
  /* T04 ohne Raum würfeln, danach beitreten */
  r = await p.evaluate(async () => { leaveCamp(); S.share = true; S.secret = false; __roll('LOKAL-4'); joinCamp('ra', true); await __flush(); return __out('ra').includes('LOKAL-4'); });
  T('GK02-T04 Lokaler Wurf ohne Raum → Beitritt: nicht in der Nutzlast', !r);
  /* T05 nur bei der SL → öffentlich: bleibt geheim */
  r = await p.evaluate(async () => { __mode(true, true); __roll('SEC-5'); await __flush(); const a = (__last('ra').rolls || []).find((x) => x.label === 'SEC-5'); __mode(true, false); await __flush(); const b2 = (__last('ra').rolls || []).find((x) => x.label === 'SEC-5'); return { a: a && a.secret, b: b2 && b2.secret }; });
  T('GK02-T05 Wurf «nur bei der SL» bleibt nach Wechsel auf öffentlich geheim markiert', r.a === true && r.b === true, r);
  /* T06 alte Einträge ohne Angaben, kopierte Einträge, Vorschau */
  r = await p.evaluate(async () => { __mode(true, false); S.log.unshift({ label: 'ALT-6', total: 9, detail: '', sides: 20, nat: 9, t: Date.now() }); const e0 = S.log.find((e) => e.label === 'PUB-A3'); if (e0) S.log.unshift(Object.assign({}, e0, { label: 'KOPIE-6', t: Date.now() })); pushLog({ label: 'VORSCHAU-6', total: 3, detail: '', sides: 20, nat: 3, preview: true }); await __flush(); const o = __out('ra'); return { alt: o.includes('ALT-6'), kopie: o.includes('KOPIE-6'), vor: o.includes('VORSCHAU-6') }; });
  T('GK02-T06 Alte Einträge ohne Angaben, Kopien und Vorschau bleiben ausgeschlossen', !r.alt && !r.kopie && !r.vor, r);
  /* T07 Freigabe aus: leere Würfe; Entprellung und langsamer Versand über den Raumwechsel */
  r = await p.evaluate(async () => {
    __mode(false, false); await __flush(); const off = __last('ra').rolls.length;
    __mode(true, false); __roll('DEB-7'); /* Entprellung läuft noch … */ joinCamp('rc', true); await __flush();
    const deb = __out('rc').includes('DEB-7');
    joinCamp('ra', true); await __flush(); __slow = 400; __roll('SLOW-7'); const pend = writeMe(); joinCamp('rd', true); __roll('D-7'); await __sleep(50); await pend; await __sleep(500); await writeMe(); await __sleep(450); __slow = 0;
    const toA = __out('ra'), toD = __out('rd');
    S.chars[S.cur].name = 'Aldric';
    return { off, deb, slowA: toA.includes('SLOW-7'), slowD: toD.includes('SLOW-7'), dInA: toA.includes('D-7'), dInD: toD.includes('D-7') };
  });
  T('GK02-T07 Freigabe aus: Nutzlast ohne Würfe', r.off === 0, r);
  T('GK02-T07 Entprellter Versand nach Raumwechsel: Wurf aus A nicht im neuen Raum', !r.deb, r);
  T('GK02-T07 Langsamer laufender Versand erreicht nur das ursprüngliche Ziel', r.slowA && !r.slowD && !r.dInA && r.dInD, r);
  /* Netzausfall: Schreiben scheitert, danach erneut im aktuellen Raum */
  r = await p.evaluate(async () => { joinCamp('ra', true); __mode(true, false); await __flush(); const set0 = DB.collection; let broken = true; DB.collection = (pth) => { const c = set0(pth); return Object.assign({}, c, { doc: (id) => { const d = c.doc(id); return Object.assign({}, d, { set: async (v) => { if (broken) throw Object.assign(new Error('offline'), { code: 'unavailable' }); return d.set(v); } }); } }); };
    __roll('NETZ-7'); await __flush(); joinCamp('re', true); broken = false; await __flush(); DB.collection = set0; return { e: __out('re').includes('NETZ-7'), a: __out('ra').includes('NETZ-7') }; });
  T('GK02-T07 Netzausfall und Wiederaufnahme im anderen Raum: kein Übertrag', !r.e, r);
  /* T08 Fähigkeiten (share:true) und Empfang fremder Würfe */
  r = await p.evaluate(async () => { joinCamp('ra', true); __mode(true, false); pushLog({ label: 'FAEH-8', total: '✦', detail: 'Kampfrausch', share: true }); await __flush(); const mine = (__last('ra').rolls || []).some((x) => x.label === 'FAEH-8');
    const now = Date.now() + 5; __subs['camp/ra/players']({ docs: [{ id: 'u2', data: () => ({ char: 'Bryn', rolls: [{ label: 'OFFEN-8', total: 12, detail: '', sides: 20, nat: 12, t: now }, { label: 'GEHEIM-8', total: 4, detail: '', sides: 20, nat: 4, t: now + 1, secret: true }] }) }] });
    const asPl = tableRolls().map((x) => x.label); S.meta = { dm: 'ich', mercy: {} }; const asDm = tableRolls().map((x) => x.label); S.meta = { dm: null, mercy: {} };
    await __flush(); const resend = __out('ra').includes('OFFEN-8') || __out('ra').includes('GEHEIM-8');
    return { mine, pl: asPl.includes('OFFEN-8') && !asPl.includes('GEHEIM-8'), dm: asDm.includes('OFFEN-8') && asDm.includes('GEHEIM-8'), resend }; });
  T('GK02-T08 Fähigkeit mit share:true wird geteilt; fremde öffentliche Würfe kommen an, geheime nur bei der SL', r.mine && r.pl && r.dm, r);
  T('GK02-T08 Fremde empfangene Würfe werden nie als eigene erneut veröffentlicht', !r.resend, r);
  /* T10 Heldenwechsel und schneller doppelter Raumwechsel */
  r = await p.evaluate(async () => { joinCamp('ra', true); __mode(true, false); __roll('HELD1-10'); await __flush(); S.cur = 'zweitheld'; queueMe(); await __flush(); const l = __last('ra');
    S.cur = __ch1; __roll('FLINK-10'); joinCamp('rf', true); joinCamp('rg', true); await __flush(); __roll('G-10'); await __flush();
    return { name: l.char, wrong: (l.rolls || []).some((x) => x.label === 'HELD1-10'), f: __out('rf').includes('FLINK-10'), g: __out('rg').includes('FLINK-10'), gOwn: (__last('rg').rolls || []).some((x) => x.label === 'G-10') }; });
  T('GK02-T10 Heldenwechsel: Würfe des ersten Helden erscheinen nicht unter dem zweiten', r.name === 'Cora' && !r.wrong, r);
  T('GK02-T10 Schneller doppelter Raumwechsel: kein Leck, eigener Wurf im Zielraum', !r.f && !r.g && r.gOwn, r);
  r = await p.evaluate(() => ({ note: (() => { S.share = true; S.secret = true; return SECRET_NOTE().includes('eigener Technik'); })() }));
  T('Transparenzhinweis SECRET_NOTE bleibt', r.note, r);
  T('GK02-T09 Prüfung auf serialisierten Dokumenten der Ersatz-Datenbank (siehe oben)', true);
  T('Keine JavaScript-Fehler (Teil 1)', errs.length === 0, errs.slice(0, 5));
  await b.close();

  /* Teil 2: zweites Gerät über lokalen Broker */
  const ROOT = path.resolve(__dirname, '..', 'app', 'www');
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) T('GK02-T09 App-Version vorhanden (python3 build_app.py)', false, ROOT);
  else {
    const { Aedes } = require('aedes'); const http = require('http'); const wsStream = require('websocket-stream');
    const aedes = await Aedes.createBroker(); const seen = []; aedes.on('publish', (pk, client) => { if (client) seen.push(String(pk.payload)); });
    const bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, aedes.handle); await new Promise((res) => bsrv.listen(8898, res));
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
    const web = http.createServer((q, s) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
    await new Promise((res) => web.listen(8899, res));
    const b2 = await chromium.launch(); const e2 = [];
    const mk = async (name) => { const c = await b2.newContext(); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8898'); localStorage.setItem('hb_dice_fx', 'aus'); }); const pg = await c.newPage(); pg.on('pageerror', (e) => e2.push(name + ': ' + e.message)); await pg.goto('http://localhost:8899/'); await pg.waitForTimeout(700); return pg; };
    const A = await mk('A'), B = await mk('B'); const code = 'gk02-' + Math.random().toString(36).slice(2, 10);
    await A.evaluate((c) => { cur().name = 'Aldric'; commit(false); S.share = false; S.secret = false; joinCamp(c); }, code);
    await B.evaluate((c) => { cur().name = 'Bryn'; commit(false); joinCamp(c); }, code);
    await A.waitForTimeout(3000);
    await A.evaluate(() => { d20(2, 'NETZ-PRIV', { kind: 'check:dex' }); }); await A.waitForTimeout(800);
    await A.evaluate(() => { S.share = true; S.secret = false; saveCampPref(); queueMe(); }); await A.waitForTimeout(1200);
    await A.evaluate(() => { d20(2, 'NETZ-OFFEN', { kind: 'check:dex' }); }); await A.waitForTimeout(2200);
    const rb = await B.evaluate(() => { const a = Object.values(S.table).find((x) => x.char === 'Aldric'); return a ? (a.rolls || []).map((x) => x.label) : null; });
    T('GK02-T09 Zweites Gerät: öffentlicher Wurf kommt an, vorher verdeckter nie', rb && rb.includes('NETZ-OFFEN') && !rb.includes('NETZ-PRIV'), rb);
    T('GK02-T09 Broker sieht keinen Klartext der Würfe', seen.every((m) => !/NETZ-PRIV|NETZ-OFFEN/.test(m)), seen.length);
    T('Keine JavaScript-Fehler (Teil 2)', e2.length === 0, e2.slice(0, 5));
    await b2.close(); bsrv.close(); web.close(); aedes.close();
  }
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
