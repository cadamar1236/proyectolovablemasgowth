// Vercel Edge Function wrapper for Cloudflare Worker
import worker from '../../dist/_worker.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    // Create a Cloudflare-like environment for the worker
    const env = {};
    
    // Call the worker's fetch handler
    return await worker.fetch(request, env);
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
