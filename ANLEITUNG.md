# Heldenbuch als App – Anleitung

Das Heldenbuch gibt es in drei Formen. Alle drei können miteinander spielen, sobald sie im selben **Raum** sind.

| Form | Für wen | Aufwand |
|---|---|---|
| **Heldenbuch.html** | PC und Mac, sofort | Doppelklick |
| **Web-App** (Link) | iPhone, iPad, Android, PC – „Zum Home-Bildschirm“ | einmal GitHub einrichten |
| **Android-App (APK)** und **PC-Programme** (Windows, Mac, Linux) | wer eine echte App installieren möchte | einmal GitHub einrichten |

---

## 1. Sofort loslegen (PC/Mac)

1. `Heldenbuch.html` auf den Computer kopieren.
2. Doppelklick – es öffnet sich im Browser (Chrome, Edge, Firefox oder Safari).
3. Fertig. Deine Helden werden in diesem Browser gespeichert. Der Online-Tisch funktioniert auch hier.

> Tipp: Exportiere deine Helden ab und zu (Bogen → **Exportieren**). So hast du eine Sicherung.

---

## 2. Echte Apps bauen lassen (kostenlos, ca. 10 Minuten, nur einmal)

GitHub baut aus dem Ordner `projekt` automatisch alle Apps und stellt eine Download-Seite bereit.

1. Auf **github.com** ein kostenloses Konto erstellen.
2. Oben rechts **+ → New repository**: Name `heldenbuch`, **Public** wählen, **Create repository**.
3. Auf der neuen Seite **uploading an existing file** anklicken.
4. Den **Inhalt** des Ordners `projekt` (nicht den Ordner selbst) ins Browserfenster ziehen und **Commit changes** klicken.
   - Wichtig: Der versteckte Ordner `.github` muss mit. Auf dem Mac versteckte Dateien mit `Cmd + Shift + .` einblenden.
   - Falls er fehlt: **Add file → Create new file**, als Name `.github/workflows/build.yml` eintippen und den Inhalt aus `WORKFLOW-KOPIE.yml` hineinkopieren.
5. **Settings → Pages → Source: GitHub Actions** auswählen.
6. Oben auf **Actions** klicken. Der Bau startet von selbst und dauert etwa 10–15 Minuten. Falls „Web-App“ beim ersten Mal rot ist: Schritt 5 prüfen und **Re-run jobs** klicken.

Danach findest du:

- **Downloads:** rechts auf der Repository-Seite unter **Releases** → neueste Version:
  - `Heldenbuch.apk` – Android
  - `Heldenbuch-Setup-….exe` (Installer) und `Heldenbuch-Portable-….exe` – Windows
  - `Heldenbuch-….dmg` – Mac
  - `Heldenbuch-….AppImage` – Linux
- **Web-App-Link:** `https://DEIN-NAME.github.io/heldenbuch/`

### Installieren

- **Android:** `Heldenbuch.apk` auf dem Handy herunterladen und öffnen. Beim ersten Mal fragt Android, ob Installationen aus dieser Quelle erlaubt sind – erlauben. (Alternativ: Web-App-Link in Chrome öffnen → Menü ⋮ → **App installieren**.)
- **iPhone/iPad:** Web-App-Link in **Safari** öffnen → Teilen-Symbol → **Zum Home-Bildschirm**. Das Heldenbuch erscheint wie eine App und läuft auch offline.
- **Windows:** Setup-Datei starten. Meldet Windows „Der Computer wurde geschützt“: **Weitere Informationen → Trotzdem ausführen** (die App ist nicht kostenpflichtig signiert).
- **Mac:** DMG öffnen, Heldenbuch in **Programme** ziehen. Beim ersten Start **Rechtsklick → Öffnen**.

Neue Version? Einfach geänderte Dateien wieder hochladen – GitHub baut alles neu.

---

## 3. Gemeinsam spielen

1. **Spielleitung:** unten auf **Tisch** → Name der Runde eingeben → **Raum erstellen**.
2. Auf **Per WhatsApp einladen** tippen. Die Nachricht enthält den **Raumcode** (und bei der Web-App einen Link, der direkt beitritt).
3. **Spieler:** **Tisch** → Raumcode eingeben → **Beitreten**.
4. Ab jetzt sehen alle die Würfe, die Gruppe, die Initiative und wer am Zug ist – egal ob Handy, Tablet oder PC.

Gut zu wissen:

- Es braucht **kein Konto** und **keinen eigenen Server**. Die Geräte verbinden sich über einen kostenlosen öffentlichen Vermittlungsserver (MQTT).
- Wer den Raumcode kennt, kann mitlesen. Teile ihn nur mit deiner Gruppe. Gespeichert werden am Tisch nur Name, Klasse, TP, RK, Zustände und Würfe – nicht deine ganzen Helden.
- Klappt die Verbindung nicht (z. B. Firmen-WLAN), wählt **alle** unter **Tisch → Verbindung** denselben anderen Server.
- **Helden aufs andere Gerät:** **Helden → Aktiven Helden senden** auf dem alten Gerät, auf dem neuen Gerät den Code bei **Empfangen** eingeben.

---

## Hinweise

- Die Claude-Version (Artifact) und die App sind getrennte Welten: Ein Tisch in Claude und ein Raum in der App sind nicht verbunden. Helden kannst du per **Exportieren/Laden** hin- und herschieben.
- Regeln nach dem SRD 5.2 (CC-BY-4.0) in eigener deutscher Zusammenfassung. Mit ✦ markierte Inhalte sind eigene Erfindungen.
- Schriften: Cinzel und Alegreya Sans (SIL Open Font License).
