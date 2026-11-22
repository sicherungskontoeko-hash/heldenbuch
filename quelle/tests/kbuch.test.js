/* Kampagnenbuch: Personen, Orte und Aufträge im Chronik-Fenster – anlegen, bearbeiten, Stand, Freigabe,
   Chronik-Einträge, Buchwahl, Sicherung und Wiederherstellung, Claude-Lage, Darstellung auf Handy und PC.
   (Das Teilen mit den Spielern am Tisch prüft sitzung.test.js.)
   Aufruf: node tests/kbuch.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const { scan } = require('./overlap-lib');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  let backup = '';
  for (const dev of [{ n: 'Handy', vp: { width: 360, height: 740 }, m: true }, { n: 'PC', vp: { width: 1366, height: 768 } }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(450); const d = dev.n + ': ';
    await p.evaluate(() => { localStorage.setItem('hb_name', 'SL'); if (S.modal === 'welcome') { S.modal = null; $('#modal').hidden = true; } const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); S.view = 'sheet'; render(); });
    await p.evaluate(() => XA.chrOpen());
    T(d + 'Chronik-Fenster mit Reitern Chronik, Personen, Orte, Aufträge', await p.evaluate(() => S.modal === 'chronik' && ['chr', 'p', 'o', 'a'].every((k) => !!document.querySelector('.kbtabs [data-arg="' + k + '"]')) && document.querySelector('.kbtabs .on').dataset.arg === 'chr'));
    await p.click('.kbtabs [data-arg="p"]'); await p.waitForTimeout(100);
    T(d + 'Reiter Personen: leer mit Hinweis und Eingabefeld', await p.evaluate(() => !!$('#kbN') && /Noch keine Personen/.test($('#modal').textContent)));
    await p.click('#modal [data-act="kbAdd"]');
    T(d + 'Ohne Namen wird nichts angelegt', await p.evaluate(() => kbList().length === 0));
    await p.fill('#kbN', 'Brannok Hornhand'); await p.press('#kbN', 'Enter'); await p.waitForTimeout(100);
    T(d + 'Person mit Enter angelegt und aufgeklappt', await p.evaluate(() => { const L = kbList(); return L.length === 1 && L[0].typ === 'p' && L[0].st === 'neutral' && !L[0].frei && !!document.querySelector('.kbi details[open]'); }));
    const id = await p.evaluate(() => kbList()[0].id);
    await p.fill('[data-kb="d"][data-id="' + id + '"]', 'Schmied in Felsbruck, kennt die Machtader'); await p.fill('[data-kb="g"][data-id="' + id + '"]', 'Steckt mit Golden Scale unter einer Decke');
    await p.locator('[data-kb="d"][data-id="' + id + '"]').dispatchEvent('change');
    T(d + 'Kurz und geheime Notiz gespeichert, Kurztext in der Zeile', await p.evaluate((id) => { const x = kbList().find((y) => y.id === id); return x.d === 'Schmied in Felsbruck, kennt die Machtader' && /Golden Scale/.test(x.g) && /Schmied in Felsbruck/.test(document.querySelector('.kbi summary').textContent); }, id));
    await p.click('[data-act="kbSt"][data-arg="' + id + ':freund"]'); await p.waitForTimeout(80);
    await p.check('[data-kb="frei"][data-id="' + id + '"]'); await p.waitForTimeout(80);
    T(d + 'Stand «Verbündet» und Freigabe gespeichert, 👁 sichtbar', await p.evaluate((id) => { const x = kbList().find((y) => y.id === id); return x.st === 'freund' && x.frei && !!document.querySelector('.kbeye'); }, id));
    T(d + 'Chronik vermerkt Stand und Freigabe', await p.evaluate(() => { const L = chrList(); return L.some((e) => e.k === 'person' && /Brannok Hornhand: Verbündet/.test(e.x)) && L.some((e) => e.k === 'person' && /kennen jetzt: Brannok/.test(e.x)); }));
    /* Auftrag */
    await p.click('.kbtabs [data-arg="a"]'); await p.fill('#kbN', 'Die gestohlene Glocke zurückbringen'); await p.click('#modal [data-act="kbAdd"]'); await p.waitForTimeout(80);
    const aid = await p.evaluate(() => kbList().find((x) => x.typ === 'a').id);
    T(d + 'Auftrag offen, Zähler am Reiter', await p.evaluate(() => /Aufträge\s*1/.test(document.querySelector('.kbtabs [data-arg="a"]').textContent) && chrList().some((e) => e.k === 'auftrag' && /Neuer Auftrag: Die gestohlene Glocke/.test(e.x))));
    await p.click('[data-act="kbSt"][data-arg="' + aid + ':erledigt"]'); await p.waitForTimeout(80);
    T(d + 'Auftrag erledigt: Chronik, Zähler weg, Eintrag gedimmt', await p.evaluate(() => chrList().some((e) => /Auftrag erledigt: Die gestohlene Glocke/.test(e.x)) && !/Aufträge\s*\d/.test(document.querySelector('.kbtabs [data-arg="a"]').textContent) && !!document.querySelector('.kbi.dim')));
    /* Ort, dann Darstellung */
    await p.click('.kbtabs [data-arg="o"]'); await p.fill('#kbN', 'Wirtshaus zum letzten Krug'); await p.press('#kbN', 'Enter'); await p.waitForTimeout(80);
    T(d + 'Ort angelegt (Stand «Nicht besucht»)', await p.evaluate(() => kbList().some((x) => x.typ === 'o' && x.st === 'offen')));
    const r = await scan(p, d + 'Kampagnenbuch');
    T(d + 'Fenster: nichts verdeckt oder abgeschnitten, kein Querscrollen', !r.covered.length && !r.cut.length && !r.hscroll, r);
    await p.click('.kbtabs [data-arg="chr"]');
    T(d + 'Zurück zur Chronik: Einträge sichtbar', await p.evaluate(() => document.querySelectorAll('#chrList .ce').length >= 4));
    T(d + 'Claude-Lage enthält Personen, Orte, Aufträge samt geheimer Notiz', await p.evaluate(() => { const s = slLage('Was nun?'); return /## Personen, Orte, Aufträge/.test(s) && /Brannok Hornhand \[Verbündet, den Spielern bekannt\]/.test(s) && /geheim: Steckt mit Golden Scale/.test(s) && /Die gestohlene Glocke/.test(s); }));
    /* Löschen mit Rückfrage */
    await p.click('.kbtabs [data-arg="o"]'); const oid = await p.evaluate(() => kbList().find((x) => x.typ === 'o').id);
    await p.evaluate((oid) => { const dd = document.querySelector('details[data-kbid="' + oid + '"]'); dd.open = true; }, oid);
    await p.click('[data-act="kbDel"][data-arg="' + oid + '"]'); await p.waitForTimeout(80);
    T(d + 'Löschen fragt nach', await p.evaluate(() => !!document.querySelector('.cfdlg') && kbList().some((x) => x.typ === 'o')));
    await p.evaluate((oid) => XA.kbDel(null, oid), oid);
    T(d + 'Gelöscht', await p.evaluate(() => !kbList().some((x) => x.typ === 'o')));
    /* Neustart */
    await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; }); await p.reload(); await p.waitForTimeout(450);
    T(d + 'Bleibt nach Neustart', await p.evaluate(() => kbList().length === 2));
    /* Zweites Buch: Abenteuer öffnen, dann Buchwahl */
    await p.evaluate(() => { XA.advOpen(null, 'krug'); S.view = 'sheet'; render(); XA.chrOpen(); });
    T(d + 'Neues Abenteuer = neues Buch, Buchwahl erscheint', await p.evaluate(() => !!$('#kbBook') && $('#kbBook').options.length >= 2 && /Krug/.test($('#kbBook').selectedOptions[0].textContent)));
    await p.selectOption('#kbBook', 'frei'); await p.click('.kbtabs [data-arg="p"]'); await p.waitForTimeout(80);
    T(d + 'Buchwahl zeigt die Personen des anderen Buchs', await p.evaluate(() => /Brannok Hornhand/.test($('#modal').textContent) && /Ohne Abenteuer/.test(document.querySelector('#modal .dph b').textContent)));
    if (!backup) backup = await p.evaluate(() => exportData(Object.values(S.chars), true));
    await ctx.close();
  }
  /* Sicherung enthält Chronik und Buch; Wiederherstellung auf neuem Gerät */
  T('«Alles sichern» enthält Chronik und Kampagnenbuch', /"kb":/.test(backup) && /Brannok Hornhand/.test(backup) && /"chr":/.test(backup));
  {
    const ctx = await b.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('Wiederherstellen: ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    const done = await p.evaluate((txt) => { const x = JSON.parse(txt); return restoreExtras(x.extra); }, backup);
    T('Wiederherstellen bringt Chronik und Buch zurück', await p.evaluate(() => kbList('frei').some((x) => x.n === 'Brannok Hornhand' && /Golden Scale/.test(x.g)) && chrList('frei').length >= 4), done);
    const again = await p.evaluate((txt) => { restoreExtras(JSON.parse(txt).extra); return kbList('frei').length + '/' + chrList('frei').length; }, backup);
    const first = await p.evaluate(() => kbList('frei').length + '/' + chrList('frei').length);
    T('Zweimal wiederherstellen verdoppelt nichts', again === first, again);
    await ctx.close();
  }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close();
  let ok = 0; for (const r of out) { console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : ' → ' + JSON.stringify(r.got).slice(0, 900))); if (r.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
