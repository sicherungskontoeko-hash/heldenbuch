/* Regressionen zum Kritischen Audit A01–A06 (je zwei Negativtests + ein Positivfall), Aufruf: node tests/audit2.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(400);
  const res = await p.evaluate(async () => {
    const out = []; const T = (id, name, got, want) => out.push({ id, name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let q = []; const seq = (...v) => { q = v.map((n) => (n - 0.5) / 20); }; Math.random = () => (q.length ? q.shift() : 0.5);
    const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'T' }, o))); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.hp = derive(ch, S.hb).hpMax; return ch; };
    const click = (act, arg) => { const t = document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; document.body.appendChild(t); t.click(); t.remove(); };
    const clean = () => { S.dp = null; S.sa = null; orbPrompt(''); const m = document.getElementById('modal'); m.hidden = true; S.modal = null; };
    const fight = () => { S.camp = 'testraum'; S.combat = { id: 'k', active: true, round: 1, turn: 'p:' + UID, npcs: [{ id: 'A', name: 'Ork A', v: 10, hp: 15, hpMax: 15, cond: [] }, { id: 'B', name: 'Ork B', v: 9, hp: 15, hpMax: 15, cond: [] }] }; };
    const nofight = () => { S.camp = ''; S.combat = null; S.tgt = ''; };
    S.rules = { strict: true };
    /* A01 Bedrängen */
    { fight(); const ch = mk({ cls: 'fig', level: 5 }); turnReset(ch); S.tgt = 'n:A'; const c = derive(ch, S.hb);
      masteryHit(ch, c, { mastery: 'vex', ab: 'str', melee: true }, { tgt: 'n:A' });
      T('A01', 'Positiv: nächster Angriff gegen dasselbe Ziel mit Vorteil', rollState('attack:str:melee').adv.includes('Bedrängen'), true);
      seq(10, 10); d20(5, 'Angriff', { kind: 'attack:str:melee' }); T('A01', 'Negativ: nach dem Angriff verbraucht', rollState('attack:str:melee').adv.includes('Bedrängen'), false);
      masteryHit(ch, c, { mastery: 'vex', ab: 'str', melee: true }, { tgt: 'n:A' }); turnReset(ch); turnReset(ch); T('A01', 'Negativ: nach Ende des nächsten Zuges abgelaufen', [rollState('attack:str:melee').adv.includes('Bedrängen'), !!(ch.play.fx || {}).vex], [false, false]);
      S.tgt = 'n:B'; masteryHit(ch, c, { mastery: 'vex', ab: 'str', melee: true }, { tgt: 'n:A' }); T('A01', 'Negativ: gilt nicht gegen ein anderes Ziel', rollState('attack:str:melee').adv.includes('Bedrängen'), false); nofight(); clean(); }
    /* A02 Zweitwaffe */
    { const ch = mk({ cls: 'fig', level: 1, weapons: [{ w: 'dagger' }, { w: 'shortsword' }] }); ch.play.localFight = true; turnReset(ch); const n0 = S.log.length;
      weaponAttack(ch, 2, { how: 'bonus', off: true }); await sleep(50); T('A02', 'Negativ: Zweitwaffe ohne vorherigen Angriff – nichts verbraucht', [turnSt(ch).b, turnSt(ch).a, S.log.length === n0], [0, 0, true]);
      seq(15); weaponAttack(ch, 1); await sleep(700); clean(); weaponAttack(ch, 1, { how: 'bonus', off: true }); await sleep(50); T('A02', 'Negativ: dieselbe Waffe zweimal – blockiert', turnSt(ch).b, 0);
      T('A02', 'Zugleiste bietet die Zweitwaffe erst nach dem Angriff an', turnOpts(derive(ch, S.hb)).some((o) => o.id === 'off:2'), true);
      seq(15); weaponAttack(ch, 2, { how: 'bonus', off: true }); await sleep(700); T('A02', 'Positiv: andere leichte Waffe nach Angriff – Bonusaktion verbraucht', turnSt(ch).b, 1); clean(); }
    /* A03 Schild */
    { const ch = mk({ cls: 'wiz', level: 3, spells: ['shield', 'magic-missile'], base: { str: 8, dex: 14, con: 14, int: 15, wis: 10, cha: 10 } }); ch.play.localFight = true; turnReset(ch); const ac0 = derive(ch, S.hb).ac;
      castSpell(ch, 'shield', 1, 'slot'); T('A03', 'Positiv: RK +5 und Reaktion verbraucht', [derive(ch, S.hb).ac - ac0, turnSt(ch).r, +ch.play.slots[1]], [5, 1, 1]);
      turnReset(ch); T('A03', 'Negativ: endet zu Beginn deines nächsten Zuges', derive(ch, S.hb).ac - ac0, 0);
      turnSt(ch).r = 1; castSpell(ch, 'shield', 1, 'slot'); T('A03', 'Negativ: ohne Reaktion kein Schild, kein Platz', [derive(ch, S.hb).ac - ac0, +ch.play.slots[1]], [0, 1]); clean(); }
    /* A04 Zauberausbruch */
    { const burstExplode = typeof window.burstExplode === 'function' ? window.burstExplode : (r) => r; const r1 = burstExplode({ total: 11, detail: '2W8[8,3]', groups: [{ sides: 8, rolls: [8, 3], sign: 1 }] }, 3); /* Math.random 0.5 → W8 = 5 */ T('A04', 'Positiv: eine 8 → ein Zusatz-W8', r1.groups.length === 2 && r1.groups[1].rolls.length === 1, true);
      const r2 = burstExplode({ total: 7, detail: '2W8[4,3]', groups: [{ sides: 8, rolls: [4, 3], sign: 1 }] }, 3); T('A04', 'Negativ: keine 8 → keine Explosion', [r2.groups.length, r2.total], [1, 7]);
      q = [0.99, 0.99, 0.99, 0.99]; const r3 = burstExplode({ total: 16, detail: '2W8[8,8]', groups: [{ sides: 8, rolls: [8, 8], sign: 1 }] }, 2); T('A04', 'Negativ: Kette stoppt bei Zaubermodifikator (2)', (r3.groups[1] || { rolls: [] }).rolls.length, 2);
      const r4 = burstExplode({ total: 8, detail: '1W8[8]', groups: [{ sides: 8, rolls: [8], sign: 1 }] }, 0); T('A04', 'Negativ: Modifikator 0 → keine Explosion', r4.groups.length, 1); }
    /* A05 Niedere Elementare */
    { const ch = mk({ cls: 'wiz', level: 7, spells: ['conjure-minor-elementals'], weapons: [{ w: 'dagger' }], base: { str: 8, dex: 14, con: 14, int: 15, wis: 10, cha: 10 } }); const n0 = S.log.length;
      castSpell(ch, 'conjure-minor-elementals', 4, 'slot'); T('A05', 'Negativ: beim Wirken kein Schadenswurf', [typeof S.log[0].total === 'number', !!ch.play.fx.cme], [false, true]);
      S.dp = { i: 1, a: derive(ch, S.hb).attacks[1], tgt: '', xd: [] }; dmgRoll(ch); T('A05', 'Positiv: Treffer verursacht +2W8', /2W8\[[^\]]*\] Niedere Elementare/.test(S.log[0].detail), true);
      endConc(ch.play); S.dp = { i: 1, a: derive(ch, S.hb).attacks[1], tgt: '', xd: [] }; dmgRoll(ch); T('A05', 'Negativ: nach Konzentrationsende kein Zusatzschaden', /Niedere Elementare/.test(S.log[0].detail), false); clean(); }
    /* A06 Schnellschalter */
    { const ch = mk({ cls: 'ran', level: 5, spells: ['hunters-mark'] }); ch.play.localFight = true; turnReset(ch);
      click('fx', 'hm'); T('A06', 'Negativ: Mal des Jägers lässt sich nicht gratis einschalten', [!!(ch.play.fx || {}).hm, +ch.play.slots[1] || 0, turnSt(ch).b], [false, 0, 0]);
      click('fx', 'bless'); T('A06', 'Positiv: Segnen von Verbündeten eintragen – als solches markiert, eigene Kosten 0', [!!(ch.play.fx || {}).bless, (ch.play.fxSrc || {}).bless, +ch.play.slots[1] || 0, /Verbündeten/.test(S.log[0].detail)], [true, 'ally', 0, true]);
      castSpell(ch, 'hunters-mark', 1, 'slot'); click('fx', 'hm'); T('A06', 'Negativ: Beenden über den Schalter beendet auch die Konzentration', [!!(ch.play.fx || {}).hm, ch.play.conc], [false, null]); clean(); }
    return out;
  });
  let fail = 0; for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.id + ' ' + r.name + (r.ok ? '' : '  → erhalten ' + JSON.stringify(r.got) + ', erwartet ' + JSON.stringify(r.want))); }
  console.log('\n' + (res.length - fail) + ' / ' + res.length + ' bestanden · ' + target + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
