/**
 * Notifications API
 * Handles user notifications for requests, messages, and updates
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const notifications = new Hono<{ Bindings: Bindings }>();

const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// Middleware: Verify authentication
async function requireAuth(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, JWT_SECRET) as any;
    
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Apply auth middleware to all routes
notifications.use('*', requireAuth);

// GET /api/notifications - Get all notifications for current user
notifications.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '50');
    const unreadOnly = c.req.query('unread_only') === 'true';
    
    let query = `
      SELECT 
        id,
        type,
        title,
        message,
        link,
        is_read,
        read_at,
        created_at
      FROM notifications
      WHERE user_id = ?
    `;
    
    if (unreadOnly) {
      query += ' AND is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    
    const result = await c.env.DB.prepare(query)
      .bind(userId, limit)
      .all();
    
    return c.json({
      notifications: result.results || []
    });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
notifications.get('/unread-count', async (c) => {
  try {
    const userId = c.get('userId');
    
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first() as any;
    
    return c.json({
      unreadCount: result.count || 0
    });
    
  } catch (error) {
    console.error('Error getting unread count:', error);
    return c.json({ error: 'Failed to get unread count' }, 500);
  }
});

// POST /api/notifications/:id/mark-read - Mark a notification as read
notifications.post('/:id/mark-read', async (c) => {
  try {
    const userId = c.get('userId');
    const notificationId = c.req.param('id');
    
    // Verify notification belongs to user
    const notification = await c.env.DB.prepare(`
      SELECT id FROM notifications WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).first();
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    // Mark as read
    await c.env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(notificationId).run();
    
    return c.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
notifications.post('/mark-all-read', async (c) => {
  try {
    const userId = c.get('userId');
    
    await c.env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).run();
    
    return c.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, 500);
  }
});

// DELETE /api/notifications/:id - Delete a notification
notifications.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const notificationId = c.req.param('id');
    
    // Verify notification belongs to user
    const notification = await c.env.DB.prepare(`
      SELECT id FROM notifications WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).first();
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    // Delete notification
    await c.env.DB.prepare(`
      DELETE FROM notifications WHERE id = ?
    `).bind(notificationId).run();
    
    return c.json({
      success: true,
      message: 'Notification deleted'
    });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

export default notifications;
