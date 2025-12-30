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
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposeHeaders: ['Set-Cookie']
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

// Debug endpoint to check API key status
app.get('/status', jwtMiddleware, async (c) => {
  const hasGroqKey = !!c.env.GROQ_API_KEY;
  const hasOpenAIKey = !!c.env.OPENAI_API_KEY;
  const groqKeyPrefix = c.env.GROQ_API_KEY ? c.env.GROQ_API_KEY.substring(0, 10) + '...' : 'not set';
  
  return c.json({
    ai_enabled: hasGroqKey || hasOpenAIKey,
    groq_configured: hasGroqKey,
    openai_configured: hasOpenAIKey,
    groq_key_preview: groqKeyPrefix,
    message: hasGroqKey ? 'AI is enabled with Groq' : hasOpenAIKey ? 'AI is enabled with OpenAI' : 'AI is disabled - no API key found'
  });
});

// Helper: Get user's startup context (goals + metrics)
async function getStartupContext(db: any, userId: number) {
  console.log('[GET-CONTEXT] Fetching context for user:', userId);
  
  // Get goals
  try {
    console.log('[GET-CONTEXT] Querying goals table...');
    const goalsResult = await db.prepare(`
      SELECT id, description, status, target_value, current_value, deadline, category, created_at
      FROM goals 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();
    
    console.log('[GET-CONTEXT] Goals query result:', goalsResult);
    const goals = goalsResult.results || [];
    console.log('[GET-CONTEXT] Goals count:', goals.length);

    // Get metrics history (last 30 days)
    console.log('[GET-CONTEXT] Querying metrics...');
    const metricsResult = await db.prepare(`
      SELECT metric_name, metric_value, recorded_date
      FROM user_metrics 
      WHERE user_id = ? 
      ORDER BY recorded_date DESC
      LIMIT 60
    `).bind(userId).all();

    const metrics = metricsResult.results || [];
    console.log('[GET-CONTEXT] Metrics count:', metrics.length);

    // Get primary metrics config
    console.log('[GET-CONTEXT] Querying primary metrics...');
    const primaryMetrics = await db.prepare(`
      SELECT metric1_name, metric2_name 
      FROM primary_metrics 
      WHERE user_id = ?
    `).bind(userId).first();

    // Calculate summary stats
    const activeGoals = goals.filter((g: any) => g.status === 'active' || g.status === 'in_progress');
    const completedGoals = goals.filter((g: any) => g.status === 'completed');
    console.log('[GET-CONTEXT] Active goals:', activeGoals.length, 'Completed:', completedGoals.length);
    
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

    console.log('[GET-CONTEXT] Context built successfully');
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
  } catch (error) {
    console.error('[GET-CONTEXT] ERROR:', error);
    console.error('[GET-CONTEXT] Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Helper: Generate AI response using Groq or Cloudflare AI
async function generateAIResponse(apiKey: string, systemPrompt: string, userMessage: string, context: any, cloudflareAI?: any) {
  // Try Cloudflare AI first if available
  if (cloudflareAI) {
    try {
      console.log('[AI] Using Cloudflare Workers AI');
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Contexto de la startup:\n${JSON.stringify(context, null, 2)}\n\nPregunta del usuario: ${userMessage}` }
      ];
      
      const response = await cloudflareAI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages,
        max_tokens: 2000,
        temperature: 0.7
      });
      
      return response.response || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('[AI] Cloudflare AI error:', error);
      // Fall through to Groq
    }
  }
  
  // Try Groq as fallback
  if (apiKey) {
    try {
      console.log('[AI] Using Groq API');
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
        const errorText = await response.text();
        console.error('[AI] Groq API error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.choices[0]?.message?.content || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('[AI] Groq generation error:', error);
      throw error;
    }
  }
  
  throw new Error('No AI provider available');
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

    // Try Groq first, fallback to Cloudflare AI
    const groqKey = c.env.GROQ_API_KEY;
    console.log('[CHAT] GROQ API Key available:', !!groqKey);
    
    let assistantMessage: string;

    try {
      // Generate AI response with function calling capability
      const systemPrompt = `Eres un asistente de marketing y growth para startups llamado "Marketing Agent". 
Tu rol es ayudar a los fundadores a entender y mejorar el crecimiento de su startup.

CAPACIDADES Y ACCIONES QUE PUEDES EJECUTAR:
1. CREAR GOALS: Cuando el usuario mencione un objetivo, créalo automáticamente
   - Responde con: ACTION:CREATE_GOAL|descripción|target_value|category
   - Ejemplo: "Quiero llegar a 1000 usuarios" → ACTION:CREATE_GOAL|Llegar a 1000 usuarios|1000|growth
   
2. REGISTRAR MÉTRICAS: Cuando el usuario mencione números/progreso
   - Responde con: ACTION:ADD_METRIC|metric_name|value
   - Ejemplo: "Tengo 250 usuarios" → ACTION:ADD_METRIC|users|250
   
3. ACTUALIZAR GOALS: Cuando mencionen progreso en un objetivo
   - Responde con: ACTION:UPDATE_GOAL|goal_id|current_value
   
4. ANALIZAR: Dar insights sobre su progreso

CONTEXTO ACTUAL:
- Objetivos: ${context.goals.totalCount} (${context.goals.completedCount} completados)
- Usuarios actuales: ${context.metrics.current.users}
- Revenue actual: $${context.metrics.current.revenue}

REGLAS:
- Si el usuario menciona un objetivo nuevo, SIEMPRE responde con ACTION:CREATE_GOAL
- Si menciona números de usuarios/revenue, SIEMPRE responde con ACTION:ADD_METRIC
- Después de la ACTION, añade un mensaje amigable explicando qué hiciste
- Sé proactivo: sugiere crear goals si no los tiene
- Usa emojis moderadamente (✅ 📊 🎯 📈 💡)
- Responde siempre en español`;

      const aiResponse = await generateAIResponse(groqKey || '', systemPrompt, message, context, c.env.AI);
      assistantMessage = await processAIActions(c.env.DB, user.userId, aiResponse, context);
    } catch (error) {
      console.error('[CHAT] AI error:', error);
      assistantMessage = generateFallbackResponse(message, context);
    }

    // Save assistant response
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, assistantMessage).run();

    return c.json({ message: assistantMessage });

  } catch (error) {
    console.error('[CHAT] Error processing message:', error);
    console.error('[CHAT] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      error: 'Failed to process message',
      message: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Process AI actions (create goals, add metrics, etc.)
async function processAIActions(db: any, userId: number, aiResponse: string, context: any): Promise<string> {
  console.log('[PROCESS-ACTIONS] AI Response:', aiResponse);
  
  const actions = aiResponse.match(/ACTION:([A-Z_]+)\|([^\n]+)/g);
  
  if (!actions || actions.length === 0) {
    return aiResponse;
  }
  
  let responseText = aiResponse;
  let executionResults: string[] = [];
  
  for (const action of actions) {
    const parts = action.replace('ACTION:', '').split('|');
    const actionType = parts[0];
    
    try {
      if (actionType === 'CREATE_GOAL') {
        const [, description, targetValue, category] = parts;
        await db.prepare(`
          INSERT INTO goals (user_id, description, target_value, current_value, category, status)
          VALUES (?, ?, ?, 0, ?, 'active')
        `).bind(userId, description, parseInt(targetValue) || 100, category || 'general').run();
        
        executionResults.push(`✅ Objetivo creado: "${description}"`);
        console.log('[ACTION] Goal created:', description);
      }
      else if (actionType === 'ADD_METRIC') {
        const [, metricName, value] = parts;
        const today = new Date().toISOString().split('T')[0];
        
        await db.prepare(`
          INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
          VALUES (?, ?, ?, ?)
        `).bind(userId, metricName, parseFloat(value), today).run();
        
        executionResults.push(`✅ Métrica registrada: ${metricName} = ${value}`);
        console.log('[ACTION] Metric added:', metricName, value);
      }
      else if (actionType === 'UPDATE_GOAL') {
        const [, goalId, currentValue] = parts;
        await db.prepare(`
          UPDATE goals 
          SET current_value = ?,
              status = CASE WHEN current_value >= target_value THEN 'completed' ELSE status END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(parseInt(currentValue), parseInt(goalId), userId).run();
        
        executionResults.push(`✅ Objetivo actualizado`);
        console.log('[ACTION] Goal updated:', goalId);
      }
    } catch (error) {
      console.error('[ACTION-ERROR]', actionType, error);
      executionResults.push(`❌ Error ejecutando: ${actionType}`);
    }
    
    // Remove action command from response
    responseText = responseText.replace(action, '').trim();
  }
  
  // Add execution results to the response
  if (executionResults.length > 0) {
    return executionResults.join('\n') + '\n\n' + responseText;
  }
  
  return responseText;
}

// Fallback response generator when AI is not available
function generateFallbackResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Check if user wants to create a goal
  if (lowerMessage.includes('añadir') || lowerMessage.includes('crear') || lowerMessage.includes('nuevo objetivo') || lowerMessage.includes('new goal') || (lowerMessage.includes('quiero') && !lowerMessage.includes('analiza'))) {
    return `🎯 **Para activar la IA que crea objetivos automáticamente:**\n\n` +
      `1. Obtén una API key gratis en https://console.groq.com/\n` +
      `2. Añádela a tu proyecto en Cloudflare\n\n` +
      `**Mientras tanto**, puedes:\n` +
      `• Ir a la vista **Traction** en el dashboard\n` +
      `• Hacer clic en "Add Goal"\n` +
      `• Crear tus objetivos manualmente\n\n` +
      `💡 Con la API key configurada, podré crear objetivos solo diciéndome "Quiero llegar a 1000 usuarios"`;
  }
  
  if (lowerMessage.includes('objetivo') || lowerMessage.includes('goal') || lowerMessage.includes('meta') || lowerMessage.includes('analiza')) {
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
  console.log('[ANALYZE-GOALS] Starting analysis for user:', user.userId);

  try {
    console.log('[ANALYZE-GOALS] Fetching startup context...');
    const context = await getStartupContext(c.env.DB, user.userId);
    console.log('[ANALYZE-GOALS] Context fetched:', JSON.stringify(context).substring(0, 200));
    
    const apiKey = c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY;
    console.log('[ANALYZE-GOALS] API Key available:', !!apiKey);

    let analysis: string;

    if (!apiKey) {
      console.log('[ANALYZE-GOALS] Using fallback response (no API key)');
      analysis = generateFallbackResponse('analiza mis objetivos', context);
    } else {
      console.log('[ANALYZE-GOALS] Generating AI response...');
      const systemPrompt = `Eres un analista de startups experto. Analiza los objetivos del usuario y proporciona:
1. Estado actual de cada objetivo con porcentaje de progreso
2. Qué objetivos están en riesgo de no completarse
3. Recomendaciones específicas para mejorar
4. Priorización sugerida

Responde en español, sé específico y usa los datos proporcionados.`;

      try {
        analysis = await generateAIResponse(apiKey, systemPrompt, 'Analiza mis objetivos y dame recomendaciones', context);
        console.log('[ANALYZE-GOALS] AI response generated successfully');
      } catch (aiError) {
        console.error('[ANALYZE-GOALS] AI generation failed:', aiError);
        analysis = generateFallbackResponse('analiza mis objetivos', context);
      }
    }

    // Save to chat history
    console.log('[ANALYZE-GOALS] Saving to chat history...');
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, 'Analiza mis objetivos').run();

    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, analysis).run();

    console.log('[ANALYZE-GOALS] Success, returning analysis');
    return c.json({ analysis });
  } catch (error) {
    console.error('[ANALYZE-GOALS] ERROR:', error);
    console.error('[ANALYZE-GOALS] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[ANALYZE-GOALS] Error message:', error instanceof Error ? error.message : String(error));
    return c.json({ 
      error: 'Failed to analyze goals',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Generate marketing plan
app.post('/marketing-plan', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const body = await c.req.json().catch(() => ({}));
  const { timeframe } = body;

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
  const body = await c.req.json().catch(() => ({}));
  const { platform, quantity } = body;

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
  const body = await c.req.json().catch(() => ({}));
  const { competitors, industry } = body;

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
