/* M03 – Bestiarium am Handy: Suche vor Einleitung, Banner schmal, alles erreichbar.
   Aufruf: node tests/m03.test.js [app.html] [--fotos=ORDNER] [--nur-messen]
   Zielwerte (HB-UI-REDESIGN v1.2.0, M03), Hilfe-Stufe Standard, Stimmung warm:
     Suchfeld Oberkante 390×844 ≤ 300, 320×568 ≤ 320 · erstes Monster 390×844 ≤ 650, 320×568 ≤ 500 · Banner am Handy ≤ 96 px hoch. */
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const fotos = (args.find((a) => a.startsWith('--fotos=')) || '').slice(8);
const nurMessen = args.includes('--nur-messen');
const ZIEL = { '320x568': { suche: 320, monster: 500 }, '390x844': { suche: 300, monster: 650 }, '360x740': { suche: 300, monster: 650 }, '430x932': { suche: 300, monster: 650 } };
const out = []; const errs = []; const mess = {};
const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
const START = () => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_theme', 'warm'); localStorage.removeItem('hb_mobs'); if (typeof ownMobsLoad === 'function') ownMobsLoad(); if (typeof hlSetLevel === 'function') hlSetLevel('std');
  S.mq = ''; S.mhab = ''; S.mlv = ''; S.camp = ''; S.view = 'mobs'; render(); window.scrollTo(0, 0); };
const lage = () => { const y = (s) => { const e = document.querySelector(s); return e && e.offsetParent ? Math.round(e.getBoundingClientRect().top + scrollY) : null; };
  const ban = document.querySelector('#view .hero-intro.banner');
  const cut = [...document.querySelectorAll('.mobsec .mact .btn, .mobsec>.row .fld>span, .mhabs .chip')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1 && !e.closest('.mhabs')).map((e) => e.textContent);
  return { suche: y('#mq'), stufe: y('#mlv'), fundorte: y('.mhabs'), knoepfe: y('.mact'), monster: y('#view details.mob'), banner: ban ? Math.round(ban.getBoundingClientRect().height) : null, quer: document.documentElement.scrollWidth > innerWidth + 1, abgeschnitten: cut }; };
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 568], [360, 740], [390, 844], [430, 932], [768, 1024], [1280, 900], [1440, 900]]) {
    const k = w + 'x' + h; const mob = w <= 820;
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob, deviceScaleFactor: mob ? 2 : 1 }); p.on('pageerror', (e) => errs.push(k + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(500);
    await p.evaluate(START); await p.waitForTimeout(150);
    const m = await p.evaluate(lage); mess[k] = m;
    if (fotos && [320, 390, 1280].includes(w)) await p.screenshot({ path: path.join(fotos, 'm03-' + w + '.png') });
    const z = ZIEL[k];
    if (z) { T(k + ': Suchfeld oben ≤ ' + z.suche + ' px', m.suche !== null && m.suche <= z.suche, m); T(k + ': erstes Monster oben ≤ ' + z.monster + ' px', m.monster !== null && m.monster <= z.monster, m); }
    if (mob) T(k + ': Banner höchstens 96 px hoch', m.banner !== null && m.banner <= 96, m.banner);
    T(k + ': kein Querscrollen, keine abgeschnittenen Knöpfe oder Beschriftungen', !m.quer && !m.abgeschnitten.length, m);
    if (mob) T(k + ': Reihenfolge Suche → Fundorte → Knöpfe → Liste', m.suche < m.fundorte && m.fundorte < m.knoepfe && m.knoepfe < m.monster, m);
    if (!nurMessen) {
      const r = await p.evaluate(async () => { const res = {}; const q = (s) => document.querySelector('#view ' + s);
        const has = (a) => { const e = q('[data-act="' + a + '"]'); return !!e && !!e.offsetParent; };
        res.knoepfeSichtbar = ['encOpen', 'encRandOpen', 'meNew', 'meShare'].every(has);
        const i = q('#mq'); i.value = 'goblin'; i.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((r) => setTimeout(r, 400));
        const names = [...document.querySelectorAll('#view details.mob summary b')].map((x) => x.textContent.toLowerCase());
        res.suche = names.length > 0 && names.every((n) => n.includes('goblin'));
        S.mq = ''; render();
        const sel = q('#mlv'); sel.value = '3'; sel.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 100)); res.stufe = S.mlv === '3'; S.mlv = ''; render();
        const c = q('.mhabs [data-act="mHab"][data-arg="hoehle"]'); if (c) c.click(); res.fundort = S.mhab === 'hoehle'; S.mhab = ''; render();
        const d = q('details.mob'); d.open = true; await new Promise((r) => setTimeout(r, 50)); res.wertblock = !!d.querySelector('.atks .rb') && !!d.querySelector('.mpicL');
        q('[data-act="encRandOpen"]').click(); await new Promise((r) => setTimeout(r, 150)); res.zufall = !document.getElementById('modal').hidden; document.getElementById('modal').hidden = true; S.modal = null;
        q('[data-act="encOpen"]').click(); await new Promise((r) => setTimeout(r, 150)); res.planer = !document.getElementById('modal').hidden; document.getElementById('modal').hidden = true; S.modal = null;
        q('[data-act="meNew"]').click(); await new Promise((r) => setTimeout(r, 150)); res.eigenesMonster = !document.getElementById('modal').hidden; document.getElementById('modal').hidden = true; S.modal = null; S.me = null;
        res.bilder = Object.keys(BESTIARY).length === document.querySelectorAll('#view details.mob.haspic .mpic').length;
        return res; });
      Object.entries(r).forEach(([n, v]) => T(k + ': bedienbar – ' + n, v === true, v));
    }
    await p.close();
  }
  // Einsteiger: Einleitung zum Sortieren steht am Handy im Abschnitt (statt im Banner)
  { const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await p.goto('file://' + target); await p.waitForTimeout(400);
    const e = await p.evaluate(() => { hlSetLevel('neu'); S.view = 'mobs'; render(); const m = document.querySelector('.mobsec .mintro'); const r = !!m && !!m.offsetParent && /vier Helden/.test(m.textContent); hlSetLevel('std'); return r; });
    T('390x844 Einsteiger: Erklärung zur Sortierung sichtbar', e); await p.close(); }
  await b.close();
  T('Keine Skriptfehler', !errs.length, errs);
  console.log(JSON.stringify(mess));
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); process.exit(f && !nurMessen ? 1 : 0);
})();
