import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import API routes
import projects from './api/projects';
import validation from './api/validation';
import betaUsers from './api/beta-users';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/projects', projects);
app.route('/api/validation', validation);
app.route('/api/beta-users', betaUsers);

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
                    <a href="#beta-panel" class="text-gray-700 hover:text-primary transition">Panel Beta</a>
                    <a href="#pricing" class="text-gray-700 hover:text-primary transition">Pricing</a>
                    <button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                        Iniciar Sesión
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
            <p class="text-xl text-gray-600 mb-12 text-center">Elige el plan perfecto para tu etapa de crecimiento</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <!-- Starter Plan -->
                <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary transition">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                        <div class="text-4xl font-bold text-primary mb-2">$49<span class="text-lg text-gray-600">/mes</span></div>
                        <p class="text-gray-600">Para validar tu primera idea</p>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">1 proyecto de validación</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">500 créditos IA/mes</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">Análisis de mercado básico</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">Soporte por email (48h)</span>
                        </li>
                    </ul>
                    <button class="w-full bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
                        Comenzar Ahora
                    </button>
                </div>
                
                <!-- Pro Plan (Most Popular) -->
                <div class="bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl p-8 text-white relative transform scale-105">
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span class="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                            Más Popular
                        </span>
                    </div>
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold mb-2">Pro</h3>
                        <div class="text-4xl font-bold mb-2">$149<span class="text-lg opacity-90">/mes</span></div>
                        <p class="opacity-90">Para founders serios</p>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start">
                            <i class="fas fa-check mt-1 mr-3"></i>
                            <span>3 proyectos simultáneos</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check mt-1 mr-3"></i>
                            <span>2,000 créditos IA/mes</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check mt-1 mr-3"></i>
                            <span>Growth Framework básico</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check mt-1 mr-3"></i>
                            <span>Generador de MVP</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check mt-1 mr-3"></i>
                            <span>Panel beta users (50)</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check mt-1 mr-3"></i>
                            <span>Soporte prioritario (24h)</span>
                        </li>
                    </ul>
                    <button class="w-full bg-white text-primary px-6 py-3 rounded-lg hover:bg-gray-100 transition font-semibold">
                        Empezar Prueba 14 Días
                    </button>
                </div>
                
                <!-- Enterprise Plan -->
                <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-secondary transition">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                        <div class="text-4xl font-bold text-secondary mb-2">$499<span class="text-lg text-gray-600">/mes</span></div>
                        <p class="text-gray-600">Para equipos y empresas</p>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">Proyectos ilimitados</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">10,000 créditos IA/mes</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">Growth Framework avanzado</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">MVP personalizado</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">Panel beta users completo</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                            <span class="text-gray-700">Cuenta manager dedicado</span>
                        </li>
                    </ul>
                    <button class="w-full bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition">
                        Contactar Ventas
                    </button>
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
    <script src="/static/project-detail.js"></script>
</body>
</html>
  `);
});

export default app;
