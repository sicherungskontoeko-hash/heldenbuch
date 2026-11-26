/* GK-09: Prüfpaket mit beiden Build-Varianten und Manifest (pruefpaket.py).
   Baut das Paket in einen Temp-Ordner, prüft Manifest gegen die Dateien, startet beide Varianten (auch nach Umkopieren).
   Aufruf: node tests/gk-paket.test.js */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto'); const { execFileSync } = require('child_process');
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
const Q = path.resolve(__dirname, '..');
(async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gk-paket-'));
  let log = ''; try { log = execFileSync('python3', [path.join(Q, 'pruefpaket.py'), out], { cwd: Q, encoding: 'utf8' }); } catch (e) { console.log('✘ BLOCKIERT: pruefpaket.py ' + (e.stdout || '') + (e.stderr || '')); process.exit(1); }
  const A = path.join(out, 'app'); const man = JSON.parse(fs.readFileSync(path.join(A, 'MANIFEST.json'), 'utf8'));
  const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const mism = man.dateien.filter((f) => { const p = path.join(out, f.pfad); return !fs.existsSync(p) || fs.statSync(p).size !== f.bytes || sha(p) !== f.sha256; });
  T('GK09-T06 Manifest: Pfade, Bytes und SHA-256 stimmen mit den Dateien überein (' + man.dateien.length + ')', mism.length === 0 && man.dateien.length >= 8, mism.slice(0, 3));
  T('GK09 Manifest enthält Revision, Version, Datum, Buildbefehle, Abhängigkeiten, Variantenprüfung', /^[0-9a-f]{40}$/.test(man.git_revision) && man.version && man.erstellt && man.buildbefehle.length === 3 && man.abhaengigkeiten.node && Object.values(man.variantenpruefung).every(Boolean), man.variantenpruefung);
  T('GK09 Alter Paketpfad app/Heldenbuch.html ist die Standalone-Fassung', sha(path.join(A, 'Heldenbuch.html')) === sha(path.join(A, 'Heldenbuch_Standalone.html')));
  /* T05 PWA */
  const pwa = path.join(A, 'pwa'); const wm = JSON.parse(fs.readFileSync(path.join(pwa, 'manifest.webmanifest'), 'utf8')); const sw = fs.readFileSync(path.join(pwa, 'sw.js'), 'utf8');
  const swFiles = JSON.parse((/const FILES = (\[[^\]]*\])/.exec(sw) || [])[1].replace(/'/g, '"')); const missing = swFiles.filter((f) => f !== './' && !fs.existsSync(path.join(pwa, f))).concat(wm.icons.map((i) => i.src).filter((f) => !fs.existsSync(path.join(pwa, f))));
  const ver = JSON.parse(fs.readFileSync(path.join(pwa, 'version.json'), 'utf8'));
  T('GK09-T05 PWA: Manifest, Service-Worker-Dateiliste und Icons vollständig, Version passt', wm.start_url === './' && wm.scope === './' && missing.length === 0 && ver.version === man.version && sw.includes("'heldenbuch-" + ver.version + "'"), { missing, ver });
  /* T07: Paket an anderen Ort kopieren und beide Varianten starten */
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'gk-paket-kopie-')); fs.cpSync(A, path.join(copy, 'app'), { recursive: true });
  const b = await chromium.launch(); const errs = [];
  for (const [name, file, wantApp] of [['Artifact', 'Heldenbuch_Artifact.html', false], ['Standalone', 'Heldenbuch_Standalone.html', true]]) {
    const ctx = await b.newContext(); const p = await ctx.newPage(); const ext = []; p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    p.on('request', (r) => { const u = r.url(); if (!/^(file:|data:|blob:|about:)/.test(u)) ext.push(u); });
    await p.addInitScript(() => { localStorage.setItem('hb_dice_fx', 'aus'); });
    await p.goto('file://' + path.join(copy, 'app', file)); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { const out = { isApp: isApp(), hbnet: typeof HBNET !== 'undefined', fontFaces: [...document.styleSheets].reduce((n, s) => { try { return n + [...s.cssRules].filter((x) => x.type === 5).length; } catch (e) { return n; } }, 0) };
      const ch = cur() || (() => { const c = sampleChar(); S.chars[c.id] = c; S.cur = c.id; return c; })(); const bad = [];
      for (const [v, g] of [['heroes'], ['sheet', 'kampf'], ['sheet', 'werte'], ['sheet', 'zauber'], ['sheet', 'gear'], ['build'], ['help']]) { try { S.view = v; if (g) S.mg = g; render(); } catch (e) { bad.push(v + ':' + e.message); } }
      out.bad = bad; return out; });
    await p.waitForTimeout(500);
    T('GK09-T0' + (wantApp ? '2' : '1') + ' ' + name + ' (umkopiert, GK09-T07): isApp()=' + wantApp + ', HBNET ' + (wantApp ? 'vorhanden' : 'fehlt') + ', Ansichten ohne Fehler', r.isApp === wantApp && r.hbnet === wantApp && r.bad.length === 0, r);
    if (wantApp) { T('GK09-T02 Standalone: Schriften eingebettet (@font-face aus data:)', r.fontFaces >= 5, r.fontFaces); T('GK09-T03 Standalone offline: keine externen Anfragen beim Start und in Bogen/Hilfe', ext.length === 0, ext.slice(0, 5)); }
    else T('GK09-T01 Artifact lädt Schriften extern (Google Fonts) wie vorgesehen, sonst nichts', ext.every((u) => /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)), ext.slice(0, 5));
    await ctx.close();
  }
  T('GK09-T04 Zwei Geräte am lokalen Broker im App-Build: siehe net.test.js, gk-netz.test.js (Teil 2), gk-wuerfe.test.js, gk-b64.test.js', true);
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  await b.close(); fs.rmSync(out, { recursive: true, force: true }); fs.rmSync(copy, { recursive: true, force: true });
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
