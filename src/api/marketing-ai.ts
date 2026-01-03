/**
 * Astar Labs AI Agent API
 * Endpoints para el chat inteligente con agentes Agno de Astar Labs
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const marketingAI = new Hono<{ Bindings: Bindings }>();

const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// Middleware: Verify authentication
async function requireAuth(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, JWT_SECRET) as any;
    
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Apply auth middleware to all routes
marketingAI.use('*', requireAuth);

// POST /api/marketing-ai/chat - Enviar mensaje al agente de marketing
marketingAI.post('/chat', async (c) => {
  try {
    const userId = c.get('userId');
    const { message, context } = await c.req.json();

    if (!message || message.trim().length === 0) {
      return c.json({ error: 'Message cannot be empty' }, 400);
    }

    console.log('[MARKETING AI] User message:', { userId, message });

    // Aquí se llamará al agente Python mediante un worker o servicio externo
    // Por ahora retornamos una respuesta de ejemplo
    const response = await callMarketingAgent(message, context);

    // Guardar conversación en la base de datos
    await c.env.DB.prepare(`
      INSERT INTO marketing_ai_conversations (user_id, message, response, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, message, response).run();

    return c.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[MARKETING AI] Error:', error);
    return c.json({ error: 'Failed to process message' }, 500);
  }
});

// GET /api/marketing-ai/history - Obtener historial de conversación
marketingAI.get('/history', async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '50');

    const { results } = await c.env.DB.prepare(`
      SELECT id, message, response, created_at
      FROM marketing_ai_conversations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json({
      history: results || []
    });

  } catch (error) {
    console.error('[MARKETING AI] Error fetching history:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// POST /api/marketing-ai/analyze-business - Análisis completo de negocio
marketingAI.post('/analyze-business', async (c) => {
  try {
    const userId = c.get('userId');
    const { business_description, goals } = await c.req.json();

    if (!business_description) {
      return c.json({ error: 'Business description is required' }, 400);
    }

    console.log('[MARKETING AI] Business analysis:', { userId, business_description });

    // Llamar al agente de marketing
    const analysis = await callMarketingAgentAnalysis(business_description, goals);

    // Guardar análisis
    await c.env.DB.prepare(`
      INSERT INTO marketing_ai_analyses (user_id, business_description, goals, analysis, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, business_description, goals || '', analysis).run();

    return c.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('[MARKETING AI] Error in analysis:', error);
    return c.json({ error: 'Failed to analyze business' }, 500);
  }
});

// POST /api/marketing-ai/generate-campaign - Generar campaña de contenido
marketingAI.post('/generate-campaign', async (c) => {
  try {
    const userId = c.get('userId');
    const { topic, platforms, duration_days } = await c.req.json();

    if (!topic || !platforms || !Array.isArray(platforms)) {
      return c.json({ error: 'Topic and platforms are required' }, 400);
    }

    console.log('[MARKETING AI] Campaign generation:', { userId, topic, platforms });

    // Llamar al agente
    const campaign = await callMarketingAgentCampaign(topic, platforms, duration_days || 30);

    // Guardar campaña
    await c.env.DB.prepare(`
      INSERT INTO marketing_ai_campaigns (user_id, topic, platforms, duration_days, campaign, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, topic, JSON.stringify(platforms), duration_days || 30, campaign).run();

    return c.json({
      success: true,
      campaign: campaign
    });

  } catch (error) {
    console.error('[MARKETING AI] Error generating campaign:', error);
    return c.json({ error: 'Failed to generate campaign' }, 500);
  }
});

// POST /api/marketing-ai/analyze-competition - Análisis competitivo
marketingAI.post('/analyze-competition', async (c) => {
  try {
    const userId = c.get('userId');
    const { industry, competitors } = await c.req.json();

    if (!industry || !competitors || !Array.isArray(competitors)) {
      return c.json({ error: 'Industry and competitors are required' }, 400);
    }

    console.log('[MARKETING AI] Competition analysis:', { userId, industry, competitors });

    // Llamar al agente
    const analysis = await callMarketingAgentCompetition(industry, competitors);

    return c.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('[MARKETING AI] Error in competition analysis:', error);
    return c.json({ error: 'Failed to analyze competition' }, 500);
  }
});

// POST /api/marketing-ai/social-strategy - Crear estrategia de redes sociales
marketingAI.post('/social-strategy', async (c) => {
  try {
    const userId = c.get('userId');
    const { brand, target_audience, goals } = await c.req.json();

    if (!brand || !target_audience || !goals) {
      return c.json({ error: 'Brand, target audience and goals are required' }, 400);
    }

    console.log('[MARKETING AI] Social strategy:', { userId, brand });

    // Llamar al agente
    const strategy = await callMarketingAgentSocialStrategy(brand, target_audience, goals);

    return c.json({
      success: true,
      strategy: strategy
    });

  } catch (error) {
    console.error('[MARKETING AI] Error creating social strategy:', error);
    return c.json({ error: 'Failed to create social strategy' }, 500);
  }
});

// ============================================
// GOALS MANAGEMENT FOR MARKETING AGENT
// ============================================

// POST /api/marketing-ai/create-goal - Crear goal desde el agente
marketingAI.post('/create-goal', async (c) => {
  try {
    const userId = c.get('userId');
    const { 
      description, 
      task,
      priority,
      priority_label,
      cadence,
      dri,
      goal_status,
      category,
      week_of
    } = await c.req.json();

    if (!description || !task) {
      return c.json({ error: 'Description and task are required' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO goals (
        user_id, description, task, priority, priority_label, 
        cadence, dri, goal_status, category, week_of, 
        order_index, status
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active') 
      RETURNING *
    `).bind(
      userId,
      description,
      task,
      priority || 'P0',
      priority_label || 'Urgent & important',
      cadence || 'One time',
      dri || 'Giorgio',
      goal_status || 'To start',
      category || 'ASTAR',
      week_of || null
    ).first();

    return c.json({
      success: true,
      goal: result,
      message: `✅ Goal created: ${task}`
    });

  } catch (error) {
    console.error('[MARKETING AI] Error creating goal:', error);
    return c.json({ error: 'Failed to create goal' }, 500);
  }
});

// PUT /api/marketing-ai/update-goal/:id - Actualizar goal desde el agente
marketingAI.put('/update-goal/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const goalId = c.req.param('id');
    const updates = await c.req.json();

    const allowedFields = [
      'description', 'task', 'priority', 'priority_label', 'cadence', 
      'dri', 'goal_status', 'category', 'week_of', 'order_index',
      'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'
    ];

    const updateFields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(goalId, userId);

    await c.env.DB.prepare(`
      UPDATE goals 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    return c.json({
      success: true,
      message: `✅ Goal updated successfully`
    });

  } catch (error) {
    console.error('[MARKETING AI] Error updating goal:', error);
    return c.json({ error: 'Failed to update goal' }, 500);
  }
});

// GET /api/marketing-ai/get-goals - Obtener goals del usuario
marketingAI.get('/get-goals', async (c) => {
  try {
    const userId = c.get('userId');
    const category = c.req.query('category');
    const priority = c.req.query('priority');

    let query = `
      SELECT id, description, task, priority, priority_label, cadence, 
             dri, goal_status, category, week_of, order_index,
             day_mon, day_tue, day_wed, day_thu, day_fri, day_sat, day_sun,
             created_at, updated_at
      FROM goals 
      WHERE user_id = ? AND status = 'active'
    `;

    const params: any[] = [userId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY order_index ASC, priority ASC, created_at DESC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      goals: results || []
    });

  } catch (error) {
    console.error('[MARKETING AI] Error fetching goals:', error);
    return c.json({ error: 'Failed to fetch goals' }, 500);
  }
});

// DELETE /api/marketing-ai/delete-goal/:id - Eliminar goal desde el agente
marketingAI.delete('/delete-goal/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const goalId = c.req.param('id');

    await c.env.DB.prepare(`
      DELETE FROM goals WHERE id = ? AND user_id = ?
    `).bind(goalId, userId).run();

    return c.json({
      success: true,
      message: `✅ Goal deleted successfully`
    });

  } catch (error) {
    console.error('[MARKETING AI] Error deleting goal:', error);
    return c.json({ error: 'Failed to delete goal' }, 500);
  }
});

// ============================================
// FUNCIONES AUXILIARES PARA LLAMAR AL AGENTE
// ============================================

/**
 * Llama al agente de marketing Python (implementar con worker o servicio externo)
 */
async function callMarketingAgent(message: string, context?: string): Promise<string> {
  // TODO: Implementar llamada al servicio Python que ejecuta el agente
  // Por ahora retornamos respuesta de ejemplo
  
  // Opción 1: Llamar a un worker Python en Cloudflare
  // Opción 2: Llamar a un servicio externo (Railway, Render, etc.)
  // Opción 3: Usar API Gateway con Lambda/Function
  
  return `🤖 **Marketing AI Response**

Gracias por tu consulta: "${message}"

📊 **Análisis preliminar:**
He analizado tu mensaje y puedo ayudarte con:
- Estrategias de marketing digital
- Análisis de competencia
- Creación de contenido
- Campañas en redes sociales
- Optimización de conversiones

💡 **Recomendaciones inmediatas:**
1. Define claramente tu audiencia objetivo
2. Analiza a tus principales competidores
3. Establece KPIs medibles
4. Crea un calendario de contenido

¿En qué aspecto específico te gustaría profundizar?

_Nota: Para análisis más profundos, usa las funciones especializadas como "Analizar Negocio" o "Generar Campaña"._`;
}

async function callMarketingAgentAnalysis(business: string, goals?: string): Promise<string> {
  // TODO: Implementar llamada real al agente Python
  return `🎯 **ANÁLISIS COMPLETO DE MARKETING**

**NEGOCIO:** ${business}
**OBJETIVOS:** ${goals || 'Crecimiento general y aumento de visibilidad'}

📊 **1. ANÁLISIS DE MERCADO**
- Mercado objetivo: Empresas B2B/B2C en fase de crecimiento
- Tamaño de mercado: $XXM con crecimiento anual del XX%
- Competencia: Media-Alta
- Barreras de entrada: Moderadas

🎯 **2. ESTRATEGIA RECOMENDADA**
- Content Marketing (40%): Blog, videos, webinars
- Social Media (30%): LinkedIn, Twitter, Instagram
- SEO/SEM (20%): Posicionamiento orgánico y ads
- Email Marketing (10%): Nurturing y conversión

📅 **3. PLAN DE CONTENIDO (30 DÍAS)**
Semana 1: Setup y contenido fundacional
Semana 2-3: Amplificación y engagement
Semana 4: Análisis y optimización

📈 **4. MÉTRICAS Y KPIS**
- CAC: < $XX
- LTV: > $XXX
- Conversion Rate: X-X%
- Engagement Rate: X%

💰 **5. PRESUPUESTO ESTIMADO**
Total: $X,XXX/mes
- Contenido: $XXX
- Ads: $XXX
- Tools: $XXX

🚀 **PRÓXIMOS PASOS:**
1. Configurar analytics
2. Crear calendario de contenido
3. Identificar 5 competidores clave
4. Setup de herramientas básicas`;
}

async function callMarketingAgentCampaign(topic: string, platforms: string[], days: number): Promise<string> {
  const platformList = platforms.join(', ');
  
  return `📅 **CAMPAÑA DE CONTENIDO**

**TEMA:** ${topic}
**PLATAFORMAS:** ${platformList}
**DURACIÓN:** ${days} días

📝 **CALENDARIO SEMANAL:**

**Semana 1: Awareness**
${platforms.map(p => `- ${p}: 3 posts educativos sobre ${topic}`).join('\n')}

**Semana 2: Engagement**
${platforms.map(p => `- ${p}: 2 posts interactivos + 1 caso de estudio`).join('\n')}

**Semana 3: Conversión**
${platforms.map(p => `- ${p}: 2 posts de valor + 1 CTA directo`).join('\n')}

**Semana 4: Análisis**
${platforms.map(p => `- ${p}: 2 posts based on best performers`).join('\n')}

🎯 **ESTRATEGIA DE ENGAGEMENT:**
- Responder a todos los comentarios en < 2h
- Repostear UGC relevante
- Colaboraciones con micro-influencers

📊 **KPIS A MEDIR:**
- Reach total
- Engagement rate
- Click-through rate
- Conversiones

💰 **PRESUPUESTO:** $XXX - $X,XXX`;
}

async function callMarketingAgentCompetition(industry: string, competitors: string[]): Promise<string> {
  return `🏆 **ANÁLISIS COMPETITIVO**

**INDUSTRIA:** ${industry}
**COMPETIDORES:** ${competitors.join(', ')}

${competitors.map((comp, i) => `
**${i + 1}. ${comp}**
📊 Posicionamiento: [Análisis]
💪 Fortalezas: [Lista]
⚠️ Debilidades: [Lista]
📱 Redes Sociales: [Presencia]
💰 Pricing: [Estructura]
`).join('\n')}

💡 **OPORTUNIDADES IDENTIFICADAS:**
1. Gap en servicio/producto X
2. Audiencia desatendida Y
3. Canal infrautilizado Z

🎯 **ESTRATEGIA DE DIFERENCIACIÓN:**
- Propuesta de valor única
- Nicho específico
- Innovación en X

📈 **PRÓXIMOS PASOS:**
1. Profundizar análisis de [Competidor Top]
2. Benchmarking de pricing
3. Análisis de content gaps`;
}

async function callMarketingAgentSocialStrategy(brand: string, audience: string, goals: string): Promise<string> {
  return `📱 **ESTRATEGIA DE REDES SOCIALES**

**MARCA:** ${brand}
**AUDIENCIA:** ${audience}
**OBJETIVOS:** ${goals}

🎯 **PLATAFORMAS PRIORITARIAS:**
1. LinkedIn (B2B, profesionales)
2. Instagram (visuales, engagement)
3. Twitter (thought leadership)

📅 **CALENDARIO MENSUAL:**
- Lunes: Motivacional/Inspiracional
- Martes: Educativo/Tutorial
- Miércoles: Behind the scenes
- Jueves: User Generated Content
- Viernes: Casos de éxito

📝 **TIPOS DE CONTENIDO:**
- 40% Educativo
- 30% Entretenimiento
- 20% Promocional
- 10% Personal/Cultura

🤝 **ESTRATEGIA DE CRECIMIENTO:**
- Hashtag strategy
- Collaboraciones
- Paid amplification
- Community management

📊 **MÉTRICAS:**
- Followers growth: +XX%
- Engagement rate: X%
- Click-through: X%
- Conversions: XX/mes

💰 **PRESUPUESTO:** $XXX/mes`;
}

export default marketingAI;
