/* ═══════════════════════════════════════════════════════════════
   TRYGER · LAYOUT HELPER (v5 — sin fetch)
   Configura sidebar/topbar que YA están inline en cada página.
   No hay carga asíncrona, no hay fetch, no puede fallar.
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
      // Selector específico: span del breadcrumb, NO el body que también tiene el atributo
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

  function bootstrap() {
    configureSidebar();
    configureBreadcrumb();
    configureUser();
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
