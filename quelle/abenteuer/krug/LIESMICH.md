# Das Wirtshaus zum letzten Krug

Lustiges Eintagesabenteuer für fünf Helden der Stufe 4 (Aufstieg auf 5 vor dem Palast), etwa 14 bis 22 Uhr.
Eingebaut ab Heldenbuch 1.9 (Mehr → Abenteuer).

| Datei | Inhalt |
|---|---|
| krug-lib.js | Bausteine für die Kästen (Vorlesetext, Spielleitung, Rollenspiel, Probe, Kampf, Zähler, Würfeltabelle …) |
| krug-data.js | 11 eigene Monster, 12 Begegnungen, 59 Gegenstände, Merker, 19 Figuren, Kreaturen-Texte |
| krug-cnt.js | Die vier Zähler (Sternepunkte, Goblins, Verdacht, Hitze), einmal definiert |
| krug-story1.js | Vorbereitung, Prolog, Akt 1 (Der letzte Krug) |
| krug-story2.js | Akt 2 (Einkaufen im Hort) |
| krug-story3.js | Akt 3 (Die Prüfung), Akt 4 (Die Hofküche), Finale, Epilog |
| krug-gen.js | Prüft alles (Begegnungen, Gegenstände, Merker, Würfeltabellen) und schreibt `../../adv-krug.js` und `Wirtshaus_zum_letzten_Krug.heldenbuch.json` |

Ändern: Text in den story-Dateien bearbeiten, dann `node krug-gen.js` und `bash ../../build.sh`.

Gegenstände: Schlüssel beginnen mit `krug-`. Sie liegen immer im Heldenbuch, damit Helden sie behalten,
erscheinen in Auswahllisten aber nur, solange das Abenteuer unter „Gegenstände aktiv“ eingeschaltet ist.
