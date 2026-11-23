/* Download-Seite (www/download.html): alle Geräte, feste Links auf die neueste Version, eigenes Gerät zuerst,
   Versionsanzeige, Handy ohne Querscrollen. Aufruf: node tests/download.test.js */
const { chromium, devices } = require('playwright');
const path = require('path'); const fs = require('fs'); const http = require('http');
const page0 = path.resolve(__dirname, '..', '..', 'www', 'download.html');
(async () => {
  const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got }); const errs = [];
  const www = path.dirname(page0);
  const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; if (u === '/version.json') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ version: '1.9.33', build: 1795500000 })); } const f = path.join(www, u === '/' ? 'download.html' : u); if (!f.startsWith(www) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise((res) => srv.listen(8897, '127.0.0.1', res));
  const b = await chromium.launch();
  const REL = 'https://github.com/sicherungskontoeko-hash/heldenbuch/releases/latest/download/';
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')).build;
  const names = { apk: 'Heldenbuch.apk', setup: pkg.nsis.artifactName.replace('${ext}', 'exe'), port: pkg.portable.artifactName.replace('${ext}', 'exe'), dmg: pkg.dmg.artifactName.replace('${ext}', 'dmg'), app: pkg.linux.artifactName.replace('${ext}', 'AppImage') };
  for (const [nm, dev, os] of [['Android', devices['Pixel 7'], 'android'], ['iPhone', devices['iPhone 13'], 'ios'], ['Windows', { viewport: { width: 1366, height: 768 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36' }, 'windows'], ['Mac', { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15' }, 'mac']]) {
    const ctx = await b.newContext(dev); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://127.0.0.1:8897/download.html'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ first: document.querySelector('#list .card').dataset.os, mine: !!document.querySelector('.card.mine .tag'), hs: document.documentElement.scrollWidth > innerWidth + 1, links: [...document.querySelectorAll('a.btn')].map((a) => a.getAttribute('href')), ver: document.getElementById('ver').textContent }));
    T(nm + ': eigenes Gerät steht zuerst und ist markiert', r.first === os && r.mine, r);
    T(nm + ': kein Querscrollen', !r.hs);
    T(nm + ': Version angezeigt', /Version 1\.9\.33/.test(r.ver), r.ver);
    if (nm === 'Android') T('Links zeigen auf die neueste Version mit den festen Dateinamen aus package.json', Object.values(names).every((n) => r.links.includes(REL + n)) && r.links.includes('./'), { names, links: r.links });
    await ctx.close();
  }
  T('Keine Skriptfehler', !errs.length, errs);
  await b.close(); srv.close();
  let ok = 0; for (const x of out) { console.log((x.ok ? '✔ ' : '✘ ') + x.n + (x.ok ? '' : ' → ' + String(JSON.stringify(x.got)).slice(0, 600))); if (x.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
