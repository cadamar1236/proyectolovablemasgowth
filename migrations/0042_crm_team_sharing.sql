-- Migration: CRM Team Sharing
-- Makes CRM data shared across team members instead of per-user

-- Add team_id to crm_contacts
ALTER TABLE crm_contacts ADD COLUMN team_id INTEGER REFERENCES startup_teams(id) ON DELETE SET NULL;

-- Add team_id to crm_pipelines
ALTER TABLE crm_pipelines ADD COLUMN team_id INTEGER REFERENCES startup_teams(id) ON DELETE SET NULL;

-- Add team_id to crm_deals
ALTER TABLE crm_deals ADD COLUMN team_id INTEGER REFERENCES startup_teams(id) ON DELETE SET NULL;

-- Migrate existing contacts to their user's team
UPDATE crm_contacts
SET team_id = (
  SELECT stm.team_id 
  FROM startup_team_members stm 
  WHERE stm.user_id = crm_contacts.user_id
  LIMIT 1
)
WHERE team_id IS NULL;

-- Migrate existing pipelines to their user's team
UPDATE crm_pipelines
SET team_id = (
  SELECT stm.team_id 
  FROM startup_team_members stm 
  WHERE stm.user_id = crm_pipelines.user_id
  LIMIT 1
)
WHERE team_id IS NULL;

-- Migrate existing deals to their user's team
UPDATE crm_deals
SET team_id = (
  SELECT stm.team_id 
  FROM startup_team_members stm 
  WHERE stm.user_id = crm_deals.user_id
  LIMIT 1
)
WHERE team_id IS NULL;

-- Create indexes for team queries
CREATE INDEX IF NOT EXISTS idx_crm_contacts_team ON crm_contacts(team_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_team ON crm_pipelines(team_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_team ON crm_deals(team_id);
