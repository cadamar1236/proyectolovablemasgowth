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
async function generateAIResponse(apiKey: string, systemPrompt: string, userMessage: string, context: any, cloudflareAI?: any, chatHistory: any[] = []) {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 25000; // 25 seconds timeout for mobile
  
  // Simplify context for mobile/slow connections
  const simplifiedContext = {
    goals: {
      totalCount: context.goals.totalCount,
      completedCount: context.goals.completedCount,
      active: context.goals.active.slice(0, 5) // Only first 5 active goals
    },
    metrics: {
      current: context.metrics.current,
      growth: context.metrics.growth
    }
  };

  // Build conversation history for context (last 10 messages)
  const recentHistory = chatHistory.slice(-10);
  console.log('[AI] Using conversation history:', recentHistory.length, 'messages');
  
  // Try Cloudflare AI first if available
  if (cloudflareAI) {
    try {
      console.log('[AI] Using Cloudflare Workers AI');
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: `Contexto: ${JSON.stringify(simplifiedContext)}\n\nPregunta: ${userMessage}` }
      ];
      
      const response = await cloudflareAI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages,
        max_tokens: 1500,
        temperature: 0.7
      });
      
      return response.response || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('[AI] Cloudflare AI error:', error);
      // Fall through to Groq
    }
  }
  
  // Try Groq with retry logic
  if (apiKey) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[AI] Using Groq API (attempt ${attempt}/${MAX_RETRIES})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
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
              ...recentHistory.map((msg: any) => ({ role: msg.role, content: msg.content })),
              { role: 'user', content: `Contexto: ${JSON.stringify(simplifiedContext)}\n\nPregunta: ${userMessage}` }
            ],
            max_tokens: 1500,
            temperature: 0.7
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AI] Groq API error:', response.status, errorText);
          
          if (attempt < MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
            // Retry on rate limit or server errors
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json() as any;
        console.log('[AI] Groq response received successfully');
        return data.choices[0]?.message?.content || 'No pude generar una respuesta.';
        
      } catch (error: any) {
        console.error(`[AI] Groq attempt ${attempt} error:`, error);
        
        if (error.name === 'AbortError') {
          console.log('[AI] Request timed out');
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
        
        if (attempt >= MAX_RETRIES) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  console.error('[AI] All AI providers failed, using fallback');
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
  const { message, useMetricsAgent, useBrandAgent, websiteUrl, industry, stage } = await c.req.json();

  if (!message?.trim()) {
    return c.json({ error: 'Message is required' }, 400);
  }

  try {
    // Guardar mensaje del usuario
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, message).run();

    const railwayUrl = c.env.RAILWAY_API_URL || 'http://localhost:5000';
    console.log('[CHAT] Railway URL configured as:', railwayUrl);

    // Si se solicita el brand marketing agent
    if (useBrandAgent && websiteUrl) {
      console.log('[CHAT] Delegating to Brand Marketing Agent on Railway...');
      console.log('[CHAT] Website URL:', websiteUrl);
      console.log('[CHAT] Target URL:', `${railwayUrl}/api/agents/brand/analyze`);
      
      // Verificar si Railway está configurado
      if (railwayUrl.includes('your-railway-app') || railwayUrl === 'http://localhost:5000') {
        console.error('[CHAT] Railway URL not configured! Using placeholder.');
        const errorMsg = '⚠️ **Railway no está configurado**\n\nPara usar el agente de marketing, necesitas:\n1. Ir a Cloudflare Dashboard\n2. Configurar `RAILWAY_API_URL` en Variables de Entorno\n3. Ver `CONFIGURAR_RAILWAY_URL.md` para instrucciones\n\n💡 Mientras tanto, usa el botón "💬 Chat" para preguntas generales.';
        
        await c.env.DB.prepare(`
          INSERT INTO agent_chat_messages (user_id, role, content, created_at)
          VALUES (?, 'assistant', ?, datetime('now'))
        `).bind(user.userId, errorMsg).run();
        
        return c.json({ message: errorMsg });
      }
      
      try {
        // Llamar al brand agent en Railway
        const agentResponse = await fetch(`${railwayUrl}/api/agents/brand/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            website_url: websiteUrl,
            custom_prompt: message
          })
        });

        console.log('[CHAT] Railway response status:', agentResponse.status);

        if (agentResponse.ok) {
          const result = await agentResponse.json();
          console.log('[CHAT] Railway response:', result);
          
          if (result.success && result.response) {
            // Formatear respuesta bonita
            const formattedResponse = `🎨 **ANÁLISIS DE MARCA**\n\n${result.response}\n\n---\n*Análisis generado por ASTAR* Brand Marketing Agent 🚀*`;
            
            await c.env.DB.prepare(`
              INSERT INTO agent_chat_messages (user_id, role, content, created_at)
              VALUES (?, 'assistant', ?, datetime('now'))
            `).bind(user.userId, formattedResponse).run();

            return c.json({ message: formattedResponse });
          } else {
            throw new Error(result.error || 'Agent returned no response');
          }
        } else {
          const errorText = await agentResponse.text();
          console.error('[CHAT] Railway API error response:', errorText);
          throw new Error(`Railway API error: ${agentResponse.status} - ${errorText}`);
        }
      } catch (brandError) {
        console.error('[CHAT] Error calling Railway brand agent:', brandError);
        
        const errorMsg = `⚠️ **Error conectando con Railway**\n\n**Detalles técnicos:**\n${brandError instanceof Error ? brandError.message : String(brandError)}\n\n**Posibles causas:**\n1. Railway no está corriendo\n2. La URL está mal configurada\n3. El endpoint no existe\n\n💡 **Solución:** Verifica \`CONFIGURAR_RAILWAY_URL.md\``;
        
        await c.env.DB.prepare(`
          INSERT INTO agent_chat_messages (user_id, role, content, created_at)
          VALUES (?, 'assistant', ?, datetime('now'))
        `).bind(user.userId, errorMsg).run();
        
        return c.json({ message: errorMsg });
      }
    }

    // Si se solicita el metrics agent
    if (useMetricsAgent) {
      console.log('[CHAT] Delegating to Metrics Agent on Railway...');
      console.log('[CHAT] Target URL:', `${railwayUrl}/api/agents/metrics/chat`);
      
      // Verificar si Railway está configurado
      if (railwayUrl.includes('your-railway-app') || railwayUrl === 'http://localhost:5000') {
        console.error('[CHAT] Railway URL not configured!');
        const errorMsg = '⚠️ **Railway no está configurado**\n\nPara usar el agente de métricas, configura `RAILWAY_API_URL` en Cloudflare.\n\nVer `CONFIGURAR_RAILWAY_URL.md` para instrucciones.';
        
        await c.env.DB.prepare(`
          INSERT INTO agent_chat_messages (user_id, role, content, created_at)
          VALUES (?, 'assistant', ?, datetime('now'))
        `).bind(user.userId, errorMsg).run();
        
        return c.json({ message: errorMsg });
      }
      
      try {
        // Llamar al metrics agent en Railway
        const agentResponse = await fetch(`${railwayUrl}/api/agents/metrics/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.userId,
            message: message,
            session_id: `chat_${user.userId}_${Date.now()}`,
            industry: industry || 'SaaS',
            stage: stage || 'seed'
          })
        });

        console.log('[CHAT] Metrics agent response status:', agentResponse.status);

        if (agentResponse.ok) {
          const result = await agentResponse.json();
          console.log('[CHAT] Metrics agent response:', result);
          
          if (result.success && result.response) {
            // Formatear respuesta bonita con emojis
            const formattedResponse = `📊 **ANÁLISIS DE MÉTRICAS**\n\n${result.response}\n\n---\n*Análisis generado por ASTAR* Metrics Agent 📈*`;
            
            await c.env.DB.prepare(`
              INSERT INTO agent_chat_messages (user_id, role, content, created_at)
              VALUES (?, 'assistant', ?, datetime('now'))
            `).bind(user.userId, formattedResponse).run();

            return c.json({ message: formattedResponse });
          } else {
            throw new Error(result.error || 'Agent returned no response');
          }
        } else {
          const errorText = await agentResponse.text();
          console.error('[CHAT] Metrics API error response:', errorText);
          throw new Error(`Railway API error: ${agentResponse.status} - ${errorText}`);
        }
      } catch (metricsError) {
        console.error('[CHAT] Error calling Railway metrics agent:', metricsError);
        
        const errorMsg = `⚠️ **Error conectando con Metrics Agent**\n\n**Detalles:**\n${metricsError instanceof Error ? metricsError.message : String(metricsError)}\n\n💡 Verifica \`CONFIGURAR_RAILWAY_URL.md\``;
        
        await c.env.DB.prepare(`
          INSERT INTO agent_chat_messages (user_id, role, content, created_at)
          VALUES (?, 'assistant', ?, datetime('now'))
        `).bind(user.userId, errorMsg).run();
        
        return c.json({ message: errorMsg });
      }
    }

    // Flujo normal del chat agent
    // Save user message
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, message).run();

    // Retrieve chat history (last 50 messages)
    const historyResult = await c.env.DB.prepare(`
      SELECT role, content, created_at 
      FROM agent_chat_messages 
      WHERE user_id = ?
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(user.userId).all();
    
    // Reverse to chronological order (oldest first)
    const chatHistory = (historyResult.results || []).reverse();
    console.log('[CHAT] Retrieved chat history:', chatHistory.length, 'messages');

    // Get startup context
    const context = await getStartupContext(c.env.DB, user.userId);

    // Try Groq first, fallback to Cloudflare AI
    const groqKey = c.env.GROQ_API_KEY;
    console.log('[CHAT] GROQ API Key available:', !!groqKey);
    
    let assistantMessage: string;

    try {
      // Generate AI response with function calling capability
      const systemPrompt = `Eres ASTAR* Agent 🚀, un asistente de growth inteligente y carismático para startups.

Tu personalidad es entusiasta, directa y motivadora. Usas emojis de forma estratégica y estructuras tus respuestas con formato markdown para que sean fáciles de leer.

ESTILO DE RESPUESTA:
- Usa **negritas** para resaltar puntos clave
- Usa emojis relevantes (📊 📈 💡 🎯 ✨ 🚀)
- Organiza con bullet points o listas numeradas
- Añade secciones con ### títulos cuando sea apropiado
- Sé conciso pero completo
- Termina con una pregunta o call-to-action cuando sea apropiado

FORMATO EJEMPLO:
### 📊 Análisis de tus Métricas

Aquí está lo que he encontrado:

**Estado Actual:**
- ✅ Objetivo 1: En progreso (75%)
- 🎯 Objetivo 2: Pendiente

**Recomendaciones:**
1. Enfócate en...
2. Te sugiero...

💡 **Próximo paso:** [acción específica]

---

ACCIONES DISPONIBLES:
1. ACTION:ADD_METRIC|metric_name|value - Registrar métricas
2. ACTION:UPDATE_GOAL|goal_id|value - Actualizar progreso de objetivo
3. ACTION:UPDATE_GOAL_STATUS|goal_id|status - Cambiar estado (active, completed, in_progress)
4. ACTION:UPDATE_GOAL_DESCRIPTION|goal_id|new_description - Cambiar descripción
5. ACTION:UPDATE_GOAL_DEADLINE|goal_id|new_deadline - Cambiar fecha límite (YYYY-MM-DD)
6. ACTION:UPDATE_GOAL_CATEGORY|goal_id|new_category - Cambiar categoría/importancia
7. ACTION:COMPLETE_GOAL|goal_id - Marcar objetivo como completado
8. ACTION:DELETE_GOAL|goal_id - Eliminar objetivo
9. ACTION:FETCH_LEADERBOARD|global - Ver leaderboard de startups
10. ACTION:FETCH_LEADERBOARD|goals - Ver leaderboard de objetivos
11. ACTION:FETCH_LEADERBOARD|competitions - Ver competiciones activas

DETECCIÓN DE INTENCIONES:

**CREAR GOAL:**
Si dice: "crear goal", "añadir goal", "nuevo objetivo"
→ Responde: "TRIGGER:START_GOAL_FLOW"

**EDITAR/VER GOALS:**
Si dice: "editar goal", "modificar objetivo", "ver mis objetivos", "lista de goals"
→ Muestra lista formateada:
🎯 **Tus Objetivos:**

${context.goals.all.map((g: any, i: number) => `${i+1}. **[ID: ${g.id}]** ${g.description || g.task}
   • Estado: ${g.status === 'completed' ? '✅ Completado' : g.status === 'in_progress' ? '🔄 En Progreso' : '⏳ Pendiente'}
   • Progreso: ${g.current_value || 0}/${g.target_value || 100}
   • Categoría: ${g.category || 'general'}`).join('\n\n')}

Dime el ID del objetivo que quieres modificar y qué quieres cambiar.

⚡ **EDICIÓN RÁPIDA DE GOALS:**
REGLA: Cuando el usuario pida editar/completar/eliminar un goal, ejecuta la acción INMEDIATAMENTE y responde SOLO con un emoji. NO des explicaciones.

Ejemplos:
- "completar objetivo 5" → ACTION:COMPLETE_GOAL|5 → Responde solo: "🎉"
- "cambiar descripción del 3 a nueva desc" → ACTION:UPDATE_GOAL_DESCRIPTION|3|nueva desc → Solo: "📝"  
- "poner el 2 en progreso" → ACTION:UPDATE_GOAL_STATUS|2|in_progress → Solo: "🔄"
- "eliminar goal 7" → ACTION:DELETE_GOAL|7 → Solo: "🗑️"
- "cambiar deadline del 4 a 2026-02-15" → ACTION:UPDATE_GOAL_DEADLINE|4|2026-02-15 → Solo: "📅"
- "cambiar categoría del 6 a high" → ACTION:UPDATE_GOAL_CATEGORY|6|high → Solo: "🔥"
- "actualizar progreso del 1 a 75" → ACTION:UPDATE_GOAL|1|75 → Solo: "✅"

**CONSULTAR LEADERBOARDS:**
Si menciona: "leaderboard", "ranking", "posición"
→ Responde: ACTION:FETCH_LEADERBOARD|global

**ANÁLISIS DE MÉTRICAS:**
Menciona el botón "📊 Analizar Objetivos" para análisis con Metrics Agent.

**PLAN DE MARKETING:**
Menciona el botón "🎨 Plan de Marketing" para Brand Marketing Agent.

CONTEXTO DEL USUARIO:

📋 **Objetivos:**
${context.goals.all.map((g: any, i: number) => `${i+1}. [ID: ${g.id}] ${g.task || g.description} - ${g.status || 'active'} - ${g.current_value || 0}/${g.target_value || 100}`).join('\n')}

📊 **Métricas Actuales:**
- Usuarios: ${context.metrics.current.users}
- Revenue: $${context.metrics.current.revenue}
- Total de objetivos: ${context.goals.totalCount}
- Completados: ${context.goals.completedCount} (${context.goals.completionRate}%)

REGLAS:
- Responde en español 🇪🇸
- Sé motivador y positivo ✨
- Estructura tus respuestas con markdown
- Usa emojis moderadamente pero estratégicamente
- Verifica que el ID del objetivo existe antes de ejecutar acciones
- Las acciones ACTION: deben ir al inicio de la respuesta`;

      const aiResponse = await generateAIResponse(groqKey || '', systemPrompt, message, context, c.env.AI, chatHistory);
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
    console.error('[CHAT] Error name:', error instanceof Error ? error.name : 'Unknown');
    
    // Determine error type for better user messaging
    let userMessage = 'Lo siento, ocurrió un error. Por favor intenta de nuevo.';
    let errorType = 'unknown';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        userMessage = 'La respuesta tardó demasiado. Intenta con una pregunta más corta.';
        errorType = 'timeout';
      } else if (error.message.includes('429')) {
        userMessage = 'Muchas solicitudes. Espera un momento e intenta de nuevo.';
        errorType = 'rate_limit';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Problema de conexión. Verifica tu internet e intenta de nuevo.';
        errorType = 'network';
      }
    }
    
    return c.json({ 
      error: 'Failed to process message',
      errorType,
      message: userMessage,
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Determine category for a goal using AI
app.post('/determine-category', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { description, task } = await c.req.json();

  if (!description || !task) {
    return c.json({ category: 'OTHER' });
  }

  try {
    const groqKey = c.env.GROQ_API_KEY;
    
    if (!groqKey) {
      // Fallback: simple keyword matching
      const text = `${description} ${task}`.toLowerCase();
      if (text.includes('astar') || text.includes('blockchain') || text.includes('web3')) {
        return c.json({ category: 'ASTAR' });
      } else if (text.includes('magcient') || text.includes('ai') || text.includes('machine learning')) {
        return c.json({ category: 'MAGCIENT' });
      }
      return c.json({ category: 'OTHER' });
    }

    // Use AI to determine category
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: `Eres un clasificador de goals para startups. Debes clasificar cada goal en una de estas 3 categorías:

- ASTAR: Todo lo relacionado con blockchain, web3, Astar Network, smart contracts, DeFi, NFTs, crypto
- MAGCIENT: Todo lo relacionado con IA, Machine Learning, automation, data science, AI agents, LLMs
- OTHER: Todo lo demás (marketing, ventas, producto, operaciones, finanzas, etc.)

Responde SOLO con una palabra: ASTAR, MAGCIENT u OTHER.`
          },
          { 
            role: 'user', 
            content: `Descripción: ${description}\nTarea: ${task}\n\n¿Categoría?` 
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      return c.json({ category: 'OTHER' });
    }

    const data = await response.json() as any;
    const category = data.choices[0]?.message?.content?.trim().toUpperCase() || 'OTHER';
    
    // Validate category
    if (['ASTAR', 'MAGCIENT', 'OTHER'].includes(category)) {
      return c.json({ category });
    }
    
    return c.json({ category: 'OTHER' });

  } catch (error) {
    console.error('[DETERMINE-CATEGORY] Error:', error);
    return c.json({ category: 'OTHER' });
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
      else if (actionType === 'UPDATE_GOAL_STATUS') {
        const [, goalId, status] = parts;
        const validStatuses = ['active', 'completed', 'in_progress'];
        
        if (!validStatuses.includes(status)) {
          executionResults.push(`❌ Estado inválido. Usa: active, completed, in_progress`);
        } else {
          await db.prepare(`
            UPDATE goals 
            SET status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
          `).bind(status, parseInt(goalId), userId).run();
          
          const statusEmoji = status === 'completed' ? '✅' : status === 'in_progress' ? '🔄' : '⏳';
          executionResults.push(`${statusEmoji}`);
          console.log('[ACTION] Goal status updated:', goalId, status);
        }
      }
      else if (actionType === 'UPDATE_GOAL_DESCRIPTION') {
        const [, goalId, ...descParts] = parts;
        const newDescription = descParts.join('|');
        
        await db.prepare(`
          UPDATE goals 
          SET description = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(newDescription, parseInt(goalId), userId).run();
        
        executionResults.push(`📝`);
        console.log('[ACTION] Goal description updated:', goalId);
      }
      else if (actionType === 'UPDATE_GOAL_DEADLINE') {
        const [, goalId, deadline] = parts;
        
        await db.prepare(`
          UPDATE goals 
          SET deadline = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(deadline, parseInt(goalId), userId).run();
        
        executionResults.push(`📅`);
        console.log('[ACTION] Goal deadline updated:', goalId, deadline);
      }
      else if (actionType === 'UPDATE_GOAL_CATEGORY') {
        const [, goalId, category] = parts;
        
        await db.prepare(`
          UPDATE goals 
          SET category = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(category, parseInt(goalId), userId).run();
        
        const categoryEmoji = category === 'high' ? '🔥' : category === 'medium' ? '⚡' : '📌';
        executionResults.push(`${categoryEmoji}`);
        console.log('[ACTION] Goal category updated:', goalId, category);
      }
      else if (actionType === 'COMPLETE_GOAL') {
        const [, goalId] = parts;
        
        await db.prepare(`
          UPDATE goals 
          SET status = 'completed',
              current_value = target_value,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(parseInt(goalId), userId).run();
        
        executionResults.push(`🎉`);
        console.log('[ACTION] Goal completed:', goalId);
      }
      else if (actionType === 'DELETE_GOAL') {
        const [, goalId] = parts;
        
        await db.prepare(`
          DELETE FROM goals 
          WHERE id = ? AND user_id = ?
        `).bind(parseInt(goalId), userId).run();
        
        executionResults.push(`🗑️`);
        console.log('[ACTION] Goal deleted:', goalId);
      }
      else if (actionType === 'FETCH_LEADERBOARD') {
        const [, leaderboardType] = parts;
        console.log('[ACTION] Fetching leaderboard:', leaderboardType);
        
        if (leaderboardType === 'global') {
          // Get global leaderboard (projects + products)
          // First get projects
          const projects = await db.prepare(`
            SELECT 
              p.id,
              p.title,
              p.description,
              p.rating_average,
              p.votes_count,
              u.name as founder_name,
              u.avatar_url as founder_avatar,
              'project' as type
            FROM projects p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.rating_average DESC, p.votes_count DESC
            LIMIT 10
          `).all();
          
          // Then get products
          const products = await db.prepare(`
            SELECT 
              bp.id,
              bp.title,
              bp.description,
              COALESCE(bp.rating_average, 0) as rating_average,
              COALESCE(bp.votes_count, 0) as votes_count,
              u.name as founder_name,
              u.avatar_url as founder_avatar,
              'product' as type
            FROM beta_products bp
            JOIN users u ON bp.company_user_id = u.id
            ORDER BY bp.rating_average DESC, bp.votes_count DESC
            LIMIT 10
          `).all();
          
          // Combine and sort
          const allItems = [
            ...(projects.results || []),
            ...(products.results || [])
          ].sort((a: any, b: any) => {
            if (b.rating_average !== a.rating_average) {
              return b.rating_average - a.rating_average;
            }
            return b.votes_count - a.votes_count;
          }).slice(0, 10);
          
          if (allItems.length > 0) {
            let result = '🏆 **LEADERBOARD GLOBAL** (Top startups):\n\n';
            allItems.forEach((item: any, idx: number) => {
              result += `${idx + 1}. **${item.title}** - ${item.founder_name}\n`;
              result += `   ⭐ Rating: ${item.rating_average || 0} | 👥 Votos: ${item.votes_count || 0}\n`;
              result += `   Tipo: ${item.type === 'project' ? '📊 Startup' : '🚀 Producto'}\n\n`;
            });
            executionResults.push(result);
          } else {
            executionResults.push('📊 No hay startups en el leaderboard todavía.');
          }
        }
        else if (leaderboardType === 'goals') {
          // Get goals leaderboard
          const leaderboard = await db.prepare(`
            SELECT 
              u.id,
              u.name,
              u.avatar_url,
              COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals,
              COUNT(g.id) as total_goals,
              CAST(COUNT(CASE WHEN g.status = 'completed' THEN 1 END) AS REAL) * 10 as score
            FROM users u
            LEFT JOIN goals g ON u.id = g.user_id
            GROUP BY u.id, u.name, u.avatar_url
            HAVING COUNT(g.id) > 0
            ORDER BY score DESC, completed_goals DESC
            LIMIT 10
          `).all();
          
          const founders = leaderboard.results || [];
          if (founders.length > 0) {
            let result = '🎯 **LEADERBOARD DE OBJETIVOS** (Top founders):\n\n';
            founders.forEach((founder: any, idx: number) => {
              result += `${idx + 1}. **${founder.name}**\n`;
              result += `   ✅ Completados: ${founder.completed_goals} / ${founder.total_goals}\n`;
              result += `   🏅 Score: ${founder.score}\n\n`;
            });
            executionResults.push(result);
          } else {
            executionResults.push('🎯 No hay objetivos completados todavía.');
          }
        }
        else if (leaderboardType === 'competitions') {
          // Get active competitions
          const competitions = await db.prepare(`
            SELECT 
              c.id,
              c.title,
              c.description,
              c.prize_amount,
              c.event_date,
              c.status,
              COUNT(DISTINCT cp.id) as participants_count
            FROM competitions c
            LEFT JOIN competition_participants cp ON c.id = cp.competition_id
            WHERE c.status = 'active'
            GROUP BY c.id, c.title, c.description, c.prize_amount, c.event_date, c.status
            ORDER BY c.event_date DESC
            LIMIT 5
          `).all();
          
          const comps = competitions.results || [];
          if (comps.length > 0) {
            let result = '🏅 **COMPETICIONES ACTIVAS:**\n\n';
            comps.forEach((comp: any) => {
              result += `**${comp.title}**\n`;
              result += `💰 Premio: $${comp.prize_amount}\n`;
              result += `👥 Participantes: ${comp.participants_count}\n`;
              result += `📅 Fecha: ${comp.event_date}\n\n`;
            });
            result += '\n💡 Para ver el ranking de una competición específica, visita /competitions';
            executionResults.push(result);
          } else {
            executionResults.push('🏅 No hay competiciones activas en este momento.');
          }
        }
      }
    } catch (error) {
      console.error('[ACTION-ERROR]', actionType, 'Error details:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      executionResults.push(`❌ Error ejecutando ${actionType}: ${errorMessage}`);
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
  return `👋 ¡Hola! Soy tu ASTAR Agent.\n\n` +
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

// Get global leaderboard (projects AND products ranking by votes and rating)
app.get('/leaderboard/global', jwtMiddleware, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    // Get projects
    const projects = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.rating_average,
        p.votes_count,
        u.name as founder_name,
        u.avatar_url as founder_avatar,
        'project' as type
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.rating_average DESC, p.votes_count DESC
      LIMIT ?
    `).bind(limit).all();
    
    // Get products
    const products = await c.env.DB.prepare(`
      SELECT 
        bp.id,
        bp.title,
        bp.description,
        COALESCE(bp.rating_average, 0) as rating_average,
        COALESCE(bp.votes_count, 0) as votes_count,
        u.name as founder_name,
        u.avatar_url as founder_avatar,
        'product' as type
      FROM beta_products bp
      JOIN users u ON bp.company_user_id = u.id
      ORDER BY bp.rating_average DESC, bp.votes_count DESC
      LIMIT ?
    `).bind(limit).all();
    
    // Combine and sort
    const allItems = [
      ...(projects.results || []),
      ...(products.results || [])
    ].sort((a: any, b: any) => {
      if (b.rating_average !== a.rating_average) {
        return b.rating_average - a.rating_average;
      }
      return b.votes_count - a.votes_count;
    }).slice(0, limit);

    return c.json({ 
      leaderboard: allItems,
      type: 'global_combined'
    });
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    return c.json({ error: 'Failed to get global leaderboard' }, 500);
  }
});

// Get goals leaderboard (founders by completed goals)
app.get('/leaderboard/goals', jwtMiddleware, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    const leaderboard = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals,
        COUNT(g.id) as total_goals,
        CAST(COUNT(CASE WHEN g.status = 'completed' THEN 1 END) AS REAL) * 10 as score
      FROM users u
      LEFT JOIN goals g ON u.id = g.user_id
      GROUP BY u.id, u.name, u.avatar_url
      HAVING COUNT(g.id) > 0
      ORDER BY score DESC, completed_goals DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({ 
      leaderboard: leaderboard.results || [],
      type: 'goals_leaderboard'
    });
  } catch (error) {
    console.error('Error getting goals leaderboard:', error);
    return c.json({ error: 'Failed to get goals leaderboard' }, 500);
  }
});

// Get competitions leaderboard
app.get('/leaderboard/competitions', jwtMiddleware, async (c) => {
  try {
    const competitions = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.prize_amount,
        c.event_date,
        c.status,
        COUNT(DISTINCT cp.id) as participants_count
      FROM competitions c
      LEFT JOIN competition_participants cp ON c.id = cp.competition_id
      WHERE c.status = 'active'
      GROUP BY c.id, c.title, c.description, c.prize_amount, c.event_date, c.status
      ORDER BY c.event_date DESC
      LIMIT 5
    `).all();

    return c.json({ 
      competitions: competitions.results || [],
      type: 'active_competitions'
    });
  } catch (error) {
    console.error('Error getting competitions list:', error);
    return c.json({ error: 'Failed to get competitions' }, 500);
  }
});

// Get specific competition leaderboard
app.get('/leaderboard/competitions/:id', jwtMiddleware, async (c) => {
  try {
    const competitionId = c.req.param('id');
    
    const participants = await c.env.DB.prepare(`
      SELECT 
        cp.id,
        cp.startup_name,
        cp.current_rank,
        cp.total_score,
        cp.vote_score,
        cp.growth_score,
        u.name as founder_name,
        u.avatar_url as founder_avatar,
        COALESCE(p.title, bp.title) as project_title,
        CASE WHEN p.id IS NOT NULL THEN 'project' ELSE 'product' END as type
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN projects p ON cp.project_id = p.id
      LEFT JOIN beta_products bp ON cp.project_id = bp.id
      WHERE cp.competition_id = ?
      ORDER BY cp.current_rank ASC, cp.total_score DESC
      LIMIT 20
    `).bind(competitionId).all();

    const competition = await c.env.DB.prepare(`
      SELECT id, title, description, prize_amount
      FROM competitions
      WHERE id = ?
    `).bind(competitionId).first();

    return c.json({ 
      competition,
      leaderboard: participants.results || [],
      type: 'competition_leaderboard'
    });
  } catch (error) {
    console.error('Error getting competition leaderboard:', error);
    return c.json({ error: 'Failed to get competition leaderboard' }, 500);
  }
});

export default app;
