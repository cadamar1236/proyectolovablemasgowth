-- Verificar el estado actual de los equipos
-- Ver el equipo de aihelpstudy
SELECT 
  st.id as team_id,
  st.name as team_name,
  st.creator_user_id,
  u.email as creator_email
FROM startup_teams st
LEFT JOIN users u ON st.creator_user_id = u.id
WHERE u.email LIKE '%aihelp%' OR u.name LIKE '%aihelp%';

-- Ver los miembros del equipo de aihelpstudy
SELECT 
  stm.id,
  stm.team_id,
  stm.user_id,
  stm.role,
  stm.is_creator,
  u.email,
  u.name
FROM startup_team_members stm
LEFT JOIN users u ON stm.user_id = u.id
WHERE stm.team_id IN (
  SELECT st.id 
  FROM startup_teams st
  LEFT JOIN users u ON st.creator_user_id = u.id
  WHERE u.email LIKE '%aihelp%' OR u.name LIKE '%aihelp%'
);

-- Ver el equipo de cadamar1235
SELECT 
  st.id as team_id,
  st.name as team_name,
  st.creator_user_id,
  u.email as creator_email
FROM startup_teams st
LEFT JOIN users u ON st.creator_user_id = u.id
WHERE u.email = 'cadamar1235@gmail.com';

-- Ver los miembros del equipo de cadamar1235
SELECT 
  stm.id,
  stm.team_id,
  stm.user_id,
  stm.role,
  stm.is_creator,
  u.email,
  u.name
FROM startup_team_members stm
LEFT JOIN users u ON stm.user_id = u.id
WHERE stm.team_id IN (
  SELECT st.id 
  FROM startup_teams st
  LEFT JOIN users u ON st.creator_user_id = u.id
  WHERE u.email = 'cadamar1235@gmail.com'
);
