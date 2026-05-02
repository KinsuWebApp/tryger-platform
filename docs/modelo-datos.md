# Modelo de datos — Tryger Platform

El backend usa un único Google Sheet como base de datos. Este documento describe las 12 pestañas con sus columnas y propósito.

> Las definiciones autoritativas viven en `apps-script/config.gs` (constantes `SHEETS` y `COLUMNS`). Si modificas algo allá, actualiza también este documento.

---

## Convenciones generales

- **IDs:** los genera la app, nunca el usuario. Formato: `<PREFIJO>-<NNNN>`. Ej: `LEAD-0042`, `POL-0089`.
- **Fechas:** ISO 8601 (`2026-04-15T14:30:00.000Z`).
- **Solo edita el admin a mano** la columna `estatus` de Cotizaciones, Pólizas y Comisiones.
- **El frontend NUNCA escribe directo al Sheet** — siempre pasa por el Apps Script publicado como Web App.
- **Denormalización deliberada:** `agent_id` se duplica en Leads, Cotizaciones, Pólizas y Comisiones para reportes rápidos sin necesitar joins.

---

## 1. Agentes

Catálogo de agentes que pueden vender productos Tryger.

| Columna | Tipo | Descripción |
|---|---|---|
| `agent_id` | string | ID único. Formato `AGT-NNN`. |
| `codigo_agente` | string | Código que el agente comparte con sus clientes. Formato `XX-NNNN`. |
| `consecutivo` | int | Número correlativo del código (parte NNNN). Empieza en 1024. |
| `nombre_completo` | string | Nombre completo del agente. |
| `email` | string | Correo (clave de login). Único. |
| `password_hash` | string | SHA-256 con salt. Nunca se expone al frontend. |
| `telefono` | string | 10 dígitos sin formato. |
| `rfc` | string | RFC del agente (físico o moral). |
| `razon_social` | string | Razón social si es persona moral. |
| `regimen_fiscal` | string | Clave del régimen SAT. |
| `estatus` | enum | `activo`, `inactivo`, `pendiente_setup`. |
| `fecha_alta` | datetime | Cuándo se creó el agente. |
| `creado_por` | string | `admin` o `sistema`. |
| `ultimo_login` | datetime | Última vez que entró al sistema. |

**Notas:**
- Hay un agente especial `AGT-HOUSE` con código `TR-0001` donde caen los leads sin código capturado.
- Los agentes no se autoregistran — solo el admin los crea.

---

## 2. Documentos_Agente

Documentos que cada agente sube como parte de su perfil.

| Columna | Tipo | Descripción |
|---|---|---|
| `documento_id` | string | `DOC-NNNN`. |
| `agent_id` | string | FK a Agentes. |
| `tipo` | enum | `cedula_seguros`, `csf`, `caratula_bancaria`, `otro`. |
| `drive_url` | string | URL al archivo en Google Drive. |
| `nombre_archivo` | string | Nombre original. |
| `fecha_carga` | datetime | Cuándo se subió. |
| `estatus_validacion` | enum | `pendiente`, `validado`, `rechazado`. |
| `notas_admin` | string | Por qué se rechazó, si aplica. |
| `validado_por` | string | `admin_id` que validó. |
| `fecha_validacion` | datetime | Cuándo se validó. |

---

## 3. Leads

Prospectos capturados — desde la webapp del agente o desde la landing pública.

| Columna | Tipo | Descripción |
|---|---|---|
| `lead_id` | string | `LEAD-NNNN`. |
| `agent_id` | string | Agente al que pertenece. Si no hay código capturado → `AGT-HOUSE`. |
| `codigo_agente_capturado` | string | El código que el prospecto puso en la landing (puede ser inválido o vacío). |
| `nombre_prospecto` | string | Nombre del prospecto. |
| `telefono` | string | 10 dígitos. |
| `email` | string | Opcional. |
| `empresa` | string | Razón social del prospecto, o "Personal" si es persona física. |
| `origen` | enum | `manual`, `landing_con_codigo`, `landing_sin_codigo`. |
| `fecha_creacion` | datetime | Cuándo se capturó. |
| `estatus_general` | enum | `nuevo`, `cotizado`, `en_revision`, `convertido`, `descartado`. |
| `notas` | string | Notas del agente o admin. |

**Reglas:**
- Si el lead se cotiza → `estatus_general = cotizado`.
- Si la cotización va a revisión → `en_revision`.
- Si se emite la póliza → `convertido`.

---

## 4. Cotizaciones

Cotizaciones generadas (intentos de venta).

| Columna | Tipo | Descripción |
|---|---|---|
| `cotizacion_id` | string | `COT-NNNN`. |
| `lead_id` | string | FK a Leads. |
| `agent_id` | string | FK a Agentes. Denormalizado. |
| `origen_viaje` | string | Ciudad de origen. |
| `destino_viaje` | string | Ciudad de destino. |
| `kilometros` | number | Km del trayecto (lo captura el agente, no se autocalcula). |
| `duracion_horas` | number | Duración estimada del viaje. |
| `tipo_vehiculo` | string | `tractocamion`, `caja_seca`, `plataforma`, `camioneta`, `otro`. |
| `tipo_carga` | string | `maquinaria`, `electronica`, `alimentos`, etc. |
| `descripcion_carga` | string | Texto libre. |
| `valor_carga` | number | MXN. |
| `fecha_inicio_viaje` | date | Cuándo arranca el viaje. |
| `fecha_fin_viaje` | date | Cuándo termina. |
| `prima_calculada` | number | MXN. Calculado por la fórmula del tarifario. |
| `tarifa_aplicada` | string | Snapshot de la regla usada (versión + factores). |
| `fecha_cotizacion` | datetime | Cuándo se generó. |
| `estatus` | enum | `generada`, `enviada_a_revision`, `aprobada`, `rechazada`. |

**Validez:** 7 días desde `fecha_cotizacion` (dummy mientras Tryger define).

---

## 5. Polizas

Pólizas que pasaron la cotización y entraron al pipeline operativo.

| Columna | Tipo | Descripción |
|---|---|---|
| `poliza_id` | string | `POL-NNNN`. |
| `cotizacion_id` | string | FK a Cotizaciones. |
| `lead_id` | string | FK a Leads. |
| `agent_id` | string | FK a Agentes. |
| `numero_poliza` | string | Número oficial de la aseguradora (lo asigna el comercial). |
| `estatus` | enum | Ver "Estatus de pólizas" abajo. |
| `monto_prima` | number | MXN. Heredado de la cotización. |
| `fecha_envio_revision` | datetime | Cuándo el agente la mandó a revisión. |
| `fecha_emision` | datetime | Cuándo se emitió. |
| `fecha_pago` | datetime | Cuándo el cliente pagó. |
| `fecha_vigencia_inicio` | date | |
| `fecha_vigencia_fin` | date | |
| `fecha_cancelacion` | datetime | Si aplica. |
| `motivo_cancelacion` | string | Catálogo: `cliente_arrepentido`, `no_pago`, `error_datos`, `otro`. |
| `notas_cancelacion` | string | Detalle libre. |
| `notas_comercial` | string | Comentarios del equipo de Tryger. |
| `actualizado_por` | string | `admin_id` que hizo el último cambio. |
| `fecha_ultima_actualizacion` | datetime | |

### Estatus de pólizas y transiciones válidas

```
en_revision → en_cotizacion → por_emitir → emitida → por_pagar → pagada
                      ↓             ↓          ↓         ↓          ↓
                  rechazada      cancelada  cancelada cancelada cancelada
```

- `cancelada`: requiere `motivo_cancelacion` y `notas_cancelacion`.
- `rechazada`: solo aplica antes de emitir.
- Las transiciones se validan en `apps-script/polizas.gs`.

---

## 6. Comisiones

Comisiones devengadas por póliza emitida.

| Columna | Tipo | Descripción |
|---|---|---|
| `comision_id` | string | `COM-NNNN`. |
| `poliza_id` | string | FK a Pólizas. |
| `agent_id` | string | FK a Agentes. |
| `monto` | number | MXN. |
| `porcentaje` | number | % aplicado sobre la prima. Default 10. |
| `estatus` | enum | `pendiente`, `por_pagar`, `pagada`, `cancelada`, `pagada_con_clawback`. |
| `fecha_asignacion` | datetime | Cuándo se asignó. |
| `fecha_pago` | datetime | Cuándo se pagó al agente. |
| `referencia_pago` | string | SPEI o referencia bancaria. |
| `asignada_por` | string | `sistema` (auto-creada al emitir) o `admin_id`. |
| `notas` | string | |

**Lógica de cancelación:**
- Si la póliza se cancela y la comisión estaba `pendiente` o `por_pagar` → la comisión pasa a `cancelada`.
- Si la comisión ya estaba `pagada` → pasa a `pagada_con_clawback` (se debe recuperar — política exacta TBD por Tryger).

---

## 7. Visitas_Cotizador_Publico

Analytics de la landing pública. Cada visita queda registrada.

| Columna | Tipo | Descripción |
|---|---|---|
| `visita_id` | string | `VIS-NNNNN`. |
| `timestamp` | datetime | |
| `codigo_capturado` | string | Lo que el visitante escribió. |
| `agent_id_resuelto` | string | Si el código existía, este es el agent_id. Si no, `AGT-HOUSE`. |
| `ip_anonimizada` | string | Hash de IP (privacy). |
| `referrer` | string | URL referente. |
| `convirtio_a_cotizacion` | bool | Si terminó creando una cotización. |
| `cotizacion_id` | string | FK si convirtió. |

---

## 8. Administradores

Cuentas del equipo Tryger que gestionan el sistema.

| Columna | Tipo | Descripción |
|---|---|---|
| `admin_id` | string | `ADM-NNN`. |
| `nombre_completo` | string | |
| `email` | string | |
| `password_hash` | string | |
| `rol` | enum | `super_admin`, `comercial`, `operacion`. |
| `estatus` | enum | `activo`, `inactivo`. |
| `fecha_alta` | datetime | |
| `ultimo_login` | datetime | |

---

## 9. Configuracion_Tarifario

Reglas para calcular la prima de una cotización.

| Columna | Tipo | Descripción |
|---|---|---|
| `regla_id` | string | `TAR-NNN`. |
| `tipo_vehiculo` | string | Tipo al que aplica, o `*` para todos. |
| `rango_valor_carga_min` | number | MXN. |
| `rango_valor_carga_max` | number | MXN. |
| `tasa_base_porcentaje` | number | % sobre valor de la carga. |
| `factor_kilometraje` | number | MXN por km. |
| `factor_duracion` | number | MXN por hora. |
| `prima_minima` | number | Piso de la prima en MXN. |
| `version` | string | `v1`, `v2`, etc. |
| `vigente` | bool | Solo una regla vigente por combinación. |
| `notas` | string | |

**Fórmula actual (dummy):**
```
prima = max(prima_minima, valor_carga × tasa_base + km × factor_km)
```

---

## 10. Capacitacion

Contenidos educativos visibles en la pantalla "Capacitación" del agente.

| Columna | Tipo | Descripción |
|---|---|---|
| `contenido_id` | string | `CAP-NNN`. |
| `seccion` | string | Slug: `que_es_tryger`, `como_explicarlo`, etc. |
| `titulo` | string | |
| `cuerpo` | string | Texto largo (markdown permitido). |
| `orden` | int | Orden de display. |
| `activo` | bool | Si se muestra. |
| `actualizado_por` | string | `admin_id`. |
| `fecha_actualizacion` | datetime | |

---

## 11. Materiales

Recursos descargables que el agente puede compartir con clientes.

| Columna | Tipo | Descripción |
|---|---|---|
| `material_id` | string | `MAT-NNN`. |
| `titulo` | string | |
| `descripcion` | string | |
| `tipo` | enum | `pdf`, `imagen`, `video`, `texto`. |
| `drive_url` | string | URL al archivo en Drive (si aplica). |
| `contenido_texto` | string | Texto literal (para mensajes sugeridos). |
| `categoria` | string | `producto`, `ventas`, `comunicacion`, `redes`. |
| `activo` | bool | |
| `fecha_publicacion` | datetime | |

---

## 12. Notificaciones_Log

Bitácora de correos enviados (para debug y auditoría).

| Columna | Tipo | Descripción |
|---|---|---|
| `notif_id` | string | `NOT-NNNNN`. |
| `destinatario_email` | string | |
| `destinatario_id` | string | `agent_id` o `admin_id`. |
| `tipo` | string | `nuevo_lead`, `poliza_emitida`, `comision_pagada`, etc. |
| `referencia_id` | string | ID de la entidad relacionada. |
| `asunto` | string | |
| `enviado` | bool | |
| `fecha_envio` | datetime | |
| `error` | string | Si falló. |

(Las notificaciones por correo se implementan en la Fase 7.)
