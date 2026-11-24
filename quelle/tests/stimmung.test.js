/* Stimmungen und Hintergrund-Effekte (Themes v2):
   - 20 Wechsel quer durch alle Stimmungen: genau eine Lichtebene, nur eine Zeichenschleife (Zeichenrate bleibt begrenzt)
   - Zeichenrate des Hintergrunds: Handy höchstens ~20/s, PC höchstens ~30/s; Effekte laufen in «Stark» weiter
   - «Aus»: Leinwand leer, keine Zeichnungen, Lichtschein aus; «Dezent»: Lichtschein ohne Animation
   - reduzierte Bewegung: keine Zeichnungen, kein Lichtschein
   - Würfel-Ereignisteilchen (FX.burst): Hintergrund zeichnet dann jedes Browser-Bild statt jedes zweite/dritte
   Diagnose (keine Prüfung): Rechenzeit des Hintergrunds in 4 s je Stimmung; mit --alt=<datei> im Vergleich zur alten Version.
   Aufruf: node tests/stimmung.test.js [index.html] [--alt=alte.html] */
const { chromium } = require('playwright'); const path = require('path');
const args = process.argv.slice(2); const ALT = (args.find((a) => a.startsWith('--alt=')) || '').slice(6);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
/* zählt Zeichnungen auf der Hintergrund-Leinwand (#embers): jedes Bild beginnt mit clearRect */
const ZAEHLER = () => { const o = CanvasRenderingContext2D.prototype.clearRect; window.__draws = 0; CanvasRenderingContext2D.prototype.clearRect = function (...a) { if (this.canvas && this.canvas.id === 'embers') window.__draws++; return o.apply(this, a); }; };
const START = () => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_fx', 'stark'); localStorage.setItem('hb_dice_fx', 'voll'); };
const setTheme = (p, k) => p.evaluate((k) => { localStorage.setItem('hb_theme', k); applyTheme(); }, k);
const rate = async (p, ms) => { await p.evaluate(() => { window.__draws = 0; }); await p.waitForTimeout(ms); return p.evaluate((ms) => Math.round(window.__draws * 1000 / ms * 10) / 10, ms); };
async function cpu(b, file, w, touch, keys) {
  const ctx = await b.newContext({ viewport: { width: w, height: touch ? 844 : 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  const p = await ctx.newPage(); await p.addInitScript(START); await p.goto('file://' + file); await p.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); const out = {};
  const td = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration').value;
  for (const k of keys) { await setTheme(p, k); await p.waitForTimeout(600); const a = await td(); await p.waitForTimeout(4000); out[k] = Math.round((await td() - a) / 4 * 1000); }
  await ctx.close(); return out;
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, touch, max] of [[390, true, 22], [1280, false, 32]]) {
    const tag = touch ? 'Handy' : 'PC';
    const ctx = await b.newContext({ viewport: { width: w, height: touch ? 844 : 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(tag + ': ' + e.message));
    await p.addInitScript(ZAEHLER); await p.addInitScript(START); await p.goto('file://' + target); await p.waitForTimeout(800);
    const keys = await p.evaluate(() => Object.keys(THEMES));
    for (let i = 0; i < 20; i++) { await setTheme(p, keys[i % keys.length]); await p.waitForTimeout(60); }
    await setTheme(p, 'kalt'); await p.waitForTimeout(500);
    T(tag + ': nach 20 Wechseln genau eine Lichtebene', await p.evaluate(() => document.querySelectorAll('#scene .hb-ambient-light').length) === 1);
    const r = await rate(p, 3000);
    T(tag + ': Hintergrund zeichnet weiter (Stark)', r > 5, r);
    T(tag + ': Zeichenrate höchstens ' + max + ' pro Sekunde (eine Schleife)', r <= max, r);
    for (const k of keys) { await setTheme(p, k); await p.waitForTimeout(300); const rk = await rate(p, 1200); if (!(rk > 3 && rk <= max)) T(tag + ': Zeichenrate «' + k + '»', false, rk); }
    T(tag + ': Lichtschein sichtbar und animiert (Stark)', await p.evaluate(() => { const s = getComputedStyle(document.querySelector('#scene .hb-ambient-light')); return s.display !== 'none' && s.animationName === 'hbAmbientBreath'; }));
    /* Würfel-Ereignis: kurzzeitig höhere Bildrate */
    const burst = await p.evaluate(() => typeof FX !== 'undefined' && FX && typeof FX.burst === 'function');
    if (burst) {
      /* Anteil der Browser-Bilder, in denen der Hintergrund zeichnet: in Ruhe wird jedes zweite oder dritte übersprungen, mit Würfel-Teilchen keines */
      const share = (fire) => p.evaluate(async (fire) => { let ticks = 0; window.__draws = 0; let on = true; const f = () => { if (!on) return; ticks++; requestAnimationFrame(f); }; requestAnimationFrame(f);
        if (fire) FX.burst(['255,220,140', '255,255,230'], 40); await new Promise((r) => setTimeout(r, 400)); on = false; return Math.round(window.__draws / Math.max(1, ticks) * 100) / 100; }, fire);
      const ruhe = await share(false), knall = await share(true);
      /* Ist der Browser selbst langsamer als die Grenze (PC-Fläche auf schwachem Testrechner), zeichnet er schon in Ruhe fast jedes Bild; dann zählt nur «mit Teilchen jedes Bild» */
      T(tag + ': Würfel-Teilchen: Hintergrund zeichnet jedes Bild (Anteil ' + ruhe + ' → ' + knall + ')', knall >= 0.85 && (touch ? ruhe <= 0.75 : true), { ruhe, knall }); }
    await p.evaluate(() => XA.fxLevel(null, 'dezent')); await p.waitForTimeout(300);
    T(tag + ': Dezent: Lichtschein ruhig', await p.evaluate(() => getComputedStyle(document.querySelector('#scene .hb-ambient-light')).animationName === 'none'));
    T(tag + ': Dezent: Hintergrund zeichnet weiter', (await rate(p, 1500)) > 3);
    await p.evaluate(() => XA.fxLevel(null, 'aus')); await p.waitForTimeout(300);
    const aus = await p.evaluate(() => ({ w: document.getElementById('embers').width, light: getComputedStyle(document.querySelector('#scene .hb-ambient-light')).display }));
    T(tag + ': Aus: Leinwand leer, Lichtschein aus', aus.w === 0 && aus.light === 'none', aus);
    T(tag + ': Aus: keine Zeichnungen', (await rate(p, 1500)) === 0);
    await p.evaluate(() => XA.fxLevel(null, 'stark')); await p.waitForTimeout(300);
    T(tag + ': wieder Stark: zeichnet', (await rate(p, 1500)) > 5);
    await ctx.close();
    const rm = await b.newContext({ viewport: { width: w, height: 844 }, reducedMotion: 'reduce' });
    const q = await rm.newPage(); q.on('pageerror', (e) => errs.push(tag + ' reduziert: ' + e.message));
    await q.addInitScript(ZAEHLER); await q.addInitScript(START); await q.goto('file://' + target); await q.waitForTimeout(800);
    T(tag + ': reduzierte Bewegung: keine Zeichnungen', (await rate(q, 1500)) === 0);
    T(tag + ': reduzierte Bewegung: kein Lichtschein', await q.evaluate(() => getComputedStyle(document.querySelector('#scene .hb-ambient-light')).display === 'none'));
    await rm.close();
  }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  /* Diagnose: Rechenzeit je Sekunde im Leerlauf (Startseite), Handy 390 px */
  const keys = ['warm', 'episch', 'gruselig', 'romantisch', 'lustig', 'kalt', 'blutig', 'mystisch', 'wueste'];
  const neu = await cpu(b, target, 390, true, keys); const alt = ALT ? await cpu(b, path.resolve(ALT), 390, true, keys) : null;
  console.log('Diagnose Rechenzeit Hintergrund, Handy 390 px, ms pro Sekunde' + (alt ? ' (alt → neu)' : '') + ':');
  for (const k of keys) console.log('  ' + k.padEnd(11) + (alt ? String(alt[k]).padStart(4) + ' → ' : '') + String(neu[k]).padStart(4));
  await b.close();
  console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
