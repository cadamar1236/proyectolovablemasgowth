-- Migration: Competition Voting and Scoring System
-- Adds voting system for validators and investors to rate competition participants
-- Voting weight: Investor votes = 2x, Validator votes = 1x

CREATE TABLE IF NOT EXISTS competition_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL, -- References competition_participants.id
  voter_id INTEGER NOT NULL, -- User who is voting
  voter_role TEXT NOT NULL CHECK (voter_role IN ('investor', 'validator')),
  vote_score INTEGER NOT NULL CHECK (vote_score >= 1 AND vote_score <= 10),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES competition_participants(id) ON DELETE CASCADE,
  FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(competition_id, participant_id, voter_id) -- One vote per voter per participant
);

CREATE INDEX IF NOT EXISTS idx_competition_votes_competition ON competition_votes(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_votes_participant ON competition_votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_competition_votes_voter ON competition_votes(voter_id);

-- Add ranking columns to competition_participants
ALTER TABLE competition_participants ADD COLUMN total_score REAL DEFAULT 0;
ALTER TABLE competition_participants ADD COLUMN growth_score REAL DEFAULT 0;
ALTER TABLE competition_participants ADD COLUMN vote_score REAL DEFAULT 0;
ALTER TABLE competition_participants ADD COLUMN current_rank INTEGER DEFAULT 0;
