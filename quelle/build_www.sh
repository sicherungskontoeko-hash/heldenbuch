#!/usr/bin/env bash
# Baut die App-Dateien frisch aus den Quelldateien: www/ (Android, PC, Web-App) und Heldenbuch.html (Einzeldatei).
# Läuft in der automatischen Veröffentlichung vor jedem Build, damit Quelle und App nie auseinanderlaufen.
# Lokal: bash quelle/build_www.sh
set -euo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"
PY="$(command -v python3 || command -v python)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
cp "$R"/quelle/*.js "$R"/quelle/shell.html "$R"/quelle/build_app.py "$T"/
mkdir -p "$T/app"
cp -r "$R/quelle/fonts" "$T/app/fonts"
cp -r "$R/www/icons" "$T/app/assets"
(cd "$T" && "$PY" build_app.py)
cp "$T"/app/www/index.html "$T"/app/www/manifest.webmanifest "$T"/app/www/sw.js "$T"/app/www/version.json "$R/www/"
cp "$T/app/Heldenbuch.html" "$R/Heldenbuch.html"
echo "www/ und Heldenbuch.html aus den Quellen gebaut."
