-- Migration: Add marketing agent tasks tracking
-- Date: 2025-12-27
-- Description: Adds tables to track marketing agent tasks and their results

-- Marketing tasks table to track agent operations
CREATE TABLE IF NOT EXISTS marketing_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    goal_id INTEGER,
    task_type TEXT NOT NULL CHECK(task_type IN (
        'market_research', 
        'content_creation', 
        'strategy', 
        'social_media',
        'goal_analysis',
        'marketing_plan',
        'content_ideas',
        'competition_analysis'
    )),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
    prompt TEXT NOT NULL,
    result TEXT,
    metadata TEXT, -- JSON string for additional data
    created_at DATETIME DEFAULT (datetime('now')),
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES dashboard_goals(id) ON DELETE SET NULL
);

-- Marketing insights table to store generated insights
CREATE TABLE IF NOT EXISTS marketing_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    insight_type TEXT NOT NULL CHECK(insight_type IN (
        'trend',
        'opportunity',
        'recommendation',
        'competitive_advantage',
        'risk',
        'action_item'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES marketing_tasks(id) ON DELETE SET NULL
);

-- Content ideas table for generated content suggestions
CREATE TABLE IF NOT EXISTS content_ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content_type TEXT, -- post, video, article, infographic, etc.
    estimated_time INTEGER, -- minutes to create
    priority INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'published', 'archived')),
    scheduled_date DATETIME,
    published_date DATETIME,
    metadata TEXT, -- JSON string for hashtags, tags, etc.
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES marketing_tasks(id) ON DELETE SET NULL
);

-- Agent conversations for context retention
CREATE TABLE IF NOT EXISTS agent_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    agent_type TEXT NOT NULL CHECK(agent_type IN (
        'market_research',
        'content_creation',
        'strategy',
        'social_media',
        'orchestrator'
    )),
    messages TEXT NOT NULL, -- JSON array of messages
    context TEXT, -- JSON object with goals, metrics, etc.
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_user ON marketing_tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_status ON marketing_tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_type ON marketing_tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_marketing_insights_user ON marketing_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_insights_priority ON marketing_insights(priority, is_read);

CREATE INDEX IF NOT EXISTS idx_content_ideas_user ON content_ideas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform ON content_ideas(platform, status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_scheduled ON content_ideas(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON agent_conversations(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_session ON agent_conversations(session_id);

-- Views for analytics
CREATE VIEW IF NOT EXISTS marketing_task_stats AS
SELECT 
    user_id,
    task_type,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
    AVG(
        CASE 
            WHEN completed_at IS NOT NULL 
            THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60 
            ELSE NULL 
        END
    ) as avg_completion_time_minutes
FROM marketing_tasks
GROUP BY user_id, task_type;

CREATE VIEW IF NOT EXISTS user_marketing_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(DISTINCT mt.id) as total_marketing_tasks,
    COUNT(DISTINCT mi.id) as total_insights,
    COUNT(DISTINCT ci.id) as total_content_ideas,
    SUM(CASE WHEN mi.is_read = 0 THEN 1 ELSE 0 END) as unread_insights,
    SUM(CASE WHEN ci.status = 'published' THEN 1 ELSE 0 END) as published_content
FROM users u
LEFT JOIN marketing_tasks mt ON u.id = mt.user_id
LEFT JOIN marketing_insights mi ON u.id = mi.user_id
LEFT JOIN content_ideas ci ON u.id = ci.user_id
GROUP BY u.id;
