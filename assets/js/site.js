(() => {
  const nav        = document.getElementById('site-nav');
  const toggle     = document.querySelector('.nav-toggle');
  const sideMenu   = document.getElementById('side-menu');
  const menuScrim  = document.getElementById('menu-scrim');
  const navLinks   = [...document.querySelectorAll('[data-nav-link]')];
  const overlay    = document.getElementById('transition-overlay');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Header translucency depth ────── */
  let ticking = false;
  const setScrolledState = () => nav?.classList.toggle('is-scrolled', window.scrollY > 24);

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        setScrolledState();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  setScrolledState();

  /* ── Side menu ────────────────────── */
  const isMenuOpen = () => Boolean(sideMenu?.classList.contains('is-open'));

  const getMenuFocusable = () => {
    if (!toggle || !sideMenu) return [];
    return [
      toggle,
      ...sideMenu.querySelectorAll('a[href]')
    ].filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  };

  const setMenuState = (open, { restoreFocus = true } = {}) => {
    if (!toggle || !sideMenu) return;

    document.body.classList.toggle('menu-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    sideMenu.classList.toggle('is-open', open);
    sideMenu.setAttribute('aria-hidden', String(!open));
    menuScrim?.classList.toggle('is-open', open);

    if (open) {
      window.setTimeout(() => {
        if (isMenuOpen() && !getMenuFocusable().includes(document.activeElement)) {
          toggle.focus({ preventScroll: true });
        }
      }, reducedMotion ? 0 : 60);
      return;
    }

    if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  toggle?.addEventListener('click', () => {
    setMenuState(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menuScrim?.addEventListener('click', () => setMenuState(false));

  document.addEventListener('keydown', (e) => {
    if (!isMenuOpen()) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuState(false);
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getMenuFocusable();
    if (focusable.length < 2) return;

    const first = focusable[0];
    const firstMenuLink = focusable[1];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!focusable.includes(active)) {
      e.preventDefault();
      first.focus({ preventScroll: true });
      return;
    }

    if (!e.shiftKey && active === first) {
      e.preventDefault();
      firstMenuLink.focus({ preventScroll: true });
      return;
    }

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus({ preventScroll: true });
      return;
    }

    if (e.shiftKey && active === firstMenuLink) {
      e.preventDefault();
      first.focus({ preventScroll: true });
      return;
    }

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  });

  /* ── Active nav ───────────────────── */
  const page = document.body.dataset.page;
  if (page) {
    navLinks.forEach((link) => {
      const active = link.dataset.navLink === page;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  /* ── Page transitions ─────────────── */
  if (!overlay) return;

  let isTransitioning = false;

  const revealPage = () => {
    isTransitioning = false;
    overlay.classList.add('is-hidden');
    overlay.classList.remove('is-exiting');
  };

  const navigateWithOverlay = (url) => {
    if (isTransitioning) return;
    isTransitioning = true;

    if (reducedMotion) {
      window.location.href = url.href;
      return;
    }

    overlay.classList.remove('is-hidden');
    overlay.classList.add('is-exiting');

    let didNavigate = false;
    const navigate = () => {
      if (didNavigate) return;
      didNavigate = true;
      window.location.href = url.href;
    };

    overlay.addEventListener('transitionend', (event) => {
      if (event.propertyName === 'opacity') navigate();
    }, { once: true });
    window.setTimeout(navigate, 650);
  };

  window.requestAnimationFrame(revealPage);
  window.addEventListener('pageshow', () => window.requestAnimationFrame(revealPage));

  document.querySelectorAll('.site-nav a[href], .side-menu__nav a[href]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (link.target && link.target !== '_self') return;

      const targetUrl  = new URL(href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (targetUrl.origin !== currentUrl.origin) return;

      const sameDocument = targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search;
      if (sameDocument) {
        const sameHash = targetUrl.hash === currentUrl.hash;
        if (!targetUrl.hash || sameHash) e.preventDefault();
        if (isMenuOpen()) setMenuState(false, { restoreFocus: false });
        return;
      }

      e.preventDefault();
      if (isMenuOpen()) setMenuState(false, { restoreFocus: false });
      navigateWithOverlay(targetUrl);
    });
  });
})();
