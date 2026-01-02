-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN linkedin_url TEXT;
ALTER TABLE users ADD COLUMN twitter_url TEXT;
ALTER TABLE users ADD COLUMN website_url TEXT;

-- Founder-specific fields
ALTER TABLE users ADD COLUMN startup_name TEXT;
ALTER TABLE users ADD COLUMN startup_stage TEXT; -- idea, mvp, early_revenue, scaling, established
ALTER TABLE users ADD COLUMN industry TEXT;
ALTER TABLE users ADD COLUMN funding_status TEXT; -- bootstrapped, pre_seed, seed, series_a, series_b_plus
ALTER TABLE users ADD COLUMN funding_goal TEXT;
ALTER TABLE users ADD COLUMN team_size TEXT;
ALTER TABLE users ADD COLUMN target_market TEXT;
ALTER TABLE users ADD COLUMN pitch_deck_url TEXT;

-- Investor-specific fields
ALTER TABLE users ADD COLUMN investor_type TEXT; -- angel, vc, corporate, family_office
ALTER TABLE users ADD COLUMN investment_stage TEXT; -- pre_seed, seed, series_a, series_b_plus
ALTER TABLE users ADD COLUMN check_size TEXT; -- 10k-50k, 50k-250k, 250k-1m, 1m-5m, 5m_plus
ALTER TABLE users ADD COLUMN investment_focus TEXT; -- JSON array of industries
ALTER TABLE users ADD COLUMN geographic_focus TEXT; -- JSON array of regions
ALTER TABLE users ADD COLUMN portfolio_size TEXT;
ALTER TABLE users ADD COLUMN notable_investments TEXT; -- JSON array

-- Scout-specific fields
ALTER TABLE users ADD COLUMN scout_for TEXT; -- VC firm or angel group
ALTER TABLE users ADD COLUMN scout_focus TEXT; -- JSON array of what they're looking for
ALTER TABLE users ADD COLUMN scout_commission TEXT;
ALTER TABLE users ADD COLUMN deals_closed TEXT;

-- Partner-specific fields
ALTER TABLE users ADD COLUMN partner_type TEXT; -- service_provider, distributor, technology, strategic
ALTER TABLE users ADD COLUMN services_offered TEXT; -- JSON array
ALTER TABLE users ADD COLUMN target_clients TEXT; -- startups, enterprises, both
ALTER TABLE users ADD COLUMN case_studies TEXT; -- JSON array

-- Job Seeker-specific fields
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN experience_years TEXT;
ALTER TABLE users ADD COLUMN skills TEXT; -- JSON array
ALTER TABLE users ADD COLUMN looking_for TEXT; -- full_time, part_time, contract, advisory
ALTER TABLE users ADD COLUMN salary_expectation TEXT;
ALTER TABLE users ADD COLUMN resume_url TEXT;
ALTER TABLE users ADD COLUMN github_url TEXT;
ALTER TABLE users ADD COLUMN portfolio_url TEXT;

-- Onboarding session tracking
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_data TEXT, -- JSON with chat history and current step
  completed BOOLEAN DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
