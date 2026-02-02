/**
 * PostgreSQL Migration Script for Railway
 * Creates all tables needed for ASTAR* backup
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const migrations = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'founder',
  avatar_url TEXT,
  company VARCHAR(255),
  linkedin_url TEXT,
  location VARCHAR(255),
  bio TEXT,
  user_type VARCHAR(50),
  investment_focus TEXT,
  sectors_of_interest TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'pitch',
  event_date DATE NOT NULL,
  event_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255),
  meeting_link TEXT,
  registration_link TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  banner_image_url TEXT,
  host_name VARCHAR(255),
  host_avatar TEXT,
  tags JSONB,
  status VARCHAR(50) DEFAULT 'upcoming',
  is_featured BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attendance_status VARCHAR(50) DEFAULT 'registered',
  UNIQUE(event_id, user_id)
);

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  competition_type VARCHAR(50) DEFAULT 'weekly',
  start_date DATE,
  end_date DATE,
  prize_amount DECIMAL(10, 2),
  prize_description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competition participants
CREATE TABLE IF NOT EXISTS competition_participants (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status VARCHAR(50) DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  UNIQUE(competition_id, user_id)
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50),
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Goal completions for points
CREATE TABLE IF NOT EXISTS goal_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website_url TEXT,
  pitch_deck_url TEXT,
  stage VARCHAR(50),
  industry VARCHAR(100),
  funding_goal DECIMAL(12, 2),
  current_funding DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
`;

async function runMigrations() {
  console.log('🚀 Running PostgreSQL migrations...');
  
  try {
    await pool.query(migrations);
    console.log('✅ Migrations completed successfully!');
    
    // Check tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
