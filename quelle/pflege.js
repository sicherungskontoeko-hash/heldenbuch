/* ==== Pflege: Speicher absichern, Sicherung nach dem Spielabend anbieten, Stolpersteine sammeln ==== */

/* Dauerhaften Speicher anfragen. Ohne diese Zusage darf der Browser die Daten einer Web-App bei Platznot oder nach
   längerer Pause löschen (v. a. Safari). Chrome und Safari fragen nicht nach; Firefox zeigt eine Rückfrage,
   deshalb dort nur bei installierter App. */
function pfPersist() {
  try {
    const st = navigator.storage; if (!st || !st.persist || !st.persisted) return;
    const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    if (/firefox/i.test(navigator.userAgent) && !standalone) return;
    st.persisted().then((p) => (p ? true : st.persist())).then((ok) => { window.HB_PERSIST = !!ok; }).catch(() => {});
  } catch (e) {}
}
pfPersist();

/* Sicherung nach dem Spielabend: Beim nächsten Start fragt die App einmal, wenn seit der letzten Sicherung
   mindestens 10 eigene Würfe dazugekommen sind und die letzte Sicherung älter als 20 Stunden ist.
   Höchstens einmal pro Tag. In automatischen Tests aus, ausser der Test schaltet es ein. */
const PF_ASK = 'hb_bkAsk', PF_GAP = 20 * 3600e3, PF_ROLLS = 10;
function pfNum(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
function pfRollsSince(t) { const H = typeof histLoad === 'function' ? histLoad() : []; return H.filter((x) => x && x.t > t && !x.oth).length; }
function pfBackupDue() {
  if (!S.chars || !Object.keys(S.chars).length) return 0;
  const now = Date.now(), last = pfNum('hb_lastExport');
  if (last && now - last < PF_GAP) return 0;
  if (now - pfNum(PF_ASK) < PF_GAP) return 0;
  const n = pfRollsSince(last); return n >= PF_ROLLS ? n : 0;
}
function pfBkHide() { const el = $('#pfBk'); if (el) el.remove(); }
function pfBkShow(n) {
  pfBkHide(); try { localStorage.setItem(PF_ASK, String(Date.now())); } catch (e) {}
  const el = document.createElement('div'); el.id = 'pfBk'; el.className = 'pfbk'; el.setAttribute('role', 'status');
  el.innerHTML = '<div><b>Spielabend sichern?</b><small>Seit der letzten Sicherung hast du ' + n + '-mal gewürfelt. Eine Sicherungsdatei schützt deine Helden, falls der Speicher auf diesem Gerät gelöscht wird.</small></div>' +
    '<div class="pfbtn"><button class="btn sm" data-act="pfBkGo">Jetzt sichern</button><button class="btn sm ghost" data-act="pfBkLater">Später</button></div>';
  document.body.appendChild(el);
}
function pfBkCheck() {
  if (navigator.webdriver && !window.__hbBkTest) return;
  const n = pfBackupDue(); if (!n) return;
  setTimeout(() => { if (S.modal || S.view === 'build' || $('#pfBk')) return; pfBkShow(n); }, window.__hbBkTest ? 50 : 2500);
}
setTimeout(pfBkCheck, window.__hbBkTest ? 300 : 1500);

/* ---------- Stolpersteine: was am Spielabend gestört hat, mit Ort und Zeit ---------- */
const ST_KEY = 'hb_stolper', ST_MAX = 100;
const ST_VIEW = { sheet: 'Bogen', build: 'Erschaffung', heroes: 'Heldenliste', camp: 'Tisch', adv: 'Abenteuer', spells: 'Zauberbuch', mobs: 'Bestiarium', hb: 'Hausregeln', help: 'Hilfe' };
const ST_TAB = { kampf: 'Kampf', werte: 'Werte', zauber: 'Zauber', faehig: 'Fähigkeiten', gear: 'Ausrüstung', begleiter: 'Begleiter', notiz: 'Notizen' };
function stLoad() { try { const L = JSON.parse(localStorage.getItem(ST_KEY) || '[]'); return Array.isArray(L) ? L : []; } catch (e) { return []; } }
function stSave(L) { try { localStorage.setItem(ST_KEY, JSON.stringify(L.slice(-ST_MAX))); } catch (e) {} }
function stVer() { return typeof VER !== 'undefined' && typeof BUILD !== 'undefined' ? 'App ' + VER + ', Build ' + new Date(BUILD * 1000).toISOString().slice(0, 10) : 'Browser-Version'; }
function stCtx() {
  const p = [ST_VIEW[S.view] || S.view || '?'];
  try {
    const ch = typeof cur === 'function' ? cur() : null;
    if (S.view === 'sheet' && S.mg && ST_TAB[S.mg]) p.push('Reiter ' + ST_TAB[S.mg]);
    if (S.view === 'build') p.push('Schritt ' + ((+S.step || 0) + 1));
    if (ch && (S.view === 'sheet' || S.view === 'build')) { const c = typeof derive === 'function' ? derive(ch, S.hb) : null; p.push((ch.name || 'Held') + (c && c.level ? ', Stufe ' + c.level : '')); }
    if (S.combat && S.combat.active) p.push('Kampf, Runde ' + (S.combat.round || 1));
    p.push(window.innerWidth < 700 ? 'Handy' : 'grosser Bildschirm');
    if (typeof hlState === 'function') p.push('Hilfe ' + ({ neu: 'Einsteiger', std: 'Standard', pro: 'Erfahren' }[hlState().lvl] || hlState().lvl));
  } catch (e) {}
  return p.join(' · ');
}
const stTime = (t) => { const d = new Date(t); return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }); };
function stText() { const L = stLoad(); return 'Stolpersteine aus dem Heldenbuch (' + stVer() + '), ' + L.length + ' Einträge:\n' + L.map((x) => '- ' + stTime(x.t) + ' | ' + x.w + ' | ' + x.x).join('\n'); }
function stOpen(keep) {
  const L = stLoad(); const m = $('#modal'); S.modal = 'stolper'; S.more = false;
  document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  if (!S.stCtx) S.stCtx = stCtx();
  m.innerHTML = '<div class="dlg stdlg" role="dialog" aria-modal="true" aria-label="Stolperstein melden"><div class="dph"><b>Stolperstein melden</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<p class="hint">Was hat gerade gestört, gefehlt oder verwirrt? Ein Satz genügt. Die App merkt sich dazu, wo du warst.</p>' +
    '<div class="chradd"><input id="stX" type="text" maxlength="300" enterkeyhint="done" autocomplete="off" placeholder="z. B. «Ich habe den Knopf für Bardische Inspiration nicht gefunden»">' + (typeof micBtn === 'function' ? micBtn('stX') : '') + '<button class="btn sm" data-act="stAdd">Festhalten</button></div>' +
    '<p class="stctx"><small>Ort: ' + esc(S.stCtx) + '</small></p>' +
    (L.length ? '<ul class="stl">' + L.slice(-8).reverse().map((x) => '<li><time>' + stTime(x.t) + '</time><span>' + esc(x.x) + '<small>' + esc(x.w) + '</small></span></li>').join('') + '</ul>' +
      (L.length > 8 ? '<p class="hint">… und ' + (L.length - 8) + ' ältere. «Alle kopieren» nimmt alle mit.</p>' : '') : '') +
    '<div class="chips end">' + (L.length ? '<button class="btn ghost" data-act="stCopy">Alle kopieren (' + L.length + ')</button>' + (navigator.share ? '<button class="btn ghost" data-act="stShare">Teilen</button>' : '') +
      '<button class="btn ghost" data-act="stClear" data-confirm="Alle Stolpersteine auf diesem Gerät löschen?">Leeren</button>' : '') + '<button class="btn" data-act="closeModal">Schliessen</button></div>' +
    (L.length ? '<p class="hint">Kopiere die Liste nach dem Spielabend und schick sie Claude: So wird die nächste Version gezielt besser.</p>' : '') + '</div>';
  m.hidden = false; if (!keep) { const i = $('#stX'); if (i) i.focus(); }
}
Object.assign(XA, {
  pfBkGo: () => { pfBkHide(); doExport(Object.values(S.chars), 'Heldenbuch_Sicherung.json', true); },
  pfBkLater: () => { pfBkHide(); },
  stOpen: () => { S.stCtx = stCtx(); stOpen(); },
  stAdd: () => {
    const el = $('#stX'); const v = el && el.value.trim(); if (!v) { if (el) el.focus(); return; }
    const L = stLoad(); L.push({ t: Date.now(), x: v.slice(0, 300), w: S.stCtx || stCtx() }); stSave(L); stOpen();
  },
  stCopy: async (t) => { const ok = typeof slCopy === 'function' ? await slCopy(stText()) : false; if (t) t.textContent = ok ? 'Kopiert ✓' : 'Kopieren ging nicht'; },
  stShare: () => { try { navigator.share({ title: 'Stolpersteine', text: stText() }).catch(() => {}); } catch (e) {} },
  stClear: () => { stSave([]); stOpen(true); }
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.isComposing && ev.target && ev.target.id === 'stX') { ev.preventDefault(); XA.stAdd(); } });
