/* Schmale Brücke zwischen Fenster und PC-App: nur Claude-Desktop-Verbindung, sonst nichts. */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('hbDesk', {
  onTool: (cb) => { ipcRenderer.on('hb-tool', (e, m) => cb(m)); },
  reply: (id, r) => ipcRenderer.send('hb-tool-reply', { id, ok: !!(r && r.ok), text: String((r && r.text) || '') }),
  connect: () => ipcRenderer.invoke('hb-claude-connect')
});
