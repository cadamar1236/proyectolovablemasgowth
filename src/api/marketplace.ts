/**
 * Marketplace API
 * Handles validators, beta products, applications, and matching
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { requireAuth, requireRole } from './auth';
import { checkPlanLimit, incrementUsage, decrementUsage } from './plans';

const marketplace = new Hono<{ Bindings: Bindings }>();

// ============================================
// VALIDATORS API
// ============================================

// Get all validators (public, with filters)
marketplace.get('/validators', async (c) => {
  const {
    expertise, // Filter by expertise
    min_rating,
    availability,
    limit = '20',
    offset = '0'
  } = c.req.query();
  
  let query = `
    SELECT 
      v.*,
      u.name, u.email, u.avatar_url, u.bio, u.company
    FROM validators v
    JOIN users u ON v.user_id = u.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (expertise) {
    query += ` AND v.expertise LIKE ?`;
    params.push(`%${expertise}%`);
  }
  
  if (min_rating) {
    query += ` AND v.rating >= ?`;
    params.push(parseFloat(min_rating));
  }
  
  if (availability) {
    query += ` AND v.availability = ?`;
    params.push(availability);
  }
  
  query += ` ORDER BY v.rating DESC, v.total_validations DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ validators: results });
});

// Get validator profile by ID (public)
marketplace.get('/validators/:id', async (c) => {
  const validatorId = c.req.param('id');
  
  const validator = await c.env.DB.prepare(`
    SELECT 
      v.*,
      u.name, u.email, u.avatar_url, u.bio, u.company,
      u.created_at as user_created_at
    FROM validators v
    JOIN users u ON v.user_id = u.id
    WHERE v.id = ?
  `).bind(validatorId).first();
  
  if (!validator) {
    return c.json({ error: 'Validator not found' }, 404);
  }
  
  // Get certifications
  const { results: certifications } = await c.env.DB.prepare(
    'SELECT * FROM validator_certifications WHERE validator_id = ?'
  ).bind(validatorId).all();
  
  // Get recent reviews
  const { results: reviews } = await c.env.DB.prepare(`
    SELECT 
      r.*,
      u.name as reviewer_name,
      u.avatar_url as reviewer_avatar
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.reviewee_id = ? AND r.reviewee_type = 'validator'
    ORDER BY r.created_at DESC
    LIMIT 10
  `).bind(validatorId).all();
  
  return c.json({
    validator,
    certifications,
    reviews
  });
});

// Update validator profile (authenticated)
marketplace.put('/validators/profile', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const {
    title,
    expertise, // JSON array
    experience_years,
    hourly_rate,
    availability,
    languages, // JSON array
    portfolio_url,
    linkedin_url
  } = await c.req.json();
  
  // Get validator ID
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'Validator profile not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE validators
    SET title = COALESCE(?, title),
        expertise = COALESCE(?, expertise),
        experience_years = COALESCE(?, experience_years),
        hourly_rate = COALESCE(?, hourly_rate),
        availability = COALESCE(?, availability),
        languages = COALESCE(?, languages),
        portfolio_url = COALESCE(?, portfolio_url),
        linkedin_url = COALESCE(?, linkedin_url)
    WHERE id = ?
  `).bind(
    title, expertise, experience_years, hourly_rate, availability,
    languages, portfolio_url, linkedin_url, validator.id
  ).run();
  
  return c.json({ message: 'Profile updated successfully' });
});

// ============================================
// BETA PRODUCTS API
// ============================================

// Get all beta products (public, with filters)
marketplace.get('/products', async (c) => {
  const {
    category,
    stage,
    status = 'active',
    featured,
    limit = '20',
    offset = '0'
  } = c.req.query();
  
  let query = `
    SELECT 
      p.*,
      u.name as company_name, u.avatar_url as company_avatar, u.company
    FROM beta_products p
    JOIN users u ON p.company_user_id = u.id
    WHERE p.status = ?
  `;
  
  const params: any[] = [status];
  
  if (category) {
    query += ` AND p.category = ?`;
    params.push(category);
  }
  
  if (stage) {
    query += ` AND p.stage = ?`;
    params.push(stage);
  }
  
  if (featured) {
    query += ` AND p.featured = 1`;
  }
  
  query += ` ORDER BY p.featured DESC, p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ products: results });
});

// Get product by ID (public)
marketplace.get('/products/:id', async (c) => {
  const productId = c.req.param('id');
  
  const product = await c.env.DB.prepare(`
    SELECT 
      p.*,
      u.name as company_name,
      u.avatar_url as company_avatar,
      u.company,
      u.bio as company_bio
    FROM beta_products p
    JOIN users u ON p.company_user_id = u.id
    WHERE p.id = ?
  `).bind(productId).first();
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  // Get application count
  const appCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM validator_applications WHERE product_id = ?'
  ).bind(productId).first() as any;
  
  // Get reviews
  const { results: reviews } = await c.env.DB.prepare(`
    SELECT 
      r.*,
      u.name as reviewer_name,
      u.avatar_url as reviewer_avatar,
      v.title as reviewer_title
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    LEFT JOIN validators v ON u.id = v.user_id
    WHERE r.reviewee_id = ? AND r.reviewee_type = 'product'
    ORDER BY r.created_at DESC
    LIMIT 10
  `).bind(productId).all();
  
  return c.json({
    product,
    application_count: appCount.count,
    reviews
  });
});

// Create beta product (authenticated, founders only)
marketplace.post('/products', requireAuth, async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  
  if (userRole !== 'founder' && userRole !== 'admin') {
    return c.json({ error: 'Only founders can create products' }, 403);
  }
  
  const {
    title,
    description,
    category,
    subcategory,
    stage,
    url,
    looking_for,
    compensation_type,
    compensation_amount,
    duration_days,
    validators_needed,
    requirements // JSON
  } = await c.req.json();
  
  if (!title || !description || !category || !looking_for) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  // ============================================
  // CHECK PLAN LIMITS - Products count
  // ============================================
  const productLimitCheck = await checkPlanLimit(c.env.DB, userId, 'products', 1);
  
  if (!productLimitCheck.allowed) {
    return c.json({ 
      error: 'Plan limit reached', 
      message: productLimitCheck.message,
      current_usage: productLimitCheck.current,
      limit: productLimitCheck.limit,
      upgrade_required: true
    }, 403);
  }
  
  // ============================================
  // CHECK PLAN LIMITS - Validators requested
  // ============================================
  const validatorsNeededNum = validators_needed || 5;
  const validatorLimitCheck = await checkPlanLimit(c.env.DB, userId, 'validators', validatorsNeededNum);
  
  if (!validatorLimitCheck.allowed) {
    return c.json({ 
      error: 'Validator limit exceeded', 
      message: validatorLimitCheck.message,
      current_usage: validatorLimitCheck.current,
      limit: validatorLimitCheck.limit,
      requested: validatorsNeededNum,
      upgrade_required: true
    }, 403);
  }
  
  // Create product
  const result = await c.env.DB.prepare(`
    INSERT INTO beta_products (
      company_user_id, title, description, category, subcategory,
      stage, url, looking_for, compensation_type, compensation_amount,
      duration_days, validators_needed, requirements, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, title, description, category, subcategory,
    stage, url, looking_for, compensation_type, compensation_amount,
    duration_days, validatorsNeededNum, requirements, 'active'
  ).run();
  
  // Increment usage counters
  await incrementUsage(c.env.DB, userId, 'products', 1);
  await incrementUsage(c.env.DB, userId, 'validators', validatorsNeededNum);
  
  return c.json({
    id: result.meta.last_row_id,
    message: 'Product created successfully',
    validators_allocated: validatorsNeededNum
  });
});

// Update beta product (authenticated, owner only)
marketplace.put('/products/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const productId = c.req.param('id');
  
  // Check ownership
  const product = await c.env.DB.prepare(
    'SELECT company_user_id FROM beta_products WHERE id = ?'
  ).bind(productId).first() as any;
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  if (product.company_user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const updateData = await c.req.json();
  
  // Build update query dynamically
  const fields: string[] = [];
  const values: any[] = [];
  
  const allowedFields = [
    'title', 'description', 'category', 'subcategory', 'stage', 'url',
    'looking_for', 'compensation_type', 'compensation_amount',
    'duration_days', 'validators_needed', 'requirements', 'status'
  ];
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updateData[field]);
    }
  }
  
  if (fields.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(productId);
  
  await c.env.DB.prepare(
    `UPDATE beta_products SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();
  
  return c.json({ message: 'Product updated successfully' });
});

// ============================================
// APPLICATIONS API
// ============================================

// Apply to validate a product (authenticated, validators only)
marketplace.post('/applications', requireAuth, async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  
  if (userRole !== 'validator') {
    return c.json({ error: 'Only validators can apply' }, 403);
  }
  
  const { product_id, message } = await c.req.json();
  
  if (!product_id) {
    return c.json({ error: 'Product ID required' }, 400);
  }
  
  // Get validator ID
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'Validator profile not found' }, 404);
  }
  
  // Check if product exists and is active
  const product = await c.env.DB.prepare(
    'SELECT id, validators_needed, validators_accepted FROM beta_products WHERE id = ? AND status = ?'
  ).bind(product_id, 'active').first() as any;
  
  if (!product) {
    return c.json({ error: 'Product not found or not accepting applications' }, 404);
  }
  
  // Check if already applied
  const existing = await c.env.DB.prepare(
    'SELECT id FROM validator_applications WHERE product_id = ? AND validator_id = ?'
  ).bind(product_id, validator.id).first();
  
  if (existing) {
    return c.json({ error: 'Already applied to this product' }, 400);
  }
  
  // Create application
  const result = await c.env.DB.prepare(`
    INSERT INTO validator_applications (product_id, validator_id, message, status)
    VALUES (?, ?, ?, 'pending')
  `).bind(product_id, validator.id, message).run();
  
  // Notify company (create notification)
  await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT company_user_id, 'application', 'Nueva aplicación para validación', ?, ?
    FROM beta_products WHERE id = ?
  `).bind(
    `Un validador ha aplicado para probar tu producto`,
    `/marketplace/applications/${result.meta.last_row_id}`,
    product_id
  ).run();
  
  return c.json({
    id: result.meta.last_row_id,
    message: 'Application submitted successfully'
  });
});

// Get applications for a product (authenticated, product owner)
marketplace.get('/products/:id/applications', requireAuth, async (c) => {
  const userId = c.get('userId');
  const productId = c.req.param('id');
  
  // Check ownership
  const product = await c.env.DB.prepare(
    'SELECT company_user_id FROM beta_products WHERE id = ?'
  ).bind(productId).first() as any;
  
  if (!product || product.company_user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      a.*,
      v.title, v.expertise, v.rating, v.total_validations, v.hourly_rate,
      u.name, u.avatar_url, u.bio
    FROM validator_applications a
    JOIN validators v ON a.validator_id = v.id
    JOIN users u ON v.user_id = u.id
    WHERE a.product_id = ?
    ORDER BY a.created_at DESC
  `).bind(productId).all();
  
  return c.json({ applications: results });
});

// Get validator's applications (authenticated, validator)
marketplace.get('/my-applications', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  // Get validator ID
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'Validator profile not found' }, 404);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      a.*,
      p.title as product_title, p.description, p.category, p.compensation_type, p.compensation_amount,
      u.name as company_name, u.avatar_url as company_avatar
    FROM validator_applications a
    JOIN beta_products p ON a.product_id = p.id
    JOIN users u ON p.company_user_id = u.id
    WHERE a.validator_id = ?
    ORDER BY a.created_at DESC
  `).bind(validator.id).all();
  
  return c.json({ applications: results });
});

// Accept/Reject application (authenticated, product owner)
marketplace.post('/applications/:id/decision', requireAuth, async (c) => {
  const userId = c.get('userId');
  const applicationId = c.req.param('id');
  const { decision } = await c.req.json(); // 'accept' or 'reject'
  
  if (!['accept', 'reject'].includes(decision)) {
    return c.json({ error: 'Invalid decision' }, 400);
  }
  
  // Get application and verify ownership
  const application = await c.env.DB.prepare(`
    SELECT a.*, p.company_user_id, p.duration_days, p.validators_accepted, p.validators_needed
    FROM validator_applications a
    JOIN beta_products p ON a.product_id = p.id
    WHERE a.id = ?
  `).bind(applicationId).first() as any;
  
  if (!application) {
    return c.json({ error: 'Application not found' }, 404);
  }
  
  if (application.company_user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // If accepting, check if product has reached validators limit
  if (decision === 'accept') {
    if (application.validators_accepted >= application.validators_needed) {
      return c.json({ 
        error: 'Validator slots full',
        message: 'This product has already reached its maximum number of validators'
      }, 400);
    }
  }
  
  const status = decision === 'accept' ? 'accepted' : 'rejected';
  
  // Update application
  await c.env.DB.prepare(`
    UPDATE validator_applications
    SET status = ?, accepted_at = CASE WHEN ? = 'accepted' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = ?
  `).bind(status, status, applicationId).run();
  
  // If accepted, create validation session
  if (decision === 'accept') {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + application.duration_days * 24 * 60 * 60 * 1000).toISOString();
    
    await c.env.DB.prepare(`
      INSERT INTO validation_sessions (application_id, product_id, validator_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).bind(applicationId, application.product_id, application.validator_id, startDate, endDate).run();
    
    // Update product validators count
    await c.env.DB.prepare(`
      UPDATE beta_products
      SET validators_accepted = validators_accepted + 1
      WHERE id = ?
    `).bind(application.product_id).run();
  }
  
  // Notify validator
  await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT user_id, 'application_decision', ?, ?, ?
    FROM validators WHERE id = ?
  `).bind(
    decision === 'accept' ? '¡Aplicación aceptada!' : 'Aplicación rechazada',
    decision === 'accept' 
      ? 'Tu aplicación ha sido aceptada. Ya puedes comenzar a validar el producto.' 
      : 'Tu aplicación no fue aceptada en esta ocasión.',
    `/marketplace/my-sessions`,
    application.validator_id
  ).run();
  
  return c.json({ message: `Application ${status} successfully` });
});

// Delete product (authenticated, owner only)
marketplace.delete('/products/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const productId = c.req.param('id');
  
  // Get product details and verify ownership
  const product = await c.env.DB.prepare(`
    SELECT company_user_id, validators_needed, status
    FROM beta_products 
    WHERE id = ?
  `).bind(productId).first() as any;
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  if (product.company_user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // Delete the product
  await c.env.DB.prepare('DELETE FROM beta_products WHERE id = ?').bind(productId).run();
  
  // Decrement usage counters
  await decrementUsage(c.env.DB, userId, 'products', 1);
  await decrementUsage(c.env.DB, userId, 'validators', product.validators_needed);
  
  return c.json({ message: 'Product deleted successfully' });
});

// Close product (stop accepting applications)
marketplace.post('/products/:id/close', requireAuth, async (c) => {
  const userId = c.get('userId');
  const productId = c.req.param('id');
  
  // Verify ownership
  const product = await c.env.DB.prepare(
    'SELECT company_user_id, validators_needed FROM beta_products WHERE id = ?'
  ).bind(productId).first() as any;
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  if (product.company_user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // Update status to closed
  await c.env.DB.prepare(`
    UPDATE beta_products 
    SET status = 'closed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(productId).run();
  
  // Decrement counters (product still counts but validators are freed)
  await decrementUsage(c.env.DB, userId, 'validators', product.validators_needed);
  
  return c.json({ message: 'Product closed successfully. Validators freed from your plan limit.' });
});

export default marketplace;
