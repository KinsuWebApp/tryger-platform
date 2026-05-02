# Tryger Platform

Plataforma de prospectación y gestión de leads para Tryger — seguro de transporte de carga por evento.

**Stack:** HTML + CSS + JavaScript vanilla · Google Apps Script · Google Sheets · GitHub Pages

---

## ¿Qué hace esta plataforma?

Tres frentes que conviven sobre un mismo Google Sheet pivote:

1. **Webapp del agente** — captura de prospectos, cotizador, seguimiento de pólizas, comisiones, capacitación.
2. **Landing pública** — cualquier persona entra a `/cotizacion` y captura el código de su agente para cotizar su trayecto.
3. **Dashboard admin de Tryger** — validación operativa, cambio de estatus, asignación de comisiones, gestión de agentes.

---

## URLs

- **Repo:** https://github.com/KinsuWebApp/tryger-platform
- **Sitio (cuando esté publicado):** https://kinsuwebapp.github.io/tryger-platform/
- **Sheet pivote:** _pendiente de crear (ver `apps-script/README.md`)_

---

## Estructura del proyecto

```
tryger-platform/
├── index.html                  Redirige al login
├── login.html                  Login del agente
├── agente/                     Webapp del agente
│   └── dashboard.html
├── cotizacion/                 Landing pública (captura código + cotiza)
│   └── index.html
├── admin/                      Dashboard administrativo
│   └── login.html
├── shared/                     Componentes y utilidades reutilizables
│   ├── design-system.css       Tokens (colores, fuentes, spacing)
│   ├── components.css          Componentes (sidebar, KPIs, tablas, etc.)
│   ├── sidebar-agente.html     Parcial reutilizable
│   ├── topbar.html             Parcial reutilizable
│   ├── layout-loader.js        Inyecta sidebar/topbar en cada página
│   ├── api.js                  Cliente para hablar con Apps Script
│   ├── auth.js                 Manejo de sesión
│   └── utils.js                Formatters de moneda, fechas, etc.
├── data/
│   └── dummy.js                Datos dummy mientras Apps Script no esté conectado
├── apps-script/                Código del backend (se pega en script.google.com)
│   ├── README.md               Cómo configurar el backend
│   ├── main.gs                 Router principal (doGet, doPost)
│   ├── config.gs               Constantes (sin credenciales)
│   ├── auth.gs                 Login y validación de sesión
│   ├── agentes.gs              CRUD de agentes + generación de código XX-NNNN
│   ├── leads.gs
│   ├── cotizaciones.gs
│   ├── polizas.gs
│   ├── comisiones.gs
│   └── seed.gs                 Crea las 12 pestañas + datos dummy iniciales
└── docs/                       Documentación del proyecto
    ├── modelo-datos.md
    ├── flujos.md
    ├── deployment.md
    └── codigo-agente.md
```

---

## Cómo arrancar (primera vez)

### 1. Subir el código a GitHub

```bash
cd ruta/donde/descomprimiste/tryger-platform
git init
git add .
git commit -m "Fase 1: dashboard del agente + sistema de diseño + estructura backend"
git branch -M main
git remote add origin https://github.com/KinsuWebApp/tryger-platform.git
git push -u origin main
```

### 2. Activar GitHub Pages

1. En el repo de GitHub: **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: `main` / `/ (root)`.
4. Save.
5. En 1-2 minutos GitHub te da la URL pública: `https://kinsuwebapp.github.io/tryger-platform/`.

### 3. Crear el Google Sheet pivote

Ver [`apps-script/README.md`](./apps-script/README.md) para el paso a paso completo.

Resumen:
1. Crear un Sheet nuevo en blanco en Google Drive.
2. Crear un proyecto de Apps Script vinculado al Sheet.
3. Pegar todos los archivos `.gs` de `apps-script/` en el editor.
4. Correr la función `seed()` desde `seed.gs` — crea las 12 pestañas con columnas y datos dummy.
5. Publicar el Apps Script como Web App.
6. Copiar la URL del Web App y pegarla en `shared/api.js` (constante `APPS_SCRIPT_URL`).

---

## Probar localmente (sin GitHub Pages)

Como son archivos estáticos, puedes abrir cualquier `.html` directamente en el navegador, **excepto** los que cargan parciales (sidebar/topbar) — esos requieren un servidor local porque `fetch()` no funciona desde `file://`.

**Opción rápida con Python (preinstalado en Mac/Linux):**

```bash
cd tryger-platform
python3 -m http.server 8000
```

Abre `http://localhost:8000/login.html`.

**Opción con Node:**

```bash
npx serve .
```

---

## Login dummy (mientras Apps Script no está conectado)

- **Email:** `juan.perez@tryger.com`
- **Password:** `1234`

Cuando Apps Script esté conectado, este login dummy queda como fallback automático (igual que en tus HTMLs originales con `KinsuAPI`).

---

## Fases de desarrollo

- ✅ **Fase 1 (actual):** estructura del proyecto, sistema de diseño, dashboard del agente con datos dummy, backend en modo mock.
- ⏳ **Fase 2:** cotizador wizard de 3 pasos (datos del prospecto → trayecto/vehículo/carga → resultado).
- ⏳ **Fase 3:** resto del agente (mis prospectos, detalle, mi código, comisiones, perfil, capacitación, materiales).
- ⏳ **Fase 4:** landing pública `/cotizacion` con captura de código de agente.
- ⏳ **Fase 5:** dashboard admin completo.
- ⏳ **Fase 6:** conexión real a Sheets vía Apps Script (reemplaza el mock).
- ⏳ **Fase 7:** notificaciones por correo (alta de agente, nuevo lead, cambio de estatus).

---

## Sistema de diseño

Documentado en [`shared/design-system.css`](./shared/design-system.css). Tokens principales:

- **Colores:** azul marino `#0d1c2e`, azul primario `#1565c0`, verde signature `#82d14b`, rosa alerta `#D4516D`.
- **Fuentes:** Inter (UI), JetBrains Mono (números/IDs).
- **Iconos:** Material Symbols Outlined.

---

## Documentación adicional

- [`docs/modelo-datos.md`](./docs/modelo-datos.md) — las 12 pestañas del Sheet con columnas exactas.
- [`docs/flujos.md`](./docs/flujos.md) — flujos por rol (agente, admin, prospecto público).
- [`docs/deployment.md`](./docs/deployment.md) — cómo publicar Apps Script y GitHub Pages.
- [`docs/codigo-agente.md`](./docs/codigo-agente.md) — sistema de códigos `XX-NNNN`.

---

## Seguridad y credenciales

Como el repo es público (requisito de GitHub Pages gratis):

- **Nada de credenciales en el código.** Todo lo sensible (IDs de Sheet, tokens) vive en `PropertiesService` del Apps Script.
- **El password del login dummy** está hardcoded solo para desarrollo. En producción, los hashes de password viven en el Sheet, nunca en el código.
- **Las llamadas al Apps Script** usan la URL del Web App publicado, que valida sesión en cada request.

---

_Powered by Kinsu_
