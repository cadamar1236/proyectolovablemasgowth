-- Migration: Goal Daily Completion Tracking
-- Date: 2026-02-01
-- Description: Tracks completion status for each scheduled day of a goal
--              Allows goals to be marked as done per day instead of globally

-- Create table for tracking daily completion status
CREATE TABLE IF NOT EXISTS goal_daily_completion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  completion_date TEXT NOT NULL, -- YYYY-MM-DD format
  is_completed INTEGER DEFAULT 0, -- 0 = not done, 1 = done
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  UNIQUE(goal_id, completion_date)
);

-- Add priority_order column to goals for custom ordering within a day
ALTER TABLE goals ADD COLUMN priority_order INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_daily_completion_goal_id ON goal_daily_completion(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_daily_completion_date ON goal_daily_completion(completion_date);
CREATE INDEX IF NOT EXISTS idx_goal_daily_completion_goal_date ON goal_daily_completion(goal_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_goals_priority_order ON goals(priority_order);

-- Initialize goal_daily_completion records for existing goals with scheduled_dates
INSERT INTO goal_daily_completion (goal_id, completion_date, is_completed)
SELECT 
  g.id,
  json_each.value,
  CASE WHEN g.goal_status = 'Done' THEN 1 ELSE 0 END
FROM goals g,
     json_each(COALESCE(g.scheduled_dates, '[]'))
WHERE g.scheduled_dates IS NOT NULL 
  AND g.scheduled_dates != '[]'
  AND g.scheduled_dates != ''
ON CONFLICT(goal_id, completion_date) DO NOTHING;
