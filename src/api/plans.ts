/**
 * Pricing Plans API
 * Manages pricing plans, subscriptions, and usage limits
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { requireAuth, requireRole } from './auth';

const plans = new Hono<{ Bindings: Bindings }>();

// ============================================
// PUBLIC ENDPOINTS - Pricing Plans
// ============================================

/**
 * Get all available pricing plans (public)
 */
plans.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT 
      id, name, display_name, description, 
      price_monthly, price_yearly, 
      validators_limit, products_limit, 
      features, display_order,
      plan_type, category
    FROM pricing_plans
    WHERE is_active = 1
    ORDER BY display_order ASC
  `).all();
  
  return c.json({ plans: results });
});

/**
 * Get specific plan details (public)
 */
plans.get('/:id', async (c) => {
  const planId = c.req.param('id');
  
  const plan = await c.env.DB.prepare(`
    SELECT 
      id, name, display_name, description, 
      price_monthly, price_yearly, 
      validators_limit, products_limit, 
      features, display_order
    FROM pricing_plans
    WHERE id = ? AND is_active = 1
  `).bind(planId).first();
  
  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }
  
  return c.json({ plan });
});

// ============================================
// AUTHENTICATED ENDPOINTS - User Plans
// ============================================

/**
 * Get current user's plan and usage
 */
plans.get('/my/current', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const userPlan = await c.env.DB.prepare(`
    SELECT 
      u.id as user_id,
      u.plan_id,
      u.plan_status,
      u.plan_started_at,
      u.plan_expires_at,
      u.billing_cycle,
      u.validators_used,
      u.products_count,
      p.name as plan_name,
      p.display_name as plan_display_name,
      p.description as plan_description,
      p.price_monthly,
      p.price_yearly,
      p.validators_limit,
      p.products_limit,
      p.features
    FROM users u
    JOIN pricing_plans p ON u.plan_id = p.id
    WHERE u.id = ?
  `).bind(userId).first();
  
  if (!userPlan) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Calculate usage percentages
  const validatorsUsagePercent = userPlan.validators_limit === -1 
    ? 0 
    : Math.round((userPlan.validators_used / userPlan.validators_limit) * 100);
  
  const productsUsagePercent = userPlan.products_limit === -1
    ? 0
    : Math.round((userPlan.products_count / userPlan.products_limit) * 100);
  
  return c.json({
    user_plan: userPlan,
    usage: {
      validators: {
        used: userPlan.validators_used,
        limit: userPlan.validators_limit,
        percentage: validatorsUsagePercent,
        is_unlimited: userPlan.validators_limit === -1
      },
      products: {
        used: userPlan.products_count,
        limit: userPlan.products_limit,
        percentage: productsUsagePercent,
        is_unlimited: userPlan.products_limit === -1
      }
    }
  });
});

/**
 * Check if user can perform action (internal helper exported as endpoint)
 */
plans.get('/my/check-limit', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { action, amount = '1' } = c.req.query();
  
  if (!action || !['validators', 'products'].includes(action)) {
    return c.json({ error: 'Invalid action. Use "validators" or "products"' }, 400);
  }
  
  const amountNum = parseInt(amount);
  
  const user = await c.env.DB.prepare(`
    SELECT 
      u.validators_used,
      u.products_count,
      p.validators_limit,
      p.products_limit
    FROM users u
    JOIN pricing_plans p ON u.plan_id = p.id
    WHERE u.id = ?
  `).bind(userId).first() as any;
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  let canProceed = false;
  let currentUsage = 0;
  let limit = 0;
  let remaining = 0;
  
  if (action === 'validators') {
    limit = user.validators_limit;
    currentUsage = user.validators_used;
    remaining = limit === -1 ? -1 : limit - currentUsage;
    canProceed = limit === -1 || (currentUsage + amountNum) <= limit;
  } else if (action === 'products') {
    limit = user.products_limit;
    currentUsage = user.products_count;
    remaining = limit === -1 ? -1 : limit - currentUsage;
    canProceed = limit === -1 || (currentUsage + amountNum) <= limit;
  }
  
  return c.json({
    can_proceed: canProceed,
    action,
    current_usage: currentUsage,
    limit,
    remaining,
    requested_amount: amountNum,
    is_unlimited: limit === -1
  });
});

/**
 * Get user's plan history
 */
plans.get('/my/history', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      ph.*,
      p.display_name as plan_name,
      prev_p.display_name as previous_plan_name
    FROM plan_usage_history ph
    JOIN pricing_plans p ON ph.plan_id = p.id
    LEFT JOIN pricing_plans prev_p ON ph.previous_plan_id = prev_p.id
    WHERE ph.user_id = ?
    ORDER BY ph.created_at DESC
  `).bind(userId).all();
  
  return c.json({ history: results });
});

// ============================================
// PLAN UPGRADE/CHANGE REQUESTS
// ============================================

/**
 * Request plan upgrade/downgrade
 */
plans.post('/my/upgrade-request', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { requested_plan_id, reason } = await c.req.json();
  
  if (!requested_plan_id) {
    return c.json({ error: 'requested_plan_id is required' }, 400);
  }
  
  // Get current plan
  const user = await c.env.DB.prepare(
    'SELECT plan_id FROM users WHERE id = ?'
  ).bind(userId).first() as any;
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Check if requested plan exists
  const requestedPlan = await c.env.DB.prepare(
    'SELECT id FROM pricing_plans WHERE id = ? AND is_active = 1'
  ).bind(requested_plan_id).first();
  
  if (!requestedPlan) {
    return c.json({ error: 'Invalid plan ID' }, 400);
  }
  
  // Check if there's already a pending request
  const existingRequest = await c.env.DB.prepare(`
    SELECT id FROM plan_upgrade_requests 
    WHERE user_id = ? AND status = 'pending'
  `).bind(userId).first();
  
  if (existingRequest) {
    return c.json({ error: 'You already have a pending upgrade request' }, 400);
  }
  
  // Create upgrade request
  const result = await c.env.DB.prepare(`
    INSERT INTO plan_upgrade_requests (
      user_id, current_plan_id, requested_plan_id, reason, status
    ) VALUES (?, ?, ?, ?, 'pending')
  `).bind(userId, user.plan_id, requested_plan_id, reason || null).run();
  
  return c.json({
    id: result.meta.last_row_id,
    message: 'Upgrade request submitted successfully. Our team will review it shortly.'
  });
});

/**
 * Get user's upgrade requests
 */
plans.get('/my/upgrade-requests', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      ur.*,
      cp.display_name as current_plan_name,
      rp.display_name as requested_plan_name,
      reviewer.name as reviewer_name
    FROM plan_upgrade_requests ur
    JOIN pricing_plans cp ON ur.current_plan_id = cp.id
    JOIN pricing_plans rp ON ur.requested_plan_id = rp.id
    LEFT JOIN users reviewer ON ur.reviewed_by = reviewer.id
    WHERE ur.user_id = ?
    ORDER BY ur.created_at DESC
  `).bind(userId).all();
  
  return c.json({ requests: results });
});

// ============================================
// ADMIN ENDPOINTS - Plan Management
// ============================================

/**
 * Get all upgrade requests (admin only)
 */
plans.get('/admin/upgrade-requests', requireAuth, requireRole(['admin']), async (c) => {
  const { status = 'pending' } = c.req.query();
  
  let query = `
    SELECT 
      ur.*,
      u.name as user_name,
      u.email as user_email,
      cp.display_name as current_plan_name,
      rp.display_name as requested_plan_name,
      reviewer.name as reviewer_name
    FROM plan_upgrade_requests ur
    JOIN users u ON ur.user_id = u.id
    JOIN pricing_plans cp ON ur.current_plan_id = cp.id
    JOIN pricing_plans rp ON ur.requested_plan_id = rp.id
    LEFT JOIN users reviewer ON ur.reviewed_by = reviewer.id
  `;
  
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE ur.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY ur.created_at DESC';
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ requests: results });
});

/**
 * Approve/reject upgrade request (admin only)
 */
plans.post('/admin/upgrade-requests/:id/review', requireAuth, requireRole(['admin']), async (c) => {
  const adminId = c.get('userId');
  const requestId = c.req.param('id');
  const { action, note } = await c.req.json(); // action: 'approve' or 'reject'
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return c.json({ error: 'Invalid action. Use "approve" or "reject"' }, 400);
  }
  
  // Get request details
  const request = await c.env.DB.prepare(`
    SELECT * FROM plan_upgrade_requests WHERE id = ?
  `).bind(requestId).first() as any;
  
  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }
  
  if (request.status !== 'pending') {
    return c.json({ error: 'Request already reviewed' }, 400);
  }
  
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  
  // Update request status
  await c.env.DB.prepare(`
    UPDATE plan_upgrade_requests 
    SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(newStatus, adminId, requestId).run();
  
  // If approved, update user's plan
  if (action === 'approve') {
    await c.env.DB.prepare(`
      UPDATE users 
      SET 
        plan_id = ?,
        plan_started_at = CURRENT_TIMESTAMP,
        plan_expires_at = datetime(CURRENT_TIMESTAMP, '+30 days')
      WHERE id = ?
    `).bind(request.requested_plan_id, request.user_id).run();
    
    // Log in plan history
    await c.env.DB.prepare(`
      INSERT INTO plan_usage_history (
        user_id, plan_id, previous_plan_id, action, started_at, expires_at
      ) VALUES (?, ?, ?, 'upgrade', CURRENT_TIMESTAMP, datetime(CURRENT_TIMESTAMP, '+30 days'))
    `).bind(request.user_id, request.requested_plan_id, request.current_plan_id).run();
  }
  
  return c.json({
    message: `Request ${newStatus} successfully`,
    status: newStatus
  });
});

/**
 * Manually change user's plan (admin only)
 */
plans.post('/admin/users/:userId/change-plan', requireAuth, requireRole(['admin']), async (c) => {
  const targetUserId = c.req.param('userId');
  const { plan_id, billing_cycle = 'monthly', duration_days = 30 } = await c.req.json();
  
  if (!plan_id) {
    return c.json({ error: 'plan_id is required' }, 400);
  }
  
  // Check if plan exists
  const plan = await c.env.DB.prepare(
    'SELECT id FROM pricing_plans WHERE id = ? AND is_active = 1'
  ).bind(plan_id).first();
  
  if (!plan) {
    return c.json({ error: 'Invalid plan ID' }, 400);
  }
  
  // Get current plan
  const user = await c.env.DB.prepare(
    'SELECT plan_id FROM users WHERE id = ?'
  ).bind(targetUserId).first() as any;
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Update user's plan
  await c.env.DB.prepare(`
    UPDATE users 
    SET 
      plan_id = ?,
      billing_cycle = ?,
      plan_started_at = CURRENT_TIMESTAMP,
      plan_expires_at = datetime(CURRENT_TIMESTAMP, '+${duration_days} days'),
      plan_status = 'active'
    WHERE id = ?
  `).bind(plan_id, billing_cycle, targetUserId).run();
  
  // Log in plan history
  await c.env.DB.prepare(`
    INSERT INTO plan_usage_history (
      user_id, plan_id, previous_plan_id, action, started_at, 
      expires_at, billing_cycle
    ) VALUES (?, ?, ?, 'admin_change', CURRENT_TIMESTAMP, 
      datetime(CURRENT_TIMESTAMP, '+${duration_days} days'), ?)
  `).bind(targetUserId, plan_id, user.plan_id, billing_cycle).run();
  
  return c.json({
    message: 'Plan changed successfully',
    user_id: targetUserId,
    new_plan_id: plan_id
  });
});

/**
 * Get plan usage statistics (admin only)
 */
plans.get('/admin/statistics', requireAuth, requireRole(['admin']), async (c) => {
  // Get plan distribution
  const { results: planDistribution } = await c.env.DB.prepare(`
    SELECT 
      p.display_name as plan_name,
      COUNT(u.id) as user_count,
      SUM(u.validators_used) as total_validators_used,
      SUM(u.products_count) as total_products
    FROM pricing_plans p
    LEFT JOIN users u ON p.id = u.plan_id
    WHERE u.role = 'founder'
    GROUP BY p.id, p.display_name
    ORDER BY p.display_order
  `).all();
  
  // Get total revenue (from subscription_payments)
  const revenueStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_revenue,
      AVG(amount) as avg_payment
    FROM subscription_payments
    WHERE payment_status = 'completed'
  `).first();
  
  // Get active subscriptions
  const activeSubscriptions = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM users
    WHERE plan_status = 'active' AND role = 'founder'
  `).first() as any;
  
  return c.json({
    plan_distribution: planDistribution,
    revenue: revenueStats,
    active_subscriptions: activeSubscriptions.count
  });
});

// ============================================
// HELPER FUNCTIONS (exported for use in other modules)
// ============================================

/**
 * Check if user has reached their limit
 * Returns { allowed: boolean, message?: string }
 */
export async function checkPlanLimit(
  db: any,
  userId: number,
  limitType: 'validators' | 'products',
  requestedAmount: number = 1
): Promise<{ allowed: boolean; message?: string; current: number; limit: number }> {
  const user = await db.prepare(`
    SELECT 
      u.validators_used,
      u.products_count,
      p.validators_limit,
      p.products_limit,
      p.display_name as plan_name
    FROM users u
    JOIN pricing_plans p ON u.plan_id = p.id
    WHERE u.id = ?
  `).bind(userId).first() as any;
  
  if (!user) {
    return { allowed: false, message: 'User not found', current: 0, limit: 0 };
  }
  
  let currentUsage: number;
  let limit: number;
  
  if (limitType === 'validators') {
    currentUsage = user.validators_used;
    limit = user.validators_limit;
  } else {
    currentUsage = user.products_count;
    limit = user.products_limit;
  }
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: currentUsage, limit: -1 };
  }
  
  const wouldExceed = (currentUsage + requestedAmount) > limit;
  
  if (wouldExceed) {
    return {
      allowed: false,
      message: `Your ${user.plan_name} plan allows ${limit} ${limitType} maximum. You've used ${currentUsage}. Please upgrade your plan.`,
      current: currentUsage,
      limit
    };
  }
  
  return { allowed: true, current: currentUsage, limit };
}

/**
 * Increment user's usage counter
 */
export async function incrementUsage(
  db: any,
  userId: number,
  usageType: 'validators' | 'products',
  amount: number = 1
): Promise<void> {
  const field = usageType === 'validators' ? 'validators_used' : 'products_count';
  
  await db.prepare(`
    UPDATE users 
    SET ${field} = ${field} + ?
    WHERE id = ?
  `).bind(amount, userId).run();
}

/**
 * Decrement user's usage counter
 */
export async function decrementUsage(
  db: any,
  userId: number,
  usageType: 'validators' | 'products',
  amount: number = 1
): Promise<void> {
  const field = usageType === 'validators' ? 'validators_used' : 'products_count';
  
  await db.prepare(`
    UPDATE users 
    SET ${field} = GREATEST(0, ${field} - ?)
    WHERE id = ?
  `).bind(amount, userId).run();
}

export default plans;
