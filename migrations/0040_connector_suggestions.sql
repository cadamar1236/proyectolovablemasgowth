-- Migration: Add AI Connector Suggestions Table
-- Stores suggested connections from the AI Connector

CREATE TABLE IF NOT EXISTS connector_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  suggested_user_id INTEGER NOT NULL,
  score REAL DEFAULT 0.5,
  reason TEXT,
  query TEXT,
  status TEXT DEFAULT 'pending', -- pending, contacted, dismissed
  created_at TEXT DEFAULT (datetime('now')),
  contacted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, suggested_user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_connector_suggestions_user ON connector_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_connector_suggestions_status ON connector_suggestions(status);

-- Table to store user interests/preferences for better matching
CREATE TABLE IF NOT EXISTS user_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  interest_type TEXT NOT NULL, -- 'looking_for', 'can_offer', 'industry', 'skill'
  interest_value TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_type ON user_interests(interest_type);
