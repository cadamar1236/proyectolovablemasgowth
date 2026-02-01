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
  const userRole = c.get('role');
  
  try {
    // Si es admin, devolver todos los goals de todos los usuarios
    if (userRole === 'admin') {
      const { results } = await c.env.DB.prepare(`
        SELECT g.id, g.user_id, g.description, g.status, g.target_value, g.current_value, 
               g.deadline, g.category, g.task, g.priority, g.priority_label, g.cadence, g.dri, 
               g.goal_status, g.day_mon, g.day_tue, g.day_wed, g.day_thu, g.day_fri, g.day_sat, g.day_sun,
               g.week_1, g.week_2, g.week_3, g.week_4, g.week_5,
               g.hypothesis_expected_behavior, g.hypothesis_validation_signal, g.hypothesis_status,
               g.build_tech_stack, g.build_hours_spent, g.build_hypothesis_id,
               g.users_spoken, g.users_used_product, g.key_learning,
               g.users_interacted, g.repeated_actions, g.drop_off_points, g.key_insight,
               g.week_number, g.year_number,
               gwt.revenue_amount as traction_revenue, gwt.new_users as traction_new_users,
               gwt.active_users as traction_active_users, gwt.churned_users as traction_churned,
               gwt.strongest_signal as traction_signal,
               g.week_of, g.order_index, g.created_at, g.updated_at,
               u.name as user_name, u.email as user_email
        FROM goals g
        LEFT JOIN users u ON g.user_id = u.id
        LEFT JOIN goal_weekly_traction gwt ON g.week_number = gwt.week_number 
                                           AND g.year_number = gwt.year 
                                           AND g.user_id = gwt.user_id
                                           AND g.category = 'traction'
        ORDER BY g.created_at DESC
      `).all();

      return c.json({ goals: results || [], isAdmin: true });
    }
    
    // Check if user is part of a team
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    let results;
    if (teamMembership && teamMembership.team_id) {
      // Get goals for all team members
      results = await c.env.DB.prepare(`
        SELECT 
          g.id, g.user_id, g.description, g.status, g.target_value, g.current_value, 
          g.deadline, g.category, g.task, g.priority, g.priority_label, g.cadence, g.dri, 
          g.assigned_to_user_id, g.priority_order,
          g.goal_status, g.day_mon, g.day_tue, g.day_wed, g.day_thu, g.day_fri, g.day_sat, g.day_sun,
          g.week_1, g.week_2, g.week_3, g.week_4, g.week_5,
          g.scheduled_dates,
          g.hypothesis_expected_behavior, g.hypothesis_validation_signal, g.hypothesis_status,
          g.build_tech_stack, g.build_hours_spent, g.build_hypothesis_id,
          g.users_spoken, g.users_used_product, g.key_learning,
          g.users_interacted, g.repeated_actions, g.drop_off_points, g.key_insight,
          g.week_number, g.year_number,
          gwt.revenue_amount as traction_revenue, gwt.new_users as traction_new_users,
          gwt.active_users as traction_active_users, gwt.churned_users as traction_churned,
          gwt.strongest_signal as traction_signal,
          g.week_of, g.order_index, g.created_at, g.updated_at,
          u.name as creator_name,
          u.avatar_url as creator_avatar,
          assigned_user.name as assigned_user_name,
          assigned_user.email as assigned_user_email,
          assigned_user.avatar_url as assigned_user_avatar
        FROM goals g
        INNER JOIN startup_team_members stm ON g.user_id = stm.user_id
        LEFT JOIN users u ON g.user_id = u.id
        LEFT JOIN users assigned_user ON g.assigned_to_user_id = assigned_user.id
        LEFT JOIN goal_weekly_traction gwt ON g.week_number = gwt.week_number 
                                           AND g.year_number = gwt.year 
                                           AND g.user_id = gwt.user_id
                                           AND g.category = 'traction'
        WHERE stm.team_id = ?
        ORDER BY g.priority_order ASC, g.order_index ASC, g.priority ASC, g.created_at DESC
      `).bind(teamMembership.team_id).all();
    } else {
      // Fallback to user's own goals if not in a team
      results = await c.env.DB.prepare(`
        SELECT g.id, g.user_id, g.description, g.status, g.target_value, g.current_value, 
               g.deadline, g.category, g.task, g.priority, g.priority_label, g.cadence, g.dri, 
               g.assigned_to_user_id, g.priority_order,
               g.goal_status, g.day_mon, g.day_tue, g.day_wed, g.day_thu, g.day_fri, g.day_sat, g.day_sun,
               g.scheduled_dates,
               g.hypothesis_expected_behavior, g.hypothesis_validation_signal, g.hypothesis_status,
               g.build_tech_stack, g.build_hours_spent, g.build_hypothesis_id,
               g.users_spoken, g.users_used_product, g.key_learning,
               g.users_interacted, g.repeated_actions, g.drop_off_points, g.key_insight,
               g.week_number, g.year_number,
               gwt.revenue_amount as traction_revenue, gwt.new_users as traction_new_users,
               gwt.active_users as traction_active_users, gwt.churned_users as traction_churned,
               gwt.strongest_signal as traction_signal,
               g.week_of, g.order_index, g.created_at, g.updated_at,
               assigned_user.name as assigned_user_name,
               assigned_user.email as assigned_user_email,
               assigned_user.avatar_url as assigned_user_avatar
        FROM goals g
        LEFT JOIN users assigned_user ON g.assigned_to_user_id = assigned_user.id
        LEFT JOIN goal_weekly_traction gwt ON g.week_number = gwt.week_number 
                                           AND g.year_number = gwt.year 
                                           AND g.user_id = gwt.user_id
                                           AND g.category = 'traction'
        WHERE g.user_id = ? 
        ORDER BY g.priority_order ASC, g.order_index ASC, g.priority ASC, g.created_at DESC
      `).bind(userId).all();
    }

    return c.json({ goals: results.results || [] });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return c.json({ goals: [] });
  }
});

// Get goals for a specific user (admin only)
dashboard.get('/goals/user/:userId', requireAuth, async (c) => {
  const requestUserId = c.get('userId');
  const userRole = c.get('role');
  const targetUserId = c.req.param('userId');
  
  console.log('Goals/user endpoint - requestUserId:', requestUserId, 'userRole:', userRole, 'targetUserId:', targetUserId);
  
  // Check if user is admin by querying database
  let isAdmin = false;
  if (requestUserId) {
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(requestUserId).first();
    isAdmin = user?.role === 'admin';
    console.log('User from DB:', user, 'isAdmin:', isAdmin);
  }
  
  // Only admins can view other users' goals, or users can view their own
  if (!isAdmin && requestUserId !== parseInt(targetUserId)) {
    console.log('Access denied - not admin and not own user');
    return c.json({ error: 'Unauthorized', details: { isAdmin, requestUserId, targetUserId } }, 403);
  }
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, user_id, description, status, target_value, current_value, 
             deadline, category, task, priority, priority_label, cadence, dri, 
             goal_status, day_mon, day_tue, day_wed, day_thu, day_fri, day_sat, day_sun,
             week_of, order_index, created_at, updated_at
      FROM goals 
      WHERE user_id = ? 
      ORDER BY order_index ASC, priority ASC, created_at DESC
    `).bind(targetUserId).all();

    console.log('Found', results?.length || 0, 'goals for user', targetUserId);
    return c.json({ goals: results || [] });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return c.json({ goals: [], error: error.message }, 500);
  }
});

// Create a new goal
dashboard.post('/goals', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { 
    description, 
    target_value, 
    current_value, 
    deadline, 
    category,
    task,
    priority,
    priority_label,
    cadence,
    dri,
    assigned_to_user_id,
    goal_status,
    week_of,
    order_index
  } = body;

  if (!description?.trim()) {
    return c.json({ error: 'Description is required' }, 400);
  }

  try {
    // If assigned_to_user_id is provided, validate that this user is in the same team
    if (assigned_to_user_id) {
      const teamMembership = await c.env.DB.prepare(`
        SELECT team_id
        FROM startup_team_members
        WHERE user_id = ?
        LIMIT 1
      `).bind(userId).first();

      if (teamMembership) {
        const assignedUserInTeam = await c.env.DB.prepare(`
          SELECT user_id
          FROM startup_team_members
          WHERE team_id = ? AND user_id = ?
        `).bind(teamMembership.team_id, assigned_to_user_id).first();

        if (!assignedUserInTeam) {
          return c.json({ error: 'Assigned user is not in your team' }, 400);
        }
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO goals (
        user_id, description, target_value, current_value, deadline, category, 
        task, priority, priority_label, cadence, dri, assigned_to_user_id, 
        goal_status, week_of, order_index, status
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active') 
      RETURNING *
    `).bind(
      userId, 
      description.trim(), 
      target_value || 100, 
      current_value || 0, 
      deadline || null, 
      category || 'Build',
      task || description.trim(),
      priority || 'P0',
      priority_label || 'Urgent & important',
      cadence || 'One time',
      dri || null,
      assigned_to_user_id || null,
      goal_status || 'To start',
      week_of || null,
      order_index || 0
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
  
  let body;
  try {
    body = await c.req.json();
    console.log('[GOAL UPDATE] goalId:', goalId, 'userId:', userId, 'body:', JSON.stringify(body));
  } catch (parseError: any) {
    console.error('[GOAL UPDATE] Failed to parse body:', parseError?.message);
    return c.json({ error: 'Invalid request body' }, 400);
  }
  
  const { 
    status, 
    current_value, 
    target_value, 
    description,
    task,
    priority,
    priority_label,
    cadence,
    dri,
    assigned_to_user_id,
    goal_status,
    day_mon,
    day_tue,
    day_wed,
    day_thu,
    day_fri,
    day_sat,
    day_sun,
    week_1,
    week_2,
    week_3,
    week_4,
    week_5,
    scheduled_dates,
    week_of,
    order_index,
    category
  } = body;

  try {
    // If assigned_to_user_id is being updated, validate that this user is in the same team
    if (assigned_to_user_id !== undefined) {
      const teamMembership = await c.env.DB.prepare(`
        SELECT team_id
        FROM startup_team_members
        WHERE user_id = ?
        LIMIT 1
      `).bind(userId).first();

      if (teamMembership && assigned_to_user_id !== null) {
        const assignedUserInTeam = await c.env.DB.prepare(`
          SELECT user_id
          FROM startup_team_members
          WHERE team_id = ? AND user_id = ?
        `).bind(teamMembership.team_id, assigned_to_user_id).first();

        if (!assignedUserInTeam) {
          return c.json({ error: 'Assigned user is not in your team' }, 400);
        }
      }
    }

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
    if (task !== undefined) {
      updates.push('task = ?');
      values.push(task);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (priority_label !== undefined) {
      updates.push('priority_label = ?');
      values.push(priority_label);
    }
    if (cadence !== undefined) {
      updates.push('cadence = ?');
      values.push(cadence);
    }
    if (dri !== undefined) {
      updates.push('dri = ?');
      values.push(dri);
    }
    if (assigned_to_user_id !== undefined) {
      updates.push('assigned_to_user_id = ?');
      values.push(assigned_to_user_id);
    }
    if (goal_status !== undefined) {
      updates.push('goal_status = ?');
      values.push(goal_status);
    }
    if (day_mon !== undefined) {
      updates.push('day_mon = ?');
      values.push(day_mon);
    }
    if (day_tue !== undefined) {
      updates.push('day_tue = ?');
      values.push(day_tue);
    }
    if (day_wed !== undefined) {
      updates.push('day_wed = ?');
      values.push(day_wed);
    }
    if (day_thu !== undefined) {
      updates.push('day_thu = ?');
      values.push(day_thu);
    }
    if (day_fri !== undefined) {
      updates.push('day_fri = ?');
      values.push(day_fri);
    }
    if (day_sat !== undefined) {
      updates.push('day_sat = ?');
      values.push(day_sat);
    }
    if (day_sun !== undefined) {
      updates.push('day_sun = ?');
      values.push(day_sun);
    }
    if (week_1 !== undefined) {
      updates.push('week_1 = ?');
      values.push(week_1);
    }
    if (week_2 !== undefined) {
      updates.push('week_2 = ?');
      values.push(week_2);
    }
    if (week_3 !== undefined) {
      updates.push('week_3 = ?');
      values.push(week_3);
    }
    if (week_4 !== undefined) {
      updates.push('week_4 = ?');
      values.push(week_4);
    }
    if (week_5 !== undefined) {
      updates.push('week_5 = ?');
      values.push(week_5);
    }
    if (scheduled_dates !== undefined) {
      updates.push('scheduled_dates = ?');
      // Ensure it's always a JSON string
      let datesStr: string;
      if (typeof scheduled_dates === 'string') {
        datesStr = scheduled_dates;
      } else if (Array.isArray(scheduled_dates)) {
        datesStr = JSON.stringify(scheduled_dates);
      } else {
        datesStr = '[]';
      }
      values.push(datesStr);
      console.log('[GOAL UPDATE] Setting scheduled_dates to:', datesStr);
    }
    if (week_of !== undefined) {
      updates.push('week_of = ?');
      values.push(week_of);
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?');
      values.push(order_index);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Build the complete UPDATE query
    const updateQuery = `
      UPDATE goals 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    // All values: first the field values, then the goalId for WHERE clause
    const allValues = [...values, goalId];
    
    console.log('[GOAL UPDATE] Query:', updateQuery);
    console.log('[GOAL UPDATE] Values:', JSON.stringify(allValues));
    
    try {
      const result = await c.env.DB.prepare(updateQuery).bind(...allValues).run();
      console.log('[GOAL UPDATE] Success! Rows affected:', result.meta?.changes);
      
      if (result.meta?.changes === 0) {
        return c.json({ error: 'Goal not found or no permission to update' }, 404);
      }
      
      return c.json({ success: true, rowsAffected: result.meta?.changes });
    } catch (dbError: any) {
      console.error('[GOAL UPDATE] Database error:', dbError?.message, dbError);
      return c.json({ error: 'Database error', details: dbError?.message }, 500);
    }
  } catch (error: any) {
    console.error('Error updating goal:', error?.message || error, 'Stack:', error?.stack);
    return c.json({ error: 'Failed to update goal', details: error?.message }, 500);
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
    // Check if user is part of a team
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    let results;
    if (teamMembership && teamMembership.team_id) {
      // Get metrics for all team members
      const metricsResult = await c.env.DB.prepare(`
        SELECT um.id, um.metric_name, um.metric_value, um.recorded_date, um.created_at
        FROM user_metrics um
        INNER JOIN startup_team_members stm ON um.user_id = stm.user_id
        WHERE stm.team_id = ?
        ORDER BY um.recorded_date DESC, um.created_at DESC
        LIMIT 100
      `).bind(teamMembership.team_id).all();
      results = metricsResult.results;
    } else {
      // Fallback to user's own metrics
      const metricsResult = await c.env.DB.prepare(`
        SELECT id, metric_name, metric_value, recorded_date, created_at
        FROM user_metrics 
        WHERE user_id = ? 
        ORDER BY recorded_date DESC, created_at DESC
        LIMIT 100
      `).bind(userId).all();
      results = metricsResult.results;
    }

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
// GOAL DAILY COMPLETION API
// ============================================

// Get daily completion status for a goal
dashboard.get('/goals/:id/daily-completion', requireAuth, async (c) => {
  const goalId = c.req.param('id');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT completion_date, is_completed, completed_at
      FROM goal_daily_completion
      WHERE goal_id = ?
      ORDER BY completion_date ASC
    `).bind(goalId).all();

    return c.json({ dailyCompletion: results || [] });
  } catch (error) {
    console.error('Error fetching daily completion:', error);
    return c.json({ dailyCompletion: [] });
  }
});

// Toggle daily completion status for a specific date
dashboard.post('/goals/:id/daily-completion', requireAuth, async (c) => {
  const goalId = c.req.param('id');
  const { completion_date } = await c.req.json();

  if (!completion_date) {
    return c.json({ error: 'completion_date is required' }, 400);
  }

  try {
    // Check current status
    const current = await c.env.DB.prepare(`
      SELECT is_completed FROM goal_daily_completion
      WHERE goal_id = ? AND completion_date = ?
    `).bind(goalId, completion_date).first();

    if (current) {
      // Toggle existing status
      const newStatus = current.is_completed === 1 ? 0 : 1;
      await c.env.DB.prepare(`
        UPDATE goal_daily_completion
        SET is_completed = ?, 
            completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
        WHERE goal_id = ? AND completion_date = ?
      `).bind(newStatus, newStatus, goalId, completion_date).run();

      return c.json({ success: true, is_completed: newStatus === 1 });
    } else {
      // Create new record (mark as completed)
      await c.env.DB.prepare(`
        INSERT INTO goal_daily_completion (goal_id, completion_date, is_completed, completed_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      `).bind(goalId, completion_date).run();

      return c.json({ success: true, is_completed: true });
    }
  } catch (error) {
    console.error('Error toggling daily completion:', error);
    return c.json({ error: 'Failed to update daily completion' }, 500);
  }
});

// Update priority order for a goal
dashboard.put('/goals/:id/priority-order', requireAuth, async (c) => {
  const goalId = c.req.param('id');
  const { priority_order } = await c.req.json();

  if (priority_order === undefined) {
    return c.json({ error: 'priority_order is required' }, 400);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE goals
      SET priority_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(priority_order, goalId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating priority order:', error);
    return c.json({ error: 'Failed to update priority order' }, 500);
  }
});

// ============================================
// TEAM MEMBERS API
// ============================================

// Get team members for goal assignment
dashboard.get('/team-members', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    // Get user's team
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    if (!teamMembership || !teamMembership.team_id) {
      return c.json({ teamMembers: [] });
    }

    // Get all team members
    const { results } = await c.env.DB.prepare(`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.avatar_url,
        stm.role,
        stm.is_creator
      FROM startup_team_members stm
      INNER JOIN users u ON stm.user_id = u.id
      WHERE stm.team_id = ?
      ORDER BY stm.is_creator DESC, u.name ASC
    `).bind(teamMembership.team_id).all();

    console.log('[TEAM-MEMBERS] Found', results?.length || 0, 'team members for team', teamMembership.team_id);
    return c.json({ teamMembers: results || [] });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return c.json({ teamMembers: [] });
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

    // Check if user is part of a team for metrics
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    let latestMetrics;
    if (teamMembership && teamMembership.team_id) {
      // Get metrics for all team members
      const metricsResult = await c.env.DB.prepare(`
        SELECT um.metric_name, um.metric_value
        FROM user_metrics um
        INNER JOIN startup_team_members stm ON um.user_id = stm.user_id
        WHERE stm.team_id = ?
        ORDER BY um.recorded_date DESC, um.created_at DESC
        LIMIT 10
      `).bind(teamMembership.team_id).all();
      latestMetrics = metricsResult.results;
    } else {
      // Fallback to user's own metrics
      const metricsResult = await c.env.DB.prepare(`
        SELECT metric_name, metric_value 
        FROM user_metrics 
        WHERE user_id = ? 
        ORDER BY recorded_date DESC, created_at DESC
        LIMIT 10
      `).bind(userId).all();
      latestMetrics = metricsResult.results;
    }

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

    // Check if user is part of a team for metrics
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    let metrics;
    if (teamMembership && teamMembership.team_id) {
      // Get metrics for all team members
      const metricsResult = await c.env.DB.prepare(`
        SELECT um.metric_name, um.metric_value
        FROM user_metrics um
        INNER JOIN startup_team_members stm ON um.user_id = stm.user_id
        WHERE stm.team_id = ?
        ORDER BY um.recorded_date DESC
      `).bind(teamMembership.team_id).all();
      metrics = metricsResult.results;
    } else {
      // Fallback to user's own metrics
      const metricsResult = await c.env.DB.prepare(
        'SELECT metric_name, metric_value FROM user_metrics WHERE user_id = ? ORDER BY recorded_date DESC'
      ).bind(userId).all();
      metrics = metricsResult.results;
    }

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
