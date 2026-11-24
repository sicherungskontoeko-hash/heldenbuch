/* Lesbarkeit in allen Stimmungen: Text- und Akzentfarben erreichen 4,5:1 (WCAG AA) auf Hintergrund, Fläche und erhöhter Fläche,
   Knopftext auf Akzentfläche ebenso. Gemessen an den tatsächlich gesetzten CSS-Variablen. Aufruf: node tests/kontrast.test.js */
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.waitForTimeout(500);
  const res = await p.evaluate(() => {
    const out = [];
    for (const k of Object.keys(THEMES)) {
      document.documentElement.dataset.theme = k; const cs = getComputedStyle(document.documentElement); const v = (n) => cs.getPropertyValue('--' + n).trim();
      const grounds = ['bg', 'surface', 'raised'].map(v).filter(Boolean); const bad = [];
      for (const f of ['ink', 'muted', 'gold-t', 'wine-t', 'moss', 'arcane']) { const c = v(f); if (!c) { bad.push(f + ' fehlt'); continue; } for (const g of grounds) { const r = contrast(c, g); if (r < 4.5) bad.push(f + ' auf ' + g + ': ' + r.toFixed(2)); } }
      const r = contrast(v('gold-ink'), v('gold')); if (r < 4.5) bad.push('Knopftext auf Akzent: ' + r.toFixed(2));
      out.push({ k, bad });
    }
    return out;
  });
  let ok = 0; for (const r of res) { const pass = !r.bad.length; console.log((pass ? '✔ ' : '✘ ') + 'Stimmung ' + r.k + (pass ? '' : ': ' + r.bad.join(' · '))); if (pass) ok++; }
  if (errs.length) console.log('✘ Skriptfehler: ' + errs.join(' | '));
  console.log(ok + ' / ' + res.length + ' bestanden'); await b.close(); process.exit(ok === res.length && !errs.length ? 0 : 1);
})();
