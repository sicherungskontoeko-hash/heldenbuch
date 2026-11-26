/* GK-01 und GK-07: Vertrauensgrenze am Online-Tisch.
   Fremde Kampf-, Runden- und Spielerdokumente kommen über den echten Snapshot-Eingang (Ersatz-Datenbank im Browser)
   und über einen lokalen MQTT-Broker (aedes, Ports 8896/8897, App-Version) an. Geprüft wird: ungültige Dokumente
   ändern nichts, gültige Dokumente aus den echten Erzeugern bleiben vollständig erhalten, fremder Text wirkt nie als HTML.
   Aufruf: node tests/gk-netz.test.js [index.html]   (Teil 2 braucht app/www aus python3 build_app.py) */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
const MARK = '<span class="gk01-marker">Test</span>';
const X = '"><img src=x class=xssmark onerror="window.__xss=(window.__xss||0)+1"><svg onload="window.__xss=(window.__xss||0)+1" class=xssmark>\'';

/* Gemeinsame Hilfen im Browser: Ersatz-Datenbank, Snapshot-Eingang, gültiger Grundzustand */
const SETUP = () => {
  window.__subs = {}; window.__writes = [];
  const ref = (p) => ({ path: p, onSnapshot: (fn) => { __subs[p] = fn; return () => { if (__subs[p] === fn) delete __subs[p]; }; }, set: async (v) => { __writes.push({ p, v: JSON.parse(JSON.stringify(v)) }); }, delete: async () => { __writes.push({ p, del: true }); }, get: async () => ({ exists: false, data: () => null }), ping: async () => {} });
  DB = { doc: (p) => ref(p), collection: (p) => Object.assign(ref(p), { doc: (id) => ref(p + '/' + id), get: async () => ({ docs: [], empty: true }) }) }; UID = 'ich';
  window.__room = 'raum';
  window.__C = (doc, exists = true, room) => { const f = __subs['camp/' + (room || __room) + '/state/combat']; if (f) f({ exists, data: () => doc }); };
  window.__M = (doc, exists = true, room) => { const f = __subs['camp/' + (room || __room) + '/state/meta']; if (f) f({ exists, data: () => doc }); };
  window.__P = (docs, room) => { const f = __subs['camp/' + (room || __room) + '/players']; if (f) f({ docs: Object.entries(docs).map(([id, v]) => ({ id, data: () => v })) }); };
  window.__J = (x) => JSON.stringify(x);
  window.__DM = () => ({ dm: 'ich', dmPlays: true, mercy: {} }); /* eigene Spielleitung, spielt selbst mit: alle vier in der Initiative */
  window.__base = () => { const now = Date.now(); return { id: 'k1', active: true, round: 2, turn: 'n:n1', turnAt: { v: 15, dex: 2, name: 'Goblin 1' }, rev: 3, w: 'u2', t: now,
    npcs: [{ id: 'n1', mid: 'goblin', name: 'Goblin 1', v: 15, dex: 2, hp: 7, hpMax: 10, ac: 15, grp: null, cond: [] }, { id: 'n2', name: 'Wache', v: -2, dex: 0, hp: 0, hpMax: 11, ac: 16, cond: ['prone'], note: 'flieht' }],
    effects: [{ id: 'e1', name: 'Segen', cond: '', src: 'p:u2', tgt: 'p:ich', left: 3, at: 'start', conc: true, save: null, t: now }],
    rem: [], log: [{ t: now, x: 'Kampf beginnt' }], hits: [], reqs: [], saveRes: [] }; };
  window.__players = () => ({ ich: { char: 'Aldric', pl: 'Manu', cls: 'fighter', clsName: 'Kämpfer', level: 3, hp: 20, hpMax: 28, ac: 16, dex: 1, cond: [], rolls: [], init: { v: 12, cid: 'k1' }, dead: false, deadAt: 0, t: Date.now() },
    u2: { char: 'Bryn', pl: 'Sara', cls: 'wizard', clsName: 'Magier', level: 3, hp: 14, hpMax: 18, ac: 12, dex: 2, cond: ['Liegend'], rolls: [], init: { v: 18, cid: 'k1' }, dead: false, deadAt: 0, t: Date.now() } });
  window.__dom = () => ({ mark: document.querySelectorAll('.gk01-marker,.xssmark,img[src="x"],.gk09').length, run: window.__xss || 0 });
  window.__act = (act, arg, ds) => { const b = document.createElement('button'); b.dataset.act = act; if (arg != null) b.dataset.arg = arg; Object.assign(b.dataset, ds || {}); document.body.appendChild(b); b.click(); b.remove(); };
  window.__paint = (v) => { S.view = v || 'camp'; render(); paintCamp(); paintTurn(); };
};

const ONLY2 = process.argv.includes('--teil=2');
(async () => {
  if (!ONLY2) await teil1();
  await teil2();
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

async function teil1() {
  const b = await chromium.launch(); const errs = []; const reqs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('Dialog: ' + d.message()); d.dismiss(); });
  p.on('request', (r) => { const u = r.url(); if (!/^(file:|data:|blob:|about:)/.test(u)) reqs.push(u); });
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
  await p.goto('file://' + target); await p.waitForTimeout(700);
  /* Schriften lädt die Artefakt-Fassung immer von Google Fonts; alles andere wäre eine unerwartete Anfrage */
  const extReq = () => reqs.filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u));
  await p.evaluate(SETUP);
  await p.evaluate(() => { const ch = sampleChar(); ch.name = 'Aldric'; S.chars = { [ch.id]: ch }; S.cur = ch.id; joinCamp('raum', true); __P(__players()); __M(__DM()); __C(__base()); __paint(); });
  await p.waitForTimeout(200);
  const ok0 = await p.evaluate(() => ({ round: S.combat && S.combat.round, n: (S.combat && S.combat.npcs || []).length, dm: isDM() }));
  T('Grundzustand: gültiger Kampf kommt über den Snapshot an', ok0.round === 2 && ok0.n === 2 && ok0.dm, ok0);

  /* ---------------- GK-01 ---------------- */
  {
    const r = await p.evaluate((MARK) => { const before = __J(S.combat); const d = __base(); d.round = MARK; __C(d); __paint(); return { same: __J(S.combat) === before, round: S.combat.round, dom: __dom(), txt: (document.querySelector('.fhead h2') || {}).textContent }; }, MARK);
    T('GK01-T01 Marker in round über den Snapshot: abgewiesen, letzter Stand bleibt, kein DOM-Marker', r.same && r.round === 2 && r.dom.mark === 0, r);
    const r2 = await p.evaluate((MARK) => { const keep = S.combat; S.combat = Object.assign({}, keep, { round: MARK }); __paint(); const h = { dom: __dom(), h2: (document.querySelector('.fhead h2') || {}).textContent, tb: (document.querySelector('.tbr') || {}).textContent }; turnCall(MARK); h.call = document.querySelectorAll('.turncall .gk01-marker').length; document.querySelectorAll('.turncall').forEach((x) => x.remove()); S.combat = keep; __paint(); return h; }, MARK);
    T('GK01-T01 Renderer ohne Validator (direkt gesetzt): round nur als Text in Kampfkopf, Zugleiste und Zugansage', r2.dom.mark === 0 && r2.call === 0 && r2.h2.includes('gk01-marker') && r2.tb.includes('gk01-marker'), r2);
  }
  {
    const r = await p.evaluate((MARK) => { const before = __J(S.combat); const out = {};
      for (const [k, v] of [['hp', MARK], ['hpMax', MARK], ['ac', MARK], ['v', MARK], ['dex', MARK], ['id', '"><i class="gk01-marker">'], ['atkN', MARK]]) { const d = __base(); d.npcs[0][k] = v; __C(d); out[k] = __J(S.combat) === before; }
      __paint(); return { out, dom: __dom() }; }, MARK);
    T('GK01-T02 Marker in numerischen NPC-Feldern/IDs über den Snapshot: alle abgewiesen', Object.values(r.out).every(Boolean) && r.dom.mark === 0, r);
    const r2 = await p.evaluate((MARK) => { const keep = S.combat; const res = {};
      S.combat = Object.assign({}, keep, { npcs: [{ id: 'q"><b class="gk01-marker">', name: 'Q', v: MARK, dex: MARK, hp: MARK, hpMax: MARK, ac: MARK, atkN: MARK, mid: 'goblin', cond: [] }].concat(keep.npcs.slice(1)),
        effects: [{ id: 'e"><b class="gk01-marker">', name: 'E', tgt: 'n:n2', left: MARK, cond: '', save: { ab: 'wis', dc: MARK, when: 'end' } }], rem: [{ id: 'r9', eff: 'e9', tgt: 'n:n2', ab: 'con', dc: MARK, name: 'R' }],
        reqs: [{ id: 'q9', by: 'Odem', ab: 'dex', dc: MARK, amount: MARK, to: ['u2'], t: Date.now() }], saveRes: [{ id: 'q9', uid: 'u2', total: MARK, ok: true, t: Date.now() }], turn: 'n:q"><b class="gk01-marker">' });
      S.sreqOpen = true; __paint(); res.view = __dom();
      res.attrs = document.querySelectorAll('[onerror],[onload],b.gk01-marker,i.gk01-marker').length > 0; res.ids = [...document.querySelectorAll('[data-arg]')].filter((e) => /gk01-marker/.test(e.dataset.arg)).length;
      try { npcModal(S.combat.npcs[0].id); } catch (e) { res.mErr = e.message; } res.modal = __dom(); S.modal = null; $('#modal').hidden = true;
      try { effForm(S.combat.effects[0].id); } catch (e) { res.eErr = e.message; } res.eff = __dom(); S.modal = null; $('#modal').hidden = true;
      try { hitPrompt({ by: 'Ork', amount: MARK, atk: MARK, dtype: 'Hieb', t: Date.now() }); } catch (e) { res.hErr = e.message; } res.hit = __dom(); orbPrompt(''); S.hitPend = null;
      try { riderPrompt({ by: 'Ork', rider: { kind: 'save', ab: 'KON', dc: MARK, txt: 'T', conds: [] } }); } catch (e) { res.rErr = e.message; } res.rider = __dom(); orbPrompt(''); S.riderPend = null;
      S.combat = keep; __paint(); return res; }, MARK);
    T('GK01-T02 Direkte Renderer-Fallbacks: Initiative, Gegnerzeile, Dialog, Effekte, Anfragen, Treffer, Zusatzeffekt ohne Element/Attribut (Kennung bleibt reiner Attributwert)', [r2.view, r2.modal, r2.eff, r2.hit, r2.rider].every((d) => d.mark === 0) && !r2.attrs && r2.ids > 0 && !r2.mErr && !r2.eErr && !r2.hErr && !r2.rErr, r2);
  }
  {
    const r = await p.evaluate((X) => { window.__xss = 0; const now = Date.now(); const d = __base();
      d.npcs[0].name = 'Gob' + X; d.npcs[1].note = X; d.turnAt.name = X; d.log = [{ t: now, x: X }]; d.effects[0].name = X; d.effects.push({ id: 'e2', name: X, cond: '', src: '', tgt: 'n:n1', left: 2, at: 'start', conc: false, save: { ab: 'wis', dc: 13, when: 'end' }, t: now });
      d.rem = [{ id: 'r1', eff: 'e2', tgt: 'n:n1', ab: 'wis', dc: 13, name: X }]; d.reqs = [{ id: 'q1', by: X, ab: 'dex', dc: 14, amount: 9, dtype: X, half: true, to: ['ich', 'u2'], t: now, fx: X, conds: ['prone'] }];
      d.saveRes = [{ id: 'q1', uid: 'u2', total: 12, ok: false, t: now }]; d.hits = [{ to: 'u2', by: X, amount: 4, dtype: X, crit: false, atk: 15, nat: 12, rider: { kind: 'save', ab: 'KON', dc: 12, conds: ['poisoned'], txt: X, fx: X, charge: false }, t: now }];
      __C(d); const pl = __players(); pl.u2.char = X; pl.u2.pl = X; pl.u2.clsName = X; pl.u2.species = X; pl.u2.cond = [X]; pl.u2.rolls = [{ label: X, detail: X, total: X, t: now + 1 }]; pl.u2.ans = [{ id: 'a1', t: now, x: X }]; __P(pl);
      __M({ dm: 'ich', mercy: {}, handouts: [{ id: 'h1', title: X, text: X, t: now }], gifts: [{ id: 'g1', to: 'all', from: 'u3', xp: 0, gm: 0, item: '', text: X, t: now }], kb: [{ id: 'k1', typ: 'p', n: X, d: X, st: X }], rules: { strict: false }, rulesAt: now });
      const res = { acc: !!(S.combat && S.combat.npcs[0].name.includes('img')) }; S.sreqOpen = true;
      for (const v of ['camp', 'sheet', 'heroes']) { __paint(v); res[v] = __dom(); }
      try { npcModal('n1'); } catch (e) { res.mErr = e.message; } res.modal = __dom(); S.modal = null; $('#modal').hidden = true;
      try { effForm('e2'); } catch (e) { res.eErr = e.message; } res.eff = __dom(); S.modal = null; $('#modal').hidden = true;
      return res; }, X);
    await p.waitForTimeout(400);
    const late = await p.evaluate(() => __dom());
    T('GK01-T03 Security-Fixture mit Eventhandlern über alle Eingänge: kein Element, kein Skript, kein Dialog', r.acc && ['camp', 'sheet', 'heroes', 'modal', 'eff'].every((k) => r[k].mark === 0 && r[k].run === 0) && late.mark === 0 && late.run === 0 && !r.mErr && !r.eErr, { r, late });
    T('GK01-T03 keine unerwarteten Netzanfragen (ausser den Schriften der Artefakt-Fassung)', extReq().length === 0, extReq().slice(0, 5));
  }
  {
    const NAME = 'Grünzahn «der Ältere» <Häuptling> "Öl" & Söhne';
    const r = await p.evaluate((NAME) => { __P(__players()); __M(__DM()); const d = __base(); d.npcs[0].name = NAME; d.effects[0].name = 'Bärenstärke <Probe>'; __C(d); __paint(); const on = [...document.querySelectorAll('.order .on')].map((e) => e.textContent); try { npcModal('n1'); } catch (e) {} const dlg = ($('#modal h3') || {}).textContent; const val = ($('#npcN') || {}).value; S.modal = null; $('#modal').hidden = true; return { on, dlg, val, eff: [...document.querySelectorAll('.effb')].map((e) => e.textContent) }; }, NAME);
    T('GK01-T04 Namen mit Umlauten, Anführungszeichen und spitzen Klammern lesbar als Text', r.on.some((t) => t.includes(NAME)) && r.dlg === NAME && r.val === NAME && r.eff.some((t) => t.includes('Bärenstärke <Probe>')), r);
  }
  {
    const r = await p.evaluate(() => { __C(__base()); __P(__players()); __M(__DM()); __paint();
      const dm = { iv: [...document.querySelectorAll('.order .iv')].map((e) => e.textContent), names: [...document.querySelectorAll('.order .on')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()), hp: [...document.querySelectorAll('.order .nhp')].map((e) => e.textContent), ctl: document.querySelectorAll('.order .nctl').length, now: (document.querySelector('.order li.now .on') || {}).textContent };
      __M({ dm: 'u2', mercy: {} }); __paint();
      const pl = { npcHp: document.querySelectorAll('.order li.npc .nhp').length, st: [...document.querySelectorAll('.order li.npc .nst')].map((e) => e.textContent), ctl: document.querySelectorAll('.order .nctl').length, rows: document.querySelectorAll('.order li').length };
      __M(__DM()); __paint(); return { dm, pl }; });
    T('GK01-T05 SL: Initiative unverändert sortiert, TP/RK sichtbar', r.dm.iv.join(',') === '18,15,12,-2' && r.dm.hp.includes('TP 7/10 · RK 15') && r.dm.hp.includes('TP 0/11 · RK 16') && r.dm.ctl === 2 && /Goblin 1/.test(r.dm.now || ''), r.dm);
    T('GK01-T05 Spieler: Gegner nur mit Zustand, ohne TP/RK', r.pl.ctl === 0 && r.pl.npcHp === 0 && r.pl.st.join('|') === 'leicht verletzt|besiegt' && r.pl.rows === 3, r.pl);
  }
  {
    const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const r = await p.evaluate((PNG) => { const pl = __players(); pl.u2.portrait = 'img'; pl.u2.pimg = PNG; pl.u3 = Object.assign({}, pl.u2, { char: 'Cora', portrait: 'img', pimg: 'javascript:alert(1)', init: { v: 3, cid: 'k1' } }); pl.u4 = Object.assign({}, pl.u2, { char: 'Dax', portrait: 'img', pimg: 'data:image/png;base64,AAA") ; background:url(x', init: { v: 2, cid: 'k1' } }); __P(pl); __paint();
      const art = [...document.querySelectorAll('.order .sigil.art')].map((e) => e.getAttribute('style') || ''); return { n: art.length, ok: art.some((s) => s.includes('iVBORw0')), bad: art.some((s) => /javascript|url\(x/.test(s)), tab: [S.table.u3.pimg, S.table.u4.pimg] }; }, PNG);
    T('GK01-T06 Gültiges Porträt erscheint, ungültige Bildadressen werden verworfen', r.ok && !r.bad && r.tab[0] === '' && r.tab[1] === '', r);
    await p.evaluate(() => { __P(__players()); __paint(); });
  }

  /* ---------------- GK-07 ---------------- */
  {
    const r = await p.evaluate(() => { __C(__base()); nvWarned.Kampfstand = 0; const before = __J(S.combat); const w0 = __writes.length; const t0 = document.querySelectorAll('#mini .mt').length; const d = __base(); d.npcs = {}; __C(d); __paint(); return { same: __J(S.combat) === before, n: S.combat.npcs.length, writes: __writes.length - w0, toast: document.querySelectorAll('#mini .mt').length - t0, rows: document.querySelectorAll('.order li').length }; });
    T('GK07-T01 npcs:{} bei gültigem Vorzustand: kein Absturz, letzter Stand bleibt, Hinweis, kein Speichern', r.same && r.n === 2 && r.writes === 0 && r.toast === 1 && r.rows === 4, r);
  }
  {
    const r = await p.evaluate(() => { const d = __base(); for (const k of ['effects', 'rem', 'log', 'hits', 'reqs', 'saveRes', 'turnAt', 'rev', 'w']) delete d[k]; d.npcs.forEach((x) => { delete x.cond; delete x.grp; }); __C(d); __paint(); return { acc: !!S.combat && !('effects' in S.combat) && S.combat.npcs.length === 2, rows: document.querySelectorAll('.order li').length, err: null }; });
    T('GK07-T02 Fehlende optionale Listen: Dokument gilt, Anzeige mit Standardwerten', r.acc && r.rows === 4, r);
    const r2 = await p.evaluate(() => { __C(__base()); const before = __J(S.combat); const bad = {};
      for (const [k, v] of [['effects', null], ['rem', null], ['log', null], ['hits', 'x'], ['reqs', {}], ['saveRes', 5], ['npcs', null], ['surp', {}], ['turnAt', []], ['active', 'ja'], ['turn', 5]]) { const d = __base(); d[k] = v; __C(d); bad[k] = __J(S.combat) === before; }
      return bad; });
    T('GK07-T02 Vorhandene falsche Typen/null nach Schema abgewiesen', Object.values(r2).every(Boolean), r2);
  }
  {
    const r = await p.evaluate(() => { __C(__base()); const before = __J(S.combat); const res = {};
      const cases = { dupId: (d) => { d.npcs[1].id = 'n1'; }, emptyId: (d) => { d.npcs[0].id = ''; }, protoId: (d) => { d.npcs[0].id = '__proto__'; }, ctorId: (d) => { d.npcs[0].id = 'constructor'; }, longId: (d) => { d.npcs[0].id = 'x'.repeat(41); },
        roundNeg: (d) => { d.round = -1; }, roundFrac: (d) => { d.round = 1.5; }, roundStr: (d) => { d.round = '2'; }, roundBool: (d) => { d.round = true; }, roundNaN: (d) => { d.round = NaN; }, roundInf: (d) => { d.round = Infinity; },
        initStr: (d) => { d.npcs[0].v = '15'; }, initObj: (d) => { d.npcs[0].v = {}; }, initHuge: (d) => { d.npcs[0].v = 1e9; }, revNeg: (d) => { d.rev = -1; }, revStr: (d) => { d.rev = '4'; }, turnBad: (d) => { d.turn = 'x:n1'; },
        midProto: (d) => { d.npcs[0].mid = 'constructor'; }, condObj: (d) => { d.npcs[0].cond = { a: 1 }; }, effDup: (d) => { d.effects.push(Object.assign({}, d.effects[0])); } };
      for (const [k, f] of Object.entries(cases)) { const d = __base(); f(d); __C(d); res[k] = __J(S.combat) === before; }
      /* gefährliche Schlüssel im Wurzelobjekt und verschachtelt (wie sie aus JSON.parse kommen) */
      const j = (o) => JSON.parse(o);
      for (const [k, s] of [['rootProto', '{"__proto__":{"gkPolluted":1},"id":"k1","active":true}'], ['npcProto', '{"id":"k1","active":true,"npcs":[{"id":"n1","name":"A","__proto__":{"gkPolluted":1}}]}'], ['ctorKey', '{"id":"k1","active":true,"constructor":{"prototype":{"gkPolluted":1}}}'], ['rechProto', '{"id":"k1","active":true,"npcs":[{"id":"n1","name":"A","rech":{"__proto__":{"used":true}}}]}']]) { __C(j(s)); res[k] = __J(S.combat) === before; }
      res.noPollution = ({}).gkPolluted === undefined && Object.prototype.gkPolluted === undefined;
      return res; });
    T('GK07-T03 Ungültige/doppelte IDs, Runde, Initiative, Revision, gefährliche Schlüssel: keine Übernahme, keine Prototyp-Veränderung', Object.values(r).every(Boolean), r);
    const r2 = await p.evaluate(() => { const d = __base(); d.npcs[0].v = -5; d.npcs[0].hp = 0; d.npcs[1].hp = null; d.npcs[1].hpMax = null; d.round = 1; __C(d); return { v: S.combat.npcs[0].v, hp: S.combat.npcs[0].hp, nul: S.combat.npcs[1].hp }; });
    T('GK07-T03 Negative Initiative, 0 TP und null (NaN aus Eingabefeld) bleiben gültig', r2.v === -5 && r2.hp === 0 && r2.nul === null, r2);
  }
  {
    const r = await p.evaluate(() => { __C(__base()); __M(__DM()); const ch = cur(); ch.play.dead = true; ch.play.deadAt = 111; commit(false);
      const snap = () => __J({ c: S.combat, m: S.meta, p: cur().play, w: __writes.length });
      const before = snap(); const res = {}; const now = Date.now();
      const cc = { effSave: (d) => { d.effects[0].save = { ab: 'xyz', dc: 3, when: 'end' }; }, effLeft: (d) => { d.effects[0].left = 'drei'; }, effAt: (d) => { d.effects[0].at = 'mitte'; }, reqTo: (d) => { d.reqs = [{ id: 'q', ab: 'dex', dc: 10, to: 'ich', t: now }]; }, reqAb: (d) => { d.reqs = [{ id: 'q', ab: 'toString', dc: 10, to: ['ich'], t: now }]; },
        remAb: (d) => { d.rem = [{ id: 'r', eff: 'e1', tgt: 'p:ich', ab: 'constructor', dc: 1 }]; }, logT: (d) => { d.log = [{ t: 'x', x: 5 }]; }, logArr: (d) => { d.log = [['x']]; }, saveRes: (d) => { d.saveRes = [{ id: 1 }]; }, hitAmt: (d) => { d.hits = [{ to: 'ich', by: 'x', amount: '5', t: now }]; },
        hitRider: (d) => { d.hits = [{ to: 'ich', by: 'x', amount: 5, t: now, rider: { kind: 'save', ab: 'toString', dc: 1 } }]; }, inv: (d) => { d.inv = 'alle'; }, rechVal: (d) => { d.npcs[0].rech = { Odem: 'ja' }; } };
      for (const [k, f] of Object.entries(cc)) { const d = __base(); f(d); __C(d); __paint(); res[k] = snap() === before; }
      const mc = { mercyStr: { dm: 'ich', mercy: { ich: 'death' } }, mercyNum: { dm: 'ich', mercy: { ich: { d: 'mercy', deadAt: 'x' } } }, mercyD: { dm: 'ich', mercy: { ich: { d: 'gnade', deadAt: 111 } } }, mercyArr: { dm: 'ich', mercy: [] }, mercyProto: JSON.parse('{"dm":"ich","mercy":{"__proto__":{"d":"mercy","deadAt":111}}}'),
        giftItem: { dm: 'ich', gifts: [{ id: 'g', to: 'all', item: 'constructor', t: now }] }, giftXp: { dm: 'ich', gifts: [{ id: 'g', to: 'all', xp: '100', t: now }] }, rest: { dm: 'ich', rest: { id: 'r', kind: 'ewig' } }, ho: { dm: 'ich', handouts: 'x' }, kb: { dm: 'ich', kb: [{ id: 'k', typ: 'constructor' }] }, rules: { dm: 'ich', rules: { strict: 'ja' } }, dm: { dm: {} }, ans: { dm: 'ich', ansSeen: [{}] }, root: [1, 2], rootNull: null, rootStr: 'x' };
      for (const [k, m] of Object.entries(mc)) { __M(m); __paint(); res[k] = snap() === before; }
      const pc = { rootArr: [1], rootNull: null };
      for (const [k, m] of Object.entries(pc)) { __C(m); res['combat_' + k] = snap() === before; }
      ch.play.dead = false; ch.play.deadAt = 0; commit(false); return res; });
    T('GK07-T04 Fehlerhafte effects/reqs/rem/log/saveRes/hits/mercy/Gaben/Rast/Handouts/Regeln: kein Absturz, keine Nebenwirkung', Object.values(r).every(Boolean), r);
    const r2 = await p.evaluate(() => { const res = {}; const pl = __players(); pl.u2.ans = { id: 'a' }; pl.u2.init = 'x'; pl.u2.hp = '<b>'; pl.u2.extra = { tief: 1 }; pl.u2.cond = 'x'; pl.__proto__ = 1; __P(pl);
      const u = S.table.u2 || {}; res.kept = !!S.table.u2 && u.char === 'Bryn'; res.dropped = !('ans' in u) && !('init' in u) && !('hp' in u) && !('extra' in u) && !('cond' in u); res.noProtoKey = Object.keys(S.table).every((k) => /^[a-z0-9]+$/.test(k));
      __paint(); try { if (typeof chrWatch === 'function') chrWatch(); } catch (e) { res.err = e.message; }
      __P(__players()); return res; });
    T('GK07-T04 Spielerdokument: unlesbare Felder fallen einzeln weg, Unbekanntes wird nicht übernommen', r2.kept && r2.dropped && r2.noProtoKey && !r2.err, r2);
  }
  {
    /* Gültige Dokumente aus den echten Erzeugern: jeder geschriebene Kampf- und Rundenstand muss unverändert gelten */
    const r = await p.evaluate(async () => {
      const sleep = (ms) => new Promise((res) => setTimeout(res, ms)); const log = []; const step = async (n, f) => { try { await f(); } catch (e) { log.push(n + ': ' + e.message); } await sleep(60); };
      __writes.length = 0; S.combat = null; S.combatRemote = null; S.combatPend = null; __M(__DM()); __P(__players()); const ch = cur(); ch.play.dead = false;
      const echo = () => { const w = __writes.filter((x) => /state\/combat$/.test(x.p)).pop(); if (w) __C(w.v); };
      await step('fightStart', () => { __act('fightStart'); echo(); });
      await step('encInsert', () => { encInsert([{ mid: 'goblin', n: 2 }], 'Hinterhalt', { groupInit: true }); echo(); encInsert([{ mid: 'bandit', n: 1 }], 'Reserve', { reserve: true }); echo(); });
      const lr = Object.keys(BESTIARY).find((k) => { const F = typeof mobFeats === 'function' && mobFeats(k); return F && F.rech.length && F.la; });
      await step('encInsert-legendär', () => { if (lr) encInsert([{ mid: lr, n: 1 }], 'Boss', {}); echo(); });
      await step('srchMob', () => { XA.srchMob(null, 'bandit-captain'); echo(); });
      await step('initiative', () => { setMyInit(13); });
      await step('surpTog', () => { __act('surpTog', 'u2'); echo(); });
      await step('fightGo', () => { __act('fightGo'); echo(); });
      await step('effAdd', () => { effForm(); const set = (id, v) => { const e = $('#' + id); if (e) e.value = v; }; set('effName', 'Gift <stark>'); const o = order(); set('effTgt', o.find((x) => x.npc).key); set('effLeft', '3'); set('effAb', 'con'); set('effDc', '13'); set('effWhen', 'end'); XA.effAdd(); echo(); });
      await step('effAddFromSpell', () => { const s = Object.values(SPELLS).find((x) => x.conc && typeof durRounds === 'function' && durRounds(x.dur) && durRounds(x.dur) <= 100); if (s) effAddFromSpell(ch, s); echo(); });
      for (let i = 0; i < 6; i++) await step('nextTurn' + i, () => { nextTurn(); echo(); });
      await step('legendär verbrauchen', () => { const n = (S.combat.npcs || []).find((x) => x.mid === lr); if (n) { const F = mobFeats(lr); updNpc(n.id, (x) => { x.laU = 1; x.rech = { [F.rech[0].name]: { used: true } }; return x; }); echo(); } });
      for (let i = 0; i < 8; i++) await step('nextTurn-b' + i, () => { nextTurn(); echo(); });
      await step('npcHit', () => { const n = S.combat.npcs.find((x) => !x.reserve && x.mid); const M = BESTIARY[n.mid]; const atk = M[7][0]; const rider = typeof mobRider === 'function' ? mobRider(lr, (BESTIARY[lr][7][0] || [])[0]) : null; S.npcA = { name: n.name, tgt: 'p:u2', dmg: atk[2], dtype: atk[3], nat: 15, total: 18, rider: rider || { kind: 'save', ab: 'KON', dc: 12, conds: ['poisoned'], txt: 'Gift', fx: 'vergiftet', charge: false }, riderOn: true }; XA.npcHit(); echo(); });
      await step('srSend', () => { S.view = 'camp'; S.sreqOpen = true; render(); paintCamp(); $('#srBy').value = 'Feuerodem'; $('#srAb').value = 'dex'; $('#srDc').value = '14'; $('#srDmg').value = '4W6'; $('#srTy').value = 'Feuer'; S.srTo = ['ich', 'u2']; XA.srSend(); echo(); });
      await sleep(200);
      await step('reqRoll', () => { const q = (S.combat.reqs || []).slice(-1)[0]; orbPrompt(''); S.reqPend = null; XA.reqRoll(null, q.id); echo(); });
      await step('npcAdd', () => { for (const [id, v] of [['npcName', 'Wirt'], ['npcBonus', '1']]) { let e = $('#' + id); if (!e) { e = document.createElement('input'); e.id = id; document.body.appendChild(e); } e.value = v; } __act('npcAdd'); echo(); });
      await step('npcSave-leer', () => { const n = S.combat.npcs.find((x) => x.name === 'Wirt'); npcModal(n.id); $('#npcHpV').value = ''; $('#npcHpM').value = ''; $('#npcNote').value = 'Notiz «Ä»'; XA.npcSave(null, n.id); echo(); });
      await step('npcJoin', () => { const r0 = S.combat.npcs.find((x) => x.reserve); if (r0 && XA.npcJoin) XA.npcJoin({ dataset: {} }, r0.id); echo(); });
      await step('fightReset', () => { __act('fightReset'); echo(); });
      /* Rundenstand */
      await step('dmTake', () => { __act('dmTake'); });
      await step('hoAdd', () => { S.view = 'camp'; render(); paintCamp(); $('#hoT').value = 'Brief'; $('#hoX').value = 'Zeile 1\nZeile 2'; XA.hoAdd(); });
      await step('gift', () => { const it = Object.keys(MAGIC_ITEMS)[0]; $('#gTo').value = 'all'; $('#gXp').value = '100'; $('#gGm').value = '5'; const sel = $('#gItem'); if (sel) sel.value = it; $('#gText').value = 'Seil'; XA.gift(); });
      await step('trPropose', () => { XA.trPropose(); });
      await step('theme', () => { XA.theme(null, Object.keys(THEMES)[1]); });
      await step('dmPlays', () => { saveMeta({ dmPlays: true }); });
      await step('mercy', () => { const pl = __players(); pl.u2.dead = true; pl.u2.deadAt = 222; __P(pl); decide('u2', 'mercy'); });
      await step('fightEnd', () => { __act('fightEnd'); echo(); });
      await step('grpRest', () => { XA.grpRest(null, 'long'); }); /* Rast erst nach dem Kampf (Regel «keine Rast im Kampf») */
      const docs = __writes.filter((x) => /state\/(combat|meta)$/.test(x.p) && !x.del);
      const bad = []; for (const w of docs) { const chk = /combat$/.test(w.p) ? validateCombatDoc(true, w.v) : validateMetaDoc(true, w.v); if (!chk.ok || __J(chk.doc) !== __J(w.v)) bad.push({ p: w.p, err: chk.err, keys: Object.keys(w.v) }); }
      const kinds = { npcs: docs.some((w) => (w.v.npcs || []).length >= 3), grp: docs.some((w) => (w.v.npcs || []).some((x) => x.grp)), reserve: docs.some((w) => (w.v.npcs || []).some((x) => x.reserve)), rech: docs.some((w) => (w.v.npcs || []).some((x) => x.rech)), effects: docs.some((w) => (w.v.effects || []).length), rem: docs.some((w) => (w.v.rem || []).length), hits: docs.some((w) => (w.v.hits || []).some((h) => h.rider)), reqs: docs.some((w) => (w.v.reqs || []).length), saveRes: docs.some((w) => (w.v.saveRes || []).length), surp: docs.some((w) => (w.v.surp || []).length), turnAt: docs.some((w) => w.v.turnAt), nullHp: docs.some((w) => (w.v.npcs || []).some((x) => x.hp === null || x.hpMax === null)), end: docs.some((w) => w.v.active === false && w.v.id === ''),
        handouts: docs.some((w) => (w.v.handouts || []).length), gifts: docs.some((w) => (w.v.gifts || []).length), rest: docs.some((w) => w.v.rest), rules: docs.some((w) => w.v.rules), theme: docs.some((w) => w.v.theme), mercy: docs.some((w) => w.v.mercy && w.v.mercy.u2) };
      return { n: docs.length, bad, kinds, log, last: S.combat && S.combat.active };
    });
    T('GK07-T05 Alle Erzeuger durchlaufen (' + r.n + ' Dokumente), jede Art von Feld kommt vor', r.log.length === 0 && Object.values(r.kinds).every(Boolean), { log: r.log, kinds: r.kinds });
    T('GK07-T05 Jedes erzeugte Kampf-/Rundendokument gilt und bleibt unverändert', r.n > 20 && r.bad.length === 0, r.bad.slice(0, 4));
    const r2 = await p.evaluate(() => { const now = Date.now(); const old = { id: 'k9', active: true, round: 1, turn: null, t: now, npcs: [{ id: 'a1', name: 'Alt', init: 3, v: 4 }, { id: 'a2', name: 'Ohne Werte', v: 1, dex: 0 }, { id: 'a3', mid: 'u-eigen12', name: 'Eigenes Monster', v: 7, dex: 1, hp: 9, hpMax: 9, ac: 12, ally: true }] };
      const chk = validateCombatDoc(true, old); __C(old); __paint(); return { ok: chk.ok, same: chk.ok && __J(chk.doc) === __J(old), rows: document.querySelectorAll('.order li').length, kept: S.combat && S.combat.npcs[0].init === 3 }; });
    T('GK07-T05 Alte kompatible Kampfstände (ohne Listen, mit Altfeld init, eigenes Monster anderswo) vollständig erhalten', r2.ok && r2.same && r2.kept && r2.rows >= 3, r2);
    const r3 = await p.evaluate(() => { const long = { id: 'k9', active: true, npcs: [{ id: 'a1', name: 'N'.repeat(500), note: 'x'.repeat(9000), v: 1 }], log: [{ t: 1, x: 'y'.repeat(3000) }] }; const chk = validateCombatDoc(true, long); return { ok: chk.ok, n: chk.ok && chk.doc.npcs[0].name.length, note: chk.ok && chk.doc.npcs[0].note.length, x: chk.ok && chk.doc.log[0].x.length, many: validateCombatDoc(true, { id: 'k', npcs: Array.from({ length: 301 }, (_, i) => ({ id: 'n' + i, name: 'N' })) }).ok, max: validateCombatDoc(true, { id: 'k', npcs: Array.from({ length: 300 }, (_, i) => ({ id: 'n' + i, name: 'N' })) }).ok }; });
    T('GK07 Grenzen: Freitext gekürzt (200/4000/1000), 300 Gegner gültig, 301 abgewiesen', r3.ok && r3.n === 200 && r3.note === 4000 && r3.x === 1000 && r3.max && !r3.many, r3);
  }
  {
    const r = await p.evaluate(async () => { const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
      __M(__DM()); __C(__base()); S.combatPend = null; await sleep(20);
      const c = S.combat; saveCombat(Object.assign({}, c, { npcs: c.npcs.map((x) => (x.id === 'n1' ? Object.assign({}, x, { hp: 3 }) : x)), t: Date.now() }));
      const ours = __J(S.combat); const w0 = __writes.length; const t0 = document.querySelectorAll('#mini .mt').length; nvWarned.Kampfstand = 0;
      for (let i = 0; i < 5; i++) { const d = __base(); d.rev = 3; d.w = 'u2'; d.npcs = {}; __C(d); }
      const mid = { same: __J(S.combat) === ours, pend: !!S.combatPend, writes: __writes.length - w0, toasts: document.querySelectorAll('#mini .mt').length - t0 };
      const d = __base(); d.rev = 3; d.w = 'u2'; d.effects.push({ id: 'e7', name: 'Fremd', cond: '', src: 'p:u2', tgt: 'n:n2', left: 2, at: 'start', conc: false, save: null, t: Date.now() }); __C(d);
      const w = __writes.slice(w0).filter((x) => /combat$/.test(x.p)); const m = w.length ? w[w.length - 1].v : null;
      return { mid, merged: w.length, hp: m && m.npcs.find((x) => x.id === 'n1').hp, eff: m && m.effects.some((e) => e.id === 'e7') }; });
    T('GK07-T07 Ungültiger Eingang während ausstehender Zusammenführung: kein Überschreiben, keine Schleife, ein Hinweis', r.mid.same && r.mid.pend && r.mid.writes === 0 && r.mid.toasts === 1, r.mid);
    T('GK07-T07 Danach gültiger fremder Stand: normale Zusammenführung (beide Änderungen erhalten)', r.merged === 1 && r.hp === 3 && r.eff, r);
  }
  {
    const r = await p.evaluate(async () => { __C(__base()); const oldC = __subs['camp/raum/state/combat'], oldM = __subs['camp/raum/state/meta'], oldP = __subs['camp/raum/players'];
      joinCamp('raum2', true); const after = { combat: S.combat, dm: S.meta.dm, table: Object.keys(S.table).length };
      const d = __base(); d.round = 9; oldC({ exists: true, data: () => d }); oldM({ exists: true, data: () => ({ dm: 'boese', mercy: {} }) }); oldP({ docs: [{ id: 'alt', data: () => ({ char: 'Alt' }) }] });
      __paint(); const res = { after, combat: S.combat, dm: S.meta.dm, alt: !!S.table.alt, fight: !!document.querySelector('.order li') };
      leaveCamp(); joinCamp('raum', true); __P(__players()); __M(__DM()); __C(__base()); return res; });
    T('GK07-T08 Raumwechsel: kein alter Kampf sichtbar, verspätete Aufrufe aus dem alten Raum werden ignoriert', r.after.combat === null && r.after.dm === null && r.combat === null && r.dm === null && !r.alt && !r.fight, r);
  }
  {
    /* Fuzzing: zufällige Typmutationen (fester Startwert) über Kampf-, Runden- und Spielerdokumente, alle Ansichten */
    const r = await p.evaluate(() => {
      let seed = 20261126; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; const pick = (a) => a[Math.floor(rnd() * a.length)];
      const vals = () => [null, {}, [], '', 'x<b class="gk09">', -1, 0, 1e20, 3.5, true, '__proto__', 'constructor', [{}], [null], { a: [1] }, 'n:n1', 'p:ich', 'toString'];
      const paths = (o, pre, out) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) { out.push(pre.concat([k])); paths(o[k], pre.concat([k]), out); } return out; };
      const mutate = (doc) => { const d = JSON.parse(JSON.stringify(doc)); const ps = paths(d, [], []); const n = 1 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) { const pth = pick(ps); let o = d; for (let j = 0; j < pth.length - 1; j++) { o = o && o[pth[j]]; } if (!o || typeof o !== 'object') continue; const k = pth[pth.length - 1]; const m = rnd(); if (m < 0.15) delete o[k]; else if (m < 0.25) o['gk' + Math.floor(rnd() * 9)] = pick(vals()); else o[k] = pick(vals()); } return d; };
      const errs = []; let acc = 0, rej = 0, marks = 0; const bm = { dm: 'ich', mercy: { u2: { d: 'mercy', deadAt: 5, t: 6 } }, handouts: [{ id: 'h1', title: 'T', text: 'X', t: 1 }], gifts: [{ id: 'g1', to: 'all', from: 'u2', xp: 1, gm: 1, item: '', text: 'Seil', t: 1 }], rest: { id: 'r1', kind: 'short', t: 1 }, kb: [{ id: 'k1', typ: 'a', n: 'Auftrag', d: '', st: 'offen' }], rules: { strict: true }, rulesAt: 1, theme: 'warm', ansSeen: ['a1'] };
      const base = __base(); base.reqs = [{ id: 'q1', by: 'Odem', ab: 'dex', dc: 14, amount: 9, dtype: 'Feuer', half: true, to: ['ich'], t: 1 }]; base.hits = [{ to: 'u2', by: 'Ork', amount: 4, dtype: 'Hieb', crit: false, atk: 15, nat: 12, rider: { kind: 'save', ab: 'KON', dc: 12, conds: ['poisoned'], txt: 'T', fx: 'F', charge: false }, t: 1 }]; base.rem = [{ id: 'r1', eff: 'e1', tgt: 'p:ich', ab: 'wis', dc: 12, name: 'R' }]; base.npcs[0].rech = { Odem: { used: true, roll: 3 } };
      for (let i = 0; i < 260; i++) {
        const kind = i % 3; const views = ['camp', 'sheet', 'heroes'];
        try {
          if (kind === 0) { const d = mutate(base); const before = __J(S.combat); __C(d); if (__J(S.combat) === before) rej++; else acc++; }
          else if (kind === 1) { const d = mutate(bm); __M(d); }
          else { const pl = __players(); pl.u2 = mutate(pl.u2); __P(pl); }
          if (i % 2) __M({ dm: 'u2', mercy: {} }); else __M(__DM());
          __paint(pick(views)); S.view = 'camp'; render(); paintCamp(); const n0 = (S.combat && S.combat.npcs || [])[0]; if (n0 && i % 5 === 0) { npcModal(n0.id); S.modal = null; $('#modal').hidden = true; }
          if (i % 7 === 0) { hitCheck(); orbPrompt(''); S.hitPend = null; S.reqPend = null; }
        } catch (e) { errs.push(i + ': ' + e.message); }
        marks += __dom().mark; __C(__base()); __P(__players());
      }
      return { acc, rej, errs: errs.slice(0, 5), nerr: errs.length, marks, polluted: Object.prototype.gk0 !== undefined };
    });
    await p.waitForTimeout(300);
    T('GK07-T09 Fuzzing 260 Dokumente: kein Absturz, kein eingeschleustes Element, kein Prototyp-Eingriff (' + r.acc + ' gültig, ' + r.rej + ' abgewiesen)', r.nerr === 0 && r.marks === 0 && !r.polluted && r.rej > 20, r);
  }
  T('Keine JavaScript-Fehler und keine Dialoge (Teil 1)', errs.length === 0, errs.slice(0, 5));
  await b.close();

}

/* ---------------- Teil 2: zwei echte Geräte und ein Raummitglied mit Schaddaten über den lokalen Broker ---------------- */
async function teil2() {
  const ROOT = path.resolve(__dirname, '..', 'app', 'www');
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) { T('GK07-T06 App-Version vorhanden (python3 build_app.py)', false, ROOT); }
  else {
    const { Aedes } = require('aedes'); const http = require('http'); const wsStream = require('websocket-stream');
    const aedes = await Aedes.createBroker();
    const bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, aedes.handle); await new Promise((r) => bsrv.listen(8896, r));
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
    const web = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
    await new Promise((r) => web.listen(8897, r));
    const b2 = await chromium.launch(); const e2 = [];
    const mk = async (name) => { const c = await b2.newContext(); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8896'); localStorage.setItem('hb_dice_fx', 'aus'); }); const pg = await c.newPage(); pg.on('pageerror', (e) => e2.push(name + ': ' + e.message)); pg.on('dialog', (d) => { e2.push(name + ' Dialog'); d.dismiss(); }); await pg.goto('http://localhost:8897/'); await pg.waitForTimeout(700); await pg.evaluate(() => { window.__act = (act, arg) => { const b = document.createElement('button'); b.dataset.act = act; if (arg != null) b.dataset.arg = arg; document.body.appendChild(b); b.click(); b.remove(); }; }); return pg; };
    const A = await mk('SL'), B = await mk('Spieler'), M = await mk('Schaddaten');
    const code = 'gk07-' + Math.random().toString(36).slice(2, 10);
    const wait = (ms) => A.waitForTimeout(ms);
    await A.evaluate((c) => { cur().name = 'Aldric'; commit(false); joinCamp(c); setTimeout(() => saveMeta({ dm: UID }), 800); }, code);
    await B.evaluate((c) => { cur().name = 'Bryn'; commit(false); joinCamp(c); }, code);
    await wait(3200);
    await A.evaluate(() => { __act('fightStart'); }); await wait(1200);
    await A.evaluate(() => { encInsert([{ mid: 'goblin', n: 2 }], 'Hinterhalt', {}); }); await wait(1200);
    await B.evaluate(() => { setMyInit(14); }); await A.evaluate(() => { setMyInit(9); }); await wait(1500);
    await A.evaluate(() => { __act('fightGo'); }); await wait(1500);
    const s1 = await B.evaluate(() => ({ turn: S.combat && S.combat.turn, n: order().length, npcs: (S.combat.npcs || []).length }));
    T('GK07-T06 Zwei Geräte: Kampf, Gegner und Initiative kommen beim Spieler an (SL spielt nicht mit)', s1.turn && s1.n === 3 && s1.npcs === 2, s1);
    /* gleichzeitige legitime Änderungen beider Seiten */
    await Promise.all([A.evaluate(() => { const c = S.combat; effSave({ effects: (c.effects || []).concat([{ id: effUid(), name: 'Von SL', cond: '', src: '', tgt: 'n:' + c.npcs[0].id, left: 2, at: 'start', conc: false, save: null, t: Date.now() }]) }); }),
      B.evaluate(() => { const c = S.combat; effSave({ effects: (c.effects || []).concat([{ id: effUid(), name: 'Vom Spieler', cond: '', src: 'p:' + UID, tgt: 'p:' + UID, left: 3, at: 'start', conc: false, save: null, t: Date.now() }]) }); })]);
    await wait(3500);
    const s2 = await Promise.all([A, B].map((pg) => pg.evaluate(() => (S.combat.effects || []).map((e) => e.name).sort().join('|'))));
    T('GK07-T06 Gleichzeitige Änderungen werden zusammengeführt (beide Effekte auf beiden Geräten)', s2[0] === 'Vom Spieler|Von SL' && s2[1] === s2[0], s2);
    /* Raummitglied sendet Schaddaten: ungültiges Schema und gültige Typen mit Markup */
    await M.evaluate((c) => { joinCamp(c); }, code); await wait(3000);
    const r0 = await Promise.all([A, B].map((pg) => pg.evaluate(() => { window.__gkBefore = JSON.stringify(S.combat); })));
    await M.evaluate((MARK) => { const c = JSON.parse(JSON.stringify(S.combat)); c.round = MARK; c.npcs = {}; c.rev = (c.rev || 0) + 5; c.w = UID; combatRef().set(c); }, MARK);
    await wait(2500);
    const s3 = await Promise.all([A, B].map((pg) => pg.evaluate(() => { S.view = 'camp'; render(); paintCamp(); paintTurn(); return { same: JSON.stringify(S.combat) === __gkBefore, mark: document.querySelectorAll('.gk01-marker').length }; })));
    T('GK01/GK07-T06 Ungültiger Kampfstand eines Raummitglieds: SL und Spieler behalten ihren Stand, kein Marker', s3.every((x) => x.same && x.mark === 0), s3);
    await M.evaluate((MARK) => { const c = JSON.parse(JSON.stringify(S.combat)); c.npcs[0].name = 'Ork' + MARK; c.rev = (c.rev || 0) + 6; c.w = UID; combatRef().set(c); }, MARK);
    await wait(2500);
    const s4 = await Promise.all([A, B].map((pg) => pg.evaluate(() => { S.view = 'camp'; render(); paintCamp(); return { mark: document.querySelectorAll('.gk01-marker').length, txt: [...document.querySelectorAll('.order .on')].some((e) => e.textContent.includes('gk01-marker')) }; })));
    T('GK01 Gültige Typen mit Markup aus dem Raum: nur als Text sichtbar', s4.every((x) => x.mark === 0 && x.txt), s4);
    await M.evaluate((MARK) => { metaRef().set({ dm: UID, mercy: { x: 'y' }, handouts: {} }); }, MARK); await wait(2000);
    const s5 = await Promise.all([A, B].map((pg) => pg.evaluate(() => S.meta.dm)));
    const dmA = await A.evaluate(() => UID);
    T('GK07-T06 Ungültiger Rundenstand: Spielleitung bleibt unverändert', s5.every((d) => d === dmA), s5);
    await M.evaluate(() => leaveCamp()); await wait(800);
    /* Verbindungsabbruch des Spielers, Zugwechsel in der Zwischenzeit, Wiederverbindung */
    await B.evaluate(() => { HBNET.ws && HBNET.ws.close(); }); await A.evaluate(() => nextTurn()); const tA = await A.evaluate(() => S.combat.turn + '|' + S.combat.rev);
    await wait(4500);
    const tB = await B.evaluate(() => S.combat.turn + '|' + S.combat.rev);
    T('GK07-T06 Nach Verbindungsabbruch: Spieler hat den neuen Zug', tA === tB, { tA, tB });
    await B.evaluate((c) => { leaveCamp(); joinCamp(c); }, code); await wait(4000);
    const tB2 = await B.evaluate(() => ({ t: S.combat && S.combat.turn + '|' + S.combat.rev, n: S.combat && S.combat.npcs.length }));
    T('GK07-T06 Neu beitreten: laufender Kampf kommt vollständig wieder an', tB2.t === tA && tB2.n === 2, { tB2, tA });
    await A.evaluate(() => { __act('fightEnd'); }); await wait(2500);
    const s6 = await B.evaluate(() => ({ active: !!(S.combat && S.combat.active), order: order().length }));
    T('GK07-T06 Kampf beenden: beim Spieler kein laufender Kampf mehr', !s6.active && s6.order === 0, s6);
    await A.evaluate(() => combatRef().delete()); await wait(2500);
    const s7 = await B.evaluate(() => S.combat);
    T('GK07-T06 Gelöschter Kampfstand gilt als gelöscht, nicht als Fehler', s7 === null, s7);
    T('Keine JavaScript-Fehler (Teil 2)', e2.length === 0, e2.slice(0, 5));
    await b2.close(); bsrv.close(); web.close(); aedes.close();
  }
}
