/**
 * Traction Metrics API
 * Endpoints for weekly traction data and founders leaderboard
 */

import { Hono } from 'hono';

const traction = new Hono<{ Bindings: CloudflareBindings }>();

// Get historical traction metrics for a user
traction.get('/metrics/:userId', async (c) => {
  const userId = c.req.param('userId');
  const limit = parseInt(c.req.query('limit') || '12'); // Default 12 weeks
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        gwt.*,
        g.id as goal_id,
        g.description as goal_description,
        g.created_at as goal_created_at
      FROM goal_weekly_traction gwt
      LEFT JOIN goals g ON g.user_id = gwt.user_id 
        AND g.week_number = gwt.week_number 
        AND g.year_number = gwt.year
        AND g.category = 'traction'
      WHERE gwt.user_id = ?
      ORDER BY gwt.year DESC, gwt.week_number DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json({ 
      metrics: results || [],
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching traction metrics:', error);
    return c.json({ error: 'Failed to fetch traction metrics' }, 500);
  }
});

// Get founders leaderboard based on traction metrics
traction.get('/leaderboard', async (c) => {
  const metric = c.req.query('metric') || 'growth'; // growth | revenue | users | composite
  const weeks = parseInt(c.req.query('weeks') || '4'); // Last N weeks
  const limit = parseInt(c.req.query('limit') || '50');
  
  try {
    // Calculate current week number
    const weekCalc = await c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%W', 'now') AS INTEGER) as current_week,
        CAST(strftime('%Y', 'now') AS INTEGER) as current_year
    `).first();
    
    const currentWeek = weekCalc?.current_week || 0;
    const currentYear = weekCalc?.current_year || 2026;
    
    // Get founders with their latest traction metrics and growth rates
    const { results } = await c.env.DB.prepare(`
      WITH WeeklyMetrics AS (
        SELECT 
          gwt.user_id,
          gwt.week_number,
          gwt.year,
          gwt.revenue_amount,
          gwt.new_users,
          gwt.active_users,
          gwt.churned_users,
          gwt.strongest_signal,
          gwt.created_at,
          -- Calculate growth from previous week
          LAG(gwt.revenue_amount, 1) OVER (PARTITION BY gwt.user_id ORDER BY gwt.year, gwt.week_number) as prev_revenue,
          LAG(gwt.new_users, 1) OVER (PARTITION BY gwt.user_id ORDER BY gwt.year, gwt.week_number) as prev_new_users,
          LAG(gwt.active_users, 1) OVER (PARTITION BY gwt.user_id ORDER BY gwt.year, gwt.week_number) as prev_active_users
        FROM goal_weekly_traction gwt
        WHERE (gwt.year = ? AND gwt.week_number >= ? - ?)
          OR (gwt.year = ? - 1 AND gwt.week_number >= 52 - (? - ?) + ?)
      ),
      UserStats AS (
        SELECT 
          wm.user_id,
          u.name as user_name,
          u.avatar_url,
          u.email,
          -- Latest metrics
          MAX(CASE WHEN wm.year = ? AND wm.week_number = ? THEN wm.revenue_amount ELSE NULL END) as latest_revenue,
          MAX(CASE WHEN wm.year = ? AND wm.week_number = ? THEN wm.new_users ELSE NULL END) as latest_new_users,
          MAX(CASE WHEN wm.year = ? AND wm.week_number = ? THEN wm.active_users ELSE NULL END) as latest_active_users,
          -- Total metrics over period
          SUM(wm.revenue_amount) as total_revenue,
          SUM(wm.new_users) as total_new_users,
          AVG(wm.active_users) as avg_active_users,
          SUM(wm.churned_users) as total_churned,
          -- Growth calculations
          AVG(CASE 
            WHEN wm.prev_revenue > 0 
            THEN ((wm.revenue_amount - wm.prev_revenue) / wm.prev_revenue * 100)
            ELSE 0 
          END) as avg_revenue_growth_pct,
          AVG(CASE 
            WHEN wm.prev_active_users > 0 
            THEN ((wm.active_users - wm.prev_active_users) / wm.prev_active_users * 100)
            ELSE 0 
          END) as avg_user_growth_pct,
          -- Consistency metrics
          COUNT(*) as weeks_reporting,
          MAX(wm.strongest_signal) as best_signal,
          -- Get their project info
          (SELECT bp.title FROM beta_products bp WHERE bp.company_user_id = wm.user_id LIMIT 1) as project_title,
          (SELECT bp.category FROM beta_products bp WHERE bp.company_user_id = wm.user_id LIMIT 1) as project_category,
          (SELECT bp.id FROM beta_products bp WHERE bp.company_user_id = wm.user_id LIMIT 1) as project_id
        FROM WeeklyMetrics wm
        JOIN users u ON wm.user_id = u.id
        GROUP BY wm.user_id, u.name, u.avatar_url, u.email
        HAVING weeks_reporting >= 1
      )
      SELECT 
        *,
        -- Composite score (similar to VC scoring)
        (
          (COALESCE(avg_revenue_growth_pct, 0) * 0.35) +
          (COALESCE(total_revenue / 1000, 0) * 0.25) +
          (COALESCE(avg_user_growth_pct, 0) * 0.20) +
          (COALESCE(total_new_users, 0) * 0.15) +
          (weeks_reporting * 2.5)
        ) as composite_score
      FROM UserStats
      ORDER BY 
        CASE 
          WHEN ? = 'revenue' THEN total_revenue
          WHEN ? = 'users' THEN total_new_users
          WHEN ? = 'growth' THEN (avg_revenue_growth_pct + avg_user_growth_pct) / 2
          ELSE composite_score
        END DESC
      LIMIT ?
    `).bind(
      currentYear, currentWeek, weeks,  // WHERE clause for current year
      currentYear, weeks, weeks, currentWeek,  // WHERE clause for previous year spillover
      currentYear, currentWeek,  // latest_revenue
      currentYear, currentWeek,  // latest_new_users
      currentYear, currentWeek,  // latest_active_users
      metric, metric, metric,  // ORDER BY CASE
      limit
    ).all();

    return c.json({ 
      leaderboard: results || [],
      metric,
      weeks,
      currentWeek,
      currentYear
    });
  } catch (error) {
    console.error('Error fetching traction leaderboard:', error);
    return c.json({ error: 'Failed to fetch traction leaderboard', details: error.message }, 500);
  }
});

// Get traction summary stats for dashboard
traction.get('/summary/:userId', async (c) => {
  const userId = c.req.param('userId');
  
  try {
    const stats = await c.env.DB.prepare(`
      WITH RecentMetrics AS (
        SELECT 
          revenue_amount,
          new_users,
          active_users,
          churned_users,
          week_number,
          year,
          ROW_NUMBER() OVER (ORDER BY year DESC, week_number DESC) as rn
        FROM goal_weekly_traction
        WHERE user_id = ?
      )
      SELECT 
        -- Current week (latest)
        MAX(CASE WHEN rn = 1 THEN revenue_amount END) as current_revenue,
        MAX(CASE WHEN rn = 1 THEN new_users END) as current_new_users,
        MAX(CASE WHEN rn = 1 THEN active_users END) as current_active_users,
        MAX(CASE WHEN rn = 1 THEN churned_users END) as current_churned,
        -- Previous week
        MAX(CASE WHEN rn = 2 THEN revenue_amount END) as prev_revenue,
        MAX(CASE WHEN rn = 2 THEN active_users END) as prev_active_users,
        -- All-time totals
        SUM(revenue_amount) as total_revenue,
        SUM(new_users) as total_users_acquired,
        AVG(active_users) as avg_active_users,
        SUM(churned_users) as total_churned,
        COUNT(*) as weeks_tracked
      FROM RecentMetrics
    `).bind(userId).first();

    // Calculate growth rates
    const revenueGrowth = stats?.prev_revenue 
      ? ((stats.current_revenue - stats.prev_revenue) / stats.prev_revenue * 100)
      : 0;
    
    const userGrowth = stats?.prev_active_users
      ? ((stats.current_active_users - stats.prev_active_users) / stats.prev_active_users * 100)
      : 0;

    return c.json({
      ...stats,
      revenue_growth_wow: Math.round(revenueGrowth * 10) / 10,
      user_growth_wow: Math.round(userGrowth * 10) / 10
    });
  } catch (error) {
    console.error('Error fetching traction summary:', error);
    return c.json({ error: 'Failed to fetch traction summary' }, 500);
  }
});

export default traction;
