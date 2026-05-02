/* ═══════════════════════════════════════════════════════════════
   TRYGER AUTH
   Manejo de sesión del agente (sessionStorage).
   Para producción real, considerar httpOnly cookies del lado de Apps Script.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const SESSION_KEY = 'tryger_user';

  window.TrygerAuth = {
    // Guarda la sesión después de un login exitoso
    setSession(user) {
      const enriched = {
        ...user,
        initials: (user.nombre || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(enriched));
      return enriched;
    },

    getSession() {
      try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      } catch (e) {
        return null;
      }
    },

    isLoggedIn() {
      return !!this.getSession();
    },

    logout() {
      sessionStorage.removeItem(SESSION_KEY);
    },

    // Helper que valida sesión y redirige al login si no hay
    requireAuth(loginUrl = 'login.html') {
      if (!this.isLoggedIn()) {
        window.location.replace(loginUrl);
        return false;
      }
      return true;
    }
  };
})();
