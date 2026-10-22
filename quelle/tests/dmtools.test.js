/* SL-Werkzeuge: Zufallsbegegnung, Aufladung/legendäre Aktionen, eigene Monster, Beute. Aufruf: node tests/dmtools.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const out = [];
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  process.on('unhandledRejection', (e) => { out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got)))); console.log('ABBRUCH', e.message); process.exit(1); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.removeItem('hb_mobs'); UID = 'me1'; const n = newChar({ name: 'Brakk', cls: 'fig', level: 3 }); S.chars[n.id] = n; S.cur = n.id;
    window.saveCombat = (c) => { S.combat = c; paintCamp(); };
    S.camp = 'raum'; S.table = { [UID]: { char: 'Mira', init: null, ac: 12, level: 3, dm: true }, u2: { char: 'Lyra', init: null, ac: 13, level: 3 }, u3: { char: 'Tor', init: null, ac: 16, level: 3 }, u4: { char: 'Ka', init: null, ac: 15, level: 3 } }; S.meta = { dm: UID, mercy: {} }; S.combat = null; });

  /* ---- Zufallsbegegnung ---- */
  const st = await p.evaluate(() => { let tot = 0, ok = 0, nul = 0; for (const h of Object.keys(HABITATS)) for (const L of [1, 3, 5, 8, 12, 16]) for (const d of [0, 1, 2]) for (let k = 0; k < 4; k++) { const lv = [L, L, L, L]; const r = randEnc(h, lv, d); tot++; if (!r) { nul++; continue; } const B = erBudget(lv, d), lo = d ? erBudget(lv, d - 1) + 1 : B * 0.5; if (r.xp >= lo && r.xp <= B && r.n <= 12) ok++; } return { tot, ok, nul }; });
  T('Zufall: immer ein Vorschlag (alle Fundorte, Stufe 1–16)', st.nul === 0, st);
  T('Zufall: ≥ 97 % genau in der gewählten Schwierigkeit', st.ok / st.tot >= 0.97, st);
  T('Zufall: nur Kreaturen vom gewählten Fundort', await p.evaluate(() => { for (let i = 0; i < 30; i++) { const r = randEnc('gruft', [5, 5, 5, 5], 1); if (r.mobs.some((m) => !mobHab(m.mid).includes('gruft'))) return false; } return true; }));
  await p.evaluate(() => { S.view = 'camp'; render(); XA.encRandOpen(); });
  T('Planer öffnet mit Zufallsblock und Vorschlag', await p.evaluate(() => !!$('.encrand') && S.enc.mobs.some((m) => BESTIARY[m.mid]) && /Zufall/.test(S.enc.name)));
  T('Szene wird angezeigt', await p.evaluate(() => !!$('.erscene') && $('.erscene').textContent.length > 20));
  await p.evaluate(() => { $('#erHab').value = 'eis'; $('#erHab').dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('[data-act="erDiff"][data-arg="2"]').click(); document.querySelector('[data-act="encRand"]').click(); });
  T('Fundort Eis + Hoch: Planer zeigt „Hoch“', await p.evaluate(() => S.enc.mobs.every((m) => mobHab(m.mid).includes('eis')) && /Hoch/.test($('.encr b').textContent)), await p.evaluate(() => $('.encr b').textContent));
  T('Ohne Kampf: Knopf „Kampf beginnen“', await p.evaluate(() => !!document.querySelector('#modal [data-act="encFight"]')));
  await p.evaluate(() => document.querySelector('#modal [data-act="encFight"]').click());
  T('„Kampf beginnen“ startet den Kampf mit den Gegnern', await p.evaluate(() => S.combat && S.combat.active && S.combat.npcs.length > 0 && $('#modal').hidden));
  T('Im Kampf: ein Knopf „+ Gegner“ (öffnet den Planer mit Zufall, Bestiarium, Vorlagen)', await p.evaluate(() => document.querySelectorAll('#fightBox [data-act="encOpen"]').length === 1 && !document.querySelector('#fightBox #mobSel')));
  await p.evaluate(() => { const n0 = S.combat.npcs.length; window._n0 = n0; XA.encRandOpen(); document.querySelector('#modal [data-act="encGo"]').click(); });
  T('Im laufenden Kampf: „In den Kampf einsetzen“ fügt hinzu', await p.evaluate(() => S.combat.npcs.length > window._n0));
  await p.evaluate(() => { S.view = 'mobs'; render(); });
  T('Bestiarium: Knopf 🎲 Zufallsbegegnung', await p.evaluate(() => !!document.querySelector('#view [data-act="encRandOpen"]')));

  /* ---- Aufladung & legendär ---- */
  await p.evaluate(() => { S.combat = { id: 'k2', active: true, round: 1, npcs: [] }; encInsert([{ mid: 'red-wyrmling', n: 1 }, { mid: 'adult-red', n: 1 }], '', {}); S.meta.dmPlays = true; S.table[UID].init = { cid: 'k2', v: 1 }; S.view = 'camp'; render(); });
  T('Feueratem erkannt (GES SG 13, 7W6 Feuer)', await p.evaluate(() => { const f = mobFeats('red-wyrmling').rech[0]; return f.name === 'Feueratem' && f.dc === 13 && f.ab === 'dex' && f.dmg === '7W6' && f.half; }));
  T('Erwachsener Roter Drache: 3 legendäre Aktionen, 3 Widerstände', await p.evaluate(() => { const f = mobFeats('adult-red'); return f.la === 3 && f.lr === 3; }));
  T('⚡-Knopf und LA/LW-Punkte in der Gegnerzeile (SL)', await p.evaluate(() => document.querySelectorAll('#fightBox [data-act="mfUse"]').length === 2 && document.querySelectorAll('#fightBox [data-act="mfPip"]').length === 6));
  const wy = await p.evaluate(() => S.combat.npcs.find((x) => x.mid === 'red-wyrmling').id);
  await p.evaluate((id) => document.querySelector('#fightBox [data-act="mfUse"][data-arg="' + id + '"]').click(), wy);
  T('Einsetzen: verbraucht und Rettungswurf vorbereitet', await p.evaluate((id) => { const x = S.combat.npcs.find((y) => y.id === id); return x.rech.Feueratem.used && S.srForm && +S.srForm.dc === 13 && S.srForm.ab === 'dex' && S.srForm.dmg === '7W6'; }, wy));
  await p.waitForTimeout(200);
  T('Formular „Rettungswurf anfordern“ offen und vorbelegt', await p.evaluate(() => $('.sreq') && $('.sreq').open && $('#srDc').value === '13' && $('#srDmg').value === '7W6'));
  T('Verbraucht: Knopf „⟳“ zum Aufladen', await p.evaluate((id) => !!document.querySelector('#fightBox [data-act="mfRoll"][data-arg="' + id + '"]'), wy));
  await p.evaluate(() => { window._r = Math.random; Math.random = () => 0.99; });
  await p.evaluate((id) => { S.combat.turn = 'p:' + UID; const o = order(); const me = o.findIndex((x) => x.key === 'p:' + UID); /* Wyrmling direkt nach mir stellen */ const x = S.combat.npcs.find((y) => y.id === id); x.v = -5; S.combat.npcs.find((y) => y.mid === 'adult-red').v = 30; S.combat.turn = 'p:' + UID; nextTurn(); }, wy);
  T('Zugbeginn des Gegners: Aufladung gewürfelt (W6 6 → bereit)', await p.evaluate((id) => { const x = S.combat.npcs.find((y) => y.id === id); return S.combat.turn === 'n:' + id && x.rech.Feueratem.used === false && x.rech.Feueratem.roll === 6; }, wy));
  await p.evaluate(() => { Math.random = window._r; });
  const ad = await p.evaluate(() => S.combat.npcs.find((x) => x.mid === 'adult-red').id);
  await p.evaluate((id) => document.querySelector('#fightBox [data-act="mfPip"][data-arg="' + id + '"][data-k="laU"][data-i="0"]').click(), ad);
  T('Legendäre Aktion antippen: 1 verbraucht', await p.evaluate((id) => S.combat.npcs.find((y) => y.id === id).laU === 1, ad));
  await p.evaluate((id) => document.querySelector('#fightBox [data-act="mfPip"][data-arg="' + id + '"][data-k="lrU"][data-i="0"]').click(), ad);
  T('Legendärer Widerstand antippen: 1 verbraucht', await p.evaluate((id) => S.combat.npcs.find((y) => y.id === id).lrU === 1, ad));
  await p.evaluate((id) => { S.combat.turn = 'n:' + S.combat.npcs.find((y) => y.mid === 'red-wyrmling').id; nextTurn(); }, ad);
  T('Zugbeginn: legendäre Aktionen wieder voll, Widerstand bleibt verbraucht', await p.evaluate((id) => { const x = S.combat.npcs.find((y) => y.id === id); return S.combat.turn === 'p:' + UID ? x.laU === 1 : x.laU === 0 && x.lrU === 1; }, ad), await p.evaluate(() => S.combat.turn));
  await p.evaluate((id) => { S.combat.turn = 'p:' + UID; let g = 0; while (S.combat.turn !== 'n:' + id && g++ < 5) nextTurn(); }, ad);
  T('… beim Drachenzug: LA 0 verbraucht, LW 1 verbraucht', await p.evaluate((id) => { const x = S.combat.npcs.find((y) => y.id === id); return S.combat.turn === 'n:' + id && x.laU === 0 && x.lrU === 1; }, ad));
  await p.evaluate(() => { S.meta.dm = 'u2'; render(); });
  T('Spieler sehen keine Fähigkeitsknöpfe', await p.evaluate(() => !document.querySelector('#fightBox [data-act="mfUse"]') && !document.querySelector('#fightBox [data-act="mfPip"]')));
  await p.evaluate(() => { S.meta.dm = UID; S.meta.dmPlays = false; render(); });

  /* ---- Eigene Monster ---- */
  await p.evaluate(() => { S.view = 'mobs'; S.mhab = ''; render(); XA.meNew(); });
  T('Editor öffnet mit Richtwerten für den HG', await p.evaluate(() => !!$('#meName') && /Typisch für HG 1/.test($('.meguide').textContent)));
  await p.evaluate(() => { $('#meName').value = 'Moorhexe von Valdris'; $('#meCr').value = '3'; $('#meCr').dispatchEvent(new Event('change', { bubbles: true })); });
  T('HG ändern: Richtwerte passen sich an', await p.evaluate(() => /HG 3/.test($('.meguide').textContent) && $('#meName').value === 'Moorhexe von Valdris'));
  await p.evaluate(() => { $('#meAc').value = 15; $('#meHp').value = 60; $('#meHd').value = '8W8+24'; $('#meAn0').value = 'Klauen'; $('#meAb0').value = 5; $('#meAd0').value = '2W8+3'; $('#meAt0').value = 'Hieb'; $('#meTxt').value = 'Sumpfodem (Aufladung 5–6): 4,5-m-Kegel, KON SG 13, 4W8 Gift.'; $('#meLr').value = 1;
    document.querySelector('[data-act="meHab"][data-arg="sumpf"]').click(); document.querySelector('[data-act="meSave"]').click(); });
  const key = await p.evaluate(() => Object.keys(BESTIARY).find((k) => /^u-/.test(k)));
  T('Gespeichert: im Bestiarium und auf dem Gerät', await p.evaluate((k) => !!k && BESTIARY[k][0] === 'Moorhexe von Valdris' && JSON.parse(localStorage.getItem('hb_mobs')).length === 1 && BESTIARY[k][7][0][2] === '2W8+3', key));
  T('Fundort Sumpf zugeordnet', await p.evaluate((k) => mobHab(k).includes('sumpf'), key));
  T('Aufladung aus dem Text erkannt, legendärer Widerstand 1', await p.evaluate((k) => { const f = mobFeats(k); return f && f.rech[0].name === 'Sumpfodem' && f.rech[0].dc === 13 && f.rech[0].ab === 'con' && f.lr === 1 && f.la === 0; }, key));
  T('Filter „✎ Eigene (1)“ zeigt nur eigene', await p.evaluate(() => { document.querySelector('[data-act="mHab"][data-arg="own"]').click(); const m = document.querySelectorAll('#view details.mob'); return m.length === 1 && /Moorhexe/.test(m[0].textContent); }));
  T('Im Begegnungsplaner wählbar', await p.evaluate((k) => { S.view = 'camp'; render(); encPlanner(); const ok = !!document.querySelector('#modal select[data-enc="mid"] option[value="' + k + '"]'); $('#modal').hidden = true; S.modal = null; return ok; }, key));
  T('Kommt bei der Zufallsbegegnung im Sumpf vor', await p.evaluate((k) => { for (let i = 0; i < 400; i++) { const r = randEnc('sumpf', [3, 3, 3, 3], 1); if (r.mobs.some((m) => m.mid === k)) return true; } return false; }, key));
  await p.evaluate(() => { S.view = 'mobs'; S.mhab = ''; render(); document.querySelector('[data-act="meCopy"][data-arg="goblin"]').click(); });
  T('„Als Vorlage“ übernimmt Werte (Goblin)', await p.evaluate(() => /Goblin-Krieger \(Variante\)/.test($('#meName').value) && $('#meCr').value === '1/4'));
  await p.evaluate(() => { XA.closeModal ? XA.closeModal() : ($('#modal').hidden = true); S.modal = null; XA.meShare(); });
  const txt = await p.evaluate(() => $('#meJson').value);
  T('Teilen: Text enthält das Monster', /Moorhexe/.test(txt));
  await p.evaluate((t) => { localStorage.removeItem('hb_mobs'); ownMobsLoad(); const d = JSON.parse(t); d.mobs[0].name = 'Moorhexe (neu)'; d.mobs.push({ id: 'zz1', name: 'Torfgeist', cr: '1/2', ac: 12, hp: 15, atks: [['Hauch', 3, '1W6', 'Kälte']], hab: ['sumpf'] }); XA.meShare(); $('#meJson').value = JSON.stringify(d); XA.meImport(); }, txt);
  T('Laden: zwei Monster übernommen', await p.evaluate(() => ownMobs().length === 2 && Object.values(BESTIARY).some((m) => m[0] === 'Torfgeist')));
  await p.evaluate(() => { XA.meEdit(null, 'u-zz1'); document.querySelector('[data-act="meDel"]').removeAttribute('data-confirm'); XA.meDel(); });
  T('Löschen entfernt das Monster', await p.evaluate(() => ownMobs().length === 1 && !BESTIARY['u-zz1']));

  /* ---- Beute ---- */
  await p.evaluate(() => { S.combat = { id: 'k3', active: true, round: 1, npcs: [] }; encInsert([{ mid: 'goblin', n: 4 }, { mid: 'goblin-boss', n: 1 }], '', {}); S.combat.npcs.forEach((x, i) => { if (i < 3) x.hp = 0; }); S.view = 'camp'; render(); });
  T('Beute-Leiste: 3 besiegte Gegner erkannt', await p.evaluate(() => /3 Gegner \(besiegt\)/.test(($('.lootbar') || {}).textContent || '')));
  await p.evaluate(() => document.querySelector('[data-act="lootRoll"]').click());
  T('Beute gewürfelt: Münzen, EP = Summe der besiegten (150)', await p.evaluate(() => S.loot && S.loot.gm > 0 && S.loot.xp === 150 && !!$('.lootres')), await p.evaluate(() => S.loot));
  await p.evaluate(() => document.querySelector('[data-act="lootFill"]').click());
  T('Ins Formular: EP und Gold je Held (3 Helden)', await p.evaluate(() => $('#gXp').value === '50' && +$('#gGm').value === Math.floor(S.loot.gm / 3)), await p.evaluate(() => [$('#gXp').value, $('#gGm').value]));
  T('Formular bleibt nach Neuzeichnen vorbelegt', await p.evaluate(() => { paintCamp(); return $('#gXp').value === '50'; }));
  const hoard = await p.evaluate(() => { const a = []; for (let i = 0; i < 40; i++) a.push(lootGen([{ mid: 'adult-red' }], true)); return { gm: Math.min(...a.map((x) => x.gm)), items: a.filter((x) => x.items.length).length, tier: a[0].tier, bad: a.some((x) => x.items.some((k) => !MAGIC_ITEMS[k])) }; });
  T('Hort eines Drachen (HG 17): viel Gold, fast immer magische Gegenstände', hoard.gm >= 15000 && hoard.items >= 30 && hoard.tier === 3 && !hoard.bad, hoard);
  await p.evaluate(() => { const m = saveMeta; window.saveMeta = (o) => { Object.assign(S.meta, o); }; document.querySelector('[data-act="gift"]').click(); });
  T('Verteilen: Geschenk erstellt, Vorbelegung geleert', await p.evaluate(() => (S.meta.gifts || []).some((g) => g.xp === 50) && !S.gPre && !S.loot));
  await p.evaluate(() => { const l = S.combat.npcs; document.dispatchEvent(new Event('x')); const btn = document.createElement('button'); btn.dataset.act = 'fightEnd'; document.body.appendChild(btn); btn.addEventListener('click', (e) => e.stopPropagation()); btn.click(); btn.remove(); S.combat = { active: false }; S.loot = null; render(); });
  T('Nach Kampfende: Beute aus dem letzten Kampf möglich', await p.evaluate(() => /letzter Kampf/.test(($('.lootbar') || {}).textContent || '') && S.lastFoes.length === 3));

  /* ---- Handy ---- */
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => { S.combat = { id: 'k4', active: true, round: 1, npcs: [] }; encInsert([{ mid: 'adult-red', n: 1 }], '', {}); S.view = 'camp'; render(); XA.encRandOpen(); });
  T('Handy: Zufallsblock ohne Querscrollen', await p.evaluate(() => { const d = $('.encdlg'); return d && d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth <= 391; }));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; XA.meNew(); });
  T('Handy: Monster-Editor ohne Querscrollen', await p.evaluate(() => { const d = $('.medlg'); return d && d.scrollWidth <= d.clientWidth + 1; }));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; });
  T('Handy: Gegnerzeile mit Fähigkeiten passt in die Breite', await p.evaluate(() => { const li = document.querySelector('#fightBox .order li.npc'); return li && li.scrollWidth <= li.clientWidth + 1 && document.documentElement.scrollWidth <= 391; }));
  await p.screenshot({ path: path.join(__dirname, '..', '..', 'shot-dm-mobile.png') });

  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
