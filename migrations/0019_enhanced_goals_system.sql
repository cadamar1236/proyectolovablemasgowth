-- Migration: Enhanced Goals System with Priority, Cadence, DRI, Status tracking
-- Adds comprehensive goal management fields matching the Eisenhower Matrix style

-- Add new columns to goals table
ALTER TABLE goals ADD COLUMN category TEXT DEFAULT 'ASTAR';
ALTER TABLE goals ADD COLUMN task TEXT;
ALTER TABLE goals ADD COLUMN priority TEXT DEFAULT 'P0' CHECK (priority IN ('P0', 'P1', 'P2', 'P3'));
ALTER TABLE goals ADD COLUMN priority_label TEXT DEFAULT 'Urgent & Important' CHECK (
  priority_label IN ('Urgent & important', 'Urgent or important', 'Urgent but not important', 'Neither but cool')
);
ALTER TABLE goals ADD COLUMN cadence TEXT DEFAULT 'One time' CHECK (
  cadence IN ('One time', 'Recurrent', 'One time')
);
ALTER TABLE goals ADD COLUMN dri TEXT DEFAULT 'Giorgio'; -- Directly Responsible Individual
ALTER TABLE goals ADD COLUMN goal_status TEXT DEFAULT 'To start' CHECK (
  goal_status IN ('WIP', 'To start', 'On Hold', 'Delayed', 'Blocked', 'Done')
);

-- Add date tracking columns for weekly progress
ALTER TABLE goals ADD COLUMN day_mon INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_tue INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_wed INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_thu INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_fri INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_sat INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_sun INTEGER DEFAULT 0;

-- Add metadata columns
ALTER TABLE goals ADD COLUMN week_of TEXT; -- e.g., "December 30"
ALTER TABLE goals ADD COLUMN order_index INTEGER DEFAULT 0; -- For custom ordering

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_goal_status ON goals(goal_status);
CREATE INDEX IF NOT EXISTS idx_goals_week_of ON goals(week_of);
CREATE INDEX IF NOT EXISTS idx_goals_order_index ON goals(order_index);

-- Create a view for easier goal querying with all fields
CREATE VIEW IF NOT EXISTS goals_detailed AS
SELECT 
  g.id,
  g.user_id,
  g.category,
  g.description,
  g.task,
  g.priority,
  g.priority_label,
  g.cadence,
  g.dri,
  g.goal_status,
  g.status as legacy_status,
  g.day_mon,
  g.day_tue,
  g.day_wed,
  g.day_thu,
  g.day_fri,
  g.day_sat,
  g.day_sun,
  g.week_of,
  g.order_index,
  g.created_at,
  g.updated_at,
  u.name as user_name,
  u.email as user_email
FROM goals g
LEFT JOIN users u ON g.user_id = u.id
ORDER BY g.order_index ASC, g.priority ASC, g.created_at DESC;
