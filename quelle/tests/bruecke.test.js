/* Claude-Desktop-Brücke ohne Tisch: MCP-Protokoll (initialize, tools/list, tools/call) über stdin/stdout,
   Empfänger mit Schlüssel (nur 127.0.0.1, kein Zugriff aus Webseiten), Werkzeuge gegen die echte App,
   kurze Antworten (Tokens), Verhalten bei geschlossener App, Eintrag in claude_desktop_config.json.
   Die Werkzeuge am Tisch (Gegner, Handouts, Zug) prüft sitzung.test.js.
   Aufruf: node tests/bruecke.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs'); const os = require('os'); const http = require('http');
const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const desk = require(path.join(ROOT, 'electron', 'claude-desk.js'));
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));

function mcp(infoFile) {
  const p = spawn(process.execPath, [path.join(ROOT, 'electron', 'mcp-bruecke.js'), infoFile], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = ''; const waits = new Map(); let id = 0; const extra = [];
  p.stdout.setEncoding('utf8'); p.stdout.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); const m = JSON.parse(l); const w = waits.get(m.id); if (w) { waits.delete(m.id); w(m); } else extra.push(m); } });
  const call = (method, params) => new Promise((res, rej) => { const k = ++id; const tm = setTimeout(() => rej(new Error('Zeitüberschreitung ' + method)), 25000); waits.set(k, (m) => { clearTimeout(tm); res(m); }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: k, method, params }) + '\n'); });
  const note = (method, params) => p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  const raw = (s) => p.stdin.write(s + '\n');
  return { call, note, raw, extra, kill: () => p.kill() };
}
const tool = async (c, name, args) => { const r = await c.call('tools/call', { name, arguments: args || {} }); return { text: r.result.content[0].text, err: r.result.isError }; };
const post = (port, headers, body) => new Promise((res) => { const rq = http.request({ host: '127.0.0.1', port, path: '/tool', method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, headers) }, (r) => { let d = ''; r.on('data', (x) => { d += x; }); r.on('end', () => res({ code: r.statusCode, d })); }); rq.on('error', () => res({ code: 0 })); rq.end(body); });

(async () => {
  const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got }); const errs = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hbbr-')); const infoFile = path.join(tmp, 'claude', 'bruecke.json');
  const b = await chromium.launch(); const page = await (await b.newContext()).newPage(); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + target); await page.waitForTimeout(450);
  await page.evaluate(() => { localStorage.setItem('hb_name', 'SL'); if (S.modal === 'welcome') { S.modal = null; $('#modal').hidden = true; } const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); XA.advOpen(null, 'krug'); S.view = 'sheet'; render(); });
  const exec = (name, args) => page.evaluate(async ([n, a]) => { try { return { ok: true, text: await hbTool(n, a) }; } catch (e) { return { ok: false, text: String(e.message || e) }; } }, [name, args]);
  const srv = await desk.startToolServer({ exec, infoFile });
  const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
  T('Empfänger: nur 127.0.0.1, Info-Datei mit Port und Schlüssel', info.port === srv.port && /^[0-9a-f]{48}$/.test(info.token) && srv.server.address().address === '127.0.0.1');
  if (process.platform !== 'win32') T('Info-Datei nur für den Benutzer lesbar', (fs.statSync(infoFile).mode & 0o077) === 0);
  T('Ohne Schlüssel: abgewiesen', (await post(srv.port, {}, '{"name":"lage"}')).code === 401);
  T('Falscher Schlüssel: abgewiesen', (await post(srv.port, { 'x-hb-token': 'x'.repeat(48) }, '{"name":"lage"}')).code === 401);
  T('Aufruf aus einer Webseite (Origin): abgewiesen', (await post(srv.port, { 'x-hb-token': info.token, origin: 'https://boese.example' }, '{"name":"lage"}')).code === 403);

  const c = mcp(infoFile);
  const ini = await c.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } }); c.note('notifications/initialized', {});
  T('initialize: Version ausgehandelt, Werkzeuge angeboten, Anleitung zum Tokensparen', ini.result.protocolVersion === '2025-06-18' && ini.result.capabilities.tools && /nur_neu/.test(ini.result.instructions) && ini.result.serverInfo.name === 'heldenbuch', ini.result);
  const ini2 = await c.call('initialize', { protocolVersion: '2099-01-01', capabilities: {}, clientInfo: { name: 'x', version: '1' } });
  T('Unbekannte Protokollversion: bietet eine unterstützte an', /^20\d\d-\d\d-\d\d$/.test(ini2.result.protocolVersion) && ini2.result.protocolVersion !== '2099-01-01');
  const tl = await c.call('tools/list', {}); const names = tl.result.tools.map((t) => t.name);
  T('tools/list: 8 Werkzeuge mit Schema', ['lage', 'nachschlagen', 'notieren', 'buch', 'an_spieler', 'gegner', 'naechster_zug', 'wuerfeln'].every((n) => names.includes(n)) && tl.result.tools.every((t) => t.inputSchema && t.inputSchema.type === 'object'), names);
  const defs = JSON.stringify(tl.result.tools).length;
  T('Werkzeugbeschreibungen kompakt (< 5000 Zeichen, gehen bei jeder Nachricht mit)', defs < 5000, defs);
  T('Lesende Werkzeuge als «nur lesen» markiert', tl.result.tools.filter((t) => t.annotations && t.annotations.readOnlyHint).map((t) => t.name).sort().join() === 'lage,nachschlagen');
  T('ping', !!(await c.call('ping', {})).result);
  T('Unbekannte Methode: Fehler statt Absturz', !!(await c.call('foo/bar', {})).error);
  c.raw('{kaputt'); await new Promise((r) => setTimeout(r, 150));
  T('Kaputtes JSON: Fehlermeldung, Brücke läuft weiter', c.extra.some((m) => m.error && m.error.code === -32700) && !!(await c.call('ping', {})).result);

  let r = await tool(c, 'lage');
  T('lage ohne Tisch: kurz, mit Abenteuer und Held', !r.err && /kein Tisch offen/.test(r.text) && /Wirtshaus zum letzten Krug/.test(r.text) && /Held: /.test(r.text) && r.text.length < 1200, r);
  r = await tool(c, 'lage', { nur_neu: true });
  T('lage nur_neu: «Nichts Neues» ohne Wiederholung der Übersicht', /Nichts Neues/.test(r.text) && !/Held: /.test(r.text) && r.text.length < 120, r.text);
  r = await tool(c, 'wuerfeln', { ausdruck: '2W6+3', wofuer: 'Falle' });
  T('wuerfeln 2W6+3', !r.err && /^Falle: \d+ \(/.test(r.text) && (() => { const v = +r.text.split(': ')[1].split(' ')[0]; return v >= 5 && v <= 15; })(), r.text);
  r = await tool(c, 'wuerfeln', { ausdruck: 'rm -rf /' });
  T('wuerfeln: ungültiger Ausdruck abgelehnt', r.err && /Ausdruck wie/.test(r.text));
  r = await tool(c, 'lage', { nur_neu: true });
  T('lage nur_neu zeigt den neuen Wurf', /Wurf SL: Falle/.test(r.text) && r.text.length < 300, r.text);
  r = await tool(c, 'nachschlagen', { was: 'Goblin' });
  T('nachschlagen Monster: Werteblock kurz', /Goblin/.test(r.text) && /RK \d+/.test(r.text) && /Angriffe:/.test(r.text) && r.text.length < 1200, r.text);
  r = await tool(c, 'nachschlagen', { was: 'Feuerball' });
  T('nachschlagen Zauber', /Feuerball \(Grad 3/.test(r.text), r.text.slice(0, 120));
  r = await tool(c, 'nachschlagen', { was: 'vergiftet' });
  T('nachschlagen Zustand', /^Vergiftet: /.test(r.text), r.text.slice(0, 80));
  r = await tool(c, 'buch', { typ: 'person', name: 'Prunella', kurz: 'Wirtin, neugierig', geheim: 'Kennt den Geheimgang', stand: 'verbündet' });
  T('buch: Person angelegt', !r.err && /Angelegt: Person «Prunella» \[Verbündet\]/.test(r.text), r.text);
  r = await tool(c, 'buch', { typ: 'auftrag', name: 'Die Glocke', stand: 'offen' }); r = await tool(c, 'buch', { typ: 'auftrag', name: 'die glocke', stand: 'erledigt' });
  T('buch: Auftrag nach Name gefunden und erledigt', /Geändert: Auftrag «Die Glocke» \[Erledigt\]/.test(r.text), r.text);
  r = await tool(c, 'buch', { typ: 'person', name: 'Prunella', stand: 'begeistert' });
  T('buch: ungültiger Stand nennt die gültigen', r.err && /Neutral, Verbündet, Feindlich, Tot/.test(r.text), r.text);
  r = await tool(c, 'nachschlagen', { was: 'prunella' });
  T('nachschlagen Person mit geheimer Notiz', /Geheim: Kennt den Geheimgang/.test(r.text), r.text);
  r = await tool(c, 'notieren', { text: 'Die Helden misstrauen Prunella.' });
  T('notieren: in der Chronik', !r.err && (await page.evaluate(() => chrList().some((e) => /misstrauen Prunella/.test(e.x)))), r.text);
  r = await tool(c, 'nachschlagen', { was: 'chronik' });
  T('nachschlagen chronik: letzte Einträge', /misstrauen Prunella/.test(r.text) && /Auftrag erledigt: Die Glocke/.test(r.text), r.text);
  r = await tool(c, 'gegner', { aktion: 'angriff', name: 'Goblin' });
  T('gegner ohne Tisch: klare Meldung', r.err && /Kein Tisch offen/.test(r.text), r.text);
  r = await tool(c, 'an_spieler', { text: 'Hallo' });
  T('an_spieler ohne Tisch: klare Meldung', r.err && /Kein Tisch offen/.test(r.text));
  r = await tool(c, 'lage', { voll: true });
  T('lage voll: ausführlich, ohne Rollentext', /## Abenteuer/.test(r.text) && /## Personen, Orte, Aufträge/.test(r.text) && !/Du bist Co-Spielleiter/.test(r.text), r.text.slice(0, 200));
  r = await c.call('tools/call', { name: 'gibtsnicht', arguments: {} });
  T('Unbekanntes Werkzeug: Fehler', !!r.error);
  T('Werkzeug-Aufruf aktualisiert «Claude war da»', await page.evaluate(() => S.brN >= 10 && Date.now() - S.brLast < 60000));

  await srv.close();
  r = await tool(c, 'lage');
  T('App geschlossen: freundliche Meldung statt Absturz', r.err && /nicht offen/.test(r.text), r.text);
  c.kill();
  fs.unlinkSync(infoFile); const c2 = mcp(infoFile); await c2.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  r = await tool(c2, 'lage');
  T('Ohne Info-Datei (App nie gestartet): freundliche Meldung', r.err && /Starte die PC-App/.test(r.text)); c2.kill();

  /* Eintrag in Claude Desktop */
  const ad = path.join(tmp, 'AppData'); const cfg = path.join(ad, 'Claude', 'claude_desktop_config.json');
  fs.mkdirSync(path.dirname(cfg), { recursive: true }); fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { github: { command: 'gh-mcp' } }, globalShortcut: 'Ctrl+Space' }));
  const entry = desk.makeEntry({ command: '/Apps/Heldenbuch', bridge: '/data/mcp-bruecke.js', infoFile: '/data/bruecke.json' });
  let w = desk.writeClaudeConfig({ paths: desk.claudeConfigPaths({ appData: ad, platform: 'linux' }), entry });
  const cj = JSON.parse(fs.readFileSync(cfg, 'utf8'));
  T('Claude Desktop: Eintrag «heldenbuch» ergänzt, andere bleiben', w.ok && cj.mcpServers.github.command === 'gh-mcp' && cj.globalShortcut === 'Ctrl+Space' && cj.mcpServers.heldenbuch.env.ELECTRON_RUN_AS_NODE === '1' && cj.mcpServers.heldenbuch.args[0] === '/data/mcp-bruecke.js', cj);
  T('Sicherungskopie der alten Einstellungen', fs.existsSync(cfg.replace(/\.json$/, '.vor-heldenbuch.json')) && /gh-mcp/.test(fs.readFileSync(cfg.replace(/\.json$/, '.vor-heldenbuch.json'), 'utf8')));
  w = desk.writeClaudeConfig({ paths: [cfg], entry }); T('Zweimal eintragen: kein Doppel', w.ok && Object.keys(JSON.parse(fs.readFileSync(cfg, 'utf8')).mcpServers).length === 2);
  fs.writeFileSync(cfg, '{ kaputt'); w = desk.writeClaudeConfig({ paths: [cfg], entry });
  T('Kaputte Einstellungsdatei: nichts überschrieben, Eintrag zum Kopieren', !w.ok && fs.readFileSync(cfg, 'utf8') === '{ kaputt' && /"heldenbuch"/.test(w.snippet) && /kopieren/.test(w.msg), w.msg);
  const ad2 = path.join(tmp, 'Leer'); w = desk.writeClaudeConfig({ paths: desk.claudeConfigPaths({ appData: ad2, platform: 'darwin' }), entry });
  T('Claude Desktop nicht installiert: trotzdem eingetragen, mit Hinweis', w.ok && !w.installed && /nicht installiert/.test(w.msg));
  const la = path.join(tmp, 'Local'); fs.mkdirSync(path.join(la, 'Packages', 'Claude_pzs8sxrjxfjjc', 'LocalCache', 'Roaming', 'Claude'), { recursive: true });
  const ps = desk.claudeConfigPaths({ appData: ad, localAppData: la, platform: 'win32' });
  T('Windows-Store-Fassung von Claude Desktop wird mitgefunden', ps.length === 2 && /Packages.Claude_pzs8sxrjxfjjc/.test(ps[1]), ps);

  /* Knopf im Claude-Fenster nur in der PC-App */
  T('Browser: kein Claude-Desktop-Knopf', await page.evaluate(() => { XA.slOpen(); return !document.querySelector('.brdesk'); }));
  await page.evaluate(() => { XA.closeModal ? XA.closeModal() : (S.modal = null, $('#modal').hidden = true); });
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
  let ok = 0; for (const x of out) { console.log((x.ok ? '✔ ' : '✘ ') + x.n + (x.ok ? '' : ' → ' + JSON.stringify(x.got).slice(0, 700))); if (x.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
