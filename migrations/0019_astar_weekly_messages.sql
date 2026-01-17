-- ASTAR Weekly Messages System
-- Calendario semanal de mensajes para founders

-- Tabla de plantillas de mensajes semanales
CREATE TABLE IF NOT EXISTS astar_message_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Lunes, etc.
    time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'evening')), -- 8AM o 8PM
    subject TEXT NOT NULL,
    body_template TEXT NOT NULL,
    category TEXT NOT NULL, -- 'ideas', 'build', 'measure', 'reflect'
    expects_response INTEGER DEFAULT 1, -- Si espera respuesta del usuario
    response_prompt TEXT, -- Pregunta específica para el usuario
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Mensajes enviados a usuarios
CREATE TABLE IF NOT EXISTS astar_sent_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL, -- Número de semana del año
    year INTEGER NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
    email_id TEXT, -- ID de Resend para tracking
    opened_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES astar_message_templates(id),
    UNIQUE(user_id, template_id, week_number, year)
);

-- Respuestas de usuarios a los mensajes
CREATE TABLE IF NOT EXISTS astar_user_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sent_message_id INTEGER NOT NULL,
    response_text TEXT NOT NULL,
    response_type TEXT, -- 'hypothesis', 'progress', 'learning', 'metrics'
    extracted_data TEXT, -- JSON con datos extraídos (usuarios contactados, hipótesis, etc.)
    created_goal_id INTEGER, -- Si se creó un goal a partir de la respuesta
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sent_message_id) REFERENCES astar_sent_messages(id),
    FOREIGN KEY (created_goal_id) REFERENCES dashboard_goals(id)
);

-- Métricas semanales de startups (para ranking)
CREATE TABLE IF NOT EXISTS astar_weekly_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    users_contacted INTEGER DEFAULT 0,
    hypotheses_tested INTEGER DEFAULT 0,
    learnings_count INTEGER DEFAULT 0,
    response_rate REAL DEFAULT 0, -- % de mensajes respondidos
    iteration_score INTEGER DEFAULT 0, -- Puntuación calculada
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, week_number, year)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_sent_messages_user_week ON astar_sent_messages(user_id, week_number, year);
CREATE INDEX IF NOT EXISTS idx_user_responses_user ON astar_user_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_metrics_ranking ON astar_weekly_metrics(week_number, year, iteration_score DESC);

-- Insertar plantillas del calendario semanal
-- LUNES - Ideas
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(1, 'morning', '🚀 Lunes de Ideas - Define tus hipótesis', 
'Buenos días {{name}}, es lunes de ideas.

Hoy tu objetivo es definir las hipótesis que quieres probar esta semana.

Recuerda, no te daremos ideas, tú eres el founder. Comparte con nosotros cuáles son tus hipótesis para entender en qué te enfocarás.

💡 ¿Qué hipótesis vas a validar esta semana?

Responde a este email con tus hipótesis.',
'ideas', 1, '¿Cuáles son las hipótesis que quieres probar esta semana?');

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(1, 'evening', '🌙 Lunes - ¿Qué hipótesis definiste?',
'Buenas noches {{name}},

Cuéntanos las ideas que has definido hoy. 

📝 ¿Qué hipótesis vas a trabajar esta semana?

Responde con tus hipótesis definidas.',
'ideas', 1, '¿Qué hipótesis vas a trabajar esta semana?');

-- MARTES - Build
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(2, 'morning', '🔨 Martes de Construcción - Crea tu MVP',
'Buenos días {{name}},

Hoy es martes de construcción. Tu meta es empezar a crear el producto mínimo viable basado en tus ideas.

Ve paso a paso y simplifica. El objetivo es tener algo que puedas mostrar a usuarios reales.

🛠️ ¡Manos a la obra!',
'build', 0, NULL);

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(2, 'evening', '🌙 Martes - ¿Qué construiste hoy?',
'Buenas noches {{name}},

¿Qué tal ha ido el avance hoy? Cuéntanos qué has construido o si necesitas ayuda para seguir adelante.

⚡ SI NO PUEDES CREAR TU PRODUCTO DINOS Y TE CONECTAMOS CON ALGUIEN QUE TE PUEDA AYUDAR

Responde con tu progreso del día.',
'build', 1, '¿Qué has construido hoy? ¿Necesitas ayuda?');

-- MIÉRCOLES - Build & Medir
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(3, 'morning', '📊 Miércoles - Build & Habla con Usuarios',
'Buenos días {{name}},

Es miércoles, sigue construyendo tu MVP. Hoy también empieza a hablar con usuarios para iterar más rápido.

El feedback real de usuarios es oro. ¡Sal a buscarlo!

🎯 Meta: Hablar con al menos 3 usuarios potenciales hoy.',
'measure', 0, NULL);

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(3, 'evening', '🌙 Miércoles - ¿Con quién hablaste?',
'Buenas noches {{name}},

Cuéntanos, ¿lograste hablar con alguien hoy? ¿Qué aprendiste al hablar con tus primeros usuarios?

{{#if last_week_users}}
📈 La semana pasada hablaste con {{last_week_users}} usuarios. Si quieres crecer un 10%, tienes que hablar con {{target_users}} esta semana.
{{/if}}

Responde con el número de usuarios y tus aprendizajes.',
'measure', 1, '¿Con cuántos usuarios hablaste y qué aprendiste?');

-- JUEVES - Medición
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(4, 'morning', '📈 Jueves - Sigue Iterando',
'Buenos días {{name}},

Jueves: sigue iterando con más usuarios y recolecta datos. Queremos ver qué insights obtienes.

Cada conversación es una oportunidad de aprender algo nuevo sobre tu mercado.

🔍 ¡A por más feedback!',
'measure', 0, NULL);

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(4, 'evening', '🌙 Jueves - Tus contactos del día',
'Buenas noches {{name}},

¿Cuántas personas contactaste hoy y qué aprendiste de ellos?

📊 Comparte tus números y aprendizajes.',
'measure', 1, '¿Cuántas personas contactaste hoy y qué aprendiste?');

-- VIERNES - Medición
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(5, 'morning', '🎯 Viernes - Mide y Aprende',
'Buenos días {{name}},

Viernes: continúa el proceso de medir y aprender. Busca obtener más validación de tus usuarios.

Es el momento de consolidar todo lo que has aprendido esta semana.

💪 ¡Último empujón antes del fin de semana!',
'measure', 0, NULL);

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(5, 'evening', '🌙 Viernes - Comparte tus aprendizajes',
'Buenas noches {{name}},

¿Qué información nueva has conseguido hoy? Comparte tus aprendizajes y cómo piensas ajustar tu producto.

📝 Responde con tus insights del día.',
'measure', 1, '¿Qué aprendizajes nuevos tienes hoy?');

-- SÁBADO - Última iteración
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(6, 'morning', '⚡ Sábado - Última Iteración',
'Buenos días {{name}},

Hoy es sábado, última oportunidad para iterar esta semana. Sigue obteniendo feedback.

Aprovecha el día para cerrar conversaciones pendientes y consolidar aprendizajes.

🔥 ¡Dale el último empujón!',
'measure', 0, NULL);

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(6, 'evening', '🌙 Sábado - Resultados de la semana',
'Buenas noches {{name}},

Cuéntanos qué has aprendido hoy y cómo te sientes con tus resultados de la semana.

📊 ¿Cuántos usuarios contactaste en total esta semana?
💡 ¿Cuál fue tu mayor aprendizaje?

Responde con tu resumen semanal.',
'measure', 1, '¿Cómo te fue esta semana? Comparte tus números y aprendizajes.');

-- DOMINGO - Reflexión
INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(0, 'morning', '☀️ Domingo - Día de Reflexión',
'Buenos días {{name}},

Domingo es un día de descanso y reflexión. Piensa en lo que aprendiste esta semana.

Tómate un momento para revisar:
- ¿Qué funcionó bien?
- ¿Qué puedes mejorar?
- ¿Qué harás diferente la próxima semana?

🧘 Descansa y prepárate para una nueva semana.',
'reflect', 0, NULL);

INSERT INTO astar_message_templates (day_of_week, time_of_day, subject, body_template, category, expects_response, response_prompt) VALUES
(0, 'evening', '🏆 Domingo - Ranking Semanal ASTAR',
'Buenas noches {{name}},

🎉 ¡Es hora de anunciar los resultados de la semana!

{{#rankings}}
🥇 **#1 - {{first_place.name}}** - {{first_place.product}}
   Usuarios contactados: {{first_place.users}} | Score: {{first_place.score}}
   👉 Prueba su producto: {{first_place.url}}

🥈 **#2 - {{second_place.name}}** - {{second_place.product}}
   Usuarios contactados: {{second_place.users}} | Score: {{second_place.score}}
   👉 Prueba su producto: {{second_place.url}}

🥉 **#3 - {{third_place.name}}** - {{third_place.product}}
   Usuarios contactados: {{third_place.users}} | Score: {{third_place.score}}
   👉 Prueba su producto: {{third_place.url}}
{{/rankings}}

📈 **Tu posición esta semana:** #{{user_rank}}
   Usuarios contactados: {{user_total_users}}
   Score de iteración: {{user_score}}

💬 Cuéntanos: ¿Cuáles fueron tus mayores aprendizajes de la semana?

¡Felicidades a todos los que iteraron esta semana! 🚀',
'reflect', 1, '¿Cuáles fueron tus mayores aprendizajes de la semana?');
