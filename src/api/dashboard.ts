import { Hono } from 'hono';
import type { Bindings, AuthContext } from '../types';
import { requireAuth } from './auth';

const dashboard = new Hono<{ Bindings: Bindings; Variables: AuthContext }>();

// ============================================
// GOALS API - Using 'goals' table
// ============================================

// Get user's goals
dashboard.get('/goals', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, user_id, description, status, target_value, current_value, 
             deadline, category, created_at, updated_at
      FROM goals 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();

    return c.json({ goals: results || [] });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return c.json({ goals: [] });
  }
});

// Create a new goal
dashboard.post('/goals', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { description, target_value, current_value, deadline, category } = body;

  if (!description?.trim()) {
    return c.json({ error: 'Description is required' }, 400);
  }

  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO goals (user_id, description, target_value, current_value, deadline, category, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'active') 
      RETURNING *
    `).bind(
      userId, 
      description.trim(), 
      target_value || 100, 
      current_value || 0, 
      deadline || null, 
      category || 'general'
    ).first();

    return c.json({ goal: result, success: true }, 201);
  } catch (error) {
    console.error('Error creating goal:', error);
    return c.json({ error: 'Failed to create goal' }, 500);
  }
});

// Update goal
dashboard.put('/goals/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const goalId = c.req.param('id');
  const body = await c.req.json();
  const { status, current_value, target_value, description } = body;

  try {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (current_value !== undefined) {
      updates.push('current_value = ?');
      values.push(current_value);
    }
    if (target_value !== undefined) {
      updates.push('target_value = ?');
      values.push(target_value);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(goalId, userId);

    await c.env.DB.prepare(`
      UPDATE goals 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating goal:', error);
    return c.json({ error: 'Failed to update goal' }, 500);
  }
});

// Delete goal
dashboard.delete('/goals/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const goalId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      DELETE FROM goals WHERE id = ? AND user_id = ?
    `).bind(goalId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return c.json({ error: 'Failed to delete goal' }, 500);
  }
});

// Mark goal as completed
dashboard.post('/goals/complete', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { goalId } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE goals 
      SET status = 'completed', 
          current_value = target_value, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).bind(goalId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error completing goal:', error);
    return c.json({ error: 'Failed to complete goal' }, 500);
  }
});

// ============================================
// METRICS API
// ============================================

// Get user's primary metrics config
dashboard.get('/primary-metrics', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM primary_metrics WHERE user_id = ?'
    ).bind(userId).first();

    if (!result) {
      // Create default primary metrics
      await c.env.DB.prepare(
        'INSERT INTO primary_metrics (user_id, metric1_name, metric2_name) VALUES (?, ?, ?)'
      ).bind(userId, 'users', 'revenue').run();

      return c.json({
        primaryMetrics: { metric1_name: 'users', metric2_name: 'revenue' }
      });
    }

    return c.json({ primaryMetrics: result });
  } catch (error) {
    console.error('Error in primary-metrics:', error);
    return c.json({ primaryMetrics: { metric1_name: 'users', metric2_name: 'revenue' } });
  }
});

// Update primary metrics config
dashboard.put('/primary-metrics', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { metric1_name, metric2_name } = await c.req.json();

  const validMetrics = ['users', 'revenue', 'conversion', 'churn', 'mrr', 'arr'];
  if (!validMetrics.includes(metric1_name) || !validMetrics.includes(metric2_name)) {
    return c.json({ error: 'Invalid metric names' }, 400);
  }

  try {
    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO primary_metrics (user_id, metric1_name, metric2_name, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(userId, metric1_name, metric2_name).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating primary metrics:', error);
    return c.json({ error: 'Failed to update primary metrics' }, 500);
  }
});

// Get metrics history
dashboard.get('/metrics-history', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, metric_name, metric_value, recorded_date, created_at
      FROM user_metrics 
      WHERE user_id = ? 
      ORDER BY recorded_date DESC, created_at DESC
      LIMIT 100
    `).bind(userId).all();

    return c.json({ metricsHistory: results || [] });
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    return c.json({ metricsHistory: [] });
  }
});

// Add metric value
dashboard.post('/metrics', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { metric_name, metric_value, recorded_date } = await c.req.json();

  // Validate
  const validMetrics = ['users', 'revenue', 'conversion', 'churn', 'mrr', 'arr'];
  if (!validMetrics.includes(metric_name)) {
    return c.json({ error: 'Invalid metric name' }, 400);
  }

  if (typeof metric_value !== 'number' || metric_value < 0) {
    return c.json({ error: 'Invalid metric value' }, 400);
  }

  const date = recorded_date || new Date().toISOString().split('T')[0];

  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date) 
      VALUES (?, ?, ?, ?)
      RETURNING *
    `).bind(userId, metric_name, metric_value, date).first();

    return c.json({ metric: result, success: true }, 201);
  } catch (error) {
    console.error('Error adding metric:', error);
    return c.json({ error: 'Failed to add metric' }, 500);
  }
});

// Delete metric
dashboard.delete('/metrics/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const metricId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      DELETE FROM user_metrics WHERE id = ? AND user_id = ?
    `).bind(metricId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting metric:', error);
    return c.json({ error: 'Failed to delete metric' }, 500);
  }
});

// ============================================
// WEEKLY UPDATES & ACHIEVEMENTS
// ============================================

dashboard.get('/weekly-updates', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM weekly_updates WHERE user_id = ? ORDER BY created_at DESC LIMIT 12'
    ).bind(userId).all();

    return c.json({ weeklyUpdates: results || [] });
  } catch (error) {
    return c.json({ weeklyUpdates: [] });
  }
});

dashboard.post('/weekly-updates', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { week, goalStatuses } = await c.req.json();

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO weekly_updates (user_id, week, goal_statuses) VALUES (?, ?, ?) RETURNING *'
    ).bind(userId, week, JSON.stringify(goalStatuses)).first();

    return c.json({ weeklyUpdate: result, success: true }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create weekly update' }, 500);
  }
});

dashboard.get('/achievements', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return c.json({ achievements: results || [] });
  } catch (error) {
    return c.json({ achievements: [] });
  }
});

dashboard.post('/achievements', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { date, description } = await c.req.json();

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO achievements (user_id, date, description) VALUES (?, ?, ?) RETURNING *'
    ).bind(userId, date, description).first();

    return c.json({ achievement: result, success: true }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create achievement' }, 500);
  }
});

// ============================================
// SUMMARY STATS
// ============================================

dashboard.get('/summary', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    // Get goals summary
    const { results: goals } = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count FROM goals WHERE user_id = ? GROUP BY status
    `).bind(userId).all();

    const goalStats = {
      total: 0,
      active: 0,
      completed: 0
    };

    goals?.forEach((g: any) => {
      goalStats.total += g.count;
      if (g.status === 'active' || g.status === 'in_progress') goalStats.active += g.count;
      if (g.status === 'completed') goalStats.completed += g.count;
    });

    // Get latest metrics
    const { results: latestMetrics } = await c.env.DB.prepare(`
      SELECT metric_name, metric_value 
      FROM user_metrics 
      WHERE user_id = ? 
      ORDER BY recorded_date DESC, created_at DESC
      LIMIT 10
    `).bind(userId).all();

    const metrics: any = {};
    latestMetrics?.forEach((m: any) => {
      if (!metrics[m.metric_name]) {
        metrics[m.metric_name] = m.metric_value;
      }
    });

    // Get achievements count
    const achievementCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM achievements WHERE user_id = ?
    `).bind(userId).first();

    return c.json({
      goals: goalStats,
      metrics: {
        users: metrics.users || 0,
        revenue: metrics.revenue || 0
      },
      achievementsCount: (achievementCount as any)?.count || 0,
      completionRate: goalStats.total > 0 ? Math.round((goalStats.completed / goalStats.total) * 100) : 0
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    return c.json({ 
      goals: { total: 0, active: 0, completed: 0 },
      metrics: { users: 0, revenue: 0 },
      achievementsCount: 0,
      completionRate: 0
    });
  }
});

// ============================================
// LEADERBOARD
// ============================================

dashboard.get('/leaderboard', requireAuth, async (c) => {
  const currentUserId = c.get('userId');

  try {
    const { results: users } = await c.env.DB.prepare(
      'SELECT id, email, name FROM users ORDER BY email'
    ).all();

    const { results: allGoals } = await c.env.DB.prepare(
      'SELECT user_id, status FROM goals'
    ).all();

    const { results: allMetrics } = await c.env.DB.prepare(
      'SELECT user_id, metric_name, metric_value FROM user_metrics'
    ).all();

    const { results: allAchievements } = await c.env.DB.prepare(
      'SELECT user_id FROM achievements'
    ).all();

    const leaderboard = users?.map((user: any) => {
      const userGoals = allGoals?.filter((g: any) => g.user_id === user.id) || [];
      const totalGoals = userGoals.length;
      const completedGoals = userGoals.filter((g: any) => g.status === 'completed').length;
      
      const userMetrics = allMetrics?.filter((m: any) => m.user_id === user.id) || [];
      const latestUsers = userMetrics.find((m: any) => m.metric_name === 'users')?.metric_value || 0;
      const latestRevenue = userMetrics.find((m: any) => m.metric_name === 'revenue')?.metric_value || 0;
      
      const achievementsCount = allAchievements?.filter((a: any) => a.user_id === user.id).length || 0;

      const score = (completedGoals * 10) + (totalGoals * 2) + (userMetrics.length * 1) + (achievementsCount * 5);
      const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      return {
        user_id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        total_goals: totalGoals,
        completed_goals: completedGoals,
        completion_rate: Math.round(completionRate),
        total_users: latestUsers,
        total_revenue: latestRevenue,
        achievements_count: achievementsCount,
        score: score,
        is_current_user: user.id === currentUserId
      };
    }) || [];

    leaderboard.sort((a: any, b: any) => b.score - a.score);
    leaderboard.forEach((entry: any, index: number) => {
      entry.rank = index + 1;
    });

    const currentUserEntry = leaderboard.find((e: any) => e.user_id === currentUserId);

    return c.json({
      leaderboard: leaderboard.slice(0, 50),
      current_user: currentUserEntry || null,
      total_users: users?.length || 0
    });
  } catch (error) {
    console.error('Error in leaderboard:', error);
    return c.json({ leaderboard: [], current_user: null, total_users: 0 });
  }
});

// My stats
dashboard.get('/my-stats', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const { results: goals } = await c.env.DB.prepare(
      'SELECT status FROM goals WHERE user_id = ?'
    ).bind(userId).all();

    const totalGoals = goals?.length || 0;
    const completedGoals = goals?.filter((g: any) => g.status === 'completed').length || 0;

    const { results: metrics } = await c.env.DB.prepare(
      'SELECT metric_name, metric_value FROM user_metrics WHERE user_id = ? ORDER BY recorded_date DESC'
    ).bind(userId).all();

    const latestUsers = metrics?.find((m: any) => m.metric_name === 'users')?.metric_value || 0;
    const latestRevenue = metrics?.find((m: any) => m.metric_name === 'revenue')?.metric_value || 0;

    const { results: achievements } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM achievements WHERE user_id = ?'
    ).bind(userId).all();

    const achievementsCount = (achievements?.[0] as any)?.count || 0;
    const score = (completedGoals * 10) + (totalGoals * 2) + ((metrics?.length || 0) * 1) + (achievementsCount * 5);

    return c.json({
      total_goals: totalGoals,
      completed_goals: completedGoals,
      completion_rate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      latest_users: latestUsers,
      latest_revenue: latestRevenue,
      achievements_count: achievementsCount,
      score: score
    });
  } catch (error) {
    console.error('Error in my-stats:', error);
    return c.json({
      total_goals: 0, completed_goals: 0, completion_rate: 0,
      latest_users: 0, latest_revenue: 0, achievements_count: 0, score: 0
    });
  }
});

export default dashboard;
