-- Update Pricing Plans - Realistic Pricing Strategy
-- Updated: October 21, 2025
-- Pricing based on: Validator marketplace + MVP generator + Analytics

-- FREE Plan: $0/month - Entry point for testing
-- This will be added as a new plan for maximum conversion
INSERT OR REPLACE INTO pricing_plans (id, name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order, is_active) VALUES
(0, 'free', 'Free', 'Prueba la plataforma sin compromiso', 0.00, 0.00, 2, 1, '["2 validadores por producto", "1 producto activo", "Generador MVP básico", "Reportes limitados", "Soporte por comunidad", "3 días de validación"]', 0, 1);

-- Starter Plan: $49/month ($490/year - save 16%)
-- For solo founders and small startups
UPDATE pricing_plans 
SET 
  price_monthly = 49.00,
  price_yearly = 490.00,
  validators_limit = 5,
  products_limit = 3,
  description = 'Ideal para founders validando sus primeras ideas',
  features = '["5 validadores por producto", "3 productos simultáneos", "Generador MVP con IA (Groq)", "Reportes básicos + gráficos", "Chat directo con validadores", "Soporte email (48h)", "Dashboard de métricas", "7 días por validación"]'
WHERE name = 'starter';

-- Pro Plan: $149/month ($1490/year - save 16%) - MOST POPULAR
-- For growing startups with multiple products
UPDATE pricing_plans 
SET 
  price_monthly = 149.00,
  price_yearly = 1490.00,
  validators_limit = 15,
  products_limit = 10,
  description = 'Para startups en crecimiento con múltiples productos',
  features = '["15 validadores por producto", "10 productos simultáneos", "Generador MVP avanzado con IA", "Reportes detallados exportables", "Analytics en tiempo real", "Chat + videollamadas con validadores", "Soporte prioritario (24h)", "Portfolio de validadores verificados", "Invitaciones personalizadas", "30 días por validación", "Acceso a validadores premium"]'
WHERE name = 'pro';

-- Enterprise Plan: $399/month ($3990/year - save 16%)
-- For established companies and agencies
UPDATE pricing_plans 
SET 
  price_monthly = 399.00,
  price_yearly = 3990.00,
  validators_limit = -1,
  products_limit = -1,
  description = 'Solución completa para empresas y agencias',
  features = '["Validadores ilimitados", "Productos ilimitados", "Generador MVP con modelos premium", "Reportes personalizados con IA", "Analytics avanzado con predicciones", "Soporte dedicado 24/7", "Validadores exclusivos top 1%", "API REST + Webhooks", "Integraciones custom", "Account manager dedicado", "Sesiones de consultoría mensuales", "SLA 99.9%", "Whitelabel disponible", "Validaciones express (<3 días)"]'
WHERE name = 'enterprise';

-- Verify updates
SELECT 
  id,
  name,
  display_name,
  price_monthly as "💵 Mensual",
  price_yearly as "💵 Anual",
  validators_limit as "👥 Validadores",
  products_limit as "📦 Productos",
  description
FROM pricing_plans 
ORDER BY display_order;

