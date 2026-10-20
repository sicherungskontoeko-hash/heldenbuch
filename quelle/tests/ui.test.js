/* Heldenbuch – interaktiver Klicktest in Chromium (Desktop und Handy mit Touch).
   Aufruf: node tests/ui.test.js  – schlägt fehl bei JavaScript-Fehlern, waagrechtem Scrollen oder fehlenden Dialogen. */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
async function run(b, label, ctxOpt) {
  const ctx = await b.newContext(ctxOpt); const p = await ctx.newPage(); const errs = []; const fails = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const ok = (name, cond) => { if (!cond) fails.push(name); };
  const tap = async (sel, n = 0) => { const l = p.locator(sel).nth(n); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 4000 }); await p.waitForTimeout(120); };
  await p.goto(URL); await p.waitForTimeout(400);
  /* Erstellung von A bis Z */
  await tap('button[data-act=newChar]'); await tap('button[data-act=setCls][data-arg=pal]');
  for (let i = 0; i < 4; i++) await tap('button[data-act=lvl][data-arg="1"]');
  await tap('button[data-act=pick][data-path=sub][data-val=devotion]');
  for (let st = 1; st <= 6; st++) { const btn = p.locator('.steps button[data-arg="' + st + '"]'); if (await btn.count()) { await btn.first().click(); await p.waitForTimeout(150); } }
  ok('Abschluss-Schritt sichtbar', (await p.locator('#view').textContent()).length > 50);
  /* Bogen: alle Seiten */
  const go = async (v) => { const l = p.locator('[data-act=view][data-arg=' + v + ']:visible'); if (await l.count()) { await l.first().click(); } else { const more = p.locator('[data-act=more]:visible'); if (await more.count()) { await more.first().click(); await p.waitForTimeout(100); const l2 = p.locator('[data-act=view][data-arg=' + v + ']:visible'); if (await l2.count()) await l2.first().click(); else await p.evaluate((x) => { S.view = x; render(); }, v); } else await p.evaluate((x) => { S.view = x; render(); }, v); } await p.waitForTimeout(200); };
  await go('sheet');
  for (const g of ['kampf', 'werte', 'zauber', 'faehig', 'gear', 'begleiter', 'notiz']) { const b2 = p.locator('.mnav button[data-arg=' + g + ']'); if (await b2.count()) { await b2.first().click(); await p.waitForTimeout(120); } }
  await tap('.mnav button[data-arg=kampf]');
  /* Würfeln, Angriff, Treffer */
  const atk = p.locator('button[data-act=atk]'); if (await atk.count()) { await atk.first().click(); await p.waitForTimeout(800); const roll = p.locator('#prompt button[data-act=dpRoll]'); if (await roll.count() && await roll.isEnabled()) await roll.click(); else await tap('#prompt button[data-act=dpMiss]'); }
  /* Zugleiste: Kampfmodus, Aktion wählen */
  await tap('button[data-act=tFight]'); await tap('button[data-act=tPick][data-arg=b]'); ok('Zug-Auswahl öffnet', await p.locator('#modal:not([hidden])').count() === 1); await p.keyboard.press('Escape'); await p.evaluate(() => { document.getElementById('modal').hidden = true; S.modal = null; }); await tap('button[data-act=tFight]');
  /* Hilfe-Knöpfe */
  const hl = await p.locator('#view .hlp').count(); ok('Hilfe-Knöpfe vorhanden', hl >= 3);
  for (let i = 0; i < Math.min(hl, 6); i++) { await tap('#view .hlp', i); ok('Hilfe-Dialog ' + i, await p.locator('.helpdlg').count() === 1); await tap('.helpdlg .x'); }
  /* Kurze Rast mit Trefferwürfeln, lange Rast mit Bestätigung */
  await tap('button[data-act=rest][data-arg=short]'); ok('Kurze-Rast-Dialog', await p.locator('#modal [data-act=srDone]').count() === 1); await tap('#modal [data-act=srDone]');
  await tap('button[data-act=rest][data-arg=long]'); const cf = p.locator('[data-act=confirmYes], .cfdlg button.btn:not(.ghost)'); if (await cf.count()) await cf.first().click(); await p.waitForTimeout(150);
  /* Rückgängig */
  const und = p.locator('.undobtn'); if (await und.count() && await und.isEnabled()) await und.click();
  /* Stufenaufstieg-Dialog */
  const lu = p.locator('button[data-act=lvlUp]'); if (await lu.count()) { await lu.first().click(); await p.waitForTimeout(150); ok('Stufenaufstieg-Dialog', await p.locator('.lvlup').count() === 1); await p.evaluate(() => { document.getElementById('modal').hidden = true; S.modal = null; }); }
  /* Suche */
  await tap('.tsearch'); await p.fill('#srchQ', 'Feuerball'); await p.waitForTimeout(200); ok('Suche findet Feuerball', /Feuerball/.test(await p.locator('#modal').textContent())); await p.evaluate(() => { document.getElementById('modal').hidden = true; S.modal = null; });
  /* Würfelbecher */
  const dr = p.locator('[data-act=drOpen]'); if (await dr.count()) { await dr.first().click(); await tap('[data-act=drRoll]'); }
  /* Hausregeln + Regeloptionen */
  { await go('hb'); ok('Regeloptionen sichtbar', await p.locator('.rulesp').count() === 1); await tap('input[data-act=ruleT][data-arg=strict]'); await tap('input[data-act=ruleT][data-arg=strict]'); }
  /* Speichern und Wiederherstellen */
  const before = await p.evaluate(() => { commit(false); return Object.keys(S.chars).length; });
  await p.reload(); await p.waitForTimeout(400); const after = await p.evaluate(() => Object.keys(S.chars).length);
  ok('Helden nach Neuladen erhalten', after === before && after > 0);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth); const vw = await p.evaluate(() => window.innerWidth);
  ok('kein waagrechtes Scrollen (' + sw + '/' + vw + ')', sw <= vw + 1);
  await ctx.close();
  return { label, errs, fails };
}
(async () => {
  const b = await chromium.launch(); const results = [];
  results.push(await run(b, 'Desktop 1280', { viewport: { width: 1280, height: 900 } }));
  results.push(await run(b, 'Handy 390 (Touch)', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }));
  let bad = 0; for (const r of results) { const e = r.errs.filter((x) => !/ERR_TUNNEL|net::/.test(x)); bad += e.length + r.fails.length; console.log((e.length + r.fails.length ? '✘ ' : '✔ ') + r.label + (r.fails.length ? ' · fehlgeschlagen: ' + r.fails.join(', ') : '') + (e.length ? ' · JS-Fehler: ' + e.join(' | ') : '')); }
  await b.close(); process.exit(bad ? 1 : 0);
})();
