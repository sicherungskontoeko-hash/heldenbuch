/* Abenteuer „Das Wirtshaus zum letzten Krug“: Szenen, Rollenspiel-Kästen, Zähler, Würfeltabellen, Gegenstände nur bei aktivem Abenteuer,
   Geben, Kreaturen mit SRD-Monstern, alle Kämpfe, Monsterhilfe für die eigenen Monster, Laden aus Datei.
   Aufruf: node tests/krug.test.js [app.html] [Wirtshaus_zum_letzten_Krug.heldenbuch.json] [bilder-ordner] */
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const out = [];
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const fileArg = process.argv[3]; const shots = process.argv[4];
let P0 = null; const shot = async (n) => { if (!shots) return; await P0.evaluate(() => document.querySelectorAll('#mini .mt, .rollpop').forEach((e) => e.remove())); await P0.screenshot({ path: path.join(shots, n), fullPage: false }); };
(async () => {
  process.on('unhandledRejection', (e) => { out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got)))); console.log('ABBRUCH', e.message); process.exit(1); });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const T = (n, ok, got) => out.push({ n, ok: !!ok, got }); P0 = p;
  await p.goto('file://' + target); await p.waitForTimeout(400);
  const setup = () => p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.removeItem('hb_mobs'); localStorage.removeItem('hb_encounters'); localStorage.removeItem('hb_adv'); ADV_ON_C = null; ownMobsLoad(); UID = 'me1';
    window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (m) => { S.meta = Object.assign({}, S.meta, m); paintCamp(); };
    S.camp = 'raum'; S.table = { me1: { char: 'SL', init: null, ac: 10, level: 4, dm: true }, u2: { char: 'Lyra', ac: 13, level: 4 }, u3: { char: 'Tor', ac: 16, level: 4 }, u4: { char: 'Ka', ac: 15, level: 4 }, u5: { char: 'Rin', ac: 14, level: 4 }, u6: { char: 'Mo', ac: 12, level: 4 } };
    S.meta = { dm: 'me1', mercy: {} }; S.combat = null; S.adv = null; S.view = 'adv'; SRCH_IDX = null; render(); });
  await setup();

  /* ---- Bibliothek und Gegenstände (aus) ---- */
  T('Bibliothek zeigt beide eingebauten Abenteuer', await p.evaluate(() => !!document.querySelector('[data-act="advOpen"][data-arg="krug"]') && !!document.querySelector('[data-act="advOpen"][data-arg="machtader"]')));
  T('59 Gegenstände in MAGIC_ITEMS, alle mit Herkunft „krug“', await p.evaluate(() => Object.keys(MAGIC_ITEMS).filter((k) => /^krug-/.test(k) && MAGIC_ITEMS[k].adv === 'krug').length === 59));
  T('Karte: Schalter „Gegenstände aktiv“ ist aus', await p.evaluate(() => { const c = document.querySelector('.advon input[data-arg="krug"]'); return c && !c.checked; }));
  const hidden = await p.evaluate(() => ({ opts: /krug-/.test(itemOpts()), srch: srchIndex().some((x) => x.cat === 'item' && /^krug-/.test(x.id)), vis: itemVis()('krug-kochbeil') }));
  T('Aus: nicht im Bogen, nicht in der Suche', !hidden.opts && !hidden.srch && !hidden.vis, hidden);
  const loot0 = await p.evaluate(() => { let n = 0; for (let i = 0; i < 300; i++) n += lootGen([{ mid: 'troll' }, { mid: 'troll' }], true).items.filter((k) => /^krug-/.test(k)).length; return n; });
  T('Aus: Zufallsbeute verteilt keine Krug-Gegenstände', loot0 === 0, loot0);
  await p.evaluate(() => { S.view = 'camp'; render(); });
  T('Aus: Beute-Formular ohne Krug-Gegenstände', await p.evaluate(() => !!$('#gItem') && ![...$('#gItem').options].some((o) => /^krug-/.test(o.value))));

  /* ---- Einschalten ---- */
  await p.evaluate(() => { S.view = 'adv'; S.adv = null; render(); document.querySelector('.advon input[data-arg="krug"]').click(); });
  const shown = await p.evaluate(() => ({ on: advActiveIds(), opts: (itemOpts().match(/value="krug-/g) || []).length, star: /✦ Das Kochbeil/.test(itemOpts()), srch: srchIndex().filter((x) => x.cat === 'item' && /^krug-/.test(x.id)).length }));
  T('Ein: alle 59 im Bogen (mit ✦) und in der Suche', shown.on.includes('krug') && shown.opts === 59 && shown.star && shown.srch === 59, shown);
  await p.evaluate(() => { S.view = 'camp'; render(); });
  T('Ein: Beute-Formular zeigt „✦ Das Kochbeil“', await p.evaluate(() => [...$('#gItem').options].some((o) => o.value === 'krug-kochbeil' && /✦/.test(o.textContent))));
  const loot1 = await p.evaluate(() => { let n = 0; for (let i = 0; i < 400; i++) n += lootGen([{ mid: 'cr4' in BESTIARY ? 'cr4' : 'troll' }], true).items.filter((k) => /^krug-/.test(k)).length; return n; });
  T('Ein: Zufallsbeute kann Krug-Gegenstände ziehen', loot1 > 0, loot1);

  /* ---- Öffnen, Übersicht, Kapitel ---- */
  await p.evaluate(() => { S.view = 'adv'; S.adv = null; render(); document.querySelector('[data-act="advOpen"][data-arg="krug"]').click(); });
  T('Übersicht: 8 Kapitel + Figuren, Kreaturen, Gegenstände', await p.evaluate(() => S.adv === 'krug' && document.querySelectorAll('.advnav .chip').length === 12 && /Gegenstände/.test($('.advnav').textContent)));
  T('Übersicht: Zeitplan-Tabelle und Schalter', await p.evaluate(() => /21:15/.test($('.advtw').textContent) && !!document.querySelector('.advch .advon input:checked')));
  await shot('krug-1-uebersicht.png');
  await p.evaluate(() => XA.advTab(null, 'ch:vor'));
  T('Vorbereitung: vier Szenen', await p.evaluate(() => document.querySelectorAll('.advscn button').length === 4));

  /* ---- Rollenspiel-Kasten ---- */
  await p.evaluate(() => { XA.advTab(null, 'ch:a2'); XA.advScene(null, 'a2s1'); });
  T('Akt 2 Eingang: Rollenspiel-Kasten (rosa) mit Stimme', await p.evaluate(() => { const r = $('.advb.rp'); return r && /Stimme/.test(r.textContent) && getComputedStyle(r).borderLeftColor.replace(/\s/g, '') === 'rgb(231,155,192)'; }), await p.evaluate(() => { const r = $('.advb.rp'); return r && getComputedStyle(r).borderLeftColor; }));

  /* ---- Würfeltabelle ---- */
  const roll = await p.evaluate(() => { const bt = document.querySelector('.advb.roll [data-act="advRoll"]'); bt.click(); const box = document.querySelector('.advb.roll'); const on = box.querySelectorAll('tr.on'); const n = +((box.querySelector('.advgot b') || {}).textContent || 0);
    const th = on[0] && on[0].querySelector('th').textContent; const [lo, hi] = advRange(th || ''); return { on: on.length, n, ok: n >= lo && n <= hi, log: (S.log || []).length }; });
  T('Würfeltabelle: Knopf würfelt, genau eine Zeile leuchtet', roll.on === 1 && roll.ok, roll);
  await shot('krug-2-wuerfeln.png');

  /* ---- Zähler ---- */
  await p.evaluate(() => { XA.advTab(null, 'ch:a3'); XA.advScene(null, 'a3s3'); });
  for (let i = 0; i < 6; i++) await p.evaluate(() => document.querySelector('.advb.cnt [data-act="advCnt"][data-d="1"]').click());
  const cnt = await p.evaluate(() => ({ v: advSt('krug').cnt.sterne, shown: $('.advb.cnt output b').textContent, on: ($('.advb.cnt .advcst li.on') || {}).textContent || '' }));
  T('Sternepunkte: 6× + ergibt 6, Stufe „Hoflieferant“ leuchtet', cnt.v === 6 && /6/.test(cnt.shown) && /Hoflieferant/.test(cnt.on), cnt);
  await shot('krug-3-zaehler.png');
  await p.evaluate(() => XA.advScene(null, 'a3s5'));
  T('Derselbe Zähler im „Urteil“ zeigt 6', await p.evaluate(() => /6/.test($('.advb.cnt output b').textContent)));
  await p.evaluate(() => { XA.advTab(null, 'ch:a4'); for (let i = 0; i < 9; i++) document.querySelector('.advb.cnt [data-act="advCnt"][data-d="1"]') && document.querySelector('.advb.cnt [data-act="advCnt"][data-d="1"]').click(); });
  T('Verdacht: bleibt bei 6 (Maximum), „Alarm“ leuchtet, + gesperrt', await p.evaluate(() => advSt('krug').cnt.verdacht === 6 && /Alarm/.test($('.advb.cnt .advcst li.on').textContent) && document.querySelector('.advb.cnt [data-d="1"]').disabled));
  await p.evaluate(() => { for (let i = 0; i < 9; i++) { const x = document.querySelector('.advb.cnt [data-d="-1"]'); if (x && !x.disabled) x.click(); } });
  T('Verdacht: zurück auf 0, − gesperrt', await p.evaluate(() => advSt('krug').cnt.verdacht === 0 && document.querySelector('.advb.cnt [data-d="-1"]').disabled));

  await p.evaluate(() => { XA.advTab(null, 'ch:a2'); XA.advScene(null, 'a2s1'); for (let i = 0; i < 9; i++) { const x = document.querySelector('.advb.cnt [data-d="1"]'); if (x && !x.disabled) x.click(); } });
  T('Hort-Zähler: bis 8, „Zu spät“ steht als aktuelle Stufe', await p.evaluate(() => advSt('krug').cnt.hort === 8 && /Zu spät/.test($('.advb.cnt .advcnow').textContent)));
  await p.evaluate(() => { XA.advTab(null, 'ch:a4'); for (let i = 0; i < 5; i++) [...document.querySelectorAll('.advb.cnt')][1].querySelector('[data-d="1"]').click(); });
  T('Gänge-Zähler: nach 5 Gängen „Anschnitt!“', await p.evaluate(() => advSt('krug').cnt.gaenge === 5 && /Anschnitt/.test([...document.querySelectorAll('.advb.cnt')][1].querySelector('.advcnow').textContent)));
  T('Ring der bösen Ahnung: +1 Initiative am Helden', await p.evaluate(() => { const ch = newChar({ name: 'Ini', cls: 'fighter', level: 4 }); const a = derive(ch, S.hb).init; ch.items = [{ uid: 'r1', id: 'krug-ahnungsring', att: true, eq: true, qty: 1, w: '' }]; return derive(ch, S.hb).init === a + 1; }));
  /* ---- Entscheidungen ---- */
  await p.evaluate(() => { XA.advTab(null, 'ch:a1'); XA.advScene(null, 'a1s2'); document.querySelector('.advcho').click(); });
  T('Zwick gut behandelt: Merker gesetzt', await p.evaluate(() => advSt('krug').flags.zwick === 'gut'));
  await p.evaluate(() => XA.advTab(null, 'ch:epilog'));
  T('Epilog zeigt die Entscheidungen', await p.evaluate(() => /Zwick am Morgen|Zwick/.test($('.advb.wahl').textContent) && /gut/.test($('.advb.wahl .advfv').textContent + [...document.querySelectorAll('.advfv')].map((x) => x.textContent).join())));

  /* ---- Gegenstand geben ---- */
  await p.evaluate(() => { XA.advTab(null, 'ch:prolog'); });
  await p.evaluate(() => { const bt = [...document.querySelectorAll('[data-act="advGive"]')].find((x) => /Kochbeil/.test(x.closest('tr').textContent)); bt.click(); });
  T('Geben (Szene): Kochbeil im Beute-Formular', await p.evaluate(() => S.view === 'camp' && $('#gItem').value === 'krug-kochbeil'));
  await p.evaluate(() => { S.view = 'adv'; XA.advTab(null, 'it'); });
  T('Reiter Gegenstände: 59 Karten nach Seltenheit, mit Fundort', await p.evaluate(() => document.querySelectorAll('.advit').length === 59 && document.querySelectorAll('.advch h3.advsc').length >= 3 && /Fundort/.test($('.advit').textContent)));
  await shot('krug-4-gegenstaende.png');
  await p.evaluate(() => { S.view = 'adv'; S.adv = null; render(); document.querySelector('.advon input[data-arg="krug"]').click(); S.adv = 'krug'; XA.advTab(null, 'it'); });
  T('Ausschalten wirkt sofort', await p.evaluate(() => !advActiveIds().includes('krug') && !/krug-/.test(itemOpts())));
  await p.evaluate(() => document.querySelector('[data-act="advGiveK"][data-arg="krug-schuerze"]').click());
  T('Geben schaltet das Abenteuer wieder ein und füllt das Formular', await p.evaluate(() => advActiveIds().includes('krug') && $('#gItem').value === 'krug-schuerze'));

  /* ---- Gegenstand am Helden ---- */
  const hero = await p.evaluate(() => { const ch = newChar({ name: 'Testheld', cls: 'fighter', level: 4 }); const a0 = derive(ch, S.hb); ch.items = [{ uid: 'x1', id: 'krug-schuerze', att: true, eq: true, qty: 1, w: '' }, { uid: 'x2', id: 'krug-kochbeil', att: true, eq: true, qty: 1, w: '' }];
    const a1 = derive(ch, S.hb); advSetOn('krug', false); const a2 = derive(ch, S.hb); const names = itemList(ch).map((x) => itemDef(x).name); advSetOn('krug', true);
    return { ac0: a0.ac, ac1: a1.ac, ac2: a2.ac, names, uses: (a1.homebrew || []).length }; });
  T('Schürze am Helden: RK +1, bleibt auch bei ausgeschaltetem Abenteuer', hero.ac1 === hero.ac0 + 1 && hero.ac2 === hero.ac1 && hero.names.length === 2, hero);

  /* ---- Kreaturen ---- */
  await p.evaluate(() => { S.view = 'adv'; S.adv = 'krug'; XA.advTab(null, 'mob'); });
  const cre = await p.evaluate(() => ({ n: document.querySelectorAll('.advmobs.big .advmob').length, srd: ['mimic', 'gelatinous-cube', 'giant-crab', 'hobgoblin', 'swarm-of-rats', 'thug', 'kobold'].every((m) => document.querySelector('.advmob[data-arg="' + m + '"]')), h: document.querySelectorAll('.advch h3.advsc').length }));
  T('Kreaturen: 18 Karten (11 eigene + 7 aus dem SRD) nach Kapiteln', cre.n === 18 && cre.srd && cre.h >= 5, cre);
  await p.evaluate(() => document.querySelector('[data-act="advMob"][data-arg="mimic"]').click());
  T('SRD-Mimik: Fenster mit Geschichte aus dem Abenteuer', await p.evaluate(() => !$('#modal').hidden && /Geschichte/.test($('#modal').textContent)));
  await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; });

  /* ---- Alle Kämpfe ---- */
  const fights = await p.evaluate(() => { const A = advGet('krug'); const res = []; S.camp = 'raum';
    A.chapters.forEach((C, ci) => C.scenes.forEach((Sc, si) => Sc.blocks.forEach((b, bi) => { if (b.t !== 'kampf') return; S.combat = null; S.view = 'adv'; XA.advFight({ dataset: {} }, ci + '.' + si + '.' + bi);
      const e = A.enc.find((x) => x.id === b.enc); const want = e.mobs.reduce((s, m) => s + m.n, 0); const got = ((S.combat || {}).npcs || []).length; res.push([b.enc, want, got]); })));
    return res; });
  T('Alle 12 Kämpfe starten mit der richtigen Zahl Gegner', fights.length === 12 && fights.every(([, w, g]) => w === g), fights);
  T('Eigene Monster im Bestiarium (11)', await p.evaluate(() => Object.keys(BESTIARY).filter((k) => /^u-krug-/.test(k)).length === 11));
  await p.evaluate(() => { S.combat = null; S.view = 'adv'; XA.advTab(null, 'ch:f'); XA.advScene(null, 'fs2'); document.querySelector('.advb.kampf [data-act="advFight"]').click(); S.view = 'adv'; render(); [0, 1].forEach((i) => { S.view = 'adv'; render(); const x = document.querySelector('.advb.kampf [data-act="advAlly"][data-i="' + i + '"]'); if (x) x.click(); }); });
  T('Schlägerei: Gorm (68 TP) und Wabbel als Verbündete', await p.evaluate(() => { const a = S.combat.npcs.filter((x) => x.ally); return a.length === 2 && a.some((x) => x.name === 'Gorm' && x.hp === 68) && a.some((x) => x.name === 'Wabbel'); }), await p.evaluate(() => (S.combat && S.combat.npcs || []).map((x) => x.name + (x.ally ? '*' : ''))));

  /* ---- Monsterhilfe ---- */
  const mf = await p.evaluate(() => ({
    hild: [mobAtkMax('u-krug-hildegard'), (mobRider('u-krug-hildegard', 'Scheinfuss') || {}).kind, (mobRider('u-krug-hildegard', 'Scheinfuss') || {}).dc],
    elch: [mobAtkMax('u-krug-elch'), (mobRider('u-krug-elch', 'Geweih') || {}).charge, ((mobRider('u-krug-elch', 'Geweih') || {}).conds || []).join(), (mobFeats('u-krug-elch') || { rech: [] }).rech.map((r) => r.name + r.min + r.ab + r.dc).join()],
    kass: [(mobRider('u-krug-kassandra', 'Umschlingen') || {}).kind, ((mobRider('u-krug-kassandra', 'Umschlingen') || {}).conds || []).join(), (mobFeats('u-krug-kassandra') || { rech: [] }).rech.map((r) => r.name + r.min + r.ab + r.dc + r.dmg).join()],
    glut: (mobFeats('u-krug-glutwichtel') || { rech: [] }).rech.map((r) => r.name + r.min + r.dmg + r.half).join(),
    prun: [mobAtkMax('u-krug-prunella'), (mobFeats('u-krug-prunella') || { rech: [] }).rech.map((r) => r.name + r.min + r.ab + r.dc).join()],
    knut: mobAtkMax('u-krug-knut'), gnarz: mobAtkMax('u-krug-gnarz'),
  }));
  T('Hildegard: 2 Angriffe, Scheinfuss packt (SG 13)', mf.hild[0] === 2 && mf.hild[1] === 'grab' && mf.hild[2] === 13, mf.hild);
  T('Elch: 3 Angriffe, Geweih mit Ansturm und liegend, Röhren W6 5–6 WEI 13', mf.elch[0] === 3 && mf.elch[1] && /prone/.test(mf.elch[2]) && mf.elch[3] === 'Röhren5wis13', mf.elch);
  T('Kassandra: Umschlingen packt und setzt fest, Kassensturz 6 STÄ 14 3W6', mf.kass[0] === 'grab' && /restrained/.test(mf.kass[1]) && mf.kass[2] === 'Kassensturz6str143W6', mf.kass);
  T('Glutwichtel: Feueratem 6, 2W6, halb', mf.glut === 'Feueratem62W6true', mf.glut);
  T('Prunella: 2 Angriffe, Pfefferwolke 5 KON 13; Knut und Gnarz je 2', mf.prun[0] === 2 && mf.prun[1] === 'Pfefferwolke5con13' && mf.knut === 2 && mf.gnarz === 2, mf);

  /* ---- Handy ---- */
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => { S.combat = null; S.view = 'adv'; XA.advTab(null, 'ch:a3'); XA.advScene(null, 'a3s4'); });
  T('Handy: kein waagrechtes Überlaufen (Probeessen)', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await p.evaluate(() => document.documentElement.scrollWidth));
  if (shots) { await p.evaluate(() => { const el = document.querySelector('.advb.roll'); if (el) el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); document.querySelector('.advb.roll [data-act="advRoll"]').click(); const e2 = document.querySelector('.advb.roll'); e2.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }); await shot('krug-5-handy-tabelle.png'); }
  await p.evaluate(() => { XA.advTab(null, 'it'); });
  T('Handy: Gegenstände ohne Überlaufen', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  if (shots) await shot('krug-6-handy-gegenstaende.png');
  await p.setViewportSize({ width: 1280, height: 900 });

  /* ---- Alle Szenen ---- */
  const all = await p.evaluate(() => { const A = advGet('krug'); let n = 0; const bad = []; S.camp = 'raum'; S.adv = 'krug'; S.view = 'adv';
    A.chapters.forEach((C) => C.scenes.forEach((Sc) => { advSetSt('krug', (s) => { s.tab = 'ch'; s.ch = C.id; s.sc = Sc.id; }); render(); n++; const t = $('#view').textContent; if (!t.includes(Sc.title) || /\*\*|undefined|NaN|\[object/.test(t)) bad.push(Sc.id + ':' + ((t.match(/.{30}(\*\*|undefined|NaN|\[object).{30}/) || [])[0] || 'Titel')); }));
    return { n, bad }; });
  T('Alle 35 Szenen ohne Rohtext, „undefined“ oder NaN', all.n === 35 && !all.bad.length, all);

  /* ---- Sicherung und Datei ---- */
  await p.evaluate(() => { const x = backupExtras(); localStorage.removeItem('hb_adv'); ADV_ON_C = null; window._r = restoreExtras(x); });
  T('Sicherung bringt Zähler und Schalter zurück', await p.evaluate(() => advSt('krug').cnt.sterne === 6 && advActiveIds().includes('krug')));
  if (fileArg) {
    const text = fs.readFileSync(path.resolve(fileArg), 'utf8'); await setup();
    await p.evaluate((t) => { S.view = 'heroes'; importJson(t); }, text);
    T('Datei laden: öffnet das Abenteuer, keine Doppelung', await p.evaluate(() => S.view === 'adv' && S.adv === 'krug' && advDb().list.length === 0 && Object.keys(BESTIARY).filter((k) => /^u-krug-/.test(k)).length === 11));
    const evil = JSON.parse(text); const A = evil.extra.adv[0]; A.ver = 2; A.items = { 'weapon-1': { name: 'Gekapert', r: 'selten', text: 'x' }, 'krug-boese': { name: 'Böse', r: 'quatsch', wpn: 99, text: 'y', use: { n: 500, reset: 'x' }, set: { str: 99, foo: 3 } } }; evil.extra.mobs = []; evil.extra.enc = [];
    await p.evaluate((t) => importJson(t), JSON.stringify(evil));
    const ev = await p.evaluate(() => ({ w: MAGIC_ITEMS['weapon-1'].name, b: MAGIC_ITEMS['krug-boese'] }));
    T('Fremde Datei: SRD-Gegenstand nicht überschrieben, Werte begrenzt', ev.w === 'Waffe +1' && ev.b && ev.b.wpn === 5 && ev.b.r === 'variabel' && ev.b.use.n === 10 && ev.b.use.reset === 'long' && !ev.b.set, ev);
  }

  T('Keine Seitenfehler', !errs.length, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  console.log(out.filter((r) => r.ok).length + '/' + out.length + ' Prüfungen bestanden');
  await b.close(); process.exit(out.every((r) => r.ok) ? 0 : 1);
})();
