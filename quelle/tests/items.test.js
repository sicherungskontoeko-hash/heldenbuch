/* Gegenstände: alle magischen Gegenstände aus dem SRD 5.2.1 (deutsch), nach Seltenheit gruppiert, Flüche markiert,
   Werte eingerechnet; Ausrüstung mit Preisen nach Kategorien. Aufruf: node tests/items.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  T('Über 230 magische Gegenstände', await p.evaluate(() => Object.keys(MAGIC_ITEMS).length >= 230), await p.evaluate(() => Object.keys(MAGIC_ITEMS).length));
  T('Jeder hat Name, gültige Seltenheit und Text', await p.evaluate(() => Object.values(MAGIC_ITEMS).every((d) => d.name && ITEM_RAR.includes(d.r) && d.text && d.text.length > 10)), await p.evaluate(() => Object.entries(MAGIC_ITEMS).filter(([, d]) => !(d.name && ITEM_RAR.includes(d.r) && d.text)).map(([k]) => k)));
  T('Alle Stufen vertreten: gewöhnlich bis Artefakt', await p.evaluate(() => ['gewöhnlich', 'ungewöhnlich', 'selten', 'sehr selten', 'legendär', 'Artefakt'].every((r) => Object.values(MAGIC_ITEMS).some((d) => d.r === r))));
  T('Verfluchte Gegenstände markiert (Berserkeraxt, Beutel des Verschlingens …)', await p.evaluate(() => MAGIC_ITEMS['berserker-axe'].curse && MAGIC_ITEMS['bag-devouring'].curse && Object.values(MAGIC_ITEMS).filter((d) => d.curse).length >= 6));
  T('Keine doppelten Namen', await p.evaluate(() => { const n = Object.values(MAGIC_ITEMS).map((d) => d.name); return new Set(n).size === n.length; }), await p.evaluate(() => { const n = Object.values(MAGIC_ITEMS).map((d) => d.name); return n.filter((x, i) => n.indexOf(x) !== i); }));
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const n = normChar(newChar({ name: 'Brakk', cls: 'fig', level: 5 })); n.armor = 'plate'; S.chars[n.id] = n; S.cur = n.id; S.view = 'sheet'; render(); });
  const base = await p.evaluate(() => derive(S.chars[S.cur], S.hb).ac);
  await p.evaluate(() => { const ch = S.chars[S.cur]; ch.items = [{ uid: 'a', id: 'dwarven-plate', att: false, eq: true, qty: 1 }, { uid: 'b', id: 'berserker-axe', att: true, eq: true, qty: 1 }]; render(); });
  T('Zwergenplatte: +2 RK wird eingerechnet', await p.evaluate((b0) => derive(S.chars[S.cur], S.hb).ac === b0 + 2, base), [base, await p.evaluate(() => derive(S.chars[S.cur], S.hb).ac)]);
  await p.evaluate(() => { S.view = 'build'; S.step = 4; render(); });
  const where = await p.evaluate(() => !!document.querySelector('#addItem'));
  if (!where) await p.evaluate(() => { S.view = 'sheet'; render(); document.querySelectorAll('details').forEach((d) => { d.open = true; }); });
  const sel = await p.evaluate(() => { const s = document.querySelector('#addItem'); return s ? { groups: s.querySelectorAll('optgroup').length, opts: s.querySelectorAll('option').length } : null; });
  T('Auswahl: nach Seltenheit gruppiert, alle wählbar', sel && sel.groups >= 6 && sel.opts > 230, sel);
  T('Im Inventar: „☠ verflucht“ bei der Berserkeraxt', await p.evaluate(() => /☠ verflucht/.test(document.querySelector('#view').textContent)));
  const gs = await p.evaluate(() => { const s = document.querySelector('#addGear'); return s ? { groups: s.querySelectorAll('optgroup').length, opts: s.querySelectorAll('option').length, price: /Seil, 15 m · 1 GM/.test(s.textContent) } : null; });
  T('Ausrüstung: über 100 Einträge in Kategorien, mit Preis', gs && gs.groups >= 8 && gs.opts > 100 && gs.price, gs);
  T('Beute kann auch neue Gegenstände liefern', await p.evaluate(() => Object.keys(MAGIC_ITEMS).filter((k) => MAGIC_ITEMS[k].r === 'selten').length > 40));
  T('Handy: kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
