-- Migration: Product Goals for Leaderboard Scoring
-- Adds product-specific goals for tracking progress in leaderboard

-- Add product_id column to goals table if it doesn't exist
ALTER TABLE goals ADD COLUMN product_id INTEGER;

-- Add foreign key index
CREATE INDEX IF NOT EXISTS idx_goals_product_id ON goals(product_id);

-- Add columns to beta_products for current metrics if they don't exist
ALTER TABLE beta_products ADD COLUMN current_users INTEGER DEFAULT 0;
ALTER TABLE beta_products ADD COLUMN current_revenue REAL DEFAULT 0;
ALTER TABLE beta_products ADD COLUMN last_metrics_update TEXT;

-- Add leaderboard score cache column
ALTER TABLE beta_products ADD COLUMN leaderboard_score REAL DEFAULT 0;
ALTER TABLE beta_products ADD COLUMN score_breakdown TEXT; -- JSON: {rating: X, growth: Y, goals: Z}

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_products_leaderboard_score ON beta_products(leaderboard_score DESC);
CREATE INDEX IF NOT EXISTS idx_beta_products_current_users ON beta_products(current_users);
CREATE INDEX IF NOT EXISTS idx_beta_products_current_revenue ON beta_products(current_revenue);

-- Insert sample goals for existing products
INSERT OR IGNORE INTO goals (product_id, user_id, description, status)
SELECT 
  p.id,
  p.company_user_id,
  'Reach 1,000 users',
  'active'
FROM beta_products p
WHERE p.status = 'active'
LIMIT 5;

INSERT OR IGNORE INTO goals (product_id, user_id, description, status)
SELECT 
  p.id,
  p.company_user_id,
  'Generate $10,000 in revenue',
  'active'
FROM beta_products p
WHERE p.status = 'active'
LIMIT 5;
