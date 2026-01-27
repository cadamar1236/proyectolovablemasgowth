-- Migration: Extend goals system to capture weekly structured updates
-- Integra hipótesis, builds, conversaciones, insights y traction en goals

-- ============================================
-- 1. EXTENDER GOALS CON NUEVOS CAMPOS
-- ============================================

-- Agregar campos específicos para hipótesis (Monday)
ALTER TABLE goals ADD COLUMN hypothesis_expected_behavior TEXT; -- Comportamiento esperado si la hipótesis es correcta
ALTER TABLE goals ADD COLUMN hypothesis_validation_signal TEXT; -- Señal concreta de validación
ALTER TABLE goals ADD COLUMN hypothesis_status TEXT DEFAULT 'testing' CHECK (hypothesis_status IN ('testing', 'validated', 'invalidated', 'paused'));
ALTER TABLE goals ADD COLUMN hypothesis_validated_at DATETIME;

-- Agregar campos específicos para builds (Tuesday)
ALTER TABLE goals ADD COLUMN build_tech_stack TEXT; -- JSON array de tecnologías usadas
ALTER TABLE goals ADD COLUMN build_hours_spent REAL; -- Horas invertidas
ALTER TABLE goals ADD COLUMN build_hypothesis_id INTEGER REFERENCES goals(id); -- Link a la hipótesis que testea

-- Agregar campos específicos para user learning (Wednesday)
ALTER TABLE goals ADD COLUMN users_spoken INTEGER DEFAULT 0; -- Usuarios con los que habló
ALTER TABLE goals ADD COLUMN users_used_product INTEGER DEFAULT 0; -- Usuarios que usaron el producto
ALTER TABLE goals ADD COLUMN key_learning TEXT; -- Aprendizaje principal (1 frase)

-- Agregar campos específicos para insights (Thursday)
ALTER TABLE goals ADD COLUMN users_interacted INTEGER DEFAULT 0; -- Usuarios que interactuaron
ALTER TABLE goals ADD COLUMN repeated_actions TEXT; -- Acciones que repitieron los usuarios
ALTER TABLE goals ADD COLUMN drop_off_points TEXT; -- Dónde abandonaron
ALTER TABLE goals ADD COLUMN key_insight TEXT; -- Insight principal (1 frase)

-- Agregar campos para tracking semanal
ALTER TABLE goals ADD COLUMN week_number INTEGER; -- Semana del año
ALTER TABLE goals ADD COLUMN year_number INTEGER; -- Año

-- ============================================
-- 2. TABLA DE MÉTRICAS SEMANALES DE TRACTION (Friday)
-- ============================================

CREATE TABLE IF NOT EXISTS goal_weekly_traction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    goal_id INTEGER, -- Opcional: vincular a un goal específico
    project_id INTEGER, -- Opcional: vincular a un proyecto
    
    -- Métricas del viernes
    revenue_amount REAL DEFAULT 0, -- Revenue en EUR
    new_users INTEGER DEFAULT 0, -- Nuevos usuarios adquiridos
    active_users INTEGER DEFAULT 0, -- Usuarios activos esta semana
    churned_users INTEGER DEFAULT 0, -- Usuarios que churnearon
    strongest_signal TEXT, -- Señal de tracción más fuerte (1 frase)
    
    -- Tracking
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    UNIQUE(user_id, week_number, year)
);

CREATE INDEX IF NOT EXISTS idx_goal_weekly_traction_user ON goal_weekly_traction(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_weekly_traction_week ON goal_weekly_traction(week_number, year);

-- ============================================
-- 3. TABLA DE HISTORIAL DE HIPÓTESIS
-- ============================================

-- Para trackear el progreso de hipótesis a lo largo del tiempo
CREATE TABLE IF NOT EXISTS goal_hypothesis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL, -- El goal tipo hipótesis
    user_id INTEGER NOT NULL,
    
    -- Cambio de estado
    old_status TEXT,
    new_status TEXT,
    notes TEXT, -- Notas sobre el cambio
    
    -- Métricas en el momento del cambio
    users_tested INTEGER DEFAULT 0,
    success_rate REAL, -- Porcentaje de éxito
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_goal_hypothesis_history_goal ON goal_hypothesis_history(goal_id);

-- ============================================
-- 4. ACTUALIZAR CATEGORÍAS VÁLIDAS
-- ============================================
-- Las categorías ahora incluyen:
-- 'hypothesis' - Hipótesis a validar (Lunes)
-- 'build' - Features/builds construidos (Martes)  
-- 'user_learning' - Aprendizajes de usuarios (Miércoles)
-- 'insight' - Insights de comportamiento (Jueves)
-- 'traction' - Métricas de tracción (Viernes)
-- 'product', 'marketing', 'sales', 'growth', 'general' - Existentes

-- Nota: SQLite no soporta CHECK constraints con ALTER TABLE,
-- pero podemos validar en la aplicación
