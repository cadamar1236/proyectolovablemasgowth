-- =====================================================
-- 🗄️ MIGRACIÓN: Soporte para OAuth y Guest Mode
-- Fecha: 2026-02-03
-- Descripción: Agrega columnas para Google OAuth y modo guest
-- =====================================================

-- 1. Agregar columnas para OAuth
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- 2. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest);

-- 3. Modificar constraint de password (ahora opcional para OAuth)
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;

-- 4. Agregar constraint: password requerido solo para usuarios locales
ALTER TABLE users
ADD CONSTRAINT check_password_local
CHECK (
  (provider = 'local' AND password IS NOT NULL) OR
  (provider != 'local')
);

-- 5. Tabla de sesiones OAuth (opcional, para refresh tokens)
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id ON oauth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_provider ON oauth_sessions(user_id, provider);

-- 6. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oauth_sessions_updated_at
BEFORE UPDATE ON oauth_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Agregar metadata JSON para usuarios guest
ALTER TABLE users
ADD COLUMN IF NOT EXISTS guest_metadata JSONB DEFAULT '{}';

-- Ejemplo de metadata guest:
-- {
--   "selected_role": "founder",
--   "session_started": "2026-02-03T10:00:00Z",
--   "session_expires": "2026-02-03T22:00:00Z",
--   "features_used": ["dashboard", "traction"]
-- }

-- 8. Vista para usuarios activos (excluye guests expirados)
CREATE OR REPLACE VIEW active_users AS
SELECT 
  u.*,
  CASE 
    WHEN u.is_guest THEN 
      CASE 
        WHEN (u.guest_metadata->>'session_expires')::timestamp > NOW() THEN true
        ELSE false
      END
    ELSE true
  END as is_active
FROM users u;

-- 9. Función para limpiar usuarios guest expirados (ejecutar diariamente)
CREATE OR REPLACE FUNCTION cleanup_expired_guests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM users
  WHERE is_guest = true
  AND (guest_metadata->>'session_expires')::timestamp < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Migrar usuarios existentes (marcar como local si no tienen provider)
UPDATE users
SET provider = 'local'
WHERE provider IS NULL;

-- 11. Comentarios para documentación
COMMENT ON COLUMN users.google_id IS 'ID único de Google OAuth (sub claim del token)';
COMMENT ON COLUMN users.provider IS 'Proveedor de autenticación: local, google, github, etc.';
COMMENT ON COLUMN users.avatar_url IS 'URL del avatar del usuario (de Google, GitHub, etc.)';
COMMENT ON COLUMN users.is_guest IS 'TRUE si es usuario guest temporal';
COMMENT ON COLUMN users.guest_metadata IS 'Metadata JSON para sesiones guest: role, timestamps, features';
COMMENT ON TABLE oauth_sessions IS 'Sesiones OAuth con tokens de acceso y refresh';

-- =====================================================
-- 📊 VERIFICACIÓN DE MIGRACIÓN
-- =====================================================

-- Verificar columnas agregadas
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('google_id', 'provider', 'avatar_url', 'is_guest', 'guest_metadata');

-- Verificar índices creados
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE 'idx_users_%';

-- Verificar constraint de password
SELECT 
  conname, 
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'check_password_local';

-- Contar usuarios por provider
SELECT 
  provider, 
  is_guest,
  COUNT(*) as total
FROM users
GROUP BY provider, is_guest;

-- =====================================================
-- 🔄 ROLLBACK (en caso de problemas)
-- =====================================================

-- DESCOMENTAR SOLO SI NECESITAS REVERTIR:

-- DROP VIEW IF EXISTS active_users;
-- DROP FUNCTION IF EXISTS cleanup_expired_guests();
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- DROP TABLE IF EXISTS oauth_sessions;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS check_password_local;
-- ALTER TABLE users DROP COLUMN IF EXISTS google_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS provider;
-- ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_guest;
-- ALTER TABLE users DROP COLUMN IF EXISTS guest_metadata;
-- DROP INDEX IF EXISTS idx_users_google_id;
-- DROP INDEX IF EXISTS idx_users_provider;
-- DROP INDEX IF EXISTS idx_users_is_guest;
