-- Migration 0049: Create astro_messages table for full conversation history
-- Stores individual chat messages between founders and Astro AI

CREATE TABLE IF NOT EXISTS astro_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  role         TEXT    NOT NULL CHECK(role IN ('user', 'astro')),
  content      TEXT    NOT NULL,
  session_date TEXT,                                  -- YYYY-MM-DD of the conversation day
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_astro_messages_user
  ON astro_messages(user_id, created_at DESC);
