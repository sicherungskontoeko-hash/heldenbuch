/* ==== Kampagnenbuch: Personen, Orte und Aufträge (Reiter im Chronik-Fenster) ====
   Je Buch (Abenteuer, Tisch oder «Ohne Abenteuer», wie die Chronik) in localStorage «hb_kbuch».
   Jeder Eintrag: Name, Kurzbeschreibung, geheime Notiz (nur Spielleitung), Stand, Schalter «Spieler wissen davon».
   Freigegebene Einträge gehen über das Tisch-Dokument (Meta kb) an die Spieler: Name, Kurzbeschreibung, Stand.
   Statuswechsel bei Aufträgen und Freigaben landen in der Chronik; alles fliesst in die Claude-Lage und in «Alles sichern». */
const KB_KEY = 'hb_kbuch', KB_MAX = 300, KB_PUB_MAX = 80;
const KB_TYP = { p: ['Personen', 'Person'], o: ['Orte', 'Ort'], a: ['Aufträge', 'Auftrag'] };
const KB_ST = {
  p: [['neutral', 'Neutral'], ['freund', 'Verbündet'], ['feind', 'Feindlich'], ['tot', 'Tot']],
  o: [['offen', 'Nicht besucht'], ['besucht', 'Besucht']],
  a: [['offen', 'Offen'], ['erledigt', 'Erledigt'], ['gescheitert', 'Gescheitert']]
};
const KB_HINT = { p: 'z. B. «Brannok Hornhand, Schmied in Felsbruck»', o: 'z. B. «Wirtshaus zum letzten Krug»', a: 'z. B. «Die gestohlene Glocke zurückbringen»' };
const kbStName = (x) => ((KB_ST[x.typ] || []).find(([k]) => k === x.st) || [0, ''])[1];
function kbDb() { try { const d = JSON.parse(localStorage.getItem(KB_KEY) || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
function kbSaveDb(d) { try { localStorage.setItem(KB_KEY, JSON.stringify(d)); } catch (e) { if (typeof bannerToast === 'function') bannerToast('Speichern fehlgeschlagen', 'Der Speicher ist voll. Sichere jetzt über «Alles sichern».'); } }
function kbKeyName(k) {
  if (/^adv:/.test(k)) { const A = typeof advGet === 'function' ? advGet(k.slice(4)) : null; return A ? A.title : 'Abenteuer'; }
  if (/^tisch:/.test(k)) return 'Tisch ' + k.slice(6);
  return 'Ohne Abenteuer';
}
function kbKey() { if (S.kbKey) return S.kbKey; const w = typeof chrWhere === 'function' ? chrWhere() : { key: 'frei' }; return w.key; }
function kbList(key) { const d = kbDb(); const L = d[key || kbKey()]; return Array.isArray(L) ? L : []; }
function kbSave(key, L) { const d = kbDb(); d[key] = L.slice(-KB_MAX); kbSaveDb(d); }
/* Alle Bücher, in denen etwas steht, dazu das aktuelle */
function kbBooks() {
  const ks = new Set(Object.keys(kbDb()).filter((k) => kbList(k).length));
  try { Object.keys(chrDb()).forEach((k) => { if (chrList(k).length) ks.add(k); }); } catch (e) {}
  S.kbKey0 = S.kbKey0 || (typeof chrWhere === 'function' ? chrWhere().key : 'frei'); ks.add(S.kbKey0); if (S.camp) ks.add('tisch:' + S.camp);
  return [...ks].map((k) => [k, kbKeyName(k)]);
}
function kbTabs() {
  const key = kbKey(); const t = S.kbTab || 'chr'; const L = kbList(key);
  const n = (typ) => L.filter((x) => x.typ === typ && (typ !== 'a' || x.st === 'offen')).length;
  const bk = kbBooks();
  return '<div class="kbbar">' + (bk.length > 1 ? '<label class="kbbook">Buch <select id="kbBook" aria-label="Buch wählen">' + bk.map(([k, nm]) => '<option value="' + esc(k) + '"' + (k === key ? ' selected' : '') + '>' + esc(nm) + '</option>').join('') + '</select></label>' : '') +
    '<div class="chips kbtabs" role="tablist">' + chip(t === 'chr', 'Chronik', 'role="tab" data-act="kbTab" data-arg="chr"') +
    ['p', 'o', 'a'].map((k) => chip(t === k, KB_TYP[k][0] + (n(k) ? ' <small>' + n(k) + '</small>' : ''), 'role="tab" data-act="kbTab" data-arg="' + esc(k) + '"')).join('') + (typeof standRender === 'function' ? chip(t === 's', 'Spielstand', 'role="tab" data-act="kbTab" data-arg="s"') : '') + '</div></div>';
}
function kbSort(L, typ) {
  const rank = (x) => (typ === 'a' ? { offen: 0, erledigt: 1, gescheitert: 2 }[x.st] || 0 : x.st === 'tot' ? 1 : 0);
  return L.slice().sort((a, b) => rank(a) - rank(b) || (typ === 'a' ? (b.u || 0) - (a.u || 0) : String(a.n).localeCompare(String(b.n), 'de')));
}
function kbItem(x) {
  const open = S.kbOpenId === x.id; const dm = !S.camp || (typeof isDM === 'function' && isDM());
  return '<li class="kbi' + (x.st === 'tot' || x.st === 'gescheitert' || x.st === 'erledigt' ? ' dim' : '') + '"><details data-kbid="' + esc(x.id) + '"' + (open ? ' open' : '') + '><summary><span class="kbn"><b>' + esc(x.n) + '</b>' + (x.d ? '<small>' + esc(x.d) + '</small>' : '') + '</span>' +
    '<span class="kbst st-' + esc(x.st) + '">' + esc(kbStName(x)) + '</span>' + (x.frei ? '<span class="kbeye" title="Die Spieler wissen davon" aria-label="Spieler wissen davon">👁</span>' : '') + '</summary>' +
    '<div class="kbed"><label>Kurz <small>' + (dm && S.camp ? '(sehen die Spieler, wenn freigegeben)' : '') + '</small><input type="text" maxlength="160" data-kb="d" data-id="' + esc(x.id) + '" value="' + esc(x.d || '') + '" placeholder="Wer, was, wo – ein Satz"></label>' +
    '<label>Geheime Notiz <small>(nur auf diesem Gerät)</small><textarea rows="2" maxlength="600" data-kb="g" data-id="' + esc(x.id) + '" placeholder="Was die Helden noch nicht wissen">' + esc(x.g || '') + '</textarea></label>' +
    '<div class="chips">' + (KB_ST[x.typ] || []).map(([k, l]) => chip(x.st === k, l, 'data-act="kbSt" data-arg="' + x.id + ':' + k + '"')).join('') + '</div>' +
    '<label class="kbfrei"><input type="checkbox" data-kb="frei" data-id="' + esc(x.id) + '"' + (x.frei ? ' checked' : '') + '> Die Spieler wissen davon' + (S.camp && dm ? ' <small>(am Tisch sichtbar)</small>' : '') + '</label>' +
    '<div class="chips end"><button class="btn ghost sm" data-act="kbDel" data-arg="' + esc(x.id) + '" data-confirm="«' + esc(x.n) + '» löschen?">Löschen</button></div></div></details></li>';
}
function kbRender(keep) {
  const t = S.kbTab; const key = kbKey(); const L = kbSort(kbList(key).filter((x) => x.typ === t), t); const m = $('#modal');
  S.modal = 'chronik'; S.more = false; document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  const sy = keep ? (m.querySelector('.kbl') || {}).scrollTop || 0 : 0;
  m.innerHTML = '<div class="dlg chrdlg kbdlg" role="dialog" aria-modal="true" aria-label="' + KB_TYP[t][0] + '"><div class="dph"><b>' + KB_TYP[t][0] + ' · ' + esc(kbKeyName(key)) + '</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' + kbTabs() +
    '<div class="chradd"><input id="kbN" type="text" maxlength="80" enterkeyhint="done" autocomplete="off" placeholder="' + esc(KB_HINT[t]) + '">' + (typeof micBtn === 'function' ? micBtn('kbN') : '') + '<button class="btn sm" data-act="kbAdd">Hinzufügen</button></div>' +
    (L.length ? '<ul class="kbl">' + L.map(kbItem).join('') + '</ul>' : '<p class="hint">Noch keine ' + KB_TYP[t][0] + '. Name eintippen und «Hinzufügen». Danach kannst du eine Kurzbeschreibung, eine geheime Notiz und den Stand festhalten' + (S.camp ? ' und entscheiden, ob die Spieler davon wissen' : '') + '.</p>') +
    (L.some((x) => x.frei) && S.camp ? '<p class="hint">👁 Die Spieler sehen am Tisch Name, Kurzbeschreibung und Stand. Geheime Notizen bleiben bei dir.</p>' : '') + '</div>';
  m.hidden = false; const l = m.querySelector('.kbl'); if (l && sy) l.scrollTop = sy;
}
/* Chronik-Fenster: Reiter Personen, Orte, Aufträge */
if (typeof chrOpen === 'function') { const _kbChr0 = chrOpen; chrOpen = function (keep) { if (S.kbTab === 's' && typeof standRender === 'function') return standRender(keep); if (S.kbTab && S.kbTab !== 'chr') return kbRender(keep); return _kbChr0.apply(this, arguments); }; }

/* «📜 Chronik» öffnet immer die Chronik; die gewählte Buchseite (Personen …) bleibt über die Reiter erreichbar */
if (XA.chrOpen) { const _kbXa0 = XA.chrOpen; XA.chrOpen = function () { S.kbTab = 'chr'; return _kbXa0.apply(this, arguments); }; }

/* Freigegebene Einträge an den Tisch (nur Spielleitung) */
function kbShare() {
  if (!S.camp || !(typeof isDM === 'function' && isDM()) || typeof saveMeta !== 'function') return;
  clearTimeout(kbShare.tm); kbShare.tm = setTimeout(() => {
    const pub = kbList(kbKey()).filter((x) => x.frei).slice(-KB_PUB_MAX).map((x) => ({ id: x.id, typ: x.typ, n: x.n, d: String(x.d || '').slice(0, 160), st: x.st }));
    if (JSON.stringify(pub) !== JSON.stringify((S.meta && S.meta.kb) || [])) saveMeta({ kb: pub });
  }, 500);
}
function kbFind(id) { const key = kbKey(); const L = kbList(key); return { key, L, x: L.find((y) => y.id === id) }; }
function kbChr(x, why) {
  if (typeof chrAdd !== 'function') return; const k = { p: 'person', o: 'ort', a: 'auftrag' }[x.typ];
  if (why === 'neu' && x.typ === 'a') chrAdd(k, 'Neuer Auftrag: ' + x.n);
  else if (why === 'st') chrAdd(k, (x.typ === 'a' ? 'Auftrag ' + kbStName(x).toLowerCase() + ': ' : x.n + ': ') + (x.typ === 'a' ? x.n : kbStName(x)));
  else if (why === 'frei') chrAdd(k, (x.typ === 'a' ? 'Die Helden kennen den Auftrag: ' : x.typ === 'o' ? 'Die Helden kennen den Ort: ' : 'Die Helden kennen jetzt: ') + x.n);
}
Object.assign(XA, {
  kbOpen: (t, a) => { S.kbTab = a || 'p'; S.kbKey = S.kbKey || null; chrOpen(); },
  kbTab: (t, a) => { S.kbTab = a; S.kbOpenId = null; chrOpen(true); },
  kbAdd: () => {
    const el = $('#kbN'); const v = el && el.value.trim(); if (!v) { if (el) el.focus(); return; }
    const key = kbKey(); const L = kbList(key); const now = Date.now(); const typ = S.kbTab || 'p';
    const x = { id: uidX(), typ, n: v.slice(0, 80), d: '', g: '', st: KB_ST[typ][0][0], frei: false, t: now, u: now };
    L.push(x); kbSave(key, L); S.kbOpenId = x.id; kbChr(x, 'neu'); kbRender(true);
    const d = document.querySelector('[data-kb="d"][data-id="' + esc(x.id) + '"]'); if (d) d.focus();
  },
  kbSt: (t, a) => { const [id, st] = String(a).split(':'); const f = kbFind(id); if (!f.x || f.x.st === st) return; f.x.st = st; f.x.u = Date.now(); kbSave(f.key, f.L); S.kbOpenId = id; kbChr(f.x, 'st'); if (f.x.frei) kbShare(); kbRender(true); },
  kbDel: (t, a) => { const f = kbFind(a); if (!f.x) return; kbSave(f.key, f.L.filter((y) => y.id !== a)); if (f.x.frei) kbShare(); S.kbOpenId = null; kbRender(true); }
});
/* Eingaben im Buch: Text sofort speichern, Freigabe-Schalter, Buchwahl, Aufklappen merken, Enter fügt hinzu */
function kbField(el, final) {
  const f = kbFind(el.dataset.id); if (!f.x) return; const k = el.dataset.kb;
  if (k === 'frei') { f.x.frei = el.checked; f.x.u = Date.now(); kbSave(f.key, f.L); if (f.x.frei) kbChr(f.x, 'frei'); kbShare(); if (final) kbRender(true); return; }
  f.x[k] = String(el.value).slice(0, k === 'g' ? 600 : 160); f.x.u = Date.now(); kbSave(f.key, f.L); if (k === 'd' && f.x.frei) kbShare();
  if (final && k === 'd') { const s = el.closest('details') && el.closest('details').querySelector('summary .kbn small'); if (s) s.textContent = f.x.d; else if (f.x.d) { const b = el.closest('details').querySelector('summary .kbn'); if (b) b.insertAdjacentHTML('beforeend', '<small>' + esc(f.x.d) + '</small>'); } }
}
document.addEventListener('input', (ev) => { const el = ev.target; if (el && el.dataset && el.dataset.kb && el.dataset.kb !== 'frei') kbField(el, false); });
document.addEventListener('change', (ev) => {
  const el = ev.target; if (!el) return;
  if (el.dataset && el.dataset.kb) kbField(el, true);
  else if (el.id === 'kbBook') { S.kbKey = el.value; S.kbOpenId = null; chrOpen(true); }
});
document.addEventListener('toggle', (ev) => { const d = ev.target; if (d && d.dataset && d.dataset.kbid) { if (d.open) S.kbOpenId = d.dataset.kbid; else if (S.kbOpenId === d.dataset.kbid) S.kbOpenId = null; } }, true);
document.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.isComposing && ev.target && ev.target.id === 'kbN') { ev.preventDefault(); XA.kbAdd(); } });

/* Spieler am Tisch: was die Spielleitung freigegeben hat, eingeklappt unter dem Ansagefeld */
function kbPlayerBox() {
  const L = ((S.meta && S.meta.kb) || []).filter((x) => x && x.n && KB_TYP[x.typ]); if (!L.length) return '';
  const open = L.filter((x) => x.typ === 'a' && x.st === 'offen').length;
  const grp = ['a', 'p', 'o'].map((t) => { const g = kbSort(L.filter((x) => x.typ === t), t); return g.length ? '<h4>' + KB_TYP[t][0] + '</h4><ul class="kbpl">' + g.map((x) => '<li class="' + (x.st === 'tot' || x.st === 'gescheitert' || x.st === 'erledigt' ? 'dim' : '') + '"><b>' + esc(x.n) + '</b> <span class="kbst st-' + esc(x.st) + '">' + esc(kbStName(x)) + '</span>' + (x.d ? '<small>' + esc(x.d) + '</small>' : '') + '</li>').join('') + '</ul>' : ''; }).join('');
  return '<details class="fgrp kbp"' + (S.kbpOpen ? ' open' : '') + '><summary><b>Bekannt</b> <small>Personen, Orte, Aufträge' + (open ? ' · ' + open + ' offen' : '') + '</small></summary><div class="kbpb">' + grp + '</div></details>';
}
document.addEventListener('toggle', (ev) => { const d = ev.target; if (d && d.classList && d.classList.contains('kbp')) S.kbpOpen = d.open; }, true);
if (typeof dmTools === 'function') { const _kbDm0 = dmTools; dmTools = function () { const h = _kbDm0.apply(this, arguments); if (!S.camp || (typeof isDM === 'function' && isDM())) return h; return h + kbPlayerBox(); }; }

/* Für Claude: Personen, Orte, Aufträge des aktuellen Buchs (mit geheimen Notizen – die Lage liest nur die Spielleitung) */
function kbText(key) {
  const L = kbList(key); if (!L.length) return '';
  return ['a', 'p', 'o'].map((t) => { const g = kbSort(L.filter((x) => x.typ === t), t); return g.length ? KB_TYP[t][0] + ':\n' + g.slice(0, 30).map((x) => '- ' + x.n + ' [' + kbStName(x) + (x.frei ? ', den Spielern bekannt' : ', den Spielern unbekannt') + ']' + (x.d ? ': ' + x.d : '') + (x.g ? ' (geheim: ' + x.g + ')' : '')).join('\n') : ''; }).filter(Boolean).join('\n');
}
if (typeof slLage === 'function') { const _kbSl0 = slLage; slLage = function (q) { const s = _kbSl0.apply(this, arguments); let k = 'frei'; try { k = S.kbKey && S.modal === 'chronik' ? S.kbKey : chrWhere().key; } catch (e) {} const t = kbText(k); if (!t) return s; const i = s.indexOf('\n## Letzte Würfe'); const add = '\n## Personen, Orte, Aufträge\n' + t + '\n'; return i >= 0 ? s.slice(0, i) + add + s.slice(i) : s + '\n' + add; }; }
