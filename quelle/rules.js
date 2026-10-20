/* ==== Regelkern: Regeloptionen, Durchsetzung, Einmal-pro-Zug, Ziele, Zugbeginn, Validierung, Migration ==== */
/* Regelgrundlage: D&D 2024 / SRD 5.2. Abweichungen sind als Regeloption (Hausregel) schaltbar. */
const RULE_OPTS = {
  strict: { n: 'Regeln streng durchsetzen', t: 'Im Kampf werden ungültige Aktionen blockiert: zweite Bonusaktion, verbrauchte Reaktion, zweiter Zauberplatz im selben Zug, Handeln trotz Kampfunfähigkeit, Zauber in Rüstung ohne Übung. Aus: Die App warnt nur, die Spielleitung entscheidet.', d: true },
  lvlcap: { n: 'Stufe 20 als Obergrenze', t: 'Die Gesamtstufe aller Klassen ist höchstens 20 (SRD). Aus: epische Stufen über 20 (Hausregel).', d: true },
  abilcap: { n: 'Attributsobergrenze 20', t: 'Attribute aus Hintergrund, Talenten und Erhöhungen steigen höchstens auf 20 (Ausnahmen laut Regeln, z. B. Epische Gaben bis 30).', d: true },
  restcombat: { n: 'Keine Rast während eines Kampfes', t: 'Kurze und lange Rast sind gesperrt, solange ein Kampf läuft (am Tisch oder im lokalen Kampfmodus).', d: true },
  restzero: { n: 'Lange Rast nur mit mindestens 1 TP', t: 'Wer bei 0 TP ist, erhält keine Vorteile einer langen Rast, bis er stabilisiert und geheilt wurde.', d: true },
  hdrest: { n: 'Trefferwürfel nur in einer kurzen Rast', t: 'Trefferwürfel gibst du im Dialog der kurzen Rast aus. Aus: auch direkt auf dem Bogen (Hausregel).', d: true }
};
function rule(k) { if (!S.rules) { try { S.rules = JSON.parse(localStorage.getItem('hb_rules') || '{}') || {}; } catch (e) { S.rules = {}; } } const v = S.rules[k]; return v === undefined ? !!(RULE_OPTS[k] || {}).d : !!v; }
XA.ruleT = (t, a) => { rule(a); S.rules[a] = !rule(a); try { localStorage.setItem('hb_rules', JSON.stringify(S.rules)); } catch (e) {} render(); };
function rulesBlock() {
  return '<section class="panel rulesp"><h2>Regeloptionen</h2><p class="hint">Standard ist D&D 2024 (SRD 5.2). Abweichungen schaltest du hier als Hausregel. Die Einstellung gilt auf diesem Gerät.</p><div class="rulelist">' +
    Object.entries(RULE_OPTS).map(([k, o]) => '<label class="rulerow"><input type="checkbox" data-act="ruleT" data-arg="' + k + '"' + (rule(k) ? ' checked' : '') + '><span><b>' + esc(o.n) + (rule(k) === o.d ? '' : ' <em>Hausregel</em>') + '</b><small>' + esc(o.t) + '</small></span></label>').join('') + '</div></section>';
}

/* Kennzeichnung: Diese Entscheidung trifft die Spielleitung (nicht die App) */
function slTag(t) { return '<span class="slb" title="' + (t || 'Entscheidet die Spielleitung – die App rechnet nur') + '">SL entscheidet</span>'; }
/* ---------- Kampfstatus ---------- */
const onlineFight = () => !!(S.camp && S.combat && S.combat.active);
function inFight(ch) { return onlineFight() || !!(ch && ch.play && ch.play.localFight); }
function offTurn() { if (!onlineFight() || !S.combat.turn) return false; return S.combat.turn !== 'p:' + UID; }
function turnKeyNow(ch) { return onlineFight() ? (S.combat.round || 1) + ':' + (S.combat.turn || '-') : 'own'; }
const INCAP = ['incapacitated', 'paralyzed', 'stunned', 'unconscious', 'petrified'];
function canAct(ch) {
  const P = ch.play; if (P.dead) return 'Dein Held ist gefallen.';
  if (P.hp != null && +P.hp <= 0) return 'Bei 0 TP bist du bewusstlos und kannst nicht handeln.';
  const bad = (P.cond || []).filter((k) => INCAP.includes(k));
  if (bad.length) return (COND[bad[0]] || {}).name + ': Du kannst keine Aktionen, Bonusaktionen oder Reaktionen ausführen.';
  return null;
}
/* Prüft eine Regel; im strengen Modus und im Kampf blockiert sie, sonst warnt sie. Rückgabe: true = erlaubt. */
function ruleGate(ch, msg, title, always) {
  if (!msg) return true;
  if (rule('strict') && (always || inFight(ch))) { bannerToast(title || 'Nicht möglich', msg); return false; }
  bannerToast('Achtung', msg + (inFight(ch) ? ' (Regeln locker – trotzdem ausgeführt)' : ''));
  return true;
}

/* ---------- Einmal pro Zug ---------- */
function onceMap(ch) { const t = turnSt(ch); const id = turnKeyNow(ch); if (t.onceId !== id || !t.once) { t.onceId = id; t.once = {}; } return t.once; }
const onceUsed = (ch, k) => !!onceMap(ch)[k];
const onceMark = (ch, k) => { onceMap(ch)[k] = 1; };
/* Zusatzschaden, der mehrfach pro Zug erlaubt ist (alle anderen: 1× pro Zug) */
const XD_MULTI = new Set(['arkan', 'sommer', 'glut', 'gfire', 'gfrost', 'lifedr', 'takt', 'taktik', 'bwkrieg']);

/* ---------- Ziel im Kampf ---------- */
function tgtEntry() { if (!onlineFight() || !S.tgt) return null; return order().find((x) => x.key === S.tgt) || null; }
const TGT_ADV = ['blinded', 'paralyzed', 'petrified', 'restrained', 'stunned', 'unconscious'];
function tgtMods(k) {
  const t = tgtEntry(); const adv = [], dis = []; if (k.type !== 'attack') return { adv, dis, t };
  const ranged = k.skill !== 'melee'; const near = S.atkDist === 'near', far = S.atkDist === 'far';
  if (ranged && (S.adjFoe || near)) dis.push('Fernkampf mit Gegner in 1,5 m');
  if (!t) return { adv, dis, t };
  const cs = t.cond || [];
  cs.forEach((x) => { if (TGT_ADV.includes(x)) adv.push('Ziel ' + (COND[x] || {}).name); if (x === 'invisible') dis.push('Ziel unsichtbar'); if (x === 'prone') { if (near) adv.push('Ziel liegt (in 1,5 m)'); else if (far || ranged) dis.push('Ziel liegt (weiter als 1,5 m)'); } });
  const fx = (cur() || {}).play?.fx || {}; if (fx.vex && fx.vex === t.key) adv.push('Bedrängen');
  return { adv, dis, t };
}
/* Abstand nur abfragen, wenn er die Regel verändert (liegend, gelähmt, bewusstlos); pro Ziel und Zug gemerkt */
const DIST_COND = ['prone', 'paralyzed', 'unconscious'];
function needDist(ch) { const t = tgtEntry(); if (!t || !(t.cond || []).some((x) => DIST_COND.includes(x))) return null; const key = turnKeyNow(ch) + '|' + t.key; return S.distMemo && S.distMemo.key === key ? S.distMemo.v : 'ask'; }
function distPrompt(i, o) { const t = tgtEntry(); S.distPend = { i, o }; orbPrompt('<div class="pr"><b>Abstand zu ' + esc(t.name) + '</b><p>' + esc((t.cond || []).filter((x) => DIST_COND.includes(x)).map((x) => COND[x].name).join(', ')) + ': Vorteil, Nachteil und automatische kritische Treffer hängen vom Abstand ab. ' + slTag('Abstand bestätigen Spieler/Spielleitung – ohne Karte misst die App nicht') + '</p><div class="chips end"><button class="btn ghost" data-act="atkDist" data-arg="far">Weiter als 1,5 m</button><button class="btn" data-act="atkDist" data-arg="near">Innerhalb 1,5 m</button></div></div>'); }
XA.atkDist = (t, a, p, ch) => { const pd = S.distPend; S.distPend = null; orbPrompt(''); if (!pd) return; const tg = tgtEntry(); if (tg) S.distMemo = { key: turnKeyNow(ch) + '|' + tg.key, v: a }; weaponAttack(ch, pd.i, Object.assign({}, pd.o, { dist: a })); };
XA.adjFoe = () => { S.adjFoe = !S.adjFoe; render(); };
/* Zielgebundene Effekte (Mal des Jägers, Verhexen): ohne festes Ziel frei bestätigbar, mit festem Ziel nur gegen genau dieses */
function markOk(P, k, tgt) { const mark = P.fx && P.fx[k + 'Tgt']; if (!mark) return true; if (!tgt || tgt !== mark) return false; return !onlineFight() || order().some((x) => x.key === mark); }
function markMoveCheck(ch, k) {
  const P = ch.play; const old = P.fx && P.fx[k + 'Tgt'];
  if (onlineFight() && !S.tgt) return 'Wähle zuerst oben in der Zugleiste das neue Ziel.';
  if (old && S.tgt === old) return 'Das ist schon das markierte Ziel.';
  if (old && onlineFight()) { const o = order().find((x) => x.key === old); if (o && o.hpMax && +o.hp > 0) return 'Versetzen geht erst, wenn das bisherige Ziel auf 0 TP gefallen ist (' + partName(old) + ' steht noch).'; }
  return null;
}
function tgtAutoCrit(a) { const t = tgtEntry(); return !!(t && a && S.atkDist === 'near' && (t.cond || []).some((x) => x === 'paralyzed' || x === 'unconscious')); }
function tgtSelect(c) {
  if (!onlineFight()) return '';
  const o = order().filter((x) => x.key !== 'p:' + UID); if (!o.length) return '';
  if (S.tgt && !o.some((x) => x.key === S.tgt)) S.tgt = '';
  return '<button class="chip' + (S.adjFoe ? ' on' : '') + '" data-act="adjFoe" title="Fernkampfangriffe haben Nachteil, wenn ein Gegner in 1,5 m steht">Gegner neben mir</button><label class="tgtsel">Ziel <select id="tgtSel" aria-label="Ziel wählen"><option value="">— kein bestimmtes —</option>' + o.map((x) => '<option value="' + x.key + '"' + (S.tgt === x.key ? ' selected' : '') + '>' + esc(x.name) + ((x.cond || []).length ? ' · ' + x.cond.map((k) => (COND[k] || {}).name).filter(Boolean).join(', ') : '') + '</option>').join('') + '</select></label>';
}
document.addEventListener('change', (ev) => { if (ev.target && ev.target.id === 'tgtSel') { S.tgt = ev.target.value; } });

/* ---------- Effekte mit Dauer auf dem eigenen Helden (P.fx) ---------- */
const FX_SPELL = { bless: 'bless', 'hunters-mark': 'hm', hex: 'hex', 'divine-favor': 'df', shillelagh: 'shill', shield: 'shield', 'conjure-minor-elementals': 'cme', 'crusaders-mantle': 'cmantle', 'elemental-weapon': 'ewpn' };
/* Zauber, die Treffer verstärken (Schaden bei jedem passenden Treffer, solange sie wirken) */
const RIDERS = { cmantle: { s: 4, n: () => 1, tag: 'Mantel des Kreuzritters (gleissend)' }, ewpn: { s: 4, n: (L) => (L >= 7 ? 3 : L >= 5 ? 2 : 1), tag: 'Elementarwaffe' }, cme: { s: 8, n: (L) => 2 + Math.max(0, L - 4), tag: 'Niedere Elementare', ask: 'Ziel in deiner 4,5-m-Emanation' } };
const FX_DUR = { bless: 10, hm: 600, hex: 600, df: 10, shill: 10, sacred: 100, innate: 10, flame: 100, vex: 2, shield: 1, cme: 100, cmantle: 10, ewpn: 600 };
function fxSet(P, k, on, src) {
  P.fx = P.fx || {}; P.fxDur = P.fxDur || {}; P.fxSrc = P.fxSrc || {};
  if (!on) { delete P.fx[k]; delete P.fxDur[k]; delete P.fxSrc[k]; return; }
  P.fx[k] = on === true ? true : on; if (FX_DUR[k]) P.fxDur[k] = FX_DUR[k]; if (src) P.fxSrc[k] = src;
}

/* ---------- Zugbeginn: Dauer herunterzählen, Kampfrausch, automatische Merkmale ---------- */
function startOfTurn(ch) {
  const P = ch.play; const c = derive(ch, S.hb); const log = [];
  if (P.fxDur) for (const k of Object.keys(P.fxDur)) { P.fxDur[k]--; if (P.fxDur[k] <= 0) { const nm = { bless: 'Segnen', hm: 'Mal des Jägers', hex: 'Verhexen', df: 'Göttliche Gunst', shill: 'Shillelagh', sacred: 'Heilige Waffe', innate: 'Angeborene Zauberei', flame: 'Flamme erzeugen', vex: 'Bedrängen', shield: 'Schild (+5 RK)', cme: 'Niedere Elementare', cmantle: 'Kreuzfahrermantel', ewpn: 'Elementarwaffe' }[k] || k; if (P.conc && P.fxSrc && P.fxSrc[k] === P.conc.id) endConc(P); fxSet(P, k, false); log.push(nm + ' endet (Dauer abgelaufen)'); } }
  if (P.raging && inFight(ch)) {
    P.rageLeft = (P.rageLeft ?? 100) - 1;
    if (!P.rageKeep || P.rageLeft <= 0) { rageEnd(P, P.rageLeft <= 0 ? '10 Minuten vorbei' : 'im letzten Zug weder angegriffen, einen Rettungswurf erzwungen noch verlängert'); }
    else if (c.lv('bar') >= 15) { /* Anhaltender Kampfrausch: endet nur durch Bewusstlosigkeit oder freiwillig */ }
    P.rageKeep = c.lv('bar') >= 15;
  }
  if (P.hp == null) P.hp = c.hpMax;
  if (inFight(ch) && P.hp > 0) {
    if (c.lv('fig') >= 10 && c.subOf('fig') === 'champion' && !P.insp) { P.insp = true; log.push('Heldenhafter Krieger: Heldeninspiration erhalten'); }
    if (c.lv('fig') >= 18 && c.subOf('fig') === 'champion' && P.hp <= Math.floor(c.hpMax / 2)) { const h = Math.max(0, 5 + c.mod.con); const old = P.hp; P.hp = Math.min(c.hpMax, P.hp + h); log.push('Überlebender: +' + (P.hp - old) + ' TP (angeschlagen)'); }
  }
  if (log.length) pushLog({ label: 'Zugbeginn', total: '✦', detail: log.join(' · '), share: true });
}
/* Zeit ausserhalb des Kampfes fortschreiben (1 Runde = 6 Sekunden) */
function timePass(ch, rounds) {
  const P = ch.play; const ended = [];
  for (const k of Object.keys(P.fxDur || {})) { P.fxDur[k] -= rounds; if (P.fxDur[k] <= 0) { if (P.conc && P.fxSrc && P.fxSrc[k] === P.conc.id) endConc(P); ended.push(k); fxSet(P, k, false); } }
  if (P.raging) { rageEnd(P, 'ausserhalb des Kampfes abgeklungen'); }
  pushLog({ label: 'Zeit vergeht', total: '⌛', detail: (rounds >= 600 ? rounds / 600 + ' Stunde(n)' : rounds / 10 + ' Minute(n)') + (ended.length ? ' · beendet: ' + ended.length + ' Wirkung(en)' : '') });
}
function rageEnd(P, why) { if (!P.raging) return; P.raging = false; P.rageKeep = false; P.rageLeft = null; pushLog({ label: 'Kampfrausch endet', total: '✗', detail: why || '', share: true }); }
const rageNoArmor = (c) => !c.heavyArmor;

/* ---------- Zauber zentral prüfen (vor jedem Verbrauch) ---------- */
/* Drei Stufen: block = immer verboten · fatal = Regelverstoss, blockiert im strengen Modus immer (auch ausserhalb des Kampfes)
   · turn = Zugregeln, blockieren im strengen Modus nur im Kampf. Erst nach bestandener Prüfung wird etwas verbraucht. */
function spellBookOf(ch, c) { const out = new Set(ch.book || []); (ch.multi || []).forEach((m) => (m.book || []).forEach((x) => out.add(x))); return out; }
function spellAccess(ch, c, s, mode) {
  if (c.spell.byId && c.spell.byId[s.id]) return true;
  if (c.extraSpells.some((e) => e.id === s.id)) return true;
  if (mode === 'ritual' && c.lv('wiz') && s.ritual && spellBookOf(ch, c).has(s.id)) return true;
  return false;
}
function spellCheck(ch, c, s, lvl, mode) {
  const P = ch.play; const fatal = [], turn = [];
  if (!s) return { block: 'Unbekannter Zauber.' };
  if (P.dead) return { block: 'Dein Held ist gefallen.' };
  if (P.raging) return { block: 'Im Kampfrausch kannst du keine Zauber wirken.' };
  if (P.ws && !(c.lv('dru') >= 18)) return { block: 'In Tiergestalt kannst du keine Zauber wirken (erst mit „Tierzauber“ ab Druidenstufe 18).' };
  if (mode === 'ritual' && !s.ritual) return { block: s.name + ' ist kein Ritual.' };
  if (s.lvl > 0 && mode !== 'ritual' && mode !== 'free' && lvl && lvl < s.lvl) return { block: 'Grad ' + lvl + ' ist zu niedrig für ' + s.name + ' (Grad ' + s.lvl + ').' };
  const cost = spellCost(s);
  const why = canAct(ch); if (why) fatal.push(why);
  if (c.armorNonProf) fatal.push('Rüstung ohne Übung: Du kannst keine Zauber wirken.');
  if (!spellAccess(ch, c, s, mode)) fatal.push(mode === 'ritual' ? s.name + ' steht weder in deinem Zauberbuch noch ist er vorbereitet.' : s.name + ' ist weder vorbereitet noch bekannt.');
  const slot = s.lvl > 0 && (mode === 'pact' || !mode || mode === 'slot');
  if (inFight(ch)) {
    const t = turnSt(ch);
    if (cost && mode !== 'ritual' && tLeft(ch, cost) <= 0) turn.push(COST_DE[cost] + ' schon verbraucht.');
    if (slot && !offTurn() && t.slotSpell) turn.push('Pro Zug darfst du nur einen Zauberplatz verbrauchen (D&D 2024). Zaubertricks und Gratiswirkungen gehen weiterhin.');
    if (mode === 'ritual') turn.push('Ein Ritual dauert 10 Minuten länger – im Kampf nicht möglich.');
  }
  return { fatal, turn, warn: fatal.concat(turn) };
}
function spellGate(ch, c, s, lvl, mode) {
  const r = spellCheck(ch, c, s, lvl, mode);
  if (r.block) { pushLog({ label: s ? s.name : 'Zauber', total: '✗', detail: r.block }); return false; }
  if (r.fatal.length && rule('strict')) { pushLog({ label: s.name, total: '✗', detail: r.fatal.join(' ') }); bannerToast(s.name + ' nicht möglich', r.fatal.join(' ')); return false; }
  if (r.turn.length && rule('strict') && inFight(ch)) { pushLog({ label: s.name, total: '✗', detail: r.turn.join(' ') }); bannerToast(s.name + ' nicht möglich', r.turn.join(' ')); return false; }
  if (r.warn.length) bannerToast('Achtung (Regeln locker)', r.warn.join(' '));
  return true;
}

/* ---------- Charakterdaten: Prüfung beim Import und Migration ---------- */
const SCHEMA = 2;
function validateChar(o) {
  const e = [];
  if (!o || typeof o !== 'object' || Array.isArray(o)) return ['Kein Heldenobjekt.'];
  if (typeof o.name !== 'string') e.push('Name fehlt oder ist kein Text.');
  if (!CLASSES[o.cls]) e.push('Unbekannte Klasse „' + o.cls + '“.');
  const L = +o.level; if (!Number.isInteger(L) || L < 1 || L > 30) e.push('Stufe ungültig (' + o.level + ').');
  if (o.base !== undefined) { if (typeof o.base !== 'object' || !o.base) e.push('Attributswerte fehlen.'); else for (const k of AB) { const v = +o.base[k]; if (o.base[k] !== undefined && (!Number.isFinite(v) || v < 1 || v > 30)) e.push('Attribut ' + AB_K[k] + ' ungültig (' + o.base[k] + ').'); } }
  if (o.species !== undefined && !SPECIES[o.species]) e.push('Unbekannte Spezies „' + o.species + '“.');
  for (const k of ['multi', 'weapons', 'spells', 'book', 'cantrips', 'classSkills', 'extraSkills', 'expertise', 'invocations', 'styles', 'items', 'homebrew', 'comps']) if (o[k] !== undefined && !Array.isArray(o[k])) e.push('„' + k + '“ muss eine Liste sein.');
  (Array.isArray(o.multi) ? o.multi : []).forEach((m, i) => { if (!m || !CLASSES[m.cls]) e.push('Multiclass ' + (i + 1) + ': unbekannte Klasse.'); else if (!Number.isInteger(+m.level) || +m.level < 1) e.push('Multiclass ' + (i + 1) + ': Stufe ungültig.'); });
  (Array.isArray(o.weapons) ? o.weapons : []).forEach((w, i) => { if (!w || !WEAPONS[w.w]) e.push('Waffe ' + (i + 1) + ': unbekannt (' + (w && w.w) + ').'); });
  if (o.play !== undefined && (typeof o.play !== 'object' || !o.play)) e.push('Spielstand („play“) ist ungültig.');
  return e;
}
/* Bereinigt Verweise, die es nicht (mehr) gibt, statt den Helden abzulehnen */
function cleanRefs(c) {
  const notes = [];
  const sp = (id) => getSpell(id, S.hb);
  for (const k of ['spells', 'cantrips', 'book']) { const before = (c[k] || []).length; c[k] = (c[k] || []).filter((id) => sp(id)); if (c[k].length < before) notes.push((before - c[k].length) + ' unbekannte Zauber entfernt'); }
  c.weapons = (c.weapons || []).filter((w) => w && WEAPONS[w.w]);
  c.multi = (c.multi || []).filter((m) => m && CLASSES[m.cls] && m.cls !== c.cls);
  return notes;
}
function migrateChar(c) {
  const v = +c.v || 1;
  if (v < 2) {
    /* v1 → v2: Früher galt bei fehlender Wahl automatisch die SRD-Unterklasse. Jetzt wird sie ausdrücklich gespeichert. */
    const fix = (m, cls, lvl) => { const C = CLASSES[cls]; if (C && C.subs && C.subDefault && lvl >= 3 && !C.subs.some((s) => s.id === m.sub)) m.sub = C.subs[0].id; };
    fix(c, c.cls, +c.level || 1); (c.multi || []).forEach((m) => fix(m, m.cls, +m.level || 0));
    if (c.play && c.play.hdUsed && !c.play.hdBy) c.play.hdBy = null;
  }
  c.v = SCHEMA; return c;
}
function backupOnce(raw) { try { if (!localStorage.getItem('heldenbuch_backup_v1') && raw) localStorage.setItem('heldenbuch_backup_v1', raw); } catch (e) {} }

/* ---------- Gemeinsamer Kampf: Dreiwege-Zusammenführung bei gleichzeitigen Änderungen ---------- */
const J = (x) => JSON.stringify(x);
/* Feldweise Zusammenführung einer Entität: geänderte Felder beider Seiten bleiben erhalten; Listen aus Text (z. B. Zustände) werden als Menge zusammengeführt */
function mergeFields(base, ours, theirs) {
  const out = Object.assign({}, theirs);
  for (const k of new Set(Object.keys(ours).concat(Object.keys(base || {})))) {
    const b = (base || {})[k], o = ours[k], t = theirs[k];
    if (J(o) === J(b)) continue;
    if (Array.isArray(o) && Array.isArray(t) && Array.isArray(b || []) && o.concat(t).every((x) => typeof x === 'string')) { const bs = new Set(b || []); const add = o.filter((x) => !bs.has(x)); const del = new Set((b || []).filter((x) => !o.includes(x))); out[k] = [...new Set(t.concat(add))].filter((x) => !del.has(x)); continue; }
    if (o === undefined) delete out[k]; else out[k] = o;
  }
  return out;
}
function mergeById(base, ours, theirs) {
  const b = new Map((base || []).map((x) => [x.id, x])), o = new Map((ours || []).map((x) => [x.id, x]));
  const out = new Map((theirs || []).map((x) => [x.id, x]));
  for (const [id, x] of o) {
    const bx = b.get(id); const tx = out.get(id);
    if (!bx) { if (!tx) out.set(id, x); else out.set(id, mergeFields({}, x, tx)); continue; }
    if (J(bx) === J(x)) continue;
    if (!tx) continue; /* von der anderen Seite gelöscht – Löschung bleibt */
    out.set(id, mergeFields(bx, x, tx));
  }
  for (const id of b.keys()) if (!o.has(id)) out.delete(id);
  return [...out.values()];
}
function mergeCombat(base, ours, theirs) {
  if (!theirs || !base) return ours; if (ours.id !== theirs.id) return ours;
  const m = Object.assign({}, theirs);
  for (const k of Object.keys(ours)) {
    if (['npcs', 'effects', 'rem'].includes(k)) m[k] = mergeById(base[k], ours[k], theirs[k]);
    else if (k === 'log') { const seen = new Set(); m.log = (theirs.log || []).concat(ours.log || []).filter((x) => { const key = x.t + x.x; if (seen.has(key)) return false; seen.add(key); return true; }).sort((a, b) => a.t - b.t).slice(-25); }
    else if (JSON.stringify(base[k]) !== JSON.stringify(ours[k])) m[k] = ours[k];
  }
  return m;
}

/* ---------- Kampfrausch (ein gemeinsamer Weg für Knopf und Zugleiste) ---------- */
function rageStart(ch, c) {
  const P = ch.play; P.raging = true; P.rageKeep = true; P.rageLeft = 100;
  let n = 'Resistenz gegen Wucht-, Stich- und Hiebschaden · +' + c.rageDmg + ' Schaden mit Stärke · Vorteil auf STÄ-Würfe · keine Zauber';
  if (P.conc) { n += ' · Konzentration auf ' + P.conc.name + ' endet'; endConc(P); }
  pushLog({ label: 'Kampfrausch!', total: '⚔', detail: n + ' · hält bis zum Ende deines nächsten Zuges, verlängert sich durch Angriffe, erzwungene Rettungswürfe oder eine Bonusaktion', share: true });
}

/* ---------- Tiergestalt (Druide, SRD 5.2) ---------- */
const WS_FORMS = [['wolf', 2], ['boar', 2], ['giant-rat', 2], ['black-bear', 4], ['crocodile', 4], ['brown-bear', 8], ['dire-wolf', 8], ['giant-spider', 8], ['lion', 8], ['giant-eagle', 8]];
/* Körperliche Werte und Sinne der Tierformen (SRD-Bestiarium). In Tiergestalt gelten STÄ/GES/KON der Form, deine Übungen bleiben. */
const WS_STATS = {
  wolf: { str: 12, dex: 15, con: 12, senses: 'Scharfes Gehör und Geruch (Vorteil auf Wahrnehmung), Rudeltaktik' },
  boar: { str: 13, dex: 11, con: 12, senses: 'Sturmangriff' },
  'giant-rat': { str: 7, dex: 15, con: 11, senses: 'Dunkelsicht 18 m, scharfer Geruchssinn' },
  'black-bear': { str: 15, dex: 10, con: 14, senses: 'Scharfer Geruchssinn, Klettern 9 m' },
  crocodile: { str: 15, dex: 10, con: 13, senses: 'Atem anhalten 15 Minuten, Schwimmen 9 m' },
  'brown-bear': { str: 19, dex: 10, con: 16, senses: 'Scharfer Geruchssinn, Klettern 9 m' },
  'dire-wolf': { str: 17, dex: 15, con: 15, senses: 'Scharfes Gehör und Geruch, Rudeltaktik' },
  'giant-spider': { str: 14, dex: 16, con: 12, senses: 'Blindsicht 3 m, Dunkelsicht 18 m, Spinnenklettern, Netzsinn' },
  lion: { str: 17, dex: 15, con: 13, senses: 'Scharfer Geruchssinn, Rudeltaktik, Anspringen' },
  'giant-eagle': { str: 16, dex: 17, con: 13, senses: 'Scharfe Sicht, Fliegen 24 m' }
};
const crNum = (cr) => { const s = String(cr); return s.includes('/') ? +s.split('/')[0] / +s.split('/')[1] : +s; };
function wsAllowed(c) { const L = c.lv('dru'); const maxCr = L >= 8 ? 1 : L >= 4 ? 0.5 : 0.25; return WS_FORMS.filter(([id, minL]) => BESTIARY[id] && L >= minL && crNum(BESTIARY[id][1]) <= maxCr && (L >= 8 || !/Fliegen/.test(BESTIARY[id][5]))); }
function wsPrompt(ch, c) {
  const list = wsAllowed(c);
  orbPrompt('<div class="pr"><b>Tiergestalt wählen</b><p>Erlaubt bis HG ' + (c.lv('dru') >= 8 ? '1' : c.lv('dru') >= 4 ? '1/2' : '1/4') + (c.lv('dru') >= 8 ? '' : ', ohne Flugbewegung') + '. Du erhältst ' + c.lv('dru') + ' temporäre TP.</p><div class="chips">' + list.map(([id]) => { const M = BESTIARY[id]; return '<button class="btn sm" data-act="wsGo" data-arg="' + id + '">' + esc(M[0]) + ' <small>HG ' + M[1] + ' · RK ' + M[2] + ' · ' + esc(M[5]) + '</small></button>'; }).join('') + '<button class="btn sm ghost" data-act="wsGo" data-arg="custom">Andere Form (nur temporäre TP)</button><button class="btn sm ghost" data-act="mastNo">Abbrechen</button></div></div>');
}
XA.wsGo = (t, a, p, ch) => {
  const c = derive(ch, S.hb); const P = ch.play; orbPrompt('');
  if (!(c.lv('dru') >= 2) || P.ws) return;
  if (a !== 'custom' && !wsAllowed(c).some(([id]) => id === a)) { pushLog({ label: 'Tiergestalt', total: '✗', detail: 'Diese Form ist auf deiner Stufe nicht erlaubt.' }); return; }
  const r = c.res.find((x) => x.k === 'ws'); const used = +P.res.ws || 0; if (!r || used >= r.max) { pushLog({ label: 'Tiergestalt', total: '✗', detail: 'Keine Nutzung mehr übrig.' }); return; }
  if (!tSpend(ch, 'b', 'Tiergestalt')) return;
  P.res.ws = used + 1; P.ws = a === 'custom' ? 'custom' : a; P.temp = Math.max(P.temp || 0, c.lv('dru'));
  tLog('Tiergestalt', (BESTIARY[a] ? BESTIARY[a][0] : 'eigene Form') + ' · ' + c.lv('dru') + ' temporäre TP · Dauer ' + Math.floor(c.lv('dru') / 2) + ' Stunde(n)'); commit();
};
function wsEnd(ch, why) { const P = ch.play; if (!P.ws) return; P.ws = null; tLog('Tiergestalt endet', why || ''); }

/* ---------- Zauberangriff ohne Zauberplatz (z. B. geworfene Flamme) ---------- */
function tSpellAtk(ch, s, expr, atk) { spellAttack(ch, s, 1, String(expr || '1W8').replace('−', '-'), '', '', atk); }

/* ---------- Kurze Rast mit Trefferwürfeln (getrennt nach Würfelart) ---------- */
function hdPools(c, P) {
  const by = P.hdBy || {}; const total = +P.hdUsed || 0; let assigned = Object.values(by).reduce((a, b) => a + (+b || 0), 0);
  const pools = c.hdPool.map((x) => ({ d: x.d, n: x.n, used: Math.min(x.n, +by[x.d] || 0) }));
  /* ältere Spielstände kennen nur die Summe: Rest auf die Pools verteilen */
  let rest = Math.max(0, total - assigned); for (const p of pools) { const add = Math.min(rest, p.n - p.used); p.used += add; rest -= add; }
  return pools;
}
function hdSync(c, P, pools) { P.hdBy = {}; pools.forEach((p) => { P.hdBy[p.d] = (P.hdBy[p.d] || 0) + p.used; }); P.hdUsed = pools.reduce((a, p) => a + p.used, 0); }
function spendHdDie(ch, d) {
  const c = derive(ch, S.hb); const P = ch.play; const pools = hdPools(c, P); const p = pools.find((x) => x.d === +d && x.used < x.n); if (!p) return false;
  if (P.hp == null) P.hp = c.hpMax;
  if (P.hp <= 0) { pushLog({ label: 'Trefferwürfel', total: '✗', detail: 'Bei 0 TP kannst du keine Trefferwürfel ausgeben – erst stabilisieren und heilen.' }); return false; }
  const r = rollExpr('1W' + p.d); const g = Math.max(0, r.total + c.mod.con); p.used++; hdSync(c, P, pools);
  P.hp = Math.min(c.hpMax, P.hp + g); pushLog({ label: 'Trefferwürfel W' + p.d, total: g, detail: r.detail + ' ' + sgn(c.mod.con) + ' KON · TP ' + P.hp + '/' + c.hpMax, sides: p.d, nat: r.total }); return true;
}
/* Kurze Rast als Transaktion: Würfel wählen → „Rast abschliessen“ würfelt und verbucht alles auf einmal. Abbrechen ändert nichts. */
function shortRestOpen(ch) {
  if (!restGate(ch, 'short')) return false;
  const c = derive(ch, S.hb); const P = ch.play; const pools = hdPools(c, P);
  if (!S.sr || S.sr.id !== ch.id) S.sr = { id: ch.id, want: {} };
  const w = S.sr.want; const avg = pools.reduce((a, p) => a + (w[p.d] || 0) * Math.max(0, p.d / 2 + 0.5 + c.mod.con), 0);
  const hpNow = P.hp == null ? c.hpMax : P.hp;
  const m = $('#modal'); S.modal = 'srest';
  m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="Kurze Rast"><div class="dph"><b>Kurze Rast (1 Stunde)</b><button class="x" data-act="srCancel" aria-label="Abbrechen">×</button></div><p>TP ' + hpNow + ' / ' + c.hpMax + '. Wähle, wie viele Trefferwürfel du ausgibst. Gewürfelt und verbucht wird erst beim Abschliessen der Rast; pro Würfel heilst du Ergebnis ' + sgn(c.mod.con) + ' (KON).</p>' +
    pools.map((p) => { const n = w[p.d] || 0; const left = p.n - p.used; return '<div class="srrow"><span>W' + p.d + ' <small>' + left + ' von ' + p.n + ' übrig</small></span><div class="stepper"><button data-act="srHd" data-arg="' + p.d + '" data-d="-1" aria-label="weniger"' + (n <= 0 ? ' disabled' : '') + '>−</button><b>' + n + '</b><button data-act="srHd" data-arg="' + p.d + '" data-d="1" aria-label="mehr"' + (n >= left ? ' disabled' : '') + '>+</button></div></div>'; }).join('') +
    '<p class="hint">' + (avg ? 'Erwartete Heilung ≈ ' + Math.round(avg) + ' TP.' : 'Ohne Trefferwürfel erhältst du nur die Kurzrast-Ressourcen zurück.') + ' Bricht die Rast ab, verfallen nur die Würfel-Auswahl – nichts wird verbraucht.</p>' +
    '<div class="chips end"><button class="btn ghost" data-act="srCancel">Rast abbrechen</button><button class="btn" data-act="srDone">Rast abschliessen</button></div></div>';
  m.hidden = false; return true;
}
XA.srHd = (t, a, p, ch) => { if (!S.sr) return; const c = derive(ch, S.hb); const pool = hdPools(c, ch.play).find((x) => x.d === +a); if (!pool) return; const w = S.sr.want; w[a] = Math.max(0, Math.min(pool.n - pool.used, (w[a] || 0) + (+t.dataset.d || 1))); shortRestOpen(ch); };
XA.srCancel = () => { S.sr = null; S.modal = null; $('#modal').hidden = true; };
XA.srDone = (t, a, p, ch) => {
  const want = (S.sr && S.sr.id === ch.id) ? S.sr.want : {}; S.sr = null; S.modal = null; $('#modal').hidden = true;
  if (!restGate(ch, 'short')) return;
  const c = derive(ch, S.hb); const P = ch.play; if (P.hp == null) P.hp = c.hpMax; const pools = hdPools(c, P); const det = []; let heal = 0;
  if (P.hp > 0) for (const pl of pools) { const n = Math.min(+want[pl.d] || 0, pl.n - pl.used); for (let i = 0; i < n; i++) { const r = rollExpr('1W' + pl.d); const g = Math.max(0, r.total + c.mod.con); heal += g; det.push('W' + pl.d + '[' + r.total + ']'); pl.used++; } }
  hdSync(c, P, pools); const old = P.hp; P.hp = Math.min(c.hpMax, P.hp + heal);
  if (det.length) pushLog({ label: 'Trefferwürfel', total: P.hp - old, detail: det.join(' ') + ' ' + sgn(c.mod.con) + ' KON je Würfel · TP ' + P.hp + '/' + c.hpMax, share: true });
  doRest(ch, 'short', false, true);
};
function restGate(ch, kind) {
  if (rule('restcombat') && inFight(ch)) { bannerToast('Keine Rast im Kampf', 'Beende zuerst den Kampf (oder schalte die Regeloption aus).'); return false; }
  if (kind === 'long' && rule('restzero') && ch.play.hp != null && +ch.play.hp <= 0 && !ch.play.dead) { bannerToast('Lange Rast nicht möglich', 'Bei 0 TP erhältst du keine Vorteile einer langen Rast. Stabilisiere und heile dich zuerst (z. B. Heilkunde-Probe, Heilzauber).'); return false; }
  return true;
}

/* ---------- Waffenmeisterschaften (SRD 5.2) ---------- */
function mastEff(ch, name, tgt) {
  if (!onlineFight() || !tgt || typeof effSave !== 'function') return false;
  const c = S.combat; effSave({ effects: (c.effects || []).concat([{ id: effUid(), name, src: 'p:' + UID, tgt, left: 1, at: 'start', t: Date.now() }]), log: clog(c, ch.name + ': ' + name + ' auf ' + partName(tgt)) });
  return true;
}
function masteryHit(ch, c, a, d) {
  const m = a.mastery; if (!m || !MASTERY[m] || a.ws) return {};
  const P = ch.play; const abm = c.mod[a.ab] || 0; const dc = 8 + abm + c.pb; const tg = d.tgt;
  if (m === 'topple') return { note: 'Umwerfen: KON-Rettungswurf SG ' + dc + ', sonst liegt das Ziel', prompt: tg ? '<div class="pr"><b>Umwerfen (SG ' + dc + ')</b><p>Misslingt dem Ziel der KON-Rettungswurf? ' + slTag() + '</p><div class="chips end"><button class="btn ghost" data-act="mastNo">Geschafft</button><button class="btn" data-act="mastProne" data-arg="' + tg + '">Misslungen – Ziel liegt</button></div></div>' : '' };
  if (m === 'push') return { note: 'Stoss: Ziel (gross oder kleiner) bis 3 m wegstossen – Position und Grösse prüft die Spielleitung' };
  if (m === 'sap') return { note: 'Schwächen: Ziel hat Nachteil auf seinen nächsten Angriff vor deinem nächsten Zug' + (mastEff(ch, 'Geschwächt (Nachteil auf nächsten Angriff)', tg) ? ' (als Effekt eingetragen)' : '') };
  if (m === 'slow') return { note: 'Verlangsamen: Bewegung des Ziels −3 m bis zu deinem nächsten Zug' + (mastEff(ch, 'Verlangsamt (−3 m Bewegung)', tg) ? ' (als Effekt eingetragen)' : '') };
  if (m === 'vex') { if (tg) fxSet(P, 'vex', tg); return { note: 'Bedrängen: Vorteil auf deinen nächsten Angriff gegen dieses Ziel' + (tg ? ' (wird automatisch angewendet)' : '') }; }
  if (m === 'cleave' && a.melee && !d.cleave && !onceUsed(ch, 'cleave')) return { note: 'Durchspalten möglich', prompt: '<div class="pr"><b>Durchspalten</b><p>Greife eine zweite Kreatur in 1,5 m vom ersten Ziel an (1× pro Zug, Schaden ohne Attributsmodifikator).</p><div class="chips end"><button class="btn ghost" data-act="mastNo">Nein</button><button class="btn" data-act="cleave" data-arg="' + d.i + '">Zweites Ziel angreifen</button></div></div>' };
  return {};
}
XA.mastNo = () => orbPrompt('');
XA.mastProne = (t, a) => { orbPrompt(''); const c = S.combat; if (!c || !a.startsWith('n:')) return; const id = a.slice(2); saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).map((n) => n.id === id ? Object.assign({}, n, { cond: [...new Set((n.cond || []).concat(['prone']))] }) : n), t: Date.now(), log: clog(c, partName(a) + ' wird umgeworfen') })); };
XA.cleave = (t, a, p, ch) => { orbPrompt(''); onceMark(ch, 'cleave'); weaponAttack(ch, +a, { cleave: true, bonusPaid: true }); };
function grazeMiss(ch) {
  const d = S.dp; if (!d) return; const c = derive(ch, S.hb); const a = d.a || c.attacks[d.i];
  if (!a || a.mastery !== 'graze' || a.ws) return; const v = Math.max(0, c.mod[a.ab] || 0);
  if (v) pushLog({ label: a.name + ': Streifen', total: v, detail: 'Verfehlt, aber Meisterschaft Streifen: ' + v + ' ' + (a.dtype || '') + 'schaden (gilt auch bei einer natürlichen 1)', share: true });
}

/* ---------- Wahrer Schlag ---------- */
XA.tsGo = (t, a, p, ch) => { orbPrompt(''); const ts = S.tsPend; S.tsPend = null; if (ts) weaponAttack(ch, +a, { bonusPaid: true, trueStrike: ts }); };

/* ---------- Heilung auf ein Ziel anwenden ---------- */
function healPrompt(ch, amount, name, multi) {
  S.healPend = { amount, name, multi, done: [] };
  const tg = onlineFight() ? order().filter((x) => x.key !== 'p:' + UID && x.npc) : [];
  const pl = S.camp ? Object.entries(S.table).filter(([u]) => u !== UID) : [];
  orbPrompt('<div class="pr"><b>' + esc(name) + ': ' + amount + ' TP Heilung</b><p>Auf wen' + (multi ? ' (mehrere möglich)' : '') + '? Trefferpunkte steigen höchstens bis zum Maximum.</p><div class="chips"><button class="btn sm" data-act="healGo" data-arg="me">Auf mich</button>' +
    tg.map((x) => '<button class="btn sm ghost" data-act="healGo" data-arg="' + x.key + '">' + esc(x.name) + (x.hpMax ? ' (' + x.hp + '/' + x.hpMax + ')' : '') + '</button>').join('') +
    pl.map(([u, p]) => '<button class="btn sm ghost" data-act="healGo" data-arg="u:' + u + '">' + esc(p.char) + ' (meldet die Heilung)</button>').join('') +
    '<button class="btn sm ghost" data-act="healGo" data-arg="x">' + (multi ? 'Fertig' : 'Nur gewürfelt') + '</button></div></div>');
}
XA.healGo = (t, a, p, ch) => {
  const h = S.healPend; if (!h) return orbPrompt('');
  if (a === 'x') { S.healPend = null; return orbPrompt(''); }
  if (a === 'me') { const c = derive(ch, S.hb); const P = ch.play; if (P.dead) return; if (P.hp == null) P.hp = c.hpMax; if (P.hp <= 0) { P.ds = [0, 0]; P.stable = false; wakeUp(P); } const old = P.hp; P.hp = Math.min(c.hpMax, P.hp + h.amount); pushLog({ label: h.name + ' → ' + ch.name, total: P.hp - old, detail: 'TP jetzt ' + P.hp + '/' + c.hpMax, share: true }); commit(false); }
  else if (a.startsWith('n:')) { const c = S.combat; const id = a.slice(2); const n = (c.npcs || []).find((x) => x.id === id); if (n) { const max = +n.hpMax || 0; const nh = max ? Math.min(max, (+n.hp || 0) + h.amount) : (+n.hp || 0) + h.amount; saveCombat(Object.assign({}, c, { npcs: c.npcs.map((x) => x.id === id ? Object.assign({}, x, { hp: nh }) : x), t: Date.now(), log: clog(c, n.name + ' wird um ' + h.amount + ' TP geheilt') })); } }
  else if (a.startsWith('u:')) { const pl = S.table[a.slice(2)]; pushLog({ label: h.name + ' → ' + (pl ? pl.char : 'Mitspieler'), total: h.amount, detail: 'Heilung für ' + (pl ? pl.char : 'Mitspieler') + ' – bitte auf dem eigenen Bogen eintragen', share: true }); }
  if (!h.multi) { S.healPend = null; orbPrompt(''); } else { h.done.push(a); render(); }
};

/* ---------- Andauernde Zauber mit Folgeaktion in späteren Zügen ---------- */
const FOLLOW = {
  'spiritual-weapon': { cost: 'b', n: 'Geistige Waffe: bewegen & angreifen', atk: true, expr: (L, m) => (1 + Math.max(0, L - 2)) + 'W8' + (m ? (m > 0 ? '+' : '-') + Math.abs(m) : '') },
  'call-lightning': { cost: 'a', n: 'Blitz herbeirufen: neuer Blitz', save: 'GES', expr: (L) => (3 + Math.max(0, L - 3)) + 'W10' },
  'heat-metal': { cost: 'b', n: 'Metall erhitzen: erneut Schaden', save: null, expr: (L) => (2 + Math.max(0, L - 2)) + 'W8' },
  'flaming-sphere': { cost: 'b', n: 'Flammende Kugel bewegen', save: 'GES', expr: (L) => (2 + Math.max(0, L - 2)) + 'W6' },
  'witch-bolt': { cost: 'b', n: 'Hexenblitz: erneut Schaden', save: null, expr: (L) => (1 + Math.max(0, L - 1)) + 'W12' },
  'vampiric-touch': { cost: 'a', n: 'Vampirgriff: erneut angreifen', atk: true, expr: (L) => (3 + Math.max(0, L - 3)) + 'W6' }
};
for (const [id, f] of Object.entries(FOLLOW)) {
  FX_SPELL[id] = 'fo_' + id; FX_DUR['fo_' + id] = id === 'witch-bolt' || id === 'spiritual-weapon' || id === 'flaming-sphere' || id === 'vampiric-touch' || id === 'heat-metal' ? 10 : 100;
  FEAT_ACTIONS.push({ id: 'fo_' + id, n: f.n, cost: f.cost, when: (c) => !!(c.char.play.fx || {})['fo_' + id], sub: f.save ? f.save + '-Rettungswurf' : 'Zauberangriff', run: (ch, c) => {
    const s = getSpell(id); const L = +((ch.play.fx || {})['fo_' + id + '_L']) || s.lvl; const ctx = spellCtx(c, id); const expr = f.expr(L, ctx.mod);
    if (f.atk) return spellAttack(ch, s, 1, expr, '', '', ctx.atk);
    rollDmg(expr, s.name + (f.save ? ' (' + f.save + '-RW SG ' + ctx.dc + ', halber Schaden bei Erfolg)' : ''));
  } });
}

/* ---------- Schaden auf ein Ziel anwenden (Spielleitung/Spieler bestätigt Resistenz usw.) ---------- */
function applyPrompt(tgt, amount, label, next) {
  const t = order().find((x) => x.key === tgt); if (!t) { orbPrompt(next || ''); return; }
  S.applyPend = { tgt, amount, next };
  orbPrompt('<div class="pr"><b>' + esc(label) + ': ' + amount + ' Schaden auf ' + esc(t.name) + (t.hpMax ? ' (' + t.hp + '/' + t.hpMax + ' TP)' : '') + '</b><p>Anwenden? Resistenz, Immunität und Verwundbarkeit des Ziels kennt die Spielleitung – wähle entsprechend. ' + slTag() + '</p><div class="chips"><button class="btn" data-act="applyDmg" data-arg="1">Voll (' + amount + ')</button><button class="btn ghost" data-act="applyDmg" data-arg="0.5">Halb · Resistenz (' + Math.floor(amount / 2) + ')</button><button class="btn ghost" data-act="applyDmg" data-arg="2">Doppelt · Verwundbar (' + amount * 2 + ')</button><button class="btn ghost" data-act="applyDmg" data-arg="0">Immun (0)</button><button class="btn ghost" data-act="applyDmg" data-arg="x">Nicht anwenden</button></div></div>');
}
XA.applyDmg = (t, a) => {
  const pd = S.applyPend; S.applyPend = null; if (!pd) return orbPrompt('');
  if (a !== 'x') { const c = S.combat; const id = pd.tgt.slice(2); const n = (c.npcs || []).find((x) => x.id === id); const dmg = Math.floor(pd.amount * +a);
    if (n) { const hp = n.hp != null ? Math.max(0, (+n.hp || 0) - dmg) : n.hp; saveCombat(Object.assign({}, c, { npcs: c.npcs.map((x) => x.id === id ? Object.assign({}, x, { hp }) : x), t: Date.now(), log: clog(c, n.name + ' erleidet ' + dmg + ' Schaden' + (hp != null ? ' (TP ' + hp + ')' : '')) })); } }
  orbPrompt(pd.next || '');
};

function freshId() { let id; do { const u = new Uint32Array(2); try { crypto.getRandomValues(u); } catch (e) { u[0] = Date.now(); u[1] = Math.floor(Math.random() * 4e9); } id = 'c' + u[0].toString(36) + u[1].toString(36); } while (S.chars[id]); return id; }
/* ---------- Automatische Sicherung wiederherstellen (fügt Kopien hinzu, überschreibt nichts) ---------- */
function backupInfo() { try { const raw = localStorage.getItem('heldenbuch_backup_v1'); if (!raw) return null; const d = JSON.parse(raw); return { n: Object.keys(d.chars || {}).length, raw }; } catch (e) { return null; } }
XA.restoreBackup = () => {
  const b = backupInfo(); if (!b) return;
  const d = JSON.parse(b.raw); let n = 0;
  for (const c0 of Object.values(d.chars || {})) { if (validateChar(c0).length) continue; const c = normChar(JSON.parse(JSON.stringify(c0))); c.id = freshId(); c.name = (c.name || 'Held') + ' (Sicherung)'; S.chars[c.id] = c; persist('c', c.id); n++; }
  S.modal = null; $('#modal').hidden = true; S.view = 'heroes'; render(); pushLog({ label: 'Sicherung', total: n, detail: n + ' Held(en) aus der automatischen Sicherung als Kopie hinzugefügt – bestehende Helden unverändert.' });
};

/* Zauberausbruch: Jede gewürfelte 8 lässt einen weiteren W8 explodieren (auch Folgewürfe), höchstens Zaubermodifikator zusätzliche Würfel */
function burstExplode(r, cap) {
  const g = (r.groups || []).find((x) => x.sides === 8); if (!g || cap <= 0) return r;
  let pending = g.rolls.filter((v) => v === 8).length; const extra = [];
  while (pending > 0 && extra.length < cap) { const v = 1 + Math.floor(rnd() * 8); extra.push(v); pending--; if (v === 8) pending++; }
  if (extra.length) { const add = extra.reduce((a, b) => a + b, 0); r.total += add; r.groups.push({ sides: 8, rolls: extra, sign: 1 }); r.detail += ' + Explosion ' + extra.length + 'W8[' + extra.join(',') + ']' + (extra.length >= cap && pending > 0 ? ' (Höchstzahl ' + cap + ' erreicht)' : ''); }
  return r;
}
