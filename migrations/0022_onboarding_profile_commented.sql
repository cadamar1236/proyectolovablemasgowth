-- Script to check and add only missing columns to users table
-- Note: SQLite doesn't support "IF NOT EXISTS" for ALTER TABLE ADD COLUMN
-- This script must be run manually per column that doesn't exist

-- To identify which columns exist, run: PRAGMA table_info(users);

-- Add onboarding fields (run only if column doesn't exist)
-- ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;
-- ALTER TABLE users ADD COLUMN phone TEXT;
-- ALTER TABLE users ADD COLUMN linkedin_url TEXT;
-- ALTER TABLE users ADD COLUMN twitter_url TEXT;
-- ALTER TABLE users ADD COLUMN website_url TEXT;

-- Founder fields
-- ALTER TABLE users ADD COLUMN startup_name TEXT;
-- ALTER TABLE users ADD COLUMN startup_stage TEXT;
-- ALTER TABLE users ADD COLUMN funding_status TEXT;
-- ALTER TABLE users ADD COLUMN funding_goal TEXT;
-- ALTER TABLE users ADD COLUMN team_size TEXT;
-- ALTER TABLE users ADD COLUMN pitch_deck_url TEXT;

-- Investor fields
-- ALTER TABLE users ADD COLUMN investor_type TEXT;
-- ALTER TABLE users ADD COLUMN investment_stage TEXT;
-- ALTER TABLE users ADD COLUMN check_size TEXT;
-- ALTER TABLE users ADD COLUMN investment_focus TEXT;
-- ALTER TABLE users ADD COLUMN geographic_focus TEXT;
-- ALTER TABLE users ADD COLUMN portfolio_size TEXT;
-- ALTER TABLE users ADD COLUMN notable_investments TEXT;

-- Scout fields
-- ALTER TABLE users ADD COLUMN scout_for TEXT;
-- ALTER TABLE users ADD COLUMN scout_focus TEXT;
-- ALTER TABLE users ADD COLUMN scout_commission TEXT;
-- ALTER TABLE users ADD COLUMN deals_closed TEXT;

-- Partner fields
-- ALTER TABLE users ADD COLUMN partner_type TEXT;
-- ALTER TABLE users ADD COLUMN services_offered TEXT;
-- ALTER TABLE users ADD COLUMN target_clients TEXT;
-- ALTER TABLE users ADD COLUMN case_studies TEXT;

-- Job Seeker fields
-- ALTER TABLE users ADD COLUMN job_title TEXT;
-- ALTER TABLE users ADD COLUMN experience_years TEXT;
-- ALTER TABLE users ADD COLUMN skills TEXT;
-- ALTER TABLE users ADD COLUMN looking_for TEXT;
-- ALTER TABLE users ADD COLUMN salary_expectation TEXT;
-- ALTER TABLE users ADD COLUMN resume_url TEXT;
-- ALTER TABLE users ADD COLUMN github_url TEXT;
-- ALTER TABLE users ADD COLUMN portfolio_url TEXT;

-- Onboarding session tracking (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_data TEXT,
  completed BOOLEAN DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
