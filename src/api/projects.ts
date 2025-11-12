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

// Get single project with full details
projects.get('/:id', async (c) => {
  const projectId = c.req.param('id');
  
  // Get project
  const project = await c.env.DB.prepare(
    'SELECT id, user_id, title, description, target_market, value_proposition, status, category, rating_average, votes_count, created_at, updated_at FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
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

// Vote for a project
projects.post('/:id/vote', requireAuth, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.var.userId;

  if (c.var.userRole !== 'validator') {
    return c.json({ error: 'Only validators can vote on projects' }, 403);
  }

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

  // Try to get from cache first
  const cacheKey = `leaderboard:${category}:${timeframe}:${limit}`;
  try {
    const cached = await c.env.CACHE?.get(cacheKey, 'json');
    if (cached) {
      return c.json(cached);
    }
  } catch (e) {
    // Cache miss or not configured, continue
  }

  // Query que obtiene únicamente los items del marketplace (beta_products)
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
      -- Obtener métricas del usuario
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'users' ORDER BY recorded_date DESC LIMIT 1) as user_metric_users,
      (SELECT metric_value FROM user_metrics WHERE user_id = bp.company_user_id AND metric_name = 'revenue' ORDER BY recorded_date DESC LIMIT 1) as user_metric_revenue
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
    
    // Calculate enhanced scores for each project
    const projectsWithScores = results.map((project: any) => {
      // Solo usar métricas del usuario
      const currentUsers = project.user_metric_users || 0;
      const currentRevenue = project.user_metric_revenue || 0;
      
      const score = calculateLeaderboardScore({
        ...project,
        current_users: currentUsers,
        current_revenue: currentRevenue
      });
      
      return {
        ...project,
        current_users: currentUsers,
        current_revenue: currentRevenue,
        leaderboard_score: score.finalScore,
        score_breakdown: score.breakdown
      };
    });

    // Re-sort by the new composite score
    projectsWithScores.sort((a: any, b: any) => b.leaderboard_score - a.leaderboard_score);

    // Apply limit
    const limitedResults = projectsWithScores.slice(0, limit);

    const result = { leaderboard: limitedResults };

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

// Helper function to calculate composite leaderboard score
function calculateLeaderboardScore(project: any) {
  // 1. Rating Score (40% weight) - Convert 0-5 rating to 0-100 scale
  const ratingScore = (project.rating_average || 0) * 20;
  
  // 2. Growth Score (35% weight) - Based on users and revenue
  const currentUsers = project.current_users || 0;
  const currentRevenue = project.current_revenue || 0;
  
  // Normalize growth metrics (adjust thresholds based on your marketplace)
  const userScore = Math.min((currentUsers / 10000) * 100, 100); // 10k users = 100 points
  const revenueScore = Math.min((currentRevenue / 100000) * 100, 100); // $100k = 100 points
  
  const growthScore = (userScore + revenueScore) / 2;
  
  // 3. Goals Score (25% weight) - Percentage of goals completed
  const totalGoals = project.total_goals || 0;
  const completedGoals = project.completed_goals || 0;
  const goalsScore = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  
  // Calculate weighted final score
  const finalScore = (ratingScore * 0.40) + (growthScore * 0.35) + (goalsScore * 0.25);
  
  return {
    finalScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    breakdown: {
      rating: Math.round(ratingScore * 10) / 10,
      growth: Math.round(growthScore * 10) / 10,
      goals: Math.round(goalsScore * 10) / 10
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

export default projects;
