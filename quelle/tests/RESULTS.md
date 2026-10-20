# Testprotokoll

- Zeitpunkt: 2026-10-20T22:11:24+02:00
- Revision (SHA-256 von index.html, gekürzt): a3613dcfbdfdf719
- Node: v22.22.0 · Playwright: 1.56.0
- Browser: Chromium 141.0.7390.37
- System: Linux 6.18.44-fc-v139

| Suite | Exit-Code | Ergebnis |
|---|---|---|
| Regeltests (rules.test.js) | 0 | ✔ Import bereinigt unbekannte Zauber 48 / 48 Tests bestanden  |
| Regressionen HB-01–HB-11 (hb.test.js) | 0 | ✔ HB-11 Bewusstlos ausserhalb des Kampfes: kein Zauber 27 / 27 bestanden · /home/claude/heldenbuch/index.html  |
| Robustheit & Sonderfälle (cases.test.js) | 0 | ✔ HB-26 Fluchklinge: zweite Bonusaktion blockiert, keine Ressource verbraucht 23 / 23 bestanden  |
| Kritischer Audit A01–A06 (audit2.test.js) | 0 | ✔ A06 Negativ: Beenden über den Schalter beendet auch die Konzentration 21 / 21 bestanden · /home/claude/heldenbuch/index.html  |
| Klicktest kurz (ui.test.js) | 0 | ✔ Desktop 1280 ✔ Handy 390 (Touch)  |
| Abnahme-Klicktest (ui-full.test.js) | 0 | ✔ Chromium Desktop 1280: 165/165 Prüfungen ✔ Chromium Handy 390 (Touch): 165/165 Prüfungen  |
| Kombinationen Klasse×Unterklasse×Stufe (combos.test.js) | 0 | checked 1280 bad 0  |
| Zugleisten-Fuzz bar | 0 | ran 202 bad 0  |
| Zugleisten-Fuzz brd | 0 | ran 308 bad 0  |
| Zugleisten-Fuzz cle | 0 | ran 384 bad 0  |
| Zugleisten-Fuzz dru | 0 | ran 326 bad 0  |
| Zugleisten-Fuzz fig | 0 | ran 202 bad 0  |
| Zugleisten-Fuzz mon | 0 | ran 238 bad 0  |
| Zugleisten-Fuzz pal | 0 | ran 360 bad 0  |
| Zugleisten-Fuzz ran | 0 | ran 305 bad 0  |
| Zugleisten-Fuzz rog | 0 | ran 226 bad 0  |
| Zugleisten-Fuzz sor | 0 | ran 380 bad 0  |
| Zugleisten-Fuzz wlk | 0 | ran 372 bad 0  |
| Zugleisten-Fuzz wiz | 0 | ran 278 bad 0  |
| Zugleisten-Fuzz rk | 0 | ran 266 bad 0  |
| Zugleisten-Fuzz bw | 0 | ran 242 bad 0  |
| Zugleisten-Fuzz fk | 0 | ran 202 bad 0  |
| Zugleisten-Fuzz ma | 0 | ran 276 bad 0  |
| Online-Tisch (net.test.js) | 0 | ✔ Nach Verbindungsabbruch: Spieler verbindet neu, Würfe kommen an 7 / 7 bestanden  |

Gesamtergebnis: alle Suiten bestanden
