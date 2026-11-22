/* Aufgeräumter Bogen: Kopfleiste mit Kernwerten, Kampfseite ohne Reiterwechsel, kompakte Nebenblöcke, Heldenliste.
   Aufruf: node tests/bogen.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const dev of [{ n: 'Handy', vp: { width: 390, height: 844 }, m: true }, { n: 'PC', vp: { width: 1280, height: 900 } }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(450);
    await p.evaluate(() => {
      const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id;
      const w = normChar(newChar({ name: 'Lyra', cls: 'wiz', level: 5 })); const i = derive(w, S.hb).spell.classes[0]; w.cantrips = ['fire-bolt'].concat(i.list.filter((x) => x.lvl === 0 && x.id !== 'fire-bolt').slice(0, i.cantripN - 1).map((x) => x.id)); S.chars[w.id] = w; window.__w = w.id;
      const m = normChar(newChar({ name: 'Mo', cls: 'mon', level: 3 })); S.chars[m.id] = m; window.__m = m.id;
      S.view = 'sheet'; S.mg = 'kampf'; render();
    });
    const d = dev.n + ': ';
    T(d + 'Kopfleiste mit TP, RK, Initiative, Bewegung', await p.evaluate(() => { const v = document.querySelector('.shbar .vbar'); return !!v && /TP/.test(v.textContent) && /RK/.test(v.textContent) && !!v.querySelector('[data-kind="init"]') && /Bew/.test(v.textContent); }));
    T(d + 'keine Wertekacheln mehr auf «Kampf»', await p.evaluate(() => [...document.querySelectorAll('.vitals')].every((e) => e.offsetParent === null)));
    T(d + 'Kopfleiste bleibt beim Scrollen oben', await p.evaluate(async () => { window.scrollTo(0, 1200); await new Promise((r) => setTimeout(r, 120)); const r = document.querySelector('.shbar').getBoundingClientRect(); window.scrollTo(0, 0); return r.top >= 0 && r.top < 140; }));
    T(d + 'Kopfleiste ist schmal', await p.evaluate(() => document.querySelector('.shbar').getBoundingClientRect().height < (innerWidth <= 820 ? 130 : 130)), await p.evaluate(() => document.querySelector('.shbar').getBoundingClientRect().height));
    if (dev.m) {
      T(d + 'TP-Feld erst nach Antippen', await p.evaluate(() => getComputedStyle(document.querySelector('.hpctl')).display === 'none'));
      await p.tap('.vbar .hpb'); await p.waitForTimeout(120);
      T(d + 'Antippen der TP öffnet Schaden/Heilen', await p.evaluate(() => getComputedStyle(document.querySelector('.hpctl')).display !== 'none'));
    } else T(d + 'TP-Feld direkt in der Leiste', await p.evaluate(() => document.querySelector('.hpctl').offsetParent !== null));
    await p.fill('#hpAmt', '5'); await (dev.m ? p.tap('.hpctl [data-arg="dmg"]') : p.click('.hpctl [data-arg="dmg"]')); await p.waitForTimeout(150);
    T(d + 'Schaden wird abgezogen', await p.evaluate(() => cur().play.hp === derive(cur(), S.hb).hpMax - 5));
    if (dev.m) T(d + 'Feld schliesst danach', await p.evaluate(() => getComputedStyle(document.querySelector('.hpctl')).display === 'none'));
    T(d + 'Heldeninspiration auf «Kampf» sichtbar', await p.evaluate(() => { const r = document.querySelector('.strow'); return !!r && r.offsetParent !== null && /Heldeninspiration/.test(r.textContent); }));
    T(d + 'Zustände ohne Eintrag: eine schmale Zeile mit Erschöpfung', await p.evaluate(() => { const c = document.querySelector('#conds'); return c.classList.contains('none') && c.getBoundingClientRect().height < 130 && !!c.querySelector('.exh select'); }), await p.evaluate(() => document.querySelector('#conds').getBoundingClientRect().height));
    T(d + 'Zustand erscheint in der Kopfleiste', await p.evaluate(() => { cur().play.cond = ['prone']; render(); const ok = /Liegend|liegend/.test((document.querySelector('.vbar .vcond') || {}).textContent || ''); cur().play.cond = []; render(); return ok; }));
    T(d + 'Waffenloser Schlag zuletzt, Wurfvariante als Unterzeile', await p.evaluate(() => { const n = [...document.querySelectorAll('.atks > .atk')].map((e) => e.querySelector('.an b').textContent); return /Waffenloser/.test(n[n.length - 1]) && n.some((x) => /geworfen/.test(x)) && !n.some((x) => /\(geworfen\)/.test(x)); }));
    T(d + 'Zauberplätze im Ressourcen-Block', await p.evaluate(() => !!document.querySelector('.res, .rs.slotrs') && !!document.querySelector('.slotrs') && ![...document.querySelectorAll('section h2')].some((h) => /^Zauberplätze/.test(h.textContent) && h.offsetParent)));
    T(d + 'EP und Stufenaufstieg unter «Werte»', await p.evaluate(() => { const x = document.querySelector('.xpline'); const k = x.offsetParent === null; S.mg = 'werte'; render(); const w = document.querySelector('.xpline').offsetParent !== null && document.querySelector('.kwerte').offsetParent !== null; S.mg = 'kampf'; render(); return k && w; }));
    T(d + 'Magier: Feuerpfeil direkt bei den Angriffen', await p.evaluate(() => { S.cur = window.__w; render(); const c = document.querySelector('.atkcant'); return !!c && /Feuerpfeil/.test(c.textContent) && !!c.querySelector('[data-act="castSp"]'); }));
    T(d + 'Mönch: waffenloser Schlag zuerst', await p.evaluate(() => { S.cur = window.__m; render(); const f = document.querySelector('.atks > .atk .an b'); return /Waffenloser/.test(f.textContent); }));
    T(d + '«Alles» auch hier wählbar', await p.evaluate(() => { const a = document.querySelector('.mnav .mall'); return !!a && a.offsetParent !== null; }));
    T(d + 'Lange Texte: «zuklappen» unten schliesst', await p.evaluate(() => { S.mg = 'faehig'; render(); const btn = [...document.querySelectorAll('.dclose')][0]; if (!btn) return false; const dd = btn.closest('details'); dd.open = true; btn.click(); return !dd.open; }));
    await p.evaluate(() => { S.mg = 'kampf'; S.view = 'heroes'; render(); });
    if (dev.m) T(d + 'Heldenliste kompakt', await p.evaluate(() => document.querySelector('.hero').getBoundingClientRect().height < 240), await p.evaluate(() => document.querySelector('.hero').getBoundingClientRect().height));
    T(d + 'kein Querscrollen', await p.evaluate(() => { S.view = 'sheet'; render(); return document.documentElement.scrollWidth <= innerWidth + 1; }));
    await ctx.close();
  }
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
