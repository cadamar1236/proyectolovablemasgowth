/**
 * Admin API Routes
 * Statistics, reports, and administrative functions
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const admin = new Hono<{ Bindings: Bindings }>();

// SECURITY: No hardcoded fallback - JWT_SECRET must be configured in environment
function getJWTSecret(env: Bindings): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return env.JWT_SECRET;
}

// JWT middleware with admin check
const adminMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, getJWTSecret(c.env)) as any;
    
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

// ========== COMPETITIONS MANAGEMENT ==========

// Create new competition
admin.post('/competitions', adminMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const {
      title,
      description,
      competition_type,
      prize_amount,
      deadline,
      guidelines,
      ticket_price,
      event_date,
      event_time,
      location,
      payment_link,
      ticket_required
    } = data;

    const result = await c.env.DB.prepare(`
      INSERT INTO competitions (
        title, description, competition_type, prize_amount, deadline,
        guidelines, ticket_price, event_date, event_time, location,
        payment_link, ticket_required, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      title,
      description || null,
      competition_type,
      prize_amount || 0,
      deadline || null,
      guidelines || null,
      ticket_price || 0,
      event_date || null,
      event_time || null,
      location || null,
      payment_link || null,
      ticket_required ? 1 : 0
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

// Update competition
admin.put('/competitions/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const {
      title,
      description,
      competition_type,
      prize_amount,
      deadline,
      guidelines,
      ticket_price,
      event_date,
      event_time,
      location,
      payment_link,
      ticket_required,
      status
    } = data;

    await c.env.DB.prepare(`
      UPDATE competitions SET
        title = ?,
        description = ?,
        competition_type = ?,
        prize_amount = ?,
        deadline = ?,
        guidelines = ?,
        ticket_price = ?,
        event_date = ?,
        event_time = ?,
        location = ?,
        payment_link = ?,
        ticket_required = ?,
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      description || null,
      competition_type,
      prize_amount || 0,
      deadline || null,
      guidelines || null,
      ticket_price || 0,
      event_date || null,
      event_time || null,
      location || null,
      payment_link || null,
      ticket_required ? 1 : 0,
      status || null,
      id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error updating competition:', error);
    return c.json({ error: 'Failed to update competition' }, 500);
  }
});

// Delete competition
admin.delete('/competitions/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    // Delete related data first
    await c.env.DB.prepare(`
      DELETE FROM competition_votes WHERE competition_id = ?
    `).bind(id).run();

    await c.env.DB.prepare(`
      DELETE FROM competition_winners WHERE competition_id = ?
    `).bind(id).run();

    await c.env.DB.prepare(`
      DELETE FROM competition_participants WHERE competition_id = ?
    `).bind(id).run();

    // Delete competition
    await c.env.DB.prepare(`
      DELETE FROM competitions WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error deleting competition:', error);
    return c.json({ error: 'Failed to delete competition' }, 500);
  }
});

// =====================================================
// CHAT & ACTIVITY MONITORING ENDPOINTS
// =====================================================

// Get chat activity statistics
admin.get('/stats/chat', adminMiddleware, async (c) => {
  try {
    // User-to-user conversations stats
    const userConversations = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations
      FROM user_conversations
    `).first();

    // Total user messages
    const totalMessages = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_messages
    `).first();

    // Messages in last 7 days
    const recentMessages = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM user_messages 
      WHERE created_at >= datetime('now', '-7 days')
    `).first();

    // AI Agent chat stats (from agent_chat_messages table)
    const aiChatStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT user_id) as unique_users
      FROM agent_chat_messages
    `).first();

    // AI messages in last 7 days
    const recentAiMessages = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM agent_chat_messages 
      WHERE created_at >= datetime('now', '-7 days')
    `).first();

    // Messages by role
    const messagesByRole = await c.env.DB.prepare(`
      SELECT role, COUNT(*) as count
      FROM agent_chat_messages
      GROUP BY role
      ORDER BY count DESC
    `).all();

    return c.json({
      userChats: {
        totalConversations: userConversations?.total_conversations || 0,
        activeConversations: userConversations?.active_conversations || 0,
        totalMessages: totalMessages?.count || 0,
        recentMessages: recentMessages?.count || 0
      },
      aiChats: {
        totalMessages: aiChatStats?.total_messages || 0,
        uniqueUsers: aiChatStats?.unique_users || 0,
        recentMessages: recentAiMessages?.count || 0,
        byRole: messagesByRole.results || []
      }
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching chat stats:', error);
    return c.json({ error: 'Failed to fetch chat statistics' }, 500);
  }
});

// Get all user-to-user conversations with messages
admin.get('/conversations', adminMiddleware, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const conversations = await c.env.DB.prepare(`
      SELECT 
        uc.id,
        uc.status,
        uc.created_at,
        uc.last_message_at,
        u1.id as user1_id,
        u1.name as user1_name,
        u1.email as user1_email,
        u1.avatar_url as user1_avatar,
        u2.id as user2_id,
        u2.name as user2_name,
        u2.email as user2_email,
        u2.avatar_url as user2_avatar,
        (SELECT COUNT(*) FROM user_messages WHERE conversation_id = uc.id) as message_count,
        (SELECT message FROM user_messages WHERE conversation_id = uc.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM user_conversations uc
      JOIN users u1 ON uc.user1_id = u1.id
      JOIN users u2 ON uc.user2_id = u2.id
      ORDER BY uc.last_message_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const total = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_conversations
    `).first();

    return c.json({ 
      conversations: conversations.results || [],
      total: total?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// Get messages for a specific conversation
admin.get('/conversations/:id/messages', adminMiddleware, async (c) => {
  try {
    const conversationId = c.req.param('id');

    const messages = await c.env.DB.prepare(`
      SELECT 
        m.id,
        m.message,
        m.is_read,
        m.created_at,
        u.id as sender_id,
        u.name as sender_name,
        u.email as sender_email,
        u.avatar_url as sender_avatar
      FROM user_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).bind(conversationId).all();

    return c.json({ messages: messages.results || [] });
  } catch (error) {
    console.error('[ADMIN] Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Get all AI agent conversations (grouped by user)
admin.get('/agent-conversations', adminMiddleware, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get unique users who have chatted with AI, with their message counts
    const conversations = await c.env.DB.prepare(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        COUNT(acm.id) as message_count,
        MAX(acm.created_at) as last_message_at,
        (SELECT content FROM agent_chat_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM users u
      JOIN agent_chat_messages acm ON u.id = acm.user_id
      GROUP BY u.id
      ORDER BY last_message_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const total = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM agent_chat_messages
    `).first();

    return c.json({ 
      conversations: conversations.results || [],
      total: total?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching agent conversations:', error);
    return c.json({ error: 'Failed to fetch agent conversations' }, 500);
  }
});

// Get full AI conversation for a specific user
admin.get('/agent-conversations/:userId', adminMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');

    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, avatar_url FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get all messages for this user
    const messages = await c.env.DB.prepare(`
      SELECT 
        id,
        role,
        content,
        metadata,
        created_at
      FROM agent_chat_messages
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).bind(userId).all();

    return c.json({ 
      conversation: {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_avatar: user.avatar_url,
        messages: messages.results || []
      }
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching agent conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// Get most active users
admin.get('/stats/active-users', adminMiddleware, async (c) => {
  try {
    // Users with most AI chat messages
    const topMessagers = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT acm.id) as ai_chat_count
      FROM users u
      LEFT JOIN user_messages m ON u.id = m.sender_id
      LEFT JOIN agent_chat_messages acm ON u.id = acm.user_id
      GROUP BY u.id
      HAVING message_count > 0 OR ai_chat_count > 0
      ORDER BY (message_count + ai_chat_count) DESC
      LIMIT 20
    `).all();

    // Recent active users (last 7 days)
    const recentActiveUsers = await c.env.DB.prepare(`
      SELECT DISTINCT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        MAX(COALESCE(m.created_at, acm.created_at)) as last_activity
      FROM users u
      LEFT JOIN user_messages m ON u.id = m.sender_id AND m.created_at >= datetime('now', '-7 days')
      LEFT JOIN agent_chat_messages acm ON u.id = acm.user_id AND acm.created_at >= datetime('now', '-7 days')
      WHERE m.id IS NOT NULL OR acm.id IS NOT NULL
      GROUP BY u.id
      ORDER BY last_activity DESC
      LIMIT 20
    `).all();

    return c.json({
      topMessagers: topMessagers.results || [],
      recentActive: recentActiveUsers.results || []
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching active users:', error);
    return c.json({ error: 'Failed to fetch active users' }, 500);
  }
});

// Get user engagement timeline (for charts)
admin.get('/stats/engagement-timeline', adminMiddleware, async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');

    // User messages per day
    const messagesByDay = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM user_messages
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(days).all();

    // AI chats per day (from agent_chat_messages)
    const aiChatsByDay = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM agent_chat_messages
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(days).all();

    return c.json({
      messages: messagesByDay.results || [],
      aiChats: aiChatsByDay.results || []
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching engagement timeline:', error);
    return c.json({ error: 'Failed to fetch engagement timeline' }, 500);
  }
});

export default admin;
