-- Migration: Fix cadamar1235 team membership
-- Move cadamar1235 from their own team to aihelpstudy's team

-- Step 1: Get aihelpstudy's team_id and cadamar1235's user_id
-- Then add cadamar1235 to aihelpstudy's team if not already there

-- First, remove cadamar1235 from their own team (if they're the only member)
DELETE FROM startup_team_members
WHERE user_id = (SELECT id FROM users WHERE email = 'cadamar1235@gmail.com')
AND team_id = (
  SELECT st.id 
  FROM startup_teams st
  WHERE st.creator_user_id = (SELECT id FROM users WHERE email = 'cadamar1235@gmail.com')
);

-- Step 2: Add cadamar1235 to aihelpstudy's team
INSERT INTO startup_team_members (team_id, user_id, role, is_creator)
SELECT 
  st.id as team_id,
  (SELECT id FROM users WHERE email = 'cadamar1235@gmail.com') as user_id,
  'Co-founder' as role,
  0 as is_creator
FROM startup_teams st
LEFT JOIN users u ON st.creator_user_id = u.id
WHERE (u.email LIKE '%aihelp%' OR u.name LIKE '%aihelp%')
AND NOT EXISTS (
  SELECT 1 FROM startup_team_members stm
  WHERE stm.team_id = st.id 
  AND stm.user_id = (SELECT id FROM users WHERE email = 'cadamar1235@gmail.com')
)
LIMIT 1;

-- Step 3: Update goals from cadamar1235 to be part of aihelpstudy's team
UPDATE goals
SET team_id = (
  SELECT st.id 
  FROM startup_teams st
  LEFT JOIN users u ON st.creator_user_id = u.id
  WHERE u.email LIKE '%aihelp%' OR u.name LIKE '%aihelp%'
  LIMIT 1
)
WHERE user_id = (SELECT id FROM users WHERE email = 'cadamar1235@gmail.com');
