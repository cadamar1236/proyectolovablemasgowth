import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { verify } from 'hono/jwt';
import { jsx } from 'hono/jsx';
import type { Bindings, ScheduledEvent } from './types';
import { getNotFoundPage, getVotePage } from './html-templates';
import { getDirectoryPage } from './marketplace-page';
import { getOnboardingPage } from './onboarding-page';
import { getCompetitionsPage } from './competitions-page';
import { getLeaderboardPage } from './leaderboard-page';
import { getAdminDashboard } from './admin-dashboard';
import { getCompetitionLeaderboard } from './competition-leaderboard';

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
import chatAgent from './api/chat-agent';
import dashboardPage from './dashboard-page';
import marketingAI from './api/marketing-ai';
import competitions from './api/competitions';
import admin from './api/admin';
import metricsData from './api/metrics-data';
import aiCMO from './api/ai-cmo';
import astarMessages from './api/astar-messages';
import team from './api/team';
import connector from './api/connector';
import { renderAICMOPage } from './ai-cmo-page';

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
app.route('/api/chat-agent', chatAgent);
app.route('/api/marketing-ai', marketingAI);
app.route('/api/competitions', competitions);
app.route('/api/admin', admin);
app.route('/api/metrics-data', metricsData);
app.route('/api/ai-cmo', aiCMO);
app.route('/api/astar-messages', astarMessages);
app.route('/api/team', team);
app.route('/api/connector', connector);

// Page Routes - Onboarding for new users
app.get('/onboarding', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  if (!authToken && !tokenInUrl) {
    return c.redirect('/');
  }

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, JWT_SECRET) as any;
    } catch (error) {
      return c.redirect('/');
    }
  }

  if (!payload) {
    return c.redirect('/');
  }

  const html = getOnboardingPage({
    userName: payload.userName || payload.name || payload.email || 'User',
    userEmail: payload.email,
    userRole: payload.role || 'founder',
    userId: payload.userId,
    token: tokenToVerify
  });

  return c.html(html);
});

// Page Routes - Use directory page as main dashboard
app.get('/dashboard', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, JWT_SECRET) as any;
    } catch (error) {
      // Invalid token, continue as guest
    }
  }

  // Allow viewing dashboard as guest
  if (!payload) {
    payload = { userName: 'Guest', email: '', userId: 0, role: 'guest' };
  }

  // Get user role from database if user is logged in
  let userRole = payload.role || 'founder';
  if (payload.userId) {
    const user = await c.env.DB.prepare(`
      SELECT role FROM users WHERE id = ?
    `).bind(payload.userId).first();
    
    if (user) {
      userRole = user.role || 'founder';
    }
  }

  const html = getDirectoryPage({
    userName: payload.userName || payload.name || payload.email || 'User',
    userAvatar: payload.avatar_url,
    userRole: userRole
  });

  return c.html(html);
});

// Old dashboard route removed - now using marketplace
// app.route('/dashboard', dashboardPage);

// Competitions page
app.get('/competitions', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, JWT_SECRET) as any;
    } catch (error) {
      // Invalid token, continue as guest
    }
  }

  // Allow viewing competitions as guest
  if (!payload) {
    payload = { userName: 'Guest', email: '', userId: 0, role: 'guest' };
  }

  const html = getCompetitionsPage({
    userName: payload.userName || payload.name || payload.email || 'Guest',
    userAvatar: payload.avatar_url,
    userRole: payload.role || 'guest'
  });

  return c.html(html);
});

// Team Management page
app.get('/team', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  if (!authToken && !tokenInUrl) {
    return c.redirect('/');
  }

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, JWT_SECRET) as any;
    } catch (error) {
      return c.redirect('/');
    }
  }

  if (!payload || !payload.userId) {
    return c.redirect('/');
  }

  // Get user data
  const user = await c.env.DB.prepare(`
    SELECT id, email, name, role, avatar_url FROM users WHERE id = ?
  `).bind(payload.userId).first();

  if (!user) {
    return c.redirect('/');
  }

  const { renderTeamManagementPage } = await import('./team-page');
  const html = renderTeamManagementPage(user);
  return c.html(html);
});

// Admin dashboard page (admin only)
app.get('/admin', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  if (!authToken && !tokenInUrl) {
    return c.redirect('/');
  }

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, JWT_SECRET) as any;
    } catch (error) {
      return c.redirect('/');
    }
  }

  // Check if user is admin
  if (!payload || !payload.userId) {
    return c.redirect('/');
  }

  const user = await c.env.DB.prepare(`
    SELECT id, email, name, role, avatar_url FROM users WHERE id = ?
  `).bind(payload.userId).first();

  if (!user || user.role !== 'admin') {
    return c.html('<html><body><h1>403 Forbidden</h1><p>Admin access required</p></body></html>', 403);
  }

  const html = getAdminDashboard({
    userName: user.name || payload.name || payload.email || 'Admin',
    userAvatar: user.avatar_url || payload.avatar_url,
    userRole: user.role
  });

  return c.html(html);
});

// Competition Leaderboard Page
app.get('/competitions/:id/leaderboard', async (c) => {
  try {
    const competitionId = c.req.param('id');

    // Get competition details
    const competition = await c.env.DB.prepare(`
      SELECT * FROM competitions WHERE id = ?
    `).bind(competitionId).first();

    if (!competition) {
      return c.html('<html><body><h1>404 Not Found</h1><p>Competition not found</p></body></html>', 404);
    }

    // Get participants ordered by registration date (first come, first serve ranking)
    const participants = await c.env.DB.prepare(`
      SELECT 
        cp.*,
        u.name,
        u.email,
        u.avatar_url,
        p.title as project_title,
        p.description as project_description
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN projects p ON cp.project_id = p.id
      WHERE cp.competition_id = ?
      ORDER BY cp.registration_date ASC
    `).bind(competitionId).all();

    const html = getCompetitionLeaderboard({
      competitionId,
      competitionTitle: competition.title,
      competitionDescription: competition.description,
      prizeAmount: competition.prize_amount,
      participants: participants.results || []
    });

    return c.html(html);
  } catch (error) {
    console.error('[LEADERBOARD] Error loading competition leaderboard:', error);
    return c.html('<html><body><h1>500 Error</h1><p>Failed to load leaderboard</p></body></html>', 500);
  }
});

// Marketplace page - Redirect to unified dashboard
app.get('/marketplace', async (c) => {
  return c.redirect('/dashboard');
});

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

// Frontend Routes - Redirect to Dashboard (Unified Directory)
app.get('/', async (c) => {
  // Always show landing page - no automatic redirect
  // Users can click "Go to Hub" button to access dashboard
  
  // Not authenticated - show simple landing page
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASTAR* - Connecting the brightest minds in the world</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        scroll-behavior: smooth;
      }
      
      body {
        font-family: 'Montserrat', system-ui, sans-serif;
        overflow-x: hidden;
        overflow-y: auto;
      }
      
      /* Cosmic Background */
      .cosmic-bg {
        background: linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #1a1a3e 100%);
        position: relative;
        min-height: 100vh;
      }
      
      /* Stars Animation */
      .stars {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      .stars::before,
      .stars::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(2px 2px at 20% 30%, #fff, transparent),
          radial-gradient(2px 2px at 60% 70%, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 50% 50%, #fff, transparent),
          radial-gradient(2px 2px at 80% 10%, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 90% 60%, #fff, transparent),
          radial-gradient(2px 2px at 30% 80%, rgba(255,255,255,0.7), transparent);
        background-repeat: repeat;
        background-size: 200% 200%;
        animation: twinkle 8s ease-in-out infinite;
      }
      
      @keyframes twinkle {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      
      /* Planet Styles */
      .planet {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.1);
      }
      
      .planet:hover {
        transform: scale(1.1);
        border-color: rgba(255,255,255,0.3);
      }
      
      .planet-founder {
        background: linear-gradient(135deg, #78909C 0%, #90A4AE 50%, #B0BEC5 100%);
        box-shadow: 0 0 60px rgba(120, 144, 156, 0.4), inset 0 0 40px rgba(255,255,255,0.1);
      }
      
      .planet-investor {
        background: linear-gradient(135deg, #26C6DA 0%, #00ACC1 50%, #0097A7 100%);
        box-shadow: 0 0 60px rgba(0, 172, 193, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
      }
      
      .planet-scout {
        background: linear-gradient(135deg, #AB47BC 0%, #8E24AA 50%, #7B1FA2 100%);
        box-shadow: 0 0 60px rgba(142, 36, 170, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
      }
      
      .planet-partner {
        background: linear-gradient(135deg, #EF5350 0%, #E53935 50%, #D32F2F 100%);
        box-shadow: 0 0 60px rgba(239, 83, 80, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
      }
      
      .planet-jobseeker {
        background: linear-gradient(135deg, #FFCA28 0%, #FFB300 50%, #FFA000 100%);
        box-shadow: 0 0 60px rgba(255, 179, 0, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
      }
      
      .planet-other {
        background: linear-gradient(135deg, #42A5F5 0%, #1E88E5 50%, #1565C0 100%);
        box-shadow: 0 0 60px rgba(66, 165, 245, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
      }
      
      /* Orbit Ring */
      .orbit-ring {
        position: absolute;
        border: 1px solid rgba(255, 184, 0, 0.3);
        border-radius: 50%;
        animation: rotate 20s linear infinite;
      }
      
      .planet-jobseeker .orbit-ring {
        width: 280px;
        height: 160px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotateX(75deg);
      }
      
      @keyframes rotate {
        from { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(0deg); }
        to { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(360deg); }
      }
      
      .planet-badge {
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
        border: 1px solid rgba(255,255,255,0.2);
      }
      
      .nav-link {
        transition: all 0.3s ease;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
      }
      
      .nav-link:hover {
        background: rgba(255,255,255,0.1);
      }
    </style>
</head>
<body class="cosmic-bg min-h-screen text-white">
    <!-- Stars Background -->
    <div class="stars"></div>

    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-black bg-opacity-50 backdrop-blur-sm border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex flex-col">
                    <span class="text-2xl font-bold">ASTAR*</span>
                    <span class="text-gray-400 text-xs hidden sm:inline">Connecting the brightest minds in the world</span>
                </div>
                
                <div class="flex items-center space-x-6">
                    <a href="#roles" class="nav-link text-white flex items-center space-x-2">
                        <span>🏠</span>
                        <span class="hidden sm:inline">Home</span>
                    </a>
                    <a href="/dashboard" onclick="event.preventDefault(); const token = document.cookie.match(/authToken=([^;]+)/)?.[1]; if (!token) { showAuthModal('login'); } else { window.location.href='/dashboard'; }" class="nav-link text-white flex items-center space-x-2 cursor-pointer">
                        <span>🎯</span>
                        <span class="hidden sm:inline">Hub</span>
                    </a>
                    <a href="/competitions" class="nav-link text-white flex items-center space-x-2">
                        <span>🏅</span>
                        <span class="hidden sm:inline">Competitions</span>
                    </a>
                    <a href="/leaderboard" class="nav-link text-white flex items-center space-x-2">
                        <span>🏆</span>
                        <span class="hidden sm:inline">Leaderboard</span>
                    </a>
                    <a href="/dashboard?tab=directory" class="nav-link text-white flex items-center space-x-2">
                        <span>🔥</span>
                        <span class="hidden sm:inline">Trending Startups</span>
                    </a>
                    <button onclick="showAuthModal('login')" class="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition">
                        Sign In
                    </button>
                    <button onclick="showAuthModal('register')" class="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition">
                        Launch Now
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section with Planets -->
    <main class="relative z-10 min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
        <div class="max-w-6xl w-full text-center" id="roles">
            <!-- Hero Title -->
            <h1 class="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                Welcome to the <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">ASTAR*</span> ecosystem
            </h1>
            
            <p class="text-lg md:text-xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed">
                ASTAR* is an AI superconnector helping early-stage founders get traction. We operate weekly progress-based competitions and monthly live pitch events, enabling discovery, credibility, and momentum for founders worldwide.
            </p>

            <p class="text-2xl md:text-3xl font-semibold text-gray-200 mb-4">
                Choose your trajectory 🚀
            </p>
            
            <p class="text-lg md:text-xl text-gray-400 mb-16 max-w-4xl mx-auto leading-relaxed">
                <span class="text-gray-300 font-medium">Which role defines your mission in the ASTAR* ecosystem?</span>
            </p>

            <!-- Planets Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto mb-12">
                <!-- Founder Planet -->
                <div class="flex flex-col items-center" onclick="selectRole('founder')">
                    <div class="planet planet-founder">
                        <span class="planet-badge">FOUNDER</span>
                    </div>
                    <h3 class="text-2xl font-bold mt-6 mb-3">FOUNDER</h3>
                    <p class="text-gray-300 text-center px-4">Building the next big thing</p>
                </div>

                <!-- Investor Planet -->
                <div class="flex flex-col items-center" onclick="selectRole('investor')">
                    <div class="planet planet-investor">
                        <span class="planet-badge">INVESTOR</span>
                    </div>
                    <h3 class="text-2xl font-bold mt-6 mb-3">INVESTOR</h3>
                    <p class="text-gray-300 text-center px-4">Fueling stellar growth</p>
                </div>

                <!-- Scout Planet -->
                <div class="flex flex-col items-center" onclick="selectRole('scout')">
                    <div class="planet planet-scout">
                        <span class="planet-badge">SCOUT</span>
                    </div>
                    <h3 class="text-2xl font-bold mt-6 mb-3">SCOUT</h3>
                    <p class="text-gray-300 text-center px-4">Finding hidden gems</p>
                </div>
            </div>

            <!-- Second Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                <!-- Partner Planet -->
                <div class="flex flex-col items-center" onclick="selectRole('partner')">
                    <div class="planet planet-partner">
                        <span class="planet-badge">PARTNER</span>
                    </div>
                    <h3 class="text-2xl font-bold mt-6 mb-3">PARTNER</h3>
                    <p class="text-gray-300 text-center px-4">Collaborate with ASTAR*</p>
                </div>

                <!-- Job Seeker Planet -->
                <div class="flex flex-col items-center" onclick="selectRole('job_seeker')">
                    <div class="planet planet-jobseeker">
                        <div class="orbit-ring"></div>
                        <span class="planet-badge">JOB SEEKER</span>
                    </div>
                    <h3 class="text-2xl font-bold mt-6 mb-3">JOB SEEKER</h3>
                    <p class="text-gray-300 text-center px-4">Join a promising startup</p>
                </div>

                <!-- Validator Planet -->
                <div class="flex flex-col items-center" onclick="selectRole('validator')">
                    <div class="planet planet-other">
                        <span class="planet-badge">VALIDATOR</span>
                    </div>
                    <h3 class="text-2xl font-bold mt-6 mb-3">VALIDATOR</h3>
                    <p class="text-gray-300 text-center px-4">Validate and vote on startups</p>
                </div>
            </div>
        </div>
    </main>

    <!-- Auth Modal (same as before) -->
    <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 hidden flex items-center justify-center px-4">
      <div class="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-white/10" id="modal-content">
        <!-- Modal content will be inserted here -->
      </div>
    </div>

    <script>
      function selectRole(role) {
        window.location.href = '/api/auth/google?role=' + role;
      }

      function showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        const modalContent = document.getElementById('modal-content');
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        if (mode === 'login') {
          const loginHtml = 
            '<div class="text-center">' +
              '<h2 class="text-2xl font-bold mb-4">Choose your role to Sign In</h2>' +
              '<p class="text-gray-400 mb-6">Sign in with Google to access your ASTAR* account</p>' +
              '<div class="space-y-3">' +
                '<button onclick="loginWithGoogle(\\\'founder\\\')" class="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center">' +
                  '<span class="mr-2">👨‍💻</span> Founder' +
                '</button>' +
                '<button onclick="loginWithGoogle(\\\'investor\\\')" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center">' +
                  '<span class="mr-2">💰</span> Investor' +
                '</button>' +
                '<button onclick="loginWithGoogle(\\\'scout\\\')" class="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center">' +
                  '<span class="mr-2">🔍</span> Scout' +
                '</button>' +
                '<button onclick="loginWithGoogle(\\\'partner\\\')" class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center">' +
                  '<span class="mr-2">🤝</span> Partner' +
                '</button>' +
                '<button onclick="loginWithGoogle(\\\'job_seeker\\\')" class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center">' +
                  '<span class="mr-2">💼</span> Job Seeker' +
                '</button>' +
                '<button onclick="loginWithGoogle(\\\'validator\\\')" class="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center">' +
                  '<span class="mr-2">✅</span> Validator' +
                '</button>' +
              '</div>' +
              '<button onclick="closeAuthModal()" class="mt-6 text-gray-400 hover:text-white">Close</button>' +
            '</div>';
          modalContent.innerHTML = loginHtml;
        } else if (mode === 'register') {
          showAuthModal('login');
        }
      }

      function closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      }

      function loginWithGoogle(role) {
        window.location.href = '/api/auth/google?role=' + role;
      }

      // Close modal on outside click
      document.getElementById('auth-modal').addEventListener('click', function(e) {
        if (e.target === this) {
          closeAuthModal();
        }
      });
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
              primary: '#4F9BFF',
              secondary: '#FF6B9D',
              accent: '#FFB84F',
              purple: '#9D7BFF',
              cosmic: {
                dark: '#0a0a1a',
                darker: '#050510',
                purple: '#1a1a3e',
                blue: '#0d1b2a'
              }
            },
            fontFamily: {
              sans: ['Inter', 'system-ui', 'sans-serif'],
              display: ['Space Grotesk', 'system-ui', 'sans-serif'],
            }
          }
        }
      }
    </script>
    <style>
      * {
        font-family: 'Inter', system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      h1, h2, h3, h4, .font-display {
        font-family: 'Space Grotesk', system-ui, sans-serif;
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      /* Cosmic Background */
      .cosmic-bg {
        background: linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #1a1a3e 100%);
        position: relative;
        overflow-x: hidden;
      }
      
      /* Stars Animation */
      .stars {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }
      
      .stars::before,
      .stars::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(2px 2px at 20px 30px, #fff, transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent),
          radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 230px 80px, #fff, transparent),
          radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 370px 200px, #fff, transparent),
          radial-gradient(2px 2px at 450px 60px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 520px 180px, #fff, transparent),
          radial-gradient(2px 2px at 600px 100px, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 680px 250px, #fff, transparent),
          radial-gradient(2px 2px at 750px 30px, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 830px 170px, #fff, transparent),
          radial-gradient(2px 2px at 900px 220px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 970px 90px, #fff, transparent);
        background-repeat: repeat;
        background-size: 1000px 300px;
        animation: twinkle 8s ease-in-out infinite;
      }
      
      .stars::after {
        background-image: 
          radial-gradient(1px 1px at 50px 100px, #fff, transparent),
          radial-gradient(2px 2px at 120px 200px, rgba(255,255,255,0.6), transparent),
          radial-gradient(1px 1px at 200px 50px, #fff, transparent),
          radial-gradient(2px 2px at 280px 180px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 350px 130px, #fff, transparent),
          radial-gradient(2px 2px at 420px 80px, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 500px 240px, #fff, transparent),
          radial-gradient(2px 2px at 580px 160px, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 660px 40px, #fff, transparent),
          radial-gradient(2px 2px at 740px 280px, rgba(255,255,255,0.6), transparent);
        background-size: 800px 350px;
        animation: twinkle 12s ease-in-out infinite reverse;
      }
      
      @keyframes twinkle {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      
      /* Nebula Effect */
      .nebula {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.4;
        animation: nebula-float 20s ease-in-out infinite;
      }
      
      .nebula-1 {
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
        top: -200px;
        right: -100px;
        animation-delay: 0s;
      }
      
      .nebula-2 {
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
        bottom: 10%;
        left: -150px;
        animation-delay: -5s;
      }
      
      .nebula-3 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%);
        top: 40%;
        right: 10%;
        animation-delay: -10s;
      }
      
      @keyframes nebula-float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(30px, -30px) scale(1.05); }
        50% { transform: translate(-20px, 20px) scale(0.95); }
        75% { transform: translate(20px, 30px) scale(1.02); }
      }
      
      /* Glow Effects */
      .glow-purple {
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.2);
      }
      
      .glow-cyan {
        box-shadow: 0 0 40px rgba(6, 182, 212, 0.3), 0 0 80px rgba(6, 182, 212, 0.2);
      }
      
      .text-glow {
        text-shadow: 0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3);
      }
      
      /* Gradient Text */
      .text-gradient-cosmic {
        background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #F59E0B 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .text-gradient-purple {
        background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      /* Button Styles */
      .btn-cosmic {
        background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      
      .btn-cosmic::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .btn-cosmic:hover::before {
        left: 100%;
      }
      
      .btn-cosmic:hover {
        transform: translateY(-3px);
        box-shadow: 0 20px 40px -10px rgba(139, 92, 246, 0.5);
      }
      
      .btn-outline-cosmic {
        border: 2px solid rgba(139, 92, 246, 0.5);
        background: rgba(139, 92, 246, 0.1);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      
      .btn-outline-cosmic:hover {
        border-color: #8B5CF6;
        background: rgba(139, 92, 246, 0.2);
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
      }
      
      /* Card Styles */
      .card-cosmic {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .card-cosmic:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateY(-8px);
        box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
      }
      
      /* Navigation */
      .nav-cosmic {
        backdrop-filter: blur(20px);
        background: rgba(10, 10, 26, 0.8);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      /* Floating Animation */
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(2deg); }
      }
      
      .float-animation {
        animation: float 6s ease-in-out infinite;
      }
      
      /* Planet/Orbit Animation */
      @keyframes orbit {
        0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
      }
      
      .orbit-animation {
        animation: orbit 30s linear infinite;
      }
      
      /* Pulse Animation */
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
        50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(6, 182, 212, 0.4); }
      }
      
      .pulse-glow {
        animation: pulse-glow 3s ease-in-out infinite;
      }
      
      /* Shooting Star */
      @keyframes shooting-star {
        0% { transform: translateX(0) translateY(0); opacity: 1; }
        70% { opacity: 1; }
        100% { transform: translateX(300px) translateY(300px); opacity: 0; }
      }
      
      .shooting-star {
        position: absolute;
        width: 100px;
        height: 2px;
        background: linear-gradient(90deg, #fff, transparent);
        animation: shooting-star 3s ease-in-out infinite;
      }
      
      /* Stats Counter */
      .stat-number {
        font-variant-numeric: tabular-nums;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .nebula {
          opacity: 0.2;
        }
        .nebula-1 { width: 300px; height: 300px; }
        .nebula-2 { width: 250px; height: 250px; }
        .nebula-3 { width: 200px; height: 200px; }
      }
    </style>
</head>
<body class="cosmic-bg min-h-screen text-white">
    <!-- Cosmic Background Effects -->
    <div class="stars"></div>
    <div class="nebula nebula-1"></div>
    <div class="nebula nebula-2"></div>
    <div class="nebula nebula-3"></div>
    
    <!-- Shooting Stars -->
    <div class="shooting-star" style="top: 10%; left: 20%; animation-delay: 0s;"></div>
    <div class="shooting-star" style="top: 30%; left: 60%; animation-delay: 2s;"></div>
    <div class="shooting-star" style="top: 50%; left: 10%; animation-delay: 4s;"></div>

    <!-- Navigation -->
    <nav class="nav-cosmic sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 relative">
                <div class="flex items-center">
                    <a href="/" class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-purple">
                            <span class="text-white font-bold text-xl">✦</span>
                        </div>
                        <span class="text-2xl font-display font-bold text-gradient-cosmic">
                            ASTAR* Labs
                        </span>
                    </a>
                </div>
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#journey" class="text-gray-300 hover:text-white transition font-medium">Journey</a>
                    <a href="#features" class="text-gray-300 hover:text-white transition font-medium">Features</a>
                    <a href="/marketplace" class="text-gray-300 hover:text-white transition font-medium flex items-center">
                        <i class="fas fa-rocket mr-2 text-primary"></i>Hub
                    </a>
                    <a href="/leaderboard" class="text-gray-300 hover:text-white transition font-medium flex items-center">
                        <i class="fas fa-trophy mr-2 text-accent"></i>Leaderboard
                    </a>
                    <div class="nav-auth-buttons flex items-center space-x-3 ml-4">
                        <button onclick="showAuthModal('login')" class="text-gray-300 hover:text-white transition font-medium px-4 py-2">
                            Sign In
                        </button>
                        <button onclick="showAuthModal('register')" class="btn-cosmic text-white px-6 py-2.5 rounded-xl font-semibold">
                            Launch Now
                        </button>
                    </div>
                </div>
                
                <!-- Mobile menu toggle -->
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-button" class="cursor-pointer p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white">
                        <i class="fas fa-bars text-xl" id="menu-icon-bars"></i>
                        <i class="fas fa-times text-xl hidden" id="menu-icon-close"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div class="hidden md:hidden bg-cosmic-dark/95 backdrop-blur-xl border-t border-white/10" id="mobile-menu-container">
            <div class="max-w-7xl mx-auto px-4 py-6 space-y-2">
                <a href="#journey" class="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition rounded-xl font-medium">
                    <i class="fas fa-route mr-3 text-lg text-primary"></i>Journey
                </a>
                <a href="#features" class="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition rounded-xl font-medium">
                    <i class="fas fa-star mr-3 text-lg text-secondary"></i>Features
                </a>
                <a href="/marketplace" class="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition rounded-xl font-medium">
                    <i class="fas fa-rocket mr-3 text-lg text-primary"></i>Hub
                </a>
                <a href="/leaderboard" class="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition rounded-xl font-medium">
                    <i class="fas fa-trophy mr-3 text-accent text-lg"></i>Leaderboard
                </a>
                <div class="border-t border-white/10 pt-4 mt-4 space-y-2">
                    <button onclick="showAuthModal('login');" class="w-full flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition rounded-xl font-medium text-left">
                        <i class="fas fa-sign-in-alt mr-3 text-lg"></i>Sign In
                    </button>
                    <button onclick="showAuthModal('register');" class="w-full flex items-center px-4 py-3 btn-cosmic text-white rounded-xl font-bold text-left justify-center">
                        <i class="fas fa-rocket mr-3 text-lg"></i>Launch Now
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

    <!-- Hero Section - ASTAR* Simple Design -->
    <section class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 py-20 sm:py-32 sm:px-6 lg:px-8 relative z-10 text-center">
            <!-- Large ASTAR* Logo -->
            <h1 class="font-display text-8xl sm:text-9xl md:text-[12rem] font-bold mb-12 leading-none tracking-tight">
                <span class="text-white">ASTAR</span><span class="text-primary text-glow">*</span>
            </h1>
            
            <!-- Tagline -->
            <p class="text-2xl sm:text-3xl md:text-4xl mb-16 text-gray-300 font-medium">
                Connecting the brightest minds in the universe
            </p>
            
            <!-- CTA Button -->
            <button onclick="showAuthModal('register')" class="btn-cosmic text-white px-12 py-6 rounded-full font-bold text-xl inline-flex items-center justify-center group mb-8 pulse-glow">
                <span class="mr-2">Sign Up</span>
                <span class="text-2xl">⭐</span>
            </button>
            
            <!-- Scroll indicator -->
            <div class="mt-20">
                <div class="inline-flex flex-col items-center text-gray-400">
                    <i class="fas fa-chevron-down text-2xl mb-2 animate-bounce"></i>
                    <span class="text-sm">Or scroll to explore</span>
                </div>
            </div>
        </div>
        
        <!-- Floating Elements -->
        <div class="absolute top-1/4 left-10 w-4 h-4 rounded-full bg-primary float-animation opacity-60" style="animation-delay: 0s;"></div>
        <div class="absolute top-1/3 right-20 w-3 h-3 rounded-full bg-secondary float-animation opacity-50" style="animation-delay: 1s;"></div>
        <div class="absolute bottom-1/4 left-1/4 w-5 h-5 rounded-full bg-accent float-animation opacity-40" style="animation-delay: 2s;"></div>
        <div class="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-white float-animation opacity-60" style="animation-delay: 3s;"></div>
    </section>

    <!-- User Type Selection Section -->
    <section class="relative py-32 border-t border-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
                    Welcome to the ASTAR* ecosystem!
                </h2>
                <h3 class="font-display text-3xl font-bold text-white mb-6">
                    Choose your trajectory 🚀
                </h3>
                <p class="text-xl text-gray-400 max-w-3xl mx-auto">
                    We make thoughtful introductions between startup founders, customers, investors, partners and talent. Which role defines your mission in the ASTAR* ecosystem?
                </p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <!-- FOUNDER -->
                <button onclick="loginWithGoogle('founder')" class="group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #B8C6DB 0%, #A8B8D0 100%);">
                    <div class="relative z-10 flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                            <span class="text-5xl">⚪</span>
                        </div>
                        <div class="px-6 py-2 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span class="text-white text-sm font-bold uppercase tracking-wide">Founder</span>
                        </div>
                        <h3 class="font-display font-bold text-gray-900 text-xl mb-2">FOUNDER</h3>
                        <p class="text-gray-700 text-sm">Building the next big thing in the universe</p>
                    </div>
                </button>
                
                <!-- INVESTOR -->
                <button onclick="loginWithGoogle('investor')" class="group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #5DE0E6 0%, #4DD4DA 100%);">
                    <div class="relative z-10 flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                            <span class="text-5xl">🌐</span>
                        </div>
                        <div class="px-6 py-2 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span class="text-white text-sm font-bold uppercase tracking-wide">Investor</span>
                        </div>
                        <h3 class="font-display font-bold text-gray-900 text-xl mb-2">INVESTOR</h3>
                        <p class="text-gray-700 text-sm">Fueling stellar growth with capital</p>
                    </div>
                </button>
                
                <!-- SCOUT -->
                <button onclick="loginWithGoogle('scout')" class="group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #A78BFA 0%, #9B7DF5 100%);">
                    <div class="relative z-10 flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                            <span class="text-5xl">🟣</span>
                        </div>
                        <div class="px-6 py-2 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span class="text-white text-sm font-bold uppercase tracking-wide">Scout</span>
                        </div>
                        <h3 class="font-display font-bold text-gray-900 text-xl mb-2">SCOUT</h3>
                        <p class="text-gray-700 text-sm">Finding hidden gems and opportunities</p>
                    </div>
                </button>
                
                <!-- PARTNER -->
                <button onclick="loginWithGoogle('partner')" class="group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #FF6B9D 0%, #FF5A8F 100%);">
                    <div class="relative z-10 flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                            <span class="text-5xl">🔴</span>
                        </div>
                        <div class="px-6 py-2 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span class="text-white text-sm font-bold uppercase tracking-wide">Partner</span>
                        </div>
                        <h3 class="font-display font-bold text-gray-900 text-xl mb-2">PARTNER</h3>
                        <p class="text-gray-700 text-sm">I want to partner/sponsor/collab with ASTAR*</p>
                    </div>
                </button>
                
                <!-- JOB SEEKER -->
                <button onclick="loginWithGoogle('job_seeker')" class="group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #FFB84F 0%, #FFA940 100%);">
                    <div class="relative z-10 flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                            <span class="text-5xl">🟠</span>
                        </div>
                        <div class="px-6 py-2 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span class="text-white text-sm font-bold uppercase tracking-wide">Job Seeker</span>
                        </div>
                        <h3 class="font-display font-bold text-gray-900 text-xl mb-2">JOB SEEKER</h3>
                        <p class="text-gray-700 text-sm">Looking for a job at a promising startup</p>
                    </div>
                </button>
                
                <!-- OTHER -->
                <button onclick="loginWithGoogle('other')" class="group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #4A5568 0%, #3A4558 100%);">
                    <div class="relative z-10 flex flex-col items-center text-center">
                        <div class="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                            <span class="text-5xl">🔵</span>
                        </div>
                        <div class="px-6 py-2 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span class="text-white text-sm font-bold uppercase tracking-wide">Other</span>
                        </div>
                        <h3 class="font-display font-bold text-gray-100 text-xl mb-2">OTHER</h3>
                        <p class="text-gray-300 text-sm">I am curious about the ASTAR* ecosystem</p>
                    </div>
                </button>
            </div>
        </div>
    </section>

    <!-- Journey Section -->
    <section id="journey" class="relative py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-20">
                <span class="text-primary font-semibold text-sm tracking-wider uppercase mb-4 block">Your Cosmic Journey</span>
                <h2 class="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
                    From Idea to <span class="text-gradient-cosmic">Orbit</span>
                </h2>
                <p class="text-xl text-gray-400 max-w-2xl mx-auto">
                    Navigate through the startup universe with our proven 5-step launch sequence
                </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div class="card-cosmic rounded-2xl p-8 text-center group">
                    <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center pulse-glow">
                        <span class="text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 class="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition">Ignition</h3>
                    <p class="text-gray-400 mb-4 text-sm">Share your idea and target market details</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-clock mr-1"></i>5 minutes
                    </div>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 text-center group">
                    <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center pulse-glow" style="animation-delay: 0.5s;">
                        <span class="text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 class="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition">AI Analysis</h3>
                    <p class="text-gray-400 mb-4 text-sm">Our AI scans the market universe for opportunities</p>
                    <div class="text-secondary font-semibold text-sm">
                        <i class="fas fa-robot mr-1"></i>Instant
                    </div>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 text-center group">
                    <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center pulse-glow" style="animation-delay: 1s;">
                        <span class="text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 class="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition">Validation</h3>
                    <p class="text-gray-400 mb-4 text-sm">Expert validators provide stellar feedback</p>
                    <div class="text-accent font-semibold text-sm">
                        <i class="fas fa-users mr-1"></i>24-48h
                    </div>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 text-center group">
                    <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center pulse-glow" style="animation-delay: 1.5s;">
                        <span class="text-2xl font-bold text-white">4</span>
                    </div>
                    <h3 class="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition">Beta Testing</h3>
                    <p class="text-gray-400 mb-4 text-sm">Real users test your product in the wild</p>
                    <div class="text-green-400 font-semibold text-sm">
                        <i class="fas fa-vial mr-1"></i>1 week
                    </div>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 text-center group">
                    <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center pulse-glow" style="animation-delay: 2s;">
                        <span class="text-2xl font-bold text-white">5</span>
                    </div>
                    <h3 class="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition">Orbit</h3>
                    <p class="text-gray-400 mb-4 text-sm">Launch with data-driven confidence</p>
                    <div class="text-primary font-semibold text-sm">
                        <i class="fas fa-chart-line mr-1"></i>Dashboard
                    </div>
                </div>
            </div>
            
            <!-- CTA Card -->
            <div class="mt-20 card-cosmic rounded-3xl p-10 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
                <div class="relative z-10 flex flex-col md:flex-row items-center justify-between">
                    <div class="mb-8 md:mb-0 text-center md:text-left">
                        <h3 class="font-display text-3xl font-bold text-white mb-3 flex items-center justify-center md:justify-start">
                            <span class="text-4xl mr-3">✦</span>
                            ASTAR Hub
                        </h3>
                        <p class="text-xl text-gray-300">Your mission control for startup success</p>
                    </div>
                    <a href="/marketplace" class="btn-cosmic text-white px-10 py-5 rounded-2xl font-bold text-lg inline-flex items-center">
                        Enter Hub <i class="fas fa-arrow-right ml-3"></i>
                    </a>
                </div>
            </div>
        </div>
    </section>

        <!-- Validation Form (Hidden by default) - Cosmic Theme -->
        <div id="validation-form-section" class="hidden fixed inset-0 z-50 overflow-y-auto" style="background: rgba(5, 5, 16, 0.95); backdrop-filter: blur(10px);">
            <div class="min-h-screen flex items-center justify-center p-4">
                <div class="max-w-2xl w-full">
                    <!-- Close Button -->
                    <button onclick="hideValidationForm()" class="absolute top-6 right-6 text-gray-400 hover:text-white transition">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                    
                    <!-- Step Indicator -->
                    <div class="flex justify-center items-center mb-8 space-x-3 flex-wrap">
                        <div class="flex items-center">
                            <div id="step-indicator-1" class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
                            <span class="ml-2 font-medium text-white text-sm">Pitch</span>
                        </div>
                        <div class="w-8 h-0.5 bg-white/20"></div>
                        <div class="flex items-center">
                            <div id="step-indicator-2" class="w-10 h-10 rounded-full bg-white/10 text-gray-400 flex items-center justify-center font-bold text-sm">2</div>
                            <span class="ml-2 font-medium text-gray-400 text-sm">Analysis</span>
                        </div>
                        <div class="w-8 h-0.5 bg-white/20"></div>
                        <div class="flex items-center">
                            <div id="step-indicator-3" class="w-10 h-10 rounded-full bg-white/10 text-gray-400 flex items-center justify-center font-bold text-sm">3</div>
                            <span class="ml-2 font-medium text-gray-400 text-sm">Hub</span>
                        </div>
                        <div class="w-8 h-0.5 bg-white/20"></div>
                        <div class="flex items-center">
                            <div id="step-indicator-4" class="w-10 h-10 rounded-full bg-white/10 text-gray-400 flex items-center justify-center font-bold text-sm">4</div>
                            <span class="ml-2 font-medium text-gray-400 text-sm">Launch</span>
                        </div>
                    </div>

                    <!-- Step 1: Pitch Form -->
                    <div id="quick-pitch-step-1" class="card-cosmic rounded-3xl p-8">
                        <div class="text-center mb-8">
                            <div class="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-glow">
                                <i class="fas fa-rocket text-white text-2xl"></i>
                            </div>
                            <h2 class="font-display text-3xl font-bold text-white mb-3">Launch Your Idea</h2>
                            <p class="text-gray-400">Get instant AI analysis and join the ASTAR Hub</p>
                            <div class="inline-flex items-center mt-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                                <i class="fas fa-sparkles text-green-400 mr-2"></i>
                                <span class="text-green-400 font-medium text-sm">Free AI Analysis</span>
                            </div>
                        </div>
                        
                        <form id="quick-pitch-form" class="space-y-5" onsubmit="event.preventDefault(); submitQuickPitchForm();">
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">
                                    <i class="fas fa-lightbulb text-primary mr-2"></i>What's your startup idea?
                                </label>
                                <textarea id="pitch-idea" required rows="3"
                                          class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                                          placeholder="A mobile app that connects freelance designers with small businesses..."></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">
                                    <i class="fas fa-crosshairs text-secondary mr-2"></i>What problem does it solve?
                                </label>
                                <textarea id="pitch-problem" required rows="3"
                                          class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                                          placeholder="Small businesses struggle to find affordable, quality design services..."></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">
                                    <i class="fas fa-users text-accent mr-2"></i>Who is your target market?
                                </label>
                                <input id="pitch-market" type="text" required
                                       class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                                       placeholder="Small businesses with 10-50 employees in the US" />
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">
                                    <i class="fas fa-dollar-sign text-green-400 mr-2"></i>What's your pricing model?
                                </label>
                                <select id="pitch-pricing-model" required
                                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none cursor-pointer">
                                    <option value="" class="bg-cosmic-dark">Select pricing model...</option>
                                    <option value="free" class="bg-cosmic-dark">Free</option>
                                    <option value="freemium" class="bg-cosmic-dark">Freemium (Free + Paid tiers)</option>
                                    <option value="one_time" class="bg-cosmic-dark">One-time Payment</option>
                                    <option value="subscription_monthly" class="bg-cosmic-dark">Monthly Subscription</option>
                                    <option value="subscription_yearly" class="bg-cosmic-dark">Yearly Subscription</option>
                                    <option value="usage_based" class="bg-cosmic-dark">Usage-based / Pay-as-you-go</option>
                                    <option value="enterprise" class="bg-cosmic-dark">Enterprise / Custom Pricing</option>
                                </select>
                            </div>
                            
                            <button type="submit"
                                    class="w-full btn-cosmic text-white px-8 py-5 rounded-xl font-bold text-lg">
                                <i class="fas fa-rocket mr-2"></i>Launch Analysis
                            </button>
                        </form>
                    </div>

                    <!-- Step 2: AI Analysis -->
                    <div id="quick-pitch-step-2" class="hidden card-cosmic rounded-3xl p-8">
                        <div class="text-center">
                            <div class="relative w-32 h-32 mx-auto mb-6">
                                <div class="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin" style="animation-duration: 3s;"></div>
                                <div class="absolute inset-2 rounded-full bg-cosmic-dark flex items-center justify-center">
                                    <i class="fas fa-brain text-primary text-4xl"></i>
                                </div>
                            </div>
                            <h3 class="font-display text-2xl font-bold text-white mb-3">Analyzing Your Idea...</h3>
                            <p class="text-gray-400">Our AI is scanning the market universe for opportunities</p>
                            
                            <div class="flex justify-center space-x-2 mt-8">
                                <div class="w-3 h-3 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
                                <div class="w-3 h-3 bg-secondary rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
                                <div class="w-3 h-3 bg-accent rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Results -->
                    <div id="quick-pitch-step-3" class="hidden card-cosmic rounded-3xl p-8">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                                <i class="fas fa-check text-white text-3xl"></i>
                            </div>
                            <h3 class="font-display text-2xl font-bold text-white mb-2">Analysis Complete!</h3>
                            <p class="text-gray-400">Your project is now live in the ASTAR Hub</p>
                        </div>
                        
                        <div id="analysis-results-container" class="space-y-4 text-white">
                            <!-- AI analysis results will be inserted here -->
                        </div>

                        <div class="mt-8 text-center">
                            <p class="text-primary font-medium mb-4">
                                <i class="fas fa-rocket mr-2"></i>
                                Launching in <span id="redirect-countdown">5</span> seconds...
                            </p>
                            <button onclick="redirectToDashboard()" class="btn-cosmic text-white px-8 py-4 rounded-xl font-bold">
                                Go to Mission Control
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <!-- Features Section -->
    <section id="features" class="relative py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-20">
                <span class="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">Superpowers</span>
                <h2 class="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
                    Your <span class="text-gradient-cosmic">Cosmic Toolkit</span>
                </h2>
                <p class="text-xl text-gray-400 max-w-2xl mx-auto">
                    Everything you need to navigate the startup universe
                </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="card-cosmic rounded-2xl p-8 group">
                    <div class="w-14 h-14 mb-6 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition">
                        <i class="fas fa-brain text-primary text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-3">AI Analysis Engine</h3>
                    <p class="text-gray-400 leading-relaxed">Advanced AI that analyzes market trends, competitors, and opportunities in real-time</p>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 group">
                    <div class="w-14 h-14 mb-6 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition">
                        <i class="fas fa-users text-secondary text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-3">Expert Validators</h3>
                    <p class="text-gray-400 leading-relaxed">Connect with 500+ industry experts who provide actionable feedback</p>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 group">
                    <div class="w-14 h-14 mb-6 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition">
                        <i class="fas fa-chart-line text-accent text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-3">Growth Dashboard</h3>
                    <p class="text-gray-400 leading-relaxed">Track your metrics, goals, and progress with beautiful visualizations</p>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 group">
                    <div class="w-14 h-14 mb-6 rounded-2xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition">
                        <i class="fas fa-comments text-green-400 text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-3">Direct Messaging</h3>
                    <p class="text-gray-400 leading-relaxed">Communicate directly with validators and mentors in real-time</p>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 group">
                    <div class="w-14 h-14 mb-6 rounded-2xl bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition">
                        <i class="fas fa-robot text-pink-400 text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-3">ASTAR Agent</h3>
                    <p class="text-gray-400 leading-relaxed">Get personalized marketing strategies powered by AI</p>
                </div>
                
                <div class="card-cosmic rounded-2xl p-8 group">
                    <div class="w-14 h-14 mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition">
                        <i class="fas fa-trophy text-blue-400 text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-3">Leaderboard</h3>
                    <p class="text-gray-400 leading-relaxed">Compete with other startups and climb the rankings</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-32">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div class="card-cosmic rounded-3xl p-12 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>
                <div class="relative z-10">
                    <h2 class="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to Launch?
                    </h2>
                    <p class="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                        Join thousands of founders who are already building the future with ASTAR* Labs
                    </p>
                    <div class="flex flex-col sm:flex-row justify-center gap-4">
                        <button onclick="showValidationForm()" class="btn-cosmic text-white px-10 py-5 rounded-2xl font-bold text-lg inline-flex items-center justify-center">
                            <i class="fas fa-rocket mr-3"></i>
                            Start Your Journey
                        </button>
                        <a href="/marketplace" class="btn-outline-cosmic text-white px-10 py-5 rounded-2xl font-bold text-lg inline-flex items-center justify-center">
                            <i class="fas fa-compass mr-3"></i>
                            Explore Hub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Auth Modal - Cosmic Theme -->
    <div id="auth-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(5, 5, 16, 0.95); backdrop-filter: blur(10px);">
        <div class="card-cosmic rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white z-10 transition">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div id="auth-modal-content" class="p-8">
                <!-- Auth form will be inserted here -->
            </div>
        </div>
    </div>

    <!-- Footer - Cosmic Theme -->
    <footer class="relative border-t border-white/5 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div class="md:col-span-1">
                    <div class="flex items-center space-x-3 mb-6">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <span class="text-white font-bold text-xl">✦</span>
                        </div>
                        <span class="text-xl font-display font-bold text-gradient-cosmic">ASTAR* Labs</span>
                    </div>
                    <p class="text-gray-400 leading-relaxed">Launching startups to the stars with AI-powered validation and expert networks.</p>
                </div>
                <div>
                    <h4 class="font-display font-bold mb-6 text-white">Product</h4>
                    <ul class="space-y-4 text-gray-400">
                        <li><a href="#journey" class="hover:text-primary transition">Journey</a></li>
                        <li><a href="#features" class="hover:text-primary transition">Features</a></li>
                        <li><a href="/marketplace" class="hover:text-primary transition">ASTAR Hub</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-display font-bold mb-6 text-white">Resources</h4>
                    <ul class="space-y-4 text-gray-400">
                        <li><a href="#" class="hover:text-primary transition">Blog</a></li>
                        <li><a href="#" class="hover:text-primary transition">Success Stories</a></li>
                        <li><a href="#" class="hover:text-primary transition">Documentation</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-display font-bold mb-6 text-white">Company</h4>
                    <ul class="space-y-4 text-gray-400">
                        <li><a href="#" class="hover:text-primary transition">About</a></li>
                        <li><a href="#" class="hover:text-primary transition">Careers</a></li>
                        <li><a href="#" class="hover:text-primary transition">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p class="text-gray-500 text-sm">&copy; 2025 ASTAR* Labs. All rights reserved.</p>
                <div class="flex gap-6 mt-4 md:mt-0">
                    <a href="#" class="text-gray-400 hover:text-primary transition">
                        <i class="fab fa-twitter text-xl"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-primary transition">
                        <i class="fab fa-linkedin text-xl"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-primary transition">
                        <i class="fab fa-github text-xl"></i>
                    </a>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script src="/static/astar-notifications.js"></script>
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

      // Show validation form - Cosmic Modal
      function showValidationForm() {
        const section = document.getElementById('validation-form-section');
        if (section) {
          section.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      }
      
      // Hide validation form
      function hideValidationForm() {
        const section = document.getElementById('validation-form-section');
        if (section) {
          section.classList.add('hidden');
          document.body.style.overflow = '';
          // Reset form
          document.getElementById('quick-pitch-step-1')?.classList.remove('hidden');
          document.getElementById('quick-pitch-step-2')?.classList.add('hidden');
          document.getElementById('quick-pitch-step-3')?.classList.add('hidden');
          updateStepIndicator(1);
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

      // Show auth modal - Cosmic Theme with User Type Selection
      function showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        const modalContent = document.getElementById('auth-modal-content');

        if (!modal || !modalContent) return;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (mode === 'login') {
          const loginHtml = '<div class="text-center max-w-2xl mx-auto">' +
            '<div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center pulse-glow">' +
              '<span class="text-white text-3xl">✦</span>' +
            '</div>' +
            '<h2 class="font-display text-3xl font-bold text-white mb-2">Welcome to the ASTAR* ecosystem!</h2>' +
            '<h3 class="font-display text-2xl font-bold text-white mb-4">Choose your trajectory 🚀</h3>' +
            '<p class="text-gray-400 mb-8 text-sm">We make thoughtful introductions between startup founders, customers, investors, partners and talent. Which role defines your mission in the ASTAR* ecosystem?</p>' +
            '<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">' +
              '<!-- FOUNDER -->' +
              '<button onclick="loginWithGoogle(\\\'founder\\\')" class="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #B8C6DB 0%, #A8B8D0 100%);">' +
                '<div class="relative z-10 flex flex-col items-center">' +
                  '<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">' +
                    '<span class="text-4xl">⚪</span>' +
                  '</div>' +
                  '<div class="w-16 h-6 bg-gray-700 rounded-full flex items-center justify-center mb-3">' +
                    '<span class="text-white text-xs font-bold uppercase tracking-wide">Founder</span>' +
                  '</div>' +
                  '<h3 class="font-bold text-gray-900 text-sm mb-1">FOUNDER</h3>' +
                  '<p class="text-gray-700 text-xs">Building the next big thing in the universe</p>' +
                '</div>' +
              '</button>' +
              '<!-- INVESTOR -->' +
              '<button onclick="loginWithGoogle(\\\'investor\\\')" class="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #5DE0E6 0%, #4DD4DA 100%);">' +
                '<div class="relative z-10 flex flex-col items-center">' +
                  '<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">' +
                    '<span class="text-4xl">🌐</span>' +
                  '</div>' +
                  '<div class="w-16 h-6 bg-gray-700 rounded-full flex items-center justify-center mb-3">' +
                    '<span class="text-white text-xs font-bold uppercase tracking-wide">Investor</span>' +
                  '</div>' +
                  '<h3 class="font-bold text-gray-900 text-sm mb-1">INVESTOR</h3>' +
                  '<p class="text-gray-700 text-xs">Fueling stellar growth with capital</p>' +
                '</div>' +
              '</button>' +
              '<!-- SCOUT -->' +
              '<button onclick="loginWithGoogle(\\\'scout\\\')" class="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #A78BFA 0%, #9B7DF5 100%);">' +
                '<div class="relative z-10 flex flex-col items-center">' +
                  '<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">' +
                    '<span class="text-4xl">🟣</span>' +
                  '</div>' +
                  '<div class="w-16 h-6 bg-gray-700 rounded-full flex items-center justify-center mb-3">' +
                    '<span class="text-white text-xs font-bold uppercase tracking-wide">Scout</span>' +
                  '</div>' +
                  '<h3 class="font-bold text-gray-900 text-sm mb-1">SCOUT</h3>' +
                  '<p class="text-gray-700 text-xs">Finding hidden gems and opportunities</p>' +
                '</div>' +
              '</button>' +
              '<!-- PARTNER -->' +
              '<button onclick="loginWithGoogle(\\\'partner\\\')" class="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #FF6B9D 0%, #FF5A8F 100%);">' +
                '<div class="relative z-10 flex flex-col items-center">' +
                  '<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">' +
                    '<span class="text-4xl">🔴</span>' +
                  '</div>' +
                  '<div class="w-16 h-6 bg-gray-700 rounded-full flex items-center justify-center mb-3">' +
                    '<span class="text-white text-xs font-bold uppercase tracking-wide">Partner</span>' +
                  '</div>' +
                  '<h3 class="font-bold text-gray-900 text-sm mb-1">PARTNER</h3>' +
                  '<p class="text-gray-700 text-xs">I want to partner/sponsor/collab with ASTAR*</p>' +
                '</div>' +
              '</button>' +
              '<!-- JOB SEEKER -->' +
              '<button onclick="loginWithGoogle(\\\'job_seeker\\\')" class="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #FFB84F 0%, #FFA940 100%);">' +
                '<div class="relative z-10 flex flex-col items-center">' +
                  '<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">' +
                    '<span class="text-4xl">🟠</span>' +
                  '</div>' +
                  '<div class="w-16 h-6 bg-gray-700 rounded-full flex items-center justify-center mb-3">' +
                    '<span class="text-white text-xs font-bold uppercase tracking-wide">Job Seeker</span>' +
                  '</div>' +
                  '<h3 class="font-bold text-gray-900 text-sm mb-1">JOB SEEKER</h3>' +
                  '<p class="text-gray-700 text-xs">Looking for a job at a promising startup</p>' +
                '</div>' +
              '</button>' +
              '<!-- OTHER -->' +
              '<button onclick="loginWithGoogle(\\\'other\\\')" class="group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 cursor-pointer" style="background: linear-gradient(135deg, #4A5568 0%, #3A4558 100%);">' +
                '<div class="relative z-10 flex flex-col items-center">' +
                  '<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">' +
                    '<span class="text-4xl">🔵</span>' +
                  '</div>' +
                  '<div class="w-16 h-6 bg-gray-700 rounded-full flex items-center justify-center mb-3">' +
                    '<span class="text-white text-xs font-bold uppercase tracking-wide">Other</span>' +
                  '</div>' +
                  '<h3 class="font-bold text-gray-100 text-sm mb-1">OTHER</h3>' +
                  '<p class="text-gray-300 text-xs">I am curious about the ASTAR* ecosystem</p>' +
                '</div>' +
              '</button>' +
            '</div>' +
          '</div>';
          modalContent.innerHTML = loginHtml;
        } else if (mode === 'register') {
          // Same as login for now
          showAuthModal('login');
        }
      }

      // Close auth modal
      function closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
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
            // Redirect to dashboard
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
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
            // Redirect to dashboard
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          } else {
            alert('Error: ' + (data.error || 'No se pudo crear la cuenta'));
          }
        } catch (error) {
          console.error('Registration error:', error);
          alert('Error al crear la cuenta. Inténtalo de nuevo.');
        }
      }

      // Update authentication UI - Cosmic Theme
      function updateAuthUI() {
        const authToken = localStorage.getItem('authToken');
        const navButtons = document.querySelectorAll('.nav-auth-buttons');

        if (authToken) {
          // User is logged in - show hub and logout options
          const logoutHtml = '<a href="/marketplace" class="text-gray-300 hover:text-white transition font-medium mr-4">' +
            '<i class="fas fa-rocket mr-2 text-primary"></i>Hub' +
            '</a>' +
            '<button onclick="logout()" class="text-gray-300 hover:text-white transition font-medium">' +
            '<i class="fas fa-sign-out-alt mr-2"></i>Sign Out' +
            '</button>';
          navButtons.forEach(btn => {
            btn.innerHTML = logoutHtml;
          });
        } else {
          // User is not logged in - show login/register options
          const loginHtml = '<button onclick="showAuthModal(\\\'login\\\')" class="text-gray-300 hover:text-white transition font-medium px-4 py-2">' +
            'Sign In' +
            '</button>' +
            '<button onclick="showAuthModal(\\\'register\\\')" class="btn-cosmic text-white px-6 py-2.5 rounded-xl font-semibold">' +
            'Launch Now' +
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



      // Check for product parameter and redirect to directory, and handle OAuth callback
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

      // Upload Product - Redirect to Hub
      function showUploadProductForm() {
        window.location.href = '/marketplace';
      }

      // Update step indicator - Cosmic Theme
      function updateStepIndicator(activeStep) {
        for (let i = 1; i <= 4; i++) {
          const indicator = document.getElementById('step-indicator-' + i);
          if (!indicator) continue;

          if (i < activeStep) {
            indicator.className = 'w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm';
            indicator.innerHTML = '<i class="fas fa-check"></i>';
          } else if (i === activeStep) {
            indicator.className = 'w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm';
            indicator.textContent = i;
          } else {
            indicator.className = 'w-10 h-10 rounded-full bg-white/10 text-gray-400 flex items-center justify-center font-bold text-sm';
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

// Directory Page - ASTAR Hub Dashboard for Startups
app.get('/marketplace', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  
  if (!authToken) {
    return c.redirect('/api/auth/google');
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || JWT_SECRET) as any;
    const userName = payload.userName || payload.email || 'Usuario';
    const userAvatar = payload.avatar_url;
    const userRole = payload.role || 'founder';
    
    const html = getDirectoryPage(userName, userAvatar, userRole);
    return c.html(html);
  } catch (error) {
    return c.redirect('/api/auth/google');
  }
});

// Leaderboard Page
app.get('/leaderboard', async (c) => {
  try {
    const authCookie = c.req.header('cookie')
      ?.split('; ')
      .find((c) => c.startsWith('auth='))
      ?.split('=')[1];

    let userName = 'Guest';
    let userAvatar = undefined;
    let userRole = 'guest';

    if (authCookie) {
      try {
        const decoded = await verify(authCookie, JWT_SECRET);
        if (decoded && decoded.email) {
          const db = c.env.DB;
          const user = await db
            .prepare('SELECT name, avatar, role FROM users WHERE email = ?')
            .bind(decoded.email)
            .first();

          if (user) {
            userName = user.name || decoded.email;
            userAvatar = user.avatar;
            userRole = user.role || 'guest';
          }
        }
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    }

    const html = getLeaderboardPage({
      userName,
      userAvatar,
      userRole
    });

    return c.html(html);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return c.html('<div class="flex items-center justify-center min-h-screen"><div class="text-center"><h1 class="text-2xl font-bold text-gray-800 mb-4">Error loading leaderboard</h1><p class="text-gray-600">Please try again later.</p></div></div>');
  }
});

export default app;
