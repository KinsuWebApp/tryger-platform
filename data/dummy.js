/* ═══════════════════════════════════════════════════════════════
   TRYGER MOCK DATA
   Datos dummy que simulan la respuesta del backend mientras
   Apps Script no está conectado. Cuando esté en vivo, se ignora.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── DATOS BASE ───
  const AGENTS = [
    {
      agent_id: 'AGT-001',
      codigo_agente: 'JP-1024',
      nombre_completo: 'Juan Pérez García',
      email: 'juan.perez@tryger.com',
      password: '1234', // ⚠️ solo desarrollo
      telefono: '5512345678',
      rfc: 'PEGJ800101ABC',
      estatus: 'activo',
      rol: 'Agente · Activo'
    },
    {
      agent_id: 'AGT-002',
      codigo_agente: 'MR-1025',
      nombre_completo: 'María Ramírez López',
      email: 'maria.ramirez@tryger.com',
      password: '1234',
      telefono: '5587654321',
      rfc: 'RALM850515XYZ',
      estatus: 'activo',
      rol: 'Agente · Activo'
    }
  ];

  const LEADS = [
    {
      lead_id: 'LEAD-0001',
      agent_id: 'AGT-001',
      nombre_prospecto: 'Carlos Ramírez',
      empresa: 'TransCarga SA de CV',
      telefono: '5598765432',
      email: 'carlos@transcarga.mx',
      origen: 'landing_con_codigo',
      estatus_general: 'convertido',
      fecha_creacion: daysAgo(15)
    },
    {
      lead_id: 'LEAD-0002',
      agent_id: 'AGT-001',
      nombre_prospecto: 'María González',
      empresa: 'Personal',
      telefono: '5511223344',
      email: 'maria.g@gmail.com',
      origen: 'landing_con_codigo',
      estatus_general: 'cotizado',
      fecha_creacion: daysAgo(2)
    },
    {
      lead_id: 'LEAD-0003',
      agent_id: 'AGT-001',
      nombre_prospecto: 'Jorge Villarreal',
      empresa: 'Logística Global',
      telefono: '5544556677',
      email: 'jvillarreal@logisticaglobal.mx',
      origen: 'manual',
      estatus_general: 'en_revision',
      fecha_creacion: daysAgo(4)
    },
    {
      lead_id: 'LEAD-0004',
      agent_id: 'AGT-001',
      nombre_prospecto: 'Ana Mendoza',
      empresa: 'Transportes Mendoza',
      telefono: '5523456789',
      email: 'ana@tmendoza.mx',
      origen: 'manual',
      estatus_general: 'cotizado',
      fecha_creacion: daysAgo(7)
    },
    {
      lead_id: 'LEAD-0005',
      agent_id: 'AGT-001',
      nombre_prospecto: 'Roberto Sánchez',
      empresa: 'Cargo Express',
      telefono: '5567890123',
      email: 'rsanchez@cargoexpress.com',
      origen: 'landing_con_codigo',
      estatus_general: 'convertido',
      fecha_creacion: daysAgo(20)
    }
  ];

  const POLICIES = [
    {
      poliza_id: 'POL-0089',
      lead_id: 'LEAD-0001',
      agent_id: 'AGT-001',
      numero_poliza: 'TRG-2026-00089',
      estatus: 'pagada',
      monto_prima: 8500,
      fecha_emision: daysAgo(10),
      fecha_pago: daysAgo(3)
    },
    {
      poliza_id: 'POL-0085',
      lead_id: 'LEAD-0005',
      agent_id: 'AGT-001',
      numero_poliza: 'TRG-2026-00085',
      estatus: 'emitida',
      monto_prima: 12300,
      fecha_emision: daysAgo(5)
    },
    {
      poliza_id: 'POL-0083',
      lead_id: 'LEAD-0003',
      agent_id: 'AGT-001',
      numero_poliza: null,
      estatus: 'en_revision',
      monto_prima: 15900,
      fecha_envio_revision: daysAgo(4)
    }
  ];

  const COMMISSIONS = [
    { comision_id: 'COM-001', poliza_id: 'POL-0089', agent_id: 'AGT-001', monto: 850, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(2) },
    { comision_id: 'COM-002', poliza_id: 'POL-0085', agent_id: 'AGT-001', monto: 1230, porcentaje: 10, estatus: 'por_pagar' },
    // Histórico
    { comision_id: 'COM-003', poliza_id: 'POL-0078', agent_id: 'AGT-001', monto: 720, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(28) },
    { comision_id: 'COM-004', poliza_id: 'POL-0072', agent_id: 'AGT-001', monto: 1450, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(45) },
    { comision_id: 'COM-005', poliza_id: 'POL-0068', agent_id: 'AGT-001', monto: 980, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(60) },
    { comision_id: 'COM-006', poliza_id: 'POL-0061', agent_id: 'AGT-001', monto: 2100, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(75) },
    { comision_id: 'COM-007', poliza_id: 'POL-0058', agent_id: 'AGT-001', monto: 670, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(82) },
    { comision_id: 'COM-008', poliza_id: 'POL-0052', agent_id: 'AGT-001', monto: 1850, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(95) },
    { comision_id: 'COM-009', poliza_id: 'POL-0048', agent_id: 'AGT-001', monto: 2600, porcentaje: 10, estatus: 'pagada', fecha_pago: daysAgo(110) }
  ];

  const ACTIVITY = [
    { type: 'payment',  text: '<strong>Carlos Ramírez</strong> pagó POL-0089 (<span class="amt">+$850</span>)', when: hoursAgo(2) },
    { type: 'visit',    text: 'Nueva cotización con tu código desde <strong>WhatsApp</strong>', when: hoursAgo(5) },
    { type: 'quote',    text: '<strong>María González</strong> cotizó por <span class="amt">$8,500</span>', when: daysAgo(1) },
    { type: 'issued',   text: '<strong>POL-0085</strong> emitida satisfactoriamente', when: daysAgo(2) },
    { type: 'quote',    text: 'Cotizaste a <strong>TransCarga SA</strong> · <span class="amt">$12,300</span>', when: daysAgo(3) }
  ];

  // ─── HELPERS ───
  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }
  function hoursAgo(n) {
    const d = new Date();
    d.setHours(d.getHours() - n);
    return d.toISOString();
  }

  // ─── CALCULADORA DE MÉTRICAS DE FUNNEL ───
  function calcAgentDashboard(agentId) {
    const myLeads = LEADS.filter(l => l.agent_id === agentId);
    const myPolicies = POLICIES.filter(p => p.agent_id === agentId);
    const myCommissions = COMMISSIONS.filter(c => c.agent_id === agentId);

    // KPIs del mes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLeads = myLeads.filter(l => new Date(l.fecha_creacion) >= thirtyDaysAgo);

    const cotizaciones = recentLeads.filter(l =>
      ['cotizado','convertido','en_revision'].includes(l.estatus_general)
    ).length;
    const emitidas = myPolicies.filter(p => ['emitida','por_pagar','pagada'].includes(p.estatus)).length;
    const pagadas = myPolicies.filter(p => p.estatus === 'pagada').length;
    const canceladas = myPolicies.filter(p => p.estatus === 'cancelada').length;

    const comisionAcumulada = myCommissions
      .filter(c => c.estatus === 'pagada')
      .reduce((s, c) => s + c.monto, 0);
    const comisionPorCobrar = myCommissions
      .filter(c => c.estatus === 'por_pagar')
      .reduce((s, c) => s + c.monto, 0);

    // Inflar valores demo para que el dashboard se vea "vivo"
    const prospectosMes = 47;
    const cotizacionesMes = 28;
    const polizasEmitidasMes = 9;
    const polizasPagadasMes = 7;
    const polizasCanceladasMes = 2;

    return {
      success: true,
      data: {
        kpis: {
          prospectosMes,
          cotizaciones: cotizacionesMes,
          emitidas: polizasEmitidasMes,
          comisionAcumulada: 12450,
          comisionPorCobrar: 2100
        },
        funnel: {
          cotizaciones: cotizacionesMes,
          emitidas: polizasEmitidasMes,
          pagadas: polizasPagadasMes,
          canceladas: polizasCanceladasMes,
          conversionCotizacionesAEmitidas: 32.1,
          conversionEmitidasAPagadas: 77.7
        },
        activity: ACTIVITY,
        recentLeads: enrichLeadsForTable(myLeads).slice(0, 3),
        totalLeads: 47
      }
    };
  }

  function enrichLeadsForTable(leads) {
    return leads
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
      .map(l => {
        const policy = POLICIES.find(p => p.lead_id === l.lead_id);
        const commission = policy
          ? COMMISSIONS.find(c => c.poliza_id === policy.poliza_id)
          : null;

        // Mapear estatus general del lead a un estatus visible
        let estatusVisible = l.estatus_general;
        if (policy) {
          estatusVisible = policy.estatus;
        }

        return {
          lead_id: l.lead_id,
          nombre: l.nombre_prospecto,
          empresa: l.empresa,
          origen: l.origen,
          estatus: estatusVisible,
          prima: policy ? policy.monto_prima : null,
          comision: commission ? commission.monto : null,
          comision_estatus: commission ? commission.estatus : null,
          fecha: l.fecha_creacion
        };
      });
  }

  // ─── INTERFAZ MOCK ───
  // Cada función imita la respuesta del backend real.
  window.TrygerMock = {
    async login({ email, password }) {
      await delay(400);
      const agent = AGENTS.find(a => a.email === email && a.password === password);
      if (!agent) return { success: false, error: 'invalid_credentials' };
      return {
        success: true,
        user: {
          agent_id: agent.agent_id,
          codigo_agente: agent.codigo_agente,
          nombre: agent.nombre_completo,
          email: agent.email,
          rol: agent.rol
        }
      };
    },

    async getAgentDashboard({ agentId }) {
      await delay(200);
      return calcAgentDashboard(agentId || 'AGT-001');
    },

    async getAgentLeads({ agentId, filters }) {
      await delay(200);
      const leads = LEADS.filter(l => l.agent_id === (agentId || 'AGT-001'));
      return { success: true, data: enrichLeadsForTable(leads) };
    },

    async getAgentCommissions({ agentId }) {
      await delay(200);
      return {
        success: true,
        data: COMMISSIONS.filter(c => c.agent_id === (agentId || 'AGT-001'))
      };
    },

    async resolveAgentCode({ code }) {
      await delay(200);
      const normalized = (code || '').trim().toUpperCase();
      const agent = AGENTS.find(a => a.codigo_agente === normalized);
      if (!agent) return { success: false, error: 'code_not_found' };
      return {
        success: true,
        agent: {
          agent_id: agent.agent_id,
          codigo_agente: agent.codigo_agente,
          nombre: agent.nombre_completo
        }
      };
    },

    async createLead(data) {
      await delay(300);
      const newId = `LEAD-${String(LEADS.length + 1).padStart(4, '0')}`;
      return { success: true, lead_id: newId };
    },

    async createQuote(data) {
      await delay(400);
      const newId = `COT-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      // Cálculo dummy de prima (mientras Tryger nos da la fórmula real)
      const valorCarga = Number(data.valor_carga) || 0;
      const km = Number(data.kilometros) || 0;
      const tasaBase = 0.01; // 1%
      const factorKm = 0.5;
      const primaCalculada = Math.max(2000, valorCarga * tasaBase + km * factorKm);
      return {
        success: true,
        cotizacion_id: newId,
        prima_calculada: Math.round(primaCalculada),
        comision_estimada: Math.round(primaCalculada * 0.10),
        validez_dias: 7
      };
    },

    async createLeadAndQuote(data) {
      await delay(500);
      const leadId = `LEAD-${String(LEADS.length + 1).padStart(4, '0')}`;
      const quoteId = `COT-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      const valorCarga = Number(data.valor_carga) || 0;
      const km = Number(data.kilometros) || 0;
      const primaCalculada = Math.max(2000, valorCarga * 0.01 + km * 0.5);
      return {
        success: true,
        lead_id: leadId,
        cotizacion_id: quoteId,
        prima_calculada: Math.round(primaCalculada),
        comision_estimada: Math.round(primaCalculada * 0.10),
        validez_dias: 7
      };
    },

    async submitQuoteForReview({ quoteId }) {
      await delay(300);
      const polizaId = `POL-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      return { success: true, poliza_id: polizaId, cotizacion_id: quoteId, estatus: 'en_revision' };
    }
  };

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
})();
