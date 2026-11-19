// Erzeugt aus story.js + appendix.js (dem Abenteuerbuch) die Heldenbuch-Daten für „Die Machtader“:
//   Die_Machtader.heldenbuch.json  (Datei zum Laden, auch für Heldenbuch 1.7.1)
//   ../../adv-machtader.js         (eingebautes Abenteuer ab Heldenbuch 1.8)
// Aufruf: node gen.js   ·   Das Word-Buch: node build.js (braucht das npm-Paket docx)
const fs = require('fs');
const { story, appendix } = require('./extract');

/* ---------- Text-Helfer ---------- */
const AB = { ST: 'STÄ', GE: 'GES', KO: 'KON', IN: 'INT', WE: 'WEI', CH: 'CHA' };
const plain = (s) => String(s).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
const dice = (d, p) => d.replace(/\s/g, '') + (p ? '+' + p : '');
function conv(s) {
  return plain(s)
    .replace(/(\d+) \((\d+W\d+)(?: \+ (\d+))?\)/g, (m, avg, d, p) => dice(d, p))
    .replace(/\b(ST|GE|KO|IN|WE|CH)-(?= oder)/g, (m, a) => AB[a])
    .replace(/\b(ST|GE|KO|IN|WE|CH)-Rettungswurf SG (\d+)/g, (m, a, n) => AB[a] + ' SG ' + n)
    .replace(/,? sonst liegt (?:sie|das Ziel|er) am Boden/g, ' oder liegend')
    .replace(/,? sonst /g, ' oder ')
    .replace(/ und am Boden/g, ' und liegend')
    .replace(/,? die Hälfte bei Erfolg/g, ' (halb bei Erfolg)')
    .replace(/\.? Halber Schaden bei Erfolg/g, ' (halb bei Erfolg)')
    .replace(/ oder liegen am Boden/g, ' oder liegend')
    .replace(/\s+/g, ' ').trim();
}
const oneSentence = (s) => s.replace(/\.\s+(?=\S)/g, ', ').replace(/\.$/, '');
const sent = (s) => (s = s.trim(), /[.!?]$/.test(s) ? s : s + '.');

/* ---------- Monster ---------- */
const MOB_ID = {
  'Brannok Hornhand': 'brannok1', 'Borka': 'borka1', 'Manaverseuchter Riesenkeiler': 'keiler', 'Manaharpyie': 'harpyie', 'Schreckenswolf': 'schreckenswolf', 'Wolf': 'wolf',
  'Morgath, der Aderfresser': 'morgath', 'Ithari-Wächter': 'waechter', 'Kristallkoloss': 'koloss', 'Bulette': 'bulette', 'Ankheg': 'ankheg',
  'Brannok, die Halbmaschine': 'brannok3', 'Borka, die Eisenbärin': 'borka3', 'Mechaharpyie': 'mechaharpyie', 'Mechakeiler': 'mechakeiler', 'Morgath-Chimäre · Phase 1': 'chimaere', 'König Severin Vaal': 'vaal',
};
const NAME = { 'Morgath-Chimäre · Phase 1': 'Morgath-Chimäre (Phase 1)', 'Borka': 'Borka, die Leitbärin', 'Brannok Hornhand': 'Brannok Hornhand, der Jäger' };
const HAB = { brannok1: 'wald', borka1: 'wald', keiler: 'wald', harpyie: 'wald', schreckenswolf: 'wald', wolf: 'wald', morgath: 'hoehle', waechter: 'arkan', koloss: 'arkan', bulette: 'hoehle', ankheg: 'hoehle', brannok3: 'stadt', borka3: 'stadt', mechaharpyie: 'stadt', mechakeiler: 'stadt', chimaere: 'stadt', vaal: 'stadt', morgath2: 'stadt' };
const LEG = { morgath: [3, 2], chimaere: [3, 3], morgath2: [3, 3] };
// Zusatzeffekte der Angriffe, so formuliert, dass das Heldenbuch sie erkennt (packt / STÄ SG … oder liegend)
const RIDER = {
  morgath: ['Mandibelbiss packt (SG 17), solange er hält, beisst er nur dieses Ziel', 'Nach Kernhunger macht der Mandibelbiss zusätzlich 2W6 Energie'],
  schreckenswolf: ['Biss: STÄ SG 13 oder liegend'],
  wolf: ['Biss: STÄ SG 11 oder liegend'],
  ankheg: ['Biss packt (SG 13), solange er hält, beisst er nur dieses Ziel und hat Vorteil'],
  brannok1: ['Jagdspeer zweihändig im Nahkampf: 1W8+3 Stich'],
  brannok3: ['Harpunenkette: STÄ SG 17 oder 6 m zu Brannok gezogen'],
  chimaere: ['Mandibelbiss packt (SG 20)'],
};
// Merkmale, deren Wortlaut für die Angriffserkennung angepasst wird
const TRAIT_FIX = {
  keiler: { Ansturm: 'Ansturm: Nach 6 m geradem Anlauf und einem Hauer-Treffer zusätzlich 2W6 Hieb, STÄ SG 13 oder liegend' },
  mechakeiler: { Ansturm: 'Ansturm: Nach 6 m geradem Anlauf und einem Stahlhauer-Treffer zusätzlich 3W6 Hieb, STÄ SG 16 oder liegend' },
  borka3: { Kolbenansturm: 'Kolbenansturm: Nach 6 m geradem Anlauf und einem Klauen-Treffer zusätzlich 2W8 Wucht, STÄ SG 18 oder liegend' },
};

function parseAtk(name, text) {
  const b = /\+(\d+) zum Treffen/.exec(text); if (!b) return null;
  const hit = text.split(/\*Treffer:\*/)[1] || ''; const m = /(\d+) \((\d+W\d+)(?: \+ (\d+))?\) ([A-Za-zÄÖÜäöü]+)/.exec(hit); if (!m) return null;
  let expr = dice(m[2], m[3]); const types = [m[4]];
  const re = /plus (\d+) \((\d+W\d+)(?: \+ (\d+))?\) ([A-Za-zÄÖÜäöü]+)/g; let x;
  while ((x = re.exec(hit))) { expr += '+' + dice(x[2], x[3]); types.push(x[4]); }
  return [name.replace(/\s*\(.*\)$/, ''), +b[1], expr, types.join(' + ')];
}
const crOf = (s) => /^([\d/]+)/.exec(s.details.find((d) => /Herausforderung/.test(d[0]))[1])[1];

// Einträge, deren Wortlaut für das Heldenbuch umgestellt wird (Rettungswurf als „GES SG 17 oder …“)
const OVR = {
  'harpyie|Lockgesang': 'Lockgesang: Jeder Humanoide in 90 m, der den Gesang hört: WEI SG 11 oder bezaubert, bis der Gesang endet. Die Harpyie braucht in jedem weiteren Zug eine Bonusaktion, um weiterzusingen. Ein bezaubertes Ziel ist kampfunfähig und geht auf direktem Weg zur Harpyie, ohne Gelegenheitsangriffen auszuweichen. Es wiederholt den Rettungswurf am Ende jedes eigenen Zugs, wenn es Schaden erleidet und bevor es gefährliches Gelände betritt. Bei Erfolg ist es 24 Stunden immun gegen diese Harpyie.',
  'morgath|Fadenpeitsche (2)': 'Fadenpeitsche (2): Eine Kreatur in 9 m: GES SG 17 oder 4,5 m zu Morgath gezogen und liegend.',
  'morgath|Untertauchen (2)': 'Untertauchen (2): Er gräbt sich ein und taucht bis zu 12 m entfernt wieder auf, ohne Gelegenheitsangriffe. Kreaturen in 3 m: GES SG 17 oder liegend. Nicht, solange er jemanden gepackt hält.',
  'morgath|Kristallregen': 'Kristallregen: Drei Punkte in 36 m, je 3 m Radius: GES SG 13 oder 2W6 Stich.',
  'bulette|Tödlicher Sprung': 'Tödlicher Sprung: Springt sie mindestens 4,5 m, kann sie auf einem Feld mit anderen Kreaturen landen. Jede dort: STÄ oder GES SG 16 (nach Wahl) oder liegend und 3W6+4 Wucht plus 3W6+4 Hieb. Bei Erfolg halber Schaden und 1,5 m zur Seite geschoben.',
};
const ent = (id, n, t, pre = '') => OVR[id + '|' + n] ? pre + OVR[id + '|' + n] : pre + n + ': ' + conv(t);

function mobFrom(c) {
  const s = c.stat; const id = MOB_ID[s.name]; if (!id) throw new Error('Kein Monster-Id für ' + s.name);
  const atks = []; const parts = { multi: [], rech: [], act: [] };
  (s.actions || []).forEach(([n, t]) => {
    if (n === 'Mehrfachangriff') { parts.multi.push('Mehrfachangriff: ' + oneSentence(conv(t))); return; }
    const a = parseAtk(n, t); if (a) atks.push(a);
    if (/Aufladung/.test(n)) parts.rech.push(n + ': ' + oneSentence(conv(t.replace(/\*[^*]+\*\s*/g, '')))); // eine Sache = ein Satz, sonst erkennt das Heldenbuch die Aufladung nicht
    else if (!a) parts.act.push(ent(id, n, t));
  });
  (s.bonus || []).forEach(([n, t]) => { const a = parseAtk(n, t); if (a) { a[0] += ' (Bonusaktion)'; atks.push(a); } else parts.act.push(ent(id, n, t, 'Bonusaktion ')); });
  (s.reactions || []).forEach(([n, t]) => parts.act.push(ent(id, n, t, 'Reaktion ')));
  const traits = (s.traits || []).filter(([n]) => !/^Legendäre Resistenz/.test(n)).map(([n, t]) => (TRAIT_FIX[id] && TRAIT_FIX[id][n]) || ent(id, n, t));
  // Legendäre Aktionen und Hortaktionen: jede als eigener Satz mit ✦, damit kein Angriff einen falschen Zusatzeffekt erbt
  const leg = s.legendary ? ['Legendäre Aktionen (3 pro Runde, am Ende des Zugs einer anderen Kreatur):'].concat(s.legendary.list.map(([n, t]) => '✦ ' + ent(id, n, t))) : [];
  const lair = s.lair ? ['Hortaktionen (' + s.lair.title.split(' · ')[1] + '): ' + conv(s.lair.intro)].concat(s.lair.list.map(([n, t]) => '✦ ' + ent(id, n, t))) : [];
  const weak = (s.weak || []).length ? ['Schwächen:'].concat(s.weak.map((w) => '✦ ' + conv(w))) : [];
  const lr0 = (s.traits || []).find(([n]) => /^Legendäre Resistenz/.test(n));
  const txt = [].concat(parts.multi, RIDER[id] || [], parts.rech, parts.act, traits, lr0 ? [lr0[0] + ': ' + conv(lr0[1])] : [], leg, lair, weak).map((x) => (/:$/.test(x) ? x : sent(x))).join(' ');
  const [la, lr] = LEG[id] || [0, 0];
  return { id: 'mach-' + id, name: NAME[s.name] || s.name, cr: crOf(s), ac: parseInt(s.ac, 10), hp: parseInt(s.hp, 10), hd: (/\(([^)]+)\)/.exec(s.hp) || [])[1].replace(/\s/g, ''), spd: s.speed, ini: Math.floor((s.abil[1] - 10) / 2), atks, txt, hab: [HAB[id]], la, lr };
}

const creatures = appendix.filter((n) => n.k === 'creature');
const mobs = creatures.map(mobFrom);
// Phase 2 der Chimäre als eigener Eintrag (wird im Kampf als Verstärkung bereitgehalten)
{
  const p1 = mobs.find((m) => m.id === 'mach-chimaere'); const bite = p1.atks.find((a) => a[0] === 'Mandibelbiss'); const sick = p1.atks.find((a) => a[0] === 'Sichelbein');
  mobs.push({ id: 'mach-morgath2', name: 'Morgath entfesselt (Chimäre Phase 2)', cr: '18', ac: 17, hp: 100, hd: '100', spd: '15 m, Klettern 12 m', ini: 0,
    atks: [bite.slice(), sick.slice()],
    txt: [
      'Mehrfachangriff: Ein Mandibelbiss und drei Sichelbeine',
      'Mandibelbiss packt (SG 20)',
      'Manaspeien (Aufladung 5–6): Kegel von 12 m, GES SG 20, 8W10 Energie (halb bei Erfolg)',
      'Raserei: Greift immer die nächste Kreatur an, auch Vaal',
      'Phasenwechsel: Startet mit 100 TP oder den verbleibenden TP aus Phase 1, falls mehr. Kapsel, Fadenspinner und Fadenstoss entfallen',
      'Legendäre Resistenz (3/Tag): Gilt für beide Phasen zusammen, in Phase 1 verbrauchte abziehen',
      'Legendäre Aktionen (3 pro Runde, am Ende des Zugs einer anderen Kreatur):', '✦ Kriechen (1): Halbe Bewegung ohne Gelegenheitsangriffe', '✦ Sichelhieb (2): Ein Angriff mit dem Sichelbein', '✦ Stampfen (3): Jede Kreatur in 6 m: STÄ SG 20 oder 3W8 Wucht und liegend (halb bei Erfolg)',
      'Bändigung: Ein befreiter Brannok kann Morgath als Aktion bändigen, Mit Tieren umgehen gegen SG 20',
      'Die EP sind in Phase 1 enthalten',
    ].map((x) => (/:$/.test(x) ? x : sent(x))).join(' '), hab: ['stadt'], la: 3, lr: 3 });
}

/* ---------- Begegnungen ---------- */
const E = (id, name, list, reserve) => ({ id: 'mach-e-' + id, name: 'Machtader ' + name, mobs: list.map(([m, n]) => ({ mid: 'u-mach-' + m, n })), t: 0, reserve: reserve ? reserve.map(([m, n]) => ({ mid: 'u-mach-' + m, n })) : undefined });
const enc = [
  E('k1a', 'K1 · Die Keiler', [['keiler', 2]]),
  E('k1b', 'K1 · Lieder im Eschenwald', [['harpyie', 3], ['schreckenswolf', 1], ['wolf', 2]]),
  E('k1c', 'K1 · Der Jäger von Eschental', [['brannok1', 1], ['borka1', 1], ['keiler', 1], ['harpyie', 1]]),
  E('k2a', 'K2 · Die Fresser im Fels', [['bulette', 1], ['ankheg', 3]]),
  E('k2b', 'K2 · Die Wächter von Ithrael', [['waechter', 3], ['koloss', 1]]),
  E('k2c', 'K2 · Morgath, der Aderfresser', [['morgath', 1]]),
  E('k3a', 'K3 · Die Nacht im Spiegelsaal', [['brannok3', 1], ['borka3', 1], ['mechaharpyie', 3]]),
  E('k3b', 'K3 · Morgath erwacht', [['chimaere', 1], ['mechakeiler', 1]], [['morgath2', 1], ['vaal', 1]]),
  E('k3c', 'K3 · Phase 2 (in den laufenden Kampf einsetzen)', [['morgath2', 1], ['vaal', 1]]),
];
const t0 = Date.parse('2026-11-19T12:00:00Z'); enc.forEach((e, i) => { e.t = t0 - i * 1000; });
// Verbündete, die die Spielleitung mitten im Kampf dazunehmen kann
const ALLIES = { 'Morgath erwacht': [{ mid: 'u-mach-brannok3', name: 'Brannok (befreit)', hp: 100, when: 'Nur wenn Brannok in „Der Angriff“ befreit wurde. Er hat nur noch 100 TP, du führst ihn.' }] };
const KAMPF_ENC = { 'Die Keiler': 'k1a', 'Lieder im Eschenwald': 'k1b', 'Der Jäger von Eschental': 'k1c', 'Die Fresser im Fels': 'k2a', 'Die Wächter von Ithrael': 'k2b', 'Morgath, der Aderfresser': 'k2c', 'Die Nacht im Spiegelsaal': 'k3a', 'Morgath erwacht': 'k3b' };

/* ---------- Entscheidungen ---------- */
const flags = [
  { id: 'tobin', ch: 'k1', label: 'Freundlich zu Tobin', opts: { ja: 'Tobin warnt an der Gala einen Helden vor der Krone.', nein: 'Keine Warnung an der Gala.' } },
  { id: 'brannok', ch: 'k1', label: 'Brannok verschont', opts: { ja: 'Zerrissener Wille 1–8, Borka braucht nur 2 Erfolge, Brannok ruft „Lauft!“.', nein: 'Zerrissener Wille 1–4, Borka braucht 3 Erfolge.' } },
  { id: 'borka', ch: 'k1', label: 'Borka lebt', opts: { ja: 'Beruhigen SG 18.', nein: 'Borka wurde neu gebaut: Beruhigen SG 20.' } },
  { id: 'perle', ch: 'k1', label: 'Holzperle erbeutet', opts: { ja: 'Zeigen zählt als 1 Erfolg beim Beruhigen von Borka.', nein: '' } },
  { id: 'bolzen', ch: 'k1', label: 'Gildenbolzen behalten', opts: { ja: 'Zweiter Beweis in „Die Wahrheit“.', nein: 'Vaal hat den Bolzen verschwinden lassen.' } },
  { id: 'herz', ch: 'k2', label: 'Herz von Ithrael', opts: { gesichert: 'Die Chimäre nutzt die Hortaktionen der Raffinerie.', 'zerstört': 'Instabiler Kern: 30 TP weniger, keine Hortaktionen, Kernkanone lädt nur bei 6. Im Zwischenspiel die Variante vorlesen.' } },
];
const CHOICE = {
  'Was geschieht mit Brannok?': { key: 'k1brannok', sets: [{ brannok: 'ja', borka: 'ja' }, { brannok: 'nein', borka: 'ja' }, { brannok: 'nein', borka: 'nein' }, { brannok: 'ja', borka: 'ja' }] },
  'Das Herz von Ithrael': { key: 'k2herz', sets: [{ herz: 'gesichert' }, { herz: 'zerstört' }] },
};
const MERKE_FLAGS = [[/freundlich zu Tobin/, ['tobin']], [/Brannok \*\*verschont\*\*/, ['brannok', 'borka']], [/Bolzen behalten/, ['bolzen']], [/\*\*gesichert\*\* oder \*\*zerstört\*\*/, ['herz']]];
const LOOT_FLAGS = [[/Holzperle aus Brannoks Bart\*\*, im Kampf/, ['perle']]];

/* ---------- Beute: Gold je Gruppe / je Held, Gegenstände für das Beute-Formular ---------- */
const LOOT_GOLD = { 'Die Waldstrasse': { gm: 15 }, 'Der Eschenwald': { gm: 40 }, 'Die Ruinen von Eschental': { gm: 30 }, 'Rückkehr nach Kronhafen': { gm: 300, gmHero: 50 }, 'Drei Jahre': { gmHero: 500 } };
const ITEM_KEY = { 'Fadenschneider': 'weapon-1', 'Ithari-Klinge': 'weapon-1', 'Kristallschild': 'shield-1', 'Lichtmantel': 'cloak-protection', 'Manaperle': 'pearl-power', 'Fokus der Ithari': 'wand-war-1', 'Schützenarmschienen': 'bracers-archery',
  'Geschliffene Ithari-Klinge': 'weapon-2', 'Kristallrüstung': 'armor-1', 'Ring der Waage': 'ring-protection', 'Herzsplitter-Amulett': 'amulet-health', 'Verstärkter Fokus': 'wand-war-2', 'Manastiefel': 'boots-speed' };

/* ---------- Abenteuer-Baum ---------- */
const CH_ID = { 'Prolog': 'prolog', 'Kapitel 1': 'k1', 'Kapitel 2': 'k2', 'Kapitel 3': 'k3', 'Epilog': 'epilog' };
const LEVEL = { k1: '3', z1: '3 → 5', k2: '5', z2: '5 → 11', k3: '11' };
const chapters = []; let ch = null; let sc = null; let zN = 0; let overview = null; let pendingLabel = null; let skip = false;
const push = (b) => { if (!b) return; if (!ch) return; (sc ? sc.blocks : ch.intro).push(b); };
story.forEach((n) => {
  if (n.k === 'raw') return;
  if (n.k === 'chapter') {
    if (n.kicker === 'Übersicht') { skip = true; return; }
    skip = false; const id = CH_ID[n.kicker] || ('z' + (++zN));
    ch = { id, kicker: n.kicker, title: n.title, sub: n.sub || '', level: LEVEL[id] || '', intro: [], scenes: [] }; chapters.push(ch); sc = null; return;
  }
  if (skip) { if (n.k === 'table' && !overview) overview = { head: n.head, rows: n.rows }; return; }
  if (n.k === 'scene') { sc = { id: ch.id + 's' + (ch.scenes.length + 1), title: n.title, blocks: [] }; ch.scenes.push(sc); return; }
  if (n.k === 'label' && /Entscheidung/.test(n.t)) { pendingLabel = n.t; return; }
  if (n.k === 'table' && n.kind === 'wahl' && pendingLabel) {
    const title = pendingLabel.replace(/^!\s*Entscheidung\s*·\s*/, ''); const C = CHOICE[title]; pendingLabel = null;
    push({ t: 'choice', key: C.key, title, head: n.head, rows: n.rows.map((r, i) => ({ a: r[0], b: r[1], sets: C.sets[i] || {} })) }); return;
  }
  const scTitle = () => (sc ? sc.title : ch.title);
  switch (n.k) {
    case 'p': return push({ t: 'p', x: n.t });
    case 'sub': return push({ t: 'sub', x: n.title });
    case 'label': return push({ t: 'label', x: n.t.replace(/^[!◆⚄]\s+/, '') , tone: /^!/.test(n.t) ? 'wahl' : /^◆/.test(n.t) ? 'dm' : '' });
    case 'vorlese': return push({ t: 'vorlese', title: n.title, ps: n.ps });
    case 'dm': return push({ t: 'dm', title: n.title, items: n.items });
    case 'merke': { const fl = []; n.items.forEach((x) => MERKE_FLAGS.forEach(([re, ids]) => { if (re.test(x)) fl.push(...ids); })); return push({ t: 'merke', title: n.title, items: n.items, flags: fl.length ? fl : undefined }); }
    case 'loot': { const fl = []; n.items.forEach((x) => LOOT_FLAGS.forEach(([re, ids]) => { if (re.test(x)) fl.push(...ids); })); const g = LOOT_GOLD[scTitle()] || {}; return push(Object.assign({ t: 'loot', title: n.title, items: n.items, flags: fl.length ? fl : undefined }, g)); }
    case 'probe': return push({ t: 'probe', title: n.title, rows: n.rows });
    case 'kampf': { const e = KAMPF_ENC[n.title]; if (!e) throw new Error('Kampf ohne Begegnung: ' + n.title); return push({ t: 'kampf', title: n.title, enc: 'mach-e-' + e, gegner: n.gegner, gelaende: n.gelaende, taktik: n.taktik, ende: n.ende, allies: ALLIES[n.title] }); }
    case 'table': {
      if (n.kind === 'loot' && n.head[0] === 'Name') return push({ t: 'items', rows: n.rows.map((r) => ({ name: plain(r[0]), rule: r[1], from: r[2], item: ITEM_KEY[plain(r[0])] || '' })) });
      return push({ t: 'table', tone: n.kind, head: n.head, rows: n.rows, bf: n.boldFirst || undefined });
    }
    case 'ol': { const blocks = sc ? sc.blocks : ch.intro; const last = blocks[blocks.length - 1]; if (last && last.t === 'ol') last.items.push(n.t); else push({ t: 'ol', items: [n.t] }); return; }
    case 'li': return push({ t: 'ol', ul: true, items: [n.t] });
    default: throw new Error('Unbekannter Block ' + n.k);
  }
});
// Kapitel ohne Szenen: Inhalt als eine Szene
chapters.forEach((c) => { if (!c.scenes.length) { c.scenes.push({ id: c.id + 's1', title: c.title, blocks: c.intro }); c.intro = []; } });
// Kapitel 3: Stand der Entscheidungen vorne einblenden
{ const k3 = chapters.find((c) => c.id === 'k3'); k3.intro.unshift({ t: 'flags', title: 'Eure Entscheidungen aus Kapitel 1 und 2', ids: ['tobin', 'brannok', 'borka', 'perle', 'bolzen', 'herz'] }); }
{ const z2 = chapters.find((c) => c.title === 'Zehn Jahre'); z2.scenes[0].blocks.unshift({ t: 'flags', title: 'Herz von Ithrael', ids: ['herz'] }); }

/* ---------- Figuren und Kreaturen ---------- */
const figures = appendix.filter((n) => n.k === 'figure').map((f) => ({ name: f.name, role: f.role, fields: f.fields, quote: f.quote || '' }));
const lore = {}; creatures.forEach((c) => { lore['mach-' + MOB_ID[c.stat.name]] = { title: c.title, look: c.look, lore: c.lore, fight: c.fight, weak: c.stat.weak || [], ch: '' }; });
// Kapitel je Kreatur (aus den Bestiarium-Kapiteln)
{ let cur = ''; appendix.forEach((n) => { if (n.k === 'chapter' && /Kapitel (\d)/.test(n.title)) cur = 'k' + /Kapitel (\d)/.exec(n.title)[1]; if (n.k === 'creature') lore['mach-' + MOB_ID[n.stat.name]].ch = cur; }); }
lore['mach-morgath2'] = Object.assign({}, lore['mach-chimaere'], { title: 'Morgath entfesselt', look: 'Die Kabel sind aus dem Rücken gerissen, Stahlplatten fallen ab. Darunter glüht der alte Riesenleib.', fight: 'Raserei: immer die nächste Kreatur, auch Vaal am Boden.', ch: 'k3' });

const adv = {
  id: 'machtader', ver: 1, title: 'Die Machtader', sub: 'Ein Eintagesabenteuer für D&D 5e', meta: 'Fünf Helden · Stufe 3, 5 und 11 · rund zehn Stunden',
  quote: '„Alles hat seinen Preis. Die Frage ist nur, wer ihn bezahlt.“',
  overview, chapters, flags, figures, lore,
  srd: 'Bulette und Ankheg beruhen auf dem SRD 5.1 (CC-BY-4.0). Alle anderen Werte sind eigene.',
  mobs, enc,
};

/* ---------- Ausgabe ---------- */
const file = { heldenbuch: 1, exportiert: new Date('2026-11-19T12:00:00Z').toISOString(), abenteuer: 'Die Machtader', chars: [], hb: [], extra: { mobs, enc: enc.map((e) => { const x = Object.assign({}, e); delete x.reserve; return x; }), adv: [adv] } };
fs.writeFileSync(__dirname + '/Die_Machtader.heldenbuch.json', JSON.stringify(file, null, 1));
fs.writeFileSync(__dirname + '/../../adv-machtader.js', '/* Eingebautes Abenteuer „Die Machtader“ – erzeugt aus dem Abenteuerbuch (gen.js), nicht von Hand ändern. */\nconst ADV_MACHTADER = ' + JSON.stringify(adv) + ';\n');
console.log('mobs', mobs.length, 'enc', enc.length, 'chapters', chapters.map((c) => c.id + ':' + c.scenes.length).join(' '), 'bytes', fs.statSync(__dirname + '/Die_Machtader.heldenbuch.json').size);
