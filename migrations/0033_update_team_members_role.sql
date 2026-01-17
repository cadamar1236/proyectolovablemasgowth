-- Migration: Update role to founder for team members
-- Change role to 'founder' for all users who are part of a startup team

UPDATE users
SET role = 'founder'
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM startup_team_members
  WHERE user_id IS NOT NULL
)
AND role != 'founder'
AND role != 'admin';
