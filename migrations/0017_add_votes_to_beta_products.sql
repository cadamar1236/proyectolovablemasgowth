-- Add voting columns to beta_products table
-- These columns track aggregated vote statistics for products

-- Add votes count column (total number of votes)
ALTER TABLE beta_products ADD COLUMN votes_count INTEGER DEFAULT 0;

-- Add rating average column (average of all ratings)
ALTER TABLE beta_products ADD COLUMN rating_average REAL DEFAULT 0.0;

-- Create indexes for efficient sorting by votes and ratings
CREATE INDEX IF NOT EXISTS idx_beta_products_votes ON beta_products(votes_count);
CREATE INDEX IF NOT EXISTS idx_beta_products_rating ON beta_products(rating_average);

-- Update existing products to calculate their current vote stats
UPDATE beta_products
SET
  votes_count = (
    SELECT COUNT(*)
    FROM product_votes
    WHERE product_id = beta_products.id
  ),
  rating_average = (
    SELECT COALESCE(AVG(rating), 0.0)
    FROM product_votes
    WHERE product_id = beta_products.id
  )
WHERE id IN (SELECT DISTINCT product_id FROM product_votes);
