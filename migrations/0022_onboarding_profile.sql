-- Onboarding profile migration
-- Adding all onboarding fields (some may already exist, will handle in API)

-- Basic tracking
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;

-- Contact and social
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN linkedin_url TEXT;
ALTER TABLE users ADD COLUMN twitter_url TEXT;
ALTER TABLE users ADD COLUMN website_url TEXT;

-- Founder-specific fields
ALTER TABLE users ADD COLUMN startup_name TEXT;
ALTER TABLE users ADD COLUMN startup_stage TEXT;
ALTER TABLE users ADD COLUMN industry TEXT;
ALTER TABLE users ADD COLUMN funding_status TEXT;
ALTER TABLE users ADD COLUMN funding_goal TEXT;
ALTER TABLE users ADD COLUMN team_size TEXT;
ALTER TABLE users ADD COLUMN target_market TEXT;
ALTER TABLE users ADD COLUMN pitch_deck_url TEXT;

-- Investor-specific fields
ALTER TABLE users ADD COLUMN investor_type TEXT;
ALTER TABLE users ADD COLUMN investment_stage TEXT;
ALTER TABLE users ADD COLUMN check_size TEXT;
ALTER TABLE users ADD COLUMN investment_focus TEXT;
ALTER TABLE users ADD COLUMN geographic_focus TEXT;
ALTER TABLE users ADD COLUMN portfolio_size TEXT;
ALTER TABLE users ADD COLUMN notable_investments TEXT;

-- Scout-specific fields
ALTER TABLE users ADD COLUMN scout_for TEXT;
ALTER TABLE users ADD COLUMN scout_focus TEXT;
ALTER TABLE users ADD COLUMN scout_commission TEXT;
ALTER TABLE users ADD COLUMN deals_closed TEXT;

-- Partner-specific fields
ALTER TABLE users ADD COLUMN partner_type TEXT;
ALTER TABLE users ADD COLUMN services_offered TEXT;
ALTER TABLE users ADD COLUMN target_clients TEXT;
ALTER TABLE users ADD COLUMN case_studies TEXT;

-- Job Seeker-specific fields
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN experience_years TEXT;
ALTER TABLE users ADD COLUMN skills TEXT;
ALTER TABLE users ADD COLUMN looking_for TEXT;
ALTER TABLE users ADD COLUMN salary_expectation TEXT;
ALTER TABLE users ADD COLUMN resume_url TEXT;
ALTER TABLE users ADD COLUMN github_url TEXT;
ALTER TABLE users ADD COLUMN portfolio_url TEXT;

-- Onboarding session tracking
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_data TEXT,
  completed BOOLEAN DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
