/* Claude als Helfer der Spielleitung: Lagebericht, Kopieren, Assistent (mit nachgebildeter sample-Fähigkeit).
   Aufruf: node tests/slhelfer.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ['clipboard-read', 'clipboard-write'] }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(450);
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; d20(3, 'Stärke-Wurf', { kind: 'check:str' }); const d = advDb(); d.last = 'krug'; advSave(d); advSetSt('krug', (st) => { st.tab = 'ch'; st.ch = 'a2'; st.flags = { zwick: 'gut' }; return st; }); S.adv = 'krug'; S.view = 'adv'; render(); });
  const L = await p.evaluate(() => slLage('Wie reagiert der Elch?'));
  T('Lage: Rolle und Sprache für Claude', /Co-Spielleiter/.test(L) && /Schweizer Rechtschreibung/.test(L));
  T('Lage: Abenteuer, Hintergrund, Szene', /Wirtshaus zum letzten Krug/.test(L) && /Hintergrund/.test(L) && /Szene: Der Eingang/.test(L) && /Vorlesetext/.test(L));
  T('Lage: Entscheidungen bisher', /Schmuddeliger Gast am Morgen: gut/.test(L));
  T('Lage: Gruppe mit TP und RK', /Brann.*TP \d+\/\d+, RK \d+/.test(L));
  T('Lage: letzte Würfe mit Details', /Letzte Würfe[\s\S]*Stärke-Wurf = \d+ \(W20/.test(L));
  T('Lage: Frage am Ende', /## Frage der Spielleitung\nWie reagiert der Elch\?$/.test(L));
  T('Lage bleibt handlich (< 9000 Zeichen)', L.length < 9000, L.length);
  T('Knopf im Abenteuer', await p.evaluate(() => !!document.querySelector('.advhead [data-act="slOpen"]')));
  await p.tap('.advhead [data-act="slOpen"]'); await p.waitForTimeout(200);
  T('Dialog ohne Claude-Anbindung: «Lage kopieren»', await p.evaluate(() => S.modal === 'slh' && !!document.querySelector('.sldlg [data-act="slCopy"]') && !document.querySelector('[data-act="slAsk"]')));
  await p.tap('.slq [data-arg="nsc"]'); await p.waitForTimeout(80);
  T('Schnellwahl füllt die Frage', await p.evaluate(() => /Nebenfigur/.test($('#slQ').value)));
  await p.tap('.sldlg [data-act="slCopy"]'); await p.waitForTimeout(250);
  const clip = await p.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return 'ERR ' + e.message; } });
  T('Kopieren legt die Lage samt Frage in die Zwischenablage', /Lage am Spieltisch/.test(clip) && /Nebenfigur/.test(clip), clip.slice(0, 80));
  /* Kampf am Tisch als Spielleitung */
  T('Lage: Kampf mit Reihenfolge und Gegner-TP', await p.evaluate(() => { UID = 'dm1'; S.camp = 'r'; S.meta = { dm: 'dm1' }; S.table = { dm1: { char: 'SL' }, u2: { char: 'Lyra', clsName: 'Magierin', level: 5, hp: 20, hpMax: 32, ac: 12, cond: ['Liegend'], init: { cid: 'k1', v: 15 } } }; S.combat = { id: 'k1', active: true, round: 2, turn: 'n:g1', npcs: [{ id: 'g1', mid: 'goblin', name: 'Goblin 1', v: 12, hp: 3, hpMax: 7, ac: 15, cond: [] }] }; const t = slLage(''); return /## Kampf · Runde 2 · am Zug: Goblin 1/.test(t) && /Goblin 1 \(Gegner\): TP 3\/7, RK 15/.test(t) && /Lyra \(Magierin 5\): TP 20\/32, RK 12, Liegend/.test(t); }));
  T('Knopf in den Werkzeugen der Spielleitung', await p.evaluate(() => /slOpen/.test(dmTools())));
  /* Direkte Anbindung (claude.ai, Fähigkeit sample) nachgebildet */
  await p.evaluate(() => { window.__calls = []; const fake = async (msgs, o) => { window.__calls.push(msgs); o.onText({ text: 'Der Elch blinzelt …' }); return { text: 'Der **Elch** blinzelt zweimal.\n\nDann frisst er den Spiegel.' }; }; window.claude = Object.assign({}, window.claude || {}, { use: async (n) => (n === 'sample' ? fake : null) }); SL_SAMPLE = null; SL_SAMPLE_ASKED = false; S.slChat = []; XA.slOpen(); });
  await p.waitForTimeout(200);
  T('Mit Anbindung: «Claude fragen» erscheint', await p.evaluate(() => !!document.querySelector('[data-act="slAsk"]')));
  await p.fill('#slQ', 'Wie reagiert der Elch auf den Spiegel?'); await p.tap('[data-act="slAsk"]'); await p.waitForTimeout(300);
  T('Antwort erscheint im Dialog (Fettschrift, Absätze)', await p.evaluate(() => { const a = [...document.querySelectorAll('.slm.a')].pop(); return !!a && /Elch/.test(a.textContent) && !!a.querySelector('b') && a.querySelectorAll('p').length >= 2; }));
  T('Claude bekam die ganze Lage', await p.evaluate(() => { const m = window.__calls[0]; return m.length === 1 && m[0].role === 'user' && /Lage am Spieltisch/.test(m[0].content) && /Spiegel/.test(m[0].content); }));
  T('Antwort als Handout teilbar (Spielleitung)', await p.evaluate(() => !!document.querySelector('.slm.a [data-act="slHo"]')));
  await p.fill('#slQ', 'Und wenn sie ihn reiten wollen?'); await p.tap('[data-act="slAsk"]'); await p.waitForTimeout(300);
  T('Folgefrage mit Gesprächsverlauf', await p.evaluate(() => { const m = window.__calls[1]; return m.length === 3 && m[1].role === 'assistant' && /reiten/.test(m[2].content); }));
  await p.evaluate(() => { saveMeta = (x) => { S.meta = Object.assign({}, S.meta, x); }; }); await p.tap('.slm.a:last-child [data-act="slHo"]'); await p.waitForTimeout(100);
  T('Handout geteilt', await p.evaluate(() => (S.meta.handouts || []).some((h) => /Elch/.test(h.text))));
  await p.evaluate(() => { const fake = async () => { throw { code: 'not_granted' }; }; SL_SAMPLE = fake; S.slChat = []; XA.slOpen(); });
  await p.fill('#slQ', 'Test'); await p.tap('[data-act="slAsk"]'); await p.waitForTimeout(200);
  T('Nicht freigegeben: Hinweis und zurück zum Kopieren', await p.evaluate(() => /nicht freigegeben/.test(document.querySelector('.slchat').textContent) && !!document.querySelector('[data-act="slCopy"]') && !document.querySelector('[data-act="slAsk"]')));
  T('kein Querscrollen', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('.sldlg').scrollWidth <= document.querySelector('.sldlg').clientWidth + 1));
  await ctx.close();
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
