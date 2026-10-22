/* Kampf-Nachzügler und Bestiarium: Verstärkung, „noch nicht dabei“, besiegte Gegner überspringen, entfernter Aktiver,
   Fundorte + Stufenempfehlung. Aufruf: node tests/combat2.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const n = newChar({ name: 'Brakk', cls: 'fig', level: 3 }); S.chars[n.id] = n; S.cur = n.id;
    window.saveCombat = (c) => { S.combat = c; }; /* ohne Server */
    S.camp = 'raum'; S.table = { [UID]: { char: 'Brakk', init: null, ac: 16 }, u2: { char: 'Lyra', init: null, ac: 13 } }; S.meta = { dm: UID, mercy: {} };
    S.combat = { id: 'k1', active: true, round: 1, npcs: [] }; });
  /* Verstärkung */
  await p.evaluate(() => { encInsert([{ mid: 'goblin', n: 3 }], '', { groupInit: true, reserve: true }); encInsert([{ mid: 'wolf', n: 1 }], '', {}); });
  T('Verstärkung steht nicht in der Reihenfolge', await p.evaluate(() => order().filter((x) => x.npc).length === 1 && S.combat.npcs.filter((x) => x.reserve).length === 3));
  await p.evaluate(() => { S.view = 'camp'; render(); });
  T('SL sieht „Verstärkung (wartet)“ mit Knopf', await p.evaluate(() => /3× Goblin/.test(($('.fgrp.reserve') || {}).textContent || '')));
  await p.evaluate(() => $('.fgrp.reserve [data-act="npcJoin"]').click());
  T('„greift ein“: alle drei mit gemeinsamer Initiative einsortiert', await p.evaluate(() => { const g = order().filter((x) => /Goblin/.test(x.name)); return g.length === 3 && new Set(g.map((x) => x.v)).size === 1 && !S.combat.npcs.some((x) => x.reserve); }));
  /* noch nicht dabei */
  await p.evaluate(() => { S.table.u2.init = { cid: 'k1', away: true }; S.table[UID].init = { cid: 'k1', v: 15 }; render(); });
  T('Spieler „noch nicht dabei“: nicht in der Reihenfolge, als abseits gelistet', await p.evaluate(() => !order().some((x) => x.name === 'Lyra') && /Noch nicht im Kampf/.test($('#view').textContent) && !waiting().some((x) => x.name === 'Lyra')));
  await p.evaluate(() => { S.table.u2.init = { cid: 'k1', v: 30 }; });
  T('Greift ein: wird nach Initiative einsortiert', await p.evaluate(() => order()[0].name === 'Lyra'));
  /* Knopf „Noch nicht dabei“ für mich */
  await p.evaluate(() => { S.myInit = null; S.table[UID].init = null; render(); });
  T('Knopf „Noch nicht dabei“ vorhanden', await p.evaluate(() => !!document.querySelector('[data-act="initAway"]')));
  await p.evaluate(() => document.querySelector('[data-act="initAway"]').click());
  T('… setzt mich auf abseits', await p.evaluate(() => S.myInit.away === true && meDoc().init.away === true));
  /* besiegte Gegner überspringen */
  await p.evaluate(() => { S.table[UID].init = { cid: 'k1', v: 15 }; const o = order(); S.combat.turn = o[0].key; S.combat.turnAt = { v: o[0].v, dex: o[0].dex, name: o[0].name }; });
  const ordNames = await p.evaluate(() => order().map((x) => x.name + ':' + x.v));
  await p.evaluate(() => { const o = order(); const i = 1; const nxt = o[i]; if (nxt.npc) S.combat.npcs = S.combat.npcs.map((x) => (x.id === nxt.id ? Object.assign({}, x, { hp: 0 }) : x)); window.__dead = nxt.npc ? nxt.key : null; nextTurn(); });
  T('Besiegter Gegner wird übersprungen', await p.evaluate(() => !window.__dead || S.combat.turn !== window.__dead), ordNames);
  /* Aktiver wird entfernt */
  await p.evaluate(() => { const o = order(); const cur = o.find((x) => x.key === S.combat.turn); window.__before = o.map((x) => x.key); window.__curIdx = o.findIndex((x) => x.key === S.combat.turn);
    if (cur.npc) S.combat.npcs = S.combat.npcs.filter((x) => x.id !== cur.id); else { const n = S.combat.npcs.find((x) => !x.hp || x.hp > 0); S.combat.turn = 'n:' + n.id; S.combat.turnAt = { v: n.v, dex: n.dex, name: n.name }; window.__curIdx = order().findIndex((x) => x.key === S.combat.turn); window.__before = order().map((x) => x.key); S.combat.npcs = S.combat.npcs.filter((x) => x.id !== n.id); }
    window.__round = S.combat.round; nextTurn(); });
  T('Aktiver entfernt: es geht beim Nächsten weiter, nicht wieder oben', await p.evaluate(() => { const exp = window.__before.slice(window.__curIdx + 1).find((k) => order().some((x) => x.key === k && !skipTurn(x))); return exp ? S.combat.turn === exp && S.combat.round === window.__round : S.combat.round === window.__round + 1; }));
  /* Überraschung */
  await p.evaluate(() => { S.combat.surp = [UID]; });
  T('Überrascht: Nachteil auf Initiative', await p.evaluate(() => rollState('init').dis.includes('Überrascht')));
  T('Gegner überrascht: Initiative mit Nachteil (2 Würfel, kleinerer)', await p.evaluate(() => { const seq = [0.9, 0.1]; const o = Math.random; let i = 0; Math.random = () => seq[i++ % 2]; const m = mkMobs('wolf', 1, { surprised: true }, []); Math.random = o; return m[0].v === 3 + BESTIARY.wolf[6]; }));
  /* Neue Begegnung */
  await p.evaluate(() => { S.combat.npcs = S.combat.npcs.concat([{ id: 'tot', name: 'Toter', v: 5, dex: 0, hp: 0, hpMax: 7 }]); window.__oid = S.combat.id; const bt = document.createElement('button'); bt.dataset.act = 'fightReset'; bt.dataset.ok = '1'; document.body.appendChild(bt); S.modal = 'confirm'; bt.click(); bt.remove(); });
  T('Neue Begegnung: neue Kampf-ID (alle würfeln neu), Besiegte entfernt', await p.evaluate(() => S.combat.id !== window.__oid && !S.combat.npcs.some((x) => x.id === 'tot') && S.combat.npcs.length > 0 && !S.combat.turn));
  /* Treffer zustellen */
  await p.evaluate(() => { S.npcA = { name: 'Wolf A: Biss', dmg: '2W6', dtype: 'Stich', total: 18, nat: 15, tgt: 'p:u2' }; window.__q2 = [0.99, 0.99]; const o = Math.random; Math.random = () => (window.__q2.length ? window.__q2.shift() : 0.5); XA.npcHit(); Math.random = o; });
  T('Treffer an anderen Spieler wird zugestellt', await p.evaluate(() => (S.combat.hits || []).some((h) => h.to === 'u2' && h.amount === 12)));
  await p.evaluate(() => { S.combat.hits.push({ to: UID, by: 'Ork: Axt', amount: 9, dtype: 'Hieb', crit: false, t: Date.now() + 5 }); hitCheck(); });
  T('Eigener Held bekommt Treffer zum Eintragen angezeigt', await p.evaluate(() => !$('#prompt').hidden && /Ork: Axt trifft Brakk: 9/.test($('#prompt').textContent)));
  const hp0 = await p.evaluate(() => { const ch = cur(); ch.play.hp = 28; return ch.play.hp; });
  await p.evaluate(() => $('#prompt [data-act="hitApply"][data-arg="0.5"]').click());
  T('„Halb“ zieht die Hälfte ab', await p.evaluate((h) => cur().play.hp === h - 4, hp0));
  await p.evaluate(() => { const ch = cur(); ch.play.hp = 0; ch.play.ds = [0, 0]; hpChange(ch, 'dmg', 3, true); });
  T('Kritischer Treffer bei 0 TP: zwei Fehlschläge', await p.evaluate(() => cur().play.ds[1] === 2));
  /* Packen/Stossen, Todesrettung zu Zugbeginn, tote Helden überspringen */
  T('Packen und Stossen als Angriffsersatz in der Zugleiste', await p.evaluate(() => { const o = turnOpts(derive(cur(), S.hb)); return o.some((x) => x.id === 'ush:grapple') && o.some((x) => x.id === 'ush:shove'); }));
  await p.evaluate(() => { S.camp = ''; S.combat = null; const ch = cur(); ch.play.hp = 20; ch.play.ds = [0, 0]; ch.play.cond = []; ch.play.localFight = true; turnReset(ch); turnRun(ch, 'ush:shove'); });
  T('Stossen verbraucht einen Angriff und fragt den Rettungswurf (SG) ab', await p.evaluate(() => turnSt(cur()).atk === 1 && /Stossen.*Rettungswurf SG \d+/.test($('#prompt').textContent)));
  await p.evaluate(() => document.querySelector('#prompt [data-act="scRes"][data-arg="fail"]').click());
  T('… misslungen: Eintrag mit weggestossen/liegend', await p.evaluate(() => /misslungen.*weggestossen oder liegend/.test(S.log[0].detail)));
  await p.evaluate(() => { const ch = cur(); ch.play.hp = 0; ch.play.stable = false; ch.play.dead = false; startOfTurn(ch); });
  await p.waitForTimeout(600);
  T('0 TP zu Zugbeginn: Todesrettungswurf wird angeboten', await p.evaluate(() => !$('#prompt').hidden && !!$('#prompt [data-act="deathRoll"]')));
  await p.evaluate(() => { $('#prompt [data-act="deathRoll"]').click(); });
  await p.waitForTimeout(100);
  T('… Würfeln schliesst die Abfrage und trägt das Ergebnis ein', await p.evaluate(() => $('#prompt').hidden && /Todesrettungswurf/.test(S.log[0].label)));
  await p.evaluate(() => { cur().play.hp = 20; cur().play.ds = [0, 0]; cur().play.localFight = false; });
  T('Tote Helden werden in der Reihenfolge übersprungen', await p.evaluate(() => skipTurn({ npc: false, dead: true }) && !skipTurn({ npc: false, dead: false, hp: 0 })));
  /* Rettungswurf anfordern */
  await p.evaluate(() => { const ch = cur(); ch.play.hp = 30; ch.play.cond = []; S.camp = 'raum'; S.table = { [UID]: { char: 'Brakk', init: { cid: 'k9', v: 10 } }, u2: { char: 'Lyra', init: { cid: 'k9', v: 8 } } }; S.meta = { dm: UID, mercy: {} }; S.combat = { id: 'k9', active: true, round: 1, npcs: [] }; S.view = 'camp'; render(); });
  T('SL sieht „Rettungswurf anfordern“', await p.evaluate(() => !!document.querySelector('.sreq')));
  await p.evaluate(() => { document.querySelector('.sreq').open = true; $('#srBy').value = 'Feuerball'; $('#srDc').value = '30'; $('#srDmg').value = '8W6'; $('#srTy').value = 'Feuer'; document.querySelector('[data-act="srTo"][data-arg="*"]').click(); });
  T('Eingaben bleiben beim Auswählen erhalten', await p.evaluate(() => $('#srBy').value === 'Feuerball' && $('#srDc').value === '30' && (S.srTo || []).length === 2));
  await p.evaluate(() => document.querySelector('[data-act="srSend"]').click()); await p.waitForTimeout(200);
  T('Anforderung gespeichert, Schaden mitgewürfelt', await p.evaluate(() => { const r = (S.combat.reqs || [])[0]; return r && r.to.length === 2 && r.amount >= 8 && r.dc === 30; }));
  T('Eigener Held bekommt die Aufforderung', await p.evaluate(() => !$('#prompt').hidden && /Feuerball: GES-Rettungswurf SG 30/.test($('#prompt').textContent)));
  await p.evaluate(() => $('#prompt [data-act="reqRoll"]').click()); await p.waitForTimeout(500);
  T('Ergebnis an die SL zurück (misslungen bei SG 30)', await p.evaluate(() => (S.combat.saveRes || []).some((x) => x.uid === String(UID) && x.ok === false)));
  T('Voller Schaden zum Eintragen angeboten', await p.evaluate(() => { const r = S.combat.reqs[0]; return !$('#prompt').hidden && new RegExp('Feuerball trifft Brakk: ' + r.amount).test($('#prompt').textContent); }));
  await p.evaluate(() => $('#prompt [data-act="hitApply"][data-arg="0"]').click());
  await p.evaluate(() => { S.view = 'camp'; render(); });
  T('SL sieht das Ergebnis in der Übersicht', await p.evaluate(() => /Brakk \d+ ✗/.test(document.querySelector('.srres').textContent) && /Lyra …/.test(document.querySelector('.srres').textContent)));
  /* Helden löschen */
  await p.evaluate(() => { for (const id of Object.keys(S.chars)) { const bt = document.createElement('button'); bt.dataset.act = 'delChar'; bt.dataset.arg = id; document.body.appendChild(bt); bt.click(); bt.remove(); } S.view = 'sheet'; render(); });
  T('Alle Helden löschbar, kein automatischer Ersatz', await p.evaluate(() => Object.keys(S.chars).length === 0 && /Noch kein Held/.test($('#view').textContent)));
  await p.evaluate(() => { S.view = 'build'; render(); S.view = 'camp'; render(); S.view = 'heroes'; render(); });
  T('Ohne Helden laufen alle Seiten', true);
  /* Bestiarium */
  T('Mehr Kreaturen (≥ 180)', await p.evaluate(() => Object.keys(BESTIARY).length >= 180), await p.evaluate(() => Object.keys(BESTIARY).length));
  T('Jede Kreatur hat einen Fundort und eine Empfehlung', await p.evaluate(() => Object.keys(BESTIARY).every((k) => MOB_HAB[k] && HABITATS[mobHab(k)[0]] && mobRec(BESTIARY[k][1]).txt !== '–')), await p.evaluate(() => Object.keys(BESTIARY).filter((k) => !MOB_HAB[k] || !CR_XP[BESTIARY[k][1]])));
  T('Alle Werte vollständig (RK, TP, Würfel, Angriffe)', await p.evaluate(() => Object.values(BESTIARY).every((m) => m.length >= 8 && m[2] > 0 && m[3] > 0 && /W/.test(m[4]) && m[7].length && m[7].every((a) => typeof a[1] === 'number'))));
  T('TP-Würfel sind würfelbar', await p.evaluate(() => Object.values(BESTIARY).every((m) => rollExpr(m[4].replace(/−/g, '-')).total > 0)));
  T('Empfehlung plausibel: Goblin als Schar Stufe 1, Troll ~Stufe 4–7, Balor sehr hoch', await p.evaluate(() => mobRec('1/4').swarm && mobRec('5').lo >= 3 && mobRec('5').hi <= 8 && mobRec('19').lo >= 14), await p.evaluate(() => [mobRec('1/4'), mobRec('5'), mobRec('19')]));
  await p.evaluate(() => { S.view = 'mobs'; S.mhab = ''; render(); });
  T('Bestiarium nach Fundort gruppiert', await p.evaluate(() => document.querySelectorAll('.mhab').length >= 8));
  T('Innerhalb des Fundorts nach Stärke sortiert', await p.evaluate(() => [...document.querySelectorAll('.mobs')].every((g) => { const v = [...g.querySelectorAll('summary small')].map((s) => crNum(/HG ([\d/]+)/.exec(s.textContent)[1])); return v.every((x, i) => !i || x >= v[i - 1]); })));
  await p.evaluate(() => { S.mhab = 'hoehle'; S.mlv = '3'; render(); });
  T('Filter Fundort + Gruppenstufe zeigt nur Passendes', await p.evaluate(() => { const ks = [...document.querySelectorAll('.mob summary b')].map((x) => x.textContent); return ks.length > 0 && ks.every((n) => { const k = Object.keys(BESTIARY).find((q) => BESTIARY[q][0] === n); return mobHab(k).includes('hoehle') && mobFits(BESTIARY[k][1], 3); }); }));
  T('Planer: Monsterauswahl nach Fundort gruppiert, Verstärkung/überrascht im Kampf', await p.evaluate(() => { S.enc = null; encPlanner(); const ok = document.querySelectorAll('#modal select[data-enc="mid"] optgroup').length >= 8 && !!$('#encRes') && !!$('#encSur'); $('#modal').hidden = true; S.modal = null; return ok; }));
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
