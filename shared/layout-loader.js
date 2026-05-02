/* ═══════════════════════════════════════════════════════════════
   TRYGER · LAYOUT LOADER (v3)

   Inyecta sidebar y topbar dinámicamente en cada página interna.
   Siempre dispara el evento `layout:ready`, incluso si algo falla,
   para que el resto de la página pueda continuar.

   Uso:
     <body data-layout="agente" data-active="dashboard"
           data-crumb-section="Mi operación" data-crumb-page="Dashboard">
       <div data-slot="sidebar"></div>
       ...
       <div data-slot="topbar"></div>
       ...
     </body>
     <script src="../shared/layout-loader.js"></script>
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

  // Inyecta el contenido del partial reemplazando el div del slot.
  // Usa outerHTML (confiable en navegadores modernos).
  async function injectPartial(slotName, partialFile) {
    const slot = document.querySelector(`[data-slot="${slotName}"]`);
    if (!slot) {
      console.warn(`[layout] Slot no encontrado: ${slotName}`);
      return false;
    }

    try {
      const url = SHARED_BASE + partialFile;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
      const html = await res.text();
      slot.outerHTML = html;
      return true;
    } catch (err) {
      console.error(`[layout] No se pudo inyectar ${partialFile}:`, err);
      try {
        slot.innerHTML = '<div style="padding:14px;color:#b91c1c;font-size:12px;">Error al cargar ' + partialFile + '. Revisa la consola.</div>';
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
      (user.nombre || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
      // Siempre disparar — aún si algo falló, deja que el resto del page corra.
      document.dispatchEvent(new CustomEvent('layout:ready'));
    }
  }

  // Si DOMContentLoaded ya pasó, ejecutar de inmediato.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapLayout);
  } else {
    // El DOM ya está parseado — arrancar en el siguiente tick para que los listeners
    // de layout:ready en otros scripts inline se registren primero.
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
