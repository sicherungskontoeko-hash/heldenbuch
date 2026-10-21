/* ==== Heldenbuch – Oberfläche ==== */
const S = { chars: {}, hb: {}, cur: null, view: 'heroes', step: 0, mode: 'normal', log: [], sf: { q: '', lvl: 'all', cls: 'all' }, hbEdit: null, confirm: null, open: {}, store: 'local', saving: '', camp: '', share: true, table: {}, campErr: '', combat: null, myInit: null, logOpen: false, logFilter: 'all', npcRoll: false, meta: { dm: null, mercy: {} }, mercyQ: [] };
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const cur = () => S.chars[S.cur];
const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function setP(o, p, v) { const ks = p.split('.'); let t = o; ks.slice(0, -1).forEach((k) => { if (t[k] == null || typeof t[k] !== 'object') t[k] = {}; t = t[k]; }); t[ks[ks.length - 1]] = v; }
const RESET_DE = { short: 'kurze Rast', long: 'lange Rast' };
const STEPS = ['Klasse', 'Herkunft', 'Attribute', 'Fertigkeiten & Talente', 'Zauber', 'Ausrüstung', 'Abschluss'];

/* ---------- Speicherung ---------- */
let DB = null, UID = null; const timers = {};
function lsGet() { try { const raw = localStorage.getItem('heldenbuch'); if (raw && typeof backupOnce === 'function' && /"v":\s*2/.test(raw) === false) backupOnce(raw); return JSON.parse(raw || 'null'); } catch (e) { return null; } }
function lsSet() {
  const data = JSON.stringify({ v: 2, chars: S.chars, hb: S.hb, cur: S.cur });
  try { localStorage.setItem('heldenbuch', data); if (localStorage.getItem('heldenbuch') !== data) throw new Error('verify'); if (S.saveErr) { S.saveErr = false; paintSave(); } }
  catch (e) { if (!S.saveErr) { S.saveErr = true; bannerToast('Speichern im Browser fehlgeschlagen', (e && /quota/i.test(e.name + e.message) ? 'Der Speicher ist voll. ' : '') + 'Sichere deine Helden jetzt über „Exportieren“.'); } paintSave(); }
}
function persist(kind, id) {
  lsSet();
  if (!DB) return;
  const key = kind + '_' + id; clearTimeout(timers[key]);
  S.saving = 'Speichert …'; paintSave();
  timers[key] = setTimeout(async () => {
    try {
      const obj = kind === 'c' ? S.chars[id] : S.hb[id];
      const ref = DB.collection('data/users/' + UID).doc(key);
      if (obj) await ref.set({ kind, json: JSON.stringify(obj) }); else await ref.delete();
      S.saving = 'Gespeichert'; } catch (e) { S.saving = 'Speichern fehlgeschlagen – lokal gesichert'; }
    paintSave();
  }, 700);
}
function paintSave() { const el = $('#saveState'); if (el && S.saveErr && S.store !== 'db') { el.textContent = '⚠ Nicht gespeichert – bitte exportieren'; return; } if (el) el.textContent = S.store === 'db' ? (S.saving || (isApp() ? 'Auf diesem Gerät gespeichert' : 'In deinem Konto gespeichert')) : 'Nur in diesem Browser gespeichert'; }
async function connectDb() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    DB = db; UID = id; S.store = 'db';
    const snap = await db.collection('data/users/' + id).get();
    if (snap.empty) { Object.keys(S.chars).forEach((k) => persist('c', k)); Object.keys(S.hb).forEach((k) => persist('h', k)); }
    else {
      const chars = {}, hb = {};
      snap.docs.forEach((d) => { const v = d.data(); try { const o = JSON.parse(v.json); if (v.kind === 'c') chars[o.id] = normChar(o); else if (v.kind === 'n') { try { if (o.camp && !localStorage.getItem('heldenbuch_dm_' + o.camp)) localStorage.setItem('heldenbuch_dm_' + o.camp, o.text || ''); } catch (x) {} } else hb[o.id] = o; } catch (e) {} });
      if (Object.keys(chars).length) { S.chars = chars; if (!S.chars[S.cur]) S.cur = Object.keys(chars)[0]; }
      S.hb = hb; lsSet();
    }
    if (S.camp) joinCamp(S.camp, true);
    if (isApp()) appAutoJoin();
    render();
  } catch (e) { DB = null; S.store = 'local'; paintSave(); }
}

function normChar(c) { if (c && typeof migrateChar === 'function') migrateChar(c); const d = newChar(); for (const k of Object.keys(d)) if (c[k] === undefined) c[k] = d[k]; c.play = Object.assign(d.play, (c.play && typeof c.play === 'object') ? c.play : {}); c.misc = Object.assign(d.misc, (c.misc && typeof c.misc === 'object') ? c.misc : {}); if (!Array.isArray(c.play.cond)) c.play.cond = []; if (!Array.isArray(c.play.ds)) c.play.ds = [0, 0]; return c; }
/* ---------- Beispiel ---------- */
function sampleChar() {
  return newChar({ name: 'Beispiel: Brann Eisenfaust', cls: 'pal', level: 3, sub: 'devotion', species: 'dwarf', bg: 'soldier', bgPlus: { str: 2, con: 1 },
    base: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 }, classSkills: ['ath', 'per'], styles: ['fs-defense'],
    armor: 'chainmail', shield: true, weapons: [{ w: 'longsword', mastery: true }, { w: 'javelin', mastery: true }],
    spells: ['bless', 'command', 'cure-wounds', 'heroism'], alignment: 'Rechtschaffen gut', languages: 'Gemeinsprache, Zwergisch',
    notes: 'Das ist ein Beispielcharakter. Unter „Helden“ kannst du deinen eigenen erschaffen.', gold: 14 });
}

/* ---------- Würfeln ---------- */
function parseKind(k) { const p = String(k || 'check').split(':'); return { type: p[0], ab: p[1] || null, skill: p[2] || null, prof: +(p[3] || 0) }; }
function rollState(kind) {
  const k = typeof kind === 'object' ? kind : parseKind(kind);
  const ch = cur(); const cond = (ch?.play?.cond || []).filter((x) => COND[x]);
  const adv = [], dis = []; let fail = null;
  for (const x of cond) {
    const e = COND[x].fx || {}; const n = COND[x].name;
    if (k.type === 'attack') { if (e.atk === 'dis') dis.push(n); if (e.atk === 'adv') adv.push(n); }
    if (k.type === 'check' || k.type === 'init') { if (e.check === 'dis') dis.push(n); }
    if (k.type === 'init') { if (e.init === 'dis' || e.incap) dis.push(n); if (e.init === 'adv') adv.push(n); }
    if (k.type === 'save') { if (e.autofail && (k.ab === 'str' || k.ab === 'dex')) fail = n; if (e.dexdis && k.ab === 'dex') dis.push(n); }
  }
  let c = null; try { c = ch && derive(ch, S.hb); } catch (x) {}
  if (c) {
    const L = c.level, P = ch.play;
    if (k.type === 'init' && c.initAdv) adv.push('Klassenmerkmal');
    if (k.type === 'init' && S.combat && S.combat.active && (S.combat.surp || []).includes(UID)) dis.push('Überrascht');
    if (k.type === 'check' && k.skill === 'ste' && c.armorStealthDis) dis.push('Rüstung');
    const ab = k.type === 'init' ? 'dex' : k.ab;
    if (c.armorNonProf && (ab === 'str' || ab === 'dex')) dis.push('Rüstung ohne Übung');
    if (c.lv('bar') && P.raging && !c.heavyArmor && ab === 'str' && (k.type === 'check' || k.type === 'save')) adv.push('Kampfrausch');
    if (c.lv('bar') >= 2 && k.type === 'save' && k.ab === 'dex') adv.push('Gefahrengespür');
    if (ch.species === 'gnome' && k.type === 'save' && ['int', 'wis', 'cha'].includes(k.ab)) adv.push('Gnomische Gerissenheit');
    if (c.lv('fig') >= 3 && c.subOf('fig') === 'champion' && k.type === 'check' && k.skill === 'ath') adv.push('Bemerkenswerter Athlet');
    if (k.type === 'save' && k.skill === 'conc' && c.lv('wlk') && (ch.invocations || []).includes('mind')) adv.push('Schauerlicher Geist');
    const fx = P.fx || {};
    if (k.type === 'attack' && fx.aim) adv.push('Ruhiges Zielen');
    if (k.type === 'attack' && fx.reckless && k.ab === 'str' && k.skill === 'melee') adv.push('Tollkühner Angriff');
    if (k.type === 'attack' && fx.innate && k.ab === 'spell') adv.push('Angeborene Zauberei');
  }
  if (typeof tgtMods === 'function') { const tm = tgtMods(k); adv.push(...tm.adv); dis.push(...tm.dis); }
  if (S.mode === 'adv') adv.unshift('gewählt'); if (S.mode === 'dis') dis.unshift('gewählt');
  const mode = adv.length && dis.length ? 'normal' : adv.length ? 'adv' : dis.length ? 'dis' : 'normal';
  return { mode, adv, dis, fail, k, c };
}
function d20(mod, label, opts = {}) {
  const ch = cur();
  if (ch?.play?.dead) { pushLog({ label, total: '✗', detail: 'Dein Held ist gefallen.' }); return null; }
  const st = rollState(opts.kind); const k = st.k, c = st.c;
  if (st.fail) { pushLog({ label, total: '✗', detail: 'Misslingt automatisch (' + st.fail + ')', fumble: true, share: true }); return null; }
  const ex = +(ch?.play?.exh || 0) * 2;
  let r1 = 1 + Math.floor(rnd() * 20), r2 = 1 + Math.floor(rnd() * 20);
  const notes = [];
  if (ch && ch.species === 'halfling') {
    const keepIdx = st.mode === 'adv' ? (r1 >= r2 ? 1 : 2) : st.mode === 'dis' ? (r1 <= r2 ? 1 : 2) : 1;
    if (keepIdx === 1 && r1 === 1) { r1 = 1 + Math.floor(rnd() * 20); notes.push('Glück: die 1 neu gewürfelt → ' + r1); }
    else if (keepIdx === 2 && r2 === 1) { r2 = 1 + Math.floor(rnd() * 20); notes.push('Glück: die 1 neu gewürfelt → ' + r2); }
  }
  let use = r1, how = '';
  if (st.mode === 'adv') { use = Math.max(r1, r2); how = 'Vorteil ' + r1 + '/' + r2; }
  if (st.mode === 'dis') { use = Math.min(r1, r2); how = 'Nachteil ' + r1 + '/' + r2; }
  let eff = use;
  if (c && c.lv('rog') >= 7 && k.type === 'check' && k.prof && use < 10) { eff = 10; notes.push('Verlässliches Talent: ' + use + ' zählt als 10'); }
  let bonus = 0;
  if (ch?.play?.fx?.bless && (k.type === 'attack' || k.type === 'save')) { const b = 1 + Math.floor(rnd() * 4); bonus += b; notes.push('Segnen +1W4 [' + b + ']'); }
  const ca = st.adv.filter((x) => x !== 'gewählt'), cd = st.dis.filter((x) => x !== 'gewählt');
  if (st.mode === 'adv' && ca.length) notes.push('Vorteil durch ' + ca.join(', '));
  if (st.mode === 'dis' && cd.length) notes.push('Nachteil durch ' + cd.join(', '));
  if (st.mode === 'normal' && st.adv.length && st.dis.length) notes.push('Vor- und Nachteil heben sich auf (' + st.adv.concat(st.dis).map((x) => (x === 'gewählt' ? 'Auswahl' : x)).join(', ') + ')');
  const total = eff + mod - ex + bonus;
  const crit = k.type === 'attack' && use >= (opts.crit || 20), fumble = use === 1;
  if (k.type === 'attack' && ch && st.adv.includes('Bedrängen')) fxSet(ch.play, 'vex', false);
  if (k.type === 'attack') S.lastAttack = { crit, fumble, total, nat: use, mode: st.mode };
  if (k.type === 'init' && S.combat && S.combat.active) setMyInit(total);
  const prts = opts.parts || (c && typeof partsFor === 'function' ? partsFor(c, opts.kind) : null);
  S.lastRoll = { label, mod: mod + bonus - ex, total, type: k.type, nat: use };
  if (k.type === 'attack') S.lastAtkRoll = S.lastRoll;
  else if (ch && !opts.noBoost && typeof showBoost === 'function' && c) setTimeout(() => showBoost(c, S.lastRoll), 900);
  pushLog({ label, total, detail: (how || 'W20 ' + use) + ' ' + sgn(mod) + (prts && prts.length > 1 ? ' (' + prts.join(', ') + ')' : '') + (ex ? ' −' + ex + ' Erschöpfung' : '') + (notes.length ? ' · ' + notes.join(' · ') : ''), crit, fumble, sides: 20, nat: use, pair: st.mode !== 'normal' ? [r1, r2] : null, keep: use === r1 ? 0 : 1, adv: st.mode === 'adv' });
  return total;
}
/* Würfel aus Teilen rollen (Schaden mit Krit, Kampfstilen usw.) */
function rollParts(parts, flat) {
  const groups = []; const det = []; let total = 0;
  for (const p of parts) {
    if (!p.n || !p.s) continue;
    let r = Array.from({ length: p.n }, () => 1 + Math.floor(rnd() * p.s));
    let note = '';
    if (p.savage) { const r2 = Array.from({ length: p.n }, () => 1 + Math.floor(rnd() * p.s)); const a = r.reduce((x, y) => x + y, 0), b = r2.reduce((x, y) => x + y, 0); note = ' (Wilder Angreifer: ' + a + ' oder ' + b + ')'; if (b > a) r = r2; }
    let eff = r;
    if (p.gwf) { eff = r.map((v) => (v <= 2 ? 3 : v)); if (eff.some((v, i) => v !== r[i])) note += ' (grosse Waffen: 1–2 zählen als 3)'; }
    total += eff.reduce((x, y) => x + y, 0);
    groups.push({ sides: p.s, rolls: eff, sign: 1 });
    det.push(p.n + 'W' + p.s + '[' + eff.join(',') + '] ' + p.tag + note);
  }
  if (flat) { total += flat; det.push(sgn(flat)); }
  return { total, groups, detail: det.join(' + ').replace(/\+ ([+−])/g, '$1') };
}
const dieOf = (d) => { const m = /^(\d+)W(\d+)$/.exec(d || ''); return m ? { n: +m[1], s: +m[2] } : null; };

/* ---------- Waffenangriff: Angriff → Treffer? → Schaden ---------- */
function weaponAttack(ch, i, o = {}) {
  const c = derive(ch, S.hb); let a = c.attacks[i]; if (!a) return;
  if (o.trueStrike) a = Object.assign({}, a, { atk: a.atk - c.mod[a.ab] + o.trueStrike.mod, dmod: a.dmod - c.mod[a.ab] + o.trueStrike.mod, atkParts: ['Wahrer Schlag: ' + AB_K[o.trueStrike.ab] + ' ' + sgn(o.trueStrike.mod)].concat((a.atkParts || []).slice(1)) });
  if (o.dist === undefined) { const nd = needDist(ch); if (nd === 'ask') return distPrompt(i, o); if (nd) o = Object.assign({}, o, { dist: nd }); }
  S.atkDist = o.dist || null;
  let how = o.how; if (o.off && a.mastery === 'nick' && !onceUsed(ch, 'nick')) how = 'nick';
  if (o.off && !o.bonusPaid) { const t0 = turnSt(ch); const okOff = t0.lightIdx != null && t0.lightIdx !== a.idx; if (!okOff && !ruleGate(ch, 'Der Zusatzangriff mit einer leichten Waffe setzt voraus, dass du in diesem Zug mit der Angriffsaktion schon mit einer anderen leichten Waffe angegriffen hast.', 'Zweitwaffe nicht möglich')) return; }
  if (typeof tCountAttack === 'function' && !o.bonusPaid && !tCountAttack(ch, c, how)) return;
  if (!o.off && !o.bonusPaid && (!how || how === 'action') && a.light && a.idx !== undefined) turnSt(ch).lightIdx = a.idx;
  if (how === 'nick') onceMark(ch, 'nick');
  if (ch.play.raging) ch.play.rageKeep = true;
  S.lastAttack = null;
  const fx = ch.play.fx || {}; const holy = fx.sacred && a.melee && a.idx !== undefined ? Math.max(1, c.mod.cha) : 0;
  const tg = typeof tgtEntry === 'function' ? tgtEntry() : null;
  const total = d20(a.atk + holy, a.name + ': Angriff' + (o.cleave ? ' (Durchspalten)' : '') + (holy ? ' (Heilige Waffe +' + holy + ')' : '') + (tg ? ' gegen ' + tg.name : ''), { kind: 'attack:' + (o.trueStrike ? 'spell' : a.ab) + (a.melee ? ':melee' : ''), crit: c.critRange, parts: (a.atkParts || []).concat(holy ? ['Heilige Waffe +' + holy] : []) }); if (fx.aim) { delete fx.aim; } if (total === null) return;
  const la = S.lastAttack || {};
  const sneakOk = !!c.lv('rog') && (a.finesse || a.ranged) && !onceUsed(ch, 'sneak') && la.mode !== 'dis';
  const auto = !la.fumble && typeof tgtAutoCrit === 'function' && tgtAutoCrit(a); S.atkDist = null;
  S.dp = { i, a, crit: !!la.crit || auto, crit0: !!la.crit, autoCrit: auto, nat: la.nat || 0, xd: [], fumble: !!la.fumble, total, mode: la.mode, two: !!a.twoOnly, sneak: sneakOk && la.mode === 'adv', smite: 0, fiend: false, off: !!o.off, cleave: !!o.cleave, savage: !onceUsed(ch, 'savage'), ts: o.trueStrike || null, tgt: tg ? tg.key : '' };
  setTimeout(renderDmgPrompt, 650);
}
function renderDmgPrompt() {
  const ch = cur(); const d = S.dp; if (!d) return orbPrompt(''); const c = derive(ch, S.hb); const a = d.a || c.attacks[d.i]; const P = ch.play; const inF = inFight(ch);
  const opts = [];
  if (a.vers) opts.push(chip(d.two, 'Zweihändig geführt (' + a.vers + ')', 'data-act="dpT" data-arg="two"'));
  if (c.lv('rog') && (a.finesse || a.ranged)) { const used = onceUsed(ch, 'sneak'); const dis = d.mode === 'dis'; opts.push(chip(d.sneak, 'Hinterhältiger Angriff ' + c.sneak + (used ? ' – in diesem Zug schon genutzt' : dis ? ' – nicht mit Nachteil' : d.mode === 'adv' ? '' : ' (nur mit Verbündetem neben dem Ziel)'), 'data-act="dpT" data-arg="sneak"', used || dis)); }
  if (d.autoCrit) opts.push(chip(d.crit, 'Ziel gelähmt/bewusstlos: Nahkampftreffer aus 1,5 m ist kritisch', 'data-act="dpT" data-arg="crit"'));
  if (a.light && !d.cleave) opts.push(chip(d.off, 'Zusatzangriff mit Zweitwaffe', 'data-act="dpT" data-arg="off" title="Ohne Attributsmodifikator, ausser mit Kampf mit zwei Waffen"'));
  if (a.idx !== undefined && c.feats.some((x) => x.id === 'savage')) { const used = onceUsed(ch, 'savage'); opts.push(chip(d.savage && !used, 'Wilder Angreifer (1× pro Zug)' + (used ? ' – schon genutzt' : ''), 'data-act="dpT" data-arg="savage"', used)); }
  if (c.critMark && !d.fumble && (d.crit0 === undefined ? !d.crit : !d.crit0) && d.nat >= c.critMark) opts.push(chip(d.crit, 'Gegen ' + c.critMarkLabel + ': kritisch (' + c.critMark + '+)', 'data-act="dpT" data-arg="crit"'));
  const bo = typeof boostOpts === 'function' ? boostOpts(c, 'attack') : []; const bown = bo.filter((x) => !x.ext);
  if (!d.fumble || bown.some((x) => x.how !== 'add')) opts.push('<span class="bsep">Nachbessern:</span>' + bown.map((x) => '<button class="chip" data-act="boostAtk" data-arg="' + x.k + '">' + esc(x.label) + '</button>').join('') + bo.filter((x) => x.ext && ['xW4', 'xW6', 'xW8'].includes(x.k)).map((x) => '<button class="chip" data-act="boostAtk" data-arg="' + x.k + '">' + x.label + '</button>').join(''));
  (c.dmgExtras || []).forEach((x) => { const r = x.res && c.res.find((y) => y.k === x.res); const left = r ? r.max - (+P.res[x.res] || 0) : 1; const used = !XD_MULTI.has(x.k) && onceUsed(ch, 'xd_' + x.k); opts.push(chip((d.xd || []).includes(x.k) && !used, esc(x.label) + (x.n ? ' +' + x.n + 'W' + x.s : '') + (x.flat ? ' +' + x.flat : '') + (used ? ' – schon genutzt' : ''), 'data-act="dpX" data-arg="' + x.k + '"', !left || used)); });
  for (const [k, R] of Object.entries(RIDERS)) if (P.fx && P.fx[k] && (k !== 'ewpn' || a.idx !== undefined)) { const on = d['r_' + k] !== false; opts.push(chip(on, R.tag + ' +' + R.n(+P.fx[k + '_L'] || 1) + 'W' + R.s + (R.ask ? ' (' + R.ask + '?)' : ''), 'data-act="dpR" data-arg="' + k + '"')); }
  if (P.fx && P.fx.hm) { const ok = markOk(P, 'hm', d.tgt); const on = ok && d.hm !== false; d.hm = on; opts.push(chip(on, 'Mal des Jägers +1W' + (c.lv('ran') >= 20 ? 10 : 6) + (P.fx.hmTgt ? ' (auf ' + partName(P.fx.hmTgt) + ')' : ' (gegen das markierte Ziel)') + (ok ? '' : ' – nicht das markierte Ziel'), 'data-act="dpT" data-arg="hm"', !ok)); }
  if (P.fx && P.fx.hex) { const ok = markOk(P, 'hex', d.tgt); const on = ok && d.hex !== false; d.hex = on; opts.push(chip(on, 'Verhexen +1W6' + (P.fx.hexTgt ? ' (auf ' + partName(P.fx.hexTgt) + ')' : ' (gegen das verhexte Ziel)') + (ok ? '' : ' – nicht das verhexte Ziel'), 'data-act="dpT" data-arg="hex"', !ok)); }
  let smite = '';
  if (c.lv('pal') >= 2 && !a.ranged) {
    const lv = slotLevels(c, getSpell('divine-smite'));
    const free = c.res.find((r) => r.k === 'smite'); const freeLeft = free ? free.max - (+P.res.smite || 0) : 0;
    const pa = pactAvail(c, getSpell('divine-smite'));
    const choices = (freeLeft ? [['free', 'Gratis (Grad 1)']] : []).concat(lv.map((g) => [String(g), 'Grad ' + g])).concat(pa ? [['pact', 'Paktplatz (Grad ' + pa + ')']] : []);
    const sBlock = inF && rule('strict') ? (tLeft(ch, 'b') <= 0 ? 'Bonusaktion schon verbraucht' : canAct(ch)) : null;
    const slotBlock = inF && rule('strict') && turnSt(ch).slotSpell && !offTurn();
    const ch2 = sBlock ? [] : slotBlock ? choices.filter(([v]) => v === 'free') : choices;
    if (choices.length && !ch2.length) smite = '<div class="dpsm"><span>Göttliches Niederstrecken: nicht möglich – ' + esc(sBlock || 'in diesem Zug wurde schon ein Zauberplatz verbraucht') + '.</span></div>';
    else if (ch2 !== choices) { const keep = ch2.slice(); choices.length = 0; choices.push(...keep); }
    if (choices.length && !smite) smite = '<div class="dpsm"><span>Göttliches Niederstrecken (Bonusaktion):</span>' + chip(!d.smite, 'Nein', 'data-act="dpSmite" data-arg="0"') + choices.map(([v, l]) => chip(String(d.smite) === v, l, 'data-act="dpSmite" data-arg="' + v + '"')).join('') + (d.smite ? chip(d.fiend, 'Gegen Unhold/Untoten (+1W8)', 'data-act="dpT" data-arg="fiend"') : '') + '</div>';
  }
  const fx = [];
  if (P.fx && P.fx.df) fx.push('Göttliche Gunst');
  if (P.raging && a.rage) fx.push('Kampfrausch +' + c.rageDmg);
  if (a.mastery && MASTERY[a.mastery]) fx.push('Meisterschaft ' + MASTERY[a.mastery][0]);
  if (d.ts) fx.push('Wahrer Schlag');
  if (c.lv('pal') >= 11 && !a.ranged) fx.push('Strahlende Schläge');
  orbPrompt('<div class="pr' + (d.crit ? ' crit' : '') + '"><b>' + esc(a.name) + ': ' + (d.crit ? 'Kritischer Treffer! ' : '') + 'Angriff ' + d.total + '</b><p>' + (d.crit ? 'Alle Schadenswürfel werden verdoppelt.' : d.fumble ? 'Eine natürliche 1 verfehlt immer.' : 'Trifft das die RK des Ziels? ' + slTag() + '') + (fx.length ? ' Automatisch dabei: ' + fx.join(', ') + '.' : '') + '</p>' +
    (opts.length ? '<div class="chips">' + opts.join('') + '</div>' : '') + smite +
    '<div class="chips end"><button class="btn ghost" data-act="dpMiss">Verfehlt</button><button class="btn" data-act="dpRoll"' + (d.fumble ? ' disabled' : '') + '>' + (d.crit ? 'Kritischen Schaden würfeln' : 'Treffer – Schaden würfeln') + '</button></div></div>');
}
function dmgRoll(ch) {
  const d = S.dp; if (!d) return; const c = derive(ch, S.hb); const a = d.a || c.attacks[d.i]; const P = ch.play;
  if (d.tgt && onlineFight() && !order().some((x) => x.key === d.tgt)) { d.tgt = ''; bannerToast('Ziel nicht mehr im Kampf', 'Zielgebundene Boni entfallen.'); }
  const parts = []; let flat = a.dmod; const once = [];
  if (d.cleave && flat > 0) flat = 0;
  const base = dieOf(d.two && a.vers ? a.vers : a.die);
  const gwf = c.feats.some((x) => x.id === 'fs-gwf') && a.gwf && (a.twoOnly || d.two);
  const sav = a.idx !== undefined && d.savage && c.feats.some((x) => x.id === 'savage') && !onceUsed(ch, 'savage'); if (sav) once.push('savage');
  if (base) parts.push({ n: base.n, s: base.s, tag: a.name.replace(/ \+\d$/, ''), gwf, savage: sav });
  if (d.ts) { const tsd = spellDice(getSpell('true-strike'), 0, c, d.ts.mod); const m2 = tsd && /^(\d+)W(\d+)/.exec(tsd); if (m2) parts.push({ n: +m2[1], s: +m2[2], tag: 'Wahrer Schlag (gleissend)' }); }
  if (d.off && !c.feats.some((x) => x.id === 'fs-twf')) flat = Math.min(0, flat);
  if (P.raging && a.rage) flat += c.rageDmg;
  if (d.sneak && c.lv('rog') && (a.finesse || a.ranged) && !onceUsed(ch, 'sneak') && d.mode !== 'dis') { parts.push({ n: Math.ceil(c.lv('rog') / 2), s: 6, tag: 'Hinterhältig' }); once.push('sneak'); }
  if (P.fx && P.fx.hm && d.hm !== false && markOk(P, 'hm', d.tgt)) parts.push({ n: 1, s: c.lv('ran') >= 20 ? 10 : 6, tag: 'Mal des Jägers' });
  if (P.fx && P.fx.df) parts.push({ n: 1, s: 4, tag: 'Göttliche Gunst' });
  for (const [k, R] of Object.entries(RIDERS)) if (P.fx && P.fx[k] && (k !== 'ewpn' || a.idx !== undefined) && d['r_' + k] !== false) parts.push({ n: R.n(+P.fx[k + '_L'] || 1), s: R.s, tag: R.tag });
  if (P.fx && P.fx.hex && d.hex !== false && markOk(P, 'hex', d.tgt)) parts.push({ n: 1, s: 6, tag: 'Verhexen (nekrotisch)' });
  if (c.lv('pal') >= 11 && !a.ranged) parts.push({ n: 1, s: 8, tag: 'Strahlende Schläge' });
  let smiteNote = '';
  for (const x of (c.dmgExtras || []).filter((y) => (d.xd || []).includes(y.k))) { if (!XD_MULTI.has(x.k)) { if (onceUsed(ch, 'xd_' + x.k)) continue; once.push('xd_' + x.k); } if (x.res) { const r = c.res.find((y) => y.k === x.res); const used = +P.res[x.res] || 0; if (!r || used >= r.max) continue; P.res[x.res] = used + 1; smiteNote += ' · ' + r.n + ' verbraucht'; } if (x.n) parts.push({ n: x.n, s: x.s, tag: x.label.replace(/ \(.*\)$/, '') + (x.note ? ' (' + x.note + ')' : '') }); if (x.flat) flat += x.flat; }
  if (d.smite) {
    const inF = inFight(ch); const sb = inF && rule('strict') && (tLeft(ch, 'b') <= 0 || canAct(ch)); const sl = inF && rule('strict') && d.smite !== 'free' && turnSt(ch).slotSpell && !offTurn();
    if (sb || sl) { smiteNote += ' · Niederstrecken nicht möglich (' + (sb ? 'keine Bonusaktion' : 'schon ein Zauberplatz in diesem Zug') + ')'; d.smite = 0; }
  }
  if (d.smite) {
    let lvl = 1;
    if (d.smite === 'free') { P.res.smite = (+P.res.smite || 0) + 1; smiteNote = ' · freies Niederstrecken verbraucht'; }
    else if (d.smite === 'pact') { lvl = c.spell.pact.lvl; P.pact = (+P.pact || 0) + 1; smiteNote = ' · Paktplatz (Grad ' + lvl + ') für Niederstrecken verbraucht'; }
    else { lvl = +d.smite; P.slots[lvl] = (+P.slots[lvl] || 0) + 1; smiteNote = ' · Platz Grad ' + lvl + ' für Niederstrecken verbraucht'; }
    parts.push({ n: 1 + lvl + (d.fiend ? 1 : 0), s: 8, tag: 'Niederstrecken' });
    if (typeof tSpend === 'function') tSpend(ch, 'b', 'Göttliches Niederstrecken', true); if (d.smite !== 'free' && !offTurn()) turnSt(ch).slotSpell = true;
  }
  if (d.crit) parts.forEach((p) => { p.n *= 2; });
  const r = rollParts(parts, flat);
  once.forEach((k) => onceMark(ch, k));
  const mast = masteryHit(ch, c, a, d);
  pushLog({ label: a.name + ': Schaden' + (d.crit ? ' (kritisch)' : '') + (d.cleave ? ' (Durchspalten)' : ''), groups: r.groups, total: r.total, detail: r.detail + (a.dtype ? ' · ' + a.dtype : '') + smiteNote + (mast.note ? ' · ' + mast.note : ''), sides: base ? base.s : 0, nat: r.total, crit: d.crit });
  S.dp = null; commit(); if (d.tgt && d.tgt.startsWith('n:') && onlineFight()) applyPrompt(d.tgt, r.total, a.name, mast.prompt || ''); else orbPrompt(mast.prompt || '');
}

/* ---------- Angriffszauber: Angriff → Treffer? → Schaden, auch mehrere Strahlen ---------- */
function spellAttack(ch, s, count, expr, tail, note, atk) { S.sa = { name: s.name, sid: s.id, k: 1, count, expr, tail, note: note || '', atk }; saAttack(); }
function saAttack() {
  const o = S.sa; if (!o) return; const c = derive(cur(), S.hb);
  S.lastAttack = null;
  const lbl = o.name + (o.count > 1 ? ' · ' + o.k + '/' + o.count : '') + ': Angriff';
  const total = d20(o.atk ?? c.spell.atk, lbl, { kind: 'attack:spell', crit: 20 }); if (total === null) { S.sa = null; return; }
  const la = S.lastAttack || {}; o.crit = !!la.crit; const fumble = !!la.fumble;
  setTimeout(() => orbPrompt('<div class="pr' + (o.crit ? ' crit' : '') + '"><b>' + esc(o.name) + (o.count > 1 ? ' · ' + o.k + ' von ' + o.count : '') + ': ' + (o.crit ? 'Kritischer Treffer! ' : '') + 'Angriff ' + total + '</b><p>' + (o.crit ? 'Die Schadenswürfel werden verdoppelt.' : fumble ? 'Eine natürliche 1 verfehlt immer.' : 'Trifft das die RK des Ziels? ' + slTag() + '') + (o.count > 1 && o.k === 1 ? ' Jeder Strahl darf ein anderes Ziel treffen.' : '') + '</p><div class="chips end"><button class="btn ghost" data-act="saMiss">Verfehlt</button><button class="btn" data-act="saHit"' + (fumble ? ' disabled' : '') + '>' + (o.crit ? 'Kritischen Schaden würfeln' : 'Treffer – Schaden würfeln') + '</button></div></div>'), 650);
}
function saNext() { const o = S.sa; if (!o) return; orbPrompt(''); if (o.k < o.count) { o.k++; setTimeout(saAttack, 350); } else S.sa = null; }
function saHit() {
  const o = S.sa; if (!o) return;
  const P = cur().play; const c = derive(cur(), S.hb); let base = o.expr; const add = [];
  if (P.fx && P.fx.hm && markOk(P, 'hm', S.tgt || '')) { base += '+1W' + (c.lv('ran') >= 20 ? 10 : 6); add.push('Mal des Jägers'); }
  if (P.fx && P.fx.hex && markOk(P, 'hex', S.tgt || '')) { base += '+1W6'; add.push('Verhexen'); }
  const expr = o.crit ? base.replace(/(\d+)W(\d+)/g, (m, n, d) => 2 * n + 'W' + d) : base;
  const r = rollExpr(expr); const mm = /W(\d+)/.exec(expr);
  if (o.sid === 'sorcerous-burst') burstExplode(r, Math.max(0, spellCtx(c, 'sorcerous-burst').mod));
  pushLog({ label: o.name + (o.count > 1 ? ' · ' + o.k + '/' + o.count : '') + ': Schaden' + (o.crit ? ' (kritisch)' : ''), groups: r.groups, total: r.total, detail: r.detail + (o.note ? ' · ' + o.note : '') + (add.length ? ' · inkl. ' + add.join(', ') : '') + (o.k === 1 && o.tail ? ' · ' + o.tail : ''), sides: mm ? +mm[1] : 0, nat: r.total, crit: o.crit });
  saNext();
}
function rollDmg(expr, label) { const r = rollExpr(expr); const m = /W(\d+)/.exec(String(expr)); const g = /\[([\d,]+)\]/.exec(r.detail); pushLog({ label, groups: r.groups, total: r.total, detail: r.detail, sides: m ? +m[1] : 0, nat: g ? g[1].split(',').reduce((a, b) => a + +b, 0) : r.total }); }
function pushLog(e) { e.t = Date.now(); if (S.secret) e.secret = true; if (e.sides && !e.dset && typeof d3setOf === 'function') e.dset = d3setOf(cur()); const d3on = typeof d3fx === 'function' && d3ok(e.sides) && d3fx() !== 'aus'; if (!d3on && e.sides === 20 && (e.nat === 20 || e.crit || e.nat === 1) && typeof themeBurst === 'function') { const k = e.nat === 1 || e.fumble ? 'fumble' : 'crit'; setTimeout(() => themeBurst(k), 820); } S.log.unshift(e); S.log = S.log.slice(0, 30); showToast(e); const l = $('#log'); if (l) l.innerHTML = logHtml(); if ((e.sides || e.share) && !e.preview) shareRoll(e); }
/* ---------- Würfelschale: viele Würfel über den Bildschirm ---------- */
function showMulti(e, flat) {
  const t = $('#toast'); const tray = $('#tray');
  clearTimeout(showMulti.fade); clearInterval(showMulti.iv); clearTimeout(showMulti.st);
  const extra = Math.max(0, flat.length - 30); const list = flat.slice(0, 30); const n = list.length;
  let reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) {}
  const has3 = typeof d3ok === 'function'; const set = has3 ? (e.dset || d3setOf(cur())) : ''; const fxl = has3 ? d3fx() : 'voll'; if (has3 && fxl === 'aus') reduce = true;
  const live3 = has3 && fxl === 'voll' && n <= 6;
  const d3h = (d, v, cls) => '<span class="die d3 ' + cls + '" style="--dg:' + D3_SETS[set].glow + '">' + d3svg(d.sides, v, set, { gold: / crit/.test(cls) && d.sides === 20, dead: / fum/.test(cls) && d.sides === 20, cracks: / fum/.test(cls) && d.sides === 20, thin: n > 6 }) + '</span>';
  const W = window.innerWidth, H = window.innerHeight;
  const areaW = W * 0.86, areaH = H * 0.52, top0 = H * 0.2;
  const cols = Math.max(1, Math.min(n, Math.ceil(Math.sqrt(n * areaW / areaH))));
  const rows = Math.ceil(n / cols);
  const cell = Math.min(areaW / cols, areaH / rows, 110);
  const size = Math.max(36, Math.min(84, cell * 0.8));
  const x0 = (W - cols * cell) / 2, y0 = top0 + (areaH - rows * cell) / 2;
  tray.innerHTML = ''; tray.classList.remove('fade'); tray.hidden = false;
  const els = list.map((d, i) => {
    const r = Math.floor(i / cols), col = i % cols;
    const jx = (Math.random() - 0.5) * cell * 0.18, jy = (Math.random() - 0.5) * cell * 0.18;
    const el = document.createElement('div'); el.className = 'tdie' + (reduce ? '' : ' fly');
    const side = Math.floor(rnd() * 4);
    const fx = side === 0 ? -W * 0.6 : side === 1 ? W * 0.6 : (Math.random() - 0.5) * W;
    const fy = side === 2 ? -H * 0.6 : side === 3 ? H * 0.6 : (Math.random() - 0.5) * H;
    el.style.cssText = 'left:' + (x0 + col * cell + (cell - size) / 2 + jx) + 'px;top:' + (y0 + r * cell + (cell - size) / 2 + jy) + 'px;width:' + size + 'px;height:' + size + 'px;--fx:' + fx + 'px;--fy:' + fy + 'px;--rot:' + ((Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540)) + 'deg;--fr:' + ((Math.random() - 0.5) * 30) + 'deg;animation-delay:' + (i * 28) + 'ms';
    if (has3 && d3ok(d.sides)) { el.dataset.d3 = '1'; if (live3 && !reduce) { el.innerHTML = '<span class="die d3 rolling3" style="--dg:' + D3_SETS[set].glow + '"></span>'; el._h = d3roll(el.firstChild, d.sides, d.v, set, { dur: 700 + i * 60 }); } else el.innerHTML = d3h(d, reduce ? d.v : 1 + Math.floor(rnd() * d.sides), 'rolling-x'); }
    else el.innerHTML = dieSvg(d.sides, reduce ? d.v : 1 + Math.floor(rnd() * d.sides), 'rolling-x');
    tray.appendChild(el); return el;
  });
  const head = '<div class="tl">' + esc(e.label) + ' · ' + flat.length + ' Würfel</div>';
  t.hidden = false; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
  t.innerHTML = '<div class="tt">' + head + '<div class="tv dim">…</div></div>';
  const land = () => {
    clearInterval(showMulti.iv); t.onclick = null;
    els.forEach((el, i) => { const d = list[i]; const pair = (e.pairVals || []).includes(d.v); const cls = pair ? ' pair' : d.v === d.sides ? ' crit' : d.v === 1 ? ' fum' : '';
      if (el.dataset.d3) { if (el._h) el._h.skip(); el.innerHTML = d3h(d, d.v, 'land' + cls + (d.neg ? ' neg' : '')); return; }
      const tx = el.querySelector('text'); if (tx) tx.textContent = d.v; el.firstChild.className = 'die land' + cls + (d.neg ? ' neg' : ''); });
    if (has3 && fxl !== 'aus') d3snd('land');
    if ((e.pairVals || []).length) { const pb = document.createElement('div'); pb.className = 'tpair'; pb.textContent = 'Pasch!'; tray.appendChild(pb); }
    const sum = list.reduce((a, d) => a + (d.neg ? -d.v : d.v), 0);
    t.innerHTML = '<div class="tt">' + head + '<div class="tv">' + esc(e.total) + '</div><div class="td">' + esc(e.detail) + (extra ? ' · ' + extra + ' weitere Würfel nicht gezeigt' : '') + '</div></div>';
    let sb = tray.querySelector('.tsum'); if (!sb) { sb = document.createElement('div'); sb.className = 'tsum'; tray.appendChild(sb); }
    sb.innerHTML = '<span>' + esc(e.label) + '</span><b>' + esc(e.total) + '</b>';
    showMulti.fade = setTimeout(() => { tray.classList.add('fade'); setTimeout(() => { tray.hidden = true; tray.innerHTML = ''; }, 600); }, 3600);
    showToast.tm = setTimeout(() => { t.hidden = true; }, 5000);
  };
  if (reduce) return land();
  if (has3) { d3snd('roll', n); t.onclick = () => { clearTimeout(showMulti.st); t.onclick = null; land(); }; }
  showMulti.iv = setInterval(() => els.forEach((el, i) => { if (el.dataset.d3) return; const tx = el.querySelector('text'); if (tx) tx.textContent = 1 + Math.floor(rnd() * list[i].sides); }), 80);
  showMulti.st = setTimeout(land, 850 + n * 28);
}

/* ---------- Freier Würfelbecher ---------- */
function renderDicePanel() {
  const d = S.dr || (S.dr = { n: 1, d: 20, mod: 0 });
  const expr = d.n + 'W' + d.d + (d.mod ? sgn(d.mod).replace('−', '-') : '');
  $('#dicePanel').innerHTML = '<div class="dph"><h3>Würfelbecher</h3><button class="x" data-act="drClose" aria-label="Schliessen">×</button></div>' +
    '<div class="chips">' + [4, 6, 8, 10, 12, 20, 100].map((s) => chip(d.d === s, 'W' + s, 'data-act="drDie" data-arg="' + s + '"')).join('') + '</div>' +
    '<div class="dprow"><span>Anzahl</span><div class="stepper"><button data-act="drN" data-arg="-1" aria-label="weniger">−</button><b>' + d.n + '</b><button data-act="drN" data-arg="1" aria-label="mehr">+</button></div><div class="chips">' + [2, 4, 6, 8, 10, 20, 30].map((v) => chip(d.n === v, String(v), 'data-act="drSet" data-arg="' + v + '"')).join('') + '</div></div>' +
    '<div class="dprow"><span>Bonus</span><div class="stepper"><button data-act="drM" data-arg="-1" aria-label="weniger">−</button><b>' + sgn(d.mod) + '</b><button data-act="drM" data-arg="1" aria-label="mehr">+</button></div></div>' +
    (typeof diceRow === 'function' ? diceRow(cur(), true) : '') + '<button class="btn big" data-act="drRoll">' + esc(expr.replace('-', '−')) + ' würfeln</button>';
}

function dieSvg(sides, n, cls) {
  let shape;
  if (sides === 20) shape = '<polygon class="df" points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"/><polygon class="dl" points="32,15 50,44 14,44"/><path class="dl" d="M32 3 32 15M57 17.5 50 44M7 17.5 14 44M32 61 50 44M32 61 14 44"/>';
  else if (sides === 6) shape = '<rect class="df" x="8" y="8" width="48" height="48" rx="9"/>';
  else if (sides === 4) shape = '<polygon class="df" points="32,5 60,56 4,56"/>';
  else shape = '<polygon class="df" points="32,3 60,32 32,61 4,32"/><path class="dl" d="M4 32H60"/>';
  const ty = sides === 20 ? 38 : sides === 4 ? 46 : 38;
  return '<span class="die ' + (cls || '') + '"><svg viewBox="0 0 64 64" aria-hidden="true">' + shape + '<text x="32" y="' + ty + '" text-anchor="middle">' + n + '</text></svg></span>';
}
function showToast(e) {
  const t = $('#toast'); clearTimeout(showToast.tm); clearInterval(showToast.iv); clearTimeout(showToast.st);
  const flat = (e.groups || []).flatMap((g) => g.rolls.map((v) => ({ v, sides: g.sides, neg: g.sign < 0 })));
  if (flat.length > 1) return showMulti(e, flat);
  const sides = e.sides || 0;
  const head = '<div class="tl">' + esc(e.label) + (e.pair ? ' <span class="mode">' + (e.adv ? 'Vorteil' : 'Nachteil') + '</span>' : '') + '</div>';
  const vals = e.pair || (flat.length === 1 ? [flat[0].v] : sides ? [e.nat ?? e.total] : []);
  const keep = e.pair ? e.keep : 0;
  const hl = (e.crit ? ' crit' : e.fumble ? ' fum' : '');
  const use3 = typeof d3ok === 'function' && d3ok(sides); const set = use3 ? (e.dset || d3setOf(cur())) : ''; const fxl = use3 ? d3fx() : 'aus';
  const dieH = (v, cls) => use3 ? '<span class="die d3 ' + cls + '" style="--dg:' + D3_SETS[set].glow + '">' + d3svg(sides, v, set, { gold: / crit/.test(cls) && sides === 20, dead: / fum/.test(cls) && sides === 20, cracks: / fum/.test(cls) && sides === 20 }) + '</span>' : dieSvg(sides, v, cls);
  const final = () => {
    clearInterval(showToast.iv); t.onclick = null;
    const dice = vals.map((v, i) => dieH(v, 'land' + (i === keep ? hl : ' drop'))).join('');
    t.innerHTML = '<div class="trow"><div class="dice">' + dice + '</div><div class="tt">' + head + '<div class="tv' + hl + '">' + e.total + '</div><div class="td">' + esc(e.detail) + (e.crit ? ' · Kritischer Treffer!' : '') + '</div></div></div>';
    if (use3) { if (fxl !== 'aus') d3snd('land'); if (sides === 20 && (e.crit || e.fumble)) { const el = t.querySelectorAll('.die')[keep]; d3effect(el, set, e.crit ? 'n20' : 'n1', fxl); d3snd(e.crit ? 'n20' : 'n1'); } }
    showToast.tm = setTimeout(() => { t.hidden = true; }, 4500);
  };
  t.hidden = false; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
  let reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) {}
  if (use3) {
    if (fxl !== 'voll') return final();
    t.innerHTML = '<div class="trow"><div class="dice">' + vals.map(() => '<span class="die d3 rolling3" style="--dg:' + D3_SETS[set].glow + '"></span>').join('') + '</div><div class="tt">' + head + '<div class="tv dim">…</div></div></div>';
    d3snd('roll', vals.length); let left = vals.length; const hs = [];
    t.querySelectorAll('.die').forEach((el, i) => hs.push(d3roll(el, sides, vals[i], set, { dur: 760 + i * 140, onDone: () => { if (--left === 0) final(); } })));
    t.onclick = () => { hs.forEach((h) => h.skip()); };
    return;
  }
  if (!sides || reduce) return final();
  const flick = () => 1 + Math.floor(Math.random() * sides);
  t.innerHTML = '<div class="trow"><div class="dice">' + vals.map((_, i) => dieSvg(sides, flick(), 'rolling' + (i ? ' r2' : ''))).join('') + '</div><div class="tt">' + head + '<div class="tv dim">…</div></div></div>';
  showToast.iv = setInterval(() => { t.querySelectorAll('.die text').forEach((x) => { x.textContent = flick(); }); }, 70);
  showToast.st = setTimeout(final, e.pair ? 950 : 750);
}
const logHtml = () => S.log.length ? S.log.map((e) => '<li><span>' + esc(e.label) + '</span><b' + (e.crit ? ' class="crit"' : '') + '>' + e.total + '</b><small>' + esc(e.detail) + '</small></li>').join('') : '<li class="empty">Noch nichts gewürfelt. Tippe auf einen Wert.</li>';

/* ---------- Bausteine ---------- */
const chip = (on, label, attrs, dis) => '<button type="button" class="chip' + (on ? ' on' : '') + '"' + (dis && !on ? ' disabled' : '') + ' ' + attrs + '>' + label + '</button>';
const sel = (path, val, opts, extra = '') => '<select data-bind="' + path + '" ' + extra + '>' + opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
const num = (path, val, extra = '') => '<input type="number" inputmode="numeric" data-bind="' + path + '" data-type="num" value="' + esc(val) + '" ' + extra + '>';
const txt = (path, val, ph = '', extra = '') => '<input type="text" data-bind="' + path + '" value="' + esc(val) + '" placeholder="' + esc(ph) + '" ' + extra + '>';
const area = (path, val, ph = '', rows = 4) => '<textarea data-bind="' + path + '" data-norender rows="' + rows + '" placeholder="' + esc(ph) + '">' + esc(val) + '</textarea>';
const field = (label, inner, hint) => '<label class="fld"><span>' + label + '</span>' + inner + (hint ? '<em>' + hint + '</em>' : '') + '</label>';
const abOpts = (list) => (list || AB).map((k) => [k, AB_DE[k]]);
function featOptions(cat, hb, cls, lv) {
  const o = [];
  for (const [id, f] of Object.entries(FEATS)) {
    if (cat === 'origin' && f.cat !== 'origin') continue;
    if (cat === 'asi' && !(f.cat === 'general' || f.cat === 'origin' || (f.cat === 'epic' && lv >= 19) || (f.cat === 'style' && cls.fightingStyle))) continue;
    if (cat === 'style' && f.cat !== 'style') continue;
    o.push([id, f.name + (f.orig ? ' ✦' : '') + (f.src === 'phb' ? ' (PHB)' : '') + (cat === 'asi' && f.cat === 'origin' ? ' (Herkunft)' : '')]);
  }
  for (const h of Object.values(hb)) if (h.kind === 'feat' && (cat === 'asi' || (h.cat || 'general') === cat || (cat === 'origin' && h.cat === 'origin'))) o.push(['hb:' + h.id, h.name + ' (Hausregel)']);
  return o;
}
const spellName = (id) => (getSpell(id, S.hb) || { name: id }).name;

/* ---------- Kopfzeile ---------- */
const HUE = { bar:'#C8553D', brd:'#C77DBA', cle:'#E8C66A', dru:'#7FA65A', fig:'#B8875A', mon:'#5FA8A0', pal:'#E2AE52', ran:'#6E9F6A', rog:'#8C8FA8', sor:'#D9603B', wlk:'#9A6BD1', wiz:'#5B8FD9' };
function sigil(ch, extra) {
  const pt = ch.portrait || '';
  if (pt === 'img' && ch.portraitImg) return '<span class="sigil art" style="background-image:url(' + ch.portraitImg + ')"' + (extra || '') + ' aria-hidden="true"></span>';
  if (pt.startsWith('art:') && ART[pt.slice(4)]) return '<span class="sigil art" style="background-image:url(' + ART[pt.slice(4)] + ')"' + (extra || '') + ' aria-hidden="true"></span>';
  if (pt === 'ini' || !CREST[ch.cls]) { const ini = (ch.name || '?').replace(/^Beispiel:\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
    return '<span class="sigil" style="--h:' + (HUE[ch.cls] || 'var(--gold)') + '"' + (extra || '') + ' aria-hidden="true">' + esc(ini) + '</span>'; }
  return '<span class="sigil crest" style="--h:' + (HUE[ch.cls] || 'var(--gold)') + '"' + (extra || '') + ' aria-hidden="true">' + crestSvg(ch.cls) + '</span>';
}
const psig = (p) => sigil({ name: p.char, cls: p.cls, portrait: p.portrait, portraitImg: p.pimg });
const LOGO = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><polygon points="16,2.5 27.7,9.25 27.7,22.75 16,29.5 4.3,22.75 4.3,9.25"/><polygon points="16,9.5 22,20 10,20"/><path d="M16 9.5V2.5M22 20l5.7 2.75M10 20l-5.7 2.75M16 9.5 4.3 9.25M16 9.5l11.7-.25M22 20l-6 9.5M10 20l6 9.5M22 20l5.7-10.75M10 20 4.3 9.25" opacity=".7"/></svg>';
function renderTop() {
  const ch = cur();
  const tabs = [['heroes', 'Helden'], ['sheet', 'Bogen'], ['build', 'Erschaffen'], ['camp', 'Tisch'], ['spells', 'Zauberbuch']];
  const more = [['mobs', 'Bestiarium'], ['hb', 'Hausregeln'], ['help', 'Hilfe']]; const moreOn = more.some(([k]) => S.view === k);
  $('#top').innerHTML = '<div class="wrap"><div class="bar"><button class="brand" data-act="view" data-arg="heroes">' + LOGO + 'Heldenbuch</button>' +
    '<nav class="tabs" role="tablist">' + tabs.map(([k, l]) => '<button role="tab" aria-selected="' + (S.view === k) + '" class="' + (S.view === k ? 'on' : '') + '" data-act="view" data-arg="' + k + '">' + l + '</button>').join('') +
      '<details class="mnu tmore"><summary class="' + (moreOn ? 'on' : '') + '">' + (moreOn ? more.find(([k]) => S.view === k)[1] : 'Mehr') + ' <span aria-hidden="true">▾</span></summary><div class="mnul">' + more.map(([k, l]) => '<button class="' + (S.view === k ? 'on' : '') + '" data-act="view" data-arg="' + k + '">' + l + '</button>').join('') + '</div></details></nav>' +
    '<button class="mbtn mwarn" data-act="warnOpen" hidden aria-label="Offene Punkte"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.2v.1"/></svg><b></b></button><button class="mbtn mdice" data-act="drOpen" aria-label="Würfelbecher"><svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,4 56,18 56,46 32,60 8,46 8,18"/><polygon points="32,18 46,42 18,42"/></svg></button>' +
    '<button class="tbtn tsearch" data-act="search" title="Suchen (Strg+K oder /)" aria-label="Suchen"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg></button>' +
    '<button class="tbtn" data-act="themeOpen" title="Stimmung wählen" aria-label="Stimmung wählen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.9-1.7H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="11" r="1.3"/><circle cx="10.5" cy="7" r="1.3"/><circle cx="15" cy="7.5" r="1.3"/></svg></button>' + (ch ? '<button class="curhero" data-act="view" data-arg="heroes" title="Helden wechseln">' + sigil(ch) + '<span>' + esc(ch.name.replace(/^Beispiel:\s*/, '')) + '</span></button>' : '') +
    '</div><span id="saveState" class="savest"></span></div><div id="turnbar"></div>';
  paintSave(); paintTurn();
  const bn = $('#bnav'); if (bn) bn.innerHTML = bnavHtml();
}

/* ---------- Heldenauswahl ---------- */
function renderHeroes() {
  const ids = Object.keys(S.chars).sort((a, b) => (S.chars[b].updated || 0) - (S.chars[a].updated || 0));
  let h = '<div class="hero-intro banner" style="' + bannerStyle('paladin') + '"><h1>Deine Helden</h1><p>Wähle einen Helden zum Spielen, erschaffe einen neuen oder lade einen gesicherten Helden aus einer Datei.</p></div>' + backupLine(ids.length) + '<div class="heroes">';
  h += '<button class="newhero" data-act="newChar"><span class="plus">+</span><b>Neuen Helden erschaffen</b><span>Schritt für Schritt, alles wird für dich berechnet.</span></button>';
  for (const id of ids) {
    const ch = S.chars[id]; let c; try { c = derive(ch, S.hb); } catch (e) { continue; }
    const conf = S.confirm === 'del:' + id;
    h += '<article class="hero' + (id === S.cur ? ' cur' : '') + '">' + (id === S.cur ? '<span class="curlbl">Aktiv</span>' : '') + sigil(ch) +
      '<div><h3>' + esc(ch.name) + '</h3><p>' + c.classLabel + (c.hasSub && !c.multi && c.subName ? ' · ' + c.subName : '') + '<br>' + c.sp.name + ' · ' + esc(c.bg.name) + '</p></div>' +
      '<div class="mini"><span><b>' + c.ac + '</b>RK</span><span><b>' + c.hpMax + '</b>TP</span><span><b>' + sgn(c.init) + '</b>Init</span></div>' +
      (c.warn.length ? '<p class="warnline">' + c.warn.length + ' Auswahl(en) offen</p>' : '') +
      '<div class="acts"><button class="btn" data-act="play" data-arg="' + id + '">Spielen</button><button class="btn ghost" data-act="edit" data-arg="' + id + '">Bearbeiten</button></div>' +
      '<div class="acts2"><button data-act="exportOne" data-arg="' + id + '">Exportieren</button><button data-act="dupChar" data-arg="' + id + '">Duplizieren</button>' +
      (conf ? '<button class="del" data-act="delChar" data-arg="' + id + '">Wirklich löschen?</button><button data-act="noDel">Nein</button>' : '<button class="del" data-act="askDel" data-arg="' + id + '">Löschen</button>') + '</div></article>';
  }
  h += '</div>' + (isApp() ? transferHtml() : '') + '<details class="themefold"><summary>Stimmung &amp; Aussehen</summary>' + themeBlock() + '</details>' + '<div class="herobar"><label class="btn ghost filebtn">Helden aus Datei laden<input type="file" id="importFile" accept=".json,application/json"></label><button class="btn ghost" data-act="importText">Text einfügen</button>' + (ids.length > 1 ? '<button class="btn ghost" data-act="exportAll">Alle Helden exportieren</button>' : '') + '</div>';
  return h;
}

/* ---------- Export / Import ---------- */
function exportData(list) { return JSON.stringify({ heldenbuch: 1, exportiert: new Date().toISOString(), chars: list, hb: Object.values(S.hb) }, null, 2); }
function backupLine(n) {
  if (!n) return ''; let t = 0; try { t = +localStorage.getItem('hb_lastExport') || 0; } catch (e) {}
  const days = t ? Math.floor((Date.now() - t) / 864e5) : null;
  const warn = days === null || days >= 14;
  return '<p class="backupline' + (warn ? ' warn' : '') + '">' + (days === null ? 'Noch keine Sicherung exportiert.' : 'Letzte Sicherung: ' + (days === 0 ? 'heute' : 'vor ' + days + ' Tag' + (days === 1 ? '' : 'en')) + '.') + (warn ? ' Der Browser-Speicher ist kein Archiv – <button class="link" data-act="exportAll">jetzt alle Helden exportieren</button>.' : '') + '</p>';
}
function markExported() { try { localStorage.setItem('hb_lastExport', String(Date.now())); } catch (e) {} }
async function doExport(list, fname) {
  const data = exportData(list); markExported();
  try { const d = await (window.claude && window.claude.use ? window.claude.use('downloads') : null); if (!d) throw new Error('none'); await d.save({ filename: fname, data }); pushLog({ label: 'Exportiert', total: '✓', detail: fname + ' gespeichert' }); }
  catch (e) { if (e && e.code === 'declined') return; openModal('export', data); }
}
function fileName(ch) { return (ch.name || 'held').replace(/^Beispiel:\s*/, '').replace(/[^\wäöüÄÖÜss -]/g, '').trim().replace(/\s+/g, '_') + '_Heldenbuch.json'; }
function importJson(text) {
  let d; try { d = JSON.parse(text); } catch (e) { throw new Error('Kein gültiger Heldentext (JSON fehlerhaft).'); }
  const list = Array.isArray(d.chars) ? d.chars : (d && d.id && d.cls ? [d] : []);
  if (!list.length) throw new Error('Im Text wurde kein Held gefunden.');
  const errs = []; list.forEach((c, i) => { const e = validateChar(c); if (e.length) errs.push((c && c.name ? '„' + c.name + '“' : 'Held ' + (i + 1)) + ': ' + e.join(' ')); });
  if (errs.length) throw new Error('Nicht geladen – bestehende Helden bleiben unverändert. ' + errs.join(' | '));
  if (d.hb !== undefined && !Array.isArray(d.hb)) throw new Error('Hausregeln im Text sind ungültig.');
  (d.hb || []).forEach((h) => { S.hb[h.id] = h; persist('h', h.id); });
  let last = null;
  const notes = []; list.forEach((c) => { const n = normChar(JSON.parse(JSON.stringify(c))); notes.push(...cleanRefs(n)); if (typeof n.id !== 'string' || !n.id || S.chars[n.id]) n.id = freshId(); S.chars[n.id] = n; persist('c', n.id); last = n.id; }); if (notes.length) bannerToast('Beim Laden bereinigt', notes.join(' · '));
  S.cur = last; S.view = 'heroes'; S.modal = null; render();
  pushLog({ label: 'Geladen', total: list.length, detail: list.length === 1 ? '„' + list[0].name + '“ ist jetzt in deinen Helden' : 'Helden importiert' });
}
function openModal(kind, data) {
  S.modal = kind; const m = $('#modal');
  if (kind === 'export') m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="Helden exportieren"><h2>Helden exportieren</h2><p class="hint">Der direkte Download ist hier nicht verfügbar. Kopiere den Text und speichere ihn als Datei (z. B. <b>held.json</b>) oder schick ihn dir selbst. Über „Text einfügen“ lädst du ihn später wieder.</p><textarea id="exText" readonly>' + esc(data) + '</textarea><div class="chips"><button class="btn ghost" data-act="closeModal">Schliessen</button><button class="btn" data-act="copyEx">Text kopieren</button></div></div>';
  if (kind === 'import') m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="Helden laden"><h2>Helden aus Text laden</h2><p class="hint">Füge hier den exportierten Heldentext ein.</p><textarea id="imText" placeholder="{ &quot;heldenbuch&quot;: 1, … }"></textarea><p class="hint" id="imErr" hidden></p><div class="chips"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" data-act="doImport">Laden</button></div></div>';
  if (kind === 'export' && typeof backupInfo === 'function') { const bi = backupInfo(); const dl = m.querySelector('.dlg'); if (bi && dl) dl.insertAdjacentHTML('beforeend', '<p class="hint">Automatische Sicherung vor dem letzten Datenformat-Update: ' + bi.n + ' Held(en). <button class="btn sm ghost" data-act="restoreBackup">Als Kopie wiederherstellen</button></p>'); }
  m.hidden = false; const ta = m.querySelector('textarea'); if (ta) ta.focus();
}

/* ---------- Builder ---------- */
const picOf = (kind, k) => (typeof HAS_PIC !== 'undefined' && HAS_PIC[kind].includes(k) ? '<span class="cpic pic-' + kind + '-' + k + '" aria-hidden="true"></span>' : '');
function flavBox(n, t, kind, k) { if (!t) return ''; const pic = kind ? picOf(kind, k).replace('cpic', 'fpic') : ''; return '<div class="flav' + (pic ? ' wpic' : '') + (kind === 'sp' ? ' wide' : '') + '">' + pic + '<p><b>' + esc(n) + '</b> – ' + esc(t.replace(/^✦ /, '')) + '</p></div>'; }
function renderBuild(c) {
  const ch = c.char, hb = S.hb;
  let body = '';
  const st = S.step;
  if (st === 0) {
    body += '<div class="row hname">' + field('Name deines Helden', txt('name', ch.name === 'Neuer Held' ? '' : ch.name, 'z. B. Brakk Eisenfaust', 'autocomplete="off"')) + '</div>';
    body += '<h2>Klasse wählen</h2><div class="cards pics">' + Object.entries(CLASSES).map(([k, C]) =>
      '<button class="card haspic' + (ch.cls === k ? ' on' : '') + '" data-act="setCls" data-arg="' + k + '">' + picOf('cls', k) + '<b>' + C.name + '</b><small>W' + C.hd + ' · ' + C.prim.map((a) => AB_K[a]).join('/') + (C.caster ? ' · Zauber' : '') + '</small><small class="sub">' + (C.subs ? C.subs.length + ' Unterklassen' : C.sub.name) + (C.home ? ' · ✦ Heldenbuch' : '') + '</small>' + ii('cls', k, C.name) + '</button>').join('') + '</div>' + flavBox(c.cls.name, c.cls.flavor, 'cls', ch.cls);
    body += '<div class="row">' + field('Stufe', '<div class="stepper"><button data-act="lvl" data-arg="-1" aria-label="Stufe senken">−</button><b>' + ch.level + '</b><button data-act="lvl" data-arg="1" aria-label="Stufe erhöhen">+</button></div>', 'Übungsbonus ' + sgn(c.pb)) +
      field('Trefferpunkte pro Stufe', sel('hpMode', ch.hpMode, [['avg', 'Durchschnitt (' + (c.hd / 2 + 1) + ')'], ['roll', 'Selbst gewürfelt']])) + '</div>';
    if (ch.hpMode === 'roll' && ch.level > 1) {
      body += '<div class="rolls">' + Array.from({ length: ch.level - 1 }, (_, i) => i + 2).map((l) => field(c.cls.name + ' ' + l + ' (W' + c.hd + ')', num('hpRolls.' + l, ch.hpRolls[l] || '', 'min="1" max="' + c.hd + '"'))).join('') + '</div>';
    }
    if (c.cls.order) body += '<h3 id="a-order">' + c.cls.order.label + '</h3><div class="opts">' + Object.entries(c.cls.order.opts).map(([k, [n, t]]) => '<button class="opt' + (ch.order === k ? ' on' : '') + '" data-act="pick" data-path="order" data-val="' + k + '"><b>' + n + '</b><span>' + t + '</span></button>').join('') + '</div>';
    if (ch.cls === 'dru' && c.lv('dru') >= 3 && c.subOf('dru') === 'land') body += '<h3>Landschaft (Zirkel des Landes)</h3><div class="chips">' + Object.entries(LAND).map(([k, l]) => chip(ch.land === k, l.name, 'data-act="pick" data-path="land" data-val="' + k + '"')).join('') + '</div>';
    body += '<h3>' + c.cls.name + ' bis Stufe ' + ch.level + '</h3><div class="tbl"><table><tbody>' + c.cls.table(ch.level).map(([a, b]) => '<tr><th>' + a + '</th><td>' + b + '</td></tr>').join('') + (c.hasSub ? '<tr><th>Unterklasse</th><td>' + (c.subName || 'noch wählen (' + (c.cls.subs || []).length + ' zur Wahl)') + '</td></tr>' : '<tr><th>Unterklasse</th><td>ab Stufe 3' + (c.cls.subs ? ' (' + c.cls.subs.length + ' zur Wahl)' : ': ' + c.cls.sub.name) + '</td></tr>') + '</tbody></table></div>';
    if (c.cls.subs && ch.level >= 3) body += '<h3 id="a-sub">Unterklasse</h3><div class="opts">' + c.cls.subs.map((sb) => '<button class="opt' + (ch.sub === sb.id ? ' on' : '') + '" data-act="pick" data-path="sub" data-val="' + sb.id + '"><b>' + sb.name + '</b><span>' + esc(sb.desc || (sb.feats[0][1] + ': ' + sb.feats[0][2])) + '</span>' + (sb.desc ? '<small class="ofeat">Ab Stufe 3: ' + esc(sb.feats.filter((f) => f[0] <= 3).map((f) => f[1]).join(', ')) + '</small>' : '') + ii('sub', ch.cls + '/' + sb.id, sb.name) + '</button>').join('') + '</div>';
    body += featList(c.features.filter((f) => f.src === c.cls.name || f.src === c.subName));
    body += mcSection(c);
  }
  if (st === 1) {
    body += '<h2>Spezies</h2><div class="cards pics sp">' + Object.entries(SPECIES).map(([k, s]) => '<button class="card haspic' + (ch.species === k ? ' on' : '') + '" data-act="setSpecies" data-arg="' + k + '">' + picOf('sp', k) + '<b>' + s.name + '</b><small>' + s.size + ' · ' + fmtM(s.speed) + (s.dv ? ' · Dunkelsicht' : '') + '</small>' + ii('sp', k, s.name) + '</button>').join('') + '</div>' + flavBox(SPECIES[ch.species] && SPECIES[ch.species].name, SPECIES[ch.species] && SPECIES[ch.species].flavor, 'sp', ch.species);
    const sp = c.sp;
    if (sp.choice) body += '<h3>' + sp.choice.label + '</h3><div class="chips">' + Object.entries(sp.choice.opts).map(([k, l]) => chip(ch.speciesChoice === k, l, 'data-act="pick" data-path="speciesChoice" data-val="' + k + '"')).join('') + '</div>';
    if (sp.skillPick) body += '<h3 id="a-spskill">Fertigkeit (' + sp.name + ')</h3><div class="chips">' + sp.skillPick.map((s) => chipI(ch.speciesSkill === s, SKILLS[s][0], 'data-act="pick" data-path="speciesSkill" data-val="' + s + '"', false, 'sk', s, SKILLS[s][0])).join('') + '</div>';
    if (sp.spellAbility) body += '<div class="row">' + field('Zauberattribut für Spezies-Zauber', sel('speciesSpellAbility', ch.speciesSpellAbility, abOpts(['int', 'wis', 'cha']))) + '</div>';
    if (sp.bonusFeat) body += '<div class="row">' + field('Herkunftstalent (Vielseitig)', sel('humanFeat', ch.humanFeat, featOptions('origin', hb))) + '</div>' + (featById(ch.humanFeat, hb) ? '<p class="hint">' + esc(featById(ch.humanFeat, hb).text) + '</p>' : '') + miPicker(c, 'human');
    body += featList(c.features.filter((f) => f.src === sp.name));
    body += '<h2>Hintergrund</h2><div class="cards">' + Object.entries(BACKGROUNDS).map(([k, b]) => '<button class="card' + (ch.bg === k ? ' on' : '') + '" data-act="setBg" data-arg="' + k + '"><b>' + b.name + '</b><small>' + (b.abil ? b.abil.map((a) => AB_K[a]).join(', ') + ' · ' + FEATS[b.feat].name : 'Selbst zusammenstellen') + '</small>' + ii('bg', k, b.name) + '</button>').join('') + '</div>' + flavBox(bgOf(ch).name, (BACKGROUNDS[ch.bg] || {}).flavor);
    if (ch.bg === 'custom') {
      const bc = ch.bgCustom;
      body += '<div class="box"><div class="row">' + field('Name', txt('bgCustom.name', bc.name, 'z. B. Schmied')) + field('Herkunftstalent', sel('bgCustom.feat', bc.feat, featOptions('origin', hb))) + '</div>' +
        '<h4>Drei Attribute</h4><div class="chips">' + AB.map((a) => chip(bc.abil.includes(a), AB_DE[a], 'data-act="toggle" data-path="bgCustom.abil" data-val="' + a + '" data-max="3"', bc.abil.length >= 3)).join('') + '</div>' +
        '<h4>Zwei Fertigkeiten</h4><div class="chips">' + ALL_SKILLS.map((s) => chipI(bc.skills.includes(s), SKILLS[s][0], 'data-act="toggle" data-path="bgCustom.skills" data-val="' + s + '" data-max="2"', bc.skills.length >= 2, 'sk', s, SKILLS[s][0])).join('') + '</div></div>';
    }
    const bg = c.bg;
    body += '<h3 id="a-bgplus">Attributsboni aus „' + esc(bg.name) + '“</h3><div class="chips">' + chip(ch.bgMode === '21', '+2 und +1', 'data-act="bgMode" data-arg="21"') + chip(ch.bgMode === '111', '+1 / +1 / +1', 'data-act="bgMode" data-arg="111"') + '</div>';
    body += '<div class="bgplus">' + (bg.abil || []).map((a) => '<div class="bp"><span>' + AB_DE[a] + '</span><div class="chips">' + (ch.bgMode === '21' ? [0, 1, 2] : [0, 1]).map((v) => chip((+ch.bgPlus[a] || 0) === v, v ? '+' + v : '0', 'data-act="bgPlus" data-path="' + a + '" data-val="' + v + '"')).join('') + '</div></div>').join('') + '</div>';
    if (ch.bg !== 'custom' && featById(bg.feat, hb)) body += '<div class="row">' + field('Herkunftstalent', sel('bgFeat', ch.bgFeat || bg.feat, featOptions('origin', hb))) + '</div><p class="hint">' + esc(featById(ch.bgFeat || bg.feat, hb).text) + ' <em>(Laut Regeln gehört „' + esc(FEATS[BACKGROUNDS[ch.bg].feat].name) + '“ zu ' + esc(bg.name) + ' – ein anderes Talent zu wählen ist eine Hausregel.)</em></p>';
    body += '<p class="hint">Fertigkeiten: ' + (bg.skills || []).map((s) => SKILLS[s][0]).join(', ') + (bg.tool ? ' · Werkzeug: ' + bg.tool : '') + (bg.equip ? '<br>Ausrüstung: ' + bg.equip : '') + '</p>';
    body += miPicker(c, 'bg');
  }
  if (st === 2) {
    body += '<h2>Attributswerte</h2><div class="chips">' + [['standard', 'Standardwerte'], ['pointbuy', 'Punktekauf (27)'], ['manual', 'Gewürfelt / frei']].map(([k, l]) => chip(ch.method === k, l, 'data-act="method" data-arg="' + k + '"')).join('') + '</div>';
    if (ch.method === 'pointbuy') body += '<p class="hint">Punkte: <b>' + (c.pointsUsed ?? 0) + '</b> / 27 · Werte 8–15, 14 kostet 7, 15 kostet 9.</p>';
    if (ch.method === 'standard') body += '<p class="hint">Verteile 15, 14, 13, 12, 10 und 8. Für ' + c.cls.name + ' zuerst ' + c.cls.prim.map((a) => AB_DE[a]).join(' und ') + '.</p>';
    body += '<div class="abgrid" id="a-abil">' + AB.map((a) => {
      let inp;
      if (ch.method === 'standard') inp = sel('base.' + a, ch.base[a], [15, 14, 13, 12, 10, 8].map((v) => [v, v]), 'data-type="num"');
      else if (ch.method === 'pointbuy') inp = '<div class="stepper"><button data-act="pb" data-path="' + a + '" data-arg="-1" aria-label="weniger">−</button><b>' + ch.base[a] + '</b><button data-act="pb" data-path="' + a + '" data-arg="1" aria-label="mehr">+</button></div>';
      else inp = num('base.' + a, ch.base[a], 'min="1" max="20"');
      return '<div class="abbox' + (c.cls.prim.includes(a) ? ' prim' : '') + '"><span class="abn">' + AB_DE[a] + '</span>' + inp + '<div class="abres"><b>' + c.abil[a] + '</b><span>' + sgn(c.mod[a]) + '</span></div><small>' + c.breakdown[a].slice(1).join(' · ') + '</small></div>';
    }).join('') + '</div>';
    const lvls = c.asiSlots;
    if (lvls.length) {
      body += '<h3>Attributswerterhöhungen & Talente</h3>';
      body += lvls.map((slot) => { const lv = slot.key;
        const a = ch.asi[lv] || {}; const fid = a.feat || (slot.al === 19 ? '' : 'asi'); const f = featById(fid, hb);
        let pl = '';
        if (f && f.asi) pl = '<div class="asiplus">' + AB.map((k) => '<div class="bp"><span>' + AB_K[k] + '</span><div class="chips">' + [0, 1, 2].map((v) => chip((+(a.plus || {})[k] || 0) === v, v ? '+' + v : '0', 'data-act="asiPlus" data-arg="' + lv + '" data-path="' + k + '" data-val="' + v + '"')).join('') + '</div></div>').join('') + '</div>';
        else if (f && f.plus) pl = '<div class="chips">' + f.plus.map((k) => chip((a.plus || {})[k], AB_DE[k] + ' +1', 'data-act="asiOne" data-arg="' + lv + '" data-path="' + k + '"')).join('') + '</div>';
        if (f && f.saveChoice) pl += '<h4>Rettungswurf mit Übung</h4><div class="chips">' + f.saveChoice.map((k) => chip(a.save === k, AB_DE[k], 'data-act="asiSave" data-arg="' + lv + '" data-path="' + k + '"', c.cls.saves.includes(k))).join('') + '</div>';
        return '<div class="box" id="a-asi-' + lv + '"><div class="row">' + field(slot.label + (slot.al === 19 ? ' (Epische Gabe)' : ''), sel('asi.' + lv + '.feat', fid, (slot.al === 19 ? [['', '— wählen —']] : []).concat(featOptions('asi', hb, { fightingStyle: c.styleN }, slot.al)))) + '</div>' + (f ? '<p class="hint">' + esc(f.text) + '</p>' : '') + pl + (f && f.mi ? miPicker(c, 'asi' + lv) : '') + '</div>';
      }).join('');
    }
  }
  if (st === 3) {
    const C = c.cls;
    body += '<h2 id="a-skills">Fertigkeiten</h2><p class="hint">' + C.name + ': wähle ' + C.skillN + '. Vom Hintergrund: ' + (c.bg.skills || []).map((s) => SKILLS[s][0]).join(', ') + '.</p><div class="chips">' +
      C.skills.map((s) => { const fromBg = (c.bg.skills || []).includes(s); return chipI(ch.classSkills.includes(s), SKILLS[s][0] + (fromBg ? ' (Hintergrund)' : ''), 'data-act="toggle" data-path="classSkills" data-val="' + s + '" data-max="' + C.skillN + '"', ch.classSkills.length >= C.skillN || fromBg, 'sk', s, SKILLS[s][0]); }).join('') + '</div>';
    if (c.extraN) body += '<h3 id="a-extra">Zusätzliche Fertigkeiten (' + c.extraN + ')</h3><p class="hint">' + c.extraSrc.join(', ') + '</p><div class="chips">' + ALL_SKILLS.map((s) => chipI(ch.extraSkills.includes(s), SKILLS[s][0], 'data-act="toggle" data-path="extraSkills" data-val="' + s + '" data-max="' + c.extraN + '"', ch.extraSkills.length >= c.extraN, 'sk', s, SKILLS[s][0])).join('') + '</div>';
    if (c.expN) body += '<h3 id="a-exp">Expertise (' + c.expN + ')</h3><div class="chips">' + ALL_SKILLS.filter((s) => c.skills[s].prof && (!c.expFrom || c.expFrom.includes(s))).map((s) => chipI(ch.expertise.includes(s), SKILLS[s][0], 'data-act="toggle" data-path="expertise" data-val="' + s + '" data-max="' + c.expN + '"', ch.expertise.filter((x) => c.skills[x].prof).length >= c.expN, 'sk', s, SKILLS[s][0])).join('') + '</div>';
    body += '<div class="skillgrid">' + ALL_SKILLS.map((s) => '<div class="sk' + (c.skills[s].prof ? ' p' + c.skills[s].prof : '') + '"><span>' + SKILLS[s][0] + ' <small>' + AB_K[SKILLS[s][1]] + '</small></span><b>' + sgn(c.skills[s].val) + '</b></div>').join('') + '</div>';
    const styleN = c.styleN;
    if (styleN) {
      body += '<h3 id="a-style">Kampfstil (' + styleN + ')</h3><div class="opts">' + featOptions('style', S.hb).map(([id, n]) => { const f = featById(id, S.hb); return '<button class="opt' + (ch.styles.includes(id) ? ' on' : '') + '" data-act="toggle" data-path="styles" data-val="' + id + '" data-max="' + styleN + '"><b>' + esc(n.replace('Kampfstil: ', '')) + '</b><span>' + esc(f.text) + '</span></button>'; }).join('') + '</div>';
    }
    if (c.lv('wlk')) {
      body += '<h3 id="a-inv">Schauerliche Anrufungen (' + c.invN + ')</h3><div class="opts">' + Object.entries(INVOCATIONS).map(([k, [n, t, lv]]) => (c.lv('wlk') >= lv || ch.invocations.includes(k)) ? '<button class="opt' + (ch.invocations.includes(k) ? ' on' : '') + '" data-act="toggle" data-path="invocations" data-val="' + k + '" data-max="' + c.invN + '"><b>' + n + '</b><span>' + t + '</span></button>' : '').join('') + '</div>';
      if ((ch.invocations || []).includes('lessons')) body += '<div class="row">' + field('Herkunftstalent (Lehren der Ersten)', sel('lessonsFeat', ch.lessonsFeat || '', [['', '— wählen —']].concat(featOptions('origin', hb)))) + '</div>' + (featById(ch.lessonsFeat, hb) ? '<p class="hint">' + esc(featById(ch.lessonsFeat, hb).text) + '</p>' : '') + miPicker(c, 'lessons');
    }
    (c.optSets || []).forEach((o) => { body += '<h3 id="a-opt-' + o.key + '">' + o.label + ' <span class="cnt">' + o.chosen.length + ' / ' + o.n + '</span></h3><div class="opts">' + o.items.map((it) => { if ((o.granted || []).includes(it.k)) return '<button class="opt on" disabled title="Durch deine Unterklasse bekannt"><b>' + esc(it.name) + ' <small>Unterklasse</small></b><span>' + esc(it.text) + '</span></button>'; const on = o.chosen.includes(it.k); const locked = it.min > o.lvl; return '<button class="opt' + (on ? ' on' : '') + '"' + (locked && !on ? ' disabled' : '') + ' data-act="toggle" data-path="' + o.path + '" data-val="' + it.k + '" data-max="' + o.n + '"><b>' + esc(it.name) + (it.min > 1 ? ' <small>ab Stufe ' + it.min + '</small>' : '') + '</b><span>' + esc(it.text) + '</span></button>'; }).join('') + '</div>'; });
    body += '<h3>Talente</h3>' + featList(c.features.filter((f) => f.feat));
  }
  if (st === 4) {
    const sc = c.spell;
    if (!sc.has && !c.extraSpells.length) body += '<h2>Zauber</h2><p class="empty">' + c.classLabel + ' wirkt keine Zauber' + (ch.cls === 'fig' || ch.cls === 'rog' ? '' : '') + '. Zauber aus Spezies oder Talenten erscheinen hier automatisch.</p>';
    if (sc.has) {
      body += '<h2>Zauber</h2><p class="hint">' + (sc.slots.length ? 'Zauberplätze: ' + sc.slots.map((n, i) => 'Grad ' + (i + 1) + ': ' + n).join(' · ') : '') + (sc.slots.length && sc.pact ? ' · ' : '') + (sc.pact ? 'Paktplätze: ' + sc.pact.n + '× Grad ' + sc.pact.lvl : '') + (sc.classes.length > 1 ? '<br>Mit Multiclassing werden die Zauberplätze gemeinsam berechnet; vorbereiten kannst du pro Klasse nur Zauber bis zu dem Grad, den die Klasse allein erreichen würde.' : '') + '</p>';
      sc.classes.forEach((info, ix) => {
        const chosenC = getP(ch, info.path + 'cantrips') || []; const chosenP = getP(ch, info.path + 'spells') || [];
        body += (sc.classes.length > 1 ? '<h3 class="clsh">' + info.name + '</h3>' : '') + '<div class="stats3"><div><span>Zauber-SG</span><b>' + info.dc + '</b></div><div><span>Zauberangriff</span><b>' + sgn(info.atk) + '</b></div><div><span>Attribut</span><b>' + AB_K[info.ability] + '</b></div><div><span>Bis Grad</span><b>' + info.maxLvl + '</b></div></div>';
        if (info.always.length) body += '<h4>Immer vorbereitet</h4><div class="chips">' + info.always.map((id) => '<span class="tag wi">' + esc(spellName(id)) + ii('sp1', id, spellName(id)) + '</span>').join('') + '</div>';
        if (info.cantripN) body += '<h3' + (ix === 0 ? ' id="a-cantrips"' : '') + '>Zaubertricks <span class="cnt">' + info.cantrips.length + ' / ' + info.cantripN + '</span></h3>' + spellPicker(info.list.filter((x) => x.lvl === 0), chosenC, info.path + 'cantrips', info.cantripN, info.always);
        body += '<h3' + (ix === 0 ? ' id="a-prep"' : '') + '>Vorbereitete Zauber <span class="cnt">' + info.prepared.length + ' / ' + info.prepN + '</span></h3>';
        body += spellPicker(info.list.filter((x) => x.lvl > 0 && x.lvl <= info.maxLvl), chosenP, info.path + 'spells', info.prepN, info.always);
        if (info.id === 'wiz') { const bookMax = Math.max(0, 6 + 2 * (c.lv('wiz') - 1) - info.prepared.length); const bk = getP(ch, info.path + 'book') || []; body += '<h3>Weitere Rituale im Zauberbuch <span class="cnt">' + bk.length + ' / ' + bookMax + '</span></h3><p class="hint">Rituale aus deinem Zauberbuch darfst du wirken, ohne sie vorzubereiten (Ritualkundiger). Vorbereitete Zauber stehen ohnehin im Buch.</p>' + spellPicker(info.list.filter((x) => x.lvl > 0 && x.lvl <= info.maxLvl && x.ritual && !chosenP.includes(x.id)), bk, info.path + 'book', bookMax, []); }
        if (info.arcanum && info.arcanum.length) { const arc = getP(ch, info.path + 'arcanum') || {}; body += '<h3>Mystisches Arkanum</h3><div class="row">' + info.arcanum.map((g) => field('Grad ' + g, sel(info.path + 'arcanum.' + g, arc[g] || '', [['', '— wählen —']].concat(info.list.filter((x) => x.lvl === g).map((x) => [x.id, x.name]))))).join('') + '</div>'; }
      });
    }
    if (c.extraSpells.length) body += '<h3>Weitere Zauber</h3><ul class="plain">' + c.extraSpells.map((e) => '<li><b>' + esc(spellName(e.id)) + '</b>' + ii('sp1', e.id, spellName(e.id)) + ' · ' + esc(e.src) + ' · SG ' + e.dc + ', Angriff ' + sgn(e.atk) + ' (' + AB_K[e.ab] + ')</li>').join('') + '</ul>';
  }
  if (st === 5) {
    const armorOpts = Object.entries(ARMOR).map(([k, a]) => [k, a.name + (a.ac ? ' (RK ' + a.ac + (a.type === 'light' ? ' + GES' : a.type === 'medium' ? ' + GES max 2' : '') + ')' : '')]);
    body += '<h2 id="a-armor">Rüstung</h2><div class="row">' + field('Rüstung', sel('armor', ch.armor, armorOpts)) + field('Magiebonus Rüstung', num('armorBonus', ch.armorBonus, 'min="0" max="3"')) + '</div>';
    body += '<div class="chips">' + chip(ch.shield, 'Schild (+2)', 'data-act="flip" data-path="shield"') + (ch.shield ? '' : '') + chip(ch.mageArmor, 'Magierrüstung aktiv', 'data-act="flip" data-path="mageArmor"') + '</div>' + (ch.shield ? '<div class="row">' + field('Magiebonus Schild', num('shieldBonus', ch.shieldBonus, 'min="0" max="3"')) + '</div>' : '');
    body += '<p class="calc">RK <b>' + c.ac + '</b> = ' + c.acParts.join(' + ') + '</p>';
    body += '<h2 id="a-weapons">Waffen</h2><div class="row">' + field('Waffe hinzufügen', '<select id="addW"><option value="">— Waffe wählen —</option><optgroup label="Einfache Waffen">' + Object.entries(WEAPONS).filter(([, w]) => w[1] === 's').map(([k, w]) => '<option value="' + k + '">' + w[0] + ' (' + w[3] + ')</option>').join('') + '</optgroup><optgroup label="Kriegswaffen">' + Object.entries(WEAPONS).filter(([, w]) => w[1] === 'm').map(([k, w]) => '<option value="' + k + '">' + w[0] + ' (' + w[3] + ')</option>').join('') + '</optgroup></select>') + '</div>';
    if (c.masteryN) body += '<p class="hint">Waffenmeisterschaften: ' + ch.weapons.filter((w) => w.mastery).length + ' / ' + c.masteryN + '</p>';
    body += '<div class="wlist">' + ch.weapons.map((w, i) => { const W = WEAPONS[w.w]; if (!W) return ''; const a = c.attacks.find((x) => x.idx === i);
      return '<div class="wrow"><div class="wn"><b>' + W[0] + ii('w', w.w, W[0]) + '</b><small>' + a.props + '</small></div><div class="wv">' + sgn(a.atk) + ' · ' + a.dmg + (a.dmg2 ? ' / ' + a.dmg2 : '') + ' ' + a.dtype + '</div>' +
        field('Bonus', num('weapons.' + i + '.bonus', w.bonus || 0, 'min="0" max="3"')) + field('Attribut', sel('weapons.' + i + '.ab', w.ab || 'auto', [['auto', 'Automatisch'], ['str', 'STÄ'], ['dex', 'GES'], ['cha', 'CHA'], ['wis', 'WEI'], ['int', 'INT']])) +
        (c.masteryN ? chip(w.mastery, 'Meisterschaft: ' + MASTERY[W[6]][0], 'data-act="flip" data-path="weapons.' + i + '.mastery" title="' + esc(MASTERY[W[6]][1]) + '"') : '') +
        '<button class="x" data-act="rmW" data-arg="' + i + '" aria-label="Entfernen">×</button></div>'; }).join('') + '</div>';
    body += '<h2>Hausregeln & Gegenstände</h2>';
    const hbs = Object.values(S.hb).filter((h) => h.kind !== 'spell');
    body += hbs.length ? '<div class="opts">' + hbs.map((h) => '<button class="opt' + (ch.homebrew.includes(h.id) ? ' on' : '') + '" data-act="toggle" data-path="homebrew" data-val="' + h.id + '"><b>' + esc(h.name) + '</b><span>' + esc({ feature: 'Merkmal', item: 'Gegenstand', feat: 'Talent' }[h.kind] || '') + bonusText(h) + '</span></button>').join('') + '</div>' : '<p class="empty">Noch keine Hausregeln. Lege unter „Hausregeln“ eigene Merkmale oder Gegenstände an (z. B. deine Äthermaschine) und hake sie hier an.</p>';
    body += '<h3>Sonstige Boni</h3><div class="row misc">' + [['ac', 'RK'], ['save', 'Rettungswürfe'], ['dc', 'Zauber-SG'], ['atk', 'Angriff'], ['init', 'Initiative'], ['hp', 'TP-Maximum'], ['speed', 'Bewegung (m)']].map(([k, l]) => field(l, num('misc.' + k, ch.misc[k] || 0))).join('') + '</div>';
    body += gearBlock(c, true);
  }
  if (st === 6) {
    body += '<h2>Abschluss</h2><p class="hint">Gib deinem Helden einen Namen und eine Geschichte. Danach kannst du ihn sichern und losspielen.</p><div class="row">' + field('Name', txt('name', ch.name === 'Neuer Held' ? '' : ch.name, 'z. B. Brakk Eisenfaust', 'autocomplete="off"')) + field('Spieler', txt('player', ch.player)) + '</div><h3>Porträt</h3>' + portraitPicker(ch) + (typeof diceRow === 'function' ? '<h3>Würfel-Set</h3>' + diceRow(ch) : '') + '<div class="row">' + field('Gesinnung', txt('alignment', ch.alignment, 'z. B. Neutral gut')) + field('Sprachen', txt('languages', ch.languages)) + '</div>' +
      field('Aussehen & Persönlichkeit', area('appearance', ch.appearance, 'Aussehen, Ideale, Bindungen, Makel …')) + field('Notizen', area('notes', ch.notes, 'Hintergrundgeschichte, Kampagnennotizen …', 6));
    body += '<div class="finish"><h3>' + (c.warn.length ? 'Fast geschafft' : 'Dein Held ist bereit') + '</h3><p class="hint" style="margin:0">' + (c.warn.length ? 'Es sind noch ' + c.warn.length + ' Auswahl(en) offen (rechts antippen). Du kannst trotzdem schon sichern.' : 'Sichere ihn als Datei, damit du ihn jederzeit wieder laden oder weitergeben kannst.') + '</p><div class="chips"><button class="btn big" data-act="exportOne" data-arg="' + ch.id + '">Helden exportieren</button><button class="btn big ghost" data-act="view" data-arg="sheet">Zum Charakterbogen</button></div></div>';
  }
  const nav = '<div class="stepnav">' + (st > 0 ? '<button class="btn ghost" data-act="step" data-arg="' + (st - 1) + '">← ' + STEPS[st - 1] + '</button>' : '<span></span>') + (st < STEPS.length - 1 ? '<button class="btn" data-act="step" data-arg="' + (st + 1) + '">' + STEPS[st + 1] + ' →</button>' : '<button class="btn" data-act="view" data-arg="sheet">Losspielen →</button>') + '</div>';
  return '<div class="build"><ol class="steps">' + STEPS.map((s, i) => '<li><button class="' + (i === st ? 'on' : '') + '" data-act="step" data-arg="' + i + '"><span>' + (i + 1) + '</span>' + s + '</button></li>').join('') + '</ol><section class="panel">' + body + nav + '</section>' + summary(c) + '</div>';
}
function bonusText(h) { const b = []; if (+h.ac) b.push('RK ' + sgn(+h.ac)); if (+h.save) b.push('RW ' + sgn(+h.save)); if (+h.atk) b.push('Zauberangriff ' + sgn(+h.atk)); if (+h.dc) b.push('SG ' + sgn(+h.dc)); if (+h.hpPerLevel) b.push('+' + h.hpPerLevel + ' TP/Stufe'); if (+h.init) b.push('Init ' + sgn(+h.init)); if (+h.speed) b.push('+' + h.speed + ' m'); if (+h.uses) b.push(h.uses + '× pro ' + RESET_DE[h.reset || 'long']); return b.length ? ' · ' + b.join(', ') : ''; }
function miPicker(c, slot) {
  const x = c.feats.find((f) => (f.slot === 'asi' ? 'asi' + f.lv : f.slot) === slot && f.f.mi); if (!x) return '';
  const ch = c.char; const m = ch.mi[slot] || {}; const list = spellList(x.f.mi, S.hb); const nC = x.f.miC || 2;
  return '<div class="box" id="a-mi-' + slot + '"><h4>' + esc(x.f.name) + '</h4><div class="row">' + field('Zauberattribut', sel('mi.' + slot + '.ability', m.ability || 'wis', abOpts(['int', 'wis', 'cha']))) + (x.f.miSpell === false ? '' : field('Grad-1-Zauber', sel('mi.' + slot + '.spell', m.spell || '', [['', '— wählen —']].concat(list.filter((s) => s.lvl === 1).map((s) => [s.id, s.name]))))) + '</div>' +
    '<h4>' + nC + ' Zaubertrick' + (nC > 1 ? 's' : '') + '</h4><div class="chips">' + list.filter((s) => s.lvl === 0).map((s) => chipI((m.cantrips || []).includes(s.id), s.name, 'data-act="toggle" data-path="mi.' + slot + '.cantrips" data-val="' + s.id + '" data-max="' + nC + '"', (m.cantrips || []).length >= nC, 'sp1', s.id, s.name)).join('') + '</div></div>';
}
function spellPicker(list, chosen, path, max, always) {
  const by = {}; list.forEach((s) => (by[s.lvl] = by[s.lvl] || []).push(s));
  const full = chosen.filter((id) => !always.includes(id)).length >= max;
  return Object.entries(by).map(([lv, arr]) => (lv > 0 ? '<h4>Grad ' + lv + '</h4>' : '') + '<div class="chips">' + arr.map((s) => always.includes(s.id) ? '' : chipI(chosen.includes(s.id), esc(s.name) + (s.conc ? ' <i>K</i>' : '') + (s.ritual ? ' <i>R</i>' : ''), 'data-act="toggle" data-path="' + path + '" data-val="' + s.id + '"', full, 'sp1', s.id, s.name)).join('') + '</div>').join('');
}
function featList(fl) {
  if (!fl.length) return '';
  return '<div class="feats">' + fl.map((f) => '<details><summary><b>' + esc(f.n) + '</b><small>' + (f.lv ? 'Stufe ' + f.lv + ' · ' : '') + esc(f.src) + '</small></summary><p>' + esc(f.t) + '</p></details>').join('') + '</div>';
}
function summary(c) {
  return '<aside class="summary' + (S.sumOpen ? ' open' : '') + '" aria-label="Live-Werte"><div class="shd">' + sigil(c.char) + '<div><h3>' + esc(c.char.name) + '</h3><p class="sub">' + c.classLabel + (c.hasSub && !c.multi && c.subName ? ' · ' + c.subName : '') + '<br>' + c.sp.name + ' · ' + esc(c.bg.name) + '</p></div><button type="button" class="sumtg" data-act="sumToggle" aria-expanded="' + !!S.sumOpen + '" aria-label="Alle Werte ein- oder ausblenden">▾</button></div>' +
    '<p class="smini">RK <b>' + c.ac + '</b> · TP <b>' + c.hpMax + '</b> · Init <b>' + sgn(c.init) + '</b>' + (c.spell.has ? ' · SG <b>' + c.spell.dc + '</b>' : '') + '</p>' +
    '<div class="sgrid"><div><span>RK</span><b>' + c.ac + '</b></div><div><span>TP</span><b>' + c.hpMax + '</b></div><div><span>Initiative</span><b>' + sgn(c.init) + '</b></div><div><span>Bewegung</span><b>' + fmtM(c.speed) + '</b></div><div><span>Übungsbonus</span><b>' + sgn(c.pb) + '</b></div>' + (c.spell.has ? '<div><span>Zauber-SG</span><b>' + c.spell.dc + '</b></div>' : '<div><span>Passive Wahrn.</span><b>' + c.passive + '</b></div>') + '</div>' +
    '<div class="abmini">' + AB.map((a) => '<div><span>' + AB_K[a] + '</span><b>' + c.abil[a] + '</b><small>' + sgn(c.mod[a]) + '</small></div>').join('') + '</div>' +
    (c.warn.length ? '<button type="button" class="swarn" data-act="warnOpen">⚠ ' + c.warn.length + ' noch offen <span>anzeigen</span></button>' : '<p class="ok">✓ Alles ausgewählt.</p>') + '</aside>';
}

function mcSection(c) {
  const ch = c.char; const total = c.level;
  let h = '<h2 id="a-multi" class="mch">Multiclassing <small>Gesamtstufe ' + total + ' / 20</small></h2><p class="hint">Mit Multiclassing nimmst du Stufen in einer weiteren Klasse. Voraussetzung: mindestens 13 im Hauptattribut der bisherigen und der neuen Klasse. Rettungswürfe gibt nur die erste Klasse; von weiteren Klassen bekommst du nur einen Teil der Übungen. Zauberplätze werden gemeinsam berechnet, Paktplätze bleiben getrennt.</p>';
  (ch.multi || []).forEach((m, i) => {
    const C = CLASSES[m.cls]; if (!C) return;
    h += '<div class="box mcbox"><div class="mcrow"><b>' + C.name + '</b><div class="stepper sm"><button data-act="mcLvl" data-arg="' + i + '" data-d="-1" aria-label="Stufe senken">−</button><b>' + m.level + '</b><button data-act="mcLvl" data-arg="' + i + '" data-d="1" aria-label="Stufe erhöhen">+</button></div><span class="hint" style="margin:0">W' + C.hd + (m.level >= 3 ? ' · ' + ((c.classes || []).find((e) => e.id === m.cls) || {}).subName : ' · Unterklasse ab Stufe 3') + '</span><button class="x" data-act="mcDel" data-arg="' + i + '" aria-label="Klasse entfernen">×</button></div>';
    if (C.order) h += '<div class="opts">' + Object.entries(C.order.opts).map(([k, [n, t]]) => '<button class="opt' + (m.order === k ? ' on' : '') + '" data-act="pick" data-path="multi.' + i + '.order" data-val="' + k + '"><b>' + n + '</b><span>' + t + '</span></button>').join('') + '</div>';
    if (m.cls === 'dru' && m.level >= 3 && c.subOf('dru') === 'land') h += '<div class="chips">' + Object.entries(LAND).map(([k, l]) => chip((m.land || 'temperate') === k, l.name, 'data-act="pick" data-path="multi.' + i + '.land" data-val="' + k + '"')).join('') + '</div>';
    const ce = (c.classes || []).find((e) => e.id === m.cls) || {};
    if (C.subs && m.level >= 3) h += '<div class="opts">' + C.subs.map((sb) => '<button class="opt' + (m.sub === sb.id ? ' on' : '') + '" data-act="pick" data-path="multi.' + i + '.sub" data-val="' + sb.id + '"><b>' + sb.name + '</b><span>' + esc(sb.desc || sb.feats[0][1]) + '</span>' + ii('sub', m.cls + '/' + sb.id, sb.name) + '</button>').join('') + '</div>';
    h += featList(c.features.filter((f) => f.src === C.name || f.src === ce.subName));
    h += '</div>';
  });
  const used = [ch.cls].concat((ch.multi || []).map((m) => m.cls));
  if (total < 20) h += '<div class="row">' + field('Weitere Klasse hinzufügen', '<select id="addMc"><option value="">— Klasse wählen —</option>' + Object.entries(CLASSES).filter(([k]) => !used.includes(k)).map(([k, C]) => '<option value="' + k + '">' + C.name + '</option>').join('') + '</select>') + '</div>';
  return h;
}

/* ---------- Charakterbogen ---------- */
function renderSheet(c) {
  const ch = c.char, P = ch.play;
  if (P.hp == null || P.hp > c.hpMax) P.hp = Math.min(P.hp ?? c.hpMax, c.hpMax);
  const hpPct = Math.max(0, Math.min(100, (P.hp / c.hpMax) * 100));
  let h = P.dead ? fallenHtml(ch, c) + '<div class="sheet fallen" aria-hidden="true" inert>' : (mgOf(c) === 'alle' ? '<div class="sheet' + (explainOn() ? ' explain' : '') + '">' : '<div class="sheet' + (explainOn() ? ' explain' : '') + '" data-mg="' + mgOf(c) + '">');
  h += '<header class="shead"><div class="who">' + sigil(ch) + '<div><h1><button type="button" class="hrn" data-act="renameHero" title="Namen ändern">' + esc(ch.name) + '<span aria-hidden="true">✎</span></button></h1><p>' + c.classLabel + (c.hasSub && !c.multi && c.subName ? ' (' + c.subName + ')' : '') + ' · ' + c.sp.name + ' · ' + esc(c.bg.name) + (ch.alignment ? ' · ' + esc(ch.alignment) : '') + '</p></div></div>' +
    '<div class="sctl"><div class="seg" role="group" aria-label="Würfelmodus">' + [['dis', 'Nachteil'], ['normal', 'Normal'], ['adv', 'Vorteil']].map(([k, l]) => '<button class="' + (S.mode === k ? 'on' : '') + '" data-act="mode" data-arg="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<button class="btn ghost" data-act="rest" data-arg="short">Kurze Rast</button><button class="btn ghost" data-act="rest" data-arg="long" data-confirm="Lange Rast: TP, Trefferwürfel, Zauberplätze und alle Ressourcen werden zurückgesetzt.">Lange Rast</button><details class="mnu smore"><summary class="btn ghost" aria-label="Weitere Aktionen" title="Weitere Aktionen">⋯</summary><div class="mnul"><button data-act="exportOne" data-arg="' + ch.id + '">Exportieren</button><button data-act="print">Drucken</button><button data-act="renameHero">Namen ändern</button><button data-act="diceOpen">Würfel-Set</button></div></details></div></header>';
  h += sheetNav(c);
  if (typeof hintBlock === 'function') h += hintBlock(c);
  h += '<div class="vitals">' +
    '<div class="vt ac" title="' + esc(c.acParts.join(' + ')) + '"><span>RK</span><b>' + c.ac + '</b>' + xpl(c.acParts) + '</div>' +
    '<div class="vt hp"><span>Trefferpunkte</span><div class="hpline"><b>' + P.hp + '</b><small>/ ' + c.hpMax + (P.temp ? ' · +' + P.temp + ' temp.' : '') + '</small></div><div class="hpbar"><i style="width:' + hpPct + '%"></i></div>' +
      '<div class="hpctl"><input type="number" id="hpAmt" inputmode="numeric" min="0" placeholder="Wert" aria-label="Betrag"><button class="btn sm dmg" data-act="hp" data-arg="dmg">Schaden</button><button class="btn sm heal" data-act="hp" data-arg="heal">Heilen</button><button class="btn sm ghost" data-act="hp" data-arg="temp">Temp.</button></div></div>' +
    '<button class="vt roll" data-act="d20" data-kind="init" data-mod="' + c.init + '" data-label="Initiative"><span>Initiative' + (c.initAdv ? ' (Vorteil)' : '') + '</span><b>' + sgn(c.init) + '</b>' + xpl(c.initParts) + '</button>' +
    '<div class="vt"><span>Bewegung</span><b>' + fmtM(c.speed) + '</b>' + xpl(c.speedParts) + '</div>' +
    '<div class="vt"><span>Übungsbonus</span><b>' + sgn(c.pb) + '</b></div>' +
    '<div class="vt"><span>Passive Wahrn.</span><b>' + c.passive + '</b></div>' +
    '<div class="vt"><span>Trefferwürfel</span><b>' + (c.level - P.hdUsed) + '<small>/' + c.level + ' ' + c.hdPool.map((x) => 'W' + x.d + (c.hdPool.length > 1 ? '×' + x.n : '')).join(' ') + '</small></b>' + (P.hdUsed < c.level ? '<button class="link" data-act="spendHd">einen ausgeben</button>' : '') + '</div>' +
    '</div>';
  h += xpLine(c);
  if (!P.dead && typeof turnBlock === 'function') h += turnBlock(c);
  if (P.hp <= 0) h += '<div class="death" data-grp="kampf werte zauber faehig gear begleiter notiz"><b>Todesrettungswürfe</b><span>Erfolge</span>' + pips('ds0', 3, P.ds[0]) + '<span>Fehlschläge</span>' + pips('ds1', 3, P.ds[1]) + '<button class="btn sm" data-act="deathRoll">Würfeln</button></div>';
  h += '<div class="srow" data-grp="kampf"><div class="chips">' + chip(P.insp, 'Heldeninspiration', 'data-act="flip" data-path="play.insp"') + (c.lv('bar') ? chip(P.raging, P.raging ? 'Kampfrausch aktiv (+' + c.rageDmg + ' Schaden)' : 'Kampfrausch beginnen', 'data-act="rage"') : '') + fxChips(c) + (P.conc ? '<span class="concchip">Konzentration: <b>' + esc(P.conc.name) + '</b><button class="x" data-act="concEnd" aria-label="Konzentration beenden">×</button></span>' : '') + '</div>' +
    '<label class="exh">Erschöpfung ' + sel('play.exh', P.exh, [0, 1, 2, 3, 4, 5, 6].map((v) => [v, v ? 'Stufe ' + v + ' (−' + 2 * v + ' auf W20)' : 'keine'])) + '</label></div>';
  h += condBlock(P);
  h += '<div class="cols"><div class="col">';
  h += '<section class="blk" data-grp="werte"><h2>Attribute & Rettungswürfe</h2><div class="abil">' + AB.map((a) => '<div class="ab"><button class="abm" data-act="d20" data-kind="check:' + a + '" data-mod="' + c.mod[a] + '" data-label="' + AB_DE[a] + '-Wurf"><span>' + AB_K[a] + '</span><b>' + sgn(c.mod[a]) + '</b><small>' + c.abil[a] + '</small></button><button class="sv' + (c.saves[a].prof ? ' p' : '') + '" data-act="d20" data-kind="save:' + a + '" data-mod="' + c.saves[a].val + '" data-label="' + AB_DE[a] + '-Rettungswurf" title="' + esc(c.saves[a].parts.join(' + ')) + '">RW ' + sgn(c.saves[a].val) + '</button>' + xpl(c.breakdown[a]) + xpl(c.saves[a].parts) + '</div>').join('') + '</div></section>';
  h += '<section class="blk" data-grp="werte"><h2>Fertigkeiten</h2><ul class="skills">' + ALL_SKILLS.map((s) => '<li><button data-act="d20" data-kind="check:' + SKILLS[s][1] + ':' + s + ':' + c.skills[s].prof + '" data-mod="' + c.skills[s].val + '" data-label="' + SKILLS[s][0] + '"><i class="pp p' + c.skills[s].prof + '" aria-label="' + (['ungeübt', 'geübt', 'Expertise'][c.skills[s].prof]) + '"></i><span>' + SKILLS[s][0] + ' <small>' + AB_K[SKILLS[s][1]] + '</small>' + xpl(c.skills[s].parts) + '</span><b>' + sgn(c.skills[s].val) + '</b></button></li>').join('') + '</ul></section>';
  h += '<section class="blk" data-grp="werte"><h2>Übungen</h2><dl class="dl"><dt>Rüstung</dt><dd>' + c.profText.armor + '</dd><dt>Waffen</dt><dd>' + c.profText.weapons + '</dd><dt>Werkzeuge</dt><dd>' + esc(c.profText.tools) + '</dd><dt>Sprachen</dt><dd>' + esc(ch.languages) + '</dd>' + (c.dv ? '<dt>Sinne</dt><dd>Dunkelsicht ' + fmtM(c.dv) + '</dd>' : '') + '</dl></section>';
  h += '</div><div class="col wide">';
  h += '<section class="blk" data-grp="kampf"><h2>Angriffe <small>' + c.attacksPer + ' pro Angriffsaktion' + (c.sneak ? ' · Hinterhältig ' + c.sneak : '') + (c.critRange < 20 ? ' · krit. ab ' + c.critRange : '') + '</small></h2><div class="atks">' + c.attacks.map((a, ai) => {
    const rage = a.rage && P.raging ? c.rageDmg : 0; const dm = (d) => rage ? d + '+' + rage : d;
    return '<div class="atk"><div class="an"><b>' + esc(a.name) + '</b>' + xpl(a.atkParts ? ['Angriff: ' + a.atkParts.join(' + '), 'Schaden: ' + (a.dmgParts || []).join(' + ')] : null) + '<small>' + esc(a.props) + (a.mastery ? ' · <abbr title="' + esc(MASTERY[a.mastery][1]) + '">' + MASTERY[a.mastery][0] + '</abbr>' : '') + '</small></div>' +
      '<button class="rb" data-act="atk" data-arg="' + ai + '">' + sgn(a.atk) + '</button>' +
      '<button class="rb dmgb" data-act="dmg" data-expr="' + esc(dm(a.dmg)) + '" data-label="' + esc(a.name) + ': Schaden">' + esc(dm(a.dmg)) + ' <small>' + a.dtype + '</small></button>' +
      (a.dmg2 ? '<button class="rb dmgb" data-act="dmg" data-expr="' + esc(dm(a.dmg2)) + '" data-label="' + esc(a.name) + ' zweihändig">' + esc(dm(a.dmg2)) + ' <small>2H</small></button>' : '') + '</div>';
  }).join('') + (c.sneak ? '<div class="atk"><div class="an"><b>Hinterhältiger Angriff</b><small>1× pro Zug</small></div><button class="rb dmgb" data-act="dmg" data-expr="' + c.sneak + '" data-label="Hinterhältiger Angriff">' + c.sneak + '</button></div>' : '') + '</div></section>';
  h += slotsMini(c);
  if (c.spell.has || c.extraSpells.length) h += spellBlock(c);
  if (c.res.length) h += '<section class="blk" data-grp="kampf faehig"><h2>Ressourcen' + (c.classDC && c.classDC.length ? ' <small>' + c.classDC.map(([l, v]) => l + ' ' + v).join(' · ') + '</small>' : '') + '</h2><div class="res">' + c.res.map((r) => {
    const used = +P.res[r.k] || 0;
    if (r.pool) return '<div class="rs"><div><b>' + esc(r.n) + '</b><small>' + (r.max - used) + ' von ' + r.max + ' · ' + RESET_DE[r.reset] + '</small></div><div class="pool"><input type="number" id="pool_' + r.k + '" min="1" placeholder="TP" aria-label="Punkte"><button class="btn sm" data-act="pool" data-arg="' + r.k + '" data-max="' + r.max + '">Ausgeben</button></div></div>';
    return '<div class="rs"><div><b>' + esc(r.n) + '</b><small>' + RESET_DE[r.reset] + (r.note ? ' · ' + r.note : '') + '</small></div>' + (r.max > 8 ? '<div class="stepper sm"><button data-act="resUse" data-arg="' + r.k + '" data-max="' + r.max + '" data-d="1" aria-label="verbrauchen">−</button><b>' + (r.max - used) + '/' + r.max + '</b><button data-act="resUse" data-arg="' + r.k + '" data-max="' + r.max + '" data-d="-1" aria-label="zurück">+</button></div>' : pips('res.' + r.k, r.max, used)) + '</div>';
  }).join('') + '</div></section>';
  h += optBlock(c);
  h += compBlock(c);
  h += '<section class="blk" data-grp="faehig"><h2>Merkmale & Talente</h2>' + featList(c.features) + '</section>';
  h += '<section class="blk gear" data-grp="gear">' + gearBlock(c) + '</section>';
  h += '<section class="blk" data-grp="notiz"><h2>Notizen</h2>' + area('notes', ch.notes, 'Notizen, Hintergrund, Kampagne …', 6) + '</section>';
  h += '</div></div><div class="logs" data-grp="notiz kampf">' + (S.camp ? '<section class="blk logblk"><h2>Am Tisch <small>' + esc(S.camp) + '</small></h2><div id="tableBox">' + tableBox(6) + '</div></section>' : '') + '<section class="blk logblk"><h2>Deine Würfe</h2><ul id="log" class="log">' + logHtml() + '</ul></section></div></div>';
  return h;
}
function fxChips(c) {
  const P = c.char.play, fx = P.fx || {}; const out = []; const own = (k) => P.conc && P.fxSrc && P.fxSrc[k] === P.conc.id;
  /* Eigene Zauber wirkst du über die Zauberliste (mit Kosten). Hier nur: Wirkungen von Verbündeten eintragen oder laufende beenden. */
  if (fx.bless && own('bless')) out.push(chip(true, 'Segnen (eigener Zauber) beenden ×', 'data-act="fx" data-arg="bless"'));
  else out.push(chip(fx.bless, fx.bless ? 'Gesegnet (von Verbündeten) ×' : '+ Gesegnet von Verbündeten', 'data-act="fx" data-arg="bless" title="Ein Verbündeter hat Segnen auf dich gewirkt: +1W4 auf Angriffe und Rettungswürfe, 1 Minute. Kostet dich nichts."'));
  if (fx.hm) out.push(chip(true, 'Mal des Jägers beenden ×', 'data-act="fx" data-arg="hm"'));
  if (fx.hex) out.push(chip(true, 'Verhexen beenden ×', 'data-act="fx" data-arg="hex"'));
  if (fx.df) out.push(chip(true, 'Göttliche Gunst beenden ×', 'data-act="fx" data-arg="df"'));
  if (fx.shield) out.push(chip(true, 'Schild (+5 RK) beenden ×', 'data-act="fx" data-arg="shield"'));
  return out.join('');
}
function endConc(P) { if (!P.conc) return; const map = { bless: 'bless', 'hunters-mark': 'hm', hex: 'hex', 'divine-favor': 'df' }; const f = map[P.conc.id]; if (f && P.fx) { delete P.fx[f]; if (P.fxDur) delete P.fxDur[f]; } if (P.fxSrc) for (const [k, v] of Object.entries(P.fxSrc)) if (v === P.conc.id) { if (P.fx) delete P.fx[k]; if (P.fxDur) delete P.fxDur[k]; delete P.fxSrc[k]; } const old = P.conc.id; P.conc = null; P.concEff = null; if (typeof effConcEnd === 'function') effConcEnd(old); }
function condBlock(P) {
  const on = (P.cond || []).filter((k) => COND[k]);
  let h = '<section class="blk conds" id="conds" data-grp="kampf"><h2>Zustände <small>' + (on.length ? on.length + ' aktiv · wirken automatisch auf deine Würfe' : 'keine') + '</small></h2><div class="chips">' +
    on.map((k) => chip(true, COND[k].name + ' ×', 'data-act="cond" data-arg="' + k + '" title="' + esc(COND[k].text) + ' – antippen zum Entfernen"')).join('') +
    '<details class="condpick"' + (S.condOpen ? ' open' : '') + '><summary>+ Zustand</summary><div class="chips">' + Object.entries(COND).filter(([k]) => !on.includes(k)).map(([k, c]) => chip(false, c.name, 'data-act="cond" data-arg="' + k + '" title="' + esc(c.text) + '"')).join('') + '</div></details>' +
    (on.length > 1 ? '<button class="link" data-act="condClear">alle entfernen</button>' : '') + '</div>';
  if (on.length) h += '<details class="condlist"><summary>Was bewirken sie?</summary>' + on.map((k) => '<div class="cd"><b>' + COND[k].name + '</b><p>' + esc(COND[k].text) + '</p>' + (COND[k].auto ? '<small>Automatisch: ' + COND[k].auto + '</small>' : '') + '</div>').join('') + '</details>';
  return h + '</section>';
}
function slotsMini(c) {
  const sc = c.spell, P = c.char.play; if (!sc.has || (!sc.slots.length && !sc.pact)) return '';
  return '<section class="blk slotmini" data-grp="kampf"><h2>Zauberplätze <small>Zauber über die Zugleiste oder die Seite „Zauber“</small></h2><div class="slrow">' +
    sc.slots.map((n, i) => '<div class="sl"><small>Grad ' + (i + 1) + '</small>' + pips('slots.' + (i + 1), n, +P.slots[i + 1] || 0) + '</div>').join('') +
    (sc.pact ? '<div class="sl"><small>Pakt (Grad ' + sc.pact.lvl + ')</small>' + pips('pact', sc.pact.n, +P.pact || 0) + '</div>' : '') + '</div></section>';
}
function pips(path, max, used) { return '<div class="pips">' + Array.from({ length: max }, (_, i) => '<button class="pip' + (i < used ? ' used' : '') + '" data-act="pip" data-path="' + path + '" data-arg="' + (i < used ? i : i + 1) + '" aria-label="' + (i + 1) + '"></button>').join('') + '</div>'; }
function spellBlock(c) {
  const ch = c.char, P = ch.play, sc = c.spell;
  let h = '<section class="blk" id="spellsBlk" data-grp="zauber"><h2>Zauber' + (sc.has ? ' <small>' + sc.classes.map((x) => (sc.classes.length > 1 ? x.name + ' ' : '') + 'SG ' + x.dc + ' · Angriff ' + sgn(x.atk) + ' · ' + AB_K[x.ability]).join(' | ') + '</small>' : '') + '</h2>' + (sc.has ? sc.classes.map((x) => xpl(['SG: ' + x.dcParts.join(' + ')]) + xpl(['Angriff: ' + x.atkParts.join(' + ')])).join('') : '');
  if (sc.has) {
    h += '<div class="slots">';
    sc.slots.forEach((n, i) => { h += '<div class="sl"><span>Grad ' + (i + 1) + '</span>' + pips('slots.' + (i + 1), n, +(P.slots[i + 1] || 0)) + '</div>'; });
    if (sc.pact) h += '<div class="sl"><span>Paktplätze · Grad ' + sc.pact.lvl + '</span>' + pips('pact', sc.pact.n, +P.pact || 0) + '</div>';
    h += '<button class="btn sm ghost" data-act="d20" data-kind="attack:spell" data-mod="' + sc.atk + '" data-label="Zauberangriff">Zauberangriff würfeln</button></div>';
  }
  const seen = new Set(); const all = [];
  for (const info of sc.classes || []) { const t = sc.classes.length > 1 ? info.name : ''; info.always.forEach((id) => { if (!seen.has(id)) { seen.add(id); all.push({ id, s: getSpell(id, S.hb), tag: (t ? t + ' · ' : '') + 'immer' }); } }); info.cantrips.concat(info.prepared).forEach((id) => { if (!seen.has(id)) { seen.add(id); all.push({ id, s: getSpell(id, S.hb), tag: t }); } }); }
  c.extraSpells.forEach((e) => { if (!seen.has(e.id)) { seen.add(e.id); all.push({ id: e.id, s: getSpell(e.id, S.hb), tag: e.src + ' · SG ' + e.dc, extra: true }); } });
  for (let k = all.length - 1; k >= 0; k--) if (!all[k].s) all.splice(k, 1);
  all.sort((a, b) => a.s.lvl - b.s.lvl || a.s.name.localeCompare(b.s.name, 'de'));
  let lv = -1;
  h += '<div class="splist">';
  for (const x of all) {
    if (x.s.lvl !== lv) { lv = x.s.lvl; h += '<h4>' + (lv ? 'Grad ' + lv : 'Zaubertricks') + '</h4>'; }
    h += castCard(x, c);
  }
  if (c.lv('wiz') && typeof spellBookOf === 'function') { const bk = [...spellBookOf(ch, c)].filter((id) => !seen.has(id)).map((id) => getSpell(id, S.hb)).filter((x) => x && x.ritual).sort((a, b) => a.lvl - b.lvl); if (bk.length) { h += '<h4>Rituale aus dem Zauberbuch</h4>'; bk.forEach((s2) => { h += castCard({ id: s2.id, s: s2, tag: 'Zauberbuch · nur als Ritual', ritualOnly: true }, c); }); } }
  if (!all.length) h += '<p class="empty">Noch keine Zauber gewählt. <button class="link" data-act="gostep" data-arg="4">Zauber auswählen</button></p>';
  return h + '</div></section>';
}
/* ---------- Zauber wirken ---------- */
function slotLevels(c, s) {
  const sc = c.spell, P = c.char.play; if (!sc.has || !s.lvl) return [];
  const out = []; for (let g = s.lvl; g <= sc.slots.length; g++) if ((+P.slots[g] || 0) < sc.slots[g - 1]) out.push(g); return out;
}
function pactAvail(c, s) { const sc = c.spell, P = c.char.play; return sc.pact && s.lvl && s.lvl <= sc.pact.lvl && (+P.pact || 0) < sc.pact.n ? sc.pact.lvl : 0; }
function spellCtx(c, id) { const ex = c.extraSpells.find((e) => e.id === id) ; const info = c.spell.byId && c.spell.byId[id]; if (info) return { mod: info.mod, dc: info.dc, atk: info.atk, ability: info.ability, cls: info.id }; if (ex) return { mod: c.mod[ex.ab], dc: ex.dc, atk: ex.atk, ability: ex.ab, cls: null, extra: true }; return { mod: c.spell.mod || 0, dc: c.spell.dc, atk: c.spell.atk, ability: c.spell.ability, cls: null }; }
function freeRes(c, s) { return c.res.find((r) => r.k === 'sp_' + s.id) || (() => { const P = c.char.play; const l = c.res.filter((r) => r.k.startsWith('mi_') && r.n.startsWith(s.name + ' ')); return l.find((r) => (+P.res[r.k] || 0) < r.max) || l[0]; })() || (s.id === 'divine-smite' && c.res.find((r) => r.k === 'smite')) || (s.id === 'find-steed' && c.res.find((r) => r.k === 'steed')) || (s.id === 'hunters-mark' && c.res.find((r) => r.k === 'fe')) || null; }
const HEAL_SPELLS = new Set(['cure-wounds', 'healing-word', 'mass-cure-wounds', 'mass-healing-word', 'prayer-of-healing', 'heal', 'regenerate', 'aura-of-vitality']);
/* Strukturierte Schadenswerte für Zauber mit mehreren Schadensanteilen (statt Textauswertung) */
const SPELL_DMG = {
  'ice-storm': (L) => (2 + Math.max(0, L - 4)) + 'W10+4W6',
  'flame-strike': (L) => (5 + Math.max(0, L - 5)) + 'W6+' + (5 + Math.max(0, L - 5)) + 'W6',
  'meteor-swarm': () => '20W6+20W6',
  'ice-knife': () => '1W10',
  'toll-the-dead': (L, c) => (c.level >= 17 ? 4 : c.level >= 11 ? 3 : c.level >= 5 ? 2 : 1) + 'W8',
  'summon-beast': (L) => '1W8+' + (4 + L), 'summon-fey': (L) => '2W6+' + (3 + L), 'summon-undead': (L) => '1W8+' + (3 + L), 'summon-aberration': (L) => '1W8+' + (3 + L), 'summon-construct': (L) => '1W8+' + (4 + L), 'summon-elemental': (L) => '1W10+' + (4 + L), 'summon-celestial': (L) => '2W6+' + (2 + L), 'summon-fiend': (L) => '1W12+' + (3 + L)
};
function spellDice(s, lvl, c, abMod, opt) {
  if (SPELL_DMG[s.id]) return SPELL_DMG[s.id](lvl || s.lvl, c, abMod);
  if (s.id === 'shillelagh') return c.level >= 17 ? '2W6' : '1W' + (c.level >= 11 ? 12 : c.level >= 5 ? 10 : 8);
  if (s.id === 'true-strike') return c.level >= 5 ? (c.level >= 17 ? 3 : c.level >= 11 ? 2 : 1) + 'W6' : null;
  if (s.id === 'false-life') return '2W4' + sgn(4 + 5 * Math.max(0, lvl - 1));
  const e = typeof SPELL_DATA !== 'undefined' ? SPELL_DATA[s.id] : null;
  if (!e) return String(s.id).startsWith('hb:') ? spellDiceText(s, lvl, c, abMod, opt) : null;
  let n = e.n; if (e.up && lvl > s.lvl) n += e.up * (lvl - s.lvl);
  if (e.cant) n *= c.level >= 17 ? 4 : c.level >= 11 ? 3 : c.level >= 5 ? 2 : 1;
  const bonus = e.mod ? abMod : (e.flat || 0);
  const healer = c.lv('cle') >= 3 && c.subOf('cle') === 'life' && s.lvl > 0 && HEAL_SPELLS.has(s.id) && !(opt && opt.noSlot) ? 2 + lvl : 0;
  return n + 'W' + e.s + (bonus + healer ? sgn(bonus + healer) : '');
}
/* Nur noch für eigene Hausregel-Zauber: Würfel aus dem eigenen Beschreibungstext */
function spellDiceText(s, lvl, c, abMod, opt) {
  const m = /(\d+)W(\d+)(\s*\+\s*Zaubermod|\s*\+\s*(\d+))?/.exec(s.text); if (!m) return null;
  let n = +m[1]; const d = +m[2];
  const up = /\+(\d+)W(\d+) pro höherem Grad/.exec(s.text);
  if (up && +up[2] === d && lvl > s.lvl) n += +up[1] * (lvl - s.lvl);
  if (s.lvl === 0 && /Skaliert|Steigt auf/.test(s.text)) n *= c.level >= 17 ? 4 : c.level >= 11 ? 3 : c.level >= 5 ? 2 : 1;
  let bonus = 0; if (m[3] && /Zaubermod/.test(m[3])) bonus = abMod; else if (m[4]) bonus = +m[4];
  const healer = c.lv('cle') >= 3 && c.subOf('cle') === 'life' && s.lvl > 0 && HEAL_SPELLS.has(s.id) && !(opt && opt.noSlot) ? 2 + lvl : 0;
  return n + 'W' + d + (bonus + healer ? sgn(bonus + healer) : '');
}
function castCard(x, c) {
  const s = x.s, P = c.char.play, sc = c.spell;
  const isExtra = !!x.extra || !!x.ritualOnly;
  const ex = isExtra ? c.extraSpells.find((e) => e.id === s.id) : null;
  const lv = isExtra ? [] : slotLevels(c, s); const pa = isExtra ? 0 : pactAvail(c, s); const ctx = spellCtx(c, s.id); const preferPact = pa && (ctx.cls === 'wlk' || !lv.length);
  const fr = s.lvl > 0 ? freeRes(c, s) : null; const frLeft = fr ? fr.max - (+P.res[fr.k] || 0) : 0;
  let btns = '';
  if (x.ritualOnly) btns = '<button class="btn sm ghost" data-act="castSp" data-id="' + s.id + '" data-lvl="' + s.lvl + '" data-mode="ritual" title="Dauert 10 Minuten länger, verbraucht keinen Platz">Als Ritual wirken</button>';
  else if (s.lvl === 0) btns = '<button class="btn sm cast" data-act="castSp" data-id="' + s.id + '" data-lvl="0">Wirken</button>';
  else {
    if (fr && frLeft > 0) btns += '<button class="btn sm cast" data-act="castSp" data-id="' + s.id + '" data-lvl="' + s.lvl + '" data-mode="free" data-res="' + fr.k + '">Gratis wirken</button>';
    if (preferPact) btns += '<button class="btn sm ' + (fr && frLeft > 0 ? 'ghost ' : '') + 'cast" data-act="castSp" data-id="' + s.id + '" data-lvl="' + pa + '" data-mode="pact">Wirken · Paktplatz' + (pa > s.lvl ? ' (als Grad ' + pa + ')' : '') + '</button>';
    else if (lv.length) btns += '<button class="btn sm ' + (fr && frLeft > 0 ? 'ghost ' : '') + 'cast" data-act="castSp" data-id="' + s.id + '" data-lvl="' + lv[0] + '">Wirken · Grad ' + lv[0] + '</button>';
    if (!btns && !isExtra) btns = '<span class="noslot">kein Platz frei</span>';
    if (s.ritual && !isExtra && sc.has) btns += '<button class="btn sm ghost" data-act="castSp" data-id="' + s.id + '" data-lvl="' + s.lvl + '" data-mode="ritual" title="Dauert 10 Minuten länger, verbraucht keinen Platz">Ritual</button>';
  }
  const abMod = ctx.mod;
  const dice = spellDice(s, s.lvl, c, abMod);
  const upOpts = (preferPact ? lv : lv.slice(1)).map((g) => ['slot', g]).concat(pa && !preferPact ? [['pact', pa]] : []);
  const isConc = P.conc && P.conc.id === s.id;
  return '<details class="spell' + (isConc ? ' concon' : '') + '"><summary><b>' + esc(s.name) + '</b>' + (s.conc ? '<i title="Konzentration">K</i>' : '') + (s.ritual ? '<i title="Ritual">R</i>' : '') + (s.matCost ? '<i class="gm" title="' + esc(s.mat) + '">GM</i>' : '') + (x.tag ? '<em>' + esc(x.tag) + '</em>' : '') + (isConc ? '<em class="cc">aktiv</em>' : '') + '<small>' + esc(s.time) + ' · ' + esc(s.range) + '</small><span class="castbtns">' + btns + '</span></summary>' +
    '<div class="sbody">' + (typeof SPELL_FLAV !== 'undefined' && SPELL_FLAV[s.id] ? '<p class="sflav">' + esc(SPELL_FLAV[s.id]) + '</p>' : '') + '<p class="meta">' + (s.lvl ? 'Grad ' + s.lvl : 'Zaubertrick') + ', ' + SCHOOL[s.school] + ' · ' + esc(s.comp) + ' · ' + esc(s.dur) + (s.conc ? ' (Konzentration)' : '') + ' · <span lang="en">' + esc(s.en) + '</span></p><p>' + esc(s.text) + '</p>' + (s.mat ? '<p class="mat' + (s.matCost ? ' cost' : '') + '"><b>Material:</b> ' + esc(s.mat) + (s.matUsed ? ' <span class="used">wird verbraucht</span>' : '') + (s.matCost ? '' : ' <small>(oder Zauberfokus / Komponentenbeutel)</small>') + '</p>' : '') +
    (upOpts.length ? '<div class="chips upc"><span>Anders wirken:</span>' + upOpts.map(([m, g]) => '<button class="btn sm ghost" data-act="castSp" data-id="' + s.id + '" data-lvl="' + g + '"' + (m === 'pact' ? ' data-mode="pact"' : '') + '>' + (m === 'pact' ? 'Paktplatz (Grad ' + g + ')' : 'Grad ' + g) + (spellDice(s, g, c, abMod) && spellDice(s, g, c, abMod) !== dice ? ' · ' + spellDice(s, g, c, abMod) : '') + '</button>').join('') + '</div>' : '') +
    (dice ? '<div class="chips"><button class="btn sm ghost" data-act="dmg" data-expr="' + esc(dice) + '" data-label="' + esc(s.name) + '">Nur würfeln: ' + esc(dice) + '</button></div>' : '') + '</div></details>';
}
const NO_ROLL = new Set(['shield', 'conjure-minor-elementals', 'bless', 'bane', 'guidance', 'resistance', 'blade-ward', 'hex', 'hunters-mark', 'divine-favor', 'crusaders-mantle', 'elemental-weapon', 'alter-self', 'enlarge-reduce', 'ray-of-enfeeblement', 'bestow-curse', 'contact-other-plane', 'dream', 'shillelagh', 'symbol', 'glyph-of-warding', 'forbiddance', 'geas', 'faithful-hound', 'giant-insect', 'armor-of-agathys', 'magic-weapon', 'heroism']);
function castSpell(ch, id, lvl, mode, resKey) {
  const c = derive(ch, S.hb); const P = ch.play; const s = getSpell(id, S.hb); if (!s) return;
  if (!spellGate(ch, c, s, lvl, mode)) return;
  let used = ''; let slotUsed = false;
  if (s.lvl > 0 && mode === 'free') { const r = c.res.find((x) => x.k === resKey); if (!r || (+P.res[r.k] || 0) >= r.max) { pushLog({ label: s.name, total: '✗', detail: 'Keine freie Nutzung mehr' }); return; } P.res[r.k] = (+P.res[r.k] || 0) + 1; used = 'gratis (' + r.n + ')'; }
  else if (s.lvl > 0 && mode !== 'ritual') {
    if (mode === 'pact') { if ((+P.pact || 0) >= c.spell.pact.n) { pushLog({ label: s.name, total: '✗', detail: 'Kein Paktplatz frei' }); return; } P.pact = (+P.pact || 0) + 1; lvl = c.spell.pact.lvl; used = 'Paktplatz Grad ' + lvl; slotUsed = true; }
    else { if ((+P.slots[lvl] || 0) >= (c.spell.slots[lvl - 1] || 0)) { pushLog({ label: s.name, total: '✗', detail: 'Kein Platz von Grad ' + lvl + ' frei' }); return; } P.slots[lvl] = (+P.slots[lvl] || 0) + 1; used = 'Platz Grad ' + lvl; slotUsed = true; }
  } else if (mode === 'ritual') used = 'als Ritual';
  if (mode !== 'ritual' && typeof tCountSpell === 'function') tCountSpell(ch, s, lvl, slotUsed);
  let concNote = '';
  if (s.conc) { if (P.conc && P.conc.id !== id) { concNote = ' · Konzentration auf ' + P.conc.name + ' endet'; endConc(P); } P.conc = { id, name: s.name }; }
  if (typeof effAddFromSpell === 'function') effAddFromSpell(ch, s);
  P.fx = P.fx || {}; if (FX_SPELL[id]) fxSet(P, FX_SPELL[id], true, s.conc ? id : null);
  if (FOLLOW[id]) P.fx['fo_' + id + '_L'] = lvl || s.lvl;
  if (RIDERS[FX_SPELL[id]]) P.fx[FX_SPELL[id] + '_L'] = lvl || s.lvl;
  if (id === 'shield') { commit(); pushLog({ label: s.name, total: '+5 RK', detail: (used ? used + ' verbraucht · ' : '') + 'RK +5 bis zum Beginn deines nächsten Zuges, auch gegen den auslösenden Angriff. Magisches Geschoss trifft dich nicht.', share: true }); return; }
  if (id === 'hunters-mark') P.fx.hmTgt = S.tgt || null; if (id === 'hex') P.fx.hexTgt = S.tgt || null;
  if (id === 'produce-flame') { fxSet(P, 'flame', true); pushLog({ label: s.name, total: '✦', detail: 'Eine Flamme in deiner Hand (10 Minuten). Werfen: „Flamme werfen“ in der Zugleiste (Magieaktion, Zauberangriff).', share: true }); commit(); return; }
  if (id === 'true-strike') { const ctxT = spellCtx(c, id); const ws = c.attacks.filter((x) => x.idx !== undefined && x.prof && !x.ws); commit(); if (!ws.length) { pushLog({ label: s.name, total: '✗', detail: 'Keine Waffe mit Übung ausgerüstet.' }); return; } S.tsPend = { ab: ctxT.ability, mod: ctxT.mod }; orbPrompt('<div class="pr"><b>Wahrer Schlag: Waffe wählen</b><p>Angriff und Schaden mit ' + AB_K[ctxT.ability] + ' ' + sgn(ctxT.mod) + '; der Schaden darf gleissend sein.' + (c.level >= 5 ? ' Zusätzlich ' + spellDice(s, 0, c, ctxT.mod) + ' gleissend.' : '') + '</p><div class="chips">' + c.attacks.map((x, i) => (x.idx !== undefined && x.prof && !x.ws ? '<button class="btn sm" data-act="tsGo" data-arg="' + i + '">' + esc(x.name) + '</button>' : '')).join('') + '<button class="btn sm ghost" data-act="mastNo">Abbrechen</button></div></div>'); return; }
  const ctxS = spellCtx(c, id); const ex = ctxS.extra ? c.extraSpells.find((e) => e.id === id) : null;
  const abMod = ctxS.mod;
  const dice = spellDice(s, lvl || s.lvl, c, abMod, { noSlot: s.lvl > 0 && !slotUsed });
  const label = s.name + (s.lvl && lvl > s.lvl ? ' (Grad ' + lvl + ')' : '');
  if (id === 'chromatic-orb') { commit(); return chromaticOrb(ch, lvl || 1, used, concNote); }
  if (NO_ROLL.has(id) || id.startsWith('summon-')) { const svN = /(STÄ|GES|KON|INT|WEI|CHA)-Rettungswurf/.exec(s.text); pushLog({ label, total: '✦', detail: (used ? used + ' verbraucht' : (s.lvl ? 'gewirkt' : 'Zaubertrick')) + concNote + (svN ? ' · ' + svN[1] + '-Rettungswurf gegen SG ' + spellCtx(c, id).dc : '') + (s.matUsed ? ' · Material verbraucht: ' + s.mat : '') + ' · Würfel bei Bedarf über „Nur würfeln“ in der Zauberkarte', share: true }); commit(); return; }
  const L2 = lvl || s.lvl;
  const tailX = (used ? used + ' verbraucht' : (s.lvl ? '' : 'Zaubertrick')) + concNote + (s.matUsed ? ' · Material verbraucht: ' + s.mat : '');
  if (id === 'magic-missile') { const n = 3 + Math.max(0, L2 - 1); const r = rollExpr(n + 'W4+' + n); commit(); pushLog({ label: s.name + ' · ' + n + ' Pfeile', groups: r.groups, total: r.total, detail: r.detail + ' · je Pfeil 1W4+1 Energieschaden, treffen automatisch' + (tailX ? ' · ' + tailX : ''), sides: 4, nat: r.total }); return; }
  const sdat = (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[id]) || null;
  if ((sdat ? !!sdat.atk : /Zauberangriff/.test(s.text)) && id !== 'true-strike') {
    let count = 1, expr = (spellDice(s, L2, c, abMod) || '').replace('−', '-'), note = '';
    if (id === 'eldritch-blast') { count = c.level >= 17 ? 4 : c.level >= 11 ? 3 : c.level >= 5 ? 2 : 1; const ag = (ch.invocations || []).includes('agonizing') ? c.mod.cha : 0; expr = '1W10' + (ag ? (ag > 0 ? '+' : '-') + Math.abs(ag) : ''); if (ag) note = 'Quälender Strahl ' + sgn(ag); }
    if (id === 'scorching-ray') { count = 3 + Math.max(0, L2 - 2); expr = '2W6'; }
    if (id === 'spiritual-weapon') expr = (1 + Math.max(0, L2 - 2)) + 'W8' + (abMod ? (abMod > 0 ? '+' : '-') + Math.abs(abMod) : '');
    if (id === 'ice-knife') rollDmg((2 + Math.max(0, L2 - 1)) + 'W6', 'Eissplitter: Explosion (GES-Rettungswurf SG ' + ctxS.dc + ', Kälte) – trifft auch bei Fehlschlag');
    commit(); return spellAttack(ch, s, count, expr, tailX, note, ctxS.atk);
  }
  const sv = sdat && sdat.save ? [0, AB_K[sdat.save]] : /(STÄ|GES|KON|INT|WEI|CHA)-Rettungswurf/.exec(s.text);
  const saveNote = sv ? ' · Ziele: ' + sv[1] + '-Rettungswurf gegen SG ' + ctxS.dc + (sdat && sdat.half ? ', bei Erfolg halber Schaden' : '') + (sdat && sdat.type ? ' · ' + sdat.type : '') + ' · Rettungswurf und Anwendung: Spielleitung' : '';

  const tail = (used ? used + ' verbraucht' : 'Zaubertrick') + concNote + saveNote + (s.matUsed ? ' · Material verbraucht: ' + s.mat : '');
  if (dice) { const r = rollExpr(dice); const mm = /W(\d+)/.exec(dice); const g = /\[([\d,]+)\]/.exec(r.detail); pushLog({ label, groups: r.groups, total: r.total, detail: r.detail + ' · ' + tail, sides: mm ? +mm[1] : 0, nat: g ? g[1].split(',').reduce((a, b) => a + +b, 0) : r.total }); if (HEAL_SPELLS.has(id)) { commit(); return healPrompt(ch, r.total, s.name, /mass|prayer/.test(id)); } }
  else pushLog({ label, total: '✦', detail: tail, share: true });
  commit();
}
/* Chromatische Kugel: Schritt für Schritt, Sprünge löst der Spieler aus */
function orbPrompt(html) { const p = $('#prompt'); if (!html) { p.hidden = true; p.innerHTML = ''; return; } p.innerHTML = html; p.hidden = false; }
function chromaticOrb(ch, lvl, used, concNote) {
  S.orb = { lvl, n: 3 + Math.max(0, lvl - 1), max: Math.max(1, lvl), i: 0, used, conc: concNote || '' };
  orbAttack();
}
function orbAttack() {
  const o = S.orb; if (!o) return; const c = derive(cur(), S.hb);
  const who = o.i === 0 ? 'Ziel 1' : 'Ziel ' + (o.i + 1) + ' (Sprung ' + o.i + ' von ' + o.max + ')';
  const total = d20(spellCtx(c, 'chromatic-orb').atk, 'Chromatische Kugel · ' + who + ': Angriff', { kind: 'attack', crit: 20 });
  orbPrompt('<div class="pr"><b>Chromatische Kugel · ' + esc(who) + '</b><p>Angriffswurf: <strong>' + esc(total) + '</strong>. Trifft das die RK des Ziels? ' + slTag() + '</p><div class="chips"><button class="btn ghost" data-act="orbMiss">Verfehlt</button><button class="btn" data-act="orbHit">Treffer – Schaden würfeln</button></div></div>');
}
function orbHit() {
  const o = S.orb; if (!o) return;
  const r = rollExpr(o.n + 'W8'); const rolls = r.groups[0].rolls;
  const cnt = {}; rolls.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; });
  const pairs = Object.keys(cnt).filter((v) => cnt[v] > 1).map(Number);
  const left = o.max - o.i;
  const who = o.i === 0 ? 'Ziel 1' : 'Ziel ' + (o.i + 1);
  const tail = (o.i === 0 && o.used ? o.used + ' verbraucht' : '') + (o.i === 0 ? o.conc : '') + (pairs.length ? ' · Pasch (' + pairs.join(', ') + ')' : '');
  pushLog({ label: 'Chromatische Kugel · ' + who + ': Schaden', groups: r.groups, total: r.total, detail: r.detail + (tail ? ' · ' + tail.replace(/^ · /, '') : ''), sides: 8, nat: r.total, pairVals: pairs });
  if (pairs.length && left > 0) {
    orbPrompt('<div class="pr pair"><b>Pasch (' + pairs.join(', ') + ')! Die Kugel kann springen.</b><p>Wähle ein neues Ziel in höchstens 9 m vom letzten Ziel. Jede Kreatur kann nur einmal getroffen werden. Noch ' + left + (left > 1 ? ' Sprünge' : ' Sprung') + ' möglich.</p><div class="chips"><button class="btn ghost" data-act="orbStop">Nicht springen</button><button class="btn" data-act="orbLeap">Ziel gewählt – Angriff würfeln</button></div></div>');
  } else {
    orbPrompt(pairs.length ? '<div class="pr"><b>Pasch – aber keine Sprünge mehr übrig.</b><p>Mit Grad ' + o.lvl + ' ' + (o.max > 1 ? 'sind höchstens ' + o.max + ' Sprünge' : 'ist höchstens 1 Sprung') + ' möglich.</p><div class="chips"><button class="btn" data-act="orbStop">Fertig</button></div></div>' : '');
    if (!pairs.length) S.orb = null;
  }
}
function concCheck(ch, dmg) {
  const P = ch.play; if (!P.conc || dmg <= 0) return;
  const c = derive(ch, S.hb); const dc = Math.min(30, Math.max(10, Math.floor(dmg / 2)));
  const total = d20(c.saves.con.val, 'Konzentration ' + P.conc.name + ' (SG ' + dc + ')', { kind: 'save:con:conc' });
  if (typeof total === 'number' && total < dc) { const nm = P.conc.name; setTimeout(() => bannerToast('Konzentration verloren', nm + ' endet.'), 900); endConc(P); }
  else if (total === null) endConc(P);
}
function spellCard(s, tag, cast) {
  const dice = (s.text.match(/\d+W\d+(?:\s?\+\s?\d+)?/) || [])[0];
  return '<details class="spell"><summary><b>' + esc(s.name) + '</b>' + (s.conc ? '<i title="Konzentration">K</i>' : '') + (s.ritual ? '<i title="Ritual">R</i>' : '') + (s.matCost ? '<i class="gm" title="' + esc(s.mat) + '">GM</i>' : '') + (tag ? '<em>' + esc(tag) + '</em>' : '') + '<small>' + esc(s.time) + ' · ' + esc(s.range) + '</small></summary>' +
    '<div class="sbody">' + (typeof SPELL_FLAV !== 'undefined' && SPELL_FLAV[s.id] ? '<p class="sflav">' + esc(SPELL_FLAV[s.id]) + '</p>' : '') + '<p class="meta">' + (s.lvl ? 'Grad ' + s.lvl : 'Zaubertrick') + ', ' + SCHOOL[s.school] + ' · ' + esc(s.comp) + ' · ' + esc(s.dur) + (s.conc ? ' (Konzentration)' : '') + ' · <span lang="en">' + esc(s.en) + '</span></p><p>' + esc(s.text) + '</p>' + (s.mat ? '<p class="mat' + (s.matCost ? ' cost' : '') + '"><b>Material:</b> ' + esc(s.mat) + (s.matUsed ? ' <span class="used">wird verbraucht</span>' : '') + (s.matCost ? '' : ' <small>(oder Zauberfokus / Komponentenbeutel)</small>') + '</p>' : '') +
    '<div class="chips">' + (cast ? '<button class="btn sm" data-act="cast" data-arg="' + s.lvl + '" data-label="' + esc(s.name) + '">Wirken (Platz verbrauchen)</button>' : '') + (dice ? '<button class="btn sm ghost" data-act="dmg" data-expr="' + esc(dice.replace(/\s/g, '')) + '" data-label="' + esc(s.name) + '">' + esc(dice) + ' würfeln</button>' : '') + '</div></div></details>';
}

/* ---------- Zauber-Nachschlagewerk ---------- */
function renderSpellBook() {
  const f = S.sf; const q = f.q.trim().toLowerCase();
  const list = allSpells(S.hb).filter((s) => (f.lvl === 'all' || s.lvl === +f.lvl) && (f.cls === 'all' || s.classes.includes(f.cls)) && (!q || (s.name + ' ' + s.en + ' ' + s.text).toLowerCase().includes(q)));
  return '<div class="book"><div class="filters"><input type="search" id="sq" value="' + esc(f.q) + '" placeholder="Zauber suchen (deutsch oder englisch) …" aria-label="Suche">' +
    '<select id="sl">' + [['all', 'Alle Grade'], ['0', 'Zaubertricks']].concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => [String(g), 'Grad ' + g])).map(([v, l]) => '<option value="' + v + '"' + (f.lvl === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
    '<select id="sc"><option value="all">Alle Klassen</option>' + Object.entries(CLASSES).filter(([, C]) => C.caster).map(([k, C]) => '<option value="' + k + '"' + (f.cls === k ? ' selected' : '') + '>' + C.name + '</option>').join('') + '</select></div>' +
    '<p class="hint">' + list.length + ' Zauber · Auswahl aus dem SRD 5.2, eigene Zauber über „Hausregeln“.</p><div class="splist">' + list.map((s) => spellCard(s, s.home ? 'Hausregel' : s.classes.map((k) => (CLASSES[k] || {}).name).filter(Boolean).join(', '), false)).join('') + '</div></div>';
}

/* ---------- Hausregeln ---------- */
const HB_KIND = { feature: 'Merkmal / Fähigkeit', item: 'Magischer Gegenstand', feat: 'Talent', spell: 'Zauber' };
function renderHB() {
  const e = S.hbEdit;
  let h = '<div class="hbwrap"><section class="panel"><h2>Hausregeln</h2><p class="hint">Hier trägst du eigene Inhalte ein – z. B. die Äthermaschine deines Paladins, ein Reittier-Merkmal oder Talente aus deinen Büchern in eigenen Worten. Zahlen wie RK oder TP pro Stufe rechnet die App automatisch mit ein, sobald du den Eintrag unter Erstellen → Ausrüstung anhakst. Zauber erscheinen direkt in den Zauberlisten der gewählten Klassen.</p>';
  const list = Object.values(S.hb).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  h += list.length ? '<div class="hblist">' + list.map((x) => '<div class="hbi"><div><b>' + esc(x.name) + '</b><small>' + HB_KIND[x.kind] + (x.kind === 'spell' ? ' · Grad ' + (x.lvl || 0) : bonusText(x)) + '</small></div><button class="btn sm ghost" data-act="hbEdit" data-arg="' + x.id + '">Bearbeiten</button></div>').join('') + '</div>' : '<p class="empty">Noch keine Einträge.</p>';
  h += '<div class="chips">' + Object.entries(HB_KIND).map(([k, l]) => '<button class="btn sm" data-act="hbNew" data-arg="' + k + '">+ ' + l + '</button>').join('') + '</div></section>';
  if (e) {
    const b = 'hbe.';
    h += '<section class="panel"><h2>' + (S.hb[e.id] ? 'Bearbeiten' : 'Neu') + ': ' + HB_KIND[e.kind] + '</h2><div class="row">' + field('Name', txt(b + 'name', e.name, 'z. B. Äthermaschine')) + '</div>' + field('Beschreibung', area(b + 'text', e.text, 'Was macht es? In eigenen Worten.', 4).replace('data-norender', 'data-norender data-hb'));
    if (e.kind === 'spell') {
      h += '<div class="row">' + field('Grad', sel(b + 'lvl', e.lvl || 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => [v, v ? 'Grad ' + v : 'Zaubertrick']), 'data-type="num"')) + field('Schule', sel(b + 'school', e.school || 'evo', Object.entries(SCHOOL))) + field('Zeitaufwand', txt(b + 'time', e.time || 'Aktion')) + field('Reichweite', txt(b + 'range', e.range || '18 m')) + field('Komponenten', txt(b + 'comp', e.comp || 'V, G')) + field('Dauer', txt(b + 'dur', e.dur || 'Sofort')) + '</div>';
      h += '<h4>Klassen</h4><div class="chips">' + Object.entries(CLASSES).filter(([, C]) => C.caster).map(([k, C]) => chip((e.classes || []).includes(k), C.name, 'data-act="hbToggle" data-path="classes" data-val="' + k + '"')).join('') + '</div><div class="chips">' + chip(e.conc, 'Konzentration', 'data-act="hbFlip" data-path="conc"') + chip(e.ritual, 'Ritual', 'data-act="hbFlip" data-path="ritual"') + '</div>';
    } else {
      if (e.kind === 'feat') h += '<div class="row">' + field('Art', sel(b + 'cat', e.cat || 'general', [['origin', 'Herkunftstalent'], ['general', 'Allgemeines Talent']])) + '</div><h4>+1 auf eines dieser Attribute (optional)</h4><div class="chips">' + AB.map((a) => chip((e.plus || []).includes(a), AB_DE[a], 'data-act="hbToggle" data-path="plus" data-val="' + a + '"')).join('') + '</div>';
      h += '<h4>Automatische Boni</h4><div class="row misc">' + [['ac', 'RK'], ['save', 'Rettungswürfe'], ['atk', 'Zauberangriff'], ['dc', 'Zauber-SG'], ['init', 'Initiative'], ['hpPerLevel', 'TP pro Stufe'], ['speed', 'Bewegung (m)']].filter(([k]) => e.kind !== 'feat' || !['save', 'atk', 'dc'].includes(k)).map(([k, l]) => field(l, num(b + k, e[k] || 0))).join('') + '</div>';
      if (e.kind !== 'feat') h += '<div class="row">' + field('Nutzungen (0 = unbegrenzt)', num(b + 'uses', e.uses || 0, 'min="0"')) + field('Zurück bei', sel(b + 'reset', e.reset || 'long', [['long', 'langer Rast'], ['short', 'kurzer Rast']])) + '</div>';
    }
    h += '<div class="stepnav"><span>' + (S.hb[e.id] ? (S.confirm === 'hb' ? '<button class="btn danger" data-act="hbDel">Wirklich löschen</button>' : '<button class="btn ghost" data-act="hbAskDel">Löschen</button>') : '') + '</span><span><button class="btn ghost" data-act="hbCancel">Abbrechen</button> <button class="btn" data-act="hbSave">Speichern</button></span></div></section>';
  }
  return h + (typeof rulesBlock === 'function' ? rulesBlock() : '') + '</div>';
}

/* ---------- Kampagne: gemeinsamer Würfeltisch ---------- */
let campUnsub = null, meTimer = null, meBusy = false, meDirty = false, campJoinedAt = 0; const seen = new Set();
const campSlug = (v) => String(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
function saveCampPref() { try { localStorage.setItem('heldenbuch_camp', JSON.stringify({ code: S.camp, share: S.share, secret: !!S.secret })); } catch (e) {} }
function myRolls() { return S.log.filter((e) => (e.sides || e.share) && !e.preview).slice(0, 30).map((e) => ({ label: e.label, total: e.total, detail: e.detail, crit: !!e.crit, fumble: !!e.fumble, t: e.t, secret: !!e.secret, sides: e.sides || 0, nat: e.nat || 0, dset: e.dset || '' })); }
function meDoc() {
  const ch = cur(); let c = null; try { c = derive(ch, S.hb); } catch (e) {}
  return { char: ch.name.replace(/^Beispiel:\s*/, ''), cls: ch.cls, portrait: ch.portrait || '', pimg: ch.portrait === 'img' ? (ch.portraitImg || '') : '', clsName: c ? (c.multi ? c.classLabel.replace(/ \d+/g, '') : c.cls.name) : '', level: c ? c.level : ch.level, species: c ? c.sp.name : '', hp: ch.play.hp ?? (c ? c.hpMax : 0), hpMax: c ? c.hpMax : 0, temp: ch.play.temp || 0, ac: c ? c.ac : 0,
    cond: (ch.play.cond || []).filter((k) => COND[k]).map((k) => COND[k].name), rolls: S.share ? myRolls() : [], init: S.myInit, dex: c ? c.mod.dex : 0, dead: !!ch.play.dead, deadAt: ch.play.deadAt || 0, deathFinal: !!ch.play.deathFinal, dice: ch.dice || '', diceAt: ch.diceAt || 0, t: Date.now() };
}
function queueMe() { if (!S.camp || !DB || !cur()) return; clearTimeout(meTimer); meTimer = setTimeout(writeMe, 250); }
async function writeMe() {
  if (!S.camp || !DB || !cur()) return;
  if (meBusy) { meDirty = true; return; }
  meBusy = true;
  try { await DB.collection('camp/' + S.camp + '/players').doc(UID).set(meDoc()); if (S.campErr) { S.campErr = ''; paintCamp(); } }
  catch (e) { S.campErr = e && (e.code === 'invalid_argument' || e.code === 'permission_denied') ? 'noaccess' : 'fail'; paintCamp(); }
  meBusy = false; if (meDirty) { meDirty = false; writeMe(); }
}
function shareRoll() { queueMe(); }
function joinCamp(v, silent) {
  const code = campSlug(v); if (!code) return;
  if (isApp() && typeof HB_NOCRYPTO !== 'undefined' && HB_NOCRYPTO) { bannerToast('Online-Tisch nicht verfügbar', 'Ohne sichere Verschlüsselung (WebCrypto) verbindet sich das Heldenbuch nicht. Öffne die App über https oder installiert.'); return; }
  if (campUnsub) { try { campUnsub(); } catch (e) {} campUnsub = null; }
  S.camp = code; S.table = {}; S.campErr = ''; campJoinedAt = Date.now(); seen.clear(); saveCampPref();
  if (!DB) { S.campErr = 'nodb'; if (!silent) render(); return; }
  campUnsub = DB.collection('camp/' + code + '/players').onSnapshot((snap) => {
    const table = {};
    snap.docs.forEach((d) => { const v = d.data(); if (v) table[d.id] = v; });
    setTimeout(() => { if (typeof d3conflict === 'function') try { d3conflict(); } catch (e) {} }, 0);
    for (const [uid, p] of Object.entries(table)) for (const r of p.rolls || []) { const k = uid + ':' + r.t; if (!seen.has(k)) { seen.add(k); if (uid !== UID && r.t > campJoinedAt && (!r.secret || isDM())) miniToast(p, r); } }
    S.table = table; paintCamp();
  }, (e) => { S.campErr = 'fail'; paintCamp(); });
  writeMe(); subCombat(); subMeta();
  if (!silent) render();
}
function leaveCamp() {
  if (campUnsub) { try { campUnsub(); } catch (e) {} campUnsub = null; }
  if (DB && S.camp && UID) DB.collection('camp/' + S.camp + '/players').doc(UID).delete().catch(() => {});
  if (combatUnsub) { try { combatUnsub(); } catch (e) {} combatUnsub = null; }
  if (metaUnsub) { try { metaUnsub(); } catch (e) {} metaUnsub = null; }
  S.meta = { dm: null, mercy: {} }; S.camp = ''; S.table = {}; S.campErr = ''; S.combat = null; S.myInit = null; saveCampPref(); document.body.classList.remove('myturn');
}
function tableRolls() {
  const all = [];
  for (const [uid, p] of Object.entries(S.table)) for (const r of p.rolls || []) if (!r.secret || uid === UID || isDM()) all.push(Object.assign({ uid, who: p.char + (r.secret ? ' (geheim)' : ''), cls: p.cls, portrait: p.portrait, pimg: p.pimg, me: uid === UID }, r));
  return all.sort((a, b) => b.t - a.t);
}
function ago(t) { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 45 ? 'gerade eben' : s < 3600 ? 'vor ' + Math.max(1, Math.round(s / 60)) + ' Min.' : s < 86400 ? 'vor ' + Math.round(s / 3600) + ' Std.' : 'vor ' + Math.round(s / 86400) + ' Tg.'; }
function tableLogHtml(n) {
  const r = tableRolls().slice(0, n || 40);
  if (!r.length) return '<li class="empty">Noch keine Würfe am Tisch. Sobald jemand würfelt, erscheint es hier.</li>';
  return r.map((x) => '<li class="' + (x.me ? 'me' : '') + '">' + sigil({ name: x.who, cls: x.cls, portrait: x.portrait, portraitImg: x.pimg }) + '<div><span><b class="who">' + esc(x.who) + '</b> · ' + esc(x.label) + '</span><small>' + esc(x.detail) + ' · ' + ago(x.t) + '</small></div><b class="tot' + (x.crit ? ' crit' : x.fumble ? ' fum' : '') + '">' + esc(x.total) + '</b></li>').join('');
}
function miniToast(p, r) {
  const m = $('#mini'); if (!m) return;
  const el = document.createElement('div'); el.className = 'mt';
  const md = r.sides && typeof d3ok === 'function' && d3ok(r.sides) && d3fx() !== 'aus' ? '<span class="mdie" style="--dg:' + (D3_SETS[r.dset] || D3_SETS.klassik).glow + '">' + d3svg(r.sides, r.nat || (typeof r.total === 'number' ? r.total : 1), r.dset || 'klassik', { gold: r.crit && r.sides === 20, cracks: r.fumble && r.sides === 20, dead: r.fumble && r.sides === 20, thin: true }) + '</span>' : '';
  el.innerHTML = psig(p) + '<div><small>' + esc(p.char) + ' · ' + esc(r.label) + '</small><b class="' + (r.crit ? 'crit' : r.fumble ? 'fum' : '') + '">' + esc(r.total) + '</b></div>' + md;
  m.prepend(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4500);
  while (m.children.length > 3) m.lastChild.remove();
}
function campStatus() {
  if (isApp()) return appCampStatus();
  if (S.campErr === 'nodb') return '<p class="cstat bad">Der gemeinsame Tisch braucht eine Anmeldung bei Claude. In dieser Ansicht ist das nicht verfügbar – deine Würfe bleiben lokal.</p>';
  if (S.campErr === 'noaccess') return '<p class="cstat bad">Du kannst mitlesen, aber deine Würfe werden nicht geteilt: Dein Zugang erlaubt kein Schreiben. Die Person, der das Heldenbuch gehört, muss dich als <b>Bearbeiter</b> einladen.</p>';
  if (S.campErr === 'fail') return '<p class="cstat bad">Verbindung zum Tisch unterbrochen. Lade die Seite neu, wenn es so bleibt.</p>';
  return '<p class="cstat ok">● Verbunden' + (!S.share ? ' – du würfelst verdeckt' : S.secret ? ' – nur die Spielleitung sieht deine Würfe' : ' – deine Würfe werden geteilt') + '</p>';
}
function partyHtml() {
  const ps = Object.entries(S.table).sort((a, b) => (a[1].char || '').localeCompare(b[1].char || '', 'de'));
  if (!ps.length) return '<p class="empty">Noch niemand am Tisch.</p>';
  return '<div class="party">' + ps.map(([uid, p]) => { const pct = p.hpMax ? Math.max(0, Math.min(100, (p.hp / p.hpMax) * 100)) : 0;
    return '<div class="pm' + (uid === UID ? ' me' : '') + '">' + psig(p) + '<div class="pmb"><b>' + esc(p.char) + (uid === UID ? ' <small>(du)</small>' : '') + '</b><small>' + esc(p.clsName) + ' ' + esc(p.level) + ' · ' + esc(p.species) + '</small>' +
      '<div class="pmhp"><span>TP ' + esc(p.hp) + '/' + esc(p.hpMax) + (p.temp ? ' +' + esc(p.temp) : '') + '</span><span>RK ' + esc(p.ac) + '</span></div><div class="hpbar"><i style="width:' + pct + '%"></i></div>' +
      (p.cond && p.cond.length ? '<div class="pmc">' + p.cond.map((c) => '<span>' + esc(c) + '</span>').join('') + '</div>' : '') +
      (uid === S.meta.dm ? '<div class="pmc dm"><span>Spielleitung</span></div>' : '') +
      (p.dead ? '<div class="pmdead"><b>Gefallen' + (p.deathFinal ? ' – Tod bestätigt' : ' – wartet auf Gnade') + '</b>' + (isDM() ? '<div class="chips"><button class="btn sm" data-act="mercy" data-arg="' + uid + '">Gnade zeigen</button>' + (p.deathFinal ? '' : '<button class="btn sm ghost" data-act="doom" data-arg="' + uid + '">Tod bestätigen</button>') + '</div>' : '') + '</div>' : '') + '</div></div>'; }).join('') + '</div>';
}
function renderCamp() {
  if (!S.camp && isApp()) return appJoinHtml();
  if (!S.camp) {
    return '<div class="campjoin"><div class="hero-intro banner" style="' + bannerStyle('waldlaeufer') + '"><h1>Gemeinsamer Tisch</h1><p>Alle, die derselben Kampagne beitreten, sehen die Würfe der anderen live – und eine Übersicht der Gruppe mit TP, RK und Zuständen.</p></div>' +
      '<section class="panel"><h2>Kampagne beitreten</h2><p class="hint">Gib einen Namen ein, den alle in deiner Gruppe gleich schreiben, z. B. <b>schatten-von-valdris</b>. Wer zuerst beitritt, eröffnet den Tisch.</p><p class="hint">Datenschutz: Die Tischdaten liegen im Speicher dieser geteilten Seite. Wer den Link zur Seite und den Kampagnennamen kennt, kann mitlesen – wähle einen schwer erratbaren Namen (z. B. mit angehängten Zufallszeichen) und schreib nichts Vertrauliches in den Tisch.</p><div class="row"><label class="fld"><span>Kampagnenname</span><input type="text" id="campCode" placeholder="z. B. schatten-von-valdris" autocomplete="off"></label></div><div class="chips"><button class="btn big" data-act="campJoin">Beitreten</button></div>' +
      '<h3>So holst du deine Mitspieler dazu</h3><ol class="steps2"><li>Öffne oben rechts im Heldenbuch das Menü <b>Teilen</b>.</li><li>Lade jeden Mitspieler per E-Mail als <b>Bearbeiter</b> ein. Nur dann dürfen ihre Würfe am Tisch erscheinen.</li><li>Alle öffnen das Heldenbuch, legen ihren Helden an und treten mit demselben Namen bei.</li></ol><p class="hint">Den Link und den Kampagnennamen kannst du danach per WhatsApp verschicken.</p><p class="hint">Jeder sieht nur seine eigenen Helden. Am Tisch geteilt werden nur Name, Klasse, TP, RK, Zustände und die Würfe.</p></section></div>';
  }
  return '<div class="camp"><header class="shead"><div><h1>' + esc(S.camp) + '</h1><div id="campStat">' + campStatus() + '</div><div id="dmBox" class="dmbox">' + dmHtml() + '</div></div><div class="sctl">' + chip(S.share, !S.share ? 'Verdeckt würfeln' : S.secret ? 'Nur Spielleitung sieht Würfe' : 'Würfe teilen: an', 'data-act="campShare" title="Antippen zum Wechseln: alle sehen – nur die Spielleitung sieht – niemand sieht"') + '<button class="btn ghost" data-act="view" data-arg="sheet">Zum Bogen</button><button class="btn ghost" data-act="campLeave">Verlassen</button></div></header>' +
    '<div class="invbar"><span class="hint" style="margin:0">Mitspieler einladen:</span>' + inviteHtml() + '</div>' +
    '<section class="blk fight" id="fightBox">' + fightHtml() + '</section>' + '<div id="dmTools">' + dmTools() + '</div>' +
    '<div class="cols"><section class="blk"><h2>Die Gruppe</h2><div id="partyBox">' + partyHtml() + '</div></section><section class="blk"><h2>Würfe am Tisch</h2><div id="tableBox">' + tableBox(12) + '</div></section></div></div>';
}
function tableBox(n) {
  const all = tableRolls(); const players = Object.entries(S.table).map(([uid, p]) => [uid, p.char]);
  const list = S.logFilter === 'all' ? all : all.filter((r) => r.uid === S.logFilter);
  const shown = S.logOpen ? list : list.slice(0, n);
  let h = '';
  if (S.logOpen && players.length > 1) h += '<div class="chips lf">' + chip(S.logFilter === 'all', 'Alle', 'data-act="logFilter" data-arg="all"') + players.map(([uid, name]) => chip(S.logFilter === uid, esc(name), 'data-act="logFilter" data-arg="' + uid + '"')).join('') + '</div>';
  h += '<ul id="tablelog" class="log tlog' + (S.logOpen ? ' open' : '') + '">' + rollItems(shown) + '</ul>';
  if (list.length > n || S.logOpen) h += '<button class="link more" data-act="logOpen">' + (S.logOpen ? 'Weniger anzeigen' : 'Alle ' + list.length + ' Würfe anzeigen') + '</button>';
  return h;
}
function rollItems(r) {
  if (!r.length) return '<li class="empty">Noch keine Würfe am Tisch. Sobald jemand würfelt, erscheint es hier.</li>';
  return r.map((x) => '<li class="' + (x.me ? 'me' : '') + '">' + sigil({ name: x.who, cls: x.cls, portrait: x.portrait, portraitImg: x.pimg }) + '<div><span><b class="who">' + esc(x.who) + '</b> · ' + esc(x.label) + '</span><small>' + esc(x.detail) + ' · ' + ago(x.t) + '</small></div><b class="tot' + (x.crit ? ' crit' : x.fumble ? ' fum' : '') + '">' + esc(x.total) + '</b></li>').join('');
}
function paintCamp() {
  applyTheme();
  const dmb = $('#dmBox'); if (dmb) dmb.innerHTML = dmHtml();
  const dmt = $('#dmTools'); if (dmt) { const ae = document.activeElement; if (!(ae && dmt.contains(ae) && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT'))) dmt.innerHTML = dmTools(); }
  checkMercy();
  const b = $('#partyBox'); if (b) b.innerHTML = partyHtml();
  const c = $('#campStat'); if (c) c.innerHTML = campStatus();
  const t = $('#tableBox'); if (t) t.innerHTML = tableBox(S.view === 'camp' ? 12 : 6);
  const f = $('#fightBox'); if (f) { const ae = document.activeElement; const typing = ae && f.contains(ae) && ((ae.tagName === 'INPUT' && ae.value) || ae.tagName === 'SELECT'); if (!typing) f.innerHTML = fightHtml(); }
  paintTurn();
  if (typeof effSyncMine === 'function') effSyncMine();
}

/* ---------- Tod, Spielleitung & Gnade ---------- */
let metaUnsub = null;
const metaRef = () => DB.doc('camp/' + S.camp + '/state/meta');
const isDM = () => !!(S.camp && UID && S.meta.dm === UID);
function knockOut(P) { P.cond = (P.cond || []).filter((k) => COND[k]); ['unconscious', 'incapacitated', 'prone'].forEach((x) => { if (!P.cond.includes(x)) P.cond.push(x); }); if (P.conc) endConc(P); P.raging = false; P.rageKeep = false; P.ws = null; P.stable = false; pushLog({ label: '0 Trefferpunkte', total: '0', detail: 'Du bist bewusstlos und liegst am Boden. Ab jetzt: Todesrettungswürfe.' }); }
function wakeUp(P) { P.stable = false; P.cond = (P.cond || []).filter((k) => k !== 'unconscious'); const still = P.cond.some((k) => ['paralyzed', 'petrified', 'stunned'].includes(k)); if (!still) P.cond = P.cond.filter((k) => k !== 'incapacitated'); }
function fall(P) { if (P.dead) return; if (P.conc) endConc(P); P.dead = true; P.deadAt = Date.now(); P.deathFinal = false; setTimeout(() => { render(); window.scrollTo(0, 0); }, 900); }
function subMeta() {
  if (metaUnsub) { try { metaUnsub(); } catch (e) {} metaUnsub = null; }
  if (!DB || !S.camp) return;
  try { metaUnsub = metaRef().onSnapshot((snap) => { const d = snap.exists ? snap.data() : {}; S.meta = Object.assign({ dm: null, mercy: {} }, d); applyMercy(); applyMeta(); paintCamp(); }, () => {}); } catch (e) { metaUnsub = null; }
}
async function saveMeta(patch) {
  const next = Object.assign({}, S.meta, patch); if (next.dm === undefined) next.dm = null; if (!next.mercy) next.mercy = {};
  S.meta = next; paintCamp();
  try { await metaRef().set(next); } catch (e) { S.campErr = 'noaccess'; paintCamp(); }
}
function applyMercy() {
  const ch = cur(); if (!ch || !UID) return; const P = ch.play; const m = S.meta.mercy[UID];
  if (!P.dead || !m || m.deadAt !== P.deadAt || m.applied === P.deadAt) return;
  if (m.d === 'mercy') { P.dead = false; P.deathFinal = false; P.hp = Math.max(1, P.hp || 0); P.ds = [0, 0]; P.cond = (P.cond || []).filter((k) => k !== 'unconscious'); bannerToast('Die Spielleitung zeigt Gnade', ch.name + ' kehrt mit 1 TP zurück.'); }
  if (m.d === 'death') { P.deathFinal = true; bannerToast('Der Tod ist endgültig', ch.name + ' ist gefallen.'); }
  m.applied = P.deadAt; commit();
}
function checkMercy() {
  if (!isDM()) { S.mercyQ = []; return; }
  const q = Object.entries(S.table).filter(([uid, p]) => p.dead && !p.deathFinal && !(S.meta.mercy[uid] && S.meta.mercy[uid].deadAt === p.deadAt)).map(([uid]) => uid);
  S.mercyQ = q;
  const m = $('#modal');
  if (q.length && (m.hidden || S.modal === 'mercy')) {
    const uid = q[0], p = S.table[uid]; S.modal = 'mercy';
    m.innerHTML = '<div class="dlg mercy" role="alertdialog" aria-modal="true" aria-labelledby="mercyT">' + psig(p) + '<h2 id="mercyT">Show mercy?</h2><p><b>' + esc(p.char) + '</b> (' + esc(p.clsName) + ' ' + esc(p.level) + ') hat den dritten Todesrettungswurf verfehlt und ist gefallen.</p><p class="hint">Zeigst du Gnade, kehrt der Held mit 1 TP zurück. Sonst bleibt sein Bogen gesperrt – du kannst ihn später in der Gruppenübersicht trotzdem noch zurückholen.</p><div class="chips"><button class="btn ghost" data-act="doom" data-arg="' + uid + '">Der Tod ist endgültig</button><button class="btn big" data-act="mercy" data-arg="' + uid + '">Gnade zeigen</button></div></div>';
    m.hidden = false;
  } else if (!q.length && S.modal === 'mercy') { m.hidden = true; S.modal = null; }
}
function decide(uid, d) { const p = S.table[uid]; if (!p) return; const mercy = Object.assign({}, S.meta.mercy, { [uid]: { d, deadAt: p.deadAt, t: Date.now() } }); saveMeta({ mercy }); if (S.modal === 'mercy') { $('#modal').hidden = true; S.modal = null; } pushLog({ label: d === 'mercy' ? 'Gnade für ' + p.char : 'Tod von ' + p.char, total: d === 'mercy' ? '✓' : '†', detail: d === 'mercy' ? 'Kehrt mit 1 TP zurück' : 'Der Tod ist endgültig' }); }
function dmHtml() {
  if (!S.camp) return '';
  const dm = S.meta.dm, p = dm && S.table[dm];
  if (isDM()) return '<span class="dmlbl">Du leitest die Runde</span> <button class="link" data-act="dmDrop">abgeben</button>';
  return '<span class="dmlbl">Spielleitung: ' + (dm ? esc(p ? p.char : 'unbekannt') : 'noch niemand') + '</span> <button class="link" data-act="dmTake">' + (dm ? 'übernehmen' : 'Ich leite die Runde') + '</button>';
}
function fallenHtml(ch, c) {
  const P = ch.play; const inCamp = !!S.camp;
  return '<div class="fallencard"><div class="stone">' + sigil(ch) + '<h1>' + esc(ch.name.replace(/^Beispiel:\s*/, '')) + '</h1><p class="ep">' + c.classLabel + ' · ' + c.sp.name + '</p><p class="rip">Gefallen</p>' +
    '<p>' + (P.deathFinal ? 'Die Spielleitung hat entschieden: Der Tod ist endgültig. Nur sie kann deinen Helden noch zurückholen.' : inCamp ? 'Dein Bogen ist gesperrt. Die Spielleitung entscheidet jetzt, ob sie Gnade zeigt.' : 'Dein Bogen ist gesperrt. Nur die Spielleitung darf deinen Helden zurückholen – tritt dazu einer Kampagne bei.') + '</p>' +
    (inCamp ? '<p class="wait">' + (P.deathFinal ? '' : '<span class="pulse"></span> Warte auf die Spielleitung …') + '</p>' : '<details class="dmonly"><summary>Ich bin selbst die Spielleitung</summary><p class="hint">Ohne Kampagne gibt es keine zweite Person, die entscheiden kann. Nur benutzen, wenn du die Runde leitest.</p><button class="btn sm" data-act="selfMercy">Gnade zeigen (1 TP)</button></details>') +
    '<div class="chips"><button class="btn ghost" data-act="view" data-arg="heroes">Anderen Helden wählen</button>' + (inCamp ? '<button class="btn ghost" data-act="view" data-arg="camp">Zur Kampagne</button>' : '') + '</div></div></div>';
}

/* ---------- Kampf & Initiative ---------- */
let combatUnsub = null, wasMyTurn = false;
const combatRef = () => DB.doc('camp/' + S.camp + '/state/combat');
function subCombat() {
  if (combatUnsub) { try { combatUnsub(); } catch (e) {} combatUnsub = null; }
  if (!DB || !S.camp) return;
  try { combatUnsub = combatRef().onSnapshot((snap) => { const prev = S.combat; const d = snap.exists ? snap.data() : null; S.combatRemote = d;
    const pend = S.combatPend; if (pend && d && d.w && d.w !== UID && (+d.rev || 0) <= (+pend.ours.rev || 0) && Date.now() - pend.at < 15000) { S.combatPend = null; const merged = mergeCombat(pend.base, pend.ours, d); if (JSON.stringify(merged) !== JSON.stringify(d)) { S.combat = d; saveCombat(merged); return; } }
    if (pend && Date.now() - pend.at >= 15000) S.combatPend = null;
    S.combat = d; if (typeof hitCheck === 'function') setTimeout(hitCheck, 0);
    if (S.combat && S.combat.active && (!prev || !prev.active || prev.id !== S.combat.id)) { if (!S.myInit || S.myInit.cid !== S.combat.id) bannerToast('Kampf beginnt!', 'Würfelt Initiative.'); }
    paintCamp(); }, () => {}); } catch (e) { combatUnsub = null; }
}
async function saveCombat(c) {
  const base = S.combatRemote || S.combat; c = Object.assign({}, c, { rev: ((base && base.rev) || 0) + 1, w: UID });
  S.combatPend = { base, ours: c, at: Date.now() };
  S.combat = c; paintCamp(); try { await combatRef().set(c); } catch (e) { S.campErr = 'noaccess'; paintCamp(); }
}
function setMyInit(v) { S.myInit = { v: +v, cid: S.combat.id }; queueMe(); setTimeout(paintCamp, 50); }
function order() {
  const c = S.combat; if (!c || !c.active) return [];
  const list = [];
  for (const [uid, p] of Object.entries(S.table)) if (p.init && p.init.cid === c.id && !p.init.away) list.push({ key: 'p:' + uid, name: p.char, cls: p.cls, portrait: p.portrait, pimg: p.pimg, v: +p.init.v, dex: +p.dex || 0, me: uid === UID, hp: p.hp, hpMax: p.hpMax, dead: !!p.dead });
  for (const n of c.npcs || []) if (!n.reserve) list.push({ key: 'n:' + n.id, id: n.id, name: n.name, cls: 'npc', v: +n.v, dex: +n.dex || 0, npc: true, ally: !!n.ally, hp: n.hp, hpMax: n.hpMax, ac: n.ac, mid: n.mid, cond: n.cond || [], note: n.note || '' });
  return list.sort((a, b) => b.v - a.v || b.dex - a.dex || a.name.localeCompare(b.name, 'de'));
}
function waiting() { const c = S.combat; if (!c || !c.active) return []; return Object.entries(S.table).filter(([, p]) => !(p.init && p.init.cid === c.id)).map(([uid, p]) => ({ uid, name: p.char, me: uid === UID })); }
function awayList() { const c = S.combat; if (!c || !c.active) return []; return Object.entries(S.table).filter(([, p]) => p.init && p.init.cid === c.id && p.init.away).map(([uid, p]) => ({ uid, name: p.char, me: uid === UID })); }
const skipTurn = (x) => (x.npc && x.hpMax > 0 && x.hp <= 0) || (!x.npc && x.dead);
const initKey = (x) => [-x.v, -x.dex, x.name];
function initAfter(a, b) { const ka = initKey(a), kb = initKey(b); return ka[0] !== kb[0] ? ka[0] > kb[0] : ka[1] !== kb[1] ? ka[1] > kb[1] : ka[2].localeCompare(kb[2], 'de') > 0; }
function curEntry() { const o = order(); return o.find((x) => x.key === (S.combat && S.combat.turn)) || null; }
function nextTurn() {
  const c = S.combat; const o = order(); if (!o.length) return;
  let i = o.findIndex((x) => x.key === c.turn); let round = c.round || 1;
  if (i < 0 && c.turnAt) { i = -1; for (let k = 0; k < o.length; k++) if (!initAfter(o[k], c.turnAt)) i = k; } /* der Aktuelle wurde entfernt: an seiner Stelle weitermachen */
  else if (i < 0) i = -1;
  let ni = i; for (let tries = 0; tries < o.length; tries++) { ni++; if (ni >= o.length) { ni = 0; round++; } if (!skipTurn(o[ni])) break; } /* besiegte Gegner überspringen */
  if (skipTurn(o[ni])) return;
  const tk = typeof effTick === 'function' ? effTick(c, c.turn, o[ni].key) : { effects: c.effects, rem: c.rem, log: [] };
  let lg = clog(c, 'Runde ' + round + ': ' + o[ni].name + ' ist am Zug'); tk.log.forEach((x) => { lg = clog({ log: lg }, x); });
  saveCombat(Object.assign({}, c, { turn: o[ni].key, turnAt: { v: o[ni].v, dex: o[ni].dex, name: o[ni].name }, round, t: Date.now(), effects: tk.effects || [], rem: tk.rem || [], log: lg }));
}
function clog(c, x) { return ((c && c.log) || []).concat([{ t: Date.now(), x }]).slice(-25); }
function fightHtml() {
  const c = S.combat;
  const lead = !S.meta.dm || isDM();
  if (!c || !c.active) return '<div class="fhead"><div><h2>Kampf</h2><p class="hint" style="margin:0">' + (lead ? 'Starte einen Kampf: Alle würfeln Initiative, die App sortiert die Reihenfolge und zeigt, wer am Zug ist.' : 'Die Spielleitung startet den Kampf. Dann würfelst du hier oder auf dem Bogen deine Initiative.') + '</p></div>' + (lead ? '<button class="btn big" data-act="fightStart">Kampf beginnen</button>' : '') + '</div>';
  const o = order(), w = waiting(), cur = curEntry(); const mine = cur && cur.key === 'p:' + UID;
  let h = '<div class="fhead"><div><h2>Kampf · Runde ' + (c.round || 1) + '</h2><p class="hint" style="margin:0">' + (c.turn ? (cur ? 'Am Zug: <b>' + esc(cur.name) + '</b>' : '') : 'Alle würfeln Initiative (auf dem Bogen oder hier). Dann „Ersten Zug starten“.') + '</p></div><div class="chips">' +
    (!c.turn ? (lead ? '<button class="btn" data-act="fightGo"' + (o.length ? '' : ' disabled') + '>Ersten Zug starten</button>' : '') : mine ? '<button class="btn big glowbtn" data-act="turnEnd">Zug beenden</button>' : lead ? '<button class="btn ghost sm" data-act="turnEnd" title="Für Gegner oder abwesende Spieler">Weiter zum Nächsten</button>' : '') +
    (lead && c.turn ? '<button class="btn ghost sm" data-act="fightReset" data-confirm="Neue Begegnung? Alle würfeln neu Initiative, Runde, Zug und Effekte werden zurückgesetzt. Besiegte Gegner verschwinden, die übrigen bleiben." title="Neuer Kampf mit denselben Teilnehmern – alle würfeln neu Initiative">Neue Begegnung</button>' : '') + (lead ? '<button class="btn ghost sm" data-act="fightEnd" data-confirm="Kampf beenden? Initiative, Gegner und Effekte werden für alle gelöscht.">Kampf beenden</button>' : '') + '</div></div>';
  h += '<ol class="order">' + (o.length ? o.map((x) => '<li class="' + (x.key === c.turn ? 'now' : '') + (x.me ? ' me' : '') + (x.npc ? ' npc' : '') + '"><span class="iv">' + x.v + '</span>' + (x.npc ? '<span class="sigil npc" aria-hidden="true">⚔</span>' : sigil({ name: x.name, cls: x.cls, portrait: x.portrait, portraitImg: x.pimg })) + '<span class="on">' + esc(x.name) + (x.me ? ' <small>(du)</small>' : '') + (x.npc ? ' <small>' + (x.ally ? 'Begleiter' : 'Gegner') + '</small>' : '') + '</span>' + (x.npc ? npcBits(x) : '') + (typeof effBadges === 'function' ? effBadges(x.key, lead) : '') + (x.key === c.turn ? '<span class="tag now">am Zug</span>' : '') + (x.npc && lead ? '<button class="x" data-act="npcDel" data-arg="' + x.key.slice(2) + '" aria-label="Entfernen">×</button>' : '') + '</li>').join('') : '<li class="empty">Noch keine Initiative gewürfelt.</li>') + '</ol>';
  if (c.log && c.log.length) h += '<details class="clog"><summary>Verlauf <small>' + c.log.length + '</small></summary><ul>' + c.log.slice().reverse().slice(0, 12).map((e) => '<li><span>' + new Date(e.t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) + '</span>' + esc(e.x) + '</li>').join('') + '</ul></details>';
  if (w.length) h += '<p class="hint">Würfelt noch: ' + w.map((x) => esc(x.name) + (x.me ? ' (du)' : '')).join(', ') + '</p>';
  if (lead && !c.turn && Object.keys(S.table || {}).length) h += '<div class="fgrp"><b>Überrascht? <small>Nachteil auf den Initiativewurf</small></b><div class="chips">' + Object.entries(S.table).map(([u, p]) => chip((c.surp || []).includes(u), esc(p.char || '?'), 'data-act="surpTog" data-arg="' + u + '"')).join('') + '</div><p class="hint">Gegner überrascht: beim Hinzufügen „überrascht“ ankreuzen.</p></div>';
  const aw = awayList(); if (aw.length) h += '<p class="hint">Noch nicht im Kampf (zu weit weg): ' + aw.map((x) => esc(x.name) + (x.me ? ' (du)' : '')).join(', ') + ' – sie würfeln Initiative, sobald sie eingreifen, und werden einsortiert.</p>';
  if (lead && typeof saveReqForm === 'function') h += saveReqForm();
  const rs = (c.npcs || []).filter((x) => x.reserve); if (rs.length && lead) { const gs = {}; rs.forEach((x) => { const k = x.grp || x.id; (gs[k] = gs[k] || []).push(x); }); h += '<div class="fgrp reserve"><b>Verstärkung (wartet)</b><div class="chips">' + Object.values(gs).map((g) => '<button class="btn sm ghost" data-act="npcJoin" data-arg="' + g[0].id + '"' + (g[0].grp && g.length > 1 ? ' data-grp="' + g[0].grp + '"' : '') + '>' + esc(g.length > 1 ? g.length + '× ' + (BESTIARY[g[0].mid] || [g[0].name])[0] : g[0].name) + ' greift ein</button>').join('') + '</div></div>'; }
  const ch = cur ? null : null; const meIn = !w.some((x) => x.me);
  if (typeof npcBulkBar === 'function') h += npcBulkBar();
  if (o.length) h += '<div class="chips" style="margin:4px 0 10px"><button class="btn ghost sm" data-act="effNew">+ Effekt / Zustand mit Dauer</button>' + (lead && (c.npcs || []).some((x) => x.mid) ? '<button class="btn ghost sm" data-act="encFromFight">Gegner als Begegnung speichern</button>' : '') + '</div>';
  h += '<div class="fctl"><div class="fgrp"><b>Deine Initiative</b><div class="chips"><button class="btn sm" data-act="initRoll">' + (S.myInit && S.myInit.away && S.myInit.cid === c.id ? 'Eingreifen: Initiative würfeln' : meIn ? 'Neu würfeln' : 'Initiative würfeln') + '</button>' + (!(S.myInit && S.myInit.away && S.myInit.cid === c.id) ? '<button class="btn ghost sm" data-act="initAway" title="Dein Held ist noch zu weit weg und greift später ein">Noch nicht dabei</button>' : '') + '<input type="number" id="initMan" placeholder="Wert" aria-label="Eigene Initiative eintragen"><button class="btn ghost sm" data-act="initSet">Eintragen</button></div></div>' +
    (lead ? '<div class="fgrp"><b>Gegner hinzufügen</b><div class="chips"><input type="text" id="npcName" placeholder="z. B. Goblin 1" aria-label="Name"><input type="number" id="npcBonus" placeholder="Bonus" aria-label="Initiativebonus" value="0"><button class="btn ghost sm" data-act="npcAdd">Würfeln & hinzufügen</button></div></div>' + bestiaryAdder() : '') + '</div>';
  return h;
}
function paintTurn() {
  const el = $('#turnbar'); if (!el) return;
  const c = S.combat; if (!S.camp || !c || !c.active) { el.innerHTML = ''; document.body.classList.remove('myturn'); wasMyTurn = false; return; }
  const o = order(), cur = curEntry(); const mine = cur && cur.key === 'p:' + UID;
  let next = null; if (cur) { const i = o.findIndex((x) => x.key === cur.key); next = o[(i + 1) % o.length]; }
  const meWaiting = waiting().some((x) => x.me); const meAway = S.myInit && S.myInit.away && S.myInit.cid === c.id;
  el.innerHTML = '<div class="wrap tb' + (mine ? ' mine' : '') + '"><span class="tbr">Runde ' + (c.round || 1) + '</span>' +
    (mine ? '<b class="tbme">Du bist am Zug!</b>' : cur ? '<span>Am Zug: <b>' + esc(cur.name) + '</b>' + (next ? ' · danach ' + esc(next.name) : '') + '</span>' : '<span>Kampf beginnt – Initiative würfeln</span>') +
    '<span class="tbsp"></span>' + (meAway ? '<span class="tbaway">Du bist noch nicht im Kampf</span><button class="btn sm" data-act="initRoll">Eingreifen</button>' : meWaiting ? '<button class="btn sm" data-act="initRoll">Initiative würfeln</button><button class="btn sm ghost" data-act="initAway">Noch nicht dabei</button>' : '') + (mine ? '<button class="btn sm glowbtn" data-act="turnEnd">Zug beenden</button>' : '') + (S.view !== 'camp' ? '<button class="link" data-act="view" data-arg="camp">Reihenfolge</button>' : '') + '</div>';
  document.body.classList.toggle('myturn', !!mine);
  if (mine && !wasMyTurn && S.chars[S.cur] && typeof turnReset === 'function') { const me = S.chars[S.cur]; setTimeout(() => { turnReset(me); if (S.chars[S.cur] === me) commit(); }, 0); }
  if (mine && !wasMyTurn) { bannerToast('Du bist am Zug!', cur.name + ', Runde ' + (c.round || 1)); try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {} }
  wasMyTurn = !!mine;
}
function bannerToast(title, text) { const m = $('#mini'); if (!m) return; const el = document.createElement('div'); el.className = 'mt big'; el.innerHTML = '<div><b>' + esc(title) + '</b><small>' + esc(text) + '</small></div>'; m.prepend(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 5000); }
setInterval(() => { if (S.camp) paintCamp(); }, 30000);

/* ---------- Hinweis -> Feld ---------- */
function warnTarget(c, w) {
  const m = /^Stufe (\d+):/.exec(w); if (m) return [2, 'a-asi-' + m[1]];
  const mm = /^(.+)-Stufe (\d+):/.exec(w); if (mm) { const e = (c.classes || []).find((x) => x.C.name === mm[1]); if (e) return [2, 'a-asi-' + (e.primary ? '' : e.id) + mm[2]]; }
  if (/^Multiclassing|Gesamtstufe/.test(w)) return [0, 'a-multi'];
  const um = /^Unterklasse wählen \((.+)\)/.exec(w); if (um) return [0, um[1] === c.cls.name ? 'a-sub' : 'a-multi'];
  const om = (c.optSets || []).find((o) => w.startsWith(o.label + ':')); if (om) return [3, 'a-opt-' + om.key];
  if (/^Kampfstil/.test(w)) return [3, 'a-style'];
  if (/^Einstimmung/.test(w)) return [5, 'a-items'];
  if (/^Hintergrund-Boni/.test(w)) return [1, 'a-bgplus'];
  if (/^(Punktekauf|Standardwerte)/.test(w)) return [2, 'a-abil'];
  if (/zusätzliche Fertigkeit/.test(w)) return [3, 'a-extra'];
  if (/^Expertise/.test(w)) return [3, 'a-exp'];
  if (/^Anrufungen/.test(w)) return [3, 'a-inv'];
  if (/Zaubertricks/.test(w)) return [4, 'a-cantrips'];
  if (/vorbereitete Zauber|Vorbereitete Zauber/.test(w)) return [4, 'a-prep'];
  if (/Waffenmeisterschaften/.test(w)) return [5, 'a-weapons'];
  if (/^Keine Übung mit/.test(w)) return Object.values(ARMOR).some((a) => w.includes(a.name)) || /Schild/.test(w) ? [5, 'a-armor'] : [5, 'a-weapons'];
  if (/Ordnung wählen/.test(w)) return [0, 'a-order'];
  if (/: Zauber wählen/.test(w)) { const x = c.feats.find((f) => f.f.mi && w.startsWith(f.f.name)); const slot = x ? (x.slot === 'asi' ? 'asi' + x.lv : x.slot) : 'bg'; return [slot.startsWith('asi') ? 2 : 1, 'a-mi-' + slot]; }
  if (w.startsWith(c.sp.name + ':')) return [1, 'a-spskill'];
  if (/Fertigkeit/.test(w)) return [3, 'a-skills'];
  return [0, null];
}
function goWarn(c, w) {
  if (!w) return;
  const [st, id] = warnTarget(c, w);
  S.view = 'build'; S.step = st; render();
  const el = id && document.getElementById(id);
  if (el) { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  else window.scrollTo(0, 0);
}

/* ---------- Render ---------- */
let rendering = false;
function render() { if (rendering) return; rendering = true; try { render0(); } finally { rendering = false; } if (typeof paintWarn === 'function') { try { paintWarn(); } catch (e) {} } if (S.view === 'sheet' && typeof layoutSheet === 'function') { try { layoutSheet(); } catch (e) {} } if (typeof addHelp === 'function') { try { addHelp(); } catch (e) {} } }
function render0() {
  applyTheme();
  if (!cur()) { let first = false; try { first = !localStorage.getItem('hb_sample_done') && !Object.keys(S.chars).length; } catch (e) {} if (first) { const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; try { localStorage.setItem('hb_sample_done', '1'); } catch (e) {} } else { S.cur = Object.keys(S.chars)[0] || null; } }
  renderTop();
  const v = $('#view'); const y = window.scrollY;
  if (!cur() && (S.view === 'sheet' || S.view === 'build')) { v.innerHTML = noHeroView(); window.scrollTo(0, y); return; }
  const c = cur() ? derive(cur(), S.hb) : null;
  v.innerHTML = S.view === 'camp' ? renderCamp() : S.view === 'heroes' ? renderHeroes() : S.view === 'build' ? renderBuild(c) : S.view === 'spells' ? renderSpellBook() : S.view === 'hb' ? renderHB() : S.view === 'mobs' ? '<div class="camp">' + bestiaryView() + '</div>' : S.view === 'help' ? helpView() : renderSheet(c);
  window.scrollTo(0, y);
}
function commit(rerender = true) { const ch = cur(); if (ch) { ch.updated = Date.now(); persist('c', ch.id); } queueMe(); if (rerender) render(); }
function noHeroView() { return '<div class="camp"><div class="hero-intro banner" style="' + bannerStyle('paladin') + '"><h1>Noch kein Held</h1><p>Du hast im Moment keinen Helden. Erschaffe einen neuen oder lade einen gesicherten Helden.</p><div class="chips"><button class="btn big" data-act="newChar">Neuen Helden erschaffen</button><button class="btn ghost" data-act="loadSample">Beispielheld ansehen</button><button class="btn ghost" data-act="view" data-arg="heroes">Zu den Helden</button></div></div></div>'; }

/* TP ändern (Schaden mit Temp-TP, 0 TP, Todesrettung, Massiver Schaden, Konzentration; Heilung; Temp-TP) */
function hpChange(ch, arg, n, crit) { const c = derive(ch, S.hb); const P = ch.play; if (P.hp == null) P.hp = c.hpMax;
      if (arg === 'dmg') { let d = n; const ab = Math.min(P.temp, d); P.temp -= ab; d -= ab; const before = P.hp;
        if (before <= 0 && d > 0) {
          if (d >= c.hpMax) { pushLog({ label: 'Massiver Schaden', total: '†', detail: d + ' Schaden bei 0 TP ist mindestens so hoch wie dein TP-Maximum – sofortiger Tod.' }); fall(P); }
          else { const wasStable = P.stable; P.stable = false; P.ds[1] = Math.min(3, (P.ds[1] || 0) + (crit ? 2 : 1)); pushLog({ label: 'Schaden bei 0 TP', total: P.ds[1] + '/3', detail: (wasStable ? 'Du bist nicht mehr stabil. ' : '') + (crit ? '2 Fehlschläge (kritischer Treffer).' : '1 Fehlschlag beim Todesrettungswurf. War es ein kritischer Treffer, hake einen zweiten ab.') }); if (P.ds[1] >= 3) fall(P); }
        } else {
          P.hp = Math.max(0, before - d);
          if (P.hp <= 0) { const over = d - before; const relR = c.res.find((r) => r.k === 'rel'); if (over >= c.hpMax) { pushLog({ label: 'Massiver Schaden', total: '†', detail: 'Der Restschaden (' + over + ') ist mindestens so hoch wie dein TP-Maximum – sofortiger Tod.' }); fall(P); } else if (relR && (+P.res.rel || 0) < relR.max) { P.res.rel = (+P.res.rel || 0) + 1; P.hp = 1; pushLog({ label: 'Unerbittliche Ausdauer', total: '1', detail: 'Statt auf 0 fällst du auf 1 TP (1× pro langer Rast).' }); if (P.conc) concCheck(ch, n); } else if (P.raging && c.lv('bar') >= 11) { const dc = 10 + 5 * (+P.relRage || 0); const rr = 1 + Math.floor(rnd() * 20); const tot = rr + c.saves.con.val; P.relRage = (+P.relRage || 0) + 1; if (tot >= dc) { P.hp = 2 * c.lv('bar'); pushLog({ label: 'Unerbittlicher Kampfrausch', total: tot, detail: 'KON-Rettungswurf SG ' + dc + ' geschafft (W20 ' + rr + ' ' + sgn(c.saves.con.val) + '): Du hast ' + P.hp + ' TP.', sides: 20, nat: rr }); } else { pushLog({ label: 'Unerbittlicher Kampfrausch', total: tot, detail: 'KON-Rettungswurf SG ' + dc + ' misslungen.', sides: 20, nat: rr }); knockOut(P); } } else { knockOut(P); } }
          else if (P.conc) concCheck(ch, n);
        } }
      if (arg === 'heal') { if (P.dead) return false; if (P.hp <= 0) { P.ds = [0, 0]; P.stable = false; wakeUp(P); } P.hp = Math.min(c.hpMax, P.hp + n); }
      if (arg === 'temp') P.temp = Math.max(P.temp, n);   commit(); return true; }

/* ---------- Ereignisse ---------- */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act]'); if (!t) return;
  const act = t.dataset.act, arg = t.dataset.arg, path = t.dataset.path, ch = cur();
  const A = {
    view: () => { S.view = arg; S.confirm = null; S.more = false; render(); window.scrollTo(0, 0); },
    step: () => { S.step = +arg; render(); window.scrollTo(0, 0); },
    gowarn: () => { const c = derive(ch, S.hb); if (window.innerWidth < 1100) S.warnOpen = false; goWarn(c, c.warn[+arg]); },
    gostep: () => { S.view = 'build'; S.step = +arg; render(); window.scrollTo(0, 0); },
    newChar: () => { const n = newChar({ name: 'Neuer Held' }); S.chars[n.id] = n; S.cur = n.id; S.view = 'build'; S.step = 0; S.confirm = null; persist('c', n.id); render(); window.scrollTo(0, 0); },
    dupChar: () => { const src = S.chars[arg] || ch; const n = JSON.parse(JSON.stringify(src)); n.id = newChar().id; n.name = n.name.replace(/^Beispiel:\s*/, '') + ' (Kopie)'; n.updated = Date.now(); S.chars[n.id] = n; persist('c', n.id); render(); },
    askDel: () => { S.confirm = 'del:' + arg; render(); },
    noDel: () => { S.confirm = null; render(); },
    delChar: () => { delete S.chars[arg]; persist('c', arg); if (S.cur === arg) S.cur = Object.keys(S.chars)[0] || null; S.confirm = null; try { localStorage.setItem('hb_sample_done', '1'); } catch (e) {} if (!S.cur && (S.view === 'sheet' || S.view === 'build')) S.view = 'heroes'; render(); },
    loadSample: () => { const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); S.view = 'sheet'; render(); },
    play: () => { S.cur = arg; S.view = 'sheet'; S.confirm = null; lsSet(); render(); window.scrollTo(0, 0); },
    edit: () => { S.cur = arg; S.view = 'build'; S.step = 0; S.confirm = null; lsSet(); render(); window.scrollTo(0, 0); },
    exportOne: () => { const c = S.chars[arg] || ch; doExport([c], fileName(c)); },
    exportAll: () => doExport(Object.values(S.chars), 'Alle_Helden_Heldenbuch.json'),
    importText: () => openModal('import'),
    closeModal: () => { S.modal = null; $('#modal').hidden = true; },
    copyEx: async () => { const ta = $('#exText'); try { await navigator.clipboard.writeText(ta.value); t.textContent = 'Kopiert ✓'; } catch (e) { ta.focus(); ta.select(); t.textContent = 'Markiert – jetzt kopieren'; } },
    doImport: () => { try { importJson($('#imText').value); $('#modal').hidden = true; } catch (e) { const er = $('#imErr'); er.hidden = false; er.textContent = 'Das sieht nicht nach einem exportierten Helden aus. Bitte den ganzen Text einfügen.'; } },
    setCls: () => { if (ch.cls !== arg) { ch.multi = (ch.multi || []).filter((m) => m.cls !== arg); ch.sub = ''; ch.opts = []; ch.cls = arg; ch.classSkills = []; ch.expertise = []; ch.order = ''; ch.cantrips = []; ch.spells = []; ch.styles = []; ch.invocations = []; } commit(); },
    setSpecies: () => { if (ch.species !== arg) { ch.species = arg; ch.speciesChoice = SPECIES[arg].choice ? Object.keys(SPECIES[arg].choice.opts)[0] : ''; ch.speciesSkill = ''; } commit(); },
    setBg: () => { ch.bg = arg; ch.bgFeat = ''; const b = bgOf(ch); ch.bgPlus = {}; if (ch.bgMode === '21' && b.abil) { ch.bgPlus[b.abil[0]] = 2; ch.bgPlus[b.abil[2]] = 1; } else (b.abil || []).forEach((a) => (ch.bgPlus[a] = 1)); commit(); },
    bgMode: () => { ch.bgMode = arg; const b = bgOf(ch); ch.bgPlus = {}; if (arg === '111') (b.abil || []).forEach((a) => (ch.bgPlus[a] = 1)); commit(); },
    bgPlus: () => { const v = +t.dataset.val; if (ch.bgMode === '21' && v) for (const k of Object.keys(ch.bgPlus)) if (+ch.bgPlus[k] === v) ch.bgPlus[k] = 0; ch.bgPlus[path] = v; commit(); },
    lvl: () => { const others = (ch.multi || []).reduce((a, m) => a + (+m.level || 0), 0); ch.level = Math.max(1, Math.min(20 - others, ch.level + +arg)); commit(); },
    mcLvl: () => { const m = ch.multi[+arg]; if (!m) return; const others = ch.level + ch.multi.reduce((a, x, i) => a + (i === +arg ? 0 : +x.level || 0), 0); m.level = Math.max(1, Math.min(20 - others, m.level + +t.dataset.d)); commit(); },
    mcDel: () => { ch.multi.splice(+arg, 1); commit(); },
    method: () => { ch.method = arg; if (arg === 'standard') ch.base = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }; if (arg === 'pointbuy') ch.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }; commit(); },
    pb: () => { ch.base[path] = Math.max(8, Math.min(15, ch.base[path] + +arg)); commit(); },
    asiPlus: () => { const a = (ch.asi[arg] = ch.asi[arg] || { feat: 'asi' }); a.plus = a.plus || {}; a.plus[path] = +t.dataset.val; commit(); },
    asiSave: () => { const a = (ch.asi[arg] = ch.asi[arg] || {}); a.save = path; commit(); },
    asiOne: () => { const a = (ch.asi[arg] = ch.asi[arg] || {}); a.plus = { [path]: 1 }; commit(); },
    pick: () => { setP(ch, path, t.dataset.val); commit(); },
    flip: () => { setP(ch, path, !getP(ch, path)); commit(); },
    toggle: () => { let a = getP(ch, path); if (!Array.isArray(a)) { a = []; setP(ch, path, a); } const v = t.dataset.val, i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else { const mx = +t.dataset.max || 99; if (a.length >= mx) a.shift(); a.push(v); } commit(); },
    rmW: () => { ch.weapons.splice(+arg, 1); commit(); },
    mode: () => { S.mode = arg; render(); },
    d20: () => { const c = derive(ch, S.hb); d20(+t.dataset.mod, t.dataset.label, { kind: t.dataset.kind || 'check', crit: c.critRange }); },
    dmg: () => rollDmg(t.dataset.expr, t.dataset.label),
    hp: () => { const n = Math.max(0, +$('#hpAmt').value || 0); if (!n) { $('#hpAmt').focus(); return; } hpChange(ch, arg, n); },
    spendHd: () => { const c = derive(ch, S.hb); if (rule('hdrest') || c.hdPool.length > 1) return shortRestOpen(ch); const pools = hdPools(c, ch.play); const p = pools.find((x) => x.used < x.n); if (p && spendHdDie(ch, p.d)) commit(); },
    deathRoll: () => { const c = derive(ch, S.hb); const P = ch.play; if (P.hp == null) P.hp = c.hpMax; if (P.stable) { pushLog({ label: 'Todesrettungswurf', total: '✓', detail: 'Du bist stabil – keine Todesrettungswürfe mehr, bis du Schaden nimmst.' }); return; } if (P.hp > 0 || P.dead) return; const notes = []; let r = 1 + Math.floor(rnd() * 20);
      if (ch.species === 'halfling' && r === 1) { r = 1 + Math.floor(rnd() * 20); notes.push('Glück: 1 neu gewürfelt'); }
      if (c.lv('fig') >= 18 && c.subOf('fig') === 'champion') { const r2 = 1 + Math.floor(rnd() * 20); notes.push('Überlebender: Vorteil ' + r + '/' + r2 + (Math.max(r, r2) >= 18 ? ', 18–20 zählt als 20' : '')); r = Math.max(r, r2); if (r >= 18) r = 20; }
      const ex = 2 * (+P.exh || 0); const eff = r === 20 || r === 1 ? r : r - ex; if (ex && r !== 20 && r !== 1) notes.push('Erschöpfung −' + ex); let msg = '';
      if (r === 20) { P.hp = 1; P.ds = [0, 0]; P.stable = false; wakeUp(P); msg = 'Natürliche 20: Du kommst mit 1 TP zurück und bist wieder bei Bewusstsein!'; } else if (r === 1) { P.ds[1] = Math.min(3, P.ds[1] + 2); msg = 'Natürliche 1: zwei Fehlschläge'; } else if (eff >= 10) { P.ds[0] = Math.min(3, P.ds[0] + 1); msg = 'Erfolg'; } else { P.ds[1] = Math.min(3, P.ds[1] + 1); msg = 'Fehlschlag'; }
      if (P.ds[0] >= 3 && P.hp <= 0) { msg += ' – stabil (bewusstlos, 0 TP, keine weiteren Würfe)'; P.stable = true; P.ds = [0, 0]; } if (P.ds[1] >= 3) { msg += ' – gefallen'; fall(P); } pushLog({ label: 'Todesrettungswurf', total: eff, detail: msg + (notes.length ? ' · ' + notes.join(' · ') : ''), sides: 20, nat: r, crit: r === 20, fumble: r === 1 }); commit(); },
    pip: () => { const P = ch.play; const v = +arg;
      if (path === 'ds0') P.ds[0] = v; else if (path === 'ds1') { P.ds[1] = v; if (v >= 3) fall(P); } else if (path === 'pact') P.pact = v; else if (path.startsWith('slots.')) P.slots[path.slice(6)] = v; else if (path.startsWith('res.')) P.res[path.slice(4)] = v; commit(); },
    campJoin: () => { const v = ($('#campCode').value || '').trim(); if (!v) { $('#campCode').focus(); return; } joinCamp(v); },
    campLeave: () => { leaveCamp(); render(); },
    campShare: () => { if (S.share && !S.secret) S.secret = true; else if (S.share) { S.share = false; S.secret = false; } else S.share = true; saveCampPref(); queueMe(); render(); },
    mercy: () => decide(arg, 'mercy'),
    doom: () => decide(arg, 'death'),
    dmTake: () => saveMeta({ dm: UID }),
    dmDrop: () => saveMeta({ dm: null }),
    selfMercy: () => { const P = ch.play; P.dead = false; P.deathFinal = false; P.hp = 1; P.ds = [0, 0]; pushLog({ label: 'Gnade', total: '✓', detail: ch.name + ' kehrt mit 1 TP zurück' }); commit(); },
    logOpen: () => { S.logOpen = !S.logOpen; paintCamp(); },
    logFilter: () => { S.logFilter = arg; paintCamp(); },
    fightStart: () => { S.myInit = null; saveCombat({ id: 'k' + Date.now().toString(36), active: true, round: 1, turn: null, npcs: [], t: Date.now() }); },
    fightGo: () => { const o = order().filter((x) => !skipTurn(x)); if (o.length) saveCombat(Object.assign({}, S.combat, { turn: o[0].key, turnAt: { v: o[0].v, dex: o[0].dex, name: o[0].name }, round: 1, t: Date.now(), log: clog(S.combat, 'Kampf beginnt – Runde 1: ' + o[0].name + ' ist am Zug') })); },
    fightReset: () => { const c = S.combat; if (!c) return; const gr = {}; const npcs = (c.npcs || []).filter((x) => !(x.hpMax > 0 && x.hp <= 0)).map((x) => { const r = x.grp ? (gr[x.grp] = gr[x.grp] || 1 + Math.floor(rnd() * 20)) : 1 + Math.floor(rnd() * 20); return Object.assign({}, x, { v: r + (+x.dex || 0) }); }); S.myInit = null; queueMe();
      saveCombat({ id: 'k' + Date.now().toString(36), active: true, round: 1, turn: null, npcs, t: Date.now(), effects: [], rem: [], log: [{ t: Date.now(), x: 'Neue Begegnung – alle würfeln neu Initiative, besiegte Gegner entfernt' }] }); },
    fightEnd: () => { saveCombat({ id: '', active: false, t: Date.now() }); S.myInit = null; queueMe(); },
    turnEnd: () => { nextTurn(); if (typeof turnReset === 'function') { turnReset(ch, true); commit(); } },
    initRoll: () => { const c = derive(ch, S.hb); if (!S.combat || !S.combat.active) return; d20(c.init, 'Initiative', { kind: 'init' }); },
    surpTog: () => { const c = S.combat; if (!c) return; const sp = (c.surp || []).slice(); const i = sp.indexOf(arg); if (i >= 0) sp.splice(i, 1); else sp.push(arg); saveCombat(Object.assign({}, c, { surp: sp, t: Date.now() })); },
    initAway: () => { if (!S.combat || !S.combat.active) return; S.myInit = { cid: S.combat.id, away: true }; queueMe(); pushLog({ label: 'Noch nicht im Kampf', total: '…', detail: ch.name + ' ist noch zu weit weg und greift später ein.', share: true }); setTimeout(paintCamp, 50); },
    initSet: () => { const v = $('#initMan').value; if (v === '' || !S.combat) { $('#initMan').focus(); return; } setMyInit(+v); pushLog({ label: 'Initiative (eingetragen)', total: +v, detail: 'von Hand', share: true }); },
    npcAdd: () => { const n = ($('#npcName').value || '').trim() || 'Gegner'; const b = +$('#npcBonus').value || 0; const r = 1 + Math.floor(rnd() * 20); const c = S.combat; if (!c) return;
      saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).concat([{ id: Math.random().toString(36).slice(2, 8), name: n, v: r + b, dex: b }]), t: Date.now(), log: clog(c, n + ' tritt dem Kampf bei (Initiative ' + (r + b) + ')') })); pushLog({ label: n + ': Initiative', total: r + b, detail: 'W20 ' + r + ' ' + sgn(b), sides: 20, nat: r }); },
    npcDel: () => { if (S.modal === 'npc') { S.modal = null; $('#modal').hidden = true; } const c = S.combat; saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).filter((x) => x.id !== arg), effects: (c.effects || []).filter((e) => e.tgt !== 'n:' + arg && e.src !== 'n:' + arg), rem: (c.rem || []).filter((r) => r.tgt !== 'n:' + arg), turn: c.turn === 'n:' + arg ? null : c.turn })); },
    cond: () => { const P = ch.play; const had = (P.cond || []).includes('incapacitated'); P.cond = (P.cond || []).filter((k) => COND[k]); const i = P.cond.indexOf(arg); if (i >= 0) P.cond.splice(i, 1); else { P.cond.push(arg); (COND[arg].adds || []).forEach((x) => { if (!P.cond.includes(x)) P.cond.push(x); }); } if (!had && P.cond.includes('incapacitated')) { if (P.conc) { pushLog({ label: 'Konzentration endet', total: '✗', detail: P.conc.name + ' endet, weil du kampfunfähig bist.' }); endConc(P); } if (P.raging) rageEnd(P, 'kampfunfähig'); if (P.ws) wsEnd(ch, 'kampfunfähig'); } commit(); },
    condClear: () => { ch.play.cond = []; commit(); },
    resUse: () => { const P = ch.play; P.res[arg] = Math.max(0, Math.min(+t.dataset.max, (+P.res[arg] || 0) + +t.dataset.d)); commit(); },
    pool: () => { const n = +$('#pool_' + arg).value || 0; const P = ch.play; const left = +t.dataset.max - (+P.res[arg] || 0); const use = Math.min(n, left); if (!use) return; P.res[arg] = (+P.res[arg] || 0) + use; pushLog({ label: 'Pool ausgegeben', total: use, detail: 'Noch ' + (left - use) + ' übrig' }); commit(); },
    cast: () => { const c = derive(ch, S.hb); const P = ch.play; const lv = +arg; let ok = false;
      const wantPact = t.dataset.mode === 'pact';
      if (!wantPact) for (let g = lv; g <= c.spell.slots.length; g++) { if ((+P.slots[g] || 0) < c.spell.slots[g - 1]) { P.slots[g] = (+P.slots[g] || 0) + 1; ok = 'Platz Grad ' + g; break; } }
      if (!ok && c.spell.pact && (+P.pact || 0) < c.spell.pact.n && lv <= c.spell.pact.lvl) { P.pact = (+P.pact || 0) + 1; ok = 'Paktplatz Grad ' + c.spell.pact.lvl; }
      pushLog({ label: t.dataset.label, total: ok ? '✓' : '✗', detail: ok ? ok + ' verbraucht' : 'Kein freier Zauberplatz' }); commit(); },
    drOpen: () => { const p = $('#dicePanel'); p.hidden = !p.hidden; if (!p.hidden) renderDicePanel(); },
    drClose: () => { $('#dicePanel').hidden = true; },
    drDie: () => { S.dr.d = +arg; renderDicePanel(); },
    drN: () => { S.dr.n = Math.max(1, Math.min(30, S.dr.n + +arg)); renderDicePanel(); },
    drSet: () => { S.dr.n = +arg; renderDicePanel(); },
    drM: () => { S.dr.mod = Math.max(-20, Math.min(30, S.dr.mod + +arg)); renderDicePanel(); },
    drRoll: () => { const d = S.dr; $('#dicePanel').hidden = true; rollDmg(d.n + 'W' + d.d + (d.mod ? (d.mod > 0 ? '+' : '-') + Math.abs(d.mod) : ''), 'Würfelbecher ' + d.n + 'W' + d.d + (d.mod ? sgn(d.mod) : '')); },
    atk: () => weaponAttack(ch, +arg),
    dpT: () => { if (S.dp) { S.dp[arg] = !S.dp[arg]; renderDmgPrompt(); } },
    dpR: () => { if (S.dp) { S.dp['r_' + arg] = S.dp['r_' + arg] === false; renderDmgPrompt(); } },
    dpX: () => { if (S.dp) { const x = S.dp.xd || (S.dp.xd = []); const i = x.indexOf(arg); if (i >= 0) x.splice(i, 1); else x.push(arg); renderDmgPrompt(); } },
    dpSmite: () => { if (S.dp) { S.dp.smite = arg === '0' ? 0 : arg; renderDmgPrompt(); } },
    dpMiss: () => { grazeMiss(ch); S.dp = null; orbPrompt(''); },
    dpRoll: () => dmgRoll(ch),
    saHit: () => saHit(),
    saMiss: () => saNext(),
    fx: () => { const P = ch.play; P.fx = P.fx || {}; const on = !!P.fx[arg];
      if (on) { if (P.conc && P.fxSrc && P.fxSrc[arg] === P.conc.id) endConc(P); else fxSet(P, arg, false); pushLog({ label: 'Wirkung beendet', total: '✦', detail: arg }); return commit(); }
      if (arg !== 'bless') return; fxSet(P, 'bless', true, 'ally'); pushLog({ label: 'Gesegnet', total: '✦', detail: 'Von einem Verbündeten erhalten (manuell eingetragen, ohne eigene Kosten) · 1 Minute', share: true }); commit(); },
    rage: () => { const P = ch.play; if (P.raging) { rageEnd(P, 'freiwillig beendet'); return commit(); } turnRun(ch, 'f:rage'); },
    orbHit: () => orbHit(),
    orbMiss: () => { orbPrompt(''); S.orb = null; },
    orbStop: () => { orbPrompt(''); S.orb = null; },
    orbLeap: () => { if (!S.orb) return; S.orb.i++; orbAttack(); },
    castSp: () => castSpell(ch, t.dataset.id, +t.dataset.lvl, t.dataset.mode || 'slot', t.dataset.res),
    concEnd: () => { endConc(ch.play); commit(); },
    rest: () => { if (arg === 'short') { shortRestOpen(ch); return; } doRest(ch, arg); },
    hbNew: () => { S.hbEdit = { id: 'h' + Date.now().toString(36), kind: arg, name: '', text: '', classes: [], plus: [] }; S.confirm = null; render(); },
    hbEdit: () => { S.hbEdit = JSON.parse(JSON.stringify(S.hb[arg])); S.confirm = null; render(); },
    hbCancel: () => { S.hbEdit = null; render(); },
    hbToggle: () => { const a = S.hbEdit[path] = S.hbEdit[path] || []; const i = a.indexOf(t.dataset.val); if (i >= 0) a.splice(i, 1); else a.push(t.dataset.val); render(); },
    hbFlip: () => { S.hbEdit[path] = !S.hbEdit[path]; render(); },
    hbSave: () => { const e = S.hbEdit; if (!e.name.trim()) { const i = $('[data-bind="hbe.name"]'); i.focus(); i.placeholder = 'Bitte einen Namen eingeben'; return; } S.hb[e.id] = e; persist('h', e.id); S.hbEdit = null; render(); },
    hbAskDel: () => { S.confirm = 'hb'; render(); },
    hbDel: () => { const id = S.hbEdit.id; delete S.hb[id]; persist('h', id); Object.values(S.chars).forEach((c) => { if (c.homebrew.includes(id)) { c.homebrew = c.homebrew.filter((x) => x !== id); persist('c', c.id); } }); S.hbEdit = null; S.confirm = null; render(); }
  };
  if (A[act]) { ev.preventDefault(); A[act](); }
  else if (XA[act]) { ev.preventDefault(); XA[act](t, arg, path, ch); }
});
function onBind(ev) {
  const t = ev.target; if (!t.dataset || !t.dataset.bind) return;
  let v = t.value; if (t.dataset.type === 'num') v = v === '' ? 0 : +v;
  const p = t.dataset.bind;
  if (p.startsWith('hbe.')) { S.hbEdit[p.slice(4)] = v; if (ev.type === 'change' && t.tagName === 'SELECT') render(); return; }
  const ch = cur(); setP(ch, p, v);
  if (p === 'name' && !String(v).trim()) ch.name = 'Neuer Held';
  if (p === 'name') document.querySelectorAll('.summary h3').forEach((h) => { h.textContent = ch.name; });
  const fm = /^asi\.(\d+)\.feat$/.exec(p); if (fm) { ch.asi[fm[1]].plus = {}; delete ch.asi[fm[1]].save; }
  if (p === 'play.exh') { v = +v; if (v >= 6 && !ch.play.dead) { pushLog({ label: 'Erschöpfung Stufe 6', total: '†', detail: 'Auf der sechsten Erschöpfungsstufe stirbt ein Held.' }); fall(ch.play); } }
  const norender = t.hasAttribute('data-norender') || (ev.type === 'input');
  commit(!norender);
}
document.addEventListener('input', (ev) => { const t = ev.target; if (t.dataset && t.dataset.bind && (t.tagName === 'TEXTAREA' || t.type === 'text')) onBind(ev); if (t.id === 'sq') { S.sf.q = t.value; const pos = t.selectionStart; render(); const n = $('#sq'); n.focus(); n.setSelectionRange(pos, pos); } });
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (xChange(t)) return;
  if (t.id === 'addMc' && t.value) { const ch = cur(); ch.multi = ch.multi || []; const total = ch.level + ch.multi.reduce((a, m) => a + (+m.level || 0), 0); if (total < 20) ch.multi.push({ cls: t.value, level: 1, order: '', land: 'temperate', cantrips: [], spells: [], arcanum: {} }); commit(); return; }
  if (t.id === 'addW' && t.value) { cur().weapons.push({ w: t.value, bonus: 0, mastery: false, ab: 'auto' }); commit(); return; }
  if (t.id === 'sl') { S.sf.lvl = t.value; render(); return; }
  if (t.id === 'sc') { S.sf.cls = t.value; render(); return; }
  if (t.id === 'importFile' && t.files[0]) { const r = new FileReader(); r.onload = () => { try { importJson(r.result); } catch (e) { pushLog({ label: 'Datei laden', total: '✗', detail: 'Die Datei ist keine Heldenbuch-Datei.' }); } }; r.readAsText(t.files[0]); t.value = ''; return; }
  if (t.dataset && t.dataset.bind && !(t.tagName === 'TEXTAREA' || t.type === 'text')) onBind(ev);
  else if (t.dataset && t.dataset.bind && t.type === 'text' && !t.dataset.bind.startsWith('hbe.')) { commit(true); }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'campCode') { e.preventDefault(); const v = e.target.value.trim(); if (v) joinCamp(v); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) { $('#modal').hidden = true; S.modal = null; } });
document.addEventListener('click', (e) => { if (e.target.id === 'modal') { e.target.hidden = true; S.modal = null; } });
function embers() { applyTheme(); if (!FX) startFx(); }

/* ---------- Start ---------- */
(function boot() {
  const l = lsGet();
  if (l && l.chars) { S.chars = l.chars; S.hb = l.hb || {}; S.cur = l.cur; Object.values(S.chars).forEach(normChar); }
  if (!S.chars[S.cur]) S.cur = Object.keys(S.chars)[0] || null;
  try { const cp = JSON.parse(localStorage.getItem('heldenbuch_camp') || 'null'); if (cp) { S.camp = cp.code || ''; S.share = cp.share !== false; S.secret = !!cp.secret; } } catch (e) {}
  render();
  embers();
  connectDb();
})();
