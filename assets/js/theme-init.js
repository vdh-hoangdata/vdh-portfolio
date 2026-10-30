// Runs before styles paint. Preferences stay on this device.
(() => {
  const valid = value => ['light', 'dark', 'system'].includes(value);
  let preference = 'system';
  try {
    const saved = localStorage.getItem('portfolio-theme');
    if (valid(saved)) preference = saved;
  } catch { /* System mode remains usable when storage is blocked. */ }
  const apply = value => {
    document.documentElement.dataset.theme = valid(value) ? value : 'system';
  };
  apply(preference);
  window.portfolioThemeReadyAt = performance.now();
  window.setPortfolioTheme = value => {
    apply(value);
    try { localStorage.setItem('portfolio-theme', document.documentElement.dataset.theme); }
    catch { /* Apply for this page without persistence. */ }
  };
})();
