-- Migration: Extend goals table with additional fields
-- Date: 2025-12-27
-- Description: Adds target_value, current_value, and deadline to goals table

-- Add new columns to goals table (SQLite uses ALTER TABLE ADD COLUMN)
ALTER TABLE goals ADD COLUMN target_value INTEGER DEFAULT 100;
ALTER TABLE goals ADD COLUMN current_value INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN deadline DATETIME;
ALTER TABLE goals ADD COLUMN category TEXT DEFAULT 'general';

-- Create dashboard_goals table as an alias view for compatibility
CREATE TABLE IF NOT EXISTS dashboard_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  description TEXT NOT NULL,
  target_value INTEGER DEFAULT 100,
  current_value INTEGER DEFAULT 0,
  deadline DATETIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'deleted')),
  category TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_goals_user_id ON dashboard_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_goals_status ON dashboard_goals(status);
CREATE INDEX IF NOT EXISTS idx_dashboard_goals_deadline ON dashboard_goals(deadline);
