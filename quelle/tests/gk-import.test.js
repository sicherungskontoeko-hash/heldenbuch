/* GK-03: Importvalidierung und Datensicherheit.
   Datei-/Textimport, Übertragungsformat, Sicherung, gespeicherter Bestand. Geprüft wird: ungültige Daten werden mit
   Feldpfad abgelehnt und verändern nichts, gültige Daten kommen vollständig an, beschädigter Bestand wird isoliert.
   Aufruf: node tests/gk-import.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 700))); };
const TABS = [['sheet', 'kampf'], ['sheet', 'werte'], ['sheet', 'zauber'], ['sheet', 'faehig'], ['sheet', 'gear'], ['sheet', 'begleiter'], ['sheet', 'notiz'], ['sheet', 'alle'], ['build'], ['heroes']];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.dismiss());
  await ctx.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
  /* Neustart = neue Seite im selben Kontext (gleicher Speicher) */
  /* Neustart = dieselbe Seite neu laden. Chromium verliert in dieser Testumgebung bei file:// gelegentlich den eben
     geschriebenen localStorage über ein Neuladen (auch auf b6d5552 und mit Profil nachgestellt, über http nie; Befund GK-N04).
     Geprüft wird hier das Verhalten der App beim Start mit einem gespeicherten Stand: Fehlt er nach dem Neuladen,
     wird genau der vorher gelesene Stand wieder eingespielt und erneut geladen (gezählt und ausgegeben). */
  let lsReset = 0;
  let q = p; const restart = async () => { const keep = await q.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    await q.reload(); await q.waitForTimeout(900);
    if (await q.evaluate((keep) => Object.keys(keep).some((k) => localStorage.getItem(k) !== keep[k]), keep)) { lsReset++; await q.evaluate((keep) => { for (const [k, v] of Object.entries(keep)) localStorage.setItem(k, v); }, keep); await q.reload(); await q.waitForTimeout(900); }
    return q; };
  /* Über einen lokalen Webserver statt file://: dort verliert Chromium den localStorage beim Neuladen nicht (GK-N04) */
  const srv = require('http').createServer((rq, rs) => { const f = path.join(path.dirname(target), decodeURIComponent(rq.url.split('?')[0])); if (!f.startsWith(path.dirname(target)) || !require('fs').existsSync(f) || require('fs').statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); } rs.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); require('fs').createReadStream(f).pipe(rs); });
  await new Promise((r) => srv.listen(8905, '127.0.0.1', r));
  await p.goto('http://127.0.0.1:8905/' + path.basename(target)); await p.waitForTimeout(700);
  await p.evaluate(() => {
    const a = sampleChar(); a.name = 'Aldric'; S.chars = { [a.id]: a }; S.cur = a.id; persist('c', a.id);
    window.__snap = () => JSON.stringify({ c: S.chars, h: S.hb, ls: Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]) });
    window.__try = (o) => { const before = __snap(); let msg = ''; try { importJson(typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) { msg = e.message; } return { msg, same: __snap() === before }; };
    window.__exp = (c) => ({ heldenbuch: 1, chars: [c], hb: [] });
  });

  /* T01 */
  let r = await p.evaluate(() => { const c = JSON.parse(JSON.stringify(sampleChar())); c.play.res = null; return __try(__exp(c)); });
  T('GK03-T01 play.res:null abgelehnt mit Feldpfad, nichts verändert (Helden, Hausregeln, Speicher)', r.same && /chars\[0\]\.play\.res: erwartet ein Objekt/.test(r.msg), r);
  /* T02 */
  r = await p.evaluate(() => { const out = {}; const cases = { slots: (c) => { c.play.slots = 'x'; }, turn: (c) => { c.play.turn = []; }, misc: (c) => { c.misc = []; }, base: (c) => { c.base = 'x'; }, multi: (c) => { c.multi = {}; }, items: (c) => { c.items = 'x'; }, comps: (c) => { c.comps = {}; },
      itemNull: (c) => { c.items = [null]; }, compNum: (c) => { c.comps = [5]; }, multiSp: (c) => { c.multi = [{ cls: 'fig', level: 2, spells: 'x' }]; }, weaponW: (c) => { c.weapons = [{ w: 5 }]; }, invQty: (c) => { c.inv = [{ n: 'Seil', qty: 'viel' }]; }, condObj: (c) => { c.play.cond = [{}]; }, dsStr: (c) => { c.play.ds = ['x', 0]; }, hpObj: (c) => { c.play.hp = {}; }, fx: (c) => { c.play.fx = 5; }, notes: (c) => { c.notes = 7; }, spellsNum: (c) => { c.spells = [1]; }, asiPlus: (c) => { c.asi = { 4: { feat: 'asi', plus: { str: 'viel' } } }; }, bgCustom: (c) => { c.bgCustom = []; } };
    for (const [k, f] of Object.entries(cases)) { const c = JSON.parse(JSON.stringify(sampleChar())); f(c); const x = __try(__exp(c)); out[k] = x.same && /chars\[0\]/.test(x.msg) ? 'ok' : x.msg || 'angenommen'; }
    return out; });
  T('GK03-T02 Falsche Typen (slots, turn, misc, base, multi, items, comps …) und ungültige Elemente abgelehnt', Object.values(r).every((v) => v === 'ok'), r);
  /* T03 */
  r = await p.evaluate(() => { const n0 = Object.keys(S.chars).length; const min = { id: 'minimal1', name: 'Minimal', cls: 'fig', level: 2 }; const x = __try(__exp(min)); const c = S.chars.minimal1;
    const old = JSON.parse(JSON.stringify(sampleChar())); old.id = 'alt1'; old.name = 'Alt'; old.base = { str: '15', dex: '10', con: '13', int: '8', wis: '12', cha: '14' }; old.play.exh = '1'; old.play.hp = null; delete old.coins; delete old.comps; const y = __try(__exp(old)); const o = S.chars.alt1;
    return { msg: x.msg + y.msg, added: Object.keys(S.chars).length - n0, play: !!c && typeof c.play.res === 'object' && Array.isArray(c.play.cond) && c.play.hp === null, misc: !!c && typeof c.misc === 'object', oldOk: !!o && o.base.str === '15' && o.play.exh === '1' && o.play.hp === null }; });
  T('GK03-T03 Fehlende optionale Altfelder → Standardwerte; hp:null und Zahlentexte aus Auswahllisten bleiben gültig', !r.msg && r.added === 2 && r.play && r.misc && r.oldOk, r);
  /* T04 */
  r = await p.evaluate(() => { const good = JSON.parse(JSON.stringify(sampleChar())); good.name = 'Gut'; const bad = JSON.parse(JSON.stringify(sampleChar())); bad.name = 'Kaputt'; bad.play.slots = null;
    const mobs0 = typeof ownMobs === 'function' ? JSON.stringify(ownMobs()) : '';
    const x = __try({ heldenbuch: 1, chars: [good, bad], hb: [{ id: 'gkhb1', kind: 'feature', name: 'Neue Hausregel', text: 'x' }], extra: { mobs: [{ id: 'gkmob', name: 'Testmonster', cr: '1', ac: 12, hp: 10 }], player: 'Neu' } });
    return Object.assign(x, { hb: !S.hb.gkhb1, mobs: (typeof ownMobs === 'function' ? JSON.stringify(ownMobs()) : '') === mobs0, gut: !Object.values(S.chars).some((c) => c.name === 'Gut') }); });
  T('GK03-T04 Ein ungültiger Held unter mehreren: keine Teilübernahme (kein Held, keine Hausregel, keine Extras)', r.same && r.hb && r.mobs && r.gut && /chars\[1\]\.play\.slots/.test(r.msg), r);
  r = await p.evaluate(() => { const c = JSON.parse(JSON.stringify(sampleChar())); c.name = 'MitExtra'; return __try({ heldenbuch: 1, chars: [c], extra: { mobs: 'x' } }); });
  T('GK03-T04 Ungültige Zusatzdaten verhindern auch den gültigen Helden', r.same && /extra\.mobs: erwartet eine Liste/.test(r.msg), r);
  /* T05 */
  r = await p.evaluate(() => {
    const hb = { id: 'gkregel', kind: 'feature', name: 'Gk-Regel', text: 'Bonus', ac: 1, save: 0, atk: 0, dc: 0, init: 0, hpPerLevel: 0, speed: 0, uses: 0, reset: 'long' }; S.hb.gkregel = hb;
    const c = normChar(newChar({ name: 'Vollständig', cls: 'wiz', level: 7, species: 'elf', cantrips: ['fire-bolt', 'light'], spells: ['magic-missile', 'shield'], book: ['magic-missile', 'shield', 'sleep'], homebrew: ['gkregel'], notes: 'Notiz «Ä» <b>', inventory: 'Rucksack', items: [{ uid: 'i1', id: Object.keys(MAGIC_ITEMS)[0], att: false, eq: true, qty: 1, w: '' }], inv: [{ n: 'Seil', qty: 2, kg: 5 }], comps: [{ t: 'custom', name: 'Eule', ac: 11, hpMax: 3, hp: 3 }], multi: [{ cls: 'fig', level: 2, order: '', land: 'temperate', cantrips: [], spells: [], arcanum: {} }] }));
    c.play.res = { x: 1 }; c.play.slots = { 1: 1 }; S.chars[c.id] = c; const text = exportData([c]); delete S.hb.gkregel; delete S.chars[c.id];
    const x = __try(text); const n = Object.values(S.chars).find((y) => y.name === 'Vollständig'); const strip = (o) => { const q = JSON.parse(JSON.stringify(o)); delete q.id; delete q.updated; return JSON.stringify(q); };
    return { msg: x.msg, same: !!n && strip(n) === strip(c), hb: !!S.hb.gkregel && S.hb.gkregel.name === 'Gk-Regel' }; });
  T('GK03-T05 Hausregel, Multiclass, Begleiter, Inventar, Notizen: Export → Import feldgleich (ohne ID/Zeitstempel)', !r.msg && r.same && r.hb, r);
  /* T06 */
  r = await p.evaluate(() => { const v1 = JSON.parse(JSON.stringify(sampleChar())); v1.v = 1; v1.id = 'version1'; v1.name = 'Version eins'; delete v1.sub; const x = __try(__exp(v1)); const c = S.chars.version1;
    const good = JSON.parse(JSON.stringify(sampleChar())); good.name = 'Gesichert'; const bad = JSON.parse(JSON.stringify(sampleChar())); bad.name = 'Defekt'; bad.play.res = null;
    localStorage.setItem('heldenbuch_backup_v1', JSON.stringify({ chars: { g: good, d: bad } })); const n0 = Object.keys(S.chars).length; XA.restoreBackup(); const log = S.log[0];
    return { msg: x.msg, v: c && c.v, sub: c && c.sub, base: c && c.base.str === v1.base.str, added: Object.keys(S.chars).length - n0, copy: Object.values(S.chars).some((y) => y.name === 'Gesichert (Sicherung)'), note: log && /Defekt/.test(log.detail) && /beschädigt/.test(log.detail) }; });
  T('GK03-T06 v1 → v2 Migration ohne Wertverlust', !r.msg && r.v === 2 && r.sub === 'devotion' && r.base, r);
  T('GK03-T06 Sicherung wiederherstellen: gültiger Held als Kopie, beschädigter genannt statt still übergangen', r.added === 1 && r.copy && r.note, r);
  /* T07 */
  r = await p.evaluate(() => { const id = S.cur; const orig = JSON.stringify(S.chars[id]); const c = JSON.parse(orig); c.name = 'Doppelgänger'; c.spells = c.spells.concat(['gibt-es-nicht']); const t0 = document.querySelectorAll('#mini .mt').length; const x = __try(__exp(c));
    const n = Object.values(S.chars).find((y) => y.name === 'Doppelgänger'); const toast = [...document.querySelectorAll('#mini .mt')].map((e) => e.textContent).join(' ');
    return { msg: x.msg, newId: !!n && n.id !== id, origSame: JSON.stringify(S.chars[id]) === orig, removed: !!n && !n.spells.includes('gibt-es-nicht'), note: /unbekannte Zauber entfernt/.test(toast) }; });
  T('GK03-T07 Kollidierende ID → neue ID, Original unverändert; unbekannter Zauber entfernt mit Hinweis', !r.msg && r.newId && r.origSame && r.removed && r.note, r);
  r = await p.evaluate(() => { const c = JSON.parse(JSON.stringify(sampleChar())); c.cls = 'constructor'; const a = __try(__exp(c)); const d = JSON.parse(JSON.stringify(sampleChar())); d.weapons = [{ w: 'toString' }]; const e = __try(__exp(d)); const f = JSON.parse(JSON.stringify(sampleChar())); f.species = 'hasOwnProperty'; const g = __try(__exp(f));
    return { a: a.same && /Unbekannte Klasse/.test(a.msg), e: e.same && /Waffe 1/.test(e.msg), g: g.same && /Unbekannte Spezies/.test(g.msg) }; });
  T('GK03-T07 Tabellenzugriffe nur auf eigene Einträge (Klasse/Waffe/Spezies «constructor», «toString» …)', r.a && r.e && r.g, r);
  /* T08 */
  r = await p.evaluate(() => { const s = JSON.stringify(sampleChar()); const out = {};
    const cases = { root: '{"heldenbuch":1,"chars":[' + s.replace(/^\{/, '{"__proto__":{"gkPol":1},') + ']}', play: '{"heldenbuch":1,"chars":[' + s.replace('"play":{', '"play":{"__proto__":{"gkPol":1},') + ']}', ctor: '{"heldenbuch":1,"chars":[' + s.replace(/^\{/, '{"constructor":{"prototype":{"gkPol":1}},') + ']}',
      hb: '{"heldenbuch":1,"chars":[' + s + '],"hb":[{"id":"x1","kind":"feature","name":"A","__proto__":{"gkPol":1}}]}', hbId: '{"heldenbuch":1,"chars":[' + s + '],"hb":[{"id":"__proto__","kind":"feature","name":"A"}]}', extra: '{"heldenbuch":1,"chars":[' + s + '],"extra":{"advSt":{"__proto__":{"gkPol":1}}}}',
      arr: '[1,2]', num: '5', str: '"x"', nul: 'null', charsObj: '{"heldenbuch":1,"chars":{}}', bad: '{"heldenbuch":1,' };
    for (const [k, t] of Object.entries(cases)) { const x = __try(t); out[k] = x.same && !!x.msg; }
    const deep = JSON.parse(s); let o = deep.zusatz = {}; for (let i = 0; i < 40; i++) o = o.a = {}; out.deep = /zu tief/.test(__try(__exp(deep)).msg);
    const big = JSON.parse(s); big.inv = Array.from({ length: 310000 }, () => 1); out.big = /zu gross/.test(__try(__exp(big)).msg);
    const many = { heldenbuch: 1, chars: Array.from({ length: 501 }, () => ({ name: 'x', cls: 'fig', level: 1 })) }; out.many = /zu viele/.test(__try(many).msg);
    out.noPol = ({}).gkPol === undefined && Object.prototype.gkPol === undefined; return out; });
  T('GK03-T08 Gefährliche Schlüssel, ungültige Wurzel-/Listen-/Objektformen, Tiefe und Grösse: abgelehnt, kein Prototyp-Eingriff', Object.values(r).every(Boolean), r);
  /* T09 */
  r = await p.evaluate(() => { const ls0 = localStorage.getItem('heldenbuch'); const set0 = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'heldenbuch') { const e = new Error('Quota exceeded'); e.name = 'QuotaExceededError'; throw e; } return set0.call(this, k, v); };
    const c = JSON.parse(JSON.stringify(sampleChar())); c.name = 'Voll'; let msg = ''; try { importJson(JSON.stringify(__exp(c))); } catch (e) { msg = e.message; } Storage.prototype.setItem = set0;
    const log = S.log[0]; const res = { msg, warn: log && /nicht gespeichert/.test(log.label), stored: localStorage.getItem('heldenbuch') === ls0, open: Object.values(S.chars).some((y) => y.name === 'Voll') }; S.saveErr = false; lsSet(); return res; });
  T('GK03-T09 Speicher voll: klare Meldung statt Erfolg, gespeicherter Stand unverändert, Held bleibt geöffnet', !r.msg && r.warn && r.stored && r.open, r);
  /* T10 */
  r = await p.evaluate(() => { const ch = cur(); const payload = { heldenbuch: 1, chars: [ch], hb: Object.values(S.hb), t: Date.now() }; const x = __try(payload); return { msg: x.msg, ddb: typeof ddbImportFile === 'function' }; });
  T('GK03-T10 Übertragungsformat (txSend) wird weiterhin angenommen; D&D-Beyond-Import siehe ddbimport.test.js', !r.msg && r.ddb, r);
  /* T11 */
  r = await p.evaluate((TABS) => { const bad = []; for (const id of Object.keys(S.chars)) { S.cur = id; for (const [v, g] of TABS) { try { S.view = v; if (g) S.mg = g; render(); } catch (e) { bad.push(S.chars[id].name + ' ' + v + ':' + (g || '') + ' ' + e.message); } } } S.view = 'heroes'; render(); return bad; }, TABS);
  T('GK03-T11 Alle importierten Helden: jeder Bogenreiter ohne Fehler', r.length === 0, r);
  const n0 = await p.evaluate(() => Object.keys(S.chars).length);
  await restart();
  r = await q.evaluate(() => ({ n: Object.keys(S.chars).length, broken: S.broken.size }));
  T('GK03-T11 Neustart: alle Helden wieder da, nichts als beschädigt markiert', r.n === n0 && r.broken === 0, { r, n0 });
  /* T12 beschädigter gespeicherter Bestand */
  await q.evaluate(() => { const raw = JSON.parse(localStorage.getItem('heldenbuch')); const good = Object.values(raw.chars)[0]; const bad = JSON.parse(JSON.stringify(good)); bad.id = 'kaputt1'; bad.name = 'Kaputtheld'; bad.play.res = null;
    raw.chars = { [good.id]: good, kaputt1: bad, leer1: null }; localStorage.setItem('heldenbuch', JSON.stringify(raw)); localStorage.setItem('gk_good', good.id); });
  await restart();
  r = await q.evaluate(() => { const good = localStorage.getItem('gk_good'); S.view = 'heroes'; render(); const box = (document.querySelector('.brokenp') || {}).textContent || '';
    S.chars[good].notes = 'nach Neustart geändert'; persist('c', good); const raw = JSON.parse(localStorage.getItem('heldenbuch'));
    return { open: !!S.chars[good] && !S.chars.kaputt1, broken: [...S.broken.keys()].sort().join(','), box: /Kaputtheld/.test(box), kept: !!raw.chars.kaputt1 && raw.chars.kaputt1.play.res === null && 'leer1' in raw.chars, saved: raw.chars[good].notes === 'nach Neustart geändert' }; });
  T('GK03-T12 Beschädigter Held isoliert und angezeigt, gültiger Held normal nutzbar', r.open && r.broken === 'kaputt1,leer1' && r.box, r);
  T('GK03-T12 Beschädigter Held bleibt beim Speichern unverändert erhalten (kein stilles Überschreiben)', r.kept && r.saved, r);
  r = await q.evaluate(async () => { XA.brokenExport(null, 'kaputt1'); await new Promise((res) => setTimeout(res, 200)); const t = ($('#exText') || {}).value || ''; S.modal = null; $('#modal').hidden = true; const exp = /Kaputtheld/.test(t);
    XA.brokenDel(null, 'kaputt1'); const raw = JSON.parse(localStorage.getItem('heldenbuch')); return { exp, gone: !raw.chars.kaputt1 && !S.broken.has('kaputt1'), other: 'leer1' in raw.chars }; });
  T('GK03-T12 Rettung: exportieren möglich, Entfernen nur auf ausdrücklichen Wunsch', r.exp && r.gone && r.other, r);
  await q.evaluate(() => { localStorage.setItem('heldenbuch', '{"v":2,"chars":{"a":'); });
  await restart();
  r = await q.evaluate(() => { const copy = localStorage.getItem('heldenbuch_defekt'); const c = sampleChar(); S.chars[c.id] = c; persist('c', c.id); return { copy: copy === '{"v":2,"chars":{"a":', still: localStorage.getItem('heldenbuch_defekt') === '{"v":2,"chars":{"a":', flag: S.lsDefekt === true }; });
  T('GK03-T12 Unlesbarer Gesamtstand: Rohtext bleibt als «heldenbuch_defekt» erhalten', r.copy && r.still && r.flag, r);
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  console.log(lsReset ? '(Hinweis: ' + lsReset + '× Speicher nach Neuladen von Chromium verloren, Stand neu eingespielt – GK-N04)' : '');
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden');
  await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
