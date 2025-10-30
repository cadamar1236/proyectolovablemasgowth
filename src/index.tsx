import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { verify } from 'hono/jwt';
import { jsx } from 'hono/jsx';
import type { Bindings } from './types';
import { getNotFoundPage, getVotePage } from './html-templates';

// JWT Secret for token verification
const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// Import API routes
import projects from './api/projects';
import validation from './api/validation';
import betaUsers from './api/beta-users';
import mvpGenerator from './api/mvp-generator';
import deploy from './api/deploy';
import auth from './api/auth';
import marketplace from './api/marketplace';
import plans from './api/plans';
import stripe from './api/stripe';
import dashboard from './api/dashboard';
import validatorRequests from './api/validator-requests';
import chat from './api/chat';
import notifications from './api/notifications';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', auth);
app.route('/api/marketplace', marketplace);
app.route('/api/plans', plans);
app.route('/api/stripe', stripe);
app.route('/api/projects', projects);
app.route('/api/validation', validation);
app.route('/api/beta-users', betaUsers);
app.route('/api/mvp', mvpGenerator);
app.route('/api/deploy', deploy);
app.route('/api/dashboard', dashboard);
app.route('/api/validator-requests', validatorRequests);
app.route('/api/chat', chat);
app.route('/api/notifications', notifications);

// Vote page for QR codes
app.get('/vote/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.query('token');

  // If no token, redirect to validator registration
  if (!authToken) {
    return c.redirect(`/api/auth/google?role=validator&redirect=/vote/${projectId}`);
  }

  // Verify token
  try {
    const payload = await verify(authToken, JWT_SECRET) as any;
    if (!payload || payload.role !== 'validator') {
      // Not a validator, redirect to become one
      return c.redirect(`/api/auth/google?role=validator&redirect=/vote/${projectId}`);
    }

    // Get project details
    const project = await c.env.DB.prepare(`
      SELECT p.*, u.name as creator_name
      FROM projects p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(projectId).first() as any;

    if (!project) {
      const html = getNotFoundPage();
      return c.jsx(html);
    }

    const html = getVotePage(project, projectId, authToken);
    return c.jsx(html);

  } catch (error) {
    // Invalid token, redirect to login
    return c.redirect(`/api/auth/google?role=validator&redirect=/vote/${projectId}`);
  }
});

// Frontend Routes - Redirect to new landing page
app.get('/', serveStatic({ path: './public/new-landing.html' }));

// Legacy route (keep for backwards compatibility)
app.get('/old', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Validation Marketplace | Connect Founders with Expert Validators</title>
    <meta name="description" content="The trusted marketplace connecting product founders with expert validators. Get real feedback, validate your product, and launch with confidence.">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#FF5100',
              secondary: '#FFA500',
            }
          }
        }
      }
    </script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
      .yc-orange { color: #FF5100; }
      .yc-bg-orange { background-color: #FF5100; }
      .hover-lift { transition: transform 0.2s; }
      .hover-lift:hover { transform: translateY(-2px); }
    </style>
</head>
<body class="bg-white">
    <!-- Navigation -->
    <nav class="border-b border-gray-200 bg-white">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-14">
                <div class="flex items-center">
                    <a href="/" class="text-xl font-bold yc-orange">
                        Validate
                    </a>
                </div>
                
                <div class="flex items-center space-x-6">
                    <a href="/marketplace" class="text-sm font-medium text-gray-700 hover:text-gray-900">
                        Browse Products
                    </a>
                    <a href="/marketplace" class="text-sm font-medium text-gray-700 hover:text-gray-900">
                        For Validators
                    </a>
                    <a href="/pricing" class="text-sm font-medium text-gray-700 hover:text-gray-900">
                        Pricing
                    </a>
                    <a href="/marketplace" class="text-sm font-medium yc-bg-orange text-white px-4 py-2 rounded hover:bg-opacity-90">
                        Get Started
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section - YC Style -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div class="text-center">
                <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6">
                    Validamos y lanzamos startups exitosas
                    <span class="block text-yellow-300">10x más rápido</span>
                </h1>
                <p class="text-lg sm:text-xl md:text-2xl mb-8 text-purple-100">
                    Plataforma IA + Venture Studio = Éxito 10x
                </p>
                <p class="text-base sm:text-lg mb-12 max-w-3xl mx-auto text-purple-50">
                    De la idea a datos accionables en 48 horas. Validación + Growth Marketing + Escalamiento.
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4 sm:gap-4">
                    <button onclick="showValidationForm()" class="bg-white text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition transform hover:scale-105">
                        <i class="fas fa-rocket mr-2"></i>Validar Mi Idea Ahora
                    </button>
                    <button onclick="scrollToSection('pricing')" class="bg-purple-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-purple-900 transition">
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
            <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-2 text-center">Validación Express</h2>
                <p class="text-gray-600 mb-4 text-center">Completa el formulario y obtén resultados en 48 horas</p>
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                        <span class="text-green-800 font-medium">¡Validación básica gratuita!</span>
                    </div>
                    <p class="text-green-700 text-sm mt-1">Análisis de mercado con IA, prototipo MVP y estrategias de crecimiento incluidas.</p>
                </div>
                
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

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div id="auth-modal-content" class="p-6 sm:p-8">
                <!-- Auth form will be inserted here -->
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
    <script>
      // Mobile menu toggle
      function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const icon = button.querySelector('i');
        
        if (menu.classList.contains('hidden')) {
          menu.classList.remove('hidden');
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          menu.classList.add('hidden');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }

      // Close mobile menu when clicking outside
      document.addEventListener('click', function(event) {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        
        if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
          menu.classList.add('hidden');
          const icon = button.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        }
      });

      // Show validation form
      function showValidationForm() {
        const section = document.getElementById('validation-form-section');
        if (section) {
          section.classList.remove('hidden');
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      // Scroll to section
      function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      // Show role selection for Google login
      // Login with Google as founder
      function loginAsFounder() {
        loginWithGoogle('founder');
      }

      // Login with Google as validator
      function loginAsValidator() {
        loginWithGoogle('validator');
      }

      function showRoleSelection(action) {
        const modal = document.getElementById('auth-modal');
        const modalContent = document.getElementById('auth-modal-content');

        if (!modal || !modalContent) return;

        modal.classList.remove('hidden');

        const title = action === 'login' ? 'Iniciar Sesión con Google' : 'Registro con Google';
        const description = action === 'login' ? 'Elige tu rol para continuar' : 'Elige tu rol para registrarte';
        const backAction = action === 'login' ? 'login' : 'register';

        modalContent.innerHTML = \`<div class="text-center">
          <i class="fab fa-google text-4xl text-red-600 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">\${title}</h2>
          <p class="text-gray-600 mb-6">\${description}</p>
          <div class="space-y-3">
          <button onclick="loginAsFounder()" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
          <i class="fas fa-lightbulb text-xl"></i>
          <span>Fundador - Crear y validar proyectos</span>
          </button>
          <button onclick="loginAsValidator()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
          <i class="fas fa-star text-xl"></i>
          <span>Validador - Votar y calificar proyectos</span>
          </button>
          </div>
          <button onclick="showAuthModal('\` + backAction + \`')" class="mt-4 text-gray-600 hover:text-gray-800 text-sm underline">
          Volver
          </button>
          </div>\`;
      }

      // Show auth modal
      function showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        const modalContent = document.getElementById('auth-modal-content');

        if (!modal || !modalContent) return;

        modal.classList.remove('hidden');

        if (mode === 'login') {
          const loginHtml = \`<div class="text-center">
            <i class="fas fa-sign-in-alt text-4xl text-primary mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Iniciar Sesión</h2>
            <button onclick="showRoleSelection('login')" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3 mb-4">
              <i class="fab fa-google text-xl"></i>
              <span>Continuar con Google</span>
            </button>
            <div class="relative mb-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">O inicia sesión con email</span>
              </div>
            </div>
            <form onsubmit="handleTraditionalLogin(event)" class="space-y-4">
              <div class="text-left">
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="login-email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="tu@email.com" />
              </div>
              <div class="text-left">
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" id="login-password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Tu contraseña" />
              </div>
              <button type="submit" class="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-primary/90">Iniciar Sesión</button>
            </form>
            <p class="text-sm text-gray-600 mt-4">
              ¿No tienes cuenta? <a href="#" onclick="showRoleSelection('register')" class="text-primary hover:underline">Regístrate</a>
            </p>
          </div>\`;
          modalContent.innerHTML = loginHtml;
        } else if (mode === 'register') {
          const registerHtml = \`<div class="text-center">
            <i class="fas fa-user-plus text-4xl text-primary mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Crear Cuenta</h2>
            <p class="text-gray-600 mb-6">Elige tu rol para continuar con el registro</p>
            <div class="space-y-3">
              <button onclick="loginAsFounder()" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
                <i class="fas fa-lightbulb text-xl"></i>
                <span>Fundador - Crear y validar proyectos</span>
              </button>
              <button onclick="loginAsValidator()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
                <i class="fas fa-star text-xl"></i>
                <span>Validador - Votar y calificar proyectos</span>
              </button>
            </div>
            <p class="text-sm text-gray-600 mt-4">
              ¿Ya tienes cuenta? <a href="#" onclick="showAuthModal('login')" class="text-primary hover:underline">Inicia sesión</a>
            </p>
          </div>\`;
          modalContent.innerHTML = registerHtml;
        }
      }

      // Close auth modal
      function closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      }

      // Login with Google
      function loginWithGoogle(role) {
        window.location.href = '/api/auth/google?role=' + role;
      }

      // Handle traditional login
      async function handleTraditionalLogin(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (response.ok) {
            localStorage.setItem('authToken', data.token);
            closeAuthModal();
            updateAuthUI();
            alert('¡Inicio de sesión exitoso!');
          } else {
            alert('Error: ' + (data.error || 'No se pudo iniciar sesión'));
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('Error al iniciar sesión. Inténtalo de nuevo.');
        }
      }

      // Handle traditional registration
      async function handleTraditionalRegistration(event) {
        event.preventDefault();

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, role }),
          });

          const data = await response.json();

          if (response.ok) {
            localStorage.setItem('authToken', data.token);
            closeAuthModal();
            updateAuthUI();
            alert('¡Cuenta creada exitosamente!');
          } else {
            alert('Error: ' + (data.error || 'No se pudo crear la cuenta'));
          }
        } catch (error) {
          console.error('Registration error:', error);
          alert('Error al crear la cuenta. Inténtalo de nuevo.');
        }
      }

      // Update authentication UI
      function updateAuthUI() {
        const authToken = localStorage.getItem('authToken');
        const navButtons = document.querySelectorAll('.nav-auth-buttons');

        if (authToken) {
          // User is logged in - show logout option
          const logoutHtml = \`<button onclick="logout()" class="text-gray-700 hover:text-primary transition">
            <i class="fas fa-sign-out-alt mr-1"></i>Cerrar Sesión
            </button>\`;
          navButtons.forEach(btn => {
            btn.innerHTML = logoutHtml;
          });
        } else {
          // User is not logged in - show login/register options
          const loginHtml = \`<button onclick="showAuthModal('login')" class="text-gray-700 hover:text-primary transition">
            <i class="fas fa-sign-in-alt mr-1"></i>Iniciar Sesión
            </button>
            <button onclick="showAuthModal('register')" class="ml-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
            <i class="fas fa-user-plus mr-1"></i>Registrarse
            </button>\`;
          navButtons.forEach(btn => {
            btn.innerHTML = loginHtml;
          });
        }
      }

      // Logout function
      function logout() {
        localStorage.removeItem('authToken');
        updateAuthUI();
        alert('Sesión cerrada exitosamente');
      }

      // Switch plan type
      function switchPlanType(type) {
        const platformBtn = document.getElementById('platform-plans-btn');
        const marketplaceBtn = document.getElementById('marketplace-plans-btn');
        const platformDesc = document.getElementById('platform-description');
        const marketplaceDesc = document.getElementById('marketplace-description');
        
        if (type === 'platform') {
          platformBtn.classList.add('bg-white', 'text-primary');
          platformBtn.classList.remove('text-white', 'hover:bg-white/10');
          marketplaceBtn.classList.remove('bg-white', 'text-primary');
          marketplaceBtn.classList.add('text-white', 'hover:bg-white/10');
          platformDesc.classList.remove('hidden');
          marketplaceDesc.classList.add('hidden');
        } else {
          marketplaceBtn.classList.add('bg-white', 'text-primary');
          marketplaceBtn.classList.remove('text-white', 'hover:bg-white/10');
          platformBtn.classList.remove('bg-white', 'text-primary');
          platformBtn.classList.add('text-white', 'hover:bg-white/10');
          marketplaceDesc.classList.remove('hidden');
          platformDesc.classList.add('hidden');
        }
      }

      // Switch billing cycle
      function switchBillingCycle(cycle) {
        const monthlyBtn = document.getElementById('monthly-billing-btn');
        const yearlyBtn = document.getElementById('yearly-billing-btn');
        
        if (cycle === 'monthly') {
          monthlyBtn.classList.add('bg-primary', 'text-white');
          monthlyBtn.classList.remove('text-gray-700', 'hover:bg-gray-100');
          yearlyBtn.classList.remove('bg-primary', 'text-white');
          yearlyBtn.classList.add('text-gray-700', 'hover:bg-gray-100');
        } else {
          yearlyBtn.classList.add('bg-primary', 'text-white');
          yearlyBtn.classList.remove('text-gray-700', 'hover:bg-gray-100');
          monthlyBtn.classList.remove('bg-primary', 'text-white');
          monthlyBtn.classList.add('text-gray-700', 'hover:bg-gray-100');
        }
      }

      // Check for product parameter and redirect to marketplace, and handle OAuth callback
      document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle OAuth callback token
        const token = urlParams.get('token');
        const role = urlParams.get('role');
        const newUser = urlParams.get('new_user');
        
        if (token) {
          // Store the token
          localStorage.setItem('authToken', token);
          
          // Clean URL by removing the token parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          // Show success message for new users
          if (newUser === 'true') {
            setTimeout(() => {
              alert('¡Bienvenido! Tu cuenta ha sido creada exitosamente.');
            }, 500);
          }
          
          // Update UI to show logged in state
          updateAuthUI();
          
          return; // Don't process other parameters if we just logged in
        }
        
        // Handle product parameter redirect
        const productId = urlParams.get('product');
        if (productId && /^\d+$/.test(productId)) {
          window.location.href = '/marketplace?product=' + productId;
        }
        
        // Handle show_auth parameter to automatically show auth modal
        const showAuth = urlParams.get('show_auth');
        if (showAuth === 'login') {
          showAuthModal('login');
        } else if (showAuth === 'register') {
          showAuthModal('register');
        }
      });

      // Initialize auth UI
      updateAuthUI();
    </script>
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
    <style>
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    </style>
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
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-4">
                    <a href="/" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-arrow-left mr-2"></i>Volver al Dashboard
                    </a>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" onclick="toggleMobileMenu()" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="hidden md:hidden">
                <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
                    <a href="/" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-home mr-3 text-lg"></i>
                        <span class="font-medium">Inicio</span>
                    </a>
                    <a href="/marketplace" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-star mr-3 text-yellow-500 text-lg"></i>
                        <span>Marketplace</span>
                    </a>
                    <a href="/leaderboard" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-trophy mr-3 text-yellow-500 text-lg"></i>
                        <span>Leaderboard</span>
                    </a>
                    <a href="/pricing" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-tag mr-3 text-green-500 text-lg"></i>
                        <span>Planes</span>
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
      const projectId = '${projectId}';
      
      function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const icon = button.querySelector('i');
        
        if (menu.classList.contains('hidden')) {
          menu.classList.remove('hidden');
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          menu.classList.add('hidden');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
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
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
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
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
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
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-6">
                    <a href="/" class="text-gray-700 hover:text-primary transition">Inicio</a>
                    <a href="/marketplace" class="text-primary font-semibold">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <div id="auth-nav">
                        <button onclick="window.location.href='/?show_auth=login'" class="text-gray-700 hover:text-primary transition mr-4">
                            Iniciar Sesión
                        </button>
                        <button onclick="window.location.href='/?show_auth=register'" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                            Registrarse
                        </button>
                    </div>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center">
                    <button onclick="toggleMobileMenu()" class="text-gray-700 hover:text-primary transition" id="mobile-menu-button">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile Navigation Menu -->
            <div class="md:hidden hidden fixed inset-0 z-50" id="mobile-menu">
                <div class="absolute inset-0 bg-black bg-opacity-50" onclick="toggleMobileMenu()"></div>
                <div class="relative bg-white w-80 max-w-[85vw] h-full ml-auto shadow-xl transform transition-transform duration-300 ease-in-out">
                    <div class="flex items-center justify-between p-4 border-b">
                        <span class="text-lg font-semibold text-gray-900">Menú</span>
                        <button onclick="toggleMobileMenu()" class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="py-4">
                        <a href="/" class="flex items-center px-6 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition">
                            <i class="fas fa-home mr-3 text-lg"></i>
                            <span class="font-medium">Inicio</span>
                        </a>
                        <a href="/marketplace" class="flex items-center px-6 py-3 text-primary bg-primary/5 font-semibold">
                            <i class="fas fa-star mr-3 text-yellow-500 text-lg"></i>
                            <span>Marketplace</span>
                        </a>
                        <div class="border-t my-4"></div>
                        <div id="mobile-auth-nav">
                            <button onclick="window.location.href='/?show_auth=login'" class="flex items-center w-full px-6 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition">
                                <i class="fas fa-sign-in-alt mr-3 text-lg"></i>
                                <span class="font-medium">Iniciar Sesión</span>
                            </button>
                            <button onclick="window.location.href='/?show_auth=register'" class="flex items-center w-full px-6 py-3 mx-6 mt-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold">
                                <i class="fas fa-user-plus mr-3 text-lg"></i>
                                <span>Registrarse</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-primary via-secondary to-purple-600 text-white py-12 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
                <i class="fas fa-star text-yellow-300 mr-2 text-sm sm:text-base"></i>
                <span class="text-xs sm:text-sm font-semibold">Validadores Profesionales Certificados</span>
            </div>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
                Marketplace de Validadores Beta
            </h1>
            <p class="text-lg sm:text-xl text-purple-100 max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
                Conectamos empresas con validadores profesionales para obtener feedback real antes del lanzamiento
            </p>
            <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                <button onclick="scrollToSection('products')" class="bg-white text-primary px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition transform hover:scale-105 min-h-[48px] flex items-center justify-center">
                    <i class="fas fa-box-open mr-2"></i>Ver Productos Beta
                </button>
                <button onclick="scrollToSection('validators')" class="bg-purple-800 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-purple-900 transition min-h-[48px] flex items-center justify-center">
                    <i class="fas fa-users mr-2"></i>Conocer Validadores
                </button>
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
                    <div class="text-3xl font-bold text-primary">1,200+</div>
                    <div class="text-gray-600 text-sm">Productos Validados</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-primary">4.8/5</div>
                    <div class="text-gray-600 text-sm">Rating Promedio</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-primary">48h</div>
                    <div class="text-gray-600 text-sm">Tiempo Respuesta</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        
        <!-- Tabs -->
        <div class="border-b mb-4 sm:mb-6">
            <div class="flex overflow-x-auto scrollbar-hide space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button onclick="showTab('products')" class="tab tab-active pb-2 sm:pb-3 px-2 font-semibold transition whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center" id="products-tab">
                    <i class="fas fa-box-open mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Productos</span>
                </button>
                <button onclick="showTab('validators')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center" id="validators-tab">
                    <i class="fas fa-users mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Validadores</span>
                </button>
                <button onclick="showTab('my-dashboard')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition hidden whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center" id="my-dashboard-tab">
                    <i class="fas fa-tachometer-alt mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Dashboard</span>
                </button>
                <button onclick="showTab('internal-dashboard')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition hidden whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center" id="internal-dashboard-tab">
                    <i class="fas fa-cogs mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Dashboard Interno</span>
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
            <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 class="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
                    <button onclick="resetProductFilters()" class="text-sm text-primary hover:text-primary/80 font-medium sm:hidden min-h-[44px] flex items-center">
                        <i class="fas fa-undo mr-1"></i>Limpiar
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Categoría</label>
                        <select id="category-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm min-h-[44px] px-3">
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
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Etapa</label>
                        <select id="stage-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm min-h-[44px] px-3">
                            <option value="">Todas</option>
                            <option value="concept">Concepto</option>
                            <option value="alpha">Alpha</option>
                            <option value="beta">Beta</option>
                            <option value="production">Producción</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Compensación</label>
                        <select id="compensation-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm min-h-[44px] px-3">
                            <option value="">Todas</option>
                            <option value="paid">Pagada</option>
                            <option value="free_access">Acceso Gratis</option>
                            <option value="equity">Equity</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center cursor-pointer min-h-[44px]">
                            <input type="checkbox" id="featured-filter" onchange="loadProducts()" class="rounded text-primary focus:ring-primary mr-2 w-5 h-5 sm:w-4 sm:h-4">
                            <span class="text-xs sm:text-sm font-medium text-gray-700">Solo Destacados</span>
                        </label>
                    </div>
                </div>
                <div class="hidden sm:flex justify-end mt-3 sm:mt-4">
                    <button onclick="resetProductFilters()" class="text-sm text-primary hover:text-primary/80 font-medium min-h-[44px] flex items-center px-3 py-2">
                        <i class="fas fa-undo mr-1"></i>Limpiar filtros
                    </button>
                </div>
            </div>

            <!-- Products Grid -->
            <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <!-- Products will be loaded here -->
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p class="text-gray-600">Cargando productos...</p>
                </div>
            </div>
        </div>

        <!-- Product Detail Tab -->
        <div id="product-detail-content" class="tab-content hidden">
            <div id="product-detail-container">
                <!-- Product detail will be loaded here -->
                <div class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p class="text-gray-600">Cargando producto...</p>
                </div>
            </div>
        </div>

        <!-- Validators Tab -->
        <div id="validators-content" class="tab-content hidden">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Validadores Profesionales</h2>
            </div>
            
            <!-- Filters -->
            <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Filtros</h3>
                    <button onclick="resetValidatorFilters()" class="text-sm text-primary hover:text-primary/80 font-medium sm:hidden">
                        <i class="fas fa-undo mr-1"></i>Limpiar
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Especialidad</label>
                        <select id="expertise-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm h-10 sm:h-auto">
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
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Rating Mínimo</label>
                        <select id="rating-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm h-10 sm:h-auto">
                            <option value="">Todos</option>
                            <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
                            <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
                            <option value="3.5">3.5+ ⭐⭐⭐</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Disponibilidad</label>
                        <select id="availability-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm h-10 sm:h-auto">
                            <option value="">Todos</option>
                            <option value="available">Disponible</option>
                            <option value="busy">Ocupado</option>
                        </select>
                    </div>
                </div>
                <div class="hidden sm:flex justify-end mt-4">
                    <button onclick="resetValidatorFilters()" class="text-sm text-primary hover:text-primary/80 font-medium">
                        <i class="fas fa-undo mr-1"></i>Limpiar filtros
                    </button>
                </div>
            </div>

            <!-- Validators Grid -->
            <div id="validators-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

        <!-- Internal Dashboard Tab (for admin users) -->
        <div id="internal-dashboard-content" class="tab-content hidden">
            <div id="internal-dashboard-container">
                <!-- Internal dashboard content will be loaded here -->
            </div>
        </div>

    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div id="auth-modal-content" class="p-6 sm:p-8">
                <!-- Auth form will be inserted here -->
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="/static/marketplace.js"></script>
    <script>
      function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const icon = button.querySelector('i');
        
        if (menu.classList.contains('hidden')) {
          menu.classList.remove('hidden');
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          menu.classList.add('hidden');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
      
      function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      
      function closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      }
    </script>
</body>
</html>
  `);
});

// Leaderboard Page (continuará en el siguiente mensaje debido a límites de longitud)
app.get('/leaderboard', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏆 Leaderboard de Proyectos - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
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
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        ⚡ ValidAI Studio
                    </a>
                </div>
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-primary transition">Inicio</a>
                    <a href="/leaderboard" class="text-primary font-semibold">
                        <i class="fas fa-trophy mr-1 text-yellow-500"></i>Leaderboard
                    </a>
                    <a href="/marketplace" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-tag mr-1 text-green-500"></i>Planes
                    </a>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" onclick="toggleMobileMenu()" class="text-gray-700 hover:text-primary transition">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <a href="/" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-home mr-2"></i>Inicio
                    </a>
                    <a href="/leaderboard" class="flex items-center px-3 py-2 text-primary font-semibold">
                        <i class="fas fa-trophy mr-2 text-yellow-500"></i>Leaderboard
                    </a>
                    <a href="/marketplace" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-star mr-2 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition">
                        <i class="fas fa-tag mr-2 text-green-500"></i>Planes
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-12 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-4xl sm:text-5xl font-bold mb-4">
                🏆 Leaderboard de Proyectos
            </h1>
            <p class="text-lg sm:text-xl opacity-90 mb-8">
                Descubre los proyectos mejor valorados por la comunidad
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Category Filter -->
        <div class="mb-8">
            <div class="flex flex-wrap justify-center gap-2 sm:gap-4">
                <button onclick="filterByCategory('all')" class="category-btn active px-3 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition text-sm sm:text-base">
                    Todos los Proyectos
                </button>
                <button onclick="filterByCategory('healthcare')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    🏥 Salud
                </button>
                <button onclick="filterByCategory('education')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    📚 Educación
                </button>
                <button onclick="filterByCategory('smart-city')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    🏙️ Smart City
                </button>
                <button onclick="filterByCategory('finance')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    💰 Finanzas
                </button>
                <button onclick="filterByCategory('energy')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    ⚡ Energía
                </button>
                <button onclick="filterByCategory('agriculture')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    🌾 Agricultura
                </button>
                <button onclick="filterByCategory('retail')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base">
                    🛍️ Retail
                </button>
            </div>
        </div>

        <!-- Leaderboard Table -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-4 sm:px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white">
                <h2 class="text-xl sm:text-2xl font-bold">🏅 Ranking de Proyectos</h2>
            </div>
            
            <div id="leaderboard-loading" class="p-12 text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                <p class="text-gray-600">Cargando leaderboard...</p>
            </div>
            
            <div id="leaderboard-content" class="hidden">
                <div class="overflow-x-auto scrollbar-hide">
                    <table class="w-full min-w-[800px]">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Posición</th>
                                <th class="px-2 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Proyecto</th>
                                <th class="px-2 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Categoría</th>
                                <th class="px-2 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">
                                    <i class="fas fa-star text-yellow-500 mr-1"></i>Rating
                                </th>
                                <th class="px-2 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">
                                    <i class="fas fa-users text-blue-500 mr-1"></i>Votos
                                </th>
                                <th class="px-2 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">
                                    Acción
                                </th>
                                <th class="px-2 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">QR</th>
                                <th class="px-2 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Creador</th>
                                <th class="px-2 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-table-body" class="divide-y divide-gray-200">
                            <!-- Projects will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="leaderboard-empty" class="hidden p-12 text-center">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No hay proyectos en esta categoría</h3>
                <p class="text-gray-500">Sé el primero en publicar un proyecto en esta categoría.</p>
            </div>
        </div>
    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div id="auth-modal-content" class="p-6 sm:p-8">
                <!-- Auth form will be inserted here -->
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let currentCategory = 'all';
        let leaderboardData = [];
        let authToken = localStorage.getItem('authToken');

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadLeaderboard();
        });

        // Load leaderboard data
        async function loadLeaderboard() {
            try {
                showLoading();
                const response = await fetch('/api/projects/leaderboard/top?limit=50');
                const data = await response.json();
                
                if (data.leaderboard) {
                    leaderboardData = data.leaderboard;
                    renderLeaderboard();
                } else {
                    showEmpty();
                }
            } catch (error) {
                console.error('Error loading leaderboard:', error);
                showEmpty();
            }
        }

        // Filter by category
        function filterByCategory(category) {
            currentCategory = category;
            
            // Update button styles
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-primary', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            event.target.classList.add('active', 'bg-primary', 'text-white');
            event.target.classList.remove('bg-gray-200', 'text-gray-700');
            
            renderLeaderboard();
        }

        // Render leaderboard
        function renderLeaderboard() {
            const tbody = document.getElementById('leaderboard-table-body');
            const filteredData = currentCategory === 'all' 
                ? leaderboardData 
                : leaderboardData.filter(project => project.category === currentCategory);
            
            if (filteredData.length === 0) {
                showEmpty();
                return;
            }
            
            tbody.innerHTML = filteredData.map((project, index) => {
                const escapedTitle = project.title.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const escapedDescription = project.description.substring(0, 100).replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return '<tr class="hover:bg-gray-50 transition">' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<div class="flex items-center">' +
                            getPositionBadge(index + 1) +
                            '<span class="ml-2 sm:ml-3 font-semibold text-gray-900 text-sm sm:text-base">#' + (index + 1) + '</span>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<div>' +
                            '<h3 class="font-semibold text-gray-900 text-sm sm:text-base">' + escapedTitle + '</h3>' +
                            '<p class="text-xs sm:text-sm text-gray-600 mt-1">' + escapedDescription + '...</p>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<span class="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ' + getCategoryColor(project.category) + '">' +
                            getCategoryIcon(project.category) + ' ' + formatCategory(project.category) +
                        '</span>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<div class="flex items-center justify-center">' +
                            '<div class="flex items-center text-sm sm:text-base">' +
                                generateStars(project.rating_average) +
                            '</div>' +
                            '<span class="ml-1 sm:ml-2 font-semibold text-sm sm:text-base">' + project.rating_average.toFixed(1) + '</span>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<span class="font-semibold text-blue-600 text-sm sm:text-base">' + project.votes_count + '</span>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<div class="flex items-center justify-center space-x-1">' +
                            generateVoteButtons(project.id) +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<button onclick="showQRCodeFromButton(this)" data-project-id="' + project.id + '" data-project-title="' + project.title.replace(/"/g, '&quot;') + '" ' +
                                'class="text-green-600 hover:text-green-800 font-medium text-sm sm:text-base" ' +
                                'title="Mostrar código QR para validadores">' +
                            '<i class="fas fa-qrcode"></i>' +
                        '</button>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-gray-900 text-sm sm:text-base">' +
                        project.creator_name +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<button onclick="viewProject(' + project.id + ')" class="text-primary hover:text-primary/80 font-medium text-sm sm:text-base">' +
                            '<i class="fas fa-eye mr-1"></i>Ver' +
                        '</button>' +
                    '</td>' +
                '</tr>';
            }).join('');
            
            showContent();
        }

        // Helper functions
        function getPositionBadge(position) {
            if (position === 1) return '<div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"><i class="fas fa-trophy text-white text-xs"></i></div>';
            if (position === 2) return '<div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center"><i class="fas fa-medal text-white text-xs"></i></div>';
            if (position === 3) return '<div class="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center"><i class="fas fa-award text-white text-xs"></i></div>';
            return '<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><span class="text-xs font-bold text-gray-600">' + position + '</span></div>';
        }

        function getCategoryColor(category) {
            const colors = {
                'healthcare': 'bg-green-100 text-green-800',
                'education': 'bg-blue-100 text-blue-800',
                'smart-city': 'bg-purple-100 text-purple-800',
                'finance': 'bg-green-100 text-green-800',
                'energy': 'bg-yellow-100 text-yellow-800',
                'agriculture': 'bg-green-100 text-green-800',
                'retail': 'bg-pink-100 text-pink-800'
            };
            return colors[category] || 'bg-gray-100 text-gray-800';
        }

        function getCategoryIcon(category) {
            const icons = {
                'healthcare': '🏥',
                'education': '📚',
                'smart-city': '🏙️',
                'finance': '💰',
                'energy': '⚡',
                'agriculture': '🌾',
                'retail': '🛍️'
            };
            return icons[category] || '📁';
        }

        function formatCategory(category) {
            return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }

        function generateStars(rating) {
            let stars = '';
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            for (let i = 0; i < fullStars; i++) {
                stars += '<i class="fas fa-star text-yellow-400"></i>';
            }
            
            if (hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
            }
            
            const emptyStars = 5 - Math.ceil(rating);
            for (let i = 0; i < emptyStars; i++) {
                stars += '<i class="far fa-star text-gray-300"></i>';
            }
            
            return stars;
        }

        function viewProject(projectId) {
            window.location.href = '/marketplace?project=' + projectId;
        }

        function generateVoteButtons(projectId) {
            return '<div class="flex items-center space-x-1">' +
                [1, 2, 3, 4, 5].map(star =>
                    '<button onclick="voteForProject(' + projectId + ', ' + star + ')" ' +
                    'class="text-gray-300 hover:text-yellow-400 transition-colors text-lg" ' +
                    'title="Votar ' + star + ' estrella' + (star > 1 ? 's' : '') + '">' +
                    '<i class="fas fa-star"></i>' +
                    '</button>'
                ).join('') +
                '</div>';
        }

        async function voteForProject(projectId, rating) {
            if (!authToken) {
                localStorage.setItem('pendingVote', JSON.stringify({ projectId, rating }));
                showAuthModal('validator');
                return;
            }

            try {
                const response = await fetch('/api/projects/' + projectId + '/vote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ rating })
                });

                if (response.ok) {
                    alert('¡Gracias por tu voto!');
                    loadLeaderboard();
                } else {
                    const error = await response.json();
                    alert('Error: ' + (error.error || 'No se pudo registrar el voto'));
                }
            } catch (error) {
                console.error('Error voting:', error);
                alert('Error al votar. Inténtalo de nuevo.');
            }
        }

        function showLoading() {
            document.getElementById('leaderboard-loading').classList.remove('hidden');
            document.getElementById('leaderboard-content').classList.add('hidden');
            document.getElementById('leaderboard-empty').classList.add('hidden');
        }

        function showContent() {
            document.getElementById('leaderboard-loading').classList.add('hidden');
            document.getElementById('leaderboard-content').classList.remove('hidden');
            document.getElementById('leaderboard-empty').classList.add('hidden');
        }

        function showEmpty() {
            document.getElementById('leaderboard-loading').classList.add('hidden');
            document.getElementById('leaderboard-content').classList.add('hidden');
            document.getElementById('leaderboard-empty').classList.remove('hidden');
        }

        function showAuthModal(mode) {
            const modal = document.getElementById('auth-modal');
            const modalContent = document.getElementById('auth-modal-content');
            
            if (!modal || !modalContent) return;
            
            modal.classList.remove('hidden');
            
            if (mode === 'validator') {
                modalContent.innerHTML = '<div class="text-center">' +
                    '<i class="fas fa-user-check text-4xl text-primary mb-4"></i>' +
                    '<h2 class="text-2xl font-bold text-gray-900 mb-4">Registro como Validador</h2>' +
                    '<p class="text-gray-600 mb-6">Elige tu rol para registrarte y votar proyectos</p>' +
                    '<div class="space-y-3">' +
                        '<button onclick="loginAsFounder()" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">' +
                            '<i class="fas fa-lightbulb text-xl"></i>' +
                            '<span>Fundador - Crear y validar proyectos</span>' +
                        '</button>' +
                        '<button onclick="loginAsValidator()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">' +
                            '<i class="fas fa-star text-xl"></i>' +
                            '<span>Validador - Votar y calificar proyectos</span>' +
                        '</button>' +
                    '</div>' +
                '</div>';
            }
        }

        function closeAuthModal() {
            const modal = document.getElementById('auth-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }

        function loginWithGoogle(role) {
            window.location.href = '/api/auth/google?role=' + role;
        }

        function showQRCodeFromButton(button) {
            const projectId = button.getAttribute('data-project-id');
            const projectTitle = button.getAttribute('data-project-title');
            showQRCode(projectId, projectTitle);
        }

        function showQRCode(projectId, projectTitle) {
            const qrUrl = window.location.origin + '/vote/' + projectId;
            
            const modalContent = document.getElementById('auth-modal-content');
            const escapedTitle = projectTitle.replace(/'/g, "\\'").replace(/"/g, '\\"');
            const qrHtml = '<div class="text-center">' +
                '<i class="fas fa-qrcode text-4xl text-green-600 mb-4"></i>' +
                '<h2 class="text-2xl font-bold text-gray-900 mb-2">Código QR para Validadores</h2>' +
                '<p class="text-gray-600 mb-4">' + escapedTitle + '</p>' +
                '<div class="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">' +
                    '<div id="qrcode" class="mx-auto"></div>' +
                '</div>' +
                '<div class="flex space-x-3 justify-center">' +
                    '<button onclick="copyCurrentQRUrl()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">' +
                        '<i class="fas fa-copy mr-2"></i>Copiar URL' +
                    '</button>' +
                    '<button onclick="closeAuthModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">' +
                        'Cerrar' +
                    '</button>' +
                '</div>' +
            '</div>';

            modalContent.innerHTML = qrHtml;

            // Store the URL in a global variable for the copy function
            window.currentQRUrl = qrUrl;

            setTimeout(() => {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById('qrcode'), {
                        text: qrUrl,
                        width: 200,
                        height: 200,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }
            }, 100);

            document.getElementById('auth-modal').classList.remove('hidden');
        }

        function copyCurrentQRUrl() {
            const url = window.currentQRUrl;
            if (!url) return;
            
            navigator.clipboard.writeText(url).then(() => {
                alert('URL copiada al portapapeles');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('URL copiada al portapapeles');
            });
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const button = document.getElementById('mobile-menu-button');
            const icon = button.querySelector('i');
            
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                menu.classList.add('hidden');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    </script>
</body>
</html>
  `);
});

export default app;
