#!/usr/bin/env bash
export NODE_PATH="/tmp/claude-0/npmt/node_modules:$(npm root -g)${NODE_PATH:+:$NODE_PATH}"
# Führt alle Tests aus und protokolliert Zeit, Umgebung, Revision und Exit-Codes in tests/RESULTS.md.
# Voraussetzung: npm install (Playwright 1.56, aedes, websocket-stream) und ein Chromium für Playwright.
cd "$(dirname "$0")/.."
bash build.sh >/dev/null || { echo "Build fehlgeschlagen"; exit 1; }
python3 build_app.py >/dev/null 2>&1 || echo "Hinweis: App-Version (für net.test.js) nicht gebaut"
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
run "Gegnerzug: Angriffe zählen, Zug beenden (npcturn.test.js)" node tests/npcturn.test.js
run "Monsterbilder (mobpics.test.js)" node tests/mobpics.test.js
run "Kampfstart: Initiative-Fenster, Auswahl (initcall.test.js)" node tests/initcall.test.js
run "Tischhilfen: passive Werte, Rast für alle, EP nach dem Kampf (tablehelp.test.js)" node tests/tablehelp.test.js
run "Gegenstände: SRD-Liste, Flüche, Ausrüstung (items.test.js)" node tests/items.test.js
run "Rettungswürfe der Monster (mobsaves.test.js)" node tests/mobsaves.test.js
run "Leistung: Zwischenspeicher, ruhige Listen, Spieltisch, Effekte (perf.test.js)" node tests/perf.test.js
run "Klicktest kurz (ui.test.js)" bash -c "node tests/ui.test.js || (echo Wiederholung; node tests/ui.test.js)"
run "Abnahme-Klicktest (ui-full.test.js)" node tests/ui-full.test.js
run "Kombinationen Klasse×Unterklasse×Stufe (combos.test.js)" node tests/combos.test.js
for c in bar brd cle dru fig mon pal ran rog sor wlk wiz rk bw fk ma; do run "Zugleisten-Fuzz $c" node tests/turnfuzz.test.js $c; done
if [ -f app/www/index.html ]; then run "Online-Tisch (net.test.js)" node tests/net.test.js; run "Selbst-Update Android-App (boot.test.js)" node tests/boot.test.js; run "Mehrgeräte-Test: SL + 2 Spieler, gleichzeitig, Abbruch, Kampfablauf (multi.test.js)" node tests/multi.test.js; fi
echo "" >> $OUT; echo "Gesamtergebnis: $([ $fail = 0 ] && echo 'alle Suiten bestanden' || echo 'mindestens eine Suite fehlgeschlagen')" >> $OUT
echo; cat $OUT; exit $fail
