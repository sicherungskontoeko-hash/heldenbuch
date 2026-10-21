/* Erklärkarten (ⓘ) im Heldenbau: öffnen, Inhalt, Wählen/Abwählen, gesperrte Auswahl, Schliessen. Aufruf: node tests/info.test.js [app.html] [shotsDir] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const shots = process.argv[3];
(async () => {
  const b = await chromium.launch(); const out = []; const errs = [];
  const T = (name, ok, got) => out.push({ name, ok: !!ok, got });
  for (const dev of [{ n: 'desktop', vp: { width: 1280, height: 860 } }, { n: 'handy', vp: { width: 390, height: 844 }, mobile: true }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.mobile, hasTouch: !!dev.mobile });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    await p.evaluate(() => { const n = newChar({ name: 'Test' }); S.chars[n.id] = n; S.cur = n.id; S.view = 'build'; S.step = 0; render(); });
    const open = () => p.evaluate(() => !$('#modal').hidden && !!$('#modal .infodlg'));
    const tap = async (sel) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); if (dev.mobile) await el.tap(); else await el.click(); await p.waitForTimeout(120); };
    /* Klasse */
    const nI = await p.locator('.card .ii').count(); T(dev.n + ': ⓘ an jeder Klassenkarte', nI === await p.locator('.cards.pics .card').count() && nI > 10, nI);
    await tap('.card[data-arg="wiz"] .ii'); T(dev.n + ': Klassen-ⓘ öffnet Karte, ohne zu wählen', (await open()) && (await p.evaluate(() => cur().cls)) !== 'wiz');
    T(dev.n + ': Klassenkarte zeigt Beschreibung und Werte', await p.evaluate(() => /Magier/.test($('.infodlg .ihd').textContent) && !!$('.infodlg .iflav') && /Trefferwürfel/.test($('.infodlg .idl').textContent)));
    if (shots) await p.screenshot({ path: path.join(shots, dev.n + '-klasse.png') });
    await tap('.infodlg .ipick'); T(dev.n + ': „Wählen“ wählt die Klasse und schliesst', (await p.evaluate(() => cur().cls)) === 'wiz' && !(await open()));
    await tap('.card[data-arg="wiz"]'); T(dev.n + ': Karte selbst antippen wählt direkt (kein Pop-up)', !(await open()));
    await tap('.card[data-arg="wiz"] .ii'); T(dev.n + ': gewählte Klasse: „✓ Gewählt“ statt Knopf', await p.evaluate(() => !!$('.infodlg .ihint.ok') && !$('.infodlg .ipick')));
    await p.keyboard.press('Escape'); T(dev.n + ': Escape schliesst', !(await open()));
    /* Spezies + Hintergrund */
    await p.evaluate(() => { S.step = 1; render(); });
    await tap('.card[data-arg="dwarf"] .ii'); T(dev.n + ': Spezies-Karte mit Merkmalen', await p.evaluate(() => /Zwerg/.test($('.infodlg').textContent) && document.querySelectorAll('.infodlg .ifeats details').length >= 3));
    if (shots) await p.screenshot({ path: path.join(shots, dev.n + '-spezies.png') });
    await p.mouse.click(5, 5); T(dev.n + ': Tippen neben die Karte schliesst', !(await open()));
    await tap('.card[data-arg="sage"] .ii'); T(dev.n + ': Hintergrund-Karte nennt Talent, Fertigkeiten, Ausrüstung', await p.evaluate(() => /Fertigkeiten/.test($('.infodlg').textContent) && /Ausrüstung/.test($('.infodlg').textContent)));
    await p.keyboard.press('Escape');
    /* Fertigkeiten */
    await p.evaluate(() => { S.step = 3; render(); });
    const skI = await p.locator('#view .chipw .ii').count(); T(dev.n + ': ⓘ an Fertigkeiten', skI >= 4, skI);
    await tap('#view .chipw:has([data-path="classSkills"]) .ii'); T(dev.n + ': Fertigkeitskarte mit Erklärung und Wert', await p.evaluate(() => $('.infodlg .itx').textContent.length > 30 && /Für dich/.test($('.infodlg').textContent)));
    if (shots) await p.screenshot({ path: path.join(shots, dev.n + '-fertigkeit.png') });
    await tap('.infodlg .ipick'); T(dev.n + ': Fertigkeit über Karte gewählt', await p.evaluate(() => cur().classSkills.length === 1));
    /* Zauber */
    await p.evaluate(() => { S.step = 4; render(); });
    await tap('#view .chipw:has([data-val="fire-bolt"]) .ii'); T(dev.n + ': Zauberkarte: Bild, Werte, Wirkung, Für dich', await p.evaluate(() => { const t = $('.infodlg').textContent; return !!$('.infodlg .iflav') && /Reichweite/.test(t) && /Komponenten/.test(t) && /Dauer/.test(t) && /Wirkung/.test(t) && /Zauberangriff/.test(t); }));
    if (shots) await p.screenshot({ path: path.join(shots, dev.n + '-zauber.png') });
    await tap('.infodlg .ipick'); T(dev.n + ': Zaubertrick über Karte gewählt', await p.evaluate(() => cur().cantrips.includes('fire-bolt')));
    await tap('#view .chipw:has([data-val="fire-bolt"]) .ii'); T(dev.n + ': gewählter Zauber zeigt „Abwählen“', await p.evaluate(() => /Abwählen/.test($('.infodlg .ipick').textContent)));
    await tap('.infodlg .ipick'); T(dev.n + ': Abwählen funktioniert', await p.evaluate(() => !cur().cantrips.includes('fire-bolt')));
    await p.evaluate(() => { const c = derive(cur(), S.hb); const n = c.spell.classes[0].cantripN; cur().cantrips = c.spell.classes[0].list.filter((x) => x.lvl === 0).slice(0, n).map((x) => x.id); render(); });
    const lockedId = await p.evaluate(() => { const el = [...document.querySelectorAll('#view .chipw .chip[data-path="cantrips"]:disabled')][0]; return el && el.dataset.val; });
    await tap('#view .chipw:has([data-val="' + lockedId + '"]) .ii'); T(dev.n + ': ⓘ geht auch bei gesperrtem Zauber, mit Hinweis statt Knopf', (await open()) && await p.evaluate(() => !!$('.infodlg .ihint') && !$('.infodlg .ipick')));
    await p.keyboard.press('Escape');
    if (shots) await p.screenshot({ path: path.join(shots, dev.n + '-zauberliste.png'), fullPage: false });
    /* Waffen */
    await p.evaluate(() => { cur().weapons = [{ w: 'dagger' }]; S.step = 5; render(); });
    await tap('.wrow .ii'); T(dev.n + ': Waffenkarte erklärt Eigenschaften und Meisterschaft', await p.evaluate(() => /Finesse/.test($('.infodlg').textContent) && /Kerbe/.test($('.infodlg').textContent) && !$('.infodlg .ift')));
    await p.keyboard.press('Escape');
    /* Unterklasse */
    await p.evaluate(() => { cur().cls = 'fig'; cur().level = 3; S.step = 0; render(); });
    await tap('#a-sub + .opts .opt .ii'); T(dev.n + ': Unterklassen-Karte listet Merkmale', await p.evaluate(() => document.querySelectorAll('.infodlg .ifeats details').length >= 3));
    await p.keyboard.press('Escape');
    /* kein Überlauf auf dem Handy */
    if (dev.mobile) { const ow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); T('handy: keine waagrechte Scrollleiste', !ow); }
    await ctx.close();
  }
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.name + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
