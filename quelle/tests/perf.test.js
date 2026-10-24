/* Leistung: Optimierungen dürfen nichts am Verhalten ändern. Prüft Zwischenspeicher, ruhige Listen beim Neuzeichnen,
   Spieltisch-Kästen, Hintergrund-Effekte, Bildadressen und Themenbilder. Aufruf: node tests/perf.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(500);
  /* Themenbilder: beim Start nur das aktive Thema, alle erst mit offener Themenauswahl */
  T('Start: nur das Bild des aktiven Themas ist geladen', await p.evaluate(() => Object.keys(SCENE_ON).join(',') === themeNow()), await p.evaluate(() => Object.keys(SCENE_ON)));
  T('Hintergrundbild des aktiven Themas sichtbar', await p.evaluate(() => /^url\(/.test(getComputedStyle(document.documentElement).getPropertyValue('--scene-image').trim())));
  /* Sortierung und Zwischenspeicher der Zauberliste */
  T('Zauberliste gleich sortiert wie mit localeCompare', await p.evaluate(() => { const a = allSpells(S.hb).map((s) => s.id).join(); const b2 = Object.values(SPELLS).slice().sort((x, y) => x.lvl - y.lvl || x.name.localeCompare(y.name, 'de')).map((s) => s.id).join(); return a === b2; }));
  T('Eigener Zauber erscheint sofort (Zwischenspeicher wird erneuert)', await p.evaluate(() => { const n0 = allSpells(S.hb).length; S.hb.t1 = { id: 't1', kind: 'spell', name: 'Testzauber', lvl: 1, classes: ['wiz'] }; const l = allSpells(S.hb); const ok = l.length === n0 + 1 && l.some((s) => s.name === 'Testzauber'); S.hb.t1.name = 'Umbenannt'; const ok2 = allSpells(S.hb).some((s) => s.name === 'Umbenannt'); delete S.hb.t1; return ok && ok2 && allSpells(S.hb).length === n0; }));
  T('Zauberliste: Rückgabe ist eine Kopie (Änderungen wirken nicht zurück)', await p.evaluate(() => { const l = allSpells(S.hb); l.length = 0; return allSpells(S.hb).length > 300; }));
  T('Texte maskieren unverändert', await p.evaluate(() => esc('<a href="x">&</a>') === '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;' && esc(null) === '' && esc(5) === '5' && esc('ohne') === 'ohne'));
  /* Lange Listen: Neuzeichnen verschiebt nichts */
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const ch = normChar(newChar({ name: 'Ilva', cls: 'wiz', level: 9 })); ch.portrait = 'art:paladin'; S.chars[ch.id] = ch; S.cur = ch.id; });
  for (const [v, lab] of [['spells', 'Zauber'], ['mobs', 'Bestiarium']]) {
    const r = await p.evaluate(async (v) => { S.view = v; render(); window.scrollTo(0, 0); await new Promise((res) => setTimeout(res, 60)); window.scrollTo(0, 3000); await new Promise((res) => setTimeout(res, 250));
      const top = () => { const it = [...document.querySelectorAll('.cvl>details')].find((e) => e.getBoundingClientRect().bottom > 0); return it ? it.querySelector('summary b').textContent + '@' + Math.round(it.getBoundingClientRect().top) : '-'; };
      const a = top(); render(); await new Promise((res) => requestAnimationFrame(() => setTimeout(res, 60))); const c = top(); render(); await new Promise((res) => requestAnimationFrame(() => setTimeout(res, 60))); return [a, c, top()]; }, v);
    const same = (x, y) => x.split('@')[0] === y.split('@')[0] && Math.abs(+x.split('@')[1] - +y.split('@')[1]) <= 1; /* höchstens 1 Pixel Rundung */
    T(lab + ': Neuzeichnen mitten in der Liste lässt den obersten Eintrag an seiner Stelle', r[0] !== '-' && same(r[0], r[1]) && same(r[1], r[2]), r);
  }
  T('Bestiarium: Bilder als kurze blob:-Adressen', await p.evaluate(() => { S.view = 'mobs'; render(); const i = document.querySelector('details.mob img'); return BLOB_OK && i && i.src.startsWith('blob:'); }));
  T('Ohne blob:-Erlaubnis bleiben die eingebetteten Bilder', await p.evaluate(() => { BLOB_OK = false; const u = imgUrl(MOB_PIC.troll); BLOB_OK = true; return u === MOB_PIC.troll; }));
  /* Spieltisch: unveränderte Kästen werden nicht neu aufgebaut */
  await p.evaluate(() => { UID = 'me1'; window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (o) => { Object.assign(S.meta, o); paintCamp(); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: meDoc(), u2: { char: 'Lyra', ac: 13, hp: 20, hpMax: 20, level: 3 } }; S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 2 }], '', {}); nextTurn(); S.view = 'camp'; render(); paintCamp(); });
  T('Spieltisch: gleiche Daten → Gruppe und Kampf bleiben dieselben Elemente', await p.evaluate(() => { const a = $('#partyBox').firstElementChild, f = $('#fightBox').firstElementChild; paintCamp(); return a && a === $('#partyBox').firstElementChild && f === $('#fightBox').firstElementChild; }));
  T('Spieltisch: neue Daten → Kasten wird neu gezeichnet', await p.evaluate(() => { S.table.u2.hp = 3; paintCamp(); return /Lyra/.test($('#partyBox').textContent) && $('#partyBox').innerHTML !== '' && $('#partyBox')._hb.includes('Lyra'); }));
  T('Spieltisch: Hilfe-Knöpfe bleiben nach Aktualisierung', await p.evaluate(() => { S.table.u2.hp = 4; paintCamp(); return document.querySelectorAll('#view .hlp').length > 0; }));
  /* Hintergrund-Effekte */
  const fx = await p.evaluate(async () => { const cv = $('#embers'); const r = {}; S.camp = null; S.view = 'sheet'; render();
    localStorage.setItem('hb_fx', 'stark'); setTheme('warm'); startFx(); r.warm = cv.width === cv.clientWidth; setTheme('kalt'); startFx(); r.kalt = cv.width === cv.clientWidth * 2;
    setTheme('warm'); startFx(); await new Promise((res) => setTimeout(res, 300)); const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 0) lit++; r.drawn = lit > 50;
    themeBurst('crit'); await new Promise((res) => setTimeout(res, 200)); r.burst = true;
    localStorage.setItem('hb_fx', 'aus'); startFx(); r.aus = cv.width === 0; localStorage.setItem('hb_fx', 'stark'); startFx(); r.wieder = cv.width > 0; return r; });
  T('Glut (weich) mit einfacher Pixeldichte, Schnee scharf mit doppelter', fx.warm && fx.kalt, fx);
  T('Glut wird gezeichnet, Freudenfeuer bei 20 läuft ohne Fehler', fx.drawn && fx.burst, fx);
  T('Effekte aus → Zeichenfläche freigegeben; wieder an → zeichnet', fx.aus && fx.wieder, fx);
  T('Themenauswahl lädt alle Vorschaubilder', await p.evaluate(() => { openThemeModal(); return Object.keys(THEMES).every((k) => SCENE_ON[k]) && /url\(/.test(getComputedStyle(document.querySelector('.tsw[data-arg="kalt"]'), '::before').backgroundImage); }));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
