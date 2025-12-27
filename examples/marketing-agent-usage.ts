/**
 * Ejemplos de uso del Marketing Agent System
 * 
 * Este archivo muestra cómo usar los agentes de marketing
 * tanto desde el código como desde el chat del usuario
 */

import { MarketingOrchestrator, buildAgentContext } from './src/utils/marketing-agent';

// ============================================
// EJEMPLO 1: Uso Básico del Orquestador
// ============================================

async function basicUsageExample() {
  // Inicializar el orquestador con tu API key
  const agent = new MarketingOrchestrator(process.env.GROQ_API_KEY!);

  // Ejemplo de objetivos del usuario
  const goals = [
    {
      id: 1,
      user_id: 123,
      description: 'Aumentar seguidores en Instagram a 10,000',
      target_value: 10000,
      current_value: 3500,
      deadline: '2025-03-31',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      user_id: 123,
      description: 'Generar 50 leads cualificados',
      target_value: 50,
      current_value: 12,
      deadline: '2025-02-15',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z'
    }
  ];

  // Construir contexto
  const context = buildAgentContext(123, goals);

  // Procesar una solicitud genérica
  const response = await agent.processRequest(
    'Dame ideas de contenido para Instagram que me ayuden a conseguir más seguidores',
    context
  );

  console.log('Respuesta del agente:', response);
}

// ============================================
// EJEMPLO 2: Análisis de Objetivos
// ============================================

async function analyzeGoalsExample() {
  const agent = new MarketingOrchestrator(process.env.GROQ_API_KEY!);

  const goals = [
    {
      id: 1,
      user_id: 456,
      description: 'Lanzar nuevo producto SaaS',
      target_value: 100,
      current_value: 25,
      deadline: '2025-06-30',
      status: 'active' as const,
      created_at: '2025-01-15T00:00:00Z'
    },
    {
      id: 2,
      user_id: 456,
      description: 'Conseguir primeros 1000 usuarios',
      target_value: 1000,
      current_value: 150,
      deadline: '2025-07-31',
      status: 'active' as const,
      created_at: '2025-01-15T00:00:00Z'
    }
  ];

  const context = buildAgentContext(456, goals);

  // Análisis completo de objetivos
  const analysis = await agent.analyzeGoalsAndSuggest(context);

  console.log('📊 ANÁLISIS DE OBJETIVOS:\n', analysis);
}

// ============================================
// EJEMPLO 3: Plan de Marketing
// ============================================

async function generateMarketingPlanExample() {
  const agent = new MarketingOrchestrator(process.env.GROQ_API_KEY!);

  const goals = [
    {
      id: 1,
      user_id: 789,
      description: 'Aumentar revenue mensual a $10,000',
      target_value: 10000,
      current_value: 3500,
      deadline: '2025-04-30',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z'
    }
  ];

  const context = buildAgentContext(789, goals);

  // Generar plan de marketing para 60 días
  const plan = await agent.generateMarketingPlan(context, '60 días');

  console.log('📋 PLAN DE MARKETING (60 días):\n', plan);
}

// ============================================
// EJEMPLO 4: Ideas de Contenido
// ============================================

async function generateContentIdeasExample() {
  const agent = new MarketingOrchestrator(process.env.GROQ_API_KEY!);

  const goals = [
    {
      id: 1,
      user_id: 101,
      description: 'Posicionarse como experto en IA',
      target_value: 1,
      current_value: 0,
      deadline: '2025-12-31',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z'
    }
  ];

  const context = buildAgentContext(101, goals);

  // Generar 15 ideas de contenido para LinkedIn
  const ideas = await agent.generateContentIdeas(context, 'LinkedIn', 15);

  console.log('💡 IDEAS DE CONTENIDO PARA LINKEDIN:\n', ideas);
}

// ============================================
// EJEMPLO 5: Análisis de Competencia
// ============================================

async function analyzeCompetitionExample() {
  const agent = new MarketingOrchestrator(process.env.GROQ_API_KEY!);

  const goals = [
    {
      id: 1,
      user_id: 202,
      description: 'Lanzar plataforma de e-learning',
      target_value: 1,
      current_value: 0,
      deadline: '2025-08-31',
      status: 'active' as const,
      created_at: '2025-02-01T00:00:00Z'
    }
  ];

  const context = buildAgentContext(202, goals);

  // Analizar competencia en el mercado de e-learning
  const analysis = await agent.analyzeCompetition(
    context,
    ['Udemy', 'Coursera', 'Platzi', 'Domestika'],
    'E-learning y educación online'
  );

  console.log('🏆 ANÁLISIS DE COMPETENCIA:\n', analysis);
}

// ============================================
// EJEMPLO 6: Uso desde el Chat (Frontend)
// ============================================

// En el frontend, los usuarios pueden escribir mensajes naturales:

/*
EJEMPLOS DE MENSAJES DEL USUARIO:

1. Análisis de Objetivos:
   "Analiza mis objetivos actuales"
   "¿Cómo voy con mis metas?"
   "Revisa mi progreso"

2. Plan de Marketing:
   "Crea un plan de marketing para 30 días"
   "Necesito una estrategia de marketing para el próximo mes"
   "Dame un plan de acción para aumentar ventas"

3. Ideas de Contenido:
   "Dame 10 ideas de contenido para Instagram"
   "Necesito ideas de posts para LinkedIn"
   "¿Qué contenido puedo publicar en TikTok?"

4. Análisis de Competencia:
   "Analiza la competencia en marketing digital"
   "Compara mi producto con [competidores]"
   "¿Cómo me diferencio de la competencia?"

El orquestador detectará automáticamente la intención
y delegará al agente apropiado.
*/

// ============================================
// EJEMPLO 7: Integración en API Route
// ============================================

/*
// En tu Hono app:

app.post('/api/marketing/analyze', async (c) => {
  const user = c.get('user');
  const { userId } = await c.req.json();

  // Obtener objetivos del usuario desde la BD
  const goals = await c.env.DB.prepare(
    'SELECT * FROM dashboard_goals WHERE user_id = ? AND status = "active"'
  ).bind(userId).all();

  // Construir contexto
  const context = buildAgentContext(userId, goals.results);

  // Inicializar agente
  const agent = new MarketingOrchestrator(c.env.GROQ_API_KEY);

  // Procesar solicitud
  const analysis = await agent.analyzeGoalsAndSuggest(context);

  return c.json({ analysis });
});
*/

// ============================================
// EJEMPLO 8: Extracción de Comandos
// ============================================

import { extractCommand } from './src/utils/marketing-agent';

function commandExtractionExample() {
  // El sistema puede detectar comandos en mensajes naturales

  const message1 = 'Analiza mis objetivos actuales';
  const cmd1 = extractCommand(message1);
  console.log(cmd1); 
  // { command: 'analyze_goals', params: {} }

  const message2 = 'Crea un plan de marketing para 60 días';
  const cmd2 = extractCommand(message2);
  console.log(cmd2); 
  // { command: 'marketing_plan', params: { timeframe: '60 días' } }

  const message3 = 'Dame 20 ideas de contenido para TikTok';
  const cmd3 = extractCommand(message3);
  console.log(cmd3);
  // { command: 'content_ideas', params: { platform: 'TikTok', quantity: 20 } }

  const message4 = 'Analiza la competencia';
  const cmd4 = extractCommand(message4);
  console.log(cmd4);
  // { command: 'competition_analysis', params: {} }
}

// ============================================
// EJEMPLO 9: Personalización de Temperatura
// ============================================

/*
La temperatura controla la creatividad del modelo:
- 0.3-0.5: Respuestas más determinísticas y consistentes (análisis, datos)
- 0.6-0.7: Balance entre creatividad y consistencia (estrategias)
- 0.8-0.9: Más creativo y variado (generación de contenido, ideas)

En cada agente puedes ajustar la temperatura:

// Market Research Agent (datos precisos)
return await this.groq.chat(messages, 0.5);

// Content Creation Agent (creatividad alta)
return await this.groq.chat(messages, 0.8);

// Strategy Agent (balance)
return await this.groq.chat(messages, 0.6);
*/

// ============================================
// EJEMPLO 10: Manejo de Errores
// ============================================

async function errorHandlingExample() {
  try {
    const agent = new MarketingOrchestrator(process.env.GROQ_API_KEY!);
    
    const goals = [
      // ... tus objetivos
    ];

    const context = buildAgentContext(123, goals);

    const response = await agent.processRequest(
      'Dame ideas para crecer mi negocio',
      context
    );

    console.log('Respuesta:', response);

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Groq API failed')) {
        console.error('Error de API de Groq:', error.message);
        console.error('Verifica tu API key y límites de rate');
      } else if (error.message.includes('Failed to fetch')) {
        console.error('Error de red:', error.message);
        console.error('Verifica tu conexión a internet');
      } else {
        console.error('Error desconocido:', error.message);
      }
    }
  }
}

// ============================================
// EJECUTAR EJEMPLOS
// ============================================

async function runAllExamples() {
  console.log('🚀 EJEMPLOS DE USO DEL MARKETING AGENT\n');

  console.log('1️⃣ Ejemplo básico...');
  await basicUsageExample();

  console.log('\n2️⃣ Análisis de objetivos...');
  await analyzeGoalsExample();

  console.log('\n3️⃣ Plan de marketing...');
  await generateMarketingPlanExample();

  console.log('\n4️⃣ Ideas de contenido...');
  await generateContentIdeasExample();

  console.log('\n5️⃣ Análisis de competencia...');
  await analyzeCompetitionExample();

  console.log('\n7️⃣ Extracción de comandos...');
  commandExtractionExample();

  console.log('\n9️⃣ Manejo de errores...');
  await errorHandlingExample();

  console.log('\n✅ Todos los ejemplos completados!');
}

// Descomentar para ejecutar:
// runAllExamples().catch(console.error);

export {
  basicUsageExample,
  analyzeGoalsExample,
  generateMarketingPlanExample,
  generateContentIdeasExample,
  analyzeCompetitionExample,
  commandExtractionExample,
  errorHandlingExample,
  runAllExamples
};
