import { Hono } from 'hono';
import type { Bindings } from '../types';

const betaUsers = new Hono<{ Bindings: Bindings }>();

// Get all beta users
betaUsers.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM beta_users WHERE available = 1 ORDER BY rating DESC LIMIT 50'
    ).all();
    
    return c.json({ betaUsers: results });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get beta user by ID
betaUsers.get('/:id', async (c) => {
  const userId = c.req.param('id');
  
  const user = await c.env.DB.prepare(
    'SELECT * FROM beta_users WHERE id = ?'
  ).bind(userId).first();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user });
});

// Submit test feedback
betaUsers.post('/feedback', async (c) => {
  const { projectId, betaUserId, rating, feedback, wouldPay, suggestedPrice } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO test_results (project_id, beta_user_id, rating, feedback, would_pay, suggested_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(projectId, betaUserId, rating, feedback, wouldPay ? 1 : 0, suggestedPrice).run();
  
  return c.json({ 
    id: result.meta.last_row_id,
    message: 'Feedback submitted successfully'
  });
});

export default betaUsers;
