/* Heldenbuch – PC-App (Windows, macOS, Linux). Lädt dieselbe App wie auf dem Handy.
   Dazu: Verbindung zu Claude Desktop (MCP). Ein kleiner Empfänger auf 127.0.0.1 nimmt Werkzeug-Aufrufe der Brücke
   (mcp-bruecke.js, von Claude Desktop gestartet) entgegen und reicht sie ans Fenster weiter (claudebr.js). */
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const desk = require('./claude-desk');

let win = null; let seq = 0; const pending = new Map();
const dataDir = () => path.join(app.getPath('userData'), 'claude');
const infoFile = () => path.join(dataDir(), 'bruecke.json');
const bridgeFile = () => path.join(dataDir(), 'mcp-bruecke.js');

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 600,
    backgroundColor: '#130E0A', title: 'Heldenbuch', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: true, preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  // Links (z. B. WhatsApp-Einladung) im normalen Browser öffnen
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
  win.on('closed', () => { win = null; });
}

/* Werkzeug-Aufruf ans Fenster weiterreichen und auf die Antwort warten */
function execTool(name, args) {
  return new Promise((resolve) => {
    if (!win || win.isDestroyed()) return resolve({ ok: false, text: 'Das Heldenbuch-Fenster ist zu. Öffne die PC-App.' });
    const id = ++seq; const tm = setTimeout(() => { pending.delete(id); resolve({ ok: false, text: 'Das Heldenbuch antwortet nicht.' }); }, 14000);
    pending.set(id, (r) => { clearTimeout(tm); resolve(r); });
    win.webContents.send('hb-tool', { id, name, args });
  });
}
ipcMain.on('hb-tool-reply', (e, m) => { const f = m && pending.get(m.id); if (f) { pending.delete(m.id); f({ ok: !!m.ok, text: String(m.text || '') }); } });

/* Claude Desktop eintragen: startet die Brücke mit dieser App als Node */
ipcMain.handle('hb-claude-connect', () => {
  const command = process.env.PORTABLE_EXECUTABLE_FILE || process.env.APPIMAGE || process.execPath;
  const entry = desk.makeEntry({ command, bridge: bridgeFile(), infoFile: infoFile() });
  const paths = desk.claudeConfigPaths({ appData: app.getPath('appData'), localAppData: process.env.LOCALAPPDATA, platform: process.platform });
  const r = desk.writeClaudeConfig({ paths, entry });
  if (process.env.PORTABLE_EXECUTABLE_FILE) r.msg += ' Tipp: Mit der installierten Fassung (Setup) startet die Verbindung schneller als mit der portablen.';
  return r;
});

async function startBridge() {
  try {
    fs.mkdirSync(dataDir(), { recursive: true });
    fs.writeFileSync(bridgeFile(), fs.readFileSync(path.join(__dirname, 'mcp-bruecke.js'))); /* ausserhalb des App-Archivs, damit Claude Desktop sie starten kann */
    await desk.startToolServer({ exec: execTool, infoFile: infoFile() });
  } catch (e) { console.error('Claude-Brücke nicht gestartet:', e); }
}

Menu.setApplicationMenu(null);
/* Nur ein Heldenbuch-Fenster: ein zweiter Start holt das vorhandene nach vorne (die Brücke kennt nur eine App) */
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  createWindow(); startBridge();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { try { const i = JSON.parse(fs.readFileSync(infoFile(), 'utf8')); if (i.pid === process.pid) fs.unlinkSync(infoFile()); } catch (e) {} });
