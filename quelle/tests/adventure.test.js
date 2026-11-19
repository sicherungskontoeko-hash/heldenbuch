/* Abenteuer-Ansicht: eingebaute „Machtader“, Navigation, Entscheidungen, Kampf auf Knopfdruck, Beute, Handout, Laden aus Datei, Sicherung.
   Aufruf: node tests/adventure.test.js [app.html] [Die_Machtader.heldenbuch.json] [bilder-ordner] */
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
  const setup = () => p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.removeItem('hb_mobs'); localStorage.removeItem('hb_encounters'); localStorage.removeItem('hb_adv'); ownMobsLoad(); UID = 'me1';
    window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (m) => { S.meta = Object.assign({}, S.meta, m); paintCamp(); };
    S.camp = 'raum'; S.table = { me1: { char: 'SL', init: null, ac: 10, level: 3, dm: true }, u2: { char: 'Lyra', ac: 13, level: 3 }, u3: { char: 'Tor', ac: 16, level: 3 }, u4: { char: 'Ka', ac: 15, level: 3 }, u5: { char: 'Rin', ac: 14, level: 3 }, u6: { char: 'Mo', ac: 12, level: 3 } };
    S.meta = { dm: 'me1', mercy: {} }; S.combat = null; S.adv = null; S.view = 'adv'; render(); });
  await setup();

  /* ---- Bibliothek und Navigation ---- */
  T('Menü „Mehr“ enthält Abenteuer', await p.evaluate(() => !!document.querySelector('#top .mnul [data-act="view"][data-arg="adv"]')));
  T('Bibliothek zeigt „Die Machtader“', await p.evaluate(() => /Die Machtader/.test($('#view').textContent) && !!document.querySelector('[data-act="advOpen"][data-arg="machtader"]')));
  await p.evaluate(() => document.querySelector('[data-act="advOpen"][data-arg="machtader"]').click());
  T('Öffnen: Übersicht mit Tabelle und Kapitel-Chips', await p.evaluate(() => S.adv === 'machtader' && document.querySelectorAll('.advnav .chip').length === 10 && !!$('.advtw')));
  await shot('adv-1-uebersicht.png');
  await p.evaluate(() => document.querySelector('[data-act="advTab"][data-arg="ch:k1"]').click());
  T('Kapitel 1: sechs Szenen, erste Szene offen', await p.evaluate(() => document.querySelectorAll('.advscn button').length === 6 && /Gildenhalle/.test($('#advSc').textContent)));
  T('Vorlesetext-, Proben-, SL- und Beute-Kasten da', await p.evaluate(() => ['vor', 'probe', 'dm', 'loot'].every((k) => document.querySelector('.advb.' + k))));
  T('Fettdruck aus dem Buch wird dargestellt', await p.evaluate(() => !!document.querySelector('.advb.dm b') && !/\*\*/.test($('.advch').textContent)));
  await p.evaluate(() => document.querySelector('[data-act="advStep"][data-arg="1"]').click());
  T('Weiter: Szene 2 „Die Waldstrasse“', await p.evaluate(() => /Waldstrasse/.test($('#advSc').textContent) && advSt('machtader').sc === 'k1s2'));
  T('Kampf-Kasten mit Gegnern und EP', await p.evaluate(() => { const k = $('.advb.kampf'); return k && /2× Manaverseuchter Riesenkeiler/.test(k.textContent) && /900 EP · mittel/.test(k.textContent); }), await p.evaluate(() => ($('.advb.kampf .advxp') || {}).textContent));
  await shot('adv-2-szene.png');

  /* ---- Kampf auf Knopfdruck ---- */
  await p.evaluate(() => document.querySelector('.advb.kampf [data-act="advFight"]').click());
  T('Kampf beginnen: Kampf läuft mit 2 Keilern, Ansicht Tisch', await p.evaluate(() => S.view === 'camp' && S.combat && S.combat.active && S.combat.npcs.length === 2 && S.combat.npcs.every((x) => x.mid === 'u-mach-keiler' && x.hp === 42 && x.ac === 12)));
  T('Monster des Abenteuers liegen im Bestiarium (18)', await p.evaluate(() => Object.keys(BESTIARY).filter((k) => /^u-mach-/.test(k)).length === 18));
  T('Tisch: Leiste „Weiterlesen“ fürs Abenteuer', await p.evaluate(() => !!document.querySelector('.advbar [data-act="advResume"]') && /Waldstrasse/.test($('.advbar').textContent)));
  await p.evaluate(() => document.querySelector('.advbar [data-act="advResume"]').click());
  T('Weiterlesen führt zurück zur Szene', await p.evaluate(() => S.view === 'adv' && /Waldstrasse/.test($('#advSc').textContent)));
  T('Im laufenden Kampf heisst der Knopf „einsetzen“', await p.evaluate(() => /einsetzen/.test(document.querySelector('.advb.kampf [data-act="advFight"]').textContent)));

  /* ---- Beute ---- */
  await p.evaluate(() => document.querySelector('.advb.loot [data-act="advLoot"]').click());
  T('Beute ins Formular: 15 GM auf 5 Helden = 3 GM je Held, Text vorbelegt', await p.evaluate(() => S.view === 'camp' && $('#gGm').value === '3' && /Apfelmost/.test($('#gText').value)), await p.evaluate(() => [($('#gGm') || {}).value, ($('#gText') || {}).value]));

  /* ---- Entscheidungen ---- */
  await p.evaluate(() => { S.view = 'adv'; XA.advTab(null, 'ch:k1'); XA.advScene(null, 'k1s5'); });
  T('Szene 5: Entscheidung „Was geschieht mit Brannok?“ mit 4 Wegen', await p.evaluate(() => document.querySelectorAll('.advcho').length === 4));
  await p.evaluate(() => document.querySelectorAll('.advcho')[1].click());
  T('Wahl „töten, Borka lebt“ setzt Brannok verschont = nein, Borka lebt = ja', await p.evaluate(() => { const s = advSt('machtader'); return s.choice.k1brannok === 1 && s.flags.brannok === 'nein' && s.flags.borka === 'ja'; }));
  T('Merke-Kasten zeigt die gesetzten Werte', await p.evaluate(() => { const on = [...document.querySelectorAll('.advfl .chip.on')].map((x) => x.textContent); return on.includes('nein') && on.includes('ja'); }));
  await p.evaluate(() => document.querySelector('[data-act="advFlag"][data-arg="perle"][data-v="ja"]').click());
  T('Holzperle per Chip festgehalten', await p.evaluate(() => advSt('machtader').flags.perle === 'ja'));
  if (shots) { await p.evaluate(() => { const el = document.querySelector('.advb.wahl'); if (el) el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -130); }); await shot('adv-3-entscheidung.png'); }
  await p.evaluate(() => { XA.advTab(null, 'ch:k3'); });
  T('Kapitel 3 zeigt die Entscheidungen mit Folgen', await p.evaluate(() => { const t = $('.advch').textContent; return /Zerrissener Wille 1–4/.test(t) && /Beruhigen SG 18/.test(t) && /1 Erfolg beim Beruhigen/.test(t); }));

  /* ---- Endkampf: Verstärkung und Verbündeter ---- */
  await p.evaluate(() => { S.combat = null; XA.advScene(null, 'k3s5'); });
  T('Endkampf: EP und Hinweis auf Phase 2 als Verstärkung', await p.evaluate(() => { const k = $('.advb.kampf'); return /22300 EP/.test(k.textContent) && /Verstärkung/.test(k.textContent); }), await p.evaluate(() => ($('.advb.kampf .advxp') || {}).textContent));
  await p.evaluate(() => document.querySelector('.advb.kampf [data-act="advFight"]').click());
  T('Endkampf: Chimäre + Keiler kämpfen, Phase 2 und Vaal warten', await p.evaluate(() => { const n = S.combat.npcs; return n.filter((x) => !x.reserve).map((x) => x.mid).sort().join() === 'u-mach-chimaere,u-mach-mechakeiler' && n.filter((x) => x.reserve).map((x) => x.mid).sort().join() === 'u-mach-morgath2,u-mach-vaal'; }));
  T('Chimäre: 3 legendäre Aktionen, Kernkanone als Aufladung', await p.evaluate(() => { const f = mobFeats('u-mach-chimaere'); return f.la === 3 && f.lr === 3 && f.rech[0].name === 'Kernkanone' && f.rech[0].dc === 20 && f.rech[0].ab === 'dex'; }));
  await p.evaluate(() => { S.view = 'adv'; render(); document.querySelector('.advb.kampf [data-act="advAlly"]').click(); });
  T('Brannok (befreit) als Verbündeter mit 100 TP', await p.evaluate(() => { const x = S.combat.npcs.find((y) => y.ally); return x && x.hp === 100 && x.name === 'Brannok (befreit)'; }));

  /* ---- Handout, Gegenstand, Kreaturen ---- */
  await p.evaluate(() => { S.view = 'adv'; XA.advTab(null, 'ch:prolog'); document.querySelector('.advb.vor [data-act="advHo"]').click(); });
  T('Vorlesetext als Handout geteilt', await p.evaluate(() => (S.meta.handouts || []).length === 1 && /Ithari/.test(S.meta.handouts[0].text) && !/\*/.test(S.meta.handouts[0].text)));
  await p.evaluate(() => { S.view = 'adv'; XA.advTab(null, 'ch:z1'); document.querySelector('[data-act="advGive"][data-i="3"]').click(); });
  T('Gegenstand „Lichtmantel“ → Umhang des Schutzes im Formular', await p.evaluate(() => $('#gItem').value === 'cloak-protection' && /Lichtmantel/.test($('#gText').value)));
  await p.evaluate(() => { S.view = 'adv'; XA.advTab(null, 'mob'); });
  T('Kreaturen: 18 Karten in drei Kapiteln', await p.evaluate(() => document.querySelectorAll('.advmobs.big .advmob').length === 18 && document.querySelectorAll('.advch h3.advsc').length === 3));
  await p.evaluate(() => document.querySelector('[data-act="advMob"][data-arg="u-mach-morgath"]').click());
  T('Kreatur-Fenster: Geschichte und Schwächen', await p.evaluate(() => !$('#modal').hidden && /Geschichte/.test($('#modal').textContent) && !!$('#modal .advb.schwach')));
  await shot('adv-4-kreatur.png');
  await p.evaluate(() => document.querySelector('#modal [data-act="advBest"]').click());
  T('„Im Bestiarium“ filtert auf die Kreatur', await p.evaluate(() => S.view === 'mobs' && document.querySelectorAll('#view details.mob').length >= 1 && /Morgath/.test($('#view details.mob').textContent)));
  await p.evaluate(() => { S.view = 'adv'; XA.advTab(null, 'fig'); });
  T('Figuren: 8 Karten', await p.evaluate(() => document.querySelectorAll('.advfig').length === 8));

  /* ---- Ohne Tisch / als Spieler ---- */
  await p.evaluate(() => { S.camp = null; S.combat = null; XA.advTab(null, 'ch:k2'); XA.advScene(null, 'k2s2'); });
  T('Ohne Tisch: Hinweis statt Kampfknopf, keine SL-Knöpfe', await p.evaluate(() => !document.querySelector('[data-act="advFight"]') && /am Tisch/.test($('.advb.kampf').textContent) && !document.querySelector('[data-act="advHo"]')));

  /* ---- Handy ---- */
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => { S.camp = 'raum'; XA.advTab(null, 'ch:k1'); XA.advScene(null, 'k1s5'); });
  T('Handy: kein waagrechtes Überlaufen', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await p.evaluate(() => document.documentElement.scrollWidth));
  T('Handy: Abenteuer im Mehr-Menü unten', await p.evaluate(() => { XA.more(); return !!document.querySelector('#bnav .bmore [data-arg="adv"]'); }));
  await p.evaluate(() => XA.more());
  if (shots) { await shot('adv-5-handy.png'); await p.evaluate(() => { const el = document.querySelector('.advb.kampf'); if (el) el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }); await shot('adv-6-handy-kampf.png'); }
  await p.setViewportSize({ width: 1280, height: 900 });

  /* ---- Sicherung ---- */
  const bk = await p.evaluate(() => { const x = backupExtras(); return { st: x.advSt && x.advSt.machtader && x.advSt.machtader.flags, list: x.adv }; });
  T('„Alles sichern“ enthält den Fortschritt', bk.st && bk.st.brannok === 'nein' && Array.isArray(bk.list), bk);
  await p.evaluate(() => { const x = backupExtras(); localStorage.removeItem('hb_adv'); window._r = restoreExtras(x); });
  T('Wiederherstellen bringt die Entscheidungen zurück', await p.evaluate(() => advSt('machtader').flags.brannok === 'nein' && window._r.includes('Abenteuer-Fortschritt')), await p.evaluate(() => window._r));

  /* ---- Laden aus Datei ---- */
  if (fileArg) {
    const text = fs.readFileSync(path.resolve(fileArg), 'utf8');
    await setup();
    await p.evaluate((t) => { S.view = 'heroes'; importJson(t); }, text);
    T('Datei laden: öffnet das Abenteuer direkt', await p.evaluate(() => S.view === 'adv' && S.adv === 'machtader'));
    T('Datei laden: eingebaute Fassung wird nicht doppelt gespeichert', await p.evaluate(() => advDb().list.length === 0 && advAll().length === 1));
    T('Datei laden: 18 Monster, 9 Begegnungen', await p.evaluate(() => Object.keys(BESTIARY).filter((k) => /^u-mach-/.test(k)).length === 18 && encLoad().filter((e) => /^mach-e-/.test(e.id)).length === 9));
    const v2 = JSON.parse(text); v2.extra.adv[0].ver = 2; v2.extra.adv[0].title = 'Die Machtader (überarbeitet)'; v2.extra.mobs = []; v2.extra.enc = [];
    await p.evaluate((t) => importJson(t), JSON.stringify(v2));
    T('Neuere Fassung aus Datei ersetzt die eingebaute', await p.evaluate(() => advAll().length === 1 && advGet('machtader').title === 'Die Machtader (überarbeitet)' && advIsOwn('machtader')));
    await p.evaluate(() => { S.adv = null; render(); document.querySelector('[data-act="advDel"]').click(); document.querySelector('[data-act="advDel"]').click(); });
    T('Entfernen (zweimal tippen): eingebaute Fassung wieder da', await p.evaluate(() => advAll().length === 1 && advGet('machtader').title === 'Die Machtader' && !advIsOwn('machtader')));
    const bad = { heldenbuch: 1, chars: [], extra: { adv: [{ id: 'Böse ID', title: 'x', chapters: [] }, { id: 'leer', title: 'Leer', chapters: [{ id: 'a', scenes: [] }] }] } };
    await p.evaluate((t) => { try { importJson(t); } catch (e) {} }, JSON.stringify(bad));
    T('Ungültige Abenteuer werden nicht übernommen', await p.evaluate(() => advAll().length === 1));
  }

  /* ---- Alle Szenen rendern ohne Fehler ---- */
  const all = await p.evaluate(() => { const A = advGet('machtader'); let n = 0, bad = []; S.camp = 'raum'; S.adv = 'machtader'; S.view = 'adv';
    A.chapters.forEach((C) => C.scenes.forEach((Sc) => { advSetSt('machtader', (s) => { s.tab = 'ch'; s.ch = C.id; s.sc = Sc.id; }); render(); n++; const t = $('#view').textContent; if (!t.includes(Sc.title) || /\*\*|undefined|NaN|\[object/.test(t)) bad.push(Sc.id); }));
    return { n, bad }; });
  T('Alle 20 Szenen ohne Rohtext, „undefined“ oder NaN', all.n === 20 && !all.bad.length, all);

  T('Keine Seitenfehler', !errs.length, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  console.log(out.filter((r) => r.ok).length + '/' + out.length + ' Prüfungen bestanden');
  await b.close(); process.exit(out.every((r) => r.ok) ? 0 : 1);
})();
