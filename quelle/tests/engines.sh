#!/usr/bin/env bash
# Spielrelevante Tests in einer anderen Browser-Engine: HB_ENGINE=webkit|firefox|chromium bash tests/engines.sh
# Läuft in GitHub Actions (hier fehlen WebKit und Firefox). Jede Suite einzeln, Ergebnis als Tabelle.
cd "$(dirname "$0")/.."
ENG="${HB_ENGINE:-chromium}"
bash build.sh >/dev/null || { echo "Build fehlgeschlagen"; exit 1; }
mkdir -p app; [ -e app/fonts ] || ln -s ../fonts app/fonts; [ -e app/assets ] || ln -s ../../www/icons app/assets
python3 build_app.py >/dev/null 2>&1 || echo "Hinweis: App-Version nicht gebaut"
# boot.test.js fehlt absichtlich: Selbst-Update gibt es nur in der Android- und PC-App (beide Chromium).
SUITES=(
  "welcome.test.js|Erster Start"
  "m02.test.js|Held erschaffen am Handy"
  "m01.test.js|Kampfseite am Handy"
  "m03.test.js|Bestiarium am Handy"
  "flow.test.js|Abfragen und Ziele"
  "mechanics.test.js|Zustände, Reaktionen, Zusatzeffekte"
  "savedmg.test.js|Schaden mit Rettungswurf"
  "combat2.test.js|Kampf, Überraschung, Bestiarium"
  "initcall.test.js|Kampfstart und Initiative"
  "npcturn.test.js|Gegnerzug"
  "levelup.test.js|Stufenaufstieg"
  "zauber.test.js|Jeden Zauber wirken"
  "table.test.js|Spieltisch"
  "tablehelp.test.js|Tischhilfen"
  "net.test.js|Online-Tisch (lokaler Server)"
  "backup.test.js|Sichern und Wiederherstellen"
  "daten.test.js app/Heldenbuch.html|Daten in der App"
  "befunde.test.js|Befunde B-01–B-20"
  "undo.test.js|Rückgängig"
  "dice.test.js|Würfel"
  "verlauf.test.js|Würfelverlauf"
  "hilfe.test.js|Hilfe-Stufen"
  "adventure.test.js|Abenteuer Machtader"
  "krug.test.js|Abenteuer Krug"
  "kbuch.test.js|Kampagnenbuch"
  "ddbimport.test.js|Import aus D&D Beyond"
  "overlap.test.js|Überdeckungen, 9 Grössen"
  "gross.test.js --schnell|Alle Ansichten"
  "klick.test.js --schnell|Jeder Knopf"
)
SUM="${GITHUB_STEP_SUMMARY:-/dev/null}"
echo "### Engine: $ENG" >> "$SUM"; echo "" >> "$SUM"; echo "| Suite | Ergebnis | Zeit |" >> "$SUM"; echo "|---|---|---|" >> "$SUM"
FAIL=0; mkdir -p tests/engine-log
# macOS hat kein «timeout»: gtimeout nehmen, sonst ohne Zeitlimit
TO=$(command -v timeout || command -v gtimeout || true); [ -n "$TO" ] && TO="$TO 1500"
for s in "${SUITES[@]}"; do
  cmd="${s%%|*}"; name="${s##*|}"; f="${cmd%% *}"; args="${cmd#"$f"}"
  t0=$(date +%s)
  HB_ENGINE="$ENG" $TO node -r ./tests/_engine.js tests/$f $args > "tests/engine-log/${f%.test.js}.log" 2>&1; rc=$?
  dt=$(( $(date +%s) - t0 ))
  if [ $rc -eq 0 ]; then r="✔"; else r="✘ (Exit $rc)"; FAIL=$((FAIL+1)); echo "---- $name ($f) ----"; grep -E -A25 "✘|FAIL|Error|rror:" "tests/engine-log/${f%.test.js}.log" | head -80; fi
  echo "== $name ($f$args): $r in ${dt}s"
  echo "| $name | $r | ${dt}s |" >> "$SUM"
done
echo "" >> "$SUM"; echo "Fehlgeschlagen: $FAIL von ${#SUITES[@]}" >> "$SUM"
echo "Fehlgeschlagen: $FAIL von ${#SUITES[@]}"
exit $FAIL
