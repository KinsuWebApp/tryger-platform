/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · AGENTES
 * CRUD de agentes + generación automática del código XX-NNNN.
 * Solo admins pueden crear agentes (validación a futuro vía sesión).
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Genera un código de agente con formato XX-NNNN.
 *  - XX: 2 letras del nombre (iniciales del primer y segundo nombre/apellido).
 *  - NNNN: consecutivo global, empieza en 1024.
 *
 * Si el primer XX colisiona con un código existente, agrega 1 al consecutivo
 * y reintenta hasta encontrar uno único.
 */
function generateAgentCode(nombreCompleto) {
  const initials = extractInitials(nombreCompleto);
  const agentes = readSheet(SHEETS.AGENTES);

  // Consecutivo: max(consecutivos) + 1, base 1024.
  const usedCodes = new Set(agentes.map(a => a.codigo_agente));
  let consecutivo = 1024;
  agentes.forEach(a => {
    const c = parseInt(a.consecutivo, 10);
    if (!isNaN(c) && c >= consecutivo) consecutivo = c + 1;
  });

  // Avanzar hasta encontrar un código único (rarísimo que choque, pero por seguridad)
  let code;
  do {
    code = `${initials}-${String(consecutivo).padStart(4, '0')}`;
    consecutivo++;
  } while (usedCodes.has(code));

  return { codigo_agente: code, consecutivo: consecutivo - 1 };
}

/**
 * Extrae 2 letras de un nombre completo.
 *  - "Juan Pérez García" → "JP"
 *  - "Juan" → "JU"
 *  - "" → "AG" (default)
 */
function extractInitials(nombreCompleto) {
  if (!nombreCompleto) return 'AG';
  const parts = String(nombreCompleto).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AG';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase().padEnd(2, 'X');
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Crea un nuevo agente. Solo admins.
 */
function createAgent(payload) {
  const required = ['nombre_completo', 'email', 'password'];
  for (const f of required) {
    if (!payload[f]) return { success: false, error: `missing_field:${f}` };
  }

  const agentes = readSheet(SHEETS.AGENTES);
  const normalizedEmail = String(payload.email).trim().toLowerCase();
  if (agentes.find(a => String(a.email || '').toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'email_already_exists' };
  }

  const { codigo_agente, consecutivo } = generateAgentCode(payload.nombre_completo);
  const agent_id = generateId(SHEETS.AGENTES, 'AGT', 3);

  const newAgent = {
    agent_id,
    codigo_agente,
    consecutivo,
    nombre_completo: payload.nombre_completo,
    email: normalizedEmail,
    password_hash: hashPassword(payload.password),
    telefono: payload.telefono || '',
    rfc: payload.rfc || '',
    razon_social: payload.razon_social || '',
    regimen_fiscal: payload.regimen_fiscal || '',
    estatus: payload.estatus || 'activo',
    fecha_alta: new Date().toISOString(),
    creado_por: payload.creado_por || 'admin',
    ultimo_login: ''
  };

  appendRow(SHEETS.AGENTES, newAgent);

  return {
    success: true,
    agent: {
      agent_id: newAgent.agent_id,
      codigo_agente: newAgent.codigo_agente,
      nombre_completo: newAgent.nombre_completo,
      email: newAgent.email
    }
  };
}

/**
 * Devuelve todos los agentes (sin password_hash).
 */
function getAllAgents() {
  const agentes = readSheet(SHEETS.AGENTES);
  return {
    success: true,
    data: agentes.map(a => {
      const { password_hash, ...safe } = a;
      return safe;
    })
  };
}

/**
 * Devuelve el perfil de un agente (sin password_hash).
 */
function getAgentProfile(agentId) {
  const agentes = readSheet(SHEETS.AGENTES);
  const agent = agentes.find(a => a.agent_id === agentId);
  if (!agent) return { success: false, error: 'agent_not_found' };
  const { password_hash, ...safe } = agent;
  return { success: true, data: safe };
}

/**
 * Resuelve un código de agente capturado en la landing pública.
 * Devuelve el agent_id y nombre, o null si no existe.
 */
function resolveAgentCode(code) {
  if (!code) return { success: false, error: 'missing_code' };
  const normalized = String(code).trim().toUpperCase();

  if (!/^[A-Z]{2}-\d{4}$/.test(normalized)) {
    return { success: false, error: 'invalid_format' };
  }

  const agentes = readSheet(SHEETS.AGENTES);
  const agent = agentes.find(a => String(a.codigo_agente).toUpperCase() === normalized);
  if (!agent) return { success: false, error: 'code_not_found' };
  if (agent.estatus !== 'activo') return { success: false, error: 'agent_inactive' };

  return {
    success: true,
    agent: {
      agent_id: agent.agent_id,
      codigo_agente: agent.codigo_agente,
      nombre: agent.nombre_completo
    }
  };
}

/**
 * Calcula el dashboard del agente desde el Sheet (versión real, no mock).
 */
function getAgentDashboard(agentId) {
  if (!agentId) return { success: false, error: 'missing_agentId' };

  const allLeads = readSheet(SHEETS.LEADS).filter(l => l.agent_id === agentId);
  const allPolicies = readSheet(SHEETS.POLIZAS).filter(p => p.agent_id === agentId);
  const allCommissions = readSheet(SHEETS.COMISIONES).filter(c => c.agent_id === agentId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLeads = allLeads.filter(l => l.fecha_creacion && new Date(l.fecha_creacion) >= thirtyDaysAgo);
  const cotizacionesMes = recentLeads.filter(l =>
    ['cotizado', 'en_revision', 'convertido'].includes(l.estatus_general)
  ).length;
  const emitidasMes = allPolicies.filter(p =>
    ['emitida', 'por_pagar', 'pagada'].includes(p.estatus) &&
    p.fecha_emision && new Date(p.fecha_emision) >= thirtyDaysAgo
  ).length;
  const pagadasMes = allPolicies.filter(p =>
    p.estatus === 'pagada' && p.fecha_pago && new Date(p.fecha_pago) >= thirtyDaysAgo
  ).length;
  const canceladasMes = allPolicies.filter(p =>
    p.estatus === 'cancelada' && p.fecha_cancelacion && new Date(p.fecha_cancelacion) >= thirtyDaysAgo
  ).length;

  const comisionAcumulada = allCommissions
    .filter(c => c.estatus === 'pagada')
    .reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const comisionPorCobrar = allCommissions
    .filter(c => c.estatus === 'por_pagar')
    .reduce((s, c) => s + (Number(c.monto) || 0), 0);

  const conv1 = cotizacionesMes > 0 ? (emitidasMes / cotizacionesMes * 100) : 0;
  const conv2 = emitidasMes > 0 ? (pagadasMes / emitidasMes * 100) : 0;

  // Recientes 5 leads ordenados por fecha desc
  const recent = allLeads
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .slice(0, 5)
    .map(l => {
      const policy = allPolicies.find(p => p.lead_id === l.lead_id);
      const commission = policy ? allCommissions.find(c => c.poliza_id === policy.poliza_id) : null;
      return {
        lead_id: l.lead_id,
        nombre: l.nombre_prospecto,
        empresa: l.empresa,
        origen: l.origen,
        estatus: policy ? policy.estatus : l.estatus_general,
        prima: policy ? Number(policy.monto_prima) || null : null,
        comision: commission ? Number(commission.monto) || null : null,
        comision_estatus: commission ? commission.estatus : null,
        fecha: l.fecha_creacion
      };
    });

  return {
    success: true,
    data: {
      kpis: {
        prospectosMes: recentLeads.length,
        cotizaciones: cotizacionesMes,
        emitidas: emitidasMes,
        comisionAcumulada,
        comisionPorCobrar
      },
      funnel: {
        cotizaciones: cotizacionesMes,
        emitidas: emitidasMes,
        pagadas: pagadasMes,
        canceladas: canceladasMes,
        conversionCotizacionesAEmitidas: Math.round(conv1 * 10) / 10,
        conversionEmitidasAPagadas: Math.round(conv2 * 10) / 10
      },
      activity: [], // TODO Fase 2-3: armar feed real desde varias pestañas
      recentLeads: recent,
      totalLeads: allLeads.length
    }
  };
}
