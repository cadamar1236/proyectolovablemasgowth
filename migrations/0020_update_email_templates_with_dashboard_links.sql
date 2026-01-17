-- Actualizar plantillas de email para incluir enlaces al dashboard

-- LUNES - Ideas (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}}, es lunes de ideas.

Hoy tu objetivo es definir las hipótesis que quieres probar esta semana.

Recuerda, no te daremos ideas, tú eres el founder. Comparte con nosotros cuáles son tus hipótesis para entender en qué te enfocarás.

💡 ¿Qué hipótesis vas a validar esta semana?

{{dashboard_link}}'
WHERE day_of_week = 1 AND time_of_day = 'morning';

-- LUNES - Ideas (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

Cuéntanos las ideas que has definido hoy. 

📝 ¿Qué hipótesis vas a trabajar esta semana?

{{dashboard_link}}'
WHERE day_of_week = 1 AND time_of_day = 'evening';

-- MARTES - Build (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}},

Hoy es martes de construcción. Tu meta es empezar a crear el producto mínimo viable basado en tus ideas.

Ve paso a paso y simplifica. El objetivo es tener algo que puedas mostrar a usuarios reales.

🛠️ ¡Manos a la obra!

{{dashboard_link}}'
WHERE day_of_week = 2 AND time_of_day = 'morning';

-- MARTES - Build (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

¿Qué tal ha ido el avance hoy? Cuéntanos qué has construido o si necesitas ayuda para seguir adelante.

⚡ SI NO PUEDES CREAR TU PRODUCTO DINOS Y TE CONECTAMOS CON ALGUIEN QUE TE PUEDA AYUDAR

{{dashboard_link}}'
WHERE day_of_week = 2 AND time_of_day = 'evening';

-- MIÉRCOLES - Build & Medir (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}},

Es miércoles, sigue construyendo tu MVP. Hoy también empieza a hablar con usuarios para iterar más rápido.

El feedback real de usuarios es oro. ¡Sal a buscarlo!

🎯 Meta: Hablar con al menos 3 usuarios potenciales hoy.

{{dashboard_link}}'
WHERE day_of_week = 3 AND time_of_day = 'morning';

-- MIÉRCOLES - Build & Medir (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

Cuéntanos, ¿lograste hablar con alguien hoy? ¿Qué aprendiste al hablar con tus primeros usuarios?

{{#if last_week_users}}
📈 La semana pasada hablaste con {{last_week_users}} usuarios. Si quieres crecer un 10%, tienes que hablar con {{target_users}} esta semana.
{{/if}}

{{dashboard_link}}'
WHERE day_of_week = 3 AND time_of_day = 'evening';

-- JUEVES - Medición (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}},

Jueves: sigue iterando con más usuarios y recolecta datos. Queremos ver qué insights obtienes.

Cada conversación es una oportunidad de aprender algo nuevo sobre tu mercado.

🔍 ¡A por más feedback!

{{dashboard_link}}'
WHERE day_of_week = 4 AND time_of_day = 'morning';

-- JUEVES - Medición (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

¿Cuántas personas contactaste hoy y qué aprendiste de ellos?

📊 Comparte tus números y aprendizajes.

{{dashboard_link}}'
WHERE day_of_week = 4 AND time_of_day = 'evening';

-- VIERNES - Medición (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}},

Viernes: continúa el proceso de medir y aprender. Busca obtener más validación de tus usuarios.

Es el momento de consolidar todo lo que has aprendido esta semana.

💪 ¡Último empujón antes del fin de semana!

{{dashboard_link}}'
WHERE day_of_week = 5 AND time_of_day = 'morning';

-- VIERNES - Medición (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

¿Qué información nueva has conseguido hoy? Comparte tus aprendizajes y cómo piensas ajustar tu producto.

📝 Responde con tus insights del día.

{{dashboard_link}}'
WHERE day_of_week = 5 AND time_of_day = 'evening';

-- SÁBADO - Última iteración (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}},

Hoy es sábado, última oportunidad para iterar esta semana. Sigue obteniendo feedback.

Aprovecha el día para cerrar conversaciones pendientes y consolidar aprendizajes.

🔥 ¡Dale el último empujón!

{{dashboard_link}}'
WHERE day_of_week = 6 AND time_of_day = 'morning';

-- SÁBADO - Última iteración (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

Cuéntanos qué has aprendido hoy y cómo te sientes con tus resultados de la semana.

📊 ¿Cuántos usuarios contactaste en total esta semana?
💡 ¿Cuál fue tu mayor aprendizaje?

{{dashboard_link}}'
WHERE day_of_week = 6 AND time_of_day = 'evening';

-- DOMINGO - Reflexión (Mañana)
UPDATE astar_message_templates 
SET body_template = 'Buenos días {{name}},

Domingo es un día de descanso y reflexión. Piensa en lo que aprendiste esta semana.

Tómate un momento para revisar:
- ¿Qué funcionó bien?
- ¿Qué puedes mejorar?
- ¿Qué harás diferente la próxima semana?

🧘 Descansa y prepárate para una nueva semana.

{{dashboard_link}}'
WHERE day_of_week = 0 AND time_of_day = 'morning';

-- DOMINGO - Reflexión (Noche)
UPDATE astar_message_templates 
SET body_template = 'Buenas noches {{name}},

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

¡Felicidades a todos los que iteraron esta semana! 🚀

{{dashboard_link}}'
WHERE day_of_week = 0 AND time_of_day = 'evening';
