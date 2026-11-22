/* Würfelverlauf: Würfe bleiben nachlesbar (Held, Kreatur, Mitspieler), gespeichert, Rückfrage zeigt den Wurf.
   Aufruf: node tests/verlauf.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const dev of [{ n: 'Handy', vp: { width: 390, height: 844 }, m: true }, { n: 'PC', vp: { width: 1280, height: 900 } }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(450); const d = dev.n + ': ';
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'ruhig'); const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; S.view = 'sheet'; S.mg = 'kampf'; render(); d20(3, 'Stärke-Wurf', { kind: 'check:str' }); });
    T(d + 'Heldenwurf im Verlauf mit Name', await p.evaluate(() => { const h = histLoad()[0]; return h && h.label === 'Stärke-Wurf' && h.who === cur().name && /W20/.test(h.detail); }));
    await p.evaluate(() => { S.view = 'mobs'; render(); rawD20(4, 'Goblin: Krummsäbel', true); rollDmg('1W6+2', 'Goblin: Krummsäbel (Hieb)'); });
    T(d + 'Kreaturenwürfe (Angriff und Schaden) im Verlauf', await p.evaluate(() => { const H = histLoad(); return H[0].label.startsWith('Goblin') && H[1].label.startsWith('Goblin') && H[0].who === ''; }));
    await p.waitForTimeout(1500);
    T(d + 'Würfelfenster bleibt länger stehen', await p.evaluate(() => !$('#toast').hidden));
    await p.evaluate(() => { $('#toast').click(); });
    T(d + 'Antippen des Würfelfensters öffnet den Verlauf', await p.evaluate(() => S.modal === 'verlauf' && document.querySelectorAll('.hist li.hit').length >= 3 && /Heute/.test(document.querySelector('.hist .hday').textContent)));
    T(d + 'Details sichtbar (Würfel, Bonus)', await p.evaluate(() => [...document.querySelectorAll('.hist li.hit small')].some((x) => /W20/.test(x.textContent))));
    await p.evaluate(() => { histAdd({ label: 'Lyra: Feuerpfeil', total: 17, detail: 'W20 12 +5', sides: 20 }, 'Lyra', true); });
    T(d + 'Mitspieler-Würfe mit Filter', await p.evaluate(() => { XA.histF(null, 'andere'); const n = document.querySelectorAll('.hist li.hit').length; XA.histF(null, 'alle'); return n === 1 && !!document.querySelector('.hf'); }));
    await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; });
    await p.reload(); await p.waitForTimeout(450);
    T(d + 'Verlauf bleibt nach Neustart', await p.evaluate(() => histLoad().length >= 4 && histLoad().some((x) => x.label === 'Stärke-Wurf')));
    if (dev.m) {
      await p.evaluate(() => { const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; S.view = 'sheet'; S.mg = 'kampf'; render(); weaponAttack(cur(), 1, { dist: 'melee' }); });
      await p.waitForTimeout(1600);
      T(d + 'Rückfrage nach dem Angriff zeigt den Wurf', await p.evaluate(() => { const r = document.querySelector('#prompt .prroll'); if (!r || getComputedStyle(r).display === 'none' || !/W20/.test(r.textContent)) return false; return r.classList.contains('mini') ? $('#prompt').textContent.includes(String(S.log[0].total)) && !r.querySelector('b') : r.querySelector('b').textContent === String(S.log[0].total); }));
      await p.evaluate(() => { orbPrompt(''); S.dp = null; });
    }
    T(d + 'Menü enthält «Würfelverlauf»', await p.evaluate(() => { if (innerWidth <= 820) { XA.more(); return !!document.querySelector('#bnav .bmore [data-act="histOpen"]'); } return !!document.querySelector('#top [data-act="histOpen"]'); }));
    T(d + 'höchstens 200 Einträge', await p.evaluate(() => { for (let i = 0; i < 230; i++) histAdd({ label: 'W' + i, total: i, sides: 6 }); return histLoad().length === 200 && JSON.parse(localStorage.getItem('hb_wverlauf')).length === 200; }));
    T(d + 'Leeren', await p.evaluate(() => { XA.histClear(); return histLoad().length === 0 && JSON.parse(localStorage.getItem('hb_wverlauf')).length === 0; }));
    T(d + 'kein Querscrollen im Verlauf', await p.evaluate(() => { histAdd({ label: 'Ein sehr langer Name einer Kreatur mit Mehrfachangriff: Biss', total: 23, detail: 'W20 18 +5 · Vorteil 18/3', sides: 20 }); XA.histOpen(); return document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('.histdlg').scrollWidth <= document.querySelector('.histdlg').clientWidth + 1; }));
    await ctx.close();
  }
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
