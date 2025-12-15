-- Migration: WhatsApp Verification Codes
-- Tabla para códigos temporales de verificación de WhatsApp

CREATE TABLE IF NOT EXISTS whatsapp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índice para búsquedas por usuario y código
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_user_code ON whatsapp_codes(user_id, code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_expires ON whatsapp_codes(expires_at);