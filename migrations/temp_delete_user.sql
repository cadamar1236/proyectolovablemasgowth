-- Eliminar usuario cadamar1235@gmail.com (ID 52) y todos sus datos relacionados
PRAGMA foreign_keys = OFF;

DELETE FROM validator_applications WHERE user_id = 52;
DELETE FROM project_founders WHERE founder_id = 52;
DELETE FROM astar_user_responses WHERE user_id = 52;
DELETE FROM astar_sent_messages WHERE user_id = 52;
DELETE FROM astar_weekly_metrics WHERE user_id = 52;
DELETE FROM dashboard_goals WHERE user_id = 52;
DELETE FROM goals WHERE user_id = 52;
DELETE FROM user_metrics WHERE user_id = 52;
DELETE FROM primary_metrics WHERE user_id = 52;
DELETE FROM user_conversations WHERE user_id = 52;
DELETE FROM users WHERE id = 52;

PRAGMA foreign_keys = ON;
