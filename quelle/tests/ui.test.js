/* Effekte 2.0, Schritt 4: Bedien-Animationen. Nur bei echten Ereignissen, nicht bei jedem Neuzeichnen; Schalter; reduzierte Bewegung;
   Knöpfe nur transform 80 ms; kein «transition: all»; Stimmungswechsel mit Überblenden (höchstens zwei Bilder), Energiesparend direkt.
   Aufruf: node tests/ui.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const BASE = () => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(BASE); await p.goto('file://' + target); await p.waitForTimeout(500); const ev = (fn, a) => p.evaluate(fn, a); const W = (ms) => p.waitForTimeout(ms);
  await ev(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const a = sampleChar(); S.chars[a.id] = a; const c = normChar(newChar({ name: 'Zweite', cls: 'fig', level: 2 })); S.chars[c.id] = c; S.cur = a.id; S.view = 'sheet'; S.mg = 'kampf'; render(); window.__ids = [a.id, c.id]; });
  T('Grundwert an: html[data-anim=an]', await ev(() => vfxLoad().menu === true && document.documentElement.getAttribute('data-anim') === 'an'));
  const btn = await ev(() => { const s = getComputedStyle(document.querySelector('#view .btn, #view .chip')); return { prop: s.transitionProperty, dur: s.transitionDuration }; });
  T('Knöpfe: nur transform, 80 ms', btn.prop === 'transform' && btn.dur === '0.08s', btn);
  const all = await ev(() => { let n = 0; for (const sh of document.styleSheets) { let r; try { r = sh.cssRules; } catch (e) { continue; } for (const x of r) if (/transition:\s*all\b/.test(x.cssText)) n++; } return n; });
  T('Kein «transition: all» im Stil', all === 0, all);
  await ev(() => document.querySelector('#view [data-act="mg"][data-arg="werte"]').click()); await W(20);
  T('Reiterwechsel: kurzer Übergang am Inhalt', await ev(() => !!document.querySelector('#view .vfx-sec')));
  await W(200); await ev(() => { render(); render(); }); await W(20);
  T('Neuzeichnen ohne Wechsel: keine Animation', await ev(() => !document.querySelector('#view .vfx-sec') && !document.querySelector('#view.vfx-hero')));
  await ev(() => { S.cur = window.__ids[1]; render(); }); await W(20);
  T('Heldenwechsel: Übergang', await ev(() => document.getElementById('view').classList.contains('vfx-hero')));
  await W(260); await ev(() => XA.themeOpen()); await W(20);
  T('Dialog öffnet: Übergang', await ev(() => document.getElementById('modal').classList.contains('vfx-open')));
  await W(260); await ev(() => document.querySelector('#modal [data-arg="roll:kurz"]').click()); await W(20);
  T('Dialog neu gezeichnet (offen): kein zweiter Übergang', await ev(() => !document.getElementById('modal').classList.contains('vfx-open')));
  await ev(() => { const d = document.querySelector('#modal details#vfxMore'); d.open = true; }); await W(30);
  T('Aufklappen: Übergang', await ev(() => document.querySelector('#modal details#vfxMore').classList.contains('vfx-unfold')));
  await ev(() => { $('#modal').hidden = true; S.modal = null; bannerToast('Gespeichert', 'Test'); }); await W(20);
  T('Meldung erscheint mit Übergang', await ev(() => !!document.querySelector('#mini .mt.vfx-msg')));
  /* Stimmungswechsel */
  const fade = await ev(async () => { const n0 = document.querySelectorAll('.scenefade').length; for (const k of ['kalt', 'warm', 'episch', 'mystisch', 'wueste']) { localStorage.setItem('hb_theme', k); applyTheme(); }
    const during = document.querySelectorAll('.scenefade').length; await new Promise((r) => setTimeout(r, 900)); return { n0, during, after: document.querySelectorAll('.scenefade').length }; });
  T('Stimmungswechsel: Überblenden, höchstens zwei Bilder, danach aufgeräumt', fade.n0 === 0 && fade.during === 1 && fade.after === 0, fade);
  await ev(() => { vfxSet('profile', 'eco'); localStorage.setItem('hb_theme', 'kalt'); applyTheme(); }); await W(20);
  T('Energiesparend: Stimmung wechselt direkt', await ev(() => document.querySelectorAll('.scenefade').length === 0)); await ev(() => vfxSet('profile', 'auto'));
  await ev(() => vfxSet('menu', false)); await W(20);
  const off = await ev(() => { const s0 = getComputedStyle(document.querySelector('#view .btn, #view .chip')); const s = { transitionDuration: s0.transitionDuration, transitionProperty: s0.transitionProperty }; document.querySelector('#view [data-act="mg"][data-arg="kampf"]') && document.querySelector('#view [data-act="mg"][data-arg="kampf"]').click(); return { attr: document.documentElement.getAttribute('data-anim'), dur: s.transitionDuration, prop: s.transitionProperty, sec: !!document.querySelector('#view .vfx-sec') }; });
  T('Schalter aus: keine Bedien-Animationen', off.attr === 'aus' && (off.dur === '0s' || off.prop === 'all' || off.prop === 'none') && !off.sec, off);
  await ctx.close();
  { const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const q = await c2.newPage(); q.on('pageerror', (e) => errs.push(e.message)); await q.addInitScript(BASE); await q.goto('file://' + target); await q.waitForTimeout(500);
    T('Reduzierte Bewegung: aus', await q.evaluate(() => document.documentElement.getAttribute('data-anim') === 'aus')); await c2.close(); }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
