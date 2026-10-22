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
| tests/layout.test.js | Layout: ⚠ offene Punkte (Anzahl, Liste, Sprung, ✓), Mehr-Menü, ⋯-Menü, kompakte Übersicht am Handy |
| tests/dice.test.js | Würfel-Designs: Körper/Zahlen, alle Sets, Auswahl pro Raum, Konflikt, SL-Set, Effekte voll/ruhig/aus, Überspringen, Teilen, Geräusche |
| tests/levelup.test.js | Stufenaufstieg-Assistent: drei Schritte, neue Merkmale, Veränderungen, TP, Multiclass, offene Entscheidungen mit Sprung |
| tests/npc.test.js | Gegnerangriff: Angriff → Treffer prüfen (Ziel-RK) → erst dann Schaden; Krit doppelt, natürliche 1 verfehlt |
| tests/combat2.test.js | Kampf: Verstärkung, „noch nicht dabei“, Überraschung, neue Begegnung, besiegte/tote überspringen, Treffer zustellen, Packen/Stossen, Todesrettung zu Zugbeginn; Bestiarium nach Fundort und Stufe |
| tests/dmtools.test.js | SL-Werkzeuge: Zufallsbegegnung (Fundort, Gruppe, Schwierigkeit), Aufladung W6 und legendäre Aktionen/Widerstände, eigene Monster (Editor, Teilen, Laden), Beute nach HG |
| tests/savedmg.test.js | Zauber und Fähigkeiten mit Rettungswurf des Ziels: erst Ausgang wählen (misslungen, geschafft, mehrere Ziele), dann Schaden voll, halb oder keiner |
| tests/flow.test.js | Abfragen und Ziele: eingehende Treffer/Anforderungen verdrängen keine offene Entscheidung, Ziel wird beim Auslösen festgehalten, Rückgängig nur für den eigenen Helden |
| tests/backup.test.js | „Alles sichern“: Helden, Hausregeln, eigene Monster, Begegnungen, SL-Notizen sichern und wiederherstellen; alte Exporte bleiben lesbar |
| tests/multi.test.js | Mehrgeräte-Test über lokalen Server: SL + 2 Spieler, gleichzeitige Änderungen, kein Hin-und-her-Schreiben, Verbindungsabbruch, ganzer Kampfablauf |
| tests/MONSTERHILFE.txt | Übersicht: was die Monsterhilfe aus den Bestiariumstexten erkennt (Aufladung, legendär, Zusatzeffekte) |
| tests/table.test.js | Aufgeräumter Spieltisch: Spielleitung kämpft nicht mit (ausser „Ich spiele selbst mit“), keine doppelten Knöpfe, kleine Meldungen statt Würfelfenster, eine Effekte-Einstellung, Rast im ⋯-Menü |
| tests/mechanics.test.js | Zustände durch Rettungswurf (Person festhalten, Betäubender Schlag, Packen), Zielzustand beim Gegnerangriff (Vorteil/Nachteil, Krit aus 1,5 m, Deckung), Schild, Unglaubliches Ausweichen, Resistenz-Hinweis, Zusatzeffekte von Monsterangriffen, Entrinnen, Ausweichen, Eismesser, Schaden aufs gewählte Ziel |
| tests/ui.test.js, tests/ui-full.test.js | Klicktests Desktop + Handy (alle Klassen, Unterklassen, Spezies, Schritte, Export/Import, Offline-Neustart) |
| tests/combos.test.js | alle Klassen × Unterklassen × Stufen 1–20 |
| tests/turnfuzz.test.js | jede Zugleisten-Option je Klasse einmal ausführen |
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
| hbclasses.js | ✦ Klassen Runenmeister, Blutweber, Fluchklinge, Maschinist und ✦ Spezies |
| subs.js, subs2.js | ✦ Unterklassen |
| flavor.js | Beschreibungstexte |
| pics.js | Klassen- und Speziesbilder |
| assets.js, crests.js | Bilder (Base64) und Wappen |
| extra.js | Gegenstände, Begleiter, Bestiarium, Rasten, Navigation |
| scenes.js | Hintergrundbilder (Base64) |
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
| spellflav.js | Zauberbilder: wie man sich jeden Zauber vorstellt |
| dice3d.js | Räumliche Würfel (SVG), 10 Designs + Heldenbuch + Spielleitung, Effekte für 20 und 1, Geräusche, Set-Vergabe pro Raum |
| levelup.js | Stufenaufstieg-Assistent (Aufstieg · Das ist neu · Entscheiden) mit Feier-Effekt |
| savedmg.js | Schaden mit Rettungswurf des Ziels: Abfrage vor dem Schadenswurf (Zauber, andauernde Zauber, Klassenmerkmale) |
| mechanics.js | Abläufe mit Zwischenschritt: Zustände durch Rettungswurf, Zielzustand und Deckung beim Gegnerangriff, Reaktionen bei Treffern, Zusatzeffekte von Monsterangriffen, Entrinnen |
| info.js | Erklärkarten (ⓘ) im Heldenbau, Fertigkeits- und Waffeneigenschaftstexte |
| app.js | Oberfläche, Würfeln, Angriffe, Zauber, Speicherung |
| appnet.js | nur App-Version: Online-Tisch über MQTT mit Ende-zu-Ende-Verschlüsselung |
| appboot.js | nur App-Version: Android-App holt neue Versionen selbst von GitHub Pages (mit Rückfall auf die eingebaute Version) |

## Datenformat
Helden tragen ein Feld `v` (Schemaversion, aktuell 2). `migrateChar()` in rules.js hebt ältere Stände an;
vor der ersten Migration legt die App eine Sicherung unter `localStorage['heldenbuch_backup_v1']` an.
