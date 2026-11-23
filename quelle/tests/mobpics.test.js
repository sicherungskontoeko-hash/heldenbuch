/* Monsterbilder: ein Bild für jeden Bestiarium-Eintrag, alle gehören zu Bestiarium-Einträgen, erscheinen in Liste, Detail, Kampfreihenfolge und Gegnerdialog.
   Aufruf: node tests/mobpics.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { window.ADV_IDS = new Set([ADV_MACHTADER, ADV_KRUG].flatMap((A) => A.mobs.map((o) => 'u-' + o.id))); });
  T('Jeder Bestiarium-Eintrag hat ein Bild, keine Bilder ohne Eintrag', await p.evaluate(() => Object.keys(BESTIARY).every((k) => MOB_PIC[k]) && Object.keys(MOB_PIC).every((k) => BESTIARY[k] || ADV_IDS.has(k))), await p.evaluate(() => Object.keys(MOB_PIC).filter((k) => !BESTIARY[k] && !ADV_IDS.has(k))));
  T('Alle Kreaturen der eingebauten Abenteuer haben ein Bild', await p.evaluate(() => [ADV_MACHTADER, ADV_KRUG].every((A) => A.mobs.every((o) => MOB_PIC['u-' + o.id]))), await p.evaluate(() => [ADV_MACHTADER, ADV_KRUG].flatMap((A) => A.mobs.filter((o) => !MOB_PIC['u-' + o.id]).map((o) => o.id))));
  T('Neue Bilder sind klein (je höchstens 8 KB)', await p.evaluate(() => Object.values(MOB_PIC).every((u) => u.length < 8 * 1024 * 4 / 3 + 40)));
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); advMobsInstall(ADV_KRUG); S.view = 'mobs'; render(); });
  T('Abenteuer-Kreatur im Bestiarium mit Bild', await p.evaluate(() => !!BESTIARY['u-krug-knut'] && [...document.querySelectorAll('details.mob.haspic')].some((d) => /Knut/.test(d.textContent))));
  T('Bestiarium: alle Einträge mit Bild', await p.evaluate(() => document.querySelectorAll('details.mob.haspic .mpic').length === Object.keys(BESTIARY).length));
  T('Bilder laden (WebP)', await p.evaluate(async () => { const i = document.querySelector('details.mob.haspic .mpic'); i.loading = 'eager'; await i.decode().catch(() => {}); return i.naturalHeight === 96; }));
  T('Detail zeigt das grosse Bild', await p.evaluate(() => !!document.querySelector('details.mob.haspic .mpicL')));
  T('Handy: kein Querscrollen im Bestiarium', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  await p.evaluate(() => { UID = 'me1'; const n = normChar(newChar({ name: 'Mira', cls: 'fig', level: 5 })); S.chars[n.id] = n; S.cur = n.id; window.saveCombat = (c) => { S.combat = c; paintCamp(); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', ac: 16, level: 5 } }; S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] };
    encInsert([{ mid: 'troll', n: 1 }, { mid: 'bandit', n: 1 }], '', {}); S.combat.npcs[0].v = 30; S.combat.npcs[1].v = 5; S.view = 'camp'; render(); nextTurn(); });
  T('Kampfreihenfolge: Troll und Bandit mit Bild', await p.evaluate(() => { const li = [...document.querySelectorAll('#fightBox .order li')].find((l) => /Bandit/.test(l.textContent)); return !!document.querySelector('#fightBox .order img.sigil.pic') && !!li && !!li.querySelector('img.sigil.pic'); }));
  T('Gegnerzug-Kasten mit Bild', await p.evaluate(() => !!document.querySelector('#fightBox .nturn .mpicT')));
  await p.evaluate(() => XA.npcOpen(null, S.combat.npcs[0].id));
  T('⋯-Dialog mit Bild', await p.evaluate(() => !!document.querySelector('#modal .mpicD')));
  T('Jeder Begleiter hat ein Bild (eigener: Platzhalter)', await p.evaluate(() => Object.keys(COMPANIONS).every((k) => compPicSrc(k))), await p.evaluate(() => Object.keys(COMPANIONS).filter((k) => !compPicSrc(k))));
  T('Eigenes Monster ohne Bild: Platzhalter; fremder Schlüssel: kein Bild', await p.evaluate(() => mobPicSrc('u-xyz') === MOB_PH && mobPicSrc('gibtsnicht') === ''));
  await p.evaluate(() => { XA.closeModal && XA.closeModal(); const c = cur(); c.comps = [{ t: 'f-owl' }, { t: 'steed' }, { t: 'custom', name: 'Äthermaschine' }]; S.view = 'sheet'; render(); });
  T('Bogen: alle drei Begleiter mit Bild', await p.evaluate(() => { const b = [...document.querySelectorAll('#compBlk .comp')]; return b.length === 3 && b.every((x) => x.querySelector('.chd.wp img.cmpic')); }));
  T('Handy: Begleiter ohne Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
