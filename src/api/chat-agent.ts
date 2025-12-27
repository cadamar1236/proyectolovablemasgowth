import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import type { Bindings, AuthContext } from '../types';
import { MarketingOrchestrator, buildAgentContext, extractCommand } from '../utils/marketing-agent';

// Define the context type for this app
type Variables = {
  user: AuthContext;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS
app.use('*', cors());

// JWT middleware
const jwtMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET) as AuthContext;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Get chat history
app.get('/history', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    const messages = await c.env.DB.prepare(`
      SELECT * FROM chat_messages
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.userId).all();

    return c.json({
      messages: messages.results.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })).reverse()
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return c.json({ error: 'Failed to fetch chat history' }, 500);
  }
});

// Send message and get AI response
app.post('/message', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { message, projectId, context } = await c.req.json();

  try {
    // Save user message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, project_id, role, content, created_at)
      VALUES (?, ?, 'user', ?, datetime('now'))
    `).bind(user.userId, projectId || null, message).run();

    // Fetch user's goals for marketing agent context
    const goalsResult = await c.env.DB.prepare(`
      SELECT * FROM dashboard_goals 
      WHERE user_id = ? AND status != 'deleted'
      ORDER BY created_at DESC
    `).bind(user.userId).all();

    const goals = goalsResult.results || [];

    // Build agent context
    const agentContext = buildAgentContext(user.userId, goals as any);

    // Initialize marketing orchestrator with Groq
    const marketingAgent = new MarketingOrchestrator(c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY);

    // Check for special commands
    const { command, params } = extractCommand(message);

    let assistantMessage = '';
    let goalsUpdated = false;

    // Handle special commands
    if (command === 'analyze_goals') {
      assistantMessage = await marketingAgent.analyzeGoalsAndSuggest(agentContext);
    } else if (command === 'marketing_plan') {
      assistantMessage = await marketingAgent.generateMarketingPlan(agentContext, params.timeframe);
    } else if (command === 'content_ideas') {
      assistantMessage = await marketingAgent.generateContentIdeas(agentContext, params.platform, params.quantity);
    } else if (command === 'competition_analysis') {
      // Extract competitors from message if mentioned
      assistantMessage = await marketingAgent.processRequest(message, agentContext);
    } else {
      // Normal conversation - let orchestrator decide which agent to use
      assistantMessage = await marketingAgent.processRequest(message, agentContext);
    }

    // Save assistant response
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, project_id, role, content, created_at)
      VALUES (?, ?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, projectId || null, assistantMessage).run();

    // Check if we need to perform actions (create/update goals)
    const lowerMessage = message.toLowerCase();
    
    // Detect goal creation intent
    if (lowerMessage.includes('crear objetivo') || lowerMessage.includes('nuevo objetivo') || 
        lowerMessage.includes('agregar objetivo')) {
      goalsUpdated = true;
      
      // Extract goal details and create
      // This is a basic implementation - enhance with better NLP
      const targetMatch = message.match(/(\d+)/);
      if (targetMatch) {
        const description = message.split('objetivo')[1]?.trim() || 'Objetivo sin descripción';
        await c.env.DB.prepare(`
          INSERT INTO dashboard_goals (
            user_id, description, target_value, current_value, 
            status, created_at
          ) VALUES (?, ?, ?, 0, 'active', datetime('now'))
        `).bind(user.userId, description, parseInt(targetMatch[1])).run();
      }
    }

    // Detect progress update intent
    if (lowerMessage.includes('actualizar') || lowerMessage.includes('registrar progreso') ||
        lowerMessage.includes('completé') || lowerMessage.includes('logré')) {
      goalsUpdated = true;
    }

    return c.json({
      message: assistantMessage,
      goalsUpdated
    });

  } catch (error) {
    console.error('Error processing message:', error);
    return c.json({ 
      message: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
      goalsUpdated: false
    }, 500);
  }
});

// Create goal via chat command
app.post('/create-goal', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { description, targetValue, deadline, category, projectId } = await c.req.json();

  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO dashboard_goals (
        user_id, project_id, description, target_value, 
        current_value, deadline, status, category, created_at
      ) VALUES (?, ?, ?, ?, 0, ?, 'pending', ?, datetime('now'))
    `).bind(
      user.userId,
      projectId || null,
      description,
      targetValue,
      deadline,
      category || 'general'
    ).run();

    return c.json({
      success: true,
      goalId: result.meta.last_row_id,
      message: `Objetivo creado: "${description}"`
    });

  } catch (error) {
    console.error('Error creating goal:', error);
    return c.json({ error: 'Failed to create goal' }, 500);
  }
});

// Update goal progress via chat command
app.post('/update-goal', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { goalId, currentValue, status } = await c.req.json();

  try {
    // Verify goal ownership
    const goal = await c.env.DB.prepare(`
      SELECT * FROM dashboard_goals WHERE id = ? AND user_id = ?
    `).bind(goalId, user.userId).first();

    if (!goal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    // Update goal
    await c.env.DB.prepare(`
      UPDATE dashboard_goals 
      SET current_value = ?, 
          status = CASE 
            WHEN ? >= target_value THEN 'completed'
            WHEN ? IS NOT NULL THEN ?
            ELSE status
          END,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      currentValue,
      currentValue,
      status,
      status,
      goalId
    ).run();

    return c.json({
      success: true,
      message: 'Progreso actualizado correctamente'
    });

  } catch (error) {
    console.error('Error updating goal:', error);
    return c.json({ error: 'Failed to update goal' }, 500);
  }
});

// Clear chat history
app.delete('/history', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;

  try {
    await c.env.DB.prepare(`
      DELETE FROM chat_messages WHERE user_id = ?
    `).bind(user.userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return c.json({ error: 'Failed to clear chat history' }, 500);
  }
});

// ============================================
// MARKETING AGENT SPECIALIZED ENDPOINTS
// ============================================

// Analyze goals and get marketing recommendations
app.post('/analyze-goals', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;

  try {
    // Fetch user's goals
    const goalsResult = await c.env.DB.prepare(`
      SELECT * FROM dashboard_goals 
      WHERE user_id = ? AND status != 'deleted'
      ORDER BY created_at DESC
    `).bind(user.userId).all();

    const goals = goalsResult.results || [];
    const agentContext = buildAgentContext(user.userId, goals as any);

    // Initialize marketing agent
    const marketingAgent = new MarketingOrchestrator(c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY);

    // Get analysis and recommendations
    const analysis = await marketingAgent.analyzeGoalsAndSuggest(agentContext);

    // Save as chat message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, role, content, created_at)
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
    // Fetch user's goals
    const goalsResult = await c.env.DB.prepare(`
      SELECT * FROM dashboard_goals 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `).bind(user.userId).all();

    const goals = goalsResult.results || [];
    const agentContext = buildAgentContext(user.userId, goals as any);

    // Initialize marketing agent
    const marketingAgent = new MarketingOrchestrator(c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY);

    // Generate plan
    const plan = await marketingAgent.generateMarketingPlan(agentContext, timeframe || '30 días');

    // Save as chat message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, role, content, created_at)
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
    // Fetch user's goals
    const goalsResult = await c.env.DB.prepare(`
      SELECT * FROM dashboard_goals 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `).bind(user.userId).all();

    const goals = goalsResult.results || [];
    const agentContext = buildAgentContext(user.userId, goals as any);

    // Initialize marketing agent
    const marketingAgent = new MarketingOrchestrator(c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY);

    // Generate ideas
    const ideas = await marketingAgent.generateContentIdeas(
      agentContext, 
      platform || 'redes sociales', 
      quantity || 10
    );

    // Save as chat message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, role, content, created_at)
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
    // Fetch user's goals
    const goalsResult = await c.env.DB.prepare(`
      SELECT * FROM dashboard_goals 
      WHERE user_id = ? AND status != 'deleted'
      ORDER BY created_at DESC
    `).bind(user.userId).all();

    const goals = goalsResult.results || [];
    const agentContext = buildAgentContext(user.userId, goals as any);

    // Initialize marketing agent
    const marketingAgent = new MarketingOrchestrator(c.env.GROQ_API_KEY || c.env.OPENAI_API_KEY);

    // Analyze competition
    const analysis = await marketingAgent.analyzeCompetition(
      agentContext,
      competitors || [],
      industry || 'tu industria'
    );

    // Save as chat message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (user_id, role, content, created_at)
      VALUES (?, 'assistant', ?, datetime('now'))
    `).bind(user.userId, analysis).run();

    return c.json({ analysis });
  } catch (error) {
    console.error('Error analyzing competition:', error);
    return c.json({ error: 'Failed to analyze competition' }, 500);
  }
});

export default app;