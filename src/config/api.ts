/**
 * API Configuration
 * Determines the base URL for API calls based on environment
 */

// In Railway deployment, API is served from same origin
// In Cloudflare deployment, API is on Cloudflare Workers
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper to build API URLs
export function apiUrl(path: string): string {
  // If path already starts with http, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If no base URL, return relative path
  if (!API_BASE_URL) {
    return `/${cleanPath}`;
  }
  
  // Combine base URL with path
  return `${API_BASE_URL}/${cleanPath}`;
}
