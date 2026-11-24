// README assets from the running page: node scripts/readme-assets.mjs   (then: python3 scripts/readme-compose.py)
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve('site'), tmp = path.resolve('qa-out/readme');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp + '/f', { recursive: true }); fs.mkdirSync('.github/assets', { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(b); } }); }).listen(0);
const base = process.env.QA_BASE || `http://localhost:${srv.address().port}/`;
const exe = execSync(`find ~/Library/Caches/ms-playwright -type f -name "Google Chrome for Testing" | head -1`).toString().trim();
const b = await chromium.launch({ executablePath: exe });
const wait = (pg, ms) => pg.waitForTimeout(ms);
// scroll in small steps so scrubbed scenes settle the way a reader sees them
const glide = async (pg, to, steps = 8, ms = 90) => { const from = await pg.evaluate(() => scrollY); for (let i = 1; i <= steps; i++) { await pg.evaluate(y => scrollTo(0, y), Math.round(from + (to - from) * i / steps)); await wait(pg, ms); } };
const top = (pg, sel, off = 0) => pg.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top + scrollY + o, [sel, off]);

// banner
{
  const pg = await b.newPage({ viewport: { width: 1600, height: 520 } });
  await pg.goto(base); await pg.setContent(`<base href="${base}"><style>
  @font-face{font-family:L;src:url(assets/fonts/LilitaOne.woff2)}@font-face{font-family:P;src:url(assets/fonts/PublicSans.woff2);font-weight:100 900}
  body{margin:0;width:1600px;height:520px;overflow:hidden;position:relative;color:#fff;font-family:P;background:radial-gradient(90% 120% at 70% 45%,#e3171f 0%,#cc121d 50%,#a50c18 100%)}
  .burst{position:absolute;left:820px;top:-330px;width:1180px;height:1180px;border-radius:50%;background:repeating-conic-gradient(rgba(255,236,228,.09) 0 7deg,transparent 7deg 20deg);-webkit-mask:radial-gradient(closest-side,#000 22%,transparent)}
  .logo{position:absolute;left:96px;top:64px;width:112px;height:112px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 16px 30px -16px rgba(70,0,8,.6);overflow:hidden}.logo img{width:96px}
  h1{position:absolute;left:92px;top:196px;margin:0;font:400 112px/.84 L;text-transform:uppercase;text-shadow:0 .045em 0 rgba(100,4,12,.28)}h1 span{display:block}h1 span:nth-child(2){margin-left:60px}
  p{position:absolute;left:250px;top:92px;margin:0;font:700 20px P;letter-spacing:.16em;text-transform:uppercase;color:#ffe2dc}
  .club{position:absolute;right:70px;top:30px;width:640px;rotate:-4deg;filter:drop-shadow(0 30px 30px rgba(70,0,8,.45))}
  .wrap{position:absolute;right:640px;top:330px;width:200px;rotate:-24deg;filter:drop-shadow(0 18px 20px rgba(70,0,8,.38))}</style>
  <div class="burst"></div><div class="logo"><img src="assets/brand/mellons-logo-320.png" alt=""></div><p>Shop &amp; Deli · Ringsend, Dublin 4 · Since 1905</p>
  <h1><span>Big bites.</span><span>Local roots.</span></h1><img class="club" src="assets/cut/classic-club-1300.webp" alt="">`);
  await pg.evaluate(() => document.fonts.ready); await wait(pg, 600);
  await pg.screenshot({ path: '.github/assets/banner.png' }); await pg.close();
}

// hero gif, 1440 x 900: the drop, the pinned poster, the flight onto the Classic Club card, then the rest of the page
{
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  let n = 0; const shot = () => pg.screenshot({ path: `${tmp}/f/f_${String(n++).padStart(4, '0')}.png` });
  const fps = await pg.evaluate(() => new Promise(r => { let k = 0, t0; const f = t => { if (!t0) t0 = t; if (++k === 31) r(Math.round(30000 / (t - t0))); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  console.log('rAF', fps, 'fps');
  // the drop is stepped frame by frame: GSAP's global timeline is paused the moment motion starts and advanced 0.095 s per frame
  await pg.goto(base, { waitUntil: 'commit' });
  await pg.waitForFunction(() => window.gsap && document.documentElement.classList.contains('motion'), null, { polling: 'raf' });
  const t0 = await pg.evaluate(() => { gsap.globalTimeline.pause(); return gsap.globalTimeline.time(); });
  for (let i = 0; i < 24; i++) { await pg.evaluate(t => new Promise(r => { gsap.globalTimeline.time(t); requestAnimationFrame(() => requestAnimationFrame(r)); }), t0 + i * .095); await shot(); }
  await pg.evaluate(() => { gsap.globalTimeline.resume(); }); await wait(pg, 1200);
  for (let i = 0; i < 5; i++) await shot();
  const dock = await pg.evaluate(() => { const c = document.querySelector('.plate--club'), r = c.getBoundingClientRect(); return Math.round(r.top + scrollY + r.height / 2 - innerHeight * .56); });
  for (let i = 1; i <= 30; i++) { await pg.evaluate(y => scrollTo(0, y), Math.round(dock * i / 30)); await wait(pg, 380); await shot(); }
  await wait(pg, 600); for (let i = 0; i < 6; i++) await shot();

  // desktop section stills
  await pg.evaluate(() => scrollTo(0, 0)); await wait(pg, 900);
  const stills = [
    ['counter', async () => glide(pg, dock + 24)], // after the sandwich has landed on its card
    ['deal', async () => glide(pg, await top(pg, '.deal', 60))],
    ['catering', async () => glide(pg, await top(pg, '.catering', -110))],
    ['shop', async () => glide(pg, await top(pg, '.shop', -30))],
    ['story', async () => { const y = await pg.evaluate(() => { const st = ScrollTrigger.getAll().find(t => t.pin && t.trigger.classList.contains('story')); return st.end - 20; }); await glide(pg, y, 14, 110); }],
    ['visit', async () => glide(pg, await top(pg, '.visit', 60))],
    ['feed', async () => glide(pg, await top(pg, '.feed', -20))],
  ];
  for (const [k, go] of stills) { await go(); await wait(pg, 1500); await pg.screenshot({ path: `${tmp}/d-${k}.png` }); }
  await pg.close();
}

// menu page still
{
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto(base + 'menu.html', { waitUntil: 'load' }); await wait(pg, 1600);
  await pg.screenshot({ path: `${tmp}/d-menu.png` }); await pg.close();
}

// phone stills, 390 x 844 at 2x
{
  const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pg.goto(base, { waitUntil: 'load' }); await wait(pg, 3200);
  await pg.screenshot({ path: `${tmp}/m-hero.png` });
  // each phone still is taken once its scene has finished: the sandwich has landed, the year reads today
  const done = sel => pg.evaluate(s => Math.max(...ScrollTrigger.getAll().filter(t => t.trigger && t.trigger.matches(s)).map(t => t.end)), sel);
  for (const [k, y] of [['counter', async () => (await top(pg, '.plate--club', 0)) - 470], ['story', async () => done('.year')], ['visit', async () => top(pg, '.visit-panel', -20)]]) {
    await glide(pg, await y(), 12, 110); await wait(pg, 1600); await pg.screenshot({ path: `${tmp}/m-${k}.png` });
  }
  await pg.close();
}
await b.close(); srv.close();

execSync(`ffmpeg -y -loglevel error -framerate 10 -i ${tmp}/f/f_%04d.png -vf "fps=10,scale=680:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=112:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" -loop 0 .github/assets/hero-scroll.gif`);
console.log('gif', (fs.statSync('.github/assets/hero-scroll.gif').size / 1e6).toFixed(2), 'MB,', fs.readdirSync(tmp + '/f').length, 'frames');
