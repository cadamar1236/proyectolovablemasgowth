import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import type { Bindings, AuthContext } from '../types';

type Variables = {
  user: AuthContext;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS with credentials
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposeHeaders: ['Set-Cookie']
}));

// JWT middleware
const jwtMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as AuthContext;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Debug endpoint to check API key status
app.get('/status', jwtMiddleware, async (c) => {
  const hasGroqKey = !!c.env.GROQ_API_KEY;
  const hasOpenAIKey = !!c.env.OPENAI_API_KEY;
  const groqKeyPrefix = c.env.GROQ_API_KEY ? c.env.GROQ_API_KEY.substring(0, 10) + '...' : 'not set';
  
  return c.json({
    ai_enabled: hasGroqKey || hasOpenAIKey,
    groq_configured: hasGroqKey,
    openai_configured: hasOpenAIKey,
    groq_key_preview: groqKeyPrefix,
    message: hasGroqKey ? 'AI is enabled with Groq' : hasOpenAIKey ? 'AI is enabled with OpenAI' : 'AI is disabled - no API key found'
  });
});

// ============================================================
// ASTRO CHAT - AI Cofounder conversational interface
// ============================================================
// Powers the main dashboard chat where Astro (AI Cofounder)
// greets founders, collects startup metrics through natural
// conversation, and recommends the best VCs for their stage.
// Saves data to astro_sessions, user_metrics, goal_weekly_traction
// and users.startup_name for leaderboard positioning.
// ============================================================

// Helper: extract structured startup data from conversation using AI
async function extractAstroMetrics(groqKey: string, history: any[], userMessage: string | null): Promise<Record<string, any>> {
  if (!userMessage && history.length === 0) return {};
  try {
    const conversationText = [
      ...history.map((m: any) => `${m.role === 'astro' ? 'Astro' : 'Founder'}: ${m.content}`),
      ...(userMessage ? [`Founder: ${userMessage}`] : [])
    ].join('\n');

    const extractionPrompt = `Extrae datos estructurados del startup de esta conversación. Devuelve SOLO JSON válido, sin explicaciones.

Campos (usa null si no se menciona):
{
  "startup_name": "nombre del startup o null",
  "problem": "problema que resuelven (max 100 chars) o null",
  "solution": "cómo lo resuelven (max 100 chars) o null",
  "sector": "uno de: AI/SaaS/Marketplace/Fintech/Health/EdTech/B2B/B2C/Other o null",
  "geography": "uno de: Spain/LatAm/USA/Europe/Global o null",
  "mrr": número o null,
  "arr": número o null,
  "active_users": número o null,
  "growth_rate_percent": número o null,
  "team_size": número o null,
  "fundraising_goal": "e.g. '500K' o '1M' o null",
  "fundraising_stage": "uno de: pre-seed/seed/series-a/series-b o null"
}

Conversación:
${conversationText.substring(0, 3000)}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.1,
        max_tokens: 300
      })
    });
    if (!res.ok) return {};
    const d = await res.json() as any;
    const raw = d.choices[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

// Helper: save extracted metrics to DB (astro_sessions + user_metrics + goal_weekly_traction)
async function saveAstroData(db: any, userId: number, extracted: Record<string, any>, vcRecommendations?: string, actionItems?: string[], detectedLang?: string): Promise<void> {
  try {
    const existing = await db.prepare('SELECT * FROM astro_sessions WHERE user_id = ?').bind(userId).first() as any;

    const merged = { ...(existing || {}), ...Object.fromEntries(Object.entries(extracted).filter(([, v]) => v !== null && v !== undefined)) };

    const fields = ['startup_name', 'problem', 'solution', 'sector', 'mrr', 'active_users', 'team_size', 'fundraising_stage'];
    const filled = fields.filter(f => merged[f] !== null && merged[f] !== undefined && merged[f] !== '').length;
    const completeness = Math.round((filled / fields.length) * 100);

    const turns = (existing?.conversation_turns || 0) + 1;
    const vcJson = vcRecommendations || existing?.vc_recommendations || null;
    const actionItemsJson = actionItems && actionItems.length > 0
      ? JSON.stringify(actionItems)
      : (existing?.action_items || null);
    const lang = detectedLang || existing?.language || 'es';

    await db.prepare(`
      INSERT INTO astro_sessions (
        user_id, startup_name, problem, solution, sector, geography,
        mrr, arr, active_users, growth_rate_percent, team_size,
        fundraising_goal, fundraising_stage, vc_recommendations, action_items,
        conversation_turns, data_completeness, language, last_seen_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        startup_name = COALESCE(excluded.startup_name, startup_name),
        problem = COALESCE(excluded.problem, problem),
        solution = COALESCE(excluded.solution, solution),
        sector = COALESCE(excluded.sector, sector),
        geography = COALESCE(excluded.geography, geography),
        mrr = CASE WHEN excluded.mrr > 0 THEN excluded.mrr ELSE mrr END,
        arr = CASE WHEN excluded.arr > 0 THEN excluded.arr ELSE arr END,
        active_users = CASE WHEN excluded.active_users > 0 THEN excluded.active_users ELSE active_users END,
        growth_rate_percent = CASE WHEN excluded.growth_rate_percent > 0 THEN excluded.growth_rate_percent ELSE growth_rate_percent END,
        team_size = CASE WHEN excluded.team_size > 0 THEN excluded.team_size ELSE team_size END,
        fundraising_goal = COALESCE(excluded.fundraising_goal, fundraising_goal),
        fundraising_stage = COALESCE(excluded.fundraising_stage, fundraising_stage),
        vc_recommendations = COALESCE(excluded.vc_recommendations, vc_recommendations),
        action_items = COALESCE(excluded.action_items, action_items),
        conversation_turns = excluded.conversation_turns,
        data_completeness = excluded.data_completeness,
        language = COALESCE(excluded.language, language),
        last_seen_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      userId,
      merged.startup_name || null, merged.problem || null, merged.solution || null,
      merged.sector || null, merged.geography || null,
      merged.mrr || 0, merged.arr || 0,
      merged.active_users || 0, merged.growth_rate_percent || 0,
      merged.team_size || 1,
      merged.fundraising_goal || null, merged.fundraising_stage || null,
      vcJson, actionItemsJson, turns, completeness, lang
    ).run();

    if (merged.startup_name) {
      await db.prepare('UPDATE users SET startup_name = ? WHERE id = ?').bind(merged.startup_name, userId).run();
    }

    const today = new Date().toISOString().split('T')[0];

    if (merged.active_users > 0) {
      await db.prepare('DELETE FROM user_metrics WHERE user_id = ? AND metric_name = ? AND recorded_date = ?').bind(userId, 'users', today).run();
      await db.prepare('INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date) VALUES (?, ?, ?, ?)').bind(userId, 'users', merged.active_users, today).run();
    }

    const effectiveRevenue = merged.mrr > 0 ? merged.mrr : (merged.arr > 0 ? Math.round(merged.arr / 12) : 0);
    if (effectiveRevenue > 0) {
      await db.prepare('DELETE FROM user_metrics WHERE user_id = ? AND metric_name = ? AND recorded_date = ?').bind(userId, 'revenue', today).run();
      await db.prepare('INSERT INTO user_metrics (user_id, metric_name, metric_value, recorded_date) VALUES (?, ?, ?, ?)').bind(userId, 'revenue', effectiveRevenue, today).run();
    }

    if (merged.active_users > 0 || effectiveRevenue > 0) {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

      await db.prepare(`
        INSERT OR REPLACE INTO goal_weekly_traction (
          user_id, revenue_amount, new_users, active_users, churned_users, strongest_signal,
          week_number, year, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        userId,
        effectiveRevenue,
        0,
        merged.active_users || 0,
        0,
        `Astro session: ${merged.startup_name || 'Startup'} — ${merged.fundraising_stage || 'early stage'}`,
        weekNumber,
        now.getFullYear()
      ).run();
    }

    if (merged.startup_name) {
      try {
        const existingProduct = await db.prepare(
          'SELECT id, title FROM beta_products WHERE company_user_id = ? LIMIT 1'
        ).bind(userId).first() as any;

        const productTitle = merged.startup_name;
        const productDesc = [
          merged.problem ? `Problem: ${merged.problem}` : null,
          merged.solution ? `Solution: ${merged.solution}` : null,
          merged.sector ? `Sector: ${merged.sector}` : null,
          merged.fundraising_stage ? `Stage: ${merged.fundraising_stage}` : null,
        ].filter(Boolean).join(' | ') || `${merged.startup_name} — startup on ASTAR*`;

        const productCategory = merged.sector
          ? merged.sector.toLowerCase().includes('ai') ? 'AI/ML'
          : merged.sector.toLowerCase().includes('saas') ? 'SaaS'
          : merged.sector.toLowerCase().includes('fin') ? 'Fintech'
          : merged.sector.toLowerCase().includes('health') ? 'HealthTech'
          : merged.sector.toLowerCase().includes('ed') ? 'EdTech'
          : merged.sector
          : 'SaaS';

        if (existingProduct) {
          await db.prepare(`
            UPDATE beta_products
            SET title = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(productTitle, productDesc, productCategory, existingProduct.id).run();
        } else {
          await db.prepare(`
            INSERT INTO beta_products (
              company_user_id, title, description, category, stage,
              looking_for, compensation_type, compensation_amount,
              pricing_model, duration_days, validators_needed, requirements, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `).bind(
            userId,
            productTitle,
            productDesc,
            productCategory,
            merged.fundraising_stage || 'mvp',
            'Feedback and investor introductions',
            'free_access',
            0,
            'subscription_monthly',
            30,
            3,
            '{}'
          ).run();
        }
        console.log('[ASTRO-SAVE] beta_products upserted for user:', userId, '| startup:', productTitle);
      } catch (e) {
        console.error('[ASTRO-SAVE] beta_products upsert error:', e);
      }
    }
  } catch (e) {
    console.error('[ASTRO-SAVE] DB save error:', e);
  }
}

// Helper: auto-create goals in the goals table from Astro action items (avoids duplicates)
async function createAstroGoals(db: any, userId: number, items: string[], weekOf: string, userName?: string): Promise<any[]> {
  const created: any[] = [];
  for (const item of items.slice(0, 5)) {
    try {
      const existing = await db.prepare(
        `SELECT id FROM goals WHERE user_id = ? AND description = ? AND status = 'active' LIMIT 1`
      ).bind(userId, item).first();
      if (existing) continue;

      const goal = await db.prepare(`
        INSERT INTO goals (
          user_id, description, target_value, current_value, category,
          task, priority, priority_label, cadence, dri, goal_status, week_of, order_index, status
        )
        VALUES (?, ?, 100, 0, 'Traction', ?, 'P1', 'Urgent or important', 'One time', ?, 'To start', ?, 0, 'active')
        RETURNING *
      `).bind(userId, item, item, userName || null, weekOf).first();

      if (goal) created.push(goal);
    } catch (e) {
      console.error('[ASTRO-GOALS] Error creating goal:', e);
    }
  }
  return created;
}

app.post('/astro-chat', async (c) => {
  try {
    // Optional JWT auth — saves to DB if logged in, works without token too
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                     c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                     c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
    let userId: number | null = null;
    if (authToken) {
      try {
        const payload = await verify(authToken, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as any;
        userId = payload.userId || null;
      } catch {}
    }

    const astroUserId: number | null = userId;

    const body = await c.req.json();
    const { message, conversationHistory = [], collectedData = {}, isWeeklyCheckin: clientWeeklyCheckin = false } = body;
    const groqKey = c.env.GROQ_API_KEY;

    // ── Detect voice transcript messages ──────────────────────────────
    const isVoiceTranscript = typeof message === 'string' && message.startsWith('[VOICE_TRANSCRIPT]');
    const cleanedMessage = isVoiceTranscript ? message.replace('[VOICE_TRANSCRIPT]', '').trim() : message;

    // ── Detect language from latest message or history ─────────────────
    const allText = [message, ...conversationHistory.slice(-3).map((m: any) => m.content)]
      .filter(Boolean).join(' ');
    const looksEnglish = allText && /\b(the|is|are|my|we|our|have|startup|raising|looking|team|users|revenue|I want|can you|what|how)\b/i.test(allText);
    const detectedLang = looksEnglish ? 'en' : 'es';

    // ── Load prior session from DB (for memory + weekly check-in) ──────
    let priorSession: any = null;
    let isWeeklyReturn = false;
    let isReturningUser = false;
    if (astroUserId) {
      try {
        priorSession = await c.env.DB.prepare('SELECT * FROM astro_sessions WHERE user_id = ?').bind(astroUserId).first() as any;
        if (priorSession) {
          isReturningUser = true;
          if (priorSession.last_seen_at) {
            const daysSince = (Date.now() - new Date(priorSession.last_seen_at).getTime()) / 86400000;
            isWeeklyReturn = daysSince >= 6;
          }
        }
      } catch {}
    }

    // ── Load pending goals for returning users ───────────────────────
    let pendingAstroGoals: any[] = [];
    if (userId && isReturningUser) {
      try {
        const goalsRes = await c.env.DB.prepare(`
          SELECT id, description, goal_status, week_of
          FROM goals
          WHERE user_id = ? AND goal_status != 'Done' AND status = 'active'
          ORDER BY created_at DESC LIMIT 5
        `).bind(userId).all();
        pendingAstroGoals = goalsRes.results || [];
      } catch {}
    }

    // ── Merge prior session into collectedData for full context ────────
    const fullCollectedData = { ...collectedData };
    if (priorSession) {
      if (priorSession.startup_name && !fullCollectedData.startup_name) fullCollectedData.startup_name = priorSession.startup_name;
      if (priorSession.problem && !fullCollectedData.problem) fullCollectedData.problem = priorSession.problem;
      if (priorSession.solution && !fullCollectedData.solution) fullCollectedData.solution = priorSession.solution;
      if (priorSession.sector && !fullCollectedData.sector) fullCollectedData.sector = priorSession.sector;
      if (priorSession.geography && !fullCollectedData.geography) fullCollectedData.geography = priorSession.geography;
      if (priorSession.mrr > 0 && !fullCollectedData.mrr) fullCollectedData.mrr = priorSession.mrr;
      if (priorSession.arr > 0 && !fullCollectedData.arr) fullCollectedData.arr = priorSession.arr;
      if (priorSession.active_users > 0 && !fullCollectedData.active_users) fullCollectedData.active_users = priorSession.active_users;
      if (priorSession.team_size > 1 && !fullCollectedData.team_size) fullCollectedData.team_size = priorSession.team_size;
      if (priorSession.fundraising_stage && !fullCollectedData.fundraising_stage) fullCollectedData.fundraising_stage = priorSession.fundraising_stage;
      if (priorSession.fundraising_goal && !fullCollectedData.fundraising_goal) fullCollectedData.fundraising_goal = priorSession.fundraising_goal;
    }

    // ── Query VCs from DB based on what we already know ────────────────
    let vcDatabaseText = '';
    let matchedVCs: any[] = [];
    try {
      const stage = fullCollectedData.fundraising_stage || null;
      const sector = fullCollectedData.sector || null;
      const geo = fullCollectedData.geography || null;

      const vcRows = await c.env.DB.prepare(`
        SELECT name, country, geography, stage, sectors, min_ticket_usd, max_ticket_usd,
               typical_equity_pct, website, description, portfolio_examples
        FROM venture_capitals
        WHERE is_active = 1
          AND (
            (? IS NULL OR stage LIKE '%' || ? || '%')
            OR (? IS NULL OR sectors LIKE '%' || ? || '%')
          )
        ORDER BY
          CASE WHEN stage LIKE '%' || COALESCE(?,stage) || '%' THEN 0 ELSE 1 END,
          CASE WHEN sectors LIKE '%' || COALESCE(?,sectors) || '%' THEN 0 ELSE 1 END,
          CASE WHEN geography LIKE '%' || COALESCE(?,geography) || '%' THEN 0 ELSE 1 END
        LIMIT 30
      `).bind(stage, stage, sector, sector, stage, sector, geo).all();

      matchedVCs = vcRows.results || [];
      if (matchedVCs.length > 0) {
        vcDatabaseText = (detectedLang === 'en' ? '\n\nREAL VC DATABASE (use ONLY these):\n' : '\n\nBASE DE DATOS REAL DE VCs (usa SOLO estos):\n') +
          matchedVCs.map((vc: any) => {
            const ticketStr = vc.min_ticket_usd > 0
              ? `$${vc.min_ticket_usd/1000}K–$${(vc.max_ticket_usd/1000000).toFixed(1)}M`
              : 'Varies';
            return `• ${vc.name} [${vc.country}] | Stages: ${vc.stage} | Sectors: ${vc.sectors} | Ticket: ${ticketStr} | ${vc.description}`;
          }).join('\n');
      }
    } catch (e) {
      console.error('[ASTRO-CHAT] VC DB query error:', e);
    }

    // ── Build returning-user context section ───────────────────────────
    const effectiveWeeklyCheckin = isWeeklyReturn || clientWeeklyCheckin;
    let returningContext = '';
    if (isReturningUser && conversationHistory.length === 0) {
      const priorActionItems = priorSession?.action_items
        ? (() => { try { return JSON.parse(priorSession.action_items); } catch { return []; } })()
        : [];

      if (isWeeklyReturn) {
        const pendingGoalsText = pendingAstroGoals.length > 0
          ? pendingAstroGoals.map((g: any, i: number) => `${i+1}. [${g.goal_status}] ${g.description}`).join(' | ')
          : 'none';
        const prevMrr    = priorSession.mrr > 0 ? `$${priorSession.mrr}` : 'not recorded';
        const prevUsers  = priorSession.active_users > 0 ? `${priorSession.active_users}` : 'not recorded';
        const prevArr    = priorSession.arr > 0 ? `$${priorSession.arr}` : 'not recorded';
        returningContext = detectedLang === 'en'
          ? `\n\nWEEKLY CHECK-IN MODE: This founder is returning after ${Math.floor((Date.now() - new Date(priorSession.last_seen_at).getTime()) / 86400000)} days.
LAST SESSION SUMMARY for ${priorSession.startup_name || 'their startup'}:
- Previous metrics: MRR ${prevMrr} | Active users ${prevUsers} | ARR ${prevArr} | Stage: ${priorSession.fundraising_stage || 'unknown'}
- Action items we gave them: ${priorActionItems.length > 0 ? priorActionItems.map((a: string, i: number) => `${i+1}. ${a}`).join(' | ') : 'none recorded'}
- Goals pending in their Hub (status ≠ Done): ${pendingGoalsText}
OPENING INSTRUCTION — send ONE short message only, then WAIT:
Welcome them back warmly (1 sentence mentioning their startup name), then ask: "Take a minute — talk me through how the week went. What shipped? How are the numbers moving (MRR, users)? And what's the one thing that's blocking you right now?"
DO NOT ask about individual goals yet. DO NOT ask separate metric questions. Let them talk first.
Once they reply, THEN dig into specifics: celebrate wins, ask about pending goals one at a time, and suggest [ACTION_ITEMS: ...] for the next week.
Context you have (use as reference, don't repeat back verbatim): MRR was ${prevMrr}, active users ${prevUsers}, pending goals: ${pendingGoalsText}.
Keep tone warm, energetic — like a cofounder excited to catch up. Max 4 short sentences in your opener.`
          : `\n\nMODO CHECK-IN SEMANAL: Este founder vuelve después de ${Math.floor((Date.now() - new Date(priorSession.last_seen_at).getTime()) / 86400000)} días.
RESUMEN DE ÚLTIMA SESIÓN para ${priorSession.startup_name || 'su startup'}:
- Métricas anteriores: MRR ${prevMrr} | Usuarios activos ${prevUsers} | ARR ${prevArr} | Etapa: ${priorSession.fundraising_stage || 'desconocida'}
- Pasos acordados: ${priorActionItems.length > 0 ? priorActionItems.map((a: string, i: number) => `${i+1}. ${a}`).join(' | ') : 'ninguno registrado'}
- Goals pendientes en su Hub (estado ≠ Done): ${pendingGoalsText}
INSTRUCCIÓN DE APERTURA — envía UN SOLO mensaje corto y espera:
Da la bienvenida calurosamente (1 frase mencionando el nombre de su startup), luego pregunta: "Tómate un minuto — cuéntame cómo fue la semana. ¿Qué lanzaste? ¿Cómo van los números (MRR, usuarios)? ¿Y cuál es el bloqueo más grande ahora mismo?"
NO preguntes por goals individuales todavía. NO hagas preguntas de métricas por separado. Déjales hablar primero.
Cuando respondan, entonces profundiza: celebra los logros, pregunta por los goals pendientes de uno en uno y sugiere [ACTION_ITEMS: ...] para la próxima semana.
Contexto que tienes (úsalo como referencia, no lo repitas textualmente): MRR era ${prevMrr}, usuarios activos ${prevUsers}, goals pendientes: ${pendingGoalsText}.
Tono cálido y energético — como un cofounder emocionado por ponerse al día. Máximo 4 frases cortas en tu apertura.`;
      } else {
        // Non-weekly return (same day or < 6 days) — still use focused single-opener.
        const pendingGoalsText2 = pendingAstroGoals.length > 0
          ? pendingAstroGoals.map((g: any, i: number) => `${i+1}. [${g.goal_status}] ${g.description}`).join(' | ')
          : 'none';
        const prevMrr2   = priorSession.mrr > 0 ? `$${priorSession.mrr}` : 'not recorded';
        const prevUsers2 = priorSession.active_users > 0 ? `${priorSession.active_users}` : 'not recorded';
        returningContext = detectedLang === 'en'
          ? `\n\nRETURNING FOUNDER — FRESH SESSION START:
You already know this founder. Startup: ${priorSession.startup_name || 'unknown'} | Sector: ${priorSession.sector || 'unknown'} | Stage: ${priorSession.fundraising_stage || 'unknown'} | Last MRR: ${prevMrr2} | Last active users: ${prevUsers2} | Pending goals: ${pendingGoalsText2}.
OPENING INSTRUCTION — send EXACTLY ONE short message, then WAIT for their reply:
Greet them warmly (1 sentence using their startup name). Then ask ONLY this single open question: "Take a minute — what's been happening since we last spoke? What moved forward, what's stuck, and what do you need help with right now?"
ABSOLUTELY DO NOT: ask about metrics separately, list suggestions, ask multiple questions, or give advice in your opener.
Wait for their answer. THEN respond to what they actually share.`
          : `\n\nFOUNDER RECURRENTE — INICIO DE SESIÓN NUEVA:
Ya conoces a este founder. Startup: ${priorSession.startup_name || 'desconocida'} | Sector: ${priorSession.sector || 'desconocido'} | Etapa: ${priorSession.fundraising_stage || 'desconocida'} | Último MRR: ${prevMrr2} | Últimos usuarios activos: ${prevUsers2} | Goals pendientes: ${pendingGoalsText2}.
INSTRUCCIÓN DE APERTURA — envía EXACTAMENTE UN mensaje corto y ESPERA su respuesta:
Salúdale calurosamente (1 frase usando el nombre de su startup). Luego haz SOLO esta pregunta abierta: "Tómate un minuto — ¿qué ha pasado desde la última vez? ¿Qué avanzó, qué se atascó y en qué necesitas ayuda ahora mismo?"
ABSOLUTAMENTE NO: preguntes métricas por separado, hagas sugerencias, hagas varias preguntas, ni des consejos en tu mensaje de apertura.
Espera su respuesta. ENTONCES responde a lo que compartan.`;
      }
    } else if (effectiveWeeklyCheckin && conversationHistory.length > 0) {
      const pendingGoalsText = pendingAstroGoals.length > 0
        ? pendingAstroGoals.map((g: any, i: number) => `${i+1}. [${g.goal_status}] ${g.description}`).join(' | ')
        : 'none';
      returningContext = detectedLang === 'en'
        ? `\n\nONGOING WEEKLY CHECK-IN — IMPORTANT: You are in the middle of a weekly check-in session. DO NOT jump to Phase 7 (VC recommendations) yet. Continue asking about: pending goals (${pendingGoalsText}) and metric updates (MRR, users, growth). Only move to Phase 7 after the founder has clearly answered your check-in questions about goals and metrics.`
        : `\n\nCHECK-IN SEMANAL EN CURSO — IMPORTANTE: Estás en medio de una sesión de check-in semanal. NO saltes a la Fase 7 (recomendaciones de VCs) todavía. Continúa preguntando sobre: goals pendientes (${pendingGoalsText}) y actualizaciones de métricas (MRR, usuarios, crecimiento). Solo pasa a la Fase 7 después de que el founder haya respondido claramente las preguntas del check-in sobre goals y métricas.`;
    }

    // ── Determine which onboarding phases are already complete ─────────
    const d = fullCollectedData;
    const priorItems = priorSession?.action_items
      ? (() => { try { return JSON.parse(priorSession.action_items); } catch { return []; } })()
      : [];
    const phasesDone = {
      intro:        !!(d.startup_name && d.problem),
      product:      !!(d.solution),
      traction:     !!(d.active_users !== undefined || d.mrr !== undefined),
      team:         !!(d.team_size),
      goals:        priorItems.length > 0,
      fundraising:  !!(d.fundraising_stage && d.fundraising_goal),
      vcs:          !!(priorSession?.vc_recommendations),
    };
    const onboardingComplete = phasesDone.intro && phasesDone.product && phasesDone.traction && phasesDone.team && phasesDone.fundraising;

    const knownFacts = [
      d.startup_name   ? `startup: ${d.startup_name}`                                         : null,
      d.problem        ? `problem they solve: ${d.problem}`                                    : null,
      d.solution       ? `solution/product: ${d.solution}`                                     : null,
      d.sector         ? `sector: ${d.sector}`                                                 : null,
      d.geography      ? `geography: ${d.geography}`                                           : null,
      d.active_users !== undefined ? `active users: ${d.active_users || 'pre-launch (0)'}`    : null,
      d.mrr !== undefined          ? `MRR: ${d.mrr > 0 ? '$' + d.mrr : 'pre-revenue ($0)'}`  : null,
      d.arr !== undefined          ? `ARR: ${d.arr > 0 ? '$' + d.arr : 'n/a'}`               : null,
      d.growth_rate_percent        ? `monthly growth: ${d.growth_rate_percent}%`               : null,
      d.team_size                  ? `team size: ${d.team_size}`                               : null,
      d.fundraising_stage          ? `fundraising stage: ${d.fundraising_stage}`               : null,
      d.fundraising_goal           ? `fundraising goal: $${d.fundraising_goal}`                : null,
      priorItems.length > 0        ? `goals set: ${priorItems.join(', ')}`                     : null,
    ].filter(Boolean).join('\n  • ');

    const nextPhase = !phasesDone.intro ? 'phase1_intro'
      : !phasesDone.product    ? 'phase2_product'
      : !phasesDone.traction   ? 'phase3_traction'
      : !phasesDone.team       ? 'phase4_team'
      : !phasesDone.goals      ? 'phase5_goals'
      : !phasesDone.fundraising ? 'phase6_fundraising'
      : !phasesDone.vcs        ? 'phase7_vcs'
      : 'cofounder_mode';

    // ── System prompt (bilingual, adaptive) ───────────────────────────
    const personality_en = `You are Astro ⚡, the AI Cofounder of ASTAR*. Expert in sales, marketing and fundraising for startups.
PERSONALITY: Senior cofounder and mentor tone. Direct, smart, warm, energetic. Celebrate wins. Use emojis sparingly. Never sound like a chatbot.
RESPONSE FORMAT — NON-NEGOTIABLE:
- Write like a real cofounder TEXTING, not writing a consulting report.
- MAX 3-4 short paragraphs per reply. Aim for under 120 words. If you need more, split into multiple turns.
- NEVER use markdown tables (not even once).
- NEVER use ## or # headers in your replies — use **bold** inline instead.
- NEVER produce walls of text. If you catch yourself writing more than 5 lines, stop and cut it down.
- Bullets are OK for 2-3 items max. No long bulleted lists.`;

    const personality_es = `Eres Astro ⚡, el AI Cofounder de ASTAR*. Experto en ventas, marketing y fundraising para startups.
PERSONALIDAD: Tono de cofounder senior y mentor. Directo, inteligente, cálido, enérgico. Celebra los logros. Usa emojis con moderación. Nunca suenes como un chatbot.
FORMATO DE RESPUESTA — INNEGOCIABLE:
- Escribe como un cofounder ENVIANDO UN MENSAJE DE TEXTO, no redactando un informe.
- MÁXIMO 3-4 párrafos cortos por respuesta. Apunta a menos de 120 palabras. Si necesitas más, divide en varios turnos.
- NUNCA uses tablas markdown (ni una sola vez).
- NUNCA uses ## o # encabezados — usa **negrita** inline en su lugar.
- NUNCA escribas parrafadas. Si llevas más de 5 líneas, para y recórtalo.
- Las viñetas están bien para 2-3 elementos máximo. Sin listas largas.`;

    const memory_en = knownFacts
      ? `\nWHAT YOU ALREADY KNOW — NEVER ASK AGAIN:\n  • ${knownFacts}\n`
      : '';
    const memory_es = knownFacts
      ? `\nLO QUE YA SABES — NO VUELVAS A PREGUNTAR:\n  • ${knownFacts}\n`
      : '';

    const cofounterPrompt_en = `${personality_en}
${memory_en}
COFOUNDER MODE — onboarding is complete. You are now their always-on AI cofounder.

HOW TO BEHAVE:
1. Start by asking what they need help with today (pitch, growth, investors, product, hiring, strategy...).
2. Dive deep into whatever they ask. Give concrete advice, frameworks, scripts, or intros as needed.
3. If they haven't shared metric updates this session yet, naturally ask for one metric update (MRR or active users) as part of the conversation — not as a separate question.
4. Whenever relevant, suggest new goals and tag them: [ACTION_ITEMS: goal1 | goal2 | goal3]
5. If they ask about investors, give VC recs (2-3 conversational sentences, no tables) and tag: [VC_MATCH: name1, name2]

ABSOLUTE RULES:
- NEVER ask for data already in "what you already know" above.
- ONE topic at a time. Don't ask multiple questions in the same message.
- NEVER use markdown tables — not a single one, ever.
- NEVER use ## or # section headers in your replies.
- NEVER write more than 4 short paragraphs in one message. Keep it under 120 words.
- Write like you're texting a founder friend, NOT writing a consulting report.
- ALWAYS end every message with exactly one follow-up question to keep the conversation going.
- Metrics (MRR, users, growth) CAN be asked once per session as an update — frame them as "last time you had X, what's the number now?"
- If founder says "ok", "perfecto", "sure" after getting VC recs → move to next steps, don't repeat VC message.
- ALWAYS respond in English when the founder writes in English.
${returningContext}${vcDatabaseText}`;

    const cofounterPrompt_es = `${personality_es}
${memory_es}
MODO COFOUNDER — el onboarding está completo. Ahora eres su cofounder AI siempre disponible.

CÓMO COMPORTARTE:
1. Empieza preguntando en qué necesitan ayuda hoy (pitch, crecimiento, inversores, producto, equipo, estrategia...).
2. Profundiza en lo que pidan. Da consejos concretos, frameworks, scripts o intros según lo que necesiten.
3. Si aún no han compartido actualizaciones de métricas en esta sesión, pregunta de forma natural por una métrica (MRR o usuarios activos) — no como pregunta separada, sino dentro de la conversación.
4. Cuando sea relevante, propón nuevos goals y etiquétalos: [ACTION_ITEMS: goal1 | goal2 | goal3]
5. Si preguntan por inversores, da recs de VCs (2-3 frases conversacionales, sin tablas) y etiqueta: [VC_MATCH: nombre1, nombre2]

REGLAS ABSOLUTAS:
- NUNCA preguntes datos que ya están en "lo que ya sabes" arriba.
- UN tema a la vez. No hagas varias preguntas en el mismo mensaje.
- NUNCA uses tablas markdown — ni una sola, nunca.
- NUNCA uses ## o # encabezados de sección en tus respuestas.
- NUNCA escribas más de 4 párrafos cortos en un mensaje. Apunta a menos de 120 palabras.
- Escribe como si estuvieras enviando un mensaje de texto a un founder amigo, NO redactando un informe.
- SIEMPRE termina cada mensaje con exactamente una pregunta de seguimiento.
- Las métricas (MRR, usuarios, crecimiento) SÍ se pueden pedir UNA VEZ por sesión como actualización — enmarcalas como "la última vez tenías X, ¿cuál es el número ahora?"
- Si el founder dice "ok", "perfecto", "sí", "genial" después de los VCs → pasa a próximos pasos, no repitas el mensaje de VCs.
- SIEMPRE responde en español cuando el founder escribe en español.
${returningContext}${vcDatabaseText}`;

    const onboardingPrompt_en = `${personality_en}
${memory_en}
ONBOARDING FLOW — collect missing data ONE question at a time, then move to cofounder mode.

PHASES (only execute the NEXT incomplete one — skip all phases already in "what you already know"):
Phase 1 – INTRO: startup name + specific problem they solve.
Phase 2 – PRODUCT: how they solve it (key product/solution).
Phase 3 – TRACTION (one sub-question per turn):
  3a. Active users/customers right now (accept "0" or "none" and move on).
  3b. Revenue: MRR/ARR or pre-revenue (accept any answer).
  3c. Monthly growth rate last 30 days (accept "don't know" and move on).
Phase 4 – TEAM: team size + founders' backgrounds.
Phase 5 – GOAL-SETTING: propose 2-3 specific 4-week goals based on what you know. Ask which resonate. Tag: [ACTION_ITEMS: goal1 | goal2 | goal3]
Phase 6 – FUNDRAISING: how much to raise and at what stage.
Phase 7 – VC RECS: 2-3 warm conversational sentences (NO tables, NO lists). End with follow-up question. Tag: [VC_MATCH: name1, name2, name3]
Phase 8 – NEXT STEPS: 3-5 concrete actions. Tag: [ACTION_ITEMS: step1 | step2 | step3]

NEXT PHASE TO EXECUTE: ${nextPhase}

ABSOLUTE RULES:
- ONE question per message. Never two.
- NEVER ask for anything already collected (see "what you already know").
- NEVER use markdown tables — not even once.
- NEVER use ## or # section headers in your replies.
- NEVER write more than 4 short paragraphs. Under 120 words per message.
- Write like you're texting, NOT writing a report.
- ALWAYS end every message with exactly one question.
- If founder says "ok"/"sure" after VC recs → Phase 8, don't repeat VCs.
- ALWAYS respond in English when the founder writes in English.
${returningContext}${vcDatabaseText}`;

    const onboardingPrompt_es = `${personality_es}
${memory_es}
FLUJO DE ONBOARDING — recoge los datos que faltan UNA pregunta por turno, luego pasa a modo cofounder.

FASES (ejecuta solo la SIGUIENTE incompleta — salta todas las que ya están en "lo que ya sabes"):
Fase 1 – INTRO: nombre del startup + problema específico que resuelven.
Fase 2 – PRODUCTO: cómo lo resuelven (producto/solución clave).
Fase 3 – TRACCIÓN (una sub-pregunta por turno):
  3a. Usuarios/clientes activos ahora mismo (acepta "0" o "ninguno" y continúa).
  3b. Revenue: MRR/ARR o pre-revenue (acepta cualquier respuesta).
  3c. Tasa de crecimiento mensual últimos 30 días (acepta "no sé" y continúa).
Fase 4 – EQUIPO: tamaño del equipo + backgrounds de los fundadores.
Fase 5 – GOALS: propone 2-3 goals específicos para 4 semanas según lo que sabes. Pregunta cuáles resuenan. Tag: [ACTION_ITEMS: goal1 | goal2 | goal3]
Fase 6 – FUNDRAISING: cuánto levantar y en qué etapa.
Fase 7 – VCs: 2-3 frases conversacionales cálidas (SIN tablas, SIN listas). Termina con pregunta de seguimiento. Tag: [VC_MATCH: nombre1, nombre2, nombre3]
Fase 8 – PRÓXIMOS PASOS: 3-5 acciones concretas. Tag: [ACTION_ITEMS: paso1 | paso2 | paso3]

PRÓXIMA FASE A EJECUTAR: ${nextPhase}

REGLAS ABSOLUTAS:
- UNA pregunta por mensaje. Nunca dos.
- NUNCA preguntes nada que ya esté recopilado (ver "lo que ya sabes").
- NUNCA uses tablas markdown — ni una sola, nunca.
- NUNCA uses ## o # encabezados en tus respuestas.
- NUNCA escribas más de 4 párrafos cortos. Menos de 120 palabras por mensaje.
- Escribe como si estuvieras enviando un mensaje de texto, NO redactando un informe.
- SIEMPRE termina cada mensaje con exactamente una pregunta.
- Si el founder dice "ok"/"perfecto"/"sí" después de los VCs → Fase 8, no repitas los VCs.
- SIEMPRE responde en español cuando el founder escribe en español.
${returningContext}${vcDatabaseText}`;

    // ── Voice transcript extra instructions ─────────────────────────
    const voiceContext = isVoiceTranscript
      ? (detectedLang === 'en'
        ? `\n\nVOICE CHECK-IN TRANSCRIPT: The founder just recorded a 60-second voice note instead of typing. The transcript is below. Your job:
1. In 1-2 sentences, acknowledge what they shared (startup name, week summary, any specific wins or blockers they mentioned).
2. Identify the 2 most important things they mentioned that need more detail — ask about ONE of them now.
3. After this follow-up exchange, provide: matching VCs from the database (tag [VC_MATCH:...]) and 3-5 concrete weekly action items (tag [ACTION_ITEMS:...]).
Tone: warm, energetic, like a cofounder who just listened carefully. Keep it conversational, not robotic.`
        : `\n\nTRANSCRIPCIÓN DE VOICE CHECK-IN: El founder acaba de grabar una nota de voz de 60 segundos en lugar de escribir. La transcripción está abajo. Tu tarea:
1. En 1-2 frases, reconoce lo que compartió (nombre de la startup, resumen de la semana, logros o bloqueos mencionados).
2. Identifica las 2 cosas más importantes que mencionó y que necesitan más detalle — pregunta sobre UNA ahora.
3. Después de este intercambio, proporciona: VCs que encajen de la base de datos (etiqueta [VC_MATCH:...]) y 3-5 acciones concretas para la semana (etiqueta [ACTION_ITEMS:...]).
Tono: cálido, enérgico, como un cofounder que acaba de escuchar con atención. Conversacional, no robótico.`)
      : '';

    const systemPrompt = (detectedLang === 'en'
      ? (onboardingComplete ? cofounterPrompt_en : onboardingPrompt_en)
      : (onboardingComplete ? cofounterPrompt_es : onboardingPrompt_es)) + voiceContext;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'astro' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];
    if (cleanedMessage) messages.push({ role: 'user', content: cleanedMessage });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages, temperature: 0.75, max_tokens: 2000 })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json() as any;
    let aiResponse = data.choices[0]?.message?.content || '';

    // ── Extract [VC_MATCH: ...] tag ────────────────────────────────────
    const vcMatchRegex = /\[VC_MATCH:\s*([^\]]+)\]/i;
    const vcMatchResult = aiResponse.match(vcMatchRegex);
    let recommendedVCNames: string[] = [];
    let recommendedVCCards: any[] = [];

    if (vcMatchResult) {
      aiResponse = aiResponse.replace(vcMatchRegex, '').trim();
      recommendedVCNames = vcMatchResult[1].split(',').map((s: string) => s.trim());
      try {
        for (const vcName of recommendedVCNames.slice(0, 5)) {
          const vc = await c.env.DB.prepare(
            `SELECT * FROM venture_capitals WHERE name LIKE ? AND is_active = 1 LIMIT 1`
          ).bind(`%${vcName}%`).first() as any;
          if (vc) recommendedVCCards.push(vc);
        }
      } catch {}
    }

    // ── Extract [ACTION_ITEMS: ...] tag ───────────────────────────────
    const actionItemsRegex = /\[ACTION_ITEMS:\s*([^\]]+)\]/i;
    const actionItemsResult = aiResponse.match(actionItemsRegex);
    let actionItems: string[] = [];

    if (actionItemsResult) {
      aiResponse = aiResponse.replace(actionItemsRegex, '').trim();
      actionItems = actionItemsResult[1].split('|').map((s: string) => s.trim()).filter(Boolean);
    }

    const isVCRecommendation = recommendedVCCards.length > 0 || vcMatchResult !== null;

    // ── Extract metrics and save to DB ────────────────────────────────
    let extractedData: Record<string, any> = {};
    let dataSaved = false;
    let createdGoals: any[] = [];
    let updatedMetrics: Record<string, { prev: any; next: any }> = {};

    if (userId && message) {
      try {
        extractedData = await extractAstroMetrics(groqKey, conversationHistory, message);

        const metricKeys: { key: string; label: string; prefix?: string; suffix?: string }[] = [
          { key: 'mrr', label: 'MRR', prefix: '$' },
          { key: 'arr', label: 'ARR', prefix: '$' },
          { key: 'active_users', label: 'Usuarios activos' },
          { key: 'growth_rate_percent', label: 'Crecimiento mensual', prefix: '', suffix: '%' },
          { key: 'team_size', label: 'Equipo' },
        ];
        for (const { key, label, prefix = '', suffix = '' } of metricKeys) {
          const prev = priorSession?.[key];
          const next = extractedData[key];
          if (next && next > 0 && prev !== next) {
            updatedMetrics[key] = { prev: prev ? `${prefix}${prev}${suffix}` : null, next: `${prefix}${next}${suffix}` };
          }
        }

        const vcJson = isVCRecommendation ? JSON.stringify(recommendedVCNames) : undefined;
        await saveAstroData(
          c.env.DB, astroUserId!,
          { ...fullCollectedData, ...extractedData },
          vcJson,
          actionItems.length > 0 ? actionItems : undefined,
          detectedLang
        );
        dataSaved = true;

        // ── Save conversation messages to astro_messages ──────────────
        try {
          const sessionDate = new Date().toISOString().split('T')[0];
          await c.env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS astro_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              role TEXT NOT NULL,
              content TEXT NOT NULL,
              session_date TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run();
          if (message) {
            await c.env.DB.prepare(
              'INSERT INTO astro_messages (user_id, role, content, session_date) VALUES (?, ?, ?, ?)'
            ).bind(astroUserId, 'user', message, sessionDate).run();
          }
          if (aiResponse) {
            await c.env.DB.prepare(
              'INSERT INTO astro_messages (user_id, role, content, session_date) VALUES (?, ?, ?, ?)'
            ).bind(astroUserId, 'astro', aiResponse, sessionDate).run();
          }
        } catch (e) {
          console.error('[ASTRO-CHAT] Message save error:', e);
        }

        // ── Auto-create goals from action items ──────────────────────
        if (actionItems.length > 0) {
          const weekOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
          const userRecord = await c.env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first() as any;
          createdGoals = await createAstroGoals(c.env.DB, userId, actionItems, weekOf, userRecord?.name);
          console.log(`[ASTRO-GOALS] Auto-created ${createdGoals.length} goals for user ${userId}`);
        }
      } catch (e) {
        console.error('[ASTRO-CHAT] Save error:', e);
      }
    } else if (astroUserId && !message) {
      try {
        await c.env.DB.prepare('UPDATE astro_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE user_id = ?').bind(astroUserId).run();
      } catch {}
    }

    return c.json({
      response: aiResponse || (detectedLang === 'en'
        ? 'Hi! I\'m Astro, your AI Cofounder from ASTAR* ⚡ What\'s your startup name and what problem does it solve?'
        : '¡Hola! Soy Astro, tu AI Cofounder de ASTAR* ⚡ ¿Cómo se llama tu startup y qué problema resuelve?'),
      isVCRecommendation,
      recommendedVCCards,
      actionItems,
      createdGoals,
      updatedMetrics,
      extractedData,
      dataSaved,
      isReturningUser,
      isWeeklyReturn,
      pendingGoals: pendingAstroGoals,
      priorSession: isReturningUser ? {
        startup_name: priorSession?.startup_name,
        action_items: priorSession?.action_items,
        data_completeness: priorSession?.data_completeness,
      } : null
    });

  } catch (error) {
    console.error('[ASTRO-CHAT] Error:', error);
    return c.json({
      response: '¡Hola! Soy Astro, tu AI Cofounder de ASTAR* ⚡ ¿Cómo se llama tu startup y qué problema resuelve?',
      isVCRecommendation: false,
      recommendedVCCards: [],
      actionItems: [],
      extractedData: {},
      dataSaved: false,
      isReturningUser: false,
      isWeeklyReturn: false,
      priorSession: null
    });
  }
});

// GET /astro-profile — returns stored Astro session + matched VCs for the logged-in user
app.get('/astro-profile', async (c) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  if (!authToken) return c.json({ error: 'Not authenticated' }, 401);

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as any;
    const userId = payload.userId;

    const session = await c.env.DB.prepare('SELECT * FROM astro_sessions WHERE user_id = ?').bind(userId).first() as any;
    if (!session) return c.json({ session: null });

    let matchedVCs: any[] = [];
    if (session.fundraising_stage || session.sector) {
      const vcRows = await c.env.DB.prepare(`
        SELECT id, name, country, geography, stage, sectors,
               min_ticket_usd, max_ticket_usd, typical_equity_pct, website, description, portfolio_examples
        FROM venture_capitals
        WHERE is_active = 1
          AND (stage LIKE '%' || COALESCE(?,stage) || '%' OR ? IS NULL)
          AND (sectors LIKE '%' || COALESCE(?,sectors) || '%' OR ? IS NULL)
        ORDER BY
          CASE WHEN geography LIKE '%' || COALESCE(?,geography) || '%' THEN 0 ELSE 1 END
        LIMIT 6
      `).bind(
        session.fundraising_stage, session.fundraising_stage,
        session.sector, session.sector,
        session.geography
      ).all();
      matchedVCs = vcRows.results || [];
    }

    let pendingGoals: any[] = [];
    try {
      const goalsRes = await c.env.DB.prepare(`
        SELECT id, description, goal_status, week_of
        FROM goals
        WHERE user_id = ? AND goal_status != 'Done' AND status = 'active'
        ORDER BY created_at DESC LIMIT 5
      `).bind(userId).all();
      pendingGoals = goalsRes.results || [];
    } catch {}

    return c.json({ session, matchedVCs, pendingGoals });
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// ── Whisper Transcription endpoint ─────────────────────────────────────────
app.post('/transcribe', jwtMiddleware, async (c) => {
  const groqKey = c.env.GROQ_API_KEY;
  if (!groqKey) return c.json({ error: 'Groq API key not configured' }, 500);

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch (e) {
    return c.json({ error: 'Failed to parse audio upload' }, 400);
  }

  const audioFile = formData.get('audio') as File | null;
  if (!audioFile) return c.json({ error: 'No audio file found in request' }, 400);

  const groqForm = new FormData();
  groqForm.append('file', audioFile, audioFile.name || 'recording.webm');
  groqForm.append('model', 'whisper-large-v3-turbo');
  groqForm.append('temperature', '0');
  groqForm.append('response_format', 'json');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}` },
      body: groqForm,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[TRANSCRIBE] Groq Whisper error:', errText);
      return c.json({ error: 'Transcription failed', details: errText }, 500);
    }

    const result = await response.json() as { text: string };
    return c.json({ transcription: result.text || '' });
  } catch (e) {
    console.error('[TRANSCRIBE] Fetch error:', e);
    return c.json({ error: 'Network error calling Whisper API' }, 500);
  }
});

export default app;
