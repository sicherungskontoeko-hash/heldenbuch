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
