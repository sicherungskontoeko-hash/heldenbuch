/* Pflege: Sicherung nach dem Spielabend anbieten, Stolpersteine sammeln, alter Mosquitto-Server wird ersetzt (nur App).
   Aufruf: node tests/pflege.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });

  /* 1. Sicherung nach dem Spielabend */
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__hbBkTest = true; });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('Sicherung: ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(700);
    T('Ohne Würfe: keine Rückfrage', await p.evaluate(() => !$('#pfBk')));
    await p.evaluate(() => { const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); for (let i = 0; i < 12; i++) histAdd({ label: 'Wurf ' + i, total: 10 + i, detail: 'W20' }); histAdd({ label: 'Lyra', total: 5 }, 'Lyra', true); });
    await p.reload(); await p.waitForTimeout(900);
    T('Nach 12 eigenen Würfen ohne Sicherung: Rückfrage beim Start', await p.evaluate(() => !!$('#pfBk') && /12-mal/.test($('#pfBk').textContent)));
    T('Rückfrage passt aufs Handy', await p.evaluate(() => { const r = $('#pfBk').getBoundingClientRect(); return r.left >= 0 && r.right <= 390 && document.documentElement.scrollWidth <= 391; }));
    await p.click('#pfBk [data-act="pfBkLater"]'); await p.waitForTimeout(100);
    T('«Später» schliesst und merkt sich die Frage', await p.evaluate(() => !$('#pfBk') && +localStorage.getItem('hb_bkAsk') > Date.now() - 60000));
    await p.reload(); await p.waitForTimeout(900);
    T('Am selben Tag nicht nochmals gefragt', await p.evaluate(() => !$('#pfBk')));
    await p.evaluate(() => { localStorage.removeItem('hb_bkAsk'); localStorage.setItem('hb_lastExport', String(Date.now() - 3600e3)); });
    await p.reload(); await p.waitForTimeout(900);
    T('Frisch gesichert: keine Rückfrage', await p.evaluate(() => !$('#pfBk')));
    await p.evaluate(() => { localStorage.setItem('hb_lastExport', String(Date.now() - 2 * 864e5)); for (let i = 0; i < 10; i++) histAdd({ label: 'Neu ' + i, total: 3, detail: 'W20' }); });
    await p.reload(); await p.waitForTimeout(900);
    T('Zwei Tage alt und 10 neue Würfe: Rückfrage', await p.evaluate(() => !!$('#pfBk')));
    await p.click('#pfBk [data-act="pfBkGo"]'); await p.waitForTimeout(400);
    T('«Jetzt sichern» startet die Sicherung', await p.evaluate(() => !$('#pfBk') && +localStorage.getItem('hb_lastExport') > Date.now() - 60000));
    await ctx.close();
  }
  {
    const ctx = await b.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('ohne Test-Schalter: ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(300);
    await p.evaluate(() => { const s = sampleChar(); S.chars[s.id] = s; persist('c', s.id); for (let i = 0; i < 15; i++) histAdd({ label: 'W ' + i, total: 1 }); });
    await p.reload(); await p.waitForTimeout(800);
    T('In fremden automatischen Tests stört die Rückfrage nicht', await p.evaluate(() => !$('#pfBk')));
    await ctx.close();
  }

  /* 2. Stolpersteine */
  for (const dev of [{ n: 'Handy', vp: { width: 390, height: 844 }, m: true }, { n: 'PC', vp: { width: 1280, height: 900 } }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(450); const d = dev.n + ': ';
    await p.evaluate(() => { const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); S.view = 'sheet'; S.mg = 'werte'; render(); });
    T(d + 'Menüeintrag «Stolperstein melden» vorhanden', await p.evaluate(() => !!document.querySelector('.smore [data-act="stOpen"]')));
    await p.evaluate(() => { document.querySelector('.smore').open = true; });
    await p.click('.smore [data-act="stOpen"]'); await p.waitForTimeout(150);
    T(d + 'Fenster offen, Ort erkannt (Bogen, Reiter Werte, Held)', await p.evaluate(() => S.modal === 'stolper' && /Bogen · Reiter Werte · .+Stufe \d/.test($('.stctx').textContent) && document.activeElement && document.activeElement.id === 'stX'));
    await p.click('#modal [data-act="stAdd"]');
    T(d + 'Leer: nichts gespeichert', await p.evaluate(() => stLoad().length === 0));
    await p.fill('#stX', 'Knopf für Bardische Inspiration nicht gefunden'); await p.press('#stX', 'Enter'); await p.waitForTimeout(100);
    T(d + 'Mit Enter festgehalten, mit Ort und Zeit', await p.evaluate(() => { const L = stLoad(); return L.length === 1 && /Inspiration/.test(L[0].x) && /Reiter Werte/.test(L[0].w) && L[0].t > Date.now() - 60000 && document.querySelectorAll('.stl li').length === 1 && $('#stX').value === ''; }));
    T(d + 'Kopiertext für Claude enthält Eintrag und Version', await p.evaluate(() => { const t = stText(); return /Stolpersteine aus dem Heldenbuch \((App|Browser)/.test(t) && /Bardische Inspiration/.test(t) && /Reiter Werte/.test(t); }));
    T(d + 'Kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; });
    await p.reload(); await p.waitForTimeout(450);
    T(d + 'Bleibt nach Neustart', await p.evaluate(() => stLoad().length === 1));
    await p.evaluate(() => { S.view = 'camp'; render(); XA.stOpen(); });
    T(d + 'Ort am Tisch: «Tisch»', await p.evaluate(() => /^Ort: Tisch/.test($('.stctx').textContent)));
    await p.click('#modal [data-act="stClear"]'); await p.waitForTimeout(100);
    T(d + '«Leeren» fragt nach', await p.evaluate(() => !!document.querySelector('.cfdlg') && stLoad().length === 1));
    await p.evaluate(() => { XA.stClear(); });
    T(d + 'Leeren löscht alle', await p.evaluate(() => stLoad().length === 0));
    await ctx.close();
  }

  /* 3. Verbindung: Mosquitto-Testserver entfernt, alte Wahl landet auf HiveMQ (nur App-Version) */
  {
    const ctx = await b.newContext(); await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem('hb_server', 'mosquitto'); sessionStorage.setItem('x', '1'); } } catch (e) {} });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('Server: ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    if (await p.evaluate(() => isApp())) {
      T('App: Mosquitto nicht mehr in der Auswahl', await p.evaluate(() => !HB_BROKERS.mosquitto && Object.keys(HB_BROKERS).join() === 'hivemq,emqx'));
      T('App: alte Wahl «Mosquitto» wird zu HiveMQ', await p.evaluate(() => localStorage.getItem('hb_server') === 'hivemq' && /hivemq/.test(hbServer())));
    } else T('Browser-Version: keine Server-Auswahl nötig', true);
    await ctx.close();
  }

  /* 4. PC-App: neue Version melden (nur App-Fassung mit Baunummer) */
  {
    const ctx = await b.newContext(); await ctx.addInitScript(() => { window.__hbUpdTest = true; window.hbDesk = { onTool() {}, reply() {}, connect: async () => ({}) }; });
    let asked = 0; await ctx.route(/sicherungskontoeko-hash\.github\.io\/heldenbuch\/version\.json/, (r) => { asked++; r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ version: '1.9.99', build: 4102444800 }) }); });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('Update: ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(900);
    if (await p.evaluate(() => !!window.HB_BUILD)) {
      T('PC-App: neue Version wird gemeldet, mit Link zur Download-Seite', asked > 0 && await p.evaluate(() => !!$('#pfUpd') && /Neue Version 1\.9\.99/.test($('#pfUpd').textContent) && /download\.html$/.test($('#pfUpd a').href)));
      await p.click('#pfUpd [data-pfupd="4102444800"]');
      T('«Später» merkt sich diese Version', await p.evaluate(() => !$('#pfUpd') && localStorage.getItem('hb_upd_skip') === '4102444800'));
      await p.reload(); await p.waitForTimeout(900);
      T('Dieselbe Version wird nicht nochmals gemeldet', await p.evaluate(() => !$('#pfUpd')));
    } else T('Browser-Fassung: keine Versionsmeldung nötig', await p.evaluate(() => !$('#pfUpd')));
    await ctx.close();
  }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close();
  let ok = 0; for (const r of out) { console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : ' → ' + JSON.stringify(r.got))); if (r.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
