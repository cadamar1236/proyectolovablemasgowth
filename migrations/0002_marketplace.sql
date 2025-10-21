-- Migration: Beta Validators Marketplace
-- Adds authentication, professional validator profiles, and product listings

-- Enhanced Users table with authentication
-- Note: We keep the original users table and extend it
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'founder'; -- founder, validator, admin
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN company TEXT;

-- Validators table (professional beta testers)
CREATE TABLE IF NOT EXISTS validators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL, -- "Senior Product Designer", "Mobile Developer"
  expertise TEXT NOT NULL, -- JSON array: ["SaaS", "Fintech", "Mobile"]
  experience_years INTEGER DEFAULT 0,
  hourly_rate REAL,
  availability TEXT DEFAULT 'available', -- available, busy, unavailable
  languages TEXT, -- JSON array: ["en", "es", "fr"]
  portfolio_url TEXT,
  linkedin_url TEXT,
  rating REAL DEFAULT 0,
  total_validations INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  response_time_hours REAL DEFAULT 24,
  verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Validator Certifications
CREATE TABLE IF NOT EXISTS validator_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validator_id INTEGER NOT NULL,
  name TEXT NOT NULL, -- "Google UX Design Certificate"
  issuer TEXT NOT NULL, -- "Google", "Meta"
  issue_date DATE,
  expiry_date DATE,
  credential_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (validator_id) REFERENCES validators(id)
);

-- Beta Products table (products companies want validated)
CREATE TABLE IF NOT EXISTS beta_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- SaaS, Mobile, Web3, etc.
  subcategory TEXT, -- CRM, Analytics, Gaming, etc.
  stage TEXT DEFAULT 'alpha', -- concept, alpha, beta, production
  url TEXT, -- Product URL or demo
  looking_for TEXT NOT NULL, -- What kind of feedback they want
  compensation_type TEXT DEFAULT 'free_access', -- free_access, paid, equity
  compensation_amount REAL,
  duration_days INTEGER DEFAULT 14, -- How long the beta test lasts
  validators_needed INTEGER DEFAULT 5,
  validators_accepted INTEGER DEFAULT 0,
  requirements TEXT, -- JSON: {"min_rating": 4.0, "expertise": ["SaaS"]}
  status TEXT DEFAULT 'active', -- draft, active, in_progress, completed, closed
  start_date DATE,
  end_date DATE,
  featured BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_user_id) REFERENCES users(id)
);

-- Validator Applications (validators apply to test products)
CREATE TABLE IF NOT EXISTS validator_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
  message TEXT, -- Why they want to test this product
  accepted_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES beta_products(id),
  FOREIGN KEY (validator_id) REFERENCES validators(id),
  UNIQUE(product_id, validator_id)
);

-- Validation Sessions (accepted applications become sessions)
CREATE TABLE IF NOT EXISTS validation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  progress INTEGER DEFAULT 0, -- 0-100%
  hours_spent REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES validator_applications(id),
  FOREIGN KEY (product_id) REFERENCES beta_products(id),
  FOREIGN KEY (validator_id) REFERENCES validators(id)
);

-- Validation Reports (detailed feedback from validators)
CREATE TABLE IF NOT EXISTS validation_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  validator_id INTEGER NOT NULL,
  
  -- Overall ratings
  overall_rating INTEGER, -- 1-5
  usability_rating INTEGER, -- 1-5
  design_rating INTEGER, -- 1-5
  performance_rating INTEGER, -- 1-5
  value_rating INTEGER, -- 1-5
  
  -- Detailed feedback
  pros TEXT, -- JSON array
  cons TEXT, -- JSON array
  bugs_found TEXT, -- JSON array
  feature_requests TEXT, -- JSON array
  detailed_feedback TEXT, -- Long form text
  
  -- Business insights
  would_recommend BOOLEAN,
  would_pay BOOLEAN,
  suggested_price REAL,
  target_audience_match BOOLEAN,
  
  -- Media
  screenshots TEXT, -- JSON array of URLs
  video_url TEXT,
  
  -- Meta
  status TEXT DEFAULT 'draft', -- draft, submitted, published
  submitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES validation_sessions(id),
  FOREIGN KEY (product_id) REFERENCES beta_products(id),
  FOREIGN KEY (validator_id) REFERENCES validators(id)
);

-- Reviews (companies review validators, validators review products)
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewer_id INTEGER NOT NULL, -- user_id of reviewer
  reviewee_id INTEGER NOT NULL, -- user_id being reviewed OR product_id
  reviewee_type TEXT NOT NULL, -- 'validator' or 'product'
  session_id INTEGER,
  rating INTEGER NOT NULL, -- 1-5
  title TEXT,
  comment TEXT,
  pros TEXT, -- JSON array
  cons TEXT, -- JSON array
  helpful_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES validation_sessions(id)
);

-- Validator Earnings (track compensation)
CREATE TABLE IF NOT EXISTS validator_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validator_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL, -- 'hourly', 'fixed', 'bonus'
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (validator_id) REFERENCES validators(id),
  FOREIGN KEY (session_id) REFERENCES validation_sessions(id)
);

-- Messages (communication between companies and validators)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  product_id INTEGER,
  session_id INTEGER,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES beta_products(id),
  FOREIGN KEY (session_id) REFERENCES validation_sessions(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'application', 'acceptance', 'message', 'review', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_validators_user_id ON validators(user_id);
CREATE INDEX IF NOT EXISTS idx_validators_rating ON validators(rating DESC);
CREATE INDEX IF NOT EXISTS idx_validators_availability ON validators(availability);

CREATE INDEX IF NOT EXISTS idx_beta_products_status ON beta_products(status);
CREATE INDEX IF NOT EXISTS idx_beta_products_category ON beta_products(category);
CREATE INDEX IF NOT EXISTS idx_beta_products_featured ON beta_products(featured);
CREATE INDEX IF NOT EXISTS idx_beta_products_company ON beta_products(company_user_id);

CREATE INDEX IF NOT EXISTS idx_applications_product ON validator_applications(product_id);
CREATE INDEX IF NOT EXISTS idx_applications_validator ON validator_applications(validator_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON validator_applications(status);

CREATE INDEX IF NOT EXISTS idx_sessions_validator ON validation_sessions(validator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_product ON validation_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON validation_sessions(status);

CREATE INDEX IF NOT EXISTS idx_reports_session ON validation_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_product ON validation_reports(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id, reviewee_type);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read);

-- Insert sample validators
INSERT INTO users (email, name, role, bio, company) VALUES
  ('validator1@email.com', 'Sarah Chen', 'validator', 'Senior Product Designer with 8 years experience in SaaS', 'Freelance'),
  ('validator2@email.com', 'Marcus Rodriguez', 'validator', 'Full-stack developer specializing in fintech applications', 'Tech Consultant'),
  ('validator3@email.com', 'Emma Watson', 'validator', 'UX Researcher focused on mobile and healthcare apps', 'UX Studio');

INSERT INTO validators (user_id, title, expertise, experience_years, hourly_rate, languages, rating, total_validations, success_rate, verified) VALUES
  (
    (SELECT id FROM users WHERE email = 'validator1@email.com'),
    'Senior Product Designer',
    '["SaaS", "B2B", "Enterprise", "Design Systems"]',
    8,
    75.00,
    '["en", "es", "zh"]',
    4.8,
    127,
    94.5,
    1
  ),
  (
    (SELECT id FROM users WHERE email = 'validator2@email.com'),
    'Full-Stack Developer',
    '["Fintech", "Mobile", "Web3", "Security"]',
    6,
    65.00,
    '["en", "es"]',
    4.9,
    89,
    96.2,
    1
  ),
  (
    (SELECT id FROM users WHERE email = 'validator3@email.com'),
    'UX Researcher',
    '["Healthcare", "Mobile", "Accessibility", "User Testing"]',
    5,
    60.00,
    '["en", "fr"]',
    4.7,
    156,
    91.8,
    1
  );

-- Insert sample beta products
INSERT INTO users (email, name, role, company) VALUES
  ('company1@startup.com', 'TechCorp', 'founder', 'TechCorp Inc'),
  ('company2@startup.com', 'HealthApp', 'founder', 'HealthApp Ltd');

INSERT INTO beta_products (
  company_user_id, 
  title, 
  description, 
  category, 
  subcategory,
  stage,
  url,
  looking_for,
  compensation_type,
  compensation_amount,
  duration_days,
  validators_needed,
  requirements,
  status,
  featured
) VALUES
  (
    (SELECT id FROM users WHERE email = 'company1@startup.com'),
    'DataFlow Analytics - Business Intelligence Platform',
    'Real-time analytics dashboard for enterprise teams. We need validation on UX, performance, and feature completeness before our Series A launch.',
    'SaaS',
    'Analytics',
    'beta',
    'https://dataflow-demo.com',
    'UX feedback, performance testing, feature validation, competitive analysis',
    'paid',
    500.00,
    21,
    8,
    '{"min_rating": 4.5, "expertise": ["SaaS", "B2B", "Enterprise"], "experience_years": 3}',
    'active',
    1
  ),
  (
    (SELECT id FROM users WHERE email = 'company2@startup.com'),
    'MediTrack - Patient Health Monitoring App',
    'Mobile app for patients to track vitals and communicate with doctors. Need validation on usability and HIPAA compliance.',
    'Mobile',
    'Healthcare',
    'alpha',
    'https://meditrack-test.app',
    'Usability testing, accessibility review, privacy compliance feedback',
    'paid',
    350.00,
    14,
    5,
    '{"min_rating": 4.0, "expertise": ["Healthcare", "Mobile"], "experience_years": 2}',
    'active',
    1
  );
