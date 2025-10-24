-- Migration: Validator Ratings
-- Adds rating system for validators by founders

CREATE TABLE IF NOT EXISTS validator_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validator_id INTEGER NOT NULL,
  founder_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (validator_id) REFERENCES validators(id) ON DELETE CASCADE,
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(validator_id, founder_id)
);

CREATE INDEX IF NOT EXISTS idx_validator_ratings_validator ON validator_ratings(validator_id);
CREATE INDEX IF NOT EXISTS idx_validator_ratings_founder ON validator_ratings(founder_id);