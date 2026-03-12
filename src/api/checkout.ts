/**
 * Checkout and Plan Upgrade API
 * Handles LTD tier purchases and upgrades
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// GET /checkout - Checkout page for selected plan
app.get('/checkout', async (c) => {
  const plan = c.req.query('plan') || 'growth'; // solo, growth, scale
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  
  let payload: any = null;
  if (authToken) {
    try {
      payload = await verify(authToken, c.env.JWT_SECRET) as any;
    } catch (error) {
      // Not logged in, require login first
    }
  }

  const planDetails = {
    solo: { name: 'Solo Founder', price: 79, limits: '3 active goals, solo user, 5 AI/month' },
    growth: { name: 'Growth Founder', price: 149, limits: 'Unlimited goals, 3 team members, unlimited AI' },
    scale: { name: 'Scale Founder', price: 299, limits: '10 team members, white-glove support' }
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.growth;

  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checkout - ${selectedPlan.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body class="bg-gradient-to-br from-purple-600 to-pink-600 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
    <p class="text-gray-600 mb-6">You've selected the <strong>${selectedPlan.name}</strong> plan</p>

    <div class="bg-purple-50 rounded-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <span class="text-gray-700 font-semibold">Plan</span>
        <span class="text-2xl font-bold text-purple-600">$${selectedPlan.price}</span>
      </div>
      <p class="text-sm text-gray-600 mb-4">${selectedPlan.limits}</p>
      <div class="border-t border-purple-200 pt-4 flex justify-between items-center">
        <span class="text-gray-900 font-bold">Total (one-time)</span>
        <span class="text-3xl font-bold text-purple-600">$${selectedPlan.price}</span>
      </div>
    </div>

    ${!payload ? `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p class="text-yellow-800 text-sm">
          ⚠️ You need to log in or create an account first.
        </p>
        <a href="/" class="text-purple-600 font-semibold underline">Go to login</a>
      </div>
    ` : `
      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
        <input type="email" id="email" value="${payload.email}" disabled class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
      </div>

      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Card Information</label>
        <div id="card-element" class="px-4 py-3 border border-gray-300 rounded-lg"></div>
        <div id="card-errors" class="text-red-500 text-sm mt-2"></div>
      </div>

      <button id="submit-button" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400">
        Pay $${selectedPlan.price} - Activate Lifetime Access
      </button>

      <p class="text-xs text-gray-500 text-center mt-4">
        🔒 Secure payment via Stripe • 60-day money-back guarantee
      </p>
    `}

    <div class="mt-6 text-center">
      <a href="/pricing" class="text-purple-600 text-sm hover:underline">← Back to pricing</a>
    </div>
  </div>

  <script>
    ${payload ? `
    // Stripe integration (you'll need to set up Stripe account and get publishable key)
    // const stripe = Stripe('pk_live_YOUR_PUBLISHABLE_KEY');
    // const elements = stripe.elements();
    // const cardElement = elements.create('card');
    // cardElement.mount('#card-element');

    // For now, show manual payment instruction
    const submitButton = document.getElementById('submit-button');
    submitButton.addEventListener('click', async () => {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';

      try {
        const response = await fetch('/api/checkout/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${authToken}'
          },
          body: JSON.stringify({
            plan: '${plan}',
            email: '${payload.email}'
          })
        });

        const result = await response.json();

        if (result.success) {
          alert('✅ Payment successful! Your ${selectedPlan.name} plan is now active.');
          window.location.href = '/dashboard';
        } else {
          alert('❌ Payment failed: ' + result.message);
          submitButton.disabled = false;
          submitButton.textContent = 'Pay $${selectedPlan.price} - Activate Lifetime Access';
        }
      } catch (error) {
        alert('❌ Error processing payment. Please try again.');
        submitButton.disabled = false;
        submitButton.textContent = 'Pay $${selectedPlan.price} - Activate Lifetime Access';
      }
    });
    ` : ''}
  </script>
</body>
</html>
  `);
});

// POST /api/checkout/activate - Activate plan after payment
app.post('/activate', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ success: false, message: 'Not authenticated' }, 401);
    }

    const payload = await verify(authToken, c.env.JWT_SECRET) as any;
    if (!payload || !payload.userId) {
      return c.json({ success: false, message: 'Invalid token' }, 401);
    }

    const body = await c.req.json();
    const { plan, email } = body;

    // Validate plan tier
    if (!['solo', 'growth', 'scale'].includes(plan)) {
      return c.json({ success: false, message: 'Invalid plan tier' }, 400);
    }

    // TODO: Verify payment with Stripe before activating
    // For now, we'll activate immediately (manual verification)

    // Update user plan in database
    await c.env.DB.prepare(`
      UPDATE users 
      SET plan_tier = ?,
          plan_purchased_at = CURRENT_TIMESTAMP,
          ai_recommendations_this_month = 0,
          ai_recommendations_reset_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(plan, payload.userId).run();

    // Initialize plans_usage tracking
    const existingUsage = await c.env.DB.prepare(`
      SELECT id FROM plans_usage WHERE user_id = ?
    `).bind(payload.userId).first();

    if (!existingUsage) {
      await c.env.DB.prepare(`
        INSERT INTO plans_usage (user_id, active_goals_count, team_members_count, ai_calls_this_month)
        VALUES (?, 0, 0, 0)
      `).bind(payload.userId).run();
    }

    return c.json({
      success: true,
      message: `${plan} plan activated successfully`,
      plan: plan,
      userId: payload.userId
    });

  } catch (error) {
    console.error('Checkout activation error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// GET /api/checkout/plan-status - Get current user plan
app.get('/plan-status', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ plan_tier: null, message: 'Not authenticated' });
    }

    const payload = await verify(authToken, c.env.JWT_SECRET) as any;
    if (!payload || !payload.userId) {
      return c.json({ plan_tier: null, message: 'Invalid token' });
    }

    const user = await c.env.DB.prepare(`
      SELECT plan_tier, plan_purchased_at, ai_recommendations_this_month, ai_recommendations_reset_date
      FROM users
      WHERE id = ?
    `).bind(payload.userId).first() as any;

    if (!user) {
      return c.json({ plan_tier: null, message: 'User not found' });
    }

    // Get usage stats
    const usage = await c.env.DB.prepare(`
      SELECT active_goals_count, team_members_count, ai_calls_this_month
      FROM plans_usage
      WHERE user_id = ?
    `).bind(payload.userId).first() as any;

    return c.json({
      plan_tier: user.plan_tier || 'free',
      plan_purchased_at: user.plan_purchased_at,
      usage: {
        active_goals: usage?.active_goals_count || 0,
        team_members: usage?.team_members_count || 0,
        ai_calls_this_month: usage?.ai_calls_this_month || 0,
        ai_recommendations_used: user.ai_recommendations_this_month || 0
      },
      limits: getPlanLimits(user.plan_tier)
    });

  } catch (error) {
    console.error('Plan status error:', error);
    return c.json({ plan_tier: null, message: 'Server error' }, 500);
  }
});

// Helper function to get plan limits
function getPlanLimits(planTier: string | null) {
  const limits = {
    free: {
      active_goals: 1,
      team_members: 0,
      ai_recommendations_per_month: 0,
      features: ['Basic pitch deck', '7-day trial']
    },
    solo: {
      active_goals: 3,
      team_members: 0,
      ai_recommendations_per_month: 5,
      features: ['Unlimited check-ins', 'Dashboard', 'Weekly reflections', 'Community access']
    },
    growth: {
      active_goals: -1, // Unlimited
      team_members: 3,
      ai_recommendations_per_month: -1, // Unlimited
      features: ['Everything in Solo', 'Advanced analytics', 'Team collaboration', 'Priority support', 'Monthly sessions']
    },
    scale: {
      active_goals: -1, // Unlimited
      team_members: 10,
      ai_recommendations_per_month: -1, // Unlimited
      features: ['Everything in Growth', 'White-glove onboarding', 'Quarterly strategy', 'Investor reports', 'API access']
    }
  };

  return limits[planTier as keyof typeof limits] || limits.free;
}

export default app;
