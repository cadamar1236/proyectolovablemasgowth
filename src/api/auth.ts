/**
 * Authentication API
 * Handles user registration, login, and JWT token management
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// Helper: Hash password (in production, use bcrypt)
function hashPassword(password: string): string {
  // TODO: In production, use bcrypt or Argon2
  // For now, simple implementation (NOT SECURE FOR PRODUCTION)
  // Using base64 encoding for compatibility with existing passwords
  try {
    // For Cloudflare Workers, use btoa if available, otherwise fallback
    if (typeof btoa !== 'undefined') {
      return btoa(password);
    }
    // Fallback for environments without btoa
    return Buffer.from(password, 'utf-8').toString('base64');
  } catch (e) {
    // Ultimate fallback
    return password.split('').map(c => c.charCodeAt(0).toString(16)).join('');
  }
}

// Helper: Verify password
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Register new user
auth.post('/register', async (c) => {
  try {
    const { email, password, name, role = 'founder' } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password and name are required' }, 400);
    }
    
    // Validate role
    const validRoles = ['founder', 'validator', 'admin'];
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
    
    // Hash password
    const hashedPassword = hashPassword(password);
    
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
    
    // Generate JWT token
    const token = await sign(
      {
        userId,
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      c.env.JWT_SECRET || JWT_SECRET
    );
    
    return c.json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email,
        name,
        role
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
    
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, password, name, role, plan, avatar_url FROM users WHERE email = ?'
    ).bind(email).first() as any;
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    if (!verifyPassword(password, user.password)) {
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
      c.env.JWT_SECRET || JWT_SECRET
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
    const payload = await verify(token, JWT_SECRET) as any;
    
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
    const payload = await verify(token, JWT_SECRET) as any;
    
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
    const payload = await verify(token, JWT_SECRET) as any;
    
    const { newRole } = await c.req.json();
    
    if (!newRole) {
      return c.json({ error: 'New role is required' }, 400);
    }
    
    // Validate role
    const validRoles = ['founder', 'validator', 'admin'];
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
      JWT_SECRET
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
    const payload = await verify(token, JWT_SECRET) as any;
    
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }
    
    // Get current password hash
    const user = await c.env.DB.prepare(
      'SELECT password FROM users WHERE id = ?'
    ).bind(payload.userId).first() as any;
    
    // Verify current password
    if (!verifyPassword(currentPassword, user.password)) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }
    
    // Hash and update new password
    const hashedPassword = hashPassword(newPassword);
    
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
      const payload = await verify(token, JWT_SECRET) as any;
      
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
  try {
    const code = c.req.query('code');
    const stateParam = c.req.query('state') || '{"role":"founder"}';

    if (!code) {
      return c.json({ error: 'Authorization code not provided' }, 400);
    }

    // Parse state parameter (contains role and redirect)
    let state;
    try {
      state = JSON.parse(stateParam);
    } catch (e) {
      state = { role: 'founder', redirect: '' };
    }
    let userRole = state.role || 'founder';
    const redirectPath = state.redirect || '';

    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return c.json({ error: 'Google OAuth not configured' }, 500);
    }

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
    };

    if (!tokenData.access_token) {
      return c.json({ error: 'Failed to get access token' }, 400);
    }

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

    if (!userData.email) {
      return c.json({ error: 'Failed to get user email' }, 400);
    }

    // Check if user exists
    let existingUser = await c.env.DB.prepare(
      'SELECT id, role FROM users WHERE email = ?'
    ).bind(userData.email).first() as any;

    let userId: number;

    if (existingUser) {
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
      // Create new user
      userRole = state.role; // Use role from OAuth state

      // Validate role
      const validRoles = ['founder', 'validator', 'admin'];
      if (!validRoles.includes(userRole)) {
        userRole = 'founder'; // Default to founder
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO users (email, name, role, plan, avatar_url)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userData.email, userData.name, userRole, 'starter', userData.picture).run();

      userId = result.meta.last_row_id;

      // If validator, create validator profile
      if (userRole === 'validator') {
        await c.env.DB.prepare(`
          INSERT INTO validators (user_id, title, expertise)
          VALUES (?, ?, ?)
        `).bind(userId, 'New Validator', '[]').run();
      }
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
      c.env.JWT_SECRET || JWT_SECRET
    );

    // Set cookie and redirect
    const frontendUrl = new URL(c.req.url).origin;
    const finalRedirect = redirectPath || '/dashboard';
    
    // Set the cookie (NOT HttpOnly so JavaScript can read it for API calls)
    c.header('Set-Cookie', `authToken=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);
    
    // Also pass token in URL as backup (for first load)
    const redirectWithToken = finalRedirect.includes('?') 
      ? `${finalRedirect}&token=${token}` 
      : `${finalRedirect}?token=${token}`;
    
    return c.redirect(redirectWithToken);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return c.json({ error: 'OAuth authentication failed' }, 500);
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
    const payload = await verify(token, JWT_SECRET) as any;
    
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
      JWT_SECRET
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

export default auth;
