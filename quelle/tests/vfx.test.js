/* Effekte 2.0, Schritt 1: Einstellungen, Übernahme alter Schalter, Leistung, Fehlerkorrekturen.
   Prüft: neue Grundwerte, Übernahme hb_dice_fx/hb_fx/hb_dice_snd (auch ausdrückliches Aus), Würfel und Hintergrund getrennt,
   Würfel Normal/Kurz/Aus, reduzierte Bewegung, natürliche 20/1 getrennt vom Regel-Krit, Krit «Aus» ohne Ersatz-Effekt,
   Würfelschale ohne Krit-Markierung für Höchst-/Tiefstwerte, Vibration nur mit Einwilligung, sichtbarer Zufall ohne Regel-Zufall,
   Hintergrund pausiert während rollender Würfel, Auto-Leistung (Absenken/Anheben), Lautstärke 0, Einstellungsfenster.
   Aufruf: node tests/vfx.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const BASE = () => { localStorage.setItem('hb_sample_done', '1'); window.__vib = []; Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vib.push(p); return true; } }); };
const ZAEHLER = () => { const o = CanvasRenderingContext2D.prototype.clearRect; window.__draws = 0; CanvasRenderingContext2D.prototype.clearRect = function (...a) { if (this.canvas && this.canvas.id === 'embers') window.__draws++; return o.apply(this, a); }; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const page = async (pre, opts, arg) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, opts || {})); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(BASE); await p.addInitScript(ZAEHLER); if (pre) await p.addInitScript(pre, arg); await p.goto('file://' + target); await p.waitForTimeout(500); return { p, ctx }; };

  /* A: Grundwerte und Übernahme */
  { const { p, ctx } = await page();
    const s = await p.evaluate(() => ({ v: vfxLoad(), raw: !!localStorage.getItem('hb_vfx'), fx: localStorage.getItem('hb_fx'), df: localStorage.getItem('hb_dice_fx') }));
    T('Neu: Auto, Würfel normal, Effekte dezent, Ton und Vibration aus', JSON.stringify(s.v) === JSON.stringify({ profile: 'auto', roll: 'normal', critical: 'dezent', damage: 'dezent', status: 'dezent', background: 'dezent', diceSound: false, haptics: false }), s);
    T('Neu: gespeichert, alte Schalter mitgeschrieben (hb_fx dezent, hb_dice_fx eigen)', s.raw && s.fx === 'dezent' && s.df === 'eigen', s);
    await p.evaluate(() => { vfxSet('roll', 'kurz'); vfxSet('critical', 'intensiv'); }); await p.waitForTimeout(400);
    /* Neustart nachgestellt: Zwischenspeicher leeren und alles aus localStorage neu lesen.
       (Echtes Neuladen ist hier unzuverlässig: Chromium verliert bei file://-Seiten gelegentlich localStorage-Änderungen zwischen Seiten, auch ohne die App.) */
    { const v = await p.evaluate(() => { VFX_RT.cache = null; VFX_RT.key = ''; return vfxLoad(); }); T('Einstellung bleibt nach Neustart (aus dem Speicher gelesen)', v.roll === 'kurz' && v.critical === 'intensiv', v); }
    await p.evaluate(() => localStorage.setItem('hb_fx', 'aus'));
    T('Alter Schalter von anderer Stelle geändert: nur dieser Teil übernommen', await p.evaluate(() => vfxLoad().background === 'aus' && vfxLoad().roll === 'kurz' && vfxLoad().critical === 'intensiv'));
    await ctx.close(); }
  for (const [df, bf, sn, want] of [['voll', 'stark', '1', { roll: 'normal', critical: 'intensiv', background: 'intensiv', diceSound: true }], ['ruhig', 'dezent', '0', { roll: 'aus', critical: 'dezent', background: 'dezent', diceSound: false }], ['aus', 'aus', null, { roll: 'aus', critical: 'aus', background: 'aus', damage: 'aus', status: 'aus', diceSound: false }]]) {
    const { p, ctx } = await page(([df, bf, sn]) => { if (!localStorage.getItem('hb_vfx')) { localStorage.setItem('hb_dice_fx', df); localStorage.setItem('hb_fx', bf); if (sn) localStorage.setItem('hb_dice_snd', sn); } }, undefined, [df, bf, sn]);
    await p.evaluate(() => 0); /* Seite geladen */
    const v = await p.evaluate(() => vfxLoad()); const ok = Object.entries(want).every(([k, x]) => v[k] === x);
    T('Übernahme hb_dice_fx=' + df + ', hb_fx=' + bf + (sn ? ', Ton=' + sn : '') + ' → ' + JSON.stringify(want), ok, v); await ctx.close();
  }

  /* B–N in einer Seite */
  const { p, ctx } = await page(() => { if (!localStorage.getItem('hb_vfx')) { localStorage.setItem('hb_dice_fx', 'voll'); localStorage.setItem('hb_fx', 'stark'); } });
  await p.evaluate(() => { XA.diceFx(null, 'aus'); });
  T('Würfel «Aus» lässt den Hintergrund', await p.evaluate(() => vfxLoad().roll === 'aus' && vfxLoad().background === 'intensiv'));
  await p.evaluate(() => { XA.fxLevel(null, 'dezent'); XA.diceFx(null, 'voll'); });
  T('Hintergrund «Dezent» lässt die Würfel', await p.evaluate(() => vfxLoad().background === 'dezent' && vfxLoad().roll === 'normal' && vfxLoad().critical === 'intensiv'));
  const roll = (o) => p.evaluate((o) => { pushLog(Object.assign({ label: 'Test', total: 14, detail: 'W20 [14]', sides: 20, nat: 14 }, o)); }, o || {});
  const has = (sel) => p.evaluate((s) => !!document.querySelector(s), sel);
  /* C: Normal / Kurz / Aus */
  await roll(); await p.waitForTimeout(150); const n1 = await has('#toast .rolling3'); await p.waitForTimeout(1100); const n2 = !(await has('#toast .rolling3')) && await has('#toast .die.d3.land');
  T('Würfel normal: rollt und landet (≈ 0,85 s)', n1 && n2, { n1, n2 });
  await p.evaluate(() => vfxSet('roll', 'kurz')); await roll(); await p.waitForTimeout(60); const k1 = await has('#toast .rolling3'); await p.waitForTimeout(420); const k2 = !(await has('#toast .rolling3')) && await has('#toast .die.d3.land');
  T('Würfel kurz: rollt und ist nach 0,5 s gelandet', k1 && k2, { k1, k2 });
  await p.evaluate(() => vfxSet('roll', 'aus')); await roll(); await p.waitForTimeout(30);
  T('Würfel aus: sofort das Ergebnis', !(await has('#toast .rolling3')) && await has('#toast .die.d3.land'));
  await p.evaluate(() => vfxSet('roll', 'normal'));
  /* E: natürliche 20/1 und Regel-Krit */
  await roll({ label: 'Angriff', total: 24, detail: 'W20 19 +5', nat: 19, crit: true }); await p.waitForTimeout(1250);
  const e19 = await p.evaluate(() => ({ stage: !!document.querySelector('.d3stage'), fx: !!document.querySelector('#toast .d3fx.n20'), gold: !!document.querySelector('#toast .die.crit'), txt: /erweiterter Bereich/.test(document.querySelector('#toast').textContent) }));
  T('Krit mit natürlicher 19 (erweiterter Bereich): golden, Hinweis, keine Bühne der natürlichen 20', !e19.stage && !e19.fx && e19.gold && e19.txt, e19);
  await roll({ label: 'Wahrnehmung', total: 23, detail: 'W20 20 +3', nat: 20 }); await p.waitForTimeout(1250);
  const e20 = await p.evaluate(() => ({ stage: !!document.querySelector('.d3stage'), krit: /Kritischer Treffer/.test(document.querySelector('#toast').textContent) }));
  T('Natürliche 20 bei einer Probe: Effekt ja, aber kein «Kritischer Treffer»', e20.stage && !e20.krit, e20);
  await roll({ label: 'Nächster', total: 7, detail: 'W20 7', nat: 7 }); await p.waitForTimeout(40);
  T('Neuer Wurf räumt alte grosse Effekte weg', await p.evaluate(() => !document.querySelector('.d3stage')));
  /* F: Krit «Aus» */
  await p.evaluate(() => vfxSet('critical', 'aus')); await p.waitForTimeout(1200);
  await roll({ label: 'Krit', total: 25, detail: 'W20 [20]', nat: 20, crit: true }); await p.waitForTimeout(1300);
  await p.evaluate(() => themeBurst('crit')); await p.waitForTimeout(100);
  T('Natürliche 20/1 «Aus»: keine Bühne, kein Würfel-Effekt, kein Ersatz-Effekt', await p.evaluate(() => !document.querySelector('.d3stage') && !document.querySelector('#toast .d3fx') && !document.querySelector('#burst .bfx')));
  await p.evaluate(() => vfxSet('critical', 'intensiv'));
  /* G: Würfelschale */
  await p.evaluate(() => { pushLog({ label: '3W6', total: 10, detail: '3W6 [6,1,3]', groups: [{ sides: 6, sign: 1, rolls: [6, 1, 3] }] }); }); await p.waitForTimeout(1500);
  const tray = await p.evaluate(() => [...document.querySelectorAll('#tray .tdie .die')].map((d) => d.className));
  T('Würfelschale: Höchst-/Tiefstwert leise markiert, kein Krit', tray.length === 3 && tray.some((c) => / max/.test(c)) && tray.some((c) => / min/.test(c)) && !tray.some((c) => / crit| fum/.test(c)), tray);
  /* H: Vibration */
  await p.evaluate(() => { window.__vib = []; themeBurst('crit'); vfxVibrate('turn'); }); await roll({ label: 'Krit', total: 25, detail: 'W20 [20]', nat: 20, crit: true }); await p.waitForTimeout(1300);
  T('Vibration ohne Einwilligung: nie', await p.evaluate(() => window.__vib.length === 0), await p.evaluate(() => window.__vib));
  await p.evaluate(() => { vfxSet('haptics', true); window.__vib = []; }); await roll({ label: 'Krit', total: 25, detail: 'W20 [20]', nat: 20, crit: true }); await p.waitForTimeout(1300);
  T('Vibration mit Einwilligung: Muster der natürlichen 20', await p.evaluate(() => window.__vib.some((v) => JSON.stringify(v) === '[30,45,55]')), await p.evaluate(() => window.__vib));
  await p.evaluate(() => { window.__vib = []; vfxSet('haptics', false); });
  T('Vibration ausschalten stoppt laufende Muster', await p.evaluate(() => window.__vib.some((v) => v === 0)));
  /* I: sichtbarer Zufall ohne Regel-Zufall */
  const rng = await p.evaluate(async () => { let n = 0; const real = Math.random; Math.random = () => { n++; return 0.42; };
    pushLog({ label: 'Test', total: 11, detail: 'W20 [11]', sides: 20, nat: 11 }); await new Promise((r) => setTimeout(r, 1200));
    pushLog({ label: '4W6', total: 14, detail: '4W6', groups: [{ sides: 6, sign: 1, rolls: [3, 4, 5, 2] }] }); await new Promise((r) => setTimeout(r, 1500)); Math.random = real; return n; });
  T('Rollende Würfel und Hintergrund verbrauchen keinen Regel-Zufall', rng === 0, rng);
  /* J: Hintergrund pausiert während rollender Würfel */
  await p.evaluate(() => { XA.fxLevel(null, 'stark'); }); await p.waitForTimeout(400);
  const pause = await p.evaluate(async () => { pushLog({ label: 'Test', total: 12, detail: 'W20 [12]', sides: 20, nat: 12 }); await new Promise((r) => setTimeout(r, 150)); window.__draws = 0; await new Promise((r) => setTimeout(r, 450)); const during = window.__draws;
    await new Promise((r) => setTimeout(r, 900)); window.__draws = 0; await new Promise((r) => setTimeout(r, 500)); return { during, after: window.__draws, busy: VFX_RT.busy }; });
  T('Hintergrund pausiert, solange Würfel rollen, und läuft danach weiter', pause.during === 0 && pause.after > 3 && pause.busy === 0, pause);
  /* K: Auto-Leistung */
  const gov = await p.evaluate(() => { VFX_RT.govForce = true; vfxSet('profile', 'auto'); VFX_RT.autoTier = 'balanced'; const r = {};
    vfxSample(60); r.one = vfxTier(); vfxSample(60); r.two = vfxTier(); r.bg = vfxLevel('background'); r.ms = vfxRollMs(); r.crit = vfxLevel('critical');
    for (let i = 0; i < 5; i++) vfxSample(10); r.five = vfxTier(); vfxSample(10); r.six = vfxTier();
    vfxSet('profile', 'balanced'); vfxSample(60); vfxSample(60); vfxSample(60); r.fixed = vfxTier();
    vfxSet('profile', 'max'); vfxSet('background', 'aus'); r.offStays = vfxLevel('background');
    vfxSet('profile', 'auto'); vfxSet('background', 'intensiv'); VFX_RT.govForce = false; localStorage.removeItem('hb_vfx_auto'); VFX_RT.autoTier = 'balanced'; return r; });
  T('Auto: eine schlechte Messung ändert nichts, zwei senken auf Energiesparend', gov.one === 'balanced' && gov.two === 'eco', gov);
  T('Energiesparend: Hintergrund aus, Würfel kurz, Effekte höchstens dezent', gov.bg === 'aus' && gov.ms === 300 && gov.crit === 'dezent', gov);
  T('Auto: erst nach sechs guten Messungen wieder Ausgewogen', gov.five === 'eco' && gov.six === 'balanced', gov);
  T('Fest gewähltes Profil wird nie automatisch geändert', gov.fixed === 'balanced', gov);
  T('Ausdrückliches «Aus» bleibt auch bei «Maximal» aus', gov.offStays === 'aus', gov);
  /* L: Lautstärke 0 */
  const snd = await p.evaluate(() => { let made = 0; const AC = window.AudioContext; window.AudioContext = function () { made++; return new AC(); }; D3_AC = null; vfxSet('diceSound', true); localStorage.setItem('hb_dice_vol', '0'); d3snd('land'); d3snd('n20'); const r = made; window.AudioContext = AC; vfxSet('diceSound', false); localStorage.setItem('hb_dice_vol', '0.6'); return r; });
  T('Lautstärke 0: es wird gar nichts abgespielt', snd === 0, snd);
  /* M: Einstellungsfenster */
  await p.evaluate(() => { XA.themeOpen(); });
  T('Stimmung: Block «Effekte» mit Würfel und «Einzeln einstellen»', await p.evaluate(() => !!document.querySelector('#modal .vfxb') && !!document.querySelector('#modal [data-arg="roll:kurz"]') && !!document.querySelector('#modal details#vfxMore [data-arg="profile:eco"]')));
  await p.evaluate(() => document.querySelector('#modal [data-arg="roll:kurz"]').click());
  T('Klick auf «Kurz» speichert und markiert', await p.evaluate(() => vfxLoad().roll === 'kurz' && document.querySelector('#modal [data-arg="roll:kurz"]').classList.contains('on')));
  await p.evaluate(() => document.querySelector('#modal [data-arg="level:aus"]').click());
  T('«Effekte: Aus» schaltet natürliche 20/1, Schaden, Ereignisse und Hintergrund aus, Würfel bleiben', await p.evaluate(() => vfxLoad().critical === 'aus' && vfxLoad().damage === 'aus' && vfxLoad().status === 'aus' && vfxLoad().background === 'aus' && vfxLoad().roll === 'kurz' && document.documentElement.getAttribute('data-fx') === 'aus'));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; const c = sampleChar(); S.chars[c.id] = c; S.cur = c.id; diceModal(); });
  T('Würfel-Fenster: «Würfel rollen» und «Natürliche 20 und 1», kein gemeinsamer Schalter mehr', await p.evaluate(() => /Würfel rollen/.test($('#modal').textContent) && !!document.querySelector('#modal [data-arg="critical:intensiv"]') && !document.querySelector('#modal [data-act="diceFx"]')));
  await ctx.close();
  /* D: reduzierte Bewegung */
  { const { p, ctx } = await page(() => { if (!localStorage.getItem('hb_vfx')) localStorage.setItem('hb_dice_fx', 'voll'); }, { reducedMotion: 'reduce' });
    await p.evaluate(() => { pushLog({ label: 'Test', total: 14, detail: 'W20 [14]', sides: 20, nat: 14 }); }); await p.waitForTimeout(60);
    const r1 = await p.evaluate(() => ({ ms: vfxRollMs(), roll: !!document.querySelector('#toast .rolling3'), land: !!document.querySelector('#toast .die.d3.land') }));
    await p.evaluate(() => { pushLog({ label: '3W6', total: 9, detail: '3W6', groups: [{ sides: 6, sign: 1, rolls: [2, 3, 4] }] }); }); await p.waitForTimeout(60);
    const r2 = await p.evaluate(() => ({ fly: document.querySelectorAll('#tray .tdie.fly').length, crit: vfxLevel('critical'), bg: vfxLevel('background') }));
    T('Reduzierte Bewegung: kein Rollen, sofort das Ergebnis (auch Würfelschale)', r1.ms === 0 && !r1.roll && r1.land && r2.fly === 0, { r1, r2 });
    T('Reduzierte Bewegung: Effekte aus, auch bei «Intensiv»', r2.crit === 'aus' && r2.bg === 'aus', r2);
    await ctx.close(); }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
