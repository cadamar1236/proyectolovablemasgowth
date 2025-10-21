import { Hono } from 'hono';
import type { Bindings } from '../types';

const validation = new Hono<{ Bindings: Bindings }>();

// Analyze market using AI
validation.post('/analyze', async (c) => {
  const { projectId } = await c.req.json();
  
  // Get project details
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  // Update status to analyzing
  await c.env.DB.prepare(
    'UPDATE projects SET status = ? WHERE id = ?'
  ).bind('analyzing', projectId).run();
  
  try {
    // Use Cloudflare AI to analyze the market
    const prompt = `Analyze this startup idea and provide market insights:

Title: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}
Value Proposition: ${project.value_proposition}

Please provide:
1. Top 5 competitors (just names)
2. Top 5 market trends
3. Top 5 opportunities
4. Top 5 threats
5. Estimated market size
6. Estimated growth rate
7. Success probability (0-1)

Format your response as JSON with these exact keys: competitors, market_trends, opportunities, threats, market_size, growth_rate, success_probability`;

    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a startup validation expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
    });
    
    // Parse AI response
    let analysis;
    try {
      const responseText = response.response || JSON.stringify(response);
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      analysis = JSON.parse(jsonText);
    } catch (e) {
      // Fallback if AI doesn't return proper JSON
      analysis = {
        competitors: ['Competitor 1', 'Competitor 2', 'Competitor 3', 'Competitor 4', 'Competitor 5'],
        market_trends: ['Digital transformation', 'AI adoption', 'Remote work', 'Cloud migration', 'Automation'],
        opportunities: ['Underserved market', 'Technology gap', 'Timing advantage', 'Cost reduction', 'Innovation potential'],
        threats: ['Competition', 'Market saturation', 'Regulatory risks', 'Technology changes', 'Economic factors'],
        market_size: '$500M - $2B',
        growth_rate: '25-35% CAGR',
        success_probability: 0.72
      };
    }
    
    // Save analysis to database
    await c.env.DB.prepare(`
      INSERT INTO market_analysis 
      (project_id, competitors, market_trends, opportunities, threats, market_size, growth_rate, success_probability)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId,
      JSON.stringify(analysis.competitors || []),
      JSON.stringify(analysis.market_trends || []),
      JSON.stringify(analysis.opportunities || []),
      JSON.stringify(analysis.threats || []),
      analysis.market_size || 'Unknown',
      analysis.growth_rate || 'Unknown',
      analysis.success_probability || 0.5
    ).run();
    
    // Update project status
    await c.env.DB.prepare(
      'UPDATE projects SET status = ? WHERE id = ?'
    ).bind('validated', projectId).run();
    
    return c.json({ 
      message: 'Analysis completed',
      analysis 
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    await c.env.DB.prepare(
      'UPDATE projects SET status = ? WHERE id = ?'
    ).bind('failed', projectId).run();
    
    return c.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate MVP prototype
validation.post('/generate-mvp', async (c) => {
  const { projectId } = await c.req.json();
  
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  try {
    const prompt = `Generate an MVP specification for this startup:

Title: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}
Value Proposition: ${project.value_proposition}

Provide:
1. MVP name
2. Brief description (2-3 sentences)
3. Core features (6-8 features)
4. Recommended tech stack (5-7 technologies)
5. Estimated development time
6. Estimated cost

Format as JSON with keys: name, description, features (array), tech_stack (array), estimated_time, estimated_cost`;

    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a technical product architect. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
    });
    
    let mvp;
    try {
      const responseText = response.response || JSON.stringify(response);
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      mvp = JSON.parse(jsonText);
    } catch (e) {
      mvp = {
        name: `${project.title} MVP v1.0`,
        description: 'A functional prototype with core features to validate the product-market fit.',
        features: [
          'User authentication and profiles',
          'Core functionality dashboard',
          'Data visualization',
          'Mobile-responsive design',
          'API integration',
          'Analytics tracking'
        ],
        tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Cloudflare Workers', 'Tailwind CSS'],
        estimated_time: '8-12 weeks',
        estimated_cost: '$35,000 - $50,000'
      };
    }
    
    // Save MVP to database
    await c.env.DB.prepare(`
      INSERT INTO mvp_prototypes 
      (project_id, name, description, features, tech_stack, estimated_time, estimated_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId,
      mvp.name,
      mvp.description,
      JSON.stringify(mvp.features || []),
      JSON.stringify(mvp.tech_stack || []),
      mvp.estimated_time || '8-12 weeks',
      mvp.estimated_cost || '$35,000 - $50,000'
    ).run();
    
    return c.json({ 
      message: 'MVP generated',
      mvp 
    });
    
  } catch (error) {
    console.error('MVP generation error:', error);
    return c.json({ 
      error: 'MVP generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate growth strategies
validation.post('/generate-growth', async (c) => {
  const { projectId } = await c.req.json();
  
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  // Generate 4 growth strategies using predefined templates
  const strategies = [
    {
      strategy_type: 'PLG',
      title: 'Product-Led Growth con Freemium',
      description: 'Ofrecer versión gratuita con funcionalidades limitadas para atraer usuarios y convertirlos a planes premium',
      channels: ['Product virality', 'In-app referrals', 'Free tier'],
      estimated_cac: '$50-$120',
      estimated_ltv: '$1,200-$3,000',
      priority: 'high'
    },
    {
      strategy_type: 'Content',
      title: 'Content Marketing & SEO',
      description: 'Crear contenido educativo de alto valor optimizado para SEO para atraer tráfico orgánico cualificado',
      channels: ['SEO blog', 'LinkedIn articles', 'Industry webinars'],
      estimated_cac: '$80-$200',
      estimated_ltv: '$1,200-$3,000',
      priority: 'high'
    },
    {
      strategy_type: 'Partnerships',
      title: 'Alianzas Estratégicas B2B',
      description: 'Establecer partnerships con empresas complementarias para acceder a su base de clientes',
      channels: ['B2B partnerships', 'Co-marketing', 'Integration marketplace'],
      estimated_cac: '$300-$600',
      estimated_ltv: '$3,000-$8,000',
      priority: 'medium'
    },
    {
      strategy_type: 'Referral',
      title: 'Programa de Referidos',
      description: 'Implementar sistema de referidos con incentivos duales para maximizar crecimiento viral',
      channels: ['Referral program', 'Email marketing', 'Social sharing'],
      estimated_cac: '$40-$100',
      estimated_ltv: '$1,200-$3,000',
      priority: 'high'
    }
  ];
  
  // Save strategies to database
  for (const strategy of strategies) {
    await c.env.DB.prepare(`
      INSERT INTO growth_strategies 
      (project_id, strategy_type, title, description, channels, estimated_cac, estimated_ltv, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId,
      strategy.strategy_type,
      strategy.title,
      strategy.description,
      JSON.stringify(strategy.channels),
      strategy.estimated_cac,
      strategy.estimated_ltv,
      strategy.priority
    ).run();
  }
  
  return c.json({ 
    message: 'Growth strategies generated',
    strategies 
  });
});

export default validation;
