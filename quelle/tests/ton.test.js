/* Effekte 2.0, Schritt 3: Ton und Vibration.
   Kein Ton vor einer Berührung, Spiel- und Hintergrundgeräusche standardmässig aus, Ton unabhängig von den Effekten,
   höchstens 8 Stimmen, Lautstärke 0 stumm, Klang je Würfelmaterial, Hintergrund je Stimmung mit Überblenden und ohne
   Doppel, aus bei verstecktem Tab, Vibration bei der Landung einmal pro Wurf. Aufruf: node tests/ton.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const BASE = () => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); window.__starts = 0; window.__freq = [];
  const st = AudioScheduledSourceNode.prototype.start; AudioScheduledSourceNode.prototype.start = function (...a) { window.__starts++; return st.apply(this, a); };
  const sv = AudioParam.prototype.setValueAtTime; AudioParam.prototype.setValueAtTime = function (v, t) { window.__freq.push(v); return sv.call(this, v, t); };
  window.__vib = []; Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vib.push(p); return true; } }); };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(BASE); await p.goto('file://' + target); await p.waitForTimeout(500);
  const ev = (fn, a) => p.evaluate(fn, a);
  await ev(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; render(); commit(); });
  T('Grundwerte: Spiel- und Hintergrundgeräusche aus', await ev(() => !vfxLoad().eventSound && !vfxLoad().ambience));
  await ev(() => { vfxSet('diceSound', true); vfxSet('eventSound', true); hpChange(cur(), 'dmg', 2); d3snd('land', 1, 'klassik'); });
  T('Vor einer Berührung: kein AudioContext, kein Ton', await ev(() => D3_AC === null && window.__starts === 0));
  await p.mouse.click(5, 300); await ev(() => { vfxSet('eventSound', false); window.__starts = 0; hpChange(cur(), 'dmg', 1); }); await p.waitForTimeout(50);
  T('Spielgeräusche aus: Schaden ohne Ton', await ev(() => window.__starts === 0));
  await ev(() => { vfxSet('eventSound', true); window.__starts = 0; hpChange(cur(), 'dmg', 1); }); await p.waitForTimeout(50);
  const dmg = await ev(() => window.__starts); T('Spielgeräusche an: Schaden mit Ton', dmg > 0, dmg);
  await ev(() => { window.__starts = 0; hpChange(cur(), 'heal', 1); doRest(cur(), 'short', true, true); luCelebrate(4); }); await p.waitForTimeout(50);
  T('Heilung, Rast und Stufenaufstieg vertont', await ev(() => window.__starts >= 3));
  await p.waitForTimeout(1500);
  await ev(() => { vfxSet('damage', 'aus'); vfxSet('status', 'aus'); window.__starts = 0; hpChange(cur(), 'dmg', 1); }); await p.waitForTimeout(50);
  T('Effekte aus, Ton an: Ton kommt trotzdem (unabhängig)', await ev(() => window.__starts > 0));
  await p.waitForTimeout(800);
  const vmax = await ev(() => { let m = 0; for (let i = 0; i < 12; i++) { tonEvent('levelup'); d3snd('roll', 3, 'eisenwerk'); m = Math.max(m, TON.voices); } return m; });
  T('Höchstens 8 gleichzeitige Stimmen', vmax <= 8 && vmax > 0, vmax);
  await p.waitForTimeout(1500);
  T('Beendete Stimmen werden freigegeben', await ev(() => TON.voices === 0), await ev(() => TON.voices));
  await ev(() => { localStorage.setItem('hb_dice_vol', '0'); window.__starts = 0; tonEvent('damage'); d3snd('land', 1, 'arkanum'); });
  T('Lautstärke 0: stumm', await ev(() => window.__starts === 0)); await ev(() => localStorage.setItem('hb_dice_vol', '0.6'));
  const mat = await ev(() => { window.__freq = []; d3snd('land', 1, 'eisenwerk'); const a = window.__freq.slice(); window.__freq = []; d3snd('land', 1, 'totenbein'); return [a[0], window.__freq[0]]; });
  T('Klang je Material: Eisenwerk und Totenbein klingen verschieden', mat[0] && mat[1] && mat[0] !== mat[1], mat);
  /* Hintergrundgeräusche */
  T('Hintergrund standardmässig aus', await ev(() => TON_BG === null));
  await ev(() => { localStorage.setItem('hb_theme', 'kalt'); applyTheme(); vfxSet('ambience', true); }); await p.waitForTimeout(100);
  T('Hintergrund an: läuft mit der Stimmung «Kalt»', await ev(() => !!TON_BG && TON_BG.theme === 'kalt'));
  const one = await ev(async () => { const a = TON_BG; localStorage.setItem('hb_theme', 'warm'); applyTheme(); await new Promise((r) => setTimeout(r, 50)); const b2 = TON_BG; localStorage.setItem('hb_theme', 'warm'); applyTheme(); await new Promise((r) => setTimeout(r, 50)); return { changed: a !== b2, theme: b2 && b2.theme, same: b2 === TON_BG }; });
  T('Stimmungswechsel: überblendet auf «Warm», kein zweiter Hintergrund', one.changed && one.theme === 'warm' && one.same, one);
  await ev(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  T('Tab versteckt: Hintergrund aus', await ev(() => TON_BG === null));
  await ev(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(400);
  T('Wieder sichtbar: Hintergrund wieder da', await ev(() => !!TON_BG && TON_BG.theme === 'warm'));
  await ev(() => vfxSet('ambience', false));
  T('Hintergrund ausschalten: aus', await ev(() => TON_BG === null));
  /* Vibration bei der Landung */
  await ev(() => { vfxSet('haptics', true); window.__vib = []; pushLog({ label: '4W6', total: 14, detail: '4W6', groups: [{ sides: 6, sign: 1, rolls: [3, 4, 5, 2] }] }); }); await p.waitForTimeout(1500);
  T('Vibration: einmal bei der Landung, nicht je Würfel', await ev(() => window.__vib.filter((v) => JSON.stringify(v) === '[12]').length === 1), await ev(() => window.__vib));
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
