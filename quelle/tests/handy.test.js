/* Langsames Handy: CPU gedrosselt (Chromium-DevTools), Handy-Bildschirm, Würfel-Effekte an.
   Misst Start, Reiterwechsel, Würfeln, Kampfstart, Listen, Abenteuer, Stufenaufstieg und – falls DDB_DIR gesetzt – das Einlesen
   der grössten echten D&D-Beyond-PDF. Schwellen grosszügig: sie sollen Rückschritte fangen, nicht Hardware vermessen.
   Aufruf: node tests/handy.test.js [app/Heldenbuch.html] [--drossel=4] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const target = path.resolve(process.argv.find((a) => /\.html$/.test(a)) || path.join(__dirname, '..', 'index.html'));
const DR = +((process.argv.find((a) => a.startsWith('--drossel=')) || '--drossel=4').split('=')[1]);
const out = []; const T = (n, ok, got) => { out.push({ n, ok: !!ok, got }); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: DR });
  await cdp.send('Performance.enable');
  const t0 = Date.now(); await p.goto('file://' + target, { waitUntil: 'load' }); await p.waitForFunction(() => document.querySelector('#view *'));
  const tStart = Date.now() - t0;
  T('Start bis zur ersten Ansicht < ' + (DR >= 6 ? 9 : 6) + ' s', tStart < (DR >= 6 ? 9000 : 6000), tStart + ' ms');
  /* Zeit bis die Seite nach einer Aktion wieder ruhig ist: Aktion + zwei Bildaufbauten */
  const meas = (fn, arg) => p.evaluate(async ([src, a]) => { const f = eval('(' + src + ')'); const t = performance.now(); await f(a); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return Math.round(performance.now() - t); }, [fn.toString(), arg]);
  await p.evaluate(() => { localStorage.setItem('hb_sample_done', '1'); const ch = normChar(newChar({ name: 'Ilva Langsam', cls: 'wiz', level: 9, spells: ['fireball', 'shield', 'magic-missile', 'counterspell', 'misty-step', 'fly', 'haste', 'web', 'sleep', 'mage-armor'] })); S.chars[ch.id] = ch; S.cur = ch.id; persist('c', ch.id); S.view = 'sheet'; render(); });
  const ms = {};
  for (const tab of ['kampf', 'werte', 'zauber', 'faehig', 'gear', 'notiz', 'kampf']) ms['Reiter ' + tab] = await meas(async (t) => { const btn = document.querySelector('[data-act="mg"][data-arg="' + t + '"]'); if (!btn) throw new Error('Reiter fehlt: ' + t); btn.click(); }, tab);
  await p.evaluate(() => { XA.diceFx(null, 'voll'); });
  ms['Angriff würfeln (3D-Würfel an)'] = await meas(async () => { weaponAttack(cur(), 0); });
  await p.waitForTimeout(3000); await p.evaluate(() => { S.dp = null; S.prompt = null; render(); });
  ms['Zauberbuch öffnen (≈370 Zauber)'] = await meas(async () => { S.view = 'spells'; render(); });
  ms['Bestiarium öffnen'] = await meas(async () => { S.view = 'mobs'; render(); });
  ms['Bestiarium suchen «Gob»'] = await meas(async () => { const i = document.querySelector('#view input[type="search"], #view input'); if (i) { i.value = 'Gob'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
  ms['Kampfstart mit 8 Gegnern'] = await meas(async () => { S.camp = ''; S.combat = { id: 'k1', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 4 }, { mid: 'orc', n: 3 }, { mid: 'ogre', n: 1 }], '', {}); S.view = 'camp'; render(); });
  ms['Abenteuer öffnen'] = await meas(async () => { S.view = 'adv'; render(); });
  ms['Heldenliste'] = await meas(async () => { S.view = 'heroes'; render(); });
  ms['Bogen zurück'] = await meas(async () => { S.view = 'sheet'; render(); });
  const lim = DR >= 6 ? 1500 : 1000;
  for (const [k, v] of Object.entries(ms)) T(k + ' < ' + lim + ' ms', v < lim, v + ' ms');
  /* Speicher nach der Sitzung */
  const met = await cdp.send('Performance.getMetrics'); const heap = Math.round((met.metrics.find((m) => m.name === 'JSHeapUsedSize') || {}).value / 1048576);
  T('JS-Speicher nach der Sitzung < 250 MB', heap < 250, heap + ' MB');
  /* Grösste echte DDB-PDF */
  const dir = process.env.DDB_DIR;
  if (dir && fs.existsSync(dir)) {
    const f = fs.readdirSync(dir).filter((x) => /\.pdf$/i.test(x)).map((x) => path.join(dir, x)).sort((a, c) => fs.statSync(c).size - fs.statSync(a).size)[0];
    const r = await p.evaluate(async (a) => { const t = performance.now(); const F = await ddbFields(new Uint8Array(a)); const ok = ddbIsSheet(F); const r = ok ? ddbBuild(F, S.hb) : { err: 'kein Bogen' }; return { ms: Math.round(performance.now() - t), err: r.err || '' }; }, [...fs.readFileSync(f)]);
    T('Grösste DDB-PDF (' + Math.round(fs.statSync(f).size / 1024) + ' KB) eingelesen < 20 s', !r.err && r.ms < 20000, r);
  }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close();
  let ok = 0; console.log('CPU-Drossel ' + DR + '× · ' + path.basename(target));
  for (const r of out) { console.log((r.ok ? '✔ ' : '✘ ') + r.n + '  (' + (typeof r.got === 'string' ? r.got : JSON.stringify(r.got)) + ')'); if (r.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
