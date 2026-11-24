/* Mellon’s Shop & Deli · The Deli Drop
   Without JavaScript, or with reduced motion, the page is complete and still.
   Motion is built in one gsap.context so "Pause motion" can revert all of it. */
(() => {
  const d = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phoneMQ = matchMedia('(max-width: 760px)');
  const posterMQ = matchMedia('(max-width: 760px), (max-width: 1023px) and (orientation: portrait)'); // the tall hero composition
  let introPlayed = false;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let paused = false;
  try { paused = localStorage.getItem('mellons-motion') === 'off'; } catch (e) {}

  /* ---------------- header ---------------- */
  const header = $('.site-header');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    const goingDown = y > lastY + 4, goingUp = y < lastY - 4;
    if (goingDown && y > innerHeight * 1.2 && !d.classList.contains('menu-open')) header.classList.add('is-hidden');
    if (goingUp || y < innerHeight) header.classList.remove('is-hidden');
    if (goingDown || goingUp) lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ---------------- phone navigation ---------------- */
  const nav = $('#navigation'), toggle = $('.menu-toggle');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    d.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.menu-toggle-label').textContent = open ? 'Close' : 'Menu';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  phoneMQ.addEventListener('change', () => setMenu(false));

  /* ---------------- hours: today + open now (Dublin time) ---------------- */
  const dublinNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: +get('hour') * 60 + +get('minute') };
  };
  const OPEN = { 1: [420, 960], 2: [420, 960], 3: [420, 960], 4: [420, 960], 5: [420, 930] };
  const LABEL = { 960: '4pm', 930: '3.30pm' };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const paintHours = () => {
    const { day, min } = dublinNow();
    $$('.hours tr').forEach(tr => tr.classList.toggle('is-today', tr.dataset.days.split(',').includes(String(day))));
    const status = $('[data-status]');
    if (!status) return;
    const today = OPEN[day];
    let text, open = false;
    if (today && min >= today[0] && min < today[1]) { open = true; text = `Open now · until ${LABEL[today[1]]}`; }
    else {
      let n = 0, next;
      if (today && min < today[0]) next = 'today';
      else { do { n++; } while (!OPEN[(day + n) % 7]); next = n === 1 ? 'tomorrow' : DAYS[(day + n) % 7]; }
      text = `Closed now · opens ${next} at 7am`;
    }
    status.hidden = false;
    status.classList.toggle('is-open', open);
    $('[data-status-text]', status).textContent = text;
  };
  paintHours();
  setInterval(paintHours, 60000);
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------------- motion ---------------- */
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motionButton = $('#motion-toggle');
  let ctx = null;
  const removeIntro = () => d.classList.remove('intro');

  const wantMotion = () => hasGsap && !reduced.matches && !paused;

  function start() {
    if (!wantMotion()) { d.classList.remove('motion'); d.classList.add('still'); removeIntro(); return; }
    d.classList.add('motion'); d.classList.remove('still');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    ctx = gsap.context(build);
    removeIntro();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  function stop() {
    if (ctx) { ctx.revert(); ctx = null; }
    d.classList.remove('motion', 'has-flyer'); d.classList.add('still');
  }
  if (motionButton) {
    motionButton.hidden = !hasGsap;
    const label = () => {
      motionButton.textContent = reduced.matches ? 'Reduced motion is on' : paused ? 'Play motion' : 'Pause motion';
      motionButton.setAttribute('aria-pressed', String(paused || reduced.matches));
      motionButton.disabled = reduced.matches;
    };
    label();
    motionButton.addEventListener('click', () => {
      paused = !paused;
      try { localStorage.setItem('mellons-motion', paused ? 'off' : 'on'); } catch (e) {}
      paused ? stop() : start();
      label();
    });
    reduced.addEventListener('change', () => { stop(); start(); label(); });
  }
  // crossing a layout breakpoint (a resize, a tablet turned) rebuilds the scenes for the new composition
  [phoneMQ, posterMQ].forEach(mq => mq.addEventListener('change', () => { if (ctx) { stop(); start(); } }));

  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function build() {
    const phone = phoneMQ.matches, tall = posterMQ.matches;
    const cleanups = [];
    const self = { add: f => cleanups.push(f()) };
    const vw = () => innerWidth, vh = () => innerHeight;

    /* ===== HERO: the flyer (Classic Club) ===== */
    const slot = $('.club-slot');
    const card = $('.plate--club .plate-photo');
    const cardImg = $('img', card);
    const cardText = $$('.plate--club .plate-name, .plate--club .plate-tag');
    const BOX = [0.00065, 0.33676, 0.99935, 0.98333]; // cut-out box inside the official photo (scripts/prepare-images.py)
    const flyer = document.createElement('div');
    flyer.className = 'flyer';
    flyer.setAttribute('aria-hidden', 'true');
    flyer.innerHTML = '<div class="flyer-drop"><div class="flyer-float"><img alt="" src="assets/cut/classic-club-900.webp" srcset="assets/cut/classic-club-560.webp 560w, assets/cut/classic-club-900.webp 900w, assets/cut/classic-club-1300.webp 1300w" sizes="(max-width: 760px) 112vw, (min-aspect-ratio: 8/5) calc(99vh - 83px), 59vw"></div></div>';
    const layer = document.createElement('div'); // a clipped screen-sized layer, so the flyer never widens a phone's viewport
    layer.className = 'flyer-layer';
    layer.appendChild(flyer);
    document.body.appendChild(layer);
    d.classList.add('has-flyer');
    const drop = $('.flyer-drop', flyer), float = $('.flyer-float', flyer);
    let baseW = 1, baseH = 1, hidden = false;
    const measure = () => { baseW = slot.offsetWidth; baseH = slot.offsetHeight; flyer.style.width = baseW + 'px'; flyer.style.height = baseH + 'px'; };
    measure();

    const dock = ScrollTrigger.create({
      trigger: '.counter', start: 'top bottom',
      endTrigger: card, end: phone ? 'center 62%' : 'center 56%',
      refreshPriority: -1, // measured after the hero pin adds its spacer
      onRefreshInit: measure,
    });
    const place = () => {
      const p = dock.progress;
      if (p >= 1) {
        if (!hidden) { flyer.style.visibility = 'hidden'; hidden = true; cardImg.style.opacity = 1; cardText.forEach(el => { el.style.opacity = 1; }); }
        return;
      }
      if (hidden) { flyer.style.visibility = 'visible'; hidden = false; }
      const a = slot.getBoundingClientRect(), t = card.getBoundingClientRect();
      const b = { left: t.left + t.width * BOX[0], top: t.top + t.height * BOX[1], width: t.width * (BOX[2] - BOX[0]), height: t.height * (BOX[3] - BOX[1]) };
      const ex = ss(0, 1, p), ey = Math.pow(p, 1.25), es = ss(0, .92, p);
      const cx = a.left + a.width / 2 + (b.left + b.width / 2 - a.left - a.width / 2) * ex;
      const cy = a.top + a.height / 2 + (b.top + b.height / 2 - a.top - a.height / 2) * ey;
      const w = a.width + (b.width - a.width) * es;
      const rot = -4 * (1 - p) + 9 * Math.sin(Math.PI * Math.min(1, p * 1.05));
      flyer.style.transform = `translate3d(${cx - baseW / 2}px, ${cy - baseH / 2}px, 0) scale(${w / baseW}) rotate(${rot}deg)`;
      const dev = ss(.8, 1, p);
      cardImg.style.opacity = dev;
      cardText.forEach(el => { el.style.opacity = ss(.6, 1, p); });
    };
    gsap.ticker.add(place);
    self.add(() => () => { gsap.ticker.remove(place); layer.remove(); d.classList.remove('has-flyer'); cardImg.style.opacity = ''; cardText.forEach(el => { el.style.opacity = ''; }); });

    /* ===== HERO: load intro "The Drop" ===== */
    const words = $$('.hero-title .w > span');
    const marks = $$('.marks path');
    marks.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .from('.logo', { scale: .5, rotation: -25, opacity: 0, duration: .7 }, 0)
      .from('.burst', { scale: .3, opacity: 0, duration: 1.4, ease: 'expo.out' }, .75)
      .from(words, { scale: 1.55, yPercent: -18, opacity: 0, duration: .62, stagger: .085, ease: 'expo.out' }, .05)
      .from('.side-wrap', { x: () => -vw() * .28, y: -60, rotation: -70, opacity: 0, duration: .92 }, .1)
      .from('.side-italian', { x: () => vw() * .3, y: -120, rotation: 60, opacity: 0, duration: .92 }, .245)
      .from(drop, { y: () => -vh() * 1.15, rotation: -18, duration: .62, ease: 'power3.in' }, .22)
      .to(drop, { scaleY: .93, scaleX: 1.04, transformOrigin: '50% 100%', duration: .09, ease: 'power2.out' }, .84)
      .to(drop, { scaleY: 1, scaleX: 1, y: -9, duration: .2, ease: 'power2.out' }, .93)
      .to(drop, { y: 0, duration: .28, ease: 'power2.inOut' }, 1.13)
      .to('.hero-title', { keyframes: { x: [0, -7, 6, -3, 0], y: [0, 3, -2, 1, 0] }, duration: .3, ease: 'none' }, .84)
      .from('.seal', { scale: 2.4, rotation: -100, opacity: 0, duration: .7 }, .9)
      .to(marks, { strokeDashoffset: 0, duration: .26, stagger: .05, ease: 'power2.out' }, 1.01)
      .from('.marks', { opacity: 0, duration: .01 }, 1.01)
      .from('.hero-foot > *', { y: 22, opacity: 0, duration: .7, stagger: .08 }, .2);
    if (introPlayed || scrollY > vh() * .4) intro.progress(1); // the drop plays once per visit, not again on resume or rotation
    introPlayed = true;

    // idle life: the sandwich floats, the poster follows the pointer
    gsap.to(float, { y: phone ? -6 : -9, rotation: .8, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });
    if (finePointer.matches && !phone) {
      const layers = [['.side-wrap img', 26], ['.side-italian img', 30], ['.seal svg', 16]].map(([s, k]) => [gsap.quickTo(s, 'x', { duration: .9, ease: 'power3' }), gsap.quickTo(s, 'y', { duration: .9, ease: 'power3' }), k]);
      const fx = gsap.quickTo(float, 'x', { duration: 1, ease: 'power3' });
      const hero = $('.hero');
      const move = e => {
        const nx = e.clientX / vw() - .5, ny = e.clientY / vh() - .5;
        layers.forEach(([x, y, k]) => { x(-nx * k); y(-ny * k); });
        fx(nx * 14);
      };
      hero.addEventListener('pointermove', move);
      self.add(() => () => hero.removeEventListener('pointermove', move));
    }

    /* ===== HERO: pinned scroll, the poster opens up and the sandwich comes closer ===== */
    const heroTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + vh() * (tall ? .5 : .75), pin: true, scrub: .5, anticipatePin: 1 },
    });
    const spread = tall
      ? [[-.1, -.06], [.14, -.03], [-.12, .02], [.1, .05]]
      : [[-.16, -.1], [-.26, -.04], [-.2, .06], [-.12, .13]];
    $$('.hero-title .w').forEach((w, i) => {
      heroTl.to(w, { x: () => vw() * spread[i][0], y: () => vh() * spread[i][1], rotation: [-8, -4, 5, -3][i], scale: 1.08, ease: 'power1.in' }, 0)
        .to(w, { opacity: 0, ease: 'power1.in' }, .35);
    });
    heroTl
      .to('.hero-foot', { y: -50, opacity: 0, duration: .5 }, 0)
      .to('.side-wrap', { x: () => -vw() * .3, y: () => -vh() * .25, rotation: -50 }, 0)
      .to('.side-italian', { x: () => vw() * .3, y: () => -vh() * .3, rotation: 50 }, 0)
      .to('.seal', { scale: .3, rotation: 160, opacity: 0, duration: .7 }, 0)
      .to('.marks', { opacity: 0, duration: .3 }, 0)
      .to('.club-slot', { scale: tall ? 1.06 : 1.16, x: () => (tall ? 0 : -vw() * .05), y: () => -vh() * (tall ? .02 : .04), ease: 'power1.inOut' }, 0)
      .to('.hero-grain', { opacity: .34 }, 0)
      .to('.burst', { scale: 1.45, opacity: .5 }, 0);

    /* ===== COUNTER: the paper unfolds, plates slide down the counter ===== */
    gsap.timeline({ scrollTrigger: { trigger: '.counter', start: 'top 92%', end: 'top 28%', scrub: .6 } })
      .from('.paper-title', { rotationX: -80, transformPerspective: 900, transformOrigin: '50% 0%', opacity: 0, ease: 'power2.out' }, 0)
      .fromTo('.paper-title .scribble path', { strokeDasharray: 240, strokeDashoffset: 240 }, { strokeDashoffset: 0, ease: 'power1.out' }, .35)
      .from('.counter-intro > *', { y: 34, opacity: 0, stagger: .08, ease: 'power2.out' }, .1);
    gsap.from('.plate:not(.plate--club)', {
      x: () => -vw() * (phone ? .7 : .55), rotation: -8, opacity: 0, ease: 'power3.out', stagger: { each: .12, from: 'end' },
      scrollTrigger: { trigger: '.plates', start: 'top 98%', end: phone ? 'top 40%' : 'top 45%', scrub: .7 },
    });

    /* ===== TICKER: two crossing tapes driven by scroll velocity ===== */
    const tapes = $$('.ticker-track').map((track, i) => {
      const kids = [...track.children];
      const clones = [];
      do { kids.forEach(k => { const c = k.cloneNode(true); clones.push(c); track.appendChild(c); }); } while (track.scrollWidth < vw() * 2.6);
      const half = clones[0].offsetLeft - kids[0].offsetLeft; // one period of the repeated words
      self.add(() => () => clones.forEach(c => c.remove()));
      return { track, dir: i ? 1 : -1, x: 0, half };
    });
    let vel = 0;
    const tickerST = ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onUpdate: s => { vel = s.getVelocity(); } });
    const runTapes = (time, dt) => {
      if (!tickerST.isActive) return;
      const boost = Math.min(5, Math.abs(vel) / 380);
      tapes.forEach(t => {
        t.x += t.dir * (0.05 + boost * .14) * dt;
        if (t.x < -t.half) t.x += t.half;
        if (t.x > 0) t.x -= t.half;
        t.track.style.transform = `translate3d(${t.x}px,0,0) skewX(${gsap.utils.clamp(-9, 9, -vel / 260) * t.dir * -1}deg)`;
      });
      vel *= .92;
    };
    tapes.forEach(t => { if (t.dir > 0) t.x = -t.half / 2; });
    gsap.ticker.add(runTapes);
    self.add(() => () => { gsap.ticker.remove(runTapes); tapes.forEach(t => { t.track.style.transform = ''; }); });

    /* ===== GRAB & GO: the paper window is torn open, the words cross ===== */
    const SLIT = 'polygon(50% 0%, 52% 0%, 50% 100%, 48% 100%)', OPEN_W = 'polygon(14% 0%, 100% 0%, 86% 100%, 0% 100%)';
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.deal', start: 'top 82%', end: phone ? 'top 5%' : 'center 52%', scrub: .6 } })
      .fromTo('.deal-paper', { clipPath: SLIT }, { clipPath: OPEN_W, ease: 'power2.out', duration: .55 }, 0)
      .fromTo('.deal-photo', { clipPath: SLIT }, { clipPath: OPEN_W, ease: 'power2.out', duration: .55 }, .08)
      .from('.deal-photo img', { xPercent: 16, scale: 1.12, ease: 'power2.out', duration: .7 }, .08)
      .from('.dt-a', { x: () => -vw() * .45, rotation: -12, ease: 'power3.out', duration: .6 }, 0)
      .from('.dt-b', { x: () => vw() * .5, rotation: 10, ease: 'power3.out', duration: .6 }, .06)
      .from('.deal-copy > *', { y: 40, opacity: 0, stagger: .08, ease: 'power2.out', duration: .4 }, .3)
      .from('.stamp', { scale: 2.6, rotation: -70, opacity: 0, ease: 'expo.out', duration: .3 }, .7);
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.deal', start: 'center 45%', end: 'bottom top', scrub: .6 } })
      .to('.deal-title', { y: -70 }, 0).to('.deal-window', { y: -40 }, 0).to('.stamp', { rotation: 20 }, 0);

    /* ===== CATERING: trays slide across the table to meet the panel ===== */
    gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: '.catering', start: 'top 90%', end: phone ? 'top 0%' : 'center 58%', scrub: .7 } })
      .from('.tray-left', { x: () => -vw() * .5, rotation: -16, duration: .8 }, 0)
      .from('.tray-right', { x: () => vw() * .5, rotation: 16, duration: .8 }, .08)
      .from('.catering-panel', { y: 140, rotationX: 50, transformPerspective: 1100, transformOrigin: '50% 100%', scale: .9, opacity: 0, duration: .7 }, .2)
      .from('.facts li', { x: -24, opacity: 0, stagger: .07, duration: .3 }, .6);
    if (!phone) {
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.catering', start: 'center 58%', end: 'bottom top', scrub: .6 } })
        .to('.tray-left', { x: () => -vw() * .03, y: -30 }, 0).to('.tray-right', { x: () => vw() * .03, y: -60 }, 0).to('.catering-panel', { y: -20 }, 0);
    }

    /* ===== SHOP: awnings unroll, shutters go up like 7am on South Lotts Road ===== */
    gsap.timeline({ scrollTrigger: { trigger: '.shop-head', start: 'top 92%', end: 'top 50%', scrub: .6 } })
      .from('.shop-head h2 span', { yPercent: 60, rotation: -6, opacity: 0, stagger: .1, ease: 'power3.out', duration: .4 }, 0)
      .fromTo('.shop-head .scribble path', { strokeDasharray: 240, strokeDashoffset: 240 }, { strokeDashoffset: 0, duration: .3 }, .25);
    gsap.timeline({ scrollTrigger: { trigger: '.windows', start: 'top 88%', end: 'top 30%', scrub: .6 } })
      .from('.awning', { scaleY: 0, transformOrigin: '50% 0%', stagger: .1, ease: 'power2.out', duration: .3 }, 0)
      .fromTo('.shutter', { yPercent: 0 }, { yPercent: -101, stagger: .14, ease: 'power2.inOut', duration: .55 }, .2)
      .from('.pane img', { scale: 1.12, stagger: .14, ease: 'power2.out', duration: .6 }, .2)
      .from('.window-label', { y: 20, opacity: 0, stagger: .1, duration: .3 }, .55);

    /* ===== STORY: 1905 rolls to today, the shelf turns into the counter ===== */
    const yearEl = $('.year');
    const now = String(new Date().getFullYear()), from = '1905';
    yearEl.textContent = '';
    const spins = [0, 1, 1, 2];
    const columns = [...from].map((f, i) => {
      const a = +f, b = +now[i];
      let steps = (b - a + 10) % 10 + spins[i] * 10;
      if (i === 0) steps = b - a;
      const col = document.createElement('span'); col.className = 'digit';
      const inner = document.createElement('span');
      for (let k = 0; k <= steps; k++) { const s = document.createElement('span'); s.textContent = (a + k) % 10; inner.appendChild(s); }
      col.appendChild(inner); yearEl.appendChild(col);
      return { inner, steps };
    });
    self.add(() => () => { yearEl.textContent = '1905'; });
    // desktop: one pinned scene. Phone: the section is too tall to pin, so the year and the shelf each scrub while they are on screen
    const pinned = phone ? null : gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.story', start: 'top top', end: () => '+=' + vh() * 1.3, pin: true, scrub: .6, anticipatePin: 1 } });
    const yearTl = pinned || gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.year', start: 'top 88%', end: 'top 26%', scrub: .6 } });
    const shelfTl = pinned || gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.tags', start: 'top 92%', end: 'bottom 52%', scrub: .6 } });
    yearTl.from('.story-copy h2 span', { yPercent: 70, opacity: 0, stagger: .04, duration: .12, ease: 'power3.out' }, 0);
    columns.forEach(({ inner, steps }, i) => {
      yearTl.to(inner, { yPercent: -100 * steps / (steps + 1), duration: .6, ease: 'power2.inOut' }, .12 + i * .02);
    });
    yearTl
      .to('.cap-then', { opacity: 0, y: -10, duration: .06 }, .42).fromTo('.cap-now', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .06 }, .46)
      .to('.story', { backgroundColor: '#8a0b17', duration: .8 }, .1);
    shelfTl
      .to('.lab-then', { opacity: 0, duration: .06 }, .2).fromTo('.lab-now', { opacity: 0 }, { opacity: 1, duration: .06 }, .24)
      .to('.tag', { rotationX: 180, duration: .16, stagger: .055, ease: 'power2.inOut' }, .18)
      .fromTo('.story-photo', { y: 120, rotation: 14, opacity: 0 }, { y: 0, rotation: 4, opacity: 1, duration: .3, ease: 'power3.out' }, .55);

    /* ===== VISIT: the awning rolls out and the corner appears beneath it ===== */
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.visit', start: 'top 85%', end: phone ? 'top 10%' : 'top 15%', scrub: .6 } })
      .from('.awning-roll', { scaleY: 0, transformOrigin: '50% 0%', duration: .25, ease: 'power2.out' }, 0)
      .fromTo('.visit-pane', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .75, ease: 'power2.inOut' }, .12)
      .fromTo('.visit-pane img', { yPercent: -6, scale: 1.08 }, { yPercent: 0, scale: 1, duration: .8, ease: 'power2.out' }, .12)
      .from('.visit-panel h2 span', { x: 80, opacity: 0, stagger: .08, duration: .3, ease: 'power3.out' }, .2)
      .from('.visit-panel > :not(h2)', { y: 26, opacity: 0, stagger: .05, duration: .3, ease: 'power2.out' }, .35);

    /* ===== FEED: the photo strip drifts across with the scroll ===== */
    gsap.fromTo('.strip-track', { x: () => (phone ? 0 : vw() * .08) }, {
      x: () => -($('.strip-track').scrollWidth - vw() * (phone ? .85 : .9)), ease: 'none',
      scrollTrigger: { trigger: '.feed', start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true },
    });
    gsap.from('.app h2 span', { yPercent: 60, opacity: 0, rotation: -5, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.feed', start: 'top 85%', end: 'top 45%', scrub: .6 } });

    /* ===== FOOTER: the name rises letter by letter ===== */
    gsap.from('.wordmark span', {
      yPercent: 105, rotation: (i) => (i % 2 ? 8 : -8), ease: 'power3.out', stagger: .06,
      scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'top 35%', scrub: .6 },
    });
    return () => cleanups.forEach(f => typeof f === 'function' && f());
  }

  start();
  // fonts and images change measurements: re-measure once they settle
  addEventListener('load', () => { if (ctx) ScrollTrigger.refresh(); }, { once: true });
  document.fonts && document.fonts.ready.then(() => { if (ctx) ScrollTrigger.refresh(); });
})();
