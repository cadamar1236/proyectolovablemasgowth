-- Deshabilitar FOREIGN KEY checks
PRAGMA foreign_keys = OFF;

-- Eliminar todos los registros relacionados
DELETE FROM onboarding_sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM whatsapp_users WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM linkedin_connections WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM validators WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM validator_requests WHERE founder_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM validator_requests WHERE validator_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');
DELETE FROM dashboard_goals WHERE user_id IN (SELECT id FROM users WHERE email = 'cadamar1236@gmail.com');

-- Eliminar el usuario
DELETE FROM users WHERE email = 'cadamar1236@gmail.com';

-- Reactivar FOREIGN KEY checks
PRAGMA foreign_keys = ON;