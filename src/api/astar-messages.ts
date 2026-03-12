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

// Generate a secure unsubscribe token
function generateUnsubscribeToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create unsubscribe footer HTML
function createUnsubscribeFooter(unsubscribeUrl: string): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        ¿No quieres recibir más emails de ASTAR?
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
          Cancelar suscripción
        </a>
      </p>
    </div>
  `;
}

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

// Batch email sending (up to 100 emails per request - Resend limit)
async function sendBatchEmailsWithResend(
  apiKey: string,
  emails: Array<{ to: string; subject: string; html: string }>,
  fromEmail: string = 'ASTAR <astar@aihelpstudy.com>'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        emails.map(email => ({
          from: fromEmail,
          to: [email.to],
          subject: email.subject,
          html: email.html,
        }))
      ),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend batch error:', error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending batch emails:', error);
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

// Crear notificación específica basada en el template del email
async function createEmailNotification(
  db: any,
  userId: number,
  template: MessageTemplate
): Promise<void> {
  let title = '';
  let message = '';
  let link = 'https://astarlabshub.com/marketplace?tab=traction';

  // Personalizar notificación según el día y tipo de mensaje
  switch(template.day_of_week) {
    case 1: // Monday - Ideas Day
      if (template.time_of_day === 'evening') {
        title = '💡 Time to define your hypothesis';
        message = 'What is your #1 hypothesis for this week? Share your expected user behavior and validation signal.';
        link += '&chat=hipotesis';
      }
      break;
    case 2: // Tuesday - Build Day
      if (template.time_of_day === 'evening') {
        title = '🛠️ Share your build progress';
        message = 'What did you build today? Include tech stack, time spent, and which hypothesis it tests.';
        link += '&chat=construccion';
      }
      break;
    case 3: // Wednesday - User Learning Day
      if (template.time_of_day === 'evening') {
        title = '💬 Report your user conversations';
        message = 'How many users did you speak with? How many used the product? What was your key learning?';
        link += '&chat=usuarios';
      }
      break;
    case 4: // Thursday - Measurement & Insights Day
      if (template.time_of_day === 'evening') {
        title = '📊 Share your user behavior insights';
        message = 'What actions did users repeat? Where did they drop off? What insight does this reveal?';
        link += '&chat=metricas';
      }
      break;
    case 5: // Friday - Metrics & Traction Day
      if (template.time_of_day === 'evening') {
        title = '📈 Report your weekly traction metrics';
        message = 'Share revenue, new users, active users, churn, and your strongest traction signal.';
        link += '&chat=traction';
      }
      break;
    case 6: // Saturday - Rest & Reflect
      if (template.time_of_day === 'evening') {
        title = '🧘 Optional weekend reflection';
        message = 'Any final thoughts from the week? Feel free to skip and rest!';
        link += '&chat=reflexion';
      }
      break;
    case 0: // Sunday - Weekly Review
      if (template.time_of_day === 'evening') {
        title = '🏁 Weekly Leaderboard is live!';
        message = 'Check out how everyone performed this week and your position in the leaderboard.';
        link += '&chat=reflexion';
      }
      break;
  }

  // Solo crear notificación si tenemos título y mensaje
  if (title && message) {
    try {
      await db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userId, 'astar_weekly_update', title, message, link).run();
    } catch (error) {
      console.error('Error creating notification:', error);
      // No fallar el envío del email por error en notificación
    }
  }
}

// ============================================
// CRON: SEND DAILY MESSAGES
// ============================================

// Este endpoint debe llamarse desde un cron job (Cloudflare Cron Trigger)
astarMessages.post('/cron/send-daily', async (c) => {
  // DISABLED — daily emails temporarily turned off
  return c.json({ disabled: true, sent: 0, message: 'Daily emails are currently disabled' });

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

    // ============================================
    // IE UNIVERSITY STUDENT EMAIL LIST
    // ============================================
    const IE_STUDENT_EMAILS = [
      'mgazitua.ieu2024@student.ie.edu', 'iamoise.ieu2024@student.ie.edu',
      'henry.aschke@student.ie.edu', 'tvillegas@student.ie.edu',
      'sahithi.meda@student.ie.edu', 'daniela.rivas@student.ie.edu',
      'masakazu.kobayashi@student.ie.edu', 'ivan.yemez@student.ie.edu',
      'diego.valdez@student.ie.edu', 'denciso.ieu2022@student.ie.edu',
      'lior.berman@student.ie.edu', 'alicia.leite@student.ie.edu',
      'mihir.godia@student.ie.edu', 'joellek@student.ie.edu',
      'abirhamid@student.ie.edu', 'kishan@student.ie.edu',
      'dogaoflazoglu@student.ie.edu', 'problescalat.ieu2025@student.ie.edu',
      'sanjana.sreekanthr@student.ie.edu', 'bdelmas.ieu2023@student.ie.edu',
      'shatrughna.singh@student.ie.edu', 'arefeh.shahali@student.ie.edu',
      'valerie.demil@student.ie.edu', 'youssef.jemmali@student.ie.edu',
      'leonardo.lombardi@student.ie.edu', 'mchigumbu.ieu2025@student.ie.edu',
      'antonruemmele@student.ie.edu', 'ella.garcia@student.ie.edu',
      'laura.reimer@student.ie.edu', 'autumnmartin@student.ie.edu',
      'clara.pujadas@student.ie.edu', 'ndimenhle.bungane@student.ie.edu',
      'anuska.das@student.ie.edu', 'emmajohnston@student.ie.edu',
      'tenaw.belete@student.ie.edu', 'nour.khalife@student.ie.edu',
      'phu-tung.ngo@student.ie.edu', 'akhil.garg@student.ie.edu',
      'felipeiriarte@student.ie.edu', 'kevinleon@student.ie.edu',
      'siagotska.ieu2024@student.ie.edu', 'ana.sydow@student.ie.edu',
      'gvargas.ieu2023@student.ie.edu', 'stephan.pentchev@student.ie.edu',
      'luciano.britti@student.ie.edu', 'rishi.kashyap@student.ie.edu',
      'raras.handwiyanto@student.ie.edu', 'martin.eala@student.ie.edu',
      'gabriel.castro@student.ie.edu', 'sidkamat@student.ie.edu',
      'gasparddefierlant@student.ie.edu', 'erina.kono@student.ie.edu',
      'pietrosarmiento@student.ie.edu', 'yridasafwan.ieu2022@student.ie.edu',
      'oespineira.ieu2024@student.ie.edu', 'javier.llorens@student.ie.edu',
      'isaenz.ieu2024@student.ie.edu', 'giovanni.beolchini@student.ie.edu',
      'lizziazeev@student.ie.edu', 'abril@student.ie.edu',
      'asanchez.ieu2024@student.ie.edu', 'haraujo.ieu2024@student.ie.edu',
      'sdemartino.ieu2022@student.ie.edu', 'daniel.mohebbi@student.ie.edu',
      'xlacevedo.ieu2024@student.ie.edu', 'ttrujillozur.ieu2024@student.ie.edu',
      'cesargutierrez@student.ie.edu', 'juanpablo.galindo@student.ie.edu',
      'pushaanvedi@student.ie.edu', 'miguel.tovar@student.ie.edu',
      'nicolas.lanari@student.ie.edu', 'sofiabianchi@student.ie.edu',
      'diego.santisteban@student.ie.edu', 'nicolascastrohelo@student.ie.edu',
      'jelawady.ieu2024@student.ie.edu', 'gvashakidze.ieu2023@student.ie.edu',
      'camilo.gomez@student.ie.edu', 'sduran.ieu2024@student.ie.edu',
      'marioalcedo@student.ie.edu', 'jorge.luis.ganoza@student.ie.edu',
      'juan.sucunza@student.ie.edu', 'camille.sarie@student.ie.edu',
      'jonathana@student.ie.edu', 'alfredo.borras@student.ie.edu',
      'enrique.harten@student.ie.edu', 'dhruv.v@student.ie.edu',
      'naman.saxena@student.ie.edu', 'abhishek.tatineni@student.ie.edu',
      'hraibeh.luka@student.ie.edu', 'julian.franco@student.ie.edu',
      'cande.abdala@student.ie.edu', 'ethan.stackpole@student.ie.edu',
      'nsanmartin@student.ie.edu', 'abhishek.jha@student.ie.edu',
      'sparsh@student.ie.edu', 'matejseben@student.ie.edu',
      'dgrobman.ieu2025@student.ie.edu', 'arendt@student.ie.edu',
      'adanouj@student.ie.edu', 'varun.rathi@student.ie.edu',
      'max.vanderlinden@student.ie.edu', 'saikiranah@student.ie.edu',
      'manuela.villegas@student.ie.edu', 'oalwaleedmoh.ieu2024@student.ie.edu',
      'charlottevaissiere@student.ie.edu', 'vmunoz.ieu2023@student.ie.edu',
      'dbueno.ieu2023@student.ie.edu', 'jordan.hays@student.ie.edu',
      'analuisafuriati@student.ie.edu', 'federica.nulli@student.ie.edu',
      'natalia.orozco@student.ie.edu', 'laja.ieu2024@student.ie.edu',
      'kfv.schmid@student.ie.edu', 'cristinajaime@student.ie.edu',
      'carlosverasc@student.ie.edu', 'agomezlopez@student.ie.edu',
      'vicenteginer.vgc@student.ie.edu', 'nirmallc@student.ie.edu',
      'ln.ieu2024@student.ie.edu', 'rosadalima.justina@student.ie.edu',
      'blakeknutson@student.ie.edu', 'annabeldavidson@student.ie.edu',
      'joss.arevalo@student.ie.edu', 'manuel.guerrero@student.ie.edu',
      'teresa.steinbacher@student.ie.edu', 'leaghanem@student.ie.edu',
      'konstantinosgeo@student.ie.edu', 'jdidiaz03@student.ie.edu'
    ];

    // Step 1: Auto-create IE student accounts if they don't exist (use INSERT OR IGNORE for speed)
    const batchStatements = IE_STUDENT_EMAILS.map(studentEmail => {
      const nameFromEmail = studentEmail.split('@')[0]
        .replace(/\.ieu\d+/gi, '')
        .replace(/\./g, ' ')
        .split(' ')
        .filter((w: string) => w.length > 0)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return c.env.DB.prepare(
        `INSERT OR IGNORE INTO users (email, name, role, created_at) VALUES (?, ?, 'founder', datetime('now'))`
      ).bind(studentEmail, nameFromEmail);
    });
    // D1 batch supports up to 500 statements per call
    await c.env.DB.batch(batchStatements);
    console.log(`[CRON] Ensured ${IE_STUDENT_EMAILS.length} IE students exist in DB`);

    // Step 2: Get ALL founders + IE students (match by domain, no variable explosion)
    const users = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name 
      FROM users u
      WHERE (u.role = 'founder' OR u.email LIKE '%@student.ie.edu')
        AND (u.email_unsubscribed IS NULL OR u.email_unsubscribed = 0)
      GROUP BY u.email
    `).all() as { results: User[] };

    console.log(`[CRON] Found ${users.results?.length || 0} recipients (founders + IE students)`);

    // Step 3: Prepare all emails for batch sending
    const emailsToSend: Array<{ user: User; unsubscribeToken: string; templateData: Record<string, any> }> = [];

    for (const user of users.results || []) {
      // Verificar si ya se envió este mensaje esta semana
      const alreadySent = await c.env.DB.prepare(`
        SELECT 1 FROM astar_sent_messages 
        WHERE user_id = ? AND template_id = ? AND week_number = ? AND year = ?
      `).bind(user.id, template.id, weekNumber, year).first();

      if (alreadySent) continue;

      // Generate unsubscribe token for this user
      const unsubscribeToken = generateUnsubscribeToken();
      await c.env.DB.prepare(`
        INSERT INTO email_unsubscribe_tokens (user_id, token)
        VALUES (?, ?)
      `).bind(user.id, unsubscribeToken).run();

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

      emailsToSend.push({ user, unsubscribeToken, templateData });
    }

    console.log(`[CRON] Prepared ${emailsToSend.length} emails to send`);

    // Step 4: Send in batches of 100 (Resend limit)
    let sentCount = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < emailsToSend.length; i += BATCH_SIZE) {
      const batch = emailsToSend.slice(i, i + BATCH_SIZE);
      const batchEmails = batch.map(({ user, unsubscribeToken, templateData }) => {
        const unsubscribeUrl = `https://astarlabshub.com/api/astar-messages/unsubscribe/${unsubscribeToken}`;
        const body = renderTemplate(template.body_template, templateData);
        const htmlBody = convertToHtml(body, template.category);
        const fullHtmlBody = htmlBody + createUnsubscribeFooter(unsubscribeUrl);

        return {
          to: user.email,
          subject: template.subject,
          html: fullHtmlBody
        };
      });

      // Send batch
      const result = await sendBatchEmailsWithResend(c.env.RESEND_API_KEY, batchEmails);

      if (result.success) {
        // Save all sent messages to DB
        const dbInserts = batch.map(({ user }) => 
          c.env.DB.prepare(`
            INSERT INTO astar_sent_messages (user_id, template_id, week_number, year, email_id)
            VALUES (?, ?, ?, ?, ?)
          `).bind(user.id, template.id, weekNumber, year, null)
        );
        await c.env.DB.batch(dbInserts);

        // Create notifications for templates that expect responses
        if (template.expects_response === 1) {
          for (const { user } of batch) {
            await createEmailNotification(c.env.DB, user.id, template);
          }
        }

        sentCount += batch.length;
        console.log(`[CRON] Batch ${Math.floor(i / BATCH_SIZE) + 1} sent: ${batch.length} emails`);
      } else {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.error}`);
        console.error(`[CRON] Batch failed:`, result.error);
      }

      // Small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < emailsToSend.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return c.json({
      success: true,
      template: template.subject,
      sent: sentCount,
      total: emailsToSend.length,
      batches: Math.ceil(emailsToSend.length / BATCH_SIZE),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in cron send-daily:', error);
    return c.json({ error: 'Failed to send daily messages' }, 500);
  }
});

// ENDPOINT DE PRUEBA - Enviar email de prueba sin verificar si ya se envió
astarMessages.get('/cron/test-email', async (c) => {
  try {
    const now = new Date();
    const targetEmail = c.req.query('email') || 'aihelpstudy@gmail.com';
    const dayOfWeek = parseInt(c.req.query('day') || '1'); // Default lunes
    const timeOfDay = c.req.query('time') || 'morning';

    // Obtener plantilla específica por día y hora
    const template = await c.env.DB.prepare(`
      SELECT * FROM astar_message_templates 
      WHERE day_of_week = ? AND time_of_day = ?
      LIMIT 1
    `).bind(dayOfWeek, timeOfDay).first() as MessageTemplate | null;

    if (!template) {
      return c.json({ error: 'No template found for specified day/time', day: dayOfWeek, time: timeOfDay }, 404);
    }

    // Obtener usuario de prueba
    let user = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name 
      FROM users u
      WHERE u.email = ?
    `).bind(targetEmail).first() as User | null;

    if (!user) {
      // Create user if doesn't exist
      await c.env.DB.prepare(`
        INSERT INTO users (email, name, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(targetEmail, 'Test User').run();
      
      user = await c.env.DB.prepare(`
        SELECT u.id, u.email, u.name 
        FROM users u
        WHERE u.email = ?
      `).bind(targetEmail).first() as User | null;
      
      if (!user) {
        return c.json({ error: 'Failed to create test user' }, 500);
      }
    }

    // Generate unsubscribe token
    const unsubscribeToken = generateUnsubscribeToken();
    await c.env.DB.prepare(`
      INSERT INTO email_unsubscribe_tokens (user_id, token)
      VALUES (?, ?)
    `).bind(user.id, unsubscribeToken).run();
    const unsubscribeUrl = `https://astarlabshub.com/api/astar-messages/unsubscribe/${unsubscribeToken}`;

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
        ${createUnsubscribeFooter(unsubscribeUrl)}
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

    // Generate unsubscribe token for this user (one per batch)
    const unsubscribeToken = generateUnsubscribeToken();
    await c.env.DB.prepare(`
      INSERT INTO email_unsubscribe_tokens (user_id, token)
      VALUES (?, ?)
    `).bind(user.id, unsubscribeToken).run();
    const unsubscribeUrl = `https://astarlabshub.com/api/astar-messages/unsubscribe/${unsubscribeToken}`;

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
          ${createUnsubscribeFooter(unsubscribeUrl)}
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
                           fullUrl.includes('debug/') ||
                           fullUrl.includes('unsubscribe/') ||
                           fullUrl.includes('/ranking');
  
  // Si es un endpoint público, saltar autenticación
  if (isPublicEndpoint) {
    return next();
  }
  
  // Para todas las demás rutas, requerir autenticación
  return requireAuth(c, next);
});

// ============================================
// UNSUBSCRIBE ENDPOINTS (Públicos)
// ============================================

// GET /api/astar-messages/unsubscribe/:token - Process unsubscribe
astarMessages.get('/unsubscribe/:token', async (c) => {
  try {
    const token = c.req.param('token');
    
    // Find token and user
    const tokenRecord = await c.env.DB.prepare(`
      SELECT ut.*, u.email, u.name 
      FROM email_unsubscribe_tokens ut
      JOIN users u ON ut.user_id = u.id
      WHERE ut.token = ? AND ut.used_at IS NULL
    `).bind(token).first() as any;
    
    if (!tokenRecord) {
      // Return error page
      return c.html(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - ASTAR</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            h1 { color: #ef4444; margin-bottom: 16px; }
            p { color: #6b7280; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>❌ Link inválido</h1>
            <p>Este link de cancelación de suscripción no es válido o ya fue usado.</p>
            <p style="margin-top: 24px;"><a href="https://astarlabshub.com">Volver a ASTAR</a></p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Mark user as unsubscribed
    await c.env.DB.prepare(`
      UPDATE users SET email_unsubscribed = 1 WHERE id = ?
    `).bind(tokenRecord.user_id).run();
    
    // Mark token as used
    await c.env.DB.prepare(`
      UPDATE email_unsubscribe_tokens SET used_at = datetime('now') WHERE id = ?
    `).bind(tokenRecord.id).run();
    
    // Return success page
    return c.html(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Suscripción cancelada - ASTAR</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); text-align: center; max-width: 450px; }
          h1 { color: #1f2937; margin-bottom: 16px; }
          .checkmark { font-size: 64px; margin-bottom: 16px; }
          p { color: #6b7280; line-height: 1.6; margin: 8px 0; }
          .email { color: #667eea; font-weight: 600; }
          .resubscribe { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
          .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
          .btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="checkmark">✅</div>
          <h1>Suscripción cancelada</h1>
          <p>Ya no recibirás más emails semanales de ASTAR en:</p>
          <p class="email">${tokenRecord.email}</p>
          <p style="margin-top: 16px; font-size: 14px;">Lamentamos verte ir. ¡Esperamos que tu startup siga creciendo! 🚀</p>
          <div class="resubscribe">
            <p style="font-size: 14px;">¿Cambiaste de opinión?</p>
            <a href="https://astarlabshub.com/api/astar-messages/resubscribe/${token}" class="btn">
              Volver a suscribirme
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error: any) {
    console.error('Error processing unsubscribe:', error);
    return c.html(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Error - ASTAR</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .card { background: white; padding: 48px; border-radius: 16px; text-align: center; }
          h1 { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>❌ Error</h1>
          <p>Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// GET /api/astar-messages/resubscribe/:token - Re-subscribe user
astarMessages.get('/resubscribe/:token', async (c) => {
  try {
    const token = c.req.param('token');
    
    // Find token (even if used)
    const tokenRecord = await c.env.DB.prepare(`
      SELECT ut.*, u.email, u.name 
      FROM email_unsubscribe_tokens ut
      JOIN users u ON ut.user_id = u.id
      WHERE ut.token = ?
    `).bind(token).first() as any;
    
    if (!tokenRecord) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error - ASTAR</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: white; padding: 48px; border-radius: 16px; text-align: center; }
            h1 { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>❌ Link inválido</h1>
            <p>Este link no es válido.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Re-subscribe user
    await c.env.DB.prepare(`
      UPDATE users SET email_unsubscribed = 0 WHERE id = ?
    `).bind(tokenRecord.user_id).run();
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido de vuelta! - ASTAR</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); text-align: center; max-width: 450px; }
          h1 { color: #1f2937; margin-bottom: 16px; }
          .emoji { font-size: 64px; margin-bottom: 16px; }
          p { color: #6b7280; line-height: 1.6; }
          .email { color: #667eea; font-weight: 600; }
          .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="emoji">🎉</div>
          <h1>¡Bienvenido de vuelta!</h1>
          <p>Has vuelto a suscribirte a los emails semanales de ASTAR.</p>
          <p class="email">${tokenRecord.email}</p>
          <p style="margin-top: 16px;">Recibirás tips y recordatorios para hacer crecer tu startup cada semana.</p>
          <a href="https://astarlabshub.com/marketplace?tab=traction" class="btn">
            Ir al Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
    
  } catch (error: any) {
    console.error('Error processing resubscribe:', error);
    return c.json({ error: 'Failed to resubscribe' }, 500);
  }
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
      response_prompt: sentMessage.response_prompt,  // Incluir la pregunta original
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
    
    // Try to get userId - may be null for unauthenticated users
    let userId: any = c.get('userId') || null;
    if (!userId) {
      // Try to extract from cookie/header manually
      try {
        const authToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                          c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
        if (authToken) {
          const { verify } = await import('hono/jwt');
          const payload = await verify(authToken, c.env.JWT_SECRET) as any;
          userId = payload?.userId || null;
        }
      } catch(e) { /* ignore auth errors for public endpoint */ }
    }

    let rankings;
    try {
      rankings = await c.env.DB.prepare(`
        SELECT 
          m.user_id,
          u.name,
          u.email,
          COALESCE(u.startup_name, u.company, (SELECT bp.title FROM beta_products bp WHERE bp.company_user_id = u.id LIMIT 1)) as startup_name,
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
    } catch(e) {
      // Fallback without startup_name if column doesn't exist
      rankings = await c.env.DB.prepare(`
        SELECT 
          m.user_id,
          u.name,
          u.email,
          COALESCE(u.company, (SELECT bp.title FROM beta_products bp WHERE bp.company_user_id = u.id LIMIT 1), '') as startup_name,
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
    }

    // Posición del usuario actual (only if authenticated)
    let userRank = null;
    if (userId) {
      userRank = await c.env.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) + 1 FROM astar_weekly_metrics m2 
           WHERE m2.week_number = ? AND m2.year = ? 
           AND m2.iteration_score > m.iteration_score) as rank,
          m.*
        FROM astar_weekly_metrics m
        WHERE m.user_id = ? AND m.week_number = ? AND m.year = ?
      `).bind(weekNumber, year, userId, weekNumber, year).first();
    }

    // Evolución del usuario: últimas 8 semanas
    let evolution: any[] = [];
    if (userId) {
      const evoResult = await c.env.DB.prepare(`
        SELECT 
          m.week_number,
          m.year,
          m.iteration_score,
          m.users_contacted,
          m.hypotheses_tested,
          m.learnings_count,
          (SELECT COUNT(*) + 1 FROM astar_weekly_metrics m2 
           WHERE m2.week_number = m.week_number AND m2.year = m.year 
           AND m2.iteration_score > m.iteration_score) as rank
        FROM astar_weekly_metrics m
        WHERE m.user_id = ?
        ORDER BY m.year DESC, m.week_number DESC
        LIMIT 8
      `).bind(userId).all();
      evolution = evoResult.results || [];
    }

    return c.json({
      week_number: weekNumber,
      year: year,
      rankings: rankings.results || [],
      my_position: userRank,
      my_evolution: evolution
    });

  } catch (error) {
    console.error('Error getting ranking:', error);
    return c.json({ error: 'Failed to get ranking' }, 500);
  }
});

// GET /api/astar-messages/ranking/all-time - Ranking general acumulado de todas las semanas
astarMessages.get('/ranking/all-time', async (c) => {
  try {
    // Try to get userId
    let userId: any = c.get('userId') || null;
    if (!userId) {
      try {
        const authToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                          c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
        if (authToken) {
          const { verify } = await import('hono/jwt');
          const payload = await verify(authToken, c.env.JWT_SECRET) as any;
          userId = payload?.userId || null;
        }
      } catch(e) { /* ignore */ }
    }

    // Aggregate all-time stats per startup
    const rankings = await c.env.DB.prepare(`
      SELECT 
        m.user_id,
        u.name,
        u.email,
        COALESCE(u.startup_name, u.company, (SELECT bp.title FROM beta_products bp WHERE bp.company_user_id = u.id LIMIT 1)) as startup_name,
        SUM(m.iteration_score) as total_score,
        SUM(m.users_contacted) as total_users_contacted,
        SUM(m.hypotheses_tested) as total_hypotheses_tested,
        SUM(m.learnings_count) as total_learnings,
        COUNT(*) as weeks_active,
        MAX(m.week_number || '-' || m.year) as last_activity,
        AVG(m.iteration_score) as avg_score_per_week,
        RANK() OVER (ORDER BY SUM(m.iteration_score) DESC) as rank
      FROM astar_weekly_metrics m
      JOIN users u ON m.user_id = u.id
      GROUP BY m.user_id, u.name, u.email
      ORDER BY total_score DESC
      LIMIT 20
    `).all();

    // Get evolution for each startup (last 8 weeks)
    const rankingsWithEvolution = await Promise.all(
      (rankings.results || []).map(async (r: any) => {
        const evo = await c.env.DB.prepare(`
          SELECT 
            week_number,
            year,
            iteration_score
          FROM astar_weekly_metrics
          WHERE user_id = ?
          ORDER BY year DESC, week_number DESC
          LIMIT 8
        `).bind(r.user_id).all();
        
        const evolution = (evo.results || []).reverse(); // oldest first
        const trend = evolution.length >= 2 
          ? evolution[evolution.length - 1].iteration_score - evolution[evolution.length - 2].iteration_score
          : 0;

        return { ...r, evolution, trend };
      })
    );

    // User position
    let myPosition = null;
    if (userId) {
      const userStats = await c.env.DB.prepare(`
        SELECT 
          m.user_id,
          SUM(m.iteration_score) as total_score,
          (SELECT COUNT(DISTINCT user_id) + 1 
           FROM astar_weekly_metrics m2 
           WHERE (SELECT SUM(iteration_score) FROM astar_weekly_metrics WHERE user_id = m2.user_id) > 
                 (SELECT SUM(iteration_score) FROM astar_weekly_metrics WHERE user_id = m.user_id)) as rank
        FROM astar_weekly_metrics m
        WHERE m.user_id = ?
        GROUP BY m.user_id
      `).bind(userId).first();
      myPosition = userStats;
    }

    // User evolution
    let myEvolution: any[] = [];
    if (userId) {
      const evoResult = await c.env.DB.prepare(`
        SELECT 
          m.week_number,
          m.year,
          m.iteration_score,
          (SELECT COUNT(DISTINCT user_id) + 1 
           FROM astar_weekly_metrics m2 
           WHERE m2.week_number = m.week_number AND m2.year = m.year 
           AND m2.iteration_score > m.iteration_score) as rank
        FROM astar_weekly_metrics m
        WHERE m.user_id = ?
        ORDER BY m.year DESC, m.week_number DESC
        LIMIT 8
      `).bind(userId).all();
      myEvolution = evoResult.results || [];
    }

    return c.json({
      rankings: rankingsWithEvolution,
      my_position: myPosition,
      my_evolution: myEvolution
    });

  } catch (error) {
    console.error('Error getting all-time ranking:', error);
    return c.json({ error: 'Failed to get all-time ranking' }, 500);
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

    // Obtener usuario de prueba (o crearlo si no existe)
    let user = await c.env.DB.prepare(`
      SELECT id, email, name FROM users WHERE email = 'aihelpstudy@gmail.com'
    `).first() as User | null;

    if (!user) {
      // Create user if doesn't exist
      await c.env.DB.prepare(`
        INSERT INTO users (email, name, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind('aihelpstudy@gmail.com', 'Test User').run();
      
      user = await c.env.DB.prepare(`
        SELECT id, email, name FROM users WHERE email = 'aihelpstudy@gmail.com'
      `).first() as User | null;
      
      if (!user) {
        return c.json({ error: 'Failed to create test user' }, 500);
      }
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

    // Generate unsubscribe token
    const unsubscribeToken = generateUnsubscribeToken();
    await c.env.DB.prepare(`
      INSERT INTO email_unsubscribe_tokens (user_id, token)
      VALUES (?, ?)
    `).bind(user.id, unsubscribeToken).run();
    const unsubscribeUrl = `https://astarlabshub.com/api/astar-messages/unsubscribe/${unsubscribeToken}`;

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
          ${createUnsubscribeFooter(unsubscribeUrl)}
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

        // Crear notificación específica si el template espera respuesta
        if (template.expects_response === 1) {
          await createEmailNotification(c.env.DB, user.id, template);
        }

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

// ============================================
// ADMIN ENDPOINTS - Pitch Deck Monitoring
// ============================================

// GET /api/astar-messages/admin/all-metrics - Get all pitch deck metrics (admin only)
astarMessages.get('/admin/all-metrics', async (c) => {
  try {
    // Verify admin role
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const filter = c.req.query('filter') || 'current';
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    let weekCondition = '';
    if (filter === 'current') {
      weekCondition = `WHERE m.week_number = ${currentWeek} AND m.year = ${currentYear}`;
    } else if (filter === 'last') {
      const lastWeek = currentWeek - 1;
      weekCondition = `WHERE m.week_number = ${lastWeek} AND m.year = ${currentYear}`;
    }
    // 'all' = no filter

    let metrics;
    try {
      metrics = await c.env.DB.prepare(`
        SELECT 
          m.*,
          u.name,
          u.email,
          COALESCE(u.startup_name, u.company, (SELECT bp.title FROM beta_products bp WHERE bp.company_user_id = u.id LIMIT 1)) as startup_name,
          (SELECT COUNT(*) FROM astar_user_responses r 
           JOIN astar_sent_messages s ON r.sent_message_id = s.id 
           WHERE s.user_id = m.user_id) as response_count
        FROM astar_weekly_metrics m
        JOIN users u ON m.user_id = u.id
        ${weekCondition}
        ORDER BY m.iteration_score DESC
      `).all();
    } catch(e) {
      // Fallback without startup_name if column doesn't exist
      metrics = await c.env.DB.prepare(`
        SELECT 
          m.*,
          u.name,
          u.email,
          COALESCE(u.company, (SELECT bp.title FROM beta_products bp WHERE bp.company_user_id = u.id LIMIT 1), '') as startup_name,
          (SELECT COUNT(*) FROM astar_user_responses r 
           JOIN astar_sent_messages s ON r.sent_message_id = s.id 
           WHERE s.user_id = m.user_id) as response_count
        FROM astar_weekly_metrics m
        JOIN users u ON m.user_id = u.id
        ${weekCondition}
        ORDER BY m.iteration_score DESC
      `).all();
    }

    return c.json({
      success: true,
      metrics: metrics.results || [],
      filter,
      week: currentWeek,
      year: currentYear
    });

  } catch (error: any) {
    console.error('Error getting admin metrics:', error);
    return c.json({ 
      error: 'Failed to get metrics', 
      details: error.message || String(error)
    }, 500);
  }
});

// GET /api/astar-messages/admin/user-responses/:userId - Get all responses for a user (admin only)
astarMessages.get('/admin/user-responses/:userId', async (c) => {
  try {
    // Verify admin role
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const userId = parseInt(c.req.param('userId'));

    const responses = await c.env.DB.prepare(`
      SELECT 
        r.*,
        t.subject as question,
        t.category,
        s.week_number,
        s.year
      FROM astar_user_responses r
      JOIN astar_sent_messages s ON r.sent_message_id = s.id
      JOIN astar_message_templates t ON s.template_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      responses: responses.results || [],
      userId
    });

  } catch (error: any) {
    console.error('Error getting user responses:', error);
    return c.json({ 
      error: 'Failed to get user responses', 
      details: error.message || String(error)
    }, 500);
  }
});

// GET /api/astar-messages/admin/email-stats - Get email sending statistics (admin only)
astarMessages.get('/admin/email-stats', async (c) => {
  try {
    // Verify admin role
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Count emails sent today
    const todayStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(DISTINCT user_id) as unique_recipients,
        template_id
      FROM astar_sent_messages 
      WHERE DATE(sent_at) = DATE('now')
      GROUP BY template_id
    `).all();

    // Count emails sent this week
    const weekStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(DISTINCT user_id) as unique_recipients
      FROM astar_sent_messages 
      WHERE week_number = ? AND year = ?
    `).bind(weekNumber, year).first();

    // Count total active founders and IE students
    const potentialRecipients = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM users
      WHERE (role = 'founder' OR email LIKE '%@student.ie.edu')
        AND (email_unsubscribed IS NULL OR email_unsubscribed = 0)
    `).first();

    // Get template details for today's sends
    const templatesUsed = await c.env.DB.prepare(`
      SELECT DISTINCT
        t.id,
        t.subject,
        t.day_of_week,
        t.time_of_day,
        COUNT(s.id) as sent_count
      FROM astar_sent_messages s
      JOIN astar_message_templates t ON s.template_id = t.id
      WHERE DATE(s.sent_at) = DATE('now')
      GROUP BY t.id
    `).all();

    return c.json({
      success: true,
      today: {
        total_sent: todayStats.results?.reduce((sum: number, r: any) => sum + (r.total_sent || 0), 0) || 0,
        unique_recipients: todayStats.results?.reduce((sum: number, r: any) => sum + (r.unique_recipients || 0), 0) || 0,
        templates: templatesUsed.results || []
      },
      this_week: {
        total_sent: (weekStats as any)?.total_sent || 0,
        unique_recipients: (weekStats as any)?.unique_recipients || 0
      },
      potential_recipients: (potentialRecipients as any)?.total || 0,
      week_number: weekNumber,
      year
    });

  } catch (error: any) {
    console.error('Error getting email stats:', error);
    return c.json({ 
      error: 'Failed to get email stats', 
      details: error.message || String(error)
    }, 500);
  }
});

// GET /api/astar-messages/admin/debug-recipients - Debug why emails aren't being sent (admin only)
astarMessages.get('/admin/debug-recipients', async (c) => {
  try {
    // Verify admin role
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : 'evening';

    // Get current template
    const template = await c.env.DB.prepare(`
      SELECT * FROM astar_message_templates 
      WHERE day_of_week = ? AND time_of_day = ?
    `).bind(dayOfWeek, timeOfDay).first() as any;

    // Count total founders
    const totalFounders = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'founder'
    `).first() as any;

    // Count founders with unsubscribe
    const unsubscribedFounders = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'founder' AND email_unsubscribed = 1
    `).first() as any;

    // Count IE students in DB
    const ieStudents = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE email LIKE '%@student.ie.edu'
    `).first() as any;

    // Count IE students with unsubscribe
    const unsubscribedIE = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE email LIKE '%@student.ie.edu' AND email_unsubscribed = 1
    `).first() as any;

    // Count who already received this week's template
    const alreadyReceived = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM astar_sent_messages 
      WHERE template_id = ? AND week_number = ? AND year = ?
    `).bind(template?.id || 0, weekNumber, year).first() as any;

    // Get eligible recipients (matching cron logic)
    const eligible = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE (u.role = 'founder' OR u.email LIKE '%@student.ie.edu')
        AND (u.email_unsubscribed IS NULL OR u.email_unsubscribed = 0)
    `).first() as any;

    // Sample of users who should receive but didn't
    const shouldReceive = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.role,
        CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as already_sent
      FROM users u
      LEFT JOIN astar_sent_messages s ON u.id = s.user_id 
        AND s.template_id = ? AND s.week_number = ? AND s.year = ?
      WHERE (u.role = 'founder' OR u.email LIKE '%@student.ie.edu')
        AND (u.email_unsubscribed IS NULL OR u.email_unsubscribed = 0)
      LIMIT 20
    `).bind(template?.id || 0, weekNumber, year).all();

    // Get list of unsubscribed users
    const unsubscribedUsers = await c.env.DB.prepare(`
      SELECT id, email, name, role
      FROM users
      WHERE email_unsubscribed = 1
      ORDER BY email
    `).all();

    // Get users who didn't receive but should have
    const notReceived = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.role
      FROM users u
      WHERE (u.role = 'founder' OR u.email LIKE '%@student.ie.edu')
        AND (u.email_unsubscribed IS NULL OR u.email_unsubscribed = 0)
        AND u.id NOT IN (
          SELECT user_id FROM astar_sent_messages 
          WHERE template_id = ? AND week_number = ? AND year = ?
        )
      LIMIT 50
    `).bind(template?.id || 0, weekNumber, year).all();

    return c.json({
      success: true,
      current_context: {
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        week_number: weekNumber,
        year,
        template: template ? {
          id: template.id,
          subject: template.subject
        } : null
      },
      stats: {
        total_founders: totalFounders?.count || 0,
        unsubscribed_founders: unsubscribedFounders?.count || 0,
        ie_students_in_db: ieStudents?.count || 0,
        unsubscribed_ie: unsubscribedIE?.count || 0,
        eligible_recipients: eligible?.count || 0,
        already_received_this_template: alreadyReceived?.count || 0,
        expected_to_send: (eligible?.count || 0) - (alreadyReceived?.count || 0)
      },
      ie_student_list_size: 114, // Hardcoded list size
      sample_users: shouldReceive.results || [],
      unsubscribed_users: unsubscribedUsers.results || [],
      users_not_received: notReceived.results || []
    });

  } catch (error: any) {
    console.error('Error debugging recipients:', error);
    return c.json({ 
      error: 'Failed to debug recipients', 
      details: error.message || String(error)
    }, 500);
  }
});

export default astarMessages;
