-- Migration: Events System
-- Create events table for ASTAR* platform events

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT DEFAULT 'pitch', -- pitch, workshop, networking, webinar, competition
    event_date DATETIME NOT NULL,
    event_time TEXT, -- e.g., "18:00 UTC"
    duration_minutes INTEGER DEFAULT 60,
    location TEXT, -- Physical location or "Online"
    meeting_link TEXT, -- Zoom, Google Meet, etc.
    registration_link TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    banner_image_url TEXT,
    host_name TEXT,
    host_avatar TEXT,
    tags TEXT, -- JSON array: ["early-stage", "fundraising", "AI"]
    status TEXT DEFAULT 'upcoming', -- upcoming, live, past, cancelled
    is_featured BOOLEAN DEFAULT 0,
    created_by INTEGER NOT NULL, -- User ID of creator (admin)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attendance_status TEXT DEFAULT 'registered', -- registered, attended, no-show, cancelled
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id) -- One registration per user per event
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
