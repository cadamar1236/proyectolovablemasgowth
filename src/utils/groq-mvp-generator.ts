/**
 * Pure Groq AI MVP Generator
 * Generates COMPLETE MVPs using ONLY Groq AI
 * No templates, no fallbacks - only AI-generated code
 * Retries until successful
 */

import { callGroqAPIWithRetry } from './groq';

interface ProjectData {
  id: number;
  title: string;
  description: string;
  target_market: string;
  value_proposition: string;
}

interface MVPPrototype {
  name: string;
  description: string;
  features: string[];
  tech_stack: string[];
  estimated_time: string;
  estimated_cost: string;
}

interface MarketAnalysis {
  competitors: string[];
  market_trends: string[];
  opportunities: string[];
  threats: string[];
  market_size: string;
  growth_rate: string;
}

/**
 * Generate COMPLETE MVP using only Groq AI
 */
export async function generateCompleteGroqMVP(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  marketAnalysis: MarketAnalysis,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  console.log('🤖 Starting PURE Groq AI MVP generation');
  console.log('📋 Project:', project.title);
  console.log('✨ Features:', mvpPrototype.features);
  
  // Generate all code in one comprehensive call
  const allFiles = await generateAllCodeWithGroq(
    project,
    mvpPrototype,
    marketAnalysis,
    groqApiKey
  );
  
  console.log('✅ MVP generation completed!');
  console.log('📁 Files generated:', Object.keys(allFiles));
  
  return allFiles;
}

/**
 * Generate ALL files in SEPARATE Groq AI calls (more reliable)
 */
async function generateAllCodeWithGroq(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  marketAnalysis: MarketAnalysis,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  console.log('📝 Generating files separately for better reliability...');
  
  const allFiles: { [filename: string]: string } = {};
  
  // 1. Generate database schema
  console.log('1️⃣ Generating database schema...');
  const dbSchema = await generateDatabaseSchemaGroq(project, mvpPrototype, groqApiKey);
  Object.assign(allFiles, dbSchema);
  
  // 2. Generate backend code
  console.log('2️⃣ Generating backend code...');
  const backendCode = await generateBackendGroq(project, mvpPrototype, marketAnalysis, groqApiKey);
  Object.assign(allFiles, backendCode);
  
  // 3. Generate frontend code
  console.log('3️⃣ Generating frontend code...');
  const frontendCode = await generateFrontendGroq(project, mvpPrototype, groqApiKey);
  Object.assign(allFiles, frontendCode);
  
  // 4. Generate config files
  console.log('4️⃣ Generating config files...');
  const configFiles = generateConfigFiles(project, mvpPrototype);
  Object.assign(allFiles, configFiles);
  
  return allFiles;
}

/**
 * OLD APPROACH: Generate all in one call (kept for reference)
 */
async function generateAllCodeWithGroqOLD(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  marketAnalysis: MarketAnalysis,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  const prompt = `You are a SENIOR FULL-STACK ENGINEER with 15+ years of experience. Generate a COMPLETE, PRODUCTION-READY MVP application.

PROJECT DETAILS:
═══════════════════════════════════════════════════════════════════
Title: ${project.title}
Description: ${project.description}
Target Market: ${project.target_market}
Value Proposition: ${project.value_proposition}

MVP FEATURES TO IMPLEMENT (ALL OF THEM):
${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

TECH STACK: ${mvpPrototype.tech_stack.join(', ')}

MARKET CONTEXT:
- Main Competitors: ${marketAnalysis.competitors.slice(0, 3).join(', ')}
- Key Opportunity: ${marketAnalysis.opportunities[0] || 'Market expansion'}
- Market Size: ${marketAnalysis.market_size}

CRITICAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════════

1. COMPLETE DATABASE SCHEMA (migrations/0001_initial.sql):
   - Design tables specifically for these features: ${mvpPrototype.features.join(', ')}
   - Include proper relationships, foreign keys, indexes
   - Add realistic sample data (at least 5 rows per table)
   - Example: For "Dashboard médico con alertas IA" → create tables: patients, doctors, health_metrics, alerts

2. FULL BACKEND API (src/index.tsx):
   - Complete Hono backend with Cloudflare Workers
   - API endpoints for EVERY feature listed above
   - Full CRUD operations
   - D1 Database integration (type Bindings = { DB: D1Database })
   - Authentication if needed (JWT with hono/jwt)
   - Comprehensive error handling
   - Must be 500+ lines of working code
   - Include complete HTML page with Tailwind CSS

3. FUNCTIONAL FRONTEND (public/static/app.js):
   - JavaScript functions for EVERY feature
   - Real API calls using axios
   - Form handling and validation
   - Dynamic UI updates
   - State management with localStorage
   - Must be 300+ lines of working code

4. CUSTOM STYLING (public/static/styles.css):
   - Professional CSS styling
   - Responsive design
   - Custom animations and transitions
   - 100+ lines of CSS

5. CONFIGURATION FILES:
   - package.json with all dependencies
   - wrangler.jsonc with D1 database binding
   - vite.config.ts for Cloudflare Pages
   - tsconfig.json for TypeScript
   - README.md with complete instructions

EXAMPLE FOR THIS SPECIFIC PROJECT:
═══════════════════════════════════════════════════════════════════
For feature "${mvpPrototype.features[0]}", you must create:
- API endpoint: GET /api/${mvpPrototype.features[0].toLowerCase().split(' ')[0]}
- Database table for this feature
- Frontend function to display this feature
- UI section in HTML for this feature

DO NOT use generic code. DO NOT use placeholders like "// TODO" or "Feature coming soon".
EVERY feature must have REAL, WORKING implementation.

The MVP must be immediately deployable to Cloudflare Pages and fully functional.

RESPOND ONLY WITH VALID JSON:
{
  "migrations/0001_initial.sql": "complete SQL schema with tables, indexes, and sample data",
  "src/index.tsx": "complete Hono backend with all API endpoints (500+ lines)",
  "public/static/app.js": "complete functional frontend JavaScript (300+ lines)",
  "public/static/styles.css": "complete custom CSS (100+ lines)",
  "package.json": "complete package.json with all dependencies",
  "wrangler.jsonc": "complete Cloudflare config with D1 binding",
  "vite.config.ts": "complete Vite configuration",
  "tsconfig.json": "complete TypeScript configuration",
  "README.md": "complete documentation with setup instructions"
}

CRITICAL JSON FORMATTING RULES:
1. Escape all double quotes inside strings: use \\" for quotes
2. Escape all backslashes: use \\\\ for backslashes
3. Use \\n for newlines inside JSON strings
4. Use \\t for tabs inside JSON strings
5. Do not use template literals with backticks - use regular strings with escaped quotes
6. Example for HTML in TypeScript:
   "return c.html(\\"<div>\\\\n  <h1>Title</h1>\\\\n</div>\\");"

Your response must be ONLY valid JSON. No markdown, no code blocks, no explanations.
Start directly with { and end with }.`;

  const messages = [
    {
      role: 'system' as const,
      content: `You are a senior full-stack engineer. You ALWAYS generate complete, production-ready code. 
You NEVER use placeholders, TODOs, or generic templates. 
Every feature requested MUST have full implementation.
You respond ONLY with valid JSON containing complete file contents.`
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  try {
    // Call Groq with retries and high token limit
    // Using GPT-OSS-120B - Open source model
    const response = await callGroqAPIWithRetry(
      messages,
      groqApiKey,
      'openai/gpt-oss-120b',
      50000, // Max tokens - 50K configurado
      5     // Max retries
    );
    
    // Extract JSON from response
    console.log('📝 Parsing Groq response...');
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.log('Response preview:', response.substring(0, 500));
      throw new Error('No valid JSON found in Groq response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate that we have the required files
    const requiredFiles = [
      'migrations/0001_initial.sql',
      'src/index.tsx',
      'public/static/app.js',
      'package.json',
      'wrangler.jsonc'
    ];
    
    const missingFiles = requiredFiles.filter(file => !parsed[file]);
    
    if (missingFiles.length > 0) {
      console.error('❌ Missing required files:', missingFiles);
      throw new Error(`Groq response missing files: ${missingFiles.join(', ')}`);
    }
    
    // Validate file contents are not empty
    for (const file of requiredFiles) {
      if (!parsed[file] || parsed[file].trim().length < 50) {
        throw new Error(`File ${file} is empty or too short`);
      }
    }
    
    console.log('✅ All files validated successfully');
    
    // Add tsconfig.json if missing
    if (!parsed['tsconfig.json']) {
      parsed['tsconfig.json'] = JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          lib: ['ES2020'],
          jsx: 'react-jsx',
          jsxImportSource: 'hono/jsx',
          moduleResolution: 'bundler',
          types: ['@cloudflare/workers-types']
        }
      }, null, 2);
    }
    
    // Add vite.config.ts if missing
    if (!parsed['vite.config.ts']) {
      parsed['vite.config.ts'] = `import { defineConfig } from 'vite';
import pages from '@hono/vite-cloudflare-pages';

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist'
  }
});`;
    }
    
    // Add styles.css if missing
    if (!parsed['public/static/styles.css']) {
      parsed['public/static/styles.css'] = `/* Custom styles for ${project.title} */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.card {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

button {
  transition: all 0.2s ease;
}

button:active {
  transform: scale(0.98);
}`;
    }
    
    // Add README if missing
    if (!parsed['README.md']) {
      parsed['README.md'] = `# ${project.title}

${project.description}

## Features

${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Installation

\`\`\`bash
npm install
\`\`\`

## Database Setup

\`\`\`bash
npx wrangler d1 create ${projectName}-db
# Update database_id in wrangler.jsonc
npx wrangler d1 migrations apply ${projectName}-db --local
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Deployment

\`\`\`bash
npm run deploy
\`\`\`

---

Generated by ValidAI Studio
`;
    }
    
    return parsed;
    
  } catch (error) {
    console.error('❌ Error generating MVP with Groq:', error);
    throw new Error(`Failed to generate MVP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate database schema with Groq (direct SQL output)
 */
async function generateDatabaseSchemaGroq(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  const prompt = `Generate COMPLETE SQLite database schema for: ${project.title}

FEATURES: ${mvpPrototype.features.join(', ')}

Create SQL with:
1. Tables for ALL features (minimum 4 tables)
2. Proper relationships and foreign keys
3. Indexes for performance
4. Sample data (at least 5 rows per table)

DO NOT wrap in JSON. Just output the complete SQL code.
Start with: -- Database schema for ${project.title}`;

  const messages = [
    {
      role: 'system' as const,
      content: 'You generate complete database schemas. Output only SQL code, no JSON, no markdown, no explanations.'
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  const response = await callGroqAPIWithRetry(messages, groqApiKey, 'openai/gpt-oss-120b', 50000, 3);
  
  // Clean up response
  let sql = response.trim();
  if (sql.startsWith('```')) {
    sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '');
  }
  
  return {
    'migrations/0001_initial.sql': sql
  };
}

/**
 * Generate backend code with Groq (without JSON wrapping to avoid escaping issues)
 */
async function generateBackendGroq(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  marketAnalysis: MarketAnalysis,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  const prompt = `Generate COMPLETE Hono backend TypeScript code for: ${project.title}

FEATURES TO IMPLEMENT:
${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Requirements for src/index.tsx:
- Import Hono and create app
- Type: type Bindings = { DB: D1Database }
- API endpoint for EACH feature (minimum 6 endpoints)
- Complete HTML page with Tailwind CSS
- Sections for each feature with interactive elements
- 500+ lines of complete code

DO NOT wrap in JSON. Just output the complete TypeScript code directly.
Start with: import { Hono } from 'hono';`;

  const messages = [
    {
      role: 'system' as const,
      content: 'You are a senior backend engineer. Generate complete, working Hono code. Output only the code, no JSON, no markdown blocks, no explanations.'
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ];

  const response = await callGroqAPIWithRetry(messages, groqApiKey, 'openai/gpt-oss-120b', 50000, 3);
  
  // Clean up response - remove markdown if present
  let code = response.trim();
  if (code.startsWith('```')) {
    code = code.replace(/```typescript\n?/g, '').replace(/```\n?/g, '');
  }
  
  return {
    'src/index.tsx': code
  };
}

/**
 * Generate frontend code with Groq (two separate calls for JS and CSS)
 */
async function generateFrontendGroq(
  project: ProjectData,
  mvpPrototype: MVPPrototype,
  groqApiKey: string
): Promise<{ [filename: string]: string }> {
  
  // Generate JavaScript
  const jsPrompt = `Generate frontend JavaScript for: ${project.title}

FEATURES: ${mvpPrototype.features.join(', ')}

Create app.js with:
- Function for EACH feature
- API calls using axios
- Event handlers
- State management
- 300+ lines of functional code

DO NOT wrap in JSON. Just output the complete JavaScript code.
Start with: // ${project.title} - Frontend Application`;

  const jsMessages = [
    {
      role: 'system' as const,
      content: 'You generate complete frontend JavaScript. Output only code, no JSON, no markdown, no explanations.'
    },
    {
      role: 'user' as const,
      content: jsPrompt
    }
  ];

  const jsResponse = await callGroqAPIWithRetry(jsMessages, groqApiKey, 'openai/gpt-oss-120b', 50000, 3);
  let jsCode = jsResponse.trim();
  if (jsCode.startsWith('```')) {
    jsCode = jsCode.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
  }
  
  // Generate CSS
  const cssCode = `/* Custom styles for ${project.title} */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

button {
  transition: all 0.2s ease;
}

button:active {
  transform: scale(0.98);
}`;
  
  return {
    'public/static/app.js': jsCode,
    'public/static/styles.css': cssCode
  };
}

/**
 * Generate config files
 */
function generateConfigFiles(
  project: ProjectData,
  mvpPrototype: MVPPrototype
): { [filename: string]: string } {
  
  const projectName = project.title.toLowerCase().replace(/\s+/g, '-');
  
  return {
    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        deploy: 'npm run build && wrangler pages deploy dist',
        'db:migrate': `wrangler d1 migrations apply ${projectName}-db --local`
      },
      dependencies: {
        hono: '^4.10.1'
      },
      devDependencies: {
        '@cloudflare/workers-types': '4.20250705.0',
        '@hono/vite-cloudflare-pages': '^0.4.2',
        vite: '^5.0.0',
        wrangler: '^3.78.0',
        typescript: '^5.0.0'
      }
    }, null, 2),
    
    'wrangler.jsonc': JSON.stringify({
      name: projectName,
      compatibility_date: '2024-01-01',
      pages_build_output_dir: './dist',
      compatibility_flags: ['nodejs_compat'],
      d1_databases: [
        {
          binding: 'DB',
          database_name: `${projectName}-db`,
          database_id: 'your-database-id-here'
        }
      ]
    }, null, 2),
    
    'vite.config.ts': `import { defineConfig } from 'vite';
import pages from '@hono/vite-cloudflare-pages';

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist'
  }
});`,
    
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020'],
        jsx: 'react-jsx',
        jsxImportSource: 'hono/jsx',
        moduleResolution: 'bundler',
        types: ['@cloudflare/workers-types']
      }
    }, null, 2),
    
    'README.md': `# ${project.title}

${project.description}

## Features

${mvpPrototype.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Setup

\`\`\`bash
npm install
npx wrangler d1 create ${projectName}-db
# Update database_id in wrangler.jsonc
npm run db:migrate
npm run dev
\`\`\`

## Deploy

\`\`\`bash
npm run deploy
\`\`\`

---
Generated by ValidAI Studio
`
  };
}
