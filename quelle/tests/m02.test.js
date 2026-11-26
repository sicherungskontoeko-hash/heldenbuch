/* M02 – Erschaffen am Handy: Auswahl vor Zusammenfassung, kompakte Schritte, alles erreichbar.
   Aufruf: node tests/m02.test.js [app.html] [--fotos=ORDNER] [--nur-messen]
   Zielwerte (HB-UI-REDESIGN v1.2.0, M02), Hilfe-Stufe Standard, Stimmung warm, Kämpferin 5:
     erste Klassenkarte 390×844 ≤ 380, 320×568 ≤ 480 · Zusammenfassung eingeklappt ≤ 60 px, ⚠-Anzahl sichtbar · PC unverändert (± 2 px). */
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const fotos = (args.find((a) => a.startsWith('--fotos=')) || '').slice(8);
const nurMessen = args.includes('--nur-messen');
const ZIEL = { '320x568': 480, '360x740': 380, '390x844': 380, '430x932': 380 };
const PC_VORHER = { '1280x900': 400, '1440x900': 400 };
const out = []; const errs = []; const mess = {};
const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
const START = () => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_theme', 'warm'); if (typeof hlSetLevel === 'function') hlSetLevel('std');
  Object.keys(S.chars).forEach((k) => delete S.chars[k]);
  const f = normChar(newChar({ name: 'Mira Klingensang', cls: 'fig', level: 5, sub: 'champion', species: 'human', bg: 'criminal', bgPlus: { dex: 2, con: 1 }, base: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 }, classSkills: ['ath', 'prc'], styles: ['fs-defense'], armor: 'chainmail', shield: true, weapons: [{ w: 'longsword', mastery: true }, { w: 'handaxe', mastery: true }, { w: 'longbow', mastery: true }] }));
  S.chars[f.id] = f; S.cur = f.id; S.camp = ''; S.view = 'build'; S.step = 0; S.sumOpen = false; S.warnOpen = false; render(); window.scrollTo(0, 0); };
const lage = () => { const box = (s) => { const e = document.querySelector(s); if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return { y: Math.round(r.top + scrollY), h: Math.round(r.height), l: Math.round(r.left), r: Math.round(r.right) }; };
  const ol = document.querySelector('.build>.steps'); const steps = [...ol.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.width > 0; });
  const sw = document.querySelector('.summary .swarn'); const swv = sw && getComputedStyle(sw).display !== 'none' ? sw.innerText.replace(/\s+/g, ' ').trim() : null;
  return { karte: box('.cards.pics .card'), summary: box('.summary'), banner: box('.build') && box('.hero-intro.banner'), schritteSichtbar: steps.every(Boolean), schritteQuer: ol.scrollWidth > ol.clientWidth + 1, warnung: swv, offen: derive(cur(), S.hb).warn.length, quer: document.documentElement.scrollWidth > innerWidth + 1 }; };
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 568], [360, 740], [390, 844], [430, 932], [768, 1024], [1280, 900], [1440, 900]]) {
    const k = w + 'x' + h; const mob = w <= 820;
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob, deviceScaleFactor: mob ? 2 : 1 }); p.on('pageerror', (e) => errs.push(k + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(500);
    await p.evaluate(START); await p.waitForTimeout(150);
    const m = await p.evaluate(lage); mess[k] = m;
    if (fotos && [320, 390, 1280].includes(w)) await p.screenshot({ path: path.join(fotos, 'm02-' + w + '.png') });
    if (ZIEL[k]) T(k + ': erste Klassenkarte oben ≤ ' + ZIEL[k] + ' px', m.karte && m.karte.y <= ZIEL[k], m.karte);
    if (PC_VORHER[k]) T(k + ': PC unverändert (erste Klassenkarte ' + PC_VORHER[k] + ' ± 2 px)', m.karte && Math.abs(m.karte.y - PC_VORHER[k]) <= 2, m.karte);
    if (mob) {
      T(k + ': Zusammenfassung eingeklappt ≤ 60 px', m.summary && m.summary.h <= 60, m.summary);
      T(k + ': ⚠-Anzahl in der eingeklappten Zusammenfassung sichtbar', m.offen > 0 && m.warnung === '⚠ ' + m.offen, [m.warnung, m.offen]);
      T(k + ': alle sieben Schritte ohne Wischen sichtbar', m.schritteSichtbar && !m.schritteQuer, m);
    }
    T(k + ': kein Querscrollen', !m.quer);
    if (!nurMessen) {
      const r = await p.evaluate(async () => { const res = {}; const q = (s) => document.querySelector('#view ' + s); const wait = (t) => new Promise((x) => setTimeout(x, t || 60));
        res.bannerSchritt = /Schritt 1 von 7 · Klasse/.test(q('.hero-intro.banner').textContent);
        q('.steps button[data-arg="3"]').click(); await wait(); res.schrittWechsel = S.step === 3 && /Schritt 4 von 7 · Fertigkeiten und Talente/.test(q('.hero-intro.banner').textContent) && q('.steps button.on').getAttribute('aria-current') === 'step';
        const nx = q('.stepnav .btn:not(.ghost)'); nx.click(); await wait(); res.weiter = S.step === 4;
        q('.steps button[data-arg="0"]').click(); await wait();
        const inp = q('.hname input'); inp.value = 'Mira Sturmklinge'; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); await wait(800); res.name = cur().name === 'Mira Sturmklinge';
        q('.card[data-arg="ran"]').click(); await wait(); res.klasse = cur().cls === 'ran';
        q('.card[data-arg="fig"]').click(); await wait();
        q('.card[data-arg="wiz"] .ii').click(); await wait(150); res.infokarte = !!document.querySelector('.infodlg .ipic'); document.getElementById('modal').hidden = true; S.modal = null;
        if (innerWidth <= 820) { q('.summary .sumtg').click(); await wait(); res.aufklappen = S.sumOpen === true && getComputedStyle(q('.summary .sgrid')).display !== 'none';
          q('.summary .sumtg').click(); await wait(); res.zuklappen = S.sumOpen === false && getComputedStyle(q('.summary .sgrid')).display === 'none'; }
        else res.pcZusammenfassungOffen = getComputedStyle(q('.summary .sgrid')).display !== 'none' && /noch offen/.test(q('.summary .swarn').innerText);
        q('.summary .swarn') ? q('.summary .swarn').click() : null; await wait(150); res.warnListe = !!document.querySelector('#warnfab .wpan li') || innerWidth > 820;
        const li = document.querySelector('#warnfab .wpan li button'); if (li) { li.click(); await wait(150); } res.warnSprung = !li || S.view === 'build';
        S.warnOpen = false; render();
        for (let i = 0; i < 7; i++) { S.step = i; render(); await wait(20); } res.alleSchritte = S.step === 6 && !!q('.stepnav [data-act="view"][data-arg="sheet"]');
        res.datenErhalten = cur().name === 'Mira Sturmklinge' && cur().cls === 'fig' && cur().level === 5;
        return res; });
      Object.entries(r).forEach(([n, v]) => T(k + ': bedienbar – ' + n, v === true, v));
    }
    await p.close();
  }
  await b.close();
  T('Keine Skriptfehler', !errs.length, errs);
  console.log(JSON.stringify(mess));
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); process.exit(f && !nurMessen ? 1 : 0);
})();
