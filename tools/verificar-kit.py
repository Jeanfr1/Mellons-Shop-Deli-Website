#!/usr/bin/env python3
"""Verificação de conteúdo e medidas; não substitui a revisão em navegador."""
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit, unquote

from lxml import html
from PIL import Image, ImageFont

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
load = lambda name: json.loads((root / name).read_text(encoding="utf-8"))
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
order = load("docs/business-sources.json")["business"]["order_url"]
menu = load("docs/menu-snapshot.json")
scale = load("docs/scale-contract.json")
photos = load("docs/photo-assets.json")
brand = load("brand/tokens.json")
selection = load("docs/selection.json")
pages = {
    p: html.fromstring(p.read_text(encoding="utf-8"))
    for p in [dist / "index.html", dist / "menu.html", root / "GUIA-VISUAL.html"]
}
link_count = img_count = order_count = 0

def target(page, attr):
    parts = urlsplit(attr)
    if parts.netloc or parts.scheme:
        assert parts.scheme in ("https", "mailto", "tel", "data"), attr
        return None
    local = (page.parent / unquote(parts.path)).resolve() if parts.path else page
    assert local.is_relative_to(root) and local.is_file() and local.stat().st_size > 0, (page.name, attr)
    if parts.fragment:
        assert local in pages and pages[local].xpath("//*[@id=$id]", id=unquote(parts.fragment)), (page.name, attr)
    return local

for path, doc in pages.items():
    ids = doc.xpath("//@id")
    assert len(ids) == len(set(ids)), (path.name, "duplicate ID")
    for labelled in doc.xpath("//*[@aria-labelledby]"):
        assert all(label in ids for label in labelled.get("aria-labelledby").split()), path.name
    assert len(doc.xpath("//main")) == len(doc.xpath("//h1")) == 1, path.name
    assert not doc.xpath("//form|//video|//iframe"), path.name
    for node in doc.xpath("//*[@href or @src or @srcset]"):
        assert node.get("srcset") is None, "Add srcset validation before introducing responsive sources."
        for attr in [node.get("href"), node.get("src")]:
            if attr:
                local = target(path, attr)
                if node.tag == "script" or node.tag in {"img", "image"}:
                    assert local is not None, "The site must open without a network request."
                link_count += 1
        if node.tag == "a" and "Order Online" in node.text_content():
            assert node.get("href") == order
            order_count += 1
    for img in doc.xpath("//img"):
        assert img.get("alt") is not None
        with Image.open(target(path, img.get("src"))) as im:
            assert [int(img.get(k)) for k in ("width", "height")] == list(im.size), img.get("src")
        img_count += 1

home, menu_page = pages[dist / "index.html"], pages[dist / "menu.html"]
main_sections = home.xpath("//main/section")
assert len(main_sections) == 6
assert main_sections[0].xpath(".//h1")[0].get("aria-label") == "Big bites. Local roots."
assert [s.get("id") for s in main_sections[1:]] == [e["id"] for e in load("docs/architecture-lock.json")["scene_order"][1:]]
assert len(main_sections[0].xpath(".//svg//image")) == 3
assert all(x.get("clip-path") and x.get("preserveaspectratio", "").endswith("meet") for x in main_sections[0].xpath(".//svg//image"))
assert order_count >= 5

seen_groups = menu_page.xpath("//*[@data-menu-section]")
assert len(seen_groups) == len(menu["groups"]) == 8
count = 0
for section, model in zip(seen_groups, menu["groups"]):
    assert section.get("id") == model["id"]
    names = [n.text_content() for n in section.xpath(".//*[@class='dish-name']")]
    prices = [n.text_content() for n in section.xpath(".//*[@class='item-price']")]
    assert names == [i["name"] for i in model["items"]]
    assert prices == ["€" + i["price_eur"] for i in model["items"]]
    count += len(names)
assert count == 57
assert menu_page.xpath("//time/@datetime") == [menu["date"]]
assert menu["source"] == order

css = (dist / "styles.css").read_text(encoding="utf-8")
css_urls = re.compile(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^()"'\s]+))\s*\)''')
for page_name, css_data in ((dist / "styles.css", css), (root / "GUIA-VISUAL.html", pages[root / "GUIA-VISUAL.html"].xpath("//style/text()")[0])):
    for asset in css_urls.findall(css_data):
        link = next(part for part in asset if part)
        if not link.startswith("data:"):
            assert target(page_name, link)
            if link.endswith(".woff"):
                assert target(page_name, link).read_bytes().startswith(b"wOFF")

assert not re.search(r"(?:\.hero|\.deal-photo)[^{\n]*\{[^}]*object-fit\s*:\s*cover", css)
assert ".deal-photo { aspect-ratio: 1120/682;" in css
assert re.search(r"\.canvas\s+\{[^}]*width:\s*min\(100%,var\(--canvas\)\)", css)
assert "@media (prefers-reduced-motion: reduce)" in css

def first_rule(text):
    return text.split(":root {", 1)[1].split("}", 1)[0]

desktop_rule = first_rule(css)
tablet_rule = first_rule(css.split("@media (max-width: 54rem)", 1)[1])
mobile_rule = first_rule(css.split("@media (max-width: 42rem)", 1)[1])
def prop(rule, name):
    return re.search(rf"--{name}:\s*([^;]+)", rule)[1].strip()
def rem(text):
    assert text.endswith("rem"), text
    return float(text[:-3]) * scale["base_root_px"]

for key, c in brand["colors"].items():
    assert prop(desktop_rule, key).upper() == c, key
for filename in ("LilitaOne-OFL.txt", "PublicSans-OFL.txt"):
    assert "SIL OPEN FONT LICENSE" in (root / "fonts" / filename).read_text(encoding="utf-8")

measurements = []
canvas_limit = rem(prop(desktop_rule, "canvas"))
assert canvas_limit == scale["virtual_canvas_px"] == 1024
font_path = str(root / "fonts/LilitaOne-Regular.ttf")
for width in scale["review_widths_px"]:
    mobile, tablet = width <= 672, 672 < width <= 864
    rule = mobile_rule if mobile else tablet_rule if tablet else desktop_rule
    gutter = rem(prop(rule, "gutter"))
    stage = min(width, canvas_limit)
    if mobile:
        assert prop(rule, "hero-title") == scale["mobile"]["title_css"]
        assert prop(rule, "hero-subject") == scale["mobile"]["subject_css"]
        title = min(4.35 * 16, max(3.15 * 16, width * .13))
        subject = min(stage - 2 * gutter, 27.5 * 16)
    else:
        title = rem(prop(rule, "hero-title"))
        subject = rem(prop(rule, "hero-subject"))
        assert title == scale["tablet" if tablet else "desktop"]["title_px"]
        assert subject == scale["tablet" if tablet else "desktop"]["subject_px"]
    after_margins = stage - 2 * gutter
    assert subject <= after_margins
    font = ImageFont.truetype(font_path, round(title * 10))
    offsets = [3.66, 1.15, .23, .26] if mobile else [8.1, 4, 1.2, .85]
    measured_line = max(font.getlength(word) / 10 + offset * 16 for word, offset in zip(("BIG", "BITES.", "LOCAL", "ROOTS."), offsets))
    assert measured_line < after_margins
    measurements.append({"viewport_px": width, "canvas_px": stage, "outer_margin_per_side_px": (width-stage)/2,
                         "inner_gutter_px": gutter, "hero_title_px": round(title, 1), "hero_subject_px": round(subject, 1),
                         "max_headline_line_with_indent_px_before_rotation": round(measured_line, 1),
                         "composition": "stacked" if mobile else "side by side"})
assert len({(d["hero_title_px"], d["hero_subject_px"]) for d in measurements if d["viewport_px"] >= 1024}) == 1

for p in photos.values():
    original, optimized = root / p["master"], root / p["file"]
    assert digest(original) == p["master_sha256"]
    with Image.open(original) as im:
        assert list(im.size) == p["source_dimensions"], original.name
        im.load()
    with Image.open(optimized) as im:
        assert im.format == "WEBP" and im.size == (p["width"], p["height"]), optimized.name
        im.load()
        a, b = p["source_dimensions"]
        assert math.isclose(im.width / im.height, a / b, rel_tol=.0015), optimized.name
for f in (root / "images").rglob("*"):
    if f.is_file():
        with Image.open(f) as im:
            im.load()

master_logo = root / "brand" / brand["logo"]["master"]
assert digest(master_logo) == digest(dist / "assets/brand/mellons-logo.png") == brand["logo"]["sha256"]
with Image.open(master_logo) as im:
    rgba = im.convert("RGBA")
    assert list(im.size) == brand["logo"]["size_px"]
    assert rgba.getchannel("A").getextrema() == (255, 255)
    assert all(rgba.getpixel(pt) == (255, 255, 255, 255) for pt in ((0, 0), (674, 0), (0, 648), (674, 648)))
assert digest(root / selection["approved_board"]) == selection["source_sha256"]
assert (root / "references/Menu-Impresso-Oficial.pdf").read_bytes().startswith(b"%PDF")
assert load(".openai/hosting.json") == {"static": {"directory": "dist"}}

subprocess.run(["node", "--check", str(dist / "site.js")], check=True)
subprocess.run(["node", str(root / "tools/verificar-interacao.cjs")], check=True)
report = {
    "method": "Static verification using CSS declarations and font metrics at default root size (16 px); no browser measurement or result is claimed.",
    "widths": measurements, "local_images_checked": img_count, "local_and_external_references_checked": link_count,
    "order_online_ctas_checked": order_count, "menu_items_checked": count, "menu_categories_checked": len(seen_groups),
    "optimized_photos_decoded": len(photos), "live_preview": "Unavailable: preview relay unavailable, OS error 2."
}
(root / "docs/scale-measurements.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Validated: {len(pages)} pages; {img_count} img references; {link_count} total references; {order_count} order CTAs; {count} dishes; {len(photos)} WebP assets.")
print("; ".join(f'{m["viewport_px"]}→{m["canvas_px"]} / title {m["hero_title_px"]} / subject {m["hero_subject_px"]}' for m in measurements))
