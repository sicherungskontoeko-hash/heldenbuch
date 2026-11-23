/* Grosstest: jede Ansicht, jeder Bogen-Reiter, jeder Erstellungsschritt, alle 16 Klassen, mehrere Stufen,
   Spielleitung am Tisch mit Kampf, beide Abenteuer mit allen Kapiteln, alle neun Stimmungen, vier Breiten.
   Geprüft wird je Bildschirm:
   - keine Skript- oder Konsolenfehler, kein Querscrollen
   - kein «undefined», «NaN», «[object …]», «null» oder «ß» im sichtbaren Text
   - keine kaputten Attribute (Name mit Anführungszeichen o. Ä.), keine doppelten IDs
   - jeder Knopf hat einen Namen (Text, aria-label oder title), jedes Bild ein alt-Attribut, jedes Eingabefeld eine Beschriftung
   - jedes Bild mit Daten-URL lädt (naturalWidth > 0)
   Aufruf: node tests/gross.test.js [app.html] [--schnell] */
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const schnell = args.includes('--schnell');
const befunde = new Map(); let n = 0; const errs = [];
const merke = (wo, art, was) => { const k = art + ' | ' + String(was).slice(0, 160); if (!befunde.has(k)) befunde.set(k, []); const l = befunde.get(k); if (l.length < 4) l.push(wo); };

/* läuft im Browser: prüft den aktuellen Bildschirm */
const PRUEFE = () => {
  const out = [];
  const vis = (e) => { if (!e.isConnected) return false; const d = e.closest('details:not([open])'); if (d && !e.closest('summary')) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const root = document.body;
  // Text
  const txt = root.innerText || '';
  const bad = txt.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]|(^|[\s(:·])null([\s)·.,]|$)|ß/g);
  if (bad) [...new Set(bad.map((x) => x.trim()))].forEach((b) => { const i = txt.indexOf(b); out.push(['Text', b + ' … «' + txt.slice(Math.max(0, i - 50), i + 40).replace(/\s+/g, ' ') + '»']); });
  // Attribute
  document.querySelectorAll('*').forEach((e) => { for (const a of e.attributes) if (/["'<>=\/]/.test(a.name)) out.push(['Attribut', e.tagName.toLowerCase() + '.' + (e.className && e.className.baseVal === undefined ? String(e.className).split(' ')[0] : '') + ' [' + a.name + ']']); });
  // doppelte IDs
  const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; }); Object.entries(ids).filter(([, c]) => c > 1).forEach(([id, c]) => out.push(['Doppelte ID', id + ' ×' + c]));
  // Knöpfe ohne Namen
  document.querySelectorAll('button, [role="button"], a[href]').forEach((b) => { if (!vis(b)) return; const name = (b.getAttribute('aria-label') || b.getAttribute('title') || b.innerText || b.textContent || '').trim() || (b.querySelector('img[alt]:not([alt=""])') ? 'img' : ''); if (!name) out.push(['Knopf ohne Namen', b.tagName.toLowerCase() + '.' + String(b.className).split(' ').join('.') + ' data-act=' + (b.dataset.act || '')]); });
  // Bilder
  document.querySelectorAll('img').forEach((i) => { if (!i.hasAttribute('alt')) out.push(['Bild ohne alt', i.className]); if (vis(i) && i.complete && i.src && !i.naturalWidth) out.push(['Bild lädt nicht', i.className + ' ' + i.src.slice(0, 40)]); });
  // Eingabefelder ohne Beschriftung
  document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea').forEach((f) => { if (!vis(f)) return; const lab = f.getAttribute('aria-label') || f.getAttribute('title') || f.getAttribute('placeholder') || (f.id && document.querySelector('label[for="' + f.id + '"]')) || f.closest('label'); if (!lab) out.push(['Feld ohne Beschriftung', f.tagName.toLowerCase() + '#' + (f.id || '') + ' ' + (f.name || '') + ' ' + String(f.className)]); });
  // Querscrollen
  if (document.documentElement.scrollWidth > innerWidth + 1) { const wide = [...document.querySelectorAll('#view *')].filter((e) => vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.mnav, .mhabs, .chips.mhabs, .tbl, .steps, .advnav, .chips, table, pre')).slice(0, 2).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]); out.push(['Querscrollen', (document.documentElement.scrollWidth - innerWidth) + ' px ' + wide.join(', ')]); }
  // CSS-Hintergrundbilder der Bildklassen, die sichtbar sind
  document.querySelectorAll('[class*="pic-"]').forEach((e) => { if (!vis(e)) return; const bg = getComputedStyle(e).backgroundImage; if (!bg || bg === 'none') out.push(['Bildklasse ohne Bild', String(e.className)]); });
  return out;
};

(async () => {
  const b = await chromium.launch();
  const breiten = schnell ? [[390, 844], [1280, 900]] : [[320, 568], [390, 844], [768, 1024], [1280, 900]];
  for (const [w, h] of breiten) {
    const mob = w <= 820; const tag = w + 'x' + h;
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob });
    p.on('pageerror', (e) => errs.push(tag + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR|WebSocket|ERR_NAME|mqtt/i.test(m.text())) errs.push(tag + ' Konsole: ' + m.text().slice(0, 200)); });
    p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.goto('file://' + target); await p.waitForTimeout(600);
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_sample_done', '1'); window.print = () => {}; if (typeof hlSetLevel === 'function') hlSetLevel('std'); });
    const pruefe = async (wo) => { n++; await p.waitForTimeout(40); const r = await p.evaluate(PRUEFE); r.forEach(([art, was]) => merke(tag + ' ' + wo, art, was)); };
    const go = (fn, a) => p.evaluate(fn, a);

    // Helden: alle 16 Klassen auf Stufe 5 (Unterklasse gesetzt), dazu Stufe 1 und 20 und ein Mehrklassen-Held
    const ids = await go(() => {
      Object.keys(S.chars).forEach((k) => delete S.chars[k]);
      const out = [];
      Object.entries(CLASSES).forEach(([k, C], i) => {
        const subs = C.subs || []; const sp = Object.keys(SPECIES)[i % Object.keys(SPECIES).length]; const bg = ['acolyte', 'criminal', 'sage', 'soldier'][i % 4];
        const lv = [5, 1, 20, 11][i % 4];
        const n = normChar(newChar({ name: 'Test ' + C.name, cls: k, level: lv, sub: lv >= 3 && subs.length ? subs[i % subs.length].id : '', species: sp, bg, weapons: [{ w: 'longsword' }, { w: 'shortbow' }, { w: 'dagger' }], armor: 'leather' }));
        n.comps = [{ t: Object.keys(COMPANIONS)[i % Object.keys(COMPANIONS).length] }];
        const c = derive(n, S.hb);
        if (c.spell && c.spell.has) { const all = (typeof spellListFor === 'function' ? [] : []); }
        S.chars[n.id] = n; out.push(n.id);
      });
      const m = normChar(newChar({ name: 'Test Mehrklassen', cls: 'pal', level: 6, sub: 'devotion', multi: [{ cls: 'wlk', level: 3, sub: 'fiend' }], species: 'halfelf', bg: 'soldier', weapons: [{ w: 'longsword' }] })); S.chars[m.id] = m; out.push(m.id);
      const s = sampleChar(); S.chars[s.id] = s; out.push(s.id);
      return out;
    });
    const heldenListe = schnell ? ids.filter((_, i) => i % 4 === 0) : (w === 390 ? ids : ids.filter((_, i) => i % 3 === 0));
    // Bogen: jeder Reiter
    for (const id of heldenListe) {
      for (const mg of ['kampf', 'werte', 'zauber', 'faehig', 'gear', 'begleiter', 'notiz', 'alle']) {
        await go(([id, mg]) => { S.cur = id; S.view = 'sheet'; S.mg = mg; S.camp = ''; render(); window.scrollTo(0, 0); }, [id, mg]);
        await pruefe('Bogen ' + id.slice(-4) + ' ' + mg);
      }
      // aktive Zustände, Konzentration, 0 TP
      await go((id) => { S.cur = id; const P = cur().play; P.cond = ['poisoned', 'prone']; P.exh = 2; P.conc = { id: 'bless', name: 'Segnen' }; S.mg = 'kampf'; render(); }, id); await pruefe('Bogen ' + id.slice(-4) + ' Zustände');
      await go((id) => { const P = cur().play; P.hp = 0; P.ds = [1, 1]; render(); }, id); await pruefe('Bogen ' + id.slice(-4) + ' 0 TP');
      await go(() => { const P = cur().play; P.hp = null; P.cond = []; P.exh = 0; P.conc = null; P.ds = [0, 0]; P.dead = false; render(); });
    }
    // Erschaffen: jeder Schritt für einige Helden, Zusammenfassung offen und zu
    for (const id of heldenListe.slice(0, schnell ? 2 : 6)) for (let st = 0; st < 7; st++) for (const open of [false, true]) {
      if (open && !mob) continue;
      await go(([id, st, open]) => { S.cur = id; S.view = 'build'; S.step = st; S.sumOpen = open; render(); window.scrollTo(0, 0); }, [id, st, open]); await pruefe('Erschaffen ' + id.slice(-4) + ' Schritt ' + (st + 1) + (open ? ' offen' : ''));
    }
    // Infokarten: Klasse, Spezies, Hintergrund, Unterklasse
    for (const [kind, sel, step] of [['cls', '.card[data-arg="wiz"] .ii', 0], ['sp', '.card[data-arg="elf"] .ii', 1], ['bg', '.card[data-arg="sage"] .ii', 1], ['sub', '.opt[data-val] .ii', 0]]) {
      await go(([sel, step]) => { S.cur = Object.values(S.chars).find((c) => c.level >= 3).id; S.view = 'build'; S.step = step; render(); const e = document.querySelector(sel); if (e) e.click(); }, [sel, step]); await pruefe('Infokarte ' + kind);
      await go(() => { const m = document.getElementById('modal'); m.hidden = true; S.modal = null; });
    }
    // Übrige Ansichten
    for (const v of ['heroes', 'spells', 'mobs', 'hb', 'help']) { await go((v) => { S.view = v; S.camp = ''; render(); window.scrollTo(0, 0); }, v); await pruefe('Ansicht ' + v); }
    await go(() => { S.view = 'mobs'; render(); document.querySelectorAll('details.mob').forEach((d, i) => { if (i < 12) d.open = true; }); }); await pruefe('Bestiarium offen');
    await go(() => { S.view = 'mobs'; S.mhab = 'own'; render(); }); await pruefe('Bestiarium eigene'); await go(() => { S.mhab = ''; });
    await go(() => { S.view = 'spells'; S.sf = Object.assign({}, S.sf || {}, { q: 'feuer' }); render(); }); await pruefe('Zauberbuch Suche');
    // Tisch: ohne Raum, als Spielleitung im Kampf, als Spieler
    await go(() => { S.view = 'camp'; S.camp = ''; render(); }); await pruefe('Tisch ohne Raum');
    await go(() => { UID = 'me1'; window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (m) => { S.meta = Object.assign({}, S.meta, m); paintCamp(); };
      S.camp = 'raum'; S.table = { me1: { char: 'SL', ac: 10, level: 5, dm: true }, u2: { char: 'Lyra', ac: 13, level: 5 }, u3: { char: 'Tor', ac: 16, level: 5 } };
      S.meta = { dm: 'me1', mercy: {} }; S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 2 }, { mid: 'adult-red', n: 1 }], 'Test', {}); S.view = 'camp'; render(); });
    await pruefe('Tisch SL Kampf');
    await go(() => { nextTurn(); }); await pruefe('Tisch SL Gegnerzug');
    await go(() => { S.meta = { dm: 'u2', mercy: {} }; render(); }); await pruefe('Tisch Spieler');
    await go(() => { S.camp = ''; S.combat = null; S.meta = { dm: null, mercy: {} }; });
    // Abenteuer: Liste, Übersicht und jedes Kapitel und jede Szene beider Abenteuer (Kapitel nur auf 390 vollständig)
    await go(() => { S.view = 'adv'; S.adv = null; render(); }); await pruefe('Abenteuer Liste');
    for (const aid of ['machtader', 'krug']) {
      await go((aid) => { XA.advOpen(null, aid); }, aid); await pruefe('Abenteuer ' + aid + ' Übersicht');
      const chs = await go(() => { const A = advCurA(); return A.chapters.map((c) => [c.id, c.scenes.map((s) => s.id)]); });
      for (const [cid, scs] of chs) for (const sid of (w === 390 && !schnell ? scs : scs.slice(0, 1))) { await go(([cid, sid]) => { XA.advTab(null, 'ch:' + cid); XA.advScene(null, sid); window.scrollTo(0, 0); }, [cid, sid]); await pruefe('Abenteuer ' + aid + ' ' + cid + '/' + sid); }
      for (const tab of ['mobs', 'items', 'figs']) { const ok = await go((t) => { const b = document.querySelector('[data-act="advTab"][data-arg="' + t + '"]'); if (b) { b.click(); return true; } return false; }, tab); if (ok) await pruefe('Abenteuer ' + aid + ' Reiter ' + tab); }
    }
    // Stimmungen (Bogen Kampf und Erschaffen)
    if (w === 390 || w === 1280) for (const th of await go(() => Object.keys(THEMES))) {
      await go((th) => { localStorage.setItem('hb_theme', th); S.cur = Object.keys(S.chars)[0]; S.view = 'sheet'; S.mg = 'kampf'; render(); applyTheme(); }, th); await pruefe('Stimmung ' + th + ' Bogen');
      await go(() => { S.view = 'build'; S.step = 0; render(); }); await pruefe('Stimmung ' + th + ' Erschaffen');
    }
    await go(() => { localStorage.setItem('hb_theme', 'warm'); applyTheme(); });
    // Hilfe-Stufen Einsteiger und Erfahren
    for (const lv of ['neu', 'pro']) { await go((lv) => { hlSetLevel(lv); S.view = 'sheet'; S.mg = 'kampf'; render(); }, lv); await pruefe('Hilfe-Stufe ' + lv + ' Bogen'); await go(() => { S.view = 'build'; S.step = 0; render(); }); await pruefe('Hilfe-Stufe ' + lv + ' Erschaffen'); }
    await go(() => hlSetLevel('std'));
    // Menüs und Fenster
    if (mob) { await go(() => { S.view = 'sheet'; S.more = true; render(); }); await pruefe('Mehr-Menü'); await go(() => { S.more = false; render(); }); }
    for (const a of ['histOpen', 'hlOpen', 'stOpen', 'themeOpen', 'diceOpen', 'warnOpen']) { const ok = await go((a) => { if (!XA[a]) return false; try { XA[a](document.body); } catch (e) { return 'Fehler: ' + e.message; } return true; }, a); if (ok === true) await pruefe('Fenster ' + a); else if (ok) merke(tag + ' Fenster ' + a, 'Skriptfehler', ok); await go(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; S.modal = null; S.warnOpen = false; render(); }); }
    await p.close();
  }
  await b.close();
  console.log('Geprüfte Bildschirme: ' + n);
  errs.slice(0, 40).forEach((e) => console.log('✘ Fehler: ' + e));
  [...befunde.entries()].sort().forEach(([k, wo]) => console.log('✘ ' + k + '   (z. B. ' + wo.join(' ; ') + ')'));
  const f = befunde.size + errs.length; console.log(f ? f + ' Befunde' : 'Keine Befunde'); process.exit(f ? 1 : 0);
})();
