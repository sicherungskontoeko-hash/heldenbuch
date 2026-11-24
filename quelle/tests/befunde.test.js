/* Befunde B-01–B-20 aus dem unabhängigen Grosstest v1.9.40: jede Korrektur mit einer Gegenprobe.
   Speicherung (B-01, B-02, B-06, B-07, B-08) in der App-Fassung mit Gerätedatenbank, Rest in index.html.
   Braucht app/www (python3 build_app.py). Aufruf: node tests/befunde.test.js */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const files = { '/app.html': path.join(ROOT, 'app', 'www', 'index.html'), '/index.html': path.join(ROOT, 'index.html') };
const out = []; const errs = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
const srv = () => new Promise((res) => { const s = http.createServer((q, r) => { const f = files[q.url.split('?')[0]]; if (!f) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(fs.readFileSync(f)); }); s.listen(8841, () => res(s)); });
const HELD = (o) => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_sample_done', '1'); const n = normChar(newChar(o)); S.chars[n.id] = n; S.cur = n.id; persist('c', n.id); return n.id; };
/* «Absturz» vor dem verzögerten Schreiben: ausstehende Timer verwerfen statt ausführen */
const KILL = () => { for (const k of Object.keys(LATER)) { clearTimeout(timers[k]); delete LATER[k]; } };

(async () => {
  const s = await srv(); const b = await chromium.launch();
  const page = async (ctx, url) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(url + ': ' + e.message)); await p.goto('http://127.0.0.1:8841' + url); await p.waitForFunction(() => typeof S === 'object' && document.querySelector('#view *'), null, { timeout: 15000 }); await p.waitForTimeout(400); return p; };

  /* ---------- B-01: Neustart vor dem verzögerten Schreiben ---------- */
  {
    const ctx = await b.newContext(); const p = await page(ctx, '/app.html');
    const id = await p.evaluate(HELD, { name: 'Alt', cls: 'fig', level: 3 }); await p.waitForTimeout(1200);
    const dbKey = await p.evaluate((i) => 'hbdb:data/users/' + UID + '/c_' + i, id);
    T('B-01 Vorbereitung: Gerätedatenbank kennt «Alt»', await p.evaluate((k) => /"Alt"|\\"Alt\\"/.test(localStorage.getItem(k) || ''), dbKey));
    await p.evaluate(KILL);
    await p.evaluate(() => { cur().name = 'Neu'; commit(); }); await p.evaluate(KILL);
    T('B-01: lokaler Gesamtstand sofort «Neu», Einzelkopie noch «Alt», ausstehend markiert', await p.evaluate(([i, k]) => JSON.parse(localStorage.getItem('heldenbuch')).chars[i].name === 'Neu' && /Alt/.test(localStorage.getItem(k)) && !!localStorage.getItem('hb_pend:c_' + i), [id, dbKey]));
    await p.reload(); await p.waitForFunction(() => typeof S === 'object' && S.store === 'db', null, { timeout: 15000 }); await p.waitForTimeout(300);
    T('B-01: nach Neustart heisst der Held «Neu» (nicht wieder «Alt»)', await p.evaluate((i) => S.chars[i] && S.chars[i].name === 'Neu', id), await p.evaluate((i) => S.chars[i] && S.chars[i].name, id));
    await p.waitForTimeout(1200);
    T('B-01: Einzelkopie nachgezogen, Markierung gelöscht', await p.evaluate(([i, k]) => /Neu/.test(localStorage.getItem(k)) && !localStorage.getItem('hb_pend:c_' + i), [id, dbKey]));
    /* Löschung vor dem Schreiben */
    await p.evaluate((i) => { delete S.chars[i]; persist('c', i); }, id); await p.evaluate(KILL);
    await p.reload(); await p.waitForFunction(() => typeof S === 'object' && S.store === 'db', null, { timeout: 15000 }); await p.waitForTimeout(1300);
    T('B-01: gelöschter Held bleibt nach Neustart gelöscht', await p.evaluate(([i, k]) => !S.chars[i] && !localStorage.getItem(k), [id, dbKey]));
    /* Ein anderes Gerät hat einen neueren Stand in die Kopie geschrieben, hier steht noch der alte (nicht ausstehend) */
    const id2 = await p.evaluate(HELD, { name: 'Bera', cls: 'rog', level: 2 }); await p.waitForTimeout(1200);
    await p.evaluate(([i]) => { const k = 'hbdb:data/users/' + UID + '/c_' + i; const o = JSON.parse(JSON.parse(localStorage.getItem(k)).json); o.name = 'Bera (anderes Gerät)'; o.updated = Date.now() + 5000; localStorage.setItem(k, JSON.stringify({ kind: 'c', json: JSON.stringify(o) })); }, [id2]);
    await p.reload(); await p.waitForFunction(() => typeof S === 'object' && S.store === 'db', null, { timeout: 15000 }); await p.waitForTimeout(300);
    T('B-01: neuerer Stand aus der Kopie wird übernommen', await p.evaluate((i) => S.chars[i] && S.chars[i].name === 'Bera (anderes Gerät)', id2));

    /* ---------- B-02: Speicher voll ---------- */
    await p.evaluate(() => { window.__set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'heldenbuch' || String(k).startsWith('hbdb:')) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } return window.__set.call(this, k, v); }; cur().name = 'Voll'; commit(); });
    await p.waitForTimeout(1200);
    T('B-02: bei vollem Speicher keine Erfolgsmeldung, Warnung sichtbar', await p.evaluate(() => /Nicht gespeichert/.test($('#saveState').textContent) && S.saveErr), await p.evaluate(() => $('#saveState').textContent));
    await p.evaluate(() => { Storage.prototype.setItem = window.__set; cur().name = 'Wieder da'; commit(); }); await p.waitForTimeout(1200);
    T('B-02: nach freiem Speicher wieder «Gespeichert»', await p.evaluate(() => /Gespeichert/.test($('#saveState').textContent) && !S.saveErr), await p.evaluate(() => $('#saveState').textContent));

    /* ---------- B-08: SL-Notiz bleibt beim Raum ---------- */
    await p.evaluate(() => { S.camp = 'raum-a'; dmNoteSet('Notiz für A'); S.camp = 'raum-b'; }); await p.waitForTimeout(1100);
    T('B-08: verspätete Notiz landet bei Raum A, nicht bei B', await p.evaluate(() => { const a = localStorage.getItem('hbdb:data/users/' + UID + '/n_raum-a'), bb = localStorage.getItem('hbdb:data/users/' + UID + '/n_raum-b'); return !!a && /Notiz für A/.test(a) && !bb; }));
    await p.evaluate(() => { S.camp = ''; });
    await ctx.close();
  }

  /* ---------- B-06: zwei Tabs ---------- */
  {
    const ctx = await b.newContext(); const p1 = await page(ctx, '/index.html');
    const [ida, idb] = await p1.evaluate((H) => { const h = eval('(' + H + ')'); return [h({ name: 'A0', cls: 'fig', level: 1 }), h({ name: 'B0', cls: 'wiz', level: 1 })]; }, HELD.toString());
    const p2 = await page(ctx, '/index.html');
    T('B-06 Vorbereitung: zweiter Tab sieht A0 und B0', await p2.evaluate(([a, bb]) => S.chars[a].name === 'A0' && S.chars[bb].name === 'B0', [ida, idb]));
    await p2.evaluate(() => window.removeEventListener('storage', lsExternal)); /* zweiter Tab mit veralteter Ansicht */
    /* Kurze Pausen wie zwischen zwei echten Eingaben: Safari gleicht den Speicher zwischen Tabs verzögert ab */
    await p1.evaluate((a) => { S.chars[a].name = 'A1'; persist('c', a); }, ida); await p1.waitForTimeout(300);
    await p2.evaluate((bb) => { S.chars[bb].name = 'B1'; persist('c', bb); }, idb); await p2.waitForTimeout(300);
    T('B-06: Gesamtstand enthält A1 und B1 (keine Änderung überschrieben)', await p1.evaluate(([a, bb]) => { const d = JSON.parse(localStorage.getItem('heldenbuch')); return d.chars[a].name === 'A1' && d.chars[bb].name === 'B1'; }, [ida, idb]), await p1.evaluate(() => Object.values(JSON.parse(localStorage.getItem('heldenbuch')).chars).map((c) => c.name)));
    await p2.evaluate(() => window.addEventListener('storage', lsExternal));
    await p1.evaluate((a) => { S.chars[a].name = 'A2'; persist('c', a); }, ida); await p2.waitForTimeout(300);
    T('B-06: der andere Tab übernimmt die Änderung live', await p2.evaluate((a) => S.chars[a].name === 'A2', ida));
    await p1.evaluate((a) => { delete S.chars[a]; persist('c', a); }, ida); await p2.waitForTimeout(300);
    T('B-06: Löschung kommt im anderen Tab an', await p2.evaluate((a) => !S.chars[a], ida));

    /* ---------- B-07: Import erst prüfen, dann übernehmen ---------- */
    const r = await p1.evaluate(() => { const before = JSON.stringify(S.hb); const ok = { id: 'hgut', kind: 'feature', name: 'Gute Regel', text: '' }; const c0 = normChar(newChar({ name: 'Import', cls: 'fig' }));
      let msg = ''; try { importJson(JSON.stringify({ heldenbuch: 1, chars: [c0], hb: [ok, {}] })); } catch (e) { msg = e.message; }
      return { msg, same: JSON.stringify(S.hb) === before && !JSON.parse(localStorage.getItem('heldenbuch')).hb.hgut, noHero: !Object.values(S.chars).some((c) => c.name === 'Import') }; });
    T('B-07: fehlerhafte Hausregel → Import bricht ab, nichts übernommen', r.msg && /Hausregel 2/.test(r.msg) && r.same && r.noHero, r);
    T('B-07: fremde Helden-Kennung wird ersetzt', await p1.evaluate(() => { const c0 = normChar(newChar({ name: 'Kennung', cls: 'fig' })); c0.id = 'x"><b>'; importJson(JSON.stringify({ heldenbuch: 1, chars: [c0] })); const c = Object.values(S.chars).find((x) => x.name === 'Kennung'); return c && /^[A-Za-z0-9_-]+$/.test(c.id); }));
    await ctx.close();
  }

  /* ---------- Sicherheit und Regeln in index.html ---------- */
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await page(ctx, '/index.html');
  await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); window.__x = 0; });
  /* B-03 */
  T('B-03: eigener Unterklassenname wird im Bogen maskiert', await p.evaluate(() => { const n = normChar(newChar({ name: 'Mask', cls: 'fig', level: 3, sub: 'eigen', subName: '<img src=x onerror="window.__x=1">' })); S.chars[n.id] = n; S.cur = n.id; S.view = 'sheet'; render();
    return !document.querySelector('#view .shead img, .summary img[src="x"]') && /&lt;img/.test($('#view').innerHTML) && window.__x === 0; }));
  T('B-03: Porträt nur als echtes Rasterbild', await p.evaluate(() => { const bad = sigil({ name: 'X', cls: 'fig', portrait: 'img', portraitImg: 'x);background:url(https://example.org/a' }); const ok = sigil({ name: 'X', cls: 'fig', portrait: 'img', portraitImg: 'data:image/png;base64,iVBORw0KGgo=' });
    const odd = sigil({ name: 'X', cls: '__proto__', portrait: { a: 1 } }); return !/example\.org/.test(bad) && /background-image/.test(ok) && /class="sigil/.test(odd); }));
  T('B-03: Aktions-Kennungen werden maskiert (Hausregel-Liste)', await p.evaluate(() => { S.hb['a"b'] = { id: 'a"b', kind: 'feature', name: 'Test', text: '' }; S.view = 'hb'; render(); const ok = [...document.querySelectorAll('#view [data-arg]')].some((e) => e.dataset.arg === 'a"b') && !document.querySelector('#view [data-arg="a"]'); delete S.hb['a"b']; S.view = 'heroes'; render(); return ok; }));
  T('B-03/B-19: Abenteuer mit Kapitel-Kennung voller HTML wird abgelehnt', await p.evaluate(() => { const a = JSON.parse(JSON.stringify(ADV_KRUG)); a.id = 'krug-test'; a.chapters[0].id = 'x"><img src=x>'; return advImport([a]) === 0 && /Kapitel 1/.test(advImport.errs[0]); }));
  /* B-19 */
  T('B-19: Block ohne Pflichtfelder → Fehler mit Kapitel und Szene', await p.evaluate(() => { const a = JSON.parse(JSON.stringify(ADV_KRUG)); a.id = 'krug-test2'; a.chapters[1].scenes[0].blocks.push({ t: 'table', head: ['a'] }); const e = advCheck(a); return /^Kapitel 2 .*Szene 1 .*Block „table“/.test(e); }));
  T('B-19: eingebaute Abenteuer bestehen die Prüfung', await p.evaluate(() => ADV_BUILTIN.every((a) => advCheck(a) === '')));
  /* B-20 */
  T('B-20: unlesbare Spielerdokumente werden bereinigt statt die Liste zu blockieren', await p.evaluate(() => { const v = playerDoc({ char: { x: 1 }, rolls: 'kaputt', pimg: 'data:text/html;base64,PHNjcmlwdD4=', hp: 'viel', cond: 'x' }); return v && v.char === '?' && Array.isArray(v.rolls) && v.rolls.length === 0 && v.pimg === '' && v.hp === undefined && v.cond === undefined && playerDoc('text') === null && playerDoc([1]) === null; }));
  T('B-20: zu grosse oder unverschlüsselte Nachrichten werden verworfen', await p.evaluate(async () => typeof hbOpen !== 'function' || ((await hbOpen(null, 'x'.repeat(3e6 + 10))) === null && (await hbOpen(null, '{"a":1}')) === null)));
  /* B-05 */
  T('B-05: Hinweis beschreibt «nur bei der SL» ehrlich', await p.evaluate(() => { S.share = true; S.secret = true; const h = SECRET_NOTE(); S.secret = false; return /mit eigener Technik/.test(h) && SECRET_NOTE() === ''; }));

  /* Regeln: Würfel auf 1 fixiert (Math.random = 0) */
  const dmg = (setup, pick, dp) => p.evaluate(([setup, pick, dp]) => {
    Math.random = () => 0; const ch = normChar(newChar(setup)); S.chars[ch.id] = ch; S.cur = ch.id; Object.assign(ch.play, setup.play || {});
    const c = derive(ch, S.hb); const i = c.attacks.findIndex((a) => new RegExp(pick).test(a.name)); if (i < 0) return { err: 'kein Angriff ' + pick, names: c.attacks.map((a) => a.name) };
    S.dp = Object.assign({ i, crit: false, two: false, sneak: false, off: false, cleave: false, savage: false, xd: [], mode: 'normal', nat: 15, total: 20 }, dp); const n0 = S.log.length; dmgRoll(ch);
    const e = S.log[0]; Math.random = NATIVE_RANDOM; return { total: e.total, detail: e.detail, label: e.label, n: S.log.length - n0, mod: c.mod, i }; }, [setup, pick, dp]);
  /* B-09 */
  T('B-09: Wolf-Tiergestalt gepackt → 0 m', await p.evaluate(() => { const ch = normChar(newChar({ name: 'Druide', cls: 'dru', level: 5 })); ch.play.ws = 'wolf'; ch.play.cond = ['grappled']; return derive(ch, S.hb).speed === 0; }));
  T('B-09: Wolf-Tiergestalt mit Erschöpfung 2 → 9 m', await p.evaluate(() => { const ch = normChar(newChar({ name: 'Druide', cls: 'dru', level: 5 })); ch.play.ws = 'wolf'; ch.play.exh = 2; const c = derive(ch, S.hb); return c.speed === 9 && /Erschöpfung/.test(c.speedParts.join(' ')); }));
  /* B-10 */
  const rogue = { name: 'Schurkin', cls: 'rog', level: 5, base: { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 }, weapons: [{ w: 'handaxe' }, { w: 'dagger' }] };
  const hx = await dmg(rogue, 'Handaxt \\(geworfen\\)', { sneak: true, mode: 'adv' });
  T('B-10: geworfene Handaxt ohne Hinterhältigen Angriff (1 + STÄ-Mod)', hx.total === 1 + hx.mod.str && !/Hinterh/.test(hx.detail), hx);
  const dg = await dmg(rogue, 'Dolch \\(geworfen\\)', { sneak: true, mode: 'adv' });
  T('B-10: geworfener Dolch (Finesse) mit Hinterhältigem Angriff', /Hinterh/.test(dg.detail), dg);
  /* B-11 */
  const ua = await dmg({ name: 'Barbar', cls: 'bar', level: 1, base: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 }, play: { raging: true } }, '^Waffenloser Schlag', {});
  T('B-11: waffenloser STÄ-Schlag im Kampfrausch 1 + STÄ-Mod + 2', ua.total === 1 + ua.mod.str + 2, ua);
  /* B-12 */
  const off = await dmg({ name: 'Zweihand', cls: 'fig', level: 1, base: { str: 10, dex: 16, con: 12, int: 10, wis: 10, cha: 10 }, weapons: [{ w: 'dagger', bonus: 1 }, { w: 'dagger' }] }, '^Dolch \\+1$', { off: true });
  T('B-12: Zusatzangriff mit Dolch +1: 1W4 + 1 = 2 (magischer Bonus bleibt)', off.total === 2, off);
  /* B-13 */
  const df = await dmg({ name: 'Paladin', cls: 'pal', level: 2, base: { str: 16, dex: 10, con: 12, int: 8, wis: 10, cha: 14 }, weapons: [{ w: 'longsword' }], play: { fx: { df: true } } }, '^Waffenloser Schlag', {});
  T('B-13: Göttliche Gunst nicht beim Faustschlag', !/Göttliche Gunst/.test(df.detail), df);
  const dfw = await dmg({ name: 'Paladin', cls: 'pal', level: 2, base: { str: 16, dex: 10, con: 12, int: 8, wis: 10, cha: 14 }, weapons: [{ w: 'longsword' }], play: { fx: { df: true } } }, '^Langschwert', {});
  T('B-13: Göttliche Gunst beim Waffentreffer', /Göttliche Gunst/.test(dfw.detail), dfw);
  /* B-15 */
  const sh = await dmg({ name: 'Schild', cls: 'fig', level: 1, shield: true, weapons: [{ w: 'longsword' }] }, '^Langschwert', { two: true });
  T('B-15: Langschwert mit Schild bleibt einhändig (1W8)', /1W8|W8/.test(sh.detail) && !/W10/.test(sh.detail), sh);
  T('B-15: Zweihand-Option mit Schild gesperrt', await p.evaluate((i) => { S.dp = { i, crit: false, two: true, xd: [], mode: 'normal', nat: 12, total: 18 }; renderDmgPrompt(); const bt = document.querySelector('#prompt [data-act="dpT"][data-arg="two"]'); const ok = bt && bt.disabled && /nicht mit Schild/.test(bt.textContent); orbPrompt(''); S.dp = null; return ok; }, sh.i));
  /* B-14 */
  const orb = (r) => p.evaluate(async (r) => { const ch = normChar(newChar({ name: 'Magier', cls: 'wiz', level: 1 })); S.chars[ch.id] = ch; S.cur = ch.id; S.orb = { lvl: 1, n: 3, max: 1, i: 0, used: '', conc: '' };
    Math.random = () => r; orbAttack(); const btn = document.querySelector('#prompt [data-act="orbHit"]'); const dis = !!(btn && btn.disabled); let total = null, label = '';
    if (!dis) { Math.random = () => 0.5; orbHit(); const e = S.log[0]; total = e.total; label = e.label; } Math.random = NATIVE_RANDOM; orbPrompt(''); S.orb = null; return { dis, total, label }; }, r);
  const o1 = await orb(0);
  T('B-14: Chromatische Kugel – natürliche 1 sperrt «Treffer»', o1.dis, o1);
  const o20 = await orb(0.99);
  T('B-14: Chromatische Kugel – kritisch würfelt 6W8 (6 × 5 = 30)', !o20.dis && o20.total === 30 && /kritisch/.test(o20.label), o20);
  /* Herkunftstalent fest am Hintergrund (D&D 2024), frei nur als Hausregel */
  const hk = await p.evaluate(() => { localStorage.removeItem('hb_rules'); S.rules = null; const ch = normChar(newChar({ name: 'Herkunft', cls: 'fig', bg: 'soldier' })); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'build'; S.step = 1; render();
    const a = { fest: !document.querySelector('#view select[data-bind="bgFeat"]') && /Wilder Angreifer|Grausamer|Angreifer/.test((document.querySelector('#view .fld .fixed') || {}).textContent || '') };
    ch.bgFeat = 'alert'; render(); a.tausch = !!document.querySelector('#view [data-act="bgFeatReset"]') && derive(ch, S.hb).warn.some((w) => /Herkunftstalent weicht/.test(w));
    document.querySelector('#view [data-act="bgFeatReset"]').click(); a.zurueck = !ch.bgFeat && derive(ch, S.hb).feats.some((f) => f.id === BACKGROUNDS.soldier.feat);
    XA.ruleT(null, 'bgfeat'); S.view = 'build'; S.step = 1; render(); a.frei = !!document.querySelector('#view select[data-bind="bgFeat"]'); ch.bgFeat = 'alert'; a.ohneWarnung = !derive(ch, S.hb).warn.some((w) => /Herkunftstalent weicht/.test(w));
    XA.ruleT(null, 'bgfeat'); return a; });
  T('Herkunftstalent: fest zum Hintergrund, ohne Auswahl', hk.fest, hk);
  T('… abweichendes Talent: Hinweis und «Zurücksetzen»', hk.tausch && hk.zurueck, hk);
  T('… als Hausregel frei wählbar, dann ohne Warnung', hk.frei && hk.ohneWarnung, hk);
  /* B-16, B-17 */
  T('B-16: Bebende Handfläche kostet 4 Fokuspunkte, waffenloser Treffer', await p.evaluate(() => { const f = (CLASSES.mon.subFeats || []).find((x) => x[1] === 'Bebende Handfläche'); return f && /4 Fokuspunkte/.test(f[2]) && /waffenlosen Schlag/.test(f[2]); }));
  T('B-17: Schlaf nennt Aufwecken und automatische Rettung', await p.evaluate(() => { const s = getSpell('sleep'); const t = JSON.stringify(s); return /wachrüttelt/.test(t) && /Erschöpfung immun/.test(t); }));
  await ctx.close();

  await b.close(); s.close();
  if (errs.length) T('Keine Skriptfehler', false, errs.slice(0, 5)); else T('Keine Skriptfehler', true);
  let ok = 0; for (const r of out) { console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); if (r.ok) ok++; }
  console.log(ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
