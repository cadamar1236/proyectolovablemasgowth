# 🚀 Guía de Deployment a Cloudflare Pages

## 📋 Requisitos Previos
- Cuenta de Cloudflare (gratis): https://dash.cloudflare.com/sign-up
- Cuenta de GitHub (ya configurada ✅)

---

## 🎯 Método 1: Deploy Directo desde Terminal (Más Rápido)

### Paso 1: Autenticación
```bash
cd /home/user/webapp
wrangler login
```
Esto abrirá tu navegador para autorizar Wrangler. Si estás en un entorno sin navegador, usa:
```bash
wrangler login --browser=false
```
Y sigue el link que te proporcionará.

### Paso 2: Crear Base de Datos D1
```bash
# Crear la base de datos en Cloudflare
wrangler d1 create webapp-production
```

**⚠️ IMPORTANTE:** Copia el `database_id` que te devuelva. Se verá así:
```
✅ Successfully created DB 'webapp-production'
Created your database using D1's new storage backend.
The new storage backend is not yet recommended for production 
workloads, but backs up your data via point-in-time restore.

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx"  # ⬅️ COPIA ESTE ID
```

### Paso 3: Actualizar Configuración
Edita el archivo `wrangler.jsonc` y reemplaza `"database_id": "local-only"` con el ID real:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  "compatibility_date": "2025-10-21",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "TU-DATABASE-ID-AQUI"  # ⬅️ CAMBIA ESTO
    }
  ],
  "ai": {
    "binding": "AI"
  },
  "vars": {
    "GROQ_API_KEY": "your_groq_api_key_here"  # ⬅️ Opcionalmente cambia esto también
  }
}
```

### Paso 4: Aplicar Migraciones a Producción
```bash
# Aplicar las migraciones a la base de datos en la nube
wrangler d1 migrations apply webapp-production --remote

# Cargar datos de ejemplo (opcional, recomendado para demo)
wrangler d1 execute webapp-production --remote --file=./seed.sql
```

### Paso 5: Build y Deploy
```bash
# Construir la aplicación
npm run build

# Desplegar a Cloudflare Pages
wrangler pages deploy dist --project-name=validai-studio
```

### Paso 6: Configurar Variables de Entorno (Opcional)
Si quieres usar una API key real de Groq:
```bash
wrangler pages secret put GROQ_API_KEY --project-name=validai-studio
# Te pedirá que ingreses el valor del secret
```

---

## 🌐 Método 2: Deploy via GitHub (Recomendado para Producción)

### Paso 1: Conectar Cloudflare con GitHub

1. Ve a https://dash.cloudflare.com
2. En el panel lateral, selecciona **Workers & Pages**
3. Click en **Create Application**
4. Selecciona la pestaña **Pages**
5. Click en **Connect to Git**

### Paso 2: Seleccionar Repositorio

1. Autoriza Cloudflare a acceder a tu GitHub
2. Selecciona el repositorio: `cadamar1236/proyectolovablemasgowth`
3. Click en **Begin Setup**

### Paso 3: Configurar Build

Usa estos valores:

| Campo | Valor |
|-------|-------|
| **Project name** | `validai-studio` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

### Paso 4: Variables de Entorno

En la sección **Environment variables**, agrega:

| Variable | Valor | Notas |
|----------|-------|-------|
| `NODE_VERSION` | `18` | Especifica versión de Node |
| `GROQ_API_KEY` | `tu_api_key_aqui` | (Opcional) Para análisis IA |

### Paso 5: Crear Base de Datos D1

Desde tu terminal:
```bash
# Crear DB
wrangler d1 create webapp-production

# Obtener el database_id y guardarlo
```

### Paso 6: Vincular D1 Database al Proyecto

1. En el dashboard de Cloudflare Pages, ve a tu proyecto `validai-studio`
2. Ve a **Settings** > **Functions**
3. En **D1 database bindings**, click **Add binding**:
   - Variable name: `DB`
   - D1 database: Selecciona `webapp-production`
4. Click **Save**

### Paso 7: Aplicar Migraciones
```bash
wrangler d1 migrations apply webapp-production --remote
wrangler d1 execute webapp-production --remote --file=./seed.sql
```

### Paso 8: Re-deploy (si es necesario)
```bash
git commit --allow-empty -m "Trigger redeploy with D1 configured"
git push origin main
```

---

## 🔧 Comandos Útiles Post-Deployment

### Ver Logs en Tiempo Real
```bash
wrangler pages deployment tail --project-name=validai-studio
```

### Ver Info del Proyecto
```bash
wrangler pages project list
wrangler pages deployment list --project-name=validai-studio
```

### Actualizar la Aplicación
```bash
# Método 1: Via terminal
npm run build
wrangler pages deploy dist --project-name=validai-studio

# Método 2: Via Git (si conectaste GitHub)
git add .
git commit -m "Update application"
git push origin main
```

### Gestionar Base de Datos
```bash
# Ver tablas
wrangler d1 execute webapp-production --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# Ver datos de una tabla
wrangler d1 execute webapp-production --remote --command="SELECT * FROM projects LIMIT 5"

# Backup de la base de datos
wrangler d1 export webapp-production --remote --output=backup.sql
```

---

## 🌟 URLs y Recursos

Después del deployment, tu aplicación estará disponible en:
- **URL de producción**: `https://validai-studio.pages.dev`
- **URL personalizada**: Puedes configurar tu propio dominio en Settings > Custom domains

**Dashboards Importantes:**
- 📊 **Cloudflare Dashboard**: https://dash.cloudflare.com
- 🗄️ **D1 Dashboard**: Workers & Pages > D1
- 📈 **Analytics**: Tu proyecto > Analytics
- 🔍 **Real-time Logs**: Tu proyecto > Functions > View logs

---

## ⚠️ Troubleshooting

### Error: "No such database"
```bash
# Verifica que el database_id en wrangler.jsonc sea correcto
wrangler d1 list
```

### Error: "Table doesn't exist"
```bash
# Aplica las migraciones nuevamente
wrangler d1 migrations apply webapp-production --remote
```

### La aplicación no carga los datos
```bash
# Verifica que el seed se haya ejecutado
wrangler d1 execute webapp-production --remote --command="SELECT COUNT(*) FROM projects"
```

### Cambios no se reflejan
```bash
# Limpia cache y re-deploy
rm -rf dist .wrangler
npm run build
wrangler pages deploy dist --project-name=validai-studio
```

---

## 💰 Costos (Estimados)

**Cloudflare Pages (Gratis):**
- ✅ 500 builds/mes
- ✅ Unlimited requests
- ✅ Unlimited bandwidth

**Cloudflare D1 (Gratis):**
- ✅ 5GB storage
- ✅ 5 millones de reads/día
- ✅ 100,000 writes/día

**Workers AI:**
- ⚠️ Tiene costo después de 10,000 requests/día
- Para desarrollo: usa Groq API (más tokens, más rápido)

---

## 🎉 ¡Listo!

Una vez deployado, tu aplicación estará en línea 24/7 con:
- ⚡ Edge computing global (ultra-rápido)
- 🔒 SSL automático
- 🌍 CDN global de Cloudflare
- 📊 Analytics integrado
- 🚀 Zero downtime deployments

---

## 📞 Soporte

- **Documentación Cloudflare**: https://developers.cloudflare.com/pages/
- **Documentación D1**: https://developers.cloudflare.com/d1/
- **Discord Cloudflare**: https://discord.gg/cloudflaredev
