-- Migration: Add product voting system
-- Creates product_votes table and adds rating fields to beta_products

-- Create product votes table
CREATE TABLE IF NOT EXISTS product_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES beta_products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(product_id, user_id) -- One vote per user per product
);

-- Add rating fields to beta_products table
ALTER TABLE beta_products ADD COLUMN rating_average REAL DEFAULT 0.0;
ALTER TABLE beta_products ADD COLUMN votes_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_votes_product ON product_votes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_votes_user ON product_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_products_rating ON beta_products(rating_average DESC, votes_count DESC);

-- Trigger: Update product rating when vote is inserted
-- CREATE TRIGGER IF NOT EXISTS update_product_rating_insert
-- AFTER INSERT ON product_votes
-- BEGIN
--   UPDATE beta_products
--   SET
--     rating_average = (
--       SELECT AVG(rating)
--       FROM product_votes
--       WHERE product_id = NEW.product_id
--     ),
--     votes_count = (
--       SELECT COUNT(*)
--       FROM product_votes
--       WHERE product_id = NEW.product_id
--     ),
--     updated_at = CURRENT_TIMESTAMP
--   WHERE id = NEW.product_id;
-- END;

-- Trigger: Update product rating when vote is updated
-- CREATE TRIGGER IF NOT EXISTS update_product_rating_update
-- AFTER UPDATE ON product_votes
-- BEGIN
--   UPDATE beta_products
--   SET
--     rating_average = (
--       SELECT AVG(rating)
--       FROM product_votes
--       WHERE product_id = NEW.product_id
--     ),
--     votes_count = (
--       SELECT COUNT(*)
--       FROM product_votes
--       WHERE product_id = NEW.product_id
--     ),
--     updated_at = CURRENT_TIMESTAMP
--   WHERE id = NEW.product_id;
-- END;

-- Trigger: Update product rating when vote is deleted
-- CREATE TRIGGER IF NOT EXISTS update_product_rating_delete
-- AFTER DELETE ON product_votes
-- BEGIN
--   UPDATE beta_products
--   SET
--     rating_average = COALESCE((
--       SELECT AVG(rating)
--       FROM product_votes
--       WHERE product_id = OLD.product_id
--     ), 0.0),
--     votes_count = (
--       SELECT COUNT(*)
--       FROM product_votes
--       WHERE product_id = OLD.product_id
--     ),
--     updated_at = CURRENT_TIMESTAMP
--   WHERE id = OLD.product_id;
-- END;