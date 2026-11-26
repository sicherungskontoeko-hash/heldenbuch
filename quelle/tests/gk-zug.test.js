/* GK-04/05/06: Aktionsökonomie am Online-Tisch im strengen Modus.
   GK-04 Zauber ausserhalb des eigenen Zugs, GK-05 Folge- und Bonusangriffe, GK-06 Vorbereiten erst bei Bestätigung.
   Online-Kampf über die Ersatz-Datenbank (Snapshot-Eingang), reale Handler und Klickpfade.
   Aufruf: node tests/gk-zug.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
const SETUP = () => {
  window.__subs = {}; const ref = (p) => ({ path: p, onSnapshot: (fn) => { __subs[p] = fn; return () => { if (__subs[p] === fn) delete __subs[p]; }; }, set: async () => {}, delete: async () => {}, get: async () => ({ exists: false, data: () => null }), ping: async () => {} });
  DB = { doc: (p) => ref(p), collection: (p) => Object.assign(ref(p), { doc: (id) => ref(p + '/' + id), get: async () => ({ docs: [], empty: true }) }) }; UID = 'ich';
  window.__mk = (o) => { const c = normChar(newChar(Object.assign({ name: 'Held' }, o))); S.chars[c.id] = c; return c; };
  window.__use = (c) => { S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; render(); };
  window.__turn = (key) => { const pl = __subs['camp/raum/players']; if (pl) pl({ docs: [{ id: 'ich', data: () => ({ char: 'Ich', init: { v: 12, cid: 'k1' }, t: Date.now() }) }] }); /* eigener Platz in der Initiative: nur dann erkennt die App den eigenen Zug */
    __subs['camp/raum/state/combat']({ exists: true, data: () => ({ id: 'k1', active: true, round: 1, turn: key, t: Date.now(), npcs: [{ id: 'n1', name: 'Ork', v: 10, dex: 0, hp: 15, hpMax: 15, ac: 13, cond: [] }] }) }); paintTurn(); };
  window.__strict = (on) => { rule('strict'); S.rules.strict = on; };
  /* Zugzähler ohne die «einmal pro Zug»-Merker: die stellt die App beim Lesen auf den aktuellen Zug um (keine Ausgabe) */
  window.__st = (c) => JSON.stringify({ t: Object.assign({}, turnSt(c), { once: undefined, onceId: undefined }), slots: c.play.slots, pact: c.play.pact, res: c.play.res, ready: c.play.ready || null, conc: c.play.conc || null });
  window.__rolls = () => S.log.filter((e) => e.sides).length;
  window.__toasts = () => [...document.querySelectorAll('#mini .mt')].map((e) => e.textContent);
  window.__act = (act, arg, ds) => { const b = document.createElement('button'); b.dataset.act = act; if (arg != null) b.dataset.arg = arg; Object.assign(b.dataset, ds || {}); document.body.appendChild(b); b.click(); b.remove(); };
  window.__fresh = (c) => { c.play.slots = {}; c.play.pact = 0; c.play.res = {}; c.play.turn = {}; delete c.play.ready; c.play.conc = null; c.play.hp = null; turnReset(c); S.log.length = 0; /* Protokoll hat höchstens 30 Einträge: für Zählungen leeren */ };
  window.__fix = (v) => { if (v == null) { if (window.__mr) Math.random = window.__mr; return; } window.__mr = window.__mr || Math.random; Math.random = () => v; }; /* feste Würfe (rnd nutzt dann Math.random) */
  window.__atkIdx = (c, re) => derive(c, S.hb).attacks.findIndex((a) => re.test(a.name));
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.dismiss());
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
  await p.goto('file://' + target); await p.waitForTimeout(700);
  await p.evaluate(SETUP);
  await p.evaluate(() => {
    S.chars = {};
    window.W = __mk({ name: 'Mira', cls: 'wiz', level: 5, species: 'human', base: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, cantrips: ['fire-bolt', 'light', 'mage-hand'], book: ['magic-missile', 'shield', 'misty-step', 'sleep'], spells: ['magic-missile', 'shield', 'misty-step'] });
    window.F = __mk({ name: 'Brann', cls: 'fig', level: 5, base: { str: 16, dex: 14, con: 14, int: 8, wis: 12, cha: 10 }, weapons: [{ w: 'longsword', mastery: true }, { w: 'scimitar', mastery: true }, { w: 'dagger', mastery: true }] });
    window.M = __mk({ name: 'Kaito', cls: 'mon', level: 5, base: { str: 10, dex: 16, con: 14, int: 8, wis: 15, cha: 10 } });
    window.K = __mk({ name: 'Vex', cls: 'wlk', level: 3, base: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 }, cantrips: ['eldritch-blast'], spells: ['hex', 'armor-of-agathys'] });
    window.Pal = __mk({ name: 'Aldo', cls: 'pal', level: 5, base: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 14 }, weapons: [{ w: 'longsword', mastery: true }], spells: ['bless'] });
    __use(W); joinCamp('raum', true); __subs['camp/raum/state/meta']({ exists: true, data: () => ({ dm: 'sl', mercy: {} }) }); __strict(true); __turn('p:ich');
  });
  const known = await p.evaluate(() => ['magic-missile', 'shield', 'misty-step', 'fire-bolt', 'eldritch-blast', 'hex'].filter((id) => !getSpell(id, S.hb)));
  T('Testzauber vorhanden', known.length === 0, known);

  /* ---------------- GK-04 ---------------- */
  let r = await p.evaluate(() => { __use(W); __fresh(W); __turn('n:n1'); const b0 = __st(W), r0 = __rolls(); castSpell(W, 'magic-missile', 1); return { same: __st(W) === b0, rolls: __rolls() - r0, why: S.log[0] && S.log[0].detail }; });
  T('GK04-T01 Magisches Geschoss im fremden Zug: blockiert, kein Platz, keine Aktion, keine Wirkung', r.same && r.rolls === 0 && /Nicht dein Zug/.test(r.why), r);
  r = await p.evaluate(() => { const b0 = __st(W); castSpell(W, 'misty-step', 2); return { same: __st(W) === b0, why: S.log[0].detail }; });
  T('GK04-T02 Nebelschritt (Bonusaktion) im fremden Zug: blockiert, kein Verbrauch', r.same && /Bonusaktion geht nur im eigenen Zug/.test(r.why), r);
  r = await p.evaluate(() => { const b0 = __st(W), r0 = __rolls(); castSpell(W, 'fire-bolt', 0); const a = __st(W) === b0 && __rolls() === r0; turnRun(W, 'std:dash'); return { cantrip: a, dash: __st(W) === b0 }; });
  T('GK04-T03 Zaubertrick und slotfreie Aktion (Spurt) im fremden Zug: blockiert', r.cantrip && r.dash, r);
  r = await p.evaluate(() => { castSpell(W, 'shield', 1, 'slot'); const t = turnSt(W); return { r: t.r, slot: W.play.slots[1], ok: /Schild/.test(S.log[0].label) }; });
  T('GK04-T04 Schild (Reaktion) im fremden Zug: erlaubt, genau eine Reaktion, ein Platz Grad 1', r.r === 1 && r.slot === 1 && r.ok, r);
  r = await p.evaluate(() => { const b0 = __st(W); castSpell(W, 'shield', 1, 'slot'); return { same: __st(W) === b0, why: S.log[0].detail }; });
  T('GK04-T05 Zweite Reaktion ohne neuen Zug: blockiert', r.same && /Reaktion schon verbraucht/.test(r.why), r);
  r = await p.evaluate(() => { __turn('p:ich'); __fresh(W); castSpell(W, 'magic-missile', 1); const t = turnSt(W); const a = { a: t.a, slot: W.play.slots[1] }; castSpell(W, 'misty-step', 2); return Object.assign(a, { b: turnSt(W).b, slot2: W.play.slots[2] || 0, why: S.log[0].detail }); });
  T('GK04-T06 Eigener Zug: Aktionszauber erlaubt (1 Aktion, 1 Platz)', r.a === 1 && r.slot === 1, r);
  T('GK04-T10 Zweiter Zauberplatz im selben Zug weiter gesperrt (D&D 2024)', r.b === 0 && r.slot2 === 0 && /nur einen Zauberplatz/.test(r.why), r);
  r = await p.evaluate(() => { __fresh(W); castSpell(W, 'misty-step', 2); castSpell(W, 'fire-bolt', 0); const t = turnSt(W); const own = { b: t.b, a: t.a, s2: W.play.slots[2] }; __turn('n:n1'); castSpell(W, 'shield', 1, 'slot'); return Object.assign(own, { r: turnSt(W).r, s1: W.play.slots[1] }); });
  T('GK04-T10 Platzzauber plus Zaubertrick im eigenen Zug; Schild im fremden Zug trotz Platz im eigenen Zug', r.b === 1 && r.a === 1 && r.s2 === 1 && r.r === 1 && r.s1 === 1, r);
  r = await p.evaluate(() => { __fresh(W); __turn('n:n1'); __strict(false); const t0 = __toasts().length; castSpell(W, 'magic-missile', 1); const t = turnSt(W); const toast = __toasts().slice(0, __toasts().length - t0).join(' '); __strict(true); return { a: t.a, slot: W.play.slots[1], toast, n: (toast.match(/Regeln locker/g) || []).length }; });
  T('GK04-T07 Lockere Regeln: Warnung, Zauber wird bewusst ausgeführt (eine Warnung)', r.a === 1 && r.slot === 1 && r.n === 1 && /Nicht dein Zug/.test(r.toast), r);
  r = await p.evaluate(() => { __fresh(W); localStorage.setItem('hb_hl', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('hb_hl') || '{}'), { zug: false }))); const tt = turnTrack(); const b0 = __st(W); castSpell(W, 'magic-missile', 1); const same = __st(W) === b0; localStorage.removeItem('hb_hl'); return { tt, same }; });
  T('GK04-T08 Zugleiste ausgeschaltet: im fremden Zug weiterhin gesperrt', r.same, r);
  r = await p.evaluate(() => { __use(K); __fresh(K); __turn('n:n1'); const b0 = __st(K); castSpell(K, 'hex', 1, 'pact'); castSpell(K, 'eldritch-blast', 0); turnRun(K, 'sp:hex'); __act('castSp', null, { id: 'hex', lvl: '1', mode: 'pact' }); const blocked = __st(K) === b0;
    __turn('p:ich'); __fresh(K); turnRun(K, 'sp:hex'); const own = { pact: K.play.pact, b: turnSt(K).b }; return { blocked, own }; });
  T('GK04-T09 Paktmagie, Zugleiste (sp:) und Klickpfad (castSp) im fremden Zug gesperrt; im eigenen Zug gültig', r.blocked && r.own.pact === 1 && r.own.b === 1, r);
  r = await p.evaluate(() => { __use(F); __fresh(F); __turn('p:ich'); const W2 = __mk({ name: 'Kampfmagier', cls: 'fig', level: 2, multi: [{ cls: 'wiz', level: 3, order: '', land: 'temperate', cantrips: ['fire-bolt'], spells: ['magic-missile'], arcanum: {} }], book: ['magic-missile'] }); __use(W2); __fresh(W2);
    castSpell(W2, 'fire-bolt', 0); turnRun(W2, 'f:surge'); const b0 = __st(W2); castSpell(W2, 'fire-bolt', 0); return { surgeBlocked: __st(W2) === b0 && /Tatendrang/.test(S.log[0].detail) }; });
  T('GK04-T10 Tatendrang: Zusatzaktion weiterhin keine Magieaktion', r.surgeBlocked, r);
  r = await p.evaluate(() => { leaveCamp(); __use(W); __fresh(W); castSpell(W, 'magic-missile', 1); castSpell(W, 'misty-step', 2); const ok = W.play.slots[1] === 1 && W.play.slots[2] === 1; joinCamp('raum', true); __subs['camp/raum/state/meta']({ exists: true, data: () => ({ dm: 'sl', mercy: {} }) }); __subs['camp/raum/state/combat']({ exists: true, data: () => ({ id: 'k2', active: true, round: 1, turn: null, t: Date.now(), npcs: [] }) }); __fresh(W); castSpell(W, 'magic-missile', 1); return { ok, before: W.play.slots[1] === 1 }; });
  T('GK04-T11 Ausserhalb des Kampfs und vor dem ersten festgelegten Zug: freie Bedienung wie bisher', r.ok && r.before, r);

  /* ---------------- GK-05 ---------------- */
  r = await p.evaluate(() => { __use(F); __turn('p:ich'); __fresh(F); const i = __atkIdx(F, /Langschwert/); weaponAttack(F, i); const t1 = JSON.stringify(turnSt(F)); __turn('n:n1'); const r0 = __rolls(); const b0 = __st(F); weaponAttack(F, i); return { i, atk1: JSON.parse(t1).atk, same: __st(F) === b0, rolls: __rolls() - r0, toast: __toasts()[0] }; });
  T('GK05-T01 Kämpfer 5: zweiter regulärer Angriff nach Zugwechsel blockiert, kein Wurf, Zähler unverändert', r.atk1 === 1 && r.same && r.rolls === 0 && /Nicht dein Zug/.test(r.toast), r);
  r = await p.evaluate(() => { __turn('p:ich'); __fresh(F); const i = __atkIdx(F, /Langschwert/); weaponAttack(F, i); weaponAttack(F, i); const t = turnSt(F); const third0 = __rolls(); weaponAttack(F, i); return { atk: t.atk, a: t.a, third: __rolls() - third0 }; });
  T('GK05-T02 Beide Angriffe im eigenen Zug, eine Aktion (dritter braucht neue Aktion)', r.atk === 2 && r.a === 1 && r.third === 0, r);
  r = await p.evaluate(() => { __use(M); __turn('p:ich'); __fresh(M); turnRun(M, 'f:flurry'); const left = turnSt(M).bonusAtk; __turn('n:n1'); const b0 = __st(M), r0 = __rolls(); XA.tUse(null, 'bfl:0', null, M); const off = { same: __st(M) === b0, rolls: __rolls() - r0 };
    __turn('p:ich'); __fresh(M); turnRun(M, 'f:flurry'); const b1 = turnSt(M).bonusAtk; XA.tUse(null, 'bfl:0', null, M); const b2 = turnSt(M).bonusAtk; const r1 = __rolls(); XA.tUse(null, 'bfl:0', null, M); return { left, off, b1, b2, extra: __rolls() - r1 }; });
  T('GK05-T03 Mönch: bezahlter Schlaghagel im fremden Zug gesperrt, Restschlag bleibt', r.left === 1 && r.off.same && r.off.rolls === 0, r);
  T('GK05-T03 Mönch: im eigenen Zug genau zwei Schläge, danach keiner mehr', r.b1 === 1 && r.b2 === 0 && r.extra === 0, r);
  r = await p.evaluate(() => { __use(F); __turn('p:ich'); __fresh(F); const sc = __atkIdx(F, /Krummsäbel/), dg = __atkIdx(F, /Dolch/); weaponAttack(F, sc); const own0 = __rolls(); weaponAttack(F, dg, { off: true, how: 'bonus' }); const ownOk = __rolls() > own0;
    __turn('n:n1'); const b0 = __st(F), r0 = __rolls(); weaponAttack(F, dg, { off: true, how: 'bonus' }); turnRun(F, 'ush:grapple'); turnRun(F, 'ush:shove'); return { sc, dg, ownOk, same: __st(F) === b0, rolls: __rolls() - r0 }; });
  T('GK05-T04 Zweitwaffe/Kerbe, Packen, Stossen im fremden Zug gesperrt; Kette im eigenen Zug gültig', r.ownOk && r.same && r.rolls === 0, r);
  r = await p.evaluate(() => { __fresh(F); __turn('n:n1'); const i = __atkIdx(F, /Langschwert/); const r0 = __rolls(); turnRun(F, 'oa:' + i); const first = { r: turnSt(F).r, rolls: __rolls() - r0 }; const r1 = __rolls(); turnRun(F, 'oa:' + i); return { first, second: __rolls() - r1 }; });
  T('GK05-T05 Gelegenheitsangriff im fremden Zug erlaubt, zweiter blockiert', r.first.r === 1 && r.first.rolls === 1 && r.second === 0, r);
  r = await p.evaluate(() => { const ax = __mk({ name: 'Axt', cls: 'fig', level: 5, weapons: [{ w: 'greataxe', mastery: true }] }); __use(ax); __fresh(ax); __turn('n:n1'); const i = __atkIdx(ax, /Zweihandaxt/); const r0 = __rolls(); XA.cleave(null, String(i), null, ax); const cl = __rolls() - r0; const once = onceUsed(ax, 'cleave');
    __use(W); __turn('p:ich'); __fresh(W); W.weapons = [{ w: 'dagger', mastery: false }]; W.play.cond = []; S.tsPend = { ab: 'int', mod: 3, cid: F.id }; const r1 = __rolls(); XA.tsGo(null, '0', null, W); const foreign = __rolls() - r1; return { cl, once, foreign }; });
  T('GK05-T06 Durchspalten (Treffer-Zusatz) bleibt auch im fremden Zug möglich, einmal pro Zug', r.cl === 1 && r.once, r);
  T('GK05-T06 Wahrer Schlag aus einem fremden Helden-Dialog wird nicht angewendet', r.foreign === 0, r);
  r = await p.evaluate(() => { __use(F); __fresh(F); __turn('p:ich'); const i = __atkIdx(F, /Langschwert/); weaponAttack(F, i); __turn('n:n1'); __strict(false); weaponAttack(F, i); const t = turnSt(F); __strict(true); return { atk: t.atk, warn: __toasts().some((x) => /Regeln locker/.test(x)) }; });
  T('GK05-T07 Lockere Regeln: Folgeangriff mit Warnung erlaubt', r.atk === 2 && r.warn, r);
  r = await p.evaluate(async () => { __fresh(F); __turn('p:ich'); const i = __atkIdx(F, /Langschwert/); __fix(0.6); weaponAttack(F, i); __fix(null); await new Promise((res) => setTimeout(res, 800)); const dp = !!S.dp; __turn('n:n1'); const r0 = S.log.length; const btn = document.querySelector('#prompt [data-act="dpRoll"], #prompt [data-act="dmgRoll"], #prompt [data-act="dpGo"]'); if (btn) btn.click(); const dmg = S.log.length > r0 && /Schaden/.test(S.log[0].label);
    const r1 = __rolls(); weaponAttack(F, i); return { dp, btn: !!btn && btn.dataset.act, dmg, newAtk: __rolls() - r1 }; });
  T('GK05-T08 Offener Schadensdialog nach Zugwechsel: Schaden abwickelbar, neuer Angriff gesperrt', r.dp && r.dmg && r.newAtk === 0, r);
  r = await p.evaluate(async () => { orbPrompt(''); S.dp = null; __turn('n:n1'); const before = JSON.stringify(turnSt(F)); __turn('p:ich'); await new Promise((res) => setTimeout(res, 100)); const t = turnSt(F); return { before: JSON.parse(before).atk, atk: t.atk, a: t.a, r: t.r }; });
  T('GK05-T09 Neuer eigener Zug setzt Angriffe, Aktion und Reaktion zurück', r.atk === 0 && r.a === 0 && r.r === 0, r);
  r = await p.evaluate(() => { __fresh(F); __turn('p:ich'); const i = __atkIdx(F, /Langschwert/); __act('tUse', 'atk:' + i); __turn('n:n1'); const b0 = __st(F), r0 = __rolls(); __act('tUse', 'atk:' + i); return { same: __st(F) === b0, rolls: __rolls() - r0, atk: turnSt(F).atk }; });
  T('GK05-T10 Klickpfad (Zugleiste) verhält sich wie der direkte Handler', r.same && r.rolls === 0 && r.atk === 1, r);
  r = await p.evaluate(async () => { __use(Pal); __fresh(Pal); __turn('n:n1'); const i = __atkIdx(Pal, /Langschwert/); __fix(0.6); turnRun(Pal, 'oa:' + i); __fix(null); await new Promise((res) => setTimeout(res, 800)); if (S.dp) S.dp.smite = '1'; const s0 = JSON.stringify(Pal.play.slots); const b0 = turnSt(Pal).b; const btn = document.querySelector('#prompt [data-act="dpRoll"]'); if (btn) btn.click(); return { slots: JSON.stringify(Pal.play.slots) === s0, b: turnSt(Pal).b === b0, note: /Niederstrecken nicht möglich \(nicht dein Zug/.test((S.log[0] || {}).detail || '') }; });
  T('GK05 Zusatz: Göttliches Niederstrecken (Bonusaktion) nach Gelegenheitsangriff im fremden Zug gesperrt', r.slots && r.b && r.note, r);

  /* ---------------- GK-06 ---------------- */
  r = await p.evaluate(() => { orbPrompt(''); __use(F); __fresh(F); __turn('p:ich'); F.play.ready = { trig: 'Alt', what: 'Bogen', t: 1 }; const b0 = __st(F); turnRun(F, 'std:ready'); const open = !!$('#readyTrig'); const mid = __st(F) === b0; XA.readyNo(); return { open, mid, after: __st(F) === b0, kept: F.play.ready && F.play.ready.trig === 'Alt' }; });
  T('GK06-T01 Öffnen → Abbrechen: nichts verbraucht, bestehende Vorbereitung bleibt', r.open && r.mid && r.after && r.kept, r);
  r = await p.evaluate(() => { delete F.play.ready; const b0 = __st(F); turnRun(F, 'std:ready'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); orbPrompt('<div class="pr"><b>Anderes</b></div>'); orbPrompt(''); return { same: __st(F) === b0, gone: !$('#readyTrig') }; });
  T('GK06-T02 Schliessen über andere Wege (Taste, anderes Fenster): nichts verbraucht', r.same && r.gone, r);
  r = await p.evaluate(() => { const b0 = __st(F); turnRun(F, 'std:ready'); $('#readyTrig').value = '   '; XA.readyGo(null, '', null, F); const inv = $('#readyTrig') && $('#readyTrig').getAttribute('aria-invalid'); XA.readyNo(); return { same: __st(F) === b0, inv }; });
  T('GK06-T03 Leerer Auslöser: Feld markiert, keine Kosten', r.same && r.inv === 'true', r);
  r = await p.evaluate(() => { const t0 = Date.now(); turnRun(F, 'std:ready'); $('#readyTrig').value = 'Sobald die Tür aufgeht'; $('#readyWhat').value = 'Angriff'; const btn = document.querySelector('[data-act="readyGo"]'); btn.click(); btn.click(); XA.readyGo(null, '', null, F); const logs = S.log.filter((e) => e.t >= t0 && e.label === 'Vorbereitet').length; return { a: turnSt(F).a, ready: F.play.ready && F.play.ready.trig, logs }; });
  T('GK06-T04 Bestätigen: genau eine Aktion, gültige Vorbereitung, ein Eintrag', r.a === 1 && r.ready === 'Sobald die Tür aufgeht' && r.logs === 1, r);
  T('GK06-T05 Doppelklick verbucht nur einmal', r.a === 1 && r.logs === 1, r);
  r = await p.evaluate(() => { __fresh(F); turnRun(F, 'std:ready'); $('#readyTrig').value = 'X'; __turn('n:n1'); const b0 = __st(F); XA.readyGo(null, '', null, F); const turnChg = __st(F) === b0 && !F.play.ready; __turn('p:ich'); __fresh(F); turnRun(F, 'std:ready'); $('#readyTrig').value = 'Y'; const i = __atkIdx(F, /Langschwert/); weaponAttack(F, i); orbPrompt(''); S.dp = null; turnRun(F, 'std:ready'); return { turnChg, blockedOpen: !$('#readyTrig'), a: turnSt(F).a, ready: !!F.play.ready }; });
  T('GK06-T06 Zugwechsel vor Bestätigung: nichts verbraucht, keine Vorbereitung; Aktion schon verbraucht: Fenster öffnet nicht', r.turnChg && r.blockedOpen && r.a === 1 && !r.ready, r);
  r = await p.evaluate(() => { orbPrompt(''); __fresh(F); __fresh(W); __use(F); turnRun(F, 'std:ready'); $('#readyTrig').value = 'Z'; S.cur = W.id; const bW = __st(W), bF = __st(F); XA.readyGo(null, '', null, W); return { w: __st(W) === bW, f: __st(F) === bF, none: !W.play.ready && !F.play.ready }; });
  T('GK06-T07 Heldenwechsel bei offenem Fenster: keine falsche Zuordnung, nichts verbraucht', r.w && r.f && r.none, r);
  r = await p.evaluate(() => { __use(F); __fresh(F); __turn('p:ich'); turnRun(F, 'std:ready'); $('#readyTrig').value = 'Ork bewegt sich'; XA.readyGo(null, '', null, F); __turn('n:n1'); XA.readyFire(null, '', null, F); const fire = { r: turnSt(F).r, gone: !F.play.ready }; const r0 = S.log.length; XA.readyFire(null, '', null, F); return Object.assign(fire, { again: S.log.length - r0 }); });
  T('GK06-T08 Auslösen: genau eine Reaktion, Vorbereitung gelöscht, keine zweite Auslösung', r.r === 1 && r.gone && r.again === 0, r);
  r = await p.evaluate(() => { __turn('p:ich'); __fresh(F); turnRun(F, 'std:ready'); $('#readyTrig').value = 'Q'; XA.readyGo(null, '', null, F); XA.readyDrop(null, '', null, F); return { a: turnSt(F).a, gone: !F.play.ready }; });
  T('GK06-T09 Aufgeben nach Bestätigung: Aktion bleibt verbraucht', r.a === 1 && r.gone, r);
  r = await p.evaluate(async () => { __fresh(F); turnRun(F, 'std:ready'); $('#readyTrig').value = 'R'; XA.readyGo(null, '', null, F); __turn('n:n1'); XA.readyFire(null, '', null, F); turnRun(F, 'std:ready'); const offOpen = !!$('#readyTrig'); __turn('p:ich'); await new Promise((res) => setTimeout(res, 100)); return { offOpen, ready: !!F.play.ready, r: turnSt(F).r, a: turnSt(F).a }; });
  T('GK06-T10 Fremder Zug: Vorbereiten öffnet nicht; neuer eigener Zug: Vorbereitung verfallen, Reaktion frei', !r.offOpen && !r.ready && r.r === 0 && r.a === 0, r);
  r = await p.evaluate(() => { leaveCamp(); __fresh(F); turnRun(F, 'std:ready'); const open = !!$('#readyTrig'); $('#readyTrig').value = 'Lokal'; XA.readyGo(null, '', null, F); const loc = { open, ready: F.play.ready && F.play.ready.trig };
    joinCamp('raum', true); __subs['camp/raum/state/meta']({ exists: true, data: () => ({ dm: 'sl', mercy: {} }) }); __turn('n:n1'); __strict(false); __fresh(F); turnRun(F, 'std:ready'); const lOpen = !!$('#readyTrig'); $('#readyTrig').value = 'Locker'; XA.readyGo(null, '', null, F); __strict(true); return Object.assign(loc, { lOpen, lReady: F.play.ready && F.play.ready.trig, a: turnSt(F).a }); });
  T('GK06-T11 Einzelspiel und lockere Regeln: Vorbereiten wie bisher möglich', r.open && r.ready === 'Lokal' && r.lOpen && r.lReady === 'Locker' && r.a === 1, r);
  r = await p.evaluate(async () => { __use(F); __turn('p:ich'); await new Promise((res) => setTimeout(res, 100)); __fresh(F); commit(); S.undo = []; S.redo = []; __act('tUse', 'std:ready'); await new Promise((res) => setTimeout(res, 50)); if (!$('#readyTrig')) return { fehlt: __toasts().slice(0, 2) }; $('#readyTrig').value = 'Undo-Test'; __act('readyGo'); await new Promise((res) => setTimeout(res, 50)); const after = { a: turnSt(F).a, ready: !!F.play.ready }; XA.undo(); await new Promise((res) => setTimeout(res, 50)); const back = { a: (F.play.turn || {}).a || 0, ready: !!S.chars[F.id].play.ready }; XA.redo && XA.redo(); await new Promise((res) => setTimeout(res, 50)); const ch = S.chars[F.id]; return { after, back, redo: { a: (ch.play.turn || {}).a, ready: !!ch.play.ready }, undoN: (S.undo || []).length }; });
  T('GK06-T12 Rückgängig/Wiederholen: Aktion und Vorbereitung konsistent', r.after.a === 1 && r.after.ready && r.back.a === 0 && !r.back.ready && r.redo.a === 1 && r.redo.ready, r);
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden');
  await b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
