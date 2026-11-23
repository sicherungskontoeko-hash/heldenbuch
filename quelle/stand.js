/* ==== Spielstand: Zusammenfassungen der Spielabende, damit ein neuer Chat mit wenig Tokens weitermachen kann ====
   Je Buch (wie Chronik und Kampagnenbuch) in localStorage «hb_stand»: { gesamt: {x, t}, abende: [{id, t, titel, x}] }.
   Claude schreibt am Ende des Abends mit «abend_abschliessen» eine knappe Zusammenfassung und führt die Gesamtzusammenfassung nach.
   «lage» bringt danach zuerst «Bisher» und nur, was seit dem Abschluss neu ist. Ohne Claude: Entwurf aus der Chronik. */
const ST_DB = 'hb_stand', ST_ABENDE = 30;
function standDb() { try { const d = JSON.parse(localStorage.getItem(ST_DB) || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
function standSaveDb(d) { try { localStorage.setItem(ST_DB, JSON.stringify(d)); } catch (e) { if (typeof bannerToast === 'function') bannerToast('Speichern fehlgeschlagen', 'Der Speicher ist voll. Sichere jetzt über «Alles sichern».'); } }
function standOf(key) { const d = standDb()[key || kbKey()] || {}; return { gesamt: d.gesamt && d.gesamt.x ? d.gesamt : null, abende: Array.isArray(d.abende) ? d.abende : [] }; }
function standPut(key, st) { const d = standDb(); d[key] = { gesamt: st.gesamt || null, abende: (st.abende || []).slice(-ST_ABENDE) }; standSaveDb(d); }
function standLastT(key) { const s = standOf(key); const a = s.abende[s.abende.length - 1]; return a ? a.t : 0; }
const stDate = (t) => new Date(t).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
/* Text «Bisher» für Claude: Gesamtstand und letzter Abend, gekürzt */
function standText(key, max) {
  const s = standOf(key); const a = s.abende[s.abende.length - 1]; if (!s.gesamt && !a) return '';
  const m = max || 1600; const cut = (x) => (String(x).length > m ? String(x).slice(0, m).replace(/\s\S*$/, '') + ' …' : String(x));
  return (s.gesamt ? 'Kampagne bisher (Stand ' + stDate(s.gesamt.t) + '): ' + cut(s.gesamt.x) : '') + (a ? (s.gesamt ? '\n' : '') + 'Letzter Abend ' + stDate(a.t) + (a.titel ? ' «' + a.titel + '»' : '') + ': ' + cut(a.x) : '');
}
function standSave(key, { x, gesamt, titel }) {
  const st = standOf(key); const now = Date.now(); const ab = { id: uidX(), t: now, titel: String(titel || '').slice(0, 80), x: String(x || '').slice(0, 3000) };
  st.abende.push(ab); if (gesamt != null && String(gesamt).trim()) st.gesamt = { x: String(gesamt).slice(0, 4000), t: now };
  standPut(key, st); try { chrAdd('abend', 'Abend abgeschlossen' + (ab.titel ? ': ' + ab.titel : '') + ' (Zusammenfassung gespeichert)', true); } catch (e) {}
  return ab;
}
/* Entwurf ohne Claude: Chronik seit dem letzten Abschluss als Stichworte */
function standDraft(key) { const since = standLastT(key); const L = (typeof chrList === 'function' ? chrList(key) : []).filter((e) => e.t > since && !/^(kampf)$/.test(e.k)); return L.length ? L.map((e) => '- ' + String(e.x).replace(/\s+/g, ' ')).join('\n') : ''; }

/* Reiter «Spielstand» im Chronik-Fenster */
function standRender(keep) {
  const key = kbKey(); const s = standOf(key); const m = $('#modal'); S.modal = 'chronik'; S.more = false;
  const dm = !S.camp || (typeof isDM === 'function' && isDM());
  m.innerHTML = '<div class="dlg chrdlg kbdlg stdlg2" role="dialog" aria-modal="true" aria-label="Spielstand"><div class="dph"><b>Spielstand · ' + esc(kbKeyName(key)) + '</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' + kbTabs() +
    '<p class="hint">Zusammenfassungen der Spielabende. Ein neuer Chat mit Claude liest zuerst diesen Stand und nur, was seither neu ist – das spart viel Nutzung. Am Ende des Abends in Claude: «Abend abschliessen».</p>' +
    '<label class="stg">Kampagne bisher <small>(fortlaufend, von Claude nachgeführt)</small><textarea id="stGes" rows="4" maxlength="4000" placeholder="Noch keine Gesamtzusammenfassung">' + esc(s.gesamt ? s.gesamt.x : '') + '</textarea></label>' +
    (dm ? '<div class="chips"><button class="btn ghost sm" data-act="spGesSave">Gesamt speichern</button></div>' : '') +
    (s.abende.length ? '<ul class="kbl stab">' + s.abende.slice().reverse().map((a, i) => '<li class="kbi"><details' + (i === 0 && !keep ? ' open' : '') + '><summary><span class="kbn"><b>' + esc(stDate(a.t)) + (a.titel ? ' · ' + esc(a.titel) : '') + '</b><small>' + esc(String(a.x).slice(0, 90)) + '</small></span></summary><div class="kbed"><textarea rows="6" maxlength="3000" data-stid="' + a.id + '">' + esc(a.x) + '</textarea>' +
      (dm ? '<div class="chips end">' + (S.camp ? '<button class="btn ghost sm" data-act="spHo" data-arg="' + a.id + '" title="Geht als Handout an alle – vorher prüfen, ob nichts Geheimes drinsteht">An Spieler</button>' : '') + '<button class="btn ghost sm" data-act="spDel" data-arg="' + a.id + '" data-confirm="Diese Zusammenfassung löschen?">Löschen</button></div>' : '') + '</div></details></li>').join('') + '</ul>' : '<p class="hint">Noch kein Abend abgeschlossen.</p>') +
    (dm ? '<details class="stnew"' + (S.stNewOpen ? ' open' : '') + '><summary>Abend selbst abschliessen (ohne Claude)</summary><input id="stTit" type="text" maxlength="80" placeholder="Titel, z. B. «Im Keller der Wirtin»"><textarea id="stNew" rows="6" maxlength="3000" placeholder="Was ist passiert, wo stehen die Helden, was ist offen?"></textarea><div class="chips"><button class="btn ghost sm" data-act="spDraft">Entwurf aus der Chronik</button><button class="btn sm" data-act="spAdd">Speichern</button></div></details>' : '') +
    '<div class="chips end"><button class="btn ghost" data-act="spFile">Als Datei sichern</button></div></div>';
  m.hidden = false;
}
function standFileText(key) {
  const s = standOf(key); const L = ['# Spielstand: ' + kbKeyName(key), ''];
  if (s.gesamt) L.push('## Kampagne bisher (' + stDate(s.gesamt.t) + ')', s.gesamt.x, '');
  for (const a of s.abende) L.push('## ' + stDate(a.t) + (a.titel ? ' – ' + a.titel : ''), a.x, '');
  try { const k = typeof kbText === 'function' ? kbText(key) : ''; if (k) L.push('## Personen, Orte, Aufträge', k, ''); } catch (e) {}
  return L.join('\n');
}
Object.assign(XA, {
  spGesSave: () => { const key = kbKey(); const st = standOf(key); const v = ($('#stGes') || {}).value || ''; st.gesamt = v.trim() ? { x: v.slice(0, 4000), t: Date.now() } : null; standPut(key, st); bannerToast('Gespeichert', 'Gesamtzusammenfassung aktualisiert.'); },
  spDraft: () => { const d = standDraft(kbKey()); const el = $('#stNew'); if (el) el.value = d || '(Keine neuen Chronik-Einträge seit dem letzten Abschluss.)'; S.stNewOpen = true; },
  spAdd: () => { const el = $('#stNew'); const v = el && el.value.trim(); if (!v) { if (el) el.focus(); return; } standSave(kbKey(), { x: v, titel: ($('#stTit') || {}).value || '' }); S.stNewOpen = false; standRender(); },
  spDel: (t, a) => { const key = kbKey(); const st = standOf(key); st.abende = st.abende.filter((x) => x.id !== a); standPut(key, st); standRender(true); },
  spHo: (t, a) => { const ab = standOf(kbKey()).abende.find((x) => x.id === a); if (!ab || !S.camp || !isDM()) return; saveMeta({ handouts: ((S.meta && S.meta.handouts) || []).concat([{ id: uidX(), title: 'Was bisher geschah' + (ab.titel ? ': ' + ab.titel : ''), text: ab.x, t: Date.now() }]).slice(-20) }); bannerToast('Handout geteilt', 'Die Zusammenfassung ist jetzt bei allen am Tisch.'); },
  spFile: async (t) => {
    const key = kbKey(); const txt = standFileText(key); const fn = ('Spielstand_' + kbKeyName(key)).replace(/[^\wäöüÄÖÜ -]/g, '').trim().replace(/\s+/g, '_') + '.md';
    try { const d = await (window.claude && window.claude.use ? window.claude.use('downloads') : null); if (!d) throw new Error('none'); await d.save({ filename: fn, data: txt }); bannerToast('Gesichert', fn); }
    catch (e) { const ok = typeof slCopy === 'function' ? await slCopy(txt) : false; if (t) t.textContent = ok ? 'Kopiert (kein Speichern möglich)' : 'Ging nicht'; }
  }
});
/* Abend-Texte direkt beim Tippen speichern */
document.addEventListener('input', (ev) => { const el = ev.target; if (!el || !el.dataset || !el.dataset.stid) return; const key = kbKey(); const st = standOf(key); const a = st.abende.find((x) => x.id === el.dataset.stid); if (a) { a.x = String(el.value).slice(0, 3000); standPut(key, st); } });
document.addEventListener('toggle', (ev) => { const d = ev.target; if (d && d.classList && d.classList.contains('stnew')) S.stNewOpen = d.open; }, true);

/* Claude: Werkzeug «abend_abschliessen», «lage» beginnt mit «Bisher», Neues ab dem Abschluss */
if (typeof BR_TOOLS === 'object') {
  BR_TOOLS.abend_abschliessen = (a) => {
    if (S.camp && !isDM()) throw new Error('Den Spielstand führt die Spielleitung.');
    const x = String(a.zusammenfassung || '').trim(); if (x.length < 40) throw new Error('zusammenfassung fehlt oder ist zu kurz.');
    const key = kbKey(); const ab = standSave(key, { x, gesamt: a.gesamt, titel: a.titel });
    let ho = ''; if (a.fuer_spieler && S.camp && isDM()) { saveMeta({ handouts: ((S.meta && S.meta.handouts) || []).concat([{ id: uidX(), title: 'Was bisher geschah' + (ab.titel ? ': ' + ab.titel : ''), text: String(a.fuer_spieler).slice(0, 2500), t: Date.now() }]).slice(-20) }); ho = ' Die Spielerfassung ging als Handout an alle.'; }
    if (S.modal === 'chronik') chrOpen(true);
    return 'Gespeichert im Buch «' + kbKeyName(key) + '» (' + standOf(key).abende.length + '. Abend' + (a.gesamt ? ', Gesamtstand nachgeführt' : '') + ').' + ho + ' Ein neuer Chat holt das mit lage.';
  };
  const _stLage0 = BR_TOOLS.lage;
  BR_TOOLS.lage = (a) => {
    const key = kbKey(); if (!S.brSince) { const t0 = standLastT(key); if (t0) S.brSince = t0; } /* neuer Abend: nur was seit dem Abschluss passiert ist */
    const out = _stLage0(a); if (a && (a.nur_neu === true || a.nur_neu === 'true' || a.voll === true || a.voll === 'true')) return out; /* voll: steht schon in der ausführlichen Lage */
    const b = standText(key, 1400); return b ? 'Bisher:\n' + b + '\n\n' + out : out;
  };
}
/* Auch die kopierte Lage (claude.ai) beginnt mit dem Spielstand */
if (typeof slLage === 'function') { const _stSl0 = slLage; slLage = function (q) { const s = _stSl0.apply(this, arguments); let k = 'frei'; try { k = kbKey(); } catch (e) {} const b = standText(k, 1400); if (!b) return s; const i = s.indexOf('\n## '); const add = '\n## Bisher (Spielstand)\n' + b + '\n'; return i >= 0 ? s.slice(0, i) + add + s.slice(i) : s + add; }; }
