# Apps Script de Tryger — Backend

Este folder contiene el código del backend de Tryger. Vive en Google Apps Script (no se ejecuta en GitHub Pages, GitHub Pages solo aloja el frontend).

## Cómo configurar todo desde cero (paso a paso)

### 1. Crear el Google Sheet pivote

1. Abre [drive.google.com](https://drive.google.com) con la cuenta de Google que va a ser **dueña** del Sheet (sugerencia: la cuenta corporativa de Tryger o una específica del proyecto).
2. **Nuevo → Google Sheets → En blanco.**
3. Renombra el Sheet a: **"Tryger Platform · Base de datos"**.
4. Copia el **ID del Sheet** desde la URL. La URL se ve así:
   ```
   https://docs.google.com/spreadsheets/d/AQUI_ESTA_EL_ID/edit
   ```
   El ID es esa cadena larga entre `/d/` y `/edit`. Guárdalo, lo necesitas en el paso 4.

### 2. Crear el proyecto de Apps Script

Hay dos formas. Recomendada:

**Opción A — Apps Script vinculado al Sheet (recomendada):**
1. Estando en el Sheet, ve a **Extensiones → Apps Script**.
2. Se abre una pestaña nueva con el editor de Apps Script.
3. Renombra el proyecto (arriba a la izquierda) a: **"Tryger Backend"**.

**Opción B — Apps Script standalone:**
1. Ve a [script.google.com](https://script.google.com).
2. **Nuevo proyecto.**
3. Renombra a "Tryger Backend".

### 3. Pegar los archivos `.gs`

En el editor de Apps Script vas a ver un archivo por default llamado `Code.gs`. Bórralo (clic derecho → eliminar) y crea uno nuevo por cada archivo de este folder.

Para crear cada archivo:
- Clic en el ícono **+** al lado de "Files" → **Script**.
- Pon el nombre exacto (sin la extensión `.gs`, Apps Script la pone solo).
- Pega el contenido del archivo correspondiente de este folder.

Los archivos a crear, en orden:

1. `config.gs`
2. `main.gs`
3. `auth.gs`
4. `agentes.gs`
5. `leads.gs`
6. `cotizaciones.gs`
7. `polizas.gs`
8. `comisiones.gs`
9. `seed.gs`

### 4. Configurar el ID del Sheet

1. En el editor de Apps Script, ve a **⚙ Configuración del proyecto** (engranaje en el menú izquierdo).
2. Hasta abajo verás **"Propiedades del script"** → **Editar propiedades del script**.
3. Agrega una propiedad:
   - **Propiedad:** `SPREADSHEET_ID`
   - **Valor:** el ID del Sheet que copiaste en el paso 1.
4. **Guardar propiedades del script.**

> **Importante:** este ID NUNCA debe estar en el código que se sube a GitHub. Vive solo en las propiedades del Apps Script (que son privadas).

### 5. Ejecutar el seed (crear las 12 pestañas con datos dummy)

1. En el editor, abre `seed.gs`.
2. En la barra superior, donde dice "Seleccionar función", elige **`seed`**.
3. Haz clic en **Ejecutar (▶)**.
4. La primera vez te va a pedir permisos:
   - "Revisar permisos" → elige tu cuenta de Google → "Configuración avanzada" → "Ir a Tryger Backend (no seguro)" → **Permitir**.
   - Esto es normal porque el script es tuyo y no está verificado por Google. No es peligroso.
5. Vuelve a hacer clic en **Ejecutar**.
6. Espera 10-30 segundos. Si todo va bien, verás en el log: `✓ Seed completado.`
7. Abre tu Sheet y verás las 12 pestañas creadas con sus columnas y algunos datos dummy de ejemplo.

### 6. Publicar el Apps Script como Web App

1. **Implementar → Nueva implementación.**
2. Clic en el engrane junto a "Tipo de implementación" → **Aplicación web**.
3. Configura:
   - **Descripción:** `Tryger Backend v1`
   - **Ejecutar como:** **Yo** (tu cuenta).
   - **Quién tiene acceso:** **Cualquier persona**.
     > Esto es necesario porque la webapp pública (`/cotizacion`) llama al backend sin sesión de Google. La seguridad la maneja el propio script (validación de sesión por token, rate limiting, etc.)
4. **Implementar.**
5. Te muestra una URL parecida a:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   **Copia esa URL.**

### 7. Conectar el frontend al backend

1. Abre `shared/api.js` en el repo.
2. Busca la línea: `const APPS_SCRIPT_URL = '';`
3. Pega la URL del paso 6 entre las comillas.
4. Guarda y haz commit + push al repo.
5. En 1-2 minutos GitHub Pages actualiza el sitio publicado.

### 8. Probar end-to-end

1. Abre la URL de GitHub Pages: `https://kinsuwebapp.github.io/tryger-platform/`.
2. Login con `juan.perez@tryger.com` / `1234`.
3. Si ves el dashboard con datos del Sheet (no dummy hardcoded), ¡todo está conectado!

---

## Cuando hagas cambios al código del Apps Script

1. Edita el archivo correspondiente directamente en el editor de Apps Script.
2. **Implementar → Administrar implementaciones → ✏ (editar)** → cambia "Versión" a "Nueva versión" → **Implementar**.
3. La URL del Web App se mantiene (no cambia), pero ahora ejecuta la nueva versión.

> ⚠️ Si NO creas una nueva versión, los cambios no se ven afuera. Es el error más común al trabajar con Apps Script.

---

## Sincronización con GitHub (opcional pero recomendado)

Para mantener el código del Apps Script versionado en GitHub:
- **Manualmente:** cuando hagas cambios en el editor, copia y pega el código actualizado en este folder y haz commit. Tedioso pero claro.
- **Con clasp (CLI oficial de Google):** instalas `@google/clasp` con npm y puedes hacer `clasp pull` / `clasp push` desde la línea de comandos. Más profesional, pero requiere setup adicional.

Para empezar, recomendamos manual. Cuando el proyecto crezca, vale la pena clasp.

---

## Estructura de los archivos `.gs`

| Archivo | Responsabilidad |
|---|---|
| `config.gs` | Constantes globales (nombres de pestañas, columnas, etc.). NO credenciales. |
| `main.gs` | Router principal: recibe POST/GET y despacha a las funciones correctas. |
| `auth.gs` | Login del agente, validación de sesión, hashing de passwords. |
| `agentes.gs` | CRUD de agentes + generación automática del código `XX-NNNN`. |
| `leads.gs` | CRUD de leads (manual y desde landing pública). |
| `cotizaciones.gs` | Generación de cotizaciones + cálculo dummy de prima. |
| `polizas.gs` | Gestión del ciclo de vida de pólizas. |
| `comisiones.gs` | CRUD de comisiones + lógica de cancelaciones (clawback). |
| `seed.gs` | Crea las 12 pestañas con columnas y datos dummy (ejecutar 1 vez). |

---

## Troubleshooting común

**"Authorization required" o "Permisos no autorizados":** la primera vez ejecutando una función, Google te pide aprobar accesos. Sigue el flujo descrito en el paso 5.

**"Cannot read property 'getRange' of null":** la pestaña con ese nombre no existe en el Sheet. Corre `seed()` o crea la pestaña a mano.

**El frontend dice "No backend available":** revisa que pegaste la URL correcta en `shared/api.js` Y que hiciste **nueva implementación** (no solo guardaste).

**CORS error en consola del navegador:** verifica que el Web App está publicado con "Quién tiene acceso: Cualquier persona". Si dice "Solo yo" o "Cualquier persona con la cuenta de Google", no funciona desde GitHub Pages.

**Cambios al código no se ven:** olvidaste hacer **Nueva implementación**. Apps Script congela una versión específica al publicar — los cambios al código fuente no se reflejan hasta que rehaces la implementación.
