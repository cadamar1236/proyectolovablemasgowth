/**
 * Competitions API
 * Handle startup competitions, registrations, and winners
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

const competitions = new Hono<{ Bindings: Bindings }>();

// SECURITY: No hardcoded fallback - JWT_SECRET must be configured in environment
function getJWTSecret(env: Bindings): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return env.JWT_SECRET;
}

// JWT middleware
const jwtMiddleware = async (c: any, next: any) => {
  const authToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                   c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                   c.req.header('Cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.json({ error: 'No authentication token provided' }, 401);
  }

  try {
    const payload = await verify(authToken, getJWTSecret(c.env)) as any;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
};

// Get all active competitions
competitions.get('/', async (c) => {
  try {
    const type = c.req.query('type'); // 'weekly' or 'monthly'
    const status = c.req.query('status') || 'active';

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT cp.id) as participant_count,
        (SELECT COUNT(*) FROM competition_participants WHERE competition_id = c.id AND payment_status = 'completed') as paid_count
      FROM competitions c
      LEFT JOIN competition_participants cp ON c.id = cp.competition_id
      WHERE c.status = ?
    `;

    const params: any[] = [status];

    if (type) {
      query += ' AND c.competition_type = ?';
      params.push(type);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ competitions: result.results || [] });
  } catch (error) {
    console.error('[COMPETITIONS] Error fetching competitions:', error);
    return c.json({ error: 'Failed to fetch competitions' }, 500);
  }
});

// Get competition details
competitions.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const competition = await c.env.DB.prepare(`
      SELECT * FROM competitions WHERE id = ?
    `).bind(id).first();

    if (!competition) {
      return c.json({ error: 'Competition not found' }, 404);
    }

    // Get participants
    const participants = await c.env.DB.prepare(`
      SELECT 
        cp.*,
        u.name,
        u.email,
        u.avatar_url
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.competition_id = ?
      ORDER BY cp.registration_date DESC
    `).bind(id).all();

    // Get winners
    const winners = await c.env.DB.prepare(`
      SELECT 
        cw.*,
        u.name,
        u.email,
        u.avatar_url,
        cp.startup_name
      FROM competition_winners cw
      JOIN users u ON cw.user_id = u.id
      LEFT JOIN competition_participants cp ON cw.competition_id = cp.competition_id AND cw.user_id = cp.user_id
      WHERE cw.competition_id = ?
      ORDER BY cw.position ASC
    `).bind(id).all();

    return c.json({
      competition,
      participants: participants.results || [],
      winners: winners.results || []
    });
  } catch (error) {
    console.error('[COMPETITIONS] Error fetching competition details:', error);
    return c.json({ error: 'Failed to fetch competition details' }, 500);
  }
});

// Register for competition
competitions.post('/:id/register', jwtMiddleware, async (c) => {
  try {
    const competitionId = c.req.param('id');
    const user = c.get('user') as any;
    const { project_id, startup_name, pitch_deck_url, submission_notes } = await c.req.json();

    // Check if competition exists
    const competition = await c.env.DB.prepare(`
      SELECT * FROM competitions WHERE id = ? AND status = 'active'
    `).bind(competitionId).first();

    if (!competition) {
      return c.json({ error: 'Competition not found or closed' }, 404);
    }

    // Check if already registered
    const existing = await c.env.DB.prepare(`
      SELECT id FROM competition_participants 
      WHERE competition_id = ? AND user_id = ?
    `).bind(competitionId, user.userId).first();

    if (existing) {
      return c.json({ error: 'Already registered for this competition' }, 400);
    }

    // Get project or product details if project_id provided
    let projectData = null;
    if (project_id) {
      // Try to find in projects table first
      projectData = await c.env.DB.prepare(`
        SELECT id, title, description FROM projects 
        WHERE id = ? AND user_id = ?
      `).bind(project_id, user.userId).first();

      // If not found in projects, try beta_products table
      if (!projectData) {
        projectData = await c.env.DB.prepare(`
          SELECT id, title, description FROM beta_products 
          WHERE id = ? AND company_user_id = ?
        `).bind(project_id, user.userId).first();
      }

      if (!projectData) {
        return c.json({ error: 'Project/Product not found or does not belong to you' }, 404);
      }
    }

    // Register participant
    await c.env.DB.prepare(`
      INSERT INTO competition_participants 
      (competition_id, user_id, project_id, startup_name, pitch_deck_url, submission_notes, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      competitionId,
      user.userId,
      project_id || null,
      startup_name || (projectData ? projectData.title : null),
      pitch_deck_url || null,
      submission_notes || (projectData ? projectData.description : null),
      competition.ticket_required ? 'pending' : 'completed'
    ).run();

    return c.json({
      success: true,
      message: 'Successfully registered for competition',
      requires_payment: competition.ticket_required ? true : false,
      payment_link: competition.payment_link || null
    });
  } catch (error) {
    console.error('[COMPETITIONS] Error registering for competition:', error);
    return c.json({ error: 'Failed to register for competition' }, 500);
  }
});

// Update payment status (after successful payment)
competitions.post('/:id/payment', jwtMiddleware, async (c) => {
  try {
    const competitionId = c.req.param('id');
    const user = c.get('user') as any;
    const { payment_id, payment_status } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE competition_participants 
      SET payment_status = ?, payment_id = ?
      WHERE competition_id = ? AND user_id = ?
    `).bind(payment_status, payment_id, competitionId, user.userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[COMPETITIONS] Error updating payment:', error);
    return c.json({ error: 'Failed to update payment' }, 500);
  }
});

// Check if user is registered
competitions.get('/:id/check-registration', jwtMiddleware, async (c) => {
  try {
    const competitionId = c.req.param('id');
    const user = c.get('user') as any;

    const registration = await c.env.DB.prepare(`
      SELECT * FROM competition_participants 
      WHERE competition_id = ? AND user_id = ?
    `).bind(competitionId, user.userId).first();

    return c.json({
      registered: !!registration,
      registration: registration || null
    });
  } catch (error) {
    console.error('[COMPETITIONS] Error checking registration:', error);
    return c.json({ error: 'Failed to check registration' }, 500);
  }
});

// Submit vote for a participant (validators and investors only)
competitions.post('/:id/participants/:participantId/vote', jwtMiddleware, async (c) => {
  try {
    const competitionId = c.req.param('id');
    const participantId = c.req.param('participantId');
    const user = c.get('user') as any;

    // Check if user is validator or investor
    if (user.role !== 'validator' && user.role !== 'investor') {
      return c.json({ error: 'Only validators and investors can vote' }, 403);
    }

    const { vote_score, comment } = await c.req.json();

    if (!vote_score || vote_score < 1 || vote_score > 10) {
      return c.json({ error: 'Vote score must be between 1 and 10' }, 400);
    }

    // Insert or update vote
    await c.env.DB.prepare(`
      INSERT INTO competition_votes 
        (competition_id, participant_id, voter_id, voter_role, vote_score, comment)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(competition_id, participant_id, voter_id) 
      DO UPDATE SET 
        vote_score = excluded.vote_score,
        comment = excluded.comment,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      competitionId,
      participantId,
      user.userId,
      user.role,
      vote_score,
      comment || null
    ).run();

    // Recalculate rankings for this competition
    await recalculateRankings(c.env.DB, parseInt(competitionId));

    return c.json({ success: true, message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('[COMPETITIONS] Error submitting vote:', error);
    return c.json({ error: 'Failed to submit vote' }, 500);
  }
});

// Get votes for a participant
competitions.get('/:id/participants/:participantId/votes', async (c) => {
  try {
    const participantId = c.req.param('participantId');

    const votes = await c.env.DB.prepare(`
      SELECT 
        cv.*,
        u.name as voter_name,
        u.avatar_url as voter_avatar
      FROM competition_votes cv
      JOIN users u ON cv.voter_id = u.id
      WHERE cv.participant_id = ?
      ORDER BY cv.created_at DESC
    `).bind(participantId).all();

    return c.json({ votes: votes.results || [] });
  } catch (error) {
    console.error('[COMPETITIONS] Error fetching votes:', error);
    return c.json({ error: 'Failed to fetch votes' }, 500);
  }
});

// Get leaderboard with rankings
competitions.get('/:id/leaderboard-data', async (c) => {
  try {
    const competitionId = c.req.param('id');

    // Get participants with basic info
    const participantsResult = await c.env.DB.prepare(`
      SELECT 
        cp.id,
        cp.user_id,
        cp.competition_id,
        cp.project_id,
        cp.startup_name,
        cp.pitch_deck_url,
        cp.submission_notes,
        cp.payment_status,
        cp.registration_date,
        cp.total_score,
        cp.vote_score,
        cp.growth_score,
        cp.current_rank,
        u.name,
        u.email,
        u.avatar_url,
        p.title as project_title,
        p.description as project_description
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN projects p ON cp.project_id = p.id
      WHERE cp.competition_id = ?
      ORDER BY cp.current_rank ASC, cp.total_score DESC
    `).bind(competitionId).all();

    const participants = participantsResult.results || [];

    // Get vote counts and averages separately
    const participantsWithVotes = await Promise.all(
      participants.map(async (p: any) => {
        try {
          const voteStats = await c.env.DB.prepare(`
            SELECT 
              COUNT(*) as vote_count,
              AVG(vote_score) as avg_vote_score
            FROM competition_votes
            WHERE participant_id = ?
          `).bind(p.id).first();

          return {
            ...p,
            vote_count: voteStats?.vote_count || 0,
            avg_vote_score: voteStats?.avg_vote_score || null
          };
        } catch (err) {
          console.error('[COMPETITIONS] Error fetching votes for participant:', p.id, err);
          return {
            ...p,
            vote_count: 0,
            avg_vote_score: null
          };
        }
      })
    );

    return c.json({ participants: participantsWithVotes });
  } catch (error) {
    console.error('[COMPETITIONS] Error fetching leaderboard:', error);
    return c.json({ error: 'Failed to fetch leaderboard', details: error.message }, 500);
  }
});

// Admin: Announce winners
competitions.post('/:id/winners', jwtMiddleware, async (c) => {
  try {
    const competitionId = c.req.param('id');
    const user = c.get('user') as any;
    
    // Check if admin
    if (user.role !== 'admin' && user.email !== 'cadamar1236@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const { winners } = await c.req.json(); // [{ user_id, position, prize_amount }]

    for (const winner of winners) {
      await c.env.DB.prepare(`
        INSERT INTO competition_winners (competition_id, user_id, position, prize_amount)
        VALUES (?, ?, ?, ?)
      `).bind(competitionId, winner.user_id, winner.position, winner.prize_amount).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[COMPETITIONS] Error announcing winners:', error);
    return c.json({ error: 'Failed to announce winners' }, 500);
  }
});

/**
 * Recalculate rankings for all participants in a competition
 * Formula: total_score = (vote_score * weight) + growth_score
 * - Investor votes have 2x weight
 * - Validator votes have 1x weight
 * - Growth score based on goals completed
 */
async function recalculateRankings(db: any, competitionId: number) {
  try {
    // Get all participants
    const participants = await db.prepare(`
      SELECT id, user_id, project_id FROM competition_participants
      WHERE competition_id = ?
    `).bind(competitionId).all();

    for (const participant of participants.results || []) {
      // Calculate vote score (weighted average)
      const voteResult = await db.prepare(`
        SELECT 
          SUM(CASE WHEN voter_role = 'investor' THEN vote_score * 2 ELSE vote_score END) as weighted_sum,
          SUM(CASE WHEN voter_role = 'investor' THEN 2 ELSE 1 END) as total_weight
        FROM competition_votes
        WHERE participant_id = ?
      `).bind(participant.id).first();

      const voteScore = voteResult?.weighted_sum && voteResult?.total_weight 
        ? (voteResult.weighted_sum / voteResult.total_weight) 
        : 0;

      // Calculate growth score based on goals completed
      let growthScore = 0;
      if (participant.user_id) {
        const goalsResult = await db.prepare(`
          SELECT 
            COUNT(*) as total_goals,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals
          FROM goals
          WHERE user_id = ?
        `).bind(participant.user_id).first();

        const totalGoals = goalsResult?.total_goals || 0;
        const completedGoals = goalsResult?.completed_goals || 0;
        
        // Growth score: 10 points per completed goal, bonus for completion rate
        growthScore = (completedGoals * 10) + (totalGoals > 0 ? (completedGoals / totalGoals) * 20 : 0);
      }

      // Total score combines votes and growth
      const totalScore = voteScore + growthScore;

      // Update participant scores
      await db.prepare(`
        UPDATE competition_participants
        SET 
          vote_score = ?,
          growth_score = ?,
          total_score = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(voteScore, growthScore, totalScore, participant.id).run();
    }

    // Update rankings based on total_score
    const rankedParticipants = await db.prepare(`
      SELECT id FROM competition_participants
      WHERE competition_id = ?
      ORDER BY total_score DESC, registration_date ASC
    `).bind(competitionId).all();

    let rank = 1;
    for (const p of rankedParticipants.results || []) {
      await db.prepare(`
        UPDATE competition_participants
        SET current_rank = ?
        WHERE id = ?
      `).bind(rank, p.id).run();
      rank++;
    }

    console.log(`[COMPETITIONS] Rankings recalculated for competition ${competitionId}`);
  } catch (error) {
    console.error('[COMPETITIONS] Error recalculating rankings:', error);
  }
}

export default competitions;
