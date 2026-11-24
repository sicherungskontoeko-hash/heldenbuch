#!/usr/bin/env bash
export NODE_PATH="/tmp/claude-0/npmt/node_modules:$(npm root -g)${NODE_PATH:+:$NODE_PATH}"
# Führt alle Tests aus und protokolliert Zeit, Umgebung, Revision und Exit-Codes in tests/RESULTS.md.
# Voraussetzung: npm install (Playwright 1.56, aedes, websocket-stream) und ein Chromium für Playwright.
cd "$(dirname "$0")/.."
bash build.sh >/dev/null || { echo "Build fehlgeschlagen"; exit 1; }
# App-Version bauen: braucht app/fonts und app/assets (Verweise auf quelle/fonts und www/icons)
mkdir -p app; [ -e app/fonts ] || ln -s ../fonts app/fonts; [ -e app/assets ] || ln -s ../../www/icons app/assets
python3 build_app.py >/dev/null 2>&1 || echo "Hinweis: App-Version nicht gebaut – die App-Tests schlagen dann fehl"
OUT=tests/RESULTS.md
REV=$(sha256sum index.html | cut -c1-16)
{
  echo "# Testprotokoll"
  echo ""
  echo "- Zeitpunkt: $(date -Iseconds)"
  echo "- Revision (SHA-256 von index.html, gekürzt): $REV"
  echo "- Node: $(node --version) · Playwright: $(node -p "require('playwright/package.json').version" 2>/dev/null)"
  echo "- Browser: $(node -e "require('playwright').chromium.launch().then(async b=>{console.log('Chromium '+b.version());await b.close()})" 2>/dev/null)"
  echo "- System: $(uname -sr)"
  echo ""
  echo "| Suite | Exit-Code | Ergebnis |"
  echo "|---|---|---|"
} > $OUT
fail=0
run() { local name=$1; shift; local log; log=$("$@" 2>&1; echo "__RC=$?"); local rc; rc=$(echo "$log" | sed -n 's/^__RC=//p' | tail -1); log=$(echo "$log" | grep -v "agent-proxy\|^__RC="); [ -z "$rc" ] && rc=1; local last; last=$(echo "$log" | grep -E "bestanden|Prüfungen|checked|ran [0-9]|✔|✘" | tail -2 | tr '\n' ' '); [ "$rc" = "0" ] || fail=1; echo "| $name | $rc | ${last:-siehe Konsole} |" >> $OUT; echo "== $name (Exit $rc)"; echo "$log" | tail -4; }
run "Regeltests (rules.test.js)" node tests/rules.test.js
run "Regressionen HB-01–HB-11 (hb.test.js)" node tests/hb.test.js
run "Robustheit & Sonderfälle (cases.test.js)" node tests/cases.test.js
run "Kritischer Audit A01–A06 (audit2.test.js)" node tests/audit2.test.js
run "Erklärkarten ⓘ (info.test.js)" node tests/info.test.js
run "Layout: ⚠ offene Punkte, Menüs (layout.test.js)" node tests/layout.test.js
run "Würfel-Designs (dice.test.js)" node tests/dice.test.js
run "Stufenaufstieg-Assistent (levelup.test.js)" node tests/levelup.test.js
run "Gegnerangriff: Treffer prüfen vor Schaden (npc.test.js)" node tests/npc.test.js
run "Kampf-Nachzügler, Überraschung, Treffer zustellen, Bestiarium (combat2.test.js)" node tests/combat2.test.js
run "SL-Werkzeuge: Zufallsbegegnung, Aufladung, eigene Monster, Beute (dmtools.test.js)" node tests/dmtools.test.js
run "Schaden mit Rettungswurf: erst fragen, dann würfeln (savedmg.test.js)" node tests/savedmg.test.js
run "Abläufe mit Zwischenschritt: Zustände, Reaktionen, Zusatzeffekte (mechanics.test.js)" node tests/mechanics.test.js
run "Aufgeräumter Spieltisch (table.test.js)" node tests/table.test.js
run "Abfragen und Ziele: nichts verdrängt, Ziel festgehalten (flow.test.js)" node tests/flow.test.js
run "Sicherung: alles sichern und wiederherstellen (backup.test.js)" node tests/backup.test.js
run "Willkommen: Name beim ersten Start (welcome.test.js)" node tests/welcome.test.js
run "Willkommen in der App (welcome.test.js app)" node tests/welcome.test.js app/Heldenbuch.html
run "Spielabend sichern, Stolpersteine (pflege.test.js)" node tests/pflege.test.js
run "Import aus D&D Beyond (ddbimport.test.js)" node tests/ddbimport.test.js
run "Import aus D&D Beyond (ddbimport.test.js app)" node tests/ddbimport.test.js app/Heldenbuch.html
run "Spielabend sichern, Stolpersteine, Server (pflege.test.js app)" node tests/pflege.test.js app/Heldenbuch.html
run "Kampagnenbuch: Personen, Orte, Aufträge (kbuch.test.js)" node tests/kbuch.test.js
run "Kampagnenbuch in der App (kbuch.test.js app)" node tests/kbuch.test.js app/Heldenbuch.html
run "Überdeckungen: 9 Bildschirmgrössen, alle Ansichten (overlap.test.js)" node tests/overlap.test.js
run "Überdeckungen in der App (overlap.test.js app)" node tests/overlap.test.js app/Heldenbuch.html
run "Claude-Desktop-Brücke: MCP, Empfänger, Einrichtung (bruecke.test.js)" node tests/bruecke.test.js
run "Claude-Desktop-Brücke in der App (bruecke.test.js app)" node tests/bruecke.test.js app/Heldenbuch.html
run "Download-Seite: Geräte, feste Links, Version (download.test.js)" node tests/download.test.js
if [ -n "$HB_ELECTRON" ] && [ -x "$HB_ELECTRON" ] && command -v xvfb-run >/dev/null; then run "PC-App echt: Electron + Brücke + Claude-Desktop-Eintrag (desktop.test.js)" xvfb-run -a node tests/desktop.test.js; else echo "Hinweis: desktop.test.js übersprungen (HB_ELECTRON nicht gesetzt)"; fi
run "Hilfe-Stufe: Einsteiger, Standard, Erfahren (hilfe.test.js)" node tests/hilfe.test.js
run "Aufgeräumter Bogen: Kopfleiste, Kampfseite, Heldenliste (bogen.test.js)" node tests/bogen.test.js
run "Würfelverlauf (verlauf.test.js)" node tests/verlauf.test.js
run "Rückgängig, Wiederholen, Zug zurückspulen (undo.test.js)" node tests/undo.test.js
run "Claude als Helfer der Spielleitung (slhelfer.test.js)" node tests/slhelfer.test.js
run "Gegnerzug: Angriffe zählen, Zug beenden (npcturn.test.js)" node tests/npcturn.test.js
run "Monsterbilder (mobpics.test.js)" node tests/mobpics.test.js
run "Unterklassen-Bilder (subpics.test.js)" node tests/subpics.test.js
run "Kampfseite am Handy: Angriffe früher, Warnungen oben (m01.test.js)" node tests/m01.test.js
run "Bestiarium am Handy: Suche vor Einleitung (m03.test.js)" node tests/m03.test.js
run "Erschaffen am Handy: Auswahl vor Zusammenfassung (m02.test.js)" node tests/m02.test.js
run "Grosstest: alle Ansichten, Reiter, Schritte, Klassen, Stimmungen (gross.test.js)" node tests/gross.test.js
run "Grosstest in der App (gross.test.js app)" node tests/gross.test.js app/Heldenbuch.html --schnell
run "Klick-Fuzz: jeder Knopf in jeder Ansicht (klick.test.js)" node tests/klick.test.js
run "Daten: Sichern, Laden, Neustart, alte und kaputte Dateien, 5600 Kombinationen (daten.test.js)" node tests/daten.test.js
run "Daten in der App (daten.test.js app)" node tests/daten.test.js app/Heldenbuch.html
run "Jeden Zauber wirken (zauber.test.js)" node tests/zauber.test.js
run "Lange Zufallssitzung (affe.test.js)" node tests/affe.test.js --schritte=500
run "Befunde B-01–B-20 des Grosstests v1.9.40 (befunde.test.js)" node tests/befunde.test.js
run "Lesbarkeit: Kontrast in allen Stimmungen (kontrast.test.js)" node tests/kontrast.test.js
run "Stimmungen: Wechsel, Zeichenrate, Aus und reduzierte Bewegung (stimmung.test.js)" node tests/stimmung.test.js
run "Langsames Handy: CPU 4× gedrosselt (handy.test.js app)" node tests/handy.test.js app/Heldenbuch.html --drossel=4
run "Abgleich mit dem SRD 5.2: Zauber und Monster (srd.test.js)" node tests/srd.test.js
run "Online-Tisch mit drei Geräten, lokal (echt.test.js --lokal)" node tests/echt.test.js --lokal
run "Online-Tisch, Server vergisst gespeicherte Nachrichten (echt.test.js --ohne-speicher)" node tests/echt.test.js --lokal --ohne-speicher
run "Kampfstart: Initiative-Fenster, Auswahl (initcall.test.js)" node tests/initcall.test.js
run "Tischhilfen: passive Werte, Rast für alle, EP nach dem Kampf (tablehelp.test.js)" node tests/tablehelp.test.js
run "Gegenstände: SRD-Liste, Flüche, Ausrüstung (items.test.js)" node tests/items.test.js
run "Rettungswürfe der Monster (mobsaves.test.js)" node tests/mobsaves.test.js
run "Leistung: Zwischenspeicher, ruhige Listen, Spieltisch, Effekte (perf.test.js)" node tests/perf.test.js
run "Gesinnung: neun Gesinnungen mit Erklärung (align.test.js)" node tests/align.test.js
run "Abenteuer: Machtader, Kampf auf Knopfdruck, Entscheidungen, Laden (adventure.test.js)" node tests/adventure.test.js
run "Abenteuer: Wirtshaus zum letzten Krug (krug.test.js)" node tests/krug.test.js
run "Klicktest kurz (ui.test.js)" bash -c "node tests/ui.test.js || (echo Wiederholung; node tests/ui.test.js)"
run "Abnahme-Klicktest (ui-full.test.js)" node tests/ui-full.test.js
run "Kombinationen Klasse×Unterklasse×Stufe (combos.test.js)" node tests/combos.test.js
for c in bar brd cle dru fig mon pal ran rog sor wlk wiz rk bw fk ma; do run "Zugleisten-Fuzz $c" node tests/turnfuzz.test.js $c; done
if [ -f app/www/index.html ]; then run "Online-Tisch (net.test.js)" node tests/net.test.js; run "Selbst-Update Android-App (boot.test.js)" node tests/boot.test.js; run "Mehrgeräte-Test: SL + 2 Spieler, gleichzeitig, Abbruch, Kampfablauf (multi.test.js)" node tests/multi.test.js ; run "Spielabend mit Abenteuer: SL + 2 Spieler (sitzung.test.js)" node tests/sitzung.test.js; else run "App-Version fehlt: Online-Tisch, Selbst-Update, Mehrgeräte und Spielabend nicht geprüft" false; fi
echo "" >> $OUT; echo "Gesamtergebnis: $([ $fail = 0 ] && echo 'alle Suiten bestanden' || echo 'mindestens eine Suite fehlgeschlagen')" >> $OUT
echo; cat $OUT; exit $fail
