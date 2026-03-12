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
import { getEventsPage } from './events-page';
import { getLeaderboardPage } from './leaderboard-page';
import { getAdminDashboard } from './admin-dashboard';
import { getCompetitionLeaderboard } from './competition-leaderboard';
import { getPitchDeckPage } from './pitch-deck-page';
import { PricingPage } from './pricing-page';

// JWT Secret for token verification
// JWT_SECRET is now loaded from environment variable c.env.JWT_SECRET

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
import crm from './api/crm';
import traction from './api/traction';
import events from './api/events';
import checkout from './api/checkout';

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
app.route('/api/crm', crm);
app.route('/api/traction', traction);
app.route('/api/events', events);
app.route('/checkout', checkout);
app.route('/api/checkout', checkout);

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
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
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
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
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

// Standalone Pitch Deck page
app.get('/pitch', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
    } catch (error) {
      // Invalid token, continue as guest
    }
  }

  // Allow viewing as guest
  if (!payload) {
    payload = { userName: 'Guest', email: '', userId: 0, role: 'guest' };
  }

  let userRole = payload.role || 'founder';
  if (payload.userId) {
    const user = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    if (user) userRole = user.role || 'founder';
  }

  const html = getPitchDeckPage({
    userName: payload.userName || payload.name || payload.email || 'User',
    userAvatar: payload.avatar_url,
    userRole: userRole,
    isGuest: !tokenToVerify || payload.userId === 0
  });

  return c.html(html);
});

// Competitions page
app.get('/competitions', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
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

// Events page
app.get('/events', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
    } catch (error) {
      // Invalid token, continue as guest
    }
  }

  // Allow viewing events as guest
  if (!payload) {
    payload = { userName: 'Guest', email: '', userId: 0, role: 'guest' };
  }

  // Get user role from database if user is logged in
  let userRole = payload.role || 'guest';
  if (payload.userId) {
    const user = await c.env.DB.prepare(`
      SELECT role FROM users WHERE id = ?
    `).bind(payload.userId).first();
    
    if (user) {
      userRole = user.role || 'guest';
    }
  }

  const html = getEventsPage({
    userName: payload.userName || payload.name || payload.email || 'Guest',
    userAvatar: payload.avatar_url,
    userRole: userRole
  });

  return c.html(html);
});

// Pricing page (LTD plans)
app.get('/pricing', async (c) => {
  const html = PricingPage();
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
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
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
      payload = await verify(tokenToVerify, c.env.JWT_SECRET) as any;
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
    const payload = await verify(authToken, c.env.JWT_SECRET) as any;
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

// Frontend Routes - Landing page
app.get('/', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASTAR* — Your AI Cofounder</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', sans-serif; }
    body { background: #0a0a0a; color: #f0f0f0; }
    .btn-primary { background: linear-gradient(135deg, #7c3aed, #6d28d9); transition: all 0.2s ease; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(124,58,237,0.4); }
    .btn-whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); transition: all 0.2s ease; }
    .btn-whatsapp:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(37,211,102,0.3); }
    .glow { box-shadow: 0 0 40px rgba(139,92,246,0.25); }
    .border-subtle { border: 1px solid rgba(255,255,255,0.08); }
    .fade-in { animation: fadeIn 0.7s ease both; }
    @keyframes fadeIn { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: none; } }
    #auth-modal { backdrop-filter: blur(8px); }
    input:focus { outline: none; border-color: #7c3aed !important; }

    /* Chat preview */
    .chat-preview { background: #111; border: 1px solid rgba(139,92,246,0.2); border-radius: 20px; overflow: hidden; }
    .chat-msg-astro { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2); border-radius: 16px 16px 16px 4px; }
    .chat-msg-user { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px 16px 4px 16px; }
    .chat-fade { background: linear-gradient(to bottom, transparent 0%, #0a0a0a 100%); }
    .typing-dot { animation: typing 1.2s infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%,80%,100% { opacity:0.2; transform: scale(0.8); } 40% { opacity:1; transform: scale(1); } }
  </style>
</head>
<body class="min-h-screen">

  <!-- Nav -->
  <nav class="fixed top-0 w-full z-50 border-b border-white/5 bg-black/70 backdrop-blur-md">
    <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <span class="text-xl font-bold tracking-tight">ASTAR<span class="text-purple-400">*</span></span>
      <div class="flex items-center gap-4" id="nav-actions">
        <a href="#pricing" class="text-sm text-gray-400 hover:text-white transition">Pricing</a>
        <button onclick="openModal('login')" class="text-sm text-gray-400 hover:text-white transition">Sign in</button>
        <button onclick="openModal('register')" class="btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white">Get started</button>
      </div>
    </div>
  </nav>

  <!-- Hero + Chat Preview -->
  <section class="max-w-5xl mx-auto px-6 pt-32 pb-8 fade-in">
    <div class="text-center mb-10">
      <span class="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);color:#a78bfa;">⚡ AI Cofounder · Early Access</span>
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
        Your AI Cofounder<br>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">built to help you raise</span>
      </h1>
      <p class="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
        Astro learns your startup, connects you with VCs and helps you grow week after week.
      </p>
    </div>

    <!-- Chat Preview Window -->
    <div class="relative max-w-2xl mx-auto">
      <div class="chat-preview glow">
        <!-- Chat header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-white/5" style="background:#0d0d0d;">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background:linear-gradient(135deg,#7c3aed,#a855f7);">⚡</div>
          <div>
            <div class="text-sm font-semibold text-white">Astro</div>
            <div class="text-xs text-purple-400">AI Cofounder · ASTAR*</div>
          </div>
          <div class="ml-auto flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500/60"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500/60"></div>
            <div class="w-3 h-3 rounded-full bg-green-500/60"></div>
          </div>
        </div>

        <!-- Chat messages -->
        <div class="p-5 space-y-4" style="min-height:320px;">
          <div class="flex gap-3">
            <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#7c3aed,#a855f7);">⚡</div>
            <div class="chat-msg-astro px-4 py-3 max-w-[85%]">
              <p class="text-xs font-semibold text-purple-400 mb-1">Astro</p>
              <p class="text-sm text-gray-200">Hey! I'm Astro, your AI Cofounder ⚡ What's your startup called and what problem does it solve?</p>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <div class="chat-msg-user px-4 py-3 max-w-[80%]">
              <p class="text-sm text-gray-200">It's called PayFlow. We help SMEs collect invoices in 24h instead of 60 days.</p>
            </div>
          </div>

          <div class="flex gap-3">
            <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#7c3aed,#a855f7);">⚡</div>
            <div class="chat-msg-astro px-4 py-3 max-w-[85%]">
              <p class="text-xs font-semibold text-purple-400 mb-1">Astro</p>
              <p class="text-sm text-gray-200">Love it 🚀 Cash flow is a massive problem for SMEs. How many customers do you have and what's your current MRR?</p>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <div class="chat-msg-user px-4 py-3 max-w-[80%]">
              <p class="text-sm text-gray-200">45 customers, €3,200/mo.</p>
            </div>
          </div>

          <div class="flex gap-3">
            <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style="background:linear-gradient(135deg,#7c3aed,#a855f7);">⚡</div>
            <div class="chat-msg-astro px-4 py-3 max-w-[85%]">
              <p class="text-xs font-semibold text-purple-400 mb-1">Astro</p>
              <p class="text-sm text-gray-200">Excellent traction 💜 With that MRR you already meet the criteria for several fintech VCs. I've found <strong class="text-purple-300">3 investors</strong> that are a perfect match for your profile...</p>
            </div>
          </div>
        </div>

        <!-- Fade + CTA overlay -->
        <div class="relative -mt-24 pt-20 pb-6 px-5 text-center" style="background:linear-gradient(to bottom, transparent, #111 60%);">
          <button onclick="openModal('register')" class="btn-primary px-8 py-3.5 rounded-xl text-sm font-bold text-white glow inline-block">
            Talk to Astro for free →
          </button>
          <p class="text-xs text-gray-600 mt-2">No credit card · Free to start</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 pillars — very short -->
  <section class="max-w-5xl mx-auto px-6 py-16">
    <div class="grid md:grid-cols-3 gap-4">
      <div class="border-subtle rounded-2xl p-6">
        <div class="text-2xl mb-3">🎯</div>
        <h3 class="font-semibold text-white mb-1 text-sm">Weekly goals</h3>
        <p class="text-xs text-gray-500 leading-relaxed">Astro sets measurable objectives every week and saves them to your Hub automatically.</p>
      </div>
      <div class="border-subtle rounded-2xl p-6">
        <div class="text-2xl mb-3">📊</div>
        <h3 class="font-semibold text-white mb-1 text-sm">Traction dashboard</h3>
        <p class="text-xs text-gray-500 leading-relaxed">MRR, users, WoW growth — all in one place. Benchmarked against other startups in the community.</p>
      </div>
      <div class="border-subtle rounded-2xl p-6">
        <div class="text-2xl mb-3">🤝</div>
        <h3 class="font-semibold text-white mb-1 text-sm">VC matching</h3>
        <p class="text-xs text-gray-500 leading-relaxed">Astro analyzes your profile and connects you with investors who actually fund startups like yours.</p>
      </div>
    </div>
  </section>

  <!-- WhatsApp Community -->
  <section class="max-w-5xl mx-auto px-6 pb-20">
    <div class="border-subtle rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
      <div class="flex-1">
        <p class="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">💬 Founder Community</p>
        <h2 class="text-xl font-bold text-white mb-2">Join founders building in public</h2>
        <p class="text-gray-400 text-sm leading-relaxed mb-6">Our WhatsApp group is where early members share wins, get feedback, and hold each other accountable. No noise — just builders.</p>
        <a href="https://chat.whatsapp.com/Eidff48yuQr9lmTerhsDK" target="_blank" class="btn-whatsapp inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Join WhatsApp group
        </a>
      </div>
      <div class="hidden md:flex flex-col items-center gap-2 text-center min-w-[120px]">
        <div class="text-5xl font-bold text-white">500<span class="text-purple-400">+</span></div>
        <p class="text-sm text-gray-500">founders already<br>building with ASTAR*</p>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="max-w-6xl mx-auto px-6 pb-24">
    <div class="text-center mb-12">
      <span class="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-4" style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);color:#fbbf24;">🔥 Lifetime Deal — Limited Spots</span>
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-3">Pay once. Own it forever.</h2>
      <p class="text-gray-400 text-sm max-w-md mx-auto">No subscriptions. No recurring fees. Get lifetime access to ASTAR* at a fraction of the monthly cost.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">

      <!-- Tier 1: Solo Founder -->
      <div class="border-subtle rounded-2xl p-7 flex flex-col">
        <div class="mb-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Solo Founder</p>
          <div class="flex items-end gap-2 mb-1">
            <span class="text-4xl font-bold text-white">$69</span>
            <span class="text-gray-500 text-sm mb-1">one-time</span>
          </div>
          <p class="text-xs text-gray-600">Replaces $29/mo · Saves $348 in Year 1</p>
        </div>
        <p class="text-xs text-gray-500 mb-5 leading-relaxed">Perfect for bootstrapped solo founders needing accountability and structure.</p>
        <ul class="space-y-2.5 mb-8 flex-1">
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Unlimited daily AI check-ins (lifetime)</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Execution dashboard with shipping streaks &amp; velocity metrics</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Goal management (up to 3 active goals)</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Personal momentum tracking &amp; weekly reflection sessions</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Access to founder community</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> All future core feature updates</li>
          <li class="flex items-start gap-2 text-sm text-gray-500 opacity-50"><span class="mt-0.5 flex-shrink-0">✕</span> Solo only (no team)</li>
          <li class="flex items-start gap-2 text-sm text-gray-500 opacity-50"><span class="mt-0.5 flex-shrink-0">✕</span> 5 AI strategy recommendations/mo</li>
        </ul>
        <button onclick="openModal('register')" class="w-full py-3 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5 transition">Get Solo Founder →</button>
      </div>

      <!-- Tier 2: Growth Founder (RECOMMENDED) -->
      <div class="rounded-2xl p-7 flex flex-col relative" style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08));border:1px solid rgba(139,92,246,0.4);">
        <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span class="text-xs font-bold px-4 py-1 rounded-full text-white whitespace-nowrap" style="background:linear-gradient(135deg,#7c3aed,#a855f7);">⭐ RECOMMENDED</span>
        </div>
        <div class="mb-5">
          <p class="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1">Growth Founder</p>
          <div class="flex items-end gap-2 mb-1">
            <span class="text-4xl font-bold text-white">$149</span>
            <span class="text-gray-500 text-sm mb-1">one-time</span>
          </div>
          <p class="text-xs text-gray-600">Replaces $69/mo · Saves $948 in Year 1</p>
        </div>
        <p class="text-xs text-gray-400 mb-5 leading-relaxed">For active founders seeking cofounder, early traction, or preparing to fundraise.</p>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Everything in Tier 1, plus:</p>
        <ul class="space-y-2.5 mb-8 flex-1">
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Unlimited active goals &amp; projects</li>
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Advanced analytics — benchmarks, predictive insights, burnout detection</li>
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Team collaboration (up to 3 members)</li>
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Unlimited AI strategy recommendations</li>
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Priority support (24h response)</li>
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Monthly group accountability sessions</li>
          <li class="flex items-start gap-2 text-sm text-gray-200"><span class="text-purple-400 mt-0.5 flex-shrink-0">✓</span> Cofounder matching access + monthly VC competition entry</li>
        </ul>
        <button onclick="openModal('register')" class="btn-primary w-full py-3 rounded-xl font-bold text-white text-sm glow">Get Growth Founder →</button>
        <p class="text-center text-xs text-gray-600 mt-3">🔥 Most popular · Limited spots</p>
      </div>

      <!-- Tier 3: Scale Founder -->
      <div class="border-subtle rounded-2xl p-7 flex flex-col" style="border-color:rgba(251,191,36,0.25);">
        <div class="mb-5">
          <p class="text-xs font-semibold uppercase tracking-widest mb-1" style="color:#fbbf24;">Scale Founder</p>
          <div class="flex items-end gap-2 mb-1">
            <span class="text-4xl font-bold text-white">$299</span>
            <span class="text-gray-500 text-sm mb-1">one-time</span>
          </div>
          <p class="text-xs text-gray-600">Best value for founding teams scaling to Series A</p>
        </div>
        <p class="text-xs text-gray-500 mb-5 leading-relaxed">For founding teams (2–5 people) scaling towards Series A.</p>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Everything in Tier 2, plus:</p>
        <ul class="space-y-2.5 mb-8 flex-1">
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> Unlimited team members (up to 10)</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> White-glove onboarding — 1-hour setup call with your team</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> Quarterly strategic planning sessions (45-min calls)</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> Custom playbooks for your startup stage</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> Auto-generate investor update reports (PDF export)</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> API access (coming Q3 2026)</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="mt-0.5 flex-shrink-0" style="color:#fbbf24;">✓</span> Featured listing in ASTAR community</li>
        </ul>
        <button onclick="openModal('register')" class="w-full py-3 rounded-xl font-bold text-sm transition" style="background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.1));border:1px solid rgba(251,191,36,0.3);color:#fbbf24;">Get Scale Founder →</button>
      </div>

    </div>

    <!-- Money-back note -->
    <p class="text-center text-xs text-gray-600 mt-8">🔒 30-day money-back guarantee · Secure checkout · Instant access after purchase</p>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/5 py-8">
    <div class="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <span class="text-gray-600 text-sm">© 2026 ASTAR* — AI Cofounder for ambitious founders</span>
      <div class="flex items-center gap-6">
        <a href="#pricing" class="text-gray-600 hover:text-gray-400 text-sm transition">Pricing</a>
        <a href="/leaderboard" class="text-gray-600 hover:text-gray-400 text-sm transition">Leaderboard</a>
        <a href="https://chat.whatsapp.com/Eidff48yuQr9lmTerhsDK" target="_blank" class="text-gray-600 hover:text-green-400 text-sm transition">Community</a>
      </div>
    </div>
  </footer>

  <!-- Auth Modal -->
  <div id="auth-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/70 px-4">
    <div class="relative bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
      <div class="flex mb-8 bg-white/5 rounded-xl p-1">
        <button id="tab-login" onclick="switchTab('login')" class="flex-1 py-2 rounded-lg text-sm font-semibold transition text-white bg-white/10">Sign in</button>
        <button id="tab-register" onclick="switchTab('register')" class="flex-1 py-2 rounded-lg text-sm font-semibold transition text-gray-500">Create account</button>
      </div>
      <div id="form-login">
        <h2 class="text-xl font-bold text-white mb-6">Welcome back</h2>
        <div class="space-y-4">
          <input id="login-email" type="email" placeholder="your@email.com" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm">
          <input id="login-password" type="password" placeholder="Password" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm">
          <button onclick="handleLogin()" class="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm">Sign in</button>
        </div>
        <div class="my-5 flex items-center gap-3">
          <div class="flex-1 h-px bg-white/10"></div><span class="text-xs text-gray-600">or</span><div class="flex-1 h-px bg-white/10"></div>
        </div>
        <a href="/api/auth/google?role=founder" class="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </a>
        <p id="login-error" class="text-red-400 text-xs mt-3 hidden"></p>
      </div>
      <div id="form-register" class="hidden">
        <h2 class="text-xl font-bold text-white mb-6">Create your account</h2>
        <div class="space-y-4">
          <input id="reg-name" type="text" placeholder="Your name" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm">
          <input id="reg-email" type="email" placeholder="your@email.com" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm">
          <input id="reg-password" type="password" placeholder="Password (min. 6 characters)" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm">
          <button onclick="handleRegister()" class="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm">Create free account</button>
        </div>
        <div class="my-5 flex items-center gap-3">
          <div class="flex-1 h-px bg-white/10"></div><span class="text-xs text-gray-600">or</span><div class="flex-1 h-px bg-white/10"></div>
        </div>
        <a href="/api/auth/google?role=founder" class="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </a>
        <p id="reg-error" class="text-red-400 text-xs mt-3 hidden"></p>
      </div>
      <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-600 hover:text-white transition text-xl leading-none">✕</button>
    </div>
  </div>

  <script>
    function openModal(tab) {
      document.getElementById('auth-modal').classList.remove('hidden');
      document.getElementById('auth-modal').classList.add('flex');
      switchTab(tab);
    }
    function closeModal() {
      document.getElementById('auth-modal').classList.add('hidden');
      document.getElementById('auth-modal').classList.remove('flex');
    }
    function switchTab(tab) {
      const isLogin = tab === 'login';
      document.getElementById('form-login').classList.toggle('hidden', !isLogin);
      document.getElementById('form-register').classList.toggle('hidden', isLogin);
      document.getElementById('tab-login').className = 'flex-1 py-2 rounded-lg text-sm font-semibold transition ' + (isLogin ? 'text-white bg-white/10' : 'text-gray-500');
      document.getElementById('tab-register').className = 'flex-1 py-2 rounded-lg text-sm font-semibold transition ' + (!isLogin ? 'text-white bg-white/10' : 'text-gray-500');
    }
    document.getElementById('auth-modal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    async function handleLogin() {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const err = document.getElementById('login-error');
      err.classList.add('hidden');
      if (!email || !password) { err.textContent = 'Please fill in all fields.'; err.classList.remove('hidden'); return; }
      try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (data.token) { document.cookie = 'authToken=' + data.token + '; path=/; max-age=604800'; window.location.href = '/dashboard'; }
        else { err.textContent = data.error || 'Invalid credentials.'; err.classList.remove('hidden'); }
      } catch(e) { err.textContent = 'Connection error.'; err.classList.remove('hidden'); }
    }
    async function handleRegister() {
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const err = document.getElementById('reg-error');
      err.classList.add('hidden');
      if (!name || !email || !password) { err.textContent = 'Please fill in all fields.'; err.classList.remove('hidden'); return; }
      if (password.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.classList.remove('hidden'); return; }
      try {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role: 'founder' }) });
        const data = await res.json();
        if (data.token) { document.cookie = 'authToken=' + data.token + '; path=/; max-age=604800'; window.location.href = '/dashboard'; }
        else { err.textContent = data.error || 'Registration failed.'; err.classList.remove('hidden'); }
      } catch(e) { err.textContent = 'Connection error.'; err.classList.remove('hidden'); }
    }
    // If already logged in, show dashboard button
    const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
    if (token) {
      document.getElementById('nav-actions').innerHTML = '<a href="/dashboard" class="btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white">Open Hub →</a>';
    }
  </script>
</body>
</html>`);
});

// Directory Page - ASTAR Hub Dashboard for Startups
app.get('/marketplace', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  
  if (!authToken) {
    return c.redirect('/api/auth/google');
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET) as any;
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
        const decoded = await verify(authCookie, c.env.JWT_SECRET);
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
