import { Hono } from 'hono';
import type { Bindings } from '../types';
import { generateCompleteGroqMVP } from '../utils/groq-mvp-generator';

const mvpGenerator = new Hono<{ Bindings: Bindings }>();

/**
 * Sistema de Generación PURO con Groq AI
 * 
 * Genera MVPs usando SOLO Groq AI:
 * - Sin plantillas genéricas
 * - Sin fallbacks
 * - Reintentos automáticos hasta que funcione
 * - Código 100% generado por IA
 */

// Ya no usamos plantillas genéricas - todo es generado dinámicamente con IA pura

// Endpoint principal: Generar MVP completo personalizado
mvpGenerator.post('/generate-full', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId } = body;

    if (!projectId) {
      return c.json({ error: 'projectId es requerido' }, 400);
    }

    // 1. Obtener TODOS los datos del proyecto
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }

    // 2. Obtener prototipo MVP con features
    const mvpPrototype = await c.env.DB.prepare(
      'SELECT * FROM mvp_prototypes WHERE project_id = ?'
    ).bind(projectId).first();

    if (!mvpPrototype) {
      return c.json({ error: 'Prototipo MVP no encontrado' }, 404);
    }

    // 3. Obtener análisis de mercado
    const marketAnalysis = await c.env.DB.prepare(
      'SELECT * FROM market_analysis WHERE project_id = ?'
    ).bind(projectId).first();

    // Parse features
    let features = [];
    let techStack = [];

    try {
      features = JSON.parse(mvpPrototype.features as string);
      techStack = JSON.parse(mvpPrototype.tech_stack as string);
    } catch (e) {
      return c.json({ error: 'Error parsing MVP features' }, 500);
    }

    // Parse market analysis if available
    let parsedMarketAnalysis = {
      competitors: [],
      market_trends: [],
      opportunities: [],
      threats: [],
      market_size: 'Unknown',
      growth_rate: 'Unknown'
    };

    if (marketAnalysis) {
      try {
        parsedMarketAnalysis = {
          competitors: JSON.parse(marketAnalysis.competitors as string || '[]'),
          market_trends: JSON.parse(marketAnalysis.market_trends as string || '[]'),
          opportunities: JSON.parse(marketAnalysis.opportunities as string || '[]'),
          threats: JSON.parse(marketAnalysis.threats as string || '[]'),
          market_size: marketAnalysis.market_size as string || 'Unknown',
          growth_rate: marketAnalysis.growth_rate as string || 'Unknown'
        };
      } catch (e) {
        // Continue with default values
      }
    }

    // 4. Verificar que tenemos la API key de Groq
    if (!c.env.GROQ_API_KEY) {
      return c.json({ error: 'Configuración de IA no disponible' }, 500);
    }
    
    // 5. Generar MVP usando SOLO Groq AI (con reintentos automáticos)
    const generatedFiles = await generateCompleteGroqMVP(
      {
        id: project.id as number,
        title: project.title as string,
        description: project.description as string,
        target_market: project.target_market as string,
        value_proposition: project.value_proposition as string
      },
      {
        name: mvpPrototype.name as string,
        description: mvpPrototype.description as string,
        features: features,
        tech_stack: techStack,
        estimated_time: mvpPrototype.estimated_time as string,
        estimated_cost: mvpPrototype.estimated_cost as string
      },
      parsedMarketAnalysis,
      c.env.GROQ_API_KEY as string
    );
    
    console.log('✅ MVP generated! Files:', Object.keys(generatedFiles));
    
    // 5. Guardar archivos generados
    const filesJson = JSON.stringify(generatedFiles);
    
    await c.env.DB.prepare(`
      UPDATE mvp_prototypes 
      SET wireframe_url = ?
      WHERE project_id = ?
    `).bind(filesJson, projectId).run();
    
    // 6. Crear estructura de deployment
    const deploymentInfo = {
      status: 'ready',
      files: Object.keys(generatedFiles),
      features: features,
      generated_at: new Date().toISOString()
    };
    
    // 7. Auto-crear producto en el marketplace para validación
    let marketplaceProductId = null;
    try {
      // Get user ID from project
      const projectOwner = await c.env.DB.prepare(
        'SELECT user_id FROM projects WHERE id = ?'
      ).bind(projectId).first() as any;
      
      if (projectOwner && projectOwner.user_id) {
        const userId = projectOwner.user_id;
        
        // Create marketplace product
        const productResult = await c.env.DB.prepare(`
          INSERT INTO beta_products (
            company_user_id, title, description, category, stage,
            looking_for, compensation_type, compensation_amount,
            duration_days, validators_needed, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          project.title,
          `${project.description}\n\n✨ MVP generado automáticamente usando IA`,
          'MVP Generated',
          'mvp',
          'Validación de MVP generado por IA',
          'free',
          0,
          30,
          3,
          'active'
        ).run();
        
        marketplaceProductId = productResult.meta.last_row_id;
        
        console.log(`✅ Marketplace product created: ${marketplaceProductId}`);
      }
    } catch (marketplaceError) {
      console.error('Error creating marketplace product:', marketplaceError);
      // Don't fail the whole request if marketplace creation fails
    }
    
    return c.json({
      message: 'MVP personalizado generado exitosamente',
      files: generatedFiles,
      deployment: deploymentInfo,
      features_implemented: features,
      marketplace_product_id: marketplaceProductId,
      marketplace_url: marketplaceProductId ? `/marketplace?product=${marketplaceProductId}` : null,
      next_steps: [
        'Descargar archivos generados',
        'Ejecutar: npm install',
        'Crear base de datos D1',
        'Ejecutar: npm run db:migrate',
        'Ejecutar: npm run dev',
        'Desplegar a Cloudflare Pages',
        ...(marketplaceProductId ? ['🌟 Tu producto ya está en el marketplace para validación'] : [])
      ]
    });
    
  } catch (error) {
    console.error('Error generando MVP:', error);
    return c.json({ 
      error: 'Error al generar MVP',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoints de templates eliminados - ahora todo es personalizado

// Endpoint: Descargar código generado como ZIP
mvpGenerator.get('/download/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  
  const mvp = await c.env.DB.prepare(
    'SELECT * FROM mvp_prototypes WHERE project_id = ?'
  ).bind(projectId).first();
  
  if (!mvp || !mvp.wireframe_url) {
    return c.json({ error: 'No hay código generado para este proyecto' }, 404);
  }
  
  try {
    const files = JSON.parse(mvp.wireframe_url as string);
    
    // Por ahora retornar como JSON, en producción se generaría un ZIP
    return c.json({
      message: 'Código disponible para descarga',
      files,
      instructions: 'Crea una carpeta nueva y copia estos archivos'
    });
    
  } catch (error) {
    return c.json({ error: 'Error al obtener archivos' }, 500);
  }
});

export default mvpGenerator;
