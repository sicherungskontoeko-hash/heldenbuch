# Heldenbuch – Quellcode

Deutschsprachiger D&D-5e-Charakterbogen und Spieltisch als eine einzige HTML-Datei.
Regelgrundlage: **D&D 2024 / SRD 5.2 (CC-BY-4.0)**. Mit ✦ markierte Inhalte sind eigene Erfindungen (Hausregeln).
Inhalte aus dem Spielerhandbuch 2024, die nicht im SRD stehen, sind als „PHB“ gekennzeichnet.
Sprache: Schweizer Hochdeutsch (ss statt ß).

## Bauen
```
bash build.sh          # erzeugt index.html (prüft Vollständigkeit und Syntax, bricht bei Fehlern ab)
python3 build_app.py   # optional: App-Version (PWA) in app/www
```
`build.sh` läuft aus jedem Verzeichnis, nutzt nur relative Pfade und braucht `node` für die Syntaxprüfung.

## Tests
```
npm install                 # Playwright 1.56.0, aedes, websocket-stream (siehe package-lock.json)
bash tests/run-all.sh       # alle Suiten, Protokoll in tests/RESULTS.md
```
| Suite | Inhalt |
|---|---|
| tests/rules.test.js | Regeltests mit festen Sollwerten |
| tests/hb.test.js | Regressionen HB-01–HB-11 (auch gegen eine alte Version ausführbar: `node tests/hb.test.js alt.html`) |
| tests/audit2.test.js | Regressionen Kritischer Audit A01–A06 |
| tests/cases.test.js | Import/Migration/Speicher-Robustheit, Sonderfälle pro Spezies/Klasse |
| tests/info.test.js | Erklärkarten (ⓘ) im Heldenbau: öffnen, Inhalt, Wählen/Abwählen, gesperrte Auswahl, Handy und PC |
| tests/mobpics.test.js | Kreaturen- und Begleiterbilder: jeder Bestiarium-Eintrag, jede Abenteuer-Kreatur und jeder Begleiter hat ein Bild; Platzhalter für eigene Monster; Bestiarium, Kampf und Bogen |
| tests/subpics.test.js | Unterklassen-Bilder: jede Unterklasse hat ein Bild, Auswahl und Infokarte, Handy 320 px ohne Querscrollen |
| tests/m01.test.js | Kampfseite am Handy (Redesign M01): erste Waffe bei 320/360/390/430 px im ersten Bildschirm (Grenzwerte aus HB-UI-REDESIGN v1.2.0), PC unverändert, Zustände/Konzentration/0 TP stehen über den Angriffen, alle Bedienelemente des Kampfreiters wirken (Modus, Rast-Menü, Zugleiste, Bewegung, Neuer Zug, Inspiration, Zustand, Schaden, Rückgängig) |
| tests/m03.test.js | Bestiarium am Handy (Redesign M03): Suchfeld und erstes Monster im ersten Bildschirm (Grenzwerte aus HB-UI-REDESIGN v1.2.0), Banner ≤ 96 px, Reihenfolge Suche → Fundorte → Knöpfe → Liste, keine abgeschnittenen Knöpfe; Suche, Gruppenstufe, Fundort, Werteblock, Planer, Zufallsbegegnung, eigenes Monster wirken; Einsteiger sieht die Erklärung |
| tests/m02.test.js | Erschaffen am Handy (Redesign M02): erste Klassenkarte im ersten Bildschirm (Grenzwerte aus HB-UI-REDESIGN v1.2.0), Zusammenfassung eingeklappt ≤ 60 px mit ⚠-Anzahl, alle sieben Schritte ohne Wischen sichtbar, PC unverändert; Schrittwechsel, Weiter, Name, Klasse, Infokarte, Auf-/Zuklappen, ⚠-Liste und Sprung, Daten bleiben erhalten |
| tests/gross.test.js | Grosstest: alle Ansichten, alle Bogen-Reiter, alle Erstellungsschritte (Zusammenfassung offen und zu), alle 16 Klassen auf Stufe 1/5/11/20 und ein Mehrklassen-Held, Zustände und 0 TP, Infokarten, Tisch als Spielleitung und Spieler im Kampf, beide Abenteuer mit allen Kapiteln und Szenen, alle neun Stimmungen, Hilfe-Stufen, Fenster – auf 320, 390, 768 und 1280 px. Je Bildschirm: keine Skript- oder Konsolenfehler, kein Querscrollen, kein «undefined»/«NaN»/«ß» im Text, keine kaputten Attribute, keine doppelten IDs, jeder Knopf mit Namen, jedes Bild mit alt und geladen, jedes Feld beschriftet. `--schnell`: nur 390 und 1280 |
| tests/klick.test.js | Klick-Fuzz: jeder sichtbare Knopf mit data-act in 37 Szenen (Ansichten, Reiter, Schritte, Tisch, Abenteuer, Mehr-Menü) einzeln angetippt, jedes Mal vom gleichen Ausgangszustand; keine Skriptfehler, Ansicht bleibt bedienbar, kein Held verschwindet. `--schnell`: nur 390 px |
| tests/daten.test.js | «Alles sichern» → löschen → laden mit 49 Helden: identische Werte und Spielstände, Extras zurück; Neustart; alte Sicherung ohne neue Felder; kaputte Dateien abgewiesen; 5600 Kombinationen Spezies × Hintergrund × Klasse × Stufe plausibel |
| tests/zauber.test.js | Jeden Zauber jeder zauberkundigen Klasse auf Stufe 20 einmal wirken (über 900), Folgefenster beantworten; keine Fehler, kein «undefined»/«NaN», keine negativen Zauberplätze |
| tests/affe.test.js | Lange Zufallssitzung ohne Zurücksetzen (Startwert fest): Klicks, Ansichtswechsel, Zahlen, Escape; nach jedem Schritt Fehler, Text, TP-Grenzen, Zauberplätze und Ressourcen geprüft. `--schritte=N` |
| tests/befunde.test.js | Befunde B-01–B-20 des unabhängigen Grosstests v1.9.40: Neustart vor dem verzögerten Schreiben (Änderung und Löschung), voller Speicher, zwei Tabs, Import erst prüfen, SL-Notiz beim richtigen Raum, Maskierung (Unterklassenname, Porträt, Kennungen), Abenteuer-Blockprüfung, Spielerdokumente vom Tisch, sieben Regelfälle mit fixierten Würfeln |
| tests/kontrast.test.js | Lesbarkeit: Text- und Akzentfarben aller Stimmungen erreichen 4,5:1 auf allen Flächen (Textfassungen `--gold-t`, `--wine-t` werden in theme.js berechnet) |
| tests/stimmung.test.js | Stimmungen und Hintergrund-Effekte: 20 Wechsel ohne doppelte Ebenen oder Schleifen, Zeichenrate Handy ≤ ~20/s und PC ≤ ~30/s, Würfel-Teilchen schneller, «Dezent», «Aus» und reduzierte Bewegung; mit `--alt=<datei>` Vergleich der Rechenzeit (Diagnose) |
| tests/vfx.test.js | Effekte-Einstellungen (vfx.js): neue Grundwerte, Übernahme der alten Schalter (auch ausdrückliches Aus), Würfel und Hintergrund getrennt, Würfel Normal/Kurz/Aus, reduzierte Bewegung, natürliche 20/1 getrennt vom Regel-Krit, Krit «Aus» ohne Ersatz-Effekt, Würfelschale ohne Krit-Markierung, Vibration nur mit Einwilligung, kein Regel-Zufall in Animationen, Hintergrund-Pause, Auto-Leistung, Lautstärke 0, Einstellungsfenster |
| tests/ereignis.test.js | Spielereignisse (vfxspiel.js): Schaden/Heilung mit Zahl, Balken, Form je Schadensart, höchstens ein Effekt, Teilchen-Budget; temporäre TP; Rückgängig und Stufenaufstieg ohne TP-Effekt; Rast, Zustand, Inspiration, Zauberplatz, Konzentrationsende, Bewusstlos, eigener Zug; Vibration; Aus; Heldenwechsel; reduzierte Bewegung; natürliche 20/1 lokal und je Set |
| tests/wuerfel3d.test.js | Artefaktwürfel v5: Grundwert Klassisch, alle 12 Sets × W4–W100 zeichnen mit Inhalt, W4 Eckzahl oben, W100 Zerlegung (00 + 0 = 100) und zwei Würfel nebeneinander, Dreiecksbudget, Würfelschale (bis 12 Würfel) und Set-Vorschau, rollt und landet als WebGL-Bild mit Inhalt, Antippen zeigt Ziellage, kein Regel-Zufall, keine liegengebliebenen Schleifen, Kontextverlust und fehlendes WebGL fallen auf den SVG-Renderer zurück, reduzierte Bewegung |
| tests/ton.test.js | Ton (dice3d.js, vfxton.js): kein Ton vor einer Berührung, Spiel- und Hintergrundgeräusche standardmässig aus, Ton unabhängig von den Effekten, höchstens 8 Stimmen und Freigabe beendeter Stimmen, Lautstärke 0 stumm, Klang je Material, Hintergrund je Stimmung mit Überblenden ohne Doppel, aus bei verstecktem Tab, Vibration einmal pro Landung |
| tests/ui.test.js | Bedien-Animationen (vfxui.js): Grundwert an, Knöpfe nur transform 80 ms, kein «transition: all», Reiter-, Helden-, Dialog-, Aufklapp- und Meldungsübergang nur bei echtem Ereignis (nicht bei Neuzeichnen), Stimmungswechsel mit Überblenden (höchstens zwei Bilder), Energiesparend direkt, Schalter aus, reduzierte Bewegung |
| tests/ressourcen.test.js | Ressourcen: jede Ressource aller Klassen, Unterklassen und Spezies hat eine aufklappbare Erklärung («Was ist das?»), Zauberplätze erklären «ein Zauberplatz pro Zug», Stufe «Erfahren» blendet sie aus |
| tests/zug.test.js | Kampf am Tisch: grosse Ansage «Du bist am Zug!» (Runde, Name, vorgelesen, verschwindet), schwebender Knopf «Zug beenden», sobald die Zugleiste weggescrollt ist, «danach du», reduzierte Bewegung |
| tests/erweiterung.test.js | Erweiterung: Standard- und erweiterte Auswahl (Klassen, Völker, Mehrklassen, Suche), bestehende Helden bleiben sichtbar, alle 6 Klassen × 3 Unterklassen × Stufen 1–20 und 9 Völker ohne Fehler, Aktionsökonomie jeder neuen Fähigkeit, Wandelgestalt, Rasten, Mehrklassen-Zusatzangriff und Voraussetzungen, Ossari/Ferrali/Golem, Export/Import |
| tests/pruefbericht.test.js | Externe Prüfberichte vom 25.11.2026: kein Überschreiben eines neuen Wurfs durch alte Animationen (Einzel/Mehrfach, SVG und WebGL, 30 schnelle Würfe, Zähler frei), Schnellschaden «2H» nicht mit Schild, gebündelte Antwort auf Tisch-Anfragen, Freier Wandel 2 oder 3 Formen, Audit HB-01–HB-15 (Import-Prüfung, doppelte Mehrklasse, Tatendrang ohne Magieaktion, Handlungsunfähigkeit, Abfangen, Nachsetzen ohne Waffe, Hinweise, True Strike, Heldenwechsel, Würfelgrenzen) |
| tests/handy.test.js | Langsames Handy: CPU gedrosselt (`--drossel=4`), Start, Reiter, Würfeln, Listen, Kampfstart, Speicher; mit `DDB_DIR` auch die grösste echte PDF |
| tests/srd.test.js | Abgleich aller Zauber (339) und Monster (164), die es im SRD 5.2 gibt, mit `tests/srd2024-ref.json` (abgeleitet aus dem SRD 5.2, CC BY 4.0, über 5e-bits/5e-database); begründete Ausnahmen stehen im Test |
| tests/echt.test.js | Echter Online-Tisch: SL (Chromium), iPhone (WebKit), Android (Firefox) über den öffentlichen Server; nur in GitHub Actions (hier gesperrt), lokal mit `--lokal`; `--ohne-speicher` simuliert einen Server, der gespeicherte Nachrichten verliert |
| tests/engines.sh, tests/_engine.js | Spielrelevante Tests in WebKit (Safari) und Firefox; läuft in GitHub Actions («Browser prüfen») bei jedem Pull Request |
| tests/layout.test.js | Layout: ⚠ offene Punkte (Anzahl, Liste, Sprung, ✓), Mehr-Menü, ⋯-Menü, kompakte Übersicht am Handy |
| tests/dice.test.js | Würfel-Designs: Körper/Zahlen, alle Sets, Auswahl pro Raum, Konflikt, SL-Set, Effekte voll/ruhig/aus, Überspringen, Teilen, Geräusche |
| tests/levelup.test.js | Stufenaufstieg-Assistent: drei Schritte, neue Merkmale, Veränderungen, TP, Multiclass, offene Entscheidungen mit Sprung |
| tests/npc.test.js | Gegnerangriff: Angriff → Treffer prüfen (Ziel-RK) → erst dann Schaden; Krit doppelt, natürliche 1 verfehlt |
| tests/combat2.test.js | Kampf: Verstärkung, „noch nicht dabei“, Überraschung, neue Begegnung, besiegte/tote überspringen, Treffer zustellen, Packen/Stossen, Todesrettung zu Zugbeginn; Bestiarium nach Fundort und Stufe |
| tests/dmtools.test.js | SL-Werkzeuge: Zufallsbegegnung (Fundort, Gruppe, Schwierigkeit), Aufladung W6 und legendäre Aktionen/Widerstände, eigene Monster (Editor, Teilen, Laden), Beute nach HG |
| tests/savedmg.test.js | Zauber und Fähigkeiten mit Rettungswurf des Ziels: erst Ausgang wählen (misslungen, geschafft, mehrere Ziele), dann Schaden voll, halb oder keiner |
| tests/flow.test.js | Abfragen und Ziele: eingehende Treffer/Anforderungen verdrängen keine offene Entscheidung, Ziel wird beim Auslösen festgehalten, Rückgängig nur für den eigenen Helden |
| tests/krug.test.js | Abenteuer „Wirtshaus zum letzten Krug“: alle Szenen ohne Rohtext, Zähler, Würfeltabellen, Gegenstände nur bei aktivem Abenteuer (Bogen, Beute, Suche, Zufallsbeute), Geben, Kreaturen mit SRD-Monstern, alle Kämpfe startbar, Monsterhilfe erkennt die eigenen Monster |
| tests/adventure.test.js | Abenteuer: eingebaute „Machtader“, Kapitel- und Szenennavigation, Entscheidungen, Kampf beginnen mit Verstärkung und Verbündetem, Beute und Gegenstände ins Formular, Handout, Kreaturen, Handy, Sicherung, Laden aus Datei (optional: `node tests/adventure.test.js index.html Die_Machtader.heldenbuch.json`) |
| tests/backup.test.js | „Alles sichern“: Helden, Hausregeln, eigene Monster, Begegnungen, SL-Notizen sichern und wiederherstellen; alte Exporte bleiben lesbar |
| tests/multi.test.js | Mehrgeräte-Test über lokalen Server: SL + 2 Spieler, gleichzeitige Änderungen, kein Hin-und-her-Schreiben, Verbindungsabbruch, ganzer Kampfablauf |
| tests/MONSTERHILFE.txt | Übersicht: was die Monsterhilfe aus den Bestiariumstexten erkennt (Aufladung, legendär, Zusatzeffekte) |
| tests/table.test.js | Aufgeräumter Spieltisch: Spielleitung kämpft nicht mit (ausser „Ich spiele selbst mit“), keine doppelten Knöpfe, kleine Meldungen statt Würfelfenster, eine Effekte-Einstellung, Rast im ⋯-Menü |
| tests/mechanics.test.js | Zustände durch Rettungswurf (Person festhalten, Betäubender Schlag, Packen), Zielzustand beim Gegnerangriff (Vorteil/Nachteil, Krit aus 1,5 m, Deckung), Schild, Unglaubliches Ausweichen, Resistenz-Hinweis, Zusatzeffekte von Monsterangriffen, Entrinnen, Ausweichen, Eismesser, Schaden aufs gewählte Ziel |
| tests/ui.test.js, tests/ui-full.test.js | Klicktests Desktop + Handy (alle Klassen, Unterklassen, Spezies, Schritte, Export/Import, Offline-Neustart) |
| tests/combos.test.js | alle Klassen × Unterklassen × Stufen 1–20 |
| tests/turnfuzz.test.js | jede Zugleisten-Option je Klasse einmal ausführen |
| tests/undo.test.js | Rückgängig, Wiederholen, Zug zurückspulen |
| tests/slhelfer.test.js | Claude-Helfer: Lagebericht, Kopieren, Assistent (nachgebildet) |
| tests/sitzung.test.js | Spielabend mit Abenteuer über den Online-Tisch: Handout, Kampf, Monsterangriff, Beute, geheime Tabellen |
| tests/kbuch.test.js | Kampagnenbuch: anlegen, bearbeiten, Stand, Freigabe, Chronik, Buchwahl, Sicherung/Wiederherstellung, Claude-Lage (Handy und PC); Teilen am Tisch prüft sitzung.test.js |
| tests/overlap.test.js, tests/overlap-lib.js | Überdeckungen: 9 Bildschirmgrössen × alle Ansichten und Fenster – jedes Bedienelement und jeder Text muss in einer Scrollposition unverdeckt sichtbar sein, keine abgeschnittenen Knöpfe, kein Querscrollen, deckende Leisten; auch im Kampf am Tisch (sitzung.test.js) |
| tests/bruecke.test.js | Brücke ohne Tisch: MCP-Protokoll, Schlüssel/Herkunft, Werkzeuge gegen die echte App, Antwortlängen, geschlossene App, Eintrag in Claude Desktop (inkl. Store-Fassung, kaputte Datei); Werkzeuge am Tisch prüft sitzung.test.js |
| tests/desktop.test.js | Echte PC-App mit Electron (HB_ELECTRON, xvfb-run): Empfänger, Brücke mit der App als Node, Werkzeuge ändern das Fenster, Verbinden-Knopf, eingetragener Befehl startet wirklich |
| tests/download.test.js | Download-Seite www/download.html: eigenes Gerät zuerst (Android, iPhone, Windows, Mac), feste Links passend zu package.json, Version, kein Querscrollen |
| tests/pflege.test.js | Rückfrage zur Sicherung, Stolpersteine (Handy und PC), Server-Umstellung Mosquitto → HiveMQ (App) |
| tests/ddbimport.test.js | D&D-Beyond-Import mit selbst erzeugtem Test-PDF (normal und komprimiert): Felder, Escapes, UTF-16, Nachbau, Abgleich, Vorschau, Anlegen, Abbrechen. Mit DDB_DIR=… zusätzlich echte Exporte (nur lokal, nie ins Repo) |
| tests/verlauf.test.js | Würfelverlauf: Aufzeichnung, Speicherung, Filter, Wurf in Rückfragen |
| tests/bogen.test.js | aufgeräumter Bogen: Kopfleiste mit Kernwerten, Kampfseite ohne Reiterwechsel, Heldenliste |
| tests/hilfe.test.js | Hilfe-Stufen: was sichtbar ist, Regelprüfung ohne Zugleiste, Dialog, Willkommen |
| tests/net.test.js | Online-Tisch mit lokalem Broker: Verschlüsselung, Fremdzugriff, Manipulation, Wiederverbindung (braucht `python3 build_app.py`) |
| tests/boot.test.js | Selbst-Update der Android-App: neue Version laden, Helden behalten, kaputte Version verwerfen, offline (braucht `python3 build_app.py`) |
| tests/balance.js | erzeugt tests/BALANCE.md (Referenz-Builds) |

## Dateien (in Build-Reihenfolge)
| Datei | Inhalt |
|---|---|
| shell.html | HTML-Gerüst und CSS |
| data.js | SRD-Klassen, Spezies, Hintergründe, Talente, Waffen, Rüstungen, Zustände |
| spells.js, spells2.js | Zauber |
| spelldata.js | strukturierte Zauberwerte (Würfel, Steigerung, Angriff/Rettungswurf, Schadensart) |
| calc.js | `derive()`: berechnet alle Werte eines Helden |
| hbclasses.js | ✦ Klassen Runenmeister, Blutweber, Fluchklinge, Maschinist und ✦ Spezies; am Ende die Erweiterung v1.9.46 (IDs `hx…`): 6 Klassen (Formwandler, Geistwirker, Bollwerk, Fadenlenker, Vollstrecker, Seuchenträger) mit je 3 Unterklassen und 9 Völker. Alles mit `home: true`: nur sichtbar mit der Regel «Erweiterte Auswahl» (`homeview`) oder wenn ein Held es schon nutzt |
| subs.js, subs2.js | ✦ Unterklassen |
| flavor.js | Beschreibungstexte |
| pics.js | Bilder für Klassen, Spezies und Hintergründe (CSS-Klassen pic-cls-*, pic-sp-*, pic-bg-*), Abenteuer-Cover (advcov-*), Platzhalter für eigene Unterklasse (pic-sub-eigen) |
| subpics.js | Bilder der 64 Unterklassen (pic-sub-<klasse>-<id>, Liste SUB_PIC); aus den 2×2- und 4×4-Bildbögen geschnitten, 280 px, WebP |
| mobpics.js | Bilder der Kreaturen (MOB_PIC, auch Abenteuer-Kreaturen u-mach-*, u-krug-*), Begleiter (COMP_PIC) und Platzhalter für eigene Monster (MOB_PH) |
| assets.js, crests.js | Bilder (Base64) und Wappen |
| extra.js | Gegenstände, Begleiter, Bestiarium, Rasten, Navigation |
| scenes.js | Hintergrundbilder (Base64) |
| vfx.js | Effekte-Einstellungen und Leistung: Grundwerte, Übernahme alter Schalter, Auto-Leistung, Hintergrund-Pause bei rollenden Würfeln, Vibration nur mit Einwilligung, sichtbarer Zufall `vrand()` getrennt vom Regel-Zufall `rnd()` |
| vfxspiel.js | Spielereignisse sichtbar machen: vergleicht in `commit()` den neuen Stand des aktiven Helden mit dem zuletzt gesehenen (`vfxObserve`) und zeigt lokale Effekte (Schaden/Heilung je Schadensart, Rast, Zug, Zustände …); `vfxQuiet` für Rückgängig/Stufenaufstieg, `vfxHint` für die Schadensart eines Treffers |
| wuerfel3d.js | Artefaktwürfel v5 (nur Optik): WebGL-Darstellung aller 12 Sets und Würfel (W4 mit Eckzahlen, W10 1–10, W100 als Zehner- und Einerwürfel) mit räumlichen Ornamenten je Set (u. a. Goldrahmen und Krone, Drachenhörner, Eiskristalle, Armillarringe, Knochen und Schädel, Wurzeln und Blätter, Zahnräder, Blutmond, Sonnenscheibe, Prismensplitter). Formen entstehen aus Code, keine Modelldateien; 2 Detailstufen (klein unter 50 px). Ein WebGL-Kontext zeichnet in 2D-Leinwände, eine Schleife nur während eines Wurfs; Rückfall auf den SVG-Renderer bei fehlendem WebGL, Kontextverlust oder Fehler. Standard ohne Schalter; Rückfall auch auf zu langsamen Geräten; zum Testen abschaltbar mit localStorage `hb_w3d` = `0` |
| vfxton.js | Spielgeräusche (Schaden, Heilung, Rast, Stufenaufstieg) und Hintergrundgeräusche je Stimmung (Rauschen, Filter, Oszillatoren; Überblenden, aus bei verstecktem Tab); gemeinsamer AudioContext mit Begrenzer aus dice3d.js (`tonAc`, höchstens 8 Stimmen, Klang je Material `TON_MAT`) |
| vfxui.js | Bedien-Animationen: kurze Übergänge nur bei echten Ereignissen (MutationObserver auf #view, #modal, #mini; toggle bei details), Stimmungswechsel mit Überblenden nach dem Dekodieren des neuen Bildes; Schalter `menu`, aus bei reduzierter Bewegung |
| theme.js, theme-fx.js | Stimmungen und Effekte |
| turn.js | Zugleiste: Aktion, Bonusaktion, Reaktion, Bewegung |
| effects.js | Effekte mit Dauer im gemeinsamen Kampf |
| rules.js | Regelkern: Regeloptionen, Durchsetzung, 1×-pro-Zug, Ziele, Zugbeginn, Zauberprüfung, Meisterschaften, Tiergestalt, Rasten, Import-Prüfung, Migration, Kampf-Zusammenführung |
| search.js | Regelsuche |
| encounter.js | Begegnungsplaner, Monsterkarten |
| monsters2.js | Weitere SRD-Kreaturen, typische Fundorte, Stufenempfehlung, Bestiarium-Ansicht |
| randenc.js | Zufallsbegegnung auf Knopfdruck: Fundort, Gruppe, Schwierigkeit → ausgewogene Gegnergruppe nach EP-Budget, ✦ Szenen-Aufhänger |
| mobfx.js | Gegner-Fähigkeiten im Kampf: Aufladung (W6 zu Zugbeginn), legendäre Aktionen und Widerstände als Zähler (nur SL) |
| mobedit.js | Eigene Monster: Editor mit Richtwerten je HG, Vorlage aus dem Bestiarium, Teilen/Laden als Text (localStorage `hb_mobs`) |
| loot.js | ✦ Beute nach Herausforderungsgrad: Münzen, Wertsachen, magische Gegenstände, EP – füllt das Verteilen-Formular |
| explain.js | Rechenweg, Nachbessern nach dem Wurf |
| ux.js | Rückgängig, Bestätigungen, Layout |
| help.js | Kontexthilfe |
| chronik.js | Abenteuerverfolgung: Chronik der Spielleitung (automatisch + Notizen, je Abenteuer/Tisch), Ansagen der Spieler (Feld „Was tust du?“, Tisch-Dokument ans, Meta ansSeen), Mikrofon in claude.ai (dictation) |
| slhelfer.js | Claude als Helfer der Spielleitung: Lagebericht (Szene, Gruppe, Kampf, Würfe) zum Kopieren/Teilen; in claude.ai direkte Antworten (Fähigkeit „sample“) |
| kbuch.js | Kampagnenbuch: Personen, Orte, Aufträge als Reiter im Chronik-Fenster (hb_kbuch je Buch wie die Chronik), Freigabe an den Tisch (Meta kb, ohne geheime Notiz), Chronik-Einträge bei Stand/Freigabe, Spieleransicht «Bekannt», Abschnitt in der Claude-Lage |
| claudebr.js | Claude-Brücke: Werkzeuge für Claude Desktop (lage, nachschlagen, notieren, buch, an_spieler, gegner, naechster_zug, wuerfeln) mit kurzen Antworten; in der PC-App Empfang über window.hbDesk und Knopf «Mit Claude Desktop verbinden» im Claude-Fenster. Gegenstück: electron/main.js, preload.js, claude-desk.js (Empfänger auf 127.0.0.1 mit Schlüssel, Eintrag in claude_desktop_config.json), mcp-bruecke.js (MCP über stdin/stdout, von Claude Desktop mit der App als Node gestartet) |
| stand.js | Spielstand: Zusammenfassungen der Abende und Gesamtstand je Buch (hb_stand), Reiter «Spielstand» im Chronik-Fenster, Entwurf aus der Chronik, Handout, Datei; Claude-Werkzeug abend_abschliessen; lage beginnt mit «Bisher» und zeigt Neues ab dem Abschluss; Abschnitt in der kopierten Lage |
| pflege.js | Speicher absichern (navigator.storage.persist), Rückfrage «Spielabend sichern?» beim Start (≥ 10 eigene Würfe seit der letzten Sicherung, älter als 20 h, höchstens 1× pro Tag), Stolpersteine mit Ort und Zeit (hb_stolper, 100) |
| ddbimport.js | Import des Charakterbogen-PDFs von D&D Beyond: liest die Formular-Widgets (/T, /V) direkt aus den Bytes, auch aus komprimierten Objektströmen; baut den Helden mit den Heldenbuch-Regeln nach, gleicht RK/TP/Initiative/Bewegung/Zauber-SG über «Sonstiges» an, schreibt Nicht-Abbildbares in die Notizen; Vorschau vor dem Anlegen. Fertigkeiten ohne Quelle im Heldenbuch landen in freeSkills/freeExp. Nicht-SRD-Inhalte werden lokale Hausregeln (Unterklasse → sub «eigen» mit subName/subSpells und Merkmal; Talente, fremde Völker → Merkmal mit Nutzungen; fremde Zauber → Hausregel-Zauber, Grad aus der Lage der Überschriften im PDF); übrige Zauber → bonusSpells |
| verlauf.js | Würfelverlauf: alle Würfe (Held, Kreaturen, Mitspieler) mit Details, auf dem Gerät gespeichert (200) |
| hilfe.js | Hilfe-Stufe (Einsteiger · Standard · Erfahren): Erklärknöpfe, Einsteiger-Tipps, Zug-Leitfaden, Wurferklärung, Zugleiste an/aus, Nachbessern, Rechenweg |
| spellflav.js | Zauberbilder: wie man sich jeden Zauber vorstellt |
| dice3d.js | Räumliche Würfel (SVG), 10 Designs + Heldenbuch + Spielleitung, Effekte für 20 und 1, Geräusche, Set-Vergabe pro Raum |
| levelup.js | Stufenaufstieg-Assistent (Aufstieg · Das ist neu · Entscheiden) mit Feier-Effekt |
| savedmg.js | Schaden mit Rettungswurf des Ziels: Abfrage vor dem Schadenswurf (Zauber, andauernde Zauber, Klassenmerkmale) |
| mechanics.js | Abläufe mit Zwischenschritt: Zustände durch Rettungswurf, Zielzustand und Deckung beim Gegnerangriff, Reaktionen bei Treffern, Zusatzeffekte von Monsterangriffen, Entrinnen |
| info.js | Erklärkarten (ⓘ) im Heldenbau, Fertigkeits- und Waffeneigenschaftstexte |
| app.js | Oberfläche, Würfeln, Angriffe, Zauber, Speicherung |
| appnet.js | nur App-Version: Online-Tisch über MQTT mit Ende-zu-Ende-Verschlüsselung. Zustand liegt in gespeicherten (retained) Nachrichten; zusätzlich sendet ein neu verbundenes Gerät eine flüchtige «hello»-Nachricht (`sendHello`/`subHello` in app.js), worauf alle ihren Stand neu senden |
| appboot.js | nur App-Version: Android-App holt neue Versionen selbst von GitHub Pages (mit Rückfall auf die eingebaute Version) |

## Datenformat
Helden tragen ein Feld `v` (Schemaversion, aktuell 2). `migrateChar()` in rules.js hebt ältere Stände an;
vor der ersten Migration legt die App eine Sicherung unter `localStorage['heldenbuch_backup_v1']` an.

## Speicherung
- `heldenbuch` im localStorage: Gesamtstand. `lsSet(keys)` schreibt nur die genannten Datensätze in den gespeicherten Stand (zweiter Tab überschreibt nichts); ein `storage`-Ereignis übernimmt Änderungen anderer Tabs.
- Einzelkopien je Datensatz in der Datenbank (claude.ai-Konto bzw. `hbdb:` in der App), 700 ms verzögert; beim Verlassen der Seite sofort (`flushLater`).
- `hb_pend:<c|h>_<id>`: noch nicht bestätigte Einzelkopie. Beim Start gewinnt dafür der lokale Stand (auch Löschungen); sonst bei Helden der neuere `updated`, bei Hausregeln die Kopie.
- Schlägt ein Schreibvorgang fehl, bleibt «Nicht gespeichert – bitte exportieren» stehen, bis wieder gespeichert ist.

## Daten von aussen
Importe, Abenteuer-Dateien und Dokumente vom Online-Tisch gelten als fremd: `validHb` und `importJson` prüfen alles vor der ersten Änderung, `advCheck` jeden Abenteuer-Block nach seiner Art, `playerDoc` jedes Spielerdokument. Alle `data-*`-Werte gehen durch `esc()`, Porträts nur als `data:image/(png|jpeg|webp|gif);base64` (`safeImg`).

## App-Dateien bauen

`bash quelle/build_www.sh` baut `www/` und `Heldenbuch.html` frisch aus den Quelldateien. Die automatische Veröffentlichung (GitHub Actions, Schritt «Web-Dateien aus den Quellen bauen») macht das vor jedem Android-, PC- und Web-Build selbst; die Dateien im Repo sind nur noch ein Abbild für den lokalen Gebrauch.
