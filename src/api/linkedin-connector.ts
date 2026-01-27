/**
 * LinkedIn Connector API
 * Endpoints para chat conversacional con el agente de LinkedIn
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from '../types';

// SECURITY: No hardcoded fallback - JWT_SECRET must be configured in environment
function getJWTSecret(env: Bindings): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return env.JWT_SECRET;
}

const RAILWAY_API_URL = 'https://proyectolovablemasgowth-production.up.railway.app';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware de autenticación
app.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = await verify(token, getJWTSecret(c.env));
    c.set('userId', decoded.userId as number);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// POST /api/linkedin-connector/chat - Chat conversacional
app.post('/chat', async (c) => {
  try {
    const userId = c.get('userId');
    const { message, sessionId } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }
    
    // Llamar al backend de Railway
    const response = await fetch(`${RAILWAY_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId || `user_${userId}`,
        user_id: String(userId)
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: `Railway API error: ${error}` }, response.status);
    }
    
    const data = await response.json();
    return c.json(data);
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return c.json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Tipo de búsqueda
interface SearchRequest {
  type: 'investor' | 'talent' | 'customer' | 'partner';
  query: string;
  filters?: {
    location?: string;
    industry?: string;
    stage?: string;
    skills?: string[];
    companySize?: string;
  };
  maxResults?: number;
}

// Perfil de LinkedIn simulado
interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  industry: string;
  profileUrl: string;
  photoUrl?: string;
  connections?: number;
  about?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  compatibilityScore: number;
  matchReasons: string[];
  selected?: boolean;
}

// POST /api/linkedin-connector/search - Buscar perfiles
app.post('/search', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json() as SearchRequest;
    const { type, query, filters = {}, maxResults = 20 } = body;

    // Simulación de resultados (en producción, esto conectaría con Apify/LinkedIn API)
    const mockProfiles = generateMockProfiles(type, query, filters, maxResults);

    return c.json({
      success: true,
      type,
      query,
      totalResults: mockProfiles.length,
      profiles: mockProfiles
    });
  } catch (error) {
    console.error('Error searching LinkedIn profiles:', error);
    return c.json({ error: 'Failed to search profiles' }, 500);
  }
});

// POST /api/linkedin-connector/analyze - Analizar compatibilidad
app.post('/analyze', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json() as {
      profileId: string;
      targetCriteria: string;
      companyDescription?: string;
    };

    // Análisis de compatibilidad simulado
    const analysis = {
      profileId: body.profileId,
      compatibilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
      matchReasons: [
        'Experience in target industry',
        'Active in startup ecosystem',
        'Geographic alignment',
        'Investment stage matches'
      ],
      recommendedApproach: 'Direct message highlighting mutual interests',
      talkingPoints: [
        'Shared interest in AI/ML applications',
        'Recent investment in similar space',
        'Mutual connections identified'
      ],
      confidence: 'high'
    };

    return c.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing compatibility:', error);
    return c.json({ error: 'Failed to analyze profile' }, 500);
  }
});

// POST /api/linkedin-connector/generate-message - Generar mensaje de conexión
app.post('/generate-message', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json() as {
      profileIds: string[];
      purpose: 'investment' | 'partnership' | 'hiring' | 'mentorship';
      senderInfo: {
        name: string;
        company: string;
        title: string;
      };
      customNotes?: string;
    };

    const messages = body.profileIds.map(profileId => ({
      profileId,
      subject: generateSubject(body.purpose),
      message: generateMessage(body.purpose, body.senderInfo, body.customNotes),
      characterCount: 280,
      followUpSchedule: ['Day 3', 'Day 7', 'Day 14']
    }));

    return c.json({
      success: true,
      messages,
      totalMessages: messages.length
    });
  } catch (error) {
    console.error('Error generating messages:', error);
    return c.json({ error: 'Failed to generate messages' }, 500);
  }
});

// POST /api/linkedin-connector/save-connections - Guardar conexiones seleccionadas
app.post('/save-connections', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json() as {
      profiles: LinkedInProfile[];
      campaign: string;
      notes?: string;
    };

    const db = c.env.DB;
    
    // Guardar conexiones en la base de datos
    const insertPromises = body.profiles.map(profile => {
      return db.prepare(`
        INSERT INTO linkedin_connections (
          user_id, profile_id, name, headline, location, 
          industry, profile_url, compatibility_score, 
          campaign, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userId,
        profile.id,
        profile.name,
        profile.headline,
        profile.location,
        profile.industry,
        profile.profileUrl,
        profile.compatibilityScore,
        body.campaign,
        'pending',
        body.notes || ''
      ).run();
    });

    await Promise.all(insertPromises);

    return c.json({
      success: true,
      saved: body.profiles.length,
      message: `${body.profiles.length} connections saved to campaign: ${body.campaign}`
    });
  } catch (error) {
    console.error('Error saving connections:', error);
    return c.json({ error: 'Failed to save connections' }, 500);
  }
});

// GET /api/linkedin-connector/connections - Obtener conexiones guardadas
app.get('/connections', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT * FROM linkedin_connections 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(userId).all();

    return c.json({
      success: true,
      connections: result.results || []
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return c.json({ error: 'Failed to fetch connections' }, 500);
  }
});

// Helper functions
function generateMockProfiles(
  type: string,
  query: string,
  filters: any,
  maxResults: number
): LinkedInProfile[] {
  const profiles: LinkedInProfile[] = [];
  
  const typeData = {
    investor: {
      headlines: [
        'Partner @ Venture Capital Fund',
        'Angel Investor | Seed Stage',
        'Managing Director @ VC Firm',
        'Early Stage Investor',
        'Venture Partner'
      ],
      industries: ['Venture Capital', 'Investment', 'Finance', 'Technology']
    },
    talent: {
      headlines: [
        'Senior Software Engineer @ Tech Co',
        'Full Stack Developer | React & Node',
        'Engineering Manager',
        'Staff Engineer',
        'Tech Lead'
      ],
      industries: ['Technology', 'Software Development', 'Engineering']
    },
    customer: {
      headlines: [
        'VP Engineering @ Enterprise Co',
        'CTO | SaaS Platform',
        'Head of Product',
        'Director of Technology',
        'Engineering Director'
      ],
      industries: ['Technology', 'SaaS', 'Enterprise Software']
    },
    partner: {
      headlines: [
        'Co-Founder & CEO @ Startup',
        'Head of Business Development',
        'VP Partnerships',
        'Strategic Alliances Director',
        'Founder'
      ],
      industries: ['Technology', 'Startups', 'Business Development']
    }
  };

  const data = typeData[type as keyof typeof typeData] || typeData.investor;
  
  for (let i = 0; i < Math.min(maxResults, 20); i++) {
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    profiles.push({
      id: `profile_${type}_${i + 1}`,
      name: `${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'][i % 6]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5]}`,
      headline: data.headlines[i % data.headlines.length],
      location: filters.location || ['San Francisco', 'New York', 'London', 'Singapore'][i % 4],
      industry: data.industries[i % data.industries.length],
      profileUrl: `https://linkedin.com/in/sample-${i + 1}`,
      photoUrl: `https://i.pravatar.cc/150?img=${i + 1}`,
      connections: Math.floor(Math.random() * 1000) + 500,
      compatibilityScore: score,
      matchReasons: [
        'Experience in target industry',
        'Active in startup ecosystem',
        'Geographic alignment',
        'Strong network in relevant sectors'
      ].slice(0, Math.floor(score / 25)),
      selected: false
    });
  }
  
  // Sort by compatibility score
  return profiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

function generateSubject(purpose: string): string {
  const subjects = {
    investment: 'Exploring Investment Opportunities',
    partnership: 'Strategic Partnership Opportunity',
    hiring: 'Exciting Opportunity at [Company]',
    mentorship: 'Seeking Your Guidance'
  };
  return subjects[purpose as keyof typeof subjects] || 'Connection Request';
}

function generateMessage(
  purpose: string,
  senderInfo: any,
  customNotes?: string
): string {
  const notesText = customNotes || '';
  const wereWorking = "We're working on something that could create interesting synergies.";
  const workingOn = "We're working on exciting projects and looking for talented individuals like yourself.";
  
  const templates = {
    investment: `Hi [Name],

I'm ${senderInfo.name}, ${senderInfo.title} at ${senderInfo.company}. I noticed your work in [Industry] and your focus on [Area].

We're building [Brief Description] and are currently raising [Stage]. Given your expertise, I'd love to connect and share what we're working on.

${notesText}

Would you be open to a brief conversation?

Best regards,
${senderInfo.name}`,
    
    partnership: `Hi [Name],

I came across your profile and was impressed by your work at [Company]. I'm ${senderInfo.name} from ${senderInfo.company}.

${notesText || wereWorking}

Would you be open to exploring potential collaboration?

Cheers,
${senderInfo.name}`,
    
    hiring: `Hi [Name],

Your experience with [Skills] caught my attention. I'm ${senderInfo.name}, building the team at ${senderInfo.company}.

${notesText || workingOn}

Would you be interested in learning more?

Best,
${senderInfo.name}`,
    
    mentorship: `Hi [Name],

I've been following your journey and truly admire your work in [Area]. I'm ${senderInfo.name}, currently ${senderInfo.title} at ${senderInfo.company}.

${notesText || 'I would greatly value your insights and guidance.'}

Would you be open to a brief conversation?

Thank you,
${senderInfo.name}`
  };
  
  return templates[purpose as keyof typeof templates] || templates.investment;
}

export default app;
