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
        Startup has ${goals.length} goals (${completedGoals.length} completed, ${activeGoals.length} active).
        Current metrics: ${latestUsers} users, $${latestRevenue} revenue.
        Growth: ${userGrowth}% users, ${revenueGrowth}% revenue.
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
  
  // Try Groq FIRST (primary AI)
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
            model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
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
  
  // Fallback to Cloudflare AI if Groq failed
  if (cloudflareAI) {
    try {
      console.log('[AI] Groq failed, using Cloudflare Workers AI as fallback');
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: `Contexto: ${JSON.stringify(simplifiedContext)}\n\nPregunta: ${userMessage}` }
      ];
      
      const response = await cloudflareAI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages,
        max_tokens: 1500,
        temperature: 0.7
      });
      
      return response.response || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('[AI] Cloudflare AI error:', error);
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
  console.log('[CHAT] === NEW MESSAGE REQUEST ===');
  const user = c.get('user') as AuthContext;
  console.log('[CHAT] User ID:', user.userId);
  
  let requestBody;
  try {
    requestBody = await c.req.json();
    console.log('[CHAT] Request body:', JSON.stringify(requestBody));
  } catch (jsonError) {
    console.error('[CHAT] Failed to parse JSON:', jsonError);
    return c.json({ error: 'Invalid JSON' }, 400);
  }
  
  let { message, useMetricsAgent, useBrandAgent, websiteUrl, industry, stage, goalData, emailContext, flowState } = requestBody;
  console.log('[CHAT] Flags:', { useMetricsAgent, useBrandAgent, websiteUrl, industry, stage, hasGoalData: !!goalData, emailContext, flowState });

  // ============ EMAIL CONTEXT HANDLING ============
  // Si viene desde un email con contexto, interceptar ANTES de validar el mensaje
  if (emailContext && !message?.trim()) {
    console.log('[CHAT] ========== EMAIL CONTEXT DETECTED ==========');
    console.log('[CHAT] Context:', emailContext);
    
    let contextMessage = '';
    let category = 'ASTAR';
    
    switch(emailContext) {
      case 'hipotesis':
        contextMessage = '💡 **Monday Update — Ideas Day**\n\n' +
          'Let me capture your hypothesis for this week!\n\n' +
          '**Question 1 of 3:**\n' +
          'What is your **#1 hypothesis** you will test this week?\n\n' +
          '_Example: "If new users can complete onboarding in under 2 minutes, more of them will reach the first aha moment."_';
        category = 'hypothesis';
        break;
        
      case 'construccion':
        contextMessage = '🛠️ **Tuesday Update — Build Day**\n\n' +
          'Let me capture your build progress!\n\n' +
          '**Question 1 of 4:**\n' +
          'What did you **build today**?\n_(Feature, flow, or experiment — be specific)_\n\n' +
          '_Example: "Built a basic onboarding flow that lets users create their first project."_';
        category = 'build';
        break;
        
      case 'usuarios':
        contextMessage = '💬 **Wednesday Update — User Learning Day**\n\n' +
          'Let me capture your user conversations!\n\n' +
          '**Question 1 of 3:**\n' +
          'How many users did you **speak with today**?\n_(Conversations, interviews, or live feedback sessions)_\n\n' +
          '_Example: "6 users (4 live calls, 2 async chats)"_';
        category = 'user_learning';
        break;
        
      case 'metricas':
        contextMessage = '📊 **Thursday Update — Measurement & Insights**\n\n' +
          'Let me capture your user behavior insights!\n\n' +
          '**Question 1 of 4:**\n' +
          'How many users **interacted with your product today**?\n_(Any meaningful usage)_\n\n' +
          '_Example: "9 users total"_';
        category = 'insight';
        break;
        
      case 'traction':
        contextMessage = '📈 **Friday Update — Traction Metrics**\n\n' +
          'Let me capture your weekly traction!\n\n' +
          '**Question 1 of 5:**\n' +
          'How much **revenue** did you generate this week? (€)\n_(Cash collected or committed)_\n\n' +
          '_Example: "€420 (7 users × €60)"_';
        category = 'traction';
        break;
        
      case 'reflexion':
        contextMessage = '🧘 **Weekend Reflection**\n\n' +
          'Share any final thoughts from the week:\n\n' +
          '• What feedback did you close?\n' +
          '• What signal leaves you most confident (or worried)?\n\n' +
          '_This is optional — feel free to skip!_';
        category = 'reflect';
        break;
        
      default:
        contextMessage = '👋 Hi! How can I help you today?';
    }
    
    // Guardar mensaje del sistema con contexto y estado del flujo
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, contextMessage).run();
    
    return c.json({ 
      message: contextMessage,
      emailContext: emailContext,
      category: category,
      flowState: 'question_1', // Track where we are in the flow
      waitingForUserResponse: true
    });
  }
  // ============ END EMAIL CONTEXT HANDLING ============

  if (!message?.trim()) {
    console.error('[CHAT] No message provided');
    return c.json({ error: 'Message is required' }, 400);
  }

  // ============ DETECT ASTAR TRIGGER ============
  // Si el mensaje contiene el marcador oculto __TRIGGER_GOAL_FLOW__, activar el flujo
  if (message.includes('__TRIGGER_GOAL_FLOW__')) {
    console.log('[CHAT] ========== ASTAR TRIGGER DETECTED ==========');
    // Limpiar el mensaje del marcador
    message = message.replace('__TRIGGER_GOAL_FLOW__', '').trim();
    console.log('[CHAT] Cleaned message:', message);
    
    // Retornar con flag para activar el flujo en el frontend
    return c.json({
      message: message, // El mensaje original limpio
      triggerGoalFlow: true, // Flag para que el frontend inicie el flujo
      category: 'ASTAR'
    });
  }
  // ============ END ASTAR TRIGGER ============

  // ============ PROCESS EMAIL CONTEXT RESPONSE ============
  // Si el usuario está respondiendo a una pregunta de contexto de email
  if (emailContext && message?.trim()) {
    console.log('[CHAT] ========== PROCESSING EMAIL CONTEXT RESPONSE ==========');
    console.log('[CHAT] Context:', emailContext, 'Message:', message, 'FlowState:', flowState);
    
    const db = c.env.DB;
    
    // Guardar el mensaje del usuario
    await db.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, message).run();
    
    try {
      let responseMessage = '';
      let nextFlowState = '';
      let goalCreated = false;
      
      switch(emailContext) {
        case 'hipotesis': {
          // Monday - Ideas Day: 3 questions flow
          if (!flowState || flowState === 'question_1') {
            // User answered Q1: What is your #1 hypothesis?
            // Store temporarily and ask Q2
            await db.prepare(`
              INSERT OR REPLACE INTO agent_chat_messages (user_id, role, content, metadata, created_at)
              VALUES (?, 'system', ?, ?, datetime('now'))
            `).bind(user.userId, 'temp_hypothesis', JSON.stringify({ hypothesis: message })).run();
            
            responseMessage = '✅ Got it!\n\n' +
              '💡 **Hypothesis:** "' + message + '"\n\n' +
              '---\n\n' +
              '**Question 2 of 3:**\n' +
              'What **user behavior** do you expect to see if this hypothesis is correct?\n\n' +
              '_Example: "At least 50% of new users complete onboarding and interact with the core feature within their first session."_';
            nextFlowState = 'question_2';
          } else if (flowState === 'question_2') {
            // User answered Q2: Expected behavior
            // Get stored hypothesis, add behavior, ask Q3
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_hypothesis'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const hypothesisData = storedData ? JSON.parse(storedData.metadata) : {};
            hypothesisData.expected_behavior = message;
            
            await db.prepare(`
              UPDATE agent_chat_messages 
              SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_hypothesis'
            `).bind(JSON.stringify(hypothesisData), user.userId).run();
            
            responseMessage = '✅ Perfect!\n\n' +
              '📊 **Expected behavior:** "' + message + '"\n\n' +
              '---\n\n' +
              '**Question 3 of 3:**\n' +
              'How will you know the hypothesis is **validated**? (specific signal)\n\n' +
              '_Example: "6 out of 10 new users complete onboarding and trigger the core action within 24 hours."_';
            nextFlowState = 'question_3';
          } else if (flowState === 'question_3') {
            // User answered Q3: Validation signal
            // Get all stored data and create the hypothesis goal
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_hypothesis'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const hypothesisData = storedData ? JSON.parse(storedData.metadata) : {};
            
            // Get current week number
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            
            // Create the hypothesis goal with all new fields
            const result = await db.prepare(`
              INSERT INTO goals (
                user_id, category, description, task, 
                hypothesis_expected_behavior, hypothesis_validation_signal, hypothesis_status,
                priority, priority_label, cadence, goal_status, 
                week_number, year_number, status, created_at
              )
              VALUES (?, 'hypothesis', ?, 'Validate hypothesis', ?, ?, 'testing', 'P1', 'Urgent & important', 'Recurrent', 'To start', ?, ?, 'active', CURRENT_TIMESTAMP)
            `).bind(
              user.userId,
              hypothesisData.hypothesis || message,
              hypothesisData.expected_behavior || '',
              message, // validation signal
              weekNumber,
              now.getFullYear()
            ).run();
            
            // Clean up temp data
            await db.prepare(`
              DELETE FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_hypothesis'
            `).bind(user.userId).run();
            
            goalCreated = true;
            responseMessage = '🎉 **Monday Update Complete!**\n\n' +
              '---\n\n' +
              '💡 **Hypothesis:**\n"' + hypothesisData.hypothesis + '"\n\n' +
              '📊 **Expected behavior:**\n"' + hypothesisData.expected_behavior + '"\n\n' +
              '✅ **Validation signal:**\n"' + message + '"\n\n' +
              '---\n\n' +
              '📋 Saved to your Goals with category **hypothesis**\n' +
              '🎯 Goal ID: #' + result.meta?.last_row_id + '\n\n' +
              'Good luck validating this week! 🚀';
            nextFlowState = 'complete';
          }
          break;
        }
        
        case 'construccion': {
          // Tuesday - Build Day: 4 questions flow
          if (!flowState || flowState === 'question_1') {
            await db.prepare(`
              INSERT OR REPLACE INTO agent_chat_messages (user_id, role, content, metadata, created_at)
              VALUES (?, 'system', ?, ?, datetime('now'))
            `).bind(user.userId, 'temp_build', JSON.stringify({ build_description: message })).run();
            
            responseMessage = '✅ Great!\n\n' +
              '🛠️ **Build:** "' + message + '"\n\n' +
              '---\n\n' +
              '**Question 2 of 4:**\n' +
              'What **tech stack or tools** did you use?\n_(Frameworks, no-code tools, APIs, AI models, etc.)_\n\n' +
              '_Example: "Frontend: Next.js + Tailwind | Backend: Firebase | AI: OpenAI API"_';
            nextFlowState = 'question_2';
          } else if (flowState === 'question_2') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_build'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const buildData = storedData ? JSON.parse(storedData.metadata) : {};
            buildData.tech_stack = message;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_build'
            `).bind(JSON.stringify(buildData), user.userId).run();
            
            responseMessage = '✅ Nice stack!\n\n' +
              '⚙️ **Tech:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 3 of 4:**\n' +
              'How **long** did it take you to build this?\n_(Approximate hours)_\n\n' +
              '_Example: "~3.5 hours"_';
            nextFlowState = 'question_3';
          } else if (flowState === 'question_3') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_build'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const buildData = storedData ? JSON.parse(storedData.metadata) : {};
            // Extract number from hours
            const hoursMatch = message.match(/(\d+(?:\.\d+)?)/);
            buildData.hours_spent = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_build'
            `).bind(JSON.stringify(buildData), user.userId).run();
            
            responseMessage = '✅ Tracked!\n\n' +
              '⏱️ **Time:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 4 of 4:**\n' +
              'Which **hypothesis** is this build testing?\n_(Link it to your Monday hypothesis)_\n\n' +
              '_Example: "Testing if users can generate a useful output in their first session to increase activation."_';
            nextFlowState = 'question_4';
          } else if (flowState === 'question_4') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_build'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const buildData = storedData ? JSON.parse(storedData.metadata) : {};
            
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            
            const result = await db.prepare(`
              INSERT INTO goals (
                user_id, category, description, task,
                build_tech_stack, build_hours_spent,
                priority, priority_label, cadence, goal_status,
                week_number, year_number, status, created_at
              )
              VALUES (?, 'build', ?, ?, ?, ?, 'P1', 'Urgent & important', 'Recurrent', 'Done', ?, ?, 'active', CURRENT_TIMESTAMP)
            `).bind(
              user.userId,
              buildData.build_description || '',
              'Build: ' + message, // hypothesis it tests
              buildData.tech_stack || '',
              buildData.hours_spent || 0,
              weekNumber,
              now.getFullYear()
            ).run();
            
            await db.prepare(`
              DELETE FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_build'
            `).bind(user.userId).run();
            
            goalCreated = true;
            responseMessage = '🎉 **Tuesday Update Complete!**\n\n' +
              '---\n\n' +
              '🛠️ **Built:** "' + buildData.build_description + '"\n\n' +
              '⚙️ **Tech stack:** ' + buildData.tech_stack + '\n\n' +
              '⏱️ **Time spent:** ' + buildData.hours_spent + ' hours\n\n' +
              '💡 **Testing hypothesis:** "' + message + '"\n\n' +
              '---\n\n' +
              '📋 Saved to your Goals with category **build**\n' +
              '🎯 Goal ID: #' + result.meta?.last_row_id + '\n\n' +
              'Great progress! Keep building! 🚀';
            nextFlowState = 'complete';
          }
          break;
        }
        
        case 'usuarios': {
          // Wednesday - User Learning: 3 questions
          if (!flowState || flowState === 'question_1') {
            const usersMatch = message.match(/(\d+)/);
            await db.prepare(`
              INSERT OR REPLACE INTO agent_chat_messages (user_id, role, content, metadata, created_at)
              VALUES (?, 'system', ?, ?, datetime('now'))
            `).bind(user.userId, 'temp_users', JSON.stringify({ users_spoken: usersMatch ? parseInt(usersMatch[1]) : 0 })).run();
            
            responseMessage = '✅ Great!\n\n' +
              '💬 **Users spoken:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 2 of 3:**\n' +
              'How many of them **actually used the product**?\n_(Touched the product, not just gave opinions)_\n\n' +
              '_Example: "4 users completed the core flow, 2 dropped off during onboarding"_';
            nextFlowState = 'question_2';
          } else if (flowState === 'question_2') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_users'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const userData = storedData ? JSON.parse(storedData.metadata) : {};
            const usersMatch = message.match(/(\d+)/);
            userData.users_used_product = usersMatch ? parseInt(usersMatch[1]) : 0;
            userData.users_detail = message;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_users'
            `).bind(JSON.stringify(userData), user.userId).run();
            
            responseMessage = '✅ Noted!\n\n' +
              '📱 **Used product:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 3 of 3:**\n' +
              'What was the **single most important thing** you learned today?\n_(One sentence only)_\n\n' +
              '_Example: "Users understand the value only after seeing a real example, not from the landing page."_';
            nextFlowState = 'question_3';
          } else if (flowState === 'question_3') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_users'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const userData = storedData ? JSON.parse(storedData.metadata) : {};
            
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            
            // Build comprehensive description
            const description = `User Learning Week ${weekNumber}: Spoke with ${userData.users_spoken || 0} users, ${userData.users_used_product || 0} used the product. ${userData.users_detail || 'Details in task field.'}`;
            
            const result = await db.prepare(`
              INSERT INTO goals (
                user_id, category, description, task,
                users_spoken, users_used_product, key_learning,
                priority, priority_label, cadence, goal_status,
                week_number, year_number, status, created_at
              )
              VALUES (?, 'user_learning', ?, ?, ?, ?, ?, 'P1', 'Urgent & important', 'Recurrent', 'Done', ?, ?, 'active', CURRENT_TIMESTAMP)
            `).bind(
              user.userId,
              description,
              userData.users_detail || 'User conversations and product usage details',
              userData.users_spoken || 0,
              userData.users_used_product || 0,
              message, // key learning
              weekNumber,
              now.getFullYear()
            ).run();
            
            await db.prepare(`
              DELETE FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_users'
            `).bind(user.userId).run();
            
            goalCreated = true;
            responseMessage = '🎉 **Wednesday Update Complete!**\n\n' +
              '---\n\n' +
              '💬 **Users spoken:** ' + userData.users_spoken + '\n\n' +
              '📱 **Used product:** ' + (userData.users_detail || userData.users_used_product) + '\n\n' +
              '💡 **Key learning:**\n"' + message + '"\n\n' +
              '---\n\n' +
              '📋 Saved to your Goals with category **user_learning**\n' +
              '🎯 Goal ID: #' + result.meta?.last_row_id + '\n\n' +
              'Great insights! Keep talking to users! 🚀';
            nextFlowState = 'complete';
          }
          break;
        }
        
        case 'metricas': {
          // Thursday - Measurement & Insights: 4 questions
          if (!flowState || flowState === 'question_1') {
            const usersMatch = message.match(/(\d+)/);
            await db.prepare(`
              INSERT OR REPLACE INTO agent_chat_messages (user_id, role, content, metadata, created_at)
              VALUES (?, 'system', ?, ?, datetime('now'))
            `).bind(user.userId, 'temp_insights', JSON.stringify({ users_interacted: usersMatch ? parseInt(usersMatch[1]) : 0 })).run();
            
            responseMessage = '✅ Got it!\n\n' +
              '📊 **Users interacted:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 2 of 4:**\n' +
              'What actions did users **repeat most often**?\n_(Core behaviors, not edge cases)_\n\n' +
              '_Example: "6 users generated a second output within the same session, 3 users returned later the same day"_';
            nextFlowState = 'question_2';
          } else if (flowState === 'question_2') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_insights'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const insightData = storedData ? JSON.parse(storedData.metadata) : {};
            insightData.repeated_actions = message;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_insights'
            `).bind(JSON.stringify(insightData), user.userId).run();
            
            responseMessage = '✅ Interesting patterns!\n\n' +
              '🔄 **Repeated actions:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 3 of 4:**\n' +
              'Where did users **get stuck, drop off, or ask for help**?\n\n' +
              '_Example: "Most users hesitated on the pricing screen, 2 users didn\'t understand what to do after the first result"_';
            nextFlowState = 'question_3';
          } else if (flowState === 'question_3') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_insights'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const insightData = storedData ? JSON.parse(storedData.metadata) : {};
            insightData.drop_off_points = message;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_insights'
            `).bind(JSON.stringify(insightData), user.userId).run();
            
            responseMessage = '✅ Important friction points!\n\n' +
              '⚠️ **Drop-off points:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 4 of 4:**\n' +
              'What **insight** does this reveal about your product?\n_(One sentence only)_\n\n' +
              '_Example: "The core feature is valuable, but the next step is unclear after first success."_';
            nextFlowState = 'question_4';
          } else if (flowState === 'question_4') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_insights'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const insightData = storedData ? JSON.parse(storedData.metadata) : {};
            
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            
            const result = await db.prepare(`
              INSERT INTO goals (
                user_id, category, description, task,
                users_interacted, repeated_actions, drop_off_points, key_insight,
                priority, priority_label, cadence, goal_status,
                week_number, year_number, status, created_at
              )
              VALUES (?, 'insight', ?, 'User behavior insights', ?, ?, ?, ?, 'P1', 'Urgent & important', 'Recurrent', 'Done', ?, ?, 'active', CURRENT_TIMESTAMP)
            `).bind(
              user.userId,
              message, // key insight as description
              insightData.users_interacted || 0,
              insightData.repeated_actions || '',
              insightData.drop_off_points || '',
              message,
              weekNumber,
              now.getFullYear()
            ).run();
            
            await db.prepare(`
              DELETE FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_insights'
            `).bind(user.userId).run();
            
            goalCreated = true;
            responseMessage = '🎉 **Thursday Update Complete!**\n\n' +
              '---\n\n' +
              '📊 **Users interacted:** ' + insightData.users_interacted + '\n\n' +
              '🔄 **Repeated actions:** ' + insightData.repeated_actions + '\n\n' +
              '⚠️ **Drop-off points:** ' + insightData.drop_off_points + '\n\n' +
              '💡 **Key insight:**\n"' + message + '"\n\n' +
              '---\n\n' +
              '📋 Saved to your Goals with category **insight**\n' +
              '🎯 Goal ID: #' + result.meta?.last_row_id + '\n\n' +
              'Great analysis! Use these insights tomorrow! 🚀';
            nextFlowState = 'complete';
          }
          break;
        }
        
        case 'traction': {
          // Friday - Traction Metrics: 5 questions
          if (!flowState || flowState === 'question_1') {
            const revenueMatch = message.match(/[€$]?(\d+(?:[.,]\d+)?)/);
            await db.prepare(`
              INSERT OR REPLACE INTO agent_chat_messages (user_id, role, content, metadata, created_at)
              VALUES (?, 'system', ?, ?, datetime('now'))
            `).bind(user.userId, 'temp_traction', JSON.stringify({ revenue: revenueMatch ? parseFloat(revenueMatch[1].replace(',', '.')) : 0 })).run();
            
            responseMessage = '✅ Tracked!\n\n' +
              '💰 **Revenue:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 2 of 5:**\n' +
              'How many **new users** did you acquire this week?\n\n' +
              '_Example: "18 new users"_';
            nextFlowState = 'question_2';
          } else if (flowState === 'question_2') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const tractionData = storedData ? JSON.parse(storedData.metadata) : {};
            const usersMatch = message.match(/(\d+)/);
            tractionData.new_users = usersMatch ? parseInt(usersMatch[1]) : 0;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
            `).bind(JSON.stringify(tractionData), user.userId).run();
            
            responseMessage = '✅ Great!\n\n' +
              '👥 **New users:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 3 of 5:**\n' +
              'How many users were **active** this week?\n_(Used the product at least once)_\n\n' +
              '_Example: "12 users used the product at least once"_';
            nextFlowState = 'question_3';
          } else if (flowState === 'question_3') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const tractionData = storedData ? JSON.parse(storedData.metadata) : {};
            const usersMatch = message.match(/(\d+)/);
            tractionData.active_users = usersMatch ? parseInt(usersMatch[1]) : 0;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
            `).bind(JSON.stringify(tractionData), user.userId).run();
            
            responseMessage = '✅ Noted!\n\n' +
              '📱 **Active users:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 4 of 5:**\n' +
              'How many users **churned** this week?\n_(Stopped using the product or explicitly dropped off)_\n\n' +
              '_Example: "3 users stopped using the product"_';
            nextFlowState = 'question_4';
          } else if (flowState === 'question_4') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const tractionData = storedData ? JSON.parse(storedData.metadata) : {};
            const usersMatch = message.match(/(\d+)/);
            tractionData.churned_users = usersMatch ? parseInt(usersMatch[1]) : 0;
            
            await db.prepare(`
              UPDATE agent_chat_messages SET metadata = ?
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
            `).bind(JSON.stringify(tractionData), user.userId).run();
            
            responseMessage = '✅ Important metric!\n\n' +
              '📉 **Churned:** ' + message + '\n\n' +
              '---\n\n' +
              '**Question 5 of 5:**\n' +
              'What was the **strongest traction signal** this week?\n_(One sentence only)_\n\n' +
              '_Example: "Two users upgraded without being prompted after their first successful use"_';
            nextFlowState = 'question_5';
          } else if (flowState === 'question_5') {
            const storedData = await db.prepare(`
              SELECT metadata FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
              ORDER BY created_at DESC LIMIT 1
            `).bind(user.userId).first() as { metadata: string } | null;
            
            const tractionData = storedData ? JSON.parse(storedData.metadata) : {};
            
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
            
            // Save to goal_weekly_traction table
            const result = await db.prepare(`
              INSERT OR REPLACE INTO goal_weekly_traction (
                user_id, revenue_amount, new_users, active_users, churned_users, strongest_signal,
                week_number, year, created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              user.userId,
              tractionData.revenue || 0,
              tractionData.new_users || 0,
              tractionData.active_users || 0,
              tractionData.churned_users || 0,
              message,
              weekNumber,
              now.getFullYear()
            ).run();
            
            // Sync with global user_metrics for leaderboard consistency
            const today = now.toISOString().split('T')[0];
            
            // Update active users in user_metrics
            await db.prepare(`
              DELETE FROM user_metrics WHERE user_id = ? AND metric_name = 'users' AND recorded_date = ?
            `).bind(user.userId, today).run();
            await db.prepare(`
              INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
              VALUES (?, 'users', ?, ?)
            `).bind(user.userId, tractionData.active_users || 0, today).run();
            
            // Update revenue in user_metrics
            await db.prepare(`
              DELETE FROM user_metrics WHERE user_id = ? AND metric_name = 'revenue' AND recorded_date = ?
            `).bind(user.userId, today).run();
            await db.prepare(`
              INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
              VALUES (?, 'revenue', ?, ?)
            `).bind(user.userId, tractionData.revenue || 0, today).run();
            
            // Also create a goal for tracking
            await db.prepare(`
              INSERT INTO goals (
                user_id, category, description, task,
                priority, priority_label, cadence, goal_status,
                week_number, year_number, status, created_at
              )
              VALUES (?, 'traction', ?, 'Weekly traction metrics', 'P1', 'Urgent & important', 'Recurrent', 'Done', ?, ?, 'active', CURRENT_TIMESTAMP)
            `).bind(
              user.userId,
              message, // strongest signal as description
              weekNumber,
              now.getFullYear()
            ).run();
            
            await db.prepare(`
              DELETE FROM agent_chat_messages 
              WHERE user_id = ? AND role = 'system' AND content = 'temp_traction'
            `).bind(user.userId).run();
            
            goalCreated = true;
            responseMessage = '🎉 **Friday Update Complete!**\n\n' +
              '---\n\n' +
              '💰 **Revenue:** €' + tractionData.revenue + '\n\n' +
              '👥 **New users:** ' + tractionData.new_users + '\n\n' +
              '📱 **Active users:** ' + tractionData.active_users + '\n\n' +
              '📉 **Churned:** ' + tractionData.churned_users + '\n\n' +
              '🚀 **Strongest signal:**\n"' + message + '"\n\n' +
              '---\n\n' +
              '📋 Saved to **weekly traction** metrics\n' +
              '📊 This data will be used for the Weekly Leaderboard!\n\n' +
              'Great week! See you on the leaderboard! 🏆';
            nextFlowState = 'complete';
          }
          break;
        }
        
        case 'reflexion': {
          // Saturday - Weekly reflection: simple save
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
          
          const result = await db.prepare(`
            INSERT INTO goals (
              user_id, category, description, task,
              priority, priority_label, cadence, goal_status,
              week_number, year_number, status, created_at
            )
            VALUES (?, 'reflect', ?, 'Weekly reflection', 'P2', 'Urgent or important', 'Recurrent', 'Done', ?, ?, 'active', CURRENT_TIMESTAMP)
          `).bind(
            user.userId,
            message,
            weekNumber,
            now.getFullYear()
          ).run();
          
          goalCreated = true;
          responseMessage = '🎉 **Reflection Saved!**\n\n' +
            '---\n\n' +
            '🤔 **Your insight:**\n"' + message + '"\n\n' +
            '---\n\n' +
            '📋 Saved with category **reflect**\n' +
            '🎯 Goal ID: #' + result.meta?.last_row_id + '\n\n' +
            '📊 Week ' + weekNumber + ' reflection complete!\n\n' +
            'Have a restful weekend and come back strong on Monday! 💪';
          nextFlowState = 'complete';
          break;
        }
      }
      
      // Guardar respuesta del asistente
      await db.prepare(`
        INSERT INTO agent_chat_messages (user_id, role, content, created_at)
        VALUES (?, 'assistant', ?, datetime('now'))
      `).bind(user.userId, responseMessage).run();
      
      return c.json({ 
        message: responseMessage,
        goalCreated: goalCreated,
        emailContextProcessed: true,
        flowState: nextFlowState,
        emailContext: emailContext
      });
      
    } catch (error) {
      console.error('[CHAT] Error processing email context response:', error);
      const errorMessage = '❌ Hubo un error al procesar tu respuesta. Por favor, intenta de nuevo.';
      
      await db.prepare(`
        INSERT INTO agent_chat_messages (user_id, role, content, created_at)
        VALUES (?, 'assistant', ?, datetime('now'))
      `).bind(user.userId, errorMessage).run();
      
      return c.json({ message: errorMessage });
    }
  }
  // ============ END PROCESS EMAIL CONTEXT RESPONSE ============

  // ============ GOAL CREATION FROM FLOW ============
  // Si viene goalData del flujo de creación de goals, crear directamente
  if (goalData) {
    console.log('[CHAT] ========== GOAL CREATION FROM FLOW ==========');
    console.log('[CHAT] Goal data received:', JSON.stringify(goalData));
    
    try {
      const db = c.env.DB;
      const result = await db.prepare(`
        INSERT INTO goals (
          user_id, category, description, task, priority, priority_label, 
          cadence, dri, goal_status, week_of, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).bind(
        user.userId,
        goalData.category || 'ASTAR',
        goalData.description,
        goalData.task || null,
        goalData.priority || 'P0',
        goalData.priority_label || 'Urgent & important',
        goalData.cadence || 'One time',
        goalData.dri || null,
        goalData.goal_status || 'To start',
        goalData.week_of || null
      ).run();
      
      console.log('[CHAT] Goal created successfully! ID:', result.meta?.last_row_id);
      
      const successMessage = '✅ Goal created successfully!\n\n' +
        '📋 **' + goalData.description + '**\n' +
        '🎯 Task: ' + (goalData.task || 'N/A') + '\n' +
        '🏷️ Category: ' + goalData.category + '\n' +
        '⚡ Priority: ' + goalData.priority + ' - ' + goalData.priority_label + '\n' +
        '🔄 Cadence: ' + goalData.cadence + '\n' +
        '👤 Owner: ' + (goalData.dri || 'Not assigned') + '\n' +
        '📊 Status: ' + goalData.goal_status + '\n' +
        '📅 Week: ' + (goalData.week_of || 'Not specified') + '\n\n' +
        '🆔 Goal ID: ' + result.meta?.last_row_id + '\n\n' +
        'Now available in your dashboard!';
      
      // Guardar en historial de chat
      await db.prepare(`
        INSERT INTO agent_chat_messages (user_id, role, content, created_at)
        VALUES (?, 'user', ?, datetime('now'))
      `).bind(user.userId, message).run();
      
      await db.prepare(`
        INSERT INTO agent_chat_messages (user_id, role, content, created_at)
        VALUES (?, 'assistant', ?, datetime('now'))
      `).bind(user.userId, successMessage).run();
      
      return c.json({ message: successMessage });
      
    } catch (error) {
      console.error('[CHAT] Error creating goal from flow:', error);
      const errorMessage = '❌ There was an error creating the goal. Please try again.';
      
      // Guardar error en historial
      try {
        await c.env.DB.prepare(`
          INSERT INTO agent_chat_messages (user_id, role, content, created_at)
          VALUES (?, 'assistant', ?, datetime('now'))
        `).bind(user.userId, errorMessage).run();
      } catch (dbError) {
        console.error('[CHAT] DB error:', dbError);
      }
      
      return c.json({ message: errorMessage });
    }
  }

  // ============ INTENT DETECTION ============
  // Detectar automáticamente qué quiere el usuario basándose en su mensaje
  const messageLower = message.toLowerCase();
  
  // ============ GOAL DETECTION - PRIORITY #1 ============
  // Detectar si quiere crear un goal - ESTO VA PRIMERO antes de cualquier otro procesamiento
  const goalKeywords = [
    'crear goal', 'create goal', 'nuevo goal', 'new goal',
    'crear objetivo', 'nuevo objetivo', 'añadir objetivo', 'agregar objetivo',
    'quiero crear', 'necesito crear', 'me gustaria crear', 'me gustaría crear',
    'registrar goal', 'definir objetivo', 'establecer goal', 'poner un objetivo',
    'añadir goal', 'agregar goal', 'add goal', 'añadir meta', 'nueva meta',
    'crear una meta', 'quiero un objetivo', 'quiero un goal',
    'crea un goal', 'crea un objetivo', 'hazme un goal', 'hazme un objetivo',
    'agrega un goal', 'agrega un objetivo', 'pon un objetivo',
    'i want to create', 'set a goal', 'add a goal', 'make a goal'
  ];
  
  const wantsToCreateGoal = goalKeywords.some(keyword => messageLower.includes(keyword));
  
  if (wantsToCreateGoal) {
    console.log('[CHAT] ========== GOAL CREATION DETECTED ==========');
    console.log('[CHAT] User wants to create a goal. Triggering flow directly');
    
    // Guardar mensaje del usuario
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, message).run();
    
    // Responder con un flag especial que el frontend detectará
    // IMPORTANTE: El message es un texto amigable por si el frontend NO detecta el flag
    // Esto evita que se muestre texto técnico como __START_GOAL_FLOW__
    console.log('[CHAT] Returning goal flow trigger');
    
    return c.json({ 
      message: '✨ Perfect! Let\'s create your goal. I\'ll ask you a few quick questions to complete all the information.',
      triggerGoalFlow: true,
      startFlow: true
    });
  }
  // ============ END GOAL DETECTION ============
  
  // Detectar si el usuario quiere generar imágenes
  const wantsImage = (
    messageLower.includes('genera') && (messageLower.includes('imagen') || messageLower.includes('imágenes') || messageLower.includes('image')) ||
    messageLower.includes('crea') && (messageLower.includes('imagen') || messageLower.includes('banner') || messageLower.includes('post')) ||
    messageLower.includes('quiero una imagen') ||
    messageLower.includes('hazme una imagen') ||
    messageLower.includes('crear imagen') ||
    messageLower.includes('generar imagen') ||
    messageLower.includes('diseña') && (messageLower.includes('banner') || messageLower.includes('post') || messageLower.includes('imagen')) ||
    messageLower.includes('instagram') && (messageLower.includes('imagen') || messageLower.includes('post') || messageLower.includes('crea') || messageLower.includes('genera')) ||
    messageLower.includes('linkedin') && (messageLower.includes('imagen') || messageLower.includes('post') || messageLower.includes('crea')) ||
    messageLower.includes('twitter') && (messageLower.includes('imagen') || messageLower.includes('post')) ||
    messageLower.includes('tiktok') && (messageLower.includes('imagen') || messageLower.includes('thumbnail')) ||
    messageLower.includes('banner para') ||
    messageLower.includes('imagen para') ||
    messageLower.includes('post para') ||
    messageLower.includes('thumbnail') ||
    messageLower.includes('hero image') ||
    messageLower.includes('imagen de portada') ||
    messageLower.includes('diseño para') && (messageLower.includes('red') || messageLower.includes('social'))
  );
  
  // Detectar si quiere análisis de marketing/marca
  const wantsBrandAnalysis = (
    messageLower.includes('analiza') && (messageLower.includes('marca') || messageLower.includes('brand') || messageLower.includes('web') || messageLower.includes('sitio')) ||
    messageLower.includes('plan de marketing') ||
    messageLower.includes('estrategia de marketing') ||
    messageLower.includes('marketing plan') ||
    messageLower.includes('analizar mi marca') ||
    messageLower.includes('análisis de marca') ||
    messageLower.includes('identidad de marca') ||
    messageLower.includes('branding')
  );
  
  // Detectar si quiere análisis de métricas
  const wantsMetrics = (
    messageLower.includes('métrica') ||
    messageLower.includes('metrica') ||
    messageLower.includes('analiza') && (messageLower.includes('dato') || messageLower.includes('número') || messageLower.includes('estadística')) ||
    messageLower.includes('kpi') ||
    messageLower.includes('rendimiento') ||
    messageLower.includes('crecimiento') && (messageLower.includes('analiza') || messageLower.includes('cómo va'))
  );
  
  // Extraer URL del mensaje si la hay
  const urlMatch = message.match(/https?:\/\/[^\s]+/);
  let detectedUrl = websiteUrl || (urlMatch ? urlMatch[0] : null);
  
  // Si pide imagen pero no tiene URL, pedirla o usar contexto
  console.log('[CHAT] Intent detection:', { wantsImage, wantsBrandAnalysis, wantsMetrics, detectedUrl });
  // ============ END INTENT DETECTION ============

  try {
    console.log('[CHAT] Saving user message to DB...');
    // Guardar mensaje del usuario
    await c.env.DB.prepare(`
      INSERT INTO agent_chat_messages (user_id, role, content, created_at)
      VALUES (?, 'user', ?, datetime('now'))
    `).bind(user.userId, message).run();
    console.log('[CHAT] User message saved successfully');

    let railwayUrl = c.env.RAILWAY_API_URL || 'http://localhost:5000';
    
    // Asegurar que la URL tenga protocolo
    if (railwayUrl && !railwayUrl.startsWith('http://') && !railwayUrl.startsWith('https://')) {
      railwayUrl = 'https://' + railwayUrl;
    }
    
    // ============ AUTO-ROUTE TO RAILWAY AGENTS ============
    
    // Si quiere generar imagen, llamar al brand agent de Railway
    if (wantsImage && railwayUrl && !railwayUrl.includes('localhost')) {
      console.log('[CHAT] Auto-routing to Railway for image generation...');
      
      try {
        const agentResponse = await fetch(`${railwayUrl}/api/agents/brand/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website_url: detectedUrl || 'general',
            user_id: String(user.userId || user.id || '1'),
            cloudflare_api_url: new URL(c.req.url).origin,
            custom_prompt: message  // Pasar el mensaje completo como prompt
          })
        });

        if (agentResponse.ok) {
          const result = await agentResponse.json() as any;
          
          let responseMsg = '🎨 **Generating marketing images...**\n\n';
          if (result.analysis) {
            responseMsg += result.analysis + '\n\n';
          }
          if (result.images_generated > 0) {
            responseMsg += `✅ **${result.images_generated} image(s) generated!**\n\n`;
            responseMsg += '📸 You can view and approve them in the **AI CMO** section of the menu.\n\n';
            responseMsg += '💡 *Tip: Approve the ones you like to download them in high resolution.*';
          } else {
            responseMsg += '⏳ Images are being processed. Check the **AI CMO** section in a moment.';
          }
          
          await c.env.DB.prepare(`
            INSERT INTO agent_chat_messages (user_id, role, content, created_at)
            VALUES (?, 'assistant', ?, datetime('now'))
          `).bind(user.userId, responseMsg).run();

          return c.json({ message: responseMsg });
        }
      } catch (imageError) {
        console.error('[CHAT] Error generating images:', imageError);
        // Continue to normal chat flow if image generation fails
      }
    }
    
    // Si quiere análisis de marca con URL
    if (wantsBrandAnalysis && detectedUrl && railwayUrl && !railwayUrl.includes('localhost')) {
      console.log('[CHAT] Auto-routing to Railway for brand analysis...');
      
      try {
        const agentResponse = await fetch(`${railwayUrl}/api/agents/brand/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website_url: detectedUrl,
            custom_prompt: message
          })
        });

        if (agentResponse.ok) {
          const result = await agentResponse.json() as any;
          
          if (result.success && result.response) {
            const formattedResponse = `🎨 **BRAND ANALYSIS**\n\n${result.response}`;
            
            await c.env.DB.prepare(`
              INSERT INTO agent_chat_messages (user_id, role, content, created_at)
              VALUES (?, 'assistant', ?, datetime('now'))
            `).bind(user.userId, formattedResponse).run();

            return c.json({ message: formattedResponse });
          }
        }
      } catch (brandError) {
        console.error('[CHAT] Error in brand analysis:', brandError);
        // Continue to normal chat flow
      }
    }
    
    // ============ END AUTO-ROUTE ============
    
    console.log('[CHAT] Railway URL configured as:', railwayUrl);
    console.log('[CHAT] Environment check - RAILWAY_API_URL exists:', !!c.env.RAILWAY_API_URL);

    // Si se solicita el brand marketing agent
    if (useBrandAgent && websiteUrl) {
      console.log('[CHAT] Delegating to Brand Marketing Agent on Railway...');
      console.log('[CHAT] Website URL:', websiteUrl);
      console.log('[CHAT] Target URL:', `${railwayUrl}/api/agents/brand/analyze`);
      
      // Verificar si Railway está configurado
      if (railwayUrl.includes('your-railway-app') || railwayUrl === 'http://localhost:5000') {
        console.error('[CHAT] Railway URL not configured! Using placeholder.');
        const errorMsg = '⚠️ **Railway is not configured**\n\nConfigure `RAILWAY_API_URL` in Cloudflare Dashboard > Settings > Environment Variables.\n\n💡 In the meantime, use the normal chat for questions.';
        
        try {
          await c.env.DB.prepare(`
            INSERT INTO agent_chat_messages (user_id, role, content, created_at)
            VALUES (?, 'assistant', ?, datetime('now'))
          `).bind(user.userId, errorMsg).run();
        } catch (dbError) {
          console.error('[CHAT] DB error saving message:', dbError);
        }
        
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
            const formattedResponse = `🎨 **BRAND ANALYSIS**\n\n${result.response}\n\n---\n*Analysis generated by ASTAR* Brand Marketing Agent 🚀*`;
            
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
        
        const errorMsg = `⚠️ **Error conectando con Railway**\n\n${brandError instanceof Error ? brandError.message : String(brandError)}\n\n**Verifica:**\n- Railway está corriendo\n- RAILWAY_API_URL configurado correctamente\n- Endpoint /api/agents/brand/analyze existe`;
        
        try {
          await c.env.DB.prepare(`
            INSERT INTO agent_chat_messages (user_id, role, content, created_at)
            VALUES (?, 'assistant', ?, datetime('now'))
          `).bind(user.userId, errorMsg).run();
        } catch (dbError) {
          console.error('[CHAT] DB error:', dbError);
        }
        
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
        const errorMsg = '⚠️ **Railway no está configurado**\n\nConfigura `RAILWAY_API_URL` en Cloudflare Dashboard.';
        
        try {
          await c.env.DB.prepare(`
            INSERT INTO agent_chat_messages (user_id, role, content, created_at)
            VALUES (?, 'assistant', ?, datetime('now'))
          `).bind(user.userId, errorMsg).run();
        } catch (dbError) {
          console.error('[CHAT] DB error:', dbError);
        }
        
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
        
        const errorMsg = `⚠️ **Error conectando con Metrics Agent**\n\n${metricsError instanceof Error ? metricsError.message : String(metricsError)}\n\nVerifica Railway y RAILWAY_API_URL`;
        
        try {
          await c.env.DB.prepare(`
            INSERT INTO agent_chat_messages (user_id, role, content, created_at)
            VALUES (?, 'assistant', ?, datetime('now'))
          `).bind(user.userId, errorMsg).run();
        } catch (dbError) {
          console.error('[CHAT] DB error:', dbError);
        }
        
        return c.json({ message: errorMsg });
      }
    }

    // Flujo normal del chat agent (solo si no se usó Railway agents)
    // Get chat history

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
      const systemPrompt = `You are ASTAR* Agent 🚀, a growth assistant for startups.

🚫 ABSOLUTELY PROHIBITED:
- NEVER create goals directly
- NEVER use ACTION:CREATE_GOAL (that command DOES NOT EXIST)
- NEVER respond with "New Goal created" or goal data
- NEVER show IDs, categories, or technical values

⚠️ RULE #1 - CREATE GOALS:
When user asks to create a goal, respond EXACTLY with these 2 words:
TRIGGER:START_GOAL_FLOW

Do NOT add ANYTHING else. Just those 2 words.

CORRECT Examples:
User: "create goal" 
You: TRIGGER:START_GOAL_FLOW

User: "new goal"
You: TRIGGER:START_GOAL_FLOW

User: "I want to create a goal"
You: TRIGGER:START_GOAL_FLOW

User: "add goal"
You: TRIGGER:START_GOAL_FLOW

❌ WRONG (DON'T DO THIS):
User: "create goal"
You: "New Goal created: ID: 177..." ← NEVER DO THIS!

📊 COMMANDS FOR METRICS (USERS AND REVENUE):

🔴 IMPORTANT: The context provides current metrics from database:
- Current users: ${context.metrics.current.users}
- Current revenue: $${context.metrics.current.revenue}

USE THESE DATABASE VALUES when responding about metrics!

ACTION:SET_USERS|value - Set ABSOLUTE number of users (use when user says "I have X users", "update to X", "we are at X")
ACTION:SET_REVENUE|value - Set ABSOLUTE revenue (use when user says "revenue is X", "update to $X")
ACTION:ADD_USERS|value - Add users to current total (ONLY when user says "got X NEW users", "X MORE users", "gained X")
ACTION:ADD_REVENUE|value - Add revenue to current total (ONLY when user says "made $X today", "X MORE in sales", "gained $X")

📝 METRIC EXAMPLES (ALWAYS include ACTION first, then response):

User: "we have 500 users"
You: ACTION:SET_USERS|500
👥 Set to 500 users!

User: "actualiza a 15 usuarios" or "update users to 15"
You: ACTION:SET_USERS|15
👥 Set to 15 users!

User: "tengo 100 usuarios" or "I have 100 users"
You: ACTION:SET_USERS|100
👥 Set to 100 users!

User: "update revenue to 15000"
You: ACTION:SET_REVENUE|15000
💰 Revenue set to $15,000!

User: "we got 50 NEW users" or "50 MORE users" (current DB: ${context.metrics.current.users})
You: ACTION:ADD_USERS|50
🎉 +50 users! Now you have ${context.metrics.current.users + 50} total.

User: "gained 30 users today" (current DB: ${context.metrics.current.users})
You: ACTION:ADD_USERS|30
🎉 +30 users! Now you have ${context.metrics.current.users + 30} total.

User: "we made 2000 in sales today" (current DB: $${context.metrics.current.revenue})
You: ACTION:ADD_REVENUE|2000
💵 +$2,000! Total revenue: $${context.metrics.current.revenue + 2000}

User: "we now have 1200 users and $8000 revenue"
You: ACTION:SET_USERS|1200
ACTION:SET_REVENUE|8000
📊 Metrics set! 1,200 users and $8,000 revenue.

⚠️ CRITICAL: ALWAYS output ACTION: commands on their own lines BEFORE your response text!

🔧 COMMANDS TO EDIT EXISTING GOALS:

ACTION:UPDATE_GOAL_STATUS|goal_id|status - Change status (WIP, To start, Done, etc.)
ACTION:UPDATE_GOAL_DESCRIPTION|goal_id|new_description - Change description
ACTION:COMPLETE_GOAL|goal_id - Mark as completed
ACTION:DELETE_GOAL|goal_id - Delete goal

📝 EDITING EXAMPLES:

User: "complete goal 145"
You: ACTION:COMPLETE_GOAL|145
🎉 Goal completed!

User: "delete goal 136"
You: ACTION:DELETE_GOAL|136
🗑️ Deleted

📊 USER CONTEXT:
- Has \${context.goals.totalCount} goals (\${context.goals.completedCount} completed)
- \${context.metrics.current.users} users, $\${context.metrics.current.revenue} revenue

🎯 ACTIVE GOALS (use these IDs to edit):
\${context.goals.active.slice(0, 10).map((g: any) => \`[ID:\${g.id}] \${g.description} - Status: \${g.status}\`).join('\\n')}

REMEMBER:
- To CREATE → respond ONLY: TRIGGER:START_GOAL_FLOW
- To EDIT → use ACTION: with the correct ID
- Be brief and natural
- Respond in English`;

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
    console.error('[CHAT] ===== ERROR PROCESSING MESSAGE =====');
    console.error('[CHAT] Error type:', typeof error);
    console.error('[CHAT] Error:', error);
    console.error('[CHAT] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[CHAT] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[CHAT] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[CHAT] ===== END ERROR =====');
    
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
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: [
          { 
            role: 'system', 
            content: `You are a goal classifier for startups. You must classify each goal into one of these 3 categories:

- ASTAR: Everything related to blockchain, web3, Astar Network, smart contracts, DeFi, NFTs, crypto
- MAGCIENT: Everything related to AI, Machine Learning, automation, data science, AI agents, LLMs
- OTHER: Everything else (marketing, sales, product, operations, finance, etc.)

Respond ONLY with one word: ASTAR, MAGCIENT or OTHER.`
          },
          { 
            role: 'user', 
            content: `Description: ${description}\nTask: ${task}\n\nCategory?` 
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
  console.log('[PROCESS-ACTIONS] User ID:', userId);
  
  const actions = aiResponse.match(/ACTION:([A-Z_]+)\|([^\n]+)/g);
  console.log('[PROCESS-ACTIONS] Found actions:', actions);
  
  if (!actions || actions.length === 0) {
    console.log('[PROCESS-ACTIONS] No actions found in response');
    return aiResponse;
  }
  
  let responseText = aiResponse;
  let executionResults: string[] = [];
  
  for (const action of actions) {
    const parts = action.replace('ACTION:', '').split('|');
    const actionType = parts[0];
    console.log('[PROCESS-ACTIONS] Processing action:', actionType, 'with parts:', parts);
    
    try {
      // ============ METRICS COMMANDS ============
      if (actionType === 'SET_USERS') {
        const [, value] = parts;
        const today = new Date().toISOString().split('T')[0];
        const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
        
        if (isNaN(numValue)) {
          executionResults.push(`❌ Valor inválido para usuarios: ${value}`);
        } else {
          // Delete today's entry if exists, then insert new one
          await db.prepare(`
            DELETE FROM user_metrics 
            WHERE user_id = ? AND metric_name = 'users' AND recorded_date = ?
          `).bind(userId, today).run();
          
          await db.prepare(`
            INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
            VALUES (?, 'users', ?, ?)
          `).bind(userId, numValue, today).run();
          
          executionResults.push(`👥 Updated! You now have ${numValue.toLocaleString()} users.`);
          console.log('[ACTION] Users set to:', numValue);
        }
      }
      else if (actionType === 'SET_REVENUE') {
        const [, value] = parts;
        const today = new Date().toISOString().split('T')[0];
        const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
        
        if (isNaN(numValue)) {
          executionResults.push(`❌ Valor inválido para revenue: ${value}`);
        } else {
          // Delete today's entry if exists, then insert new one
          await db.prepare(`
            DELETE FROM user_metrics 
            WHERE user_id = ? AND metric_name = 'revenue' AND recorded_date = ?
          `).bind(userId, today).run();
          
          await db.prepare(`
            INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
            VALUES (?, 'revenue', ?, ?)
          `).bind(userId, numValue, today).run();
          
          executionResults.push(`💰 Revenue updated to $${numValue.toLocaleString()}!`);
          console.log('[ACTION] Revenue set to:', numValue);
        }
      }
      else if (actionType === 'ADD_USERS') {
        const [, value] = parts;
        const today = new Date().toISOString().split('T')[0];
        const addValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
        
        if (isNaN(addValue)) {
          executionResults.push(`❌ Valor inválido para usuarios: ${value}`);
        } else {
          // Get current value
          const currentMetric = await db.prepare(`
            SELECT metric_value FROM user_metrics 
            WHERE user_id = ? AND metric_name = 'users'
            ORDER BY recorded_date DESC LIMIT 1
          `).bind(userId).first();
          
          const currentValue = currentMetric?.metric_value || 0;
          const newValue = currentValue + addValue;
          
          // Delete today's entry if exists, then insert new one
          await db.prepare(`
            DELETE FROM user_metrics 
            WHERE user_id = ? AND metric_name = 'users' AND recorded_date = ?
          `).bind(userId, today).run();
          
          await db.prepare(`
            INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
            VALUES (?, 'users', ?, ?)
          `).bind(userId, newValue, today).run();
          
          executionResults.push(`🎉 ¡+${addValue.toLocaleString()} usuarios! Total: ${newValue.toLocaleString()}`);
          console.log('[ACTION] Users added:', addValue, 'Total:', newValue);
        }
      }
      else if (actionType === 'ADD_REVENUE') {
        const [, value] = parts;
        const today = new Date().toISOString().split('T')[0];
        const addValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
        
        if (isNaN(addValue)) {
          executionResults.push(`❌ Valor inválido para revenue: ${value}`);
        } else {
          // Get current value
          const currentMetric = await db.prepare(`
            SELECT metric_value FROM user_metrics 
            WHERE user_id = ? AND metric_name = 'revenue'
            ORDER BY recorded_date DESC LIMIT 1
          `).bind(userId).first();
          
          const currentValue = currentMetric?.metric_value || 0;
          const newValue = currentValue + addValue;
          
          // Delete today's entry if exists, then insert new one
          await db.prepare(`
            DELETE FROM user_metrics 
            WHERE user_id = ? AND metric_name = 'revenue' AND recorded_date = ?
          `).bind(userId, today).run();
          
          await db.prepare(`
            INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
            VALUES (?, 'revenue', ?, ?)
          `).bind(userId, newValue, today).run();
          
          executionResults.push(`💵 ¡+$${addValue.toLocaleString()}! Revenue total: $${newValue.toLocaleString()}`);
          console.log('[ACTION] Revenue added:', addValue, 'Total:', newValue);
        }
      }
      // ============ END METRICS COMMANDS ============
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
        const [, goalId, newDescription] = parts;
        console.log('[ACTION] ========== UPDATE_GOAL START ==========');
        console.log('[ACTION] UPDATE_GOAL - goalId:', goalId);
        console.log('[ACTION] UPDATE_GOAL - newDescription:', newDescription);
        console.log('[ACTION] UPDATE_GOAL - userId:', userId);
        
        const result = await db.prepare(`
          UPDATE goals 
          SET description = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(newDescription, parseInt(goalId), userId).run();
        
        console.log('[ACTION] UPDATE_GOAL - Rows affected:', result.meta?.changes);
        console.log('[ACTION] ========== UPDATE_GOAL END ==========');
        
        if (result.meta?.changes === 0) {
          executionResults.push(`❌ Goal ${goalId} not found`);
        } else {
          executionResults.push(`✅ Goal ${goalId} updated`);
        }
      }
      else if (actionType === 'UPDATE_GOAL_STATUS') {
        const [, goalId, newGoalStatus] = parts;
        const validStatuses = ['WIP', 'To start', 'On Hold', 'Delayed', 'Blocked', 'Done'];
        console.log('[ACTION] ========== UPDATE_GOAL_STATUS START ==========');
        console.log('[ACTION] UPDATE_GOAL_STATUS - goalId:', goalId);
        console.log('[ACTION] UPDATE_GOAL_STATUS - newGoalStatus:', newGoalStatus);
        console.log('[ACTION] UPDATE_GOAL_STATUS - userId:', userId);
        console.log('[ACTION] UPDATE_GOAL_STATUS - Valid statuses:', validStatuses);
        
        if (!validStatuses.includes(newGoalStatus)) {
          console.log('[ACTION] UPDATE_GOAL_STATUS - Invalid status provided');
          executionResults.push(`❌ Invalid status. Use: WIP, To start, On Hold, Delayed, Blocked, Done`);
        } else {
          const result = await db.prepare(`
            UPDATE goals 
            SET goal_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
          `).bind(newGoalStatus, parseInt(goalId), userId).run();
          
          console.log('[ACTION] UPDATE_GOAL_STATUS result:', JSON.stringify(result));
          console.log('[ACTION] UPDATE_GOAL_STATUS - Rows affected:', result.meta?.changes);
          console.log('[ACTION] ========== UPDATE_GOAL_STATUS END ==========');
          
          if (result.meta?.changes === 0) {
            executionResults.push(`❌ Goal ${goalId} not found`);
          } else {
            const statusEmoji = newGoalStatus === 'Done' ? '✅' : newGoalStatus === 'WIP' ? '🔄' : '⏳';
            executionResults.push(`${statusEmoji} Status updated to ${newGoalStatus}`);
          }
          console.log('[ACTION] Goal status updated:', goalId, newGoalStatus);
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
        console.log('[ACTION] COMPLETE_GOAL - goalId:', goalId, 'userId:', userId);
        
        const result = await db.prepare(`
          UPDATE goals 
          SET status = 'completed',
              current_value = target_value,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `).bind(parseInt(goalId), userId).run();
        
        console.log('[ACTION] COMPLETE_GOAL result:', JSON.stringify(result));
        console.log('[ACTION] Rows affected:', result.meta?.changes);
        
        if (result.meta?.changes === 0) {
          executionResults.push(`❌ No se encontró el objetivo ${goalId}`);
        } else {
          executionResults.push(`🎉`);
        }
        console.log('[ACTION] Goal completed:', goalId);
      }
      else if (actionType === 'DELETE_GOAL') {
        const [, goalId] = parts;
        console.log('[ACTION] DELETE_GOAL - goalId:', goalId, 'userId:', userId);
        
        const result = await db.prepare(`
          DELETE FROM goals 
          WHERE id = ? AND user_id = ?
        `).bind(parseInt(goalId), userId).run();
        
        console.log('[ACTION] DELETE_GOAL result:', JSON.stringify(result));
        console.log('[ACTION] Rows affected:', result.meta?.changes);
        
        if (result.meta?.changes === 0) {
          executionResults.push(`❌ No se encontró el objetivo ${goalId}`);
        } else {
          executionResults.push(`🗑️`);
        }
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
            let result = '🏆 **GLOBAL LEADERBOARD** (Top startups):\n\n';
            allItems.forEach((item: any, idx: number) => {
              result += `${idx + 1}. **${item.title}** - ${item.founder_name}\n`;
              result += `   ⭐ Rating: ${item.rating_average || 0} | 👥 Votes: ${item.votes_count || 0}\n`;
              result += `   Type: ${item.type === 'project' ? '📊 Startup' : '🚀 Product'}\n\n`;
            });
            executionResults.push(result);
          } else {
            executionResults.push('📊 No startups in the leaderboard yet.');
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
            let result = '🎯 **GOALS LEADERBOARD** (Top founders):\n\n';
            founders.forEach((founder: any, idx: number) => {
              result += `${idx + 1}. **${founder.name}**\n`;
              result += `   ✅ Completed: ${founder.completed_goals} / ${founder.total_goals}\n`;
              result += `   🏅 Score: ${founder.score}\n\n`;
            });
            executionResults.push(result);
          } else {
            executionResults.push('🎯 No completed goals yet.');
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
            let result = '🏅 **ACTIVE COMPETITIONS:**\n\n';
            comps.forEach((comp: any) => {
              result += `**${comp.title}**\n`;
              result += `💰 Prize: $${comp.prize_amount}\n`;
              result += `👥 Participants: ${comp.participants_count}\n`;
              result += `📅 Date: ${comp.event_date}\n\n`;
            });
            result += '\n💡 To see the ranking of a specific competition, visit /competitions';
            executionResults.push(result);
          } else {
            executionResults.push('🏅 No active competitions at the moment.');
          }
        }
      }
    } catch (error) {
      console.error('[ACTION-ERROR]', actionType, 'Error details:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      executionResults.push(`❌ Error executing ${actionType}: ${errorMessage}`);
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
  if (lowerMessage.includes('añadir') || lowerMessage.includes('crear') || lowerMessage.includes('nuevo objetivo') || lowerMessage.includes('new goal') || lowerMessage.includes('add') || lowerMessage.includes('create') || (lowerMessage.includes('quiero') && !lowerMessage.includes('analiza'))) {
    return `🎯 **To enable the AI that creates goals automatically:**\n\n` +
      `1. Get a free API key at https://console.groq.com/\n` +
      `2. Add it to your project in Cloudflare\n\n` +
      `**In the meantime**, you can:\n` +
      `• Go to the **Traction** view in the dashboard\n` +
      `• Click on "Add Goal"\n` +
      `• Create your goals manually\n\n` +
      `💡 With the API key configured, I can create goals just by telling me "I want to reach 1000 users"`;
  }
  
  if (lowerMessage.includes('objetivo') || lowerMessage.includes('goal') || lowerMessage.includes('meta') || lowerMessage.includes('analiza') || lowerMessage.includes('analyze')) {
    const { goals } = context;
    if (goals.totalCount === 0) {
      return `📊 You don't have any goals registered yet.\n\n💡 I recommend creating your first goal. Go to the Traction section and add goals like:\n- Get X users\n- Reach $X in revenue\n- Launch X feature`;
    }
    
    let response = `📊 **Analysis of your goals:**\n\n`;
    response += `• Total: ${goals.totalCount} goals\n`;
    response += `• Completed: ${goals.completedCount} (${goals.completionRate}%)\n`;
    response += `• Active: ${goals.active.length}\n\n`;
    
    if (goals.active.length > 0) {
      response += `**Active goals:**\n`;
      goals.active.slice(0, 5).forEach((g: any, i: number) => {
        const progress = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
        response += `${i + 1}. ${g.description} - ${progress}% (${g.current_value}/${g.target_value})\n`;
      });
    }
    
    return response;
  }
  
  if (lowerMessage.includes('métrica') || lowerMessage.includes('metric') || lowerMessage.includes('crecimiento') || lowerMessage.includes('growth')) {
    const { metrics } = context;
    let response = `📈 **Metrics summary:**\n\n`;
    response += `• Current users: ${metrics.current.users}\n`;
    response += `• Current revenue: $${metrics.current.revenue}\n`;
    response += `• User growth: ${metrics.growth.users}%\n`;
    response += `• Revenue growth: ${metrics.growth.revenue}%\n`;
    
    if (metrics.history.length < 2) {
      response += `\n💡 Tip: Record metrics regularly to see growth trends.`;
    }
    
    return response;
  }
  
  if (lowerMessage.includes('marketing') || lowerMessage.includes('plan')) {
    return `🚀 **Marketing Recommendations:**\n\n` +
      `Based on your ${context.goals.totalCount} goals and ${context.metrics.current.users} users:\n\n` +
      `1. **Content Marketing**: Create content that solves your users' problems\n` +
      `2. **Social Proof**: Share testimonials and success stories\n` +
      `3. **Referrals**: Implement a referral program\n` +
      `4. **SEO**: Optimize your search engine presence\n\n` +
      `💡 Would you like me to go deeper into any specific strategy?`;
  }
  
  // Default response
  return `👋 Hi! I'm your ASTAR Agent.\n\n` +
    `I can help you with:\n` +
    `• 📊 Analyze your goals\n` +
    `• 📈 Review your growth metrics\n` +
    `• 🎯 Create marketing plans\n` +
    `• 💡 Generate content ideas\n\n` +
    `**Your current summary:**\n` +
    `• ${context.goals.totalCount} goals (${context.goals.completionRate}% completed)\n` +
    `• ${context.metrics.current.users} users, $${context.metrics.current.revenue} revenue\n\n` +
    `How can I help you?`;
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
      analysis = generateFallbackResponse('analyze my goals', context);
    } else {
      console.log('[ANALYZE-GOALS] Generating AI response...');
      const systemPrompt = `You are an expert startup analyst. Analyze the user's goals and provide:
1. Current status of each goal with progress percentage
2. Which goals are at risk of not being completed
3. Specific recommendations for improvement
4. Suggested prioritization

Respond in English, be specific and use the provided data.`;

      try {
        analysis = await generateAIResponse(apiKey, systemPrompt, 'Analyze my goals and give me recommendations', context);
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

// Proxy endpoint for brand marketing agent - generate images
app.post('/brand/generate-images', jwtMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { website_url, custom_prompt } = body;

    console.log('[BRAND] User object:', JSON.stringify(user));

    if (!website_url && !custom_prompt) {
      return c.json({ error: 'website_url or custom_prompt is required' }, 400);
    }

    // Get user ID from various possible fields
    const userId = user?.id || user?.userId || user?.sub || '1';

    let railwayUrl = c.env.RAILWAY_API_URL || '';
    if (!railwayUrl) {
      return c.json({ 
        error: 'Railway API not configured',
        message: 'Configure RAILWAY_API_URL in Cloudflare environment variables'
      }, 500);
    }

    if (!railwayUrl.startsWith('http://') && !railwayUrl.startsWith('https://')) {
      railwayUrl = 'https://' + railwayUrl;
    }

    console.log('[BRAND] Calling Railway generate-images:', `${railwayUrl}/api/agents/brand/generate-images`);
    console.log('[BRAND] User ID:', userId);
    console.log('[BRAND] Custom prompt:', custom_prompt);

    const response = await fetch(`${railwayUrl}/api/agents/brand/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website_url: website_url || 'general',
        user_id: String(userId),
        cloudflare_api_url: new URL(c.req.url).origin,
        custom_prompt: custom_prompt || null
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BRAND] Railway error:', response.status, errorText);
      return c.json({ 
        error: 'Railway API error',
        detail: errorText
      }, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('[BRAND] Error calling Railway:', error);
    return c.json({ 
      error: 'Failed to generate images',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
