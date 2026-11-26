# Fablecrown

*Tabletop RPG Companion – bisher «Heldenbuch»*

**Herunterladen:** https://sicherungskontoeko-hash.github.io/heldenbuch/download.html (Android, iPhone, Windows, Mac, Linux, Browser)

Deutschsprachiger Begleiter fürs Rollenspiel am Tisch (Regeln nach SRD 5.2.1) mit Charaktererstellung, Bogen, Würfeln und gemeinsamem Online-Tisch. Gespielt wird am Tisch, Fablecrown hilft dabei.

Dieses Repository baut automatisch (siehe *Actions*):

- **Android-App** (`Fablecrown.apk`)
- **Windows** (Installer und portable EXE), **macOS** (DMG), **Linux** (AppImage)
- **Web-App** auf GitHub Pages – für iPhone/iPad über „Zum Home-Bildschirm“

**Web-App:** https://sicherungskontoeko-hash.github.io/heldenbuch/  
**Downloads:** https://github.com/sicherungskontoeko-hash/heldenbuch/releases/latest

Die fertigen Dateien liegen unter **Releases**. Die Anleitung steht in `ANLEITUNG.md`.

## Neuer Name: Fablecrown
- Die App heisst jetzt **Fablecrown** und hat ein neues Symbol (Krone mit Feder). Sprache, Regeln und Bedienung bleiben gleich.
- Helden, Sicherungen, Einstellungen und Online-Räume bleiben erhalten: Speicher, Raumcodes, Verschlüsselung, App-Kennung, Web-Adresse und der Datenordner der PC-App sind unverändert. Die Downloads heissen jetzt `Fablecrown.apk`, `Fablecrown-Setup.exe` usw.; für alte Links liegen sie übergangsweise auch unter den alten Namen bei. Auf dem Mac heisst das Programm neu «Fablecrown» (alte «Heldenbuch»-App danach löschen). Alte und neue Geräte spielen weiter am selben Tisch.
- Exporte heissen neu `<Held>_Fablecrown.json` und `Fablecrown_Sicherung.json`; ältere Heldenbuch-Dateien lassen sich weiterhin laden.

## Neu in Version 1.9
- **Helden aus D&D Beyond übernehmen:** Unter **Helden → Helden aus Datei laden** das Charakterbogen-PDF aus D&D Beyond wählen. Die App liest Klasse(n), Unterklasse, Spezies, Hintergrund, Attribute, Fertigkeiten mit Expertise, Rüstung, Waffen mit Meisterschaft, Zauber, Talente, Ausrüstung, Münzen, TP und die Texte zur Figur und gleicht RK, TP, Initiative und Bewegung an das PDF an. Was nicht im SRD steht (z. B. Oath of Vengeance, Heavy Armor Master, Zauber aus Erweiterungen, Homebrew-Schutzherren), legt der Import als **Hausregel nur auf deinem Gerät** an, mit dem Text aus deinem PDF – die öffentliche App bleibt beim freien SRD. Das PDF wird nur auf dem Gerät gelesen.
- **Neu aus dem SRD 5.1 (CC-BY-4.0):** Spezies **Halbelf** und **Halbork**, Kampfstile **Duellieren** (+2 Schaden, wird eingerechnet) und **Schützen**.
- **Bilder überall:** Alle 16 Klassen, 14 Spezies, 4 Hintergründe und 64 Unterklassen haben ein Bild, in der Auswahl und gross in der Infokarte (ⓘ). Alle 184 Kreaturen im Bestiarium, die 31 Kreaturen der beiden Abenteuer und alle Begleiter (Vertraute, Reittiere, Wildgefährten) haben ein Bild, auch am Tisch im Kampf. Beide Abenteuer haben ein Titelbild, die Hauptansichten ein Banner. Eigene Einträge (Monster, Hintergrund, Unterklasse, Begleiter) zeigen ein passendes Platzhalterbild.
- **Kampfseite am Handy kompakter:** Die Angriffe stehen ohne Scrollen im ersten Bildschirm, auch auf kleinen Handys. Kopf, Würfelmodus und Zugleiste sind flacher; «Zustände: keine» und die Heldeninspiration rücken hinter die Angriffe, solange nichts aktiv ist. Aktive Zustände, Konzentration und Todesrettungswürfe bleiben oben. Am PC ändert sich nichts.
- **Bestiarium am Handy:** Suche, Gruppenstufe und Fundorte stehen gleich unter einem schmalen Banner, danach «Begegnung planen», Zufallsbegegnung und eigene Monster, dann die Liste. Das erste Monster ist ohne Scrollen sichtbar.
- **Erschaffen am Handy:** Die Klassenkarten stehen im ersten Bildschirm. Die Schritte sind sieben Kreise in einer Zeile, der aktuelle Schritt steht im Banner («Schritt 2 von 7 · Herkunft»). Die Zusammenfassung ist eingeklappt eine Zeile mit Name, RK, TP, Initiative und ⚠-Anzahl.
- **Vor dem Spielabend geprüft:** Bei jedem Pull Request laufen die spielrelevanten Tests auch in Safari (WebKit, Linux und macOS) und Firefox, dazu ein echter Online-Tisch mit Laptop, iPhone und Android über beide öffentlichen Server. Alle Zauber und Monster, die es im SRD 5.2 gibt, werden automatisch mit dem SRD abgeglichen.
- **Herkunftstalent nach Regeln:** Jeder Hintergrund bringt sein festes Herkunftstalent mit (D&D 2024). Ein anderes Talent gibt es mit «Eigener Hintergrund» oder als Hausregel (Hausregeln › Regeloptionen). Weicht ein bestehender Held ab, zeigt der Bogen einen Hinweis mit «Zurücksetzen».
- **Neue Bilder:** Banner «Deine Helden» (Heldengruppe) und Halbork-Paar.
- **Stimmungen neu:** Neun neue, ruhigere Hintergrundszenen. Die Effekte sind sparsamer (weniger Glut, Funken, Schnee, Konfetti; Nebel am Boden; keine Herzen mehr), dazu ein langsamer Lichtschein. Am Handy zeichnet der Hintergrund höchstens rund 20 Bilder pro Sekunde, am PC rund 30; das schont den Akku. «Aus» und «reduzierte Bewegung» schalten alles ab.
- **Effekte einstellen:** Unter **Stimmung** gibt es jetzt «Effekte» (Aus, Dezent, Intensiv) und «Würfel» (Normal, Kurz, Aus), getrennt voneinander. Unter «Einzeln einstellen» stehen Leistung (Auto, Energiesparend, Ausgewogen, Maximal), natürliche 20 und 1, Hintergrund, Würfelgeräusche und Vibration. Neu sind ruhigere Grundwerte (Dezent). Wer vorher etwas eingestellt hatte, behält es. Vibration gibt es nur noch, wenn man sie einschaltet. Während Würfel rollen, pausiert der Hintergrund. Bei «Auto» schaltet ein überlastetes Gerät von selbst auf Energiesparend.
- **Korrigiert:** Eine natürliche 19 im erweiterten Kritbereich bekommt keinen Auftritt der natürlichen 20 mehr, sondern den Hinweis «erweiterter Bereich». In der Würfelschale gelten Höchst- und Tiefstwerte nicht mehr als Krit. Bei «Aus» erscheint auch kein Ersatz-Effekt mehr. Lautstärke 0 ist wirklich stumm.
- **Spielereignisse sichtbar:** Schaden und Heilung erscheinen kurz am TP-Feld als Zahl (−9, +5) mit gleitendem Balken. Ist die Schadensart bekannt, hat der Effekt ihre Farbe und Form, zum Beispiel Glut bei Feuer und Frost bei Kälte. Dazu kommen ein goldener Impuls beim eigenen Zug, Bernsteinlicht bei der kurzen und eine goldene Welle bei der langen Rast. Ausserdem gibt es Runen beim Stufenaufstieg, einen Stern bei Inspiration, einen aufleuchtenden Zauberplatz, ein erlöschendes Konzentrationssymbol, ein graues Wappen bei 0 TP und einen Impuls bei neuem Zustand. Alles ist kurz und lokal und unter «Schaden und Heilung» sowie «Zug, Rast, Stufe, Zustände» einstellbar. Rückgängig zeigt keinen Effekt.
- **Natürliche 20 und 1 am Würfel:** Die Effekte bleiben jetzt um den Würfel herum, statt den ganzen Bildschirm zu füllen. Bei der natürlichen 1 bebt nur noch das Würfelfeld. Jedes Set hat seine eigene Spur: Frostsplitter, Rauch, welke Blätter oder verblassende Farbe.
- **Ton:** Die Würfel klingen je Material verschieden, zum Beispiel Holz dumpf, Stahl hell und schwer, Kristall gläsern, Knochen trocken. Neu sind «Spielgeräusche» für Schaden, Heilung, Rast und Stufenaufstieg und «Hintergrundgeräusche» je Stimmung: Kaminknistern, Wind, eisige Böen, Grollen, eine leise Klangfläche oder trockener Wüstenwind. Beide sind standardmässig aus und haben eigene Schalter und eine eigene Lautstärke. Ton gibt es erst nach der ersten Berührung. Bei verstecktem Tab ist alles still. Es spielen höchstens acht Töne gleichzeitig.
- **Bedien-Animationen:** Kurze, ruhige Übergänge beim Öffnen von Dialogen und Menüs, beim Aufklappen, beim Wechsel von Bogen-Reiter oder Held, bei Meldungen und beim Drücken von Knöpfen. Beim Wechsel der Stimmung wird das Bild überblendet. Neuzeichnen ohne Wechsel bewegt nichts. Abschaltbar unter «Bedien-Animationen», aus bei «weniger Bewegung» im System.
- **Vorschau Artefaktwürfel:** Im Würfel-Fenster unter «Darstellung (Vorschau)» lässt sich «Artefakt» wählen. Vorerst gibt es das nur für den W20 in Weltenhain (Wurzeln und Blätter), Eisenwerk (Stahlbänder, Muttern, Zahnradkränze) und Arkanum (Goldfassung, freistehende Armillarringe mit Runen). Die Würfel werden echt dreidimensional gezeichnet (WebGL). Ohne WebGL oder bei einem Fehler zeigt die App die bisherigen Würfel. Grundeinstellung bleibt «Klassisch».
- **Bogen-Kopf am Handy flacher:** Die Banner-Karte im Bogen braucht zwischen 381 und 820 px kaum mehr Höhe als der Kopf ohne Karte; die erste Waffe steht wieder fast so hoch wie vor dem Banner.
- **Online-Tisch robuster:** Ein Handy, das neu beitritt, neu startet oder nach einem Funkloch zurückkommt, bittet alle Geräte, ihren Stand nochmals zu senden. So sind Mitspieler, Spielleitung und laufender Kampf sofort wieder da, auch wenn der öffentliche Server gespeicherte Nachrichten verliert.
- **Regeln nachgeführt:** Klingenbarriere, Treuer Hund, Himmlischen beschwören, Arkanes Schwert, Elementar beschwören, Verbannung, Rieseninsekt, Drache beschwören und Zustand «Versteinert» nach SRD 2024; Bewegungsraten von 22 Monstern (z. B. Gespenst, Schwarzbär, Hydra) nachgeführt.
- **Besser lesbar:** In allen Stimmungen erreichen Akzent- und Warnfarben den empfohlenen Kontrast, auch in «Blutig».
- **Sicherer gespeichert:** Eine Änderung kurz vor dem Schliessen geht beim nächsten Start nicht mehr verloren. Zwei offene Tabs überschreiben sich nicht mehr gegenseitig, und bei vollem Speicher erscheint statt «Gespeichert» die Warnung «Nicht gespeichert – bitte exportieren». Eine fehlerhafte Sicherungsdatei wird ganz abgewiesen, statt halb geladen zu werden.
- **Online-Tisch robuster:** Fremde Porträts, Namen und Kennungen werden geprüft und maskiert; ein kaputtes Spielerdokument blockiert die anderen nicht mehr. «Würfe nur bei der SL» sagt jetzt ehrlich, dass es eine Ausblendung ist und kein Schutz vor Mitspielern mit eigener Technik.
- **Regeln korrigiert:** Tiergestalt mit Gepackt oder Erschöpfung, Hinterhältiger Angriff nur mit Finesse- oder Fernkampfwaffe (nicht mit geworfener Handaxt), Kampfrausch beim waffenlosen Schlag, magischer Bonus beim Zusatzangriff mit der Zweitwaffe, Göttliche Gunst nur mit Waffen, Chromatische Kugel bei natürlicher 1 und kritischem Treffer, kein Zweihandgriff mit Schild, Bebende Handfläche (4 Fokuspunkte), Schlaf (Aufwecken).
- **Vorschau beim Teilen:** Wer den Download-Link per WhatsApp, Signal oder Teams schickt, sieht ein Vorschaubild mit Titel.
- Alle 64 Unterklassen haben einen kurzen Beschrieb.
- **Eigene Unterklasse:** Für Unterklassen ausserhalb des SRD eine «Eigene Unterklasse» mit Name und immer vorbereiteten Zaubern; die Merkmale stehen als Hausregel beim Helden.
- **Download für alle:** Eine Seite für alle Geräte, mit festen Links, die immer die neueste Version laden: https://sicherungskontoeko-hash.github.io/heldenbuch/download.html. Die Dateien heissen jetzt gleichbleibend (Heldenbuch.apk, Heldenbuch-Setup.exe, Heldenbuch-Portable.exe, Heldenbuch.dmg, Heldenbuch.AppImage), Apps und Release tragen dieselbe Versionsnummer 1.9.<Lauf>. Die PC-App meldet neue Versionen; die Android-App aktualisiert sich weiterhin selbst. Die Web-App-Veröffentlichung versucht es bei einer GitHub-Störung ein zweites Mal.
- **Spielstand für den nächsten Abend:** Am Ende sagst du Claude «Abend abschliessen». Claude speichert eine knappe Zusammenfassung des Abends und führt die Gesamtzusammenfassung der Kampagne nach, im Abenteuer selbst (Reiter **Spielstand** im Chronik-Fenster, enthalten in «Alles sichern»). Ein neuer Chat holt mit `lage` zuerst «Bisher» und dann nur, was seither neu ist. Ohne Claude: Abend selbst abschliessen, mit Entwurf aus der Chronik. Optional als Handout «Was bisher geschah» an die Spieler, als Datei sicherbar. Behoben: Hohe Fenster liessen sich auf kleinen Bildschirmen nicht scrollen.
- **Claude Desktop als Co-Spielleiter (PC-App):** Ein Knopf trägt das Heldenbuch als Connector (MCP) in Claude Desktop ein. Claude liest dann Lage, Kampf, Chronik, Personen und Aufträge selbst und kann für die Spielleitung Gegner hinzufügen und würfeln, Schaden und Zustände an Gegnern setzen, den nächsten Zug ausrufen, Personen/Orte/Aufträge pflegen, in die Chronik schreiben und Handouts schicken. Läuft über das Claude-Abo, ohne API-Kosten. Auf Tokens getrimmt: kurze Lage, danach nur Änderungen. Anleitung: ANLEITUNG.md, Abschnitt 4.
- **Personen, Orte und Aufträge** als Reiter im Chronik-Fenster (📜 Chronik): Name, ein Satz, geheime Notiz, Stand (verbündet/feindlich/tot, besucht, offen/erledigt/gescheitert). «Die Spieler wissen davon» zeigt den Eintrag am Tisch unter **Bekannt** (ohne geheime Notiz). Statuswechsel landen in der Chronik, alles fliesst in die Claude-Lage; mehrere Bücher (je Abenteuer oder Tisch) mit Buchwahl. «Alles sichern» enthält jetzt auch Chronik und Kampagnenbuch.
- **Lesbarkeit:** Kopfleiste, Reiter und untere Navigation sind deckend (nichts scheint mehr durch); auf dem Handy scrollt die Kopfleiste weg, damit mehr Platz bleibt. Rückgängig-Knöpfe erscheinen erst, wenn es etwas rückgängig zu machen gibt, und leuchten nach einer Änderung kurz auf statt einer schwebenden Leiste. Das Würfelfenster ist auf dem Handy ein schmaler Streifen, die Rückfrage nach dem Angriff zeigt den Wurf nicht mehr doppelt. Behoben: auf sehr schmalen Handys überlappte der Bewegungsknopf «Neuer Zug», Werte-Kärtchen und lange Völkernamen wurden abgeschnitten, die Würfelvorschau im Erschaffen war unsichtbar. Ein neuer Test prüft 9 Bildschirmgrössen und alle Ansichten darauf, dass nichts dauerhaft verdeckt oder abgeschnitten ist.
- **Stolperstein melden** (Menü ⋯ und Mehr): Was am Spielabend stört, hält die App mit Ort und Zeit fest; danach alle Einträge kopieren und Claude schicken. **Sicherung nach dem Spielabend:** Wurde seit der letzten Sicherung viel gewürfelt, fragt die App beim nächsten Start einmal nach. Die App bittet den Browser zudem um dauerhaften Speicher. Der Testserver «Mosquitto» ist aus der Server-Auswahl entfernt (nicht für den Betrieb gedacht); wer ihn gewählt hatte, landet automatisch auf HiveMQ. Die App-Dateien baut die automatische Veröffentlichung jetzt immer frisch aus den Quellen.
- **Abenteuerverfolgung:** Die **Chronik** der Spielleitung schreibt automatisch mit (Szenen, Handouts, Kämpfe mit Bilanz, Beute, Entscheidungen, Rasten, Helden am Boden, Stufenaufstiege, erledigte Ansagen), mit eigenen Notizen und Spielabenden; «✦ Was bisher geschah» macht mit Claude einen Rückblick zum Vorlesen. **Ansagen:** Spieler sagen am Tisch oder auf dem Bogen an, was ihr Held tut (tippen oder Tastatur-Mikrofon); die Spielleitung sieht sie oben, hakt ab oder schickt sie «An Claude». Chronik und offene Ansagen stehen in jeder Claude-Lage.
- **✦ Claude fragen** für die Spielleitung (Tisch, Abenteuer, Mehr): fasst Abenteuer-Szene, Gruppe mit TP, Kampf und letzte Würfe zusammen. In der claude.ai-Fassung antwortet Claude direkt (Antwort auch als Handout teilbar), in der App wird die Lage kopiert oder geteilt und in der Claude-App eingefügt.
- **Rückgängig und Wiederholen** fest am rechten Rand der Reiterleiste (↶ ↷, Strg+Z/Strg+Y), dazu **⟲ Zug zurückspulen** mit Vorschau aller Schritte seit Zugbeginn.
- **Spielleitung aufgeräumt:** Rast, Beute, Handout und Notizen zum Aufklappen (Zustand bleibt), Einladen eingeklappt sobald Spieler da sind, TP und RK der Helden direkt in der Initiative; Würfeltabellen der Spielleitung bleiben geheim; das Initiative-Fenster schliesst sich, sobald man auf dem Bogen würfelt.
- **Würfelverlauf** (Mehr → Würfelverlauf, Würfelfenster antippen, Würfelbecher oder «alle Würfe» beim Verlauf): jeder Wurf mit Würfeln und Boni – auch von Kreaturen und Mitspielern am Tisch –, nach Tagen gruppiert, filterbar, die letzten 200 bleiben auf dem Gerät. Auf dem Handy zeigt jede Rückfrage («Trifft das?») den zugehörigen Wurf; das Würfelfenster bleibt länger stehen.
- **Aufgeräumter Bogen** (nach den häufigsten Klagen über D&D Beyond): Statt sechs Wertekacheln über jedem Reiter eine schmale Kopfleiste mit TP, RK, Initiative, Bewegung, Konzentration und Zuständen, die beim Scrollen oben bleibt; TP antippen öffnet Schaden/Heilen. Kampfseite mit Schadenszaubertricks bei den Angriffen, Zauberplätzen bei den Ressourcen, waffenlosem Schlag am Ende und Wurfwaffen als Unterzeile. EP, Übungsbonus, passive Wahrnehmung und Trefferwürfel unter «Werte». Zustände ohne Eintrag als eine Zeile, lange Texte auch unten zuklappbar, «Alles» auch auf dem Handy, kompakte Heldenliste.
- **Hilfe-Stufe** (Mehr → Hilfen, Bogen ⋯ oder beim ersten Start): **Einsteiger** mit Kurzerklärungen, Zug-Leitfaden und Wurferklärung; **Standard** mit Zugleiste und ?-Knöpfen; **Erfahren** nur mit dem Bogen – die App zählt und sperrt dann keine Aktionen. Jeder Schalter lässt sich einzeln anpassen. Die Nachbessern-Leiste erscheint nur noch, wenn du etwas einsetzen kannst; sonst über ＋ im Würfelfenster.
- Neues eingebautes Abenteuer: „Das Wirtshaus zum letzten Krug“, ein lustiges Eintagesabenteuer für fünf Helden der Stufe 4 (Aufstieg auf 5 möglich), von etwa 14 bis 22 Uhr. Die Helden retten ihren Ziehvater und sein Wirtshaus: im Dungeon-Markt einkaufen, Hoflieferant werden und an der Königshochzeit ein Phönixei aus der Torte tauschen.
- Voller Klassiker der D&D-Szene: der furchtbare Pavillon, Leeroy Jenkins, Tuckers Kobolde, der Kopf des Vecna, der Rattensack, die Bauern-Kanone, „Ich greife die Dunkelheit an!“ und mehr, jeweils mit Hinweis für die Spielleitung.
- 75 eigene Gegenstände: Waffen, Rüstungen, Kuriositäten nach beliebten Ideen aus Foren und phantastische Fundstücke wie die Laterne der Sternenleere, die Splitter der Phönixschale oder der Zapfhahn des Letzten Krugs. Sie erscheinen nur in den Auswahllisten, solange das Abenteuer aktiv ist; Helden, die sie haben, behalten sie immer.
- Neue Kästen im Abenteuer: Rollenspiel-Notizen je Figur, Zähler mit + und − (Sternepunkte, Goblins, Verdacht, Hitze) und Zufallstabellen mit Würfelknopf.
- Reiter „Gegenstände“ im Abenteuer mit Fundort und „Geben“; unter „Kreaturen“ stehen jetzt auch die SRD-Monster des Abenteuers.
- Magische Gegenstände können die Initiative und die Bewegungsrate verändern.

## Neu in Version 1.8
- Abenteuer (Mehr → Abenteuer): fertige Abenteuer Kapitel für Kapitel leiten, mit farbigen Kästen für Vorlesetext, Spielleitung, Proben, Kämpfe, Beute und Entscheidungen.
- Eingebaut: „Die Machtader“, ein Eintagesabenteuer für fünf Helden (Stufe 3, 5 und 11) mit 18 Kreaturen, Figuren und allen Kämpfen.
- Ein Knopf je Aufgabe: Kampf beginnen (Gegner mit Initiative, Verstärkung wartet), Vorlesetext als Handout teilen, Beute ins Formular, Gegenstände vergeben.
- Entscheidungen der Gruppe festhalten; spätere Kapitel zeigen, was sie verändern. Fortschritt kommt mit „Alles sichern“ mit.
- Weitere Abenteuer lassen sich als Datei laden (wie eine Sicherung).

## Neu in Version 1.7.1
- Gesinnung: Auswahl der neun D&D-Gesinnungen als Raster, jede mit Erklärung, Beispiel und typischen Kreaturen; ⓘ im Charakterbogen. Ältere Einträge werden erkannt oder bleiben erhalten.

## Neu in Version 1.7
- Läuft spürbar runder: Hintergrund-Effekte brauchen nur noch einen Bruchteil der Rechenleistung, Zauberbuch und Bestiarium zeichnen nur, was sichtbar ist, der Spieltisch baut bei Meldungen der Mitspieler nur noch Geändertes neu, schnellerer Start.
- Beim ersten Start fragt die App nach deinem Namen; am Tisch sieht man, wer welchen Helden spielt.
- Kampfstart: Die Spielleitung wählt, wer mitkämpft – bei den Betroffenen erscheint gross „Kampf!“ mit dem Knopf „Initiative würfeln“. Die eigene Initiative übersteht Neuladen.
- Gegnerzug: Angriffe werden gezählt (Mehrfachangriff), „Zug beenden“ für Gegner; Monsterbilder im Bestiarium und am Tisch; Rettungswürfe der Monster aus dem SRD, Sammel-Rettungswurf mit Attribut.
- Tischhilfen: passive Werte der Gruppe für die Spielleitung, EP nach dem Kampf mit einem Tipp verteilen; „Rast für alle“ klappt auch, wenn die Spielleitung nicht mitspielt.
- Rund 200 magische Gegenstände aus dem SRD (gewöhnlich bis Artefakt, Einstimmung, Flüche) und 124 Ausrüstungsvorlagen mit Gewicht und Preis.
- Grosse Durchsicht aller Regeln und Texte (Klassen, Zauber, Monster, Gegenstände) nach SRD 5.2.1.

## Neu in Version 1.6.1
- Regelabgleich mit SRD 5.2.1: rund 100 Monster mit den Werten von 2024 (RK, TP, Angriffe, Mehrfachangriff, Odem), 12 fehlende SRD-Zauber ergänzt, Zauberklassen und halber Schaden bei gelungenem Rettungswurf korrigiert.

## Neu in Version 1.6
- Spielleitung: 🎲 Zufallsbegegnung (Fundort, Gruppe, Schwierigkeit), eigene Monster (Editor, Teilen/Laden), Beute nach Herausforderungsgrad, Aufladung (W6) und legendäre Aktionen/Widerstände bei Gegnern.
- Rettungswürfe: Zauber und Fähigkeiten fragen zuerst, ob der Rettungswurf gelang – dann voller, halber oder kein Schaden; Zustände (z. B. gelähmt) hängen am Zauber und enden mit ihm.
- Am Tisch: Zustand des Ziels, Deckung und Zusatzeffekte (z. B. „gepackt“) bei Gegnerangriffen; Schild, Unglaubliches Ausweichen, Entrinnen, Ausweichen.
- Aufgeräumt: Spielleitung kämpft nicht mit (ausser „Ich spiele selbst mit“), ein Knopf „+ Gegner“, Rast im ⋯-Menü, weniger doppelte Knöpfe.
- Zuverlässiger: Mehrgeräte-Fehler behoben (Geräte schrieben sich gegenseitig endlos an), Abfragen verdrängen sich nicht mehr, Ziel wird beim Auslösen festgehalten.
- „Alles sichern“: Helden, Hausregeln, eigene Monster, Begegnungen und SL-Notizen in einer Datei.

## Neu in Version 1.5
- Stufenaufstieg-Assistent: Aufstieg → „Das ist neu“ (Merkmale als Karten, vorher/nachher) → Entscheiden, mit Feier-Effekt.
- Kampf: Gegner würfeln erst den Angriff, die SL prüft den Treffer, dann Schaden; Schaden und Rettungswürfe werden an die Spieler zugestellt. Nachzügler („noch nicht dabei“), Verstärkung, Überraschung, neue Begegnung mit neuer Initiative, besiegte Gegner werden übersprungen, Packen/Stossen, Todesrettungswurf zu Zugbeginn.
- Bestiarium: 184 Kreaturen, nach typischem Fundort und Stufenempfehlung sortiert.
- Handy: Würfelbecher und ⚠ in der Kopfleiste, Menüs als Leiste von unten, nichts verdeckt mehr den Inhalt. Alle Helden lassen sich löschen.

## Neu in Version 1.4
- Würfel: räumliche Würfel (W4 bis W100) in 10 wählbaren Designs, jedes mit eigener Form und eigenem Auftritt bei der natürlichen 20; bei der 1 bebt der Bildschirm und reisst. Am Online-Tisch gehört jedes Set nur einem Helden, die anderen sehen deine Würfel in deinem Design. Effekte voll/ruhig/aus, Geräusche (optional).
- Aufgeräumtes Layout: rotes ⚠ mit offenen Punkten zum Aufklappen und Hinspringen, kompakte Übersicht am Handy, „⋯“-Menü auf dem Bogen, „Mehr“-Menü am PC.
- Name des Helden schon im ersten Schritt, auf dem Bogen antippbar.

## Neu in Version 1.3
- Die Android-App aktualisiert sich selbst: Sie holt neue Versionen von der Web-App und nutzt sie ab dem nächsten Öffnen (oder sofort über „Jetzt“). Eine neue APK ist nur noch für grössere Änderungen an der App selbst nötig.
- Helden bleiben dabei erhalten. Startet eine neue Version nicht sauber, nimmt die App automatisch wieder die eingebaute.

## Neu in Version 1.2
- Erklärkarten beim Erstellen: Ein kleines **i** rechts an Klasse, Unterklasse, Spezies, Hintergrund, Fertigkeiten, Zaubern und Waffen öffnet eine Karte mit Beschreibung, Werten und einem Knopf „Wählen“.
- Zu allen 355 Zaubern ein kurzer Text, wie man sich den Zauber vorstellt, dazu Zeitaufwand, Reichweite, Komponenten, Dauer, Wirkung und die Werte für deinen Helden.
- Kurze Erklärungen zu allen 18 Fertigkeiten und zu den Waffeneigenschaften.

## Neu in Version 1.1
- 16 Klassen und 64 Unterklassen (✦ = Eigenkreationen), Beschreibungen, Bilder für Klassen, Unterklassen, Spezies und Hintergründe, Kontexthilfe
- Regelkern nach D&D 2024: Aktionsökonomie im Kampf, 1 Zauberplatz pro Zug, einmal-pro-Zug-Schaden, Kampfrausch-Dauer, Waffenmeisterschaften, Tiergestalt, Zauberbuch für Rituale, Zielwahl mit Zuständen
- Regeloptionen (Hausregeln), Rückgängig, Rechenweg, Begegnungsplaner, Effekt-Tracker, Regelsuche
- Online-Tisch Ende-zu-Ende verschlüsselt; Spielstände mit Versionsmigration und automatischer Sicherung
- Automatisierte Tests im Ordner `quelle/tests` (`bash tests/run-all.sh`)

### Lizenz der Regeltexte

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Deutsche Kurzfassungen in eigenen Worten; mit ✦ markierte Inhalte sind eigene Erfindungen. Kein offizielles Produkt von Wizards of the Coast.
