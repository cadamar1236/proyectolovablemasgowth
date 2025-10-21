-- Insert test user
INSERT OR IGNORE INTO users (id, email, name, plan) VALUES 
  (1, 'founder@validai.studio', 'Juan Founder', 'pro');

-- Insert test beta users
INSERT OR IGNORE INTO beta_users (name, email, role, age, industry, bio, rating) VALUES 
  ('Juan Díaz', 'juan.diaz@example.com', 'Product Manager', 32, 'FinTech', 'Experto en productos SaaS con 8+ años de experiencia', 4.8),
  ('María Rodríguez', 'maria.rodriguez@example.com', 'UX Designer', 28, 'E-commerce', 'Diseñadora especializada en experiencias de usuario móviles', 4.9),
  ('Antonio López', 'antonio.lopez@example.com', 'Backend Developer', 35, 'HealthTech', 'Arquitecto de sistemas escalables y APIs RESTful', 4.7),
  ('Carmen Sánchez', 'carmen.sanchez@example.com', 'Marketing Manager', 30, 'EdTech', 'Growth hacker con foco en adquisición B2B', 4.6),
  ('Luis Fernández', 'luis.fernandez@example.com', 'CTO', 38, 'AI/ML', 'Líder técnico con experiencia en startups unicornio', 5.0),
  ('Ana García', 'ana.garcia@example.com', 'Data Analyst', 29, 'FinTech', 'Analista de datos con enfoque en métricas de producto', 4.8),
  ('Pedro Martínez', 'pedro.martinez@example.com', 'Sales Director', 34, 'SaaS B2B', 'Director comercial con track record de $5M+ ARR', 4.9),
  ('Laura Torres', 'laura.torres@example.com', 'Frontend Developer', 27, 'E-commerce', 'Desarrolladora React/Vue con pasión por UI/UX', 4.7),
  ('Roberto Vega', 'roberto.vega@example.com', 'Business Analyst', 33, 'Consulting', 'Consultor estratégico para Fortune 500', 4.8),
  ('Isabel Ruiz', 'isabel.ruiz@example.com', 'Content Strategist', 31, 'Media', 'Estratega de contenido con audiencia de 100K+', 4.6);

-- Insert sample project
INSERT OR IGNORE INTO projects (id, user_id, title, description, target_market, value_proposition, status) VALUES 
  (1, 1, 'HealthTrack AI', 
   'Plataforma de monitoreo de salud remota usando IA para predecir problemas de salud antes de que ocurran',
   'Profesionales de la salud y clínicas privadas en LATAM',
   'Reducción del 60% en costos de hospitalización mediante detección temprana de anomalías',
   'validated');

-- Insert sample market analysis
INSERT OR IGNORE INTO market_analysis (project_id, competitors, market_trends, opportunities, threats, market_size, growth_rate, success_probability) VALUES 
  (1, 
   '["Teladoc Health", "Amwell", "Doctor on Demand", "HealthTap"]',
   '["Telemedicina creciendo 38% anual", "Adopción post-COVID permanente", "IA en salud con $36B en 2025", "Regulaciones favorables en LATAM"]',
   '["Mercado LATAM menos saturado", "Necesidad de soluciones en español", "Partnerships con aseguradoras", "Integración con sistemas existentes"]',
   '["Competidores con más funding", "Regulaciones de datos médicos", "Resistencia de médicos tradicionales", "Necesidad de certificaciones médicas"]',
   '$28B mercado LATAM para 2027',
   '32% CAGR',
   0.78);

-- Insert sample MVP prototype
INSERT OR IGNORE INTO mvp_prototypes (project_id, name, description, features, tech_stack, estimated_time, estimated_cost) VALUES 
  (1, 'HealthTrack MVP v1.0',
   'MVP funcional con dashboard para médicos y app móvil para pacientes',
   '["Dashboard médico con alertas IA", "App móvil de monitoreo", "Integración wearables", "Sistema de notificaciones", "Reportes automatizados", "Chat médico-paciente"]',
   '["React Native", "Node.js + Hono", "PostgreSQL", "TensorFlow.js", "Cloudflare Workers", "D1 Database"]',
   '8-10 semanas',
   '$45,000');

-- Insert sample test results
INSERT OR IGNORE INTO test_results (project_id, beta_user_id, rating, feedback, would_pay, suggested_price) VALUES 
  (1, 1, 5, 'Excelente concepto. La predicción temprana es un game-changer para clínicas privadas.', 1, 299),
  (1, 5, 5, 'La arquitectura técnica es sólida. Recomendaría usar ML pipelines más robustos.', 1, 399),
  (1, 6, 4, 'Los dashboards son intuitivos. Necesitan más opciones de personalización de métricas.', 1, 249),
  (1, 9, 5, 'El ROI es claro: reducción de costos + mejor atención = win-win para clínicas.', 1, 349);

-- Insert sample growth strategies
INSERT OR IGNORE INTO growth_strategies (project_id, strategy_type, title, description, channels, estimated_cac, estimated_ltv, priority) VALUES 
  (1, 'PLG', 'Freemium para médicos independientes',
   'Ofrecer versión gratuita limitada a 10 pacientes para médicos independientes, con upsell a clínicas',
   '["Product virality", "In-app referrals", "Free tier"]',
   '$87', '$2,340', 'high'),
  (1, 'Content', 'Blog sobre IA en salud',
   'Contenido educativo sobre casos de éxito de IA en predicción médica, SEO-optimizado',
   '["SEO blog", "LinkedIn articles", "Medical conferences"]',
   '$120', '$2,340', 'high'),
  (1, 'Partnerships', 'Alianzas con aseguradoras',
   'Partnerships B2B2C con aseguradoras que ofrecen descuentos por usar el servicio',
   '["B2B partnerships", "Insurance integrations", "Co-marketing"]',
   '$450', '$4,200', 'medium'),
  (1, 'Referral', 'Programa de referidos médico-a-médico',
   'Médicos ganan 2 meses gratis por cada referido que se suscriba',
   '["Referral program", "Email marketing", "Medical communities"]',
   '$65', '$2,340', 'high');

-- Insert sample metrics
INSERT OR IGNORE INTO metrics (project_id, metric_type, value, date) VALUES 
  (1, 'interest', 89.0, '2025-10-15'),
  (1, 'retention', 72.0, '2025-10-15'),
  (1, 'cac', 87.0, '2025-10-15'),
  (1, 'ltv', 2340.0, '2025-10-15'),
  (1, 'success_probability', 78.0, '2025-10-15'),
  (1, 'market_validation', 85.0, '2025-10-15');
