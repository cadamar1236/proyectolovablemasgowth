import { Hono } from 'hono';
import type { Bindings } from '../types';
import { analyzeWithGroq, generateMVPWithGroq } from '../utils/groq';

const validation = new Hono<{ Bindings: Bindings }>();

// AI Analysis Function with Groq API
async function analyzeWithAI(project: any, groqApiKey?: string): Promise<any | null> {
  if (!groqApiKey) return null;
  
  try {
    return await analyzeWithGroq(project, groqApiKey);
  } catch (error) {
    console.error('Groq API error:', error);
    return null;
  }
}

// Legacy Cloudflare AI function (fallback)
async function analyzeWithCloudflareAI(project: any, AI?: Ai): Promise<any | null> {
  if (!AI) return null;
  
  try {
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

    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a startup validation expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
    });
    
    const responseText = response.response || JSON.stringify(response);
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return null;
  }
}

// Smart Analysis Generator (cuando AI no está disponible)
function generateSmartAnalysis(project: any): any {
  const keywords = `${project.title} ${project.description} ${project.target_market}`.toLowerCase();
  
  // Análisis inteligente basado en keywords
  const isHealthTech = keywords.includes('health') || keywords.includes('medical') || keywords.includes('salud');
  const isFinTech = keywords.includes('fintech') || keywords.includes('financial') || keywords.includes('payment');
  const isSaaS = keywords.includes('saas') || keywords.includes('software') || keywords.includes('platform');
  const isEcommerce = keywords.includes('ecommerce') || keywords.includes('marketplace') || keywords.includes('shop');
  const isAI = keywords.includes('ai') || keywords.includes('inteligencia') || keywords.includes('machine learning');
  
  let analysis = {
    competitors: [] as string[],
    market_trends: [] as string[],
    opportunities: [] as string[],
    threats: [] as string[],
    market_size: '',
    growth_rate: '',
    success_probability: 0.65
  };
  
  if (isHealthTech) {
    analysis = {
      competitors: ['Teladoc Health', 'Amwell', 'Doctor on Demand', 'HealthTap', 'MDLive'],
      market_trends: [
        'Telemedicina creciendo 38% anual post-COVID',
        'IA en diagnósticos alcanza $36B en 2025',
        'Regulaciones favorables para salud digital',
        'Wearables integrados con plataformas médicas',
        'Adopción masiva de historiales clínicos digitales'
      ],
      opportunities: [
        'Mercado LATAM menos saturado que USA',
        'Necesidad de soluciones en español',
        'Partnerships con aseguradoras y hospitales',
        'Integración con sistemas de salud existentes',
        'Prevención vs tratamiento es tendencia'
      ],
      threats: [
        'Competidores con más funding (Series C+)',
        'Regulaciones estrictas de datos médicos (HIPAA)',
        'Resistencia de médicos tradicionales',
        'Necesidad de certificaciones médicas',
        'Responsabilidad legal en diagnósticos'
      ],
      market_size: '$254B mercado global de HealthTech para 2027',
      growth_rate: '37% CAGR',
      success_probability: 0.73
    };
  } else if (isFinTech) {
    analysis = {
      competitors: ['Stripe', 'Square', 'PayPal', 'Revolut', 'Wise'],
      market_trends: [
        'Pagos digitales crecen 20% anual',
        'Open Banking revoluciona servicios financieros',
        'Crypto y blockchain mainstream',
        'Buy Now Pay Later (BNPL) en auge',
        'Banking as a Service (BaaS) democratiza finanzas'
      ],
      opportunities: [
        'Underbanked populations en LATAM',
        'Remesas internacionales caras y lentas',
        'SMBs necesitan mejores herramientas financieras',
        'Millennials prefieren apps vs bancos',
        'Regulación favorable (PSD2, Open Banking)'
      ],
      threats: [
        'Regulaciones financieras complejas',
        'Bancos tradicionales digitalizándose',
        'Ciberseguridad es crítica',
        'Alto costo de adquisición de usuarios',
        'Necesidad de licencias bancarias'
      ],
      market_size: '$305B mercado global de FinTech para 2025',
      growth_rate: '23% CAGR',
      success_probability: 0.68
    };
  } else if (isSaaS) {
    analysis = {
      competitors: ['Salesforce', 'HubSpot', 'Monday.com', 'Notion', 'Airtable'],
      market_trends: [
        'SaaS alcanza $195B en 2023',
        'Shift hacia vertical SaaS especializado',
        'AI-powered features son must-have',
        'Product-Led Growth (PLG) domina',
        'Multi-cloud y APIs abiertas'
      ],
      opportunities: [
        'Nichos verticales sin soluciones específicas',
        'Integraciones y APIs demandadas',
        'Freemium funciona para user acquisition',
        'Remote work impulsa herramientas colaborativas',
        'Menor costo de infraestructura (cloud)'
      ],
      threats: [
        'Saturación de mercado en categorías populares',
        'Giants pueden copiar features rápido',
        'Churn alto si no hay product-market fit',
        'Customer acquisition cost (CAC) alto',
        'Necesidad de escalabilidad técnica'
      ],
      market_size: '$232B mercado SaaS global para 2024',
      growth_rate: '18% CAGR',
      success_probability: 0.71
    };
  } else if (isEcommerce) {
    analysis = {
      competitors: ['Shopify', 'WooCommerce', 'Amazon', 'MercadoLibre', 'Etsy'],
      market_trends: [
        'E-commerce crece 14% anual globalmente',
        'Social commerce (TikTok, Instagram)',
        'Headless commerce arquitectures',
        'Sustainability en packaging y shipping',
        'AR/VR para try-before-buy'
      ],
      opportunities: [
        'D2C brands evitan intermediarios',
        'Micro-influencers marketing',
        'Nicho específico vs generalista',
        'Suscripciones y recurring revenue',
        'Cross-border commerce facilitado'
      ],
      threats: [
        'Amazon dominance en muchas categorías',
        'Logística y fulfillment complejo',
        'Márgenes bajos en productos físicos',
        'Retornos y customer service costoso',
        'Competencia en precio es brutal'
      ],
      market_size: '$5.5T ventas e-commerce globales en 2024',
      growth_rate: '14% CAGR',
      success_probability: 0.64
    };
  } else if (isAI) {
    analysis = {
      competitors: ['OpenAI', 'Anthropic', 'Google AI', 'Hugging Face', 'Cohere'],
      market_trends: [
        'IA generativa crece 80% anual',
        'LLMs open source democratizan acceso',
        'AI agents y automatización',
        'Edge AI y on-device processing',
        'Multimodal AI (texto, imagen, audio)'
      ],
      opportunities: [
        'Aplicaciones específicas de industria',
        'Fine-tuning para casos de uso nicho',
        'AI tooling y infrastructure',
        'Privacidad y data sovereignty',
        'Vertical AI solutions para empresas'
      ],
      threats: [
        'Big Tech domina investigación',
        'Costos de compute altos',
        'Regulaciones AI emergentes',
        'Talent war por AI engineers',
        'Cambios rápidos en tecnología'
      ],
      market_size: '$184B mercado de AI para 2024',
      growth_rate: '37% CAGR',
      success_probability: 0.78
    };
  } else {
    // Análisis genérico para otros casos
    analysis = {
      competitors: ['Competidor A (líder)', 'Competidor B (innovador)', 'Competidor C (low-cost)', 'Startup emergente D', 'Player tradicional E'],
      market_trends: [
        'Digitalización acelerada post-pandemia',
        'Consumidores demandan experiencias personalizadas',
        'Sostenibilidad es factor de decisión',
        'Mobile-first es el estándar',
        'Automatización reduce costos operativos'
      ],
      opportunities: [
        'Mercado fragmentado con espacio para nuevos players',
        'Tecnología permite diferenciación',
        'Cambio de comportamiento del consumidor',
        'Posibilidad de partnerships estratégicos',
        'Funding disponible para ideas validadas'
      ],
      threats: [
        'Competencia de incumbents establecidos',
        'Barreras de entrada en distribución',
        'Ciclos económicos afectan demanda',
        'Necesidad de capital para escalar',
        'Cambios regulatorios pueden impactar'
      ],
      market_size: '$1B+ mercado potencial',
      growth_rate: '15-25% CAGR estimado',
      success_probability: 0.65
    };
  }
  
  // Ajustar probabilidad basada en descripción
  if (project.value_proposition.length > 100) {
    analysis.success_probability += 0.05; // Propuesta bien definida
  }
  if (project.target_market.toLowerCase().includes('latam') || project.target_market.toLowerCase().includes('europa')) {
    analysis.success_probability += 0.03; // Mercados específicos
  }
  
  // Cap probability
  analysis.success_probability = Math.min(analysis.success_probability, 0.92);
  
  return analysis;
}

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
    // Try Groq first (fastest and most powerful)
    let analysis = await analyzeWithAI(project, c.env.GROQ_API_KEY);
    
    // Fallback to Cloudflare AI if Groq fails
    if (!analysis && c.env.AI) {
      analysis = await analyzeWithCloudflareAI(project, c.env.AI);
    }
    
    // Final fallback: use smart analysis based on project data
    if (!analysis) {
      analysis = generateSmartAnalysis(project);
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
    let mvp;
    
    // Try Groq first
    if (c.env.GROQ_API_KEY) {
      try {
        mvp = await generateMVPWithGroq(project, c.env.GROQ_API_KEY);
      } catch (groqError) {
        console.error('Groq MVP generation failed:', groqError);
      }
    }
    
    // Fallback to generic MVP if Groq fails
    if (!mvp) {
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

// Get all available validators
validation.get('/validators', async (c) => {
  console.log('[VALIDATION] Getting validators list');
  const db = c.env.DB;
  
  try {
    // First check if validators table exists
    const tableCheck = await db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='validators'
    `).first();
    
    if (!tableCheck) {
      console.log('[VALIDATION] Validators table does not exist yet');
      return c.json([]);
    }
    
    // Get all validators with user info
    const result = await db.prepare(`
      SELECT 
        v.id,
        v.user_id,
        v.title,
        v.expertise,
        v.bio,
        v.rating,
        v.total_validations,
        v.response_rate,
        v.avg_response_time,
        v.available,
        v.hourly_rate,
        u.name,
        u.email,
        u.avatar_url,
        u.created_at
      FROM validators v
      JOIN users u ON v.user_id = u.id
      WHERE v.available = 1
      ORDER BY v.rating DESC, v.total_validations DESC
    `).all();
    
    console.log('[VALIDATION] Found validators:', result.results?.length || 0);
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('[VALIDATION] Error fetching validators:', error);
    // Return empty array instead of error to prevent UI breaking
    return c.json([]);
  }
});

export default validation;
