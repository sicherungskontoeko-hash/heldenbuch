/* ==== Hilfe-Stufe: wie viel die App erklärt, mitzählt und nachfragt (Einsteiger · Standard · Erfahren) ==== */
/* Eine Stufe setzt fünf Schalter; jeder lässt sich einzeln anpassen. Gilt pro Gerät (localStorage „hb_hilfe“). */
const HL_KEY = 'hb_hilfe';
const HL_OPTS = {
  erkl: ['Erklärknöpfe', '?-Knöpfe, ⓘ und der Hinweis «SL entscheidet».'],
  tipps: ['Einsteiger-Tipps', 'Kurzerklärungen bei Werten und Abschnitten, ein Zug-Leitfaden und nach jedem W20-Wurf ein Satz, was das Ergebnis bedeutet.'],
  zug: ['Zugleiste', 'Zählt Aktion, Bonusaktion, Reaktion und Bewegung mit und prüft im Kampf die Zugregeln. Aus: Du führst deinen Zug selbst, die App zählt und sperrt nichts.'],
  nach: ['Nachbessern anbieten', 'Nach einem Wurf erscheint eine Leiste für Heldeninspiration, Glückskind oder Würfel von Verbündeten – sofern du etwas einsetzen kannst. Aus: nur über ＋ im Würfelfenster.'],
  rw: ['Rechenweg', 'Unter jedem Wert steht, woraus er sich zusammensetzt.']
};
const HL_LEVELS = {
  neu: { n: 'Einsteiger', t: 'Alles wird erklärt: Kurzerklärungen bei den Werten, ein Zug-Leitfaden und nach jedem Wurf ein Satz, was er bedeutet. Zum Lernen gedacht, dafür voller.', o: { erkl: 1, tipps: 1, zug: 1, nach: 1, rw: 0 } },
  std: { n: 'Standard', t: 'Zugleiste und ?-Knöpfe. Nachbessern erscheint nur, wenn du etwas einsetzen kannst.', o: { erkl: 1, tipps: 0, zug: 1, nach: 1, rw: 0 } },
  pro: { n: 'Erfahren', t: 'Nur dein Bogen: tippen, würfeln, fertig. Keine Erklärungen, keine Leisten nach dem Wurf, keine Zugleiste. Soll die App trotzdem Aktionen und Zauberplätze zählen, schalte unten die Zugleiste ein.', o: { erkl: 0, tipps: 0, zug: 0, nach: 0, rw: 0 } }
};
function hlState() {
  if (S.hl) return S.hl;
  let d = null; try { d = JSON.parse(localStorage.getItem(HL_KEY) || 'null'); } catch (e) {}
  if (d && HL_LEVELS[d.lvl]) { const o = Object.assign({}, HL_LEVELS[d.lvl].o); for (const k of Object.keys(HL_OPTS)) if (d.o && d.o[k] !== undefined) o[k] = d.o[k] ? 1 : 0; S.hl = { lvl: d.lvl, o }; }
  else { S.hl = { lvl: 'std', o: Object.assign({}, HL_LEVELS.std.o) }; let rw = false; try { rw = localStorage.getItem('hb_explain') === '1'; } catch (e) {} if (rw) S.hl.o.rw = 1; }
  return S.hl;
}
const hlOn = (k) => !!hlState().o[k];
const hlCustom = () => { const s = hlState(); return Object.keys(HL_OPTS).some((k) => !!s.o[k] !== !!HL_LEVELS[s.lvl].o[k]); };
const hlLabel = () => HL_LEVELS[hlState().lvl].n + (hlCustom() ? ' (angepasst)' : '');
function hlSave() { try { localStorage.setItem(HL_KEY, JSON.stringify(S.hl)); } catch (e) {} hlApply(); }
function hlApply() { const b = document.body; if (!b) return; b.classList.toggle('hl-erkl0', !hlOn('erkl')); b.classList.toggle('hl-tipps', hlOn('tipps')); }
function hlSetLevel(l) { if (!HL_LEVELS[l]) return; S.hl = { lvl: l, o: Object.assign({}, HL_LEVELS[l].o) }; hlSave(); }
function hlSet(k, v) { hlState().o[k] = v ? 1 : 0; hlSave(); }
/* Einsteiger-Tipp: kurze Erklärzeile, nur wenn „Einsteiger-Tipps“ an sind */
const hlTip = (t, tag) => (hlOn('tipps') ? '<' + (tag || 'small') + ' class="nb">' + t + '</' + (tag || 'small') + '>' : '');

/* Auswahl: drei Stufen als Karten, darunter die Schalter einzeln */
function hlPanel(where) {
  const s = hlState(); const cust = hlCustom();
  return '<div class="hllv" role="radiogroup" aria-label="Hilfe-Stufe">' + Object.entries(HL_LEVELS).map(([k, L]) => '<button type="button" role="radio" aria-checked="' + (s.lvl === k && !cust) + '" class="hlc' + (s.lvl === k ? (cust ? ' part' : ' on') : '') + '" data-act="hlLvl" data-arg="' + esc(k) + '" data-where="' + esc(where) + '"><b>' + L.n + (s.lvl === k && cust ? ' <em>angepasst</em>' : '') + '</b><small>' + esc(L.t) + '</small></button>').join('') + '</div>' +
    /* Zugleiste immer sichtbar: Wie viel erklärt wird und ob die App den Zug zählt, sind zwei getrennte Fragen */
    '<div class="rulelist hlzug">' + hlRow('zug', where) + '</div>' +
    '<details class="hlfine"' + (cust || S.hlFine ? ' open' : '') + '><summary>Einzeln anpassen</summary><div class="rulelist">' +
    Object.entries(HL_OPTS).filter(([k]) => k !== 'zug').map(([k, o]) => '<label class="rulerow"><input type="checkbox" data-act="hlT" data-arg="' + esc(k) + '" data-where="' + esc(where) + '"' + (hlOn(k) ? ' checked' : '') + '><span><b>' + esc(o[0]) + '</b><small>' + esc(o[1]) + '</small></span></label>').join('') + '</div></details>';
}
const hlRow = (k, where) => '<label class="rulerow"><input type="checkbox" data-act="hlT" data-arg="' + esc(k) + '" data-where="' + esc(where) + '"' + (hlOn(k) ? ' checked' : '') + '><span><b>' + esc(HL_OPTS[k][0]) + '</b><small>' + esc(HL_OPTS[k][1]) + '</small></span></label>';
function hlOpen() {
  const m = $('#modal'); S.modal = 'hilfe'; S.more = false; document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  m.innerHTML = '<div class="dlg hldlg" role="dialog" aria-modal="true" aria-label="Hilfen"><div class="dph"><b>Hilfen</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<p class="hint">Wie viel soll dir die App erklären und abnehmen? Gilt auf diesem Gerät.</p>' + hlPanel('dlg') +
    '<div class="chips end"><button class="btn" data-act="closeModal">Fertig</button></div></div>';
  m.hidden = false; const bn = $('#bnav'); if (bn && typeof bnavHtml === 'function') bn.innerHTML = bnavHtml();
}
const hlAfter = (where) => { render(); if (where === 'dlg' && S.modal === 'hilfe') hlOpen(); };
Object.assign(XA, {
  hlOpen: () => hlOpen(),
  hlLvl: (t, a) => { hlSetLevel(a); hlAfter(t.dataset.where); },
  hlT: (t, a) => { S.hlFine = true; hlSet(a, !hlOn(a)); hlAfter(t.dataset.where); }
});
setTimeout(hlApply, 0);

/* Einsteiger: ein Satz im Würfelfenster, was das Ergebnis bedeutet */
function rollTip(e) {
  if (!hlOn('tipps') || e.sides !== 20 || !e.kt) return '';
  const pre = e.pair ? (e.adv ? 'Vorteil: Von zwei W20 zählt der höhere. ' : 'Nachteil: Von zwei W20 zählt der niedrigere. ') : '';
  if (e.kt === 'attack') return pre + (e.crit ? 'Natürliche 20: kritischer Treffer! Die Schadenswürfel zählen doppelt.' : e.fumble ? 'Natürliche 1: Der Angriff verfehlt immer.' : 'Erreicht das die RK des Ziels, triffst du. Die Spielleitung sagt es dir.');
  if (e.kt === 'save') return pre + 'Rettungswurf: Er gelingt, wenn du den SG erreichst. Den SG nennt die Spielleitung oder der Zauber.';
  if (e.kt === 'init') return pre + 'Initiative: Alle kommen in der Reihenfolge dieser Zahlen dran, die höchste zuerst.';
  if (e.kt === 'check') return pre + 'Nenne der Spielleitung die Zahl. Sie vergleicht mit dem SG: leicht 10, mittel 15, schwer 20.';
  return '';
}

/* Willkommen: beim ersten Start die Stufe wählen (ohne Neuzeichnen, damit der eingegebene Name bleibt) */
function hlWelcomeHtml() {
  const cur = S.wLvl || hlState().lvl;
  return '<div class="fld wlvl"><span>Wie viel Hilfe möchtest du?</span><div class="seg" role="radiogroup" aria-label="Hilfe-Stufe">' + Object.entries(HL_LEVELS).map(([k, L]) => '<button type="button" role="radio" aria-checked="' + (k === cur) + '" class="' + (k === cur ? 'on' : '') + '" data-act="wLvl" data-arg="' + esc(k) + '">' + L.n + '</button>').join('') + '</div><em id="wLvlT">' + esc(HL_LEVELS[cur].t) + '</em></div>';
}
XA.wLvl = (t, a) => { if (!HL_LEVELS[a]) return; S.wLvl = a; document.querySelectorAll('.wlvl .seg button').forEach((b) => { const on = b.dataset.arg === a; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); const e = $('#wLvlT'); if (e) e.textContent = HL_LEVELS[a].t; };
