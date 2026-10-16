// Refresh derived statistics without unmounting the settings being edited.
// Campaign panels have a fixed set of top-level sections, including calc-settings.
export function updateCalculatedPanel(host, markup) {
  const template = document.createElement('template');
  template.innerHTML = markup;
  const next = [...template.content.children];
  const current = [...host.children];
  const settings = host.querySelector('.calc-settings');
  // Rebuild spectator-disabled controls so joining a character restores editing,
  // just as the original full-panel renderer did.
  const sameLayout = settings && !settings.querySelector('.spectator-disabled') && next.length === current.length &&
    next.every((node, i) => node.className === current[i].className);
  if (!sameLayout) {
    host.replaceChildren(template.content);
    return true;
  }
  next.forEach((section, i) => {
    if (!section.classList.contains('calc-settings')) {
      current[i].replaceWith(section);
      return;
    }
    const controls = [...settings.querySelectorAll('input, select')];
    section.querySelectorAll('input, select').forEach((field, index) => {
      const control = controls[index];
      if (control && control !== document.activeElement && control.value !== field.value) {
        control.value = field.value;
      }
    });
  });
  return false;
}

export function setupSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar || toggle.dataset.menuBound) return;
  toggle.dataset.menuBound = 'true';
  sidebar.id ||= 'campaignSidebar';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', sidebar.id);
  const isMobile = () => getComputedStyle(toggle).display !== 'none';
  const setOpen = (open, restoreFocus = false) => {
    const mobile = isMobile();
    open = mobile && open;
    sidebar.classList.toggle('open', open);
    sidebar.inert = mobile && !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close campaign menu' : 'Open campaign menu');
    document.body.classList.toggle('campaign-menu-mobile', mobile);
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    setOpen(open);
    if (open) sidebar.querySelector('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])')?.focus();
  });
  document.addEventListener('click', event => {
    if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
      setOpen(false);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.defaultPrevented && sidebar.classList.contains('open')) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  document.addEventListener('focusin', event => {
    if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
      setOpen(false);
    }
  });
  window.addEventListener('resize', () => {
    const focusWasInside = sidebar.contains(document.activeElement);
    setOpen(false, isMobile() && focusWasInside);
  });
  setOpen(false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSidebar, { once:true });
} else {
  setupSidebar();
}
