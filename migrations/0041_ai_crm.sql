-- Migration: AI CRM - Customer Relationship Management with AI
-- Stores contacts from AI Connector and external sources

-- Main CRM contacts table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, -- Owner of this CRM contact
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  linkedin_url TEXT,
  website TEXT,
  avatar_url TEXT,
  
  -- CRM fields
  contact_type TEXT DEFAULT 'lead', -- lead, prospect, customer, partner, investor, validator, founder, other
  status TEXT DEFAULT 'new', -- new, contacted, qualified, negotiation, won, lost, churned
  source TEXT DEFAULT 'manual', -- manual, ai_connector, linkedin, import, referral, website
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Linked data (if contact is from AI Connector)
  linked_user_id INTEGER, -- If contact is a platform user
  connector_suggestion_id INTEGER, -- If came from AI Connector
  
  -- Tracking
  last_contact_date TEXT,
  next_follow_up TEXT,
  deal_value REAL DEFAULT 0,
  notes TEXT,
  tags TEXT, -- JSON array of tags
  
  -- Custom fields (JSON)
  custom_fields TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (connector_suggestion_id) REFERENCES connector_suggestions(id) ON DELETE SET NULL
);

-- CRM Activities/Interactions log
CREATE TABLE IF NOT EXISTS crm_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  activity_type TEXT NOT NULL, -- email, call, meeting, note, message, linkedin, ai_connector_chat
  subject TEXT,
  description TEXT,
  outcome TEXT, -- positive, negative, neutral, pending
  
  -- Linked data
  message_id INTEGER, -- If linked to a message
  
  -- Timestamps
  activity_date TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CRM Pipelines (for kanban view)
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  stages TEXT NOT NULL, -- JSON array of stage names
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CRM Deals (opportunities)
CREATE TABLE IF NOT EXISTS crm_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  pipeline_id INTEGER,
  
  title TEXT NOT NULL,
  value REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT DEFAULT 'new',
  probability INTEGER DEFAULT 50, -- 0-100%
  expected_close_date TEXT,
  
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT,
  
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_source ON crm_contacts(source);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_linked_user ON crm_contacts(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON crm_deals(pipeline_id);

-- Insert default pipeline for existing users
INSERT INTO crm_pipelines (user_id, name, stages, is_default)
SELECT id, 'Default Pipeline', '["new","contacted","qualified","proposal","negotiation","won","lost"]', 1
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM crm_pipelines WHERE crm_pipelines.user_id = users.id
);
