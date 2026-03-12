-- Migration: Astro AI Cofounder session data
-- Stores the full startup profile gathered through Astro conversation.
-- This data feeds the leaderboard (via user_metrics sync) and VC matching.

CREATE TABLE IF NOT EXISTS astro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,       -- one active profile per user
  startup_name TEXT,
  problem TEXT,                           -- problem they solve
  solution TEXT,                          -- how they solve it
  sector TEXT,                            -- AI/SaaS/Marketplace/Fintech/Health/Other
  geography TEXT,                         -- Spain/LatAm/USA/Europe/Global
  mrr REAL DEFAULT 0,                     -- monthly recurring revenue
  arr REAL DEFAULT 0,                     -- annual recurring revenue
  active_users INTEGER DEFAULT 0,         -- active user count
  growth_rate_percent REAL DEFAULT 0,     -- WoW or MoM growth %
  team_size INTEGER DEFAULT 1,            -- team headcount
  fundraising_goal TEXT,                  -- e.g. "500K", "1M"
  fundraising_stage TEXT,                 -- pre-seed / seed / series-a / series-b
  vc_recommendations TEXT,                -- JSON array of recommended VCs
  conversation_turns INTEGER DEFAULT 0,   -- number of messages exchanged
  data_completeness INTEGER DEFAULT 0,    -- 0-100 score of how much we know
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_astro_sessions_user_id ON astro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_astro_sessions_mrr ON astro_sessions(mrr DESC);
CREATE INDEX IF NOT EXISTS idx_astro_sessions_users ON astro_sessions(active_users DESC);
CREATE INDEX IF NOT EXISTS idx_astro_sessions_updated ON astro_sessions(updated_at DESC);
