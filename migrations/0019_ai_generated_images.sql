-- Tabla para almacenar imágenes generadas por IA (fal.ai)
CREATE TABLE IF NOT EXISTS ai_generated_images (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    image_type TEXT DEFAULT 'general', -- banner, post, ad, hero, thumbnail, etc.
    metadata TEXT, -- JSON con información adicional (dimensiones, modelo usado, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_images_user ON ai_generated_images(user_id);
CREATE INDEX idx_ai_images_status ON ai_generated_images(status);
CREATE INDEX idx_ai_images_created ON ai_generated_images(created_at DESC);
