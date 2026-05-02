/* ═══════════════════════════════════════════════════════════════
   TRYGER UTILS
   Helpers de formato y utilidades comunes.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  window.TrygerUtils = {
    // Formato de moneda mexicana
    money(n, opts = {}) {
      const num = Number(n) || 0;
      const decimals = opts.decimals != null ? opts.decimals : 2;
      const formatted = num.toLocaleString('es-MX', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return opts.symbol === false ? formatted : `$${formatted}`;
    },

    // Atajo: formato compacto sin decimales si es entero
    moneyCompact(n) {
      const num = Number(n) || 0;
      const isInt = Number.isInteger(num);
      return this.money(num, { decimals: isInt ? 0 : 2 });
    },

    // Formato de fecha relativa (hace 2h, ayer, hace 3 días)
    relativeTime(date) {
      const d = (date instanceof Date) ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      const diffH = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffH / 24);

      if (diffMin < 1) return 'ahora';
      if (diffMin < 60) return `hace ${diffMin}min`;
      if (diffH < 24) return `hace ${diffH}h`;
      if (diffDays === 1) return 'ayer';
      if (diffDays < 7) return `hace ${diffDays} días`;
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    },

    // Formato de fecha corta (03 may, 15 abr 2026)
    shortDate(date, withYear = false) {
      const d = (date instanceof Date) ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      const opts = { day: '2-digit', month: 'short' };
      if (withYear) opts.year = 'numeric';
      return d.toLocaleDateString('es-MX', opts).replace('.', '');
    },

    // Obtiene iniciales (2 letras max) de un nombre
    initials(fullname) {
      if (!fullname) return 'U';
      return fullname
        .split(' ')
        .filter(Boolean)
        .map(p => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    },

    // Genera color de avatar consistente a partir de un texto (hash sencillo)
    avatarGradient(seed) {
      // Por ahora regresamos siempre el mismo (azul → cian) para mantener consistencia visual
      return 'linear-gradient(135deg, #1565c0 0%, #5DA3C3 100%)';
    },

    // Valida formato de código de agente XX-NNNN
    isValidAgentCode(code) {
      if (!code) return false;
      return /^[A-Z]{2}-\d{4}$/.test(code.trim().toUpperCase());
    },

    // Normaliza código (mayúsculas, sin espacios)
    normalizeAgentCode(code) {
      return (code || '').trim().toUpperCase();
    },

    // Debounce para inputs
    debounce(fn, ms = 300) {
      let t;
      return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
      };
    },

    // Mapeo de estatus → label + clase de status-dot
    statusLabel(estatus) {
      const map = {
        'nuevo':           { label: 'Nuevo',            klass: 'gray' },
        'cotizado':        { label: 'Cotizado',         klass: 'blue' },
        'en_revision':     { label: 'En revisión',      klass: 'amber' },
        'en_cotizacion':   { label: 'En cotización',    klass: 'blue' },
        'por_emitir':      { label: 'Por emitir',       klass: 'amber' },
        'emitida':         { label: 'Emitida',          klass: 'green' },
        'por_pagar':       { label: 'Por pagar',        klass: 'amber' },
        'pagada':          { label: 'Pagada',           klass: 'green' },
        'cancelada':       { label: 'Cancelada',        klass: 'rose' },
        'rechazada':       { label: 'Rechazada',        klass: 'rose' }
      };
      return map[estatus] || { label: estatus, klass: 'gray' };
    }
  };
})();
