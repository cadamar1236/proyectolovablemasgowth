# Team Management Feature - Migration Instructions

## ✅ Feature Deployed Successfully!

The team management feature has been deployed. However, you need to run the database migration manually.

## 📋 Migration Steps

### Option 1: Using Cloudflare Dashboard (Recommended)
1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages** > **D1** > **lovable-growth-db**
3. Click on **Console** tab
4. Copy and paste the contents of `migrations/0031_goal_team_sharing.sql`
5. Click **Execute**

### Option 2: Using Command Line
```bash
npx wrangler d1 execute lovable-growth-db --remote --file=migrations/0031_goal_team_sharing.sql
```

If you get an authentication error, try:
```bash
npx wrangler login
npx wrangler d1 execute lovable-growth-db --remote --file=migrations/0031_goal_team_sharing.sql
```

## 🎯 What This Feature Does

### For Founders:
- **Add Co-founders**: Invite team members by email
- **Shared Goals Dashboard**: All team members see the same goals
- **Goal Attribution**: Each goal shows who created it
- **Team Management**: Manage roles and remove members

### How to Use:
1. Navigate to **Team** in the sidebar (new option added)
2. Enter a co-founder's email and optional role
3. Click **Add** to invite them
4. Co-founders will automatically see shared goals in their dashboard

### Technical Details:
- Created `startup_teams` table for team management
- Created `startup_team_members` table for member relationships
- Added `team_id` column to `goals` table
- Updated `/api/metrics-data/goals` endpoint to return team goals
- Goals remain editable only by their creator

## 🔗 New Endpoints

- `GET /api/team/my-team` - Get current user's team info
- `POST /api/team/add-founder` - Add a co-founder by email
- `DELETE /api/team/remove-founder/:memberId` - Remove a co-founder
- `PUT /api/team/update-name` - Update team name

## 📍 New Pages

- `/team` - Team management interface

## 🎨 UI Updates

- Added **Team** link in sidebar (only for founders)
- Team management page with:
  - Add co-founder form
  - Team members list
  - Role management
  - Team name editing

---

**Deployment URL**: https://d7c8dc94.webapp-46s.pages.dev

After running the migration, the feature will be fully functional!
