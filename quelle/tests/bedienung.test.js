/* Bedienung ohne Maus und im Querformat: Mit der Tab-Taste erreicht man Reiter, Bogen und Würfelknöpfe, jedes erreichte
   Element zeigt einen sichtbaren Fokus; Enter löst Knöpfe aus. Im Querformat (Handy liegend) läuft keine Ansicht seitlich über.
   Aufruf: node tests/bedienung.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  { const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); }); await p.goto('file://' + target); await p.waitForTimeout(600);
    for (const [v, g] of [['sheet', 'kampf'], ['sheet', 'werte'], ['heroes'], ['spells'], ['camp']]) {
      await (p.evaluate(([v, g]) => { const ch = sampleChar(); S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = v; if (g) S.mg = g; S.camp = ''; S.combat = null; render(); window.scrollTo(0, 0); }, [v, g]));
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      const seen = []; const noFocus = [];
      for (let i = 0; i < 45; i++) { await p.keyboard.press('Tab');
        const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
          const vis = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
          return { k: e.tagName + (e.dataset.act ? '[' + e.dataset.act + ']' : '') + ' «' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24) + '»', vis, w: r.width, h: r.height }; });
        if (!f) continue; seen.push(f.k); if (!f.vis || !f.w || !f.h) noFocus.push(f); }
      T('Tastatur ' + v + (g ? ':' + g : '') + ': Tab erreicht Bedienelemente (' + new Set(seen).size + ')', new Set(seen).size >= 10, seen.slice(0, 12));
      T('Tastatur ' + v + (g ? ':' + g : '') + ': jedes erreichte Element mit sichtbarem Fokus', noFocus.length === 0, noFocus.slice(0, 6));
    }
    /* Enter auf einem Bogenreiter */
    await p.evaluate(() => { const ch = sampleChar(); S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'sheet'; S.mg = 'kampf'; render(); document.querySelector('.mnav [data-arg="werte"]').focus(); });
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    T('Tastatur: Enter auf «Werte» wechselt den Reiter', await p.evaluate(() => S.mg === 'werte'));
    await p.close(); }
  for (const [w, h] of [[844, 390], [740, 360], [667, 375]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); }); await p.goto('file://' + target); await p.waitForTimeout(500);
    const bad = [];
    for (const [v, g] of [['heroes'], ['sheet', 'kampf'], ['sheet', 'werte'], ['sheet', 'zauber'], ['sheet', 'gear'], ['sheet', 'alle'], ['build'], ['spells'], ['mobs'], ['camp'], ['adv'], ['help'], ['hb']]) {
      const o = await p.evaluate(([v, g]) => { const ch = sampleChar(); S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = v; if (g) S.mg = g; S.camp = ''; S.combat = null; render(); const d = document.documentElement; return { sw: d.scrollWidth, vw: innerWidth }; }, [v, g]);
      if (o.sw > o.vw + 1) bad.push(v + (g ? ':' + g : '') + ' ' + o.sw + '>' + o.vw);
    }
    T('Querformat ' + w + '×' + h + ': kein seitliches Überlaufen in 13 Ansichten', bad.length === 0, bad);
    await p.close(); }
  T('keine Seitenfehler', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' bestanden, ' + fail + ' fehlgeschlagen'); await b.close(); process.exit(fail ? 1 : 0);
})();
