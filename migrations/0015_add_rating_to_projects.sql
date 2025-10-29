-- Migration: Add rating columns to projects table for leaderboard
-- Adds rating_average and votes_count columns to projects table

-- Add rating fields to projects table
ALTER TABLE projects ADD COLUMN rating_average REAL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN votes_count INTEGER DEFAULT 0;

-- Create index for leaderboard ordering
CREATE INDEX IF NOT EXISTS idx_projects_rating ON projects(rating_average DESC, votes_count DESC);