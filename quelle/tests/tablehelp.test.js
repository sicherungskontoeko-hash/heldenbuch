/* Tischhilfen: passive Werte der Gruppe für die SL, Rast für alle (kurz: Trefferwürfel-Frage), nach dem Kampf EP der besiegten Gegner.
   Aufruf: node tests/tablehelp.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); UID = 'me1'; const n = normChar(newChar({ name: 'Mira', cls: 'rog', level: 3 })); S.chars[n.id] = n; S.cur = n.id;
    window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (o) => { Object.assign(S.meta, o); paintCamp(); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: meDoc(), u2: { char: 'Lyra', ac: 13, hp: 20, hpMax: 20, level: 3, pas: [15, 12, 11] }, u3: { char: 'Tor', ac: 17, hp: 30, hpMax: 30, level: 3, pas: [10, 10, 9] } }; S.combat = null; S.view = 'camp'; render(); });
  T('Der eigene Held schickt seine passiven Werte mit', await p.evaluate(() => Array.isArray(meDoc().pas) && meDoc().pas.length === 3 && meDoc().pas[0] >= 8));
  T('SL sieht in „Die Gruppe“: Wahrn. 15 · Motiv 12 · Nachf. 11', await p.evaluate(() => /Wahrn\. 15 · Motiv 12 · Nachf\. 11/.test(partyHtml().replace(/<[^>]+>/g, ''))));
  await p.evaluate(() => { S.meta.dm = 'u2'; });
  T('Spieler sehen die passiven Werte nicht', await p.evaluate(() => !/Wahrn\./.test(partyHtml())));
  await p.evaluate(() => { S.meta.dm = 'me1'; render(); });
  /* Rast für alle */
  await p.evaluate(() => { XA.grpRest(null, 'short'); });
  T('SL (spielt nicht mit): „Kurze Rast“ verschickt die Rast, ohne eigenen Helden zu rasten', await p.evaluate(() => S.meta.rest && S.meta.rest.kind === 'short' && !$('#modal').hidden === false));
  await p.evaluate(() => { const ch = S.chars[S.cur]; ch.play.camps = { raum: 1 }; ch.play.restSeen = 'alt'; ch.play.hp = 5; S.meta.dm = 'u2'; S.meta.rest = { id: 'r9', kind: 'short', t: Date.now() }; applyMeta(); });
  T('Spieler: kurze Rast der SL öffnet den Dialog mit Trefferwürfeln', await p.evaluate(() => !$('#modal').hidden && /Trefferw/.test($('#modal').textContent)), await p.evaluate(() => $('#modal').textContent.slice(0, 120)));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; S.meta.dm = 'me1'; });
  /* Kampfende */
  await p.evaluate(() => { S.combat = { id: 'k', active: true, round: 3, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 2 }, { mid: 'goblin-boss', n: 1 }], '', {}); S.combat.npcs[0].hp = 0; S.combat.npcs[1].hp = 0; render(); });
  await p.evaluate(() => { $('#fightBox [data-act="fightEnd"]').click(); }); await p.waitForTimeout(150);
  await p.evaluate(() => { const y = document.querySelector('#modal [data-act="fightEnd"]'); if (y) y.click(); }); await p.waitForTimeout(250);
  T('Nach dem Kampf: „2 Gegner besiegt · 2× Goblin-Krieger · 100 EP (50 je Held)“', await p.evaluate(() => { const bx = $('#fightBox .fdone'); return bx && /2 Gegner besiegt/.test(bx.textContent) && /2× Goblin-Krieger/.test(bx.textContent) && /100 EP/.test(bx.textContent) && /50 je Held/.test(bx.textContent); }), await p.evaluate(() => ($('#fightBox .fdone') || {}).textContent || S.fightDone));
  await p.evaluate(() => $('#fightBox [data-act="fdXp"]').click()); await p.waitForTimeout(150);
  T('„EP verteilen“ füllt das Formular (50 EP an alle), Kasten verschwindet', await p.evaluate(() => S.gPre && S.gPre.xp === 50 && S.gPre.to === 'all' && !$('#fightBox .fdone')));
  T('Handy: kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
