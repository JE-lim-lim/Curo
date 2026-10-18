(() => {
  const defaults = { fontSize: 'default', theme: 'light', density: 'comfortable' };
  const allowed = {
    fontSize: ['small', 'default', 'large'],
    theme: ['light', 'dark'],
    density: ['comfortable', 'compact']
  };

  function readPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem('curo_display_preferences') || '{}');
      return Object.fromEntries(Object.keys(defaults).map(key => [
        key, allowed[key].includes(saved[key]) ? saved[key] : defaults[key]
      ]));
    } catch (_) { return { ...defaults }; }
  }

  // Only scale elements that actually render text. Scaling every DIV also
  // changes layout containers and was causing cards to overflow their grids.
  function apply(prefs) {
    const root = document.documentElement;
    root.dataset.fontSize = prefs.fontSize;
    root.dataset.theme = prefs.theme;
    root.dataset.density = prefs.density;

    const scale = { small: 1, default: 1.12, large: 1.25 }[prefs.fontSize] || 1.12;
    const textSelector = 'h1,h2,h3,h4,h5,h6,p,a,button,label,small,strong,em,span,li,summary,textarea,input,select,td,th,dt,dd,legend,figcaption';
    document.querySelectorAll(textSelector).forEach(el => {
      if (!el.dataset.curoBaseFontSize) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (Number.isFinite(size)) el.dataset.curoBaseFontSize = String(size);
      }
      const base = parseFloat(el.dataset.curoBaseFontSize);
      if (Number.isFinite(base)) el.style.fontSize = `${(base * scale).toFixed(2)}px`;
    });
    // Handle text directly inside small labels/overlines without resizing layout wrappers.
    document.querySelectorAll('[data-text-scale="true"]').forEach(el => {
      if (!el.dataset.curoBaseFontSize) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (Number.isFinite(size)) el.dataset.curoBaseFontSize = String(size);
      }
      const base = parseFloat(el.dataset.curoBaseFontSize);
      if (Number.isFinite(base)) el.style.fontSize = `${(base * scale).toFixed(2)}px`;
    });
    document.querySelectorAll('[data-pref]').forEach(el => { el.value = prefs[el.dataset.pref]; });
  }

  function init() {
    let prefs = readPrefs();
    apply(prefs);
    const trigger = document.getElementById('displaySettingsTrigger');
    const panel = document.getElementById('displaySettingsPanel');
    if (!trigger || !panel) return;
    const close = () => { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    trigger.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      trigger.setAttribute('aria-expanded', String(!panel.hidden));
    });
    document.getElementById('displaySettingsClose')?.addEventListener('click', close);
    panel.querySelectorAll('[data-pref]').forEach(el => el.addEventListener('change', () => {
      prefs = { ...prefs, [el.dataset.pref]: el.value };
      try { localStorage.setItem('curo_display_preferences', JSON.stringify(prefs)); } catch (_) {}
      apply(prefs);
      const status = document.getElementById('displaySettingsStatus');
      if (status) status.textContent = 'Preferences saved on this device.';
    }));
    document.getElementById('displaySettingsReset')?.addEventListener('click', () => {
      prefs = { ...defaults };
      try { localStorage.setItem('curo_display_preferences', JSON.stringify(prefs)); } catch (_) {}
      apply(prefs);
      const status = document.getElementById('displaySettingsStatus');
      if (status) status.textContent = 'Display settings reset.';
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    document.addEventListener('click', event => {
      if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) close();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
