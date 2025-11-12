-- Add AI analysis field to projects table for Quick Pitch feature
-- This stores the AI-generated analysis including score, strengths, opportunities

ALTER TABLE projects ADD COLUMN ai_analysis TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_ai_analysis ON projects(ai_analysis) WHERE ai_analysis IS NOT NULL;
