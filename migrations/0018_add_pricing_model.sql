-- Add pricing_model column to beta_products table
-- This allows classification of products by their pricing strategy

ALTER TABLE beta_products ADD COLUMN pricing_model TEXT DEFAULT 'subscription_monthly';
-- Options: free, freemium, one_time, subscription_monthly, subscription_yearly, usage_based, enterprise

-- Create index for efficient filtering by pricing model
CREATE INDEX IF NOT EXISTS idx_beta_products_pricing_model ON beta_products(pricing_model);
