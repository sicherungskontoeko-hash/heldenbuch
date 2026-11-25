/* Effekte 2.0, Schritt 2: Spielereignisse und natürliche 20/1 lokal.
   Schaden/Heilung (Zahl, Balken, Form je Schadensart, höchstens ein Effekt, Teilchen-Budget), temporäre TP, Rückgängig ohne Effekt,
   Rast, Stufenaufstieg, Zustand, Inspiration, Zauberplatz, Konzentrationsende, Bewusstlos, eigener Zug, Vibration,
   Einstellung Aus, Heldenwechsel, Neuzeichnen ohne Änderung, reduzierte Bewegung, lokale Krit-Bühne je Set.
   Aufruf: node tests/ereignis.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };
const BASE = () => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); window.__vib = []; Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vib.push(p); return true; } }); };
const SETUP = () => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const c = sampleChar(); c.name = 'Brann'; S.chars[c.id] = c; S.cur = c.id; S.view = 'sheet'; S.mg = 'kampf'; S.camp = ''; render(); commit(); scrollTo(0, 0);
  vfxSet('damage', 'intensiv'); vfxSet('status', 'intensiv'); vfxSet('critical', 'intensiv'); return c.id; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1900 }, deviceScaleFactor: 1 }); /* hoch, damit alle Ziele im Bild sind */ const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(BASE); await p.goto('file://' + target); await p.waitForTimeout(500); await p.evaluate(SETUP);
  const ev = (fn, a) => p.evaluate(fn, a); const W = (ms) => p.waitForTimeout(ms);
  const clear = () => ev(() => { document.querySelectorAll('#vfxl > *, .d3stage').forEach((x) => x.remove()); window.__vib = []; });
  /* Schaden und Heilung */
  await ev(() => { scrollTo(0, 0); hpChange(cur(), 'dmg', 5); }); await W(60);
  let r = await ev(() => ({ n: document.querySelectorAll('#vfxl .vdmg').length, num: (document.querySelector('#vfxl .vnum') || {}).textContent, vp: document.querySelectorAll('#vfxl .vdmg .vp').length, hurt: !!document.querySelector('#view .vb.hpb.vfx-hurt'), t: (document.querySelector('#vfxl .vdmg') || {}).className, hp: document.querySelector('#view .vb.hpb b').firstChild.textContent }));
  T('Schaden: Zahl −5 am TP-Feld, rotes Aufleuchten, neutral ohne Schadensart', r.n === 1 && r.num === '−5' && r.hurt && /t-unbekannt/.test(r.t), r);
  T('Intensiv: höchstens 15 Teilchen', r.vp > 8 && r.vp <= 15, r);
  T('TP-Zahl im Bogen stimmt unabhängig vom Effekt', +r.hp === (await ev(() => cur().play.hp)), r);
  await W(700); T('Effekt räumt sich weg (keine liegengebliebenen Elemente)', await ev(() => document.querySelectorAll('#vfxl > *').length === 0));
  await ev(() => { vfxHint({ dtype: 'Feuer' }); hpChange(cur(), 'dmg', 2); }); await W(40);
  T('Schadensart aus den Daten: Feuer → Glut', await ev(() => !!document.querySelector('#vfxl .vdmg.t-feuer .vp.ember')));
  await clear(); await ev(() => { vfxHint({ dtype: 'Feuer und Kälte' }); hpChange(cur(), 'dmg', 1); }); await W(40);
  T('Gemischte Schadensart: neutral, nichts geraten', await ev(() => !!document.querySelector('#vfxl .vdmg.t-unbekannt')));
  await clear(); await ev(() => { vfxSet('damage', 'dezent'); hpChange(cur(), 'heal', 3); }); await W(40);
  r = await ev(() => ({ num: (document.querySelector('#vfxl .vnum.heal') || {}).textContent, vp: document.querySelectorAll('#vfxl .vdmg .vp').length, t: (document.querySelector('#vfxl .vdmg') || {}).className }));
  T('Heilung: +3, goldgrün, Dezent höchstens 8 Teilchen', r.num === '+3' && /t-heilung/.test(r.t) && r.vp > 0 && r.vp <= 8, r);
  await clear(); await ev(() => { hpChange(cur(), 'dmg', 1); hpChange(cur(), 'dmg', 1); hpChange(cur(), 'dmg', 1); }); await W(40);
  T('Höchstens ein Schadenseffekt gleichzeitig', await ev(() => document.querySelectorAll('#vfxl .vdmg').length === 1));
  /* Temporäre TP */
  await clear(); await ev(() => hpChange(cur(), 'temp', 5)); await W(40);
  T('Temporäre TP: Schutzschicht am TP-Feld', await ev(() => !!document.querySelector('#view .vb.hpb.vfx-shield')));
  await clear(); await ev(() => hpChange(cur(), 'dmg', 3)); await W(40);
  T('Schaden nur an temporären TP: als «temp.» gezeigt', await ev(() => /−3\s*temp\./.test((document.querySelector('#vfxl .vnum') || {}).textContent || '')));
  /* Rückgängig */
  await clear(); await ev(() => { undoBefore('hp'); hpChange(cur(), 'dmg', 4); }); await W(120); await clear(); await ev(() => undoDo()); await W(60);
  T('Rückgängig: kein Heil-Effekt', await ev(() => document.querySelectorAll('#vfxl .vdmg').length === 0));
  /* Neuzeichnen ohne Änderung */
  await clear(); await ev(() => { render(); render(); commit(); }); await W(60);
  T('Neuzeichnen ohne Änderung: kein Effekt', await ev(() => document.querySelectorAll('#vfxl > *').length === 0 && !document.querySelector('#view .vfx-hurt, #view .vfx-heal')));
  /* Rast */
  /* erst den Schadens-Effekt anlaufen lassen, dann wegräumen: sonst taucht er auf langsamen Läufern erst während der Rast auf */
  await clear(); await ev(() => { hpChange(cur(), 'dmg', 6); }); await W(150); await clear();
  /* Welle dauert 640 ms: per Beobachter festhalten (langsame Läufer in WebKit) */
  await ev(() => { window.__rw = { wave: false, dmg: false }; const mo = new MutationObserver(() => { if (document.querySelector('#vfxl .vrest.long')) window.__rw.wave = true; if (document.querySelector('#vfxl .vdmg')) window.__rw.dmg = true; }); mo.observe(document.querySelector('#vfxl') || document.body, { childList: true, subtree: true }); window.__rwmo = mo; });
  await ev(() => doRest(cur(), 'long', true, true)); await p.waitForFunction(() => window.__rw.wave, null, { timeout: 3000, polling: 20 }).catch(() => {}); await W(60);
  { const rw = await ev(() => { window.__rwmo.disconnect(); return window.__rw; }); T('Lange Rast: goldene Welle, kein zusätzlicher Heil-Effekt', rw.wave && !rw.dmg, rw); }
  await clear(); await ev(() => doRest(cur(), 'short', true, true)); await W(60);
  T('Kurze Rast: Bernsteinlicht', await ev(() => !!document.querySelector('#vfxl .vrest.short')));
  /* Zustand, Inspiration, Zauberplatz, Konzentration */
  await clear(); await ev(() => { cur().play.cond = (cur().play.cond || []).concat(['poisoned']); commit(); }); await W(60);
  T('Zustand erhalten: Zustandsfeld erscheint mit Impuls', await ev(() => !!document.querySelector('#view .vb.vcond.vfx-in')));
  await clear(); await ev(() => { cur().play.insp = true; commit(); }); await W(60);
  T('Inspiration erhalten: goldener Stern', await ev(() => !!document.querySelector('#vfxl .vstar')));
  await clear(); await ev(() => { cur().play.slots = Object.assign({}, cur().play.slots, { 1: (+(cur().play.slots || {})[1] || 0) + 1 }); commit(); }); await W(60);
  T('Zauberplatz verbraucht: Punkt leuchtet kurz', await ev(() => !!document.querySelector('#view [data-act="pip"][data-path="slots.1"].vfx-out')));
  await ev(() => { cur().play.conc = { name: 'Segnen' }; commit(); }); await clear(); await ev(() => { scrollTo(0, 0); cur().play.conc = null; commit(); }); await W(60);
  T('Konzentration endet: Symbol erlischt an der alten Stelle', await ev(() => !!document.querySelector('#vfxl .vconc')));
  /* Bewusstlos */
  await clear(); await ev(() => { cur().play.cond = []; commit(); scrollTo(0, 0); }); await clear(); await ev(() => hpChange(cur(), 'dmg', cur().play.hp + (cur().play.temp || 0))); await W(80);
  r = await ev(() => { const s = document.querySelector('#view .shead .sigil'); return { ko: s.classList.contains('vfx-ko'), filt: getComputedStyle(s).filter }; });
  T('Bewusstlos: Wappen entsättigt, bleibt grau', r.ko && /grayscale/.test(r.filt), r);
  await ev(() => { hpChange(cur(), 'heal', 50); scrollTo(0, 0); }); await W(500);
  /* Stufenaufstieg */
  await clear(); await ev(() => { const ch = cur(); S.lu = { cls: ch.cls, roll: 5, step: 2 }; lvlUpGo(); }); await W(80);
  r = await ev(() => ({ cel: !!document.querySelector('.d3stage.lucel'), runes: document.querySelectorAll('.lucel .lurc span').length, parts: document.querySelectorAll('.lucel .d3p').length, heal: !!document.querySelector('#vfxl .vdmg') }));
  T('Stufenaufstieg: goldene Runen, wenige Teilchen, kein Heil-Effekt für TP-Zuwachs', r.cel && r.runes === 10 && r.parts > 0 && r.parts <= 12 && !r.heal, r);
  await W(1450); T('Stufenaufstieg nach 1,4 s vorbei', await ev(() => !document.querySelector('.lucel')));
  await ev(() => { S.lu = null; S.modal = null; $('#modal').hidden = true; S.view = 'sheet'; render(); scrollTo(0, 0); });
  await ev(() => { vfxSet('status', 'dezent'); luCelebrate(7); }); await W(40);
  T('Stufenaufstieg dezent: ohne Teilchen und Runen', await ev(() => !!document.querySelector('.lucel') && !document.querySelector('.lucel .d3p') && !document.querySelector('.lucel .lurc')));
  /* eigener Zug und Vibration */
  await clear(); await ev(() => vfxTurn()); await W(30);
  T('Eigener Zug: goldener Impuls am Wappen, ohne Einwilligung keine Vibration', await ev(() => !!document.querySelector('#view .shead .sigil.vfx-turn') && window.__vib.length === 0));
  await ev(() => { vfxSet('haptics', true); window.__vib = []; vfxTurn(); hpChange(cur(), 'dmg', 1); }); await W(60);
  T('Mit Einwilligung: Muster für Zug und Schaden', await ev(() => window.__vib.some((v) => JSON.stringify(v) === '[12,35,12]') && window.__vib.some((v) => JSON.stringify(v) === '[18]')), await ev(() => window.__vib));
  await ev(() => vfxSet('haptics', false));
  /* Aus */
  await clear(); await ev(() => { vfxSet('damage', 'aus'); vfxSet('status', 'aus'); hpChange(cur(), 'dmg', 1); hpChange(cur(), 'temp', 9); doRest(cur(), 'short', true, true); luCelebrate(8); }); await W(60);
  T('Schaden und Ereignisse «Aus»: nichts', await ev(() => document.querySelectorAll('#vfxl > *, .lucel').length === 0 && !document.querySelector('#view .vfx-hurt, #view .vfx-shield')));
  await ev(() => { vfxSet('damage', 'intensiv'); vfxSet('status', 'intensiv'); });
  /* Heldenwechsel */
  await clear(); await ev(() => { const c = normChar(newChar({ name: 'Neu', cls: 'fig', level: 2 })); S.chars[c.id] = c; S.cur = c.id; c.play.hp = 3; commit(); }); await W(60);
  T('Erster Blick auf einen anderen Helden: kein Effekt', await ev(() => document.querySelectorAll('#vfxl > *').length === 0));
  /* natürliche 20/1 lokal */
  const crit = (o) => ev((o) => { pushLog(Object.assign({ label: 'Krit', total: 25, detail: 'W20 [20]', sides: 20, nat: 20, crit: true }, o)); }, o);
  await clear(); await crit({}); await W(120);
  r = await ev(() => { const s = document.querySelector('.d3stage'); const cs = s && getComputedStyle(s); return { local: !!s && s.classList.contains('local'), mask: cs ? (cs.maskImage || cs.webkitMaskImage || '') : '', parts: document.querySelectorAll('.d3stage .d3p').length, vig: !!document.querySelector('.d3stage .sg-vig'), quake: document.body.classList.contains('d3quake') }; });
  T('Natürliche 20 intensiv: lokale Bühne mit Maske um den Würfel, kein Rand-Schatten über den Bildschirm', r.local && /radial-gradient/.test(r.mask) && !r.vig && r.parts <= 16 && !r.quake, r);
  await W(1200); T('Natürliche 20 intensiv: nach 1,2 s vorbei', await ev(() => !document.querySelector('.d3stage')));
  await ev(() => vfxSet('critical', 'dezent')); await clear(); await crit({}); await W(120);
  r = await ev(() => ({ parts: document.querySelectorAll('.d3stage .d3p').length, r2: !!document.querySelector('.d3stage .sg-ring.r2') }));
  T('Natürliche 20 dezent: wenige Teilchen, kein zweiter Ring', r.parts > 0 && r.parts <= 6 && !r.r2, r); await W(950);
  await ev(() => vfxSet('critical', 'intensiv'));
  for (const [set, cls, part] of [['frostherz', 'n1-shards', 'n1shard'], ['drachenfeuer', 'n1-smoke', 'n1puff'], ['weltenhain', 'n1-wilt', 'n1leaf']]) {
    await clear();
    /* Beben dauert nur 620 ms: per Beobachter festhalten statt einmal abtasten (langsame Läufer in Firefox und WebKit) */
    await ev(() => { window.__qk = { beben: false, body: false }; const mo = new MutationObserver(() => { if (document.documentElement.classList.contains('n1beben')) window.__qk.beben = true; if (document.body.classList.contains('d3quake') || document.body.style.transform) window.__qk.body = true; }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] }); window.__qkmo = mo; });
    await crit({ label: 'Patzer', total: 1, detail: 'W20 [1]', nat: 1, crit: false, fumble: true, dset: set }); await W(150);
    const q = await ev(([cls, part]) => { window.__qkmo.disconnect(); return { st: !!document.querySelector('.d3stage.n1stage.full.' + cls), parts: document.querySelectorAll('.n1stage .d3p.' + part).length, beben: window.__qk.beben, body: window.__qk.body }; }, [cls, part]);
    T('Natürliche 1 «' + set + '»: eigene Spur (' + part + '), Risse über den Bildschirm, Inhalt bebt (nicht der body)', q.st && q.parts > 0 && q.beben && !q.body, q); await W(2000);
  }
  await ctx.close();
  /* reduzierte Bewegung */
  { const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const q = await c2.newPage(); q.on('pageerror', (e) => errs.push(e.message));
    await q.addInitScript(BASE); await q.goto('file://' + target); await q.waitForTimeout(500); await q.evaluate(SETUP);
    await q.evaluate(() => { hpChange(cur(), 'dmg', 2); doRest(cur(), 'short', true, true); luCelebrate(4); }); await q.waitForTimeout(60);
    T('Reduzierte Bewegung: keine Ereignis-Effekte', await q.evaluate(() => document.querySelectorAll('#vfxl > *, .lucel').length === 0)); await c2.close(); }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
