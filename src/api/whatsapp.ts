/**
 * WhatsApp Webhook API for Twilio
 * Sistema de agentes para gestión de goals vía WhatsApp
 * Compatible con Cloudflare Workers
 */

import { Hono, type Context } from 'hono';
import type { Bindings } from '../types';

// Tipo de contexto para las rutas
type AppContext = Context<{ Bindings: Bindings }>;

// Tipo para WhatsApp User
interface WhatsAppUser {
  id: number;
  phone_number: string;
  user_id: number | null;
  email: string | null;
  auth_token: string | null;
  is_verified: number;
  pending_action: string | null;
  pending_data: string | null;
}

// Tipo de Score para leaderboard
interface UserScore {
  userId: number;
  name: string;
  completed: number;
  total: number;
  score: number;
}

// Tipo para Goals
interface Goal {
  id: number;
  user_id: number;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Tipo para User
interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
}

const whatsapp = new Hono<{ Bindings: Bindings }>();

// ============================================
// CLASIFICADOR DE INTENCIONES
// ============================================

type Intent = 'LIST_GOALS' | 'ADD_GOAL' | 'COMPLETE_GOAL' | 'ADD_METRIC' | 'VIEW_LEADERBOARD' | 'HELP' | 'STATUS' | 'LOGIN' | 'UNKNOWN';

function classifyIntent(message: string): Intent {
  const msg = message.toLowerCase().trim();

  if (/^(mis\s+)?goals?$|^ver\s+goals?$|^objetivos?$|^lista/i.test(msg)) return 'LIST_GOALS';
  if (/^nuevo\s+goal|^crear\s+goal|^añadir\s+goal|^agregar/i.test(msg)) return 'ADD_GOAL';
  if (/^completar|^terminar|^hecho|^completé|^marcar/i.test(msg)) return 'COMPLETE_GOAL';
  if (/^usuarios?\s+\d|^revenue\s+\d|^ingresos?\s+\d|^métricas?$|^mis\s+métricas?$/i.test(msg)) return 'ADD_METRIC';
  if (/^leaderboard$|^ranking$|^posición$|^top/i.test(msg)) return 'VIEW_LEADERBOARD';
  if (/^ayuda$|^help$|^\?$|^comandos$/i.test(msg)) return 'HELP';
  if (/^estado$|^status$|^mi\s+cuenta$/i.test(msg)) return 'STATUS';
  if (/^login$|^entrar$|^iniciar\s+sesión$/i.test(msg)) return 'LOGIN';

  return 'UNKNOWN';
}

// ============================================
// MENSAJES
// ============================================

const MESSAGES = {
  welcome: `🎯 *¡Bienvenido a LovableGrowth!*

Soy tu asistente de productividad. Te ayudaré a:
• 📋 Gestionar tus goals
• 📊 Registrar métricas
• 🏆 Competir en el leaderboard

Para comenzar, necesito vincular tu cuenta.

📧 *Envía tu email* registrado en LovableGrowth:`,

  help: `📚 *COMANDOS DISPONIBLES:*

📋 *Goals:*
• mis goals - ver tus goals
• nuevo goal [descripción] - crear goal
• completar [número] - marcar completado

📊 *Métricas:*
• mis métricas - ver historial
• usuarios [número] - registrar usuarios
• revenue [número] - registrar ingresos

🏆 *Ranking:*
• leaderboard - ver posiciones

⚙️ *Cuenta:*
• estado - ver tu estado
• ayuda - ver este mensaje`,

  unknown: `🤔 No entendí tu mensaje.

Prueba con:
• 'mis goals' - ver goals
• 'completar [#]' - completar goal
• 'nuevo goal [desc]' - crear goal
• 'leaderboard' - ver ranking
• 'ayuda' - ver opciones`,

  notLinked: `⚠️ Tu cuenta no está vinculada.

Envía tu email de LovableGrowth para vincularla.`,

  loginRequired: `🔐 Primero necesito vincular tu cuenta.

📧 Envía tu email registrado en LovableGrowth:`,
};

// ============================================
// TWILIO - ENVIAR MENSAJE
// ============================================

async function sendTwilioMessage(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<boolean> {
  try {
    // Base64 encoding for Basic Auth (works in Cloudflare Workers)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${accountSid}:${authToken}`);
    const base64 = btoa(String.fromCharCode(...data));
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      // eslint-disable-next-line no-console
      console.error('Twilio API error:', errorData);
    }

    return response.ok;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Twilio error:', e);
    return false;
  }
}

// Responder usando TwiML (más eficiente para sandbox)
function twimlResponse(message: string): Response {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
  
  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================
// HANDLERS DE COMANDOS
// ============================================

async function handleListGoals(db: Bindings['DB'], userId: number): Promise<string> {
  const { results } = await db.prepare(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(userId).all<Goal>();

  if (!results || results.length === 0) {
    return `📋 *TUS GOALS*

No tienes goals aún.

Para crear uno:
> nuevo goal [descripción]

Ejemplo:
> nuevo goal Lanzar MVP esta semana`;
  }

  const goalsList = results.map((goal: Goal, i: number) => {
    const icon = goal.status === 'completed' ? '✅' : '⏳';
    return `${i + 1}. ${icon} ${goal.description}`;
  }).join('\n');

  const completed = results.filter((g: Goal) => g.status === 'completed').length;

  return `📋 *TUS GOALS* (${completed}/${results.length} completados)

${goalsList}

_Para completar: completar [número]_
_Para añadir: nuevo goal [desc]_`;
}

async function handleAddGoal(db: Bindings['DB'], userId: number, description: string): Promise<string> {
  if (!description || description.length < 3) {
    return `❌ Describe tu goal.

Ejemplo:
> nuevo goal Conseguir 100 usuarios`;
  }

  await db.prepare(
    'INSERT INTO goals (user_id, description, status) VALUES (?, ?, ?)'
  ).bind(userId, description, 'in_progress').run();

  return `✅ *Goal creado:*

"${description}"

¡Mucho éxito! 🚀`;
}

async function handleCompleteGoal(db: Bindings['DB'], userId: number, goalNumber: number): Promise<string> {
  const { results } = await db.prepare(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(userId).all<Goal>();

  if (!results || goalNumber < 1 || goalNumber > results.length) {
    return `❌ Número de goal inválido.

Escribe 'mis goals' para ver la lista.`;
  }

  const goal = results[goalNumber - 1];

  await db.prepare(
    'UPDATE goals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind('completed', goal.id).run();

  // Actualizar score
  await updateUserScore(db, userId);

  return `🎉 *¡Goal completado!*

"${goal.description}"

Tu progreso ha sido actualizado en el leaderboard.

_Escribe 'leaderboard' para ver tu posición._`;
}

async function handleAddMetric(db: Bindings['DB'], userId: number, message: string): Promise<string> {
  // Detectar tipo de métrica
  let metricType: string | null = null;
  let value = 0;

  const usersMatch = message.match(/usuarios?\s+(\d+)/i);
  const revenueMatch = message.match(/(?:revenue|ingresos?)\s+(\d+(?:\.\d+)?)/i);

  if (usersMatch) {
    metricType = 'users';
    value = parseInt(usersMatch[1], 10);
  } else if (revenueMatch) {
    metricType = 'revenue';
    value = parseFloat(revenueMatch[1]);
  }

  if (!metricType) {
    return `📊 *REGISTRAR MÉTRICA*

Formatos válidos:
• usuarios [número] - ej: usuarios 150
• revenue [número] - ej: revenue 5000

¿Cuántos usuarios o ingresos quieres registrar?`;
  }

  // Insertar en weekly_updates si existe, o en user_metrics
  try {
    await db.prepare(
      `INSERT INTO user_metrics (user_id, metric_type, value, date) 
       VALUES (?, ?, ?, date('now'))`
    ).bind(userId, metricType, value).run();

    const emoji = metricType === 'users' ? '👥' : '💰';
    const label = metricType === 'users' ? 'usuarios' : 'revenue';

    return `${emoji} *Métrica registrada:*

${label}: ${value.toLocaleString()}

_Escribe 'mis métricas' para ver tu historial._`;
  } catch {
    return `❌ Error al registrar la métrica. Intenta de nuevo.`;
  }
}

async function handleViewLeaderboard(db: Bindings['DB'], userId: number): Promise<string> {
  // Obtener scores del leaderboard
  const { results } = await db.prepare(`
    SELECT 
      u.id as userId,
      u.name,
      COALESCE(g.completed, 0) as completed,
      COALESCE(g.total, 0) as total,
      COALESCE(g.completed, 0) * 10 as score
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM goals
      GROUP BY user_id
    ) g ON u.id = g.user_id
    ORDER BY score DESC
    LIMIT 10
  `).all<UserScore>();

  if (!results || results.length === 0) {
    return `🏆 *LEADERBOARD*

Aún no hay participantes.

¡Sé el primero en completar goals!`;
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  let myPosition = 0;
  const leaderboard = results.map((user: UserScore, i: number) => {
    if (user.userId === userId) myPosition = i + 1;
    return `${medals[i]} ${user.name || 'Anónimo'} - ${user.completed} goals (${user.score} pts)`;
  }).join('\n');

  const positionMsg = myPosition > 0 
    ? `\n\n📍 *Tu posición:* #${myPosition}` 
    : '\n\n_Completa goals para entrar al ranking_';

  return `🏆 *LEADERBOARD TOP 10*

${leaderboard}${positionMsg}`;
}

async function handleStatus(db: Bindings['DB'], userId: number, phone: string): Promise<string> {
  // Obtener info del usuario
  const user = await db.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first<User>();

  const { results: goals } = await db.prepare(
    'SELECT status, COUNT(*) as count FROM goals WHERE user_id = ? GROUP BY status'
  ).bind(userId).all<{status: string; count: number}>();

  const completed = goals?.find((g: {status: string; count: number}) => g.status === 'completed')?.count || 0;
  const inProgress = goals?.find((g: {status: string; count: number}) => g.status === 'in_progress')?.count || 0;

  return `👤 *TU ESTADO*

📧 Email: ${user?.email || 'No vinculado'}
📱 WhatsApp: ${phone}

📊 *Progreso:*
• Goals completados: ${completed}
• Goals en progreso: ${inProgress}
• Puntos: ${completed * 10}

_Escribe 'mis goals' para ver detalles._`;
}

// ============================================
// ACTUALIZAR SCORE
// ============================================

async function updateUserScore(db: Bindings['DB'], userId: number): Promise<void> {
  // El score se calcula en tiempo real desde goals
  // Este método podría actualizar una tabla de cache si fuera necesario
  
  // Por ahora, simplemente actualizamos achievements si hay logros
  const { results } = await db.prepare(`
    SELECT COUNT(*) as completed FROM goals WHERE user_id = ? AND status = 'completed'
  `).bind(userId).all<{completed: number}>();

  const completed = results?.[0]?.completed || 0;

  // Achievements milestones
  const milestones = [
    { count: 1, name: 'First Goal', description: 'Completaste tu primer goal' },
    { count: 5, name: 'Getting Started', description: 'Completaste 5 goals' },
    { count: 10, name: 'Achiever', description: 'Completaste 10 goals' },
    { count: 25, name: 'Goal Master', description: 'Completaste 25 goals' },
    { count: 50, name: 'Legend', description: 'Completaste 50 goals' },
  ];

  for (const milestone of milestones) {
    if (completed >= milestone.count) {
      // Verificar si ya tiene el achievement
      const existing = await db.prepare(
        'SELECT id FROM achievements WHERE user_id = ? AND name = ?'
      ).bind(userId, milestone.name).first();

      if (!existing) {
        await db.prepare(
          'INSERT INTO achievements (user_id, name, description, icon, unlocked_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(userId, milestone.name, milestone.description, '🏆').run();
      }
    }
  }
}

// ============================================
// FLUJO DE AUTENTICACIÓN
// ============================================

async function handleEmailInput(db: Bindings['DB'], phone: string, email: string): Promise<string> {
  // Buscar usuario por email
  const user = await db.prepare(
    'SELECT id, email, name FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first<User>();

  if (!user) {
    return `❌ No encontré una cuenta con ese email.

Verifica que esté bien escrito o regístrate en lovablegrowth.com primero.

📧 Intenta de nuevo:`;
  }

  // Vincular el teléfono con el usuario
  await db.prepare(`
    INSERT INTO whatsapp_users (phone_number, user_id, email, is_verified) 
    VALUES (?, ?, ?, 1)
    ON CONFLICT(phone_number) DO UPDATE SET user_id = ?, email = ?, is_verified = 1
  `).bind(phone, user.id, user.email, user.id, user.email).run();

  return `✅ *¡Cuenta vinculada!*

Hola ${user.name || 'usuario'} 👋

Tu WhatsApp está ahora conectado a tu cuenta de LovableGrowth.

${MESSAGES.help}`;
}

// ============================================
// WEBHOOK PRINCIPAL
// ============================================

whatsapp.post('/webhook', async (c: AppContext) => {
  try {
    const formData = await c.req.parseBody();
    const from = String(formData['From'] || '');
    const body = String(formData['Body'] || '').trim();

    // eslint-disable-next-line no-console
    console.log(`📨 WhatsApp de ${from}: ${body}`);

    // Obtener o crear usuario de WhatsApp
    let waUser = await c.env.DB.prepare(
      'SELECT * FROM whatsapp_users WHERE phone_number = ?'
    ).bind(from).first() as WhatsAppUser | null;

    // Si no existe, crear registro y pedir vinculación
    if (!waUser) {
      await c.env.DB.prepare(
        'INSERT INTO whatsapp_users (phone_number, is_verified) VALUES (?, 0)'
      ).bind(from).run();

      return twimlResponse(MESSAGES.welcome);
    }

    // Si no está verificado, esperar email
    if (!waUser.is_verified || !waUser.user_id) {
      // Verificar si el mensaje parece un email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(body)) {
        const response = await handleEmailInput(c.env.DB, from, body);
        return twimlResponse(response);
      }

      return twimlResponse(MESSAGES.loginRequired);
    }

    // Usuario verificado - procesar comando
    const intent = classifyIntent(body);
    let response: string;

    switch (intent) {
      case 'LIST_GOALS':
        response = await handleListGoals(c.env.DB, waUser.user_id);
        break;

      case 'ADD_GOAL': {
        const description = body.replace(/^(nuevo|crear|añadir|agregar)\s+goal\s*/i, '').trim();
        response = await handleAddGoal(c.env.DB, waUser.user_id, description);
        break;
      }

      case 'COMPLETE_GOAL': {
        const match = body.match(/\d+/);
        const goalNumber = match ? parseInt(match[0], 10) : 0;
        response = await handleCompleteGoal(c.env.DB, waUser.user_id, goalNumber);
        break;
      }

      case 'ADD_METRIC':
        response = await handleAddMetric(c.env.DB, waUser.user_id, body);
        break;

      case 'VIEW_LEADERBOARD':
        response = await handleViewLeaderboard(c.env.DB, waUser.user_id);
        break;

      case 'STATUS':
        response = await handleStatus(c.env.DB, waUser.user_id, from);
        break;

      case 'HELP':
        response = MESSAGES.help;
        break;

      case 'LOGIN':
        response = `Ya estás conectado ✅

Tu cuenta está vinculada correctamente.

${MESSAGES.help}`;
        break;

      default:
        response = MESSAGES.unknown;
    }

    return twimlResponse(response);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Webhook error:', error);
    return twimlResponse('❌ Error interno. Intenta de nuevo.');
  }
});

// ============================================
// VERIFICACIÓN DE WEBHOOK (GET)
// ============================================

whatsapp.get('/webhook', async (c: AppContext) => {
  // Twilio no requiere verificación GET, pero lo dejamos para debug
  return c.json({
    status: 'ok',
    message: 'WhatsApp webhook activo',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ENDPOINT DE INFO
// ============================================

whatsapp.get('/info', async (c: AppContext) => {
  const twilioNumber = c.env.TWILIO_WHATSAPP_NUMBER || 'No configurado';
  const sandboxCode = c.env.TWILIO_SANDBOX_CODE || 'No configurado';

  return c.json({
    service: 'LovableGrowth WhatsApp Agent',
    status: 'active',
    twilio_number: twilioNumber,
    sandbox_code: sandboxCode,
    instructions: {
      step1: 'Guarda el número en tus contactos',
      step2: `Envía "${sandboxCode}" para activar el sandbox`,
      step3: 'Escribe "ayuda" para ver comandos'
    },
    webhook_url: `${c.req.url.replace('/info', '/webhook')}`
  });
});

// ============================================
// ENDPOINT PARA ENVIAR MENSAJE (interno)
// ============================================

whatsapp.post('/send', async (c: AppContext) => {
  // Este endpoint permite enviar mensajes desde el backend
  // Requiere autenticación (API key)
  const apiKey = c.req.header('X-API-Key');
  const expectedKey = c.env.INTERNAL_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json() as {to: string; message: string};
  const { to, message } = body;

  if (!to || !message) {
    return c.json({ error: 'Missing to or message' }, 400);
  }

  const twilioNumber = c.env.TWILIO_WHATSAPP_NUMBER || '';
  const accountSid = c.env.TWILIO_ACCOUNT_SID || '';
  const authToken = c.env.TWILIO_AUTH_TOKEN || '';

  const success = await sendTwilioMessage(
    accountSid,
    authToken,
    twilioNumber,
    to,
    message
  );

  return c.json({ success });
});

export default whatsapp;
