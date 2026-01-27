/**
 * AI CRM API
 * Customer Relationship Management with AI integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';

interface Bindings {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthContext {
  userId: number;
  email: string;
  role?: string;
}

type Variables = {
  user: AuthContext;
  teamId: number | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper function to get user's team ID
async function getUserTeamId(db: D1Database, userId: number): Promise<number | null> {
  const result = await db.prepare(`
    SELECT team_id FROM startup_team_members WHERE user_id = ? LIMIT 1
  `).bind(userId).first();
  return result ? (result as any).team_id : null;
}

// Enable CORS
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposeHeaders: ['Set-Cookie']
}));

// SECURITY: No hardcoded fallback - JWT_SECRET must be configured in environment
function getJWTSecret(env: Bindings): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return env.JWT_SECRET;
}

// JWT middleware
const jwtMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, getJWTSecret(c.env)) as AuthContext;
    c.set('user', payload);
    
    // Get user's team ID for team-based CRM access
    const teamId = await getUserTeamId(c.env.DB, payload.userId);
    c.set('teamId', teamId);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// ============== CONTACTS ==============

// Get all contacts for team (shared across team members)
app.get('/contacts', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const status = c.req.query('status');
  const type = c.req.query('type');
  const source = c.req.query('source');
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    // Filter by team_id if user has a team, otherwise fall back to user_id
    const useTeamFilter = teamId !== null;
    
    let query = `
      SELECT 
        c.*,
        u.name as linked_user_name,
        u.avatar_url as linked_user_avatar,
        creator.name as created_by_name,
        (SELECT COUNT(*) FROM crm_activities WHERE contact_id = c.id) as activity_count,
        (SELECT activity_date FROM crm_activities WHERE contact_id = c.id ORDER BY activity_date DESC LIMIT 1) as last_activity
      FROM crm_contacts c
      LEFT JOIN users u ON c.linked_user_id = u.id
      LEFT JOIN users creator ON c.user_id = creator.id
      WHERE ${useTeamFilter ? 'c.team_id = ?' : 'c.user_id = ?'}
    `;
    const params: any[] = [useTeamFilter ? teamId : user.userId];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (type) {
      query += ` AND c.contact_type = ?`;
      params.push(type);
    }
    if (source) {
      query += ` AND c.source = ?`;
      params.push(source);
    }
    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const contacts = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count with same team/user filter
    let countQuery = `SELECT COUNT(*) as total FROM crm_contacts WHERE ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'}`;
    const countParams: any[] = [useTeamFilter ? teamId : user.userId];
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    if (type) {
      countQuery += ` AND contact_type = ?`;
      countParams.push(type);
    }
    if (source) {
      countQuery += ` AND source = ?`;
      countParams.push(source);
    }
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      contacts: contacts.results || [],
      total: (countResult as any)?.total || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('[CRM] Error fetching contacts:', error);
    return c.json({ error: 'Failed to fetch contacts' }, 500);
  }
});

// Get single contact (accessible by team members)
app.get('/contacts/:id', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const contactId = c.req.param('id');

  try {
    const useTeamFilter = teamId !== null;
    const contact = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as linked_user_name,
        u.avatar_url as linked_user_avatar,
        u.email as linked_user_email,
        creator.name as created_by_name
      FROM crm_contacts c
      LEFT JOIN users u ON c.linked_user_id = u.id
      LEFT JOIN users creator ON c.user_id = creator.id
      WHERE c.id = ? AND ${useTeamFilter ? 'c.team_id = ?' : 'c.user_id = ?'}
    `).bind(contactId, useTeamFilter ? teamId : user.userId).first();

    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    // Get activities
    const activities = await c.env.DB.prepare(`
      SELECT * FROM crm_activities 
      WHERE contact_id = ? 
      ORDER BY activity_date DESC 
      LIMIT 50
    `).bind(contactId).all();

    // Get deals
    const deals = await c.env.DB.prepare(`
      SELECT * FROM crm_deals 
      WHERE contact_id = ? 
      ORDER BY created_at DESC
    `).bind(contactId).all();

    return c.json({
      contact,
      activities: activities.results || [],
      deals: deals.results || []
    });
  } catch (error) {
    console.error('[CRM] Error fetching contact:', error);
    return c.json({ error: 'Failed to fetch contact' }, 500);
  }
});

// Create contact (assigned to team)
app.post('/contacts', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const body = await c.req.json();

  const {
    name,
    email,
    phone,
    company,
    position,
    linkedin_url,
    website,
    avatar_url,
    contact_type,
    status,
    source,
    priority,
    linked_user_id,
    connector_suggestion_id,
    notes,
    tags,
    custom_fields
  } = body;

  if (!name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO crm_contacts (
        user_id, team_id, name, email, phone, company, position, linkedin_url, website, avatar_url,
        contact_type, status, source, priority, linked_user_id, connector_suggestion_id,
        notes, tags, custom_fields
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.userId,
      teamId, // Assign to team
      name,
      email || null,
      phone || null,
      company || null,
      position || null,
      linkedin_url || null,
      website || null,
      avatar_url || null,
      contact_type || 'lead',
      status || 'new',
      source || 'manual',
      priority || 'medium',
      linked_user_id || null,
      connector_suggestion_id || null,
      notes || null,
      tags ? JSON.stringify(tags) : null,
      custom_fields ? JSON.stringify(custom_fields) : null
    ).run();

    // Log activity
    if (result.meta?.last_row_id) {
      await c.env.DB.prepare(`
        INSERT INTO crm_activities (contact_id, user_id, activity_type, subject, description)
        VALUES (?, ?, 'note', 'Contact created', ?)
      `).bind(result.meta.last_row_id, user.userId, `Contact added via ${source || 'manual'}`).run();
    }

    return c.json({
      success: true,
      contact_id: result.meta?.last_row_id,
      message: 'Contact created successfully'
    });
  } catch (error) {
    console.error('[CRM] Error creating contact:', error);
    return c.json({ error: 'Failed to create contact' }, 500);
  }
});

// Update contact (team members can update)
app.put('/contacts/:id', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const contactId = c.req.param('id');
  const body = await c.req.json();

  try {
    // Verify team access
    const useTeamFilter = teamId !== null;
    const existing = await c.env.DB.prepare(
      `SELECT id FROM crm_contacts WHERE id = ? AND ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'}`
    ).bind(contactId, useTeamFilter ? teamId : user.userId).first();

    if (!existing) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    const {
      name, email, phone, company, position, linkedin_url, website, avatar_url,
      contact_type, status, priority, last_contact_date, next_follow_up,
      deal_value, notes, tags, custom_fields
    } = body;

    await c.env.DB.prepare(`
      UPDATE crm_contacts SET
        name = ?,
        email = ?,
        phone = ?,
        company = ?,
        position = ?,
        linkedin_url = ?,
        website = ?,
        avatar_url = ?,
        contact_type = ?,
        status = ?,
        priority = ?,
        last_contact_date = ?,
        next_follow_up = ?,
        deal_value = ?,
        notes = ?,
        tags = ?,
        custom_fields = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name || null,
      email || null,
      phone || null,
      company || null,
      position || null,
      linkedin_url || null,
      website || null,
      avatar_url || null,
      contact_type || 'lead',
      status || 'new',
      priority || 'medium',
      last_contact_date || null,
      next_follow_up || null,
      deal_value || null,
      notes || null,
      tags ? JSON.stringify(tags) : null,
      custom_fields ? JSON.stringify(custom_fields) : null,
      contactId
    ).run();

    return c.json({ success: true, message: 'Contact updated successfully' });
  } catch (error) {
    console.error('[CRM] Error updating contact:', error);
    return c.json({ error: 'Failed to update contact' }, 500);
  }
});

// Delete contact (team members can delete)
app.delete('/contacts/:id', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const contactId = c.req.param('id');

  try {
    const useTeamFilter = teamId !== null;
    const result = await c.env.DB.prepare(
      `DELETE FROM crm_contacts WHERE id = ? AND ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'}`
    ).bind(contactId, useTeamFilter ? teamId : user.userId).run();

    if (result.meta?.changes === 0) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    return c.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('[CRM] Error deleting contact:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

// ============== ACTIVITIES ==============

// Get activities for a contact (team members can view)
app.get('/contacts/:id/activities', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const contactId = c.req.param('id');

  try {
    // Verify team access
    const useTeamFilter = teamId !== null;
    const contact = await c.env.DB.prepare(
      `SELECT id FROM crm_contacts WHERE id = ? AND ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'}`
    ).bind(contactId, useTeamFilter ? teamId : user.userId).first();

    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    const activities = await c.env.DB.prepare(`
      SELECT a.*, u.name as created_by_name
      FROM crm_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.contact_id = ?
      ORDER BY a.activity_date DESC, a.created_at DESC
    `).bind(contactId).all();

    return c.json({
      success: true,
      activities: activities.results || []
    });
  } catch (error) {
    console.error('[CRM] Error fetching activities:', error);
    return c.json({ error: 'Failed to fetch activities' }, 500);
  }
});

// Add activity to contact (team members can add)
app.post('/contacts/:id/activities', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const contactId = c.req.param('id');
  const body = await c.req.json();

  const { activity_type, subject, description, outcome, activity_date } = body;

  if (!activity_type) {
    return c.json({ error: 'Activity type is required' }, 400);
  }

  try {
    // Verify team access
    const useTeamFilter = teamId !== null;
    const contact = await c.env.DB.prepare(
      `SELECT id FROM crm_contacts WHERE id = ? AND ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'}`
    ).bind(contactId, useTeamFilter ? teamId : user.userId).first();

    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO crm_activities (contact_id, user_id, activity_type, subject, description, outcome, activity_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      contactId,
      user.userId,
      activity_type,
      subject || null,
      description || null,
      outcome || null,
      activity_date || new Date().toISOString()
    ).run();

    // Update last contact date
    await c.env.DB.prepare(`
      UPDATE crm_contacts SET last_contact_date = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(contactId).run();

    return c.json({
      success: true,
      activity_id: result.meta?.last_row_id,
      message: 'Activity added successfully'
    });
  } catch (error) {
    console.error('[CRM] Error adding activity:', error);
    return c.json({ error: 'Failed to add activity' }, 500);
  }
});

// ============== FROM AI CONNECTOR ==============

// Add contact from AI Connector suggestion (team-shared)
app.post('/from-connector', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const body = await c.req.json();

  const { suggestion_id, suggested_user_id, name, email, company, reason, avatar_url } = body;

  if (!suggested_user_id && !name) {
    return c.json({ error: 'Either suggested_user_id or name is required' }, 400);
  }

  const useTeamFilter = teamId !== null;

  try {
    // Check if contact already exists from this suggestion (in team)
    if (suggestion_id) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM crm_contacts 
        WHERE ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'} AND connector_suggestion_id = ?
      `).bind(useTeamFilter ? teamId : user.userId, suggestion_id).first();

      if (existing) {
        return c.json({ 
          success: true, 
          contact_id: (existing as any).id,
          message: 'Contact already exists',
          already_exists: true
        });
      }
    }

    // Check if contact already exists by linked_user_id (in team)
    if (suggested_user_id) {
      const existingByUser = await c.env.DB.prepare(`
        SELECT id FROM crm_contacts 
        WHERE ${useTeamFilter ? 'team_id = ?' : 'user_id = ?'} AND linked_user_id = ?
      `).bind(useTeamFilter ? teamId : user.userId, suggested_user_id).first();

      if (existingByUser) {
        // Update the existing contact with suggestion info
        await c.env.DB.prepare(`
          UPDATE crm_contacts 
          SET connector_suggestion_id = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(suggestion_id, (existingByUser as any).id).run();

        return c.json({ 
          success: true, 
          contact_id: (existingByUser as any).id,
          message: 'Contact updated with connector info',
          already_exists: true
        });
      }
    }

    // Get user info if linked_user_id provided
    let contactName = name;
    let contactEmail = email;
    let contactAvatar = avatar_url;
    let contactCompany = company;

    if (suggested_user_id) {
      const userInfo = await c.env.DB.prepare(`
        SELECT name, email, avatar_url, company FROM users WHERE id = ?
      `).bind(suggested_user_id).first();

      if (userInfo) {
        contactName = contactName || (userInfo as any).name;
        contactEmail = contactEmail || (userInfo as any).email;
        contactAvatar = contactAvatar || (userInfo as any).avatar_url;
        contactCompany = contactCompany || (userInfo as any).company;
      }
    }

    // Create new contact (with team)
    const result = await c.env.DB.prepare(`
      INSERT INTO crm_contacts (
        user_id, team_id, name, email, company, avatar_url,
        contact_type, status, source, priority,
        linked_user_id, connector_suggestion_id, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, 'lead', 'new', 'ai_connector', 'medium', ?, ?, ?)
    `).bind(
      user.userId,
      teamId, // Assign to team
      contactName,
      contactEmail || null,
      contactCompany || null,
      contactAvatar || null,
      suggested_user_id || null,
      suggestion_id || null,
      reason ? `AI Connector: ${reason}` : 'Added from AI Connector suggestion'
    ).run();

    // Log activity
    if (result.meta?.last_row_id) {
      await c.env.DB.prepare(`
        INSERT INTO crm_activities (contact_id, user_id, activity_type, subject, description)
        VALUES (?, ?, 'note', 'Added from AI Connector', ?)
      `).bind(
        result.meta.last_row_id, 
        user.userId, 
        reason || 'Contact suggested by AI SuperConnector'
      ).run();
    }

    // Update connector_suggestions status if exists
    if (suggestion_id) {
      await c.env.DB.prepare(`
        UPDATE connector_suggestions 
        SET status = 'contacted', contacted_at = datetime('now')
        WHERE id = ?
      `).bind(suggestion_id).run();
    }

    return c.json({
      success: true,
      contact_id: result.meta?.last_row_id,
      message: 'Contact added to CRM from AI Connector'
    });
  } catch (error) {
    console.error('[CRM] Error adding from connector:', error);
    return c.json({ error: 'Failed to add contact from connector' }, 500);
  }
});

// ============== STATS ==============

// Get CRM statistics (team-wide)
app.get('/stats', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const useTeamFilter = teamId !== null;
  const filterValue = useTeamFilter ? teamId : user.userId;
  const filterColumn = useTeamFilter ? 'team_id' : 'user_id';

  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_contacts,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
        COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified,
        COUNT(CASE WHEN status = 'negotiation' THEN 1 END) as negotiation,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost,
        COUNT(CASE WHEN source = 'ai_connector' THEN 1 END) as from_ai_connector,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_added,
        COUNT(CASE WHEN contact_type = 'lead' THEN 1 END) as leads,
        COUNT(CASE WHEN contact_type = 'customer' THEN 1 END) as customers,
        COUNT(CASE WHEN contact_type = 'investor' THEN 1 END) as investors,
        COUNT(CASE WHEN contact_type = 'partner' THEN 1 END) as partners,
        SUM(deal_value) as total_deal_value
      FROM crm_contacts
      WHERE ${filterColumn} = ?
    `).bind(filterValue).first();

    // Recent activities (team-wide)
    const recentActivities = await c.env.DB.prepare(`
      SELECT 
        a.*,
        c.name as contact_name,
        c.avatar_url as contact_avatar,
        u.name as created_by_name
      FROM crm_activities a
      JOIN crm_contacts c ON a.contact_id = c.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE c.${filterColumn} = ?
      ORDER BY a.activity_date DESC
      LIMIT 10
    `).bind(filterValue).all();

    // Follow-ups due (team-wide)
    const followUpsDue = await c.env.DB.prepare(`
      SELECT * FROM crm_contacts
      WHERE ${filterColumn} = ? 
        AND next_follow_up IS NOT NULL 
        AND next_follow_up <= datetime('now', '+7 days')
      ORDER BY next_follow_up ASC
      LIMIT 10
    `).bind(filterValue).all();

    return c.json({
      total: (stats as any).total_contacts || 0,
      by_status: {
        new: (stats as any).new_contacts || 0,
        contacted: (stats as any).contacted || 0,
        qualified: (stats as any).qualified || 0,
        negotiation: (stats as any).negotiation || 0,
        won: (stats as any).won || 0,
        lost: (stats as any).lost || 0
      },
      by_type: {
        lead: (stats as any).leads || 0,
        customer: (stats as any).customers || 0,
        investor: (stats as any).investors || 0,
        partner: (stats as any).partners || 0
      },
      from_ai_connector: (stats as any).from_ai_connector || 0,
      manual_added: (stats as any).manual_added || 0,
      total_deal_value: (stats as any).total_deal_value || 0,
      recent_activities: recentActivities.results || [],
      follow_ups_due: followUpsDue.results || []
    });
  } catch (error) {
    console.error('[CRM] Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// ============== BULK OPERATIONS ==============

// Import contacts from CSV/JSON (team-shared)
app.post('/import', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const teamId = c.get('teamId');
  const body = await c.req.json();
  const { contacts } = body;

  if (!contacts || !Array.isArray(contacts)) {
    return c.json({ error: 'Contacts array is required' }, 400);
  }

  try {
    let imported = 0;
    let skipped = 0;

    for (const contact of contacts) {
      if (!contact.name) {
        skipped++;
        continue;
      }

      try {
        await c.env.DB.prepare(`
          INSERT INTO crm_contacts (
            user_id, team_id, name, email, phone, company, position, 
            contact_type, status, source, notes, tags
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 'import', ?, ?)
        `).bind(
          user.userId,
          teamId, // Assign to team
          contact.name,
          contact.email || null,
          contact.phone || null,
          contact.company || null,
          contact.position || null,
          contact.contact_type || 'lead',
          contact.notes || null,
          contact.tags ? JSON.stringify(contact.tags) : null
        ).run();
        imported++;
      } catch (e) {
        skipped++;
      }
    }

    return c.json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} contacts, skipped ${skipped}`
    });
  } catch (error) {
    console.error('[CRM] Error importing contacts:', error);
    return c.json({ error: 'Failed to import contacts' }, 500);
  }
});

export default app;
