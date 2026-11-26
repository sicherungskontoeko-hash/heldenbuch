/* Vault V1: Kern gegen einen Prüfserver im Speicher (keine Cloud, kein Netz). Prüft V-01, V-02, V-07, V-08, V-10, V-12, V-15,
   V-20 sowie 401/429, falscher Schlüssel, Wiederherstellung auf «neuem Gerät». Aufruf: node tests/vault.test.js */
const V = require('../vault.js'); const crypto = require('crypto');
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 500))); };
/* Prüfserver: speichert nur Chiffrat, Revision und den SHA-256 des Zugangsschlüssels; Fehler lassen sich einspeisen */
function server() {
  const db = {}; const s = { db, calls: 0, fault: null, down: false, log: [] };
  s.api = async (m, path, o = {}) => { s.calls++; if (s.down) throw new Error('offline'); if (s.fault) { const f = s.fault; s.fault = null; return f; }
    const [, , , vid, , oid] = path.split('/'); const h = crypto.createHash('sha256').update(o.auth || '').digest('hex');
    if (m === 'POST') { if (!db[vid]) { db[vid] = { auth: h, obj: {} }; return { status: 201 }; } return db[vid].auth === h ? { status: 200 } : { status: 401 }; }
    const v = db[vid]; if (!v || v.auth !== h) return { status: 401 };
    if (m === 'GET') return { status: 200, body: JSON.parse(JSON.stringify(v.obj)) };
    if (m === 'PUT') { const curRev = v.obj[oid] ? v.obj[oid].rev : 0; if (o.ifMatch !== curRev) return { status: 409, body: { rev: curRev } }; if (o.body.rev !== curRev + 1) return { status: 400 };
      v.obj[oid] = { rev: o.body.rev, box: o.body.box }; s.log.push(JSON.stringify(o.body)); return { status: curRev ? 200 : 201 }; }
    return { status: 405 }; };
  return s;
}
const held = (name, hp) => ({ id: 'c_' + name.toLowerCase(), name, cls: 'wiz', level: 5, play: { hp, slots: { 1: 1 } }, notes: 'Geheime Notiz von ' + name });
(async () => {
  const rec = V.newRecovery();
  T('Wiederherstellungsschlüssel: 26 Zeichen in Vierergruppen, wieder einlesbar', /^([A-Z2-8]{4}-){6}[A-Z2-8]{2}$/.test(rec) && V.fmtRecovery(V.parseRecovery(rec)) === rec, rec);
  let bad = ''; try { V.parseRecovery(rec.slice(0, -1) + 'O'); } catch (e) { bad = e.code; } T('Tippfehler im Schlüssel wird erkannt (nicht still akzeptiert)', bad === 'recovery', bad);
  const S = server(); const A = await new V.Vault({ api: S.api, recovery: rec, debounce: 0 }).init();
  const ilva = held('Ilva', 30), borin = held('Borin', 44);
  A.put('char', ilva.id, ilva); A.put('char', borin.id, borin); A.put('char', ilva.id, Object.assign({}, ilva, { play: { hp: 25, slots: {} } }));
  const n1 = await A.flush();
  T('V-20 Bündeln: drei Änderungen an zwei Helden → zwei Uploads', n1 === 2 && S.log.length === 2, { n1, log: S.log.length });
  const raw = JSON.stringify(S.db);
  T('V-02 Server sieht keinen Klartext (keine Namen, IDs, Notizen, Werte)', !/Ilva|Borin|c_ilva|Geheime|wiz|slots/.test(raw) && Object.keys(S.db).length === 1, raw.slice(0, 200));
  /* V-01 / neues Gerät: nur mit dem Schlüssel wiederherstellen */
  const B = await new V.Vault({ api: S.api, recovery: rec, debounce: 0, validate: (k, d) => (k === 'char' && d && typeof d.name === 'string' && d.play ? null : 'ungültig') }).init();
  const got = await B.pull();
  T('V-01 Neues Gerät stellt beide Helden vollständig her (letzter Stand)', got.items.length === 2 && got.bad.length === 0 && got.items.find((x) => x.id === 'c_ilva').data.play.hp === 25 && got.items.find((x) => x.id === 'c_borin').data.notes === borin.notes, got);
  /* V-10 Konflikt: beide Geräte ändern dieselbe Basis */
  A.put('char', borin.id, Object.assign({}, borin, { play: { hp: 10 } })); await A.flush();
  B.put('char', borin.id, Object.assign({}, borin, { play: { hp: 40 } })); await B.flush();
  const after = await new V.Vault({ api: S.api, recovery: rec, debounce: 0 }).init().then((x) => x.pull());
  T('V-10 Konflikt erkannt, nichts still überschrieben (Stand von A bleibt, B meldet Konflikt mit eigenem Stand)', B.status === 'konflikt' && B.conflicts.length === 1 && B.conflicts[0].mine.play.hp === 40 && after.items.find((x) => x.id === 'c_borin').data.play.hp === 10, { st: B.status, c: B.conflicts });
  /* V-07 offline, V-08 Abbruch */
  S.down = true; A.put('char', ilva.id, Object.assign({}, ilva, { play: { hp: 5 } })); await A.flush();
  T('V-07 Offline: Änderung bleibt in der Warteschlange, Status offline, Wartezeit wächst', A.status === 'offline' && A.q.size === 1 && A.wait >= 2000, { st: A.status, q: A.q.size });
  S.down = false; S.fault = { status: 500 }; await A.flush(); const st500 = A.status;
  const before = S.log.length; await A.flush();
  T('V-08 Serverfehler: nichts verloren, beim nächsten Versuch genau ein Upload (keine Dublette)', st500 === 'später' && A.q.size === 0 && S.log.length === before + 1 && A.status === 'gesichert', { st500, q: A.q.size });
  S.fault = { status: 429, body: { retryMs: 30000 } }; A.put('char', ilva.id, ilva); await A.flush();
  T('429: Rückzug mit vorgegebener Wartezeit, Änderung bleibt', A.status === 'später' && A.wait === 30000 && A.q.size === 1, { st: A.status, w: A.wait });
  await A.flush();
  /* V-12 Manipulation, V-15 falscher Schlüssel */
  const v = S.db[Object.keys(S.db)[0]]; const oid = Object.keys(v.obj)[0]; const keep = JSON.stringify(v.obj[oid]);
  const ct = Buffer.from(v.obj[oid].box.ct, 'base64'); ct[5] ^= 1; v.obj[oid].box.ct = ct.toString('base64');
  const tam = await B.pull(); v.obj[oid] = JSON.parse(keep);
  T('V-12 Verändertes Chiffrat wird abgelehnt und nicht übernommen', tam.bad.length === 1 && /beschädigt/.test(tam.bad[0].why) && tam.items.length === 1, tam.bad);
  const oids = Object.keys(v.obj); const sw = JSON.parse(JSON.stringify(v.obj)); v.obj[oids[0]] = sw[oids[1]]; v.obj[oids[1]] = sw[oids[0]];
  const swp = await B.pull(); v.obj = sw;
  T('Vertauschte Objekte (Umhängen) fallen über die AAD auf', swp.items.length === 0 && swp.bad.length === 2, swp.bad);
  const other = V.newRecovery(); let e401 = '';
  const X = new V.Vault({ api: async (m, p, o) => S.api(m, p.replace(/vault\/[0-9a-f]+/, 'vault/' + Object.keys(S.db)[0]), o), recovery: other, debounce: 0 }); try { await X.init(); } catch (e) { e401 = e.code; }
  T('V-15 Falscher Schlüssel: kein Zugriff auf einen fremden Vault (401)', e401 === 'auth', e401);
  const val = await new V.Vault({ api: S.api, recovery: rec, debounce: 0, validate: (k, d) => (d.play.hp > 40 ? 'TP über Maximum' : null) }).init().then((x) => x.pull());
  T('Wiederherstellung prüft Inhalte vor der Übernahme (Prüffunktion wie importPlan)', val.bad.length === 0 && val.items.length === 2, val);
  S.fault = { status: 401 }; A.put('char', ilva.id, ilva); await A.flush();
  T('401 beim Schreiben: Status gesperrt, Änderung bleibt lokal erhalten', A.status === 'gesperrt' && A.q.size === 1, A.status);
  /* Leistung: 200 Änderungen an 5 Helden, Ver- und Entschlüsselung */
  const P = server(); const W = await new V.Vault({ api: P.api, recovery: V.newRecovery(), debounce: 0 }).init(); const t0 = Date.now();
  for (let i = 0; i < 200; i++) W.put('char', 'c' + (i % 5), Object.assign(held('H' + (i % 5), 30 - (i % 20)), { inv: Array.from({ length: 40 }, (_, k) => ({ n: 'Gegenstand ' + k, qty: 1 })) }));
  await W.flush(); const ms = Date.now() - t0; const bytes = P.log.reduce((a, x) => a + x.length, 0);
  T('V-20 Leistung: 200 Änderungen → 5 Uploads, unter 1 s, Datenmenge klein', P.log.length === 5 && ms < 1000 && bytes < 60000, { uploads: P.log.length, ms, bytes });
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ABBRUCH ' + e.stack); process.exit(1); });
