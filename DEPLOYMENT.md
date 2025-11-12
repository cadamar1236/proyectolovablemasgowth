# Deployment Guide - Nueva Página con Misma Base de Datos

Este proyecto ahora tiene dos configuraciones de deployment para Cloudflare Pages:

## Configuraciones Disponibles

### 1. Sitio Original (`wrangler.jsonc`)
- **Nombre**: `webapp`
- **Propósito**: Sitio original con todas las características
- **Base de datos**: `webapp-production` (ID: 5cb67508-cc61-4194-886b-05cf6f1c00fa)

### 2. Sitio Nuevo - Polymarket Style (`wrangler.production.jsonc`)
- **Nombre**: `webapp-production-new`
- **Propósito**: Nuevo diseño minimalista inspirado en Polymarket
- **Base de datos**: **LA MISMA** - `webapp-production` (ID: 5cb67508-cc61-4194-886b-05cf6f1c00fa)
- **Rama**: `nuevapagina`

## Pasos para Desplegar el Nuevo Sitio

### Opción 1: Deployment Manual con Wrangler

```bash
# 1. Asegúrate de estar en la rama correcta
git checkout nuevapagina

# 2. Instalar dependencias (si no lo has hecho)
npm install

# 3. Build del proyecto
npm run build

# 4. Desplegar usando la configuración de producción
npx wrangler pages deploy dist --project-name=webapp-production-new --config=wrangler.production.jsonc
```

### Opción 2: Deployment via Cloudflare Dashboard

1. **Ir a Cloudflare Dashboard**
   - Navega a: https://dash.cloudflare.com
   - Selecciona tu cuenta

2. **Crear Nuevo Proyecto en Pages**
   - Ve a "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
   - Selecciona el repositorio: `cadamar1236/proyectolovablemasgowth`
   - Configura:
     - **Project name**: `webapp-production-new` (o el nombre que prefieras)
     - **Production branch**: `nuevapagina`
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`

3. **Configurar Variables de Entorno**
   En la sección "Environment variables":
   ```
   STRIPE_PUBLISHABLE_KEY = pk_live_51QhutTGCWzoDsbCNXa5c3FfzM3eW4aUWkQ2Lb3YEtMTcZw3g8kaKkXreV71LgiD0XOLLT82uQwoYo11SXDJrcki600xkgQ3zND
   ```

4. **Configurar Bindings**
   - **D1 Database**:
     - Variable name: `DB`
     - D1 database: Selecciona `webapp-production`
   
   - **KV Namespace**:
     - Variable name: `CACHE`
     - KV namespace: Selecciona el namespace existente (ID: b2ccf7c25cbf4b40afd69de9aeadeb51)
   
   - **AI Binding**:
     - Variable name: `AI`

5. **Deploy**
   - Click en "Save and Deploy"
   - El sitio se desplegará automáticamente

## Importante: Base de Datos Compartida

⚠️ **AMBOS SITIOS USAN LA MISMA BASE DE DATOS**

Esto significa que:
- ✅ Los usuarios pueden hacer login en cualquiera de los dos sitios
- ✅ Los productos subidos aparecerán en ambos sitios
- ✅ Los likes y votes son compartidos
- ✅ No hay duplicación de datos
- ⚠️ Los cambios en la estructura de la DB afectarán a ambos sitios

## Verificar el Deployment

Después del deployment, verifica:

1. **Autenticación funciona**:
   - Prueba login con Google
   - Prueba registro de usuario
   - Verifica que los tokens se guarden correctamente

2. **Marketplace funciona**:
   - Los productos se cargan correctamente
   - Los likes funcionan
   - La navegación entre productos funciona

3. **Leaderboard funciona**:
   - Se muestra el ranking correcto
   - Los scores se calculan bien
   - Las métricas son precisas

## Comandos Útiles

```bash
# Ver logs del deployment
npx wrangler pages deployment list --project-name=webapp-production-new

# Ver logs en tiempo real
npx wrangler pages deployment tail --project-name=webapp-production-new

# Rollback a una versión anterior
npx wrangler pages deployment rollback --project-name=webapp-production-new

# Ver info de la base de datos
npx wrangler d1 info webapp-production

# Ejecutar query en la DB (para debugging)
npx wrangler d1 execute webapp-production --command="SELECT COUNT(*) as total_products FROM beta_products"
```

## Troubleshooting

### Error: "Database binding not found"
Asegúrate de que el binding `DB` esté configurado correctamente en la configuración de Cloudflare Pages.

### Error: "Module not found"
Ejecuta `npm install` y `npm run build` de nuevo.

### Los productos no aparecen
Verifica que la base de datos tenga productos:
```bash
npx wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM beta_products"
```

### Error de autenticación
Verifica que las variables de entorno estén configuradas correctamente en Cloudflare Pages.

## Estructura del Proyecto

```
proyectolovablemasgowth/
├── src/
│   ├── index.tsx              # Nueva landing minimalista (Polymarket style)
│   ├── index-old.tsx          # Landing anterior (backup)
│   └── api/                   # APIs compartidas por ambos sitios
├── public/
│   └── static/
│       ├── marketplace.js     # Lógica del marketplace
│       └── app.js            # Lógica general
├── wrangler.jsonc            # Config sitio original
├── wrangler.production.jsonc # Config nuevo sitio
└── DEPLOYMENT.md             # Esta guía
```

## URLs Esperadas

Después del deployment, tendrás:
- **Sitio Original**: `webapp.pages.dev` (o tu custom domain)
- **Sitio Nuevo**: `webapp-production-new.pages.dev` (o tu custom domain)

Ambos sitios comparten la misma base de datos y sistema de autenticación.
