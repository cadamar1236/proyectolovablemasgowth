-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_amount TEXT,
  competition_type TEXT NOT NULL, -- 'weekly' or 'monthly'
  event_date TEXT, -- For monthly pitch events
  event_time TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'active', -- active, closed, completed
  guidelines TEXT,
  payment_link TEXT, -- Four Revenues payment link
  ticket_required BOOLEAN DEFAULT 0,
  ticket_price REAL DEFAULT 0,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Competition Participants table
CREATE TABLE IF NOT EXISTS competition_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  project_id INTEGER, -- Link to user's project
  startup_name TEXT,
  pitch_deck_url TEXT,
  submission_notes TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_id TEXT,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(competition_id, user_id)
);

-- Competition Winners table
CREATE TABLE IF NOT EXISTS competition_winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position INTEGER NOT NULL, -- 1, 2, 3
  prize_amount TEXT,
  announced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample competitions
INSERT INTO competitions (title, description, prize_amount, competition_type, deadline, guidelines, ticket_required, ticket_price, status) VALUES
('Mars Rover Challenge', 'Build the most efficient autonomous navigation system for planetary exploration.', '$10k', 'weekly', '2026-12-31', 'Submit your autonomous navigation system with complete documentation and demo video.', 0, 0, 'active'),
('Asteroid Mining Pitch', 'Founders presenting innovative solutions for sustainable resource extraction in space.', 'VC Pitch', 'weekly', '2026-12-31', 'Prepare a 5-minute pitch deck showcasing your space mining solution.', 0, 0, 'active');

-- Insert monthly event
INSERT INTO competitions (title, description, prize_amount, competition_type, event_date, event_time, deadline, guidelines, ticket_required, ticket_price, location, payment_link, status) VALUES
('SESSIONS L18', 'Monthly pitch event where you can pitch your startup. Winner takes home the prize pool from ticket sales.', 'Prize Pool', 'monthly', '2026-01-08', '21:00 - 04:00', '2026-01-07', 'Prepare a 5-minute pitch. Event requires a ticket purchase. Winner takes home the entire prize pool!', 1, 25, 'MAGERIT LAGASCA 18', 'https://fourrevenues.com/sessions-l18', 'active');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON competition_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_winners_competition ON competition_winners(competition_id);
