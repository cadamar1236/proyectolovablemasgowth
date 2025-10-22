-- Update Marketplace-Only Plans: Fix terminology
-- Validadores obtienen producto a mejor precio, no pago directo

-- Marketplace Basic: $29/mes
UPDATE pricing_plans 
SET 
  features = '["3 solicitudes de validación por producto", "2 productos activos", "Chat directo con validadores", "Reportes de feedback detallados", "Dashboard de métricas", "Validadores obtienen producto con descuento", "Búsqueda y filtros avanzados", "7 días por validación"]',
  description = 'Solo acceso a red de validadores'
WHERE name = 'marketplace_basic';

-- Marketplace Pro: $79/mes
UPDATE pricing_plans 
SET 
  features = '["10 solicitudes de validación por producto", "5 productos activos", "Chat + videollamadas con validadores", "Reportes detallados exportables", "Analytics de validación en tiempo real", "Validadores obtienen descuentos exclusivos", "Portfolio de validadores premium", "Invitaciones personalizadas", "Mensajería ilimitada", "15 días por validación", "Soporte prioritario (24h)"]',
  description = 'Red de validadores con funciones avanzadas'
WHERE name = 'marketplace_pro';

-- Marketplace Enterprise: $199/mes
UPDATE pricing_plans 
SET 
  features = '["Solicitudes de validación ilimitadas", "Productos ilimitados", "Chat + videollamadas ilimitadas", "Reportes personalizados exportables", "Analytics avanzado predictivo", "Validadores obtienen productos gratis", "Matching IA con validadores ideales", "Account manager dedicado", "API REST + Webhooks", "Validaciones express (<3 días)", "Soporte dedicado 24/7", "SLA 99.9% garantizado", "Sesiones de consultoría mensuales"]',
  description = 'Acceso ilimitado a red de validadores elite'
WHERE name = 'marketplace_enterprise';

-- Ver todos los planes activos
SELECT 
  name,
  display_name,
  plan_type,
  price_monthly as "💵",
  validators_limit as "📋 Solicitudes",
  is_active as "✓"
FROM pricing_plans 
WHERE is_active = 1
ORDER BY plan_type, display_order;
