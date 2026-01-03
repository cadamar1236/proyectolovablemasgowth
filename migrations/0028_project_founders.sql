-- Migration: Add project founders table
-- Allows multiple founders per project

CREATE TABLE IF NOT EXISTS project_founders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT, -- Co-founder, Technical Lead, CEO, CTO, etc.
  equity_percentage REAL,
  is_creator INTEGER DEFAULT 0, -- 1 if this is the person who created the project
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_project_founders_project_id ON project_founders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_founders_user_id ON project_founders(user_id);

-- Migrate existing projects to have the creator as founder
INSERT INTO project_founders (project_id, user_id, name, is_creator, role)
SELECT 
  p.id,
  p.user_id,
  u.name,
  1,
  'Founder'
FROM projects p
LEFT JOIN users u ON p.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM project_founders pf WHERE pf.project_id = p.id
);
