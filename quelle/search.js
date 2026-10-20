/* ==== Globale Suche (P02): Zauber, Talente, Fähigkeiten, Gegenstände, Regeln, Monster … ==== */
const RULES = [
  ['Vorteil und Nachteil', 'Bei Vorteil würfelst du zwei W20 und nimmst den höheren, bei Nachteil den niedrigeren. Hast du beides, heben sie sich auf – egal wie viele Quellen.'],
  ['Kurze Rast', 'Mindestens 1 Stunde ruhen. Du kannst Trefferwürfel ausgeben (je W + KON-Mod TP), und manche Fähigkeiten kehren zurück.'],
  ['Lange Rast', 'Mindestens 8 Stunden (davon höchstens 2 Stunden leichte Tätigkeit). Danach: alle TP, alle Trefferwürfel, alle Zauberplätze, Erschöpfung −1. Höchstens eine lange Rast pro 24 Stunden.'],
  ['Todesrettungswurf', 'Bei 0 TP würfelst du zu Beginn jedes Zuges einen W20: 10+ Erfolg, darunter Fehlschlag, eine 1 zählt doppelt, eine 20 bringt dich mit 1 TP zurück. Drei Erfolge: stabil. Drei Fehlschläge: tot. Schaden bei 0 TP = ein Fehlschlag (Krit: zwei).'],
  ['Konzentration', 'Nur ein Konzentrationszauber gleichzeitig. Nimmst du Schaden, KON-Rettungswurf SG 10 oder halber Schaden (höchstens 30), sonst endet der Zauber. Kampfunfähig oder tot beendet sie ebenfalls.'],
  ['Erschöpfung', 'Stufen 1–6. Pro Stufe −2 auf alle W20-Tests und −1,5 m Bewegung. Bei Stufe 6 stirbst du. Eine lange Rast senkt die Stufe um 1.'],
  ['Deckung', 'Halbe Deckung: +2 auf RK und GES-Rettungswürfe. Dreivierteldeckung: +5. Volle Deckung: Du kannst nicht direkt anvisiert werden.'],
  ['Gelegenheitsangriff', 'Verlässt eine Kreatur, die du siehst, deine Reichweite, darfst du als Reaktion einen Nahkampfangriff gegen sie machen. Rückzug, Teleport oder unfreiwillige Bewegung lösen keinen aus.'],
  ['Kritischer Treffer', 'Eine natürliche 20 beim Angriff trifft immer und ist kritisch: Alle Schadenswürfel des Angriffs werden doppelt gewürfelt, Modifikatoren nicht. Eine natürliche 1 verfehlt immer.'],
  ['Überraschung', 'Wer zu Beginn des Kampfs überrascht ist, hat Nachteil auf seinen Initiativewurf.'],
  ['Initiative', 'Zu Beginn des Kampfs: GES-Wurf (W20 + Initiative). Die Reihenfolge gilt für den ganzen Kampf.'],
  ['Zwei Waffen', 'Greifst du mit einer leichten Waffe an, darfst du als Bonusaktion mit einer anderen leichten Waffe angreifen – ohne Attributsmodifikator zum Schaden (ausser negativ), ausser mit dem Kampfstil Kampf mit zwei Waffen.'],
  ['Packen', 'Statt eines waffenlosen Schadens: Das Ziel (höchstens eine Grössenkategorie grösser) macht einen STÄ- oder GES-Rettungswurf gegen SG 8 + STÄ-Mod + ÜB oder ist gepackt.'],
  ['Stossen', 'Statt eines waffenlosen Schadens: STÄ- oder GES-Rettungswurf gegen SG 8 + STÄ-Mod + ÜB, sonst 1,5 m weggestossen oder liegend.'],
  ['Fallschaden', '1W6 Wuchtschaden pro 3 m Fall, höchstens 20W6. Du landest liegend, wenn du Schaden nimmst.'],
  ['Schwieriges Gelände', 'Jeder Meter kostet einen zusätzlichen Meter Bewegung.'],
  ['Heldeninspiration', 'Hast du Heldeninspiration, darfst du einen W20-Test neu würfeln und musst das neue Ergebnis nehmen. Man kann sie nur einmal gleichzeitig haben.'],
  ['Zauber mit Bonusaktion', 'Wirkst du in einem Zug einen Zauber mit Zauberplatz, darfst du keinen weiteren Zauber mit Zauberplatz wirken – Zaubertricks sind erlaubt.'],
  ['Ritual', 'Ein Zauber mit Ritual-Kennzeichen kann 10 Minuten länger gewirkt werden und verbraucht dann keinen Zauberplatz (er muss vorbereitet sein, ausser beim Magier).']
];
const SRCH_CAT = { spell: 'Zauber', feat: 'Talent', cls: 'Klasse', sub: 'Unterklasse', feature: 'Klassenmerkmal', species: 'Spezies', item: 'Gegenstand', weapon: 'Waffe', armor: 'Rüstung', cond: 'Zustand', rule: 'Regel', monster: 'Monster', inv: 'Anrufung', option: 'Klassenoption', bg: 'Hintergrund', mastery: 'Meisterschaft', action: 'Aktion', home: 'Hausregel' };
const SRC_DE = { srd: 'SRD 5.2', phb: 'Spielerhandbuch 2024 (nicht SRD)', eigen: '✦ eigene Erfindung', haus: 'Hausregel' };
const fold = (s) => String(s || '').toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
let SRCH_IDX = null;
function srchIndex() {
  if (SRCH_IDX) return SRCH_IDX;
  const L = []; const add = (cat, id, name, sub, text, src, extra) => L.push(Object.assign({ cat, id, name, sub: sub || '', text: text || '', src: src || 'srd' }, extra || {}));
  for (const s of Object.values(SPELLS)) add('spell', s.id, s.name, (s.lvl ? 'Grad ' + s.lvl : 'Zaubertrick') + ' · ' + SCHOOL[s.school] + ' · ' + s.classes.map((k) => (CLASSES[k] || {}).name).filter(Boolean).join(', '), s.time + ' · ' + s.range + ' · ' + s.comp + ' · ' + s.dur + (s.conc ? ' (Konzentration)' : '') + '\n' + s.text + (s.mat ? '\nMaterial: ' + s.mat : ''), 'srd', { en: s.en });
  for (const [id, f] of Object.entries(FEATS)) add('feat', id, f.name, { origin: 'Herkunftstalent', general: 'Allgemeines Talent', style: 'Kampfstil', epic: 'Epische Gabe' }[f.cat] || '', f.text, f.orig ? 'eigen' : f.src || 'srd');
  for (const [cid, C] of Object.entries(CLASSES)) {
    const src = C.home ? 'eigen' : 'srd';
    add('cls', cid, C.name, 'W' + C.hd + ' · ' + C.prim.map((a) => AB_K[a]).join('/') + (C.caster ? ' · Zauber' : ''), (C.flavor || '').replace(/^✦ /, '') + '\nUnterklassen: ' + (C.subs || [C.sub]).map((x) => x.name.replace('✦ ', '')).join(', '), src);
    (C.subs || [Object.assign({ feats: C.subFeats }, C.sub)]).forEach((sb) => add('sub', cid + ':' + sb.id, sb.name.replace('✦ ', ''), C.name + ' · Unterklasse', (sb.desc || '').replace(/^✦ /, '') + '\n' + sb.feats.map(([lv, n]) => 'Stufe ' + lv + ': ' + n).join('\n'), C.home || /✦/.test(sb.name) ? 'eigen' : 'srd'));
    C.feats.forEach(([lv, n, t]) => add('feature', cid + ':' + n, n, C.name + ' · Stufe ' + lv, t, src));
    const subs = C.subs || [{ name: C.sub.name, feats: C.subFeats }];
    subs.forEach((sb) => sb.feats.forEach(([lv, n, t]) => add('feature', cid + ':' + sb.name + ':' + n, n, C.name + ' · ' + sb.name.replace('✦ ', '') + ' · Stufe ' + lv, t, C.home || /✦/.test(sb.name) ? 'eigen' : 'srd')));
    if (C.options) Object.entries(C.options.list).forEach(([k, v]) => add('option', cid + ':' + k, v[0], C.options.label + ' · ' + C.name + ' · ab Stufe ' + (v.length === 4 ? v[3] : v[2]), v.length === 4 ? v[1] + ': ' + v[2] : v[1], 'eigen'));
  }
  for (const [k, sp] of Object.entries(SPECIES)) { let tr = []; try { tr = sp.traits(derive(newChar({ species: k, level: 5 }), {})); } catch (e) {} add('species', k, sp.name, sp.size + ' · ' + fmtM(sp.speed) + (sp.dv ? ' · Dunkelsicht ' + sp.dv + ' m' : ''), (sp.flavor ? sp.flavor.replace(/^✦ /, '') + '\n' : '') + tr.map(([n, t]) => n + ': ' + t).join('\n'), sp.home ? 'eigen' : 'srd'); }
  for (const [k, b] of Object.entries(BACKGROUNDS)) if (k !== 'custom') add('bg', k, b.name, (b.abil || []).map((a) => AB_K[a]).join(', '), (b.flavor ? b.flavor + '\n' : '') + 'Talent: ' + ((FEATS[b.feat] || {}).name || '') + '\nFertigkeiten: ' + (b.skills || []).map((s) => SKILLS[s][0]).join(', ') + '\nWerkzeug: ' + b.tool + '\nAusrüstung: ' + b.equip);
  if (typeof MAGIC_ITEMS !== 'undefined') for (const [k, d] of Object.entries(MAGIC_ITEMS)) add('item', k, d.name, d.r + (d.att ? ' · Einstimmung' : ''), d.text);
  for (const [k, W] of Object.entries(WEAPONS)) add('weapon', k, W[0], (W[1] === 's' ? 'Einfache' : 'Kriegs') + (W[2] === 'ranged' ? 'fernkampf' : 'nahkampf') + 'waffe · ' + W[3] + ' ' + DT[W[4]], 'Eigenschaften: ' + (W[5].map((x) => PROP_DE[x]).join(', ') || '—') + (W[7] ? ' (' + W[7] + ' m)' : '') + (W[8] ? ' · vielseitig ' + W[8] : '') + '\nMeisterschaft: ' + MASTERY[W[6]][0] + ' – ' + MASTERY[W[6]][1]);
  for (const [k, A] of Object.entries(ARMOR)) if (k !== 'none') add('armor', k, A.name, { light: 'Leichte', medium: 'Mittelschwere', heavy: 'Schwere' }[A.type] + ' Rüstung · RK ' + A.ac + (A.type === 'light' ? ' + GES' : A.type === 'medium' ? ' + GES (max 2)' : ''), (A.str ? 'Stärke ' + A.str + ' nötig. ' : '') + (A.stealth ? 'Nachteil auf Heimlichkeit. ' : '') + A.kg + ' kg');
  for (const [k, m] of Object.entries(MASTERY)) add('mastery', k, m[0], 'Waffenmeisterschaft', m[1]);
  for (const [k, c] of Object.entries(COND)) add('cond', k, c.name, 'Zustand', c.text);
  for (const [k, v] of Object.entries(INVOCATIONS)) add('inv', k, v[0], 'Hexenmeister · ab Stufe ' + v[2], v[1]);
  if (typeof BESTIARY !== 'undefined') for (const [k, M] of Object.entries(BESTIARY)) add('monster', k, M[0], 'HG ' + M[1] + ' · RK ' + M[2] + ' · TP ' + M[3] + ' (' + M[4] + ') · ' + M[5], M[7].map(([n, b, d, t]) => n + ': ' + sgn(b) + ', ' + d + ' ' + t).join('\n') + (M[8] ? '\n' + M[8] : ''), /✦/.test(M[0]) ? 'eigen' : 'srd');
  RULES.forEach(([n, t], i) => add('rule', 'r' + i, n, 'Regel', t));
  if (typeof STD_ACTIONS !== 'undefined') STD_ACTIONS.forEach(([id, n, k, sub]) => add('action', id, n, 'Aktion', sub));
  L.forEach((e) => { e.fn = fold(e.name); e.fe = fold(e.en); e.ft = fold(e.sub + ' ' + e.text); });
  SRCH_IDX = L; return L;
}
function srchAll() { const L = srchIndex().slice(); for (const h of Object.values(S.hb || {})) { const e = { cat: 'home', id: h.id, name: h.name, sub: (typeof HB_KIND !== 'undefined' ? HB_KIND[h.kind] : h.kind) || '', text: h.text || '', src: 'haus', hbKind: h.kind }; e.fn = fold(e.name); e.fe = ''; e.ft = fold(e.sub + ' ' + e.text); L.push(e); } return L; }
function srchRun(q, cat, src) {
  const words = fold(q).split(/\s+/).filter(Boolean); const L = srchAll();
  const out = [];
  for (const e of L) {
    if (cat && e.cat !== cat && !(cat === 'feature' && e.cat === 'option')) continue; if (src && e.src !== src) continue;
    let score = 0, ok = true;
    for (const w of words) { if (e.fn.startsWith(w)) score += 10; else if (e.fn.includes(w)) score += 6; else if (e.fe.includes(w)) score += 5; else if (e.ft.includes(w)) score += 1; else { ok = false; break; } }
    if (!ok) continue; if (!words.length) score = 1;
    out.push([score, e]);
  }
  return out.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name, 'de')).slice(0, 60).map((x) => x[1]);
}
function openSearch() {
  S.sq = S.sq || { q: '', cat: '', src: '' };
  const m = $('#modal'); S.modal = 'search';
  m.innerHTML = '<div class="dlg srchdlg" role="dialog" aria-modal="true" aria-label="Suche"><div class="srchtop"><input type="search" id="srchQ" placeholder="Zauber, Talent, Fähigkeit, Gegenstand, Regel, Monster …" value="' + esc(S.sq.q) + '" autocomplete="off" aria-label="Suchbegriff"><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<div class="chips srchcats">' + [['', 'Alles']].concat(Object.entries(SRCH_CAT).filter(([k]) => k !== 'option')).map(([k, l]) => chip(S.sq.cat === k, l, 'data-act="srchCat" data-arg="' + k + '"')).join('') + '</div>' +
    '<div class="chips srchcats">' + [['', 'Alle Quellen'], ['srd', 'SRD 5.2'], ['eigen', '✦ eigene'], ['haus', 'Hausregeln']].map(([k, l]) => chip(S.sq.src === k, l, 'data-act="srchSrc" data-arg="' + k + '"')).join('') + '</div>' +
    '<div id="srchRes" class="srchres"></div></div>';
  m.hidden = false; srchPaint(); const i = $('#srchQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function srchPaint() {
  const el = $('#srchRes'); if (!el) return; const q = S.sq.q;
  if (!q.trim() && !S.sq.cat) { el.innerHTML = '<p class="hint">Tippe einen Begriff – z. B. „Feuerball“, „gepackt“, „Rast“ oder „Goblin“. Auch englische Zaubernamen funktionieren.</p>'; return; }
  const r = srchRun(q, S.sq.cat, S.sq.src);
  el.innerHTML = r.length ? r.map((e, i) => '<button class="srow" data-act="srchOpen" data-arg="' + i + '"><span class="scat">' + SRCH_CAT[e.cat] + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.sub) + (e.src !== 'srd' ? ' · ' + SRC_DE[e.src] : '') + '</small></button>').join('') : '<p class="hint">Nichts gefunden.</p>';
  S.srchLast = r;
}
function srchDetail(e) {
  const ch = cur(); const lead = S.camp && (!S.meta.dm || isDM());
  const acts = [];
  if (e.cat === 'cond' && ch) acts.push('<button class="btn sm" data-act="cond" data-arg="' + e.id + '">' + ((ch.play.cond || []).includes(e.id) ? 'Bei mir entfernen' : 'Auf meinen Helden setzen') + '</button>');
  if (e.cat === 'item' && ch) acts.push('<button class="btn sm" data-act="srchItem" data-arg="' + e.id + '">Ins Inventar von ' + esc(ch.name.replace(/^Beispiel:\s*/, '')) + '</button>');
  if (e.cat === 'monster' && lead && S.combat && S.combat.active) acts.push('<button class="btn sm" data-act="srchMob" data-arg="' + e.id + '">Zum Kampf hinzufügen</button>');
  if (e.cat === 'spell') { const d = ch && derive(ch, S.hb); if (d && d.spell.byId && d.spell.byId[e.id]) acts.push('<span class="hint" style="margin:0">Dein Held kennt diesen Zauber.</span>'); const dice = d ? spellDice(getSpell(e.id), getSpell(e.id).lvl, d, (d.spell && d.spell.mod) || 0) : null; if (dice) acts.push('<button class="btn sm ghost" data-act="dmg" data-expr="' + esc(dice) + '" data-label="' + esc(e.name) + '">Würfeln: ' + esc(dice) + '</button>'); }
  if (e.cat === 'monster') { const M = BESTIARY[e.id]; M[7].forEach(([n, b, d]) => acts.push('<button class="btn sm ghost" data-act="xroll" data-atk="1" data-mod="' + b + '" data-label="' + esc(M[0] + ': ' + n) + '">' + esc(n) + ' ' + sgn(b) + '</button><button class="btn sm ghost" data-act="dmg" data-expr="' + esc(d) + '" data-label="' + esc(M[0] + ': ' + n + ' Schaden') + '">' + esc(d) + '</button>')); }
  const m = $('#modal'); S.modal = 'search';
  m.innerHTML = '<div class="dlg srchdlg" role="dialog" aria-modal="true" aria-label="' + esc(e.name) + '"><div class="dph"><button class="link" data-act="srchBack">← Zurück zur Suche</button><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<span class="scat">' + SRCH_CAT[e.cat] + ' · ' + SRC_DE[e.src] + '</span><h2 class="sdh">' + esc(e.name) + (e.en ? ' <small lang="en">' + esc(e.en) + '</small>' : '') + '</h2><p class="hint" style="margin-top:0">' + esc(e.sub) + '</p>' +
    e.text.split('\n').map((p) => '<p>' + esc(p) + '</p>').join('') + (acts.length ? '<div class="chips">' + acts.join('') + '</div>' : '') + '</div>';
  m.hidden = false;
}
Object.assign(XA, {
  srchOpen: (t, a) => { const e = (S.srchLast || [])[+a]; if (e) srchDetail(e); },
  srchBack: () => openSearch(),
  srchCat: (t, a) => { S.sq.cat = a; openSearch(); },
  srchSrc: (t, a) => { S.sq.src = a; openSearch(); },
  search: () => openSearch(),
  srchItem: (t, a, p, ch) => { if (!ch) return; ch.items = ch.items || []; const d = MAGIC_ITEMS[a]; const ex = d.cons && ch.items.find((x) => x.id === a && !x.label); if (ex) ex.qty = (+ex.qty || 1) + 1; else ch.items.push({ uid: uidX(), id: a, att: false, eq: true, qty: 1, w: '' }); bannerToast('Ins Inventar gelegt', d.name); commit(false); },
  srchMob: (t, a) => { const M = BESTIARY[a]; const c = S.combat; if (!M || !c) return; const same = (c.npcs || []).filter((x) => x.mid === a).length; const r = 1 + Math.floor(rnd() * 20); const npc = { id: uidX(), mid: a, name: M[0] + (same ? ' ' + (same + 1) : ''), v: r + M[6], dex: M[6], hp: M[3], hpMax: M[3], ac: M[2] }; saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).concat([npc]), t: Date.now(), log: clog(c, npc.name + ' tritt dem Kampf bei (Initiative ' + npc.v + ')') })); bannerToast('Zum Kampf hinzugefügt', npc.name + ' · Initiative ' + npc.v); }
});
document.addEventListener('input', (ev) => { if (ev.target && ev.target.id === 'srchQ') { S.sq.q = ev.target.value; srchPaint(); } });
document.addEventListener('keydown', (ev) => {
  const tag = (ev.target && ev.target.tagName) || ''; const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if ((ev.key === 'k' && (ev.ctrlKey || ev.metaKey)) || (ev.key === '/' && !typing)) { ev.preventDefault(); openSearch(); }
  if (ev.key === 'Enter' && ev.target && ev.target.id === 'srchQ' && S.srchLast && S.srchLast[0]) { ev.preventDefault(); srchDetail(S.srchLast[0]); }
});
