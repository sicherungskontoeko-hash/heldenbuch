/* Regressionstests zu HB-01 … HB-11 (Korrekturauftrag vom 20.10.2026).
   Aufruf: node tests/hb.test.js [pfad/zur/app.html]   – ohne Pfad wird ../index.html getestet.
   Jeder Test prüft den Spielzustand (Zauberplätze, TP, Ressourcen, Aktionen) – nicht nur Meldungen. */
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
    const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'T' }, o))); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'sheet'; ch.play.hp = derive(ch, S.hb).hpMax; return ch; };
    const click = (act, arg, extra) => { const t = document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; Object.assign(t.dataset, extra || {}); document.body.appendChild(t); t.click(); t.remove(); };
    const closeAll = () => { const m = document.getElementById('modal'); m.hidden = true; S.modal = null; orbPrompt(''); S.dp = null; S.sa = null; };
    S.rules = { strict: true };
    const WIZ = { cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 15, wis: 10, cha: 10 } };
    /* HB-01 Zauberzugang ausserhalb des Kampfes */
    { const ch = mk(Object.assign({ spells: [] }, WIZ)); castSpell(ch, 'fireball', 3, 'slot'); T('HB-01', 'Unvorbereiteter Feuerball: kein Platz verbraucht', [+ch.play.slots[3] || 0, S.log[0] && S.log[0].total], [0, '✗']); closeAll(); }
    { const ch = mk(Object.assign({ spells: ['fireball'] }, WIZ)); castSpell(ch, 'fireball', 3, 'slot'); T('HB-01', 'Vorbereiteter Feuerball: Platz verbraucht', +ch.play.slots[3] || 0, 1); closeAll(); }
    { const ch = mk({ cls: 'cle', level: 3, sub: 'life', spells: [] }); castSpell(ch, 'bless', 1, 'slot'); T('HB-01', 'Immer vorbereitet (Domäne): erlaubt', +ch.play.slots[1] || 0, 1); closeAll(); }
    { const ch = mk({ cls: 'fig', level: 3, species: 'tiefling', speciesChoice: Object.keys(SPECIES.tiefling.choice.opts).find((k) => /infern/i.test(k)) || Object.keys(SPECIES.tiefling.choice.opts)[0] }); const c = derive(ch, S.hb); const ex = c.extraSpells.find((e) => getSpell(e.id).lvl === 1); let ok = null; if (ex) { const fr = freeRes(c, getSpell(ex.id)); castSpell(ch, ex.id, 1, 'free', fr && fr.k); ok = S.log[0].total !== '✗'; } T('HB-01', 'Spezieszauber (Tiefling Stufe 3) gratis erlaubt', ok, true); closeAll(); }
    { S.hb.hbx = { id: 'hbx', kind: 'spell', name: 'Testblitz', lvl: 1, school: 'evo', classes: ['wiz'], time: 'Aktion', range: '18 m', comp: 'V', dur: 'Sofort', text: 'Testzauber: 2W6 Blitzschaden.' }; const ch = mk(Object.assign({ spells: ['hb:hbx'] }, WIZ)); castSpell(ch, 'hb:hbx', 1, 'slot'); T('HB-01', 'Hausregel-Zauber (vorbereitet) erlaubt', +ch.play.slots[1] || 0, 1); delete S.hb.hbx; closeAll(); }
    /* HB-02 Rüstung ohne Übung */
    { const ch = mk(Object.assign({ spells: ['magic-missile'], armor: 'chainmail' }, WIZ)); castSpell(ch, 'magic-missile', 1, 'slot'); T('HB-02', 'Kettenpanzer ohne Übung: kein Zauber, kein Platz', +ch.play.slots[1] || 0, 0); closeAll(); }
    { const ch = mk(Object.assign({ spells: ['magic-missile'], shield: true }, WIZ)); castSpell(ch, 'magic-missile', 1, 'slot'); T('HB-02', 'Schild ohne Übung: Zaubern erlaubt (nur kein RK-Bonus, 2024)', +ch.play.slots[1] || 0, 1); closeAll(); }
    /* HB-03 Trefferwürfel im Kampf */
    { const ch = mk({ cls: 'fig', level: 5 }); ch.play.localFight = true; ch.play.hp = 1; click('spendHd'); T('HB-03', 'Kampf: kein Rast-Dialog, keine Heilung', [S.modal === 'srest', ch.play.hp, +ch.play.hdUsed || 0], [false, 1, 0]); closeAll(); }
    /* HB-04 Abgebrochene kurze Rast */
    { const ch = mk({ cls: 'fig', level: 5 }); ch.play.hp = 5; click('rest', 'short'); click('srHd', '10', { d: '1' }); click('srCancel'); T('HB-04', 'Abbruch: keine Heilung, kein Trefferwürfel', [ch.play.hp, +ch.play.hdUsed || 0], [5, 0]);
      click('rest', 'short'); click('srHd', '10', { d: '1' }); click('srDone'); T('HB-04', 'Abschluss: 1 Trefferwürfel verbucht, TP gestiegen', [+ch.play.hdUsed, ch.play.hp > 5], [1, true]); closeAll(); }
    /* HB-05 Tiergestalt erst nach Auswahl verbuchen */
    { const ch = mk({ cls: 'dru', level: 2, sub: '' }); turnRun(ch, 'f:wshape'); const r1 = [+ch.play.res.ws || 0, turnSt(ch).b]; click('mastNo'); T('HB-05', 'Öffnen + Abbrechen: 0 Verbrauch', r1, [0, 0]);
      XA.wsGo(null, 'giant-eagle', '', ch); T('HB-05', 'Unerlaubte Form (Stufe 2): 0 Verbrauch', [+ch.play.res.ws || 0, !!ch.play.ws], [0, false]);
      XA.wsGo(null, 'wolf', '', ch); T('HB-05', 'Gültige Form: 1 Nutzung + Bonusaktion', [+ch.play.res.ws, turnSt(ch).b, ch.play.ws], [1, 1, 'wolf']); closeAll(); }
    /* HB-06/07 Zielbindung Mal des Jägers / Verhexen */
    { const ch = mk({ cls: 'ran', level: 5, weapons: [{ w: 'longbow' }] }); ch.play.fx = { hm: true, hmTgt: 'n:A' }; S.dp = { i: 1, a: derive(ch, S.hb).attacks[1], tgt: '', xd: [], hm: true }; dmgRoll(ch); T('HB-06', 'Mal des Jägers ohne Ziel: kein Zusatzschaden', /Mal des Jägers/.test(S.log[0].detail), false); closeAll(); }
    { const ch = mk({ cls: 'wlk', level: 5, weapons: [{ w: 'dagger' }] }); ch.play.fx = { hex: true, hexTgt: 'n:A' }; S.dp = { i: 1, a: derive(ch, S.hb).attacks[1], tgt: 'n:other', xd: [], hex: true }; dmgRoll(ch); T('HB-07', 'Verhexen gegen falsches Ziel (erzwungen): kein Zusatzschaden', /Verhexen/.test(S.log[0].detail), false);
      ch.play.fx = { hex: true }; S.dp = { i: 1, a: derive(ch, S.hb).attacks[1], tgt: '', xd: [] }; dmgRoll(ch); T('HB-07', 'Verhexen ohne festes Ziel (ausserhalb Kampf): Zusatzschaden', /Verhexen/.test(S.log[0].detail), true); closeAll(); }
    /* HB-08 Zielwechsel nur nach Fall des alten Ziels */
    { const ch = mk({ cls: 'ran', level: 5 }); S.camp = 'testraum'; S.combat = { id: 'k', active: true, round: 1, turn: 'p:' + UID, npcs: [{ id: 'A', name: 'Ork A', v: 10, hp: 5, hpMax: 10 }, { id: 'B', name: 'Ork B', v: 9, hp: 10, hpMax: 10 }] }; turnReset(ch);
      ch.play.fx = { hm: true, hmTgt: 'n:A' }; S.tgt = 'n:B'; turnRun(ch, 'f:hmmove'); T('HB-08', 'Altes Ziel lebt: kein Wechsel, keine Bonusaktion', [ch.play.fx.hmTgt, turnSt(ch).b], ['n:A', 0]);
      S.combat.npcs[0].hp = 0; turnRun(ch, 'f:hmmove'); T('HB-08', 'Altes Ziel bei 0 TP: Wechsel mit Bonusaktion', [ch.play.fx.hmTgt, turnSt(ch).b], ['n:B', 1]);
      ch.play.fx = { hex: true, hexTgt: 'n:B' }; S.tgt = 'n:A'; turnReset(ch); S.combat.npcs[1].hp = 4; S.combat.npcs[0].hp = 6; turnRun(ch, 'f:hexmove'); T('HB-08', 'Verhexen: lebendes Ziel, kein Wechsel', [ch.play.fx.hexTgt, turnSt(ch).b], ['n:B', 0]);
      S.camp = ''; S.combat = null; S.tgt = ''; closeAll(); }
    /* HB-09 Ritual nur aus dem Zauberbuch */
    { const ch = mk(Object.assign({ spells: [] }, WIZ)); castSpell(ch, 'detect-magic', 1, 'ritual'); T('HB-09', 'Magier ohne Buch-Eintrag: kein Ritual', S.log[0].total, '✗'); closeAll();
      ch.book = ['detect-magic']; castSpell(ch, 'detect-magic', 1, 'ritual'); T('HB-09', 'Ritual aus dem Zauberbuch: erlaubt, kein Platz', [S.log[0].total !== '✗', +ch.play.slots[1] || 0], [true, 0]); closeAll(); }
    /* HB-10 Gleichzeitige Änderungen derselben Kreatur */
    { const base = { id: 'k', npcs: [{ id: 'A', hp: 10, cond: [] }], log: [] }; const A = { id: 'k', npcs: [{ id: 'A', hp: 3, cond: [] }], log: [] }; const B = { id: 'k', npcs: [{ id: 'A', hp: 10, cond: ['prone'] }], log: [] };
      const m = mergeCombat(base, A, B); T('HB-10', 'TP von Gerät A + Zustand von Gerät B', [m.npcs[0].hp, m.npcs[0].cond], [3, ['prone']]);
      const C = { id: 'k', npcs: [{ id: 'A', hp: 10, cond: ['poisoned'], v: 15 }], log: [] }; const m2 = mergeCombat(base, C, m); T('HB-10', 'Drittes Gerät: Initiative + weiterer Zustand', [m2.npcs[0].hp, m2.npcs[0].cond.slice().sort(), m2.npcs[0].v], [3, ['poisoned', 'prone'], 15]);
      const E1 = { id: 'k', npcs: [{ id: 'A', hp: 10, cond: [] }], effects: [{ id: 'e1', name: 'Segnen', left: 10 }], log: [] }; const m3 = mergeCombat(Object.assign({ effects: [] }, base), E1, Object.assign({ effects: [] }, m2)); T('HB-10', 'Effekt von Gerät D bleibt erhalten', [m3.effects.length, m3.npcs[0].hp], [1, 3]); }
    /* HB-11 Hartes Zulässigkeitsmodell */
    { const ch = mk(Object.assign({ spells: [] }, WIZ)); S.rules.strict = false; castSpell(ch, 'magic-missile', 1, 'slot'); const lax = +ch.play.slots[1] || 0; castSpell(ch, 'fireball', 2, 'slot'); const low = +ch.play.slots[2] || 0; S.rules.strict = true;
      T('HB-11', 'Locker: Zugang als Hausregel freigebbar, zu niedriger Grad bleibt verboten', [lax, low], [1, 0]); closeAll(); }
    { const ch = mk(Object.assign({ spells: [], armor: 'plate' }, WIZ)); ch.play.slots = { 1: 4, 2: 3, 3: 2 }; castSpell(ch, 'fireball', 3, 'slot'); T('HB-11', 'Kombi: unbekannt + Plattenpanzer + kein Platz frei → nichts verändert', JSON.stringify(ch.play.slots), JSON.stringify({ 1: 4, 2: 3, 3: 2 })); closeAll(); }
    { const ch = mk(Object.assign({ spells: ['magic-missile'] }, WIZ)); ch.play.hp = 0; ch.play.cond = ['unconscious', 'incapacitated']; castSpell(ch, 'magic-missile', 1, 'slot'); T('HB-11', 'Bewusstlos ausserhalb des Kampfes: kein Zauber', +ch.play.slots[1] || 0, 0); closeAll(); }
    return out;
  });
  let fail = 0; for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.id + ' ' + r.name + (r.ok ? '' : '  → erhalten ' + JSON.stringify(r.got) + ', erwartet ' + JSON.stringify(r.want))); }
  console.log('\n' + (res.length - fail) + ' / ' + res.length + ' bestanden · ' + target + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
