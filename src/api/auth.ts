/**
 * Authentication API
 * Handles user registration, login, and JWT token management
 * SECURITY: Uses PBKDF2 for password hashing and rate limiting for brute force protection
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// SECURITY: No hardcoded fallback - JWT_SECRET must be configured in environment
function getJWTSecret(env: Bindings): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return env.JWT_SECRET;
}

// SECURITY: Rate limiting for authentication endpoints
const AUTH_RATE_LIMIT_SECONDS = 60; // 5 attempts per minute
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5;

async function checkAuthRateLimit(
  cache: KVNamespace | undefined,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number; attempts?: number }> {
  if (!cache) {
    return { allowed: true };
  }

  const rateLimitKey = `auth_rate_limit:${action}:${identifier}`;
  
  try {
    const data = await cache.get(rateLimitKey);
    const attempts = data ? parseInt(data) : 0;
    
    if (attempts >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
      return {
        allowed: false,
        retryAfter: AUTH_RATE_LIMIT_SECONDS,
        attempts
      };
    }
    
    await cache.put(rateLimitKey, (attempts + 1).toString(), {
      expirationTtl: AUTH_RATE_LIMIT_SECONDS
    });
    
    return { allowed: true, attempts: attempts + 1 };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true };
  }
}

// SECURITY: PBKDF2 password hashing using Web Crypto API
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

// SECURITY: Verify password with timing-safe comparison
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy base64 passwords for migration
  if (!storedHash.startsWith('pbkdf2:')) {
    // Legacy base64 comparison (for existing users)
    try {
      const legacyHash = typeof btoa !== 'undefined' ? btoa(password) : Buffer.from(password, 'utf-8').toString('base64');
      return legacyHash === storedHash;
    } catch {
      return false;
    }
  }
  
  const [, iterations, saltHex, hashHex] = storedHash.split(':');
  const encoder = new TextEncoder();
  
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: parseInt(iterations),
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  const computedHashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Timing-safe comparison
  if (computedHashHex.length !== hashHex.length) return false;
  let result = 0;
  for (let i = 0; i < computedHashHex.length; i++) {
    result |= computedHashHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return result === 0;
}

// Register new user
auth.post('/register', async (c) => {
  try {
    const { email, password, name, role = 'founder' } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password and name are required' }, 400);
    }
    
    // SECURITY: Rate limiting - prevent registration abuse
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const rateLimitCheck = await checkAuthRateLimit(c.env.CACHE, clientIP, 'register');
    if (!rateLimitCheck.allowed) {
      return c.json({ 
        error: `Too many registration attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.` 
      }, 429);
    }
    
    // Validate role
    const validRoles = ['founder', 'investor', 'scout', 'partner', 'job_seeker', 'other', 'validator', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400);
    }
    
    // SECURITY: Hash password with PBKDF2
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password, name, role, plan)
      VALUES (?, ?, ?, ?, ?)
    `).bind(email, hashedPassword, name, role, 'starter').run();
    
    const userId = result.meta.last_row_id;
    
    // If validator, create validator profile
    if (role === 'validator') {
      await c.env.DB.prepare(`
        INSERT INTO validators (user_id, title, expertise)
        VALUES (?, ?, ?)
      `).bind(userId, 'New Validator', '[]').run();
    }
    
    // Check for pending team invitations
    const pendingInvitations = await c.env.DB.prepare(`
      SELECT ti.*, st.name as team_name
      FROM team_invitations ti
      JOIN startup_teams st ON ti.team_id = st.id
      WHERE ti.email = ? AND ti.status = 'pending'
    `).bind(email.toLowerCase()).all();
    
    let finalRole = role;
    
    if (pendingInvitations.results && pendingInvitations.results.length > 0) {
      // Process each pending invitation
      for (const invitation of pendingInvitations.results as any[]) {
        // Add user to the team
        await c.env.DB.prepare(`
          INSERT INTO startup_team_members (team_id, user_id, role, is_creator)
          VALUES (?, ?, ?, 0)
        `).bind(invitation.team_id, userId, invitation.role).run();
        
        // Update invitation status
        await c.env.DB.prepare(`
          UPDATE team_invitations
          SET status = 'accepted'
          WHERE id = ?
        `).bind(invitation.id).run();
        
        // If invitation role is founder, update user's role
        if (invitation.role === 'founder') {
          finalRole = 'founder';
          await c.env.DB.prepare(`
            UPDATE users SET role = 'founder' WHERE id = ?
          `).bind(userId).run();
        }
      }
      
      console.log(`User ${email} accepted ${pendingInvitations.results.length} team invitation(s)`);
    }
    
    // Generate JWT token
    const token = await sign(
      {
        userId,
        email,
        role: finalRole,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      getJWTSecret(c.env)
    );
    
    return c.json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email,
        name,
        role: finalRole
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // SECURITY: Rate limiting - prevent brute force attacks
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const rateLimitCheck = await checkAuthRateLimit(c.env.CACHE, `${clientIP}:${email}`, 'login');
    if (!rateLimitCheck.allowed) {
      console.warn(`[SECURITY] Rate limit exceeded for login: IP=${clientIP}, email=${email}`);
      return c.json({ 
        error: `Too many login attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.` 
      }, 429);
    }
    
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, password, name, role, plan, avatar_url FROM users WHERE email = ?'
    ).bind(email).first() as any;
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // SECURITY: Verify password with PBKDF2
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate JWT token
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      getJWTSecret(c.env)
    );
    
    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        avatar_url: user.avatar_url
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user profile
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const payload = await verify(token, getJWTSecret(c.env)) as any;
    
    // Get user with additional profile info
    const user = await c.env.DB.prepare(`
      SELECT 
        u.id, u.email, u.name, u.role, u.plan, u.avatar_url, u.bio, u.company,
        v.id as validator_id, v.title, v.expertise, v.rating, v.total_validations
      FROM users u
      LEFT JOIN validators v ON u.id = v.user_id
      WHERE u.id = ?
    `).bind(payload.userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
    
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});

// Update profile
auth.put('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, getJWTSecret(c.env)) as any;
    
    const { name, bio, company, avatar_url } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          bio = COALESCE(?, bio),
          company = COALESCE(?, company),
          avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `).bind(name, bio, company, avatar_url, payload.userId).run();
    
    return c.json({ message: 'Profile updated successfully' });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ error: 'Profile update failed' }, 500);
  }
});

// Change user role
auth.put('/role', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, getJWTSecret(c.env)) as any;
    
    const { newRole } = await c.req.json();
    
    if (!newRole) {
      return c.json({ error: 'New role is required' }, 400);
    }
    
    // Validate role
    const validRoles = ['founder', 'investor', 'scout', 'partner', 'job_seeker', 'other', 'validator', 'admin'];
    if (!validRoles.includes(newRole)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    // Update user role
    await c.env.DB.prepare(`
      UPDATE users 
      SET role = ?
      WHERE id = ?
    `).bind(newRole, payload.userId).run();
    
    // If changing to validator, create validator profile if it doesn't exist
    if (newRole === 'validator') {
      const existingValidator = await c.env.DB.prepare(
        'SELECT id FROM validators WHERE user_id = ?'
      ).bind(payload.userId).first();
      
      if (!existingValidator) {
        await c.env.DB.prepare(`
          INSERT INTO validators (user_id, title, expertise)
          VALUES (?, ?, ?)
        `).bind(payload.userId, 'New Validator', '[]').run();
      }
    }
    
    // Generate new JWT token with updated role
    const newToken = await sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: newRole,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      getJWTSecret(c.env)
    );
    
    // Get updated user data
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE id = ?'
    ).bind(payload.userId).first() as any;
    
    return c.json({
      message: 'Role updated successfully',
      token: newToken,
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Role update error:', error);
    return c.json({ error: 'Role update failed' }, 500);
  }
});

// Change password
auth.post('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, getJWTSecret(c.env)) as any;
    
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }
    
    // Get current password hash
    const user = await c.env.DB.prepare(
      'SELECT password FROM users WHERE id = ?'
    ).bind(payload.userId).first() as any;
    
    // SECURITY: Verify current password with PBKDF2
    const passwordValid = await verifyPassword(currentPassword, user.password);
    if (!passwordValid) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }
    
    // SECURITY: Hash new password with PBKDF2
    const hashedPassword = await hashPassword(newPassword);
    
    await c.env.DB.prepare(
      'UPDATE users SET password = ? WHERE id = ?'
    ).bind(hashedPassword, payload.userId).run();
    
    return c.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Password change error:', error);
    return c.json({ error: 'Password change failed' }, 500);
  }
});

// Logout (client-side token removal, but log for security)
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verify(token, getJWTSecret(c.env)) as any;
      
      // Log logout event
      console.log(`User ${payload.userId} logged out at ${new Date().toISOString()}`);
    }
    
    return c.json({ message: 'Logout successful' });
    
  } catch (error) {
    return c.json({ message: 'Logout successful' });
  }
});

// Google OAuth endpoints
auth.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;

  if (!clientId) {
    return c.json({ error: 'Google OAuth not configured' }, 500);
  }

  // Get role and redirect from query parameters
  const role = c.req.query('role') || 'founder';
  const redirect = c.req.query('redirect') || '';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: JSON.stringify({ role, redirect }), // Pass role and redirect in state parameter
      access_type: 'offline',
      prompt: 'consent'
    });

  return c.redirect(authUrl);
});

auth.get('/google/callback', async (c) => {
  console.log('[GOOGLE-CALLBACK] Starting OAuth callback...');
  console.log('[GOOGLE-CALLBACK] Full URL:', c.req.url);
  
  try {
    const code = c.req.query('code');
    const error = c.req.query('error');
    const stateParam = c.req.query('state') || '{"role":"founder"}';

    console.log('[GOOGLE-CALLBACK] Code present:', !!code);
    console.log('[GOOGLE-CALLBACK] Error param:', error);
    console.log('[GOOGLE-CALLBACK] State:', stateParam);

    if (error) {
      console.error('[GOOGLE-CALLBACK] OAuth error from Google:', error);
      return c.redirect('/?error=' + error);
    }

    if (!code) {
      console.error('[GOOGLE-CALLBACK] No authorization code provided');
      return c.redirect('/?error=no_code');
    }

    // Parse state parameter (contains role and redirect)
    let state;
    try {
      state = JSON.parse(stateParam);
    } catch (e) {
      console.log('[GOOGLE-CALLBACK] Failed to parse state, using defaults');
      state = { role: 'founder', redirect: '' };
    }
    let userRole = state.role || 'founder';
    const redirectPath = state.redirect || '';

    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;

    console.log('[GOOGLE-CALLBACK] Redirect URI:', redirectUri);
    console.log('[GOOGLE-CALLBACK] Client ID present:', !!clientId);

    if (!clientId || !clientSecret) {
      console.error('[GOOGLE-CALLBACK] Google OAuth not configured');
      return c.redirect('/?error=oauth_not_configured');
    }

    console.log('[GOOGLE-CALLBACK] Exchanging code for token...');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json() as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    console.log('[GOOGLE-CALLBACK] Token response:', tokenData.error || 'Success');

    if (!tokenData.access_token) {
      console.error('[GOOGLE-CALLBACK] Failed to get access token:', tokenData.error, tokenData.error_description);
      return c.redirect('/?error=token_exchange_failed');
    }

    console.log('[GOOGLE-CALLBACK] Getting user info from Google...');
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json() as {
      email?: string;
      name?: string;
      picture?: string;
    };

    console.log('[GOOGLE-CALLBACK] User email:', userData.email);

    if (!userData.email) {
      console.error('[GOOGLE-CALLBACK] Failed to get user email');
      return c.redirect('/?error=no_email');
    }

    // Check if user exists
    let existingUser = await c.env.DB.prepare(
      'SELECT id, role FROM users WHERE email = ?'
    ).bind(userData.email).first() as any;

    let userId: number;

    if (existingUser) {
      console.log('[GOOGLE-CALLBACK] Existing user found:', existingUser.id);
      // User exists, update their info if needed
      userId = existingUser.id;
      userRole = existingUser.role;

      // Update user info from Google
      await c.env.DB.prepare(`
        UPDATE users
        SET name = COALESCE(?, name),
            avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `).bind(userData.name, userData.picture, userId).run();
    } else {
      console.log('[GOOGLE-CALLBACK] Creating new user...');
      // Create new user
      userRole = state.role; // Use role from OAuth state

      // Validate role
      const validRoles = ['founder', 'investor', 'scout', 'partner', 'job_seeker', 'other', 'validator', 'admin'];
      if (!validRoles.includes(userRole)) {
        userRole = 'founder'; // Default to founder
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO users (email, name, role, plan, avatar_url)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userData.email, userData.name, userRole, 'starter', userData.picture).run();

      userId = result.meta.last_row_id;
      console.log('[GOOGLE-CALLBACK] New user created:', userId);

      // If validator, create validator profile
      if (userRole === 'validator') {
        await c.env.DB.prepare(`
          INSERT INTO validators (user_id, title, expertise)
          VALUES (?, ?, ?)
        `).bind(userId, 'New Validator', '[]').run();
      }
      
      // Check for pending team invitations
      const pendingInvitations = await c.env.DB.prepare(`
        SELECT ti.*, st.name as team_name
        FROM team_invitations ti
        JOIN startup_teams st ON ti.team_id = st.id
        WHERE ti.email = ? AND ti.status = 'pending'
      `).bind(userData.email.toLowerCase()).all();
      
      if (pendingInvitations.results && pendingInvitations.results.length > 0) {
        // Process each pending invitation
        for (const invitation of pendingInvitations.results as any[]) {
          // Add user to the team
          await c.env.DB.prepare(`
            INSERT INTO startup_team_members (team_id, user_id, role, is_creator)
            VALUES (?, ?, ?, 0)
          `).bind(invitation.team_id, userId, invitation.role).run();
          
          // Update invitation status
          await c.env.DB.prepare(`
            UPDATE team_invitations
            SET status = 'accepted'
            WHERE id = ?
          `).bind(invitation.id).run();
          
          // If invitation role is founder, update user's role
          if (invitation.role === 'founder') {
            userRole = 'founder';
            await c.env.DB.prepare(`
              UPDATE users SET role = 'founder' WHERE id = ?
            `).bind(userId).run();
          }
        }
        
        console.log(`[GOOGLE-CALLBACK] User ${userData.email} accepted ${pendingInvitations.results.length} team invitation(s)`);
      }
      
      // Mark that this is a new user who needs onboarding
      existingUser = { id: userId, role: userRole, needsOnboarding: true };
    }

    // Generate JWT token
    const token = await sign(
      {
        userId,
        email: userData.email,
        userName: userData.name,
        role: userRole,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      getJWTSecret(c.env)
    );

    console.log('[GOOGLE-CALLBACK] JWT token generated');

    // Set cookie and redirect
    const frontendUrl = new URL(c.req.url).origin;
    // Redirect new users to onboarding, existing users to dashboard
    const finalRedirect = existingUser.needsOnboarding ? '/onboarding' : (redirectPath || '/dashboard');
    
    // SECURITY: Set secure cookie with proper flags
    // Note: Not using HttpOnly because client JS needs to read for API calls
    // Using SameSite=Lax for CSRF protection while allowing OAuth redirects
    const isProduction = !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1');
    const secureFlag = isProduction ? '; Secure' : '';
    c.header('Set-Cookie', `authToken=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${secureFlag}`);
    
    // Redirect without token in URL for security
    console.log('[GOOGLE-CALLBACK] Redirecting to:', finalRedirect);
    
    return c.redirect(finalRedirect);

  } catch (error) {
    console.error('[GOOGLE-CALLBACK] ERROR:', error);
    console.error('[GOOGLE-CALLBACK] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.redirect('/?error=callback_failed');
  }
});

// POST /api/auth/complete-onboarding - Save onboarding data
auth.post('/complete-onboarding', async (c) => {
  try {  
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, getJWTSecret(c.env)) as any;
    const userId = payload.userId;
    const userRole = payload.role;

    const data = await c.req.json();

    // Try to update basic fields that we know exist
    const basicFields = ['bio', 'company'];
    const updates = [];
    const values = [];

    for (const field of basicFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length > 0) {
      values.push(userId);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await c.env.DB.prepare(query).bind(...values).run();
    }

    // Store all onboarding data in the sessions table as JSON
    await c.env.DB.prepare(`
      INSERT INTO onboarding_sessions (user_id, session_data, completed, completed_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    `).bind(userId, JSON.stringify(data)).run();

    // If user is a founder, create or update their product in the marketplace
    if (userRole === 'founder' && data.startup_name) {
      // Check if they already have a product
      const existingProduct = await c.env.DB.prepare(`
        SELECT id FROM beta_products WHERE company_user_id = ?
      `).bind(userId).first();

      const productTitle = data.startup_name;
      const productDescription = data.industry 
        ? `${data.startup_name} - ${data.industry} startup at ${data.startup_stage || 'early'} stage`
        : `${data.startup_name} - Building the future`;
      
      const category = data.industry || 'Tech';
      const stage = data.startup_stage === 'idea' ? 'concept' 
                  : data.startup_stage === 'mvp' ? 'alpha'
                  : data.startup_stage === 'early_revenue' ? 'beta'
                  : 'production';
      
      const lookingFor = data.funding_status === 'bootstrapped' || data.funding_status === 'pre_seed'
        ? 'Early feedback, validators, and potential investors'
        : 'Product validation and user feedback';

      if (existingProduct) {
        // Update existing product
        await c.env.DB.prepare(`
          UPDATE beta_products 
          SET title = ?,
              description = ?,
              category = ?,
              stage = ?,
              looking_for = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          productTitle,
          productDescription,
          category,
          stage,
          lookingFor,
          existingProduct.id
        ).run();
      } else {
        // Create new product
        await c.env.DB.prepare(`
          INSERT INTO beta_products (
            company_user_id, 
            title, 
            description, 
            category, 
            stage, 
            looking_for,
            compensation_type,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, 'free_access', 'active')
        `).bind(
          userId,
          productTitle,
          productDescription,
          category,
          stage,
          lookingFor
        ).run();
      }

      // Also create/update a project entry
      const existingProject = await c.env.DB.prepare(`
        SELECT id FROM projects WHERE user_id = ?
      `).bind(userId).first();

      if (existingProject) {
        // Update existing project
        await c.env.DB.prepare(`
          UPDATE projects 
          SET title = ?,
              description = ?,
              target_market = ?,
              status = 'draft',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          productTitle,
          productDescription,
          data.target_market || data.industry || 'General',
          existingProject.id
        ).run();
      } else {
        // Create new project
        await c.env.DB.prepare(`
          INSERT INTO projects (
            user_id,
            title,
            description,
            target_market,
            status
          ) VALUES (?, ?, ?, ?, 'draft')
        `).bind(
          userId,
          productTitle,
          productDescription,
          data.target_market || data.industry || 'General'
        ).run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[COMPLETE-ONBOARDING] Error:', error);
    return c.json({ error: 'Failed to save onboarding data' }, 500);
  }
});

// Middleware: Verify authentication
export async function requireAuth(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, getJWTSecret(c.env)) as any;
    
    // Add user info to context
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    c.set('userEmail', payload.email);
    
    await next();
    
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Check if user exists (for WhatsApp auth)
auth.post('/check-user', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, plan FROM users WHERE email = ?'
    ).bind(email).first() as any;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if user has password (traditional auth) or is Google OAuth
    const hasPassword = await c.env.DB.prepare(
      'SELECT password FROM users WHERE id = ?'
    ).bind(user.id).first() as any;

    return c.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      },
      auth_provider: hasPassword && hasPassword.password ? 'password' : 'google'
    });

  } catch (error) {
    console.error('Check user error:', error);
    return c.json({ error: 'Check user failed' }, 500);
  }
});

// Generate WhatsApp verification code (for Google OAuth users)
// Code is PERMANENT - only needs to be entered once
auth.post('/generate-whatsapp-code', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');

    // Check if user already has a code
    const existingCode = await c.env.DB.prepare(
      'SELECT code FROM whatsapp_codes WHERE user_id = ?'
    ).bind(userId).first() as any;

    if (existingCode) {
      // Return existing code
      return c.json({
        message: 'Tu código de WhatsApp (permanente)',
        code: existingCode.code,
        expires_in: 'Nunca - código permanente'
      });
    }

    // Generate new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code WITHOUT expiration (permanent)
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO whatsapp_codes (user_id, code, expires_at)
      VALUES (?, ?, ?)
    `).bind(userId, code, '9999-12-31 23:59:59').run();

    return c.json({
      message: 'Código generado exitosamente',
      code: code,
      expires_in: 'Nunca - código permanente'
    });

  } catch (error) {
    console.error('Generate WhatsApp code error:', error);
    return c.json({ error: 'Failed to generate code' }, 500);
  }
});

// Verify WhatsApp code
auth.post('/verify-whatsapp-code', async (c) => {
  try {
    const { email, code } = await c.req.json();

    if (!email || !code) {
      return c.json({ error: 'Email and code are required' }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, plan FROM users WHERE email = ?'
    ).bind(email).first() as any;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check code (no expiration check - codes are permanent)
    const codeRecord = await c.env.DB.prepare(`
      SELECT * FROM whatsapp_codes
      WHERE user_id = ? AND code = ?
    `).bind(user.id, code).first();

    console.log('Code verification:', { userId: user.id, codeProvided: code, found: !!codeRecord });

    if (!codeRecord) {
      return c.json({ error: 'Invalid code' }, 401);
    }

    // Do NOT delete the code - it's permanent and can be reused

    // Generate JWT token
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      getJWTSecret(c.env)
    );

    return c.json({
      message: 'Code verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('Verify WhatsApp code error:', error);
    return c.json({ error: 'Code verification failed' }, 500);
  }
});

// Middleware: Require specific role
export function requireRole(...roles: string[]) {
  return async (c: any, next: any) => {
    const userRole = c.get('userRole');
    
    if (!roles.includes(userRole)) {
      return c.json({ error: 'Forbidden - Insufficient permissions' }, 403);
    }
    
    await next();
  };
}

// Get users by role (for marketplace)
auth.get('/users-by-role', async (c) => {
  try {
    const role = c.req.query('role');
    
    if (!role) {
      return c.json({ error: 'Role parameter is required' }, 400);
    }
    
    const validRoles = ['founder', 'investor', 'scout', 'partner', 'job_seeker', 'other', 'validator'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    // Get users with this role
    const users = await c.env.DB.prepare(`
      SELECT 
        id,
        name,
        email,
        role,
        company,
        avatar_url,
        location,
        skills,
        interests,
        investment_range,
        looking_for,
        linkedin_url,
        twitter_url,
        website_url,
        created_at
      FROM users
      WHERE role = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(role).all();
    
    return c.json(users.results || []);
  } catch (error) {
    console.error('[AUTH] Error getting users by role:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Get user profile with onboarding data
auth.get('/user-profile/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Get user basic info
    const user = await c.env.DB.prepare(`
      SELECT 
        id,
        name,
        email,
        role,
        bio,
        company,
        avatar_url,
        location,
        skills,
        interests,
        investment_range,
        looking_for,
        linkedin_url,
        twitter_url,
        website_url,
        created_at
      FROM users
      WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get onboarding data
    const onboardingSession = await c.env.DB.prepare(`
      SELECT session_data, completed, completed_at
      FROM onboarding_sessions
      WHERE user_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `).bind(userId).first();

    let onboardingData = null;
    if (onboardingSession && onboardingSession.session_data) {
      try {
        onboardingData = JSON.parse(onboardingSession.session_data);
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }

    return c.json({
      ...user,
      onboarding: onboardingData
    });
  } catch (error) {
    console.error('[AUTH] Error getting user profile:', error);
    return c.json({ error: 'Failed to get user profile' }, 500);
  }
});

export default auth;
