# Configuración Railway Multi-Agent System

## 1. Desplegar el API Server en Railway

### Paso 1: Crear nuevo proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Click en "New Project" → "Deploy from GitHub repo"
3. Selecciona este repositorio

### Paso 2: Configurar variables de entorno
En Railway, añade estas variables:

```bash
OPENAI_API_KEY=tu-clave-openai
APIFY_API_TOKEN=tu-token-apify
FAL_KEY=tu-clave-fal (opcional, para generación de imágenes)
PORT=5000
```

### Paso 3: Configurar el start command
En Railway Settings → Deploy:
```bash
python agents/api_server.py
```

### Paso 4: Obtener la URL pública
Railway te dará una URL como: `https://tu-proyecto.railway.app`

## 2. Configurar Cloudflare Pages

### En el Dashboard de Cloudflare Pages:
1. Ve a Settings → Environment Variables
2. Añade: `RAILWAY_API_URL = https://tu-proyecto.railway.app`

### O en wrangler.jsonc (local):
```jsonc
"vars": {
  "RAILWAY_API_URL": "https://tu-proyecto.railway.app"
}
```

## 3. Cómo funciona

```
Frontend (dashboard-page.tsx)
  ↓
  POST /api/chat-agent/message { useMetricsAgent: true }
  ↓
Cloudflare (chat-agent.ts)
  ↓
  POST https://tu-railway.railway.app/api/agents/metrics/chat
  {
    user_id: 123,
    message: "Analiza mis métricas",
    session_id: "chat_123_1234567890"
  }
  ↓
Railway Python Agent (metrics_agent.py)
  ↓
  Llama de vuelta a Cloudflare:
  GET https://tu-app.pages.dev/api/metrics-data/context?userId=123
  (con JWT token)
  ↓
Análisis con AI + respuesta
  ↓
Frontend recibe respuesta
```

## 4. Endpoints disponibles en Railway

### Metrics Agent
- `POST /api/agents/metrics/chat` - Chat conversacional
- `POST /api/agents/metrics/analyze` - Análisis rápido
- `POST /api/agents/metrics/report` - Generar reporte
- `POST /api/agents/metrics/compare` - Comparar con benchmarks

### Brand Marketing Agent
- `POST /api/agents/brand/analyze` - Analizar marca
- `POST /api/agents/brand/generate-images` - Generar imágenes

### Orchestrator
- `POST /api/agents/orchestrator/analyze` - Análisis multi-agente

### Health Check
- `GET /api/agents/health` - Verificar estado

## 5. Arquitectura de Seguridad

✅ **JWT Authentication**: 
- Cloudflare verifica el JWT antes de llamar a Railway
- Railway confía en el `user_id` enviado por Cloudflare
- Railway usa el JWT original para llamar de vuelta a `/api/metrics-data`

✅ **No API Keys adicionales**:
- Sistema simplificado open-source
- Una sola capa de autenticación (JWT)

## 6. Testing local

```bash
# Terminal 1: Ejecutar Railway localmente
cd agents
python api_server.py

# Terminal 2: En wrangler.jsonc
"RAILWAY_API_URL": "http://localhost:5000"

# Ejecutar Cloudflare Pages
npm run dev
```

## 7. Troubleshooting

### Error: "No pude conectar con el agente de métricas"
- Verifica que `RAILWAY_API_URL` esté configurado
- Verifica que Railway esté corriendo: `curl https://tu-railway.railway.app/api/agents/health`
- Revisa logs en Railway dashboard

### Error: "user_id is required"
- El JWT en Cloudflare debe incluir el `userId`
- Verifica la autenticación en `jwtMiddleware`

### El agente no obtiene datos
- Verifica que `/api/metrics-data` endpoints funcionen
- El agente necesita llamar de vuelta a Cloudflare con JWT válido
- Revisa que `CLOUDFLARE_API_URL` esté configurado en Railway (en MetricsConfig)
