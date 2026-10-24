/* ==== Bedienkomfort: Rückgängig (P04), Bestätigungen, automatisches Seitenlayout ==== */
const UNDO_MAX = 25;
const UNDO_LABEL = { hp: 'TP-Änderung', pool: 'Pool ausgegeben', pip: 'Ressource', resUse: 'Ressource', cond: 'Zustand', condClear: 'Zustände entfernt', rest: 'Rast', castSp: 'Zauber gewirkt', tUse: 'Aktion', tLoh: 'Handauflegen', tNew: 'Neuer Zug', tToggle: 'Zugleiste', tMove: 'Bewegung', fx: 'Effekt', flip: 'Umschalter', spendHd: 'Trefferwürfel', deathRoll: 'Todesrettungswurf', dpRoll: 'Schaden gewürfelt', saHit: 'Schaden gewürfelt', optUse: 'Klassenoption', itDrink: 'Trank getrunken', itQty: 'Anzahl geändert', itUse: 'Gegenstand benutzt', rage: 'Kampfrausch', remRoll: 'Rettungswurf', compHp: 'Begleiter-TP', xpAdd: 'Erfahrung', luGo: 'Stufenaufstieg' };
const undoSnap = (ch) => JSON.stringify({ play: ch.play, items: ch.items || [], coins: ch.coins || null, inv: ch.inv || [], comps: ch.comps || [], xp: ch.xp || 0, level: ch.level, multi: ch.multi || [], hpRolls: ch.hpRolls || {} });
let undoPending = null;
function undoBefore(act) {
  if (act === 'undo' || act === 'undoAll') return; const ch = S.chars && S.chars[S.cur]; if (!ch) return;
  if (undoPending) return; undoPending = { id: ch.id, snap: undoSnap(ch), act };
  setTimeout(() => {
    const p = undoPending; undoPending = null; const c2 = S.chars[p.id]; if (!c2) return;
    if (undoSnap(c2) === p.snap) return;
    S.undo = S.undo || []; S.undo.push({ id: p.id, snap: p.snap, label: UNDO_LABEL[p.act] || 'Änderung', t: Date.now() }); if (S.undo.length > UNDO_MAX) S.undo.shift();
    undoBar();
  }, 30);
}
function undoBar() {
  let el = document.getElementById('undoBar'); if (!el) { el = document.createElement('div'); el.id = 'undoBar'; document.body.appendChild(el); }
  S.undo = S.undo || []; const last = S.undo.filter((u) => u.id === S.cur).pop(); if (!last) { el.hidden = true; return; }
  el.innerHTML = '<span>' + esc(last.label) + '</span><button data-act="undo">↶ Rückgängig</button>'; el.hidden = false; el.classList.remove('out'); void el.offsetWidth;
  clearTimeout(undoBar.tm); undoBar.tm = setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.hidden = true; }, 350); }, 6000);
  const hb = document.querySelector('.undobtn'); if (hb) { const n = S.undo.filter((u) => u.id === S.cur).length; hb.disabled = !n; hb.querySelector('b').textContent = n ? n : ''; }
}
function undoDo() {
  S.undo = S.undo || [];
  let i = -1; for (let k = S.undo.length - 1; k >= 0; k--) if (S.undo[k].id === S.cur) { i = k; break; }
  if (i < 0) return; const u = S.undo.splice(i, 1)[0]; const ch = S.chars[u.id]; if (!ch) return;
  const d = JSON.parse(u.snap); Object.assign(ch, { play: d.play, items: d.items, inv: d.inv, comps: d.comps, xp: d.xp, level: d.level, multi: d.multi, hpRolls: d.hpRolls }); if (d.coins) ch.coins = d.coins;
  if (typeof orbPrompt === 'function') { S.dp = null; S.sa = null; orbPrompt(''); }
  commit(); bannerToast('Rückgängig gemacht', u.label);
  const el = document.getElementById('undoBar'); if (el) el.hidden = true;
}
XA.undo = () => undoDo();

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
document.addEventListener('keydown', (ev) => { const tag = (ev.target && ev.target.tagName) || ''; if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z' && !['INPUT', 'TEXTAREA'].includes(tag)) { ev.preventDefault(); undoDo(); } });

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
