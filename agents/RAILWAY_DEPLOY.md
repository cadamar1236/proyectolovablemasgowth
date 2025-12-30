# Railway Deployment Guide - LinkedIn Connector Agent

## Pre-requisites
- Railway account (railway.app)
- GitHub repository connected to Railway
- API keys configured (OpenAI, Apify)

## Deployment Steps

### 1. Install Railway CLI (Optional)
```bash
npm install -g @railway/cli
railway login
```

### 2. Deploy via Railway Dashboard

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Create New Project** or select existing project
3. **Connect GitHub Repository**: 
   - Select this repository
   - Set root directory to `/agents`

4. **Configure Build Settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Python Version: 3.11

5. **Add Environment Variables** (Settings → Variables):
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   APIFY_API_TOKEN=your_apify_api_token_here
   ALLOWED_ORIGINS=https://webapp-46s.pages.dev
   HOST=0.0.0.0
   ```
   
   ⚠️ **Security Note**: Get your actual API keys from `.env` file (not committed to git)

6. **Enable Health Check**:
   - Path: `/health`
   - Expected Response: 200 OK

7. **Deploy**: Railway will automatically deploy on commit

### 3. Deploy via Railway CLI (Alternative)

```bash
# Navigate to agents directory
cd agents

# Initialize Railway project
railway init

# Link to existing project (if exists)
railway link

# Add environment variables
railway variables set OPENAI_API_KEY=your_openai_api_key_here
railway variables set OPENAI_MODEL=gpt-4o-mini
railway variables set APIFY_API_TOKEN=your_apify_api_token_here
railway variables set ALLOWED_ORIGINS=https://webapp-46s.pages.dev

# Deploy
railway up
```

## Post-Deployment

### 1. Get Railway URL
After deployment, Railway will provide a URL like:
```
https://your-app-name.up.railway.app
```

### 2. Test Health Endpoint
```bash
curl https://your-app-name.up.railway.app/health
```

Expected response:
```json
{"status": "healthy"}
```

### 3. Test Search Endpoint
```bash
curl -X POST https://your-app-name.up.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI startup founder",
    "profile_type": "investor",
    "limit": 10
  }'
```

## Update Frontend

Once deployed, update the Railway URL in `src/marketplace-page.tsx`:

```javascript
// Replace this line
const response = await fetch('/api/linkedin-connector/search', {

// With your Railway URL
const response = await fetch('https://your-app-name.up.railway.app/search', {
```

## API Endpoints

- `GET /health` - Health check
- `POST /search` - Search LinkedIn profiles
  - Body: `{ query, profile_type, limit }`
- `POST /analyze` - Analyze profile compatibility
  - Body: `{ profile, context }`
- `POST /generate-message` - Generate personalized message
  - Body: `{ profile, sender_info, message_type }`

## Monitoring

1. **View Logs**: Railway Dashboard → Deployments → View Logs
2. **Metrics**: Railway Dashboard → Metrics (CPU, Memory, Network)
3. **Health Check**: Railway automatically monitors `/health` endpoint

## Troubleshooting

### Build Fails
- Check `requirements.txt` is in `/agents` directory
- Verify Python 3.11 compatibility
- Check Railway build logs

### Runtime Errors
- Verify environment variables are set correctly
- Check Railway logs for error details
- Ensure ALLOWED_ORIGINS includes your frontend URL

### CORS Errors
- Add frontend URL to ALLOWED_ORIGINS environment variable
- Verify CORS middleware in `app.py`

## Cost Optimization

- Railway free tier: 500 hours/month
- Monitor usage in Railway Dashboard
- Configure auto-sleep for unused services

## Security Notes

- **NEVER** commit `.env` file to git
- Environment variables are encrypted in Railway
- Rotate API keys periodically
- Use Railway's secret management for sensitive data
