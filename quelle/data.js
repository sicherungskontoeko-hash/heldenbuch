/* ==== Regeldaten: basiert auf dem SRD 5.2.1 (CC-BY-4.0), deutsch in eigenen Worten zusammengefasst ==== */
/* Würfelzufall: kryptografischer Zufall des Geräts (fairer als Math.random) */
const NATIVE_RANDOM = Math.random;
/* Deutsche Sortierung: ein Collator für alles (gleiche Reihenfolge wie localeCompare(…, 'de'), aber viel schneller) */
const COLL_DE = new Intl.Collator('de'); const cmpDe = (a, b) => COLL_DE.compare(a, b);
/* Eingebettete Bilder (Monster, Banner, Porträts) einmal in kurze blob:-Adressen umwandeln: so muss der Browser beim
   Neuzeichnen nicht jedes Mal hunderte Kilobyte Text lesen und das Bild neu dekodieren. Wo blob: nicht erlaubt ist
   (Prüfung beim Start), bleibt alles wie bisher. */
let BLOB_OK = false; const BLOB_URL = new Map();
(function blobTest() { try { const s = atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); const im = new Image(); im.onload = () => { BLOB_OK = true; }; im.src = URL.createObjectURL(new Blob([a], { type: 'image/gif' })); } catch (e) {} })();
function imgUrl(d) {
  if (!BLOB_OK || typeof d !== 'string' || d.length < 3000 || d.slice(0, 5) !== 'data:') return d;
  let u = BLOB_URL.get(d); if (u) return u;
  try { const i = d.indexOf(','); const bin = atob(d.slice(i + 1)); const a = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k); u = URL.createObjectURL(new Blob([a], { type: d.slice(5, d.indexOf(';')) })); } catch (e) { u = d; }
  BLOB_URL.set(d, u); return u;
}
const rnd = (() => { const c = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto : null; const b = new Uint32Array(1); return () => { if (!c || Math.random !== NATIVE_RANDOM) return Math.random(); c.getRandomValues(b); return b[0] / 4294967296; }; })();
const AB = ['str','dex','con','int','wis','cha'];
const AB_DE = {str:'Stärke',dex:'Geschicklichkeit',con:'Konstitution',int:'Intelligenz',wis:'Weisheit',cha:'Charisma'};
const AB_K = {str:'STÄ',dex:'GES',con:'KON',int:'INT',wis:'WEI',cha:'CHA'};

const SKILLS = {
  acr:['Akrobatik','dex'], arc:['Arkane Kunde','int'], ath:['Athletik','str'], prf:['Auftreten','cha'],
  itm:['Einschüchtern','cha'], slt:['Fingerfertigkeit','dex'], his:['Geschichte','int'], med:['Heilkunde','wis'],
  ste:['Heimlichkeit','dex'], ani:['Mit Tieren umgehen','wis'], ins:['Motiv erkennen','wis'], inv:['Nachforschungen','int'],
  nat:['Naturkunde','int'], rel:['Religion','int'], dec:['Täuschen','cha'], sur:['Überlebenskunst','wis'],
  per:['Überzeugen','cha'], prc:['Wahrnehmung','wis']
};
const ALL_SKILLS = Object.keys(SKILLS);

/* Zauberplätze */
const FULL_SLOTS = [null,[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const T = (arr) => (lvl) => arr[Math.min(20,Math.max(1,lvl))-1];
const PREP_FULL = T([4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22]);
const PREP_SOR  = T([2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22]);
const PREP_WLK  = T([2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]);
const PREP_WIZ  = T([4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25]);
const PREP_HALF = T([2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15]);
const step = (base, steps) => (lvl) => { let v = base; for (const [l,n] of steps) if (lvl>=l) v=n; return v; };

/* ---------- Klassen ---------- */
const CLASSES = {
 bar:{ name:'Barbar', hd:12, prim:['str'], saves:['str','con'], skillN:2,
  skills:['ani','ath','itm','nat','prc','sur'], armor:['light','medium','shield'], weapons:'martial',
  mastery: step(2,[[4,3],[10,4]]),
  asi:[4,8,12,16], sub:{ id:'berserker', name:'Pfad des Berserkers', lv:[3,6,10,14] },
  table:(l)=>[['Kampfrausch', step(2,[[3,3],[6,4],[12,5],[17,6]])(l)+'×'],['Rauschschaden','+'+step(2,[[9,3],[16,4]])(l)],['Waffenmeisterschaften',step(2,[[4,3],[10,4]])(l)]],
  res:(l,c)=>[{k:'rage',n:'Kampfrausch',max:step(2,[[3,3],[6,4],[12,5],[17,6]])(l),reset:'long',note:'1 Nutzung zurück bei kurzer Rast'}].concat(l>=14?[{k:'ip',n:'Einschüchternde Präsenz',max:1,reset:'long'}]:[]).concat(l>=15?[{k:'pr',n:'Beharrlicher Kampfrausch',max:1,reset:'long'}]:[]),
  feats:[
   [1,'Kampfrausch','Als Bonusaktion ohne schwere Rüstung: Resistenz gegen Wucht-, Stich- und Hiebschaden, Bonusschaden bei Angriffen mit Stärke, Vorteil auf Stärkewürfe und -rettungswürfe. Keine Zauber und keine Konzentration. Hält bis zum Ende deines nächsten Zuges und verlängert sich, wenn du angreifst, einen Rettungswurf erzwingst oder eine Bonusaktion nutzt (max. 10 Minuten). Kurze Rast: 1 Nutzung zurück, lange Rast: alle.'],
   [1,'Ungerüstete Verteidigung','Ohne Rüstung ist deine RK 10 + GES + KON. Ein Schild ist erlaubt.'],
   [1,'Waffenmeisterschaft','Du nutzt die Meisterschaftseigenschaft von so vielen Waffen, wie die Tabelle angibt. Nach einer langen Rast kannst du eine austauschen.'],
   [2,'Gefahrengespür','Vorteil auf Geschicklichkeitsrettungswürfe, solange du nicht kampfunfähig bist.'],
   [2,'Tollkühner Angriff','Vor deinem ersten Angriff im Zug: Du hast in diesem Zug Vorteil auf Angriffe mit Stärke, dafür haben Angriffe gegen dich bis zu deinem nächsten Zug Vorteil.'],
   [3,'Urwissen','Eine zusätzliche Fertigkeit aus der Barbarenliste. Im Kampfrausch darfst du für Akrobatik, Einschüchtern, Heimlichkeit, Wahrnehmung und Überlebenskunst Stärke verwenden.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [5,'Schnelle Bewegung','+3 m Bewegungsrate, solange du keine schwere Rüstung trägst.'],
   [7,'Wilder Instinkt','Vorteil auf Initiativewürfe.'],
   [7,'Instinktives Anspringen','Wenn du den Kampfrausch beginnst, darfst du dich bis zur Hälfte deiner Bewegungsrate bewegen.'],
   [9,'Brutaler Schlag','Verzichtest du beim Tollkühnen Angriff auf den Vorteil, verursacht ein Treffer mit Stärke zusätzlich 1W10 Schaden, und du wählst einen Effekt: Wuchtschlag (4,5 m wegstossen, du darfst nachrücken) oder Sehnenschnitt (Ziel −4,5 m Bewegung).'],
   [11,'Unbändiger Kampfrausch','Fällst du im Kampfrausch auf 0 TP, KON-Rettungswurf SG 10 (+5 pro weiterer Nutzung bis zur Rast): Bei Erfolg hast du stattdessen TP in Höhe des Doppelten deiner Barbarenstufe.'],
   [13,'Verbesserter Brutaler Schlag','Neue Effekte: Erschütternder Schlag (Ziel hat Nachteil beim nächsten Rettungswurf) und Zerreissender Schlag (nächster Angriff eines Verbündeten gegen das Ziel +5).'],
   [15,'Beharrlicher Kampfrausch','Bei der Initiative erhältst du einmal pro langer Rast alle Kampfrausch-Nutzungen zurück. Dein Kampfrausch hält 10 Minuten ohne Verlängerung.'],
   [17,'Verbesserter Brutaler Schlag II','Brutaler Schlag macht +2W10 und du darfst zwei Effekte kombinieren.'],
   [18,'Unbezwingbare Stärke','Ist das Ergebnis einer Stärkeprobe oder eines Stärkerettungswurfs niedriger als dein Stärkewert, zählt stattdessen dein Stärkewert.'],
   [20,'Urgewalt','Stärke und Konstitution +4, Maximum 25.']
  ],
  subFeats:[
   [3,'Raserei','Nutzt du im Kampfrausch Tollkühnen Angriff, verursacht dein erster Treffer im Zug zusätzlich so viele W6 Schaden, wie dein Kampfrausch-Schadensbonus beträgt.'],
   [6,'Geistloser Kampfrausch','Im Kampfrausch bist du immun gegen die Zustände bezaubert und verängstigt; bestehen sie bereits, enden sie, sobald du in Kampfrausch gerätst.'],
   [10,'Vergeltung','Wenn dich eine Kreatur in 1,5 m schädigt, darfst du als Reaktion einen Nahkampfangriff gegen sie machen.'],
   [14,'Einschüchternde Präsenz','Bonusaktion: Kreaturen deiner Wahl in 9 m machen einen WEI-Rettungswurf (SG 8 + STÄ + ÜB) oder sind 1 Minute verängstigt. 1× pro langer Rast, danach gegen eine Kampfrausch-Nutzung.']
  ]},
 brd:{ name:'Barde', hd:8, prim:['cha'], saves:['dex','cha'], skillN:3, skills:ALL_SKILLS, armor:['light'], weapons:'simple',
  caster:'full', ability:'cha', cantrips:step(2,[[4,3],[10,4]]), prepared:PREP_FULL, asi:[4,8,12,16],
  expertise:[[2,2],[9,2]], sub:{ id:'lore', name:'Schule des Wissens', lv:[3,6,14], extraSkills:3 },
  table:(l)=>[['Inspirationswürfel','W'+step(6,[[5,8],[10,10],[15,12]])(l)]],
  res:(l,c)=>[{k:'insp',n:'Bardische Inspiration (W'+step(6,[[5,8],[10,10],[15,12]])(l)+')',max:Math.max(1,c.mod.cha),reset:l>=5?'short':'long'}],
  feats:[
   [1,'Bardische Inspiration','Bonusaktion: Eine Kreatur in 18 m erhält einen Inspirationswürfel. Innerhalb einer Stunde darf sie ihn nach einem misslungenen W20-Wurf addieren. Nutzungen = CHA-Mod (mind. 1) pro langer Rast.'],
   [1,'Zauberwirken','Charisma ist dein Zauberattribut. Ein Musikinstrument kannst du als Zauberfokus nutzen.'],
   [2,'Expertise','Doppelter Übungsbonus in zwei Fertigkeiten, in denen du geübt bist.'],
   [2,'Alleskönner','Bei Attributswürfen ohne Übung addierst du den halben Übungsbonus (abgerundet).'],
   [5,'Quelle der Inspiration','Inspiration kommt auch bei kurzer Rast zurück. Du kannst einen Zauberplatz ausgeben, um eine Nutzung zurückzuerhalten.'],
   [7,'Gegenbezauberung','Reaktion: Misslingt einer Kreatur in 9 m ein Rettungswurf gegen bezaubert oder verängstigt, darf sie ihn mit Vorteil wiederholen.'],
   [9,'Expertise','Zwei weitere Fertigkeiten mit Expertise.'],
   [10,'Magische Geheimnisse','Du darfst Zauber aus den Listen von Barde, Kleriker, Druide und Magier vorbereiten.'],
   [18,'Überlegene Inspiration','Bei der Initiative füllst du auf mindestens 2 Inspirationen auf.'],
   [20,'Worte der Schöpfung','Machtwort Heilen und Machtwort Töten sind immer vorbereitet und können ein zweites Ziel treffen.']
  ],
  subFeats:[
   [3,'Zusätzliche Übungen','Übung in drei Fertigkeiten deiner Wahl.'],
   [3,'Schneidende Worte','Reaktion: Ziehe einen Inspirationswurf von einem Angriff, Schadenswurf oder Attributswurf einer Kreatur in 18 m ab.'],
   [6,'Magische Entdeckungen','Zwei Zauber aus den Listen von Kleriker, Druide oder Magier sind für dich immer vorbereitet.'],
   [14,'Unvergleichliches Können','Misslingt dir ein Attributswurf oder Angriff, darfst du einen eigenen Inspirationswürfel addieren; scheiterst du trotzdem, ist er nicht verbraucht.']
  ]},
 cle:{ name:'Kleriker', hd:8, prim:['wis'], saves:['wis','cha'], skillN:2, skills:['his','ins','med','per','rel'], armor:['light','medium','shield'], weapons:'simple',
  caster:'full', ability:'wis', cantrips:step(3,[[4,4],[10,5]]), prepared:PREP_FULL, asi:[4,8,12,16],
  order:{ key:'divineOrder', label:'Göttliche Ordnung', opts:{ protector:['Beschützer','Übung mit Kriegswaffen und schwerer Rüstung.'], thaumaturge:['Thaumaturg','Ein zusätzlicher Zaubertrick; WEI-Mod (mind. +1) zusätzlich auf Arkane Kunde und Religion.'] } },
  sub:{ id:'life', name:'Domäne des Lebens', lv:[3,6,17],
   spells:{3:['aid','bless','cure-wounds','lesser-restoration'],5:['mass-healing-word','revivify'],7:['aura-of-life','death-ward'],9:['greater-restoration','mass-cure-wounds']} },
  table:(l)=>[['Göttliche Macht fokussieren',l>=2?step(2,[[6,3],[18,4]])(l)+'×':'—'],['Göttlicher Funke',l>=2?step(1,[[7,2],[13,3],[18,4]])(l)+'W8':'—']],
  res:(l,c)=> l>=2?[{k:'cd',n:'Göttliche Macht fokussieren',max:step(2,[[6,3],[18,4]])(l),reset:'long',note:'1 Nutzung zurück bei kurzer Rast'}].concat(l>=10?[{k:'di',n:'Göttliches Eingreifen',max:1,reset:'long'}]:[]):[],
  feats:[
   [1,'Zauberwirken','Weisheit ist dein Zauberattribut. Ein heiliges Symbol dient als Fokus.'],
   [1,'Göttliche Ordnung','Wähle Beschützer oder Thaumaturg.'],
   [2,'Göttliche Macht fokussieren','Göttlicher Funke: Magieaktion, eine Kreatur in 9 m wird geheilt oder erleidet gleissenden/nekrotischen Schaden (KON-Rettungswurf halbiert), Würfel siehe Tabelle + WEI-Mod. Untote vertreiben: Untote in 9 m machen einen WEI-Rettungswurf oder sind 1 Minute verängstigt und kampfunfähig.'],
   [5,'Untote versengen','Wenn du Untote vertreibst, erleidet jeder betroffene Untote WEI-Mod × W8 gleissenden Schaden.'],
   [7,'Gesegnete Schläge','Göttlicher Schlag (+1W8 gleissend oder nekrotisch, 1× pro Zug bei Waffentreffer) oder Mächtige Zauberei (+WEI-Mod Schaden auf Kleriker-Zaubertricks).'],
   [10,'Göttliches Eingreifen','Magieaktion: Wirke einen Klerikerzauber bis Grad 5 ohne Zauberplatz. 1× pro langer Rast.'],
   [14,'Verbesserte Gesegnete Schläge','Göttlicher Schlag 2W8, bzw. Mächtige Zauberei gewährt zusätzlich temporäre TP.'],
   [20,'Grösseres Göttliches Eingreifen','Mit Göttlichem Eingreifen kannst du auch Wunsch wirken. Danach kannst du es erst nach 2W4 langen Rasten wieder nutzen.']
  ],
  subFeats:[
   [3,'Jünger des Lebens','Heilt ein Zauber, für den du einen Zauberplatz verwendest, stellt er zusätzlich 2 + Zaubergrad TP wieder her.'],
   [3,'Bewahrung des Lebens','Göttliche Macht fokussieren: Verteile 5 × Klerikerstufe TP auf Kreaturen in 9 m (höchstens bis zur Hälfte ihres Maximums).'],
   [3,'Domänenzauber','Diese Zauber sind immer vorbereitet: Beistand, Segnen, Wunden heilen, Schwache Genesung (ab 5: Massen-Heilendes Wort, Wiederbeleben; ab 7: Aura des Lebens, Todesschutz; ab 9: Mächtige Genesung, Massen-Wunden heilen).'],
   [6,'Gesegneter Heiler','Wenn du mit einem Zauberplatz andere heilst, erhältst du selbst 2 + Zaubergrad TP.'],
   [17,'Überragende Heilung','Bei Heilwürfeln nimmst du immer den Maximalwert.']
  ]},
 dru:{ name:'Druide', hd:8, prim:['wis'], saves:['int','wis'], skillN:2, skills:['arc','ani','ins','med','nat','prc','rel','sur'], armor:['light','shield'], weapons:'simple',
  caster:'full', ability:'wis', cantrips:step(2,[[4,3],[10,4]]), prepared:PREP_FULL, asi:[4,8,12,16],
  order:{ key:'primalOrder', label:'Ursprüngliche Ordnung', opts:{ magician:['Magier','Ein zusätzlicher Zaubertrick; WEI-Mod (mind. +1) zusätzlich auf Arkane Kunde und Naturkunde.'], warden:['Wächter','Übung mit Kriegswaffen und mittelschwerer Rüstung.'] } },
  sub:{ id:'land', name:'Zirkel des Landes', lv:[3,6,10,14] },
  table:(l)=>[['Tiergestalt',(l>=2?step(2,[[6,3],[17,4]])(l)+'×':'—')],['Max. HG',l>=8?'1':l>=4?'1/2':l>=2?'1/4':'—']],
  res:(l,c)=> l>=2?[{k:'ws',n:'Tiergestalt',max:step(2,[[6,3],[17,4]])(l),reset:'long',note:'1 Nutzung zurück bei kurzer Rast'}].concat(l>=5?[{k:'wr',n:'Wildes Wiederaufleben (Tiergestalt → Platz)',max:1,reset:'long'}]:[]).concat(l>=6?[{k:'nr',n:'Natürliche Erholung (Plätze)',max:1,reset:'long'},{k:'nrs',n:'Kreiszauber ohne Platz',max:1,reset:'long'}]:[]):[],
  feats:[
   [1,'Zauberwirken','Weisheit ist dein Zauberattribut. Ein Druidenfokus dient als Fokus.'],
   [1,'Druidisch','Du kennst die Geheimsprache der Druiden. Mit Tieren sprechen ist immer vorbereitet.'],
   [1,'Ursprüngliche Ordnung','Wähle Magier oder Wächter.'],
   [2,'Tiergestalt','Bonusaktion: Verwandle dich in ein Tier, das du gesehen hast (höchster HG siehe Tabelle, Tiere mit Flugbewegung ab Stufe 8). Dauer: halbe Druidenstufe in Stunden. Du erhältst temporäre TP in Höhe deiner Stufe.'],
   [2,'Tierbegleiter','Gib eine Tiergestalt oder einen Zauberplatz aus, um Vertrauten finden ohne Material zu wirken.'],
   [5,'Wildes Wiederaufleben','Hast du keine Tiergestalt mehr, kannst du einen Zauberplatz ausgeben, um eine zurückzuerhalten. Einmal pro langer Rast kannst du eine Tiergestalt in einen Grad-1-Platz umwandeln.'],
   [7,'Elementare Wut','Mächtige Zauberei (+WEI-Mod Schaden auf Druiden-Zaubertricks) oder Urtümlicher Schlag (einmal pro Zug +1W8 Kälte-, Feuer-, Blitz- oder Schallschaden).'],
   [15,'Verbesserte Elementare Wut','Die Reichweite deiner Zaubertricks (ab 3 m) steigt um 90 m, bzw. Urtümlicher Schlag verursacht 2W8.'],
   [18,'Bestienzauber','Du kannst in Tiergestalt Zauber wirken.'],
   [20,'Erzdruide','Bei der Initiative erhältst du eine Tiergestalt zurück. Du kannst Tiergestalten in Zauberplätze umwandeln. Du alterst nur noch langsam.']
  ],
  subFeats:[
   [3,'Kreiszauber','Wähle eine Landschaft (Trocken, Polar, Gemässigt, Tropisch); ihre Zauber sind immer vorbereitet.'],
   [3,'Hilfe des Landes','Gib eine Tiergestalt aus: In einer 3-m-Kugel bis 18 m erleiden Feinde 2W6 nekrotischen Schaden (KON-Rettungswurf halbiert), eine Kreatur heilt 2W6 (3W6 ab 10, 4W6 ab 14).'],
   [6,'Natürliche Erholung','Einen deiner Kreiszauber ab Grad 1 kannst du 1× pro langer Rast ohne Zauberplatz wirken. Ausserdem stellst du 1× pro langer Rast bei einer kurzen Rast Zauberplätze wieder her (Gesamtgrad bis zur halben Stufe, aufgerundet, keiner ab Grad 6).'],
   [10,'Schutz der Natur','Immun gegen vergiftet; Resistenz gegen eine Schadensart deiner Landschaft.'],
   [14,'Heiligtum der Natur','Magieaktion, gib eine Tiergestalt aus: Ein 4,5-m-Würfel aus Geisterbäumen erscheint in 36 m (1 Minute). Du und Verbündete darin habt halbe Deckung, Verbündete auch die Resistenz deines Schutzes der Natur. Als Bonusaktion verschiebst du den Würfel um bis zu 18 m.']
  ]},
 fig:{ name:'Kämpfer', hd:10, prim:['str','dex'], saves:['str','con'], skillN:2, skills:['acr','ani','ath','his','ins','itm','per','prc','sur'], armor:['light','medium','heavy','shield'], weapons:'martial',
  mastery: step(3,[[4,4],[10,5],[16,6]]), fightingStyle:1, asi:[4,6,8,12,14,16],
  sub:{ id:'champion', name:'Champion', lv:[3,7,10,15,18] },
  table:(l)=>[['Zweiter Atem',step(2,[[4,3],[10,4]])(l)+'×'],['Tatendrang',l>=17?'2×':l>=2?'1×':'—'],['Unbeugsam',l>=17?'3×':l>=13?'2×':l>=9?'1×':'—'],['Angriffe',step(1,[[5,2],[11,3],[20,4]])(l)],['Waffenmeisterschaften',step(3,[[4,4],[10,5],[16,6]])(l)]],
  res:(l,c)=>{ const r=[{k:'sw',n:'Zweiter Atem (1W10+'+l+')',max:step(2,[[4,3],[10,4]])(l),reset:'long',note:'1 Nutzung zurück bei kurzer Rast'}];
    if(l>=2) r.push({k:'as',n:'Tatendrang',max:l>=17?2:1,reset:'short'});
    if(l>=9) r.push({k:'ind',n:'Unbeugsam',max:step(1,[[13,2],[17,3]])(l),reset:'long'}); return r; },
  feats:[
   [1,'Kampfstil','Du erhältst ein Kampfstil-Talent.'],
   [1,'Zweiter Atem','Bonusaktion: Erhalte 1W10 + Kämpferstufe TP zurück.'],
   [1,'Waffenmeisterschaft','Du nutzt die Meisterschaft so vieler Waffen, wie die Tabelle angibt.'],
   [2,'Tatendrang','Einmal pro Zug erhältst du eine zusätzliche Aktion (keine Magieaktion). Zurück bei kurzer Rast.'],
   [2,'Taktischer Verstand','Misslingt dir ein Attributswurf, darfst du einen Zweiten Atem ausgeben und 1W10 addieren. Klappt es nicht, ist er nicht verbraucht.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [5,'Taktische Verschiebung','Nutzt du Zweiten Atem, darfst du dich bis zur halben Bewegungsrate bewegen, ohne Gelegenheitsangriffe auszulösen.'],
   [9,'Unbeugsam','Misslingt ein Rettungswurf, darfst du ihn mit Bonus in Höhe deiner Kämpferstufe wiederholen.'],
   [9,'Taktischer Meister','Beim Angriff darfst du die Meisterschaft deiner Waffe durch Stoss, Schwächen oder Verlangsamen ersetzen.'],
   [11,'Zwei zusätzliche Angriffe','Mit der Angriffsaktion greifst du dreimal an.'],
   [13,'Studierte Angriffe','Verfehlst du eine Kreatur, hast du beim nächsten Angriff gegen sie Vorteil.'],
   [20,'Drei zusätzliche Angriffe','Mit der Angriffsaktion greifst du viermal an.']
  ],
  subFeats:[
   [3,'Verbesserter kritischer Treffer','Deine Angriffe mit Waffen und waffenlosen Schlägen sind bei einer gewürfelten 19 oder 20 kritische Treffer.'],
   [3,'Bemerkenswerter Athlet','Vorteil auf Initiative und Athletik. Nach einem kritischen Treffer darfst du dich bis zur halben Bewegung bewegen, ohne Gelegenheitsangriffe auszulösen.'],
   [7,'Zusätzlicher Kampfstil','Ein weiteres Kampfstil-Talent.'],
   [10,'Heldenhafter Krieger','Im Kampf erhältst du zu Beginn deines Zuges Heldeninspiration, falls du keine hast.'],
   [15,'Überlegener kritischer Treffer','Kritische Treffer schon bei einer gewürfelten 18–20.'],
   [18,'Überlebender','Vorteil auf Todesrettungswürfe; eine 18–20 zählt als 20. Bei höchstens halben TP erhältst du zu Beginn deines Zuges 5 + KON-Mod TP zurück.']
  ]},
 mon:{ name:'Mönch', hd:8, prim:['dex','wis'], saves:['str','dex'], skillN:2, skills:['acr','ath','his','ins','rel','ste'], armor:[], weapons:'monk',
  asi:[4,8,12,16], sub:{ id:'openhand', name:'Krieger der offenen Hand', lv:[3,6,11,17] },
  table:(l)=>[['Kampfkunst','W'+step(6,[[5,8],[11,10],[17,12]])(l)],['Fokuspunkte',l>=2?l:'—'],['Ungerüstete Bewegung',l>=2?'+'+fmtM(step(3,[[6,4.5],[10,6],[14,7.5],[18,9]])(l)):'—']],
  res:(l,c)=> l>=2?[{k:'focus',n:'Fokuspunkte',max:l,reset:'short'},{k:'um',n:'Unheimlicher Stoffwechsel',max:1,reset:'long'}].concat(l>=3&&c.char.subclass!==false&&l>=6?[{k:'wob',n:'Ganzheit des Körpers',max:Math.max(1,c.mod.wis),reset:'long'}]:[]):[],
  feats:[
   [1,'Kampfkunst','Ohne Rüstung und Schild: Waffenlose Schläge und Mönchswaffen nutzen den Kampfkunstwürfel und wahlweise GES. Als Bonusaktion ein waffenloser Schlag.'],
   [1,'Ungerüstete Verteidigung','Ohne Rüstung und Schild ist deine RK 10 + GES + WEI.'],
   [2,'Mönchsfokus','Fokuspunkte = Mönchsstufe, zurück bei kurzer Rast. Schlaghagel (1 Punkt: zwei waffenlose Schläge als Bonusaktion), Geduldige Verteidigung (Rückzug als Bonusaktion; mit 1 Punkt auch Ausweichen), Schritt des Windes (Spurt als Bonusaktion; mit 1 Punkt auch Rückzug, doppelte Sprungweite).'],
   [2,'Ungerüstete Bewegung','Ohne Rüstung und Schild steigt deine Bewegungsrate (siehe Tabelle).'],
   [2,'Unheimlicher Stoffwechsel','Wenn du Initiative würfelst, erhältst du alle Fokuspunkte zurück und heilst Kampfkunstwürfel + Mönchsstufe TP. Einmal pro langer Rast.'],
   [3,'Angriffe abwehren','Reaktion: Reduziere Wucht-, Stich- oder Hiebschaden um 1W10 + GES + Mönchsstufe. Sinkt der Schaden auf 0, kannst du 1 Fokuspunkt ausgeben, um den Angriff auf eine andere Kreatur umzulenken.'],
   [4,'Langsamer Fall','Reaktion: Fallschaden um 5 × Mönchsstufe verringern.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [5,'Betäubender Schlag','Einmal pro Zug nach einem Treffer, 1 Fokus: KON-Rettungswurf oder betäubt bis zum Beginn deines nächsten Zuges (bei Erfolg halbe Bewegung, Vorteil gegen das Ziel).'],
   [6,'Ermächtigte Schläge','Deine waffenlosen Schläge dürfen Energieschaden verursachen.'],
   [7,'Entrinnen','Bei GES-Rettungswürfen für halben Schaden: Erfolg = kein Schaden, Misserfolg = halber Schaden.'],
   [9,'Akrobatische Bewegung','Du kannst während deines Zuges senkrechte Flächen und Flüssigkeiten entlanglaufen.'],
   [10,'Gesteigerter Fokus','Schlaghagel: drei Schläge; Geduldige Verteidigung gibt temporäre TP; Schritt des Windes nimmt eine Kreatur mit.'],
   [10,'Selbstwiederherstellung','Am Ende deines Zuges kannst du den Zustand bezaubert, verängstigt oder vergiftet bei dir beenden.'],
   [13,'Energie ablenken','Angriffe abwehren wirkt gegen jede Schadensart.'],
   [14,'Disziplinierter Überlebender','Übung in allen Rettungswürfen. Für 1 Fokus darfst du einen misslungenen Rettungswurf wiederholen.'],
   [15,'Vollkommener Fokus','Bei der Initiative füllst du auf 4 Fokuspunkte auf, wenn du weniger hast.'],
   [18,'Überlegene Verteidigung','Für 3 Fokuspunkte hast du 1 Minute lang Resistenz gegen alle Schadensarten ausser Energie.'],
   [20,'Körper und Geist','Geschicklichkeit und Weisheit +4, Maximum 25.']
  ],
  subFeats:[
   [3,'Technik der offenen Hand','Triffst du mit Schlaghagel, wähle: Das Ziel kann bis zum Beginn seines nächsten Zuges keine Gelegenheitsangriffe machen, oder es wird bei misslungenem STÄ-Rettungswurf 4,5 m weggestossen, oder es fällt bei misslungenem GES-Rettungswurf hin.'],
   [6,'Ganzheit des Körpers','Bonusaktion: Heile Kampfkunstwürfel + WEI-Mod TP. Nutzungen = WEI-Mod pro langer Rast.'],
   [11,'Flinker Schritt','Nutzt du eine andere Bonusaktion, darfst du zusätzlich Schritt des Windes einsetzen.'],
   [17,'Bebende Handfläche','Für 3 Fokuspunkte bei einem Treffer setzt du tödliche Schwingungen frei. Später kannst du sie auslösen: KON-Rettungswurf, 10W12 Energieschaden, bei Erfolg die Hälfte.']
  ]},
 pal:{ name:'Paladin', hd:10, prim:['str','cha'], saves:['wis','cha'], skillN:2, skills:['ath','ins','itm','med','per','rel'], armor:['light','medium','heavy','shield'], weapons:'martial',
  caster:'half', ability:'cha', cantrips:()=>0, prepared:PREP_HALF, mastery:()=>2, fightingStyle:2, asi:[4,8,12,16],
  always:{2:['divine-smite'],5:['find-steed']},
  sub:{ id:'devotion', name:'Eid der Hingabe', lv:[3,7,15,20],
   spells:{3:['protection-from-evil-and-good','shield-of-faith'],5:['aid','zone-of-truth'],9:['beacon-of-hope','dispel-magic'],13:['freedom-of-movement','guardian-of-faith'],17:['commune','flame-strike']} },
  table:(l)=>[['Handauflegen',5*l+' TP'],['Göttliche Macht fokussieren',l>=3?(l>=11?3:2)+'×':'—'],['Aura',l>=6?fmtM(l>=18?9:3):'—']],
  res:(l,c)=>{ const r=[{k:'loh',n:'Handauflegen (Pool)',max:5*l,reset:'long',pool:true}];
    if(l>=2) r.push({k:'smite',n:'Freies Göttliches Niederstrecken',max:1,reset:'long'});
    if(l>=3) r.push({k:'pcd',n:'Göttliche Macht fokussieren (Paladin)',max:l>=11?3:2,reset:'long',note:'1 Nutzung zurück bei kurzer Rast'});
    if(l>=5) r.push({k:'steed',n:'Freies Ross finden',max:1,reset:'long'});
    if(l>=20) r.push({k:'nimbus',n:'Heiliger Nimbus',max:1,reset:'long'}); return r; },
  feats:[
   [1,'Handauflegen','Bonusaktion: Heile aus einem Pool von 5 × Paladinstufe TP. Für 5 Punkte kannst du stattdessen den Zustand vergiftet beenden.'],
   [1,'Zauberwirken','Charisma ist dein Zauberattribut. Ein heiliges Symbol dient als Fokus.'],
   [1,'Waffenmeisterschaft','Meisterschaft von zwei Waffen deiner Wahl.'],
   [2,'Kampfstil','Ein Kampfstil-Talent (oder: Gesegneter Krieger – zwei Kleriker-Zaubertricks).'],
   [2,'Niederstrecken des Paladins','Göttliches Niederstrecken ist immer vorbereitet; einmal pro langer Rast ohne Zauberplatz.'],
   [3,'Göttliche Macht fokussieren','Göttlicher Sinn: Bonusaktion, 10 Minuten spürst du Himmlische, Unholde und Untote in 18 m. Weitere Optionen über deinen Eid.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [5,'Treues Reittier','Ross finden ist immer vorbereitet; einmal pro langer Rast ohne Zauberplatz.'],
   [6,'Aura des Schutzes','Du und Verbündete in 3 m addieren deinen CHA-Mod (mind. +1) auf Rettungswürfe.'],
   [9,'Feinde vertreiben','Göttliche Macht fokussieren: Bis zu CHA-Mod Kreaturen in 18 m machen einen WEI-Rettungswurf oder sind 1 Minute verängstigt.'],
   [10,'Aura des Mutes','Du und Verbündete in deiner Aura sind immun gegen verängstigt.'],
   [11,'Strahlende Schläge','Nahkampf- und waffenlose Treffer machen +1W8 gleissenden Schaden.'],
   [14,'Wiederherstellende Berührung','Für 5 Punkte Handauflegen beendest du einen dieser Zustände: blind, bezaubert, taub, verängstigt, gelähmt oder betäubt.'],
   [18,'Aura-Ausdehnung','Deine Auren reichen 9 m weit.']
  ],
  subFeats:[
   [3,'Eidzauber','Immer vorbereitet: Schutz vor Gut und Böse, Schild des Glaubens (ab 5: Beistand, Zone der Wahrheit; ab 9: Leuchtfeuer der Hoffnung, Magie bannen; ab 13: Bewegungsfreiheit, Wächter des Glaubens; ab 17: Kommunion, Flammenschlag).'],
   [3,'Heilige Waffe','Göttliche Macht fokussieren, wenn du angreifst: 10 Minuten lang addierst du deinen CHA-Mod auf Angriffe mit einer Nahkampfwaffe. Die Waffe leuchtet und darf gleissenden Schaden verursachen.'],
   [7,'Aura der Hingabe','Du und Verbündete in deiner Aura sind immun gegen bezaubert.'],
   [15,'Schutzschlag','Wirkst du Göttliches Niederstrecken, haben du und Verbündete in der Aura bis zu deinem nächsten Zug halbe Deckung.'],
   [20,'Heiliger Nimbus','Bonusaktion, 10 Minuten: Deine Aura erstrahlt in hellem Licht, Feinde darin erleiden zu Beginn ihres Zuges CHA-Mod + ÜB gleissenden Schaden, du hast Vorteil gegen Zauber von Unholden und Untoten. 1× pro langer Rast.']
  ]},
 ran:{ name:'Waldläufer', hd:10, prim:['dex','wis'], saves:['str','dex'], skillN:3, skills:['ani','ath','ins','inv','nat','prc','ste','sur'], armor:['light','medium','shield'], weapons:'martial',
  caster:'half', ability:'wis', cantrips:()=>0, prepared:PREP_HALF, mastery:()=>2, fightingStyle:2, asi:[4,8,12,16],
  expertise:[[2,1],[9,2]], always:{1:['hunters-mark']},
  sub:{ id:'hunter', name:'Jäger', lv:[3,7,11,15] },
  table:(l)=>[['Bevorzugter Feind',step(2,[[5,3],[9,4],[13,5],[17,6]])(l)+'×'],['Mal des Jägers','1'+(l>=20?'W10':'W6')]],
  res:(l,c)=>[{k:'fe',n:'Freies Mal des Jägers',max:step(2,[[5,3],[9,4],[13,5],[17,6]])(l),reset:'long'}].concat(l>=10?[{k:'tire',n:'Unermüdlich',max:Math.max(1,c.mod.wis),reset:'long'}]:[]).concat(l>=14?[{k:'veil',n:'Naturschleier',max:Math.max(1,c.mod.wis),reset:'long'}]:[]),
  feats:[
   [1,'Zauberwirken','Weisheit ist dein Zauberattribut. Ein Druidenfokus dient als Fokus.'],
   [1,'Bevorzugter Feind','Mal des Jägers ist immer vorbereitet und mehrmals pro langer Rast ohne Zauberplatz wirkbar (Tabelle).'],
   [1,'Waffenmeisterschaft','Meisterschaft von zwei Waffen deiner Wahl.'],
   [2,'Geschickter Entdecker','Expertise in einer Fertigkeit, in der du geübt bist; zwei zusätzliche Sprachen.'],
   [2,'Kampfstil','Ein Kampfstil-Talent (oder: Druidischer Krieger – zwei Druiden-Zaubertricks).'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [6,'Umherstreifen','+3 m Bewegungsrate ohne schwere Rüstung; Klettern und Schwimmen mit voller Bewegungsrate.'],
   [9,'Expertise','Zwei weitere Fertigkeiten mit Expertise.'],
   [10,'Unermüdlich','Magieaktion: 1W8 + WEI-Mod temporäre TP (WEI-Mod pro langer Rast). Kurze Rast senkt Erschöpfung um 1.'],
   [13,'Unerbittlicher Jäger','Schaden bricht deine Konzentration auf Mal des Jägers nicht.'],
   [14,'Naturschleier','Bonusaktion: Unsichtbar bis zum Ende deines nächsten Zuges (WEI-Mod pro langer Rast).'],
   [17,'Präziser Jäger','Vorteil auf Angriffe gegen das Ziel deines Mals des Jägers.'],
   [18,'Wilde Sinne','Blindsicht 9 m.'],
   [20,'Feindvernichter','Der Schaden von Mal des Jägers wird zu W10.']
  ],
  subFeats:[
   [3,'Jägerwissen','Gegen das Ziel deines Mals erkennst du Immunitäten, Resistenzen und Verwundbarkeiten.'],
   [3,'Beute des Jägers','Kolossjäger (+1W8 einmal pro Zug gegen verletzte Ziele) oder Hordenbrecher (ein zusätzlicher Angriff gegen eine zweite Kreatur in 1,5 m). Nach jeder Rast austauschbar.'],
   [7,'Defensive Taktik','Der Horde entkommen (Gelegenheitsangriffe gegen dich mit Nachteil) oder Mehrfachangriffsverteidigung (nach einem Treffer weitere Angriffe derselben Kreatur mit Nachteil).'],
   [11,'Überlegene Jägerbeute','Einmal pro Zug darfst du den Schaden von Mal des Jägers auch einer zweiten Kreatur in 9 m zufügen.'],
   [15,'Überlegene Jägerverteidigung','Reaktion, wenn du Schaden nimmst: Resistenz gegen diesen und gleichartigen Schaden bis Ende des Zuges.']
  ]},
 rog:{ name:'Schurke', hd:8, prim:['dex'], saves:['dex','int'], skillN:4, skills:['acr','ath','dec','ins','itm','inv','prc','per','slt','ste'], armor:['light'], weapons:'rogue',
  mastery:()=>2, asi:[4,8,10,12,16], expertise:[[1,2],[6,2]],
  sub:{ id:'thief', name:'Dieb', lv:[3,9,13,17] },
  table:(l)=>[['Hinterhältiger Angriff',Math.ceil(l/2)+'W6']],
  res:(l,c)=> l>=20?[{k:'luck',n:'Glückstreffer',max:1,reset:'short'}]:[],
  feats:[
   [1,'Expertise','Doppelter Übungsbonus in zwei Fertigkeiten, in denen du geübt bist.'],
   [1,'Hinterhältiger Angriff','Einmal pro Zug Zusatzschaden (W6 laut Tabelle) mit Finesse- oder Fernkampfwaffe, wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht (und du keinen Nachteil hast).'],
   [1,'Diebessprache','Du kennst die geheime Zeichen- und Sprechsprache der Diebe.'],
   [1,'Waffenmeisterschaft','Meisterschaft von zwei Waffen deiner Wahl.'],
   [2,'Raffinierte Aktion','Bonusaktion: Spurt, Rückzug oder Verstecken.'],
   [3,'Ruhiges Zielen','Bonusaktion, wenn du dich noch nicht bewegt hast: Vorteil auf den nächsten Angriff, Bewegung 0.'],
   [5,'Gerissener Schlag','Du kannst auf Würfel deines Hinterhältigen Angriffs verzichten, um Effekte auszulösen: Gift (1W6, KON-RW oder vergiftet), Stolpern (1W6, GES-RW oder liegend), Rückzug (1W6, halbe Bewegung ohne Gelegenheitsangriffe).'],
   [5,'Unglaubliches Ausweichen','Reaktion: Halbiere den Schaden eines Angriffs, den du siehst.'],
   [6,'Expertise','Zwei weitere Fertigkeiten mit Expertise.'],
   [7,'Entrinnen','Bei GES-Rettungswürfen für halben Schaden: Erfolg = kein Schaden, Misserfolg = halber Schaden.'],
   [7,'Verlässliches Talent','Bei Würfen mit Übung zählt eine gewürfelte 9 oder weniger als 10.'],
   [11,'Verbesserter Gerissener Schlag','Zwei Effekte von Gerissener Schlag pro Angriff.'],
   [14,'Hinterhältige Schläge','Neue Effekte: Benommen (2W6), Bewusstlos schlagen (6W6), Verdunkeln (3W6, blind).'],
   [15,'Schlüpfriger Geist','Übung in Weisheits- und Charismarettungswürfen.'],
   [18,'Ungreifbar','Solange du nicht kampfunfähig bist, haben Angriffe gegen dich keinen Vorteil.'],
   [20,'Glückstreffer','Ein misslungener W20-Wurf wird zur 20. Zurück bei kurzer Rast.']
  ],
  subFeats:[
   [3,'Schnelle Finger','Bonusaktion: Fingerfertigkeit, Diebeswerkzeug oder Gegenstand benutzen.'],
   [3,'Fassadenkletterer','Kletterbewegung gleich deiner Bewegungsrate. Deine Sprungweite bestimmst du mit Geschicklichkeit statt Stärke.'],
   [9,'Meisterhafte Heimlichkeit','Neuer Gerissener Schlag: Heimlicher Angriff (1W6) – du bleibst nach dem Angriff verborgen, wenn du Deckung hast.'],
   [13,'Magische Gegenstände nutzen','Bis zu vier Einstimmungen; Schriftrollen mit INT wirken; verbrauchst du eine Ladung, würfle 1W6 – bei einer 6 bleibt sie erhalten.'],
   [17,'Diebesreflexe','In der ersten Kampfrunde zwei Züge (zweiter bei Initiative − 10).']
  ]},
 sor:{ name:'Zauberer', hd:6, prim:['cha'], saves:['con','cha'], skillN:2, skills:['arc','dec','ins','itm','per','rel'], armor:[], weapons:'simple',
  caster:'full', ability:'cha', cantrips:step(4,[[4,5],[10,6]]), prepared:PREP_SOR, asi:[4,8,12,16],
  sub:{ id:'draconic', name:'Drachenblut-Zauberei', lv:[3,6,14,18],
   spells:{3:['alter-self','chromatic-orb','command','dragons-breath'],5:['fear','fly'],7:['arcane-eye','charm-monster'],9:['legend-lore','summon-dragon']} },
  table:(l)=>[['Zaubereipunkte',l>=2?l:'—'],['Metamagie',l>=2?step(2,[[10,4],[17,6]])(l):'—']],
  res:(l,c)=>[{k:'is',n:'Angeborene Zauberei',max:2,reset:'long'}].concat(l>=2?[{k:'sp',n:'Zaubereipunkte',max:l,reset:'long'}]:[]).concat(l>=5?[{k:'sr',n:'Zauberische Erneuerung',max:1,reset:'long'}]:[]).concat(l>=14?[{k:'wings',n:'Drachenflügel',max:1,reset:'long'}]:[]).concat(l>=18?[{k:'dcomp',n:'Drachengefährte',max:1,reset:'long'}]:[]),
  feats:[
   [1,'Zauberwirken','Charisma ist dein Zauberattribut. Ein arkaner Fokus dient als Fokus.'],
   [1,'Angeborene Zauberei','Bonusaktion, 1 Minute: Zauber-SG +1 und Vorteil auf Zauberangriffe. 2× pro langer Rast.'],
   [2,'Quelle der Magie','Zaubereipunkte = Stufe. Als Bonusaktion wandelst du Punkte in Zauberplätze um (bis Grad 5). Ohne Aktion wandelst du einen Zauberplatz in so viele Punkte um, wie sein Grad beträgt.'],
   [2,'Metamagie','Zwei Optionen (4 ab Stufe 10, 6 ab 17), z. B. Vorsichtiger, Weitreichender, Ermächtigter, Verlängerter, Gesteigerter, Beschleunigter, Feinsinniger, Verwandelter, Gesuchter und Verdoppelter Zauber.'],
   [5,'Zauberische Erneuerung','Bei einer kurzen Rast bis zur halben Stufe Zaubereipunkte zurück, 1× pro langer Rast.'],
   [7,'Zaubereiverkörperung','Ohne Nutzungen kannst du Angeborene Zauberei für 2 Zaubereipunkte aktivieren; währenddessen zwei Metamagien pro Zauber.'],
   [20,'Arkane Apotheose','Während Angeborener Zauberei einmal pro Zug eine Metamagie ohne Kosten.']
  ],
  subFeats:[
   [3,'Drachische Widerstandskraft','TP-Maximum +1 pro Zaubererstufe. Ohne Rüstung ist deine RK 10 + GES + CHA.'],
   [3,'Drachenzauber','Immer vorbereitet: Selbstverwandlung, Chromatische Kugel, Befehl, Drachenodem (ab 5: Furcht, Fliegen; ab 7: Arkanes Auge, Monster bezaubern; ab 9: Legendenkunde, Drache beschwören).'],
   [6,'Elementare Affinität','Wähle eine Drachenschadensart: Resistenz dagegen und +CHA-Mod Schaden auf einen Wurf deiner Zauber dieser Art.'],
   [14,'Drachenflügel','Bonusaktion: 1 Stunde Flugbewegung 18 m. 1× pro langer Rast oder für 3 Zaubereipunkte.'],
   [18,'Drachengefährte','Drache beschwören ohne Materialkosten, einmal pro langer Rast ohne Zauberplatz und ohne Konzentration.']
  ]},
 wlk:{ name:'Hexenmeister', hd:8, prim:['cha'], saves:['wis','cha'], skillN:2, skills:['arc','dec','his','itm','inv','nat','rel'], armor:['light'], weapons:'simple',
  caster:'pact', ability:'cha', cantrips:step(2,[[4,3],[10,4]]), prepared:PREP_WLK, asi:[4,8,12,16],
  invocations: step(1,[[2,3],[5,5],[7,6],[9,7],[12,8],[15,9],[18,10]]),
  sub:{ id:'fiend', name:'Unhold-Schutzherr', lv:[3,6,10,14],
   spells:{3:['burning-hands','command','scorching-ray','suggestion'],5:['fireball','stinking-cloud'],7:['fire-shield','wall-of-fire'],9:['geas','insect-plague']} },
  table:(l)=>[['Paktplätze',pactSlots(l).n+'× Grad '+pactSlots(l).lvl],['Anrufungen',step(1,[[2,3],[5,5],[7,6],[9,7],[12,8],[15,9],[18,10]])(l)]],
  res:(l,c)=> (l>=2?[{k:'mc',n:'Magische Gerissenheit',max:1,reset:'long'}]:[]).concat(l>=6?[{k:'dol',n:'Glück des Dunklen',max:Math.max(1,c.mod.cha),reset:'long'}]:[]).concat(l>=9?[{k:'cp',n:'Mit Schutzherrn sprechen',max:1,reset:'long'}]:[]).concat(l>=14?[{k:'hth',n:'Durch die Hölle schleudern',max:1,reset:'long'}]:[]),
  feats:[
   [1,'Schauerliche Anrufungen','Du wählst Anrufungen (Anzahl siehe Tabelle) – magische Gaben deines Schutzherrn.'],
   [1,'Paktmagie','Charisma ist dein Zauberattribut. Deine Zauberplätze sind alle auf demselben Grad und kehren bei kurzer Rast zurück.'],
   [2,'Magische Gerissenheit','1 Minute Ritual: Bis zur Hälfte deiner Paktplätze zurück (aufgerundet). 1× pro langer Rast.'],
   [9,'Mit Schutzherrn sprechen','Kontakt zu anderen Ebenen einmal pro langer Rast ohne Zauberplatz; der Rettungswurf gelingt automatisch.'],
   [11,'Mystisches Arkanum','Je einen Zauber der Grade 6 (11), 7 (13), 8 (15) und 9 (17) kannst du 1× pro langer Rast ohne Platz wirken.'],
   [20,'Schauerlicher Meister','Magische Gerissenheit stellt alle Paktplätze wieder her.']
  ],
  subFeats:[
   [3,'Segen des Dunklen','Fällt ein Feind in deiner Nähe auf 0 TP, erhältst du CHA-Mod + Hexenmeisterstufe temporäre TP.'],
   [3,'Unhold-Zauber','Immer vorbereitet: Brennende Hände, Befehl, Sengender Strahl, Einflüsterung (ab 5: Feuerball, Stinkende Wolke; ab 7: Feuerschild, Feuerwand; ab 9: Geas, Insektenplage).'],
   [6,'Glück des Dunklen','+1W10 auf einen Attributs- oder Rettungswurf (CHA-Mod pro langer Rast).'],
   [10,'Unholde Widerstandskraft','Nach jeder Rast: Resistenz gegen eine Schadensart deiner Wahl (ausser Energie).'],
   [14,'Durch die Hölle schleudern','Bei einem Treffer: Das Ziel verschwindet bis zum Ende deines nächsten Zuges, ist kampfunfähig und erleidet 8W10 psychischen Schaden, ausser es ist ein Unhold (CHA-RW verhindert). 1× pro langer Rast oder für einen Paktplatz.']
  ]},
 wiz:{ name:'Magier', hd:6, prim:['int'], saves:['int','wis'], skillN:2, skills:['arc','his','ins','inv','med','nat','rel'], armor:[], weapons:'simple',
  caster:'full', ability:'int', cantrips:step(3,[[4,4],[10,5]]), prepared:PREP_WIZ, asi:[4,8,12,16],
  expertise:[[2,1]], expertiseFrom:['arc','his','inv','med','nat','rel'],
  sub:{ id:'evoker', name:'Hervorrufer', lv:[3,6,10,14] },
  table:(l)=>[['Zauber im Buch',6+2*(l-1)],['Arkane Erholung','Gesamtgrad '+Math.ceil(l/2)]],
  res:(l,c)=>[{k:'ar',n:'Arkane Erholung',max:1,reset:'long'}],
  feats:[
   [1,'Zauberwirken','Intelligenz ist dein Zauberattribut. Dein Zauberbuch enthält 6 Grad-1-Zauber, pro Stufe kommen 2 hinzu.'],
   [1,'Ritualadept','Rituale aus deinem Zauberbuch kannst du wirken, ohne sie vorzubereiten.'],
   [1,'Arkane Erholung','Einmal pro Tag nach einer kurzen Rast: Zauberplätze zurück, Gesamtgrad bis zur halben Stufe (aufgerundet), keiner ab Grad 6.'],
   [2,'Gelehrter','Expertise in Arkane Kunde, Geschichte, Heilkunde, Nachforschungen, Naturkunde oder Religion (wenn geübt).'],
   [5,'Auswendig lernen','Bei einer kurzen Rast darfst du einen vorbereiteten Zauber gegen einen aus deinem Buch tauschen.'],
   [18,'Zaubermeisterschaft','Je einen Grad-1- und Grad-2-Zauber kannst du ohne Zauberplatz beliebig oft wirken.'],
   [20,'Charakteristische Zauber','Zwei Grad-3-Zauber sind immer vorbereitet und je 1× pro kurzer Rast ohne Platz wirkbar.']
  ],
  subFeats:[
   [3,'Hervorrufungsgelehrter','Zwei Hervorrufungszauber gratis ins Buch; bei jedem neuen Zaubergrad einer mehr.'],
   [3,'Mächtiger Zaubertrick','Verfehlt dein Zaubertrick mit Schaden oder gelingt dem Ziel der Rettungswurf, erleidet es trotzdem halben Schaden.'],
   [6,'Zauber formen','Bei deinen Hervorrufungen bestehen 1 + Zaubergrad Kreaturen den Rettungswurf automatisch und erleiden keinen Schaden.'],
   [10,'Ermächtigte Hervorrufung','+INT-Mod auf einen Schadenswurf deiner Magier-Hervorrufungen.'],
   [14,'Überladen','Ein Zauber Grad 1–5 macht maximalen Schaden; bei Wiederholung vor einer langen Rast erleidest du nekrotischen Schaden.']
  ]}
};
function fmtM(m){ return String(m).replace('.',',')+' m'; }
function pactSlots(l){ return { n: l>=17?4:l>=11?3:l>=2?2:1, lvl: l>=9?5:l>=7?4:l>=5?3:l>=3?2:1 }; }

const INVOCATIONS = {
 agonizing:['Quälender Strahl','Addiere deinen CHA-Mod auf den Schaden eines Hexenmeister-Zaubertricks (z. B. Schauerlicher Strahl).',2],
 shadows:['Rüstung der Schatten','Magierrüstung auf dich selbst beliebig oft ohne Zauberplatz.',1],
 devilsight:['Teufelssicht','Du siehst 36 m weit normal in magischer und nichtmagischer Dunkelheit.',2],
 mind:['Schauerlicher Geist','Vorteil auf Konstitutionsrettungswürfe für Konzentration.',1],
 spear:['Schauerlicher Speer','Die Reichweite deines Zaubertricks mit Schaden steigt um 9 m × Hexenmeisterstufe.',2],
 vigor:['Unholde Lebenskraft','Falsches Leben ohne Platz; Würfel zählen als Maximum.',2],
 faces:['Maske der vielen Gesichter','Selbstverkleidung ohne Zauberplatz beliebig oft.',2],
 misty:['Nebelvisionen','Stille Bilder ohne Zauberplatz beliebig oft.',2],
 blade:['Pakt der Klinge','Beschwöre eine Paktwaffe; du nutzt CHA für Angriff und Schaden und darfst nekrotischen, psychischen oder gleissenden Schaden machen.',1],
 chain:['Pakt der Kette','Vertrauten finden ohne Platz; besondere Vertrautenformen (z. B. Pseudodrache, Imp, Sprite).',1],
 tome:['Pakt des Buches','Buch der Schatten: drei Zaubertricks und zwei Grad-1-Rituale aus beliebigen Listen.',1],
 repelling:['Abstossender Strahl','Triffst du mit deinem Zaubertrick mit Schaden, kannst du grosse oder kleinere Kreaturen 3 m wegstossen.',2],
 thirsting:['Durstige Klinge','Mit der Paktwaffe greifst du bei der Angriffsaktion zweimal an. (ab Stufe 5)',5],
 lifedrinker:['Lebenstrinker','Paktwaffe +1W6 nekrotisch/psychisch/gleissend; einmal pro Zug darfst du einen Trefferwürfel ausgeben. (ab Stufe 9)',9],
 devouring:['Verschlingende Klinge','Durstige Klinge gibt einen zusätzlichen Angriff. (ab Stufe 12)',12],
 shadowsone:['Eins mit den Schatten','Im Dämmerlicht oder Dunkel als Magieaktion unsichtbar. (ab Stufe 5)',5],
 ascendant:['Aufsteigender Schritt','Schweben ohne Zauberplatz auf dich selbst. (ab Stufe 5)',5],
 leap:['Sprung aus anderen Welten','Springen auf dich selbst ohne Zauberplatz. (ab Stufe 2)',2],
 depths:['Gabe der Tiefe','Unterwasser atmen, Schwimmbewegung = Bewegung, 1× Wasseratmung ohne Platz. (ab Stufe 5)',5],
 myriad:['Herr der unzähligen Gestalten','Selbstverwandlung beliebig oft ohne Zauberplatz. (ab Stufe 5)',5],
 grave:['Flüstern des Grabes','Mit Toten sprechen ohne Zauberplatz. (ab Stufe 7)',7],
 witchsight:['Hexensicht','Wahrsicht 9 m. (ab Stufe 15; Quelle: Spielerhandbuch 2024, nicht im SRD)',15],
 protectors:['Gabe der Beschützer','Wer seinen Namen in dein Buch der Schatten schreibt und auf 0 TP fällt, hat stattdessen 1 TP – 1× pro langer Rast. (ab Stufe 9, Pakt des Buches)',9],
 chainmaster:['Bindung des Kettenmeisters','Dein Vertrauter erhält Flug- oder Schwimmbewegung 12 m, greift auf Befehl als Bonusaktion an, kann nekrotischen oder gleissenden Schaden machen und nutzt deinen Zauber-SG; per Reaktion gibst du ihm Resistenz gegen einen Treffer. (ab Stufe 5, Pakt der Kette)',5],
 visions:['Visionen ferner Reiche','Arkanes Auge ohne Zauberplatz beliebig oft. (ab Stufe 9)',9],
 smite:['Schauerlicher Schlag','Triffst du mit der Paktwaffe, kannst du einen Paktplatz ausgeben: +1W8 Energieschaden plus 1W8 pro Platzgrad, und du kannst das Ziel umwerfen. (ab Stufe 5)',5],
 gaze:['Blick zweier Geister','Bonusaktion: Durch die Sinne einer willigen Kreatur wahrnehmen. (ab Stufe 5)',5],
 lessons:['Lehren der Ersten','Du erhältst ein Herkunftstalent deiner Wahl. (ab Stufe 2)',2]
};

/* ---------- Spezies ---------- */
const SPECIES = {
 dragonborn:{ name:'Drachenblütiger', size:'Mittelgross', speed:9, dv:18,
  choice:{key:'ancestry', label:'Drachenahnen', opts:{black:'Schwarz (Säure)',blue:'Blau (Blitz)',brass:'Messing (Feuer)',bronze:'Bronze (Blitz)',copper:'Kupfer (Säure)',gold:'Gold (Feuer)',green:'Grün (Gift)',red:'Rot (Feuer)',silver:'Silber (Kälte)',white:'Weiss (Kälte)'}},
  traits:(c)=>[['Drachenahnen','Deine Ahnen bestimmen Schadensart von Odem und Resistenz.'],
   ['Odemwaffe','Ersetzt einen Angriff: 4,5-m-Kegel oder 9-m-Linie, GES-Rettungswurf SG '+(8+c.mod.con+c.pb)+', '+step(1,[[5,2],[11,3],[17,4]])(c.level)+'W10 Schaden (halb bei Erfolg). Nutzungen = ÜB pro langer Rast.'],
   ['Schadensresistenz','Resistenz gegen die Schadensart deiner Ahnen.'],['Dunkelsicht','18 m.'],
   ['Drachenflug','Ab Stufe 5: Bonusaktion, 10 Minuten spektrale Flügel mit Flugbewegung = Bewegungsrate. 1× pro langer Rast.']],
  res:(c)=>[{k:'breath',n:'Odemwaffe',max:c.pb,reset:'long'}].concat(c.level>=5?[{k:'dflight',n:'Drachenflug',max:1,reset:'long'}]:[]) },
 dwarf:{ name:'Zwerg', size:'Mittelgross', speed:9, dv:36, hpPerLevel:1,
  traits:(c)=>[['Dunkelsicht','36 m.'],['Zwergische Unverwüstlichkeit','Resistenz gegen Giftschaden, Vorteil gegen vergiftet.'],['Zwergische Zähigkeit','TP-Maximum +1 pro Stufe (eingerechnet).'],['Steingespür','Bonusaktion: 10 Minuten Erschütterungssinn 18 m auf Stein. Nutzungen = ÜB pro langer Rast.']],
  res:(c)=>[{k:'stone',n:'Steingespür',max:c.pb,reset:'long'}] },
 elf:{ name:'Elf', size:'Mittelgross', speed:9, dv:18, skillPick:['ins','prc','sur'], spellAbility:true,
  choice:{key:'lineage', label:'Elfische Abstammung', opts:{drow:'Drow',high:'Hochelf',wood:'Waldelf'}},
  traits:(c)=>{ const L=c.char.speciesChoice||'high'; const sp={drow:'Tanzende Lichter; ab 3: Feenfeuer; ab 5: Dunkelheit. Dunkelsicht 36 m.',high:'Taschenspielerei (nach langer Rast austauschbar); ab 3: Magie entdecken; ab 5: Nebelschritt.',wood:'Druidenkunst; ab 3: Schnellschritt; ab 5: Spurloses Gehen. Bewegungsrate 10,5 m.'}[L];
   return [['Dunkelsicht',L==='drow'?'36 m.':'18 m.'],['Elfische Abstammung',sp+' Die Grad-Zauber je 1× pro langer Rast ohne Platz.'],['Feenahnen','Vorteil gegen bezaubert.'],['Scharfe Sinne','Übung in Motiv erkennen, Wahrnehmung oder Überlebenskunst.'],['Trance','Eine lange Rast dauert für dich 4 Stunden; Magie kann dich nicht einschlafen lassen.']]; },
  spells:(c)=>{ const L=c.char.speciesChoice||'high'; const m={drow:['dancing-lights','faerie-fire','darkness'],high:['prestidigitation','detect-magic','misty-step'],wood:['druidcraft','longstrider','pass-without-trace']}[L]; return [m[0]].concat(c.level>=3?[m[1]]:[]).concat(c.level>=5?[m[2]]:[]); },
  speedFn:(c)=> (c.char.speciesChoice==='wood'?10.5:9), dvFn:(c)=>(c.char.speciesChoice==='drow'?36:18) },
 gnome:{ name:'Gnom', size:'Klein', speed:9, dv:18, spellAbility:true,
  choice:{key:'lineage', label:'Gnomische Abstammung', opts:{forest:'Waldgnom',rock:'Felsgnom'}},
  traits:(c)=>[['Dunkelsicht','18 m.'],['Gnomische Gerissenheit','Vorteil auf INT-, WEI- und CHA-Rettungswürfe.'],['Gnomische Abstammung',(c.char.speciesChoice==='rock'?'Ausbessern und Taschenspielerei; du kannst kleine Uhrwerk-Spielzeuge bauen.':'Kleine Illusion; Mit Tieren sprechen ÜB-mal pro langer Rast ohne Platz.')]],
  spells:(c)=> c.char.speciesChoice==='rock'?['mending','prestidigitation']:['minor-illusion','speak-with-animals'],
  res:(c)=> c.char.speciesChoice==='rock'?[]:[{k:'swa',n:'Mit Tieren sprechen',max:c.pb,reset:'long'}] },
 goliath:{ name:'Goliath', size:'Mittelgross', speed:10.5, dv:0,
  choice:{key:'giant', label:'Riesenahnen', opts:{cloud:'Wolke (Teleport 9 m)',fire:'Feuer (+1W10 Feuerschaden)',frost:'Frost (+1W6 Kälteschaden, −3 m)',hill:'Hügel (liegend)',stone:'Stein (Schaden −1W12+KON)',storm:'Sturm (1W8 Schallschaden als Reaktion)'}},
  traits:(c)=>[['Riesenahnen','Übernatürliche Gabe deiner Ahnen, ÜB-mal pro langer Rast.'],['Grosse Gestalt','Ab Stufe 5: Bonusaktion, 10 Minuten gross, Vorteil auf Stärkewürfe, +3 m Bewegung. 1× pro langer Rast.'],['Kräftiger Körperbau','Vorteil auf Würfe, um den Zustand gepackt zu beenden; Traglast wie eine Grössenkategorie grösser.']],
  res:(c)=>[{k:'giant',n:'Riesenahnen',max:c.pb,reset:'long'}].concat(c.level>=5?[{k:'large',n:'Grosse Gestalt',max:1,reset:'long'}]:[]) },
 halfling:{ name:'Halbling', size:'Klein', speed:9, dv:0,
  traits:(c)=>[['Tapfer','Vorteil gegen verängstigt.'],['Halblingsflinkheit','Du kannst dich durch den Bereich grösserer Kreaturen bewegen.'],['Glück','Würfelst du bei einem W20-Test eine 1, darfst du neu würfeln.'],['Natürlich verstohlen','Du kannst dich hinter grösseren Kreaturen verstecken.']] },
 human:{ name:'Mensch', size:'Mittelgross oder Klein', speed:9, dv:0, skillPick:ALL_SKILLS, bonusFeat:true,
  traits:(c)=>[['Einfallsreich','Nach jeder langen Rast erhältst du Heldeninspiration.'],['Geschickt','Übung in einer Fertigkeit deiner Wahl.'],['Vielseitig','Ein zusätzliches Herkunftstalent.']] },
 orc:{ name:'Ork', size:'Mittelgross', speed:9, dv:36,
  traits:(c)=>[['Adrenalinschub','Bonusaktion: Spurt und temporäre TP in Höhe deines ÜB. ÜB-mal pro kurzer oder langer Rast.'],['Dunkelsicht','36 m.'],['Unerbittliche Ausdauer','Fällst du auf 0 TP, ohne zu sterben, hast du stattdessen 1 TP. 1× pro langer Rast.']],
  res:(c)=>[{k:'adr',n:'Adrenalinschub',max:c.pb,reset:'short'},{k:'rel',n:'Unerbittliche Ausdauer',max:1,reset:'long'}] },
 tiefling:{ name:'Tiefling', size:'Mittelgross oder Klein', speed:9, dv:18, spellAbility:true,
  choice:{key:'legacy', label:'Unholdes Erbe', opts:{abyssal:'Abyssisch (Gift)',chthonic:'Chthonisch (Nekrotisch)',infernal:'Infernalisch (Feuer)'}},
  traits:(c)=>{ const L=c.char.speciesChoice||'infernal'; const t={abyssal:'Resistenz gegen Giftschaden. Giftspray; ab 3: Strahl der Übelkeit; ab 5: Person festhalten.',chthonic:'Resistenz gegen nekrotischen Schaden. Kältegriff; ab 3: Falsches Leben; ab 5: Schwächestrahl.',infernal:'Resistenz gegen Feuerschaden. Feuerpfeil; ab 3: Höllischer Tadel; ab 5: Dunkelheit.'}[L];
   return [['Dunkelsicht','18 m.'],['Unholdes Erbe',t+' Grad-Zauber je 1× pro langer Rast ohne Platz.'],['Jenseitige Präsenz','Du kennst Thaumaturgie.']]; },
  spells:(c)=>{ const L=c.char.speciesChoice||'infernal'; const m={abyssal:['poison-spray','ray-of-sickness','hold-person'],chthonic:['chill-touch','false-life','ray-of-enfeeblement'],infernal:['fire-bolt','hellish-rebuke','darkness']}[L]; return ['thaumaturgy',m[0]].concat(c.level>=3&&m[1]?[m[1]]:[]).concat(c.level>=5&&m[2]?[m[2]]:[]); } }
};

/* ---------- Hintergründe ---------- */
const BACKGROUNDS = {
 acolyte:{ name:'Akolyth', abil:['int','wis','cha'], feat:'mi-cle', skills:['ins','rel'], tool:'Kalligrafiewerkzeug', equip:'Kalligrafiewerkzeug, Buch (Gebete), heiliges Symbol, Pergament, Robe, 8 GM' },
 criminal:{ name:'Krimineller', abil:['dex','con','int'], feat:'alert', skills:['slt','ste'], tool:'Diebeswerkzeug', equip:'2 Dolche, Diebeswerkzeug, Brecheisen, 2 Beutel, Reisekleidung, 16 GM' },
 sage:{ name:'Weiser', abil:['con','int','wis'], feat:'mi-wiz', skills:['arc','his'], tool:'Kalligrafiewerkzeug', equip:'Kampfstab, Kalligrafiewerkzeug, Buch (Geschichte), Pergament, Robe, 8 GM' },
 soldier:{ name:'Soldat', abil:['str','dex','con'], feat:'savage', skills:['ath','itm'], tool:'Spielset', equip:'Speer, Kurzbogen, 20 Pfeile, Spielset, Heilerausrüstung, Köcher, Reisekleidung, 14 GM' },
 custom:{ name:'Eigener Hintergrund', abil:null, feat:null, skills:null, tool:'', equip:'' }
};

/* ---------- Talente ---------- */
const FEATS = {
 'alert':{ name:'Wachsam', cat:'origin', text:'Du addierst deinen Übungsbonus auf die Initiative und darfst nach dem Wurf die Initiative mit einem willigen Verbündeten tauschen.', init:'pb' },
 'mi-cle':{ name:'Magie-Eingeweihter (Kleriker)', cat:'origin', text:'Zwei Kleriker-Zaubertricks und ein Grad-1-Zauber (1× pro langer Rast ohne Platz). Zauberattribut INT, WEI oder CHA.', mi:'cle' },
 'mi-dru':{ name:'Magie-Eingeweihter (Druide)', cat:'origin', text:'Zwei Druiden-Zaubertricks und ein Grad-1-Zauber (1× pro langer Rast ohne Platz). Zauberattribut INT, WEI oder CHA.', mi:'dru' },
 'mi-wiz':{ name:'Magie-Eingeweihter (Magier)', cat:'origin', text:'Zwei Magier-Zaubertricks und ein Grad-1-Zauber (1× pro langer Rast ohne Platz). Zauberattribut INT, WEI oder CHA.', mi:'wiz' },
 'savage':{ name:'Wilder Angreifer', cat:'origin', text:'Einmal pro Zug darfst du die Schadenswürfel einer Waffe zweimal würfeln und den besseren Wurf nehmen.' },
 'skilled':{ name:'Talentiert', cat:'origin', text:'Übung in drei Fertigkeiten oder Werkzeugen deiner Wahl.', skills:3 },
 'tough':{ name:'Zäh', cat:'origin', text:'TP-Maximum +2 pro Stufe.', hpPerLevel:2, home:true },
 'asi':{ name:'Attributswerterhöhung', cat:'general', text:'+2 auf einen Attributswert oder +1 auf zwei (max. 20).', asi:true },
 'grappler':{ name:'Ringer', cat:'general', text:'+1 STÄ oder GES. Vorteil auf Angriffe gegen von dir gepackte Kreaturen; bei einem Treffer mit einem waffenlosen Schlag kannst du zugleich packen; gepackte Kreaturen ziehst du ohne zusätzliche Bewegungskosten mit.', plus:['str','dex'] },
 'fs-archery':{ name:'Kampfstil: Bogenschiessen', cat:'style', text:'+2 auf Angriffswürfe mit Fernkampfwaffen.', archery:true },
 'fs-defense':{ name:'Kampfstil: Verteidigung', cat:'style', text:'+1 RK, solange du leichte, mittelschwere oder schwere Rüstung trägst.', defense:true },
 'fs-gwf':{ name:'Kampfstil: Kampf mit grossen Waffen', cat:'style', text:'Würfelst du Schaden mit einer zweihändigen oder beidhändig geführten vielseitigen Nahkampfwaffe, zählt jede 1 oder 2 als 3.' },
 'fs-twf':{ name:'Kampfstil: Kampf mit zwei Waffen', cat:'style', text:'Beim zusätzlichen Angriff mit einer leichten Waffe addierst du deinen Attributsmodifikator zum Schaden.' },
 'boon-combat':{ name:'Gabe der Kampfkraft', cat:'epic', text:'+1 auf ein Attribut (max. 30). Einmal pro Zug darfst du einen verfehlten Angriff in einen Treffer verwandeln.', plus:AB, cap30:true },
 'boon-dim':{ name:'Gabe der Dimensionsreise', cat:'epic', text:'+1 auf ein Attribut (max. 30). Nach Angriff oder Magieaktion darfst du dich 9 m teleportieren.', plus:AB, cap30:true },
 'boon-fate':{ name:'Gabe des Schicksals', cat:'epic', text:'+1 auf ein Attribut (max. 30). 2W4 auf einen W20-Test in 18 m addieren oder abziehen (zurück bei Initiative oder Rast).', plus:AB, cap30:true },
 'boon-off':{ name:'Gabe der unwiderstehlichen Offensive', cat:'epic', text:'+1 STÄ oder GES (max. 30). Dein Wucht-, Stich- und Hiebschaden ignoriert Resistenz; bei einer 20 zusätzlicher Schaden in Höhe des erhöhten Attributs.', plus:['str','dex'], cap30:true },
 'boon-recall':{ name:'Gabe der Zaubererinnerung', cat:'epic', text:'+1 INT, WEI oder CHA (max. 30). Einmal pro langer Rast einen Zauber Grad 1–4 ohne Platz.', plus:['int','wis','cha'], cap30:true },
 'boon-night':{ name:'Gabe des Nachtgeistes', cat:'epic', text:'+1 auf ein Attribut (max. 30). Im Dämmerlicht und Dunkel Bonusaktion unsichtbar; Resistenz gegen alle Schadensarten ausser psychisch und gleissend.', plus:AB, cap30:true },
 'boon-truesight':{ name:'Gabe der Wahrsicht', cat:'epic', text:'+1 auf ein Attribut (max. 30). Wahrsicht 18 m.', plus:AB, cap30:true }
};
/* Zäh: offizielles Herkunftstalent (PHB 2024), nicht im SRD 5.2.1 – Wirkung in eigenen Worten, als Quelle gekennzeichnet */
FEATS.tough.src = 'phb'; delete FEATS.tough.home; FEATS.tough.text = 'Dein TP-Maximum steigt um 2 pro Charakterstufe – auch rückwirkend und bei jedem weiteren Stufenaufstieg. (Quelle: Spielerhandbuch 2024, nicht im SRD)';

/* ---------- Rüstungen ---------- */
const ARMOR = {
 none:{ name:'Keine Rüstung', type:'none' },
 padded:{ name:'Gepolsterte Rüstung', type:'light', ac:11, stealth:true, kg:4 },
 leather:{ name:'Lederrüstung', type:'light', ac:11, kg:5 },
 studded:{ name:'Beschlagene Lederrüstung', type:'light', ac:12, kg:6.5 },
 hide:{ name:'Fellrüstung', type:'medium', ac:12, kg:6 },
 chainshirt:{ name:'Kettenhemd', type:'medium', ac:13, kg:10 },
 scale:{ name:'Schuppenpanzer', type:'medium', ac:14, stealth:true, kg:22.5 },
 breastplate:{ name:'Brustplatte', type:'medium', ac:14, kg:10 },
 halfplate:{ name:'Halbplatte', type:'medium', ac:15, stealth:true, kg:20 },
 ringmail:{ name:'Ringpanzer', type:'heavy', ac:14, stealth:true, kg:20 },
 chainmail:{ name:'Kettenpanzer', type:'heavy', ac:16, str:13, stealth:true, kg:27.5 },
 splint:{ name:'Schienenpanzer', type:'heavy', ac:17, str:15, stealth:true, kg:30 },
 plate:{ name:'Plattenpanzer', type:'heavy', ac:18, str:15, stealth:true, kg:32.5 }
};

/* ---------- Waffen ---------- */
const MASTERY = {
 cleave:['Durchspalten','Nach einem Nahkampftreffer darfst du eine zweite Kreatur in 1,5 m angreifen (Schaden ohne Attributsmod), 1× pro Zug.'],
 graze:['Streifen','Verfehlst du, erleidet das Ziel trotzdem Schaden in Höhe deines Attributsmods.'],
 nick:['Kerbe','Der Zusatzangriff mit einer leichten Waffe ist Teil der Angriffsaktion statt Bonusaktion (1× pro Zug).'],
 push:['Stoss','Bei einem Treffer darfst du ein grosses oder kleineres Ziel 3 m wegstossen.'],
 sap:['Schwächen','Bei einem Treffer hat das Ziel Nachteil auf seinen nächsten Angriff vor deinem nächsten Zug.'],
 slow:['Verlangsamen','Bei Treffer mit Schaden sinkt die Bewegungsrate des Ziels um 3 m bis zu deinem nächsten Zug.'],
 topple:['Umwerfen','Bei einem Treffer: KON-Rettungswurf (SG 8 + Attributsmod + ÜB) oder das Ziel liegt.'],
 vex:['Bedrängen','Bei Treffer mit Schaden hast du Vorteil auf deinen nächsten Angriff gegen dieses Ziel.']
};
const DT = {b:'Wucht',p:'Stich',s:'Hieb'};
/* id: [Name, Kategorie (s=einfach, m=Kriegswaffe), nah/fern, Schaden, Art, Eigenschaften, Meisterschaft, Reichweite, vielseitig] */
const WEAPONS = {
 club:['Knüppel','s','melee','1W4','b',['light'],'slow'],
 dagger:['Dolch','s','melee','1W4','p',['finesse','light','thrown'],'nick','6/18'],
 greatclub:['Zweihandknüppel','s','melee','1W8','b',['two'],'push'],
 handaxe:['Handaxt','s','melee','1W6','s',['light','thrown'],'vex','6/18'],
 javelin:['Wurfspeer','s','melee','1W6','p',['thrown'],'slow','9/36'],
 lighthammer:['Leichter Hammer','s','melee','1W4','b',['light','thrown'],'nick','6/18'],
 mace:['Streitkolben','s','melee','1W6','b',[],'sap'],
 quarterstaff:['Kampfstab','s','melee','1W6','b',['versatile'],'topple',null,'1W8'],
 sickle:['Sichel','s','melee','1W4','s',['light'],'nick'],
 spear:['Speer','s','melee','1W6','p',['thrown','versatile'],'sap','6/18','1W8'],
 dart:['Wurfpfeil','s','ranged','1W4','p',['finesse','thrown'],'vex','6/18'],
 lcrossbow:['Leichte Armbrust','s','ranged','1W8','p',['ammo','loading','two'],'slow','24/96'],
 shortbow:['Kurzbogen','s','ranged','1W6','p',['ammo','two'],'vex','24/96'],
 sling:['Schleuder','s','ranged','1W4','b',['ammo'],'slow','9/36'],
 battleaxe:['Streitaxt','m','melee','1W8','s',['versatile'],'topple',null,'1W10'],
 flail:['Flegel','m','melee','1W8','b',[],'sap'],
 glaive:['Glefe','m','melee','1W10','s',['heavy','reach','two'],'graze'],
 greataxe:['Zweihandaxt','m','melee','1W12','s',['heavy','two'],'cleave'],
 greatsword:['Zweihandschwert','m','melee','2W6','s',['heavy','two'],'graze'],
 halberd:['Hellebarde','m','melee','1W10','s',['heavy','reach','two'],'cleave'],
 lance:['Lanze','m','melee','1W10','p',['heavy','reach','two'],'topple'],
 longsword:['Langschwert','m','melee','1W8','s',['versatile'],'sap',null,'1W10'],
 maul:['Zweihandhammer','m','melee','2W6','b',['heavy','two'],'topple'],
 morningstar:['Morgenstern','m','melee','1W8','p',[],'sap'],
 pike:['Pike','m','melee','1W10','p',['heavy','reach','two'],'push'],
 rapier:['Rapier','m','melee','1W8','p',['finesse'],'vex'],
 scimitar:['Krummsäbel','m','melee','1W6','s',['finesse','light'],'nick'],
 shortsword:['Kurzschwert','m','melee','1W6','p',['finesse','light'],'vex'],
 trident:['Dreizack','m','melee','1W8','p',['thrown','versatile'],'topple','6/18','1W10'],
 warhammer:['Kriegshammer','m','melee','1W8','b',['versatile'],'push',null,'1W10'],
 warpick:['Kriegspicke','m','melee','1W8','p',['versatile'],'sap',null,'1W10'],
 whip:['Peitsche','m','melee','1W4','s',['finesse','reach'],'slow'],
 blowgun:['Blasrohr','m','ranged','1','p',['ammo','loading'],'vex','7,5/30'],
 hcrossbow:['Handarmbrust','m','ranged','1W6','p',['ammo','light','loading'],'vex','9/36'],
 hvcrossbow:['Schwere Armbrust','m','ranged','1W10','p',['ammo','heavy','loading','two'],'push','30/120'],
 longbow:['Langbogen','m','ranged','1W8','p',['ammo','heavy','two'],'slow','45/180'],
 musket:['Muskete','m','ranged','1W12','p',['ammo','loading','two'],'slow','12/36'],
 pistol:['Pistole','m','ranged','1W10','p',['ammo','loading'],'vex','9/27']
};
const PROP_DE = {light:'Leicht',finesse:'Finesse',thrown:'Wurfwaffe',two:'Zweihändig',versatile:'Vielseitig',heavy:'Schwer',reach:'Reichweite',ammo:'Munition',loading:'Laden'};

/* ---------- Zustände (SRD 5.2.1, eigene Kurzfassung) ---------- */
const COND = {
 blinded:{ name:'Blind', text:'Du siehst nichts und scheiterst an Proben, die Sicht erfordern. Deine Angriffe haben Nachteil, Angriffe gegen dich Vorteil.', fx:{atk:'dis'}, auto:'Nachteil auf deine Angriffe' },
 charmed:{ name:'Bezaubert', text:'Du kannst den Bezauberer nicht angreifen oder ihm mit Fähigkeiten schaden. Er hat Vorteil bei sozialen Proben gegen dich.' },
 deafened:{ name:'Taub', text:'Du hörst nichts und scheiterst an Proben, die Gehör erfordern.' },
 frightened:{ name:'Verängstigt', text:'Solange du die Quelle der Angst siehst: Nachteil auf Attributswürfe und Angriffe. Du kannst dich nicht freiwillig auf sie zubewegen.', fx:{atk:'dis',check:'dis'}, auto:'Nachteil auf Angriffe und Attributswürfe' },
 grappled:{ name:'Gepackt', text:'Bewegungsrate 0. Nachteil auf Angriffe gegen alle ausser den Packenden. Der Packende kann dich mitziehen.', fx:{speed0:true}, auto:'Bewegungsrate 0' },
 incapacitated:{ name:'Kampfunfähig', text:'Keine Aktionen, Bonusaktionen oder Reaktionen. Deine Konzentration endet, du kannst nicht sprechen. Nachteil auf Initiative.', fx:{incap:true}, auto:'Nachteil auf Initiative' },
 invisible:{ name:'Unsichtbar', text:'Man sieht dich nicht. Vorteil auf Initiative, deine Angriffe haben Vorteil, Angriffe gegen dich Nachteil.', fx:{atk:'adv',init:'adv'}, auto:'Vorteil auf Angriffe und Initiative' },
 paralyzed:{ name:'Gelähmt', text:'Kampfunfähig, Bewegungsrate 0. STÄ- und GES-Rettungswürfe misslingen automatisch. Angriffe gegen dich haben Vorteil; Treffer aus 1,5 m sind kritisch.', fx:{incap:true,speed0:true,autofail:true}, auto:'Bewegungsrate 0, STÄ-/GES-Rettungswürfe misslingen', adds:['incapacitated'] },
 petrified:{ name:'Versteinert', text:'Du bist zu Stein geworden: kampfunfähig, Bewegungsrate 0, STÄ- und GES-Rettungswürfe misslingen. Resistenz gegen allen Schaden, immun gegen Gift.', fx:{incap:true,speed0:true,autofail:true}, auto:'Bewegungsrate 0, STÄ-/GES-Rettungswürfe misslingen', adds:['incapacitated'] },
 poisoned:{ name:'Vergiftet', text:'Nachteil auf Angriffe und Attributswürfe.', fx:{atk:'dis',check:'dis'}, auto:'Nachteil auf Angriffe und Attributswürfe' },
 prone:{ name:'Liegend', text:'Du liegst am Boden und kannst nur kriechen; Aufstehen kostet die halbe Bewegung. Deine Angriffe haben Nachteil. Angriffe gegen dich aus 1,5 m haben Vorteil, aus grösserer Entfernung Nachteil.', fx:{atk:'dis'}, auto:'Nachteil auf deine Angriffe' },
 restrained:{ name:'Festgesetzt', text:'Bewegungsrate 0. Deine Angriffe und GES-Rettungswürfe haben Nachteil, Angriffe gegen dich Vorteil.', fx:{speed0:true,atk:'dis',dexdis:true}, auto:'Bewegungsrate 0, Nachteil auf Angriffe und GES-Rettungswürfe' },
 stunned:{ name:'Betäubt', text:'Kampfunfähig. STÄ- und GES-Rettungswürfe misslingen automatisch. Angriffe gegen dich haben Vorteil.', fx:{incap:true,autofail:true}, auto:'STÄ-/GES-Rettungswürfe misslingen', adds:['incapacitated'] },
 unconscious:{ name:'Bewusstlos', text:'Kampfunfähig und liegend, Bewegungsrate 0; du lässt fallen, was du hältst, und bemerkst nichts. STÄ- und GES-Rettungswürfe misslingen; Angriffe gegen dich haben Vorteil, Treffer aus 1,5 m sind kritisch.', fx:{incap:true,speed0:true,autofail:true}, auto:'Bewegungsrate 0, STÄ-/GES-Rettungswürfe misslingen', adds:['incapacitated','prone'] }
};

/* ---------- Heldenbuch-Talente (eigene Erfindungen, nicht aus offiziellen Büchern) ---------- */
const HB_FEATS = {
 /* Herkunftstalente */
 'o-stars':{ name:'Sternenkundig', cat:'origin', text:'Übung in einer zusätzlichen Fertigkeit. Unter freiem Himmel kennst du immer Uhrzeit und Himmelsrichtung. Einmal pro langer Rast hast du nachts Vorteil auf eine Wahrnehmungs- oder Überlebenskunst-Probe.', skills:1, uses:{n:1,reset:'long',name:'Sternenkundig: Vorteil bei Nacht'} },
 'o-tavern':{ name:'Tavernenkind', cat:'origin', text:'Übung in einer zusätzlichen Fertigkeit. Du findest in jeder Siedlung schnell eine Unterkunft und Gerüchte. Einmal pro langer Rast hast du Vorteil auf eine Charismaprobe in einem Gespräch.', skills:1, uses:{n:1,reset:'long',name:'Tavernenkind: Vorteil im Gespräch'} },
 'o-sleeper':{ name:'Leichter Schlaf', cat:'origin', text:'+2 auf Initiative. Du wachst bei verdächtigen Geräuschen sofort auf und bist beim Aufwachen nie überrascht.', initFlat:2 },
 'o-blood':{ name:'Zähes Blut', cat:'origin', text:'Dein TP-Maximum steigt um 1 pro Stufe. Du hast Vorteil auf Rettungswürfe gegen Krankheiten.', hpPerLevel:1 },
 'o-feet':{ name:'Flinke Füsse', cat:'origin', text:'Deine Bewegungsrate steigt um 1,5 m. Aufstehen aus dem Liegen kostet dich nur 1,5 m Bewegung.', speed:1.5 },
 'o-herbs':{ name:'Kräuterkundig', cat:'origin', text:'Übung in einer zusätzlichen Fertigkeit (z. B. Heilkunde oder Naturkunde). Gibt eine Kreatur während einer kurzen Rast mit deiner Pflege einen Trefferwürfel aus, heilt sie zusätzlich 1W6. Nutzungen = ÜB pro langer Rast.', skills:1, uses:{n:'pb',reset:'long',name:'Kräuterkundig: +1W6 Heilung'} },
 'o-spark':{ name:'Funkenbegabt', cat:'origin', text:'Du lernst einen Zaubertrick aus einer beliebigen Zauberliste. Zauberattribut: INT, WEI oder CHA.', mi:'any', miC:1, miSpell:false },
 'o-shadow':{ name:'Schattengänger', cat:'origin', text:'Übung in einer zusätzlichen Fertigkeit (z. B. Heimlichkeit). Einmal pro kurzer Rast hast du im Dämmerlicht oder Dunkel Vorteil auf eine Heimlichkeitsprobe.', skills:1, uses:{n:1,reset:'short',name:'Schattengänger: Vorteil im Dunkel'} },
 'o-lucky':{ name:'Glückskind', cat:'origin', text:'Zweimal pro langer Rast darfst du nach einem eigenen W20-Test 1W4 addieren.', uses:{n:2,reset:'long',name:'Glückskind: +1W4'} },
 'o-shield':{ name:'Schildträger der Grenzmark', cat:'origin', text:'Du bist im Umgang mit Schilden geübt. Einmal pro kurzer Rast kannst du als Reaktion deinen Schild hochreissen: +2 RK gegen einen Fernkampfangriff.', shieldProf:true, uses:{n:1,reset:'short',name:'Schild hochreissen'} },
 /* Allgemeine Talente (ab Stufe 4) */
 'g-will':{ name:'Unbeugsamer Wille', cat:'general', text:'+1 auf INT, WEI oder CHA. Du erhältst Übung in einem geistigen Rettungswurf (INT, WEI oder CHA).', plus:['int','wis','cha'], saveChoice:['int','wis','cha'] },
 'g-iron':{ name:'Eisenleib', cat:'general', text:'+1 auf STÄ oder KON. Du erhältst Übung in Stärke- oder Konstitutionsrettungswürfen.', plus:['str','con'], saveChoice:['str','con'] },
 'g-flame':{ name:'Flammenseele', cat:'general', text:'+1 auf INT, WEI oder CHA. Einmal pro Zug macht ein Zauber, der Feuer-, Blitz- oder Kälteschaden verursacht, zusätzlich Schaden in Höhe deines Übungsbonus.', plus:['int','wis','cha'] },
 'g-blade':{ name:'Klingentänzer', cat:'general', text:'+1 auf STÄ oder GES. Triffst du mit einer Nahkampfwaffe, darfst du dich bis zu 3 m bewegen, ohne einen Gelegenheitsangriff des Ziels auszulösen.', plus:['str','dex'] },
 'g-bulwark':{ name:'Bollwerk', cat:'general', text:'+1 auf STÄ oder KON. +1 RK, solange du einen Schild trägst. Einmal pro kurzer Rast kannst du als Reaktion den Schaden eines Angriffs gegen einen Verbündeten in 1,5 m halbieren.', plus:['str','con'], acShield:1, uses:{n:1,reset:'short',name:'Bollwerk: Schaden halbieren'} },
 'g-hunter':{ name:'Jägerauge', cat:'general', text:'+1 auf GES oder WEI. Deine Fernkampfangriffe ignorieren halbe Deckung. Deine passive Wahrnehmung steigt um 2.', plus:['dex','wis'], passive:2 },
 'g-life':{ name:'Lebensfunke', cat:'general', text:'+1 auf KON, WEI oder CHA. Wenn du mit einem Zauber oder einer Fähigkeit heilst, heilt das Ziel zusätzlich TP in Höhe deines Übungsbonus.', plus:['con','wis','cha'] },
 'g-arcane':{ name:'Arkaner Speicher', cat:'general', text:'+1 auf INT, WEI oder CHA. Einmal pro langer Rast kannst du als Bonusaktion einen verbrauchten Zauberplatz bis Grad 2 zurückgewinnen.', plus:['int','wis','cha'], uses:{n:1,reset:'long',name:'Arkaner Speicher'} },
 'g-storm':{ name:'Sturmläufer', cat:'general', text:'+1 auf GES oder KON. Deine Bewegungsrate steigt um 3 m. Einmal pro kurzer Rast kannst du Spurt als Bonusaktion nutzen.', plus:['dex','con'], speed:3, uses:{n:1,reset:'short',name:'Sturmläufer: Spurt'} },
 'g-warden':{ name:'Wächter der Flamme', cat:'general', text:'+1 auf KON oder WEI. Dein TP-Maximum steigt um 1 pro Stufe. Du hast Vorteil auf Rettungswürfe gegen verängstigt.', plus:['con','wis'], hpPerLevel:1 },
 'g-scholar':{ name:'Gelehrter der alten Schriften', cat:'general', text:'+1 auf INT. Übung in einer zusätzlichen Fertigkeit und Expertise in einer Fertigkeit, in der du geübt bist.', plus:['int'], skills:1, expertise:1 },
 'g-tactic':{ name:'Taktiker', cat:'general', text:'+1 auf INT oder WEI. Bonusaktion: Ein Verbündeter in 9 m addiert 1W6 auf seinen nächsten Angriff vor deinem nächsten Zug. Nutzungen = ÜB pro langer Rast.', plus:['int','wis'], uses:{n:'pb',reset:'long',name:'Taktiker: +1W6 für Verbündete'} },
 'g-wander':{ name:'Unermüdlicher Wanderer', cat:'general', text:'+1 auf KON oder WEI. Bewegungsrate +1,5 m. Eine kurze Rast dauert für dich nur 30 Minuten.', plus:['con','wis'], speed:1.5 },
 'g-fury':{ name:'Blutrausch', cat:'general', text:'+1 auf STÄ oder KON. Fällst du zum ersten Mal unter die Hälfte deiner TP, erhältst du temporäre TP in Höhe deiner Stufe + KON-Mod. Einmal pro kurzer Rast.', plus:['str','con'], uses:{n:1,reset:'short',name:'Blutrausch'} },
 'g-mirror':{ name:'Seelenspiegel', cat:'general', text:'+1 auf WEI oder CHA. Als Reaktion, wenn du einen Rettungswurf gegen einen Zauber machst, erhältst du Vorteil darauf. Nutzungen = ÜB pro langer Rast.', plus:['wis','cha'], uses:{n:'pb',reset:'long',name:'Seelenspiegel'} },
 'g-twin':{ name:'Zwillingsklingen', cat:'general', text:'+1 auf STÄ oder GES. Kämpfst du mit einer leichten Waffe in jeder Hand, erhältst du +1 RK.', plus:['str','dex'] },
 'g-rider':{ name:'Reiter der Weiten', cat:'general', text:'+1 auf STÄ, GES oder WEI. Aufsitzen kostet dich nur 1,5 m. Solange du reitest, hast du Vorteil auf Nahkampfangriffe gegen kleinere Kreaturen ohne Reittier, und Angriffe gegen dein Reittier darfst du auf dich umlenken.', plus:['str','dex','wis'] }
};
for (const [k, f] of Object.entries(HB_FEATS)) FEATS[k] = Object.assign({ orig: true }, f);
