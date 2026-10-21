/* Würfel-Designs: Körper und Zahlen, alle Sets zeichnen, Auswahl, „pro Raum nur einmal“, Gleichzeitig-Konflikt, SL-Set,
   Effekte voll/ruhig/aus, Überspringen, Teilen am Tisch, Probewurf nicht geteilt, Geräusche ohne Fehler, Leistung. Aufruf: node tests/dice.test.js [app.html] [shots] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html')); const shots = process.argv[3];
(async () => {
  const b = await chromium.launch(); const out = []; const errs = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const dev of [{ n: 'desktop', vp: { width: 1280, height: 860 } }, { n: 'handy', vp: { width: 390, height: 844 }, m: true }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    await p.evaluate(() => { const n = newChar({ name: 'Brakk', cls: 'fig', level: 3 }); S.chars[n.id] = n; S.cur = n.id; S.view = 'sheet'; render(); });
    if (dev.n === 'desktop') {
      T('Körper: alle Flächen, Zahlen 1–n genau einmal', await p.evaluate(() => [4, 6, 8, 10, 12, 20].every((s) => { const g = d3geo(s); const v = g.F.map((f) => f.val).sort((a, b) => a - b); return g.F.length === s && v.every((x, i) => x === i + 1); })));
      T('Gegenseiten ergeben n+1 (W6, W8, W10, W12, W20)', await p.evaluate(() => [6, 8, 10, 12, 20].every((s) => { const g = d3geo(s); return g.F.every((f) => { const o = g.F.reduce((a, x) => (V.dot(x.n, f.n) < V.dot(a.n, f.n) ? x : a)); return f.val + o.val === s + 1; }); })));
      T('Nach dem Fallen zeigt die gewürfelte Zahl nach vorn', await p.evaluate(() => [4, 6, 8, 10, 12, 20].every((s) => { const g = d3geo(s); for (let v = 1; v <= s; v++) { const t = d3target(g, v, 0); const n = Q.rot(t.q, t.f.n); if (n[2] < 0.999 || t.f.val !== v) return false; } return true; })));
      T('10 Spieler-Designs + Heldenbuch + Spielleitung', await p.evaluate(() => D3_PLAYER.length === 10 && !!D3_SETS.klassik && D3_SETS.schatten.dm && !D3_PLAYER.includes('schatten')));
      T('Jedes Spieler-Design hat eine eigene Form', await p.evaluate(() => new Set(D3_PLAYER.map((k) => (D3_SETS[k].style || '') + '|' + (D3_SETS[k].extras || []).join(','))).size === 10));
      T('Jedes Spieler-Design hat einen eigenen Auftritt bei der 20', await p.evaluate(() => new Set(D3_PLAYER.map((k) => D3_SETS[k].fx20.big)).size === 10));
      T('Alle Designs × alle Würfel zeichnen fehlerfrei', await p.evaluate(() => Object.keys(D3_SETS).every((id) => [4, 6, 8, 10, 12, 20, 100].every((sd) => /<path d="M/.test(d3svg(sd, sd === 100 ? 42 : sd, id))))));
      T('Leistung: ein W20-Bild < 2 ms', await p.evaluate(() => { const g = d3geo(20); const t0 = performance.now(); for (let i = 0; i < 300; i++) d3draw(g, D3_SETS.arkanum, Q.axis([1, 2, 3], i / 10), {}); return (performance.now() - t0) / 300 < 2; }));
    }
    /* Auswahl */
    await p.evaluate(() => XA.diceOpen());
    T(dev.n + ': Auswahl zeigt 11 Karten (ohne SL-Set)', await p.evaluate(() => document.querySelectorAll('.d3card').length === 11));
    if (shots) await p.screenshot({ path: path.join(shots, 'dice-' + dev.n + '-auswahl.png') });
    await p.locator('.d3card[data-arg="frostherz"]').click(); T(dev.n + ': Set wählen speichert am Helden', await p.evaluate(() => cur().dice === 'frostherz' && document.querySelector('.d3card.on').dataset.arg === 'frostherz'));
    await p.evaluate(() => XA.diceSet(null, 'schatten')); T(dev.n + ': SL-Set nicht wählbar', await p.evaluate(() => cur().dice === 'frostherz'));
    /* Raum: vergeben */
    await p.evaluate(() => { S.camp = 'testraum'; S.table = { other: { char: 'Lyra', dice: 'drachenfeuer', diceAt: 1000 } }; XA.diceOpen(); });
    T(dev.n + ': im Raum: vergebenes Set ausgegraut mit Name', await p.evaluate(() => { const c = document.querySelector('.d3card[data-arg="drachenfeuer"]'); return c.disabled && /Lyra/.test(c.textContent); }));
    await p.evaluate(() => XA.diceSet(null, 'drachenfeuer')); T(dev.n + ': vergebenes Set lässt sich nicht nehmen', await p.evaluate(() => cur().dice === 'frostherz'));
    await p.evaluate(() => { cur().diceAt = 5000; S.table = { other: { char: 'Lyra', dice: 'frostherz', diceAt: 2000 } }; d3conflict(); });
    T(dev.n + ': gleichzeitig gewählt → wer früher wählte, behält es', await p.evaluate(() => cur().dice === ''));
    await p.evaluate(() => { cur().dice = 'weltenhain'; cur().diceAt = 1000; S.table = { other: { char: 'Lyra', dice: 'weltenhain', diceAt: 3000 } }; d3conflict(); });
    T(dev.n + ': … und wer früher war, behält sein Set', await p.evaluate(() => cur().dice === 'weltenhain'));
    T(dev.n + ': Set wird an den Tisch übertragen', await p.evaluate(() => meDoc().dice === 'weltenhain'));
    await p.evaluate(() => { S.camp = ''; S.table = {}; S.modal = null; $('#modal').hidden = true; });
    /* Würfe */
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'voll'); pushLog({ label: 'Test', total: 14, detail: 'W20 [14]', sides: 20, nat: 14 }); });
    await p.waitForTimeout(300); T(dev.n + ': Wurf läuft animiert (voll)', await p.evaluate(() => !!document.querySelector('#toast .die.d3.rolling3 svg')));
    await p.locator('#toast').click({ force: true }); await p.waitForTimeout(80); T(dev.n + ': Antippen überspringt', await p.evaluate(() => !!document.querySelector('#toast .die.d3.land') && !document.querySelector('#toast .rolling3')));
    T(dev.n + ': Wurf trägt das Set und wird mit Set geteilt', await p.evaluate(() => S.log[0].dset === 'weltenhain' && myRolls()[0].dset === 'weltenhain' && myRolls()[0].nat === 14));
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'voll'); pushLog({ label: 'Krit', total: 25, detail: 'W20 [20]', sides: 20, nat: 20, crit: true }); }); await p.waitForTimeout(1250);
    T(dev.n + ': natürliche 20: golden + Effekt auf dem Bildschirm', await p.evaluate(() => !!document.querySelector('#toast .die.d3.crit') && !!document.querySelector('#toast .d3fx.n20 .d3ray') && !!document.querySelector('.d3stage.big-sparks, .d3stage[class*=big-]') && document.querySelectorAll('.d3stage .d3p').length > 15));
    if (shots) await p.screenshot({ path: path.join(shots, 'dice-' + dev.n + '-n20.png') });
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'ruhig'); pushLog({ label: 'Patzer', total: 3, detail: 'W20 [1]', sides: 20, nat: 1, fumble: true }); }); await p.waitForTimeout(150);
    T(dev.n + ': ruhig: sofort fertig, Risse im Würfel und im Bild, kein Beben', await p.evaluate(() => !!document.querySelector('#toast .die.d3.fum .d3crk') && !document.querySelector('#toast .rolling3') && !!document.querySelector('.n1stage .n1-cracks path') && !document.body.classList.contains('d3quake')));
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'voll'); XA.diceTry(null, 'n1'); }); await p.waitForTimeout(1050);
    T(dev.n + ': natürliche 1 (voll): Bildschirm bebt, Risse im Bild', await p.evaluate(() => document.body.classList.contains('d3quake') && document.querySelectorAll('.n1stage .n1-cracks path').length >= 14));
    if (shots) await p.screenshot({ path: path.join(shots, 'dice-' + dev.n + '-n1.png') });
    await p.waitForTimeout(2400);
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); pushLog({ label: 'Aus', total: 20, detail: 'W20 [20]', sides: 20, nat: 20, crit: true }); }); await p.waitForTimeout(150);
    T(dev.n + ': aus: kein Effekt', await p.evaluate(() => !document.querySelector('#toast .d3fx')));
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'voll'); pushLog({ label: '8W6', total: 28, detail: '8W6', groups: [{ sides: 6, rolls: [6, 3, 4, 1, 5, 2, 6, 1], sign: 1 }] }); }); await p.waitForTimeout(1600);
    T(dev.n + ': viele Würfel: alle im Design gelandet', await p.evaluate(() => document.querySelectorAll('#tray .die.d3.land').length === 8));
    await p.evaluate(() => { const n = S.log.length; XA.diceTry(null, 'n20'); window.__n = n; });
    T(dev.n + ': Probewurf wird nicht an den Tisch geteilt', await p.evaluate(() => S.log[0].preview === true && !myRolls().some((r) => r.label === 'Probewurf')));
    await p.evaluate(() => { localStorage.setItem('hb_dice_snd', '1'); d3snd('roll', 2); d3snd('land'); d3snd('n20'); d3snd('n1'); });
    T(dev.n + ': Geräusche ohne Fehler', true);
    await p.evaluate(() => localStorage.setItem('hb_dice_snd', '0'));
    /* Fremder Wurf am Tisch im fremden Design */
    await p.evaluate(() => miniToast({ char: 'Lyra', cls: 'wiz' }, { label: 'Angriff', total: 21, sides: 20, nat: 20, crit: true, dset: 'chaosprisma' }));
    T(dev.n + ': Wurf anderer Spieler erscheint mit ihrem Würfel', await p.evaluate(() => !!document.querySelector('#mini .mdie svg')));
    T(dev.n + ': Abschluss-Schritt zeigt Würfel-Set', await p.evaluate(() => { S.view = 'build'; S.step = 6; render(); return !!document.querySelector('.d3row'); }));
    T(dev.n + ': keine waagrechte Scrollleiste', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await ctx.close();
  }
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
