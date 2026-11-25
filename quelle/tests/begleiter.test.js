/* Begleiter und Reittiere: jede Art anlegen, Werte ohne Lücken, Schaden und Heilung bis 0 und Maximum, Initiative im Kampf,
   Angriffswurf; Ross finden je Grad und Art; mit «Eigene Würfel» zählt auch beim Begleiter der eingegebene W20.
   Aufruf: node tests/begleiter.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); }); await p.goto('file://' + target); await p.waitForTimeout(600);
  const all = await p.evaluate(() => { const ch = sampleChar(); ch.level = 7; S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'sheet'; S.mg = 'begleiter'; const bad = [];
    for (const t of Object.keys(COMPANIONS)) { ch.comps = [{ t, name: '', hp: null }]; if (t === 'steed') { ch.comps[0].kind = 'fey'; ch.comps[0].lvl = 4; } if (t === 'custom') Object.assign(ch.comps[0], { name: 'Eigener', ac: 14, hpMax: 30, atkN: 'Biss', atkB: 4, atkD: '1W8+2', atkT: 'Stich' });
      render(); const blk = document.querySelector('#compBlk'); const txt = blk ? blk.innerText : ''; const s = compStat(derive(ch, S.hb), ch.comps[0]);
      if (!blk || /undefined|NaN|null|\[object/.test(txt) || !(s.ac > 0) || !(s.hpMax > 0) || !s.name) bad.push(t + ': ' + txt.slice(0, 80)); }
    return { n: Object.keys(COMPANIONS).length, bad }; });
  T('Alle ' + all.n + ' Begleiterarten: Werte vollständig, keine Lücken im Text', all.bad.length === 0, all.bad);
  const steed = await p.evaluate(() => { const ch = cur(); const c = derive(ch, S.hb); const out = []; for (const kind of Object.keys(STEED_KIND)) for (const lvl of [2, 3, 4, 5]) { const s = compStat(c, { t: 'steed', kind, lvl }); out.push([kind, lvl, s.ac, s.hpMax, /Fliegen/.test(s.speed)]); } return out; });
  T('Ross finden: RK 10 + Grad, TP 5 + 10 × Grad, Fliegen ab Grad 4', steed.every(([k, g, ac, hp, fly]) => ac === 10 + g && hp === 5 + 10 * g && fly === (g >= 4)), steed);
  await p.evaluate(() => { const ch = cur(); ch.comps = [{ t: 'm-warhorse', name: 'Blitz', hp: null }]; render(); });
  const hp = async (v, d) => { await p.fill('#cHp0', String(v)); await p.click('[data-act="compHp"][data-arg="0"][data-d="' + d + '"]'); await p.waitForTimeout(80); return p.evaluate(() => cur().comps[0].hp); };
  T('Schaden 7 → 12 TP', (await hp(7, 'dmg')) === 12); T('Schaden 50 → 0 TP, nicht negativ', (await hp(50, 'dmg')) === 0);
  T('Bei 0 TP Hinweis im Verlauf', await p.evaluate(() => /Schlachtross|Blitz/.test(S.log[0].label) && S.log[0].total === '0'));
  T('Heilung 99 → höchstens Maximum 19', (await hp(99, 'heal')) === 19);
  await p.evaluate(() => { UID = 'ich'; S.camp = 'raum'; S.table = { ich: { char: cur().name } }; S.meta = { dm: 'u3', mercy: {} }; S.combat = { id: 'k1', active: true, round: 1, turn: 'p:ich', npcs: [] }; window.__sc = null; window.saveCombat = (x) => { window.__sc = x; S.combat = x; }; render(); });
  await p.evaluate(() => XA.compInit({ dataset: {} }, '0', null, cur()));
  { const r = await p.evaluate(() => { const n = (window.__sc || S.combat).npcs[0]; return { n, log: S.log[0] }; }); T('Initiative: Begleiter kommt als Verbündeter in die Reihenfolge (W20 + GES)', r.n && r.n.ally && r.n.v === r.log.nat + 1 && /Blitz \(/.test(r.n.name), r); }
  await p.evaluate(() => { localStorage.setItem('hb_echt', '1'); S.echtV = '17'; XA.compInit({ dataset: {} }, '0', null, cur()); });
  { const r = await p.evaluate(() => ({ nat: S.log[0].nat, total: S.log[0].total, left: S.echtV })); T('Eigene Würfel: Initiative des Begleiters nimmt den eingegebenen W20', r.nat === 17 && r.total === 18 && r.left === '', r); }
  await p.evaluate(() => { S.echtV = '20'; XA.xroll({ dataset: { mod: '6', label: 'Blitz: Hufe', atk: '1' } }); });
  { const r = await p.evaluate(() => ({ nat: S.log[0].nat, total: S.log[0].total, crit: S.log[0].crit, det: S.log[0].detail })); T('Eigene Würfel: Angriff des Begleiters mit echter 20 → kritisch', r.nat === 20 && r.total === 26 && r.crit && /echter Würfel/.test(r.det), r); }
  await p.evaluate(() => { localStorage.setItem('hb_echt', '0'); });
  { const r = await p.evaluate(() => { XA.xroll({ dataset: { mod: '6', label: 'Blitz: Hufe', atk: '1' } }); return S.log[0]; }); T('Ohne eigene Würfel: Angriff des Begleiters wie bisher', r.nat >= 1 && r.nat <= 20 && r.total === r.nat + 6 && !/echter/.test(r.detail), r); }
  await p.evaluate(() => { XA.compDel({ dataset: {} }, '0', null, cur()); render(); });
  T('Begleiter entfernen', await p.evaluate(() => cur().comps.length === 0));
  T('keine Seitenfehler', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' bestanden, ' + fail + ' fehlgeschlagen'); await b.close(); process.exit(fail ? 1 : 0);
})();
