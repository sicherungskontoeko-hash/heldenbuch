/* Rückgängig, Wiederholen, Zug zurückspulen. Aufruf: node tests/undo.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const dev of [{ n: 'Handy', vp: { width: 390, height: 844 }, m: true }, { n: 'PC', vp: { width: 1280, height: 900 } }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(450); const d = dev.n + ': ';
    const click = async (sel) => { if (dev.m) await p.tap(sel); else await p.click(sel); await p.waitForTimeout(80); };
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; S.view = 'sheet'; S.mg = 'kampf'; S.undo = []; S.redo = []; render(); });
    T(d + 'Nichts zu tun: kein ↶ in der Reiterleiste (mehr Platz für die Reiter)', await p.evaluate(() => !document.querySelector('.mnav .udo')));
    const hp0 = await p.evaluate(() => cur().play.hp);
    await p.evaluate(() => { S.hpOpen = true; render(); }); await p.fill('#hpAmt', '7'); await click('.hpctl [data-arg="dmg"]'); await p.waitForTimeout(80);
    T(d + 'Schaden eingetragen, ↶ aktiv', await p.evaluate((h) => cur().play.hp === h - 7 && !document.querySelector('.mnav .undobtn').disabled, hp0));
    T(d + '↶ am Rand der Reiterleiste sichtbar (ohne Wischen), leuchtet kurz auf, keine schwebende Leiste', await p.evaluate(() => { const u = document.querySelector('.mnav .udo .undobtn'); const r = u.getBoundingClientRect(); const bar = document.getElementById('undoBar'); return r.right <= innerWidth + 1 && r.left >= 0 && u.classList.contains('neu') && (!bar || bar.hidden); }));
    await click('.mnav .undobtn');
    T(d + 'Rückgängig stellt TP wieder her', await p.evaluate((h) => cur().play.hp === h, hp0));
    T(d + '↷ erscheint nach Rückgängig', await p.evaluate(() => !!document.querySelector('.mnav .redobtn')));
    await click('.mnav .redobtn');
    T(d + 'Wiederholen trägt den Schaden wieder ein', await p.evaluate((h) => cur().play.hp === h - 7 && !document.querySelector('.mnav .redobtn'), hp0));
    await click('.mnav .undobtn');
    await p.evaluate(() => { document.querySelector('[data-act="cond"][data-arg="prone"]').click(); });
    await p.waitForTimeout(80);
    T(d + 'Neue Änderung lässt Wiederholen verfallen', await p.evaluate(() => !document.querySelector('.mnav .redobtn') && cur().play.cond.includes('prone')));
    /* Zug zurückspulen */
    await p.evaluate(() => { cur().play.cond = []; cur().play.localFight = true; render(); document.querySelector('[data-act="tNew"]').click(); });
    await p.waitForTimeout(120);
    const st0 = await p.evaluate(() => JSON.stringify({ hp: cur().play.hp, s: cur().play.slots, t: cur().play.turn }));
    await p.evaluate(() => { const ch = cur(); weaponAttack(ch, 1, { dist: 'melee' }); orbPrompt(''); S.dp = null; });
    await p.waitForTimeout(80);
    await p.evaluate(() => { S.hpOpen = true; render(); }); await p.fill('#hpAmt', '4'); await click('.hpctl [data-arg="dmg"]'); await p.waitForTimeout(80);
    await p.evaluate(() => { document.querySelector('[data-act="cond"][data-arg="poisoned"]').click(); }); await p.waitForTimeout(80);
    T(d + '⟲ Zug erscheint in der Zugleiste', await p.evaluate(() => !!document.querySelector('.turnblk [data-act="turnBack"]')));
    await click('.turnblk [data-act="turnBack"]');
    T(d + 'Vorschau listet die Schritte', await p.evaluate(() => S.modal === 'turnback' && document.querySelectorAll('.tblist li').length >= 2 && /TP-Änderung/.test(document.querySelector('.tblist').textContent) && /Zustand/.test(document.querySelector('.tblist').textContent)));
    await click('[data-act="turnBackGo"]');
    T(d + 'Zurückgespult auf Zugbeginn', await p.evaluate((s0) => { const s = JSON.parse(s0); return cur().play.hp === s.hp && !cur().play.cond.includes('poisoned') && cur().play.turn.a === 0 && S.modal !== 'turnback'; }, st0));
    T(d + 'Würfe bleiben im Verlauf', await p.evaluate(() => histLoad().some((x) => /Langschwert/.test(x.label))));
    await click('.mnav .redobtn');
    T(d + 'Wiederholen holt den Stand vor dem Zurückspulen', await p.evaluate(() => cur().play.cond.includes('poisoned')));
    T(d + '⋯-Menü: Zug zurückspulen', await p.evaluate(() => !!document.querySelector('.smore [data-act="turnBack"]')));
    if (!dev.m) { await p.evaluate(() => { document.body.focus(); }); const hpA = await p.evaluate(() => cur().play.hp); await p.keyboard.press('Control+z'); await p.waitForTimeout(80); await p.keyboard.press('Control+y'); await p.waitForTimeout(80); T(d + 'Strg+Z / Strg+Y', await p.evaluate((h) => cur().play.hp === h, hpA)); }
    T(d + 'kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await ctx.close();
  }
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
