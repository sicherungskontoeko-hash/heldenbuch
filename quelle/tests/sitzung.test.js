/* Spielabend mit Abenteuer: Spielleitung (Laptop) + zwei Spieler (Handy) über einen lokalen Server.
   Handout aus dem Abenteuer, Kampf aus dem Abenteuer, Monsterangriff, Beute und Abenteuer-Gegenstand, geheime Tabellen, Claude-Lage.
   Voraussetzung: python3 build_app.py · Aufruf: node tests/sitzung.test.js */
const { chromium } = require('playwright');
const { Aedes } = require('aedes'); const http = require('http'); const wsStream = require('websocket-stream');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'app', 'www');
(async () => {
  const aedes = await Aedes.createBroker();
  const bsrv = http.createServer(); wsStream.createServer({ server: bsrv }, aedes.handle); await new Promise((r) => bsrv.listen(8894, r));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  const web = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise((r) => web.listen(8895, r));
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const done = async (code) => { out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got)))); const f = out.filter((r) => !r.ok).length + errs.length; console.log((out.length - out.filter((r) => !r.ok).length) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : '')); await b.close(); bsrv.close(); web.close(); aedes.close(); process.exit(code != null ? code : f ? 1 : 0); };
  process.on('unhandledRejection', (e) => { console.log('ABBRUCH', e.message); done(1); });
  const mk = async (name, vp, hero, m) => { const c = await b.newContext({ viewport: vp, isMobile: !!m, hasTouch: !!m }); await c.addInitScript(() => { localStorage.setItem('hb_server', 'custom'); localStorage.setItem('hb_server_url', 'ws://localhost:8894'); localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('heldenbuch_player', JSON.stringify({ name: 'Test' })); });
    const p = await c.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); await p.goto('http://localhost:8895/'); await p.waitForTimeout(900);
    await p.evaluate((h) => { S.modal = null; const md = $('#modal'); if (md) md.hidden = true; const ch = normChar(newChar(h)); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.hp = derive(ch, S.hb).hpMax; commit(false); }, hero); return { c, p }; };
  const act = (p, a, arg, ds) => p.evaluate(([a, arg, ds]) => { const t = document.createElement('button'); t.dataset.act = a; if (arg != null) t.dataset.arg = arg; Object.assign(t.dataset, ds || {}); document.body.appendChild(t); t.click(); t.remove(); }, [a, arg, ds]);
  const SL = await mk('SL', { width: 1366, height: 768 }, { name: 'Spielleitung', cls: 'fig', level: 4 });
  const B = await mk('Ilva', { width: 390, height: 844 }, { name: 'Ilva', cls: 'wiz', level: 4 }, true);
  const C = await mk('Brakk', { width: 390, height: 844 }, { name: 'Brakk', cls: 'bar', level: 4 }, true);
  const all = [SL, B, C]; const w = (ms) => SL.p.waitForTimeout(ms);
  const code = 'krug-' + Math.random().toString(36).slice(2, 8);
  await SL.p.evaluate((c) => { joinCamp(c); setTimeout(() => saveMeta({ dm: UID }), 700); }, code);
  await B.p.evaluate((c) => joinCamp(c), code); await C.p.evaluate((c) => joinCamp(c), code);
  await w(3500);
  const uid = {}; for (const [k, x] of [['SL', SL], ['B', B], ['C', C]]) uid[k] = await x.p.evaluate(() => String(UID));
  T('Drei Geräte am Tisch', (await Promise.all(all.map((x) => x.p.evaluate(() => Object.keys(S.table).length)))).every((n) => n === 3));

  /* Abenteuer öffnen, Vorlesetext als Handout */
  const path0 = await SL.p.evaluate(() => { advSetOn('krug', true); S.adv = 'krug'; advSetSt('krug', (st) => { st.tab = 'ch'; st.ch = 'prolog'; st.sc = 'prologs1'; return st; }); const d = advDb(); d.last = 'krug'; advSave(d); S.view = 'adv'; render(); const A = advGet('krug'); const ci = A.chapters.findIndex((c) => c.id === 'prolog'); const bi = A.chapters[ci].scenes[0].blocks.findIndex((b) => b.t === 'vorlese'); return ci + '.0.' + bi; });
  T('SL: Knopf «Als Handout teilen» beim Vorlesetext', await SL.p.evaluate(() => !!document.querySelector('[data-act="advHo"]')));
  await act(SL.p, 'advHo', path0); await w(1800);
  await act(SL.p, 'advScene', 'prologs1'); await w(150);
  T('Spieler bekommen das Handout (Meldung und Liste am Tisch)', (await Promise.all([B, C].map((x) => x.p.evaluate(() => { S.view = 'camp'; render(); return (S.meta.handouts || []).length === 1 && !!document.querySelector('details.ho') && /Brief|Kupfergasse|Gorm/.test(document.querySelector('details.ho').textContent); })))).every(Boolean));

  /* Geheime Würfeltabelle der SL */
  const pathR = await SL.p.evaluate(() => { const A = advGet('krug'); const ci = A.chapters.findIndex((c) => c.id === 'vor'); for (let si = 0; si < A.chapters[ci].scenes.length; si++) { const bi = A.chapters[ci].scenes[si].blocks.findIndex((b) => b.t === 'roll'); if (bi >= 0) return ci + '.' + si + '.' + bi; } return ''; });
  await act(SL.p, 'advRoll', pathR); await w(1800);
  const sec = await Promise.all([B, C].map((x) => x.p.evaluate(() => !tableRolls().some((r) => /Spontane Namen|Zwischenfälle/.test(r.label)) && !histLoad().some((h) => /Spontane Namen|Zwischenfälle/.test(h.label)))));
  T('Würfeltabelle der SL bleibt geheim (Spieler sehen sie nicht)', sec.every(Boolean) && await SL.p.evaluate(() => histLoad().some((h) => /Spontane Namen|Zwischenfälle/.test(h.label))), sec);
  T('Chronik: Handout steht drin', await SL.p.evaluate(() => chrList().some((e) => e.k === 'handout' && /Handout geteilt/.test(e.x))), await SL.p.evaluate(() => chrList()));
  T('Chronik: Spielabend-Kopf automatisch', await SL.p.evaluate(() => chrList()[0].k === 'abend'));
  T('Spieler schreiben keine Chronik', (await Promise.all([B, C].map((x) => x.p.evaluate(() => chrList().length === 0)))).every(Boolean));
  /* Ansage vom Handy (Tisch), Enter sendet */
  await B.p.evaluate(() => { S.view = 'camp'; render(); });
  T('Spieler: Ansagefeld am Tisch', await B.p.evaluate(() => !!document.querySelector('.ansbox #ansX')));
  await B.p.fill('#ansX', 'Ich verwirre den Elch mit einem Spiegel'); await B.p.press('#ansX', 'Enter'); await w(1800);
  T('SL sieht die Ansage oben in den Werkzeugen', await SL.p.evaluate(() => { S.view = 'camp'; render(); const a = document.querySelector('.ansdm'); return !!a && /Ilva/.test(a.textContent) && /Elch mit einem Spiegel/.test(a.textContent); }));
  T('Ansage steht in der Claude-Lage', await SL.p.evaluate(() => /## Ansagen der Spieler \(offen\)\n- Ilva: Ich verwirre den Elch/.test(slLage(''))));
  await SL.p.evaluate(() => document.querySelector('.ansdm [data-act="ansClaude"]').click()); await w(200);
  T('«An Claude» füllt die Frage mit den Ansagen', await SL.p.evaluate(() => S.modal === 'slh' && /Ilva: Ich verwirre den Elch/.test($('#slQ').value)));
  await SL.p.evaluate(() => { S.modal = null; $('#modal').hidden = true; document.querySelector('.ansdm [data-act="ansOk"]').click(); }); await w(1800);
  T('Erledigt: weg bei der SL, in der Chronik, beim Spieler «✓ gesehen»', await SL.p.evaluate(() => !document.querySelector('.ansdm') && chrList().some((e) => e.k === 'ansage' && /Ilva: Ich verwirre/.test(e.x))) && await B.p.evaluate(() => { render(); return /✓ gesehen/.test(document.querySelector('.ansmine').textContent); }));

  /* Kampf aus dem Abenteuer */
  const pathK = await SL.p.evaluate(() => { S.view = 'adv'; const A = advGet('krug'); for (let ci = 0; ci < A.chapters.length; ci++) for (let si = 0; si < A.chapters[ci].scenes.length; si++) { const bi = A.chapters[ci].scenes[si].blocks.findIndex((b) => b.t === 'kampf'); if (bi >= 0) { advSetSt('krug', (st) => { st.ch = A.chapters[ci].id; st.sc = A.chapters[ci].scenes[si].id; return st; }); render(); return ci + '.' + si + '.' + bi; } } return ''; });
  T('SL: Knopf «Kampf beginnen» im Abenteuer', await SL.p.evaluate(() => !!document.querySelector('[data-act="advFight"]')));
  await act(SL.p, 'advFight', pathK); await w(1800);
  await B.p.evaluate(() => setMyInit(40)); await C.p.evaluate(() => setMyInit(-5)); await w(1500);
  const ord = await Promise.all(all.map((x) => x.p.evaluate(() => order().map((o) => o.name))));
  T('Abenteuer-Gegner stehen bei allen in der Reihenfolge', ord.every((o) => o.join() === ord[0].join()) && ord[0].length >= 3 && ord[0][0] === 'Ilva', ord[0]);
  await act(SL.p, 'fightGo'); await w(1500);
  T('Chronik: Kampf beginnt mit Teilnehmern und Gegnern', await SL.p.evaluate(() => chrList().some((e) => e.k === 'kampf' && /(Ilva, Brakk|Brakk, Ilva) gegen/.test(e.x) && /Mimik|Hildegard|×/.test(e.x))), await SL.p.evaluate(() => chrList().filter((e) => e.k === 'kampf')));
  T('Brakk (nicht am Zug) sieht das Ansagefeld auf dem Bogen', await C.p.evaluate(() => { S.view = 'sheet'; S.mg = 'kampf'; render(); const a = document.querySelector('.ansbox'); return !!a && a.offsetParent !== null; }));
  T('Spieler sehen am Tisch, wer am Zug ist', (await Promise.all([B, C].map((x) => x.p.evaluate(() => { S.view = 'camp'; render(); return /Am Zug: Ilva/.test(document.querySelector('#fightBox').textContent) && !!document.querySelector('.order li.now'); })))).every(Boolean));
  /* Überdeckungen im Kampf am Tisch: SL am Laptop (Tisch, Abenteuer), Spieler am Handy (Tisch, Bogen) */
  { const { scan } = require('./overlap-lib'); const ovBad = [];
    for (const [x, nm, views] of [[SL, 'SL', ['camp', 'adv']], [B, 'Ilva', ['camp', 'sheet']], [C, 'Brakk', ['camp', 'sheet']]]) for (const v of views) {
      await x.p.evaluate((v) => { S.view = v; if (v === 'sheet') S.mg = 'kampf'; render(); window.scrollTo(0, 0); }, v); await x.p.waitForTimeout(150);
      const r = await scan(x.p, nm + ' ' + v); if (r.covered.length || r.cut.length || r.hscroll) ovBad.push(r); }
    T('Kampf am Tisch: nichts dauerhaft verdeckt oder abgeschnitten (SL-Laptop, Spieler-Handys)', !ovBad.length, ovBad.map((r) => ({ wo: r.name, v: r.covered.slice(0, 4), a: r.cut.slice(0, 3), q: r.hscroll }))); }
  /* Kampagnenbuch: SL legt Personen an, gibt eine frei; Spieler sehen nur Freigegebenes, nie die geheime Notiz */
  await SL.p.evaluate(() => { XA.chrOpen(); XA.kbTab(null, 'p');
    const add = (n, frei) => { $('#kbN').value = n; XA.kbAdd(); const x = kbList().find((y) => y.n === n); const g = document.querySelector('[data-kb="g"][data-id="' + x.id + '"]'); g.value = 'Geheim: ' + n + ' lügt'; g.dispatchEvent(new Event('input', { bubbles: true })); const d = document.querySelector('[data-kb="d"][data-id="' + x.id + '"]'); d.value = n + ' kennt den Keller'; d.dispatchEvent(new Event('change', { bubbles: true })); if (frei) { const cb = document.querySelector('[data-kb="frei"][data-id="' + x.id + '"]'); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); } };
    add('Prunella', true); add('Der Schattenmann', false); XA.closeModal ? XA.closeModal() : (S.modal = null, $('#modal').hidden = true); });
  await w(1800);
  const kbp = await Promise.all([B, C].map((x) => x.p.evaluate(() => { S.view = 'camp'; render(); const bx = document.querySelector('.kbp'); return { box: !!bx, txt: bx ? bx.textContent : '', meta: JSON.stringify(S.meta.kb || []) }; })));
  T('Spieler sehen freigegebene Person am Tisch (eingeklappt unter «Bekannt»)', kbp.every((k) => k.box && /Prunella/.test(k.txt) && /kennt den Keller/.test(k.txt)), kbp);
  T('Nicht freigegebene Person und geheime Notizen erreichen die Spieler nie', kbp.every((k) => !/Schattenmann/.test(k.txt + k.meta) && !/Geheim|lügt/.test(k.txt + k.meta)), kbp.map((k) => k.meta));
  T('Chronik der SL vermerkt die Freigabe', await SL.p.evaluate(() => chrList().some((e) => e.k === 'person' && /kennen jetzt: Prunella/.test(e.x))));
  T('Ilva sieht auf dem Bogen «dein Zug», Brakk «nicht dein Zug»', await B.p.evaluate(() => { S.view = 'sheet'; S.mg = 'kampf'; render(); return /dein Zug/.test(document.querySelector('.turnblk').textContent) && !/nicht dein Zug/.test(document.querySelector('.turnblk').textContent); }) && await C.p.evaluate(() => { S.view = 'sheet'; S.mg = 'kampf'; render(); return /nicht dein Zug/.test(document.querySelector('.turnblk').textContent); }));
  /* Ilva wirkt Feuerpfeil von der Kampfseite (Zaubertrick bei den Angriffen) */
  T('Ilva: Feuerpfeil direkt auf der Kampfseite', await B.p.evaluate(() => { const ch = cur(); if (!ch.cantrips.includes('fire-bolt')) { ch.cantrips[0] = 'fire-bolt'; commit(); } render(); return !!document.querySelector('.atkcant [data-act="castSp"]'); }));
  /* Monster greift Brakk an */
  await act(SL.p, 'nextTurn'); await w(1200);
  await SL.p.evaluate((u) => { S.npcA = { tgt: 'p:' + u }; }, uid.C);
  const npc = await SL.p.evaluate(() => { const c = S.combat; const n = c.npcs.find((x) => !x.reserve && BESTIARY[x.mid] && BESTIARY[x.mid][7].length); return n ? n.id : ''; });
  await act(SL.p, 'npcAtk', npc, { j: '0' }); await w(600);
  T('SL: Rückfrage zeigt den Monsterwurf mit Würfel', await SL.p.evaluate(() => /Angriff \d+/.test($('#prompt').textContent) && histLoad()[0] && /W20|Vorteil|Nachteil/.test(histLoad()[0].detail)));
  const hp0 = await C.p.evaluate(() => cur().play.hp);
  await SL.p.evaluate(() => { const t = document.querySelector('#prompt [data-act="npcHit"]'); t.disabled = false; t.click(); }); await w(2600);
  T('Brakk bekommt den Treffer angezeigt', await C.p.evaluate(() => /trifft Brakk/.test($('#prompt').textContent)));
  await C.p.evaluate(() => { const b = document.querySelector('#prompt [data-act="hitApply"][data-arg="1"]'); if (b) b.click(); }); await w(1800);
  const hp1 = await C.p.evaluate(() => cur().play.hp);
  T('Schaden eingetragen, SL sieht neue TP', hp1 < hp0 && await SL.p.evaluate(([u, h]) => S.table[u].hp === h, [uid.C, hp1]), [hp0, hp1]);
  T('Brakk: Monsterwurf im eigenen Würfelverlauf', await C.p.evaluate(() => histLoad().some((h) => h.oth && h.who === 'Spielleitung' || h.oth)));
  /* Claude-Lage für die SL */
  const L = await SL.p.evaluate(() => slLage('Was tut der Gegner jetzt?'));
  T('Claude-Lage: Abenteuer, Kampf, Gruppe mit aktuellen TP', /Wirtshaus zum letzten Krug/.test(L) && /## Kampf · Runde/.test(L) && new RegExp('Brakk.*TP ' + hp1 + '/').test(L) && /Ilva/.test(L), L.slice(0, 300));
  await C.p.evaluate(() => { orbPrompt(''); hpChange(cur(), 'dmg', cur().play.hp + 1); }); await w(1800);
  T('Chronik: Brakk geht zu Boden', await SL.p.evaluate(() => chrList().some((e) => e.k === 'boden' && /Brakk/.test(e.x))));
  await C.p.evaluate(() => { orbPrompt(''); hpChange(cur(), 'heal', 10); }); await w(1200);
  await act(SL.p, 'fightEnd'); await SL.p.evaluate(() => { const y = document.querySelector('.cfdlg button.btn:not(.ghost)'); if (y) y.click(); }); await w(1800);
  T('Kampf beendet überall', (await Promise.all(all.map((x) => x.p.evaluate(() => !S.combat || !S.combat.active)))).every(Boolean));
  T('Chronik: Kampfende mit Runden und Bilanz', await SL.p.evaluate(() => chrList().some((e) => e.k === 'kende' && /Kampf vorbei nach \d+ Runde/.test(e.x) && /von \d+ Gegnern besiegt/.test(e.x))), await SL.p.evaluate(() => chrList().filter((e) => e.k === 'kende')));

  /* Beute aus dem Abenteuer: Gold für alle, ein Abenteuer-Gegenstand für Ilva */
  const pathL = await SL.p.evaluate(() => { S.view = 'adv'; const A = advGet('krug'); const ci = A.chapters.findIndex((c) => c.id === 'prolog'); const bi = A.chapters[ci].scenes[0].blocks.findIndex((b) => b.t === 'loot'); advSetSt('krug', (st) => { st.ch = 'prolog'; st.sc = 'prologs1'; return st; }); render(); return ci + '.0.' + bi; });
  const gm0 = await Promise.all([B, C].map((x) => x.p.evaluate(() => +coinsOf(cur()).gm || 0)));
  await act(SL.p, 'advLoot', pathL); await w(300);
  T('Beute-Formular vorausgefüllt (Gold pro Held)', await SL.p.evaluate(() => S.view === 'camp' && +$('#gGm').value > 0 && $('#gTo').value === 'all'));
  const gmEach = await SL.p.evaluate(() => +$('#gGm').value);
  await SL.p.evaluate(() => document.querySelector('[data-act="gift"]').click()); await w(1800);
  const gm1 = await Promise.all([B, C].map((x) => x.p.evaluate(() => +coinsOf(cur()).gm || 0)));
  T('Beide Helden bekommen das Gold', gm1[0] - gm0[0] === gmEach && gm1[1] - gm0[1] === gmEach, [gm0, gm1, gmEach]);
  const key = await SL.p.evaluate(() => Object.keys(MAGIC_ITEMS).find((k) => MAGIC_ITEMS[k].adv === 'krug'));
  await act(SL.p, 'advGiveK', key); await w(300);
  await SL.p.evaluate((u) => { $('#gTo').value = u; document.querySelector('[data-act="gift"]').click(); }, uid.B); await w(1800);
  T('Ilva bekommt den Abenteuer-Gegenstand, Brakk nicht', await B.p.evaluate((k) => (cur().items || []).some((i) => i.id === k), key) && !(await C.p.evaluate((k) => (cur().items || []).some((i) => i.id === k), key)));
  T('Chronik: Beute mit Empfänger', await SL.p.evaluate(() => chrList().filter((e) => e.k === 'beute').length >= 2 && chrList().some((e) => e.k === 'beute' && /an alle: \d+ GM/.test(e.x)) && chrList().some((e) => e.k === 'beute' && /an Ilva/.test(e.x))));
  await act(SL.p, 'grpRest', 'short'); await w(1200);
  T('Chronik: Rast', await SL.p.evaluate(() => chrList().some((e) => e.k === 'rast' && /Kurze Rast/.test(e.x))));
  await C.p.evaluate(() => { const m = $('#modal'); if (m) m.hidden = true; S.modal = null; orbPrompt(''); const ch = cur(); ch.level = 5; commit(); }); await w(1800);
  T('Chronik: Stufenaufstieg', await SL.p.evaluate(() => chrList().some((e) => e.k === 'stufe' && /Brakk erreicht Stufe 5/.test(e.x))));
  await SL.p.evaluate(() => { S.view = 'adv'; render(); document.querySelector('.advhead [data-act="chrOpen"]').click(); }); await w(200);
  T('Chronik-Fenster: Einträge in Reihenfolge, Spielabend-Kopf', await SL.p.evaluate(() => S.modal === 'chronik' && document.querySelectorAll('.chr .ce').length >= 8 && !!document.querySelector('.chr .cabend')));
  await SL.p.fill('#chrN', 'Die Helden haben Prunella die Wahrheit gesagt'); await SL.p.press('#chrN', 'Enter'); await w(150);
  T('Chronik: eigene Notiz per Enter', await SL.p.evaluate(() => chrList().slice(-1)[0].k === 'notiz' && /Prunella/.test(document.querySelector('.chr').textContent)));
  const n0 = await SL.p.evaluate(() => chrList().length); await SL.p.evaluate(() => [...document.querySelectorAll('.chr .ce [data-act="chrDel"]')].pop().click()); await w(100);
  T('Chronik: Eintrag löschen', await SL.p.evaluate((n) => chrList().length === n - 1, n0));
  await SL.p.evaluate(() => document.querySelector('[data-act="chrRecap"]').click()); await w(200);
  T('«Was bisher geschah» geht mit Chronik an Claude', await SL.p.evaluate(() => S.modal === 'slh' && /Was bisher geschah/.test($('#slQ').value) && /## Chronik/.test(slLage($('#slQ').value)) && /Kampf vorbei/.test(slLage(''))));
  await SL.p.evaluate(() => { S.modal = null; $('#modal').hidden = true; });
  await SL.p.reload(); await w(1500);
  T('Chronik bleibt nach Neustart', await SL.p.evaluate(() => chrList().length >= 8));
  T('Ilvas Bogen zeigt den Gegenstand fehlerfrei', await B.p.evaluate((k) => { S.view = 'sheet'; S.mg = 'gear'; render(); return document.querySelector('.sheet').textContent.includes(MAGIC_ITEMS[k].name); }, key));
  { const qs = await Promise.all([B, C].map((x) => x.p.evaluate(() => { const bad = []; for (const v of ['camp', 'sheet']) { S.view = v; render(); if (document.documentElement.scrollWidth > innerWidth + 1) { const wide = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).slice(-3).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)); bad.push(v + ' ' + document.documentElement.scrollWidth + ' ' + wide.join(' | ')); } } return bad; })));
    T('Handy: kein Querscrollen (Tisch, Bogen) bei den Spielern', qs.every((q) => !q.length), qs); }
  T('Laptop der SL: kein Querscrollen (Tisch, Abenteuer)', await SL.p.evaluate(() => { const ok = []; for (const v of ['camp', 'adv']) { S.view = v; render(); ok.push(document.documentElement.scrollWidth <= innerWidth + 1); } return ok.every(Boolean); }));
  await done();
})();
