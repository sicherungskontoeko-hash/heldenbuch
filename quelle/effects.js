/* ==== Effekt- und Dauer-Tracker (P05): Rundendauer, Rettungswurf-Erinnerungen, Ablauf ==== */
const SAVE_AB = [['', 'kein Rettungswurf'], ['str', 'STÄ'], ['dex', 'GES'], ['con', 'KON'], ['int', 'INT'], ['wis', 'WEI'], ['cha', 'CHA']];
const effUid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function durRounds(dur) {
  const d = String(dur || '').toLowerCase();
  if (/sofort|unbegrenzt|bis gebannt|dauerhaft|speziell/.test(d)) return null;
  const m = /(\d+)\s*(runde|minute|stunde)/.exec(d); if (!m) return null;
  const n = +m[1]; return m[2] === 'runde' ? n : m[2] === 'minute' ? n * 10 : n * 600;
}
const effList = () => (S.combat && S.combat.active && S.combat.effects) || [];
const remList = () => (S.combat && S.combat.active && S.combat.rem) || [];
function partName(key) { if (!key) return ''; const o = order().find((x) => x.key === key); if (o) return o.name; if (key.startsWith('p:') && S.table[key.slice(2)]) return S.table[key.slice(2)].char; return '?'; }
function effSave(patch) { const c = S.combat; if (!c) return; saveCombat(Object.assign({}, c, patch, { t: Date.now() })); }

/* Beim Zugwechsel (nur der Auslösende schreibt): Runden herunterzählen, Ablauf, fällige Rettungswürfe */
function effTick(c, oldKey, newKey) {
  const effects = []; const rem = (c.rem || []).slice(); const log = [];
  for (const e of c.effects || []) {
    const x = Object.assign({}, e); const owner = x.tick === 'tgt' ? x.tgt : (x.src || x.tgt);
    if (x.left != null && owner && ((x.at === 'end' && owner === oldKey) || (x.at !== 'end' && owner === newKey))) x.left--;
    if (x.left != null && x.left <= 0) { log.push(x.name + (x.tgt ? ' auf ' + partName(x.tgt) : '') + ' endet'); continue; }
    if (x.save && x.save.ab && x.tgt && ((x.save.when !== 'start' && x.tgt === oldKey) || (x.save.when === 'start' && x.tgt === newKey))) rem.push({ id: effUid(), eff: x.id, tgt: x.tgt, ab: x.save.ab, dc: +x.save.dc || 10, name: x.name });
    effects.push(x);
  }
  return { effects, rem: rem.filter((r) => effects.some((e) => e.id === r.eff)), log };
}

/* Neuer Effekt, z. B. automatisch beim Wirken eines Zaubers mit Dauer */
function effAddFromSpell(ch, s) {
  const c = S.combat; if (!S.camp || !c || !c.active) return;
  const r = durRounds(s.dur); if (!r || r > 100) return;
  const me = 'p:' + UID; const sv = /(STÄ|GES|KON|INT|WEI|CHA)-Rettungswurf/.exec(s.text); const abK = sv ? { 'STÄ': 'str', 'GES': 'dex', 'KON': 'con', 'INT': 'int', 'WEI': 'wis', 'CHA': 'cha' }[sv[1]] : '';
  const d = derive(ch, S.hb); const ctx = spellCtx(d, s.id);
  const e = { id: effUid(), name: s.name, src: me, tgt: '', left: r, at: 'start', conc: !!s.conc, spell: s.id, save: abK && /Wiederholung|am Ende jedes|jeden Zug/.test(s.text) ? { ab: abK, dc: ctx.dc, when: 'end' } : null, t: Date.now() };
  if (s.conc) ch.play.concEff = e.id;
  effSave({ effects: (c.effects || []).concat([e]), log: clog(c, ch.name + ' wirkt ' + s.name + ' (' + r + ' Runden)') });
}
/* Konzentration endet → zugehörige Effekte entfernen */
function effConcEnd(spellId) {
  if (!S.camp || !UID) return; const me = 'p:' + UID;
  const drop = (e) => e.src === me && e.conc && (!spellId || e.spell === spellId);
  setTimeout(() => { const c = S.combat; if (!c || !c.active || !(c.effects || []).some(drop)) return; const keep = c.effects.filter((e) => !drop(e)); effSave({ effects: keep, rem: (c.rem || []).filter((r) => keep.some((e) => e.id === r.eff)) }); }, 0);
}
/* Auf dem eigenen Gerät: Zustände aus Effekten auf den eigenen Helden übernehmen, abgelaufene Konzentration beenden */
/* Zustände eines Effekts (ein Effekt kann mehrere Zustände setzen) */
const effConds = (e) => (e.conds || (e.cond ? [e.cond] : [])).filter((k) => COND[k]);
/* Zustände eines Gegners: eigene + aus laufenden Effekten (enden mit dem Effekt von selbst) */
function npcConds(x) { const fromEff = effList().filter((e) => e.tgt === 'n:' + x.id).flatMap(effConds); return [...new Set((x.cond || []).concat(fromEff))]; }
function effSyncMine() {
  const ch = S.chars[S.cur]; if (!ch || !UID || !S.camp) return; const P = ch.play; const me = 'p:' + UID; let changed = false;
  const eff = effList();
  const want = [...new Set(eff.filter((e) => e.tgt === me).flatMap(effConds))];
  const had = P.effCond || [];
  P.cond = P.cond || [];
  for (const k of want) if (!P.cond.includes(k)) { P.cond.push(k); (COND[k].adds || []).forEach((a) => { if (!P.cond.includes(a)) P.cond.push(a); }); changed = true; }
  for (const k of had) if (!want.includes(k)) { const keepAdds = new Set(want.flatMap((w) => COND[w].adds || [])); P.cond = P.cond.filter((x) => x !== k && !((COND[k].adds || []).includes(x) && !keepAdds.has(x) && !want.includes(x))); changed = true; bannerToast('Effekt endet', COND[k].name + ' ist vorbei.'); }
  if (JSON.stringify(had) !== JSON.stringify(want)) { P.effCond = want; changed = true; }
  if (P.conc && P.concEff && S.combat && S.combat.active && !eff.some((e) => e.id === P.concEff)) { const nm = P.conc.name; P.concEff = null; endConc(P); bannerToast('Dauer abgelaufen', nm + ' endet.'); changed = true; }
  const mine = remList().filter((r) => r.tgt === me);
  for (const r of mine) if (!(S.remSeen || {})[r.id]) { S.remSeen = Object.assign({}, S.remSeen, { [r.id]: 1 }); bannerToast('Rettungswurf fällig', AB_K[r.ab] + '-Rettungswurf SG ' + r.dc + ' gegen ' + r.name); }
  if (changed) { ch.updated = Date.now(); persist('c', ch.id); queueMe(); if (S.view === 'sheet') render(); }
}

/* ---------- Anzeige ---------- */
function effBadges(key, lead) {
  const eff = effList().filter((e) => e.tgt === key || (!e.tgt && e.src === key));
  const rem = remList().filter((r) => r.tgt === key);
  let h = eff.map((e) => '<button class="effb' + (e.left != null && e.left <= 1 ? ' soon' : '') + (e.tgt ? '' : ' self') + '" data-act="effOpen" data-arg="' + e.id + '" title="' + esc(e.name + (e.src ? ' · von ' + partName(e.src) : '') + (e.tgt ? ' · auf ' + partName(e.tgt) : ' · ohne Ziel')) + '">' + (e.conc ? '<i>K</i>' : '') + esc(e.name) + (e.cond && COND[e.cond] && e.cond !== e.name ? ' · ' + COND[e.cond].name : '') + (e.left != null ? ' <b>' + e.left + '</b>' : '') + '</button>').join('');
  const canRoll = (r) => r.tgt === 'p:' + UID || (lead && r.tgt.startsWith('n:'));
  h += rem.map((r) => '<span class="remb">RW ' + AB_K[r.ab] + ' SG ' + r.dc + ' · ' + esc(r.name) + (canRoll(r) ? (r.tgt.startsWith('p:') ? '<button class="btn sm" data-act="remRoll" data-arg="' + r.id + '">Würfeln</button>' : '<button class="btn sm" data-act="remRes" data-arg="' + r.id + '" data-ok="1">Geschafft</button><button class="btn sm ghost" data-act="remRes" data-arg="' + r.id + '" data-ok="0">Misslungen</button>') : '') + '</span>').join('');
  return h ? '<span class="effs">' + h + '</span>' : '';
}
function effMineHtml() {
  if (!S.camp || !UID) return ''; const me = 'p:' + UID;
  const eff = effList().filter((e) => e.tgt === me || (!e.tgt && e.src === me)); const rem = remList().filter((r) => r.tgt === me);
  if (!eff.length && !rem.length) return '';
  return '<div class="tnow"><span class="tinfo">Effekte:</span>' + effBadges(me, false) + '</div>';
}
function effForm(editId) {
  const c = S.combat; const o = order(); const e = editId ? effList().find((x) => x.id === editId) : null; const cur0 = curEntry();
  const opts = (sel, withNone) => (withNone ? '<option value="">' + withNone + '</option>' : '') + o.map((x) => '<option value="' + x.key + '"' + (x.key === sel ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('');
  const m = $('#modal'); S.modal = 'eff';
  if (e) {
    m.innerHTML = '<div class="dlg effdlg" role="dialog" aria-modal="true" aria-label="Effekt"><div class="dph"><h3>' + esc(e.name) + '</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
      '<p>' + (e.src ? 'Von <b>' + esc(partName(e.src)) + '</b>' : 'Ohne Verursacher') + (e.tgt ? ' auf <b>' + esc(partName(e.tgt)) + '</b>' : ' · noch ohne Ziel') + (e.conc ? ' · Konzentration' : '') + '</p>' +
      (e.cond && COND[e.cond] ? '<p class="hint">Zustand: ' + COND[e.cond].name + ' – wird beim Ziel automatisch gesetzt und wieder entfernt.</p>' : '') +
      (e.save && e.save.ab ? '<p class="hint">Rettungswurf ' + AB_K[e.save.ab] + ' SG ' + e.save.dc + ' am ' + (e.save.when === 'start' ? 'Beginn' : 'Ende') + ' jedes Zuges des Ziels.</p>' : '') +
      '<div class="row">' + field('Ziel', '<select id="effTgtE">' + opts(e.tgt, '— ohne Ziel —') + '</select>') + field('Runden übrig', '<input type="number" id="effLeftE" min="0" value="' + (e.left ?? '') + '" placeholder="unbegrenzt">') + '</div>' +
      '<div class="chips end"><button class="btn ghost" data-act="effDel" data-arg="' + e.id + '">Effekt beenden</button><button class="btn" data-act="effUpd" data-arg="' + e.id + '">Speichern</button></div></div>';
  } else {
    const me = 'p:' + UID;
    m.innerHTML = '<div class="dlg effdlg" role="dialog" aria-modal="true" aria-label="Effekt hinzufügen"><div class="dph"><h3>Effekt hinzufügen</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
      '<div class="row">' + field('Name', '<input type="text" id="effName" list="effNames" placeholder="z. B. Person festhalten">' + '<datalist id="effNames">' + Object.values(COND).map((x) => '<option value="' + x.name + '">').join('') + Object.values(SPELLS).filter((s) => durRounds(s.dur) && durRounds(s.dur) <= 100).map((s) => '<option value="' + esc(s.name) + '">').join('') + '</datalist>') + field('Zustand verknüpfen', '<select id="effCond"><option value="">— keiner —</option>' + Object.entries(COND).map(([k, x]) => '<option value="' + k + '">' + x.name + '</option>').join('') + '</select>') + '</div>' +
      '<div class="row">' + field('Ziel', '<select id="effTgt">' + opts(cur0 && cur0.key !== me ? cur0.key : '', '— ohne Ziel —') + '</select>') + field('Verursacher', '<select id="effSrc">' + opts(o.some((x) => x.key === me) ? me : (cur0 ? cur0.key : ''), '— niemand —') + '</select>') + '</div>' +
      '<div class="row">' + field('Dauer in Runden', '<input type="number" id="effLeft" min="1" value="10" placeholder="leer = unbegrenzt">', '1 Minute = 10 Runden') + field('Runde zählt', '<select id="effAt"><option value="start">zu Beginn des Zuges des Verursachers</option><option value="end">am Ende des Zuges des Verursachers</option></select>') + '</div>' +
      '<div class="row">' + field('Rettungswurf', '<select id="effAb">' + SAVE_AB.map(([k, l]) => '<option value="' + k + '">' + l + '</option>').join('') + '</select>') + field('SG', '<input type="number" id="effDc" min="1" value="13">') + field('Wann', '<select id="effWhen"><option value="end">am Ende jedes Zuges des Ziels</option><option value="start">zu Beginn jedes Zuges des Ziels</option></select>') + '</div>' +
      '<label class="chk"><input type="checkbox" id="effConc"> Konzentration des Verursachers</label>' +
      '<div class="chips end"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" data-act="effAdd">Hinzufügen</button></div></div>';
  }
  m.hidden = false;
}
Object.assign(XA, {
  effNew: () => effForm(),
  effOpen: (t, a) => effForm(a),
  effAdd: () => {
    const c = S.combat; if (!c) return; const v = (id) => ($('#' + id) || {}).value || '';
    const cond = v('effCond'); const name = v('effName').trim() || (cond ? COND[cond].name : 'Effekt'); const left = v('effLeft') === '' ? null : Math.max(1, +v('effLeft'));
    const condK = cond || (Object.entries(COND).find(([, x]) => x.name.toLowerCase() === name.toLowerCase()) || [])[0] || '';
    const e = { id: effUid(), name, cond: condK, src: v('effSrc'), tgt: v('effTgt'), left, at: v('effAt') || 'start', conc: !!($('#effConc') || {}).checked, save: v('effAb') ? { ab: v('effAb'), dc: +v('effDc') || 10, when: v('effWhen') } : null, t: Date.now() };
    S.modal = null; $('#modal').hidden = true;
    effSave({ effects: (c.effects || []).concat([e]), log: clog(c, name + (e.tgt ? ' auf ' + partName(e.tgt) : '') + (left ? ' (' + left + ' Runden)' : '')) });
  },
  effUpd: (t, a) => { const c = S.combat; const lv = $('#effLeftE').value; const tg = $('#effTgtE').value; S.modal = null; $('#modal').hidden = true; effSave({ effects: (c.effects || []).map((e) => e.id === a ? Object.assign({}, e, { tgt: tg, left: lv === '' ? null : Math.max(0, +lv) }) : e).filter((e) => e.left == null || e.left > 0) }); },
  effDel: (t, a) => { const c = S.combat; const e = (c.effects || []).find((x) => x.id === a); S.modal = null; $('#modal').hidden = true; effSave({ effects: (c.effects || []).filter((x) => x.id !== a), rem: (c.rem || []).filter((r) => r.eff !== a), log: clog(c, (e ? e.name : 'Effekt') + ' beendet') }); },
  remRoll: (t, a, p, ch) => {
    const r = remList().find((x) => x.id === a); if (!r || !ch) return; const d = derive(ch, S.hb);
    const total = d20(d.saves[r.ab].val, AB_DE[r.ab] + '-Rettungswurf gegen ' + r.name + ' (SG ' + r.dc + ')', { kind: 'save:' + r.ab });
    const ok = typeof total === 'number' && total >= r.dc; const c = S.combat;
    setTimeout(() => { effSave({ rem: (c.rem || []).filter((x) => x.id !== a), effects: ok ? (c.effects || []).filter((e) => e.id !== r.eff) : c.effects, log: clog(c, partName(r.tgt) + ': Rettungswurf gegen ' + r.name + (ok ? ' geschafft – Effekt endet' : ' misslungen')) }); bannerToast(ok ? 'Geschafft!' : 'Misslungen', r.name + (ok ? ' endet.' : ' wirkt weiter.')); }, 900);
  },
  remRes: (t, a) => { const r = remList().find((x) => x.id === a); if (!r) return; const ok = t.dataset.ok === '1'; const c = S.combat; effSave({ rem: (c.rem || []).filter((x) => x.id !== a), effects: ok ? (c.effects || []).filter((e) => e.id !== r.eff) : c.effects, log: clog(c, partName(r.tgt) + ': Rettungswurf gegen ' + r.name + (ok ? ' geschafft – Effekt endet' : ' misslungen')) }); }
});
