-- Actualizar usuarios admin
-- Asegurar que cadamar1236@gmail.com y giorgio@student.ie.edu tengan rol de admin

UPDATE users SET role = 'admin' WHERE email = 'cadamar1236@gmail.com';
UPDATE users SET role = 'admin' WHERE email = 'giorgio@student.ie.edu';
