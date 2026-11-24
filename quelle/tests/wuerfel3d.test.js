/* Artefaktwürfel v5: Schalter, Darstellung aller Sets und Würfel, Rückfall, Regeln unberührt.
   Prüft: Grundwert Klassisch, alle 12 Sets × W4–W100 zeichnen mit Inhalt, W4 Eckzahl oben, W100 Zerlegung und zwei Würfel,
   Dreiecksbudget, Würfelschale und Set-Vorschau, rollt und landet als WebGL-Bild mit Inhalt,
   Antippen zeigt sofort die Ziellage, kein Regel-Zufall, keine liegengebliebenen Schleifen, Kontextverlust und fehlendes
   WebGL fallen auf den bisherigen Renderer zurück, reduzierte Bewegung, Zwischenspeicher begrenzt.
   Aufruf: node tests/wuerfel3d.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const BASE = () => { localStorage.setItem('hb_sample_done', '1'); };
const SETUP = (set) => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); c.dice = set; S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; render(); };
const ROLL = (o) => { pushLog(Object.assign({ label: 'Test', total: 17, detail: 'W20 [17]', sides: 20, nat: 17 }, o || {})); };
const ROLLX_INIT = () => { window.ROLLX = (o) => pushLog(Object.assign({ label: 'Test' }, o)); };
const blank = () => { const c = document.querySelector('#toast .die canvas'); if (!c) return null; const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 200) n++; return n / (c.width * c.height); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }); const errs = [];
  const page = async (opts, pre) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, opts || {})); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(BASE); await p.addInitScript(ROLLX_INIT); if (pre) await p.addInitScript(pre); await p.goto('file://' + target); await p.waitForTimeout(500); return { p, ctx }; };
  { const { p, ctx } = await page(); await p.evaluate(SETUP, 'weltenhain');
    T('Grundwert: Klassisch', await p.evaluate(() => vfxLoad().dice3d === 'classic'));
    await p.evaluate(ROLL); await p.waitForTimeout(1300);
    T('Klassisch: kein WebGL-Bild', await p.evaluate(() => !document.querySelector('#toast canvas') && !!document.querySelector('#toast .die.d3 svg')));
    await p.evaluate(() => vfxSet('dice3d', 'artifact'));
    const sup = await p.evaluate(() => [W3D.supports(20, 'weltenhain'), W3D.supports(20, 'klassik'), W3D.supports(6, 'weltenhain'), W3D.supports(100, 'arkanum'), W3D.supports(4, 'schatten'), W3D.supports(7, 'klassik'), W3D.supports(20, 'unbekannt'), W3D.sets().length]);
    T('Unterstützt: alle 12 Sets, W4 bis W100; anderes nicht', JSON.stringify(sup) === '[true,true,true,true,true,false,false,12]', sup);
    /* jedes Set, jeder Würfel: Standbild mit Inhalt, ohne Fehler */
    const all = await p.evaluate(() => { const bad = []; const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:80px;height:80px'; document.body.appendChild(host);
      for (const st of W3D.sets()) for (const sd of [4, 6, 8, 10, 12, 20, 100]) { host.style.width = sd === 100 ? '160px' : '80px'; const ok = W3D.still(host, sd, sd === 100 ? 37 : sd, st, {}); const c = host.querySelector('canvas');
        let fill = 0; if (c) { const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 200) n++; fill = n / (c.width * c.height); }
        if (!ok || fill < 0.08) bad.push(st + ':' + sd + ':' + fill.toFixed(2)); }
      host.remove(); return bad; });
    T('Alle Sets × W4, W6, W8, W10, W12, W20, W100: Standbild mit Inhalt', all.length === 0, all.slice(0, 6));
    const w100 = await p.evaluate(() => [100, 1, 10, 83, 55, 9].map((v) => W3D._split(v).join('')).join(','));
    T('W100 zerlegt: 100 = 00 und 0, 1 = 00 und 1, 10 = 10 und 0, 83 = 80 und 3', w100 === '00,01,10,83,55,09', w100);
    const w4 = await p.evaluate(() => { const g = d3geo(4); return [1, 2, 3, 4].every((v) => { const q = W3D._pose(4, v); let best = -1, top = -1; g.P.forEach((pt, i) => { const y = Q.rot(q, pt)[1]; if (y > best) { best = y; top = i; } }); return top === v - 1; }); });
    T('W4: die Ecke mit dem Ergebnis steht oben', w4);
    const tri = await p.evaluate(() => { let hi = 0, lo = 0; for (const st of W3D.sets()) for (const sd of [4, 6, 8, 10, 12, 20]) { hi = Math.max(hi, W3D._tris(sd, st, false)); lo = Math.max(lo, W3D._tris(sd, st, true)); } return { hi, lo }; });
    T('Dreiecke je Würfel: höchstens 16 000 (gross), 7000 (klein)', tri.hi <= 16000 && tri.lo <= 7000, tri);
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
    T('30 schnelle Würfe: keine liegengebliebenen Schleifen, Zwischenspeicher begrenzt', await p.evaluate(() => W3D._active() === 0 && W3D._cache() <= 16));
    await p.evaluate((s) => { cur().dice = s; }, 'klassik'); await p.evaluate(() => ROLLX({ total: 83, detail: 'W100 [83]', sides: 100, nat: 83 }));
    await p.waitForTimeout(1400);
    const pc = await p.evaluate(() => { const d = document.querySelector('#toast .die.d3.w100.w3d'); const c = d && d.querySelector('canvas'); if (!c) return null; const x = c.getContext('2d'); const half = (x0) => { const a = x.getImageData(x0, 0, c.width / 2, c.height).data; let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 200) n++; return n / (a.length / 4); }; return { w: d.getBoundingClientRect().width, l: half(0), r: half(c.width / 2), tv: document.querySelector('#toast .tv').textContent }; });
    T('W100 im Würfelfenster: zwei Würfel nebeneinander (Zehner und Einer), Ergebnis 83', pc && pc.w > 80 && pc.l > 0.06 && pc.r > 0.06 && pc.tv === '83', pc);
    await p.evaluate(() => pushLog({ label: 'Schaden', total: 14, detail: '3W6 [4, 5, 5]', sides: 6, groups: [{ sides: 6, sign: 1, rolls: [4, 5, 5] }] })); await p.waitForTimeout(1500);
    T('Würfelschale (3W6): Artefaktwürfel als Standbilder', await p.evaluate(() => document.querySelectorAll('#tray .tdie canvas.w3dc').length === 3 && !document.querySelector('#tray .tdie svg.d3s')));
    await p.evaluate(() => pushLog({ label: 'Viele', total: 50, detail: '14W6', sides: 6, groups: [{ sides: 6, sign: 1, rolls: [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 3, 5] }] })); await p.waitForTimeout(1500);
    T('Würfelschale mit mehr als 12 Würfeln: bisherige Darstellung', await p.evaluate(() => !document.querySelector('#tray canvas') && document.querySelectorAll('#tray .tdie').length === 14));
    await p.evaluate(() => { document.querySelector('#tray').hidden = true; diceModal(); }); await p.waitForTimeout(400);
    T('Set-Vorschau zeigt die Artefaktmodelle', await p.evaluate(() => document.querySelectorAll('#modal .d3card .d3pv canvas.w3dc').length === 11));
    await p.evaluate(() => { document.querySelector('#modal').hidden = true; S.modal = null; });
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
