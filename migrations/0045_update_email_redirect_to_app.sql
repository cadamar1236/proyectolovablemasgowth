-- Migration: Update weekly email messages to redirect to app instead of email responses
-- Add dashboard buttons and create specific notifications for each email

-- ============================================
-- 🟡 LUNES — Ideas & Hipótesis (IDs 1, 2)
-- ============================================

-- Lunes Morning (8:00 AM) - ID 1
UPDATE astar_message_templates SET
    subject = '🟡 Lunes de Ideas — Define tus hipótesis',
    body_template = 'Buenos días {{name}},

Hoy es **lunes de ideas**.

Tu objetivo es definir las hipótesis que quieres probar esta semana.

No te daremos ideas—tú eres el founder. Pero queremos entender en qué te vas a enfocar.

💡 Esta noche a las 8PM te pediremos un update con tus hipótesis.

¡Que tengas un gran inicio de semana!

—ASTAR*',
    category = 'ideas',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 1;

-- Lunes Evening (8:00 PM) - ID 2
UPDATE astar_message_templates SET
    subject = '📝 Lunes — Update de hipótesis',
    body_template = 'Buenas noches {{name}},

Es hora de tu update de lunes:

📝 **Update de lunes**

1️⃣ ¿Cuáles son las 1–3 hipótesis que vas a probar esta semana?

2️⃣ ¿Qué comportamiento de usuario esperas ver si son correctas?

3️⃣ ¿Cómo sabrás que una hipótesis está validada? (señal concreta)

---
📊 **Trackea:** Velocity of Learning (calidad de hipótesis)

{{dashboard_link}}

Haz click arriba para compartir tus hipótesis y actualizar tu progreso.',
    category = 'ideas',
    expects_response = 1,
    response_prompt = '¿Cuáles son tus hipótesis para esta semana?'
WHERE id = 2;

-- ============================================
-- 🟠 MARTES — Build (MVP) (IDs 3, 4)
-- ============================================

-- Martes Morning (8:00 AM) - ID 3
UPDATE astar_message_templates SET
    subject = '🟠 Martes de Construcción — Avanza tu MVP',
    body_template = 'Buenos días {{name}},

Hoy es **martes de construcción**.

Tu objetivo es avanzar en el MVP para poder testear tus hipótesis.

Recuerda: el MVP más pequeño que valide tu hipótesis más importante.

🛠️ ¡Manos a la obra!

—ASTAR*',
    category = 'build',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 3;

-- Martes Evening (8:00 PM) - ID 4
UPDATE astar_message_templates SET
    subject = '🛠️ Martes — Update de construcción',
    body_template = 'Buenas noches {{name}},

Es hora de tu update de martes:

🛠️ **Update de martes**

1️⃣ ¿Qué parte del producto construiste hoy?

2️⃣ ¿Qué acción clave del usuario habilita esto?

3️⃣ ¿Un usuario real podría usarlo ya? (Sí / Más o menos / No)

---
📊 **Trackea:**
- Activation readiness
- Depth (core flow)

{{dashboard_link}}

Haz click arriba para compartir tu progreso de construcción.',
    category = 'build',
    expects_response = 1,
    response_prompt = '¿Qué construiste hoy y está listo para usuarios?'
WHERE id = 4;

-- ============================================
-- 🔵 MIÉRCOLES — Build + Medir (IDs 5, 6)
-- ============================================

-- Miércoles Morning (8:00 AM) - ID 5
UPDATE astar_message_templates SET
    subject = '🔵 Miércoles — Habla con usuarios',
    body_template = 'Buenos días {{name}},

Es **miércoles**.

El objetivo es hablar con usuarios y aprender rápido.

El feedback real de usuarios es oro. No asumas—pregunta.

🎯 Meta: Hablar con al menos 3 usuarios potenciales hoy.

—ASTAR*',
    category = 'measure',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 5;

-- Miércoles Evening (8:00 PM) - ID 6
UPDATE astar_message_templates SET
    subject = '💬 Miércoles — Update de conversaciones',
    body_template = 'Buenas noches {{name}},

Es hora de tu update de miércoles:

💬 **Update de miércoles**

1️⃣ ¿Con cuántos usuarios hablaste hoy?

2️⃣ ¿Cuántos usaron el producto?

3️⃣ ¿Cuál fue el aprendizaje más importante? (1 frase)

---
📊 **Trackea:**
- Velocity of Learning
- Early Depth signals

{{dashboard_link}}

Haz click arriba para compartir tus conversaciones con usuarios.',
    category = 'measure',
    expects_response = 1,
    response_prompt = '¿Con cuántos usuarios hablaste y qué aprendiste?'
WHERE id = 6;

-- ============================================
-- 🟣 JUEVES — Medición & Insights (IDs 7, 8)
-- ============================================

-- Jueves Morning (8:00 AM) - ID 7
UPDATE astar_message_templates SET
    subject = '🟣 Jueves — Observa comportamiento real',
    body_template = 'Buenos días {{name}},

Hoy toca observar **comportamiento real de usuarios** y recolectar datos.

No solo escuches lo que dicen—mira lo que hacen.

🔍 ¿Dónde se quedan atascados? ¿Qué repiten? ¿Qué ignoran?

—ASTAR*',
    category = 'measure',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 7;

-- Jueves Evening (8:00 PM) - ID 8
UPDATE astar_message_templates SET
    subject = '📊 Jueves — Update de comportamiento',
    body_template = 'Buenas noches {{name}},

Es hora de tu update de jueves:

📊 **Update de jueves**

1️⃣ ¿Qué acciones repitieron más los usuarios hoy?

2️⃣ ¿Dónde se quedaron atascados o abandonaron?

3️⃣ ¿Algún usuario pidió algo sin que tú lo sugirieras? (Sí / No + qué)

---
📊 **Trackea:**
- Depth of Usage
- Organic Pull (early)

{{dashboard_link}}

Haz click arriba para compartir tus observaciones de comportamiento.',
    category = 'measure',
    expects_response = 1,
    response_prompt = '¿Qué comportamientos observaste en tus usuarios?'
WHERE id = 8;

-- ============================================
-- 🟢 VIERNES — Aprender & Ajustar (IDs 9, 10)
-- ============================================

-- Viernes Morning (8:00 AM) - ID 9
UPDATE astar_message_templates SET
    subject = '🟢 Viernes — Cierra aprendizajes',
    body_template = 'Buenos días {{name}},

Viernes es para **cerrar aprendizajes** y decidir qué ajustar.

Revisa todo lo que aprendiste esta semana. ¿Qué hipótesis validaste? ¿Cuáles descartaste?

🔁 Es momento de iterar con lo aprendido.

—ASTAR*',
    category = 'learn',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 9;

-- Viernes Evening (8:00 PM) - ID 10
UPDATE astar_message_templates SET
    subject = '🔁 Viernes — Update de aprendizajes',
    body_template = 'Buenas noches {{name}},

Es hora de tu update de viernes:

🔁 **Update de viernes**

1️⃣ ¿Qué cambio hiciste esta semana gracias al feedback real?

2️⃣ ¿Qué hipótesis queda validada o descartada?

3️⃣ ¿Qué vas a probar diferente la próxima semana?

---
📊 **Trackea:**
- Learning velocity
- Iteration speed

{{dashboard_link}}

Haz click arriba para compartir tus aprendizajes y cambios.',
    category = 'learn',
    expects_response = 1,
    response_prompt = '¿Qué aprendiste y qué vas a cambiar?'
WHERE id = 10;

-- ============================================
-- 🟤 SÁBADO — Última iteración (IDs 11, 12)
-- ============================================

-- Sábado Morning (8:00 AM) - ID 11
UPDATE astar_message_templates SET
    subject = '🟤 Sábado — Última oportunidad de iterar',
    body_template = 'Buenos días {{name}},

**Última oportunidad** para iterar esta semana y cerrar feedback.

Si tienes conversaciones pendientes, ciérralas hoy. Si hay algo que ajustar, hazlo ahora.

⚡ El momentum es clave—no lo pierdas.

—ASTAR*',
    category = 'iterate',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 11;

-- Sábado Evening (8:00 PM) - ID 12
UPDATE astar_message_templates SET
    subject = '🧠 Sábado — Update final',
    body_template = 'Buenas noches {{name}},

Es hora de tu update de sábado:

🧠 **Update de sábado**

1️⃣ ¿Qué feedback cerraste hoy?

2️⃣ ¿Qué señal te deja más confiado (o preocupado)?

---
📊 **Trackea:**
- Signal strength
- Founder awareness

{{dashboard_link}}

Haz click arriba para compartir tu feedback final.',
    category = 'iterate',
    expects_response = 1,
    response_prompt = '¿Qué feedback cerraste y cómo te sientes?'
WHERE id = 12;

-- ============================================
-- ⚫ DOMINGO — Métricas, Reflexión & Ranking (IDs 13, 14)
-- ============================================

-- Domingo Morning (8:00 AM) - ID 13
UPDATE astar_message_templates SET
    subject = '⚫ Domingo — Reflexión semanal',
    body_template = 'Buenos días {{name}},

Domingo es para **reflexionar** y cerrar la semana.

Tómate un momento para pensar:
- ¿Qué funcionó?
- ¿Qué no funcionó?
- ¿Qué harás diferente?

🧘 Descansa, pero no pierdas el foco.

Esta noche te pediremos tu **Weekly Summary** con métricas.

—ASTAR*',
    category = 'reflect',
    expects_response = 0,
    response_prompt = NULL
WHERE id = 13;

-- Domingo Evening (8:00 PM) - ID 14 (WEEKLY SUMMARY)
UPDATE astar_message_templates SET
    subject = '🏁 Domingo — Weekly Summary',
    body_template = 'Buenas noches {{name}},

🏁 **Weekly Summary**

Responde con números aproximados:

**📊 MÉTRICAS**

1️⃣ Revenue generado esta semana (€):

2️⃣ Nuevos usuarios adquiridos:

3️⃣ Usuarios activos diarios promedio (últimos 7 días):

4️⃣ Usuarios que dejaron de usar el producto (churn):

5️⃣ Usuarios que llegaron al "aha moment":

**✅ EJECUCIÓN**

6️⃣ ¿Cuáles fueron tus 3 tareas clave esta semana?

7️⃣ ¿Cuál fue tu mayor aprendizaje? (1 frase)

---
📊 **Trackea:**
- Activation rate
- Depth
- Organic pull
- Ranking score

{{#rankings}}
---

🏆 **RANKING SEMANAL**

🥇 #1 - {{first_place.name}} - Score: {{first_place.score}}
🥈 #2 - {{second_place.name}} - Score: {{second_place.score}}
🥉 #3 - {{third_place.name}} - Score: {{third_place.score}}

📈 **Tu posición:** #{{user_rank}}
{{/rankings}}

{{dashboard_link}}

Haz click arriba para compartir tu Weekly Summary.',
    category = 'reflect',
    expects_response = 1,
    response_prompt = 'Comparte tus métricas y aprendizajes de la semana.'
WHERE id = 14;