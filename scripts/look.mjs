// Visual check: node scripts/look.mjs <width> <height> <label> [step]  → qa-out/<label>-*.jpg + <label>-sheet.jpg
// Captures the load intro at fixed times, then the page at a natural wheel pace.
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { execSync } from 'node:child_process';
const [w = 1440, h = 790, label = 'd', stepArg] = process.argv.slice(2);
const root = path.resolve('site'), out = path.resolve('qa-out'); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(b); } }); }).listen(0);
const base = process.env.QA_BASE || `http://localhost:${srv.address().port}/`;
const exe = process.env.CHROME || execSync(`find ~/Library/Caches/ms-playwright -type f -name "Google Chrome for Testing" | head -1`).toString().trim();
const b = await chromium.launch({ executablePath: exe });
const phone = +w < 700;
const pg = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
pg.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
await pg.goto(base + (process.env.PAGE || ''), { waitUntil: 'commit' });
const t0 = Date.now(); const shots = [];
for (const t of (process.env.NOINTRO ? [] : [120, 380, 640, 900, 1250, 2200])) {
  const wait = t - (Date.now() - t0); if (wait > 0) await pg.waitForTimeout(wait);
  const f = `${out}/${label}-i${t}.jpg`; await pg.screenshot({ path: f, quality: 70 }); shots.push(f);
}
await pg.waitForTimeout(1500);
const total = await pg.evaluate(() => document.documentElement.scrollHeight);
const step = +(stepArg || Math.round(h * .5)); let i = 0;
for (let y = step; y < total - h + step; y += step) {
  await pg.mouse.wheel(0, step); await pg.waitForTimeout(900);
  const f = `${out}/${label}-${String(i++).padStart(2, '0')}.jpg`; await pg.screenshot({ path: f, quality: 70 }); shots.push(f);
}
const m = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, total: document.documentElement.scrollHeight, y: scrollY }));
console.log(JSON.stringify({ label, shots: shots.length, ...m, errs }));
// contact sheet
const cols = phone ? 6 : 4, tw = phone ? 260 : 480, th = Math.round(tw * h / w);
const sheet = await b.newPage({ viewport: { width: cols * (tw + 8), height: 400 } });
const html = `<body style="margin:0;background:#333;display:flex;flex-wrap:wrap;gap:8px">${shots.map(f => `<div style="position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}" style="width:${tw}px;height:${th}px;display:block"><span style="position:absolute;left:4px;top:4px;background:#000a;color:#fff;font:12px sans-serif;padding:2px 4px">${path.basename(f, '.jpg')}</span></div>`).join('')}</body>`;
await sheet.setContent(html); await sheet.screenshot({ path: `${out}/${label}-sheet.jpg`, fullPage: true, quality: 70 });
await b.close(); srv.close();
