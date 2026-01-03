-- Migration: Enhanced Goals System (Fixed - only missing columns)
-- Adds comprehensive goal management fields

-- Check and add columns that might not exist
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll try to add each column and some may fail if they exist

ALTER TABLE goals ADD COLUMN task TEXT;
ALTER TABLE goals ADD COLUMN priority TEXT DEFAULT 'P0' CHECK (priority IN ('P0', 'P1', 'P2', 'P3'));
ALTER TABLE goals ADD COLUMN priority_label TEXT DEFAULT 'Urgent & important' CHECK (
  priority_label IN ('Urgent & important', 'Urgent or important', 'Urgent but not important', 'Neither but cool')
);
ALTER TABLE goals ADD COLUMN cadence TEXT DEFAULT 'One time' CHECK (
  cadence IN ('One time', 'Recurrent')
);
ALTER TABLE goals ADD COLUMN dri TEXT;
ALTER TABLE goals ADD COLUMN goal_status TEXT DEFAULT 'To start' CHECK (
  goal_status IN ('WIP', 'To start', 'On Hold', 'Delayed', 'Blocked', 'Done')
);
ALTER TABLE goals ADD COLUMN day_mon INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_tue INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_wed INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_thu INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_fri INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_sat INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN day_sun INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN week_of TEXT;
ALTER TABLE goals ADD COLUMN order_index INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_goal_status ON goals(goal_status);
CREATE INDEX IF NOT EXISTS idx_goals_week_of ON goals(week_of);
CREATE INDEX IF NOT EXISTS idx_goals_order_index ON goals(order_index);
