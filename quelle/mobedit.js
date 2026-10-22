/* ---------- Eigene Monster: Editor im Bestiarium ----------
   Gespeichert in localStorage „hb_mobs“ (nur auf diesem Gerät, teilbar als Text). Schlüssel im Bestiarium: „u-<id>“.
   Format im BESTIARY wie gewohnt + Feld 9 { la, lr } für legendäre Aktionen/Widerstände; Aufladung wird aus dem Merkmalstext gelesen. */
const MOB_KEY = 'hb_mobs';
function ownMobs() { try { const l = JSON.parse(localStorage.getItem(MOB_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
function ownMobsStore(l) { try { localStorage.setItem(MOB_KEY, JSON.stringify(l)); } catch (e) { bannerToast('Nicht gespeichert', 'Der Speicher dieses Browsers ist nicht verfügbar.'); } }
const isOwnMob = (k) => /^u-/.test(k);
function ownMobInstall(o) {
  const k = 'u-' + o.id; BESTIARY[k] = [o.name, o.cr, +o.ac || 10, +o.hp || 1, o.hd || '', o.spd || '9 m', +o.ini || 0, (o.atks || []).filter((a) => a[0]).map((a) => [a[0], +a[1] || 0, a[2] || '1', a[3] || '']), o.txt || '', { la: +o.la || 0, lr: +o.lr || 0 }];
  MOB_HAB[k] = (o.hab && o.hab.length ? o.hab : ['wald']).join(' ');
  if (typeof _mfCache !== 'undefined') delete _mfCache[k];
}
function ownMobsLoad() { Object.keys(BESTIARY).filter(isOwnMob).forEach((k) => { delete BESTIARY[k]; delete MOB_HAB[k]; }); ownMobs().forEach(ownMobInstall); }
ownMobsLoad();

const CR_LIST = () => Object.keys(CR_XP).sort((a, b) => crNum(a) - crNum(b));
/* Richtwerte aus dem eigenen Bestiarium: RK, TP, bester Angriffsbonus je HG (Spanne der mittleren Hälfte). */
function crGuide(cr) {
  const n = crNum(cr); const near = Object.entries(BESTIARY).filter(([k, m]) => !isOwnMob(k) && Math.abs(crNum(m[1]) - n) <= (n < 1 ? 0 : n < 5 ? 0.5 : 1));
  if (near.length < 3) return '';
  const q = (arr) => { const s = arr.slice().sort((a, b) => a - b); const a = s[Math.floor((s.length - 1) * 0.25)], b = s[Math.ceil((s.length - 1) * 0.75)]; return a === b ? String(a) : a + '–' + b; };
  return 'Typisch für HG ' + cr + ' (aus ' + near.length + ' Kreaturen): RK ' + q(near.map((x) => x[1][2])) + ' · TP ' + q(near.map((x) => x[1][3])) + ' · Angriff ' + q(near.map((x) => Math.max(0, ...x[1][7].map((a) => a[1])))).replace(/(^|–)(\d)/g, '$1+$2');
}
const ME_BLANK = () => ({ id: '', name: '', cr: '1', ac: 13, hp: 30, hd: '', spd: '9 m', ini: 1, atks: [['', 4, '1W8+2', 'Hieb']], txt: '', hab: [S.mhab && S.mhab !== 'own' ? S.mhab : 'wald'], la: 0, lr: 0 });
function meGrab() {
  const D = S.me; if (!D || !$('#meName')) return D; const g = (id) => ($('#' + id) || {}).value;
  Object.assign(D, { name: g('meName').trim(), cr: g('meCr'), ac: +g('meAc') || 10, hp: +g('meHp') || 1, hd: (g('meHd') || '').trim(), spd: (g('meSpd') || '').trim(), ini: +g('meIni') || 0, txt: (g('meTxt') || '').trim(), la: +g('meLa') || 0, lr: +g('meLr') || 0 });
  D.atks = D.atks.map((a, i) => [(g('meAn' + i) || '').trim(), +g('meAb' + i) || 0, (g('meAd' + i) || '').trim(), (g('meAt' + i) || '').trim()]);
  return D;
}
function meModal() {
  const D = S.me; const m = $('#modal'); S.modal = 'mobedit';
  const num = (id, v, lbl, min, max) => field(lbl, '<input type="number" id="' + id + '" value="' + esc(v) + '"' + (min != null ? ' min="' + min + '"' : '') + (max != null ? ' max="' + max + '"' : '') + '>');
  const xp = CR_XP[D.cr] || 0; const rec = typeof mobRec === 'function' ? mobRec(D.cr).txt : '';
  m.innerHTML = '<div class="dlg medlg" role="dialog" aria-modal="true" aria-label="Eigenes Monster"><div class="dph"><h3>' + (D.id ? 'Monster bearbeiten' : 'Eigenes Monster') + '</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<div class="row">' + field('Name', '<input type="text" id="meName" value="' + esc(D.name) + '" placeholder="z. B. Moorhexe von Valdris" maxlength="60">') + field('Herausforderungsgrad', '<select id="meCr" data-me="cr">' + CR_LIST().map((c) => '<option value="' + c + '"' + (c === D.cr ? ' selected' : '') + '>HG ' + c + ' · ' + CR_XP[c] + ' EP</option>').join('') + '</select>') + '</div>' +
    '<p class="hint meguide">' + esc(crGuide(D.cr)) + (rec ? ' · Empfehlung: ' + esc(rec) : '') + '</p>' +
    '<div class="row me4">' + num('meAc', D.ac, 'RK', 1, 30) + num('meHp', D.hp, 'TP', 1, 999) + field('TP-Würfel', '<input type="text" id="meHd" value="' + esc(D.hd) + '" placeholder="z. B. 6W8+12">') + num('meIni', D.ini, 'Initiative', -5, 15) + '</div>' +
    field('Bewegung', '<input type="text" id="meSpd" value="' + esc(D.spd) + '" placeholder="z. B. 9 m, Fliegen 18 m">') +
    '<h4>Angriffe</h4><div class="meatks"><div class="meatk mehd" aria-hidden="true"><span>Name</span><span>Bonus</span><span>Schaden</span><span>Art</span><span></span></div>' + D.atks.map((a, i) => '<div class="meatk"><input type="text" id="meAn' + i + '" value="' + esc(a[0]) + '" placeholder="Name, z. B. Biss" aria-label="Angriff"><input type="number" id="meAb' + i + '" value="' + esc(a[1]) + '" aria-label="Angriffsbonus" title="Angriffsbonus"><input type="text" id="meAd' + i + '" value="' + esc(a[2]) + '" placeholder="1W8+2" aria-label="Schaden"><input type="text" id="meAt' + i + '" value="' + esc(a[3]) + '" placeholder="Hieb" aria-label="Schadensart"><button class="x" data-act="meAtkRm" data-arg="' + i + '" aria-label="Angriff entfernen">×</button></div>').join('') + '</div>' +
    '<div class="chips"><button class="btn sm ghost" data-act="meAtkAdd">+ Angriff</button></div>' +
    field('Merkmale', '<textarea id="meTxt" rows="3" placeholder="z. B. Mehrfachangriff: zwei Bisse. Sumpfodem (Aufladung 5–6): 4,5-m-Kegel, KON SG 13, 4W8 Gift.">' + esc(D.txt) + '</textarea>', 'Tipp: „Name (Aufladung 5–6): … KON SG 13, 4W8 Gift“ – dann gibt es im Kampf den ⚡-Knopf samt Rettungswurf.') +
    '<div class="row">' + num('meLa', D.la, 'Legendäre Aktionen pro Runde', 0, 5) + num('meLr', D.lr, 'Legendäre Widerstände pro Tag', 0, 5) + '</div>' +
    '<h4>Typische Fundorte</h4><div class="chips">' + Object.entries(HABITATS).map(([k, l]) => chip(D.hab.includes(k), l, 'data-act="meHab" data-arg="' + k + '"')).join('') + '</div>' +
    '<div class="chips end">' + (D.id ? '<button class="btn ghost" data-act="meDel" data-confirm="Dieses eigene Monster löschen? Gegner, die schon im Kampf stehen, bleiben.">Löschen</button>' : '') + '<button class="btn" data-act="meSave">Speichern</button></div></div>';
  m.hidden = false;
}
Object.assign(XA, {
  meNew: () => { S.me = ME_BLANK(); meModal(); },
  meEdit: (t, a) => { const o = ownMobs().find((x) => 'u-' + x.id === a); if (!o) return; S.me = JSON.parse(JSON.stringify(o)); if (!S.me.atks || !S.me.atks.length) S.me.atks = [['', 0, '', '']]; meModal(); },
  meCopy: (t, a) => { const M = BESTIARY[a]; if (!M) return; const F = M[9] || (typeof mobFeats === 'function' && mobFeats(a)) || {};
    S.me = { id: '', name: M[0].replace(/^✦\s*/, '') + ' (Variante)', cr: M[1], ac: M[2], hp: M[3], hd: M[4], spd: M[5], ini: M[6], atks: M[7].map((x) => x.slice()), txt: M[8], hab: mobHab(a).slice(), la: F.la || 0, lr: F.lr || 0 }; meModal(); },
  meAtkAdd: () => { meGrab(); S.me.atks.push(['', 0, '', '']); meModal(); const i = S.me.atks.length - 1; const el = $('#meAn' + i); if (el) el.focus(); },
  meAtkRm: (t, a) => { meGrab(); S.me.atks.splice(+a, 1); if (!S.me.atks.length) S.me.atks.push(['', 0, '', '']); meModal(); },
  meHab: (t, a) => { meGrab(); const h = S.me.hab; const i = h.indexOf(a); if (i >= 0) { if (h.length > 1) h.splice(i, 1); } else h.push(a); meModal(); },
  meSave: () => { const D = meGrab(); if (!D.name) { bannerToast('Name fehlt', 'Gib dem Monster einen Namen.'); const n = $('#meName'); if (n) n.focus(); return; }
    if (D.hd && !/^\d+W\d+([+−-]\d+)?$/.test(D.hd.replace(/\s/g, ''))) { bannerToast('TP-Würfel', 'Bitte im Format „6W8+12“ – oder leer lassen.'); return; }
    D.atks = D.atks.filter((a) => a[0]); if (!D.id) D.id = uidX(); const list = ownMobs(); const i = list.findIndex((x) => x.id === D.id); if (i >= 0) list[i] = D; else list.push(D);
    ownMobsStore(list); ownMobInstall(D); S.me = null; S.modal = null; $('#modal').hidden = true; bannerToast('Gespeichert', D.name + ' steht jetzt im Bestiarium, im Planer und bei der Zufallsbegegnung.'); render(); },
  meDel: () => { const D = S.me; if (!D || !D.id) return; ownMobsStore(ownMobs().filter((x) => x.id !== D.id)); delete BESTIARY['u-' + D.id]; delete MOB_HAB['u-' + D.id]; S.me = null; S.modal = null; $('#modal').hidden = true; render(); },
  meShare: () => { const m = $('#modal'); S.modal = 'mobshare'; const txt = JSON.stringify({ heldenbuchMonster: 1, mobs: ownMobs() });
    m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="Eigene Monster teilen"><div class="dph"><h3>Eigene Monster teilen</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div><p class="hint">Kopiere den Text und schicke ihn weiter – oder füge hier Monster-Text von jemand anderem ein und tippe „Übernehmen“. Gleiche Monster werden aktualisiert, nichts wird gelöscht.</p><textarea id="meJson" rows="7" spellcheck="false">' + esc(ownMobs().length ? txt : '') + '</textarea><div class="chips end"><button class="btn ghost" data-act="meCopyTxt">Kopieren</button><button class="btn" data-act="meImport">Übernehmen</button></div></div>';
    m.hidden = false; },
  meCopyTxt: () => { const t = $('#meJson'); if (!t) return; t.select(); try { (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => bannerToast('Kopiert', 'Der Monster-Text liegt in der Zwischenablage.'), () => document.execCommand('copy')); } catch (e) { document.execCommand('copy'); } },
  meImport: () => { let d; try { d = JSON.parse(($('#meJson') || {}).value || ''); } catch (e) { bannerToast('Text unlesbar', 'Das ist kein Monster-Text aus dem Heldenbuch.'); return; }
    const inc = (d && Array.isArray(d.mobs) ? d.mobs : []).filter((o) => o && o.id && o.name && CR_XP[o.cr]); if (!inc.length) { bannerToast('Keine Monster gefunden', 'Im Text steht kein gültiges Monster.'); return; }
    const list = ownMobs(); inc.forEach((o) => { const c = { id: String(o.id).slice(0, 20), name: String(o.name).slice(0, 60), cr: o.cr, ac: +o.ac || 10, hp: +o.hp || 1, hd: String(o.hd || ''), spd: String(o.spd || ''), ini: +o.ini || 0, atks: (o.atks || []).slice(0, 8).map((a) => [String(a[0] || ''), +a[1] || 0, String(a[2] || ''), String(a[3] || '')]), txt: String(o.txt || '').slice(0, 1500), hab: (o.hab || []).filter((h) => HABITATS[h]), la: +o.la || 0, lr: +o.lr || 0 };
      const i = list.findIndex((x) => x.id === c.id); if (i >= 0) list[i] = c; else list.push(c); });
    ownMobsStore(list); ownMobsLoad(); S.modal = null; $('#modal').hidden = true; bannerToast('Übernommen', inc.length + ' Monster im Bestiarium.'); render(); }
});
document.addEventListener('change', (ev) => { if (ev.target && ev.target.id === 'meCr' && S.me) { meGrab(); meModal(); } });

/* Werkzeugzeile am Ende jeder Bestiariumskarte (aus bestiaryView in monsters2.js aufgerufen) */
function mobTools(k) { return '<div class="chips mtools">' + (isOwnMob(k) ? '<span class="mown">eigenes Monster</span><button class="btn sm ghost" data-act="meEdit" data-arg="' + k + '">Bearbeiten</button>' : '') + '<button class="btn sm ghost" data-act="meCopy" data-arg="' + k + '">Als Vorlage für eigenes</button></div>'; }
