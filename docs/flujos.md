# Flujos del sistema — Tryger Platform

Este documento describe los flujos principales por rol: **prospecto público**, **agente** y **admin de Tryger**.

---

## 1. Prospecto público (landing `/cotizacion`)

Visitante en internet que llega a la landing pública con o sin código de agente.

```
┌──────────────────────┐
│  Llega a /cotizacion │
└──────────┬───────────┘
           │
           v
┌─────────────────────────────────┐
│ Captura código XX-NNNN          │
│ o clic en "No tengo código"     │
└──────────┬──────────────────────┘
           │
           v
   ┌───────────────┐         ┌────────────────────┐
   │ ¿Hay código?  │   no    │ Asignado a agente  │
   │               │────────>│ house (AGT-HOUSE)  │
   └───────┬───────┘         └─────────┬──────────┘
           │ sí                        │
           v                           │
   ┌─────────────────┐                 │
   │ Validar código  │                 │
   │ en backend      │                 │
   └────────┬────────┘                 │
            │                          │
       ┌────┴─────┐                    │
       v          v                    │
   ┌───────┐  ┌──────────┐             │
   │ Válido│  │ Inválido │────────────>│
   └───┬───┘  └──────────┘             │
       │                               │
       v                               v
┌────────────────────────────────────────┐
│ Wizard de cotización (3 pasos):        │
│  1. Datos del prospecto                │
│  2. Trayecto + vehículo + carga        │
│  3. Resultado: prima + CTA WhatsApp    │
└──────────────────┬─────────────────────┘
                   │
                   v
┌─────────────────────────────────────────┐
│ Lead + Cotización quedan en el Sheet    │
│ Notif al agente (correo/WhatsApp Fase 7)│
└─────────────────────────────────────────┘
```

**Reglas:**
- El prospecto NO crea cuenta. Solo captura datos.
- Si pone un código inválido, el lead cae en agente house pero se guarda lo que escribió (para poder corregir después).
- La cotización queda válida 7 días.

---

## 2. Agente (webapp `/agente/...`)

### 2.1 Login y dashboard

```
Login (email + password) → Dashboard
                              │
                              v
                  KPIs · Funnel · Actividad · Leads recientes
```

### 2.2 Captura manual de prospecto

```
Cotizador → Wizard 3 pasos (mismo que el público) → Cotización generada
                                                          │
                                                          v
                                              Lead + Cotización en Sheet
                                                          │
                                                          v
                                              Botón "Enviar a revisión"
                                                          │
                                                          v
                                              Crea Póliza con estatus
                                              `en_revision`
```

### 2.3 Flujo de seguimiento

```
Mis prospectos → Selecciona prospecto → Ver detalle
                                              │
                                              v
                                    Historial de cotizaciones
                                    Estatus de pólizas
                                    Comisiones generadas
```

### 2.4 Compartir código

```
Mi código → 3 acciones:
  - Copiar al portapapeles
  - Compartir por WhatsApp (mensaje pre-armado)
  - Descargar tarjeta PDF (Fase 3)
```

### 2.5 Capacitación y materiales

```
Capacitación → Lista de contenidos → Vista del contenido
Materiales   → Grid de recursos    → Descarga / copia texto
```

---

## 3. Admin de Tryger (`/admin/...`)

### 3.1 Login admin

```
Login (email + password) → Dashboard admin
                              │
                              v
                  Vista global · Bandeja de pendientes
```

### 3.2 Validación operativa de pólizas

```
Bandeja "En revisión" → Selecciona póliza → Ver detalle
                                                │
                                                v
                                Acciones según estatus actual:
                                  - Mover a "en cotización"
                                  - Mover a "por emitir" (asigna número)
                                  - Marcar "emitida" → auto-crea comisión
                                  - Marcar "por pagar"
                                  - Marcar "pagada"
                                  - Cancelar (requiere motivo)
                                  - Rechazar
```

**Reglas de transición:** ver `docs/modelo-datos.md` sección "Estatus de pólizas".

### 3.3 Gestión de comisiones

```
Comisiones → Lista filtrada → Selecciona comisión
                                    │
                                    v
                          Acciones:
                            - Editar monto/porcentaje
                            - Marcar como pagada (requiere referencia SPEI)
                            - Cancelar
```

**Auto-creación:** cuando se cambia una póliza a `emitida`, el sistema crea automáticamente la comisión asociada con estatus `por_pagar` y monto = 10% de la prima (porcentaje configurable).

**Lógica de cancelación:**
- Póliza cancelada + comisión `pendiente`/`por_pagar` → comisión pasa a `cancelada`.
- Póliza cancelada + comisión `pagada` → comisión pasa a `pagada_con_clawback` (recuperación pendiente).

### 3.4 Alta de agentes

```
Agentes → Nuevo agente → Formulario:
                            - Datos personales
                            - Datos fiscales
                            - Email/contraseña inicial
                                    │
                                    v
                          Sistema:
                            - Genera AGT-NNN
                            - Genera código XX-NNNN
                            - Guarda hash del password
                            - Marca como `pendiente_setup`
                                    │
                                    v
                          Notif por correo al agente
                          con sus credenciales
```

### 3.5 Edición de capacitación y materiales

```
Capacitación admin → Lista de contenidos → Editar/crear/desactivar
Materiales admin   → Lista de recursos    → Editar/crear/desactivar
```

Los cambios se ven inmediatamente en la webapp del agente.

---

## 4. Eventos automáticos

| Evento gatillo | Consecuencia automática |
|---|---|
| Cotización generada | Lead pasa a `cotizado` |
| Cotización enviada a revisión | Lead pasa a `en_revision`, se crea Póliza |
| Póliza emitida | Se crea Comisión con estatus `por_pagar` |
| Póliza cancelada | Comisión pasa a `cancelada` o `pagada_con_clawback` |
| Visita a `/cotizacion` con código | Se registra en Visitas_Cotizador_Publico |

---

## 5. Notificaciones por correo (Fase 7)

- **Al agente:** alta de cuenta, nuevo lead capturado, póliza emitida, comisión pagada.
- **Al admin:** nueva cotización en revisión, nueva alta de agente.
- **Al prospecto:** copia de su cotización (PDF en Fase 7).

Todas las notificaciones se registran en la pestaña `Notificaciones_Log`.
