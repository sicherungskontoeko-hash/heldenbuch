/* Zufallsspieler: tippt mit festem Startwert zufällig auf alles, was sich bedienen lässt (Knöpfe, Reiter, Auswahlen, Felder),
   wechselt zwischen Handy- und Laptopbreite und hält jeden Skriptfehler mit den letzten Schritten fest.
   Aufruf: node tests/zufallsspieler.test.js [index.html] [--min=3] [--seed=7] */
const { chromium } = require('playwright'); const path = require('path');
const args = process.argv.slice(2); const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const MIN = +((args.find((a) => a.startsWith('--min=')) || '--min=3').slice(6)); const SEED = +((args.find((a) => a.startsWith('--seed=')) || '--seed=7').slice(7));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info, null, 1).slice(0, 3000))); };
let s = SEED; const R = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; };
const NETZ = /WebSocket|net::|ERR_|mqtt|Failed to load resource|wss?:\/\//i;
(async () => {
  const b = await chromium.launch(); const errs = []; const steps = []; let n = 0; const widths = [390, 1280, 320];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true }); const p = await ctx.newPage();
  await ctx.route(/^https?:/, (r) => r.abort());
  p.on('pageerror', (e) => errs.push({ typ: 'Seitenfehler', msg: e.message, stack: (e.stack || '').split('\n').slice(0, 4).join(' | '), schritte: steps.slice(-12) }));
  p.on('console', (m) => { if (m.type() === 'error' && !NETZ.test(m.text())) errs.push({ typ: 'Konsole', msg: m.text().slice(0, 300), schritte: steps.slice(-12) }); });
  p.on('dialog', (d) => { steps.push('Dialog: ' + d.message().slice(0, 60)); (R() < 0.5 ? d.accept() : d.dismiss()).catch(() => {}); });
  p.on('download', (d) => d.cancel().catch(() => {}));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); window.print = () => {}; window.open = () => null; });
  await p.goto('file://' + target); await p.waitForTimeout(600);
  const fresh = () => p.evaluate(() => { if (!Object.keys(S.chars).length || !cur()) { const ch = sampleChar(); S.chars[ch.id] = ch; S.cur = ch.id; } if (S.camp) { try { leaveCamp && leaveCamp(); } catch (e) {} S.camp = ''; } render(); });
  await fresh();
  const end = Date.now() + MIN * 60000;
  while (Date.now() < end) {
    n++;
    if (n % 150 === 0) { const w = widths[Math.floor(R() * widths.length)]; await p.setViewportSize({ width: w, height: w > 700 ? 900 : 844 }); steps.push('Breite ' + w); }
    if (n % 40 === 0) await fresh().catch(() => {});
    /* Kandidaten: sichtbare, bedienbare Elemente; nichts, was die Seite verlässt, Dateien wählt oder alles löscht */
    const c = await p.evaluate(() => {
      const sel = 'button:not([disabled]),[data-act]:not([disabled]),select:not([disabled]),input:not([disabled]):not([type=file]),textarea,summary,[role=tab]';
      const bad = /^(wipeAll|delAll|resetAll|factoryReset|campLeave|leaveCamp|joinCamp|campJoin|campCreate|dlApp|exportAll|print)$/;
      const L = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.pointerEvents === 'none') return false; if (e.closest('[inert],[hidden]')) return false; if (e.tagName === 'A' && e.href && !e.href.startsWith('#')) return false; return !bad.test(e.dataset.act || ''); });
      L.forEach((e, i) => e.setAttribute('data-zs', i)); return L.map((e) => ({ tag: e.tagName, type: e.type || '', act: e.dataset.act || '', arg: (e.dataset.arg || '').slice(0, 30), txt: (e.textContent || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 30), opts: e.tagName === 'SELECT' ? e.options.length : 0 }));
    }).catch(() => []);
    if (!c.length) { await fresh().catch(() => {}); continue; }
    const i = Math.floor(R() * c.length); const e = c[i]; const loc = p.locator('[data-zs="' + i + '"]').first();
    const view = await p.evaluate(() => S.view + (S.view === 'sheet' ? ':' + S.mg : '') + (S.modal ? ' [' + S.modal + ']' : '')).catch(() => '?');
    try {
      if (e.tag === 'SELECT' && e.opts) { const k = Math.floor(R() * e.opts); await loc.selectOption({ index: k }, { timeout: 1500 }); steps.push(view + ' · Auswahl ' + (e.act || e.txt) + ' → #' + k); }
      else if (e.tag === 'INPUT' && /^(text|number|search|)$/.test(e.type)) { const v = e.type === 'number' ? String(Math.floor(R() * 40) - 5) : ['Ork', '17', '<b>x</b>', '', 'Ä ö ü «»', '9 9'][Math.floor(R() * 6)]; await loc.fill(v, { timeout: 1500 }); await loc.dispatchEvent('change').catch(() => {}); steps.push(view + ' · Feld ' + (e.act || e.txt || e.type) + ' = ' + v); }
      else if (e.tag === 'TEXTAREA') { await loc.fill('Notiz ' + n, { timeout: 1500 }); steps.push(view + ' · Text'); }
      else { await loc.click({ timeout: 1500, force: false }); steps.push(view + ' · ' + (e.act ? e.act + (e.arg ? '(' + e.arg + ')' : '') : e.tag) + ' «' + e.txt + '»'); }
    } catch (x) { steps.push(view + ' · übersprungen ' + (e.act || e.tag)); }
    if (steps.length > 400) steps.splice(0, 200);
    await p.waitForTimeout(40 + Math.floor(R() * 120));
  }
  const ok = await p.evaluate(() => typeof render === 'function' && !!document.querySelector('#view')).catch(() => false);
  console.log('Schritte:', n, '· Startwert', SEED, '· Minuten', MIN);
  T('App lebt nach ' + n + ' zufälligen Schritten', ok);
  const uniq = []; const seen = new Set(); for (const e of errs) { const k = e.typ + e.msg; if (!seen.has(k)) { seen.add(k); uniq.push(e); } }
  T('keine Seiten- oder Konsolenfehler', uniq.length === 0, uniq.slice(0, 6));
  console.log('\n' + pass + ' bestanden, ' + fail + ' fehlgeschlagen'); await b.close(); process.exit(fail ? 1 : 0);
})();
