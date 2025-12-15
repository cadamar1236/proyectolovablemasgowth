# 📱 Guía de Conexión WhatsApp - LovableGrowth

## Para Usuarios Finales

### Paso 1: Conectarse al Bot

**En Desarrollo (Sandbox de Twilio):**
1. Guarda este número en tus contactos: `+1 415 523 8886`
2. Abre WhatsApp y envía el mensaje: `join <tu-codigo-sandbox>`
3. Una vez conectado, envía cualquier mensaje para comenzar

**En Producción:**
1. Guarda el número oficial de LovableGrowth
2. Envía "Hola" para comenzar
3. Sigue las instrucciones del bot

### Paso 2: Vincular tu Cuenta

1. El bot te pedirá tu **email** registrado en LovableGrowth
2. Luego ingresa tu **contraseña**
3. ¡Listo! Ya puedes gestionar tus goals

### Paso 3: Usar el Bot

Comandos disponibles:
- `mis goals` - Ver tus objetivos
- `nuevo goal [descripción]` - Crear objetivo
- `completar [número]` - Marcar como hecho
- `leaderboard` - Ver ranking
- `ayuda` - Ver todos los comandos

---

## Para Administradores

### Configurar Twilio Sandbox (Desarrollo)

1. **Crear cuenta en Twilio**: https://www.twilio.com/try-twilio

2. **Activar WhatsApp Sandbox**:
   - Ve a Console → Messaging → Try it out → Send a WhatsApp message
   - Verás tu código de sandbox (ej: `join hungry-wolf`)
   - Comparte este código con tus usuarios de prueba

3. **Configurar Webhook**:
   ```
   Webhook URL: https://tu-servidor.com/webhook/twilio
   Method: POST
   ```

4. **Para desarrollo local con ngrok**:
   ```bash
   ngrok http 8000
   # Copia la URL https y configúrala en Twilio
   ```

### Migrar a Producción (WhatsApp Business API)

1. **Solicitar acceso a WhatsApp Business API** en Twilio:
   - Console → Messaging → Senders → WhatsApp Senders
   - Sigue el proceso de verificación de Meta

2. **Requisitos de Meta/Facebook**:
   - Cuenta de Facebook Business verificada
   - Política de privacidad en tu sitio web
   - Descripción clara del uso del bot

3. **Una vez aprobado**:
   - Obtendrás un número dedicado
   - Los usuarios pueden escribir directamente sin código de unión
   - Puedes enviar mensajes proactivos (con plantillas aprobadas)

### Variables de Entorno Necesarias

```env
# Twilio (obtener de console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox
# TWILIO_WHATSAPP_NUMBER=whatsapp:+1TUNUMERO  # Producción

# Tu API
WEBAPP_API_URL=https://tu-app.com/api

# Groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxx
```

### Compartir con Usuarios

Crea un link o QR code para facilitar la conexión:

**Link directo de WhatsApp:**
```
https://wa.me/14155238886?text=join%20TU-CODIGO-SANDBOX
```

**Para producción:**
```
https://wa.me/TUNUMERO?text=Hola
```

### Generar QR Code

Puedes usar servicios como:
- https://www.qr-code-generator.com/
- O generar programáticamente con la librería `qrcode` de Python

---

## Troubleshooting

### "No puedo enviar mensajes al bot"
- Verifica que hayas enviado el código `join xxx` primero (solo sandbox)
- Asegúrate de que el webhook está configurado correctamente
- Revisa los logs del servidor

### "El bot no responde"
- Verifica que el servidor está corriendo
- Revisa las credenciales de Twilio en `.env`
- Comprueba los logs para errores

### "Error de autenticación"
- Verifica que el email está registrado en LovableGrowth
- Asegúrate de escribir la contraseña correctamente
- Intenta con `login` para reiniciar el proceso
