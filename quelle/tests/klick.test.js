/* Klick-Fuzz: In jeder Ansicht, jedem Bogen-Reiter, jedem Erstellungsschritt, am Tisch als Spielleitung im Kampf und in beiden
   Abenteuern wird jeder sichtbare Knopf mit data-act einzeln angetippt – jedes Mal von einem frischen, gleichen Ausgangszustand.
   Geprüft: keine Skriptfehler, die Ansicht bleibt bedienbar (#view nicht leer, render() läuft), kein «undefined»/«NaN» im Text,
   kein Held verschwindet (ausser beim Löschen), offene Fenster lassen sich schliessen.
   Aufruf: node tests/klick.test.js [app.html] [--schnell] */
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const schnell = args.includes('--schnell');
const LOESCHEN = new Set(['delChar', 'meDel', 'advDel', 'chrDel', 'kbDel', 'hbDel', 'compDel', 'rmW', 'invDel', 'itemDel', 'encDel', 'mcDel', 'stClear', 'histClear']);
const befunde = []; let klicks = 0;

/* Ausgangszustand: drei Helden, je nach Szene Ansicht, Reiter, Schritt, Tisch */
const BASIS = (sz) => {
  const m = document.getElementById('modal'); if (m) { m.hidden = true; m.innerHTML = ''; } S.modal = null; S.more = false; S.confirm = null; S.hpOpen = false; S.warnOpen = false; S.sumOpen = false; S.advDel = null; S.advReset = null;
  localStorage.setItem('hb_dice_fx', 'aus'); window.print = () => {}; window.open = () => null; if (typeof hlSetLevel === 'function') hlSetLevel('std');
  Object.keys(S.chars).forEach((k) => delete S.chars[k]);
  const w = normChar(newChar({ name: 'Ilsa', cls: 'wiz', level: 5, sub: 'evoker', species: 'elf', bg: 'sage', cantrips: ['fire-bolt', 'mage-hand', 'light'], spells: ['magic-missile', 'shield', 'misty-step', 'fireball', 'sleep', 'mage-armor'], weapons: [{ w: 'quarterstaff' }], comps: [{ t: 'f-owl' }] })); w.id = 'h_wiz'; S.chars.h_wiz = w;
  const f = normChar(newChar({ name: 'Mira', cls: 'fig', level: 5, sub: 'champion', species: 'human', bg: 'criminal', armor: 'chainmail', shield: true, weapons: [{ w: 'longsword', mastery: true }, { w: 'handaxe' }, { w: 'longbow' }], comps: [{ t: 'steed' }] })); f.id = 'h_fig'; S.chars.h_fig = f;
  const r = normChar(newChar({ name: 'Brakk', cls: sz.cls2 || 'bar', level: sz.lv2 || 3, sub: sz.sub2 || 'berserker', species: 'orc', bg: 'soldier', weapons: [{ w: 'greataxe' }] })); r.id = 'h_3'; S.chars.h_3 = r;
  S.cur = sz.held || 'h_fig'; S.camp = ''; S.combat = null; S.meta = { dm: null, mercy: {} }; S.table = {};
  if (sz.tisch) { UID = 'me1'; window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (x) => { S.meta = Object.assign({}, S.meta, x); paintCamp(); };
    S.camp = 'raum'; S.table = { me1: { char: 'Mira', ac: 18, level: 5, dm: true }, u2: { char: 'Lyra', ac: 13, level: 5 }, u3: { char: 'Tor', ac: 16, level: 5 } };
    S.meta = { dm: sz.tisch === 'sl' ? 'me1' : 'u2', mercy: {} }; S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 2 }, { mid: 'adult-red', n: 1 }], 'Test', {}); }
  S.view = sz.view; if (sz.mg) S.mg = sz.mg; if (sz.step !== undefined) S.step = sz.step; if (sz.more) S.more = true;
  render();
  if (sz.adv) { XA.advOpen(null, sz.adv); if (sz.ch) { XA.advTab(null, 'ch:' + sz.ch); } }
  if (sz.offen) document.querySelectorAll(sz.offen).forEach((d, i) => { if (i < 2) d.open = true; });
  window.scrollTo(0, 0);
};
const SIGNATUREN = () => { const vis = (e) => { const d = e.closest('details:not([open])'); if (d && !e.closest('summary')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const seen = {}; const out = [];
  document.querySelectorAll('[data-act]').forEach((e) => { if (!vis(e) || e.disabled) return; const sig = [e.dataset.act, e.dataset.arg || '', e.dataset.path || '', e.dataset.val || ''].join('|');
    const perAct = (seen['#' + e.dataset.act] = (seen['#' + e.dataset.act] || 0) + 1); if (seen[sig] || perAct > 4) return; seen[sig] = 1;
    const all = [...document.querySelectorAll('[data-act="' + e.dataset.act + '"]')]; out.push([sig, all.indexOf(e)]); });
  return out; };
const KLICK = ([sig, idx]) => { const act = sig.split('|')[0]; const e = [...document.querySelectorAll('[data-act="' + act + '"]')][idx]; if (!e) return 'fehlt';
  const vor = Object.keys(S.chars).length; e.click(); return vor; };
const NACHHER = (vor) => { const res = {}; res.helden = Object.keys(S.chars).length; res.vor = vor;
  const v = document.getElementById('view'); res.leer = !v || !v.innerHTML.trim();
  const m = document.getElementById('modal'); res.modal = !!m && !m.hidden;
  try { if (m) { m.hidden = true; } S.modal = null; render(); res.render = true; } catch (e) { res.render = 'Fehler: ' + e.message; }
  const t = document.body.innerText; const bad = t.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]/); res.text = bad ? bad[0] + ' «' + t.slice(Math.max(0, t.indexOf(bad[0]) - 40), t.indexOf(bad[0]) + 30).replace(/\s+/g, ' ') + '»' : '';
  return res; };

(async () => {
  const b = await chromium.launch();
  const SZENEN = [
    { n: 'Helden', view: 'heroes' },
    ...[0, 1, 2, 3, 4, 5, 6].map((st) => ({ n: 'Erschaffen ' + (st + 1) + ' Magierin', view: 'build', step: st, held: 'h_wiz' })),
    ...[0, 1, 2, 3, 5].map((st) => ({ n: 'Erschaffen ' + (st + 1) + ' Kämpferin', view: 'build', step: st })),
    ...['kampf', 'werte', 'faehig', 'gear', 'begleiter', 'notiz'].map((mg) => ({ n: 'Bogen Kämpferin ' + mg, view: 'sheet', mg })),
    ...['kampf', 'zauber', 'faehig'].map((mg) => ({ n: 'Bogen Magierin ' + mg, view: 'sheet', mg, held: 'h_wiz' })),
    { n: 'Bogen Barbar kampf', view: 'sheet', mg: 'kampf', held: 'h_3' },
    { n: 'Bogen Hexenmeister kampf', view: 'sheet', mg: 'kampf', held: 'h_3', cls2: 'wlk', lv2: 5, sub2: 'fiend' },
    { n: 'Bogen Paladin zauber', view: 'sheet', mg: 'zauber', held: 'h_3', cls2: 'pal', lv2: 6, sub2: 'devotion' },
    { n: 'Bogen Mönch kampf', view: 'sheet', mg: 'kampf', held: 'h_3', cls2: 'mon', lv2: 6, sub2: 'openhand' },
    { n: 'Zauberbuch', view: 'spells' },
    { n: 'Bestiarium', view: 'mobs', offen: 'details.mob' },
    { n: 'Hausregeln', view: 'hb' },
    { n: 'Hilfe', view: 'help' },
    { n: 'Tisch ohne Raum', view: 'camp' },
    { n: 'Tisch SL im Kampf', view: 'camp', tisch: 'sl' },
    { n: 'Tisch Spieler im Kampf', view: 'camp', tisch: 'sp' },
    { n: 'Bogen am Tisch im Kampf', view: 'sheet', mg: 'kampf', tisch: 'sp' },
    { n: 'Abenteuer Liste', view: 'adv' },
    { n: 'Machtader Übersicht', view: 'adv', adv: 'machtader' },
    { n: 'Machtader Kapitel 1', view: 'adv', adv: 'machtader', ch: 'k1' },
    { n: 'Krug Übersicht', view: 'adv', adv: 'krug' },
  ];
  const breiten = schnell ? [[390, 844]] : [[390, 844], [1280, 900]];
  for (const [w, h] of breiten) {
    const mob = w <= 820; const tag = w + ' ';
    const szenen = SZENEN.concat(mob ? [{ n: 'Mehr-Menü', view: 'sheet', mg: 'kampf', more: true }] : []);
    for (const sz of szenen) {
      const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob });
      let err = []; p.on('pageerror', (e) => err.push(e.message)); p.on('dialog', (d) => d.dismiss().catch(() => {})); p.on('popup', (x) => x.close().catch(() => {}));
      await p.goto('file://' + target); await p.waitForTimeout(500);
      try { await p.evaluate(BASIS, sz); } catch (e) { befunde.push(tag + sz.n + ': Ausgangszustand – ' + e.message); await p.close(); continue; }
      const sigs = await p.evaluate(SIGNATUREN);
      for (const s of sigs) {
        err = []; klicks++;
        let vor; try { await p.evaluate(BASIS, sz); vor = await p.evaluate(KLICK, s); } catch (e) { befunde.push(tag + sz.n + ' › ' + s[0] + ': ' + e.message.split('\n')[0]); continue; }
        await p.waitForTimeout(90);
        let r; try { r = await p.evaluate(NACHHER, vor); } catch (e) { befunde.push(tag + sz.n + ' › ' + s[0] + ': nach dem Klick – ' + e.message.split('\n')[0]); continue; }
        const act = s[0].split('|')[0];
        if (err.length) befunde.push(tag + sz.n + ' › ' + s[0] + ': Skriptfehler – ' + err[0]);
        if (r.render !== true) befunde.push(tag + sz.n + ' › ' + s[0] + ': ' + r.render);
        if (r.leer) befunde.push(tag + sz.n + ' › ' + s[0] + ': Ansicht leer');
        if (r.text) befunde.push(tag + sz.n + ' › ' + s[0] + ': ' + r.text);
        if (typeof vor === 'number' && r.helden < vor && !LOESCHEN.has(act)) befunde.push(tag + sz.n + ' › ' + s[0] + ': Held verschwunden (' + vor + ' → ' + r.helden + ')');
      }
      await p.close();
    }
  }
  await b.close();
  console.log('Angetippte Knöpfe: ' + klicks);
  const uniq = [...new Set(befunde)]; uniq.forEach((x) => console.log('✘ ' + x));
  console.log(uniq.length ? uniq.length + ' Befunde' : 'Keine Befunde'); process.exit(uniq.length ? 1 : 0);
})();
