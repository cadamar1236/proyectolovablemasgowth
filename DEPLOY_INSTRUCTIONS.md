# Configuración de Variables de Entorno - URGENTE

## ⚠️ IMPORTANTE: GROQ_API_KEY Faltante

La GROQ_API_KEY fue removida de `wrangler.jsonc` por seguridad (no debe estar en el código).

**DEBES configurarla en Cloudflare Dashboard:**

### Pasos para Configurar:

1. **Ve a Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com
   ```

2. **Navega a tu proyecto:**
   - Workers & Pages → `webapp`

3. **Ve a Settings → Environment Variables**

4. **Agrega esta variable:**
   ```
   Name: GROQ_API_KEY
   Value: [your_groq_api_key_from_groq.com]
   Environment: Production
   ```
   
   ⚠️ **Get your key from**: https://console.groq.com/keys

5. **Click en "Save"**

6. **Re-deploy** (se hará automáticamente o ejecuta):
   ```bash
   npx wrangler pages deploy
   ```

---

## 🔄 Verificar que el Deploy Completó

```bash
npx wrangler pages deployment list
```

El deployment más reciente debe ser de hace pocos minutos.

---

## 🧪 Probar el LinkedIn Connector

1. **Abre tu dashboard:**
   ```
   https://webapp-46s.pages.dev/dashboard
   ```

2. **Haz hard refresh:**
   ```
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

3. **Scroll hasta el final de la página**
   - Deberías ver: "🔗 LinkedIn Connector"
   - Con un terminal de fondo oscuro

4. **Haz una búsqueda de prueba:**
   - Tipo: `investor`
   - Query: `venture capital`
   - Click en `🔍 Search`

---

## 📊 Estado del Sistema

### ✅ Completado:
- Backend API (`src/api/linkedin-connector.ts`)
- Frontend UI (`src/dashboard-page.tsx`)
- Base de datos (tabla `linkedin_connections`)
- Git commit y push
- Deploy iniciado

### ⏳ Pendiente:
- Esperar a que complete el deploy (~2 minutos)
- Configurar GROQ_API_KEY en Cloudflare
- Hacer hard refresh en el navegador

---

## 🐛 Si Aún No Aparece:

### 1. Verificar que el deploy completó:
```bash
npx wrangler pages deployment list | Select-Object -First 5
```

### 2. Limpiar caché completamente:
- Abre DevTools (F12)
- Right-click en el botón de refresh
- Selecciona "Empty Cache and Hard Reload"

### 3. Probar en modo incógnito:
```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)
```

### 4. Verificar la consola del navegador:
- F12 → Console
- Busca errores relacionados con "linkedin" o "connector"

---

## 📝 Cambios Realizados en Este Deploy:

1. ✅ **Marketing Agent → Astar Labs Agent**
   - Renombrado en: `src/api/marketing-ai.ts`
   - Renombrado en: `android-app/app/src/main/java/com/lovablegrowth/chatbot/ChatActivity.kt`

2. ✅ **LinkedIn Connector Agregado**
   - API Backend: `src/api/linkedin-connector.ts`
   - Frontend UI: `src/dashboard-page.tsx` (línea ~760)
   - Base de datos: `migrations/0019_linkedin_connections.sql`
   - Documentación: `LINKEDIN_CONNECTOR_GUIDE.md`

3. ✅ **Archivos Limpiados**
   - Eliminados 8 archivos obsoletos
   - Removidos archivos .disabled de migraciones

4. ✅ **Android App Completa**
   - 152 archivos nuevos para la app Android
   - Estructura completa con Kotlin, Retrofit, Material Design

---

## 🎯 Próximos Pasos:

1. **Espera 2 minutos** para que complete el deploy
2. **Configura GROQ_API_KEY** en Cloudflare Dashboard
3. **Abre el dashboard** y haz hard refresh
4. **Scroll hasta el final** para ver el LinkedIn Connector
5. **Prueba una búsqueda** de inversores o talento

---

## 💡 Nota sobre GROQ_API_KEY:

Si el Marketing Agent (Astar Labs Agent) no funciona después del deploy, es porque falta la GROQ_API_KEY. Configúrala en Cloudflare Dashboard como se indicó arriba.

El LinkedIn Connector NO depende de GROQ_API_KEY, así que debería funcionar inmediatamente.
