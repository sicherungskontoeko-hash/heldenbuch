/* Jeder Zauber einmal wirken: Für jede zauberkundige Klasse auf Stufe 20 werden alle Zauber ihrer Liste vorbereitet
   und nacheinander gewirkt (Zaubertricks auf Grad 0, sonst auf dem eigenen Grad). Folgefenster (Rettungswurf, Treffer,
   Schaden, Ziel) werden mit dem ersten Hauptknopf beantwortet, bis nichts mehr offen ist.
   Geprüft: keine Skriptfehler, kein «undefined»/«NaN» im Fenster oder im Verlauf, Zauberplätze werden nicht negativ,
   die Seite bleibt bedienbar. Aufruf: node tests/zauber.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept().catch(() => {}));
  await p.goto('file://' + target); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    localStorage.setItem('hb_dice_fx', 'aus'); window.print = () => {};
    const wait = (t) => new Promise((x) => setTimeout(x, t)); const befunde = []; let gewirkt = 0;
    const casters = Object.entries(CLASSES).filter(([, C]) => C.caster).map(([k]) => k);
    for (const k of casters) {
      const C = CLASSES[k]; const subs = C.subs || [];
      const list = spellList(k, S.hb).filter((s) => s && s.id && !String(s.id).startsWith('hb:'));
      const ch = normChar(newChar({ name: 'Z ' + C.name, cls: k, level: 20, sub: subs.length ? subs[0].id : '', species: 'human', bg: 'sage', weapons: [{ w: 'dagger' }] }));
      ch.cantrips = list.filter((s) => s.lvl === 0).map((s) => s.id); ch.spells = list.filter((s) => s.lvl > 0).map((s) => s.id); ch.book = ch.spells.slice();
      S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'sheet'; S.mg = 'zauber'; S.camp = ''; render();
      for (const s of list) {
        const P = ch.play; P.slots = {}; P.pact = 0; P.conc = null; P.fx = {}; P.fxDur = {}; P.fxSrc = {}; P.cond = []; P.hp = null; P.res = {}; P.turn = null; P.localFight = false;
        const m = document.getElementById('modal'); m.hidden = true; S.modal = null;
        const c0 = derive(ch, S.hb); const lvl = s.lvl === 0 ? 0 : s.lvl; const mode = c0.spell.pact && !(c0.spell.slots || []).length ? 'pact' : 'slot';
        try { castSpell(ch, s.id, lvl, mode); gewirkt++; } catch (e) { befunde.push(k + ' ' + s.id + ': ' + e.message); continue; }
        for (let i = 0; i < 4; i++) { await wait(15); const mm = document.getElementById('modal'); if (mm.hidden) break;
          const t = mm.innerText; const bad = t.match(/\bundefined\b|\bNaN\b|\[object/); if (bad) befunde.push(k + ' ' + s.id + ': Fenster zeigt ' + bad[0] + ' «' + t.slice(0, 120).replace(/\s+/g, ' ') + '»');
          const btn = mm.querySelector('.btn:not(.ghost):not([disabled]), button[data-act]:not(.x):not([disabled])'); if (!btn) { mm.hidden = true; S.modal = null; break; }
          try { btn.click(); } catch (e) { befunde.push(k + ' ' + s.id + ': Klick im Fenster – ' + e.message); break; } }
        const P2 = ch.play; Object.entries(P2.slots || {}).forEach(([g, v]) => { if (+v < 0) befunde.push(k + ' ' + s.id + ': Zauberplätze Grad ' + g + ' negativ'); });
        const last = (S.log || [])[0]; if (last) { const t = JSON.stringify(last); if (/undefined|NaN/.test(t)) befunde.push(k + ' ' + s.id + ': Verlauf ' + t.slice(0, 160)); }
      }
      try { render(); } catch (e) { befunde.push(k + ': render – ' + e.message); }
      delete S.chars[ch.id];
    }
    document.getElementById('modal').hidden = true; S.modal = null;
    return { gewirkt, casters, befunde: [...new Set(befunde)] };
  });
  await b.close();
  console.log('Gewirkt: ' + r.gewirkt + ' Zauber in ' + r.casters.length + ' Klassen (' + r.casters.join(', ') + ')');
  r.befunde.slice(0, 60).forEach((x) => console.log('✘ ' + x)); errs.slice(0, 20).forEach((e) => console.log('✘ Skriptfehler: ' + e));
  const f = r.befunde.length + errs.length; console.log(f ? f + ' Befunde' : 'Keine Befunde'); process.exit(f ? 1 : 0);
})();
