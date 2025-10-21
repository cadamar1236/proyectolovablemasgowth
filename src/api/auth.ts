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
  return Buffer.from(password).toString('base64');
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
      JWT_SECRET
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
      JWT_SECRET
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
