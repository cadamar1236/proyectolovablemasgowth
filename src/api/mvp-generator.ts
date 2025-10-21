import { Hono } from 'hono';
import type { Bindings } from '../types';
import { generateMVPCodeWithGroq } from '../utils/groq';

const mvpGenerator = new Hono<{ Bindings: Bindings }>();

/**
 * Sistema de Generación Automática de MVPs
 * 
 * Genera MVPs funcionales usando:
 * - Groq AI (LLMs ultra-rápidos: Llama 3.1 70B)
 * - Templates de código automáticos
 * - GitHub para repositorios
 * - Cloudflare Pages para deployment
 */

// Plantillas de MVPs por categoría
const MVP_TEMPLATES = {
  saas: {
    name: 'SaaS Web App',
    description: 'Aplicación SaaS completa con autenticación y dashboard',
    stack: ['Hono', 'React', 'Cloudflare Pages', 'D1 Database', 'Tailwind CSS'],
    files: [
      'src/index.tsx',
      'src/api/auth.ts',
      'src/api/users.ts',
      'public/static/app.js',
      'public/static/dashboard.js',
      'migrations/0001_initial.sql',
      'wrangler.jsonc',
      'package.json',
      'README.md'
    ]
  },
  marketplace: {
    name: 'Marketplace Platform',
    description: 'Plataforma de marketplace con vendedores y compradores',
    stack: ['Hono', 'TypeScript', 'Cloudflare Pages', 'D1 Database', 'Stripe'],
    files: [
      'src/index.tsx',
      'src/api/products.ts',
      'src/api/orders.ts',
      'src/api/payments.ts',
      'public/static/marketplace.js',
      'migrations/0001_marketplace.sql',
      'wrangler.jsonc',
      'package.json',
      'README.md'
    ]
  },
  landing: {
    name: 'Landing Page',
    description: 'Landing page con formulario de captura y analytics',
    stack: ['Hono', 'Cloudflare Pages', 'Tailwind CSS', 'EmailJS'],
    files: [
      'src/index.tsx',
      'public/static/landing.js',
      'public/static/styles.css',
      'wrangler.jsonc',
      'package.json',
      'README.md'
    ]
  },
  dashboard: {
    name: 'Analytics Dashboard',
    description: 'Dashboard con métricas y visualizaciones',
    stack: ['Hono', 'Chart.js', 'Cloudflare Pages', 'D1 Database'],
    files: [
      'src/index.tsx',
      'src/api/metrics.ts',
      'public/static/dashboard.js',
      'migrations/0001_metrics.sql',
      'wrangler.jsonc',
      'package.json',
      'README.md'
    ]
  },
  crm: {
    name: 'Simple CRM',
    description: 'CRM básico para gestión de clientes y ventas',
    stack: ['Hono', 'Cloudflare Pages', 'D1 Database', 'Tailwind CSS'],
    files: [
      'src/index.tsx',
      'src/api/customers.ts',
      'src/api/deals.ts',
      'public/static/crm.js',
      'migrations/0001_crm.sql',
      'wrangler.jsonc',
      'package.json',
      'README.md'
    ]
  }
};

// Generador de código usando IA
async function generateCodeWithAI(
  groqApiKey: string | undefined,
  template: keyof typeof MVP_TEMPLATES,
  projectDetails: any
): Promise<{ [filename: string]: string }> {
  // Try Groq first
  if (groqApiKey) {
    try {
      return await generateMVPCodeWithGroq(projectDetails, template, groqApiKey);
    } catch (error) {
      console.error('Groq code generation failed:', error);
    }
  }
  
  // Fallback: generar código básico
  return generateBasicTemplate(template, projectDetails);
}

// Template básico de fallback
function generateBasicTemplate(
  template: keyof typeof MVP_TEMPLATES,
  projectDetails: any
): { [filename: string]: string } {
  const templateInfo = MVP_TEMPLATES[template];
  
  return {
    'package.json': JSON.stringify({
      name: projectDetails.title.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        deploy: 'npm run build && wrangler pages deploy dist'
      },
      dependencies: {
        hono: '^4.10.1'
      },
      devDependencies: {
        '@hono/vite-build': '^1.2.0',
        '@hono/vite-dev-server': '^0.18.2',
        vite: '^6.3.5',
        wrangler: '^4.4.0'
      }
    }, null, 2),
    
    'src/index.tsx': `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

app.use('/api/*', cors());
app.use('/static/*', serveStatic({ root: './public' }));

app.get('/', (c) => {
  return c.html(\`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectDetails.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-16">
        <h1 class="text-4xl font-bold mb-4">${projectDetails.title}</h1>
        <p class="text-xl text-gray-600 mb-8">${projectDetails.description}</p>
        <div class="bg-white rounded-xl shadow-lg p-8">
            <h2 class="text-2xl font-bold mb-4">¿Cómo funciona?</h2>
            <p class="text-gray-700 mb-4">${projectDetails.value_proposition}</p>
            <button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Comenzar Ahora
            </button>
        </div>
    </div>
</body>
</html>
  \`);
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;`,
    
    'wrangler.jsonc': JSON.stringify({
      name: projectDetails.title.toLowerCase().replace(/\s+/g, '-'),
      compatibility_date: new Date().toISOString().split('T')[0],
      pages_build_output_dir: './dist',
      compatibility_flags: ['nodejs_compat']
    }, null, 2),
    
    'vite.config.ts': `import { defineConfig } from 'vite';
import pages from '@hono/vite-cloudflare-pages';

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist'
  }
});`,
    
    'README.md': `# ${projectDetails.title}

${projectDetails.description}

## Mercado Objetivo
${projectDetails.target_market}

## Propuesta de Valor
${projectDetails.value_proposition}

## Tech Stack
${templateInfo.stack.map(t => `- ${t}`).join('\n')}

## Instalación

\`\`\`bash
npm install
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Deployment

\`\`\`bash
npm run deploy
\`\`\`

## Características

- ✅ Diseño responsive con Tailwind CSS
- ✅ Backend con Cloudflare Workers
- ✅ Deployment automático a Cloudflare Pages
- ✅ Zero configuration

---

Generado automáticamente por ValidAI Studio
`
  };
}

// Endpoint principal: Generar MVP completo
mvpGenerator.post('/generate-full', async (c) => {
  const { projectId, template } = await c.req.json();
  
  if (!MVP_TEMPLATES[template as keyof typeof MVP_TEMPLATES]) {
    return c.json({ error: 'Template inválido' }, 400);
  }
  
  try {
    // 1. Obtener detalles del proyecto
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(projectId).first();
    
    if (!project) {
      return c.json({ error: 'Proyecto no encontrado' }, 404);
    }
    
    // 2. Generar código con IA (Groq)
    const generatedFiles = await generateCodeWithAI(
      c.env.GROQ_API_KEY,
      template as keyof typeof MVP_TEMPLATES,
      project
    );
    
    // 3. Guardar archivos generados
    const filesJson = JSON.stringify(generatedFiles);
    
    await c.env.DB.prepare(`
      UPDATE mvp_prototypes 
      SET wireframe_url = ?
      WHERE project_id = ?
    `).bind(filesJson, projectId).run();
    
    // 4. Crear estructura de deployment
    const deploymentInfo = {
      status: 'ready',
      files: Object.keys(generatedFiles),
      template,
      generated_at: new Date().toISOString()
    };
    
    return c.json({
      message: 'MVP generado exitosamente',
      files: generatedFiles,
      deployment: deploymentInfo,
      next_steps: [
        'Descargar archivos generados',
        'Crear repositorio en GitHub',
        'Desplegar a Cloudflare Pages',
        'Configurar dominio personalizado'
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

// Endpoint: Obtener plantillas disponibles
mvpGenerator.get('/templates', async (c) => {
  const templates = Object.entries(MVP_TEMPLATES).map(([key, value]) => ({
    id: key,
    ...value
  }));
  
  return c.json({ templates });
});

// Endpoint: Detectar mejor template para un proyecto
mvpGenerator.post('/detect-template', async (c) => {
  const { projectId } = await c.req.json();
  
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!project) {
    return c.json({ error: 'Proyecto no encontrado' }, 404);
  }
  
  // Usar IA para detectar el mejor template
  const prompt = `Analiza este proyecto y recomienda el mejor tipo de MVP:

Título: ${project.title}
Descripción: ${project.description}
Mercado: ${project.target_market}

Opciones disponibles:
- saas: Aplicación SaaS con usuarios y suscripciones
- marketplace: Plataforma de marketplace con vendedores
- landing: Landing page simple para validación
- dashboard: Dashboard con métricas y analytics
- crm: CRM para gestión de clientes

Responde SOLO con el nombre del template (saas, marketplace, landing, dashboard, o crm)`;

  try {
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'Eres un experto en arquitectura de productos digitales.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
    });
    
    const templateName = (response.response || '').trim().toLowerCase();
    const detectedTemplate = MVP_TEMPLATES[templateName as keyof typeof MVP_TEMPLATES] 
      ? templateName 
      : 'saas'; // fallback
    
    return c.json({
      recommended_template: detectedTemplate,
      template_info: MVP_TEMPLATES[detectedTemplate as keyof typeof MVP_TEMPLATES]
    });
    
  } catch (error) {
    return c.json({
      recommended_template: 'saas',
      template_info: MVP_TEMPLATES.saas
    });
  }
});

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
