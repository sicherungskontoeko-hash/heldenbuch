#!/usr/bin/env python3
"""Prüfpaket-Builds (GK-09): beide Varianten aus demselben Quellstand, eindeutig benannt, mit Manifest.

Aufruf:  python3 pruefpaket.py <Zielordner>
Baut neu (bash build.sh, python3 build_app.py) und legt ab:
  app/Heldenbuch_Artifact.html    Claude-Artifact-Fassung (index.html; isApp() falsch, kein MQTT, Schriften extern)
  app/Heldenbuch_Standalone.html  eigenständige App als Einzeldatei (APP_MODE 'app', HBNET/MQTT, Schriften eingebettet)
  app/Heldenbuch.html             wie Standalone; alter Paketpfad, bleibt aus Kompatibilität (= Ausgabe von build_app.py)
  app/pwa/                        PWA-Ordner (index.html, manifest.webmanifest, sw.js, version.json, icons/)
  app/MANIFEST.json               Revision, Version, Datum, Variante, Pfade, Bytes, SHA-256, Buildbefehle, Abhängigkeiten
Nichts wird von Hand gepatcht; jede Datei kommt unverändert aus dem Build. Bricht ab, wenn eine Variante nicht
die erwarteten Merkmale hat (dann ist das Paket BLOCKIERT und wird nicht geschrieben)."""
import datetime, hashlib, json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))


def run(cmd, env=None):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, env=env)
    if r.returncode:
        sys.exit('BLOCKIERT: %s schlug fehl:\n%s%s' % (' '.join(cmd), r.stdout[-2000:], r.stderr[-2000:]))
    return r.stdout.strip()


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    out = os.path.abspath(sys.argv[1]); app = os.path.join(out, 'app')
    rev = run(['git', 'rev-parse', 'HEAD']); dirty = run(['git', 'status', '--porcelain', '--', '.'])
    for need in ['app/fonts', 'app/assets']:
        if not os.path.exists(os.path.join(ROOT, need)):
            sys.exit('BLOCKIERT: %s fehlt (Verweis auf fonts bzw. ../www/icons anlegen, siehe tests/run-all.sh)' % need)
    run(['bash', 'build.sh']); run(['python3', 'build_app.py'], env=dict(os.environ))
    art, std, www = os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'app', 'Heldenbuch.html'), os.path.join(ROOT, 'app', 'www')
    a_txt = open(art, encoding='utf-8').read(); s_txt = open(std, encoding='utf-8').read()
    checks = {
        'artifact_kein_app_mode': "APP_MODE = 'app'" not in a_txt and 'APP_MODE="app"' not in a_txt,
        'artifact_ohne_hbnet': 'class HbMqtt' not in a_txt,
        'standalone_app_mode': "APP_MODE = 'app'" in s_txt,
        'standalone_hbnet': 'class HbMqtt' in s_txt and 'const HBNET' in s_txt,
        'standalone_schriften_eingebettet': '@font-face' in s_txt and 'data:font/woff2;base64,' in s_txt,
        'standalone_ohne_google_fonts': 'fonts.googleapis.com' not in s_txt,
    }
    bad = [k for k, v in checks.items() if not v]
    if bad:
        sys.exit('BLOCKIERT: Variantenmerkmale fehlen: ' + ', '.join(bad))
    if os.path.exists(app):
        shutil.rmtree(app)
    os.makedirs(app)
    shutil.copyfile(art, os.path.join(app, 'Heldenbuch_Artifact.html'))
    shutil.copyfile(std, os.path.join(app, 'Heldenbuch_Standalone.html'))
    shutil.copyfile(std, os.path.join(app, 'Heldenbuch.html'))
    shutil.copytree(www, os.path.join(app, 'pwa'), symlinks=False)
    ver = json.load(open(os.path.join(www, 'version.json'), encoding='utf-8'))
    kind = {'Heldenbuch_Artifact.html': 'artifact', 'Heldenbuch_Standalone.html': 'standalone', 'Heldenbuch.html': 'standalone (alter Paketpfad)'}
    files = []
    for dp, _, fs in os.walk(app):
        for f in sorted(fs):
            p = os.path.join(dp, f); rel = os.path.relpath(p, out).replace(os.sep, '/')
            files.append({'pfad': rel, 'variante': kind.get(f, 'pwa' if '/pwa/' in rel else 'sonstiges'), 'bytes': os.path.getsize(p), 'sha256': sha(p)})
    tool = lambda c: (subprocess.run(c, capture_output=True, text=True).stdout or '').strip().splitlines()[0] if shutil.which(c[0]) else 'nicht vorhanden'
    man = {
        'paket': 'Heldenbuch Prüfpaket (GK-09)', 'git_revision': rev, 'arbeitskopie_sauber': not dirty, 'abweichungen_arbeitskopie': dirty.splitlines(),
        'version': ver.get('version'), 'build': ver.get('build'), 'erstellt': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
        'buildbefehle': ['bash build.sh  → index.html (Artifact)', 'python3 build_app.py  → app/Heldenbuch.html (Standalone) und app/www/ (PWA)', 'python3 pruefpaket.py <Ziel>  → dieses Paket'],
        'abhaengigkeiten': {'node': tool(['node', '--version']), 'python': tool(['python3', '--version']), 'bash': tool(['bash', '--version']),
                            'benoetigt': 'build_app.py braucht app/fonts (→ quelle/fonts) und app/assets (→ www/icons); Tests: npm install (Playwright, aedes, websocket-stream)'},
        'variantenpruefung': checks,
        'was_wo_pruefbar': {
            'artifact': 'Claude-Artifact (window.claude: Konto-Speicher, Downloads); Online-Tisch nur über die Claude-Datenbank, kein MQTT. Lokal: file:// mit Ersatz-Datenbank in den Tests.',
            'standalone': 'Eigenständige App: MQTT-Online-Tisch mit Ende-zu-Ende-Verschlüsselung (WebCrypto nur in sicherem Kontext: https oder http://localhost), Schriften eingebettet, offline lesbar.',
            'pwa': 'Wie Standalone, zusätzlich Service Worker und Manifest; nur über http(s) testbar (z. B. lokaler Webserver).',
            'android_electron': 'Nicht Teil dieses Pakets; nur mit der jeweiligen Toolchain/CI baubar.'},
        'dateien': files,
    }
    with open(os.path.join(app, 'MANIFEST.json'), 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=2)
    print('Prüfpaket-Builds in', app, '·', len(files), 'Dateien · Revision', rev[:7], '' if not dirty else '(Arbeitskopie mit Änderungen)')


if __name__ == '__main__':
    main()
