/* Rettungswürfe der Monster: Werte aus dem SRD, Knöpfe im Bestiarium und im Gegnerdialog, Sammel-Rettungswurf mit Attribut,
   keine Sonderwirkung bei 20/1, gelähmt → STÄ/GES misslingen. Aufruf: node tests/mobsaves.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  T('Rettungswürfe für die meisten Monster (Troll: STÄ +4, KON +5)', await p.evaluate(() => Object.keys(MOB_SAVES).length >= 160 && MOB_SAVES.troll[0] === 4 && MOB_SAVES.troll[2] === 5));
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); S.view = 'mobs'; render(); });
  T('Bestiarium: Zeile „Rettungswürfe“ mit sechs Würfelknöpfen', await p.evaluate(() => { const r = document.querySelector('details.mob .msaves'); return r && r.querySelectorAll('[data-act="xroll"]').length === 6; }));
  await p.evaluate(() => { UID = 'me1'; const n = normChar(newChar({ name: 'Mira', cls: 'fig', level: 5 })); S.chars[n.id] = n; S.cur = n.id; window.saveCombat = (c) => { S.combat = c; paintCamp(); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', ac: 16 } }; S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 3 }], '', {}); S.view = 'camp'; render(); });
  await p.evaluate(() => XA.npcOpen(null, S.combat.npcs[0].id));
  T('Gegnerdialog: Rettungswürfe würfelbar', await p.evaluate(() => document.querySelectorAll('#modal .msaves [data-act="xroll"]').length === 6));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; S.npcSel = S.combat.npcs.map((x) => x.id); S.combat.npcs[2].cond = ['paralyzed']; render(); });
  T('Sammel-Rettungswurf: Attribut „aus den Werten“ wählbar', await p.evaluate(() => !!$('#bulkAb') && $('#bulkAb').options.length === 7));
  await p.evaluate(() => { $('#bulkAb').value = '1'; $('#bulkDc').value = '30'; $('#bulkSv').value = '0'; window.__r = Math.random; Math.random = () => 0.9999; });
  await p.evaluate(() => document.querySelector('[data-act="bulkSave"]').click());
  const lg = await p.evaluate(() => { Math.random = window.__r; return S.log[0]; });
  T('GES aus den Werten (+2), eine 20 gegen SG 30 misslingt', /Goblin-Krieger 1 22 ✗/.test(lg.detail), lg);
  T('Gelähmter Gegner: GES-Rettungswurf misslingt automatisch', /Goblin-Krieger 3 misslingt automatisch/.test(lg.detail), lg);
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
