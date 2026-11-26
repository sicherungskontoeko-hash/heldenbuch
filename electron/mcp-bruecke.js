#!/usr/bin/env node
/* Heldenbuch-Brücke für Claude Desktop (MCP-Server über stdin/stdout, ohne Zusatzpakete).
   Claude Desktop startet diese Datei mit der Heldenbuch-App als Node (ELECTRON_RUN_AS_NODE=1).
   Sie reicht jeden Werkzeug-Aufruf an die laufende PC-App weiter (nur 127.0.0.1, mit Schlüssel aus bruecke.json).
   Aufruf: <Heldenbuch> mcp-bruecke.js <Pfad zu bruecke.json> */
'use strict';
const fs = require('fs');
const http = require('http');
const INFO = process.argv[2] || '';
const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const TOOLS = [
  { name: 'lage', title: 'Lage am Spieltisch', annotations: { readOnlyHint: true },
    description: 'Kurzübersicht: Szene, Kampf (Initiative, TP, RK, Zustände), Helden, offene Aufträge, Neues. Danach mit nur_neu=true nur Änderungen seit dem letzten Aufruf (spart Tokens). voll=true: ausführliche Lage mit Abenteuer-Hintergrund und Chronik, nur wenn nötig.',
    inputSchema: { type: 'object', properties: { nur_neu: { type: 'boolean' }, voll: { type: 'boolean' } } } },
  { name: 'nachschlagen', title: 'Nachschlagen', annotations: { readOnlyHint: true },
    description: 'Details zu einem Namen: Held, Gegner im Kampf, Monster, Person/Ort/Auftrag (mit geheimer Notiz), Zauber, Zustand. Stichworte: chronik, personen, orte, auftraege.',
    inputSchema: { type: 'object', properties: { was: { type: 'string' } }, required: ['was'] } },
  { name: 'notieren', title: 'In die Chronik schreiben', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Schreibt eine kurze Notiz in die Chronik.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'buch', title: 'Person, Ort oder Auftrag', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Legt Person/Ort/Auftrag an oder ändert ihn (nach Name). stand: Person neutral|verbündet|feindlich|tot, Ort nicht besucht|besucht, Auftrag offen|erledigt|gescheitert. spieler_wissen=true zeigt Name, kurz und Stand den Spielern, geheim nie.',
    inputSchema: { type: 'object', properties: { typ: { type: 'string', enum: ['person', 'ort', 'auftrag'] }, name: { type: 'string' }, kurz: { type: 'string' }, geheim: { type: 'string' }, stand: { type: 'string' }, spieler_wissen: { type: 'boolean' } }, required: ['typ', 'name'] } },
  { name: 'an_spieler', title: 'Handout an die Spieler', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Schickt allen Spielern einen Text als Handout. Nur was hier geschickt wird, sehen die Spieler.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, titel: { type: 'string' } }, required: ['text'] } },
  { name: 'gegner', title: 'Gegner im Kampf', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Laufender Kampf. aktion=hinzufuegen (Monster aus dem Bestiarium, anzahl), angriff (würfelt gegen ziel; Treffer bekommt der Held zum Eintragen), schaden/heilen (wert), zustand (zustand, entfernen).',
    inputSchema: { type: 'object', properties: { aktion: { type: 'string', enum: ['hinzufuegen', 'angriff', 'schaden', 'heilen', 'zustand'] }, name: { type: 'string' }, anzahl: { type: 'integer' }, angriff: { type: 'string' }, ziel: { type: 'string' }, vorteil: { type: 'string', enum: ['normal', 'vorteil', 'nachteil'] }, wert: { type: 'integer' }, zustand: { type: 'string' }, entfernen: { type: 'boolean' } }, required: ['aktion', 'name'] } },
  { name: 'naechster_zug', title: 'Nächster Zug', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Beendet den aktuellen Zug, nennt den nächsten in der Initiative.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'abend_abschliessen', title: 'Spielabend abschliessen', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Am Ende des Abends: speichert zusammenfassung (was geschah, wo die Helden stehen, offene Fäden, Haltung wichtiger Figuren, Beute; höchstens 250 Wörter) und gesamt (nachgeführte Zusammenfassung der ganzen Kampagne, höchstens 300 Wörter). Ein neuer Chat liest das mit lage. fuer_spieler: optional ohne Geheimnisse, geht als Handout an alle.',
    inputSchema: { type: 'object', properties: { zusammenfassung: { type: 'string' }, gesamt: { type: 'string' }, titel: { type: 'string' }, fuer_spieler: { type: 'string' } }, required: ['zusammenfassung'] } },
  { name: 'wuerfeln', title: 'Würfeln', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Würfelt für die Spielleitung, z. B. W20 oder 2W6+3. verdeckt=true: Spieler sehen es nicht.',
    inputSchema: { type: 'object', properties: { ausdruck: { type: 'string' }, wofuer: { type: 'string' }, verdeckt: { type: 'boolean' } }, required: ['ausdruck'] } }
];
const INSTRUCTIONS = 'Fablecrown (bisher Heldenbuch): D&D-Tisch (Regeln 2024) der Spielleitung. Tokens sparen: zuerst lage (beginnt mit dem Spielstand), danach lage mit nur_neu=true; voll und nachschlagen nur bei Bedarf. Am Ende des Abends abend_abschliessen. ' +
  'Antworte kurz auf Deutsch (Schweiz, ss statt ß). Die Spieler sehen nur Handouts (an_spieler) und geteilte Würfe. Ändere nur, worum die Spielleitung bittet.';

function readInfo() { try { return JSON.parse(fs.readFileSync(INFO, 'utf8')); } catch (e) { return null; } }
function callApp(name, args) {
  return new Promise((resolve) => {
    const info = readInfo();
    if (!info || !info.port || !info.token) return resolve({ ok: false, text: 'Fablecrown ist nicht offen. Starte die PC-App von Fablecrown und öffne den Tisch.' });
    const body = JSON.stringify({ name, args: args || {} });
    const req = http.request({ host: '127.0.0.1', port: info.port, path: '/tool', method: 'POST', timeout: 20000, headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'x-hb-token': info.token } }, (res) => {
      let d = ''; res.setEncoding('utf8'); res.on('data', (c) => { d += c; if (d.length > 200000) req.destroy(); });
      res.on('end', () => { try { const j = JSON.parse(d); resolve({ ok: !!j.ok, text: String(j.text || '') }); } catch (e) { resolve({ ok: false, text: 'Unerwartete Antwort von Fablecrown (' + res.statusCode + ').' }); } });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, text: 'Fablecrown antwortet nicht. Ist das Fenster offen?' }); });
    req.on('error', () => resolve({ ok: false, text: 'Fablecrown ist nicht offen. Starte die PC-App von Fablecrown und öffne den Tisch.' }));
    req.end(body);
  });
}
const send = (msg) => { process.stdout.write(JSON.stringify(msg) + '\n'); };
async function handle(m) {
  if (!m || typeof m !== 'object') return;
  const { id, method } = m; const has = id !== undefined && id !== null;
  try {
    if (method === 'initialize') {
      const want = m.params && m.params.protocolVersion; const v = VERSIONS.includes(want) ? want : VERSIONS[1];
      return send({ jsonrpc: '2.0', id, result: { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'heldenbuch', title: 'Fablecrown', version: '1.9' }, instructions: INSTRUCTIONS } });
    }
    if (method === 'ping') return has && send({ jsonrpc: '2.0', id, result: {} });
    if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    if (method === 'tools/call') {
      const name = m.params && m.params.name; if (!TOOLS.some((t) => t.name === name)) return send({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Unbekanntes Werkzeug: ' + name } });
      const r = await callApp(name, (m.params && m.params.arguments) || {});
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: r.text }], isError: !r.ok } });
    }
    if (method === 'resources/list') return send({ jsonrpc: '2.0', id, result: { resources: [] } });
    if (method === 'prompts/list') return send({ jsonrpc: '2.0', id, result: { prompts: [] } });
    if (has) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Methode nicht unterstützt: ' + method } });
  } catch (e) { if (has) send({ jsonrpc: '2.0', id, error: { code: -32603, message: String((e && e.message) || e) } }); }
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => {
  buf += c; let i;
  while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue; let m; try { m = JSON.parse(line); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Ungültiges JSON' } }); continue; } if (Array.isArray(m)) m.forEach(handle); else handle(m); }
});
process.stdin.on('end', () => process.exit(0));
