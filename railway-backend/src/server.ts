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
app.use(cors({
  origin: [
    'https://vercel-frontend-three-teal.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, role, avatar_url
    `, [name, email, password_hash, role || 'founder']);

    const user = result.rows[0];

    // Create token
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
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============== DASHBOARD ROUTES ==============

// Get dashboard data
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get user stats
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM goals WHERE user_id = $1) as total_goals,
        (SELECT COUNT(*) FROM goals WHERE user_id = $1 AND status = 'completed') as completed_goals,
        (SELECT COUNT(*) FROM projects WHERE founder_id = $1) as total_projects,
        (SELECT COALESCE(SUM(points), 0) FROM goal_completions WHERE user_id = $1) as total_points
    `, [user.id]);

    res.json({
      success: true,
      stats: statsResult.rows[0],
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get goals
app.get('/api/dashboard/goals', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const result = await pool.query(`
      SELECT * FROM goals 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user.id]);

    res.json({ success: true, goals: result.rows });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal
app.post('/api/dashboard/goals', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, description, target_value, metric_type } = req.body;

    const result = await pool.query(`
      INSERT INTO goals (user_id, title, description, target_value, metric_type, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW())
      RETURNING *
    `, [user.id, title, description, target_value, metric_type]);

    res.json({ success: true, goal: result.rows[0] });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
app.put('/api/dashboard/goals/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { title, description, target_value, status, current_value } = req.body;

    const result = await pool.query(`
      UPDATE goals 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          target_value = COALESCE($3, target_value),
          status = COALESCE($4, status),
          current_value = COALESCE($5, current_value),
          updated_at = NOW()
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `, [title, description, target_value, status, current_value, id, user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ success: true, goal: result.rows[0] });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
app.delete('/api/dashboard/goals/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, user.id]);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// ============== MARKETPLACE ROUTES ==============

// Get projects
app.get('/api/marketplace/projects', async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    
    let query = `
      SELECT p.*, u.name as founder_name, u.avatar_url as founder_avatar,
        (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id) as vote_count
      FROM projects p
      LEFT JOIN users u ON p.founder_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      query += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ success: true, projects: result.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
app.get('/api/marketplace/projects/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as founder_name, u.avatar_url as founder_avatar,
        (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id) as vote_count
      FROM projects p
      LEFT JOIN users u ON p.founder_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Vote for project
app.post('/api/marketplace/projects/:id/vote', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const projectId = req.params.id;

    // Check if already voted
    const existing = await pool.query(
      'SELECT id FROM project_votes WHERE project_id = $1 AND user_id = $2',
      [projectId, user.id]
    );

    if (existing.rows.length > 0) {
      // Unvote
      await pool.query(
        'DELETE FROM project_votes WHERE project_id = $1 AND user_id = $2',
        [projectId, user.id]
      );
      res.json({ success: true, message: 'Vote removed', voted: false });
    } else {
      // Vote
      await pool.query(
        'INSERT INTO project_votes (project_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [projectId, user.id]
      );
      res.json({ success: true, message: 'Vote added', voted: true });
    }
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// ============== CHAT ROUTES ==============

// Get messages
app.get('/api/chat/messages', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 50 } = req.query;

    const result = await pool.query(`
      SELECT * FROM chat_messages
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [user.id, limit]);

    res.json({ success: true, messages: result.rows.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message (AI chat)
app.post('/api/chat/messages', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { message } = req.body;

    // Save user message
    await pool.query(`
      INSERT INTO chat_messages (user_id, role, content, created_at)
      VALUES ($1, 'user', $2, NOW())
    `, [user.id, message]);

    // Simple AI response (you can integrate with OpenAI here)
    const aiResponse = "Thanks for your message! I'm here to help. How can I assist you today?";

    // Save AI response
    await pool.query(`
      INSERT INTO chat_messages (user_id, role, content, created_at)
      VALUES ($1, 'assistant', $2, NOW())
    `, [user.id, aiResponse]);

    res.json({ success: true, message: aiResponse, response: aiResponse });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============== NOTIFICATIONS ROUTES ==============

// Get notifications
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [user.id]);

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await pool.query(`
      UPDATE notifications 
      SET read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
    `, [req.params.id, user.id]);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
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

// Register for event (RSVP)
app.post('/api/events/:id/rsvp', requireAuth, async (req, res) => {
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
    res.json({ success: true, competitions: result.rows });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Get competition by ID
app.get('/api/competitions/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT cp.id) as participant_count
      FROM competitions c
      LEFT JOIN competition_participants cp ON c.id = cp.competition_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    res.json({ success: true, competition: result.rows[0] });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// Submit to competition
app.post('/api/competitions/:id/submit', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const competitionId = req.params.id;
    const { project_id, submission_data } = req.body;

    // Check if already submitted
    const existing = await pool.query(
      'SELECT id FROM competition_participants WHERE competition_id = $1 AND user_id = $2',
      [competitionId, user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already submitted to this competition' });
    }

    // Create submission
    const result = await pool.query(`
      INSERT INTO competition_participants (competition_id, user_id, project_id, submission_data, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [competitionId, user.id, project_id, submission_data ? JSON.stringify(submission_data) : null]);

    res.json({ success: true, message: 'Successfully submitted to competition', submission_id: result.rows[0].id });
  } catch (error) {
    console.error('Error submitting to competition:', error);
    res.status(500).json({ error: 'Failed to submit to competition' });
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
