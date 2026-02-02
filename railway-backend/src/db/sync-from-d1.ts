/**
 * Sync data from Cloudflare D1 to Railway PostgreSQL
 * Run this periodically to keep backup in sync
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cloudflare API credentials
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID || '5cb67508-cc61-4194-886b-05cf6f1c00fa';

interface D1Result {
  results: any[];
  success: boolean;
}

async function queryD1(sql: string): Promise<any[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    }
  );

  const data = await response.json() as any;
  if (!data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`);
  }

  return data.result[0].results || [];
}

async function syncUsers() {
  console.log('📥 Syncing users...');
  
  const users = await queryD1('SELECT * FROM users');
  
  for (const user of users) {
    await pool.query(`
      INSERT INTO users (id, email, name, role, avatar_url, company, linkedin_url, location, bio, user_type, investment_focus, sectors_of_interest, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        avatar_url = EXCLUDED.avatar_url,
        company = EXCLUDED.company,
        linkedin_url = EXCLUDED.linkedin_url,
        location = EXCLUDED.location,
        bio = EXCLUDED.bio,
        user_type = EXCLUDED.user_type,
        investment_focus = EXCLUDED.investment_focus,
        sectors_of_interest = EXCLUDED.sectors_of_interest
    `, [
      user.id, user.email, user.name, user.role, user.avatar_url,
      user.company, user.linkedin_url, user.location, user.bio,
      user.user_type, user.investment_focus, user.sectors_of_interest,
      user.created_at
    ]);
  }
  
  console.log(`   ✅ Synced ${users.length} users`);
}

async function syncEvents() {
  console.log('📥 Syncing events...');
  
  const events = await queryD1('SELECT * FROM events');
  
  for (const event of events) {
    await pool.query(`
      INSERT INTO events (id, title, description, event_type, event_date, event_time, duration_minutes, location, meeting_link, registration_link, max_participants, banner_image_url, host_name, host_avatar, tags, status, is_featured, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        event_type = EXCLUDED.event_type,
        event_date = EXCLUDED.event_date,
        event_time = EXCLUDED.event_time,
        duration_minutes = EXCLUDED.duration_minutes,
        location = EXCLUDED.location,
        meeting_link = EXCLUDED.meeting_link,
        registration_link = EXCLUDED.registration_link,
        max_participants = EXCLUDED.max_participants,
        banner_image_url = EXCLUDED.banner_image_url,
        host_name = EXCLUDED.host_name,
        host_avatar = EXCLUDED.host_avatar,
        tags = EXCLUDED.tags,
        status = EXCLUDED.status,
        is_featured = EXCLUDED.is_featured
    `, [
      event.id, event.title, event.description, event.event_type,
      event.event_date, event.event_time, event.duration_minutes,
      event.location, event.meeting_link, event.registration_link,
      event.max_participants, event.banner_image_url, event.host_name,
      event.host_avatar, event.tags, event.status, event.is_featured,
      event.created_by, event.created_at
    ]);
  }
  
  console.log(`   ✅ Synced ${events.length} events`);
}

async function syncEventRegistrations() {
  console.log('📥 Syncing event registrations...');
  
  const registrations = await queryD1('SELECT * FROM event_registrations');
  
  for (const reg of registrations) {
    await pool.query(`
      INSERT INTO event_registrations (id, event_id, user_id, registered_at, attendance_status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id, user_id) DO UPDATE SET
        attendance_status = EXCLUDED.attendance_status
    `, [reg.id, reg.event_id, reg.user_id, reg.registered_at, reg.attendance_status]);
  }
  
  console.log(`   ✅ Synced ${registrations.length} registrations`);
}

async function syncCompetitions() {
  console.log('📥 Syncing competitions...');
  
  const competitions = await queryD1('SELECT * FROM competitions');
  
  for (const comp of competitions) {
    await pool.query(`
      INSERT INTO competitions (id, name, description, competition_type, start_date, end_date, prize_amount, prize_description, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status
    `, [
      comp.id, comp.name, comp.description, comp.competition_type,
      comp.start_date, comp.end_date, comp.prize_amount,
      comp.prize_description, comp.status, comp.created_at
    ]);
  }
  
  console.log(`   ✅ Synced ${competitions.length} competitions`);
}

async function runSync() {
  console.log('🔄 Starting D1 → PostgreSQL sync...\n');
  
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    console.error('❌ Missing Cloudflare credentials. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID');
    process.exit(1);
  }

  try {
    await syncUsers();
    await syncEvents();
    await syncEventRegistrations();
    await syncCompetitions();
    
    console.log('\n✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
runSync();
