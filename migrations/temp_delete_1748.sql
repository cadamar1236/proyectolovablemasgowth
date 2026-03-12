-- Delete cadamar1235@gmail.com (ID 1748) and all related data
PRAGMA foreign_keys = OFF;
DELETE FROM astar_sent_messages WHERE user_id = 1748;
DELETE FROM astar_weekly_metrics WHERE user_id = 1748;
DELETE FROM dashboard_goals WHERE user_id = 1748;
DELETE FROM goals WHERE user_id = 1748;
DELETE FROM user_conversations WHERE user_id = 1748;
DELETE FROM startup_team_members WHERE user_id = 1748;
DELETE FROM beta_products WHERE company_user_id = 1748;
DELETE FROM notifications WHERE user_id = 1748;
DELETE FROM project_founders WHERE user_id = 1748;
DELETE FROM agent_chat_sessions WHERE user_id = 1748;
DELETE FROM agent_chat_messages WHERE session_id IN (SELECT id FROM agent_chat_sessions WHERE user_id = 1748);
DELETE FROM users WHERE id = 1748;
PRAGMA foreign_keys = ON;
