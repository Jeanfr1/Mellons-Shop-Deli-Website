(() => {
  const page = document.documentElement;
  page.classList.add('js');

  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    const collapse = (returnFocus = false) => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    };
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => collapse()));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) collapse(true);
    });
    const compact = window.matchMedia('(max-width: 42rem)');
    const update = () => {
      toggle.hidden = !compact.matches;
      if (!compact.matches) collapse();
    };
    compact.addEventListener('change', update);
    update();
  }

  const motionSwitch = document.querySelector('.motion-toggle');
  if (motionSwitch) {
    const preferred = window.matchMedia('(prefers-reduced-motion: reduce)');
    let explicitlyPaused = false;
    const applyPreference = () => {
      const still = preferred.matches || explicitlyPaused;
      page.classList.toggle('motion-paused', still);
      motionSwitch.setAttribute('aria-pressed', String(still));
      motionSwitch.textContent = preferred.matches ? 'Reduced motion active' : still ? 'Resume motion' : 'Pause motion';
      motionSwitch.disabled = preferred.matches;
    };
    motionSwitch.hidden = false;
    applyPreference();
    preferred.addEventListener('change', applyPreference);
    motionSwitch.addEventListener('click', () => {
      explicitlyPaused = !explicitlyPaused;
      applyPreference();
    });
    page.classList.add('motion-ready');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('entered');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.22 });
      document.querySelectorAll('[data-motion]').forEach(art => observer.observe(art));
    }
  }

  const query = document.querySelector('#menu-search');
  if (!query) return;
  const searchControls = document.querySelector('.search-controls');
  const searchStatus = document.querySelector('.search-status');
  const noResults = document.querySelector('.no-results');
  const groups = Array.from(document.querySelectorAll('[data-menu-section]'));
  const reset = document.querySelector('#menu-search-reset');
  const clean = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-IE').replace(/[’']/g, '').trim();
  const groupItems = groups.map(section => ({
    element: section,
    items: Array.from(section.querySelectorAll('.menu-dish')).map(element => ({
      element,
      searchable: clean(element.querySelector('.dish-name').textContent + ' ' + section.querySelector('h2').textContent)
    }))
  }));
  const runSearch = () => {
    const words = clean(query.value).split(/\s+/).filter(Boolean);
    let count = 0;
    groupItems.forEach(group => {
      let visible = 0;
      group.items.forEach(item => {
        const show = words.every(word => item.searchable.includes(word));
        item.element.hidden = !show;
        if (show) visible++;
      });
      group.element.hidden = visible === 0;
      count += visible;
    });
    searchStatus.textContent = count + (count === 1 ? ' item' : ' items');
    noResults.hidden = count !== 0;
  };
  searchControls.hidden = false;
  searchStatus.hidden = false;
  query.addEventListener('input', runSearch);
  reset.addEventListener('click', () => { query.value = ''; runSearch(); query.focus(); });
  document.querySelectorAll('.menu-rail a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => { if (query.value) { query.value = ''; runSearch(); } });
  });
  runSearch();
})();
