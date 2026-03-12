-- Migration 0034: Add action_items and last_seen_at to astro_sessions
-- action_items: JSON array of next steps from last session  
-- days_since_last: computed, not stored
-- last_seen_at: tracks when the user last visited (for weekly follow-up)

ALTER TABLE astro_sessions ADD COLUMN action_items TEXT; -- JSON array: ["step1","step2",...]
ALTER TABLE astro_sessions ADD COLUMN last_seen_at DATETIME;
ALTER TABLE astro_sessions ADD COLUMN language TEXT DEFAULT 'es'; -- detected language
