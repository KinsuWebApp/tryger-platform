/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · SEED
 * Crea las 12 pestañas del Sheet con sus columnas y datos dummy.
 *
 * CÓMO USAR:
 *   1. Configurar SPREADSHEET_ID en PropertiesService (ver README).
 *   2. Seleccionar la función `seed` en el desplegable del editor.
 *   3. Hacer clic en Ejecutar (▶).
 *   4. Aprobar permisos la primera vez.
 *   5. Esperar 10-30 segundos. Revisar el log.
 *
 * ⚠️ Si la pestaña ya existe con datos, NO la borra (a menos que la borres a mano).
 *    Solo crea pestañas que falten.
 * ════════════════════════════════════════════════════════════════
 */

function seed() {
  Logger.log('▶ Iniciando seed...');

  const ss = getSpreadsheet();

  // Crear pestañas con sus headers
  Object.keys(SHEETS).forEach(key => {
    const sheetName = SHEETS[key];
    const cols = COLUMNS[sheetName];
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`  ✓ Pestaña creada: ${sheetName}`);
    } else {
      Logger.log(`  · Pestaña ya existía: ${sheetName} (no se modifica)`);
      return;
    }

    // Setear headers
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    sheet.getRange(1, 1, 1, cols.length)
      .setFontWeight('bold')
      .setBackground('#0d1c2e')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Auto-fit columnas
    cols.forEach((_, i) => sheet.autoResizeColumn(i + 1));
  });

  // Borrar la pestaña por default si existe ("Hoja 1" o "Sheet1")
  ['Hoja 1', 'Sheet1'].forEach(name => {
    const s = ss.getSheetByName(name);
    if (s && ss.getSheets().length > 1) {
      ss.deleteSheet(s);
      Logger.log(`  · Pestaña por default "${name}" eliminada`);
    }
  });

  // Insertar datos dummy
  seedDummyData();

  Logger.log('✓ Seed completado.');
  Logger.log('  Próximos pasos:');
  Logger.log('  1. Implementar → Nueva implementación → Aplicación web');
  Logger.log('  2. Copiar la URL del Web App en shared/api.js (frontend)');

  return { success: true };
}

/**
 * Inserta los datos dummy iniciales (solo si las pestañas están vacías).
 */
function seedDummyData() {
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
  const hoursAgo = (n) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();

  // ─── AGENTES (incluye AGT-HOUSE) ───
  if (readSheet(SHEETS.AGENTES).length === 0) {
    const dummyPassword = hashPassword('1234');

    appendRow(SHEETS.AGENTES, {
      agent_id: 'AGT-HOUSE',
      codigo_agente: 'TR-0001',
      consecutivo: 1,
      nombre_completo: 'Tryger House',
      email: 'house@tryger.com',
      password_hash: dummyPassword,
      telefono: '5500000000',
      rfc: '',
      razon_social: 'Tryger House',
      regimen_fiscal: '',
      estatus: 'activo',
      fecha_alta: daysAgo(180),
      creado_por: 'sistema',
      ultimo_login: ''
    });

    appendRow(SHEETS.AGENTES, {
      agent_id: 'AGT-001',
      codigo_agente: 'JP-1024',
      consecutivo: 1024,
      nombre_completo: 'Juan Pérez García',
      email: 'juan.perez@tryger.com',
      password_hash: dummyPassword,
      telefono: '5512345678',
      rfc: 'PEGJ800101ABC',
      razon_social: '',
      regimen_fiscal: '612',
      estatus: 'activo',
      fecha_alta: daysAgo(90),
      creado_por: 'admin',
      ultimo_login: hoursAgo(2)
    });

    appendRow(SHEETS.AGENTES, {
      agent_id: 'AGT-002',
      codigo_agente: 'MR-1025',
      consecutivo: 1025,
      nombre_completo: 'María Ramírez López',
      email: 'maria.ramirez@tryger.com',
      password_hash: dummyPassword,
      telefono: '5587654321',
      rfc: 'RALM850515XYZ',
      razon_social: '',
      regimen_fiscal: '612',
      estatus: 'activo',
      fecha_alta: daysAgo(60),
      creado_por: 'admin',
      ultimo_login: daysAgo(1)
    });
    Logger.log('  ✓ 3 agentes dummy insertados (incluye AGT-HOUSE)');
  }

  // ─── ADMINISTRADORES ───
  if (readSheet(SHEETS.ADMINISTRADORES).length === 0) {
    appendRow(SHEETS.ADMINISTRADORES, {
      admin_id: 'ADM-001',
      nombre_completo: 'Admin Tryger',
      email: 'admin@tryger.com',
      password_hash: hashPassword('admin1234'),
      rol: 'super_admin',
      estatus: 'activo',
      fecha_alta: daysAgo(180),
      ultimo_login: ''
    });
    Logger.log('  ✓ 1 admin dummy insertado');
  }

  // ─── LEADS ───
  if (readSheet(SHEETS.LEADS).length === 0) {
    const leads = [
      { lead_id:'LEAD-0001', agent_id:'AGT-001', nombre:'Carlos Ramírez', empresa:'TransCarga SA de CV', tel:'5598765432', email:'carlos@transcarga.mx', origen:'landing_con_codigo', estatus:'convertido', dias:15, codigo:'JP-1024' },
      { lead_id:'LEAD-0002', agent_id:'AGT-001', nombre:'María González', empresa:'Personal', tel:'5511223344', email:'maria.g@gmail.com', origen:'landing_con_codigo', estatus:'cotizado', dias:2, codigo:'JP-1024' },
      { lead_id:'LEAD-0003', agent_id:'AGT-001', nombre:'Jorge Villarreal', empresa:'Logística Global', tel:'5544556677', email:'jvillarreal@logisticaglobal.mx', origen:'manual', estatus:'en_revision', dias:4, codigo:'' },
      { lead_id:'LEAD-0004', agent_id:'AGT-001', nombre:'Ana Mendoza', empresa:'Transportes Mendoza', tel:'5523456789', email:'ana@tmendoza.mx', origen:'manual', estatus:'cotizado', dias:7, codigo:'' },
      { lead_id:'LEAD-0005', agent_id:'AGT-001', nombre:'Roberto Sánchez', empresa:'Cargo Express', tel:'5567890123', email:'rsanchez@cargoexpress.com', origen:'landing_con_codigo', estatus:'convertido', dias:20, codigo:'JP-1024' }
    ];
    leads.forEach(l => {
      appendRow(SHEETS.LEADS, {
        lead_id: l.lead_id,
        agent_id: l.agent_id,
        codigo_agente_capturado: l.codigo,
        nombre_prospecto: l.nombre,
        telefono: l.tel,
        email: l.email,
        empresa: l.empresa,
        origen: l.origen,
        fecha_creacion: daysAgo(l.dias),
        estatus_general: l.estatus,
        notas: ''
      });
    });
    Logger.log('  ✓ 5 leads dummy insertados');
  }

  // ─── POLIZAS ───
  if (readSheet(SHEETS.POLIZAS).length === 0) {
    const polizas = [
      { id:'POL-0089', lead:'LEAD-0001', num:'TRG-2026-00089', estatus:'pagada', prima:8500, emision:10, pago:3 },
      { id:'POL-0085', lead:'LEAD-0005', num:'TRG-2026-00085', estatus:'emitida', prima:12300, emision:5, pago:null },
      { id:'POL-0083', lead:'LEAD-0003', num:'',                estatus:'en_revision', prima:15900, emision:null, pago:null }
    ];
    polizas.forEach(p => {
      appendRow(SHEETS.POLIZAS, {
        poliza_id: p.id,
        cotizacion_id: '',
        lead_id: p.lead,
        agent_id: 'AGT-001',
        numero_poliza: p.num,
        estatus: p.estatus,
        monto_prima: p.prima,
        fecha_envio_revision: daysAgo(p.emision != null ? p.emision + 2 : 4),
        fecha_emision: p.emision != null ? daysAgo(p.emision) : '',
        fecha_pago: p.pago != null ? daysAgo(p.pago) : '',
        fecha_vigencia_inicio: '',
        fecha_vigencia_fin: '',
        fecha_cancelacion: '',
        motivo_cancelacion: '',
        notas_cancelacion: '',
        notas_comercial: '',
        actualizado_por: 'admin',
        fecha_ultima_actualizacion: daysAgo(p.pago != null ? p.pago : (p.emision != null ? p.emision : 4))
      });
    });
    Logger.log('  ✓ 3 pólizas dummy insertadas');
  }

  // ─── COMISIONES ───
  if (readSheet(SHEETS.COMISIONES).length === 0) {
    appendRow(SHEETS.COMISIONES, {
      comision_id: 'COM-0001', poliza_id: 'POL-0089', agent_id: 'AGT-001',
      monto: 850, porcentaje: 10, estatus: 'pagada',
      fecha_asignacion: daysAgo(10), fecha_pago: daysAgo(2),
      referencia_pago: 'SPEI-12345', asignada_por: 'admin', notas: ''
    });
    appendRow(SHEETS.COMISIONES, {
      comision_id: 'COM-0002', poliza_id: 'POL-0085', agent_id: 'AGT-001',
      monto: 1230, porcentaje: 10, estatus: 'por_pagar',
      fecha_asignacion: daysAgo(5), fecha_pago: '',
      referencia_pago: '', asignada_por: 'admin', notas: ''
    });
    Logger.log('  ✓ 2 comisiones dummy insertadas');
  }

  // ─── TARIFARIO DUMMY ───
  if (readSheet(SHEETS.TARIFARIO).length === 0) {
    appendRow(SHEETS.TARIFARIO, {
      regla_id: 'TAR-001',
      tipo_vehiculo: '*',
      rango_valor_carga_min: 0,
      rango_valor_carga_max: 99999999,
      tasa_base_porcentaje: 1.0,
      factor_kilometraje: 0.5,
      factor_duracion: 0,
      prima_minima: 2000,
      version: 'v1',
      vigente: true,
      notas: 'Tarifa dummy mientras Tryger nos da la fórmula real'
    });
    Logger.log('  ✓ Tarifario dummy insertado');
  }

  // ─── CAPACITACIÓN ───
  if (readSheet(SHEETS.CAPACITACION).length === 0) {
    const contenidos = [
      { sec: 'que_es_tryger', titulo: '¿Qué es Tryger?', cuerpo: 'Tryger es un seguro de transporte de carga por evento. Cubre un viaje específico (origen, destino, mercancía y vehículo) en lugar de toda una flota anual.', orden: 1 },
      { sec: 'como_explicarlo', titulo: '¿Cómo explicarlo a tu cliente?', cuerpo: 'Es como un seguro de viaje, pero para la carga: el transportista contrata cobertura solo para los días que necesita.', orden: 2 },
      { sec: 'que_cubre', titulo: '¿Qué cubre la póliza?', cuerpo: 'Robo total, robo parcial, daños por accidente del vehículo transportador, y daños por maniobras de carga/descarga.', orden: 3 },
      { sec: 'casos_exito', titulo: 'Casos de éxito', cuerpo: 'Transportista de maquinaria pesada que cotizó CDMX→Monterrey en 4 minutos y emitió la póliza el mismo día.', orden: 4 },
      { sec: 'preguntas_frecuentes', titulo: 'FAQs', cuerpo: '¿Cuánto tarda en emitirse? Entre 24 y 48 hrs hábiles. ¿Hay límites de monto? Hasta $5M MXN por viaje.', orden: 5 }
    ];
    contenidos.forEach((c, i) => {
      appendRow(SHEETS.CAPACITACION, {
        contenido_id: `CAP-${String(i + 1).padStart(3, '0')}`,
        seccion: c.sec,
        titulo: c.titulo,
        cuerpo: c.cuerpo,
        orden: c.orden,
        activo: true,
        actualizado_por: 'admin',
        fecha_actualizacion: daysAgo(15)
      });
    });
    Logger.log('  ✓ 5 contenidos de capacitación insertados');
  }

  // ─── MATERIALES ───
  if (readSheet(SHEETS.MATERIALES).length === 0) {
    const materiales = [
      { titulo: 'One-pager Tryger', desc: 'Resumen del producto en una página', tipo: 'pdf', cat: 'producto' },
      { titulo: 'Argumentos de venta', desc: '7 argumentos clave para convencer a tu cliente', tipo: 'texto', cat: 'ventas' },
      { titulo: 'Mensaje WhatsApp', desc: 'Texto sugerido para enviar tu código por WhatsApp', tipo: 'texto', cat: 'comunicacion' },
      { titulo: 'Imagen para redes', desc: 'Creatividad cuadrada para Instagram/LinkedIn', tipo: 'imagen', cat: 'redes' }
    ];
    materiales.forEach((m, i) => {
      appendRow(SHEETS.MATERIALES, {
        material_id: `MAT-${String(i + 1).padStart(3, '0')}`,
        titulo: m.titulo,
        descripcion: m.desc,
        tipo: m.tipo,
        drive_url: '',
        contenido_texto: m.tipo === 'texto' ? 'Texto de ejemplo — el admin lo edita después.' : '',
        categoria: m.cat,
        activo: true,
        fecha_publicacion: daysAgo(30)
      });
    });
    Logger.log('  ✓ 4 materiales dummy insertados');
  }
}

/**
 * Función auxiliar para borrar TODAS las pestañas y volver a empezar.
 * ⚠️ DESTRUCTIVO. Úsala solo si quieres reset total.
 */
function resetAllSheets() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  // Crear una pestaña temporal para no quedarse sin ninguna
  const temp = ss.insertSheet('_temp_' + Date.now());
  sheets.forEach(s => {
    if (s.getSheetId() !== temp.getSheetId()) {
      ss.deleteSheet(s);
    }
  });
  Logger.log('Todas las pestañas eliminadas. Corre seed() para recrear.');
}
