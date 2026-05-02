/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · COMISIONES
 * Gestión de comisiones. Solo admins asignan/marcan como pagada.
 * Estatus: pendiente, por_pagar, pagada, cancelada, pagada_con_clawback.
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Asigna o actualiza una comisión manualmente (desde el admin).
 * Si el monto está vacío, lo calcula como 10% de la prima de la póliza.
 */
function assignCommission(payload) {
  const required = ['poliza_id'];
  for (const f of required) {
    if (!payload[f]) return { success: false, error: `missing_field:${f}` };
  }

  const polizas = readSheet(SHEETS.POLIZAS);
  const policy = polizas.find(p => p.poliza_id === payload.poliza_id);
  if (!policy) return { success: false, error: 'policy_not_found' };

  const PORCENTAJE = Number(payload.porcentaje) || 10;
  const monto = payload.monto != null
    ? Number(payload.monto)
    : Math.round((Number(policy.monto_prima) || 0) * (PORCENTAJE / 100));

  // ¿Ya existe una comisión para esta póliza?
  const comisiones = readSheet(SHEETS.COMISIONES);
  const existing = comisiones.find(c => c.poliza_id === payload.poliza_id);

  if (existing) {
    // Actualizar
    const updates = {
      monto,
      porcentaje: PORCENTAJE,
      estatus: payload.estatus || existing.estatus,
      asignada_por: payload.asignada_por || 'admin',
      notas: payload.notas || existing.notas
    };
    if (payload.estatus === 'pagada') {
      updates.fecha_pago = new Date().toISOString();
      updates.referencia_pago = payload.referencia_pago || '';
    }
    updateRow(SHEETS.COMISIONES, existing.comision_id, updates);
    return { success: true, comision_id: existing.comision_id, action: 'updated' };
  } else {
    // Crear nueva
    const comision_id = generateId(SHEETS.COMISIONES, 'COM', 4);
    const newCommission = {
      comision_id,
      poliza_id: payload.poliza_id,
      agent_id: policy.agent_id,
      monto,
      porcentaje: PORCENTAJE,
      estatus: payload.estatus || 'por_pagar',
      fecha_asignacion: new Date().toISOString(),
      fecha_pago: payload.estatus === 'pagada' ? new Date().toISOString() : '',
      referencia_pago: payload.referencia_pago || '',
      asignada_por: payload.asignada_por || 'admin',
      notas: payload.notas || ''
    };
    appendRow(SHEETS.COMISIONES, newCommission);
    return { success: true, comision_id, action: 'created' };
  }
}

/**
 * Devuelve todas las comisiones de un agente, enriquecidas con info de la póliza.
 */
function getAgentCommissions(agentId) {
  if (!agentId) return { success: false, error: 'missing_agentId' };

  const comisiones = readSheet(SHEETS.COMISIONES).filter(c => c.agent_id === agentId);
  const polizas = readSheet(SHEETS.POLIZAS);
  const leads = readSheet(SHEETS.LEADS);

  const enriched = comisiones
    .sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion))
    .map(c => {
      const policy = polizas.find(p => p.poliza_id === c.poliza_id);
      const lead = policy ? leads.find(l => l.lead_id === policy.lead_id) : null;
      return {
        comision_id: c.comision_id,
        poliza_id: c.poliza_id,
        numero_poliza: policy ? policy.numero_poliza : '',
        nombre_prospecto: lead ? lead.nombre_prospecto : '',
        empresa: lead ? lead.empresa : '',
        monto: Number(c.monto) || 0,
        porcentaje: Number(c.porcentaje) || 0,
        estatus: c.estatus,
        fecha_asignacion: c.fecha_asignacion,
        fecha_pago: c.fecha_pago,
        referencia_pago: c.referencia_pago,
        notas: c.notas
      };
    });

  // Resumen
  const totalPagada = enriched
    .filter(c => c.estatus === 'pagada')
    .reduce((s, c) => s + c.monto, 0);
  const totalPorPagar = enriched
    .filter(c => c.estatus === 'por_pagar')
    .reduce((s, c) => s + c.monto, 0);
  const totalConClawback = enriched
    .filter(c => c.estatus === 'pagada_con_clawback')
    .reduce((s, c) => s + c.monto, 0);

  return {
    success: true,
    data: enriched,
    summary: {
      totalPagada,
      totalPorPagar,
      totalConClawback,
      countPagadas: enriched.filter(c => c.estatus === 'pagada').length,
      countPorPagar: enriched.filter(c => c.estatus === 'por_pagar').length
    }
  };
}
