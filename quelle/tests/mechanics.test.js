/* Abläufe mit Zwischenschritt: Zustände durch Rettungswurf, Zielzustand beim Gegnerangriff, Reaktionen (Schild, Unglaubliches Ausweichen),
   Resistenz-Hinweis, Zusatzeffekte von Monsterangriffen, Entrinnen, Ausweichen, Eissplitter, Schaden aufs gewählte Ziel.
   Aufruf: node tests/mechanics.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  process.on('unhandledRejection', (e) => { out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got)))); console.log('ABBRUCH', e.message); process.exit(1); });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); UID = 'me1'; window.__q = []; Math.random = () => (window.__q.length ? window.__q.shift() : 0.5);
    window.saveCombat = (c) => { S.combat = c; }; window.click = (act, arg, ds) => { const t = document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; Object.assign(t.dataset, ds || {}); document.body.appendChild(t); t.click(); t.remove(); };
    window.mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'T' }, o))); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.hp = derive(ch, S.hb).hpMax; return ch; };
    window.pr = () => ($('#prompt').hidden ? '' : $('#prompt').textContent);
    window.fight = (npcs) => { S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', ac: 12 }, u2: { char: 'Lyra', ac: 14, cond: [] } }; S.combat = { id: 'k', active: true, round: 1, turn: 'p:me1', npcs: npcs || [{ id: 'A', mid: 'ghoul', name: 'Ghul A', hp: 22, hpMax: 22, ac: 12, cond: [] }], effects: [] }; };
  });

  /* ---- Zustände durch Rettungswurf ---- */
  await p.evaluate(() => { const ch = mk({ cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['hold-person', 'ice-knife', 'fireball', 'fire-bolt'], prepared: ['hold-person', 'ice-knife', 'fireball'] }); fight(); S.tgt = 'n:A'; castSpell(ch, 'hold-person', 2, 'slot'); });
  T('Person festhalten: erst Rettungswurf-Abfrage (WEI SG 14)', await p.evaluate(() => /Person festhalten: WEI-Rettungswurf SG 14/.test(pr()) && /Misslungen – Gelähmt/.test(pr())), await p.evaluate(() => pr()));
  T('… Platz verbraucht, Effekt angelegt', await p.evaluate(() => +cur().play.slots[2] === 1 && S.combat.effects.some((e) => e.spell === 'hold-person')));
  await p.evaluate(() => click('scRes', 'fail'));
  T('Misslungen: Ziel (Ghul A) gelähmt, Effekt hängt am Ziel', await p.evaluate(() => npcConds(S.combat.npcs[0]).includes('paralyzed') && !S.combat.npcs[0].cond.length && S.combat.effects.find((e) => e.spell === 'hold-person').tgt === 'n:A' && /Ghul A: Rettungswurf misslungen – Gelähmt/.test(S.log[0].detail)), await p.evaluate(() => [S.combat.npcs[0].cond, S.log[0]]));
  T('Nur eine Meldung (Platz, Konzentration und Ergebnis zusammen)', await p.evaluate(() => /Platz Grad 2 verbraucht/.test(S.log[0].detail) && !/Person festhalten/.test(S.log[1] ? S.log[1].label : '')), await p.evaluate(() => S.log.slice(0, 2)));
  await p.evaluate(() => { const e = S.combat.effects.find((x) => x.spell === 'hold-person'); S.combat.effects = S.combat.effects.filter((x) => x !== e); });
  T('Effekt endet → „gelähmt“ verschwindet von selbst', await p.evaluate(() => !npcConds(S.combat.npcs[0]).includes('paralyzed')));
  await p.evaluate(() => { const ch = mk({ cls: 'mon', level: 5, base: { str: 10, dex: 16, con: 14, int: 10, wis: 14, cha: 8 } }); S.combat.npcs[0].cond = []; const f = FEAT_ACTIONS.find((x) => x.id === 'stun'); f.run(ch, derive(ch, S.hb)); });
  T('Betäubender Schlag: Abfrage KON SG 13, „Geschafft“ nennt die 2024-Wirkung', await p.evaluate(() => /Betäubender Schlag: KON-Rettungswurf SG 13/.test(pr()) && /halbe Bewegungsrate/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('scRes', 'ok'));
  T('… geschafft: kein Zustand, Eintrag mit Wirkung', await p.evaluate(() => !S.combat.npcs[0].cond.length && /geschafft – halbe Bewegungsrate/.test(S.log[0].detail)));
  await p.evaluate(() => { const f = FEAT_ACTIONS.find((x) => x.id === 'stun'); f.run(cur(), derive(cur(), S.hb)); click('scRes', 'fail'); });
  T('Betäubt (misslungen): als Effekt bis zum Beginn deines nächsten Zuges', await p.evaluate(() => npcConds(S.combat.npcs[0]).includes('stunned') && S.combat.effects.some((e) => e.tgt === 'n:A' && e.left === 1)));
  await p.evaluate(() => { S.meta.dmPlays = true; S.table.me1.init = { cid: 'k', v: 10 }; S.combat.npcs[0].v = 15; S.combat.turn = 'n:A'; nextTurn(); });
  T('… zu Beginn deines Zugs endet „betäubt“', await p.evaluate(() => S.combat.turn === 'p:me1' && !npcConds(S.combat.npcs[0]).includes('stunned')), await p.evaluate(() => [S.combat.turn, S.combat.effects]));

  /* ---- Gegnerangriff gegen Zielzustand ---- */
  await p.evaluate(() => { mk({ cls: 'fig', level: 3, name: 'Mira' }); fight(); S.table.u2.cond = ['Liegend']; S.npcA = { tgt: 'p:u2' }; window.__q = [0.45]; click('npcAtk', 'A', { j: '0' }); });
  await p.waitForTimeout(250);
  T('Ziel liegend: Hinweis aus 1,5 m Vorteil / weiter weg Nachteil', await p.evaluate(() => /Lyra: liegend → aus 1,5 m Vorteil/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => { window.__q = [0.95]; click('npcRe', 'adv'); });
  await p.waitForTimeout(250);
  T('„Mit Vorteil auswerten“: zweiter W20, höherer zählt', await p.evaluate(() => S.npcA.re === 'adv' && S.npcA.nat === 20 && /Vorteil/.test(pr())), await p.evaluate(() => S.npcA));
  await p.evaluate(() => { click('npcMiss'); S.table.u2.cond = ['Gelähmt']; window.__q = [0.6]; click('npcAtk', 'A', { j: '0' }); });
  await p.waitForTimeout(250);
  T('Ziel gelähmt: Vorteil-Hinweis und Schalter „Aus 1,5 m: kritisch“', await p.evaluate(() => /Gelähmt → Vorteil/.test(pr()) && !!$('#prompt [data-act="npcCrit5"]')));
  T('Ghul-Klauen: Zusatz „KON SG 10 oder gelähmt“ angeboten und an', await p.evaluate(() => S.npcA.rider && S.npcA.rider.dc === 10 && S.npcA.rider.conds.includes('paralyzed') && S.npcA.riderOn));
  await p.evaluate(() => { S.npcA.nat = 12; S.npcA.total = 16; S.table.u2.ac = 15; npcPrompt(); });
  T('Deckung: ohne trifft 16 gegen RK 15 …', await p.evaluate(() => /Trifft Lyra \(16 gegen RK 15\)/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('npcCover', '2'));
  T('… mit halber Deckung (+2) verfehlt', await p.evaluate(() => /Verfehlt Lyra \(16 gegen RK 17 mit Deckung\)/.test(pr())));
  await p.evaluate(() => { click('npcCover', '0'); click('npcCrit5'); window.__q = [0.5, 0.5]; click('npcHit'); });
  T('Krit aus 1,5 m: Schadenswürfel verdoppelt, Treffer mit Zusatz zugestellt', await p.evaluate(() => /kritisch/.test(S.combat.hits.slice(-1)[0].by + S.log[0].label) && S.combat.hits.slice(-1)[0].rider && S.combat.hits.slice(-1)[0].to === 'u2'), await p.evaluate(() => S.combat.hits));
  await p.evaluate(() => { orbPrompt(''); S.table.u2.cond = []; S.table.u2.dodge = true; S.npcA = { tgt: 'p:u2' }; window.__q = [0.6]; click('npcAtk', 'A', { j: '0' }); });
  await p.waitForTimeout(250);
  T('Ziel weicht aus: Nachteil-Hinweis', await p.evaluate(() => /weicht aus → Nachteil/.test(pr())));
  await p.evaluate(() => { click('npcMiss'); S.table.u2.dodge = false; });

  /* ---- Treffer beim eigenen Helden ---- */
  await p.evaluate(() => { const ch = mk({ cls: 'fig', level: 3, name: 'Mira', base: { str: 15, dex: 12, con: 14, int: 10, wis: 10, cha: 10 } }); fight(); hitPrompt({ by: 'Ghul A: Klauen', amount: 8, dtype: 'Hieb', atk: 14, nat: 10, crit: false, rider: mobRider('ghoul', 'Klauen'), t: Date.now() }); });
  T('Treffer mit Zusatz: Hinweis „Danach: KON SG 10 …“', await p.evaluate(() => /Danach: KON SG 10/.test(pr())));
  await p.evaluate(() => click('hitApply', '1'));
  await p.waitForTimeout(300);
  T('Nach dem Eintragen: Rettungswurf-Abfrage für den Zusatz', await p.evaluate(() => cur().play.hp === derive(cur(), S.hb).hpMax - 8 && /KON-Rettungswurf SG 10/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => { window.__q = [0.01]; click('riderGo', 'roll'); });
  await p.waitForTimeout(500);
  T('Misslungen: „Gelähmt setzen“ angeboten', await p.evaluate(() => /Gelähmt setzen/.test(pr())), await p.evaluate(() => [pr(), S.log[0]]));
  await p.evaluate(() => click('condGo', 'yes'));
  T('… Zustand am Helden gesetzt und geteilt', await p.evaluate(() => cur().play.cond.includes('paralyzed') && /Gelähmt/.test(S.log[0].label)));
  /* Schild */
  await p.evaluate(() => { const ch = mk({ cls: 'wiz', level: 3, name: 'Ilva', base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['shield'], prepared: ['shield'] }); fight(); S.combat.turn = 'n:A'; window.__ac = derive(ch, S.hb).ac; hitPrompt({ by: 'Ghul A: Klauen', amount: 7, dtype: 'Hieb', atk: window.__ac + 2, nat: 12, crit: false, t: Date.now() }); });
  T('Magier mit Schild: Knopf „Schild – wehrt ab“', await p.evaluate(() => /Schild wehrt ab/.test(pr()) && !$('#prompt [data-act="hitShield"]').disabled), await p.evaluate(() => pr()));
  await p.evaluate(() => click('hitShield'));
  T('Schild: Platz und Reaktion verbraucht, kein Schaden', await p.evaluate(() => +cur().play.slots[1] === 1 && turnSt(cur()).r === 1 && cur().play.hp === derive(cur(), S.hb).hpMax && /abgewehrt/.test(S.log[0].total)), await p.evaluate(() => [cur().play.slots, turnSt(cur()), S.log.slice(0, 2)]));
  await p.evaluate(() => { const ch = cur(); ch.play.turn.r = 0; delete ch.play.fx.shield; hitPrompt({ by: 'Oger', amount: 9, dtype: 'Wucht', atk: window.__ac + 9, nat: 15, crit: false, t: Date.now() }); });
  T('Zu hoher Angriff: Schild-Knopf gesperrt („reicht nicht“)', await p.evaluate(() => /reicht nicht/.test(pr()) && $('#prompt [data-act="hitShield"]').disabled));
  await p.evaluate(() => click('hitApply', '0'));
  /* Unglaubliches Ausweichen + Resistenz */
  await p.evaluate(() => { mk({ cls: 'rog', level: 7, name: 'Kira' }); fight(); S.combat.turn = 'n:A'; hitPrompt({ by: 'Ghul A: Biss', amount: 11, dtype: 'Stich', atk: 18, nat: 15, crit: false, t: Date.now() }); });
  T('Schurke 5+: „Unglaubliches Ausweichen (5)“', await p.evaluate(() => /Unglaubliches Ausweichen \(5\)/.test(pr())));
  await p.evaluate(() => $('#prompt [data-uncanny]').click());
  T('… halbiert und Reaktion verbraucht', await p.evaluate(() => cur().play.hp === derive(cur(), S.hb).hpMax - 5 && turnSt(cur()).r === 1 && /Unglaubliches Ausweichen/.test(S.log[0].detail)));
  await p.evaluate(() => { const ch = mk({ cls: 'bar', level: 3, name: 'Brakk' }); ch.play.raging = true; commit(); fight(); hitPrompt({ by: 'Ork: Axt', amount: 12, dtype: 'Hieb', atk: 15, nat: 12, crit: false, t: Date.now() }); });
  T('Barbar im Kampfrausch gegen Hieb: Resistenz-Hinweis, „Halb“ empfohlen', await p.evaluate(() => /Kampfrausch: Resistenz gegen Hieb/.test(pr()) && $('#prompt [data-act="hitApply"][data-arg="0.5"]').classList.contains('rec')), await p.evaluate(() => pr()));
  await p.evaluate(() => click('hitApply', '0'));

  /* ---- Rettungswurf-Anforderung: Entrinnen und Zusatzeffekt ---- */
  await p.evaluate(() => { mk({ cls: 'rog', level: 7, name: 'Kira', base: { str: 8, dex: 18, con: 12, int: 10, wis: 10, cha: 10 } }); fight(); S.combat.reqs = [{ id: 'r1', by: 'Feueratem', ab: 'dex', dc: 13, amount: 20, dtype: 'Feuer', half: true, to: ['me1'], t: Date.now() }]; S.combat.saveRes = []; window.__q = [0.95]; click('reqRoll', 'r1'); });
  await p.waitForTimeout(700);
  T('Entrinnen: GES-Rettungswurf geschafft → gar kein Schaden', await p.evaluate(() => S.combat.saveRes[0].ok && !/Feueratem/.test(pr())), await p.evaluate(() => [S.combat.saveRes, pr()]));
  await p.evaluate(() => { S.combat.reqs.push({ id: 'r2', by: 'Feueratem', ab: 'dex', dc: 13, amount: 20, dtype: 'Feuer', half: true, to: ['me1'], t: Date.now() }); window.__q = [0.01]; click('reqRoll', 'r2'); });
  await p.waitForTimeout(700);
  T('Entrinnen: misslungen → nur die Hälfte (10)', await p.evaluate(() => /: 10 Schaden/.test(pr()) && /Entrinnen/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => { click('hitApply', '0'); mk({ cls: 'fig', level: 3, name: 'Mira' }); S.combat.reqs.push({ id: 'r3', by: 'Riesenspinne: Netz', ab: 'dex', dc: 13, amount: 0, half: false, fx: 'festgesetzt', conds: ['restrained'], to: ['me1'], t: Date.now() }); window.__q = [0.01]; click('reqRoll', 'r3'); });
  await p.waitForTimeout(700);
  T('Anforderung mit Zusatz (Netz): misslungen → „Festgesetzt setzen“', await p.evaluate(() => /Festgesetzt setzen/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('condGo', 'no'));
  T('Odem/Netz-Knopf (⚡) liefert den Zusatz mit: Netz → festgesetzt', await p.evaluate(() => { fight([{ id: 'S', mid: 'giant-spider', name: 'Spinne', hp: 26, hpMax: 26, ac: 14, cond: [] }]); S.view = 'camp'; render(); click('mfUse', 'S', { j: '0' }); return S.srFx && S.srFx.conds.includes('restrained'); }));

  /* ---- Ausweichen ---- */
  await p.evaluate(() => { const ch = mk({ cls: 'fig', level: 3, name: 'Mira' }); fight(); stdRun(ch, derive(ch, S.hb), 'dodge'); });
  T('Ausweichen: Zustand gemerkt, für den Tisch sichtbar', await p.evaluate(() => cur().play.fx.dodge && meDoc().dodge === true));
  T('… Vorteil auf GES-Rettungswürfe', await p.evaluate(() => rollState('save:dex').adv.includes('Ausweichen')), await p.evaluate(() => rollState('save:dex')));
  await p.evaluate(() => turnReset(cur()));
  T('… endet zu Beginn des eigenen Zugs', await p.evaluate(() => !cur().play.fx.dodge));

  /* ---- Eissplitter, Schaden aufs gewählte Ziel ---- */
  await p.evaluate(() => { const ch = mk({ cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['ice-knife', 'fireball', 'fire-bolt'], prepared: ['ice-knife', 'fireball'] }); fight(); S.tgt = 'n:A'; window.__q = [0.7]; castSpell(ch, 'ice-knife', 1, 'slot'); });
  await p.waitForTimeout(1300);
  T('Eismesser: zuerst der Angriff', await p.evaluate(() => /Eismesser.*Angriff/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => { window.__q = [0.99]; $('#prompt [data-act="saHit"]') ? $('#prompt [data-act="saHit"]').click() : click('saHit'); });
  await p.waitForTimeout(400);
  T('Treffer mit Zauberangriff: Schaden aufs gewählte Ziel anwenden (Ghul A)', await p.evaluate(() => /Schaden auf Ghul A/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('applyDmg', '1'));
  await p.waitForTimeout(600);
  T('… danach die Explosion: GES-Rettungswurf, kein halber Schaden', await p.evaluate(() => S.combat.npcs[0].hp < 22 && /Explosion.*GES-Rettungswurf/.test(pr()) && /kein Schaden/.test(pr())), await p.evaluate(() => [S.combat.npcs[0].hp, pr()]));
  await p.evaluate(() => { click('svRes', 'none'); turnReset(cur()); castSpell(cur(), 'fireball', 3, 'slot'); window.__q = [0.99]; click('svRes', 'fail'); });
  await p.waitForTimeout(400);
  T('Feuerball misslungen: Schaden aufs gewählte Ziel anwenden', await p.evaluate(() => /Feuerball: \d+ Schaden auf Ghul A/.test(pr())), await p.evaluate(() => pr()));
  await p.evaluate(() => click('applyDmg', '1'));
  T('… Ghul A besiegt (0 TP)', await p.evaluate(() => S.combat.npcs[0].hp === 0));

  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
