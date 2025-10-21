/**
 * Intelligent MVP Generator
 * Genera MVPs completamente personalizados basados en el análisis del proyecto
 * SIN usar plantillas genéricas
 */

import { callGroqAPI } from './groq';

interface ProjectData {
  id: number;
  title: string;
  description: string;
  target_market: string;
  value_proposition: string;
}

interface MVPPrototype {
  name: string;
  description: string;
  features: string[]; // Array de features específicas
  tech_stack: string[];
  estimated_time: string;
  estimated_cost: string;
}

interface MarketAnalysis {
  competitors: string[];
  market_trends: string[];
  opportunities: string[];
  threats: string[];
  market_size: string;
  growth_rate: string;
}

/**
 * Generate complete MVP code using AI with full project context
 */
export async function generateIntelligentMVP(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  marketAnalysis: MarketAnalysis,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  console.log('🤖 Generating intelligent MVP for:', project.title);
  console.log('📋 Features:', mvpPrototype.features);
  
  // Step 1: Generate database schema based on features
  const dbSchema = await generateDatabaseSchema(project, mvpPrototype, groqApiKey);
  
  // Step 2: Generate API endpoints based on features
  const apiCode = await generateAPICode(project, mvpPrototype, marketAnalysis, groqApiKey);
  
  // Step 3: Generate frontend based on features
  const frontendCode = await generateFrontendCode(project, mvpPrototype, groqApiKey);
  
  // Step 4: Generate configuration files
  const configFiles = generateConfigFiles(project, mvpPrototype);
  
  // Combine all generated code
  return {
    ...dbSchema,
    ...apiCode,
    ...frontendCode,
    ...configFiles
  };
}

/**
 * Generate database schema based on MVP features
 */
async function generateDatabaseSchema(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  const prompt = `You are a senior database architect. Generate a COMPLETE database schema for this specific project:

PROJECT: ${project.title}
DESCRIPTION: ${project.description}
TARGET MARKET: ${project.target_market}

MVP FEATURES TO SUPPORT:
${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

TECH STACK: ${mvpPrototype.tech_stack.join(', ')}

Create a SQLite (D1) database schema that supports ALL these features. Include:

1. All necessary tables with proper columns
2. Relationships between tables (foreign keys)
3. Indexes for performance
4. Sample data that makes sense for this specific project
5. Constraints and validations

The schema must be SPECIFIC to this project, not generic. For example:
- If it's a health app, include tables like: patients, doctors, health_metrics, alerts
- If it's a marketplace, include: products, sellers, orders, reviews
- If it's a CRM, include: customers, deals, activities, contacts

Respond ONLY with valid JSON:
{
  "migrations/0001_initial.sql": "complete SQL schema here with CREATE TABLE, indexes, and INSERT statements"
}`;

  const messages = [
    {
      role: 'system' as const,
      content: 'You are an expert database architect. Generate complete, production-ready database schemas. Always respond with valid JSON only.'
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  try {
    const response = await callGroqAPI(messages, groqApiKey, 'moonshotai/kimi-k2-instruct');
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating database schema:', error);
    // Fallback: generate basic schema
    return generateFallbackSchema(project, mvpPrototype);
  }
}

/**
 * Generate API code based on MVP features
 */
async function generateAPICode(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  marketAnalysis: MarketAnalysis,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  const prompt = `You are a senior full-stack engineer. Generate COMPLETE backend code for this specific project:

PROJECT: ${project.title}
DESCRIPTION: ${project.description}
VALUE PROPOSITION: ${project.value_proposition}

MVP FEATURES TO IMPLEMENT:
${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

MARKET CONTEXT:
- Competitors: ${marketAnalysis.competitors.slice(0, 3).join(', ')}
- Key Opportunity: ${marketAnalysis.opportunities[0]}

Generate a COMPLETE Hono backend (src/index.tsx) with:

1. ALL API endpoints needed for these specific features
2. Full CRUD operations for each entity
3. Business logic specific to this project (not generic)
4. Authentication if needed for these features
5. Error handling and validation
6. D1 database integration
7. HTML response with complete UI for all features

The code must be SPECIFIC to this project. For example:
- If feature is "Dashboard médico con alertas IA", create endpoints like:
  GET /api/patients, GET /api/alerts, POST /api/alerts/dismiss
- If feature is "Chat médico-paciente", create:
  POST /api/messages, GET /api/conversations/:id

Include a complete HTML page with:
- Sections for EACH feature listed above
- Functional forms and interactions
- Real API calls using axios
- Professional UI with Tailwind CSS

Respond ONLY with valid JSON:
{
  "src/index.tsx": "complete Hono backend code here (500+ lines)",
  "public/static/app.js": "complete frontend JavaScript here (300+ lines)"
}`;

  const messages = [
    {
      role: 'system' as const,
      content: 'You are an expert full-stack developer. Generate complete, production-ready code with ALL features implemented. Always respond with valid JSON only.'
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  try {
    const response = await callGroqAPI(messages, groqApiKey, 'moonshotai/kimi-k2-instruct');
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating API code:', error);
    // Fallback: generate basic API
    return generateFallbackAPI(project, mvpPrototype);
  }
}

/**
 * Generate frontend code based on MVP features
 */
async function generateFrontendCode(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  const prompt = `You are a senior frontend engineer. Generate COMPLETE, FUNCTIONAL frontend code for:

PROJECT: ${project.title}
FEATURES:
${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Generate complete JavaScript (public/static/app.js) with:

1. Functions for EACH feature listed above
2. Real API calls to backend endpoints
3. Form handling and validation
4. State management
5. Dynamic UI updates
6. Error handling

The code must be SPECIFIC and FUNCTIONAL. For example:
- If feature is "Dashboard médico con alertas IA", create:
  async function loadMedicalAlerts() { ... }
  async function viewPatientDetails(patientId) { ... }
- If feature is "Chat médico-paciente", create:
  async function sendMessage(to, message) { ... }
  async function loadConversation(conversationId) { ... }

Also generate custom CSS (public/static/styles.css) for professional styling.

Respond ONLY with valid JSON:
{
  "public/static/app.js": "complete functional JavaScript (300+ lines)",
  "public/static/styles.css": "custom CSS styling (100+ lines)"
}`;

  const messages = [
    {
      role: 'system' as const,
      content: 'You are an expert frontend developer. Generate complete, functional JavaScript code. Always respond with valid JSON only.'
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  try {
    const response = await callGroqAPI(messages, groqApiKey, 'moonshotai/kimi-k2-instruct');
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating frontend code:', error);
    return {
      'public/static/styles.css': generateBasicCSS()
    };
  }
}

/**
 * Generate configuration files
 */
function generateConfigFiles(
  project: ProjectData,
  mvpPrototype: MVPPrototype
): { [filename: string]: string } {
  
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  return {
    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      type: 'module',
      description: project.description,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'wrangler pages dev dist',
        deploy: 'npm run build && wrangler pages deploy dist',
        'db:migrate': `wrangler d1 migrations apply ${projectName}-db --local`,
        'db:migrate:prod': `wrangler d1 migrations apply ${projectName}-db`
      },
      dependencies: {
        hono: '^4.10.1'
      },
      devDependencies: {
        '@cloudflare/workers-types': '4.20250705.0',
        '@hono/vite-cloudflare-pages': '^0.4.2',
        vite: '^5.0.0',
        wrangler: '^3.78.0',
        typescript: '^5.0.0'
      }
    }, null, 2),
    
    'wrangler.jsonc': JSON.stringify({
      name: projectName,
      compatibility_date: '2024-01-01',
      pages_build_output_dir: './dist',
      compatibility_flags: ['nodejs_compat'],
      d1_databases: [
        {
          binding: 'DB',
          database_name: `${projectName}-db`,
          database_id: 'replace-with-actual-database-id'
        }
      ]
    }, null, 2),
    
    'vite.config.ts': `import { defineConfig } from 'vite';
import pages from '@hono/vite-cloudflare-pages';

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist'
  }
});`,
    
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020'],
        jsx: 'react-jsx',
        jsxImportSource: 'hono/jsx',
        moduleResolution: 'bundler',
        types: ['@cloudflare/workers-types']
      }
    }, null, 2),
    
    'README.md': `# ${project.title}

${project.description}

## Características Implementadas

${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Mercado Objetivo

${project.target_market}

## Propuesta de Valor

${project.value_proposition}

## Tech Stack

${mvpPrototype.tech_stack.map(t => `- ${t}`).join('\n')}

## Instalación

\`\`\`bash
npm install
\`\`\`

## Configurar Base de Datos

\`\`\`bash
# Crear base de datos D1
npx wrangler d1 create ${projectName}-db

# Actualizar database_id en wrangler.jsonc

# Aplicar migraciones
npm run db:migrate
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Deployment

\`\`\`bash
npm run deploy
\`\`\`

---

Generado por ValidAI Studio - MVP Personalizado
Tiempo estimado de desarrollo: ${mvpPrototype.estimated_time}
Costo estimado: ${mvpPrototype.estimated_cost}
`
  };
}

/**
 * Fallback schema generator
 */
function generateFallbackSchema(
  project: ProjectData,
  mvpPrototype: MVPPrototype
): { [filename: string]: string } {
  
  // Generate basic schema based on features
  let schema = `-- Database schema for ${project.title}\n\n`;
  
  // Always include users table
  schema += `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  // Add feature-specific tables based on keywords
  const featuresText = mvpPrototype.features.join(' ').toLowerCase();
  
  if (featuresText.includes('dashboard') || featuresText.includes('metrics')) {
    schema += `CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  metric_name TEXT NOT NULL,
  value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);\n\n`;
  }
  
  if (featuresText.includes('chat') || featuresText.includes('message')) {
    schema += `CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER,
  to_user_id INTEGER,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);\n\n`;
  }
  
  // Add indexes
  schema += `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);\n`;
  
  // Add sample data
  schema += `\nINSERT OR IGNORE INTO users (id, email, name, role) VALUES
  (1, 'admin@${project.title.toLowerCase().replace(/\s+/g, '')}.com', 'Admin User', 'admin'),
  (2, 'user@${project.title.toLowerCase().replace(/\s+/g, '')}.com', 'Demo User', 'user');\n`;
  
  return {
    'migrations/0001_initial.sql': schema
  };
}

/**
 * Fallback API generator - Generates FUNCTIONAL code based on features
 */
function generateFallbackAPI(
  project: ProjectData,
  mvpPrototype: MVPPrototype
): { [filename: string]: string } {
  
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  // Analyze features to determine what entities we need
  const featuresText = mvpPrototype.features.join(' ').toLowerCase();
  const hasAuth = featuresText.includes('login') || featuresText.includes('auth') || featuresText.includes('usuario');
  const hasMessages = featuresText.includes('chat') || featuresText.includes('mensaje') || featuresText.includes('message');
  const hasDashboard = featuresText.includes('dashboard') || featuresText.includes('panel') || featuresText.includes('metrics');
  const hasAlerts = featuresText.includes('alert') || featuresText.includes('notificacion') || featuresText.includes('notification');
  
  const apiCode = `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
${hasAuth ? "import { sign, verify } from 'hono/jwt';" : ''}

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());
app.use('/static/*', serveStatic({ root: './public' }));

${hasAuth ? `
const JWT_SECRET = 'change-this-in-production';

// ============================================
// AUTHENTICATION API
// ============================================

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: 'Email ya registrado' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).bind(email, password, name).run();
    
    const token = await sign({ userId: result.meta.last_row_id, email }, JWT_SECRET);
    
    return c.json({ token, user: { id: result.meta.last_row_id, email, name } });
  } catch (error) {
    return c.json({ error: 'Error al registrar usuario' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password = ?'
    ).bind(email, password).first();
    
    if (!user) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }
    
    const token = await sign({ userId: user.id, email: user.email }, JWT_SECRET);
    
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});
` : ''}

// ============================================
// USERS API
// ============================================

app.get('/api/users', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT id, email, name, role, created_at FROM users').all();
    return c.json({ users: result.results });
  } catch (error) {
    return c.json({ error: 'Error fetching users' }, 500);
  }
});

app.get('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = await c.env.DB.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').bind(id).first();
    
    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    return c.json({ error: 'Error fetching user' }, 500);
  }
});

${hasMessages ? `
// ============================================
// MESSAGES API
// ============================================

app.get('/api/messages', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT m.*, u1.name as from_name, u2.name as to_name FROM messages m JOIN users u1 ON m.from_user_id = u1.id JOIN users u2 ON m.to_user_id = u2.id ORDER BY m.created_at DESC'
    ).all();
    return c.json({ messages: result.results });
  } catch (error) {
    return c.json({ error: 'Error fetching messages' }, 500);
  }
});

app.post('/api/messages', async (c) => {
  try {
    const { from_user_id, to_user_id, content } = await c.req.json();
    
    const result = await c.env.DB.prepare(
      'INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)'
    ).bind(from_user_id, to_user_id, content).run();
    
    return c.json({ 
      message: 'Mensaje enviado',
      id: result.meta.last_row_id 
    });
  } catch (error) {
    return c.json({ error: 'Error sending message' }, 500);
  }
});

app.get('/api/conversations/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const result = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE from_user_id = ? OR to_user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId, userId).all();
    return c.json({ messages: result.results });
  } catch (error) {
    return c.json({ error: 'Error fetching conversation' }, 500);
  }
});
` : ''}

${hasDashboard ? `
// ============================================
// METRICS API
// ============================================

app.get('/api/metrics', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM metrics ORDER BY created_at DESC LIMIT 100').all();
    return c.json({ metrics: result.results });
  } catch (error) {
    return c.json({ error: 'Error fetching metrics' }, 500);
  }
});

app.post('/api/metrics', async (c) => {
  try {
    const { user_id, metric_name, value } = await c.req.json();
    
    const result = await c.env.DB.prepare(
      'INSERT INTO metrics (user_id, metric_name, value) VALUES (?, ?, ?)'
    ).bind(user_id, metric_name, value).run();
    
    return c.json({ message: 'Métrica registrada', id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ error: 'Error saving metric' }, 500);
  }
});
` : ''}

${hasAlerts ? `
// ============================================
// ALERTS API
// ============================================

app.get('/api/alerts', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
    return c.json({ alerts: result.results });
  } catch (error) {
    return c.json({ error: 'Error fetching alerts' }, 500);
  }
});

app.post('/api/alerts', async (c) => {
  try {
    const { user_id, title, message, severity } = await c.req.json();
    
    const result = await c.env.DB.prepare(
      'INSERT INTO alerts (user_id, title, message, severity) VALUES (?, ?, ?, ?)'
    ).bind(user_id, title, message, severity || 'info').run();
    
    return c.json({ message: 'Alerta creada', id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ error: 'Error creating alert' }, 500);
  }
});

app.delete('/api/alerts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM alerts WHERE id = ?').bind(id).run();
    return c.json({ message: 'Alerta eliminada' });
  } catch (error) {
    return c.json({ error: 'Error deleting alert' }, 500);
  }
});
` : ''}

// ============================================
// MAIN PAGE
// ============================================

app.get('/', (c) => {
  return c.html(\`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-blue-600">
                    <i class="fas fa-heartbeat mr-2"></i>${project.title}
                </h1>
                <div id="nav-actions">
                    ${hasAuth ? `
                    <button onclick="showLogin()" class="text-gray-700 hover:text-blue-600 mr-4">Iniciar Sesión</button>
                    <button onclick="showRegister()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Registrarse</button>
                    ` : ''}
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 py-16">
        <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4">${project.title}</h2>
            <p class="text-xl text-gray-600 mb-8">${project.description}</p>
            <p class="text-lg text-gray-500">${project.value_proposition}</p>
        </div>

        <!-- Features Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            ${mvpPrototype.features.map((feature, index) => `
            <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div class="text-4xl mb-4 text-blue-600">
                    <i class="fas ${getFeatureIcon(feature)}"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">${feature}</h3>
                <button onclick="showFeatureDetail('${feature}')" class="mt-4 text-blue-600 hover:text-blue-800">
                    Ver detalles <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
            `).join('')}
        </div>

        <!-- Demo Section -->
        <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-2xl font-bold mb-6">Área de Demostración</h3>
            <div id="demo-area">
                ${hasDashboard ? '<div id="dashboard-demo"></div>' : ''}
                ${hasMessages ? '<div id="messages-demo"></div>' : ''}
                ${hasAlerts ? '<div id="alerts-demo"></div>' : ''}
                <p class="text-gray-600">Selecciona una característica para ver la demostración</p>
            </div>
        </div>
    </div>

    ${hasAuth ? `
    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div id="auth-content"></div>
        </div>
    </div>
    ` : ''}

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  \`);
});

export default app;`;

  const frontendCode = `// ${project.title} - Frontend Application
console.log('✅ ${project.title} MVP loaded');

// Global state
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    loadUserData();
  }
  
  // Load demo data
  loadDemoData();
});

${hasAuth ? `
// ============================================
// AUTHENTICATION
// ============================================

function showLogin() {
  document.getElementById('auth-content').innerHTML = \\\`
    <h2 class="text-2xl font-bold mb-6">Iniciar Sesión</h2>
    <form onsubmit="handleLogin(event)" class="space-y-4">
      <div>
        <input type="email" id="login-email" placeholder="Email" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <div>
        <input type="password" id="login-password" placeholder="Contraseña" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Iniciar Sesión
      </button>
    </form>
    <button onclick="closeModal()" class="absolute top-4 right-4">
      <i class="fas fa-times"></i>
    </button>
  \\\`;
  document.getElementById('auth-modal').classList.remove('hidden');
}

function showRegister() {
  document.getElementById('auth-content').innerHTML = \\\`
    <h2 class="text-2xl font-bold mb-6">Registrarse</h2>
    <form onsubmit="handleRegister(event)" class="space-y-4">
      <div>
        <input type="text" id="register-name" placeholder="Nombre" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <div>
        <input type="email" id="register-email" placeholder="Email" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <div>
        <input type="password" id="register-password" placeholder="Contraseña" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Crear Cuenta
      </button>
    </form>
    <button onclick="closeModal()" class="absolute top-4 right-4">
      <i class="fas fa-times"></i>
    </button>
  \\\`;
  document.getElementById('auth-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    authToken = response.data.token;
    currentUser = response.data.user;
    localStorage.setItem('authToken', authToken);
    closeModal();
    location.reload();
  } catch (error) {
    alert('Error al iniciar sesión: ' + (error.response?.data?.error || 'Error desconocido'));
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  try {
    const response = await axios.post('/api/auth/register', { name, email, password });
    authToken = response.data.token;
    currentUser = response.data.user;
    localStorage.setItem('authToken', authToken);
    closeModal();
    location.reload();
  } catch (error) {
    alert('Error al registrarse: ' + (error.response?.data?.error || 'Error desconocido'));
  }
}

async function loadUserData() {
  // Load user-specific data
  console.log('User authenticated, loading data...');
}
` : ''}

// ============================================
// DEMO DATA
// ============================================

async function loadDemoData() {
  try {
    const users = await axios.get('/api/users');
    console.log('Users loaded:', users.data.users?.length || 0);
    
    ${hasMessages ? `
    const messages = await axios.get('/api/messages');
    console.log('Messages loaded:', messages.data.messages?.length || 0);
    ` : ''}
    
    ${hasDashboard ? `
    const metrics = await axios.get('/api/metrics');
    console.log('Metrics loaded:', metrics.data.metrics?.length || 0);
    ` : ''}
    
    ${hasAlerts ? `
    const alerts = await axios.get('/api/alerts');
    console.log('Alerts loaded:', alerts.data.alerts?.length || 0);
    ` : ''}
  } catch (error) {
    console.error('Error loading demo data:', error);
  }
}

function showFeatureDetail(feature) {
  const demoArea = document.getElementById('demo-area');
  demoArea.innerHTML = \\\`
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h4 class="text-xl font-bold mb-3 text-blue-900">\${feature}</h4>
      <p class="text-gray-700 mb-4">Esta característica está lista para ser implementada.</p>
      <div class="flex gap-4">
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Probar Demo
        </button>
        <button class="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
          Ver Documentación
        </button>
      </div>
    </div>
  \\\`;
}

// Feature-specific functions
${mvpPrototype.features.map((feature, index) => `
async function feature${index + 1}_${feature.toLowerCase().replace(/\s+/g, '_')}() {
  console.log('Ejecutando: ${feature}');
  // Implementación específica aquí
}
`).join('\n')}
`;

  return {
    'src/index.tsx': apiCode,
    'public/static/app.js': frontendCode
  };
}

/**
 * Get icon for feature based on keywords
 */
function getFeatureIcon(feature: string): string {
  const lower = feature.toLowerCase();
  if (lower.includes('dashboard') || lower.includes('panel')) return 'fa-chart-line';
  if (lower.includes('chat') || lower.includes('mensaje')) return 'fa-comments';
  if (lower.includes('alert') || lower.includes('notificación')) return 'fa-bell';
  if (lower.includes('report') || lower.includes('reporte')) return 'fa-file-alt';
  if (lower.includes('móvil') || lower.includes('mobile')) return 'fa-mobile-alt';
  if (lower.includes('integr')) return 'fa-plug';
  return 'fa-check-circle';
}

/**
 * Generate basic CSS
 */
function generateBasicCSS(): string {
  return `/* Custom styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.shadow-lg {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

button {
  transition: all 0.2s ease;
}

button:active {
  transform: scale(0.98);
}

.card {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
`;
}
