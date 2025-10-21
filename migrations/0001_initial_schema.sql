-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (ideas para validar)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_market TEXT,
  value_proposition TEXT,
  status TEXT DEFAULT 'draft', -- draft, analyzing, validated, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Market Analysis table (resultados del análisis IA)
CREATE TABLE IF NOT EXISTS market_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  competitors TEXT, -- JSON array
  market_trends TEXT, -- JSON array
  opportunities TEXT, -- JSON array
  threats TEXT, -- JSON array
  market_size TEXT,
  growth_rate TEXT,
  success_probability REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- MVP Prototypes table
CREATE TABLE IF NOT EXISTS mvp_prototypes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  features TEXT, -- JSON array
  wireframe_url TEXT,
  tech_stack TEXT, -- JSON array
  estimated_time TEXT,
  estimated_cost TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Beta Users table
CREATE TABLE IF NOT EXISTS beta_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  age INTEGER,
  industry TEXT,
  bio TEXT,
  available BOOLEAN DEFAULT 1,
  rating REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test Results table (feedback de usuarios beta)
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  beta_user_id INTEGER NOT NULL,
  rating INTEGER, -- 1-5
  feedback TEXT,
  would_pay BOOLEAN,
  suggested_price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (beta_user_id) REFERENCES beta_users(id)
);

-- Growth Strategies table
CREATE TABLE IF NOT EXISTS growth_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  strategy_type TEXT, -- PLG, Content, Referral, SEO, etc.
  title TEXT NOT NULL,
  description TEXT,
  channels TEXT, -- JSON array
  estimated_cac TEXT,
  estimated_ltv TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  metric_type TEXT NOT NULL, -- interest, retention, cac, ltv, etc.
  value REAL NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_market_analysis_project_id ON market_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_mvp_prototypes_project_id ON mvp_prototypes(project_id);
CREATE INDEX IF NOT EXISTS idx_test_results_project_id ON test_results(project_id);
CREATE INDEX IF NOT EXISTS idx_growth_strategies_project_id ON growth_strategies(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON metrics(project_id);
