# Fablecrown Vault – V0: Architekturentscheid, Bedrohungsmodell, Dateninventar

**Status:** V0 ist ein Entwurf zur Prüfung. Es gibt keinen Code und kein Konto, es wurde nichts deployt und es entstehen keine Kosten. V1 und V2 (lokaler Prototyp mit Mock-Server) sind vorbereitet, aber noch nicht gebaut. V3 ist BLOCKIERT, bis du Anbieter, Konto, Region und Kosten freigibst.

## 1. Dateninventar (Stand Code)

| Speicher | Inhalt | Vault |
|---|---|---|
| `localStorage['heldenbuch']` | Helden (`chars`) und Hausregeln (`hb`) | ja, je Held und je Hausregel ein Objekt |
| `heldenbuch_backup_v1` | Erstsicherung beim ersten Start | nein, bleibt lokal als Rückfall |
| `heldenbuch_dm_<raum>` | SL-Notizen je Raum | ja, nur im persönlichen Vault der SL |
| `hb_adv` | Abenteuerliste und -fortschritt | ja |
| `hb_kbuch`, Chronik, Spielstand (`chrDb`, `kbDb`, `standDb`) | Kampagnenbuch, Chronik | ja, Kampagnenobjekt |
| eigene Monster, Begegnungen (`ownMobs`, `encLoad`) | SL-Inhalte | ja |
| `hb_rules`, `hb_theme`, `hb_dice_fx`, Hilfe-Stufe usw. | Einstellungen | nur ausgewählte persönliche Einstellungen; Gerätewerte bleiben lokal |
| Würfelverlauf (200 Einträge) | lokale Historie | zunächst nein (Datenschutz, keine Doppelerfassung) |
| `heldenbuch_camp`, `heldenbuch_myinit`, UID, Serverwahl | Online-Tisch | nein, gerätegebunden |
| `hb_resume`, `hb_chk_*`, `hb_chkdc` | Bedienzustand, Antworten | nein |

**Grundlage:** Der bestehende Export «Alles sichern» (`exportData(…, true)` mit `backupExtras`) deckt bereits fast alles ab. Vault baut darauf auf: Er nutzt dieselben Objekte, Prüfungen (`importPlan`) und Wiederherstellungswege (`restoreExtras`), nur pro Objekt und versioniert.

## 2. Entscheid (vorläufig, zur Freigabe)

**Local-first mit Ende-zu-Ende-verschlüsselten Objekten und einem schlanken Speicherdienst.**

- **Client**
  - Jede Änderung wird wie heute lokal gespeichert.
  - Eine begrenzte Sync-Warteschlange (Debounce 5–10 s, Backoff, Pause offline) lädt geänderte Objekte verschlüsselt hoch.
  - Kein Netz pro Wurf oder pro `render()`.
- **Server: Worker-API mit Revisionen**
  - Speichert pro Vault nur Chiffrate, Objekt-IDs (zufällig), Revision und Grösse.
  - Bedingtes Schreiben `If-Match: <rev>`: Veraltete Schreibvorgänge werden abgelehnt, unabhängig von der Uhrzeit.
  - Löschmarken versioniert.
- **Kryptografie (nur Web Crypto, nichts selbst erfunden)**
  - Wiederherstellungsschlüssel: 128 Bit Zufall, als 26 Zeichen Base32 in Gruppen angezeigt.
  - Daraus HKDF-SHA-256 mit getrennten Kontexten:
    - `fablecrown-vault-enc-v1` → AES-GCM-256: Nutzdaten, 96-Bit-Zufallsnonce je Objektversion, AAD = Vault-ID|Objekt-ID|Schema|Revision.
    - `fablecrown-vault-auth-v1` → Ed25519 bzw. ECDSA-P-256-Schlüsselpaar zur Anmeldung.
  - Der Server kennt nur den öffentlichen Schlüssel und kann nichts entschlüsseln.
- **Geräte**
  - Jedes Gerät erzeugt ein eigenes Schlüsselpaar.
  - Kopplung: Das alte Gerät zeigt einen QR-Code mit Einmal-Kopplungstoken (5 Min., einmal einlösbar) und dem Recovery-Geheimnis verschlüsselt für den Kopplungskanal. Alternativ den Wiederherstellungsschlüssel eintippen.
  - Widerruf pro Gerät. Er schützt nicht vor bereits kopierten Daten; das steht im Text.
- **Konflikte**
  - Je Objekt (Held, Kampagne). Haben beide Geräte seit der gemeinsamen Basisrevision geändert, gibt es einen Konfliktdialog mit beiden Ständen (Zeit, Gerät): «Diesen behalten» oder «Beide behalten (Kopie)».
  - Kein automatisches Mischen von TP, Gold, Inventar oder Ladungen.
- **Medien (FC-08, später):** eigene verschlüsselte Blobs mit Manifest. Ein Manifest gilt erst als gesichert, wenn alle Blobs vorhanden sind.

**Verworfene Alternativen**
- Reine Datei-Sicherung in fremde Clouds (Google Drive o. ä.): erfordert Konten.
- Gleicher Schlüssel wie Raumcode: gemeinsame Kenntnis, keine Privatheit.
- CRDT oder Feld-Merge: zu komplex und riskant für TP und Inventar.
- Last-Write-Wins nach Uhrzeit: stille Verluste.
- Vault-ID als Passwort: kein Widerruf möglich.

## 3. Bedrohungsmodell (Kurzform)

| Bedrohung | Massnahme | Rest |
|---|---|---|
| Verlorenes Gerät | Gerät widerrufen, Schlüssel rotieren (eigener Ablauf) | lokal gespeicherte Daten bleiben auf dem Gerät |
| Gestohlener Wiederherstellungsschlüssel | Rotation: neuer Schlüssel, alle Objekte neu verschlüsseln, alte Geräte neu koppeln | bis zur Rotation lesbar |
| Erratene Vault-/Objekt-ID | zufällige IDs; Zugriff nur mit signierter Anfrage eines registrierten Geräts | – |
| Kompromittierter Server | sieht nur Chiffrate, Grössen, Zeiten, Anzahl Objekte und Geräte | Metadaten sichtbar (dokumentiert) |
| Replay / alter Stand | Revisionen und bedingtes Schreiben; signierte Anfrage mit Zeitstempel und Nonce | – |
| Manipulierte Daten | AES-GCM mit AAD; nach Entschlüsselung Prüfung mit `importPlan`/`validateChar` (GK-03) | – |
| XSS im Browser | GK-01/07 (Escaping, Schemas); Schlüssel in IndexedDB als nicht exportierbarer CryptoKey | bei kompromittierter Laufzeit ist Schutz begrenzt (ehrlich dokumentiert) |
| Missbrauch des Dienstes | Raten- und Byte-Limits je Gerät und Vault, Quoten, kein öffentliches Schreiben | anonyme Vault-Erzeugung braucht ein Limit pro IP oder Proof-of-Work |
| Protokoll-Downgrade | Schema- und Protokollversion in AAD und Signatur | – |
| Datenverlust | Historie (z. B. 10 Revisionen pro Objekt), lokale Kopie wird erst nach geprüftem Restore ersetzt | Aufbewahrung vor Betrieb festlegen |

## 4. Etappen

- **V1 (lokal):**
  - Modul `vault.js`: Schlüsselableitung, Verschlüsselung, Objekt-Serialisierung, Warteschlange.
  - Mock-Server in den Tests (Node, In-Memory, mit Revisionen und Fehlerinjektion 401/409/429/500).
  - Tests V-01, V-02, V-07, V-08, V-10, V-12, V-15, V-20 gegen den Mock.
  - Aus, solange nicht ausdrücklich aktiviert.
- **V2:** Kopplung, Recovery, Widerruf, Konfliktdialog, Historie, Löschen. Tests V-03 bis V-06, V-09, V-11, V-13, V-14, V-16 bis V-19, V-22, V-23 mit zwei simulierten Geräten.
- **V3:** BLOCKIERT bis zur Freigabe. Betreiberkonto, Worker und Storage, Secrets, Region, Quoten, Löschregeln, echte Geräte (V-21, V-24), Datenschutzhinweis.

## 5. Was der Betreiber für V3 entscheiden muss

- **Anbieter:** Cloudflare (Workers + R2 + Durable Objects für Revisionen) ist ein Vorschlag, nicht festgelegt. Alternativen: Supabase oder ein eigener kleiner Server.
- **Konto:** braucht nur der Betreiber; die Spieler brauchen keines.
- **Region, Aufbewahrung, Quoten:** z. B. 20 MB pro Vault, 10 Revisionen.
- **Kosten:** **noch nicht recherchiert**, um dein Kontingent zu schonen. Vor V3 belege ich die aktuellen Preise und Gratiskontingente aus den offiziellen Anbieterseiten. Frühere Chat-Angaben gelten nicht.

## 6. Grösse und Leistung (Schätzung, nicht gemessen)

- Ein Held hat als JSON rund 1,5–6 KB, verschlüsselt ähnlich.
- Ein typischer Spielabend hat rund 200 Änderungen. Gebündelt alle 10 s ergibt das etwa 60–120 Uploads zu 2–6 KB, also unter 1 MB pro Abend.
- Die App bleibt ohne Vault unverändert. Mit Vault kommt nur ein Hintergrund-Timer dazu, kein Rendern pro Netzantwort.
