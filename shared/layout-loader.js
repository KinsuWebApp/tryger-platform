/* ═══════════════════════════════════════════════════════════════
   TRYGER · LAYOUT HELPER (v6 — con soporte móvil)
   - Configura sidebar/topbar (que ya están inline en cada página).
   - Inyecta y maneja el menú hamburguesa para mobile.
   - Cierra el sidebar al hacer clic en cualquier nav-item o backdrop.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function getLoginUrl() {
    const path = window.location.pathname;
    if (path.includes('/agente/') || path.includes('/admin/') || path.includes('/cotizacion/')) {
      return '../login.html';
    }
    return 'login.html';
  }

  function configureSidebar() {
    const activeKey = document.body.dataset.active;
    if (!activeKey) return;
    const item = document.querySelector('.nav-item[data-nav="' + activeKey + '"]');
    if (item) item.classList.add('active');
  }

  function configureBreadcrumb() {
    const section = document.body.dataset.crumbSection;
    const page = document.body.dataset.crumbPage;
    if (section) {
      const el = document.querySelector('span[data-crumb-section]');
      if (el) el.textContent = section;
    }
    if (page) {
      const el = document.querySelector('span[data-crumb-page]');
      if (el) el.textContent = page;
    }
    document.title = page ? (page + ' · Tryger') : 'Tryger';
  }

  function configureUser() {
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem('tryger_user') || 'null');
    } catch (e) { user = null; }

    if (!user) {
      const path = window.location.pathname;
      const isInternal = /\/(agente|admin)\//.test(path);
      if (isInternal && window.AUTH_CHECK_ENABLED !== false) {
        window.location.replace(getLoginUrl());
        return;
      }
      user = { nombre: 'Juan Pérez', initials: 'JP', rol: 'Agente · Activo' };
    }

    const initials = user.initials ||
      (user.nombre || 'U').split(' ').filter(Boolean).map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();

    document.querySelectorAll('[data-user-initials]').forEach(function(el) { el.textContent = initials; });
    document.querySelectorAll('[data-user-name]').forEach(function(el) { el.textContent = user.nombre || 'Usuario'; });
    document.querySelectorAll('[data-user-role]').forEach(function(el) { el.textContent = user.rol || 'Agente · Activo'; });
  }

  // ─── MOBILE MENU ───
  function setupMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // 1. Crear botón hamburguesa en el topbar (si la página tiene topbar)
    const topbar = document.querySelector('.topbar');
    if (topbar && !topbar.querySelector('.topbar-burger')) {
      const burger = document.createElement('button');
      burger.className = 'topbar-burger';
      burger.setAttribute('aria-label', 'Abrir menú');
      burger.innerHTML = '<span class="material-symbols-outlined">menu</span>';
      topbar.insertBefore(burger, topbar.firstChild);
    }

    // 2. Crear botón de cierre dentro del sidebar
    if (!sidebar.querySelector('.sidebar-close')) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'sidebar-close';
      closeBtn.setAttribute('aria-label', 'Cerrar menú');
      closeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
      sidebar.insertBefore(closeBtn, sidebar.firstChild);
    }

    // 3. Crear backdrop (si no existe)
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    // 4. Listeners
    function open() {
      sidebar.classList.add('open');
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }

    const burgerBtn = topbar && topbar.querySelector('.topbar-burger');
    const closeBtn = sidebar.querySelector('.sidebar-close');

    if (burgerBtn) burgerBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    // Cerrar al hacer clic en cualquier nav-item (en mobile, no en desktop)
    sidebar.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (window.innerWidth <= 860) close();
      });
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) close();
    });

    // Si redimensionan a desktop, cerrar drawer
    window.addEventListener('resize', function() {
      if (window.innerWidth > 860 && sidebar.classList.contains('open')) close();
    });
  }

  function bootstrap() {
    configureSidebar();
    configureBreadcrumb();
    configureUser();
    setupMobileMenu();
    document.dispatchEvent(new CustomEvent('layout:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    setTimeout(bootstrap, 0);
  }

  window.TrygerLayout = {
    logout: function() {
      sessionStorage.removeItem('tryger_user');
      window.location.replace(getLoginUrl());
    },
    getLoginUrl: getLoginUrl
  };
})();
