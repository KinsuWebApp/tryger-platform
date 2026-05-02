# Código de agente — Sistema XX-NNNN

Cómo funciona el código que cada agente comparte con sus clientes.

---

## Formato

```
XX-NNNN
│  │
│  └─ 4 dígitos consecutivos (empieza en 1024)
└──── 2 letras (iniciales del agente)
```

**Ejemplos válidos:**
- `JP-1024` (Juan Pérez, primer agente)
- `MR-1025` (María Ramírez, segundo agente)
- `AG-1026` (próximo agente sin nombre conocido en testing)
- `TR-0001` (agente house de Tryger — caso especial)

**Ejemplos inválidos:**
- `JP1024` (sin guion)
- `J-1024` (solo 1 letra)
- `JPG-1024` (3 letras)
- `JP-101` (3 dígitos)
- `jp-1024` (minúsculas — el sistema las normaliza, pero idealmente se capturan en mayúscula)

---

## Cómo se generan

**Las iniciales (XX):**
- Se toman del `nombre_completo` del agente al darlo de alta.
- Lógica:
  - Si tiene 2+ palabras: primera letra de las 2 primeras. Ej: `Juan Pérez García` → `JP`.
  - Si tiene 1 palabra: las 2 primeras letras. Ej: `Cargolink` → `CA`.
  - Si está vacío: `AG` (default).
- Las iniciales NO tienen que ser únicas. Pueden coincidir entre agentes (Juan Pérez y Juan Pacheco ambos `JP`).

**El consecutivo (NNNN):**
- Es global, no por iniciales.
- Empieza en `1024` (decisión arbitraria — un número que se ve "real" pero permite crecer).
- Se incrementa cada vez que se da de alta un agente nuevo.
- Si por alguna razón hubiera colisión (raro), el sistema avanza al siguiente disponible.

**Algoritmo (ver `apps-script/agentes.gs > generateAgentCode`):**
```javascript
1. extraer iniciales del nombre
2. encontrar el consecutivo más alto entre todos los agentes
3. consecutivo siguiente = max + 1 (o 1024 si no hay agentes)
4. armar código = `${initials}-${consecutivo}`
5. si el código ya existe (raro, duplicate iniciales + mismo consecutivo)
   → incrementar consecutivo y reintentar
```

---

## Caso especial: agente house

- ID: `AGT-HOUSE`
- Código: `TR-0001`
- Consecutivo: `1`

El agente house es donde caen los **leads sin código** (visitante captura formulario en `/cotizacion` sin poner código, o pone uno inválido).

**Reglas:**
- No es una persona real, es una cuenta operativa de Tryger.
- Lo administra el equipo comercial de Tryger directamente desde el dashboard admin.
- Las pólizas que generen los leads house no pagan comisión a nadie (o se asigna manualmente al asesor que las atienda).
- Su consecutivo (1) está reservado — los agentes reales empiezan en 1024.

---

## Validación en el frontend

El frontend valida con regex antes de enviar al backend:

```javascript
const isValid = /^[A-Z]{2}-\d{4}$/.test(code.trim().toUpperCase());
```

**Helper en `shared/utils.js`:**
```javascript
TrygerUtils.isValidAgentCode('JP-1024')  // → true
TrygerUtils.isValidAgentCode('jp-1024')  // → true (se normaliza)
TrygerUtils.isValidAgentCode('JP1024')   // → false
```

**Auto-formato en la landing pública** (`/cotizacion/index.html`):
- Mientras el usuario escribe, se convierten letras a mayúsculas.
- Después de 2 letras, se inserta el guion automáticamente.
- Solo permite `[A-Z0-9-]`.

---

## Validación en el backend

`apps-script/agentes.gs > resolveAgentCode(code)`:

```javascript
1. normalizar (trim + uppercase)
2. validar formato regex
3. buscar en pestaña Agentes por codigo_agente
4. si existe Y estatus = 'activo' → devolver agent_id + nombre
5. si no existe → error 'code_not_found'
6. si existe pero estatus = 'inactivo' → error 'agent_inactive'
```

---

## Flujos donde se usa el código

### A. Captura desde landing pública

```
Visitante en /cotizacion → captura código → ¿válido?
                                              │
                                  ┌───────────┴────────────┐
                                  v                        v
                          Sí: continúa al wizard    No: opción de
                          asignado a ese agente      seguir sin código
                                                     (cae en HOUSE)
```

### B. Compartir el código (acción del agente)

Pantalla "Mi código" (Fase 3) ofrece:
- **Copiar al portapapeles:** copia `JP-1024`.
- **Compartir por WhatsApp:** abre WhatsApp con mensaje pre-armado:
  ```
  Hola, soy [nombre del agente]. Cotiza tu seguro de transporte de carga
  con mi código JP-1024 en https://tryger.com/cotizacion
  ```
- **Descargar tarjeta PDF:** genera un PDF con el código y QR (Fase 3).

### C. Reportes de conversión del agente

En el dashboard del agente, las métricas incluyen TODOS sus leads (manuales + landing con código), no solo los que vinieron por código.

---

## Decisiones explícitas

**¿Por qué no cada agente tiene un link único?**

Se evaluó usar URLs como `tryger.com/r/jp-1024` que asignaran el agente automáticamente. Se descartó porque:
1. El cliente puede ya estar en la landing pública (sin link específico) y querer poner un código que le compartieron.
2. Mantener una sola landing es más simple para SEO y branding.
3. El código es más fácil de comunicar verbalmente o por WhatsApp que un link.

**¿Por qué empezar el consecutivo en 1024?**

Decisión estética + futurismo:
- Se ve "real" desde el primer agente (no parece "agente #1 de prueba").
- Es potencia de 2, geek wink.
- Da margen para reservar números bajos (1-1023) para casos especiales como agente house.

**¿Por qué iniciales y no solo numérico?**

Para que el agente reconozca su código y le sea más fácil dictarlo o memorizarlo. `JP-1024` se recuerda mejor que `1024`.

**¿Qué pasa si dos agentes tienen las mismas iniciales?**

Es perfectamente válido. La unicidad la garantiza el consecutivo (que es global). Ejemplo:
- Juan Pérez → `JP-1024`
- Juan Paredes → `JP-1058`

Ambos son códigos válidos y distintos.
