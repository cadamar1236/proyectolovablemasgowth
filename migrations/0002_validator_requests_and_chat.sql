-- Migration: Validator Requests and Chat System
-- Date: 2025-10-29
-- Description: Adds tables for founders to request validator opinions and chat functionality

-- Validators table (linked to users with role='validator')
CREATE TABLE IF NOT EXISTS validators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  title TEXT,
  expertise TEXT, -- JSON array: ["SaaS", "HealthTech", "FinTech"]
  bio TEXT,
  rating REAL DEFAULT 0,
  total_validations INTEGER DEFAULT 0,
  response_rate REAL DEFAULT 100, -- percentage
  avg_response_time INTEGER DEFAULT 24, -- hours
  available BOOLEAN DEFAULT 1,
  hourly_rate REAL DEFAULT 0, -- $0 = free, >0 = paid consultation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Validator Requests table (founders requesting validator opinions)
CREATE TABLE IF NOT EXISTS validator_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  founder_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  project_id INTEGER,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, expired
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (validator_id) REFERENCES validators(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Chat Conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL UNIQUE,
  founder_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  project_id INTEGER,
  status TEXT DEFAULT 'active', -- active, archived, closed
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES validator_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (validator_id) REFERENCES validators(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL, -- 'founder' or 'validator'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table (for real-time alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'validator_request', 'request_accepted', 'request_rejected', 'new_message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to navigate when clicked
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_validators_user_id ON validators(user_id);
CREATE INDEX IF NOT EXISTS idx_validators_available ON validators(available);
CREATE INDEX IF NOT EXISTS idx_validator_requests_founder ON validator_requests(founder_id);
CREATE INDEX IF NOT EXISTS idx_validator_requests_validator ON validator_requests(validator_id);
CREATE INDEX IF NOT EXISTS idx_validator_requests_status ON validator_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_founder ON chat_conversations(founder_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_validator ON chat_conversations(validator_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
