/**
 * ASTAR Cron Worker
 * Worker separado para ejecutar los cron jobs de ASTAR
 * Debe desplegarse como Worker independiente con Cron Triggers habilitados
 * 
 * Para desplegar:
 * 1. cd workers/astar-cron
 * 2. wrangler deploy
 * 
 * Configurar en Cloudflare Dashboard:
 * - Cron Triggers: "0 8 * * *" y "0 20 * * *"
 * - Variables de entorno: CRON_SECRET (igual que en el proyecto principal)
 */

export interface Env {
  CRON_SECRET: string;
  LOVABLEGROWTH_URL: string;
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const now = new Date();
    console.log(`[ASTAR-CRON] Triggered at ${now.toISOString()}`);

    try {
      const response = await fetch(
        `${env.LOVABLEGROWTH_URL || 'https://lovablegrowth.com'}/api/astar-messages/cron/send-daily`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': env.CRON_SECRET || ''
          }
        }
      );

      if (!response.ok) {
        console.error(`[ASTAR-CRON] HTTP Error: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log('[ASTAR-CRON] Result:', JSON.stringify(result));
    } catch (error) {
      console.error('[ASTAR-CRON] Error:', error);
    }
  },

  // Endpoint para pruebas manuales
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/test' && request.method === 'POST') {
      // Verificar secret
      const secret = request.headers.get('X-Cron-Secret');
      if (secret !== env.CRON_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        const response = await fetch(
          `${env.LOVABLEGROWTH_URL || 'https://lovablegrowth.com'}/api/astar-messages/cron/send-daily`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Cron-Secret': env.CRON_SECRET
            }
          }
        );

        const result = await response.json();
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('ASTAR Cron Worker - Use POST /test to trigger manually', {
      status: 200
    });
  }
};
