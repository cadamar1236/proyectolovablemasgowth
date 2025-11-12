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

// Frontend Routes - Simple Landing Page
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polymarket - Product Discovery & Validation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#1E40AF',
              accent: '#3B82F6',
            }
          }
        }
      }
    </script>
    <style>
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      
      .card-product {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        transition: all 0.2s ease;
      }
      
      .card-product:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-color: #D1D5DB;
      }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"></path>
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-gray-900">Polymarket</span>
                    <span class="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">US</span>
                </div>
                
                <div class="hidden md:flex flex-1 max-w-md mx-8">
                    <div class="relative w-full">
                        <input type="text" 
                               placeholder="Search products" 
                               class="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                               id="search-input">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                
                <div class="flex items-center space-x-1">
                    <a href="/" class="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-info-circle mr-2"></i>How it works
                    </a>
                    <a href="/marketplace" class="flex items-center px-4 py-2 text-sm font-medium text-primary bg-blue-50 rounded-lg hover:bg-blue-100">
                        <i class="fas fa-store mr-2"></i>Marketplace
                    </a>
                    <a href="/leaderboard" class="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-trophy mr-2"></i>Leaderboard
                    </a>
                    <button onclick="showAuthModal('login')" class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        Log In
                    </button>
                    <button onclick="showAuthModal('register')" class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-lg">
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Discover Products</h1>
            <p class="text-lg text-gray-600">Vote for your favorite products and see them rise in the leaderboard</p>
        </div>

        <div class="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
            <button class="px-4 py-2 text-sm font-medium bg-white text-primary border-2 border-primary rounded-lg whitespace-nowrap">All</button>
            <button class="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 whitespace-nowrap">Trending</button>
            <button class="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 whitespace-nowrap">Most Liked</button>
            <button class="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 whitespace-nowrap">New</button>
        </div>

        <div id="products-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <div class="text-center py-12 col-span-full">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Loading products...</p>
            </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-8 text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Have a product to share?</h2>
            <p class="text-gray-600 mb-4">Upload your product and get validation from the community</p>
            <button onclick="showUploadProductForm()" class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-700">
                <i class="fas fa-upload mr-2"></i>Upload Product
            </button>
        </div>
    </div>

    <div id="auth-modal" class="hidden"></div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="/static/marketplace.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            loadProducts();
        });

        async function loadProducts() {
            try {
                const response = await axios.get('/api/marketplace/products');
                const products = response.data.products || [];
                
                const container = document.getElementById('products-container');
                if (products.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center py-12 col-span-full">
                            <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">No products yet. Be the first to upload one!</p>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = products.map(product => \`
                    <div class="card-product p-5 cursor-pointer" onclick="window.location.href='/marketplace?product=\${product.id}'">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 text-lg mb-1">\${escapeHtml(product.title)}</h3>
                                <p class="text-sm text-gray-500 mb-2">\${escapeHtml(product.category || 'General')}</p>
                            </div>
                        </div>
                        
                        <p class="text-gray-600 text-sm mb-4 line-clamp-2">\${escapeHtml(product.description || '')}</p>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2 text-sm text-gray-500">
                                <i class="fas fa-heart text-red-500"></i>
                                <span class="font-medium">\${product.votes_count || 0} likes</span>
                            </div>
                            
                            <button onclick="event.stopPropagation(); likeProduct(\${product.id})" 
                                    class="px-4 py-2 rounded-lg font-medium text-sm transition \${product.user_vote ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white'}">
                                <i class="fas fa-heart mr-1"></i>
                                \${product.user_vote ? 'Liked' : 'Like'}
                            </button>
                        </div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Error loading products:', error);
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
  `);
});

// Leaderboard Page
app.get('/leaderboard', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leaderboard - Polymarket</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#1E40AF',
              accent: '#3B82F6',
            }
          }
        }
      }
    </script>
    <style>
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"></path>
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-gray-900">Polymarket</span>
                </div>
                
                <div class="flex items-center space-x-1">
                    <a href="/" class="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-info-circle mr-2"></i>How it works
                    </a>
                    <a href="/marketplace" class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-store mr-2"></i>Marketplace
                    </a>
                    <a href="/leaderboard" class="flex items-center px-4 py-2 text-sm font-medium text-primary bg-blue-50 rounded-lg hover:bg-blue-100">
                        <i class="fas fa-trophy mr-2"></i>Leaderboard
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
            <p class="text-lg text-gray-600">Top products ranked by community votes and performance metrics</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Total Products</p>
                        <p class="text-3xl font-bold text-gray-900" id="total-products">-</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-box text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Total Likes</p>
                        <p class="text-3xl font-bold text-gray-900" id="total-likes">-</p>
                    </div>
                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-heart text-red-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Active Users</p>
                        <p class="text-3xl font-bold text-gray-900" id="active-users">-</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-users text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Leaderboard Table -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Score</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Likes</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Users</th>
                            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body">
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center">
                                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                                <p class="text-gray-500">Loading leaderboard...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            loadLeaderboard();
        });

        async function loadLeaderboard() {
            try {
                const response = await axios.get('/api/projects/leaderboard');
                const projects = response.data.projects || [];
                
                // Update stats
                document.getElementById('total-products').textContent = projects.length;
                const totalLikes = projects.reduce((sum, p) => sum + (p.votes_count || 0), 0);
                document.getElementById('total-likes').textContent = totalLikes;
                const totalUsers = projects.reduce((sum, p) => sum + (p.current_users || 0), 0);
                document.getElementById('active-users').textContent = formatNumber(totalUsers);
                
                const tbody = document.getElementById('leaderboard-body');
                if (projects.length === 0) {
                    tbody.innerHTML = \`
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center">
                                <i class="fas fa-trophy text-4xl text-gray-400 mb-4"></i>
                                <p class="text-gray-500">No products on the leaderboard yet</p>
                            </td>
                        </tr>
                    \`;
                    return;
                }
                
                tbody.innerHTML = projects.map((project, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : \`#\${index + 1}\`;
                    const score = project.leaderboard_score || 0;
                    
                    return \`
                        <tr class="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onclick="window.location.href='/marketplace?product=\${project.id}'">
                            <td class="px-6 py-4">
                                <span class="text-2xl font-bold">\${medal}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="font-semibold text-gray-900">\${escapeHtml(project.title)}</div>
                                <div class="text-sm text-gray-500">\${escapeHtml(project.category || 'General')}</div>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <div class="text-2xl font-bold text-primary">\${score.toFixed(1)}</div>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <div class="flex items-center justify-center space-x-2">
                                    <i class="fas fa-heart text-red-500"></i>
                                    <span class="font-semibold">\${project.votes_count || 0}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <div class="font-semibold text-gray-900">\${formatNumber(project.current_users || 0)}</div>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <div class="font-semibold text-green-600">$\${formatNumber(project.current_revenue || 0)}</div>
                            </td>
                        </tr>
                    \`;
                }).join('');
                
            } catch (error) {
                console.error('Error loading leaderboard:', error);
            }
        }

        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
  `);
});

export default app;
