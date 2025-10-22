-- Migration: Portfolio for Validators
-- Allows validators to showcase their previous work

CREATE TABLE IF NOT EXISTS portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  tags TEXT, -- JSON array of skills/technologies
  featured BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (validator_id) REFERENCES validators(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_validator ON portfolio_items(validator_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(featured, created_at DESC);
