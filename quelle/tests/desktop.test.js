/* Echte PC-App (Electron) mit Claude-Desktop-Brücke, von Anfang bis Ende:
   App starten → Empfänger läuft, Brücke liegt ausserhalb des Archivs → Claude Desktop würde die Brücke mit der App
   als Node starten (ELECTRON_RUN_AS_NODE=1) → MCP-Aufrufe erreichen das Fenster und ändern den Tisch →
   «Mit Claude Desktop verbinden» trägt den Server in claude_desktop_config.json ein.
   Braucht Electron (HB_ELECTRON=Pfad zur Electron-Datei) und unter Linux ein virtuelles Display (xvfb-run).
   Aufruf: HB_ELECTRON=/pfad/electron xvfb-run -a node tests/desktop.test.js */
const { _electron } = require('playwright');
const path = require('path'); const fs = require('fs'); const os = require('os');
const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const EL = process.env.HB_ELECTRON;
if (!EL || !fs.existsSync(EL)) { console.log('Electron nicht gefunden (HB_ELECTRON) – übersprungen.\n\n0 / 0 bestanden'); process.exit(0); }

(async () => {
  const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'hbdesk-'));
  const env = Object.assign({}, process.env, { HOME: home, XDG_CONFIG_HOME: path.join(home, '.config'), ELECTRON_DISABLE_SECURITY_WARNINGS: '1' });
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ executablePath: EL, args: [ROOT, '--no-sandbox'], env });
  const win = await app.firstWindow(); const errs = []; win.on('pageerror', (e) => errs.push(e.message));
  await win.waitForLoadState('domcontentloaded'); await win.waitForTimeout(1500);
  const ud = await app.evaluate(({ app: a }) => a.getPath('userData'));
  const info = path.join(ud, 'claude', 'bruecke.json'), bridge = path.join(ud, 'claude', 'mcp-bruecke.js');
  for (let i = 0; i < 30 && !fs.existsSync(info); i++) await new Promise((r) => setTimeout(r, 200));
  T('PC-App startet, Empfänger läuft (Info-Datei)', fs.existsSync(info), info);
  T('Brücke liegt als normale Datei neben der App (für Claude Desktop startbar)', fs.existsSync(bridge) && /tools\/list/.test(fs.readFileSync(bridge, 'utf8')));
  T('Fenster kennt die Brücke (hbDesk) und die Werkzeuge', await win.evaluate(() => !!window.hbDesk && typeof hbTool === 'function' && typeof window.require === 'undefined'));
  await win.evaluate(() => { localStorage.setItem('hb_name', 'SL'); if (S.modal === 'welcome') { S.modal = null; $('#modal').hidden = true; } const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; persist('c', s.id); XA.advOpen(null, 'krug'); S.view = 'sheet'; render(); });

  /* So startet Claude Desktop die Brücke: die App selbst als Node */
  const p = spawn(EL, [bridge, info], { env: Object.assign({}, env, { ELECTRON_RUN_AS_NODE: '1' }), stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = ''; const waits = new Map(); let id = 0; let se = '';
  p.stderr.on('data', (c) => { se += c; });
  p.stdout.setEncoding('utf8'); p.stdout.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(l); const w = waits.get(m.id); if (w) { waits.delete(m.id); w(m); } } catch (e) {} } });
  const call = (method, params) => new Promise((res, rej) => { const k = ++id; const tm = setTimeout(() => rej(new Error('Zeitüberschreitung ' + method + ' ' + se)), 30000); waits.set(k, (m) => { clearTimeout(tm); res(m); }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: k, method, params }) + '\n'); });
  const tool = async (name, args) => { const r = await call('tools/call', { name, arguments: args || {} }); return { text: r.result.content[0].text, err: r.result.isError }; };
  const ini = await call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude-ai', version: '0' } });
  T('Brücke mit der App als Node gestartet: initialize', ini.result && ini.result.serverInfo.name === 'heldenbuch', ini);
  T('tools/list: 9 Werkzeuge', ((await call('tools/list', {})).result.tools || []).length === 9);
  let r = await tool('lage');
  T('lage aus dem echten Fenster', !r.err && /Wirtshaus zum letzten Krug/.test(r.text) && /Held: /.test(r.text), r.text);
  r = await tool('buch', { typ: 'person', name: 'Brannok Hornhand', kurz: 'Schmied', stand: 'verbündet', spieler_wissen: true });
  T('buch schreibt im Fenster', !r.err && (await win.evaluate(() => kbList().some((x) => x.n === 'Brannok Hornhand' && x.frei))), r.text);
  r = await tool('wuerfeln', { ausdruck: 'W20', wofuer: 'Initiative Wirt' });
  T('wuerfeln erscheint im Würfelverlauf der App', !r.err && (await win.evaluate(() => S.log[0] && S.log[0].label === 'Initiative Wirt')), r.text);
  T('Claude-Fenster zeigt «Claude war eben da»', await win.evaluate(() => { XA.slOpen(); const b = document.querySelector('.brdesk'); return !!b && /Claude war eben da/.test(b.textContent); }));

  /* Verbinden-Knopf: Eintrag in Claude Desktop */
  const cfg = path.join(await app.evaluate(({ app: a }) => a.getPath('appData')), 'Claude', 'claude_desktop_config.json');
  fs.mkdirSync(path.dirname(cfg), { recursive: true }); fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { andere: { command: 'x' } } }));
  await win.evaluate(() => { document.querySelector('.brdesk').open = true; }); await win.click('[data-act="brConnect"]'); await win.waitForTimeout(600);
  const cj = JSON.parse(fs.readFileSync(cfg, 'utf8')); const e = cj.mcpServers.heldenbuch || {};
  T('Knopf trägt «heldenbuch» in Claude Desktop ein (App als Node, Brücke, Info-Datei)', e.command === EL || fs.realpathSync(e.command) === fs.realpathSync(EL), e);
  T('Eintrag: Brücke und Info-Datei, andere Server bleiben', e.args && e.args[0] === bridge && e.args[1] === info && e.env.ELECTRON_RUN_AS_NODE === '1' && cj.mcpServers.andere, cj);
  T('Meldung im Fenster: neu starten', await win.evaluate(() => /Starte Claude Desktop jetzt neu/.test((document.querySelector('.brdesk') || {}).textContent || '')));
  /* Genau dieser Eintrag funktioniert: Brücke so starten, wie Claude Desktop es täte */
  const p2 = spawn(e.command, e.args, { env: Object.assign({}, env, e.env), stdio: ['pipe', 'pipe', 'pipe'] }); let b2 = '';
  const res2 = await new Promise((res) => { const tm = setTimeout(() => res(null), 20000); p2.stdout.on('data', (c) => { b2 += c; if (b2.includes('\n')) { clearTimeout(tm); res(JSON.parse(b2.split('\n')[0])); } }); p2.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'c', version: '0' } } }) + '\n'); });
  T('Eingetragener Befehl startet die Brücke wirklich', res2 && res2.result && res2.result.serverInfo.name === 'heldenbuch', res2); p2.kill();
  /* Zweiter Start der App: kein zweites Fenster, Brücke bleibt bei der ersten */
  T('Nur eine Info-Datei, vom laufenden Fenster', JSON.parse(fs.readFileSync(info, 'utf8')).pid === (await app.evaluate(() => process.pid)));
  T('Keine Skriptfehler im Fenster', errs.length === 0, errs.slice(0, 3));
  p.kill(); await app.close();
  T('App beendet: Info-Datei aufgeräumt', !fs.existsSync(info));
  fs.rmSync(home, { recursive: true, force: true });
  let ok = 0; for (const x of out) { console.log((x.ok ? '✔ ' : '✘ ') + x.n + (x.ok ? '' : ' → ' + JSON.stringify(x.got).slice(0, 700))); if (x.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
