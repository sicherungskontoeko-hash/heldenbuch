# Bericht: Dice & Visual Effects 2.0 und Artefaktwürfel v5

Stand 24.11.2026, Pull Requests #33 bis #38 (Kette: #33 → #34 → #35 → #36 → #37 → #38).
Basis: v1.9.46 (`3f1f33c`). Noch nichts davon ist veröffentlicht; alles wartet auf Freigabe.

Legende: **umgesetzt** · **teilweise** · **abweichend** (mit Grund) · **offen**.

## Überblick

| PR | Inhalt | Neue Tests |
|---|---|---|
| #33 | Stimmungen v2: neun Szenen, ruhigere Effekte, flacherer Bogen-Kopf am Handy | `stimmung.test.js` (25) |
| #34 | Schritt 1: Einstellungen, Leistung, Aufräumen, Fehler | `vfx.test.js` (35) |
| #35 | Schritt 2: Spielereignisse, natürliche 20/1 lokal und je Set | `ereignis.test.js` (34) |
| #36 | Artefaktwürfel v5: Prototyp W20 Weltenhain, Eisenwerk, Arkanum (hinter Schalter) | `wuerfel3d.test.js` (15) |
| #37 | Schritt 3: Ton, Klang je Material, Hintergrundgeräusche, Vibration | `ton.test.js` (18) |
| #38 | Schritt 4: Bedien-Animationen | `ui.test.js` (15) |

Zusätzlicher Code: `vfx.js` 12 KB, `vfxspiel.js` 10 KB, `vfxton.js` 6 KB, `vfxui.js` 4 KB, `wuerfel3d.js` 28 KB, Stil rund 13 KB. Zusammen rund 73 KB, unkomprimiert, also unter dem Ziel von 150 KB. Dazu kommen die Szenenbilder aus PR #33 (+0,4 MB). Es gibt keine neuen Dateien zur Laufzeit, keine Bibliothek und keine Netzzugriffe.

## Die zehn Entscheidungen

| Nr. | Thema | Stand | Wo | Bemerkung |
|---|---|---|---|---|
| 1–2 | Würfelmaterial und Form | **umgesetzt** | `wuerfel3d.js` (#36, #39) | Artefaktwürfel v5: alle 12 Sets, W4 bis W100, aus Code erzeugt (keine Modelldateien). Seit dem Aufräumen der Standard; die SVG-Würfel bleiben nur als Rückfall (ohne WebGL, Kontextverlust, zu langsames Gerät). Der alte SVG-Materialpatch wurde, wie verlangt, nicht angewendet. |
| 3 | Würfelbewegung | **teilweise** | `vfx.js`, `app.js`, `wuerfel3d.js` | Normal 850 ms, Kurz 300 ms und Aus umgesetzt. Antippen zeigt sofort das Ergebnis. Kein Regel-Zufall in der Animation (`vrand`). Höchstens 2/4/6 Würfel drehen sich echt, je nach Profil. Abweichend: Die bisherigen SVG-Würfel haben weiter je Würfel eine eigene Schleife; eine gemeinsame Schleife gibt es nur für die Artefaktwürfel. Zusammenstösse mehrerer Würfel fehlen noch und gehören zum Würfelpaket. |
| 4 | Kritische Würfe | **umgesetzt** | `dice3d.js`, `app.js` (#34, #35) | Effekte lokal am Würfel, Dezent und Intensiv, ohne Flackern. Natürliche 1 je Set (Rauch, Dampf, Staub, Splitter, welke Blätter, Glanz erlischt, verblasst). Natürliche 20/1 wird aus dem behaltenen W20 bestimmt und vom Regel-Krit getrennt (natürliche 19 im erweiterten Bereich: eigener Hinweis). Kein Krit bei Höchstwerten anderer Würfel. |
| 5 | Schaden und Heilung | **umgesetzt** | `vfxspiel.js` (#35) | Lokal am TP-Feld: Zahl, gleitender Balken, Form je Schadensart aus den Daten. Gemischte oder unbekannte Schadensart bleibt neutral. Höchstens ein Effekt gleichzeitig, Dezent ≤ 8 und Intensiv ≤ 15 Teilchen, 420–520 ms. |
| 6 | Status und Kampf | **umgesetzt** | `vfxspiel.js`, `levelup.js` (#35) | Alle zwölf Ereignisse: TP, temporäre TP, eigener Zug, Konzentrationsende, Zauberplatz, kurze und lange Rast, Stufenaufstieg (1,3 s), Gegenstand, Zustand, Bewusstlos, Inspiration. Keine Effekte bei Rückgängig, Heldenwechsel, Neuzeichnen oder Daten vom Tisch. |
| 7 | Ton | **umgesetzt** | `dice3d.js`, `vfxton.js` (#37) | Ein AudioContext mit Begrenzer, höchstens 8 Stimmen, Klang je Material. Spiel- und Hintergrundgeräusche sind standardmässig aus. Ton erst nach einer Berührung. Lautstärke 0 ist stumm, ein versteckter Tab ist still. |
| 8 | Vibration | **umgesetzt** | `vfx.js` (#34, #35, #37) | Nur mit Einwilligung (Grundwert aus), nur bei sichtbarer Seite, ein Muster auf einmal. Die alten unbedingten Vibrationen (Krit, Zug, Kampfaufruf) sind jetzt daran gebunden. iOS unterstützt keine Vibration. |
| 9 | Bedien-Animationen | **umgesetzt** | `vfxui.js` (#38) | Feste Dauern wie vorgegeben. Nur bei echten Ereignissen. Stimmungswechsel überblendet nach dem Dekodieren des neuen Bildes. |
| 10 | Leistungsprofile, Einstellungen | **umgesetzt** | `vfx.js` (#34) | Auto, Energiesparend, Ausgewogen, Maximal. Je Effektart Aus/Dezent/Intensiv. Würfel, Ton, Vibration und Bedien-Animationen getrennt einstellbar. Alte Einstellungen werden übernommen, auch ausdrückliches Aus. Auto senkt nach zwei überlasteten Würfen und hebt nach sechs guten Würfen wieder an. Abweichend: Auto geht nie über «Ausgewogen»; «Maximal» gibt es nur, wenn man es selbst wählt. |

## Konkrete Referenzbefunde

| Befund | Stand |
|---|---|
| `pushLog`: Ersatz-Effekt trotz «Aus» | behoben (#34) |
| `showToast` prüft «weniger Bewegung» nicht | behoben (#34) |
| `d3roll`: `innerHTML` je Bild, eigene Schleife je Würfel | abweichend: beim SVG-Renderer unverändert. Die Artefaktwürfel haben eine gemeinsame Schleife und sparen so DOM-Arbeit. |
| Alte Effekte nach neuem Wurf | behoben: Ein neuer Wurf räumt grosse Effekte weg (#34) |
| `themeBurst` vibriert ohne Einwilligung | behoben (#34) |
| `showMulti`: Höchst-/Tiefstwert als Krit | behoben: leise Markierung (#34) |
| W100 auf einem W10 | behoben: W100 sind zwei W10 (Zehner 00–90, Einer 0–9) nebeneinander (#39) |

## Artefaktwürfel v5 (Briefing)

| Punkt | Stand |
|---|---|
| Eigene Branch, Tests gesichert | umgesetzt (Branch `wuerfel-v5`) |
| Nur Optik, Regeln und Ergebnisse unverändert | umgesetzt, geprüft in `wuerfel3d.test.js` |
| Zuerst Weltenhain W20, dann Eisenwerk und Arkanum | umgesetzt, freigegeben, danach alle Sets (#39) |
| Eigene Geometriebausteine je Set | umgesetzt für die drei Sets: Wurzelstränge, Ranken, Blätter; Stahlbänder, Muttern, Nieten, Zahnradkränze; Goldfassung, Armillarringe, Runenband, Kugeln |
| Zahlen frei, echte Glyphen | umgesetzt. Die Ornamente liegen auf Kanten und Ecken, Arkanums Ringe stehen in Raumlage neben der Zahl. |
| Schalter Classic / Enhanced / Artifact | abweichend (Entscheid): kein Schalter. Artefakt ist Standard, Classic nur Rückfall, Enhanced gestrichen. |
| Rückfall WebGL → bisheriger SVG-Renderer → Ergebnis | umgesetzt, auch bei Kontextverlust mitten im Wurf. Abweichend: Die Zwischenstufe «Canvas vereinfacht» fehlt, es geht direkt auf SVG. |
| Eine Schleife, nur bei sichtbarem Wurf, Zwischenspeicher begrenzt | umgesetzt (höchstens 16 Formen); zu langsames Gerät (zwei Würfe unter 20 Bildern pro Sekunde) fällt für die Sitzung auf SVG zurück |
| Bildtafel mit echten Renderings, Graustufen | umgesetzt für W20 bei 36/64/84/120/260 px |
| Übrige Sets und Formen, W4, W100, 84 Kombinationen | umgesetzt (#39): W4 mit Eckzahlen, W10 1–10, W100 als zwei W10 |
| Messung auf echten Geräten | offen |

## Gemessen

Alle Werte stammen vom Testrechner (Chromium, ohne echte GPU) und sind keine Gerätewerte.

- **Hintergrund-Effekte, Rechenzeit am Handy (390 px), ms pro Sekunde, alt → neu:**

  | Stimmung | alt | neu |
  |---|---|---|
  | warm | 69 | 55 |
  | episch | 91 | 68 |
  | gruselig | 223 | 110 |
  | romantisch | 141 | 53 |
  | lustig | 187 | 60 |
  | kalt | 164 | 57 |
  | blutig | 107 | 58 |
  | mystisch | 169 | 60 |
  | wüste | 122 | 53 |

- **Zeichenrate des Hintergrunds:** am Handy höchstens etwa 20 Bilder pro Sekunde, am PC höchstens etwa 30. Mit Würfel-Teilchen wird jedes Bild gezeichnet.
- **Artefaktwürfel, Dreiecke:**

  | Set | normal | klein |
  |---|---|---|
  | Weltenhain | 17 690 | 2 660 |
  | Eisenwerk | 12 432 | 6 512 |
  | Arkanum | 6 356 | 2 588 |

- **Artefaktwürfel, Zeichenzeit je Bild bei 120 CSS-Pixeln und doppelter Pixeldichte:** 45 / 26 / 17 ms (Weltenhain / Eisenwerk / Arkanum). Gemessen mit Software-WebGL; auf einer echten GPU deutlich weniger, aber nicht gemessen.

## Nicht geprüft

- Echte Geräte: Android, iPhone, PC mit GPU (Bildzeiten, Speicher, Vibration, Ton).
- Screenreader.
- Langzeitbetrieb über einen ganzen Spielabend.
- WebKit und Firefox laufen in GitHub für die meisten neuen Tests. Der Test der Artefaktwürfel läuft vorerst nur in Chromium.
