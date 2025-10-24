-- Script completo para inicializar la base de datos con soporte de Stripe
-- Este script aplica todas las migraciones y añade los campos de Stripe

-- 1. Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'founder',
  company_name TEXT,
  company_website TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT 0,
  last_login DATETIME,
  plan TEXT DEFAULT 'starter',
  plan_id INTEGER DEFAULT 1,
  plan_status TEXT DEFAULT 'active',
  plan_started_at DATETIME,
  plan_expires_at DATETIME,
  billing_cycle TEXT DEFAULT 'monthly',
  validators_used INTEGER DEFAULT 0,
  products_count INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de planes de precio con Stripe
CREATE TABLE IF NOT EXISTS pricing_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly REAL NOT NULL,
  price_yearly REAL,
  validators_limit INTEGER NOT NULL,
  products_limit INTEGER NOT NULL,
  features TEXT,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'marketplace',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insertar planes de precio por defecto
INSERT INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order, category) VALUES
('free', 'Free', 'Perfecto para explorar la plataforma', 0.00, 0.00, 2, 1, '["2 validadores por producto", "1 producto activo", "Reportes básicos", "Acceso a validadores verificados"]', 0, 'marketplace'),
('starter', 'Starter', 'Perfecto para comenzar a validar tu producto', 29.00, 290.00, 5, 2, '["5 validadores por producto", "2 productos activos", "Reportes básicos", "Soporte por email", "Acceso a validadores verificados"]', 1, 'marketplace'),
('pro', 'Pro', 'Para empresas en crecimiento que necesitan más validación', 99.00, 990.00, 20, 10, '["20 validadores por producto", "10 productos activos", "Reportes detallados", "Soporte prioritario", "Acceso a validadores premium", "Analytics avanzados", "Mensajería directa ilimitada"]', 2, 'marketplace'),
('enterprise', 'Enterprise', 'Solución completa para grandes empresas', 299.00, 2990.00, -1, -1, '["Validadores ilimitados", "Productos ilimitados", "Reportes personalizados", "Soporte dedicado 24/7", "Validadores exclusivos", "API access", "Custom integrations", "Dedicated account manager"]', 3, 'marketplace');

-- 4. Crear tabla de pagos de suscripción
CREATE TABLE IF NOT EXISTS subscription_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);

-- 5. Crear tabla de eventos de Stripe
CREATE TABLE IF NOT EXISTS stripe_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  processed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Crear tabla de historial de planes
CREATE TABLE IF NOT EXISTS plan_usage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  previous_plan_id INTEGER,
  price_paid REAL,
  billing_cycle TEXT,
  started_at DATETIME NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);

-- 7. Crear tabla de solicitudes de upgrade
CREATE TABLE IF NOT EXISTS plan_upgrade_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  current_plan_id INTEGER NOT NULL,
  requested_plan_id INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (current_plan_id) REFERENCES pricing_plans(id),
  FOREIGN KEY (requested_plan_id) REFERENCES pricing_plans(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- 8. Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_session_id ON subscription_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- 9. Insertar usuario admin de prueba
INSERT INTO users (email, name, password, role, plan_id, plan_started_at, plan_expires_at) VALUES
('admin@test.com', 'Admin User', 'admin123', 'admin', 4, CURRENT_TIMESTAMP, datetime(CURRENT_TIMESTAMP, '+365 days'));

-- 10. Insertar usuario founder de prueba
INSERT INTO users (email, name, password, role, plan_id, plan_started_at, plan_expires_at) VALUES
('founder@test.com', 'Test Founder', 'test123', 'founder', 1, CURRENT_TIMESTAMP, datetime(CURRENT_TIMESTAMP, '+30 days'));
