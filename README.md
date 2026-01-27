# 🚀 LovableGrowth - Plataforma de Startups

> Plataforma para conectar founders, inversores, validadores y talento.

## 📌 ¿Qué es esto?

Una aplicación web que permite a startups:
- Publicar y promocionar sus productos
- Conectar con inversores y mentores
- Obtener validación de expertos
- Gestionar objetivos de crecimiento
- Usar agentes de IA para marketing

---

## 🏗️ Arquitectura Simple

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (HTML/JS)                       │
│                    TailwindCSS + JavaScript                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Hono + TypeScript)                │
│                      Cloudflare Workers                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │   Chat   │  │Dashboard │  │Marketing │        │
│  │   API    │  │   API    │  │   API    │  │  AI API  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS (Cloudflare D1)                │
│                         SQLite distribuido                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
proyectolovablemasgowth/
│
├── src/                          # 📦 CÓDIGO PRINCIPAL
│   │
│   ├── api/                      # 🔌 ENDPOINTS API (Backend)
│   │   ├── auth.ts              # Login, registro, JWT, Google OAuth
│   │   ├── marketplace.ts       # Productos, votación, perfiles
│   │   ├── chat.ts              # Mensajes entre usuarios
│   │   ├── dashboard.ts         # Objetivos (goals) del usuario
│   │   ├── crm.ts               # Gestión de contactos CRM
│   │   ├── connector.ts         # Conexiones AI entre usuarios
│   │   ├── projects.ts          # Proyectos y leaderboard
│   │   ├── competitions.ts      # Competiciones de startups
│   │   ├── stripe.ts            # Pagos con Stripe
│   │   ├── marketing-ai.ts      # Chat con agente de marketing
│   │   ├── chat-agent.ts        # Asistente ASTAR (IA)
│   │   ├── ai-cmo.ts            # CMO virtual con IA
│   │   ├── notifications.ts     # Sistema de notificaciones
│   │   ├── team.ts              # Gestión de equipos
│   │   ├── admin.ts             # Panel de administración
│   │   ├── whatsapp.ts          # Integración WhatsApp
│   │   └── rateLimit.ts         # Protección contra spam
│   │
│   ├── utils/                    # 🛠️ UTILIDADES
│   │   ├── groq.ts              # Cliente para API de Groq (IA)
│   │   ├── groq-mvp-generator.ts # Generador de MVPs con IA
│   │   └── marketing-agent.ts   # Lógica del agente de marketing
│   │
│   ├── index.tsx                # 🚪 ENTRY POINT - Rutas principales
│   ├── marketplace-page.tsx     # Página del marketplace
│   ├── dashboard-page.tsx       # Página del dashboard
│   ├── onboarding-page.tsx      # Onboarding nuevos usuarios
│   ├── competitions-page.tsx    # Página de competiciones
│   ├── layout-with-sidebars.tsx # Layout con sidebar y chat ASTAR
│   ├── admin-dashboard.tsx      # Panel de admin
│   └── types.ts                 # Tipos TypeScript compartidos
│
├── agents/                       # 🤖 AGENTES IA (Python/Railway)
│   ├── marketing_agent.py       # Agente de marketing principal
│   ├── api_server.py            # Servidor FastAPI
│   └── README.md                # Documentación de agentes
│
├── migrations/                   # 📊 MIGRACIONES SQL
│   ├── 0001_initial_schema.sql  # Esquema inicial
│   └── ...                      # Migraciones incrementales
│
├── public/static/               # 📄 ARCHIVOS ESTÁTICOS
│   ├── style.css               # Estilos CSS
│   └── app.js                  # JavaScript del frontend
│
├── workers/                     # ⚙️ WORKERS ADICIONALES
│   └── astar-cron/             # Cron jobs (mensajes programados)
│
└── Archivos de configuración:
    ├── package.json             # Dependencias Node.js
    ├── tsconfig.json           # Configuración TypeScript
    ├── vite.config.ts          # Configuración de build
    └── wrangler.jsonc          # Configuración Cloudflare
```

---

## 🔑 Conceptos Clave para Entender el Código

### 1. **Hono** - Framework Backend
```typescript
// Así se crea un endpoint en Hono
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/users', async (c) => {
  // c = contexto (tiene request, response, env)
  const users = await c.env.DB.prepare('SELECT * FROM users').all();
  return c.json(users);  // Responde con JSON
});
```

### 2. **Cloudflare D1** - Base de Datos
```typescript
// Así se hacen queries a la base de datos
const result = await c.env.DB.prepare(`
  SELECT * FROM users WHERE id = ?
`).bind(userId).first();  // .bind() previene SQL injection
```

### 3. **JWT** - Autenticación
```typescript
// El token JWT contiene info del usuario
const token = await sign({ userId: 1, email: 'user@mail.com' }, JWT_SECRET);

// Para verificar el token
const payload = await verify(token, JWT_SECRET);
// payload = { userId: 1, email: 'user@mail.com' }
```

### 4. **Middleware** - Funciones que se ejecutan antes de cada request
```typescript
// Middleware de autenticación
const requireAuth = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'No autorizado' }, 401);
  
  const payload = await verify(token, JWT_SECRET);
  c.set('userId', payload.userId);  // Guarda el userId para usarlo después
  await next();  // Continúa al siguiente handler
};

// Uso del middleware
app.get('/api/profile', requireAuth, async (c) => {
  const userId = c.get('userId');  // Ya verificado por el middleware
  // ...
});
```

---

## 🔐 Seguridad Implementada

| Característica | Descripción |
|----------------|-------------|
| **PBKDF2** | Contraseñas hasheadas con 100,000 iteraciones |
| **JWT Seguro** | Token secreto en variables de entorno (no hardcodeado) |
| **Rate Limiting** | Máximo 5 intentos de login por minuto |
| **Prepared Statements** | Previene SQL Injection usando `.bind()` |
| **Cookie Secure** | Flag Secure en producción (solo HTTPS) |

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Instalar dependencias
```bash
npm install
```

### 2. Desarrollo local
```bash
npm run dev          # Servidor de desarrollo
# Abre http://localhost:5173
```

### 3. Build para producción
```bash
npm run build        # Compila el proyecto
npm run deploy       # Despliega a Cloudflare
```

### 4. Base de datos
```bash
# Aplicar migraciones localmente
wrangler d1 migrations apply DB --local

# Aplicar en producción
wrangler d1 migrations apply DB --remote
```

---

## 📡 Endpoints API Principales

### Autenticación (`/api/auth/`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/register` | Registrar nuevo usuario |
| POST | `/login` | Iniciar sesión |
| GET | `/me` | Obtener perfil actual |
| POST | `/google` | Login con Google OAuth |

### Marketplace (`/api/marketplace/`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Listar productos |
| POST | `/products` | Crear producto |
| POST | `/products/:id/vote` | Votar producto |

### Dashboard (`/api/dashboard/`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/goals` | Listar objetivos |
| POST | `/goals` | Crear objetivo |
| PUT | `/goals/:id` | Actualizar objetivo |
| DELETE | `/goals/:id` | Eliminar objetivo |

### Chat (`/api/chat/`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/conversations` | Listar conversaciones |
| POST | `/conversations` | Crear conversación |
| GET | `/conversations/:id/messages` | Ver mensajes |
| POST | `/conversations/:id/messages` | Enviar mensaje |

### CRM (`/api/crm/`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/contacts` | Listar contactos |
| POST | `/contacts` | Crear contacto |
| GET | `/activities` | Ver actividades |

---

## 🗃️ Tablas de Base de Datos Principales

```sql
-- Usuarios del sistema
users (id, email, password, name, role, plan, avatar_url, bio, company)

-- Productos en el marketplace
beta_products (id, title, description, company_user_id, category, votes, status)

-- Conversaciones de chat
user_conversations (id, user1_id, user2_id, status, created_at)

-- Mensajes
user_messages (id, conversation_id, sender_id, content, is_read, created_at)

-- Objetivos del dashboard
dashboard_goals (id, user_id, title, description, target_value, current_value, status)

-- Contactos CRM
crm_contacts (id, user_id, name, email, company, status, source)
```

---

## 🔄 Flujo de Autenticación

```
1. Usuario hace login → POST /api/auth/login
                              │
2. Backend verifica password → PBKDF2 hash comparison
                              │
3. Si es válido → Genera JWT token
                              │
4. Frontend guarda token → Cookie o localStorage
                              │
5. Cada request incluye → Authorization: Bearer <token>
                              │
6. Middleware verifica → Si válido, extrae userId
                              │
7. Handler usa userId → Filtra datos por usuario
```

---

## 🛠️ Variables de Entorno Necesarias

```bash
# En Cloudflare Dashboard > Pages > Settings > Variables

JWT_SECRET=clave-secreta-muy-larga-y-aleatoria

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Stripe (para pagos)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Groq (para IA)
GROQ_API_KEY=gsk_xxx
```

### Configurar JWT_SECRET en producción:
```bash
npx wrangler pages secret put JWT_SECRET --project-name webapp
# Ingresa una clave aleatoria de 64+ caracteres
```

---

## 📝 Guía Rápida para Añadir Features

### Añadir nuevo endpoint API:

1. Crear archivo en `src/api/mi-feature.ts`:
```typescript
import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/hello', (c) => c.json({ message: 'Hola!' }));

export default app;
```

2. Registrar en `src/index.tsx`:
```typescript
import miFeature from './api/mi-feature';
app.route('/api/mi-feature', miFeature);
```

### Añadir nueva tabla:

1. Crear migración en `migrations/00XX_mi_tabla.sql`:
```sql
CREATE TABLE mi_tabla (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

2. Ejecutar migración:
```bash
wrangler d1 migrations apply DB --local
```

---

## 🐛 Debugging Tips

```typescript
// Ver logs en desarrollo
console.log('[DEBUG] Variable:', variable);

// Ver request completo
console.log('[REQUEST]', {
  method: c.req.method,
  url: c.req.url,
  headers: Object.fromEntries(c.req.raw.headers)
});

// Ver errores SQL
try {
  await c.env.DB.prepare('...').run();
} catch (error) {
  console.error('[DB ERROR]', error);
}
```

---

## 📚 Recursos de Aprendizaje

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 👤 Contacto

- **GitHub**: [@cadamar1236](https://github.com/cadamar1236)
- **Website**: [webapp-46s.pages.dev](https://webapp-46s.pages.dev)

---

⭐ ¿Te fue útil? ¡Dale una estrella al repo!
