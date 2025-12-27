-- Migration: Chat Agent System
-- Sistema de chat con IA integrado en la plataforma

-- Tabla de mensajes del agente de marketing (AI)
CREATE TABLE IF NOT EXISTS agent_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata TEXT, -- JSON con información adicional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabla de sesiones del agente de marketing
CREATE TABLE IF NOT EXISTS agent_chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de acciones realizadas por el agente de marketing
CREATE TABLE IF NOT EXISTS agent_chat_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'create_goal', 'update_goal', 'delete_goal', etc.
  action_data TEXT NOT NULL, -- JSON con los datos de la acción
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES agent_chat_messages(id) ON DELETE CASCADE
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_user ON agent_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_project ON agent_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_sessions_user ON agent_chat_sessions(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_chat_actions_message ON agent_chat_actions(message_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_actions_status ON agent_chat_actions(status);