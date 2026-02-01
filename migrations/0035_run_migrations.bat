@echo off
echo Running database migrations...
echo.
echo Migration 0033: Goals Team Assignment
wrangler d1 execute lovable-growth --local --file=migrations/0033_goals_team_assignment.sql
echo.
echo Migration 0034: Goal Daily Completion
wrangler d1 execute lovable-growth --local --file=migrations/0034_goal_daily_completion.sql
echo.
echo Migrations completed!
pause
