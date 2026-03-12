import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  if (!authToken && !tokenInUrl) {
    return c.redirect('/');
  }

  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as any;
    } catch {
      if (!tokenInUrl) return c.redirect('/');
      payload = { userId: 0, userName: 'Loading...', email: '', name: 'Loading...', role: 'founder' };
    }
  }
  if (!payload) {
    payload = { userId: 0, userName: 'Loading...', email: '', name: 'Loading...', role: 'founder' };
  }

  const safeUser = (payload.userName || payload.name || payload.email || 'Usuario').replace(/"/g, '\\"').replace(/`/g, '\\`');
  const safeEmail = (payload.email || '').replace(/"/g, '\\"');
  const safeRole = (payload.role || 'founder').replace(/"/g, '\\"');
  const userId = payload.userId || 0;

  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Startup OS · ASTAR*</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
    *{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
    .scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .dot-bounce{animation:bounce .9s infinite}.dot-bounce:nth-child(2){animation-delay:.15s}.dot-bounce:nth-child(3){animation-delay:.3s}
    .msg-in{animation:fadeIn .2s ease-out}
    .sidebar-btn{transition:background .15s,color .15s}
    .sidebar-btn.active{background:#7c3aed;color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.35)}
    .sidebar-btn:not(.active):hover{background:rgba(255,255,255,.07);color:#e2e8f0}
    .task-card{transition:background .15s,border-color .15s}
    .task-card:hover{background:rgba(255,255,255,.08);border-color:rgba(167,139,250,.35)}
    .task-card.done{opacity:.55}
    .bubble-user{background:#7c3aed;border-radius:16px 16px 3px 16px}
    .bubble-ai{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:16px 16px 16px 3px}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}
    #chat-input{min-height:36px;max-height:120px;line-height:1.5}
  </style>
</head>
<body class="bg-gray-950 text-white overflow-hidden" style="height:100vh">
<div class="flex h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">

<!-- ═══ SIDEBAR ═══════════════════════════════════════════════════════════════ -->
<aside id="sidebar" class="flex flex-col bg-black/60 backdrop-blur-2xl border-r border-white/8 transition-all duration-300 shrink-0 overflow-hidden" style="width:13rem">
  <div class="flex items-center gap-2 px-3 py-4 border-b border-white/8 shrink-0">
    <button onclick="toggleSidebar()" class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0 hover:opacity-90 transition">⚡</button>
    <span id="sb-brand" class="font-bold text-white text-sm tracking-wide truncate">ASTAR*</span>
  </div>
  <nav class="flex-1 px-2 py-3 space-y-1 overflow-y-auto scrollbar-hide">
    <button class="sidebar-btn active w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm" onclick="switchSection('os')" id="nav-os"><span class="text-base shrink-0">🚀</span><span class="nl truncate">Startup OS</span></button>
    <button class="sidebar-btn w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm text-gray-400" onclick="switchSection('traction')" id="nav-traction"><span class="text-base shrink-0">📈</span><span class="nl truncate">Traction</span></button>
    <button class="sidebar-btn w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm text-gray-400" onclick="switchSection('team')" id="nav-team"><span class="text-base shrink-0">👥</span><span class="nl truncate">Team</span></button>
    <button class="sidebar-btn w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm text-gray-400" onclick="switchSection('investors')" id="nav-investors"><span class="text-base shrink-0">💰</span><span class="nl truncate">Investors</span></button>
    <button class="sidebar-btn w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm text-gray-400" onclick="switchSection('linkedin')" id="nav-linkedin"><span class="text-base shrink-0">🔗</span><span class="nl truncate">LinkedIn</span></button>
    <button class="sidebar-btn w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm text-gray-400" onclick="switchSection('docs')" id="nav-docs"><span class="text-base shrink-0">📝</span><span class="nl truncate">Docs</span></button>
  </nav>
  <div class="px-2 py-3 border-t border-white/8 shrink-0 space-y-1">
    <div class="flex items-center gap-2 px-2 py-2">
      <div class="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">${safeUser[0]||'U'}</div>
      <div class="flex-1 min-w-0 nl"><p class="text-xs font-medium text-white truncate">${safeUser}</p><p class="text-xs text-gray-400 capitalize truncate">${safeRole}</p></div>
    </div>
    <a href="/" class="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition"><span>↩</span><span class="nl">Sign out</span></a>
  </div>
</aside>

<!-- ═══ MAIN ════════════════════════════════════════════════════════════════ -->
<main class="flex-1 flex overflow-hidden">

<!-- ── STARTUP OS ──────────────────────────────────────────────────────── -->
<section id="section-os" class="flex-1 flex gap-3 p-3 overflow-hidden">

  <!-- LEFT: Objective board -->
  <div class="w-2/5 min-w-64 max-w-md flex flex-col overflow-hidden bg-black/40 backdrop-blur-xl rounded-2xl border border-white/8">
    <div class="px-4 py-3 border-b border-white/8 bg-black/20 shrink-0">
      <div class="flex items-center justify-between mb-2">
        <div><h2 class="font-bold text-white text-sm">Objetivos</h2><p id="task-count" class="text-xs text-gray-400">0 tareas</p></div>
        <div class="flex gap-1">
          <button onclick="setView('list')" id="view-list" class="px-2 py-1 rounded text-xs bg-purple-600 text-white">☰</button>
          <button onclick="setView('kanban')" id="view-kanban" class="px-2 py-1 rounded text-xs text-gray-400 hover:text-white">⊞</button>
        </div>
      </div>
      <div id="progress-wrap" class="mb-2 hidden">
        <div class="flex justify-between text-xs text-gray-400 mb-1"><span>Progreso</span><span id="progress-pct" class="text-purple-300 font-medium">0%</span></div>
        <div class="h-1.5 bg-white/5 rounded-full overflow-hidden"><div id="progress-bar" class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style="width:0%"></div></div>
      </div>
      <input id="task-search" oninput="renderTasks()" placeholder="Buscar tareas…" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50 placeholder-gray-500 mb-2">
      <div class="flex gap-1 overflow-x-auto scrollbar-hide">
        <button onclick="setFilter('all')" id="filter-all" class="px-2.5 py-1 rounded-full text-xs whitespace-nowrap bg-purple-600 text-white">Todo</button>
        <button onclick="setFilter('todo')" id="filter-todo" class="px-2.5 py-1 rounded-full text-xs whitespace-nowrap bg-white/5 text-gray-400 hover:text-white">Por hacer</button>
        <button onclick="setFilter('doing')" id="filter-doing" class="px-2.5 py-1 rounded-full text-xs whitespace-nowrap bg-white/5 text-gray-400 hover:text-white">En curso</button>
        <button onclick="setFilter('done')" id="filter-done" class="px-2.5 py-1 rounded-full text-xs whitespace-nowrap bg-white/5 text-gray-400 hover:text-white">Hecho</button>
        <button onclick="setFilter('blocked')" id="filter-blocked" class="px-2.5 py-1 rounded-full text-xs whitespace-nowrap bg-white/5 text-gray-400 hover:text-white">Bloqueado</button>
      </div>
    </div>
    <div id="task-list" class="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-hide"></div>
    <div class="px-3 pb-3 shrink-0">
      <button onclick="openQuickAdd()" id="quick-add-btn" class="w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-white/15 hover:border-purple-500/40 text-gray-500 hover:text-gray-300 text-sm transition">
        <span>＋</span> Añadir tarea
      </button>
      <div id="quick-add-form" class="hidden rounded-xl border border-purple-500/30 bg-white/5 p-3 space-y-2">
        <input id="qa-title" placeholder="Título de la tarea…" class="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-white outline-none placeholder-gray-500 focus:border-purple-500/50" onkeydown="if(event.key==='Enter')addTask();if(event.key==='Escape')closeQuickAdd()">
        <div class="flex items-center gap-2">
          <select id="qa-area" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none flex-1">
            <option value="">Área…</option>
            <option>Product</option><option>Growth</option><option>Fundraising</option>
            <option>Team</option><option>Legal</option><option>Finance</option>
            <option>Marketing</option><option>Otro</option>
          </select>
          <select id="qa-priority" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none">
            <option value="medium">Media</option><option value="high">Alta</option><option value="low">Baja</option>
          </select>
          <button onclick="addTask()" class="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition">✓</button>
          <button onclick="closeQuickAdd()" class="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-lg transition">✕</button>
        </div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Astro chat -->
  <div class="flex-1 flex flex-col overflow-hidden bg-black/40 backdrop-blur-xl rounded-2xl border border-white/8">
    <div class="flex items-center px-4 py-3 border-b border-white/8 bg-black/20 shrink-0">
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg mr-3 shrink-0">⚡</div>
      <div>
        <div class="font-bold text-white text-sm">Astro</div>
        <div class="text-xs text-green-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>AI Cofounder · online</div>
      </div>
      <div class="ml-auto flex gap-2">
        <button onclick="clearChat()" title="Nueva conversación" class="text-gray-500 hover:text-gray-300 transition text-xs px-2 py-1 rounded-lg hover:bg-white/5">🗑 Limpiar</button>
      </div>
    </div>
    <div id="chat-messages" class="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide"></div>
    <div id="quick-prompts" class="px-4 pb-2 flex flex-wrap gap-2">
      <button onclick="sendQuick('\\u00bfCu\\u00e1l debería ser mi objetivo #1 esta semana?')" class="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1.5 transition">🎯 Objetivo esta semana</button>
      <button onclick="sendQuick('Dame un plan para conseguir mis primeros 100 usuarios')" class="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1.5 transition">🚀 100 primeros usuarios</button>
      <button onclick="sendQuick('Ay\\u00fadame a mejorar mi pitch para inversores')" class="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1.5 transition">💡 Mejorar pitch</button>
      <button onclick="sendQuick('Analiza mis objetivos y dame recomendaciones')" class="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1.5 transition">📊 Analizar objetivos</button>
    </div>
    <div class="px-3 pb-3 shrink-0">
      <div class="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-purple-500/50 transition">
        <textarea id="chat-input" rows="1" placeholder="Cu\\u00e9ntale a Astro qu\\u00e9 est\\u00e1 pasando…"
          class="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder-gray-500 overflow-y-auto scrollbar-hide"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
        <div class="flex items-center gap-1 shrink-0 pb-0.5">
          <button onclick="toggleRecording()" id="mic-btn" title="Voz" class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">🎙</button>
          <button onclick="sendMessage()" class="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </div>
      </div>
      <p class="text-center text-gray-600 text-xs mt-1">Enter envía · Shift+Enter nueva línea</p>
    </div>
  </div>
</section>

<!-- ── TRACTION ─────────────────────────────────────────────────────────── -->
<section id="section-traction" class="flex-1 overflow-y-auto p-6 space-y-6 hidden scrollbar-hide">
  <div class="flex items-center justify-between">
    <div><h2 class="text-2xl font-bold text-white">Traction</h2><p class="text-gray-400 text-sm">Métricas de tu startup</p></div>
    <button onclick="toggleMetricsEdit()" id="metrics-edit-btn" class="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-sm transition">✏️ Actualizar</button>
  </div>
  <div id="metrics-edit-form" class="hidden bg-black/30 border border-purple-500/20 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
    <div><label class="text-xs text-gray-400">👤 Usuarios</label><input id="m-users" type="number" class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" value="0"></div>
    <div><label class="text-xs text-gray-400">💰 MRR ($)</label><input id="m-revenue" type="number" class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" value="0"></div>
    <div><label class="text-xs text-gray-400">📈 Crecimiento %</label><input id="m-growth" type="number" class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" value="0"></div>
    <div><label class="text-xs text-gray-400">⭐ NPS</label><input id="m-nps" type="number" class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" value="0"></div>
    <div><label class="text-xs text-gray-400">🔁 Sesiones/sem</label><input id="m-sessions" type="number" class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" value="0"></div>
    <div><label class="text-xs text-gray-400">🔻 Churn %</label><input id="m-churn" type="number" class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" value="0"></div>
    <div class="col-span-full"><button onclick="saveMetrics()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition">Guardar</button></div>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <div class="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30"><div class="flex items-center justify-between mb-2"><span class="text-gray-300 text-xs font-medium">Usuarios</span><span class="text-2xl">👤</span></div><div id="card-users" class="text-3xl font-bold text-white">0</div></div>
    <div class="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-xl rounded-2xl p-5 border border-green-500/30"><div class="flex items-center justify-between mb-2"><span class="text-gray-300 text-xs font-medium">MRR</span><span class="text-2xl">💰</span></div><div id="card-revenue" class="text-3xl font-bold text-white">$0</div></div>
    <div class="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/30"><div class="flex items-center justify-between mb-2"><span class="text-gray-300 text-xs font-medium">Crecimiento</span><span class="text-2xl">📈</span></div><div id="card-growth" class="text-3xl font-bold text-white">0%</div></div>
    <div class="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-xl rounded-2xl p-5 border border-yellow-500/30"><div class="flex items-center justify-between mb-2"><span class="text-gray-300 text-xs font-medium">NPS</span><span class="text-2xl">⭐</span></div><div id="card-nps" class="text-3xl font-bold text-white">0</div></div>
    <div class="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-xl rounded-2xl p-5 border border-pink-500/30"><div class="flex items-center justify-between mb-2"><span class="text-gray-300 text-xs font-medium">Sesiones/sem</span><span class="text-2xl">🔁</span></div><div id="card-sessions" class="text-3xl font-bold text-white">0</div></div>
    <div class="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-xl rounded-2xl p-5 border border-red-500/30"><div class="flex items-center justify-between mb-2"><span class="text-gray-300 text-xs font-medium">Churn</span><span class="text-2xl">🔻</span></div><div id="card-churn" class="text-3xl font-bold text-white">0%</div></div>
  </div>
  <div class="bg-black/30 border border-white/10 rounded-2xl p-5">
    <h3 class="text-sm font-bold text-white mb-4">Completion de objetivos</h3>
    <div id="traction-goals"></div>
  </div>
</section>

<!-- ── TEAM ─────────────────────────────────────────────────────────────── -->
<section id="section-team" class="flex-1 overflow-y-auto p-6 space-y-6 hidden scrollbar-hide">
  <div><h2 class="text-2xl font-bold text-white">Team</h2><p class="text-gray-400 text-sm">Tu equipo fundador</p></div>
  <div class="bg-black/20 border border-white/10 rounded-2xl p-4 flex gap-2 flex-wrap">
    <select id="tm-emoji" class="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none">
      <option>👤</option><option>👩‍💻</option><option>👨‍💻</option><option>🎨</option><option>📊</option><option>🚀</option><option>💡</option><option>🔧</option>
    </select>
    <input id="tm-name" placeholder="Nombre" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 min-w-24" onkeydown="if(event.key==='Enter')addMember()">
    <input id="tm-role" placeholder="Rol (CTO, CPO…)" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 min-w-24" onkeydown="if(event.key==='Enter')addMember()">
    <button onclick="addMember()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition">+ Añadir</button>
  </div>
  <div id="team-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
</section>

<!-- ── INVESTORS ──────────────────────────────────────────────────────── -->
<section id="section-investors" class="flex-1 overflow-y-auto p-6 space-y-6 hidden scrollbar-hide">
  <div><h2 class="text-2xl font-bold text-white">Investor Pipeline</h2><p class="text-gray-400 text-sm">Seguimiento de fundraising</p></div>
  <div class="bg-black/20 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
    <input id="inv-name" placeholder="Nombre del inversor" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50">
    <input id="inv-fund" placeholder="Fondo / firma" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50">
    <input id="inv-notes" placeholder="Notas" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50">
    <button onclick="addInvestor()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition">+ Añadir</button>
  </div>
  <div id="investors-list" class="space-y-2"></div>
</section>

<!-- ── LINKEDIN ───────────────────────────────────────────────────────── -->
<section id="section-linkedin" class="flex-1 overflow-y-auto p-6 space-y-6 hidden scrollbar-hide">
  <div><h2 class="text-2xl font-bold text-white">🔗 LinkedIn Connector</h2><p class="text-gray-400 text-sm">Busca inversores, talento y clientes</p></div>
  <div class="bg-gray-900/80 rounded-2xl border border-white/10 overflow-hidden">
    <div class="bg-gray-800/80 px-4 py-2 flex items-center space-x-2 border-b border-white/10">
      <div class="flex space-x-1.5"><div class="w-3 h-3 rounded-full bg-red-500"></div><div class="w-3 h-3 rounded-full bg-yellow-500"></div><div class="w-3 h-3 rounded-full bg-green-500"></div></div>
      <span class="text-gray-400 text-xs ml-3">linkedin-connector</span>
    </div>
    <div class="p-5">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-green-400 text-sm font-mono">$</span>
        <select id="li-type" class="bg-gray-800 text-gray-100 px-3 py-1.5 rounded border border-gray-700 text-sm">
          <option value="investor">investor</option><option value="talent">talent</option>
          <option value="customer">customer</option><option value="partner">partner</option>
        </select>
        <input id="li-query" placeholder='"venture capital" OR "AI startup"' class="bg-gray-800 text-gray-100 px-3 py-1.5 rounded border border-gray-700 text-sm flex-1 outline-none focus:border-blue-500" onkeydown="if(event.key==='Enter')searchLinkedIn()">
        <button onclick="searchLinkedIn()" class="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm transition">🔍 Search</button>
      </div>
      <div id="li-results" class="mt-5 text-center py-10 text-gray-500">
        <div class="text-4xl mb-3">🔍</div><p>Introduce una búsqueda para empezar.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── DOCS ──────────────────────────────────────────────────────────── -->
<section id="section-docs" class="flex-1 overflow-y-auto p-6 space-y-6 hidden scrollbar-hide">
  <div><h2 class="text-2xl font-bold text-white">Docs & Templates</h2><p class="text-gray-400 text-sm">Frameworks y documentos para tu startup</p></div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <button class="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group" onclick="openDocTemplate('one-pager')">
      <div class="text-3xl mb-3">📄</div><h3 class="font-semibold text-white group-hover:text-purple-300 transition">One-Pager</h3>
      <p class="text-xs text-gray-400 mt-1">Resumen rápido para inversores</p><div class="mt-3 text-xs text-purple-400">Abrir con Astro →</div>
    </button>
    <button class="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group" onclick="openDocTemplate('pitch')">
      <div class="text-3xl mb-3">📊</div><h3 class="font-semibold text-white group-hover:text-purple-300 transition">Pitch Deck</h3>
      <p class="text-xs text-gray-400 mt-1">Plantilla de 10 slides</p><div class="mt-3 text-xs text-purple-400">Abrir con Astro →</div>
    </button>
    <button class="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group" onclick="openDocTemplate('gtm')">
      <div class="text-3xl mb-3">🗺</div><h3 class="font-semibold text-white group-hover:text-purple-300 transition">Go-to-Market</h3>
      <p class="text-xs text-gray-400 mt-1">Framework GTM strategy</p><div class="mt-3 text-xs text-purple-400">Abrir con Astro →</div>
    </button>
    <button class="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group" onclick="openDocTemplate('okrs')">
      <div class="text-3xl mb-3">🎯</div><h3 class="font-semibold text-white group-hover:text-purple-300 transition">OKRs</h3>
      <p class="text-xs text-gray-400 mt-1">Objectives & Key Results</p><div class="mt-3 text-xs text-purple-400">Abrir con Astro →</div>
    </button>
    <button class="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group" onclick="openDocTemplate('term-sheet')">
      <div class="text-3xl mb-3">📋</div><h3 class="font-semibold text-white group-hover:text-purple-300 transition">Term Sheet</h3>
      <p class="text-xs text-gray-400 mt-1">Plantilla de term sheet</p><div class="mt-3 text-xs text-purple-400">Abrir con Astro →</div>
    </button>
    <button class="text-left p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl transition group" onclick="openDocTemplate('cap-table')">
      <div class="text-3xl mb-3">📈</div><h3 class="font-semibold text-white group-hover:text-purple-300 transition">Cap Table</h3>
      <p class="text-xs text-gray-400 mt-1">Tabla de equity simplificada</p><div class="mt-3 text-xs text-purple-400">Abrir con Astro →</div>
    </button>
  </div>
</section>

</main>
</div>

<script>
// ═══ AUTH ══════════════════════════════════════════════════════════════════
const _urlParams = new URLSearchParams(window.location.search);
const _urlToken = _urlParams.get('token');
if (_urlToken) {
  document.cookie = 'authToken=' + _urlToken + '; path=/; max-age=' + (60*60*24*7) + '; SameSite=Lax';
  localStorage.setItem('authToken', _urlToken);
  window.history.replaceState({}, document.title, window.location.pathname);
}
function getToken() {
  const m = document.cookie.match(/authToken=([^;]+)/);
  return m ? m[1] : localStorage.getItem('authToken');
}
axios.defaults.withCredentials = true;
axios.interceptors.request.use(cfg => { const t=getToken(); if(t) cfg.headers.Authorization='Bearer '+t; return cfg; });

// ═══ SIDEBAR ═══════════════════════════════════════════════════════════════
let _sbOpen = true;
window.toggleSidebar = function() {
  _sbOpen = !_sbOpen;
  const sb = document.getElementById('sidebar');
  sb.style.width = _sbOpen ? '13rem' : '3.5rem';
  document.querySelectorAll('.nl').forEach(el => { el.style.display = _sbOpen ? '' : 'none'; });
};

// ═══ SECTIONS ══════════════════════════════════════════════════════════════
const SECS = ['os','traction','team','investors','linkedin','docs'];
window.switchSection = function(id) {
  SECS.forEach(s => {
    const sec = document.getElementById('section-'+s);
    const nav = document.getElementById('nav-'+s);
    if (sec) sec.classList.toggle('hidden', s!==id);
    if (nav) { nav.classList.toggle('active',s===id); nav.classList.toggle('text-gray-400',s!==id); }
  });
  if (id==='traction') renderTractionGoals();
  if (id==='team') renderTeam();
  if (id==='investors') renderInvestors();
};

// ═══ TASKS ════════════════════════════════════════════════════════════════
const TK = 'sos_tasks';
let tasks = [];
let _filter = 'all', _view = 'list';
try { tasks = JSON.parse(localStorage.getItem(TK)||'[]'); } catch{}
function saveTasks() { localStorage.setItem(TK, JSON.stringify(tasks)); }
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

window.setFilter = function(f) {
  _filter = f;
  ['all','todo','doing','done','blocked'].forEach(k => {
    const b = document.getElementById('filter-'+k); if(!b) return;
    b.className = 'px-2.5 py-1 rounded-full text-xs whitespace-nowrap ' + (k===f ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white');
  });
  renderTasks();
};

window.setView = function(v) {
  _view = v;
  document.getElementById('view-list').className = 'px-2 py-1 rounded text-xs '+(v==='list'?'bg-purple-600 text-white':'text-gray-400 hover:text-white');
  document.getElementById('view-kanban').className = 'px-2 py-1 rounded text-xs '+(v==='kanban'?'bg-purple-600 text-white':'text-gray-400 hover:text-white');
  renderTasks();
};

window.renderTasks = function() {
  const search = (document.getElementById('task-search')?.value||'').toLowerCase();
  let filtered = tasks.filter(t => {
    if (_filter!=='all' && t.status!==_filter) return false;
    if (search && !t.title.toLowerCase().includes(search)) return false;
    return true;
  });
  const done = tasks.filter(t=>t.status==='done').length, total = tasks.length;
  const pct = total ? Math.round(done/total*100) : 0;
  document.getElementById('task-count').textContent = total+' tareas · '+done+' hechas';
  const pw = document.getElementById('progress-wrap');
  if (total) { pw.classList.remove('hidden'); document.getElementById('progress-pct').textContent=pct+'%'; document.getElementById('progress-bar').style.width=pct+'%'; }
  else pw.classList.add('hidden');

  const c = document.getElementById('task-list'); if(!c) return;
  if (_view==='kanban') {
    c.className = 'flex-1 overflow-x-auto overflow-y-auto px-3 py-3 scrollbar-hide';
    const cols={todo:'Por hacer',doing:'En curso',done:'Hecho',blocked:'Bloqueado'};
    const cd={todo:'bg-gray-400',doing:'bg-blue-400',done:'bg-green-400',blocked:'bg-red-400'};
    c.innerHTML = '<div class="flex gap-3 min-h-full">'+
      Object.entries(cols).map(([st,lb])=>{
        const ct=filtered.filter(t=>t.status===st);
        return '<div class="min-w-40 flex-1"><div class="flex items-center gap-1.5 mb-2"><span class="w-2 h-2 rounded-full '+cd[st]+'"></span><span class="text-xs font-medium text-gray-300">'+lb+'</span><span class="text-xs text-gray-500 ml-auto">'+ct.length+'</span></div><div class="space-y-2">'+ct.map(t=>taskCard(t)).join('')+'</div></div>';
      }).join('') + '</div>';
    return;
  }
  c.className = 'flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-hide';
  if (!filtered.length) { c.innerHTML='<div class="text-center py-12 text-gray-500"><div class="text-4xl mb-2">📋</div><p class="text-sm">Sin tareas. Pídele a Astro que genere un plan.</p></div>'; return; }
  const sorted=[...filtered].sort((a,b)=>{
    const sp={doing:0,todo:1,blocked:2,done:3},pp={high:0,medium:1,low:2};
    return (sp[a.status]||1)-(sp[b.status]||1)||(pp[a.priority]||1)-(pp[b.priority]||1);
  });
  c.innerHTML = sorted.map(t=>taskCard(t)).join('');
};

function taskCard(t) {
  const sc={todo:'bg-gray-500/20 text-gray-300 border-gray-500/30',doing:'bg-blue-500/20 text-blue-300 border-blue-500/30',done:'bg-green-500/20 text-green-300 border-green-500/30',blocked:'bg-red-500/20 text-red-300 border-red-500/30'};
  const sd={todo:'bg-gray-400',doing:'bg-blue-400',done:'bg-green-400',blocked:'bg-red-400'};
  const sl={todo:'Por hacer',doing:'En curso',done:'Hecho',blocked:'Bloqueado'};
  const pc={high:'text-red-400',medium:'text-yellow-400',low:'text-green-400'};
  const pl={high:'🔴 Alta',medium:'🟡 Media',low:'🟢 Baja'};
  const id=t.id, isDone=t.status==='done';
  const st=(t.title||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return '<div class="task-card group rounded-xl border border-white/10 bg-white/5 p-3 '+(isDone?'done':'')+'">'+
    '<div class="flex items-start gap-2">'+
      '<button onclick="toggleDone(\''+id+'\')" class="w-5 h-5 rounded-md border-2 mt-0.5 shrink-0 flex items-center justify-center transition '+(isDone?'bg-green-500 border-green-500 text-white':'border-white/20 hover:border-purple-400')+'">'+
        (isDone?'<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>':'')+
      '</button>'+
      '<div class="flex-1 min-w-0">'+
        '<div class="text-sm font-medium '+(isDone?'line-through text-gray-500':'text-white')+'">'+( t.emoji||'🎯')+' '+st+'</div>'+
        '<div class="flex items-center gap-1.5 mt-1.5 flex-wrap">'+
          '<span class="text-xs border rounded-full px-2 py-0.5 '+(sc[t.status]||sc.todo)+'"><span class="w-1.5 h-1.5 rounded-full '+(sd[t.status]||'bg-gray-400')+' inline-block mr-1"></span>'+(sl[t.status]||'')+'</span>'+
          (t.priority?'<span class="text-xs '+(pc[t.priority]||'text-gray-400')+'">'+(pl[t.priority]||'')+'</span>':'')+
          (t.area?'<span class="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">'+t.area+'</span>':'')+
          (t.fromAI?'<span class="text-xs text-pink-300 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5">⚡ Astro</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">'+
        '<button onclick="cycleStatus(\''+id+'\')" class="w-6 h-6 text-gray-400 hover:text-blue-300 text-xs flex items-center justify-center rounded" title="Cambiar estado">🔄</button>'+
        '<button onclick="delTask(\''+id+'\')" class="w-6 h-6 text-gray-500 hover:text-red-400 text-xs flex items-center justify-center rounded">✕</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

window.toggleDone = function(id) {
  const t=tasks.find(x=>x.id===id); if(!t) return;
  t.status = t.status==='done'?'todo':'done';
  saveTasks(); renderTasks();
};
window.cycleStatus = function(id) {
  const ord=['todo','doing','done','blocked'];
  const t=tasks.find(x=>x.id===id); if(!t) return;
  t.status=ord[(ord.indexOf(t.status)+1)%4];
  saveTasks(); renderTasks();
};
window.delTask = function(id) { tasks=tasks.filter(x=>x.id!==id); saveTasks(); renderTasks(); };
window.openQuickAdd = function() {
  document.getElementById('quick-add-btn').classList.add('hidden');
  document.getElementById('quick-add-form').classList.remove('hidden');
  document.getElementById('qa-title').focus();
};
window.closeQuickAdd = function() {
  document.getElementById('quick-add-btn').classList.remove('hidden');
  document.getElementById('quick-add-form').classList.add('hidden');
  document.getElementById('qa-title').value='';
};
window.addTask = function() {
  const title=document.getElementById('qa-title').value.trim(); if(!title) return;
  const emj=['🎯','📦','🚀','💰','📊','🔗','💬','🤝','🏗','📣'];
  tasks.unshift({id:uid(),title,area:document.getElementById('qa-area').value,priority:document.getElementById('qa-priority').value,status:'todo',emoji:emj[Math.floor(Math.random()*emj.length)],fromAI:false,createdAt:Date.now()});
  saveTasks(); renderTasks(); closeQuickAdd();
};

function addAITasks(items) {
  if (!items?.length) return;
  const emj=['⚡','🎯','🚀','💡','📌'];
  const nw=items.filter(t=>!tasks.some(x=>x.title.toLowerCase()===t.toLowerCase()));
  if (!nw.length) return;
  nw.forEach((title,i)=>tasks.unshift({id:uid(),title,status:'todo',priority:'high',emoji:emj[i%emj.length],fromAI:true,area:'',createdAt:Date.now()}));
  saveTasks(); renderTasks();
  const bl=document.getElementById('task-list');
  if (bl) { bl.style.outline='2px solid rgba(167,139,250,.5)'; setTimeout(()=>{bl.style.outline='';},1200); }
}

// ═══ CHAT ══════════════════════════════════════════════════════════════════
let _msgs = [], _loading = false;
let _sid = localStorage.getItem('astroSid');

function renderMsgs() {
  const c=document.getElementById('chat-messages'); if(!c) return;
  const qp=document.getElementById('quick-prompts');
  if (_msgs.length>1 && qp) qp.style.display='none';
  else if (qp) qp.style.display='';
  let h='';
  _msgs.forEach(m=>{
    if (m.role==='user') {
      h+='<div class="flex justify-end mb-3 msg-in"><div class="max-w-xs lg:max-w-sm bubble-user px-4 py-2.5 text-sm text-white leading-relaxed">'+esc(m.content)+'</div><div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white ml-2 shrink-0 mt-1">Tú</div></div>';
    } else {
      h+='<div class="flex justify-start mb-3 msg-in"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm text-white mr-2 shrink-0 mt-1">⚡</div><div class="max-w-sm lg:max-w-md bubble-ai px-4 py-2.5 text-sm text-gray-100 leading-relaxed">'+fmtAI(m.content)+'</div></div>';
    }
  });
  if (_loading) h+='<div class="flex justify-start mb-3"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm text-white mr-2 shrink-0 mt-1">⚡</div><div class="bubble-ai px-4 py-3 flex items-center space-x-1.5"><span class="w-2 h-2 bg-purple-400 rounded-full dot-bounce"></span><span class="w-2 h-2 bg-purple-400 rounded-full dot-bounce"></span><span class="w-2 h-2 bg-purple-400 rounded-full dot-bounce"></span></div></div>';
  c.innerHTML=h; c.scrollTop=c.scrollHeight;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function fmtAI(text){
  let t=String(text||'');
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  t=t.replace(/\*([^*]+?)\*/g,'<em>$1</em>');
  t=t.replace(/^#{1,3}\s+(.+)$/gm,'<strong class="text-white">$1</strong>');
  t=t.replace(/^[-*]\s+/gm,'• ');
  t=t.replace(/\n{3,}/g,'\n\n');
  t=t.replace(/\n/g,'<br>');
  return t;
}

window.sendMessage = async function(override) {
  const inp=document.getElementById('chat-input');
  const text=(override||inp.value||'').trim();
  if (!text||_loading) return;
  if (!override){inp.value='';inp.style.height='auto';}
  _msgs.push({role:'user',content:text});
  _loading=true; renderMsgs();
  try {
    const hist=_msgs.slice(-14,_msgs.length-1).map(m=>({role:m.role,content:m.content}));
    const res=await fetch('/api/astro-chat',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(getToken()||'')},
      body:JSON.stringify({message:text,history:hist,sessionId:_sid,userId:${userId},language:navigator.language?.startsWith('es')?'es':'en'})
    });
    const data=await res.json();
    const reply=data.response||data.message||'No pude procesar eso. ¿Puedes reformularlo?';
    if (data.sessionId&&data.sessionId!==_sid){_sid=data.sessionId;localStorage.setItem('astroSid',_sid);}
    _msgs.push({role:'assistant',content:reply});
    if (data.extractedData?.action_items?.length) addAITasks(data.extractedData.action_items);
  } catch(e) {
    console.error(e);
    _msgs.push({role:'assistant',content:'Error de conexión. Verifica tu red e intenta de nuevo.'});
  }
  _loading=false; renderMsgs();
};
window.sendQuick=function(t){sendMessage(t);};
window.clearChat=function(){
  _msgs=[{role:'assistant',content:'Hey! \\u00bfQu\\u00e9 est\\u00e1 pasando con tu startup esta semana? \\u26a1'}];
  _sid=null; localStorage.removeItem('astroSid'); renderMsgs();
};

let _mr=null;
window.toggleRecording=async function(){
  const btn=document.getElementById('mic-btn');
  if(_mr?.state==='recording'){_mr.stop();btn.style.background='';btn.style.color='';return;}
  try {
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const chunks=[];
    _mr=new MediaRecorder(stream);
    _mr.ondataavailable=e=>chunks.push(e.data);
    _mr.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(chunks,{type:'audio/webm'});
      const form=new FormData(); form.append('file',blob,'voice.webm');
      try {
        const r=await fetch('/api/transcribe',{method:'POST',headers:{'Authorization':'Bearer '+(getToken()||'')},body:form});
        const {text}=await r.json();
        if (text?.trim()){const i=document.getElementById('chat-input');i.value=text.trim();i.focus();}
      } catch{}
    };
    _mr.start();
    btn.style.background='#ef4444';btn.style.color='#fff';
    setTimeout(()=>{if(_mr?.state==='recording'){_mr.stop();btn.style.background='';btn.style.color='';}},60000);
  } catch{}
};

// ═══ TRACTION ══════════════════════════════════════════════════════════════
const MK='sos_metrics';
let metrics={users:0,revenue:0,growth:0,nps:0,sessions:0,churn:0};
try{metrics=Object.assign(metrics,JSON.parse(localStorage.getItem(MK)||'{}'));}catch{}
function saveMet(){localStorage.setItem(MK,JSON.stringify(metrics));}
function updCards(){
  document.getElementById('card-users').textContent=(metrics.users||0).toLocaleString();
  document.getElementById('card-revenue').textContent='$'+(metrics.revenue||0).toLocaleString();
  document.getElementById('card-growth').textContent=(metrics.growth||0)+'%';
  document.getElementById('card-nps').textContent=metrics.nps||0;
  document.getElementById('card-sessions').textContent=(metrics.sessions||0).toLocaleString();
  document.getElementById('card-churn').textContent=(metrics.churn||0)+'%';
}
window.toggleMetricsEdit=function(){
  const f=document.getElementById('metrics-edit-form'),b=document.getElementById('metrics-edit-btn');
  const h=f.classList.contains('hidden');
  f.classList.toggle('hidden');b.textContent=h?'✕ Cancelar':'✏️ Actualizar';
  if(h){['users','revenue','growth','nps','sessions','churn'].forEach(k=>{const el=document.getElementById('m-'+k);if(el)el.value=metrics[k]||0;});}
};
window.saveMetrics=function(){
  metrics={users:+document.getElementById('m-users').value||0,revenue:+document.getElementById('m-revenue').value||0,growth:+document.getElementById('m-growth').value||0,nps:+document.getElementById('m-nps').value||0,sessions:+document.getElementById('m-sessions').value||0,churn:+document.getElementById('m-churn').value||0};
  saveMet();updCards();
  document.getElementById('metrics-edit-form').classList.add('hidden');
  document.getElementById('metrics-edit-btn').textContent='✏️ Actualizar';
};
function renderTractionGoals(){
  const el=document.getElementById('traction-goals');if(!el)return;
  if(!tasks.length){el.innerHTML='<p class="text-gray-500 text-sm text-center py-6">Sin objetivos todavía.</p>';return;}
  const done=tasks.filter(t=>t.status==='done').length,pct=Math.round(done/tasks.length*100);
  el.innerHTML='<div class="flex justify-between text-xs text-gray-400 mb-2"><span>'+tasks.length+' objetivos</span><span class="text-purple-300">'+pct+'% completados</span></div>'+
    '<div class="h-2 bg-white/5 rounded-full mb-4"><div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style="width:'+pct+'%"></div></div>'+
    tasks.slice(0,8).map(t=>'<div class="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"><span class="'+(t.status==='done'?'text-green-400':'text-gray-500')+'">'+(t.status==='done'?'✓':'○')+'</span><span class="text-sm '+(t.status==='done'?'line-through text-gray-500':'text-white')+' flex-1 truncate">'+(t.emoji||'🎯')+' '+t.title+'</span>'+(t.area?'<span class="text-xs text-gray-400">'+t.area+'</span>':'')+'</div>').join('');
}

// ═══ TEAM ══════════════════════════════════════════════════════════════════
const TEAMK='sos_team';
let team=[];
try{team=JSON.parse(localStorage.getItem(TEAMK)||'[]');}catch{}
window.addMember=function(){
  const name=document.getElementById('tm-name').value.trim();if(!name)return;
  team.push({id:uid(),name,role:document.getElementById('tm-role').value.trim(),emoji:document.getElementById('tm-emoji').value});
  localStorage.setItem(TEAMK,JSON.stringify(team));
  document.getElementById('tm-name').value='';document.getElementById('tm-role').value='';
  renderTeam();
};
window.removeMember=function(id){
  team=team.filter(m=>m.id!==id);
  localStorage.setItem(TEAMK,JSON.stringify(team));renderTeam();
};
function renderTeam(){
  const el=document.getElementById('team-list');if(!el)return;
  if(!team.length){el.innerHTML='<div class="col-span-full text-center py-12 text-gray-500"><div class="text-5xl mb-3">👥</div><p>Añade miembros de tu equipo arriba</p></div>';return;}
  el.innerHTML=team.map(m=>
    '<div class="group bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-5 transition">'+
      '<div class="flex items-center justify-between mb-3">'+
        '<div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">'+m.emoji+'</div>'+
        '<button onclick="removeMember(\''+m.id+'\')" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition">✕</button>'+
      '</div>'+
      '<p class="font-semibold text-white">'+m.name+'</p>'+
      '<p class="text-sm text-purple-300">'+(m.role||'Team member')+'</p>'+
    '</div>'
  ).join('');
}

// ═══ INVESTORS ══════════════════════════════════════════════════════════════
const INVK='sos_investors';
let investors=[];
try{investors=JSON.parse(localStorage.getItem(INVK)||'[]');}catch{}
const ISTAGES=['prospect','contacted','meeting','due_diligence','passed','invested'];
const ISTC={prospect:'text-gray-400',contacted:'text-blue-400',meeting:'text-yellow-400',due_diligence:'text-orange-400',passed:'text-red-400',invested:'text-green-400'};
window.addInvestor=function(){
  const name=document.getElementById('inv-name').value.trim();if(!name)return;
  investors.unshift({id:uid(),name,fund:document.getElementById('inv-fund').value.trim(),notes:document.getElementById('inv-notes').value.trim(),status:'prospect',at:new Date().toLocaleDateString()});
  localStorage.setItem(INVK,JSON.stringify(investors));
  document.getElementById('inv-name').value='';document.getElementById('inv-fund').value='';document.getElementById('inv-notes').value='';
  renderInvestors();
};
window.updInvStage=function(id,s){
  investors=investors.map(i=>i.id===id?{...i,status:s}:i);
  localStorage.setItem(INVK,JSON.stringify(investors));
};
function renderInvestors(){
  const el=document.getElementById('investors-list');if(!el)return;
  if(!investors.length){el.innerHTML='<div class="text-center py-12 text-gray-500"><div class="text-5xl mb-3">💰</div><p>Registra tus conversaciones con inversores</p></div>';return;}
  el.innerHTML=investors.map(inv=>
    '<div class="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-4 transition">'+
      '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-lg shrink-0">💼</div>'+
      '<div class="flex-1 min-w-0"><p class="font-medium text-white text-sm">'+inv.name+'</p><p class="text-xs text-gray-400">'+(inv.fund||'')+'</p>'+(inv.notes?'<p class="text-xs text-gray-500 mt-0.5 truncate">'+inv.notes+'</p>':'')+' </div>'+
      '<select onchange="updInvStage(\''+inv.id+'\',this.value)" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none capitalize '+(ISTC[inv.status]||'text-gray-400')+'">'+
        ISTAGES.map(s=>'<option value="'+s+'" '+(s===inv.status?'selected':'')+' class="text-white bg-gray-900">'+s.replace('_',' ')+'</option>').join('')+
      '</select>'+
    '</div>'
  ).join('');
}

// ═══ LINKEDIN ══════════════════════════════════════════════════════════════
window.searchLinkedIn=async function(){
  const query=document.getElementById('li-query').value.trim(),type=document.getElementById('li-type').value;
  if(!query)return;
  const res=document.getElementById('li-results');
  res.innerHTML='<div class="text-center py-8 text-gray-400"><div class="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full inline-block" style="animation:spin 1s linear infinite"></div><p class="mt-3 text-sm">Buscando…</p></div>';
  try {
    const r=await axios.post('/api/linkedin-connector/search',{type,query,maxResults:20});
    if (!r.data.success||!r.data.profiles?.length){res.innerHTML='<p class="text-gray-500 text-sm text-center py-8">Sin resultados para esa búsqueda.</p>';return;}
    res.innerHTML='<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">'+r.data.profiles.map(p=>
      '<div class="bg-gray-800 border border-gray-700 rounded-xl p-4">'+
        '<div class="flex items-start justify-between mb-2"><h3 class="text-white font-semibold text-sm">'+(p.name||'')+'</h3><span class="text-xs px-2 py-0.5 rounded '+(p.compatibilityScore>=90?'bg-green-600':p.compatibilityScore>=75?'bg-blue-600':'bg-yellow-600')+'">'+(p.compatibilityScore||0)+'%</span></div>'+
        '<p class="text-gray-400 text-xs mb-2">'+(p.headline||'')+'</p>'+
        '<div class="flex gap-3 text-xs text-gray-500"><span>📍 '+(p.location||'-')+'</span></div>'+
      '</div>'
    ).join('')+'</div>';
  } catch(e) {
    res.innerHTML='<p class="text-red-400 text-sm text-center py-8">Error al buscar. Intenta de nuevo.</p>';
  }
};

// ═══ DOCS ══════════════════════════════════════════════════════════════════
const DPROMPTS={
  'one-pager':'Genera un one-pager completo para mi startup. Incluye: propuesta de valor, problema, solución, mercado objetivo, modelo de negocio, tracción y equipo.',
  'pitch':'Genera el contenido de un pitch deck de 10 slides para inversores: Problema, Solución, Mercado, Producto, Modelo de negocio, Tracción, Equipo, Competencia, Financiación y Visión.',
  'gtm':'Crea un plan de Go-to-Market detallado. Incluye canales de adquisición, métricas clave, timeline de 3 meses y KPIs.',
  'okrs':'Genera OKRs para el próximo trimestre. 3 Objectives principales con 3 Key Results cada uno, alineados con el crecimiento.',
  'term-sheet':'Explica los términos clave de un term sheet: valoración, dilución, liquidation preference, pro-rata, anti-dilución y board seats.',
  'cap-table':'Explica cómo crear y gestionar una cap table para una startup. Incluye rondas típicas, opciones de empleados y cómo evoluciona la dilución.'
};
window.openDocTemplate=function(type){
  const p=DPROMPTS[type];if(!p)return;
  switchSection('os');
  setTimeout(()=>sendMessage(p),100);
};

// ═══ INIT ══════════════════════════════════════════════════════════════════
_msgs=[{role:'assistant',content:'\\u00a1Hey! \\u26a1 Soy **Astro**, tu AI Cofounder en ASTAR*. Estoy aqu\\u00ed para ayudarte a mover tu startup m\\u00e1s r\\u00e1pido: estrategia, tareas, inversores, crecimiento.\\n\\n\\u00bfQu\\u00e9 est\\u00e1 pasando esta semana?'}];
renderMsgs();
renderTasks();
updCards();
renderTeam();
renderInvestors();

// Load goals from backend
(async()=>{
  try{
    const r=await axios.get('/api/dashboard/goals?userId=${userId}');
    const goals=r.data.goals||[];
    if(!goals.length)return;
    const bt=goals.map(g=>({
      id:String(g.id||uid()),title:g.description||g.title||'',description:'',
      status:g.status==='completed'?'done':g.status==='in_progress'?'doing':'todo',
      priority:g.priority||'medium',emoji:g.emoji||'🎯',area:g.category||'',
      due:g.deadline?g.deadline.substring(0,10):'',fromAI:false,createdAt:Date.now()
    })).filter(t=>t.title);
    const exist=new Set(tasks.map(t=>t.id));
    const nw=bt.filter(t=>!exist.has(t.id));
    if(nw.length){tasks=[...tasks,...nw];saveTasks();renderTasks();}
  }catch(e){/*silent*/}
})();

// Handle email context
const _ep=new URLSearchParams(window.location.search);
const _er=_ep.get('astarResponse');
if(_er){
  const dec=decodeURIComponent(_er);
  _msgs.push({role:'user',content:dec});renderMsgs();
  setTimeout(()=>sendMessage(dec),500);
  window.history.replaceState({},document.title,window.location.pathname);
}
</script>
</body>
</html>`);
});

export default app;
