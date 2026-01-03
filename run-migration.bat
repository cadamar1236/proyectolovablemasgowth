@echo off
echo Running migration 0028_project_founders.sql...
wrangler d1 execute webapp-production --remote --file=migrations/0028_project_founders.sql
echo Migration complete!
pause
