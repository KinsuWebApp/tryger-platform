/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · COTIZACIONES
 * Wizard de 3 pasos: datos del prospecto → trayecto/vehículo/carga → resultado.
 * Mientras Tryger no nos dé la fórmula real de cálculo, usamos una dummy:
 *   prima = max($2,000, valor_carga * 0.01 + km * 0.5)
 *   comisión estimada = prima * 0.10
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Crea una cotización. La prima se calcula al momento.
 */
function createQuote(payload) {
  const required = ['lead_id', 'agent_id', 'origen_viaje', 'destino_viaje', 'valor_carga'];
  for (const f of required) {
    if (payload[f] == null || payload[f] === '') {
      return { success: false, error: `missing_field:${f}` };
    }
  }

  // Cálculo de prima
  const valorCarga = Number(payload.valor_carga) || 0;
  const km = Number(payload.kilometros) || 0;
  const calc = calcularPrimaDummy(valorCarga, km);

  const cotizacion_id = generateId(SHEETS.COTIZACIONES, 'COT', 4);
  const newQuote = {
    cotizacion_id,
    lead_id: payload.lead_id,
    agent_id: payload.agent_id,
    origen_viaje: payload.origen_viaje,
    destino_viaje: payload.destino_viaje,
    kilometros: km,
    duracion_horas: Number(payload.duracion_horas) || 0,
    tipo_vehiculo: payload.tipo_vehiculo || '',
    tipo_carga: payload.tipo_carga || '',
    descripcion_carga: payload.descripcion_carga || '',
    valor_carga: valorCarga,
    fecha_inicio_viaje: payload.fecha_inicio_viaje || '',
    fecha_fin_viaje: payload.fecha_fin_viaje || '',
    prima_calculada: calc.prima,
    tarifa_aplicada: calc.detalle,
    fecha_cotizacion: new Date().toISOString(),
    estatus: 'generada'
  };

  appendRow(SHEETS.COTIZACIONES, newQuote);

  // Marcar el lead como cotizado
  try {
    updateRow(SHEETS.LEADS, payload.lead_id, { estatus_general: 'cotizado' });
  } catch (e) { /* silent */ }

  return {
    success: true,
    cotizacion_id,
    prima_calculada: calc.prima,
    comision_estimada: Math.round(calc.prima * 0.10),
    validez_dias: 7,
    data: newQuote
  };
}

/**
 * Cálculo dummy de prima (mientras Tryger nos da la fórmula real).
 */
function calcularPrimaDummy(valorCarga, kilometros) {
  const TASA_BASE = 0.01;       // 1% del valor de la carga
  const FACTOR_KM = 0.5;        // 0.5 MXN por km
  const PRIMA_MINIMA = 2000;    // MXN

  const calculada = Math.max(PRIMA_MINIMA, valorCarga * TASA_BASE + kilometros * FACTOR_KM);
  const prima = Math.round(calculada);

  return {
    prima,
    detalle: `tasa_base:${TASA_BASE}|factor_km:${FACTOR_KM}|prima_minima:${PRIMA_MINIMA}`
  };
}

/**
 * Envía una cotización a revisión del equipo de Tryger.
 *  - Cambia el estatus de la cotización a 'enviada_a_revision'.
 *  - Crea una póliza con estatus 'en_revision' (vinculada al lead y agente).
 */
function submitQuoteForReview(quoteId) {
  if (!quoteId) return { success: false, error: 'missing_quoteId' };

  const cotizaciones = readSheet(SHEETS.COTIZACIONES);
  const quote = cotizaciones.find(q => q.cotizacion_id === quoteId);
  if (!quote) return { success: false, error: 'quote_not_found' };

  if (quote.estatus !== 'generada') {
    return { success: false, error: 'invalid_status_transition' };
  }

  // Actualizar cotización
  updateRow(SHEETS.COTIZACIONES, quoteId, { estatus: 'enviada_a_revision' });

  // Crear póliza en revisión
  const poliza_id = generateId(SHEETS.POLIZAS, 'POL', 4);
  const newPolicy = {
    poliza_id,
    cotizacion_id: quoteId,
    lead_id: quote.lead_id,
    agent_id: quote.agent_id,
    numero_poliza: '', // lo asigna comercial al emitir
    estatus: 'en_revision',
    monto_prima: quote.prima_calculada,
    fecha_envio_revision: new Date().toISOString(),
    fecha_emision: '',
    fecha_pago: '',
    fecha_vigencia_inicio: quote.fecha_inicio_viaje || '',
    fecha_vigencia_fin: quote.fecha_fin_viaje || '',
    fecha_cancelacion: '',
    motivo_cancelacion: '',
    notas_cancelacion: '',
    notas_comercial: '',
    actualizado_por: '',
    fecha_ultima_actualizacion: new Date().toISOString()
  };

  appendRow(SHEETS.POLIZAS, newPolicy);

  // Marcar lead como en revisión
  try {
    updateRow(SHEETS.LEADS, quote.lead_id, { estatus_general: 'en_revision' });
  } catch (e) { /* silent */ }

  return {
    success: true,
    poliza_id,
    cotizacion_id: quoteId,
    estatus: 'en_revision'
  };
}
