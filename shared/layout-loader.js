/* ═══════════════════════════════════════════════════════════════
   LAYOUT LOADER
   Inyecta dinámicamente sidebar y topbar en cada página interna.
   
   Cómo usarlo en una página:
   1. <body data-layout="agente" data-active="dashboard"
            data-crumb-section="Mi operación" data-crumb-page="Dashboard">
   2. Incluir un contenedor: <div data-slot="sidebar"></div>
   3. Incluir un contenedor: <div data-slot="topbar"></div>
   4. Importar este script: <script src="../shared/layout-loader.js"></script>
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Detectar la ruta base relativa al archivo actual.
  // Ejemplo: si estamos en /agente/dashboard.html, base = '../shared/'
  // si estamos en /admin/dashboard.html, base = '../shared/'
  // si estamos en /login.html (raíz), base = 'shared/'
  function getSharedBase() {
    const path = window.location.pathname;
    // Contar niveles de profundidad (excluyendo el archivo final)
    const parts = path.split('/').filter(p => p && !p.endsWith('.html'));
    // Si está en raíz del proyecto, profundidad = 0 (más el repo name si aplica)
    // Detectamos si estamos directamente en /tryger-platform/ o dentro de carpeta
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'agente' || lastPart === 'admin' || lastPart === 'cotizacion') {
      return '../shared/';
    }
    return 'shared/';
  }

  const SHARED_BASE = getSharedBase();

  // Carga un parcial HTML y lo inyecta en el slot indicado
  async function injectPartial(slotName, partialFile) {
    const slot = document.querySelector(`[data-slot="${slotName}"]`);
    if (!slot) return;

    try {
      const res = await fetch(SHARED_BASE + partialFile);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      slot.outerHTML = html;
    } catch (err) {
      console.error(`Error cargando ${partialFile}:`, err);
      slot.innerHTML = `<div style="padding:20px;color:#D4516D;font-size:12px;">
        Error cargando ${partialFile}. ¿Estás corriendo desde un servidor local? 
        (file:// no funciona). Usa <code>python3 -m http.server</code>.
      </div>`;
    }
  }

  // Configura el sidebar: marca el item activo según data-active del body
  function configureSidebar() {
    const activeKey = document.body.dataset.active;
    if (!activeKey) return;
    const item = document.querySelector(`.nav-item[data-nav="${activeKey}"]`);
    if (item) item.classList.add('active');
  }

  // Configura el breadcrumb según data-crumb-* del body
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
    document.title = page ? `${page} · Tryger` : 'Tryger';
  }

  // Llena los datos del usuario (avatar, nombre, rol) desde sessionStorage
  function configureUser() {
    let user;
    try {
      user = JSON.parse(sessionStorage.getItem('tryger_user') || 'null');
    } catch (e) { user = null; }

    if (!user) {
      // Si no hay sesión y estamos en una página interna, mandar al login
      const path = window.location.pathname;
      const isInternal = /\/(agente|admin)\//.test(path);
      if (isInternal && window.AUTH_CHECK_ENABLED !== false) {
        window.location.replace(getLoginUrl());
        return;
      }
      // Datos default para desarrollo
      user = {
        nombre: 'Juan Pérez',
        initials: 'JP',
        rol: 'Agente · Activo'
      };
    }

    document.querySelectorAll('[data-user-initials]').forEach(el => {
      el.textContent = user.initials || (user.nombre || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
    });
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = user.nombre || 'Usuario';
    });
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = user.rol || 'Agente · Activo';
    });
  }

  function getLoginUrl() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    // Subir un nivel si estamos dentro de /agente/ o /admin/
    if (path.includes('/agente/') || path.includes('/admin/') || path.includes('/cotizacion/')) {
      return '../login.html';
    }
    return 'login.html';
  }

  // Ejecutar inyección al cargar el DOM
  document.addEventListener('DOMContentLoaded', async () => {
    const layout = document.body.dataset.layout;

    if (layout === 'agente') {
      await injectPartial('sidebar', 'sidebar-agente.html');
      await injectPartial('topbar', 'topbar.html');
    } else if (layout === 'admin') {
      // Para Fase 5
      await injectPartial('sidebar', 'sidebar-admin.html');
      await injectPartial('topbar', 'topbar.html');
    }

    configureSidebar();
    configureBreadcrumb();
    configureUser();

    // Disparar evento por si la página tiene lógica adicional que esperar
    document.dispatchEvent(new CustomEvent('layout:ready'));
  });

  // Exponer helpers
  window.TrygerLayout = {
    logout: function() {
      sessionStorage.removeItem('tryger_user');
      window.location.replace(getLoginUrl());
    },
    getLoginUrl
  };
})();
