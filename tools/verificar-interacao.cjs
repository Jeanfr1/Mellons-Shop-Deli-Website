/* Behavior smoke test for the shipping script; this test does not render a page. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'dist/site.js'), 'utf8');
const menu = JSON.parse(fs.readFileSync(path.join(root, 'docs/menu-snapshot.json'), 'utf8'));
function node(text = '') {
  const events = {};
  const classes = new Set();
  const attrs = {};
  return {
    textContent: text, hidden: true, value: '', focused: false, disabled: false, attrs,
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name),
      toggle(name, force = !classes.has(name)) {
        if (force) classes.add(name); else classes.delete(name);
        return force;
      }
    },
    addEventListener: (name, fn) => { (events[name] ??= []).push(fn); },
    emit: (name, e = {}) => events[name]?.forEach(fn => fn(e)),
    setAttribute: (key, v) => { attrs[key] = v; },
    focus() { this.focused = true; }
  };
}
const nav = node(), toggle = node(), motion = node(), query = node(), reset = node(), status = node(), no = node();
const panel = node(), categoryLink = node();
const groups = menu.groups.map(group => {
  const section = node();
  section.querySelector = () => node(group.title);
  section.querySelectorAll = () => group.items.map(item => {
    const el = node();
    el.querySelector = () => node(item.name);
    return el;
  });
  return section;
});
nav.querySelectorAll = () => [categoryLink];
const controls = node(), doc = node(), page = node(), compact = node(), reduced = node();
compact.matches = true;
reduced.matches = true;
const match = {
  '.main-nav': nav, '.nav-toggle': toggle, '.motion-toggle': motion, '#menu-search': query,
  '#menu-search-reset': reset, '.search-controls': controls, '.search-status': status, '.no-results': no
};
doc.documentElement = page;
doc.querySelector = key => match[key];
doc.querySelectorAll = key => key === '[data-menu-section]' ? groups : key === '[data-motion]' ? [panel] : [categoryLink];
let intersection, unobserved;
class Observer {
  constructor(fn, opts) { intersection = fn; assert.equal(opts.threshold, 0.22); }
  observe(p) { assert.equal(p, panel); }
  unobserve(p) { unobserved = p; }
}
const window = { matchMedia: q => q.includes('prefers-reduced') ? reduced : compact, IntersectionObserver: Observer };
vm.runInNewContext(script, { document: doc, window, IntersectionObserver: Observer });
assert.equal(status.textContent, '57 items');
assert.equal(controls.hidden, false);
assert.equal(no.hidden, true);
query.value = 'CLASSIC club';
query.emit('input');
assert.equal(status.textContent, '1 item');
assert.equal(groups.filter(e => !e.hidden).length, 1);
query.value = 'zzz-no-menu-item-zzz';
query.emit('input');
assert.equal(status.textContent, '0 items');
assert.equal(no.hidden, false);
reset.emit('click');
assert.equal(status.textContent, '57 items');
assert.equal(query.focused, true);
query.value = 'breakfast'; query.emit('input'); categoryLink.emit('click');
assert.equal(status.textContent, '57 items');
assert.equal(toggle.hidden, false);
toggle.emit('click');
assert.equal(toggle.attrs['aria-expanded'], 'true');
doc.emit('keydown', {key: 'Escape'});
assert.equal(toggle.attrs['aria-expanded'], 'false');
assert.equal(toggle.focused, true);
assert.equal(page.classList.contains('motion-paused'), true);
assert.equal(motion.disabled, true);
reduced.matches = false; reduced.emit('change');
assert.equal(page.classList.contains('motion-paused'), false);
motion.emit('click');
assert.equal(page.classList.contains('motion-paused'), true);
assert.equal(motion.attrs['aria-pressed'], 'true');
intersection([{target: panel, isIntersecting: true}]);
assert.equal(panel.classList.contains('entered'), true);
assert.equal(unobserved, panel);
console.log('search, mobile navigation, reduced motion and one-shot triggers passed');
