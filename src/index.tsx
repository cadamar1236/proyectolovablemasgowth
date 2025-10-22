import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import API routes
import projects from './api/projects';
import validation from './api/validation';
import betaUsers from './api/beta-users';
import mvpGenerator from './api/mvp-generator';
import deploy from './api/deploy';
import auth from './api/auth';
import marketplace from './api/marketplace';
import plans from './api/plans';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', auth);
app.route('/api/marketplace', marketplace);
app.route('/api/plans', plans);
app.route('/api/projects', projects);
app.route('/api/validation', validation);
app.route('/api/beta-users', betaUsers);
app.route('/api/mvp', mvpGenerator);
app.route('/api/deploy', deploy);

// Frontend Routes
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ValidAI Studio - Validación IA + Venture Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366f1',
              secondary: '#8b5cf6',
            }
          }
        }
      }
    </script>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <span class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        ⚡ ValidAI Studio
                    </span>
                </div>
                <div class="flex items-center space-x-8">
                    <a href="#dashboard" class="text-gray-700 hover:text-primary transition">Dashboard</a>
                    <a href="#validation" class="text-gray-700 hover:text-primary transition">Validación</a>
                    <a href="/marketplace" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-tag mr-1 text-green-500"></i>Planes
                    </a>
                    <button onclick="showAuthModal('login')" class="text-gray-700 hover:text-primary transition">
                        Iniciar Sesión
                    </button>
                    <button onclick="showAuthModal('register')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                        Registrarse
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-purple-600 text-white">
        <div class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            <div class="text-center">
                <h1 class="text-5xl md:text-6xl font-extrabold mb-6">
                    Validamos y lanzamos startups exitosas
                    <span class="block text-yellow-300">10x más rápido</span>
                </h1>
                <p class="text-xl md:text-2xl mb-8 text-purple-100">
                    Plataforma IA + Venture Studio = Éxito 10x
                </p>
                <p class="text-lg mb-12 max-w-3xl mx-auto text-purple-50">
                    De la idea a datos accionables en 48 horas. Validación + Growth Marketing + Escalamiento.
                </p>
                <div class="flex justify-center space-x-4">
                    <button onclick="showValidationForm()" class="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105">
                        <i class="fas fa-rocket mr-2"></i>Validar Mi Idea Ahora
                    </button>
                    <button onclick="scrollToSection('pricing')" class="bg-purple-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-900 transition">
                        Ver Planes
                    </button>
                </div>
            </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" class="fill-gray-50">
                <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L0,120Z"></path>
            </svg>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="text-4xl font-bold text-primary mb-2">48h</div>
                <div class="text-gray-600">Validación completa</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="text-4xl font-bold text-primary mb-2">90%</div>
                <div class="text-gray-600">Más rápido que métodos tradicionales</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="text-4xl font-bold text-primary mb-2">85%</div>
                <div class="text-gray-600">Precisión en predicciones</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="text-4xl font-bold text-primary mb-2">10K+</div>
                <div class="text-gray-600">Usuarios beta disponibles</div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div id="app" class="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <!-- Features Section -->
        <div id="dashboard" class="mb-20">
            <h2 class="text-4xl font-bold text-gray-900 mb-4 text-center">¿Cómo Funciona?</h2>
            <p class="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
                De idea a datos accionables en 5 pasos automáticos
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <span class="text-2xl font-bold text-primary">1</span>
                    </div>
                    <h3 class="text-lg font-semibold mb-2 text-gray-900">Input de Idea</h3>
                    <p class="text-gray-600 text-sm">Completa el formulario con los detalles de tu idea y mercado objetivo</p>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                        <span class="text-2xl font-bold text-secondary">2</span>
                    </div>
                    <h3 class="text-lg font-semibold mb-2 text-gray-900">Análisis IA</h3>
                    <p class="text-gray-600 text-sm">Nuestra IA analiza competidores, tendencias y oportunidades en tiempo real</p>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div class="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                        <span class="text-2xl font-bold text-purple-500">3</span>
                    </div>
                    <h3 class="text-lg font-semibold mb-2 text-gray-900">Generador MVP</h3>
                    <p class="text-gray-600 text-sm">Creación automática de prototipos funcionales usando IA generativa</p>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div class="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
                        <span class="text-2xl font-bold text-pink-500">4</span>
                    </div>
                    <h3 class="text-lg font-semibold mb-2 text-gray-900">Testing Beta</h3>
                    <p class="text-gray-600 text-sm">Panel pre-seleccionado prueba tu producto y proporciona feedback detallado</p>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div class="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <span class="text-2xl font-bold text-green-500">5</span>
                    </div>
                    <h3 class="text-lg font-semibold mb-2 text-gray-900">Resultados</h3>
                    <p class="text-gray-600 text-sm">Métricas claras y recomendaciones para iterar o seguir adelante</p>
                </div>
            </div>
        </div>

        <!-- Validation Form (Hidden by default) -->
        <div id="validation-form-section" class="mb-20 hidden">
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
                <h2 class="text-3xl font-bold text-gray-900 mb-2 text-center">Validación Express</h2>
                <p class="text-gray-600 mb-8 text-center">Completa el formulario y obtén resultados en 48 horas</p>
                
                <form id="validation-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Título del Proyecto</label>
                        <input type="text" id="title" required 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="ej: HealthTrack AI">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                        <textarea id="description" required rows="4"
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  placeholder="Describe tu idea en detalle..."></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Mercado Objetivo</label>
                        <input type="text" id="target_market" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="ej: Profesionales de la salud en LATAM">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Propuesta de Valor</label>
                        <textarea id="value_proposition" required rows="3"
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  placeholder="¿Qué problema resuelves y cómo?"></textarea>
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition">
                        <i class="fas fa-rocket mr-2"></i>Iniciar Validación
                    </button>
                </form>
            </div>
        </div>

        <!-- Projects Dashboard -->
        <div id="projects-section" class="mb-20">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-3xl font-bold text-gray-900">Mis Proyectos</h2>
                <button onclick="showValidationForm()" class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition">
                    <i class="fas fa-plus mr-2"></i>Nuevo Proyecto
                </button>
            </div>
            
            <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Projects will be loaded here -->
            </div>
        </div>

        <!-- Beta Users Panel -->
        <div id="beta-panel" class="mb-20">
            <h2 class="text-3xl font-bold text-gray-900 mb-4 text-center">Panel de Usuarios Beta</h2>
            <p class="text-xl text-gray-600 mb-8 text-center">
                Accede a 10,000+ usuarios beta pre-cualificados en tu nicho
            </p>
            
            <div id="beta-users-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Beta users will be loaded here -->
            </div>
        </div>

        <!-- Pricing Section -->
        <div id="pricing" class="mb-20">
            <h2 class="text-4xl font-bold text-gray-900 mb-4 text-center">Planes y Precios</h2>
            <p class="text-xl text-gray-600 mb-8 text-center">Elige el plan perfecto para tu etapa de crecimiento</p>
            
            <!-- Plan Type Selector -->
            <div class="flex justify-center mb-6">
                <div class="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg p-1 inline-flex">
                    <button id="platform-plans-btn" onclick="switchPlanType('platform')" class="px-8 py-3 rounded-lg font-semibold transition bg-white text-primary">
                        🎯 Plataforma Completa
                        <span class="block text-xs font-normal mt-1">MVP + IA + Marketplace</span>
                    </button>
                    <button id="marketplace-plans-btn" onclick="switchPlanType('marketplace')" class="px-8 py-3 rounded-lg font-semibold transition text-white hover:bg-white/10">
                        🏪 Solo Marketplace
                        <span class="block text-xs font-normal mt-1">Red de Validadores</span>
                    </button>
                </div>
            </div>
            
            <!-- Description based on plan type -->
            <div id="platform-description" class="text-center mb-8 max-w-3xl mx-auto">
                <p class="text-gray-600">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Incluye: Generador MVP con IA, Validación automatizada, Analytics y acceso completo al Marketplace de validadores
                </p>
            </div>
            
            <div id="marketplace-description" class="hidden text-center mb-8 max-w-3xl mx-auto">
                <p class="text-gray-600">
                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                    Solo acceso al Marketplace de validadores. <strong>Ideal si ya tienes tu producto</strong> y solo necesitas feedback de expertos.
                </p>
            </div>
            
            <!-- Billing Toggle -->
            <div class="flex justify-center mb-8">
                <div class="bg-white rounded-lg shadow-md p-2 inline-flex">
                    <button id="monthly-billing-btn" onclick="switchBillingCycle('monthly')" class="px-6 py-2 rounded-md font-semibold transition bg-primary text-white">
                        Mensual
                    </button>
                    <button id="yearly-billing-btn" onclick="switchBillingCycle('yearly')" class="px-6 py-2 rounded-md font-semibold transition text-gray-700 hover:bg-gray-100">
                        Anual <span class="text-green-600 text-xs ml-1">(Ahorra 20%)</span>
                    </button>
                </div>
            </div>
            
            <!-- Plans Grid (will be populated dynamically) -->
            <div id="pricing-plans-grid" class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <!-- Loading state -->
                <div class="col-span-3 text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p class="text-gray-600">Cargando planes...</p>
                </div>
            </div>

            <!-- Managed Services -->
            <div class="mt-16 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">Servicios Managed</h3>
                <p class="text-gray-600 mb-8 text-center">Nuestros expertos hacen el trabajo por ti</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <h4 class="text-xl font-bold text-gray-900 mb-2">Validación Express</h4>
                        <div class="text-3xl font-bold text-primary mb-4">$2,997</div>
                        <ul class="space-y-2 text-sm text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Análisis profundo de mercado</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>20+ entrevistas con usuarios</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Entrega en 2 semanas</li>
                        </ul>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <h4 class="text-xl font-bold text-gray-900 mb-2">MVP + Growth Launch</h4>
                        <div class="text-3xl font-bold text-secondary mb-4">$14,997</div>
                        <ul class="space-y-2 text-sm text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>MVP funcional completo</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Growth Marketing Launch</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Entrega en 6-8 semanas</li>
                        </ul>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <h4 class="text-xl font-bold text-gray-900 mb-2">Growth Retainer</h4>
                        <div class="text-3xl font-bold text-purple-600 mb-4">Desde $3,997/mes</div>
                        <ul class="space-y-2 text-sm text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Startup ($3,997/mes)</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Scale-up ($7,997/mes)</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Enterprise ($14,997/mes)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 class="text-xl font-bold mb-4">ValidAI Studio</h3>
                    <p class="text-gray-400">Validamos y lanzamos startups exitosas 10x más rápido usando IA y el modelo studio.</p>
                </div>
                <div>
                    <h4 class="font-semibold mb-4">Producto</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white">Plataforma</a></li>
                        <li><a href="#" class="hover:text-white">Venture Studio</a></li>
                        <li><a href="#pricing" class="hover:text-white">Precios</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold mb-4">Recursos</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white">Blog</a></li>
                        <li><a href="#" class="hover:text-white">Casos de Éxito</a></li>
                        <li><a href="#" class="hover:text-white">Documentación</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold mb-4">Empresa</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white">Acerca de</a></li>
                        <li><a href="#" class="hover:text-white">Únete al Equipo</a></li>
                        <li><a href="#" class="hover:text-white">Contacto</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2025 ValidAI Studio. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  `);
});

// Project detail page
app.get('/project/:id', async (c) => {
  const projectId = c.req.param('id');
  
  return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proyecto - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366f1',
              secondary: '#8b5cf6',
            }
          }
        }
      }
    </script>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        ⚡ ValidAI Studio
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-arrow-left mr-2"></i>Volver al Dashboard
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div id="project-details">
            <!-- Loading state -->
            <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                <p class="text-gray-600">Cargando proyecto...</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      const projectId = ${projectId};
    </script>
    <script src="/static/mvp-generator.js"></script>
    <script src="/static/project-detail.js"></script>
</body>
</html>
  `);
});

// Marketplace Page
app.get('/marketplace', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketplace de Validadores Beta - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366f1',
              secondary: '#8b5cf6',
            }
          }
        }
      }
    </script>
    <style>
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .tab-active {
        border-bottom-color: #6366f1;
        color: #6366f1;
      }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        ⚡ ValidAI Studio
                    </a>
                </div>
                <div class="flex items-center space-x-6">
                    <a href="/" class="text-gray-700 hover:text-primary transition">Inicio</a>
                    <a href="/marketplace" class="text-primary font-semibold">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <div id="auth-nav">
                        <button onclick="showAuthModal('login')" class="text-gray-700 hover:text-primary transition mr-4">
                            Iniciar Sesión
                        </button>
                        <button onclick="showAuthModal('register')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                            Registrarse
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-primary via-secondary to-purple-600 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <div class="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                    <i class="fas fa-star text-yellow-300 mr-2"></i>
                    <span class="text-sm font-semibold">Validadores Profesionales Certificados</span>
                </div>
                <h1 class="text-4xl md:text-5xl font-bold mb-4">
                    Marketplace de Validadores Beta
                </h1>
                <p class="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
                    Conectamos empresas con validadores profesionales para obtener feedback real antes del lanzamiento
                </p>
                <div class="flex justify-center space-x-4">
                    <button onclick="scrollToSection('products')" class="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                        <i class="fas fa-box-open mr-2"></i>Ver Productos Beta
                    </button>
                    <button onclick="scrollToSection('validators')" class="bg-purple-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-900 transition">
                        <i class="fas fa-users mr-2"></i>Conocer Validadores
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="bg-white border-b">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                    <div class="text-3xl font-bold text-primary">500+</div>
                    <div class="text-gray-600 text-sm">Validadores Activos</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-secondary">1,200+</div>
                    <div class="text-gray-600 text-sm">Productos Validados</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-green-600">4.8/5</div>
                    <div class="text-gray-600 text-sm">Rating Promedio</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-orange-600">48h</div>
                    <div class="text-gray-600 text-sm">Tiempo Respuesta</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-12">
        
        <!-- Tabs -->
        <div class="border-b mb-8">
            <div class="flex space-x-8">
                <button onclick="showTab('products')" class="tab tab-active pb-4 px-2 font-semibold transition" id="products-tab">
                    <i class="fas fa-box-open mr-2"></i>Productos Beta
                </button>
                <button onclick="showTab('validators')" class="tab pb-4 px-2 text-gray-600 hover:text-primary transition" id="validators-tab">
                    <i class="fas fa-users mr-2"></i>Validadores
                </button>
                <button onclick="showTab('my-dashboard')" class="tab pb-4 px-2 text-gray-600 hover:text-primary transition hidden" id="my-dashboard-tab">
                    <i class="fas fa-tachometer-alt mr-2"></i>Mi Dashboard
                </button>
            </div>
        </div>

        <!-- Products Tab -->
        <div id="products-content" class="tab-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Productos Beta Disponibles</h2>
                <button onclick="showCreateProductModal()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition hidden" id="create-product-btn">
                    <i class="fas fa-plus mr-2"></i>Publicar Producto
                </button>
            </div>
            
            <!-- Filters -->
            <div class="bg-white rounded-lg shadow p-4 mb-6">
                <div class="grid md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <select id="category-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            <option value="">Todas</option>
                            <option value="SaaS">SaaS</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Web3">Web3</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Fintech">Fintech</option>
                            <option value="E-commerce">E-commerce</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Etapa</label>
                        <select id="stage-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg">
                            <option value="">Todas</option>
                            <option value="concept">Concepto</option>
                            <option value="alpha">Alpha</option>
                            <option value="beta">Beta</option>
                            <option value="production">Producción</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Compensación</label>
                        <select id="compensation-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg">
                            <option value="">Todas</option>
                            <option value="paid">Pagada</option>
                            <option value="free_access">Acceso Gratis</option>
                            <option value="equity">Equity</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center">
                            <input type="checkbox" id="featured-filter" onchange="loadProducts()" class="rounded text-primary focus:ring-primary mr-2">
                            <span class="text-sm font-medium text-gray-700">Solo Destacados</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Products Grid -->
            <div id="products-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Products will be loaded here -->
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p class="text-gray-600">Cargando productos...</p>
                </div>
            </div>
        </div>

        <!-- Validators Tab -->
        <div id="validators-content" class="tab-content hidden">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Validadores Profesionales</h2>
            </div>
            
            <!-- Filters -->
            <div class="bg-white rounded-lg shadow p-4 mb-6">
                <div class="grid md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
                        <select id="expertise-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg">
                            <option value="">Todas</option>
                            <option value="SaaS">SaaS</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Design">Design</option>
                            <option value="B2B">B2B</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Fintech">Fintech</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Rating Mínimo</label>
                        <select id="rating-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg">
                            <option value="">Todos</option>
                            <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
                            <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
                            <option value="3.5">3.5+ ⭐⭐⭐</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Disponibilidad</label>
                        <select id="availability-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg">
                            <option value="">Todos</option>
                            <option value="available">Disponible</option>
                            <option value="busy">Ocupado</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Validators Grid -->
            <div id="validators-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Validators will be loaded here -->
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p class="text-gray-600">Cargando validadores...</p>
                </div>
            </div>
        </div>

        <!-- My Dashboard Tab (for authenticated users) -->
        <div id="my-dashboard-content" class="tab-content hidden">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Mi Dashboard</h2>
            <div id="dashboard-content">
                <!-- Dashboard content will be loaded here -->
            </div>
        </div>

    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-md w-full p-8 relative">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div id="auth-modal-content">
                <!-- Auth form will be inserted here -->
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/marketplace.js"></script>
</body>
</html>
  `);
});

// Pricing Plans Page
app.get('/pricing', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planes de Precios - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366f1',
              secondary: '#8b5cf6',
            }
          }
        }
      }
    </script>
</head>
<body class="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
    
    <!-- Navigation -->
    <nav class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                        <i class="fas fa-brain mr-2"></i>ValidAI Studio
                    </a>
                </div>
                <div class="flex items-center space-x-6">
                    <a href="/" class="text-gray-700 hover:text-primary transition">Inicio</a>
                    <a href="/marketplace" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="text-primary font-semibold">Planes</a>
                    <button id="auth-btn" onclick="window.location.href='/#pricing'" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                        Comenzar Ahora
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-primary via-secondary to-purple-600 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-5xl font-bold mb-4">Planes y Precios</h1>
            <p class="text-xl text-purple-100 mb-8">Elige el plan perfecto para validar y lanzar tu producto con validadores profesionales</p>
            
            <!-- Billing Toggle -->
            <div class="flex items-center justify-center space-x-4 mb-4">
                <span id="monthly-label" class="text-lg font-semibold">Mensual</span>
                <button id="billing-toggle" onclick="toggleBilling()" class="relative inline-flex h-8 w-14 items-center rounded-full bg-white/30 transition-colors">
                    <span id="billing-slider" class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform translate-x-1"></span>
                </button>
                <span id="yearly-label" class="text-lg">Anual <span class="text-yellow-300 font-semibold">(Ahorra 17%)</span></span>
            </div>
        </div>
    </div>

    <!-- Current Plan Usage (for logged-in users) -->
    <div id="current-plan-section" class="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Tu Plan Actual</h2>
                    <p class="text-gray-600 mt-1">Plan: <span id="current-plan-name" class="font-semibold text-primary"></span></p>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-600">Estado</p>
                    <span id="plan-status" class="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"></span>
                </div>
            </div>
            
            <!-- Usage Bars -->
            <div class="space-y-6">
                <div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Validadores Utilizados</span>
                        <span id="validators-usage" class="text-sm text-gray-600"></span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div id="validators-progress" class="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
                
                <div>
                    <div class="flex justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Productos Activos</span>
                        <span id="products-usage" class="text-sm text-gray-600"></span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div id="products-progress" class="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Pricing Plans -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div id="plans-grid" class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Plans will be loaded here -->
            <div class="text-center py-20 col-span-3">
                <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                <p class="text-gray-600">Cargando planes...</p>
            </div>
        </div>
    </div>

    <!-- FAQ Section -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 class="text-3xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
        <div class="space-y-4">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="font-bold text-lg mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
                <p class="text-gray-600">Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán inmediatamente.</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="font-bold text-lg mb-2">¿Qué pasa si supero mis límites?</h3>
                <p class="text-gray-600">Si alcanzas los límites de tu plan, se te notificará para actualizar a un plan superior. Tus productos existentes seguirán activos.</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="font-bold text-lg mb-2">¿Ofrecen reembolsos?</h3>
                <p class="text-gray-600">Ofrecemos una garantía de satisfacción de 14 días. Si no estás satisfecho, te reembolsaremos tu dinero.</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="font-bold text-lg mb-2">¿Qué incluye el plan Enterprise?</h3>
                <p class="text-gray-600">El plan Enterprise incluye validadores ilimitados, productos ilimitados, soporte dedicado 24/7, y acceso a validadores exclusivos de alta calidad.</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let isYearly = false;
        let allPlans = [];
        let currentUser = null;
        let userPlanData = null;
        
        // Load user if logged in
        async function loadCurrentUser() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            try {
                const response = await axios.get('/api/auth/me', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                currentUser = response.data.user;
                
                // Load user's plan data
                await loadUserPlan();
            } catch (error) {
                console.error('Error loading user:', error);
                localStorage.removeItem('authToken');
            }
        }
        
        // Load user's plan usage
        async function loadUserPlan() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            try {
                const response = await axios.get('/api/plans/my/current', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                userPlanData = response.data;
                displayUserPlan();
            } catch (error) {
                console.error('Error loading user plan:', error);
            }
        }
        
        // Display user plan
        function displayUserPlan() {
            if (!userPlanData) return;
            
            const section = document.getElementById('current-plan-section');
            section.classList.remove('hidden');
            
            document.getElementById('current-plan-name').textContent = userPlanData.user_plan.plan_display_name;
            document.getElementById('plan-status').textContent = userPlanData.user_plan.plan_status;
            
            // Validators usage
            const validatorsUsage = userPlanData.usage.validators;
            const validatorsText = validatorsUsage.is_unlimited 
                ? \`\${validatorsUsage.used} / Ilimitado\`
                : \`\${validatorsUsage.used} / \${validatorsUsage.limit}\`;
            document.getElementById('validators-usage').textContent = validatorsText;
            document.getElementById('validators-progress').style.width = \`\${Math.min(validatorsUsage.percentage, 100)}%\`;
            
            // Products usage
            const productsUsage = userPlanData.usage.products;
            const productsText = productsUsage.is_unlimited
                ? \`\${productsUsage.used} / Ilimitado\`
                : \`\${productsUsage.used} / \${productsUsage.limit}\`;
            document.getElementById('products-usage').textContent = productsText;
            document.getElementById('products-progress').style.width = \`\${Math.min(productsUsage.percentage, 100)}%\`;
        }
        
        // Toggle billing cycle
        function toggleBilling() {
            isYearly = !isYearly;
            const slider = document.getElementById('billing-slider');
            const monthlyLabel = document.getElementById('monthly-label');
            const yearlyLabel = document.getElementById('yearly-label');
            
            if (isYearly) {
                slider.classList.add('translate-x-7');
                monthlyLabel.classList.remove('font-semibold');
                yearlyLabel.classList.add('font-semibold');
            } else {
                slider.classList.remove('translate-x-7');
                monthlyLabel.classList.add('font-semibold');
                yearlyLabel.classList.remove('font-semibold');
            }
            
            renderPlans();
        }
        
        // Load plans from API
        async function loadPlans() {
            try {
                const response = await axios.get('/api/plans');
                allPlans = response.data.plans;
                renderPlans();
            } catch (error) {
                console.error('Error loading plans:', error);
                document.getElementById('plans-grid').innerHTML = \`
                    <div class="text-center py-20 col-span-3">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <p class="text-gray-600">Error al cargar los planes. Por favor, intenta de nuevo.</p>
                    </div>
                \`;
            }
        }
        
        // Render plans
        function renderPlans() {
            const grid = document.getElementById('plans-grid');
            
            const plansHTML = allPlans.map((plan, index) => {
                const price = isYearly ? plan.price_yearly : plan.price_monthly;
                const pricePerMonth = isYearly ? (plan.price_yearly / 12).toFixed(0) : plan.price_monthly;
                const features = JSON.parse(plan.features || '[]');
                
                const isPopular = index === 1; // Pro plan is popular
                const isCurrentPlan = userPlanData && userPlanData.user_plan.plan_id === plan.id;
                
                return \`
                    <div class="bg-white rounded-2xl shadow-xl p-8 \${isPopular ? 'border-4 border-primary transform scale-105 relative' : 'border-2 border-gray-200'} hover:shadow-2xl transition">
                        \${isPopular ? '<div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">Más Popular</div>' : ''}
                        \${isCurrentPlan ? '<div class="absolute -top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Tu Plan</div>' : ''}
                        
                        <div class="text-center mb-6">
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">\${plan.display_name}</h3>
                            <p class="text-gray-600 mb-4">\${plan.description}</p>
                            <div class="text-5xl font-bold \${isPopular ? 'text-primary' : 'text-gray-900'} mb-2">
                                $\${price}
                                <span class="text-lg text-gray-600">\${isYearly ? '/año' : '/mes'}</span>
                            </div>
                            \${isYearly ? \`<p class="text-sm text-green-600 font-semibold">$\${pricePerMonth}/mes (ahorras $\${(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)})</p>\` : ''}
                        </div>
                        
                        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm text-gray-600">Validadores por producto:</span>
                                <span class="font-bold text-gray-900">\${plan.validators_limit === -1 ? 'Ilimitados' : plan.validators_limit}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Productos activos:</span>
                                <span class="font-bold text-gray-900">\${plan.products_limit === -1 ? 'Ilimitados' : plan.products_limit}</span>
                            </div>
                        </div>
                        
                        <ul class="space-y-3 mb-8">
                            \${features.map(feature => \`
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                                    <span class="text-gray-700">\${feature}</span>
                                </li>
                            \`).join('')}
                        </ul>
                        
                        <button onclick="selectPlan(\${plan.id}, '\${plan.name}')" 
                                class="w-full \${isPopular ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-gray-900 text-white'} px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 \${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}"
                                \${isCurrentPlan ? 'disabled' : ''}>
                            \${isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
                        </button>
                    </div>
                \`;
            }).join('');
            
            grid.innerHTML = plansHTML;
        }
        
        // Select plan
        async function selectPlan(planId, planName) {
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                alert('Por favor, inicia sesión para seleccionar un plan');
                window.location.href = '/#pricing';
                return;
            }
            
            if (!currentUser) {
                await loadCurrentUser();
            }
            
            if (!currentUser) {
                alert('Error al cargar usuario. Por favor, inicia sesión nuevamente.');
                return;
            }
            
            // Check if requesting upgrade
            if (userPlanData && userPlanData.user_plan.plan_id < planId) {
                // Request upgrade
                const confirmed = confirm(\`¿Deseas solicitar una actualización al plan \${planName.toUpperCase()}? Un administrador revisará tu solicitud.\`);
                if (!confirmed) return;
                
                try {
                    await axios.post('/api/plans/my/upgrade-request', {
                        requested_plan_id: planId,
                        reason: 'Usuario solicitó actualización desde la página de pricing'
                    }, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    
                    alert('¡Solicitud de actualización enviada! Te notificaremos cuando sea aprobada.');
                } catch (error) {
                    console.error('Error requesting upgrade:', error);
                    alert(error.response?.data?.error || 'Error al solicitar actualización');
                }
            } else {
                // Contact for plan change
                alert(\`Para cambiar tu plan, por favor contacta a soporte o solicita una actualización desde tu dashboard.\`);
            }
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            await loadCurrentUser();
            await loadPlans();
        });
    </script>
</body>
</html>
  `);
});

export default app;
