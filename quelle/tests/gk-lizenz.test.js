/* GK-10: SRD-5.2.1-Attribution wortgetreu in App-Hilfe, Fusszeile, Download-Seite und Dokumentation.
   Sollwert aus SRD_CC_v5.2.1.pdf, Seite 1 «Legal Information» (6 031 375 Bytes, SHA-256 8974902d…3d87).
   Mit SRD_PDF=<Pfad zur PDF> wird der Sollwert zusätzlich direkt aus der Datei gelesen (pdftotext).
   Aufruf: node tests/gk-lizenz.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const Q = path.resolve(__dirname, '..'); const R = path.resolve(Q, '..');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(Q, 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 500))); };
const SOLL = 'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';
const norm = (s) => s.replace(/\s+/g, ' ').trim();
(async () => {
  if (process.env.SRD_PDF) { const t = execFileSync('pdftotext', ['-f', '1', '-l', '1', '-raw', process.env.SRD_PDF, '-'], { encoding: 'utf8' }); const a = t.slice(t.indexOf('This work includes'), t.indexOf('legalcode.') + 10).replace(/\/\n/g, '/').replace(/\s+/g, ' '); T('GK10-T01 Sollwert = Text der offiziellen PDF (Seite 1)', a === SOLL, a); }
  for (const f of ['README.md', 'ANLEITUNG.md', 'www/download.html']) T('GK10-T03 ' + f + ' enthält die Attribution wortgetreu', norm(fs.readFileSync(path.join(R, f), 'utf8')).includes(SOLL));
  T('GK10-T01 Konstante SRD_ATTRIBUTION in data.js wortgetreu', fs.readFileSync(path.join(Q, 'data.js'), 'utf8').includes("const SRD_ATTRIBUTION = '" + SOLL + "';"));
  const b = await chromium.launch(); const errs = [];
  const files = [['Artifact', target]].concat(fs.existsSync(path.join(Q, 'app', 'Heldenbuch.html')) ? [['Standalone', path.join(Q, 'app', 'Heldenbuch.html')]] : []);
  for (const [name, file] of files) for (const w of [320, 1280]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } }); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); }); await p.goto('file://' + file); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { S.view = 'help'; render(); const help = [...document.querySelectorAll('.srdattr')].map((e) => ({ t: e.textContent.replace(/\s+/g, ' ').trim(), lang: e.getAttribute('lang'), foot: e.classList.contains('foot') }));
      return { help, over: document.documentElement.scrollWidth > window.innerWidth + 1 }; });
    T('GK10-T02 ' + name + ' ' + w + ' px: Hilfe und Fusszeile zeigen die Attribution wortgetreu (Englisch, lang="en")', r.help.length >= 2 && r.help.every((x) => x.t === SOLL && x.lang === 'en') && r.help.some((x) => x.foot) && r.help.some((x) => !x.foot), r.help.map((x) => x.t.slice(0, 40)));
    T('GK10-T02 ' + name + ' ' + w + ' px: kein waagrechtes Überlaufen', !r.over);
    await p.close();
  }
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  await b.close(); console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
