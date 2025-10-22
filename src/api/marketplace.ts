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

// Advanced search for validators (public)
marketplace.get('/validators/search', async (c) => {
  const {
    q,                    // Text search
    expertise,            // Filter by expertise
    min_rating,
    max_rate,
    availability,
    languages,
    verified_only,
    sort = 'rating',
    limit = '20',
    offset = '0'
  } = c.req.query();
  
  let query = `
    SELECT 
      v.*,
      u.name, u.email, u.avatar_url, u.bio, u.company,
      COUNT(DISTINCT vs.id) as completed_sessions
    FROM validators v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN validation_sessions vs ON v.id = vs.validator_id AND vs.status = 'completed'
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  // Full-text search
  if (q) {
    query += ` AND (
      u.name LIKE ? OR 
      v.title LIKE ? OR 
      v.expertise LIKE ? OR
      u.bio LIKE ?
    )`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  if (expertise) {
    query += ` AND v.expertise LIKE ?`;
    params.push(`%${expertise}%`);
  }
  
  if (min_rating) {
    query += ` AND v.rating >= ?`;
    params.push(parseFloat(min_rating));
  }
  
  if (max_rate) {
    query += ` AND v.hourly_rate <= ?`;
    params.push(parseFloat(max_rate));
  }
  
  if (availability) {
    query += ` AND v.availability = ?`;
    params.push(availability);
  }
  
  if (languages) {
    query += ` AND v.languages LIKE ?`;
    params.push(`%${languages}%`);
  }
  
  if (verified_only === 'true') {
    query += ` AND v.verified = 1`;
  }
  
  query += ` GROUP BY v.id`;
  
  // Sorting
  switch (sort) {
    case 'rate_low':
      query += ` ORDER BY v.hourly_rate ASC`;
      break;
    case 'rate_high':
      query += ` ORDER BY v.hourly_rate DESC`;
      break;
    case 'experience':
      query += ` ORDER BY v.experience_years DESC`;
      break;
    case 'popular':
      query += ` ORDER BY completed_contracts DESC`;
      break;
    default:
      query += ` ORDER BY v.rating DESC, v.total_validations DESC`;
  }
  
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ 
    validators: results, 
    total: results.length,
    filters: { q, expertise, min_rating, max_rate, availability, languages, verified_only, sort }
  });
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

// Advanced search for products (public)
marketplace.get('/products/search', async (c) => {
  const {
    q,                      // Text search
    category,
    stage,
    status = 'active',
    min_budget,
    max_budget,
    tags,
    sort = 'recent',
    limit = '20',
    offset = '0'
  } = c.req.query();
  
  let query = `
    SELECT 
      p.*,
      u.name as company_name,
      u.avatar_url as company_avatar,
      u.company,
      COUNT(DISTINCT a.id) as application_count
    FROM beta_products p
    JOIN users u ON p.company_user_id = u.id
    LEFT JOIN validator_applications a ON p.id = a.product_id
    WHERE p.status = ?
  `;
  
  const params: any[] = [status];
  
  // Full-text search
  if (q) {
    query += ` AND (
      p.title LIKE ? OR 
      p.description LIKE ? OR 
      p.requirements LIKE ?
    )`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  // Filters
  if (category) {
    query += ` AND p.category = ?`;
    params.push(category);
  }
  
  if (stage) {
    query += ` AND p.stage = ?`;
    params.push(stage);
  }
  
  if (min_budget) {
    query += ` AND p.compensation >= ?`;
    params.push(parseFloat(min_budget));
  }
  
  if (max_budget) {
    query += ` AND p.compensation <= ?`;
    params.push(parseFloat(max_budget));
  }
  
  if (tags) {
    query += ` AND p.requirements LIKE ?`;
    params.push(`%${tags}%`);
  }
  
  // Group by product ID
  query += ` GROUP BY p.id`;
  
  // Sorting
  switch (sort) {
    case 'budget_high':
      query += ` ORDER BY p.compensation DESC`;
      break;
    case 'budget_low':
      query += ` ORDER BY p.compensation ASC`;
      break;
    case 'popular':
      query += ` ORDER BY application_count DESC, p.created_at DESC`;
      break;
    case 'featured':
      query += ` ORDER BY p.featured DESC, p.created_at DESC`;
      break;
    default:
      query += ` ORDER BY p.created_at DESC`;
  }
  
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    products: results,
    total: results.length,
    filters: { q, category, stage, min_budget, max_budget, tags, sort }
  });
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

// ============================================
// DASHBOARD & METRICS API
// ============================================

// Get dashboard metrics for current user
marketplace.get('/dashboard/metrics', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first() as any;
    
    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (currentUser.role === 'validator') {
      // Validator metrics
      const validator = await c.env.DB.prepare(`
        SELECT * FROM validators WHERE user_id = ?
      `).bind(userId).first() as any;
      
      if (!validator) {
        return c.json({ error: 'Validator profile not found' }, 404);
      }
      
      // Get total earnings from completed sessions
      const earnings = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(ve.amount), 0) as total 
        FROM validator_earnings ve
        JOIN validation_sessions vs ON ve.session_id = vs.id
        WHERE vs.validator_id = ? AND vs.status = 'completed'
      `).bind(validator.id).first() as any;
      
      // Get applications by status
      const apps = await c.env.DB.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM validator_applications
        WHERE validator_id = ?
        GROUP BY status
      `).bind(validator.id).all();
      
      // Get monthly earnings for chart
      const monthlyEarnings = await c.env.DB.prepare(`
        SELECT 
          strftime('%Y-%m', ve.created_at) as month,
          COALESCE(SUM(ve.amount), 0) as amount
        FROM validator_earnings ve
        JOIN validation_sessions vs ON ve.session_id = vs.id
        WHERE vs.validator_id = ? AND vs.status = 'completed'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `).bind(validator.id).all();
      
      // Get active sessions count
      const activeSessions = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM validation_sessions
        WHERE validator_id = ? AND status = 'active'
      `).bind(validator.id).first() as any;
      
      return c.json({
        role: 'validator',
        total_earnings: earnings?.total || 0,
        rating: validator?.rating || 0,
        total_validations: validator?.total_validations || 0,
        active_sessions: activeSessions?.count || 0,
        applications: {
          pending: apps.results?.find((a: any) => a.status === 'pending')?.count || 0,
          approved: apps.results?.find((a: any) => a.status === 'approved')?.count || 0,
          rejected: apps.results?.find((a: any) => a.status === 'rejected')?.count || 0
        },
        monthly_earnings: monthlyEarnings?.results || []
      });
      
    } else {
      // Founder metrics
      const products = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM beta_products
        WHERE company_user_id = ?
      `).bind(userId).first() as any;
      
      const activeProducts = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM beta_products
        WHERE company_user_id = ? AND status = 'active'
      `).bind(userId).first() as any;
      
      // Get applications received
      const applications = await c.env.DB.prepare(`
        SELECT 
          a.status,
          COUNT(*) as count
        FROM validator_applications a
        JOIN beta_products p ON a.product_id = p.id
        WHERE p.company_user_id = ?
        GROUP BY a.status
      `).bind(userId).all();
      
      // Get active sessions
      const activeSessions = await c.env.DB.prepare(`
        SELECT COUNT(DISTINCT vs.id) as count
        FROM validation_sessions vs
        JOIN beta_products p ON vs.product_id = p.id
        WHERE p.company_user_id = ? AND vs.status = 'active'
      `).bind(userId).first() as any;
      
      // Get completed sessions
      const completedSessions = await c.env.DB.prepare(`
        SELECT COUNT(DISTINCT vs.id) as count
        FROM validation_sessions vs
        JOIN beta_products p ON vs.product_id = p.id
        WHERE p.company_user_id = ? AND vs.status = 'completed'
      `).bind(userId).first() as any;
      
      // Monthly products created
      const monthlyProducts = await c.env.DB.prepare(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as count
        FROM beta_products
        WHERE company_user_id = ?
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `).bind(userId).all();
      
      return c.json({
        role: 'founder',
        total_products: products?.count || 0,
        active_products: activeProducts?.count || 0,
        active_sessions: activeSessions?.count || 0,
        completed_sessions: completedSessions?.count || 0,
        applications: {
          pending: applications.results?.find((a: any) => a.status === 'pending')?.count || 0,
          approved: applications.results?.find((a: any) => a.status === 'approved')?.count || 0,
          rejected: applications.results?.find((a: any) => a.status === 'rejected')?.count || 0
        },
        monthly_products: monthlyProducts?.results || []
      });
    }
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return c.json({ 
      error: 'Failed to load dashboard metrics',
      details: error.message 
    }, 500);
  }
});

// ============================================
// NOTIFICATIONS API
// ============================================

// Get user notifications
marketplace.get('/notifications', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { unread_only, limit = '50', offset = '0' } = c.req.query();
  
  let query = `
    SELECT * FROM notifications 
    WHERE user_id = ?
  `;
  
  const params: any[] = [userId];
  
  if (unread_only === 'true') {
    query += ` AND read = 0`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  const { results: notifications } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Count unread
  const unread = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
  ).bind(userId).first() as any;
  
  return c.json({
    notifications,
    unread_count: unread?.count || 0,
    total: notifications.length
  });
});

// Mark notification as read
marketplace.put('/notifications/:id/read', requireAuth, async (c) => {
  const userId = c.get('userId');
  const notifId = c.req.param('id');
  
  // Verify ownership
  const notif = await c.env.DB.prepare(
    'SELECT user_id FROM notifications WHERE id = ?'
  ).bind(notifId).first() as any;
  
  if (!notif || notif.user_id !== userId) {
    return c.json({ error: 'Notification not found' }, 404);
  }
  
  await c.env.DB.prepare(
    'UPDATE notifications SET read = 1 WHERE id = ?'
  ).bind(notifId).run();
  
  return c.json({ message: 'Notification marked as read' });
});

// Mark all notifications as read
marketplace.put('/notifications/read-all', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  await c.env.DB.prepare(
    'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0'
  ).bind(userId).run();
  
  return c.json({ message: 'All notifications marked as read' });
});

// Delete notification
marketplace.delete('/notifications/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const notifId = c.req.param('id');
  
  // Verify ownership
  const notif = await c.env.DB.prepare(
    'SELECT user_id FROM notifications WHERE id = ?'
  ).bind(notifId).first() as any;
  
  if (!notif || notif.user_id !== userId) {
    return c.json({ error: 'Notification not found' }, 404);
  }
  
  await c.env.DB.prepare('DELETE FROM notifications WHERE id = ?').bind(notifId).run();
  
  return c.json({ message: 'Notification deleted' });
});

// Get unread count (lightweight endpoint for polling)
marketplace.get('/notifications/unread-count', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
  ).bind(userId).first() as any;
  
  return c.json({ unread_count: result?.count || 0 });
});

// ============================================
// PRODUCT MANAGEMENT
// ============================================

// Get founder's own products
marketplace.get('/my-products', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(`
    SELECT 
      p.*,
      u.name as company_name,
      COUNT(DISTINCT va.id) as validators_count
    FROM beta_products p
    JOIN users u ON p.company_user_id = u.id
    LEFT JOIN validator_applications va ON p.id = va.product_id AND va.status = 'approved'
    WHERE p.company_user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).bind(userId).all();
  
  return c.json({ products: result.results || [] });
});

// Invite validator to product
marketplace.post('/products/:productId/invite-validator', requireAuth, async (c) => {
  const userId = c.get('userId');
  const productId = c.req.param('productId');
  const { validator_id } = await c.req.json();
  
  if (!validator_id) {
    return c.json({ error: 'validator_id is required' }, 400);
  }
  
  // Verify product ownership
  const product = await c.env.DB.prepare(
    'SELECT * FROM beta_products WHERE id = ? AND company_user_id = ?'
  ).bind(productId, userId).first() as any;
  
  if (!product) {
    return c.json({ error: 'Product not found or unauthorized' }, 404);
  }
  
  // Check validator limit
  const validatorsCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count 
    FROM validator_applications 
    WHERE product_id = ? AND status = 'approved'
  `).bind(productId).first() as any;
  
  const maxValidators = product.validators_needed || 3;
  
  if ((validatorsCount?.count || 0) >= maxValidators) {
    return c.json({ 
      error: `Product has reached the maximum limit of ${maxValidators} validators` 
    }, 400);
  }
  
  // Check if validator already applied or was invited
  const existingApplication = await c.env.DB.prepare(
    'SELECT * FROM validator_applications WHERE product_id = ? AND validator_id = ?'
  ).bind(productId, validator_id).first();
  
  if (existingApplication) {
    return c.json({ 
      error: 'Validator already has an application for this product' 
    }, 400);
  }
  
  // Create an application with 'pending' status (invitation)
  await c.env.DB.prepare(`
    INSERT INTO validator_applications (
      product_id, validator_id, status, proposal, applied_at
    ) VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(
    productId, 
    validator_id, 
    'invited',
    'Invitado por el founder del producto'
  ).run();
  
  // Create notification for validator
  const validator = await c.env.DB.prepare(
    'SELECT user_id, title FROM validators WHERE id = ?'
  ).bind(validator_id).first() as any;
  
  if (validator) {
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      validator.user_id,
      'product_invitation',
      'Nueva invitación de producto',
      `Has sido invitado a validar: ${product.title}`,
      `/marketplace?tab=dashboard&product=${productId}`,
      JSON.stringify({ product_id: productId, validator_id })
    ).run();
  }
  
  return c.json({ 
    message: 'Validator invited successfully',
    status: 'invited'
  });
});

// ============================================
// MESSAGING SYSTEM
// ============================================

// Get active session with a specific validator
marketplace.get('/sessions/validator/:validatorId', requireAuth, async (c) => {
  const userId = c.get('userId');
  const validatorId = c.req.param('validatorId');
  
  // Find an active validation session between the user and the validator
  const session = await c.env.DB.prepare(`
    SELECT vs.*, bp.title as product_title
    FROM validation_sessions vs
    JOIN validator_applications va ON vs.application_id = va.id
    JOIN beta_products bp ON vs.product_id = bp.id
    WHERE (bp.company_user_id = ? OR vs.validator_id = ?)
      AND vs.validator_id = ?
      AND vs.status = 'active'
    ORDER BY vs.created_at DESC
    LIMIT 1
  `).bind(userId, validatorId, validatorId).first();
  
  return c.json({ session });
});

// Get messages for a session
marketplace.get('/sessions/:sessionId/messages', requireAuth, async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  
  // Verify user has access to this session
  const session = await c.env.DB.prepare(`
    SELECT vs.*, bp.company_user_id
    FROM validation_sessions vs
    JOIN beta_products bp ON vs.product_id = bp.id
    WHERE vs.id = ?
  `).bind(sessionId).first() as any;
  
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }
  
  // Check if user is either the founder or the validator
  const validator = await c.env.DB.prepare(
    'SELECT user_id FROM validators WHERE id = ?'
  ).bind(session.validator_id).first() as any;
  
  if (userId !== session.company_user_id && userId !== validator?.user_id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // Get messages
  const result = await c.env.DB.prepare(`
    SELECT 
      m.*,
      u.name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.session_id = ?
    ORDER BY m.created_at ASC
  `).bind(sessionId).all();
  
  // Mark messages as read for the current user
  await c.env.DB.prepare(
    'UPDATE messages SET read = 1 WHERE session_id = ? AND receiver_id = ? AND read = 0'
  ).bind(sessionId, userId).run();
  
  return c.json({ messages: result.results || [] });
});

// Send a message
marketplace.post('/sessions/:sessionId/messages', requireAuth, async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const { message } = await c.req.json();
  
  if (!message || message.trim().length === 0) {
    return c.json({ error: 'Message is required' }, 400);
  }
  
  // Verify user has access to this session
  const session = await c.env.DB.prepare(`
    SELECT vs.*, bp.company_user_id
    FROM validation_sessions vs
    JOIN beta_products bp ON vs.product_id = bp.id
    WHERE vs.id = ?
  `).bind(sessionId).first() as any;
  
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }
  
  // Get validator's user_id
  const validator = await c.env.DB.prepare(
    'SELECT user_id FROM validators WHERE id = ?'
  ).bind(session.validator_id).first() as any;
  
  // Check if user is either the founder or the validator
  if (userId !== session.company_user_id && userId !== validator?.user_id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // Determine receiver
  const receiverId = userId === session.company_user_id ? validator.user_id : session.company_user_id;
  
  // Insert message
  const result = await c.env.DB.prepare(`
    INSERT INTO messages (session_id, sender_id, receiver_id, message)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, userId, receiverId, message.trim()).run();
  
  return c.json({ 
    message: 'Message sent',
    messageId: result.meta.last_row_id
  });
});

export default marketplace;
