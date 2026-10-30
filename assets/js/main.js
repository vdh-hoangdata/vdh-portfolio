/* Essential content is already present in static HTML.
   JavaScript enhances it; a failed request never removes a fallback. */
const portfolioScript = document.currentScript;
const portfolioRoot = new URL('../../', portfolioScript.src);

function getRootPrefix() {
  return portfolioRoot.href;
}

function componentFallback(id) {
  const home = portfolioRoot.href;
  if (id === 'header-placeholder') {
    return '<a class="skip-link" href="#main-content">Skip to main content</a>' +
      '<nav class="fallback-nav" aria-label="Main navigation"><a href="' + home +
      '">Home</a><a href="' + home + '#projects">Projects</a>' +
      '<a href="mailto:vdh.hoang.data@gmail.com">Contact</a></nav>';
  }
  if (id === 'intro-placeholder') {
    return '<section class="hero"><div class="container"><h1>Vu Duc Hoang · Data Analytics &amp; Engineering</h1>' +
      '<p>SQL and Python pipelines, analytical warehouses, Power BI and data automation.</p>' +
      '<a class="btn btn-primary" href="#projects">View Projects</a> ' +
      '<a class="btn btn-outline" href="mailto:vdh.hoang.data@gmail.com">Contact Me</a></div></section>';
  }
  return '<footer class="site-footer"><div class="container">' +
    '<a href="mailto:vdh.hoang.data@gmail.com">Contact Vu Duc Hoang</a></div></footer>';
}

async function loadComponent(id, path) {
  const host = document.getElementById(id);
  if (!host || host.querySelector('nav, footer, section')) return 'static';
  // An empty legacy placeholder gets usable content immediately, including offline.
  host.innerHTML = componentFallback(id);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(new URL(path, portfolioRoot), { signal: controller.signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const html = await response.text();
    // Preserve focus if somebody already started using the fallback.
    if (host.contains(document.activeElement)) return 'fallback';
    host.innerHTML = html;
    host.querySelectorAll('a[href^="./"], img[src^="assets/"]').forEach(el => {
      const attribute = el.tagName === 'IMG' ? 'src' : 'href';
      el.setAttribute(attribute, new URL(el.getAttribute(attribute), portfolioRoot).href);
    });
    if (id === 'header-placeholder') initNav();
    if (id === 'footer-placeholder') initFooter();
    return 'loaded';
  } catch (error) {
    console.warn('[VDH] Component fallback retained:', path, error.message);
    return 'fallback';
  } finally {
    window.clearTimeout(timeout);
  }
}

function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav || nav.dataset.initialized) return;
  const button = nav.querySelector('.nav-hamburger');
  const links = nav.querySelector('.nav-links');
  if (!button || !links) return;
  initThemeControl();
  nav.dataset.initialized = 'true';
  const mobile = window.matchMedia('(max-width: 900px)');

  function closeMenu(returnFocus) {
    button.classList.remove('open');
    links.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open menu');
    if (returnFocus && mobile.matches) button.focus();
  }

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-expanded') === 'true') {
      closeMenu(true);
      return;
    }
    button.classList.add('open');
    links.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close menu');
    links.querySelector('a')?.focus();
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      closeMenu(true);
    }
  });
  links.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (mobile.matches) closeMenu(true);
  });
  nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) closeMenu(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!nav.contains(event.target)) closeMenu(false);
  });
  mobile.addEventListener('change', () => closeMenu(false));
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  nav.classList.add('nav-ready');
}

function initThemeControl() {
  const select = document.getElementById('theme-preference');
  if (!select || select.dataset.initialized) return;
  select.dataset.initialized = 'true';
  select.value = document.documentElement.dataset.theme || 'system';
  select.addEventListener('change', () => {
    if (window.setPortfolioTheme) window.setPortfolioTheme(select.value);
    else {
      document.documentElement.dataset.theme = select.value;
      try { localStorage.setItem('portfolio-theme', select.value); } catch { /* Optional storage. */ }
    }
  });
  select.closest('.theme-control').hidden = false;
}

function initFooter() {
  const year = document.getElementById('current-year');
  if (year) year.textContent = new Date().getFullYear();
}

function initToc() {
  const links = Array.from(document.querySelectorAll('.toc-list a, .toc ul a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  const headings = document.querySelectorAll('.article-body h2[id], .article-body h3[id], .prose h2[id], .prose h3[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        const active = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-80px 0px -60% 0px' });
  headings.forEach(heading => observer.observe(heading));
}

function initFadeIns() {
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Content starts visible. The short animation cannot leave it hidden.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initAnchorFocus() {
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); }
    catch { return; }
    if (!target) return;
    // Keep native fragment history and scrolling; CSS handles reduced motion.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
  });
}

function bootstrapPortfolio() {
  initNav();
  initThemeControl();
  initFooter();
  initFadeIns();
  initToc();
  initAnchorFocus();
  // Static includes are preferred; this keeps legacy empty-placeholder loading usable.
  Promise.allSettled([
    loadComponent('header-placeholder', 'components/header.html'),
    loadComponent('footer-placeholder', 'components/footer.html'),
    loadComponent('intro-placeholder', 'components/intro.html')
  ]);
}
// This small script is loaded in the head. Enhance the parsed nav before its
// first paint, avoiding the mobile fallback menu collapsing after layout.
// If the script is blocked, the static expanded navigation remains available.
const earlyNavigation = new MutationObserver(() => {
  if (document.querySelector('.site-nav .nav-links')) {
    initNav();
    if (document.querySelector('.site-nav[data-initialized]')) earlyNavigation.disconnect();
  }
});
earlyNavigation.observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapPortfolio, { once: true });
} else {
  bootstrapPortfolio();
}
