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
   { id:'guard', name:'Tradition der Wächterrunen', grant:{3:['schutz']}, res:(l)=> l>=14?[{k:'rkboll',n:'Runenbollwerk',max:1,reset:'long'}]:[], feats:[
    [3,'Schildwacht','Du kennst die Schutzrune zusätzlich. Als Reaktion, wenn eine Kreatur in 1,5 m einen anderen als dich angreift, gibst du dem Angriff Nachteil.'],
    [6,'Geteilter Schutz','Die Aktivierung deiner Schutzrune darf auch den Schaden eines Verbündeten in 9 m verringern.'],
    [10,'Unverrückbar','Du und Verbündete in 3 m habt Vorteil auf Rettungswürfe gegen verängstigt und gegen Umwerfen oder Verschieben.'],
    [14,'Runenbollwerk','Aktion, 1× pro langer Rast: 1 Minute lang haben Verbündete in 3 m (auch du) Resistenz gegen allen Schaden ausser psychischem.'],
    [18,'Lebendige Festung','+1 RK, solange mindestens drei Runen aktiv sind. Die Schutzrune kannst du zweimal pro kurzer Rast aktivieren.']]},
   { id:'war', name:'Tradition der Kriegsrunen', grant:{3:['glut']}, res:(l)=> l>=18?[{k:'rksturm',n:'Runensturm',max:1,reset:'long'}]:[], feats:[
    [3,'Runenklinge','Du kennst die Glutrune zusätzlich. Einmal pro Zug verursacht ein Treffer mit einer runenbeschrifteten Waffe +1 Runenwürfel Schaden (Feuer, Kälte, Blitz oder Schall nach Wahl).'],
    [6,'Überladung','Aktivierst du eine Waffenrune, hast du Vorteil auf deinen nächsten Angriff gegen dasselbe Ziel in diesem Zug.'],
    [10,'Elementarer Ausbruch','Bei einem kritischen Treffer mit einer runenbeschrifteten Waffe machen Kreaturen deiner Wahl in 3 m um das Ziel einen GES-Rettungswurf – 2 Runenwürfel Schaden, bei Erfolg die Hälfte.'],
    [14,'Zweite Ladung','Waffenrunen kannst du zweimal pro kurzer Rast aktivieren.'],
    [18,'Runensturm','Bonusaktion, 1× pro langer Rast: 1 Minute lang verursacht Runenklinge +2 Runenwürfel, und jeder Treffer setzt die Bewegungsrate des Ziels bis zu deinem nächsten Zug auf 0.']]},
   { id:'shift', name:'Tradition der Wandelrunen', grant:{3:['sturm']}, res:(l,c)=>[l>=18?{k:'rkgleit',n:'Gleitschrift',max:Math.max(1,c.mod.int),reset:'short'}:{k:'rkgleit',n:'Gleitschrift',max:c.pb,reset:'long'}].concat(l>=14?[{k:'rkphase',n:'Phasenschritt',max:1,reset:'short'}]:[]), feats:[
    [3,'Gleitschrift','Du kennst die Sturmschrittrune zusätzlich. Bonusaktion: Teleport bis 3 m an einen sichtbaren Ort, ÜB-mal pro langer Rast.'],
    [6,'Versetzen','Einmal pro Zug, wenn du mit einer runenbeschrifteten Waffe triffst, darfst du das Ziel (höchstens gross) 3 m verschieben oder mit ihm die Plätze tauschen, wenn es in Reichweite ist.'],
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
   { id:'battle', name:'Tradition des Schlachtbluts', res:(l)=> l>=18?[{k:'bwundying',n:'Unsterbliches Blut',max:1,reset:'long'}]:[], feats:[
    [3,'Kriegsblut','Übung mit mittelschwerer Rüstung, Schilden und Kriegswaffen; du nutzt KON für Angriff und Schaden mit Waffen. Bei einem Waffentreffer kannst du 1 Blutladung ausgeben: +2 Blutwürfel nekrotischer Schaden.'],
    [6,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an; einen der Angriffe darfst du durch einen Strahl der Blutlanze ersetzen.'],
    [10,'Blutrausch','Zahlst du Blutpreis, erhältst du temporäre TP in Höhe deiner Stufe.'],
    [14,'Rote Ernte','Bringst du eine Kreatur auf 0 TP, erhältst du 1 Blutladung zurück (einmal pro Zug).'],
    [18,'Unsterbliches Blut','Fällst du auf 0 TP, hast du stattdessen die Hälfte deiner maximalen TP. 1× pro langer Rast.']]},
   { id:'vein', name:'Tradition der Aderkunde', grant:{3:['ausbluten']}, res:(l)=>(l>=14?[{k:'bwmario',n:'Marionette',max:1,reset:'long'}]:[]).concat(l>=18?[{k:'bwherz',n:'Herz anhalten',max:1,reset:'long'}]:[]), feats:[
    [3,'Schwächender Faden','Die vom Roten Faden markierte Kreatur zieht 1W4 von Rettungswürfen gegen deine Blutfähigkeiten ab. Du lernst den Blutritus Ausbluten zusätzlich.'],
    [6,'Fluchgeflecht','Roter Faden und Aderbann reichen 36 m weit. Einmal pro Zug darfst du der markierten Kreatur Nachteil auf eine Probe geben (keine Aktion).'],
    [10,'Geteiltes Leid','Reaktion, wenn du Schaden nimmst, 1 Blutladung: Die Hälfte des Schadens erleidet stattdessen die markierte Kreatur.'],
    [14,'Marionette','Aktion, 2 Blutladungen, 1× pro langer Rast: Die markierte Kreatur macht einen KON-Rettungswurf; bei Misserfolg bewegst du sie bis zu 4,5 m, und sie nutzt ihre Reaktion für einen Angriff gegen ein Ziel deiner Wahl.'],
    [18,'Herz anhalten','Aktion, 1× pro langer Rast: Die markierte Kreatur macht einen KON-Rettungswurf – 10 Blutwürfel nekrotischer Schaden, bei Erfolg die Hälfte.']]},
   { id:'life', name:'Tradition des Lebenswebers', res:(l)=>(l>=14?[{k:'bwnetz',n:'Lebensnetz',max:1,reset:'long'}]:[]).concat(l>=18?[{k:'bwherz2',n:'Zweiter Herzschlag',max:1,reset:'long'}]:[]), feats:[
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
   { id:'judge', name:'Pfad des Bannrichters', grant:{3:['schwaeche','schweigen']}, res:(l)=>(l>=10?[{k:'fkurteil',n:'Urteil',max:1,reset:'short'}]:[]).concat(l>=18?[{k:'fklast',n:'Letztes Urteil',max:1,reset:'long'}]:[]), feats:[
    [3,'Richterspruch','Du lernst Fluch der Schwäche und Fluch des Schweigens zusätzlich (sie zählen nicht gegen deine Anzahl). Dein Fluch-SG steigt um 1.'],
    [6,'Bannkreis','Dein markiertes Ziel kann sich nicht teleportieren oder die Ebene wechseln, ausser es schafft einen CHA-Rettungswurf.'],
    [10,'Urteil','Reaktion, wenn dein markiertes Ziel einen Zauber wirkt, 1× pro kurzer Rast: CHA-Rettungswurf, bei Misserfolg scheitert der Zauber.'],
    [14,'Bindendes Urteil','Rettungswürfe gegen deine Flüche haben Nachteil, wenn das Ziel in diesem Zug schon von dir getroffen wurde.'],
    [18,'Letztes Urteil','Aktion, 1× pro langer Rast: Hat dein markiertes Ziel höchstens 50 TP, macht es einen CHA-Rettungswurf oder fällt auf 0 TP; bei Erfolg 6 Fluchwürfel psychischer Schaden.']]},
   { id:'shadow', name:'Pfad des Schattenjägers', res:(l,c)=>[{k:'fkstep',n:'Schattenschritt',max:c.pb,reset:'long'}].concat(l>=14?[{k:'fkinvis',n:'Unsichtbarer Jäger',max:1,reset:'short'}]:[]), feats:[
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
  res:(l,c)=>[{k:'cells',n:'Energiezellen',max:step(2,[[3,3],[5,4],[7,5],[9,6],[11,7],[13,8],[15,9],[17,10]])(l),reset:'short'}].concat(l>=13?[{k:'maswap',n:'Schnellwechsel',max:1,reset:'long'}]:[]).concat(l>=20?[{k:'genius',n:'Genie',max:1,reset:'long'}]:[]),
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
   { id:'combat', name:'Kampfingenieur', res:(l)=> l>=14?[{k:'masuit',n:'Schlachtanzug',max:1,reset:'long'}]:[], feats:[
    [3,'Panzerschmied','Übung mit schwerer Rüstung und Kriegswaffen. Deine Rüstung gibt dir +1 RK, solange du sie selbst gewartet hast (eine kurze Rast).'],
    [6,'Waffenmodifikation','Eine Waffe verursacht einmal pro Zug zusätzlich 1W6 Blitz-, Feuer- oder Schallschaden.'],
    [10,'Reaktivpanzer','Dein Rückstossdämpfer verringert den Schaden zusätzlich um deine Maschinisten-Stufe.'],
    [14,'Schlachtanzug','Bonusaktion, 1× pro langer Rast: 1 Minute lang +2 RK und Resistenz gegen Wucht-, Stich- und Hiebschaden.'],
    [18,'Kriegsmaschine','Mit der Angriffsaktion greifst du dreimal an.']]},
   { id:'field', name:'Feldtechniker', res:(l)=> l>=10?[{k:'maimp1',n:'Federfall (gratis)',max:1,reset:'long'},{k:'maimp2',n:'Spinnenklettern (gratis)',max:1,reset:'long'},{k:'maimp3',n:'Unsichtbares sehen (gratis)',max:1,reset:'long'}]:[], feats:[
    [3,'Fallenbauer','Aktion, 1 Zelle: Du legst eine Falle in 1,5 m (1,5-m-Würfel, bis zu einer Stunde). Wer sie betritt, macht einen GES-Rettungswurf gegen 2W10 Schaden und ist festgesetzt; bei Erfolg halber Schaden. Expertise in Nachforschungen.'],
    [6,'Fernzünder','Reichweiten deiner Fallen, Kapseln und Granaten verdoppeln sich; Fallen kannst du als Bonusaktion aus 18 m auslösen.'],
    [10,'Improvisation','Je 1× pro langer Rast wirkst du Federfall, Spinnenklettern und Unsichtbares sehen ohne Zauberplatz (INT als Zauberattribut).'],
    [14,'Barrikade','Aktion, 2 Zellen: Eine 6 m lange Wand in 9 m gibt 1 Minute lang Dreivierteldeckung.'],
    [18,'Meistertechniker','Ausserhalb des Kampfes kosten deine Module keine Energiezellen.']]},
   { id:'alch', name:'Alchemistischer Konstrukteur', res:(l)=> l>=18?[{k:'mawerk',n:'Grosses Werk',max:1,reset:'long'}]:[], feats:[
    [3,'Phiolen','Bonusaktion, 1 Zelle: Du wirfst eine Phiole (18 m, Fernkampfangriff mit INT): 2W6 + INT-Mod Feuer- oder Säureschaden – oder eine Heilphiole: Eine Kreatur heilt 1W8 + INT-Mod TP.'],
    [6,'Reagenzienkunde','Resistenz gegen Säure- und Giftschaden; Übung mit Alchemistenzubehör.'],
    [10,'Konzentrat','Deine Schadensphiolen verursachen 3W6 + INT-Mod und treffen auch Kreaturen in 1,5 m um das Ziel (GES-Rettungswurf, halber Schaden).'],
    [14,'Klebstoffbombe','Aktion, 2 Zellen: 4,5-m-Kugel in 18 m, GES-Rettungswurf oder 1 Minute festgesetzt (Wiederholung am Ende jedes Zuges).'],
    [18,'Grosses Werk','Aktion, 1× pro langer Rast: 6-m-Kugel in 45 m, GES-Rettungswurf gegen 8W6 Feuer- und 8W6 Säureschaden, bei Erfolg die Hälfte.']]}
  ]}
};
const OPT_EXTRA_RES = { vergeltung: (c) => ({ k: 'fkverg', n: 'Fluch der Vergeltung', max: c.pb, reset: 'long' }), ewig: () => ({ k: 'rkewig', n: 'Ewigkeitsrune (0 TP verhindern)', max: 1, reset: 'long' }), kern: () => ({ k: 'makern', n: 'Überladungskern', max: 1, reset: 'long' }) };
for (const [id, C] of Object.entries(HB_CLASSES)) {
  C.sub = { id: C.subs[0].id, name: C.subs[0].name, lv:[3,6,10,14,18] }; C.subFeats = C.subs[0].feats;
  const orig = C.res;
  C.res = (l, c) => {
    let r = orig ? orig(l, c) : [];
    const e = (c.classes || []).find((x) => x.id === id);
    if (e && l >= 3) { const sb = C.subs.find((x) => x.id === e.m.sub); if (sb && sb.res) r = r.concat(sb.res(l, c)); }
    const os = e ? (e.m.opts || []) : [];
    for (const [k, f] of Object.entries(OPT_EXTRA_RES)) if (os.includes(k) && C.options && C.options.list[k] && (C.options.list[k].length === 4 ? C.options.list[k][3] : C.options.list[k][2]) <= l) r.push(f(c));
    if (e && e.subGrant) for (const ks of Object.values(e.subGrant)) ks.forEach((k) => { if (OPT_EXTRA_RES[k] && !os.includes(k)) r.push(OPT_EXTRA_RES[k](c)); });
    return r;
  };
}
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

/* Heldenbuch Erweiterung: Datenmodul, eigene Regeln. Additiv für v1.9.46.
 * Feature- und Unterklassennamen sind DE; EN-Bezeichnungen werden zusätzlich gehalten.
 * Neue Mechaniken sind explizite Tischregeln, keine versteckten Änderungen an Standardregeln. */
const HX_DIE = step(4, [[5,6],[11,8],[17,10]]);
const HX_PULSE = step(1, [[5,2],[11,3],[17,4]]);
const HX_SUB_LEVELS = [3,6,10,14,18];
const HX_R = (k,n,max=1,reset='long') => ({k,n,max,reset});
const HX_S = (id,name,en,desc,feats,res) => ({id,name,en,desc,feats,res});
const HX_CLASSES = {
 hxform:{name:'Formwandler',en:'Shapeweaver',hd:10,prim:['str','dex','con'],saves:['str','con'],skillN:2,skills:['ath','acr','prc','sur','med','ste'],armor:['light','medium','shield'],weapons:'martial',home:true,mastery:step(2,[[11,3]]),asi:[4,8,12,16],hxExtra:5,hxDC:'con',
 flavor:'✦ Formwandler haben gelernt, ihre lebende Gestalt bewusst zu verändern. Sehnen, Haut und Knochen gehorchen ihrem Willen. Sie behalten ihre Persönlichkeit und ihre Ausrüstung und gelten als Meister der körperlichen Anpassung.',
 table:l=>[['Wandelwürfel','1W'+HX_DIE(l)],['Gleichzeitige Anpassungen',l>=11?2:1],['Angriffe',l>=5?2:1]],
 feats:[
 [1,'Wandelgestalt','Bonusaktion: Wähle eine Anpassung, die bis zum Beginn deines nächsten Zuges anhält. Keine Nutzungsgrenze. Klinge: Einmal in deinem Zug verursacht ein Nahkampfwaffen- oder waffenloser Treffer zusätzlich 1 Wandelwürfel des normalen Schadentyps. Panzer: Reaktion bei einem Treffer gegen dich; reduziere dessen Schaden um 1 Wandelwürfel (mindestens 0). Greifer: Deine Nahkampfreichweite im eigenen Zug steigt um 1,5 m. Sehne: Deine Gehgeschwindigkeit steigt um 3 m. Ausrüstung bleibt nutzbar. Wandel-SG = 8 + ÜB + KON-Mod.'],
 [1,'Waffenmeisterschaft','Du nutzt die Meisterschaft von zwei Waffen deiner Wahl, ab Stufe 11 drei.'],
 [2,'Anpassungsfähigkeit','Nach einer langen Rast wähle Klettern oder Schwimmen. Bis zur nächsten langen Rast entspricht diese Bewegungsrate deiner normalen Gehgeschwindigkeit.'],
 [3,'Wandelpfad','Wähle eine Unterklasse.'],[5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
 [7,'Formfestigkeit','Vorteil auf Rettungswürfe gegen fremde Effekte, die deine Gestalt gegen deinen Willen verändern würden.'],
 [9,'Verstärkte Sehnen','Beim Einsatz von Sehne erhöht sich deine Sprungweite um 3 m (innerhalb deiner Bewegung). Greifer erlaubt beim ersten Packen in deinem Zug, den Wandel-SG statt des normalen Packen-SG zu verwenden.'],
 [11,'Doppelwandel','Mit derselben Bonusaktion wählst du zwei verschiedene Anpassungen statt einer. Klinge wirkt weiterhin nur einmal im eigenen Zug.'],
 [13,'Rasche Anpassung','Beim Initiativewurf darfst du ohne Aktion eine Anpassung bis zum Beginn deines ersten Zuges aktivieren.'],
 [15,'Zellgedächtnis','Wenn du bei einer kurzen Rast mindestens einen Trefferwürfel ausgibst, addiere einmal deinen KON-Mod (mindestens 1) zur Heilung.'],
 [17,'Vollendete Form','Dein Wandelwürfel ist W10.'],
 [20,'Freier Wandel','Einmal in jedem deiner Züge aktivierst oder wechselst du deine zwei Anpassungen ohne Aktion statt als Bonusaktion. Zusätzlich darfst du bei einem Wechsel eine dritte Anpassung bis zum Beginn deines nächsten Zuges wählen. Keine Anpassung doppelt.']],
 subs:[
 HX_S('wild','Pfad der Wildgestalt','Wildform','Dein Körper erinnert sich an das Tier. Mit Wandelklinge reisst du Beute zu Boden, deine Sehnen tragen dich in weiten Sätzen, und du witterst, was du nicht siehst.',[
 [3,'Jagdinstinkt','Vorteil bei Überlebenskunst-Proben zur Fährtensuche. Wenn Klinge aktiv ist, darfst du statt Zusatzschaden nach einem Treffer das Ziel (höchstens gross) zu einem STÄ-Rettungswurf gegen Wandel-SG zwingen. Misslingt er, fällt es zu Boden. Einmal in deinem Zug.'],
 [6,'Bestiensprung','Wenn Sehne aktiv ist, verdoppelst du deine normale Sprungdistanz bis zum Zugende (innerhalb der verfügbaren Bewegung).'],
 [10,'Witterung','Blindsicht 3 m, solange du nicht taub und nicht bewusstlos bist.'],
 [14,'Raubtierflanke','Einmal in deinem Zug, wenn du einen liegenden Gegner mit einem Nahkampfangriff triffst und Klinge aktiv ist, verursachst du zusätzlich 1W6 Schaden.'],
 [18,'Ungezähmt','Wenn Klinge aktiv ist, darfst du Jagdinstinkt zusätzlich zum Wandelwürfel anwenden, statt auf den Zusatzschaden zu verzichten.']]),
 HX_S('horror','Pfad der Schreckenform','Dreadform','Aus dir wachsen Glieder, die kein Wesen haben sollte. Greifer ziehen Feinde heran, Knochenstacheln strafen jeden Treffer, und dein Anblick lässt Gegner erstarren.',[
 [3,'Fremde Glieder','Wenn Greifer aktiv ist, kannst du beim ersten Nahkampftreffer in deinem Zug das Ziel (höchstens gross) 1,5 m zu dir ziehen, wenn sein STÄ-Rettungswurf gegen Wandel-SG misslingt.'],
 [6,'Knochenspitzen','Wenn Panzer aktiv ist und du dessen Reaktion nutzt, darfst du einem Angreifer innerhalb 1,5 m Stichschaden in Höhe deines KON-Mod (mindestens 1) zufügen.'],
 [10,'Weitgreifer','Die durch Greifer gewährte Reichweite im eigenen Zug beträgt 3 m statt 1,5 m. Kein Einfluss auf Gelegenheitsangriffe oder Reichweite des Packens.'],
 [14,'Schreckgestalt','Bonusaktion, 1× pro langer Rast: Kreaturen deiner Wahl in 3 m, die dich sehen, machen WEI-Rettungswürfe. Bei Misserfolg sind sie bis zum Ende deines nächsten Zuges verängstigt.'],
 [18,'Abwehrstacheln','Wenn Panzer aktiv ist, addiere deinen KON-Mod (mindestens 1) zur Schadensreduktion.']],l=>l>=14?[HX_R('hxf_dread','Schreckgestalt')]:[]),
 HX_S('mimic','Pfad der Mimik','Mimicry','Du trägst fremde Gesichter wie Masken. Du schlüpfst durch Reihen grosser Feinde, entgleitest jedem Griff und verschwindest, bevor jemand merkt, wer du wirklich bist.',[
 [3,'Fremdes Gesicht','Aktion: Ändere Gesicht, Stimme, Haut und Haare für beliebige Dauer. Grösse, Kreaturentyp und Grundanatomie bleiben gleich; Kleidung ändert sich nicht. Du kannst ein gesehenes humanoides Individuum nachahmen; Entdeckung durch Motiv erkennen gegen Täuschung. Vorteil auf solche Täuschungswürfe.'],
 [6,'Fliessender Schritt','Wenn Sehne aktiv ist, kannst du bis zum Ende des Zuges durch den Raum einer feindlichen Kreatur gehen, sofern sie mindestens eine Grössenkategorie grösser ist. Du darfst dort nicht enden. Schwieriges Gelände bleibt.'],
 [10,'Nachgiebige Form','Wenn Panzer aktiv ist, kannst du statt der Schadensreduktion als Reaktion Vorteil auf einen Rettungswurf gegen Gepackt oder Festgesetzt erhalten, bevor du würfelst.'],
 [14,'Trugwechsel','Wenn du als Bonusaktion Wandelgestalt aktivierst, kannst du dich zugleich optisch verwandeln. Einmal pro kurzer Rast darfst du bis zum Zugende die Aktion Rückzug ohne weitere Aktion nutzen.'],
 [18,'Unlesbare Gestalt','Du bist gegen magische Effekte geschützt, die allein dein Aussehen oder deine Gedanken offenbaren würden: Vorteil auf entsprechende Rettungswürfe. Wenn kein Rettungswurf vorgesehen ist, darfst du einen CHA-Rettungswurf gegen den Effekt-SG ablegen; bei Erfolg wird nur deine Information nicht offenbart.']],l=>l>=14?[HX_R('hxf_trug','Trugwechsel',1,'short')]:[])]},
 hxmind:{name:'Geistwirker',en:'Mindshaper',hd:8,prim:['int'],saves:['int','wis'],skillN:2,skills:['arc','his','inv','ins','prc','dec'],armor:['light'],weapons:'simple',home:true,asi:[4,8,12,16],hxDC:'int',
 flavor:'✦ Geistwirker verdichten Gedanken zu greifbaren Impulsen. Ihre Kunst stammt aus Schulen stiller Konzentration, nicht aus Zauberbüchern, Pakten oder fremden Wesen. Ihre stärkste Waffe ist ein disziplinierter Geist.',
 table:l=>[['Geistimpulse pro Magieaktion',HX_PULSE(l)],['Schaden pro Impuls','1W8 + INT-Mod'],['Reichweite',l>=9?'27 m':'18 m']],
 feats:[
 [1,'Geistimpuls','Magieaktion: Führe einen Fernkampf-Zauberangriff mit INT gegen eine Kreatur in 18 m aus. Treffer: 1W8 + INT-Mod psychischer Schaden. Ab Stufe 5 zwei, ab 11 drei, ab 17 vier getrennte Impulse, Ziele frei wählbar. Kein Zauber, keine Zauberplätze; magischer Effekt. Einmal pro eigener Magieaktion darfst du bei einem Treffer stattdessen den Zusatznutzen Gedankenstoss wählen: Ziel höchstens gross, STÄ-Rettungswurf gegen Geist-SG; bei Misserfolg 1,5 m wegstossen (normaler Schaden bleibt). Geist-SG = 8 + ÜB + INT-Mod.'],
 [1,'Stille Sprache','Du kannst mit einer sichtbaren Kreatur in 9 m telepathisch sprechen, sofern ihr eine Sprache gemeinsam habt. Sie kann dir in dieser Reichweite telepathisch antworten.'],
 [2,'Geisteshand','Aktion: Bewege ein unbeaufsichtigtes Objekt bis 5 kg in 9 m um bis zu 3 m. Kein Angriff, keine Aktivierung magischer Gegenstände, keine Manipulation getragener Gegenstände.'],
 [3,'Geistschule','Wähle eine Unterklasse.'],[5,'Zweiter Impuls','Geistimpuls erzeugt zwei getrennte Angriffe.'],
 [7,'Klarer Geist','Resistenz gegen psychischen Schaden. Bei einem Geistimpuls kannst du Energieschaden statt psychischem Schaden wählen.'],
 [9,'Weite Gedanken','Geistimpuls reicht 27 m; Stille Sprache reicht 18 m.'],
 [11,'Dritter Impuls','Geistimpuls erzeugt drei getrennte Angriffe.'],
 [13,'Geistesschirm','Reaktion, 1× pro kurzer Rast: Wenn du einen INT-, WEI- oder CHA-Rettungswurf nicht bestehst, addiere 1W6. Verwende das neue Ergebnis.'],
 [15,'Gedankenfestung','Du hast Vorteil bei Rettungswürfen gegen Bezaubert und Verängstigt.'],
 [17,'Vierter Impuls','Geistimpuls erzeugt vier getrennte Angriffe.'],
 [20,'Meistergedanke','Einmal in deinem Zug, wenn du eine Geistimpuls-Magieaktion ausführst, darfst du einen verfehlten Impuls gegen dasselbe Ziel neu würfeln. Du musst das neue Ergebnis verwenden.']],
 res:l=>l>=13?[HX_R('hxm_screen','Geistesschirm',1,'short')]:[],
 subs:[
 HX_S('kinetic','Schule der Fernkraft','Kinetic School','Deine Gedanken greifen in die Welt. Du stösst und ziehst Feinde, versetzt dich mit einem Lufttritt und fängst Geschosse ab, bevor sie deine Freunde treffen.',[
 [3,'Zugkraft','Gedankenstoss darf ein Ziel stattdessen 1,5 m zu dir ziehen; der Rettungswurf bleibt gleich. Geisteshand trägt bis 15 kg.'],
 [6,'Lufttritt','Bonusaktion, 1× pro kurzer Rast: Bewege dich bis 4,5 m zu einem unbesetzten sichtbaren Platz am Boden. Diese Bewegung provoziert keine Gelegenheitsangriffe.'],
 [10,'Präzise Kraft','Dein Gedankenstoss und Zugkraft bewegen bei misslungenem Rettungswurf 3 m statt 1,5 m.'],
 [14,'Schutzimpuls','Reaktion, 1× pro kurzer Rast: Wenn eine Kreatur in 9 m durch einen Fernkampfwaffenangriff getroffen wird, reduziere Schaden um 2W8 + INT-Mod (mindestens 0).'],
 [18,'Kraftfeld','Aktion, 1× pro langer Rast: Für 1 Minute (Konzentration) gilt der Bereich in 3 m um dich für feindliche Kreaturen als schwieriges Gelände. Betritt ein Feind ihn erstmals in seinem Zug, kann er bis Zugende keine Reaktionen nutzen.']],l=>(l>=6?[HX_R('hxm_step','Lufttritt',1,'short')]:[]).concat(l>=14?[HX_R('hxm_guard','Schutzimpuls',1,'short')]:[],l>=18?[HX_R('hxm_field','Kraftfeld')]:[])),
 HX_S('dominion','Schule der Einflüsterung','Influence School','Du flüsterst in fremde Köpfe. Getroffene Feinde verpassen ihre Gelegenheit, verlieren den Faden und greifen daneben – ohne dass du sie je ganz beherrschst.',[
 [3,'Ablenkung','Anstelle von Gedankenstoss wählst du bei einem Treffer einmal pro eigener Magieaktion: WEI-Rettungswurf, bei Misserfolg kann das Ziel bis zum Beginn deines nächsten Zuges keine Gelegenheitsangriffe machen.'],
 [6,'Gedankenlesen','Aktion, 1× pro langer Rast: Bis zu 1 Minute (Konzentration) erkennst du die oberflächlichen Gedanken einer sichtbaren Kreatur in 9 m, wenn sie den WEI-Rettungswurf nicht besteht. Das Ziel weiss danach, dass du eingedrungen bist.'],
 [10,'Gezielte Irritation','Wenn das Ziel den Rettungswurf gegen Ablenkung nicht besteht, hat das Ziel ausserdem Nachteil auf seine nächste WEI-Probe bis zum Beginn deines nächsten Zuges.'],
 [14,'Unterbrechung','Reaktion, 1× pro kurzer Rast: Wenn eine sichtbare Kreatur in 18 m einen Angriff macht, erzwinge vor dem Wurf einen WEI-Rettungswurf. Bei Misserfolg hat dieser Angriff Nachteil.'],
 [18,'Geteiltes Flüstern','Du darfst Ablenkung in derselben Geistimpuls-Aktion gegen zwei verschiedene getroffene Ziele nutzen, je ein WEI-Rettungswurf.']],l=>(l>=6?[HX_R('hxm_read','Gedankenlesen')]:[]).concat(l>=14?[HX_R('hxm_interrupt','Unterbrechung',1,'short')]:[])),
 HX_S('fracture','Schule der Gedankenbrecher','Fracture School','Du bündelst deinen Geist zu einer Klinge. Deine Impulse brechen durch halbe Deckung, treffen ein Ziel immer härter und erschüttern selbst die Konzentration von Zauberwirkern.',[
 [3,'Geistesbruch','Einmal in deinem Zug addierst du bei einem Geistimpuls-Treffer 1W4 psychischen Schaden, statt Gedankenstoss in dieser Aktion zu nutzen.'],
 [6,'Klarer Blick','Du ignorierst halbe Deckung bei Geistimpulsen, nicht Dreiviertel- oder vollständige Deckung.'],
 [10,'Vertiefter Bruch','Der Zusatzschaden von Geistesbruch steigt auf 1W6.'],
 [14,'Fokussierter Schlag','Wenn du mindestens zwei Impulse auf dasselbe Ziel richtest, kannst du einmal pro kurzer Rast vor einem dieser Angriffswürfe Vorteil wählen.'],
 [18,'Erschütterung','Geistesbruch verursacht 1W8 statt 1W6. Das getroffene Ziel hat bis zum Beginn deines nächsten Zuges Nachteil auf den ersten Konzentrationsrettungswurf, der durch diesen Treffer ausgelöst wird.']],l=>l>=14?[HX_R('hxm_focus','Fokussierter Schlag',1,'short')]:[])]},
 hxguard:{name:'Bollwerk',en:'Bulwark',hd:12,prim:['str','con'],saves:['str','con'],skillN:2,skills:['ath','itm','ins','prc','med','sur'],armor:['light','medium','heavy','shield'],weapons:'martial',home:true,mastery:()=>2,asi:[4,8,12,16],hxExtra:5,hxDC:'con',
 flavor:'✦ Bollwerke erlernen eine alte Lehre der Verantwortung: Ein Kampf ist erst gewonnen, wenn die Gefährten ihn überleben. Ihre Autorität lenkt gegnerische Angriffe um, ihre Haltung hält Schlachtlinien zusammen.',
 table:l=>[['Gebundene Gegner',l>=11?2:1],['Herausforderungsreichweite',l>=9?'9 m':'6 m'],['Abfangwürfel','1W'+HX_DIE(l)]],
 feats:[
 [1,'Herausforderung','Bonusaktion: Eine Kreatur in 6 m, die dich sehen oder hören kann, macht einen WEI-Rettungswurf gegen Wach-SG (8 + ÜB + KON-Mod). Misserfolg: bis zum Beginn deines nächsten Zuges ist sie von dir herausgefordert. Wenn sie dich sieht und du nicht kampfunfähig bist, muss ihr erster Angriff gegen ein einzelnes Ziel in jedem ihrer eigenen Züge gegen dich gerichtet sein, sofern du ein gültiges Ziel in Reichweite bist. Weitere Angriffe gegen andere Kreaturen haben Nachteil. Sie wird nicht zu einer bestimmten Bewegung oder Angriffsaktion gezwungen und kann Flächenwirkungen, Rettungswurf-Fähigkeiten oder andere Handlungen nutzen. Ist kein Angriff gegen dich möglich, darf sie normal ein anderes Ziel angreifen (mit Nachteil, solange sie dich sieht und du nicht kampfunfähig bist). Nur eine Kreatur gleichzeitig pro Bollwerk; neue Herausforderung beendet die alte. Dieselbe Kreatur kann nur von einem Bollwerk herausgefordert sein (neuere erfolgreiche Herausforderung ersetzt alte). Kein Bezaubert- oder Verängstigt-Zustand. Keine Nutzungsgrenze.'],
 [1,'Waffenmeisterschaft','Zwei Waffenmeisterschaften.'],
 [2,'Abfangen','Reaktion, wenn ein Angriff eine andere Kreatur in 1,5 m von dir trifft und du den Angreifer siehst: Reduziere den Schaden am Verbündeten um 1 Abfangwürfel (W4, W6 ab 5, W8 ab 11, W10 ab 17) + KON-Mod (mindestens 1). Du erleidest anschliessend die gleiche Menge des tatsächlich verhinderten Schadens als unveränderlichen Schaden, maximal bis zu den ursprünglichen Schadenspunkten. Kein erneutes Abfangen oder Umleiten dieses Schadens.'],
 [3,'Wachtbund','Wähle eine Unterklasse.'],[5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
 [7,'Standwacht','Vorteil auf Rettungswürfe gegen Festgesetzt und Umwerfen.'],
 [9,'Weckruf','Herausforderung hat Reichweite 9 m.'],
 [11,'Doppelwacht','Du darfst mit derselben Bonusaktion zwei verschiedene Kreaturen herausfordern; jede würfelt separat. Beide Bindungen enden zum Beginn deines nächsten Zuges.'],
 [13,'Wachablösung','Reaktion, wenn ein Verbündeter in 3 m von dir getroffen wird und du den Angreifer siehst: Abfangen darf nun auch auf 3 m eingesetzt werden.'],
 [15,'Letzter Halt','Wenn du durch Abfangen auf 0 TP fallen würdest, ohne sofort zu sterben, bleibst du stattdessen auf 1 TP. 1× pro langer Rast.'],
 [17,'Unerschütterliche Wacht','Abfangwürfel W10. '],
 [20,'Unbeugsame Wacht','Einmal pro eigener Herausforderungs-Bonusaktion darfst du bei einer Kreatur, die ihren Rettungswurf besteht, einen neuen Rettungswurf verlangen. Sie verwendet das zweite Ergebnis. Abfangen reduziert beim Verbündeten zusätzlich 1W6 Schaden; der tatsächlich verhinderte Schaden trifft weiterhin dich.']],
 res:l=>l>=15?[HX_R('hxg_hold','Letzter Halt')]:[],
 subs:[
 HX_S('bastion','Bund der Bastion','Bastion','Du bist die Mauer, an der Angriffe zerschellen. Du verschanzt dich hinter frischer Härte, deine Rüstung sitzt fester als bei jedem anderen, und selbst schwere Treffer verpuffen an dir.',[
 [3,'Feste Stellung','Einmal pro kurzem oder langem Rastzyklus kannst du als Bonusaktion temporäre TP in Höhe deiner Bollwerk-Stufe + KON-Mod (mindestens 1) erhalten.'],
 [6,'Gehärteter Stand','Trägst du einen Schild oder Rüstung, erhältst du +1 RK (in der App eingerechnet).'],
 [10,'Innere Festung','Vorteil auf Rettungswürfe gegen Verängstigt.'],
 [14,'Zähigkeit','Reaktion, 1× pro kurzer Rast: Bei einem Treffer gegen dich reduziere dessen Schaden um 2W8 + KON-Mod (mindestens 0). Gilt nicht für Abfangschaden.'],
 [18,'Letzte Bastion','Feste Stellung kann zweimal pro kurzer Rast verwendet werden; temporäre TP stapeln nicht.']],l=>[HX_R('hxg_bastion','Feste Stellung',l>=18?2:1,'short')].concat(l>=14?[HX_R('hxg_hard','Zähigkeit',1,'short')]:[])),
 HX_S('defier','Bund des Herausforderers','Defier','Du rufst die Feinde zu dir und lässt sie nicht mehr gehen. Wer deine Herausforderung annimmt, spürt deine Klinge härter, und wer sich trotzdem abwendet, bekommt deinen Gegenschlag.',[
 [3,'Drängende Wacht','Einmal in deinem Zug, wenn du eine von dir herausgeforderte Kreatur mit einer Nahkampfwaffe triffst, verursachst du zusätzlich 1W4 Schaden.'],
 [6,'Beharrliche Herausforderung','Bei einer Herausforderung eines Ziels in 1,5 m von dir ist der SG um 1 erhöht.'],
 [10,'Zorniger Gegenschlag','Reaktion, wenn eine von dir herausgeforderte Kreatur in deiner Nahkampfreichweite einen Verbündeten angreift: Führe nach dem Angriff einen Nahkampfwaffenangriff gegen sie aus. Kein automatischer Treffer.'],
 [14,'Herausforderungsruf','Bonusaktion, 1× pro kurzer Rast: Fordere bis zu drei Kreaturen in 9 m gleichzeitig heraus, unabhängig von Doppelwacht. Dauer unverändert.'],
 [18,'Beharrlichkeit','Drängende Wacht verursacht 1W8 statt 1W4 Zusatzschaden.']],l=>l>=14?[HX_R('hxg_roar','Herausforderungsruf',1,'short')]:[]),
 HX_S('protector','Bund der Lebenswacht','Lifeward','Du wirfst dich zwischen deine Freunde und den Tod. Du springst an ihre Seite, trägst nur die Hälfte der abgefangenen Wunden und hältst Gefallene im letzten Moment am Leben.',[
 [3,'Deckender Schritt','Wenn Abfangen ausgelöst wird, darfst du dich zuvor bis 1,5 m zu einem freien Ort bewegen, sofern du danach innerhalb der nötigen Reichweite des Verbündeten bist. Diese Bewegung provoziert keine Gelegenheitsangriffe.'],
 [6,'Geteilte Last','Bei Abfangen erleidest du nur die Hälfte (abgerundet) des verhinderten Schadens. Dieser Restschaden bleibt unveränderlich.'],
 [10,'Wachsamer Blick','Vorteil auf Initiative.'],
 [14,'Rettender Zug','Reaktion, 1× pro langer Rast: Wenn ein Verbündeter in 3 m durch einen Angriff auf 0 TP fallen würde, ohne sofort zu sterben, bleibt er auf 1 TP. Du erleidest 2W10 unveränderlichen Schaden. Keine Umleitung dieses Schadens.'],
 [18,'Weite Wacht','Abfangen reicht 4,5 m. Deckender Schritt kann bis 3 m bewegen, falls du in Reichweite endest.']],l=>l>=14?[HX_R('hxg_save','Rettender Zug')]:[])]},
 hxthread:{name:'Fadenlenker',en:'Threadbinder',hd:8,prim:['int'],saves:['dex','int'],skillN:2,skills:['acr','arc','inv','slt','prc','dec'],armor:['light'],weapons:'simple',home:true,asi:[4,8,12,16],hxDC:'int',
 flavor:'✦ Fadenlenker sehen die Welt als Gewebe aus unsichtbaren Bindungen. Ein Faden kann eine Puppe führen, einen Schwarm lenken oder wie eine Klinge schneiden. Ihre Kunst benötigt weder eine bestimmte Waffe noch einen zusätzlichen Kämpfer.',
 table:l=>[['Fadenschläge pro Magieaktion',HX_PULSE(l)],['Fadenschaden','1W8 + INT-Mod'],['Fadenträger-Reichweite',l>=9?'18 m':'12 m']],
 feats:[
 [1,'Fadenkunst','Bonusaktion: Erzeuge einen Fadenträger an einem sichtbaren unbesetzten Punkt in 12 m oder verschiebe deinen vorhandenen Träger um bis zu 6 m zu einem solchen Punkt. Er ist ein magisches Zeichen, keine Kreatur, kein Gegenstand, kein Hindernis; er hat keine TP, Züge, Reaktionen oder eigene Aktionen. Du kannst ihn jederzeit ohne Aktion auflösen. Er verschwindet bei Kampfunfähigkeit oder wenn er ausserhalb der Reichweite ist.'],
 [1,'Fadenschlag','Magieaktion: Wähle dich oder deinen sichtbaren Fadenträger als Ursprung. Fernkampf-Zauberangriff mit INT gegen eine Kreatur in 9 m vom Ursprung, die du sehen kannst; vollständige Deckung gegen den Ursprung verhindert den Angriff. Treffer: 1W8 + INT-Mod Hiebschaden durch Magie. Ab Stufe 5 zwei, ab 11 drei, ab 17 vier getrennte Angriffe; wähle Ursprung je Angriff. Kein Zauber, keine Zauberplätze. Faden-SG = 8 + ÜB + INT-Mod.'],
 [2,'Fadengriff','Aktion: Bewege über deinen Fadenträger ein unbeaufsichtigtes Objekt von höchstens 5 kg um 3 m. Keine Angriffe, keine magischen Gegenstände aktivieren.'],
 [3,'Fadenschule','Wähle die Erscheinung deines Fadenträgers: Marionette, Schwarm oder freie Fäden.'],[5,'Zweiter Fadenschlag','Zwei getrennte Fadenschläge pro Magieaktion.'],
 [7,'Fadennetz','Einmal pro eigener Fadenschlag-Aktion darfst du bei einem Treffer das Ziel (höchstens gross) 1,5 m zum Ursprung ziehen, wenn ein STÄ-Rettungswurf gegen Faden-SG misslingt.'],
 [9,'Lange Fäden','Dein Fadenträger darf 18 m entfernt sein; seine Verschiebung bleibt 6 m.'],
 [11,'Dritter Fadenschlag','Drei getrennte Fadenschläge pro Magieaktion.'],
 [13,'Reissfester Faden','Wenn du einen Effekt erleidest, der dich festsetzt, erhältst du einmal pro kurzer Rast Vorteil auf einen Rettungswurf dagegen (vor dem Wurf).'],
 [15,'Kunst der freien Hand','Du kannst den Träger einmal in jedem deiner Züge ohne Aktion bis zu 3 m bewegen; zusätzlich bleibt die Bonusaktion verfügbar.'],
 [17,'Vierter Fadenschlag','Vier getrennte Fadenschläge pro Magieaktion.'],
 [20,'Meister der Fäden','Wenn du Initiative würfelst, darfst du ohne Aktion einen Fadenträger erzeugen. Bei einer Fadenschlag-Magieaktion darfst du für alle Impulse Energieschaden statt Hiebschaden wählen. Beim Verschieben des Trägers als Bonusaktion kannst du bis zu 9 m statt 6 m bewegen.']],
 res:l=>l>=13?[HX_R('hxt_resist','Reissfester Faden',1,'short')]:[],
 subs:[
 HX_S('marionette','Marionette Artnkunst','Marionette','Dein Fadenträger ist eine Puppe nach deinem Entwurf. Sie schlägt mit, wenn du über sie angreifst, und wirft sich vor Verbündete – ohne je eine eigene Kreatur zu sein.',[
 [3,'Marionettenhieb','Dein Fadenträger sieht wie eine von dir entworfene Puppe aus. Einmal pro eigener Fadenschlag-Aktion verursacht ein Treffer vom Träger zusätzlich 1W4 Hiebschaden, wenn das Ziel höchstens 1,5 m vom Träger entfernt ist.'],
 [6,'Wechselnde Gestalt','Beim Erzeugen des Trägers kannst du ihn nach Belieben als Holz-, Stoff- oder Knochenpuppe erscheinen lassen. Seine mechanischen Werte ändern sich nicht. Vorteil auf Proben zum Darbieten von Puppenspielen (Darbietung).'],
 [10,'Blockierpuppe','Reaktion, 1× pro kurzer Rast: Trifft ein Angriff eine andere Kreatur in 1,5 m um deinen Träger, reduziere Schaden um 2W6 + INT-Mod (mindestens 0). Der Träger verschwindet; du kannst ihn wie üblich neu erzeugen.'],
 [14,'Fadenschnitt','Marionettenhieb verursacht 1W6 statt 1W4.'],
 [18,'Meistermarionette','Blockierpuppe kann zweimal pro kurzer Rast eingesetzt werden. Marionettenhieb verursacht 1W8 statt 1W6.']],l=>l>=10?[HX_R('hxt_block','Blockierpuppe',l>=18?2:1,'short')]:[]),
 HX_S('swarm','Schwarmkunst','Swarm Art','Dein Fadenträger summt als Schwarm aus Insekten, Sporen oder Fäden. Er sticht einen zweiten Feind neben dem Ziel, verdichtet sich zu zähem Gelände und sieht für dich um Ecken.',[
 [3,'Schwarmstich','Dein Träger erscheint als Insekten-, Sporen- oder Fadenschwarm. Einmal pro eigener Fadenschlag-Aktion darfst du bei einem Treffer vom Träger einer anderen feindlichen Kreatur in 1,5 m um das Ziel 1W4 Stichschaden zufügen. Nicht kritisch, kein weiterer Auslöser.'],
 [6,'Schwarmblick','Aktion: Bis zum Beginn deines nächsten Zuges erkennst du auch, was dein Träger innerhalb 3 m sehen könnte. Keine Sicht durch Wände. Du kannst damit nicht deine Voraussetzung aufheben, Angriffsziele selbst sehen zu müssen.'],
 [10,'Schwarmwolke','Bonusaktion, 1× pro kurzer Rast: Bis zum Beginn deines nächsten Zuges ist ein Bereich in 1,5 m um den Träger für Gegner schwieriges Gelände.'],
 [14,'Schwarmstich II','Schwarmstich verursacht 1W6 statt 1W4.'],
 [18,'Breiter Schwarm','Schwarmstich erreicht 3 m um das Ziel und verursacht 1W8; weiterhin nur ein zusätzliches Ziel pro eigener Aktion.']],l=>l>=10?[HX_R('hxt_swarm','Schwarmwolke',1,'short')]:[]),
 HX_S('threads','Kunst der freien Fäden','Free Threads','Du arbeitest mit blossen, glänzenden Fäden. Sie bremsen Feinde, ziehen Verbündete aus der Gefahr, fesseln Gegner an Ort und Stelle und reissen Angriffe ins Leere.',[
 [3,'Fadenzug','Beim Einsatz von Fadenkunst darfst du eine sichtbare Kreatur in 1,5 m um deinen Träger wählen. Sie macht einen STÄ-Rettungswurf gegen Faden-SG; bei Misserfolg sinkt ihre Bewegungsrate bis zum Beginn deines nächsten Zuges um 3 m (mindestens 0). Keine Stapelung.'],
 [6,'Sicherer Faden','Beim Fadengriff darfst du statt eines unbeaufsichtigten Objekts einen bereitwilligen Verbündeten in 1,5 m vom Träger um 1,5 m verschieben. Kein Durchqueren von Wänden oder Hindernissen.'],
 [10,'Fadenschlinge','Aktion, 1× pro kurzer Rast: Eine sichtbare Kreatur höchstens gross in 3 m um den Träger macht einen STÄ-Rettungswurf. Bei Misserfolg ist sie bis zum Ende ihres nächsten Zuges festgesetzt. Der Träger muss in Reichweite bleiben.'],
 [14,'Starker Faden','Fadennetz darf ein Ziel um bis zu 3 m ziehen.'],
 [18,'Fadenbruch','Reaktion, 1× pro langer Rast: Wenn ein sichtbarer Gegner in 3 m vom Träger einen Angriff ausführt, darfst du vor dem Wurf Nachteil auf diesen Angriff geben.']],l=>(l>=10?[HX_R('hxt_snare','Fadenschlinge',1,'short')]:[]).concat(l>=18?[HX_R('hxt_break','Fadenbruch')]:[]))]},
 hxexec:{name:'Vollstrecker',en:'Executioner',hd:10,prim:['str','dex'],saves:['str','dex'],skillN:2,skills:['ath','acr','itm','prc','ins','ste'],armor:['light','medium'],weapons:'martial',home:true,mastery:step(2,[[11,3]]),fightingStyle:2,asi:[4,8,12,16],hxExtra:5,
 flavor:'✦ Vollstrecker sind keine Diener des Todes, sondern Meister des entscheidenden Augenblicks. Sie lesen Haltung und Erschöpfung ihrer Gegner, warten auf die offene Deckung und beenden einen Kampf, bevor er sich erneut wenden kann.',
 table:l=>[['Urteilswürfel','W'+HX_DIE(l)],['Angriffe',l>=5?2:1],['Urteil',l>=11?'1 Würfel; angeschlagen +2 Würfel':'1 Würfel; angeschlagen +1 Würfel']],
 feats:[
 [1,'Urteil','Einmal in deinem eigenen Zug, wenn du eine feindliche, nicht bewusstlose Kreatur mit einem Waffenangriff triffst: zusätzlich 1 Urteilswürfel des Waffenschadentyps. Hat sie unmittelbar vor diesem Treffer höchstens die Hälfte ihrer maximalen TP (angeschlagen), würfle einen weiteren Urteilswürfel; ab Stufe 11 zwei weitere statt einem. Temporäre TP zählen nicht. Bei kritischem Treffer werden auch diese Würfel verdoppelt. Keine Marke, keine Ressource; kein Zusatz bei bewusstlosen Zielen.'],
 [1,'Waffenmeisterschaft','Zwei Waffenmeisterschaften; ab Stufe 11 drei.'],[2,'Kampfstil','Du erhältst ein Kampfstil-Talent.'],
 [3,'Vollstreckerpfad','Wähle eine Unterklasse.'],[5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
 [7,'Kampfblick','Ohne Aktion erkennst du bei sichtbaren Kreaturen in 18 m, ob sie angeschlagen sind. Die SL nennt keine exakten TP.'],
 [9,'Entschlossenheit','Vorteil auf Rettungswürfe gegen Verängstigt.'],
 [11,'Vertieftes Urteil','Angeschlagene Ziele erleiden durch Urteil insgesamt drei statt zwei Urteilswürfel.'],
 [13,'Sauberer Abschluss','Wenn du eine feindliche Kreatur mit einem Waffenangriff auf 0 TP bringst, kannst du dich unmittelbar bis 1,5 m bewegen, ohne Gelegenheitsangriffe von dieser Kreatur auszulösen. Einmal in deinem Zug.'],
 [15,'Letzter Widerstand','Deine Urteilswürfel gegen angeschlagene Ziele behandeln eine gewürfelte 1 als 2. Keine weiteren Neuwürfe aus diesem Merkmal.'],
 [17,'Meisterhaftes Urteil','Urteilswürfel W10.'],
 [20,'Endurteil','Wenn ein angeschlagenes Ziel unmittelbar vor deinem Urteil höchstens ein Viertel seiner maximalen TP hat, verursachst du insgesamt vier statt drei Urteilswürfel. Kein automatisches Töten.']],
 subs:[
 HX_S('headsman','Pfad des Scharfrichters','Headsman','Du wählst ein Ziel und beendest es. Gegen Angeschlagene triffst du präziser, gewinnst aus jedem Urteil neue Kraft und triffst sie schon bei einer 19 kritisch.',[
 [3,'Präziser Schnitt','Bei einem eigenen Waffenangriff gegen ein angeschlagenes Ziel kannst du einmal pro kurzer Rast vor dem Wurf Vorteil wählen.'],
 [6,'Unnachgiebig','Bei einem Treffer mit Urteil erhältst du temporäre TP in Höhe deines ÜB, falls das Ziel vor dem Treffer angeschlagen war. 1× pro Runde; sie stapeln nicht.'],
 [10,'Scharfe Kante','Einmal pro eigener Angriffsaktion darfst du bei einem verfehlten Waffenangriff gegen ein angeschlagenes Ziel den Würfel um 1 erhöhen, nachdem du das Ergebnis kennst. Keine Änderung der natürlichen Zahl oder Kritschwelle.'],
 [14,'Kritischer Abschluss','Waffenangriffe gegen angeschlagene Ziele sind bei einer natürlichen 19 oder 20 kritisch. Nicht kumulativ mit anderen Kritschwellen (nutze die bessere).'],
 [18,'Präzision der Meister','Präziser Schnitt ist zweimal pro kurzer Rast verfügbar.']],l=>[HX_R('hxe_precise','Präziser Schnitt',l>=18?2:1,'short')]),
 HX_S('reaper','Pfad des Schnitters','Reaper','Du mähst durch die Reihen. Fällt ein Feind, setzt du sofort zum nächsten nach, und dein Urteil schwingt weiter auf Gegner, die zu nahe stehen.',[
 [3,'Nachsetzen','Wenn du in deinem Zug eine feindliche Kreatur mit einem Waffenangriff auf 0 TP bringst, darfst du als Bonusaktion einen weiteren Waffenangriff gegen eine andere Kreatur in Waffenreichweite ausführen. Einmal pro Zug; löst kein weiteres Nachsetzen aus. Urteil weiterhin nur einmal.'],
 [6,'Offener Weg','Wenn du Nachsetzen nutzt, darfst du dich davor bis 3 m bewegen. Normale Gelegenheitsangriffe bleiben.'],
 [10,'Schwung','Einmal pro kurzer Rast darfst du, wenn Urteil ein angeschlagenes Ziel trifft, einer zweiten feindlichen Kreatur innerhalb 1,5 m vom Ziel 1 Urteilswürfel Waffenschaden zufügen. Dieser Schaden ist nicht kritisch und löst keine weiteren Effekte aus.'],
 [14,'Breiter Abschluss','Schwung erreicht 3 m und verursacht zwei Urteilswürfel.'],
 [18,'Unerbittlicher Schnitter','Schwung kann zweimal pro kurzer Rast eingesetzt werden.']],l=>l>=10?[HX_R('hxe_swing','Schwung',l>=18?2:1,'short')]:[]),
 HX_S('tormentor','Pfad des Bedrängers','Tormentor','Du triffst dort, wo es am meisten schmerzt. Statt mehr Schaden nimmst du Verwundeten die Reaktion, die Beine und die Heilung – bis sie nichts mehr entgegenzusetzen haben.',[
 [3,'Druckpunkt','Wenn du Urteil gegen ein angeschlagenes Ziel auslöst, darfst du auf einen der zusätzlichen Urteilswürfel verzichten: Das Ziel macht einen KON-Rettungswurf (SG 8 + ÜB + STÄ- oder GES-Mod des Angriffs). Misslingt er, kann es bis zum Beginn deines nächsten Zuges keine Reaktionen nutzen.'],
 [6,'Schwere Wunde','Wenn das Ziel den Rettungswurf gegen Druckpunkt nicht besteht, erhält es bis zum Beginn deines nächsten Zuges nur die Hälfte (abgerundet) jeder Heilung.'],
 [10,'Unbequemer Treffer','Du darfst bei Druckpunkt statt Reaktionsverlust die Bewegungsrate des Ziels bis zum Beginn deines nächsten Zuges um 3 m senken (mindestens 0).'],
 [14,'Bedrängnis','Druckpunkt kostet weiterhin einen Würfel; bei einem misslungenen Rettungswurf gelten sowohl Reaktionsverlust als auch Bewegungssenkung und reduzierte Heilung.'],
 [18,'Kampfdruck','Einmal pro kurzer Rast darfst du Druckpunkt ohne Verzicht auf einen Urteilswürfel einsetzen.']],l=>l>=18?[HX_R('hxe_pressure','Kampfdruck',1,'short')]:[])]},
 hxblight:{name:'Seuchenträger',en:'Blightbearer',hd:10,prim:['str','dex','con'],saves:['con','cha'],skillN:2,skills:['ath','med','nat','arc','sur','itm'],armor:['light','medium','shield'],weapons:'martial',home:true,mastery:()=>2,asi:[4,8,12,16],hxExtra:5,hxDC:'con',
 flavor:'✦ Seuchenträger tragen eine kontrollierte, übernatürliche Zersetzung in sich. Die Kunst entstand unter Heilern, die einen magischen Befall zu bändigen lernten. Sie sind keine wandelnde Gefahr für ihre Verbündeten; nur ihr bewusster Wille setzt die Verheerung frei.',
 table:l=>[['Seuchenwürfel','W'+HX_DIE(l)],['Befallene Ziele',step(2,[[5,3],[11,4],[17,5]])(l)],['Angriffe',l>=5?2:1]],
 feats:[
 [1,'Befall','Einmal in deinem eigenen Zug, wenn du eine feindliche Kreatur mit einer Waffe triffst, kannst du sie bis zum Beginn deines übernächsten Zuges befallen. Zu Beginn jedes ihrer Züge erleidet sie 1 Seuchenwürfel nekrotischen Schaden. Befall ist ein magischer Klasseneffekt, keine Krankheit, kein Gift und kein Zauber; Resistenz/Immunität gegen nekrotischen Schaden gilt. Kein Befall bei 0 TP. Mehrfacher Befall durch dich erneuert nur die Dauer. Maximal zwei deiner Befälle gleichzeitig (3 ab 5, 4 ab 11, 5 ab 17); wenn überschritten, beende einen alten. Befall mehrerer Seuchenträger verursacht nur den höchsten Würfel an einem Ziel, die jeweilige Dauer bleibt separat.'],
 [1,'Waffenmeisterschaft','Zwei Waffenmeisterschaften.'],
 [2,'Übertragung','Bonusaktion: Wähle einen von dir befallenen, lebenden Gegner, den du in 18 m siehst, und einen anderen sichtbaren feindlichen Gegner in 3 m von ihm. Der zweite erhält deinen Befall bis zum Beginn deines übernächsten Zuges, ohne sofortigen Schaden. Alternativ: Bei einem befallenen Ziel in 18 m verursachst du sofort 1 Seuchenwürfel nekrotischen Schaden, ohne die Dauer zu verlängern. Dieses Auslösen ist kein Treffer und löst keine Befälle aus.'],
 [3,'Seuchenpfad','Wähle eine Unterklasse.'],[5,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an.'],
 [7,'Selbstkontrolle','Vorteil bei Rettungswürfen gegen den Zustand Vergiftet. Eigener Befall kann dich nicht treffen.'],
 [9,'Zersetzung','Übertragung darf eine deiner Befallmarkierungen umsetzen oder neu verteilen; Reichweite zum neuen Ziel steigt auf 4,5 m. Befall endet bei 0 TP.'],
 [11,'Reife Seuche','Seuchenwürfel W8.'],
 [13,'Fester Wille','Vorteil auf Rettungswürfe gegen Verängstigt.'],
 [15,'Schneller Befall','Wenn du Initiative würfelst und keine Kreatur von dir befallen ist, darfst du bei deinem ersten erfolgreichen Waffentreffer in diesem Kampf zusätzlich zur normalen Anwendung Übertragung ohne Aktion einsetzen (einmal pro Kampf).'],
 [17,'Vollendete Zersetzung','Seuchenwürfel W10 und maximal fünf befallene Ziele.'],
 [20,'Herr der Ausbreitung','Dein Befall hält bis zum Beginn deines dritten folgenden Zuges statt des übernächsten. Übertragung darf bei ihrer Bonusaktion entweder zwei verschiedene neue Ziele befallen oder einen bereits befallenen Gegner um zwei statt einen Seuchenwürfel schädigen. Das Limit befallener Ziele bleibt fünf.']],
 subs:[
 HX_S('spread','Pfad des Seuchenmeisters','Plague Master','Deine Seuche springt von Feind zu Feind. Fällt ein Befallener, sucht sie sich das nächste Opfer, und einmal pro langer Rast lässt du eine Welle der Zersetzung über ganze Gruppen rollen.',[
 [3,'Weitergabe','Wenn ein von dir befallener Gegner in deinem Zug auf 0 TP fällt, darfst du einmal in diesem Zug ohne Aktion einen sichtbaren feindlichen Gegner in 3 m von ihm befallen. Kein sofortiger Schaden, kein rekursiver Auslöser.'],
 [6,'Gezielte Ausbreitung','Bei Übertragung kannst du statt Schaden ein Ziel in 6 m vom Quellziel befallen (weiterhin 18 m zu dir).'],
 [10,'Wandernde Seuche','Einmal pro kurzer Rast, wenn du Übertragung nutzt, darfst du ein zweites unterschiedliches Ziel in Reichweite befallen. Mit «Herr der Ausbreitung» (Stufe 20) bleibt es bei höchstens zwei neuen Zielen pro Übertragung.'],
 [14,'Ausbreitungswelle','Aktion, 1× pro langer Rast: Wähle bis zu drei sichtbare feindliche Kreaturen in 9 m um dich. Sie machen KON-Rettungswürfe gegen Seuchen-SG. Bei Misserfolg erleiden sie 2 Seuchenwürfel nekrotischen Schaden und werden befallen; bei Erfolg halber Schaden ohne Befall.'],
 [18,'Gezielte Welle','Ausbreitungswelle verursacht 3 Seuchenwürfel und reicht 12 m.']],l=>(l>=10?[HX_R('hxb_spread','Wandernde Seuche',1,'short')]:[]).concat(l>=14?[HX_R('hxb_wave','Ausbreitungswelle')]:[])),
 HX_S('decay','Pfad des Zersetzers','Corruptor','Du lässt die Seuche tief einwirken. Dein Befall hält länger, deine Übertragung frisst stärker, und wenn du willst, reisst du die ganze Zersetzung mit einem Schlag aus dem Ziel heraus.',[
 [3,'Vertiefung','Wenn du Übertragung für sofortigen Schaden an einem bereits befallenen Ziel nutzt, addiere deinen KON-Mod (mindestens 1) zum Schaden.'],
 [6,'Zäher Befall','Einmal pro kurzer Rast, wenn du einen Befall auf einem Ziel erneuerst, hält er bis zum Beginn deines dritten folgenden Zuges.'],
 [10,'Gezielte Zersetzung','Einmal in deinem Zug, wenn du ein bereits von dir befallenes Ziel mit einer Waffe triffst, darfst du den Befall beenden: Das Ziel erleidet sofort zwei Seuchenwürfel nekrotischen Schaden. Dieser Treffer kann das Ziel nicht erneut befallen.'],
 [14,'Feste Zersetzung','Zäher Befall ist zweimal pro kurzer Rast möglich.'],
 [18,'Letzte Zersetzung','Gezielte Zersetzung verursacht drei Seuchenwürfel statt zwei; weiterhin beendet sie den Befall und verhindert Neuinfektion durch diesen Treffer.']],l=>l>=6?[HX_R('hxb_sticky','Zäher Befall',l>=14?2:1,'short')]:[]),
 HX_S('defile','Pfad der Versehrung','Defiler','Deine Seuche schwächt, statt zu töten. Befallene werden langsam, verlieren ihre Gelegenheiten, greifen schlechter an und heilen nur noch halb.',[
 [3,'Schwache Glieder','Wenn du einen Gegner mit Befall triffst und diesen erneuerst, darfst du einmal in deinem Zug den nächsten periodischen Seuchenschaden an ihm aussetzen: Bis zum Beginn deines nächsten Zuges sinkt seine Bewegungsrate um 3 m (mindestens 0).'],
 [6,'Trüber Befall','Bei Schwache Glieder darfst du statt Bewegungssenkung bewirken, dass das Ziel bis zum Beginn deines nächsten Zuges keine Gelegenheitsangriffe machen kann.'],
 [10,'Verwelkung','Wenn du Übertragung für sofortigen Schaden nutzt, darfst du stattdessen einen KON-Rettungswurf gegen Seuchen-SG verlangen. Misslingt er, hat das Ziel Nachteil auf seinen nächsten Waffenangriff bis zum Beginn deines nächsten Zuges. Kein Schaden durch diese Bonusaktion.'],
 [14,'Versengte Erholung','Einmal pro kurzer Rast, wenn du ein befallenes Ziel triffst, heilt es bis zum Beginn deines nächsten Zuges nur halb so viele TP (abgerundet).'],
 [18,'Versehrende Seuche','Bei Schwache Glieder darfst du beide Effekte (Bewegungssenkung und keine Gelegenheitsangriffe) wählen; ein periodischer Schadenswurf entfällt weiterhin.']],l=>l>=14?[HX_R('hxb_heal','Versengte Erholung',1,'short')]:[])]}
};
// Register only new IDs, preserve existing characters and standard classes.
for (const [id,C] of Object.entries(HX_CLASSES)) {
 if(CLASSES[id]) throw Error('HX Klassen-ID belegt: '+id);
 C.sub={id:C.subs[0].id,name:C.subs[0].name,lv:HX_SUB_LEVELS}; C.subFeats=C.subs[0].feats;
 const r0=C.res; C.res=(l,c)=>{const r=r0?r0(l,c):[];const e=(c.classes||[]).find(x=>x.id===id);const sub=l>=3&&e&&C.subs.find(s=>s.id===e.m.sub);return sub&&sub.res?r.concat(sub.res(l,c)):r;};
 CLASSES[id]=C;
 MC_ARMOR[id]=C.armor.filter(x=>x!=='heavy');
 MC_PREREQ[id]=id==='hxmind'||id==='hxthread'?[['int']]:id==='hxguard'?[['str'],['con']]:id==='hxexec'?[['str','dex']]:[['str','dex'],['con']];
 if(C.weapons==='martial'&&!MC_MARTIAL.includes(id)) MC_MARTIAL.push(id);
}
const HX_GOLEM_VARIANTS={clay:'Lehmgeborene / Clayborn',ceramic:'Kintsari / Kintsari',forged:'Geschmiedete / Forged'};
const HX_SPECIES={
 hxferrali:{name:'Ferrali',en:'Ferrali',size:'Mittelgross',speed:9,dv:0,home:true,life:'ca. 130 Jahre',
 flavor:"✦ Ferrali sind ein vierarmiges humanoides Volk mit zwei Schulterpaaren, kräftigem Oberkörper und kupferfarbener bis dunkelgrauer Haut. Ihre Städte sind für fein gearbeitete Brücken, Bildhauerei und Handwerksgemeinschaften bekannt. Jede Generation entwickelt eigene Bauweisen; die vier Arme legen weder Beruf noch Klasse fest.",
 traits:c=>[["Zusätzliche Hände", "Du hast zwei Hauptarme und zwei zusätzliche Arme. Die zusätzlichen Hände können je einen kleinen Gegenstand bis 5 kg halten oder im Rahmen deiner normalen Objektinteraktion aufnehmen oder ablegen. Sie dürfen keine Waffen, Schilde, Zauberfoki oder Komponenten führen und keine zusätzlichen Angriffe, Haltegriffe, Aktionen, Bonusaktionen, Reaktionen oder Objektinteraktionen ermöglichen. Alle Anforderungen an freie Hände für Kampf und Zauber gelten nur für die beiden Hauptarme."], ["Vierarmiges Handwerk", "Du hast Vorteil auf Attributsproben mit Handwerkszeug, wenn du darin geübt bist und deine zusätzlichen Hände ein Werkstück oder Werkzeug tatsächlich stabilisieren können. Dies ermöglicht keine zusätzliche Aktion, keinen zusätzlichen Gegenstandsgebrauch und keine schnellere Herstellung."], ["Befreiungsgriff", "Wenn du die Aktion zum Entkommen aus dem Zustand Gepackt ausführst und mindestens eine zusätzliche Hand frei ist, hast du Vorteil auf die dafür erforderliche STÄ (Athletik)- oder GES (Akrobatik)-Probe."]]},
 hxsilk:{name:'Seidlinge',en:'Silkfolk',size:'Klein oder Mittelgross',speed:9,dv:18,home:true,life:'ca. 110 Jahre',
 flavor:'✦ Die Seidlinge sind ein mottenartiges Volk aus moosigen Wäldern und alten Seidenstädten. Ihre Flügel dienen dem Gleiten, ihre Fühler der Orientierung; sie sind weder Nachtgeister noch zwingend nachtaktiv. Ihre Kultur schätzt feine Webkunst und gegenseitige Gastfreundschaft.',
 traits:c=>[['Dunkelsicht','18 m.'],['Gleitflügel','Wenn du mindestens 3 m fällst und nicht kampfunfähig bist, kannst du als Reaktion deinen Fallschaden um das Fünffache deines Übungsbonus reduzieren und bis zu 3 m horizontal gleiten (freier Weg, kein Aufstieg). Keine Flugbewegungsrate.'],['Seidenstaub','Bonusaktion, 1× pro langer Rast: Eine sichtbare Kreatur in 1,5 m macht einen KON-Rettungswurf (SG '+(8+c.pb+c.mod.con)+'). Bei Misserfolg hat sie Nachteil auf ihren nächsten Angriff vor dem Ende ihres nächsten Zuges. Keine Wirkung durch geschlossene Augen oder vollständige Deckung.']],res:c=>[HX_R('hxs_dust','Seidenstaub')]},
 hxgolem:{name:'Golem',en:'Golem',size:'Klein oder Mittelgross',speed:9,dv:0,home:true,life:'unbekannt; mehrere Jahrhunderte',choice:{key:'craft',label:'Ursprüngliche Bauart',opts:HX_GOLEM_VARIANTS},
 flavor:'✦ Eine untergegangene Zivilisation erschuf Golems als Arbeiter, Diener und Soldaten. Sie entwickelten Bewusstsein und erlangten ihre Freiheit. Das Wissen, neue Golems zu beleben, ging verloren. Jeder endgültige Tod ist ein Verlust für das Volk. Geformte, gebrannte und geschmiedete Golems tragen die Erinnerung an ihre Herkunft, wählen aber ihren eigenen Weg.',
 traits:c=>{const k=c.char.speciesChoice||'clay'; const common=[['Lebende Konstruktion','Kreaturentyp Humanoid (für alle Spielregeln). Du brauchst keine Nahrung, kein Getränk und keinen Atem; Heilung und Wiederbelebung wirken normal. Du alterst nicht sichtbar, kannst aber sterben.'],['Ruhender Geist','Eine lange Rast dauert 8 Stunden. Mindestens 6 davon verbringst du regungslos und wach; du kannst deine Umgebung weiterhin normal wahrnehmen. Magie kann dich nicht einschlafen lassen.'],['Werkstoffkörper','Resistenz gegen Giftschaden und Vorteil auf Rettungswürfe gegen Vergiftet.']];const v={clay:['Formbarer Ton','Einmal pro kurzer Rast kannst du dich als Bonusaktion bis zum Ende deines Zuges durch Öffnungen bewegen, die für eine Kreatur eine Grössenkategorie kleiner ausreichen; Ausrüstung muss durchpassen. Du darfst nicht in einem zu kleinen Raum enden.'],ceramic:['Goldene Naht','Bonusaktion, 1× pro langer Rast: Heile 1W6 + ÜB Trefferpunkte (auf Maximum begrenzt). Goldene Bruchlinien bleiben als Erinnerungen sichtbar.'],forged:['Stabiles Gefüge','Wenn ein Angriff gegen dich trifft, kannst du 1× pro langer Rast als Reaktion den Schaden um 1W6 + ÜB verringern. Keine feste oder integrierte Rüstung, freie Ausrüstungswahl.']}[k]||['Formbarer Ton','Wie Lehmgeborene.'];return common.concat([v]);},
 res:c=>[c.char.speciesChoice==='ceramic'?HX_R('hxsp_naht','Goldene Naht'):c.char.speciesChoice==='forged'?HX_R('hxsp_gefu','Stabiles Gefüge'):HX_R('hxsp_ton','Formbarer Ton',1,'short')]},
 hxrift:{name:'Kluftlinge',en:'Riftfolk',size:'Klein oder Mittelgross',speed:9,dv:36,home:true,life:'ca. 100 Jahre',
 flavor:'✦ Kluftlinge sind die Bewohner alter Höhlenstädte und gewundener unterirdischer Strassen. Blasse Haut, grosse Augen und lange Finger verraten ihre Herkunft, doch viele reisen an die Oberfläche. Ihre Gemeinschaften errichten vertikale Siedlungen und erzählen Geschichten über die erste Sonne.',
 traits:c=>[['Dunkelsicht','36 m. Keine Sonnenlichtempfindlichkeit.'],['Kluftgang','Du hast eine Kletterbewegungsrate entsprechend deiner Gehgeschwindigkeit.'],['Schmaler Körper','Beim Quetschen durch einen Raum, der für eine Grössenkategorie kleiner ausreicht, kostet dich jeder Meter Bewegung keinen zusätzlichen Meter. Die übrigen Nachteile des Quetschens bleiben; du darfst dort nicht enden.'],['Höhlenkunde','Übung in Überlebenskunst. Du hast Vorteil bei Proben zum Wiederfinden eines Wegs durch natürliche Höhlen.']],skills:['sur']},
 hxleaf:{name:'Laubgeborene',en:'Leafborn',size:'Mittelgross',speed:9,dv:0,home:true,life:'ca. 240 Jahre',
 flavor:'✦ Laubgeborene bestehen aus lebenden Pflanzenfasern, mit Haut in Grün- und Erdtönen und saisonal wechselnden Blättern. Ihre Siedlungen wachsen über Generationen. Sie sind eigenständige Humanoide und keine Baumgeister oder Pilzwesen.',
 traits:c=>[['Lebende Fasern','Du benötigst pro Tag nur halb so viel Nahrung wie ein Mensch, aber weiterhin Wasser.'],['Wurzelhalt','Reaktion, 1× pro kurzer Rast: Wenn du auf einem festen Untergrund stehst und gegen deinen Willen verschoben oder umgeworfen würdest, reduziere die erzwungene Bewegung um 3 m oder verhindere den Zustand Liegend (deine Wahl). Teleportation wird nicht verhindert.'],['Lichternte','Bei einer kurzen Rast, in der du mindestens einen Trefferwürfel ausgibst, heile einmal zusätzlich TP in Höhe deines ÜB. Funktioniert auch ohne Sonnenlicht.'],['Pflanzenkunde','Übung in Naturkunde.']],skills:['nat'],res:c=>[HX_R('hxs_root','Wurzelhalt',1,'short')]},
 hxoculi:{name:'Oculi',en:'Oculi',size:'Mittelgross',speed:9,dv:0,home:true,life:'ca. 160 Jahre',
 flavor:'✦ Oculi besitzen einen etwas grösseren Kopf und genau drei Augen. Das dritte Auge ist ein natürliches Sinnesorgan für feinste magische Abweichungen. Ihre Handwerks- und Erzähltraditionen behandeln Wahrnehmung als Kunst, nicht als Zeichen moralischer Überlegenheit. Sie sind humanoid, weder elfisch noch ausserirdisch.',
 traits:c=>[['Wacher Blick','Übung in Wahrnehmung.'],['Arkaner Schimmer','Aktion: Du erkennst, ob ein sichtbares Objekt oder eine sichtbare Kreatur in 9 m gerade von einem magischen Effekt betroffen ist. Keine genaue Zauberidentifikation, keine Sicht durch Deckung, keine Erkennung gewöhnlicher Gedanken oder Lügen.'],['Drittes Auge','Bonusaktion, 1× pro langer Rast: 1 Minute lang kannst du unsichtbare Kreaturen und Gegenstände in 3 m sehen, solange kein vollständiger Sichtschutz dazwischenliegt. Keine Aufhebung gewöhnlicher Dunkelheit oder sonstiger Sichtbehinderung.']],skills:['prc'],res:c=>[HX_R('hxs_eye','Drittes Auge')]},
 hxbone:{name:'Ossari',en:'Bonekin',size:'Mittelgross',speed:9,dv:0,home:true,life:'ca. 150 Jahre',
 flavor:'✦ Ossari sind lebende Humanoide mit individuell gewachsenen Knochenleisten an Armen, Schultern und Stirn. Ihre Knochenmuster verändern sich über ein ganzes Leben. Schnitzereien, Kleidung und Kunst greifen die organischen Formen auf. Sie sind weder Untote noch Steinwesen.',
 traits:c=>[['Knochenklinge','Deine waffenlosen Schläge können 1W6 + STÄ-Mod Hieb- oder Stichschaden (deine Wahl) verursachen. Bei einer anderen Fähigkeit, die den waffenlosen Schadenswürfel verändert, wählst du einen der Würfel, nicht beide.'],['Stachelwehr','Reaktion, 1× pro kurzer Rast: Wenn eine Kreatur in 1,5 m dich mit einem Nahkampfangriff trifft oder erfolgreich packt, erleidet sie 1W6 + ÜB Stichschaden. Kein Angriffswurf, kein kritischer Treffer.'],['Knochenpflege','Übung in Heilkunde. Knochenleisten beeinträchtigen gewöhnliche Rüstung, Kleidung und Waffen nicht.']],skills:['med'],res:c=>[HX_R('hxs_spike','Stachelwehr',1,'short')]},
 hxfey:{name:'Feyri',en:'Feyri',size:'Mittelgross',speed:9,dv:0,home:true,life:'ca. 250 Jahre',
 flavor:'✦ Die Feyri sind ein flügelloses Feenvolk aus der Anderswelt. Grosse schillernde Augen, nach oben gerichtete Ohren, kleine verzweigte Hornansätze und irisierende Haut prägen ihre Erscheinung. Namen, Versprechen und Gastfreundschaft bilden ihre Kultur; keine Abstammung legt eine Gesinnung fest.',
 traits:c=>[['Andersweltherkunft','Kreaturentyp Fey. Vorteil auf Rettungswürfe gegen Bezaubert.'],['Gastrecht','Wenn du die Aktion Helfen ausführst, um einer Kreatur bei einer Probe oder einem Angriff zu helfen, darfst du ihr zusätzlich temporäre TP in Höhe deines ÜB geben. ÜB-mal pro langer Rast. Temporäre TP stapeln nicht.'],['Einladung','Bonusaktion, 1× pro langer Rast: Tausche deinen Platz mit einer bereitwilligen sichtbaren Kreatur deiner Grösse oder kleiner in 3 m. Beide Ziele müssen an die jeweils neue Position passen; keine vollständige Deckung. Es ist Teleportation, keine Bewegung, und löst keine Gelegenheitsangriffe aus.']],res:c=>[HX_R('hxs_guest','Gastrecht',c.pb),HX_R('hxs_invite','Einladung')]},
 hxtail:{name:'Trilari',en:'Trilari',size:'Mittelgross',speed:9,dv:0,home:true,life:'ca. 120 Jahre',
 flavor:'✦ Trilari besitzen drei Finger pro Hand und einen kräftigen Greifschwanz. Ihre breiten, flachen Gesichter unterscheiden sie von Menschen und Tierwesen. Sie stammen aus felsigen Hochlanden und sind für geflochtene Brücken, Kletterpfade und geschicktes Handwerk bekannt.',
 traits:c=>[['Greifschwanz','Der Schwanz kann einen Gegenstand bis 5 kg innerhalb deiner normalen Reichweite halten oder loslassen. Er darf keine Waffen, Schilde, Zauberfoki oder Werkzeugaktivierungen übernehmen, keine Komponenten manipulieren und verleiht keine zusätzlichen Aktionen, Angriffe, Objektinteraktionen oder Haltegriffe.'],['Sicherer Kletterer','Vorteil auf STÄ (Athletik)-Proben zum Klettern.'],['Dreipunktstand','Reaktion, 1× pro kurzer Rast: Wenn du auf festem Untergrund liegend werden würdest, kannst du dies verhindern. Du wirst nicht gegen beliebige erzwungene Bewegung immun.']],res:c=>[HX_R('hxs_tail','Dreipunktstand',1,'short')]}
};
for(const [id,S] of Object.entries(HX_SPECIES)){if(SPECIES[id])throw Error('HX Spezies-ID belegt: '+id);SPECIES[id]=S;}
/* End HX expansion */
/* Explicit eligibility and shared once-per-turn groups for new damage options. */
function hxExtraEligible(x,a,ch,d){
 if(!x.hxGroup)return true;
 if(typeof offTurn==='function'&&offTurn())return false;
 if(d&&(d.cleave||d.ts))return false;
 if(x.hxGroup==='hxform')return a.melee&&(a.idx!==undefined||a.unarmed)&&(ch.play.hxForms||[]).includes('Klinge');
 if(x.hxGroup==='hxexec')return a.idx!==undefined;
 if(x.hxGroup==='hxguard')return a.idx!==undefined&&a.melee;
 return false;
}
const hxExtraKey=x=>x.hxGroup||x.k;
const HX_START={hxform:['Schuppenpanzer','Langschwert, Schild, 2 Wurfspiesse, Entdeckerausrüstung','120 GM'],hxmind:['Lederrüstung','Dolch, Quartierstab, Gelehrtenausrüstung','75 GM'],hxguard:['Kettenpanzer','Langschwert, Schild, 2 Wurfspiesse, Entdeckerausrüstung','150 GM'],hxthread:['Lederrüstung','Dolch, Kurzbogen, 20 Pfeile, Entdeckerausrüstung','75 GM'],hxexec:['Schuppenpanzer','Langschwert, Kurzbogen, 20 Pfeile, Entdeckerausrüstung','120 GM'],hxblight:['Schuppenpanzer','Langschwert, Schild, 2 Wurfspiesse, Entdeckerausrüstung','120 GM']};
for(const [k,v] of Object.entries(HX_START))HX_CLASSES[k].startEquipment=v;

