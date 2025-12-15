-- Migration: WhatsApp Users and Conversations
-- Tablas para el sistema de WhatsApp con Twilio

-- Usuarios de WhatsApp vinculados a cuentas
CREATE TABLE IF NOT EXISTS whatsapp_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL UNIQUE,
  user_id INTEGER,
  email TEXT,
  auth_token TEXT,
  is_verified INTEGER DEFAULT 0,
  pending_action TEXT,
  pending_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Historial de conversaciones
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  intent TEXT,
  message_sid TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_users_phone ON whatsapp_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_users_user_id ON whatsapp_users(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created ON whatsapp_conversations(created_at);
