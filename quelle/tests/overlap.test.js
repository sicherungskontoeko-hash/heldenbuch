/* Überdeckungen: Auf 9 Bildschirmgrössen und in allen Ansichten muss jedes Bedienelement und jeder Text in
   mindestens einer Scrollposition unverdeckt lesbar sein; kein waagrechtes Scrollen, keine abgeschnittenen Knöpfe.
   Dazu: Kopfleiste, Reiterleiste und untere Navigation sind deckend (nichts scheint durch).
   Aufruf: node tests/overlap.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const { scan } = require('./overlap-lib');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const VPS = [[320, 568], [360, 740], [390, 844], [412, 915], [768, 1024], [900, 600], [1024, 768], [1366, 768], [1920, 1080]];

const STATES = [
  ['Heldenliste', { view: 'heroes' }],
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ['Erschaffen Schritt ' + (i + 1), { view: 'build', step: i }]),
  ...['kampf', 'werte', 'zauber', 'faehig', 'gear', 'begleiter', 'notiz'].map((m) => ['Bogen ' + m, { view: 'sheet', mg: m }]),
  ['Bogen bei 0 TP', { view: 'sheet', mg: 'kampf', hp0: true }],
  ['Abenteuer-Bibliothek', { view: 'adv', adv: null }],
  ['Abenteuer offen', { view: 'adv', adv: 'krug' }],
  ['Zauberbuch', { view: 'spells' }],
  ['Bestiarium', { view: 'mobs' }],
  ['Hausregeln', { view: 'hb' }],
  ['Hilfe', { view: 'help' }],
  ['Tisch', { view: 'camp' }]
];
const MODALS = [['Würfelverlauf', 'histOpen'], ['Hilfe-Einstellungen', 'hlOpen'], ['Stolperstein', 'stOpen'], ['Claude fragen', 'slOpen'], ['Chronik', 'chrOpen'], ['Kampagnenbuch', 'kbOpen']];

(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  let total = 0;
  for (const [w, h] of VPS) {
    const m = w < 700; const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(w + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(450);
    await p.evaluate(() => {
      localStorage.setItem('hb_name', 'Test'); localStorage.setItem('hb_dice_fx', 'ruhig');
      if (S.modal === 'welcome') { S.modal = null; $('#modal').hidden = true; }
      const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id);
      for (let i = 0; i < 2; i++) { const x = sampleChar(); x.name = 'Held ' + (i + 2); S.chars[x.id] = x; persist('c', x.id); }
      for (let i = 0; i < 5; i++) histAdd({ label: 'Wurf ' + i, total: 10 + i, detail: 'W20 ' + (5 + i) + ' +5' });
    });
    const bad = [];
    const run = async (name, st, act) => {
      await p.evaluate((st) => { S.modal = null; $('#modal').hidden = true; const c = cur(); if (c) c.play.hp = st.hp0 ? 0 : null; S.view = st.view; if ('step' in st) S.step = st.step; if (st.mg) S.mg = st.mg; if ('adv' in st) S.adv = st.adv; render(); window.scrollTo(0, 0); }, st);
      if (act) { const has = await p.evaluate((a) => { if (typeof XA[a] !== 'function') return false; XA[a](); return true; }, act); if (!has) return; }
      await p.waitForTimeout(120);
      if (act && !(await p.evaluate(() => !!S.modal && !$('#modal').hidden))) return;
      const r = await scan(p, w + '×' + h + ' ' + name); total++;
      if (r.covered.length || r.cut.length || r.hscroll) bad.push(r);
    };
    for (const [n, st] of STATES) await run(n, st);
    for (const [n, a] of MODALS) await run(n + ' (Fenster)', { view: 'sheet', mg: 'kampf' }, a);
    /* Deckende Leisten: Kopf, Reiter und untere Navigation lassen nichts durchscheinen */
    const trans = await p.evaluate(() => { S.view = 'sheet'; S.mg = 'kampf'; render(); window.scrollTo(0, 400);
      const a = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; const q = m[1].split(/[ ,/]+/).filter(Boolean); return q.length > 3 ? +q[3] : 1; };
      return ['#top', '.shbar', '#bnav', '.mnav'].filter((q) => { const e = document.querySelector(q); if (!e || !e.getClientRects().length || getComputedStyle(e).display === 'none') return false; const c = getComputedStyle(e); const bgImg = c.backgroundImage && c.backgroundImage !== 'none'; return a(c.backgroundColor) < 0.99 && !bgImg && (q !== '.mnav' || getComputedStyle(e).position === 'sticky' && !e.closest('.shbar')); }); });
    T(w + '×' + h + ': Leisten deckend', !trans.length, trans);
    T(w + '×' + h + ': nichts dauerhaft verdeckt, nichts abgeschnitten, kein Querscrollen', !bad.length, bad.map((r) => ({ wo: r.name, verdeckt: r.covered.slice(0, 4), abgeschnitten: r.cut.slice(0, 4), quer: r.hscroll, breit: r.wide })));
    await ctx.close();
  }
  T('Ansichten geprüft: ' + total, total >= VPS.length * (STATES.length + 3));
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close();
  let ok = 0; for (const r of out) { console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : ' → ' + JSON.stringify(r.got, null, 1))); if (r.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
