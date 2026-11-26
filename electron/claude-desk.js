/* Verbindung PC-App ↔ Claude Desktop, ohne Electron-Abhängigkeit (damit testbar):
   - startToolServer: kleiner Empfänger auf 127.0.0.1 mit Zufallsschlüssel, reicht Aufrufe an die App weiter
   - claudeConfigPaths / writeClaudeConfig: trägt «heldenbuch» in claude_desktop_config.json ein (mit Sicherungskopie) */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

function startToolServer({ exec, infoFile, timeoutMs = 15000 }) {
  const token = crypto.randomBytes(24).toString('hex');
  const server = http.createServer((req, res) => {
    const out = (code, ok, text) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok, text })); };
    if (req.method !== 'POST' || req.url !== '/tool') return out(404, false, 'Nicht gefunden');
    if (req.headers.origin) return out(403, false, 'Nicht erlaubt'); /* Webseiten im Browser dürfen nicht anklopfen */
    const t = String(req.headers['x-hb-token'] || '');
    if (t.length !== token.length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(token))) return out(401, false, 'Falscher Schlüssel');
    let body = ''; req.setEncoding('utf8');
    req.on('data', (c) => { body += c; if (body.length > 65536) { out(413, false, 'Zu gross'); req.destroy(); } });
    req.on('end', async () => {
      let m; try { m = JSON.parse(body); } catch (e) { return out(400, false, 'Ungültig'); }
      let done = false; const tm = setTimeout(() => { if (!done) { done = true; out(504, false, 'Fablecrown antwortet nicht. Ist das Fenster offen?'); } }, timeoutMs);
      try { const r = await exec(String(m.name || ''), m.args && typeof m.args === 'object' ? m.args : {}); if (!done) { done = true; clearTimeout(tm); out(200, !!r.ok, String(r.text || '')); } }
      catch (e) { if (!done) { done = true; clearTimeout(tm); out(200, false, String((e && e.message) || e)); } }
    });
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      if (infoFile) { fs.mkdirSync(path.dirname(infoFile), { recursive: true }); fs.writeFileSync(infoFile, JSON.stringify({ port, token, pid: process.pid, t: Date.now() }), { mode: 0o600 }); }
      resolve({ port, token, server, close: () => new Promise((r) => server.close(() => r())) });
    });
  });
}

/* Mögliche Orte der Claude-Desktop-Einstellungen: normaler Ordner, dazu die Store-Fassung unter Windows */
function claudeConfigPaths({ appData, localAppData, platform }) {
  const out = [path.join(appData, 'Claude', 'claude_desktop_config.json')];
  if (platform === 'win32' && localAppData) {
    try {
      const pk = path.join(localAppData, 'Packages');
      for (const d of fs.readdirSync(pk)) if (/^(Claude|AnthropicPBC\.Claude|Anthropic\.Claude)/i.test(d)) { const p = path.join(pk, d, 'LocalCache', 'Roaming', 'Claude'); if (fs.existsSync(p)) out.push(path.join(p, 'claude_desktop_config.json')); }
    } catch (e) {}
  }
  return out;
}
function makeEntry({ command, bridge, infoFile }) { return { command, args: [bridge, infoFile], env: { ELECTRON_RUN_AS_NODE: '1' } }; }
function writeClaudeConfig({ paths, entry, name = 'heldenbuch' }) {
  const snippet = JSON.stringify({ mcpServers: { [name]: entry } }, null, 2);
  const done = [], errs = []; let installed = false;
  for (const p of paths) {
    const dir = path.dirname(p); const exists = fs.existsSync(dir); if (exists) installed = true;
    if (!exists && p !== paths[0]) continue;
    try {
      let cfg = {};
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        if (raw.trim()) { try { cfg = JSON.parse(raw); } catch (e) { errs.push(p + ': Die Einstellungsdatei von Claude Desktop ist kein gültiges JSON. Nichts verändert.'); continue; } }
        const bak = p.replace(/\.json$/, '.vor-heldenbuch.json'); if (!fs.existsSync(bak)) fs.writeFileSync(bak, raw);
      }
      if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) cfg = {};
      cfg.mcpServers = cfg.mcpServers && typeof cfg.mcpServers === 'object' ? cfg.mcpServers : {};
      cfg.mcpServers[name] = entry;
      fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
      done.push(p);
    } catch (e) { errs.push(p + ': ' + ((e && e.message) || e)); }
  }
  const ok = done.length > 0;
  const msg = ok ? 'Eingetragen. Starte Claude Desktop jetzt neu (ganz beenden, auch im Infobereich). Danach im Chat zum Beispiel: «Wie ist die Lage am Tisch?»' + (installed ? '' : ' Hinweis: Claude Desktop scheint noch nicht installiert zu sein – nach der Installation einmal erneut verbinden.')
    : 'Ging nicht. ' + errs.join(' ') + ' Du kannst den Eintrag unten kopieren und in Claude Desktop unter Einstellungen › Entwickler › Konfiguration bearbeiten einfügen.';
  return { ok, msg, paths: done, errors: errs, snippet, installed };
}
module.exports = { startToolServer, claudeConfigPaths, makeEntry, writeClaudeConfig };
