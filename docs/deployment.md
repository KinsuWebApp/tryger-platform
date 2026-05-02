# Deployment — Tryger Platform

Cómo publicar la plataforma desde cero, paso a paso.

> **Resumen:** el frontend vive en GitHub Pages (estático), el backend en Apps Script. Son dos despliegues independientes que se conectan por la URL del Web App de Apps Script.

---

## Parte 1 — Frontend (GitHub Pages)

### Pre-requisitos

- Cuenta de GitHub: **KinsuWebApp**.
- Repo creado: `https://github.com/KinsuWebApp/tryger-platform` (público, requisito de GitHub Pages gratis).
- Git instalado localmente.

### Paso 1: subir el código

Desde la carpeta donde descomprimiste el ZIP:

```bash
cd tryger-platform
git init
git add .
git commit -m "Fase 1: dashboard del agente + sistema de diseño + esqueleto Apps Script"
git branch -M main
git remote add origin https://github.com/KinsuWebApp/tryger-platform.git
git push -u origin main
```

Si pide credenciales, GitHub ya no acepta password — necesitas un **Personal Access Token** (Settings → Developer settings → Personal access tokens → Generate new token). Lo usas como password.

### Paso 2: activar GitHub Pages

1. Ve a `https://github.com/KinsuWebApp/tryger-platform`.
2. **Settings → Pages** (menú lateral izquierdo, casi al final).
3. **Source:** "Deploy from a branch".
4. **Branch:** `main` / `/ (root)`.
5. **Save.**

GitHub te muestra un mensaje arriba: "Your site is live at `https://kinsuwebapp.github.io/tryger-platform/`" (puede tardar 1-2 minutos la primera vez).

### Paso 3: probar el sitio

Abre `https://kinsuwebapp.github.io/tryger-platform/`.

- Te debe redirigir al login.
- Login con `juan.perez@tryger.com` / `1234`.
- Debes ver el dashboard con datos dummy.

### Actualizaciones futuras

Cada `git push origin main` se publica automáticamente en GitHub Pages. Tarda 30-90 segundos.

---

## Parte 2 — Backend (Google Apps Script)

### Paso 1: crear el Sheet pivote

1. Abre [drive.google.com](https://drive.google.com) con la cuenta dueña del proyecto.
2. **Nuevo → Google Sheets → En blanco.**
3. Renombra a: **"Tryger Platform · Base de datos"**.
4. Copia el **ID del Sheet** (la cadena entre `/d/` y `/edit` en la URL).

### Paso 2: crear el proyecto de Apps Script

1. Estando dentro del Sheet: **Extensiones → Apps Script**.
2. Renombra el proyecto (arriba a la izquierda) a **"Tryger Backend"**.

### Paso 3: pegar el código

En el editor, borra el `Code.gs` por default y crea un archivo por cada `.gs` del folder `apps-script/`:

`+` → **Script** → nombre exacto:

1. `config`
2. `main`
3. `auth`
4. `agentes`
5. `leads`
6. `cotizaciones`
7. `polizas`
8. `comisiones`
9. `seed`

Pega el contenido correspondiente en cada uno.

### Paso 4: configurar el SPREADSHEET_ID

1. **⚙ Configuración del proyecto** (engranaje del menú izquierdo).
2. Hasta abajo: **Propiedades del script → Editar propiedades del script.**
3. Agrega:
   - **Propiedad:** `SPREADSHEET_ID`
   - **Valor:** el ID que copiaste en el paso 1.
4. **Guardar propiedades del script.**

### Paso 5: ejecutar el seed

1. Abre `seed.gs`.
2. Selector de funciones: **`seed`**.
3. **Ejecutar (▶).**
4. Aprueba permisos:
   - "Revisar permisos" → tu cuenta → "Configuración avanzada" → "Ir a Tryger Backend (no seguro)" → **Permitir**.
5. Vuelve a hacer clic en **Ejecutar**.
6. Espera 10-30 segundos.
7. Revisa el log (abajo): debe decir `✓ Seed completado.`
8. Abre tu Sheet — verás las 12 pestañas con datos.

### Paso 6: publicar como Web App

1. **Implementar → Nueva implementación.**
2. Engrane junto a "Tipo de implementación" → **Aplicación web**.
3. Configuración:
   - **Descripción:** `Tryger Backend v1`
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier persona
4. **Implementar.**
5. Copia la URL del Web App. Se ve así:
   ```
   https://script.google.com/macros/s/AKfycbZ.../exec
   ```

### Paso 7: conectar el frontend

1. Abre `shared/api.js` en tu repo local.
2. Línea: `const APPS_SCRIPT_URL = '';`
3. Pega la URL entre las comillas:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbZ.../exec';
   ```
4. Commit + push:
   ```bash
   git add shared/api.js
   git commit -m "Conectar frontend a Apps Script"
   git push
   ```
5. Espera 1-2 minutos.

### Paso 8: probar end-to-end

1. Abre el sitio en GitHub Pages.
2. Login con `juan.perez@tryger.com` / `1234`.
3. Si el dashboard carga datos del Sheet (no del mock), todo está conectado.

---

## Cómo actualizar el backend

Cada vez que edites un `.gs`:

1. Guarda en el editor (Ctrl+S o ⌘S).
2. **Implementar → Administrar implementaciones.**
3. Clic en el lápiz (✏) de la implementación activa.
4. **Versión:** "Nueva versión".
5. **Implementar.**

> **⚠️ El error más común:** olvidar este paso. Si solo guardas y no haces nueva implementación, el Web App sigue ejecutando la versión anterior.

La URL del Web App **NO cambia** entre versiones, así que el frontend no necesita actualizarse.

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `SPREADSHEET_ID no está configurado` | No agregaste la propiedad | Revisar paso 4 de Backend |
| `Authorization required` al ejecutar | Primer uso, no autorizaste | Seguir el flow de aprobación de permisos |
| El frontend dice "No backend available" | URL vacía o mal pegada en `api.js` | Verificar línea de `APPS_SCRIPT_URL` |
| CORS error en consola | Web App publicado con acceso restringido | Republicar con "Cualquier persona" |
| Cambios al `.gs` no se ven | Olvidaste hacer nueva implementación | Implementar → Administrar → Editar → Nueva versión |
| 404 en GitHub Pages | Pages aún no propagado | Esperar 2-3 minutos, hacer hard refresh |
| `Cannot read property 'getRange' of null` | Pestaña no existe | Correr `seed()` |

---

## Costos

- **GitHub Pages:** gratis (con repo público).
- **Apps Script:** gratis hasta 90 minutos de ejecución/día y 20MB de cuota de Sheet (suficiente para miles de registros).
- **Google Sheet:** gratis con cuenta de Google.
- **Total mensual mientras dure el MVP:** $0.

Cuando el volumen crezca y haya que pagar:
- Plan Workspace si Tryger quiere correo @tryger.com.
- Posible migración a un backend más robusto (Cloud Run / Postgres) si se rebasa el límite de Sheets.
