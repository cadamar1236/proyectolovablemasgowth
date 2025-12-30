-- Marketing AI Tables
-- Tablas para el sistema de agente de marketing inteligente

-- Tabla de conversaciones con el agente de marketing
CREATE TABLE IF NOT EXISTS marketing_ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de análisis de negocios
CREATE TABLE IF NOT EXISTS marketing_ai_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_description TEXT NOT NULL,
  goals TEXT,
  analysis TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de campañas generadas
CREATE TABLE IF NOT EXISTS marketing_ai_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  platforms TEXT NOT NULL, -- JSON array de plataformas
  duration_days INTEGER NOT NULL,
  campaign TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, active, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_marketing_conversations_user ON marketing_ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analyses_user ON marketing_ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_user ON marketing_ai_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_ai_campaigns(status);
