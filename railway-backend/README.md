# ASTAR* Railway Backend Backup

Este es el servidor de backup que corre en Railway con PostgreSQL.
Cuando Cloudflare falle, puedes usar esta URL en su lugar.

## 🚀 Despliegue en Railway

### 1. Crear nuevo proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta este repositorio
5. **Importante**: En Settings → Root Directory, pon: `railway-backend`

### 2. Añadir PostgreSQL

1. En el proyecto, click en "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway conectará automáticamente la variable `DATABASE_URL`

### 3. Configurar Variables de Entorno

En el servicio web, ve a "Variables" y añade:

```
JWT_SECRET=<mismo-que-en-cloudflare>
NODE_ENV=production
```

Para sincronizar datos desde D1 (opcional):
```
CLOUDFLARE_API_TOKEN=<tu-token-api>
CLOUDFLARE_ACCOUNT_ID=<tu-account-id>
CLOUDFLARE_DATABASE_ID=5cb67508-cc61-4194-886b-05cf6f1c00fa
```

### 4. Desplegar

Railway desplegará automáticamente cuando hagas push.

## 📋 Comandos útiles

```bash
# Desarrollo local
cd railway-backend
npm install
npm run dev

# Ejecutar migraciones
npm run db:migrate

# Sincronizar datos desde Cloudflare D1
npm run db:sync
```

## 🔗 Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `/health` | Health check |
| `/api/auth/login` | Login |
| `/api/auth/me` | Usuario actual |
| `/api/events` | Listar eventos |
| `/api/events/:id` | Detalle evento |
| `/api/events` (POST) | Crear evento (admin) |
| `/api/events/:id` (DELETE) | Eliminar evento (admin) |
| `/api/events/:id/register` | Registrarse en evento |
| `/api/competitions` | Listar competiciones |
| `/api/marketplace/directory` | Directorio de usuarios |
| `/api/dashboard/leaderboard` | Leaderboard |

## 🔄 Sincronización de datos

Para mantener los datos sincronizados entre Cloudflare D1 y Railway PostgreSQL:

1. **Opción A: Manual** - Ejecuta `npm run db:sync` cuando quieras sincronizar
2. **Opción B: Automática** - Configura un cron job en Railway para ejecutar la sincronización periódicamente

## ⚠️ Nota importante

Este servidor de backup:
- Usa PostgreSQL en lugar de D1 SQLite
- Tiene las mismas rutas API que Cloudflare
- Comparte el JWT_SECRET para que los tokens funcionen en ambos

Cuando Cloudflare falle, solo cambia la URL base de tu frontend.
