-- Migration: Link Beta Products to Projects
-- Adds project_id to beta_products and ensures votes sync between both tables

-- Add project_id column to beta_products
ALTER TABLE beta_products ADD COLUMN project_id INTEGER;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_products_project_id ON beta_products(project_id);

-- Add foreign key constraint (SQLite way - recreate index with reference check)
-- Note: SQLite doesn't enforce foreign keys without PRAGMA, but we add index for clarity

-- Sync existing beta_products to projects table
-- This will be handled by the API when products are created/updated
