/* Messung (kein Bestanden/Nicht-bestanden-Test): Startzeit und typische Bedienschritte in mehreren Läufen, je Datei.
   Gleiche Daten (fester Testbestand mit 5 Helden), gleicher Browser, gleiche Bildschirmgrösse, CPU gedrosselt wie ein Handy.
   Mehrere Dateien werden abwechselnd gemessen, damit Erwärmung und Hintergrundlast beide gleich treffen.
   Aufruf: node tests/messung.js [--laeufe=9] [--drossel=4] [--json=aus.json] a.html [b.html …]
   Ausgabe: Median, p95, Min/Max in Millisekunden je Schritt und Datei. «sync» = Rechenzeit bis der Klick verarbeitet ist,
   «bild» = bis das nächste Bild gezeichnet ist (enthält die Wartezeit auf den Bildaufbau). */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const RUNS = +arg('laeufe', 9), RATE = +arg('drossel', 4), OUT = arg('json', '');
const FILES = process.argv.slice(2).filter((x) => !x.startsWith('--')).map((f) => path.resolve(f));
if (!FILES.length) { console.error('Datei fehlt'); process.exit(2); }

const INIT = (seed) => {
  try { if (seed.data) localStorage.setItem('heldenbuch', seed.data); localStorage.setItem('hb_name', 'Test'); localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', seed.fx); localStorage.setItem('hb_welcome', '1'); } catch (e) {}
  window.__first = 0;
  const mo = new MutationObserver(() => { const v = document.getElementById('view'); if (v && v.children.length && !window.__first) { window.__first = performance.now(); mo.disconnect(); } });
  mo.observe(document, { childList: true, subtree: true });
  window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
};

/* Ein Schritt im Seitenkontext: sync = bis die Aktion zurückkehrt, bild = bis zwei Bilder später */
const STEP = async (fn) => {
  const f = new Function('return (' + fn + ')')();
  const t0 = performance.now(); await f(); const t1 = performance.now();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return [t1 - t0, performance.now() - t0];
};

async function fixture(b, file) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.addInitScript(INIT, { data: '', fx: 'aus' });
  await p.goto('file://' + file); await p.waitForTimeout(600);
  const data = await p.evaluate(() => {
    if (S.modal) { S.modal = null; const m = document.getElementById('modal'); if (m) m.hidden = true; }
    for (const id of Object.keys(S.chars)) delete S.chars[id];
    const mk = (o) => { const c = normChar(newChar(o)); S.chars[c.id] = c; return c; };
    const a = sampleChar(); S.chars[a.id] = a;
    mk({ name: 'Ilva', cls: 'wiz', level: 9 }); mk({ name: 'Borin', cls: 'fig', level: 5 }); mk({ name: 'Senna', cls: 'cle', level: 7 }); mk({ name: 'Rook', cls: 'rog', level: 3 });
    for (const id of Object.keys(S.chars)) persist('c', id); S.cur = a.id; persist('c', a.id);
    return localStorage.getItem('heldenbuch');
  });
  const exp = await p.evaluate(() => exportData(Object.values(S.chars), false));
  await ctx.close(); return { data, exp };
}

async function once(b, file, seed, fx) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); if (RATE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await p.addInitScript(INIT, { data: seed.data, fx });
  const tNav = Date.now(); await p.goto('file://' + file, { waitUntil: 'load' }); const navMs = Date.now() - tNav;
  await p.waitForFunction(() => window.__first > 0, null, { timeout: 30000 });
  const r = {};
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, first: window.__first }; });
  r['Start: erstes Bild'] = [nav.first, nav.first]; r['Start: geladen (load)'] = [nav.load, nav.load];
  await p.waitForTimeout(1500); /* Leerlaufarbeit nach dem Start abklingen lassen */
  await p.evaluate(() => { if (S.modal) { S.modal = null; const m = document.getElementById('modal'); if (m) m.hidden = true; } });
  const step = async (name, fn) => { r[name] = await p.evaluate(STEP, fn.toString()); };
  const id = await p.evaluate(() => S.cur);
  await step('Bogen öffnen', () => document.querySelector('[data-act="play"][data-arg="' + S.cur + '"]').click());
  for (const [k, l] of [['werte', 'Reiter Werte'], ['zauber', 'Reiter Zauber'], ['gear', 'Reiter Inventar'], ['kampf', 'Reiter Kampf']]) await step(l, new Function('return () => { const b = document.querySelector(\'.mnav [data-act="mg"][data-arg="' + k + '"]\'); if (b) b.click(); else { S.mg = "' + k + '"; render(); } }')());
  await p.evaluate(() => { window.__lt.length = 0; });
  await step('Fertigkeitswurf (erster)', () => document.querySelector('[data-act="d20"][data-kind^="check:"]').click());
  await p.waitForTimeout(1600);
  const lt1 = await p.evaluate(() => window.__lt.reduce((s, x) => s + x[1], 0)); r['Wurf: lange Aufgaben 1,6 s (erster)'] = [lt1, lt1];
  await p.evaluate(() => { window.__lt.length = 0; });
  await step('Fertigkeitswurf (warm)', () => document.querySelectorAll('[data-act="d20"][data-kind^="check:"]')[3].click());
  await p.waitForTimeout(1600);
  const lt2 = await p.evaluate(() => window.__lt.reduce((s, x) => s + x[1], 0)); r['Wurf: lange Aufgaben 1,6 s (warm)'] = [lt2, lt2];
  await step('Zauberbuch öffnen', () => { S.view = 'spells'; render(); });
  await step('Bestiarium öffnen', () => { S.view = 'mobs'; render(); });
  await step('Bestiarium suchen «drache»', () => { const i = document.querySelector('#view input[type="search"]'); if (!i) return; i.value = 'drache'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await step('SL-Übersicht (5 Spieler)', () => { S.camp = 'messraum'; UID = 'dm1'; S.meta = { dm: 'dm1', mercy: {} }; S.table = {}; for (let i = 0; i < 5; i++) S.table['p' + i] = { char: 'Held ' + i, pl: 'P' + i, cls: 'fig', clsName: 'Kämpfer', level: 5, hp: 30 + i, hpMax: 44, temp: 0, ac: 16, pas: [13, 11, 10], cond: [], rolls: [], t: Date.now() }; S.view = 'camp'; render(); });
  await step('Speichern (commit)', () => { S.view = 'sheet'; S.camp = ''; S.table = {}; render(); const c = cur(); c.play.temp = (c.play.temp || 0) + 1; commit(false); });
  await step('Import (5 Helden)', new Function('return () => importJson(' + JSON.stringify(seed.exp) + ')')());
  r['_fehler'] = errs.length; r['_nav'] = navMs;
  await ctx.close(); return r;
}

const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); const i = (s.length - 1) * f; const lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
(async () => {
  const b = await chromium.launch();
  const meta = { zeit: new Date().toISOString(), laeufe: RUNS, drossel: RATE, browser: 'Chromium ' + b.version(), viewport: '390×844 (Handy, DPR 2)', dateien: FILES.map((f) => path.relative(process.cwd(), f)) };
  const seeds = []; for (const f of FILES) seeds.push(await fixture(b, f));
  const res = FILES.map(() => ({}));
  const fxs = ['aus', 'voll'];
  for (let i = 0; i < RUNS; i++) for (let j = 0; j < FILES.length; j++) for (const fx of fxs) {
    const r = await once(b, FILES[j], seeds[j], fx);
    for (const [k, v] of Object.entries(r)) { if (k.startsWith('_')) { (res[j]['_' + fx + k] = res[j]['_' + fx + k] || []).push(v); continue; } const key = k + ' · Würfel ' + fx; (res[j][key] = res[j][key] || { sync: [], bild: [] }); res[j][key].sync.push(v[0]); res[j][key].bild.push(v[1]); }
    process.stderr.write('.');
  }
  await b.close(); process.stderr.write('\n');
  const sum = res.map((R) => { const o = {}; for (const [k, v] of Object.entries(R)) { if (k.startsWith('_')) { o[k] = v; continue; } o[k] = {}; for (const m of ['sync', 'bild']) o[k][m] = { median: +q(v[m], 0.5).toFixed(1), p95: +q(v[m], 0.95).toFixed(1), min: +Math.min(...v[m]).toFixed(1), max: +Math.max(...v[m]).toFixed(1) }; } return o; });
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ meta, roh: res, zusammenfassung: sum }, null, 1));
  console.log('# Messung · ' + meta.zeit + ' · ' + RUNS + ' Läufe · CPU ÷' + RATE + ' · ' + meta.browser + ' · ' + meta.viewport);
  const keys = Object.keys(sum[0]).filter((k) => !k.startsWith('_'));
  console.log('\n| Schritt | ' + meta.dateien.map((d) => d + ' sync Median (p95)').join(' | ') + ' |\n|---|' + meta.dateien.map(() => '---').join('|') + '|');
  for (const k of keys) console.log('| ' + k + ' | ' + sum.map((s) => s[k] ? s[k].sync.median + ' (' + s[k].sync.p95 + ')' : '–').join(' | ') + ' |');
  console.log('\nSkriptfehler: ' + sum.map((s, i) => meta.dateien[i] + ' ' + JSON.stringify([s._ausfehler, s._vollfehler])).join(' · '));
})();
