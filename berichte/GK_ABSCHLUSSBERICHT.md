# Heldenbuch – Abschlussbericht GK-01 bis GK-11

- **Referenzcommit:** `b6d5552` (main, Merge PR #56; main seither unverändert, geprüft per `git fetch`)
- **Geprüfter Commit / Arbeitsbaum:** Branch `gk-korrekturen`, Commit `d9f7234`, Arbeitskopie sauber
- **Datum, Umgebung:** 26.11.2026 · Linux Ubuntu 24.04.5 (Kernel 6.18) · Node v22.23.5 · Playwright 1.63.0 (package.json nennt 1.56) · Chromium 157.0.8103.78. Firefox und WebKit sind hier nicht installiert, sie laufen über `tests/engines.sh` in der CI.
- **Build-Varianten und SHA-256** (aus `app/MANIFEST.json`, `pruefpaket.py`):
  - artifact: `quelle/index.html` · SHA-256 `4418cfe67e4fdf88c9a113448d2734df06ead0ca3cdabb55c918dfb85f8a469e`
  - standalone: `quelle/app/Heldenbuch.html` · SHA-256 `69e1aec7abae48c1f72cae0ab93eb1c147f2c50a207a08708be7dbd04c06368a`
  - pwa: `quelle/app/www/index.html` · SHA-256 `0034c4263005345929fc5dd5faf39491d5ee6d3957e9ac4d01caebce20e68e98`
- **Freigabeentscheidung:** **TEILABNAHME**

GK-01 bis GK-07 und GK-09 bis GK-11 sind abgenommen: alle Pflichtfälle bestanden, Positivpfade geprüft. GK-08 ist implementiert und in Chromium bestanden; GK08-T07 (Firefox/WebKit) läuft erst in der CI des Pull Requests. Keine blockierenden Befunde offen. Veröffentlichung erst nach deinem «passt».

## Befunde

| ID | Ursprünglicher Befund | Vorher-Repro (b6d5552) | Änderung (Datei/Funktion) | Tests / Belege | Status | Restrisiko |
|----|----|----|----|----|----|----|
| GK-01 | HTML-Injection über fremde Kampfdaten | 8 Marker-Elemente im DOM (Runde, Initiative, TP/RK, IDs) | Schema-Prüfung am Eingang (GK-07), dazu `esc()` in `fightHtml`, Zugleiste, `turnCall`, `npcBits`/`npcModal`, `effBadges`, `effForm`, `hitPrompt`, `reqCheck`, Rettungswurf-Liste, `riderPrompt`, `npcTurnBox`, Heil-/Schadenziele; CSS-Prozent nur endlich | `gk-netz` GK01-T01–T06, `sicherheit` (neu: Zahlenfelder/IDs) | ABGENOMMEN | keines bekannt; neue Renderer müssen weiter `esc()` nutzen |
| GK-02 | Verdeckte Würfe wurden nach dem Einschalten der Freigabe nachträglich geteilt | bestätigt (`true`) | `pushLog` hält Raum, Modus und Held beim Entstehen fest (WeakMap `LOG_PUB`); `myRolls()` sendet nur für genau diesen Raum und Helden Freigegebenes; Kopien, Altes und Fremdes gelten als privat | `gk-wuerfe` GK02-T01–T10, `dice` (Vorbedingung angepasst) | ABGENOMMEN | Ergebnis eines von der SL angeforderten Rettungswurfs geht weiterhin an den Kampfstand (gewollt, siehe Entscheidungen) |
| GK-03 | Import nahm `play.res:null` an, der Bogen brach danach | angenommen, Bogen-Absturz `reading 'loh'` | `charShapeErrors`/`jsonShapeErrors` (rules.js) in `validateChar`; `importPlan` → `importJson` zweistufig, Grösse, Anzahl, Hausregeln vorläufig, `derive()`-Probe; eigene Tabellenschlüssel (`nvOwn`, `getSpell`); beschädigter Bestand isoliert (`charSafe`, `S.broken`, Kasten «Beschädigte Helden»), `heldenbuch_defekt`; Speicherfehler gemeldet | `gk-import` GK03-T01–T12; Fuzzing-Inventar `protokolle/importfuzz_*.txt` | ABGENOMMEN | unbekannte Felder bleiben erlaubt (Vorwärtskompatibilität); siehe Grenzen |
| GK-04 | Zauber im fremden Zug im strengen Modus wirkbar | Platz verbraucht `{} → {"1":1}` bei fremdem Zug | `spellCheck` prüft den fremden Zug für Aktions-/Bonusaktionszauber vor jedem Verbrauch, unabhängig von der Zugleiste | `gk-zug` GK04-T01–T11 | ABGENOMMEN | — |
| GK-05 | Folgeangriffe im fremden Zug | 2. Angriff nach Zugwechsel mit neuem Wurf | `offTurnGate` (aus `tSpend` gelöst) auch in `tCountAttack` (Folgeangriff, Bonusangriff, Kerbe, Packen/Stossen) und `bfl:`; Wahrer Schlag nur für den wirkenden Helden; Zusatz: Niederstrecken nach Gelegenheitsangriff gesperrt | `gk-zug` GK05-T01–T10 + Zusatzfall | ABGENOMMEN | Durchspalten bleibt im fremden Zug erlaubt (Regel 2024, siehe Entscheidungen) |
| GK-06 | Vorbereiten kostete beim Öffnen, Abbrechen gab nichts zurück | Aktion 0 → 1 → 1 | Öffnen ist Vorschau (`readyBlock` ohne Nebenwirkung), `readyGo` prüft Held/Kampf/Zug, Auslöser, verbucht dann über `tSpend`; Doppelklick einmal | `gk-zug` GK06-T01–T12 | ABGENOMMEN | — |
| GK-07 | Fremde Kampf- und Rundendokumente ungeprüft übernommen | `npcs:{}` → Absturz «object is not iterable» | Schema `nvCombat`/`nvMeta` (rules.js), `validateCombatDoc`/`validateMetaDoc` vor `S.combatRemote`, `mergeCombat`, `applyMercy`, `applyMeta`; `playerDoc` mit Feldliste; Raumprüfung gegen verspätete Aufrufe; neuer Raum zeigt nichts vom alten | `gk-netz` GK07-T01–T09 (Teil 2 mit zwei Geräten über lokalen Broker) | ABGENOMMEN | Rollen sind technisch nicht authentisiert: ein Raummitglied kann gültige Werte ändern (Architektur, nicht Teil des Auftrags) |
| GK-08 | `hbB64` mit Spread: Stacküberlauf ab rund 100 KB | 150 000/250 000 Bytes: «Maximum call stack size exceeded» | `hbB64` blockweise (16 KB) und einmal `btoa`; `hbUb64` mit Schleife; `hbSeal` lehnt Umschläge über 3 MB vor dem Senden ab (`too_large`) | `gk-b64` GK08-T01–T06, T08; T07 über `engines.sh` | IMPLEMENTIERT (T07 Firefox/WebKit: CI) | Firefox/WebKit nur in CI |
| GK-09 | Prüfpaket enthielt unter `app/Heldenbuch.html` die Artifact-Fassung | bestätigt (isApp falsch) | `pruefpaket.py`: beide Fassungen eindeutig benannt, PWA-Ordner, `MANIFEST.json` (Revision, Version, Bytes, SHA-256, Befehle, Abhängigkeiten), bricht bei falschen Merkmalen ab | `gk-paket` GK09-T01–T07 | ABGENOMMEN | Android/Electron nicht im Paket |
| GK-10 | Nur allgemeiner SRD-/CC-BY-Hinweis | bestätigt | Pflichttext wortgetreu aus der offiziellen PDF (Seite 1, 6 031 375 Bytes, SHA-256 `8974902d…5e3d87`, vom Nutzer am 26.11.2026 bereitgestellt; Direktabruf aus der Arbeitsumgebung gesperrt): `SRD_ATTRIBUTION` (data.js), Hilfe, Fusszeile (mit Verweisen), README, ANLEITUNG, www/download.html | `gk-lizenz` GK10-T01–T06 (T01 mit `SRD_PDF=…` direkt gegen die PDF) | ABGENOMMEN | SRD-5.1-Inhalte haben eine eigene Pflichtattribution (offen, siehe unten) |
| GK-11 | Dialogtitel «Show mercy?» | bestätigt | `app.js` Gnaden-Dialog: «Gnade zeigen?» | `gk-gnade` GK11-T01–T03 | ABGENOMMEN | — |

## Testübersicht

- **Gesamtlauf:** 107 Suiten. Lauf 1 (1538b6b): 104 grün, 3 rot (overlap ×2, multi) → behoben (f970161, aed6d31). Lauf 2 (aed6d31): 106 grün, gk-import rot (Testumgebung, GK-N04) → Test angepasst (d9f7234), danach 3×/6× grün. Zusätzlich Gesamtlauf über alle Pakete (Fablecrown, Balance, FC) am Ende; GK-Suiten dort grün. GK-Einzelsuiten mit Protokoll: protokolle/gk-suiten/*.log.
- **Neu hinzugefügte Tests** (alle in `tests/run-all.sh`, die fünf Kernsuiten zusätzlich in `tests/engines.sh`):
  - `gk-netz` (37)
  - `gk-wuerfe` (21)
  - `gk-import` (20)
  - `gk-zug` (40)
  - `gk-b64` (12)
  - `gk-paket` (11)
  - `gk-lizenz` (18)
  - `gk-gnade` (7)
  - Erweiterung von `sicherheit`
- **Browser- und Plattformmatrix:**
  - Lokal ausgeführt: Chromium 157.0.8103.78, Artifact- und Standalone/PWA-Fassung, zwei bis drei Geräte über einen lokalen aedes-Broker.
  - Firefox und WebKit: werden mit dem Pull Request über browser.yml ausgeführt (Ergebnis im PR).
- **Erstfehler und Wiederholungen:** overlap 900/1024 px (neue Fusszeile, behoben), multi (Test rechnete mit Zauber im fremden Zug, angepasst), gk-import (Chromium-file://-Speicher, GK-N04). Keine Flakiness kaschiert.
- **Rechenstichproben und Daten-Diff:**
  - `datenexport.js` vor (b6d5552) und nach: alle 15 Datendateien byte-gleich, darunter `stichproben.json` mit 432 Stichproben (Rettungswürfe, TP-Maxima, Übungsboni, Zauber-SG, Zauberangriff, Zauberplätze, Angriffe pro Aktion).
  - Nur `meta.json` weicht ab, und zwar nur im Zeitstempel.
  - Inhaltszahlen unverändert: 367 Zauber, 22 Klassen (10 ✦), 23 Völker, 184 Monster, 344 Gegenstände.
- **Sicherung, Import, Kompatibilität:**
  - Bestehende Suiten bestanden: `backup`, `ddbimport` (73), `cases`, `hb`, `befunde`, `multi`, `erweiterung`, `boot`.
  - Alte v1-Stände wurden migriert.
  - Zahlentexte aus Auswahllisten bleiben gültig.
  - Export → Import ist feldgleich (GK03-T05).
- **Asset- und Screenshot-Diff:**
  - Bilddateien wurden nicht geändert.
  - Bildvergleich: 176 Ansichten (4 Breiten, 9 Stimmungen), 3 Referenzläufe auf b6d5552 als Rauschmaske.
  - Oberhalb der Fusszeile sind 174 von 176 gleich. Abweichend ist nur die Hilfe bei 320 und 390 px, weil dort der neue Lizenztext steht (gewollt).
  - Die Fusszeile selbst ist länger (Lizenztext). Deshalb sind ganze Seiten einige Zeilen höher.
  - Belege: `protokolle/bildvergleich_oben.txt`, `bilder/ausschnitt_*.png`.

## Entscheidungen und Abweichungen

- **GK-07, ganzes Dokument verwerfen:** Ungültig heisst, das ganze Dokument wird verworfen; es gilt der letzte gültige Stand. Ausnahmen:
  - Freitext über der Grenze wird gekürzt. So friert z. B. eine lange Notiz nicht den ganzen Kampf ein.
  - Unbekannte Zustände fallen weg.
  - Unbekannte einfache Felder mit sicherem Namen bleiben erhalten, damit eine neuere App-Version am selben Tisch nichts verliert.
- **GK-07, Spielerdokumente:** Hier fallen unlesbare Felder einzeln weg, statt den ganzen Spieler zu verwerfen. Sonst würde ein Held mitten im Kampf aus der Initiative verschwinden. Das entspricht dem bisherigen Verhalten von `playerDoc`, nur mit fester Feldliste.
- **GK-02, Metadaten getrennt vom Eintrag:** Die Freigabe-Angaben liegen in einer WeakMap statt im Protokolleintrag. Sie lassen sich so weder serialisieren noch fälschen. Kopien gelten automatisch als privat.
- **GK-02, Heldenwechsel:** Würfe sind zusätzlich an den Helden gebunden, damit sie nach einem Wechsel nicht unter dem neuen Namen erscheinen (GK02-T10).
- **GK-02, angeforderte Rettungswürfe:** Das Ergebnis eines von der SL angeforderten Rettungswurfs wird weiterhin in den Kampfstand geschrieben, auch wenn der Spieler sonst verdeckt würfelt. Es ist eine ausdrückliche Antwort auf die Anfrage der SL.
- **GK-03, gespeicherter Bestand:** Gerätespeicher, Konto und anderer Tab werden nur auf Aufbau und Typen geprüft, nicht auf Verweise. Ein umbenanntes Waffen-ID im Programm soll bestehende Helden nicht sperren; das bisherige Verhalten bleibt.
- **GK-03, Kontokopie:** Ist die Kopie im Konto beschädigt und die auf dem Gerät gültig, gewinnt die Gerätekopie und wird neu hochgeladen.
- **GK-05, Durchspalten:** Durchspalten bleibt im fremden Zug möglich. Nach den Regeln 2024 ist es ein Zusatz eines Treffers, auch bei einem Gelegenheitsangriff, und gilt einmal pro Zug. Niederstrecken nach einem Gelegenheitsangriff ist dagegen eine Bonusaktion und darum gesperrt. Das ist ein zusätzlicher Fall mit derselben Ursache wie GK-05.
- **GK-05/06, Prüfung bei Zugwechsel:** Offene Schadensdialoge bleiben nach einem Zugwechsel abwickelbar (Fortsetzung). Neue Angriffe sind gesperrt. «Vorbereiten» und «Wahrer Schlag» prüfen den Helden; Vorbereiten prüft zusätzlich Kampf und Zug.
- **GK-08:** Die Base64-Kodierung ist byte-identisch mit der bisherigen. Zusätzlich sendet die App Nachrichten über 3 MB nicht mehr; die Empfänger hätten sie ohnehin verworfen.
- **GK-09:** `app/Heldenbuch.html` bleibt als alter Pfad bestehen und ist jetzt korrekt die Standalone-Fassung, wie `build_app.py` sie erzeugt.
- **GK-10:**
  - Die bisherige deutsche «Regeln nach … von Wizards of the Coast»-Zuschreibung entfällt dort, wo der Pflichttext steht, weil die Lizenz keine weitere Zuschreibung wünscht.
  - Der deutsche Hinweis «Kein offizielles Produkt von Wizards of the Coast» bleibt. Er ist ein Haftungsausschluss, keine Zuschreibung.
  - In der Hilfe-Ansicht ist die Fusszeilen-Lizenz ausgeblendet, damit der Text nicht doppelt erscheint.
- **Neuer Befund GK-N01 (bestätigt, behoben):** Wer denselben Raum verliess und sofort wieder betrat, bekam danach keine Aktualisierungen mehr.
  - Der Broker hat Abmelden und Anmelden in falscher Reihenfolge verarbeitet. Das ist auf b6d5552 nachgestellt.
  - Lösung: Das Abmelden wird 1,5 Sekunden verzögert und entfällt bei sofortigem Wiederabonnieren (appnet.js).
  - Belegt in `gk-netz` (Wiederbeitritt ohne Pause).
- **Bewusst nicht geändert:**
  - Bilder, Völkernamen, Regeln und Balance
  - B-04/B-05
  - Build-System und Abhängigkeiten
  - Speicherschlüssel, Raum- und Verschlüsselungsformat
- **Nicht geprüfte Bereiche und Gründe:**
  - Firefox und WebKit lokal (nicht installiert, siehe CI-Ergebnis).
  - Echte Geräte und öffentliche Broker: In öffentlichen Räumen wurden keine Testdaten mit Schadtext gesendet.
  - Android- und Electron-Paket.
  - Das bekannte gelegentliche `ereignis`-Flackern ist nicht Teil dieser Änderungen.
- **Neuer Befund GK-N02 (behoben):** Lizenz-Fusszeile vom Würfelknopf verdeckt, siehe Erstfehler.
- **GK-N04 (Verdacht):** In dieser Testumgebung verliert Chromium bei file:// gelegentlich den eben geschriebenen localStorage über ein Neuladen (auch b6d5552, auch mit Profil; über http nie). Ob echte Desktop-Browser mit der Einzeldatei betroffen sind, ist nicht geprüft – Empfehlung: einmal auf einem echten PC testen.
- **Offen (nicht Teil des Auftrags, gemeldet):**
  - Halbelf, Halbork, die Kampfstile Duellieren und Schützen sowie einige Monster in den Abenteuern stammen aus dem **SRD 5.1**. Dafür gilt eine eigene Pflichtattribution aus der SRD-5.1-Datei. Die habe ich nicht geprüft und darum auch nicht eingefügt.
  - Rollen am Tisch sind nicht kryptografisch abgesichert.
- **Noch nötig vor Freigabe:** Dein Review und «passt». Danach Merge, CI-Engines auf main und Veröffentlichung nach deiner Freigabe.
