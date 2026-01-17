-- Add remaining days for weekly timeline
-- Note: day_mon, day_tue, day_wed might already exist

-- Add Thursday column
ALTER TABLE goals ADD COLUMN day_thu INTEGER DEFAULT 0;

-- Add Friday column  
ALTER TABLE goals ADD COLUMN day_fri INTEGER DEFAULT 0;

-- Add Saturday column
ALTER TABLE goals ADD COLUMN day_sat INTEGER DEFAULT 0;

-- Add Sunday column
ALTER TABLE goals ADD COLUMN day_sun INTEGER DEFAULT 0;
