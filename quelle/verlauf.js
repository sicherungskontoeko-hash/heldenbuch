/* ==== Würfelverlauf: jeder Wurf bleibt nachlesbar – Helden, Kreaturen, Mitspieler; auf dem Gerät gespeichert ==== */
const HIST_KEY = 'hb_wverlauf', HIST_MAX = 200;
function histLoad() { if (!S.hist) { try { S.hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { S.hist = []; } if (!Array.isArray(S.hist)) S.hist = []; } return S.hist; }
function histSave() { try { localStorage.setItem(HIST_KEY, JSON.stringify(S.hist.slice(0, HIST_MAX))); } catch (e) {} }
/* Wer hat gewürfelt? Auf dem Bogen der Held, sonst (Begegnung, Bestiarium, Tisch der Spielleitung) die Spielleitung */
function histWho() { const ch = typeof cur === 'function' ? cur() : null; if (S.view === 'sheet' && ch) return ch.name; if (typeof isDM === 'function' && S.camp && isDM()) return 'Spielleitung'; return ch && S.view !== 'mobs' && S.view !== 'enc' ? ch.name : ''; }
function histAdd(e, who, other) {
  if (!e || e.preview) return; const H = histLoad();
  H.unshift({ t: e.t || Date.now(), who: who != null ? who : histWho(), label: String(e.label || ''), total: e.total, detail: String(e.detail || ''), crit: !!e.crit, fumble: !!e.fumble, sides: e.sides || 0, secret: !!e.secret, oth: other ? 1 : 0 });
  if (H.length > HIST_MAX) H.length = HIST_MAX; histSave();
  if (S.modal === 'verlauf') histOpen(true);
}
const histTime = (t) => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function histDay(t) { const d = new Date(t), n = new Date(); const k = (x) => x.getFullYear() + '-' + x.getMonth() + '-' + x.getDate(); if (k(d) === k(n)) return 'Heute'; const y = new Date(n); y.setDate(n.getDate() - 1); if (k(d) === k(y)) return 'Gestern'; return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); }
function histOpen(keep) {
  const H = histLoad(); const m = $('#modal'); S.modal = 'verlauf'; S.more = false;
  document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  const f = S.histF || 'alle'; const n = S.histN || 60;
  const whos = [...new Set(H.map((x) => x.who).filter(Boolean))].slice(0, 8);
  const list = H.filter((x) => f === 'alle' || (f === 'andere' ? x.oth : x.who === f));
  let day = '', rows = '';
  for (const x of list.slice(0, n)) {
    const d = histDay(x.t); if (d !== day) { day = d; rows += '<li class="hday">' + d + '</li>'; }
    rows += '<li class="hit' + (x.crit ? ' crit' : x.fumble ? ' fum' : '') + '"><time>' + histTime(x.t) + '</time><span><b>' + esc(x.label) + '</b>' + (x.who ? '<em>' + esc(x.who) + (x.secret ? ' · geheim' : '') + '</em>' : '') + (x.detail ? '<small>' + esc(x.detail) + '</small>' : '') + '</span><strong>' + esc(String(x.total)) + '</strong></li>';
  }
  m.innerHTML = '<div class="dlg histdlg" role="dialog" aria-modal="true" aria-label="Würfelverlauf"><div class="dph"><b>Würfelverlauf</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    (whos.length > 1 || H.some((x) => x.oth) ? '<div class="chips hf">' + chip(f === 'alle', 'Alle', 'data-act="histF" data-arg="alle"') + whos.map((w) => chip(f === w, esc(w), 'data-act="histF" data-arg="' + esc(w) + '"')).join('') + (H.some((x) => x.oth) ? chip(f === 'andere', 'Mitspieler', 'data-act="histF" data-arg="andere"') : '') + '</div>' : '') +
    (list.length ? '<ul class="hist">' + rows + '</ul>' + (list.length > n ? '<button class="link more" data-act="histMore">Ältere anzeigen (' + (list.length - n) + ')</button>' : '') : '<p class="hint">Noch keine Würfe. Jeder Wurf – auch von Kreaturen und Mitspielern am Tisch – landet hier und bleibt auf diesem Gerät gespeichert (die letzten ' + HIST_MAX + ').</p>') +
    '<div class="chips end">' + (H.length ? '<button class="btn ghost" data-act="histClear" data-confirm="Den ganzen Würfelverlauf auf diesem Gerät löschen?">Verlauf leeren</button>' : '') + '<button class="btn" data-act="closeModal">Schliessen</button></div></div>';
  m.hidden = false; if (!keep) { const l = m.querySelector('.hist'); if (l) l.scrollTop = 0; }
  const bn = $('#bnav'); if (bn && typeof bnavHtml === 'function' && !keep) bn.innerHTML = bnavHtml();
}
Object.assign(XA, {
  histOpen: () => { S.histN = 60; histOpen(); },
  histF: (t, a) => { S.histF = a; S.histN = 60; histOpen(true); },
  histMore: () => { S.histN = (S.histN || 60) + 100; histOpen(true); },
  histClear: () => { S.hist = []; histSave(); histOpen(true); }
});
