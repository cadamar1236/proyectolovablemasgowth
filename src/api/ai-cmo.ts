/**
 * AI CMO API - Gestión de imágenes generadas por IA
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// Get all generated images for a user
app.get('/images', async (c) => {
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
        image_url as url,
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
app.post('/images/:id/approve', async (c) => {
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
app.post('/images/:id/reject', async (c) => {
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
app.post('/images/:id/regenerate', async (c) => {
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
app.post('/images', async (c) => {
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
