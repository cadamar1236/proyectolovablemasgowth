-- Migration: Notifications System
-- Adds metadata column to notifications table and triggers for real-time updates

-- Add metadata column if it doesn't exist (table was created in 0002_marketplace.sql)
ALTER TABLE notifications ADD COLUMN metadata TEXT;

-- ============================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ============================================

-- Trigger: Notify founder when validator applies to their product
CREATE TRIGGER IF NOT EXISTS notify_new_application
AFTER INSERT ON validator_applications
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    bp.company_user_id,
    'new_application',
    'Nueva aplicación recibida',
    u.name || ' ha aplicado a tu producto: ' || bp.title,
    '/marketplace?tab=dashboard&product=' || NEW.product_id,
    json_object(
      'application_id', NEW.id, 
      'product_id', NEW.product_id,
      'validator_id', NEW.validator_id
    )
  FROM beta_products bp
  JOIN validators v ON v.id = NEW.validator_id
  JOIN users u ON u.id = v.user_id
  WHERE bp.id = NEW.product_id;
END;

-- Trigger: Notify validator when their application is approved
CREATE TRIGGER IF NOT EXISTS notify_application_approved
AFTER UPDATE OF status ON validator_applications
WHEN NEW.status = 'approved' AND OLD.status != 'approved'
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    v.user_id,
    'application_approved',
    '¡Tu aplicación fue aprobada!',
    'Tu aplicación para "' || bp.title || '" ha sido aprobada. Ya puedes comenzar a trabajar.',
    '/marketplace?tab=dashboard',
    json_object(
      'application_id', NEW.id, 
      'product_id', NEW.product_id
    )
  FROM validators v
  JOIN beta_products bp ON bp.id = NEW.product_id
  WHERE v.id = NEW.validator_id;
END;

-- Trigger: Notify validator when their application is rejected
CREATE TRIGGER IF NOT EXISTS notify_application_rejected
AFTER UPDATE OF status ON validator_applications
WHEN NEW.status = 'rejected' AND OLD.status != 'rejected'
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    v.user_id,
    'application_rejected',
    'Aplicación no seleccionada',
    'Lamentablemente tu aplicación para "' || bp.title || '" no fue seleccionada.',
    '/marketplace?tab=products',
    json_object(
      'application_id', NEW.id, 
      'product_id', NEW.product_id
    )
  FROM validators v
  JOIN beta_products bp ON bp.id = NEW.product_id
  WHERE v.id = NEW.validator_id;
END;

-- Trigger: Notify both parties when contract is created
CREATE TRIGGER IF NOT EXISTS notify_contract_created
AFTER INSERT ON validation_sessions
BEGIN
  -- Notify validator
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    v.user_id,
    'contract_created',
    'Nueva sesión de validación creada',
    'Se ha creado una sesión de validación para el producto: ' || bp.title,
    '/marketplace?tab=dashboard&session=' || NEW.id,
    json_object(
      'session_id', NEW.id,
      'product_id', NEW.product_id
    )
  FROM validators v
  JOIN beta_products bp ON bp.id = NEW.product_id
  WHERE v.id = NEW.validator_id;
  
  -- Notify founder
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    bp.company_user_id,
    'contract_created',
    'Sesión de validación iniciada',
    'La sesión de validación con el validador para "' || bp.title || '" ha comenzado.',
    '/marketplace?tab=dashboard&session=' || NEW.id,
    json_object(
      'session_id', NEW.id,
      'product_id', NEW.product_id
    )
  FROM beta_products bp
  WHERE bp.id = NEW.product_id;
END;

-- Trigger: Notify founder when validator completes work
CREATE TRIGGER IF NOT EXISTS notify_contract_completed
AFTER UPDATE OF status ON validation_sessions
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    bp.company_user_id,
    'contract_completed',
    'Trabajo completado',
    'El trabajo para el producto "' || bp.title || '" ha sido completado.',
    '/marketplace?tab=dashboard',
    json_object(
      'session_id', NEW.id,
      'product_id', NEW.product_id
    )
  FROM beta_products bp
  WHERE bp.id = NEW.product_id;
END;

-- Trigger: Notify when someone leaves a review
CREATE TRIGGER IF NOT EXISTS notify_new_review
AFTER INSERT ON reviews
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    NEW.reviewee_id,
    'new_review',
    'Nueva reseña recibida',
    u.name || ' te ha dejado una reseña con ' || NEW.rating || ' estrellas',
    '/marketplace?tab=dashboard',
    json_object(
      'review_id', NEW.id,
      'rating', NEW.rating
    )
  FROM users u
  WHERE u.id = NEW.reviewer_id;
END;

-- ============================================
-- SAMPLE DATA (optional)
-- ============================================

-- Add some sample notifications for testing
INSERT OR IGNORE INTO notifications (user_id, type, title, message, link, metadata, read)
SELECT 
  1,
  'new_application',
  'Nueva aplicación recibida',
  'María García ha aplicado a tu producto: HealthTrack AI',
  '/marketplace?tab=dashboard&product=1',
  '{"application_id": 1, "product_id": 1}',
  0
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT OR IGNORE INTO notifications (user_id, type, title, message, link, metadata, read)
SELECT 
  1,
  'application_approved',
  '¡Tu aplicación fue aprobada!',
  'Tu aplicación para "SaaS Dashboard Pro" ha sido aprobada',
  '/marketplace?tab=dashboard',
  '{"application_id": 2, "product_id": 2}',
  1
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1);
