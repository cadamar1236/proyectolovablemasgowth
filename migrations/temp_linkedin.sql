CREATE TABLE IF NOT EXISTS linkedin_connections (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, profile_id TEXT NOT NULL, name TEXT NOT NULL, headline TEXT NOT NULL, location TEXT NOT NULL, industry TEXT NOT NULL, profile_url TEXT NOT NULL, compatibility_score INTEGER DEFAULT 0, campaign TEXT NOT NULL, status TEXT DEFAULT 'pending', notes TEXT, contacted_at DATETIME, responded_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_user_id ON linkedin_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_campaign ON linkedin_connections(campaign);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_status ON linkedin_connections(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_profile_id ON linkedin_connections(profile_id);
