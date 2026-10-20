/* HB-24 Abnahme-Klicktest: alle 16 Klassen, alle 64 Unterklassen, alle 12 Spezies, alle 7 Erstellungsschritte,
   Export → Import, Neustart ohne Netz. Läuft auf Desktop und Handy (Touch). Aufruf: node tests/ui-full.test.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
async function run(b, label, opt) {
  const ctx = await b.newContext(opt); const p = await ctx.newPage(); const errs = []; const fails = []; let n = 0;
  p.on('pageerror', (e) => errs.push(e.message));
  const ok = (name, cond) => { n++; if (!cond) fails.push(name); };
  const noScroll = async (where) => { const sw = await p.evaluate(() => document.documentElement.scrollWidth); ok('kein Querscrollen: ' + where, sw <= (opt.viewport.width + 1)); };
  await p.goto(URL); await p.waitForTimeout(400);
  await p.locator('button[data-act=newChar]').first().click(); await p.waitForTimeout(150);
  const classes = await p.evaluate(() => Object.keys(CLASSES));
  for (const k of classes) {
    await p.locator('button[data-act=setCls][data-arg=' + k + ']').click(); await p.waitForTimeout(60);
    await p.evaluate(() => { const ch = cur(); ch.level = 3; commit(); });
    const subs = await p.evaluate(() => (CLASSES[cur().cls].subs || []).map((s) => s.id));
    for (const sid of subs) { const btn = p.locator('button[data-act=pick][data-path=sub][data-val="' + sid + '"]'); ok(k + '/' + sid + ' wählbar', await btn.count() === 1); if (await btn.count()) { await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(40); ok(k + '/' + sid + ' gesetzt', await p.evaluate((x) => cur().sub === x, sid)); } }
  }
  await noScroll('Klassen');
  await p.evaluate(() => { S.step = 1; render(); });
  const species = await p.evaluate(() => Object.keys(SPECIES));
  for (const s of species) { const btn = p.locator('button[data-act=setSpecies][data-arg=' + s + ']'); await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(40); ok('Spezies ' + s, await p.evaluate((x) => cur().species === x, s)); }
  await noScroll('Spezies');
  for (let st = 0; st <= 6; st++) { await p.evaluate((x) => { S.step = x; render(); }, st); await p.waitForTimeout(80); ok('Schritt ' + (st + 1) + ' rendert', (await p.locator('#view').textContent()).length > 40); await noScroll('Schritt ' + (st + 1)); }
  /* Bogen und Kampf */
  await p.evaluate(() => { S.view = 'sheet'; render(); }); await p.waitForTimeout(150);
  for (const g of ['kampf', 'werte', 'zauber', 'faehig', 'gear', 'begleiter', 'notiz']) { const l = p.locator('.mnav button[data-arg=' + g + ']'); if (await l.count()) { await l.first().click(); await p.waitForTimeout(60); await noScroll('Seite ' + g); } }
  /* Export → Import in frischer Umgebung */
  const exported = await p.evaluate(() => { openModal('export', exportData(Object.values(S.chars))); const t = document.getElementById('exText'); const v = t ? t.value : ''; document.getElementById('modal').hidden = true; S.modal = null; return v; });
  ok('Export liefert Heldentext', exported.length > 100);
  const ctx2 = await b.newContext(opt); const p2 = await ctx2.newPage(); p2.on('pageerror', (e) => errs.push('Import-Seite: ' + e.message)); await p2.goto(URL); await p2.waitForTimeout(300);
  const imported = await p2.evaluate((txt) => { try { importJson(txt); return Object.values(S.chars).some((c) => c.species && c.cls); } catch (e) { return 'Fehler: ' + e.message; } }, exported);
  ok('Import in neuer Umgebung', imported === true); await ctx2.close();
  /* Neustart ohne Netz */
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(400);
  ok('Neustart ohne Netz: Helden noch da', await p.evaluate(() => Object.keys(S.chars).length > 0));
  await ctx.close();
  return { label, errs: errs.filter((x) => !/net::|ERR_INTERNET|Failed to fetch/.test(x)), fails, n };
}
(async () => {
  const b = await chromium.launch(); const out = [];
  out.push(await run(b, 'Chromium Desktop 1280', { viewport: { width: 1280, height: 900 } }));
  out.push(await run(b, 'Chromium Handy 390 (Touch)', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }));
  let bad = 0; for (const r of out) { bad += r.fails.length + r.errs.length; console.log((r.fails.length + r.errs.length ? '✘ ' : '✔ ') + r.label + ': ' + (r.n - r.fails.length) + '/' + r.n + ' Prüfungen' + (r.fails.length ? ' · fehlgeschlagen: ' + r.fails.slice(0, 10).join(', ') : '') + (r.errs.length ? ' · JS-Fehler: ' + r.errs.slice(0, 5).join(' | ') : '')); }
  console.log('Browser: Chromium ' + b.version()); await b.close(); process.exit(bad ? 1 : 0);
})();
