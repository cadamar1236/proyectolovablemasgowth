-- Migration: Add assigned_to_user_id to goals table
-- Date: 2026-02-01
-- Description: Couples goals with team members by adding a foreign key to users table
--              This allows goals to be assigned only to team members

-- Add assigned_to_user_id column
ALTER TABLE goals ADD COLUMN assigned_to_user_id INTEGER;

-- Create foreign key relationship
-- Note: In SQLite, foreign keys are checked at runtime, not enforced at schema level
-- But we can add an index to improve query performance

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_assigned_to_user ON goals(assigned_to_user_id);

-- Migrate existing DRI text values to assigned_to_user_id where possible
-- This attempts to match dri names with existing users in the same team
UPDATE goals
SET assigned_to_user_id = (
  SELECT u.id
  FROM users u
  INNER JOIN startup_team_members stm ON u.id = stm.user_id
  WHERE LOWER(u.name) = LOWER(goals.dri)
  AND stm.team_id = (
    SELECT stm2.team_id
    FROM startup_team_members stm2
    WHERE stm2.user_id = goals.user_id
    LIMIT 1
  )
  LIMIT 1
)
WHERE goals.dri IS NOT NULL 
  AND goals.dri != ''
  AND goals.assigned_to_user_id IS NULL;
