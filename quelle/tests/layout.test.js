/* Aufgeräumtes Layout: ⚠ offene Punkte (rechts, aufklappbar, Sprung), Mehr-Menü, ⋯-Menü im Bogen, kompakte Übersicht am Handy. Aufruf: node tests/layout.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const out = []; const errs = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const dev of [{ n: 'desktop', vp: { width: 1280, height: 860 } }, { n: 'handy', vp: { width: 390, height: 844 }, m: true }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    const tap = async (sel) => { const el = p.locator(sel).first(); if (dev.m) await el.tap(); else await el.click(); await p.waitForTimeout(150); };
    await p.evaluate(() => { const n = newChar({ name: 'Brakk', cls: 'wiz', level: 3 }); S.chars[n.id] = n; S.cur = n.id; S.view = 'sheet'; render(); });
    const n = await p.evaluate(() => derive(cur(), S.hb).warn.length);
    T(dev.n + ': ⚠ zeigt Anzahl offener Punkte', await p.evaluate((k) => { const b = document.querySelector('#warnfab .wfb b'); return b && +b.textContent === k; }, n), n);
    T(dev.n + ': kein grosser „Noch offen“-Kasten mehr auf dem Bogen', await p.evaluate(() => !document.querySelector('.sheet .notice')));
    await tap('#warnfab .wfb'); T(dev.n + ': ⚠ klappt Liste auf', await p.evaluate((k) => document.querySelectorAll('#warnfab .wpan li').length === k, n));
    await tap('#warnfab .wpan li button'); T(dev.n + ': Antippen springt zum Punkt (Erstellen, Stelle markiert)', await p.evaluate(() => S.view === 'build' && !!document.querySelector('.flash')));
    /* Übersicht beim Erstellen */
    if (dev.m) {
      T('handy: Übersicht eingeklappt, Kurzzeile sichtbar', await p.evaluate(() => getComputedStyle(document.querySelector('.summary .sgrid')).display === 'none' && getComputedStyle(document.querySelector('.summary .smini')).display !== 'none'));
      await tap('.sumtg'); T('handy: Übersicht aufklappbar', await p.evaluate(() => getComputedStyle(document.querySelector('.summary .sgrid')).display !== 'none'));
      await p.evaluate(() => { S.sumOpen = false; render(); });
    } else {
      T('desktop: Übersicht zeigt „⚠ … noch offen“ statt langer Liste', await p.evaluate(() => !!document.querySelector('.summary .swarn') && !document.querySelector('.summary ul.warn')));
      await tap('.summary .swarn'); T('desktop: Knopf in der Übersicht öffnet dieselbe Liste', await p.evaluate(() => !!document.querySelector('#warnfab .wpan')));
      await p.keyboard.press('Escape'); T('desktop: Escape schliesst die Liste', await p.evaluate(() => !document.querySelector('#warnfab .wpan')));
    }
    /* alles erledigt → ✓, dann weg */
    await p.evaluate(() => { const ch = cur(); const c0 = derive(ch, S.hb); ch.sub = (CLASSES.wiz.subs || [])[0].id; render(); });
    const fixAll = await p.evaluate(() => { const ch = cur(); let guard = 0; let c = derive(ch, S.hb); while (c.warn.length && guard++ < 1) break; return c.warn.length; });
    if (fixAll) await p.evaluate(() => { const ch = cur(); const W = derive; const c = W(ch, S.hb);
      ch.classSkills = CLASSES.wiz.skills.filter((s) => !(c.bg.skills || []).includes(s)).slice(0, 2);
      ch.species = 'dwarf'; ch.speciesChoice = ''; ch.speciesSkill = ''; ch.extraSkills = [];
      const c2 = W(ch, S.hb); ch.expertise = ALL_SKILLS.filter((s) => c2.skills[s].prof && (!c2.expFrom || c2.expFrom.includes(s))).slice(0, c2.expN || 0);
      const info = c2.spell.classes[0]; ch.cantrips = info.list.filter((x) => x.lvl === 0).slice(0, info.cantripN).map((x) => x.id); ch.spells = info.list.filter((x) => x.lvl > 0 && x.lvl <= info.maxLvl).slice(0, info.prepN).map((x) => x.id);
      render(); });
    const left = await p.evaluate(() => derive(cur(), S.hb).warn);
    if (!left.length) { T(dev.n + ': alles erledigt → grünes ✓', await p.evaluate(() => !!document.querySelector('#warnfab .wfb.ok'))); await p.waitForTimeout(2100); T(dev.n + ': ✓ verschwindet wieder', await p.evaluate(() => !document.querySelector('#warnfab .wfb'))); }
    else T(dev.n + ': (Testaufbau) alle Punkte erledigt', false, left);
    /* Menüs */
    await p.evaluate(() => { S.view = 'sheet'; render(); window.scrollTo(0, 0); });
    await tap('.smore summary'); T(dev.n + ': ⋯-Menü öffnet', await p.evaluate(() => document.querySelector('.smore').open));
    await tap('.smore .mnul button[data-act="exportOne"]'); T(dev.n + ': Exportieren aus dem Menü öffnet Export, Menü zu', await p.evaluate(() => S.modal === 'export' && !document.querySelector('.smore[open]')));
    await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; });
    if (!dev.m) {
      T('desktop: Hauptmenü hat 5 Punkte + „Mehr“', await p.evaluate(() => document.querySelectorAll('.tabs > button').length === 5 && !!document.querySelector('.tabs .tmore')));
      await tap('.tmore summary'); await tap('.tmore .mnul button[data-arg="mobs"]'); T('desktop: „Mehr“ → Bestiarium, Menü zeigt aktive Seite', await p.evaluate(() => S.view === 'mobs' && /Bestiarium/.test(document.querySelector('.tmore summary').textContent) && !document.querySelector('.tmore[open]')));
      T('desktop: Menüleiste passt in 1280 px (nichts abgeschnitten)', await p.evaluate(() => { const t = document.querySelector('.tabs'); return t.scrollWidth <= t.clientWidth + 1; }));
    }
    T(dev.n + ': keine waagrechte Scrollleiste', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await ctx.close();
  }
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
