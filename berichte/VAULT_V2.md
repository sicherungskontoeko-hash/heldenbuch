# Fablecrown Vault – Stufe V2 (zwei Geräte, lokal geprüft)

Stand: 2026-11-26. Grundlagen: `VAULT_V0_ADR.md` und `VAULT_V1_KERN.md`.

**Kein Live-Vault aktiv.** In der ausgelieferten App ist `FC_VAULT_URL` leer. Dadurch gilt:
- Es gibt keinen Vault-Knopf.
- Es entsteht kein Netzverkehr.
- Die App verhält sich genau wie vorher.

Der echte Dienst ist Stufe V3. Er ist **BLOCKIERT**, bis Konto, Anbieter und Kosten gesondert freigegeben sind.

## Umfang

### `quelle/vault.js` (Kern)
- Jedes Gerät erhält einen eigenen Gerätezugang. Dieser ist einzeln widerrufbar.
- Ein neues Gerät wird mit einem Kopplungscode verbunden. Der Code ist einmal verwendbar und 10 Minuten gültig.
  - Das Kopplungspaket ist mit dem Code verschlüsselt.
  - Der Code ist kein Dauerzugang.
- Wiederherstellung auf einem neuen Gerät ist auch ohne altes Gerät möglich, nur mit dem Wiederherstellungsschlüssel.
- Das Gerät speichert weder den Wiederherstellungsschlüssel noch die Wiederherstellungs-Berechtigung.
- Der Abgleich (`sync`) holt zuerst neuere Stände und lädt danach hoch. Dabei gilt:
  - Ein lokaler Stand wird nie überfahren, wenn er nicht exakt dem zuletzt abgeglichenen entspricht. Das gilt auch beim ersten Verbinden (V-19).
  - Liegen auf beiden Seiten Änderungen vor, entsteht ein Konflikt. Beide Stände bleiben erhalten.
  - Zur Auflösung stehen «Dieses Gerät gilt», «Anderes Gerät gilt» und «Beide behalten» (Kopie) zur Wahl.
  - Solange ein Konflikt offen ist, wird für diesen Helden nichts hochgeladen.
- Gelöschte Objekte erhalten eine Löschmarke. Ein altes Gerät mit einer Offline-Änderung erzeugt einen Konflikt und kein stilles Wiederbeleben.
- Nach einer Zeitüberschreitung wird exakt dieselbe verschlüsselte Version erneut gesendet. Der Server erkennt die Wiederholung, es entsteht keine zweite Änderung.
  - Die eigene, schon angekommene Version wird als solche erkannt. Es entsteht kein Scheinkonflikt.
- Warteschlange und laufende Uploads werden gespeichert. Nach einem Neustart läuft die Sicherung weiter.
- Verlauf: Der Server hält bis zu 10 Stände pro Objekt.
  - Ein früherer Stand wird als **neue** Revision zurückgeholt.
- Weitere Funktionen:
  - Geräteliste; Gerätenamen sind verschlüsselt.
  - Gerät entfernen.
  - Entkoppeln: Die lokalen Daten bleiben.
  - Vault beim Dienst löschen: Die lokalen Daten bleiben.
- Bei 401/403/404 wird der Vault gesperrt, ohne weitere Wiederholungen.
- Bei 429 gilt die Wartezeit des Servers. Offline oder bei 5xx wächst die Wartezeit, begrenzt auf 5 Minuten.
- Mehrere offene Tabs werden über `navigator.locks` gegenseitig ausgeschlossen.

### `quelle/tools/vault-mock.js` (Prüfserver)
- Läuft nur im Speicher.
- Beschreibt zugleich den API-Vertrag für V3.
- Fehler lassen sich einspeisen; alle Anfragen werden protokolliert.

### `quelle/vaultui.js` (App)
- Knopf «Vault …» unter «Deine Helden», nur wenn ein Dienst eingerichtet ist.
- Der Status erscheint im Knopf und in der Speicheranzeige: «Gesichert», «Offline – lokale Änderungen», «Synchronisierung ausstehend», «Konflikt», «Fehler».
- Bei einem Konflikt erscheint ein einmaliger Hinweis.
- Der Dialog enthält:
  - Aktivieren, mit Erklärung zu Daten, Dienst, Verschlüsselung und den Folgen eines Schlüsselverlusts.
  - Den Wiederherstellungsschlüssel, nur einmal angezeigt.
  - Verbinden mit Code oder Schlüssel. Vorher wird lokal eine Sicherung in `hb_vault_vorher` angelegt.
  - Jetzt synchronisieren.
  - Kopplungscode erzeugen.
  - Konflikte entscheiden.
  - Frühere Stände zurückholen.
  - Geräte anzeigen und entfernen.
  - Entkoppeln.
  - Löschen, nur nach Eintippen von «LÖSCHEN».
- Synchronisiert wird:
  - nach Änderungen gebündelt (8 s)
  - beim Start
  - bei «online»
  - beim Zurückkehren in die App

  Es gibt keine Anfrage pro Klick oder Würfelwurf.
- Übernommene Stände werden vor der Übernahme geprüft: zuerst entschlüsseln, dann Form und Inhalt prüfen (`charShapeErrors` + `validateChar`, `validHb`).
- Der Gerätezustand liegt in `hb_vault`. Er ist nicht Teil von «Alles sichern».

### Bundlegrösse
- Plus 36 KB Quelltext (unkomprimiert), das sind etwa 0,3 % des Bundles.

## Daten im Vault (V2)
- Gesichert: Helden und Hausregeln, je Objekt verschlüsselt.
- **Noch nicht** gesichert: eigene Monster, Begegnungen, SL-Notizen, Abenteuer, Chronik, Bilder und Medien.
  - Die App nennt das im Dialog. Für diese Daten bleibt «Alles sichern».
- Nicht gesichert, bewusst so: Tisch-UID, Raumcode, MQTT-Zustand, Einstellungen.

## Testergebnis (simuliert, kein echtes Gerät)

`tests/vault.test.js`: **38/38**, drei simulierte Geräte gegen den Prüfserver.
- V-02: Fehler beim Anlegen und bei der ersten Sicherung.
- V-03: Wechsel Tablet → Handy → Tablet.
- V-04: Offline-Konflikt.
- V-05: Verschiedene Helden auf beiden Geräten.
- V-06: Parallele Schreibvorgänge mit falscher Uhr.
- V-07: Zeitüberschreitung nach Ausführung, auch mit einer Folgeänderung.
- V-08: Neustart.
- V-09: Wiederherstellung ohne altes Gerät.
- V-10: Falscher Schlüssel, manipuliertes Chiffrat, vertauschte Objekte.
- V-11: Fremder Vault, Kopplung wiederverwendet oder abgelaufen, Gerät widerrufen.
- V-12: Kein Klartext beim Dienst.
- V-13: Verlauf.
- V-14: Löschmarke, Entkoppeln.
- V-15: Fremde Formatversion, ungültige Felder.
- V-16: Zu gross.
- V-19: Eigener Bestand beim Verbinden.
- V-20: 429, offline, 401.
- V-21: 200 Änderungen ergeben 5 Uploads.
- V-22: Löschen.

`tests/vault-app.test.js`: **14/14**, zwei Chromium-Profile über HTTP.
- V-01: Ohne Dienst kein Knopf und kein Netzverkehr.
- Aktivieren, Schlüssel einmalig.
- Koppeln per Code, Übernahme.
- Konflikt im Dialog, «Beide behalten».
- Verlauf.
- Gerät entfernen.
- Netzwerkdaten ohne Klartext.
- Löschen.
- Keine Skriptfehler.

## Offen und ehrlich nicht erfüllt
- **V3** (blockiert): Dienst, Hosting, Quoten, Aufbewahrungsregeln, Datenschutzinformation, Schwachstellenreview.
  - Die Schutzmechanismen gegen massenhaft angelegte Vaults und die Ratenbegrenzung gehören auf den echten Server.
- **V-24**: Echte Handys und Tablets, Flugmodus, Suspend/Resume sind nicht getestet. Alle Gerätefälle oben sind simuliert.
- **V-17 / V-18**:
  - SL-Notizen werden noch nicht gesichert.
  - Wenn derselbe Held auf zwei Geräten gleichzeitig am Online-Tisch ist, ist das Verhalten **nicht geprüft**. Es ist unverändert gegenüber heute; derselbe Fall entsteht schon durch Export und Import.
  - Empfehlung: Am Tisch nur ein Gerät pro Held.
- **QR-Code** für die Kopplung fehlt. Bisher wird der Code getippt.
- Medien und Blobs (V-16-Teil) fehlen.
- Weitere Datenarten fehlen (siehe oben).
- **Schlüsselrotation** nach Kompromittierung ist noch kein eigener Ablauf. Vorgehen bis dahin: neuen Vault anlegen, alten löschen.
- **Browser/PWA**: Gerätezugang und Datenschlüssel liegen im localStorage.
  - Wer das Gerät oder ein Skript in der App kontrolliert (XSS), kann sie lesen.
  - Native sichere Schlüsselablage für Android und Electron ist noch nicht genutzt.
  - Durch Entfernen des Geräts verliert ein solcher Zugang die Verbindung zum Vault. Bereits geladene Daten bleiben beim Angreifer.
- Es gibt keine Aussage über tatsächlich erreichte Sicherheit ohne unabhängige Prüfung.
