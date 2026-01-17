-- Migration: Fix existing goals team_id assignment
-- Update goals that don't have team_id set

UPDATE goals
SET team_id = (
  SELECT st.id 
  FROM startup_teams st
  INNER JOIN startup_team_members stm ON st.id = stm.team_id
  WHERE stm.user_id = goals.user_id
  LIMIT 1
)
WHERE team_id IS NULL OR team_id NOT IN (
  SELECT id FROM startup_teams
);
