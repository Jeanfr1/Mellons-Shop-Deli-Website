// QA: node scripts/qa.mjs   (QA_BASE=https://… to test the live site)
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve('site');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(b); } }); }).listen(0);
const base = process.env.QA_BASE || `http://localhost:${srv.address().port}/`;
const exe = process.env.CHROME || execSync(`find ~/Library/Caches/ms-playwright -type f -name "Google Chrome for Testing" | head -1`).toString().trim();
const browser = await chromium.launch({ executablePath: exe });
const ORDER = 'https://www.mellonsshop.ie/online-ordering';

let pass = 0, fail = 0;
const ok = (c, name, extra = '') => { c ? pass++ : fail++; if (!c) console.log('  ✗', name, extra); };
const settle = (pg, ms = 500) => pg.waitForTimeout(ms);

const sizes = [[1280, 650], [1440, 790], [1920, 950], [1024, 768], [768, 1024], [390, 844], [375, 667], [360, 740]];
for (const [w, h] of sizes) {
  const phone = w < 761;
  const pg = await browser.newPage({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const bad = []; pg.on('response', r => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await pg.goto(base, { waitUntil: 'load' }); await settle(pg, 2600);
  const tag = `${w}x${h}`;
  const m = await pg.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    const hero = r('.hero'), h1 = r('h1'), cta = r('.hero-foot .button-paper');
    const fl = document.querySelector('.flyer'), slot = r('.club-slot');
    const fr = fl && fl.getBoundingClientRect();
    return {
      sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight,
      hero: hero.height / innerHeight, h1px: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
      h1in: h1.left >= -1 && h1.right <= innerWidth + 1 && h1.top >= 0, cta: cta.bottom <= innerHeight && cta.top > 0,
      intro: document.documentElement.classList.contains('intro'), motion: document.documentElement.classList.contains('motion'),
      flyer: !!fl && getComputedStyle(fl).visibility === 'visible', flyerFit: fr ? Math.max(Math.abs(fr.left + fr.width / 2 - slot.left - slot.width / 2), Math.abs(fr.top + fr.height / 2 - slot.top - slot.height / 2)) : 99,
      club: slot.width / innerWidth,
      small: [...document.querySelectorAll('p,a,li,td,th,span,button,figcaption,caption')].filter(e => e.offsetParent && e.textContent.trim() && !e.children.length && !e.closest('[aria-hidden="true"]') && parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.textContent.trim().slice(0, 20)),
    };
  });
  ok(errs.length === 0, `${tag} no console errors`, errs.join(' | '));
  ok(bad.length === 0, `${tag} no failed requests`, bad.join(' | '));
  ok(m.sw === m.iw && m.iw === w, `${tag} no horizontal overflow`, `${m.sw} / ${m.iw}`);
  ok(m.hero <= 1.001, `${tag} hero ≤ 1 screen`, m.hero.toFixed(3));
  ok(m.h1in, `${tag} H1 inside the viewport`);
  ok(m.h1px <= m.ih * .2, `${tag} H1 in proportion to the screen`, m.h1px.toFixed(0));
  ok(m.cta, `${tag} hero Order Online visible at load`);
  ok(!m.intro && m.motion, `${tag} intro finished, motion on`);
  ok(m.flyer && m.flyerFit < 3, `${tag} sandwich sits on its hero slot`, m.flyerFit.toFixed(1));
  ok(m.small.length === 0, `${tag} no text under 11px`, m.small.join(' | '));

  // natural scroll through the page: overflow, photo upscale, sections reached
  const total = await pg.evaluate(() => document.documentElement.scrollHeight);
  let maxUp = 0, upName = '', maxSz = 0, szName = '', overflow = false;
  for (let y = 0; y < total; y += Math.round(h * .55)) {
    await pg.mouse.wheel(0, Math.round(h * .55)); await settle(pg, 240);
    const s = await pg.evaluate(() => {
      // up: rendered pixels over the file's own width (true upscale); sz: rendered width over the sizes attribute (what a dense screen will pick from)
      let up = 0, n = '', sz = 0, sn = '';
      // drawn width: layout width times every scale up the chain (rotation does not count: a rotated box is not a bigger picture)
      const drawn = el => { let k = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.transform !== 'none') { const m = new DOMMatrix(cs.transform); k *= Math.hypot(m.a, m.b); } if (cs.scale !== 'none') k *= parseFloat(cs.scale); } return el.offsetWidth * k; };
      document.querySelectorAll('main img, .flyer img').forEach(i => {
        if (!i.naturalWidth || getComputedStyle(i).visibility === 'hidden' || !i.getClientRects().length) return;
        const r = i.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.width < 2) return;
        const file = i.currentSrc.split('/').pop(), fw = +(file.match(/-(\d+)\.(webp|png|jpg)$/) || [])[1] || i.naturalWidth;
        const w = drawn(i), k = w * devicePixelRatio / fw; if (k > up) { up = k; n = file; }
        if (i.srcset) { const q = w / i.naturalWidth; if (q > sz) { sz = q; sn = file; } }
      });
      return { up, n, sz, sn, of: document.documentElement.scrollWidth > innerWidth };
    });
    if (s.up > maxUp) { maxUp = s.up; upName = s.n; } if (s.sz > maxSz) { maxSz = s.sz; szName = s.sn; } overflow = overflow || s.of;
  }
  ok(!overflow, `${tag} no overflow while scrolling`);
  ok(maxUp <= 1.15, `${tag} photos not upscaled`, `${maxUp.toFixed(2)} ${upName}`);
  ok(maxSz <= 1.25, `${tag} sizes attributes match the layout`, `${maxSz.toFixed(2)} ${szName}`);

  // the drop: after the counter is in view, the card shows its photo and the flyer is gone
  await pg.evaluate(() => { const c = document.querySelector('.plate--club'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight * .3); }); await settle(pg, 1300);
  const landed = await pg.evaluate(() => ({ img: +getComputedStyle(document.querySelector('.plate--club img')).opacity, fl: getComputedStyle(document.querySelector('.flyer')).visibility }));
  ok(landed.img > .99 && landed.fl === 'hidden', `${tag} sandwich landed on the Classic Club card`, JSON.stringify(landed));
  // mid-flight the flyer is visible and between the two places
  await pg.evaluate(() => scrollTo(0, 0)); await settle(pg, 900);

  // anchors land on their section (from the top, like a nav click)
  for (const id of ['menu', 'grab-and-go', 'catering', 'shop', 'our-story', 'visit']) {
    await pg.evaluate(id => document.getElementById(id).scrollIntoView(), id); await settle(pg, 700);
    const top = await pg.evaluate(id => document.getElementById(id).getBoundingClientRect().top, id);
    ok(top > -6 && top < 140, `${tag} anchor #${id}`, top.toFixed(0));
  }
  // contact buttons receive the pointer
  const hit = await pg.evaluate(async () => {
    const res = [];
    for (const a of document.querySelectorAll('.visit-panel .button, .visit-list a, .deal-copy .button, .catering-panel .button')) {
      a.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 450));
      const r = a.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!(el && (el === a || a.contains(el)))) res.push(a.textContent.trim());
    }
    return res;
  });
  ok(hit.length === 0, `${tag} CTAs receive the pointer`, hit.join(' | '));
  if (phone) {
    await pg.evaluate(() => scrollTo(0, 0)); await settle(pg, 400);
    await pg.tap('.menu-toggle'); await settle(pg, 500);
    ok(await pg.evaluate(() => getComputedStyle(document.getElementById('navigation')).visibility === 'visible'), `${tag} phone menu opens`);
    await pg.tap('#navigation a[href="#visit"]'); await settle(pg, 1400);
    ok(await pg.evaluate(() => !document.documentElement.classList.contains('menu-open')), `${tag} phone menu closes on a link`);
  }
  await pg.close();
}

// facts, links, a11y basics, pause
{
  const pg = await browser.newPage({ viewport: { width: 1440, height: 790 } });
  await pg.goto(base, { waitUntil: 'load' }); await settle(pg, 2600);
  const f = await pg.evaluate(() => ({
    tel: [...document.querySelectorAll('a[href^="tel:"]')].every(a => a.getAttribute('href') === 'tel:+35316680166'),
    mail: [...document.querySelectorAll('a[href^="mailto:"]')].every(a => a.getAttribute('href') === 'mailto:info@mellonsshop.ie'),
    ig: !!document.querySelector('a[href="https://www.instagram.com/mellonsshopdeli/"]'),
    fb: !!document.querySelector('a[href="https://www.facebook.com/MellonsShop/"]'),
    order: [...document.querySelectorAll('a')].filter(a => /order online/i.test(a.textContent)).every(a => a.href === 'https://www.mellonsshop.ie/online-ordering'),
    orders: [...document.querySelectorAll('a')].filter(a => /order online/i.test(a.textContent)).length,
    ext: [...document.querySelectorAll('a[target=_blank]')].every(a => a.rel.includes('noopener')),
    alts: [...document.querySelectorAll('img')].every(i => i.hasAttribute('alt')),
    h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang,
    text: document.body.innerText + ' ' + [...document.querySelectorAll('img')].map(i => i.alt).join(' '),
    icons: [...document.querySelectorAll('use')].every(u => document.querySelector(u.getAttribute('href'))),
    noindex: !!document.querySelector('meta[name=robots][content*=noindex]'),
    today: document.querySelectorAll('.hours tr.is-today').length,
    status: document.querySelector('[data-status]').hidden === false && /Open now|Closed now/.test(document.querySelector('[data-status]').textContent),
    year: document.querySelector('.year').textContent.length > 0,
  }));
  ok(f.tel, 'tel links'); ok(f.mail, 'mail links'); ok(f.ig, 'Instagram link'); ok(f.fb, 'Facebook link');
  ok(f.order && f.orders >= 4, 'every Order Online goes to the official ordering page', f.orders);
  ok(f.ext, 'external links noopener'); ok(f.alts, 'all images have alt'); ok(f.h1 === 1, 'one H1'); ok(f.lang === 'en-IE', 'lang en-IE');
  ok(f.icons, 'icon sprites resolve'); ok(f.noindex, 'noindex while in preview'); ok(f.today === 1, 'today highlighted'); ok(f.status, 'open / closed status shown');
  for (const t of ['56 South Lotts Road', 'D04 K665', '01 668 0166', 'info@mellonsshop.ie', '7am – 4pm', '7am – 3.30pm', 'Closed', '1905', 'credit book', 'only two remain', 'Keogh', 'Coca-Cola', 'Munchd', 'Irish Produce Shop', 'Gift Vouchers', 'Catering', 'Classic Club', 'Italian Job', 'Greek Salad', 'Granola Protein Pot'])
    ok(f.text.includes(t), `content: ${t}`);
  for (const t of ['Lorem', 'conceptual', 'generated', 'mockup', 'TODO', 'kit', 'edited', 'placeholder']) ok(!new RegExp(`\\b${t}\\b`, 'i').test(f.text), `no production note: ${t}`);
  // pause / resume
  await pg.evaluate(() => document.getElementById('motion-toggle').scrollIntoView()); await settle(pg, 400);
  await pg.click('#motion-toggle'); await settle(pg, 500);
  ok(await pg.evaluate(() => !document.documentElement.classList.contains('motion') && !document.querySelector('.pin-spacer') && !document.querySelector('.flyer')), 'pause removes motion, pins and the flyer');
  ok(await pg.evaluate(() => [...document.querySelectorAll('h2, .plate, .tag, .hours tr, .window-label, .club-img')].every(e => +getComputedStyle(e).opacity === 1 && getComputedStyle(e).visibility === 'visible')), 'paused: content visible');
  await pg.click('#motion-toggle'); await settle(pg, 900);
  ok(await pg.evaluate(() => document.documentElement.classList.contains('motion') && !!document.querySelector('.pin-spacer') && !!document.querySelector('.flyer')), 'resume restores motion');
  await pg.evaluate(() => localStorage.removeItem('mellons-motion'));
  await pg.close();
}
// reduced motion + no JS
{
  const c = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 790 } }); const pg = await c.newPage();
  await pg.goto(base, { waitUntil: 'load' }); await settle(pg, 800);
  ok(await pg.evaluate(() => !document.documentElement.classList.contains('motion') && !document.documentElement.classList.contains('intro') && !document.querySelector('.pin-spacer') && getComputedStyle(document.querySelector('.club-img')).visibility === 'visible'), 'reduced motion: still page, sandwich in place');
  await c.close();
  const c2 = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); const p2 = await c2.newPage();
  await p2.goto(base, { waitUntil: 'load' });
  ok(await p2.evaluate(() => +getComputedStyle(document.querySelector('.hero-title .w > span')).opacity === 1 && /ringsend\s+since 1905/i.test(document.body.innerText) && document.body.innerText.includes('Granola Protein Pot')), 'no JS: content readable');
  await c2.close();
}
// first-load weight on a phone
{
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await pg.goto(base, { waitUntil: 'load' }); await settle(pg, 2500);
  const bytes = await pg.evaluate(() => performance.getEntriesByType('resource').reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) + performance.getEntriesByType('navigation')[0].encodedBodySize);
  ok(bytes < 1.6e6, 'phone first load < 1.6 MB', (bytes / 1e6).toFixed(2) + ' MB'); console.log('  phone first load:', (bytes / 1e6).toFixed(2), 'MB');
  await pg.close();
}
// menu page
for (const [w, h] of [[1440, 790], [390, 844]]) {
  const phone = w < 761;
  const pg = await browser.newPage({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
  await pg.goto(base + 'menu.html', { waitUntil: 'load' }); await settle(pg, 1200);
  const tag = `menu ${w}`;
  ok(errs.length === 0, `${tag} no errors`, errs.join(' | '));
  ok(await pg.evaluate(() => document.documentElement.scrollWidth === innerWidth), `${tag} no overflow`);
  ok(await pg.evaluate(() => document.querySelectorAll('.dish').length === 57), `${tag} 57 dishes`);
  await pg.fill('#menu-search', 'club'); await settle(pg, 200);
  const found = await pg.evaluate(() => [...document.querySelectorAll('.dish')].filter(d => !d.hidden).map(d => d.querySelector('.dish-name').textContent));
  ok(found.length === 3 && found.includes('Classic Club'), `${tag} search "club"`, found.join(', '));
  await pg.fill('#menu-search', 'zzzz'); await settle(pg, 200);
  ok(await pg.evaluate(() => !document.querySelector('.no-results').hidden), `${tag} empty search message`);
  await pg.click('.search-clear'); await settle(pg, 200);
  ok(await pg.evaluate(() => [...document.querySelectorAll('.dish')].every(d => !d.hidden)), `${tag} clear restores the menu`);
  await pg.click('.rail-links a[href="#lunch-catering"]'); await settle(pg, 1200);
  const top = await pg.evaluate(() => document.getElementById('lunch-catering').getBoundingClientRect().top);
  ok(top > -4 && top < 260, `${tag} rail link lands`, top.toFixed(0));
  ok(await pg.evaluate(() => [...document.querySelectorAll('a')].filter(a => /order online/i.test(a.textContent)).every(a => a.href === 'https://www.mellonsshop.ie/online-ordering')), `${tag} order links official`);
  await pg.close();
}
await browser.close(); srv.close();
console.log(`\nQA ${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
