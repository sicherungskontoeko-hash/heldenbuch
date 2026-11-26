/* ==== Import: Charakterbogen-PDF von D&D Beyond → Held ====
   D&D Beyond exportiert ein ausfüllbares PDF. Die Werte stehen in den Formularfeldern (/T = Feldname, /V = Wert),
   meist ohne AcroForm-Verzeichnis. Darum lesen wir die Felder direkt aus den Bytes – ohne Fremdbibliothek.
   Danach wird der Held mit den Regeln des Heldenbuchs nachgebaut und auf die Zahlen des PDFs abgeglichen
   (RK, TP, Initiative, Bewegung, Zauber-SG). Was das Heldenbuch nicht kennt, landet in den Notizen. */

/* ---------- 1. PDF-Felder lesen ---------- */
const DDB_DOC = { 0x18: '˘', 0x19: 'ˇ', 0x1a: 'ˆ', 0x1b: '˙', 0x1c: '˝', 0x1d: '˛', 0x1e: '˚', 0x1f: '˜', 0x80: '•', 0x81: '†', 0x82: '‡', 0x83: '…', 0x84: '—', 0x85: '–', 0x86: 'ƒ', 0x87: '⁄', 0x88: '‹', 0x89: '›', 0x8a: '−', 0x8b: '‰', 0x8c: '„', 0x8d: '“', 0x8e: '”', 0x8f: '‘', 0x90: '’', 0x91: '‚', 0x92: '™', 0x93: 'ﬁ', 0x94: 'ﬂ', 0x95: 'Ł', 0x96: 'Œ', 0x97: 'Š', 0x98: 'Ÿ', 0x99: 'Ž', 0x9a: 'ı', 0x9b: 'ł', 0x9c: 'œ', 0x9d: 'š', 0x9e: 'ž', 0xa0: '€' };
function ddbText(b) {
  let s = '';
  if (b[0] === 0xfe && b[1] === 0xff) { for (let i = 2; i + 1 < b.length; i += 2) s += String.fromCharCode((b[i] << 8) | b[i + 1]); }
  else if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) s = new TextDecoder('utf-8').decode(b.subarray(3));
  else for (const x of b) s += DDB_DOC[x] || String.fromCharCode(x);
  return s.replace(/\r\n?/g, '\n');
}
function ddbLatin(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return s; }
function ddbLit(s, i) {
  const b = []; let d = 1, j = i + 1;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    if (c === 92) {
      const e = s[j + 1]; j += 2;
      if (e === 'n') b.push(10); else if (e === 'r') b.push(13); else if (e === 't') b.push(9); else if (e === 'b') b.push(8); else if (e === 'f') b.push(12);
      else if (e === '\r') { if (s[j] === '\n') j++; } else if (e === '\n') { /* Zeilenfortsetzung */ }
      else if (e >= '0' && e <= '7') { let o = e; while (o.length < 3 && s[j] >= '0' && s[j] <= '7') o += s[j++]; b.push(parseInt(o, 8) & 255); }
      else if (e !== undefined) b.push(e.charCodeAt(0));
      continue;
    }
    if (c === 40) d++; else if (c === 41 && !--d) return { v: Uint8Array.from(b), end: j + 1 };
    b.push(c); j++;
  }
  return { v: Uint8Array.from(b), end: j };
}
function ddbHex(h) { h = h.replace(/[^0-9a-fA-F]/g, ''); if (h.length % 2) h += '0'; const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return b; }
/* Liest die oberste Ebene eines Dictionaries ab "<<". Verschachteltes wird nur übersprungen. */
function ddbDict(s, i) {
  const d = {}; let depth = 0, key = null; const n = s.length; const put = (v) => { if (depth === 1 && key !== null) { d[key] = v; key = null; } };
  while (i < n) {
    const c = s[i];
    if (c === '<' && s[i + 1] === '<') { put({ t: 'dict' }); depth++; i += 2; continue; }
    if (c === '>' && s[i + 1] === '>') { depth--; i += 2; if (depth <= 0) return { d, end: i }; continue; }
    if (c === '[') { const j = s.indexOf(']', i); const raw = j > 0 ? s.slice(i + 1, j) : ''; if (depth === 1 && key !== null && j > 0 && !/[[(<]/.test(raw)) { put({ t: 'arr', v: raw }); i = j + 1; continue; } put({ t: 'arr' }); depth++; i++; continue; }
    if (c === ']') { depth--; i++; continue; }
    if (c === '(') { const r = ddbLit(s, i); put({ t: 'str', v: r.v }); i = r.end; continue; }
    if (c === '<') { const j = s.indexOf('>', i); if (j < 0) break; put({ t: 'str', v: ddbHex(s.slice(i + 1, j)) }); i = j + 1; continue; }
    if (c === '%') { const j = s.indexOf('\n', i); i = j < 0 ? n : j + 1; continue; }
    if (c === '/') { let j = i + 1; while (j < n && !/[\s/[\]()<>{}%]/.test(s[j])) j++; const nm = s.slice(i + 1, j); i = j; if (depth === 1) { if (key !== null) { d[key] = { t: 'name', v: nm }; key = null; } else key = nm; } continue; }
    if (/\s/.test(c)) { i++; continue; }
    let j = i; while (j < n && !/[\s/[\]()<>{}%]/.test(s[j])) j++; if (j === i) j++;
    put({ t: 'tok', v: s.slice(i, j) }); i = j;
  }
  return { d, end: i };
}
function ddbTake(s, out) {
  const re = /(\d+)\s+\d+\s+obj\s*<</g; let m;
  while ((m = re.exec(s))) {
    const at = m.index + m[0].length - 2; const r = ddbDict(s, at); re.lastIndex = Math.max(re.lastIndex, r.end);
    ddbField(r.d, out, +m[1]);
    if (r.d.Type && r.d.Type.v === 'ObjStm') out.stm.push({ d: r.d, at: r.end });
  }
}
function ddbField(d, out, num) {
  if (d.Type && d.Type.v === 'Pages' && d.Kids && d.Kids.v) out.pages[num] = (d.Kids.v.match(/\d+(?=\s+\d+\s+R)/g) || []).map(Number);
  if (!d.T || d.T.t !== 'str' || !d.V) return;
  const name = ddbText(d.T.v).replace(/\s+/g, ' ').trim(); if (!name) return;
  out.f[name] = d.V.t === 'str' ? ddbText(d.V.v) : d.V.t === 'name' ? d.V.v : '';
  if (/^spell(Name|Header)\d+$/.test(name) && d.Rect && d.Rect.v && d.P) { const r = d.Rect.v.trim().split(/\s+/).map(Number); if (r.length === 4) out.pos[name] = [+d.P.v, Math.max(r[1], r[3])]; }
}
/* Reihenfolge der Seiten aus dem Seitenbaum; Positionen → [Seitennummer, Oberkante] */
function ddbPagePos(out) {
  const kids = new Set(Object.values(out.pages).flat()); const order = [];
  const walk = (n, depth) => { if (depth > 20) return; if (out.pages[n]) out.pages[n].forEach((k) => walk(k, depth + 1)); else order.push(n); };
  Object.keys(out.pages).map(Number).filter((n) => !kids.has(n)).forEach((n) => walk(n, 0));
  const idx = {}; order.forEach((n, i) => { idx[n] = i; });
  const pos = {}; for (const [k, [pg, y]] of Object.entries(out.pos)) pos[k] = [idx[pg] !== undefined ? idx[pg] : 999, y];
  return pos;
}
async function ddbInflate(u8) {
  if (typeof DecompressionStream !== 'function') return null;
  try { const ds = new DecompressionStream('deflate'); const r = new Response(new Blob([u8]).stream().pipeThrough(ds)); return new Uint8Array(await r.arrayBuffer()); } catch (e) { return null; }
}
/* Liefert alle Formularfelder als { Name: Text }. Komprimierte Objektströme werden mitgelesen. */
async function ddbFields(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const s = ddbLatin(u8); const out = { f: {}, stm: [], pages: {}, pos: {} };
  if (!/^%PDF-/.test(s.slice(0, 1024).replace(/^[^%]*/, ''))) throw new Error('Das ist keine PDF-Datei.');
  if (/\/Encrypt\b/.test(s)) throw new Error('Das PDF ist verschlüsselt. Bitte in D&D Beyond neu exportieren.');
  ddbTake(s, out);
  for (const o of out.stm) {
    if (!/Flate/.test(JSON.stringify(o.d.Filter || ''))) continue;
    let k = s.indexOf('stream', o.at); if (k < 0) continue; k += 6; if (s[k] === '\r') k++; if (s[k] === '\n') k++;
    let e = s.indexOf('endstream', k); if (e < 0) continue; if (s[e - 1] === '\n') e--; if (s[e - 1] === '\r') e--;
    const raw = await ddbInflate(u8.subarray(k, e)); if (!raw) continue;
    const t = ddbLatin(raw); const first = +((o.d.First || {}).v || 0); const nums = t.slice(0, first).trim().split(/\s+/).map(Number);
    for (let i = 1; i < nums.length; i += 2) { const p = first + nums[i]; const q = t.indexOf('<<', p); if (q >= 0 && q - p < 8) ddbField(ddbDict(t, q).d, out, nums[i - 1]); }
  }
  if (Object.keys(out.pos).length) out.f['#pos'] = ddbPagePos(out);
  return out.f;
}
function ddbIsSheet(F) { return !!(F && F.CharacterName !== undefined && F['CLASS LEVEL'] !== undefined && F.STR !== undefined); }

/* ---------- 2. Englische Begriffe → Heldenbuch ---------- */
const DDB_CLS = { barbarian: 'bar', bard: 'brd', cleric: 'cle', druid: 'dru', fighter: 'fig', monk: 'mon', paladin: 'pal', ranger: 'ran', rogue: 'rog', sorcerer: 'sor', warlock: 'wlk', wizard: 'wiz' };
const DDB_SUB = { bar: [/berserker/i, 'berserker'], brd: [/lore/i, 'lore'], cle: [/life/i, 'life'], dru: [/\bland\b/i, 'land'], fig: [/champion/i, 'champion'], mon: [/open hand/i, 'openhand'], pal: [/devotion/i, 'devotion'], ran: [/hunter/i, 'hunter'], rog: [/thief/i, 'thief'], sor: [/draconic/i, 'draconic'], wlk: [/fiend/i, 'fiend'], wiz: [/evo[ck]/i, 'evoker'] };
const DDB_SUBF = /Subclass$|^Sacred Oath$|^Primal Path$|^Bard College$|^Divine Domain$|^Druid Circle$|^Martial Archetype$|^Monastic Tradition$|^Ranger (Archetype|Conclave)$|^Roguish Archetype$|^Sorcerous Origin$|^Otherworldly Patron$|^Arcane Tradition$/;
const DDB_SPEC = [[/half-?elf/i, 'halfelf'], [/half-?orc/i, 'halforc'], [/dragonborn/i, 'dragonborn'], [/dwarf/i, 'dwarf'], [/\belf\b|drow|eladrin/i, 'elf'], [/gnome/i, 'gnome'], [/goliath/i, 'goliath'], [/halfling/i, 'halfling'], [/human/i, 'human'], [/\borc\b/i, 'orc'], [/tiefling/i, 'tiefling']];
const DDB_BG = { acolyte: 'acolyte', criminal: 'criminal', sage: 'sage', soldier: 'soldier' };
const DDB_SK = { Acrobatics: 'acr', AnimalHandling: 'ani', Arcana: 'arc', Athletics: 'ath', Deception: 'dec', History: 'his', Insight: 'ins', Intimidation: 'itm', Investigation: 'inv', Medicine: 'med', Nature: 'nat', Perception: 'prc', Performance: 'prf', Persuasion: 'per', Religion: 'rel', SleightOfHand: 'slt', Stealth: 'ste', Survival: 'sur' };
const DDB_FEAT = { 'alert': 'alert', 'magic initiate (cleric)': 'mi-cle', 'magic initiate (druid)': 'mi-dru', 'magic initiate (wizard)': 'mi-wiz', 'savage attacker': 'savage', 'skilled': 'skilled', 'tough': 'tough', 'grappler': 'grappler', 'archery': 'fs-archery', 'defense': 'fs-defense', 'great weapon fighting': 'fs-gwf', 'two-weapon fighting': 'fs-twf', 'dueling': 'fs-duel', 'protection': 'fs-prot' };
const DDB_INV = { 'agonizing blast': 'agonizing', 'armor of shadows': 'shadows', "devil's sight": 'devilsight', 'eldritch mind': 'mind', 'eldritch spear': 'spear', 'fiendish vigor': 'vigor', 'mask of many faces': 'faces', 'misty visions': 'misty', 'pact of the blade': 'blade', 'pact of the chain': 'chain', 'pact of the tome': 'tome', 'repelling blast': 'repelling', 'thirsting blade': 'thirsting', 'lifedrinker': 'lifedrinker', 'devouring blade': 'devouring', 'one with shadows': 'shadowsone', 'ascendant step': 'ascendant', 'otherworldly leap': 'leap', 'gift of the depths': 'depths', 'master of myriad forms': 'myriad', 'whispers of the grave': 'grave', 'witch sight': 'witchsight', 'gift of the protectors': 'protectors', 'investment of the chain master': 'chainmaster', 'visions of distant realms': 'visions', 'eldritch smite': 'smite', 'gaze of two minds': 'gaze', 'lessons of the first ones': 'lessons' };
const DDB_WPN = { club: 'club', dagger: 'dagger', greatclub: 'greatclub', handaxe: 'handaxe', javelin: 'javelin', 'light hammer': 'lighthammer', mace: 'mace', quarterstaff: 'quarterstaff', staff: 'quarterstaff', sickle: 'sickle', spear: 'spear', dart: 'dart', 'light crossbow': 'lcrossbow', 'crossbow, light': 'lcrossbow', shortbow: 'shortbow', sling: 'sling', battleaxe: 'battleaxe', flail: 'flail', glaive: 'glaive', greataxe: 'greataxe', greatsword: 'greatsword', halberd: 'halberd', lance: 'lance', longsword: 'longsword', maul: 'maul', morningstar: 'morningstar', pike: 'pike', rapier: 'rapier', scimitar: 'scimitar', shortsword: 'shortsword', trident: 'trident', warhammer: 'warhammer', 'war pick': 'warpick', whip: 'whip', blowgun: 'blowgun', 'hand crossbow': 'hcrossbow', 'crossbow, hand': 'hcrossbow', 'heavy crossbow': 'hvcrossbow', 'crossbow, heavy': 'hvcrossbow', longbow: 'longbow', musket: 'musket', pistol: 'pistol' };
const DDB_ARM = [[/studded/i, 'studded'], [/padded/i, 'padded'], [/\bleather\b/i, 'leather'], [/\bhide\b/i, 'hide'], [/chain shirt/i, 'chainshirt'], [/scale/i, 'scale'], [/breastplate/i, 'breastplate'], [/half plate/i, 'halfplate'], [/ring mail/i, 'ringmail'], [/chain mail/i, 'chainmail'], [/splint/i, 'splint'], [/\bplate\b/i, 'plate']];
const DDB_ALIGN = { 'lawful good': 'Rechtschaffen gut', 'neutral good': 'Neutral gut', 'chaotic good': 'Chaotisch gut', 'lawful neutral': 'Rechtschaffen neutral', 'neutral': 'Neutral', 'true neutral': 'Neutral', 'chaotic neutral': 'Chaotisch neutral', 'lawful evil': 'Rechtschaffen böse', 'neutral evil': 'Neutral böse', 'chaotic evil': 'Chaotisch böse' };
const DDB_LANG = { common: 'Gemeinsprache', draconic: 'Drakonisch', dwarvish: 'Zwergisch', elvish: 'Elfisch', giant: 'Riesisch', gnomish: 'Gnomisch', goblin: 'Goblinisch', halfling: 'Halblingisch', orc: 'Orkisch', abyssal: 'Abyssisch', celestial: 'Celestisch', 'deep speech': 'Tiefensprache', infernal: 'Infernalisch', primordial: 'Urtümlich', sylvan: 'Sylvanisch', undercommon: 'Gemeinsprache der Unterreiche', druidic: 'Druidisch', "thieves' cant": 'Diebessprache', 'common sign language': 'Gebärdensprache' };
const DDB_MAGIC = { 'potion of healing': 'potion-heal', 'potion of healing (greater)': 'potion-heal-g', 'potion of greater healing': 'potion-heal-g', 'potion of healing (superior)': 'potion-heal-s', 'potion of superior healing': 'potion-heal-s', 'potion of healing (supreme)': 'potion-heal-x', 'potion of supreme healing': 'potion-heal-x', 'wand of magic missiles': 'wand-missiles', 'bag of holding': 'bag-holding', 'ring of protection': 'ring-protection', 'cloak of protection': 'cloak-protection', 'boots of elvenkind': 'boots-elven', 'cloak of elvenkind': 'cloak-elven', 'potion of invisibility': 'potion-invis', 'potion of flying': 'potion-fly', 'potion of climbing': 'potion-climb', 'immovable rod': 'immovable-rod', 'goggles of night': 'goggles-night', 'flame tongue': 'flame-tongue', 'boots of speed': 'boots-speed', 'spell scroll': 'spell-scroll' };
const DDB_GEAR = Object.fromEntries(("backpack=Rucksack;bedroll=Schlafsack;blanket=Decke;tinderbox=Zunderbüchse;torch=Fackel;rations=Rationen (1 Tag);rations (1 day)=Rationen (1 Tag);waterskin=Wasserschlauch;rope=Seil, 15 m;rope, hempen (50 feet)=Seil, 15 m;rope, silk (50 feet)=Seil, 15 m;crowbar=Brecheisen;piton=Kletterhaken;oil=Öl (Flasche);oil (flask)=Öl (Flasche);lamp=Lampe;bullseye lantern=Laterne, Blend-;lantern, bullseye=Laterne, Blend-;hooded lantern=Laterne, abgedeckt;lantern, hooded=Laterne, abgedeckt;pouch=Beutel;sack=Sack;basket=Korb;bucket=Eimer;chest=Truhe;barrel=Fass;jug=Krug;flask=Flakon;vial=Phiole;quiver=Köcher;case, crossbow bolt=Bolzenköcher;arrows=Pfeile;arrow=Pfeile;crossbow bolts=Bolzen;bolts=Bolzen;sling bullets=Schleuderkugeln;holy symbol=Heiliges Symbol (Amulett, Emblem, Reliquiar);amulet=Heiliges Symbol (Amulett, Emblem, Reliquiar);emblem=Heiliges Symbol (Amulett, Emblem, Reliquiar);arcane focus=Arkaner Fokus (Kristall, Kugel, Stab);orb=Arkaner Fokus (Kristall, Kugel, Stab);crystal=Arkaner Fokus (Kristall, Kugel, Stab);sprig of mistletoe=Druidischer Fokus (Mistelzweig, Holzstab);wooden staff=Druidischer Fokus (Mistelzweig, Holzstab);component pouch=Zauberkomponentenbeutel;spellbook=Zauberbuch, leer;healer's kit=Heilerausrüstung (10 Anwendungen);thieves' tools=Diebeswerkzeug;disguise kit=Verkleidungsausrüstung;forgery kit=Fälscherausrüstung;herbalism kit=Kräuterkundeausrüstung;poisoner's kit=Giftmischerausrüstung;navigator's tools=Navigationswerkzeug;alchemist's supplies=Alchemistenausrüstung;brewer's supplies=Brauerausrüstung;calligrapher's supplies=Kalligrafenwerkzeug;carpenter's tools=Zimmermannswerkzeug;cartographer's tools=Kartografenwerkzeug;cobbler's tools=Schusterwerkzeug;cook's utensils=Kochutensilien;tinker's tools=Tüftlerwerkzeug;smith's tools=Schmiedewerkzeug;traveler's clothes=Reisekleidung;clothes, traveler's=Reisekleidung;fine clothes=Feine Kleidung;clothes, fine=Feine Kleidung;costume=Kostüm;robe=Robe;book=Buch;parchment=Pergament (Blatt);paper=Papier (Blatt);ink=Tinte (Fläschchen);ink pen=Schreibfeder;caltrops=Krähenfüsse (Beutel);ball bearings=Kugellager (Beutel);chain=Kette, 3 m;mirror=Spiegel;mirror, steel=Spiegel;bell=Glocke;candle=Kerze;tent=Zelt (2 Personen);dragonchess=Drachenschach;dragonchess set=Drachenschach;dice set=Würfelspiel;playing card set=Kartenspiel;lute=Laute;flute=Flöte;drum=Trommel;horn=Horn;lyre=Leier;bagpipes=Dudelsack;shawm=Schalmei;pan flute=Panflöte;viol=Viola;dulcimer=Hackbrett;antitoxin=Gegengift;acid=Säure (Phiole);alchemist's fire=Alchemistenfeuer;holy water=Weihwasser;perfume=Parfüm;shovel=Schaufel;hammer=Hammer;ladder=Leiter, 3 m;manacles=Fesseln (Handschellen);lock=Schloss;magnifying glass=Lupe;spyglass=Fernrohr;signal whistle=Signalpfeife;net=Netz;mess kit=Essgeschirr;climber's kit=Kletterausrüstung;hunting trap=Jagdfalle;map=Karte;chalk=Kreide;string=Schnur;trumpet=Trompete;soap=Seife;whetstone=Wetzstein;grappling hook=Enterhaken;block and tackle=Flaschenzug;pole=Stange, 3 m;iron pot=Eisentopf;pot, iron=Eisentopf;bottle, glass=Flasche (Glas);glass bottle=Flasche (Glas)").split(';').map((x) => x.split('=')));

const ddbLow = (x) => String(x || '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
let DDB_SPELLS = null;
function ddbSpell(name, hb) {
  if (!DDB_SPELLS) { DDB_SPELLS = {}; for (const s of Object.values(SPELLS)) if (s.en) DDB_SPELLS[ddbLow(s.en)] = s.id; }
  let n = ddbLow(String(name).replace(/\s*\[[A-Z]+\]\s*$/, '').replace(/\s*\((ritual|concentration)\)\s*$/i, ''));
  if (DDB_SPELLS[n]) return DDB_SPELLS[n];
  n = n.replace(/^(nystul's) magic aura$/, "arcanist's magic aura").replace(/^bigby's hand$/, 'arcane hand').replace(/^mordenkainen's sword$/, 'arcane sword')
    .replace(/^(tasha|melf|bigby|mordenkainen|otiluke|rary|tenser|evard|leomund|nystul|drawmij|otto|snilloc)'s /, '');
  if (DDB_SPELLS[n]) return DDB_SPELLS[n];
  for (const h of Object.values(hb || {})) if (h && h.kind === 'spell' && ddbLow(h.name) === n) return 'hb:' + h.id;
  return null;
}
function ddbWeapon(name) { const n = ddbLow(name).replace(/^\+\d\s+/, '').replace(/,?\s*\+\d$/, '').replace(/\s*\(.*\)$/, ''); return DDB_WPN[n] || null; }
function ddbArmor(name) { const n = String(name || ''); if (/tools|kit|supplies|worker/i.test(n)) return null; for (const [re, id] of DDB_ARM) if (re.test(n)) return id; return null; }
function ddbAbil(t) { return /intelligence/i.test(t) ? 'int' : /wisdom/i.test(t) ? 'wis' : /charisma/i.test(t) ? 'cha' : null; }

/* Merkmale-Text in Blöcke zerlegen: «* Name • Quelle», Optionen mit «| …» */
function ddbFeatures(txt) {
  const out = []; let sec = '';
  for (const raw of String(txt || '').split('\n')) {
    const l = raw.replace(/\s+$/, ''); let m;
    if ((m = l.match(/^===\s*(.+?)\s*===$/))) { sec = m[1]; continue; }
    if ((m = l.match(/^\* (.+?)(?:\s+•\s*([^|]*))?(?:\|\s*(.*))?$/))) { const b = { sec, name: m[1].replace(/\s*•\s*$/, '').trim(), src: (m[2] || '').trim(), opts: [], text: '' }; out.push(b); if (m[3]) ddbOpt(b, m[3]); continue; }
    const b = out[out.length - 1]; if (!b) continue;
    if ((m = l.match(/^(\s*)\|\s*(.+)$/))) { if (m[1].length < 5) ddbOpt(b, m[2]); continue; }
    if (l.trim()) b.text += (b.text ? ' ' : '') + l.trim();
  }
  return out;
}

/* Auswahl-Zeile übernehmen, Nutzungsangaben («2 / Long Rest», «1 Reaction», «Special») weglassen */
function ddbOpt(b, t) {
  const o = String(t).replace(/\s*•.*$/, '').trim();
  const u = o.match(/(\d+)\s*\/\s*(long|short) rest/i); if (u && !b.uses) b.uses = { n: +u[1], reset: /short/i.test(u[2]) ? 'short' : 'long' };
  if (!o || /(^|:\s*)(\d+\s*\/\s*(long|short) rest|special|\d+\s+(action|bonus action|reaction|minute|hour)s?)$/i.test(o) || /^increase (two|three) scores/i.test(o)) return;
  b.opts.push(o);
}

/* ---------- 3. Held nachbauen ---------- */
/* Zeitaufwand, Reichweite, Komponenten und Dauer aus der Zauberzeile ins Deutsche */
function ddbRowDe(F, i) {
  const g = (k) => String(F[k + i] == null ? '' : F[k + i]).trim();
  const m = (x) => String(x).replace(/(\d+(?:\.\d+)?)[- ]?(?:ft\.?|feet|foot)/gi, (z, n) => String(Math.round(+n * 3) / 10).replace('.', ',') + ' m')
    .replace(/\bmiles?\b/gi, 'Meilen').replace(/\bcone\b/gi, 'Kegel').replace(/\bline\b/gi, 'Linie').replace(/\bradius\b/gi, 'Radius').replace(/\bsphere\b/gi, 'Kugel').replace(/\bcube\b/gi, 'Würfel').replace(/\bemanation\b/gi, 'Ausstrahlung').replace(/\bcylinder\b/gi, 'Zylinder');
  const unit = (x) => x.replace(/(\d+)\s*minutes?/gi, (z, n) => n + (n === '1' ? ' Minute' : ' Minuten')).replace(/(\d+)\s*hours?/gi, (z, n) => n + (n === '1' ? ' Stunde' : ' Stunden')).replace(/(\d+)\s*rounds?/gi, (z, n) => n + (n === '1' ? ' Runde' : ' Runden')).replace(/(\d+)\s*days?/gi, (z, n) => n + (n === '1' ? ' Tag' : ' Tage'));
  const t = g('spellCastingTime').replace(/^1\s*A\s*\+\s*10\s*m$/i, 'Aktion (als Ritual 10 Minuten länger)'); const tm = t.match(/^(\d+)\s*(A|BA|R|m|min|h)$/i);
  const time = !tm ? t : /^a$/i.test(tm[2]) ? 'Aktion' : /^ba$/i.test(tm[2]) ? 'Bonusaktion' : /^r$/i.test(tm[2]) ? 'Reaktion' : /^h$/i.test(tm[2]) ? unit(tm[1] + ' hours') : unit(tm[1] + ' minutes');
  const r = g('spellRange'); const range = m(r.replace(/^self/i, 'Selbst').replace(/^touch$/i, 'Berührung').replace(/^sight$/i, 'Sicht').replace(/^unlimited$/i, 'Unbegrenzt'));
  const d = g('spellDuration'); const conc = /concentration/i.test(d);
  const dur = unit(d.replace(/^concentration,\s*up to\s*/i, 'bis zu ').replace(/^instantaneous$/i, 'Sofort').replace(/^until dispelled$/i, 'Bis aufgehoben').replace(/^special$/i, 'Speziell'));
  return { time: time || 'Aktion', range: range || '—', comp: g('spellComponents').replace(/\s*,\s*/g, ', ').replace(/\bS\b/g, 'G') || '—', dur: dur || 'Sofort', conc, hit: g('spellSaveHit'), page: g('spellPage') };
}
/* Grad jeder Zauberzeile aus der Lage der Überschriften («=== 1st LEVEL ===») */
function ddbLevels(F) {
  const pos = F['#pos'] || {}; const it = [];
  for (const [k, v] of Object.entries(pos)) {
    let m = k.match(/^spellHeader(\d+)$/);
    if (m) { const t = String(F[k] || ''); const lv = /cantrip/i.test(t) ? 0 : +((t.match(/(\d+)\s*(st|nd|rd|th)\b/i) || [])[1]); if (!isNaN(lv)) it.push({ p: v[0], y: v[1], lv, h: 1 }); continue; }
    m = k.match(/^spellName(\d+)$/); if (m) it.push({ p: v[0], y: v[1], i: +m[1], h: 0 });
  }
  it.sort((a, b) => a.p - b.p || b.y - a.y || b.h - a.h);
  const out = {}; let cur = null; for (const x of it) { if (x.h) cur = x.lv; else if (cur !== null) out[x.i] = cur; }
  return out;
}

function ddbBuild(F, hb) {
  hb = Object.assign({}, hb || {}); const newHb = {};
  const hbMake = (kind, name, more) => {
    const ex = Object.values(hb).find((h) => h && h.kind === kind && ddbLow(h.name) === ddbLow(name)); if (ex) return ex.id;
    const id = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const h = Object.assign({ id, kind, name, text: '', src: 'D&D Beyond' }, kind === 'feature' ? { ac: 0, save: 0, atk: 0, dc: 0, init: 0, hpPerLevel: 0, speed: 0, uses: 0, reset: 'long' } : {}, more || {});
    hb[id] = h; newHb[id] = h; return id;
  };
  const g = (k) => String(F[k] == null ? '' : F[k]).trim();
  const num = (k) => { const m = g(k).replace(/−/g, '-').match(/[-+]?\d+/); return m ? +m[0] : null; };
  const rep = { ok: [], adj: [], miss: [], hint: [], hb: [] }; const extraNotes = []; const feats = [];
  /* Klassen */
  const cl = [];
  for (const m of g('CLASS LEVEL').matchAll(/([A-Za-z][A-Za-z' -]*?)\s+(\d+)/g)) { const id = DDB_CLS[ddbLow(m[1])]; if (id && !cl.some((x) => x.id === id)) cl.push({ id, lvl: +m[2], en: m[1].trim() }); else if (!id) rep.miss.push('Klasse ' + m[1].trim() + ' ' + m[2] + ' (gibt es in Fablecrown nicht)'); }
  if (!cl.length) return { err: 'Keine bekannte Klasse gefunden („' + (g('CLASS LEVEL') || 'leer') + '“).' };
  const ft = ddbFeatures(Object.keys(F).filter((k) => /^FeaturesTraits\d+$/.test(k)).sort((a, b) => +a.slice(14) - +b.slice(14)).map((k) => F[k]).join('\n'));
  const blk = (re) => ft.find((b) => re.test(b.name));
  const opt1 = (re) => { const b = blk(re); return (b && b.opts[0]) || ''; };
  const allOpts = (re) => ft.filter((b) => re.test(b.name)).flatMap((b) => b.opts);
  const featNames = ft.filter((b) => /FEATS/i.test(b.sec)).map((b) => b.name);
  const spells = []; for (let i = 0; i < 400; i++) { const n = g('spellName' + i); if (n) spells.push({ n, i, id: ddbSpell(n, hb), src: g('spellSource' + i) }); }
  const lvOf = ddbLevels(F); const hbSpells = [];
  spells.forEach((s, k) => {
    if (s.id) return;
    const name = s.n.replace(/\s*\[[A-Z]+\]\s*$/, '').trim(); const known = spells.find((o) => o.id && o.id.startsWith('hb:') && ddbLow(o.n.replace(/\s*\[[A-Z]+\]\s*$/, '')) === ddbLow(name));
    if (known) { s.id = known.id; return; }
    let lv = lvOf[s.i]; if (lv === undefined) { for (let j = k - 1; j >= 0 && lv === undefined; j--) if (spells[j].id) lv = (getSpell(spells[j].id, hb) || {}).lvl; }
    const r = ddbRowDe(F, s.i); const cls = DDB_CLS[ddbLow((s.src.match(/^[A-Za-z]+/) || [''])[0])];
    s.id = 'hb:' + hbMake('spell', name, { lvl: lv || 0, school: '', classes: cls ? [cls] : [], time: r.time, range: r.range, comp: r.comp, dur: r.dur, conc: r.conc, ritual: /\[R\]/.test(s.n),
      text: 'Aus D&D Beyond übernommen' + (r.page ? ' (' + r.page + ')' : '') + '. Die Beschreibung steht nicht im PDF – bitte in eigenen Worten ergänzen' + (r.hit && r.hit !== '--' ? '. Rettungswurf/Angriff laut D&D Beyond: ' + r.hit : '') + '.' });
    hbSpells.push(name);
  });
  if (hbSpells.length) rep.hb.push('Zauber: ' + [...new Set(hbSpells)].join(', '));

  const ch = newChar({ name: g('CharacterName') || 'Importierter Held', player: g('PLAYER NAME'), cls: cl[0].id, level: cl[0].lvl, method: 'manual', species: 'human', speciesChoice: '', classSkills: [], extraSkills: [], expertise: [], freeSkills: [], freeExp: [], bonusSpells: [], homebrew: [] });
  ch.multi = cl.slice(1).map((x) => ({ cls: x.id, level: x.lvl, sub: '', cantrips: [], spells: [] }));
  ch.importedFrom = 'D&D Beyond';
  rep.ok.push('Klasse: ' + cl.map((x) => CLASSES[x.id].name + ' ' + x.lvl).join(' / '));
  /* Unterklassen */
  const subBl = ft.filter((b) => DDB_SUBF.test(b.name) && b.opts[0]);
  const customSub = [];
  cl.forEach((x, i) => {
    const tgt = i ? ch.multi[i - 1] : ch; const C = CLASSES[x.id]; if (!C.subs || x.lvl < 3) return;
    const sb = subBl.find((b) => new RegExp('\\b' + x.en + '\\b', 'i').test(b.sec)) || subBl[i]; const o = sb ? sb.opts[0] : '';
    const r = DDB_SUB[x.id]; const hit = o && r && r[0].test(o) && C.subs.find((s) => s.id === r[1]);
    const own = !hit && o && C.subs.find((s) => ddbLow(s.name) === ddbLow(o));
    if (hit || own) { tgt.sub = (hit || own).id; rep.ok.push('Unterklasse: ' + (hit || own).name); return; }
    if (!o) { rep.hint.push(C.name + ': Unterklasse bitte wählen'); return; }
    tgt.sub = 'eigen'; tgt.subName = o; tgt.subSpells = []; customSub.push({ x, tgt });
    const k0 = ft.indexOf(sb); const parts = ft.filter((b, k) => k > k0 && b.sec === sb.sec && b.text && !/^(hit points|proficiencies|spellcasting|ability score improvement)$/i.test(b.name)).map((b) => b.name + ': ' + b.text);
    ch.homebrew.push(hbMake('feature', o, { text: (parts.join('\n\n') || 'Unterklasse aus D&D Beyond.') + '\n\n(Aus D&D Beyond übernommen.)' }));
    rep.ok.push('Unterklasse: ' + o + ' (eigene)'); rep.hb.push('Unterklasse ' + o + ' (' + C.name + ')');
  });
  /* Spezies */
  const race = g('RACE'); const spHit = DDB_SPEC.find(([re]) => re.test(race));
  if (spHit && spHit[1]) { ch.species = spHit[1]; rep.ok.push('Spezies: ' + SPECIES[ch.species].name + (/half-?orc/i.test(race) ? ' (aus «' + race + '»)' : '')); }
  else {
    ch.humanFeat = ''; ch.speciesFallback = true; const tr = ft.filter((b) => /SPECIES|RACIAL/i.test(b.sec) && b.text).map((b) => b.name + ': ' + b.text);
    ch.homebrew.push(hbMake('feature', 'Volk: ' + (race || 'unbekannt'), { text: (tr.join('\n\n') || 'Spezies aus D&D Beyond.') + '\n\n(Aus D&D Beyond übernommen.)' }));
    rep.miss.push('Spezies «' + (race || '?') + '» gibt es in Fablecrown nicht – vorläufig Mensch, die Merkmale stehen als Hausregel beim Helden'); rep.hb.push('Volk: ' + race);
  }
  const SPd = SPECIES[ch.species];
  if (SPd.choice) {
    const opts = Object.keys(SPd.choice.opts); const src = [race, opt1(/Draconic Ancestry|Elven Lineage$|Gnomish Lineage|Giant Ancestry|Fiendish Legacy$/)].join(' ');
    let pick = opts.find((o) => new RegExp('\\b' + (o === 'chthonic' ? 'ch?thonic' : o) + '\\b', 'i').test(src));
    if (!pick && ch.species === 'tiefling') { const ls = spells.filter((s) => /legacy/i.test(s.src)).map((s) => s.id); pick = ls.includes('chill-touch') ? 'chthonic' : ls.includes('fire-bolt') ? 'infernal' : ls.includes('poison-spray') ? 'abyssal' : ''; }
    if (!pick && ch.species === 'elf') pick = /drow|dark elf/i.test(src) ? 'drow' : '';
    if (pick) { ch.speciesChoice = pick; rep.ok.push(SPd.choice.label + ': ' + SPd.choice.opts[pick]); } else rep.hint.push(SPd.choice.label + ' bitte wählen');
  }
  const sa = ddbAbil(opt1(/Lineage Spells|Legacy Spells|Gnomish Lineage/)); if (sa) ch.speciesSpellAbility = sa;
  /* Hintergrund */
  const bgName = g('BACKGROUND'); const bgId = DDB_BG[ddbLow(bgName)];
  if (bgId) { ch.bg = bgId; rep.ok.push('Hintergrund: ' + BACKGROUNDS[bgId].name); }
  else { ch.bg = 'custom'; ch.bgCustom = { name: bgName || 'Eigener Hintergrund', abil: null, skills: [], feat: '' }; rep.ok.push('Hintergrund: «' + (bgName || 'Eigener') + '» als eigener Hintergrund'); }
  /* Talente */
  const featIds = []; const featMiss = [];
  featNames.forEach((n) => { if (/ability score (improvement|increase)s?$/i.test(n) || /^weapon mastery$/i.test(n)) return; const id = DDB_FEAT[ddbLow(n)]; if (id) featIds.push(id); else featMiss.push(n); });
  const styleIds = []; allOpts(/^Fighting Style$/).concat(featIds.filter((x) => /^fs-/.test(x))).forEach((o) => { const id = /^fs-/.test(o) ? o : DDB_FEAT[ddbLow(o)]; if (id && /^fs-/.test(id)) { if (!styleIds.includes(id)) styleIds.push(id); } else if (!/fighting style feat/i.test(o) && !/^fs-/.test(o)) featMiss.push('Kampfstil ' + o); });
  ch.styles = styleIds;
  const origin = featIds.filter((id) => FEATS[id] && FEATS[id].cat === 'origin');
  const used = new Set();
  const bgFeat = bgId ? BACKGROUNDS[bgId].feat : null;
  if (bgFeat) used.add(origin.indexOf(bgFeat));
  else { const k = origin.findIndex((id, i) => !used.has(i)); if (k >= 0) { ch.bgCustom.feat = origin[k]; used.add(k); } }
  if (SPd.bonusFeat && !ch.speciesFallback) { const k = origin.findIndex((id, i) => !used.has(i)); if (k >= 0) { ch.humanFeat = origin[k]; used.add(k); } }
  origin.forEach((id, i) => { if (!used.has(i) && id !== bgFeat && id !== ch.humanFeat && id !== (ch.bgCustom || {}).feat) featMiss.push(FEATS[id].name + ' (kein freier Platz)'); });
  const general = featIds.filter((id) => FEATS[id] && FEATS[id].cat === 'general' && id !== 'asi');
  /* Magie-Eingeweihter: Zauber und Attribut */
  const miSlot = (fid) => (bgFeat === fid || (ch.bg === 'custom' && ch.bgCustom.feat === fid) ? 'bg' : ch.humanFeat === fid && SPd.bonusFeat ? 'human' : null);
  ['cle', 'dru', 'wiz'].forEach((k) => {
    const fid = 'mi-' + k; const slot = miSlot(fid); if (!slot) return;
    const en = { cle: 'Cleric', dru: 'Druid', wiz: 'Wizard' }[k]; const ss = spells.filter((s) => new RegExp('Magic Initiate \\(' + en + '\\)', 'i').test(s.src) && s.id);
    ch.mi[slot] = { ability: ddbAbil(opt1(new RegExp('^Magic Initiate \\(' + en + '\\)$'))) || (k === 'wiz' ? 'int' : 'wis'), cantrips: [...new Set(ss.filter((s) => getSpell(s.id, hb).lvl === 0).map((s) => s.id))].slice(0, 2), spell: (ss.find((s) => getSpell(s.id, hb).lvl === 1) || {}).id || '' };
  });
  /* Klassenoptionen */
  const ordO = (re, map) => { const o = opt1(re); return Object.keys(map).find((k) => map[k].test(o)) || ''; };
  const dIdx = cl.findIndex((x) => x.id === 'dru'), cIdx = cl.findIndex((x) => x.id === 'cle');
  if (dIdx >= 0) { const t = dIdx ? ch.multi[dIdx - 1] : ch; t.order = ordO(/^Primal Order$/, { magician: /magician/i, warden: /warden/i }); const land = opt1(/Circle of the Land Spells|Land.s Aid/); const lk = ['arid', 'polar', 'temperate', 'tropical'].find((k) => new RegExp(k, 'i').test(land)); if (lk) t.land = lk; }
  if (cIdx >= 0) { const t = cIdx ? ch.multi[cIdx - 1] : ch; t.order = ordO(/^Divine Order$/, { protector: /protector/i, thaumaturge: /thaumaturge/i }); }
  const invO = allOpts(/^Eldritch Invocations?$/);
  if (invO.length) { ch.invocations = []; invO.forEach((o) => { const id = DDB_INV[ddbLow(o.replace(/\s*\(.*\)$/, ''))]; if (id) { if (!ch.invocations.includes(id)) ch.invocations.push(id); } else featMiss.push('Anrufung ' + o); }); }
  /* Attribute: Endwerte aus dem PDF, Boni aus Hintergrund und Attributserhöhungen herausrechnen */
  const fin = {}; for (const k of AB) fin[k] = num(k.toUpperCase()) || 10;
  const base = Object.assign({}, fin); const desc = (ks) => ks.slice().sort((a, b) => fin[b] - fin[a] || AB.indexOf(a) - AB.indexOf(b));
  const bgA = bgId ? BACKGROUNDS[bgId].abil : desc(AB).slice(0, 3); if (!bgId) ch.bgCustom.abil = bgA.slice();
  const bs = desc(bgA); ch.bgMode = '21'; ch.bgPlus = {}; ch.bgPlus[bs[0]] = 2; ch.bgPlus[bs[1]] = 1; base[bs[0]] -= 2; base[bs[1]] -= 1;
  ch.asi = {};
  cl.forEach((x, i) => asiLevels(CLASSES[x.id], x.lvl).forEach((al) => {
    const key = i ? x.id + al : String(al); if (al === 19) { rep.hint.push('Epische Gabe (Stufe 19) bitte wählen'); return; }
    const gf = general.shift();
    if (gf && FEATS[gf].plus) { const k = desc(FEATS[gf].plus.filter((a) => base[a] > 8))[0] || FEATS[gf].plus[0]; ch.asi[key] = { feat: gf, plus: { [k]: 1 } }; base[k] -= 1; }
    else if (gf) ch.asi[key] = { feat: gf, plus: {} };
    else { const k = desc(AB).find((a) => base[a] - 2 >= 8) || desc(AB)[0]; ch.asi[key] = { feat: 'asi', plus: { [k]: 2 } }; base[k] -= 2; }
  }));
  general.forEach((id) => featMiss.push(FEATS[id].name + ' (kein freier Platz)'));
  ch.base = base; rep.ok.push('Attribute: ' + AB.map((k) => AB_K[k] + ' ' + fin[k]).join(', '));

  /* Fertigkeiten */
  const P = [], E = [];
  for (const [nm, id] of Object.entries(DDB_SK)) { const v = g(nm + 'Prof'); if (/^[PE•]/.test(v)) P.push(id); if (v === 'E') E.push(id); }
  const cov = new Set(bgId ? BACKGROUNDS[bgId].skills : []);
  if (SPd.skillPick) { const s = SPd.skillPick.find((x) => P.includes(x) && !cov.has(x)) || SPd.skillPick.find((x) => P.includes(x)); if (s) { ch.speciesSkill = s; cov.add(s); } }
  const C0 = CLASSES[ch.cls]; const cs = C0.skills.filter((s) => P.includes(s) && !cov.has(s)).slice(0, C0.skillN);
  C0.skills.filter((s) => P.includes(s) && !cs.includes(s)).forEach((s) => { if (cs.length < C0.skillN) cs.push(s); });
  ch.classSkills = cs; cs.forEach((s) => cov.add(s));
  if (!bgId) { const pick = P.filter((s) => !cov.has(s)).slice(0, 2); P.forEach((s) => { if (pick.length < 2 && !pick.includes(s)) pick.push(s); }); ch.bgCustom.skills = pick; pick.forEach((s) => cov.add(s)); }
  let c = derive(ch, hb);
  const rest = P.filter((s) => !c.skills[s].prof); ch.extraSkills = rest.slice(0, c.extraN); ch.freeSkills = rest.slice(c.extraN);
  c = derive(ch, hb); ch.expertise = E.filter((s) => c.skills[s].prof).slice(0, c.expN); ch.freeExp = E.filter((s) => !ch.expertise.includes(s));
  /* Waffen, Rüstung, Ausrüstung */
  const eq = []; let last = null;
  for (let i = 0; i < 200; i++) {
    const n = g('Eq Name' + i); if (!n) { last = null; continue; }
    const qty = Math.max(1, num('Eq Qty' + i) || 1); const lb = parseFloat(g('Eq Weight' + i).replace(',', '.')) || 0;
    if (last && ddbLow(last.n) === ddbLow(n)) { last.qty += qty; last.lb += lb; continue; }
    const ex = eq.find((x) => ddbLow(x.n) === ddbLow(n)); if (ex) { ex.qty = Math.max(ex.qty, qty); ex.lb = Math.max(ex.lb, lb); last = null; continue; }
    last = { n, qty, lb }; eq.push(last);
  }
  const wNames = Object.keys(F).filter((k) => /^Wpn Name/.test(k)).sort((a, b) => (+(a.match(/\d+/) || [0])[0]) - (+(b.match(/\d+/) || [0])[0])).map((k) => g(k)).filter(Boolean);
  const mast = new Set(allOpts(/^Weapon Mastery$/).map((o) => ddbWeapon(o)).filter(Boolean));
  const wids = []; const wMiss = [];
  wNames.forEach((n) => { const id = ddbWeapon(n); if (id) { if (!wids.includes(id)) wids.push(id); } else if (!/unarmed/i.test(n) && !ddbSpell(n, hb)) wMiss.push(n); });
  mast.forEach((id) => { if (!wids.includes(id) && eq.some((x) => ddbWeapon(x.n) === id)) wids.push(id); });
  ch.weapons = wids.map((w) => ({ w, mastery: mast.has(w) }));
  if (wids.length) rep.ok.push('Waffen: ' + wids.map((w) => WEAPONS[w][0]).join(', '));
  if (wMiss.length) rep.miss.push('Angriffe ohne Fablecrown-Waffe: ' + wMiss.join(', '));
  /* Rüstung so wählen, dass die RK passt */
  const armors = [...new Set(eq.map((x) => ddbArmor(x.n)).filter(Boolean))]; const hasShield = eq.some((x) => /^shield\b/i.test(x.n));
  const pdfAC = num('AC'); const cand = [];
  armors.concat(['none']).forEach((a) => { if (hasShield) cand.push([a, true]); cand.push([a, false]); });
  let best = cand[0], bestD = 1e9;
  for (const [a, sh] of cand) { ch.armor = a; ch.shield = sh; const d = pdfAC == null ? 0 : Math.abs(derive(ch, hb).ac - pdfAC); if (d < bestD) { bestD = d; best = [a, sh]; } if (!d) break; }
  ch.armor = best[0]; ch.shield = best[1];
  rep.ok.push('Rüstung: ' + ARMOR[ch.armor].name + (ch.shield ? ' und Schild' : ''));
  /* Inventar, magische Gegenstände, Münzen */
  ch.inv = []; ch.items = []; let armorTaken = false, shieldTaken = false;
  for (const x of eq) {
    const lo = ddbLow(x.n);
    if (!armorTaken && ch.armor !== 'none' && ddbArmor(x.n) === ch.armor) { armorTaken = true; if (x.qty <= 1) continue; x.qty--; }
    if (!shieldTaken && ch.shield && /^shield$/i.test(x.n.trim())) { shieldTaken = true; if (x.qty <= 1) continue; x.qty--; }
    const mi = DDB_MAGIC[lo]; if (mi && MAGIC_ITEMS[mi]) { ch.items.push({ uid: typeof uidX === 'function' ? uidX() : 'i' + Math.random().toString(36).slice(2, 9), id: mi, att: false, eq: true, qty: x.qty, w: '' }); continue; }
    const de = DDB_GEAR[lo] || DDB_GEAR[lo.replace(/s$/, '')]; const wp = ddbWeapon(x.n);
    const gear = de && typeof GEAR !== 'undefined' ? GEAR.find((r) => r[0] === de) : null;
    const kg = gear ? gear[1] : Math.round((x.lb / x.qty) * 0.5 * 100) / 100;
    ch.inv.push({ n: de || (wp ? WEAPONS[wp][0] : x.n), qty: x.qty, kg: kg || 0 });
  }
  if (ch.inv.length || ch.items.length) rep.ok.push('Ausrüstung: ' + (ch.inv.length + ch.items.length) + ' Einträge' + (ch.items.length ? ' (davon ' + ch.items.length + ' magisch)' : ''));
  ch.coins = { pm: num('PP') || 0, gm: num('GP') || 0, em: num('EP') || 0, sm: num('SP') || 0, km: num('CP') || 0 }; ch.gold = ch.coins.gm;
  /* Immer vorbereitete Zauber der eigenen Unterklasse (z. B. «Paladin (Always Prepared)», «Succubus Spells (Always Prepared)») */
  const baseAlways = (id) => new Set(Object.values(CLASSES[id].always || {}).flat());
  const classEn = cl.map((x) => x.en.toLowerCase());
  customSub.forEach(({ x, tgt }) => {
    const ids = spells.filter((sp) => sp.id && /always prepared/i.test(sp.src) && !baseAlways(x.id).has(sp.id)).filter((sp) => { const pre = ddbLow(sp.src.replace(/\s*\(always prepared\)/i, '')); const own = classEn.includes(pre); return own ? pre === x.en.toLowerCase() : customSub.length === 1 || /spells$/i.test(pre); }).map((sp) => sp.id);
    tgt.subSpells = [...new Set(ids)];
    if (tgt.subSpells.length) rep.ok.push(tgt.subName + ': ' + tgt.subSpells.length + ' immer vorbereitete Zauber');
  });
  /* Zauber je Klasse */
  const other = []; const clsRe = [];
  c = derive(ch, hb);
  cl.forEach((x, i) => {
    const info = (c.spell.classes || []).find((s) => s.id === x.id); if (!info) return;
    const tgt = i ? ch.multi[i - 1] : ch; const re = clsRe[i] = new RegExp('^(' + x.en + '(?! \\(Always)|Primal Order|Divine Order)', 'i');
    const lst = new Set(info.list.map((s) => s.id)); const mine = spells.filter((s) => s.id && re.test(s.src) && lst.has(s.id));
    const can = [...new Set(mine.filter((s) => getSpell(s.id, hb).lvl === 0).map((s) => s.id))];
    const lev = [...new Set(mine.filter((s) => getSpell(s.id, hb).lvl > 0).map((s) => s.id))].filter((id) => !info.always.includes(id));
    tgt.cantrips = can.slice(0, info.cantripN); if (can.length > info.cantripN) rep.hint.push(CLASSES[x.id].name + ': ' + (can.length - info.cantripN) + ' Zaubertrick(s) mehr als in Fablecrown erlaubt – weggelassen');
    if (x.id === 'wiz') tgt.book = lev.slice();
    if (lev.length <= info.prepN) tgt.spells = lev;
    else { tgt.spells = []; rep.hint.push(CLASSES[x.id].name + ': D&D Beyond listet ' + lev.length + ' verfügbare Zauber – bitte ' + info.prepN + ' vorbereiten'); }
    if (tgt.cantrips.length || tgt.spells.length) rep.ok.push('Zauber ' + CLASSES[x.id].name + ': ' + tgt.cantrips.length + ' Zaubertricks, ' + tgt.spells.length + ' vorbereitet');
  });
  const taken = new Set([ch.cantrips, ch.spells, ch.book].concat(ch.multi.map((m) => (m.cantrips || []).concat(m.spells || []))).flat());
  c = derive(ch, hb); (c.spell.classes || []).forEach((s) => s.always.forEach((id) => taken.add(id)));
  Object.values(ch.mi).forEach((m) => { (m.cantrips || []).forEach((id) => taken.add(id)); if (m.spell) taken.add(m.spell); });
  if (typeof SPd.spells === 'function') { try { SPd.spells(c).forEach((id) => taken.add(id)); } catch (e) { /* ältere Spezies ohne Zauberliste */ } }
  customSub.forEach(({ tgt }) => (tgt.subSpells || []).forEach((id) => taken.add(id)));
  spells.forEach((s) => { if (s.id && !taken.has(s.id) && !clsRe.some((re) => re && re.test(s.src)) && !other.some((o) => o.id === s.id)) other.push(s); });
  /* Übrige Zauber (Talente, Anrufungen, Pakte) als Zusatzzauber; Zauber aus Gegenständen bleiben beim Gegenstand */
  const casterAb = ((c.spell.classes || [])[0] || {}).ability || 'cha'; const fromItem = [];
  other.forEach((sp) => {
    const src = sp.src.replace(/\s*\(always prepared\)/i, '').trim();
    if (eq.some((x) => ddbLow(x.n) === ddbLow(src))) { fromItem.push(getSpell(sp.id, hb).name + ' (' + src + ')'); return; }
    const bb = ft.find((b) => ddbLow(b.name) === ddbLow(src)); const ab = (bb && ddbAbil(bb.opts.join(' '))) || (/invocation|pact/i.test(src) ? 'cha' : casterAb);
    ch.bonusSpells.push({ id: sp.id, src, ab });
  });
  if (ch.bonusSpells.length) rep.ok.push('Weitere Zauber: ' + ch.bonusSpells.map((b) => getSpell(b.id, hb).name + ' (' + b.src + ')').join(', '));
  if (fromItem.length) extraNotes.push('Zauber aus Gegenständen: ' + fromItem.join(', '));
  /* Talente und Merkmale ohne Gegenstück im Heldenbuch als Hausregel beim Helden */
  featMiss.forEach((n) => {
    if (/kein freier Platz/.test(n)) { extraNotes.push('Talent ' + n.replace(' (kein freier Platz)', '') + ': in D&D Beyond zusätzlich gewählt, Wirkung über Fertigkeiten/TP angeglichen'); return; }
    const isStyle = /^Kampfstil /.test(n); const b = isStyle ? blk(/^Fighting Style$/) : blk(new RegExp('^' + n.replace(/^Anrufung /, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    const name = isStyle ? 'Kampfstil: ' + n.slice(9) : n.replace(/^Anrufung /, '');
    ch.homebrew.push(hbMake('feature', name, { text: ((b && b.text) || 'Aus D&D Beyond.') + '\n\n(Aus D&D Beyond übernommen.)', uses: b && b.uses ? b.uses.n : 0, reset: b && b.uses ? b.uses.reset : 'long' }));
    rep.hb.push(name);
  });
  ch.homebrew = [...new Set(ch.homebrew)];
  /* Abgleich mit den PDF-Zahlen über «Sonstiges» */
  c = derive(ch, hb);
  const adj = (k, have, want, label, unit) => { if (want == null || isNaN(want) || want === have) return; const d = Math.round((want - have) * 10) / 10; ch.misc[k] = Math.round(((+ch.misc[k] || 0) + d) * 10) / 10; rep.adj.push(label + ' ' + (d > 0 ? '+' : '') + String(d).replace('.', ',') + (unit || '') + ' (D&D Beyond ' + String(want).replace('.', ',') + (unit || '') + ', Fablecrown ' + String(have).replace('.', ',') + (unit || '') + ')'); };
  adj('hp', c.hpMax, num('MaxHP'), 'TP-Maximum');
  adj('ac', c.ac, pdfAC, 'RK');
  adj('init', c.init, num('Init'), 'Initiative');
  const ft0 = g('Speed').match(/(\d+)\s*ft/i); adj('speed', c.speed, ft0 ? Math.round(+ft0[1] / 5 * 1.5 * 10) / 10 : null, 'Bewegung', ' m');
  if (c.spell.has && num('spellSaveDC0') != null) { adj('dc', c.spell.dc, num('spellSaveDC0'), 'Zauber-SG'); adj('atk', c.spell.atk, num('spellAtkBonus0'), 'Zauberangriff'); }
  c = derive(ch, hb);
  const svN = { str: 'ST Strength', dex: 'ST Dexterity', con: 'ST Constitution', int: 'ST Intelligence', wis: 'ST Wisdom', cha: 'ST Charisma' };
  const svD = AB.filter((k) => num(svN[k]) != null && num(svN[k]) !== c.saves[k].val).map((k) => AB_K[k] + ' ' + (num(svN[k]) >= 0 ? '+' : '') + num(svN[k]) + ' statt ' + (c.saves[k].val >= 0 ? '+' : '') + c.saves[k].val);
  if (svD.length) rep.hint.push('Rettungswürfe weichen ab: ' + svD.join(', '));
  const skD = ALL_SKILLS.filter((s) => !!c.skills[s].prof !== P.includes(s)).map((s) => SKILLS[s][0] + (c.skills[s].prof ? ' (in Fablecrown zusätzlich)' : ' (fehlt)'));
  if (skD.length) rep.hint.push('Fertigkeiten weichen ab: ' + skD.join(', '));
  rep.ok.push('Fertigkeiten: ' + ALL_SKILLS.filter((s) => c.skills[s].prof).map((s) => SKILLS[s][0] + (c.skills[s].prof === 2 ? ' (Expertise)' : '')).join(', '));
  /* Spielstand */
  const cur = num('CurrentHP'); ch.play.hp = cur != null && cur >= 0 ? Math.min(cur, c.hpMax) : null; ch.play.temp = Math.max(0, num('TempHP') || 0);
  const xp = num('EXPERIENCE POINTS'); if (xp) ch.xp = xp;
  /* Texte */
  const al = DDB_ALIGN[ddbLow(g('ALIGNMENT'))]; ch.alignment = al || g('ALIGNMENT');
  const pl = g('ProficienciesLang'); const sec = (h) => { const m = pl.match(new RegExp('===\\s*' + h + '\\s*===\\s*\\n([\\s\\S]*?)(?:\\n\\s*===|$)', 'i')); return m ? m[1].replace(/\s+/g, ' ').trim() : ''; };
  const langs = sec('LANGUAGES'); if (langs) ch.languages = langs.split(/\s*,\s*/).map((l) => DDB_LANG[ddbLow(l)] || l).join(', ');
  const look = [['Grösse', 'HEIGHT'], ['Gewicht', 'WEIGHT'], ['Alter', 'AGE'], ['Augen', 'EYES'], ['Haare', 'HAIR'], ['Haut', 'SKIN'], ['Geschlecht', 'GENDER']].filter(([, k]) => g(k)).map(([n, k]) => n + ': ' + g(k)).join(' · ');
  ch.appearance = [look, g('Appearance')].filter(Boolean).join('\n');
  const para = (h, k) => (g(k) ? h + ': ' + g(k) : '');
  const notes = [para('Persönlichkeit', 'PersonalityTraits'), para('Ideale', 'Ideals'), para('Bindungen', 'Bonds'), para('Makel', 'Flaws'), para('Glaube', 'FAITH'),
    g('AlliesOrganizations') ? g('AlliesOrganizations').replace(/===\s*([^=\n]+?)\s*===/g, (x, h) => ({ allies: 'Verbündete', organizations: 'Organisationen' }[ddbLow(h)] || h) + ':').replace(/:\s*\n\s*\n/g, ': ').replace(/\n\s*\n/g, '\n').trim() : '',
    g('Backstory') ? 'Hintergrundgeschichte:\n' + g('Backstory') : '',
    Object.keys(F).filter((k) => /^(AdditionalNotes|Notes)\d*$/.test(k)).map((k) => g(k)).filter((x) => x && x !== '-').join('\n')].filter(Boolean);
  const tools = sec('TOOLS'); const dfn = g('Defenses').replace(/\s*\n\s*/g, ' · '); const sns = g('AdditionalSenses');
  const ddb = [tools && 'Werkzeuge: ' + tools, dfn && 'Abwehr: ' + dfn, sns && 'Sinne: ' + sns, g('SaveModifiers') && 'Rettungswurf-Hinweise: ' + g('SaveModifiers').replace(/\s*\n\s*/g, ' · '), rep.hb.length && 'Als Hausregel angelegt (Hausregeln, nur auf diesem Gerät): ' + rep.hb.join('; ')].concat(extraNotes).filter(Boolean);
  if (ddb.length) notes.push('— Aus D&D Beyond —\n• ' + ddb.join('\n• '));
  ch.notes = notes.join('\n\n');
  c = derive(ch, hb);
  return { ch, rep, c, newHb };
}

/* ---------- 4. Bedienung ---------- */
async function ddbImportFile(file) {
  let F;
  try { F = await ddbFields(new Uint8Array(await file.arrayBuffer())); }
  catch (e) { pushLog({ label: 'PDF laden', total: '✗', detail: (e && e.message) || 'Das PDF liess sich nicht lesen.' }); return; }
  if (!ddbIsSheet(F)) { pushLog({ label: 'PDF laden', total: '✗', detail: 'Kein Charakterbogen von D&D Beyond erkannt. Exportiere in D&D Beyond: Charakter → «Export PDF».' }); return; }
  ddbPreview(F);
}
function ddbPreview(F) {
  let r; try { r = ddbBuild(F, S.hb); } catch (e) { r = { err: 'Fehler beim Umwandeln: ' + ((e && e.message) || e) }; }
  if (r.err) { pushLog({ label: 'PDF laden', total: '✗', detail: r.err }); return; }
  S.ddb = r; S.modal = 'ddb'; const m = $('#modal'); const { ch, rep, c } = r;
  const ul = (t, a, cls) => (a.length ? '<h3>' + t + '</h3><ul class="ddbl' + (cls ? ' ' + cls : '') + '">' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '');
  const open = c.warn.filter((w) => !/^Unbekannte Unterklasse/.test(w));
  m.innerHTML = '<div class="dlg ddbdlg" role="dialog" aria-modal="true" aria-label="Held aus D&amp;D Beyond übernehmen"><div class="dph"><b>Aus D&amp;D Beyond übernehmen</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<p class="ddbhead"><b>' + esc(ch.name) + '</b> · ' + esc(c.classLabel) + ' · ' + esc(c.sp.name) + '</p>' +
    '<p class="ddbnum">RK <b>' + c.ac + '</b> · TP <b>' + c.hpMax + '</b> · Initiative <b>' + (c.init >= 0 ? '+' : '') + c.init + '</b> · Bewegung <b>' + String(c.speed).replace('.', ',') + ' m</b></p>' +
    ul('Bitte prüfen', rep.hint.concat(open.length ? [open.length + ' offene Auswahl(en) im Bogen, z. B. ' + open.slice(0, 2).join(' ')] : []), 'hint') + ul('Nicht übernommen', rep.miss, 'miss') + ul('Neu als Hausregel (nur auf diesem Gerät)', rep.hb, 'hbl') + ul('Angeglichen über «Sonstiges»', rep.adj, 'adj') + ul('Übernommen', rep.ok) +
    '<p class="hint">Das PDF bleibt unverändert. Den Helden kannst du danach unter «Bearbeiten» wie jeden anderen anpassen.</p>' +
    '<div class="chips end ddbgo"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" data-act="ddbTake">Held anlegen</button></div></div>';
  m.hidden = false;
}
XA.ddbTake = () => {
  const r = S.ddb; if (!r) return; const ch = r.ch;
  Object.values(r.newHb || {}).forEach((h) => { if (!S.hb[h.id]) { S.hb[h.id] = h; persist('h', h.id); } });
  if (S.chars[ch.id]) ch.id = typeof freshId === 'function' ? freshId() : ch.id + 'x';
  ch.updated = Date.now(); S.chars[ch.id] = ch; persist('c', ch.id); S.cur = ch.id; S.ddb = null; S.modal = null; $('#modal').hidden = true; S.view = 'heroes'; render();
  pushLog({ label: 'Übernommen', total: '✓', detail: '„' + ch.name + '“ aus D&D Beyond ist jetzt in deinen Helden' });
};
