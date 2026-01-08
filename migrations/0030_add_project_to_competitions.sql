-- Add project_id column to competition_participants table
ALTER TABLE competition_participants ADD COLUMN project_id INTEGER;

-- Add foreign key relationship (SQLite doesn't enforce FK on ALTER, but for documentation)
-- FOREIGN KEY (project_id) REFERENCES projects(id)
