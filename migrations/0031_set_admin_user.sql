-- Set cadamar1236@gmail.com as admin user
UPDATE users SET role = 'admin' WHERE email = 'cadamar1236@gmail.com';

-- If user doesn't exist yet, insert as admin (will be created on first login)
INSERT OR IGNORE INTO users (email, name, role, created_at) 
VALUES ('cadamar1236@gmail.com', 'Admin', 'admin', CURRENT_TIMESTAMP);
