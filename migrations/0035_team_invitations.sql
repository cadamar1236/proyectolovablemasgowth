-- Migration: Add team invitations table
-- Allows inviting users who haven't registered yet

CREATE TABLE IF NOT EXISTS team_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'Co-founder',
  invited_by_user_id INTEGER NOT NULL,
  invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  FOREIGN KEY (team_id) REFERENCES startup_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, email) -- Prevent duplicate invitations
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
