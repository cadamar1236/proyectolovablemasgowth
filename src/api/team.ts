import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings, AuthContext } from '../types';

const app = new Hono<{ Bindings: Bindings }>();
const JWT_SECRET = 'your-secret-key-change-in-production-use-env-var';

// JWT Middleware
async function jwtMiddleware(c: any, next: any) {
  const authCookie = c.req.header('cookie')?.split('; ').find((c: string) => c.startsWith('authToken='))?.split('=')[1];
  
  if (!authCookie) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  try {
    const payload = await verify(authCookie, c.env.JWT_SECRET || JWT_SECRET) as any;
    c.set('user', { userId: payload.userId || payload.id, email: payload.email });
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// Get current user's team
app.get('/my-team', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    // Get user's team (they might be member of multiple, but we'll get the first one they created or joined)
    const team = await c.env.DB.prepare(`
      SELECT 
        st.id,
        st.name,
        st.creator_user_id,
        st.created_at,
        (SELECT COUNT(*) FROM startup_team_members WHERE team_id = st.id) as member_count
      FROM startup_teams st
      INNER JOIN startup_team_members stm ON st.id = stm.team_id
      WHERE stm.user_id = ?
      ORDER BY stm.is_creator DESC, stm.joined_at ASC
      LIMIT 1
    `).bind(user.userId).first();

    if (!team) {
      return c.json({ success: false, error: 'No team found' }, 404);
    }

    // Get team members
    const members = await c.env.DB.prepare(`
      SELECT 
        stm.id,
        stm.user_id,
        stm.role,
        stm.is_creator,
        stm.joined_at,
        u.name,
        u.email,
        u.avatar_url
      FROM startup_team_members stm
      LEFT JOIN users u ON stm.user_id = u.id
      WHERE stm.team_id = ?
      ORDER BY stm.is_creator DESC, stm.joined_at ASC
    `).bind(team.id).all();

    return c.json({
      success: true,
      team: {
        ...team,
        members: members.results || []
      }
    });
  } catch (error) {
    console.error('[TEAM] Error fetching team:', error);
    return c.json({ success: false, error: 'Failed to fetch team' }, 500);
  }
});

// Add a founder to the team (by email)
app.post('/add-founder', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    const { email, role } = await c.req.json();
    
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    // Get user's team
    const teamMembership = await c.env.DB.prepare(`
      SELECT stm.team_id, stm.is_creator
      FROM startup_team_members stm
      WHERE stm.user_id = ?
      ORDER BY stm.is_creator DESC
      LIMIT 1
    `).bind(user.userId).first();

    if (!teamMembership) {
      return c.json({ success: false, error: 'You are not part of any team' }, 404);
    }

    // Check if user is creator (only creator can add founders)
    if (!teamMembership.is_creator) {
      return c.json({ success: false, error: 'Only the team creator can add founders' }, 403);
    }

    // Find the user by email
    const targetUser = await c.env.DB.prepare(`
      SELECT id, name, email, avatar_url
      FROM users
      WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (!targetUser) {
      // User doesn't exist yet - create an invitation
      const invitationResult = await c.env.DB.prepare(`
        INSERT INTO team_invitations (team_id, email, role, invited_by_user_id, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).bind(teamMembership.team_id, email.toLowerCase(), role || 'Co-founder', user.userId).run();

      if (!invitationResult.success) {
        return c.json({ success: false, error: 'Failed to create invitation' }, 500);
      }

      return c.json({
        success: true,
        message: 'Invitation sent! When this user registers, they will automatically join your team as a founder.',
        isPending: true,
        invitation: {
          id: invitationResult.meta.last_row_id,
          email: email.toLowerCase(),
          role: role || 'Co-founder',
          status: 'pending'
        }
      });
    }

    // User exists - proceed with normal flow

    // Check if user is already a member
    const existingMember = await c.env.DB.prepare(`
      SELECT id FROM startup_team_members
      WHERE team_id = ? AND user_id = ?
    `).bind(teamMembership.team_id, targetUser.id).first();

    if (existingMember) {
      return c.json({ success: false, error: 'User is already a team member' }, 400);
    }

    // Check if user is in another team
    const userCurrentTeam = await c.env.DB.prepare(`
      SELECT stm.team_id, st.name as team_name
      FROM startup_team_members stm
      LEFT JOIN startup_teams st ON stm.team_id = st.id
      WHERE stm.user_id = ?
    `).bind(targetUser.id).first();

    if (userCurrentTeam && userCurrentTeam.team_id !== teamMembership.team_id) {
      // User is in another team - create a transfer invitation that requires acceptance
      const existingInvitation = await c.env.DB.prepare(`
        SELECT id FROM team_invitations
        WHERE email = ? AND team_id = ? AND status = 'pending'
      `).bind(email.toLowerCase(), teamMembership.team_id).first();

      if (existingInvitation) {
        return c.json({ 
          success: false, 
          error: 'An invitation is already pending for this user' 
        }, 400);
      }

      const invitationResult = await c.env.DB.prepare(`
        INSERT INTO team_invitations (
          team_id, email, role, invited_by_user_id, status, 
          invitation_type, current_team_id
        )
        VALUES (?, ?, ?, ?, 'pending', 'transfer', ?)
      `).bind(
        teamMembership.team_id, 
        email.toLowerCase(), 
        role || 'Co-founder', 
        user.userId,
        userCurrentTeam.team_id
      ).run();

      if (!invitationResult.success) {
        return c.json({ success: false, error: 'Failed to create invitation' }, 500);
      }

      return c.json({
        success: true,
        message: `Invitation sent to ${targetUser.name || targetUser.email}. They are currently in "${userCurrentTeam.team_name}" and must accept to join your team.`,
        isPending: true,
        requiresAcceptance: true,
        invitation: {
          id: invitationResult.meta.last_row_id,
          email: email.toLowerCase(),
          role: role || 'Co-founder',
          status: 'pending',
          type: 'transfer',
          currentTeam: userCurrentTeam.team_name
        }
      });
    }

    // Add the user to the team
    const result = await c.env.DB.prepare(`
      INSERT INTO startup_team_members (team_id, user_id, role, is_creator)
      VALUES (?, ?, ?, 0)
    `).bind(teamMembership.team_id, targetUser.id, role || 'Co-founder').run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to add founder' }, 500);
    }

    // Update the user's role to 'founder' if they're not already
    await c.env.DB.prepare(`
      UPDATE users
      SET role = 'founder'
      WHERE id = ? AND role != 'founder'
    `).bind(targetUser.id).run();

    return c.json({
      success: true,
      message: 'Founder added successfully',
      member: {
        id: result.meta.last_row_id,
        user_id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatar_url: targetUser.avatar_url,
        role: role || 'Co-founder',
        is_creator: 0
      }
    });
  } catch (error) {
    console.error('[TEAM] Error adding founder:', error);
    return c.json({ success: false, error: 'Failed to add founder' }, 500);
  }
});

// Remove a founder from the team
app.delete('/remove-founder/:memberId', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const memberId = parseInt(c.req.param('memberId'));
  
  try {
    // Get user's team
    const teamMembership = await c.env.DB.prepare(`
      SELECT stm.team_id, stm.is_creator
      FROM startup_team_members stm
      WHERE stm.user_id = ?
      ORDER BY stm.is_creator DESC
      LIMIT 1
    `).bind(user.userId).first();

    if (!teamMembership) {
      return c.json({ success: false, error: 'You are not part of any team' }, 404);
    }

    // Check if user is creator (only creator can remove founders)
    if (!teamMembership.is_creator) {
      return c.json({ success: false, error: 'Only the team creator can remove founders' }, 403);
    }

    // Get the member to remove
    const member = await c.env.DB.prepare(`
      SELECT id, user_id, is_creator
      FROM startup_team_members
      WHERE id = ? AND team_id = ?
    `).bind(memberId, teamMembership.team_id).first();

    if (!member) {
      return c.json({ success: false, error: 'Member not found' }, 404);
    }

    // Cannot remove the creator
    if (member.is_creator) {
      return c.json({ success: false, error: 'Cannot remove the team creator' }, 400);
    }

    // Remove the member
    const result = await c.env.DB.prepare(`
      DELETE FROM startup_team_members
      WHERE id = ? AND team_id = ?
    `).bind(memberId, teamMembership.team_id).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to remove founder' }, 500);
    }

    return c.json({
      success: true,
      message: 'Founder removed successfully'
    });
  } catch (error) {
    console.error('[TEAM] Error removing founder:', error);
    return c.json({ success: false, error: 'Failed to remove founder' }, 500);
  }
});

// Update team name
app.put('/update-name', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    const { name } = await c.req.json();
    
    if (!name || name.trim().length === 0) {
      return c.json({ success: false, error: 'Team name is required' }, 400);
    }

    // Get user's team
    const teamMembership = await c.env.DB.prepare(`
      SELECT stm.team_id, stm.is_creator
      FROM startup_team_members stm
      WHERE stm.user_id = ?
      ORDER BY stm.is_creator DESC
      LIMIT 1
    `).bind(user.userId).first();

    if (!teamMembership) {
      return c.json({ success: false, error: 'You are not part of any team' }, 404);
    }

    // Check if user is creator (only creator can update team name)
    if (!teamMembership.is_creator) {
      return c.json({ success: false, error: 'Only the team creator can update the team name' }, 403);
    }

    // Update team name
    const result = await c.env.DB.prepare(`
      UPDATE startup_teams
      SET name = ?
      WHERE id = ?
    `).bind(name.trim(), teamMembership.team_id).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to update team name' }, 500);
    }

    return c.json({
      success: true,
      message: 'Team name updated successfully'
    });
  } catch (error) {
    console.error('[TEAM] Error updating team name:', error);
    return c.json({ success: false, error: 'Failed to update team name' }, 500);
  }
});

// Get pending invitations for current user
app.get('/my-invitations', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  
  try {
    const userInfo = await c.env.DB.prepare(`
      SELECT email FROM users WHERE id = ?
    `).bind(user.userId).first();

    if (!userInfo) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const invitations = await c.env.DB.prepare(`
      SELECT 
        ti.id,
        ti.team_id,
        ti.role,
        ti.status,
        ti.invitation_type,
        ti.invited_at,
        st.name as team_name,
        u.name as invited_by_name,
        u.email as invited_by_email,
        st2.name as current_team_name
      FROM team_invitations ti
      JOIN startup_teams st ON ti.team_id = st.id
      LEFT JOIN users u ON ti.invited_by_user_id = u.id
      LEFT JOIN startup_teams st2 ON ti.current_team_id = st2.id
      WHERE ti.email = ? AND ti.status = 'pending'
      ORDER BY ti.invited_at DESC
    `).bind(userInfo.email).all();

    return c.json({
      success: true,
      invitations: invitations.results || []
    });
  } catch (error) {
    console.error('[TEAM] Error getting invitations:', error);
    return c.json({ success: false, error: 'Failed to get invitations' }, 500);
  }
});

// Accept or reject team invitation
app.post('/invitations/:id/:action', jwtMiddleware, async (c) => {
  const user = c.get('user') as AuthContext;
  const invitationId = c.req.param('id');
  const action = c.req.param('action'); // 'accept' or 'reject'
  
  try {
    if (action !== 'accept' && action !== 'reject') {
      return c.json({ success: false, error: 'Invalid action' }, 400);
    }

    const userInfo = await c.env.DB.prepare(`
      SELECT email FROM users WHERE id = ?
    `).bind(user.userId).first();

    if (!userInfo) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get invitation details
    const invitation = await c.env.DB.prepare(`
      SELECT 
        ti.*,
        st.name as team_name
      FROM team_invitations ti
      JOIN startup_teams st ON ti.team_id = st.id
      WHERE ti.id = ? AND ti.email = ? AND ti.status = 'pending'
    `).bind(invitationId, userInfo.email).first();

    if (!invitation) {
      return c.json({ success: false, error: 'Invitation not found or already processed' }, 404);
    }

    if (action === 'reject') {
      // Simply mark as rejected
      await c.env.DB.prepare(`
        UPDATE team_invitations SET status = 'rejected' WHERE id = ?
      `).bind(invitationId).run();

      return c.json({
        success: true,
        message: 'Invitation rejected'
      });
    }

    // Accept invitation
    if (invitation.invitation_type === 'transfer') {
      // Remove from current team
      await c.env.DB.prepare(`
        DELETE FROM startup_team_members
        WHERE team_id = ? AND user_id = ?
      `).bind(invitation.current_team_id, user.userId).run();

      // Update goals to new team
      await c.env.DB.prepare(`
        UPDATE goals SET team_id = ? WHERE user_id = ?
      `).bind(invitation.team_id, user.userId).run();

      // Check if old team is now empty
      const remainingMembers = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM startup_team_members WHERE team_id = ?
      `).bind(invitation.current_team_id).first();

      if (remainingMembers && remainingMembers.count === 0) {
        await c.env.DB.prepare(`
          DELETE FROM startup_teams WHERE id = ?
        `).bind(invitation.current_team_id).run();
      }
    }

    // Add to new team
    await c.env.DB.prepare(`
      INSERT INTO startup_team_members (team_id, user_id, role, is_creator)
      VALUES (?, ?, ?, 0)
    `).bind(invitation.team_id, user.userId, invitation.role).run();

    // Update user role to founder
    await c.env.DB.prepare(`
      UPDATE users SET role = 'founder' WHERE id = ?
    `).bind(user.userId).run();

    // Mark invitation as accepted
    await c.env.DB.prepare(`
      UPDATE team_invitations SET status = 'accepted' WHERE id = ?
    `).bind(invitationId).run();

    return c.json({
      success: true,
      message: `You have joined "${invitation.team_name}" successfully!`
    });
  } catch (error) {
    console.error('[TEAM] Error processing invitation:', error);
    return c.json({ success: false, error: 'Failed to process invitation' }, 500);
  }
});

export default app;
