/* ==== Stufenaufstieg-Assistent: 1. Aufstieg (Klasse, TP) · 2. Das ist neu (Merkmale + was sich verändert) · 3. Jetzt entscheiden ====
   Drei Schritte: Vorschau, Entscheidungen, Feier. */
function luPreview(ch, id, roll) {
  const t = JSON.parse(JSON.stringify(ch)); const b = derive(ch, S.hb); const nl = b.lv(id) + 1;
  if (id === t.cls) { t.level = nl; if (t.hpMode === 'roll') t.hpRolls[nl] = roll || Math.floor(CLASSES[id].hd / 2) + 1; }
  else { const mm = (t.multi || []).find((x) => x.cls === id); if (mm) { mm.level = nl; if (t.hpMode === 'roll') { mm.hpRolls = mm.hpRolls || {}; mm.hpRolls[nl] = roll || Math.floor(CLASSES[id].hd / 2) + 1; } } }
  return { b, a: derive(t, S.hb), nl };
}
function luGains(c, id, nl) {
  const C = CLASSES[id]; const e = c.classes.find((x) => x.id === id); const gain = C.feats.filter((f) => f[0] === nl).map((f) => [f[1], f[2], C.name]);
  if (nl >= 3 && e && e.subFeats) e.subFeats.filter((f) => f[0] === nl).forEach((f) => gain.push([f[1], f[2], e.subName]));
  if ((C.asi || []).includes(nl) && !gain.some((g) => /Attributswert/.test(g[0]))) gain.push(['Attributswerterhöhung oder Talent', 'Erhöhe ein Attribut um 2 oder zwei Attribute um 1 – oder wähle ein Talent.', 'Wahl']);
  if (nl === 19) gain.push(['Epische Gabe', 'Wähle eine Epische Gabe oder eine Attributswerterhöhung.', 'Wahl']);
  if (C.options) { const o0 = C.options.n(nl - 1), o1 = C.options.n(nl); if (o1 > o0) gain.push([C.options.label, 'Du lernst ' + (o1 - o0) + ' weitere (jetzt ' + o1 + ').', 'Wahl']); }
  if (nl === 3 && C.subs && e && !e.subChosen) gain.push(['Unterklasse', 'Jetzt wählst du deine Unterklasse – sie prägt deinen Helden für den Rest des Abenteuers.', 'Wahl']);
  return gain;
}
function luDiff(b, a, id) {
  const rows = []; const add = (l, x, y) => { if (String(x) !== String(y)) rows.push([l, x, y]); };
  add('TP-Maximum', b.hpMax, a.hpMax); add('Übungsbonus', sgn(b.pb), sgn(a.pb));
  const C = CLASSES[id]; const t0 = C.table(b.lv(id)), t1 = C.table(a.lv(id)); t1.forEach(([l, v]) => { const o = t0.find((r) => r[0] === l); add(l, o ? o[1] : '–', v); });
  const sb = b.spell || {}, sa = a.spell || {};
  if (sa.has) { const n = Math.max((sb.slots || []).length, (sa.slots || []).length); for (let g = 0; g < n; g++) add('Zauberplätze Grad ' + (g + 1), (sb.slots || [])[g] || 0, (sa.slots || [])[g] || 0);
    if (sa.pact) add('Paktplätze', sb.pact ? sb.pact.n + '× Grad ' + sb.pact.lvl : '–', sa.pact.n + '× Grad ' + sa.pact.lvl);
    (sa.classes || []).forEach((ia) => { const ib = (sb.classes || []).find((x) => x.id === ia.id) || {}; const pre = (sa.classes.length > 1 ? ia.name + ': ' : '');
      add(pre + 'Zaubertricks', ib.cantripN || 0, ia.cantripN || 0); add(pre + 'Vorbereitete Zauber', ib.prepN || 0, ia.prepN || 0); add(pre + 'Zauber bis Grad', ib.maxLvl || 0, ia.maxLvl || 0); }); }
  (a.res || []).forEach((r) => { const o = (b.res || []).find((x) => x.k === r.k); add(r.n, o ? o.max : '–', r.max); });
  add('Waffenmeisterschaften', b.masteryN || 0, a.masteryN || 0); add('Kampfstile', b.styleN || 0, a.styleN || 0); add('Anrufungen', b.invN || 0, a.invN || 0);
  const seen = new Set(); return rows.filter(([l]) => (seen.has(l) ? false : (seen.add(l), true)));
}
function lvlUpOpen() {
  const ch = cur(); if (!ch) return; const c = derive(ch, S.hb); if (c.level >= 20 && !(S.lu && S.lu.step === 3)) return;
  S.lu = S.lu || { cls: ch.cls, roll: null, step: 1 };
  const m = $('#modal'); S.modal = 'lvl'; const st = S.lu.step;
  const dots = '<div class="lusteps">' + ['Aufstieg', 'Das ist neu', 'Entscheiden'].map((l, i) => '<span class="' + (i + 1 === st ? 'on' : i + 1 < st ? 'done' : '') + '"><b>' + (i + 1) + '</b>' + l + '</span>').join('') + '</div>';
  let body = '', foot = '';
  if (st === 1) {
    const id = S.lu.cls; const C = CLASSES[id]; const nl = c.lv(id) + 1;
    const opts = [[ch.cls, CLASSES[ch.cls].name + ' ' + c.lv(ch.cls) + ' → ' + (c.lv(ch.cls) + 1)]].concat((ch.multi || []).map((mm) => [mm.cls, CLASSES[mm.cls].name + ' ' + mm.level + ' → ' + (+mm.level + 1)]));
    const avg = C.hd / 2 + 1, con = c.mod.con;
    body = '<div class="luhero">' + (typeof picOf === 'function' ? picOf('cls', id).replace('cpic', 'lupic') : '') + '<div><small>' + esc(ch.name) + '</small><b>Stufe ' + c.level + ' → <em>' + (c.level + 1) + '</em></b><span>' + esc(C.name) + ' ' + nl + '</span></div></div>' +
      (opts.length > 1 ? '<h4>In welcher Klasse steigst du auf?</h4><div class="chips">' + opts.map(([k, l]) => chip(k === id, l, 'data-act="luCls" data-arg="' + k + '"')).join('') + '</div>' : '') +
      '<p class="hint">Neue Klasse dazunehmen? <button class="link" data-act="luMulti">Multiclassing im Erschaffen-Bereich</button></p>' +
      '<h4>Trefferpunkte</h4><div class="luhp">' + (ch.hpMode === 'roll' ? (S.lu.roll ? '<div class="luhpv"><span>W' + C.hd + ' = ' + S.lu.roll + ' ' + sgn(con) + ' KON</span><b>+' + Math.max(1, S.lu.roll + con) + ' TP</b></div>' : '<button class="btn big" data-act="luRoll">W' + C.hd + ' würfeln</button><p class="hint">Du hast „selbst gewürfelt“ eingestellt.</p>')
        : '<div class="luhpv"><span>Durchschnitt ' + avg + ' ' + sgn(con) + ' KON</span><b>+' + Math.max(1, avg + con) + ' TP</b></div>') + '</div>';
    foot = '<button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" data-act="luNext"' + (ch.hpMode === 'roll' && !S.lu.roll ? ' disabled' : '') + '>Weiter: Was ist neu? →</button>';
  } else if (st === 2) {
    const { b, a, nl } = luPreview(ch, S.lu.cls, S.lu.roll); const gains = luGains(a, S.lu.cls, nl); const diff = luDiff(b, a, S.lu.cls);
    body = '<h3 class="luh">Das bringt dir Stufe ' + a.level + '</h3>' +
      (gains.length ? '<div class="lucards">' + gains.map(([n, t, src], i) => '<div class="lucard' + (src === 'Wahl' ? ' wahl' : '') + '" style="--i:' + i + '"><small>' + esc(src === 'Wahl' ? 'Deine Wahl' : src) + '</small><b>' + esc(n) + '</b><p>' + esc(t) + '</p></div>').join('') + '</div>' : '<p class="hint">Keine neuen Merkmale auf dieser Stufe – aber mehr Trefferpunkte und stärkere Werte.</p>') +
      (diff.length ? '<h4>Das verändert sich</h4><div class="ludiff">' + diff.map(([l, x, y]) => '<div><span>' + esc(l) + '</span><s>' + esc(x) + '</s><i aria-hidden="true">→</i><b>' + esc(y) + '</b></div>').join('') + '</div>' : '');
    foot = '<button class="btn ghost" data-act="luBack">← Zurück</button><button class="btn big lugo" data-act="luGo">✦ Aufsteigen</button>';
  } else {
    const w = c.warn;
    body = '<div class="luhero done"><div><small>' + esc(ch.name) + '</small><b>Stufe <em>' + c.level + '</em> erreicht!</b></div></div>' +
      (w.length ? '<h4>Jetzt entscheiden</h4><p class="hint">Diese Auswahlen sind durch den Aufstieg neu dazugekommen oder noch offen. Tippe darauf, um direkt hinzuspringen.</p><div class="luwarn">' + w.map((x, i) => '<button data-act="luWarn" data-arg="' + i + '"><span>' + esc(x) + '</span><i aria-hidden="true">→</i></button>').join('') + '</div>'
        : '<p class="ok">✓ Nichts mehr zu entscheiden – viel Spass mit deinem stärkeren Helden!</p>');
    foot = '<button class="btn" data-act="luDone">Fertig</button>';
  }
  m.innerHTML = '<div class="dlg lvlup luwiz" role="dialog" aria-modal="true" aria-label="Stufenaufstieg">' + dots + '<div class="lubody">' + body + '</div><div class="chips end lufoot">' + foot + '</div></div>';
  m.hidden = false;
}
function lvlUpGo() {
  const ch = cur(); const before = derive(ch, S.hb); const id = S.lu.cls; const nl = before.lv(id) + 1;
  if (id === ch.cls) { ch.level = nl; if (ch.hpMode === 'roll') ch.hpRolls[nl] = S.lu.roll; }
  else { const mm = ch.multi.find((x) => x.cls === id); if (!mm) return; mm.level = nl; if (ch.hpMode === 'roll') { mm.hpRolls = mm.hpRolls || {}; mm.hpRolls[nl] = S.lu.roll; } }
  const after = derive(ch, S.hb); const P = ch.play; P.hp = Math.min(after.hpMax, (P.hp ?? before.hpMax) + (after.hpMax - before.hpMax));
  pushLog({ label: 'Stufenaufstieg', total: after.level, detail: CLASSES[id].name + ' ' + nl + ' · TP-Maximum ' + before.hpMax + ' → ' + after.hpMax, share: true });
  commit(); S.lu.step = 3; lvlUpOpen(); luCelebrate(after.level);
}
function luCelebrate(lv) {
  if (typeof d3fx === 'function' && d3fx() === 'aus') return; const full = typeof d3fx !== 'function' || d3fx() === 'voll';
  const st = document.createElement('div'); st.className = 'd3stage lucel'; st.setAttribute('aria-hidden', 'true');
  st.style.cssText = '--x:' + window.innerWidth / 2 + 'px;--y:' + window.innerHeight * 0.42 + 'px;--c:#ffd36b;--c2:#fff6d6';
  let h = '<div class="sg-vig"></div><div class="sg-aura"></div><div class="sg-ring"></div><div class="sg-ring r2"></div><div class="lunum">' + lv + '</div>';
  if (full) for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; const d = 120 + Math.random() * 200; h += '<span class="d3p sg burst" style="--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d).toFixed(0) + 'px;--c:' + ['#ffd36b', '#fff6d6', '#ffb347'][i % 3] + ';--d:' + (Math.random() * 200).toFixed(0) + 'ms;--r:0deg;--sz:' + (1 + Math.random()).toFixed(2) + '"><i class="ps"></i></span>'; }
  st.innerHTML = h; document.body.appendChild(st); if (typeof d3snd === 'function') d3snd('n20'); setTimeout(() => st.remove(), 2300);
}
Object.assign(XA, {
  luNext: () => { S.lu.step = 2; lvlUpOpen(); },
  luBack: () => { S.lu.step = 1; lvlUpOpen(); },
  luDone: () => { S.lu = null; S.modal = null; $('#modal').hidden = true; render(); },
  luWarn: (t, a) => { const ch = cur(); const c = derive(ch, S.hb); S.lu = null; S.modal = null; $('#modal').hidden = true; goWarn(c, c.warn[+a]); }
});
