/* ═══════════════════════════════════════════════════════════════
   TRYGER API CLIENT
   Cliente que habla con el backend de Apps Script.
   Mientras APPS_SCRIPT_URL esté vacío, usa datos dummy de /data/dummy.js
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ⚠️ CUANDO TENGAS PUBLICADO EL APPS SCRIPT, PEGA AQUÍ LA URL DEL WEB APP.
  // Mientras esté vacío, todas las llamadas devuelven datos dummy.
  const APPS_SCRIPT_URL = '';

  const isLive = () => APPS_SCRIPT_URL && APPS_SCRIPT_URL.length > 10;

  // Llamada genérica al backend
  async function callBackend(action, payload = {}) {
    if (!isLive()) {
      // Modo mock: la lógica vive en TrygerMock (ver dummy.js)
      if (window.TrygerMock && typeof window.TrygerMock[action] === 'function') {
        return await window.TrygerMock[action](payload);
      }
      console.warn(`[API] No hay endpoint live ni mock para "${action}"`);
      return { success: false, error: 'No backend available' };
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script no permite JSON content-type sin CORS preflight
        body: JSON.stringify({ action, payload })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[API] Error en "${action}":`, err);
      return { success: false, error: err.message };
    }
  }

  // ─── API pública ───
  window.TrygerAPI = {
    isLive,

    // Auth
    login: (email, password) => callBackend('login', { email, password }),
    logout: () => callBackend('logout'),

    // Agente
    getAgentDashboard: (agentId) => callBackend('getAgentDashboard', { agentId }),
    getAgentProfile: (agentId) => callBackend('getAgentProfile', { agentId }),
    getAgentLeads: (agentId, filters) => callBackend('getAgentLeads', { agentId, filters }),
    getAgentCommissions: (agentId) => callBackend('getAgentCommissions', { agentId }),

    // Leads y cotizaciones
    createLead: (data) => callBackend('createLead', data),
    createQuote: (data) => callBackend('createQuote', data),
    submitQuoteForReview: (quoteId) => callBackend('submitQuoteForReview', { quoteId }),

    // Public
    resolveAgentCode: (code) => callBackend('resolveAgentCode', { code }),
    createPublicLead: (data) => callBackend('createPublicLead', data),

    // Admin (para Fase 5)
    getAllAgents: () => callBackend('getAllAgents'),
    createAgent: (data) => callBackend('createAgent', data),
    updatePolicyStatus: (data) => callBackend('updatePolicyStatus', data),
    assignCommission: (data) => callBackend('assignCommission', data)
  };
})();
