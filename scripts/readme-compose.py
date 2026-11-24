#!/usr/bin/env python3
"""Compose the README images from the captures in qa-out/readme (run scripts/readme-assets.mjs first).

    ~/anaconda3/bin/python3 scripts/readme-compose.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'qa-out/readme'
OUT = ROOT / '.github/assets'
URL = 'mellons-shop-deli-ringsend.vercel.app'
PAPER, PAPER2, RED, DEEP, INK = (251, 247, 241), (243, 231, 215), (179, 13, 27), (108, 8, 18), (37, 25, 22)


def font(size):
    for f in ('/System/Library/Fonts/SFNS.ttf', '/System/Library/Fonts/Helvetica.ttc', '/Library/Fonts/Arial.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(im, r):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = Image.new('RGBA', im.size)
    out.paste(im, (0, 0), mask)
    return out


def shadow(canvas, box, r, blur=26, offset=14, alpha=70):
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + offset, x1, y1 + offset), r, fill=(60, 10, 14, alpha))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


def browser(shot, w):
    """A shot inside a light browser window: bar with three dots and the address."""
    shot = shot.convert('RGB').resize((w, round(shot.height * w / shot.width)), Image.LANCZOS)
    bar = 38
    win = Image.new('RGB', (w, shot.height + bar), (238, 233, 226))
    d = ImageDraw.Draw(win)
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (98, 197, 84)]):
        d.ellipse((16 + i * 20, 13, 28 + i * 20, 25), fill=c)
    pill = (w // 2 - 190, 8, w // 2 + 190, 30)
    d.rounded_rectangle(pill, 11, fill=(255, 255, 255))
    f = font(13)
    tw = d.textlength(URL, font=f)
    d.text((w // 2 - tw / 2, 11), URL, fill=(110, 96, 90), font=f)
    win.paste(shot, (0, bar))
    return rounded(win, 14)


def phone(shot, w):
    """A shot inside a dark phone body with a camera island."""
    shot = shot.convert('RGB').resize((w, round(shot.height * w / shot.width)), Image.LANCZOS)
    # a status bar in the colour of the page's top edge, so the camera island never sits on the content
    sb = 40
    full = Image.new('RGB', (w, shot.height + sb), shot.getpixel((w // 2, 2)))
    full.paste(shot, (0, sb))
    shot = full
    bez = 12
    body = Image.new('RGBA', (w + bez * 2, shot.height + bez * 2), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.width - 1, body.height - 1), 54, fill=(27, 18, 16, 255))
    body.alpha_composite(rounded(shot, 44), (bez, bez))
    ImageDraw.Draw(body).rounded_rectangle((body.width // 2 - 50, bez + 9, body.width // 2 + 50, bez + 33), 12, fill=(10, 8, 8, 255))
    return body


# desktop sections: two columns of browser windows on warm paper
names = ['counter', 'deal', 'catering', 'shop', 'story', 'visit', 'feed', 'menu']
W, gap, col = 1960, 56, 896
wins = [browser(Image.open(SRC / f'd-{n}.png'), col) for n in names]
rows = (len(wins) + 1) // 2
H = gap + rows * (wins[0].height + gap)
canvas = Image.new('RGBA', (W, H), PAPER2 + (255,))
x0 = (W - 2 * col - gap) // 2
for i, win in enumerate(wins):
    x, y = x0 + (i % 2) * (col + gap), gap + (i // 2) * (win.height + gap)
    shadow(canvas, (x, y, x + win.width, y + win.height), 14)
    canvas.alpha_composite(win, (x, y))
canvas.convert('RGB').save(OUT / 'desktop-sections.jpg', quality=84, optimize=True, progressive=True)

# phones on the deli red, with the poster burst behind them
mnames = ['hero', 'counter', 'story', 'visit']
pw, pgap = 372, 54
bodies = [phone(Image.open(SRC / f'm-{n}.png'), pw) for n in mnames]
MW = pgap + len(bodies) * (bodies[0].width + pgap)
MH = bodies[0].height + 2 * 70
bg = Image.new('RGBA', (MW, MH), RED + (255,))
glow = Image.new('RGBA', (MW, MH), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((MW * .15, -MH * .4, MW * .85, MH * 1.4), fill=(227, 23, 31, 255))
bg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(160)))
for i, b in enumerate(bodies):
    x, y = pgap + i * (b.width + pgap), 70
    shadow(bg, (x, y, x + b.width, y + b.height), 54, blur=30, offset=18, alpha=110)
    bg.alpha_composite(b, (x, y))
bg.convert('RGB').save(OUT / 'mobile-screens.jpg', quality=84, optimize=True, progressive=True)

for f in ('banner.png', 'hero-scroll.gif', 'desktop-sections.jpg', 'mobile-screens.jpg'):
    p = OUT / f
    print(f, Image.open(p).size, f'{p.stat().st_size / 1e6:.2f} MB')
