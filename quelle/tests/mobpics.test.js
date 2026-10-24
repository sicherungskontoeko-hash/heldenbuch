/* Monsterbilder: 75 Bilder, alle gehören zu Bestiarium-Einträgen, erscheinen in Liste, Detail, Kampfreihenfolge und Gegnerdialog.
   Aufruf: node tests/mobpics.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  T('75 Bilder, alle mit Bestiarium-Eintrag', await p.evaluate(() => Object.keys(MOB_PIC).length === 75 && Object.keys(MOB_PIC).every((k) => BESTIARY[k])), await p.evaluate(() => Object.keys(MOB_PIC).filter((k) => !BESTIARY[k])));
  T('Falsche Bilder sind nicht dabei (z. B. Akolyth, Grick, Couatl)', await p.evaluate(() => !MOB_PIC.acolyte && !MOB_PIC.grick && !MOB_PIC.couatl && !MOB_PIC['rug-of-smothering']));
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); S.view = 'mobs'; render(); });
  T('Bestiarium: 75 Einträge mit Bild, die übrigen ohne', await p.evaluate(() => document.querySelectorAll('details.mob.haspic .mpic').length === 75));
  T('Bilder laden (WebP)', await p.evaluate(async () => { const i = document.querySelector('details.mob.haspic .mpic'); i.loading = 'eager'; await i.decode().catch(() => {}); return i.naturalHeight === 96; }));
  T('Detail zeigt das grosse Bild', await p.evaluate(() => !!document.querySelector('details.mob.haspic .mpicL')));
  T('Handy: kein Querscrollen im Bestiarium', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  await p.evaluate(() => { UID = 'me1'; const n = normChar(newChar({ name: 'Mira', cls: 'fig', level: 5 })); S.chars[n.id] = n; S.cur = n.id; window.saveCombat = (c) => { S.combat = c; paintCamp(); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', ac: 16, level: 5 } }; S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] };
    encInsert([{ mid: 'troll', n: 1 }, { mid: 'bandit', n: 1 }], '', {}); S.combat.npcs[0].v = 30; S.combat.npcs[1].v = 5; S.view = 'camp'; render(); nextTurn(); });
  T('Kampfreihenfolge: Troll mit Bild, Bandit mit ⚔', await p.evaluate(() => !!document.querySelector('#fightBox .order img.sigil.pic') && /⚔/.test([...document.querySelectorAll('#fightBox .order li')].find((l) => /Bandit/.test(l.textContent)).textContent)));
  T('Gegnerzug-Kasten mit Bild', await p.evaluate(() => !!document.querySelector('#fightBox .nturn .mpicT')));
  await p.evaluate(() => XA.npcOpen(null, S.combat.npcs[0].id));
  T('⋯-Dialog mit Bild', await p.evaluate(() => !!document.querySelector('#modal .mpicD')));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
