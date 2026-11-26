/* Befunde der unabhängigen Prüfung 1.9.68 (berichte/AUDIT_1.9.68_UMSETZUNG.md): FC68-01 Mehrtab, FC68-06 Wandelgestalt,
   FC68-07 Hausregel-ID beim Import, FC68-08 Würfelausdruck. Zwei echte Tabs (gleicher Speicher) über lokalen HTTP-Server.
   Aufruf: node tests/audit68.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
(async () => {
  const dir = path.dirname(target);
  const web = require('http').createServer((rq, rs) => { const f = path.join(dir, decodeURIComponent(rq.url.split('?')[0])); if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); } rs.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(rs); });
  await new Promise((r) => web.listen(8907, '127.0.0.1', r)); const URL = 'http://127.0.0.1:8907/' + path.basename(target);
  const b = await chromium.launch(); const ctx = await b.newContext(); const errs = [];
  await ctx.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); window.__hbWelcomeTest = true; });
  const tab = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(URL); await p.waitForTimeout(800); await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; }); return p; };
  const A = await tab();
  const id = await A.evaluate(() => { const a = sampleChar(); a.name = 'Ilva'; a.notes = ''; S.chars = { [a.id]: a }; S.cur = a.id; persist('c', a.id); return a.id; });
  const B = await tab(); await B.waitForTimeout(300);
  const typeIn = (p) => p.evaluate(() => { let i = document.getElementById('__typ'); if (!i) { i = document.createElement('input'); i.id = '__typ'; i.type = 'text'; document.body.appendChild(i); } i.focus(); });
  const stored = (p) => p.evaluate((id) => JSON.parse(localStorage.getItem('heldenbuch')).chars[id], id);
  /* FC68-01a: verschiedene Felder */
  await typeIn(A); await B.evaluate((id) => { S.chars[id].notes = 'Andere Änderung'; persist('c', id); }, id); await A.waitForTimeout(300);
  await A.evaluate((id) => { S.chars[id].name = 'A lokal'; persist('c', id); }, id); await A.waitForTimeout(200);
  let s = await stored(A);
  T('FC68-01 Zwei Tabs, verschiedene Felder: beide Änderungen bleiben (Name hier, Notiz dort)', s.name === 'A lokal' && s.notes === 'Andere Änderung', { name: s.name, notes: s.notes });
  /* FC68-01b: gleiches Feld → hier gilt, dort als Kopie */
  await B.reload(); await B.waitForTimeout(700);
  await typeIn(A); await B.evaluate((id) => { S.chars[id].notes = 'Notiz B'; persist('c', id); }, id); await A.waitForTimeout(300);
  await A.evaluate((id) => { S.chars[id].notes = 'Notiz A'; persist('c', id); }, id); await A.waitForTimeout(200);
  const all = await A.evaluate(() => Object.values(JSON.parse(localStorage.getItem('heldenbuch')).chars).map((c) => c.name + '|' + c.notes));
  T('FC68-01 Gleiches Feld in zwei Tabs: hier gilt, Stand des anderen Tabs als Kopie erhalten, Hinweis', all.includes('A lokal|Notiz A') && all.some((x) => /anderer Tab\)\|Notiz B$/.test(x)) && /zwei Tabs/.test(await A.textContent('#mini')), all);
  /* FC68-01c: Löschen während Bearbeitung → bleibt, Hinweis */
  await B.reload(); await B.waitForTimeout(700);
  await typeIn(A); await B.evaluate((id) => { delete S.chars[id]; persist('c', id); }, id); await A.waitForTimeout(300);
  await A.evaluate((id) => { S.chars[id].play.hp = 1; persist('c', id); }, id); await A.waitForTimeout(200); s = await stored(A);
  T('FC68-01 In anderem Tab gelöscht, hier bearbeitet: Held bleibt mit eigener Änderung, Hinweis', s && s.play.hp === 1 && /anderen Tab gelöscht/.test(await A.textContent('#mini')), s && s.play.hp);
  /* FC68-01d: Tippen beendet → Änderung des anderen Tabs sofort übernommen */
  await B.reload(); await B.waitForTimeout(700);
  await typeIn(A); await B.evaluate((id) => { S.chars[id].play.hp = 7; persist('c', id); }, id); await A.waitForTimeout(300);
  await A.evaluate(() => document.getElementById('__typ').blur()); await A.waitForTimeout(200);
  T('FC68-01 Nach dem Tippen: Stand des anderen Tabs ohne weiteres Speichern übernommen', (await A.evaluate((id) => S.chars[id].play.hp, id)) === 7 && (await stored(A)).play.hp === 7);
  /* FC68-06 */
  const f6 = await A.evaluate(() => { const out = {}; for (const lv of [1, 11, 17, 20]) { const c = sampleChar(); c.cls = 'hxform'; c.level = lv; c.multi = []; c.play.hxForms = ['Klinge', 'Panzer', 'Greifer', 'Sehne', 'Flügel', 'Klinge', 'Gift']; normChar(c); out[lv] = c.play.hxForms || []; }
    const m = sampleChar(); m.play.hxForms = ['Sehne']; normChar(m); out.fremd = m.play.hxForms || []; return out; });
  T('FC68-06 Wandelgestalt bereinigt: 1 Form (Stufe 1), 2 (ab 11), Flügel erst ab 17, 3 auf 20, nichts ohne Formwandler', f6[1].length === 1 && f6[11].length === 2 && !f6[11].includes('Flügel') && f6[17].length === 2 && f6[20].length === 3 && f6[20].includes('Flügel') === false && !f6.fremd.length, f6);
  /* FC68-07 */
  const f7 = await A.evaluate(() => { const k = Object.keys(HB_KIND)[0]; const orig = { id: 'hKoll', kind: k, name: 'Original', text: 'alt' }; S.hb.hKoll = orig; persist('h', 'hKoll');
    const c = sampleChar(); c.name = 'Mit Verweis'; c.homebrew = ['hKoll']; const fremd = { id: 'hKoll', kind: k, name: 'Fremd', text: 'neu' };
    importJson(JSON.stringify({ heldenbuch: 1, chars: [c], hb: [fremd] })); const nh = Object.values(S.hb).find((h) => h.name === 'Fremd (importiert)'); const nc = Object.values(S.chars).find((x) => x.name === 'Mit Verweis');
    const n0 = Object.keys(S.hb).length; importJson(JSON.stringify({ heldenbuch: 1, chars: [], hb: [orig], extra: {} }));
    return { orig: S.hb.hKoll.name, nh: nh && nh.id, ref: nc && nc.homebrew, same: Object.keys(S.hb).length === n0 }; });
  T('FC68-07 Hausregel mit gleicher ID: Original bleibt, Fremde als Kopie mit neuer ID, Heldenverweis umgestellt; identische nicht doppelt', f7.orig === 'Original' && f7.nh && f7.nh !== 'hKoll' && f7.ref && f7.ref.includes(f7.nh) && !f7.ref.includes('hKoll') && f7.same, f7);
  /* FC68-08 */
  const f8 = await A.evaluate(() => { const big = rollExpr('9'.repeat(400)); const many = rollExpr(Array(500).fill('1').join('+')); const ok = rollExpr('2W6+3'); return { big: big.total, many: many.total, ok: ok.total >= 5 && ok.total <= 15 }; });
  T('FC68-08 Würfelausdruck: endliche Werte, begrenzte Termzahl, gültige Ausdrücke unverändert', Number.isFinite(f8.big) && f8.big <= 1e6 && f8.many === 40 && f8.ok, f8);
  T('Keine Skriptfehler', !errs.length, errs);
  await b.close(); web.close(); console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ABBRUCH ' + e.stack); process.exit(1); });
