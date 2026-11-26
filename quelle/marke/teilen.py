#!/usr/bin/env python3
"""Vorschaubild beim Teilen (www/teilen.jpg, 1200 × 630) für Fablecrown.

Behält das bestehende Motiv (Buch, Würfel, Karte, Kerze) und ersetzt nur die Schrift links: Die alte Zeile
«HELDENBUCH» und ihre Unterzeilen werden mit Holz aus dem unteren, schriftfreien Bereich desselben Bildes überdeckt,
darauf kommen die Bildmarke (aus dem Original, unverändert), der Name und die bisherigen Unterzeilen.
Schriften: Cinzel und Alegreya Sans aus quelle/fonts (SIL OFL), wie in der App.
Die Vorlage ist das alte Bild im Git-Verlauf (Commit b6d5552, www/teilen.jpg); sie liegt als marke/teilen_vorlage.jpg bei.
Aufruf (aus quelle/): python3 marke/teilen.py
"""
import os, io, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__)); Q = os.path.dirname(HERE); ROOT = os.path.dirname(Q)
SRC = os.path.join(HERE, 'teilen_vorlage.jpg'); OUT = os.path.join(ROOT, 'www', 'teilen.jpg')

def font(rel, size):
    t = TTFont(os.path.join(Q, 'fonts', rel)); t.flavor = None
    p = os.path.join(tempfile.mkdtemp(), 'f.ttf'); t.save(p); return ImageFont.truetype(p, size)

def main():
    base = Image.open(SRC).convert('RGB'); W, H = base.size; assert (W, H) == (1200, 630)
    # 1) Schriftbereich (x 0–600, y 190–450) mit Holz aus dem schriftfreien Streifen y 450–630 überdecken
    src = base.crop((0, 450, 600, 630))
    patch = Image.new('RGB', (600, 300)); patch.paste(src.transpose(Image.FLIP_TOP_BOTTOM), (0, 0)); patch.paste(src, (0, 180))
    m = Image.new('L', (600, 300), 0); ImageDraw.Draw(m).rectangle((0, 18, 560, 282), fill=255); m = m.filter(ImageFilter.GaussianBlur(14))
    base.paste(patch, (0, 170), m)
    # leichte Abdunkelung links für Lesbarkeit (wie vorher)
    a = np.asarray(base).astype(np.float32); x = np.arange(W)[None, :, None]
    shade = np.clip(1 - (x / 640.0), 0, 1) * 0.28; a = a * (1 - shade); base = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    # 2) Bildmarke aus dem Original (Kachel mit transparenten Ecken)
    import importlib.util
    spec = importlib.util.spec_from_file_location('icons', os.path.join(HERE, 'icons.py')); icons = importlib.util.module_from_spec(spec); spec.loader.exec_module(icons)
    tile = icons.res(icons.kachel(icons.load()), 120)
    canvas = base.convert('RGBA')
    sh = Image.new('RGBA', (160, 160), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((20, 26, 140, 146), 28, fill=(0, 0, 0, 150)); sh = sh.filter(ImageFilter.GaussianBlur(10))
    canvas.alpha_composite(sh, (40, 150)); canvas.alpha_composite(tile, (60, 168))
    d = ImageDraw.Draw(canvas)
    gold, gold_hi, ink, muted = (226, 174, 82), (243, 207, 132), (241, 230, 210), (205, 190, 165)
    f_name = font('cinzel/files/cinzel-latin-700-normal.woff2', 66)
    f_sub = font('alegreya-sans/files/alegreya-sans-latin-500-normal.woff2', 30)
    f_small = font('alegreya-sans/files/alegreya-sans-latin-400-normal.woff2', 23)
    y = 310
    for dx, dy, col in [(3, 4, (0, 0, 0, 170))]: d.text((58 + dx, y + dy), 'FABLECROWN', font=f_name, fill=col)
    d.text((58, y), 'FABLECROWN', font=f_name, fill=gold_hi)
    tw = d.textlength('FABLECROWN', font=f_name)
    d.line((60, y + 92, 60 + tw, y + 92), fill=gold + (220,), width=2)
    d.text((60, y + 110), 'Dein Held. Dein Tisch.', font=f_sub, fill=ink)
    d.text((60, y + 156), 'Charakterbogen, Würfel und Spieltisch', font=f_small, fill=muted)
    d.text((60, y + 186), 'für D&D auf Deutsch', font=f_small, fill=muted)
    canvas.convert('RGB').save(OUT, 'JPEG', quality=88, optimize=True, progressive=True)
    print(os.path.relpath(OUT, ROOT), os.path.getsize(OUT), 'Bytes')

if __name__ == '__main__':
    main()
