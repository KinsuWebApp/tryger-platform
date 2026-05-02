/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · CONFIG
 * Constantes globales. NO credenciales (esas viven en PropertiesService).
 * ════════════════════════════════════════════════════════════════
 */

// Helper para obtener el ID del Sheet desde las propiedades del proyecto.
function getSpreadsheetId() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('SPREADSHEET_ID no está configurado. Ve a ⚙ Configuración del proyecto → Propiedades del script.');
  }
  return id;
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(getSpreadsheetId());
}

// Nombres de las pestañas (ÚNICA fuente de verdad — si cambias aquí, cambia el seed)
const SHEETS = {
  AGENTES:        'Agentes',
  DOCUMENTOS:     'Documentos_Agente',
  LEADS:          'Leads',
  COTIZACIONES:   'Cotizaciones',
  POLIZAS:        'Polizas',
  COMISIONES:     'Comisiones',
  VISITAS:        'Visitas_Cotizador_Publico',
  ADMINISTRADORES:'Administradores',
  TARIFARIO:      'Configuracion_Tarifario',
  CAPACITACION:   'Capacitacion',
  MATERIALES:     'Materiales',
  NOTIFICACIONES: 'Notificaciones_Log'
};

// Columnas por pestaña — definen también el orden de inserción
const COLUMNS = {
  Agentes: [
    'agent_id', 'codigo_agente', 'consecutivo', 'nombre_completo', 'email', 'password_hash',
    'telefono', 'rfc', 'razon_social', 'regimen_fiscal', 'estatus',
    'fecha_alta', 'creado_por', 'ultimo_login'
  ],
  Documentos_Agente: [
    'documento_id', 'agent_id', 'tipo', 'drive_url', 'nombre_archivo',
    'fecha_carga', 'estatus_validacion', 'notas_admin', 'validado_por', 'fecha_validacion'
  ],
  Leads: [
    'lead_id', 'agent_id', 'codigo_agente_capturado', 'nombre_prospecto', 'telefono', 'email',
    'empresa', 'origen', 'fecha_creacion', 'estatus_general', 'notas'
  ],
  Cotizaciones: [
    'cotizacion_id', 'lead_id', 'agent_id', 'origen_viaje', 'destino_viaje', 'kilometros',
    'duracion_horas', 'tipo_vehiculo', 'tipo_carga', 'descripcion_carga', 'valor_carga',
    'fecha_inicio_viaje', 'fecha_fin_viaje', 'prima_calculada', 'tarifa_aplicada',
    'fecha_cotizacion', 'estatus'
  ],
  Polizas: [
    'poliza_id', 'cotizacion_id', 'lead_id', 'agent_id', 'numero_poliza', 'estatus',
    'monto_prima', 'fecha_envio_revision', 'fecha_emision', 'fecha_pago',
    'fecha_vigencia_inicio', 'fecha_vigencia_fin', 'fecha_cancelacion', 'motivo_cancelacion',
    'notas_cancelacion', 'notas_comercial', 'actualizado_por', 'fecha_ultima_actualizacion'
  ],
  Comisiones: [
    'comision_id', 'poliza_id', 'agent_id', 'monto', 'porcentaje', 'estatus',
    'fecha_asignacion', 'fecha_pago', 'referencia_pago', 'asignada_por', 'notas'
  ],
  Visitas_Cotizador_Publico: [
    'visita_id', 'timestamp', 'codigo_capturado', 'agent_id_resuelto',
    'ip_anonimizada', 'referrer', 'convirtio_a_cotizacion', 'cotizacion_id'
  ],
  Administradores: [
    'admin_id', 'nombre_completo', 'email', 'password_hash', 'rol',
    'estatus', 'fecha_alta', 'ultimo_login'
  ],
  Configuracion_Tarifario: [
    'regla_id', 'tipo_vehiculo', 'rango_valor_carga_min', 'rango_valor_carga_max',
    'tasa_base_porcentaje', 'factor_kilometraje', 'factor_duracion',
    'prima_minima', 'version', 'vigente', 'notas'
  ],
  Capacitacion: [
    'contenido_id', 'seccion', 'titulo', 'cuerpo', 'orden', 'activo',
    'actualizado_por', 'fecha_actualizacion'
  ],
  Materiales: [
    'material_id', 'titulo', 'descripcion', 'tipo', 'drive_url',
    'contenido_texto', 'categoria', 'activo', 'fecha_publicacion'
  ],
  Notificaciones_Log: [
    'notif_id', 'destinatario_email', 'destinatario_id', 'tipo',
    'referencia_id', 'asunto', 'enviado', 'fecha_envio', 'error'
  ]
};

// Estatus válidos por entidad
const STATUS = {
  AGENTE: ['activo', 'inactivo', 'pendiente_setup'],
  DOCUMENTO: ['pendiente', 'validado', 'rechazado'],
  LEAD: ['nuevo', 'cotizado', 'en_revision', 'convertido', 'descartado'],
  COTIZACION: ['generada', 'enviada_a_revision', 'aprobada', 'rechazada'],
  POLIZA: ['en_revision', 'en_cotizacion', 'por_emitir', 'emitida', 'por_pagar', 'pagada', 'cancelada', 'rechazada'],
  COMISION: ['pendiente', 'por_pagar', 'pagada', 'cancelada', 'pagada_con_clawback']
};

// Origen de leads
const LEAD_ORIGEN = {
  MANUAL:               'manual',
  LANDING_CON_CODIGO:   'landing_con_codigo',
  LANDING_SIN_CODIGO:   'landing_sin_codigo'
};

// Agente "house" donde caen los leads sin código
const AGENT_HOUSE_ID = 'AGT-HOUSE';
