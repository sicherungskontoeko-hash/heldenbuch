/* Gegnerangriff: erst Angriff, dann Treffer prüfen (Ziel-RK), erst danach Schaden; Krit verdoppelt Würfel, natürliche 1 verfehlt. Aufruf: node tests/npc.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const n = newChar({ name: 'Brakk', cls: 'fig', level: 3 }); S.chars[n.id] = n; S.cur = n.id; S.combat = { id: 'k', active: true, round: 1, npcs: [{ id: 'A', mid: 'wolf', name: 'Wolf A', hp: 11, hpMax: 11, ac: 12, cond: [] }] }; window.__q = []; Math.random = () => (window.__q.length ? window.__q.shift() : 0.5); });
  const atk = (nat) => p.evaluate((nat) => { window.__q = [(nat - 0.5) / 20, (nat - 0.5) / 20]; const n0 = S.log.length; const bt = document.createElement('button'); bt.dataset.act = 'npcAtk'; bt.dataset.arg = 'A'; bt.dataset.j = '0'; document.body.appendChild(bt); bt.click(); bt.remove(); return n0; }, nat);
  const n0 = await atk(15); await p.waitForTimeout(300);
  T('Angriff gewürfelt, aber noch KEIN Schaden', await p.evaluate((n0) => S.log.length === n0 + 1 && /Biss/.test(S.log[0].label), n0));
  T('Prüffrage erscheint mit Ziel und Urteil (17 gegen RK)', await p.evaluate(() => !$('#prompt').hidden && /Brakk/.test($('#prompt').textContent) && /(Trifft|Verfehlt) Brakk/.test($('#prompt').textContent)));
  await p.evaluate(() => { window.__q = [0.99]; $('#prompt [data-act="npcHit"]').click(); });
  T('Erst nach „Treffer“ wird Schaden gewürfelt', await p.evaluate(() => /Biss \(Stich\)/.test(S.log[0].label) && $('#prompt').hidden));
  await p.waitForTimeout(300); await p.evaluate(() => { const b = $('#prompt [data-act="hitApply"][data-arg="0"]'); if (b) b.click(); });
  await atk(5); await p.waitForTimeout(300); const n1 = await p.evaluate(() => S.log.length);
  await p.evaluate(() => $('#prompt [data-act="npcMiss"]').click());
  T('„Verfehlt“: kein Schadenswurf', await p.evaluate((n1) => S.log[0].total === 'verfehlt' && !S.log.slice(0, 1).some((e) => e.groups), n1));
  await atk(1); await p.waitForTimeout(300);
  T('Natürliche 1: Treffer-Knopf gesperrt', await p.evaluate(() => $('#prompt [data-act="npcHit"]').disabled));
  await p.evaluate(() => $('#prompt [data-act="npcMiss"]').click());
  await atk(20); await p.waitForTimeout(300); await p.evaluate(() => $('#prompt [data-act="npcHit"]').click());
  T('Natürliche 20: Schadenswürfel verdoppelt', await p.evaluate(() => /kritisch/.test(S.log[0].label) && S.log[0].groups && S.log[0].groups[0].rolls.length === 2));
  await p.waitForTimeout(400); T('Eigener Held (allein): Treffer wird zum Eintragen angeboten', await p.evaluate(() => !$('#prompt').hidden && !!$('#prompt [data-act="hitApply"]')));
  T('critExpr verdoppelt alle Würfel', await p.evaluate(() => critExpr('2W6+3+3W6') === '4W6+3+6W6' && critExpr('W8+1') === '2W8+1'));
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
