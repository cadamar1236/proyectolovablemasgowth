-- Migration: Stripe Integration
-- Adds Stripe-related fields and tables for payment processing

-- Add Stripe fields to pricing_plans
ALTER TABLE pricing_plans ADD COLUMN stripe_price_id_monthly TEXT;
ALTER TABLE pricing_plans ADD COLUMN stripe_price_id_yearly TEXT;
ALTER TABLE pricing_plans ADD COLUMN stripe_product_id TEXT;

-- Add Stripe fields to users
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;

-- Add Stripe fields to subscription_payments
ALTER TABLE subscription_payments ADD COLUMN stripe_session_id TEXT;
ALTER TABLE subscription_payments ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE subscription_payments ADD COLUMN stripe_invoice_id TEXT;

-- Create Stripe events log table (for webhook debugging and idempotency)
CREATE TABLE IF NOT EXISTS stripe_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL, -- JSON
  processed BOOLEAN DEFAULT 0,
  processed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_session_id ON subscription_payments(stripe_session_id);
