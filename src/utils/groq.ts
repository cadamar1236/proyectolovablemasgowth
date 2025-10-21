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
  model: string = 'moonshotai/kimi-k2-instruct' // Kimi K2 - Excelente para análisis
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
        max_tokens: 2000,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API failed: ${response.status}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || '';
    
  } catch (error) {
    console.error('Error calling Groq:', error);
    throw error;
  }
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
  const prompt = `Generate complete, production-ready code for a ${template} MVP:

Project: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}

Generate actual working code for these files:
- package.json (with all dependencies)
- src/index.tsx (Hono backend with API routes)
- wrangler.jsonc (Cloudflare configuration)
- vite.config.ts (build configuration)
- README.md (setup instructions)

IMPORTANT: 
1. Use Hono framework with Cloudflare Workers
2. Include Tailwind CSS for styling
3. Make it production-ready and functional
4. Respond ONLY with valid JSON in this format:

{
  "files": {
    "package.json": "full package.json content here",
    "src/index.tsx": "full Hono code here",
    "wrangler.jsonc": "full config here",
    "vite.config.ts": "full vite config here",
    "README.md": "full readme here"
  }
}`;

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: 'You are an expert full-stack developer specializing in Cloudflare Workers and Hono framework. Generate clean, production-ready code. Always respond with valid JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, apiKey, 'moonshotai/kimi-k2-instruct');
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.files || {};
}
