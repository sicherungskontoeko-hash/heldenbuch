/* Prüfbericht v1.9.49 (externe Prüfung): Würfelanzeige ohne Überschreiben durch alte Animationen (C-01),
   Schnellschaden zweihändig nicht mit Schild (B-15), Hello-Anfragen gebündelt (C-02), Freier Wandel mit 2 oder 3 Formen (N-02).
   Aufruf: node tests/pruefbericht.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 500))); };
const W = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const mode of ['svg', 'webgl']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript((m) => { localStorage.setItem('hb_sample_done', '1'); if (m === 'svg') localStorage.setItem('hb_w3d', '0'); }, mode);
    await p.goto('file://' + target); await p.waitForTimeout(500);
    await p.evaluate(() => { const ch = normChar(newChar({ name: 'W', cls: 'fig', level: 3 })); S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'sheet'; render(); });
    const one = (v) => `pushLog({ label: 'W20', total: ${v}, sides: 20, nat: ${v}, detail: 'W20 [${v}]', groups: [{ sides: 20, rolls: [${v}], sign: 1 }] })`;
    const two = (a, c) => `pushLog({ label: '2W6', total: ${a + c}, detail: '2W6 [${a}, ${c}]', groups: [{ sides: 6, rolls: [${a}, ${c}], sign: 1 }] })`;
    const shown = () => p.evaluate(() => { const t = document.querySelector('#toast .tv'); const tray = document.querySelector('#tray'); return { tv: t ? t.textContent : null, log: S.log[0].total, tray: !!tray && !tray.hidden, busy: VFX_RT.busy }; });
    const cases = [['Einzel → Einzel', one(7), one(15), 15, false], ['Mehrfach → Einzel', two(4, 5), one(15), 15, false], ['Einzel → Mehrfach', one(7), two(2, 3), 5, true], ['Mehrfach → Mehrfach', two(4, 5), two(1, 2), 3, true]];
    for (const [n, a, c, want, tray] of cases) {
      await p.evaluate(a); await W(60); await p.evaluate(c); await W(1600);
      const s = await shown();
      T(mode + ': ' + n + ': Anzeige bleibt beim neuen Wurf (' + want + ')', s.tv === String(want) && s.log === want && s.tray === tray, s);
      await W(4500);
      const s2 = await shown(); T(mode + ': ' + n + ': danach keine alte Anzeige, Zähler frei', (s2.tv === null || s2.tv === String(want)) && s2.busy === 0, s2);
    }
    { await p.evaluate(one(7)); await W(60); await p.evaluate(() => pushLog({ label: 'Hinweis', total: '✦', detail: 'kein Wurf' })); await W(1600);
      const s = await p.evaluate(() => ({ hidden: document.querySelector('#toast').hidden, busy: VFX_RT.busy })); T(mode + ': Würfel → Meldung ohne Würfel: alter Wurf taucht nicht wieder auf', s.hidden, s); }
    { const r = []; for (let i = 0; i < 30; i++) { await p.evaluate(i % 3 ? one(1 + (i % 20)) : two(1 + (i % 6), 2)); await W(25); } await W(2500);
      const s = await shown(); T(mode + ': 30 schnelle Würfe: letzte Summe sichtbar', s.tv === String(s.log), s); await W(4500); r.push(await p.evaluate(() => VFX_RT.busy)); T(mode + ': 30 schnelle Würfe: Zähler danach frei', r[0] === 0, r); }
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_w3d', '0'); localStorage.setItem('hb_rules', JSON.stringify({ homeview: true })); });
  await p.goto('file://' + target); await p.waitForTimeout(500);
  const sh = await p.evaluate(() => { const mk = (shield) => { const ch = normChar(newChar({ name: 'S', cls: 'fig', level: 5, weapons: [{ w: 'longsword' }] })); ch.shield = shield; S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'sheet'; S.mg = 'kampf'; render(); return [...document.querySelectorAll('button[data-act=dmg]')].some((x) => /2H/.test(x.textContent)); }; return { mit: mk(true), ohne: mk(false) }; });
  T('Vielseitige Waffe: Schnellschaden «2H» nur ohne Schild', !sh.mit && sh.ohne, sh);
  const fw = await p.evaluate(() => { const ch = normChar(newChar({ name: 'F', cls: 'hxform', level: 20 })); S.chars = { [ch.id]: ch }; S.cur = ch.id; ch.play.localFight = true; turnReset(ch); const c = derive(ch, S.hb);
    const o = turnOpts(c).filter((x) => /^f:hx_form_\d+e$/.test(x.id)); const sizes = [...new Set(o.map((x) => x.n.split('+').length))].sort(); turnRun(ch, o.find((x) => x.n.split('+').length === 2).id); const t = turnSt(ch);
    return { n: o.length, sizes, forms: ch.play.hxForms.length, b: t.b, again: turnOpts(derive(ch, S.hb)).filter((x) => /^f:hx_form_\d+e?$/.test(x.id)).length }; });
  T('Freier Wandel (Stufe 20): Zweier- und Dreierkombinationen, ohne Aktion, einmal pro Zug', fw.n === 10 && fw.sizes.join() === '2,3' && fw.forms === 2 && fw.b === 0 && fw.again === 0, fw);
  const hel = await p.evaluate(async () => { let n = 0; const ow = writeMe; writeMe = () => { n++; }; let cb = null; const fakeRef = { ping: () => Promise.resolve(), onSnapshot: (f) => { cb = f; return () => {}; } };
    const oDB = DB, oCamp = S.camp; DB = { doc: () => fakeRef }; S.camp = 'testraum'; subHello();
    for (let i = 0; i < 20; i++) cb({ exists: true, data: () => ({ from: 'u' + i, id: 'id' + i + Math.random(), t: Date.now() }) });
    for (let i = 0; i < 300; i++) cb({ exists: true, data: () => ({ from: 'v' + i, id: 'x' + i, t: Date.now() }) });
    await new Promise((r) => setTimeout(r, 1300)); const first = n; await new Promise((r) => setTimeout(r, 2500)); const res = { first, total: n, seen: helloSeen.size };
    writeMe = ow; DB = oDB; S.camp = oCamp; return res; });
  T('Viele Hello-Anfragen: eine gebündelte Antwort, Speicher begrenzt', hel.first <= 1 && hel.total <= 2 && hel.seen <= 200, hel);
  /* ---------- Audit HB-01 bis HB-15 ---------- */
  const au = await p.evaluate(() => { const r = {}; const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'A', base: { str: 14, dex: 14, con: 14, int: 16, wis: 10, cha: 8 } }, o))); S.chars = { [ch.id]: ch }; S.cur = ch.id; ch.play.localFight = true; turnReset(ch); return ch; };
    const raw = JSON.parse(JSON.stringify(newChar({ name: 'X', cls: 'hxform', level: 5 }))); raw.play.hxForms = {}; r.v1 = validateChar(raw).some((x) => /hxForms/.test(x)); const n1 = normChar(raw); r.d1 = (() => { try { derive(n1, S.hb); return true; } catch (e) { return e.message; } })();
    const raw2 = JSON.parse(JSON.stringify(newChar({ name: 'Y', cls: 'fig', level: 1 }))); raw2.multi = [{ cls: 'hxguard', level: 3 }, { cls: 'hxguard', level: 3 }]; r.v2 = validateChar(raw2).some((x) => /doppelt/.test(x)); const c2 = derive(normChar(raw2), S.hb); r.lv2 = c2.level; r.w2 = c2.warn.some((x) => /doppelt/.test(x));
    let ch = mk({ cls: 'fig', level: 5, multi: [{ cls: 'hxmind', level: 3 }] }); tSpend(ch, 'a', 'Angriff'); turnRun(ch, 'f:surge'); const a0 = turnSt(ch).a; turnRun(ch, 'f:hx_mind'); S.sa = null; orbPrompt(''); r.surgeBlock = turnSt(ch).a === a0;
    ch = mk({ cls: 'fig', level: 5, multi: [{ cls: 'hxmind', level: 3 }] }); turnRun(ch, 'f:hx_mind'); S.sa = null; orbPrompt(''); turnRun(ch, 'f:surge'); r.surgeAfter = tSpend(ch, 'a', 'Angriff') && turnSt(ch).a === 2;
    ch = mk({ cls: 'hxform', level: 20 }); ch.play.hp = 0; ch.play.dead = false; const o = turnOpts(derive(ch, S.hb)).find((x) => /^f:hx_form_\d+e$/.test(x.id)); if (o) turnRun(ch, o.id); r.incap = !ch.play.hxForms;
    ch = mk({ cls: 'hxguard', level: 2, base: { str: 14, dex: 10, con: 3, int: 10, wis: 10, cha: 8 } }); turnRun(ch, 'f:hx_intercept'); r.icp = S.log[0] && S.log[0].detail;
    ch = mk({ cls: 'hxexec', level: 3, sub: 'reaper', weapons: [] }); turnRun(ch, 'f:hx_reap'); r.reapB = turnSt(ch).b; ch = mk({ cls: 'hxexec', level: 3, sub: 'reaper', weapons: [{ w: 'longbow' }] }); r.reapCheck = FEAT_ACTIONS.find((f) => f.id === 'hx_reap').check(ch, derive(ch, S.hb));
    ch = mk({ cls: 'hxthread', level: 1, sub: 'marionette' }); r.tail1 = hxPulseTail(derive(ch, S.hb), 'hxthread'); ch = mk({ cls: 'hxmind', level: 1 }); r.tailM = hxPulseTail(derive(ch, S.hb), 'hxmind');
    r.ts = hxExtraEligible({ hxGroup: 'hxexec' }, { idx: 0, melee: true }, mk({ cls: 'hxexec', level: 5 }), { ts: true });
    const c1 = mk({ cls: 'hxmind', level: 3 }), c2b = normChar(newChar({ name: 'B', cls: 'fig' })); S.chars[c2b.id] = c2b; S.sa = { name: 'Geistimpuls', sid: 'hx_mind', k: 1, count: 1, expr: '1W8', cid: c1.id }; S.cur = c2b.id; const nlog = S.log.length; saHit(); r.saBound = S.sa === null && !/Geistimpuls: Schaden/.test((S.log[0] || {}).label || '');
    r.big = rollExpr('99999W99999+2').groups[0].rolls.length;
    return r; });
  T('HB-01: ungültige Wandelgestalt wird beim Import gemeldet und bricht die Berechnung nicht', au.v1 && au.d1 === true, au);
  T('HB-02: doppelte Mehrklasse wird gemeldet und nur einmal gezählt', au.v2 && au.lv2 === 4 && au.w2, au);
  T('HB-04: Zusatzaktion aus Tatendrang erlaubt keine Magieaktion, umgekehrte Reihenfolge schon', au.surgeBlock && au.surgeAfter, au);
  T('HB-05: freier Wandel nicht bei 0 TP', au.incap, au);
  T('HB-07: Abfangen mit KON-Mod mindestens 1', /\+\s?1\b/.test(au.icp || ''), au.icp);
  T('HB-08: Nachsetzen ohne Waffe verbraucht nichts, mit Bogen möglich', au.reapB === 0 && au.reapCheck === null, au);
  T('HB-09/10: keine Unterklassenhinweise vor Stufe 3, klarer Geistimpuls-Hinweis', !/Marionettenhieb/.test(au.tail1) && /Einmal pro Magieaktion/.test(au.tailM), [au.tail1, au.tailM]);
  T('HB-13: Urteil auch mit True Strike', au.ts === true, au.ts);
  T('HB-14: Angriffsdialog bricht nach Heldenwechsel ab', au.saBound, au);
  T('HB-15: Würfelausdruck begrenzt', au.big === 1000, au.big);
  /* HB-12: nur regelkonformes Multiclassing (Entscheid 25.11.) */
  const mcr = await p.evaluate(() => { const ch = normChar(newChar({ name: 'M', cls: 'wiz', level: 3, base: { str: 10, dex: 12, con: 14, int: 16, wis: 13, cha: 8 } })); S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'build';
    let opts = null; for (let st = 0; st < 7; st++) { S.step = st; render(); const sel = document.getElementById('addMc'); if (sel) { opts = [...sel.options].filter((o) => o.value).map((o) => o.value + (o.disabled ? '-' : '+')); break; } }
    const sel = document.getElementById('addMc'); sel.value = 'fig'; sel.dispatchEvent(new Event('change', { bubbles: true })); const after = (ch.multi || []).length;
    const ok = mcBlock(ch, 'cle'), no = mcBlock(ch, 'fig'); return { opts, after, ok, no }; });
  T('Mehrklasse nur regelkonform: Kämpfer gesperrt (STÄ/GES unter 13), Kleriker möglich', mcr.opts.includes('fig-') && mcr.opts.includes('cle+') && mcr.after === 0 && mcr.ok === null && /Kämpfer/.test(mcr.no), mcr);
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
