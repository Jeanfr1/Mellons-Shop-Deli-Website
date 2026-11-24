"""Rebuild dist/menu.html from the dated menu snapshot. Python standard library only."""
from html import escape
from pathlib import Path
import json

KIT = Path(__file__).resolve().parents[1]
SNAPSHOT = json.loads((KIT / "docs/menu-snapshot.json").read_text(encoding="utf-8"))
ORDER = escape(SNAPSHOT["source"], quote=True)
PHOTOS = json.loads((KIT / "docs/photo-assets.json").read_text(encoding="utf-8"))
DATE = SNAPSHOT["date"]
display_date = __import__("datetime").date.fromisoformat(DATE).strftime("%d %B %Y").lstrip("0")

NOTES = {
    "grab-and-go": "A House Sandwich, a can of Coca-Cola and Keogh’s crisps.",
    "breakfast": "Online breakfast orders close at 11.15am.",
    "lunch": "Allow at least 45 minutes for lunch orders. Orders for five or more sandwiches may take up to two hours.",
    "breakfast-catering": "Monday to Friday, 7.30am–11.15am.",
    "lunch-catering": "Monday to Friday, 7.30am–2pm.",
}

def photo(key, description, lazy=True, extra=""):
    p = PHOTOS[key]
    path = p["file"].removeprefix("dist/")
    return (
        f'<img src="{path}" width="{p["width"]}" height="{p["height"]}" '
        f'alt="{escape(description, quote=True)}"'
        + (' loading="lazy"' if lazy else '')
        + (' ' + extra if extra else '') + '>'
    )

def group_html(group):
    key = group["id"]
    label = escape(group["title"])
    prefix = ""
    if key == "breakfast-catering":
        prefix = (
            '<aside class="menu-support" id="catering-options"><h2>Catering at Mellon’s</h2>'
            '<p>Order at least one day ahead and pay in advance. '
            'For a meeting or event, confirm availability with the shop.</p>'
            f'<p><a class="text-link" href="{ORDER}">Check current catering options</a></p></aside>'
        )
    notes = f'<p>{escape(NOTES[key])}</p>' if key in NOTES else ""
    rows = "".join(
        f'<li class="menu-dish"><span class="dish-name">{escape(item["name"])}</span>'
        f'<span class="item-price">€{escape(item["price_eur"])}</span></li>\n'
        for item in group["items"]
    )
    return (
        f'{prefix}<section class="menu-section" id="{key}" data-menu-section aria-labelledby="{key}-heading">'
        f'<h2 id="{key}-heading">{label}</h2>{notes}<ul class="menu-dishes">{rows}</ul></section>'
    )

index = "".join(
    f'<a href="#{group["id"]}">{escape(group["title"])}</a>' for group in SNAPSHOT["groups"]
)
sections = "\n".join(group_html(group) for group in SNAPSHOT["groups"])
gallery = "".join(
    f'<figure>{photo(key, alt)}<figcaption>{caption}</figcaption></figure>'
    for key, alt, caption in [
        ("classic-club", "Close-up of Mellon’s Classic Club sandwich", "Classic Club"),
        ("overnight-oats", "Mellon’s overnight oats with fruit", "Over-Night Protein Oats"),
        ("caesar-salad", "Salad photographed for the Mellon’s ordering menu", "Caesar Salad"),
        ("sandwich-platter", "Sandwiches and wraps arranged in a catering tray", "Sandwich &amp; Wrap Platter"),
        ("pastry-scones", "Pastry and scone selection made for catering", "Pastry &amp; Scone Platter"),
        ("salad-counter", "A colourful selection from the Mellon’s salad counter", "From the deli counter"),
    ]
)
content = f"""<!doctype html>
<html lang="en-IE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Browse breakfast, lunch, all-day favourites and catering from Mellon’s Shop & Deli in Ringsend. Order through our official ordering page.">
  <title>Menu &amp; Catering | Mellon’s Shop &amp; Deli</title>
  <link rel="icon" href="assets/brand/mellons-logo.png" type="image/png">
  <link rel="stylesheet" href="styles.css">
  <script src="site.js" defer></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header"><div class="canvas header-inner">
    <a class="logo-pad" href="index.html" aria-label="Mellon’s Shop & Deli, home"><img src="assets/brand/mellons-logo.png" width="675" height="649" alt="Mellon’s Shop"></a>
    <button class="nav-toggle button button-outline" type="button" aria-controls="main-nav" aria-expanded="false" hidden>Menu</button>
    <nav id="main-nav" class="main-nav" aria-label="Main navigation">
      <a href="menu.html" aria-current="page">Menu</a><a href="#catering-options">Catering</a><a href="index.html#our-story">Our Story</a><a href="index.html#shop">Shop</a>
    </nav>
    <a class="button button-red header-order" href="{ORDER}">Order Online</a>
  </div></header>
  <main id="main">
    <section class="menu-intro" aria-labelledby="menu-heading"><div class="canvas menu-intro-inner">
      <div>
        <p class="eyebrow">Fresh from the deli counter</p>
        <h1 id="menu-heading">The deli menu.</h1>
        <p>From breakfast rolls and salad bowls to sandwiches and platters to share. Choose what sounds good, then head to our ordering page for collection.</p>
        <div class="actions"><a class="button button-paper" href="{ORDER}">Order Online</a><a class="button button-outline-light" href="#menu-list">Browse dishes</a></div>
      </div>
      {photo("italian-job", "The Italian Job sandwich from Mellon’s", False, 'class="menu-intro-image"')}
    </div></section>
    <section class="menu-body" id="menu-list" aria-label="Menu categories"><div class="canvas menu-layout">
      <aside class="menu-rail"><p class="eyebrow">On the menu</p><nav aria-label="Menu categories">{index}</nav></aside>
      <div class="menu-list">
        <p class="menu-price-note">Menu and prices reviewed on <time datetime="{DATE}">{display_date}</time>. Check the <a href="{ORDER}">live ordering page</a> for today’s prices, availability, options and allergens.</p>
        <div class="search-controls" hidden>
          <label for="menu-search">Find a dish</label>
          <input id="menu-search" type="search" placeholder="Try ‘Club’ or ‘oats’" autocomplete="off">
          <button class="button button-outline" id="menu-search-reset" type="button">Clear</button>
        </div>
        <p class="search-status" role="status" hidden></p>
        <p class="no-results" hidden>No matching dishes. Try another search or check the live menu.</p>
        {sections}
        <section class="menu-support" aria-labelledby="gallery-title">
          <h2 id="gallery-title">A look at the counter</h2>
          <div class="menu-feature-gallery">{gallery}</div>
          <p>For ingredient and allergen details, check the ordering page or call <a href="tel:+35316680166">01 668 0166</a>.</p>
          <div class="actions"><a class="button button-red" href="{ORDER}">Order Online</a><a class="button button-outline" href="index.html#visit">Find the shop</a></div>
        </section>
      </div>
    </div></section>
  </main>
  <footer class="site-footer"><div class="canvas footer-inner">
    <a class="footer-logo" href="index.html" aria-label="Mellon’s Shop & Deli, home"><img src="assets/brand/mellons-logo.png" width="675" height="649" alt="Mellon’s Shop"></a>
    <div class="footer-links"><a href="index.html#visit">56 South Lotts Road, Dublin 4, D04 K665</a><a href="https://www.mellonsshop.ie/_files/ugd/6b296e_6fb9cd21594a44d8b5d6f7fd1b765ff7.pdf">Printable menu (PDF)</a><a href="mailto:info@mellonsshop.ie">Email us</a></div>
    <a class="button button-red" href="{ORDER}">Order Online</a>
  </div></footer>
</body>
</html>
"""
(KIT / "dist/menu.html").write_text(content, encoding="utf-8")
print("Wrote dist/menu.html with", sum(len(group["items"]) for group in SNAPSHOT["groups"]), "items")
