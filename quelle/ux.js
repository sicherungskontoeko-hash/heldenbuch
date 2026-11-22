/* ==== Bedienkomfort: Rückgängig (P04), Bestätigungen, automatisches Seitenlayout ==== */
const UNDO_MAX = 25;
const UNDO_LABEL = { hp: 'TP-Änderung', pool: 'Pool ausgegeben', pip: 'Ressource', resUse: 'Ressource', cond: 'Zustand', condClear: 'Zustände entfernt', rest: 'Rast', castSp: 'Zauber gewirkt', tUse: 'Aktion', tLoh: 'Handauflegen', tNew: 'Neuer Zug', tToggle: 'Zugleiste', tMove: 'Bewegung', fx: 'Effekt', flip: 'Umschalter', spendHd: 'Trefferwürfel', deathRoll: 'Todesrettungswurf', dpRoll: 'Schaden gewürfelt', saHit: 'Schaden gewürfelt', optUse: 'Klassenoption', itDrink: 'Trank getrunken', itQty: 'Anzahl geändert', itUse: 'Gegenstand benutzt', rage: 'Kampfrausch', remRoll: 'Rettungswurf', compHp: 'Begleiter-TP', xpAdd: 'Erfahrung', luGo: 'Stufenaufstieg' };
const undoSnap = (ch) => JSON.stringify({ play: ch.play, items: ch.items || [], coins: ch.coins || null, inv: ch.inv || [], comps: ch.comps || [], xp: ch.xp || 0, level: ch.level, multi: ch.multi || [], hpRolls: ch.hpRolls || {} });
let undoPending = null;
function undoBefore(act) {
  if (act === 'undo' || act === 'undoAll' || act === 'redo' || act === 'turnBack' || act === 'turnBackGo') return; const ch = S.chars && S.chars[S.cur]; if (!ch) return;
  if (undoPending) return; undoPending = { id: ch.id, snap: undoSnap(ch), act };
  setTimeout(() => {
    const p = undoPending; undoPending = null; const c2 = S.chars[p.id]; if (!c2) return;
    if (undoSnap(c2) === p.snap) return;
    S.undo = S.undo || []; S.undo.push({ id: p.id, snap: p.snap, label: UNDO_LABEL[p.act] || 'Änderung', t: Date.now() }); if (S.undo.length > UNDO_MAX) S.undo.shift();
    S.redo = (S.redo || []).filter((r) => r.id !== p.id); /* neue Änderung: Wiederholen verfällt */
    undoBar();
  }, 30);
}
function undoBtnsRefresh(flash) {
  const nav = document.querySelector('.mnav[aria-label="Seiten des Bogens"]'); if (!nav) return false;
  const ub = nav.querySelector('.udo'); const h = undoBtns();
  if (ub) { if (h) ub.outerHTML = h; else ub.remove(); } else if (h) nav.insertAdjacentHTML('beforeend', h);
  if (flash) { const b = nav.querySelector('.undobtn'); if (b) { b.classList.add('neu'); setTimeout(() => b.classList.remove('neu'), 1200); } }
  return nav.getClientRects().length > 0;
}
/* Nach einer Änderung: Auf dem Bogen leuchtet der feste Rückgängig-Knopf kurz auf (keine schwebende Leiste, die Inhalt verdeckt).
   In anderen Ansichten erscheint die kleine Leiste unten für 6 Sekunden. */
function undoBar() {
  let el = document.getElementById('undoBar'); if (!el) { el = document.createElement('div'); el.id = 'undoBar'; document.body.appendChild(el); }
  S.undo = S.undo || []; const last = S.undo.filter((u) => u.id === S.cur).pop();
  const onSheet = undoBtnsRefresh(!!last) && S.view === 'sheet';
  if (!last || onSheet) { el.hidden = true; return; }
  el.innerHTML = '<span>' + esc(last.label) + '</span><button data-act="undo">↶ Rückgängig</button>'; el.hidden = false; el.classList.remove('out'); void el.offsetWidth;
  clearTimeout(undoBar.tm); undoBar.tm = setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.hidden = true; }, 350); }, 6000);
}
function undoApply(ch, snap) { const d = JSON.parse(snap); Object.assign(ch, { play: d.play, items: d.items, inv: d.inv, comps: d.comps, xp: d.xp, level: d.level, multi: d.multi, hpRolls: d.hpRolls }); if (d.coins) ch.coins = d.coins; if (typeof orbPrompt === 'function') { S.dp = null; S.sa = null; orbPrompt(''); } }
const undoN = () => (S.undo || []).filter((u) => u.id === S.cur).length, redoN = () => (S.redo || []).filter((u) => u.id === S.cur).length;
function undoDo() {
  S.undo = S.undo || [];
  let i = -1; for (let k = S.undo.length - 1; k >= 0; k--) if (S.undo[k].id === S.cur) { i = k; break; }
  if (i < 0) return; const u = S.undo.splice(i, 1)[0]; const ch = S.chars[u.id]; if (!ch) return;
  S.redo = S.redo || []; S.redo.push({ id: u.id, snap: undoSnap(ch), label: u.label, t: u.t }); if (S.redo.length > UNDO_MAX) S.redo.shift();
  undoApply(ch, u.snap); commit(); bannerToast('Rückgängig gemacht', u.label);
  const el = document.getElementById('undoBar'); if (el) el.hidden = true;
}
/* Wiederholen: den zuletzt zurückgenommenen Schritt wieder anwenden */
function redoDo() {
  S.redo = S.redo || []; let i = -1; for (let k = S.redo.length - 1; k >= 0; k--) if (S.redo[k].id === S.cur) { i = k; break; }
  if (i < 0) return; const r = S.redo.splice(i, 1)[0]; const ch = S.chars[r.id]; if (!ch) return;
  S.undo = S.undo || []; S.undo.push({ id: r.id, snap: undoSnap(ch), label: r.label, t: r.t });
  undoApply(ch, r.snap); commit(); bannerToast('Wiederholt', r.label);
}
/* Zug zurückspulen: Stand zu Beginn des eigenen Zuges (gemerkt bei „Neuer Zug“ bzw. Zugbeginn am Tisch) */
function turnMark(ch) { S.turnSnap = S.turnSnap || {}; S.turnSnap[ch.id] = { snap: undoSnap(ch), t: Date.now() }; }
function turnSince(ch) { const m = S.turnSnap && S.turnSnap[ch.id]; return m ? (S.undo || []).filter((u) => u.id === ch.id && u.t >= m.t) : []; }
function turnBackOpen() {
  const ch = S.chars[S.cur]; const m = ch && S.turnSnap && S.turnSnap[ch.id]; const list = ch ? turnSince(ch) : [];
  const md = $('#modal'); S.modal = 'turnback'; document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  md.innerHTML = '<div class="dlg cfdlg" role="dialog" aria-modal="true" aria-label="Zug zurückspulen"><div class="dph"><b>Zug zurückspulen</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    (!m ? '<p>Noch kein Zugbeginn gemerkt. Der Stand wird bei «Neuer Zug» oder zu Beginn deines Zuges am Tisch festgehalten.</p><div class="chips end"><button class="btn" data-act="closeModal">Schliessen</button></div>' :
    !list.length ? '<p>Seit Beginn deines Zuges hat sich nichts geändert.</p><div class="chips end"><button class="btn" data-act="closeModal">Schliessen</button></div>' :
    '<p>Alles seit Beginn deines Zuges wird zurückgenommen:</p><ul class="tblist">' + list.map((u) => '<li>' + esc(u.label) + '</li>').join('') + '</ul><p class="hint">Gewürfelte Ergebnisse bleiben im Würfelverlauf stehen. Schaden, den die Spielleitung schon eingetragen hat, korrigiert sie selbst. «Wiederholen» holt den Stand zurück.</p>' +
    '<div class="chips end"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" data-act="turnBackGo">⟲ Zurückspulen</button></div>') + '</div>';
  md.hidden = false;
}
function turnBackGo() {
  const ch = S.chars[S.cur]; const m = ch && S.turnSnap && S.turnSnap[ch.id]; if (!m) return; const n = turnSince(ch).length;
  S.undo = (S.undo || []).filter((u) => !(u.id === ch.id && u.t >= m.t));
  S.redo = (S.redo || []).filter((r) => r.id !== ch.id); S.redo.push({ id: ch.id, snap: undoSnap(ch), label: 'Zug zurückgespult', t: Date.now() });
  undoApply(ch, m.snap); S.modal = null; $('#modal').hidden = true; commit(); bannerToast('Zug zurückgespult', n + (n === 1 ? ' Schritt' : ' Schritte') + ' zurückgenommen');
}
XA.undo = () => undoDo();
XA.redo = () => redoDo();
XA.turnBack = () => turnBackOpen();
XA.turnBackGo = () => turnBackGo();
/* Rückgängig/Wiederholen fest in der Reiterleiste (bleibt am rechten Rand sichtbar) */
function undoBtns() {
  if (typeof S === 'undefined') return ''; const u = undoN(), r = redoN();
  if (!u && !r) return ''; /* nichts rückgängig zu machen: kein Knopf, mehr Platz für die Reiter */
  return '<span class="udo"><button class="undobtn" data-act="undo" title="Letzte Änderung rückgängig (Strg+Z)" aria-label="Rückgängig"' + (u ? '' : ' disabled') + '>↶<b>' + (u || '') + '</b></button>' + (r ? '<button class="redobtn" data-act="redo" title="Wiederholen (Strg+Y)" aria-label="Wiederholen">↷<b>' + r + '</b></button>' : '') + '</span>';
}

/* Bestätigung vor kritischen Aktionen: Knöpfe mit data-confirm */
function confirmAsk(t) {
  const attrs = Object.entries(t.dataset).filter(([k]) => k !== 'confirm').map(([k, v]) => 'data-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + '="' + esc(v) + '"').join(' ');
  const m = $('#modal'); S.modal = 'confirm';
  m.innerHTML = '<div class="dlg cfdlg" role="alertdialog" aria-modal="true" aria-label="Bestätigen"><h3>Sicher?</h3><p>' + esc(t.dataset.confirm) + '</p><div class="chips end"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" ' + attrs + ' data-ok="1">Ja, ausführen</button></div></div>';
  m.hidden = false;
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act]'); if (!t) return;
  if (t.dataset.confirm && !t.dataset.ok) { ev.stopImmediatePropagation(); ev.preventDefault(); confirmAsk(t); return; }
  if (t.dataset.ok && S.modal === 'confirm') { S.modal = null; $('#modal').hidden = true; }
  undoBefore(t.dataset.act);
}, true);
document.addEventListener('change', (ev) => { const t = ev.target; if (t && t.dataset && t.dataset.bind && /^play\./.test(t.dataset.bind)) undoBefore('flip'); }, true);
document.addEventListener('keydown', (ev) => { const tag = (ev.target && ev.target.tagName) || ''; if ((ev.ctrlKey || ev.metaKey) && !['INPUT', 'TEXTAREA'].includes(tag)) { const k = ev.key.toLowerCase(); if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); undoDo(); } else if (k === 'y' || (k === 'z' && ev.shiftKey)) { ev.preventDefault(); redoDo(); } } });

/* ---------- Automatisches Seitenlayout: Blöcke gleichmässig auf zwei Spalten verteilen ---------- */
function layoutSheet() {
  const tp = document.getElementById('top'); if (tp) { const th = tp.offsetHeight + 'px'; if (layoutSheet.th !== th) { document.documentElement.style.setProperty('--toph', th); layoutSheet.th = th; } }
  const sh = document.querySelector('.sheet'); if (!sh) return;
  const cols = sh.querySelector('.cols'); if (!cols) return;
  const parts = [...cols.querySelectorAll(':scope > .col')]; if (parts.length < 2) return;
  if (!sh.hasAttribute('data-mg')) { cols.classList.remove('one', 'even'); return; }
  const blocks = parts.flatMap((p) => [...p.children]); const vis = blocks.filter((b) => getComputedStyle(b).display !== 'none');
  cols.classList.toggle('one', vis.length <= 1);
  if (window.innerWidth < 1000 || vis.length <= 1) { cols.classList.remove('even'); return; }
  cols.classList.add('even');
  const h = [0, 0]; const order = [[], []];
  for (const b of vis) { const k = h[0] <= h[1] ? 0 : 1; order[k].push(b); h[k] += b.getBoundingClientRect().height + 16; }
  /* Feinschliff: grossen Block, der eine Spalte überlaufen lässt, auf die andere Seite verschieben */
  for (let i = 0; i < 2; i++) for (const b of order[i]) parts[i].appendChild(b);
  blocks.filter((b) => !vis.includes(b)).forEach((b) => parts[1].appendChild(b));
}
let layoutTm = null;
window.addEventListener('resize', () => { clearTimeout(layoutTm); layoutTm = setTimeout(() => { if (S.view === 'sheet') render(); }, 250); });
