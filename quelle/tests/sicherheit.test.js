/* Sicherheit: Fremder Text darf nie als HTML wirken. Schadtext in allen freien Feldern des Helden, in Daten anderer
   Spieler am Tisch (Namen, Würfe, Gegner, Effekte, Handouts, Beute, Anfragen) und in Hausregeln; danach jede Ansicht,
   jeder Bogenreiter und die wichtigsten Fenster. Kein eingeschleustes Element, kein ausgeführtes Skript.
   Aufruf: node tests/sicherheit.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
const X = '"><img src=x class=xssmark onerror="window.__xss=(window.__xss||0)+1"><svg onload="window.__xss=(window.__xss||0)+1" class=xssmark>\'';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('Dialog: ' + d.message()); d.dismiss(); });
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
  await p.goto('file://' + target); await p.waitForTimeout(600);
  await p.evaluate((X) => {
    const ch = sampleChar(); Object.assign(ch, { name: 'Held' + X, inventory: X, notes: X, appearance: X, alignment: X, languages: X });
    ch.items = [{ uid: 'i1', id: 'wand-fireballs', label: X, att: true, eq: true, qty: 1, w: '' }, { uid: 'i2', custom: true, name: X, text: X, qty: 1, eq: true }];
    ch.inv = [{ n: X, qty: 1, kg: 1 }]; ch.comps = [{ t: 'custom', name: X, ac: 12, hpMax: 20, hp: 20 }];
    ch.play.ready = { trig: X, what: X, t: 1 }; ch.play.conc = { name: X, lvl: 1 };
    S.chars = { [ch.id]: ch }; S.cur = ch.id;
    S.hb = { hx1: { id: 'hx1', name: X, text: X, kind: 'feat' } }; ch.homebrew = ['hx1'];
    UID = 'ich'; S.camp = 'raum' + X.slice(0, 5);
    const now = Date.now();
    S.table = { ich: { char: ch.name }, u2: { char: X, pl: X, clsName: X, species: X, level: X, hp: 5, hpMax: 10, ac: X, rolls: [{ label: X, detail: X, total: X, t: now }], init: { cid: 'k1', v: 5 } } };
    S.meta = { dm: 'u3', mercy: {}, handouts: [{ id: 'h1', title: X, text: X, t: now }], gifts: [{ id: 'g1', to: 'all', text: X, t: now }], rules: { strict: false }, rulesAt: 5, theme: X };
    S.combat = { id: 'k1', active: true, round: 1, turn: 'p:ich', npcs: [{ id: 'n1', name: X, hp: 5, hpMax: 9, ac: 12, init: 3 }], effects: [{ id: 'e1', name: X, tgt: 'n:n1', left: 3 }], rem: [{ id: 'r1', name: X, ab: 'con', dc: 12, tgt: 'p:ich', eff: 'e1' }], reqs: [{ id: 'q1', by: X, ab: 'dex', dc: 13, t: now }], log: [X], saveRes: [] };
    pushLog({ label: X, total: X, detail: X });
  }, X);
  const views = [['heroes'], ['sheet', 'kampf'], ['sheet', 'werte'], ['sheet', 'zauber'], ['sheet', 'faehig'], ['sheet', 'gear'], ['sheet', 'begleiter'], ['sheet', 'notiz'], ['sheet', 'alle'], ['build'], ['camp'], ['spells'], ['mobs'], ['adv'], ['hb'], ['help']];
  for (const [v, g] of views) {
    const r = await p.evaluate(([v, g]) => { window.__xss = 0; try { S.view = v; if (g) S.mg = g; render(); if (v === 'camp') paintCamp(); if (v === 'sheet') paintTurn(); } catch (e) { return { err: e.message }; } return { n: document.querySelectorAll('.xssmark').length }; }, [v, g]);
    await p.waitForTimeout(150);
    const x = await p.evaluate(() => ({ el: document.querySelectorAll('.xssmark,img[src="x"]').length, run: window.__xss || 0 }));
    T('Ansicht ' + v + (g ? ':' + g : '') + ': kein eingeschleustes Element, kein Skript', !r.err && x.el === 0 && x.run === 0, { r, x });
  }
  for (const [n, fn] of [['Würfelverlauf', 'histOpen'], ['Hilfen', 'hlOpen'], ['Stufenaufstieg', 'lvlUpOpen'], ['Würfel-Set', 'diceModal'], ['Chronik', 'chrOpen']]) {
    const r = await p.evaluate((fn) => { window.__xss = 0; try { S.view = 'sheet'; render(); if (typeof XA[fn] === 'function') XA[fn]({ dataset: {} }, '', null, cur()); else window[fn](); } catch (e) { return { err: e.message }; } return {}; }, fn);
    await p.waitForTimeout(150);
    const x = await p.evaluate(() => ({ el: document.querySelectorAll('.xssmark,img[src="x"]').length, run: window.__xss || 0 }));
    T('Fenster ' + n + ': sicher', !r.err && x.el === 0 && x.run === 0, { r, x });
    await p.evaluate(() => { S.modal = null; const m = document.getElementById('modal'); if (m) m.hidden = true; });
  }
  /* Würfelanzeige mit fremdem Text */
  await p.evaluate((X) => { window.__xss = 0; document.querySelectorAll('.xssmark').forEach((e) => e.remove()); showToast({ label: X, total: 7, detail: X, sides: 20, nat: 7 }); bannerToast(X, X); }, X); await p.waitForTimeout(400);
  { const x = await p.evaluate(() => ({ el: document.querySelectorAll('.xssmark,img[src="x"]').length, run: window.__xss || 0 })); T('Würfelfenster und Meldung: sicher', x.el === 0 && x.run === 0, x); }
  /* Import einer Datei mit Schadtext und fremden Schlüsseln */
  { const r = await p.evaluate((X) => { const bad = { chars: { a: Object.assign(sampleChar(), { id: 'a"><x', name: X, __proto__: { polluted: 1 } }) } }; try { const n = normChar(JSON.parse(JSON.stringify(bad.chars.a))); return { ok: true, poll: ({}).polluted === undefined, id: n.id }; } catch (e) { return { err: e.message }; } }, X);
    T('Import: kein Prototyp-Eingriff', r.ok && r.poll, r); }
  /* Fremde Würfe vom Tisch: nur gültige Würfelart, Augenzahl und Würfel-Set */
  { const r = await p.evaluate(() => { const d = playerDoc({ char: 'L', rolls: [{ t: 1, label: 'x', total: 3, sides: '20"><b>', nat: '<img>', dset: '__proto__' }, { t: 2, label: 'y', total: 7, sides: 20, nat: 7, dset: 'klassik' }] }); return d.rolls.map((x) => [x.sides, x.nat === undefined ? 'leer' : x.nat, x.dset]); });
    T('Fremde Würfe: Würfelart, Augenzahl und Set geprüft', JSON.stringify(r) === JSON.stringify([[0, 'leer', ''], [20, 7, 'klassik']]), r); }
  T('keine Seitenfehler, keine Dialoge', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' bestanden, ' + fail + ' fehlgeschlagen'); await b.close(); process.exit(fail ? 1 : 0);
})();
