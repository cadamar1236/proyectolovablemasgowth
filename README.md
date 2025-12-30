# 🚀 LovableGrowth - Plataforma de Validación y Crecimiento de Startups

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://webapp-46s.pages.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.10-red)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Plataforma integral que conecta founders, validadores, inversores y talento para impulsar el crecimiento de startups mediante validación colaborativa, marketplace unificado y agentes de IA especializados.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Reference](#-api-reference)
- [Base de Datos](#-base-de-datos)
- [Despliegue](#-despliegue)
- [Contribuir](#-contribuir)

## ✨ Características Principales

### 🎯 Marketplace Unificado
- **7 tipos de usuarios**: Productos, Founders, Inversores, Validadores, Scouts, Partners, Talento
- Sistema de votación universal para todos los usuarios autenticados
- Perfiles detallados con información de contacto y redes sociales
- Filtrado y búsqueda avanzada por tipo de usuario

### 💬 Sistema de Chat Universal
- Chat en tiempo real entre cualquier tipo de usuario
- Historial de conversaciones persistente
- Notificaciones de mensajes no leídos
- Interfaz integrada en el marketplace

### 📊 Dashboard Interactivo
- Gestión de objetivos (goals) con seguimiento de progreso
- Análisis de datos con gráficos interactivos (Chart.js)
- Sistema de notificaciones
- Integración con chat y marketplace

### 🤖 Agentes de IA

#### Marketing AI Agent
- **Market Research Agent**: Análisis de mercado con Apify
- **Content Creation Agent**: Generación de contenido multi-plataforma
- **Marketing Strategy Agent**: Estrategias de marketing completas
- **Social Media Agent**: Análisis de TikTok y generación de videos

#### Chat Agent
- Asistente conversacional para dudas y soporte
- Integración con dashboard para respuestas contextualizadas

### 🎨 Generador de MVPs
- Generación automática de MVPs con IA (Groq)
- Templates pre-configurados para diferentes tipos de negocio
- Exportación de código y documentación

### 💳 Sistema de Pagos
- Integración con Stripe
- Planes de suscripción: Free, Starter, Pro, Enterprise
- Gestión de billing y subscriptions

### 📱 Integración WhatsApp
- Gestión de goals vía WhatsApp con Twilio
- Sistema de verificación de códigos
- Agente conversacional por WhatsApp

### ⚡ Quick Pitch
- Sistema de pitch rápido para startups
- Generación de presentaciones con IA
- Exportación a PDF con QR codes

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- HTML5 + TailwindCSS
- JavaScript vanilla con TypeScript
- Chart.js para visualizaciones
- Axios para peticiones HTTP

**Backend:**
- Hono (Framework web para Cloudflare Workers)
- Cloudflare Workers (Serverless)
- Cloudflare D1 (SQLite distribuido)
- TypeScript

**Servicios Externos:**
- Google OAuth 2.0
- Stripe (pagos)
- Groq (generación de MVPs con IA)
- Apify (web scraping para marketing agent)
- ModelsLab (generación de videos)
- Twilio (WhatsApp integration)

### Estructura del Proyecto

```
proyectolovablemasgowth/
├── src/
│   ├── api/                      # Endpoints de la API
│   │   ├── auth.ts              # Autenticación y OAuth
│   │   ├── marketplace.ts       # Marketplace y productos
│   │   ├── chat.ts              # Sistema de chat
│   │   ├── dashboard.ts         # Dashboard y goals
│   │   ├── projects.ts          # Proyectos y votación
│   │   ├── stripe.ts            # Integración de pagos
│   │   ├── marketing-ai.ts      # Agente de marketing IA
│   │   ├── chat-agent.ts        # Agente conversacional
│   │   ├── whatsapp.ts          # Integración WhatsApp
│   │   ├── quick-pitch.ts       # Sistema de pitch
│   │   ├── mvp-generator.ts     # Generador de MVPs
│   │   ├── notifications.ts     # Sistema de notificaciones
│   │   ├── plans.ts             # Planes de suscripción
│   │   ├── validation.ts        # Validación de proyectos
│   │   └── validator-requests.ts # Solicitudes de validación
│   │
│   ├── dashboard/               # Componentes de dashboard
│   │   └── Dashboard.tsx        # Dashboard React
│   │
│   ├── utils/                   # Utilidades
│   │   ├── groq.ts             # Cliente Groq
│   │   ├── groq-mvp-generator.ts
│   │   ├── intelligent-mvp-generator.ts
│   │   └── mvp-templates.ts
│   │
│   ├── index.tsx               # Entry point principal
│   ├── marketplace-page.tsx    # Página de marketplace
│   ├── dashboard-page.tsx      # Página de dashboard
│   ├── layout-with-sidebars.tsx # Layout principal
│   ├── html-templates.tsx      # Templates HTML
│   └── types.ts                # Tipos TypeScript
│
├── agents/                      # Agentes de IA Python
│   ├── marketing_agent.py      # Agente de marketing
│   └── README.md               # Documentación de agentes
│
├── migrations/                  # Migraciones de base de datos
│   ├── 0001_initial_schema.sql
│   ├── 0002_marketplace.sql
│   ├── 0025_user_conversations.sql
│   ├── 0027_marketing_ai.sql
│   └── ...
│
├── public/                      # Archivos estáticos
│   └── static/
│       ├── style.css           # Estilos globales
│       ├── app.js              # JavaScript principal
│       ├── marketplace.js      # Lógica del marketplace
│       ├── mvp-generator.js    # Generador de MVPs
│       ├── project-detail.js   # Detalle de proyectos
│       └── quick-pitch.js      # Quick pitch
│
├── package.json                 # Dependencias Node.js
├── requirements.txt             # Dependencias Python
├── tsconfig.json               # Configuración TypeScript
├── vite.config.ts              # Configuración Vite
├── wrangler.jsonc              # Configuración Cloudflare
├── deploy-cloudflare.sh        # Script de despliegue
└── README.md                   # Este archivo
```

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ y npm
- Python 3.9+ (para agentes de IA)
- Cuenta de Cloudflare (para despliegue)
- Wrangler CLI

### 1. Clonar el Repositorio

```bash
git clone https://github.com/cadamar1236/proyectolovablemasgowth.git
cd proyectolovablemasgowth
```

### 2. Instalar Dependencias Node.js

```bash
npm install
```

### 3. Instalar Dependencias Python (Opcional - para Marketing Agent)

```bash
pip install -r requirements.txt
```

## ⚙️ Configuración

### 1. Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# JWT Secret (cambiar en producción)
JWT_SECRET=your-super-secret-jwt-key-change-me

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GOOGLE_REDIRECT_URI=https://tu-dominio.pages.dev/api/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Groq (para MVP Generator)
GROQ_API_KEY=gsk_...

# Twilio (para WhatsApp)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Marketing AI Agent
OPENAI_API_KEY=sk-...
APIFY_API_TOKEN=apify_api_...
MODELSLAB_API_KEY=...
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos local
wrangler d1 create lovable-growth-db

# Aplicar migraciones
wrangler d1 migrations apply lovable-growth-db --local

# Para producción
wrangler d1 migrations apply lovable-growth-db --remote
```

### 3. Configurar wrangler.jsonc

Actualizar el archivo `wrangler.jsonc` con tu configuración:

```json
{
  "name": "webapp",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "lovable-growth-db",
      "database_id": "tu-database-id"
    }
  ]
}
```

## 💻 Uso

### Desarrollo Local

```bash
# Compilar y servir con Vite
npm run dev

# Servir con Wrangler (con D1 local)
npm run dev:sandbox

# Ejecutar en http://localhost:3000
```

### Build para Producción

```bash
npm run build
```

### Ejecutar Migraciones

```bash
# Local
npm run db:migrate:local

# Producción
npm run db:migrate:prod
```

### Scripts Útiles

```bash
# Resetear base de datos local
npm run db:reset

# Preview local
npm run preview

# Limpiar puerto 3000
npm run clean-port

# Test endpoint
npm run test
```

## 📡 API Reference

### Autenticación

#### POST `/api/auth/google`
Iniciar sesión con Google OAuth

**Request:**
```json
{
  "code": "google-oauth-code",
  "role": "founder" | "validator" | "investor" | "scout" | "partner" | "talent"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "founder"
  }
}
```

### Marketplace

#### GET `/api/marketplace/products`
Obtener lista de productos

**Query Params:**
- `type`: Filtrar por tipo de usuario (opcional)

#### POST `/api/marketplace/products`
Crear nuevo producto

#### POST `/api/marketplace/products/:id/vote`
Votar por un producto (requiere autenticación)

### Chat

#### GET `/api/chat/conversations`
Obtener conversaciones del usuario autenticado

#### POST `/api/chat/conversations`
Crear nueva conversación

#### GET `/api/chat/conversations/:id/messages`
Obtener mensajes de una conversación

#### POST `/api/chat/conversations/:id/messages`
Enviar mensaje

### Dashboard

#### GET `/api/dashboard/goals`
Obtener goals del usuario

#### POST `/api/dashboard/goals`
Crear nuevo goal

#### PUT `/api/dashboard/goals/:id`
Actualizar goal

### Marketing AI

#### POST `/api/marketing-ai/chat`
Chat con el agente de marketing

#### POST `/api/marketing-ai/analyze-business`
Análisis completo de negocio

#### POST `/api/marketing-ai/generate-campaign`
Generar campaña de contenido

#### POST `/api/marketing-ai/analyze-competition`
Análisis competitivo

Ver [MARKETING_AI_README.md](MARKETING_AI_README.md) para documentación completa.

## 🗄️ Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema
- **beta_products**: Productos en el marketplace
- **projects**: Proyectos de startups
- **user_conversations**: Conversaciones entre usuarios
- **user_messages**: Mensajes del chat
- **dashboard_goals**: Objetivos del dashboard
- **pricing_plans**: Planes de suscripción
- **stripe_customers**: Clientes de Stripe
- **marketing_ai_conversations**: Conversaciones con marketing AI
- **whatsapp_users**: Usuarios de WhatsApp

### Esquema Completo

Ver archivos en `migrations/` para el esquema completo de la base de datos.

## 🚢 Despliegue

### Cloudflare Pages

1. **Conectar repositorio:**
```bash
wrangler pages project create webapp
```

2. **Desplegar:**
```bash
npm run deploy
```

3. **Configurar variables de entorno** en el dashboard de Cloudflare Pages

4. **Ejecutar migraciones en producción:**
```bash
npm run db:migrate:prod
```

### Script de Despliegue Automático

```bash
bash deploy-cloudflare.sh
```

## 🛠️ Tecnologías Utilizadas

- **Hono** - Framework web ultrarrápido
- **Cloudflare Workers** - Serverless computing
- **Cloudflare D1** - Base de datos SQLite distribuida
- **TypeScript** - Type safety
- **Vite** - Build tool moderno
- **TailwindCSS** - Utility-first CSS
- **Chart.js** - Gráficos interactivos
- **Stripe** - Procesamiento de pagos
- **Google OAuth** - Autenticación
- **Groq** - Modelos de IA rápidos
- **Agno** - Framework de agentes de IA
- **Apify** - Web scraping
- **ModelsLab** - Generación de contenido multimedia

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Carlos** - *Desarrollo Principal* - [cadamar1236](https://github.com/cadamar1236)

## 🙏 Agradecimientos

- Cloudflare por su excelente plataforma
- Comunidad de Hono
- Todos los contribuidores

## 📞 Contacto

- Website: [webapp-46s.pages.dev](https://webapp-46s.pages.dev)
- GitHub: [@cadamar1236](https://github.com/cadamar1236)

---

⭐ Si este proyecto te ha sido útil, considera darle una estrella en GitHub!
