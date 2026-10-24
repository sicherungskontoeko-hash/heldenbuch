/* ---------- Gegner-Fähigkeiten im Kampf: Aufladung (W6), legendäre Aktionen und Widerstände ----------
   Liest die Merkmale aus dem Bestiarium (Text „Feueratem (Aufladung 5–6): … GES SG 12, 6W6 Feuer“).
   Zustand pro Gegner: x.rech = { Name: { used, roll } }, x.laU = verbrauchte legendäre Aktionen, x.lrU = verbrauchte Widerstände.
   Nur die Spielleitung sieht die Knöpfe. Zu Beginn des Gegnerzugs: Aufladung würfeln, legendäre Aktionen zurücksetzen. */
const AB_SHORT = { 'STÄ': 'str', 'GES': 'dex', 'KON': 'con', 'INT': 'int', 'WEI': 'wis', 'CHA': 'cha' };
const _mfCache = {};
function mobFeats(mid) {
  if (_mfCache[mid] !== undefined) return _mfCache[mid];
  const M = BESTIARY[mid]; if (!M) return (_mfCache[mid] = null);
  const own = M[9] || {}; const t = String(M[8] || '');
  const rech = (own.rech || []).slice();
  if (!own.rech) t.split(/\.\s+(?=[A-ZÄÖÜ✦])/).forEach((sen) => {
    const m = sen.match(/^(.*?)\s*\(Aufladung(?:\s*(\d)(?:\s*[–-]\s*6)?)?([^)]*)\)\s*:?\s*(.*)$/); if (!m) return;
    const name = m[1].replace(/^.*:\s*/, '').trim(); if (!name) return;
    const all = sen; const sg = all.match(/(STÄ|GES|KON|INT|WEI|CHA)\s+SG\s+(\d+)/); const sgOnly = all.match(/SG\s+(\d+)/);
    const dm = (m[4] || '').match(/(\d+W\d+(?:\s*[+−-]\s*\d+)?)\s+([A-Za-zÄÖÜäöü]+)/);
    rech.push({ name, min: +(m[2] || 5), ab: sg ? AB_SHORT[sg[1]] : '', dc: sg ? +sg[2] : sgOnly ? +sgOnly[1] : 0, dmg: dm ? dm[1].replace(/\s/g, '') : '', ty: dm ? dm[2] : '', half: /halb bei Erfolg/.test(all) || (/(Kegel|Linie|Kugel|Würfel|Radius)/.test(all) && !/\boder\b/.test(all)), txt: sen.replace(/\.$/, '') });
  });
  const la = own.la != null ? +own.la : /Legendäre Aktionen|Legendär\./.test(t) ? 3 : 0;
  const lr = own.lr != null ? +own.lr : /Legendär\.|Legendäre[^.]*Widerst|Legendärer Widerstand/.test(t) ? 3 : 0;
  return (_mfCache[mid] = rech.length || la || lr ? { rech, la, lr } : null);
}
const mfNpc = (id) => ((S.combat && S.combat.npcs) || []).find((y) => y.id === id);
const mfPips = (id, k, max, used) => { let h = ''; for (let i = 0; i < max; i++) h += '<button class="pip sm' + (i < max - used ? '' : ' used') + '" data-act="mfPip" data-arg="' + id + '" data-k="' + k + '" data-i="' + i + '" aria-label="' + (k === 'laU' ? 'Legendäre Aktion' : 'Legendärer Widerstand') + ' ' + (i + 1) + '"></button>'; return h; };
function mobFxBits(x) {
  const n = mfNpc(x.id); const F = n && n.mid && mobFeats(n.mid); if (!F || n.hp <= 0) return '';
  const r = n.rech || {};
  let h = F.rech.map((a, j) => { const s = r[a.name] || {}; return s.used
    ? '<button class="nfxb used" data-act="mfRoll" data-arg="' + n.id + '" data-j="' + j + '" title="Verbraucht – W6 würfeln: bei ' + a.min + (a.min < 6 ? '–6' : '') + ' wieder bereit (passiert auch automatisch zu Beginn seines Zugs)">⟳ ' + esc(a.name) + ' <small>' + a.min + (a.min < 6 ? '–6' : '') + (s.roll ? ' · W6 ' + s.roll : '') + '</small></button>'
    : '<button class="nfxb ok" data-act="mfUse" data-arg="' + n.id + '" data-j="' + j + '" title="' + esc(a.txt) + ' – antippen zum Einsetzen">⚡ ' + esc(a.name) + '</button>'; }).join('');
  if (F.la) h += '<span class="nfxp" title="Legendäre Aktionen – zu Beginn seines Zugs wieder voll">LA ' + mfPips(n.id, 'laU', F.la, Math.min(F.la, n.laU || 0)) + '</span>';
  if (F.lr) h += '<span class="nfxp lr" title="Legendärer Widerstand (pro Tag): misslungenen Rettungswurf in Erfolg verwandeln">LW ' + mfPips(n.id, 'lrU', F.lr, Math.min(F.lr, n.lrU || 0)) + '</span>';
  return h ? '<span class="nfx">' + h + '</span>' : '';
}
const _npcBits0 = npcBits;
npcBits = function (x) { const h = _npcBits0(x); if (!(isDM() || !S.meta.dm) || !S.combat || !S.combat.active) return h; return h + mobFxBits(x); };

/* Zu Beginn des Zugs eines Gegners (aus nextTurn aufgerufen): gibt die geänderten Gegner und Log-Zeilen zurück. Würfe bleiben geheim (nur beim Gegner gespeichert). */
function mobTurnStart(c, key) {
  if (!key || key.indexOf('n:') !== 0) return null; const id = key.slice(2); let hit = false;
  const npcs = (c.npcs || []).map((x) => { if (x.id !== id) return x; const F = x.mid && mobFeats(x.mid); if (!F) return x; const y = Object.assign({}, x); hit = true;
    if (F.la) y.laU = 0;
    if (F.rech.length) { const r = Object.assign({}, y.rech || {}); F.rech.forEach((a) => { const s = r[a.name]; if (s && s.used) { const d = 1 + Math.floor(rnd() * 6); r[a.name] = d >= a.min ? { used: false, roll: d, back: Date.now() } : { used: true, roll: d }; } }); y.rech = r; }
    return y; });
  return hit ? npcs : null;
}
Object.assign(XA, {
  mfUse: (t, a) => { const n = mfNpc(a); const F = n && mobFeats(n.mid); const ab = F && F.rech[+t.dataset.j]; if (!ab) return;
    updNpc(a, (x) => { x.rech = Object.assign({}, x.rech || {}, { [ab.name]: { used: true } }); return x; }, n.name + ' setzt ' + ab.name + ' ein');
    if (ab.dc) { S.srForm = { by: n.name + ': ' + ab.name, ab: ab.ab || 'dex', dc: ab.dc, dmg: ab.dmg, ty: ab.ty, half: ab.half }; S.srTo = []; S.sreqOpen = true; const fxT = (ab.txt.split(/\boder\b/)[1] || '').trim(); const cs = typeof condsIn === 'function' ? condsIn(ab.txt) : []; S.srFx = fxT || cs.length ? { txt: fxT, conds: cs } : null;
      setTimeout(() => { if (typeof paintCamp === 'function') paintCamp(); const f = $('.sreq'); if (f) { f.open = true; f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.classList.add('flash'); setTimeout(() => f.classList.remove('flash'), 1400); } }, 60);
      bannerToast(ab.name, 'Rettungswurf vorbereitet: ' + (AB_LIST.find((x) => x[0] === ab.ab) || ['', '?'])[1] + ' SG ' + ab.dc + (ab.dmg ? ', ' + ab.dmg + ' ' + ab.ty : '') + ' – wähle die Ziele und tippe „Anfordern“.'); }
    else bannerToast(ab.name, ab.txt); },
  mfRoll: (t, a) => { const n = mfNpc(a); const F = n && mobFeats(n.mid); const ab = F && F.rech[+t.dataset.j]; if (!ab) return; const d = 1 + Math.floor(rnd() * 6); const ok = d >= ab.min;
    updNpc(a, (x) => { x.rech = Object.assign({}, x.rech || {}, { [ab.name]: { used: !ok, roll: d } }); return x; });
    bannerToast(ab.name + ': W6 = ' + d, ok ? 'Wieder bereit!' : 'Noch nicht aufgeladen (braucht ' + ab.min + (ab.min < 6 ? '–6' : '') + ').'); },
  mfPip: (t, a) => { const n = mfNpc(a); const F = n && mobFeats(n.mid); if (!F) return; const k = t.dataset.k; const max = k === 'laU' ? F.la : F.lr; const used = Math.min(max, n[k] || 0);
    /* gefüllter Punkt = verfügbar: antippen verbraucht einen, leerer Punkt stellt einen wieder her */
    const nu = t.classList.contains('used') ? Math.max(0, used - 1) : Math.min(max, used + 1);
    updNpc(a, (x) => { x[k] = nu; return x; }, nu > used ? n.name + ': ' + (k === 'laU' ? 'legendäre Aktion' : 'legendärer Widerstand') + ' (' + (max - nu) + '/' + max + ' übrig)' : null); }
});
/* Hinweis nur für die Spielleitung, wenn zu Zugbeginn eine Fähigkeit wieder aufgeladen ist */
function mobTurnNote(c, npcs, key) {
  if (!(isDM() || !S.meta.dm)) return; const id = key.slice(2); const x = npcs.find((y) => y.id === id); const F = x && x.mid && mobFeats(x.mid); if (!F) return;
  const back = F.rech.filter((a) => x.rech && x.rech[a.name] && !x.rech[a.name].used && x.rech[a.name].back && Date.now() - x.rech[a.name].back < 3000);
  const still = F.rech.filter((a) => x.rech && x.rech[a.name] && x.rech[a.name].used);
  if (back.length) bannerToast(x.name + ': aufgeladen!', back.map((a) => a.name + ' (W6 ' + x.rech[a.name].roll + ')').join(', ') + ' ist wieder bereit.');
  else if (still.length) bannerToast(x.name, still.map((a) => a.name + ': W6 ' + x.rech[a.name].roll + ' – noch nicht bereit').join(', '));
  else if (F.la) bannerToast(x.name, 'Legendäre Aktionen wieder voll (' + F.la + ').');
}

/* ---- Gegnerzug: Angriffe zählen und „Zug beenden“ anbieten. Nur eine Hilfe, keine Sperre – die SL entscheidet. ---- */
const NUMW = { ein: 1, eine: 1, einen: 1, einer: 1, zwei: 2, drei: 3, vier: 4, 'fünf': 5, sechs: 6, zweimal: 2, dreimal: 3, viermal: 4 };
function mobAtkMax(mid) {
  const M = BESTIARY[mid]; if (!M) return 1; const m = /Mehrfachangriff\b:?\s*([^.]*)/.exec(String(M[8] || '')); if (!m) return 1;
  let s = m[1].replace(/\([^)]*\)/g, ' ').replace(/,\s*(einer|eine)\s+(davon|kann)[^,;]*/g, '').split(/;|\boder\b|,\s*(?=\S+\s+(?:nach|wenn|falls)\b)/)[0].trim(); if (!s) return 2;
  let n = 0; s.split(/\s*(?:,|\bund\b|\+)\s*/).filter((p) => p.trim()).forEach((p) => { const w = p.trim().split(/\s+/)[0].toLowerCase(); const dw = /^\d+W(\d+)$/i.exec(w); n += NUMW[w] || (/^\d+$/.test(w) ? +w : dw ? +dw[1] : 1); });
  return Math.max(1, Math.min(n, 8));
}
function npcTurnBox(c, cur) {
  const x = (c.npcs || []).find((y) => y.id === cur.id); if (!x) return ''; const M = x.mid && BESTIARY[x.mid];
  const max = M ? mobAtkMax(x.mid) : 0; const n = x.atkN || 0; const done = !!max && n >= max; const ma = M && (/Mehrfachangriff[^.]*/.exec(M[8] || '') || [])[0];
  return '<div class="nturn' + (done ? ' done' : '') + '"><div class="nth' + (typeof mobPic === 'function' && mobPic(x.mid) ? ' wp' : '') + '">' + (typeof mobPic === 'function' ? mobPic(x.mid, 'mpicT') : '') + '<b>' + (typeof mobPic === 'function' && mobPic(x.mid) ? '' : '⚔ ') + esc(x.name) + ' ist am Zug</b><small>' + (M ? 'Angriffe ' + n + ' von ' + max + (ma && max > 1 ? ' · ' + esc(ma.replace(/^Mehrfachangriff:?\s*/, '')) : '') : 'Gegner ohne Werte: Angriffe würfelst du selbst') + '</small></div>' +
    '<div class="chips">' + (M ? M[7].map((a, j) => '<button class="btn sm' + (done ? ' ghost' : '') + '" data-act="npcAtk" data-arg="' + x.id + '" data-j="' + j + '">' + esc(a[0]) + ' ' + sgn(a[1]) + '</button>').join('') : '') +
    '<button class="btn sm' + (done || !M ? ' glowbtn' : ' ghost') + '" data-act="turnEnd">Zug beenden ▸</button></div>' +
    (done ? '<p class="hint">Alle Angriffe gemacht. Noch Bewegung, Bonusaktion oder eine Fähigkeit? Sonst Zug beenden.</p>' : '') + '</div>';
}
function npcAtkCount(id) {
  const c = S.combat; if (!c || c.turn !== 'n:' + id) return; /* Gelegenheitsangriffe ausserhalb des eigenen Zuges zählen nicht */
  saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).map((x) => (x.id === id ? Object.assign({}, x, { atkN: (x.atkN || 0) + 1 }) : x)), t: Date.now() }));
}
