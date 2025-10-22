# ⚡ Quick Start - Deploy a Cloudflare en 5 Minutos

## 🎯 Método Más Rápido (Recomendado)

### 1️⃣ Autentícate
```bash
wrangler login
```

### 2️⃣ Ejecuta el script automático
```bash
./deploy-cloudflare.sh
```

**¡Listo!** El script hará todo automáticamente.

---

## 🔧 Método Manual (Si prefieres control total)

### Paso 1: Login
```bash
cd /home/user/webapp
wrangler login
```

### Paso 2: Crear DB D1
```bash
wrangler d1 create webapp-production
```
**⚠️ Guarda el `database_id` y actualízalo en `wrangler.jsonc`**

### Paso 3: Migrar DB
```bash
wrangler d1 migrations apply webapp-production --remote
wrangler d1 execute webapp-production --remote --file=./seed.sql
```

### Paso 4: Deploy
```bash
npm run build
wrangler pages deploy dist --project-name=validai-studio
```

---

## 🌐 URLs Importantes

Después del deploy:
- **App**: https://validai-studio.pages.dev
- **Dashboard**: https://dash.cloudflare.com

---

## 📚 Documentación Completa

Ver `DEPLOYMENT_GUIDE.md` para:
- Deploy via GitHub
- Troubleshooting
- Configuración avanzada
- Gestión de base de datos

---

## 🆘 Ayuda Rápida

**Error de autenticación:**
```bash
wrangler login --browser=false
```

**Error de database:**
```bash
wrangler d1 list
```

**Ver logs:**
```bash
wrangler pages deployment tail --project-name=validai-studio
```
