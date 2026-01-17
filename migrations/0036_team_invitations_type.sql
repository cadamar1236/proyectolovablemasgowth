-- Add invitation_type to differentiate between new user invitations and team transfers
ALTER TABLE team_invitations ADD COLUMN invitation_type TEXT DEFAULT 'new_member';
-- Types: 'new_member' (user not registered yet) or 'transfer' (user is in another team)

-- Add current_team_id to track which team the user is leaving
ALTER TABLE team_invitations ADD COLUMN current_team_id INTEGER;
