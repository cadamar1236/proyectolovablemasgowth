# 🤖 LovableGrowth WhatsApp Agents

Sistema multiagente basado en **Agno Framework** para gestionar goals y métricas a través de WhatsApp usando **Twilio**.

## 📋 Características

- **Sistema Multiagente**: Agentes especializados para diferentes tareas
  - 🎯 **Intent Classifier**: Clasifica las intenciones del usuario
  - 📋 **Goals Manager**: Gestiona creación y completado de goals
  - 📊 **Metrics Agent**: Registra y consulta métricas
  - 🏆 **Leaderboard Agent**: Consulta rankings y posiciones

- **Integración con Twilio WhatsApp**: Recibe y envía mensajes vía webhook
- **Autenticación**: Vincula números de WhatsApp con cuentas de LovableGrowth
- **Persistencia**: Base de datos SQLite para usuarios y conversaciones
- **API REST**: Endpoints para administración y envío de mensajes

## 🚀 Instalación

### 1. Requisitos Previos

- Python 3.10+
- Cuenta de Twilio con WhatsApp Sandbox activado
- API Key de Groq (ultra-fast inference)
- La webapp de LovableGrowth corriendo

### 2. Configurar Variables de Entorno

```bash
cd agents
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# API Configuration
WEBAPP_API_URL=http://localhost:3000/api
WEBAPP_API_TOKEN=optional_token

# Groq Configuration (ultra-fast LLM inference)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Iniciar el Servidor

```bash
python main.py
```

El servidor estará disponible en `http://localhost:8000`

## 🔧 Configuración de Twilio

### Webhook Configuration

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Navega a **Messaging** > **Try it Out** > **Send a WhatsApp message**
3. Configura el webhook:
   - **When a message comes in**: `https://tu-dominio.com/webhook/twilio`
   - **Method**: POST

### Para desarrollo local (usando ngrok)

```bash
ngrok http 8000
```

Usa la URL de ngrok como webhook en Twilio.

## 📱 Comandos de WhatsApp

Los usuarios pueden interactuar con estos comandos:

### Goals
- `mis goals` - Ver lista de goals activos
- `nuevo goal [descripción]` - Crear un nuevo goal
- `completar [número]` - Marcar goal como completado

### Métricas
- `mis métricas` - Ver historial de métricas
- `usuarios [número]` - Registrar número de usuarios
- `revenue [número]` - Registrar ingresos

### Ranking
- `leaderboard` - Ver posiciones del ranking

### Cuenta
- `login` - Iniciar sesión
- `estado` - Ver estado de la cuenta
- `ayuda` - Ver comandos disponibles

## 🏗️ Arquitectura

```
agents/
├── main.py              # Servidor FastAPI principal
├── agents.py            # Sistema multiagente con Agno
├── api_client.py        # Cliente HTTP para la webapp
├── twilio_service.py    # Servicio de Twilio WhatsApp
├── database.py          # Modelos SQLAlchemy
├── models.py            # Modelos Pydantic
├── config.py            # Configuración
├── requirements.txt     # Dependencias
└── .env.example         # Plantilla de variables de entorno
```

## 📊 API Endpoints

### Webhook
- `POST /webhook/twilio` - Recibe mensajes de Twilio
- `POST /webhook/twilio/status` - Callback de estado de mensajes

### Administración
- `GET /api/users` - Lista usuarios de WhatsApp
- `GET /api/conversations/{phone}` - Historial de conversación
- `POST /api/send-message` - Enviar mensaje a un usuario
- `POST /api/broadcast` - Enviar mensaje a todos

### Health
- `GET /` - Health check básico
- `GET /health` - Health check detallado

## 🔄 Flujo de Mensajes

```
Usuario WhatsApp
      │
      ▼
Twilio Webhook (/webhook/twilio)
      │
      ▼
Intent Classifier Agent
      │
      ▼
Specialized Agent (Goals/Metrics/Leaderboard)
      │
      ▼
WebApp API (goals, métricas, etc.)
      │
      ▼
Twilio Service (respuesta)
      │
      ▼
Usuario WhatsApp
```

## 🏆 Sistema de Leaderboard

El score se calcula así:
- **Goals completados**: +10 puntos cada uno
- **Goals creados**: +2 puntos cada uno
- **Métricas registradas**: +1 punto cada una
- **Achievements**: +5 puntos cada uno

El leaderboard se actualiza automáticamente cuando:
- Se completa un goal
- Se añade una métrica
- Se registra un logro

## 🔐 Autenticación

1. Usuario envía mensaje por primera vez
2. Bot solicita email registrado en LovableGrowth
3. Bot solicita contraseña
4. Se verifica contra la API de auth
5. Se vincula el número de WhatsApp con la cuenta
6. Sesión activa para futuros mensajes

## 🐛 Debugging

### Ver logs del servidor
```bash
python main.py
# Los logs se muestran en consola
```

### Verificar usuarios registrados
```bash
curl http://localhost:8000/api/users
```

### Ver historial de conversación
```bash
curl http://localhost:8000/api/conversations/whatsapp:+123456789
```

## 📦 Despliegue

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY agents/ .
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["python", "main.py"]
```

### Railway/Render
1. Conecta el repositorio
2. Configura las variables de entorno
3. Despliega

## 🤝 Integración con la Webapp

Este sistema se integra con los siguientes endpoints de la webapp:

- `POST /api/auth/login` - Autenticación
- `GET /api/dashboard/goals` - Obtener goals
- `POST /api/dashboard/goals` - Crear goal
- `PUT /api/dashboard/goals/:id` - Actualizar goal
- `POST /api/dashboard/goals/complete` - Completar goal
- `POST /api/dashboard/metrics` - Añadir métrica
- `GET /api/dashboard/metrics-history` - Historial de métricas
- `POST /api/dashboard/achievements` - Añadir logro
- `GET /api/dashboard/leaderboard` - Obtener leaderboard

## 📝 Licencia

MIT License
