/**
 * Validator Requests API
 * Handles requests from founders to validators and chat functionality
 */

import { Hono } from 'hono';
import type { Bindings, AuthContext } from '../types';
import { requireAuth, requireRole } from './auth';

const validatorRequests = new Hono<{ Bindings: Bindings; Variables: AuthContext }>();

// Apply auth middleware to all routes
validatorRequests.use('*', requireAuth);

// POST /api/validator-requests/send - Founder sends request to validator
validatorRequests.post('/send', async (c) => {
  console.log('Starting validator request send');
  try {
    const founderId = c.get('userId');
    const userRole = c.get('userRole') as string;
    
    console.log('User info:', { founderId, userRole });
    
    if (userRole !== 'founder') {
      console.log('User is not a founder');
      return c.json({ error: 'Only founders can send validator requests' }, 403);
    }
    
    const { validatorId, projectId, message } = await c.req.json();
    
    if (!validatorId || !message) {
      return c.json({ error: 'Validator ID and message are required' }, 400);
    }
    
    const validatorIdNum = parseInt(validatorId);
    const founderIdNum = founderId;
    const productIdNum = projectId ? parseInt(projectId) : null;
    
    if (isNaN(validatorIdNum) || isNaN(founderIdNum) || (projectId && (productIdNum === null || isNaN(productIdNum)))) {
      return c.json({ error: 'Invalid ID format' }, 400);
    }
    
    // Check if founder exists
    const founder = await c.env.DB.prepare(`
      SELECT id, name FROM users WHERE id = ?
    `).bind(founderIdNum).first();
    
    if (!founder) {
      return c.json({ error: 'Founder account not found' }, 404);
    }
    
    // Check if validator exists
    const validator = await c.env.DB.prepare(`
      SELECT v.id, v.user_id, u.name, u.email
      FROM validators v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `).bind(validatorIdNum).first();
    
    if (!validator) {
      console.log('Validator not found:', validatorIdNum);
      return c.json({ error: 'Validator not found' }, 404);
    }
    
    // Check if there's already a pending request
    const existingRequest = await c.env.DB.prepare(`
      SELECT id FROM validator_requests
      WHERE founder_id = ? AND validator_id = ? AND status = 'pending'
    `).bind(founderIdNum, validatorIdNum).first();
    
    if (existingRequest) {
      return c.json({ error: 'You already have a pending request to this validator' }, 400);
    }
    
    // Create the request
    console.log('Creating validator request with:', { founderIdNum, validatorIdNum, projectId });
    const result = await c.env.DB.prepare(`
      INSERT INTO validator_requests (founder_id, validator_id, project_id, message, status)
      VALUES (?, ?, NULL, ?, 'pending')
    `).bind(founderIdNum, validatorIdNum, message).run();
    
    const requestId = result.meta.last_row_id;
    console.log('Validator request created with ID:', requestId);
    
    // Create notification for validator
    try {
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'validator_request', ?, ?, ?)
      `).bind(
        validator.user_id,
        'New Validation Request',
        `A founder wants your opinion on their project`,
        `/marketplace?tab=my-dashboard&section=requests&request=${requestId}`
      ).run();
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    return c.json({
      success: true,
      requestId,
      message: 'Request sent successfully. You will be notified when the validator responds.'
    });
    
  } catch (error) {
    console.error('Error sending validator request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return c.json({ error: 'Failed to send request', details: errorMessage }, 500);
  }
});

// GET /api/validator-requests/pending - Get pending requests (for validators)
validatorRequests.get('/pending', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    
    if (userRole !== 'validator') {
      return c.json({ error: 'Only validators can view pending requests' }, 403);
    }
    
    // Get validator ID
    const validator = await c.env.DB.prepare(`
      SELECT id FROM validators WHERE user_id = ?
    `).bind(userId).first() as any;
    
    if (!validator) {
      return c.json({ error: 'Validator profile not found' }, 404);
    }
    
    // Get pending requests
    const requests = await c.env.DB.prepare(`
      SELECT 
        vr.id,
        vr.message,
        vr.created_at,
        vr.expires_at,
        vr.project_id,
        u.id as founder_id,
        u.name as founder_name,
        u.email as founder_email,
        u.avatar_url as founder_avatar,
        p.title as project_title,
        p.description as project_description
      FROM validator_requests vr
      JOIN users u ON vr.founder_id = u.id
      LEFT JOIN projects p ON vr.project_id = p.id
      WHERE vr.validator_id = ? AND vr.status = 'pending'
      ORDER BY vr.created_at DESC
    `).bind(validator.id).all();
    
    return c.json({
      requests: requests.results || []
    });
    
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return c.json({ error: 'Failed to get requests' }, 500);
  }
});

// POST /api/validator-requests/:id/accept - Validator accepts request
validatorRequests.post('/:id/accept', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const requestId = c.req.param('id');
    
    if (userRole !== 'validator') {
      return c.json({ error: 'Only validators can accept requests' }, 403);
    }
    
    // Get validator ID
    const validator = await c.env.DB.prepare(`
      SELECT id FROM validators WHERE user_id = ?
    `).bind(userId).first() as any;
    
    if (!validator) {
      return c.json({ error: 'Validator profile not found' }, 404);
    }
    
    // Get request details
    const request = await c.env.DB.prepare(`
      SELECT * FROM validator_requests
      WHERE id = ? AND validator_id = ? AND status = 'pending'
    `).bind(requestId, validator.id).first() as any;
    
    if (!request) {
      return c.json({ error: 'Request not found or already responded' }, 404);
    }
    
    // Update request status
    await c.env.DB.prepare(`
      UPDATE validator_requests
      SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(requestId).run();
    
    // Create chat conversation
    const convResult = await c.env.DB.prepare(`
      INSERT INTO chat_conversations (request_id, founder_id, validator_id, project_id, status)
      VALUES (?, ?, ?, ?, 'active')
    `).bind(requestId, request.founder_id, validator.id, request.project_id || null).run();
    
    const conversationId = convResult.meta.last_row_id;
    
    // Send notification to founder
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'request_accepted', ?, ?, ?)
    `).bind(
      request.founder_id,
      'Request Accepted!',
      'A validator has accepted your request. You can now chat with them.',
      `/marketplace?tab=my-dashboard&section=chats&conversation=${conversationId}`
    ).run();
    
    // Update validator stats
    await c.env.DB.prepare(`
      UPDATE validators
      SET total_validations = total_validations + 1
      WHERE id = ?
    `).bind(validator.id).run();
    
    return c.json({
      success: true,
      conversationId,
      message: 'Request accepted. You can now chat with the founder.'
    });
    
  } catch (error) {
    console.error('Error accepting request:', error);
    return c.json({ error: 'Failed to accept request' }, 500);
  }
});

// POST /api/validator-requests/:id/reject - Validator rejects request
validatorRequests.post('/:id/reject', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const requestId = c.req.param('id');
    
    if (userRole !== 'validator') {
      return c.json({ error: 'Only validators can reject requests' }, 403);
    }
    
    // Get validator ID
    const validator = await c.env.DB.prepare(`
      SELECT id FROM validators WHERE user_id = ?
    `).bind(userId).first() as any;
    
    if (!validator) {
      return c.json({ error: 'Validator profile not found' }, 404);
    }
    
    // Get request details
    const request = await c.env.DB.prepare(`
      SELECT * FROM validator_requests
      WHERE id = ? AND validator_id = ? AND status = 'pending'
    `).bind(requestId, validator.id).first() as any;
    
    if (!request) {
      return c.json({ error: 'Request not found or already responded' }, 404);
    }
    
    // Update request status
    await c.env.DB.prepare(`
      UPDATE validator_requests
      SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(requestId).run();
    
    // Send notification to founder
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'request_rejected', ?, ?, ?)
    `).bind(
      request.founder_id,
      'Request Declined',
      'A validator has declined your request. Try reaching out to other validators.',
      `/marketplace?tab=validators`
    ).run();
    
    return c.json({
      success: true,
      message: 'Request declined'
    });
    
  } catch (error) {
    console.error('Error rejecting request:', error);
    return c.json({ error: 'Failed to reject request' }, 500);
  }
});

// GET /api/validator-requests/sent - Get requests sent by founder
validatorRequests.get('/sent', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    
    if (userRole !== 'founder') {
      return c.json({ error: 'Only founders can view sent requests' }, 403);
    }
    
    const requests = await c.env.DB.prepare(`
      SELECT 
        vr.id,
        vr.message,
        vr.status,
        vr.created_at,
        vr.responded_at,
        vr.project_id,
        v.id as validator_id,
        u.name as validator_name,
        u.avatar_url as validator_avatar,
        v.title as validator_title,
        v.expertise,
        p.title as project_title
      FROM validator_requests vr
      JOIN validators v ON vr.validator_id = v.id
      JOIN users u ON v.user_id = u.id
      LEFT JOIN projects p ON vr.project_id = p.id
      WHERE vr.founder_id = ?
      ORDER BY vr.created_at DESC
    `).bind(userId).all();
    
    return c.json({
      requests: requests.results || []
    });
    
  } catch (error) {
    console.error('Error getting sent requests:', error);
    return c.json({ error: 'Failed to get requests' }, 500);
  }
});

// GET /api/validator-requests/stats - Get request stats for founder
validatorRequests.get('/stats', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    
    if (userRole !== 'founder') {
      return c.json({ error: 'Only founders can view request stats' }, 403);
    }
    
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        COUNT(DISTINCT validator_id) as validators_contacted
      FROM validator_requests
      WHERE founder_id = ?
    `).bind(userId).first();
    
    return c.json({ stats: stats || {
      total_requests: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      validators_contacted: 0
    }});
    
  } catch (error) {
    console.error('Error getting request stats:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

export default validatorRequests;
