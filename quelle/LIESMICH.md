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
| explain.js | Rechenweg, Nachbessern nach dem Wurf |
| ux.js | Rückgängig, Bestätigungen, Layout |
| help.js | Kontexthilfe |
| spellflav.js | Zauberbilder: wie man sich jeden Zauber vorstellt |
| info.js | Erklärkarten (ⓘ) im Heldenbau, Fertigkeits- und Waffeneigenschaftstexte |
| app.js | Oberfläche, Würfeln, Angriffe, Zauber, Speicherung |
| appnet.js | nur App-Version: Online-Tisch über MQTT mit Ende-zu-Ende-Verschlüsselung |
| appboot.js | nur App-Version: Android-App holt neue Versionen selbst von GitHub Pages (mit Rückfall auf die eingebaute Version) |

## Datenformat
Helden tragen ein Feld `v` (Schemaversion, aktuell 2). `migrateChar()` in rules.js hebt ältere Stände an;
vor der ersten Migration legt die App eine Sicherung unter `localStorage['heldenbuch_backup_v1']` an.
