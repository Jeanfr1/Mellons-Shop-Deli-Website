/* Menu page: header, phone navigation, search, current category, a short arrival. No dependencies. */
(() => {
  const d = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('mellons-motion') === 'off'; } catch (e) {}
  const still = () => reduced.matches || paused;
  d.classList.toggle('still', still());

  // header
  const header = $('.site-header'); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY; header.classList.toggle('is-scrolled', y > 30);
    if (y > lastY + 4 && y > 500 && !d.classList.contains('menu-open')) header.classList.add('is-hidden');
    if (y < lastY - 4 || y < 300) header.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 4) lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // phone navigation
  const nav = $('#navigation'), toggle = $('.menu-toggle');
  const setMenu = open => { nav.classList.toggle('is-open', open); d.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); $('.menu-toggle-label').textContent = open ? 'Close' : 'Menu'; };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // search
  const box = $('[data-search]'), input = $('#menu-search'), clear = $('.search-clear'), status = $('.search-status'), none = $('.no-results');
  const groups = $$('[data-group]').map(g => ({ g, items: $$('.dish', g).map(li => ({ li, text: norm(li.querySelector('.dish-name').textContent + ' ' + g.querySelector('h2').textContent) })) }));
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'.&+()]/g, ' ').replace(/\s+/g, ' ').trim(); }
  const run = () => {
    const words = norm(input.value).split(' ').filter(Boolean); let n = 0;
    groups.forEach(({ g, items }) => { let v = 0; items.forEach(({ li, text }) => { const show = words.every(w => text.includes(w)); li.hidden = !show; if (show) v++; }); g.hidden = v === 0; n += v; });
    clear.hidden = !input.value;
    status.textContent = words.length ? `${n} ${n === 1 ? 'match' : 'matches'}` : '';
    none.hidden = n !== 0;
  };
  box.hidden = false;
  input.addEventListener('input', run);
  clear.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
  $$('.rail-links a').forEach(a => a.addEventListener('click', () => { if (input.value) { input.value = ''; run(); } }));

  // current category in the rail
  const links = new Map($$('.rail-links a').map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.removeAttribute('aria-current')); const a = links.get(e.target.id); if (a) { a.setAttribute('aria-current', 'true'); if (matchMedia('(max-width: 760px)').matches) a.scrollIntoView({ block: 'nearest', inline: 'center' }); } } }), { rootMargin: '-35% 0px -60% 0px' });
  groups.forEach(({ g }) => io.observe(g));

  // arrival: the poster words and the food land once (Web Animations; nothing hidden without JS)
  if (!still() && Element.prototype.animate) {
    const ease = 'cubic-bezier(.16,1,.3,1)';
    $$('.menu-hero h1 span').forEach((el, i) => el.animate([{ transform: 'scale(1.5) translateY(-14%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 620, delay: 60 + i * 90, easing: ease, fill: 'backwards' }));
    [['.mh-italian', -60], ['.mh-greek', 40], ['.mh-granola', -30]].forEach(([s, r], i) => { const el = $(s); if (el) el.animate([{ transform: `translateY(-120vh) rotate(${r}deg)` }, { transform: 'none' }], { duration: 900, delay: 180 + i * 120, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'backwards' }); });
    $$('.menu-hero-copy > p, .menu-hero-copy .actions').forEach((el, i) => el.animate([{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: 300 + i * 80, easing: ease, fill: 'backwards' }));
  }

  // motion toggle (shared preference with the home page)
  const mt = $('#motion-toggle');
  if (mt) {
    const label = () => { mt.textContent = reduced.matches ? 'Reduced motion is on' : paused ? 'Play motion' : 'Pause motion'; mt.setAttribute('aria-pressed', String(still())); mt.disabled = reduced.matches; };
    mt.hidden = false; label();
    mt.addEventListener('click', () => { paused = !paused; try { localStorage.setItem('mellons-motion', paused ? 'off' : 'on'); } catch (e) {} d.classList.toggle('still', still()); label(); });
  }
})();
