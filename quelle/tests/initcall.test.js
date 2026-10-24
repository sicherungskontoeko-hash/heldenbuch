/* Kampfstart: grosses Fenster „Würfle Initiative“ für Beteiligte; SL kann optional nur einige auswählen.
   Aufruf: node tests/initcall.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); UID = 'me1'; const n = normChar(newChar({ name: 'Mira', cls: 'fig', level: 3 })); S.chars[n.id] = n; S.cur = n.id;
    window.saveCombat = (c) => { const prev = S.combat; S.combat = c; paintCamp(); }; window.saveMeta = (o) => { Object.assign(S.meta, o); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', pl: 'Manu', ac: 16 }, u2: { char: 'Lyra', pl: 'Sandro', ac: 13 }, u3: { char: 'Tor', ac: 17 } }; S.combat = null; S.view = 'camp'; render(); });
  /* Spielleitung */
  T('SL: „Kampf beginnen“ und daneben „Nur einige …“', await p.evaluate(() => !!$('#fightBox [data-act="fightStart"]') && !!$('#fightBox [data-act="fightPick"]')));
  await p.evaluate(() => $('#fightBox [data-act="fightStart"]').click()); await p.waitForTimeout(450);
  T('Ein Klick startet für alle, SL bekommt kein Fenster', await p.evaluate(() => S.combat.active && !S.combat.inv && $('#modal').hidden && waiting().length === 2));
  await p.evaluate(() => { S.combat = null; render(); $('#fightBox [data-act="fightPick"]').click(); });
  T('„Nur einige …“: Auswahl mit allen Helden, alle vorgewählt', await p.evaluate(() => S.modal === 'fightpick' && document.querySelectorAll('#modal [data-act="fightPickTog"].on').length === 2 && /Lyra/.test($('#modal').textContent)));
  await p.evaluate(() => { $('#modal [data-act="fightPickTog"][data-arg="u3"]').click(); $('#modal [data-act="fightStart"]').click(); });
  await p.waitForTimeout(450);
  T('Kampf nur mit Lyra; Tor steht unter „Noch nicht im Kampf“', await p.evaluate(() => JSON.stringify(S.combat.inv) === '["u2"]' && waiting().map((x) => x.uid).join() === 'u2' && awayList().map((x) => x.uid).join() === 'u3'));
  /* Spieler */
  await p.evaluate(() => { S.meta.dm = 'u9'; S.initCalled = null; S.myInit = null; S.combat = { id: 'k2', active: true, round: 1, turn: null, npcs: [] }; render(); initCall(); });
  T('Spieler: grosses Fenster „Kampf! … würfle Initiative“', await p.evaluate(() => S.modal === 'initcall' && !$('#modal').hidden && /Kampf!/.test($('#modal').textContent) && !!$('#modal [data-act="initRoll"]')));
  T('Fenster passt aufs Handy', await p.evaluate(() => { const r = $('#modal .dlg').getBoundingClientRect(); return r.left >= 0 && r.right <= 391; }));
  await p.evaluate(() => $('#modal [data-act="initRoll"]').click()); await p.waitForTimeout(500);
  T('Knopf würfelt Initiative und schliesst das Fenster', await p.evaluate(() => S.myInit && S.myInit.cid === 'k2' && !S.myInit.away && $('#modal').hidden));
  await p.evaluate(() => { initCall(); });
  T('Kein zweites Fenster nach dem Wurf', await p.evaluate(() => $('#modal').hidden));
  await p.evaluate(() => { S.initCalled = null; S.myInit = null; S.combat = { id: 'k3', active: true, round: 1, turn: null, npcs: [], inv: ['u2'] }; render(); initCall(); });
  T('Nicht ausgewählt: kein Fenster, „Eingreifen“ in der Zugleiste', await p.evaluate(() => $('#modal').hidden && /Eingreifen/.test($('#turnbar').textContent)));
  await p.evaluate(() => { S.initCalled = null; S.combat = { id: 'k4', active: true, round: 1, turn: null, npcs: [], surp: ['me1'] }; render(); initCall(); });
  T('Überrascht: Hinweis im Fenster', await p.evaluate(() => /überrascht/.test($('#modal').textContent)));
  await p.evaluate(() => $('#modal [data-act="initAway"]').click());
  T('„Noch nicht dabei“ im Fenster', await p.evaluate(() => S.myInit.away && $('#modal').hidden));
  await p.evaluate(() => { S.initCalled = null; S.myInit = null; S.combat = { id: 'k5', active: true, round: 1, turn: null, npcs: [] }; XA.themeOpen && XA.themeOpen(); initCall(); });
  T('Offener Dialog wird nicht verdrängt', await p.evaluate(() => S.modal !== 'initcall'));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; S.camp = 'raum'; localStorage.setItem('heldenbuch_camp', JSON.stringify({ code: 'raum' })); S.myInit = { v: 17, cid: 'k9' }; });
  await p.reload(); await p.waitForTimeout(500);
  T('Eigene Initiative übersteht Neuladen mitten im Kampf', await p.evaluate(() => S.myInit && S.myInit.v === 17 && S.myInit.cid === 'k9'), await p.evaluate(() => S.myInit));
  await p.evaluate(() => { S.camp = 'anderer'; });
  T('… gilt nur für denselben Raum', await p.evaluate(() => S.myInit === null));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
