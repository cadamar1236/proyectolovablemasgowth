/**
 * Marketplace API
 * Handles validators, beta products, applications, and matching
 */

import { Hono } from 'hono';
import type { Bindings, AuthContext } from '../types';
import { requireAuth, requireRole } from './auth';
import { checkPlanLimit, incrementUsage, decrementUsage } from './plans';

const marketplace = new Hono<{ Bindings: Bindings; Variables: AuthContext }>();

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
    ...product,
    application_count: appCount.count,
    reviews
  });
});

// Create beta product (authenticated, founders only)
marketplace.post('/products', requireAuth, async (c) => {
  const userId = c.get('userId');
  console.log('=== CREATING PRODUCT ===');
  console.log('User ID:', userId);
  console.log('User Role:', c.get('userRole'));
  
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
  
  // Asegurar valores por defecto para campos opcionales
  const subcategoryValue = subcategory || null;
  const requirementsValue = requirements || '{}';
  const lookingForValue = looking_for || 'General feedback';
  const compensationTypeValue = compensation_type || 'free_access';
  const compensationAmountValue = compensation_amount || 0;
  const durationDaysValue = duration_days || 14;
  const validatorsNeededValue = validators_needed || 5;
  
  if (!title || !description || !category) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  // ============================================
  // CHECK PLAN LIMITS - Products count
  // ============================================
  // const productLimitCheck = await checkPlanLimit(c.env.DB, userId, 'products', 1);
  
  // if (!productLimitCheck.allowed) {
  //   return c.json({ 
  //     error: 'Plan limit reached', 
  //     message: productLimitCheck.message,
  //     current_usage: productLimitCheck.current,
  //     limit: productLimitCheck.limit,
  //     upgrade_required: true
  //   }, 403);
  // }
  
  // Asegurar que userRole esté definido correctamente
  const userRole = c.get('userRole') || 'unknown'; // Valor predeterminado si no está definido
  
  // Agregar logs de depuración para identificar el problema
  console.log('Creando producto con los siguientes datos:', {
    userId,
    title,
    description,
    category,
    subcategory: subcategoryValue,
    stage,
    url,
    looking_for: lookingForValue,
    compensation_type: compensationTypeValue,
    compensation_amount: compensationAmountValue,
    duration_days: durationDaysValue,
    validators_needed: validatorsNeededValue,
    requirements: requirementsValue
  });
  
  // Agregar logs para depurar la inserción en la base de datos
  console.log('Intentando insertar producto con los siguientes datos:', {
    userId,
    title,
    description,
    category,
    subcategory: subcategoryValue,
    stage,
    url,
    looking_for: lookingForValue,
    compensation_type: compensationTypeValue,
    compensation_amount: compensationAmountValue,
    duration_days: durationDaysValue,
    validators_needed: validatorsNeededValue,
    requirements: requirementsValue
  });
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO beta_products (
        company_user_id, title, description, category, subcategory,
        stage, url, looking_for, compensation_type, compensation_amount,
        duration_days, validators_needed, requirements, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, title, description, category, subcategoryValue,
      stage, url, lookingForValue, compensationTypeValue, compensationAmountValue,
      durationDaysValue, validatorsNeededValue, requirementsValue, 'active'
    ).run();
    
    console.log('Producto insertado con éxito:', result);
  
    // Incrementar contadores de uso (no crítico)
    try {
      await incrementUsage(c.env.DB, userId, 'validators', validatorsNeededValue);
      console.log('Contadores de uso incrementados correctamente');
    } catch (usageError) {
      console.error('Error al incrementar contadores de uso:', usageError);
      // No fallar la creación del producto por esto
    }
    
    return c.json({
      id: result.meta.last_row_id,
      message: 'Product created successfully',
      validators_allocated: validatorsNeededValue
    });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    return c.json({ error: 'Error interno al crear el producto' }, 500);
  }
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
  
  console.log('DELETE product request:', { userId, productId, userIdType: typeof userId });
  
  // Validate productId
  const productIdNum = parseInt(productId);
  if (isNaN(productIdNum)) {
    return c.json({ error: 'Invalid product ID' }, 400);
  }
  
  try {
    // Get product details and verify ownership
    const product = await c.env.DB.prepare(`
      SELECT company_user_id, validators_needed, status
      FROM beta_products 
      WHERE id = ?
    `).bind(productIdNum).first() as any;
    
    console.log('DELETE product - Product found:', product);
    console.log('DELETE product - company_user_id:', product?.company_user_id, 'type:', typeof product?.company_user_id);
    console.log('DELETE product - userId from token:', userId, 'type:', typeof userId);
    
    if (!product) {
      console.log('DELETE product - Product not found');
      return c.json({ error: 'Product not found' }, 404);
    }
    
    if (product.company_user_id === null || product.company_user_id === undefined) {
      console.log('DELETE product - Product has null company_user_id');
      return c.json({ error: 'Product ownership not set' }, 500);
    }
    
    const productOwnerId = product.company_user_id.toString();
    const requestUserId = userId.toString();
    
    console.log('DELETE product - Ownership check:', { 
      productOwnerId, 
      requestUserId, 
      areEqual: productOwnerId === requestUserId
    });
    
    if (productOwnerId !== requestUserId) {
      console.log('DELETE product - Ownership check failed');
      return c.json({ error: 'Unauthorized - You do not own this product' }, 403);
    }
    
    // Check what related records exist before deleting
    console.log('DELETE product - Checking related records for product:', productIdNum);
    
    const votesCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM product_votes WHERE product_id = ?').bind(productIdNum).first();
    console.log('DELETE product - Product votes count:', votesCount);
    
    const applicationsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM validator_applications WHERE product_id = ?').bind(productIdNum).first();
    console.log('DELETE product - Validator applications count:', applicationsCount);
    
    const sessionsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM validation_sessions WHERE product_id = ?').bind(productIdNum).first();
    console.log('DELETE product - Validation sessions count:', sessionsCount);
    
    const reportsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM validation_reports WHERE product_id = ?').bind(productIdNum).first();
    console.log('DELETE product - Validation reports count:', reportsCount);
    
    const messagesCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM messages WHERE product_id = ? OR session_id IN (SELECT id FROM validation_sessions WHERE product_id = ?)').bind(productIdNum, productIdNum).first();
    console.log('DELETE product - Messages count:', messagesCount);
    
    // Delete related records first to avoid foreign key constraints
    console.log('DELETE product - Deleting related records...');
    
    try {
      // Delete validation reports first (depends on sessions)
      const reportsResult = await c.env.DB.prepare('DELETE FROM validation_reports WHERE product_id = ?').bind(productIdNum).run();
      console.log('DELETE product - Validation reports deleted:', reportsResult);
    } catch (error) {
      console.error('DELETE product - Error deleting validation reports:', error);
    }
    
    try {
      // Delete messages (both types - direct product reference and session reference)
      const messagesResult = await c.env.DB.prepare('DELETE FROM messages WHERE product_id = ? OR session_id IN (SELECT id FROM validation_sessions WHERE product_id = ?)').bind(productIdNum, productIdNum).run();
      console.log('DELETE product - Messages deleted:', messagesResult);
    } catch (error) {
      console.error('DELETE product - Error deleting messages:', error);
    }
    
    try {
      // Delete validation sessions (depends on applications)
      const sessionsResult = await c.env.DB.prepare('DELETE FROM validation_sessions WHERE product_id = ?').bind(productIdNum).run();
      console.log('DELETE product - Validation sessions deleted:', sessionsResult);
    } catch (error) {
      console.error('DELETE product - Error deleting validation sessions:', error);
    }
    
    try {
      // Delete validator applications
      const applicationsResult = await c.env.DB.prepare('DELETE FROM validator_applications WHERE product_id = ?').bind(productIdNum).run();
      console.log('DELETE product - Validator applications deleted:', applicationsResult);
    } catch (error) {
      console.error('DELETE product - Error deleting validator applications:', error);
    }
    
    try {
      // Delete votes (has CASCADE but delete explicitly for safety)
      const votesResult = await c.env.DB.prepare('DELETE FROM product_votes WHERE product_id = ?').bind(productIdNum).run();
      console.log('DELETE product - Votes deleted:', votesResult);
    } catch (error) {
      console.error('DELETE product - Error deleting votes:', error);
    }
    
    console.log('DELETE product - Related records deleted, now deleting product...');
    
    // Delete the product
    const productResult = await c.env.DB.prepare('DELETE FROM beta_products WHERE id = ?').bind(productIdNum).run();
    console.log('DELETE product - Product deleted successfully:', productResult);
    
    // Decrement usage counters (handle errors gracefully)
    try {
      await decrementUsage(c.env.DB, userId, 'products', 1);
      if (product.validators_needed > 0) {
        await decrementUsage(c.env.DB, userId, 'validators', product.validators_needed);
      }
    } catch (usageError) {
      console.warn('Failed to decrement usage counters:', usageError);
      // Don't fail the request if usage decrement fails
    }
    
    return c.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return c.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      productId: productId 
    }, 500);
  }
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

// TEMPORARY DEBUG ENDPOINT - No auth, minimal logic
marketplace.get('/debug/dashboard', async (c) => {
  try {
    console.log('DEBUG: Debug endpoint called');
    
    // Just return a hardcoded response
    const response = {
      role: 'founder',
      total_products: 5,
      active_products: 3,
      active_sessions: 2,
      completed_sessions: 1,
      total_ratings_given: 0,
      applications: {
        pending: 1,
        approved: 2,
        rejected: 0
      },
      monthly_products: []
    };
    
    console.log('DEBUG: Returning hardcoded response');
    return c.json(response);
  } catch (error) {
    console.error('DEBUG: Error in debug endpoint:', error);
    return c.json({ error: 'Debug endpoint failed' }, 500);
  }
});

// Debug endpoint for dashboard authentication
marketplace.get('/dashboard/debug', async (c) => {
  console.log('Debug endpoint called');
  const authHeader = c.req.header('Authorization');
  console.log('Auth header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided', authHeader }, 401);
  }

  const token = authHeader.substring(7);
  console.log('Token:', token);

  try {
    const { verify } = await import('hono/jwt');
    const payload = await verify(token, 'your-secret-key-change-in-production-use-env-var') as any;
    console.log('Token payload:', payload);

    return c.json({
      message: 'Token is valid',
      userId: payload.userId,
      role: payload.role,
      email: payload.email
    });
  } catch (error) {
    console.log('Token verification error:', error);
    return c.json({ error: 'Invalid token', details: String(error) }, 401);
  }
});

// Get dashboard metrics for current user
marketplace.get('/dashboard/metrics', requireAuth, async (c) => {
  try {
    console.log('Dashboard metrics endpoint called');
    const userId = c.get('userId');
    console.log('User ID from auth:', userId);

    const currentUser = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first() as any;
    console.log('Current user query result:', currentUser);

    if (!currentUser) {
      console.log('User not found, returning 404');
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('User role:', currentUser.role);

    if (currentUser.role === 'validator') {
      console.log('Processing validator metrics');

      try {
        // Validator metrics
        const validator = await c.env.DB.prepare(`
          SELECT * FROM validators WHERE user_id = ?
        `).bind(userId).first() as any;
        console.log('Validator query result:', validator);

        if (!validator) {
          console.log('Validator profile not found, returning 404');
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

        // Build response safely
        const response: any = {
          role: 'validator',
          total_earnings: earnings?.total || 0,
          rating: validator?.rating || 0,
          total_validations: validator?.total_validations || 0,
          active_sessions: activeSessions?.count || 0,
          applications: {
            pending: 0,
            approved: 0,
            rejected: 0
          },
          monthly_earnings: []
        };

        // Safely add applications data
        if (apps && apps.results) {
          apps.results.forEach((app: any) => {
            if (app.status === 'pending') response.applications.pending = app.count;
            if (app.status === 'approved') response.applications.approved = app.count;
            if (app.status === 'rejected') response.applications.rejected = app.count;
          });
        }

        // Safely add monthly earnings data
        if (monthlyEarnings && monthlyEarnings.results) {
          response.monthly_earnings = monthlyEarnings.results;
        }

        return c.json(response);

      } catch (validatorError: any) {
          console.error('Validator metrics error:', validatorError);
          return c.json({
            role: 'validator',
            total_earnings: 0,
            rating: 0,
            total_validations: 0,
            active_sessions: 0,
            applications: { pending: 0, approved: 0, rejected: 0 },
            monthly_earnings: [],
            sql_error: validatorError?.message || String(validatorError)
          }, 500);
      }

    } else {
      console.log('Processing founder metrics for user:', userId);

      try {
        // Get total products count
        const products = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM beta_products
          WHERE company_user_id = ?
        `).bind(userId).first() as any;
        console.log('Products query result:', products);

        // Get active products count
        const activeProducts = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM beta_products
          WHERE company_user_id = ? AND status = 'active'
        `).bind(userId).first() as any;
        console.log('Active products query result:', activeProducts);

        // Get applications received - use simple queries
        const pendingApps = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM validator_applications va
          INNER JOIN beta_products bp ON va.product_id = bp.id
          WHERE bp.company_user_id = ? AND va.status = 'pending'
        `).bind(userId).first() as any;

        const approvedApps = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM validator_applications va
          INNER JOIN beta_products bp ON va.product_id = bp.id
          WHERE bp.company_user_id = ? AND va.status = 'approved'
        `).bind(userId).first() as any;

        const rejectedApps = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM validator_applications va
          INNER JOIN beta_products bp ON va.product_id = bp.id
          WHERE bp.company_user_id = ? AND va.status = 'rejected'
        `).bind(userId).first() as any;

        // Get active sessions count
        const activeSessions = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM validation_sessions vs
          INNER JOIN beta_products bp ON vs.product_id = bp.id
          WHERE bp.company_user_id = ? AND vs.status = 'active'
        `).bind(userId).first() as any;

        // Get completed sessions count
        const completedSessions = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM validation_sessions vs
          INNER JOIN beta_products bp ON vs.product_id = bp.id
          WHERE bp.company_user_id = ? AND vs.status = 'completed'
        `).bind(userId).first() as any;

        // Get total ratings given by founder
        const totalRatingsGiven = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM validator_ratings
          WHERE founder_id = ?
        `).bind(userId).first() as any;

        // Monthly products created
        const monthlyProducts = await c.env.DB.prepare(`
          SELECT
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as count
          FROM beta_products
          WHERE company_user_id = ?
          GROUP BY strftime('%Y-%m', created_at)
          ORDER BY month DESC
          LIMIT 6
        `).bind(userId).all();

        // Build response
        const response: any = {
          role: 'founder',
          total_products: products?.count || 0,
          active_products: activeProducts?.count || 0,
          active_sessions: activeSessions?.count || 0,
          completed_sessions: completedSessions?.count || 0,
          total_ratings_given: totalRatingsGiven?.count || 0,
          applications: {
            pending: pendingApps?.count || 0,
            approved: approvedApps?.count || 0,
            rejected: rejectedApps?.count || 0
          },
          monthly_products: monthlyProducts?.results || []
        };

        console.log('About to return founder response:', response);
        return c.json(response);

      } catch (queryError: any) {
          console.error('Query error in founder metrics:', queryError);
          return c.json({
            role: 'founder',
            total_products: 0,
            active_products: 0,
            active_sessions: 0,
            completed_sessions: 0,
            total_ratings_given: 0,
            applications: { pending: 0, approved: 0, rejected: 0 },
            monthly_products: [],
            sql_error: queryError?.message || String(queryError)
          }, 500);
      }
    }
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({
      error: 'Failed to load dashboard metrics',
      details: errorMessage
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
  
  console.log('Invitando validador:', { userId, productId, validator_id });
  
  if (!validator_id) {
    return c.json({ error: 'validator_id is required' }, 400);
  }
  
  try {
    console.log('Verificando propiedad del producto...');
    // Verify product ownership
    const product = await c.env.DB.prepare(
      'SELECT * FROM beta_products WHERE id = ? AND company_user_id = ?'
    ).bind(productId, userId).first() as any;
    
    console.log('Producto encontrado:', product ? 'Sí' : 'No');
    
    if (!product) {
      return c.json({ error: 'Product not found or unauthorized' }, 404);
    }
    
    console.log('Verificando límite de validadores...');
    // Check validator limit
    const validatorsCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM validator_applications 
      WHERE product_id = ? AND status IN ('approved', 'accepted', 'completed')
    `).bind(productId).first() as any;
    
    console.log('Validadores actuales:', validatorsCount?.count || 0);
    
    const maxValidators = product.validators_needed || 3;
    console.log('Límite máximo:', maxValidators);
    
    if ((validatorsCount?.count || 0) >= maxValidators) {
      return c.json({ 
        error: `Product has reached the maximum limit of ${maxValidators} validators` 
      }, 400);
    }
    
    console.log('Verificando aplicación existente...');
    // Check if validator already applied or was invited
    const existingApplication = await c.env.DB.prepare(
      'SELECT * FROM validator_applications WHERE product_id = ? AND validator_id = ?'
    ).bind(productId, validator_id).first();
    
    console.log('Aplicación existente:', existingApplication ? 'Sí' : 'No');
    
    if (existingApplication) {
      return c.json({ 
        error: 'Validator already has an application for this product' 
      }, 400);
    }
    
    console.log('Verificando que el validador existe...');
    // Verify validator exists
    const validatorCheck = await c.env.DB.prepare(
      'SELECT id, user_id FROM validators WHERE id = ?'
    ).bind(validator_id).first() as any;
    
    console.log('Validador existe:', validatorCheck ? 'Sí' : 'No');
    
    if (!validatorCheck) {
      return c.json({ error: 'Validator not found' }, 404);
    }
    
    console.log('Creando invitación...');
    // Create an application with 'pending' status (invitation)
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO validator_applications (
        product_id, validator_id, status, message, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      productId,
      validator_id,
      'invited',
      'Invitado por el founder del producto'
    ).run();
    
    console.log('Invitación creada:', insertResult);
    
    console.log('Buscando información del validador...');
    // Create notification for validator (optional)
    try {
      const validator = await c.env.DB.prepare(
        'SELECT user_id, title FROM validators WHERE id = ?'
      ).bind(validator_id).first() as any;
      
      console.log('Validador encontrado:', validator ? 'Sí' : 'No');
      console.log('Datos del validador:', validator);
      
      if (validator && validator.user_id) {
        console.log('Verificando que el user_id existe en users...');
        const userExists = await c.env.DB.prepare(
          'SELECT id FROM users WHERE id = ?'
        ).bind(validator.user_id).first() as any;
        
        console.log('Usuario existe:', userExists ? 'Sí' : 'No');
        
        if (userExists) {
          console.log('Creando notificación...');
          const notificationResult = await c.env.DB.prepare(`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (?, ?, ?, ?, ?)
          `).bind(
            validator.user_id,
            'product_invitation',
            'Nueva invitación de producto',
            `Has sido invitado a validar: ${product.title}`,
            `/marketplace?tab=dashboard&product=${productId}`
          ).run();
          
          console.log('Notificación creada exitosamente:', notificationResult);
        } else {
          console.log('No se puede crear notificación: user_id no existe en tabla users');
        }
      } else {
        console.log('No se puede crear notificación: validador no encontrado o sin user_id');
      }
    } catch (notificationError) {
      console.error('Error al crear notificación (continuando):', notificationError);
      // No fallar la invitación por problemas con notificaciones
    }
    
    console.log('Invitación completada exitosamente');
    return c.json({ 
      message: 'Validator invited successfully',
      status: 'invited'
    });
  } catch (error) {
    console.error('Error completo al invitar validador:', error);
    return c.json({ error: 'Internal server error while inviting validator' }, 500);
  }
});

// Get validator invitations
marketplace.get('/validator/invitations', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  // Find validator profile for this user
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'Validator profile not found' }, 404);
  }
  
  // Get pending invitations
  const invitations = await c.env.DB.prepare(`
    SELECT 
      va.id,
      va.product_id,
      va.status,
      va.message,
      va.created_at,
      bp.title as product_title,
      bp.description as product_description,
      bp.category,
      bp.stage,
      u.name as founder_name
    FROM validator_applications va
    JOIN beta_products bp ON va.product_id = bp.id
    JOIN users u ON bp.company_user_id = u.id
    WHERE va.validator_id = ? AND va.status = 'invited'
    ORDER BY va.created_at DESC
  `).bind(validator.id).all();
  
  return c.json({
    invitations: invitations.results || []
  });
});

// Validator responds to invitation
marketplace.post('/validator/invitations/:invitationId/respond', requireAuth, async (c) => {
  const userId = c.get('userId');
  const invitationId = c.req.param('invitationId');
  const { decision } = await c.req.json(); // 'accept' or 'reject'
  
  if (!['accept', 'reject'].includes(decision)) {
    return c.json({ error: 'Invalid decision. Must be "accept" or "reject"' }, 400);
  }
  
  // Find validator profile for this user
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'Validator profile not found' }, 404);
  }
  
  // Get invitation and verify ownership
  const invitation = await c.env.DB.prepare(`
    SELECT va.*, bp.company_user_id, bp.duration_days, bp.validators_accepted, bp.validators_needed
    FROM validator_applications va
    JOIN beta_products bp ON va.product_id = bp.id
    WHERE va.id = ? AND va.validator_id = ? AND va.status = 'invited'
  `).bind(invitationId, validator.id).first() as any;
  
  if (!invitation) {
    return c.json({ error: 'Invitation not found or already responded to' }, 404);
  }
  
  // If accepting, check if product has reached validators limit
  if (decision === 'accept') {
    if (invitation.validators_accepted >= invitation.validators_needed) {
      return c.json({ 
        error: 'Validator slots full',
        message: 'This product has already reached its maximum number of validators'
      }, 400);
    }
  }
  
  const status = decision === 'accept' ? 'accepted' : 'rejected';
  
  // Update invitation
  await c.env.DB.prepare(`
    UPDATE validator_applications
    SET status = ?, accepted_at = CASE WHEN ? = 'accepted' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = ?
  `).bind(status, status, invitationId).run();
  
  // If accepted, create validation session
  if (decision === 'accept') {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + invitation.duration_days * 24 * 60 * 60 * 1000).toISOString();
    
    await c.env.DB.prepare(`
      INSERT INTO validation_sessions (application_id, product_id, validator_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).bind(invitationId, invitation.product_id, validator.id, startDate, endDate).run();
    
    // Update product validators count
    await c.env.DB.prepare(`
      UPDATE beta_products
      SET validators_accepted = validators_accepted + 1
      WHERE id = ?
    `).bind(invitation.product_id).run();
  }
  
  return c.json({
    success: true,
    message: `Invitation ${decision}ed successfully`
  });
});

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

// Get active session with a specific company (for validators)
marketplace.get('/sessions/company/:companyId', requireAuth, async (c) => {
  const userId = c.get('userId');
  const companyId = c.req.param('companyId');
  
  // Find an active validation session between the validator (current user) and the company
  const session = await c.env.DB.prepare(`
    SELECT vs.*, bp.title as product_title, u.name as company_name
    FROM validation_sessions vs
    JOIN validator_applications va ON vs.application_id = va.id
    JOIN beta_products bp ON vs.product_id = bp.id
    JOIN users u ON bp.company_user_id = u.id
    WHERE vs.validator_id = (SELECT id FROM validators WHERE user_id = ?)
      AND bp.company_user_id = ?
      AND vs.status = 'active'
    ORDER BY vs.created_at DESC
    LIMIT 1
  `).bind(userId, companyId).first();
  
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

// Get validator's active sessions
marketplace.get('/my-active-sessions', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  // Get validator ID for current user
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'User is not a validator' }, 403);
  }
  
  // Get active sessions for this validator
  const result = await c.env.DB.prepare(`
    SELECT 
      vs.*,
      bp.title as product_title,
      bp.company_user_id,
      u.name as company_name
    FROM validation_sessions vs
    JOIN beta_products bp ON vs.product_id = bp.id
    JOIN users u ON bp.company_user_id = u.id
    WHERE vs.validator_id = ? AND vs.status = 'active'
    ORDER BY vs.created_at DESC
  `).bind(validator.id).all();
  
  return c.json({ sessions: result.results || [] });
});

// Vote for a product (authenticated users)
marketplace.post('/products/:id/vote', requireAuth, async (c) => {
  const productId = c.req.param('id');
  const userId = c.var.userId;

  const { rating } = await c.req.json();

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  try {
    // Check if product exists
    const product = await c.env.DB.prepare(
      'SELECT id FROM beta_products WHERE id = ?'
    ).bind(productId).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Insert or update vote
    await c.env.DB.prepare(`
      INSERT INTO product_votes (product_id, user_id, rating, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(product_id, user_id) DO UPDATE SET
        rating = excluded.rating,
        updated_at = CURRENT_TIMESTAMP
    `).bind(productId, userId, rating).run();

    // Update product rating stats
    await c.env.DB.prepare(`
      UPDATE beta_products
      SET
        rating_average = (
          SELECT AVG(rating)
          FROM product_votes
          WHERE product_id = ?
        ),
        votes_count = (
          SELECT COUNT(*)
          FROM product_votes
          WHERE product_id = ?
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(productId, productId, productId).run();

    // Sync to leaderboard
    await syncProductToLeaderboard(c.env.DB, parseInt(productId));

    return c.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error recording product vote:', error);
    return c.json({ error: 'Failed to record vote' }, 500);
  }
});

// Get user's vote for a product (authenticated)
marketplace.get('/products/:id/vote', requireAuth, async (c) => {
  const productId = c.req.param('id');
  const userId = c.get('userId');

  try {
    const vote = await c.env.DB.prepare(
      'SELECT rating FROM product_votes WHERE product_id = ? AND user_id = ?'
    ).bind(productId, userId).first() as any;

    return c.json({ vote: vote ? vote.rating : null });
  } catch (error) {
    console.error('Error getting product vote:', error);
    return c.json({ error: 'Failed to get vote' }, 500);
  }
});

// Sync beta products to leaderboard projects
marketplace.post('/sync-products-to-leaderboard', requireAuth, async (c) => {
  try {
    // Get all beta products
    const { results: products } = await c.env.DB.prepare(
      'SELECT * FROM beta_products WHERE status = ?'
    ).bind('active').all();

    const syncedProjects = [];

    for (const product of products) {
      await syncProductToLeaderboard(c.env.DB, product.id as number);
      syncedProjects.push({ id: product.id, title: product.title });
    }

    return c.json({ 
      message: 'Synchronization complete',
      synced: syncedProjects.length,
      projects: syncedProjects
    });
  } catch (error) {
    console.error('Error syncing products to leaderboard:', error);
    return c.json({ error: 'Failed to sync products' }, 500);
  }
});

// Helper function to sync a single product to leaderboard
async function syncProductToLeaderboard(db: any, productId: number) {
  try {
    // Get product data
    const product = await db.prepare(
      'SELECT * FROM beta_products WHERE id = ?'
    ).bind(productId).first();

    if (!product) return;

    // Check if project already exists for this product
    const existingProject = await db.prepare(
      'SELECT id FROM projects WHERE title = ? AND user_id = ?'
    ).bind(product.title, product.company_user_id).first();

    if (existingProject) {
      // Update existing project
      await db.prepare(`
        UPDATE projects
        SET rating_average = ?, votes_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(product.rating_average || 0, product.votes_count || 0, existingProject.id).run();
    } else {
      // Create new project
      await db.prepare(`
        INSERT INTO projects (user_id, title, description, target_market, value_proposition, category, status, rating_average, votes_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        product.company_user_id,
        product.title,
        product.description,
        product.category,
        product.looking_for,
        product.category,
        'published', // Changed from 'analyzing' to 'published' so it appears in leaderboard
        product.rating_average || 0,
        product.votes_count || 0
      ).run();
    }
  } catch (error) {
    console.error('Error syncing product to leaderboard:', error);
  }
}

// Get founder's active validators
marketplace.get('/my-active-validators', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  // Get active validators for founder's products
  const result = await c.env.DB.prepare(`
    SELECT 
      v.id as validator_id,
      v.user_id as validator_user_id,
      u.name as name,
      v.title,
      bp.title as product_title,
      COALESCE(v.rating, 0) as rating,
      COALESCE(v.total_validations, 0) as total_ratings
    FROM validation_sessions vs
    JOIN validators v ON vs.validator_id = v.id
    JOIN users u ON v.user_id = u.id
    JOIN beta_products bp ON vs.product_id = bp.id
    WHERE bp.company_user_id = ? AND vs.status = 'active'
    ORDER BY vs.created_at DESC
  `).bind(userId).all();
  
  return c.json({ validators: result.results || [] });
});

// Rate a validator
marketplace.post('/validators/:validatorId/rate', requireAuth, async (c) => {
  const userId = c.get('userId');
  const validatorId = c.req.param('validatorId');
  const { rating } = await c.req.json();
  
  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }
  
  // Check if there's an active session between this founder and validator
  const session = await c.env.DB.prepare(`
    SELECT vs.id, bp.company_user_id
    FROM validation_sessions vs
    JOIN beta_products bp ON vs.product_id = bp.id
    WHERE vs.validator_id = ? AND bp.company_user_id = ? AND vs.status = 'active'
    LIMIT 1
  `).bind(validatorId, userId).first() as any;
  
  if (!session) {
    return c.json({ error: 'No active session found with this validator' }, 403);
  }
  
  // Check if founder already rated this validator
  const existingRating = await c.env.DB.prepare(`
    SELECT id FROM validator_ratings 
    WHERE validator_id = ? AND founder_id = ?
  `).bind(validatorId, userId).first();
  
  if (existingRating) {
    // Update existing rating
    await c.env.DB.prepare(`
      UPDATE validator_ratings 
      SET rating = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE validator_id = ? AND founder_id = ?
    `).bind(rating, validatorId, userId).run();
  } else {
    // Insert new rating
    await c.env.DB.prepare(`
      INSERT INTO validator_ratings (validator_id, founder_id, rating)
      VALUES (?, ?, ?)
    `).bind(validatorId, userId, rating).run();
  }
  
  // Update validator's average rating
  await c.env.DB.prepare(`
    UPDATE validators 
    SET rating = (
      SELECT AVG(rating) FROM validator_ratings WHERE validator_id = validators.id
    ),
    total_validations = (
      SELECT COUNT(*) FROM validator_ratings WHERE validator_id = validators.id
    )
    WHERE id = ?
  `).bind(validatorId).run();
  
  return c.json({ message: 'Rating submitted successfully' });
});

// Debug endpoint for dashboard authentication testing
marketplace.get('/dashboard/debug', requireAuth, async (c) => {
  return c.json({ 
    message: 'Dashboard authentication successful',
    user: c.get('userId'),
    timestamp: new Date().toISOString()
  });
});

export default marketplace;
