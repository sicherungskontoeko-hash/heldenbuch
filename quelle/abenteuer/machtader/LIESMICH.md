# Die Machtader – Quelle des Abenteuers

Eine Quelle, zwei Ausgaben:

| Datei | Inhalt |
|---|---|
| `story.js` | Geschichte: Prolog, Kapitel, Zwischenspiele, Epilog (Vorlesetexte, Proben, Kämpfe, Beute, Entscheidungen) |
| `appendix.js` | Figuren und Bestiarium mit allen Werten |
| `lib.js`, `statlib.js`, `build.js` | Satz als Word-Buch → `Die_Machtader.docx` (`node build.js`, braucht `npm i docx`) |
| `extract.js`, `gen.js` | Heldenbuch-Daten → `../../adv-machtader.js` und `Die_Machtader.heldenbuch.json` (`node gen.js`) |

Nach einer Änderung an Geschichte oder Werten: `node gen.js`, dann `bash ../../build.sh`.
`gen.js` übersetzt die Werteblöcke in das Format des Heldenbuchs (Mehrfachangriff, Aufladung, „GES SG 16 oder …“, legendäre Aktionen).
Prüfen: `node ../../tests/adventure.test.js ../../index.html Die_Machtader.heldenbuch.json`.
Bulette und Ankheg beruhen auf dem SRD 5.1 (CC-BY-4.0), alle anderen Werte sind eigene.
