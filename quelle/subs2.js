/* ==== Weitere eigene Unterklassen (✦ Heldenbuch-Erfindungen, eigene Mechanik und eigene Texte) ==== */
const MORE_SUBS = {
 bar:[
  { id:'ahnen', name:'✦ Pfad der Ahnenwacht', desc:'Die Geister deiner Sippe ziehen mit dir in jede Schlacht. Wo du wütest, legen sie sich schützend um deine Gefährten.', feats:[
   [3,'Ahnenschild','Einmal pro Zug im Kampfrausch, wenn du eine Kreatur triffst: Ein Verbündeter in 9 m erhält temporäre TP in Höhe deines Kampfrausch-Bonus + KON-Mod.'],
   [3,'Stimmen der Ahnen','Übung in Geschichte. Einmal pro langer Rast darfst du der Spielleitung eine kurze Frage zur Vergangenheit eines Ortes stellen.'],
   [6,'Sippenruf','Reaktion, wenn einem Verbündeten in 9 m ein Rettungswurf misslingt: Er wiederholt ihn mit einem Bonus in Höhe deines KON-Mods. KON-Mod-mal pro langer Rast.'],
   [10,'Ahnenwanderung','Bonusaktion im Kampfrausch, 1× pro Kampfrausch: Du tauschst mit einem Verbündeten in 9 m den Platz; ihr beide habt bis zum Ende des Zuges Resistenz gegen allen Schaden ausser psychischem.'],
   [14,'Ungebrochene Linie','Reaktion, wenn ein Verbündeter in 9 m auf 0 TP fällt: Gib eine Kampfrausch-Nutzung aus – er hat stattdessen TP in Höhe deiner doppelten Barbarenstufe.']],
   res:(l,c)=> l>=6?[{k:'sippe',n:'Sippenruf',max:Math.max(1,c.mod.con),reset:'long'}]:[] },
  { id:'koloss', name:'✦ Kolossgeborener', desc:'In deinen Adern fliesst Fels. Im Rausch wirst du schwer wie ein Berg – wer dich bewegen will, bewegt eher die Welt.', feats:[
   [3,'Felshaut','Im Kampfrausch: +1 RK, und du hast Vorteil, wenn du packst oder stösst.'],
   [3,'Schwere Faust','Deine waffenlosen Schläge verursachen 1W6 + STÄ-Mod Wuchtschaden.'],
   [6,'Felswurf','Bonusaktion im Kampfrausch: Wirf einen Brocken (18 m) – Fernkampfangriff mit STÄ, 2W8 Wucht + Kampfrausch-Bonus; das Ziel macht einen STÄ-Rettungswurf (SG 8 + STÄ + ÜB) oder liegt. KON-Mod-mal pro langer Rast.'],
   [10,'Bebenstoss','Bonusaktion im Kampfrausch, 1× pro Zug: Du stampfst auf – Kreaturen deiner Wahl in 3 m machen einen GES-Rettungswurf oder erleiden 2W6 Wucht und liegen.'],
   [14,'Unverrückbarer Koloss','Im Kampfrausch kannst du nicht gegen deinen Willen verschoben oder umgeworfen werden, und Angriffe gegen Verbündete in 1,5 m von dir haben Nachteil.']],
   res:(l,c)=> l>=6?[{k:'felswurf',n:'Felswurf',max:Math.max(1,c.mod.con),reset:'long'}]:[] } ],
 brd:[
  { id:'masken', name:'✦ Gilde der Hofmasken', desc:'Am Hof gewinnt, wer die richtige Maske trägt. Du wechselst Gesichter wie andere Handschuhe – und jedes verzaubert anders.', feats:[
   [3,'Maskenwechsel','Bonusaktion: Setze eine von drei Masken auf (10 Minuten, beliebig oft): Heldin – Verbündete in 9 m +1 auf Rettungswürfe; Narr – Feinde in 9 m haben Nachteil auf Wahrnehmung; Herrscherin – Vorteil auf Überzeugen und Einschüchtern.'],
   [3,'Hofzunge','Übung in Täuschen und Auftreten.'],
   [6,'Bühnenwechsel','Reaktion, 1 Bardische Inspiration: Tausche den Platz mit einem Verbündeten in 9 m, den du sehen kannst. Trifft ein Verbündeter mit Hilfe deiner Inspiration, darf er sich 3 m bewegen, ohne Gelegenheitsangriffe auszulösen.'],
   [14,'Grosses Finale','Aktion, 1× pro langer Rast: Feinde deiner Wahl in 9 m machen einen WEI-Rettungswurf oder sind bis zum Ende deines nächsten Zuges bezaubert und kampfunfähig; Verbündete in 9 m erhalten je einen Inspirationswürfel.']],
   res:(l)=> l>=14?[{k:'finale',n:'Grosses Finale',max:1,reset:'long'}]:[] },
  { id:'klingentakt', name:'✦ Schule des Klingentakts', desc:'Für dich ist ein Kampf ein Lied. Jeder Hieb setzt einen Takt, und wer deinen Rhythmus kennt, weiss, wann der Schlussakkord kommt.', feats:[
   [3,'Taktgefühl','Übung mit mittelschwerer Rüstung und Krummsäbeln; eine Nahkampfwaffe dient dir als Zauberfokus. Jeder Treffer mit einer Waffe gibt dir 1 Taktpunkt (höchstens 3; sie verfallen nach einer kurzen Rast).'],
   [3,'Rhythmuswechsel','Gib 1 Taktpunkt aus: +1W6 Schaden auf einen Treffer, oder +2 RK bis zum Beginn deines nächsten Zuges, oder 3 m Bewegung ohne Gelegenheitsangriffe.'],
   [6,'Zusätzlicher Angriff','Mit der Angriffsaktion greifst du zweimal an; einen Angriff darfst du durch einen Zaubertrick ersetzen.'],
   [14,'Crescendo','Bonusaktion bei 3 Taktpunkten: Gib alle aus und mache einen Angriff gegen bis zu drei Kreaturen in Reichweite; jeder Treffer verursacht +3W6 Schallschaden.']],
   res:(l)=>[{k:'takt',n:'Taktpunkte (durch Treffer füllen)',max:3,reset:'short'}] } ],
 cle:[
  { id:'sturmkrone', name:'✦ Domäne der Sturmkrone', desc:'Deine Gottheit thront in den Wolken. Wer ihr dient, trägt eine Krone aus Blitzen, die bei jedem Gebet aufflackert.', spells:{3:['thunderwave','fog-cloud','gust-of-wind','shatter'],5:['call-lightning','sleet-storm'],7:['ice-storm','fire-shield'],9:['cone-of-cold','flame-strike']}, feats:[
   [3,'Donnerkrone','Übung mit Kriegswaffen. Göttliche Macht fokussieren (Bonusaktion, 1 Minute): Eine Blitzkrone schwebt über dir; zu Beginn jedes deiner Züge macht eine Kreatur deiner Wahl in 9 m einen GES-Rettungswurf oder erleidet 2W6 Blitzschaden (3W6 ab Stufe 10).'],
   [3,'Domänenzauber','Immer vorbereitet: Donnerwoge, Nebelwolke, Windstoss, Zersplittern (ab 5: Blitze herbeirufen, Schneeregensturm; ab 7: Eissturm, Feuerschild; ab 9: Kältekegel, Flammenschlag).'],
   [6,'Sturmgeerdet','Resistenz gegen Blitz- und Schallschaden. Nimmst du solchen Schaden, verursacht dein nächster Zauber in diesem oder dem nächsten Zug zusätzlich Schaden in Höhe deines ÜB.'],
   [17,'Sturmthron','Bonusaktion, 1× pro langer Rast: 1 Minute lang Flugbewegung 18 m; Fernkampfangriffe gegen Verbündete in 9 m von dir haben Nachteil.']],
   res:(l)=> l>=17?[{k:'thron',n:'Sturmthron',max:1,reset:'long'}]:[] },
  { id:'esse', name:'✦ Orden der Heiligen Esse', desc:'Für dich ist jedes Werkstück ein Gebet. In der Glut deiner Esse härtest du Stahl – und den Mut deiner Gefährten.', spells:{3:['heat-metal','shield-of-faith','magic-weapon','burning-hands'],5:['elemental-weapon','protection-from-energy'],7:['fire-shield','stone-shape'],9:['wall-of-stone','flame-strike']}, feats:[
   [3,'Ordenszauber','Immer vorbereitet: Metall erhitzen, Schild des Glaubens, Magische Waffe, Brennende Hände (ab 5: Elementarwaffe, Schutz vor Energie; ab 7: Feuerschild, Steinformen; ab 9: Steinwand, Flammenschlag).'],
   [3,'Glutsegen','Göttliche Macht fokussieren (Aktion, 1 Stunde): Berühre eine Waffe – sie verursacht pro Treffer +1W4 Feuerschaden – oder eine Rüstung – ihr Träger hat Resistenz gegen Feuer und erhält zu Beginn jedes Kampfes temporäre TP in Höhe deines ÜB.'],
   [3,'Essenhandwerk','Übung mit schwerer Rüstung und Schmiedewerkzeug. Ausbessern wirkst du als Bonusaktion.'],
   [6,'Funkenflug','Reaktion, wenn dich eine Kreatur in 1,5 m im Nahkampf trifft: Sie erleidet 1W8 + WEI-Mod Feuerschaden. WEI-Mod-mal pro langer Rast.'],
   [17,'Ungebrochenes Metall','1× pro langer Rast, wenn du auf 0 TP fallen würdest: Du hast stattdessen 1 TP, bis zum Ende deines nächsten Zuges Immunität gegen Wucht-, Stich- und Hiebschaden, und Kreaturen in 3 m erleiden 3W8 Feuerschaden.']],
   res:(l,c)=>(l>=6?[{k:'funken',n:'Funkenflug',max:Math.max(1,c.mod.wis),reset:'long'}]:[]).concat(l>=17?[{k:'metall',n:'Ungebrochenes Metall',max:1,reset:'long'}]:[]) } ],
 dru:[
  { id:'urhaut', name:'✦ Zirkel der Urhäute', desc:'Du musst dich nicht ganz verwandeln, um wild zu sein. Fell, Krallen und Instinkt wachsen dir, wann immer du sie rufst.', feats:[
   [3,'Urhaut','Statt einer Tiergestalt: 10 Minuten tierische Merkmale – RK 13 + WEI-Mod (falls höher), Klauen (waffenloser Schlag 1W8 + WEI-Mod, magisch), Bewegung +3 m. Du kannst dabei weiter zaubern.'],
   [3,'Fährtengespür','Vorteil auf Wahrnehmung mit dem Geruchssinn und auf Überlebenskunst beim Spurenlesen.'],
   [6,'Wilde Gewandtheit','In Urhaut greifst du mit der Angriffsaktion zweimal mit den Klauen an.'],
   [10,'Zähes Fell','Wählst du Urhaut, wähle auch eine Schadensart (ausser psychisch und Energie): Resistenz dagegen, solange sie anhält.'],
   [14,'Urbestie','1× pro langer Rast: Für 1 Minute wird deine Urhaut gewaltig – du bist gross, deine Klauen reichen 3 m und verursachen +2W8 Schaden.']],
   res:(l)=> l>=14?[{k:'urbestie',n:'Urbestie',max:1,reset:'long'}]:[] },
  { id:'sternspur', name:'✦ Zirkel der Sternspuren', desc:'Du liest die Wege der Sterne wie andere Wildwechsel. Jede Nacht zeigt dir ein Sternbild, wohin dein Tag dich trägt.', spells:{3:['starry-wisp','guiding-bolt']}, feats:[
   [3,'Sternbild des Tages','Nach jeder langen Rast wählst du: Der Hirte (Verbündete in 9 m +1 auf Rettungswürfe), Der Wanderer (Bewegung +3 m, schwieriges Gelände kostet keine Extrabewegung) oder Die Sense (einmal pro Zug +WEI-Mod Schaden bei Zaubern mit Kälte- oder gleissendem Schaden).'],
   [3,'Sternenlicht','Sternenfunke und Lenkendes Geschoss sind für dich immer vorbereitet.'],
   [6,'Sternschnuppe','Reaktion, wenn eine Kreatur in 18 m angreift: Sie erleidet 2W6 gleissenden Schaden und hat Nachteil auf den Angriff. WEI-Mod-mal pro langer Rast.'],
   [10,'Doppelgestirn','Du wählst zwei Sternbilder gleichzeitig.'],
   [14,'Himmelsriss','Aktion, 1× pro langer Rast: Eine 6-m-Kugel in 36 m – KON-Rettungswurf, 8W8 gleissender Schaden und bis zum Ende deines nächsten Zuges blind; bei Erfolg halber Schaden, nicht blind.']],
   res:(l,c)=>(l>=6?[{k:'schnuppe',n:'Sternschnuppe',max:Math.max(1,c.mod.wis),reset:'long'}]:[]).concat(l>=14?[{k:'riss',n:'Himmelsriss',max:1,reset:'long'}]:[]) } ],
 fig:[
  { id:'feldkunst', name:'✦ Meister der Feldkunst', desc:'Du gewinnst Kämpfe, bevor der erste Pfeil fliegt. Deine Stärke ist der Plan – und eine Gruppe, die ihm folgt.', feats:[
   [3,'Schlachtplan','Würfelst du Initiative, wähle einen Plan für die erste Runde: Angriff (Verbündete in 9 m +1 auf Angriffe), Verteidigung (+1 RK) oder Beweglichkeit (+3 m Bewegung).'],
   [3,'Taktikpunkte','ÜB Taktikpunkte pro kurzer Rast. Lagewechsel (nach einem Treffer): ein Verbündeter in 9 m bewegt sich bis 3 m ohne Gelegenheitsangriffe. Schwachstelle (bei einem Treffer): +1W8 Schaden, und der nächste Angriff eines Verbündeten gegen das Ziel erhält +2.'],
   [7,'Lageblick','Bonusaktion: Du erfährst von einer Kreatur in 18 m, ob ihre RK und ihre aktuellen TP höher oder niedriger als deine sind.'],
   [10,'Eingespieltes Team','Dein Schlachtplan gilt für die ganze Begegnung.'],
   [15,'Gegenzug','Reaktion, 1 Taktikpunkt: Verfehlt ein Angriff einen Verbündeten in 1,5 m von dir, greifst du den Angreifer an.'],
   [18,'Feldherr','Würfelst du Initiative und hast weniger als 2 Taktikpunkte, erhältst du 2 zurück.']],
   res:(l,c)=>[{k:'taktik',n:'Taktikpunkte',max:c.pb,reset:'short'}] },
  { id:'arkanklinge', name:'✦ Orden der Arkanklinge', desc:'Du hast gelernt, Zeichen in den Stahl zu schreiben. Deine Klinge springt, schützt und brennt, wenn du es ihr befiehlst.', feats:[
   [3,'Klingenzeichen','Arkanladungen = INT-Mod + 1 (mindestens 2) pro kurzer Rast. Zeichen der Schneide (Bonusaktion, 1 Minute): Waffe +1W6 Energieschaden. Schildzeichen (Reaktion): +4 RK gegen einen Angriff. Sprungzeichen (Bonusaktion): Teleport bis 6 m.'],
   [7,'Gebundene Waffe','Nach einer kurzen Rast bindest du eine Waffe an dich: Du kannst sie nicht entwaffnet bekommen und rufst sie als Bonusaktion aus bis zu 30 m in die Hand.'],
   [10,'Zauberbrecher','Vorteil auf Rettungswürfe gegen Zauber. Gelingt er, erhältst du 1 Arkanladung zurück.'],
   [15,'Arkaner Ansturm','Nutzt du Tatendrang, darfst du dich zusätzlich bis zu 9 m teleportieren.'],
   [18,'Klingensturm','Aktion, 1× pro langer Rast: Mache einen Angriff gegen jede Kreatur deiner Wahl in 3 m; jeder Treffer verursacht +2W8 Energieschaden.']],
   res:(l,c)=>[{k:'arkan',n:'Arkanladungen',max:Math.max(2,c.mod.int+1),reset:'short'}].concat(l>=18?[{k:'klsturm',n:'Klingensturm',max:1,reset:'long'}]:[]) } ],
 mon:[
  { id:'nachtwind', name:'✦ Weg des Nachtwinds', desc:'Du bewegst dich wie der Wind zwischen Häusern: kaum zu hören, nie dort, wo man dich erwartet.', feats:[
   [3,'Lautloser Schritt','Deine Bewegung macht keine Geräusche. Hast du dich höchstens um die halbe Bewegungsrate bewegt, hast du Vorteil auf Heimlichkeit.'],
   [3,'Windstoss','Triffst du mit einem waffenlosen Schlag, 1 Fokuspunkt: Das Ziel wird 3 m weggestossen, und du darfst ihm folgen, ohne Gelegenheitsangriffe auszulösen.'],
   [6,'Nachtwindgestalt','Bonusaktion, 1 Fokuspunkt: Bis zum Ende des Zuges bewegst du dich durch den Bereich anderer Kreaturen, löst keine Gelegenheitsangriffe aus und hast +3 m Bewegung.'],
   [11,'Sturmschatten','Nutzt du Ausweichen, erleidet jeder Angreifer, der dich verfehlt, 1W10 Wuchtschaden durch einen Windstoss.'],
   [17,'Herr der Stille','Aktion, 3 Fokuspunkte: 1 Minute lang umgibt dich eine 6-m-Zone der Stille, die mit dir wandert. Darin kann niemand Zauber mit verbaler Komponente wirken, und du hast Vorteil auf Angriffe gegen Kreaturen darin.']] },
  { id:'waage', name:'✦ Hüter der Lebenswaage', desc:'Leben und Schmerz sind zwei Schalen derselben Waage. Mit ruhigem Atem und einem Griff an die richtige Stelle hältst du sie im Gleichgewicht.', feats:[
   [3,'Ruhiger Atem','Übung in Heilkunde. Bonusaktion, 1 Fokuspunkt: Eine Kreatur in 9 m erhält temporäre TP in Höhe eines Kampfkunstwürfels + WEI-Mod.'],
   [3,'Druckpunkte','Triffst du eine Kreatur, 1 Fokuspunkt: Sie hat bis zum Ende deines nächsten Zuges Nachteil auf Angriffe.'],
   [6,'Waage halten','Verbündete in 3 m von dir haben Vorteil auf Todesrettungswürfe. Heilst du jemanden, erhält er zusätzlich TP in Höhe der halben Mönchsstufe.'],
   [11,'Lebensfaden','Reaktion, 2 Fokuspunkte: Fällt ein Verbündeter in 9 m auf 0 TP, hat er stattdessen 1 TP + einen Kampfkunstwürfel.'],
   [17,'Gleichgewicht der Welt','Aktion, 1× pro langer Rast: Verbündete in 9 m heilen 4 Kampfkunstwürfel; Feinde in 9 m machen einen KON-Rettungswurf oder erleiden 4 Kampfkunstwürfel nekrotischen Schaden.']],
   res:(l)=> l>=17?[{k:'gleich',n:'Gleichgewicht der Welt',max:1,reset:'long'}]:[] } ],
 pal:[
  { id:'unnachgiebig', name:'✦ Eid der Unnachgiebigkeit', desc:'Du hast geschworen, nicht zu ruhen, bis das Unrecht gesühnt ist. Wen du schuldig sprichst, der kann dir nicht mehr entkommen.', spells:{3:['compelled-duel','heroism'],5:['zone-of-truth','see-invisibility'],9:['bestow-curse','slow'],13:['locate-creature','freedom-of-movement'],17:['dispel-evil-and-good','geas']}, feats:[
   [3,'Schuldspruch','Göttliche Macht fokussieren (Bonusaktion, 1 Minute): Zeichne eine Kreatur in 18 m. Einmal pro Zug verursachst du gegen sie +ÜB Schaden, und sie kann sich vor dir nicht verstecken oder unsichtbar verbergen.'],
   [3,'Eidzauber','Immer vorbereitet: Erzwungenes Duell, Heldenmut (ab 5: Zone der Wahrheit, Unsichtbares sehen; ab 9: Fluch auferlegen, Verlangsamen; ab 13: Kreatur aufspüren, Bewegungsfreiheit; ab 17: Gutes und Böses bannen, Geas).'],
   [7,'Unerbittliches Urteil','Fällt dein gezeichnetes Ziel, geht der Schuldspruch kostenlos auf eine Kreatur in 9 m davon über. Verbündete in deiner Aura verursachen gegen das Ziel +2 Schaden.'],
   [15,'Kein Zurückweichen','Du kannst nicht gegen deinen Willen verschoben oder umgeworfen werden. 1× pro langer Rast: Fällst du auf 0 TP, hast du stattdessen 1 TP.'],
   [20,'Urteilsvollstrecker','Bonusaktion, 1× pro langer Rast, 1 Minute: +CHA-Mod auf Angriffe; gegen dein gezeichnetes Ziel erzielst du bei 18–20 kritische Treffer; Feinde in deiner Aura haben Nachteil auf Angriffe gegen andere als dich.']],
   res:(l)=>(l>=15?[{k:'nozurueck',n:'Kein Zurückweichen (1 TP)',max:1,reset:'long'}]:[]).concat(l>=20?[{k:'vollstr',n:'Urteilsvollstrecker',max:1,reset:'long'}]:[]) },
  { id:'hain', name:'✦ Schwur des Uralten Hains', desc:'Im ältesten Wald hast du geschworen, das Grüne zu schützen. Mit dir wandern die Jahreszeiten – und keine Verderbnis überdauert sie.', spells:{3:['goodberry','entangle'],5:['barkskin','pass-without-trace'],9:['wind-wall','meld-into-stone'],13:['freedom-of-movement','conjure-woodland-beings'],17:['awaken','greater-restoration']}, feats:[
   [3,'Jahreszeiten des Hains','Göttliche Macht fokussieren (Bonusaktion, 1 Minute), deine Aura nimmt eine Jahreszeit an: Frühling (Verbündete heilen zu Beginn ihres Zuges CHA-Mod TP), Sommer (Waffentreffer von Verbündeten +1W4 Feuer), Herbst (Feinde −3 m Bewegung), Winter (Verbündete Resistenz gegen Kälte, die Aura ist für Feinde schwieriges Gelände).'],
   [3,'Eidzauber','Immer vorbereitet: Gute Beeren, Verstricken (ab 5: Rindenhaut, Spurloses Gehen; ab 9: Windwand, Mit Stein verschmelzen; ab 13: Bewegungsfreiheit, Waldwesen herbeirufen; ab 17: Erwecken, Mächtige Genesung).'],
   [7,'Aura der Wurzeln','Du und Verbündete in deiner Aura habt Vorteil auf Rettungswürfe gegen Umwerfen und Verschieben.'],
   [15,'Immergrün','Du alterst kaum noch. Hast du im Kampf höchstens die Hälfte deiner TP (und mindestens 1), erhältst du zu Beginn jedes deiner Züge 1W6 TP zurück.'],
   [20,'Herz des Hains','Bonusaktion, 1× pro langer Rast, 1 Minute: Verbündete in deiner Aura heilen zu Beginn ihres Zuges 10 TP; Feinde, die ihren Zug darin beginnen, machen einen STÄ-Rettungswurf oder sind festgesetzt.']],
   res:(l)=> l>=20?[{k:'herzhain',n:'Herz des Hains',max:1,reset:'long'}]:[] } ],
 ran:[
  { id:'daemmer', name:'✦ Späher der Dämmerpfade', desc:'Du kennst die Pfade, die man nur in der Dämmerung findet. Wer dir folgt, ist unsichtbar – wer dich jagt, tappt in deine Fallen.', spells:{3:['alarm','fog-cloud'],5:['darkness','pass-without-trace'],9:['nondetection','meld-into-stone'],13:['locate-creature','dimension-door'],17:['mislead','tree-stride']}, feats:[
   [3,'Dämmerpfad','Im Dämmerlicht oder Dunkel hast du Vorteil auf Heimlichkeit; deine Gruppe kann mit normaler Geschwindigkeit verstohlen reisen.'],
   [3,'Fallensteller','Aktion: Lege eine verborgene Falle (1,5-m-Feld, 1 Stunde). Wer es betritt, macht einen GES-Rettungswurf gegen deinen Zauber-SG oder erleidet 2W6 Stichschaden und ist festgesetzt. ÜB-mal pro langer Rast.'],
   [3,'Pfadzauber','Immer vorbereitet: Alarm, Nebelwolke (ab 5: Dunkelheit, Spurloses Gehen; ab 9: Unauffindbarkeit, Mit Stein verschmelzen; ab 13: Kreatur aufspüren, Dimensionstür; ab 17: Irreführen, Baumschreiten).'],
   [7,'Lautlose Warnung','Du und Verbündete in 9 m könnt nicht überrascht werden, solange du wach bist, und erhaltet +2 auf Initiative.'],
   [11,'Zweiter Schatten','Einmal pro Zug: Triffst du eine Kreatur, die dich nicht gesehen hat, +2W8 Schaden.'],
   [15,'Pfad im Nebel','Bonusaktion: Nebelschritt ohne Zauberplatz, WEI-Mod-mal pro langer Rast.']],
   res:(l,c)=>[{k:'falle',n:'Fallensteller',max:c.pb,reset:'long'}].concat(l>=15?[{k:'nebelpfad',n:'Pfad im Nebel',max:Math.max(1,c.mod.wis),reset:'long'}]:[]) },
  { id:'wildbund', name:'✦ Wildbund-Hüter', desc:'Zwischen dir und deinem Tier gibt es kein Kommando, nur Einverständnis. Ihr jagt als ein einziges Wesen mit zwei Körpern.', feats:[
   [3,'Wildbund','Ein Tiergefährte (Wolf, Falke oder Bär) begleitet dich (unter „Begleiter“ als „Wildgefährte“): RK 12 + ÜB, TP 8 + 4 × Waldläuferstufe; er handelt in deinem Zug, greift mit deinem Zauberangriff an und verursacht 1W6 + ÜB Schaden.'],
   [3,'Zusammenspiel','Treffen du und dein Gefährte im selben Zug dieselbe Kreatur, erleidet sie einmal +1W6 Schaden.'],
   [7,'Bindung','Dein Gefährte addiert deinen ÜB auf Rettungswürfe und teilt deine Resistenzen.'],
   [11,'Rudelsturm','Ersetzt du einen deiner Angriffe durch einen Befehl, greift dein Gefährte zweimal an.'],
   [15,'Ein Herz','Reaktion: Wenn du oder dein Gefährte Schaden erleidet, darfst du ihn halbieren und die andere Hälfte auf den anderen übertragen.']] } ],
 rog:[
  { id:'duellant', name:'✦ Duellant vom Freien Hafen', desc:'In den Gassen des Freien Hafens zählt nur, wer zuletzt steht. Du forderst heraus, parierst – und lachst dabei.', feats:[
   [3,'Hafenfechten','Führst du nur eine Finesse-Waffe und keinen Schild, erhältst du +1 RK.'],
   [3,'Herausforderung','Bonusaktion: Fordere eine Kreatur in 9 m für 1 Minute heraus. Solange keine andere Kreatur in 1,5 m von dir steht, darfst du gegen sie Hinterhältigen Angriff auch ohne Vorteil einsetzen; du hast Vorteil auf Akrobatik.'],
   [9,'Riposte','Reaktion: Verfehlt dich ein Nahkampfangriff, greifst du den Angreifer an (Hinterhältiger Angriff möglich, wenn du ihn in diesem Zug noch nicht genutzt hast).'],
   [13,'Seemannsglück','Nach einem verfehlten Angriff oder misslungenen Rettungswurf: +1W8 auf das Ergebnis. ÜB-mal pro langer Rast.'],
   [17,'Klinge des Hafens','Gegen eine herausgeforderte Kreatur erzielst du bei 19–20 kritische Treffer, und dein Hinterhältiger Angriff verursacht +3W6.']],
   res:(l,c)=> l>=13?[{k:'seeglueck',n:'Seemannsglück',max:c.pb,reset:'long'}]:[] },
  { id:'trugbild', name:'✦ Trugbilddieb', desc:'Wer dich bestohlen glaubt, hat nur ein Trugbild gesehen. Du arbeitest mit Spiegeln, Schatten und dem Zweifel deiner Opfer.', feats:[
   [3,'Täuschungsbild','Trugladungen = INT-Mod + 1 (mindestens 2) pro kurzer Rast. Bonusaktion, 1 Ladung: Ein Trugbild von dir erscheint in 9 m (1 Minute). Kreaturen, die dich angreifen und das Bild sehen, haben Nachteil, bis sie es mit einer Aktion durchschauen (INT-Probe gegen 8 + ÜB + INT).'],
   [3,'Fingerspiel','Du lernst den Zaubertrick Kleine Illusion (INT ist dein Zauberattribut).'],
   [9,'Doppelgängerschritt','Reaktion, 1 Ladung, wenn ein Angriff dich trifft: Du tauschst den Platz mit deinem Trugbild – der Angriff verfehlt.'],
   [13,'Gestohlenes Gesicht','Selbstverkleidung beliebig oft ohne Zauberplatz; Vorteil auf Täuschen, solange du verkleidet bist.'],
   [17,'Meister des Trugs','Dein Hinterhältiger Angriff gegen eine Kreatur, die dein Trugbild in diesem Kampf angegriffen hat, verursacht +4W6, und sie ist bis zum Ende ihres nächsten Zuges benommen (keine Reaktionen).']],
   spells:{3:['minor-illusion']}, res:(l,c)=>[{k:'trug',n:'Trugladungen',max:Math.max(2,c.mod.int+1),reset:'short'}] } ],
 sor:[
  { id:'chaos', name:'✦ Chaosgeborener', desc:'Deine Magie gehorcht dir – meistens. Manchmal blüht sie in unerwarteten Farben, und du hast gelernt, das zu lieben.', spells:{3:['color-spray','magic-missile','blur','enlarge-reduce'],5:['blink','haste'],7:['confusion','polymorph'],9:['animate-objects','seeming']}, feats:[
   [3,'Chaoszauber','Immer vorbereitet: Farbenspiel, Magisches Geschoss, Verschwimmen, Vergrössern/Verkleinern (ab 5: Blinzeln, Hast; ab 7: Verwirrung, Verwandlung; ab 9: Objekte beleben, Anschein).'],
   [3,'Wankende Magie','Wirkst du einen Zauber Grad 1+, würfle W6. Bei einer 1 tritt ein Nebeneffekt ein (W6): 1 deine Haare leuchten 1 Minute, 2 Schmetterlinge umschwirren dich, 3 du schwebst 1 Runde 30 cm, 4 Teleport 3 m an einen zufälligen Ort, 5 Kreaturen in 3 m erhalten 1W6 temporäre TP, 6 dein nächster Zauber kostet keinen Platz unter Grad 2.'],
   [3,'Chaosfunke','Bonusaktion, 2 Zaubereipunkte: Dein nächster Schadenszauber wechselt die Schadensart zufällig (W8: Säure, Kälte, Feuer, Energie, Blitz, Gift, psychisch, Schall) und verursacht +1W8 Schaden.'],
   [6,'Gezügeltes Chaos','Bei einem Nebeneffekt würfelst du zweimal und wählst. ÜB-mal pro langer Rast darfst du die Schadenswürfel eines Zaubers neu würfeln.'],
   [14,'Chaosschild','Reaktion, wenn dich ein Angriff trifft, 2 Zaubereipunkte: Würfle W6 – bei 4–6 verfehlt der Angriff, bei 1–3 teleportierst du dich 6 m und erleidest halben Schaden.'],
   [18,'Sternenbruch','1× pro langer Rast: Du wirkst in einem Zug zwei Zauber bis Grad 5 (einer davon mit deiner Bonusaktion) – Ausnahme von der Regel „ein Zauberplatz pro Zug“.']],
   res:(l,c)=>(l>=6?[{k:'zuegel',n:'Gezügeltes Chaos (neu würfeln)',max:c.pb,reset:'long'}]:[]).concat(l>=18?[{k:'bruch',n:'Sternenbruch',max:1,reset:'long'}]:[]) },
  { id:'traum', name:'✦ Traumflüsterblut', desc:'Seit deiner Geburt flüstern dir fremde Träume zu. Du kannst sie weitergeben – als Trost oder als Albtraum.', spells:{3:['sleep','silent-image','phantasmal-force','detect-thoughts'],5:['hypnotic-pattern','sending'],7:['phantasmal-killer','arcane-eye'],9:['dream','modify-memory']}, feats:[
   [3,'Traumzauber','Immer vorbereitet: Schlaf, Lautloses Trugbild, Phantastische Kraft, Gedanken wahrnehmen (ab 5: Hypnotisches Muster, Botschaft senden; ab 7: Phantastischer Mörder, Arkanes Auge; ab 9: Traum, Erinnerung verändern).'],
   [3,'Traumbote','Du kannst schlafenden Kreaturen in 9 m kurze Bilder senden, die sie beim Aufwachen erinnern.'],
   [3,'Schlummerschleier','1 Zaubereipunkt: Ein Ziel deines Zaubers, der bezaubert oder einschläfert, hat Nachteil auf den ersten Rettungswurf dagegen.'],
   [6,'Wachtraum','Reaktion, 2 Zaubereipunkte, wenn dich eine Kreatur angreift: Sie macht einen WEI-Rettungswurf – bei Misserfolg trifft der Angriff nur ein Traumbild und verfehlt.'],
   [14,'Albtraumgestalt','Bonusaktion, 3 Zaubereipunkte, 1 Minute: Kreaturen, die ihren Zug in 3 m von dir beginnen, machen einen WEI-Rettungswurf oder sind bis zum Ende ihres Zuges verängstigt.'],
   [18,'Weltentraum','Aktion, 1× pro langer Rast: Kreaturen deiner Wahl in 18 m machen einen WEI-Rettungswurf oder schlafen 1 Minute (Schaden weckt sie).']],
   res:(l)=> l>=18?[{k:'welttraum',n:'Weltentraum',max:1,reset:'long'}]:[] } ],
 wlk:[
  { id:'daemmerhof', name:'✦ Vertrauter des Dämmerhofs', desc:'Dein Schutzherr regiert einen Hof, an dem nie ganz Tag und nie ganz Nacht ist. Dort zählt jede Geste – und jede Gunst muss vergolten werden.', spells:{3:['charm-person','disguise-self','enhance-ability','invisibility'],5:['hypnotic-pattern','major-image'],7:['greater-invisibility','compulsion'],9:['seeming','geas']}, feats:[
   [3,'Hofzauber','Immer vorbereitet: Person bezaubern, Selbstverkleidung, Attribut verbessern, Unsichtbarkeit (ab 5: Hypnotisches Muster, Grosses Trugbild; ab 7: Mächtige Unsichtbarkeit, Zwang; ab 9: Anschein, Geas).'],
   [3,'Gunst des Hofes','Bonusaktion, CHA-Mod-mal pro langer Rast: Gewähre einer Kreatur in 9 m eine Gunst (Verbündeter: +1W6 auf seinen nächsten W20-Wurf) oder entziehe sie (Feind: Nachteil auf seinen nächsten W20-Wurf).'],
   [3,'Höfische Zunge','Du sprichst Sylvanisch und hast Vorteil auf Überzeugen gegenüber Feenwesen.'],
   [6,'Höfliche Abwehr','Reaktion, wenn dich eine Kreatur angreift: Sie macht einen CHA-Rettungswurf gegen deinen Zauber-SG oder muss ein anderes Ziel wählen (oder der Angriff entfällt). 1× pro kurzer Rast.'],
   [10,'Dämmerkrone','Vorteil auf Rettungswürfe gegen bezaubert und verängstigt; einmal pro kurzer Rast gewährst du eine Gunst kostenlos.'],
   [14,'Hofurteil','Aktion, 1× pro langer Rast: Eine Kreatur in 18 m macht einen CHA-Rettungswurf oder ist 1 Minute in Feenranken festgesetzt und kann keine Reaktionen nutzen (Wiederholung am Ende jedes Zuges).']],
   res:(l,c)=>[{k:'gunst',n:'Gunst des Hofes',max:Math.max(1,c.mod.cha),reset:'long'}].concat(l>=6?[{k:'abwehr',n:'Höfliche Abwehr',max:1,reset:'short'}]:[]).concat(l>=14?[{k:'hofurteil',n:'Hofurteil',max:1,reset:'long'}]:[]) },
  { id:'tiefe', name:'✦ Stimme aus der Namenlosen Tiefe', desc:'Etwas unter dem Meer der Gedanken hat dich gehört – und antwortet. Seine Stimme ist leise, doch wer sie hört, vergisst sie nie.', spells:{3:['bane','silent-image','blindness-deafness','ray-of-enfeeblement'],5:['fear','sending'],7:['black-tentacles','phantasmal-killer'],9:['dream','contact-other-plane']}, feats:[
   [3,'Zauber der Tiefe','Immer vorbereitet: Verderben, Lautloses Trugbild, Blindheit/Taubheit, Schwächestrahl (ab 5: Furcht, Botschaft senden; ab 7: Schwarze Tentakel, Phantastischer Mörder; ab 9: Traum, Kontakt zu anderen Ebenen).'],
   [3,'Echo der Tiefe','Bonusaktion, CHA-Mod-mal pro langer Rast: Eine Kreatur in 18 m hört ein Flüstern – WEI-Rettungswurf oder Nachteil auf ihren nächsten Angriff, und du erfährst in einem Satz, was sie als Nächstes vorhat.'],
   [3,'Sprache der Tiefe','Du verstehst jede gesprochene Sprache (sprechen kannst du sie nicht).'],
   [6,'Riss im Geist','Verursachst du psychischen Schaden, kann das Ziel bis zum Beginn deines nächsten Zuges keine Reaktionen nutzen.'],
   [10,'Leere Augen','Immun gegen verängstigt. Versucht eine Kreatur, dich zu verängstigen, erleidet sie 2W8 psychischen Schaden.'],
   [14,'Ruf aus der Tiefe','Aktion, 1× pro langer Rast: Für 1 Minute öffnet sich ein 6-m-Spalt in 18 m; Kreaturen, die ihren Zug darin beginnen, machen einen STÄ-Rettungswurf oder sind festgesetzt und erleiden 3W6 psychischen Schaden.']],
   res:(l,c)=>[{k:'echo',n:'Echo der Tiefe',max:Math.max(1,c.mod.cha),reset:'long'}].concat(l>=14?[{k:'ruftiefe',n:'Ruf aus der Tiefe',max:1,reset:'long'}]:[]) } ],
 wiz:[
  { id:'schicksal', name:'✦ Schule der Schicksalsspuren', desc:'Für dich ist jeder Moment ein Gewebe aus Fäden. Du siehst, welche reissen werden – und manchmal ziehst du ein wenig daran.', feats:[
   [3,'Fadenlesen','Nach jeder langen Rast erhältst du INT-Mod Schicksalsfäden (mindestens 1). Reaktion: Eine Kreatur in 18 m addiert +1W4 zu einem W20-Wurf oder zieht 1W4 ab (nach dem Wurf, bevor das Ergebnis feststeht).'],
   [3,'Spurenkunde','Erkenntniszauber kopierst du in halber Zeit und für halbe Kosten in dein Zauberbuch.'],
   [6,'Vorahnung','Du kannst nicht überrascht werden, erhältst +2 auf Initiative und Vorteil auf Wahrnehmung gegen Hinterhalte.'],
   [10,'Verknoteter Faden','Deine Schicksalsfäden verwenden W8 statt W4.'],
   [14,'Schicksal schneiden','1× pro langer Rast, bevor eine Kreatur in 18 m einen W20 würfelt: Das Ergebnis ist eine natürliche 20 oder eine natürliche 1 – du entscheidest.']],
   res:(l,c)=>[{k:'faden',n:'Schicksalsfäden',max:Math.max(1,c.mod.int),reset:'long'}].concat(l>=14?[{k:'schneiden',n:'Schicksal schneiden',max:1,reset:'long'}]:[]) },
  { id:'spiegel', name:'✦ Schule des Spiegelwerks', desc:'Jeder Spiegel ist ein Fenster, und du hast gelernt hindurchzusehen. Deine Trugbilder werfen Licht – und schneiden wie Glas.', feats:[
   [3,'Spiegelscherbe','Spiegelbilder ist für dich immer vorbereitet und erzeugt ein zusätzliches Bild.'],
   [3,'Glanzlicht','Du lernst Kleine Illusion; deine Illusionen können helles Licht in 3 m ausstrahlen.'],
   [6,'Spiegelsplitter','Wird eines deiner Spiegelbilder zerstört, erleidet der Angreifer 2W6 Hiebschaden durch Scherben.'],
   [10,'Gespiegelte Magie','Reaktion, 1× pro langer Rast, wenn du Ziel eines Zaubers bis Grad 3 bist: Du machst den Rettungswurf mit Vorteil; gelingt er, trifft der Zauber stattdessen den Wirker.'],
   [14,'Spiegelsaal','Aktion, 1× pro langer Rast, 1 Minute (Konzentration): Ein 9-m-Würfel aus Spiegeln. Kreaturen deiner Wahl darin machen einen WEI-Rettungswurf oder sind verwirrt (Nachteil auf Angriffe, halbe Bewegung); Fernkampf- und Zauberangriffe in den Würfel haben Nachteil.']],
   spells:{3:['mirror-image','minor-illusion']}, res:(l)=>(l>=10?[{k:'gespiegelt',n:'Gespiegelte Magie',max:1,reset:'long'}]:[]).concat(l>=14?[{k:'spsaal',n:'Spiegelsaal',max:1,reset:'long'}]:[]) } ]
};
/* Unterklassen der eigenen Heldenbuch-Klassen */
const MORE_HB_SUBS = {
 rk:{ id:'stern', name:'Orden der Sternenschrift', desc:'Die ältesten Runen stehen nicht im Stein, sondern am Himmel. Du schreibst mit Sternenlicht – Zeichen, die schützen und das Kommende verraten.', grant:{3:['leit']}, feats:[
  [3,'Sternenschrift','Du kennst die Leitrune zusätzlich. Bonusaktion, ÜB-mal pro langer Rast: Ein Verbündeter in 18 m addiert 1 Runenwürfel zu seinem nächsten W20-Wurf.'],
  [6,'Vorzeichen','Du und Verbündete in 9 m könnt nicht überrascht werden und erhaltet +INT-Mod auf Initiative (mindestens +1).'],
  [10,'Schützender Sternenkreis','Aktion, 1× pro kurzer Rast: Ein 3-m-Kreis um dich leuchtet 1 Minute. Verbündete darin haben +2 RK und Vorteil auf Rettungswürfe gegen Zauber.'],
  [14,'Sternbahn','Aktivierst du eine Rune, darfst du dich zusätzlich bis 9 m an einen Ort teleportieren, den du sehen kannst.'],
  [18,'Himmelsrune','Aktion, 1× pro langer Rast: Ein Sternenregen in einer 9-m-Kugel in 36 m – GES-Rettungswurf, 10 Runenwürfel gleissender Schaden, bei Erfolg die Hälfte.']],
  res:(l,c)=>[{k:'sternschrift',n:'Sternenschrift',max:c.pb,reset:'long'}].concat(l>=10?[{k:'sternkreis',n:'Schützender Sternenkreis',max:1,reset:'short'}]:[]).concat(l>=18?[{k:'himmelsrune',n:'Himmelsrune',max:1,reset:'long'}]:[]) },
 bw:{ id:'dorn', name:'Bund der Dornenadern', desc:'Aus deinem Blut wachsen Dornen. Wo es zu Boden tropft, entsteht ein Feld, das jeden festhält, der dir zu nahe kommt.', grant:{3:['ausbluten']}, feats:[
  [3,'Dornensiegel','Bonusaktion, 1 Blutladung: Ein Blutsiegel in 18 m erschafft einen 3-m-Kreis aus Dornen (1 Minute). Er ist schwieriges Gelände; wer ihn betritt oder seinen Zug darin beginnt, erleidet 1 Blutwürfel Stichschaden. Du lernst den Blutritus Ausbluten zusätzlich.'],
  [6,'Dornenrüstung','Trifft dich eine Kreatur in 1,5 m im Nahkampf, erleidet sie Stichschaden in Höhe deines KON-Mods.'],
  [10,'Rankengriff','Kreaturen in deinen Dornensiegeln haben Nachteil auf Rettungswürfe gegen Aderbann und können keine Reaktionen nutzen.'],
  [14,'Dornenwall','Aktion, 2 Blutladungen: Eine Wand aus Blutdornen (9 m lang, 3 m hoch) in 18 m für 1 Minute; sie gibt Dreivierteldeckung, und wer sie durchquert, erleidet 3 Blutwürfel Stichschaden.'],
  [18,'Garten der Qualen','Aktion, 1× pro langer Rast: Alle deine Dornensiegel wachsen auf 6 m Radius; Kreaturen darin machen einen STÄ-Rettungswurf oder sind festgesetzt und erleiden 6 Blutwürfel Stichschaden.']],
  res:(l)=> l>=18?[{k:'garten',n:'Garten der Qualen',max:1,reset:'long'}]:[] },
 fk:{ id:'dornen', name:'Pfad der Schwarzdornen', desc:'Deine Flüche haben Widerhaken. Wer einmal gezeichnet ist, kommt nicht mehr los – und fremde Flüche prallen an dir ab.', grant:{3:['fesseln']}, feats:[
  [3,'Widerhaken','Du lernst Fluch der Fesseln zusätzlich (ab Stufe 3 statt 9). Löst du einen Fluch aus, kann das Ziel sich bis zum Ende seines nächsten Zuges nicht mehr als 3 m von dir entfernen.'],
  [6,'Gegenfluch','Reaktion, ÜB-mal pro langer Rast: Muss ein Verbündeter in 9 m einen Rettungswurf gegen einen Fluch oder Zauber machen, gibt er ihm Vorteil.'],
  [10,'Dornenkette','Fällt dein markiertes Ziel, erleiden Kreaturen deiner Wahl in 3 m davon 2 Fluchwürfel nekrotischen Schaden.'],
  [14,'Fluchbrecher','Du bist immun gegen Flüche. Berührst du eine verfluchte Kreatur (Aktion), endet ein Fluch auf ihr (1× pro kurzer Rast).'],
  [18,'Schwarzdorn-Krone','Bonusaktion, 1× pro langer Rast, 1 Minute: Du kannst bis zu drei Kreaturen gleichzeitig markieren, und jeder Fluch, den du auslöst, trifft alle markierten Ziele.']],
  res:(l,c)=>(l>=6?[{k:'gegenfluch',n:'Gegenfluch',max:c.pb,reset:'long'}]:[]).concat(l>=14?[{k:'fluchbrecher',n:'Fluchbrecher',max:1,reset:'short'}]:[]).concat(l>=18?[{k:'dornkrone',n:'Schwarzdorn-Krone',max:1,reset:'long'}]:[]) },
 ma:{ id:'schwarm', name:'Schwarmkonstrukteur', desc:'Warum eine Maschine bauen, wenn du hundert kleine bauen kannst? Deine Drohnen surren, kundschaften aus und stechen gemeinsam zu.', feats:[
  [3,'Drohnenschwarm','Nach einer langen Rast baust du INT-Mod + 1 Drohnen (mindestens 2; winzig, RK 14, 1 TP, Flug 9 m). Bonusaktion: Eine Drohne greift an (Fernkampf mit deinem Geräte-Angriff, 1W6 + INT Stich) oder späht aus (du siehst durch sie bis 36 m).'],
  [6,'Schutzschwarm','Reaktion, wenn ein Verbündeter in 9 m getroffen wird: Opfere eine Drohne – der Schaden sinkt um 1W10 + INT-Mod.'],
  [10,'Formation','Mit einer Bonusaktion greifen bis zu drei Drohnen an (je ein Angriff).'],
  [14,'Wartungsprotokoll','Bei einer kurzen Rast stellst du zerstörte Drohnen bis zur Hälfte deines Maximums wieder her; 1 Energiezelle stellt eine Drohne sofort her.'],
  [18,'Schwarmsturm','Aktion, 1× pro langer Rast: Alle Drohnen schwärmen in eine 6-m-Kugel in 36 m – GES-Rettungswurf, 2W6 Stichschaden pro Drohne (höchstens 10W6), bei Erfolg die Hälfte.']],
  res:(l,c)=>[{k:'drohnen',n:'Drohnen',max:Math.max(2,c.mod.int+1),reset:'long'}].concat(l>=18?[{k:'schwarmsturm',n:'Schwarmsturm',max:1,reset:'long'}]:[]) }
};
for (const [id, list] of Object.entries(MORE_SUBS)) { const C = CLASSES[id]; if (!C || !C.subs) continue; for (const sb of list) if (!C.subs.some((x) => x.id === sb.id)) C.subs.push(sb); }
for (const [id, sb] of Object.entries(MORE_HB_SUBS)) { const C = CLASSES[id]; if (C && C.subs && !C.subs.some((x) => x.id === sb.id)) C.subs.push(sb); }
