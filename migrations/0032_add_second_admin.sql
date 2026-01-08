-- Set grodrigano@hotmail.com as admin user
UPDATE users SET role = 'admin' WHERE email = 'grodrigano@hotmail.com';

-- If user doesn't exist yet, insert as admin (will be created on first login)
INSERT OR IGNORE INTO users (email, name, role, created_at) 
VALUES ('grodrigano@hotmail.com', 'Admin', 'admin', CURRENT_TIMESTAMP);
