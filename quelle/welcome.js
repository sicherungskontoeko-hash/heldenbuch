/* ---------- Willkommen: beim ersten Start den eigenen Namen eingeben (kein Konto, kein Passwort) ---------- */
const PL_KEY = 'heldenbuch_player';
function myName() { try { return (localStorage.getItem(PL_KEY) || '').trim(); } catch (e) { return ''; } }
function setMyName(v) { try { localStorage.setItem(PL_KEY, v); } catch (e) {} }
const plLabel = (p) => (p && p.pl ? ' <small class="plname">(' + esc(p.pl) + ')</small>' : '');
/* Automatische Tests (navigator.webdriver) überspringen den Dialog, ausser sie testen ihn ausdrücklich */
function welcomeNeeded() { return !myName() && !(navigator.webdriver && !window.__hbWelcomeTest); }
function welcomeOpen(edit) {
  S.modal = 'welcome'; const m = $('#modal'); const room = !edit && isApp() && !S.camp;
  m.innerHTML = '<div class="dlg welcome" role="dialog" aria-modal="true" aria-label="' + (edit ? 'Dein Name' : 'Willkommen') + '"><h2>' + (edit ? 'Dein Name' : 'Willkommen im Heldenbuch') + '</h2>' +
    '<p class="hint">' + (edit ? 'So sehen dich die anderen am Tisch.' : 'Wie heisst du? So sehen dich die anderen am Tisch, z. B. „Lyra (Manu)“. Kein Konto, kein Passwort.') + '</p>' +
    '<label class="fld"><span>Dein Name</span><input type="text" id="wName" maxlength="24" autocomplete="nickname" value="' + esc(myName()) + '"></label>' +
    (room ? '<label class="fld"><span>Raumcode (falls du schon einen hast)</span><input type="text" id="wRoom" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="von deiner Spielleitung"></label>' : '') +
    (edit ? '' : '<p class="hint">Deine Helden bleiben auf diesem Gerät. Sichere sie ab und zu mit „Alles sichern“.</p>') +
    '<p class="cstat bad" id="wErr" hidden>Bitte gib deinen Namen ein.</p>' +
    '<div class="chips end">' + (edit ? '<button class="btn ghost" data-act="closeModal">Abbrechen</button>' : '') + '<button class="btn" data-act="welcomeGo">' + (edit ? 'Speichern' : 'Los geht’s') + '</button></div></div>';
  m.hidden = false; setTimeout(() => { const i = $('#wName'); if (i) i.focus(); }, 50);
}
XA.welcomeGo = () => {
  const inp = $('#wName'); const v = ((inp || {}).value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  if (!v) { $('#wErr').hidden = false; if (inp) inp.focus(); return; }
  setMyName(v); const room = (($('#wRoom') || {}).value || '').trim();
  S.modal = null; $('#modal').hidden = true;
  if (room) joinCamp(room); else { if (typeof queueMe === 'function') queueMe(); render(); }
};
XA.nameEdit = () => welcomeOpen(true);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && S.modal === 'welcome' && e.target && /^w(Name|Room)$/.test(e.target.id)) { e.preventDefault(); XA.welcomeGo(); } });
const myNameLine = () => (myName() ? '<p class="hint mename">Du bist am Tisch als <b>' + esc(myName()) + '</b> <button class="link" data-act="nameEdit">ändern</button></p>' : '<p class="hint mename"><button class="link" data-act="nameEdit">Deinen Namen eingeben</button>, damit die anderen wissen, wer du bist.</p>');
