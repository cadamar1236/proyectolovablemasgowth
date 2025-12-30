-- Migration: General User Conversations
-- Date: 2025-12-29
-- Description: Adds table for conversations between any users, not just validators

-- User Conversations table (more general than chat_conversations)
CREATE TABLE IF NOT EXISTS user_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- active, archived, blocked
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_user_conversations_user1 ON user_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_user2 ON user_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_last_message ON user_conversations(last_message_at DESC);

-- User Messages table (more general than chat_messages)
CREATE TABLE IF NOT EXISTS user_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES user_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_messages_conversation ON user_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_read ON user_messages(is_read);
