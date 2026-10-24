/* Willkommen: Beim ersten Start muss man seinen Namen eingeben; er erscheint am Tisch neben dem Helden und bleibt auf dem Gerät.
   Aufruf: node tests/welcome.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(() => { window.__hbWelcomeTest = true; });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(500);
  T('Erster Start: Willkommensdialog mit Namensfeld', await p.evaluate(() => !$('#modal').hidden && S.modal === 'welcome' && !!$('#wName')));
  T('App: optionales Raumcode-Feld, Browser: keines', await p.evaluate(() => isApp() ? !!$('#wRoom') : !$('#wRoom')));
  await p.mouse.click(5, 5); await p.keyboard.press('Escape');
  T('Lässt sich nicht wegklicken oder mit Esc schliessen', await p.evaluate(() => !$('#modal').hidden && S.modal === 'welcome'));
  await p.click('#modal [data-act="welcomeGo"]');
  T('Ohne Namen: Hinweis, Dialog bleibt', await p.evaluate(() => !$('#wErr').hidden && !$('#modal').hidden && !myName()));
  await p.fill('#wName', '  Manu  '); await p.press('#wName', 'Enter'); await p.waitForTimeout(200);
  T('Name mit Enter gespeichert, Dialog zu', await p.evaluate(() => myName() === 'Manu' && $('#modal').hidden && !S.modal));
  T('Dialog passt aufs Handy (kein Querscrollen)', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  await p.reload(); await p.waitForTimeout(500);
  T('Neustart: kein Dialog mehr, Name bleibt', await p.evaluate(() => $('#modal').hidden && myName() === 'Manu'));
  await p.evaluate(() => { UID = 'me1'; const ch = normChar(newChar({ name: 'Lyra', cls: 'wiz', level: 3 })); S.chars[ch.id] = ch; S.cur = ch.id;
    S.camp = 'raum'; S.meta = { dm: 'u2', mercy: {} }; S.table = { me1: meDoc(), u2: { char: 'Brakk', pl: 'Sandro', ac: 16, level: 3 } }; S.combat = null; S.view = 'camp'; render(); });
  T('Am Tisch wird der Name mitgeschickt', await p.evaluate(() => meDoc().pl === 'Manu'));
  T('„Die Gruppe“: „Lyra (Manu)“', await p.evaluate(() => /Lyra\s*\(Manu\)/.test(partyHtml().replace(/<[^>]+>/g, ''))));
  T('Spielleitung mit Spielername: „Spielleitung: Sandro“', await p.evaluate(() => /Spielleitung: Sandro/.test(partyHtml().replace(/<[^>]+>/g, ''))));
  T('Tisch: „Du bist am Tisch als Manu · ändern“', await p.evaluate(() => /Du bist am Tisch als Manu/.test($('#view').textContent) && !!$('#view [data-act="nameEdit"]')));
  await p.evaluate(() => $('#view [data-act="nameEdit"]').click());
  await p.fill('#wName', 'Manuel'); await p.click('#modal [data-act="welcomeGo"]');
  T('Name ändern', await p.evaluate(() => myName() === 'Manuel' && $('#modal').hidden));
  T('Sicherung enthält den Namen', await p.evaluate(() => backupExtras().player === 'Manuel'));
  await p.evaluate(() => { localStorage.removeItem('heldenbuch_player'); restoreExtras({ player: 'Manuel' }); });
  T('Wiederherstellen auf neuem Gerät übernimmt den Namen', await p.evaluate(() => myName() === 'Manuel'));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
