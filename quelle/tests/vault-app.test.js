/* Vault V2 in der App: zwei Browserprofile (Tablet, Handy) gegen den lokalen Prüfserver über HTTP.
   Simuliert: zwei Geräte = zwei getrennte Chromium-Kontexte. Nicht geprüft: echte Geräte, echter Dienst.
   Aufruf: node tests/vault-app.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const { createMock, serve } = require('../tools/vault-mock.js');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
(async () => {
  const dir = path.dirname(target);
  const web = require('http').createServer((rq, rs) => { const f = path.join(dir, decodeURIComponent(rq.url.split('?')[0])); if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); } rs.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); fs.createReadStream(f).pipe(rs); });
  await new Promise((r) => web.listen(8906, '127.0.0.1', r)); const M = createMock(); const api = serve(M, 8921);
  const URL = 'http://127.0.0.1:8906/' + path.basename(target); const b = await chromium.launch(); const errs = []; const reqs = [];
  const dev = async (name, vault) => { const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }); await ctx.addInitScript((v) => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); window.__hbWelcomeTest = true; if (v) localStorage.setItem('hb_vault_dev', 'http://127.0.0.1:8921'); }, vault);
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('request', (r) => { if (r.url().includes(':8921')) reqs.push({ name, url: r.url(), auth: r.headers().authorization || '', body: r.postData() || '' }); });
    await p.goto(URL); await p.waitForTimeout(900); await p.evaluate(() => { if (S.modal) { S.modal = null; $('#modal').hidden = true; } S.view = 'heroes'; render(); }); return p; };
  /* V-01 Ohne Dienst: kein Knopf, kein Netzverkehr, App läuft */
  const C = await dev('Ohne', false); const c0 = M.calls;
  const r01 = await C.evaluate(() => { const a = sampleChar(); a.name = 'Lokal'; S.chars[a.id] = a; persist('c', a.id); render(); return { btn: !!document.querySelector('[data-act="vOpen"]'), n: Object.keys(S.chars).length, ls: localStorage.getItem('hb_vault') }; });
  await C.waitForTimeout(400);
  T('V-01 Ohne eingerichteten Dienst: kein Vault-Knopf, kein Netzverkehr, Speichern wie bisher', !r01.btn && r01.n >= 1 && r01.ls === null && M.calls === c0 && !reqs.some((r) => r.name === 'Ohne'), r01);
  /* Tablet aktiviert */
  const A = await dev('Tablet', true);
  const idA = await A.evaluate(() => { const a = sampleChar(); a.name = 'Ilvarah'; a.notes = 'Geheimes Versteck im Turm'; S.chars = { [a.id]: a }; S.cur = a.id; persist('c', a.id); render(); return a.id; });
  T('Vault-Knopf auf «Deine Helden», ohne Aufdringlichkeit (aus bis zur Aktivierung)', (await A.textContent('[data-act="vOpen"]')).trim() === 'Vault …' && (await A.evaluate(() => localStorage.getItem('hb_vault'))) === null && M.calls === c0);
  await A.click('[data-act="vOpen"]'); await A.fill('#vName', 'Tablet'); await A.click('[data-act="vCreate"]'); await A.waitForSelector('.vkey');
  const key = (await A.textContent('.vkey')).trim(); const lsA = await A.evaluate(() => localStorage.getItem('hb_vault'));
  T('V-02 Aktivieren: Schlüssel einmal angezeigt, nicht gespeichert (Gerät hält nur Zugang)', /^([A-Z2-8]{4}-){6}[A-Z2-8]{2}$/.test(key) && !lsA.includes(key) && !lsA.includes(key.replace(/-/g, '')), key);
  await A.click('[data-act="vKeyDone"]'); await A.evaluate(() => vaultSync());
  T('V-02 Erste Sicherung: Status «Gesichert» im Dialog und in der Speicheranzeige', /Gesichert/.test(await A.textContent('.vdlg')) && /Vault: Gesichert/.test(await A.evaluate(() => (document.querySelector('#saveState') || {}).textContent || '')) && Object.keys(Object.values(M.db)[0].obj).length === 1);
  const exp = await A.evaluate(() => exportData(Object.values(S.chars), true)); const stA = JSON.parse(lsA);
  T('V-12 «Alles sichern» enthält keinen Vault-Zugang oder Datenschlüssel', !exp.includes(stA.tok) && !exp.includes(stA.enc) && !/hb_vault/.test(exp));
  /* Handy koppelt */
  await A.click('[data-act="vPair"]'); await A.waitForSelector('.vkey'); const code = (await A.textContent('.vkey')).trim();
  const B = await dev('Handy', true); await B.click('[data-act="vOpen"]'); await B.fill('#vCode', code); await B.click('[data-act="vJoin"]'); await B.waitForTimeout(600);
  const rB = await B.evaluate((id) => ({ has: !!S.chars[id], name: S.chars[id] && S.chars[id].name, vorher: !!localStorage.getItem('hb_vault_vorher'), st: VLT.status, hero: document.body.textContent.includes('Ilvarah') }), idA);
  T('V-03 Handy über Kopplungscode: Held da, angezeigt, vorher lokale Sicherung angelegt', rB.has && rB.name === 'Ilvarah' && rB.vorher && rB.st === 'gesichert' && rB.hero, rB);
  /* Handy spielt, Tablet übernimmt */
  await B.evaluate((id) => { const c = S.chars[id]; c.play.hp = 3; c.notes += ' · Drache'; persist('c', id); return vaultSync(); }, idA);
  await A.evaluate(() => vaultSync()); await A.waitForTimeout(300);
  const same = await Promise.all([A, B].map((p) => p.evaluate((id) => JSON.stringify(S.chars[id]), idA)));
  T('V-03 Tablet übernimmt den Stand des Handys exakt', same[0] === same[1] && JSON.parse(same[0]).play.hp === 3, JSON.parse(same[0]).play);
  /* V-04 Konflikt im UI */
  M.down = true;
  await A.evaluate((id) => { S.chars[id].play.hp = 9; persist('c', id); return vaultSync(); }, idA); await B.evaluate((id) => { S.chars[id].play.hp = 1; persist('c', id); return vaultSync(); }, idA);
  const offTxt = await B.evaluate(() => vaultLabel()); M.down = false;
  await A.evaluate(() => vaultSync()); await B.evaluate(() => vaultSync()); await B.waitForTimeout(300);
  await B.evaluate(() => { if (S.modal) XA.vClose(); }); await B.click('[data-act="vOpen"]');
  const cfx = await B.evaluate(() => ({ n: document.querySelectorAll('.vconf').length, txt: (document.querySelector('.vconf') || {}).textContent || '', toast: document.querySelector('#mini').textContent }));
  T('V-04 Offline-Status ehrlich, danach Konflikt mit beiden Ständen im Dialog, Hinweis eingeblendet', offTxt === 'Offline – lokale Änderungen' && cfx.n === 1 && /TP 1/.test(cfx.txt) && /TP 9/.test(cfx.txt) && /Konflikt/.test(cfx.toast), { offTxt, cfx });
  await B.click('[data-act="vRes"][data-arg$="|both"]'); await B.waitForTimeout(300); await A.evaluate(() => vaultSync()); await A.waitForTimeout(300);
  const nA = await A.evaluate(() => Object.values(S.chars).map((c) => c.name + ':' + c.play.hp).sort()); const nB = await B.evaluate(() => Object.values(S.chars).map((c) => c.name + ':' + c.play.hp).sort());
  T('V-04 «Beide behalten»: Handy-Stand und Tablet-Stand als Kopie auf beiden Geräten', JSON.stringify(nA) === JSON.stringify(nB) && nA.includes('Ilvarah:1') && nA.includes('Ilvarah (anderes Gerät):9'), { nA, nB });
  /* V-13 Verlauf im Dialog */
  await A.evaluate(() => { if (S.modal) XA.vClose(); }); await A.click('[data-act="vOpen"]'); await A.click('[data-act="vHist"][data-arg="' + idA + '"]'); await A.waitForSelector('.stl li');
  const nh = await A.evaluate(() => document.querySelectorAll('.stl li').length);
  T('V-13 Frühere Stände im Dialog sichtbar (mit Zurückholen)', nh >= 3 && (await A.$$('[data-act="vRestore"]')).length >= 2, nh);
  /* V-11 Gerät entfernen im Dialog → Handy gesperrt, lokale Daten bleiben */
  await A.click('[data-act="vDevs"]'); await A.waitForSelector('[data-act="vRevoke"]'); await A.click('[data-act="vRevoke"]'); await A.click('button[data-ok="1"]'); await A.waitForTimeout(500);
  const devN = await A.evaluate(() => (VLT_DEVS || []).length); const dlgOpen = await A.evaluate(() => !!document.querySelector('.vdlg'));
  await B.evaluate((id) => { S.chars[id].play.hp = 2; persist('c', id); return vaultSync(); }, idA);
  const rr = await B.evaluate((id) => ({ st: vaultLabel(), hp: S.chars[id].play.hp }), idA);
  T('V-11 Gerät im Dialog entfernt (Bestätigung, Dialog bleibt): Handy meldet Fehler, behält lokale Änderung', devN === 1 && dlgOpen && /Fehler/.test(rr.st) && rr.hp === 2, { devN, dlgOpen, rr });
  /* V-12 Netzwerkdaten */
  const leak = reqs.filter((r) => /Ilvarah|Turm|Drache|Tablet|Handy/.test(r.url + r.body) || /[0-9a-f]{64}/.test(r.url));
  T('V-12 Netzwerk: keine Namen/Notizen/Gerätenamen, Zugang nur im Header, nie in der URL', reqs.length > 10 && !leak.length && reqs.filter((r) => r.auth).every((r) => /^FCV [0-9a-f]{32}:[0-9a-f]{64}$/.test(r.auth)), leak.slice(0, 2));
  /* V-22 Löschen mit Eintippen */
  await A.fill('#vDel', 'nein'); await A.click('[data-act="vDestroy"]'); const still = Object.keys(M.db).length;
  await A.fill('#vDel', 'LÖSCHEN'); await A.click('[data-act="vDestroy"]'); await A.waitForTimeout(400);
  const after = await A.evaluate(() => ({ on: vaultOn(), n: Object.keys(S.chars).length, btn: (document.querySelector('[data-act="vOpen"]') || {}).textContent }));
  T('V-22 Löschen nur nach «LÖSCHEN»: danach Vault weg, Helden lokal erhalten', still === 1 && Object.keys(M.db).length === 0 && !after.on && after.n === 2 && after.btn === 'Vault …', { still, after });
  T('Keine Skriptfehler', !errs.length, errs);
  await b.close(); web.close(); api.close();
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ABBRUCH ' + e.stack); process.exit(1); });
