import { Hono } from 'hono';
import type { Bindings } from '../types';

const projects = new Hono<{ Bindings: Bindings }>();

// Get all projects for user
projects.get('/', async (c) => {
  const userId = 1; // TODO: Get from auth session
  
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();
  
  return c.json({ projects: results });
});

// Get single project with full details
projects.get('/:id', async (c) => {
  const projectId = c.req.param('id');
  
  // Get project
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
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
  
  const { title, description, target_market, value_proposition } = body;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO projects (user_id, title, description, target_market, value_proposition, status)
    VALUES (?, ?, ?, ?, ?, 'draft')
  `).bind(userId, title, description, target_market, value_proposition).run();
  
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

export default projects;
