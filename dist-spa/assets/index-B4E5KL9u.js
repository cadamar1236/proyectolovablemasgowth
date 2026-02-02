(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function s(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function i(e){if(e.ep)return;e.ep=!0;const t=s(e);fetch(e.href,t)}})();const n=document.getElementById("root");n&&(n.innerHTML=`
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
  `);
