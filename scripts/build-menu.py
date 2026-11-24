#!/usr/bin/env python3
"""Build site/menu.html from docs/menu-snapshot.json (standard library only).

Update names and prices in docs/menu-snapshot.json after checking
https://www.mellonsshop.ie/online-ordering, then run:  python3 scripts/build-menu.py
"""
from html import escape
from pathlib import Path
import datetime
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SNAP = json.loads((ROOT / 'docs/menu-snapshot.json').read_text(encoding='utf-8'))
ORDER = 'https://www.mellonsshop.ie/online-ordering'
DATE = datetime.date.fromisoformat(SNAP['date'])
NICE_DATE = f"{DATE.day} {DATE.strftime('%B %Y')}"

# TODO(mellons): order windows copied from the live ordering page on 24/11/2026; recheck before launch
NOTES = {
    'grab-and-go': 'A freshly made House Sandwich, a can of Coca-Cola and a pack of Keogh’s crisps.',
    'breakfast': 'Online breakfast orders close at 11.15am.',
    'lunch': 'Allow at least 45 minutes for lunch orders. Orders of five or more sandwiches can take up to two hours.',
    'breakfast-catering': 'Monday to Friday, 7.30am–11.15am. Order at least a day ahead; payment in advance.',
    'lunch-catering': 'Monday to Friday, 7.30am–2pm. Order at least a day ahead; payment in advance.',
}
PHOTOS = {  # item name -> (image base name, alt text)
    'House Sandwich + Can of Coca-Cola + Keogh’s Crisps': ('meal-deal-560', 'The Grab & Go meal deal'),
    'Granola Protein Pot': ('granola-480', 'Granola Protein Pot with strawberries'),
    'Over-Night Protein Oats': ('overnight-oats-480', 'Over-Night Protein Oats'),
    'Italian Job': ('italian-job-480', 'The Italian Job sandwich'),
    'Classic Club': ('classic-club-480', 'The Classic Club sandwich'),
    'Greek Salad': ('greek-salad-480', 'Greek Salad bowl'),
    'Caesar Salad': ('caesar-salad-640', 'Caesar Salad bowls'),
    'Pastry & Scone Platter (Breakfast Catering)': ('pastry-scones-720', 'Pastry and scone platter'),
    'Mellon’s Sandwich & Wrap Platter (Lunch Catering)': ('sandwich-platter-720', 'Sandwich and wrap platter'),
    'Sweet Platter (Lunch Catering)': ('sweet-platter-640', 'Chocolate bake with raspberries from the sweet platter'),
}


def clean(name):
    return re.sub(r'\s*\((Breakfast|Lunch) Catering\)$', '', name)


def item_html(item):
    name = item['name']
    thumb = ''
    if name in PHOTOS:
        img, alt = PHOTOS[name]
        thumb = f'<img class="dish-thumb" src="assets/img/{img}.webp" width="96" height="96" loading="lazy" alt="{escape(alt, quote=True)}">'
    return (f'<li class="dish{" has-thumb" if thumb else ""}">{thumb}<span class="dish-name">{escape(clean(name))}</span>'
            f'<span class="dish-dots" aria-hidden="true"></span><span class="dish-price">€{escape(item["price_eur"])}</span></li>')


def group_html(g):
    note = f'<p class="menu-note">{escape(NOTES[g["id"]])}</p>' if g['id'] in NOTES else ''
    items = '\n'.join(item_html(i) for i in g['items'])
    n = len(g['items'])
    return (f'<section class="menu-group" id="{g["id"]}" data-group aria-labelledby="{g["id"]}-h">\n'
            f'<h2 id="{g["id"]}-h">{escape(g["title"])}<span class="menu-count">{n} item{"s" if n != 1 else ""}</span></h2>{note}\n'
            f'<ul class="dishes" role="list">\n{items}\n</ul></section>')


rail = '\n'.join(f'<a href="#{g["id"]}">{escape(g["title"])}</a>' for g in SNAP['groups'])
groups = '\n'.join(group_html(g) for g in SNAP['groups'])
count = sum(len(g['items']) for g in SNAP['groups'])

index = (ROOT / 'site/index.html').read_text(encoding='utf-8')
sprite = re.search(r'<svg class="sprite".*?</svg>', index, re.S).group(0)
footer = re.search(r'<footer class="site-footer">.*?</footer>', index, re.S).group(0)
footer = footer.replace('href="#main"', 'href="index.html"').replace('href="menu.html"', 'href="#menu-list"')

html = f'''<!doctype html>
<html lang="en-IE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>The Deli Menu · Mellon’s Shop &amp; Deli · Ringsend, Dublin 4</title>
  <meta name="description" content="Breakfast, lunch, all-day favourites, crisps, drinks and catering platters from Mellon’s Shop &amp; Deli in Ringsend. Order for collection on our official ordering page.">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#b30d1b">
  <meta property="og:title" content="The Deli Menu · Mellon’s Shop &amp; Deli">
  <link rel="canonical" href="https://mellons-shop-deli-ringsend.vercel.app/menu">
  <meta property="og:url" content="https://mellons-shop-deli-ringsend.vercel.app/menu">
  <meta property="og:image" content="https://mellons-shop-deli-ringsend.vercel.app/assets/og.jpg">
  <link rel="icon" href="assets/brand/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">
  <link rel="preload" href="assets/fonts/LilitaOne.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="styles.css">
  <script src="menu.js" defer></script>
</head>
<body class="menu-page">
  {sprite}
  <a class="skip" href="#menu-list">Skip to the menu</a>
  <header class="site-header" id="top">
    <div class="header-bar">
      <a class="logo" href="index.html" aria-label="Mellon’s Shop &amp; Deli, home">
        <img src="assets/brand/mellons-logo-320.png" srcset="assets/brand/mellons-logo-160.png 160w, assets/brand/mellons-logo-320.png 320w" sizes="(max-width: 760px) 72px, 132px" width="320" height="308" alt="Mellon’s Shop">
      </a>
      <nav class="nav" id="navigation" aria-label="Main">
        <a href="menu.html" aria-current="page">Menu</a>
        <a href="index.html#catering">Catering</a>
        <a href="index.html#our-story">Our Story</a>
        <a href="index.html#shop">Shop</a>
        <a href="index.html#visit">Visit</a>
      </nav>
      <a class="button button-red header-order" href="{ORDER}" target="_blank" rel="noopener">Order Online<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation"><span class="menu-toggle-label">Menu</span><span class="menu-toggle-icon" aria-hidden="true"></span></button>
    </div>
  </header>

  <main id="main">
    <section class="menu-hero" aria-labelledby="menu-title">
      <div class="hero-grain" aria-hidden="true"></div>
      <div class="frame menu-hero-frame">
        <div class="menu-hero-copy">
          <h1 id="menu-title"><span>The deli</span> <span>menu.</span></h1>
          <p>From breakfast rolls and omelettes to salad bowls, freshly cut sandwiches and platters to share. Pick what you fancy, then order for collection.</p>
          <div class="actions">
            <a class="button button-paper" href="{ORDER}" target="_blank" rel="noopener">Order Online<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
            <a class="button button-ghost" href="#breakfast-catering">Catering platters<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
          </div>
        </div>
        <div class="menu-hero-art" aria-hidden="true">
          <img class="mh-italian" src="assets/cut/italian-job-520.webp" width="520" height="579" alt="">
          <img class="mh-greek" src="assets/cut/greek-salad-420.webp" width="420" height="452" alt="">
          <img class="mh-granola" src="assets/cut/granola-420.webp" width="420" height="416" alt="">
        </div>
      </div>
      <svg class="torn torn-bottom" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V18L44 26 88 12 130 22 178 8 220 20 268 10 312 24 356 12 404 20 450 6 494 22 540 12 588 24 630 10 676 20 722 8 768 22 812 14 858 24 904 10 950 20 996 8 1040 22 1086 12 1130 24 1176 10 1220 20 1266 8 1310 22 1356 12 1400 22 1440 14V40Z"/></svg>
    </section>

    <section class="menu-body" id="menu-list" aria-label="Menu">
      <div class="frame menu-layout">
        <aside class="menu-rail">
          <div class="menu-search" data-search hidden>
            <label for="menu-search">Find a dish</label>
            <div class="search-field"><input id="menu-search" type="search" placeholder="Try ‘club’ or ‘oats’" autocomplete="off"><button type="button" class="search-clear" aria-label="Clear the search" hidden>Clear</button></div>
            <p class="search-status" role="status" aria-live="polite"></p>
          </div>
          <nav class="rail-links" aria-label="Menu categories">
{rail}
          </nav>
        </aside>
        <div class="menu-list">
          <p class="price-note">{count} dishes and drinks, with prices as listed on our ordering page on <time datetime="{SNAP['date']}">{NICE_DATE}</time>. For today’s prices, availability, options and allergens, check the <a href="{ORDER}" target="_blank" rel="noopener">live ordering page</a>.</p>
          <p class="no-results" hidden>Nothing matches that search. Try another word, or browse the <a href="{ORDER}" target="_blank" rel="noopener">live menu</a>.</p>
{groups}
          <div class="menu-cta">
            <p>Ready to order?</p>
            <a class="button button-red" href="{ORDER}" target="_blank" rel="noopener">Order Online<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
            <a class="text-link" href="https://www.mellonsshop.ie/_files/ugd/6b296e_6fb9cd21594a44d8b5d6f7fd1b765ff7.pdf" target="_blank" rel="noopener">Printable menu (PDF)<svg aria-hidden="true"><use href="#i-pdf"/></svg></a>
          </div>
        </div>
      </div>
    </section>
  </main>

  {footer}
</body>
</html>
'''
(ROOT / 'site/menu.html').write_text(html, encoding='utf-8')
print(f'site/menu.html · {len(SNAP["groups"])} groups · {count} items · {NICE_DATE}')
