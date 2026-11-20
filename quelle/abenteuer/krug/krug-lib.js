/* Bausteine für das Abenteuer „Das Wirtshaus zum letzten Krug“ – erzeugen die Blöcke der Abenteuer-Ansicht (adventure.js).
   **fett** und *kursiv* werden in der App dargestellt. Zeilen in Kästen, die mit „- “ beginnen, werden zu Aufzählungen. */
const P = (x) => ({ t: 'p', x });
const SUB = (x) => ({ t: 'sub', x });
const LAB = (x, tone) => ({ t: 'label', x, tone: tone || '' });
const V = (title, ...ps) => ({ t: 'vorlese', title, ps });
const DM = (title, ...items) => ({ t: 'dm', title, items });
const RP = (title, ...items) => ({ t: 'rp', title, items });
const PROBE = (title, rows) => ({ t: 'probe', title, rows });
const KAMPF = (title, enc, o) => Object.assign({ t: 'kampf', title, enc }, o);
const LOOT = (title, items, o) => Object.assign({ t: 'loot', title, items }, o || {});
const MERKE = (title, items, flags) => ({ t: 'merke', title, items, flags });
const TAB = (head, rows, tone) => ({ t: 'table', tone: tone || '', head, rows, bf: true });
const ROLL = (title, die, rows, note) => ({ t: 'roll', title, die, rows, note: note || '' });
const CNT = (id, title, o) => Object.assign({ t: 'counter', id, title }, o);
const CHOICE = (key, title, head, rows) => ({ t: 'choice', key, title, head, rows });
const FLAGS = (title, ids) => ({ t: 'flags', title, ids });
const ITEMS = (keys, from) => ({ t: 'items', keys, from: from || '' });
const OL = (...items) => ({ t: 'ol', items });
module.exports = { P, SUB, LAB, V, DM, RP, PROBE, KAMPF, LOOT, MERKE, TAB, ROLL, CNT, CHOICE, FLAGS, ITEMS, OL };
