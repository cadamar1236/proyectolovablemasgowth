# ASTAR* Ecosystem - AI Agent Instructions

## 🏗️ Architecture Overview

**Hybrid Multi-Platform Ecosystem:**
- **Cloudflare Frontend** (root `/src`): Hono SSR with inline JS, TailwindCSS CDN - original production app serving marketplace, dashboard, competitions
- **Vercel Frontend** (`/vercel-frontend`): React 18 SPA with Vite - modern rewrite matching Cloudflare design exactly, better DX and performance
- **Railway Backend** (`/railway-backend`): Express.js REST API with PostgreSQL - centralized data layer for all frontends
- **Python Agents** (`/agents`): FastAPI/Agno multiagent system for marketing automation, WhatsApp integration (Twilio), LinkedIn connector
- **Android App** (`/android-app`): Native Kotlin app using Retrofit for API calls - shares JWT auth with web platforms

**Key Design Decisions:** 
- **Three frontends** (Cloudflare/Vercel/Android) consuming same Railway API enables multi-platform reach while testing migration strategies
- **Cloudflare D1 → Railway PostgreSQL** migration in progress - D1 remains source of truth for legacy, PostgreSQL for new features
- **Guest mode** allows exploration without backend dependency (frontend-only state)

## 🚀 Critical Workflows

### Frontend Development (Vercel/React)
```bash
cd vercel-frontend
npm run dev          # Dev server on http://localhost:5173
npm run build        # Vite build (outputs to /dist)
npm run deploy       # Build + Vercel production deploy
```

**Backend Connection:** All API calls go through `vercel-frontend/src/services/api.js` which uses axios with:
- Base URL: `VITE_API_BASE_URL` env var (defaults to Railway production URL)
- JWT token in `Authorization: Bearer <token>` header
- Auto-redirect to `/login` on 401 errors
- 30s timeout with error interceptors

**Path Aliases (vite.config.js):**
```javascript
'@' → './src'
'@components' → './src/components'
'@services' → './src/services'
// etc. - use these for cleaner imports
```

### Cloudflare Development (Legacy/SSR)
```bash
# Root directory commands
npm run dev                  # Local Hono dev server (port 3000)
npm run deploy              # Build + deploy to Cloudflare Pages
wrangler d1 migrations apply webapp-production --local  # Run D1 migrations locally
wrangler d1 migrations apply webapp-production          # Run D1 migrations in production
```

**Bindings in wrangler.jsonc:**
- `DB`: Cloudflare D1 database (SQLite)
- `CACHE`: KV namespace for caching
- `AI`: Cloudflare AI binding for LLMs

**IMPORTANT:** Secrets (JWT_SECRET, GROQ_API_KEY) must be set in Cloudflare Dashboard → Workers → Settings → Variables, NEVER in `wrangler.jsonc`

### Railway Backend Development
```bash
cd railway-backend
npm run dev          # tsx watch mode for hot reload
npm run build        # TypeScript → JavaScript compilation
npm run start        # Production server (runs dist/server.js)
npm run db:migrate   # Run PostgreSQL migrations
```

**Environment Variables (Railway Dashboard):**
- `DATABASE_URL`: Auto-injected by Railway PostgreSQL service
- `JWT_SECRET`: Must match Cloudflare Workers secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `FRONTEND_URL`: Vercel deployment URL for CORS

### Database Migrations
```powershell
# Railway PostgreSQL (production database)
.\run-migration-oauth.ps1   # Interactive migration runner with prompts
# Or manually with psql:
psql -h autorack.proxy.rlwy.net -U postgres -d railway -f migrations/0030_oauth_guest_support.sql
```

**Migration Convention:** 
- Numbered SQL files (`0001_`, `0002_`, etc.) in `/migrations`
- Always increment from highest existing number
- Use `IF NOT EXISTS` for idempotency (safe re-runs)
- Test locally first, then run on production Railway DB

## 🎨 Design System & UI Patterns

**Cosmic Dark Theme (Cloudflare/Vercel parity):**
```jsx
// Background gradient (all pages)
bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900

// Glassmorphism cards
className="bg-black/20 backdrop-blur-xl border border-purple-500/20"

// Metric cards with gradients
className="bg-gradient-to-br from-purple-600/20 to-purple-800/20"

// Active tabs
className="bg-purple-600 text-white shadow-lg shadow-purple-500/50"
```

**Component Structure (React):**
- No `MainLayout` wrapper in Dashboard - full-screen design
- Top nav: Logo + user info + exit button
- Horizontal tabs with icons (🏠 Home, 📈 Traction, 💬 Inbox, etc.)
- Content area with glassmorphism cards

**Landing Page Pattern:**
```jsx
// 6 interactive planets for role selection
<div className="planet planet-founder">  // Gradients per role
  <span className="planet-badge">FOUNDER</span>
</div>
// Cosmic background with animated stars
// Auth modal with 3 options: Guest / Google OAuth / Email
```

## 🔐 Authentication Flow

**Guest Mode (No Backend):**
```javascript
localStorage.setItem('guestMode', 'true');
localStorage.setItem('selectedRole', 'founder');
// ProtectedRoute allows access if guestMode OR token exists
```

**Google OAuth:**
1. User clicks "Continue with Google" → redirects to `/auth/google` (Railway backend)
2. Backend handles OAuth → generates JWT → redirects to `/auth/callback?token=xyz`
3. `AuthCallback.jsx` saves token → fetches profile → redirects to `/dashboard`

**Email/Password:**
- POST `/auth/login` or `/auth/register`
- Returns `{ token, user }` → save to localStorage
- All subsequent API calls include `Authorization: Bearer <token>`

## 📊 State Management

**React Context Pattern:**
```jsx
// vercel-frontend/src/context/AuthContext.jsx
const { user, isAuthenticated, login, logout } = useAuth();
```

**Local Data Fetching (no global state library):**
```jsx
// Each component fetches its own data
const [goals, setGoals] = useState([]);
useEffect(() => {
  api.get('/goals').then(res => setGoals(res.data.goals));
}, []);
```

**API Error Handling:**
```javascript
// Always use try-catch with .catch() fallback for graceful degradation
api.get('/goals').catch(() => ({ data: { goals: [] } }))
```

## 🗄️ Database Schema Patterns

**Users Table (with OAuth support):**
```sql
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255),      -- OAuth provider ID
ADD COLUMN provider VARCHAR(50),         -- 'local' | 'google'
ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
```

**Migration Pattern:** Add `IF NOT EXISTS` for idempotency:
```sql
CREATE TABLE IF NOT EXISTS table_name (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);
```

## 🤖 AI Agent Integration

**Marketing Agent (Python/FastAPI):**
- Deployed on Railway separately from main backend
- Endpoints: `/marketing/analyze`, `/marketing/generate-content`
- Uses Groq API (llama-3.1-70b-versatile model) for ultra-fast inference
- Stack: FastAPI + Agno framework + Twilio WhatsApp integration

**WhatsApp Integration (`/agents`):**
- Multiagent system: Intent Classifier, Goals Manager, Metrics Agent, Leaderboard Agent
- Twilio webhook receives messages → routes to appropriate agent
- Users authenticate by linking WhatsApp number with ASTAR account
- Python dependencies: `agno`, `groq-sdk`, `twilio`, `fastapi`

**AI Chat in Dashboard:**
```jsx
// Two modes: Guest (mock responses) vs Authenticated (API calls)
const isGuest = localStorage.getItem('guestMode') === 'true';
if (isGuest) {
  // Inline AI responses (no external service)
  setAiResponse('Mock response for guest users');
} else {
  // Production: POST to /ai/chat-agent with context
  const response = await api.post('/ai/chat-agent', { message, context });
}
```

**Android App AI Features:**
- Native Kotlin app connects to same Railway backend
- Uses Retrofit for HTTP requests with JWT authentication
- Chatbot activity displays real-time AI responses
- Shares API endpoints with web frontends (`/api/chat-agent`)

## 📦 Build & Deploy Pipeline

**Vercel (React Frontend):**
```bash
# Build creates /dist folder
npm run build  # → outputs 300-350KB bundle with code splitting
vercel --prod  # → deploys to vercel-frontend-three-teal.vercel.app
```
- **Code Splitting:** react-vendor, chart-vendor, utils chunks
- **Environment:** `VITE_API_BASE_URL` must point to Railway backend
- **Auto-deploy:** Connect GitHub repo for automatic deployments

**Railway (Backend API):**
- Auto-deploys from Git push to `main` branch
- Environment variables managed in Railway dashboard
- PostgreSQL database included in project (DATABASE_URL auto-injected)
- Build command: `npm run build` (TypeScript → JavaScript)
- Start command: `npm run start` (runs dist/server.js)

**Cloudflare (Legacy):**
```bash
npm run deploy  # → wrangler pages deploy dist
```
- Bindings (D1, KV, AI) configured in wrangler.jsonc
- Secrets managed via Cloudflare Dashboard (JWT_SECRET, GROQ_API_KEY)
- D1 database: webapp-production (ID: 5cb67508-cc61-4194-886b-05cf6f1c00fa)

**Python Agents (Railway):**
- Separate Railway service with Procfile
- Start command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker api_server:app`
- Environment: GROQ_API_KEY, TWILIO credentials, WEBAPP_API_URL

## 🔍 Debugging Patterns

**Check Backend Connection:**
```javascript
// Every page logs connection status
console.log('🔍 Checking backend connection...');
axios.get('/health').then(() => console.log('✅ Connected'));
```

**Guest Mode Detection:**
```javascript
const isGuest = localStorage.getItem('guestMode') === 'true';
if (isGuest) {
  // Skip API calls, use mock data
  setUserData({ name: 'Guest User', isGuest: true });
}
```

**API Debugging:**
```javascript
// vercel-frontend/src/services/api.js intercepts all requests
// Check Network tab for: Authorization header, 401 redirects
```

## 🎯 Project-Specific Conventions

**Cosmic Theme Colors:**
- Purple: Primary (`#9333EA`, `#A855F7`)
- Pink: Secondary (`#EC4899`, `#F472B6`)
- Yellow: Warnings/Guest mode (`#FBBF24`)
- Green: Success/Growth (`#10B981`)

**Tab System (Dashboard):**
- Always 6 tabs: Home, Traction, Inbox, Directory, AI Connector, AI CRM
- Active state: `bg-purple-600 shadow-lg shadow-purple-500/50`
- Icons: Use emoji (🏠 📈 💬 👥 🔗 🤖) not icon libraries

**Card Metrics Pattern:**
```jsx
<div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20">
  <span className="text-purple-300 text-sm">Metric Name</span>
  <div className="text-4xl font-bold text-white">{value}</div>
  <div className="text-green-400 text-sm">↑ {growth}%</div>
</div>
```

## 📝 File Naming Conventions

- React components: PascalCase (`Dashboard.jsx`, `LandingPage.jsx`)
- Services/utilities: camelCase (`api.js`, `authService.js`)
- Context providers: PascalCase with Context suffix (`AuthContext.jsx`)
- SQL migrations: Numbered with descriptive name (`0030_oauth_guest_support.sql`)

## ⚠️ Common Pitfalls

1. **Don't use MainLayout in Dashboard** - It breaks the full-screen cosmic design
2. **PowerShell `cd` creates nested paths** - Use absolute paths or `Set-Location`
3. **Always check for guest mode** before API calls - Prevents 401 errors
4. **Migrations must be idempotent** - Use `IF NOT EXISTS` clauses
5. **Don't batch localStorage operations** - Set guestMode AND selectedRole separately
6. **Vercel deployment requires `--prod` flag** - Otherwise deploys to preview URL
7. **Never commit secrets to wrangler.jsonc** - Use Cloudflare Dashboard → Variables
8. **Railway DATABASE_URL is auto-injected** - Don't manually set it
9. **Vite env vars must start with VITE_** - e.g., `VITE_API_BASE_URL` not `API_BASE_URL`
10. **JWT_SECRET must match across all platforms** - Cloudflare, Railway, Python agents must use same secret

## 🔗 Key Integration Points

**Frontend → Backend API:**
- Base URL: `vercel-frontend/.env` → `VITE_API_BASE_URL`
- Auth: JWT in localStorage → axios interceptor adds to headers
- Timeout: 30s default (configurable in `api.js`)

**Backend → Database:**
- Railway PostgreSQL connection string in env vars
- Sequelize ORM (not used in frontend)
- Direct SQL queries for complex operations

**Google OAuth Flow:**
1. Frontend: Click "Continue with Google" → `window.location.href = backend/auth/google`
2. Backend: Passport.js handles OAuth → creates/finds user → generates JWT
3. Backend: Redirects to `frontend/auth/callback?token=<jwt>`
4. Frontend: `AuthCallback.jsx` extracts token → saves → loads profile → dashboard

## 📚 Reference Files

- **API Client**: `vercel-frontend/src/services/api.js` - All backend calls
- **Auth Flow**: `vercel-frontend/src/context/AuthContext.jsx` - Login/logout logic
- **Dashboard Design**: `vercel-frontend/src/pages/Dashboard.jsx` - Full pattern reference
- **Migrations**: `migrations/0030_oauth_guest_support.sql` - Database schema examples
- **OAuth Setup**: `GOOGLE_OAUTH_SETUP.md` - Complete OAuth configuration guide
- **Cloudflare Config**: `wrangler.jsonc` - D1, KV, AI bindings
- **Vercel Config**: `vercel-frontend/vite.config.js` - Path aliases, build optimization
- **Railway Setup**: `railway-backend/README.md` - Backend deployment guide
- **Android App**: `android-app/README.md` - Native app architecture
- **Python Agents**: `agents/README.md` - WhatsApp multiagent system

## 🔗 Deployment URLs

- **Vercel Frontend**: https://vercel-frontend-three-teal.vercel.app
- **Railway Backend**: https://proyectolovablemasgowth-production-813a.up.railway.app
- **Cloudflare Frontend**: Check wrangler.jsonc for latest deployment

## 🛠️ Development Tips

**Testing Backend Connection:**
```javascript
// Every page should log connection status
console.log('🔍 Checking backend connection...');
axios.get('/health').then(() => console.log('✅ Connected'));
```

**Guest Mode Detection Pattern:**
```javascript
const isGuest = localStorage.getItem('guestMode') === 'true';
if (isGuest) {
  // Skip API calls, use mock data
  setUserData({ name: 'Guest User', isGuest: true });
}
```

**Error Handling Pattern:**
```javascript
// Always use try-catch with .catch() fallback for graceful degradation
api.get('/goals').catch(() => ({ data: { goals: [] } }))
```

**Running Migrations Safely:**
```powershell
# Interactive script with prompts
.\run-migration-oauth.ps1
# Or direct psql (get credentials from Railway dashboard)
psql -h autorack.proxy.rlwy.net -U postgres -d railway -f migrations/0030_oauth_guest_support.sql
```
