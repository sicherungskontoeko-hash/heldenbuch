/* Fablecrown: Umbenennung und Bildmarke (Auftrag Branding, Prüfungen B01–B15, soweit automatisch prüfbar).
   Prüft beide Fassungen (Artifact index.html, Standalone/PWA app/www), die Icon-Ableitungen aus dem Original,
   unveränderte technische Kennungen, alte Spielstände und Sicherungen (Testbestand aus b6d5552 in tests/fixtures)
   und – nur mit --alt=<Ordner mit alter app/www> – alte und neue Geräte im selben Raum (lokaler Broker, Ports 8902/8903/8904).
   Voraussetzung: bash build.sh; python3 build_app.py · Aufruf: node tests/fc-marke.test.js [--alt=/pfad/zu/alt/app/www] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const crypto = require('crypto'); const cp = require('child_process'); const http = require('http');
const Q = path.resolve(__dirname, '..'); const R = path.dirname(Q); const WWW = path.join(Q, 'app', 'www'); const FX = path.join(__dirname, 'fixtures');
const ALT = (process.argv.find((a) => a.startsWith('--alt=')) || '').slice(6);
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const rd = (f) => fs.readFileSync(f, 'utf8');

(async () => {
  /* ---------- statisch: Icons aus dem Original, technische Kennungen ---------- */
  T('B02 Original unverändert abgelegt (SHA-256 wie Auftragspaket)', sha(path.join(Q, 'marke', 'Fablecrown_Logo_Original.png')) === '7b58e856b952b58a0ae8e029d2b13fe6f9b22101a617b545c6b7297fcab9792b');
  /* Ableitungen nachvollziehbar: frisch aus dem Original erzeugt = eingecheckte Dateien */
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'fcicons-'));
  const gen = cp.spawnSync('python3', [path.join(Q, 'marke', 'icons.py'), '--pruef'], { cwd: Q, encoding: 'utf8' });
  const vz = path.join(Q, 'marke', 'vorschau');
  const pairs = [['icons_icon-192.png', 'www/icons/icon-192.png'], ['icons_icon-512.png', 'www/icons/icon-512.png'], ['icons_icon-maskable-512.png', 'www/icons/icon-maskable-512.png'], ['icons_apple-touch-icon.png', 'www/icons/apple-touch-icon.png'], ['icons_favicon-32.png', 'www/icons/favicon-32.png'], ['build_icon.png', 'build/icon.png'], ['mipmap-xxxhdpi_ic_launcher_foreground.png', 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png'], ['mipmap-mdpi_ic_launcher_round.png', 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png'], ['drawable-port-xhdpi_splash.png', 'android/app/src/main/res/drawable-port-xhdpi/splash.png'], ['header-96.webp', 'quelle/marke/header-96.webp']];
  const diff = gen.status === 0 ? pairs.filter(([a, b]) => !fs.existsSync(path.join(vz, a)) || sha(path.join(vz, a)) !== sha(path.join(R, b))) : ['icons.py: ' + (gen.stderr || '').slice(-200)];
  T('B02 Alle Icons sind die Ableitungen aus dem Original (icons.py erzeugt dieselben Dateien)', diff.length === 0, diff);
  fs.rmSync(vz, { recursive: true, force: true }); fs.rmSync(tmp, { recursive: true, force: true });
  const png = (f) => { const b = fs.readFileSync(path.join(R, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  const sizes = { 'www/icons/favicon-32.png': 32, 'www/icons/icon-192.png': 192, 'www/icons/icon-512.png': 512, 'www/icons/icon-maskable-512.png': 512, 'www/icons/apple-touch-icon.png': 180, 'build/icon.png': 1024, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png': 48, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': 192, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png': 432 };
  T('B03 Grössen der Icons wie vorgesehen', Object.entries(sizes).every(([f, n]) => png(f)[0] === n && png(f)[1] === n), Object.fromEntries(Object.keys(sizes).map((f) => [f, png(f)])));
  /* Masken: goldenes Motiv liegt im sicheren Kreis (maskable 40 %, Android-Vordergrund 33/108) – mit Python messen */
  const rad = cp.spawnSync('python3', ['-c', "import sys,numpy as np\nfrom PIL import Image\nfor f in sys.argv[1:]:\n a=np.asarray(Image.open(f).convert('RGB')).astype(int); g=(a[...,1]>70)&(a[...,0]>120); y,x=np.nonzero(g); c=(a.shape[0]-1)/2; print(round(float(np.sqrt((x-c)**2+(y-c)**2).max())/a.shape[0],3))", path.join(R, 'www/icons/icon-maskable-512.png'), path.join(R, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png'), path.join(R, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png')], { encoding: 'utf8' }).stdout.trim().split('\n').map(Number);
  T('B04 Masken: Motiv im sicheren Bereich (maskable ≤ 0,40, Android-Vordergrund ≤ 0,306, rund ≤ 0,48)', rad[0] <= 0.401 && rad[1] <= 0.307 && rad[2] <= 0.481, rad);
  const pkg = JSON.parse(rd(path.join(R, 'package.json'))); const cap = JSON.parse(rd(path.join(R, 'capacitor.config.json'))); const grd = rd(path.join(R, 'android/app/build.gradle'));
  const net = rd(path.join(Q, 'appnet.js')); const appjs = rd(path.join(Q, 'app.js'));
  T('B10 App-Kennungen unverändert (appId, Android-Paket, Programmname, Download-Dateinamen)', pkg.build.appId === 'ch.heldenbuch.app' && cap.appId === 'ch.heldenbuch.app' && /applicationId "ch\.heldenbuch\.app"/.test(grd) && pkg.build.productName === 'Heldenbuch' && pkg.build.nsis.artifactName === 'Heldenbuch-Setup.${ext}' && pkg.build.portable.artifactName === 'Heldenbuch-Portable.${ext}' && pkg.build.linux.artifactName === 'Heldenbuch.${ext}' && pkg.build.dmg.artifactName === 'Heldenbuch.${ext}');
  T('B09 Raum- und Verschlüsselungsprotokoll unverändert (Präfix, Hash-Eingabe, Salt)', net.includes("const HB_PREFIX = 'heldenbuch-v2/';") && net.includes("'heldenbuch-raum:' + code") && net.includes("enc.encode('heldenbuch-e2e-v2')"));
  T('B07 Speicherschlüssel unverändert', ["localStorage.getItem('heldenbuch')", "'heldenbuch_myinit'", "'heldenbuch_camp'", "'heldenbuch_dm_'", "heldenbuch: 1,"].every((k) => appjs.includes(k)) && rd(path.join(Q, 'extra.js')).includes("'heldenbuch_mg'") && rd(path.join(Q, 'rules.js')).includes("'heldenbuch_backup_v1'") && rd(path.join(Q, 'welcome.js')).includes("'heldenbuch_player'"));
  const strs = rd(path.join(R, 'android/app/src/main/res/values/strings.xml'));
  T('B01 Android-Name Fablecrown, Paket-ID unverändert', /app_name">Fablecrown</.test(strs) && /package_name">ch\.heldenbuch\.app</.test(strs) && cap.appName === 'Fablecrown');
  T('B01 Fenstertitel der PC-App Fablecrown; MCP-Kennung «heldenbuch» bleibt', /title: 'Fablecrown'/.test(rd(path.join(R, 'electron/main.js'))) && /serverInfo: \{ name: 'heldenbuch', title: 'Fablecrown'/.test(rd(path.join(R, 'electron/mcp-bruecke.js'))));
  /* B14: jede verbleibende Altbezeichnung in den App-Quellen ist klassifiziert (technisch, Kommentar oder Altdatei-Hinweis) */
  const allow = [/heldenbuch_[a-z0-9_]+/, /'heldenbuch'/, /heldenbuch: 1/, /heldenbuchMonster/, /heldenbuch-(v2\/|raum:|e2e-v2)/, /github\.io\/heldenbuch\//, /&quot;heldenbuch&quot;: 1/, /^\s*(\/\*|\/\/|\*)/, /Fablecrown- oder Heldenbuch-Datei/, /«heldenbuch_defekt»/];
  const leftovers = [];
  for (const f of fs.readdirSync(Q).filter((x) => /\.(js|html)$/.test(x) && x !== 'index.html')) rd(path.join(Q, f)).split('\n').forEach((l, i) => { if (!/heldenbuch/i.test(l)) return; const rest = allow.reduce((s, re) => s.replace(new RegExp(re.source, 'g'), ''), l); if (/heldenbuch/i.test(rest) && !/^\s*(\/\*|\/\/|\*)/.test(l) && !/\/\*[^*]*[Hh]eldenbuch[^*]*\*\//.test(l)) leftovers.push(f + ':' + (i + 1) + ' ' + l.trim().slice(0, 100)); });
  T('B14 Keine unklassifizierte Altbezeichnung im Programmcode', leftovers.length === 0, leftovers.slice(0, 8));

  /* ---------- im Browser: beide Fassungen ---------- */
  const b = await chromium.launch(); const errs = [];
  const files = [['Artifact', 'file://' + path.join(Q, 'index.html')], ['Standalone', 'file://' + path.join(Q, 'app', 'Heldenbuch.html')]];
  const hdr = 'data:image/webp;base64,' + fs.readFileSync(path.join(Q, 'marke', 'header-96.webp')).toString('base64');
  for (const [name, url] of files) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    const ext = []; p.on('request', (r) => { const u = r.url(); if (!/^(file:|data:|blob:|about:)/.test(u) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) ext.push(u); });
    await p.addInitScript(() => { try { if (!sessionStorage.getItem('fcinit')) { localStorage.clear(); sessionStorage.setItem('fcinit', '1'); } } catch (e) {} });
    await p.goto(url); await p.waitForTimeout(900);
    const w = await p.evaluate(() => { const m = $('#modal'); const t = !m.hidden ? m.textContent : ''; return { welcome: /Willkommen bei Fablecrown/.test(t) && !/Heldenbuch/.test(t) }; });
    T('B01 ' + name + ': Willkommen bei Fablecrown', w.welcome, w);
    const r = await p.evaluate((hdr) => {
      try { setMyName('Test'); } catch (e) {} S.modal = null; $('#modal').hidden = true; localStorage.setItem('hb_sample_done', '1');
      const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id);
      const seen = []; const views = [['heroes'], ['sheet', 'kampf'], ['sheet', 'werte'], ['sheet', 'zauber'], ['sheet', 'gear'], ['sheet', 'faehig'], ['sheet', 'notiz'], ['build'], ['camp'], ['spells'], ['mobs'], ['hb'], ['help'], ['adv']];
      for (const [v, mg] of views) { S.view = v; if (mg) S.mg = mg; S.step = 0; render(); const tx = document.body.innerText; const m = tx.match(/.{0,40}Heldenbuch.{0,40}/g); if (m) seen.push(v + (mg ? '/' + mg : '') + ': ' + m.join(' | ')); }
      S.view = 'build'; for (let i = 0; i < 7; i++) { S.step = i; render(); const m = document.body.innerText.match(/.{0,40}Heldenbuch.{0,40}/g); if (m) seen.push('build/' + i + ': ' + m.join(' | ')); }
      S.view = 'help'; render(); const help = /So funktioniert Fablecrown/.test(document.body.innerText);
      S.view = 'heroes'; render(); const br = document.querySelector('#top .brand'); const img = br && br.querySelector('img.mark');
      return { seen, help, title: document.title, brand: br && br.textContent.trim(), img: !!img && img.getAttribute('src') === hdr && img.complete && img.naturalWidth === 96, svg: !!(br && br.querySelector('svg')), file: fileName(s), all: 'Fablecrown_Sicherung.json', invite: typeof inviteText === 'function' ? inviteText() : '' };
    }, hdr);
    T('B01 ' + name + ': Titel, Kopfzeile, Hilfe heissen Fablecrown', r.title === 'Fablecrown' && r.brand === 'Fablecrown' && r.help, r);
    T('B01 ' + name + ': keine sichtbare Altmarke in 21 Ansichten (Helden, Bogen-Reiter, Erschaffen 1–7, Tisch, Zauber, Bestiarium, Hausregeln, Hilfe, Abenteuer)', r.seen.length === 0, r.seen);
    T('B02 ' + name + ': Kopfzeile zeigt die Krone mit Feder (eingebettet, kein W20)', r.img && !r.svg, r);
    T('B12 ' + name + ': Einladung nennt Fablecrown, Raumcode und Link unverändert', /Fablecrown/.test(r.invite) && !/Heldenbuch/.test(r.invite), r.invite);
    T('B01 ' + name + ': Exportdateien <Held>_Fablecrown.json', /_Fablecrown\.json$/.test(r.file), r.file);
    /* B05: Kopf in allen Stimmungen und Breiten: Logo sichtbar, nicht verzerrt, kein Querscrollen */
    const th = await p.evaluate(async () => { const out = []; const list = typeof THEMES !== 'undefined' ? Object.keys(THEMES) : ['']; for (const w of [320, 390, 768, 1280]) { document.documentElement.style.width = ''; } for (const k of list) { try { setTheme(k, true); } catch (e) {} S.view = 'sheet'; render(); const im = document.querySelector('#top .brand img.mark'); const q = im && im.getBoundingClientRect(); out.push([k, q ? Math.round(q.width) + '×' + Math.round(q.height) : 'fehlt', document.documentElement.scrollWidth > innerWidth + 1]); } return out; });
    T('B05 ' + name + ': Bildmarke in allen Stimmungen sichtbar (quadratisch 28–30 px), kein Querscrollen', th.every(([, s, q]) => /^(28|30)×(28|30)$/.test(s) && s.split('×')[0] === s.split('×')[1] && !q), th);
    T('B11 ' + name + ': keine neuen Netzabrufe (Bildmarke eingebettet)', ext.length === 0, ext);
    await ctx.close();
  }
  /* Standalone-Metadaten, Manifest, PWA */
  const st = rd(path.join(Q, 'app', 'Heldenbuch.html')); const pwa = rd(path.join(WWW, 'index.html')); const man = JSON.parse(rd(path.join(WWW, 'manifest.webmanifest')));
  T('B06 Standalone: Titel, Favicon, Metadaten, Vorschau mit Fablecrown', /<title>Fablecrown<\/title>/.test(st) && /<link rel="icon" href="data:image\/png;base64,/.test(st) && /apple-mobile-web-app-title" content="Fablecrown"/.test(st) && /og:title" content="Fablecrown"/.test(st) && /og:site_name" content="Fablecrown"/.test(st) && !/content="Heldenbuch"/.test(st));
  T('B06 PWA: Manifest Fablecrown, Start und Bereich unverändert, Icons vorhanden', man.short_name === 'Fablecrown' && /^Fablecrown/.test(man.name) && man.start_url === './' && man.scope === './' && man.lang === 'de' && man.icons.every((i) => fs.existsSync(path.join(WWW, i.src))) && /rel="manifest"/.test(pwa) && /rel="apple-touch-icon"/.test(pwa), man);
  T('B06 PWA-Icons sind die neuen Icons', ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'].every((n) => sha(path.join(WWW, 'icons', n)) === sha(path.join(R, 'www', 'icons', n))));
  T('B11 Service Worker: Cache-Name technisch unverändert (heldenbuch-…), Icons im Offline-Cache', /const CACHE = 'heldenbuch-/.test(rd(path.join(WWW, 'sw.js'))) && /icons\/icon-512\.png/.test(rd(path.join(WWW, 'sw.js'))));
  const dl = rd(path.join(R, 'www', 'download.html'));
  T('B12 Download-Seite und Vorschau: Fablecrown, Links und Dateinamen unverändert', /<h1>Fablecrown<\/h1>/.test(dl) && /og:title" content="Fablecrown herunterladen"/.test(dl) && /releases\/latest\/download\/Heldenbuch\.apk/.test(dl) && /github\.io\/heldenbuch\/teilen\.jpg/.test(dl));
  T('B15 Lizenz und Drittmarken unverändert, kein ® oder ™, kein Anspruch auf offizielle Verbindung', !/Fablecrown\s*[®™]/.test(st + dl + rd(path.join(R, 'README.md'))) && /Kein offizielles Produkt von Wizards of the Coast/.test(st) && /This work includes material from the System Reference Document 5\.2\.1/.test(st) && /D&amp;D Beyond/.test(st));

  /* ---------- B07/B08: alte Spielstände und Sicherungen (Testbestand aus b6d5552) ---------- */
  const lsAlt = JSON.parse(rd(path.join(FX, 'alt_localstorage_b6d5552.json'))); const soll = JSON.parse(rd(path.join(FX, 'alt_werte_b6d5552.json')));
  for (const [name, url] of files) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ' B07: ' + e.message));
    await p.addInitScript((ls) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, lsAlt);
    await p.goto(url); await p.waitForTimeout(900);
    const r = await p.evaluate((soll) => { const ist = {}; for (const [id, c] of Object.entries(S.chars)) { const d = derive(c, S.hb); ist[id] = { name: c.name, ac: d.ac, hpMax: d.hpMax, init: d.init, pb: d.pb, saves: Object.fromEntries(Object.entries(d.saves).map(([k, v]) => [k, v.val])), slots: d.spell && d.spell.slots ? d.spell.slots : null, res: d.res.map((r) => [r.k, r.max, r.reset]) }; }
      return { same: JSON.stringify(ist) === JSON.stringify(soll.werte), n: Object.keys(ist).length, cur: S.cur === soll.cur, hb: !!S.hb.hbtest1, camp: S.camp === 'testraum-alt', note: localStorage.getItem('heldenbuch_dm_testraum-alt'), mg: localStorage.getItem('heldenbuch_mg'), broken: S.broken.size, ist }; }, soll);
    T('B07 ' + name + ': alter Bestand (b6d5552) lädt unverändert: ' + r.n + ' Helden, Werte gleich, aktiver Held, Hausregel, Raum, SL-Notiz', r.same && r.n === Object.keys(soll.werte).length && r.cur && r.hb && r.camp && r.note === 'SL-Notiz alt' && r.mg === 'zauber' && r.broken === 0, r.same ? r : { ist: r.ist, soll: soll.werte });
    const r2 = await p.evaluate(({ bk, one }) => { for (const id of Object.keys(S.chars)) delete S.chars[id]; S.hb = {}; let e1 = '', e2 = ''; try { importJson(bk); } catch (e) { e1 = e.message; } const n1 = Object.keys(S.chars).length; try { importJson(one); } catch (e) { e2 = e.message; } return { n1, n2: Object.keys(S.chars).length, e1, e2, hb: !!S.hb.hbtest1, again: exportData(Object.values(S.chars), true).length > 100 }; }, { bk: rd(path.join(FX, 'alt_sicherung_b6d5552.json')), one: rd(path.join(FX, 'alt_einzel_b6d5552.json')) });
    T('B08 ' + name + ': alte «Alles sichern»-Datei und alter Einzelexport lassen sich laden; neue Sicherung entsteht', !r2.e1 && !r2.e2 && r2.n1 === Object.keys(soll.werte).length && r2.n2 === r2.n1 + 1 && r2.hb && r2.again, r2);
    await ctx.close();
  }
  /* ---------- B09: alte und neue Geräte im selben Raum (nur mit --alt) ---------- */
  if (!ALT) console.log('– B09 alte und neue Geräte im selben Raum: nicht ausgeführt (alte App-Fassung fehlt; Aufruf mit --alt=<alter Ordner app/www>)');
  else if (!fs.existsSync(path.join(WWW, 'index.html')) || !fs.existsSync(path.join(ALT, 'index.html'))) T('B09 App-Fassungen vorhanden', false, [WWW, ALT]);
  else {
    const { Aedes } = require('aedes'); const wsStream = require('websocket-stream');
    const aedes = await Aedes.createBroker(); const bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, aedes.handle); await new Promise((res) => bsrv.listen(8902, res));
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
    const serve = (root, port) => new Promise((res) => { const s = http.createServer((q, o) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { o.writeHead(404); return o.end(); } o.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(o); }); s.listen(port, () => res(s)); });
    const wNeu = await serve(WWW, 8903), wAlt = await serve(ALT, 8904);
    const mk = async (port, nm) => { const c = await b.newContext(); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8902'); localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_name', 'Test'); localStorage.setItem('hb_sample_done', '1'); }); const pg = await c.newPage(); pg.on('pageerror', (e) => errs.push(nm + ': ' + e.message)); await pg.goto('http://localhost:' + port + '/'); await pg.waitForTimeout(900); await pg.evaluate(() => { S.modal = null; $('#modal').hidden = true; const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); }); return pg; };
    const N = await mk(8903, 'neu'), A = await mk(8904, 'alt'); const code = 'fc-b09-' + Math.random().toString(36).slice(2, 8);
    await N.evaluate((c) => { cur().name = 'Neu-Nora'; commit(false); S.share = true; S.secret = false; joinCamp(c); }, code);
    await A.evaluate((c) => { cur().name = 'Alt-Arno'; commit(false); S.share = true; S.secret = false; joinCamp(c); }, code);
    await N.waitForTimeout(3500);
    await N.evaluate(() => { d20(3, 'WURF-NEU', { kind: 'check:dex' }); hpChange(cur(), 'dmg', 4); }); await A.evaluate(() => { d20(1, 'WURF-ALT', { kind: 'check:dex' }); hpChange(cur(), 'dmg', 2); });
    await N.waitForTimeout(3000);
    const seeN = await N.evaluate(() => { const a = Object.values(S.table).find((x) => x.char === 'Alt-Arno'); return a ? { rolls: (a.rolls || []).map((x) => x.label), hp: a.hp, hpMax: a.hpMax } : null; });
    const seeA = await A.evaluate(() => { const a = Object.values(S.table).find((x) => x.char === 'Neu-Nora'); return a ? { rolls: (a.rolls || []).map((x) => x.label), hp: a.hp, hpMax: a.hpMax } : null; });
    T('B09 Alte (b6d5552) und neue Fassung im selben Raum: Würfe und TP kommen in beide Richtungen an, verschlüsselt lesbar', seeN && seeA && seeN.rolls.includes('WURF-ALT') && seeA.rolls.includes('WURF-NEU') && seeN.hpMax - seeN.hp === 2 && seeA.hpMax - seeA.hp === 4, { seeN, seeA });
    await N.evaluate(() => { S.meta = Object.assign({}, S.meta, { dm: UID }); saveMeta({ dm: UID }); }); await N.waitForTimeout(1500);
    await N.evaluate(() => { const t = document.createElement('button'); t.dataset.act = 'fightStart'; document.body.appendChild(t); t.click(); t.remove(); }); await N.waitForTimeout(2000);
    const fA = await A.evaluate(() => !!(S.combat && S.combat.active !== false));
    T('B09 Kampfstand der neuen SL kommt bei der alten Fassung an', fA, fA);
    bsrv.close(); wNeu.close(); wAlt.close(); aedes.close();
  }
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 6));
  await b.close();
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
