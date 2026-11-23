/* Unterklassen-Bilder: jedes Bild gehört zu einer Unterklasse, erscheint in der Auswahl und gross in der Infokarte; Handy ohne Querscrollen.
   Aufruf: node tests/subpics.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const out = []; const errs = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const [w, h] of [[1280, 900], [320, 568]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    if (w > 400) T('Jedes Bild gehört zu einer Unterklasse', await p.evaluate(() => SUB_PIC.length > 0 && SUB_PIC.every((k) => { const [c, s] = k.split('-'); return CLASSES[c] && (CLASSES[c].subs || []).some((x) => x.id === s); })), await p.evaluate(() => SUB_PIC));
    if (w > 400) T('Alle Unterklassen aller Klassen haben ein Bild', await p.evaluate(() => Object.entries(CLASSES).every(([c, C]) => (C.subs || []).every((x) => SUB_PIC.includes(c + '-' + x.id)))), await p.evaluate(() => Object.entries(CLASSES).flatMap(([c, C]) => (C.subs || []).filter((x) => !SUB_PIC.includes(c + '-' + x.id)).map((x) => c + '-' + x.id))));
    const ck = await p.evaluate(() => SUB_PIC[0].split('-')[0]);
    await p.evaluate((ck) => { localStorage.setItem('hb_dice_fx', 'aus'); const n = normChar(newChar({ name: 'Lio', cls: ck, level: 3 })); S.chars[n.id] = n; S.cur = n.id; S.view = 'build'; S.step = 0; render(); }, ck);
    T(w + ': Auswahl zeigt Bilder', await p.evaluate((ck) => CLASSES[ck].subs.filter((s) => SUB_PIC.includes(ck + '-' + s.id)).every((s) => { const e = document.querySelector('.opt.haspic[data-val="' + s.id + '"] .opic'); return e && getComputedStyle(e).backgroundImage.startsWith('url') && e.getBoundingClientRect().width >= 60; }), ck));
    T(w + ': kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const sid = await p.evaluate(() => SUB_PIC[0].split('-')[1]);
    await p.evaluate((sid) => document.querySelector('.opt[data-val="' + sid + '"] .ii').click(), sid); await p.waitForTimeout(150);
    T(w + ': Infokarte zeigt das Bild gross', await p.evaluate(() => { const e = document.querySelector('.infodlg .ipic.ipic-sub'); return !!e && getComputedStyle(e).backgroundImage.startsWith('url') && e.getBoundingClientRect().height > 120; }));
    await p.close();
  }
  T('Keine Skriptfehler', !errs.length, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
