/* ---------- Spielereignisse sichtbar machen (Effekte 2.0, Schritt 2) ----------
   Nur bestätigte Änderungen am eigenen, aktiven Helden: commit() meldet den neuen Stand (vfxObserve), hier wird er mit dem
   zuletzt gesehenen verglichen. Erster Blick auf einen Helden, Heldenwechsel, Rückgängig, Zurückspulen und Stufenaufstieg
   (eigene Feier) zeigen keine TP-Effekte; Abgleich vom Tisch ohne commit() zeigt nichts.
   Effekte sind lokal am Helden, dekorativ (aria-hidden, keine Zeiger-Ereignisse), kurz (200–600 ms, Stufenaufstieg 1,3 s)
   und ändern keine Werte. Text und Zahlen im Bogen sind unabhängig davon immer sichtbar. */
const VFX_EV = { seen: {}, last: '', quietNext: false, hint: null, dmg: null };
/* Farbe und Form je Schadensart (Referenz HBVisualV2.damage) */
const VFX_DMG = { feuer: ['#f69a46', 'ember'], kaelte: ['#a8def8', 'flake'], blitz: ['#ebd65d', 'bolt'], saeure: ['#b1d65f', 'drop'], gift: ['#7ac877', 'mist'],
  nekrotisch: ['#a394af', 'dust'], strahlend: ['#fff1bb', 'spark'], psychisch: ['#b695ed', 'wave'], energie: ['#78b9ec', 'wave'], donner: ['#becce1', 'ring'],
  hieb: ['#e9c9b4', 'slash'], stich: ['#e1c8af', 'point'], wucht: ['#c7a98b', 'dust'], heilung: ['#8dd8a0', 'ring'], unbekannt: ['#d3c6b4', 'ring'] };
/* Schadensarten, wie sie in den Daten stehen (Werteblöcke, Waffen); gemischte oder unbekannte Angaben bleiben neutral */
const VFX_DTYPE = { feuer: 'feuer', 'kälte': 'kaelte', kaelte: 'kaelte', blitz: 'blitz', 'säure': 'saeure', saeure: 'saeure', gift: 'gift', nekrotisch: 'nekrotisch',
  gleissend: 'strahlend', strahlend: 'strahlend', psychisch: 'psychisch', energie: 'energie', schall: 'donner', donner: 'donner', hieb: 'hieb', stich: 'stich', wucht: 'wucht' };
function vfxDtype(t) { const k = String(t || '').trim().toLowerCase(); if (!k || /[,/+&]|\bund\b|\boder\b|mehrere/.test(k)) return 'unbekannt'; return VFX_DTYPE[k] || 'unbekannt'; }
/* nächster commit() zeigt nichts (Rückgängig, Zurückspulen, Stufenaufstieg, Rast mit eigener Anzeige) */
function vfxQuiet() { VFX_EV.quietNext = true; }
/* Zusatzwissen für den nächsten commit(), z. B. die Schadensart eines Treffers */
function vfxHint(o) { VFX_EV.hint = Object.assign({ t: Date.now() }, o); }
function vfxState(ch) {
  const P = ch.play || {}; const slots = {}; for (const [k, v] of Object.entries(P.slots || {})) slots[k] = +v || 0;
  return { hp: P.hp == null ? null : +P.hp, temp: +P.temp || 0, conc: P.conc ? String(P.conc.name || '1') : '', cond: (P.cond || []).filter((k) => typeof k === 'string'), exh: +P.exh || 0,
    insp: !!P.insp, slots, pact: +P.pact || 0, items: (Array.isArray(ch.items) ? ch.items.length : 0) + (Array.isArray(ch.inv) ? ch.inv.length : 0), dead: !!P.dead };
}
/* Rechteck eines Elements im jetzigen Bild (vor dem Neuzeichnen), für Dinge, die gleich verschwinden */
const vfxRect = (sel) => { const e = document.querySelector(sel); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
function vfxObserve(ch) {
  if (!ch || !ch.id || !ch.play) return;
  const now = vfxState(ch); const old = VFX_EV.seen[ch.id]; VFX_EV.seen[ch.id] = now;
  const hint = VFX_EV.hint && Date.now() - VFX_EV.hint.t < 1500 ? VFX_EV.hint : null; VFX_EV.hint = null;
  if (VFX_EV.quietNext) { VFX_EV.quietNext = false; return; }
  const same = VFX_EV.last === ch.id; VFX_EV.last = ch.id;
  if (!old || !same || ch.id !== S.cur) return; /* Heldenwechsel: nur merken */
  const ev = [];
  if (old.hp != null && now.hp != null && now.hp !== old.hp) ev.push({ k: 'hp', d: now.hp - old.hp, dtype: now.hp < old.hp ? vfxDtype(hint && hint.dtype) : 'heilung' });
  else if (now.temp < old.temp) ev.push({ k: 'hp', d: now.temp - old.temp, dtype: vfxDtype(hint && hint.dtype), temp: true });
  if (now.temp > old.temp) ev.push({ k: 'temp', d: now.temp - old.temp });
  if (old.conc && !now.conc) ev.push({ k: 'concEnd', name: old.conc, r: vfxRect('#view .vb.vconc') });
  for (const [lv, n] of Object.entries(now.slots)) if (n > (old.slots[lv] || 0)) { ev.push({ k: 'slot', lv, n }); break; }
  if (now.pact > old.pact) ev.push({ k: 'slot', lv: 'pact', n: now.pact });
  if (now.cond.some((c) => !old.cond.includes(c)) || now.exh > old.exh) ev.push({ k: 'cond' });
  if (now.insp && !old.insp) ev.push({ k: 'insp' });
  if (now.items > old.items) ev.push({ k: 'item' });
  if (old.hp > 0 && now.hp != null && now.hp <= 0 && !now.dead) ev.push({ k: 'down' });
  if (ev.length) setTimeout(() => vfxPlay(ev), 0); /* nach dem Neuzeichnen */
}
/* ---- Bausteine ---- */
function vfxLayer() { let l = document.getElementById('vfxl'); if (!l) { l = document.createElement('div'); l.id = 'vfxl'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); } return l; }
/* erstes sichtbares Element (im Bild) zu einer Liste von Selektoren, getrennt mit | */
const vfxVis = (sel) => { for (const s of sel.split('|')) for (const e of document.querySelectorAll(s)) { if (!e.getClientRects().length) continue; const r = e.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) return e; } return null; };
function vfxFlash(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }
function vfxAt(r, cls, html, ms, css) { const d = document.createElement('div'); d.className = 'vfxe ' + cls; d.style.cssText = 'left:' + Math.round(r.x + r.w / 2) + 'px;top:' + Math.round(r.y + r.h / 2) + 'px;' + (css || ''); d.innerHTML = html || ''; vfxLayer().appendChild(d); setTimeout(() => d.remove(), ms); return d; }
const vfxBox = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
function vfxParts(n, col, shape, spread) { let h = ''; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + vrand() * 0.6; const d = spread * (0.55 + vrand() * 0.45);
  h += '<i class="vp ' + shape + '" style="--c:' + col + ';--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d - (shape === 'ember' || shape === 'mist' ? 14 : 0)).toFixed(0) + 'px;--d:' + Math.round(vrand() * 60) + 'ms;--r:' + Math.round((vrand() - 0.5) * 180) + 'deg"></i>'; } return h; }
/* ---- Schaden und Heilung: höchstens ein Effekt auf einmal, Dezent ≤ 8, Intensiv ≤ 15 Teilchen ---- */
function vfxDamage(e) {
  const lv = vfxLevel('damage'); if (lv === 'aus') return;
  const el = vfxVis('#view .vb.hpb|#top .curhero'); if (!el) return; const r = vfxBox(el);
  if (VFX_EV.dmg) VFX_EV.dmg.remove();
  const [col, shape] = VFX_DMG[e.dtype] || VFX_DMG.unbekannt; const n = lv === 'intensiv' ? 15 : 8;
  const sign = e.d > 0 ? '+' : '−'; const num = '<b class="vnum' + (e.d > 0 ? ' heal' : '') + '">' + sign + Math.abs(e.d) + (e.temp ? ' <small>temp.</small>' : '') + '</b>';
  const ring = ['ring', 'wave', 'slash', 'point'].includes(shape) ? '<i class="vring ' + shape + '" style="--c:' + col + '"></i>' : '';
  VFX_EV.dmg = vfxAt(r, 'vdmg t-' + e.dtype, ring + vfxParts(n, col, shape, Math.max(34, r.w * 0.55)) + num, 520);
  vfxFlash(el, e.d > 0 ? 'vfx-heal' : 'vfx-hurt', 420);
  /* TP-Balken vom alten zum neuen Stand gleiten lassen (nur echte TP, nicht temporäre) */
  const bar = !e.temp && el.querySelector('.hpbar > i'); const mx = +String((el.querySelector('b small') || {}).textContent || '').replace(/[^\d]/g, '');
  if (bar && mx) { const nw = parseFloat(bar.style.width) || 0; const ow = Math.max(0, Math.min(100, nw - (e.d / mx) * 100)); bar.style.transition = 'none'; bar.style.width = ow + '%'; void bar.offsetWidth; bar.style.transition = 'width .4s ease-out'; bar.style.width = nw + '%'; }
  if (e.d < 0 && typeof vfxVibrate === 'function') vfxVibrate('damage');
}
/* ---- Ereignisse (Zug, Rast, Stufe, Zustände …) ---- */
function vfxPlay(ev) {
  const lv = vfxLevel('status');
  for (const e of ev) {
    if (e.k === 'hp') { vfxDamage(e); continue; }
    if (lv === 'aus') continue;
    if (e.k === 'temp') vfxFlash(vfxVis('#view .vb.hpb|#top .curhero'), 'vfx-shield', 320);
    else if (e.k === 'concEnd' && e.r) vfxAt(e.r, 'vconc', '<span>◎</span>', 420, 'width:' + Math.round(e.r.w) + 'px;height:' + Math.round(e.r.h) + 'px');
    else if (e.k === 'slot') { const el = e.lv === 'pact' ? vfxVis('#view [data-act="pip"][data-path="pact"][data-arg="' + (e.n - 1) + '"]') : vfxVis('#view [data-act="pip"][data-path="slots.' + e.lv + '"][data-arg="' + (e.n - 1) + '"]'); vfxFlash(el, 'vfx-out', 240); }
    else if (e.k === 'cond') vfxFlash(vfxVis('#view .vb.vcond'), 'vfx-in', 320);
    else if (e.k === 'insp') { const el = vfxVis('#view [data-path="play.insp"]'); if (el) { vfxFlash(el, 'vfx-glow', 320); vfxAt(vfxBox(el), 'vstar', '★', 360); } }
    else if (e.k === 'item') vfxFlash(vfxVis('#view [data-act="mg"][data-arg="gear"]|#view [data-act="mg"][data-arg="all"]'), 'vfx-glow', 420);
    else if (e.k === 'down') vfxFlash(vfxVis('#view .shead .sigil'), 'vfx-ko', 320);
  }
}
/* eigener Zug: goldener Impuls am Wappen bzw. am Helden oben */
function vfxTurn() {
  if (vfxLevel('status') !== 'aus') { vfxFlash(vfxVis('#view .shead .sigil'), 'vfx-turn', 520); vfxFlash(vfxVis('#top .curhero'), 'vfx-turn', 520); }
  if (typeof vfxVibrate === 'function') vfxVibrate('turn');
}
/* Rast: Bernsteinlicht (kurz) bzw. goldene Welle (lang) über dem Kopf des Bogens; die TP-Änderung zeigt die Rast selbst */
function vfxRest(kind) {
  vfxQuiet(); if (vfxLevel('status') === 'aus') return;
  setTimeout(() => { const el = vfxVis('#view .shead .who|#top .curhero'); if (!el) return; const r = vfxBox(el);
    vfxAt(r, 'vrest ' + (kind === 'long' ? 'long' : 'short'), '', kind === 'long' ? 640 : 440, 'width:' + Math.round(r.w) + 'px;height:' + Math.round(r.h) + 'px'); }, 0);
}
