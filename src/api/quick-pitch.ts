import { Hono } from 'hono';
import type { Bindings } from '../types';

const quickPitch = new Hono<{ Bindings: Bindings }>();

// Simplified pitch creation with AI analysis and auto-redirect to dashboard
quickPitch.post('/submit', async (c) => {
  try {
    console.log('Quick pitch endpoint called');
    
    // Check if GROQ_API_KEY is available
    if (!c.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured!');
      return c.json({ 
        error: 'AI service not configured',
        details: 'GROQ_API_KEY is missing'
      }, 500);
    }
    
    const body = await c.req.json();
    console.log('Request body:', body);
    
    const { 
      idea, 
      problemSolving, 
      targetMarket,
      pricingModel,
      userId,
      email 
    } = body;

    // Require authentication
    if (!userId) {
      return c.json({ 
        error: 'Authentication required',
        message: 'Please sign up or log in to validate your idea',
        requiresAuth: true,
        redirectTo: '/marketplace#signup'
      }, 401);
    }

    if (!idea || !problemSolving || !targetMarket || !pricingModel) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Step 1: AI Analysis using Groq API directly
    const analysisPrompt = `Analiza esta idea de startup y proporciona un análisis breve en formato JSON:

Idea: ${idea}
Problema que resuelve: ${problemSolving}
Mercado objetivo: ${targetMarket}

Devuelve SOLO un objeto JSON con esta estructura (sin markdown, sin explicaciones extra):
{
  "title": "Título corto y atractivo para la startup (máximo 60 caracteres)",
  "description": "Descripción optimizada y profesional (150-200 palabras)",
  "value_proposition": "Propuesta de valor única en una frase impactante",
  "category": "una de estas: saas, ecommerce, fintech, healthtech, edtech, marketplace, social, productivity, entertainment, other",
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "opportunities": ["oportunidad 1", "oportunidad 2"],
  "ai_score": 85
}`;

    console.log('Requesting AI analysis from Groq...');
    
    // Call Groq API directly
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.GROQ_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto analista de startups. Devuelve SOLO JSON válido, sin markdown ni texto adicional.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', await groqResponse.text());
      throw new Error('Failed to get AI analysis');
    }

    const groqData = await groqResponse.json() as any;
    const aiResponse = groqData.choices?.[0]?.message?.content || '{}';
    console.log('AI Response:', aiResponse);

    // Clean the response (remove markdown if present)
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Cleaned response:', cleanedResponse);
      // Fallback analysis
      aiAnalysis = {
        title: idea.substring(0, 60),
        description: `${idea}\n\nProblema: ${problemSolving}\n\nMercado: ${targetMarket}`,
        value_proposition: problemSolving,
        category: 'other',
        strengths: ['Idea innovadora', 'Mercado identificado'],
        opportunities: ['Validación de mercado', 'Desarrollo de MVP'],
        ai_score: 70
      };
    }

    // Step 2: Get or create anonymous user for quick pitches
    let finalUserId = userId;
    
    if (!finalUserId) {
      // Check if anonymous user exists, if not create it
      const anonymousUser = await c.env.DB.prepare(`
        SELECT id FROM users WHERE email = 'anonymous@quickpitch.com' LIMIT 1
      `).first();
      
      if (!anonymousUser) {
        // Create anonymous user
        const newUser = await c.env.DB.prepare(`
          INSERT INTO users (email, username, role, created_at)
          VALUES ('anonymous@quickpitch.com', 'Anonymous Quick Pitch', 'user', CURRENT_TIMESTAMP)
        `).run();
        finalUserId = newUser.meta.last_row_id;
      } else {
        finalUserId = anonymousUser.id;
      }
    }

    // Step 3: Create project in database automatically
    const projectResult = await c.env.DB.prepare(`
      INSERT INTO projects (
        user_id, 
        title, 
        description, 
        target_market, 
        value_proposition, 
        category, 
        status,
        ai_analysis,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
    `).bind(
      finalUserId,
      aiAnalysis.title,
      aiAnalysis.description,
      targetMarket,
      aiAnalysis.value_proposition,
      aiAnalysis.category || 'other',
      JSON.stringify({
        strengths: aiAnalysis.strengths || [],
        opportunities: aiAnalysis.opportunities || [],
        ai_score: aiAnalysis.ai_score || 70,
        original_idea: idea,
        problem_solving: problemSolving
      })
    ).run();

    const projectId = projectResult.meta.last_row_id;

    console.log('Project created successfully:', projectId);

    // Step 4: Also create entry in beta_products to make it visible in marketplace
    const productResult = await c.env.DB.prepare(`
      INSERT INTO beta_products (
        company_user_id,
        title,
        description,
        category,
        stage,
        looking_for,
        compensation_type,
        pricing_model,
        duration_days,
        validators_needed,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, 'alpha', 'General feedback and validation', 'free_access', ?, 14, 5, 'active', CURRENT_TIMESTAMP)
    `).bind(
      finalUserId,
      aiAnalysis.title,
      aiAnalysis.description,
      aiAnalysis.category || 'other',
      pricingModel
    ).run();

    const productId = productResult.meta.last_row_id;

    console.log('Product created in marketplace:', productId);

    console.log('Product created in marketplace:', productId);

    // Step 5: Return success with redirect info
    return c.json({
      success: true,
      message: 'Pitch analyzed and project created successfully!',
      projectId,
      productId, // ID in marketplace
      analysis: aiAnalysis,
      redirectTo: '/marketplace#my-dashboard', // Redirect to personal dashboard with goals
      nextStep: {
        action: 'dashboard',
        message: 'Your project is now live in the marketplace! Set up your goals and start tracking your progress.'
      }
    });

  } catch (error) {
    console.error('Error in quick pitch:', error);
    return c.json({ 
      error: 'Failed to process pitch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default quickPitch;
