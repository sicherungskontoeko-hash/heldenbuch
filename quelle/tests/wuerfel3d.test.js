/* Artefaktwürfel v5 (Prototyp): Schalter, Darstellung, Rückfall, Regeln unberührt.
   Prüft: Grundwert Klassisch, Artefakt nur für unterstützte Würfel/Sets, rollt und landet als WebGL-Bild mit Inhalt,
   Antippen zeigt sofort die Ziellage, kein Regel-Zufall, keine liegengebliebenen Schleifen, Kontextverlust und fehlendes
   WebGL fallen auf den bisherigen Renderer zurück, reduzierte Bewegung, Zwischenspeicher begrenzt.
   Aufruf: node tests/wuerfel3d.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const BASE = () => { localStorage.setItem('hb_sample_done', '1'); };
const SETUP = (set) => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); c.dice = set; S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; render(); };
const ROLL = (o) => { pushLog(Object.assign({ label: 'Test', total: 17, detail: 'W20 [17]', sides: 20, nat: 17 }, o || {})); };
const blank = () => { const c = document.querySelector('#toast .die canvas'); if (!c) return null; const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 200) n++; return n / (c.width * c.height); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }); const errs = [];
  const page = async (opts, pre) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, opts || {})); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(BASE); if (pre) await p.addInitScript(pre); await p.goto('file://' + target); await p.waitForTimeout(500); return { p, ctx }; };
  { const { p, ctx } = await page(); await p.evaluate(SETUP, 'weltenhain');
    T('Grundwert: Klassisch', await p.evaluate(() => vfxLoad().dice3d === 'classic'));
    await p.evaluate(ROLL); await p.waitForTimeout(1300);
    T('Klassisch: kein WebGL-Bild', await p.evaluate(() => !document.querySelector('#toast canvas') && !!document.querySelector('#toast .die.d3 svg')));
    await p.evaluate(() => vfxSet('dice3d', 'artifact'));
    const sup = await p.evaluate(() => [W3D.supports(20, 'weltenhain'), W3D.supports(20, 'eisenwerk'), W3D.supports(20, 'arkanum'), W3D.supports(20, 'klassik'), W3D.supports(6, 'weltenhain'), W3D.supports(100, 'arkanum')]);
    T('Unterstützt: W20 in Weltenhain, Eisenwerk, Arkanum; sonst nicht', JSON.stringify(sup) === '[true,true,true,false,false,false]', sup);
    await p.evaluate(ROLL); await p.waitForTimeout(120);
    T('Artefakt: rollt als WebGL-Bild', await p.evaluate(() => !!document.querySelector('#toast .die canvas.w3dc')));
    await p.waitForTimeout(1300);
    const land = await p.evaluate(() => ({ w3d: !!document.querySelector('#toast .die.d3.w3d canvas'), svg: !!document.querySelector('#toast .die.d3 svg'), total: document.querySelector('#toast .tv').textContent, active: W3D._active() }));
    T('Artefakt: gelandet als Standbild, Ergebnis unverändert, keine laufende Schleife', land.w3d && !land.svg && land.total === '17' && land.active === 0, land);
    const fill = await p.evaluate(blank); T('Bild hat Inhalt (Würfel sichtbar)', fill > 0.15, fill);
    await p.evaluate(ROLL); await p.waitForTimeout(100); await p.evaluate(() => document.querySelector('#toast').click()); await p.waitForTimeout(60);
    T('Antippen: sofort die Ziellage', await p.evaluate(() => !!document.querySelector('#toast .die.d3.w3d') && W3D._active() === 0));
    const rng = await p.evaluate(async () => { let n = 0; const r = Math.random; Math.random = () => { n++; return 0.42; }; pushLog({ label: 'X', total: 9, detail: 'W20 [9]', sides: 20, nat: 9 }); await new Promise((res) => setTimeout(res, 1300)); Math.random = r; return n; });
    T('Kein Regel-Zufall in der Animation', rng === 0, rng);
    await p.evaluate(() => { for (let i = 0; i < 30; i++) pushLog({ label: 'Schnell', total: 1 + (i % 20), detail: 'W20', sides: 20, nat: 1 + (i % 20) }); }); await p.waitForTimeout(1400);
    T('30 schnelle Würfe: keine liegengebliebenen Schleifen, Zwischenspeicher begrenzt', await p.evaluate(() => W3D._active() === 0 && W3D._cache() <= 13));
    await p.evaluate((s) => { cur().dice = s; }, 'klassik'); await p.evaluate(ROLL); await p.waitForTimeout(1300);
    T('Set ohne Artefakt-Modell: bisherige Darstellung', await p.evaluate(() => !document.querySelector('#toast canvas') && !!document.querySelector('#toast .die.d3 svg')));
    await p.evaluate(() => { cur().dice = 'eisenwerk'; }); await p.evaluate(ROLL); await p.waitForTimeout(200);
    await p.evaluate(() => { const e = W3D._gl().getExtension('WEBGL_lose_context'); if (e) e.loseContext(); }); await p.waitForTimeout(1300);
    T('Kontextverlust mitten im Wurf: Ergebnis kommt trotzdem (bisheriger Renderer)', await p.evaluate(() => document.querySelector('#toast .tv').textContent === '17' && !!document.querySelector('#toast .die.d3 svg') && W3D._active() === 0));
    await p.evaluate(ROLL); await p.waitForTimeout(1300);
    T('Nach Kontextverlust: weiter mit dem bisherigen Renderer', await p.evaluate(() => !!document.querySelector('#toast .die.d3 svg') && !document.querySelector('#toast canvas')));
    await ctx.close(); }
  { const { p, ctx } = await page({}, () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return /webgl/.test(t) ? null : g.call(this, t, o); }; });
    await p.evaluate(SETUP, 'arkanum'); await p.evaluate(() => vfxSet('dice3d', 'artifact')); await p.evaluate(ROLL); await p.waitForTimeout(1300);
    T('Ohne WebGL: bisherige Darstellung, Ergebnis da', await p.evaluate(() => !!document.querySelector('#toast .die.d3 svg') && document.querySelector('#toast .tv').textContent === '17')); await ctx.close(); }
  { const { p, ctx } = await page({ reducedMotion: 'reduce' }); await p.evaluate(SETUP, 'weltenhain'); await p.evaluate(() => vfxSet('dice3d', 'artifact')); await p.evaluate(ROLL); await p.waitForTimeout(80);
    T('Reduzierte Bewegung: sofort Standbild, kein Rollen', await p.evaluate(() => !!document.querySelector('#toast .die.d3.w3d canvas') && W3D._active() === 0)); await ctx.close(); }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
