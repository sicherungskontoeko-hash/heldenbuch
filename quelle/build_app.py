#!/usr/bin/env python3
"""Baut die eigenständige App-Version des Heldenbuchs (PWA + Einzeldatei)."""
import base64, json, os, re, shutil, subprocess, time

ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(ROOT, 'app', 'fonts')
OUT = os.path.join(ROOT, 'app', 'www')
VERSION = '1.7.0'
BUILD = int(time.time())

def rd(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()

def b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()

faces = []
for fam, folder, specs in [('Cinzel', 'cinzel', [(500, 'normal'), (600, 'normal'), (700, 'normal')]),
                           ('Alegreya Sans', 'alegreya-sans', [(400, 'normal'), (400, 'italic'), (500, 'normal'), (700, 'normal')]),
                           ('Cinzel Decorative', 'cinzel-decorative', [(700, 'normal')]), ('IM Fell English SC', 'im-fell-english-sc', [(400, 'normal')]),
                           ('Cormorant Garamond', 'cormorant-garamond', [(600, 'normal'), (700, 'normal')]), ('Fredoka', 'fredoka', [(600, 'normal')]),
                           ('Pirata One', 'pirata-one', [(400, 'normal')]), ('Marcellus SC', 'marcellus-sc', [(400, 'normal')]), ('Almendra', 'almendra', [(700, 'normal')])]:
    for w, st in specs:
        fp = os.path.join(FONTS, folder, 'files', f'{folder}-latin-{w}-{st}.woff2')
        faces.append("@font-face{font-family:'%s';font-style:%s;font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, st, w, b64(fp)))
font_css = '<style>' + ''.join(faces) + '</style>'

shell = rd('shell.html')
shell = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', shell)
shell = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n?', font_css + '\n', shell)
shell = shell.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
fav = 'data:image/png;base64,' + b64(os.path.join(ROOT, 'app/assets/favicon-32.png'))
head_extra = ('<link rel="icon" href="%s">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
              '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Heldenbuch">\n'
              '<meta name="description" content="Deutsches D&amp;D-Heldenbuch: Charaktere erschaffen, Bogen, Würfel und gemeinsamer Tisch.">\n') % fav
shell = shell.replace('<title>Heldenbuch</title>', '<title>Heldenbuch</title>\n' + head_extra, 1)

scripts = ['appnet.js', 'data.js', 'spells.js', 'spells2.js', 'spelldata.js', 'calc.js', 'hbclasses.js', 'subs.js', 'subs2.js', 'flavor.js', 'pics.js', 'assets.js', 'crests.js', 'extra.js', 'items2.js', 'scenes.js', 'theme.js', 'theme-fx.js', 'turn.js', 'effects.js', 'rules.js', 'search.js', 'encounter.js', 'monsters2.js', 'randenc.js', 'mobfx.js', 'mobedit.js', 'loot.js', 'explain.js', 'ux.js', 'help.js', 'spellflav.js', 'info.js', 'dice3d.js', 'levelup.js', 'savedmg.js', 'mechanics.js', 'welcome.js', 'mobsaves.js', 'mobpics.js', 'initcall.js', 'app.js']
# Reine Bilddateien als eigene <script>-Blöcke zuerst (nur Latin-1-Zeichen: der Browser liest sie platzsparend, der Programmcode wird schneller übersetzt)
ASSETS = ['scenes.js', 'pics.js', 'assets.js', 'mobpics.js']
asset_js = ''.join('<script>\n' + rd(s) + '\n</script>' for s in ASSETS)
js = '\n'.join(rd(s) for s in scripts if s not in ASSETS)
js = js.replace("const APP_URL = 'https://claude.ai/artifact/TKockfJH2cR2kDJKqb1CCK';", "const APP_URL = '';")
boot = rd('appboot.js').replace('__HB_BUILD__', str(BUILD)).replace('__HB_VERSION__', VERSION)
m = re.search(r'<meta charset="[^"]*">', shell, re.I)
assert m, 'meta charset fehlt'
shell = shell[:m.end()] + '\n<script>\n' + boot + '</script>' + shell[m.end():]
single = shell + asset_js + '<script>\n' + js + '\n</script>\n<!--HB_END-->\n'
pwa = single.replace('<title>Heldenbuch</title>', '<title>Heldenbuch</title>\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">', 1)

if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'icons'))
with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(pwa)
with open(os.path.join(ROOT, 'app', 'Heldenbuch.html'), 'w', encoding='utf-8') as f:
    f.write(single)
for n in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png']:
    shutil.copy(os.path.join(ROOT, 'app/assets', n), os.path.join(OUT, 'icons', n))
manifest = {
    'name': 'Heldenbuch – D&D auf Deutsch', 'short_name': 'Heldenbuch', 'lang': 'de', 'start_url': './', 'scope': './',
    'display': 'standalone', 'orientation': 'any', 'background_color': '#130E0A', 'theme_color': '#130E0A',
    'description': 'Charaktere erschaffen, Charakterbogen, Würfel, Kampagnen-Tisch für Handy und PC.',
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
with open(os.path.join(OUT, 'version.json'), 'w', encoding='utf-8') as f:
    json.dump({'version': VERSION, 'build': BUILD}, f)
with open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
sw = """/* Heldenbuch Service Worker – macht die App offline nutzbar */
const CACHE = 'heldenbuch-%s';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
""" % VERSION
with open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8') as f:
    f.write(sw)
import tempfile
_tmpjs = os.path.join(tempfile.mkdtemp(), 'app_all.js')
with open(_tmpjs, 'w', encoding='utf-8') as f:
    f.write(js)
subprocess.run(['node', '--check', _tmpjs], check=True)
_tb = os.path.join(os.path.dirname(_tmpjs), 'boot.js')
with open(_tb, 'w', encoding='utf-8') as f:
    f.write(boot)
subprocess.run(['node', '--check', _tb], check=True)
print('App gebaut:', os.path.getsize(os.path.join(OUT, 'index.html')) // 1024, 'KB')
