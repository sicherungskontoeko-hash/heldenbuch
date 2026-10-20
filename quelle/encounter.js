/* ==== Gegner- und Begegnungsmanager (P06) ==== */
const CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000 };
/* XP-Budget pro Charakter (Niedrig / Moderat / Hoch), SRD 5.2 */
const XP_BUDGET = [null, [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]];
const ENC_KEY = 'hb_encounters';
function encLoad() { try { return JSON.parse(localStorage.getItem(ENC_KEY) || '[]'); } catch (e) { return []; } }
function encStore(list) { try { localStorage.setItem(ENC_KEY, JSON.stringify(list)); } catch (e) {} }
function partyLevels() {
  const lv = Object.values(S.table || {}).filter((p) => !p.dm && p.level).map((p) => +p.level || 1);
  if (S.meta && S.meta.dm && S.table[S.meta.dm]) { const i = lv.indexOf(+S.table[S.meta.dm].level); if (i >= 0 && lv.length > 1) lv.splice(i, 1); }
  return lv;
}
function encXp(mobs) { return mobs.reduce((s, m) => s + (CR_XP[(BESTIARY[m.mid] || [])[1]] || 0) * (+m.n || 0), 0); }
function encRating(xp, levels) {
  if (!levels.length) return null;
  const b = [0, 1, 2].map((i) => levels.reduce((s, l) => s + XP_BUDGET[Math.max(1, Math.min(20, l))][i], 0));
  const label = xp <= 0 ? '—' : xp <= b[0] ? 'Niedrig' : xp <= b[1] ? 'Moderat' : xp <= b[2] ? 'Hoch' : 'Über „Hoch“ – sehr gefährlich';
  return { b, label, cls: xp <= b[0] ? 'lo' : xp <= b[1] ? 'mid' : xp <= b[2] ? 'hi' : 'xx' };
}
function mkMobs(mid, n, opts, existing) {
  const M = BESTIARY[mid]; if (!M) return []; const same = (existing || []).filter((x) => x.mid === mid).length; const out = [];
  const shared = opts.groupInit ? 1 + Math.floor(rnd() * 20) : null; const grp = opts.groupInit ? uidX() : null;
  for (let i = 0; i < n; i++) { const r = shared ?? 1 + Math.floor(rnd() * 20); const hp = opts.rollHp ? Math.max(1, rollExpr(M[4]).total) : M[3]; out.push({ id: uidX(), mid, name: M[0] + (n > 1 || same ? ' ' + (same + i + 1) : ''), v: r + M[6], dex: M[6], hp, hpMax: hp, ac: M[2], grp, cond: [] }); }
  return out;
}
function encInsert(mobs, label, opts) {
  const c = S.combat; if (!c || !c.active) return; let all = (c.npcs || []).slice(); const add = [];
  for (const m of mobs) { const x = mkMobs(m.mid, +m.n || 1, opts, all.concat(add)); add.push(...x); }
  saveCombat(Object.assign({}, c, { npcs: all.concat(add), t: Date.now(), log: clog(c, (label ? label + ': ' : '') + mobs.map((m) => m.n + '× ' + BESTIARY[m.mid][0]).join(', ') + ' treten dem Kampf bei') }));
  pushLog({ label: label || 'Gegner', total: add.length + '×', detail: mobs.map((m) => m.n + '× ' + BESTIARY[m.mid][0]).join(', ') + ' · Initiative gewürfelt' });
}

/* ---------- Kompakte Gegnerzeile + Detaildialog ---------- */
function npcBits(x) {
  if (!x.hpMax) return '';
  const dm = isDM() || !S.meta.dm;
  const cond = (x.cond || []).filter((k) => COND[k]).map((k) => '<span class="ncond">' + COND[k].name + '</span>').join('');
  if (!dm) return '<span class="nst">' + npcState(x) + '</span>' + cond;
  const sel = (S.npcSel || []).includes(x.id);
  const pct = Math.max(0, Math.min(100, (x.hp / x.hpMax) * 100));
  return '<span class="nhp' + (x.hp <= 0 ? ' dead' : '') + '"><i class="nbar"><i style="width:' + pct + '%"></i></i>TP ' + x.hp + '/' + x.hpMax + ' · RK ' + x.ac + '</span>' + cond +
    '<span class="nctl"><input type="number" id="nh_' + x.id + '" placeholder="TP" aria-label="Betrag"><button class="btn sm dmg" data-act="npcHp" data-arg="' + x.id + '" data-d="dmg" aria-label="Schaden">−</button><button class="btn sm heal" data-act="npcHp" data-arg="' + x.id + '" data-d="heal" aria-label="Heilen">+</button>' +
    '<button class="btn sm ghost" data-act="npcOpen" data-arg="' + x.id + '" aria-label="Details">⋯</button><button class="nsel' + (sel ? ' on' : '') + '" data-act="npcSel" data-arg="' + x.id + '" aria-label="Auswählen" title="Für Sammelaktionen auswählen">' + (sel ? '✓' : '') + '</button></span>';
}
function npcModal(id) {
  const c = S.combat; const x = (c.npcs || []).find((y) => y.id === id); if (!x) return; const M = x.mid && BESTIARY[x.mid];
  const m = $('#modal'); S.modal = 'npc';
  m.innerHTML = '<div class="dlg npcdlg" role="dialog" aria-modal="true" aria-label="' + esc(x.name) + '"><div class="dph"><h3>' + esc(x.name) + '</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    (M ? '<p class="hint" style="margin-top:0">' + esc(M[0]) + ' · HG ' + M[1] + ' · ' + CR_XP[M[1]] + ' EP · Bewegung ' + esc(M[5]) + '</p>' : '') +
    '<div class="row">' + field('Name', '<input type="text" id="npcN" value="' + esc(x.name) + '">') + field('TP', '<input type="number" id="npcHpV" value="' + x.hp + '">') + field('TP-Maximum', '<input type="number" id="npcHpM" value="' + x.hpMax + '">') + field('RK', '<input type="number" id="npcAc" value="' + x.ac + '">') + field('Initiative', '<input type="number" id="npcV" value="' + x.v + '">') + '</div>' +
    '<h4>Zustände</h4><div class="chips">' + Object.entries(COND).map(([k, cd]) => chip((x.cond || []).includes(k), cd.name, 'data-act="npcCond" data-arg="' + x.id + '" data-c="' + k + '" title="' + esc(cd.text) + '"')).join('') + '</div>' +
    (M ? '<h4>Angriffe</h4><div class="chips">' + M[7].map((a, j) => '<button class="btn sm ghost" data-act="npcAtk" data-arg="' + x.id + '" data-j="' + j + '">' + esc(a[0]) + ' ' + sgn(a[1]) + ' · ' + esc(a[2]) + '</button>').join('') + '</div>' + (M[8] ? '<p class="hint">' + esc(M[8]) + '</p>' : '') : '') +
    '<h4>Notiz</h4><textarea id="npcNote" rows="2" placeholder="z. B. verletzt am Bein, flieht bei halben TP">' + esc(x.note || '') + '</textarea>' +
    '<div class="chips end"><button class="btn ghost" data-act="npcDup" data-arg="' + x.id + '">Duplizieren</button><button class="btn ghost" data-act="npcDel" data-arg="' + x.id + '">Entfernen</button><button class="btn" data-act="npcSave" data-arg="' + x.id + '">Speichern</button></div></div>';
  m.hidden = false;
}
function npcBulkBar() {
  const sel = (S.npcSel || []).filter((id) => ((S.combat && S.combat.npcs) || []).some((x) => x.id === id)); S.npcSel = sel;
  const lead = !S.meta.dm || isDM(); if (!lead || !S.combat || !S.combat.active) return '';
  const npcs = S.combat.npcs || []; const grps = {}; npcs.forEach((x) => { const k = x.mid || x.name; (grps[k] = grps[k] || []).push(x.id); });
  const quick = Object.entries(grps).filter(([, ids]) => ids.length > 1).map(([k, ids]) => '<button class="chip" data-act="npcSelGrp" data-arg="' + esc(k) + '">Alle ' + esc((BESTIARY[k] || [k])[0]) + ' (' + ids.length + ')</button>').join('');
  if (!sel.length) return quick ? '<div class="bulk"><span class="tinfo">Gruppen:</span>' + quick + '</div>' : '';
  return '<div class="bulk on"><b>' + sel.length + ' ausgewählt</b><input type="number" id="bulkN" placeholder="TP" aria-label="Betrag"><button class="btn sm dmg" data-act="bulkHp" data-arg="dmg">Schaden</button><button class="btn sm ghost" data-act="bulkHp" data-arg="half">½ Schaden</button><button class="btn sm heal" data-act="bulkHp" data-arg="heal">Heilen</button>' +
    '<select id="bulkCond" aria-label="Zustand"><option value="">+ Zustand …</option>' + Object.entries(COND).map(([k, cd]) => '<option value="' + k + '">' + cd.name + '</option>').join('') + '</select>' +
    '<span class="bsave"><input type="number" id="bulkSv" placeholder="RW-Bonus" aria-label="Rettungswurf-Bonus" value="0"><input type="number" id="bulkDc" placeholder="SG" aria-label="SG"><button class="btn sm ghost" data-act="bulkSave">Rettungswürfe würfeln</button></span>' +
    quick + '<button class="link" data-act="npcSelNone">Auswahl aufheben</button></div>';
}
function encPlanner() {
  S.enc = S.enc || { name: '', mobs: [{ mid: '', n: 1 }], lv: '', np: '' };
  const E = S.enc; const auto = partyLevels();
  const levels = auto.length ? auto : (E.np && E.lv ? Array.from({ length: Math.max(1, +E.np) }, () => +E.lv) : []);
  const valid = E.mobs.filter((m) => BESTIARY[m.mid] && +m.n > 0); const xp = encXp(valid); const r = encRating(xp, levels);
  const opts = '<option value="">— Monster —</option>' + Object.entries(BESTIARY).sort((a, b) => a[1][0].localeCompare(b[1][0], 'de')).map(([k, mm]) => '<option value="' + k + '">' + esc(mm[0]) + ' (HG ' + mm[1] + ')</option>').join('');
  const saved = encLoad();
  const m = $('#modal'); S.modal = 'enc';
  m.innerHTML = '<div class="dlg encdlg" role="dialog" aria-modal="true" aria-label="Begegnung planen"><div class="dph"><h3>Begegnung planen</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<div class="row">' + field('Name der Begegnung', '<input type="text" id="encName" value="' + esc(E.name) + '" placeholder="z. B. Hinterhalt am Pass">') + '</div>' +
    '<div class="encmobs">' + E.mobs.map((mo, i) => '<div class="encm"><select data-enc="mid" data-i="' + i + '" aria-label="Monster">' + opts.replace('value="' + mo.mid + '"', 'value="' + mo.mid + '" selected') + '</select><input type="number" min="1" max="30" value="' + mo.n + '" data-enc="n" data-i="' + i + '" aria-label="Anzahl"><span class="encxp">' + (BESTIARY[mo.mid] ? (CR_XP[BESTIARY[mo.mid][1]] * mo.n) + ' EP' : '') + '</span><button class="x" data-act="encRm" data-arg="' + i + '" aria-label="Entfernen">×</button></div>').join('') + '</div>' +
    '<button class="btn sm ghost" data-act="encAddRow">+ Monster</button>' +
    '<div class="encsum"><div><small>Gesamt</small><b>' + xp.toLocaleString('de-CH') + ' EP</b></div>' + (r ? '<div class="encr ' + r.cls + '"><small>Schwierigkeit für ' + levels.length + ' Helden (Stufe ' + [...new Set(levels)].join('/') + ')</small><b>' + r.label + '</b><span>Niedrig ≤ ' + r.b[0] + ' · Moderat ≤ ' + r.b[1] + ' · Hoch ≤ ' + r.b[2] + '</span></div>' : '<div class="encr"><small>Gruppe</small><span>Anzahl und Stufe eingeben (oder am Tisch spielen – dann automatisch)</span></div>') + '</div>' +
    (auto.length ? '' : '<div class="row">' + field('Anzahl Helden', '<input type="number" min="1" max="10" data-enc="np" value="' + esc(E.np) + '">') + field('Stufe', '<input type="number" min="1" max="20" data-enc="lv" value="' + esc(E.lv) + '">') + '</div>') +
    '<label class="chk"><input type="checkbox" id="encGrp"' + (S.encGrp ? ' checked' : '') + '> Gleiche Monster würfeln gemeinsam Initiative</label><label class="chk"><input type="checkbox" id="encRoll"' + (S.encRoll ? ' checked' : '') + '> TP würfeln statt Durchschnitt</label>' +
    '<div class="chips end">' + (S.combat && S.combat.active && (!S.meta.dm || isDM()) ? '<button class="btn" data-act="encGo"' + (valid.length ? '' : ' disabled') + '>In den Kampf einsetzen</button>' : '') + '<button class="btn ghost" data-act="encSave"' + (valid.length ? '' : ' disabled') + '>Als Vorlage speichern</button></div>' +
    (saved.length ? '<h4>Gespeicherte Begegnungen</h4><div class="enclist">' + saved.map((s, i) => '<div class="encs"><div><b>' + esc(s.name || 'Begegnung') + '</b><small>' + s.mobs.map((mo) => mo.n + '× ' + (BESTIARY[mo.mid] || ['?'])[0]).join(', ') + ' · ' + encXp(s.mobs).toLocaleString('de-CH') + ' EP</small></div><button class="btn sm ghost" data-act="encLoadT" data-arg="' + i + '">Laden</button>' + (S.combat && S.combat.active && (!S.meta.dm || isDM()) ? '<button class="btn sm" data-act="encUse" data-arg="' + i + '">Einsetzen</button>' : '') + '<button class="x" data-act="encDelT" data-arg="' + i + '" aria-label="Löschen">×</button></div>').join('') + '</div>' : '') + '</div>';
  m.hidden = false;
}
function encOpts() { const g = $('#encGrp'), r = $('#encRoll'); if (g) S.encGrp = g.checked; if (r) S.encRoll = r.checked; return { groupInit: !!S.encGrp, rollHp: !!S.encRoll }; }
function bestiaryAdder() {
  return '<div class="fgrp"><b>Aus dem Bestiarium</b><div class="chips"><select id="mobSel" aria-label="Monster"><option value="">— Monster wählen —</option>' + Object.entries(BESTIARY).sort((a, b) => a[1][0].localeCompare(b[1][0], 'de')).map(([k, m]) => '<option value="' + k + '">' + esc(m[0]) + ' (HG ' + m[1] + ')</option>').join('') + '</select><input type="number" id="mobN" value="1" min="1" max="12" aria-label="Anzahl"><label class="chk"><input type="checkbox" id="mobRoll"> TP würfeln</label><label class="chk"><input type="checkbox" id="mobGrp"> gemeinsame Initiative</label><button class="btn ghost sm" data-act="mobAdd">Hinzufügen</button><button class="btn sm" data-act="encOpen">Begegnung planen / laden</button></div></div>';
}
const updNpc = (id, fn, logx) => { const c = S.combat; if (!c) return; const npcs = (c.npcs || []).map((x) => x.id === id ? fn(Object.assign({}, x)) : x); saveCombat(Object.assign({}, c, { npcs, t: Date.now(), log: logx ? clog(c, logx) : c.log })); };
Object.assign(XA, {
  mobAdd: () => { const id = $('#mobSel').value; if (!BESTIARY[id]) return; const n = Math.max(1, Math.min(12, +$('#mobN').value || 1)); encInsert([{ mid: id, n }], '', { rollHp: $('#mobRoll').checked, groupInit: ($('#mobGrp') || {}).checked }); },
  npcOpen: (t, a) => npcModal(a),
  npcCond: (t, a) => { const k = t.dataset.c; updNpc(a, (x) => { const cs = (x.cond || []).slice(); const i = cs.indexOf(k); if (i >= 0) cs.splice(i, 1); else cs.push(k); x.cond = cs; return x; }); setTimeout(() => npcModal(a), 30); },
  npcSave: (t, a) => { const v = (id) => ($('#' + id) || {}).value; updNpc(a, (x) => { x.name = (v('npcN') || x.name).trim(); x.hpMax = Math.max(1, +v('npcHpM') || x.hpMax); x.hp = Math.max(0, Math.min(x.hpMax, +v('npcHpV'))); x.ac = +v('npcAc') || x.ac; x.v = +v('npcV'); x.note = v('npcNote') || ''; return x; }); S.modal = null; $('#modal').hidden = true; },
  npcDup: (t, a) => { const c = S.combat; const x = (c.npcs || []).find((y) => y.id === a); if (!x) return; const r = 1 + Math.floor(rnd() * 20); const cp = Object.assign({}, x, { id: uidX(), name: x.name.replace(/ \d+$/, '') + ' ' + ((c.npcs || []).filter((y) => (y.mid || y.name) === (x.mid || x.name)).length + 1), v: x.grp ? x.v : r + (+x.dex || 0), hp: x.hpMax, cond: [] }); saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).concat([cp]), t: Date.now() })); S.modal = null; $('#modal').hidden = true; },
  npcSel: (t, a) => { S.npcSel = S.npcSel || []; const i = S.npcSel.indexOf(a); if (i >= 0) S.npcSel.splice(i, 1); else S.npcSel.push(a); paintCamp(); },
  npcSelGrp: (t, a) => { S.npcSel = ((S.combat && S.combat.npcs) || []).filter((x) => (x.mid || x.name) === a).map((x) => x.id); paintCamp(); },
  npcSelNone: () => { S.npcSel = []; paintCamp(); },
  bulkHp: (t, a) => { const c = S.combat; let n = Math.max(0, +($('#bulkN') || {}).value || 0); if (!n) return; if (a === 'half') n = Math.floor(n / 2); const sel = S.npcSel || []; const dead = [];
    const npcs = (c.npcs || []).map((x) => { if (!sel.includes(x.id)) return x; const hp = a === 'heal' ? Math.min(x.hpMax, x.hp + n) : Math.max(0, x.hp - n); if (hp <= 0 && x.hp > 0) dead.push(x.name); return Object.assign({}, x, { hp }); });
    let lg = clog(c, sel.length + ' Gegner: ' + (a === 'heal' ? '+' : '−') + n + ' TP'); dead.forEach((d) => { lg = clog({ log: lg }, d + ' ist besiegt'); });
    saveCombat(Object.assign({}, c, { npcs, t: Date.now(), log: lg })); if (dead.length) pushLog({ label: dead.length + ' besiegt', total: '†', detail: dead.join(', '), share: true }); },
  bulkSave: () => { const c = S.combat; const b = +($('#bulkSv') || {}).value || 0; const dc = +($('#bulkDc') || {}).value || 0; const sel = (c.npcs || []).filter((x) => (S.npcSel || []).includes(x.id));
    const res = sel.map((x) => { const r = 1 + Math.floor(rnd() * 20); const tot = r + b; return { x, r, tot, ok: dc ? (r === 20 || (r !== 1 && tot >= dc)) : null }; });
    pushLog({ label: 'Rettungswürfe' + (dc ? ' (SG ' + dc + ')' : ''), total: dc ? res.filter((q) => q.ok).length + '/' + res.length : '✦', detail: res.map((q) => q.x.name + ' ' + q.tot + (dc ? (q.ok ? ' ✓' : ' ✗') : '')).join(' · ') });
    if (dc) { S.npcSel = res.filter((q) => !q.ok).map((q) => q.x.id); bannerToast('Rettungswürfe', res.filter((q) => !q.ok).length + ' misslungen – diese bleiben für den vollen Schaden ausgewählt.'); paintCamp(); } },
  encOpen: () => encPlanner(),
  encAddRow: () => { S.enc.mobs.push({ mid: '', n: 1 }); encPlanner(); },
  encRm: (t, a) => { S.enc.mobs.splice(+a, 1); if (!S.enc.mobs.length) S.enc.mobs.push({ mid: '', n: 1 }); encPlanner(); },
  encSave: () => { const E = S.enc; E.name = ($('#encName') || {}).value || E.name; const list = encLoad(); list.unshift({ id: uidX(), name: E.name || 'Begegnung', mobs: E.mobs.filter((m) => BESTIARY[m.mid] && +m.n > 0), t: Date.now() }); encStore(list.slice(0, 40)); bannerToast('Gespeichert', E.name || 'Begegnung'); encPlanner(); },
  encLoadT: (t, a) => { const s = encLoad()[+a]; if (!s) return; S.enc = { name: s.name, mobs: s.mobs.map((m) => Object.assign({}, m)), lv: (S.enc || {}).lv || '', np: (S.enc || {}).np || '' }; encPlanner(); },
  encDelT: (t, a) => { const list = encLoad(); list.splice(+a, 1); encStore(list); encPlanner(); },
  encGo: () => { const E = S.enc; E.name = ($('#encName') || {}).value || E.name; const o = encOpts(); S.modal = null; $('#modal').hidden = true; encInsert(E.mobs.filter((m) => BESTIARY[m.mid] && +m.n > 0), E.name, o); },
  encUse: (t, a) => { const s = encLoad()[+a]; if (!s) return; const o = encOpts(); S.modal = null; $('#modal').hidden = true; encInsert(s.mobs, s.name, o); },
  encFromFight: () => { const c = S.combat; const g = {}; (c.npcs || []).forEach((x) => { if (x.mid) g[x.mid] = (g[x.mid] || 0) + 1; }); S.enc = { name: '', mobs: Object.entries(g).map(([mid, n]) => ({ mid, n })), lv: '', np: '' }; if (!S.enc.mobs.length) S.enc.mobs.push({ mid: '', n: 1 }); encPlanner(); }
});
document.addEventListener('change', (ev) => { const t = ev.target; if (t && (t.id === 'encGrp' || t.id === 'encRoll')) { encOpts(); return; } if (t && t.dataset && t.dataset.enc && S.enc) { const k = t.dataset.enc; if (k === 'mid' || k === 'n') { const mo = S.enc.mobs[+t.dataset.i]; if (mo) mo[k] = k === 'n' ? Math.max(1, +t.value || 1) : t.value; } else S.enc[k] = t.value; const nm = $('#encName'); if (nm) S.enc.name = nm.value; encPlanner(); }
  if (t && t.id === 'bulkCond' && t.value) { const k = t.value; const c = S.combat; const sel = S.npcSel || []; saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).map((x) => sel.includes(x.id) ? Object.assign({}, x, { cond: [...new Set((x.cond || []).concat([k]))] }) : x), t: Date.now(), log: clog(c, sel.length + ' Gegner: ' + COND[k].name) })); } });
