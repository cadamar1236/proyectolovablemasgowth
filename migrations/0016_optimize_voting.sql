-- Optimización de votación para soportar alta concurrencia
-- Reduce de 2 writes a 1 write por voto usando triggers

-- Crear trigger que actualiza automáticamente el rating del proyecto cuando se vota
DROP TRIGGER IF EXISTS update_project_rating_on_vote;

CREATE TRIGGER update_project_rating_on_vote
AFTER INSERT ON project_votes
BEGIN
  UPDATE projects
  SET
    rating_average = (
      SELECT AVG(rating)
      FROM project_votes
      WHERE project_id = NEW.project_id
    ),
    votes_count = (
      SELECT COUNT(*)
      FROM project_votes
      WHERE project_id = NEW.project_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.project_id;
END;

-- Trigger para actualizar cuando se modifica un voto existente
DROP TRIGGER IF EXISTS update_project_rating_on_vote_update;

CREATE TRIGGER update_project_rating_on_vote_update
AFTER UPDATE ON project_votes
BEGIN
  UPDATE projects
  SET
    rating_average = (
      SELECT AVG(rating)
      FROM project_votes
      WHERE project_id = NEW.project_id
    ),
    votes_count = (
      SELECT COUNT(*)
      FROM project_votes
      WHERE project_id = NEW.project_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.project_id;
END;

-- Índice compuesto para optimizar la query de promedio
CREATE INDEX IF NOT EXISTS idx_project_votes_project_rating 
ON project_votes(project_id, rating);
