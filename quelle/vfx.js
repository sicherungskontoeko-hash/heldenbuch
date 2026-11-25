/* ---------- Effekte: Einstellungen, Leistung und Budget (Visual Effects 2.0, Schritt 1) ----------
   Gespeichert nur auf diesem Gerät unter hb_vfx (JSON), nie im Netz.
   Ältere Schalter bleiben gültig und werden mitgeschrieben, damit ältere Teile (CSS data-fx) und alte Versionen weiter passen:
     hb_dice_fx voll/ruhig/aus → Würfel normal/aus/aus und natürliche 20/1 intensiv/dezent/aus (andere Mischungen: «eigen»)
     hb_fx stark/dezent/aus     → Hintergrund intensiv/dezent/aus
     hb_dice_snd 1/0            → Würfelgeräusche an/aus
   Ändert jemand einen alten Schalter (alte Version, anderer Tab), wird nur dieser Teil übernommen.
   Präsentation ändert nie Würfelergebnisse: sichtbarer Zufall kommt aus vrand(), nicht aus rnd(). */
const VFX_DEF = Object.freeze({ profile: 'auto', roll: 'normal', critical: 'dezent', damage: 'dezent', status: 'dezent', background: 'dezent', menu: true, diceSound: false, eventSound: false, ambience: false, haptics: false });
const VFX_LV = ['aus', 'dezent', 'intensiv'];
const VFX_OK = { profile: ['auto', 'eco', 'balanced', 'max'], roll: ['normal', 'kurz', 'aus'], critical: VFX_LV, damage: VFX_LV, status: VFX_LV, background: VFX_LV };
const VFX_DF = { voll: { roll: 'normal', critical: 'intensiv' }, ruhig: { roll: 'aus', critical: 'dezent' }, aus: { roll: 'aus', critical: 'aus' } };
const VFX_BF = { stark: 'intensiv', dezent: 'dezent', aus: 'aus' };
const vrand = () => (typeof NATIVE_RANDOM === 'function' ? NATIVE_RANDOM() : Math.random());
const VFX_RT = { busy: 0, busyT: 0, autoTier: '', bad: 0, good: 0, cache: null, key: '' };
const vfxGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const vfxPut = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
function vfxClean(o) {
  const s = Object.assign({}, VFX_DEF);
  for (const [k, list] of Object.entries(VFX_OK)) if (o && list.includes(o[k])) s[k] = o[k];
  s.diceSound = !!(o && o.diceSound === true); s.eventSound = !!(o && o.eventSound === true); s.ambience = !!(o && o.ambience === true); s.haptics = !!(o && o.haptics === true); s.menu = !(o && o.menu === false);
  return s;
}
/* alte Schalter aus den neuen Einstellungen */
/* passt keine alte Stufe genau (z. B. Würfel normal mit dezenten Effekten), steht «eigen»: so erkennt vfxLoad jede spätere Änderung am alten Schalter */
const vfxLegacy = (s) => ({ df: Object.keys(VFX_DF).find((k) => VFX_DF[k].roll === s.roll && VFX_DF[k].critical === s.critical) || 'eigen', bf: { intensiv: 'stark', dezent: 'dezent', aus: 'aus' }[s.background], sn: s.diceSound ? '1' : '0' });
function vfxSave(s) {
  const l = vfxLegacy(s); const o = Object.assign({}, s, { _l: l });
  vfxPut('hb_vfx', JSON.stringify(o)); vfxPut('hb_dice_fx', l.df); vfxPut('hb_fx', l.bf); vfxPut('hb_dice_snd', l.sn);
  VFX_RT.cache = null;
}
function vfxLoad() {
  const raw = vfxGet('hb_vfx'), df = vfxGet('hb_dice_fx'), bf = vfxGet('hb_fx'), sn = vfxGet('hb_dice_snd');
  const key = [raw, df, bf, sn].join('|'); if (VFX_RT.cache && VFX_RT.key === key) return VFX_RT.cache;
  let o = null; try { o = JSON.parse(raw || 'null'); } catch (e) { o = null; }
  const seen = o && typeof o === 'object' && o._l && typeof o._l === 'object' ? o._l : {};
  const s = vfxClean(o && typeof o === 'object' ? o : {});
  let changed = !o || typeof o !== 'object';
  if (df && df !== seen.df && VFX_DF[df]) { Object.assign(s, VFX_DF[df]); changed = true; }
  if (bf && bf !== seen.bf && VFX_BF[bf]) { s.background = VFX_BF[bf]; changed = true; }
  if (sn && sn !== seen.sn && (sn === '1' || sn === '0')) { s.diceSound = sn === '1'; changed = true; }
  /* Schaden und Ereignisse (seit Schritt 2): wer den Hintergrund ausgeschaltet hatte, bekommt sie auch aus */
  if (!o || typeof o !== 'object' || !('damage' in o)) { s.damage = s.status = s.background === 'aus' ? 'aus' : 'dezent'; changed = true; }
  if (changed) vfxSave(s);
  VFX_RT.cache = Object.freeze(s); VFX_RT.key = changed ? [vfxGet('hb_vfx'), vfxGet('hb_dice_fx'), vfxGet('hb_fx'), vfxGet('hb_dice_snd')].join('|') : key; return VFX_RT.cache;
}
function vfxSet(k, v) {
  const s = Object.assign({}, vfxLoad());
  if (k === 'level') { s.critical = v; s.damage = v; s.status = v; s.background = v; } else s[k] = v;
  const c = vfxClean(s); vfxSave(c);
  if (k === 'haptics' && !c.haptics) { try { navigator.vibrate && navigator.vibrate(0); } catch (e) {} }
  if (k === 'profile') { VFX_RT.bad = VFX_RT.good = 0; }
  if (typeof applyFxLevel === 'function') applyFxLevel(); if (typeof vfxUiApply === 'function') vfxUiApply();
  if ((k === 'background' || k === 'level' || k === 'profile') && typeof startFx === 'function') startFx();
  if (k === 'ambience' && typeof tonAmbSync === 'function') tonAmbSync();
  return c;
}
/* Leistungsstufe: Auto beginnt nach Gerät und senkt nur bei gemessener Überlast */
function vfxWeak() { try { return (navigator.hardwareConcurrency || 8) <= 4 && (navigator.deviceMemory || 8) <= 3; } catch (e) { return false; } }
function vfxTier() {
  const p = vfxLoad().profile; if (p !== 'auto') return p;
  if (!VFX_RT.autoTier) { const st = vfxGet('hb_vfx_auto'); VFX_RT.autoTier = st === 'eco' || st === 'balanced' ? st : vfxWeak() ? 'eco' : 'balanced'; }
  return VFX_RT.autoTier;
}
function vfxReduce() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
/* wirksame Stufe einer Effektart: reduzierte Bewegung schaltet aus, Energiesparend begrenzt auf Dezent und ohne Hintergrund */
function vfxLevel(k) {
  if (vfxReduce()) return 'aus';
  const s = vfxLoad(); let i = VFX_LV.indexOf(s[k]); if (i < 0) i = 1;
  if (vfxTier() === 'eco') { if (k === 'background') return 'aus'; i = Math.min(i, 1); }
  return VFX_LV[i];
}
/* Dauer der Würfelbewegung in ms (0 = sofort das Ergebnis) */
function vfxRollMs() { const s = vfxLoad(); if (vfxReduce() || s.roll === 'aus') return 0; return s.roll === 'kurz' || vfxTier() === 'eco' ? 300 : 850; }
/* Zeichenabstand des Hintergrunds in ms */
function vfxBgDt(mobile) { return vfxTier() === 'max' ? (mobile ? 33 : 16) : mobile ? 48 : 31; }
/* Vordergrund läuft (Würfel, grosser Effekt): Hintergrund pausiert und läuft danach von selbst weiter */
function vfxBusy(d) {
  VFX_RT.busy = Math.max(0, VFX_RT.busy + d); clearTimeout(VFX_RT.busyT);
  if (VFX_RT.busy) VFX_RT.busyT = setTimeout(() => { VFX_RT.busy = 0; }, 4000); /* Sicherung, falls ein Ende verloren geht */
}
/* Messung nur aus laufenden Würfel-Animationen (ungedrosselt), nie im Leerlauf oder versteckt.
   Zwei schlechte Würfe (p90 > 40 ms) senken, sechs gute (≤ 20 ms) heben wieder an; Auto bleibt höchstens «Ausgewogen». */
function vfxSample(p90) {
  if (vfxLoad().profile !== 'auto' || document.hidden || !Number.isFinite(p90) || p90 <= 0) return;
  if (navigator.webdriver && !VFX_RT.govForce) return; /* automatische Tests: feste Stufe, damit sie nicht vom Rechner abhängen */
  const t = vfxTier();
  if (p90 > 40) { VFX_RT.bad++; VFX_RT.good = 0; } else if (p90 <= 20) { VFX_RT.good++; VFX_RT.bad = 0; } else { VFX_RT.bad = VFX_RT.good = 0; }
  let n = t;
  if (VFX_RT.bad >= 2 && t === 'balanced') n = 'eco'; else if (VFX_RT.good >= 6 && t === 'eco') n = 'balanced';
  if (n !== t) { VFX_RT.autoTier = n; VFX_RT.bad = VFX_RT.good = 0; vfxPut('hb_vfx_auto', n); if (typeof applyFxLevel === 'function') applyFxLevel(); if (typeof startFx === 'function') startFx(); }
  else if (VFX_RT.bad >= 2 || VFX_RT.good >= 6) VFX_RT.bad = VFX_RT.good = 0;
}
/* Vibration nur mit Einwilligung, bei sichtbarer Seite, ein Muster auf einmal */
const VFX_HAPTIC = { land: [12], n20: [30, 45, 55], n1: [28], damage: [18], turn: [12, 35, 12], levelup: [20, 45, 20, 45, 40], call: [90, 50, 90] };
function vfxVibrate(kind) {
  if (!vfxLoad().haptics || document.hidden) return false;
  try { if (!navigator.vibrate) return false; return navigator.vibrate(VFX_HAPTIC[kind] || [12]); } catch (e) { return false; }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { try { navigator.vibrate && navigator.vibrate(0); } catch (e) {} VFX_RT.busy = 0; } });

/* ---------- Einstellungen im Fenster «Stimmung» ---------- */
function vfxBlock() {
  const s = vfxLoad(); const red = vfxReduce(); const t = vfxTier();
  const row = (label, key, opts, cur) => '<div class="fxlv"><span>' + label + '</span>' + opts.map(([v, l]) => chip(cur === v, l, 'data-act="vfx" data-arg="' + esc(key + ':' + v) + '"')).join('') + '</div>';
  const lv = [['aus', 'Aus'], ['dezent', 'Dezent'], ['intensiv', 'Intensiv']];
  const both = s.critical === s.background && s.damage === s.background && s.status === s.background ? s.critical : '';
  const tierName = { eco: 'Energiesparend', balanced: 'Ausgewogen', max: 'Maximal' };
  const canVib = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  return '<div class="vfxb">' +
    row('Effekte:', 'level', lv, both) +
    row('Würfel:', 'roll', [['normal', 'Normal'], ['kurz', 'Kurz'], ['aus', 'Aus']], s.roll) +
    (red ? '<p class="hint vfxred">Dein Gerät wünscht weniger Bewegung: bewegte Effekte und rollende Würfel bleiben aus.</p>' : '') +
    '<details class="vfxmore" id="vfxMore"' + (S.vfxMore ? ' open' : '') + '><summary>Details</summary>' +
    row('Leistung:', 'profile', [['auto', 'Auto'], ['eco', 'Energiesparend'], ['balanced', 'Ausgewogen'], ['max', 'Maximal']], s.profile) +
    (s.profile === 'auto' ? '<p class="hint vfxtier">Auto wählt gerade «' + tierName[t] + '».</p>' : '') +
    row('Natürliche 20 und 1:', 'critical', lv, s.critical) +
    row('Schaden und Heilung:', 'damage', lv, s.damage) +
    row('Zug, Rast, Stufe, Zustände:', 'status', lv, s.status) +
    row('Hintergrund:', 'background', lv, s.background) +
    row('Bedien-Animationen:', 'menu', [['aus', 'Aus'], ['an', 'An']], s.menu ? 'an' : 'aus') +
    row('Würfelgeräusche:', 'diceSound', [['aus', 'Aus'], ['an', 'An']], s.diceSound ? 'an' : 'aus') +
    (s.diceSound ? '<div class="fxlv"><span>Lautstärke:</span><input type="range" min="0" max="1" step="0.05" value="' + esc(typeof d3vol === 'function' ? d3vol() : 0.6) + '" id="d3vol" aria-label="Lautstärke der Würfelgeräusche"></div>' : '') +
    row('Spielgeräusche:', 'eventSound', [['aus', 'Aus'], ['an', 'An']], s.eventSound ? 'an' : 'aus') +
    row('Hintergrundgeräusche:', 'ambience', [['aus', 'Aus'], ['an', 'An']], s.ambience ? 'an' : 'aus') +
    (s.ambience ? '<div class="fxlv"><span>Lautstärke Hintergrund:</span><input type="range" min="0" max="1" step="0.05" value="' + esc(typeof tonAmbVol === 'function' ? tonAmbVol() : 0.35) + '" id="ambvol" aria-label="Lautstärke der Hintergrundgeräusche"></div>' : '') +
    (canVib ? row('Vibration:', 'haptics', [['aus', 'Aus'], ['an', 'An']], s.haptics ? 'an' : 'aus') : '<p class="hint">Vibration: von diesem Gerät nicht unterstützt.</p>') +
    '</details></div>';
}
XA.vfx = (t, a) => {
  const i = String(a).indexOf(':'); if (i < 0) return; const k = a.slice(0, i); let v = a.slice(i + 1);
  const BOOL = ['diceSound', 'eventSound', 'ambience', 'haptics', 'menu']; if (BOOL.includes(k)) v = v === 'an';
  if (k !== 'level' && !BOOL.includes(k) && !(VFX_OK[k] || []).includes(v)) return;
  if (k === 'level' && !VFX_LV.includes(v)) return;
  vfxSet(k, v);
  if (k === 'diceSound' && v && typeof d3ac === 'function') { d3ac(); if (typeof d3snd === 'function') d3snd('land'); }
  if (k === 'haptics' && v) vfxVibrate('land');
  if (k === 'eventSound' && v && typeof tonEvent === 'function') tonEvent('heal');
  if (S.modal === 'theme' && typeof openThemeModal === 'function') openThemeModal(); else if (S.modal === 'dice' && typeof diceModal === 'function') diceModal(); else render();
};
document.addEventListener('toggle', (ev) => { if (ev.target && ev.target.id === 'vfxMore') S.vfxMore = ev.target.open; if (ev.target && ev.target.id === 'vfxMoreDice') S.vfxMoreDice = ev.target.open; }, true);
/* Systemeinstellung «weniger Bewegung» ändert sich zur Laufzeit: sofort übernehmen */
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { VFX_RT.cache = null; if (typeof applyFxLevel === 'function') applyFxLevel(); if (typeof vfxUiApply === 'function') vfxUiApply(); if (typeof startFx === 'function') startFx(); }); } catch (e) {}
