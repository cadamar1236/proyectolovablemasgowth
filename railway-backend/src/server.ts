/**
 * ASTAR* Railway Backend Server
 * Backup server that runs on Railway with PostgreSQL
 * Mirrors the Cloudflare Workers API
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    (req as any).user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'railway', timestamp: new Date().toISOString() });
});

// ============== AUTH ROUTES ==============

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (if using password auth)
    if (user.password_hash && password) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
      company: user.company
    }
  });
});

// ============== EVENTS ROUTES ==============

// List events
app.get('/api/events', async (req, res) => {
  try {
    const { status, featured } = req.query;
    
    let query = `
      SELECT 
        e.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (featured === 'true') {
      query += ` AND e.is_featured = true`;
    }

    query += ` ORDER BY e.event_date ASC`;

    const result = await pool.query(query, params);

    const events = result.rows.map((event: any) => ({
      ...event,
      tags: event.tags ? (typeof event.tags === 'string' ? JSON.parse(event.tags) : event.tags) : [],
      is_featured: Boolean(event.is_featured)
    }));

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;

    const eventResult = await pool.query(`
      SELECT 
        e.*,
        u.name as creator_name,
        u.avatar_url as creator_avatar,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Get registrations
    const regResult = await pool.query(`
      SELECT 
        er.*,
        u.name,
        u.email,
        u.avatar_url,
        u.company,
        u.role
      FROM event_registrations er
      LEFT JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.registered_at ASC
    `, [eventId]);

    res.json({
      success: true,
      event: {
        ...event,
        tags: event.tags ? (typeof event.tags === 'string' ? JSON.parse(event.tags) : event.tags) : [],
        is_featured: Boolean(event.is_featured),
        registrations: regResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (admin only)
app.post('/api/events', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      title, description, event_type, event_date, event_time,
      duration_minutes, location, meeting_link, registration_link,
      max_participants, banner_image_url, host_name, host_avatar,
      tags, is_featured
    } = req.body;

    if (!title || !description || !event_date) {
      return res.status(400).json({ error: 'Title, description, and event date are required' });
    }

    const result = await pool.query(`
      INSERT INTO events (
        title, description, event_type, event_date, event_time, duration_minutes,
        location, meeting_link, registration_link, max_participants,
        banner_image_url, host_name, host_avatar, tags, is_featured, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `, [
      title, description, event_type || 'pitch', event_date, event_time,
      duration_minutes || 60, location, meeting_link, registration_link,
      max_participants, banner_image_url, host_name, host_avatar,
      tags ? JSON.stringify(tags) : null, is_featured || false, user.id
    ]);

    res.json({
      success: true,
      message: 'Event created successfully',
      event_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Delete event (admin only)
app.delete('/api/events/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Register for event
app.post('/api/events/:id/register', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = req.params.id;

    // Check if event exists and has space
    const eventResult = await pool.query(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count
      FROM events e
      WHERE e.id = $1
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];
    if (event.max_participants && event.registered_count >= event.max_participants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check if already registered
    const existing = await pool.query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    await pool.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)',
      [eventId, user.id]
    );

    res.json({ success: true, message: 'Successfully registered for event' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Unregister from event
app.delete('/api/events/:id/register', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await pool.query(
      'DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [req.params.id, user.id]
    );
    res.json({ success: true, message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

// ============== COMPETITIONS ROUTES ==============

app.get('/api/competitions', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT cp.id) as participant_count
      FROM competitions c
      LEFT JOIN competition_participants cp ON c.id = cp.competition_id
      WHERE c.status = $1
    `;
    const params: any[] = [status || 'active'];

    if (type) {
      query += ' AND c.competition_type = $2';
      params.push(type);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ competitions: result.rows });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// ============== USERS/DIRECTORY ROUTES ==============

app.get('/api/marketplace/directory', async (req, res) => {
  try {
    const { role, search, limit = 50 } = req.query;

    let query = `
      SELECT 
        id, name, email, role, avatar_url, company, 
        linkedin_url, location, bio, created_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (role && role !== 'all') {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR bio ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Error fetching directory:', error);
    res.status(500).json({ error: 'Failed to fetch directory' });
  }
});

// ============== LEADERBOARD ROUTES ==============

app.get('/api/dashboard/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        u.company,
        COALESCE(
          (SELECT SUM(points) FROM goal_completions WHERE user_id = u.id),
          0
        ) as total_points,
        COALESCE(
          (SELECT COUNT(*) FROM goal_completions WHERE user_id = u.id),
          0
        ) as goals_completed
      FROM users u
      WHERE u.role = 'founder'
      ORDER BY total_points DESC
      LIMIT 50
    `);

    res.json({ success: true, leaderboard: result.rows });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ASTAR* Railway Backend (API Only) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 APIs available at /api/*`);
});

export default app;
