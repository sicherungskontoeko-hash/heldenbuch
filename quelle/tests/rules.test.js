/* Heldenbuch – Regeltests mit festen Sollwerten.
   Aufruf:  node tests/rules.test.js   (braucht Playwright + Chromium; lädt ../index.html)
   Jeder Test vergleicht einen konkreten Wert und schlägt bei Abweichung fehl (Exit-Code 1). */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html')); await p.waitForTimeout(400);
  const res = await p.evaluate(async () => {
    const out = []; const T = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); out.push({ name, ok, got, want }); };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'Test' }, o))); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'sheet'; return ch; };
    const D = (ch) => derive(ch, S.hb);
    let q = []; const seq = (...v) => { q = v.map((n) => (n - 0.5) / 20); }; Math.random = () => (q.length ? q.shift() : 0.5);
    S.rules = { strict: true }; document.getElementById('mini').innerHTML = '';

    /* 1. Übungsbonus und Grundwerte je Stufe für alle Klassen */
    const pbs = { 1: 2, 3: 2, 5: 3, 7: 3, 11: 4, 17: 6, 20: 6 };
    let bad = [];
    for (const [cid, C] of Object.entries(CLASSES)) for (const L of [1, 3, 5, 7, 11, 17, 20]) { const c = D(newChar({ cls: cid, level: L, sub: C.subs ? C.subs[0].id : '' })); if (c.pb !== pbs[L] || !(c.hpMax > 0) || !Number.isFinite(c.ac)) bad.push(cid + L); }
    T('Übungsbonus/TP/RK alle Klassen 1–20', bad, []);
    /* 2./3. Fehlende Unterklasse */
    { const c = D(newChar({ cls: 'cle', level: 3, sub: '' })); T('Ohne Unterklasse: keine Unterklassen-ID', c.subOf('cle'), null); T('Ohne Unterklasse: Warnung', c.warn.some((w) => /Unterklasse wählen/.test(w)), true); T('Ohne Unterklasse: keine Domänenzauber', c.spell.classes[0].always.includes('bless'), false); }
    { const c = D(newChar({ cls: 'cle', level: 3, sub: 'gibtsnicht' })); T('Ungültige Unterklasse erkannt', c.warn.some((w) => /Unbekannte Unterklasse/.test(w)), true); }
    { const old = normChar({ name: 'Alt', cls: 'cle', level: 5, id: 'old1' }); T('Migration v1→v2 setzt SRD-Unterklasse', [old.sub, old.v], ['life', 2]); }
    { const c = D(newChar({ cls: 'mon', level: 6, sub: 'water' })); T('Ganzheit des Körpers nur Offene Hand', c.res.some((r) => r.k === 'wob'), false); }
    /* 4./5. Zauberplätze */
    T('Magier 5 Plätze', D(newChar({ cls: 'wiz', level: 5 })).spell.slots, [4, 3, 2]);
    { const c = D(newChar({ cls: 'pal', level: 6, multi: [{ cls: 'wlk', level: 3 }] })); T('Paladin 6 / Hexenmeister 3: Plätze + Pakt', [c.spell.slots, c.spell.pact], [[4, 2], { n: 2, lvl: 2 }]); }
    T('Magier 5 / Kleriker 4 Plätze', D(newChar({ cls: 'wiz', level: 5, multi: [{ cls: 'cle', level: 4 }] })).spell.slots, [4, 3, 3, 3, 1]);
    /* Klassenmerkmale */
    T('Zweiter Kampfstil nur Champion', [D(newChar({ cls: 'fig', level: 7, sub: 'champion' })).styleN, D(newChar({ cls: 'fig', level: 7, sub: 'warden' })).styleN], [2, 1]);
    { const a = D(newChar({ cls: 'mon', level: 5, armor: 'none' })); const b2 = D(newChar({ cls: 'mon', level: 5, armor: 'leather' })); T('Kampfkunst ohne/mit Rüstung', [a.attacks[0].die, b2.attacks[0].die, b2.martialArts], ['1W8', '', false]); }
    { const c = D(newChar({ cls: 'wiz', level: 1, shield: true, base: { str: 10, dex: 14, con: 12, int: 15, wis: 10, cha: 8 }, bgPlus: {} })); T('Schild ohne Übung: kein RK-Bonus', c.ac, 12); }
    { const c0 = D(newChar({ cls: 'fig', level: 8 })); const c1 = D(newChar({ cls: 'fig', level: 8, bg: 'custom', bgCustom: { name: 'X', abil: ['str', 'dex', 'con'], skills: ['ath', 'prc'], feat: 'tough' } })); T('Zäh: +2 TP pro Stufe', c1.hpMax - c0.hpMax, 16); }
    { const c = D(newChar({ cls: 'fig', level: 18, multi: [{ cls: 'rog', level: 5 }] })); T('Gesamtstufe gedeckelt', [c.level, c.lv('fig') + c.lv('rog')], [20, 20]); }
    { const c = D(newChar({ cls: 'fig', level: 1, method: 'manual', base: { str: 19, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, bgPlus: { str: 2, con: 1 } })); T('Attribut-Obergrenze 20', c.abil.str, 20); }
    { const c = D(newChar({ cls: 'fig', level: 8, asi: { 4: { feat: 'mi-wiz' }, 6: { feat: 'mi-wiz' } }, mi: { asi4: { spell: 'shield', cantrips: ['light', 'mage-hand'] }, asi6: { spell: 'magic-missile', cantrips: ['light', 'mage-hand'] } } })); const k = c.res.filter((r) => r.k.startsWith('mi_')).map((r) => r.k); T('Magie einweihen 2×: getrennte Ressourcen', new Set(k).size === k.length, true); }
    /* Wurfwaffen */
    { const c = D(newChar({ cls: 'fig', level: 1, weapons: [{ w: 'dagger' }] })); const th = c.attacks.find((a) => a.thrown); T('Dolch geworfen = Fernkampf, gleiches Attribut', th ? [th.ranged, th.melee, th.ab] : null, [true, false, c.attacks.find((a) => a.idx === 0 && !a.thrown).ab]); }
    /* 13. Aktionsökonomie im Kampfmodus */
    { const ch = mk({ cls: 'fig', level: 5 }); ch.play.localFight = true; turnReset(ch); const r1 = tSpend(ch, 'b', 'Test'); const r2 = tSpend(ch, 'b', 'Test'); S.rules.strict = false; const r3 = tSpend(ch, 'b', 'Test'); S.rules.strict = true; T('Zweite Bonusaktion blockiert (streng), erlaubt (locker)', [r1, r2, r3], [true, false, true]); ch.play.localFight = false; T('Ausserhalb Kampf nur Zählen', tSpend(ch, 'b', 'Test'), true); }
    { const ch = mk({ cls: 'fig', level: 5 }); ch.play.cond = ['stunned', 'incapacitated']; ch.play.localFight = true; turnReset(ch); T('Betäubt: keine Aktion', tSpend(ch, 'a', 'Angriff'), false); }
    /* 15. Ein Zauberplatz pro Zug */
    { const ch = mk({ cls: 'wiz', level: 5, spells: ['magic-missile', 'shield', 'burning-hands'], cantrips: ['fire-bolt'] }); ch.play.localFight = true; turnReset(ch);
      castSpell(ch, 'magic-missile', 1, 'slot'); const used1 = +ch.play.slots[1] || 0; castSpell(ch, 'shield', 1, 'slot'); const used2 = +ch.play.slots[1] || 0; S.orb = null; S.sa = null; orbPrompt('');
      T('Zweiter Zauberplatz im selben Zug blockiert', [used1, used2], [1, 1]); turnReset(ch); castSpell(ch, 'fire-bolt', 0, 'slot'); S.sa = null; orbPrompt(''); T('Zaubertrick nach neuem Zug erlaubt', turnSt(ch).a, 1); }
    /* 14. Göttliches Niederstrecken ohne Bonusaktion */
    { const ch = mk({ cls: 'pal', level: 5, weapons: [{ w: 'longsword' }] }); ch.play.localFight = true; turnReset(ch); tSpend(ch, 'b', 'Test'); seq(15); weaponAttack(ch, 1); await sleep(700); const txt = document.getElementById('prompt').textContent; T('Niederstrecken ohne Bonusaktion gesperrt', /nicht möglich/.test(txt), true); XA.dpMiss && XA.dpMiss(); S.dp = null; orbPrompt(''); }
    /* 16. Hinterhältiger Angriff 1× pro Zug */
    { const ch = mk({ cls: 'rog', level: 5, weapons: [{ w: 'rapier' }] }); ch.play.localFight = true; turnReset(ch); S.mode = 'adv';
      seq(15, 15); weaponAttack(ch, 1); await sleep(700); T('Hinterhältig vorgewählt bei Vorteil', S.dp && S.dp.sneak, true); dmgRoll(ch); const d1 = S.log[0].detail;
      turnSt(ch).aMax = 2; seq(15, 15); weaponAttack(ch, 1); await sleep(700); T('Hinterhältig 2. Mal nicht wählbar', S.dp && S.dp.sneak, false); S.dp.sneak = true; dmgRoll(ch); const d2 = S.log[0].detail; S.mode = 'normal';
      T('Hinterhältig nur einmal gewürfelt', [/Hinterhältig/.test(d1), /Hinterhältig/.test(d2)], [true, false]); }
    /* 17. Kampfrausch */
    { const ch = mk({ cls: 'bar', level: 5 }); ch.play.conc = { id: 'bless', name: 'Segnen' }; ch.play.localFight = true; turnReset(ch); turnRun(ch, 'f:rage'); T('Kampfrausch beendet Konzentration', [ch.play.raging, ch.play.conc], [true, null]);
      turnReset(ch); T('Kampfrausch hält bis Ende des nächsten Zuges', ch.play.raging, true); turnReset(ch); T('Kampfrausch endet ohne Angriff', ch.play.raging, false); }
    { const ch = mk({ cls: 'bar', level: 5, armor: 'plate' }); turnRun(ch, 'f:rage'); T('Kein Kampfrausch in schwerer Rüstung', ch.play.raging, false); }
    /* 18. Todesrettungswürfe */
    { const ch = mk({ cls: 'fig', level: 3 }); const P = ch.play; P.hp = 0; P.cond = ['unconscious', 'incapacitated', 'prone']; seq(12); XA_t('deathRoll'); seq(12); XA_t('deathRoll'); seq(12); XA_t('deathRoll');
      T('Drei Erfolge: stabil', [P.stable, P.ds], [true, [0, 0]]); seq(2); XA_t('deathRoll'); T('Stabil: kein weiterer Wurf', P.ds, [0, 0]);
      document.getElementById('hpAmt') || document.body.insertAdjacentHTML('beforeend', '<input id="hpAmt">'); document.getElementById('hpAmt').value = 3; XA_t('hp', 'dmg'); T('Schaden bei stabil: nicht mehr stabil, 1 Fehlschlag', [P.stable, P.ds[1]], [false, 1]);
      seq(20); XA_t('deathRoll'); T('Natürliche 20: 1 TP, wach', [P.hp, P.cond.includes('unconscious')], [1, false]); }
    /* 19. Lange Rast bei 0 TP */
    { const ch = mk({ cls: 'fig', level: 3 }); ch.play.hp = 0; ch.play.slots = {}; doRest(ch, 'long'); T('Lange Rast bei 0 TP blockiert', ch.play.hp, 0); }
    /* 20. Trefferwürfel nach Würfelart */
    { const ch = mk({ cls: 'fig', level: 3, multi: [{ cls: 'wiz', level: 2 }] }); const c = D(ch); ch.play.hp = 5; T('Trefferwürfel-Pools', c.hdPool.map((x) => [x.d, x.n]), [[10, 3], [6, 2]]); spendHdDie(ch, 6); T('W6 gezielt ausgegeben', [ch.play.hdBy[6], ch.play.hdBy[10] || 0, ch.play.hdUsed], [1, 0, 1]); XA_t('spendHd'); T('Bogen-Knopf öffnet kurze Rast', S.modal, 'srest'); S.modal = null; document.getElementById('modal').hidden = true; }
    /* 21. Meisterschaft Streifen */
    { const ch = mk({ cls: 'fig', level: 1, weapons: [{ w: 'greatsword', mastery: true }], base: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 10 }, bgPlus: { str: 2, con: 1 } }); seq(2); weaponAttack(ch, 1); await sleep(700); S.log = []; XA_t('dpMiss'); T('Streifen bei Fehlschlag', S.log[0] && S.log[0].total, 4); }
    /* 23. Shillelagh */
    { const ch = mk({ cls: 'dru', level: 1, cantrips: ['shillelagh', 'druidcraft'], weapons: [{ w: 'club' }], base: { str: 8, dex: 12, con: 14, int: 10, wis: 15, cha: 10 }, bgPlus: { wis: 2, con: 1 } }); castSpell(ch, 'shillelagh', 0, 'slot'); const a = D(ch).attacks.find((x) => x.idx === 0); T('Shillelagh: WEI und W8', [a.ab, a.die], ['wis', '1W8']); }
    /* 24. Tiergestalt */
    { const ch = mk({ cls: 'dru', level: 4, sub: 'land' }); const ids = wsAllowed(D(ch)).map((x) => x[0]); T('Tiergestalt Stufe 4: Bär ja, Adler nein', [ids.includes('black-bear'), ids.includes('giant-eagle')], [true, false]); ch.play.ws = 'wolf'; const c = D(ch); T('Tiergestalt Wolf: RK und Angriff', [c.ac, c.attacks[0].name.startsWith('Wolf')], [12, true]); ch.play.ws = null; }
    /* 25. Wahrer Schlag */
    { const ch = mk({ cls: 'wiz', level: 1, cantrips: ['true-strike', 'light', 'mage-hand'], weapons: [{ w: 'dagger' }], base: { str: 8, dex: 12, con: 14, int: 15, wis: 10, cha: 10 }, bgPlus: { int: 2, con: 1 } }); castSpell(ch, 'true-strike', 0, 'slot'); seq(10); XA.tsGo(null, '1', '', ch); await sleep(100); T('Wahrer Schlag nutzt INT', /Angriff/.test(S.log[0].label) && S.log[0].total === 10 + 2 + 2, true); S.dp = null; orbPrompt(''); }
    /* 26. Kampf-Zusammenführung */
    { const base = { id: 'k', npcs: [{ id: 'a', hp: 10 }], effects: [], log: [], turn: 'x' }; const ours = Object.assign({}, base, { npcs: [{ id: 'a', hp: 10 }, { id: 'b', hp: 5 }] }); const theirs = Object.assign({}, base, { npcs: [{ id: 'a', hp: 4 }], turn: 'y' }); const m = mergeCombat(base, ours, theirs); T('Gleichzeitige Kampfänderungen zusammengeführt', [m.npcs.map((n) => n.id + n.hp).sort(), m.turn], [['a4', 'b5'], 'y']); }
    /* 27. Zauberplatz-Knopf bevorzugt normale Plätze */
    { const ch = mk({ cls: 'pal', level: 6, multi: [{ cls: 'wlk', level: 3 }] }); const btn = document.createElement('button'); btn.dataset.label = 'Test'; XA_t('cast', '1', btn); T('Normale Plätze vor Pakt', [+ch.play.slots[1] || 0, +ch.play.pact || 0], [1, 0]); }
    /* 12. Import: ungültig → nichts ändern */
    { const n0 = Object.keys(S.chars).length; let err = ''; try { importJson('{"id":"zz","name":"X","cls":"gibtsnicht","level":3}'); } catch (e) { err = e.message; } T('Ungültiger Import abgelehnt, Daten unverändert', [/Nicht geladen/.test(err), Object.keys(S.chars).length], [true, n0]); }
    { let err = ''; try { importJson('{"id":"zz2","name":"X","cls":"fig","level":3,"spells":["gibtsnicht"]}'); } catch (e) { err = e.message; } T('Import bereinigt unbekannte Zauber', [err, (S.chars.zz2 || {}).spells], ['', []]); }
    return out;
    function XA_t(act, arg, el) { const t = el || document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; document.body.appendChild(t); t.click(); t.remove(); }
  });
  let fail = 0; for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.name + (r.ok ? '' : '  → erhalten ' + JSON.stringify(r.got) + ', erwartet ' + JSON.stringify(r.want))); }
  console.log('\n' + (res.length - fail) + ' / ' + res.length + ' Tests bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
