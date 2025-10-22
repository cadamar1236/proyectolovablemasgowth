-- Migration: Messaging System
-- Adds basic chat functionality between founders and validators

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES validation_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Trigger: Notify when new message is received
CREATE TRIGGER IF NOT EXISTS notify_new_message
AFTER INSERT ON messages
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    NEW.receiver_id,
    'new_message',
    'Nuevo mensaje',
    u.name || ' te ha enviado un mensaje',
    '/marketplace?tab=dashboard&session=' || NEW.session_id,
    json_object(
      'message_id', NEW.id,
      'session_id', NEW.session_id,
      'sender_id', NEW.sender_id
    )
  FROM users u
  WHERE u.id = NEW.sender_id;
END;
