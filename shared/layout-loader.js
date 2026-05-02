/* ═══════════════════════════════════════════════════════════════
   TRYGER · LAYOUT LOADER (v4)
   Inyecta sidebar y topbar reemplazando el slot manualmente
   con replaceChild (más seguro y predecible que outerHTML).
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function getSharedBase() {
    const path = window.location.pathname;
    if (path.includes('/agente/') || path.includes('/admin/') || path.includes('/cotizacion/')) {
      return '../shared/';
    }
    return 'shared/';
  }

  function getLoginUrl() {
    const path = window.location.pathname;
    if (path.includes('/agente/') || path.includes('/admin/') || path.includes('/cotizacion/')) {
      return '../login.html';
    }
    return 'login.html';
  }

  const SHARED_BASE = getSharedBase();

  // Convierte un string de HTML en el primer elemento real.
  function htmlToElement(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = (html || '').trim();
    // Devolver el primer elemento (ignora texto y comentarios)
    return tmp.firstElementChild;
  }

  async function injectPartial(slotName, partialFile) {
    const slot = document.querySelector('[data-slot="' + slotName + '"]');
    if (!slot) {
      console.warn('[layout] Slot no encontrado: ' + slotName);
      return false;
    }
    if (!slot.parentNode) {
      console.warn('[layout] Slot sin parent: ' + slotName);
      return false;
    }

    try {
      const url = SHARED_BASE + partialFile;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' al cargar ' + url);
      const html = await res.text();
      const el = htmlToElement(html);
      if (!el) throw new Error('Partial vacío o malformado: ' + partialFile);

      // Reemplazo seguro
      slot.parentNode.replaceChild(el, slot);
      return true;
    } catch (err) {
      console.error('[layout] No se pudo inyectar ' + partialFile + ':', err);
      try {
        slot.innerHTML = '<div style="padding:14px;color:#b91c1c;font-size:12px;">Error al cargar ' + partialFile + '.</div>';
      } catch (e) { /* ignore */ }
      return false;
    }
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
      const el = document.querySelector('[data-crumb-section]');
      if (el) el.textContent = section;
    }
    if (page) {
      const el = document.querySelector('[data-crumb-page]');
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

  async function bootstrapLayout() {
    const layout = document.body.dataset.layout;

    try {
      if (layout === 'agente') {
        await injectPartial('sidebar', 'sidebar-agente.html');
        await injectPartial('topbar', 'topbar.html');
      } else if (layout === 'admin') {
        await injectPartial('sidebar', 'sidebar-admin.html');
        await injectPartial('topbar', 'topbar.html');
      }
      configureSidebar();
      configureBreadcrumb();
      configureUser();
    } catch (err) {
      console.error('[layout] Error inesperado:', err);
    } finally {
      document.dispatchEvent(new CustomEvent('layout:ready'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapLayout);
  } else {
    setTimeout(bootstrapLayout, 0);
  }

  window.TrygerLayout = {
    logout: function() {
      sessionStorage.removeItem('tryger_user');
      window.location.replace(getLoginUrl());
    },
    getLoginUrl: getLoginUrl
  };
})();
