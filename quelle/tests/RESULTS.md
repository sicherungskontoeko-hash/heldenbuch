# Testprotokoll

- Zeitpunkt: 2026-11-26T20:07:10+01:00
- Revision (SHA-256 von index.html, gekürzt): 43d889a1aa6e2659
- Node: v22.23.5 · Playwright: 1.63.0
- Browser: Chromium 157.0.8103.78
- System: Linux 6.18.44-fc-v880

| Suite | Exit-Code | Ergebnis |
|---|---|---|
| Regeltests (rules.test.js) | 0 | ✔ Import bereinigt unbekannte Zauber 48 / 48 Tests bestanden  |
| Regressionen HB-01–HB-11 (hb.test.js) | 0 | ✔ HB-11 Bewusstlos ausserhalb des Kampfes: kein Zauber 27 / 27 bestanden · /home/claude/hb-fc/quelle/index.html  |
| Robustheit & Sonderfälle (cases.test.js) | 0 | ✔ HB-26 Fluchklinge: zweite Bonusaktion blockiert, keine Ressource verbraucht 23 / 23 bestanden  |
| Kritischer Audit A01–A06 (audit2.test.js) | 0 | ✔ A06 Negativ: Beenden über den Schalter beendet auch die Konzentration 21 / 21 bestanden · /home/claude/hb-fc/quelle/index.html  |
| Erklärkarten ⓘ (info.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 53 / 53 bestanden  |
| Layout: ⚠ offene Punkte, Menüs (layout.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 29 / 29 bestanden  |
| Würfel-Designs (dice.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 50 / 50 bestanden  |
| Stufenaufstieg-Assistent (levelup.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 28 / 28 bestanden  |
| Gegnerangriff: Treffer prüfen vor Schaden (npc.test.js) | 0 | ✔ critExpr verdoppelt alle Würfel 8 / 8 bestanden  |
| Kampf-Nachzügler, Überraschung, Treffer zustellen, Bestiarium (combat2.test.js) | 0 | ✔ Planer: Monsterauswahl nach Fundort gruppiert, Verstärkung/überrascht im Kampf 40 / 40 bestanden  |
| SL-Werkzeuge: Zufallsbegegnung, Aufladung, eigene Monster, Beute (dmtools.test.js) | 0 | ✔ Keine Skriptfehler 46 / 46 bestanden  |
| Schaden mit Rettungswurf: erst fragen, dann würfeln (savedmg.test.js) | 0 | ✔ Keine Skriptfehler 18 / 18 bestanden  |
| Abläufe mit Zwischenschritt: Zustände, Reaktionen, Zusatzeffekte (mechanics.test.js) | 0 | ✔ Keine Skriptfehler 40 / 40 bestanden  |
| Aufgeräumter Spieltisch (table.test.js) | 0 | ✔ Keine Skriptfehler 29 / 29 bestanden  |
| Abfragen und Ziele: nichts verdrängt, Ziel festgehalten (flow.test.js) | 0 | ✔ Keine Skriptfehler 15 / 15 bestanden  |
| Sicherung: alles sichern und wiederherstellen (backup.test.js) | 0 | ✔ Keine Skriptfehler 11 / 11 bestanden  |
| Willkommen: Name beim ersten Start (welcome.test.js) | 0 | ✔ Keine Skriptfehler 15 / 15 bestanden  |
| Willkommen in der App (welcome.test.js app) | 0 | ✔ Keine Skriptfehler 15 / 15 bestanden  |
| Spielabend sichern, Stolpersteine (pflege.test.js) | 0 | ✔ Keine Skriptfehler 32 / 32 bestanden  |
| Import aus D&D Beyond (ddbimport.test.js) | 0 | ✔ Keine Skriptfehler 73 / 73 bestanden  |
| Import aus D&D Beyond (ddbimport.test.js app) | 0 | ✔ Keine Skriptfehler 73 / 73 bestanden  |
| Spielabend sichern, Stolpersteine, Server (pflege.test.js app) | 0 | ✔ Keine Skriptfehler 35 / 35 bestanden  |
| Kampagnenbuch: Personen, Orte, Aufträge (kbuch.test.js) | 0 | ✔ Keine Skriptfehler 48 / 48 bestanden  |
| Kampagnenbuch in der App (kbuch.test.js app) | 0 | ✔ Keine Skriptfehler 48 / 48 bestanden  |
| Überdeckungen: 9 Bildschirmgrössen, alle Ansichten (overlap.test.js) | 0 | ✔ Keine Skriptfehler 20 / 20 bestanden  |
| Überdeckungen in der App (overlap.test.js app) | 0 | ✔ Keine Skriptfehler 20 / 20 bestanden  |
| Claude-Desktop-Brücke: MCP, Empfänger, Einrichtung (bruecke.test.js) | 0 | ✔ Keine Skriptfehler 49 / 49 bestanden  |
| Claude-Desktop-Brücke in der App (bruecke.test.js app) | 0 | ✔ Keine Skriptfehler 49 / 49 bestanden  |
| Download-Seite: Geräte, feste Links, Version (download.test.js) | 0 | ✔ Keine Skriptfehler 14 / 14 bestanden  |
| Hilfe-Stufe: Einsteiger, Standard, Erfahren (hilfe.test.js) | 0 | ✔ Keine Skriptfehler 48 / 48 bestanden  |
| Aufgeräumter Bogen: Kopfleiste, Kampfseite, Heldenliste (bogen.test.js) | 0 | ✔ Keine Skriptfehler 38 / 38 bestanden  |
| Würfelverlauf (verlauf.test.js) | 0 | ✔ Keine Skriptfehler 24 / 24 bestanden  |
| Rückgängig, Wiederholen, Zug zurückspulen (undo.test.js) | 0 | ✔ Keine Skriptfehler 30 / 30 bestanden  |
| Claude als Helfer der Spielleitung (slhelfer.test.js) | 0 | ✔ Keine Skriptfehler 22 / 22 bestanden  |
| Gegnerzug: Angriffe zählen, Zug beenden (npcturn.test.js) | 0 | ✔ Keine Skriptfehler 11 / 11 bestanden  |
| Monsterbilder (mobpics.test.js) | 0 | ✔ Keine Skriptfehler 16 / 16 bestanden  |
| Unterklassen-Bilder (subpics.test.js) | 0 | ✔ Keine Skriptfehler 9 / 9 bestanden  |
| Kampfseite am Handy: Angriffe früher, Warnungen oben (m01.test.js) | 0 | ✔ Keine Skriptfehler 108 / 108 bestanden  |
| Bestiarium am Handy: Suche vor Einleitung (m03.test.js) | 0 | ✔ Keine Skriptfehler 90 / 90 bestanden  |
| Erschaffen am Handy: Auswahl vor Zusammenfassung (m02.test.js) | 0 | ✔ Keine Skriptfehler 111 / 111 bestanden  |
| Grosstest: alle Ansichten, Reiter, Schritte, Klassen, Stimmungen (gross.test.js) | 0 | siehe Konsole |
| Grosstest in der App (gross.test.js app) | 0 | siehe Konsole |
| Klick-Fuzz: jeder Knopf in jeder Ansicht (klick.test.js) | 0 | siehe Konsole |
| Daten: Sichern, Laden, Neustart, alte und kaputte Dateien, 5600 Kombinationen (daten.test.js) | 0 | ✔ Keine Skriptfehler 12 / 12 bestanden  |
| Daten in der App (daten.test.js app) | 0 | ✔ Keine Skriptfehler 12 / 12 bestanden  |
| Jeden Zauber wirken (zauber.test.js) | 0 | siehe Konsole |
| Lange Zufallssitzung (affe.test.js) | 0 | siehe Konsole |
| Befunde B-01–B-20 des Grosstests v1.9.40 (befunde.test.js) | 0 | ✔ Keine Skriptfehler 42 / 42 bestanden  |
| Lesbarkeit: Kontrast in allen Stimmungen (kontrast.test.js) | 0 | ✔ Stimmung wueste 9 / 9 bestanden  |
| Stimmungen: Wechsel, Zeichenrate, Aus und reduzierte Bewegung (stimmung.test.js) | 0 | ✔ Keine Skriptfehler 25 / 25 bestanden  |
| Effekte: Einstellungen, alte Schalter, Leistung, Vibration (vfx.test.js) | 0 | ✔ Keine Skriptfehler 35 / 35 bestanden  |
| Effekte: Schaden, Heilung, Rast, Stufe, Zustände, lokale Krits (ereignis.test.js) | 0 | ✔ Keine Skriptfehler 34 / 34 bestanden  |
| Artefaktwürfel v5 (Prototyp): Schalter, WebGL, Rückfall (wuerfel3d.test.js) | 0 | ✔ Keine Skriptfehler 24 / 24 bestanden  |
| Effekte: Ton, Hintergrundgeräusche, Vibration (ton.test.js) | 0 | ✔ Keine Skriptfehler 18 / 18 bestanden  |
| Effekte: Bedien-Animationen (ui.test.js) | 0 | ✔ Keine Skriptfehler 15 / 15 bestanden  |
| Ressourcen: Erklärungen zum Aufklappen (ressourcen.test.js) | 0 | ✔ Keine Skriptfehler 9 / 9 bestanden  |
| Kampf am Tisch: eigener Zug gut sichtbar (zug.test.js) | 0 | ✔ Keine Skriptfehler 20 / 20 bestanden  |
| Erweiterung: 6 Klassen, 9 Völker, erweiterte Auswahl (erweiterung.test.js) | 0 | ✔ Keine Skriptfehler 39 / 39 bestanden  |
| Prüfberichte 25.11.: Würfelanzeige, Schild, Tisch-Anfragen, Audit HB-01–HB-15 (pruefbericht.test.js) | 0 | ✔ Keine Skriptfehler 37 / 37 bestanden  |
| Tischhilfen: eigene Würfel, Zugleiste, Ladungen, Regeln der Runde, Vorbereiten (tischhilfen.test.js) | 0 | ✔ keine Seitenfehler 43 bestanden, 0 fehlgeschlagen  |
| Sicherheit: fremder Text wirkt nie als HTML (sicherheit.test.js) | 0 | ✔ keine Seitenfehler, keine Dialoge 26 bestanden, 0 fehlgeschlagen  |
| GK-01/GK-07 Vertrauensgrenze am Tisch: fremde Kampf-, Runden- und Spielerdaten (gk-netz.test.js) | 0 | ✔ Keine JavaScript-Fehler (Teil 2) 37 / 37 bestanden  |
| GK-02 Verdeckte Würfe werden nie nachträglich geteilt (gk-wuerfe.test.js) | 0 | ✔ Keine JavaScript-Fehler (Teil 2) 21 / 21 bestanden  |
| GK-03 Import und gespeicherter Bestand: Prüfung mit Feldpfad, keine Teilübernahme, Isolation (gk-import.test.js) | 0 | ✔ Keine JavaScript-Fehler 20 / 20 bestanden  |
| GK-04/05/06 Aktionsökonomie: fremder Zug, Folgeangriffe, Vorbereiten (gk-zug.test.js) | 1 | ✔ GK06-T10 Fremder Zug: Vorbereiten öffnet nicht; neuer eigener Zug: Vorbereitung verfallen, Reaktion frei ✔ GK06-T11 Einzelspiel und lockere Regeln: Vorbereiten wie bisher möglich  |
| GK-08 Grosse verschlüsselte Nachrichten (gk-b64.test.js) | 0 | ✔ Keine JavaScript-Fehler 12 / 12 bestanden (chromium)  |
| GK-11 Gnaden-Dialog auf Deutsch (gk-gnade.test.js) | 0 | ✔ Keine JavaScript-Fehler 7 / 7 bestanden  |
| GK-09 Prüfpaket: beide Fassungen und Manifest (gk-paket.test.js) | 0 | ✔ Keine JavaScript-Fehler 11 / 11 bestanden  |
| GK-10 SRD-5.2.1-Attribution wortgetreu (gk-lizenz.test.js) | 0 | ✔ Keine JavaScript-Fehler 17 / 17 bestanden  |
| Fablecrown: Name, Bildmarke, Kompatibilität B01–B15 (fc-marke.test.js) | 0 | ✔ Keine JavaScript-Fehler 37 / 37 bestanden  |
| Fablecrown Vault V2: Kern, zwei Geräte, Kopplung, Konflikte, Verlauf (vault.test.js) | 0 | ✔ FC68-09 «Beide behalten» ohne gelungene Kopie: Konflikt bleibt offen; mit Kopie (Hausregel): beide Stände überall 42 / 42 bestanden  |
| Fablecrown Vault V2 in der App: zwei Browserprofile gegen Prüfserver (vault-app.test.js) | 0 | ✔ Keine Skriptfehler 14 / 14 bestanden  |
| Unabhängige Prüfung 1.9.68: Mehrtab, Wandelgestalt, Hausregel-Import, Würfel (audit68.test.js) | 0 | ✔ Keine Skriptfehler 8 / 8 bestanden  |
| Begleiter und Reittiere: Werte, TP, Initiative, eigene Würfel (begleiter.test.js) | 0 | ✔ keine Seitenfehler 12 bestanden, 0 fehlgeschlagen  |
| Bedienung mit Tastatur und im Querformat (bedienung.test.js) | 0 | ✔ keine Seitenfehler 15 bestanden, 0 fehlgeschlagen  |
| Zufallsspieler: 3 Minuten zufällige Bedienung ohne Fehler (zufallsspieler.test.js) | 0 | ✔ keine Seiten- oder Konsolenfehler 2 bestanden, 0 fehlgeschlagen  |
| Langsames Handy: CPU 4× gedrosselt (handy.test.js app) | 0 | ✔ Keine Skriptfehler  ([]) 17 / 17 bestanden  |
| Abgleich mit dem SRD 5.2: Zauber und Monster (srd.test.js) | 0 | ✔ 339 Zauber und 164 Monster mit dem SRD 5.2 abgeglichen, 0 Abweichungen (8 begründete Ausnahmen)  |
| Online-Tisch mit drei Geräten, lokal (echt.test.js --lokal) | 0 | ✔ Keine Skriptfehler auf den Geräten 12 / 12 bestanden (Server: lokal)  |
| Online-Tisch, Server vergisst gespeicherte Nachrichten (echt.test.js --ohne-speicher) | 0 | ✔ Keine Skriptfehler auf den Geräten 12 / 12 bestanden (Server: lokal, ohne gespeicherte Nachrichten)  |
| Kampfstart: Initiative-Fenster, Auswahl (initcall.test.js) | 0 | ✔ Keine Skriptfehler 15 / 15 bestanden  |
| Tischhilfen: passive Werte, Rast für alle, EP nach dem Kampf (tablehelp.test.js) | 0 | ✔ Keine Skriptfehler 9 / 9 bestanden  |
| Gegenstände: SRD-Liste, Flüche, Ausrüstung (items.test.js) | 0 | ✔ Keine Skriptfehler 12 / 12 bestanden  |
| Rettungswürfe der Monster (mobsaves.test.js) | 0 | ✔ Keine Skriptfehler 7 / 7 bestanden  |
