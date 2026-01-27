/**
 * AI CMO API - Gestión de imágenes generadas por IA
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

type Variables = {
  userId: number;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// JWT middleware for authenticated routes
const jwtMiddleware = async (c: any, next: any) => {
  // Try multiple sources for the token
  const authHeader = c.req.header('Authorization');
  const cookieHeader = c.req.header('cookie') || c.req.header('Cookie') || '';
  
  console.log('[AI-CMO] Auth header:', authHeader ? 'present' : 'missing');
  console.log('[AI-CMO] Cookie header:', cookieHeader ? 'present' : 'missing');
  
  let authToken = null;
  
  // Try Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authToken = authHeader.replace('Bearer ', '');
  }
  
  // Then try cookies
  if (!authToken && cookieHeader) {
    const match = cookieHeader.match(/authToken=([^;]+)/);
    if (match) {
      authToken = match[1];
    }
  }
  
  console.log('[AI-CMO] Token found:', !!authToken);

  if (!authToken) {
    console.log('[AI-CMO] No token - returning 401');
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    if (!c.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }
    const payload = await verify(authToken, c.env.JWT_SECRET);
    console.log('[AI-CMO] JWT payload:', JSON.stringify(payload));
    
    const userId = payload.id || payload.userId || payload.sub || payload.user_id;
    if (!userId) {
      console.log('[AI-CMO] No userId in payload');
      return c.json({ error: 'Invalid token payload' }, 401);
    }
    
    c.set('userId', userId);
    await next();
  } catch (error) {
    console.error('[AI-CMO] JWT verification failed:', error);
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Get all generated images for a user
app.get('/images', jwtMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = c.env.DB;
    
    const images = await db.prepare(`
      SELECT 
        id,
        user_id,
        image_url,
        prompt,
        status,
        image_type,
        metadata,
        created_at,
        updated_at
      FROM ai_generated_images
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(userId).all();

    return c.json({
      success: true,
      images: images.results || []
    });
  } catch (error) {
    console.error('Error fetching AI images:', error);
    return c.json({ error: 'Failed to fetch images' }, 500);
  }
});

// Approve an image
app.post('/images/:id/approve', jwtMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const imageId = c.req.param('id');
    const db = c.env.DB;

    // Verify ownership
    const image = await db.prepare(`
      SELECT id FROM ai_generated_images
      WHERE id = ? AND user_id = ?
    `).bind(imageId, userId).first();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Update status
    await db.prepare(`
      UPDATE ai_generated_images
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(imageId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error approving image:', error);
    return c.json({ error: 'Failed to approve image' }, 500);
  }
});

// Reject an image
app.post('/images/:id/reject', jwtMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const imageId = c.req.param('id');
    const db = c.env.DB;

    // Verify ownership
    const image = await db.prepare(`
      SELECT id FROM ai_generated_images
      WHERE id = ? AND user_id = ?
    `).bind(imageId, userId).first();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Update status
    await db.prepare(`
      UPDATE ai_generated_images
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(imageId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error rejecting image:', error);
    return c.json({ error: 'Failed to reject image' }, 500);
  }
});

// Regenerate an image
app.post('/images/:id/regenerate', jwtMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const imageId = c.req.param('id');
    const db = c.env.DB;

    // Get original image details
    const image = await db.prepare(`
      SELECT prompt, image_type, metadata FROM ai_generated_images
      WHERE id = ? AND user_id = ?
    `).bind(imageId, userId).first();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // TODO: Call Railway agent to regenerate image
    // For now, just create a pending entry
    
    const newId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO ai_generated_images (
        id, user_id, prompt, status, image_type, metadata, created_at
      ) VALUES (?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      newId,
      userId,
      image.prompt,
      image.image_type,
      image.metadata
    ).run();

    return c.json({ 
      success: true,
      imageId: newId
    });
  } catch (error) {
    console.error('Error regenerating image:', error);
    return c.json({ error: 'Failed to regenerate image' }, 500);
  }
});

// Store a new generated image (called by brand marketing agent)
app.post('/images', jwtMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { image_url, prompt, image_type, metadata } = await c.req.json();

    if (!image_url) {
      return c.json({ error: 'image_url is required' }, 400);
    }

    const db = c.env.DB;
    const imageId = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO ai_generated_images (
        id, user_id, image_url, prompt, status, image_type, metadata, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      imageId,
      userId,
      image_url,
      prompt || '',
      image_type || 'general',
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return c.json({ 
      success: true,
      imageId
    });
  } catch (error) {
    console.error('Error storing AI image:', error);
    return c.json({ error: 'Failed to store image' }, 500);
  }
});

// Public endpoint for Railway agent to store images (includes user_id in body)
app.post('/images/from-agent', async (c) => {
  try {
    const { user_id, image_url, prompt, image_type, metadata } = await c.req.json();

    if (!user_id || !image_url) {
      return c.json({ error: 'user_id and image_url are required' }, 400);
    }

    const db = c.env.DB;
    const imageId = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO ai_generated_images (
        id, user_id, image_url, prompt, status, image_type, metadata, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      imageId,
      user_id,
      image_url,
      prompt || '',
      image_type || 'general',
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return c.json({ 
      success: true,
      imageId
    });
  } catch (error) {
    console.error('Error storing AI image from agent:', error);
    return c.json({ error: 'Failed to store image' }, 500);
  }
});

export default app;
