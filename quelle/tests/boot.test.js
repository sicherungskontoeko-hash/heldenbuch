/* Selbst-Update der Android-App (appboot.js): neue Version laden, beim nächsten Start nutzen, Helden behalten,
   kaputte Version verwerfen, neuere eingebaute Version bevorzugen, offline weiterlaufen.
   Braucht app/www (python3 build_app.py). Aufruf: node tests/boot.test.js */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'app', 'www', 'index.html'), 'utf8');
const variant = (b, t) => src.replace(/var BUILD = \d+/, 'var BUILD = ' + b).replace('<title>Heldenbuch</title>', '<title>' + t + '</title>');
const files = { app: variant(1000, 'Heldenbuch A'), remote: variant(2000, 'Heldenbuch B'), ver: JSON.stringify({ version: '9.9.9', build: 2000 }) };
let remoteUp = true;
const srv = (port, fn) => new Promise((res) => { const s = http.createServer((q, r) => { const o = fn(q.url.split('?')[0]); if (!o) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': o[0], 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }); r.end(o[1]); }).listen(port, '127.0.0.1', () => res(s)); });
(async () => {
  const s1 = await srv(8811, (u) => (u === '/' || u === '/index.html' ? ['text/html; charset=utf-8', files.app] : null));
  const s2 = await srv(8812, (u) => (!remoteUp ? null : u === '/version.json' ? ['application/json', files.ver] : u === '/index.html' ? ['text/html; charset=utf-8', files.remote] : null));
  const b = await chromium.launch(); const ctx = await b.newContext(); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await ctx.addInitScript(() => { window.HB_BOOT_TEST = { remote: 'http://127.0.0.1:8812/' }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const go = async () => { await p.goto('http://localhost:8811/'); await p.waitForFunction(() => document.querySelector('#view *'), null, { timeout: 15000 }); };
  const title = () => p.evaluate(() => document.title);
  /* 1. eingebaute Version startet, Held anlegen, Update wird im Hintergrund geladen */
  await go(); T('Start mit eingebauter Version', (await title()) === 'Heldenbuch A');
  await p.evaluate(() => { const n = newChar({ name: 'Brakk' }); S.chars[n.id] = n; persist('c', n.id); });
  await p.waitForSelector('#hbUpd', { timeout: 15000 }).catch(() => {});
  T('Hinweis „Neue Version geladen“ erscheint', await p.evaluate(() => !!document.getElementById('hbUpd') && /9\.9\.9/.test(document.getElementById('hbUpd').textContent)));
  T('Neue Version gespeichert', await p.evaluate(() => JSON.parse(localStorage.getItem('hb_remote') || '{}').build === 2000));
  /* 2. nächster Start: neue Version läuft, Held noch da */
  await go(); T('Nächster Start läuft mit der neuen Version', (await title()) === 'Heldenbuch B', await title());
  T('Held ist noch da', await p.evaluate(() => Object.values(S.chars).some((c) => c.name === 'Brakk')));
  await p.waitForTimeout(1500); T('Startmarkierung nach erfolgreichem Start gelöscht', await p.evaluate(() => !localStorage.getItem('hb_boot_pending')));
  T('Kein erneuter Update-Hinweis, wenn nichts Neueres da ist', await p.evaluate(() => new Promise((r) => setTimeout(() => r(!document.getElementById('hbUpd')), 4000))));
  /* 3. offline: gespeicherte Version startet trotzdem */
  remoteUp = false; await go(); T('Offline: gespeicherte Version startet', (await title()) === 'Heldenbuch B', await title()); remoteUp = true;
  /* 4. kaputte gespeicherte Version wird verworfen */
  await p.evaluate(async () => { const c = await caches.open('hb-remote'); await c.put('app', new Response('<p id="x">kaputt</p><!--HB_END-->', { headers: { 'Content-Type': 'text/html' } })); localStorage.setItem('hb_remote', JSON.stringify({ build: 3000, version: 'kaputt' })); });
  files.ver = JSON.stringify({ version: '9.9.9', build: 2000 });
  await p.goto('http://localhost:8811/'); await p.waitForTimeout(1500);
  T('Kaputte Version: erster Start zeigt sie (nicht erkennbar vorher)', await p.evaluate(() => !!document.getElementById('x')));
  await go(); T('Zweiter Start: kaputte Version verworfen, eingebaute läuft', (await title()) === 'Heldenbuch A', await title());
  T('Held auch danach noch da', await p.evaluate(() => Object.values(S.chars).some((c) => c.name === 'Brakk')));
  /* 5. unvollständiger Download wird nicht gespeichert */
  await p.evaluate(() => { localStorage.removeItem('hb_remote'); }); files.remote = files.remote.slice(0, 800000); files.ver = JSON.stringify({ version: '9.9.10', build: 2500 });
  await go(); await p.waitForTimeout(7000); T('Abgebrochener Download wird nicht übernommen', await p.evaluate(() => !localStorage.getItem('hb_remote')));
  /* 6. neuere APK (eingebaute Version) hat Vorrang vor gespeicherter älterer */
  files.remote = variant(2000, 'Heldenbuch B'); files.ver = JSON.stringify({ version: '9.9.9', build: 2000 });
  await go(); await p.waitForSelector('#hbUpd', { timeout: 15000 }).catch(() => {}); await go(); T('Vorbereitung: B gespeichert und aktiv', (await title()) === 'Heldenbuch B');
  files.app = variant(5000, 'Heldenbuch C'); await go(); T('Neuere eingebaute Version (APK-Update) läuft statt der gespeicherten', (await title()) === 'Heldenbuch C', await title());
  await p.waitForTimeout(2000); T('Ältere gespeicherte Version wird aufgeräumt', await p.evaluate(() => !localStorage.getItem('hb_remote')));
  /* 7. im Browser (nicht App) passiert nichts */
  const ctx2 = await b.newContext(); const p2 = await ctx2.newPage(); await p2.goto('http://localhost:8811/'); await p2.waitForTimeout(6000);
  T('Im normalen Browser: keine Update-Logik', await p2.evaluate(() => !localStorage.getItem('hb_remote') && !document.getElementById('hbUpd')));
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); s1.close(); s2.close(); process.exit(fail ? 1 : 0);
})();
