-- Migration: Pricing Plans and Validator Limits
-- Adds pricing tiers with validator limits for companies

-- Pricing Plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL, -- 'starter', 'pro', 'enterprise'
  display_name TEXT NOT NULL, -- 'Starter', 'Pro', 'Enterprise'
  description TEXT,
  price_monthly REAL NOT NULL,
  price_yearly REAL, -- Discounted yearly price
  validators_limit INTEGER NOT NULL, -- -1 for unlimited
  products_limit INTEGER NOT NULL, -- -1 for unlimited
  features TEXT, -- JSON array of features
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order) VALUES
('starter', 'Starter', 'Perfecto para comenzar a validar tu producto', 29.00, 290.00, 5, 2, '["5 validadores por producto", "2 productos activos", "Reportes básicos", "Soporte por email", "Acceso a validadores verificados"]', 1),
('pro', 'Pro', 'Para empresas en crecimiento que necesitan más validación', 99.00, 990.00, 20, 10, '["20 validadores por producto", "10 productos activos", "Reportes detallados", "Soporte prioritario", "Acceso a validadores premium", "Analytics avanzados", "Mensajería directa ilimitada"]', 2),
('enterprise', 'Enterprise', 'Solución completa para grandes empresas', 299.00, 2990.00, -1, -1, '["Validadores ilimitados", "Productos ilimitados", "Reportes personalizados", "Soporte dedicado 24/7", "Validadores exclusivos", "API access", "Custom integrations", "Dedicated account manager"]', 3);

-- Extend users table with plan information
ALTER TABLE users ADD COLUMN plan_id INTEGER DEFAULT 1; -- Default to Starter plan
ALTER TABLE users ADD COLUMN plan_status TEXT DEFAULT 'active'; -- active, expired, cancelled, trial
ALTER TABLE users ADD COLUMN plan_started_at DATETIME;
ALTER TABLE users ADD COLUMN plan_expires_at DATETIME;
ALTER TABLE users ADD COLUMN billing_cycle TEXT DEFAULT 'monthly'; -- monthly, yearly
ALTER TABLE users ADD COLUMN validators_used INTEGER DEFAULT 0; -- Current total validators across all products
ALTER TABLE users ADD COLUMN products_count INTEGER DEFAULT 0; -- Current active products count

-- Add foreign key constraint (if supported by your D1 version)
-- ALTER TABLE users ADD FOREIGN KEY (plan_id) REFERENCES pricing_plans(id);

-- Plan usage history (for tracking and analytics)
CREATE TABLE IF NOT EXISTS plan_usage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'upgrade', 'downgrade', 'renewal', 'cancellation'
  previous_plan_id INTEGER,
  price_paid REAL,
  billing_cycle TEXT,
  started_at DATETIME NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);

-- Subscription payments (basic tracking)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method TEXT, -- 'stripe', 'paypal', etc.
  payment_id TEXT, -- External payment ID
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);

-- Plan upgrade requests (for admins to approve)
CREATE TABLE IF NOT EXISTS plan_upgrade_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  current_plan_id INTEGER NOT NULL,
  requested_plan_id INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by INTEGER, -- admin user_id
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (current_plan_id) REFERENCES pricing_plans(id),
  FOREIGN KEY (requested_plan_id) REFERENCES pricing_plans(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Update existing users to have default plan started dates
UPDATE users SET 
  plan_started_at = CURRENT_TIMESTAMP,
  plan_expires_at = datetime(CURRENT_TIMESTAMP, '+30 days')
WHERE plan_started_at IS NULL AND role = 'founder';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);
CREATE INDEX IF NOT EXISTS idx_plan_usage_history_user_id ON plan_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_user_id ON plan_upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_status ON plan_upgrade_requests(status);
