#!/usr/bin/env python3
"""Erzeugt alle Icon-Ableitungen der Marke Fablecrown aus dem freigegebenen Original.

Quelle (unverändert, nicht neu gestaltet): marke/Fablecrown_Logo_Original.png (1254 × 1254, RGB, schwarze Ecken).
Erlaubt sind laut Auftrag nur technische Ableitungen: Skalieren, Ecken transparent machen, den Burgunder-Hintergrund
für vollflächige Icons bis zum Rand fortsetzen und das ganze Motiv für Masken verkleinern. Motiv, Proportionen und
Farben bleiben unverändert; nichts wird neu gezeichnet oder vektorisiert.

Varianten:
  kachel     abgerundete Kachel wie im Original, Ecken transparent (statt schwarz)
  voll       Hintergrund bis in die Ecken fortgesetzt (für Masken des Systems: iOS, maskable, Android)
  sicher(r)  vollflächig, ganzes Motiv verkleinert, sodass es in einem Kreis mit Radius r × Breite liegt

Aufruf (aus quelle/):  python3 marke/icons.py          schreibt in ../www/icons, ../build, ../android/…, marke/
                       python3 marke/icons.py --pruef  schreibt nur nach marke/vorschau/ (zum Ansehen)
"""
import os, sys, io, base64, hashlib
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
Q = os.path.dirname(HERE); ROOT = os.path.dirname(Q)
MASTER = os.path.join(HERE, 'Fablecrown_Logo_Original.png')
SHA = '7b58e856b952b58a0ae8e029d2b13fe6f9b22101a617b545c6b7297fcab9792b'
APP_BG = (0x13, 0x0E, 0x0A)  # Hintergrund der App (Splash), unverändert

def load():
    raw = open(MASTER, 'rb').read()
    if hashlib.sha256(raw).hexdigest() != SHA:
        sys.exit('Original verändert oder falsche Datei: ' + MASTER)
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    assert im.size == (1254, 1254), im.size
    return im

def tile_mask(a):
    """Innenfläche der Kachel: alles, was nicht zu den schwarzen Ecken gehört."""
    inside = a.max(axis=2) > 14
    inside = ndimage.binary_fill_holes(ndimage.binary_opening(inside, iterations=2))
    lab, n = ndimage.label(inside); big = 1 + int(np.argmax(ndimage.sum(inside, lab, range(1, n + 1))))
    return lab == big

def kachel(im):
    a = np.asarray(im).astype(np.float32)
    m = tile_mask(a).astype(np.float32)
    m = ndimage.gaussian_filter(m, 0.8)  # weiche Kante, wie das Original
    rgba = np.dstack([a, m * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def extend(a, inner, blur=40, band=10):
    """Farbe der innersten Randpixel nach aussen fortsetzen und weich machen."""
    idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    fill = a[idx[0], idx[1]]
    fill = np.dstack([ndimage.gaussian_filter(fill[..., c], blur) for c in range(3)])
    w = ndimage.gaussian_filter(ndimage.binary_erosion(inner, iterations=band).astype(np.float32), band)[..., None]
    return a * w + fill * (1 - w)

def voll(im):
    a = np.asarray(im).astype(np.float32)
    inner = ndimage.binary_erosion(tile_mask(a), iterations=16)  # ohne den hellen Randstreifen
    return Image.fromarray(extend(a, inner).clip(0, 255).astype(np.uint8), 'RGB')

def motif_radius(im):
    """Grösster Abstand eines goldenen Motivpixels vom Mittelpunkt, als Anteil der Kantenlänge."""
    a = np.asarray(im).astype(np.int32)
    gold = (a[..., 1] > 70) & (a[..., 0] > 120)
    gold = ndimage.binary_opening(gold, iterations=1)
    ys, xs = np.nonzero(gold); c = (im.size[0] - 1) / 2
    return float(np.sqrt((xs - c) ** 2 + (ys - c) ** 2).max()) / im.size[0]

def sicher(full, rho, r, size):
    """Ganzes Motiv (mit seinem Hintergrund) so verkleinern, dass es im Kreis r·size liegt; Rand fortsetzen."""
    k = min(1.0, r / rho); inner_px = int(round(size * k))
    big = 1024 if size < 1024 else size
    inner_big = int(round(big * k))
    canvas = np.zeros((big, big, 3), np.float32); mask = np.zeros((big, big), bool)
    o = (big - inner_big) // 2
    canvas[o:o + inner_big, o:o + inner_big] = np.asarray(full.resize((inner_big, inner_big), Image.LANCZOS)).astype(np.float32)
    mask[o + 2:o + inner_big - 2, o + 2:o + inner_big - 2] = True
    out = Image.fromarray(extend(canvas, mask, blur=40).clip(0, 255).astype(np.uint8), 'RGB')
    return out.resize((size, size), Image.LANCZOS)

def rund(img):
    """Runde Maske (für ic_launcher_round)."""
    s = img.size[0] * 4; m = Image.new('L', (s, s), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    out = img.convert('RGBA'); out.putalpha(m.resize(img.size, Image.LANCZOS)); return out

def res(img, n, sharpen=False):
    out = img.resize((n, n), Image.LANCZOS)
    if sharpen and n <= 64: out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=1))
    return out

def splash(tile, w, h):
    bg = Image.new('RGBA', (w, h), APP_BG + (255,)); n = int(round(min(w, h) * 0.32))
    t = res(tile, n); bg.alpha_composite(t, ((w - n) // 2, (h - n) // 2)); return bg.convert('RGB')

def save(img, path, **kw):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fmt = 'WEBP' if path.endswith('.webp') else 'PNG'
    if fmt == 'PNG': kw.setdefault('optimize', True)
    img.save(path, fmt, **kw); return path

def main():
    pruef = '--pruef' in sys.argv
    im = load(); t = kachel(im); f = voll(im); rho = motif_radius(im)
    out = []
    W = (lambda p: os.path.join(HERE, 'vorschau', os.path.basename(os.path.dirname(p)) + '_' + os.path.basename(p))) if pruef else (lambda p: p)
    icons = os.path.join(ROOT, 'www', 'icons')
    out.append(save(res(t, 192), W(os.path.join(icons, 'icon-192.png'))))
    out.append(save(res(t, 512), W(os.path.join(icons, 'icon-512.png'))))
    out.append(save(sicher(f, rho, 0.40, 512), W(os.path.join(icons, 'icon-maskable-512.png'))))
    out.append(save(res(f, 180), W(os.path.join(icons, 'apple-touch-icon.png'))))
    out.append(save(res(t, 32, True), W(os.path.join(icons, 'favicon-32.png'))))
    out.append(save(res(t, 1024), W(os.path.join(ROOT, 'build', 'icon.png'))))
    r = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
    for d, n in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
        out.append(save(res(t, n), W(os.path.join(r, 'mipmap-' + d, 'ic_launcher.png'))))
        out.append(save(rund(sicher(f, rho, 0.47, n)), W(os.path.join(r, 'mipmap-' + d, 'ic_launcher_round.png'))))
        out.append(save(sicher(f, rho, 33 / 108, int(n * 108 / 48)), W(os.path.join(r, 'mipmap-' + d, 'ic_launcher_foreground.png'))))
    if os.path.isdir(r):
        for d in sorted(os.listdir(r)):
            p = os.path.join(r, d, 'splash.png')
            if d.startswith('drawable') and os.path.exists(p):
                w, h = Image.open(p).size; out.append(save(splash(t, w, h), W(p)))
    hdr = save(res(t, 96), os.path.join(HERE, 'vorschau' if pruef else '', 'header-96.webp'), quality=88, method=6)
    out.append(hdr)
    print('Motivradius %.3f der Kantenlänge (Original)' % rho)
    for p in out: print(os.path.relpath(p, ROOT), Image.open(p).size, os.path.getsize(p), 'Bytes')
    b64 = base64.b64encode(open(hdr, 'rb').read()).decode()
    print('Kopf-Logo (data-URI):', len(b64), 'Zeichen')

if __name__ == '__main__':
    main()
