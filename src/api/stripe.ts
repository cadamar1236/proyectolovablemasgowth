/**
 * Stripe Payment Integration API
 * Handles subscription payments, checkouts, and webhooks
 */

import { Hono } from 'hono';
import Stripe from 'stripe';
import type { Bindings } from '../types';
import { requireAuth } from './auth';

const stripeAPI = new Hono<{ Bindings: Bindings }>();

/**
 * Initialize Stripe client
 */
function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(
  stripe: Stripe,
  db: any,
  userId: number,
  email: string,
  name: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const user = await db.prepare(`
    SELECT stripe_customer_id FROM users WHERE id = ?
  `).bind(userId).first() as any;

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId.toString(),
    },
  });

  // Save customer ID to database
  await db.prepare(`
    UPDATE users SET stripe_customer_id = ? WHERE id = ?
  `).bind(customer.id, userId).run();

  return customer.id;
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 */
stripeAPI.post('/create-checkout-session', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number;
    const { plan_id, billing_cycle = 'monthly' } = await c.req.json();

    if (!plan_id) {
      return c.json({ error: 'plan_id is required' }, 400);
    }

    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return c.json({ error: 'billing_cycle must be "monthly" or "yearly"' }, 400);
    }

    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, stripe_customer_id FROM users WHERE id = ?
    `).bind(userId).first() as any;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get plan details
    const plan = await c.env.DB.prepare(`
      SELECT * FROM pricing_plans WHERE id = ? AND is_active = 1
    `).bind(plan_id).first() as any;

    if (!plan) {
      return c.json({ error: 'Plan not found' }, 404);
    }

    // Initialize Stripe
    const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      stripe,
      c.env.DB,
      userId,
      user.email,
      user.name
    );

    // Determine price and Stripe price ID
    const amount = billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const stripePriceId = billing_cycle === 'monthly' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_yearly;

    // If plan has Stripe price ID, use it; otherwise create a one-time payment
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: stripePriceId ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      success_url: `${new URL(c.req.url).origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(c.req.url).origin}/pricing?payment=cancelled`,
      metadata: {
        user_id: userId.toString(),
        plan_id: plan_id.toString(),
        billing_cycle,
      },
    };

    if (stripePriceId) {
      // Use Stripe Price ID for subscription
      sessionParams.line_items = [{
        price: stripePriceId,
        quantity: 1,
      }];
      sessionParams.subscription_data = {
        metadata: {
          user_id: userId.toString(),
          plan_id: plan_id.toString(),
        },
      };
    } else {
      // Create one-time payment
      sessionParams.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.display_name,
            description: plan.description,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
          ...(billing_cycle === 'yearly' && {
            recurring: {
              interval: 'year',
            },
          }),
          ...(billing_cycle === 'monthly' && {
            recurring: {
              interval: 'month',
            },
          }),
        },
        quantity: 1,
      }];
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Log payment attempt
    await c.env.DB.prepare(`
      INSERT INTO subscription_payments (
        user_id, plan_id, amount, currency, billing_cycle,
        payment_status, stripe_session_id
      ) VALUES (?, ?, ?, 'USD', ?, 'pending', ?)
    `).bind(userId, plan_id, amount, billing_cycle, session.id).run();

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return c.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, 500);
  }
});

/**
 * Get Stripe Publishable Key
 * GET /api/stripe/config
 */
stripeAPI.get('/config', async (c) => {
  return c.json({
    publishableKey: c.env.STRIPE_PUBLISHABLE_KEY,
  });
});

/**
 * Get user's payment history
 * GET /api/stripe/payment-history
 */
stripeAPI.get('/payment-history', requireAuth, async (c) => {
  const userId = c.get('userId');

  const { results } = await c.env.DB.prepare(`
    SELECT 
      sp.*,
      pp.display_name as plan_name
    FROM subscription_payments sp
    JOIN pricing_plans pp ON sp.plan_id = pp.id
    WHERE sp.user_id = ?
    ORDER BY sp.created_at DESC
  `).bind(userId).all();

  return c.json({ payments: results });
});

/**
 * Cancel subscription
 * POST /api/stripe/cancel-subscription
 */
stripeAPI.post('/cancel-subscription', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number;

    // Get user's active subscription
    const user = await c.env.DB.prepare(`
      SELECT stripe_customer_id FROM users WHERE id = ?
    `).bind(userId).first() as any;

    if (!user?.stripe_customer_id) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Cancel the first active subscription
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.cancel(subscription.id);

    // Update user status
    await c.env.DB.prepare(`
      UPDATE users SET plan_status = 'cancelled' WHERE id = ?
    `).bind(userId).run();

    return c.json({
      message: 'Subscription cancelled successfully',
      subscription_id: subscription.id,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return c.json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    }, 500);
  }
});

// ============================================
// WEBHOOK ENDPOINT
// ============================================

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 */
stripeAPI.post('/webhook', async (c) => {
  try {
    const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);
    const signature = c.req.header('stripe-signature');
    const body = await c.req.text();

    if (!signature) {
      return c.json({ error: 'Missing stripe-signature header' }, 400);
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        c.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return c.json({ error: `Webhook Error: ${err.message}` }, 400);
    }

    // Check if event already processed (idempotency)
    const existingEvent = await c.env.DB.prepare(`
      SELECT id FROM stripe_events WHERE stripe_event_id = ?
    `).bind(event.id).first();

    if (existingEvent) {
      return c.json({ received: true, message: 'Event already processed' });
    }

    // Log event
    await c.env.DB.prepare(`
      INSERT INTO stripe_events (stripe_event_id, event_type, event_data)
      VALUES (?, ?, ?)
    `).bind(event.id, event.type, JSON.stringify(event.data.object)).run();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(c.env.DB, session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(c.env.DB, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(c.env.DB, invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(c.env.DB, subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await c.env.DB.prepare(`
      UPDATE stripe_events 
      SET processed = 1, processed_at = CURRENT_TIMESTAMP 
      WHERE stripe_event_id = ?
    `).bind(event.id).run();

    return c.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Log error in stripe_events
    if (c.req.header('stripe-signature')) {
      await c.env.DB.prepare(`
        UPDATE stripe_events 
        SET error_message = ?
        WHERE stripe_event_id = ?
      `).bind(error.message, 'unknown').run();
    }

    return c.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, 500);
  }
});

// ============================================
// WEBHOOK EVENT HANDLERS
// ============================================

async function handleCheckoutCompleted(db: any, session: Stripe.Checkout.Session) {
  const userId = parseInt(session.metadata?.user_id || '0');
  const planId = parseInt(session.metadata?.plan_id || '0');
  const billingCycle = session.metadata?.billing_cycle || 'monthly';

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update payment record
  await db.prepare(`
    UPDATE subscription_payments
    SET 
      payment_status = 'completed',
      paid_at = CURRENT_TIMESTAMP,
      stripe_subscription_id = ?
    WHERE stripe_session_id = ?
  `).bind(session.subscription || null, session.id).run();

  // Update user's plan
  const durationDays = billingCycle === 'yearly' ? 365 : 30;
  await db.prepare(`
    UPDATE users
    SET 
      plan_id = ?,
      plan_status = 'active',
      billing_cycle = ?,
      plan_started_at = CURRENT_TIMESTAMP,
      plan_expires_at = datetime(CURRENT_TIMESTAMP, '+${durationDays} days')
    WHERE id = ?
  `).bind(planId, billingCycle, userId).run();

  // Log in plan history
  await db.prepare(`
    INSERT INTO plan_usage_history (
      user_id, plan_id, action, billing_cycle,
      started_at, expires_at, price_paid
    ) VALUES (?, ?, 'purchase', ?, CURRENT_TIMESTAMP, 
      datetime(CURRENT_TIMESTAMP, '+${durationDays} days'), ?)
  `).bind(userId, planId, billingCycle, session.amount_total ? session.amount_total / 100 : 0).run();

  console.log(`✅ Checkout completed for user ${userId}, plan ${planId}`);
}

async function handleInvoicePaymentSucceeded(db: any, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Get user by Stripe customer ID
  const user = await db.prepare(`
    SELECT id FROM users WHERE stripe_customer_id = ?
  `).bind(customerId).first() as any;

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status
  await db.prepare(`
    UPDATE users
    SET 
      plan_status = 'active',
      plan_expires_at = datetime(CURRENT_TIMESTAMP, '+30 days')
    WHERE id = ?
  `).bind(user.id).run();

  console.log(`✅ Invoice payment succeeded for user ${user.id}`);
}

async function handleInvoicePaymentFailed(db: any, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await db.prepare(`
    SELECT id FROM users WHERE stripe_customer_id = ?
  `).bind(customerId).first() as any;

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Mark subscription as failed
  await db.prepare(`
    UPDATE users SET plan_status = 'payment_failed' WHERE id = ?
  `).bind(user.id).run();

  console.log(`❌ Invoice payment failed for user ${user.id}`);
}

async function handleSubscriptionDeleted(db: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await db.prepare(`
    SELECT id FROM users WHERE stripe_customer_id = ?
  `).bind(customerId).first() as any;

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update user to free plan
  await db.prepare(`
    UPDATE users
    SET 
      plan_id = 1,
      plan_status = 'cancelled',
      plan_expires_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(user.id).run();

  console.log(`🗑️ Subscription deleted for user ${user.id}`);
}

export default stripeAPI;
