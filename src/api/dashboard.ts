import { Hono } from 'hono';
import type { Bindings, AuthContext } from '../types';
import { requireAuth } from './auth';

const dashboard = new Hono<{ Bindings: Bindings; Variables: AuthContext }>();

// Get user's goals
dashboard.get('/goals', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json({ goals: results });
});

// Add a new goal
dashboard.post('/goals', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { description } = await c.req.json();

  const result = await c.env.DB.prepare(
    'INSERT INTO goals (user_id, description) VALUES (?, ?) RETURNING *'
  ).bind(userId, description).first();

  return c.json({ goal: result }, 201);
});

// Update goal status
dashboard.put('/goals/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const goalId = c.req.param('id');
  const { status } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE goals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).bind(status, goalId, userId).run();

  return c.json({ success: true });
});

// Mark goal as completed
dashboard.post('/goals/complete', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { goalId } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE goals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).bind('completed', goalId, userId).run();

  return c.json({ success: true });
});

// Get user's primary metrics
dashboard.get('/primary-metrics', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    console.log('Fetching primary metrics for user:', userId);

    const result = await c.env.DB.prepare(
      'SELECT * FROM primary_metrics WHERE user_id = ?'
    ).bind(userId).first();

    console.log('Primary metrics result:', result);

    if (!result) {
      // Create default primary metrics for user
      console.log('Creating default primary metrics for user:', userId);
      // Add more detailed logging to debug the insertion of default metrics
      console.log('Attempting to insert default metrics for user:', userId);
      const insertResult = await c.env.DB.prepare(
        'INSERT INTO primary_metrics (user_id, metric1_name, metric2_name) VALUES (?, ?, ?)'
      ).bind(userId, 'users', 'revenue').run();
      console.log('Insert result:', insertResult);

      return c.json({
        primaryMetrics: {
          metric1_name: 'users',
          metric2_name: 'revenue'
        }
      });
    }

    return c.json({ primaryMetrics: result });
  } catch (error) {
    console.error('Error in primary-metrics endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user's primary metrics
dashboard.put('/primary-metrics', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { metric1_name, metric2_name } = await c.req.json();

  // Validate metric names
  const validMetrics = ['users', 'revenue'];
  if (!validMetrics.includes(metric1_name) || !validMetrics.includes(metric2_name)) {
    return c.json({ error: 'Invalid metric names' }, 400);
  }

  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO primary_metrics (user_id, metric1_name, metric2_name, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
  ).bind(userId, metric1_name, metric2_name).run();

  return c.json({ success: true });
});

// Get user's metrics history
dashboard.get('/metrics-history', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    console.log('Fetching metrics history for user:', userId);

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM user_metrics WHERE user_id = ? ORDER BY recorded_date DESC, created_at DESC'
    ).bind(userId).all();

    console.log('Metrics history results:', results);

    return c.json({ metricsHistory: results });
  } catch (error) {
    console.error('Error in metrics-history endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add metric value
dashboard.post('/metrics', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { metric_name, metric_value, recorded_date } = await c.req.json();

    console.log('Adding metric for user:', userId, { metric_name, metric_value, recorded_date });

    // Validate metric name
    const validMetrics = ['users', 'revenue'];
    if (!validMetrics.includes(metric_name)) {
      return c.json({ error: 'Invalid metric name' }, 400);
    }

    // Validate metric value
    if (typeof metric_value !== 'number' || metric_value < 0) {
      return c.json({ error: 'Invalid metric value' }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date) VALUES (?, ?, ?, ?)'
    ).bind(userId, metric_name, metric_value, recorded_date).run();

    console.log('Metric added successfully:', result);

    return c.json({ metric: result }, 201);
  } catch (error) {
    console.error('Error in metrics POST endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user's weekly updates
dashboard.get('/weekly-updates', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM weekly_updates WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json({ weeklyUpdates: results });
});

// Add weekly update
dashboard.post('/weekly-updates', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { week, goalStatuses } = await c.req.json();

  const result = await c.env.DB.prepare(
    'INSERT INTO weekly_updates (user_id, week, goal_statuses) VALUES (?, ?, ?) RETURNING *'
  ).bind(userId, week, JSON.stringify(goalStatuses)).first();

  return c.json({ weeklyUpdate: result }, 201);
});

// Get user's achievements
dashboard.get('/achievements', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM achievements WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json({ achievements: results });
});

// Add achievement
dashboard.post('/achievements', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { date, description } = await c.req.json();

  const result = await c.env.DB.prepare(
    'INSERT INTO achievements (user_id, date, description) VALUES (?, ?, ?) RETURNING *'
  ).bind(userId, date, description).first();

  return c.json({ achievement: result }, 201);
});

// Fetch internal dashboard data for administrators
dashboard.get('/admin/internal-dashboard', requireAuth, async (c) => {
  const userRole = c.get('userRole');
  const userEmail = c.get('userEmail');

  // Ensure only administrators or the general admin can access this endpoint
  if (userRole !== 'admin' && userEmail !== 'cadamar1236@gmail.com') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Get all users
  const { results: users } = await c.env.DB.prepare(
    'SELECT id, email, role FROM users ORDER BY email'
  ).all();

  // Bulk fetch all data
  const { results: allGoals } = await c.env.DB.prepare(
    'SELECT * FROM goals ORDER BY user_id, created_at DESC'
  ).all();

  const { results: allPrimaryMetrics } = await c.env.DB.prepare(
    'SELECT * FROM primary_metrics ORDER BY user_id'
  ).all();

  const { results: allUserMetrics } = await c.env.DB.prepare(
    'SELECT * FROM user_metrics ORDER BY user_id, recorded_date DESC, created_at DESC'
  ).all();

  const { results: allWeeklyUpdates } = await c.env.DB.prepare(
    'SELECT * FROM weekly_updates ORDER BY user_id, created_at DESC'
  ).all();

  const { results: allAchievements } = await c.env.DB.prepare(
    'SELECT * FROM achievements ORDER BY user_id, created_at DESC'
  ).all();

  // Group data by user_id
  const goalsByUser: { [key: number]: any[] } = {};
  allGoals.forEach((goal: any) => {
    if (!goalsByUser[goal.user_id]) goalsByUser[goal.user_id] = [];
    goalsByUser[goal.user_id].push(goal);
  });

  const primaryMetricsByUser: { [key: number]: any } = {};
  allPrimaryMetrics.forEach((pm: any) => {
    primaryMetricsByUser[pm.user_id] = pm;
  });

  const userMetricsByUser: { [key: number]: any[] } = {};
  allUserMetrics.forEach((metric: any) => {
    if (!userMetricsByUser[metric.user_id]) userMetricsByUser[metric.user_id] = [];
    userMetricsByUser[metric.user_id].push(metric);
  });

  const weeklyUpdatesByUser: { [key: number]: any[] } = {};
  allWeeklyUpdates.forEach((update: any) => {
    if (!weeklyUpdatesByUser[update.user_id]) weeklyUpdatesByUser[update.user_id] = [];
    weeklyUpdatesByUser[update.user_id].push(update);
  });

  const achievementsByUser: { [key: number]: any[] } = {};
  allAchievements.forEach((achievement: any) => {
    if (!achievementsByUser[achievement.user_id]) achievementsByUser[achievement.user_id] = [];
    achievementsByUser[achievement.user_id].push(achievement);
  });

  const dashboards = users.map((user: any) => {
    const userId = user.id;
    const goals = goalsByUser[userId] || [];
    const primaryMetricsRow = primaryMetricsByUser[userId] || {};
    const userMetrics = userMetricsByUser[userId] || [];

    // Group metrics by date for history
    const metricsHistory: any[] = [];
    const metricsByDate: { [key: string]: any } = {};
    userMetrics.forEach((metric: any) => {
      if (!metricsByDate[metric.recorded_date]) {
        metricsByDate[metric.recorded_date] = {
          created_at: metric.created_at,
          users: 0,
          revenue: 0,
          conversion: 0,
          growth: 0
        };
      }
      if (metric.metric_name === 'users') {
        metricsByDate[metric.recorded_date].users = metric.metric_value;
      } else if (metric.metric_name === 'revenue') {
        metricsByDate[metric.recorded_date].revenue = metric.metric_value;
      }
      // Note: conversion and growth might need to be calculated or stored separately
    });
    for (const date in metricsByDate) {
      metricsHistory.push(metricsByDate[date]);
    }
    metricsHistory.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      goals,
      primaryMetrics: {
        users: primaryMetricsRow.metric1_name === 'users' ? (userMetrics.find(m => m.metric_name === 'users')?.metric_value || 0) : 0,
        revenue: primaryMetricsRow.metric2_name === 'revenue' ? (userMetrics.find(m => m.metric_name === 'revenue')?.metric_value || 0) : 0,
        conversion: 0, // Placeholder, might need to calculate or add to schema
        growth: 0 // Placeholder
      },
      metricsHistory,
      userMetrics,
      weeklyUpdates: weeklyUpdatesByUser[userId] || [],
      achievements: achievementsByUser[userId] || []
    };
  });

  // Get total non-admin users
  const { results: nonAdminCount } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role != 'admin'"
  ).all();

  return c.json({
    dashboards,
    totalNonAdminUsers: nonAdminCount[0].count
  });
});

// Fetch number of logged-in users (for admin)
dashboard.get('/admin/logged-in-users', requireAuth, async (c) => {
  const userRole = c.get('userRole');
  const userEmail = c.get('userEmail');

  // Ensure only administrators or the general admin can access this endpoint
  if (userRole !== 'admin' && userEmail !== 'cadamar1236@gmail.com') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // For simplicity, return total users as "logged-in" users
  // In a real app, you'd track active sessions
  const { results } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM users'
  ).all();

  return c.json({ count: results[0].count });
});

// Dashboard Questions API

dashboard.get('/questions', requireAuth, async (c) => {
  const userId = c.get('userId');
  // Get current week start (Monday)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0,0,0,0);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Get latest (this week) or most recent
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM dashboard_questions WHERE user_id = ? AND week_start = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(userId, weekStartStr).all();

  if (results.length > 0) {
    return c.json({ questions: results[0] });
  } else {
    // If not found, get most recent
    const { results: recent } = await c.env.DB.prepare(
      'SELECT * FROM dashboard_questions WHERE user_id = ? ORDER BY week_start DESC, created_at DESC LIMIT 1'
    ).bind(userId).all();
    return c.json({ questions: recent[0] || null });
  }
});

dashboard.post('/questions', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0,0,0,0);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Upsert for this week
  await c.env.DB.prepare(
    `INSERT INTO dashboard_questions
      (user_id, week_start, launched, weeks_to_launch, users_talked, users_learned, morale, primary_metric_improved, biggest_obstacle, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, week_start) DO UPDATE SET
        launched=excluded.launched,
        weeks_to_launch=excluded.weeks_to_launch,
        users_talked=excluded.users_talked,
        users_learned=excluded.users_learned,
        morale=excluded.morale,
        primary_metric_improved=excluded.primary_metric_improved,
        biggest_obstacle=excluded.biggest_obstacle,
        updated_at=CURRENT_TIMESTAMP
    `
  ).bind(
    userId,
    weekStartStr,
    !!body.launched,
    body.weeksToLaunch ?? null,
    body.usersTalked ?? null,
    body.usersLearned ?? null,
    body.morale ?? null,
    body.primaryMetricImproved ?? null,
    body.biggestObstacle ?? null
  ).run();

  return c.json({ success: true });
});

// ===========================================
// LEADERBOARD API (Public for WhatsApp Agents)
// ===========================================

// Get leaderboard - calculates scores based on goals and metrics
dashboard.get('/leaderboard', requireAuth, async (c) => {
  const currentUserId = c.get('userId');

  try {
    // Get all users with their goals and metrics
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

    // Calculate scores for each user
    const leaderboard = users.map((user: any) => {
      const userGoals = allGoals.filter((g: any) => g.user_id === user.id);
      const totalGoals = userGoals.length;
      const completedGoals = userGoals.filter((g: any) => g.status === 'completed').length;
      
      const userMetrics = allMetrics.filter((m: any) => m.user_id === user.id);
      const latestUsers = userMetrics.find((m: any) => m.metric_name === 'users')?.metric_value || 0;
      const latestRevenue = userMetrics.find((m: any) => m.metric_name === 'revenue')?.metric_value || 0;
      
      const achievementsCount = allAchievements.filter((a: any) => a.user_id === user.id).length;

      // Score calculation:
      // - Completed goals: 10 points each
      // - Total goals created: 2 points each
      // - Metrics registered: 1 point each
      // - Achievements: 5 points each
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
    });

    // Sort by score descending
    leaderboard.sort((a: any, b: any) => b.score - a.score);

    // Add rank
    leaderboard.forEach((entry: any, index: number) => {
      entry.rank = index + 1;
    });

    // Find current user's position
    const currentUserEntry = leaderboard.find((e: any) => e.user_id === currentUserId);

    return c.json({
      leaderboard: leaderboard.slice(0, 50), // Top 50
      current_user: currentUserEntry || null,
      total_users: users.length
    });
  } catch (error) {
    console.error('Error in leaderboard endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user's own stats for quick summary
dashboard.get('/my-stats', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    // Get goals
    const { results: goals } = await c.env.DB.prepare(
      'SELECT status FROM goals WHERE user_id = ?'
    ).bind(userId).all();

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g: any) => g.status === 'completed').length;

    // Get latest metrics
    const { results: metrics } = await c.env.DB.prepare(
      'SELECT metric_name, metric_value FROM user_metrics WHERE user_id = ? ORDER BY recorded_date DESC'
    ).bind(userId).all();

    const latestUsers = metrics.find((m: any) => m.metric_name === 'users')?.metric_value || 0;
    const latestRevenue = metrics.find((m: any) => m.metric_name === 'revenue')?.metric_value || 0;

    // Get achievements count
    const { results: achievements } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM achievements WHERE user_id = ?'
    ).bind(userId).all();

    const achievementsCount = (achievements[0] as any)?.count || 0;

    // Calculate score
    const score = (completedGoals * 10) + (totalGoals * 2) + (metrics.length * 1) + (achievementsCount * 5);

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
    console.error('Error in my-stats endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default dashboard;