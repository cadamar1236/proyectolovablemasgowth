-- Despoblar la base de datos de productos, proyectos y usuarios
-- Deshabilitar claves foráneas temporalmente para evitar restricciones
PRAGMA foreign_keys = OFF;

-- Borrar todas las tablas en cualquier orden
DELETE FROM market_analysis;
DELETE FROM mvp_prototypes;
DELETE FROM test_results;
DELETE FROM growth_strategies;
DELETE FROM metrics;
DELETE FROM project_votes;
DELETE FROM product_votes;
DELETE FROM validator_ratings;
DELETE FROM validation_reports;
DELETE FROM reviews;
DELETE FROM messages;
DELETE FROM validator_certifications;
DELETE FROM validator_earnings;
DELETE FROM portfolio_items;
DELETE FROM validator_applications;
DELETE FROM validation_sessions;
DELETE FROM notifications;
DELETE FROM plan_usage_history;
DELETE FROM subscription_payments;
DELETE FROM plan_upgrade_requests;
DELETE FROM beta_products;
DELETE FROM projects;
DELETE FROM validators;
DELETE FROM users;
DELETE FROM beta_users;

-- Rehabilitar claves foráneas
PRAGMA foreign_keys = ON;
