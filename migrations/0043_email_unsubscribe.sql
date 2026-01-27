-- Migration: Email Unsubscribe Feature
-- Allows users to opt-out of receiving ASTAR weekly emails

-- Add email_unsubscribed field to users table
ALTER TABLE users ADD COLUMN email_unsubscribed INTEGER DEFAULT 0;

-- Create unsubscribe tokens table for secure unsubscribe links
CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens ON email_unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_user ON email_unsubscribe_tokens(user_id);
