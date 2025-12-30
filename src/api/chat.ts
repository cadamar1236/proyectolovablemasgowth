/**
 * Chat API
 * Handles real-time messaging between founders and validators
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const chat = new Hono<{ Bindings: Bindings }>();

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
    c.set('userEmail', payload.email);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Apply auth middleware to all routes
chat.use('*', requireAuth);

// POST /api/chat/conversations - Create or get conversation with any user
chat.post('/conversations', async (c) => {
  try {
    const userId = c.get('userId');
    const { other_user_id, project_id } = await c.req.json();
    
    console.log('[CHAT] Creating conversation', { userId, other_user_id, project_id });
    
    if (!other_user_id) {
      return c.json({ error: 'other_user_id is required' }, 400);
    }
    
    // Ensure user1_id < user2_id for consistent ordering
    const user1_id = Math.min(userId, other_user_id);
    const user2_id = Math.max(userId, other_user_id);
    
    // Check if conversation already exists in new table
    let existing = await c.env.DB.prepare(`
      SELECT id FROM user_conversations 
      WHERE user1_id = ? AND user2_id = ? AND status = 'active'
      LIMIT 1
    `).bind(user1_id, user2_id).first() as any;
    
    if (existing) {
      console.log('[CHAT] Conversation already exists:', existing.id);
      return c.json({ conversation_id: existing.id, existing: true });
    }
    
    // Create new conversation in new table
    const result = await c.env.DB.prepare(`
      INSERT INTO user_conversations (user1_id, user2_id, status, last_message_at)
      VALUES (?, ?, 'active', CURRENT_TIMESTAMP)
    `).bind(user1_id, user2_id).run();
    
    console.log('[CHAT] Created conversation:', result.meta.last_row_id);
    
    return c.json({ 
      conversation_id: result.meta.last_row_id,
      existing: false 
    });
    
  } catch (error) {
    console.error('[CHAT] Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

// GET /api/chat/conversations - Get all conversations for current user
chat.get('/conversations', async (c) => {
  try {
    const userId = c.get('userId');
    
    // Get conversations from new user_conversations table
    const conversations = await c.env.DB.prepare(`
      SELECT 
        uc.id,
        uc.user1_id,
        uc.user2_id,
        uc.status,
        uc.last_message_at,
        uc.created_at,
        CASE 
          WHEN uc.user1_id = ? THEN u2.id
          ELSE u1.id
        END as other_user_id,
        CASE 
          WHEN uc.user1_id = ? THEN u2.name
          ELSE u1.name
        END as other_user_name,
        CASE 
          WHEN uc.user1_id = ? THEN u2.avatar_url
          ELSE u1.avatar_url
        END as other_user_avatar,
        (SELECT COUNT(*) FROM user_messages 
         WHERE conversation_id = uc.id 
         AND is_read = 0 
         AND sender_id != ?) as unread_count,
        (SELECT message FROM user_messages 
         WHERE conversation_id = uc.id 
         ORDER BY created_at DESC LIMIT 1) as last_message
      FROM user_conversations uc
      JOIN users u1 ON uc.user1_id = u1.id
      JOIN users u2 ON uc.user2_id = u2.id
      WHERE (uc.user1_id = ? OR uc.user2_id = ?) AND uc.status = 'active'
      ORDER BY uc.last_message_at DESC
    `).bind(userId, userId, userId, userId, userId, userId).all();
    
    return c.json({
      conversations: conversations.results || []
    });
    
  } catch (error) {
    console.error('Error getting conversations:', error);
    return c.json({ error: 'Failed to get conversations' }, 500);
  }
});

// GET /api/chat/conversations/:id - Get single conversation details
chat.get('/conversations/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');
    
    // Get conversation from new table
    const conversation = await c.env.DB.prepare(`
      SELECT 
        uc.id,
        uc.user1_id,
        uc.user2_id,
        uc.status,
        uc.last_message_at,
        uc.created_at,
        CASE 
          WHEN uc.user1_id = ? THEN u2.id
          ELSE u1.id
        END as other_user_id,
        CASE 
          WHEN uc.user1_id = ? THEN u2.name
          ELSE u1.name
        END as other_user_name,
        CASE 
          WHEN uc.user1_id = ? THEN u2.avatar_url
          ELSE u1.avatar_url
        END as other_user_avatar
      FROM user_conversations uc
      JOIN users u1 ON uc.user1_id = u1.id
      JOIN users u2 ON uc.user2_id = u2.id
      WHERE uc.id = ? AND (uc.user1_id = ? OR uc.user2_id = ?)
    `).bind(userId, userId, userId, conversationId, userId, userId).first();
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    return c.json(conversation);
    
  } catch (error) {
    console.error('Error getting conversation:', error);
    return c.json({ error: 'Failed to get conversation' }, 500);
  }
});

// GET /api/chat/conversations/:id/messages - Get messages for a conversation
chat.get('/conversations/:id/messages', async (c) => {
  try {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');
    
    // Verify user has access to this conversation (from new table)
    const conversation = await c.env.DB.prepare(`
      SELECT user1_id, user2_id 
      FROM user_conversations 
      WHERE id = ?
    `).bind(conversationId).first() as any;
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Check if user is participant
    const isParticipant = conversation.user1_id === userId || conversation.user2_id === userId;
    
    if (!isParticipant) {
      return c.json({ error: 'Unauthorized to access this conversation' }, 403);
    }
    
    // Get messages from new table
    const messages = await c.env.DB.prepare(`
      SELECT 
        um.id,
        um.sender_id,
        um.message,
        um.is_read,
        um.created_at,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM user_messages um
      JOIN users u ON um.sender_id = u.id
      WHERE um.conversation_id = ?
      ORDER BY um.created_at ASC
    `).bind(conversationId).all();
    
    // Mark messages as read for current user
    await c.env.DB.prepare(`
      UPDATE user_messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).bind(conversationId, userId).run();
    
    return c.json({
      messages: messages.results || []
    });
    
  } catch (error) {
    console.error('Error getting messages:', error);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// POST /api/chat/conversations/:id/messages - Send a message
chat.post('/conversations/:id/messages', async (c) => {
  try {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');
    const { message } = await c.req.json();
    
    if (!message || message.trim().length === 0) {
      return c.json({ error: 'Message cannot be empty' }, 400);
    }
    
    // Verify user has access to this conversation (from new table)
    const conversation = await c.env.DB.prepare(`
      SELECT user1_id, user2_id 
      FROM user_conversations 
      WHERE id = ? AND status = 'active'
    `).bind(conversationId).first() as any;
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found or closed' }, 404);
    }
    
    // Check if user is participant
    const isParticipant = conversation.user1_id === userId || conversation.user2_id === userId;
    
    if (!isParticipant) {
      return c.json({ error: 'Unauthorized to send messages in this conversation' }, 403);
    }
    
    // Determine recipient
    const recipientUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
    
    // Insert message into new table
    const result = await c.env.DB.prepare(`
      INSERT INTO user_messages (conversation_id, sender_id, message, is_read)
      VALUES (?, ?, ?, 0)
    `).bind(conversationId, userId, message.trim()).run();
    
    const messageId = result.meta.last_row_id;
    
    // Update conversation last_message_at
    await c.env.DB.prepare(`
      UPDATE user_conversations
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(conversationId).run();
    
    // Create notification for recipient
    try {
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'new_message', ?, ?, ?)
      `).bind(
        recipientUserId,
        'New Message',
        `You have a new message`,
        `/dashboard?tab=inbox`
      ).run();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the message send if notification fails
    }
    
    return c.json({
      success: true,
      messageId,
      message: 'Message sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// GET /api/chat/unread-count - Get unread message count
chat.get('/unread-count', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    
    let unreadCount = 0;
    
    if (userRole === 'founder') {
      const result = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM chat_messages cm
        JOIN chat_conversations cc ON cm.conversation_id = cc.id
        WHERE cc.founder_id = ? 
        AND cm.sender_id != ? 
        AND cm.is_read = 0
      `).bind(userId, userId).first() as any;
      
      unreadCount = result.count || 0;
    } else {
      // Get validator ID
      const validator = await c.env.DB.prepare(`
        SELECT id FROM validators WHERE user_id = ?
      `).bind(userId).first() as any;
      
      if (validator) {
        const result = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM chat_messages cm
          JOIN chat_conversations cc ON cm.conversation_id = cc.id
          WHERE cc.validator_id = ? 
          AND cm.sender_id != ? 
          AND cm.is_read = 0
        `).bind(validator.id, userId).first() as any;
        
        unreadCount = result.count || 0;
      }
    }
    
    return c.json({ unreadCount });
    
  } catch (error) {
    console.error('Error getting unread count:', error);
    return c.json({ error: 'Failed to get unread count' }, 500);
  }
});

// POST /api/chat/conversations/:id/close - Close a conversation
chat.post('/conversations/:id/close', async (c) => {
  try {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');
    
    // Verify user has access to this conversation
    const conversation = await c.env.DB.prepare(`
      SELECT founder_id, validator_id
      FROM chat_conversations 
      WHERE id = ?
    `).bind(conversationId).first() as any;
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Check if user is participant
    const validator = await c.env.DB.prepare(`
      SELECT user_id FROM validators WHERE id = ?
    `).bind(conversation.validator_id).first() as any;
    
    const isParticipant = conversation.founder_id === userId || 
                          (validator && validator.user_id === userId);
    
    if (!isParticipant) {
      return c.json({ error: 'Unauthorized to close this conversation' }, 403);
    }
    
    // Close conversation
    await c.env.DB.prepare(`
      UPDATE chat_conversations
      SET status = 'closed'
      WHERE id = ?
    `).bind(conversationId).run();
    
    return c.json({
      success: true,
      message: 'Conversation closed successfully'
    });
    
  } catch (error) {
    console.error('Error closing conversation:', error);
    return c.json({ error: 'Failed to close conversation' }, 500);
  }
});

// PUT /api/chat/conversations/:id/read - Mark messages as read
chat.put('/conversations/:id/read', async (c) => {
  try {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');
    
    // Verify user has access to this conversation (from new table)
    const conversation = await c.env.DB.prepare(`
      SELECT user1_id, user2_id
      FROM user_conversations 
      WHERE id = ?
    `).bind(conversationId).first() as any;
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Check if user is participant
    const isParticipant = conversation.user1_id === userId || conversation.user2_id === userId;
    
    if (!isParticipant) {
      return c.json({ error: 'Unauthorized to access this conversation' }, 403);
    }
    
    // Mark messages as read for current user (from new table)
    await c.env.DB.prepare(`
      UPDATE user_messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).bind(conversationId, userId).run();
    
    return c.json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return c.json({ error: 'Failed to mark messages as read' }, 500);
  }
});

export default chat;
