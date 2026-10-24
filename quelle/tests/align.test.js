/* Gesinnung: nur die neun D&D-Gesinnungen, jede mit Beschreibung und typischen Kreaturen; alte freie Einträge werden erkannt
   oder bleiben sichtbar. Aufruf: node tests/align.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  await p.goto('file://' + target); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const ch = normChar(newChar({ name: 'Ilva', cls: 'wiz', level: 3 })); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'build'; S.step = 6; render(); });
  T('Abschluss: neun Gesinnungen im Raster, kein freies Textfeld mehr', await p.evaluate(() => document.querySelectorAll('.algrid [data-act="setAlign"]').length === 9 && !document.querySelector('[data-bind="alignment"]')));
  T('Reihenfolge: gut – neutral – böse, je rechtschaffen – neutral – chaotisch', await p.evaluate(() => [...document.querySelectorAll('.algrid .chip')].map((c) => c.textContent.replace(/­/g, '')).join('|') === 'Rechtschaffen gut|Neutral gut|Chaotisch gut|Rechtschaffen neutral|Neutral|Chaotisch neutral|Rechtschaffen böse|Neutral böse|Chaotisch böse'));
  T('Jede Gesinnung hat Beschreibung, Beispiel und typische Kreaturen', await p.evaluate(() => Object.values(ALIGN).every((a) => a.d.length > 40 && a.ex.length > 20 && a.cr.length > 5)));
  await p.evaluate(() => document.querySelector('[data-act="setAlign"][data-arg="NG"]').click());
  T('Antippen wählt und zeigt die Beschreibung', await p.evaluate(() => cur().alignment === 'Neutral gut' && /Neutral gut:/.test($('.aldesc').textContent) && /Typisch für/.test($('.aldesc').textContent) && document.querySelector('[data-arg="NG"]').classList.contains('on')));
  T('Ältere freie Einträge werden erkannt', await p.evaluate(() => ['LG', 'lawful good', 'rechtschaffen-gut', 'Chaotisch Böse', 'wahrhaft neutral', 'NE', 'Rechtschaffen neutral'].map((x) => normChar(Object.assign(newChar({}), { alignment: x })).alignment).join('|') === 'Rechtschaffen gut|Rechtschaffen gut|Rechtschaffen gut|Chaotisch böse|Neutral|Neutral böse|Rechtschaffen neutral'));
  await p.evaluate(() => { cur().alignment = 'mein eigener Weg'; render(); });
  T('Unbekannter alter Eintrag bleibt erhalten und wird angezeigt', await p.evaluate(() => cur().alignment === 'mein eigener Weg' && /mein eigener Weg/.test($('.alfld').textContent) && !document.querySelector('.algrid .chip.on')));
  await p.evaluate(() => { cur().alignment = 'Chaotisch gut'; S.view = 'sheet'; render(); });
  T('Bogen: Gesinnung im Kopf mit ⓘ', await p.evaluate(() => /Chaotisch gut/.test($('.shead').textContent) && !!$('.shead .ii[data-arg="al:CG"]')));
  await p.evaluate(() => $('.shead .ii[data-arg="al:CG"]').click());
  T('ⓘ öffnet die Erklärung mit Beispiel und typischen Kreaturen', await p.evaluate(() => S.modal === 'info' && /Chaotisch gut/.test($('#modal').textContent) && /Zum Beispiel/.test($('#modal').textContent) && /Pegasi/.test($('#modal').textContent)));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
