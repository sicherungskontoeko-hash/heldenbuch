/* ==== Erklärkarten im Heldenbau: kleines ⓘ rechts an Auswahlen, Karte mit Text und „Wählen“ ==== */
const SKILL_DESC = {
  acr: 'Auf den Beinen bleiben, wo es schwierig wird: auf Glatteis, einem schwankenden Deck oder einem Seil balancieren, Saltos, Abrollen, dich aus einem Griff winden.',
  arc: 'Wissen über Magie: Zauber, magische Gegenstände, Runen, die Ebenen und ihre Bewohner erkennen und einordnen.',
  ath: 'Körperkraft im Einsatz: klettern, springen, schwimmen, jemanden packen oder dich gegen einen Stoss stemmen.',
  prf: 'Menschen mit Musik, Tanz, Schauspiel oder einer Rede fesseln und unterhalten.',
  itm: 'Mit Drohungen, Auftreten oder Gewalt beeindrucken: jemanden zum Reden bringen oder zum Zurückweichen.',
  slt: 'Geschickte Finger: Taschendiebstahl, etwas unbemerkt verstecken oder vertauschen, Taschenspielertricks.',
  his: 'Wissen über Vergangenes: Reiche, Kriege, Herrscherhäuser, Legenden und alte Bauwerke.',
  med: 'Verletzte versorgen und Sterbende stabilisieren, Krankheiten und Todesursachen erkennen.',
  ste: 'Unbemerkt bleiben: schleichen, dich verstecken, an Wachen vorbeischlüpfen.',
  ani: 'Mit Tieren umgehen: ein Tier beruhigen, ein Reittier lenken, die Stimmung eines Tiers einschätzen.',
  ins: 'Durchschauen, was jemand wirklich meint oder vorhat: Lügen bemerken, Nervosität erkennen.',
  inv: 'Gezielt suchen und kombinieren: Hinweise auswerten, eine Falle untersuchen, Schriften durchsehen.',
  nat: 'Wissen über Gelände, Pflanzen, Tiere und Wetter.',
  rel: 'Wissen über Götter, Riten, heilige Symbole, Kulte und Untote.',
  dec: 'Andere hinters Licht führen: lügen, dich verkleiden, falsche Fährten legen.',
  sur: 'In der Wildnis bestehen: Spuren lesen, jagen, den Weg finden, Gefahren der Natur vorhersehen.',
  per: 'Andere mit Argumenten und Charme gewinnen: verhandeln, bitten, beruhigen.',
  prc: 'Bemerken, was um dich herum geschieht: ein Geräusch, einen Hinterhalt, eine versteckte Tür.'
};
/* Die neun Gesinnungen (SRD 5.2.1, in eigenen Worten). Gespeichert wird der deutsche Name. Reihenfolge = Raster 3×3:
   Zeilen gut / neutral / böse, Spalten rechtschaffen / neutral / chaotisch. */
const ALIGN = {
  RG: { name: 'Rechtschaffen gut', d: 'Tut das Richtige, so wie es eine gerechte Gemeinschaft erwartet: hält Wort, schützt Schwache und stellt sich Unrecht ohne Zögern entgegen.', ex: 'eine Ritterin, die Unschuldige verteidigt und ihr Versprechen hält, auch wenn es sie viel kostet', cr: 'Golddrachen, Silberdrachen, Einhörner, Engel wie die Deva' },
  NG: { name: 'Neutral gut', d: 'Tut das Beste, was möglich ist. Hält sich an Regeln, fühlt sich aber nicht an sie gebunden – wichtiger ist, wer gerade Hilfe braucht.', ex: 'ein gütiger Heiler, der jedem hilft, egal ob Bettler oder Fürst', cr: 'Sprites, Pseudodrachen, Werbären, Zentauren' },
  CG: { name: 'Chaotisch gut', d: 'Folgt dem eigenen Gewissen und kümmert sich wenig darum, was andere erwarten. Freiheit und Güte zählen mehr als Gesetze.', ex: 'eine Rebellin, die die Steuereintreiber eines grausamen Barons überfällt und das Geld den Armen gibt', cr: 'Kupfer- und Messingdrachen, Pegasi, Baumhirten, Sturmriesen' },
  RN: { name: 'Rechtschaffen neutral', d: 'Handelt nach Gesetz, Tradition oder einem eigenen Kodex. Lässt sich davon weder durch Mitleid noch durch Versuchung abbringen.', ex: 'ein strenger Richter, der das Gesetz anwendet, ganz gleich, wen es trifft', cr: 'Sphingen, Azer' },
  N: { name: 'Neutral', d: 'Hält sich aus moralischen Fragen heraus und ergreift keine Partei. Tut, was gerade vernünftig scheint.', ex: 'eine Bäuerin, die vor allem ihre Ruhe und eine gute Ernte will', cr: 'Dryaden, Elementare, Dschinns, viele Druiden und einfache Leute' },
  CN: { name: 'Chaotisch neutral', d: 'Folgt den eigenen Launen – die persönliche Freiheit steht über allem, weder Gut noch Böse binden.', ex: 'ein Glücksritter, der von Ort zu Ort zieht und von seinem Witz lebt', cr: 'Goblins, Satyrn' },
  RB: { name: 'Rechtschaffen böse', d: 'Nimmt sich planvoll, was es will – aber innerhalb eines Kodex aus Tradition, Treue oder Ordnung.', ex: 'ein Adliger, der seine Untertanen ausbeutet und Ränke um die Macht schmiedet', cr: 'Teufel, Hobgoblins, blaue und grüne Drachen, Vampire' },
  NB: { name: 'Neutral böse', d: 'Schert sich nicht um das Leid, das es anrichtet, solange es bekommt, was es will.', ex: 'ein Verbrecher, der raubt und mordet, wie es ihm gerade passt', cr: 'Leichname, Nachtvetteln, Grabunholde, Schreckgespenster' },
  CB: { name: 'Chaotisch böse', d: 'Handelt mit willkürlicher Gewalt, getrieben von Hass, Rachsucht oder Blutgier.', ex: 'eine Schurkin, die nur noch Rache und Verwüstung im Sinn hat', cr: 'Dämonen, rote und schwarze Drachen, Trolle, Oger, Gnolle' }
};
/* Freie Eingaben aus älteren Helden erkennen („rechtschaffen gut“, „LG“, „Neutral-Gut“ …); Unbekanntes bleibt null */
function alignKey(s) {
  const t = String(s || '').toLowerCase().replace(/ß/g, 'ss').replace(/[^a-zäöü]+/g, ' ').trim(); if (!t) return null;
  const ab = { rg: 'RG', lg: 'RG', ng: 'NG', cg: 'CG', rn: 'RN', ln: 'RN', n: 'N', tn: 'N', wn: 'N', cn: 'CN', rb: 'RB', le: 'RB', nb: 'NB', ne: 'NB', cb: 'CB', ce: 'CB' };
  if (ab[t.replace(/ /g, '')]) return ab[t.replace(/ /g, '')];
  const eth = /recht|lawful/.test(t) ? 'R' : /chaot|chaos/.test(t) ? 'C' : '';
  const mor = /\bgut|good/.test(t) ? 'G' : /böse|boese|bose|evil/.test(t) ? 'B' : '';
  if (!eth && !mor) return /neutral/.test(t) ? 'N' : null;
  if (!eth && !/neutral/.test(t) && mor) return 'N' + mor;
  const k = (eth || 'N') + (mor || 'N'); return k === 'NN' ? 'N' : k;
}
function alignPicker(ch) {
  const k = alignKey(ch.alignment); const old = ch.alignment && !k ? ch.alignment : '';
  const A = k ? ALIGN[k] : null;
  return '<div class="fld alfld"><span>Gesinnung</span><div class="algrid" role="group" aria-label="Gesinnung">' + Object.entries(ALIGN).map(([key, a]) => '<button type="button" class="chip' + (key === k ? ' on' : '') + '" data-act="setAlign" data-arg="' + key + '" aria-pressed="' + (key === k) + '">' + a.name.replace('Rechtschaffen', 'Recht&shy;schaffen') + '</button>').join('') + '</div>' +
    (A ? '<div class="aldesc"><p><b>' + A.name + ':</b> ' + A.d + '</p><p><b>Zum Beispiel</b> ' + A.ex + '.</p><p><b>Typisch für:</b> ' + A.cr + '.</p></div>'
      : '<p class="hint">' + (old ? 'Bisher eingetragen: «' + esc(old) + '». Wähle eine der neun Gesinnungen – ' : 'Tippe eine Gesinnung an – ') + 'hier steht dann, was sie bedeutet.</p>') +
    '<p class="hint">Böse Helden nur nach Absprache mit der Spielleitung. Tiere und Wesen ohne Verstand haben keine Gesinnung.</p></div>';
}
XA.setAlign = (t, a, path, ch) => { if (!ch || !ALIGN[a]) return; ch.alignment = ALIGN[a].name; commit(); };
const PROP_DESC = {
  light: 'Leicht: geeignet für den Kampf mit zwei Waffen.',
  finesse: 'Finesse: Angriff und Schaden wahlweise mit STÄ oder GES.',
  thrown: 'Wurfwaffe: kann für einen Fernkampfangriff geworfen werden.',
  two: 'Zweihändig: braucht beide Hände.',
  versatile: 'Vielseitig: mit zwei Händen geführt höherer Schaden.',
  heavy: 'Schwer: Nachteil auf Angriffe, wenn STÄ (Nahkampf) bzw. GES (Fernkampf) unter 13 liegt.',
  reach: 'Reichweite: trifft Ziele bis 3 m statt 1,5 m.',
  ammo: 'Munition: braucht Pfeile oder Bolzen; nach dem Kampf lässt sich die Hälfte wieder einsammeln.',
  loading: 'Laden: pro Aktion, Bonusaktion oder Reaktion nur ein Schuss.'
};
const ARMOR_DE = { light: 'leichte', medium: 'mittelschwere', heavy: 'schwere', shield: 'Schilde' };
const WPN_DE = { simple: 'einfache Waffen', martial: 'einfache und Kriegswaffen', monk: 'einfache Waffen und leichte Kriegswaffen', rogue: 'einfache Waffen und Kriegswaffen mit Finesse oder Leicht' };

/* ⓘ als Teil einer Karte/Option (nie deaktiviert) */
function ii(kind, key, name) { return '<span class="ii" role="button" tabindex="0" data-act="info" data-arg="' + kind + ':' + key + '" aria-label="Erklärung' + (name ? ' zu ' + esc(name) : '') + '" title="Erklärung">i</span>'; }
/* Chip mit ⓘ daneben – das ⓘ bleibt auch nutzbar, wenn der Chip gesperrt ist */
function chipI(on, label, attrs, dis, kind, key, name) { return '<span class="chipw">' + chip(on, label, attrs, dis).replace('class="chip', 'class="chip wi') + '<button type="button" class="ii" data-act="info" data-arg="' + kind + ':' + key + '" aria-label="Erklärung' + (name ? ' zu ' + esc(name) : '') + '" title="Erklärung">i</button></span>'; }

const infoRow = (l, v) => (v || v === 0 ? '<div><dt>' + l + '</dt><dd>' + v + '</dd></div>' : '');
const infoFeats = (fl) => fl.length ? '<div class="ifeats">' + fl.map(([lv, n, t]) => '<details><summary><b>' + esc(n) + '</b>' + (lv ? '<small>Stufe ' + lv + '</small>' : '') + '</summary><p>' + esc(t) + '</p></details>').join('') + '</div>' : '';
function infoContent(kind, key) {
  if (kind === 'al') { const A = ALIGN[key]; if (!A) return null; return { t: A.name, sub: 'Gesinnung', more: '<p class="itx">' + A.d + '</p><h4>Zum Beispiel</h4><p class="itx">' + A.ex.charAt(0).toUpperCase() + A.ex.slice(1) + '.</p><h4>Typisch für</h4><p class="itx">' + A.cr + '.</p>' }; }
  const ch = cur(); const c = ch ? derive(ch, S.hb) : null;
  if (kind === 'cls') {
    const C = CLASSES[key]; if (!C) return null;
    const feats = (C.feats || []).filter((f) => f[0] <= 3);
    return { t: C.name, sub: (C.home ? '✦ Heldenbuch-Klasse' : 'Klasse'), flav: (C.flavor || '').replace(/^✦ /, ''),
      dl: infoRow('Trefferwürfel', 'W' + C.hd) + infoRow('Hauptattribut', C.prim.map((a) => AB_DE[a]).join(' oder ')) + infoRow('Rettungswürfe', C.saves.map((a) => AB_DE[a]).join(', ')) +
        infoRow('Rüstung', (C.armor || []).length ? C.armor.map((a) => ARMOR_DE[a] || a).join(', ') : 'keine') + infoRow('Waffen', WPN_DE[C.weapons] || '') +
        infoRow('Fertigkeiten', 'wähle ' + C.skillN + ': ' + C.skills.map((s) => SKILLS[s][0]).join(', ')) + infoRow('Zauber', C.caster ? { full: 'ja, voller Zauberwirker', half: 'ja, ab Stufe 1–2 (halber Zauberwirker)', pact: 'ja, Paktmagie' }[C.caster] || 'ja' : 'nein') +
        infoRow('Unterklasse', 'ab Stufe 3' + (C.subs ? ': ' + C.subs.length + ' zur Wahl' : '')),
      more: feats.length ? '<h4>Merkmale bis Stufe 3</h4>' + infoFeats(feats) : '' };
  }
  if (kind === 'sp') {
    const sp = SPECIES[key]; if (!sp) return null;
    let tr = []; try { const tmp = JSON.parse(JSON.stringify(ch || newChar({}))); tmp.species = key; tmp.speciesChoice = sp.choice ? (key === (ch || {}).species ? ch.speciesChoice : Object.keys(sp.choice.opts)[0]) : ''; const tc = derive(normChar(tmp), S.hb); tr = typeof sp.traits === 'function' ? sp.traits(tc) : (sp.traits || []); } catch (e) { tr = []; }
    return { t: sp.name, sub: sp.home ? '✦ Heldenbuch-Spezies' : 'Spezies', flav: (sp.flavor || '').replace(/^✦ /, ''),
      dl: infoRow('Grösse', sp.size) + infoRow('Bewegung', fmtM(sp.speed)) + infoRow('Dunkelsicht', sp.dv ? fmtM(sp.dv) : 'nein') + (sp.choice ? infoRow(sp.choice.label, Object.values(sp.choice.opts).join(', ')) : ''),
      more: tr.length ? '<h4>Merkmale</h4>' + infoFeats(tr.map(([n, t]) => [0, n, t])) : '' };
  }
  if (kind === 'bg') {
    const b = BACKGROUNDS[key]; if (!b) return null;
    const f = b.feat && FEATS[b.feat];
    if (key === 'custom') return { t: b.name, sub: 'Hintergrund', flav: (b.flavor || '').replace(/^✦ /, ''), dl: infoRow('Du wählst', 'drei Attribute, ein Herkunftstalent und zwei Fertigkeiten selbst') };
    return { t: b.name, sub: 'Hintergrund', flav: (b.flavor || '').replace(/^✦ /, ''),
      dl: infoRow('Attribute', b.abil.map((a) => AB_DE[a]).join(', ') + ' <small>(+2/+1 oder +1/+1/+1)</small>') + infoRow('Talent', f ? f.name : '') + infoRow('Fertigkeiten', (b.skills || []).map((s) => SKILLS[s][0]).join(', ')) + infoRow('Werkzeug', b.tool) + infoRow('Ausrüstung', b.equip),
      more: f ? '<h4>' + esc(f.name) + '</h4><p class="itx">' + esc(f.text) + '</p>' : '' };
  }
  if (kind === 'sub') {
    const [ck, sid] = key.split('/'); const C = CLASSES[ck]; const sb = C && (C.subs || []).find((x) => x.id === sid); if (!sb) return null;
    return { t: sb.name, sub: 'Unterklasse · ' + C.name, flav: (sb.desc || '').replace(/^✦ /, ''), dl: '', more: '<h4>Merkmale</h4>' + infoFeats(sb.feats || []) };
  }
  if (kind === 'sk') {
    const s = SKILLS[key]; if (!s) return null; const v = c && c.skills[key];
    return { t: s[0], sub: 'Fertigkeit · ' + AB_DE[s[1]], flav: '', dl: '', more: '<p class="itx">' + esc(SKILL_DESC[key] || '') + '</p>' + (v ? '<p class="ifor">Für dich: <b>' + sgn(v.val) + '</b>' + (v.prof ? (v.prof === 2 ? ' · Expertise' : ' · geübt') : ' · nicht geübt') + '</p>' : '') };
  }
  if (kind === 'sp1') {
    const s = getSpell(key, S.hb); if (!s) return null;
    const d = (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[key]) || {};
    let mine = '';
    if (c && c.spell && c.spell.has) {
      const info = (c.spell.classes || []).find((x) => (x.list || []).some((y) => y.id === key)) || c.spell.classes[0];
      if (info) {
        const parts = [];
        if (d.atk) parts.push('Zauberangriff <b>' + sgn(info.atk) + '</b>');
        if (d.save) parts.push('Rettungswurf-SG <b>' + info.dc + '</b> (' + AB_K[d.save] + ')');
        if (s.lvl === 0 && d.cant && d.n && d.s) { const k = 1 + (ch.level >= 5) + (ch.level >= 11) + (ch.level >= 17); parts.push('auf deiner Stufe <b>' + d.n * k + 'W' + d.s + '</b>'); }
        if (s.lvl > info.maxLvl) parts.push('erst ab höherer Stufe verfügbar');
        if (parts.length) mine = '<p class="ifor">Für dich: ' + parts.join(' · ') + '</p>';
      }
    }
    const tags = (s.conc ? '<i title="Konzentration">K</i>' : '') + (s.ritual ? '<i title="Ritual">R</i>' : '');
    return { t: s.name, sub: (s.lvl ? 'Grad ' + s.lvl : 'Zaubertrick') + ' · ' + (SCHOOL[s.school] || '') + tags, flav: (typeof SPELL_FLAV !== 'undefined' && SPELL_FLAV[key]) || '',
      dl: infoRow('Zeitaufwand', esc(s.time)) + infoRow('Reichweite', esc(s.range)) + infoRow('Komponenten', esc(s.comp) + (s.mat ? ' <small>(' + esc(s.mat) + (s.matUsed ? ', wird verbraucht' : '') + ')</small>' : '')) + infoRow('Dauer', esc(s.dur) + (s.conc ? ' <small>(Konzentration)</small>' : '')) + (s.ritual ? infoRow('Ritual', 'ja, auch ohne Zauberplatz wirkbar (+10 Minuten)') : ''),
      more: '<h4>Wirkung</h4><p class="itx">' + esc(s.text) + '</p>' + mine };
  }
  if (kind === 'w') {
    const W = WEAPONS[key]; if (!W) return null; const M = MASTERY[W[6]];
    return { t: W[0], sub: (W[1] === 'm' ? 'Kriegswaffe' : 'Einfache Waffe') + ' · ' + (W[2] === 'melee' ? 'Nahkampf' : 'Fernkampf'),
      dl: infoRow('Schaden', W[3] + ' ' + (DT[W[4]] || '') + (W[8] ? ' <small>(zweihändig ' + W[8] + ')</small>' : '')) + (W[7] ? infoRow('Reichweite', W[7] + ' m') : '') + infoRow('Meisterschaft', M ? M[0] : ''),
      more: ((W[5] || []).length ? '<h4>Eigenschaften</h4><ul class="iul">' + W[5].map((p) => '<li>' + esc(PROP_DESC[p] || PROP_DE[p] || p) + '</li>').join('') + '</ul>' : '') + (M ? '<h4>Meisterschaft: ' + esc(M[0]) + '</h4><p class="itx">' + esc(M[1]) + '</p>' : '') };
  }
  return null;
}
XA.info = (t, a) => {
  const i = a.indexOf(':'); const kind = a.slice(0, i), key = a.slice(i + 1);
  const x = infoContent(kind, key); if (!x) return;
  /* zugehörige Auswahl: das Element, in dem das ⓘ steckt, oder der Chip davor */
  const pick = t.closest('button.card, button.opt') || (t.parentNode && t.parentNode.classList.contains('chipw') ? t.parentNode.querySelector('.chip') : null);
  let foot = '';
  if (pick && pick.dataset.act && pick.dataset.act !== 'info') {
    const on = pick.classList.contains('on'); const attrs = Object.entries(pick.dataset).map(([k, v]) => 'data-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + '="' + esc(v) + '"').join(' ');
    const single = /^(setCls|setSpecies|setBg|pick)$/.test(pick.dataset.act);
    if (pick.disabled && !on) foot = '<p class="ihint">' + (pick.title && /Unterklasse/.test(pick.title) ? esc(pick.title) : 'Du hast schon so viele gewählt, wie erlaubt sind. Wähle zuerst etwas anderes ab.') + '</p>';
    else if (on && single) foot = '<p class="ihint ok">✓ Gewählt</p>';
    else foot = '<button class="btn ipick' + (on ? ' ghost' : '') + '" ' + attrs + ' data-ipick="1">' + (on ? 'Abwählen' : 'Wählen') + '</button>';
  }
  const m = $('#modal'); S.modal = 'info';
  m.innerHTML = '<div class="dlg infodlg" role="dialog" aria-modal="true" aria-label="' + esc(x.t) + '"><div class="ihd"><div><b>' + esc(x.t) + '</b><small>' + x.sub + '</small></div><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<div class="ibody">' + (x.flav ? '<p class="iflav">' + esc(x.flav) + '</p>' : '') + (x.dl ? '<dl class="idl">' + x.dl + '</dl>' : '') + (x.more || '') + '</div>' + (foot ? '<div class="ift">' + foot + '</div>' : '') + '</div>';
  m.hidden = false; const b = m.querySelector('.ipick, .x'); if (b) b.focus({ preventScroll: true });
};
/* „Wählen“ in der Karte schliesst die Karte, bevor die Auswahl ausgeführt wird */
document.addEventListener('click', (ev) => {
  const m = $('#modal');
  if (S.modal === 'info' && ev.target === m) { S.modal = null; m.hidden = true; return; }
  const t = ev.target.closest('[data-ipick]'); if (t && S.modal === 'info') { S.modal = null; m.hidden = true; }
}, true);
document.addEventListener('keydown', (ev) => { const t = ev.target; if (t && t.classList && t.classList.contains('ii') && t.tagName === 'SPAN' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ev.stopPropagation(); t.click(); } }, true);

/* Namen auf dem Bogen antippen → kleines Fenster zum Umbenennen */
XA.renameHero = () => {
  const ch = cur(); if (!ch) return; const m = $('#modal'); S.modal = 'rename';
  m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="Namen ändern"><h2>Namen ändern</h2>' + field('Name deines Helden', txt('name', ch.name === 'Neuer Held' ? '' : ch.name, 'z. B. Brakk Eisenfaust', 'autocomplete="off" id="rnIn"')) + '<div class="chips end"><button class="btn" data-act="renameDone">Fertig</button></div></div>';
  m.hidden = false; const i = $('#rnIn'); if (i) { i.focus(); i.select(); }
};
XA.renameDone = () => { S.modal = null; $('#modal').hidden = true; render(); };
document.addEventListener('keydown', (ev) => { if (S.modal !== 'rename') return; if (ev.key === 'Enter' && ev.target && ev.target.id === 'rnIn') { ev.preventDefault(); XA.renameDone(); } if (ev.key === 'Escape') setTimeout(render, 0); });

/* ==== Offene Punkte: ⚠ rechts am Rand, aufklappbar, Sprung zum Punkt ==== */
let warnLastN = -1;
function paintWarn() {
  let el = document.getElementById('warnfab'); document.body.dataset.view = S.view || '';
  const ch = cur(); const show = ch && (S.view === 'build' || S.view === 'sheet') && !(ch.play && ch.play.dead);
  const c = show ? derive(ch, S.hb) : null; const n = c ? c.warn.length : 0;
  if (!el) { el = document.createElement('div'); el.id = 'warnfab'; document.body.appendChild(el); }
  const mw = document.querySelector('.mwarn'); if (mw) { mw.hidden = !(show && n); const bb = mw.querySelector('b'); if (bb) bb.textContent = n || ''; mw.classList.toggle('on', !!S.warnOpen); mw.dataset.act = S.warnOpen ? 'warnClose' : 'warnOpen'; }
  if (!show || (!n && warnLastN <= 0)) { el.innerHTML = ''; el.className = ''; warnLastN = show ? n : -1; S.warnOpen = false; return; }
  if (!n) { /* gerade alles erledigt: kurz grünes ✓ */
    el.className = 'wdone'; el.innerHTML = '<span class="wfb ok" role="status">✓ Alles ausgewählt</span>'; warnLastN = 0; S.warnOpen = false;
    setTimeout(() => { if (warnLastN === 0) { el.innerHTML = ''; el.className = ''; } }, 1800); return;
  }
  warnLastN = n;
  el.className = S.warnOpen ? 'open' : '';
  el.innerHTML = (S.warnOpen ? '<div class="wpan" role="dialog" aria-label="Noch offen"><div class="wph"><b>Noch offen</b><small>antippen zum Hinspringen</small><button class="x" data-act="warnClose" aria-label="Schliessen">×</button></div><ul>' +
      c.warn.map((w, i) => '<li><button data-act="gowarn" data-arg="' + i + '">' + esc(w) + '<span aria-hidden="true">→</span></button></li>').join('') + '</ul></div>' : '') +
    '<button type="button" class="wfb" data-act="' + (S.warnOpen ? 'warnClose' : 'warnOpen') + '" aria-expanded="' + !!S.warnOpen + '" aria-label="' + n + ' Auswahl(en) noch offen" title="Noch offen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.2v.1"/></svg><b>' + n + '</b></button>';
}
XA.warnOpen = () => { S.warnOpen = true; paintWarn(); const f = document.querySelector('#warnfab .wpan button'); if (f) f.focus({ preventScroll: true }); };
XA.warnClose = () => { S.warnOpen = false; paintWarn(); };
XA.sumToggle = () => { S.sumOpen = !S.sumOpen; render(); };
/* Aufklappmenüs (<details class="mnu">): Klick daneben oder Auswahl schliesst */
document.addEventListener('click', (ev) => {
  document.querySelectorAll('details.mnu[open]').forEach((d) => { if (!d.contains(ev.target) || (ev.target.closest('.mnul button'))) d.removeAttribute('open'); });
  if (S.warnOpen && !ev.target.closest('#warnfab') && !ev.target.closest('[data-act="warnOpen"]') && !ev.target.closest('.mwarn') && window.innerWidth < 1100) { S.warnOpen = false; paintWarn(); }
}, true);
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { document.querySelectorAll('details.mnu[open]').forEach((d) => d.removeAttribute('open')); if (S.warnOpen) { S.warnOpen = false; paintWarn(); } } });
