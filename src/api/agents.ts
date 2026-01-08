/**
 * Multi-Agent API Client
 * Cliente TypeScript para interactuar con el sistema multiagente
 * Los agentes acceden a la base de datos D1 via API HTTP
 */

// Railway API URL - Update with your actual Railway deployment URL
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://proyectolovablemasgowth-production.up.railway.app';

interface MetricsData {
  monthly_users?: number;
  revenue?: number;
  growth_rate?: number;
  churn_rate?: number;
  cac?: number;
  ltv?: number;
  mrr?: number;
  arr?: number;
  nps?: number;
  dau?: number;
  mau?: number;
  conversion_rate?: number;
}

interface Goal {
  name: string;
  current_value: number;
  target_value: number;
  deadline: string;
  metric_type: 'users' | 'revenue' | 'engagement' | 'conversion';
}

interface BrandAnalysis {
  colors: string[];
  typography: string[];
  tone: string;
  values: string[];
  target_audience: string;
  key_messages: string[];
}

interface GeneratedImage {
  url: string;
  type: string;
  dimensions: { width: number; height: number };
  prompt: string;
}

interface AnalysisResult {
  success: boolean;
  analysis?: string;
  response?: string;
  error?: string;
  timestamp: string;
}

interface ChatResult {
  success: boolean;
  response?: string;
  session_id?: string;
  user_id?: number;
  error?: string;
}

interface ComparisonResult {
  success: boolean;
  comparison?: any;
  insights?: string;
  error?: string;
  timestamp: string;
}

interface ReportResult {
  success: boolean;
  report?: string;
  raw_data?: any;
  period?: string;
  error?: string;
  timestamp: string;
}

interface BrandImageResult {
  success: boolean;
  images?: GeneratedImage[];
  brand_identity?: BrandAnalysis;
  campaign_name?: string;
  error?: string;
  timestamp: string;
}

interface OrchestatorAnalysis {
  success: boolean;
  analysis?: {
    startup: string;
    url: string;
    timestamp: string;
    analyses: {
      metrics?: any;
      brand?: any;
      marketing?: any;
    };
    executive_summary?: string;
  };
  error?: string;
  timestamp: string;
}

interface AgentsHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  agents: {
    linkedin: { status: string; apify_configured: boolean };
    metrics: { status: string; openai_configured: boolean };
    brand_marketing: { 
      status: string; 
      openai_configured: boolean;
      fal_configured: boolean;
      apify_configured: boolean;
    };
    orchestrator: { status: string };
  };
}

/**
 * Analizar métricas de una startup (obtiene datos de la base de datos)
 */
export async function analyzeMetrics(
  userId: number,
  query?: string,
  industry: string = 'SaaS',
  stage: string = 'seed'
): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/metrics/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        query: query || 'Analiza mis métricas actuales y dame recomendaciones',
        industry,
        stage
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Chat con el agente de métricas
 */
export async function chatWithMetricsAgent(
  userId: number,
  message: string,
  sessionId?: string
): Promise<ChatResult> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/metrics/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message,
        session_id: sessionId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error chatting with metrics agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Comparar métricas con benchmarks de la industria
 */
export async function compareWithBenchmarks(
  userId: number,
  industry: string = 'SaaS',
  stage: string = 'seed'
): Promise<ComparisonResult> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/metrics/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        industry,
        stage
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error comparing with benchmarks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generar reporte de métricas
 */
export async function generateMetricsReport(
  userId: number,
  period: 'weekly' | 'monthly' | 'quarterly' = 'weekly'
): Promise<ReportResult> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/metrics/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        period
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Analizar identidad de marca de un sitio web
 */
export async function analyzeBrandIdentity(websiteUrl: string): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/brand/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ website_url: websiteUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generar imágenes de marketing basadas en la marca
 */
export async function generateMarketingImages(
  websiteUrl: string,
  contentTypes: ('social_post' | 'banner' | 'story' | 'ad')[] = ['social_post'],
  campaignName?: string
): Promise<BrandImageResult> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/brand/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website_url: websiteUrl,
        content_types: contentTypes,
        campaign_name: campaignName
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Análisis integral de startup usando el orquestador
 */
export async function analyzeStartupFull(
  startupUrl: string,
  startupName: string,
  description: string,
  metrics?: MetricsData,
  generateImages: boolean = true
): Promise<OrchestatorAnalysis> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/orchestrator/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startup_url: startupUrl,
        startup_name: startupName,
        description,
        metrics,
        generate_images: generateImages
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in full analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Verificar estado de salud del sistema de agentes
 */
export async function checkAgentsHealth(): Promise<AgentsHealthStatus | null> {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/agents/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking agents health:', error);
    return null;
  }
}

/**
 * Hook para usar en componentes React
 */
export function useAgentsAPI() {
  return {
    // Métricas (con acceso a base de datos)
    analyzeMetrics,
    chatWithMetricsAgent,
    compareWithBenchmarks,
    generateMetricsReport,
    
    // Brand & Marketing
    analyzeBrandIdentity,
    generateMarketingImages,
    
    // Orquestador
    analyzeStartupFull,
    
    // Health
    checkAgentsHealth,
    
    // Constantes
    RAILWAY_API_URL
  };
}

// Export types
export type {
  MetricsData,
  Goal,
  BrandAnalysis,
  GeneratedImage,
  AnalysisResult,
  ChatResult,
  ComparisonResult,
  ReportResult,
  BrandImageResult,
  OrchestatorAnalysis,
  AgentsHealthStatus
};
