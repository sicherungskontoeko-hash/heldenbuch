/* Abfragen und Ziele: keine verdrängten Entscheidungen (P02), Ziel beim Auslösen festgehalten (P03), Rückgängig nur für den eigenen Helden (P10).
   Aufruf: node tests/flow.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  process.on('unhandledRejection', (e) => { out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n)); console.log('ABBRUCH', e.message); process.exit(1); });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); UID = 'u2'; window.__q = []; Math.random = () => (window.__q.length ? window.__q.shift() : 0.5);
    window.saveCombat = (c) => { S.combat = c; }; window.click = (act, arg) => { const t = document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; document.body.appendChild(t); t.click(); t.remove(); };
    window.pr = () => ($('#prompt').hidden ? '' : $('#prompt').textContent);
    const ch = normChar(newChar({ name: 'Ilva', cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['fireball', 'hold-person', 'fire-bolt'], prepared: ['fireball', 'hold-person'] })); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.hp = derive(ch, S.hb).hpMax;
    S.camp = 'raum'; S.meta = { dm: 'dm1', mercy: {} }; S.table = { dm1: { char: 'SL' }, u2: { char: 'Ilva', ac: 12 } };
    S.combat = { id: 'k', active: true, round: 1, turn: 'p:u2', npcs: [{ id: 'A', mid: 'goblin', name: 'Goblin A', hp: 40, hpMax: 40, ac: 15, v: 10, cond: [] }, { id: 'B', mid: 'goblin', name: 'Goblin B', hp: 40, hpMax: 40, ac: 15, v: 9, cond: [] }], effects: [], hits: [], reqs: [], saveRes: [] };
    S.table.u2.init = { cid: 'k', v: 15 };
    window.turnFresh = () => { turnReset(cur()); cur().play.slots = {}; }; });
  const wait = (ms) => p.waitForTimeout(ms);

  /* P02: eingehender Treffer während eigener Entscheidung */
  await p.evaluate(() => { S.tgt = ''; castSpell(cur(), 'fireball', 3, 'slot'); S.combat.hits.push({ to: 'u2', by: 'Goblin A: Krummsäbel', amount: 5, dtype: 'Hieb', t: Date.now() }); hitCheck(); });
  T('Treffer kommt während der Feuerball-Abfrage: Feuerball bleibt offen', await p.evaluate(() => /Feuerball: GES-Rettungswurf/.test(pr()) && (S.hitQ || []).length === 1));
  await p.evaluate(() => click('svRes', 'fail')); await wait(500);
  T('… nach der Entscheidung erscheint der Treffer', await p.evaluate(() => /Goblin A: Krummsäbel trifft Ilva: 5 Schaden/.test(pr()) && /Feuerball/.test(S.log[0].label + (S.log[1] || {}).label)), await p.evaluate(() => pr()));
  /* eigene Aktion während offener Treffer-Abfrage */
  await p.evaluate(() => { turnFresh(); castSpell(cur(), 'hold-person', 2, 'slot'); });
  T('Eigene Aktion verdrängt den Treffer nicht endgültig (zurück in die Warteschlange)', await p.evaluate(() => /Person festhalten/.test(pr()) && (S.hitQ || []).length === 1 && !S.hitPend));
  await p.evaluate(() => click('scRes', 'ok')); await wait(500);
  T('… danach kommt der Treffer wieder', await p.evaluate(() => /trifft Ilva: 5 Schaden/.test(pr())));
  /* zwei Treffer kurz hintereinander, während einer offen ist */
  await p.evaluate(() => { S.combat.hits.push({ to: 'u2', by: 'Goblin B: Kurzbogen', amount: 4, dtype: 'Stich', t: Date.now() + 1 }); hitCheck(); });
  T('Zweiter Treffer während der ersten Treffer-Abfrage: nichts geht verloren', await p.evaluate(() => /5 Schaden/.test(pr()) && (S.hitQ || []).length === 1));
  await p.evaluate(() => click('hitApply', '1')); await wait(500);
  T('… nach dem Eintragen folgt der zweite', await p.evaluate(() => /Kurzbogen trifft Ilva: 4 Schaden/.test(pr()) && cur().play.hp === derive(cur(), S.hb).hpMax - 5), await p.evaluate(() => [pr(), cur().play.hp]));
  await p.evaluate(() => click('hitApply', '1')); await wait(400);
  /* Rettungswurf-Anforderung während offener Abfrage */
  await p.evaluate(() => { turnFresh(); castSpell(cur(), 'fireball', 3, 'slot'); S.combat.reqs.push({ id: 'r1', by: 'Feueratem', ab: 'dex', dc: 13, amount: 0, half: true, to: ['u2'], t: Date.now() }); reqCheck(); });
  T('Anforderung „Rettungswurf“ wartet, solange eine Abfrage offen ist', await p.evaluate(() => /Feuerball/.test(pr()) && !S.reqPend));
  await p.evaluate(() => click('svRes', 'none')); await wait(500);
  T('… erscheint danach', await p.evaluate(() => /Feueratem: GES-Rettungswurf SG 13/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => { window.__q = [0.9]; click('reqRoll', 'r1'); }); await wait(400);

  /* P03: Ziel beim Auslösen festhalten */
  await p.evaluate(() => { orbPrompt(''); turnFresh(); S.tgt = 'n:A'; castSpell(cur(), 'fireball', 3, 'slot'); });
  T('Feuerball nennt das Ziel (Goblin A)', await p.evaluate(() => /würfelt Goblin A/.test(pr())));
  await p.evaluate(() => { S.tgt = 'n:B'; window.__q = [0.99]; click('svRes', 'fail'); }); await wait(400);
  T('Zielwechsel nach dem Auslösen: Schaden geht trotzdem an Goblin A', await p.evaluate(() => /Schaden auf Goblin A/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('applyDmg', '1'));
  T('… Goblin A verliert TP, Goblin B nicht', await p.evaluate(() => S.combat.npcs[0].hp < 40 && S.combat.npcs[1].hp === 40));
  await p.evaluate(() => { turnFresh(); S.tgt = 'n:B'; castSpell(cur(), 'hold-person', 2, 'slot'); S.tgt = 'n:A'; click('scRes', 'fail'); });
  T('Person festhalten auf Goblin B, dann Zielwechsel: gelähmt ist Goblin B', await p.evaluate(() => npcConds(S.combat.npcs[1]).includes('paralyzed') && !npcConds(S.combat.npcs[0]).includes('paralyzed')));
  await p.evaluate(() => { turnFresh(); S.tgt = 'n:B'; castSpell(cur(), 'fire-bolt', 0, 'cantrip'); }); await wait(900);
  await p.evaluate(() => { S.tgt = 'n:A'; window.__q = [0.99]; click('saHit'); }); await wait(300);
  T('Feuerpfeil auf Goblin B, Zielwechsel vor dem Schaden: Schaden auf Goblin B', await p.evaluate(() => /Schaden auf Goblin B/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('applyDmg', 'x'));

  /* P10: Rückgängig betrifft nur den eigenen Helden */
  await p.evaluate(() => { orbPrompt(''); S.undo = []; const hp0 = cur().play.hp; window.__hp0 = hp0; window.__npc0 = S.combat.npcs[1].hp; const i = document.createElement('input'); i.id = 'tmpHp'; document.body.appendChild(i); });
  await p.evaluate(() => { S.view = 'sheet'; render(); const inp = document.querySelector('.hpctl input'); inp.value = '3'; document.querySelector('.hpctl [data-act="hp"][data-arg="dmg"]').click(); });
  await wait(100);
  await p.evaluate(() => { S.combat.npcs[1].hp = 7; click('undo'); });
  T('Rückgängig: eigene TP zurück, Gegner-TP (anderer Spieler/SL) unverändert', await p.evaluate(() => cur().play.hp === window.__hp0 && S.combat.npcs[1].hp === 7), await p.evaluate(() => [cur().play.hp, window.__hp0, S.combat.npcs[1].hp]));

  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
