/* ---------- Abenteuer: fertige Abenteuer am Tisch leiten ----------
   Kapitel und Szenen mit Vorlesetext, Hinweisen für die Spielleitung, Proben, Kämpfen und Beute.
   Kampf starten, Vorlesetext als Handout teilen und Beute ins Formular „Beute & Erfahrung verteilen“ – je ein Knopf.
   Eingebaut: „Die Machtader“ (adv-machtader.js). Weitere Abenteuer kommen per Datei (Feld extra.adv) dazu.
   Gespeichert in localStorage „hb_adv“: { list: [geladene Abenteuer], st: { <id>: { tab, ch, sc, flags, choice, t } }, last }
   Monster eines Abenteuers werden beim ersten Kampf als eigene Monster („u-…“) ins Bestiarium gelegt. */
const ADV_KEY = 'hb_adv';
const ADV_BUILTIN = typeof ADV_MACHTADER !== 'undefined' ? [ADV_MACHTADER] : [];
function advDb() {
  try { const d = JSON.parse(localStorage.getItem(ADV_KEY) || '{}') || {}; return { list: Array.isArray(d.list) ? d.list : [], st: d.st && typeof d.st === 'object' ? d.st : {}, last: d.last || '' }; }
  catch (e) { return { list: [], st: {}, last: '' }; }
}
function advSave(d) { try { localStorage.setItem(ADV_KEY, JSON.stringify(d)); return true; } catch (e) { bannerToast('Nicht gespeichert', 'Der Speicher dieses Browsers ist voll oder nicht verfügbar.'); return false; } }
const advNewer = (a, b) => (+a.ver || 0) >= (+b.ver || 0);
function advAll() { const own = advDb().list; return ADV_BUILTIN.filter((b) => !own.some((o) => o.id === b.id && advNewer(o, b))).concat(own); }
function advGet(id) { return advAll().find((a) => a.id === id) || null; }
const advIsOwn = (id) => advDb().list.some((a) => a.id === id);
function advValid(a) {
  return !!(a && typeof a.id === 'string' && /^[a-z0-9-]{1,40}$/.test(a.id) && typeof a.title === 'string' && a.title.trim() && Array.isArray(a.chapters) && a.chapters.length &&
    a.chapters.every((c) => c && typeof c.id === 'string' && Array.isArray(c.scenes) && c.scenes.length && c.scenes.every((s) => s && typeof s.id === 'string' && Array.isArray(s.blocks))));
}
/* Aus einer Datei: gültige Abenteuer übernehmen. Ist dieselbe oder eine neuere Fassung schon eingebaut, wird nichts gespeichert. */
function advImport(list) {
  const d = advDb(); let n = 0;
  (Array.isArray(list) ? list : []).forEach((a) => {
    if (!advValid(a)) return; n++;
    if (ADV_BUILTIN.some((b) => b.id === a.id && advNewer(b, a))) { d.list = d.list.filter((x) => x.id !== a.id); return; }
    const i = d.list.findIndex((x) => x.id === a.id); if (i >= 0) d.list[i] = a; else d.list.push(a);
  });
  if (n) advSave(d); return n;
}
const ADV_ST0 = () => ({ tab: 'ov', ch: '', sc: '', flags: {}, choice: {} });
function advSt(id) { const s = Object.assign(ADV_ST0(), advDb().st[id] || {}); if (!s.flags || typeof s.flags !== 'object') s.flags = {}; if (!s.choice || typeof s.choice !== 'object') s.choice = {}; return s; }
function advSetSt(id, fn) { const d = advDb(); const s = Object.assign(ADV_ST0(), d.st[id] || {}); s.flags = Object.assign({}, s.flags); s.choice = Object.assign({}, s.choice); fn(s); s.t = Date.now(); d.st[id] = s; d.last = id; advSave(d); }

if (typeof HELP !== 'undefined') HELP.abenteuer = ['Abenteuer leiten', [
  'Unter „Mehr → Abenteuer“ liegen fertige Abenteuer. Eingebaut ist „Die Machtader“ (fünf Helden, Stufe 3, 5 und 11). Weitere lädst du wie eine Sicherung über „Helden aus Datei laden“.',
  'Jede Szene hat farbige Kästen: Vorlesetext (bernstein), Spielleitung (blau), Probe (violett), Kampf (rot), Beute (grün), Merke dir und Entscheidung (gold).',
  'Als Spielleitung am Tisch: „Kampf beginnen“ setzt die Gegner mit Initiative in den Kampf, „Als Handout teilen“ schickt den Vorlesetext an alle, „Ins Beute-Formular“ füllt Gold und Gegenstände vor.',
  'Entscheidungen der Gruppe hältst du mit einem Tipp fest. Spätere Kapitel zeigen, was sie verändern. Fortschritt und Entscheidungen kommen mit „Alles sichern“ mit.']];

/* ---------- Hilfen ---------- */
const advMd = (s) => esc(String(s == null ? '' : s)).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
const advPlain = (s) => String(s == null ? '' : s).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
function advItems(list) {
  let h = '', ul = false;
  (list || []).forEach((x) => { const li = /^-\s+/.test(x); if (li && !ul) { h += '<ul>'; ul = true; } if (!li && ul) { h += '</ul>'; ul = false; } h += li ? '<li>' + advMd(x.replace(/^-\s+/, '')) + '</li>' : '<p>' + advMd(x) + '</p>'; });
  return h + (ul ? '</ul>' : '');
}
const advBox = (kind, icon, title, body, foot) => '<div class="advb ' + kind + '"><div class="advbt"><span aria-hidden="true">' + icon + '</span>' + advMd(title) + '</div><div class="advbb">' + body + '</div>' + (foot ? '<div class="advbf chips">' + foot + '</div>' : '') + '</div>';
const advCtx = () => ({ camp: !!S.camp, dm: typeof isDM === 'function' && isDM(), fight: !!(S.combat && S.combat.active) });
const advCh = (A, id) => A.chapters.find((c) => c.id === id) || A.chapters[0];
const advSc = (C, id) => C.scenes.find((s) => s.id === id) || C.scenes[0];
const advEnc = (A, id) => (A.enc || []).find((e) => e.id === id) || null;
const advMobName = (A, mid) => (BESTIARY[mid] ? BESTIARY[mid][0] : ((A.mobs || []).find((o) => 'u-' + o.id === mid) || {}).name || mid);
const advMobRaw = (A, mid) => (A.mobs || []).find((o) => 'u-' + o.id === mid) || null;
/* Pfad eines Blocks: Kapitelnummer.Szenennummer (oder i für die Kapiteleinleitung).Blocknummer */
function advBlockAt(A, path) {
  const [ci, si, bi] = String(path || '').split('.'); const C = A.chapters[+ci]; if (!C) return null;
  const list = si === 'i' ? C.intro || [] : (C.scenes[+si] || {}).blocks || []; const b = list[+bi];
  return b ? { b, C, Sc: si === 'i' ? null : C.scenes[+si] } : null;
}
/* Monster des Abenteuers ins Bestiarium legen (nur fehlende – eigene Änderungen bleiben) */
function advMobsInstall(A) {
  if (!A || !Array.isArray(A.mobs) || typeof ownMobs !== 'function') return 0; const list = ownMobs(); let n = 0;
  A.mobs.forEach((o) => { if (!o || !o.id || !o.name || !CR_XP[o.cr] || list.some((y) => y.id === o.id)) return; list.push(o); n++; });
  if (n) { ownMobsStore(list); ownMobsLoad(); } return n;
}
function advEncInstall(A) {
  if (!A || typeof encLoad !== 'function') return 0; const list = encLoad(); let n = 0;
  (A.enc || []).forEach((e) => { if (!e || !e.id || list.some((y) => y.id === e.id)) return; const x = { id: e.id, name: e.name, mobs: e.mobs, t: Date.now() - n }; list.push(x); n++; });
  if (n) encStore(list.slice(0, 60)); return n;
}
/* EP der Begegnung und Grenzen für fünf Helden (DMG 2024) */
function advXp(A, e, lv) {
  const xp = e.mobs.reduce((s, m) => { const M = BESTIARY[m.mid]; const r = advMobRaw(A, m.mid); const cr = M ? M[1] : r && r.cr; return s + (CR_XP[cr] || 0) * (+m.n || 1); }, 0);
  const B = typeof XP_BUDGET !== 'undefined' && XP_BUDGET[lv]; if (!B) return { xp, txt: xp + ' EP' };
  const [lo, mi, hi] = B.map((x) => x * 5); const cat = xp <= lo ? 'niedrig' : xp <= mi ? 'mittel' : xp <= hi ? 'hoch' : '„hoch“ überschritten';
  return { xp, txt: '<b>' + xp + ' EP · ' + cat + '</b> <small>für 5 Helden der Stufe ' + lv + ': niedrig ' + lo + ' · mittel ' + mi + ' · hoch ' + hi + '</small>' };
}
const advLevel = (C) => +((String(C.level || '').match(/\d+/g) || []).pop() || 0);

/* ---------- Entscheidungen ---------- */
function advFlagVal(A, st, id) { const f = (A.flags || []).find((x) => x.id === id); return f ? st.flags[id] || '' : ''; }
function advFlagChips(A, st, ids) {
  return '<div class="advfl">' + ids.map((id) => { const f = (A.flags || []).find((x) => x.id === id); if (!f) return ''; const v = st.flags[id] || '';
    return '<div class="advflr"><span>' + esc(f.label) + '</span><div class="chips">' + Object.keys(f.opts).map((o) => chip(v === o, esc(o), 'data-act="advFlag" data-arg="' + id + '" data-v="' + esc(o) + '"')).join('') + '</div></div>'; }).join('') + '</div>';
}
function advFlagList(A, st, ids) {
  return '<ul class="advfx">' + ids.map((id) => { const f = (A.flags || []).find((x) => x.id === id); if (!f) return ''; const v = st.flags[id];
    return '<li class="' + (v ? 'set' : 'open') + '"><b>' + esc(f.label) + ':</b> ' + (v ? '<span class="advfv">' + esc(v) + '</span> ' + advMd(f.opts[v] || '') : '<span class="advfv no">offen</span> <small>' + Object.entries(f.opts).filter(([, t]) => t).map(([o, t]) => esc(o) + ': ' + advMd(t)).join(' · ') + '</small>') + '</li>'; }).join('') + '</ul>';
}

/* ---------- Blöcke ---------- */
function advBlock(A, b, path, st, X, C) {
  const dmBtn = (act, label, extra) => (X.dm ? '<button class="btn sm' + (extra || '') + '" data-act="' + act + '" data-arg="' + path + '">' + label + '</button>' : '');
  switch (b.t) {
    case 'p': return '<p class="advp">' + advMd(b.x) + '</p>';
    case 'sub': return '<h4 class="advsub">' + advMd(b.x) + '</h4>';
    case 'label': return '<h4 class="advlab ' + esc(b.tone || '') + '">' + advMd(b.x) + '</h4>';
    case 'ol': return (b.ul ? '<ul' : '<ol') + ' class="advol">' + b.items.map((x) => '<li>' + advMd(x) + '</li>').join('') + (b.ul ? '</ul>' : '</ol>');
    case 'vorlese': return advBox('vor', '❧', b.title || 'Vorlesetext', b.ps.map((p) => '<p>' + advMd(p) + '</p>').join(''), dmBtn('advHo', 'Als Handout teilen', ' ghost'));
    case 'dm': return advBox('dm', '◆', b.title || 'Spielleitung', advItems(b.items));
    case 'merke': return advBox('wahl', '!', b.title || 'Merke dir', advItems(b.items) + (b.flags ? advFlagChips(A, st, b.flags) : ''));
    case 'loot': {
      const g = [b.gm && b.gm + ' GM für die Gruppe', b.gmHero && b.gmHero + ' GM je Held'].filter(Boolean).join(' + ');
      return advBox('loot', '✦', b.title || 'Beute', advItems(b.items) + (g ? '<p class="advgm">Gold: ' + g + '</p>' : '') + (b.flags ? advFlagChips(A, st, b.flags) : ''), dmBtn('advLoot', 'Ins Beute-Formular', ' ghost'));
    }
    case 'probe': return advBox('probe', '⚄', b.title, '<table class="advt">' + b.rows.map((r) => '<tr><th>' + advMd(r[0]) + '</th><td>' + advMd(r[1]) + '</td></tr>').join('') + '</table>');
    case 'table': return '<div class="advtw"><table class="advt ' + esc(b.tone || '') + '"><thead><tr>' + b.head.map((h) => '<th>' + advMd(h) + '</th>').join('') + '</tr></thead><tbody>' +
      b.rows.map((r) => '<tr>' + r.map((x, i) => (i === 0 && b.bf ? '<th>' : '<td>') + advMd(x) + (i === 0 && b.bf ? '</th>' : '</td>')).join('') + '</tr>').join('') + '</tbody></table></div>';
    case 'items': return '<div class="advtw"><table class="advt loot"><thead><tr><th>Name</th><th>Regel</th><th>Herkunft</th>' + (X.dm ? '<th></th>' : '') + '</tr></thead><tbody>' +
      b.rows.map((r, i) => '<tr><th>' + esc(r.name) + '</th><td>' + advMd(r.rule) + '</td><td>' + advMd(r.from) + '</td>' + (X.dm ? '<td><button class="btn sm ghost" data-act="advGive" data-arg="' + path + '" data-i="' + i + '">Geben</button></td>' : '') + '</tr>').join('') + '</tbody></table></div>';
    case 'choice': { const on = st.choice[b.key];
      return advBox('wahl', '!', 'Entscheidung · ' + b.title, '<div class="advchs">' + b.rows.map((r, i) => '<button class="advcho' + (on === i ? ' on' : '') + '" data-act="advChoice" data-arg="' + path + '" data-i="' + i + '" aria-pressed="' + (on === i) + '"><b>' + advMd(r.a) + '</b><span>' + advMd(r.b) + '</span></button>').join('') + '</div><p class="hint">Antippen hält die Entscheidung fest' + (Object.keys((b.rows[0] || {}).sets || {}).length ? ' und trägt sie bei „Merke dir“ ein' : '') + '.</p>'); }
    case 'flags': return advBox('wahl', '⚑', b.title || 'Eure Entscheidungen', advFlagList(A, st, b.ids) + '<p class="hint">Ändern kannst du sie in den Kästen „Merke dir“ der früheren Kapitel oder unter Übersicht.</p>');
    case 'kampf': return advKampf(A, b, path, X, C);
    default: return '';
  }
}
function advKampf(A, b, path, X, C) {
  const e = advEnc(A, b.enc); const lv = advLevel(C);
  const rows = [['Gegner', b.gegner], ['Gelände', b.gelaende], ['Taktik', b.taktik], ['Kampfende', b.ende]].filter((r) => r[1]);
  let body = '<table class="advt">' + rows.map((r) => '<tr><th>' + r[0] + '</th><td>' + advMd(r[1]) + '</td></tr>').join('') + '</table>';
  let foot = '';
  if (e) {
    body += '<div class="advmobs">' + e.mobs.map((m) => '<button class="advmob" data-act="advMob" data-arg="' + esc(m.mid) + '">' + (+m.n > 1 ? m.n + '× ' : '') + esc(advMobName(A, m.mid)) + '</button>').join('') + '</div>';
    body += '<p class="advxp">' + advXp(A, e, lv).txt + '</p>';
    if (e.reserve && e.reserve.length) body += '<p class="hint">Startest du den Kampf hier, warten ' + e.reserve.map((m) => esc(advMobName(A, m.mid))).join(' und ') + ' am Tisch als Verstärkung. Tippe dort auf „Einsetzen“, sobald Phase 2 beginnt.</p>';
    if (!X.camp) foot = '<span class="hint">Kämpfe startest du am Tisch, wenn du dort die Spielleitung hast.</span><button class="btn sm ghost" data-act="view" data-arg="camp">Zum Tisch</button>';
    else if (!X.dm) foot = '<span class="hint">Nur die Spielleitung startet Kämpfe.</span>';
    else foot = '<button class="btn sm" data-act="advFight" data-arg="' + path + '">' + (X.fight ? 'In den laufenden Kampf einsetzen' : '⚔ Kampf beginnen') + '</button>' +
      (X.fight ? '<button class="btn sm ghost" data-act="view" data-arg="camp">Zum Kampf</button>' : '') +
      (b.allies || []).map((x, i) => X.fight ? '<button class="btn sm ghost" data-act="advAlly" data-arg="' + path + '" data-i="' + i + '" title="' + esc(x.when || '') + '">+ ' + esc(x.name) + ' als Verbündeter</button>' : '').join('');
  }
  return advBox('kampf', '⚔', 'Kampf · ' + b.title, body, foot);
}

/* ---------- Ansichten ---------- */
function renderAdv() {
  const A = S.adv && advGet(S.adv); if (!A) { S.adv = null; return advLibrary(); }
  const st = advSt(A.id); const X = advCtx();
  const tabs = [['ov', 'Übersicht']].concat(A.chapters.map((c) => ['ch:' + c.id, c.kicker === 'Zwischenspiel' ? 'Zwischenspiel' + (c.level ? ' ' + c.level.replace(/\s/g, '') : '') : c.kicker])).concat([['fig', 'Figuren'], ['mob', 'Kreaturen']]);
  const cur = st.tab === 'ch' ? 'ch:' + advCh(A, st.ch).id : st.tab;
  let h = '<div class="camp adv"><div class="advhead"><button class="link" data-act="advLib">‹ Alle Abenteuer</button><h1>' + esc(A.title) + '</h1>' + (A.meta ? '<p class="hint">' + esc(A.meta) + '</p>' : '') + '</div>' +
    '<nav class="advnav chips" aria-label="Kapitel">' + tabs.map(([k, l]) => chip(cur === k, esc(l), 'data-act="advTab" data-arg="' + k + '"')).join('') + '</nav>';
  if (st.tab === 'fig') h += advFigures(A);
  else if (st.tab === 'mob') h += advCreatures(A, X);
  else if (st.tab === 'ch') h += advChapter(A, st, X);
  else h += advOverview(A, st, X);
  return h + '</div>';
}
function advLibrary() {
  const all = advAll(); const d = advDb();
  return '<div class="camp adv"><div class="hero-intro banner" style="' + bannerStyle('waldlaeufer') + '"><h1>Abenteuer</h1><p>Fertige Abenteuer zum Leiten: Kapitel für Kapitel mit Vorlesetexten, Proben, Kämpfen auf Knopfdruck und Beute.</p></div>' +
    '<section class="blk"><div class="bhead"><h2>Deine Abenteuer</h2>' + (typeof helpBtn === 'function' ? helpBtn('abenteuer') : '') + '</div><div class="advlib">' + all.map((A) => { const st = d.st[A.id]; const where = st && st.tab === 'ch' ? (() => { const C = advCh(A, st.ch); const Sc = advSc(C, st.sc); return C.kicker + ' · ' + Sc.title; })() : '';
      return '<article class="advcard"><h2>' + esc(A.title) + '</h2>' + (A.sub ? '<p class="advsubt">' + esc(A.sub) + '</p>' : '') + (A.meta ? '<p class="hint">' + esc(A.meta) + '</p>' : '') + (A.quote ? '<p class="advq">' + esc(A.quote) + '</p>' : '') +
        (where ? '<p class="advwhere">Weiter bei: <b>' + esc(where) + '</b></p>' : '') +
        '<div class="chips"><button class="btn" data-act="advOpen" data-arg="' + esc(A.id) + '">' + (where ? 'Weiterlesen' : 'Öffnen') + '</button>' +
        (advIsOwn(A.id) ? (S.advDel === A.id ? '<button class="btn sm ghost warn" data-act="advDel" data-arg="' + esc(A.id) + '">Wirklich entfernen?</button>' : '<button class="btn sm ghost" data-act="advDel" data-arg="' + esc(A.id) + '">Entfernen</button>') : '') + '</div></article>'; }).join('') + '</div>' +
    '<p class="hint">Weitere Abenteuer lädst du wie eine Sicherung: <b>Helden → Helden aus Datei laden</b>. Fortschritt und Entscheidungen bleiben auf diesem Gerät und kommen mit „Alles sichern“ mit.</p></section></div>';
}
function advOverview(A, st, X) {
  let h = '<section class="blk advch"><div class="advkick">Übersicht</div><h2>' + esc(A.title) + '</h2>' + (A.quote ? '<p class="advq">' + esc(A.quote) + '</p>' : '');
  if (A.overview) h += advBlock(A, { t: 'table', tone: 'figur', head: A.overview.head, rows: A.overview.rows }, '', st, X, {});
  h += '<div class="chips advgo"><button class="btn" data-act="advTab" data-arg="ch:' + esc((A.chapters.find((c) => c.id === st.ch) || A.chapters[0]).id) + '">' + (st.ch ? 'Weiterlesen' : 'Mit dem ' + esc(A.chapters[0].kicker) + ' beginnen') + ' ›</button></div>';
  if ((A.flags || []).length) h += advBox('wahl', '⚑', 'Entscheidungen der Gruppe', advFlagChips(A, st, A.flags.map((f) => f.id)) + '<p class="hint">Sie verändern spätere Kapitel. Die Kästen „Merke dir“ und „Entscheidung“ tragen sie automatisch ein.</p>');
  h += advBox('dm', '◆', 'So leitest du mit dem Heldenbuch', advItems([
    '- **Vorlesetext** liest du vor. Mit „Als Handout teilen“ landet er bei allen am Tisch.',
    '- **Kampf beginnen** setzt die Gegner mit Initiative in den Kampf am Tisch. Werte, Aufladung und legendäre Aktionen kennt das Heldenbuch.',
    '- **Ins Beute-Formular** füllt „Beute & Erfahrung verteilen“ vor. Gold rechnet es auf die Helden am Tisch um.',
    '- Kämpfe und Handouts brauchen einen Tisch, an dem du die Spielleitung hast.',
  ]));
  if (A.srd) h += '<p class="hint advsrd">' + esc(A.srd) + '</p>';
  h += '<div class="chips"><button class="btn sm ghost" data-act="advPrep">Monster und Begegnungen ins Bestiarium</button>' + (S.advReset === A.id ? '<button class="btn sm ghost warn" data-act="advReset">Wirklich alles zurücksetzen?</button>' : '<button class="btn sm ghost" data-act="advReset">Fortschritt zurücksetzen</button>') + '</div>';
  return h + '</section>';
}
function advChapter(A, st, X) {
  const C = advCh(A, st.ch); const ci = A.chapters.indexOf(C); const Sc = advSc(C, st.sc); const si = C.scenes.indexOf(Sc);
  let h = '<section class="blk advch"><div class="advkick">' + esc(C.kicker) + (C.level && !/Stufe/.test(C.sub || '') ? ' · Stufe ' + esc(C.level) : '') + '</div><h2>' + esc(C.title) + '</h2>' + (C.sub ? '<p class="hint">' + esc(C.sub) + '</p>' : '');
  h += (C.intro || []).map((b, bi) => advBlock(A, b, ci + '.i.' + bi, st, X, C)).join('');
  if (C.scenes.length > 1) h += '<nav class="advscn" aria-label="Szenen">' + C.scenes.map((s, i) => '<button class="' + (i === si ? 'on' : '') + '" data-act="advScene" data-arg="' + esc(s.id) + '"><span>' + (i + 1) + '</span>' + esc(s.title) + '</button>').join('') + '</nav>';
  h += '<h3 class="advsc" id="advSc">' + (C.scenes.length > 1 ? '<small>Szene ' + (si + 1) + ' von ' + C.scenes.length + '</small>' : '') + esc(Sc.title) + '</h3>';
  h += Sc.blocks.map((b, bi) => advBlock(A, b, ci + '.' + si + '.' + bi, st, X, C)).join('');
  const prev = si > 0 ? C.scenes[si - 1].title : ci > 0 ? A.chapters[ci - 1].kicker : ''; const next = si < C.scenes.length - 1 ? C.scenes[si + 1].title : ci < A.chapters.length - 1 ? A.chapters[ci + 1].kicker + ' · ' + A.chapters[ci + 1].title : '';
  h += '<div class="advpn">' + (prev ? '<button class="btn ghost" data-act="advStep" data-arg="-1">‹ ' + esc(prev) + '</button>' : '<span></span>') + (next ? '<button class="btn" data-act="advStep" data-arg="1">' + esc(next) + ' ›</button>' : '') + '</div>';
  return h + '</section>';
}
function advFigures(A) {
  return '<section class="blk advch"><div class="advkick">Anhang</div><h2>Die Figuren</h2><div class="advfigs">' + (A.figures || []).map((f) => '<article class="advfig"><header><b>' + esc(f.name) + '</b><small>' + esc(f.role || '') + '</small></header>' +
    (f.fields || []).map(([k, v]) => '<p><b>' + esc(k) + ':</b> ' + advMd(v) + '</p>').join('') + (f.quote ? '<p class="advq">' + esc(f.quote) + '</p>' : '') + '</article>').join('') + '</div></section>';
}
function advCreatures(A, X) {
  const L = A.lore || {}; const groups = {}; (A.mobs || []).forEach((o) => { const ch = (L[o.id] || {}).ch || ''; (groups[ch] = groups[ch] || []).push(o); });
  const chName = (id) => { const c = A.chapters.find((x) => x.id === id); return c ? c.kicker + ' · ' + c.title : 'Weitere'; };
  return '<section class="blk advch"><div class="advkick">Anhang</div><h2>Kreaturen</h2><p class="hint">Antippen zeigt Aussehen, Geschichte, Kampfweise und Schwächen. Die vollen Werte stehen im Bestiarium unter „✎ Eigene“.</p>' +
    Object.entries(groups).map(([ch, list]) => '<h3 class="advsc">' + esc(chName(ch)) + '</h3><div class="advmobs big">' + list.map((o) => '<button class="advmob" data-act="advMob" data-arg="u-' + esc(o.id) + '"><b>' + esc(o.name) + '</b><small>HG ' + esc(o.cr) + ' · RK ' + o.ac + ' · TP ' + o.hp + '</small></button>').join('') + '</div>').join('') +
    '<div class="chips"><button class="btn sm ghost" data-act="advPrep">Monster und Begegnungen ins Bestiarium</button></div>' + (A.srd ? '<p class="hint advsrd">' + esc(A.srd) + '</p>' : '') + '</section>';
}
function advMobModal(A, mid) {
  const o = advMobRaw(A, mid); const M = BESTIARY[mid]; const L = (A.lore || {})[mid.replace(/^u-/, '')] || {}; if (!o && !M) return;
  const name = M ? M[0] : o.name; const cr = M ? M[1] : o.cr; const ac = M ? M[2] : o.ac; const hp = M ? M[3] : o.hp; const spd = M ? M[5] : o.spd; const txt = M ? M[8] : o.txt; const atks = M ? M[7] : o.atks || [];
  const m = $('#modal'); S.modal = 'advMob';
  m.innerHTML = '<div class="dlg advdlg" role="dialog" aria-modal="true" aria-label="' + esc(name) + '"><h2>' + esc(L.title || name) + '</h2><p class="hint">HG ' + esc(cr) + ' (' + (CR_XP[cr] || 0) + ' EP) · RK ' + ac + ' · TP ' + hp + ' · ' + esc(spd) + '</p>' +
    (L.look ? '<p><b>Aussehen:</b> ' + advMd(L.look) + '</p>' : '') + (L.lore ? '<p><b>Geschichte:</b> ' + advMd(L.lore) + '</p>' : '') + (L.fight ? '<p><b>Im Kampf:</b> ' + advMd(L.fight) + '</p>' : '') +
    '<p><b>Angriffe:</b> ' + atks.map((a) => esc(a[0]) + ' ' + sgn(a[1]) + ' (' + esc(a[2]) + ' ' + esc(a[3]) + ')').join(' · ') + '</p>' +
    (L.weak && L.weak.length ? advBox('schwach', '⚡', 'Schwächen', advItems(L.weak.map((w) => '- ' + w))) : '') +
    '<details class="advraw"><summary>Werte und Fähigkeiten</summary><p>' + esc(txt) + '</p></details>' +
    '<div class="chips"><button class="btn ghost" data-act="closeModal">Schliessen</button><button class="btn" data-act="advBest" data-arg="' + esc(name) + '">Im Bestiarium</button></div></div>';
  m.hidden = false;
}
/* Leiste für die Spielleitung am Tisch: zurück ins laufende Abenteuer */
function advCampBar() {
  if (!(typeof isDM === 'function' && isDM())) return ''; const d = advDb(); const A = d.last && advGet(d.last); if (!A) return ''; const st = advSt(A.id); if (st.tab !== 'ch') return '';
  const C = advCh(A, st.ch); const Sc = advSc(C, st.sc);
  return '<div class="advbar"><span aria-hidden="true">📖</span><span><b>' + esc(A.title) + '</b> · ' + esc(C.kicker) + ' · ' + esc(Sc.title) + '</span><button class="btn sm ghost" data-act="advResume">Weiterlesen ›</button></div>';
}
if (typeof dmTools === 'function') { const _advDm0 = dmTools; dmTools = function () { const h = _advDm0.apply(this, arguments); return h ? advCampBar() + h : h; }; }

/* ---------- Aktionen ---------- */
function advGoScene() { render(); const el = $('#advSc'); if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' }); }
const advCurA = () => S.adv && advGet(S.adv);
Object.assign(XA, {
  advOpen: (t, a) => { const A = advGet(a); if (!A) return; S.adv = a; S.advDel = null; const d = advDb(); d.last = a; advSave(d); S.view = 'adv'; render(); window.scrollTo(0, 0); },
  advLib: () => { S.adv = null; render(); window.scrollTo(0, 0); },
  advResume: () => { const d = advDb(); if (!advGet(d.last)) return; S.adv = d.last; S.view = 'adv'; render(); window.scrollTo(0, 0); },
  advTab: (t, a) => { const A = advCurA(); if (!A) return;
    advSetSt(A.id, (s) => { if (/^ch:/.test(a)) { const id = a.slice(3); if (s.ch !== id) { s.ch = id; s.sc = advCh(A, id).scenes[0].id; } s.tab = 'ch'; } else s.tab = a; });
    render(); window.scrollTo(0, 0); },
  advScene: (t, a) => { const A = advCurA(); if (!A) return; advSetSt(A.id, (s) => { s.sc = a; }); advGoScene(); },
  advStep: (t, a) => { const A = advCurA(); if (!A) return; const st = advSt(A.id); const C = advCh(A, st.ch); const ci = A.chapters.indexOf(C); const si = C.scenes.indexOf(advSc(C, st.sc));
    let nc = ci, ns = si + (+a); if (ns < 0) { nc = ci - 1; if (nc < 0) return; ns = A.chapters[nc].scenes.length - 1; } else if (ns >= C.scenes.length) { nc = ci + 1; if (nc >= A.chapters.length) return; ns = 0; }
    const C2 = A.chapters[nc]; advSetSt(A.id, (s) => { s.tab = 'ch'; s.ch = C2.id; s.sc = C2.scenes[ns].id; }); render(); const el = $('.advch'); if (el) el.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); },
  advFlag: (t, a) => { const A = advCurA(); if (!A) return; const v = t.dataset.v; advSetSt(A.id, (s) => { if (s.flags[a] === v) delete s.flags[a]; else s.flags[a] = v; }); render(); },
  advChoice: (t, a) => { const A = advCurA(); const r = A && advBlockAt(A, a); if (!r || r.b.t !== 'choice') return; const i = +t.dataset.i; const row = r.b.rows[i]; if (!row) return;
    advSetSt(A.id, (s) => { if (s.choice[r.b.key] === i) { delete s.choice[r.b.key]; return; } s.choice[r.b.key] = i; Object.assign(s.flags, row.sets || {}); }); render(); },
  advHo: (t, a) => { const A = advCurA(); const r = A && advBlockAt(A, a); if (!r || r.b.t !== 'vorlese') return; if (!(typeof isDM === 'function' && isDM())) { bannerToast('Nur die Spielleitung', 'Handouts teilt die Spielleitung am Tisch.'); return; }
    const title = (r.b.title && r.b.title !== 'Vorlesetext' ? r.b.title.replace(/^Vorlesetext\s*·\s*/, '') : (r.Sc ? r.Sc.title : r.C.title));
    saveMeta({ handouts: (S.meta.handouts || []).concat([{ id: uidX(), title, text: r.b.ps.map(advPlain).join('\n\n'), t: Date.now() }]).slice(-20) });
    bannerToast('Handout geteilt', '„' + title + '“ ist jetzt bei allen am Tisch unter Handouts.'); },
  advLoot: (t, a) => { const A = advCurA(); const r = A && advBlockAt(A, a); if (!r || r.b.t !== 'loot') return; if (!(typeof isDM === 'function' && isDM())) { bannerToast('Nur die Spielleitung', 'Beute verteilt die Spielleitung am Tisch.'); return; }
    const nh = typeof lootHeroes === 'function' ? lootHeroes() : 5; const gm = Math.floor((+r.b.gm || 0) / nh) + (+r.b.gmHero || 0);
    S.gPre = { to: 'all', xp: '', gm: gm || '', item: '', text: r.b.items.map((x) => advPlain(x).replace(/^-\s+/, '')).join(' · ') };
    S.view = 'camp'; render(); advGlowGift(); },
  advGive: (t, a) => { const A = advCurA(); const r = A && advBlockAt(A, a); const row = r && r.b.t === 'items' && r.b.rows[+t.dataset.i]; if (!row) return; if (!(typeof isDM === 'function' && isDM())) return;
    S.gPre = { to: 'all', xp: '', gm: '', item: MAGIC_ITEMS[row.item] ? row.item : '', text: row.name + ' (' + advPlain(row.rule) + ')' };
    S.view = 'camp'; render(); advGlowGift(); bannerToast(row.name, 'Wähle oben im Formular, welcher Held ihn bekommt.'); },
  advFight: (t, a) => { const A = advCurA(); const r = A && advBlockAt(A, a); const e = r && r.b.t === 'kampf' && advEnc(A, r.b.enc); if (!e) return;
    if (!(typeof isDM === 'function' && isDM())) { bannerToast('Nur die Spielleitung', 'Kämpfe startet die Spielleitung am Tisch.'); return; }
    const added = advMobsInstall(A); const mobs = e.mobs.filter((m) => BESTIARY[m.mid] && +m.n > 0); if (!mobs.length) { bannerToast('Keine Gegner', 'Die Monster dieses Kampfs fehlen im Bestiarium.'); return; }
    const o = { groupInit: S.encGrp !== false, rollHp: !!S.encRoll, surprised: false, reserve: false };
    if (!(S.combat && S.combat.active)) { S.myInit = null; saveCombat({ id: 'k' + Date.now().toString(36), active: true, round: 1, turn: null, npcs: [], t: Date.now() }); }
    encInsert(mobs, r.b.title, o);
    const res = (e.reserve || []).filter((m) => BESTIARY[m.mid] && +m.n > 0); if (res.length) encInsert(res, r.b.title + ' · später', Object.assign({}, o, { reserve: true }));
    if (added) bannerToast('Bestiarium ergänzt', added + ' Kreaturen aus „' + A.title + '“ sind jetzt unter „✎ Eigene“.');
    S.view = 'camp'; render(); window.scrollTo(0, 0); },
  advAlly: (t, a) => { const A = advCurA(); const r = A && advBlockAt(A, a); const x = r && (r.b.allies || [])[+t.dataset.i]; const c = S.combat; if (!x || !c || !c.active) return;
    advMobsInstall(A); const M = BESTIARY[x.mid]; const ini = M ? +M[6] || 0 : 0; const d = 1 + Math.floor(rnd() * 20); const hp = +x.hp || (M ? M[3] : 10);
    saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).concat([{ id: uidX(), mid: M ? x.mid : undefined, name: x.name, v: d + ini, dex: ini, hp, hpMax: hp, ac: M ? M[2] : 10, ally: true, cond: [] }]), t: Date.now() }));
    pushLog({ label: x.name + ': Initiative', total: d + ini, detail: 'W20 ' + d + ' ' + sgn(ini) + ' · kämpft auf eurer Seite', sides: 20, nat: d });
    S.view = 'camp'; render(); },
  advMob: (t, a) => { const A = advCurA(); if (A) advMobModal(A, a); },
  advBest: (t, a) => { const A = advCurA(); advMobsInstall(A); S.modal = null; $('#modal').hidden = true; S.mq = a; S.mhab = 'own'; S.view = 'mobs'; render(); window.scrollTo(0, 0); },
  advPrep: () => { const A = advCurA(); if (!A) return; const m = advMobsInstall(A); const e = advEncInstall(A);
    bannerToast(m || e ? 'Bestiarium ergänzt' : 'Schon da', (m || e) ? [m && m + ' Kreaturen unter „✎ Eigene“', e && e + ' Begegnungen im Planer'].filter(Boolean).join(', ') + '.' : 'Alle Kreaturen und Begegnungen sind bereits im Bestiarium.'); },
  advReset: () => { const A = advCurA(); if (!A) return; if (S.advReset !== A.id) { S.advReset = A.id; render(); return; } S.advReset = null; const d = advDb(); delete d.st[A.id]; advSave(d); render(); bannerToast('Zurückgesetzt', 'Fortschritt und Entscheidungen von „' + A.title + '“ sind gelöscht.'); },
  advDel: (t, a) => { if (S.advDel !== a) { S.advDel = a; render(); return; } S.advDel = null; const d = advDb(); d.list = d.list.filter((x) => x.id !== a); delete d.st[a]; if (d.last === a) d.last = ''; advSave(d); render(); },
});
function advGlowGift() { setTimeout(() => { const b = $('[data-act="gift"]'); if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.classList.add('glowbtn'); setTimeout(() => b.classList.remove('glowbtn'), 2400); } }, 80); }
