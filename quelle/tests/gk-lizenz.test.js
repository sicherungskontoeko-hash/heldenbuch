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
  const stripTags = (h) => h.replace(/<[^>]+>/g, '');
  for (const f of ['README.md', 'ANLEITUNG.md', 'www/download.html']) T('GK10-T05 ' + f + ' enthält die Attribution wortgetreu', norm(stripTags(fs.readFileSync(path.join(R, f), 'utf8'))).includes(SOLL));
  T('GK10-T01 Konstante SRD_ATTRIBUTION in data.js wortgetreu', fs.readFileSync(path.join(Q, 'data.js'), 'utf8').includes("const SRD_ATTRIBUTION = '" + SOLL + "';"));
  const b = await chromium.launch(); const errs = [];
  const files = [['Artifact', target]].concat(fs.existsSync(path.join(Q, 'app', 'Heldenbuch.html')) ? [['Standalone', path.join(Q, 'app', 'Heldenbuch.html')]] : []);
  const LINKS = ['https://www.dndbeyond.com/srd', 'https://creativecommons.org/licenses/by/4.0/legalcode'];
  for (const [name, file] of files) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); const ext = []; p.on('request', (r) => { const u = r.url(); if (!/^(file:|data:|blob:|about:)/.test(u) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) ext.push(u); });
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); }); await p.goto('file://' + file); await p.waitForTimeout(900);
    const r = await p.evaluate((LINKS) => { S.view = 'help'; render(); const el = document.querySelector('.hint.srdattr'); const foot = document.querySelector('.foot.srdattr');
      const links = (e) => [...e.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent, a.getAttribute('rel')]);
      return { help: el && el.textContent.replace(/\s+/g, ' ').trim(), hl: el && links(el), fl: foot && links(foot), foot: foot && foot.textContent.replace(/\s+/g, ' ').trim(), de: /Mit ✦ markierte Inhalte sind eigene Erfindungen/.test(document.getElementById('view').textContent), deFoot: [...document.querySelectorAll('.foot')].some((f) => /Deutsche Kurzfassungen in eigenen Worten/.test(f.textContent)), mark: SRC_DE.eigen,
        counts: { spells: Object.keys(SPELLS).length, classes: Object.keys(CLASSES).length, home: Object.values(CLASSES).filter((c) => c.home).length, species: Object.keys(SPECIES).length, mobs: Object.keys(BESTIARY).length, items: Object.keys(MAGIC_ITEMS).length } }; }, LINKS);
    const lk = (l) => l && l.length === 2 && l.every((x, i) => x[0] === LINKS[i] && x[1] === LINKS[i] && (!x[2] || /noopener/.test(x[2])));
    T('GK10-T02 ' + name + ': Hilfe und Fusszeile zeigen die Attribution wortgetreu, offline im Dokument, Verweise korrekt', r.help === SOLL && r.foot === SOLL && lk(r.hl) && lk(r.fl) && ext.length === 0, { r: [r.help && r.help.slice(0, 30), r.hl, r.fl], ext });
    T('GK10-T03 ' + name + ': deutsche Hinweise (eigene Kurzfassung, ✦) und Homebrew-Kennzeichnung intakt', r.de && r.deFoot && r.mark === '✦ eigene Erfindung', r);
    T('GK10-T04 ' + name + ': Inhalte und Homebrew-Markierungen wie b6d5552 (367 Zauber, 22 Klassen davon 10 ✦, 23 Völker, 184 Monster, 344 Gegenstände)', JSON.stringify(r.counts) === JSON.stringify({ spells: 367, classes: 22, home: 10, species: 23, mobs: 184, items: 344 }), r.counts);
    for (const w of [320, 390, 1280]) {
      await p.setViewportSize({ width: w, height: 800 });
      const v = await p.evaluate(() => { const out = {}; for (const view of ['heroes', 'sheet', 'help']) { S.view = view; render(); const vis = [...document.querySelectorAll('.srdattr')].filter((e) => !e.hidden && e.offsetParent !== null);
        out[view] = { n: vis.length, cut: vis.some((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.getBoundingClientRect().height + 1), over: document.documentElement.scrollWidth > window.innerWidth + 1 }; } return out; });
      T('GK10-T06 ' + name + ' ' + w + ' px: Lizenz je Ansicht genau einmal, nicht abgeschnitten, kein Überlaufen', Object.values(v).every((x) => x.n === 1 && !x.cut && !x.over), v);
    }
    await p.close();
  }
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  await b.close(); console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
