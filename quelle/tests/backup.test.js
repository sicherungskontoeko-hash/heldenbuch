/* Sicherung (P11): „Alles sichern“ enthält Helden, Hausregeln, eigene Monster, Begegnungen, SL-Notizen; Laden stellt alles wieder her,
   alte Exporte bleiben lesbar. Aufruf: node tests/backup.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const c1 = await b.newContext(); const p = await c1.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(400);
  const data = await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const ch = normChar(newChar({ name: 'Brakk', cls: 'fig', level: 3 })); S.chars[ch.id] = ch; S.cur = ch.id; persist('c', ch.id);
    ownMobsStore([{ id: 'm1', name: 'Moorhexe', cr: '3', ac: 15, hp: 60, atks: [['Klauen', 5, '2W8+3', 'Hieb']], hab: ['sumpf'] }]); ownMobsLoad();
    encStore([{ id: 'e1', name: 'Hinterhalt am Pass', mobs: [{ mid: 'goblin', n: 4 }], t: Date.now() }]);
    localStorage.setItem('heldenbuch_dm_valdris', 'Der Baron ist der Verräter.');
    return exportData(Object.values(S.chars), true); });
  const d = JSON.parse(data);
  T('Sicherung enthält Helden, eigene Monster, Begegnungen, SL-Notizen', d.chars.length >= 1 && d.extra.mobs[0].name === 'Moorhexe' && d.extra.enc[0].name === 'Hinterhalt am Pass' && d.extra.dmNotes.valdris === 'Der Baron ist der Verräter.');
  T('Einzelner Held: ohne SL-Daten (klein)', await p.evaluate(() => !JSON.parse(exportData([cur()])).extra));
  /* neues Gerät */
  const c2 = await b.newContext(); const q = await c2.newPage(); q.on('pageerror', (e) => errs.push(e.message)); await q.goto('file://' + target); await q.waitForTimeout(400);
  await q.evaluate((t) => { localStorage.setItem('hb_sample_done', '1'); importJson(t); }, data);
  T('Neues Gerät: Held geladen', await q.evaluate(() => Object.values(S.chars).some((c) => c.name === 'Brakk')));
  T('… eigene Monster wieder im Bestiarium', await q.evaluate(() => ownMobs().length === 1 && Object.values(BESTIARY).some((m) => m[0] === 'Moorhexe')));
  T('… gespeicherte Begegnung wieder da', await q.evaluate(() => encLoad().some((e) => e.name === 'Hinterhalt am Pass')));
  T('… SL-Notizen der Runde wieder da', await q.evaluate(() => localStorage.getItem('heldenbuch_dm_valdris') === 'Der Baron ist der Verräter.'));
  await q.evaluate((t) => importJson(t), data);
  T('Zweimal laden: keine doppelten Monster/Begegnungen/Notizen', await q.evaluate(() => ownMobs().length === 1 && encLoad().length === 1 && localStorage.getItem('heldenbuch_dm_valdris') === 'Der Baron ist der Verräter.'));
  await q.evaluate(() => { localStorage.setItem('heldenbuch_dm_valdris', 'Neue Notiz am Tisch.'); });
  await q.evaluate((t) => importJson(t), data);
  T('Abweichende Notiz: wird angehängt, nichts überschrieben', await q.evaluate(() => /^Neue Notiz am Tisch\.[\s\S]*aus der Sicherung[\s\S]*Verräter/.test(localStorage.getItem('heldenbuch_dm_valdris'))));
  const old = JSON.stringify({ heldenbuch: 1, chars: [JSON.parse(data).chars[0]], hb: [] });
  T('Alter Export (ohne SL-Daten) lädt weiterhin', await q.evaluate((t) => { try { importJson(t); return true; } catch (e) { return e.message; } }, old));
  T('Knopf heisst „Alles sichern“', await q.evaluate(() => { S.view = 'heroes'; render(); return [...document.querySelectorAll('[data-act="exportAll"]')].some((x) => /^Alles sichern$/.test(x.textContent)); }));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
