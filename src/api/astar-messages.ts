/**
 * ASTAR Weekly Messages API
 * Sistema de emails semanales para founders con Resend
 * Incluye: envío programado, respuestas, y ranking semanal
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const astarMessages = new Hono<{ Bindings: Bindings }>();

// Enable CORS
astarMessages.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposeHeaders: ['Set-Cookie']
}));

const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// Tipos
interface MessageTemplate {
  id: number;
  day_of_week: number;
  time_of_day: 'morning' | 'evening';
  subject: string;
  body_template: string;
  category: string;
  expects_response: number;
  response_prompt: string | null;
}

interface SentMessage {
  id: number;
  user_id: number;
  template_id: number;
  week_number: number;
  year: number;
  sent_at: string;
  email_id: string | null;
}

interface UserResponse {
  id: number;
  user_id: number;
  sent_message_id: number;
  response_text: string;
  response_type: string;
  extracted_data: string;
  created_goal_id: number | null;
}

interface WeeklyMetrics {
  id: number;
  user_id: number;
  week_number: number;
  year: number;
  users_contacted: number;
  hypotheses_tested: number;
  learnings_count: number;
  response_rate: number;
  iteration_score: number;
}

interface User {
  id: number;
  email: string;
  name: string;
}

// Middleware de autenticación
async function requireAuth(c: any, next: any) {
  try {
    // Intentar obtener token desde Authorization header
    let token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    // Si no está en el header, intentar desde cookies
    if (!token) {
      const cookieHeader = c.req.header('Cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/authToken=([^;]+)/);
        if (match) token = match[1];
      }
    }
    
    if (!token) {
      console.error('[AUTH] No token found in Authorization header or cookies');
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET || JWT_SECRET) as any;
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    await next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// ============================================
// RESEND EMAIL INTEGRATION
// ============================================

async function sendEmailWithResend(
  apiKey: string,
  to: string,
  subject: string,
  htmlBody: string,
  fromEmail: string = 'ASTAR <astar@aihelpstudy.com>'
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return { success: false, error };
    }

    const data = await response.json() as { id: string };
    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Simple variable replacement {{variable}}
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
  
  // Handle conditionals {{#if variable}}...{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    return data[varName] ? content : '';
  });
  
  return result;
}

function createDashboardButtonHtml(category: string = 'general'): string {
  // Todos los botones ahora llevan al chat con contexto específico
  let dashboardUrl = 'https://astarlabshub.com/marketplace?tab=traction';
  let buttonText = '💬 Responder en el Chat';
  let chatContext = '';
  
  switch(category.toLowerCase()) {
    case 'ideas':
    case 'hypothesis':
      chatContext = 'hipotesis';
      buttonText = '💡 Compartir mis Hipótesis';
      break;
    case 'build':
    case 'construction':
      chatContext = 'construccion';
      buttonText = '🛠️ Contar mi Progreso';
      break;
    case 'measure':
    case 'measurement':
    case 'feedback':
      chatContext = 'metricas';
      buttonText = '📊 Compartir mis Números';
      break;
    case 'reflection':
    case 'weekly_review':
      chatContext = 'reflexion';
      buttonText = '🤔 Compartir Aprendizajes';
      break;
    default:
      chatContext = 'general';
      buttonText = '💬 Responder en el Chat';
  }
  
  // Todos van al chat con el contexto específico
  dashboardUrl = `https://astarlabshub.com/marketplace?tab=traction&chat=${chatContext}`;
  
  return `
<div style="text-align: center; margin: 32px 0;">
  <a href="${dashboardUrl}" 
     style="display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;">
    ${buttonText}
  </a>
</div>
<p style="text-align: center; color: #666; font-size: 14px; margin-top: 16px;">
  El chat automáticamente convertirá tu respuesta en objetivos, métricas o actualizaciones
</p>`;
}

function convertToHtml(text: string, category: string = 'general'): string {
  // Primero reemplazar el placeholder de dashboard_link con un marcador temporal
  const BUTTON_MARKER = '___DASHBOARD_BUTTON___';
  const textWithMarker = text.replace(/{{dashboard_link}}/g, BUTTON_MARKER);
  
  // Procesar el texto normalmente
  let html = textWithMarker
    .split('\n\n')
    .map(p => {
      // Si el párrafo es solo el marcador, no lo envolver en <p>
      if (p.trim() === BUTTON_MARKER) {
        return BUTTON_MARKER;
      }
      return `<p style="margin: 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/👉/g, '→');
  
  // Finalmente reemplazar el marcador con el botón HTML real usando la categoría
  const dashboardButton = createDashboardButtonHtml(category);
  return html.replace(new RegExp(BUTTON_MARKER, 'g'), dashboardButton);
}

function extractMetricsFromResponse(text: string, category: string): Record<string, any> {
  const extracted: Record<string, any> = {};
  
  // Extraer números de usuarios contactados
  const userMatches = text.match(/(\d+)\s*(usuarios?|personas?|gente|people|users?)/i);
  if (userMatches) {
    extracted.users_contacted = parseInt(userMatches[1]);
  }
  
  // Extraer hipótesis (contar bullets o líneas que parecen hipótesis)
  const hypothesisMatches = text.match(/hipótesis|hypothesis|probar|validar|test/gi);
  if (hypothesisMatches) {
    extracted.hypotheses_count = hypothesisMatches.length;
  }
  
  // Detectar aprendizajes
  const learningMatches = text.match(/aprendí|learned|descubrí|discovered|insight/gi);
  if (learningMatches) {
    extracted.learnings_count = learningMatches.length;
  }
  
  return extracted;
}

async function calculateIterationScore(
  db: any,
  userId: number,
  weekNumber: number,
  year: number
): Promise<number> {
  // Obtener métricas de la semana
  const metrics = await db.prepare(`
    SELECT * FROM astar_weekly_metrics 
    WHERE user_id = ? AND week_number = ? AND year = ?
  `).bind(userId, weekNumber, year).first() as WeeklyMetrics | null;
  
  if (!metrics) return 0;
  
  // Fórmula de puntuación:
  // - Usuarios contactados: 10 puntos cada uno
  // - Hipótesis probadas: 20 puntos cada una
  // - Aprendizajes: 15 puntos cada uno
  // - Tasa de respuesta: multiplicador (0.5 a 1.5)
  const baseScore = 
    (metrics.users_contacted * 10) +
    (metrics.hypotheses_tested * 20) +
    (metrics.learnings_count * 15);
  
  const responseMultiplier = 0.5 + (metrics.response_rate * 1);
  
  return Math.round(baseScore * responseMultiplier);
}

// ============================================
// CRON: SEND DAILY MESSAGES
// ============================================

// Este endpoint debe llamarse desde un cron job (Cloudflare Cron Trigger)
astarMessages.post('/cron/send-daily', async (c) => {
  try {
    // Verificar cron secret (solo si está configurado y no es el valor por defecto)
    const cronSecret = c.req.header('X-Cron-Secret');
    const envSecret = c.env.CRON_SECRET;
    if (envSecret && envSecret !== 'CONFIGURE_IN_CLOUDFLARE_DASHBOARD' && cronSecret !== envSecret) {
      return c.json({ error: 'Unauthorized - Invalid cron secret' }, 401);
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Domingo
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : 'evening';
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Obtener plantilla del día/hora
    const template = await c.env.DB.prepare(`
      SELECT * FROM astar_message_templates 
      WHERE day_of_week = ? AND time_of_day = ?
    `).bind(dayOfWeek, timeOfDay).first() as MessageTemplate | null;

    if (!template) {
      return c.json({ message: 'No template for this time', sent: 0 });
    }

    // Obtener usuarios ASTAR activos
    const users = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name 
      FROM users u
      WHERE u.email IN ('aihelpstudy@gmail.com', 'giorgio.rodrigano@gmail.com')
    `).all() as { results: User[] };

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of users.results || []) {
      // Verificar si ya se envió este mensaje esta semana
      const alreadySent = await c.env.DB.prepare(`
        SELECT 1 FROM astar_sent_messages 
        WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
      `).bind(user.id, template.id, weekNumber, year).first();

      if (alreadySent) continue;

      // Preparar datos para la plantilla
      const templateData: Record<string, any> = {
        name: user.name || 'Founder',
      };

      // Para el mensaje del miércoles, agregar datos de la semana pasada
      if (dayOfWeek === 3 && timeOfDay === 'evening') {
        const lastWeekMetrics = await c.env.DB.prepare(`
          SELECT users_contacted FROM astar_weekly_metrics 
          WHERE user_id = ? AND week_number = ? AND year = ?
        `).bind(user.id, weekNumber - 1, year).first() as { users_contacted: number } | null;
        
        if (lastWeekMetrics) {
          templateData.last_week_users = lastWeekMetrics.users_contacted;
          templateData.target_users = Math.ceil(lastWeekMetrics.users_contacted * 1.1);
        }
      }

      // Para el mensaje del domingo, agregar rankings
      if (dayOfWeek === 0 && timeOfDay === 'evening') {
        const rankings = await c.env.DB.prepare(`
          SELECT 
            u.name, u.email,
            m.users_contacted, m.iteration_score as score
          FROM astar_weekly_metrics m
          JOIN users u ON m.user_id = u.id
          WHERE m.week_number = ? AND m.year = ?
          ORDER BY m.iteration_score DESC
          LIMIT 3
        `).bind(weekNumber, year).all();

        if (rankings.results && rankings.results.length > 0) {
          const topThree = rankings.results as any[];
          templateData.rankings = true;
          templateData.first_place = topThree[0] || { name: '-', users: 0, score: 0 };
          templateData.second_place = topThree[1] || { name: '-', users: 0, score: 0 };
          templateData.third_place = topThree[2] || { name: '-', users: 0, score: 0 };
        }

        // Posición del usuario
        const userRank = await c.env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) + 1 FROM astar_weekly_metrics m2 
             WHERE m2.week_number = ? AND m2.year = ? 
             AND m2.iteration_score > m.iteration_score) as rank,
            m.users_contacted as total_users,
            m.iteration_score as score
          FROM astar_weekly_metrics m
          WHERE m.user_id = ? AND m.week_number = ? AND m.year = ?
        `).bind(weekNumber, year, user.id, weekNumber, year).first() as any;

        if (userRank) {
          templateData.user_rank = userRank.rank;
          templateData.user_total_users = userRank.total_users;
          templateData.user_score = userRank.score;
        }
      }

      // Renderizar plantilla
      const body = renderTemplate(template.body_template, templateData);
      const htmlBody = convertToHtml(body, template.category);

      // Enviar email con Resend
      const result = await sendEmailWithResend(
        c.env.RESEND_API_KEY,
        user.email,
        template.subject,
        htmlBody
      );

      if (result.success) {
        // Guardar mensaje enviado
        await c.env.DB.prepare(`
          INSERT INTO astar_sent_messages (user_id, template_id, week_number, year, email_id)
          VALUES (?, ?, ?, ?, ?)
        `).bind(user.id, template.id, weekNumber, year, result.emailId || null).run();
        
        sentCount++;
      } else {
        errors.push(`User ${user.id}: ${result.error}`);
      }
    }

    return c.json({
      success: true,
      template: template.subject,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in cron send-daily:', error);
    return c.json({ error: 'Failed to send daily messages' }, 500);
  }
});

// ENDPOINT DE PRUEBA - Enviar email de prueba sin verificar si ya se envió
astarMessages.post('/cron/test-email', async (c) => {
  try {
    const now = new Date();

    // Obtener CUALQUIER plantilla disponible (priorizar las que esperan respuesta)
    const template = await c.env.DB.prepare(`
      SELECT * FROM astar_message_templates 
      WHERE expects_response = 1
      ORDER BY id
      LIMIT 1
    `).first() as MessageTemplate | null;

    if (!template) {
      // Si no hay plantillas con respuesta, obtener cualquiera
      const anyTemplate = await c.env.DB.prepare(`
        SELECT * FROM astar_message_templates 
        LIMIT 1
      `).first() as MessageTemplate | null;
      
      if (!anyTemplate) {
        return c.json({ error: 'No templates found in database', sent: 0 }, 404);
      }
    }

    // Obtener usuario de prueba
    const user = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name 
      FROM users u
      WHERE u.email = 'aihelpstudy@gmail.com'
    `).first() as User | null;

    if (!user) {
      return c.json({ error: 'Test user not found' }, 404);
    }

    // Renderizar y enviar email SIN verificar si ya se envió
    const rendered = renderTemplate(template.body_template, {
      name: user.name || 'Founder',
      dashboard_link: '{{dashboard_link}}' // Se reemplazará en convertToHtml
    });

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 24px;">${template.subject}</h2>
          ${convertToHtml(rendered, template.category)}
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
          ASTAR Labs - Ayudando founders a iterar más rápido
        </p>
      </div>
    `;

    const result = await sendEmailWithResend(
      c.env.RESEND_API_KEY,
      user.email,
      `[TEST] ${template.subject}`,
      htmlBody
    );

    if (result.success) {
      // Guardar en BD para que aparezca la notificación
      const weekNumber = getWeekNumber(now);
      const year = now.getFullYear();
      
      // Para testing: eliminar respuestas relacionadas primero
      await c.env.DB.prepare(`
        DELETE FROM astar_user_responses 
        WHERE sent_message_id IN (
          SELECT id FROM astar_sent_messages 
          WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
        )
      `).bind(user.id, template.id, weekNumber, year).run();
      
      // Luego eliminar el mensaje previo
      await c.env.DB.prepare(`
        DELETE FROM astar_sent_messages 
        WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
      `).bind(user.id, template.id, weekNumber, year).run();
      
      // Ahora insertar el nuevo mensaje
      await c.env.DB.prepare(`
        INSERT INTO astar_sent_messages (user_id, template_id, week_number, year, sent_at, email_id)
        VALUES (?, ?, ?, ?, datetime('now'), ?)
      `).bind(user.id, template.id, weekNumber, year, result.emailId).run();

      return c.json({
        success: true,
        message: 'Test email sent successfully',
        template: template.subject,
        emailId: result.emailId,
        savedToDb: true,
        user: user.email,
        category: template.category,
        expects_response: template.expects_response === 1
      });
    } else {
      return c.json({ 
        error: result.error || 'Unknown error',
        template: template.subject,
        user: user.email,
        resend_api_key_configured: !!c.env.RESEND_API_KEY
      }, 500);
    }

  } catch (error: any) {
    console.error('Error in test-email:', error);
    return c.json({ 
      error: 'Failed to send test email', 
      details: error.message || String(error),
      stack: error.stack
    }, 500);
  }
});

// ENDPOINT ESPECIAL - Enviar TODOS los emails de la semana a un usuario específico
astarMessages.post('/cron/send-all-week/:email', async (c) => {
  try {
    const targetEmail = c.req.param('email');
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Obtener usuario
    const user = await c.env.DB.prepare(`
      SELECT id, email, name FROM users WHERE email = ?
    `).bind(targetEmail).first() as User | null;

    if (!user) {
      return c.json({ error: 'User not found', email: targetEmail }, 404);
    }

    // Obtener TODAS las plantillas de la semana
    const templates = await c.env.DB.prepare(`
      SELECT * FROM astar_message_templates ORDER BY day_of_week, time_of_day
    `).all() as { results: MessageTemplate[] };

    if (!templates.results || templates.results.length === 0) {
      return c.json({ error: 'No templates found' }, 404);
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const template of templates.results) {
      // Preparar datos para la plantilla
      const templateData: Record<string, any> = {
        name: user.name || 'Founder',
        dashboard_link: '{{dashboard_link}}'
      };

      // Renderizar plantilla
      const rendered = renderTemplate(template.body_template, templateData);
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-bottom: 24px;">${template.subject}</h2>
            ${convertToHtml(rendered, template.category)}
          </div>
          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
            ASTAR Labs - Ayudando founders a iterar más rápido
          </p>
        </div>
      `;

      // Enviar email
      const result = await sendEmailWithResend(
        c.env.RESEND_API_KEY,
        user.email,
        template.subject,
        htmlBody
      );

      if (result.success) {
        // Eliminar mensaje previo si existe
        await c.env.DB.prepare(`
          DELETE FROM astar_user_responses 
          WHERE sent_message_id IN (
            SELECT id FROM astar_sent_messages 
            WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
          )
        `).bind(user.id, template.id, weekNumber, year).run();
        
        await c.env.DB.prepare(`
          DELETE FROM astar_sent_messages 
          WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
        `).bind(user.id, template.id, weekNumber, year).run();

        // Guardar nuevo mensaje
        await c.env.DB.prepare(`
          INSERT INTO astar_sent_messages (user_id, template_id, week_number, year, sent_at, email_id)
          VALUES (?, ?, ?, ?, datetime('now'), ?)
        `).bind(user.id, template.id, weekNumber, year, result.emailId).run();

        results.push({
          day: template.day_of_week,
          time: template.time_of_day,
          subject: template.subject,
          emailId: result.emailId,
          success: true
        });
      } else {
        errors.push(`${template.subject}: ${result.error}`);
        results.push({
          day: template.day_of_week,
          time: template.time_of_day,
          subject: template.subject,
          error: result.error,
          success: false
        });
      }

      // Esperar 500ms entre emails para no saturar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return c.json({
      success: true,
      user: user.email,
      totalTemplates: templates.results.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Error sending all week emails:', error);
    return c.json({ 
      error: 'Failed to send week emails', 
      details: error.message || String(error)
    }, 500);
  }
});

// ============================================
// API ROUTES (Autenticadas)
// ============================================

// Middleware que excluye rutas públicas como el cron y debug
astarMessages.use('/*', async (c, next) => {
  // Obtener la URL completa y verificar si es un endpoint público
  const fullUrl = c.req.url;
  const isPublicEndpoint = fullUrl.includes('cron/send-daily') || 
                           fullUrl.includes('cron/test-email') ||
                           fullUrl.includes('cron/send-all-week') ||
                           fullUrl.includes('cron/send-by-day') ||
                           fullUrl.includes('debug/');
  
  // Si es un endpoint público, saltar autenticación
  if (isPublicEndpoint) {
    return next();
  }
  
  // Para todas las demás rutas, requerir autenticación
  return requireAuth(c, next);
});

// GET /api/astar-messages/debug/pending/:email - Debug endpoint público
astarMessages.get('/debug/pending/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Obtener usuario por email
    const user = await c.env.DB.prepare(`
      SELECT id, email, name FROM users WHERE email = ?
    `).bind(email).first() as User | null;

    if (!user) {
      return c.json({ error: 'User not found', email });
    }

    const pending = await c.env.DB.prepare(`
      SELECT 
        sm.id as sent_message_id,
        sm.sent_at,
        sm.week_number,
        sm.year,
        t.subject,
        t.response_prompt,
        t.category,
        t.expects_response,
        r.id as response_id
      FROM astar_sent_messages sm
      JOIN astar_message_templates t ON sm.template_id = t.id
      LEFT JOIN astar_user_responses r ON sm.id = r.sent_message_id
      WHERE sm.user_id = ?
      ORDER BY sm.sent_at DESC
      LIMIT 10
    `).bind(user.id).all();

    // Filtrar pendientes
    const pendingOnly = (pending.results || []).filter((m: any) => 
      m.expects_response === 1 && 
      m.response_id === null && 
      m.week_number === weekNumber && 
      m.year === year
    );

    return c.json({ 
      user,
      currentWeek: weekNumber,
      currentYear: year,
      allMessages: pending.results || [],
      pendingMessages: pendingOnly,
      debug: {
        serverTime: now.toISOString(),
        weekCalculation: `Week ${weekNumber} of ${year}`
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return c.json({ error: 'Debug failed', details: String(error) }, 500);
  }
});

// GET /api/astar-messages/pending - Obtener mensajes pendientes de respuesta
astarMessages.get('/pending', async (c) => {
  try {
    const userId = c.get('userId');
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const pending = await c.env.DB.prepare(`
      SELECT 
        sm.id as sent_message_id,
        sm.sent_at,
        t.subject,
        t.response_prompt,
        t.category
      FROM astar_sent_messages sm
      JOIN astar_message_templates t ON sm.template_id = t.id
      LEFT JOIN astar_user_responses r ON sm.id = r.sent_message_id
      WHERE sm.user_id = ? 
        AND sm.week_number = ? 
        AND sm.year = ?
        AND t.expects_response = 1
        AND r.id IS NULL
      ORDER BY sm.sent_at DESC
    `).bind(userId, weekNumber, year).all();

    return c.json({ pending: pending.results || [] });

  } catch (error) {
    console.error('Error getting pending messages:', error);
    return c.json({ error: 'Failed to get pending messages' }, 500);
  }
});

// POST /api/astar-messages/respond - Responder a un mensaje
astarMessages.post('/respond', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json() as {
      sent_message_id: number;
      response_text: string;
    };

    const { sent_message_id, response_text } = body;

    if (!sent_message_id || !response_text?.trim()) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verificar que el mensaje pertenece al usuario
    const sentMessage = await c.env.DB.prepare(`
      SELECT sm.id, sm.user_id, sm.template_id, sm.week_number, sm.year, 
             t.category, t.response_prompt
      FROM astar_sent_messages sm
      JOIN astar_message_templates t ON sm.template_id = t.id
      WHERE sm.id = ? AND sm.user_id = ?
    `).bind(sent_message_id, userId).first() as { 
      id: number; user_id: number; template_id: number; week_number: number; year: number;
      category: string; response_prompt: string; 
    } | null;

    if (!sentMessage) {
      return c.json({ error: 'Message not found' }, 404);
    }

    // NO crear goal aquí - dejarlo para el chat
    // Solo guardar la respuesta del usuario para procesar después
    
    // Guardar respuesta
    const result = await c.env.DB.prepare(`
      INSERT INTO astar_user_responses (
        user_id, sent_message_id, response_text, response_type, 
        extracted_data, created_goal_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId, 
      sent_message_id, 
      response_text, 
      sentMessage.category,
      '{}',
      null  // No crear goal todavía
    ).run();

    // Devolver la categoría para que el frontend redirija al chat con contexto
    return c.json({
      success: true,
      response_id: result.meta.last_row_id,
      category: sentMessage.category,
      response_text: response_text,
      redirect_to_chat: true
    });

  } catch (error) {
    console.error('Error saving response:', error);
    return c.json({ error: 'Failed to save response', details: String(error) }, 500);
  }
});

// GET /api/astar-messages/my-metrics - Obtener mis métricas semanales
astarMessages.get('/my-metrics', async (c) => {
  try {
    const userId = c.get('userId');
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const metrics = await c.env.DB.prepare(`
      SELECT * FROM astar_weekly_metrics 
      WHERE user_id = ? AND week_number = ? AND year = ?
    `).bind(userId, weekNumber, year).first();

    // Historial de las últimas 4 semanas
    const history = await c.env.DB.prepare(`
      SELECT * FROM astar_weekly_metrics 
      WHERE user_id = ?
      ORDER BY year DESC, week_number DESC
      LIMIT 4
    `).bind(userId).all();

    return c.json({
      current: metrics || {
        users_contacted: 0,
        hypotheses_tested: 0,
        learnings_count: 0,
        response_rate: 0,
        iteration_score: 0
      },
      history: history.results || []
    });

  } catch (error) {
    console.error('Error getting metrics:', error);
    return c.json({ error: 'Failed to get metrics' }, 500);
  }
});

// GET /api/astar-messages/ranking - Obtener ranking semanal
astarMessages.get('/ranking', async (c) => {
  try {
    const now = new Date();
    const weekNumber = parseInt(c.req.query('week') || String(getWeekNumber(now)));
    const year = parseInt(c.req.query('year') || String(now.getFullYear()));
    const userId = c.get('userId');

    const rankings = await c.env.DB.prepare(`
      SELECT 
        m.user_id,
        u.name,
        u.email,
        m.users_contacted,
        m.hypotheses_tested,
        m.learnings_count,
        m.response_rate,
        m.iteration_score,
        RANK() OVER (ORDER BY m.iteration_score DESC) as rank
      FROM astar_weekly_metrics m
      JOIN users u ON m.user_id = u.id
      WHERE m.week_number = ? AND m.year = ?
      ORDER BY m.iteration_score DESC
      LIMIT 20
    `).bind(weekNumber, year).all();

    // Posición del usuario actual
    const userRank = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) + 1 FROM astar_weekly_metrics m2 
         WHERE m2.week_number = ? AND m2.year = ? 
         AND m2.iteration_score > m.iteration_score) as rank,
        m.*
      FROM astar_weekly_metrics m
      WHERE m.user_id = ? AND m.week_number = ? AND m.year = ?
    `).bind(weekNumber, year, userId, weekNumber, year).first();

    return c.json({
      week_number: weekNumber,
      year: year,
      rankings: rankings.results || [],
      my_position: userRank
    });

  } catch (error) {
    console.error('Error getting ranking:', error);
    return c.json({ error: 'Failed to get ranking' }, 500);
  }
});

// GET /api/astar-messages/history - Historial de mensajes y respuestas
astarMessages.get('/history', async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '20');

    const history = await c.env.DB.prepare(`
      SELECT 
        sm.id as message_id,
        sm.sent_at,
        sm.week_number,
        t.subject,
        t.category,
        t.response_prompt,
        r.response_text,
        r.response_type,
        r.extracted_data,
        r.created_at as responded_at
      FROM astar_sent_messages sm
      JOIN astar_message_templates t ON sm.template_id = t.id
      LEFT JOIN astar_user_responses r ON sm.id = r.sent_message_id
      WHERE sm.user_id = ?
      ORDER BY sm.sent_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json({ history: history.results || [] });

  } catch (error) {
    console.error('Error getting history:', error);
    return c.json({ error: 'Failed to get history' }, 500);
  }
});

// POST /api/astar-messages/update-metrics - Actualizar métricas manualmente
astarMessages.post('/update-metrics', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json() as {
      users_contacted?: number;
      hypotheses_tested?: number;
      learnings_count?: number;
    };

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    await c.env.DB.prepare(`
      INSERT INTO astar_weekly_metrics (user_id, week_number, year, users_contacted, hypotheses_tested, learnings_count)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, week_number, year) DO UPDATE SET
        users_contacted = COALESCE(?, users_contacted),
        hypotheses_tested = COALESCE(?, hypotheses_tested),
        learnings_count = COALESCE(?, learnings_count),
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      userId, weekNumber, year,
      body.users_contacted || 0,
      body.hypotheses_tested || 0,
      body.learnings_count || 0,
      body.users_contacted,
      body.hypotheses_tested,
      body.learnings_count
    ).run();

    // Recalcular score
    const newScore = await calculateIterationScore(c.env.DB, userId, weekNumber, year);
    await c.env.DB.prepare(`
      UPDATE astar_weekly_metrics SET iteration_score = ?
      WHERE user_id = ? AND week_number = ? AND year = ?
    `).bind(newScore, userId, weekNumber, year).run();

    return c.json({ success: true, new_score: newScore });

  } catch (error) {
    console.error('Error updating metrics:', error);
    return c.json({ error: 'Failed to update metrics' }, 500);
  }
});

// ENDPOINT NUEVO - Enviar email de un día específico para pruebas
astarMessages.post('/cron/send-by-day/:dayOfWeek', async (c) => {
  try {
    const dayOfWeekParam = c.req.param('dayOfWeek');
    const dayOfWeekMap: Record<string, number> = {
      'lunes': 1,
      'monday': 1,
      'martes': 2,
      'tuesday': 2,
      'miercoles': 3,
      'wednesday': 3,
      'jueves': 4,
      'thursday': 4,
      'viernes': 5,
      'friday': 5,
      'sabado': 6,
      'saturday': 6,
      'domingo': 0,
      'sunday': 0
    };

    const dayOfWeek = dayOfWeekMap[dayOfWeekParam.toLowerCase()];
    if (dayOfWeek === undefined) {
      return c.json({ 
        error: 'Invalid day. Use: lunes, martes, miercoles, jueves, viernes, sabado, domingo (or English equivalents)',
        provided: dayOfWeekParam 
      }, 400);
    }

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Obtener usuario de prueba
    const user = await c.env.DB.prepare(`
      SELECT id, email, name FROM users WHERE email = 'aihelpstudy@gmail.com'
    `).first() as User | null;

    if (!user) {
      return c.json({ error: 'Test user not found' }, 404);
    }

    // Obtener todas las plantillas de ese día
    const templates = await c.env.DB.prepare(`
      SELECT * FROM astar_message_templates 
      WHERE day_of_week = ?
      ORDER BY time_of_day
    `).bind(dayOfWeek).all() as { results: MessageTemplate[] };

    if (!templates.results || templates.results.length === 0) {
      return c.json({ 
        error: 'No templates found for this day', 
        dayOfWeek: dayOfWeek,
        dayName: dayOfWeekParam 
      }, 404);
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const template of templates.results) {
      // Preparar datos para la plantilla
      const templateData: Record<string, any> = {
        name: user.name || 'Founder',
        dashboard_link: '{{dashboard_link}}'
      };

      // Si es domingo (reflexión), agregar rankings ficticios para pruebas
      if (dayOfWeek === 0 && template.time_of_day === 'evening') {
        templateData.rankings = true;
        templateData.first_place = { name: 'Ana García', users: 15, score: 85 };
        templateData.second_place = { name: 'Carlos López', users: 12, score: 72 };
        templateData.third_place = { name: 'María Torres', users: 10, score: 68 };
        templateData.user_rank = 5;
        templateData.user_total_users = 8;
        templateData.user_score = 55;
      }

      // Renderizar plantilla
      const rendered = renderTemplate(template.body_template, templateData);
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-bottom: 24px;">${template.subject}</h2>
            ${convertToHtml(rendered, template.category)}
          </div>
          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
            ASTAR Labs - Ayudando founders a iterar más rápido
          </p>
        </div>
      `;

      // Enviar email
      const result = await sendEmailWithResend(
        c.env.RESEND_API_KEY,
        user.email,
        `[${dayOfWeekParam.toUpperCase()}] ${template.subject}`,
        htmlBody
      );

      if (result.success) {
        // Eliminar mensaje previo si existe
        await c.env.DB.prepare(`
          DELETE FROM astar_user_responses 
          WHERE sent_message_id IN (
            SELECT id FROM astar_sent_messages 
            WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
          )
        `).bind(user.id, template.id, weekNumber, year).run();
        
        await c.env.DB.prepare(`
          DELETE FROM astar_sent_messages 
          WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
        `).bind(user.id, template.id, weekNumber, year).run();

        // Guardar nuevo mensaje
        await c.env.DB.prepare(`
          INSERT INTO astar_sent_messages (user_id, template_id, week_number, year, sent_at, email_id)
          VALUES (?, ?, ?, ?, datetime('now'), ?)
        `).bind(user.id, template.id, weekNumber, year, result.emailId).run();

        results.push({
          time: template.time_of_day,
          subject: template.subject,
          category: template.category,
          emailId: result.emailId,
          success: true
        });
      } else {
        errors.push(`${template.subject}: ${result.error}`);
        results.push({
          time: template.time_of_day,
          subject: template.subject,
          category: template.category,
          error: result.error,
          success: false
        });
      }

      // Esperar 500ms entre emails
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return c.json({
      success: true,
      user: user.email,
      dayOfWeek: dayOfWeekParam,
      totalTemplates: templates.results.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Error sending day emails:', error);
    return c.json({ 
      error: 'Failed to send day emails', 
      details: error.message || String(error)
    }, 500);
  }
});

export default astarMessages;
