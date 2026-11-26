/* ==== Claude-Brücke: Werkzeuge, mit denen Claude Desktop das Heldenbuch liest und für die Spielleitung steuert ====
   In der PC-App reicht electron/main.js die Aufrufe von Claude Desktop (über electron/mcp-bruecke.js) hierher weiter.
   Tokens sparen: Alle Antworten sind kurz. «lage» liefert eine Übersicht, «lage» mit nur_neu nur die Änderungen
   seit dem letzten Aufruf, «nachschlagen» Details zu genau einem Namen. Grosse Texte nur mit voll=true. */
const BR_FOLD = (s) => String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function brFind(list, name, key) {
  const q = BR_FOLD(name); if (!q) return null; const k = (x) => BR_FOLD(key(x));
  const qt = q.split(' '); const tok = (x) => { const t = k(x).split(' '); return qt.every((w) => t.includes(w) || t.some((z) => z.startsWith(w) && w.length > 2)); };
  return list.find((x) => k(x) === q) || list.find((x) => k(x).startsWith(q)) || list.find((x) => k(x).includes(q)) || list.find(tok) || list.find((x) => q.includes(k(x)) && k(x).length > 2) || null;
}
const brTime = (t) => new Date(t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
const brCut = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + ' …' : s; };
const brBool = (v) => v === true || v === 'true' || v === 'ja' || v === 1;
function brNeedDM() { if (!S.camp) throw new Error('Kein Tisch offen. Öffne in der App den Tisch als Spielleitung.'); if (!isDM()) throw new Error('Das darf nur die Spielleitung.'); }
function brNeedFight() { brNeedDM(); if (!S.combat || !S.combat.active) throw new Error('Kein Kampf aktiv. Starte den Kampf in der App unter Tisch.'); return S.combat; }
const brCond = (list) => (list || []).map((k) => (COND[k] ? COND[k].name : k)).join(', ');
function brHero(p) {
  const hp = p.hp ?? '?'; const down = p.hpMax && +p.hp <= 0;
  return p.char + (p.clsName ? ' (' + p.clsName + ' ' + (p.level || '') + ')' : '') + ' TP ' + hp + '/' + (p.hpMax || '?') + (p.temp ? '+' + p.temp : '') + ' RK ' + (p.ac || '?') +
    (p.dead ? ' tot' : down ? ' bewusstlos' : '') + (p.cond && p.cond.length ? ' [' + p.cond.join(', ') + ']' : '');
}
function brScene() {
  try { const db = advDb(); const A = db.last && advGet(db.last); if (!A) return ''; const st = advSt(A.id); const C = advCh(A, st.ch); const Sc = advSc(C, st.sc); return 'Abenteuer «' + A.title + '»' + (C.title ? ' · ' + C.title : '') + ' · Szene «' + Sc.title + '»'; } catch (e) { return ''; }
}
/* Was seit dem letzten Aufruf dazukam: Würfe, Kampfprotokoll, Ansagen der Spieler, Chronik */
function brNews(max) {
  const since = S.brSince || 0; const ev = [];
  try { for (const [, p] of players()) for (const r of (p && p.rolls) || []) if (r.t > since && (!r.secret || isDM())) ev.push({ t: r.t, x: 'Wurf ' + p.char + ': ' + r.label + ' ' + r.total + (r.detail ? ' (' + brCut(r.detail, 60) + ')' : '') }); } catch (e) {}
  for (const r of S.log || []) if (r.t > since) ev.push({ t: r.t, x: 'Wurf SL: ' + r.label + ' ' + r.total + (r.secret ? ' (verdeckt)' : '') });
  for (const l of (S.combat && S.combat.log) || []) if (l.t > since) ev.push({ t: l.t, x: 'Kampf: ' + l.x });
  try { for (const a of ansOpenList()) if (a.t > since) ev.push({ t: a.t, x: 'Ansage ' + a.who + ': «' + brCut(a.x, 200) + '»' }); } catch (e) {}
  try { for (const c of chrList()) if (c.t > since && !/^(kampf|kende)$/.test(c.k)) ev.push({ t: c.t, x: 'Chronik: ' + brCut(c.x, 140) }); } catch (e) {}
  ev.sort((a, b) => a.t - b.t); const cut = ev.slice(-(max || 10));
  return (ev.length > cut.length ? ['(' + (ev.length - cut.length) + ' ältere ausgelassen)'] : []).concat(cut.map((e) => brTime(e.t) + ' ' + e.x));
}
function brLage(a) {
  if (brBool(a.voll)) { const t = slLage('').replace(SL_ROLE, '').trim(); S.brSince = Date.now(); return t; }
  const nur = brBool(a.nur_neu); const L = [];
  if (!nur) {
    L.push('Stand ' + brTime(Date.now()) + (S.camp ? ' · Tisch ' + S.camp + (isDM() ? ' (du leitest)' : ' (du spielst)') : ' · kein Tisch offen'));
    const sc = brScene(); if (sc) L.push(sc);
    const c = S.combat;
    if (c && c.active) {
      const o = order(); const cu = curEntry();
      L.push('Kampf Runde ' + (c.round || 1) + (cu ? ', am Zug: ' + cu.name : ''));
      L.push('Initiative: ' + o.map((x) => (cu && x.key === cu.key ? '▶' : '') + x.name + ' ' + x.v + ' ' + (x.npc ? 'TP ' + x.hp + '/' + x.hpMax + ' RK ' + x.ac + (x.cond.length ? ' [' + brCond(x.cond) + ']' : '') + (x.hpMax > 0 && x.hp <= 0 ? ' besiegt' : '') : 'TP ' + x.hp + '/' + x.hpMax + (x.dead ? ' tot' : ''))).join(' | '));
      const res = (c.npcs || []).filter((n) => n.reserve); if (res.length) L.push('Verstärkung wartet: ' + res.map((n) => n.name).join(', '));
      const wt = typeof waiting === 'function' ? waiting() : []; if (wt.length) L.push('Ohne Initiative: ' + wt.map((w) => w.name).join(', '));
    } else if (S.camp) L.push('Kein Kampf.');
    if (S.camp) { const H = players().filter(([, p]) => p && p.char); if (H.length) L.push('Helden: ' + H.map(([, p]) => brHero(p)).join(' | ')); }
    else { const ch = cur(); if (ch) { try { const d = derive(ch, S.hb); L.push('Held: ' + ch.name + ' (' + d.classLabel + ') TP ' + (ch.play.hp ?? d.hpMax) + '/' + d.hpMax + ' RK ' + d.ac); } catch (e) {} } }
    try { const A = kbList().filter((x) => x.typ === 'a' && x.st === 'offen'); if (A.length) L.push('Offene Aufträge: ' + A.slice(0, 6).map((x) => x.n).join(' · ')); } catch (e) {}
  }
  const nw = brNews(S.brSince ? 10 : 5);
  if (nw.length) L.push((nur ? '' : 'Neu' + (S.brSince ? ' seit ' + brTime(S.brSince) : '') + ':\n') + nw.join('\n'));
  else if (nur) L.push('Nichts Neues seit ' + (S.brSince ? brTime(S.brSince) : 'Beginn') + '.');
  S.brSince = Date.now();
  return L.join('\n');
}
/* Werteblock eines Monsters, kurz */
function brStat(M, x) {
  const at = (M[7] || []).map((a) => a[0] + ' ' + sgn(a[1]) + ' (' + a[2] + ' ' + a[3] + ')').join(' · ');
  return (x ? x.name + ' (' + M[0] + ', HG ' + M[1] + ')' : M[0] + ' (HG ' + M[1] + ')') + ': RK ' + (x ? x.ac : M[2]) + ', TP ' + (x ? x.hp + '/' + x.hpMax : M[3] + ' (' + M[4] + ')') + ', Bewegung ' + M[5] + (x && x.cond && x.cond.length ? ', Zustände: ' + brCond(x.cond) : '') +
    (at ? '\nAngriffe: ' + at : '') + (M[8] ? '\nMerkmale: ' + brCut(M[8], 600) : '') + (x && x.note ? '\nNotiz: ' + brCut(x.note, 200) : '');
}
function brLook(a) {
  const q = String(a.was || '').trim(); if (!q) throw new Error('Was soll ich nachschlagen?'); const f = BR_FOLD(q);
  const kbAll = (() => { try { return kbList(); } catch (e) { return []; } })();
  if (f === 'chronik') { const L = chrList().slice(-15); return L.length ? L.map((c) => brTime(c.t) + ' ' + brCut(c.x, 160)).join('\n') : 'Die Chronik ist leer.'; }
  const typ = { personen: 'p', orte: 'o', auftraege: 'a', auftrage: 'a' }[f];
  if (typ) { const L = kbAll.filter((x) => x.typ === typ); return L.length ? L.map((x) => x.n + ' [' + kbStName(x) + (x.frei ? ', bekannt' : '') + ']' + (x.d ? ': ' + x.d : '') + (x.g ? ' (geheim: ' + brCut(x.g, 120) + ')' : '')).join('\n') : 'Noch keine ' + KB_TYP[typ][0] + '.'; }
  const c = S.combat;
  const npc = c && c.active ? brFind(c.npcs || [], q, (n) => n.name) : null; if (npc && BESTIARY[npc.mid]) return brStat(BESTIARY[npc.mid], npc);
  if (S.camp) { const p = brFind(players().map(([, p]) => p).filter((p) => p && p.char), q, (p) => p.char); if (p) return brHero(p) + (p.pl ? ', gespielt von ' + p.pl : '') + (p.species ? ', ' + p.species : '') + (p.pas ? '\nPassive Wahrnehmung ' + p.pas[0] + ', Motiv erkennen ' + p.pas[1] + ', Nachforschungen ' + p.pas[2] : '') + '\n(Den ganzen Bogen hat nur der Spieler.)'; }
  const ch = brFind(Object.values(S.chars || {}), q, (x) => x.name);
  if (ch) { try { const d = derive(ch, S.hb); return ch.name + ' (' + d.classLabel + ', ' + d.sp.name + ') TP ' + (ch.play.hp ?? d.hpMax) + '/' + d.hpMax + ' RK ' + d.ac + ', Init ' + sgn(d.init) + '\nAttribute: ' + ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => (AB_K[k] || k) + ' ' + d.abil[k]).join(' '); } catch (e) {} }
  const kb = brFind(kbAll, q, (x) => x.n); if (kb) return KB_TYP[kb.typ][1] + ' «' + kb.n + '» [' + kbStName(kb) + (kb.frei ? ', den Spielern bekannt' : ', den Spielern unbekannt') + ']' + (kb.d ? '\n' + kb.d : '') + (kb.g ? '\nGeheim: ' + kb.g : '');
  const mob = brFind(Object.entries(BESTIARY), q, ([, M]) => M[0]); if (mob) return brStat(mob[1]);
  const sp = brFind(Object.values(SPELLS), q, (s) => s.name) || brFind(Object.values(SPELLS), q, (s) => s.en || ''); if (sp) return sp.name + ' (' + (sp.lvl ? 'Grad ' + sp.lvl : 'Zaubertrick') + (sp.conc ? ', Konzentration' : '') + (sp.ritual ? ', Ritual' : '') + '): ' + sp.time + ', ' + sp.range + ', ' + sp.comp + ', ' + sp.dur + '\n' + brCut(String(sp.text).replace(/<[^>]+>/g, ''), 900);
  const cd = brFind(Object.values(COND), q, (x) => x.name); if (cd) return cd.name + ': ' + cd.text;
  return 'Nichts gefunden zu «' + q + '». Versuch einen anderen Namen.';
}
function brNote(a) {
  const t = brCut(a.text, 500); if (!t) throw new Error('Kein Text.');
  if (S.camp && !isDM()) throw new Error('Die Chronik führt die Spielleitung.');
  chrAdd('notiz', t, true); if (S.modal === 'chronik') chrOpen(true);
  return 'Notiert in der Chronik (' + chrWhere().name + ').';
}
function brBook(a) {
  const T = { person: 'p', ort: 'o', auftrag: 'a', p: 'p', o: 'o', a: 'a' }[BR_FOLD(a.typ)]; if (!T) throw new Error('typ: person, ort oder auftrag');
  const name = brCut(a.name, 80); if (!name) throw new Error('Name fehlt.');
  if (S.camp && !isDM()) throw new Error('Das Buch führt die Spielleitung.');
  const key = kbKey(); const L = kbList(key); const now = Date.now();
  let x = L.find((e) => e.typ === T && BR_FOLD(e.n) === BR_FOLD(name)) || brFind(L.filter((e) => e.typ === T), name, (e) => e.n); let neu = false, stCh = false, frei = false;
  if (!x) { x = { id: uidX(), typ: T, n: name, d: '', g: '', st: KB_ST[T][0][0], frei: false, t: now, u: now }; L.push(x); neu = true; }
  if (a.kurz != null) x.d = brCut(a.kurz, 160);
  if (a.geheim != null) x.g = String(a.geheim).slice(0, 600);
  if (a.stand) { const s = KB_ST[T].find(([k, l]) => BR_FOLD(k) === BR_FOLD(a.stand) || BR_FOLD(l) === BR_FOLD(a.stand)); if (!s) throw new Error('Stand für ' + KB_TYP[T][1] + ': ' + KB_ST[T].map((z) => z[1]).join(', ')); if (x.st !== s[0]) { x.st = s[0]; stCh = !neu || T === 'a'; } }
  if (a.spieler_wissen != null) { const v = brBool(a.spieler_wissen); if (v && !x.frei) frei = true; x.frei = v; }
  x.u = now; kbSave(key, L); if (neu) kbChr(x, 'neu'); if (stCh) kbChr(x, 'st'); if (frei) kbChr(x, 'frei'); kbShare();
  if (S.modal === 'chronik') chrOpen(true);
  return (neu ? 'Angelegt: ' : 'Geändert: ') + KB_TYP[T][1] + ' «' + x.n + '» [' + kbStName(x) + (x.frei ? ', die Spieler wissen davon' : '') + ']';
}
function brSend(a) {
  brNeedDM(); const text = String(a.text || '').trim().slice(0, 2500); if (!text) throw new Error('Kein Text.');
  const title = brCut(a.titel || 'Von der Spielleitung', 80);
  saveMeta({ handouts: ((S.meta && S.meta.handouts) || []).concat([{ id: uidX(), title, text, t: Date.now() }]).slice(-20) });
  try { chrAdd('handout', 'Handout «' + title + '»: ' + brCut(text, 120)); } catch (e) {}
  return 'An alle Spieler geschickt: «' + title + '». Sie sehen es unter Handouts.';
}
function brMob(a) {
  const c = brNeedFight(); const act = BR_FOLD(a.aktion);
  if (act === 'hinzufuegen') {
    const m = brFind(Object.entries(BESTIARY), a.name, ([, M]) => M[0]) || (BESTIARY[a.name] ? [a.name, BESTIARY[a.name]] : null);
    if (!m) throw new Error('«' + a.name + '» steht nicht im Bestiarium. Mit nachschlagen findest du ähnliche Namen.');
    const n = Math.max(1, Math.min(12, Math.round(+a.anzahl || 1))); const before = new Set((c.npcs || []).map((x) => x.id));
    encInsert([{ mid: m[0], n }], 'Claude', { groupInit: n > 1, rollHp: false, surprised: false, reserve: false });
    const add = ((S.combat && S.combat.npcs) || []).filter((x) => !before.has(x.id));
    return n + '× ' + m[1][0] + ' im Kampf: ' + add.map((x) => x.name + ' (Initiative ' + x.v + ', TP ' + x.hp + ', RK ' + x.ac + ')').join(', ');
  }
  const x = brFind(c.npcs || [], a.name, (n) => n.name); if (!x) throw new Error('Kein Gegner «' + a.name + '» im Kampf. Im Kampf: ' + ((c.npcs || []).map((n) => n.name).join(', ') || 'keine'));
  const M = BESTIARY[x.mid] || null;
  if (act === 'angriff') {
    if (!M || !(M[7] || []).length) throw new Error(x.name + ' hat keine Angriffe im Bestiarium.');
    const at = a.angriff ? brFind(M[7], a.angriff, (z) => z[0]) : M[7][0]; if (!at) throw new Error('Angriffe von ' + x.name + ': ' + M[7].map((z) => z[0]).join(', '));
    const tg = npcTargets(); const t = a.ziel ? brFind(tg, a.ziel, (z) => z.name) : null; if (a.ziel && !t) throw new Error('Ziel «' + a.ziel + '» nicht am Tisch. Ziele: ' + tg.map((z) => z.name).join(', '));
    const m0 = S.mode; const v = BR_FOLD(a.vorteil); S.mode = v === 'vorteil' ? 'adv' : v === 'nachteil' ? 'dis' : 'normal';
    let tot, e; try { tot = rawD20(at[1], x.name + ': ' + at[0], true, { app: true }); e = S.log[0]; } finally { S.mode = m0; }
    if (typeof npcAtkCount === 'function') npcAtkCount(x.id);
    const nat = e && e.nat; const roll = x.name + ': ' + at[0] + ' ' + tot + ' (' + (e ? e.detail : '') + ')';
    if (!t) return roll + '. Kein Ziel angegeben: ob das trifft, entscheidest du; Schaden wäre ' + at[2] + ' ' + at[3] + '.';
    const ac = +t.ac || 0; const hit = nat === 20 || (nat !== 1 && ac && tot >= ac);
    if (!hit) { pushLog({ label: x.name + ': ' + at[0], total: 'verfehlt', detail: t.name + ' (RK ' + ac + ')', share: true }); saveCombat(Object.assign({}, S.combat, { t: Date.now(), log: clog(S.combat, x.name + ' verfehlt ' + t.name) })); return roll + ' gegen ' + t.name + ' RK ' + ac + ': verfehlt' + (nat === 1 ? ' (natürliche 1)' : '') + '.'; }
    const crit = nat === 20; rollDmg(crit ? critExpr(at[2]) : at[2], x.name + ': ' + at[0] + (crit ? ' · kritisch' : '') + ' (' + at[3] + ')'); const amt = +S.log[0].total || 0;
    const h = { by: x.name + ': ' + at[0], amount: amt, dtype: at[3], crit, atk: tot, nat, t: Date.now() };
    const uid = t.k === 'me' ? UID : t.k.slice(2);
    if (uid === UID) { if (typeof hitPrompt === 'function') setTimeout(() => hitPrompt(h), 200); }
    else { const c2 = S.combat; saveCombat(Object.assign({}, c2, { hits: ((c2.hits || []).concat([Object.assign({ to: uid }, h)])).slice(-20), t: Date.now(), log: clog(c2, x.name + ' trifft ' + t.name + ': ' + amt + ' ' + at[3]) })); }
    return roll + ' gegen ' + t.name + ' RK ' + ac + ': Treffer' + (crit ? ' (kritisch)' : '') + ', ' + amt + ' ' + at[3] + '. ' + t.name + ' bekommt den Treffer zum Eintragen angezeigt.';
  }
  if (act === 'schaden' || act === 'heilen') {
    const n = Math.max(0, Math.round(+a.wert || 0)); if (!n) throw new Error('wert fehlt (Anzahl TP).');
    let dead = false; updNpc(x.id, (y) => { const hp = act === 'heilen' ? Math.min(y.hpMax, y.hp + n) : Math.max(0, y.hp - n); dead = hp <= 0 && y.hp > 0; y.hp = hp; return y; }, x.name + ': ' + (act === 'heilen' ? '+' : '−') + n + ' TP');
    const y = S.combat.npcs.find((z) => z.id === x.id) || x; if (dead) saveCombat(Object.assign({}, S.combat, { t: Date.now(), log: clog(S.combat, x.name + ' ist besiegt') }));
    return x.name + ': TP ' + y.hp + '/' + y.hpMax + (dead ? ' – besiegt' : '');
  }
  if (act === 'zustand') {
    const cd = brFind(Object.entries(COND), a.zustand, ([, z]) => z.name); if (!cd) throw new Error('Zustände: ' + Object.values(COND).map((z) => z.name).join(', '));
    const off = brBool(a.entfernen); updNpc(x.id, (y) => { const cs = (y.cond || []).filter((k) => k !== cd[0]); if (!off) cs.push(cd[0]); y.cond = cs; return y; }, x.name + (off ? ' nicht mehr ' : ': ') + cd[1].name);
    const y = S.combat.npcs.find((z) => z.id === x.id) || x; return x.name + ': ' + (brCond(y.cond) || 'keine Zustände');
  }
  throw new Error('aktion: hinzufuegen, angriff, schaden, heilen oder zustand');
}
function brNext() {
  brNeedFight(); nextTurn(); const cu = curEntry(); if (!cu) return 'Niemand ist am Zug.';
  if (cu.npc) { const x = (S.combat.npcs || []).find((n) => n.id === cu.id); const M = x && BESTIARY[x.mid]; return 'Runde ' + (S.combat.round || 1) + ': ' + cu.name + ' ist am Zug. ' + (M ? brStat(M, x) : 'TP ' + cu.hp + '/' + cu.hpMax); }
  const p = (players().find(([u]) => 'p:' + u === cu.key) || [])[1];
  return 'Runde ' + (S.combat.round || 1) + ': ' + cu.name + ' ist am Zug' + (p ? ' – ' + brHero(p) : '') + '.';
}
function brRoll(a) {
  const ex = String(a.ausdruck || '').replace(/\s/g, '').replace(/[dD]/g, 'W'); if (!/^[+-]?(\d*W\d+|\d+)([+-](\d*W\d+|\d+))*$/.test(ex)) throw new Error('Ausdruck wie W20, 2W6+3 oder 1W8-1.');
  const r = rollExpr(ex); const label = brCut(a.wofuer || ex, 60); const vd = brBool(a.verdeckt);
  pushLog({ label, total: r.total, detail: r.detail, secret: vd || undefined, share: !vd });
  return label + ': ' + r.total + ' (' + r.detail + ')' + (vd ? ' – verdeckt' : '');
}
const BR_TOOLS = { lage: brLage, nachschlagen: brLook, notieren: brNote, buch: brBook, an_spieler: brSend, gegner: brMob, naechster_zug: brNext, wuerfeln: brRoll };
async function hbTool(name, args) {
  const f = BR_TOOLS[name]; if (!f) throw new Error('Unbekanntes Werkzeug: ' + name);
  S.brLast = Date.now(); S.brN = (S.brN || 0) + 1;
  const out = String(await f(args && typeof args === 'object' ? args : {}));
  try { if (!S.modal || S.modal === 'slh') render(); if (S.modal === 'slh') slOpen(true); } catch (e) {}
  return out.length > 8000 ? out.slice(0, 8000) + ' …' : out;
}
/* PC-App: Aufrufe von Claude Desktop annehmen, Verbinden-Knopf im Claude-Fenster */
if (typeof window !== 'undefined' && window.hbDesk) {
  window.hbDesk.onTool(async (m) => { try { window.hbDesk.reply(m.id, { ok: true, text: await hbTool(m.name, m.args) }); } catch (e) { window.hbDesk.reply(m.id, { ok: false, text: String((e && e.message) || e) }); } });
}
function brDeskBox() {
  if (typeof window === 'undefined' || !window.hbDesk) return '';
  const r = S.brRes; const ago = S.brLast ? Math.max(0, Math.round((Date.now() - S.brLast) / 60000)) : null;
  return '<details class="fgrp brdesk"' + (S.brOpen || r ? ' open' : '') + '><summary><b>Claude Desktop</b> <small>' + (ago == null ? 'Fablecrown direkt aus Claude steuern' : 'Claude war ' + (ago < 1 ? 'eben' : 'vor ' + ago + ' Min.') + ' da (' + S.brN + ' Aufrufe)') + '</small></summary>' +
    '<p class="hint">Claude Desktop liest den Tisch selbst (Lage, Kampf, Chronik, Personen) und kann für dich Gegner würfeln, Notizen und Handouts schreiben. Läuft über dein Claude-Abo, ohne Zusatzkosten. Die PC-App muss dabei offen sein.</p>' +
    (r ? '<p class="' + (r.ok ? 'okc' : 'badc') + '">' + esc(r.msg) + '</p>' + (r.snippet ? '<details><summary>Eintrag zum Kopieren (falls nötig)</summary><pre class="brsn">' + esc(r.snippet) + '</pre><button class="btn ghost sm" data-act="brCopy">Kopieren</button></details>' : '') : '') +
    '<div class="chips"><button class="btn sm" data-act="brConnect">' + (r && r.ok ? 'Erneut eintragen' : 'Mit Claude Desktop verbinden') + '</button></div>' +
    '<p class="hint"><b>Tokens sparen:</b> Für den Spielabend Sonnet oder Haiku wählen statt Opus, Denkaufwand niedrig. Pro Abend einen neuen Chat beginnen. Claude fragt zuerst die kurze Lage ab und danach nur noch, was neu ist.</p></details>';
}
if (typeof slOpen === 'function') { const _brSl0 = slOpen; slOpen = function () { const r = _brSl0.apply(this, arguments); const h = brDeskBox(); if (h) { const hint = document.querySelector('#modal .sldlg > .hint'); if (hint) hint.insertAdjacentHTML('afterend', h); } return r; }; }
document.addEventListener('toggle', (ev) => { const d = ev.target; if (d && d.classList && d.classList.contains('brdesk')) S.brOpen = d.open; }, true);
Object.assign(XA, {
  brConnect: async () => {
    if (!window.hbDesk) return; S.brRes = { ok: true, msg: 'Trage ein …' }; slOpen(true);
    try { const r = await window.hbDesk.connect(); S.brRes = { ok: !!r.ok, msg: r.msg || (r.ok ? 'Eingetragen.' : 'Ging nicht.'), snippet: r.snippet || '' }; }
    catch (e) { S.brRes = { ok: false, msg: 'Ging nicht: ' + ((e && e.message) || e) }; }
    slOpen(true);
  },
  brCopy: async (t) => { const s = (S.brRes && S.brRes.snippet) || ''; const ok = typeof slCopy === 'function' ? await slCopy(s) : false; if (t) t.textContent = ok ? 'Kopiert ✓' : 'Kopieren ging nicht'; }
});
