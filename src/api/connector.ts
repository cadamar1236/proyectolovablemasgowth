/**
 * AI Connector API
 * Endpoint for AI-powered user matching and networking suggestions
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// Railway API URL for the AI agent
const RAILWAY_API_URL = 'https://proyectolovablemasgowth-production.up.railway.app';

interface ConnectorMatch {
  id: number;
  name: string;
  user_type: string;
  industry?: string;
  country?: string;
  stage?: string;
  avatar?: string;
  bio?: string;
  score: number;
  reason: string;
}

interface ConnectorChatResponse {
  success: boolean;
  response: string;
  matches?: ConnectorMatch[];
  session_id?: string;
  error?: string;
}

/**
 * Get all users from database for matching (excluding current user)
 */
async function getAllUsersForMatching(c: any, excludeUserId: number | null): Promise<any[]> {
  try {
    let query = `
      SELECT 
        id, 
        name, 
        email, 
        role as user_type,
        location as country,
        company as industry,
        plan as stage,
        avatar_url, 
        bio, 
        linkedin_url,
        interests,
        skills,
        looking_for
      FROM users
      WHERE name IS NOT NULL AND name != ''
    `;
    const params: any[] = [];
    
    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }
    
    query += ` LIMIT 100`;  // Get up to 100 users for AI analysis
    
    console.log('Fetching users with query:', query);
    const result = await c.env.DB.prepare(query).bind(...params).all();
    console.log('DB returned:', result.results?.length || 0, 'users');
    
    // Convert to format expected by agent
    const users = (result.results || []).map((user: any) => ({
      id: user.id,
      name: user.name,
      full_name: user.name,
      email: user.email,
      user_type: user.user_type || 'founder',
      country: user.country || '',
      industry: user.industry || '',
      stage: user.stage || 'starter',
      avatar_url: user.avatar_url,
      bio: user.bio,
      linkedin_url: user.linkedin_url,
      interests: user.interests ? JSON.parse(user.interests) : [],
      skills: user.skills ? JSON.parse(user.skills) : [],
      looking_for: user.looking_for ? JSON.parse(user.looking_for) : []
    }));
    
    console.log('Returning', users.length, 'formatted users');
    return users;
  } catch (error) {
    console.error('Error getting users for matching:', error);
    return [];
  }
}

/**
 * POST /api/connector/chat
 * Main chat endpoint for AI connector suggestions
 */
app.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { message, session_id } = body;
    
    if (!message) {
      return c.json({ success: false, error: 'Message is required' }, 400);
    }
    
    // Get user from auth token
    const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                      c.req.header('Authorization')?.replace('Bearer ', '');
    
    let userId: number | null = null;
    let userProfile: any = null;
    
    if (authToken) {
      try {
        const { verify } = await import('hono/jwt');
        const payload = await verify(authToken, 'your-secret-key-change-in-production-use-env-var') as any;
        userId = payload.userId;
        
        // Get user profile for better matching
        const userResult = await c.env.DB.prepare(`
          SELECT id, name, email, user_type, country, industry, stage, bio, linkedin_url
          FROM users WHERE id = ?
        `).bind(userId).first();
        
        userProfile = userResult;
      } catch (e) {
        console.error('Auth error:', e);
      }
    }
    
    // PRIORITY: Call Railway API for AI-powered matching
    // The Python agent analyzes profiles and makes intelligent connections
    try {
      // Get all available users for the agent to analyze
      const availableUsers = await getAllUsersForMatching(c, userId);
      
      console.log(`Calling Railway AI Agent with ${availableUsers.length} users...`);
      
      const railwayResponse = await fetch(`${RAILWAY_API_URL}/api/connector/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: session_id || `session_${Date.now()}`,
          user_id: userId,
          user_profile: userProfile,
          available_users: availableUsers  // Send users to agent
        })
      });
      
      console.log(`Railway API response status: ${railwayResponse.status}`);
      
      if (railwayResponse.ok) {
        const data = await railwayResponse.json() as ConnectorChatResponse;
        
        console.log(`Railway AI returned ${data.matches?.length || 0} matches`);
        
        // Save Railway AI suggestions if we have a user
        if (userId && data.matches && data.matches.length > 0) {
          await saveSuggestions(c, userId, data.matches, message);
        }
        
        return c.json({
          ...data,
          source: 'railway_ai'  // Indicate this came from AI agent
        });
      } else {
        const errorText = await railwayResponse.text();
        console.error('Railway API error:', railwayResponse.status, errorText);
      }
    } catch (railwayError) {
      console.error('Railway AI Agent error:', railwayError);
    }
    
    // Fallback: Smart local matching - ALWAYS returns results
    console.log('Using local fallback matching...');
    const matches = await findSmartMatches(c, message, userId, userProfile);
    
    // Save suggestions to database
    if (userId && matches.length > 0) {
      await saveSuggestions(c, userId, matches, message);
    }
    
    const response = generateSmartResponse(message, matches, userProfile);
    
    return c.json({
      success: true,
      response: response + '\n\n💡 _Nota: Usando matching local (Railway AI no disponible)_',
      matches: matches,
      session_id: session_id || `session_${Date.now()}`,
      source: 'local_fallback'
    });
    
  } catch (error) {
    console.error('Connector chat error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

/**
 * Smart local matching - ALWAYS returns results
 * Analyzes user profiles and scores matches based on multiple criteria
 */
async function findSmartMatches(
  c: any, 
  message: string, 
  userId: number | null,
  userProfile: any
): Promise<ConnectorMatch[]> {
  const msg = message.toLowerCase();
  
  // Determine what type of users to search for
  let userTypes: string[] = [];
  let industries: string[] = [];
  let searchTerm = '';
  
  // Detect user types from message
  if (msg.includes('founder') || msg.includes('emprendedor')) {
    userTypes.push('founder');
  }
  if (msg.includes('investor') || msg.includes('inversor') || msg.includes('inversión') || msg.includes('funding')) {
    userTypes.push('investor');
  }
  if (msg.includes('validator') || msg.includes('validador') || msg.includes('experto')) {
    userTypes.push('validator');
  }
  if (msg.includes('partner') || msg.includes('socio') || msg.includes('colaborar')) {
    userTypes.push('partner');
  }
  if (msg.includes('talent') || msg.includes('talento') || msg.includes('desarrollador') || msg.includes('designer')) {
    userTypes.push('talent');
  }
  if (msg.includes('scout')) {
    userTypes.push('scout');
  }
  
  // If no specific type detected, search all types
  if (userTypes.length === 0) {
    userTypes = ['founder', 'investor', 'validator', 'partner', 'talent', 'scout'];
  }
  
  // Detect industries
  const industryKeywords: { [key: string]: string } = {
    'saas': 'SaaS',
    'fintech': 'Fintech',
    'healthtech': 'Healthcare',
    'health': 'Healthcare',
    'ecommerce': 'E-commerce',
    'e-commerce': 'E-commerce',
    'ai': 'AI/ML',
    'artificial intelligence': 'AI/ML',
    'machine learning': 'AI/ML',
    'edtech': 'EdTech',
    'education': 'EdTech',
    'marketplace': 'Marketplace',
    'mobile': 'Mobile',
    'b2b': 'B2B',
    'b2c': 'B2C'
  };
  
  for (const [keyword, industry] of Object.entries(industryKeywords)) {
    if (msg.includes(keyword)) {
      industries.push(industry);
    }
  }
  
  // Build query - Get MORE users for better scoring
  // Start with a simple query that will definitely return results
  let query = `
    SELECT id, name, user_type, country, industry, stage, avatar_url as avatar, bio, email
    FROM users
    WHERE 1=1
  `;
  const params: any[] = [];
  
  // Exclude current user
  if (userId) {
    query += ` AND id != ?`;
    params.push(userId);
  }
  
  // Don't filter by type initially - get all users and score them
  query += ` ORDER BY RANDOM() LIMIT 50`;
  
  try {
    console.log('Executing query for matches...');
    const result = await c.env.DB.prepare(query).bind(...params).all();
    let users = result.results || [];
    
    console.log(`Found ${users.length} users from database`);
    
    // If still no users, there's a database issue
    if (users.length === 0) {
      console.error('No users in database at all!');
      return [];
    }
    
    // INTELLIGENT SCORING based on multiple criteria
    const scoredMatches = users.map((user: any) => {
      const { score, reasons } = calculateMatchScore(user, userProfile, { userTypes, industries }, msg);
      
      return {
        id: user.id,
        name: user.name || 'Usuario',
        user_type: user.user_type || 'entrepreneur',
        industry: user.industry,
        country: user.country,
        stage: user.stage,
        avatar: user.avatar,
        bio: user.bio,
        score: score,
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : getDefaultReason(user, userProfile)
      };
    });
    
    // Sort by score - best matches first
    scoredMatches.sort((a: ConnectorMatch, b: ConnectorMatch) => b.score - a.score);
    
    // Return top 9 matches
    return scoredMatches.slice(0, 9);
    
  } catch (dbError) {
    console.error('Database error finding matches:', dbError);
    return [];
  }
}

/**
 * Calculate intelligent match score based on multiple criteria
 */
function calculateMatchScore(
  user: any,
  currentUser: any,
  searchIntent: { userTypes: string[]; industries: string[] },
  message: string
): { score: number; reasons: string[] } {
  let score = 0.3; // Base score - everyone starts with some relevance
  const reasons: string[] = [];
  
  // 1. User type match (high weight)
  if (searchIntent.userTypes.length > 0 && user.user_type) {
    if (searchIntent.userTypes.includes(user.user_type)) {
      score += 0.25;
      const typeLabels: { [key: string]: string } = {
        'founder': '🚀 Emprendedor',
        'investor': '💰 Inversor',
        'validator': '✅ Validador',
        'partner': '🤝 Partner',
        'talent': '👨‍💻 Talento',
        'scout': '🔍 Scout'
      };
      reasons.push(typeLabels[user.user_type] || user.user_type);
    }
  }
  
  // 2. Industry match
  if (searchIntent.industries.length > 0 && user.industry) {
    const userIndustry = user.industry.toLowerCase();
    for (const industry of searchIntent.industries) {
      if (userIndustry.includes(industry.toLowerCase())) {
        score += 0.2;
        reasons.push(`Industria: ${user.industry}`);
        break;
      }
    }
  } else if (currentUser?.industry && user.industry) {
    if (user.industry.toLowerCase().includes(currentUser.industry.toLowerCase()) ||
        currentUser.industry.toLowerCase().includes(user.industry.toLowerCase())) {
      score += 0.15;
      reasons.push(`Misma industria: ${user.industry}`);
    }
  }
  
  // 3. Country/Location match
  if (currentUser?.country && user.country) {
    if (user.country.toLowerCase() === currentUser.country.toLowerCase()) {
      score += 0.1;
      reasons.push(`📍 ${user.country}`);
    }
  }
  
  // 4. Stage match
  if (currentUser?.stage && user.stage) {
    if (user.stage === currentUser.stage) {
      score += 0.05;
      reasons.push(`Stage: ${user.stage}`);
    }
  }
  
  // 5. Bio keyword match
  if (user.bio && message) {
    const bioLower = user.bio.toLowerCase();
    const words = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matches = words.filter((word: string) => bioLower.includes(word));
    if (matches.length > 0) {
      score += Math.min(matches.length * 0.05, 0.15);
      reasons.push('Intereses afines');
    }
  }
  
  // 6. Complementary matches
  if (currentUser?.user_type && user.user_type) {
    const complementary: { [key: string]: string[] } = {
      'founder': ['investor', 'validator', 'talent', 'partner'],
      'investor': ['founder'],
      'validator': ['founder'],
      'talent': ['founder', 'partner'],
      'partner': ['founder', 'talent'],
      'scout': ['founder', 'investor']
    };
    
    if (complementary[currentUser.user_type]?.includes(user.user_type)) {
      score += 0.1;
      if (reasons.length === 0) {
        reasons.push('Conexión complementaria');
      }
    }
  }
  
  // Ensure score is between 0.3 and 1
  score = Math.max(0.3, Math.min(1, score));
  
  return { score, reasons };
}

/**
 * Get default reason when no specific matches
 */
function getDefaultReason(user: any, currentUser: any): string {
  const defaults = [
    'Miembro activo de ASTAR',
    'Conexión potencial interesante',
    'Perfil relevante para tu red',
    'Oportunidad de colaboración',
    'Expande tu red de contactos'
  ];
  
  if (user.industry) {
    return `Trabaja en ${user.industry}. ${defaults[0]}`;
  }
  if (user.user_type) {
    const typeLabels: { [key: string]: string } = {
      'founder': 'Emprendedor',
      'investor': 'Inversor',
      'validator': 'Validador/Experto',
      'partner': 'Partner potencial',
      'talent': 'Talento disponible',
      'scout': 'Scout'
    };
    return `${typeLabels[user.user_type] || user.user_type}. ${defaults[Math.floor(Math.random() * defaults.length)]}`;
  }
  
  return defaults[Math.floor(Math.random() * defaults.length)];
}

/**
 * Save suggestions to database
 */
async function saveSuggestions(
  c: any,
  userId: number,
  matches: ConnectorMatch[],
  query: string
): Promise<void> {
  try {
    for (const match of matches) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO connector_suggestions (user_id, suggested_user_id, score, reason, query, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
      `).bind(userId, match.id, match.score, match.reason, query).run();
    }
  } catch (error) {
    console.error('Error saving suggestions:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Generate smart response based on the query and matches
 */
function generateSmartResponse(message: string, matches: ConnectorMatch[], userProfile: any): string {
  const msg = message.toLowerCase();
  
  if (matches.length === 0) {
    return "🔍 Estoy analizando perfiles en nuestra comunidad. De momento no tenemos muchos usuarios activos, pero pronto habrá más. ¡Invita a otros emprendedores a unirse a ASTAR! 🚀";
  }
  
  // Count by type
  const typeCounts: { [key: string]: number } = {};
  matches.forEach(m => {
    const type = m.user_type || 'other';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  const typeLabels: { [key: string]: string } = {
    'founder': 'emprendedor(es)',
    'investor': 'inversor(es)',
    'validator': 'validador(es)',
    'partner': 'partner(s)',
    'talent': 'talento(s)',
    'scout': 'scout(s)'
  };
  
  const countText = Object.entries(typeCounts)
    .map(([type, count]) => `${count} ${typeLabels[type] || type}`)
    .join(', ');
  
  // Personalized intro
  let intro = '🎯 ';
  if (msg.includes('inversor') || msg.includes('investor')) intro = '💰 ';
  else if (msg.includes('founder') || msg.includes('emprendedor')) intro = '🚀 ';
  else if (msg.includes('validator') || msg.includes('validador')) intro = '✅ ';
  else if (msg.includes('partner') || msg.includes('socio')) intro = '🤝 ';
  else if (msg.includes('talent') || msg.includes('talento')) intro = '👨‍💻 ';
  
  // Match quality
  const avgScore = matches.reduce((sum, m) => sum + (m.score || 0), 0) / matches.length;
  
  // List top 3 matches by name for context
  const topNames = matches.slice(0, 3).map(m => m.name).join(', ');
  
  if (avgScore > 0.7) {
    return `${intro}¡Excelentes matches! He analizado los perfiles y encontré ${matches.length} conexiones muy relevantes (${countText}). Los mejores matches son: ${topNames}. La IA ha identificado que estos perfiles coinciden muy bien con lo que buscas. ¡Haz clic en "Connect" para iniciar conversación! 🔥`;
  } else if (avgScore > 0.5) {
    return `${intro}He analizado ${matches.length} perfiles de la comunidad y encontré estas conexiones (${countText}). Entre ellos: ${topNames}. Los he ordenado por relevancia basándome en intereses comunes, industria y objetivos. ¡Explora las opciones! 🤝`;
  } else {
    return `${intro}He analizado todos los perfiles disponibles y aquí tienes ${matches.length} miembros de ASTAR (${countText}), incluyendo: ${topNames}. Aunque no todos coinciden exactamente con tu búsqueda, podrían ser conexiones valiosas. ¡Las mejores oportunidades a veces vienen de donde menos esperas! 🌟`;
  }
}

/**
 * GET /api/connector/session/:id
 * Get session history
 */
app.get('/session/:id', async (c) => {
  const sessionId = c.req.param('id');
  
  // For now, sessions are stored in frontend localStorage
  // In production, you might want to store them in D1
  return c.json({
    success: true,
    session_id: sessionId,
    messages: []
  });
});

/**
 * DELETE /api/connector/session/:id
 * Clear session history
 */
app.delete('/session/:id', async (c) => {
  const sessionId = c.req.param('id');
  
  return c.json({
    success: true,
    message: 'Session cleared',
    session_id: sessionId
  });
});

/**
 * GET /api/connector/ai-suggestions
 * Get AI-suggested connections for the current user
 */
app.get('/ai-suggestions', async (c) => {
  try {
    // Get user from auth token
    const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1] ||
                      c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    
    const { verify } = await import('hono/jwt');
    const payload = await verify(authToken, 'your-secret-key-change-in-production-use-env-var') as any;
    const userId = payload.userId;
    
    // Get user profile
    const userResult = await c.env.DB.prepare(`
      SELECT id, name, email, user_type, country, industry, stage
      FROM users WHERE id = ?
    `).bind(userId).first() as any;
    
    if (!userResult) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    // Find complementary users
    let matches: ConnectorMatch[] = [];
    
    // For founders: suggest investors and validators in same industry
    if (userResult.user_type === 'founder') {
      const investorsAndValidators = await c.env.DB.prepare(`
        SELECT id, name, user_type, country, industry, stage, avatar_url as avatar
        FROM users
        WHERE user_type IN ('investor', 'validator')
        AND id != ?
        ${userResult.industry ? `AND (industry LIKE ? OR industry IS NULL)` : ''}
        LIMIT 6
      `).bind(userId, userResult.industry ? `%${userResult.industry}%` : '').all();
      
      matches = (investorsAndValidators.results || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        user_type: u.user_type,
        industry: u.industry,
        country: u.country,
        stage: u.stage,
        avatar: u.avatar,
        score: 0.7,
        reason: `Suggested based on your ${userResult.industry || 'startup'} focus`
      }));
    }
    
    // For investors: suggest founders in their interest areas
    if (userResult.user_type === 'investor') {
      const founders = await c.env.DB.prepare(`
        SELECT id, name, user_type, country, industry, stage, avatar_url as avatar
        FROM users
        WHERE user_type = 'founder'
        AND id != ?
        ${userResult.industry ? `AND industry LIKE ?` : ''}
        LIMIT 6
      `).bind(userId, userResult.industry ? `%${userResult.industry}%` : '').all();
      
      matches = (founders.results || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        user_type: u.user_type,
        industry: u.industry,
        country: u.country,
        stage: u.stage,
        avatar: u.avatar,
        score: 0.7,
        reason: `Promising founder in ${u.industry || 'your interest area'}`
      }));
    }
    
    return c.json({
      success: true,
      suggestions: matches
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

/**
 * GET /api/connector/suggestions
 * Get saved AI-generated suggestions for current user
 */
app.get('/suggestions', async (c) => {
  try {
    // Get auth token
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ success: false, error: 'No token provided' }, 401);
    }

    // Decode JWT to get user ID
    let userId: number | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch (e) {
      console.error('Token decode error:', e);
    }

    if (!userId) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    // Get saved suggestions from database
    const result = await c.env.DB.prepare(`
      SELECT 
        cs.id,
        cs.suggested_user_id,
        cs.score,
        cs.reason,
        cs.created_at,
        u.name,
        u.role as user_type,
        u.avatar_url as avatar,
        u.company as industry,
        u.location as country,
        u.bio
      FROM connector_suggestions cs
      JOIN users u ON cs.suggested_user_id = u.id
      WHERE cs.user_id = ?
      AND cs.status = 'pending'
      ORDER BY cs.created_at DESC
    `).bind(userId).all();

    const suggestions = (result.results || []).map((s: any) => ({
      id: s.suggested_user_id,
      suggestion_id: s.id,
      suggested_user_id: s.suggested_user_id,
      name: s.name,
      user_type: s.user_type || 'founder',
      avatar: s.avatar,
      industry: s.industry,
      country: s.country,
      bio: s.bio,
      score: s.score,
      reason: s.reason,
      created_at: s.created_at
    }));

    return c.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error loading suggestions:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
