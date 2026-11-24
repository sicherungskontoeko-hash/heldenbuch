/* Ressourcen: jede Ressource hat eine aufklappbare Erklärung (Merkmal, Talent, Zauber oder Hausregel), Zauberplätze erklären
   die Regel «ein Zauberplatz pro Zug», Stufe «Erfahren» blendet die Erklärungen aus.
   Aufruf: node tests/ressourcen.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); }); await p.goto('file://' + target); await p.waitForTimeout(500);
  const all = await p.evaluate(() => { const miss = []; let n = 0; const seen = new Set(); const mk = (o) => normChar(newChar(Object.assign({ name: 'T' }, o)));
    const check = (ch) => { let c; try { c = derive(ch, S.hb); } catch (e) { return; } c.res.forEach((r) => { if (seen.has(r.k)) return; seen.add(r.k); n++; const i = resInfo(c, r); if (!i || !i.t || i.t.length < 20) miss.push(r.k + ' ' + r.n); }); };
    for (const id of Object.keys(CLASSES)) { const subs = (CLASSES[id].subs || []).map((s) => s.id); for (const sub of subs.length ? subs : ['']) for (const lv of [2, 5, 10, 14, 18, 20]) check(mk({ cls: id, level: lv, sub })); }
    for (const sp of Object.keys(SPECIES)) for (const lv of [1, 5]) check(mk({ cls: 'fig', level: lv, species: sp }));
    return { n, miss }; });
  T('Alle Ressourcen (Klassen, Unterklassen, Spezies) haben eine Erklärung', all.n > 100 && all.miss.length === 0, all);
  await p.evaluate(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; hlSetLevel('std'); render(); });
  const rows = await p.evaluate(() => [...document.querySelectorAll('.res .rs')].map((r) => !!r.querySelector('details.rinf')));
  T('Bogen: jede Ressourcenzeile hat «Was ist das?»', rows.length >= 3 && rows.every(Boolean), rows);
  const slot = await p.evaluate(() => { const d = document.querySelector('.slotrs details.rinf'); return d ? d.textContent : ''; });
  T('Zauberplätze: Erklärung nennt «nur einen Zauberplatz» pro Zug', /nur einen Zauberplatz/.test(slot), slot.slice(0, 120));
  await p.evaluate(() => document.querySelector('.res .rs details.rinf summary').scrollIntoView()); await p.click('.res .rs details.rinf summary');
  const open = await p.evaluate(() => { const d = document.querySelector('.res .rs details.rinf'); const r = d.querySelector('p').getBoundingClientRect(); const row = d.closest('.rs').getBoundingClientRect(); return { open: d.open, h: r.height, w: r.width / row.width }; });
  T('Antippen klappt die Erklärung auf (volle Zeilenbreite)', open.open && open.h > 20 && open.w > 0.9, open);
  await p.evaluate(() => { hlSetLevel('pro'); render(); });
  T('Stufe «Erfahren»: Erklärungen ausgeblendet', await p.evaluate(() => [...document.querySelectorAll('details.rinf')].every((d) => getComputedStyle(d).display === 'none')));
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
