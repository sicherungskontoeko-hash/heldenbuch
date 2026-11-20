// Erzeugt die Heldenbuch-Daten für „Das Wirtshaus zum letzten Krug“:
//   Wirtshaus_zum_letzten_Krug.heldenbuch.json  (Datei zum Laden)
//   ../../adv-krug.js                           (eingebautes Abenteuer ab Heldenbuch 1.9)
// Aufruf: node krug-gen.js
const fs = require('fs');
const D = require('./krug-data');
const { vor, prolog, a1 } = require('./krug-story1');
const { a2 } = require('./krug-story2');
const { a3, a4, fin, epilog } = require('./krug-story3');

const errs = [];
const chapters = [vor, prolog, a1, a2, a3, a4, fin, epilog].map((c) => Object.assign({ intro: [] }, c));
const mobIds = new Set(D.mobs.map((m) => 'u-' + m.id));
const BUILTIN = ['gelatinous-cube', 'giant-crab', 'swarm-of-rats', 'hobgoblin', 'mimic', 'thug', 'ogre', 'guard', 'kobold', 'bandit', 'goblin', 'noble', 'commoner', 'veteran', 'knight'];
const encIds = new Set(D.enc.map((e) => e.id));
const flagIds = new Set(D.flags.map((f) => f.id));
D.enc.forEach((e) => e.mobs.forEach((m) => { if (!mobIds.has(m.mid) && !BUILTIN.includes(m.mid)) errs.push('Begegnung ' + e.id + ': unbekanntes Monster ' + m.mid); }));

function fixBlock(b, where) {
  if (b.t === 'items') {
    const rows = (b.keys || []).map((k) => { const [key, from] = Array.isArray(k) ? k : [k, b.from]; const it = D.items[key]; if (!it) { errs.push(where + ': Gegenstand fehlt ' + key); return null; } return { name: it.name, rule: it.text, from: from || '', item: key }; }).filter(Boolean);
    return { t: 'items', rows };
  }
  if (b.t === 'kampf' && !encIds.has(b.enc)) errs.push(where + ': Begegnung fehlt ' + b.enc);
  if (b.t === 'kampf') (b.allies || []).forEach((x) => { if (!mobIds.has(x.mid) && !BUILTIN.includes(x.mid)) errs.push(where + ': Verbündeter unbekannt ' + x.mid); });
  if ((b.t === 'flags' && b.ids) || (b.t === 'merke' && b.flags)) (b.ids || b.flags).forEach((id) => { if (!flagIds.has(id)) errs.push(where + ': Merker fehlt ' + id); });
  if (b.t === 'choice') b.rows.forEach((r) => Object.entries(r.sets || {}).forEach(([k, v]) => { const f = D.flags.find((x) => x.id === k); if (!f) errs.push(where + ': Merker fehlt ' + k); else if (!(v in f.opts)) errs.push(where + ': Merker ' + k + ' kennt ' + v + ' nicht'); }));
  if (b.t === 'roll') b.rows.forEach((r) => { if (!/^\d+(–\d+)?$/.test(r[0])) errs.push(where + ': Würfelbereich ' + r[0]); });
  const s = JSON.stringify(b); if (/undefined|NaN/.test(s)) errs.push(where + ': undefined/NaN');
  if (b.t === 'merke' && !b.flags) delete b.flags;
  return b;
}
chapters.forEach((c) => {
  c.intro = c.intro.map((b, i) => fixBlock(b, c.id + ' Einleitung ' + i));
  c.scenes = c.scenes.map((s, si) => ({ id: c.id + 's' + (si + 1), title: s.title, blocks: s.blocks.map((b, bi) => fixBlock(b, c.id + ' „' + s.title + '“ ' + bi)) }));
});
// Würfeltabellen vollständig? (jede Zahl von 1 bis die genau einmal)
chapters.forEach((c) => c.scenes.concat([{ title: 'Einleitung', blocks: c.intro }]).forEach((s) => s.blocks.filter((b) => b.t === 'roll').forEach((b) => {
  const seen = []; b.rows.forEach((r) => { const [a, z] = r[0].split('–').map(Number); for (let i = a; i <= (z || a); i++) seen.push(i); });
  if (seen.length !== b.die || seen.some((x, i) => x !== i + 1)) errs.push(c.id + ' „' + b.title + '“: W' + b.die + ' nicht vollständig');
})));
Object.entries(D.items).forEach(([k, it]) => { if (!/^krug-/.test(k)) errs.push('Gegenstand ohne Präfix ' + k); if (!it.name || !it.r || !it.text) errs.push('Gegenstand unvollständig ' + k); });
Object.values(D.lore).forEach((l) => { if (l.ch && !chapters.some((c) => c.id === l.ch)) errs.push('Kreatur mit unbekanntem Kapitel ' + l.title); });
D.flags.forEach((f) => { if (!chapters.some((c) => c.id === f.ch)) errs.push('Merker ' + f.id + ' mit unbekanntem Kapitel'); });
// Wird jeder Gegenstand irgendwo verteilt?
const given = new Set(); chapters.forEach((c) => c.scenes.forEach((s) => s.blocks.forEach((b) => { if (b.t === 'items') b.rows.forEach((r) => given.add(r.item)); })));
const loose = Object.keys(D.items).filter((k) => !given.has(k));
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const overview = { head: ['Teil', 'Am Tisch', 'Im Spiel', 'Schauplatz', 'Höhepunkt'], rows: [
  ['**Vorbereitung**', 'vorher lesen', '–', '–', 'Zähler, Portal-Uhr, Zufallstabellen'],
  ['**Prolog** · Die Vollmacht', '14:00', 'Morgen', 'Der Letzte Krug', 'Der ehrliche Weg führt nirgends hin'],
  ['**Akt 1** · Der Letzte Krug', '14:30', 'Vormittag', 'Gaststube, Garten, Weinkeller', 'Hildegard, die Mimik-Mutter'],
  ['**Akt 2** · Einkaufen im Hort', '16:15', 'Mittag', 'Der Dungeon-Markt', 'Elch, Kundendienst, Kassenschlange'],
  ['**Akt 3** · Die Prüfung', '18:45', 'Nachmittag', 'Der Letzte Krug', 'Belagerung und Probeessen'],
  ['**Akt 4** · Die Hofküche', '19:45', 'Abend', 'Der Palast', 'Der Tausch in der Tortenkammer'],
  ['**Finale** · Mitternacht', '21:15', 'Nacht', 'Die Stadt, der Letzte Krug', 'Die Schlägerei'],
  ['**Epilog**', '21:50', 'Morgen danach', 'Der Letzte Krug', '–'],
] };

const adv = {
  id: 'krug', ver: 1, title: 'Das Wirtshaus zum letzten Krug', sub: 'Ein lustiges Eintagesabenteuer für D&D 5e',
  meta: 'Fünf Helden · Stufe 4 (5) · rund acht Stunden',
  quote: '„Ehrlich kommt man weit. Bis Mitternacht aber nicht.“',
  overview, chapters, flags: D.flags, figures: D.figures, lore: D.lore, items: D.items,
  srd: 'Mimik, Gallertwürfel, Riesenkrabbe, Hobgoblin, Rattenschwarm, Schläger und Oger stammen aus dem SRD 5.1 (CC-BY-4.0). Alle anderen Werte sind eigene.',
  mobs: D.mobs, enc: D.enc,
};

const file = { heldenbuch: 1, exportiert: new Date('2026-11-20T12:00:00Z').toISOString(), abenteuer: adv.title, chars: [], hb: [], extra: { mobs: D.mobs, enc: D.enc, adv: [adv] } };
fs.writeFileSync(__dirname + '/Wirtshaus_zum_letzten_Krug.heldenbuch.json', JSON.stringify(file, null, 1));
fs.writeFileSync(__dirname + '/../../adv-krug.js', '/* Eingebautes Abenteuer „Das Wirtshaus zum letzten Krug“ – erzeugt mit abenteuer/krug/krug-gen.js, nicht von Hand ändern. */\nconst ADV_KRUG = ' + JSON.stringify(adv) + ';\n');
console.log('Kapitel', chapters.map((c) => c.id + ':' + c.scenes.length).join(' '), '· Gegenstände', Object.keys(D.items).length, (loose.length ? '(nicht verteilt: ' + loose.join(', ') + ')' : ''), '· Bytes', fs.statSync(__dirname + '/../../adv-krug.js').size);
