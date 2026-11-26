# Balance-Review (Fablecrown, bisher Heldenbuch)

- **Referenz:** b6d5552. **Geprüft und geändert auf:** Branch `balance` (auf `fablecrown`, auf `gk-korrekturen`).
- **Regelstand:** D&D 2024 / SRD 5.2.1 (offizielle PDF liegt vor).
- **Methode:** Code und Regeltexte gelesen (hbclasses.js, subs2.js, turn.js, calc.js, extra.js). Dazu Erwartungswert-Rechnungen. Am Tisch wurde nichts gespielt.
- **Tests:** stehen noch aus. Der Auftraggeber wünscht eine gemeinsame Gesamtprüfung am Ende, siehe «Tests».

## Kurzurteil je eigene Klasse und eigenes Volk (Rolle → Einschätzung)

| Inhalt | Rolle | vorher (Hypothese) | eigene Einschätzung vorher | nach Änderung |
|---|---|---|---|---|
| Runenmeister | Vielseitig/Schaden | A | A, kein Handlungsbedarf | unverändert |
| Blutweber | Heilung/Tank | S | A–S, aber Lebensweber ab 13 mit Heilschleife | Schleife geschlossen (N01) |
| Fluchklinge | Schaden/Kontrolle | A | A | unverändert |
| Maschinist | Utility/Schaden | S | A, Meistertechniker unkritisch | unverändert (N02 abgelehnt) |
| Formwandler | Nahkampf | C | C: Bonusaktionssteuer jede Runde, kleine Effekte | B (dauerhafte Anpassungen, Flug 17) |
| Geistwirker | Fernschaden | C | C: Schaden ok (≈ 90 % eines Hexenmeisters mit Schauriger Strahl), aber keine Entscheidungen | B/B+ (Geistespunkte) |
| Bollwerk | Tank | B | B | unverändert |
| Fadenlenker | Taktik/Fernschaden | C | C: Positionierung ohne Ertrag | B |
| Vollstrecker | Schaden | B | B; Bedränger schwächer | Bedränger B |
| Seuchenträger | Schaden über Zeit | A | A; Versehrung schwächer | Versehrung B |
| Brachar, Seidling, Trilaner | Volk | D | D: fast nur erzählerisch | C+/B− |
| Hainhüter, Oculi, Gratling, Feyri | Volk | C | C | B− bis B |
| Mykori, Dämmerling, Steinblütiger, Golem, Höhlenwanderer | Volk | A/B | wie Hypothese | unverändert |

## Entscheidungen je Teil-ID

Die vollständige Matrix mit Begründung je ID steht in `BALANCE_DECISIONS.json` (78 Einträge).

- **Zustimmung und umgesetzt:** C01a, b, d, e, f, g · C02b, c · C03a, b · C04a–g · C05a–c · C06a–g · C07a–c · C08a–d · C09a–e · C10a–c · C11a–e · V01a, c · V02a, b · V03a, b · V04a–c · V05a–c · V06a, b · V07a–c · N01 · N03a–c · N05.
- **Teilweise:** V03c. Die Alternative gegen erzwungene Verschiebung ist übernommen, der Reset bleibt bei kurzer Rast. ÜB-mal pro langer Rast wäre auf niedriger Stufe eine Verschlechterung.
- **Abgelehnt:**
  - C01c: belegt einen Dauerplatz für einmalig wenige temporäre TP.
  - C02a: Wildgestalt ist schon B; nur Tempo-Inflation.
  - V04d: mit V04a–c genug; ein Zaubermerkmal bräuchte neue Auswahlpfade für bestehende Helden.
  - V06c: Überschneidung mit Steinblütigem; Gratling-Zauberwirker bekämen Magierrüstung gratis.
  - N02: kein erhebliches Problem, siehe unten.
  - N04: begrenzt durch Göttliche Macht, Aura und Dauer; keine Schleife.
- **V02c:** vom Eigentümer am 26.11. entschieden (Kurzflug ab Charakterstufe 5, ÜB-mal pro langer Rast), umgesetzt.
- **V01b:** bleibt wie vorgeschlagen unverändert.

## Wichtige Rechnungen

Annahmen: Trefferchance 65 % inklusive 5 % Krit, Hauptattribut +4/+5.

- **Geistwirker, Stufe 11 (INT +5):**
  - 3 Impulse: 3 × (0,65 × 9,5 + 0,05 × 4,5) ≈ 19,2 pro Runde.
  - Psionische Welle (2 Punkte) gegen 3 Gegner mit 50 % Rettungserfolg: 3 × (0,5 × 22,5 + 0,5 × 11,25) ≈ 50,6, dazu 3 m Verschiebung.
  - Mit 4 Punkten sind höchstens zwei Wellen pro kurzer Rast möglich, je eine pro Zug.
  - Vergleich: Feuerball eines Stufe-11-Zauberers 8W6 ≈ 28 pro Ziel, nicht selektiv.
  - Ergebnis: stark, aber im Rahmen. Den Ausschlag geben Kontrolloptionen, nicht Dauerschaden.
- **Geistwirker, Stufe 2:** Die Barriere 2W6 + INT (≈ 10) zweimal pro kurzer Rast verhindert ≈ 20 Schaden. Zum Vergleich ein Magier-Dip mit Schild: +5 RK zweimal. Akzeptiert; als Spieltest-Punkt notiert.
- **Formwandler, Stufe 7:**
  - Gewinn: eine Bonusaktion pro Runde (vorher immer gebunden).
  - Panzer mit KON +3: 1W6 + 3 ≈ 6,5 statt 3,5 verhinderter Schaden pro Reaktion.
  - Ab 11 dauerhaft Klinge + Panzer: +1W8 pro Zug, rund +2,9 Schaden pro Runde (65 %), und ≈ 7,5 Reduktion.
  - Damit Kämpfer-Niveau, nicht darüber.
- **Blutweber N01, Lebensweber:**
  - Stufe 13, KON +5: Blutpreis 7 TP. Blutstillung mit Lebensfluss 2W8 + 10 ≈ 19, Puls ≈ 9. Netto +2 TP pro Runde, und das Ziel erhält 19.
  - Stufe 17: 9 TP gegen 2W10 + 10 ≈ 21, Puls 10. Netto +1.
  - Ausserhalb des Kampfes ist das beliebig wiederholbar, also eine Heilschleife ohne Verbrauch.
  - Unter Stufe 13 bleibt die Bilanz negativ (z. B. Stufe 10: −4).
  - Korrektur: Heilung, die über Blutpreis oder TP-Opfer bezahlt ist, löst den Puls nicht aus. Reguläre Blutladungen und fremde Heilquellen bleiben.
- **N02 Maschinist 18:**
  - Kostenlos ausserhalb des Kampfes und übertragbar ist nur Feldreparatur: 1W8 + INT temporäre TP (≈ 9,5) pro gerüstetem Verbündeten.
  - Konstrukt-Heilung trifft keine Spielervölker; der Golem ist Humanoid.
  - Keine Schleife; auf Stufe 18 nicht erheblich.

## Kumulativ

- **Formwandler:** C01a/b/d/f/g und C02b/c bilden ein Paket. Am stärksten ist Schreckenform auf 18 mit dauerhaftem Panzer (2W10 + KON). Das entspricht Bollwerk-Niveau und ist gewollt.
- **Geistwirker:**
  - C04 und C05 wurden zusammen bewertet.
  - Die Unterklassen-Buffs sind klein (Reichweiten, nutzlose WEI-Probe ersetzt, +1 Würfelstufe) und bleiben.
  - Begrenzung: höchstens eine Geistesenergie-Fähigkeit pro Zug, in der App über «einmal pro Zug» geprüft.
- **Fadenlenker:**
  - Fast nur Reichweiten und Utility. Mehr Schaden gibt es nur als kleine Unterklassen-Würfel und mit Breiter Schwarm ab 18.
  - Fadenschlinge ist an den Träger gebunden.
- **Völker:** Kein Volk erhält mehr als drei Verbesserungen; zwei grosse Vorschläge (V04d, V06c) sind abgelehnt.

## Umgesetzte Änderungen

Betroffene Dateien: `quelle/hbclasses.js`, `quelle/subs2.js`, `quelle/turn.js`, `quelle/extra.js`, `quelle/app.js`, `quelle/rules.js`, `quelle/calc.js`.

**Formwandler**
- Neues Merkmal «Gefestigte Form» auf Stufe 7.
- `turnReset` löscht `play.hxForms` erst bei Stufe < 7.
- Kampfunfähigkeit und 0 TP beenden die Anpassungen (`app.js`: Zustand «kampfunfähig» und `knockOut`).
- Anpassung «Flügel» ab Stufe 17. Sie steht in der Validierung, und die Zugleiste bietet sie an.
- Panzer würfelt 1 Wandelwürfel + KON, bei Schreckenform 18 zwei Würfel + KON.
- Schreckgestalt `hxf_dread` wird nach kurzer Rast zurückgesetzt.

**Geistwirker**
- Neue Ressource `hxm_psi` mit 2/3/4/5/6 Punkten, Reset bei kurzer Rast.
- Sechs Zugleisten-Einträge mit Kosten 1/1/1/2/2/3. Die Barriere ist eine Reaktion; die übrigen Fähigkeiten sind einmal pro Zug nutzbar.
- Texte in der Impuls-Hilfe angepasst.
- `hxm_read` hat jetzt 2 Einsätze.

**Fadenlenker**
- Reichweiten 18/27 m, Verschiebung 6/9/12 m, freie Bewegung 6 m, Netz 3 m bzw. 6 m.
- Ressourcen `hxt_resist` und `hxt_swarm` entfallen: Die Merkmale wirken jetzt dauerhaft bzw. unbegrenzt.
- Neu `hxt_swap`; `hxt_break` hat INT-Mod Einsätze.
- Unterklassen-Würfel angepasst.

**Vollstrecker:** `hxe_pressure` (Stufe 18) ersetzt durch `hxe_free`: Stufe 3–17, 1× pro kurzer Rast. Ab 18 gibt es keinen Zähler mehr.

**Seuchenträger:** `hxb_heal` hat 2 Einsätze.

**Völker**
- Texte angepasst.
- `hxs_dust` und `hxs_eye` mit ÜB Einsätzen, `hxs_spike` mit 2, `hxs_invite` mit ÜB.
- Neu `hxs_fore`.
- Feyri: Fertigkeitswahl Überzeugen/Täuschen.

**Klingentakt**
- Taktpunkte sind eine Aufbauressource (`build:true`). Kurze und lange Rast setzen sie auf leer, statt sie aufzufüllen.
- Der Gewinn bei Treffern bleibt manuell über den Zähler. Neue Helden starten bis zur ersten Rast mit vollem Zähler (Restpunkt).

**Migration:** Bestehende Helden behalten ihre Klassen-, Volks- und Ressourcen-IDs. Verbrauchte Zähler bleiben verbraucht; neue Maxima gelten ab sofort. Entfallene Zähler (`hxt_resist`, `hxt_swarm`, `hxe_pressure`) werden nicht mehr angezeigt; alte Werte in `play.res` sind unschädlich.

## Tests

Noch nicht ausgeführt. Geplant für die gemeinsame Gesamtprüfung:
- **Gesamtlauf `bash tests/run-all.sh`.** Er enthält `rules`, die 432 Stichproben über `datenexport`, `turnfuzz`, `ddbimport` und die homebrew-bezogenen Suiten.
- **Gezielt:** Formwandler auf Stufe 6 und 7 bei Zugwechsel; Geistespunkte bei Rast und einmal pro Zug; Taktpunkte nach Rast leer.
- **Erwartet:** Die Rechenstichproben der offiziellen Klassen bleiben unverändert (T13). Homebrew-Exportwerte ändern sich nur bei den genannten Ressourcen.

## Offen und Spieltest-Szenarien

- **V02c:** entschieden und umgesetzt.
- **Geistwirker:**
  - Stufe 2 Barriere gegen Kämpfer-Dip.
  - Stufe 17 Dominanz mit zwei Geistwirkern am Tisch (Kettenlähmung).
- **Formwandler 11:** dauerhaft Klinge + Greifer bei Initiative (Rasche Anpassung).
- **Klingentakt:** Taktpunkte bei Treffern automatisch zählen? Das wäre eine neue Automatik und wurde bewusst nicht gebaut.
- **Allgemein:** Keine Behauptung perfekter Balance. Echte Spielabende sind nötig.

## Für den Produktverantwortlichen

- **Verbessert:** die drei schwachen Grundklassen, die zwei schwachen Pfade und alle sieben schwachen Völker.
- **Exploits geschlossen:** zwei echte (Lebensweber-Heilschleife, Crescendo-Rekursion) und eine Regelunklarheit (Wildbund).
- **Bewusst nicht geändert:** starke offizielle und eigene Inhalte, Maschinist 18, Uralter Hain.
- **Seidling-Kurzflug:** nach deiner Entscheidung umgesetzt.
