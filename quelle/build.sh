#!/usr/bin/env bash
# Baut index.html aus den Quelldateien. Läuft aus jedem Verzeichnis (Pfade relativ zum Skript).
set -euo pipefail
cd "$(dirname "$0")"
FILES=(data.js spells.js spells2.js spelldata.js calc.js hbclasses.js subs.js subs2.js flavor.js pics.js assets.js crests.js extra.js items2.js scenes.js theme.js theme-fx.js turn.js effects.js rules.js search.js encounter.js monsters2.js randenc.js mobfx.js mobedit.js loot.js explain.js ux.js help.js spellflav.js info.js dice3d.js levelup.js savedmg.js mechanics.js welcome.js mobsaves.js mobpics.js initcall.js app.js)
missing=0
[ -f shell.html ] || { echo "FEHLT: shell.html" >&2; missing=1; }
for f in "${FILES[@]}"; do [ -f "$f" ] || { echo "FEHLT: $f" >&2; missing=1; }; done
[ $missing -eq 0 ] || { echo "Build abgebrochen: Quelldateien fehlen (assets.js/scenes.js enthalten nur Bilder und liegen dem Quellcode-ZIP ggf. separat bei)." >&2; exit 1; }
TMPD="$(mktemp -d)"; TMP="$TMPD/all.js"; trap 'rm -rf "$TMPD"' EXIT
cat "${FILES[@]}" > "$TMP"
if command -v node >/dev/null; then node --check "$TMP" || { echo "Build abgebrochen: Syntaxfehler" >&2; exit 1; }; echo SYNTAX_OK; else echo "Hinweis: node nicht gefunden, Syntaxprüfung übersprungen" >&2; fi
# Die reinen Bilddateien kommen als eigene <script>-Blöcke zuerst: sie enthalten nur Latin-1-Zeichen, der Browser kann sie
# dann platzsparend (1 Byte pro Zeichen) lesen, und der eigentliche Programmcode wird schneller übersetzt.
ASSETS=(scenes.js pics.js assets.js mobpics.js)
CODE="$TMPD/code.js"; for f in "${FILES[@]}"; do case " ${ASSETS[*]} " in *" $f "*) ;; *) cat "$f" >> "$CODE";; esac; done
if command -v node >/dev/null; then node --check "$CODE" || { echo "Build abgebrochen: Syntaxfehler im Programmcode" >&2; exit 1; }; fi
{ cat shell.html; for f in "${ASSETS[@]}"; do echo '<script>'; cat "$f"; echo '</script>'; done; echo '<script>'; cat "$CODE"; echo '</script>'; } > index.html
wc -c index.html
