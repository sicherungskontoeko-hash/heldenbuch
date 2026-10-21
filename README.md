# Heldenbuch

Deutsches D&D-Charakterbuch (SRD 5.2) mit Charaktererstellung, Bogen, Würfeln und gemeinsamem Online-Tisch.

Dieses Repository baut automatisch (siehe *Actions*):

- **Android-App** (`Heldenbuch.apk`)
- **Windows** (Installer und portable EXE), **macOS** (DMG), **Linux** (AppImage)
- **Web-App** auf GitHub Pages – für iPhone/iPad über „Zum Home-Bildschirm“

**Web-App:** https://sicherungskontoeko-hash.github.io/heldenbuch/  
**Downloads:** https://github.com/sicherungskontoeko-hash/heldenbuch/releases/latest

Die fertigen Dateien liegen unter **Releases**. Die Anleitung steht in `ANLEITUNG.md`.

## Neu in Version 1.5
- Stufenaufstieg-Assistent: Aufstieg → „Das ist neu“ (Merkmale als Karten, vorher/nachher) → Entscheiden, mit Feier-Effekt.
- Kampf: Gegner würfeln erst den Angriff, die SL prüft den Treffer, dann Schaden; Schaden und Rettungswürfe werden an die Spieler zugestellt. Nachzügler („noch nicht dabei“), Verstärkung, Überraschung, neue Begegnung mit neuer Initiative, besiegte Gegner werden übersprungen, Packen/Stossen, Todesrettungswurf zu Zugbeginn.
- Bestiarium: 184 Kreaturen, nach typischem Fundort und Stufenempfehlung sortiert.
- Handy: Würfelbecher und ⚠ in der Kopfleiste, Menüs als Leiste von unten, nichts verdeckt mehr den Inhalt. Alle Helden lassen sich löschen.

## Neu in Version 1.4
- Würfel: räumliche Würfel (W4 bis W100) in 10 wählbaren Designs, jedes mit eigener Form und eigenem Auftritt bei der natürlichen 20; bei der 1 bebt der Bildschirm und reisst. Am Online-Tisch gehört jedes Set nur einem Helden, die anderen sehen deine Würfel in deinem Design. Effekte voll/ruhig/aus, Geräusche (optional).
- Aufgeräumtes Layout: rotes ⚠ mit offenen Punkten zum Aufklappen und Hinspringen, kompakte Übersicht am Handy, „⋯“-Menü auf dem Bogen, „Mehr“-Menü am PC.
- Name des Helden schon im ersten Schritt, auf dem Bogen antippbar.

## Neu in Version 1.3
- Die Android-App aktualisiert sich selbst: Sie holt neue Versionen von der Web-App und nutzt sie ab dem nächsten Öffnen (oder sofort über „Jetzt“). Eine neue APK ist nur noch für grössere Änderungen an der App selbst nötig.
- Helden bleiben dabei erhalten. Startet eine neue Version nicht sauber, nimmt die App automatisch wieder die eingebaute.

## Neu in Version 1.2
- Erklärkarten beim Erstellen: Ein kleines **i** rechts an Klasse, Unterklasse, Spezies, Hintergrund, Fertigkeiten, Zaubern und Waffen öffnet eine Karte mit Beschreibung, Werten und einem Knopf „Wählen“.
- Zu allen 355 Zaubern ein kurzer Text, wie man sich den Zauber vorstellt, dazu Zeitaufwand, Reichweite, Komponenten, Dauer, Wirkung und die Werte für deinen Helden.
- Kurze Erklärungen zu allen 18 Fertigkeiten und zu den Waffeneigenschaften.

## Neu in Version 1.1
- 16 Klassen und 64 Unterklassen (✦ = Eigenkreationen), Beschreibungen, Klassen- und Speziesbilder, Kontexthilfe
- Regelkern nach D&D 2024: Aktionsökonomie im Kampf, 1 Zauberplatz pro Zug, einmal-pro-Zug-Schaden, Kampfrausch-Dauer, Waffenmeisterschaften, Tiergestalt, Zauberbuch für Rituale, Zielwahl mit Zuständen
- Regeloptionen (Hausregeln), Rückgängig, Rechenweg, Begegnungsplaner, Effekt-Tracker, Regelsuche
- Online-Tisch Ende-zu-Ende verschlüsselt; Spielstände mit Versionsmigration und automatischer Sicherung
- Automatisierte Tests im Ordner `quelle/tests` (`bash tests/run-all.sh`)

Regeln nach dem System Reference Document 5.2 von Wizards of the Coast, lizenziert unter CC-BY-4.0. Kein offizielles Produkt von Wizards of the Coast.
