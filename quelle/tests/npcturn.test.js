/* Gegnerzug: Kasten „… ist am Zug“ mit Angriffen, Zähler nach Mehrfachangriff, „Zug beenden“; Zähler beginnt jeden Zug neu,
   Angriffe ausserhalb des eigenen Zuges zählen nicht, die SL wird nie gesperrt. Aufruf: node tests/npcturn.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); UID = 'me1'; const n = normChar(newChar({ name: 'Mira', cls: 'fig', level: 5 })); S.chars[n.id] = n; S.cur = n.id;
    window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (o) => { Object.assign(S.meta, o); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', ac: 16, level: 5 }, u2: { char: 'Lyra', ac: 13, level: 5, init: { cid: 'k', v: 1 } } };
    S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'troll', n: 1 }, { mid: 'goblin', n: 1 }], '', {});
    S.combat.npcs[0].v = 30; S.combat.npcs[1].v = 20; S.view = 'camp'; render(); });
  T('Mehrfachangriff erkannt: Troll 3, Goblin 1, Grubenscheusal 4, Ghul 2', await p.evaluate(() => mobAtkMax('troll') === 3 && mobAtkMax('goblin') === 1 && mobAtkMax('pit-fiend') === 4 && mobAtkMax('ghoul') === 2));
  await p.evaluate(() => { nextTurn(); });
  const tid = await p.evaluate(() => S.combat.npcs[0].id);
  T('Troll am Zug: Kasten mit Angriffen und „Zug beenden“', await p.evaluate(() => { const bx = $('#fightBox .nturn'); return bx && /Troll A? ?ist am Zug|ist am Zug/.test(bx.textContent) && /Angriffe 0 von 3/.test(bx.textContent) && bx.querySelectorAll('[data-act="npcAtk"]').length >= 1 && !!bx.querySelector('[data-act="turnEnd"]'); }), await p.evaluate(() => ($('#fightBox .nturn') || {}).textContent));
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { $('#fightBox .nturn [data-act="npcAtk"]').click(); }); await p.waitForTimeout(250); await p.evaluate(() => { if (S.npcA && S.npcA.name) XA.npcMiss(); }); }
  T('Nach drei Angriffen: „3 von 3“, Hinweis und Zug beenden hervorgehoben', await p.evaluate(() => { const bx = $('#fightBox .nturn'); return /Angriffe 3 von 3/.test(bx.textContent) && bx.classList.contains('done') && bx.querySelector('[data-act="turnEnd"]').classList.contains('glowbtn'); }));
  T('Keine Sperre: Angriffe bleiben anklickbar', await p.evaluate(() => [...document.querySelectorAll('#fightBox .nturn [data-act="npcAtk"]')].every((x) => !x.disabled)));
  await p.evaluate(() => { $('#fightBox .nturn [data-act="turnEnd"]').click(); });
  await p.waitForTimeout(200);
  T('„Zug beenden“: Goblin ist dran, Kasten zeigt ihn mit 0 von 1', await p.evaluate(() => /Goblin/.test(curEntry().name) && /Angriffe 0 von 1/.test($('#fightBox .nturn').textContent)));
  await p.evaluate((id) => { XA.npcAtk({ dataset: { j: '0' } }, id); }, tid); await p.waitForTimeout(250); await p.evaluate(() => { if (S.npcA && S.npcA.name) XA.npcMiss(); });
  T('Angriff des Trolls ausserhalb seines Zuges (Gelegenheitsangriff) zählt nicht', await p.evaluate((id) => S.combat.npcs.find((x) => x.id === id).atkN === 3, tid));
  await p.evaluate(() => { nextTurn(); nextTurn(); });
  T('Neuer Zug des Trolls: Zähler wieder 0', await p.evaluate((id) => curEntry().id === id && !S.combat.npcs.find((x) => x.id === id).atkN && /Angriffe 0 von 3/.test($('#fightBox .nturn').textContent), tid), await p.evaluate(() => [curEntry(), S.combat.npcs.map((x) => x.atkN)]));
  await p.evaluate((id) => { XA.npcOpen(null, id); }, tid);
  T('⋯-Dialog zeigt „0 von 3 diesen Zug“', await p.evaluate(() => /0 von 3 diesen Zug/.test($('#modal').textContent)));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; S.meta.dm = 'u2'; render(); });
  T('Spieler sehen den Kasten nicht', await p.evaluate(() => !$('#fightBox .nturn')));
  T('Handy: kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
