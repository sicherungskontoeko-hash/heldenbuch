/* Fablecrown Vault – Einbindung in die App (Stufe V2). Ohne eingerichteten Dienst vollständig inaktiv: kein Knopf,
   kein Netzverkehr. Der echte Dienst (V3) braucht eine gesonderte Freigabe; dann wird nur FC_VAULT_URL gesetzt.
   Für Tests: localStorage «hb_vault_dev» = http://127.0.0.1:<Port> (nur lokale Adressen werden angenommen).
   Gesichert werden Helden und Hausregeln (je Objekt verschlüsselt). Gerätezustand im Schlüssel «hb_vault»:
   Gerätezugang und Datenschlüssel, nie der Wiederherstellungsschlüssel. Nicht Teil von «Alles sichern». */
const FC_VAULT_URL = '';
const VAULT_URL = (() => { try { const d = localStorage.getItem('hb_vault_dev') || ''; return FC_VAULT_URL || (/^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/.test(d) ? d : ''); } catch (e) { return ''; } })();
let VLT = null, VLT_APPLY = false, VLT_REC = null, VLT_PAIR = null, VLT_HIST = null, VLT_MSG = '', VLT_CONF_SEEN = 0;
const VLT_TXT = { gesichert: 'Gesichert', wartet: 'Synchronisierung ausstehend', offline: 'Offline – lokale Änderungen', später: 'Synchronisierung ausstehend', gesperrt: 'Fehler – Gerät nicht mehr verbunden', konflikt: 'Konflikt', fehler: 'Fehler', bereit: 'Verbunden', aus: '' };
function vaultApi(base) { return async (m, path, x) => { x = x || {}; const h = { 'content-type': 'application/json' }; if (x.auth) h.authorization = 'FCV ' + x.auth.did + ':' + x.auth.tok;
  /* FC68-10: keine hängende Anfrage – nach 20 s abbrechen (gilt als offline; Wiederholung sendet dieselbe Version) */
  const ac = typeof AbortController === 'function' ? new AbortController() : null; const to = ac ? setTimeout(() => ac.abort(), 20000) : 0;
  let r; try { r = await fetch(base + path, { method: m, headers: h, cache: 'no-store', referrerPolicy: 'no-referrer', signal: ac ? ac.signal : undefined, body: m === 'GET' || m === 'DELETE' ? undefined : JSON.stringify(x.body || {}) }); } finally { clearTimeout(to); }
  let body = null; try { body = await r.json(); } catch (e) {} return { status: r.status, body }; }; }
function vaultStore() { return { load: () => { try { return JSON.parse(localStorage.getItem('hb_vault') || 'null'); } catch (e) { return null; } }, save: (s) => { const v = s ? JSON.stringify(s) : null; if (v) localStorage.setItem('hb_vault', v); else localStorage.removeItem('hb_vault'); if (localStorage.getItem('hb_vault') !== v) throw new Error('Vault-Zustand liess sich auf diesem Gerät nicht speichern (Speicher voll?).'); } }; } /* FC68-04: Fehler werden gemeldet, nicht verschluckt */
function vaultRead(kind, id) { if (kind === 'c') return S.broken && S.broken.has(id) ? undefined : S.chars[id]; if (kind === 'h') return S.hb[id]; return undefined; }
function vaultValidate(kind, d) { try { if (kind === 'c') { if (!nvPlain(d)) return 'kein Heldenobjekt'; const e = charShapeErrors(d).concat(validateChar(d)); return e.length ? String(e[0]) : null; } if (kind === 'h') return validHb(d) || null; } catch (e) { return 'nicht lesbar'; } return 'unbekannte Art'; }
function vaultApply(kind, id, d) {
  if (typeof id !== 'string' || nvProto(id)) return false; VLT_APPLY = true;
  const had = kind === 'c' ? Object.prototype.hasOwnProperty.call(S.chars, id) : Object.prototype.hasOwnProperty.call(S.hb, id); const prev = kind === 'c' ? S.chars[id] : S.hb[id];
  try {
    if (kind === 'c') { if (d === null) { delete S.chars[id]; if (S.cur === id) { S.cur = Object.keys(S.chars)[0] || null; if (!S.cur && (S.view === 'sheet' || S.view === 'build')) S.view = 'heroes'; } }
      else { if (vaultValidate('c', d)) return false; let n; try { n = normChar(JSON.parse(JSON.stringify(d))); } catch (e) { return false; } n.id = id; S.chars[id] = n; } persist('c', id); }
    else if (kind === 'h') { if (d === null) delete S.hb[id]; else { if (validHb(d)) return false; S.hb[id] = JSON.parse(JSON.stringify(d)); } persist('h', id); }
    else return false;
    /* FC68-04: nur als übernommen melden, wenn der lokale Speicher es dauerhaft hat; sonst alten Stand zurück */
    if (S.saveErr) { const box = kind === 'c' ? S.chars : S.hb; if (had) box[id] = prev; else delete box[id]; return false; }
  } finally { VLT_APPLY = false; }
  later('vaultRender', 120, () => { const a = document.activeElement; if (!(a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(button|checkbox|radio|range|file)$/.test(a.type))))) render(); });
  return true;
}
/* FC68-09: «Beide behalten» für Helden und Hausregeln; true nur bei dauerhaft gespeicherter Kopie */
function vaultCopy(kind, d) { if (vaultValidate(kind, d)) return false;
  if (kind === 'c') { const n = normChar(JSON.parse(JSON.stringify(d))); n.id = freshId(); n.name = String(n.name || 'Held').slice(0, 50) + ' (anderes Gerät)'; S.chars[n.id] = n; persist('c', n.id); if (S.saveErr) { delete S.chars[n.id]; return false; } return true; }
  if (kind === 'h') { const h = JSON.parse(JSON.stringify(d)); let nid; do { nid = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); } while (S.hb[nid]); h.id = nid; h.name = String(h.name || 'Hausregel').slice(0, 45) + ' (anderes Gerät)'; if (validHb(h)) return false; S.hb[nid] = h; persist('h', nid); if (S.saveErr) { delete S.hb[nid]; return false; } return true; }
  return false; }
function vaultList() { return Object.keys(S.chars).filter((i) => !(S.broken && S.broken.has(i))).map((i) => ['c', i]).concat(Object.keys(S.hb).map((i) => ['h', i])); }
function vaultInit() {
  if (!VAULT_URL || VLT || typeof FcVault === 'undefined' || !FcVault.Vault) return;
  VLT = new FcVault.Vault({ api: vaultApi(VAULT_URL), debounce: 8000, store: vaultStore(), read: vaultRead, apply: vaultApply, validate: vaultValidate, list: vaultList, copy: vaultCopy, onStatus: vaultPaint });
  if (!VLT.load()) return; VLT.set('wartet');
  setTimeout(() => { vaultSync(); }, 1500);
  window.addEventListener('online', () => vaultSync());
  document.addEventListener('visibilitychange', () => { if (VLT && VLT.on && document.visibilityState === 'visible') vaultSync(); });
}
async function vaultSync() { if (!VLT || !VLT.on) return; try { await VLT.sync(); } catch (e) { VLT.set('fehler'); } vaultPaint(); }
function vaultMark(kind, id) { if (!VLT || VLT_APPLY || !VLT.on) return; try { VLT.mark(kind, id); } catch (e) { VLT.set('fehler'); } }
function vaultOn() { return !!(VLT && VLT.on); }
function vaultLabel() { if (!vaultOn()) return ''; const s = VLT.status; return s === 'offline' && !VLT.st.dirty.length ? 'Offline' : VLT_TXT[s] || s; }
function vaultSaveTxt() { return vaultOn() ? ' · Vault: ' + vaultLabel() : ''; }
function vaultPaint() {
  if (typeof paintSave === 'function') try { paintSave(); } catch (e) {}
  const b = document.querySelector('[data-act="vOpen"]'); if (b) { b.textContent = vaultOn() ? 'Vault: ' + vaultLabel() : 'Vault …'; b.className = 'btn ghost vstat' + (vaultOn() ? ' v-' + VLT.status : ''); }
  if (vaultOn() && VLT.st.conf.length > VLT_CONF_SEEN) { VLT_CONF_SEEN = VLT.st.conf.length; bannerToast('Vault: Konflikt', 'Ein Held wurde auf zwei Geräten verschieden geändert. Beide Stände sind erhalten – unter «Deine Helden» › Vault entscheiden.'); }
  if (S.modal === 'vault') vaultModal(true);
}
function vaultBtn() { if (!VLT) return ''; return '<button class="btn ghost vstat' + (vaultOn() ? ' v-' + esc(VLT.status) : '') + '" data-act="vOpen" title="Verschlüsselte Sicherung und Gerätewechsel">' + (vaultOn() ? 'Vault: ' + esc(vaultLabel()) : 'Vault …') + '</button>'; }
const vTime = (t) => (t ? new Date(t).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–');
const vDevGuess = () => (/Android|iPhone/i.test(navigator.userAgent) ? (Math.min(screen.width, screen.height) >= 600 ? 'Tablet' : 'Handy') : /iPad/i.test(navigator.userAgent) ? 'Tablet' : 'PC');
function vSum(c) { if (!c) return 'gelöscht'; return esc(c.name || 'Held') + ' · Stufe ' + esc(c.level || 1) + (c.play && typeof c.play.hp === 'number' ? ' · TP ' + esc(c.play.hp) : '') + ' · ' + esc((c.inv || []).length) + ' Gegenstände'; }
function vaultModal(keep) {
  const m = $('#modal'); if (!m) return; S.modal = 'vault'; const host = (() => { try { return new URL(VAULT_URL).host; } catch (e) { return VAULT_URL; } })();
  let h = '<div class="dlg stdlg vdlg" role="dialog" aria-modal="true" aria-label="Fablecrown Vault"><div class="dph"><b>Fablecrown Vault</b><button class="x" data-act="vClose" aria-label="Schliessen">×</button></div>';
  if (VLT_MSG) h += '<p class="hint warn" role="status">' + esc(VLT_MSG) + '</p>';
  if (VLT_REC) {
    h += '<p><b>Dein Wiederherstellungsschlüssel</b> – nur jetzt sichtbar:</p><p class="vkey" translate="no">' + esc(VLT_REC) + '</p>' +
      '<p class="hint">Schreib ihn auf oder speichere ihn in einem Passwortmanager. Damit stellst du deine Helden auf einem neuen Gerät wieder her, auch wenn alle anderen Geräte weg sind. Ohne Schlüssel und ohne verbundenes Gerät ist die Vault-Sicherung verloren – niemand (auch nicht Fablecrown) kann sie öffnen. Deine lokalen Daten und Dateisicherungen bleiben davon unberührt. Den Schlüssel nie im Chat oder am Spieltisch teilen.</p>' +
      '<div class="chips end"><button class="btn ghost" data-act="vCopyKey">Kopieren</button><button class="btn" data-act="vKeyDone">Ich habe ihn sicher aufbewahrt</button></div></div>';
    m.innerHTML = h; m.hidden = false; return;
  }
  if (!vaultOn()) {
    h += '<p class="hint">Sichert deine Helden und Hausregeln verschlüsselt beim Dienst <b>' + esc(host) + '</b>, damit du abwechselnd auf Handy, Tablet und PC spielen kannst. Ohne Konto, ohne E-Mail. Verschlüsselt wird auf diesem Gerät; der Dienst sieht weder Namen noch Werte noch Notizen. Fablecrown funktioniert ohne Vault genauso weiter.</p>' +
      '<p class="hint">Noch nicht im Vault: eigene Monster, Begegnungen, SL-Notizen, Abenteuer, Bilder – dafür weiter «Alles sichern».</p>' +
      '<label class="fld"><span>Name dieses Geräts</span><input id="vName" maxlength="40" value="' + esc(vDevGuess()) + '" autocomplete="off"></label>' +
      '<div class="chips end"><button class="btn" data-act="vCreate">Vault aktivieren</button></div>' +
      '<h3>Schon einen Vault?</h3><p class="hint">Kopplungscode vom anderen Gerät (10 Minuten gültig) oder deinen Wiederherstellungsschlüssel eingeben. Vorher wird hier eine Sicherung deiner lokalen Helden angelegt; nichts wird ersetzt – gleiche Helden mit anderem Stand erscheinen als Konflikt.</p>' +
      '<div class="chradd"><input id="vCode" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX"><button class="btn sm" data-act="vJoin">Verbinden</button></div></div>';
    m.innerHTML = h; m.hidden = false; return;
  }
  const st = VLT.st;
  h += '<p><b>Status:</b> ' + esc(vaultLabel()) + ' · zuletzt vollständig gesichert: ' + esc(vTime(st.ok)) + (st.dirty.length ? ' · ' + st.dirty.length + ' Änderung(en) ausstehend' : '') + '</p>' +
    '<div class="chips"><button class="btn" data-act="vSyncNow">Jetzt synchronisieren</button><button class="btn ghost" data-act="vPair">Weiteres Gerät verbinden</button></div>' +
    '<p class="hint">Vor dem Gerätewechsel «Jetzt synchronisieren» tippen. Ein gerade geschlossenes App-Fenster sichert nicht zuverlässig im Hintergrund – beim nächsten Öffnen holt die App das nach.</p>';
  if (VLT_PAIR) h += '<p><b>Kopplungscode</b> (einmal verwendbar, gültig bis ' + esc(vTime(VLT_PAIR.exp)) + '):</p><p class="vkey" translate="no">' + esc(VLT_PAIR.code) + '</p><p class="hint">Auf dem anderen Gerät: Deine Helden › Vault › «Schon einen Vault?» und den Code eingeben.</p>';
  if (st.conf.length) h += '<h3>Konflikte</h3>' + st.conf.map((c) => '<div class="vconf"><p><b>' + esc((c.mine && c.mine.name) || (c.theirs && c.theirs.name) || 'Held') + '</b> wurde auf zwei Geräten verschieden geändert (' + esc(vTime(c.at)) + ').</p><p class="hint">Dieses Gerät: ' + vSum(c.mine) + '<br>Anderes Gerät: ' + vSum(c.theirs) + '</p><div class="chips">' +
    '<button class="btn sm" data-act="vRes" data-arg="' + esc(c.oid) + '|mine">Dieses Gerät gilt</button><button class="btn sm ghost" data-act="vRes" data-arg="' + esc(c.oid) + '|theirs" data-confirm="Stand des anderen Geräts übernehmen? Der Stand auf diesem Gerät wird ersetzt.">Anderes Gerät gilt</button>' +
    (c.theirs && c.mine && (c.kind === 'c' || c.kind === 'h') ? '<button class="btn sm ghost" data-act="vRes" data-arg="' + esc(c.oid) + '|both">Beide behalten</button>' : '') + '</div></div>').join('');
  if (VLT.bad.length) h += '<p class="hint warn">' + VLT.bad.length + ' Eintrag/Einträge beim Dienst nicht übernommen (beschädigt, zu gross oder ungültig). Deine lokalen Daten sind unverändert.</p>';
  const ids = Object.keys(S.chars);
  if (ids.length) h += '<h3>Frühere Stände</h3><div class="chips">' + ids.map((i) => '<button class="btn sm ghost" data-act="vHist" data-arg="' + esc(i) + '">' + esc(S.chars[i].name || 'Held') + '</button>').join('') + '</div>' +
    (VLT_HIST ? (VLT_HIST.list && VLT_HIST.list.length ? '<ul class="stl">' + VLT_HIST.list.map((x) => '<li><time>' + esc(vTime(x.at)) + '</time><span>' + (x.bad ? 'unlesbar' : x.del ? 'gelöscht' : vSum(x.data)) + '</span>' + (x.bad || x.del ? '' : ' <button class="btn sm ghost" data-act="vRestore" data-arg="' + esc(VLT_HIST.id) + '|' + esc(x.rev) + '" data-confirm="Diesen früheren Stand zurückholen? Er wird als neuer Stand gesichert; der jetzige bleibt im Verlauf.">Zurückholen</button>') + '</li>').join('') + '</ul>' : '<p class="hint">Keine früheren Stände (oder offline).</p>') : '');
  h += '<h3>Geräte</h3><div id="vDevs">' + (VLT_DEVS ? VLT_DEVS.map((d) => '<p>' + esc(d.name) + (d.me ? ' <small>(dieses Gerät)</small>' : '') + ' <small>zuletzt ' + esc(vTime(d.seen)) + '</small>' + (d.me ? '' : ' <button class="btn sm ghost" data-act="vRevoke" data-arg="' + esc(d.did) + '" data-confirm="Gerät «' + esc(d.name) + '» entfernen? Es kann danach nicht mehr synchronisieren. Bereits dort gespeicherte Daten werden dadurch nicht gelöscht.">Entfernen</button>') + '</p>').join('') : '<button class="btn sm ghost" data-act="vDevs">Geräte anzeigen</button>') + '</div>' +
    '<h3>Beenden</h3><div class="chips"><button class="btn sm ghost" data-act="vLeave" data-confirm="Dieses Gerät vom Vault trennen? Deine Helden bleiben auf diesem Gerät, der Vault und andere Geräte bleiben bestehen.">Dieses Gerät entkoppeln</button></div>' +
    '<p class="hint">Vault-Daten beim Dienst endgültig löschen (alle Geräte, alle früheren Stände; lokale Daten bleiben): «LÖSCHEN» eintippen.</p><div class="chradd"><input id="vDel" maxlength="10" autocomplete="off" placeholder="LÖSCHEN"><button class="btn sm ghost" data-act="vDestroy">Endgültig löschen</button></div></div>';
  const y = m.querySelector('.vdlg') ? m.querySelector('.vdlg').scrollTop : 0; m.innerHTML = h; m.hidden = false; if (keep) { const d = m.querySelector('.vdlg'); if (d) d.scrollTop = y; }
}
let VLT_DEVS = null;
async function vRun(fn) { VLT_MSG = ''; try { await fn(); } catch (e) { VLT_MSG = (e && e.message) || 'Das hat nicht geklappt.'; } vaultPaint(); vaultModal(true); }
Object.assign(XA, {
  vOpen: () => { VLT_MSG = ''; VLT_HIST = null; VLT_DEVS = null; vaultModal(); },
  vClose: () => { VLT_REC = null; VLT_PAIR = null; S.modal = null; $('#modal').hidden = true; },
  vCreate: () => vRun(async () => { const n = ($('#vName') || {}).value || vDevGuess(); VLT_REC = await VLT.create(n); vaultSync(); }),
  vCopyKey: async (t) => { const ok = VLT_REC && typeof slCopy === 'function' ? await slCopy(VLT_REC) : false; if (t) t.textContent = ok ? 'Kopiert ✓' : 'Kopieren ging nicht'; },
  vKeyDone: () => { VLT_REC = null; vaultModal(); },
  vJoin: () => vRun(async () => { const code = (($('#vCode') || {}).value || '').trim(); FcVault.parseRecovery(code);
    try { localStorage.setItem('hb_vault_vorher', exportData(Object.values(S.chars), true)); } catch (e) { throw new Error('Vorher-Sicherung nicht möglich (Speicher voll?) – zuerst «Alles sichern».'); }
    await VLT.connect(code, vDevGuess()); }),
  vSyncNow: () => vRun(async () => { await VLT.sync(); if (VLT.status === 'offline') throw new Error('Keine Verbindung – deine Änderungen bleiben auf diesem Gerät und werden später gesichert.'); }),
  vPair: () => vRun(async () => { VLT_PAIR = await VLT.pair(); }),
  vRes: (t, arg) => vRun(async () => { const [oid, how] = String(arg).split('|'); await VLT.resolve(oid, how); render(); }),
  vHist: (t, id) => vRun(async () => { VLT_HIST = { id, list: await VLT.history('c', id) }; }),
  vRestore: (t, arg) => vRun(async () => { const [id, rev] = String(arg).split('|'); if (!(await VLT.restore('c', id, +rev))) throw new Error('Dieser Stand liess sich nicht zurückholen.'); VLT_HIST = null; render(); }),
  vDevs: () => vRun(async () => { VLT_DEVS = await VLT.devices(); if (!VLT_DEVS) throw new Error('Geräteliste nicht erreichbar.'); }),
  vRevoke: (t, did) => vRun(async () => { if (!(await VLT.revoke(did))) throw new Error('Entfernen fehlgeschlagen.'); VLT_DEVS = await VLT.devices(); }),
  vLeave: () => vRun(async () => { await VLT.leave(); VLT_DEVS = null; render(); }),
  vDestroy: () => vRun(async () => { if ((($('#vDel') || {}).value || '').trim().toUpperCase() !== 'LÖSCHEN') throw new Error('Zum Löschen «LÖSCHEN» eintippen.'); if (!(await VLT.destroy())) throw new Error('Löschen beim Dienst fehlgeschlagen – nichts verändert.'); VLT_DEVS = null; render(); })
});
