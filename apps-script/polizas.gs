/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · POLIZAS
 * Ciclo de vida de pólizas. Solo admins cambian estatus.
 *
 * Transiciones válidas:
 *   en_revision → en_cotizacion → por_emitir → emitida → por_pagar → pagada
 *   cualquiera → cancelada (con motivo)
 *   en_revision → rechazada
 * ════════════════════════════════════════════════════════════════
 */

// Mapa de transiciones válidas
const VALID_POLICY_TRANSITIONS = {
  'en_revision':    ['en_cotizacion', 'rechazada', 'cancelada'],
  'en_cotizacion':  ['por_emitir', 'rechazada', 'cancelada'],
  'por_emitir':     ['emitida', 'cancelada'],
  'emitida':        ['por_pagar', 'cancelada'],
  'por_pagar':      ['pagada', 'cancelada'],
  'pagada':         ['cancelada'],
  'cancelada':      [],
  'rechazada':      []
};

/**
 * Actualiza el estatus de una póliza con validación de transiciones.
 * Si se cancela, dispara la actualización de la comisión asociada.
 */
function updatePolicyStatus(payload) {
  const required = ['poliza_id', 'nuevo_estatus'];
  for (const f of required) {
    if (!payload[f]) return { success: false, error: `missing_field:${f}` };
  }

  const polizas = readSheet(SHEETS.POLIZAS);
  const policy = polizas.find(p => p.poliza_id === payload.poliza_id);
  if (!policy) return { success: false, error: 'policy_not_found' };

  const transicionesOK = VALID_POLICY_TRANSITIONS[policy.estatus] || [];
  if (!transicionesOK.includes(payload.nuevo_estatus)) {
    return {
      success: false,
      error: 'invalid_transition',
      detail: `${policy.estatus} → ${payload.nuevo_estatus} no permitida`
    };
  }

  const updates = {
    estatus: payload.nuevo_estatus,
    actualizado_por: payload.actualizado_por || 'admin',
    fecha_ultima_actualizacion: new Date().toISOString()
  };

  // Stamps de fecha según transición
  const now = new Date().toISOString();
  if (payload.nuevo_estatus === 'emitida') {
    updates.fecha_emision = now;
    if (payload.numero_poliza) updates.numero_poliza = payload.numero_poliza;
  }
  if (payload.nuevo_estatus === 'pagada') {
    updates.fecha_pago = now;
  }
  if (payload.nuevo_estatus === 'cancelada') {
    updates.fecha_cancelacion = now;
    updates.motivo_cancelacion = payload.motivo_cancelacion || 'no_especificado';
    updates.notas_cancelacion = payload.notas_cancelacion || '';
  }

  if (payload.notas_comercial) {
    updates.notas_comercial = payload.notas_comercial;
  }

  updateRow(SHEETS.POLIZAS, payload.poliza_id, updates);

  // Si se cancela, manejar la comisión asociada
  if (payload.nuevo_estatus === 'cancelada') {
    handleCommissionOnCancel(payload.poliza_id);
  }

  // Si se emite, crear comisión en estado por_pagar
  if (payload.nuevo_estatus === 'emitida') {
    autoCreateCommissionOnIssue(policy);
  }

  return { success: true, poliza_id: payload.poliza_id, nuevo_estatus: payload.nuevo_estatus };
}

/**
 * Cuando una póliza se cancela:
 *  - Si la comisión estaba 'pendiente' o 'por_pagar' → se marca como 'cancelada'.
 *  - Si la comisión ya estaba 'pagada' → se marca como 'pagada_con_clawback'
 *    (significa que hay que recuperar el monto del agente — política exacta TBD por Tryger).
 */
function handleCommissionOnCancel(poliza_id) {
  const comisiones = readSheet(SHEETS.COMISIONES);
  const commission = comisiones.find(c => c.poliza_id === poliza_id);
  if (!commission) return;

  let nuevoEstatus;
  if (commission.estatus === 'pagada') {
    nuevoEstatus = 'pagada_con_clawback';
  } else if (['pendiente', 'por_pagar'].includes(commission.estatus)) {
    nuevoEstatus = 'cancelada';
  } else {
    return; // Ya estaba en otro estatus terminal — no tocar
  }

  updateRow(SHEETS.COMISIONES, commission.comision_id, {
    estatus: nuevoEstatus,
    notas: (commission.notas || '') + ` [Cancelada por póliza ${poliza_id} el ${new Date().toISOString()}]`
  });
}

/**
 * Crea una comisión automáticamente cuando una póliza se emite.
 * Comisión = 10% de la prima (placeholder — definir bien con Tryger).
 */
function autoCreateCommissionOnIssue(policy) {
  // Verificar si ya existe (no duplicar)
  const existing = readSheet(SHEETS.COMISIONES).find(c => c.poliza_id === policy.poliza_id);
  if (existing) return;

  const PORCENTAJE = 10;
  const monto = Math.round((Number(policy.monto_prima) || 0) * (PORCENTAJE / 100));

  appendRow(SHEETS.COMISIONES, {
    comision_id: generateId(SHEETS.COMISIONES, 'COM', 4),
    poliza_id: policy.poliza_id,
    agent_id: policy.agent_id,
    monto,
    porcentaje: PORCENTAJE,
    estatus: 'por_pagar',
    fecha_asignacion: new Date().toISOString(),
    fecha_pago: '',
    referencia_pago: '',
    asignada_por: 'sistema',
    notas: 'Comisión generada automáticamente al emitir la póliza'
  });
}
