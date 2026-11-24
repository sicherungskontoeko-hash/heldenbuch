/* ---------- Ton für Spielereignisse und Hintergrundgeräusche (Effekte 2.0, Schritt 3) ----------
   Eigene Schalter, beide standardmässig aus: «Spielgeräusche» (Schaden, Heilung, Rast, Stufenaufstieg) und
   «Hintergrundgeräusche» (je Stimmung, nur Rauschen, Filter und Oszillatoren, keine Dateien).
   Gleicher AudioContext und Begrenzer wie die Würfel (dice3d.js), erst nach einer Berührung, stumm bei verstecktem Tab.
   Würfe der Spielleitung im Geheimen erzeugen bei anderen keinen Ton (es werden nur eigene Ereignisse vertont). */
function tonEvent(kind, o) {
  if (typeof vfxLoad !== 'function' || !vfxLoad().eventSound || document.hidden) return;
  if (typeof tonAc !== 'function' || d3vol() <= 0) return; const ac = tonAc(); if (!ac) return; const t = ac.currentTime + 0.01; const v = d3vol() * 0.42;
  if (kind === 'damage') { d3tone(ac, t, 150, 55, 0.22, v, 'triangle'); d3noise(ac, t, 0.08, 900, v * 0.55); }
  else if (kind === 'heal') [523.3, 659.3, 784].forEach((f, i) => d3tone(ac, t + i * 0.06, f, 0, 0.38, v * 0.28, 'sine'));
  else if (kind === 'rest') (o === 'long' ? [392, 493.9, 587.3, 784] : [440, 554.4]).forEach((f, i) => d3tone(ac, t + i * 0.12, f, 0, 0.9, v * 0.2, 'sine'));
  else if (kind === 'levelup') [523.3, 659.3, 784, 1046.5].forEach((f, i) => d3tone(ac, t + i * 0.09, f, 0, 0.65, v * 0.3, 'triangle'));
}
/* ---- Hintergrundgeräusche je Stimmung ---- */
const TON_AMB = {
  warm: { lp: 650, gust: 0.15, lfo: 0.12, crackle: true },
  episch: { lp: 900, gust: 0.45, lfo: 0.07 },
  gruselig: { lp: 360, gust: 0.6, lfo: 0.05 },
  romantisch: { lp: 1300, gust: 0.25, lfo: 0.09, level: 0.6 },
  lustig: { lp: 520, gust: 0.1, lfo: 0.2, level: 0.55 },
  kalt: { bp: 1700, gust: 0.75, lfo: 0.11 },
  blutig: { lp: 230, gust: 0.4, lfo: 0.06, rumble: 46 },
  mystisch: { lp: 800, gust: 0.15, lfo: 0.05, level: 0.4, pad: [110, 164.8] },
  wueste: { bp: 2300, gust: 0.5, lfo: 0.1, level: 0.8 }
};
let TON_BG = null;
const tonAmbVol = () => { try { const v = +localStorage.getItem('hb_amb_vol'); return Number.isFinite(v) && localStorage.getItem('hb_amb_vol') != null ? Math.max(0, Math.min(1, v)) : 0.35; } catch (e) { return 0.35; } };
function tonAmbStop(fade) {
  const a = TON_BG; TON_BG = null; if (!a) return; const f = fade == null ? 0.6 : fade;
  try { const t = a.ac.currentTime; a.g.gain.cancelScheduledValues(t); a.g.gain.setValueAtTime(a.g.gain.value, t); a.g.gain.linearRampToValueAtTime(0, t + f); } catch (e) {}
  clearInterval(a.iv); setTimeout(() => a.nodes.forEach((x) => { try { if (x.stop) x.stop(); } catch (e) {} try { x.disconnect(); } catch (e) {} }), f * 1000 + 120);
}
function tonAmbBuild(ac, th) {
  const c = TON_AMB[th] || TON_AMB.warm; const nodes = []; const g = ac.createGain(); g.gain.value = 0; g.connect(TON.bus || ac.destination); nodes.push(g);
  const len = ac.sampleRate * 2; const buf = ac.createBuffer(1, len, ac.sampleRate); const d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { const w = vrand() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = c.bp ? w * 0.6 : last * 3.5; } /* braunes Rauschen für Wind, weisses für Sand und Eis */
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const fl = ac.createBiquadFilter(); fl.type = c.bp ? 'bandpass' : 'lowpass'; fl.frequency.value = c.bp || c.lp; fl.Q.value = c.bp ? 0.8 : 0.7;
  const wg = ac.createGain(); wg.gain.value = 0.6; src.connect(fl); fl.connect(wg); wg.connect(g); nodes.push(src, fl, wg);
  /* Böen: langsames Auf und Ab der Lautstärke und der Filterfrequenz */
  const lfo = ac.createOscillator(); lfo.frequency.value = c.lfo; const ld = ac.createGain(); ld.gain.value = 0.6 * c.gust; lfo.connect(ld); ld.connect(wg.gain); const lf = ac.createGain(); lf.gain.value = (c.bp || c.lp) * 0.35 * c.gust; lfo.connect(lf); lf.connect(fl.frequency); nodes.push(lfo, ld, lf);
  src.start(); lfo.start();
  if (c.rumble) { const o = ac.createOscillator(); o.frequency.value = c.rumble; const og = ac.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(g); o.start(); nodes.push(o, og); }
  if (c.pad) for (const f of c.pad) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = ac.createGain(); og.gain.value = 0.06; o.connect(og); og.connect(g); o.start(); nodes.push(o, og); }
  const target = tonAmbVol() * 0.22 * (c.level || 1); const t = ac.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(target, t + 1.2);
  const a = { ac, g, nodes, theme: th, iv: 0, level: c.level || 1 };
  if (c.crackle) a.iv = setInterval(() => { if (document.hidden || TON_BG !== a || TON.voices > 4) return; if (vrand() < 0.35) d3noise(ac, ac.currentTime + vrand() * 0.1, 0.012 + vrand() * 0.02, 1800 + vrand() * 2500, tonAmbVol() * 0.06 * (0.4 + vrand())); }, 140);
  return a;
}
/* Abgleich: an, wenn eingeschaltet und sichtbar; bei Stimmungswechsel überblenden; nie zweimal */
function tonAmbSync() {
  if (typeof vfxLoad !== 'function') return;
  const want = vfxLoad().ambience && !document.hidden; const th = typeof themeNow === 'function' ? themeNow() : 'warm';
  if (!want) { tonAmbStop(); return; }
  if (TON_BG && TON_BG.theme === th) { try { const t = TON_BG.ac.currentTime; TON_BG.g.gain.cancelScheduledValues(t); TON_BG.g.gain.linearRampToValueAtTime(tonAmbVol() * 0.22 * TON_BG.level, t + 0.3); } catch (e) {} return; }
  const ac = typeof tonAc === 'function' ? tonAc() : null; if (!ac) return;
  tonAmbStop(0.8); try { TON_BG = tonAmbBuild(ac, th); } catch (e) { TON_BG = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { tonAmbStop(0.2); if (typeof D3_AC !== 'undefined' && D3_AC) setTimeout(() => { try { if (document.hidden) D3_AC.suspend(); } catch (e) {} }, 300); }
  else tonAmbSync();
});
document.addEventListener('input', (ev) => { if (ev.target && ev.target.id === 'ambvol') { try { localStorage.setItem('hb_amb_vol', ev.target.value); } catch (e) {} tonAmbSync(); } });
