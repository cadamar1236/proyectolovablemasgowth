/**
 * Events API
 * Endpoints for managing platform events
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// Get JWT Secret from environment
function getJWTSecret(env: Bindings): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return env.JWT_SECRET;
}

// JWT authentication middleware
const requireAuth = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, getJWTSecret(c.env)) as any;
    
    // Get user from database to ensure we have latest role
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role, avatar_url FROM users WHERE id = ?
    `).bind(payload.userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Middleware to check if user is admin
async function requireAdmin(c: any, next: any) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}

// GET /api/events - List all events
app.get('/', async (c) => {
  try {
    const { status, featured } = c.req.query();
    
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
    
    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }
    
    if (featured === 'true') {
      query += ` AND e.is_featured = 1`;
    }
    
    query += ` ORDER BY e.event_date ASC`;
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    const events = result.results.map((event: any) => ({
      ...event,
      tags: event.tags ? JSON.parse(event.tags) : [],
      is_featured: Boolean(event.is_featured)
    }));
    
    return c.json({ success: true, events });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// GET /api/events/:id - Get single event details
app.get('/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    
    const event = await c.env.DB.prepare(`
      SELECT 
        e.*,
        u.name as creator_name,
        u.avatar_url as creator_avatar,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).bind(eventId).first();
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    // Get registered users
    const registrations = await c.env.DB.prepare(`
      SELECT 
        er.*,
        u.name,
        u.email,
        u.avatar_url,
        u.company,
        u.role
      FROM event_registrations er
      LEFT JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ?
      ORDER BY er.registered_at ASC
    `).bind(eventId).all();
    
    return c.json({
      success: true,
      event: {
        ...event,
        tags: event.tags ? JSON.parse(event.tags) : [],
        is_featured: Boolean(event.is_featured),
        registrations: registrations.results
      }
    });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

// POST /api/events - Create new event (Admin only)
app.post('/', requireAuth, requireAdmin, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const {
      title,
      description,
      event_type,
      event_date,
      event_time,
      duration_minutes,
      location,
      meeting_link,
      registration_link,
      max_participants,
      banner_image_url,
      host_name,
      host_avatar,
      tags,
      is_featured
    } = body;
    
    if (!title || !description || !event_date) {
      return c.json({ error: 'Title, description, and event date are required' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO events (
        title, description, event_type, event_date, event_time, duration_minutes,
        location, meeting_link, registration_link, max_participants,
        banner_image_url, host_name, host_avatar, tags, is_featured, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      description,
      event_type || 'pitch',
      event_date,
      event_time,
      duration_minutes || 60,
      location,
      meeting_link,
      registration_link,
      max_participants,
      banner_image_url,
      host_name,
      host_avatar,
      tags ? JSON.stringify(tags) : null,
      is_featured ? 1 : 0,
      user.id
    ).run();
    
    return c.json({
      success: true,
      message: 'Event created successfully',
      event_id: result.meta.last_row_id
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// PUT /api/events/:id - Update event (Admin only)
app.put('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const eventId = c.req.param('id');
    const body = await c.req.json();
    
    const {
      title,
      description,
      event_type,
      event_date,
      event_time,
      duration_minutes,
      location,
      meeting_link,
      registration_link,
      max_participants,
      banner_image_url,
      host_name,
      host_avatar,
      tags,
      status,
      is_featured
    } = body;
    
    await c.env.DB.prepare(`
      UPDATE events SET
        title = ?,
        description = ?,
        event_type = ?,
        event_date = ?,
        event_time = ?,
        duration_minutes = ?,
        location = ?,
        meeting_link = ?,
        registration_link = ?,
        max_participants = ?,
        banner_image_url = ?,
        host_name = ?,
        host_avatar = ?,
        tags = ?,
        status = ?,
        is_featured = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      description,
      event_type,
      event_date,
      event_time,
      duration_minutes,
      location,
      meeting_link,
      registration_link,
      max_participants,
      banner_image_url,
      host_name,
      host_avatar,
      tags ? JSON.stringify(tags) : null,
      status,
      is_featured ? 1 : 0,
      eventId
    ).run();
    
    return c.json({ success: true, message: 'Event updated successfully' });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
app.delete('/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const eventId = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();
    
    return c.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

// POST /api/events/:id/register - Register for event
app.post('/:id/register', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    const eventId = c.req.param('id');
    
    // Check if event exists and has space
    const event = await c.env.DB.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registered_count
      FROM events e
      WHERE e.id = ?
    `).bind(eventId).first();
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    if (event.max_participants && event.registered_count >= event.max_participants) {
      return c.json({ error: 'Event is full' }, 400);
    }
    
    // Check if already registered
    const existing = await c.env.DB.prepare(`
      SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?
    `).bind(eventId, user.id).first();
    
    if (existing) {
      return c.json({ error: 'Already registered for this event' }, 400);
    }
    
    // Register user
    await c.env.DB.prepare(`
      INSERT INTO event_registrations (event_id, user_id)
      VALUES (?, ?)
    `).bind(eventId, user.id).run();
    
    return c.json({
      success: true,
      message: 'Successfully registered for event'
    });
  } catch (error: any) {
    console.error('Error registering for event:', error);
    return c.json({ error: 'Failed to register for event' }, 500);
  }
});

// DELETE /api/events/:id/register - Unregister from event
app.delete('/:id/register', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    const eventId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM event_registrations 
      WHERE event_id = ? AND user_id = ?
    `).bind(eventId, user.id).run();
    
    return c.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (error: any) {
    console.error('Error unregistering from event:', error);
    return c.json({ error: 'Failed to unregister from event' }, 500);
  }
});

export default app;
