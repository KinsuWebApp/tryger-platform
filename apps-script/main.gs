/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · MAIN ROUTER
 * Punto de entrada del Web App. Recibe POST/GET y despacha
 * a las funciones correctas según el "action".
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Maneja las peticiones POST (la mayoría de mutaciones).
 * El body debe ser JSON con: { action: 'login', payload: {...} }
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Maneja las peticiones GET (útil para testing rápido y endpoints públicos)
 * Si tiene ?action=algo lo despacha; si no, devuelve un health check.
 */
function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return jsonResponse({
      success: true,
      message: 'Tryger Backend OK',
      timestamp: new Date().toISOString(),
      version: 'v1'
    });
  }
  return handleRequest(e);
}

/**
 * Despachador unificado.
 */
function handleRequest(e) {
  try {
    let action, payload;

    if (e.postData && e.postData.contents) {
      // Petición POST con body JSON
      const body = JSON.parse(e.postData.contents);
      action = body.action;
      payload = body.payload || {};
    } else if (e.parameter && e.parameter.action) {
      // Petición GET con query params
      action = e.parameter.action;
      payload = e.parameter;
    } else {
      return jsonResponse({ success: false, error: 'No action provided' });
    }

    // Mapeo de acciones → funciones
    const handlers = {
      // Auth
      'login':                  (p) => loginAgent(p.email, p.password),
      'logout':                 ()  => ({ success: true }),

      // Agente
      'getAgentDashboard':      (p) => getAgentDashboard(p.agentId),
      'getAgentProfile':        (p) => getAgentProfile(p.agentId),
      'getAgentLeads':          (p) => getAgentLeads(p.agentId, p.filters),
      'getAgentCommissions':    (p) => getAgentCommissions(p.agentId),

      // Leads y cotizaciones
      'createLead':             (p) => createLead(p),
      'createQuote':            (p) => createQuote(p),
      'submitQuoteForReview':   (p) => submitQuoteForReview(p.quoteId),

      // Public
      'resolveAgentCode':       (p) => resolveAgentCode(p.code),
      'createPublicLead':       (p) => createPublicLead(p),

      // Admin
      'getAllAgents':           ()  => getAllAgents(),
      'createAgent':            (p) => createAgent(p),
      'updatePolicyStatus':     (p) => updatePolicyStatus(p),
      'assignCommission':       (p) => assignCommission(p)
    };

    const handler = handlers[action];
    if (!handler) {
      return jsonResponse({ success: false, error: `Acción desconocida: ${action}` });
    }

    const result = handler(payload);
    return jsonResponse(result);

  } catch (err) {
    Logger.log('Error en handleRequest: ' + err.message + ' | Stack: ' + err.stack);
    return jsonResponse({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
}

/**
 * Helper para responder JSON.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ─────────────────────────────────────────────────────────
 * HELPERS DE LECTURA/ESCRITURA EN SHEETS
 * ─────────────────────────────────────────────────────────
 */

/**
 * Lee todos los registros de una pestaña como array de objetos.
 */
function readSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Pestaña "${sheetName}" no existe`);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => row[0] !== '' && row[0] != null)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

/**
 * Inserta un objeto como nueva fila al final, respetando el orden de COLUMNS.
 */
function appendRow(sheetName, obj) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Pestaña "${sheetName}" no existe`);
  const cols = COLUMNS[sheetName];
  if (!cols) throw new Error(`No hay COLUMNS definidos para "${sheetName}"`);
  const row = cols.map(c => obj[c] != null ? obj[c] : '');
  sheet.appendRow(row);
}

/**
 * Actualiza una fila por su id (primera columna).
 * updates: objeto con los campos a modificar.
 */
function updateRow(sheetName, idValue, updates) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Pestaña "${sheetName}" no existe`);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idValue) {
      const rowIndex = i + 1; // +1 porque getRange es 1-indexed
      headers.forEach((h, colIdx) => {
        if (updates.hasOwnProperty(h)) {
          sheet.getRange(rowIndex, colIdx + 1).setValue(updates[h]);
        }
      });
      return true;
    }
  }
  return false;
}

/**
 * Genera un ID consecutivo para una pestaña (ej: LEAD-0042).
 */
function generateId(sheetName, prefix, padding = 4) {
  const records = readSheet(sheetName);
  const next = records.length + 1;
  return `${prefix}-${String(next).padStart(padding, '0')}`;
}
