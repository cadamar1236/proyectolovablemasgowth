-- Migration: Fix validator_requests foreign key to reference beta_products
-- Update the foreign key constraint for validator_requests and chat_conversations

-- Note: This migration assumes the tables already exist and need their foreign keys updated
-- In SQLite, we can't directly alter foreign keys, so we need to recreate the tables

-- Recreate validator_requests table with correct foreign key
DROP TABLE IF EXISTS validator_requests_backup;
ALTER TABLE validator_requests RENAME TO validator_requests_backup;

CREATE TABLE validator_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  founder_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  project_id INTEGER,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (validator_id) REFERENCES validators(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES beta_products(id) ON DELETE SET NULL
);

-- Copy data from backup, but only keep valid product_ids
INSERT INTO validator_requests (id, founder_id, validator_id, project_id, message, status, created_at, responded_at, expires_at)
SELECT id, founder_id, validator_id, 
       CASE WHEN bp.id IS NOT NULL THEN vr.project_id ELSE NULL END as project_id,
       message, status, created_at, responded_at, expires_at
FROM validator_requests_backup vr
LEFT JOIN beta_products bp ON vr.project_id = bp.id;

-- Recreate chat_conversations table with correct foreign key
DROP TABLE IF EXISTS chat_conversations_backup;
ALTER TABLE chat_conversations RENAME TO chat_conversations_backup;

CREATE TABLE chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL UNIQUE,
  founder_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  project_id INTEGER,
  status TEXT DEFAULT 'active',
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES validator_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (validator_id) REFERENCES validators(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES beta_products(id) ON DELETE SET NULL
);

-- Copy data from backup, but only keep valid product_ids
INSERT INTO chat_conversations (id, request_id, founder_id, validator_id, project_id, status, last_message_at, created_at)
SELECT id, request_id, founder_id, validator_id,
       CASE WHEN bp.id IS NOT NULL THEN cc.project_id ELSE NULL END as project_id,
       status, last_message_at, created_at
FROM chat_conversations_backup cc
LEFT JOIN beta_products bp ON cc.project_id = bp.id;

-- Clean up backups
DROP TABLE validator_requests_backup;
DROP TABLE chat_conversations_backup;