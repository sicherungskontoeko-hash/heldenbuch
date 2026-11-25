/* Kampf am Tisch: eigener Zug gut sichtbar. Grosse Ansage zu Zugbeginn (role=status, verschwindet wieder), schwebender Knopf
   «Zug beenden», sobald die Zugleiste weggescrollt ist, «danach du» in der Leiste, kein Knopf, wenn jemand anderes dran ist,
   bei reduzierter Bewegung Ansage ohne Animation. Kampfregeln gelten am Tisch für alle (inFight).
   Aufruf: node tests/zug.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const SETUP = (turnMine) => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf';
  S.camp = 'raum'; S.table = { [UID]: { char: c.name, init: { cid: 'k9', v: 8 } }, u2: { char: 'Lyra', init: { cid: 'k9', v: 14 } } }; S.meta = { dm: 'u3', mercy: {} };
  S.combat = { id: 'k9', active: true, round: 2, turn: turnMine ? 'p:' + UID : 'p:u2', npcs: [] }; render(); paintTurn(); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [n, opts] of [['handy', { viewport: { width: 390, height: 844 } }], ['reduziert', { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); }); await p.goto('file://' + target); await p.waitForTimeout(500);
    await p.evaluate(SETUP, false);
    const other = await p.evaluate(() => ({ bar: document.querySelector('#turnbar').textContent, pill: !!document.querySelector('#turnpill'), call: !!document.querySelector('.turncall'), fight: inFight(cur()) }));
    T(n + ': andere dran: «danach du», kein Knopf, keine Ansage, Kampfregeln gelten', /Am Zug: Lyra/.test(other.bar) && /danach du/.test(other.bar) && !other.pill && !other.call && other.fight, other);
    await p.evaluate(() => { S.combat.turn = 'p:' + UID; paintTurn(); }); await p.waitForTimeout(300);
    const call = await p.evaluate(() => { const el = document.querySelector('.turncall'); return el ? { txt: el.textContent, role: el.getAttribute('role'), op: +getComputedStyle(el).opacity } : null; });
    T(n + ': eigener Zug: grosse Ansage «Du bist am Zug!» mit Runde und Name, wird vorgelesen', call && /Du bist am Zug!/.test(call.txt) && /Runde 2/.test(call.txt) && /Brann/.test(call.txt) && call.role === 'status' && call.op > 0.5, call);
    await p.waitForTimeout(2000);
    T(n + ': Ansage verschwindet wieder', await p.evaluate(() => !document.querySelector('.turncall')));
    T(n + ': oben sichtbar: schwebender Knopf noch versteckt', await p.evaluate(() => !document.querySelector('#turnpill.on') && !!document.querySelector('#turnpill')));
    await p.evaluate(() => window.scrollTo(0, 1200)); await p.waitForTimeout(400);
    const pill = await p.evaluate(() => { const el = document.querySelector('#turnpill.on'); if (!el) return null; const r = el.getBoundingClientRect(); const nav = document.querySelector('#bnav').getBoundingClientRect(); return { inView: r.top > 0 && r.bottom < innerHeight, aboveNav: r.bottom <= nav.top + 1, btn: !!el.querySelector('[data-act="turnEnd"]') }; });
    T(n + ': weggescrollt: schwebender Knopf «Zug beenden» über der unteren Leiste', pill && pill.inView && pill.aboveNav && pill.btn, pill);
    await p.evaluate(() => paintTurn()); await p.waitForTimeout(100);
    T(n + ': Neuzeichnen im selben Zug: keine zweite Ansage', await p.evaluate(() => !document.querySelector('.turncall')));
    await p.evaluate(() => { S.combat.turn = 'p:u2'; paintTurn(); });
    T(n + ': Zug vorbei: Knopf weg', await p.evaluate(() => !document.querySelector('#turnpill')));
    await ctx.close(); }
  /* Ohne Online-Tisch: Initiative würfeln schaltet den Kampfmodus ein */
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); }); await p.goto('file://' + target); await p.waitForTimeout(500);
    await p.evaluate(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; S.camp = ''; S.combat = null; hlSetLevel('std'); render(); });
    await p.click('[data-act="d20"][data-kind="init"]'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ lf: cur().play.localFight, chip: (document.querySelector('[data-act="tFight"]') || {}).textContent || '', banner: /Kampfmodus an/.test(document.querySelector('#mini').textContent) }));
    T('Allein: Initiative würfeln schaltet den Kampfmodus ein (mit Meldung)', r.lf === true && /Kampfmodus an/.test(r.chip) && r.banner, r);
    const slot = await p.evaluate(() => { const ch = cur(); turnSt(ch).slotSpell = true; return spellCheck(ch, derive(ch, S.hb), getSpell('bless', S.hb), 1).turn.join(' '); });
    T('Danach gilt «ein Zauberplatz pro Zug»', /nur einen Zauberplatz/.test(slot), slot);
    await p.evaluate(() => { cur().play.localFight = false; hlSetLevel('pro'); render(); }); await p.click('[data-act="d20"][data-kind="init"]'); await p.waitForTimeout(300);
    T('Stufe «Erfahren» (ohne Zugleiste): bleibt aus', await p.evaluate(() => cur().play.localFight === false));
    await ctx.close(); }
  { /* Grosstest Befund 1: ausserhalb des eigenen Zugs nur Reaktionen */
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_w3d', '0'); });
    await p.goto('file://' + target); await p.waitForTimeout(400);
    const r = await p.evaluate(`(${SETUP.toString()})(false); (() => { const ch = cur(); turnReset(ch); const a = tSpend(ch, 'a', 'Test'), bb = tSpend(ch, 'b', 'Test'), rr = tSpend(ch, 'r', 'Test'); const t = turnSt(ch); return { a, bb, rr, ta: t.a, tb: t.b, tr: t.r }; })()`);
    T('Strenge Regeln am Tisch: im fremden Zug keine Aktion und Bonusaktion, Reaktion erlaubt', r.a === false && r.bb === false && r.rr === true && r.ta === 0 && r.tb === 0 && r.tr === 1, r);
    const r2 = await p.evaluate(`(${SETUP.toString()})(true); (() => { const ch = cur(); turnReset(ch); return tSpend(ch, 'a', 'Test') && tSpend(ch, 'b', 'Test'); })()`);
    T('Im eigenen Zug: Aktion und Bonusaktion wie gewohnt', r2 === true);
    await p.close(); }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
