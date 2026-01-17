/**
 * Metrics Data API
 * Endpoints para exponer datos de métricas al sistema multiagente (Railway)
 * Similar a chat-agent.ts pero enfocado en métricas y goals
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import type { Bindings, AuthContext } from '../types';

type Variables = {
  user: AuthContext;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for Railway agent access
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'X-Agent-Key'],
  exposeHeaders: ['Set-Cookie']
}));

// JWT middleware for authentication
const jwtMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication provided' }, 401);
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as AuthContext;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication' }, 401);
  }
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Get complete startup context (metrics + goals)
async function getStartupMetricsContext(db: any, userId: number) {
  console.log('[METRICS-DATA] Fetching context for user:', userId);
  
  try {
    // Get goals
    const goalsResult = await db.prepare(`
      SELECT id, description, status, target_value, current_value, deadline, category, created_at, updated_at
      FROM goals 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();
    
    const goals = goalsResult.results || [];

    // Check if user is part of a team
    const teamMembership = await db.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    let metricsResult;
    if (teamMembership && teamMembership.team_id) {
      // Get metrics for all team members
      metricsResult = await db.prepare(`
        SELECT um.metric_name, um.metric_value, um.recorded_date
        FROM user_metrics um
        INNER JOIN startup_team_members stm ON um.user_id = stm.user_id
        WHERE stm.team_id = ?
        ORDER BY um.recorded_date DESC
        LIMIT 180
      `).bind(teamMembership.team_id).all();
    } else {
      // Fallback to user's own metrics if not in a team
      metricsResult = await db.prepare(`
        SELECT metric_name, metric_value, recorded_date
        FROM user_metrics 
        WHERE user_id = ? 
        ORDER BY recorded_date DESC
        LIMIT 180
      `).bind(userId).all();
    }

    const metrics = metricsResult.results || [];

    // Get primary metrics config
    const primaryMetrics = await db.prepare(`
      SELECT metric1_name, metric2_name 
      FROM primary_metrics 
      WHERE user_id = ?
    `).bind(userId).first();

    // Group metrics by name
    const metricsByName: Record<string, any[]> = {};
    metrics.forEach((m: any) => {
      if (!metricsByName[m.metric_name]) {
        metricsByName[m.metric_name] = [];
      }
      metricsByName[m.metric_name].push({
        value: m.metric_value,
        date: m.recorded_date
      });
    });

    // Calculate growth rates for each metric
    const growthRates: Record<string, number> = {};
    Object.keys(metricsByName).forEach(name => {
      const values = metricsByName[name];
      if (values.length >= 2) {
        const current = values[0].value;
        const previous = values[1].value;
        growthRates[name] = previous > 0 ? ((current - previous) / previous * 100) : 0;
      } else {
        growthRates[name] = 0;
      }
    });

    // Calculate goal stats
    const activeGoals = goals.filter((g: any) => g.status === 'active' || g.status === 'in_progress');
    const completedGoals = goals.filter((g: any) => g.status === 'completed');
    
    // Latest values
    const latestUsers = metricsByName['users']?.[0]?.value || 0;
    const latestRevenue = metricsByName['revenue']?.[0]?.value || 0;
    const latestMRR = metricsByName['mrr']?.[0]?.value || 0;
    const latestChurn = metricsByName['churn']?.[0]?.value || 0;
    const latestCAC = metricsByName['cac']?.[0]?.value || 0;
    const latestLTV = metricsByName['ltv']?.[0]?.value || 0;
    const latestNPS = metricsByName['nps']?.[0]?.value || 0;
    const latestDAU = metricsByName['dau']?.[0]?.value || 0;
    const latestMAU = metricsByName['mau']?.[0]?.value || 0;

    return {
      userId,
      goals: {
        all: goals,
        active: activeGoals,
        completed: completedGoals,
        totalCount: goals.length,
        completedCount: completedGoals.length,
        completionRate: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0
      },
      metrics: {
        current: {
          users: latestUsers,
          revenue: latestRevenue,
          mrr: latestMRR,
          churn: latestChurn,
          cac: latestCAC,
          ltv: latestLTV,
          nps: latestNPS,
          dau: latestDAU,
          mau: latestMAU
        },
        growth: growthRates,
        history: metricsByName,
        rawHistory: metrics,
        primaryConfig: primaryMetrics || { metric1_name: 'users', metric2_name: 'revenue' }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[METRICS-DATA] ERROR:', error);
    throw error;
  }
}

// Calculate industry benchmarks
function getIndustryBenchmarks(industry: string, stage: string) {
  const benchmarks: Record<string, Record<string, any>> = {
    'SaaS': {
      'seed': {
        monthly_growth: 15,
        churn_rate: 5,
        ltv_cac_ratio: 3,
        nps: 30,
        conversion_rate: 2
      },
      'series_a': {
        monthly_growth: 10,
        churn_rate: 3,
        ltv_cac_ratio: 4,
        nps: 40,
        conversion_rate: 3
      },
      'series_b': {
        monthly_growth: 7,
        churn_rate: 2,
        ltv_cac_ratio: 5,
        nps: 50,
        conversion_rate: 4
      }
    },
    'fintech': {
      'seed': {
        monthly_growth: 12,
        churn_rate: 4,
        ltv_cac_ratio: 4,
        nps: 35,
        conversion_rate: 1.5
      },
      'series_a': {
        monthly_growth: 8,
        churn_rate: 2.5,
        ltv_cac_ratio: 5,
        nps: 45,
        conversion_rate: 2.5
      }
    },
    'ecommerce': {
      'seed': {
        monthly_growth: 20,
        churn_rate: 8,
        ltv_cac_ratio: 2,
        nps: 25,
        conversion_rate: 3
      },
      'series_a': {
        monthly_growth: 15,
        churn_rate: 6,
        ltv_cac_ratio: 3,
        nps: 35,
        conversion_rate: 4
      }
    }
  };

  const industryBenchmarks = benchmarks[industry] || benchmarks['SaaS'];
  return industryBenchmarks[stage] || industryBenchmarks['seed'];
}

// ==============================================
// API ENDPOINTS
// ==============================================

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'metrics-data-api',
    timestamp: new Date().toISOString()
  });
});

// Get complete startup metrics context
app.get('/context', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    const context = await getStartupMetricsContext(c.env.DB, user.userId);
    return c.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error getting context:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all goals for a user
app.get('/goals', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    // First, get the user's team
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(user.userId).first();

    let result;
    if (teamMembership && teamMembership.team_id) {
      // Get goals for all team members
      result = await c.env.DB.prepare(`
        SELECT 
          g.id, 
          g.description, 
          g.status, 
          g.target_value, 
          g.current_value, 
          g.deadline, 
          g.category, 
          g.created_at, 
          g.updated_at,
          g.user_id,
          u.name as creator_name,
          u.avatar_url as creator_avatar
        FROM goals g
        INNER JOIN startup_team_members stm ON g.user_id = stm.user_id
        LEFT JOIN users u ON g.user_id = u.id
        WHERE stm.team_id = ?
        ORDER BY g.created_at DESC
      `).bind(teamMembership.team_id).all();
    } else {
      // Fallback to user's own goals if not in a team
      result = await c.env.DB.prepare(`
        SELECT 
          id, 
          description, 
          status, 
          target_value, 
          current_value, 
          deadline, 
          category, 
          created_at, 
          updated_at,
          user_id
        FROM goals 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `).bind(user.userId).all();
    }

    const goals = result.results || [];
    const activeGoals = goals.filter((g: any) => g.status === 'active' || g.status === 'in_progress');
    const completedGoals = goals.filter((g: any) => g.status === 'completed');

    return c.json({
      success: true,
      goals: goals,
      summary: {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        completionRate: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0
      }
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error getting goals:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get metrics history
app.get('/metrics', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const days = parseInt(c.req.query('days') || '90');
  
  try {
    // Check if user is part of a team
    const teamMembership = await c.env.DB.prepare(`
      SELECT team_id
      FROM startup_team_members
      WHERE user_id = ?
      ORDER BY is_creator DESC, joined_at ASC
      LIMIT 1
    `).bind(user.userId).first();

    let result;
    if (teamMembership && teamMembership.team_id) {
      // Get metrics for all team members
      result = await c.env.DB.prepare(`
        SELECT um.metric_name, um.metric_value, um.recorded_date
        FROM user_metrics um
        INNER JOIN startup_team_members stm ON um.user_id = stm.user_id
        WHERE stm.team_id = ?
        ORDER BY um.recorded_date DESC
        LIMIT ?
      `).bind(teamMembership.team_id, days * 2).all();
    } else {
      // Fallback to user's own metrics if not in a team
      result = await c.env.DB.prepare(`
        SELECT metric_name, metric_value, recorded_date
        FROM user_metrics 
        WHERE user_id = ? 
        ORDER BY recorded_date DESC
        LIMIT ?
      `).bind(user.userId, days * 2).all();
    }

    const metrics = result.results || [];
    
    // Group by metric name
    const grouped: Record<string, any[]> = {};
    metrics.forEach((m: any) => {
      if (!grouped[m.metric_name]) {
        grouped[m.metric_name] = [];
      }
      grouped[m.metric_name].push({
        value: m.metric_value,
        date: m.recorded_date
      });
    });

    // Calculate latest values and growth
    const current: Record<string, number> = {};
    const growth: Record<string, number> = {};
    
    Object.keys(grouped).forEach(name => {
      const values = grouped[name];
      current[name] = values[0]?.value || 0;
      if (values.length >= 2) {
        const prev = values[1].value;
        growth[name] = prev > 0 ? ((current[name] - prev) / prev * 100) : 0;
      } else {
        growth[name] = 0;
      }
    });

    return c.json({
      success: true,
      metrics: {
        current,
        growth,
        history: grouped
      }
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error getting metrics:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get benchmarks for comparison
app.get('/benchmarks', jwtMiddleware, async (c) => {
  const industry = c.req.query('industry') || 'SaaS';
  const stage = c.req.query('stage') || 'seed';
  
  const benchmarks = getIndustryBenchmarks(industry, stage);
  
  return c.json({
    success: true,
    industry,
    stage,
    benchmarks
  });
});

// Compare startup metrics to benchmarks
app.post('/compare', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { industry, stage } = await c.req.json();
  
  try {
    const context = await getStartupMetricsContext(c.env.DB, user.userId);
    const benchmarks = getIndustryBenchmarks(industry || 'SaaS', stage || 'seed');
    
    const comparison: Record<string, any> = {};
    
    // Compare growth rate
    const userGrowth = context.metrics.growth['users'] || 0;
    comparison['growth'] = {
      current: userGrowth,
      benchmark: benchmarks.monthly_growth,
      difference: userGrowth - benchmarks.monthly_growth,
      status: userGrowth >= benchmarks.monthly_growth ? 'above' : 'below'
    };
    
    // Compare churn
    const userChurn = context.metrics.current.churn || 0;
    comparison['churn'] = {
      current: userChurn,
      benchmark: benchmarks.churn_rate,
      difference: benchmarks.churn_rate - userChurn, // Lower is better
      status: userChurn <= benchmarks.churn_rate ? 'above' : 'below'
    };
    
    // Compare LTV/CAC ratio
    const ltv = context.metrics.current.ltv || 0;
    const cac = context.metrics.current.cac || 1;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    comparison['ltv_cac'] = {
      current: ltvCacRatio,
      benchmark: benchmarks.ltv_cac_ratio,
      difference: ltvCacRatio - benchmarks.ltv_cac_ratio,
      status: ltvCacRatio >= benchmarks.ltv_cac_ratio ? 'above' : 'below'
    };
    
    // Compare NPS
    const userNPS = context.metrics.current.nps || 0;
    comparison['nps'] = {
      current: userNPS,
      benchmark: benchmarks.nps,
      difference: userNPS - benchmarks.nps,
      status: userNPS >= benchmarks.nps ? 'above' : 'below'
    };
    
    // Calculate overall score
    let aboveCount = 0;
    Object.values(comparison).forEach((c: any) => {
      if (c.status === 'above') aboveCount++;
    });
    const overallScore = Math.round((aboveCount / Object.keys(comparison).length) * 100);

    return c.json({
      success: true,
      comparison,
      overallScore,
      industry,
      stage,
      benchmarks
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error comparing metrics:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update goal progress
app.post('/goals/:goalId/progress', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const goalId = c.req.param('goalId');
  const { currentValue, status } = await c.req.json();
  
  try {
    // Verify goal belongs to user
    const goal = await c.env.DB.prepare(`
      SELECT id, target_value FROM goals WHERE id = ? AND user_id = ?
    `).bind(goalId, user.userId).first();
    
    if (!goal) {
      return c.json({ success: false, error: 'Goal not found' }, 404);
    }
    
    // Update goal
    const newStatus = status || (currentValue >= goal.target_value ? 'completed' : 'active');
    
    await c.env.DB.prepare(`
      UPDATE goals 
      SET current_value = ?, status = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(currentValue, newStatus, goalId, user.userId).run();

    return c.json({
      success: true,
      goalId,
      currentValue,
      status: newStatus
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error updating goal:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Add metric value
app.post('/metrics/add', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { metricName, value, date } = await c.req.json();
  
  if (!metricName || value === undefined) {
    return c.json({ success: false, error: 'metricName and value are required' }, 400);
  }
  
  try {
    const recordDate = date || new Date().toISOString().split('T')[0];
    
    await c.env.DB.prepare(`
      INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date)
      VALUES (?, ?, ?, ?)
    `).bind(user.userId, metricName, value, recordDate).run();

    return c.json({
      success: true,
      metric: {
        name: metricName,
        value,
        date: recordDate
      }
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error adding metric:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate metrics report
app.post('/report', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const { period } = await c.req.json();
  
  try {
    const context = await getStartupMetricsContext(c.env.DB, user.userId);
    
    // Build report
    const report = {
      period: period || 'weekly',
      generatedAt: new Date().toISOString(),
      userId: user.userId,
      summary: {
        totalGoals: context.goals.totalCount,
        completedGoals: context.goals.completedCount,
        completionRate: context.goals.completionRate,
        activeGoals: context.goals.active.length
      },
      metrics: {
        current: context.metrics.current,
        growth: context.metrics.growth
      },
      highlights: [] as string[],
      concerns: [] as string[],
      recommendations: [] as string[]
    };
    
    // Generate highlights
    Object.entries(context.metrics.growth).forEach(([name, growth]) => {
      if (typeof growth === 'number' && growth > 10) {
        report.highlights.push(`${name} creció ${growth.toFixed(1)}% - ¡Excelente!`);
      }
    });
    
    if (context.goals.completionRate > 70) {
      report.highlights.push(`Tasa de completitud de objetivos del ${context.goals.completionRate}%`);
    }
    
    // Generate concerns
    Object.entries(context.metrics.growth).forEach(([name, growth]) => {
      if (typeof growth === 'number' && growth < -5) {
        report.concerns.push(`${name} disminuyó ${Math.abs(growth).toFixed(1)}%`);
      }
    });
    
    if (context.metrics.current.churn > 5) {
      report.concerns.push(`Churn rate alto: ${context.metrics.current.churn}%`);
    }
    
    // Generate recommendations
    if (context.goals.active.length === 0) {
      report.recommendations.push('Crea nuevos objetivos para mantener el momentum');
    }
    
    if (Object.keys(context.metrics.history).length < 3) {
      report.recommendations.push('Registra más métricas para un análisis más completo');
    }
    
    const ltv = context.metrics.current.ltv || 0;
    const cac = context.metrics.current.cac || 1;
    if (cac > 0 && ltv / cac < 3) {
      report.recommendations.push('Mejora tu ratio LTV/CAC (actualmente: ' + (ltv/cac).toFixed(1) + 'x)');
    }

    return c.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('[METRICS-DATA] Error generating report:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get leaderboard data for agents
app.get('/leaderboard', jwtMiddleware, async (c) => {
  const type = c.req.query('type') || 'global';
  
  try {
    if (type === 'global') {
      // Get projects
      const projects = await c.env.DB.prepare(`
        SELECT 
          p.id, p.title, p.description, p.rating_average, p.votes_count,
          u.name as founder_name, 'project' as type
        FROM projects p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.rating_average DESC, p.votes_count DESC
        LIMIT 10
      `).all();
      
      // Get products
      const products = await c.env.DB.prepare(`
        SELECT 
          bp.id, bp.title, bp.description,
          COALESCE(bp.rating_average, 0) as rating_average,
          COALESCE(bp.votes_count, 0) as votes_count,
          u.name as founder_name, 'product' as type
        FROM beta_products bp
        JOIN users u ON bp.company_user_id = u.id
        ORDER BY bp.rating_average DESC, bp.votes_count DESC
        LIMIT 10
      `).all();
      
      const allItems = [
        ...(projects.results || []),
        ...(products.results || [])
      ].sort((a: any, b: any) => {
        if (b.rating_average !== a.rating_average) {
          return b.rating_average - a.rating_average;
        }
        return b.votes_count - a.votes_count;
      }).slice(0, 10);

      return c.json({ success: true, leaderboard: allItems, type: 'global' });
    }
    
    if (type === 'goals') {
      const leaderboard = await c.env.DB.prepare(`
        SELECT 
          u.id, u.name,
          COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals,
          COUNT(g.id) as total_goals
        FROM users u
        LEFT JOIN goals g ON u.id = g.user_id
        GROUP BY u.id, u.name
        HAVING COUNT(g.id) > 0
        ORDER BY completed_goals DESC
        LIMIT 10
      `).all();

      return c.json({ success: true, leaderboard: leaderboard.results || [], type: 'goals' });
    }

    return c.json({ success: false, error: 'Invalid leaderboard type' }, 400);
  } catch (error) {
    console.error('[METRICS-DATA] Error getting leaderboard:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
