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
import quickPitch from './api/quick-pitch';
import whatsapp from './api/whatsapp';

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
app.route('/api/quick-pitch', quickPitch);
app.route('/api/whatsapp', whatsapp);

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
              primary: '#FF6154',
              secondary: '#FB651E',
              accent: '#F26522',
            },
            fontFamily: {
              sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
            }
          }
        }
      }
    </script>
    <style>
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      .hero-gradient {
        background: linear-gradient(135deg, #FF6154 0%, #FB651E 50%, #F26522 100%);
      }
      
      .mesh-gradient {
        background-image: 
          radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%),
          radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.05) 0px, transparent 50%),
          radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.05) 0px, transparent 50%),
          radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.1) 0px, transparent 50%),
          radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.05) 0px, transparent 50%),
          radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.05) 0px, transparent 50%),
          radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.05) 0px, transparent 50%);
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .card-hover:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #FF6154 0%, #FB651E 100%);
        transition: all 0.3s ease;
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -8px rgba(255, 97, 84, 0.4);
      }
      
      .text-gradient {
        background: linear-gradient(135deg, #FF6154 0%, #FB651E 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .feature-icon {
        background: linear-gradient(135deg, rgba(255, 97, 84, 0.1) 0%, rgba(251, 101, 30, 0.1) 100%);
        backdrop-filter: blur(10px);
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      
      .float-animation {
        animation: float 6s ease-in-out infinite;
      }
      
      .nav-blur {
        backdrop-filter: blur(12px);
        background-color: rgba(255, 255, 255, 0.8);
      }
    </style>
</head>
<body class="bg-white min-h-screen mesh-gradient">
    <!-- Navigation -->
    <nav class="nav-blur sticky top-0 z-50 border-b border-gray-200/50 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 relative">
                <div class="flex items-center">
                    <span class="text-2xl font-bold text-gradient">
                        ⚡ ValidAI Studio
                    </span>
                </div>
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#dashboard" class="text-gray-700 hover:text-primary transition font-semibold">How It Works</a>
                    <a href="#validation" onclick="showValidationForm();return false;" class="text-gray-700 hover:text-primary transition font-semibold">Validation</a>
                    <a href="/leaderboard" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-trophy mr-1 text-yellow-500"></i>Leaderboard
                    </a>
                    <a href="/marketplace" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-tag mr-1 text-green-500"></i>Pricing
                    </a>
                    <div class="nav-auth-buttons flex items-center space-x-3">
                        <button onclick="showAuthModal('login')" class="text-gray-700 hover:text-primary transition font-semibold px-4 py-2">
                            Sign In
                        </button>
                        <button onclick="showAuthModal('register')" class="btn-primary text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm">
                            Get Started
                        </button>
                    </div>
                </div>
                
                <!-- Mobile menu toggle -->
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" class="cursor-pointer p-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary hover:to-secondary hover:text-white transition-all duration-200 text-primary font-bold">
                        <i class="fas fa-bars text-xl" id="menu-icon-bars"></i>
                        <i class="fas fa-times text-xl hidden" id="menu-icon-close"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div class="hidden md:hidden bg-white border-t border-gray-200 shadow-lg" id="mobile-menu-container">
            <div class="max-w-7xl mx-auto px-4 py-4 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <a href="#dashboard" class="flex items-center px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition rounded-lg font-semibold">
                    <i class="fas fa-tachometer-alt mr-3 text-lg"></i>How It Works
                </a>
                <a href="#validation" onclick="showValidationForm();return false;" class="flex items-center px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition rounded-lg font-semibold">
                    <i class="fas fa-check-circle mr-3 text-lg"></i>Validation
                </a>
                <a href="/leaderboard" class="flex items-center px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition rounded-lg font-semibold">
                    <i class="fas fa-trophy mr-3 text-yellow-500 text-lg"></i>Leaderboard
                </a>
                <a href="/marketplace" class="flex items-center px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition rounded-lg font-semibold">
                    <i class="fas fa-star mr-3 text-yellow-500 text-lg"></i>Marketplace
                </a>
                <a href="/pricing" class="flex items-center px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition rounded-lg font-semibold">
                    <i class="fas fa-tag mr-3 text-green-500 text-lg"></i>Pricing
                </a>
                <div class="border-t pt-3 mt-3 space-y-2">
                    <button onclick="showAuthModal('login');" class="w-full flex items-center px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition rounded-lg font-semibold text-left">
                        <i class="fas fa-sign-in-alt mr-3 text-lg"></i>Sign In
                    </button>
                    <button onclick="showAuthModal('register');" class="w-full flex items-center px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold text-left">
                        <i class="fas fa-user-plus mr-3 text-lg"></i>Get Started
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <script>
        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuContainer = document.getElementById('mobile-menu-container');
        const menuIconBars = document.getElementById('menu-icon-bars');
        const menuIconClose = document.getElementById('menu-icon-close');
        
        if (mobileMenuButton && mobileMenuContainer) {
            mobileMenuButton.addEventListener('click', function() {
                mobileMenuContainer.classList.toggle('hidden');
                menuIconBars.classList.toggle('hidden');
                menuIconClose.classList.toggle('hidden');
            });
            
            // Close menu when clicking on a link
            const menuLinks = mobileMenuContainer.querySelectorAll('a, button');
            menuLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileMenuContainer.classList.add('hidden');
                    menuIconBars.classList.remove('hidden');
                    menuIconClose.classList.add('hidden');
                });
            });
        }
    </script>

    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-white">
        <div class="max-w-7xl mx-auto px-4 py-20 sm:py-24 md:py-32 sm:px-6 lg:px-8">
            <div class="text-center relative z-10">
                <div class="inline-block mb-6">
                    <span class="bg-orange-50 text-primary px-4 py-2 rounded-full text-sm font-bold border border-primary/20">
                        🚀 500+ Expert Validators Available
                    </span>
                </div>
                <h1 class="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight text-gray-900 tracking-tight">
                    Build & Validate<br/>
                    <span class="text-gradient">Winning Startups 10x Faster</span>
                </h1>
                <p class="text-xl sm:text-2xl mb-4 text-gray-600 font-semibold max-w-3xl mx-auto">
                    AI Platform + Venture Studio + Expert Validator Marketplace
                </p>
                <p class="text-base sm:text-lg mb-10 max-w-2xl mx-auto text-gray-500">
                    From idea to actionable insights in 48 hours. Connect with expert validators, get real feedback, and scale with confidence.
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                    <button onclick="showValidationForm()" class="btn-primary text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg inline-flex items-center justify-center">
                        <i class="fas fa-lightbulb mr-2"></i>Pitch your Idea
                    </button>
                    <button onclick="showUploadProductForm()" class="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-2xl transition-all inline-flex items-center justify-center">
                        <i class="fas fa-upload mr-2"></i>Upload My Product
                    </button>
                    <a href="/marketplace" class="bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-gray-800 transition inline-flex items-center justify-center">
                        <i class="fas fa-users mr-2"></i>Browse Validators
                    </a>
                </div>
                    </a>
                </div>
                <div class="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 font-semibold">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span>48h Validation</span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span>10K+ Products Validated</span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span>100% Guarantee</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 bg-gray-50">
        <div class="text-center mb-16">
            <h2 class="text-4xl font-black text-gray-900 mb-3">Results That Speak for Themselves</h2>
            <p class="text-xl text-gray-600 font-medium">Join thousands of founders who trust ValidAI Studio</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div class="text-center">
                <div class="text-6xl font-black text-gradient mb-2">48h</div>
                <div class="text-gray-900 font-bold text-lg">Full Validation</div>
                <div class="text-gray-500 text-sm mt-1 font-medium">Guaranteed results</div>
            </div>
            <div class="text-center">
                <div class="text-6xl font-black text-gradient mb-2">90%</div>
                <div class="text-gray-900 font-bold text-lg">Faster</div>
                <div class="text-gray-500 text-sm mt-1 font-medium">vs. traditional methods</div>
            </div>
            <div class="text-center">
                <div class="text-6xl font-black text-gradient mb-2">500+</div>
                <div class="text-gray-900 font-bold text-lg">Validators</div>
                <div class="text-gray-500 text-sm mt-1 font-medium">Certified experts</div>
            </div>
            <div class="text-center">
                <div class="text-6xl font-black text-gradient mb-2">10K+</div>
                <div class="text-gray-900 font-bold text-lg">Products</div>
                <div class="text-gray-500 text-sm mt-1 font-medium">Successfully validated</div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div id="app" class="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <!-- Features Section -->
        <div id="dashboard" class="mb-20 bg-white py-20">
            <h2 class="text-5xl font-black text-gray-900 mb-4 text-center">How It Works</h2>
            <p class="text-xl text-gray-600 mb-16 text-center max-w-3xl mx-auto font-medium">
                From idea to actionable data in 5 automated steps with expert validators
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div class="bg-white rounded-xl shadow-sm p-8 card-hover border border-gray-100">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-6 shadow-md">
                        <span class="text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Idea Input</h3>
                    <p class="text-gray-600 mb-4">Fill out the form with your idea details and target market</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-clock mr-1"></i>5 minutes
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-8 card-hover border border-gray-100">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-6 shadow-md">
                        <span class="text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">AI Analysis</h3>
                    <p class="text-gray-600 mb-4">Our AI analyzes competitors, trends, and opportunities in real-time</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-robot mr-1"></i>Instant
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-8 card-hover border border-gray-100">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-6 shadow-md">
                        <span class="text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Validators</h3>
                    <p class="text-gray-600 mb-4">Connect with marketplace experts to receive specialized feedback</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-users mr-1"></i>24-48h
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-8 card-hover border border-gray-100">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-6 shadow-md">
                        <span class="text-2xl font-bold text-white">4</span>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Beta Testing</h3>
                    <p class="text-gray-600 mb-4">Pre-selected panel tests your product and provides detailed feedback</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-vial mr-1"></i>1 week
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-8 card-hover border border-gray-100">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-6 shadow-md">
                        <span class="text-2xl font-bold text-white">5</span>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Results</h3>
                    <p class="text-gray-600 mb-4">Clear metrics, validator insights, and actionable recommendations</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-chart-line mr-1"></i>Dashboard
                    </div>
                </div>
            </div>
            
            <!-- Marketplace CTA -->
            <div class="mt-16 bg-gradient-to-r from-primary to-secondary rounded-2xl p-10 text-white shadow-xl">
                <div class="flex flex-col md:flex-row items-center justify-between">
                    <div class="mb-6 md:mb-0 text-center md:text-left">
                        <h3 class="text-3xl font-black mb-2">
                            <i class="fas fa-star mr-2"></i>
                            Validator Marketplace
                        </h3>
                        <p class="text-lg opacity-90 font-medium">Connect directly with 500+ certified experts in your industry</p>
                    </div>
                    <a href="/marketplace" class="bg-white text-primary px-8 py-4 rounded-xl font-black text-lg hover:shadow-2xl transition transform hover:scale-105 whitespace-nowrap">
                        Browse Validators <i class="fas fa-arrow-right ml-2"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Validation Form (Hidden by default) -->
        <!-- Quick Pitch Section - Simplified Customer Journey -->
        <div id="validation-form-section" class="mb-20 hidden">
            <div class="max-w-4xl mx-auto">
                <!-- Step Indicator -->
                <div class="flex justify-center items-center mb-8 space-x-4">
                    <div class="flex items-center">
                        <div id="step-indicator-1" class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                        <span class="ml-2 font-semibold text-gray-900">Pitch</span>
                    </div>
                    <div class="w-12 h-1 bg-gray-300"></div>
                    <div class="flex items-center">
                        <div id="step-indicator-2" class="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">2</div>
                        <span class="ml-2 font-semibold text-gray-600">AI Analysis</span>
                    </div>
                    <div class="w-12 h-1 bg-gray-300"></div>
                    <div class="flex items-center">
                        <div id="step-indicator-3" class="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">3</div>
                        <span class="ml-2 font-semibold text-gray-600">Marketplace</span>
                    </div>
                    <div class="w-12 h-1 bg-gray-300"></div>
                    <div class="flex items-center">
                        <div id="step-indicator-4" class="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">4</div>
                        <span class="ml-2 font-semibold text-gray-600">Dashboard</span>
                    </div>
                </div>

                <!-- Step 1: Pitch Form -->
                <div id="quick-pitch-step-1" class="bg-white rounded-2xl shadow-xl p-8">
                    <div class="text-center mb-8">
                        <h2 class="text-4xl font-black text-gray-900 mb-3">🚀 Pitch Your Startup Idea</h2>
                        <p class="text-xl text-gray-600 font-medium">Get instant AI analysis and join our marketplace</p>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 inline-block">
                            <div class="flex items-center">
                                <i class="fas fa-magic text-green-600 mr-2"></i>
                                <span class="text-green-800 font-bold">Free AI Analysis + Auto-publish to Marketplace</span>
                            </div>
                        </div>
                    </div>
                    
                    <form id="quick-pitch-form" class="space-y-6" onsubmit="event.preventDefault(); submitQuickPitchForm();">
                        <div>
                            <label class="block text-sm font-bold text-gray-900 mb-2">
                                💡 What's your startup idea?
                            </label>
                            <textarea id="pitch-idea" required rows="3"
                                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition"
                                      placeholder="Example: A mobile app that connects freelance designers with small businesses..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-900 mb-2">
                                🎯 What problem does it solve?
                            </label>
                            <textarea id="pitch-problem" required rows="3"
                                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition"
                                      placeholder="Example: Small businesses struggle to find affordable, quality design services..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-900 mb-2">
                                👥 Who is your target market?
                            </label>
                            <input id="pitch-market" type="text" required
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition"
                                   placeholder="Example: Small businesses with 10-50 employees in the US" />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-900 mb-2">
                                💰 What's your pricing model?
                            </label>
                            <select id="pitch-pricing-model" required
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition bg-white">
                                <option value="">Select pricing model...</option>
                                <option value="free">Free</option>
                                <option value="freemium">Freemium (Free + Paid tiers)</option>
                                <option value="one_time">One-time Payment</option>
                                <option value="subscription_monthly">Monthly Subscription</option>
                                <option value="subscription_yearly">Yearly Subscription</option>
                                <option value="usage_based">Usage-based / Pay-as-you-go</option>
                                <option value="enterprise">Enterprise / Custom Pricing</option>
                            </select>
                        </div>
                        
                        <button type="submit"
                                class="w-full bg-gradient-to-r from-primary to-secondary text-white px-8 py-5 rounded-xl font-black text-xl hover:shadow-2xl transition-all transform hover:scale-105">
                            <i class="fas fa-magic mr-2"></i>Analyze with AI - Free
                        </button>
                    </form>
                </div>

                <!-- Step 2: AI Analysis -->
                <div id="quick-pitch-step-2" class="hidden bg-white rounded-2xl shadow-xl p-8">
                    <div class="text-center">
                        <div class="animate-pulse mb-6">
                            <div class="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto flex items-center justify-center mb-4">
                                <i class="fas fa-brain text-white text-5xl"></i>
                            </div>
                            <h3 class="text-3xl font-black text-gray-900 mb-2">🤖 AI is analyzing your idea...</h3>
                            <p class="text-xl text-gray-600">Creating project, analyzing market fit, generating insights</p>
                        </div>
                        
                        <div class="flex justify-center space-x-2 mt-8">
                            <div class="w-4 h-4 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
                            <div class="w-4 h-4 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
                            <div class="w-4 h-4 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Results & Marketplace -->
                <div id="quick-pitch-step-3" class="hidden bg-white rounded-2xl shadow-xl p-8">
                    <div class="text-center mb-6">
                        <div class="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                            <i class="fas fa-check text-white text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-black text-gray-900 mb-2">✨ Analysis Complete!</h3>
                        <p class="text-lg text-gray-600">Your project is now live in the marketplace</p>
                    </div>
                    
                    <div id="analysis-results-container" class="space-y-6">
                        <!-- AI analysis results will be inserted here -->
                    </div>

                    <div class="mt-8 text-center">
                        <p class="text-lg font-bold text-primary mb-4">
                            <i class="fas fa-arrow-right mr-2"></i>
                            Redirecting to your dashboard in <span id="redirect-countdown">5</span> seconds...
                        </p>
                        <button onclick="redirectToDashboard()" class="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition">
                            Go to Dashboard Now
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Product Form Section -->
        <div id="upload-product-form-section" class="mb-20 hidden">
            <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-full mx-auto flex items-center justify-center mb-4">
                        <i class="fas fa-upload text-white text-4xl"></i>
                    </div>
                    <h2 class="text-4xl font-black text-gray-900 mb-4">📦 Upload Your Product</h2>
                    <p class="text-xl text-gray-600">
                        Already have a product ready? List it directly in the marketplace and get validated by the community!
                    </p>
                </div>

                <form id="upload-product-form" class="space-y-6">
                    <!-- Product Name -->
                    <div>
                        <label for="product-name" class="block text-sm font-bold text-gray-700 mb-2">
                            🏷️ Product Name *
                        </label>
                        <input
                            type="text"
                            id="product-name"
                            name="product-name"
                            required
                            placeholder="e.g., TaskMaster Pro, FitTracker AI..."
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                        />
                    </div>

                    <!-- Product Description -->
                    <div>
                        <label for="product-description" class="block text-sm font-bold text-gray-700 mb-2">
                            📝 Product Description *
                        </label>
                        <textarea
                            id="product-description"
                            name="product-description"
                            required
                            rows="4"
                            placeholder="Describe your product, its key features, and what makes it unique..."
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                        ></textarea>
                    </div>

                    <!-- Product URL -->
                    <div>
                        <label for="product-url" class="block text-sm font-bold text-gray-700 mb-2">
                            🔗 Product URL *
                        </label>
                        <input
                            type="url"
                            id="product-url"
                            name="product-url"
                            required
                            placeholder="https://yourproduct.com"
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Category -->
                        <div>
                            <label for="product-category" class="block text-sm font-bold text-gray-700 mb-2">
                                🎯 Category *
                            </label>
                            <select
                                id="product-category"
                                name="product-category"
                                required
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                            >
                                <option value="">Select a category</option>
                                <option value="saas">SaaS</option>
                                <option value="marketplace">Marketplace</option>
                                <option value="ai">AI/ML</option>
                                <option value="fintech">Fintech</option>
                                <option value="ecommerce">E-commerce</option>
                                <option value="education">Education</option>
                                <option value="health">Health</option>
                                <option value="productivity">Productivity</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <!-- Product Stage -->
                        <div>
                            <label for="product-stage" class="block text-sm font-bold text-gray-700 mb-2">
                                🚀 Product Stage *
                            </label>
                            <select
                                id="product-stage"
                                name="product-stage"
                                required
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                            >
                                <option value="">Select stage</option>
                                <option value="mvp">MVP</option>
                                <option value="beta">Beta</option>
                                <option value="launched">Launched</option>
                                <option value="growth">Growth Stage</option>
                            </select>
                        </div>
                    </div>

                    <!-- Pricing Model -->
                    <div>
                        <label for="product-pricing-model" class="block text-sm font-bold text-gray-700 mb-2">
                            💰 Pricing Model *
                        </label>
                        <select
                            id="product-pricing-model"
                            name="product-pricing-model"
                            required
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                        >
                            <option value="">Select pricing model</option>
                            <option value="free">Free</option>
                            <option value="freemium">Freemium</option>
                            <option value="one_time">One-Time Payment</option>
                            <option value="subscription_monthly">Monthly Subscription</option>
                            <option value="subscription_yearly">Yearly Subscription</option>
                            <option value="usage_based">Usage-Based</option>
                            <option value="enterprise">Enterprise/Custom</option>
                        </select>
                    </div>

                    <!-- Compensation for Validators -->
                    <div class="bg-blue-50 rounded-xl p-6 space-y-4">
                        <h3 class="text-lg font-bold text-gray-900">💎 Validator Compensation</h3>
                        <p class="text-sm text-gray-600">Reward validators who provide feedback on your product</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="compensation-type" class="block text-sm font-bold text-gray-700 mb-2">
                                    Compensation Type *
                                </label>
                                <select
                                    id="compensation-type"
                                    name="compensation-type"
                                    required
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
                                >
                                    <option value="free_access">Free Access</option>
                                    <option value="discount">Discount Code</option>
                                    <option value="cash">Cash Payment</option>
                                    <option value="equity">Equity</option>
                                </select>
                            </div>

                            <div>
                                <label for="compensation-amount" class="block text-sm font-bold text-gray-700 mb-2">
                                    Amount/Details *
                                </label>
                                <input
                                    type="text"
                                    id="compensation-amount"
                                    name="compensation-amount"
                                    required
                                    placeholder="e.g., 6 months, $50, 0.1%..."
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Validation Settings -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="max-validators" class="block text-sm font-bold text-gray-700 mb-2">
                                👥 Max Validators *
                            </label>
                            <input
                                type="number"
                                id="max-validators"
                                name="max-validators"
                                required
                                min="1"
                                max="100"
                                value="10"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                            />
                        </div>

                        <div>
                            <label for="duration-days" class="block text-sm font-bold text-gray-700 mb-2">
                                ⏱️ Duration (days) *
                            </label>
                            <input
                                type="number"
                                id="duration-days"
                                name="duration-days"
                                required
                                min="1"
                                max="90"
                                value="30"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none text-lg"
                            />
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex gap-4">
                        <button
                            type="button"
                            onclick="hideUploadProductForm()"
                            class="flex-1 bg-gray-300 text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition"
                        >
                            <i class="fas fa-upload mr-2"></i>
                            Upload Product
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Upload Product Success Screen -->
        <div id="upload-product-success" class="mb-20 hidden">
            <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                        <i class="fas fa-check text-white text-4xl"></i>
                    </div>
                    <h3 class="text-3xl font-black text-gray-900 mb-2">🎉 Product Uploaded Successfully!</h3>
                    <p class="text-lg text-gray-600">Your product is now live in the marketplace</p>
                </div>

                <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                    <div class="flex items-center justify-center mb-4">
                        <i class="fas fa-rocket text-4xl text-primary mr-4"></i>
                        <div class="text-left">
                            <h4 class="text-xl font-bold text-gray-900">What's Next?</h4>
                            <p class="text-gray-600">Manage your product and track validator feedback</p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 text-center">
                    <p class="text-lg font-bold text-primary mb-4">
                        <i class="fas fa-arrow-right mr-2"></i>
                        Redirecting to your dashboard in <span id="upload-redirect-countdown">5</span> seconds...
                    </p>
                    <button onclick="redirectToDashboard()" class="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition">
                        Go to Dashboard Now
                    </button>
                </div>
            </div>
        </div>

        <!-- Projects Dashboard -->
        <div id="projects-section" class="mb-20">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-3xl font-bold text-gray-900">My Projects</h2>
                <button onclick="showValidationForm()" class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition">
                    <i class="fas fa-plus mr-2"></i>New Project
                </button>
            </div>
            
            <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Projects will be loaded here -->
            </div>
        </div>

        <!-- Beta Users Panel -->
        <div id="beta-panel" class="mb-20">
            <h2 class="text-3xl font-bold text-gray-900 mb-4 text-center">Beta User Panel</h2>
            <p class="text-xl text-gray-600 mb-8 text-center font-medium">
                Access 10,000+ pre-qualified beta users in your niche
            </p>
            
            <div id="beta-users-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Beta users will be loaded here -->
            </div>
        </div>

        <!-- Pricing Section -->
        <div id="pricing" class="mb-20 bg-white py-20">
            <h2 class="text-5xl font-black text-gray-900 mb-4 text-center">Pricing Plans</h2>
            <p class="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto font-medium">Choose the perfect plan for your growth stage</p>
            
            <!-- Plan Type Selector -->
            <div class="flex justify-center mb-8">
                <div class="bg-gray-100 rounded-xl p-1 inline-flex">
                    <button id="platform-plans-btn" onclick="switchPlanType('platform')" class="px-6 py-3 rounded-lg font-bold transition bg-white shadow-sm text-gray-900">
                        🎯 Full Platform
                        <span class="block text-xs font-normal mt-1 text-gray-600">MVP + AI + Marketplace</span>
                    </button>
                    <button id="marketplace-plans-btn" onclick="switchPlanType('marketplace')" class="px-6 py-3 rounded-lg font-bold transition text-gray-700 hover:bg-white/50">
                        🏪 Marketplace Only
                        <span class="block text-xs font-normal mt-1 text-gray-600">Validator Network</span>
                    </button>
                </div>
            </div>
            
            <!-- Description based on plan type -->
            <div id="platform-description" class="text-center mb-8 max-w-3xl mx-auto">
                <p class="text-gray-600 font-medium">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Includes: AI MVP Generator, Automated Validation, Analytics, and full Marketplace access
                </p>
            </div>
            
            <div id="marketplace-description" class="hidden text-center mb-8 max-w-3xl mx-auto">
                <p class="text-gray-600 font-medium">
                    <i class="fas fa-info-circle text-primary mr-2"></i>
                    Marketplace access only. <strong>Perfect if you already have your product</strong> and just need expert feedback.
                </p>
            </div>
            
            <!-- Billing Toggle -->
            <div class="flex justify-center mb-12">
                <div class="bg-gray-100 rounded-xl p-1 inline-flex">
                    <button id="monthly-billing-btn" onclick="switchBillingCycle('monthly')" class="px-6 py-2 rounded-lg font-bold transition bg-white shadow-sm text-gray-900">
                        Monthly
                    </button>
                    <button id="yearly-billing-btn" onclick="switchBillingCycle('yearly')" class="px-6 py-2 rounded-lg font-bold transition text-gray-700 hover:bg-white/50">
                        Annual <span class="text-green-600 text-xs ml-1 font-bold">-20%</span>
                    </button>
                </div>
            </div>
            
            <!-- Plans Grid (will be populated dynamically) -->
            <div id="pricing-plans-grid" class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <!-- Loading state -->
                <div class="col-span-3 text-center py-12">
                    <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p class="text-gray-600">Cargando planes...</p>
                </div>
            </div>

            <!-- Managed Services -->
            <div class="mt-20 bg-gray-50 rounded-2xl p-10">
                <h3 class="text-3xl font-black text-gray-900 mb-3 text-center">Managed Services</h3>
                <p class="text-gray-600 mb-12 text-center font-medium">Our experts do the work for you</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition">
                        <h4 class="text-xl font-bold text-gray-900 mb-2">Express Validation</h4>
                        <div class="text-4xl font-black text-gray-900 mb-6">$2,997</div>
                        <ul class="space-y-3 text-gray-700 font-medium">
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>Deep market analysis</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>20+ user interviews</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>2-week delivery</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm border-2 border-primary p-8 hover:shadow-md transition relative">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-bold">
                            Most Popular
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 mb-2">MVP + Growth Launch</h4>
                        <div class="text-4xl font-black text-gray-900 mb-6">$14,997</div>
                        <ul class="space-y-3 text-gray-700 font-medium">
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>Full functional MVP</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>Growth Marketing Launch</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>6-8 week delivery</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition">
                        <h4 class="text-xl font-bold text-gray-900 mb-2">Growth Retainer</h4>
                        <div class="text-4xl font-black text-gray-900 mb-6">$3,997<span class="text-xl text-gray-500">/mo</span></div>
                        <ul class="space-y-3 text-gray-700 font-medium">
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>Startup ($3,997/mo)</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>Scale-up ($7,997/mo)</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                                <span>Enterprise ($14,997/mes)</span>
                            </li>
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
    <footer class="bg-gray-900 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div>
                    <h3 class="text-2xl font-black mb-4">ValidAI Studio</h3>
                    <p class="text-gray-400 leading-relaxed font-medium">We validate and launch successful startups 10x faster using AI and the studio model.</p>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-white">Product</h4>
                    <ul class="space-y-3 text-gray-400 font-medium">
                        <li><a href="#" class="hover:text-white transition">Platform</a></li>
                        <li><a href="#" class="hover:text-white transition">Venture Studio</a></li>
                        <li><a href="#pricing" class="hover:text-white transition">Pricing</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-white">Resources</h4>
                    <ul class="space-y-3 text-gray-400 font-medium">
                        <li><a href="#" class="hover:text-white transition">Blog</a></li>
                        <li><a href="#" class="hover:text-white transition">Success Stories</a></li>
                        <li><a href="#" class="hover:text-white transition">Documentation</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-white">Company</h4>
                    <ul class="space-y-3 text-gray-400 font-medium">
                        <li><a href="#" class="hover:text-white transition">About</a></li>
                        <li><a href="#" class="hover:text-white transition">Join the Team</a></li>
                        <li><a href="#" class="hover:text-white transition">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p class="text-gray-400 text-sm font-medium">&copy; 2025 ValidAI Studio. All rights reserved.</p>
                <div class="flex gap-6 mt-4 md:mt-0">
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-twitter text-xl"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-linkedin text-xl"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white transition">
                        <i class="fab fa-github text-xl"></i>
                    </a>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
      // Mobile menu functions
      function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const icon = button ? button.querySelector('i') : null;

        if (!menu) {
          console.error('Mobile menu not found');
          return;
        }

        const isOpen = !menu.classList.contains('hidden');

        if (isOpen) {
          // Close menu
          menu.classList.add('hidden');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        } else {
          // Open menu
          menu.classList.remove('hidden');
          if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
          }
        }
      }

      function closeMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const icon = button ? button.querySelector('i') : null;

        if (menu) {
          menu.classList.add('hidden');
        }
        if (icon) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }

      // Initialize mobile menu when DOM is ready
      document.addEventListener('DOMContentLoaded', function() {
        const mobileButton = document.getElementById('mobile-menu-button');
        if (mobileButton) {
          mobileButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
          });
        }

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
          const menu = document.getElementById('mobile-menu');
          const button = document.getElementById('mobile-menu-button');

          if (menu && button &&
              !menu.contains(event.target) &&
              !button.contains(event.target) &&
              !menu.classList.contains('hidden')) {
            closeMobileMenu();
          }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape') {
            closeMobileMenu();
          }
        });
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

        const title = action === 'login' ? 'Sign In with Google' : 'Sign Up with Google';
        const description = action === 'login' ? 'Choose your role to continue' : 'Choose your role to register';
        const backAction = action === 'login' ? 'login' : 'register';

        modalContent.innerHTML = '<div class="text-center">' +
          '<i class="fab fa-google text-5xl mb-4" style="background: linear-gradient(45deg, #FF6154, #FB651E); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>' +
          '<h2 class="text-3xl font-black text-gray-900 mb-2">' + title + '</h2>' +
          '<p class="text-gray-600 mb-8 font-medium">' + description + '</p>' +
          '<div class="space-y-4">' +
          '<button onclick="loginAsFounder()" class="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">' +
          '<i class="fas fa-lightbulb text-2xl"></i>' +
          '<span class="text-lg">Founder - Create & Validate Projects</span>' +
          '</button>' +
          '<button onclick="loginAsValidator()" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">' +
          '<i class="fas fa-star text-2xl"></i>' +
          '<span class="text-lg">Validator - Vote & Rate Projects</span>' +
          '</button>' +
          '</div>' +
          '<button onclick="closeAuthModal()" class="mt-6 text-gray-600 hover:text-primary font-semibold">' +
          '← Back' +
          '</button>' +
          '</div>';
      }

      // Show auth modal
      function showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        const modalContent = document.getElementById('auth-modal-content');

        if (!modal || !modalContent) return;

        modal.classList.remove('hidden');

        if (mode === 'login') {
          const loginHtml = '<div class="text-center">' +
            '<i class="fas fa-sign-in-alt text-5xl mb-4" style="background: linear-gradient(45deg, #FF6154, #FB651E); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>' +
            '<h2 class="text-3xl font-black text-gray-900 mb-2">Sign In</h2>' +
            '<p class="text-gray-600 mb-6 font-medium">Access your ValidAI Studio account</p>' +
            '<button onclick="showRoleSelection(\\\'login\\\')" class="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3 mb-6">' +
              '<i class="fab fa-google text-2xl"></i>' +
              '<span class="text-lg">Continue with Google</span>' +
            '</button>' +
            '<p class="text-sm text-gray-600 mt-4">' +
              'Don&apos;t have an account? <a href="#" onclick="showAuthModal(\\\'register\\\')" class="text-primary hover:underline font-bold">Sign Up</a>' +
            '</p>' +
          '</div>';
          modalContent.innerHTML = loginHtml;
        } else if (mode === 'register') {
          const registerHtml = '<div class="text-center">' +
            '<i class="fas fa-user-plus text-5xl mb-4" style="background: linear-gradient(45deg, #FF6154, #FB651E); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>' +
            '<h2 class="text-3xl font-black text-gray-900 mb-2">Get Started</h2>' +
            '<p class="text-gray-600 mb-8 font-medium">Choose your role to register</p>' +
            '<div class="space-y-4">' +
              '<button onclick="loginAsFounder()" class="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">' +
                '<i class="fas fa-lightbulb text-2xl"></i>' +
                '<span class="text-lg">Founder - Create & Validate</span>' +
              '</button>' +
              '<button onclick="loginAsValidator()" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">' +
                '<i class="fas fa-star text-2xl"></i>' +
                '<span class="text-lg">Validator - Vote & Rate</span>' +
              '</button>' +
            '</div>' +
            '<p class="text-sm text-gray-600 mt-6">' +
              'Already have an account? <a href="#" onclick="showAuthModal(\\\'login\\\')" class="text-primary hover:underline font-bold">Sign In</a>' +
            '</p>' +
          '</div>';
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
          const logoutHtml = '<button onclick="logout()" class="text-gray-700 hover:text-primary transition">' +
            '<i class="fas fa-sign-out-alt mr-1"></i>Cerrar Sesión' +
            '</button>';
          navButtons.forEach(btn => {
            btn.innerHTML = logoutHtml;
          });
        } else {
          // User is not logged in - show login/register options
          const loginHtml = '<button onclick="showAuthModal(\\\'login\\\')" class="text-gray-700 hover:text-primary transition">' +
            '<i class="fas fa-sign-in-alt mr-1"></i>Iniciar Sesión' +
            '</button>' +
            '<button onclick="showAuthModal(\\\'register\\\')" class="ml-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">' +
            '<i class="fas fa-user-plus mr-1"></i>Registrarse' +
            '</button>';
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
        
        // Handle product parameter redirect FIRST
        const productId = urlParams.get('product');
        if (productId && /^\d+$/.test(productId)) {
          window.location.href = '/marketplace?product=' + productId;
          return; // Don't process other parameters
        }
        
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

      // ========== QUICK PITCH FUNCTIONS ==========
      let quickPitchSubmitting = false;
      let createdProjectId = null;

      async function submitQuickPitchForm() {
        if (quickPitchSubmitting) return;

        const idea = document.getElementById('pitch-idea').value.trim();
        const problem = document.getElementById('pitch-problem').value.trim();
        const market = document.getElementById('pitch-market').value.trim();
        const pricingModel = document.getElementById('pitch-pricing-model').value;

        if (!idea || !problem || !market || !pricingModel) {
          alert('Please fill in all fields');
          return;
        }

        quickPitchSubmitting = true;

        // Show Step 2: AI Analysis
        updateStepIndicator(2);
        document.getElementById('quick-pitch-step-1').classList.add('hidden');
        document.getElementById('quick-pitch-step-2').classList.remove('hidden');

        try {
          // Get user info if logged in
          let userId = null;
          let userEmail = null;
          const token = localStorage.getItem('authToken');
          
          if (token) {
            try {
              const userResponse = await axios.get('/api/auth/me', {
                headers: { Authorization: 'Bearer ' + token }
              });
              console.log('User response:', userResponse.data);
              if (userResponse.data.user) {
                userId = userResponse.data.user.id;
                userEmail = userResponse.data.user.email;
                console.log('User authenticated:', { userId, userEmail });
              }
            } catch (authError) {
              console.log('Not authenticated:', authError);
            }
          } else {
            console.log('No auth token found');
          }

          console.log('Submitting pitch with userId:', userId);

          const response = await axios.post('/api/quick-pitch/submit', {
            idea: idea,
            problemSolving: problem,
            targetMarket: market,
            pricingModel: pricingModel,
            userId: userId,
            email: userEmail
          });

          if (response.data.success) {
            createdProjectId = response.data.projectId;
            displayQuickPitchResults(response.data.analysis);
            
            // Show Step 3: Results & Marketplace
            updateStepIndicator(3);
            document.getElementById('quick-pitch-step-2').classList.add('hidden');
            document.getElementById('quick-pitch-step-3').classList.remove('hidden');

            // Start countdown for auto-redirect
            startRedirectCountdown();
          } else {
            throw new Error(response.data.error || 'Failed to submit pitch');
          }
        } catch (error) {
          console.error('Error submitting pitch:', error);
          
          // Check if authentication is required
          if (error.response && error.response.status === 401 && error.response.data.requiresAuth) {
            alert('Please sign up or log in to validate your idea. You will be redirected to the registration page.');
            window.location.href = '/marketplace#signup';
            return;
          }
          
          alert('Error analyzing your idea. Please try again.');
          
          // Go back to step 1
          updateStepIndicator(1);
          document.getElementById('quick-pitch-step-2').classList.add('hidden');
          document.getElementById('quick-pitch-step-1').classList.remove('hidden');
        } finally {
          quickPitchSubmitting = false;
        }
      }

      // Upload Product Form Functions
      function showUploadProductForm() {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        if (!token) {
          alert('Please sign up or log in to upload your product');
          window.location.href = '/marketplace#signup';
          return;
        }

        const section = document.getElementById('upload-product-form-section');
        if (section) {
          section.classList.remove('hidden');
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      function hideUploadProductForm() {
        const section = document.getElementById('upload-product-form-section');
        if (section) {
          section.classList.add('hidden');
        }
      }

      // Handle Upload Product form submission
      document.getElementById('upload-product-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');
        if (!token) {
          alert('Please sign up or log in first');
          window.location.href = '/marketplace#signup';
          return;
        }

        const productName = document.getElementById('product-name').value.trim();
        const productDescription = document.getElementById('product-description').value.trim();
        const productUrl = document.getElementById('product-url').value.trim();
        const productCategory = document.getElementById('product-category').value;
        const productStage = document.getElementById('product-stage').value;
        const pricingModel = document.getElementById('product-pricing-model').value;
        const compensationType = document.getElementById('compensation-type').value;
        const compensationAmount = document.getElementById('compensation-amount').value.trim();
        const maxValidators = parseInt(document.getElementById('max-validators').value);
        const durationDays = parseInt(document.getElementById('duration-days').value);

        // Validation
        if (!productName || !productDescription || !productUrl || !productCategory || 
            !productStage || !pricingModel || !compensationType || !compensationAmount) {
          alert('Please fill in all required fields');
          return;
        }

        try {
          const response = await axios.post('/api/marketplace/products', {
            title: productName,
            description: productDescription,
            url: productUrl,
            category: productCategory,
            stage: productStage,
            pricing_model: pricingModel,
            compensation_type: compensationType,
            compensation_amount: compensationAmount,
            validators_needed: maxValidators,
            duration_days: durationDays,
            status: 'active'
          }, {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            // Reset form
            document.getElementById('upload-product-form').reset();
            
            // Hide form
            hideUploadProductForm();
            
            // Show success screen
            const successScreen = document.getElementById('upload-product-success');
            if (successScreen) {
              successScreen.classList.remove('hidden');
              successScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Start countdown for auto-redirect
            startUploadRedirectCountdown();
          } else {
            throw new Error(response.data.error || 'Failed to upload product');
          }
        } catch (error) {
          console.error('Error uploading product:', error);
          
          if (error.response && error.response.status === 401) {
            alert('Session expired. Please log in again.');
            window.location.href = '/marketplace#login';
            return;
          }
          
          alert('Error uploading product: ' + (error.response?.data?.error || error.message || 'Please try again'));
        }
      });

      function updateStepIndicator(activeStep) {
        for (let i = 1; i <= 4; i++) {
          const indicator = document.getElementById('step-indicator-' + i);
          if (!indicator) continue;

          if (i < activeStep) {
            indicator.className = 'w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold';
            indicator.innerHTML = '<i class="fas fa-check"></i>';
          } else if (i === activeStep) {
            indicator.className = 'w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold';
            indicator.textContent = i;
          } else {
            indicator.className = 'w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold';
            indicator.textContent = i;
          }
        }
      }

      function displayQuickPitchResults(analysis) {
        const container = document.getElementById('analysis-results-container');
        if (!container || !analysis) return;

        const scoreColor = analysis.ai_score >= 80 ? 'text-green-600' : 
                           analysis.ai_score >= 60 ? 'text-blue-600' : 'text-orange-600';

        container.innerHTML = 
          '<div class="space-y-6">' +
            '<div class="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">' +
              '<div class="text-7xl font-black ' + scoreColor + ' mb-2">' + analysis.ai_score + '/100</div>' +
              '<p class="text-gray-600 font-bold text-lg">AI Viability Score</p>' +
            '</div>' +
            '<div>' +
              '<h3 class="text-2xl font-black text-gray-900 mb-2">' + escapeHtml(analysis.title) + '</h3>' +
              '<p class="text-gray-600 leading-relaxed">' + escapeHtml(analysis.description) + '</p>' +
            '</div>' +
            '<div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">' +
              '<p class="font-bold text-purple-900 mb-1">💎 Value Proposition</p>' +
              '<p class="text-purple-700">' + escapeHtml(analysis.value_proposition) + '</p>' +
            '</div>' +
            (analysis.strengths && analysis.strengths.length > 0 ? 
              '<div>' +
                '<p class="font-bold text-gray-900 mb-2 flex items-center">' +
                  '<i class="fas fa-check-circle text-green-500 mr-2"></i>Strengths' +
                '</p>' +
                '<ul class="space-y-2">' +
                  analysis.strengths.map(s => 
                    '<li class="flex items-start">' +
                      '<i class="fas fa-star text-yellow-500 mr-2 mt-1"></i>' +
                      '<span class="text-gray-700">' + escapeHtml(s) + '</span>' +
                    '</li>'
                  ).join('') +
                '</ul>' +
              '</div>' : '') +
            (analysis.opportunities && analysis.opportunities.length > 0 ? 
              '<div>' +
                '<p class="font-bold text-gray-900 mb-2 flex items-center">' +
                  '<i class="fas fa-lightbulb text-yellow-500 mr-2"></i>Opportunities' +
                '</p>' +
                '<ul class="space-y-2">' +
                  analysis.opportunities.map(o => 
                    '<li class="flex items-start">' +
                      '<i class="fas fa-arrow-right text-blue-500 mr-2 mt-1"></i>' +
                      '<span class="text-gray-700">' + escapeHtml(o) + '</span>' +
                    '</li>'
                  ).join('') +
                '</ul>' +
              '</div>' : '') +
            '<div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">' +
              '<i class="fas fa-tag mr-2"></i>' + (analysis.category || 'General') +
            '</div>' +
          '</div>';
      }

      function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function startRedirectCountdown() {
        let countdown = 5;
        const countdownEl = document.getElementById('redirect-countdown');
        
        const interval = setInterval(() => {
          countdown--;
          if (countdownEl) {
            countdownEl.textContent = countdown;
          }
          
          if (countdown <= 0) {
            clearInterval(interval);
            redirectToDashboard();
          }
        }, 1000);
      }

      function startUploadRedirectCountdown() {
        let countdown = 5;
        const countdownEl = document.getElementById('upload-redirect-countdown');
        
        const interval = setInterval(() => {
          countdown--;
          if (countdownEl) {
            countdownEl.textContent = countdown;
          }
          
          if (countdown <= 0) {
            clearInterval(interval);
            redirectToDashboard();
          }
        }, 1000);
      }

      function redirectToDashboard() {
        // Redirect to marketplace personal dashboard with goals
        window.location.href = '/marketplace#my-dashboard';
      }
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
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .hero-pattern {
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
      .gradient-border {
        border-image: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) 1;
      }
      .card-hover {
        transition: all 0.3s ease;
      }
      .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
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
                        <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
                    </a>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" onclick="toggleMobileMenu()" class="p-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary hover:to-secondary hover:text-white transition-all duration-200 text-primary font-bold">
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beta Validator Marketplace - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#FF6154',
              secondary: '#FB651E',
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      .text-gradient {
        background: linear-gradient(135deg, #FF6154 0%, #FB651E 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(255, 97, 84, 0.2);
      }
      
      .nav-blur {
        backdrop-filter: blur(12px);
        background-color: rgba(255, 255, 255, 0.8);
      }
    </style>
</head>
<body class="bg-white">
    <!-- Navigation -->
    <nav class="nav-blur sticky top-0 z-50 border-b border-gray-200/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-black text-gradient">
                        <i class="fas fa-rocket mr-2"></i>
                        ValidAI Studio
                    </a>
                </div>
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-primary transition font-semibold">Home</a>
                    <a href="/marketplace" class="text-primary font-bold">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <div id="auth-nav">
                        <button onclick="window.location.href='/?show_auth=login'" class="text-gray-700 hover:text-primary transition font-semibold mr-4">
                            Sign In
                        </button>
                        <button onclick="window.location.href='/?show_auth=register'" class="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-lg font-bold hover:shadow-lg transition">
                            Get Started
                        </button>
                    </div>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center">
                    <button onclick="toggleMobileMenu()" class="p-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary hover:to-secondary hover:text-white transition-all duration-200 text-primary font-bold" id="mobile-menu-button">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile Navigation Menu -->
            <div class="md:hidden hidden fixed inset-0 z-50" id="mobile-menu">
                <div class="absolute inset-0 bg-black bg-opacity-50" onclick="toggleMobileMenu()"></div>
                <div class="relative bg-white w-80 max-w-[85vw] h-full ml-auto shadow-xl transform transition-transform duration-300 ease-in-out">
                    <div class="flex items-center justify-between p-4 border-b">
                        <span class="text-lg font-black text-gray-900">Menu</span>
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
                                <span class="font-bold">Sign In</span>
                            </button>
                            <button onclick="window.location.href='/?show_auth=register'" class="flex items-center w-full px-6 py-3 mx-6 mt-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold">
                                <i class="fas fa-user-plus mr-3 text-lg"></i>
                                <span>Get Started</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
    
    <script>
      function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        if (menu && button) {
          const icon = button.querySelector('i');
          if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            if (icon) {
              icon.classList.remove('fa-bars');
              icon.classList.add('fa-times');
            }
          } else {
            menu.classList.add('hidden');
            if (icon) {
              icon.classList.remove('fa-times');
              icon.classList.add('fa-bars');
            }
          }
        }
      }
    </script>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-primary to-secondary text-white py-16 sm:py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
                <i class="fas fa-star text-yellow-300 mr-2 text-sm sm:text-base"></i>
                <span class="text-xs sm:text-sm font-bold">Certified Professional Validators</span>
            </div>
            <h1 class="text-4xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 leading-tight">
                Beta Validator Marketplace
            </h1>
            <p class="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8 px-2 font-medium">
                Connecting companies with professional validators for real feedback before launch
            </p>
            <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                <button onclick="scrollToSection('products')" class="bg-white text-primary px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-black text-base sm:text-lg hover:shadow-2xl transition transform hover:scale-105 min-h-[48px] flex items-center justify-center">
                    <i class="fas fa-box-open mr-2"></i>View Beta Products
                </button>
                <button onclick="scrollToSection('validators')" class="bg-gray-900 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-black text-base sm:text-lg hover:bg-gray-800 transition min-h-[48px] flex items-center justify-center">
                    <i class="fas fa-users mr-2"></i>Meet Validators
                </button>
            </div>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="bg-gray-50 border-b">
        <div class="max-w-7xl mx-auto px-4 py-12">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                    <div class="text-4xl font-black text-gradient">500+</div>
                    <div class="text-gray-600 text-sm font-semibold mt-2">Active Validators</div>
                </div>
                <div>
                    <div class="text-4xl font-black text-gradient">1,200+</div>
                    <div class="text-gray-600 text-sm font-semibold mt-2">Products Validated</div>
                </div>
                <div>
                    <div class="text-4xl font-black text-gradient">4.8/5</div>
                    <div class="text-gray-600 text-sm font-semibold mt-2">Average Rating</div>
                </div>
                <div>
                    <div class="text-4xl font-black text-gradient">48h</div>
                    <div class="text-gray-600 text-sm font-semibold mt-2">Response Time</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        
        <!-- Tabs -->
        <div class="border-b mb-4 sm:mb-6">
            <div class="flex overflow-x-auto scrollbar-hide space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button onclick="showTab('products')" class="tab tab-active pb-2 sm:pb-3 px-2 font-bold transition whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center" id="products-tab">
                    <i class="fas fa-box-open mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Products</span>
                </button>
                <button onclick="showTab('validators')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center font-bold" id="validators-tab">
                    <i class="fas fa-users mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Validators</span>
                </button>
                <button onclick="showTab('chat')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center font-bold" id="chat-tab">
                    <i class="fas fa-comments mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Chat</span>
                    <span id="chat-notification-badge" class="hidden ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold">0</span>
                </button>
                <button onclick="showTab('my-dashboard')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition hidden whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center font-bold" id="my-dashboard-tab">
                    <i class="fas fa-tachometer-alt mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Dashboard</span>
                </button>
                <button onclick="showTab('internal-dashboard')" class="tab pb-2 sm:pb-3 px-2 text-gray-600 hover:text-primary transition hidden whitespace-nowrap flex-shrink-0 min-w-0 min-h-[44px] flex items-center justify-center font-bold" id="internal-dashboard-tab">
                    <i class="fas fa-cogs mr-1 sm:mr-2 text-sm sm:text-base"></i>
                    <span class="text-sm sm:text-base">Internal Dashboard</span>
                </button>
            </div>
        </div>

        <!-- Products Tab -->
        <div id="products-content" class="tab-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-black text-gray-900">Available Beta Products</h2>
                <button onclick="showCreateProductModal()" class="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:shadow-lg transition hidden font-bold" id="create-product-btn">
                    <i class="fas fa-plus mr-2"></i>Publish Product
                </button>
            </div>
            
            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 class="text-base sm:text-lg font-black text-gray-900">Filters</h3>
                    <button onclick="resetProductFilters()" class="text-sm text-primary hover:text-primary/80 font-bold sm:hidden min-h-[44px] flex items-center">
                        <i class="fas fa-undo mr-1"></i>Clear
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Category</label>
                        <select id="category-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm min-h-[44px] px-3 font-medium">
                            <option value="">All</option>
                            <option value="SaaS">SaaS</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Web3">Web3</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Fintech">Fintech</option>
                            <option value="E-commerce">E-commerce</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Stage</label>
                        <select id="stage-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm min-h-[44px] px-3 font-medium">
                            <option value="">All</option>
                            <option value="concept">Concept</option>
                            <option value="alpha">Alpha</option>
                            <option value="beta">Beta</option>
                            <option value="production">Production</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Compensation</label>
                        <select id="compensation-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm min-h-[44px] px-3 font-medium">
                            <option value="">All</option>
                            <option value="paid">Paid</option>
                            <option value="free_access">Free Access</option>
                            <option value="equity">Equity</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center cursor-pointer min-h-[44px]">
                            <input type="checkbox" id="featured-filter" onchange="loadProducts()" class="rounded text-primary focus:ring-primary mr-2 w-5 h-5 sm:w-4 sm:h-4">
                            <span class="text-xs sm:text-sm font-bold text-gray-700">Featured Only</span>
                        </label>
                    </div>
                </div>
                <div class="hidden sm:flex justify-end mt-3 sm:mt-4">
                    <button onclick="resetProductFilters()" class="text-sm text-primary hover:text-primary/80 font-bold min-h-[44px] flex items-center px-3 py-2">
                        <i class="fas fa-undo mr-1"></i>Clear Filters
                    </button>
                </div>
            </div>

            <!-- Products Grid -->
            <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <!-- Products will be loaded here -->
                <div class="col-span-full text-center py-20">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p class="text-gray-600 font-medium">Loading products...</p>
                </div>
            </div>
        </div>

        <!-- Product Detail Tab -->
        <div id="product-detail-content" class="tab-content hidden">
            <div id="product-detail-container">
                <!-- Product detail will be loaded here -->
                <div class="text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p class="text-gray-600 font-medium">Loading product...</p>
                </div>
            </div>
        </div>

        <!-- Validators Tab -->
        <div id="validators-content" class="tab-content hidden">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-black text-gray-900">Professional Validators</h2>
            </div>
            
            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-100">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-black text-gray-900">Filters</h3>
                    <button onclick="resetValidatorFilters()" class="text-sm text-primary hover:text-primary/80 font-bold sm:hidden">
                        <i class="fas fa-undo mr-1"></i>Clear
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Expertise</label>
                        <select id="expertise-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm h-10 sm:h-auto font-medium">
                            <option value="">All</option>
                            <option value="SaaS">SaaS</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Design">Design</option>
                            <option value="B2B">B2B</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Fintech">Fintech</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Min. Rating</label>
                        <select id="rating-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm h-10 sm:h-auto font-medium">
                            <option value="">All</option>
                            <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
                            <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
                            <option value="3.5">3.5+ ⭐⭐⭐</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Availability</label>
                        <select id="availability-filter" onchange="loadValidators()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm h-10 sm:h-auto font-medium">
                            <option value="">All</option>
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                        </select>
                    </div>
                </div>
                <div class="hidden sm:flex justify-end mt-4">
                    <button onclick="resetValidatorFilters()" class="text-sm text-primary hover:text-primary/80 font-bold">
                        <i class="fas fa-undo mr-1"></i>Clear Filters
                    </button>
                </div>
            </div>

            <!-- Validators Grid -->
            <div id="validators-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <!-- Validators will be loaded here -->
                <div class="col-span-full text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p class="text-gray-600 font-medium">Loading validators...</p>
                </div>
            </div>
        </div>

        <!-- Chat Tab Content -->
        <div id="chat-content" class="tab-content hidden">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-black text-gray-900">Messages & Requests</h2>
            </div>

            <!-- Chat Interface -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Conversations List -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                        <h3 class="text-lg font-black text-gray-900 mb-4">Conversations</h3>
                        <div id="conversations-list" class="space-y-2 max-h-96 overflow-y-auto">
                            <!-- Conversations will be loaded here -->
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-comments text-3xl mb-2"></i>
                                <p class="font-medium">Loading conversations...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Area -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-lg p-4 h-96 flex flex-col border border-gray-100">
                        <div id="chat-header" class="border-b pb-3 mb-3 hidden">
                            <h4 class="text-lg font-black text-gray-900" id="chat-partner-name"></h4>
                            <p class="text-sm text-gray-600 font-medium" id="chat-partner-info"></p>
                        </div>

                        <div id="chat-messages" class="flex-1 overflow-y-auto mb-3 p-2 border rounded-lg bg-gray-50 min-h-0 hidden">
                            <!-- Messages will be loaded here -->
                        </div>

                        <div id="chat-input-area" class="hidden">
                            <div class="flex space-x-2">
                                <input type="text" id="chat-message-input" placeholder="Type your message..."
                                       class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary font-medium">
                                <button onclick="sendChatMessage()" class="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-bold">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div id="chat-empty-state" class="flex-1 flex items-center justify-center text-center">
                            <div>
                                <i class="fas fa-comments text-4xl text-gray-300 mb-4"></i>
                                <h4 class="text-lg font-bold text-gray-900 mb-2">Select a Conversation</h4>
                                <p class="text-gray-600 font-medium">Choose a conversation to start chatting</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Requests Section (for validators) -->
            <div id="chat-requests-section" class="mt-8 hidden">
                <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 class="text-xl font-black text-gray-900 mb-4">Pending Requests</h3>
                    <div id="pending-requests-list" class="space-y-4">
                        <!-- Pending requests will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- My Dashboard Tab (for authenticated users) -->
        <div id="my-dashboard-content" class="tab-content hidden">
            <h2 class="text-3xl font-black text-gray-900 mb-6">My Dashboard</h2>
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏆 Project Leaderboard - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#FF6154',
              secondary: '#FB651E',
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      .text-gradient {
        background: linear-gradient(135deg, #FF6154 0%, #FB651E 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(255, 97, 84, 0.2);
      }
      
      .nav-blur {
        backdrop-filter: blur(12px);
        background-color: rgba(255, 255, 255, 0.8);
      }
    </style>
</head>
<body class="bg-white min-h-screen">
    <!-- Navigation -->
    <nav class="nav-blur sticky top-0 z-50 border-b border-gray-200/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-black text-gradient">
                        <i class="fas fa-rocket mr-2"></i>
                        ValidAI Studio
                    </a>
                </div>
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-primary transition font-semibold">Home</a>
                    <a href="/leaderboard" class="text-primary font-bold">
                        <i class="fas fa-trophy mr-1 text-yellow-500"></i>Leaderboard
                    </a>
                    <a href="/marketplace" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-star mr-1 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-tag mr-1 text-green-500"></i>Pricing
                    </a>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" onclick="toggleMobileMenu()" class="p-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary hover:to-secondary hover:text-white transition-all duration-200 text-primary font-bold">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <a href="/" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>
                    <a href="/leaderboard" class="flex items-center px-3 py-2 text-primary font-bold">
                        <i class="fas fa-trophy mr-2 text-yellow-500"></i>Leaderboard
                    </a>
                    <a href="/marketplace" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-star mr-2 text-yellow-500"></i>Marketplace
                    </a>
                    <a href="/pricing" class="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition font-semibold">
                        <i class="fas fa-tag mr-2 text-green-500"></i>Pricing
                    </a>
                </div>
            </div>
        </div>
    </nav>
    
    <script>
      function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        if (menu && button) {
          const icon = button.querySelector('i');
          if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            if (icon) {
              icon.classList.remove('fa-bars');
              icon.classList.add('fa-times');
            }
          } else {
            menu.classList.add('hidden');
            if (icon) {
              icon.classList.remove('fa-times');
              icon.classList.add('fa-bars');
            }
          }
        }
      }
    </script>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-primary to-secondary text-white py-16 sm:py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-5xl sm:text-6xl font-black mb-4">
                🏆 Project Leaderboard
            </h1>
            <p class="text-xl sm:text-2xl opacity-90 mb-8 font-medium">
                Discover the highest-rated projects by our community
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Category Filter -->
        <div class="mb-8">
            <div class="flex flex-wrap justify-center gap-2 sm:gap-4">
                <button onclick="filterByCategory('all')" class="category-btn active px-3 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition text-sm sm:text-base">
                    All Projects
                </button>
                <button onclick="filterByCategory('SaaS')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base">
                    💻 SaaS
                </button>
                <button onclick="filterByCategory('Mobile')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base">
                    � Mobile
                </button>
                <button onclick="filterByCategory('Web3')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base">
                    🔗 Web3
                </button>
                <button onclick="filterByCategory('Healthcare')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base">
                    🏥 Healthcare
                </button>
                <button onclick="filterByCategory('Fintech')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base">
                    💰 Fintech
                </button>
                <button onclick="filterByCategory('E-commerce')" class="category-btn px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition text-sm sm:text-base">
                    � E-commerce
                </button>
            </div>
        </div>

        <!-- Leaderboard Table -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-4 sm:px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white">
                <h2 class="text-xl sm:text-2xl font-black">🏅 Project Rankings</h2>
            </div>
            
            <div id="leaderboard-loading" class="p-12 text-center">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-600 font-medium">Loading leaderboard...</p>
            </div>
            
            <div id="leaderboard-content" class="hidden">
                <div class="overflow-x-auto scrollbar-hide">
                    <table class="w-full min-w-[1000px]">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 sm:px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-900">Rank</th>
                                <th class="px-2 sm:px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-900">Project</th>
                                <th class="px-2 sm:px-4 py-4 text-center text-xs sm:text-sm font-bold text-gray-900">
                                    <div class="flex flex-col items-center">
                                        <i class="fas fa-trophy text-primary mr-1"></i>
                                        <span>Score</span>
                                    </div>
                                </th>
                                <th class="px-2 sm:px-4 py-4 text-center text-xs sm:text-sm font-bold text-gray-900">
                                    <div class="flex flex-col items-center">
                                        <i class="fas fa-star text-yellow-500 mr-1"></i>
                                        <span>Rating</span>
                                    </div>
                                </th>
                                <th class="px-2 sm:px-4 py-4 text-center text-xs sm:text-sm font-bold text-gray-900">
                                    <div class="flex flex-col items-center">
                                        <i class="fas fa-users text-blue-500 mr-1"></i>
                                        <span>Users</span>
                                    </div>
                                </th>
                                <th class="px-2 sm:px-4 py-4 text-center text-xs sm:text-sm font-bold text-gray-900">
                                    <div class="flex flex-col items-center">
                                        <i class="fas fa-dollar-sign text-green-500 mr-1"></i>
                                        <span>Revenue</span>
                                    </div>
                                </th>
                                <th class="px-2 sm:px-4 py-4 text-center text-xs sm:text-sm font-bold text-gray-900">
                                    <div class="flex flex-col items-center">
                                        <i class="fas fa-bullseye text-purple-500 mr-1"></i>
                                        <span>Goals</span>
                                    </div>
                                </th>
                                <th class="px-2 sm:px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-900 hidden md:table-cell">Created</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-tbody" class="divide-y divide-gray-200">
                            <!-- Projects will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="leaderboard-empty" class="hidden p-12 text-center">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No projects in this category</h3>
                <p class="text-gray-500">Be the first to publish a project in this category.</p>
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
            const tbody = document.getElementById('leaderboard-tbody');
            const filteredData = currentCategory === 'all' 
                ? leaderboardData 
                : leaderboardData.filter(project => project.category === currentCategory);
            
            if (filteredData.length === 0) {
                showEmpty();
                return;
            }
            
            tbody.innerHTML = filteredData.map(function(project, index) {
                const escapedTitle = project.title.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const escapedDescription = (project.description || '').substring(0, 100).replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const escapedCreator = (project.creator_name || 'Anonymous').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const escapedCategory = formatCategory(project.category);
                
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1);
                const score = project.leaderboard_score || 0;
                const breakdown = project.score_breakdown || { rating: 0, growth: 0, goals: 0 };
                const completedGoals = project.completed_goals || 0;
                const totalGoals = project.total_goals || 0;
                const goalsPercent = totalGoals > 0 ? (completedGoals / totalGoals * 100) : 0;
                const currentUsers = project.current_users || 0;
                const currentRevenue = project.current_revenue || 0;
                
                return '<tr class="hover:bg-gray-50 transition cursor-pointer" onclick="viewProjectDetail(' + project.id + ')">' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<span class="text-2xl font-bold">' + medal + '</span>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<div class="flex items-center space-x-3">' +
                            '<div>' +
                                '<div class="font-bold text-gray-900">' + escapedTitle + '</div>' +
                                '<div class="text-sm text-gray-500">' + escapedCategory + '</div>' +
                                '<div class="text-xs text-gray-400 mt-1">by ' + escapedCreator + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<div class="text-center">' +
                            '<div class="text-2xl sm:text-3xl font-black text-primary">' + score.toFixed(1) + '</div>' +
                            '<div class="text-xs text-gray-500 mt-2 space-y-1">' +
                                '<div class="flex items-center justify-center space-x-2 sm:space-x-3">' +
                                    '<span title="Rating Score (40%)" class="flex items-center text-xs">' +
                                        '<i class="fas fa-star text-yellow-400 mr-1"></i>' +
                                        '<span class="hidden sm:inline">' + (breakdown.rating ? breakdown.rating.toFixed(0) : 0) + '</span>' +
                                    '</span>' +
                                    '<span title="Growth Score (35%)" class="flex items-center text-xs">' +
                                        '<i class="fas fa-chart-line text-green-500 mr-1"></i>' +
                                        '<span class="hidden sm:inline">' + (breakdown.growth ? breakdown.growth.toFixed(0) : 0) + '</span>' +
                                    '</span>' +
                                    '<span title="Goals Score (25%)" class="flex items-center text-xs">' +
                                        '<i class="fas fa-check-circle text-blue-500 mr-1"></i>' +
                                        '<span class="hidden sm:inline">' + (breakdown.goals ? breakdown.goals.toFixed(0) : 0) + '</span>' +
                                    '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4">' +
                        '<div class="flex items-center justify-center">' +
                            '<span class="text-yellow-400 mr-1">★</span>' +
                            '<span class="font-semibold">' + (project.rating_average || 0).toFixed(1) + '</span>' +
                            '<span class="text-gray-400 text-sm ml-1">(' + (project.votes_count || 0) + ')</span>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<div class="font-semibold text-gray-900">' + formatNumber(currentUsers) + '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<div class="font-semibold text-green-600">$' + formatNumber(currentRevenue) + '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-center">' +
                        '<div class="flex flex-col items-center">' +
                            '<div class="w-full bg-gray-200 rounded-full h-2 mb-1">' +
                                '<div class="bg-blue-600 h-2 rounded-full" style="width: ' + goalsPercent + '%"></div>' +
                            '</div>' +
                            '<span class="text-xs text-gray-600">' + completedGoals + '/' + totalGoals + '</span>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-2 sm:px-6 py-4 text-gray-500 text-sm hidden md:table-cell">' +
                        formatDate(project.created_at) +
                    '</td>' +
                '</tr>';
            }).join('');
            
            showContent();
        }
        
        // Helper function to format numbers
        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }
        
        // Helper function to format dates
        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return diffDays + ' days ago';
            if (diffDays < 30) return Math.floor(diffDays / 7) + ' weeks ago';
            if (diffDays < 365) return Math.floor(diffDays / 30) + ' months ago';
            return Math.floor(diffDays / 365) + ' years ago';
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
                '<h2 class="text-2xl font-bold text-gray-900 mb-2">QR Code for Validators</h2>' +
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
    </script>
    
    <!-- Chart.js for dashboard visualizations -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- jsPDF for PDF export functionality -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>
    <script>
      // Ensure jsPDF is globally available
      if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
        window.jsPDF = window.jspdf.jsPDF;
      }
    </script>
</body>
</html>
  `);
});

export default app;
