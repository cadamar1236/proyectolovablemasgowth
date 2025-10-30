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

// GET /api/chat/conversations - Get all conversations for current user
chat.get('/conversations', async (c) => {
  try {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    
    let conversations;
    
    if (userRole === 'founder') {
      // Get conversations where user is founder
      conversations = await c.env.DB.prepare(`
        SELECT 
          cc.id,
          cc.request_id,
          cc.project_id,
          cc.status,
          cc.last_message_at,
          cc.created_at,
          v.id as validator_id,
          u.name as other_user_name,
          u.avatar_url as other_user_avatar,
          val.title as validator_title,
          p.title as project_title,
          (SELECT COUNT(*) FROM chat_messages 
           WHERE conversation_id = cc.id 
           AND is_read = 0 
           AND sender_id != ?) as unread_count,
          (SELECT message FROM chat_messages 
           WHERE conversation_id = cc.id 
           ORDER BY created_at DESC LIMIT 1) as last_message
        FROM chat_conversations cc
        JOIN validators v ON cc.validator_id = v.id
        JOIN users u ON v.user_id = u.id
        JOIN validators val ON v.id = val.id
        LEFT JOIN projects p ON cc.project_id = p.id
        WHERE cc.founder_id = ? AND cc.status = 'active'
        ORDER BY cc.last_message_at DESC
      `).bind(userId, userId).all();
    } else {
      // Get validator ID first
      const validator = await c.env.DB.prepare(`
        SELECT id FROM validators WHERE user_id = ?
      `).bind(userId).first() as any;
      
      if (!validator) {
        return c.json({ conversations: [] });
      }
      
      // Get conversations where user is validator
      conversations = await c.env.DB.prepare(`
        SELECT 
          cc.id,
          cc.request_id,
          cc.project_id,
          cc.status,
          cc.last_message_at,
          cc.created_at,
          u.id as founder_id,
          u.name as other_user_name,
          u.avatar_url as other_user_avatar,
          u.company as founder_company,
          p.title as project_title,
          (SELECT COUNT(*) FROM chat_messages 
           WHERE conversation_id = cc.id 
           AND is_read = 0 
           AND sender_id != ?) as unread_count,
          (SELECT message FROM chat_messages 
           WHERE conversation_id = cc.id 
           ORDER BY created_at DESC LIMIT 1) as last_message
        FROM chat_conversations cc
        JOIN users u ON cc.founder_id = u.id
        LEFT JOIN projects p ON cc.project_id = p.id
        WHERE cc.validator_id = ? AND cc.status = 'active'
        ORDER BY cc.last_message_at DESC
      `).bind(userId, validator.id).all();
    }
    
    return c.json({
      conversations: conversations.results || []
    });
    
  } catch (error) {
    console.error('Error getting conversations:', error);
    return c.json({ error: 'Failed to get conversations' }, 500);
  }
});

// GET /api/chat/conversations/:id/messages - Get messages for a conversation
chat.get('/conversations/:id/messages', async (c) => {
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
    
    // Check if user is participant (founder or validator's user)
    const validator = await c.env.DB.prepare(`
      SELECT user_id FROM validators WHERE id = ?
    `).bind(conversation.validator_id).first() as any;
    
    const isParticipant = conversation.founder_id === userId || 
                          (validator && validator.user_id === userId);
    
    if (!isParticipant) {
      return c.json({ error: 'Unauthorized to access this conversation' }, 403);
    }
    
    // Get messages
    const messages = await c.env.DB.prepare(`
      SELECT 
        cm.id,
        cm.sender_id,
        cm.sender_type,
        cm.message,
        cm.is_read,
        cm.created_at,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.conversation_id = ?
      ORDER BY cm.created_at ASC
    `).bind(conversationId).all();
    
    // Mark messages as read for current user
    await c.env.DB.prepare(`
      UPDATE chat_messages
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
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
    const userRole = c.get('userRole');
    const conversationId = c.req.param('id');
    const { message } = await c.req.json();
    
    if (!message || message.trim().length === 0) {
      return c.json({ error: 'Message cannot be empty' }, 400);
    }
    
    // Verify user has access to this conversation
    const conversation = await c.env.DB.prepare(`
      SELECT founder_id, validator_id, project_id
      FROM chat_conversations 
      WHERE id = ? AND status = 'active'
    `).bind(conversationId).first() as any;
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found or closed' }, 404);
    }
    
    // Determine sender type and verify access
    let senderType: string;
    let recipientUserId: number;
    
    if (userRole === 'founder' && conversation.founder_id === userId) {
      senderType = 'founder';
      // Get validator's user ID
      const validator = await c.env.DB.prepare(`
        SELECT user_id FROM validators WHERE id = ?
      `).bind(conversation.validator_id).first() as any;
      recipientUserId = validator.user_id;
    } else if (userRole === 'validator') {
      // Verify validator owns this conversation
      const validator = await c.env.DB.prepare(`
        SELECT id, user_id FROM validators WHERE user_id = ?
      `).bind(userId).first() as any;
      
      if (!validator || validator.id !== conversation.validator_id) {
        return c.json({ error: 'Unauthorized to send messages in this conversation' }, 403);
      }
      
      senderType = 'validator';
      recipientUserId = conversation.founder_id;
    } else {
      return c.json({ error: 'Unauthorized to send messages in this conversation' }, 403);
    }
    
    // Insert message
    const result = await c.env.DB.prepare(`
      INSERT INTO chat_messages (conversation_id, sender_id, sender_type, message)
      VALUES (?, ?, ?, ?)
    `).bind(conversationId, userId, senderType, message.trim()).run();
    
    const messageId = result.meta.last_row_id;
    
    // Update conversation last_message_at
    await c.env.DB.prepare(`
      UPDATE chat_conversations
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(conversationId).run();
    
    // Create notification for recipient
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'new_message', ?, ?, ?)
    `).bind(
      recipientUserId,
      'New Message',
      `You have a new message in your conversation`,
      `/marketplace?tab=my-dashboard&section=chats&conversation=${conversationId}`
    ).run();
    
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

export default chat;
