import { render } from 'hono/jsx/dom'

// Punto de entrada del cliente
const root = document.getElementById('root')

if (root) {
  // Por ahora, mensaje simple
  root.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="text-align: center; color: white; padding: 2rem;">
        <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem;">🚀 ASTAR*</h1>
        <p style="font-size: 1.5rem; margin-bottom: 2rem;">Backup de Railway funcionando</p>
        <div style="background: white; color: #667eea; padding: 1rem 2rem; border-radius: 1rem; font-weight: bold;">
          APIs disponibles en: <br>
          <code style="font-family: monospace;">https://proyectolovablemasgowth-production-813a.up.railway.app/api</code>
        </div>
        <p style="margin-top: 2rem; opacity: 0.8;">
          Este es el sitio de respaldo. El sitio principal está en Cloudflare.
        </p>
      </div>
    </div>
  `
}
