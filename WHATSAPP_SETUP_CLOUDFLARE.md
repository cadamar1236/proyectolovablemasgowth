# Configuración de WhatsApp con Twilio - LovableGrowth

## ✅ Archivos Creados

1. **`src/api/whatsapp.ts`** - Webhook API para Twilio (compatible con Cloudflare Workers)
2. **`migrations/0019_whatsapp_integration.sql`** - Tablas de base de datos

## 🚀 Pasos para Activar

### 1. Ejecutar Migración de Base de Datos

**Local:**
```bash
npm run db:migrate:local
```

**Producción:**
```bash
npm run db:migrate:prod
```

### 2. Configurar Variables de Entorno

Edita `wrangler.jsonc` y actualiza el código del sandbox:
```json
"vars": {
  "TWILIO_WHATSAPP_NUMBER": "whatsapp:+14155238886",
  "TWILIO_SANDBOX_CODE": "join <tu-codigo-sandbox>"
}
```

### 3. Configurar Secrets en Cloudflare

Ejecuta estos comandos para guardar las credenciales sensibles:

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID
# Ingresa tu Account SID de Twilio

npx wrangler secret put TWILIO_AUTH_TOKEN  
# Ingresa tu Auth Token de Twilio

npx wrangler secret put GROQ_API_KEY
# Ingresa tu API Key de Groq (opcional, si usas AI)
```

### 4. Configurar Webhook en Twilio

1. Ve a tu [Twilio Console](https://console.twilio.com)
2. Navega a **Messaging > Try it out > Send a WhatsApp message**
3. En **Sandbox Settings**, configura:

   - **When a message comes in:**
     ```
     https://tu-app.pages.dev/api/whatsapp/webhook
     ```
   - **Method:** POST

### 5. Desplegar

```bash
npm run deploy:prod
```

## 📱 Cómo Conectarse

1. **Guardar el número de WhatsApp:**
   - `+1 415 523 8886` (Twilio Sandbox)

2. **Enviar el código de activación:**
   - Envía: `join <tu-codigo-sandbox>` al número guardado

3. **¡Listo!** Ya puedes interactuar con tu agente

## 🎯 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `mis goals` | Ver lista de goals |
| `nuevo goal [desc]` | Crear un nuevo goal |
| `completar [#]` | Marcar goal como completado |
| `usuarios [número]` | Registrar métrica de usuarios |
| `revenue [número]` | Registrar métrica de ingresos |
| `leaderboard` | Ver ranking de usuarios |
| `estado` | Ver tu estado actual |
| `ayuda` | Ver comandos disponibles |

## 🔐 Flujo de Autenticación

1. Nuevo usuario envía mensaje → Se le pide email
2. Usuario envía email registrado → Se vincula cuenta
3. Usuario autenticado → Puede usar todos los comandos

## 🗄️ Tablas de Base de Datos

### `whatsapp_users`
```sql
- id: INTEGER PRIMARY KEY
- phone_number: TEXT UNIQUE (ej: whatsapp:+5491155554444)
- user_id: INTEGER (FK a users)
- email: TEXT
- is_verified: INTEGER (0 o 1)
- pending_action: TEXT
- pending_data: TEXT
```

### `whatsapp_conversations`
```sql
- id: INTEGER PRIMARY KEY  
- phone_number: TEXT
- direction: TEXT (inbound/outbound)
- message: TEXT
- intent: TEXT
- created_at: DATETIME
```

## 🧪 Probar Localmente

1. Usa [ngrok](https://ngrok.com) para exponer tu servidor local:
   ```bash
   ngrok http 3000
   ```

2. Copia la URL de ngrok y configúrala en Twilio Sandbox

3. Ejecuta el servidor:
   ```bash
   npm run dev
   ```

## ❓ Solución de Problemas

### "No encontré una cuenta con ese email"
- Verifica que el email esté registrado en LovableGrowth
- El email es case-insensitive

### Mensajes no llegan
- Verifica que el webhook URL sea correcto
- Revisa los logs en Cloudflare Dashboard
- Confirma que las credenciales de Twilio son válidas

### Error 401 en Twilio
- Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN
- Los secrets deben estar configurados en Cloudflare

---

## 🌟 Próximos Pasos

Una vez configurado, los usuarios podrán:
1. Gestionar sus goals desde WhatsApp
2. Ver su posición en el leaderboard
3. Registrar métricas de crecimiento
4. Competir con otros usuarios

¡El sistema está diseñado para funcionar 100% en Cloudflare Workers!
