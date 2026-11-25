/* Tischhilfen aus der Produktanalyse: eigene Würfel eingeben (F11), Zugleiste unabhängig von der Hilfe-Stufe (F14),
   Ladungen pro Gegenstand (F06), Regeln der Runde (F20), Vorbereiten mit Auslöser und Reaktion (F04, klein).
   Aufruf: node tests/tischhilfen.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 500))); };
const W = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
  await p.goto('file://' + target); await p.waitForTimeout(500);
  const fresh = () => p.evaluate(() => { const ch = normChar(newChar({ name: 'Wurf', cls: 'fig', level: 5 })); ch.abilities = { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }; S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'sheet'; S.mg = 'alle'; S.camp = ''; S.combat = null; S.mode = 'normal'; S.echtV = ''; hlSetLevel('std'); render(); });
  await fresh();

  /* ---- F11 Eigene Würfel ---- */
  T('F11: ohne Einstellung kein Feld «Wurf»', await p.evaluate(() => !document.getElementById('echtIn')));
  await p.evaluate(() => { XA.diceOpen(); }); await W(100);
  T('F11: Würfel-Set bietet «Eigene Würfel»', await p.evaluate(() => !!document.querySelector('[data-act="echtSet"][data-arg="1"]')));
  await p.click('[data-act="echtSet"][data-arg="1"]'); await W(100);
  await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; });
  T('F11: eingeschaltet: Feld «Wurf» im Bogenkopf', await p.evaluate(() => !!document.getElementById('echtIn') && echtOn()));
  const roll = (val, mod, kind) => p.evaluate(([v, m, k]) => { const el = document.getElementById('echtIn'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); const tot = d20(m, 'Probe', { kind: k || 'check' }); return { tot, nat: S.log[0].nat, det: S.log[0].detail, left: S.echtV, field: (document.getElementById('echtIn') || {}).value }; }, [val, mod, kind]);
  { const r = await roll('17', 5); T('F11: 17 eingegeben → W20 17, Summe 22, als echter Würfel vermerkt, Feld leer', r.tot === 22 && r.nat === 17 && /echter Würfel/.test(r.det) && r.left === '' && r.field === '', r); }
  { const r = await p.evaluate(() => { const t = d20(5, 'Probe', { kind: 'check' }); return { t, det: S.log[0].detail }; }); T('F11: Feld leer → die App würfelt', typeof r.t === 'number' && !/echter/.test(r.det), r); }
  { const r = await roll('25', 0); await W(200); const ban = await p.evaluate(() => document.querySelector('#mini').textContent);
    T('F11: 25 ungültig → App würfelt, Hinweis', !/echter/.test(r.det) && /Wurf ungültig/.test(ban), { r, ban }); }
  await p.evaluate(() => { S.mode = 'adv'; });
  { const r = await roll('17 9', 0); T('F11: Vorteil mit 17 9 → 17', r.nat === 17 && /Vorteil 17\/9/.test(r.det), r); }
  { const r = await roll('4', 0); T('F11: Vorteil mit nur einem Wert → zweiter W20 von der App, vermerkt', /zweiter W20 von der App/.test(r.det), r); }
  await p.evaluate(() => { S.mode = 'dis'; });
  { const r = await roll('17/9', 0); T('F11: Nachteil mit 17/9 → 9', r.nat === 9, r); }
  await p.evaluate(() => { S.mode = 'normal'; });
  { const r = await roll('20', 4, 'attack:str:melee'); const la = await p.evaluate(() => S.lastAttack); T('F11: echte 20 beim Angriff → kritischer Treffer', la && la.crit === true && la.nat === 20, la); }
  { const r = await p.evaluate(() => { S.echtV = '8'; const x = rollExpr('2W6+3'); return x; }); T('F11: Schaden 2W6+3 mit Augensumme 8 → 11', r.total === 11 && r.real === true, r); }
  { const r = await p.evaluate(() => { S.echtV = '13'; const x = rollExpr('2W6+3'); return x; }); await W(100); T('F11: Augensumme 13 bei 2W6 unmöglich → App würfelt', !r.real && r.total >= 5 && r.total <= 15, r); }
  { const r = await p.evaluate(() => { S.echtV = '9'; const x = rollParts([{ n: 2, s: 6, tag: 'Hieb' }, { n: 1, s: 8, tag: 'Niederstrecken' }], 3); return x; }); T('F11: Schaden aus Teilen: Augensumme 9 + 3', r.total === 12 && r.real && /echte Würfel 9/.test(r.detail), r); }
  { const r = await p.evaluate(() => { S.echtV = '8'; const x = rollExpr('2W6+3'); pushLog({ label: 'Schaden', groups: x.groups, total: x.total, detail: x.detail, sides: 6, nat: x.total }); return { e: S.log[0].sides, real: S.log[0].real }; }); T('F11: Schaden mit echten Würfeln zeigt keinen falschen Einzelwürfel', r.e === 0 && r.real === true, r); }
  { const r = await p.evaluate(() => { const ch = cur(); ch.play.hp = 0; ch.play.ds = [0, 0]; ch.play.stable = false; render(); S.echtV = '20'; document.querySelector('[data-act="deathRoll"]').click(); return { hp: cur().play.hp, det: S.log[0].detail }; }); T('F11: Todesrettungswurf mit echter 20 → 1 TP', r.hp === 1 && /echter Würfel/.test(r.det), r); }
  /* 320 px: Kopfleiste mit Feld läuft nicht über */
  await p.setViewportSize({ width: 320, height: 740 }); await fresh(); await W(200);
  { const o = await p.evaluate(() => { const s = document.querySelector('.sheet .sctl'); const r = s.getBoundingClientRect(); const f = document.getElementById('echtIn').getBoundingClientRect(); return { sw: s.scrollWidth, cw: s.clientWidth, right: Math.round(f.right), vw: innerWidth, doc: document.documentElement.scrollWidth }; });
    T('F11: 320 px: Feld passt in die Kopfleiste', o.sw <= o.cw + 1 && o.right <= o.vw && o.doc <= o.vw, o); }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => { localStorage.setItem('hb_echt', '0'); });

  /* ---- F14 Zugleiste unabhängig ---- */
  await fresh();
  await p.evaluate(() => { hlSetLevel('pro'); hlOpen(); });
  { const r = await p.evaluate(() => { const z = document.querySelector('.hlzug input[data-arg="zug"]'); const det = document.querySelector('.hlfine'); return { z: !!z, vis: z && z.offsetParent !== null, checked: z && z.checked, inDet: !!(det && det.querySelector('[data-arg="zug"]')) }; });
    T('F14: Erfahren: Schalter «Zugleiste» sichtbar ausserhalb von «Einzeln anpassen», aus', r.z && r.vis && r.checked === false && !r.inDet, r); }
  await p.click('.hlzug input[data-arg="zug"]'); await W(100);
  { const r = await p.evaluate(() => ({ zug: hlOn('zug'), erkl: hlOn('erkl'), lvl: hlState().lvl, track: turnTrack() })); T('F14: Zugleiste an, Erklärungen bleiben aus (Stufe Erfahren, angepasst)', r.zug && !r.erkl && r.lvl === 'pro' && r.track, r); }
  await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; hlSetLevel('pro'); const ch = cur(); S.camp = 'raum'; S.table = { [UID]: { char: ch.name } }; S.meta = { dm: 'u3', mercy: {} }; S.combat = { id: 'k1', active: true, round: 1, turn: 'p:' + UID, npcs: [] }; render(); });
  T('F14: Erfahren am Tisch im Kampf: Knopf «Zug mitzählen»', await p.evaluate(() => !!document.querySelector('.turnblk [data-act="hlT"][data-arg="zug"]')));
  await p.click('.turnblk [data-act="hlT"][data-arg="zug"]'); await W(100);
  T('F14: «Zug mitzählen» schaltet nur die Zugleiste ein', await p.evaluate(() => hlOn('zug') && !hlOn('erkl') && !!document.querySelector('.turnblk:not(.slim)')));
  await p.evaluate(() => { hlSetLevel('std'); S.camp = ''; S.combat = null; S.table = {}; render(); });

  /* ---- F06 Ladungen ---- */
  await fresh();
  await p.evaluate(() => { const ch = cur(); ch.items = [{ uid: 'w1', id: 'wand-fireballs', att: true, eq: true, qty: 1, w: '' }, { uid: 'w2', id: 'wand-fireballs', att: true, eq: true, qty: 1, w: '' }, { uid: 'n1', id: 'nine-lives', att: true, eq: true, qty: 1, w: '' }, { uid: 'p1', id: Object.keys(MAGIC_ITEMS).find((k) => MAGIC_ITEMS[k].drink), qty: 2 }]; S.mg = 'gear'; render(); });
  const chg = (uid) => p.evaluate((u) => { const el = [...document.querySelectorAll('.itchg')].find((x) => x.querySelector('[data-arg="' + u + '"]')); return el ? el.textContent.replace(/\s+/g, ' ') : null; }, uid);
  T('F06: Zauberstab der Feuerbälle: 7 / 7 aus dem Text', /7 \/ 7/.test(await chg('w1') || ''), await chg('w1'));
  await p.click('[data-act="itChg"][data-arg="w1"][data-d="1"].btn'); await W(100);
  { const a = await chg('w1'), c = await chg('w2'), lg = await p.evaluate(() => S.log[0]); T('F06: Ladung einsetzen: 6 / 7, zweiter Stab bleibt 7 / 7, Eintrag im Verlauf', /6 \/ 7/.test(a) && /7 \/ 7/.test(c) && /Ladung eingesetzt/.test(lg.label) && lg.total === '6 / 7', { a, c, lg }); }
  await p.click('[data-act="itChg"][data-arg="w1"][data-d="-1"]'); await W(100);
  T('F06: + gibt eine Ladung zurück (nicht über das Maximum)', /7 \/ 7/.test(await chg('w1')) && await p.evaluate(() => document.querySelector('[data-act="itChg"][data-arg="w1"][data-d="-1"]').disabled));
  T('F06: «1W8+1 Ladungen» wird nicht als fester Wert gelesen → «Ladungen zählen»', await p.evaluate(() => !!document.querySelector('[data-act="itChgOn"][data-arg="n1"]') && itemChgMax(cur().items[2]) === 0));
  T('F06: Trank bekommt keinen Ladungszähler', await p.evaluate(() => !document.querySelector('[data-arg="p1"][data-act^="itChg"]')));
  await p.click('[data-act="itChgOn"][data-arg="n1"]'); await W(100);
  await p.fill('[data-xact="itChgMax"][data-uid="n1"]', '9'); await p.dispatchEvent('[data-xact="itChgMax"][data-uid="n1"]', 'change'); await W(150);
  T('F06: eigener Höchstwert 9 → 9 / 9', /9 \/ 9/.test(await chg('n1') || ''), await chg('n1'));
  { const r = await p.evaluate(() => { for (let i = 0; i < 8; i++) XA.itChg({ dataset: { d: '1' } }, 'w2', null, cur()); render(); const x = cur().items[1]; const ex = JSON.parse(JSON.stringify(cur())); return { u: x.chgU, btn: document.querySelector('.btn[data-act="itChg"][data-arg="w2"]').disabled, ex: ex.items[1].chgU, edit: 'chgEdit' in ex.items[2] }; });
    T('F06: nicht unter 0, Knopf gesperrt, Stand im gespeicherten Helden', r.u === 7 && r.btn && r.ex === 7 && !r.edit, r); }
  { const r = await p.evaluate(() => { const ch = cur(); doRest(ch, 'long', true); return ch.items[1].chgU; }); T('F06: Lange Rast lädt nicht automatisch auf (steht beim Gegenstand)', r === 7, r); }

  /* ---- F20 Regeln der Runde ---- */
  await fresh();
  await p.evaluate(() => { localStorage.removeItem('hb_rules'); S.rules = null; try { sessionStorage.clear(); } catch (e) {} const ch = cur(); S.camp = 'raum'; S.table = { [UID]: { char: ch.name } }; ch.play.camps = { raum: 1 };
    S.meta = { dm: 'u3', mercy: {}, rules: Object.assign(Object.fromEntries(Object.keys(RULE_OPTS).map((k) => [k, rule(k)])), { strict: false, restcombat: false }), rulesAt: 1234 }; S.view = 'camp'; render(); paintCamp(); applyMeta(); });
  await W(200);
  { const r = await p.evaluate(() => { const s = document.querySelector('.trules'); return { s: s ? s.textContent : '', ban: document.querySelector('#mini').textContent }; });
    T('F20: Spieler sieht Abweichungen der Spielleitung (streng, Rast im Kampf) und einen Hinweis', /Regeln streng durchsetzen/.test(r.s) && /Keine Rast während eines Kampfes/.test(r.s) && /Spielleitung: aus · du: an/.test(r.s) && !/Stufe 20/.test(r.s) && /Regeln der Runde/.test(r.ban), r); }
  T('F20: nichts wird heimlich geändert', await p.evaluate(() => rule('strict') === true && rule('restcombat') === true));
  await p.click('[data-act="trTake"]'); await W(100);
  { const r = await p.evaluate(() => ({ st: rule('strict'), rc: rule('restcombat'), saved: JSON.parse(localStorage.getItem('hb_rules')).strict, box: !!document.querySelector('.trules') })); T('F20: «Übernehmen» setzt genau die Abweichungen, Block verschwindet', r.st === false && r.rc === false && r.saved === false && !r.box, r); }
  await p.evaluate(() => { S.rules.strict = true; localStorage.setItem('hb_rules', JSON.stringify(S.rules)); render(); paintCamp(); });
  T('F20: neue Abweichung erscheint wieder', await p.evaluate(() => !!document.querySelector('.trules')));
  await p.click('[data-act="trKeep"]'); await W(100);
  T('F20: «Meine behalten» blendet den Vorschlag aus, Regel bleibt', await p.evaluate(() => !document.querySelector('.trules') && rule('strict') === true));
  { const r = await p.evaluate(() => { UID = 'ich'; S.meta.dm = UID; render(); paintCamp(); return { dm: !!document.querySelector('[data-act="trPropose"]'), mine: !!document.querySelector('.trules') }; }); T('F20: Spielleitung hat «Regeln der Runde» in ihren Werkzeugen, sieht keinen Vorschlag an sich selbst', r.dm && !r.mine, r); }
  { const r = await p.evaluate(() => { const old = saveMeta; let got = null; saveMeta = (x) => { got = x; }; XA.trPropose(); saveMeta = old; return got; }); T('F20: Vorschlag enthält alle Regeloptionen', r && r.rules && Object.keys(r.rules).length === await p.evaluate(() => Object.keys(RULE_OPTS).length) && r.rulesAt > 0, r); }
  await p.evaluate(() => { localStorage.removeItem('hb_rules'); S.rules = null; S.camp = ''; S.meta = { dm: null, mercy: {} }; S.table = {}; S.view = 'sheet'; render(); });

  /* ---- F04 Vorbereiten ---- */
  await fresh();
  await p.evaluate(() => { const ch = cur(); ch.play.localFight = true; turnReset(ch); S.mg = 'kampf'; render(); stdRun(ch, derive(ch, S.hb), 'ready'); });
  await W(100);
  T('F04: Vorbereiten fragt nach Auslöser und Handlung', await p.evaluate(() => !!document.getElementById('readyTrig') && !!document.getElementById('readyWhat')));
  await p.click('[data-act="readyGo"]'); await W(50);
  T('F04: ohne Auslöser kein Vorbereiten', await p.evaluate(() => !cur().play.ready && document.getElementById('readyTrig').getAttribute('aria-invalid') === 'true'));
  await p.fill('#readyTrig', 'Sobald die Tür aufgeht'); await p.fill('#readyWhat', 'Angriff mit dem Langschwert'); await p.click('[data-act="readyGo"]'); await W(150);
  { const r = await p.evaluate(() => ({ rd: cur().play.ready, chip: !!document.querySelector('[data-act="readyFire"]'), txt: (document.querySelector('.turnblk') || {}).textContent || '' })); T('F04: vorbereitet: Anzeige im Zugbereich mit «Auslösen (R)»', r.rd && r.rd.trig === 'Sobald die Tür aufgeht' && r.chip && /Vorbereitet: Sobald die Tür aufgeht → Angriff mit dem Langschwert/.test(r.txt), r); }
  await p.evaluate(() => { turnReset(cur(), true); render(); });
  T('F04: Zugende behält die Vorbereitung', await p.evaluate(() => !!cur().play.ready));
  await p.click('[data-act="readyFire"]'); await W(100);
  { const r = await p.evaluate(() => ({ rd: cur().play.ready, r: turnSt(cur()).r, log: S.log[0].label })); T('F04: Auslösen verbraucht die Reaktion', !r.rd && r.r === 1 && /ausgelöst/.test(r.log), r); }
  await p.evaluate(() => { const ch = cur(); ch.play.ready = { trig: 'x', what: '', t: 1 }; render(); });
  await p.click('[data-act="readyFire"]'); await W(100);
  T('F04: Reaktion schon verbraucht (streng) → nicht ausgelöst', await p.evaluate(() => !!cur().play.ready));
  await p.evaluate(() => { turnReset(cur()); render(); });
  T('F04: Beginn des nächsten eigenen Zugs: Vorbereitung verfällt', await p.evaluate(() => !cur().play.ready && !document.querySelector('[data-act="readyFire"]')));

  T('keine Seitenfehler', errs.length === 0, errs);
  console.log('\n' + pass + ' bestanden, ' + fail + ' fehlgeschlagen'); await b.close(); process.exit(fail ? 1 : 0);
})();
