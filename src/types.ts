// Type definitions for Cloudflare bindings
export type Bindings = {
  DB: D1Database;
  AI?: Ai;
  GROQ_API_KEY?: string;
}

// Project types
export interface Project {
  id?: number;
  user_id: number;
  title: string;
  description: string;
  target_market: string;
  value_proposition: string;
  status: 'draft' | 'analyzing' | 'validated' | 'failed';
  created_at?: string;
  updated_at?: string;
}

export interface MarketAnalysis {
  id?: number;
  project_id: number;
  competitors: string[];
  market_trends: string[];
  opportunities: string[];
  threats: string[];
  market_size: string;
  growth_rate: string;
  success_probability: number;
  created_at?: string;
}

export interface MVPPrototype {
  id?: number;
  project_id: number;
  name: string;
  description: string;
  features: string[];
  wireframe_url?: string;
  tech_stack: string[];
  estimated_time: string;
  estimated_cost: string;
  created_at?: string;
}

export interface BetaUser {
  id?: number;
  name: string;
  email: string;
  role: string;
  age: number;
  industry: string;
  bio: string;
  available: boolean;
  rating: number;
  created_at?: string;
}

export interface TestResult {
  id?: number;
  project_id: number;
  beta_user_id: number;
  rating: number;
  feedback: string;
  would_pay: boolean;
  suggested_price: number;
  created_at?: string;
}

export interface GrowthStrategy {
  id?: number;
  project_id: number;
  strategy_type: string;
  title: string;
  description: string;
  channels: string[];
  estimated_cac: string;
  estimated_ltv: string;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
}

export interface Metric {
  id?: number;
  project_id: number;
  metric_type: string;
  value: number;
  date?: string;
  created_at?: string;
}
