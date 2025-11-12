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
    <title>Astar Labs - Product Discovery & Validation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366F1',
              accent: '#818CF8',
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
                    <div class="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-gray-900">Astar Labs</span>
                    <span class="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded">Beta</span>
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
                    <a href="/marketplace" class="flex items-center px-4 py-2 text-sm font-medium text-primary bg-indigo-50 rounded-lg hover:bg-indigo-100">
                        <i class="fas fa-store mr-2"></i>Marketplace
                    </a>
                    <a href="/leaderboard" class="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-trophy mr-2"></i>Leaderboard
                    </a>
                    <a href="/dashboard" class="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-chart-line mr-2"></i>Dashboard
                    </a>
                    <button onclick="showAuthModal('login')" class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        Log In
                    </button>
                    <button onclick="showAuthModal('register')" class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-700 rounded-lg">
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Discover Validated Products</h1>
            <p class="text-lg text-gray-600">Support innovative products and watch them grow in our leaderboard</p>
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
            <a href="/marketplace" class="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition">
                <i class="fas fa-upload mr-2"></i>Upload Product
            </a>
        </div>
    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4" id="auth-modal-content">
            <!-- Modal content will be populated by JavaScript -->
        </div>
    </div>

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
    <title>Leaderboard - Astar Labs</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366F1',
              accent: '#818CF8',
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
                    <div class="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-gray-900">Astar Labs</span>
                </div>
                
                <div class="flex items-center space-x-1">
                    <a href="/" class="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-info-circle mr-2"></i>How it works
                    </a>
                    <a href="/marketplace" class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-store mr-2"></i>Marketplace
                    </a>
                    <a href="/leaderboard" class="flex items-center px-4 py-2 text-sm font-medium text-primary bg-indigo-50 rounded-lg hover:bg-indigo-100">
                        <i class="fas fa-trophy mr-2"></i>Leaderboard
                    </a>
                    <a href="/dashboard" class="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-chart-line mr-2"></i>Dashboard
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

// Dashboard Page
app.get('/dashboard', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Astar Labs</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366F1',
              accent: '#818CF8',
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
                    <div class="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-gray-900">Astar Labs</span>
                </div>
                
                <div class="flex items-center space-x-1">
                    <a href="/" class="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>
                    <a href="/marketplace" class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-store mr-2"></i>Marketplace
                    </a>
                    <a href="/leaderboard" class="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50">
                        <i class="fas fa-trophy mr-2"></i>Leaderboard
                    </a>
                    <a href="/dashboard" class="flex items-center px-4 py-2 text-sm font-medium text-primary bg-indigo-50 rounded-lg hover:bg-indigo-100">
                        <i class="fas fa-chart-line mr-2"></i>Dashboard
                    </a>
                    <div id="user-menu-container"></div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <!-- Auth Required Message (shown if not logged in) -->
        <div id="auth-required" class="hidden bg-white border border-gray-200 rounded-xl p-12 text-center">
            <i class="fas fa-lock text-6xl text-gray-300 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p class="text-gray-600 mb-6">You need to be logged in to view your dashboard</p>
            <button onclick="window.location.href='/'" class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-indigo-700">
                Go to Home
            </button>
        </div>

        <!-- Dashboard Content (shown when logged in) -->
        <div id="dashboard-content" class="hidden">
            <div class="mb-8">
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">📊 My Dashboard</h1>
                <p class="text-lg text-gray-600">Track your product's growth and goals</p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm text-gray-500">Current Users</p>
                        <i class="fas fa-users text-blue-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900" id="stat-users">-</p>
                    <p class="text-xs text-green-600 mt-1" id="stat-users-change">-</p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm text-gray-500">Monthly Revenue</p>
                        <i class="fas fa-dollar-sign text-green-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900" id="stat-revenue">-</p>
                    <p class="text-xs text-green-600 mt-1" id="stat-revenue-change">-</p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm text-gray-500">Product Likes</p>
                        <i class="fas fa-heart text-red-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900" id="stat-likes">-</p>
                    <p class="text-xs text-gray-500 mt-1">Community support</p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm text-gray-500">Goals Completed</p>
                        <i class="fas fa-check-circle text-purple-500"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900" id="stat-goals">-</p>
                    <p class="text-xs text-gray-500 mt-1" id="stat-goals-total">-</p>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Growth Chart -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Growth Metrics</h3>
                    <canvas id="growthChart" height="250"></canvas>
                </div>

                <!-- Goals Progress -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-900">Active Goals</h3>
                        <button onclick="showAddGoalModal()" class="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-indigo-700">
                            <i class="fas fa-plus mr-1"></i>Add Goal
                        </button>
                    </div>
                    <div id="goals-list" class="space-y-3">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                            <p>Loading goals...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Weekly Updates -->
            <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-900">Weekly Progress Updates</h3>
                    <button onclick="showUpdateModal()" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-indigo-700">
                        <i class="fas fa-plus mr-1"></i>Add Update
                    </button>
                </div>
                <div id="updates-list">
                    <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Loading updates...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals will be added by JavaScript -->
    <div id="modal-container"></div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        let currentUser = null;
        let authToken = null;
        let growthChart = null;

        document.addEventListener('DOMContentLoaded', function() {
            checkDashboardAuth();
        });

        async function checkDashboardAuth() {
            authToken = localStorage.getItem('authToken');
            if (!authToken) {
                document.getElementById('auth-required').classList.remove('hidden');
                return;
            }

            try {
                const response = await axios.get('/api/auth/me', {
                    headers: { Authorization: \`Bearer \${authToken}\` }
                });
                currentUser = response.data.user;
                
                document.getElementById('dashboard-content').classList.remove('hidden');
                loadDashboardData();
                
            } catch (error) {
                console.error('Auth error:', error);
                document.getElementById('auth-required').classList.remove('hidden');
                localStorage.removeItem('authToken');
            }
        }

        async function loadDashboardData() {
            try {
                // Load user's products
                const productsRes = await axios.get('/api/marketplace/my-products', {
                    headers: { Authorization: \`Bearer \${authToken}\` }
                });
                const products = productsRes.data.products || [];
                
                if (products.length > 0) {
                    const product = products[0]; // Use first product
                    
                    // Update stats
                    document.getElementById('stat-users').textContent = formatNumber(product.current_users || 0);
                    document.getElementById('stat-revenue').textContent = '$' + formatNumber(product.current_revenue || 0);
                    document.getElementById('stat-likes').textContent = product.votes_count || 0;
                }
                
                // Load goals
                await loadGoals();
                
                // Load updates
                await loadUpdates();
                
                // Load chart data
                loadGrowthChart();
                
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }

        async function loadGoals() {
            try {
                const response = await axios.get('/api/dashboard/goals', {
                    headers: { Authorization: \`Bearer \${authToken}\` }
                });
                const goals = response.data.goals || [];
                
                const completed = goals.filter(g => g.status === 'completed').length;
                document.getElementById('stat-goals').textContent = completed;
                document.getElementById('stat-goals-total').textContent = \`of \${goals.length} total\`;
                
                const container = document.getElementById('goals-list');
                if (goals.length === 0) {
                    container.innerHTML = '<p class="text-gray-400 text-center py-4">No goals yet. Add your first goal!</p>';
                    return;
                }
                
                container.innerHTML = goals.map(goal => \`
                    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div class="flex items-center space-x-3 flex-1">
                            <input type="checkbox" 
                                   \${goal.status === 'completed' ? 'checked' : ''}
                                   onchange="toggleGoal(\${goal.id})"
                                   class="w-5 h-5 text-primary rounded focus:ring-primary">
                            <span class="\${goal.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}">\${escapeHtml(goal.description)}</span>
                        </div>
                        <button onclick="deleteGoal(\${goal.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Error loading goals:', error);
            }
        }

        async function loadUpdates() {
            try {
                const response = await axios.get('/api/dashboard/weekly-updates', {
                    headers: { Authorization: \`Bearer \${authToken}\` }
                });
                const updates = response.data.updates || [];
                
                const container = document.getElementById('updates-list');
                if (updates.length === 0) {
                    container.innerHTML = '<p class="text-gray-400 text-center py-4">No updates yet</p>';
                    return;
                }
                
                container.innerHTML = updates.map(update => \`
                    <div class="border-b border-gray-200 last:border-0 py-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-semibold text-gray-900">Week of \${update.week}</span>
                            <span class="text-xs text-gray-500">\${new Date(update.created_at).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-gray-600">Progress update recorded</p>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Error loading updates:', error);
            }
        }

        function loadGrowthChart() {
            const ctx = document.getElementById('growthChart');
            if (!ctx) return;
            
            // Sample data - replace with real data from API
            growthChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Users',
                        data: [10, 25, 45, 70],
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Revenue',
                        data: [100, 250, 450, 800],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        async function toggleGoal(goalId) {
            try {
                await axios.patch(\`/api/dashboard/goals/\${goalId}/toggle\`, {}, {
                    headers: { Authorization: \`Bearer \${authToken}\` }
                });
                await loadGoals();
                await loadDashboardData(); // Refresh stats
            } catch (error) {
                console.error('Error toggling goal:', error);
            }
        }

        async function deleteGoal(goalId) {
            if (!confirm('Are you sure you want to delete this goal?')) return;
            
            try {
                await axios.delete(\`/api/dashboard/goals/\${goalId}\`, {
                    headers: { Authorization: \`Bearer \${authToken}\` }
                });
                await loadGoals();
            } catch (error) {
                console.error('Error deleting goal:', error);
            }
        }

        function showAddGoalModal() {
            const modal = \`
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Add New Goal</h3>
                        <form onsubmit="submitGoal(event)">
                            <textarea 
                                id="goal-description"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                                rows="3"
                                placeholder="Describe your goal..."
                                required
                            ></textarea>
                            <div class="flex space-x-3">
                                <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                                    Add Goal
                                </button>
                                <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            \`;
            document.getElementById('modal-container').innerHTML = modal;
        }

        async function submitGoal(event) {
            event.preventDefault();
            const description = document.getElementById('goal-description').value;
            
            try {
                await axios.post('/api/dashboard/goals', 
                    { description },
                    { headers: { Authorization: \`Bearer \${authToken}\` }}
                );
                closeModal();
                await loadGoals();
            } catch (error) {
                console.error('Error adding goal:', error);
                alert('Failed to add goal');
            }
        }

        function showUpdateModal() {
            alert('Weekly update feature coming soon!');
        }

        function closeModal() {
            document.getElementById('modal-container').innerHTML = '';
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
