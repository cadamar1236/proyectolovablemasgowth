-- Add Marketplace-Only Plans (Validator Network Access)
-- For companies that already have their product and only need validators
-- Updated: October 21, 2025

-- Update existing plans to be 'full' type (Plataforma completa)
UPDATE pricing_plans SET 
  plan_type = 'full',
  category = 'platform'
WHERE plan_type = 'full' OR plan_type IS NULL;

-- MARKETPLACE ONLY PLANS
-- These plans ONLY give access to validator marketplace, no MVP generator or AI validation

-- Marketplace Basic: $29/month ($290/year)
INSERT INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order, is_active, plan_type, category) VALUES
('marketplace_basic', 'Marketplace Basic', 'Solo acceso a red de validadores', 29.00, 290.00, 3, 2, '["Acceso a red de validadores", "3 validadores por producto", "2 productos activos", "Chat directo con validadores", "Reportes de feedback", "Dashboard de métricas básico", "Búsqueda y filtros de validadores", "7 días por validación"]', 10, 1, 'marketplace_only', 'marketplace');

-- Marketplace Pro: $79/month ($790/year)  
INSERT INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order, is_active, plan_type, category) VALUES
('marketplace_pro', 'Marketplace Pro', 'Red de validadores con funciones avanzadas', 79.00, 790.00, 10, 5, '["Acceso a validadores verificados premium", "10 validadores por producto", "5 productos activos", "Chat + videollamadas con validadores", "Reportes detallados de feedback", "Analytics de validación en tiempo real", "Portfolio de validadores destacados", "Invitaciones personalizadas", "Mensajería ilimitada", "15 días por validación", "Soporte prioritario (24h)"]', 11, 1, 'marketplace_only', 'marketplace');

-- Marketplace Enterprise: $199/month ($1990/year)
INSERT INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order, is_active, plan_type, category) VALUES
('marketplace_enterprise', 'Marketplace Enterprise', 'Acceso ilimitado a red de validadores elite', 199.00, 1990.00, -1, -1, '["Acceso a validadores top 1% exclusivos", "Validadores ilimitados", "Productos ilimitados", "Chat + videollamadas ilimitadas", "Reportes personalizados exportables", "Analytics avanzado predictivo", "Matching IA con validadores", "Account manager dedicado", "API REST + Webhooks", "Validaciones express (<3 días)", "Soporte dedicado 24/7", "SLA 99.9% garantizado", "Sesiones de consultoría mensuales"]', 12, 1, 'marketplace_only', 'marketplace');

-- View all plans organized by type
SELECT 
  id,
  name,
  display_name,
  plan_type,
  category,
  price_monthly as "💵 Mensual",
  price_yearly as "💵 Anual",
  validators_limit as "👥 Validadores",
  products_limit as "📦 Productos",
  CASE 
    WHEN plan_type = 'full' THEN '🎯 Plataforma Completa (MVP + IA + Marketplace)'
    WHEN plan_type = 'marketplace_only' THEN '🏪 Solo Marketplace (Red de Validadores)'
    ELSE '❓ Otro'
  END as "Tipo"
FROM pricing_plans 
WHERE is_active = 1
ORDER BY plan_type, display_order;

