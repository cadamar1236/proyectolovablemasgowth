-- Migration: Additional Pricing Plans
-- Adds more pricing plans for better user experience

-- Insert additional pricing plans
INSERT OR IGNORE INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, validators_limit, products_limit, features, display_order) VALUES
('free', 'Gratuito', 'Perfecto para probar la plataforma', 0.00, 0.00, 1, 1, '["1 validador por producto", "1 producto activo", "Reportes básicos", "Soporte por email"]', 0),
('starter', 'Starter', 'Perfecto para comenzar a validar tu producto', 29.00, 290.00, 5, 2, '["5 validadores por producto", "2 productos activos", "Reportes básicos", "Soporte por email", "Acceso a validadores verificados"]', 1),
('professional', 'Profesional', 'Para profesionales que necesitan más validación', 79.00, 790.00, 15, 5, '["15 validadores por producto", "5 productos activos", "Reportes detallados", "Soporte prioritario", "Acceso a validadores premium", "Analytics básicos"]', 2),
('pro', 'Pro', 'Para empresas en crecimiento que necesitan más validación', 99.00, 990.00, 20, 10, '["20 validadores por producto", "10 productos activos", "Reportes detallados", "Soporte prioritario", "Acceso a validadores premium", "Analytics avanzados", "Mensajería directa ilimitada"]', 3),
('business', 'Business', 'Para empresas establecidas', 199.00, 1990.00, 50, 25, '["50 validadores por producto", "25 productos activos", "Reportes personalizados", "Soporte dedicado", "Validadores exclusivos", "API básica", "Dashboard avanzado"]', 4),
('enterprise', 'Enterprise', 'Solución completa para grandes empresas', 299.00, 2990.00, -1, -1, '["Validadores ilimitados", "Productos ilimitados", "Reportes personalizados", "Soporte dedicado 24/7", "Validadores exclusivos", "API completa", "Custom integrations", "Dedicated account manager", "SLA garantizado"]', 5);