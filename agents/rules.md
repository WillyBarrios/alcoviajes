# REGLAS DE ARQUITECTURA Y ESTRUCTURA DE CARPETAS
Debes mantener una estructura estricta en la carpeta `src/`:
1. `/components`: Componentes reutilizables de UI (botones, tarjetas, modales).
2. `/pages`: Vistas principales (Home, Destinos, PaqueteDetalle, DashboardUsuario).
3. `/hooks`: Custom hooks para lógica de negocio (ej. `useAuth`, `useDestinations`).
4. `/services` o `/lib`: Configuración de clientes externos (aquí irá `supabaseClient.js`).
5. `/context`: Estados globales si son estrictamente necesarios (ej. Sesión de usuario).

# REGLAS DE DESARROLLO Y CÓDIGO
1. Usa Functional Components y Hooks obligatoriamente. Cero componentes de clase.
2. Todo el código debe estar escrito en JavaScript moderno (ES6+).
3. Interfaces Responsivas: Usa utilidades de Tailwind (mobile-first) para asegurar que Alcoviajes se vea impecable en móviles y escritorio.
4. Manejo de Estados: Siempre implementa estados de carga (`isLoading`) y manejo de errores (`error`) al hacer fetch de datos a Supabase.
5. Variables de Entorno: Nunca expongas credenciales en el código. Las credenciales de Supabase deben leerse obligatoriamente desde `import.meta.env.VITE_SUPABASE_URL` y `import.meta.env.VITE_SUPABASE_ANON_KEY`.

# GUÍA DE ENTREGABLES FINALES
Cuando el proyecto esté completo y listo para ser entregado (ya sea para producción o deployment), debes generar un archivo `DELIVERABLE.md` dentro de la carpeta raíz del proyecto. Este archivo debe contener la siguiente estructura obligatoria:

## 📦 Archivo: DELIVERABLE.md

### 1. Estructura del Proyecto
Muestra un árbol de directorios (usando sintaxis de Markdown) listando todas las carpetas y archivos dentro de `src/`, indicando claramente qué tipo de contenido tiene cada uno (components, pages, hooks, etc.).

### 2. Instrucciones de Despliegue
Proporciona comandos CLAROS y PROBADOS para realizar las siguientes acciones:
-   **Instalación de Dependencias**: `npm install` o `yarn install`.
-   **Configuración de Variables de Entorno**: Lista las variables necesarias (ej. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y cómo obtenerlas del panel de control de Supabase.
-   **Comando de Desarrollo**: `npm run dev`.
-   **Comando de Compilación**: `npm run build`.

### 3. URL(s) de Despliegue
Si el proyecto ya está desplegado en una plataforma (Vercel, Netlify, GitHub Pages), incluye el enlace directo de la versión de producción.

**Importante**: Este archivo es la "hoja de ruta" final. Debe permitir que cualquier otra IA o desarrollador pueda tomar el control del proyecto sin necesidad de volver a ejecutar todo el proceso desde cero.