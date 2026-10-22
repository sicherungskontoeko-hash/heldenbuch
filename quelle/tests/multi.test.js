/* Mehrgeräte-Test (P01, P06, P07): Spielleitung + zwei Spieler über einen echten lokalen Server (MQTT über WebSocket).
   Gleichzeitige Änderungen, Verbindungsabbruch und ein ganzer Kampfablauf. Voraussetzung: python3 build_app.py · Aufruf: node tests/multi.test.js */
const { chromium } = require('playwright');
const { Aedes } = require('aedes'); const http = require('http'); const wsStream = require('websocket-stream');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'app', 'www');
(async () => {
  const aedes = await Aedes.createBroker();
  const bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, aedes.handle); await new Promise((r) => bsrv.listen(8892, r));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  const web = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise((r) => web.listen(8893, r));
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const done = async (code) => { out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got)))); const f = out.filter((r) => !r.ok).length + errs.length; console.log((out.length - out.filter((r) => !r.ok).length) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : '')); await b.close(); bsrv.close(); web.close(); aedes.close(); process.exit(code != null ? code : f ? 1 : 0); };
  process.on('unhandledRejection', (e) => { console.log('ABBRUCH', e.message); done(1); });
  const mk = async (name, vp, hero) => { const c = await b.newContext({ viewport: vp }); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8892'); localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_sample_done', '1'); });
    const p = await c.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); await p.goto('http://localhost:8893/'); await p.waitForTimeout(900);
    await p.evaluate((h) => { const ch = normChar(newChar(h)); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.hp = derive(ch, S.hb).hpMax; commit(false); }, hero); return { c, p }; };
  const SL = await mk('SL', { width: 1280, height: 900 }, { name: 'Spielleitung', cls: 'fig', level: 5 });
  const B = await mk('Ilva', { width: 390, height: 844 }, { name: 'Ilva', cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['fireball', 'hold-person', 'shield', 'fire-bolt'], prepared: ['fireball', 'hold-person', 'shield'] });
  const C = await mk('Brakk', { width: 390, height: 844 }, { name: 'Brakk', cls: 'bar', level: 5 });
  const all = [SL, B, C]; const w = (ms) => SL.p.waitForTimeout(ms);
  const code = 'valdris-' + Math.random().toString(36).slice(2, 8);
  await SL.p.evaluate((c) => { joinCamp(c); setTimeout(() => saveMeta({ dm: UID }), 700); }, code);
  await B.p.evaluate((c) => joinCamp(c), code); await C.p.evaluate((c) => joinCamp(c), code);
  await w(3500);
  const uid = {}; for (const [k, x] of [['SL', SL], ['B', B], ['C', C]]) uid[k] = await x.p.evaluate(() => String(UID));
  T('Drei Geräte am Tisch, alle sehen alle', (await Promise.all(all.map((x) => x.p.evaluate(() => Object.keys(S.table).length)))).every((n) => n === 3));
  T('Spielleitung überall erkannt', (await Promise.all(all.map((x) => x.p.evaluate(() => S.meta.dm)))).every((d) => d === uid.SL));

  /* Kampf beginnen, Initiative, Gegner */
  await SL.p.evaluate(() => { const t = document.createElement('button'); t.dataset.act = 'fightStart'; document.body.appendChild(t); t.click(); t.remove(); }); await w(1200);
  await B.p.evaluate(() => setMyInit(18)); await C.p.evaluate(() => setMyInit(12)); await w(300);
  await SL.p.evaluate(() => { encInsert([{ mid: 'goblin', n: 2 }], '', { groupInit: true }); S.combat.npcs.forEach((x) => { x.v = 15; }); saveCombat(Object.assign({}, S.combat, { t: Date.now() })); }); await w(1800);
  const ord = await Promise.all(all.map((x) => x.p.evaluate(() => order().map((o) => o.name).join(' > '))));
  T('Alle sehen dieselbe Reihenfolge (ohne Spielleitung)', ord.every((o) => o === ord[0]) && /^Ilva > Goblin-Krieger 1 > Goblin-Krieger 2 > Brakk$/.test(ord[0]), ord);
  await SL.p.evaluate(() => { const t = document.createElement('button'); t.dataset.act = 'fightGo'; document.body.appendChild(t); t.click(); t.remove(); }); await w(1500);
  T('Erster Zug: Ilva ist auf allen Geräten am Zug', (await Promise.all(all.map((x) => x.p.evaluate(() => S.combat.turn)))).every((t) => t === 'p:' + uid.B));

  /* P01a: SL wechselt die Runde, während der Spieler einen Rettungswurf bestätigt */
  await SL.p.evaluate((u) => { const c = S.combat; saveCombat(Object.assign({}, c, { reqs: [{ id: 'r1', by: 'Feueratem', ab: 'dex', dc: 13, amount: 0, half: true, to: [u], t: Date.now() }], t: Date.now() })); }, uid.B); await w(1500);
  T('Spieler bekommt die Rettungswurf-Anforderung', await B.p.evaluate(() => /Feueratem: GES-Rettungswurf SG 13/.test($('#prompt').textContent)));
  await Promise.all([B.p.evaluate(() => { const t = document.querySelector('#prompt [data-act="reqRoll"]'); t.click(); }), SL.p.evaluate(() => nextTurn())]);
  await w(2500);
  const st = await Promise.all(all.map((x) => x.p.evaluate(() => [S.combat.turn, (S.combat.saveRes || []).length])));
  T('Gleichzeitig: Zugwechsel UND Rettungswurf-Ergebnis kommen überall an', st.every((s) => s[0] === st[0][0] && s[0] !== 'p:' + uid.B && s[1] === 1), st);

  const r0 = await SL.p.evaluate(() => S.combat.rev); await w(4000); const r1 = await SL.p.evaluate(() => S.combat.rev);
  T('Danach Ruhe: kein Hin-und-her-Schreiben zwischen den Geräten', r1 - r0 <= 1, [r0, r1]);
  /* P01b: zwei Spieler ändern gleichzeitig TP und Zustände */
  await Promise.all([B.p.evaluate(() => { hpChange(cur(), 'dmg', 6); const P = cur().play; P.cond = ['prone']; commit(); }), C.p.evaluate(() => { hpChange(cur(), 'dmg', 9); const P = cur().play; P.cond = ['poisoned']; commit(); })]);
  await w(2200);
  const tb = await SL.p.evaluate((u) => [S.table[u.B].hp, S.table[u.B].hpMax, S.table[u.B].cond, S.table[u.C].hp, S.table[u.C].hpMax, S.table[u.C].cond], uid);
  T('Gleichzeitig: TP und Zustände beider Spieler kommen bei der SL an', tb[1] - tb[0] === 6 && tb[4] - tb[3] === 9 && tb[2].includes('Liegend') && tb[5].includes('Vergiftet'), tb);

  /* P01c: Spieler trägt Schaden am Gegner ein, während die SL einen anderen Gegner ändert */
  const g = await SL.p.evaluate(() => S.combat.npcs.map((x) => x.id));
  await Promise.all([B.p.evaluate((id) => { S.applyPend = { tgt: 'n:' + id, amount: 5 }; const t = document.createElement('button'); t.dataset.act = 'applyDmg'; t.dataset.arg = '1'; document.body.appendChild(t); t.click(); t.remove(); }, g[0]),
    SL.p.evaluate((id) => { const c = S.combat; saveCombat(Object.assign({}, c, { npcs: c.npcs.map((x) => (x.id === id ? Object.assign({}, x, { hp: x.hp - 3 }) : x)), t: Date.now() })); }, g[1])]);
  await w(2500);
  const hp = await Promise.all(all.map((x) => x.p.evaluate(() => S.combat.npcs.map((n) => n.hp).join('/'))));
  T('Gleichzeitig: beide Gegner-Änderungen bleiben erhalten (10−5 / 10−3)', hp.every((h) => h === '5/7'), hp);

  /* P07: Zauber mit Zustand, Effekt, Konzentration */
  await B.p.evaluate((id) => { orbPrompt(''); S.tgt = 'n:' + id; turnReset(cur()); castSpell(cur(), 'hold-person', 2, 'slot'); }, g[1]); await w(300);
  await B.p.evaluate(() => { const t = document.querySelector('#prompt [data-act="scRes"][data-arg="fail"]'); t.click(); }); await w(2000);
  T('Person festhalten: SL sieht Goblin 2 gelähmt (über den Effekt)', await SL.p.evaluate((id) => npcConds(S.combat.npcs.find((x) => x.id === id)).includes('paralyzed'), g[1]));
  /* Gegnerangriff auf Ilva → Treffer → Schild */
  await SL.p.evaluate((u) => { window.__q = [0.475]; const orig = Math.random; Math.random = () => (window.__q.length ? window.__q.shift() : orig()); S.npcA = { tgt: 'p:' + u }; const id = S.combat.npcs[0].id; const t = document.createElement('button'); t.dataset.act = 'npcAtk'; t.dataset.arg = id; t.dataset.j = '0'; document.body.appendChild(t); t.click(); t.remove(); }, uid.B);
  await w(400);
  const atk = await SL.p.evaluate(() => S.npcA.total);
  await SL.p.evaluate(() => { const t = document.querySelector('#prompt [data-act="npcHit"]'); t.disabled = false; t.click(); }); await w(2500);
  const bp = await B.p.evaluate(() => $('#prompt').textContent);
  T('Treffer kommt bei Ilva an (mit Angriffswert)', /trifft Ilva/.test(bp) && new RegExp('Angriff ' + atk).test(bp), bp);
  const ac = await B.p.evaluate(() => derive(cur(), S.hb).ac);
  if (atk < ac + 5) { await B.p.evaluate(() => document.querySelector('#prompt [data-act="hitShield"]').click()); await w(300);
    T('Schild wehrt ab: kein Schaden, Platz Grad 1 verbraucht', await B.p.evaluate(() => /abgewehrt/.test(S.log[0].total) && +cur().play.slots[1] === 1)); }
  else { await B.p.evaluate(() => document.querySelector('#prompt [data-act="hitApply"][data-arg="1"]').click()); T('Treffer eingetragen', true); }
  /* Konzentration verloren → Effekt endet → Zustand am Gegner weg */
  await B.p.evaluate(() => { const orig = Math.random; window.__q = [0.01]; Math.random = () => (window.__q.length ? window.__q.shift() : orig()); orbPrompt(''); hpChange(cur(), 'dmg', 12); }); await w(2500);
  const cc = { conc: await B.p.evaluate(() => cur().play.conc), par: await Promise.all(all.map((x) => x.p.evaluate((id) => [npcConds(S.combat.npcs.find((n) => n.id === id)).includes('paralyzed'), (S.combat.effects || []).map((e) => e.name + ':' + e.tgt).join(','), S.combat.rev], g[1]))) };
  T('Konzentration misslungen: Person festhalten endet, Goblin 2 überall nicht mehr gelähmt', !cc.conc && cc.par.every((v) => !v[0]), cc);

  /* P06: Verbindungsabbruch, in der Zwischenzeit Zugwechsel */
  await C.p.evaluate(() => { HBNET.ws && HBNET.ws.close(); }); await SL.p.evaluate(() => nextTurn()); await w(4500);
  const tt = await Promise.all(all.map((x) => x.p.evaluate(() => S.combat.turn)));
  T('Nach Verbindungsabbruch: Brakk holt den aktuellen Zug nach', tt.every((t) => t === tt[0]), tt);
  await C.p.evaluate(() => d20(4, 'Nach dem Abbruch', { kind: 'check:str' })); await w(1800);
  T('… und seine Würfe kommen wieder an', await SL.p.evaluate(() => tableRolls().some((r) => /Nach dem Abbruch/.test(r.label))));

  /* Neue Begegnung, Kampf beenden */
  await SL.p.evaluate(() => { const t = document.createElement('button'); t.dataset.act = 'fightReset'; document.body.appendChild(t); t.click(); t.remove(); const y = document.querySelector('[data-act=confirmYes], .cfdlg button.btn:not(.ghost)'); if (y) y.click(); }); await w(1800);
  const nb = await Promise.all(all.map((x) => x.p.evaluate(() => [S.combat && S.combat.id, S.combat && S.combat.rev, S.combat && S.combat.w, waiting().map((q) => q.name).join(',')])));
  T('Neue Begegnung: alle sollen neu würfeln', nb.every((v) => v[0] === nb[0][0]) && nb[1][3].includes('Ilva') && nb[2][3].includes('Brakk'), nb);
  await SL.p.evaluate(() => { const t = document.createElement('button'); t.dataset.act = 'fightEnd'; document.body.appendChild(t); t.click(); t.remove(); const y = document.querySelector('[data-act=confirmYes], .cfdlg button.btn:not(.ghost)'); if (y) y.click(); }); await w(1800);
  T('Kampf beendet auf allen Geräten', (await Promise.all(all.map((x) => x.p.evaluate(() => !S.combat || !S.combat.active)))).every(Boolean));
  T('Handy: kein Querscrollen bei den Spielern', (await Promise.all([B, C].map((x) => x.p.evaluate(() => { S.view = 'camp'; render(); return document.documentElement.scrollWidth <= 391; })))).every(Boolean));
  await done();
})();
