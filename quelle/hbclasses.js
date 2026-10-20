/* ==== Heldenbuch-Erweiterung: eigene Klassen und Völker (überarbeitete, spielbare Fassung) ==== */
const RW_DIE = (l) => 'W' + step(6, [[5, 8], [11, 10], [17, 12]])(l);

/* ---------- Runen ---------- */
const RUNES = {
 schutz:['Schutzrune','Rüstung oder Schild','Solange aktiv: Vorteil auf Rettungswürfe gegen den Zustand liegend. Aktivierung (Reaktion, wenn du getroffen wirst): Der Schaden sinkt um 1 Runenwürfel + ÜB.',1],
 glut:['Glutrune','Waffe','Solange aktiv: Einmal pro Zug verursacht ein Treffer mit der Waffe 1W4 zusätzlichen Feuerschaden (1W6 ab Stufe 11). Aktivierung (bei einem Treffer): Das Ziel brennt – zu Beginn seiner Züge 1 Runenwürfel Feuerschaden, bis es eine Aktion zum Löschen nutzt oder 1 Minute vergeht.',1],
 bann:['Bannrune','Waffe','Solange aktiv: Deine Gelegenheitsangriffe mit der Waffe haben Vorteil. Aktivierung (bei einem Treffer): STÄ-Rettungswurf gegen deinen Runen-SG, bei Misserfolg ist die Bewegungsrate des Ziels bis zum Ende deines nächsten Zuges 0.',1],
 leit:['Leitrune','Körper','Solange aktiv: Du kannst die Aktion Helfen als Bonusaktion nutzen. Aktivierung (Reaktion): Ein Verbündeter in 9 m addiert 1 Runenwürfel zu einem Rettungswurf.',1],
 spur:['Spurenrune','Körper','Solange aktiv: Dunkelsicht 18 m (oder +9 m, wenn du schon Dunkelsicht hast). Aktivierung (Bonusaktion): 1 Minute lang Vorteil auf Wahrnehmung, und du nimmst unsichtbare Kreaturen in 3 m wahr.',1],
 sturm:['Sturmschrittrune','Stiefel','Solange aktiv: Bewegungsrate +3 m. Aktivierung (Bonusaktion): Du teleportierst dich bis zu 6 m an einen sichtbaren Ort.',1],
 donner:['Donnerrune','Waffe','Solange aktiv: Die Waffe darf Schallschaden verursachen. Aktivierung (bei einem Treffer): Das Ziel und jede Kreatur deiner Wahl in 1,5 m davon machen einen KON-Rettungswurf – 2 Runenwürfel Schallschaden, bei Erfolg die Hälfte; das Ziel wird bei Misserfolg 3 m weggestossen.',5],
 frost:['Frostrune','Rüstung','Solange aktiv: Resistenz gegen Kälteschaden. Aktivierung (Reaktion, wenn dich eine Kreatur in 1,5 m trifft): Sie erleidet 2 Runenwürfel Kälteschaden, und ihre Bewegungsrate sinkt bis zu ihrem nächsten Zug um 3 m.',5],
 waechter:['Wächterrune','Schild','Solange aktiv: Als Reaktion kannst du einem Angriff gegen eine Kreatur in 1,5 m von dir Nachteil geben. Aktivierung (Bonusaktion): Ein Verbündeter in 9 m erhält 1 Runenwürfel + INT-Mod temporäre TP.',5],
 leben:['Lebensrune','Körper','Solange aktiv: Vorteil auf Todesrettungswürfe. Aktivierung (Bonusaktion): Du heilst 2 Runenwürfel + INT-Mod TP.',5],
 spiegel:['Spiegelrune','Rüstung','Solange aktiv: +1 auf Rettungswürfe gegen Zauber. Aktivierung (Reaktion, wenn dich ein Zauberangriff treffen würde): Der Angriff hat Nachteil.',5],
 titan:['Titanenrune','Körper','Solange aktiv: Deine Traglast verdoppelt sich. Aktivierung (Bonusaktion): 1 Minute lang bist du gross, deine Nahkampfreichweite steigt um 1,5 m, du hast Vorteil auf Stärkewürfe und verursachst einmal pro Zug +1 Runenwürfel Schaden.',15],
 bindung:['Bindungsrune','Waffe','Solange aktiv: Kreaturen, die du triffst, können bis zu deinem nächsten Zug keine Reaktionen nutzen. Aktivierung (bei einem Treffer): WEI-Rettungswurf, bei Misserfolg 1 Minute festgesetzt (Wiederholung am Ende jedes Zuges).',15],
 ewig:['Ewigkeitsrune','Körper','Solange aktiv: Du alterst nicht und brauchst keinen Schlaf (eine lange Rast erfordert trotzdem 4 Stunden leichte Tätigkeit). Aktivierung (wenn du auf 0 TP fallen würdest, 1× pro langer Rast): Du hast stattdessen 1 TP und erhältst 2 Runenwürfel + INT-Mod temporäre TP.',15]
};
/* ---------- Blutriten ---------- */
const RITES = {
 ruestung:['Blutrüstung','Bonusaktion, 1 Blutladung: Du erhältst 2 Blutwürfel + KON-Mod temporäre TP.',1],
 klinge:['Blutige Waffe','Mit einfachen Waffen nutzt du KON statt STÄ oder GES für Angriff und Schaden.',1],
 echo:['Schmerzensecho','Reaktion, wenn du Schaden nimmst, 1 Blutladung: Der Angreifer erleidet 1 Blutwürfel + KON-Mod nekrotischen Schaden.',1],
 weit:['Weite Lanze','Die Reichweite deiner Blutlanze steigt auf 36 m.',1],
 ausbluten:['Ausbluten','Triffst du mit der Blutlanze, sinkt die Bewegungsrate des Ziels bis zu deinem nächsten Zug um 3 m.',1],
 vital:['Vitalsicht','Du erkennst bei jeder Kreatur in 18 m, ob sie höchstens die Hälfte ihrer TP hat.',1],
 zunge:['Rote Zunge','Übung in Einschüchtern; hast du sie schon, Expertise.',1],
 stark:['Starkes Blut','Du addierst deinen KON-Mod zum Schaden der Blutlanze.',2],
 bande:['Blutbande','Du kannst mit der Kreatur, die dein Roter Faden markiert, telepathisch sprechen (Reichweite 1,5 km).',5],
 gerinnung:['Schnelle Gerinnung','Wenn du Blutpreis zahlst, erhältst du so viele temporäre TP, wie du Trefferpunkte geopfert hast, abzüglich deiner Stufe (mindestens 0).',5],
 ruf:['Ruf des Blutes','1 Blutladung: Du wirkst Person bezaubern ohne Zauberplatz (KON als Zauberattribut).',5],
 nebel:['Blutnebel','Aktion, 2 Blutladungen: Eine 4,5-m-Kugel aus rotem Nebel in 18 m versperrt 1 Minute lang jede Sicht (Konzentration).',9]
};
/* ---------- Flüche ---------- */
const CURSES = {
 schwaeche:['Fluch der Schwäche','Bei einem Treffer statt Fluchschaden: Das Ziel zieht bis zum Beginn deines nächsten Zuges 1 Fluchwürfel von jedem seiner Schadenswürfe ab.',2],
 stolpern:['Fluch des Stolperns','Bei einem Treffer statt Fluchschaden: Die Bewegungsrate des Ziels halbiert sich bis zum Ende seines nächsten Zuges, und es kann keine Gelegenheitsangriffe machen.',2],
 offenbarung:['Fluch der Offenbarung','Immer aktiv, solange das Ziel markiert ist: Es kann sich nicht vor dir verstecken; du kennst seine Position, auch wenn es unsichtbar ist, und hast Vorteil auf Motiv erkennen gegen es.',2],
 vergeltung:['Fluch der Vergeltung','Reaktion, wenn dich das markierte Ziel trifft (ÜB-mal pro langer Rast): Es erleidet 2 Fluchwürfel nekrotischen Schaden.',2],
 verwundbar:['Fluch der Verwundbarkeit','Bei einem Treffer statt Fluchschaden: Der nächste Angriff eines Verbündeten gegen das Ziel hat Vorteil.',2],
 schweigen:['Fluch des Schweigens','Bei einem Treffer statt Fluchschaden: CHA-Rettungswurf, bei Misserfolg kann das Ziel bis zum Ende seines nächsten Zuges keine Zauber mit verbaler Komponente wirken.',5],
 angst:['Fluch der Angst','Bei einem Treffer statt Fluchschaden: WEI-Rettungswurf, bei Misserfolg ist das Ziel bis zum Ende seines nächsten Zuges verängstigt.',5],
 fesseln:['Fluch der Fesseln','Bei einem Treffer statt Fluchschaden: STÄ-Rettungswurf, bei Misserfolg ist das Ziel bis zum Ende seines nächsten Zuges festgesetzt.',9],
 verfall:['Fluch des Verfalls','Bei einem Treffer statt Fluchschaden: Das Ziel kann bis zum Beginn deines nächsten Zuges keine TP zurückgewinnen, und sein Widerstand gegen nekrotischen Schaden ist aufgehoben.',9]
};
/* ---------- Gerätemodule ---------- */
const MODULES = {
 daempfer:['Rückstossdämpfer','Reaktion, wenn du getroffen wirst, 1 Zelle: Der Schaden sinkt um 1W10 + INT-Mod.',1],
 impuls:['Impulsantrieb','Bonusaktion, 1 Zelle: Bewegungsrate +6 m bis zum Ende des Zuges; diese Bewegung löst keine Gelegenheitsangriffe aus.',1],
 optik:['Zieloptik','Immer aktiv: Deine Fernkampfangriffe ignorieren halbe Deckung. 1 Zelle: Vorteil auf einen Fernkampfangriff (vor dem Wurf).',1],
 reparatur:['Feldreparatur','Aktion, 1 Zelle: Ein Objekt oder Konstrukt heilt 2W8 + INT-Mod TP, oder eine Kreatur in Rüstung erhält 1W8 + INT-Mod temporäre TP.',1],
 blend:['Blendkapsel','Bonusaktion, 2 Zellen: Kapsel an einen Punkt in 9 m; Kreaturen in 1,5 m Radius machen einen KON-Rettungswurf oder sind bis zum Ende deines nächsten Zuges blind.',1],
 haft:['Haftgranate','Aktion, 1 Zelle: 3-m-Würfel in 18 m wird für 1 Minute schwieriges Gelände; Kreaturen darin machen einen GES-Rettungswurf oder sind bis zum Ende ihres nächsten Zuges festgesetzt.',1],
 schock:['Schockhandschuh','Immer aktiv: Deine waffenlosen Schläge verursachen 1W8 + INT-Mod Blitzschaden. 1 Zelle bei einem Treffer: Das Ziel kann bis zu seinem nächsten Zug keine Reaktionen nutzen.',1],
 haken:['Kletterhaken','Bonusaktion, 1 Zelle: Du ziehst dich bis zu 9 m zu einem festen Punkt, ohne Gelegenheitsangriffe auszulösen.',1],
 schild:['Schildgenerator','Reaktion, wenn du angegriffen wirst, 1 Zelle: +2 RK bis zum Beginn deines nächsten Zuges, auch gegen den auslösenden Angriff.',1],
 analyse:['Analysator','Immer aktiv: Vorteil auf Nachforschungen an Fallen und Mechanismen. Bonusaktion, 1 Zelle: Du erfährst RK, Resistenzen und Immunitäten einer Kreatur in 18 m.',1],
 flamme:['Flammenwerfer','Aktion, 2 Zellen: 4,5-m-Kegel, GES-Rettungswurf gegen 4W6 Feuerschaden, bei Erfolg die Hälfte. +1W6 pro zusätzlicher Zelle.',5],
 tesla:['Teslaspule','Aktion, 2 Zellen: 9-m-Linie, GES-Rettungswurf gegen 3W8 Blitzschaden, bei Erfolg die Hälfte. +1W8 pro zusätzlicher Zelle.',5],
 rakete:['Raketenstiefel','Bonusaktion, 2 Zellen: 1 Minute lang Flugbewegung gleich deiner Bewegungsrate.',5],
 panzer:['Panzerplatten','Immer aktiv: +1 RK, solange du Rüstung trägst.',5],
 rauch:['Rauchwerfer','Aktion, 1 Zelle: 6-m-Kugel aus dichtem Rauch in 18 m, die 1 Minute lang jede Sicht versperrt.',5],
 gravitation:['Gravitationsfalle','Aktion, 3 Zellen: 6-m-Kugel in 36 m, STÄ-Rettungswurf gegen 3W10 Wuchtschaden und festgesetzt bis zum Ende deines nächsten Zuges; bei Erfolg halber Schaden.',15],
 kern:['Überladungskern','Bonusaktion, 1× pro langer Rast: 1 Minute lang kosten deine Module 1 Zelle weniger (mindestens 0).',15],
 phase:['Phasenfeld','Reaktion, wenn du Schaden nimmst, 3 Zellen: Resistenz gegen allen Schaden bis zum Ende des Zuges.',15]
};

const HB_CLASSES = {
 rk:{ name:'Runenmeister', hd:10, prim:['str','dex','int'], saves:['str','int'], skillN:2, skills:['ath','his','arc','ins','inv','prc','sur'], armor:['light','medium','heavy','shield'], weapons:'martial', home:true,
  mastery: step(2,[[4,3],[10,4]]), fightingStyle:2, asi:[4,8,12,16],
  options:{ key:'runes', label:'Runen', n: step(2,[[3,3],[5,4],[7,5],[9,6],[11,7],[13,8],[15,9],[17,10]]), list: RUNES, cost:'Runenaktivierungen' },
  table:(l)=>[['Bekannte Runen',step(2,[[3,3],[5,4],[7,5],[9,6],[11,7],[13,8],[15,9],[17,10]])(l)],['Aktive Runen',step(1,[[3,2],[9,3],[17,4]])(l)],['Runenwürfel',RW_DIE(l)],['Runenstufen',l>=15?'niedere, mittlere, hohe':l>=5?'niedere, mittlere':'niedere']],
  res:(l,c)=>[{k:'rune',n:'Runenaktivierungen (je aktive Rune)',max:step(1,[[3,2],[9,3],[17,4]])(l)*(l>=20?2:1),reset:'short'}],
  feats:[
   [1,'Runenprägung','Nach einer langen Rast prägst du so viele bekannte Runen, wie die Tabelle als aktiv angibt, auf deine Ausrüstung (siehe Ort der Rune). Jede aktive Rune wirkt dauerhaft und kann einmal pro kurzer Rast aktiviert werden. Runen-SG = 8 + ÜB + INT-Mod. Mittlere Runen ab Stufe 5, hohe ab Stufe 15.'],
   [1,'Waffenmeisterschaft','Du nutzt die Meisterschaft von so vielen Waffen, wie die Tabelle angibt.'],
   [2,'Kampfstil','Du erhältst ein Kampfstil-Talent.'],
   [2,'Runenkunde','Du kannst Magie entdecken und Identifizieren als Ritual wirken, ohne Material; Schriften und Runen verstehst du, als wären sie in einer dir bekannten Sprache.'],
   [3,'Runentradition','Wähle eine Unterklasse.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [7,'Runenwiderhall','Aktivierst du eine Rune, erhältst du 1 Runenwürfel + INT-Mod temporäre TP.'],
   [9,'Lebende Schrift','Bei einer kurzen Rast darfst du eine aktive Rune gegen eine andere bekannte Rune tauschen.'],
   [11,'Runenschlag','Einmal pro Zug verursacht ein Treffer mit einer Waffe, auf der eine Rune aktiv ist, zusätzlich 1 Runenwürfel Energieschaden.'],
   [13,'Gefestigte Prägung','Solange mindestens eine Rune aktiv ist, hast du Vorteil auf Rettungswürfe gegen bezaubert und verängstigt.'],
   [15,'Hohe Runen','Du darfst hohe Runen lernen und prägen.'],
   [20,'Meister der Runen','Jede aktive Rune kann zweimal pro kurzer Rast aktiviert werden.']
  ],
  subs:[
   { id:'guard', name:'Tradition der Wächterrunen', feats:[
    [3,'Schildwacht','Du kennst die Schutzrune zusätzlich. Als Reaktion, wenn eine Kreatur in 1,5 m einen anderen als dich angreift, gibst du dem Angriff Nachteil.'],
    [6,'Geteilter Schutz','Die Aktivierung deiner Schutzrune darf auch den Schaden eines Verbündeten in 9 m verringern.'],
    [10,'Unverrückbar','Du und Verbündete in 3 m habt Vorteil auf Rettungswürfe gegen verängstigt und gegen Umwerfen oder Verschieben.'],
    [14,'Runenbollwerk','Aktion, 1× pro langer Rast: 1 Minute lang haben Verbündete in 3 m (auch du) Resistenz gegen allen Schaden ausser psychischem.'],
    [18,'Lebendige Festung','+1 RK, solange mindestens drei Runen aktiv sind. Die Schutzrune kannst du zweimal pro kurzer Rast aktivieren.']]},
   { id:'war', name:'Tradition der Kriegsrunen', feats:[
    [3,'Runenklinge','Du kennst die Glutrune zusätzlich. Einmal pro Zug verursacht ein Treffer mit einer gerunten Waffe +1 Runenwürfel Schaden (Feuer, Kälte, Blitz oder Schall nach Wahl).'],
    [6,'Überladung','Aktivierst du eine Waffenrune, hast du Vorteil auf deinen nächsten Angriff gegen dasselbe Ziel in diesem Zug.'],
    [10,'Elementarer Ausbruch','Bei einem kritischen Treffer mit einer gerunten Waffe machen Kreaturen deiner Wahl in 3 m um das Ziel einen GES-Rettungswurf – 2 Runenwürfel Schaden, bei Erfolg die Hälfte.'],
    [14,'Zweite Ladung','Waffenrunen kannst du zweimal pro kurzer Rast aktivieren.'],
    [18,'Runensturm','Bonusaktion, 1× pro langer Rast: 1 Minute lang verursacht Runenklinge +2 Runenwürfel, und jeder Treffer setzt die Bewegungsrate des Ziels bis zu deinem nächsten Zug auf 0.']]},
   { id:'shift', name:'Tradition der Wandelrunen', feats:[
    [3,'Gleitschrift','Du kennst die Sturmschrittrune zusätzlich. Bonusaktion: Teleport bis 3 m an einen sichtbaren Ort, ÜB-mal pro langer Rast.'],
    [6,'Versetzen','Einmal pro Zug, wenn du mit einer gerunten Waffe triffst, darfst du das Ziel (höchstens gross) 3 m verschieben oder mit ihm die Plätze tauschen, wenn es in Reichweite ist.'],
    [10,'Weite Klinge','Deine Nahkampfreichweite mit gerunten Waffen steigt um 1,5 m.'],
    [14,'Phasenschritt','Reaktion, wenn du angegriffen wirst, 1× pro kurzer Rast: Der Angriff hat Nachteil, danach teleportierst du dich bis zu 6 m.'],
    [18,'Wandelmeister','Gleitschrift reicht 9 m weit und kann INT-Mod-mal pro kurzer Rast genutzt werden.']]}
  ]},
 bw:{ name:'Blutweber', hd:8, prim:['con'], saves:['con','cha'], skillN:2, skills:['arc','itm','med','ins','rel','sur'], armor:['light'], weapons:'simple', home:true,
  asi:[4,8,12,16],
  options:{ key:'rites', label:'Blutriten', n: (l)=> l<2?0:step(2,[[5,3],[9,4],[15,5]])(l), list: RITES },
  table:(l)=>[['Blutladungen',step(2,[[5,3],[11,4],[17,5]])(l)],['Blutwürfel',RW_DIE(l)],['Blutlanze',step(1,[[5,2],[11,3],[17,4]])(l)+' Strahl(en), je 1W10'],['Blutpreis',(l>=13?Math.ceil(l/2):l+2)+' TP'],['Blutriten',l<2?'—':step(2,[[5,3],[9,4],[15,5]])(l)]],
  res:(l,c)=>[{k:'blood',n:'Blutladungen',max:step(2,[[5,3],[11,4],[17,5]])(l),reset:'short'}].concat(l>=15?[{k:'bloodbann',n:'Blutbann',max:1,reset:'long'}]:[]),
  feats:[
   [1,'Blutmagie','Konstitution ist dein Blutattribut. Blut-SG = 8 + ÜB + KON-Mod, Blutangriff = ÜB + KON-Mod. Blutlanze: Magieaktion, Fernkampfangriff (18 m), 1W10 nekrotischer Schaden; ab Stufe 5 zwei Strahlen, ab 11 drei, ab 17 vier (je eigener Angriff).'],
   [1,'Blutladungen','Deine Blutladungen (Tabelle) kehren bei einer kurzen oder langen Rast zurück.'],
   [1,'Blutpreis','Einmal pro Zug darfst du statt einer Blutladung Trefferpunkte opfern (Tabelle: Stufe + 2, ab Stufe 13 nur die halbe Stufe). Temporäre TP zählen nicht, und du kannst dadurch nicht unter 1 TP fallen.'],
   [1,'Blutstillung','Bonusaktion, 1 Blutladung: Eine berührte Kreatur heilt 2 Blutwürfel + KON-Mod TP. Dich selbst kannst du so nur einmal pro kurzer Rast heilen.'],
   [2,'Roter Faden','Bonusaktion, 1 Blutladung: Markiere eine Kreatur in 18 m bis zu deiner nächsten Rast (keine Konzentration). Einmal pro Zug, wenn du ihr Schaden zufügst, erleidet sie +1 Blutwürfel nekrotischen Schaden. Fällt sie auf 0 TP, kannst du die Markierung als Bonusaktion kostenlos übertragen.'],
   [2,'Blutriten','Du lernst Blutriten (Anzahl siehe Tabelle). Nach einem Stufenaufstieg darfst du einen austauschen.'],
   [3,'Bluttradition','Wähle eine Unterklasse.'],
   [5,'Verdichtetes Blut','Resistenz gegen nekrotischen Schaden.'],
   [7,'Blutsinn','Bonusaktion, 1 Blutladung: 1 Minute lang nimmst du jede Kreatur mit Blut in 9 m wahr, auch unsichtbare und verborgene.'],
   [9,'Aderbann','Aktion, 1 Blutladung: Eine Kreatur in 18 m macht einen KON-Rettungswurf oder ist 1 Minute festgesetzt (Wiederholung am Ende jedes ihrer Züge; Konzentration).'],
   [13,'Unerschöpflich','Blutpreis kostet nur noch die halbe Stufe (aufgerundet).'],
   [15,'Blutbann','Reaktion, wenn eine Kreatur in 18 m einen Zauber wirkt, 2 Blutladungen, 1× pro langer Rast: KON-Rettungswurf, bei Misserfolg scheitert der Zauber.'],
   [20,'Herr des roten Fadens','Roter Faden kann zwei Kreaturen gleichzeitig markieren. Würfelst du Initiative und hast weniger als 2 Blutladungen, erhältst du 2 zurück.']
  ],
  subs:[
   { id:'battle', name:'Tradition des Schlachtbluts', feats:[
    [3,'Kriegsblut','Übung mit mittelschwerer Rüstung, Schilden und Kriegswaffen; du nutzt KON für Angriff und Schaden mit Waffen. Bei einem Waffentreffer kannst du 1 Blutladung ausgeben: +2 Blutwürfel nekrotischer Schaden.'],
    [6,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an; einen der Angriffe darfst du durch einen Strahl der Blutlanze ersetzen.'],
    [10,'Blutrausch','Zahlst du Blutpreis, erhältst du temporäre TP in Höhe deiner Stufe.'],
    [14,'Rote Ernte','Bringst du eine Kreatur auf 0 TP, erhältst du 1 Blutladung zurück (einmal pro Zug).'],
    [18,'Unsterbliches Blut','Fällst du auf 0 TP, hast du stattdessen die Hälfte deiner maximalen TP. 1× pro langer Rast.']]},
   { id:'vein', name:'Tradition der Aderkunde', feats:[
    [3,'Schwächender Faden','Die vom Roten Faden markierte Kreatur zieht 1W4 von Rettungswürfen gegen deine Blutfähigkeiten ab. Du lernst den Blutritus Ausbluten zusätzlich.'],
    [6,'Fluchgeflecht','Roter Faden und Aderbann reichen 36 m weit. Einmal pro Zug darfst du der markierten Kreatur Nachteil auf eine Probe geben (keine Aktion).'],
    [10,'Geteiltes Leid','Reaktion, wenn du Schaden nimmst, 1 Blutladung: Die Hälfte des Schadens erleidet stattdessen die markierte Kreatur.'],
    [14,'Marionette','Aktion, 2 Blutladungen, 1× pro langer Rast: Die markierte Kreatur macht einen KON-Rettungswurf; bei Misserfolg bewegst du sie bis zu 4,5 m, und sie nutzt ihre Reaktion für einen Angriff gegen ein Ziel deiner Wahl.'],
    [18,'Herz anhalten','Aktion, 1× pro langer Rast: Die markierte Kreatur macht einen KON-Rettungswurf – 10 Blutwürfel nekrotischer Schaden, bei Erfolg die Hälfte.']]},
   { id:'life', name:'Tradition des Lebenswebers', feats:[
    [3,'Lebensfluss','Blutstillung reicht 9 m weit und heilt zusätzlich deinen KON-Mod. Bonusaktion: Du opferst bis zu deiner doppelten Stufe an TP; eine Kreatur in 9 m heilt genauso viel.'],
    [6,'Gemeinsamer Puls','Heilst du eine andere Kreatur, heilst du selbst die Hälfte davon (einmal pro Runde).'],
    [10,'Stabilisieren','Reaktion, wenn ein Verbündeter in 18 m auf 0 TP fällt, 1 Blutladung: Er hat stattdessen 1 TP + 1 Blutwürfel.'],
    [14,'Lebensnetz','Aktion, 1× pro langer Rast: Bis zu sechs Kreaturen in 9 m heilen je 3 Blutwürfel + KON-Mod.'],
    [18,'Zweiter Herzschlag','Fällt ein Verbündeter in 18 m auf 0 TP, hat er stattdessen die Hälfte seiner maximalen TP. 1× pro langer Rast.']]}
  ]},
 fk:{ name:'Fluchklinge', hd:10, prim:['str','dex','cha'], saves:['dex','cha'], skillN:2, skills:['acr','ath','dec','itm','ins','prc','arc'], armor:['light','medium','shield'], weapons:'martial', home:true,
  mastery: ()=>2, fightingStyle:2, asi:[4,8,12,16],
  options:{ key:'curses', label:'Flüche', n:(l)=> l<2?0:step(2,[[5,3],[9,4],[13,5],[17,6]])(l), list: CURSES },
  table:(l)=>[['Fluchmarke',(l>=20?'unbegrenzt':(2+Math.floor((l-1)/4))+'×')],['Fluchwürfel','1'+RW_DIE(l)],['Flüche',l<2?'—':step(2,[[5,3],[9,4],[13,5],[17,6]])(l)],['Markendauer',l>=9?'1 Stunde':'1 Minute']],
  res:(l,c)=> l>=20?[]:[{k:'mark',n:'Fluchmarke',max:2+Math.floor((l-1)/4),reset:'long'}],
  feats:[
   [1,'Fluchmarke','Bonusaktion: Markiere eine Kreatur in 18 m (1 Minute, keine Konzentration; Nutzungen siehe Tabelle). Einmal pro Zug, wenn du sie mit einer Waffe triffst, verursachst du entweder 1 Fluchwürfel nekrotischen oder psychischen Schaden oder löst einen deiner Flüche aus. Fällt das Ziel auf 0 TP, kannst du die Marke als Bonusaktion kostenlos versetzen. Fluch-SG = 8 + ÜB + CHA-Mod.'],
   [1,'Waffenmeisterschaft','Meisterschaft von zwei Waffen deiner Wahl.'],
   [2,'Kampfstil','Du erhältst ein Kampfstil-Talent.'],
   [2,'Flüche','Du lernst Flüche (Anzahl siehe Tabelle). Nach einem Stufenaufstieg darfst du einen austauschen.'],
   [3,'Fluchpfad','Wähle eine Unterklasse.'],
   [3,'Verfluchte Präzision','Gegen dein markiertes Ziel erzielst du bei 19–20 einen kritischen Treffer.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [7,'Fluchgespür','Vorteil auf Rettungswürfe gegen Zauber und Fähigkeiten deines markierten Ziels.'],
   [9,'Unentrinnbar','Die Fluchmarke hält 1 Stunde und reicht 36 m weit.'],
   [11,'Doppelfluch','Löst du einen Fluch aus, verursachst du zusätzlich den Fluchwürfel-Schaden.'],
   [13,'Springende Marke','Fällt das markierte Ziel auf 0 TP, springt die Marke als Reaktion auf eine Kreatur in 9 m davon.'],
   [15,'Verfluchte Haut','Resistenz gegen den Schaden deines markierten Ziels.'],
   [20,'Herr der Flüche','Die Fluchmarke kostet keine Nutzungen mehr, und du kannst zwei Kreaturen gleichzeitig markieren.']
  ],
  subs:[
   { id:'blade', name:'Pfad der Verfluchten Klinge', feats:[
    [3,'Gebundene Klinge','Nach einer langen Rast bindest du eine Waffe an dich. Mit ihr nutzt du CHA statt STÄ oder GES für Angriff und Schaden, und sie gilt als magisch.'],
    [6,'Hunger der Klinge','Triffst du dein markiertes Ziel mit der gebundenen Klinge, erhältst du CHA-Mod temporäre TP (einmal pro Zug).'],
    [10,'Schattenhieb','Deine Reichweite mit der gebundenen Klinge steigt um 1,5 m.'],
    [14,'Seelendurst','Fällt dein markiertes Ziel auf 0 TP, heilst du Fluchklingen-Stufe + CHA-Mod TP.'],
    [18,'Meisterklinge','Gegen dein markiertes Ziel erzielst du bei 18–20 einen kritischen Treffer; bei einem kritischen Treffer löst du zusätzlich einen Fluch aus.']]},
   { id:'judge', name:'Pfad des Bannrichters', feats:[
    [3,'Richterspruch','Du lernst Fluch der Schwäche und Fluch des Schweigens zusätzlich (sie zählen nicht gegen deine Anzahl). Dein Fluch-SG steigt um 1.'],
    [6,'Bannkreis','Dein markiertes Ziel kann sich nicht teleportieren oder die Ebene wechseln, ausser es schafft einen CHA-Rettungswurf.'],
    [10,'Urteil','Reaktion, wenn dein markiertes Ziel einen Zauber wirkt, 1× pro kurzer Rast: CHA-Rettungswurf, bei Misserfolg scheitert der Zauber.'],
    [14,'Bindendes Urteil','Rettungswürfe gegen deine Flüche haben Nachteil, wenn das Ziel in diesem Zug schon von dir getroffen wurde.'],
    [18,'Letztes Urteil','Aktion, 1× pro langer Rast: Hat dein markiertes Ziel höchstens 50 TP, macht es einen CHA-Rettungswurf oder fällt auf 0 TP; bei Erfolg 6 Fluchwürfel psychischer Schaden.']]},
   { id:'shadow', name:'Pfad des Schattenjägers', feats:[
    [3,'Schattenschritt','Dunkelsicht 18 m (oder +9 m). Bonusaktion, ÜB-mal pro langer Rast: Teleport bis 9 m an einen Ort im Dämmerlicht oder Dunkel.'],
    [6,'Fährte','Entfernt sich dein markiertes Ziel von dir, sinkt seine Bewegungsrate um 3 m. Du kannst Spurt als Bonusaktion nutzen, wenn du dich auf das markierte Ziel zubewegst.'],
    [10,'Aus dem Schatten','Dein erster Angriff in einem Zug, in dem du dich teleportiert hast, hat Vorteil.'],
    [14,'Unsichtbarer Jäger','Bonusaktion, 1× pro kurzer Rast: Du bist bis zum Ende deines nächsten Zuges unsichtbar.'],
    [18,'Jagdende','Triffst du dein markiertes Ziel, während es höchstens die Hälfte seiner TP hat, verursachst du einmal pro Zug +3 Fluchwürfel Schaden.']]}
  ]},
 ma:{ name:'Maschinist', hd:8, prim:['int'], saves:['con','int'], skillN:2, skills:['arc','his','inv','slt','prc','sur'], armor:['light','medium','shield'], weapons:'simple', home:true,
  extraWeapons:['hcrossbow','hvcrossbow','pistol','musket'], asi:[4,8,12,16],
  options:{ key:'modules', label:'Gerätemodule', n: step(4,[[3,5],[5,6],[7,7],[9,8],[11,9],[13,10],[15,11],[17,12]]), list: MODULES },
  table:(l)=>[['Bekannte Module',step(4,[[3,5],[5,6],[7,7],[9,8],[11,9],[13,10],[15,11],[17,12]])(l)],['Aktive Module',step(2,[[3,3],[7,4],[11,5],[15,6]])(l)],['Energiezellen',step(2,[[3,3],[5,4],[7,5],[9,6],[11,7],[13,8],[15,9],[17,10]])(l)],['Modulstufen',l>=15?'Grund, verbessert, Meister':l>=5?'Grund, verbessert':'Grund']],
  res:(l,c)=>[{k:'cells',n:'Energiezellen',max:step(2,[[3,3],[5,4],[7,5],[9,6],[11,7],[13,8],[15,9],[17,10]])(l),reset:'short'}].concat(l>=20?[{k:'genius',n:'Genie',max:1,reset:'long'}]:[]),
  feats:[
   [1,'Präzisionsmechanik','Du bist geübt mit Handarmbrust, schwerer Armbrust, Pistole und Muskete und nutzt INT statt GES für Angriff und Schaden mit Armbrüsten und Feuerwaffen. Geräte-SG = 8 + ÜB + INT-Mod.'],
   [1,'Gerätemodule','Nach einer langen Rast bringst du so viele bekannte Module an deiner Ausrüstung an, wie die Tabelle als aktiv angibt. Viele Module kosten Energiezellen; diese kehren bei einer kurzen oder langen Rast zurück. Verbesserte Module ab Stufe 5, Meistermodule ab 15.'],
   [2,'Tüftlerblick','Expertise mit Tüftlerwerkzeug und Diebeswerkzeug. Du kannst Identifizieren als Ritual wirken.'],
   [2,'Schnellbau','Bei einer kurzen Rast darfst du ein aktives Modul gegen ein anderes bekanntes tauschen.'],
   [3,'Spezialisierung','Wähle eine Unterklasse.'],
   [5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
   [7,'Reflexschutz','Vorteil auf GES-Rettungswürfe gegen Fallen, Explosionen und Flächeneffekte.'],
   [9,'Überdruck','Einmal pro Zug, wenn ein Modul Schaden verursacht, addierst du deinen INT-Mod zu einem Schadenswurf.'],
   [11,'Notreserve','Würfelst du Initiative und hast weniger als 2 Energiezellen, erhältst du 2 zurück.'],
   [13,'Schnellwechsel','Als Bonusaktion tauschst du ein aktives Modul gegen ein bekanntes, 1× pro langer Rast.'],
   [15,'Meistermodule','Du darfst Meistermodule bauen.'],
   [17,'Perfektionierte Technik','Dein Geräte-SG und deine Angriffe mit Armbrüsten und Feuerwaffen erhalten +1.'],
   [20,'Genie','Würfelst du Initiative, erhältst du alle Energiezellen zurück. 1× pro langer Rast.']
  ],
  subs:[
   { id:'combat', name:'Kampfingenieur', feats:[
    [3,'Panzerschmied','Übung mit schwerer Rüstung und Kriegswaffen. Deine Rüstung gibt dir +1 RK, solange du sie selbst gewartet hast (eine kurze Rast).'],
    [6,'Waffenmodifikation','Eine Waffe verursacht einmal pro Zug zusätzlich 1W6 Blitz-, Feuer- oder Schallschaden.'],
    [10,'Reaktivpanzer','Dein Rückstossdämpfer verringert den Schaden zusätzlich um deine Maschinisten-Stufe.'],
    [14,'Schlachtanzug','Bonusaktion, 1× pro langer Rast: 1 Minute lang +2 RK und Resistenz gegen Wucht-, Stich- und Hiebschaden.'],
    [18,'Kriegsmaschine','Mit der Angriffsaktion greifst du dreimal an.']]},
   { id:'field', name:'Feldtechniker', feats:[
    [3,'Fallenbauer','Aktion, 1 Zelle: Du legst eine Falle in 1,5 m (1,5-m-Würfel, bis zu einer Stunde). Wer sie betritt, macht einen GES-Rettungswurf gegen 2W10 Schaden und ist festgesetzt; bei Erfolg halber Schaden. Expertise in Nachforschungen.'],
    [6,'Fernzünder','Reichweiten deiner Fallen, Kapseln und Granaten verdoppeln sich; Fallen kannst du als Bonusaktion aus 18 m auslösen.'],
    [10,'Improvisation','Je 1× pro langer Rast wirkst du Federfall, Spinnenklettern und Unsichtbares sehen ohne Zauberplatz (INT als Zauberattribut).'],
    [14,'Barrikade','Aktion, 2 Zellen: Eine 6 m lange Wand in 9 m gibt 1 Minute lang Dreivierteldeckung.'],
    [18,'Meistertechniker','Ausserhalb des Kampfes kosten deine Module keine Energiezellen.']]},
   { id:'alch', name:'Alchemistischer Konstrukteur', feats:[
    [3,'Phiolen','Bonusaktion, 1 Zelle: Du wirfst eine Phiole (18 m, Fernkampfangriff mit INT): 2W6 + INT-Mod Feuer- oder Säureschaden – oder eine Heilphiole: Eine Kreatur heilt 1W8 + INT-Mod TP.'],
    [6,'Reagenzienkunde','Resistenz gegen Säure- und Giftschaden; Übung mit Alchemistenzubehör.'],
    [10,'Konzentrat','Deine Schadensphiolen verursachen 3W6 + INT-Mod und treffen auch Kreaturen in 1,5 m um das Ziel (GES-Rettungswurf, halber Schaden).'],
    [14,'Klebstoffbombe','Aktion, 2 Zellen: 4,5-m-Kugel in 18 m, GES-Rettungswurf oder 1 Minute festgesetzt (Wiederholung am Ende jedes Zuges).'],
    [18,'Grosses Werk','Aktion, 1× pro langer Rast: 6-m-Kugel in 45 m, GES-Rettungswurf gegen 8W6 Feuer- und 8W6 Säureschaden, bei Erfolg die Hälfte.']]}
  ]}
};
for (const C of Object.values(HB_CLASSES)) { C.sub = { id: C.subs[0].id, name: C.subs[0].name, lv:[3,6,10,14,18] }; C.subFeats = C.subs[0].feats; }
Object.assign(CLASSES, HB_CLASSES);

/* ---------- Völker ---------- */
Object.assign(SPECIES, {
 mykori:{ name:'Mykori', size:'Klein oder Mittelgross', speed:9, dv:18, spellAbility:true, home:true,
  traits:(c)=>[['Dunkelsicht','18 m.'],['Sporenflüstern','Du kannst einer bereitwilligen Kreatur in 9 m lautlos eine kurze Botschaft oder Stimmung übermitteln; sie kann dir auf dieselbe Weise antworten.'],['Fäulnisfest','Resistenz gegen Giftschaden und Vorteil auf Rettungswürfe gegen vergiftet und Krankheiten.'],['Sporenwolke','Bonusaktion, ÜB-mal pro langer Rast: Kreaturen deiner Wahl in 3 m machen einen KON-Rettungswurf (SG ' + (8 + c.mod.con + c.pb) + ') oder sind bis zum Ende deines nächsten Zuges vergiftet.'],['Myzelmagie','Druidenkunst; ab Stufe 3 Verstricken, ab 5 Spurloses Gehen (je 1× pro langer Rast ohne Platz).']],
  spells:(c)=>['druidcraft'].concat(c.level>=3?['entangle']:[]).concat(c.level>=5?['pass-without-trace']:[]),
  res:(c)=>[{k:'spores',n:'Sporenwolke',max:c.pb,reset:'long'}] },
 vesperkin:{ name:'Vesperkin', size:'Klein oder Mittelgross', speed:9, dv:36, skillPick:['prc','ste'], spellAbility:true, home:true,
  traits:(c)=>[['Dunkelsicht','36 m.'],['Dämmerungssinn','Übung in Wahrnehmung oder Heimlichkeit.'],['Schattenerbe','Resistenz gegen nekrotischen Schaden.'],['Schattenschritt','Bonusaktion, ÜB-mal pro langer Rast: Im Dämmerlicht oder Dunkel teleportierst du dich bis zu 9 m an einen Ort, der ebenfalls im Dämmerlicht oder Dunkel liegt.'],['Dämmerzauber','Kleine Illusion; ab Stufe 3 Selbstverkleidung, ab 5 Dunkelheit (je 1× pro langer Rast ohne Platz).']],
  spells:(c)=>['minor-illusion'].concat(c.level>=3?['disguise-self']:[]).concat(c.level>=5?['darkness']:[]),
  res:(c)=>[{k:'vstep',n:'Schattenschritt',max:c.pb,reset:'long'}] },
 steinblut:{ name:'Steinblütiger', size:'Mittelgross', speed:9, dv:0, skillPick:['inv','sur'], home:true, natAc:13,
  traits:(c)=>[['Steinhaut','Ohne Rüstung ist deine RK 13 + GES-Mod (ein Schild ist erlaubt).'],['Fester Stand','Vorteil auf Würfe gegen Umwerfen, Verschieben und Wegstossen, solange du auf festem Boden stehst.'],['Steinleser','Übung in Nachforschungen oder Überlebenskunst. Untersuchst du Fels oder Mauerwerk, darfst du der Spielleitung eine Frage zu Alter oder Stabilität stellen.'],['Steinwerdung','Reaktion, wenn du Wucht-, Stich- oder Hiebschaden nimmst, ÜB-mal pro langer Rast: Du hast Resistenz gegen diesen Schaden.']],
  res:(c)=>[{k:'stoneform',n:'Steinwerdung',max:c.pb,reset:'long'}] }
});
Object.assign(MC_ARMOR, { rk: ['light', 'medium', 'shield'], bw: ['light'], fk: ['light', 'medium', 'shield'], ma: ['light', 'medium', 'shield'] });
Object.assign(MC_PREREQ, { rk: [['str', 'dex'], ['int']], bw: [['con']], fk: [['cha']], ma: [['int']] });
MC_MARTIAL.push('rk', 'fk');
