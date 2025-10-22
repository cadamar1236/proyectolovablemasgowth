-- Update Plans: Fix terminology and clarify value proposition
-- Updated: October 21, 2025
-- Changes:
-- 1. Remove "Validators" language -> "Validation Requests" 
-- 2. Clarify that validators get product at better price (not paid)
-- 3. Keep only platform plans (remove marketplace-only confusion)

-- Desactivar planes marketplace-only (causaban confusión)
UPDATE pricing_plans 
SET is_active = 0 
WHERE plan_type = 'marketplace_only';

-- Actualizar características de planes completos con lenguaje correcto

-- FREE: Plan gratuito para probar
UPDATE pricing_plans 
SET 
  features = '["2 solicitudes de validación por producto", "1 producto activo", "Generador MVP básico con IA", "Dashboard de métricas", "Validadores acceden a precio especial", "Soporte por comunidad", "3 días de validación"]',
  description = 'Prueba la plataforma sin compromiso'
WHERE name = 'free';

-- STARTER: $49/mes
UPDATE pricing_plans 
SET 
  features = '["5 solicitudes de validación por producto", "3 productos simultáneos", "Generador MVP con IA (Groq)", "Chat directo con validadores", "Dashboard de métricas avanzado", "Validadores obtienen producto a precio especial", "Reportes básicos de feedback", "7 días por validación", "Soporte email (48h)"]',
  description = 'Ideal para founders validando sus primeras ideas'
WHERE name = 'starter';

-- PRO: $149/mes (Más Popular)
UPDATE pricing_plans 
SET 
  features = '["15 solicitudes de validación por producto", "10 productos simultáneos", "Generador MVP avanzado con IA", "Chat + videollamadas con validadores", "Analytics en tiempo real", "Validadores obtienen descuentos exclusivos", "Reportes detallados exportables", "Invitaciones personalizadas", "Portfolio de validadores premium", "30 días por validación", "Soporte prioritario (24h)"]',
  description = 'Para startups en crecimiento con múltiples productos'
WHERE name = 'pro';

-- ENTERPRISE: $399/mes
UPDATE pricing_plans 
SET 
  features = '["Solicitudes de validación ilimitadas", "Productos ilimitados", "Generador MVP con modelos premium", "Soporte dedicado 24/7", "Validadores obtienen productos gratis", "Analytics avanzado con predicciones", "Reportes personalizados con IA", "Account manager dedicado", "API REST + Webhooks", "Integraciones custom", "Validaciones express (<3 días)", "SLA 99.9% garantizado", "Sesiones de consultoría mensuales"]',
  description = 'Solución completa para empresas y agencias'
WHERE name = 'enterprise';

-- Verificar cambios
SELECT 
  name,
  display_name,
  price_monthly as "💵 Mes",
  validators_limit as "📋 Solicitudes",
  products_limit as "📦 Productos",
  is_active as "✓ Activo",
  SUBSTR(description, 1, 40) || '...' as "Descripción"
FROM pricing_plans 
WHERE is_active = 1
ORDER BY display_order;
