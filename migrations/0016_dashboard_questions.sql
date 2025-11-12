-- Dashboard Questions table for weekly progress answers
CREATE TABLE IF NOT EXISTS dashboard_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  week_start DATE NOT NULL,
  launched BOOLEAN,
  weeks_to_launch INTEGER,
  users_talked INTEGER,
  users_learned TEXT,
  morale INTEGER,
  primary_metric_improved TEXT,
  biggest_obstacle TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_start),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_questions_user_id ON dashboard_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_questions_week_start ON dashboard_questions(week_start);
