import { Hono } from 'hono';
import type { Bindings, AuthContext } from '../types';
import { requireAuth } from './auth';
import { checkVoteRateLimit } from './rateLimit';

const projects = new Hono<{ Bindings: Bindings; Variables: AuthContext }>();

// Get all projects for leaderboard (public)
projects.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, user_id, title, description, target_market, value_proposition, status, category, rating_average, votes_count, created_at, updated_at FROM projects ORDER BY created_at DESC'
  ).all();

  return c.json({ projects: results });
});

// Get single project with full details (including product info if exists)
projects.get('/:id', async (c) => {
  const projectId = c.req.param('id');
  
  // Get project
  const project = await c.env.DB.prepare(
    'SELECT id, user_id, title, description, target_market, value_proposition, status, category, rating_average, votes_count, created_at, updated_at FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Get associated beta_product if exists
  const betaProduct = await c.env.DB.prepare(`
    SELECT 
      bp.*,
      u.name as company_name,
      u.avatar_url as company_avatar,
      u.company,
      u.bio as company_bio
    FROM beta_products bp
    JOIN users u ON bp.company_user_id = u.id
    WHERE bp.project_id = ?
  `).bind(projectId).first();
  
  // Get market analysis
  const marketAnalysis = await c.env.DB.prepare(
    'SELECT * FROM market_analysis WHERE project_id = ?'
  ).bind(projectId).first();
  
  // Get MVP prototype
  const mvpPrototype = await c.env.DB.prepare(
    'SELECT * FROM mvp_prototypes WHERE project_id = ?'
  ).bind(projectId).first();
  
  // Get test results with beta users
  const { results: testResults } = await c.env.DB.prepare(`
    SELECT tr.*, bu.name as user_name, bu.role as user_role, bu.rating as user_rating
    FROM test_results tr
    JOIN beta_users bu ON tr.beta_user_id = bu.id
    WHERE tr.project_id = ?
  `).bind(projectId).all();
  
  // Get growth strategies
  const { results: growthStrategies } = await c.env.DB.prepare(
    'SELECT * FROM growth_strategies WHERE project_id = ? ORDER BY priority DESC'
  ).bind(projectId).all();
  
  // Get metrics
  const { results: metrics } = await c.env.DB.prepare(
    'SELECT * FROM metrics WHERE project_id = ? ORDER BY date DESC'
  ).bind(projectId).all();
  
  return c.json({
    project,
    betaProduct,
    marketAnalysis: marketAnalysis ? {
      ...marketAnalysis,
      competitors: JSON.parse(marketAnalysis.competitors as string),
      market_trends: JSON.parse(marketAnalysis.market_trends as string),
      opportunities: JSON.parse(marketAnalysis.opportunities as string),
      threats: JSON.parse(marketAnalysis.threats as string),
    } : null,
    mvpPrototype: mvpPrototype ? {
      ...mvpPrototype,
      features: JSON.parse(mvpPrototype.features as string),
      tech_stack: JSON.parse(mvpPrototype.tech_stack as string),
    } : null,
    testResults,
    growthStrategies: growthStrategies.map(gs => ({
      ...gs,
      channels: JSON.parse(gs.channels as string),
    })),
    metrics,
  });
});

// Create new project
projects.post('/', async (c) => {
  const userId = 1; // TODO: Get from auth session
  const body = await c.req.json();
  
  const { title, description, target_market, value_proposition, category = 'general' } = body;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO projects (user_id, title, description, target_market, value_proposition, category, status)
    VALUES (?, ?, ?, ?, ?, ?, 'draft')
  `).bind(userId, title, description, target_market, value_proposition, category).run();
  
  return c.json({ 
    id: result.meta.last_row_id,
    message: 'Project created successfully'
  });
});

// Update project status
projects.patch('/:id/status', async (c) => {
  const projectId = c.req.param('id');
  const { status } = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, projectId).run();
  
  return c.json({ message: 'Status updated' });
});

// Vote for a project (any authenticated user can vote)
projects.post('/:id/vote', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.var.userId;

  // Check rate limit (1 vote per 5 seconds per user)
  const rateLimitCheck = await checkVoteRateLimit(c.env.CACHE, userId);
  if (!rateLimitCheck.allowed) {
    return c.json({ 
      error: `Please wait ${rateLimitCheck.retryAfter} seconds before voting again`,
      retryAfter: rateLimitCheck.retryAfter
    }, 429);
  }

  const { rating } = await c.req.json();

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  try {
    // Check if project exists and get category
    const project = await c.env.DB.prepare(
      'SELECT id, category FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Insert or update vote (trigger will auto-update project stats)
    // This is now a SINGLE write operation instead of 2
    await c.env.DB.prepare(`
      INSERT INTO project_votes (project_id, user_id, rating, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, user_id) DO UPDATE SET
        rating = excluded.rating,
        updated_at = CURRENT_TIMESTAMP
    `).bind(projectId, userId, rating).run();

    // NOTE: Project rating_average and votes_count are automatically updated by SQL trigger
    // This optimization reduces database writes from 2 to 1 per vote (50% improvement)

    // Invalidate leaderboard cache for all relevant keys
    try {
      const category = (project as any).category || 'general';
      const cacheKeys = [
        `leaderboard:all:all:50`,
        `leaderboard:${category}:all:50`,
        `leaderboard:all:week:50`,
        `leaderboard:all:month:50`,
        `leaderboard:all:year:50`,
      ];
      
      for (const key of cacheKeys) {
        await c.env.CACHE?.delete(key);
      }
    } catch (e) {
      // Cache invalidation failed, continue
    }

    return c.json({
      message: 'Vote recorded successfully',
      success: true,
      rating: rating
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    return c.json({ error: 'Failed to record vote' }, 500);
  }
});

// Get user's vote for a project
projects.get('/:id/vote', async (c) => {
  const projectId = c.req.param('id');
  const userId = 1; // TODO: Get from auth session

  const vote = await c.env.DB.prepare(
    'SELECT rating FROM project_votes WHERE project_id = ? AND user_id = ?'
  ).bind(projectId, userId).first();

  return c.json({ vote: vote || null });
});

// Get leaderboard with enhanced scoring (votes + growth + goals)
projects.get('/leaderboard/top', async (c) => {
  const category = c.req.query('category') || 'all';
  const limit = parseInt(c.req.query('limit') || '50');
  const timeframe = c.req.query('timeframe') || 'all';
  
  // Verificar si el usuario autenticado es admin
  const authHeader = c.req.header('Authorization') || c.req.header('Cookie');
  let isAdmin = false;
  if (authHeader) {
    try {
      // Extraer token y verificar rol
      const token = authHeader.includes('Bearer ') 
        ? authHeader.replace('Bearer ', '')
        : authHeader.match(/authToken=([^;]+)/)?.[1];
      
      if (token) {
        const { verify } = await import('hono/jwt');
        if (c.env.JWT_SECRET) {
          const payload = await verify(token, c.env.JWT_SECRET) as any;
          isAdmin = payload.role === 'admin';
        }
      }
    } catch (e) {
      // Not authenticated or invalid token
    }
  }

  // Try to get from cache first (solo si no es admin)
  const cacheKey = `leaderboard:${category}:${timeframe}:${limit}${isAdmin ? ':admin' : ''}:v2`;
  if (!isAdmin) {
    try {
      const cached = await c.env.CACHE?.get(cacheKey, 'json');
      if (cached) {
        return c.json(cached);
      }
    } catch (e) {
      // Cache miss or not configured, continue
    }
  }

  // Query que obtiene únicamente los items del marketplace (beta_products)
  // Incluye métricas históricas para calcular velocidad de crecimiento
  let query = `
    SELECT
      bp.id,
      bp.title,
      bp.description,
      bp.category,
      bp.rating_average,
      bp.votes_count,
      bp.created_at,
      u.name as creator_name,
      bp.company_user_id as user_id,
      -- Contar goals del usuario dueño del producto
      (SELECT COUNT(*) FROM goals WHERE user_id = bp.company_user_id) as total_goals,
      (SELECT COUNT(*) FROM goals WHERE user_id = bp.company_user_id AND status = 'completed') as completed_goals,
      (SELECT COUNT(*) FROM goals WHERE user_id = bp.company_user_id AND status = 'in_progress') as active_goals,
      (SELECT COUNT(*) FROM goals WHERE user_id = bp.company_user_id AND created_at >= datetime('now', '-7 days')) as recent_goals,
      -- Métricas actuales
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'users' ORDER BY recorded_date DESC LIMIT 1) as current_users,
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'revenue' ORDER BY recorded_date DESC LIMIT 1) as current_revenue,
      -- Métricas de hace 7 días (para calcular WoW growth)
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'users' AND recorded_date <= datetime('now', '-7 days') ORDER BY recorded_date DESC LIMIT 1) as users_7d_ago,
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'revenue' AND recorded_date <= datetime('now', '-7 days') ORDER BY recorded_date DESC LIMIT 1) as revenue_7d_ago,
      -- Métricas de hace 30 días (para calcular MoM growth)
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'users' AND recorded_date <= datetime('now', '-30 days') ORDER BY recorded_date DESC LIMIT 1) as users_30d_ago,
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'revenue' AND recorded_date <= datetime('now', '-30 days') ORDER BY recorded_date DESC LIMIT 1) as revenue_30d_ago,
      -- Weekly traction data from goal_weekly_traction (last 4 weeks)
      (SELECT SUM(revenue_amount) FROM goal_weekly_traction WHERE user_id = bp.company_user_id AND created_at >= datetime('now', '-28 days')) as traction_revenue_4w,
      (SELECT SUM(new_users) FROM goal_weekly_traction WHERE user_id = bp.company_user_id AND created_at >= datetime('now', '-28 days')) as traction_new_users_4w,
      (SELECT AVG(active_users) FROM goal_weekly_traction WHERE user_id = bp.company_user_id AND created_at >= datetime('now', '-28 days')) as traction_avg_active_4w,
      (SELECT SUM(churned_users) FROM goal_weekly_traction WHERE user_id = bp.company_user_id AND created_at >= datetime('now', '-28 days')) as traction_churned_4w,
      (SELECT COUNT(*) FROM goal_weekly_traction WHERE user_id = bp.company_user_id) as traction_reporting_weeks,
      -- Latest week traction (for growth calculation)
      (SELECT revenue_amount FROM goal_weekly_traction WHERE user_id = bp.company_user_id ORDER BY year DESC, week_number DESC LIMIT 1) as traction_latest_revenue,
      (SELECT active_users FROM goal_weekly_traction WHERE user_id = bp.company_user_id ORDER BY year DESC, week_number DESC LIMIT 1) as traction_latest_active,
      -- Previous week traction (for WoW growth)
      (SELECT revenue_amount FROM goal_weekly_traction WHERE user_id = bp.company_user_id ORDER BY year DESC, week_number DESC LIMIT 1 OFFSET 1) as traction_prev_revenue,
      (SELECT active_users FROM goal_weekly_traction WHERE user_id = bp.company_user_id ORDER BY year DESC, week_number DESC LIMIT 1 OFFSET 1) as traction_prev_active,
      -- Actividad reciente (engagement)
      (SELECT COUNT(*) FROM agent_chat_messages WHERE user_id = bp.company_user_id AND created_at >= datetime('now', '-7 days')) as weekly_engagement,
      -- Días desde creación
      CAST((julianday('now') - julianday(bp.created_at)) AS INTEGER) as days_active
    FROM beta_products bp
    JOIN users u ON bp.company_user_id = u.id
    WHERE bp.status = 'active'
  `;

  const params: any[] = [];

  if (category !== 'all') {
    query += ' AND bp.category = ?';
    params.push(category);
  }

  if (timeframe !== 'all') {
    const daysMap: Record<string, number> = { 'week': 7, 'month': 30, 'year': 365 };
    const days = daysMap[timeframe] || 365;
    query += ` AND bp.created_at >= datetime('now', '-${days} days')`;
  }

  // Ordenar inicialmente por rating y votos
  const finalQuery = query + ' ORDER BY bp.rating_average DESC, bp.votes_count DESC';

  try {
    const { results } = await c.env.DB.prepare(finalQuery).bind(...params).all();
    
    // Calculate VC-style scores for each project
    const projectsWithScores = results.map((project: any) => {
      const score = calculateVCScore(project);
      
      return {
        ...project,
        leaderboard_score: score.finalScore,
        vc_score: score.vcScore,
        growth_velocity: score.growthVelocity,
        score_breakdown: score.breakdown,
        growth_wow: score.growthWoW,
        growth_mom: score.growthMoM,
        tractionData: score.tractionData
      };
    });

    // Re-sort by the new VC-style composite score
    projectsWithScores.sort((a: any, b: any) => b.leaderboard_score - a.leaderboard_score);

    // Apply limit (solo si no es admin)
    const limitedResults = isAdmin ? projectsWithScores : projectsWithScores.slice(0, limit);

    const result = { leaderboard: limitedResults, isAdmin };

    // Store in cache for 5 minutes
    try {
      await c.env.CACHE?.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    } catch (e) {
      // Cache write failed, continue
    }

    return c.json(result);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// VC-Style Scoring Algorithm
// Basado en cómo los Venture Capitals evalúan startups
function calculateVCScore(project: any) {
  const currentUsers = project.current_users || 0;
  const currentRevenue = project.current_revenue || 0;
  const users7dAgo = project.users_7d_ago || 0;
  const revenue7dAgo = project.revenue_7d_ago || 0;
  const users30dAgo = project.users_30d_ago || 0;
  const revenue30dAgo = project.revenue_30d_ago || 0;
  const daysActive = project.days_active || 1;
  
  // Weekly traction data from goal_weekly_traction
  const tractionRevenue4w = project.traction_revenue_4w || 0;
  const tractionNewUsers4w = project.traction_new_users_4w || 0;
  const tractionAvgActive4w = project.traction_avg_active_4w || 0;
  const tractionChurned4w = project.traction_churned_4w || 0;
  const tractionReportingWeeks = project.traction_reporting_weeks || 0;
  
  // Latest and previous week data for growth calculation
  const tractionLatestRevenue = project.traction_latest_revenue || 0;
  const tractionLatestActive = project.traction_latest_active || 0;
  const tractionPrevRevenue = project.traction_prev_revenue || 0;
  const tractionPrevActive = project.traction_prev_active || 0;
  
  // Bonus for consistent tracking (shows commitment and discipline)
  const trackingConsistencyBonus = tractionReportingWeeks >= 4 ? 10 : (tractionReportingWeeks * 2.5);
  
  // === 1. GROWTH VELOCITY (35% peso) - Lo más importante para VCs ===
  // Use traction data for growth if available, otherwise use user_metrics
  let userWoWGrowth = 0;
  let revenueWoWGrowth = 0;
  
  // Prefer traction data for growth calculation (more accurate weekly tracking)
  if (tractionPrevActive > 0 && tractionLatestActive > 0) {
    userWoWGrowth = ((tractionLatestActive - tractionPrevActive) / tractionPrevActive) * 100;
  } else if (users7dAgo > 0) {
    userWoWGrowth = ((currentUsers - users7dAgo) / users7dAgo) * 100;
  } else if (currentUsers > 0 || tractionLatestActive > 0) {
    userWoWGrowth = 50; // New startup bonus
  }
  
  if (tractionPrevRevenue > 0 && tractionLatestRevenue > 0) {
    revenueWoWGrowth = ((tractionLatestRevenue - tractionPrevRevenue) / tractionPrevRevenue) * 100;
  } else if (revenue7dAgo > 0) {
    revenueWoWGrowth = ((currentRevenue - revenue7dAgo) / revenue7dAgo) * 100;
  } else if (currentRevenue > 0 || tractionLatestRevenue > 0) {
    revenueWoWGrowth = 50; // New revenue bonus
  }
  
  // Month-over-Month Growth
  const userMoMGrowth = users30dAgo > 0 ? ((currentUsers - users30dAgo) / users30dAgo) * 100 : (currentUsers > 0 ? 50 : 0);
  const revenueMoMGrowth = revenue30dAgo > 0 ? ((currentRevenue - revenue30dAgo) / revenue30dAgo) * 100 : (currentRevenue > 0 ? 50 : 0);
  
  // Growth velocity score (0-100)
  // VCs aman el 10% WoW growth, 20%+ es excepcional
  const userGrowthScore = Math.min(Math.max(userWoWGrowth * 5, 0), 100); // 20% WoW = 100 points
  const revenueGrowthScore = Math.min(Math.max(revenueWoWGrowth * 5, 0), 100);
  const growthVelocityScore = (userGrowthScore * 0.4 + revenueGrowthScore * 0.6); // Revenue growth es más importante
  
  // === 2. TRACTION / MARKET FIT (25% peso) ===
  // Usuarios activos (escala logarítmica para ser más justo)
  // Combinar user_metrics con goal_weekly_traction para mejor precisión
  const effectiveUsers = Math.max(currentUsers, tractionAvgActive4w);
  const userTractionScore = effectiveUsers > 0 
    ? Math.min((Math.log10(effectiveUsers + 1) / Math.log10(100000)) * 100, 100) // 100K users = 100 points
    : 0;
  
  // Revenue/ARR (señal de product-market fit)
  // Priorizar traction_revenue si está disponible (más actualizado y preciso)
  const effectiveRevenue = tractionRevenue4w > 0 ? tractionRevenue4w : currentRevenue;
  const revenueTractionScore = effectiveRevenue > 0
    ? Math.min((Math.log10(effectiveRevenue + 1) / Math.log10(1000000)) * 100, 100) // $1M = 100 points
    : 0;
  
  // Revenue per user (unit economics)
  const arpu = effectiveUsers > 0 ? effectiveRevenue / effectiveUsers : 0;
  const arpuScore = Math.min((arpu / 100) * 100, 100); // $100 ARPU = 100 points
  
  // New users acquisition (from weekly traction)
  const acquisitionScore = tractionNewUsers4w > 0 
    ? Math.min((tractionNewUsers4w / 100) * 100, 50) // Max 50 points, 100 new users in 4 weeks = 50 points
    : 0;
  
  const tractionScore = (userTractionScore * 0.30 + revenueTractionScore * 0.40 + arpuScore * 0.20 + acquisitionScore * 0.10);
  
  // === 3. MARKET VALIDATION / STARS (20% peso) ===
  // Votos como señal de validación del mercado
  const votesCount = project.votes_count || 0;
  const ratingAverage = project.rating_average || 0;
  
  // Número de votos (engagement de la comunidad)
  const votesScore = Math.min((votesCount / 50) * 100, 100); // 50 votos = 100 points
  
  // Rating promedio (calidad percibida)
  const ratingScore = (ratingAverage / 5) * 100;
  
  // Combinar votos y rating (más votos con alto rating = mejor)
  const validationScore = votesCount > 0 
    ? (votesScore * 0.4 + ratingScore * 0.6)
    : 0;
  
  // === 4. EXECUTION / MOMENTUM (15% peso) ===
  // Goals completados (ejecución del equipo)
  const totalGoals = project.total_goals || 0;
  const completedGoals = project.completed_goals || 0;
  const activeGoals = project.active_goals || 0;
  const recentGoals = project.recent_goals || 0;
  
  const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  const hasActiveWork = activeGoals > 0 ? 20 : 0; // Bonus por tener trabajo activo
  const recentActivityBonus = recentGoals > 0 ? Math.min(recentGoals * 10, 30) : 0; // Bonus por actividad reciente
  
  // Add tracking consistency bonus (founders who track traction regularly)
  const executionScore = Math.min(goalsCompletionRate + hasActiveWork + recentActivityBonus + trackingConsistencyBonus, 100);
  
  // === 5. ENGAGEMENT BONUS (5% peso) ===
  const weeklyEngagement = project.weekly_engagement || 0;
  const engagementScore = Math.min((weeklyEngagement / 50) * 100, 100); // 50 interacciones semanales = 100 points
  
  // === CALCULAR SCORE FINAL ===
  const finalScore = 
    (growthVelocityScore * 0.35) + // 35% Growth Velocity
    (tractionScore * 0.25) +       // 25% Traction
    (validationScore * 0.20) +     // 20% Market Validation (Stars)
    (executionScore * 0.15) +      // 15% Execution
    (engagementScore * 0.05);      // 5% Engagement
  
  // VC Score Letter Grade
  let vcGrade = 'C';
  if (finalScore >= 80) vcGrade = 'A+';
  else if (finalScore >= 70) vcGrade = 'A';
  else if (finalScore >= 60) vcGrade = 'B+';
  else if (finalScore >= 50) vcGrade = 'B';
  else if (finalScore >= 40) vcGrade = 'C+';
  else if (finalScore >= 30) vcGrade = 'C';
  else vcGrade = 'D';
  
  return {
    finalScore: Math.round(finalScore * 10) / 10,
    vcScore: vcGrade,
    growthVelocity: Math.round((userWoWGrowth + revenueWoWGrowth) / 2 * 10) / 10,
    growthWoW: {
      users: Math.round(userWoWGrowth * 10) / 10,
      revenue: Math.round(revenueWoWGrowth * 10) / 10
    },
    growthMoM: {
      users: Math.round(userMoMGrowth * 10) / 10,
      revenue: Math.round(revenueMoMGrowth * 10) / 10
    },
    tractionData: {
      revenue4w: tractionRevenue4w,
      newUsers4w: tractionNewUsers4w,
      avgActive4w: Math.round(tractionAvgActive4w),
      churned4w: tractionChurned4w,
      reportingWeeks: tractionReportingWeeks,
      consistencyBonus: Math.round(trackingConsistencyBonus * 10) / 10,
      latestRevenue: tractionLatestRevenue,
      latestActive: tractionLatestActive,
      prevRevenue: tractionPrevRevenue,
      prevActive: tractionPrevActive,
      userWoWGrowth: Math.round(userWoWGrowth * 10) / 10,
      revenueWoWGrowth: Math.round(revenueWoWGrowth * 10) / 10
    },
    breakdown: {
      growth: Math.round(growthVelocityScore * 10) / 10,
      traction: Math.round(tractionScore * 10) / 10,
      validation: Math.round(validationScore * 10) / 10,
      execution: Math.round(executionScore * 10) / 10,
      engagement: Math.round(engagementScore * 10) / 10
    }
  };
}

// Get leaderboard by category
projects.get('/leaderboard/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        category,
        COUNT(*) as project_count,
        AVG(rating_average) as avg_rating,
        SUM(votes_count) as total_votes
      FROM projects
      WHERE status = 'published' AND votes_count > 0
      GROUP BY category
      ORDER BY avg_rating DESC
    `).all();

    return c.json({ categories: results });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return c.json({ error: 'Failed to fetch category stats' }, 500);
  }
});

// ============================================
// PROJECT FOUNDERS MANAGEMENT
// ============================================

// Get founders for a project
projects.get('/:id/founders', async (c) => {
  const projectId = c.req.param('id');
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        pf.*,
        u.email as user_email,
        u.avatar_url as user_avatar
      FROM project_founders pf
      LEFT JOIN users u ON pf.user_id = u.id
      WHERE pf.project_id = ?
      ORDER BY pf.is_creator DESC, pf.joined_at ASC
    `).bind(projectId).all();

    return c.json({ founders: results || [] });
  } catch (error) {
    console.error('Error fetching founders:', error);
    return c.json({ error: 'Failed to fetch founders' }, 500);
  }
});

// Add founder to project
projects.post('/:id/founders', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.var.userId;
  const body = await c.req.json();
  
  const { name, email, role, equity_percentage, user_id } = body;

  if (!name || !role) {
    return c.json({ error: 'Name and role are required' }, 400);
  }

  try {
    // Verify user owns the project
    const project = await c.env.DB.prepare(
      'SELECT user_id FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if ((project as any).user_id !== userId) {
      return c.json({ error: 'Not authorized to add founders to this project' }, 403);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO project_founders (project_id, user_id, name, email, role, equity_percentage, is_creator)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).bind(projectId, user_id || null, name, email || null, role, equity_percentage || null).run();

    return c.json({
      success: true,
      id: result.meta.last_row_id,
      message: 'Founder added successfully'
    });
  } catch (error) {
    console.error('Error adding founder:', error);
    return c.json({ error: 'Failed to add founder' }, 500);
  }
});

// Update founder
projects.put('/:id/founders/:founderId', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const founderId = c.req.param('founderId');
  const userId = c.var.userId;
  const body = await c.req.json();
  
  const { name, email, role, equity_percentage } = body;

  try {
    // Verify user owns the project
    const project = await c.env.DB.prepare(
      'SELECT user_id FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project || (project as any).user_id !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE project_founders
      SET name = ?, email = ?, role = ?, equity_percentage = ?
      WHERE id = ? AND project_id = ?
    `).bind(name, email, role, equity_percentage, founderId, projectId).run();

    return c.json({
      success: true,
      message: 'Founder updated successfully'
    });
  } catch (error) {
    console.error('Error updating founder:', error);
    return c.json({ error: 'Failed to update founder' }, 500);
  }
});

// Delete founder
projects.delete('/:id/founders/:founderId', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const founderId = c.req.param('founderId');
  const userId = c.var.userId;

  try {
    // Verify user owns the project
    const project = await c.env.DB.prepare(
      'SELECT user_id FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project || (project as any).user_id !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Don't allow deleting the creator
    const founder = await c.env.DB.prepare(
      'SELECT is_creator FROM project_founders WHERE id = ? AND project_id = ?'
    ).bind(founderId, projectId).first();

    if ((founder as any)?.is_creator === 1) {
      return c.json({ error: 'Cannot delete project creator' }, 400);
    }

    await c.env.DB.prepare(
      'DELETE FROM project_founders WHERE id = ? AND project_id = ?'
    ).bind(founderId, projectId).run();

    return c.json({
      success: true,
      message: 'Founder removed successfully'
    });
  } catch (error) {
    console.error('Error deleting founder:', error);
    return c.json({ error: 'Failed to delete founder' }, 500);
  }
});

export default projects;
