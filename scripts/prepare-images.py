#!/usr/bin/env python3
"""Export every picture the site uses into site/assets (WebP, several widths).

Run from the project root after scripts/cutout.py has written the masks:
    ~/anaconda3/bin/python3 scripts/prepare-images.py

Photos are resized only. Cut-outs are the original pixels with the ISNet alpha;
straight edges where a subject leaves the photo frame are feathered so they
never read as a ruler cut. Screenshots sent with the brief lose the viewer UI
(timestamp row, caption bubble, carousel arrows) by cropping, never by painting.
Writes site/assets/manifest.json with sizes and the cut-out registration boxes.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/assets'
IMG = OUT / 'img'
CUT = OUT / 'cut'
IMG.mkdir(parents=True, exist_ok=True)
CUT.mkdir(parents=True, exist_ok=True)
manifest = {'photos': {}, 'cutouts': {}}

PHOTOS = {
    # name: (source, widths, crop box in source px or None)
    'classic-club': ('images/official/classic-club.jpg', [480, 820, 1200], None),
    'italian-job': ('images/official/italian-job.jpg', [480, 820], None),
    'greek-salad': ('images/official/greek-salad.jpg', [480, 820], None),
    'granola': ('images/official/granola.jpg', [480, 820], None),
    'caesar-salad': ('images/official/caesar-salad.jpg', [640, 1000], None),
    'overnight-oats': ('images/official/overnight-oats.jpg', [480, 820], None),
    'sweet-platter': ('images/official/sweet-platter.jpg', [640, 1000], None),
    'meal-deal': ('images/official/meal-deal.jpg', [560, 900, 1200], None),
    'sandwich-platter': ('images/official/sandwich-platter.jpg', [720, 1100, 1600], None),
    'pastry-scones': ('images/official/pastry-scones.jpg', [720, 1100, 1600], None),
    'story-1': ('images/official/story-1.jpg', [640, 1080], None),
    'story-2': ('images/official/story-2.jpg', [640, 1000, 1440], None),
    'mellons-print': ('images/official/mellons-print.jpg', [520, 900], None),
    'gift-card': ('images/official/gift-card.jpg', [520, 900], None),
    'shopfront': ('images/official/shopfront.jpg', [640, 1000, 1500], None),
    'salad-counter': ('images/official/salad-counter.webp', [640, 1080], None),
    # provided screenshots: crop away the viewer UI
    'counter-trays': ('images/provided/counter-trays.webp', [640, 1000], (80, 112, 1264, 1012)),
    'deli-spread': ('images/provided/deli-spread.webp', [640, 1000], (84, 112, 1272, 1020)),
    'sauces': ('images/provided/sauces.webp', [640, 900], (0, 112, 1028, 930)),
    'fruit-pot': ('images/provided/fruit-pot.webp', [560], (0, 112, 758, 1018)),
    'held-wrap-photo': ('images/provided/held-wrap.webp', [560], (0, 112, 772, 1008)),
    'shopfront-detail': ('images/provided/shopfront-detail.webp', [560], (0, 112, 760, 900)),
    'shopfront-wide': ('images/provided/shopfront-wide.webp', [560], (0, 112, 758, 1012)),
}

CUTOUTS = {
    # name: (source, widths, feather px for edges touching the frame, bottom fade start fraction)
    'classic-club': ('images/official/classic-club.jpg', [560, 900, 1300], 46, 0.80),
    'italian-job': ('images/official/italian-job.jpg', [520, 860], 0, None),
    'held-wrap': ('images/provided/held-wrap.webp', [420], 0, None),
    'greek-salad': ('images/official/greek-salad.jpg', [420, 700], 0, None),
    'granola': ('images/official/granola.jpg', [420, 700], 0, None),
    'caesar-salad': ('images/official/caesar-salad.jpg', [420, 700], 0, None),
}


def save_webp(im, path, q=80):
    im.save(path, 'WEBP', quality=q, method=6)
    return path.stat().st_size


for name, (src, widths, crop) in PHOTOS.items():
    im = Image.open(ROOT / src).convert('RGB')
    if crop:
        im = im.crop(crop)
    W, H = im.size
    files = []
    for w in widths:
        w = min(w, W)
        h = round(H * w / W)
        p = IMG / f'{name}-{w}.webp'
        # the largest size only serves high-density screens, where a lighter encode does not show
        size = save_webp(im.resize((w, h), Image.LANCZOS), p, q=72 if w >= 1400 else 80)
        files.append({'w': w, 'h': h, 'file': f'assets/img/{p.name}', 'bytes': size})
    manifest['photos'][name] = {'src': src, 'ratio': [W, H], 'files': files}

for name, (src, widths, feather, fade) in CUTOUTS.items():
    im = Image.open(ROOT / src).convert('RGB')
    a = np.asarray(Image.open(ROOT / f'images/cutouts/{name}-mask.png').convert('L')).astype(np.float32) / 255
    H, W = a.shape
    if feather:
        # subjects that leave the photo frame: soften the straight cut
        ramp = np.clip(np.arange(W) / feather, 0, 1)
        a *= np.minimum(ramp, ramp[::-1])[None, :]
    if fade:
        y0 = int(H * fade)
        ramp = np.ones(H, np.float32)
        t = np.clip((np.arange(H) - y0) / (H - y0), 0, 1)
        ramp = 1 - t * t * (3 - 2 * t)
        a *= ramp[:, None]
    ys, xs = np.where(a > 0.02)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    rgba = np.dstack([np.asarray(im), (a * 255).astype(np.uint8)])
    cut = Image.fromarray(rgba, 'RGBA').crop(box)
    cw, ch = cut.size
    files = []
    for w in widths:
        w = min(w, cw)
        h = round(ch * w / cw)
        p = CUT / f'{name}-{w}.webp'
        size = save_webp(cut.resize((w, h), Image.LANCZOS), p, q=84)
        files.append({'w': w, 'h': h, 'file': f'assets/cut/{p.name}', 'bytes': size})
    manifest['cutouts'][name] = {
        'src': src, 'photo': [W, H], 'box': box,
        # box as fractions of the source photo: lets a cut-out land exactly on its photo
        'boxf': [round(box[0] / W, 5), round(box[1] / H, 5), round(box[2] / W, 5), round(box[3] / H, 5)],
        'files': files,
    }

(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=1))
total = sum(f['bytes'] for k in manifest.values() for v in k.values() for f in v['files'])
print(f"{sum(len(v['files']) for k in manifest.values() for v in k.values())} files, {total/1e6:.1f} MB")
for n, c in manifest['cutouts'].items():
    print(n, c['box'], c['boxf'])
