/**
 * Groq API Integration
 * Ultra-fast inference with Llama 3.1 and Mixtral models
 */

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function callGroqAPI(
  messages: GroqMessage[],
  apiKey: string,
  model: string = 'openai/gpt-oss-120b', // GPT-OSS-120B - Open source model
  maxTokens: number = 50000 // Máximo configurado para respuestas largas
): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API failed: ${response.status} - ${error}`);
    }

    const data: GroqResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    if (!content) {
      throw new Error('Empty response from Groq API');
    }
    
    return content;
    
  } catch (error) {
    console.error('Error calling Groq:', error);
    throw error;
  }
}

/**
 * Call Groq API with automatic retries
 */
export async function callGroqAPIWithRetry(
  messages: GroqMessage[],
  apiKey: string,
  model: string = 'openai/gpt-oss-120b',
  maxTokens: number = 50000,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Groq API attempt ${attempt}/${maxRetries}`);
      const result = await callGroqAPI(messages, apiKey, model, maxTokens);
      console.log(`✅ Groq API succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Groq API attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`Groq API failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Analyze startup idea with Groq AI
 */
export async function analyzeWithGroq(project: any, apiKey: string): Promise<any> {
  const prompt = `Analyze this startup idea and provide detailed market insights:

Title: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}
Value Proposition: ${project.value_proposition}

Provide a comprehensive analysis with:
1. Top 5 real competitors (actual company names)
2. Top 5 current market trends
3. Top 5 key opportunities
4. Top 5 main threats
5. Estimated market size with sources
6. Estimated growth rate (CAGR)
7. Success probability (between 0 and 1)

IMPORTANT: Respond ONLY with valid JSON. Use this exact format:
{
  "competitors": ["Company 1", "Company 2", "Company 3", "Company 4", "Company 5"],
  "market_trends": ["Trend 1", "Trend 2", "Trend 3", "Trend 4", "Trend 5"],
  "opportunities": ["Opp 1", "Opp 2", "Opp 3", "Opp 4", "Opp 5"],
  "threats": ["Threat 1", "Threat 2", "Threat 3", "Threat 4", "Threat 5"],
  "market_size": "Detailed market size",
  "growth_rate": "X% CAGR",
  "success_probability": 0.75
}`;

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: 'You are an expert startup analyst with deep knowledge of markets, competitors, and trends. Always respond with valid JSON only, no markdown or explanations.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, apiKey);
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate MVP specification with Groq AI
 */
export async function generateMVPWithGroq(project: any, apiKey: string): Promise<any> {
  const prompt = `Generate a detailed MVP specification for this startup:

Title: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}
Value Proposition: ${project.value_proposition}

Create a complete MVP specification with:
1. MVP name (creative and relevant)
2. Brief description (2-3 sentences explaining the MVP)
3. 6-8 core features (specific and actionable)
4. Recommended tech stack (5-7 modern technologies)
5. Estimated development time (realistic)
6. Estimated cost range (based on market rates)

IMPORTANT: Respond ONLY with valid JSON. Use this exact format:
{
  "name": "MVP Name",
  "description": "Detailed description of the MVP",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
  "tech_stack": ["Tech 1", "Tech 2", "Tech 3", "Tech 4", "Tech 5"],
  "estimated_time": "X-Y weeks",
  "estimated_cost": "$X,XXX - $Y,YYY"
}`;

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: 'You are a senior technical architect with expertise in MVP development and modern tech stacks. Always respond with valid JSON only, no markdown or explanations.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, apiKey);
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate full MVP code with Groq AI
 */
export async function generateMVPCodeWithGroq(
  project: any,
  template: string,
  apiKey: string
): Promise<{ [filename: string]: string }> {
  const prompt = `Generate a COMPLETE, PRODUCTION-READY ${template} MVP with FULL FUNCTIONALITY:

Project: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}
Value Proposition: ${project.value_proposition}

REQUIREMENTS - Generate ALL these files with COMPLETE, WORKING code:

1. package.json - Include ALL necessary dependencies for a real application
2. src/index.tsx - FULL Hono backend with:
   - Complete API routes with CRUD operations
   - Database integration (D1)
   - Error handling and validation
   - Authentication endpoints (login, register, logout)
   - Business logic for the specific use case
   - HTML responses with complete UI

3. migrations/0001_initial.sql - Complete database schema with:
   - All necessary tables with proper relationships
   - Indexes for performance
   - Foreign keys and constraints
   - Sample data insertions

4. public/static/app.js - FUNCTIONAL frontend JavaScript with:
   - API calls to backend endpoints
   - Form handling and validation
   - Dynamic UI updates
   - State management
   - Error handling

5. public/static/styles.css - Custom styling beyond Tailwind

6. wrangler.jsonc - Cloudflare configuration with D1 database binding

7. vite.config.ts - Build configuration

8. README.md - Complete setup and deployment instructions

CRITICAL REQUIREMENTS:
- This must be a REAL, WORKING application, not a skeleton
- Include actual business logic specific to: ${project.description}
- All API endpoints must have real implementations
- Frontend must actually work and communicate with backend
- Database must have proper schema for the use case
- Include authentication and authorization
- Add input validation and error handling
- Make it production-ready and deployable immediately

EXAMPLE FUNCTIONALITY REQUIRED FOR ${template}:
${getTemplateRequirements(template)}

Respond ONLY with valid JSON (no markdown, no explanations):
{
  "files": {
    "package.json": "complete package.json with all dependencies",
    "src/index.tsx": "complete Hono backend with ALL API routes and logic",
    "migrations/0001_initial.sql": "complete database schema",
    "public/static/app.js": "complete functional frontend code",
    "public/static/styles.css": "custom CSS styling",
    "wrangler.jsonc": "complete Cloudflare config",
    "vite.config.ts": "vite configuration",
    "README.md": "complete documentation"
  }
}`;

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are a senior full-stack engineer with 10+ years experience building production applications. 
You specialize in Cloudflare Workers, Hono framework, and modern web development.
You ALWAYS generate complete, working, production-ready code - never skeletons or placeholders.
Every API endpoint you create has full implementation.
Every frontend you create is fully functional with real interactivity.
You respond ONLY with valid JSON containing complete file contents.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, apiKey, 'openai/gpt-oss-120b', 50000);
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.files || {};
}

/**
 * Get specific requirements for each template type
 */
function getTemplateRequirements(template: string): string {
  const requirements: { [key: string]: string } = {
    saas: `- User registration and login with JWT authentication
- User dashboard with profile management
- Subscription plans and billing integration
- Settings page with account management
- API endpoints for all user operations
- Protected routes and authorization
- Email verification system`,
    
    marketplace: `- Product listing and search functionality
- Shopping cart with add/remove items
- Checkout process with payment integration
- Seller dashboard to manage products
- Order management system
- Rating and review system
- User profiles for buyers and sellers`,
    
    landing: `- Hero section with compelling copy
- Feature showcase with icons and descriptions
- Pricing table with multiple tiers
- Contact form with email integration
- Newsletter signup with validation
- Testimonials section
- FAQ section
- Mobile-responsive design`,
    
    dashboard: `- Data visualization with charts (Chart.js)
- Real-time metrics display
- Filter and date range selection
- Export data functionality
- Multiple dashboard views
- User activity tracking
- Performance indicators`,
    
    crm: `- Customer list with search and filters
- Add/edit/delete customer records
- Deal pipeline management
- Task and activity tracking
- Contact history and notes
- Email integration
- Reports and analytics`
  };
  
  return requirements[template] || requirements.saas;
}
