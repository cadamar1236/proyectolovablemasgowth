/**
 * Admin API Routes
 * Statistics, reports, and administrative functions
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const admin = new Hono<{ Bindings: Bindings }>();

const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// JWT middleware with admin check
const adminMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || JWT_SECRET) as any;
    
    // Check if user is admin
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role FROM users WHERE id = ?
    `).bind(payload.userId).first();

    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    c.set('user', payload);
    c.set('adminUser', user);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Get user statistics
admin.get('/stats/users', adminMiddleware, async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    const usersByRole = await c.env.DB.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `).all();

    const recentUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= datetime('now', '-30 days')
    `).first();

    return c.json({
      total: totalUsers?.count || 0,
      byRole: usersByRole.results || [],
      recentSignups: recentUsers?.count || 0
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching user stats:', error);
    return c.json({ error: 'Failed to fetch user statistics' }, 500);
  }
});

// Get project statistics
admin.get('/stats/projects', adminMiddleware, async (c) => {
  try {
    const totalProjects = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM projects
    `).first();

    const projectsByStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM projects 
      GROUP BY status
    `).all();

    const recentProjects = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE created_at >= datetime('now', '-30 days')
    `).first();

    return c.json({
      total: totalProjects?.count || 0,
      byStatus: projectsByStatus.results || [],
      recentProjects: recentProjects?.count || 0
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching project stats:', error);
    return c.json({ error: 'Failed to fetch project statistics' }, 500);
  }
});

// Get competition statistics
admin.get('/stats/competitions', adminMiddleware, async (c) => {
  try {
    const activeCompetitions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM competitions 
      WHERE status = 'active'
    `).first();

    const totalParticipants = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM competition_participants
    `).first();

    const paidTickets = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, SUM(c.ticket_price) as revenue
      FROM competition_participants cp
      JOIN competitions c ON cp.competition_id = c.id
      WHERE cp.payment_status = 'completed' AND c.ticket_required = 1
    `).first();

    return c.json({
      active: activeCompetitions?.count || 0,
      totalParticipants: totalParticipants?.count || 0,
      revenue: paidTickets?.revenue || 0
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching competition stats:', error);
    return c.json({ error: 'Failed to fetch competition statistics' }, 500);
  }
});

// Get recent activity
admin.get('/activity', adminMiddleware, async (c) => {
  try {
    // Get recent user registrations
    const recentUsers = await c.env.DB.prepare(`
      SELECT id, name, email, created_at, 'user' as type
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // Get recent projects
    const recentProjects = await c.env.DB.prepare(`
      SELECT p.id, p.title, u.name as user_name, p.created_at, 'project' as type
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    // Get recent competition registrations
    const recentRegistrations = await c.env.DB.prepare(`
      SELECT cp.id, u.name as user_name, c.title as competition_name, cp.registration_date as created_at, 'registration' as type
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      JOIN competitions c ON cp.competition_id = c.id
      ORDER BY cp.registration_date DESC
      LIMIT 10
    `).all();

    // Combine and sort by date
    const allActivity = [
      ...(recentUsers.results || []).map((u: any) => ({
        id: u.id,
        description: `${u.name} joined the platform`,
        icon: 'user-plus',
        created_at: u.created_at
      })),
      ...(recentProjects.results || []).map((p: any) => ({
        id: p.id,
        description: `${p.user_name} created project "${p.title}"`,
        icon: 'rocket',
        created_at: p.created_at
      })),
      ...(recentRegistrations.results || []).map((r: any) => ({
        id: r.id,
        description: `${r.user_name} registered for "${r.competition_name}"`,
        icon: 'trophy',
        created_at: r.created_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    return c.json({ activities: allActivity });
  } catch (error) {
    console.error('[ADMIN] Error fetching activity:', error);
    return c.json({ error: 'Failed to fetch activity' }, 500);
  }
});

// Get all users
admin.get('/users', adminMiddleware, async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.avatar_url,
        u.created_at,
        COUNT(DISTINCT p.id) as project_count
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    return c.json({ users: users.results || [] });
  } catch (error) {
    console.error('[ADMIN] Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Create competition (admin only)
admin.post('/competitions', adminMiddleware, async (c) => {
  try {
    const {
      title,
      description,
      prize_amount,
      competition_type,
      event_date,
      event_time,
      deadline,
      guidelines,
      payment_link,
      ticket_required,
      ticket_price,
      location
    } = await c.req.json();

    if (!title || !description || !competition_type) {
      return c.json({ error: 'Title, description, and competition type are required' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO competitions (
        title, description, prize_amount, competition_type, 
        event_date, event_time, deadline, guidelines, 
        payment_link, ticket_required, ticket_price, location, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      title,
      description,
      prize_amount || null,
      competition_type,
      event_date || null,
      event_time || null,
      deadline || null,
      guidelines || null,
      payment_link || null,
      ticket_required ? 1 : 0,
      ticket_price || 0,
      location || null
    ).run();

    return c.json({
      success: true,
      competitionId: result.meta.last_row_id
    });
  } catch (error) {
    console.error('[ADMIN] Error creating competition:', error);
    return c.json({ error: 'Failed to create competition' }, 500);
  }
});

// Delete competition
admin.delete('/competitions/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    // Delete related records first due to foreign key constraints
    await c.env.DB.prepare(`
      DELETE FROM competition_winners WHERE competition_id = ?
    `).bind(id).run();

    await c.env.DB.prepare(`
      DELETE FROM competition_participants WHERE competition_id = ?
    `).bind(id).run();

    // Now delete the competition
    await c.env.DB.prepare(`
      DELETE FROM competitions WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error deleting competition:', error);
    return c.json({ error: 'Failed to delete competition' }, 500);
  }
});

// Update competition
admin.put('/competitions/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const {
      title,
      description,
      prize_amount,
      competition_type,
      event_date,
      event_time,
      deadline,
      guidelines,
      payment_link,
      ticket_required,
      ticket_price,
      location,
      status
    } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE competitions
      SET title = ?,
          description = ?,
          prize_amount = ?,
          competition_type = ?,
          event_date = ?,
          event_time = ?,
          deadline = ?,
          guidelines = ?,
          payment_link = ?,
          ticket_required = ?,
          ticket_price = ?,
          location = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      description,
      prize_amount || null,
      competition_type,
      event_date || null,
      event_time || null,
      deadline || null,
      guidelines || null,
      payment_link || null,
      ticket_required ? 1 : 0,
      ticket_price || 0,
      location || null,
      status || 'active',
      id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error updating competition:', error);
    return c.json({ error: 'Failed to update competition' }, 500);
  }
});

// Get competition participants (admin)
admin.get('/competitions/:id/participants', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    const participants = await c.env.DB.prepare(`
      SELECT 
        cp.*,
        u.name,
        u.email,
        u.avatar_url,
        p.title as project_title,
        p.description as project_description
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN projects p ON cp.project_id = p.id
      WHERE cp.competition_id = ?
      ORDER BY cp.registration_date DESC
    `).bind(id).all();

    return c.json({ participants: participants.results || [] });
  } catch (error) {
    console.error('[ADMIN] Error fetching participants:', error);
    return c.json({ error: 'Failed to fetch participants' }, 500);
  }
});

// Update competition
admin.put('/competitions/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const {
      title,
      description,
      prize_amount,
      competition_type,
      event_date,
      event_time,
      deadline,
      guidelines,
      payment_link,
      ticket_required,
      ticket_price,
      location,
      status
    } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE competitions
      SET title = ?,
          description = ?,
          prize_amount = ?,
          competition_type = ?,
          event_date = ?,
          event_time = ?,
          deadline = ?,
          guidelines = ?,
          payment_link = ?,
          ticket_required = ?,
          ticket_price = ?,
          location = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      description,
      prize_amount || null,
      competition_type,
      event_date || null,
      event_time || null,
      deadline || null,
      guidelines || null,
      payment_link || null,
      ticket_required ? 1 : 0,
      ticket_price || 0,
      location || null,
      status || 'active',
      id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error updating competition:', error);
    return c.json({ error: 'Failed to update competition' }, 500);
  }
});

// Get competition participants (admin)
admin.get('/competitions/:id/participants', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    const participants = await c.env.DB.prepare(`
      SELECT 
        cp.*,
        u.name,
        u.email,
        u.avatar_url,
        p.title as project_title,
        p.description as project_description
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN projects p ON cp.project_id = p.id
      WHERE cp.competition_id = ?
      ORDER BY cp.registration_date DESC
    `).bind(id).all();

    return c.json({ participants: participants.results || [] });
  } catch (error) {
    console.error('[ADMIN] Error fetching participants:', error);
    return c.json({ error: 'Failed to fetch participants' }, 500);
  }
});

// Generate reports
admin.get('/reports/:type', adminMiddleware, async (c) => {
  try {
    const type = c.req.param('type');

    let data: any[] = [];

    switch (type) {
      case 'startups':
        const startups = await c.env.DB.prepare(`
          SELECT 
            u.name as founder_name,
            u.email as founder_email,
            p.title as project_name,
            p.description,
            p.status,
            p.created_at
          FROM projects p
          JOIN users u ON p.user_id = u.id
          ORDER BY p.created_at DESC
        `).all();
        data = startups.results || [];
        break;

      case 'competitions':
        const competitions = await c.env.DB.prepare(`
          SELECT 
            c.title,
            c.competition_type,
            c.prize_amount,
            c.status,
            COUNT(DISTINCT cp.id) as participants,
            COUNT(DISTINCT CASE WHEN cp.payment_status = 'completed' THEN cp.id END) as paid_participants,
            c.created_at
          FROM competitions c
          LEFT JOIN competition_participants cp ON c.id = cp.competition_id
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `).all();
        data = competitions.results || [];
        break;

      case 'revenue':
        const revenue = await c.env.DB.prepare(`
          SELECT 
            c.title as competition,
            c.ticket_price,
            COUNT(cp.id) as tickets_sold,
            (c.ticket_price * COUNT(cp.id)) as total_revenue,
            cp.registration_date as sale_date
          FROM competition_participants cp
          JOIN competitions c ON cp.competition_id = c.id
          WHERE cp.payment_status = 'completed' AND c.ticket_required = 1
          GROUP BY c.id, cp.registration_date
          ORDER BY cp.registration_date DESC
        `).all();
        data = revenue.results || [];
        break;

      case 'users':
        const users = await c.env.DB.prepare(`
          SELECT 
            u.name,
            u.email,
            u.role,
            COUNT(DISTINCT p.id) as projects,
            COUNT(DISTINCT cp.id) as competitions_entered,
            u.created_at
          FROM users u
          LEFT JOIN projects p ON u.id = p.user_id
          LEFT JOIN competition_participants cp ON u.id = cp.user_id
          GROUP BY u.id
          ORDER BY u.created_at DESC
        `).all();
        data = users.results || [];
        break;

      default:
        return c.json({ error: 'Invalid report type' }, 400);
    }

    return c.json({ data });
  } catch (error) {
    console.error('[ADMIN] Error generating report:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

export default admin;
