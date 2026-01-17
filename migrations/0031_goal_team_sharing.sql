-- Migration: Add goal team sharing
-- Allows multiple founders to share goals within a startup

-- Table to track which users are part of the same "startup team"
CREATE TABLE IF NOT EXISTS startup_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- Startup/project name
  creator_user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to track team members (founders)
CREATE TABLE IF NOT EXISTS startup_team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'Co-founder', -- Founder, Co-founder, etc.
  is_creator INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES startup_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id) -- Prevent duplicate memberships
);

-- Add team_id to goals table to associate goals with teams
ALTER TABLE goals ADD COLUMN team_id INTEGER REFERENCES startup_teams(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_startup_team_members_team_id ON startup_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_startup_team_members_user_id ON startup_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_team_id ON goals(team_id);

-- Auto-create a team for each existing user with their name as startup
INSERT INTO startup_teams (name, creator_user_id)
SELECT 
  COALESCE(u.name, 'My Startup') || '''s Team',
  u.id
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM startup_teams st WHERE st.creator_user_id = u.id
);

-- Add each user as the creator member of their own team
INSERT INTO startup_team_members (team_id, user_id, is_creator, role)
SELECT 
  st.id,
  st.creator_user_id,
  1,
  'Founder'
FROM startup_teams st
WHERE NOT EXISTS (
  SELECT 1 FROM startup_team_members stm 
  WHERE stm.team_id = st.id AND stm.user_id = st.creator_user_id
);

-- Link existing goals to their owner's team
UPDATE goals
SET team_id = (
  SELECT st.id 
  FROM startup_teams st
  WHERE st.creator_user_id = goals.user_id
  LIMIT 1
)
WHERE team_id IS NULL;
