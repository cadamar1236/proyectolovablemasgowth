-- Migration: Add user plan/tier tracking
-- Purpose: Enable LTD pricing tiers (Solo, Growth, Scale) with feature limits
-- Date: 2025

-- Add plan tier and tracking fields to users table
-- Values: NULL (free trial), 'solo', 'growth', 'scale'
ALTER TABLE users ADD COLUMN plan_tier TEXT DEFAULT NULL;

-- Timestamp when the plan was purchased
ALTER TABLE users ADD COLUMN plan_purchased_at DATETIME DEFAULT NULL;

-- Counter for Solo tier limit (5 AI recommendations/month)
ALTER TABLE users ADD COLUMN ai_recommendations_this_month INTEGER DEFAULT 0;

-- Date when the monthly counter resets
ALTER TABLE users ADD COLUMN ai_recommendations_reset_date DATETIME DEFAULT NULL;

-- Create index for faster plan lookups
CREATE INDEX IF NOT EXISTS idx_users_plan_tier ON users(plan_tier);

-- Create plans_usage table for tracking limits
-- Tracks usage metrics for enforcing plan limits
CREATE TABLE IF NOT EXISTS plans_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  active_goals_count INTEGER DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  ai_calls_this_month INTEGER DEFAULT 0,
  last_reset_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plans_usage_user_id ON plans_usage(user_id);

-- Create team_members table for Growth and Scale tiers
-- Team collaboration for Growth (3 max) and Scale (10 max) tiers
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL,
  member_user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (member_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(owner_user_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_user_id);

-- Initialize plans_usage for existing users
INSERT OR IGNORE INTO plans_usage (user_id, active_goals_count, team_members_count, ai_calls_this_month)
SELECT 
  id,
  (SELECT COUNT(*) FROM goals WHERE user_id = users.id AND status = 'active') as active_goals,
  0 as team_members,
  0 as ai_calls
FROM users;
