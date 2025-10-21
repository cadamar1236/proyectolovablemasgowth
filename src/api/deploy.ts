import { Hono } from 'hono';
import type { Bindings } from '../types';

const deploy = new Hono<{ Bindings: Bindings }>();

/**
 * Sistema de Deploy y Preview de MVPs
 * 
 * Funcionalidades:
 * 1. Preview temporal del MVP en sandbox
 * 2. Deploy automático a Cloudflare Pages
 * 3. Gestión de deployments
 */

// Endpoint: Preview del MVP generado
deploy.get('/preview/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  
  try {
    // Obtener MVP generado
    const mvp = await c.env.DB.prepare(
      'SELECT * FROM mvp_prototypes WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(projectId).first();
    
    if (!mvp || !mvp.wireframe_url) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview no disponible</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 flex items-center justify-center min-h-screen">
          <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <i class="fas fa-exclamation-circle text-red-500 text-6xl mb-4"></i>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Preview no disponible</h1>
            <p class="text-gray-600 mb-6">No hay código generado para este proyecto.</p>
            <a href="/project/${projectId}" class="bg-primary text-white px-6 py-3 rounded-lg inline-block">
              Volver al proyecto
            </a>
          </div>
        </body>
        </html>
      `);
    }
    
    // Parse generated files
    let files: { [key: string]: string } = {};
    try {
      files = JSON.parse(mvp.wireframe_url as string);
    } catch (e) {
      console.error('Error parsing MVP files:', e);
    }
    
    // Get the main HTML file (index.tsx or index.html)
    const indexContent = files['src/index.tsx'] || files['index.html'] || '';
    
    // Extract HTML from Hono app if it's a TypeScript file
    let htmlContent = '';
    if (indexContent.includes('c.html')) {
      const htmlMatch = indexContent.match(/c\.html\(`([\s\S]*?)`\)/);
      if (htmlMatch) {
        htmlContent = htmlMatch[1];
      }
    } else {
      htmlContent = indexContent;
    }
    
    // If no HTML found, show a demo page
    if (!htmlContent) {
      const project = await c.env.DB.prepare(
        'SELECT * FROM projects WHERE id = ?'
      ).bind(projectId).first();
      
      htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${project?.title || 'MVP Preview'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        </head>
        <body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
          <div class="max-w-7xl mx-auto px-4 py-16">
            <div class="text-center mb-12">
              <div class="inline-block bg-white rounded-full p-6 shadow-lg mb-6">
                <i class="fas fa-rocket text-6xl text-primary"></i>
              </div>
              <h1 class="text-5xl font-bold text-gray-900 mb-4">${project?.title || 'MVP Preview'}</h1>
              <p class="text-xl text-gray-600 max-w-2xl mx-auto">${project?.description || 'Vista previa del MVP generado'}</p>
            </div>
            
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-6">🎯 Propuesta de Valor</h2>
              <p class="text-lg text-gray-700 mb-8">${project?.value_proposition || 'Solución innovadora para tu mercado'}</p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="text-center p-6 bg-blue-50 rounded-xl">
                  <i class="fas fa-users text-4xl text-blue-600 mb-4"></i>
                  <h3 class="font-bold text-gray-900 mb-2">Mercado Objetivo</h3>
                  <p class="text-gray-600">${project?.target_market || 'Usuarios específicos'}</p>
                </div>
                <div class="text-center p-6 bg-purple-50 rounded-xl">
                  <i class="fas fa-chart-line text-4xl text-purple-600 mb-4"></i>
                  <h3 class="font-bold text-gray-900 mb-2">Escalable</h3>
                  <p class="text-gray-600">Diseñado para crecer rápidamente</p>
                </div>
                <div class="text-center p-6 bg-green-50 rounded-xl">
                  <i class="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                  <h3 class="font-bold text-gray-900 mb-2">Validado</h3>
                  <p class="text-gray-600">Con análisis de mercado real</p>
                </div>
              </div>
              
              <div class="text-center">
                <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition transform hover:scale-105">
                  <i class="fas fa-rocket mr-2"></i>Comenzar Ahora
                </button>
              </div>
            </div>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
              <div class="flex items-start">
                <i class="fas fa-info-circle text-yellow-600 text-2xl mr-4 mt-1"></i>
                <div>
                  <h3 class="font-bold text-gray-900 mb-2">Vista Previa Simplificada</h3>
                  <p class="text-gray-700">Este es un preview básico del MVP. El código completo incluye backend con API, base de datos, autenticación y mucho más. Descarga el código o despliega a Cloudflare Pages para ver la versión completa.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    return c.html(htmlContent);
    
  } catch (error) {
    console.error('Error loading preview:', error);
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <i class="fas fa-exclamation-triangle text-yellow-500 text-6xl mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Error al cargar preview</h1>
          <p class="text-gray-600 mb-6">${error instanceof Error ? error.message : 'Error desconocido'}</p>
          <a href="/project/${projectId}" class="bg-primary text-white px-6 py-3 rounded-lg inline-block">
            Volver al proyecto
          </a>
        </div>
      </body>
      </html>
    `);
  }
});

// Endpoint: Deploy a Cloudflare Pages
deploy.post('/cloudflare/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const { projectName } = await c.req.json();
  
  try {
    // Get MVP files
    const mvp = await c.env.DB.prepare(
      'SELECT * FROM mvp_prototypes WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(projectId).first();
    
    if (!mvp || !mvp.wireframe_url) {
      return c.json({ error: 'No hay código generado para desplegar' }, 404);
    }
    
    const files = JSON.parse(mvp.wireframe_url as string);
    
    // Get project details
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(projectId).first();
    
    const cleanProjectName = projectName || 
      (project?.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Instructions for manual deployment (since we can't directly deploy from Workers)
    const deploymentInstructions = {
      message: 'MVP listo para deployment',
      instructions: [
        '1. Descarga el código generado usando el botón "Descargar Código"',
        '2. Extrae los archivos en una carpeta local',
        '3. Abre la terminal en esa carpeta',
        '4. Ejecuta: npm install',
        '5. Ejecuta: npm run build',
        `6. Ejecuta: npx wrangler pages deploy dist --project-name ${cleanProjectName}`,
        '7. ¡Tu MVP estará en vivo en Cloudflare Pages!'
      ],
      commands: [
        'npm install',
        'npm run build',
        `npx wrangler pages deploy dist --project-name ${cleanProjectName}`
      ],
      projectName: cleanProjectName,
      estimatedUrl: `https://${cleanProjectName}.pages.dev`,
      files: Object.keys(files),
      
      // GitHub deployment option
      githubOption: {
        title: 'Opción alternativa: Deploy via GitHub',
        steps: [
          '1. Crea un nuevo repositorio en GitHub',
          '2. Sube los archivos descargados',
          '3. Conecta el repo a Cloudflare Pages desde el dashboard',
          '4. Cloudflare Pages desplegará automáticamente'
        ]
      }
    };
    
    return c.json(deploymentInstructions);
    
  } catch (error) {
    console.error('Deployment preparation error:', error);
    return c.json({ 
      error: 'Error preparando deployment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoint: Get deployment status (simulated)
deploy.get('/status/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  
  // Check if MVP exists
  const mvp = await c.env.DB.prepare(
    'SELECT * FROM mvp_prototypes WHERE project_id = ?'
  ).bind(projectId).first();
  
  if (!mvp) {
    return c.json({ 
      status: 'not_generated',
      message: 'MVP no generado todavía'
    });
  }
  
  const hasCode = mvp.wireframe_url && mvp.wireframe_url !== '';
  
  return c.json({
    status: hasCode ? 'ready_to_deploy' : 'generating',
    message: hasCode ? 'MVP listo para desplegar' : 'Generando código...',
    preview_url: `/api/deploy/preview/${projectId}`,
    has_code: hasCode,
    created_at: mvp.created_at
  });
});

export default deploy;
