/**
 * Marketing Multi-Agent System with Agno Framework + Groq
 * 
 * Sistema de marketing inteligente que se comunica con los objetivos del dashboard
 * y usa Groq para análisis de mercado, creación de contenido y estrategias
 */

// Import Groq SDK - Install with: npm install groq-sdk
// If not installed, the system will show a clear error at runtime
type Groq = any; // Temporary type until groq-sdk is installed

// ============================================
// TYPES & INTERFACES
// ============================================

interface Goal {
  id: number;
  user_id: number;
  description: string;
  target_value: number;
  current_value: number;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

interface MarketingTask {
  id: string;
  type: 'market_research' | 'content_creation' | 'strategy' | 'social_media';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  goal_id?: number;
  prompt: string;
  result?: string;
  created_at: string;
  completed_at?: string;
}

interface AgentContext {
  userId: number;
  goals: Goal[];
  metrics: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    completionRate: number;
  };
  recentActions: string[];
}

// ============================================
// GROQ CLIENT CONFIGURATION
// ============================================

class GroqClient {
  private client: any;
  private model: string = 'openai/gpt-oss-20b'; // Modelo principal de Groq
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Lazy load Groq SDK to avoid import errors if not installed
    try {
      // @ts-ignore - Dynamic import
      const Groq = require('groq-sdk').default || require('groq-sdk');
      this.client = new Groq({ apiKey });
    } catch (error) {
      console.error('Groq SDK not installed. Run: npm install groq-sdk');
      throw new Error('Groq SDK required. Install with: npm install groq-sdk');
    }
  }

  async chat(messages: Array<{ role: string; content: string }>, temperature: number = 0.7): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: messages as any,
        model: this.model,
        temperature,
        max_tokens: 4000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error(`Groq API failed: ${error}`);
    }
  }
}

// ============================================
// SPECIALIZED AGENTS
// ============================================

class MarketResearchAgent {
  private groq: GroqClient;
  private name: string = 'Market Research Specialist';

  constructor(groq: GroqClient) {
    this.groq = groq;
  }

  async analyze(context: AgentContext, userPrompt: string): Promise<string> {
    const systemPrompt = `Eres un experto analista de mercado especializado en ayudar a emprendedores y startups.

CONTEXTO DEL USUARIO:
- Total de objetivos: ${context.metrics.totalGoals}
- Objetivos activos: ${context.metrics.activeGoals}
- Tasa de completitud: ${context.metrics.completionRate}%

OBJETIVOS ACTUALES:
${context.goals.map(g => `• ${g.description} (${g.current_value}/${g.target_value})`).join('\n')}

Tu tarea es proporcionar análisis de mercado accionables que ayuden al usuario a alcanzar sus objetivos.
Enfócate en tendencias, competencia, oportunidades y estrategias data-driven.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.groq.chat(messages, 0.5);
  }
}

class ContentCreationAgent {
  private groq: GroqClient;
  private name: string = 'Content Creator';

  constructor(groq: GroqClient) {
    this.groq = groq;
  }

  async create(context: AgentContext, userPrompt: string): Promise<string> {
    const systemPrompt = `Eres un creador de contenido estratégico experto en marketing digital.

CONTEXTO DEL USUARIO:
- Objetivos activos: ${context.metrics.activeGoals}
- Tasa de completitud: ${context.metrics.completionRate}%

OBJETIVOS ACTUALES:
${context.goals.map(g => `• ${g.description} (${g.current_value}/${g.target_value})`).join('\n')}

Crea contenido atractivo, optimizado para conversión y alineado con los objetivos del usuario.
Incluye llamadas a la acción, hashtags relevantes y mejores prácticas de cada plataforma.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.groq.chat(messages, 0.8);
  }
}

class StrategyAgent {
  private groq: GroqClient;
  private name: string = 'Marketing Strategist';

  constructor(groq: GroqClient) {
    this.groq = groq;
  }

  async strategize(context: AgentContext, userPrompt: string): Promise<string> {
    const systemPrompt = `Eres un estratega de marketing con experiencia en crecimiento y optimización.

CONTEXTO DEL USUARIO:
- Total de objetivos: ${context.metrics.totalGoals}
- Objetivos completados: ${context.metrics.completedGoals}
- Objetivos activos: ${context.metrics.activeGoals}
- Tasa de completitud: ${context.metrics.completionRate}%

OBJETIVOS ACTUALES:
${context.goals.map(g => `• ${g.description} (Progreso: ${Math.round((g.current_value/g.target_value)*100)}%)`).join('\n')}

Desarrolla estrategias de marketing basadas en datos, con enfoque en ROI y métricas medibles.
Proporciona planes de acción específicos, temporales y alineados con los objetivos actuales.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.groq.chat(messages, 0.6);
  }
}

class SocialMediaAgent {
  private groq: GroqClient;
  private name: string = 'Social Media Manager';

  constructor(groq: GroqClient) {
    this.groq = groq;
  }

  async manage(context: AgentContext, userPrompt: string): Promise<string> {
    const systemPrompt = `Eres un experto en social media marketing y community management.

CONTEXTO DEL USUARIO:
- Objetivos activos: ${context.metrics.activeGoals}
- Tasa de completitud: ${context.metrics.completionRate}%

OBJETIVOS ACTUALES:
${context.goals.map(g => `• ${g.description} (${g.current_value}/${g.target_value})`).join('\n')}

Proporciona estrategias de redes sociales, calendarios de contenido, análisis de tendencias
y recomendaciones específicas para aumentar engagement y conversión.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.groq.chat(messages, 0.7);
  }
}

// ============================================
// MARKETING ORCHESTRATOR AGENT
// ============================================

export class MarketingOrchestrator {
  private groq: GroqClient;
  private researchAgent: MarketResearchAgent;
  private contentAgent: ContentCreationAgent;
  private strategyAgent: StrategyAgent;
  private socialAgent: SocialMediaAgent;

  constructor(groqApiKey: string) {
    this.groq = new GroqClient(groqApiKey);
    this.researchAgent = new MarketResearchAgent(this.groq);
    this.contentAgent = new ContentCreationAgent(this.groq);
    this.strategyAgent = new StrategyAgent(this.groq);
    this.socialAgent = new SocialMediaAgent(this.groq);
  }

  /**
   * Procesa una solicitud del usuario y delega al agente apropiado
   */
  async processRequest(userMessage: string, context: AgentContext): Promise<string> {
    // Determinar qué agente debe manejar la solicitud
    const agentType = await this.classifyRequest(userMessage);

    console.log(`[Marketing Orchestrator] Delegating to: ${agentType}`);

    switch (agentType) {
      case 'market_research':
        return await this.researchAgent.analyze(context, userMessage);
      
      case 'content_creation':
        return await this.contentAgent.create(context, userMessage);
      
      case 'strategy':
        return await this.strategyAgent.strategize(context, userMessage);
      
      case 'social_media':
        return await this.socialAgent.manage(context, userMessage);
      
      default:
        // Si no es claro, usar el agente de estrategia general
        return await this.strategyAgent.strategize(context, userMessage);
    }
  }

  /**
   * Clasifica la solicitud del usuario para determinar qué agente debe responder
   */
  private async classifyRequest(userMessage: string): Promise<MarketingTask['type']> {
    const classificationPrompt = `Clasifica la siguiente solicitud de marketing en una de estas categorías:
- market_research: Análisis de mercado, competencia, tendencias, datos
- content_creation: Crear posts, artículos, copys, contenido visual
- strategy: Estrategias generales, planes de marketing, objetivos
- social_media: Redes sociales, engagement, community management

Solicitud: "${userMessage}"

Responde SOLO con la categoría exacta (market_research, content_creation, strategy o social_media):`;

    const messages = [
      { role: 'user', content: classificationPrompt }
    ];

    const response = await this.groq.chat(messages, 0.3);
    const classification = response.trim().toLowerCase();

    if (classification.includes('market_research') || classification.includes('research')) {
      return 'market_research';
    } else if (classification.includes('content') || classification.includes('crear')) {
      return 'content_creation';
    } else if (classification.includes('social')) {
      return 'social_media';
    } else {
      return 'strategy';
    }
  }

  /**
   * Analiza todos los objetivos del usuario y proporciona un reporte completo
   */
  async analyzeGoalsAndSuggest(context: AgentContext): Promise<string> {
    const systemPrompt = `Eres un asesor de marketing estratégico. Analiza los objetivos del usuario y proporciona:

MÉTRICAS ACTUALES:
- Total de objetivos: ${context.metrics.totalGoals}
- Objetivos completados: ${context.metrics.completedGoals}
- Objetivos activos: ${context.metrics.activeGoals}
- Tasa de completitud: ${context.metrics.completionRate}%

OBJETIVOS ACTUALES:
${context.goals.map(g => `
• ${g.description}
  - Progreso: ${g.current_value}/${g.target_value} (${Math.round((g.current_value/g.target_value)*100)}%)
  - Deadline: ${g.deadline}
  - Estado: ${g.status}
`).join('\n')}

Proporciona:
1. Análisis del progreso actual
2. Objetivos en riesgo (si hay alguno cerca del deadline sin completar)
3. Recomendaciones específicas para acelerar el progreso
4. Nuevas oportunidades de marketing alineadas con estos objetivos
5. Métricas clave a monitorear

Sé específico, accionable y enfocado en resultados.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analiza mis objetivos actuales y dame recomendaciones' }
    ];

    return await this.groq.chat(messages, 0.6);
  }

  /**
   * Genera un plan de marketing completo basado en los objetivos
   */
  async generateMarketingPlan(context: AgentContext, timeframe: string = '30 días'): Promise<string> {
    const systemPrompt = `Crea un plan de marketing completo para los próximos ${timeframe}.

CONTEXTO:
- Total de objetivos: ${context.metrics.totalGoals}
- Objetivos activos: ${context.metrics.activeGoals}
- Tasa de completitud: ${context.metrics.completionRate}%

OBJETIVOS A ALCANZAR:
${context.goals.filter(g => g.status === 'active').map(g => `
• ${g.description}
  - Meta: ${g.target_value}
  - Progreso actual: ${g.current_value}
  - Falta: ${g.target_value - g.current_value}
  - Deadline: ${g.deadline}
`).join('\n')}

Genera un plan que incluya:
1. **Estrategia General**: Enfoque principal y prioridades
2. **Calendario Semanal**: Acciones específicas semana por semana
3. **Canales de Marketing**: Qué usar y por qué
4. **Contenido Requerido**: Tipos y cantidad de contenido a crear
5. **Presupuesto Estimado**: Inversión recomendada
6. **Métricas de Éxito**: KPIs a monitorear
7. **Acciones Inmediatas**: Primeros 3 pasos a ejecutar HOY

Sé extremadamente específico y práctico.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Crea un plan de marketing para ${timeframe}` }
    ];

    return await this.groq.chat(messages, 0.7);
  }

  /**
   * Genera ideas de contenido basadas en objetivos actuales
   */
  async generateContentIdeas(context: AgentContext, platform: string, quantity: number = 10): Promise<string> {
    const systemPrompt = `Genera ${quantity} ideas de contenido para ${platform}.

OBJETIVOS DEL USUARIO:
${context.goals.map(g => `• ${g.description} (${g.current_value}/${g.target_value})`).join('\n')}

Cada idea debe:
- Estar alineada con al menos un objetivo
- Ser específica y accionable
- Incluir formato, título y descripción breve
- Tener CTA (llamada a la acción) clara
- Estar optimizada para ${platform}

Formato: Numeradas del 1 al ${quantity} con emojis relevantes.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Dame ${quantity} ideas de contenido para ${platform}` }
    ];

    return await this.groq.chat(messages, 0.8);
  }

  /**
   * Analiza la competencia basándose en el contexto del usuario
   */
  async analyzeCompetition(context: AgentContext, competitors: string[], industry: string): Promise<string> {
    const systemPrompt = `Eres un analista competitivo. Analiza los siguientes competidores en la industria: ${industry}

COMPETIDORES: ${competitors.join(', ')}

OBJETIVOS DEL USUARIO (para contexto):
${context.goals.map(g => `• ${g.description}`).join('\n')}

Proporciona:
1. **Análisis de cada competidor**: Fortalezas, debilidades, posicionamiento
2. **Oportunidades de diferenciación**: Cómo destacar frente a ellos
3. **Estrategias que están usando**: Qué puedes aprender o evitar
4. **Brechas de mercado**: Nichos no cubiertos
5. **Recomendaciones tácticas**: Acciones específicas para competir mejor

Sé detallado y proporciona insights accionables.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analiza estos competidores: ${competitors.join(', ')}` }
    ];

    return await this.groq.chat(messages, 0.6);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Construye el contexto del agente desde los datos del dashboard
 */
export function buildAgentContext(userId: number, goals: Goal[]): AgentContext {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return {
    userId,
    goals,
    metrics: {
      totalGoals,
      completedGoals,
      activeGoals,
      completionRate
    },
    recentActions: []
  };
}

/**
 * Extrae comandos especiales del mensaje del usuario
 */
export function extractCommand(message: string): { command: string | null; params: any } {
  const lowerMessage = message.toLowerCase().trim();

  // Comando: Analizar objetivos
  if (lowerMessage.includes('analiza') && (lowerMessage.includes('objetivo') || lowerMessage.includes('meta'))) {
    return { command: 'analyze_goals', params: {} };
  }

  // Comando: Plan de marketing
  if (lowerMessage.includes('plan') && lowerMessage.includes('marketing')) {
    const timeframeMatch = message.match(/(\d+)\s*(día|días|semana|semanas|mes|meses)/i);
    const timeframe = timeframeMatch ? `${timeframeMatch[1]} ${timeframeMatch[2]}` : '30 días';
    return { command: 'marketing_plan', params: { timeframe } };
  }

  // Comando: Ideas de contenido
  if (lowerMessage.includes('ideas') && lowerMessage.includes('contenido')) {
    const platformMatch = message.match(/(instagram|linkedin|twitter|tiktok|facebook|youtube)/i);
    const platform = platformMatch ? platformMatch[1] : 'redes sociales';
    const quantityMatch = message.match(/(\d+)\s*ideas/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 10;
    return { command: 'content_ideas', params: { platform, quantity } };
  }

  // Comando: Análisis de competencia
  if (lowerMessage.includes('competencia') || lowerMessage.includes('competidor')) {
    return { command: 'competition_analysis', params: {} };
  }

  return { command: null, params: {} };
}
