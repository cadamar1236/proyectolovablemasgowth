import { Hono } from 'hono';
import type { Bindings, AuthContext } from '../types';
import { requireAuth } from './auth';

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

  const { rating } = await c.req.json();

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  try {
    // Check if project exists
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Insert or update vote
    await c.env.DB.prepare(`
      INSERT INTO project_votes (project_id, user_id, rating, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, user_id) DO UPDATE SET
        rating = excluded.rating,
        updated_at = CURRENT_TIMESTAMP
    `).bind(projectId, userId, rating).run();

    // Update project rating stats
    await c.env.DB.prepare(`
      UPDATE projects
      SET
        rating_average = (
          SELECT AVG(rating)
          FROM project_votes
          WHERE project_id = ?
        ),
        votes_count = (
          SELECT COUNT(*)
          FROM project_votes
          WHERE project_id = ?
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(projectId, projectId, projectId).run();

    return c.json({ message: 'Vote recorded successfully' });
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

// Get leaderboard
projects.get('/leaderboard/top', async (c) => {
  const category = c.req.query('category') || 'all';
  const limit = parseInt(c.req.query('limit') || '10');

  let query = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.target_market,
      p.value_proposition,
      p.category,
      p.rating_average,
      p.votes_count,
      p.created_at,
      u.name as creator_name
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'published' AND p.votes_count > 0
  `;

  const params = [];

  if (category !== 'all') {
    query += ' AND p.category = ?';
    params.push(category);
  }

  query += ' ORDER BY p.rating_average DESC, p.votes_count DESC LIMIT ?';
  params.push(limit);

  try {
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ leaderboard: results });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

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
