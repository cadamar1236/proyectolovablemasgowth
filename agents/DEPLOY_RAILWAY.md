# 🚀 Deploy Agentes Python en Railway

## Opción 1: Railway (Recomendado - Gratis hasta $5/mes)

### Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Verifica tu cuenta

### Paso 2: Crear nuevo proyecto

1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca tu repositorio: `proyectolovablemasgowth`
4. **IMPORTANTE**: En la configuración, selecciona la carpeta `/agents` como root:
   - Click en **Settings** → **Root Directory** → escribe `agents`

### Paso 3: Configurar Variables de Entorno

En Railway, ve a **Variables** y añade:

```env
# Twilio (OBLIGATORIO)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SANDBOX_CODE=join tu-codigo-sandbox

# Groq para AI (OBLIGATORIO)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile

# Conexión con tu webapp de Cloudflare
WEBAPP_API_URL=https://tu-app.pages.dev/api
WEBAPP_API_TOKEN=tu-jwt-token-aqui

# Configuración
ENVIRONMENT=production
DEBUG=false
```

### Paso 4: Deploy

Railway desplegará automáticamente. Obtén tu URL:
```
https://tu-proyecto.up.railway.app
```

### Paso 5: Configurar Twilio

1. Ve a [Twilio Console](https://console.twilio.com)
2. **Messaging** → **Try it out** → **Send a WhatsApp message**
3. En **Sandbox Settings**, configura:
   - **When a message comes in**: `https://tu-proyecto.up.railway.app/webhook/whatsapp`
   - **Method**: POST

---

## Opción 2: Render (Alternativa gratuita)

### Paso 1: Crear cuenta

1. Ve a [render.com](https://render.com)
2. Conecta tu GitHub

### Paso 2: Crear Web Service

1. Click **"New"** → **"Web Service"**
2. Conecta tu repositorio
3. Configura:
   - **Name**: `lovablegrowth-agents`
   - **Root Directory**: `agents`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Paso 3: Variables de Entorno

Añade las mismas variables que Railway en **Environment**.

---

## Opción 3: Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Desde la carpeta agents/
cd agents

# Crear app
fly launch --name lovablegrowth-agents

# Configurar secrets
fly secrets set TWILIO_ACCOUNT_SID=ACxxxxxx
fly secrets set TWILIO_AUTH_TOKEN=xxxxxx
fly secrets set GROQ_API_KEY=gsk_xxxxx
fly secrets set WEBAPP_API_URL=https://tu-app.pages.dev/api

# Deploy
fly deploy
```

---

## 🔗 Integración con Cloudflare Workers

Una vez desplegado, tienes dos opciones:

### Opción A: Twilio → Python directamente
Configura Twilio para enviar webhooks directo a Railway:
```
https://tu-proyecto.up.railway.app/webhook/whatsapp
```

### Opción B: Cloudflare → Python (más control)
1. Cloudflare recibe el webhook de Twilio
2. Cloudflare reenvía a Python para procesamiento AI
3. Python responde con la acción a ejecutar
4. Cloudflare ejecuta la acción y responde a Twilio

Para esto, actualiza tu `whatsapp.ts` para llamar al servidor Python.

---

## 📋 Verificar Deploy

Una vez desplegado, prueba estos endpoints:

```bash
# Health check
curl https://tu-proyecto.up.railway.app/health

# Info de conexión
curl https://tu-proyecto.up.railway.app/connect
```

---

## 🔧 Variables de Entorno Necesarias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Tu Account SID de Twilio | `ACxxxxx` |
| `TWILIO_AUTH_TOKEN` | Tu Auth Token de Twilio | `xxxxx` |
| `TWILIO_WHATSAPP_NUMBER` | Número de WhatsApp Twilio | `whatsapp:+14155238886` |
| `TWILIO_SANDBOX_CODE` | Código del sandbox | `join hungry-wolf` |
| `GROQ_API_KEY` | API Key de Groq | `gsk_xxxxx` |
| `GROQ_MODEL` | Modelo de Groq | `llama-3.3-70b-versatile` |
| `WEBAPP_API_URL` | URL de tu API Cloudflare | `https://app.pages.dev/api` |
| `WEBAPP_API_TOKEN` | Token JWT para auth | `eyJhbGci...` |

---

## 🧪 Probar Localmente

```bash
cd agents

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: .\venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Crear .env con tus credenciales
cp .env.example .env
# Edita .env con tus valores

# Ejecutar
python main.py
# o: uvicorn main:app --reload
```

---

## 🎯 Comandos de WhatsApp

Una vez configurado, los usuarios pueden:

| Comando | Acción |
|---------|--------|
| `hola` | Saludo inicial |
| `mis goals` | Ver lista de goals |
| `nuevo goal [descripción]` | Crear goal |
| `completar [número]` | Marcar completado |
| `métricas` | Ver métricas |
| `usuarios [número]` | Registrar usuarios |
| `revenue [número]` | Registrar ingresos |
| `leaderboard` | Ver ranking |
| `ayuda` | Ver comandos |

---

## ❓ Troubleshooting

### Error: "Module not found"
```bash
pip install -r requirements.txt
```

### Error: "Connection refused" a Cloudflare
- Verifica `WEBAPP_API_URL` 
- Asegúrate que el token JWT sea válido

### Twilio no envía mensajes
- Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
- Confirma que el sandbox esté activado

### Groq no responde
- Verifica `GROQ_API_KEY`
- Prueba con modelo más pequeño: `llama-3.1-8b-instant`
