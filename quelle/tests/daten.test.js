/* Daten und Regeln im Grossen:
   1. «Alles sichern» → alles löschen → laden: jeder Held hat danach exakt dieselben Werte (RK, TP, Initiative, Angriffe, Zauber-SG,
      Zauberplätze, Ressourcen, Warnungen), Hausregeln, eigene Monster, Begegnungen und Abenteuer-Fortschritt sind wieder da.
   2. Neustart der Seite: alles bleibt erhalten.
   3. Alte Sicherungen ohne neuere Felder laden ohne Fehler, kaputte Dateien werden abgewiesen, bestehende Helden bleiben.
   4. Plausibilität: alle Spezies × alle Hintergründe × 16 Klassen × Stufen 1/3/5/11/20 – Zahlen endlich und in vernünftigen Grenzen.
   Aufruf: node tests/daten.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const out = []; const errs = [];
const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
const WERTE = () => { const r = {}; Object.values(S.chars).forEach((ch) => { const c = derive(ch, S.hb);
  r[ch.name] = JSON.stringify({ lv: c.level, ac: c.ac, hp: c.hpMax, init: c.init, sp: c.speed, pb: c.pb, ab: c.abil, sv: Object.fromEntries(Object.entries(c.saves).map(([k, v]) => [k, v.val])), sk: Object.fromEntries(Object.entries(c.skills).map(([k, v]) => [k, v.val])),
    at: (c.attacks || []).map((a) => [a.name, a.atk, a.dmg]), dc: c.spell && c.spell.dc, sl: c.spell && c.spell.slots, res: (c.res || []).map((x) => [x.k, x.max]), warn: c.warn.length, play: ch.play, comps: ch.comps, notes: ch.notes }); }); return r; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.dismiss().catch(() => {}));
  await p.goto('file://' + target); await p.waitForTimeout(600);
  // 1. Viele Helden mit Spielstand, Hausregel, eigenes Monster, Begegnung, Abenteuer-Fortschritt
  const n = await p.evaluate(() => {
    localStorage.setItem('hb_dice_fx', 'aus'); Object.keys(S.chars).forEach((k) => delete S.chars[k]);
    let i = 0;
    for (const [k, C] of Object.entries(CLASSES)) for (const lv of [1, 5, 20]) {
      const subs = C.subs || []; const sp = Object.keys(SPECIES)[i % Object.keys(SPECIES).length];
      const ch = normChar(newChar({ name: 'D' + (++i) + ' ' + C.name + ' ' + lv, cls: k, level: lv, sub: lv >= 3 && subs.length ? subs[i % subs.length].id : '', species: sp, bg: ['acolyte', 'criminal', 'sage', 'soldier'][i % 4], weapons: [{ w: 'longsword' }, { w: 'shortbow' }], armor: 'leather', notes: 'Notiz äöü «Test» ' + i }));
      ch.play.hp = Math.max(1, derive(ch, S.hb).hpMax - 3); ch.play.cond = i % 3 ? [] : ['poisoned']; ch.play.insp = i % 2 === 0; ch.comps = [{ t: 'f-owl', name: 'Huhu' }];
      S.chars[ch.id] = ch; persist('c', ch.id);
    }
    const m = normChar(newChar({ name: 'D Mehrklassen', cls: 'pal', level: 6, sub: 'devotion', multi: [{ cls: 'wlk', level: 3, sub: 'fiend' }], species: 'halfelf', bg: 'soldier' })); S.chars[m.id] = m; persist('c', m.id);
    const hbId = 'hbtest1'; S.hb[hbId] = { id: hbId, kind: 'feature', name: 'Testmerkmal', text: 'Nur ein Test.' }; persist('h', hbId);
    ownMobsStore([{ id: 'dtest', name: 'Datentroll', cr: '2', ac: 13, hp: 40, atks: [['Keule', 5, '2W6+3', 'Wucht']] }]); ownMobsLoad();
    encStore([{ id: 'etest', name: 'Testbegegnung', mobs: [{ mid: 'goblin', n: 3 }], t: Date.now() }]);
    XA.advOpen(null, 'machtader'); XA.advTab(null, 'ch:k2');
    return Object.keys(S.chars).length; });
  T('Ausgangslage: ' + n + ' Helden angelegt', n === 49, n);
  const vorher = await p.evaluate(WERTE);
  const datei = await p.evaluate(() => exportData(Object.values(S.chars), true));
  T('Sicherung enthält alle Helden und Extras', await p.evaluate((d) => { const o = JSON.parse(d); return o.chars.length === 49 && o.hb.some((h) => h.id === 'hbtest1') && o.extra.mobs.some((m) => m.id === 'dtest') && o.extra.enc.some((e) => e.id === 'etest'); }, datei));
  // alles löschen, neu laden, Sicherung einspielen
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload(); await p.waitForTimeout(600);
  T('Nach dem Löschen leer (nur Beispielheld möglich)', await p.evaluate(() => Object.values(S.chars).filter((c) => /^D/.test(c.name)).length === 0));
  await p.evaluate((d) => { localStorage.setItem('hb_dice_fx', 'aus'); Object.keys(S.chars).forEach((k) => delete S.chars[k]); importJson(d); }, datei);
  const nachher = await p.evaluate(WERTE);
  const diff = Object.keys(vorher).filter((k) => vorher[k] !== nachher[k]);
  T('Nach dem Laden: alle 49 Helden mit identischen Werten und Spielständen', Object.keys(nachher).length === 49 && !diff.length, diff.slice(0, 3).map((k) => [k, vorher[k], nachher[k]]));
  T('Hausregel, eigenes Monster, Begegnung wieder da', await p.evaluate(() => !!S.hb.hbtest1 && !!BESTIARY['u-dtest'] && encLoad().some((e) => e.id === 'etest')));
  // 2. Neustart
  await p.waitForTimeout(1200); await p.reload(); await p.waitForTimeout(800);
  const neu = await p.evaluate(WERTE);
  T('Neustart: alles bleibt erhalten', Object.keys(neu).length === 49 && Object.keys(vorher).every((k) => vorher[k] === neu[k]), Object.keys(neu).length);
  T('Neustart: Abenteuer-Fortschritt erhalten', await p.evaluate(() => { const d = advDb(); return d.st.machtader && d.st.machtader.ch === 'k2'; }));
  // 3. Alte und kaputte Dateien
  const alt = await p.evaluate(() => { const before = Object.keys(S.chars).length;
    const old = { heldenbuch: 1, chars: [{ id: 'altheld1', name: 'Alter Held', cls: 'fig', level: 3, species: 'dwarf', bg: 'soldier', base: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }, weapons: [{ w: 'longsword' }], armor: 'chainmail', shield: true }] };
    let ok = true; try { importJson(JSON.stringify(old)); } catch (e) { ok = 'Fehler: ' + e.message; }
    const h = Object.values(S.chars).find((c) => c.name === 'Alter Held'); let d = null; try { d = h && derive(h, S.hb); } catch (e) { d = 'Fehler: ' + e.message; }
    return { ok, da: !!h, werte: d && typeof d === 'object' ? [d.ac, d.hpMax, d.level] : d, plus: Object.keys(S.chars).length - before }; });
  T('Alte Sicherung ohne neuere Felder lädt, Werte stimmen (RK 18, TP 31, Stufe 3)', alt.ok === true && alt.da && alt.plus === 1 && alt.werte[0] === 18 && alt.werte[2] === 3 && alt.werte[1] > 0, alt);
  const kaputt = await p.evaluate(() => { const before = Object.keys(S.chars).length; const res = [];
    for (const t of ['', 'kein json', '{}', '{"chars":"x"}', '{"chars":[{"name":"X"}]}', '{"chars":[{"id":"a","cls":"zzz","name":"Y","level":3}]}', '{"chars":[{"id":"b","cls":"fig","name":"Z","level":"drei"}]}', '[1,2,3]', '{"chars":[],"hb":"x"}']) {
      try { importJson(t); res.push('angenommen: ' + t); } catch (e) { res.push(e.message ? 'ok' : 'leer'); } }
    return { res, gleich: Object.keys(S.chars).length === before }; });
  T('Kaputte Dateien werden abgewiesen, bestehende Helden bleiben', kaputt.gleich && kaputt.res.every((x) => x === 'ok'), kaputt);
  // 3b. TP über dem Maximum: Stufe senken im Erschaffen kürzt die gespeicherten TP, der Tisch sieht nie «44/38»
  const tp = await p.evaluate(() => { const h = normChar(newChar({ name: 'TP-Test', cls: 'fig', level: 5, species: 'human', bg: 'soldier' })); S.chars[h.id] = h; S.cur = h.id;
    h.play.hp = derive(h, S.hb).hpMax; S.view = 'build'; S.step = 0; render(); const vor = h.play.hp;
    document.querySelector('[data-act="lvl"][data-arg="-1"]').click(); const max = derive(h, S.hb).hpMax; const d = meDoc();
    const r = { vor, nach: h.play.hp, max, tisch: [d.hp, d.hpMax] }; delete S.chars[h.id]; return r; });
  T('Stufe senken: TP werden aufs neue Maximum gekürzt, auch für den Tisch', tp.nach === tp.max && tp.max < tp.vor && tp.tisch[0] === tp.max && tp.tisch[1] === tp.max, tp);
  // 4. Plausibilität über alle Spezies × Hintergründe × Klassen × Stufen
  const pl = await p.evaluate(() => { const bad = []; let z = 0; const fin = (v) => typeof v === 'number' && isFinite(v);
    for (const sp of Object.keys(SPECIES)) for (const bg of Object.keys(BACKGROUNDS)) for (const [k, C] of Object.entries(CLASSES)) for (const lv of [1, 3, 5, 11, 20]) {
      z++; const subs = C.subs || []; let c;
      try { const ch = normChar(newChar({ name: 'P', cls: k, level: lv, sub: lv >= 3 && subs.length ? subs[z % subs.length].id : '', species: sp, bg, weapons: [{ w: 'longsword' }, { w: 'dagger' }], armor: ['leather', 'chainmail', 'none'][z % 3] })); c = derive(ch, S.hb); }
      catch (e) { bad.push([sp, bg, k, lv, 'Fehler ' + e.message]); continue; }
      const where = sp + '/' + bg + '/' + k + lv;
      if (!fin(c.ac) || c.ac < 8 || c.ac > 26) bad.push([where, 'RK ' + c.ac]);
      if (!fin(c.hpMax) || c.hpMax < 1 || c.hpMax > 400) bad.push([where, 'TP ' + c.hpMax]);
      if (!fin(c.init) || Math.abs(c.init) > 15) bad.push([where, 'Init ' + c.init]);
      if (!fin(c.speed) || c.speed < 6 || c.speed > 30) bad.push([where, 'Bewegung ' + c.speed]);
      if (c.pb !== Math.ceil(lv / 4) + 1) bad.push([where, 'Übungsbonus ' + c.pb]);
      Object.values(c.abil).forEach((v) => { if (!fin(v) || v < 3 || v > 30) bad.push([where, 'Attribut ' + v]); });
      (c.attacks || []).forEach((a) => { if (!fin(a.atk) || Math.abs(a.atk) > 20 || !/^\d+W\d+|^\d+$/.test(String(a.dmg))) bad.push([where, 'Angriff ' + a.name + ' ' + a.atk + ' ' + a.dmg]); });
      if (c.spell && c.spell.has && (!fin(c.spell.dc) || c.spell.dc < 8 || c.spell.dc > 25)) bad.push([where, 'Zauber-SG ' + c.spell.dc]);
      (c.warn || []).forEach((w) => { const t = typeof w === 'string' ? w : JSON.stringify(w); if (/undefined|NaN|null/.test(t)) bad.push([where, 'Warnung ' + t.slice(0, 80)]); });
    }
    return { z, bad: bad.slice(0, 12), n: bad.length }; });
  T('Plausibilität: ' + pl.z + ' Kombinationen (Spezies × Hintergrund × Klasse × Stufe) ohne Auffälligkeit', pl.n === 0, pl);
  await b.close();
  T('Keine Skriptfehler', !errs.length, errs.slice(0, 5));
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got).slice(0, 1500))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); process.exit(f ? 1 : 0);
})();
