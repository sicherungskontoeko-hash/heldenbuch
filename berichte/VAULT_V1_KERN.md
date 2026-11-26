# Fablecrown Vault – V1 Kern (lokal, ohne Cloud)

Stand: 2026-11-26. Grundlage: `VAULT_V0_ADR.md`.

## Umfang
- `quelle/vault.js`: Kernmodul (UMD). Es ist **nicht** in die App eingebunden: kein UI, kein Netzverkehr, kein Server.
- `quelle/tests/vault.test.js`: 15 Prüfungen gegen einen Prüfserver im Speicher. Eingetragen in `run-all.sh`.

## Umsetzung
- Der Wiederherstellungsschlüssel hat 128 Bit, dargestellt als 26 Zeichen in Vierergruppen. Das Alphabet enthält kein O, 0, 1 oder 9. Tippfehler werden abgelehnt.
- Aus dem Schlüssel werden per HKDF-SHA-256 abgeleitet:
  - Vault-ID
  - Zugangsschlüssel: Der Server speichert davon nur den SHA-256.
  - AES-GCM-256-Schlüssel
  - HMAC für die Objekt-IDs
- Jedes Objekt wird einzeln verschlüsselt. Die AAD lautet `vid|oid|schema|rev`. Vertauschte oder veränderte Objekte fallen dadurch auf.
- Revisionen laufen über `If-Match`. Bei 409 entsteht ein Konflikt. Der eigene Stand bleibt lokal erhalten, nichts wird still überschrieben.
- Warteschlange mit Bündelung (debounce):
  - offline oder 5xx: exponentieller Rückzug
  - 429: Wartezeit gemäss Server
  - 401/403: Status «gesperrt», die Änderung bleibt lokal
- Beim Wiederherstellen wird zuerst entschlüsselt, dann der Inhalt mit einer Prüffunktion validiert. Beschädigte Objekte werden gemeldet und nicht übernommen.

## Ergebnis
15/15 bestanden (V-01, V-02, V-07, V-08, V-10, V-12, V-15, V-20 sowie 401/429, Tippfehler, Umhängen, Leistung).

## Offen
- V2: Einbindung in die App
  - Einstellungen
  - Statusanzeige
  - Konfliktdialog
  - Verlauf
  - Zwei-Geräte-Test im Browser
- V3: Server und Hosting. **Blockiert**, braucht eine gesonderte Freigabe, weil Kosten entstehen.
