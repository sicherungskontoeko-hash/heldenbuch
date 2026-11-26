/* ==== Gegner- und Begegnungsmanager (P06) ==== */
const CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000 };
/* XP-Budget pro Charakter (Niedrig / Moderat / Hoch), SRD 5.2.1 */
const XP_BUDGET = [null, [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]];
const ENC_KEY = 'hb_encounters';
function encLoad() { try { return JSON.parse(localStorage.getItem(ENC_KEY) || '[]'); } catch (e) { return []; } }
function encStore(list) { try { localStorage.setItem(ENC_KEY, JSON.stringify(list)); } catch (e) {} }
function partyLevels() {
  return players().filter(([, p]) => p && p.level).map(([, p]) => +p.level || 1); /* die Spielleitung zählt nur mit, wenn sie selbst mitspielt */
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
  const d20i = () => { const a1 = 1 + Math.floor(rnd() * 20); return opts.surprised ? Math.min(a1, 1 + Math.floor(rnd() * 20)) : a1; }; const shared = opts.groupInit ? d20i() : null; const grp = opts.groupInit ? uidX() : null;
  for (let i = 0; i < n; i++) { const r = shared ?? d20i(); const hp = opts.rollHp ? Math.max(1, rollExpr(M[4]).total) : M[3]; out.push({ id: uidX(), mid, name: M[0] + (n > 1 || same ? ' ' + (same + i + 1) : ''), v: r + M[6], dex: M[6], hp, hpMax: hp, ac: M[2], grp, cond: [], reserve: opts.reserve ? true : undefined }); }
  return out;
}
function encInsert(mobs, label, opts) {
  const c = S.combat; if (!c || !c.active) return; let all = (c.npcs || []).slice(); const add = [];
  for (const m of mobs) { const x = mkMobs(m.mid, +m.n || 1, opts, all.concat(add)); add.push(...x); }
  const what = mobs.map((m) => m.n + '× ' + BESTIARY[m.mid][0]).join(', ');
  saveCombat(Object.assign({}, c, { npcs: all.concat(add), t: Date.now(), log: clog(c, (label ? label + ': ' : '') + what + (opts.reserve ? ' warten als Verstärkung' : ' treten dem Kampf bei')) }));
  pushLog({ label: label || 'Gegner', total: add.length + '×', detail: what + (opts.reserve ? ' · als Verstärkung bereit (noch nicht in der Reihenfolge)' : ' · Initiative gewürfelt') });
}

/* ---------- Kompakte Gegnerzeile + Detaildialog ---------- */
function npcBits(x) {
  if (!x.hpMax) return '';
  const dm = isDM() || !S.meta.dm;
  const cond = (typeof npcConds === 'function' ? npcConds(x) : x.cond || []).filter((k) => ownKey(COND, k)).map((k) => '<span class="ncond">' + esc(COND[k].name) + '</span>').join('');
  if (!dm) return '<span class="nst">' + npcState(x) + '</span>' + cond;
  const sel = (S.npcSel || []).includes(x.id);
  const pct = Math.max(0, Math.min(100, (+x.hp / +x.hpMax) * 100)) || 0; /* nur endliche Zahl in CSS */
  return '<span class="nhp' + (x.hp <= 0 ? ' dead' : '') + '"><i class="nbar"><i style="width:' + pct + '%"></i></i>TP ' + esc(x.hp) + '/' + esc(x.hpMax) + ' · RK ' + esc(x.ac) + '</span>' + cond +
    '<span class="nctl"><input type="number" id="nh_' + esc(x.id) + '" placeholder="TP" aria-label="Betrag"><button class="btn sm dmg" data-act="npcHp" data-arg="' + esc(x.id) + '" data-d="dmg" aria-label="Schaden">−</button><button class="btn sm heal" data-act="npcHp" data-arg="' + esc(x.id) + '" data-d="heal" aria-label="Heilen">+</button>' +
    '<button class="btn sm ghost" data-act="npcOpen" data-arg="' + esc(x.id) + '" aria-label="Details">⋯</button><button class="nsel' + (sel ? ' on' : '') + '" data-act="npcSel" data-arg="' + esc(x.id) + '" aria-label="Auswählen" title="Für Sammelaktionen auswählen">' + (sel ? '✓' : '') + '</button></span>';
}
function npcModal(id) {
  const c = S.combat; const x = (c.npcs || []).find((y) => y.id === id); if (!x) return; const M = x.mid && BESTIARY[x.mid];
  const m = $('#modal'); S.modal = 'npc';
  m.innerHTML = '<div class="dlg npcdlg" role="dialog" aria-modal="true" aria-label="' + esc(x.name) + '"><div class="dph">' + (typeof mobPic === 'function' ? mobPic(x.mid, 'mpicD') : '') + '<h3>' + esc(x.name) + '</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    (M ? '<p class="hint" style="margin-top:0">' + esc(M[0]) + ' · HG ' + esc(M[1]) + ' · ' + esc(CR_XP[M[1]]) + ' EP · Bewegung ' + esc(M[5]) + '</p>' : '') + (typeof mobSaveRow === 'function' ? mobSaveRow(x.mid, x.name) : '') +
    '<div class="row">' + field('Name', '<input type="text" id="npcN" value="' + esc(x.name) + '">') + field('TP', '<input type="number" id="npcHpV" value="' + esc(x.hp) + '">') + field('TP-Maximum', '<input type="number" id="npcHpM" value="' + esc(x.hpMax) + '">') + field('RK', '<input type="number" id="npcAc" value="' + esc(x.ac) + '">') + field('Initiative', '<input type="number" id="npcV" value="' + esc(x.v) + '">') + '</div>' +
    '<h4>Zustände</h4><div class="chips">' + Object.entries(COND).map(([k, cd]) => chip((x.cond || []).includes(k), cd.name, 'data-act="npcCond" data-arg="' + esc(x.id) + '" data-c="' + esc(k) + '" title="' + esc(cd.text) + '"')).join('') + '</div>' +
    (M ? '<h4>Angriffe' + (c.turn === 'n:' + x.id && typeof mobAtkMax === 'function' ? ' <small>' + esc(x.atkN || 0) + ' von ' + esc(mobAtkMax(x.mid)) + ' diesen Zug</small>' : '') + '</h4><div class="chips">' + M[7].map((a, j) => '<button class="btn sm ghost" data-act="npcAtk" data-arg="' + esc(x.id) + '" data-j="' + esc(j) + '">' + esc(a[0]) + ' ' + sgn(a[1]) + ' · ' + esc(a[2]) + '</button>').join('') + '</div>' + (M[8] ? '<p class="hint">' + esc(M[8]) + '</p>' : '') : '') +
    '<h4>Notiz</h4><textarea id="npcNote" rows="2" placeholder="z. B. verletzt am Bein, flieht bei halben TP">' + esc(x.note || '') + '</textarea>' +
    '<div class="chips end"><button class="btn ghost" data-act="npcDup" data-arg="' + esc(x.id) + '">Duplizieren</button><button class="btn ghost" data-act="npcDel" data-arg="' + esc(x.id) + '">Entfernen</button><button class="btn" data-act="npcSave" data-arg="' + esc(x.id) + '">Speichern</button></div></div>';
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
    '<span class="bsave"><select id="bulkAb" aria-label="Rettungswurf-Attribut"><option value="">Bonus von Hand</option>' + MSAVE_AB.map((a, i) => '<option value="' + i + '">' + a + ' (aus den Werten)</option>').join('') + '</select><input type="number" id="bulkSv" placeholder="RW-Bonus" aria-label="Rettungswurf-Bonus" value="0"><input type="number" id="bulkDc" placeholder="SG" aria-label="SG"><button class="btn sm ghost" data-act="bulkSave">Rettungswürfe würfeln</button></span>' +
    quick + '<button class="link" data-act="npcSelNone">Auswahl aufheben</button></div>';
}
function encPlanner() {
  S.enc = S.enc || { name: '', mobs: [{ mid: '', n: 1 }], lv: '', np: '' };
  const E = S.enc; const auto = partyLevels();
  const levels = auto.length ? auto : (E.np && E.lv ? Array.from({ length: Math.max(1, +E.np) }, () => +E.lv) : []);
  const valid = E.mobs.filter((m) => BESTIARY[m.mid] && +m.n > 0); const xp = encXp(valid); const r = encRating(xp, levels);
  const opts = '<option value="">— Monster —</option>' + (typeof HABITATS !== 'undefined' ? Object.keys(HABITATS).map((h) => { const l = Object.entries(BESTIARY).filter(([k]) => mobHab(k)[0] === h).sort((a, b) => crNum(a[1][1]) - crNum(b[1][1])); return l.length ? '<optgroup label="' + esc(HABITATS[h]) + '">' + l.map(([k, mm]) => '<option value="' + k + '">' + esc(mm[0]) + ' (HG ' + mm[1] + ')</option>').join('') + '</optgroup>' : ''; }).join('') : Object.entries(BESTIARY).sort((a, b) => cmpDe(a[1][0], b[1][0])).map(([k, mm]) => '<option value="' + k + '">' + esc(mm[0]) + ' (HG ' + mm[1] + ')</option>').join(''));
  const saved = encLoad();
  const m = $('#modal'); S.modal = 'enc';
  m.innerHTML = '<div class="dlg encdlg" role="dialog" aria-modal="true" aria-label="Begegnung planen"><div class="dph"><h3>Begegnung planen</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    (typeof encRandBox === 'function' ? encRandBox() : '') +
    '<div class="row">' + field('Name der Begegnung', '<input type="text" id="encName" value="' + esc(E.name) + '" placeholder="z. B. Hinterhalt am Pass">') + '</div>' +
    '<div class="encmobs">' + E.mobs.map((mo, i) => '<div class="encm"><select data-enc="mid" data-i="' + esc(i) + '" aria-label="Monster">' + opts.replace('value="' + mo.mid + '"', 'value="' + mo.mid + '" selected') + '</select><input type="number" min="1" max="30" value="' + mo.n + '" data-enc="n" data-i="' + esc(i) + '" aria-label="Anzahl"><span class="encxp">' + (BESTIARY[mo.mid] ? (CR_XP[BESTIARY[mo.mid][1]] * mo.n) + ' EP' : '') + '</span><button class="x" data-act="encRm" data-arg="' + esc(i) + '" aria-label="Entfernen">×</button></div>').join('') + '</div>' +
    '<button class="btn sm ghost" data-act="encAddRow">+ Monster</button>' +
    '<div class="encsum"><div><small>Gesamt</small><b>' + xp.toLocaleString('de-CH') + ' EP</b></div>' + (r ? '<div class="encr ' + r.cls + '"><small>Schwierigkeit für ' + levels.length + (levels.length === 1 ? ' Held' : ' Helden') + ' (Stufe ' + [...new Set(levels)].join('/') + ')</small><b>' + r.label + '</b><span>Niedrig ≤ ' + r.b[0] + ' · Moderat ≤ ' + r.b[1] + ' · Hoch ≤ ' + r.b[2] + '</span></div>' : '<div class="encr"><small>Gruppe</small><span>Anzahl und Stufe eingeben (oder am Tisch spielen – dann automatisch)</span></div>') + '</div>' +
    (auto.length ? '' : '<div class="row">' + field('Anzahl Helden', '<input type="number" min="1" max="10" data-enc="np" value="' + esc(E.np) + '">') + field('Stufe', '<input type="number" min="1" max="20" data-enc="lv" value="' + esc(E.lv) + '">') + '</div>') +
    '<div class="chips encopt"><label class="chk"><input type="checkbox" id="encGrp"' + (S.encGrp !== false ? ' checked' : '') + '> gemeinsame Initiative</label><label class="chk"><input type="checkbox" id="encRoll"' + (S.encRoll ? ' checked' : '') + '> TP würfeln</label>' + (S.combat && S.combat.active ? '<label class="chk" title="Nachteil auf den Initiativewurf"><input type="checkbox" id="encSur"' + (S.encSur ? ' checked' : '') + '> überrascht</label><label class="chk" title="Wartet und greift später ein"><input type="checkbox" id="encRes"' + (S.encRes ? ' checked' : '') + '> als Verstärkung</label>' : '') + '</div>' +
    (S.combat && S.combat.active && (!S.meta.dm || isDM()) ? '<details class="encman"><summary>Gegner ohne Werte (nur Name und Initiative)</summary><div class="chips"><input type="text" id="npcName" placeholder="z. B. Hauptmann Vorn" aria-label="Name"><input type="number" id="npcBonus" placeholder="Bonus" aria-label="Initiativebonus" value="0"><button class="btn ghost sm" data-act="npcAdd">Würfeln und hinzufügen</button></div></details>' + ((S.combat.npcs || []).some((x) => x.mid) ? '<button class="link" data-act="encFromFight">Gegner aus dem laufenden Kampf übernehmen</button>' : '') : '') +
    '<div class="chips end">' + (S.combat && S.combat.active && (!S.meta.dm || isDM()) ? '<button class="btn" data-act="encGo"' + (valid.length ? '' : ' disabled') + '>In den Kampf einsetzen</button>' : S.camp && (!S.meta.dm || isDM()) ? '<button class="btn" data-act="encFight"' + (valid.length ? '' : ' disabled') + '>Kampf beginnen</button>' : '') + '<button class="btn ghost" data-act="encSave"' + (valid.length ? '' : ' disabled') + '>Als Vorlage speichern</button></div>' +
    (saved.length ? '<h4>Gespeicherte Begegnungen</h4><div class="enclist">' + saved.map((s, i) => '<div class="encs"><div><b>' + esc(s.name || 'Begegnung') + '</b><small>' + s.mobs.map((mo) => mo.n + '× ' + (BESTIARY[mo.mid] || ['?'])[0]).join(', ') + ' · ' + encXp(s.mobs).toLocaleString('de-CH') + ' EP</small></div><button class="btn sm ghost" data-act="encLoadT" data-arg="' + esc(i) + '">Laden</button>' + (S.combat && S.combat.active && (!S.meta.dm || isDM()) ? '<button class="btn sm" data-act="encUse" data-arg="' + esc(i) + '">Einsetzen</button>' : '') + '<button class="x" data-act="encDelT" data-arg="' + esc(i) + '" aria-label="Löschen">×</button></div>').join('') + '</div>' : '') + '</div>';
  m.hidden = false;
}
function encOpts() { const g = $('#encGrp'), r = $('#encRoll'), su = $('#encSur'), re = $('#encRes'); if (g) S.encGrp = g.checked; if (r) S.encRoll = r.checked; if (su) S.encSur = su.checked; if (re) S.encRes = re.checked; return { groupInit: S.encGrp !== false, rollHp: !!S.encRoll, surprised: !!S.encSur, reserve: !!S.encRes }; }
const updNpc = (id, fn, logx) => { const c = S.combat; if (!c) return; const npcs = (c.npcs || []).map((x) => x.id === id ? fn(Object.assign({}, x)) : x); saveCombat(Object.assign({}, c, { npcs, t: Date.now(), log: logx ? clog(c, logx) : c.log })); };
Object.assign(XA, {
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
  bulkSave: () => { const c = S.combat; const b = +($('#bulkSv') || {}).value || 0; const dc = +($('#bulkDc') || {}).value || 0; const ab = ($('#bulkAb') || {}).value; const ai = ab === '' || ab == null ? -1 : +ab; const sel = (c.npcs || []).filter((x) => (S.npcSel || []).includes(x.id));
    /* Bonus aus den Monsterwerten (sonst von Hand); gelähmt/betäubt/bewusstlos/versteinert: STÄ und GES misslingen; festgesetzt: Nachteil auf GES. Eine 20 oder 1 hat bei Rettungswürfen keine Sonderwirkung. */
    const res = sel.map((x) => { const sv = ai >= 0 && typeof MOB_SAVES !== 'undefined' && MOB_SAVES[x.mid] ? MOB_SAVES[x.mid][ai] : b; const cs = typeof npcConds === 'function' ? npcConds(x) : (x.cond || []);
      if (ai >= 0 && ai <= 1 && cs.some((k) => ['paralyzed', 'stunned', 'unconscious', 'petrified'].includes(k))) return { x, r: 0, tot: '—', ok: dc ? false : null, auto: true };
      let r = 1 + Math.floor(rnd() * 20); let dis = false; if (ai === 1 && cs.includes('restrained')) { r = Math.min(r, 1 + Math.floor(rnd() * 20)); dis = true; }
      const tot = r + sv; return { x, r, tot, ok: dc ? tot >= dc : null, dis }; });
    pushLog({ label: (ai >= 0 ? MSAVE_AB[ai] + '-' : '') + 'Rettungswürfe' + (dc ? ' (SG ' + dc + ')' : ''), total: dc ? res.filter((q) => q.ok).length + '/' + res.length : '✦', detail: res.map((q) => q.x.name + ' ' + (q.auto ? 'misslingt automatisch' : q.tot + (q.dis ? ' (Nachteil)' : '')) + (dc && !q.auto ? (q.ok ? ' ✓' : ' ✗') : '')).join(' · ') });
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
document.addEventListener('change', (ev) => { const t = ev.target; if (t && ['encGrp', 'encRoll', 'encSur', 'encRes'].includes(t.id)) { encOpts(); return; } if (t && t.dataset && t.dataset.enc && S.enc) { const k = t.dataset.enc; if (k === 'mid' || k === 'n') { const mo = S.enc.mobs[+t.dataset.i]; if (mo) mo[k] = k === 'n' ? Math.max(1, +t.value || 1) : t.value; } else S.enc[k] = t.value; const nm = $('#encName'); if (nm) S.enc.name = nm.value; encPlanner(); }
  if (t && t.id === 'bulkCond' && t.value) { const k = t.value; const c = S.combat; const sel = S.npcSel || []; saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).map((x) => sel.includes(x.id) ? Object.assign({}, x, { cond: [...new Set((x.cond || []).concat([k]))] }) : x), t: Date.now(), log: clog(c, sel.length + ' Gegner: ' + COND[k].name) })); } });

/* ---------- Gegnerangriff: Angriff würfeln → Treffer prüfen (Ziel-RK) → erst dann Schaden ---------- */
function npcTargets() {
  const out = []; for (const [uid, p] of players()) if (p && p.char && !p.dead) out.push({ k: 'p:' + uid, name: p.char, ac: +p.ac || 0 });
  const ch = cur(); if (ch && !dmOut(UID) && !out.some((t) => t.k === 'p:' + UID)) { try { out.unshift({ k: 'me', name: ch.name, ac: derive(ch, S.hb).ac }); } catch (e) {} }
  return out;
}
function critExpr(expr) { return String(expr).replace(/(\d*)W(\d+)/g, (m, n, s) => (2 * (+n || 1)) + 'W' + s); }
function npcPrompt() {
  const o = S.npcA; if (!o) return orbPrompt('');
  const tg = npcTargets(); const t = tg.find((x) => x.k === o.tgt) || null;
  const cv = +o.cover || 0; const ac = t && t.ac ? t.ac + cv : 0; const acTxt = 'RK ' + ac + (cv ? ' mit Deckung' : '');
  const verdict = o.nat === 1 ? 'Eine natürliche 1 verfehlt immer.' : o.nat === 20 ? 'Natürliche 20: trifft immer – kritischer Treffer, alle Schadenswürfel doppelt.' : ac ? (o.total >= ac ? '<b class="okc">Trifft ' + esc(t.name) + '</b> (' + o.total + ' gegen ' + acTxt + ').' : '<b class="badc">Verfehlt ' + esc(t.name) + '</b> (' + o.total + ' gegen ' + acTxt + ').') : 'Trifft das die RK des Ziels? ' + slTag();
  const hitDefault = o.nat === 20 || (o.nat !== 1 && ac && o.total >= ac);
  const ts = typeof tgtState === 'function' && o.tgt ? tgtState(o.tgt) : null; const crit = o.nat === 20 || !!o.forceCrit;
  const opts = (typeof npcTgtNote === 'function' ? npcTgtNote(o, true) : '') + (ts && ts.crit5 ? chip(!!o.forceCrit, 'Aus 1,5 m: kritisch', 'data-act="npcCrit5"') : '') + (o.rider ? chip(!!o.riderOn, 'Zusatz: ' + esc(riderShort(o.rider)), 'data-act="npcRider" title="' + esc(o.rider.txt) + '"') : '') +
    (t && t.ac && o.nat !== 1 && o.nat !== 20 ? chip(cv > 0, cv === 2 ? 'Deckung ½ (+2)' : cv === 5 ? 'Deckung ¾ (+5)' : 'Deckung', 'data-act="npcCover" data-arg="' + (cv === 0 ? 2 : cv === 2 ? 5 : 0) + '" title="Antippen: keine → halb (+2) → dreiviertel (+5)"') : '');
  const extra = (typeof npcTgtNote === 'function' ? npcTgtNote(o) : '') + (opts ? '<div class="chips pxo">' + opts + '</div>' : '');
  orbPrompt('<div class="pr' + (crit ? ' crit' : '') + '"><b>' + esc(o.name) + ': Angriff ' + o.total + (o.re ? ' <small>(' + (o.re === 'adv' ? 'Vorteil' : 'Nachteil') + ')</small>' : '') + '</b><p>' + verdict + '</p>' +
    (tg.length ? '<div class="chips"><span class="hint">Ziel:</span>' + tg.map((x) => chip(o.tgt === x.k, esc(x.name) + (x.ac ? ' · RK ' + x.ac : ''), 'data-act="npcTgt" data-arg="' + esc(x.k) + '"')).join('') + '</div>' : '') + extra +
    '<div class="chips end"><button class="btn ghost' + (!hitDefault && t ? ' rec' : '') + '" data-act="npcMiss">Verfehlt</button><button class="btn' + (hitDefault ? ' rec' : '') + '" data-act="npcHit"' + (o.nat === 1 ? ' disabled' : '') + '>' + (crit ? 'Kritischen Schaden würfeln' : 'Treffer – Schaden würfeln') + '</button></div></div>');
}
XA.npcAtk = (t, a) => {
  const x = ((S.combat && S.combat.npcs) || []).find((y) => y.id === a); const M = x && BESTIARY[x.mid]; if (!M) return; const at = M[7][+t.dataset.j];
  const before = S.log.length; const tot = rawD20(at[1], x.name + ': ' + at[0], true); const e = S.log[0];
  if (typeof npcAtkCount === 'function') npcAtkCount(x.id);
  const tg = npcTargets(); const rd = typeof mobRider === 'function' ? mobRider(x.mid, at[0]) : null; S.npcA = { name: x.name + ': ' + at[0], dmg: at[2], dtype: at[3], total: tot, nat: e && e.nat, bonus: at[1], pair: !!(e && e.pair), rider: rd, riderOn: !!rd && !rd.charge, tgt: (S.npcA && tg.some((q) => q.k === S.npcA.tgt)) ? S.npcA.tgt : (tg.length === 1 ? tg[0].k : '') };
  setTimeout(npcPrompt, typeof d3fx === 'function' && d3fx() === 'voll' ? 950 : 150); return tot;
};
XA.npcCover = (t, a) => { if (!S.npcA) return; S.npcA.cover = +a; npcPrompt(); };
XA.npcTgt = (t, a) => { if (!S.npcA) return; S.npcA.tgt = S.npcA.tgt === a ? '' : a; npcPrompt(); };
XA.npcMiss = () => { const o = S.npcA; if (!o) return; pushLog({ label: o.name, total: 'verfehlt', detail: 'kein Schaden', share: true }); S.npcA = { tgt: o.tgt }; orbPrompt(''); hitFlush(); };
/* MA68-12: Treffer einzeln nacheinander (eigene Schadensart, Kritisch, Zusatzeffekt), nie zu einem Sammeltreffer verschmolzen */
function hitFlush() { const q = S.hitQ || []; if (!q.length) return; const h = q.shift(); S.hitQ = q; setTimeout(() => hitPrompt(h), 150); }
XA.npcHit = () => { const o = S.npcA; if (!o) return; const crit = o.nat === 20 || !!o.forceCrit; orbPrompt(''); rollDmg(crit ? critExpr(o.dmg) : o.dmg, o.name + (crit ? ' · kritisch' : '') + ' (' + o.dtype + ')'); S.npcA = { tgt: o.tgt };
  const amt = +S.log[0].total || 0; if (!o.tgt || !amt) return; const h = { by: o.name, amount: amt, dtype: o.dtype, crit, atk: o.total, nat: o.nat, rider: o.riderOn ? o.rider : null, t: Date.now() };
  const uid = o.tgt === 'me' ? UID : o.tgt.slice(2);
  if (uid === UID) { h.cid = S.cur; setTimeout(() => hitPrompt(h), typeof d3fx === 'function' && d3fx() === 'voll' ? 1100 : 200); hitFlush(); return; }
  const c = S.combat; if (!c) return; saveCombat(Object.assign({}, c, { hits: ((c.hits || []).concat([Object.assign({ to: uid }, h)])).slice(-20), t: Date.now(), log: clog(c, o.name + ' trifft ' + ((S.table[uid] || {}).char || 'einen Helden') + ': ' + amt + ' ' + o.dtype) }));
  bannerToast('Schaden zugestellt', ((S.table[uid] || {}).char || 'Der Held') + ' bekommt ' + amt + ' Schaden zum Eintragen angezeigt.'); hitFlush(); };
/* Treffer an meinen Helden: anzeigen und auf Wunsch eintragen (Resistenz usw. wählt der Spieler) */
/* MA68-01: Treffer gehört dem Helden, der beim Eintreffen am Tisch war – nicht dem gerade geöffneten */
function hitPrompt(h) { if (!h.cid) h.cid = S.cur; const ch = S.chars[h.cid]; if (!ch) return; if ((S.npcA && S.npcA.name) || (promptOpen() && S.hitPend !== h)) { S.hitQ = (S.hitQ || []).concat([h]); return; } S.hitPend = h;
  const hx = typeof hitExtras === 'function' ? hitExtras(h, ch) : { html: '', half: '' };
  orbPrompt('<div class="pr' + (h.crit ? ' crit' : '') + '"><b>' + esc(h.by) + ' trifft ' + esc(ch.name) + ': ' + esc(h.amount) + ' Schaden</b><p>' + esc(h.dtype || '') + (h.crit ? ' · kritischer Treffer' : '') + (h.atk != null ? ' · Angriff ' + esc(h.atk) : '') + '. Eintragen?' + (hx.half ? ' <b class="okc">' + esc(hx.half) + '.</b>' : '') + '</p>' + hx.html + '<div class="chips end"><button class="btn ghost" data-act="hitApply" data-arg="0">Nicht eintragen</button><button class="btn' + (hx.half ? ' rec' : ' ghost') + '" data-act="hitApply" data-arg="0.5">Halb (' + esc(Math.floor(h.amount / 2)) + ')</button><button class="btn' + (hx.half ? ' ghost' : '') + '" data-act="hitApply" data-arg="1">Voll (' + esc(h.amount) + ')</button></div></div>'); }
XA.hitApply = (t, a) => { const h = S.hitPend; S.hitPend = null; orbPrompt(''); const ch = h && S.chars[h.cid]; if (!h || !ch) return;
  const unc = t && t.dataset && t.dataset.uncanny; if (unc && typeof tSpend === 'function' && !tSpend(ch, 'r', 'Unglaubliches Ausweichen')) { S.hitPend = h; return hitPrompt(h); }
  const n = Math.floor(h.amount * +a); if (n > 0) { if (typeof vfxHint === 'function') vfxHint({ dtype: h.dtype }); hpChange(ch, 'dmg', n, h.crit); pushLog({ label: 'Schaden erhalten', total: n, detail: h.by + ' · ' + (h.dtype || '') + (unc ? ' (Unglaubliches Ausweichen)' : +a < 1 ? ' (halbiert)' : ''), share: true }); if (unc) commit(); }
  const dl = typeof d3fx === 'function' && d3fx() === 'voll' ? 600 : 150;
  if (h.after && typeof condAsk === 'function') setTimeout(() => condAsk(ch, h.after.conds, h.after.fx, h.after.by), dl);
  else if (h.rider && +a !== 0 && !(ch.play.hp <= 0) && typeof riderPrompt === 'function') setTimeout(() => riderPrompt(h), dl); };
function hitCheck() { const c = S.combat; if (!c || !c.hits) return; let seen = 0; try { seen = +sessionStorage.getItem('hb_hit_' + c.id) || 0; } catch (e) {}
  const mine = c.hits.filter((h) => h.to === UID && h.t > seen); if (!mine.length) return; const h = mine[mine.length - 1]; try { sessionStorage.setItem('hb_hit_' + c.id, String(h.t)); } catch (e) {}
  mine.forEach((x) => { x.cid = S.cur; }); hitPrompt(mine[0]); if (mine.length > 1) S.hitQ = (S.hitQ || []).concat(mine.slice(1)); }

/* Verstärkung: bereitgehaltene Gegner treten bei – neue Initiative, werden einsortiert */
XA.npcJoin = (t, a) => { const c = S.combat; if (!c) return; const grp = t.dataset.grp; const ids = (c.npcs || []).filter((x) => x.reserve && (grp ? x.grp === grp : x.id === a)).map((x) => x.id); if (!ids.length) return;
  const shared = 1 + Math.floor(rnd() * 20); const names = [];
  const npcs = (c.npcs || []).map((x) => { if (!ids.includes(x.id)) return x; const r = grp ? shared : 1 + Math.floor(rnd() * 20); names.push(x.name + ' (' + (r + (+x.dex || 0)) + ')'); return Object.assign({}, x, { reserve: undefined, v: r + (+x.dex || 0) }); });
  saveCombat(Object.assign({}, c, { npcs, t: Date.now(), log: clog(c, 'Verstärkung: ' + names.join(', ') + ' greift ein') })); pushLog({ label: 'Verstärkung greift ein', total: names.length + '×', detail: names.join(', ') + ' · Initiative gewürfelt', share: true }); };

/* ---------- Rettungswurf anfordern (SL → Spieler): z. B. Odem oder Feuerball, Schaden wird gleich mitgewürfelt ---------- */
const AB_LIST = [['dex', 'GES'], ['con', 'KON'], ['wis', 'WEI'], ['str', 'STÄ'], ['int', 'INT'], ['cha', 'CHA']];
function saveReqForm() {
  const ps = players(); if (!ps.length) return '';
  const c = S.combat || {}; const reqs = (c.reqs || []).slice(-3).reverse(); const F = S.srForm || {}; const fv = (k, d) => esc(F[k] != null ? F[k] : d);
  return '<details class="fgrp sreq"' + (S.sreqOpen ? ' open' : '') + '><summary><b>Rettungswurf anfordern</b> <small>z. B. Odem, Feuerball, Gift</small></summary>' +
    '<div class="row">' + field('Quelle', '<input type="text" id="srBy" value="' + fv('by', '') + '" placeholder="z. B. Drachenodem">') + field('Attribut', '<select id="srAb">' + AB_LIST.map(([k, l]) => '<option value="' + k + '"' + (F.ab === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>') + field('SG', '<input type="number" id="srDc" value="' + fv('dc', '13') + '" min="1" max="30">') + '</div>' +
    '<div class="row">' + field('Schaden (optional)', '<input type="text" id="srDmg" value="' + fv('dmg', '') + '" placeholder="z. B. 8W6">') + field('Schadensart', '<input type="text" id="srTy" value="' + fv('ty', '') + '" placeholder="z. B. Feuer">') + '</div>' +
    '<label class="chk"><input type="checkbox" id="srHalf"' + (F.half === false ? '' : ' checked') + '> halber Schaden bei Erfolg</label>' +
    '<div class="chips"><span class="hint">Wer?</span>' + ps.map(([u, p]) => chip((S.srTo || []).includes(u), esc(p.char || '?'), 'data-act="srTo" data-arg="' + esc(u) + '"')).join('') + chip(false, 'alle', 'data-act="srTo" data-arg="*"') + '</div>' +
    '<div class="chips end"><button class="btn sm" data-act="srSend">Anfordern</button></div>' +
    (reqs.length ? '<div class="srres">' + reqs.map((r) => { const res = (c.saveRes || []).filter((x) => x.id === r.id); return '<p><b>' + esc(r.by) + '</b> · ' + esc((AB_LIST.find((a) => a[0] === r.ab) || ['', r.ab])[1]) + ' SG ' + esc(r.dc) + (r.amount ? ' · ' + esc(r.amount) + ' Schaden' : '') + ': ' + (Array.isArray(r.to) ? r.to : []).map((u) => { const x = res.find((y) => y.uid === u); const nm = esc((S.table[u] || {}).char || '?'); return x ? nm + ' ' + esc(x.total) + (x.ok ? ' ✓' : ' ✗') : nm + ' …'; }).join(', ') + '</p>'; }).join('') + '</div>' : '') + '</details>';
}
const srGrab = () => { const g = (id) => ($('#' + id) || {}).value; S.srForm = { by: g('srBy'), ab: g('srAb'), dc: g('srDc'), dmg: g('srDmg'), ty: g('srTy'), half: ($('#srHalf') || {}).checked }; };
XA.srTo = (t, a) => { srGrab(); S.sreqOpen = true; const all = players().map(([u]) => u); let to = (S.srTo || []).slice(); if (a === '*') to = to.length === all.length ? [] : all; else { const i = to.indexOf(a); if (i >= 0) to.splice(i, 1); else to.push(a); } S.srTo = to; paintCamp(); };
XA.srSend = () => { const c = S.combat; if (!c) return; const to = S.srTo || []; if (!to.length) { bannerToast('Wer soll würfeln?', 'Wähle mindestens einen Helden.'); return; }
  const by = ($('#srBy').value || 'Rettungswurf').trim(); const ab = $('#srAb').value; const dc = Math.max(1, +$('#srDc').value || 10); const dmg = ($('#srDmg').value || '').trim(); const dtype = ($('#srTy').value || '').trim(); const half = $('#srHalf').checked;
  let amount = 0; if (dmg && /W|\d/.test(dmg)) { rollDmg(dmg.replace(/−/g, '-'), by + ' (Schaden' + (dtype ? ', ' + dtype : '') + ')'); amount = +S.log[0].total || 0; }
  const fx = S.srFx || null; S.srFx = null; const req = { id: uidX(), by, ab, dc, amount, dtype, half, to: to.slice(), t: Date.now() }; if (fx) { req.fx = fx.txt; req.conds = fx.conds; }
  saveCombat(Object.assign({}, c, { reqs: ((c.reqs || []).concat([req])).slice(-10), t: Date.now(), log: clog(c, by + ': ' + (AB_LIST.find((x) => x[0] === ab) || ['', ab])[1] + '-Rettungswurf SG ' + dc + ' für ' + to.map((u) => (S.table[u] || {}).char || '?').join(', ')) }));
  S.srTo = []; S.srForm = null; S.sreqOpen = true; setTimeout(reqCheck, 50); };
function reqCheck() { const c = S.combat; if (!c || !c.reqs || !cur()) return; const me = String(UID); const r = c.reqs.find((x) => x && Array.isArray(x.to) && x.to.includes(me) && !(c.saveRes || []).some((y) => y.id === x.id && y.uid === me) && !reqSeen(x.id)); if (!r || S.reqPend || promptOpen()) return; S.reqPend = r.id;
  const ch = cur(); const cc = derive(ch, S.hb); const sv = cc.saves[r.ab]; const ab = (AB_LIST.find((x) => x[0] === r.ab) || ['', r.ab])[1];
  orbPrompt('<div class="pr"><b>' + esc(r.by) + ': ' + esc(ab) + '-Rettungswurf SG ' + esc(r.dc) + '</b><p>Die Spielleitung verlangt einen Rettungswurf von ' + esc(ch.name) + ' (' + sgn(sv.val) + ').' + (r.amount ? ' Schaden: ' + esc(r.amount) + (r.dtype ? ' ' + esc(r.dtype) : '') + (r.half ? ', bei Erfolg die Hälfte.' : ', bei Erfolg keiner.') : '') + '</p><div class="chips end"><button class="btn" data-act="reqRoll" data-arg="' + esc(r.id) + '">Rettungswurf würfeln</button></div></div>'); }
const reqSeen = (id) => { try { return sessionStorage.getItem('hb_req_' + id) === '1'; } catch (e) { return false; } };
XA.reqRoll = (t, a) => { const c = S.combat; const r = c && (c.reqs || []).find((x) => x.id === a); S.reqPend = null; orbPrompt(''); if (!r) return; try { sessionStorage.setItem('hb_req_' + a, '1'); } catch (e) {}
  const ch = cur(); const cc = derive(ch, S.hb); const total = d20(cc.saves[r.ab].val, r.by + ': ' + (AB_LIST.find((x) => x[0] === r.ab) || ['', r.ab])[1] + '-Rettungswurf (SG ' + r.dc + ')', { kind: 'save:' + r.ab }); if (typeof total !== 'number') return;
  const ok = total >= r.dc; const c2 = S.combat;
  saveCombat(Object.assign({}, c2, { saveRes: ((c2.saveRes || []).concat([{ id: r.id, uid: String(UID), total, ok, t: Date.now() }])).slice(-30), t: Date.now(), log: clog(c2, ch.name + ': ' + total + (ok ? ' – geschafft' : ' – misslungen') + ' (' + r.by + ')') }));
  const ev = r.ab === 'dex' && r.half && typeof hasEvasion === 'function' && hasEvasion(cc) && !(ch.play.cond || []).some((k) => ['incapacitated', 'paralyzed', 'stunned', 'unconscious', 'petrified'].includes(k));
  const after = !ok && (r.fx || (r.conds && r.conds.length)) && typeof condAsk === 'function' ? { conds: r.conds || [], fx: r.fx || '', by: r.by } : null; const dl = typeof d3fx === 'function' && d3fx() === 'voll' ? 1200 : 300;
  if (after && !r.amount) setTimeout(() => condAsk(ch, after.conds, after.fx, after.by), dl);
  if (r.amount) { const amt = ev ? (ok ? 0 : Math.floor(r.amount / 2)) : ok ? (r.half ? Math.floor(r.amount / 2) : 0) : r.amount; if (ev) setTimeout(() => bannerToast('Entrinnen', ok ? 'Geschafft – gar kein Schaden.' : 'Misslungen – nur die Hälfte.'), 400); if (amt > 0) setTimeout(() => hitPrompt({ by: r.by + (ev ? ' (Entrinnen – halber Schaden)' : ok ? ' (geschafft – halber Schaden)' : ''), amount: amt, dtype: r.dtype, crit: false, after, t: Date.now() }), dl); else if (after) setTimeout(() => condAsk(ch, after.conds, after.fx, after.by), dl); else bannerToast('Geschafft!', 'Kein Schaden durch ' + r.by + '.'); }
  setTimeout(reqCheck, 1500); };
const _hitCheck0 = hitCheck; hitCheck = function () { _hitCheck0(); reqCheck(); };

/* ---------- FC-11/12: Fertigkeitsproben anfordern und verdeckte SL-Würfe ----------
   Anfrage liegt im Rundenstand (S.meta.chk, nur die letzten 5, 15 Minuten gültig). Ein verborgener SG bleibt nur auf dem
   Gerät der SL (localStorage), nie in der Nachricht. Antwort steht im eigenen Spielerdokument (chk), wie bei Rettungswürfen.
   Verdeckter SL-Wurf: nur lokal, kein Log, keine Nachricht; Modifikator aus passivem Wert oder Eingabe, nie stillschweigend 0. */
const CHK_TTL = 15 * 60 * 1000;
const chkDcMap = () => { try { const m = JSON.parse(localStorage.getItem('hb_chkdc') || '{}'); return nvPlain(m) ? m : {}; } catch (e) { return {}; } };
const chkMine = () => { if (!S.camp) return []; if (!S.myChk) { try { S.myChk = JSON.parse(localStorage.getItem('hb_chk_' + S.camp) || '[]'); } catch (e) {} if (!Array.isArray(S.myChk)) S.myChk = []; } return S.myChk.slice(-5); };
const chkLive = () => (Array.isArray(S.meta && S.meta.chk) ? S.meta.chk : []).filter((r) => r && Date.now() - r.t < CHK_TTL);
function chkSection() {
  if (!isDM() || !S.camp) return ''; const ps = players(); const F = S.chkF || {}; const reqs = chkLive().slice(-3).reverse(); const dcs = chkDcMap();
  const skillSel = (id) => '<select id="' + id + '">' + ALL_SKILLS.map((s) => '<option value="' + s + '"' + (F.sk === s ? ' selected' : '') + '>' + esc(SKILLS[s][0]) + '</option>').join('') + '</select>';
  let h = '<section class="blk dmtools chkreq"><h2>Proben</h2><details class="fgrp"' + (S.chkOpen ? ' open' : '') + '><summary><b>Probe anfordern</b> <small>z. B. Wahrnehmung für alle</small></summary>' +
    '<div class="row">' + field('Fertigkeit', skillSel('chkSk')) + field('SG (optional)', '<input type="number" id="chkDc" min="1" max="40" placeholder="—"' + (F.dc ? ' value="' + esc(F.dc) + '"' : '') + '>') + '</div>' +
    '<label class="chk"><input type="checkbox" id="chkHide"' + (F.hide ? ' checked' : '') + '> SG nur bei mir</label>' +
    '<div class="chips"><span class="hint">Wer?</span>' + ps.map(([u, p]) => chip((S.chkTo || []).includes(u), esc(p.char || '?'), 'data-act="chkTo" data-arg="' + esc(u) + '"')).join('') + chip(false, 'alle', 'data-act="chkTo" data-arg="*"') + '</div>' +
    '<div class="chips end"><button class="btn sm" data-act="chkSend">Anfordern</button></div>';
  if (reqs.length) h += '<div class="srres">' + reqs.map((r) => { const dc = r.dc || dcs[r.id]; return '<p><b>' + esc((SKILLS[r.sk] || [r.sk])[0]) + '</b>' + (dc ? ' SG ' + esc(dc) + (r.dc ? '' : ' (verborgen)') : '') + ': ' + (Array.isArray(r.to) ? r.to : []).map((u) => { const a = ((S.table[u] || {}).chk || []).find((x) => x && x.id === r.id); const nm = esc((S.table[u] || {}).char || '?'); return a ? nm + ' ' + esc(a.total) + (dc ? (a.total >= dc ? ' ✓' : ' ✗') : '') : nm + ' …'; }).join(', ') + ' <button class="link" data-act="chkClose" data-arg="' + esc(r.id) + '">schliessen</button></p>'; }).join('') + '</div>';
  h += '</details><details class="fgrp"><summary><b>Verdeckt würfeln</b> <small>nur auf deinem Gerät</small></summary><div class="row">' + field('Held', '<select id="chsWho">' + ps.map(([u, p]) => '<option value="' + esc(u) + '">' + esc(p.char || '?') + '</option>').join('') + '</select>') + field('Fertigkeit', skillSel('chsSk')) + field('Modifikator', '<input type="number" id="chsMod" min="-10" max="30" placeholder="z. B. +5">') + '</div>' +
    '<p class="hint">Wahrnehmung, Motiv erkennen und Nachforschungen kennt die App aus den passiven Werten. Andere Modifikatoren bitte eingeben (oder beim Spieler erfragen).</p><div class="chips end"><button class="btn sm" data-act="chsRoll">Verdeckt würfeln</button></div>' + (S.chsOut ? '<p class="okc"><b>' + esc(S.chsOut) + '</b></p>' : '') + '</details></section>';
  return h;
}
const chkGrab = () => { S.chkF = { sk: ($('#chkSk') || {}).value, dc: ($('#chkDc') || {}).value, hide: ($('#chkHide') || {}).checked }; S.chkOpen = true; };
XA.chkTo = (t, a) => { chkGrab(); const all = players().map(([u]) => u); let to = (S.chkTo || []).slice(); if (a === '*') to = to.length === all.length ? [] : all; else { const i = to.indexOf(a); if (i >= 0) to.splice(i, 1); else to.push(a); } S.chkTo = to; paintCamp(); };
XA.chkSend = () => { chkGrab(); const to = (S.chkTo || []).filter((u) => S.table[u]); if (!to.length) { bannerToast('Wer soll würfeln?', 'Wähle mindestens einen Helden.'); return; }
  const sk = S.chkF.sk; if (!nvOwn(SKILLS, sk)) return; const dc = Math.max(0, Math.min(40, +S.chkF.dc || 0)); const r = { id: uidX(), sk, to, t: Date.now() };
  if (dc && !S.chkF.hide) r.dc = dc; if (dc && S.chkF.hide) { const m = chkDcMap(); m[r.id] = dc; const keep = Object.keys(m).slice(-20); try { localStorage.setItem('hb_chkdc', JSON.stringify(Object.fromEntries(keep.map((k) => [k, m[k]])))); } catch (e) {} }
  saveMeta({ chk: chkLive().concat([r]).slice(-5) }); S.chkTo = []; S.chkF = { sk }; S.chkOpen = true; paintCamp(); };
XA.chkClose = (t, a) => { saveMeta({ chk: chkLive().filter((r) => r.id !== a) }); };
XA.chsRoll = () => { const u = ($('#chsWho') || {}).value, sk = ($('#chsSk') || {}).value; const p = S.table[u]; if (!p || !nvOwn(SKILLS, sk)) return;
  let mod = ($('#chsMod') || {}).value; const pasI = { prc: 0, ins: 1, inv: 2 }[sk];
  if (mod === '' && pasI !== undefined && Array.isArray(p.pas)) mod = p.pas[pasI] - 10;
  if (mod === '' || !Number.isFinite(+mod)) { S.chsOut = 'Modifikator fehlt – bitte eingeben (kein Wurf mit unbekanntem Wert).'; paintCamp(); return; }
  const r = 1 + Math.floor(rnd() * 20); S.chsOut = (p.char || '?') + ' · ' + SKILLS[sk][0] + ': ' + (r + +mod) + ' (W20 ' + r + ' ' + sgn(+mod) + ')'; paintCamp(); };
function chkCheck() { const ch = cur(); if (!ch || !S.camp || isDM() || promptOpen() || S.chkPend) return; const me = String(UID); const done = chkMine().map((x) => x.id);
  const r = chkLive().find((x) => Array.isArray(x.to) && x.to.includes(me) && !done.includes(x.id)); if (!r || !nvOwn(SKILLS, r.sk)) return; S.chkPend = r.id;
  const c = derive(ch, S.hb); const sv = c.skills[r.sk];
  orbPrompt('<div class="pr"><b>Probe: ' + esc(SKILLS[r.sk][0]) + (r.dc ? ' (SG ' + esc(r.dc) + ')' : '') + '</b><p>Die Spielleitung verlangt eine Probe von ' + esc(ch.name) + ' (' + sgn(sv.val) + ').</p><div class="chips end"><button class="btn ghost" data-act="chkSkip" data-arg="' + esc(r.id) + '">Nicht jetzt</button><button class="btn" data-act="chkRoll" data-arg="' + esc(r.id) + '">Würfeln</button></div></div>'); }
const chkStore = (a) => { S.myChk = chkMine().concat([a]).slice(-5); try { localStorage.setItem('hb_chk_' + S.camp, JSON.stringify(S.myChk)); } catch (e) {} };
XA.chkRoll = (t, a) => { S.chkPend = null; orbPrompt(''); const r = chkLive().find((x) => x.id === a); const ch = cur(); if (!r || !ch || chkMine().some((x) => x.id === a)) return;
  const c = derive(ch, S.hb); const sv = c.skills[r.sk]; const total = d20(sv.val, 'Probe ' + SKILLS[r.sk][0] + ' (SL)', { kind: 'check:' + SKILLS[r.sk][1] + ':' + r.sk + ':' + sv.prof });
  if (typeof total !== 'number') return; chkStore({ id: a, total, t: Date.now() }); queueMe(); setTimeout(chkCheck, 400); };
XA.chkSkip = (t, a) => { S.chkPend = null; orbPrompt(''); chkStore({ id: a, total: '–', t: Date.now() }); queueMe(); };
if (typeof dmTools === 'function') { const _dmChk0 = dmTools; dmTools = function () { const h = _dmChk0.apply(this, arguments); return h + chkSection(); }; }
if (typeof applyMeta === 'function') { const _amChk0 = applyMeta; applyMeta = function () { _amChk0.apply(this, arguments); setTimeout(chkCheck, 200); }; }
