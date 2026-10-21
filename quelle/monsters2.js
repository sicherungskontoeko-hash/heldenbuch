/* ==== Bestiarium II: weitere SRD-Kreaturen, typische Fundorte und Stufenempfehlung ====
   Werte nach dem SRD (deutsche Kurzfassung). Format wie BESTIARY: [Name, HG, RK, TP, TP-Würfel, Bewegung, Initiative, Angriffe, Merkmale] */
Object.assign(CR_XP, { '21': 33000, '22': 41000, '23': 50000, '24': 62000, '30': 155000 });
Object.assign(BESTIARY, {
 /* Stadt, Strasse & Lager */
 'tribal-warrior':['Stammeskrieger','1/8',12,11,'2W8+2','9 m',0,[['Speer',3,'1W6+1','Stich']],'Rudeltaktik: Vorteil, wenn ein Verbündeter neben dem Ziel steht.'],
 mastiff:['Dogge','1/8',12,5,'1W8+1','12 m',2,[['Biss',3,'1W6+1','Stich']],'Treffer wirft ein höchstens mittelgrosses Ziel um (STÄ SG 11).'],
 'swarm-of-rats':['Rattenschwarm','1/4',10,24,'7W8-7','9 m',0,[['Bisse',2,'2W6','Stich']],'Schwarm: nur 1W6 Schaden bei halben TP oder weniger. Resistenz gegen Wucht/Stich/Hieb.'],
 wererat:['Werratte','2',12,33,'6W8+6','9 m',2,[['Biss',4,'1W4+2','Stich'],['Kurzschwert',4,'1W6+2','Stich']],'Gestaltwandler. Biss kann mit Werratten-Lykanthropie anstecken.'],
 doppelganger:['Doppelgänger','3',14,52,'8W8+16','9 m',4,[['Hieb',6,'1W6+4','Wucht']],'Mehrfachangriff: zwei Hiebe. Gestaltwandler, liest Oberflächengedanken. Hinterhalt: +3W6 im ersten Zug.'],
 archmage:['Erzmagier','12',12,99,'18W8+18','9 m',2,[['Dolch',6,'1W4+2','Stich']],'Zauber bis Grad 9 (z. B. Kegel der Kälte 8W8, Zeitstopp). Magieresistenz: Vorteil auf Rettungswürfe gegen Zauber.'],
 /* Wald & Wildnis */
 panther:['Panther','1/4',12,13,'3W8','15 m',2,[['Biss',4,'1W6+2','Stich'],['Klaue',4,'1W4+2','Hieb']],'Anspringen: nach 6 m Anlauf STÄ SG 12 oder liegend.'],
 'giant-owl':['Rieseneule','1/4',12,19,'3W10+3','1,5 m, Fliegen 18 m',2,[['Krallen',3,'2W6+1','Hieb']],'Vorbeifliegen ohne Gelegenheitsangriffe. Scharfe Sinne.'],
 sprite:['Sprite','1/4',15,2,'1W4','3 m, Fliegen 12 m',4,[['Langschwert',2,'1','Hieb'],['Kurzbogen',6,'1','Stich']],'Pfeil: KON SG 10 oder vergiftet (bei 5+ verfehlt bewusstlos). Herzblick, Unsichtbarkeit.'],
 'awakened-tree':['Erweckter Baum','2',13,59,'7W12+14','6 m',-2,[['Schlag',6,'3W6+4','Wucht']],'Verwundbar gegen Feuer. Resistenz gegen Wucht und Stich. Wirkt reglos wie ein Baum.'],
 unicorn:['Einhorn','5',12,67,'9W10+18','15 m',2,[['Huf',7,'2W6+4','Wucht'],['Horn',7,'1W8+4','Stich']],'Heilende Berührung (3×/Tag 2W8+2), Teleport 18 m. Magieresistenz.'],
 treant:['Baumhirte','9',16,138,'12W12+60','9 m',-1,[['Schlag',10,'3W6+6','Wucht'],['Felsen',10,'4W10+6','Wucht']],'Mehrfachangriff: zwei Schläge. Belebt Bäume. Verwundbar gegen Feuer, doppelter Schaden an Gebäuden.'],
 /* Gebirge & Hügel */
 orc:['Ork','1/2',13,15,'2W8+6','9 m',1,[['Zweihandaxt',5,'1W12+3','Hieb'],['Wurfspeer',5,'1W6+3','Stich']],'Aggressiv: Bonusaktion bis zur Bewegungsrate auf einen Feind zu.'],
 'giant-goat':['Riesenziege','1/2',11,19,'3W10+3','12 m',0,[['Rammen',5,'2W4+3','Wucht']],'Sturmangriff: nach 6 m +2W4 und STÄ SG 13 oder liegend. Trittsicher.'],
 'white-wyrmling':['Weisser Drachennestling','2',16,32,'5W8+10','9 m, Fliegen 18 m, Schwimmen 9 m',0,[['Biss',4,'1W10+2','Stich + 1W4 Kälte']],'Kälteodem (Aufladung 5–6): 4,5-m-Kegel, KON SG 12, 5W8 Kälte (halb bei Erfolg).'],
 'green-wyrmling':['Grüner Drachennestling','2',17,38,'7W8+7','9 m, Fliegen 18 m, Schwimmen 9 m',1,[['Biss',4,'1W10+2','Stich + 1W4 Gift']],'Giftodem (Aufladung 5–6): 4,5-m-Kegel, KON SG 11, 6W6 Gift (halb bei Erfolg).'],
 'blue-wyrmling':['Blauer Drachennestling','3',17,52,'8W8+16','9 m, Graben 4,5 m, Fliegen 18 m',0,[['Biss',5,'1W10+3','Stich + 1W6 Blitz']],'Blitzodem (Aufladung 5–6): 9-m-Linie, GES SG 12, 4W10 Blitz (halb bei Erfolg).'],
 'young-white':['Junger weisser Drache','6',17,133,'14W10+56','12 m, Fliegen 24 m, Schwimmen 12 m',0,[['Biss',7,'2W10+4','Stich + 1W8 Kälte'],['Klaue',7,'2W6+4','Hieb']],'Mehrfachangriff: Biss + zwei Klauen. Kälteodem: 9-m-Kegel, KON SG 15, 10W8.'],
 'young-black':['Junger schwarzer Drache','7',18,127,'15W10+45','12 m, Fliegen 24 m, Schwimmen 12 m',2,[['Biss',7,'2W10+4','Stich + 1W8 Säure'],['Klaue',7,'2W6+4','Hieb']],'Mehrfachangriff: Biss + zwei Klauen. Säureodem: 9-m-Linie, GES SG 14, 11W8.'],
 'cloud-giant':['Wolkenriese','9',14,200,'16W12+96','12 m',0,[['Morgenstern',12,'3W8+8','Stich'],['Felsen',12,'4W10+8','Wucht']],'Mehrfachangriff: zwei Morgensterne. Zauber: Nebelwolke, Fliegen, Federfall.'],
 roc:['Roc','11',15,248,'16W20+80','6 m, Fliegen 36 m',0,[['Schnabel',13,'4W8+9','Stich'],['Krallen',13,'4W6+9','Hieb']],'Mehrfachangriff: Schnabel + Krallen. Krallen packen (SG 19) und tragen Beute fort.'],
 /* Höhlen & Unterreich */
 stirge:['Blutmücke','1/8',14,2,'1W4','3 m, Fliegen 12 m',3,[['Rüssel',5,'1W4+3','Stich']],'Saugt sich fest: 1W4+3 Blutverlust zu Beginn jedes Zuges, bis 10 TP gesaugt.'],
 'violet-fungus':['Violetter Pilz','1/4',5,18,'4W8','1,5 m',-5,[['Fäulnisberührung',2,'1W8','nekrotisch']],'Mehrfachangriff: 1W4 Berührungen. Wirkt wie ein gewöhnlicher Pilz.'],
 drow:['Drow','1/4',15,13,'3W8','9 m',2,[['Kurzschwert',4,'1W6+2','Stich'],['Handarmbrust',4,'1W6+2','Stich']],'Bolzen: KON SG 13 oder vergiftet (bei 5+ verfehlt bewusstlos). Feenahnen, Sonnenlichtempfindlich.'],
 darkmantle:['Dunkelmantel','1/2',11,22,'5W6+5','3 m, Fliegen 9 m',1,[['Zerquetschen',5,'1W6+3','Wucht']],'Hängt sich über den Kopf (blind, erstickt). Dunkelheitsaura 4,5 m (1×/Tag).'],
 'gray-ooze':['Graue Schlammmasse','1/2',8,22,'3W8+9','3 m, Klettern 3 m',-2,[['Scheinfuss',3,'1W6+1','Wucht + 2W6 Säure']],'Zersetzt Metall: nichtmagische Waffen und Rüstung verlieren an Wert.'],
 duergar:['Duergar','1',16,26,'4W8+8','7,5 m',0,[['Kriegspicke',4,'1W8+2','Stich'],['Wurfspeer',4,'1W6+2','Stich']],'Vergrössern und Unsichtbarkeit (je 1×/Rast). Sonnenlichtempfindlich.'],
 grick:['Grick','2',14,27,'6W8','9 m, Klettern 9 m',2,[['Tentakel',4,'2W6+2','Hieb'],['Schnabel',4,'1W6+2','Stich']],'Mehrfachangriff: Tentakel, bei Treffer zusätzlich Schnabel. Steintarnung.'],
 'gibbering-mouther':['Brabbelnder Schlund','2',9,67,'9W8+27','3 m, Schwimmen 3 m',-1,[['Bisse',2,'5W6','Stich']],'Wahnsinniges Gebrabbel: WEI SG 10 oder verwirrt. Lässt Boden zu Schlamm werden.'],
 'black-pudding':['Schwarzer Schlamm','4',7,85,'10W10+30','6 m, Klettern 6 m',-3,[['Scheinfuss',5,'1W6+3','Wucht + 4W8 Säure']],'Teilt sich bei Hieb- und Blitzschaden. Zersetzt Holz und Metall.'],
 roper:['Raffer','5',20,93,'11W10+33','3 m, Klettern 3 m',-1,[['Biss',7,'4W8+4','Stich'],['Fangarm',7,'zieht heran','—']],'Vier Fangarme ziehen 7,5 m heran und schwächen (Nachteil auf STÄ). Wirkt wie ein Stalagmit.'],
 /* Sumpf & Moor */
 'giant-frog':['Riesenfrosch','1/4',11,18,'4W8','9 m, Schwimmen 9 m',1,[['Biss',3,'1W6+1','Stich']],'Packt (SG 11) und verschluckt kleine Ziele. Springt 6 m weit.'],
 lizardfolk:['Echsenmensch','1/2',15,22,'4W8+4','9 m, Schwimmen 9 m',0,[['Biss',4,'1W6+2','Stich'],['Speer',4,'1W6+2','Stich']],'Mehrfachangriff: zwei Angriffe. Hält 15 Minuten die Luft an.'],
 'giant-toad':['Riesenkröte','1',11,39,'6W10+6','6 m, Schwimmen 12 m',1,[['Biss',4,'1W10+2','Stich + 1W10 Gift']],'Packt (SG 13) und verschluckt mittelgrosse Ziele: 3W6 Säure pro Zug.'],
 'giant-constrictor':['Riesenwürgeschlange','2',12,60,'8W12+8','9 m, Schwimmen 9 m',2,[['Biss',6,'2W6+4','Stich'],['Umschlingen',6,'2W8+4','Wucht']],'Umschlingen packt (SG 16): festgesetzt, jeden Zug erneut Schaden.'],
 'shambling-mound':['Schlurfender Hügel','5',15,136,'16W10+48','6 m, Schwimmen 6 m',-1,[['Hieb',7,'2W8+4','Wucht']],'Mehrfachangriff: zwei Hiebe, dann Verschlingen (2W8+4 pro Zug). Blitz heilt ihn.'],
 /* Gruft, Ruine & Friedhof */
 'crawling-claw':['Kriechende Klaue','0',12,2,'1W4','6 m, Klettern 6 m',2,[['Klaue',3,'1W4+1','Wucht oder Hieb']],'Untot. Immun gegen bezaubert und verängstigt.'],
 ghast:['Ghast','2',13,36,'8W8','9 m',3,[['Biss',3,'2W8+1','Stich'],['Klauen',5,'2W6+3','Hieb']],'Klauen: KON SG 10 oder gelähmt (1 Minute, nicht Elfen). Gestank: KON SG 10 oder vergiftet.'],
 'ogre-zombie':['Ogerzombie','2',8,85,'9W10+36','9 m',-2,[['Morgenstern',6,'2W8+4','Wucht']],'Untote Zähigkeit: Bei 0 TP KON-Wurf (SG 5 + Schaden), bei Erfolg 1 TP.'],
 'mummy-lord':['Mumienfürst','15',17,97,'13W8+39','6 m',0,[['Fäulnisfaust',9,'3W6+4','Wucht + 6W6 nekrotisch']],'Mehrfachangriff: Blick + Faust. Legendäre Aktionen. Zauber (Priester). Kehrt aus dem Herz zurück.'],
 lich:['Leichnam','21',17,135,'18W8+54','9 m',3,[['Lähmende Berührung',12,'3W6','Kälte']],'Zauber bis Grad 9. Legendäre Aktionen und Widerstand. Kehrt mit seinem Seelengefäss zurück.'],
 /* Küste & Gewässer */
 merfolk:['Meervolk','1/8',11,11,'2W8+2','3 m, Schwimmen 12 m',1,[['Speer',2,'1W6','Stich']],'Amphibisch.'],
 'giant-crab':['Riesenkrabbe','1/8',15,13,'3W8','9 m, Schwimmen 9 m',1,[['Schere',3,'1W6+1','Wucht']],'Schere packt (SG 11). Amphibisch.'],
 'reef-shark':['Riffhai','1/2',12,22,'4W8+4','Schwimmen 12 m',1,[['Biss',4,'1W8+2','Stich']],'Rudeltaktik. Wasseratmer.'],
 'giant-octopus':['Riesenkrake','1',11,52,'8W10+8','3 m, Schwimmen 18 m',1,[['Tentakel',5,'2W6+3','Wucht']],'Tentakel packt (SG 16). Tintenwolke zur Flucht.'],
 'hunter-shark':['Jagdhai','2',12,45,'6W10+12','Schwimmen 12 m',1,[['Biss',6,'2W8+4','Stich']],'Blutrausch: Vorteil gegen verletzte Ziele.'],
 'sea-hag':['Meervettel','2',14,52,'7W8+21','9 m, Schwimmen 12 m',1,[['Klauen',5,'2W6+3','Hieb']],'Schreckliche Erscheinung: WEI SG 11 oder verängstigt. Tödlicher Blick.'],
 plesiosaurus:['Plesiosaurus','2',13,68,'8W10+24','6 m, Schwimmen 12 m',2,[['Biss',6,'3W6+4','Stich']],'Hält 1 Stunde die Luft an.'],
 'water-elemental':['Wasserelementar','5',14,114,'12W10+48','9 m, Schwimmen 27 m',2,[['Hieb',7,'2W8+4','Wucht']],'Mehrfachangriff: zwei Hiebe. Überfluten: verschlingt Kreaturen (STÄ SG 15).'],
 /* Wüste & Ödland */
 jackal:['Schakal','0',12,3,'1W6','12 m',2,[['Biss',1,'1W4-1','Stich']],'Rudeltaktik. Scharfer Geruchs- und Gehörsinn.'],
 'dust-mephit':['Staubmephit','1/2',12,17,'5W6','9 m, Fliegen 9 m',2,[['Klauen',4,'1W4+2','Hieb']],'Blendender Atem: 4,5-m-Kegel, GES SG 10 oder blind. Explodiert beim Tod.'],
 lamia:['Lamia','4',13,97,'13W10+26','9 m',1,[['Klauen',5,'2W10+3','Hieb'],['Dolch',5,'1W4+3','Stich']],'Rauschende Berührung (Fluch: Nachteil auf WEI). Zauber: Verkleiden, Einflüsterung.'],
 'earth-elemental':['Erdelementar','5',17,126,'12W10+60','9 m, Graben 9 m',-1,[['Schlag',8,'2W8+5','Wucht']],'Mehrfachangriff: zwei Schläge. Gleitet durch Stein und Erde.'],
 'air-elemental':['Luftelementar','5',15,90,'12W10+24','Fliegen 27 m',5,[['Schlag',8,'2W8+5','Wucht']],'Mehrfachangriff: zwei Schläge. Wirbelwind: STÄ SG 13, 3W8+2 und weggeschleudert.'],
 'purple-worm':['Purpurwurm','15',18,247,'15W20+90','15 m, Graben 9 m',-2,[['Biss',14,'3W8+9','Stich'],['Schwanzstachel',14,'3W6+9','Stich + 12W6 Gift']],'Mehrfachangriff: Biss + Stachel. Verschlingt grosse Ziele (6W6 Säure pro Zug).'],
 /* Eis & Hoher Norden */
 'ice-mephit':['Eismephit','1/2',11,21,'6W6','9 m, Fliegen 9 m',1,[['Klauen',3,'1W4+1','Hieb + 1W4 Kälte']],'Frostatem: 4,5-m-Kegel, GES SG 10, 2W4 Kälte. Explodiert beim Tod in Eissplitter.'],
 'polar-bear':['Eisbär','2',12,42,'5W10+15','12 m, Schwimmen 9 m',0,[['Biss',7,'1W8+5','Stich'],['Klauen',7,'2W6+5','Hieb']],'Mehrfachangriff: Biss + Klauen.'],
 'winter-wolf':['Winterwolf','3',13,75,'10W10+20','15 m',1,[['Biss',6,'2W6+4','Stich']],'Kälteodem (Aufladung 5–6): 4,5-m-Kegel, GES SG 12, 4W8 Kälte. Rudeltaktik, Schneetarnung.'],
 remorhaz:['Remorhaz','11',17,195,'17W12+85','9 m, Graben 6 m',1,[['Biss',11,'6W10+7','Stich + 3W6 Feuer']],'Glühender Körper: Berührung 3W6 Feuer. Verschlingt Ziele (6W6 Säure pro Zug).'],
 /* Andere Ebenen */
 quasit:['Quasit','1',13,7,'3W4','12 m',3,[['Klauen',4,'1W4+3','Stich']],'Gift: KON SG 10, 2W4 und vergiftet. Gestaltwandel, Unsichtbarkeit, Schrecken.'],
 nightmare:['Nachtmahr','3',13,68,'8W10+24','18 m, Fliegen 27 m',2,[['Hufe',6,'2W8+4','Wucht + 2W6 Feuer']],'Ätherischer Schritt mit Reiter. Verleiht Licht 3 m.'],
 pegasus:['Pegasus','2',12,59,'7W10+21','18 m, Fliegen 27 m',2,[['Hufe',6,'2W6+4','Wucht']],'Himmlisch. Lässt sich als Reittier zähmen.'],
 couatl:['Couatl','4',19,97,'13W8+39','9 m, Fliegen 27 m',5,[['Biss',8,'1W6+5','Stich'],['Umschlingen',6,'2W6+3','Wucht']],'Biss: KON SG 13 oder vergiftet (24 h bewusstlos). Gestaltwandel, Zauber, Telepathie.'],
 succubus:['Sukkubus','4',15,66,'12W8+12','9 m, Fliegen 18 m',3,[['Klaue',5,'1W6+3','Hieb']],'Bezaubern (WEI SG 15), Lebensentzug durch Kuss (5W10+5 psychisch). Gestaltwandel.'],
 'barbed-devil':['Stachelteufel','5',15,110,'13W8+52','9 m',3,[['Klaue',6,'1W6+3','Stich'],['Schwanz',6,'2W6+3','Stich']],'Mehrfachangriff: zwei Klauen + Schwanz. Stachelhaut: 1W10 bei Packen. Schleudert Flammen.'],
 vrock:['Vrock','6',15,104,'11W10+44','12 m, Fliegen 18 m',1,[['Schnabel',6,'2W6+3','Stich'],['Krallen',6,'2W10+3','Hieb']],'Mehrfachangriff. Sporen (Gift) und betäubendes Kreischen (KON SG 14).'],
 hezrou:['Hezrou','8',16,136,'13W10+65','9 m',3,[['Biss',7,'2W10+4','Stich'],['Klaue',7,'2W6+4','Hieb']],'Mehrfachangriff: Biss + zwei Klauen. Gestank: KON SG 14 oder vergiftet.'],
 'bone-devil':['Knochenteufel','9',19,142,'15W10+60','12 m, Fliegen 12 m',3,[['Klaue',8,'1W8+4','Hieb'],['Stachel',8,'2W8+4','Stich + 5W6 Gift']],'Mehrfachangriff: zwei Klauen + Stachel. Teufelssicht, Magieresistenz.'],
 deva:['Deva','10',17,136,'16W8+64','9 m, Fliegen 27 m',4,[['Streitkolben',8,'1W6+4','Wucht + 4W8 gleissend']],'Mehrfachangriff: zwei Angriffe. Heilende Berührung, Gestaltwandel, Magieresistenz.'],
 djinni:['Dschinn','11',17,161,'14W10+84','9 m, Fliegen 27 m',2,[['Krummsäbel',9,'2W6+5','Hieb + 1W6 Blitz']],'Mehrfachangriff: drei Angriffe. Wirbelwind, Zauber (Wunsch für Befreier).'],
 efreeti:['Efriti','11',17,200,'16W10+112','12 m, Fliegen 18 m',1,[['Krummsäbel',10,'2W6+6','Hieb + 2W6 Feuer'],['Flammenstrahl',7,'5W6','Feuer']],'Mehrfachangriff: zwei Krummsäbel. Immun gegen Feuer. Zauber.'],
 balor:['Balor','19',19,262,'21W12+126','12 m, Fliegen 24 m',2,[['Langschwert',14,'3W8+8','Hieb + 3W8 Blitz'],['Flammenpeitsche',14,'2W6+8','Hieb + 3W6 Feuer']],'Feueraura 3W6. Todeskrampf: 20W6 Feuer im Umkreis von 9 m. Magieresistenz.'],
 'pit-fiend':['Grubenscheusal','20',19,300,'24W10+168','9 m, Fliegen 18 m',2,[['Streitkolben',14,'2W6+8','Wucht + 6W6 Feuer'],['Biss',14,'4W6+8','Stich + Gift']],'Mehrfachangriff: vier Angriffe. Furchtaura (WEI SG 21). Zauber: Feuerball, Festhalten.'],
 /* Magierturm & Verliese */
 homunculus:['Homunkulus','0',13,5,'2W4','6 m, Fliegen 12 m',2,[['Biss',4,'1','Stich']],'Biss: KON SG 10 oder vergiftet bzw. bewusstlos. Telepathische Bindung an den Schöpfer.'],
 'flying-sword':['Fliegendes Schwert','1/4',17,17,'5W6','Fliegen 15 m',2,[['Langschwert',3,'1W8+1','Hieb']],'Konstrukt. Wirkt reglos wie ein gewöhnliches Schwert.'],
 'animated-armor':['Belebte Rüstung','1',18,33,'6W8+6','7,5 m',0,[['Schlag',4,'1W6+2','Wucht']],'Mehrfachangriff: zwei Schläge. Konstrukt, wirkt wie eine leere Rüstung.'],
 'rug-of-smothering':['Erstickender Teppich','2',12,33,'6W10','3 m',2,[['Ersticken',5,'2W6+3','Wucht']],'Hüllt das Ziel ein (gepackt, blind, erstickt). Schaden wird geteilt.'],
 'shield-guardian':['Schildwächter','7',17,142,'15W10+60','9 m',-1,[['Faust',7,'2W6+4','Wucht']],'Mehrfachangriff: zwei Fäuste. Schützt seinen Träger (Schaden geteilt), speichert einen Zauber.'],
 'clay-golem':['Lehmgolem','9',14,133,'14W10+56','6 m',-1,[['Schlag',8,'2W10+5','Wucht']],'Mehrfachangriff: zwei Schläge, senken das TP-Maximum. Säure heilt ihn. Hast (Aufladung).'],
 'stone-golem':['Steingolem','10',17,178,'17W10+85','9 m',-1,[['Schlag',10,'3W8+6','Wucht']],'Mehrfachangriff: zwei Schläge. Verlangsamen (Aufladung, WEI SG 17). Magieresistenz.'],
 'iron-golem':['Eisengolem','16',20,210,'20W10+100','9 m',-1,[['Schlag',13,'3W8+7','Wucht'],['Schwert',13,'3W10+7','Hieb']],'Giftodem (Aufladung 6): 4,5-m-Kegel, 10W8 Gift. Feuer heilt ihn. Magieresistenz.']
});

/* ---- Typische Fundorte (erster = Hauptfundort) ---- */
const HABITATS = { stadt: 'Stadt, Strasse & Lager', wald: 'Wald & Wildnis', gebirge: 'Gebirge & Hügel', hoehle: 'Höhlen & Unterreich', sumpf: 'Sumpf & Moor', gruft: 'Gruft, Ruine & Friedhof', kueste: 'Küste & Gewässer', wueste: 'Wüste & Ödland', eis: 'Eis & Hoher Norden', ebenen: 'Andere Ebenen', arkan: 'Magierturm & Verliese' };
const MOB_HAB = {
 bandit: 'stadt wald', 'bandit-captain': 'stadt wald', cultist: 'stadt gruft', 'cult-fanatic': 'stadt gruft', guard: 'stadt', thug: 'stadt', veteran: 'stadt', knight: 'stadt', priest: 'stadt', mage: 'stadt arkan', assassin: 'stadt', commoner: 'stadt', noble: 'stadt', acolyte: 'stadt', scout: 'wald stadt', spy: 'stadt', berserker: 'gebirge eis', druid: 'wald', gladiator: 'stadt', 'tribal-warrior': 'wald wueste', mastiff: 'stadt', 'swarm-of-rats': 'stadt hoehle', wererat: 'stadt hoehle', doppelganger: 'stadt', archmage: 'arkan stadt',
 goblin: 'wald hoehle', 'goblin-boss': 'wald hoehle', hobgoblin: 'gebirge wald', kobold: 'hoehle gebirge', gnoll: 'wueste wald', bugbear: 'wald hoehle', orc: 'gebirge wald', ogre: 'gebirge wald', minotaur: 'hoehle gruft', troll: 'gebirge sumpf', 'hill-giant': 'gebirge', 'stone-giant': 'gebirge hoehle', 'frost-giant': 'eis gebirge', 'fire-giant': 'gebirge ebenen', ettin: 'gebirge hoehle', 'cloud-giant': 'gebirge',
 skeleton: 'gruft', zombie: 'gruft', ghoul: 'gruft', shadow: 'gruft', wight: 'gruft', ghost: 'gruft', mummy: 'gruft wueste', 'vampire-spawn': 'gruft stadt', vampire: 'gruft', banshee: 'gruft wald', specter: 'gruft', wraith: 'gruft', 'crawling-claw': 'gruft', ghast: 'gruft', 'ogre-zombie': 'gruft', 'mummy-lord': 'gruft wueste', lich: 'gruft arkan',
 wolf: 'wald gebirge', 'dire-wolf': 'wald gebirge', 'giant-rat': 'stadt hoehle', boar: 'wald', 'brown-bear': 'wald gebirge', 'black-bear': 'wald', 'giant-spider': 'wald hoehle', owlbear: 'wald', werewolf: 'wald', panther: 'wald', 'giant-owl': 'wald', sprite: 'wald', 'awakened-tree': 'wald', unicorn: 'wald', treant: 'wald', dryad: 'wald', satyr: 'wald', centaur: 'wald', 'green-hag': 'wald sumpf', 'will-o-wisp': 'sumpf gruft', harpy: 'kueste gebirge', lion: 'wueste wald', 'giant-eagle': 'gebirge', griffon: 'gebirge', hippogriff: 'gebirge', manticore: 'gebirge wueste', chimera: 'gebirge', wyvern: 'gebirge', 'giant-goat': 'gebirge', roc: 'gebirge kueste',
 basilisk: 'hoehle gebirge', mimic: 'hoehle arkan gruft', 'gelatinous-cube': 'hoehle gruft', 'rust-monster': 'hoehle', 'ochre-jelly': 'hoehle', ankheg: 'wald wueste', otyugh: 'stadt hoehle', 'giant-scorpion': 'wueste', stirge: 'hoehle sumpf', 'violet-fungus': 'hoehle', drow: 'hoehle', darkmantle: 'hoehle', 'gray-ooze': 'hoehle', duergar: 'hoehle', grick: 'hoehle', 'gibbering-mouther': 'hoehle', 'black-pudding': 'hoehle gruft', roper: 'hoehle',
 crocodile: 'sumpf kueste', 'giant-frog': 'sumpf', lizardfolk: 'sumpf', 'giant-toad': 'sumpf', 'giant-constrictor': 'sumpf wald', 'shambling-mound': 'sumpf', 'black-wyrmling': 'sumpf', 'young-black': 'sumpf', 'green-wyrmling': 'wald', 'night-hag': 'sumpf ebenen',
 sahuagin: 'kueste', merfolk: 'kueste', 'giant-crab': 'kueste', 'reef-shark': 'kueste', 'giant-octopus': 'kueste', 'hunter-shark': 'kueste', 'sea-hag': 'kueste sumpf', plesiosaurus: 'kueste', 'water-elemental': 'kueste ebenen',
 jackal: 'wueste', 'dust-mephit': 'wueste ebenen', lamia: 'wueste', 'blue-wyrmling': 'wueste', 'earth-elemental': 'wueste ebenen hoehle', 'air-elemental': 'wueste ebenen gebirge', 'purple-worm': 'wueste hoehle', medusa: 'wueste gruft', hydra: 'sumpf kueste',
 mammoth: 'eis', 'ice-mephit': 'eis ebenen', 'polar-bear': 'eis', 'winter-wolf': 'eis', remorhaz: 'eis', 'white-wyrmling': 'eis', 'young-white': 'eis',
 imp: 'ebenen stadt', 'hell-hound': 'ebenen gebirge', 'fire-elemental': 'ebenen gebirge', quasit: 'ebenen', nightmare: 'ebenen', pegasus: 'ebenen gebirge', couatl: 'ebenen wald', succubus: 'ebenen stadt', 'barbed-devil': 'ebenen', vrock: 'ebenen', hezrou: 'ebenen', 'bone-devil': 'ebenen', deva: 'ebenen', djinni: 'ebenen wueste', efreeti: 'ebenen wueste', balor: 'ebenen', 'pit-fiend': 'ebenen',
 'red-wyrmling': 'gebirge', 'young-red': 'gebirge', 'adult-red': 'gebirge', gargoyle: 'gruft stadt', 'flesh-golem': 'arkan', homunculus: 'arkan', 'flying-sword': 'arkan gruft', 'animated-armor': 'arkan gruft', 'rug-of-smothering': 'arkan', 'shield-guardian': 'arkan', 'clay-golem': 'arkan', 'stone-golem': 'arkan gruft', 'iron-golem': 'arkan',
 'x-schlund': 'hoehle', 'x-aschewurm': 'gebirge', 'x-nebelspinne': 'wald', 'x-glockenkraehe': 'stadt gruft', 'x-moosriese': 'wald sumpf', 'x-spiegelwicht': 'arkan', 'x-knochenharfner': 'gruft', 'x-sumpflaterne': 'sumpf', 'x-eisenmotte': 'hoehle arkan', 'x-schattenhund': 'gruft wald', 'x-kristallkrabbe': 'kueste hoehle', 'x-runenwaechter': 'arkan gruft', 'x-aderfuerst': 'gruft stadt'
};
const mobHab = (k) => (MOB_HAB[k] || 'wald').split(' ');

/* Empfehlung für eine Gruppe von 4 Helden: Stufen, für die eine Kreatur allein eine niedrige bis hohe Begegnung ist; schwache Kreaturen als Schar */
function mobRec(cr) {
  const x = CR_XP[cr] || 0; if (!x) return { txt: '–', lo: 1, hi: 1 };
  const P = 4; let lo = 0, hi = 0;
  for (let L = 1; L <= 20; L++) { const b = XP_BUDGET[L]; if (x >= P * b[0] * 0.75 && x <= P * b[2]) { if (!lo) lo = L; hi = L; } }
  if (!lo) { if (x < P * XP_BUDGET[1][0]) { const n1 = Math.max(2, Math.ceil((P * XP_BUDGET[1][0]) / x)), n2 = Math.max(n1, Math.round((P * XP_BUDGET[1][1]) / x)); if (n1 > 12) return { txt: 'Kanonenfutter · Stufe 1', lo: 1, hi: 1, swarm: 12 }; return { txt: 'Gruppe ×' + n1 + (n2 > n1 ? '–' + Math.min(12, n2) : '') + ' · Stufe 1', lo: 1, hi: 2, swarm: n1 }; } return { txt: 'Stufe 20+', lo: 20, hi: 20 }; }
  return { txt: 'Stufe ' + lo + (hi > lo ? '–' + hi : ''), lo, hi };
}
function mobFits(cr, L) { const r = mobRec(cr); return L >= r.lo && L <= r.hi + (r.swarm ? 1 : 0); }

/* ---- Bestiarium-Ansicht: nach Fundort, darin nach Stufenempfehlung ---- */
function bestiaryView() {
  const q = (S.mq || '').toLowerCase(); const hab = S.mhab || ''; const ch = cur(); const L = +S.mlv || 0;
  const all = Object.entries(BESTIARY).filter(([k, m]) => (!q || m[0].toLowerCase().includes(q)) && (!hab || mobHab(k).includes(hab)) && (!L || mobFits(m[1], L)));
  const byCr = (a, b) => crNum(a[1][1]) - crNum(b[1][1]) || a[1][0].localeCompare(b[1][0], 'de');
  const groups = hab ? [[hab, all.sort(byCr)]] : Object.keys(HABITATS).map((h) => [h, all.filter(([k]) => mobHab(k)[0] === h).sort(byCr)]).filter(([, l]) => l.length);
  const card = ([k, m]) => { const r = mobRec(m[1]); return '<details class="mob"><summary><b>' + esc(m[0]) + '</b><span class="mrec">' + r.txt + '</span><small>HG ' + m[1] + ' · ' + (CR_XP[m[1]] || 0) + ' EP · RK ' + m[2] + ' · TP ' + m[3] + ' · ' + esc(m[5]) + '</small></summary><div class="atks">' + m[7].map((a) => '<div class="atk"><div class="an"><b>' + esc(a[0]) + '</b><small>' + esc(a[3]) + '</small></div><button class="rb" data-act="xroll" data-atk="1" data-mod="' + a[1] + '" data-label="' + esc(m[0]) + ': ' + esc(a[0]) + '">' + sgn(a[1]) + '</button>' + (/W/.test(a[2]) ? '<button class="rb dmgb" data-act="dmg" data-expr="' + esc(a[2].replace(/−/g, '-')) + '" data-label="' + esc(m[0]) + ': ' + esc(a[0]) + ' Schaden">' + esc(a[2]) + '</button>' : '<span class="rb dmgb">' + esc(a[2]) + '</span>') + '</div>').join('') + '</div>' + (m[8] ? '<p>' + esc(m[8]) + '</p>' : '') + '<p class="hint">Fundorte: ' + mobHab(k).map((h) => HABITATS[h]).join(', ') + '</p></details>'; };
  return '<div class="hero-intro banner" style="' + bannerStyle('drache') + '"><h1>Bestiarium</h1><p>Sortiert nach typischem Fundort, darin nach Stärke. Die Empfehlung gilt für eine Gruppe von vier Helden – so wird ein spontaner Kampf weder unlogisch noch zu übel.</p><button class="btn" data-act="encOpen">Begegnung planen</button></div>' +
    '<section class="blk"><h2>Bestiarium <small>' + Object.keys(BESTIARY).length + ' Kreaturen</small></h2>' +
    '<div class="row">' + field('Suchen', '<input type="text" id="mq" value="' + esc(S.mq || '') + '" placeholder="z. B. Goblin">') + field('Passend für Gruppenstufe', '<select id="mlv"><option value="">alle Stufen</option>' + Array.from({ length: 20 }, (_, i) => i + 1).map((l) => '<option value="' + l + '"' + (L === l ? ' selected' : '') + '>Stufe ' + l + (ch && derive(ch, S.hb).level === l ? ' (dein Held)' : '') + '</option>').join('') + '</select>') + '</div>' +
    '<div class="chips mhabs">' + chip(!hab, 'Alle Fundorte', 'data-act="mHab" data-arg=""') + Object.entries(HABITATS).map(([k, l]) => chip(hab === k, l, 'data-act="mHab" data-arg="' + k + '"')).join('') + '</div>' +
    (groups.length ? groups.map(([h, l]) => '<h3 class="mhab">' + esc(HABITATS[h]) + ' <small>' + l.length + '</small></h3><div class="mobs">' + l.map(card).join('') + '</div>').join('') : '<p class="empty">Keine Kreatur passt zu diesem Filter.</p>') + '</section>';
}
function bestiaryAdder() {
  const L = (() => { try { return derive(cur(), S.hb).level; } catch (e) { return 0; } })();
  const opts = Object.keys(HABITATS).map((h) => { const l = Object.entries(BESTIARY).filter(([k]) => mobHab(k)[0] === h).sort((a, b) => crNum(a[1][1]) - crNum(b[1][1])); return l.length ? '<optgroup label="' + esc(HABITATS[h]) + '">' + l.map(([k, m]) => '<option value="' + k + '">' + esc(m[0]) + ' · HG ' + m[1] + ' · ' + mobRec(m[1]).txt + '</option>').join('') + '</optgroup>' : ''; }).join('');
  return '<div class="fgrp"><b>Aus dem Bestiarium</b><div class="chips"><select id="mobSel" aria-label="Monster"><option value="">— Monster wählen —</option>' + opts + '</select><input type="number" id="mobN" value="1" min="1" max="12" aria-label="Anzahl"><label class="chk"><input type="checkbox" id="mobRoll"> TP würfeln</label><label class="chk"><input type="checkbox" id="mobGrp" checked> gemeinsame Initiative</label><label class="chk" title="Nachteil auf den Initiativewurf"><input type="checkbox" id="mobSur"> überrascht</label><label class="chk" title="Kommt erst später dazu, z. B. als Verstärkung"><input type="checkbox" id="mobRes"> als Verstärkung bereithalten</label><button class="btn ghost sm" data-act="mobAdd">Hinzufügen</button></div></div>';
}
XA.mHab = (t, a) => { S.mhab = a; render(); };
document.addEventListener('change', (ev) => { if (ev.target && ev.target.id === 'mlv') { S.mlv = ev.target.value; render(); } });

XA.mobAdd = () => { const id = $('#mobSel').value; if (!BESTIARY[id]) return; const n = Math.max(1, Math.min(12, +$('#mobN').value || 1)); encInsert([{ mid: id, n }], '', { rollHp: $('#mobRoll').checked, groupInit: ($('#mobGrp') || {}).checked, reserve: ($('#mobRes') || {}).checked, surprised: ($('#mobSur') || {}).checked }); };
