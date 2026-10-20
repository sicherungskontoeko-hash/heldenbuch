#!/usr/bin/env bash
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
run() { local name=$1; shift; local log; log=$("$@" 2>&1 | grep -v agent-proxy); local rc=${PIPESTATUS[0]}; local last; last=$(echo "$log" | grep -E "bestanden|Prüfungen|checked|ran [0-9]|✔|✘" | tail -2 | tr '\n' ' '); [ "$rc" = "0" ] || fail=1; echo "| $name | $rc | ${last:-siehe Konsole} |" >> $OUT; echo "== $name (Exit $rc)"; echo "$log" | tail -4; }
run "Regeltests (rules.test.js)" node tests/rules.test.js
run "Regressionen HB-01–HB-11 (hb.test.js)" node tests/hb.test.js
run "Robustheit & Sonderfälle (cases.test.js)" node tests/cases.test.js
run "Kritischer Audit A01–A06 (audit2.test.js)" node tests/audit2.test.js
run "Klicktest kurz (ui.test.js)" node tests/ui.test.js
run "Abnahme-Klicktest (ui-full.test.js)" node tests/ui-full.test.js
run "Kombinationen Klasse×Unterklasse×Stufe (combos.test.js)" node tests/combos.test.js
for c in bar brd cle dru fig mon pal ran rog sor wlk wiz rk bw fk ma; do run "Zugleisten-Fuzz $c" node tests/turnfuzz.test.js $c; done
if [ -f app/www/index.html ]; then run "Online-Tisch (net.test.js)" node tests/net.test.js; fi
echo "" >> $OUT; echo "Gesamtergebnis: $([ $fail = 0 ] && echo 'alle Suiten bestanden' || echo 'mindestens eine Suite fehlgeschlagen')" >> $OUT
echo; cat $OUT; exit $fail
