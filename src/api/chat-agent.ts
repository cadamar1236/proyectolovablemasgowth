import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import type { Bindings, AuthContext } from '../types';

type Variables = {
  user: AuthContext;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS with credentials
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// JWT middleware
const jwtMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as AuthContext;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Helper: Get user's startup context (goals + metrics)
async function getStartupContext(db: any, userId: number) {
  // Get goals
  const goalsResult = await db.prepare(`
    SELECT id, description, status, target_value, current_value, deadline, category, created_at
    FROM goals 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(userId).all();

  const goals = goalsResult.results || [];

  // Get metrics history (last 30 days)
  const metricsResult = await db.prepare(`
    SELECT metric_name, metric_value, recorded_date
    FROM user_metrics 
    WHERE user_id = ? 
    ORDER BY recorded_date DESC
    LIMIT 60
  `).bind(userId).all();

  const metrics = metricsResult.results || [];

  // Get primary metrics config
  const primaryMetrics = await db.prepare(`
    SELECT metric1_name, metric2_name 
    FROM primary_metrics 
    WHERE user_id = ?
  `).bind(userId).first();

  // Calculate summary stats
  const activeGoals = goals.filter((g: any) => g.status === 'active' || g.status === 'in_progress');
  const completedGoals = goals.filter((g: any) => g.status === 'completed');
  
  // Get latest metrics values
  const latestUsers = metrics.find((m: any) => m.metric_name === 'users')?.metric_value || 0;
  const latestRevenue = metrics.find((m: any) => m.metric_name === 'revenue')?.metric_value || 0;

  // Calculate growth (compare last two entries)
  const userMetrics = metrics.filter((m: any) => m.metric_name === 'users');
  const revenueMetrics = metrics.filter((m: any) => m.metric_name === 'revenue');
  
  const userGrowth = userMetrics.length >= 2 
    ? ((userMetrics[0].metric_value - userMetrics[1].metric_value) / (userMetrics[1].metric_value || 1) * 100).toFixed(1)
    : 0;
  
  const revenueGrowth = revenueMetrics.length >= 2
    ? ((revenueMetrics[0].metric_value - revenueMetrics[1].metric_value) / (revenueMetrics[1].metric_value || 1) * 100).toFixed(1)
    : 0;

  return {
    goals: {
      all: goals,
      active: activeGoals,
      completed: completedGoals,
      totalCount: goals.length,
      completedCount: completedGoals.length,
      completionRate: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0
    },
    metrics: {
      current: {
        users: latestUsers,
        revenue: latestRevenue
      },
      growth: {
        users: userGrowth,
        revenue: revenueGrowth
      },
      history: metrics,
      primaryConfig: primaryMetrics || { metric1_name: 'users', metric2_name: 'revenue' }
    },
    summary: `
      Startup tiene ${goals.length} objetivos (${completedGoals.length} completados, ${activeGoals.length} activos).
      Métricas actuales: ${latestUsers} usuarios, $${latestRevenue} revenue.
      Crecimiento: ${userGrowth}% usuarios, ${revenueGrowth}% revenue.
    `
  };
}

// Helper: Generate AI response using Groq
async function generateAIResponse(apiKey: string, systemPrompt: string, userMessage: string, context: any) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Contexto de la startup:\n${JSON.stringify(context, null, 2)}\n\nPregunta del usuario: ${userMessage}` }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices[0]?.message?.content || 'No pude generar una respuesta.';
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

// Get chat history
app.get('/history', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    const messages = await c.env.DB.prepare(`
      SELECT id, role, content, created_at FROM agent_chat_messages
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 50
    `).bind(user.userId).all();

    return c.json({
      messages: messages.results.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return c.json({ messages: [] });
  }
});

// Send message and get AI response
app.post('/message', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { message } = await c.req.json();

  if (!message?.trim()) {
    return c.json({ error: 'Message is required' }, 400);
  }

  try {
    // Save user message
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, message).run();

    // Get startup context
    const context = await getStartupContext(c.env.DB, user.userId);

    // Check if API key is available
    const apiKey = c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY;
    
    let assistantMessage: string;

    if (!apiKey) {
      // Fallback response without AI
      assistantMessage = generateFallbackResponse(message, context);
    } else {
      // Generate AI response
      const systemPrompt = `Eres un asistente de marketing y growth para startups llamado "Marketing Agent". 
Tu rol es ayudar a los fundadores a entender y mejorar el crecimiento de su startup.

CAPACIDADES:
- Analizar objetivos y progreso de la startup
- Dar recomendaciones de marketing basadas en métricas reales
- Sugerir estrategias de crecimiento
- Ayudar a definir y priorizar objetivos
- Explicar métricas y tendencias

REGLAS:
- Responde siempre en español
- Sé conciso pero útil
- Usa los datos reales del contexto proporcionado
- Si no hay suficientes datos, sugiere al usuario que registre más métricas
- Usa emojis moderadamente para hacer la conversación más amigable
- Cuando analices objetivos, menciona específicamente cuáles y su progreso`;

      try {
        assistantMessage = await generateAIResponse(apiKey, systemPrompt, message, context);
      } catch (error) {
        assistantMessage = generateFallbackResponse(message, context);
      }
    }

    // Save assistant response
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, assistantMessage).run();

    return c.json({ message: assistantMessage });

  } catch (error) {
    console.error('Error processing message:', error);
    return c.json({ 
      message: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.' 
    }, 500);
  }
});

// Fallback response generator when AI is not available
function generateFallbackResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('objetivo') || lowerMessage.includes('goal') || lowerMessage.includes('meta')) {
    const { goals } = context;
    if (goals.totalCount === 0) {
      return `📊 No tienes objetivos registrados aún.\n\n💡 Te recomiendo crear tu primer objetivo. Ve a la sección de Traction y añade objetivos como:\n- Conseguir X usuarios\n- Alcanzar $X en revenue\n- Lanzar X feature`;
    }
    
    let response = `📊 **Análisis de tus objetivos:**\n\n`;
    response += `• Total: ${goals.totalCount} objetivos\n`;
    response += `• Completados: ${goals.completedCount} (${goals.completionRate}%)\n`;
    response += `• Activos: ${goals.active.length}\n\n`;
    
    if (goals.active.length > 0) {
      response += `**Objetivos activos:**\n`;
      goals.active.slice(0, 5).forEach((g: any, i: number) => {
        const progress = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
        response += `${i + 1}. ${g.description} - ${progress}% (${g.current_value}/${g.target_value})\n`;
      });
    }
    
    return response;
  }
  
  if (lowerMessage.includes('métrica') || lowerMessage.includes('metric') || lowerMessage.includes('crecimiento') || lowerMessage.includes('growth')) {
    const { metrics } = context;
    let response = `📈 **Resumen de métricas:**\n\n`;
    response += `• Usuarios actuales: ${metrics.current.users}\n`;
    response += `• Revenue actual: $${metrics.current.revenue}\n`;
    response += `• Crecimiento usuarios: ${metrics.growth.users}%\n`;
    response += `• Crecimiento revenue: ${metrics.growth.revenue}%\n`;
    
    if (metrics.history.length < 2) {
      response += `\n💡 Tip: Registra métricas regularmente para ver tendencias de crecimiento.`;
    }
    
    return response;
  }
  
  if (lowerMessage.includes('marketing') || lowerMessage.includes('plan')) {
    return `🚀 **Recomendaciones de Marketing:**\n\n` +
      `Basado en tus ${context.goals.totalCount} objetivos y ${context.metrics.current.users} usuarios:\n\n` +
      `1. **Content Marketing**: Crea contenido que resuelva problemas de tus usuarios\n` +
      `2. **Social Proof**: Comparte testimonios y casos de éxito\n` +
      `3. **Referidos**: Implementa un programa de referidos\n` +
      `4. **SEO**: Optimiza tu presencia en buscadores\n\n` +
      `💡 ¿Quieres que profundice en alguna estrategia específica?`;
  }
  
  // Default response
  return `👋 ¡Hola! Soy tu Marketing Agent.\n\n` +
    `Puedo ayudarte con:\n` +
    `• 📊 Analizar tus objetivos\n` +
    `• 📈 Revisar tus métricas de crecimiento\n` +
    `• 🎯 Crear planes de marketing\n` +
    `• 💡 Generar ideas de contenido\n\n` +
    `**Tu resumen actual:**\n` +
    `• ${context.goals.totalCount} objetivos (${context.goals.completionRate}% completados)\n` +
    `• ${context.metrics.current.users} usuarios, $${context.metrics.current.revenue} revenue\n\n` +
    `¿En qué te puedo ayudar?`;
}

// Analyze goals endpoint
app.post('/analyze-goals', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;

  try {
    const context = await getStartupContext(c.env.DB, user.userId);
    const apiKey = c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY;

    let analysis: string;

    if (!apiKey) {
      analysis = generateFallbackResponse('analiza mis objetivos', context);
    } else {
      const systemPrompt = `Eres un analista de startups experto. Analiza los objetivos del usuario y proporciona:
1. Estado actual de cada objetivo con porcentaje de progreso
2. Qué objetivos están en riesgo de no completarse
3. Recomendaciones específicas para mejorar
4. Priorización sugerida

Responde en español, sé específico y usa los datos proporcionados.`;

      analysis = await generateAIResponse(apiKey, systemPrompt, 'Analiza mis objetivos y dame recomendaciones', context);
    }

    // Save to chat history
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, 'Analiza mis objetivos').run();

    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, analysis).run();

    return c.json({ analysis });
  } catch (error) {
    console.error('Error analyzing goals:', error);
    return c.json({ error: 'Failed to analyze goals' }, 500);
  }
});

// Generate marketing plan
app.post('/marketing-plan', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { timeframe } = await c.req.json();

  try {
    const context = await getStartupContext(c.env.DB, user.userId);
    const apiKey = c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY;

    let plan: string;

    if (!apiKey) {
      plan = `🎯 **Plan de Marketing - ${timeframe || '30 días'}**\n\n` +
        `Basado en tus métricas actuales (${context.metrics.current.users} usuarios):\n\n` +
        `**Semana 1-2: Fundamentos**\n` +
        `• Optimizar landing page\n` +
        `• Crear 3 piezas de contenido de valor\n\n` +
        `**Semana 3-4: Crecimiento**\n` +
        `• Lanzar campaña de referidos\n` +
        `• Activar presencia en redes sociales\n\n` +
        `💡 Registra más métricas para un plan más personalizado.`;
    } else {
      const systemPrompt = `Eres un estratega de marketing para startups. Genera un plan de marketing detallado para ${timeframe || '30 días'}.

El plan debe incluir:
1. Objetivos específicos y medibles
2. Estrategias semana por semana
3. Canales recomendados
4. Métricas a trackear
5. Quick wins para resultados inmediatos

Basa el plan en los datos reales de la startup. Responde en español.`;

      plan = await generateAIResponse(apiKey, systemPrompt, `Genera un plan de marketing para ${timeframe}`, context);
    }

    // Save to chat history
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, `Genera un plan de marketing para ${timeframe || '30 días'}`).run();

    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, plan).run();

    return c.json({ plan });
  } catch (error) {
    console.error('Error generating marketing plan:', error);
    return c.json({ error: 'Failed to generate marketing plan' }, 500);
  }
});

// Generate content ideas
app.post('/content-ideas', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { platform, quantity } = await c.req.json();

  try {
    const context = await getStartupContext(c.env.DB, user.userId);
    const apiKey = c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY;

    let ideas: string;

    if (!apiKey) {
      ideas = `💡 **Ideas de Contenido para ${platform || 'Redes Sociales'}**\n\n` +
        `1. Behind the scenes de tu startup\n` +
        `2. Caso de éxito de un usuario\n` +
        `3. Tips relacionados con tu industria\n` +
        `4. Tu historia como fundador\n` +
        `5. Lecciones aprendidas\n` +
        `6. Comparativa con alternativas\n` +
        `7. Tutorial de tu producto\n` +
        `8. Preguntas frecuentes respondidas\n` +
        `9. Tendencias del mercado\n` +
        `10. Celebración de milestone\n\n` +
        `💡 Configura la API de Groq para ideas más personalizadas.`;
    } else {
      const systemPrompt = `Eres un experto en content marketing. Genera ${quantity || 10} ideas de contenido para ${platform || 'redes sociales'}.

Para cada idea incluye:
- Título/Hook llamativo
- Formato sugerido (post, video, carrusel, etc.)
- Por qué funcionará

Basa las ideas en el contexto de la startup. Responde en español.`;

      ideas = await generateAIResponse(apiKey, systemPrompt, `Dame ${quantity || 10} ideas de contenido`, context);
    }

    // Save to chat history
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, `Dame ${quantity || 10} ideas de contenido para ${platform || 'redes sociales'}`).run();

    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, ideas).run();

    return c.json({ ideas });
  } catch (error) {
    console.error('Error generating content ideas:', error);
    return c.json({ error: 'Failed to generate content ideas' }, 500);
  }
});

// Analyze competition
app.post('/competition-analysis', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { competitors, industry } = await c.req.json();

  try {
    const context = await getStartupContext(c.env.DB, user.userId);
    const apiKey = c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY;

    let analysis: string;

    if (!apiKey) {
      analysis = `🎯 **Análisis Competitivo**\n\n` +
        `Para un análisis detallado de tu competencia, necesito:\n\n` +
        `1. **Nombres de competidores**: Menciónalos en tu mensaje\n` +
        `2. **Tu industria**: Describe tu mercado\n\n` +
        `**Framework de análisis que uso:**\n` +
        `• Posicionamiento en el mercado\n` +
        `• Propuesta de valor única\n` +
        `• Estrategias de pricing\n` +
        `• Canales de adquisición\n` +
        `• Fortalezas y debilidades\n\n` +
        `💡 Configura la API de Groq para un análisis más profundo.`;
    } else {
      const systemPrompt = `Eres un analista de mercado experto. Realiza un análisis competitivo considerando:

1. Posicionamiento de mercado
2. Propuestas de valor comparadas
3. Estrategias de pricing
4. Canales de marketing utilizados
5. Oportunidades de diferenciación
6. Amenazas a considerar
7. Recomendaciones estratégicas

${competitors?.length ? `Competidores mencionados: ${competitors.join(', ')}` : 'El usuario no mencionó competidores específicos, da recomendaciones generales.'}
${industry ? `Industria: ${industry}` : ''}

Responde en español con análisis accionable.`;

      analysis = await generateAIResponse(apiKey, systemPrompt, 'Analiza mi competencia', context);
    }

    // Save to chat history
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, 'Analiza la competencia en mi industria').run();

    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, analysis).run();

    return c.json({ analysis });
  } catch (error) {
    console.error('Error analyzing competition:', error);
    return c.json({ error: 'Failed to analyze competition' }, 500);
  }
});

// Clear chat history
app.delete('/history', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;

  try {
    await c.env.DB.prepare(`
      DELETE FROM agent_chat_messages WHERE user_id = ?
    `).bind(user.userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return c.json({ error: 'Failed to clear chat history' }, 500);
  }
});

// Get startup summary (for chatbot context display)
app.get('/startup-summary', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;

  try {
    const context = await getStartupContext(c.env.DB, user.userId);
    return c.json(context);
  } catch (error) {
    console.error('Error getting startup summary:', error);
    return c.json({ error: 'Failed to get startup summary' }, 500);
  }
});

export default app;
