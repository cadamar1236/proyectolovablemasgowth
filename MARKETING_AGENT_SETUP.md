# 🚀 Marketing AI Agent System - Setup Guide

## Sistema de Agentes de Marketing con Agno + Groq

Este sistema integra agentes de IA especializados en marketing directamente en el dashboard de ValidAI Studio, permitiendo análisis de objetivos, generación de planes de marketing, ideas de contenido y análisis competitivo.

---

## 📋 Características Implementadas

### 1. **Marketing Orchestrator** (`src/utils/marketing-agent.ts`)
- ✅ Agente orquestador que delega tareas a agentes especializados
- ✅ 4 agentes especializados:
  - **Market Research Agent**: Análisis de mercado y tendencias
  - **Content Creation Agent**: Generación de contenido para redes sociales
  - **Strategy Agent**: Estrategias de marketing y planes de acción
  - **Social Media Agent**: Gestión de redes sociales y engagement

### 2. **Integración con Groq**
- ✅ Cliente Groq configurado con `llama-3.3-70b-versatile`
- ✅ Contexto aware: Los agentes reciben información de objetivos actuales
- ✅ Clasificación automática de solicitudes para delegar al agente correcto

### 3. **API Endpoints** (`src/api/chat-agent.ts`)
Nuevos endpoints agregados:

- `POST /api/chat-agent/analyze-goals`: Analiza objetivos y da recomendaciones
- `POST /api/chat-agent/marketing-plan`: Genera plan de marketing (timeframe configurable)
- `POST /api/chat-agent/content-ideas`: Genera ideas de contenido (plataforma + cantidad)
- `POST /api/chat-agent/competition-analysis`: Analiza competencia e industria

### 4. **Dashboard UI** (`src/dashboard-page.tsx`)
- ✅ Botones de acción rápida en el sidebar del chat
- ✅ 4 botones principales:
  - 🎯 **Analizar Objetivos**: Evaluación completa de progreso
  - 📋 **Plan de Marketing**: Generación de estrategia temporal
  - 💡 **Ideas de Contenido**: Contenido para plataformas específicas
  - 🏆 **Análisis de Competencia**: Evaluación competitiva de industria

### 5. **Base de Datos** (`migrations/0022_marketing_agent.sql`)
Nuevas tablas:
- `marketing_tasks`: Tracking de tareas de agentes
- `marketing_insights`: Insights generados (tendencias, oportunidades, riesgos)
- `content_ideas`: Ideas de contenido con estado y programación
- `agent_conversations`: Historial de conversaciones con contexto

Vistas de análisis:
- `marketing_task_stats`: Estadísticas de tareas por usuario
- `user_marketing_summary`: Resumen de actividad de marketing

---

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agrega a tu archivo `.env` o configuración de Cloudflare Workers:

```bash
# API Keys
GROQ_API_KEY=gsk_...  # Obtén en https://console.groq.com
OPENAI_API_KEY=sk-... # Fallback si no tienes Groq
```

Para Cloudflare Workers, agrega los secrets:

```bash
# Producción
wrangler secret put GROQ_API_KEY
wrangler secret put OPENAI_API_KEY

# Development
export GROQ_API_KEY=your_key_here
export OPENAI_API_KEY=your_key_here
```

### 2. Instalación de Dependencias

```bash
npm install groq-sdk agno
```

O si usas el package.json actualizado:

```bash
npm install
```

### 3. Migraciones de Base de Datos

Aplica las migraciones necesarias:

```bash
# Local
wrangler d1 migrations apply DB --local

# Producción
wrangler d1 migrations apply DB --remote
```

Específicamente ejecuta:
- `0021_chat_agent.sql` (si no lo hiciste antes)
- `0022_marketing_agent.sql` (nueva migración)

---

## 🎯 Uso del Sistema

### Opción 1: Chat Normal
Los usuarios pueden simplemente escribir en el chat:

```
"Analiza mis objetivos actuales"
"Crea un plan de marketing para 30 días"
"Dame 10 ideas de contenido para Instagram"
"Analiza la competencia en marketing digital"
```

El orquestador detectará automáticamente la intención y delegará al agente correcto.

### Opción 2: Botones de Acción Rápida

En el sidebar del chat, hay 4 botones que ejecutan funciones específicas:

1. **Analizar Objetivos**: Click → Análisis automático
2. **Plan de Marketing**: Click → Solicita timeframe → Genera plan
3. **Ideas de Contenido**: Click → Solicita plataforma y cantidad → Genera ideas
4. **Análisis de Competencia**: Click → Solicita industria y competidores → Analiza

### Opción 3: API Directa

Para integraciones programáticas:

```javascript
// Analizar objetivos
const response = await fetch('/api/chat-agent/analyze-goals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

// Plan de marketing
const plan = await fetch('/api/chat-agent/marketing-plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timeframe: '60 días'
  })
});

// Ideas de contenido
const ideas = await fetch('/api/chat-agent/content-ideas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platform: 'LinkedIn',
    quantity: 15
  })
});

// Análisis de competencia
const competition = await fetch('/api/chat-agent/competition-analysis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    industry: 'SaaS B2B',
    competitors: ['Salesforce', 'HubSpot', 'Zoho']
  })
});
```

---

## 🧠 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      USER (Dashboard)                        │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Analizar  │  │ Plan Mkt.  │  │   Ideas    │            │
│  │  Objetivos │  │            │  │ Contenido  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│           │              │                │                  │
└───────────┼──────────────┼────────────────┼─────────────────┘
            │              │                │
            ▼              ▼                ▼
    ┌─────────────────────────────────────────────┐
    │        Chat Agent API (/api/chat-agent)      │
    │                                               │
    │  • JWT Authentication                         │
    │  • Context Building (Goals + Metrics)         │
    │  • Route to Specialized Endpoints             │
    └───────────────────┬───────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────────┐
    │      Marketing Orchestrator (Groq)           │
    │                                               │
    │  ┌──────────────────────────────────────┐   │
    │  │   Classification Engine              │   │
    │  │   (Decides which agent to use)       │   │
    │  └──────────────────────────────────────┘   │
    │                                               │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
    │  │ Research │  │ Content  │  │ Strategy │  │
    │  │  Agent   │  │  Agent   │  │  Agent   │  │
    │  └──────────┘  └──────────┘  └──────────┘  │
    │  ┌──────────┐                                │
    │  │  Social  │     Each agent has:            │
    │  │  Agent   │     - Groq Client              │
    │  └──────────┘     - Specialized Prompts     │
    │                   - Context Awareness        │
    └───────────────────┬───────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────────┐
    │           Groq API (Llama 3.3)               │
    │                                               │
    │  • Fast inference                             │
    │  • Context-aware responses                    │
    │  • Goal-aligned recommendations               │
    └─────────────────────────────────────────────┘
```

---

## 📊 Ejemplos de Respuestas

### 1. Análisis de Objetivos

```markdown
🎯 ANÁLISIS DE OBJETIVOS ACTUALES

📊 MÉTRICAS GENERALES:
- Total de objetivos: 5
- Completados: 2 (40%)
- En progreso: 3 (60%)
- Tasa de completitud: 40%

⚠️ OBJETIVOS EN RIESGO:
1. "Aumentar ventas a 100 clientes" - Progreso: 45/100 (45%)
   - Deadline: 15 días
   - Recomendación: Acelerar campaña de outreach

✅ OBJETIVOS DESTACADOS:
1. "Lanzar landing page" - Completado ✓
2. "Configurar CRM" - Completado ✓

💡 RECOMENDACIONES:
1. Enfocar recursos en objetivo de ventas (deadline próximo)
2. Considerar split testing para mejorar conversión
3. Implementar seguimiento automatizado de leads

📈 PRÓXIMOS PASOS:
- Crear secuencia de emails para leads fríos
- Optimizar landing page con insights de analytics
- Configurar recordatorios automáticos
```

### 2. Plan de Marketing

```markdown
🎯 PLAN DE MARKETING - 30 DÍAS

📈 ESTRATEGIA GENERAL:
Enfoque en crecimiento orgánico combinado con paid ads dirigidos.
Objetivo principal: Aumentar leads cualificados en 150%

📅 SEMANA 1: FUNDACIÓN
- Lunes: Audit de contenido actual
- Martes: Definir buyer personas
- Miércoles: Configurar tracking y analytics
- Jueves: Crear calendario editorial
- Viernes: Preparar primer batch de contenido

📅 SEMANA 2: LANZAMIENTO
- Contenido: 3 posts LinkedIn + 5 stories Instagram
- Ads: Lanzar campaña A/B testing ($500)
- Email: Newsletter semanal
- SEO: Optimizar 3 páginas clave

📅 SEMANA 3: OPTIMIZACIÓN
- Analizar métricas de Semana 2
- Ajustar ads según performance
- Crear case study de cliente
- Webinar: Registro y promoción

📅 SEMANA 4: ESCALAMIENTO
- Aumentar presupuesto en ads ganadores
- Lanzar webinar
- Follow-up con leads calientes
- Preparar contenido para mes siguiente

💰 PRESUPUESTO ESTIMADO:
- Ads: $1,500
- Herramientas: $200
- Contenido: $500
Total: $2,200

📊 MÉTRICAS CLAVE:
- Leads generados: Target 200
- Tasa de conversión: Target 3%
- CAC (Cost per Acquisition): Target $11
- ROI esperado: 300%
```

---

## 🛠️ Customización

### Cambiar el Modelo de Groq

En `src/utils/marketing-agent.ts`:

```typescript
class GroqClient {
  private model: string = 'llama-3.3-70b-versatile'; // Cambiar aquí
  
  // Opciones disponibles:
  // - llama-3.3-70b-versatile (recomendado para marketing)
  // - llama-3.1-70b-versatile (alternativa)
  // - mixtral-8x7b-32768 (más tokens)
}
```

### Agregar Nuevo Agente Especializado

```typescript
class SEOAgent {
  private groq: GroqClient;
  private name: string = 'SEO Specialist';

  constructor(groq: GroqClient) {
    this.groq = groq;
  }

  async optimize(context: AgentContext, userPrompt: string): Promise<string> {
    const systemPrompt = `Eres un experto en SEO...`;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    return await this.groq.chat(messages, 0.6);
  }
}

// Agregar al orquestador
this.seoAgent = new SEOAgent(this.groq);
```

### Personalizar Prompts

Los prompts están en cada agente. Por ejemplo, para cambiar el Content Creator:

```typescript
async create(context: AgentContext, userPrompt: string): Promise<string> {
  const systemPrompt = `Eres un creador de contenido...
  
  // Agregar instrucciones personalizadas:
  - Siempre incluir llamadas a la acción
  - Usar formato de lista con emojis
  - Enfocarse en engagement sobre ventas
  - Incluir preguntas para aumentar comentarios
  `;
  
  // ...resto del código
}
```

---

## 🚨 Troubleshooting

### Error: "Groq API failed"

**Causa**: API key incorrecta o límite de rate alcanzado

**Solución**:
```bash
# Verificar que la key está configurada
echo $GROQ_API_KEY

# Verificar límites en https://console.groq.com
# Groq ofrece 7,000 RPM gratis (muy generoso)
```

### Error: "Failed to fetch goals"

**Causa**: Tabla `dashboard_goals` no existe o usuario no autenticado

**Solución**:
```bash
# Verificar que migraciones están aplicadas
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# Verificar autenticación
# Asegurar que el JWT está en las cookies o headers
```

### Respuestas muy lentas

**Causa**: Groq tiene alta latencia o modelo muy grande

**Solución**:
```typescript
// Reducir max_tokens en GroqClient
max_tokens: 2000, // En vez de 4000

// O cambiar a modelo más rápido
private model: string = 'llama-3.1-8b-instant';
```

### Chat no se actualiza después de acción rápida

**Causa**: `scrollChatToBottom()` no se ejecuta

**Solución**:
```javascript
// Asegurar que se llama después de actualizar state
state.isLoading = false;
render();
scrollChatToBottom(); // ← Verificar que existe
```

---

## 📈 Métricas y Analytics

Consultas SQL útiles para analytics:

```sql
-- Tareas más comunes por usuario
SELECT 
  user_id, 
  task_type, 
  COUNT(*) as count 
FROM marketing_tasks 
GROUP BY user_id, task_type 
ORDER BY count DESC;

-- Tasa de éxito de tareas
SELECT 
  task_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM marketing_tasks
GROUP BY task_type;

-- Insights no leídos por prioridad
SELECT 
  priority,
  COUNT(*) as unread_count
FROM marketing_insights
WHERE is_read = 0
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- Ideas de contenido por plataforma y estado
SELECT 
  platform,
  status,
  COUNT(*) as count
FROM content_ideas
GROUP BY platform, status;
```

---

## 🎉 ¡Listo!

Tu sistema de agentes de marketing está completamente configurado. Los usuarios ahora pueden:

1. ✅ Chatear con agentes de IA especializados
2. ✅ Recibir análisis de objetivos automáticos
3. ✅ Generar planes de marketing completos
4. ✅ Obtener ideas de contenido para cualquier plataforma
5. ✅ Analizar competencia e industria

Todo integrado directamente en el dashboard con un solo click.

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Cloudflare Workers
2. Verifica las API keys en secrets
3. Confirma que las migraciones están aplicadas
4. Consulta la documentación de Groq: https://console.groq.com/docs

---

**Creado con ❤️ usando Agno + Groq + Hono + Cloudflare Workers**
