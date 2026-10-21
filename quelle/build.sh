#!/usr/bin/env bash
# Baut index.html aus den Quelldateien. Läuft aus jedem Verzeichnis (Pfade relativ zum Skript).
set -euo pipefail
cd "$(dirname "$0")"
FILES=(data.js spells.js spells2.js spelldata.js calc.js hbclasses.js subs.js subs2.js flavor.js pics.js assets.js crests.js extra.js scenes.js theme.js theme-fx.js turn.js effects.js rules.js search.js encounter.js explain.js ux.js help.js spellflav.js info.js dice3d.js app.js)
missing=0
[ -f shell.html ] || { echo "FEHLT: shell.html" >&2; missing=1; }
for f in "${FILES[@]}"; do [ -f "$f" ] || { echo "FEHLT: $f" >&2; missing=1; }; done
[ $missing -eq 0 ] || { echo "Build abgebrochen: Quelldateien fehlen (assets.js/scenes.js enthalten nur Bilder und liegen dem Quellcode-ZIP ggf. separat bei)." >&2; exit 1; }
TMPD="$(mktemp -d)"; TMP="$TMPD/all.js"; trap 'rm -rf "$TMPD"' EXIT
cat "${FILES[@]}" > "$TMP"
if command -v node >/dev/null; then node --check "$TMP" || { echo "Build abgebrochen: Syntaxfehler" >&2; exit 1; }; echo SYNTAX_OK; else echo "Hinweis: node nicht gefunden, Syntaxprüfung übersprungen" >&2; fi
{ cat shell.html; echo '<script>'; cat "$TMP"; echo '</script>'; } > index.html
wc -c index.html
