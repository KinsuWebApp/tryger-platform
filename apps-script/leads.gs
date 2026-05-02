/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · LEADS
 * Gestión de prospectos: manual (desde webapp del agente) y
 * desde landing pública (con o sin código).
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Crea un lead capturado manualmente por un agente desde su webapp.
 */
function createLead(payload) {
  const required = ['agent_id', 'nombre_prospecto', 'telefono'];
  for (const f of required) {
    if (!payload[f]) return { success: false, error: `missing_field:${f}` };
  }

  const lead_id = generateId(SHEETS.LEADS, 'LEAD', 4);
  const newLead = {
    lead_id,
    agent_id: payload.agent_id,
    codigo_agente_capturado: '', // No aplica para manuales
    nombre_prospecto: payload.nombre_prospecto,
    telefono: payload.telefono,
    email: payload.email || '',
    empresa: payload.empresa || '',
    origen: LEAD_ORIGEN.MANUAL,
    fecha_creacion: new Date().toISOString(),
    estatus_general: payload.estatus_general || 'nuevo',
    notas: payload.notas || ''
  };

  appendRow(SHEETS.LEADS, newLead);

  return { success: true, lead_id, data: newLead };
}

/**
 * Crea un lead desde la landing pública.
 * - Si llega con código: lo resuelve y lo asigna al agente correspondiente.
 * - Si no llega con código (o el código no existe): lo asigna al agente house.
 */
function createPublicLead(payload) {
  const required = ['nombre_prospecto', 'telefono'];
  for (const f of required) {
    if (!payload[f]) return { success: false, error: `missing_field:${f}` };
  }

  let agent_id = AGENT_HOUSE_ID;
  let origen = LEAD_ORIGEN.LANDING_SIN_CODIGO;
  let codigo_agente_capturado = '';

  if (payload.codigo_agente) {
    const resolved = resolveAgentCode(payload.codigo_agente);
    if (resolved.success) {
      agent_id = resolved.agent.agent_id;
      origen = LEAD_ORIGEN.LANDING_CON_CODIGO;
      codigo_agente_capturado = resolved.agent.codigo_agente;
    } else {
      // Código inválido — caer en house pero registrar lo que capturó
      codigo_agente_capturado = payload.codigo_agente;
    }
  }

  const lead_id = generateId(SHEETS.LEADS, 'LEAD', 4);
  const newLead = {
    lead_id,
    agent_id,
    codigo_agente_capturado,
    nombre_prospecto: payload.nombre_prospecto,
    telefono: payload.telefono,
    email: payload.email || '',
    empresa: payload.empresa || '',
    origen,
    fecha_creacion: new Date().toISOString(),
    estatus_general: 'nuevo',
    notas: payload.notas || ''
  };

  appendRow(SHEETS.LEADS, newLead);

  // Registrar visita al cotizador público (analytics)
  try {
    appendRow(SHEETS.VISITAS, {
      visita_id: generateId(SHEETS.VISITAS, 'VIS', 5),
      timestamp: new Date().toISOString(),
      codigo_capturado: payload.codigo_agente || '',
      agent_id_resuelto: agent_id,
      ip_anonimizada: '',
      referrer: payload.referrer || '',
      convirtio_a_cotizacion: false,
      cotizacion_id: ''
    });
  } catch (e) { /* silent */ }

  return { success: true, lead_id, agent_id, origen };
}

/**
 * Devuelve los leads de un agente con joins a pólizas y comisiones.
 * filters: { estatus, origen, desde, hasta } (todos opcionales)
 */
function getAgentLeads(agentId, filters) {
  if (!agentId) return { success: false, error: 'missing_agentId' };
  const f = filters || {};

  let leads = readSheet(SHEETS.LEADS).filter(l => l.agent_id === agentId);
  const policies = readSheet(SHEETS.POLIZAS).filter(p => p.agent_id === agentId);
  const commissions = readSheet(SHEETS.COMISIONES).filter(c => c.agent_id === agentId);

  // Aplicar filtros
  if (f.estatus) leads = leads.filter(l => l.estatus_general === f.estatus);
  if (f.origen)  leads = leads.filter(l => l.origen === f.origen);
  if (f.desde)   leads = leads.filter(l => new Date(l.fecha_creacion) >= new Date(f.desde));
  if (f.hasta)   leads = leads.filter(l => new Date(l.fecha_creacion) <= new Date(f.hasta));

  const enriched = leads
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .map(l => {
      const policy = policies.find(p => p.lead_id === l.lead_id);
      const commission = policy ? commissions.find(c => c.poliza_id === policy.poliza_id) : null;
      return {
        lead_id: l.lead_id,
        nombre: l.nombre_prospecto,
        empresa: l.empresa,
        telefono: l.telefono,
        email: l.email,
        origen: l.origen,
        estatus: policy ? policy.estatus : l.estatus_general,
        prima: policy ? Number(policy.monto_prima) || null : null,
        comision: commission ? Number(commission.monto) || null : null,
        comision_estatus: commission ? commission.estatus : null,
        fecha: l.fecha_creacion
      };
    });

  return { success: true, data: enriched };
}
