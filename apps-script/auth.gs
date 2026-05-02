/**
 * ════════════════════════════════════════════════════════════════
 * TRYGER · AUTH
 * Login del agente, validación de credenciales, hashing.
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Login: busca agente por email y verifica el password.
 * Devuelve la sesión (subset de datos del agente) si las credenciales son válidas.
 */
function loginAgent(email, password) {
  if (!email || !password) {
    return { success: false, error: 'missing_credentials' };
  }

  const agentes = readSheet(SHEETS.AGENTES);
  const normalizedEmail = String(email).trim().toLowerCase();
  const agent = agentes.find(a => String(a.email || '').toLowerCase() === normalizedEmail);

  if (!agent) {
    return { success: false, error: 'invalid_credentials' };
  }

  if (agent.estatus === 'inactivo') {
    return { success: false, error: 'account_inactive' };
  }

  // Verificar password
  const candidateHash = hashPassword(password);
  if (candidateHash !== agent.password_hash) {
    return { success: false, error: 'invalid_credentials' };
  }

  // Actualizar último login (no es crítico si falla)
  try {
    updateRow(SHEETS.AGENTES, agent.agent_id, {
      ultimo_login: new Date().toISOString()
    });
  } catch (e) { /* silent */ }

  return {
    success: true,
    user: {
      agent_id: agent.agent_id,
      codigo_agente: agent.codigo_agente,
      nombre: agent.nombre_completo,
      email: agent.email,
      rol: 'Agente · ' + (agent.estatus === 'activo' ? 'Activo' : 'Pendiente')
    }
  };
}

/**
 * Hash SHA-256 de un password. Devuelve hex string.
 * NOTA: Para producción real con datos sensibles, considerar bcrypt/scrypt
 * vía un servicio externo, ya que Apps Script solo ofrece SHA-256 directo
 * (sin salt aleatorio nativo). Mientras tanto: SHA-256 con un salt fijo de marca.
 */
function hashPassword(password) {
  const SALT = 'tryger.v1.salt'; // ⚠️ Si esto cambia, todos los passwords existentes dejan de servir.
  const raw = SALT + ':' + password;
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    raw,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => {
    const hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
