# Testprotokoll

- Zeitpunkt: 2026-10-21T20:20:55+02:00
- Revision (SHA-256 von index.html, gekürzt): 496c243410b198ed
- Node: v22.22.0 · Playwright: 1.56.0
- Browser: Chromium 141.0.7390.37
- System: Linux 6.18.44-fc-v139

| Suite | Exit-Code | Ergebnis |
|---|---|---|
| Regeltests (rules.test.js) | 0 | ✔ Import bereinigt unbekannte Zauber 48 / 48 Tests bestanden  |
| Regressionen HB-01–HB-11 (hb.test.js) | 0 | ✔ HB-11 Bewusstlos ausserhalb des Kampfes: kein Zauber 27 / 27 bestanden · /home/claude/heldenbuch/index.html  |
| Robustheit & Sonderfälle (cases.test.js) | 0 | ✔ HB-26 Fluchklinge: zweite Bonusaktion blockiert, keine Ressource verbraucht 23 / 23 bestanden  |
| Kritischer Audit A01–A06 (audit2.test.js) | 0 | ✔ A06 Negativ: Beenden über den Schalter beendet auch die Konzentration 21 / 21 bestanden · /home/claude/heldenbuch/index.html  |
| Erklärkarten ⓘ (info.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 41 / 41 bestanden  |
| Layout: ⚠ offene Punkte, Menüs (layout.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 29 / 29 bestanden  |
| Würfel-Designs (dice.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 50 / 50 bestanden  |
| Stufenaufstieg-Assistent (levelup.test.js) | 0 | ✔ handy: keine waagrechte Scrollleiste 28 / 28 bestanden  |
| Gegnerangriff: Treffer prüfen vor Schaden (npc.test.js) | 0 | ✔ critExpr verdoppelt alle Würfel 8 / 8 bestanden  |
| Kampf-Nachzügler, Überraschung, Treffer zustellen, Bestiarium (combat2.test.js) | 0 | ✔ Monsterauswahl im Kampf nach Fundort gruppiert 39 / 39 bestanden  |
| Klicktest kurz (ui.test.js) | 0 | ✔ Desktop 1280 ✔ Handy 390 (Touch)  |
| Abnahme-Klicktest (ui-full.test.js) | 0 | ✔ Chromium Desktop 1280: 165/165 Prüfungen ✔ Chromium Handy 390 (Touch): 165/165 Prüfungen  |
| Kombinationen Klasse×Unterklasse×Stufe (combos.test.js) | 0 | checked 1280 bad 0  |
| Zugleisten-Fuzz bar | 0 | ran 218 bad 0  |
| Zugleisten-Fuzz brd | 0 | ran 324 bad 0  |
| Zugleisten-Fuzz cle | 0 | ran 400 bad 0  |
| Zugleisten-Fuzz dru | 0 | ran 342 bad 0  |
| Zugleisten-Fuzz fig | 0 | ran 218 bad 0  |
| Zugleisten-Fuzz mon | 0 | ran 254 bad 0  |
| Zugleisten-Fuzz pal | 0 | ran 376 bad 0  |
| Zugleisten-Fuzz ran | 0 | ran 321 bad 0  |
| Zugleisten-Fuzz rog | 0 | ran 242 bad 0  |
| Zugleisten-Fuzz sor | 0 | ran 396 bad 0  |
| Zugleisten-Fuzz wlk | 0 | ran 388 bad 0  |
| Zugleisten-Fuzz wiz | 0 | ran 294 bad 0  |
| Zugleisten-Fuzz rk | 0 | ran 282 bad 0  |
| Zugleisten-Fuzz bw | 0 | ran 258 bad 0  |
| Zugleisten-Fuzz fk | 0 | ran 218 bad 0  |
| Zugleisten-Fuzz ma | 0 | ran 292 bad 0  |
| Online-Tisch (net.test.js) | 0 | ✔ Nach Verbindungsabbruch: Spieler verbindet neu, Würfe kommen an 7 / 7 bestanden  |
| Selbst-Update Android-App (boot.test.js) | 0 | ✔ Im normalen Browser: keine Update-Logik 16 / 16 bestanden  |

Gesamtergebnis: alle Suiten bestanden
