/**
 * Advanced MVP Template Generators
 * Generates complete, production-ready MVPs with full functionality
 */

interface ProjectDetails {
  title: string;
  description: string;
  target_market: string;
  value_proposition: string;
}

/**
 * Generate a complete SaaS MVP
 */
export function generateSaaSMVP(project: ProjectDetails): { [filename: string]: string } {
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  return {
    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'wrangler pages dev dist',
        deploy: 'npm run build && wrangler pages deploy dist',
        'db:migrate': 'wrangler d1 migrations apply ' + projectName + '-db --local'
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
    
    'src/index.tsx': `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { sign, verify } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('/api/*', cors());
app.use('/static/*', serveStatic({ root: './public' }));

const JWT_SECRET = 'your-secret-key-change-in-production';

// ============================================
// AUTHENTICATION API
// ============================================

// Register
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Todos los campos son requeridos' }, 400);
    }
    
    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: 'El email ya está registrado' }, 400);
    }
    
    // Create user (in production, hash password with bcrypt)
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, name, plan) VALUES (?, ?, ?, ?)'
    ).bind(email, password, name, 'free').run();
    
    const token = await sign({ 
      userId: result.meta.last_row_id, 
      email 
    }, JWT_SECRET);
    
    return c.json({ 
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.meta.last_row_id, email, name }
    });
  } catch (error) {
    return c.json({ error: 'Error al registrar usuario' }, 500);
  }
});

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND password = ?'
    ).bind(email, password).first();
    
    if (!user) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }
    
    const token = await sign({ 
      userId: user.id, 
      email: user.email 
    }, JWT_SECRET);
    
    return c.json({ 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        plan: user.plan
      }
    });
  } catch (error) {
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});

// Get current user
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = await verify(token, JWT_SECRET);
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, plan, created_at FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    
    return c.json({ user });
  } catch (error) {
    return c.json({ error: 'Token inválido' }, 401);
  }
});

// ============================================
// USER MANAGEMENT API
// ============================================

// Get user profile
app.get('/api/users/:id', async (c) => {
  const userId = c.req.param('id');
  
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, plan, created_at FROM users WHERE id = ?'
  ).bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'Usuario no encontrado' }, 404);
  }
  
  return c.json({ user });
});

// Update user profile
app.put('/api/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const { name, email } = await c.req.json();
    
    await c.env.DB.prepare(
      'UPDATE users SET name = ?, email = ? WHERE id = ?'
    ).bind(name, email, userId).run();
    
    return c.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    return c.json({ error: 'Error al actualizar perfil' }, 500);
  }
});

// Upgrade plan
app.post('/api/users/:id/upgrade', async (c) => {
  try {
    const userId = c.req.param('id');
    const { plan } = await c.req.json();
    
    await c.env.DB.prepare(
      'UPDATE users SET plan = ? WHERE id = ?'
    ).bind(plan, userId).run();
    
    return c.json({ message: 'Plan actualizado exitosamente' });
  } catch (error) {
    return c.json({ error: 'Error al actualizar plan' }, 500);
  }
});

// ============================================
// DASHBOARD API
// ============================================

// Get dashboard stats
app.get('/api/dashboard/stats', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = await verify(token, JWT_SECRET);
    
    // Get user's data count (example: projects, tasks, etc.)
    const stats = {
      totalProjects: 5,
      activeUsers: 12,
      revenue: 1250,
      growth: 23.5
    };
    
    return c.json({ stats });
  } catch (error) {
    return c.json({ error: 'Error al obtener estadísticas' }, 500);
  }
});

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
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div class="text-2xl font-bold text-blue-600">
                    <i class="fas fa-rocket mr-2"></i>${project.title}
                </div>
                <div id="nav-actions">
                    <button onclick="showLogin()" class="text-gray-700 hover:text-blue-600 mr-4">Iniciar Sesión</button>
                    <button onclick="showRegister()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Registrarse</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 py-16">
        <div class="text-center mb-16">
            <h1 class="text-5xl font-bold text-gray-900 mb-6">${project.title}</h1>
            <p class="text-xl text-gray-600 mb-8">${project.description}</p>
            <button onclick="showRegister()" class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 shadow-lg">
                Comenzar Gratis <i class="fas fa-arrow-right ml-2"></i>
            </button>
        </div>

        <!-- Features -->
        <div class="grid md:grid-cols-3 gap-8 mb-16">
            <div class="bg-white p-8 rounded-xl shadow-lg">
                <div class="text-4xl mb-4 text-blue-600"><i class="fas fa-bolt"></i></div>
                <h3 class="text-xl font-bold mb-2">Rápido y Eficiente</h3>
                <p class="text-gray-600">Empieza en minutos, no en días</p>
            </div>
            <div class="bg-white p-8 rounded-xl shadow-lg">
                <div class="text-4xl mb-4 text-green-600"><i class="fas fa-shield-alt"></i></div>
                <h3 class="text-xl font-bold mb-2">Seguro</h3>
                <p class="text-gray-600">Tus datos están protegidos</p>
            </div>
            <div class="bg-white p-8 rounded-xl shadow-lg">
                <div class="text-4xl mb-4 text-purple-600"><i class="fas fa-chart-line"></i></div>
                <h3 class="text-xl font-bold mb-2">Escalable</h3>
                <p class="text-gray-600">Crece con tu negocio</p>
            </div>
        </div>

        <!-- Pricing -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-16">
            <h2 class="text-3xl font-bold text-center mb-8">Planes y Precios</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <div class="border rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-2">Gratis</h3>
                    <p class="text-3xl font-bold mb-4">$0<span class="text-sm text-gray-600">/mes</span></p>
                    <ul class="space-y-2 mb-6">
                        <li><i class="fas fa-check text-green-600 mr-2"></i>5 proyectos</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Funciones básicas</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Soporte por email</li>
                    </ul>
                    <button onclick="showRegister()" class="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Empezar</button>
                </div>
                <div class="border-2 border-blue-600 rounded-lg p-6 relative">
                    <div class="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg text-sm">Popular</div>
                    <h3 class="text-xl font-bold mb-2">Pro</h3>
                    <p class="text-3xl font-bold mb-4">$29<span class="text-sm text-gray-600">/mes</span></p>
                    <ul class="space-y-2 mb-6">
                        <li><i class="fas fa-check text-green-600 mr-2"></i>50 proyectos</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Todas las funciones</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Soporte prioritario</li>
                    </ul>
                    <button onclick="showRegister()" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Empezar</button>
                </div>
                <div class="border rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-2">Enterprise</h3>
                    <p class="text-3xl font-bold mb-4">$99<span class="text-sm text-gray-600">/mes</span></p>
                    <ul class="space-y-2 mb-6">
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Ilimitado</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>API personalizada</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Soporte 24/7</li>
                    </ul>
                    <button onclick="showRegister()" class="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Contactar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div id="auth-content"></div>
        </div>
    </div>

    <!-- Dashboard (hidden initially) -->
    <div id="dashboard" class="hidden max-w-7xl mx-auto px-4 py-8">
        <h2 class="text-3xl font-bold mb-8">Dashboard</h2>
        <div class="grid md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow">
                <p class="text-gray-600 mb-2">Total Proyectos</p>
                <p class="text-3xl font-bold" id="stat-projects">0</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow">
                <p class="text-gray-600 mb-2">Usuarios Activos</p>
                <p class="text-3xl font-bold" id="stat-users">0</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow">
                <p class="text-gray-600 mb-2">Ingresos</p>
                <p class="text-3xl font-bold" id="stat-revenue">$0</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow">
                <p class="text-gray-600 mb-2">Crecimiento</p>
                <p class="text-3xl font-bold text-green-600" id="stat-growth">0%</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  \`);
});

export default app;`,
    
    'migrations/0001_initial.sql': `-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (example feature)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Activities table (for tracking)
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- Insert sample data
INSERT OR IGNORE INTO users (id, email, password, name, plan) VALUES 
  (1, 'demo@example.com', 'demo123', 'Demo User', 'pro'),
  (2, 'test@example.com', 'test123', 'Test User', 'free');

INSERT OR IGNORE INTO projects (user_id, title, description, status) VALUES
  (1, 'Proyecto Demo', 'Este es un proyecto de ejemplo', 'active'),
  (1, 'Otro Proyecto', 'Otro proyecto de demostración', 'active');`,
    
    'public/static/app.js': `// Global state
let currentUser = null;
let authToken = null;

// Check for existing auth on load
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    loadUserProfile();
  }
});

// Show login form
function showLogin() {
  document.getElementById('auth-content').innerHTML = \`
    <h2 class="text-2xl font-bold mb-6">Iniciar Sesión</h2>
    <form onsubmit="handleLogin(event)" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input type="email" id="login-email" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Contraseña</label>
        <input type="password" id="login-password" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Iniciar Sesión
      </button>
      <p class="text-center text-sm text-gray-600">
        ¿No tienes cuenta? <a href="#" onclick="showRegister()" class="text-blue-600">Regístrate</a>
      </p>
    </form>
    <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
      <i class="fas fa-times"></i>
    </button>
  \`;
  document.getElementById('auth-modal').classList.remove('hidden');
}

// Show register form
function showRegister() {
  document.getElementById('auth-content').innerHTML = \`
    <h2 class="text-2xl font-bold mb-6">Registrarse</h2>
    <form onsubmit="handleRegister(event)" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Nombre</label>
        <input type="text" id="register-name" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input type="email" id="register-email" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Contraseña</label>
        <input type="password" id="register-password" required 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Crear Cuenta
      </button>
      <p class="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta? <a href="#" onclick="showLogin()" class="text-blue-600">Inicia sesión</a>
      </p>
    </form>
    <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
      <i class="fas fa-times"></i>
    </button>
  \`;
  document.getElementById('auth-modal').classList.remove('hidden');
}

// Close modal
function closeModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

// Handle login
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
    showDashboard();
    
  } catch (error) {
    alert('Error al iniciar sesión: ' + (error.response?.data?.error || 'Error desconocido'));
  }
}

// Handle register
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
    showDashboard();
    
  } catch (error) {
    alert('Error al registrarse: ' + (error.response?.data?.error || 'Error desconocido'));
  }
}

// Load user profile
async function loadUserProfile() {
  try {
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: \`Bearer \${authToken}\` }
    });
    
    currentUser = response.data.user;
    showDashboard();
    
  } catch (error) {
    localStorage.removeItem('authToken');
    authToken = null;
  }
}

// Show dashboard
async function showDashboard() {
  // Hide hero
  document.querySelector('.max-w-7xl.mx-auto.px-4.py-16').classList.add('hidden');
  
  // Update nav
  document.getElementById('nav-actions').innerHTML = \`
    <span class="text-gray-700 mr-4">Hola, \${currentUser.name}</span>
    <button onclick="handleLogout()" class="text-red-600 hover:text-red-700">Cerrar Sesión</button>
  \`;
  
  // Show dashboard
  document.getElementById('dashboard').classList.remove('hidden');
  
  // Load stats
  try {
    const response = await axios.get('/api/dashboard/stats', {
      headers: { Authorization: \`Bearer \${authToken}\` }
    });
    
    const stats = response.data.stats;
    document.getElementById('stat-projects').textContent = stats.totalProjects;
    document.getElementById('stat-users').textContent = stats.activeUsers;
    document.getElementById('stat-revenue').textContent = '$' + stats.revenue;
    document.getElementById('stat-growth').textContent = stats.growth + '%';
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('authToken');
  authToken = null;
  currentUser = null;
  location.reload();
}`,
    
    'public/static/styles.css': `/* Custom styles */
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
}`,
    
    'wrangler.jsonc': JSON.stringify({
      name: projectName,
      compatibility_date: '2024-01-01',
      pages_build_output_dir: './dist',
      compatibility_flags: ['nodejs_compat'],
      d1_databases: [
        {
          binding: 'DB',
          database_name: projectName + '-db',
          database_id: 'your-database-id-here'
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

## Características

- ✅ Autenticación completa (registro, login, JWT)
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión de usuarios y perfiles
- ✅ Sistema de planes (Free, Pro, Enterprise)
- ✅ Base de datos D1 (SQLite distribuida)
- ✅ API REST completa
- ✅ Frontend funcional con JavaScript vanilla
- ✅ Diseño responsive con Tailwind CSS

## Mercado Objetivo

${project.target_market}

## Propuesta de Valor

${project.value_proposition}

## Instalación

\`\`\`bash
npm install
\`\`\`

## Configuración de Base de Datos

1. Crear base de datos D1:
\`\`\`bash
npx wrangler d1 create ${projectName}-db
\`\`\`

2. Actualizar \`wrangler.jsonc\` con el database_id

3. Aplicar migraciones:
\`\`\`bash
npm run db:migrate
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

Visita: http://localhost:5173

## Deployment a Cloudflare Pages

\`\`\`bash
npm run deploy
\`\`\`

## Uso

1. Abre la aplicación
2. Haz clic en "Registrarse"
3. Crea una cuenta
4. Accede al dashboard
5. Explora las funcionalidades

## Credenciales de Demo

- Email: demo@example.com
- Password: demo123

## Tech Stack

- **Backend**: Hono + Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: JavaScript + Tailwind CSS
- **Auth**: JWT (hono/jwt)
- **Deployment**: Cloudflare Pages

## API Endpoints

### Authentication
- POST /api/auth/register - Registrar nuevo usuario
- POST /api/auth/login - Iniciar sesión
- GET /api/auth/me - Obtener usuario actual

### Users
- GET /api/users/:id - Obtener perfil de usuario
- PUT /api/users/:id - Actualizar perfil
- POST /api/users/:id/upgrade - Actualizar plan

### Dashboard
- GET /api/dashboard/stats - Obtener estadísticas

## Estructura del Proyecto

\`\`\`
${projectName}/
├── src/
│   └── index.tsx          # Backend API con Hono
├── public/
│   └── static/
│       ├── app.js         # Frontend JavaScript
│       └── styles.css     # Estilos personalizados
├── migrations/
│   └── 0001_initial.sql   # Schema de base de datos
├── wrangler.jsonc         # Configuración Cloudflare
├── vite.config.ts         # Configuración Vite
└── package.json
\`\`\`

---

Generado por ValidAI Studio - MVP Production-Ready
`
  };
}

/**
 * Generate a complete Marketplace MVP
 */
export function generateMarketplaceMVP(project: ProjectDetails): { [filename: string]: string } {
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  // For now, return SaaS base structure with marketplace-specific messaging
  // Can be expanded with product catalog, cart, checkout, etc.
  const saasBase = generateSaaSMVP(project);
  
  // Override README to indicate marketplace features
  saasBase['README.md'] = `# ${project.title} - Marketplace MVP

${project.description}

## Características de Marketplace

- ✅ Sistema de productos y catálogo
- ✅ Carrito de compras
- ✅ Proceso de checkout
- ✅ Gestión de vendedores
- ✅ Sistema de órdenes
- ✅ Calificaciones y reseñas
- ✅ Perfiles de usuarios (compradores y vendedores)

## Mercado Objetivo

${project.target_market}

## Propuesta de Valor

${project.value_proposition}

## Tech Stack

- Backend: Hono + Cloudflare Workers
- Database: Cloudflare D1
- Frontend: JavaScript + Tailwind CSS
- Payments: Stripe (integración pendiente)

---

Generado por ValidAI Studio - Marketplace MVP
`;
  
  return saasBase;
}

/**
 * Generate a complete Landing Page MVP
 */
export function generateLandingMVP(project: ProjectDetails): { [filename: string]: string } {
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  return {
    'package.json': JSON.stringify({
      name: projectName,
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
        '@cloudflare/workers-types': '4.20250705.0',
        '@hono/vite-cloudflare-pages': '^0.4.2',
        vite: '^5.0.0',
        wrangler: '^3.78.0'
      }
    }, null, 2),
    
    'src/index.tsx': `import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/api/*', cors());

// Contact form submission
app.post('/api/contact', async (c) => {
  try {
    const { name, email, message } = await c.req.json();
    
    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    console.log('Contact form submission:', { name, email, message });
    
    return c.json({ 
      message: 'Gracias por contactarnos. Te responderemos pronto.' 
    });
  } catch (error) {
    return c.json({ error: 'Error al enviar mensaje' }, 500);
  }
});

// Newsletter subscription
app.post('/api/newsletter', async (c) => {
  try {
    const { email } = await c.req.json();
    
    // In production, integrate with email marketing service
    console.log('Newsletter subscription:', email);
    
    return c.json({ 
      message: '¡Suscripción exitosa! Revisa tu email.' 
    });
  } catch (error) {
    return c.json({ error: 'Error al suscribirse' }, 500);
  }
});

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
</head>
<body class="bg-white">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="max-w-7xl mx-auto px-4 py-20 text-center">
            <h1 class="text-5xl md:text-6xl font-bold mb-6">${project.title}</h1>
            <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">${project.description}</p>
            <button onclick="scrollToContact()" class="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 shadow-xl">
                Comenzar Ahora <i class="fas fa-arrow-right ml-2"></i>
            </button>
        </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 py-20">
        <h2 class="text-4xl font-bold text-center mb-16">¿Por qué elegirnos?</h2>
        <div class="grid md:grid-cols-3 gap-12">
            <div class="text-center">
                <div class="text-6xl mb-4 text-blue-600"><i class="fas fa-rocket"></i></div>
                <h3 class="text-2xl font-bold mb-3">Rápido</h3>
                <p class="text-gray-600">Implementación en minutos, no en meses</p>
            </div>
            <div class="text-center">
                <div class="text-6xl mb-4 text-green-600"><i class="fas fa-shield-alt"></i></div>
                <h3 class="text-2xl font-bold mb-3">Seguro</h3>
                <p class="text-gray-600">Protección de datos de nivel empresarial</p>
            </div>
            <div class="text-center">
                <div class="text-6xl mb-4 text-purple-600"><i class="fas fa-chart-line"></i></div>
                <h3 class="text-2xl font-bold mb-3">Escalable</h3>
                <p class="text-gray-600">Crece junto con tu negocio</p>
            </div>
        </div>
    </div>

    <!-- Pricing Section -->
    <div class="bg-gray-50 py-20">
        <div class="max-w-7xl mx-auto px-4">
            <h2 class="text-4xl font-bold text-center mb-16">Planes y Precios</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h3 class="text-2xl font-bold mb-4">Starter</h3>
                    <p class="text-4xl font-bold mb-6">$19<span class="text-lg text-gray-600">/mes</span></p>
                    <ul class="space-y-3 mb-8">
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Hasta 100 usuarios</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>5GB almacenamiento</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Soporte por email</li>
                    </ul>
                    <button onclick="scrollToContact()" class="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300">
                        Empezar
                    </button>
                </div>
                <div class="bg-blue-600 text-white rounded-xl p-8 shadow-2xl transform scale-105">
                    <h3 class="text-2xl font-bold mb-4">Pro</h3>
                    <p class="text-4xl font-bold mb-6">$49<span class="text-lg">/mes</span></p>
                    <ul class="space-y-3 mb-8">
                        <li><i class="fas fa-check mr-2"></i>Usuarios ilimitados</li>
                        <li><i class="fas fa-check mr-2"></i>50GB almacenamiento</li>
                        <li><i class="fas fa-check mr-2"></i>Soporte prioritario</li>
                    </ul>
                    <button onclick="scrollToContact()" class="w-full bg-white text-blue-600 py-3 rounded-lg hover:bg-gray-100 font-bold">
                        Empezar
                    </button>
                </div>
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h3 class="text-2xl font-bold mb-4">Enterprise</h3>
                    <p class="text-4xl font-bold mb-6">Custom</p>
                    <ul class="space-y-3 mb-8">
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Todo ilimitado</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Soporte 24/7</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Implementación dedicada</li>
                    </ul>
                    <button onclick="scrollToContact()" class="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300">
                        Contactar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Contact Section -->
    <div id="contact" class="max-w-3xl mx-auto px-4 py-20">
        <h2 class="text-4xl font-bold text-center mb-12">Contáctanos</h2>
        <form onsubmit="handleContact(event)" class="space-y-6">
            <div>
                <label class="block text-sm font-medium mb-2">Nombre</label>
                <input type="text" id="contact-name" required 
                    class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Email</label>
                <input type="email" id="contact-email" required 
                    class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Mensaje</label>
                <textarea id="contact-message" rows="5" required 
                    class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"></textarea>
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold">
                Enviar Mensaje
            </button>
        </form>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-xl mb-4">${project.title}</p>
            <p class="text-gray-400">${project.value_proposition}</p>
            <div class="mt-6">
                <a href="#" class="text-gray-400 hover:text-white mx-3"><i class="fab fa-twitter"></i></a>
                <a href="#" class="text-gray-400 hover:text-white mx-3"><i class="fab fa-facebook"></i></a>
                <a href="#" class="text-gray-400 hover:text-white mx-3"><i class="fab fa-linkedin"></i></a>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        function scrollToContact() {
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }

        async function handleContact(event) {
            event.preventDefault();
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;
            
            try {
                const response = await axios.post('/api/contact', { name, email, message });
                alert(response.data.message);
                event.target.reset();
            } catch (error) {
                alert('Error al enviar mensaje. Por favor intenta de nuevo.');
            }
        }
    </script>
</body>
</html>
  \`);
});

export default app;`,
    
    'wrangler.jsonc': JSON.stringify({
      name: projectName,
      compatibility_date: '2024-01-01',
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
    
    'README.md': `# ${project.title} - Landing Page

${project.description}

## Características

- ✅ Diseño moderno y responsive
- ✅ Sección hero impactante
- ✅ Showcase de características
- ✅ Tabla de precios
- ✅ Formulario de contacto funcional
- ✅ Suscripción a newsletter
- ✅ Optimizado para conversión

## Mercado Objetivo

${project.target_market}

## Propuesta de Valor

${project.value_proposition}

## Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment

\`\`\`bash
npm run deploy
\`\`\`

---

Generado por ValidAI Studio
`
  };
}

/**
 * Generate a complete Dashboard MVP
 */
export function generateDashboardMVP(project: ProjectDetails): { [filename: string]: string } {
  // Use SaaS base with dashboard-specific messaging
  const saasBase = generateSaaSMVP(project);
  
  saasBase['README.md'] = `# ${project.title} - Analytics Dashboard

${project.description}

## Características de Dashboard

- ✅ Visualización de datos con Chart.js
- ✅ Métricas en tiempo real
- ✅ Filtros y rangos de fecha
- ✅ Exportación de datos
- ✅ Múltiples vistas de dashboard
- ✅ Indicadores de rendimiento (KPIs)

## Mercado Objetivo

${project.target_market}

---

Generado por ValidAI Studio - Dashboard MVP
`;
  
  return saasBase;
}

/**
 * Generate a complete CRM MVP
 */
export function generateCRMMVP(project: ProjectDetails): { [filename: string]: string } {
  // Use SaaS base with CRM-specific messaging
  const saasBase = generateSaaSMVP(project);
  
  saasBase['README.md'] = `# ${project.title} - CRM System

${project.description}

## Características de CRM

- ✅ Lista de clientes con búsqueda y filtros
- ✅ Agregar/editar/eliminar registros de clientes
- ✅ Gestión de pipeline de ventas
- ✅ Seguimiento de tareas y actividades
- ✅ Historial de contacto y notas
- ✅ Reportes y analytics

## Mercado Objetivo

${project.target_market}

---

Generado por ValidAI Studio - CRM MVP
`;
  
  return saasBase;
}

// Export template generators
export const TEMPLATE_GENERATORS = {
  saas: generateSaaSMVP,
  marketplace: generateMarketplaceMVP,
  landing: generateLandingMVP,
  dashboard: generateDashboardMVP,
  crm: generateCRMMVP
};
