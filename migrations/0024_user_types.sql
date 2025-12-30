-- Add new user types to the database
-- Update the role column to support new user types

-- First, let's ensure the users table can handle these new roles
-- The role field already exists, but we want to document the valid values:
-- 'founder', 'investor', 'scout', 'partner', 'job_seeker', 'other', 'validator', 'admin'

-- Add additional profile fields for different user types (skip avatar_url as it already exists)
ALTER TABLE users ADD COLUMN linkedin_url TEXT;
ALTER TABLE users ADD COLUMN twitter_url TEXT;
ALTER TABLE users ADD COLUMN website_url TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN interests TEXT; -- JSON array of interests
ALTER TABLE users ADD COLUMN skills TEXT; -- JSON array of skills for job seekers
ALTER TABLE users ADD COLUMN investment_range TEXT; -- For investors
ALTER TABLE users ADD COLUMN looking_for TEXT; -- For scouts/partners/job seekers
