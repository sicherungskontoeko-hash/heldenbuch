# Fablecrown – Gesamtbericht (26.11.2026)

- **Ausgang:** b6d5552.
- **Arbeit in vier gestapelten Branches:**
  1. `gk-korrekturen` → PR auf `main`
  2. `fablecrown` → auf 1
  3. `balance` → auf 2
  4. `fc-pendenzen` → auf 3
- **Veröffentlicht:** nichts. Kein Merge, kein Deployment, keine Kosten.

## Ergebnis je Paket

| Paket | Status | Bericht |
|---|---|---|
| GK-01…11 (technische Korrekturen) | TEILABNAHME: 10 abgenommen; GK-08 fehlt nur Firefox/WebKit in der CI | `berichte/GK_ABSCHLUSSBERICHT.md`, `GK_TESTERGEBNISSE.json` |
| Rebranding Fablecrown | umgesetzt, B01–B15 automatisch geprüft (39/39, mit alter Fassung im selben Raum) | unten |
| Balance | 71 Zustimmungen (inkl. V02c nach deiner Entscheidung), 1 teilweise, 6 abgelehnt | `berichte/BALANCE_REVIEW.md`, `BALANCE_DECISIONS.json` |
| FC-Pendenzen | 7 umgesetzt/teilweise, 5 bereits vorhanden, 7 vertagt mit Begründung, 12 nicht beauftragt | `berichte/FABLECROWN_PENDENZEN_ERGEBNIS.json` |
| Vault | V0 (Architektur, Bedrohungsmodell, Daten) vorgelegt; V1/V2 nicht gebaut; V3 blockiert bis Freigabe | `berichte/VAULT_V0_ADR.md` |

## Rebranding

- **Sichtbar «Fablecrown»:**
  - Kopfzeile (Krone mit Feder statt W20), Titel, Hilfe, Willkommen, Einladung, Meldungen, Würfel-Set.
  - Export-Dateinamen `<Held>_Fablecrown.json` und `Fablecrown_Sicherung.json`.
  - PWA-Manifest («Fablecrown – Tabletop RPG Companion»), Vorschau-Metadaten, `teilen.jpg`.
  - Download-Seite, README, Anleitung, Android-Name, PC-Fenstertitel, Claude-Desktop-Anzeigename.
- **Logo:**
  - Original unverändert unter `quelle/marke/`.
  - Alle Ableitungen reproduzierbar mit `marke/icons.py`: Kachel mit transparenten Ecken, vollflächig für iOS, maskable mit Motiv im sicheren Kreis von 40 %, Android-Vordergrund mit 33/108, rund, Splash, Desktop-Icon.
- **Bewusst unverändert, damit nichts verloren geht:**
  - Speicherschlüssel `heldenbuch*` und `hb_*`, Exportkennzeichen `heldenbuch: 1`.
  - Raum- und Kryptoprotokoll, App-ID `ch.heldenbuch.app`.
  - Electron-`productName` (bestimmt den Datenordner und das Mac-Programm).
  - Download-Dateinamen `Heldenbuch.apk`, `-Setup.exe` usw.; Web-Adresse, Cache-Name, MCP-Kennung.
- **Geprüft:**
  - Alter Spielstand und alte Sicherungen aus b6d5552 laden unverändert.
  - Alte und neue Fassung spielen im selben Raum (Würfe, TP, Kampf in beide Richtungen).
- **Deine Entscheidung nötig:**
  - Sollen Programmname, Installer und Dateinamen für PC und Mac später auch «Fablecrown» heissen? Das braucht einen Test auf echten Windows- und Mac-Geräten (Datenordner, zweites Programm).
  - Marke und Domain sind noch nicht geprüft.

## FC-Pendenzen (Kurzfassung)

- **Umgesetzt:**
  - FC-11: Probe anfordern.
  - FC-12: verdeckter SL-Wurf, nur lokal.
  - FC-16: Inspiration als Beute.
  - FC-22: Charaktereditor mit Sprung zur Kategorie, Verwerfen behält den Spielstand.
  - FC-29: Ressourcen in der SL-Übersicht.
  - FC-31: letzte Ansicht wiederherstellen.
- **Lücken behoben:**
  - FC-15: Ein Raumwechsel holte eine alte Gruppenrast als Gratis-Rast nach.
  - FC-26: Taktpunkte füllten sich bei der Rast, statt zu verfallen.
  - FC-24: Dunkelsicht ergänzt.
- **Bereits vorhanden, geprüft:** FC-14 Konzentration, FC-19 Rückgängig, FC-21 Suche als Fenster, FC-25 Ausrüstungshinweise.
- **Vertagt, mit Begründung:**
  - FC-04 Gegenstände übergeben: braucht sichere, bestätigte Zustellung, sinnvoll nach Vault V2.
  - FC-08 Bilder: braucht eine Bildablage, zusammen mit Vault.
  - FC-10, FC-18, FC-28: im Zweifel nicht.
  - FC-27: braucht stabile Verweis-IDs in den Texten.

## Tests (gemeinsame Gesamtprüfung am Ende)

- **Gesamtlauf** über alle vier Pakete: 108 Suiten, Protokoll `protokolle/gesamtlauf.log`.
  - Erstlauf: 101 grün, 7 rot.
  - Ursachen: ein Programmfehler aus dem Balance-Paket (Fadenbruch-Zähler), zwei fehlende Zugleisten- und Erklärungseinträge, drei Tests mit alten Sollwerten (Knochenklinge 1W6, vier statt fünf Anpassungen, Ressourcenbuchung) und ein Testaufbau (Willkommensfenster im Testmodus).
  - Alle behoben. Die betroffenen Suiten liefen danach einzeln grün: daten (beide Fassungen), combos, ressourcen, erweiterung, pruefbericht, fc-marke.
- **Nicht geprüft:**
  - Firefox und WebKit (CI im PR).
  - Echte Handys, Tablets und PCs; Installer; Android-Build.
  - Leistungsvergleich: Das Messwerkzeug `fc/tools/messung.js` ist geschrieben, der Vorher-/Nachher-Vergleich steht aus (Kontingent).
- **Neuer Verdacht GK-N04:** Bei der Einzeldatei (file://) verliert Chromium hier gelegentlich gespeicherte Daten über ein Neuladen. Das betrifft auch den alten Stand. Bitte einmal auf einem echten PC prüfen.

## Nächste Schritte

1. Die PRs nacheinander ansehen, mit «passt» freigeben und in Reihenfolge mergen: GK → Fablecrown → Balance → FC.
2. Vault: V1/V2 lokal bauen, wenn du willst. Für V3: Anbieter, Konto und Kostenrahmen freigeben; die Preise recherchiere ich dann aktuell.
3. Leistungsmessung vorher/nachher und Spieltests der neuen Balance am Tisch.
