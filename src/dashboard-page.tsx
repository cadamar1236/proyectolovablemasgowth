import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from './types';
import { jsx } from 'hono/jsx';

const app = new Hono<{ Bindings: Bindings }>();

// Dashboard page with integrated chat
app.get('/', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];
  const tokenInUrl = c.req.query('token');

  // If token is in URL (from OAuth redirect), ALWAYS let page load so client JS can save it
  // Only redirect if there's NO token anywhere
  if (!authToken && !tokenInUrl) {
    console.log('[DASHBOARD] No token found, redirecting to login');
    return c.redirect('/');
  }

  // If we have tokenInUrl, verify it on the server side too
  // This prevents issues with placeholder values
  let payload: any = null;
  const tokenToVerify = authToken || tokenInUrl;
  
  if (tokenToVerify) {
    try {
      payload = await verify(tokenToVerify, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as any;
      console.log('[DASHBOARD] Token verified successfully for user:', payload.userId);
    } catch (error) {
      // Only redirect if BOTH tokens are invalid and there's no tokenInUrl to try
      if (!tokenInUrl) {
        console.error('[DASHBOARD] Invalid token, redirecting to login');
        return c.redirect('/');
      }
      // If we have tokenInUrl but it failed to verify, use placeholder (client will retry)
      console.warn('[DASHBOARD] Token in URL failed verification, using placeholder');
      payload = { 
        userId: 0, 
        userName: 'Loading...', 
        email: '', 
        name: 'Loading...', 
        role: 'founder' 
      };
    }
  }

  // If still no payload, use placeholder values (shouldn't happen due to earlier check)
  if (!payload) {
    payload = { 
      userId: 0, 
      userName: 'Loading...', 
      email: '', 
      name: 'Loading...', 
      role: 'founder' 
    };
  }

  try {

    return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ASTAR* Labs</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#6366f1',
              secondary: '#8b5cf6',
            }
          }
        }
      }
    </script>
    <style>
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      .animate-bounce {
        animation: bounce 1s infinite;
      }
    </style>
</head>
<body class="bg-gray-50">
    <div id="app"></div>

    <script type="module">
      // Check if token is in URL (from OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        console.log('[DASHBOARD] Token found in URL, saving...');
        // Save token as cookie
        document.cookie = \`authToken=\${urlToken}; path=/; max-age=\${60 * 60 * 24 * 7}; SameSite=Lax\`;
        // Also save in localStorage as backup
        localStorage.setItem('authToken', urlToken);
        console.log('[DASHBOARD] Token saved successfully');
        // Clean up URL
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        console.log('[DASHBOARD] No token in URL');
      }
      
      // Get token from cookie or localStorage
      function getAuthToken() {
        const cookieMatch = document.cookie.match(/authToken=([^;]+)/);
        return cookieMatch ? cookieMatch[1] : localStorage.getItem('authToken');
      }

      const userId = ${payload.userId || 0};
      const userName = "${(payload.userName || payload.name || payload.email || 'Usuario').replace(/"/g, '\\"')}";
      const userEmail = "${(payload.email || '').replace(/"/g, '\\"')}";
      const userRole = "${payload.role || 'founder'}";
      
      // Configure axios to send cookies automatically
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      
      // Add auth token to all requests
      axios.interceptors.request.use(config => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = \`Bearer \${token}\`;
        }
        return config;
      }, error => Promise.reject(error));
      
      // Add request interceptor to log requests
      axios.interceptors.request.use(config => {
        console.log('Axios Request:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          withCredentials: config.withCredentials
        });
        return config;
      }, error => {
        console.error('Axios Request Error:', error);
        return Promise.reject(error);
      });
      
      // Add response interceptor to log responses
      axios.interceptors.response.use(
        response => {
          console.log('Axios Response:', response.status, response.config.url);
          return response;
        },
        error => {
          console.error('Axios Response Error:', {
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data
          });
          return Promise.reject(error);
        }
      );
      
      // State management
      let state = {
        currentView: window.location.hash ? window.location.hash.substring(1) : 'dashboard', // dashboard, traction, inbox
        messages: [],
        goals: [],
        metrics: {
          completedGoals: 0,
          overdueGoals: 0,
          totalGoals: 0,
          overallCompletion: 0
        },
        chatExpanded: false,
        isLoading: false,
        inputMessage: ''
      };

      // Load initial data
      async function loadGoals() {
        try {
          const response = await axios.get(\`/api/dashboard/goals?userId=\${userId}\`, {
            withCredentials: true
          });
          state.goals = response.data.goals || [];
          calculateMetrics();
          render();
        } catch (error) {
          console.error('Error loading goals:', error);
        }
      }

      async function loadChatHistory() {
        try {
          const response = await axios.get('/api/chat-agent/history', {
            withCredentials: true
          });
          state.messages = response.data.messages || [];
          render();
        } catch (error) {
          console.error('Error loading chat:', error);
        }
      }

      function calculateMetrics() {
        const completed = state.goals.filter(g => g.status === 'completed').length;
        const overdue = state.goals.filter(g => 
          g.status !== 'completed' && new Date(g.deadline) < new Date()
        ).length;
        const total = state.goals.length;
        const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

        state.metrics = {
          completedGoals: completed,
          overdueGoals: overdue,
          totalGoals: total,
          overallCompletion: completion
        };
      }

      async function sendMessage() {
        if (!state.inputMessage.trim() || state.isLoading) return;

        const userMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: state.inputMessage,
          timestamp: new Date()
        };

        state.messages.push(userMessage);
        const message = state.inputMessage;
        state.inputMessage = '';
        state.isLoading = true;
        render();

        try {
          const response = await axios.post('/api/chat-agent/message', {
            message,
            context: {
              goals: state.goals,
              metrics: state.metrics
            }
          }, {
            withCredentials: true
          });

          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date()
          };

          state.messages.push(assistantMessage);

          if (response.data.goalsUpdated) {
            await loadGoals();
          }
        } catch (error) {
          console.error('Error sending message:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
            timestamp: new Date()
          });
        } finally {
          state.isLoading = false;
          render();
          scrollChatToBottom();
        }
      }

      function scrollChatToBottom() {
        setTimeout(() => {
          const chatMessages = document.getElementById('chat-messages');
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        }, 100);
      }

      function formatTime(date) {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }

      // ============================================
      // ASTAR AGENT FUNCTIONS (usando sistema multiagente)
      // ============================================

      async function analyzeGoals() {
        if (state.isLoading) return;

        state.isLoading = true;
        
        // Add user message
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: '🎯 Analizar mis objetivos actuales con el agente de métricas',
          timestamp: new Date()
        });
        
        render();

        try {
          // Usar el nuevo endpoint del agente multiagente
          const response = await axios.post('/api/chat-agent/message', {
            message: 'Analiza mis objetivos actuales y dame un reporte detallado con recomendaciones. Usa los datos reales de la base de datos.',
            useMetricsAgent: true // Flag para indicar que use el metrics agent
          }, {
            withCredentials: true
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error analyzing goals:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Lo siento, ocurrió un error al analizar los objetivos.',
            timestamp: new Date()
          });
        } finally {
          state.isLoading = false;
          render();
          scrollChatToBottom();
        }
      }

      async function generateMarketingPlan() {
        if (state.isLoading) return;

        const websiteUrl = prompt('¿Cuál es tu sitio web? (para analizar tu marca)', '');
        if (!websiteUrl) return;

        state.isLoading = true;
        
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: \`🎨 Generar análisis de marca y plan de marketing para \${websiteUrl}\`,
          timestamp: new Date()
        });
        
        render();

        try {
          // Usar el brand marketing agent de Railway
          const response = await axios.post('/api/chat-agent/message', {
            message: \`Analiza la identidad de marca de \${websiteUrl} y genera un plan de marketing detallado con estrategias de contenido, colores, tono y mensajes clave. Sé específico y creativo.\`,
            useBrandAgent: true,
            websiteUrl: websiteUrl
          }, {
            withCredentials: true
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error generating plan:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '⚠️ No pude generar el plan de marketing. Por favor intenta de nuevo.',
            timestamp: new Date()
          });
        } finally {
          state.isLoading = false;
          render();
          scrollChatToBottom();
        }
      }

      async function generateContentIdeas() {
        if (state.isLoading) return;

        const websiteUrl = prompt('¿Cuál es tu sitio web? (para entender tu marca)', '');
        if (!websiteUrl) return;

        const platform = prompt('¿Para qué plataforma? (Instagram, LinkedIn, Twitter, TikTok, Blog)', 'Instagram');
        if (!platform) return;

        state.isLoading = true;
        
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: \`🎬 Generar ideas de contenido para \${platform}\`,
          timestamp: new Date()
        });
        
        render();

        try {
          // Usar el brand marketing agent para generar ideas de contenido
          const response = await axios.post('/api/chat-agent/message', {
            message: \`Basándote en la identidad de marca de \${websiteUrl}, genera 10 ideas creativas de contenido para \${platform}. Incluye títulos atractivos, descripciones, hashtags relevantes y el mejor momento para publicar. Sé específico y creativo.\`,
            useBrandAgent: true,
            websiteUrl: websiteUrl
          }, {
            withCredentials: true
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error generating ideas:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '⚠️ No pude generar las ideas de contenido. Por favor intenta de nuevo.',
            timestamp: new Date()
          });
        } finally {
          state.isLoading = false;
          render();
          scrollChatToBottom();
        }
      }

      async function analyzeCompetition() {
        if (state.isLoading) return;

        const industry = prompt('¿En qué industria estás? (SaaS, fintech, ecommerce, etc.)', 'SaaS');
        if (!industry) return;

        const stage = prompt('¿En qué etapa está tu startup? (seed, series_a, series_b)', 'seed');
        if (!stage) return;

        state.isLoading = true;
        
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: \`📊 Comparar mis métricas con benchmarks de \${industry} (\${stage})\`,
          timestamp: new Date()
        });
        
        render();

        try {
          // Usar el metrics agent para comparar con benchmarks de la industria
          const response = await axios.post('/api/chat-agent/message', {
            message: \`Compara mis métricas actuales con los benchmarks de la industria \${industry} en etapa \${stage}. Dame un análisis detallado de qué métricas están por encima o debajo del promedio, y recomendaciones específicas para mejorar. Incluye gráficos y porcentajes.\`,
            useMetricsAgent: true,
            industry: industry,
            stage: stage
          }, {
            withCredentials: true
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error analyzing competition:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '⚠️ No pude analizar la competencia. Por favor intenta de nuevo.',
            timestamp: new Date()
          });
        } finally {
          state.isLoading = false;
          render();
          scrollChatToBottom();
        }
      }

      // Render function
      function render() {
        const { messages, goals, metrics, chatExpanded, isLoading, inputMessage } = state;

        document.getElementById('app').innerHTML = \`
          <div class="flex h-screen bg-gray-50">
            <!-- Main Content Area with Top Nav -->
            <div class="flex-1 overflow-y-auto">
              <!-- Header -->
              <div class="bg-white border-b border-gray-200 px-6 py-4">
                <div class="max-w-7xl mx-auto flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <h1 class="text-2xl font-bold flex items-center">
                      <span class="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">ASTAR</span>
                      <span class="text-blue-500 ml-1">✦</span>
                    </h1>
                    <div class="text-sm">
                      <p class="font-semibold text-gray-900">\${userName}</p>
                      <p class="text-xs text-gray-500">\${userRole}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-4">
                    <button onclick="toggleChat()" class="text-gray-600 hover:text-primary transition">
                      <i class="fas fa-robot text-xl"></i>
                    </button>
                    <button class="text-gray-600 hover:text-primary transition">
                      <i class="fas fa-bell text-xl"></i>
                    </button>
                    <a href="#settings" class="text-gray-600 hover:text-primary transition">
                      <i class="fas fa-cog text-xl"></i>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Tab Navigation -->
              <div class="bg-white border-b border-gray-200">
                <div class="max-w-7xl mx-auto px-6">
                  <div class="flex space-x-8">
                    <button onclick="switchView(\\'dashboard\\')" class="tab-btn px-1 py-4 text-sm font-semibold border-b-2 transition \${state.currentView === 'dashboard' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}">
                      <i class="fas fa-home mr-2"></i>Home
                    </button>
                    <button onclick="switchView(\\'traction\\')" class="tab-btn px-1 py-4 text-sm font-semibold border-b-2 transition \${state.currentView === 'traction' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}">
                      <i class="fas fa-chart-line mr-2"></i>Traction
                    </button>
                    <button onclick="switchView(\\'inbox\\')" class="tab-btn px-1 py-4 text-sm font-semibold border-b-2 transition \${state.currentView === 'inbox' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}">
                      <i class="fas fa-inbox mr-2"></i>Inbox
                    </button>
                    <button onclick="switchView(\\'directory\\')" class="tab-btn px-1 py-4 text-sm font-semibold border-b-2 transition \${state.currentView === 'directory' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}">
                      <i class="fas fa-users mr-2"></i>Validators
                    </button>
                  </div>
                </div>
              </div>

              <!-- Content Area -->
              <div class="max-w-7xl mx-auto p-6" id="main-content">
                <!-- Content will be rendered here based on state.currentView -->
              </div>
            </div>

            <!-- AI Chat Modal (Floating) -->
            <div class="fixed bottom-6 right-6 z-50 \${chatExpanded ? '' : 'hidden'}">
              <div class="bg-gray-900 text-white rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col">
                <!-- Chat Header -->
                <div class="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-bold">AI Assistant</h3>
                    <p class="text-xs text-gray-400">Gestiona tus objetivos</p>
                  </div>
                  <button onclick="toggleChat()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                  </button>
                </div>

                <!-- Quick Actions -->
                <div class="p-3 border-b border-gray-700">
                  <div class="grid grid-cols-2 gap-2">
                    <button onclick="analyzeGoals()" class="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition">
                      <i class="fas fa-chart-line mr-1"></i>Analizar
                    </button>
                    <button onclick="generateMarketingPlan()" class="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition">
                      <i class="fas fa-clipboard-list mr-1"></i>Plan
                    </button>
                    <button onclick="generateContentIdeas()" class="px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition">
                      <i class="fas fa-lightbulb mr-1"></i>Ideas
                    </button>
                    <button onclick="analyzeCompetition()" class="px-2 py-1.5 bg-orange-600 hover:bg-orange-700 rounded text-xs font-medium transition">
                      <i class="fas fa-users mr-1"></i>Competencia
                    </button>
                  </div>
                </div>

                <!-- Chat Messages -->
                <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
                  \${messages.length === 0 ? \`
                    <div class="text-center text-gray-400 mt-8">
                      <i class="fas fa-robot text-4xl mb-4"></i>
                      <p class="text-sm">¡Hola! Soy tu asistente de IA.</p>
                      <p class="text-xs mt-2">Puedo ayudarte a:</p>
                      <ul class="text-xs mt-2 space-y-1 text-left mx-4">
                        <li>• Crear y actualizar objetivos</li>
                        <li>• Registrar progreso</li>
                        <li>• Ver estadísticas</li>
                        <li>• Analizar tu rendimiento</li>
                      </ul>
                    </div>
                  \` : messages.map(message => \`
                    <div class="flex \${message.role === 'user' ? 'justify-end' : 'justify-start'}">
                      <div class="max-w-[80%] rounded-lg p-3 \${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-800 text-gray-100'
                      }">
                        <p class="text-sm whitespace-pre-wrap">\${message.content}</p>
                        <p class="text-xs opacity-60 mt-1">\${formatTime(message.timestamp)}</p>
                      </div>
                    </div>
                  \`).join('')}
                  \${isLoading ? \`
                    <div class="flex justify-start">
                      <div class="bg-gray-800 rounded-lg p-3">
                        <div class="flex space-x-2">
                          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                        </div>
                      </div>
                    </div>
                  \` : ''}
                </div>

                <!-- Chat Input -->
                <div class="p-4 border-t border-gray-700">
                  <div class="flex items-end space-x-2">
                    <textarea
                      id="chat-input"
                      value="\${inputMessage}"
                      oninput="updateInput(this.value)"
                      onkeypress="handleKeyPress(event)"
                      placeholder="Escribe un mensaje..."
                      class="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="1"
                      \${isLoading ? 'disabled' : ''}
                    ></textarea>
                    <button
                      onclick="sendMessage()"
                      \${isLoading || !inputMessage.trim() ? 'disabled' : ''}
                      class="bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white p-2 rounded-lg transition"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        \`;
        
        // Update main content based on current view after DOM is ready
        requestAnimationFrame(() => {
          updateMainContent();
        });
      }

      // Update main content based on view
      async function updateMainContent() {
        const contentDiv = document.getElementById('main-content');
        console.log('updateMainContent called', { contentDiv, currentView: state.currentView });
        if (!contentDiv) {
          console.error('main-content div not found!');
          return;
        }
        
        const { goals, metrics } = state;
        console.log('Updating content', { goals: goals.length, metrics });
        
        if (state.currentView === 'dashboard') {
          contentDiv.innerHTML = getDashboardHTML(goals, metrics);
        } else if (state.currentView === 'traction') {
          contentDiv.innerHTML = getTractionHTML(goals, metrics);
        } else if (state.currentView === 'inbox') {
          contentDiv.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-primary"></i><p class="text-gray-600 mt-4">Cargando conversaciones...</p></div>';
          contentDiv.innerHTML = await getInboxHTML();
        } else if (state.currentView === 'directory') {
          contentDiv.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-primary"></i><p class="text-gray-600 mt-4">Cargando validators...</p></div>';
          contentDiv.innerHTML = await getDirectoryHTML();
        }
        console.log('Content updated');
      }
      
      function getDashboardHTML(goals, metrics) {
        return '<div class="mb-6">' +
          '<h2 class="text-2xl font-bold text-gray-900">Welcome back! 👋</h2>' +
          '<p class="text-gray-500">Manage your startup growth and connect with validators</p>' +
        '</div>' +
        '<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">' +
          '<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">' +
            '<div class="flex items-center justify-between">' +
              '<div><p class="text-xs font-medium text-gray-500 uppercase">Goals</p><p class="text-2xl font-bold text-gray-900">' + metrics.totalGoals + '</p></div>' +
              '<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><i class="fas fa-bullseye text-blue-600 text-xl"></i></div>' +
            '</div>' +
            '<p class="text-xs text-gray-500 mt-2">' + goals.filter(g => g.status === 'in_progress').length + ' active</p>' +
          '</div>' +
          '<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">' +
            '<div class="flex items-center justify-between">' +
              '<div><p class="text-xs font-medium text-gray-500 uppercase">Completion</p><p class="text-2xl font-bold text-gray-900">' + metrics.overallCompletion + '%</p></div>' +
              '<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><i class="fas fa-check-circle text-green-600 text-xl"></i></div>' +
            '</div>' +
            '<p class="text-xs text-gray-500 mt-2">' + metrics.completedGoals + ' completed</p>' +
          '</div>' +
          '<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">' +
            '<div class="flex items-center justify-between">' +
              '<div><p class="text-xs font-medium text-gray-500 uppercase">Users</p><p class="text-2xl font-bold text-gray-900">-</p></div>' +
              '<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><i class="fas fa-users text-purple-600 text-xl"></i></div>' +
            '</div>' +
            '<p class="text-xs text-gray-500 mt-2">-</p>' +
          '</div>' +
          '<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">' +
            '<div class="flex items-center justify-between">' +
              '<div><p class="text-xs font-medium text-gray-500 uppercase">Revenue</p><p class="text-2xl font-bold text-gray-900">-</p></div>' +
              '<div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><i class="fas fa-dollar-sign text-yellow-600 text-xl"></i></div>' +
            '</div>' +
            '<p class="text-xs text-gray-500 mt-2">-</p>' +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">' +
          '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">' +
            '<div class="flex items-center justify-between mb-4">' +
              '<h3 class="font-bold text-gray-900">Active Goals</h3>' +
              '<button onclick="switchView(\\'traction\\')" class="text-primary text-sm font-medium hover:underline">View all →</button>' +
            '</div>' +
            '<div class="space-y-3">' +
              (goals.length === 0 ? 
                '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-3xl mb-2"></i><p class="text-sm">No active goals</p></div>' :
                goals.slice(0, 3).map(goal => 
                  '<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">' +
                    '<div class="flex-1"><div class="flex items-center mb-1">' +
                      '<span class="w-2 h-2 rounded-full mr-2 ' + (goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400') + '"></span>' +
                      '<h4 class="font-semibold text-gray-900 text-sm">' + goal.description + '</h4>' +
                    '</div><div class="ml-4">' +
                      '<div class="w-full bg-gray-200 rounded-full h-1.5"><div class="h-1.5 rounded-full ' + (goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400') + '" style="width: ' + Math.min((goal.current_value / goal.target_value) * 100, 100) + '%"></div></div>' +
                    '</div></div>' +
                    '<div class="text-right ml-3"><div class="text-xs text-gray-600">' + Math.round((goal.current_value / goal.target_value) * 100) + '%</div></div>' +
                  '</div>'
                ).join('')
              ) +
            '</div>' +
          '</div>' +
          '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">' +
            '<div class="flex items-center justify-between mb-4">' +
              '<h3 class="font-bold text-gray-900">Recent Messages</h3>' +
              '<button onclick="switchView(\\'inbox\\')" class="text-primary text-sm font-medium hover:underline">View all →</button>' +
            '</div>' +
            '<div class="space-y-3">' +
              '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-3xl mb-2"></i><p class="text-sm">No messages</p></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // LinkedIn Connector Terminal
        '<div class="mt-8">' +
          '<h2 class="text-2xl font-bold text-gray-900 mb-6">🔗 LinkedIn Connector</h2>' +
          '<div class="bg-gray-900 rounded-lg shadow-lg overflow-hidden">' +
            '<div class="bg-gray-800 px-4 py-2 flex items-center space-x-2">' +
              '<div class="flex space-x-2"><div class="w-3 h-3 rounded-full bg-red-500"></div><div class="w-3 h-3 rounded-full bg-yellow-500"></div><div class="w-3 h-3 rounded-full bg-green-500"></div></div>' +
              '<span class="text-gray-400 text-sm ml-4">linkedin-connector-terminal</span>' +
            '</div>' +
            '<div class="p-6 text-gray-100 font-mono text-sm">' +
              '<div class="mb-6">' +
                '<div class="flex items-center mb-4">' +
                  '<span class="text-green-400 mr-2">$</span>' +
                  '<span class="text-gray-400 mr-2">search --type</span>' +
                  '<select id="linkedinSearchType" class="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-700 mr-2">' +
                    '<option value="investor">investor</option>' +
                    '<option value="talent">talent</option>' +
                    '<option value="customer">customer</option>' +
                    '<option value="partner">partner</option>' +
                  '</select>' +
                  '<span class="text-gray-400 mr-2">--query</span>' +
                  '<input type="text" id="linkedinQuery" placeholder=\'"venture capital" OR "AI startup"\' class="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-700 flex-1" onkeypress="if(event.key===\'Enter\')searchLinkedInProfiles()"/>' +
                  '<button onclick="searchLinkedInProfiles()" class="ml-2 bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded">🔍 Search</button>' +
                '</div>' +
                '<div class="text-xs text-gray-500 mb-4"><span class="text-yellow-400">💡 Tips:</span> Use keywords like "seed investor", "full stack engineer", "CTO SaaS", etc.</div>' +
              '</div>' +
              '<div id="linkedinResults" class="hidden">' +
                '<div class="flex items-center justify-between mb-4">' +
                  '<div class="text-gray-400"><span class="text-green-400">✓</span> Found <span id="totalProfiles">0</span> profiles | <span class="text-blue-400"><span id="selectedCount">0</span> selected</span></div>' +
                  '<div class="space-x-2" id="linkedinActions" style="display:none">' +
                    '<button onclick="generateConnectionMessages()" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs">📧 Generate Messages</button>' +
                    '<button onclick="saveSelectedConnections()" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">💾 Save to Campaign</button>' +
                  '</div>' +
                '</div>' +
                '<div id="profilesGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto"></div>' +
              '</div>' +
              '<div id="linkedinEmpty" class="text-center py-8 text-gray-500">' +
                '<div class="text-4xl mb-4">🔍</div>' +
                '<p>No searches yet. Start by typing a query and clicking Search.</p>' +
                '<div class="mt-4 text-xs"><p class="mb-2">Example queries:</p>' +
                  '<div class="space-y-1 text-left max-w-md mx-auto">' +
                    '<div class="bg-gray-800 px-3 py-2 rounded">investor: "seed stage venture capital AI"</div>' +
                    '<div class="bg-gray-800 px-3 py-2 rounded">talent: "senior react developer"</div>' +
                    '<div class="bg-gray-800 px-3 py-2 rounded">customer: "CTO fintech company"</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
      
      function getTractionHTML(goals, metrics) {
        return '<div class="mb-8"><h2 class="text-3xl font-bold text-gray-900">Traction & Analytics</h2><p class="text-gray-600 mt-1">Visualiza todas tus métricas y el crecimiento de tu proyecto</p></div>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">' +
          '<div class="bg-white rounded-xl shadow-lg p-6"><div class="flex items-center justify-between mb-4"><i class="fas fa-bullseye text-blue-500 text-3xl"></i><span class="text-xs text-green-600 font-semibold">↗ Progress</span></div>' +
          '<div class="text-3xl font-bold text-gray-900 mb-1">' + metrics.overallCompletion + '%</div><div class="text-sm text-gray-600">Goal Completion</div></div>' +
          '<div class="bg-white rounded-xl shadow-lg p-6"><div class="flex items-center justify-between mb-4"><i class="fas fa-check-circle text-green-500 text-3xl"></i><span class="text-xs text-green-600 font-semibold">✓ Done</span></div>' +
          '<div class="text-3xl font-bold text-gray-900 mb-1">' + metrics.completedGoals + '</div><div class="text-sm text-gray-600">Completed Goals</div></div>' +
          '<div class="bg-white rounded-xl shadow-lg p-6"><div class="flex items-center justify-between mb-4"><i class="fas fa-tasks text-purple-500 text-3xl"></i><span class="text-xs text-blue-600 font-semibold">⚡ Active</span></div>' +
          '<div class="text-3xl font-bold text-gray-900 mb-1">' + goals.filter(g => g.status === 'in_progress').length + '</div><div class="text-sm text-gray-600">In Progress</div></div>' +
          '<div class="bg-white rounded-xl shadow-lg p-6"><div class="flex items-center justify-between mb-4"><i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i><span class="text-xs text-red-600 font-semibold">⚠ Urgent</span></div>' +
          '<div class="text-3xl font-bold text-gray-900 mb-1">' + metrics.overdueGoals + '</div><div class="text-sm text-gray-600">Overdue</div></div>' +
        '</div>' +
        '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">' +
          '<div class="bg-white rounded-2xl shadow-lg p-6">' +
            '<div class="flex items-center mb-4"><i class="fas fa-bullseye text-blue-500 text-xl mr-3"></i><h3 class="text-xl font-bold text-gray-900">Goals Status</h3></div>' +
            '<div class="flex items-center justify-center"><div class="relative w-48 h-48">' +
              '<svg class="w-full h-full transform -rotate-90"><circle cx="96" cy="96" r="80" stroke="#e5e7eb" stroke-width="16" fill="none"/>' +
              '<circle cx="96" cy="96" r="80" stroke="#10b981" stroke-width="16" fill="none" stroke-dasharray="' + ((metrics.overallCompletion / 100) * 502.4) + ' 502.4" stroke-linecap="round"/></svg>' +
              '<div class="absolute inset-0 flex items-center justify-center"><div class="text-center"><div class="text-4xl font-bold text-gray-900">' + metrics.overallCompletion + '%</div><div class="text-sm text-gray-600">Overall</div></div></div>' +
            '</div></div>' +
            '<div class="mt-6 grid grid-cols-3 gap-4">' +
              '<div class="text-center"><div class="text-2xl font-bold text-green-600">' + metrics.completedGoals + '</div><div class="text-xs text-gray-600">Completed</div></div>' +
              '<div class="text-center"><div class="text-2xl font-bold text-blue-600">' + goals.filter(g => g.status === 'in_progress').length + '</div><div class="text-xs text-gray-600">In Progress</div></div>' +
              '<div class="text-center"><div class="text-2xl font-bold text-red-600">' + metrics.overdueGoals + '</div><div class="text-xs text-gray-600">Overdue</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="bg-white rounded-2xl shadow-lg p-6"><div class="flex items-center mb-4"><i class="fas fa-chart-line text-purple-500 text-xl mr-3"></i><h3 class="text-xl font-bold text-gray-900">Progress Over Time</h3></div>' +
          '<div class="h-64 flex items-end justify-around space-x-2">' +
            goals.slice(0, 7).map((goal, index) => {
              const progress = (goal.current_value / goal.target_value) * 100;
              return '<div class="flex-1 flex flex-col items-center"><div class="w-full bg-gray-200 rounded-t-lg overflow-hidden" style="height: 200px">' +
                '<div class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all" style="height: ' + Math.min(progress, 100) + '%; margin-top: ' + (100 - Math.min(progress, 100)) + '%"></div>' +
                '</div><div class="text-xs text-gray-600 mt-2">Day ' + (index + 1) + '</div></div>';
            }).join('') +
          '</div></div>' +
        '</div>' +
        '<div class="bg-white rounded-2xl shadow-lg p-6"><div class="flex items-center mb-6"><i class="fas fa-list-check text-indigo-500 text-xl mr-3"></i><h3 class="text-xl font-bold text-gray-900">All Goals Overview</h3></div>' +
        '<div class="space-y-3">' +
          (goals.length === 0 ? 
            '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-4"></i><p>No hay objetivos para mostrar</p></div>' :
            goals.map(goal => 
              '<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">' +
                '<div class="flex-1"><div class="flex items-center mb-2">' +
                  '<span class="w-3 h-3 rounded-full mr-3 ' + (goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400') + '"></span>' +
                  '<h4 class="font-semibold text-gray-900">' + goal.description + '</h4>' +
                  '<span class="ml-2 px-2 py-1 text-xs font-bold rounded ' + (goal.status === 'completed' ? 'bg-green-100 text-green-800' : goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800') + '">' +
                  (goal.status === 'completed' ? 'Completed' : goal.status === 'in_progress' ? 'In Progress' : 'Pending') + '</span>' +
                '</div><div class="ml-6">' +
                  '<div class="flex items-center text-sm text-gray-600 mb-2"><span class="mr-4">Target: ' + goal.target_value + '</span><span>Current: ' + goal.current_value + '</span>' +
                  '<span class="ml-4 text-primary font-semibold">' + Math.round((goal.current_value / goal.target_value) * 100) + '%</span></div>' +
                  '<div class="w-full bg-gray-200 rounded-full h-2"><div class="h-2 rounded-full ' + (goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400') + '" style="width: ' + Math.min((goal.current_value / goal.target_value) * 100, 100) + '%"></div></div>' +
                '</div></div>' +
                '<div class="text-right ml-4"><div class="text-sm font-semibold text-gray-900">' + formatDate(goal.deadline) + '</div><div class="text-xs text-gray-500 mt-1">Deadline</div></div>' +
              '</div>'
            ).join('')
          ) +
        '</div></div>';
      }
      
      async function getInboxHTML() {
        try {
          // Load real conversations from API
          const response = await axios.get('/api/chat/conversations');
          const conversations = response.data.conversations || [];
          
          let conversationsHTML = '';
          if (conversations.length === 0) {
            conversationsHTML = '<div class="p-4 text-center text-gray-500"><p>No tienes conversaciones aún</p></div>';
          } else {
            conversationsHTML = conversations.map(conv => {
              const unreadBadge = conv.unread_count > 0 
                ? \`<span class="bg-primary text-white text-xs px-2 py-1 rounded-full">\${conv.unread_count}</span>\`
                : '';
              const timeAgo = formatTimeAgo(conv.last_message_at);
              const avatarUrl = conv.other_user_avatar || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(conv.other_user_name)}&background=6366f1&color=fff\`;
              
              return \`<div class="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition" onclick="loadConversation(\${conv.id})">
                <div class="flex items-center mb-2">
                  <img src="\${avatarUrl}" class="w-10 h-10 rounded-full mr-3"/>
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900">\${conv.other_user_name}</div>
                    <div class="text-xs text-gray-600">\${timeAgo}</div>
                  </div>
                  \${unreadBadge}
                </div>
                <p class="text-sm text-gray-600 truncate">\${conv.last_message || 'Sin mensajes'}</p>
              </div>\`;
            }).join('');
          }
          
          return '<div class="mb-8"><h2 class="text-3xl font-bold text-gray-900">Inbox</h2><p class="text-gray-600 mt-1">Mensajes entre validadores y startups</p></div>' +
          '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">' +
            '<div class="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4">' +
              '<div class="mb-4"><input type="text" placeholder="Buscar conversaciones..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/></div>' +
              '<div class="space-y-2">' +
                conversationsHTML +
              '</div>' +
            '</div>' +
            '<div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">' +
              '<div class="flex items-center justify-center h-96 text-gray-400">' +
                '<div class="text-center">' +
                  '<i class="fas fa-comments text-5xl mb-4"></i>' +
                  '<p>Selecciona una conversación para ver los mensajes</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        } catch (error) {
          console.error('Error loading conversations:', error);
          return '<div class="mb-8"><h2 class="text-3xl font-bold text-gray-900">Inbox</h2><p class="text-red-600 mt-1">Error cargando conversaciones</p></div>';
        }
      }
      
      function formatTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'hace un momento';
        if (seconds < 3600) return \`hace \${Math.floor(seconds / 60)} min\`;
        if (seconds < 86400) return \`hace \${Math.floor(seconds / 3600)} horas\`;
        if (seconds < 604800) return \`hace \${Math.floor(seconds / 86400)} días\`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }
      
      window.loadConversation = async function(conversationId) {
        console.log('Loading conversation:', conversationId);
        // TODO: Implement conversation loading
        alert('Funcionalidad de conversación en desarrollo');
      };
      
      async function getDirectoryHTML() {
        try {
          // Load validators from API
          const response = await axios.get('/api/validation/validators');
          const validators = response.data || [];
          
          let validatorsHTML = '';
          if (validators.length === 0) {
            validatorsHTML = '<div class="col-span-full text-center p-12 text-gray-500"><i class="fas fa-users text-5xl mb-4"></i><p>No hay validadores disponibles</p></div>';
          } else {
            validatorsHTML = validators.map(validator => {
              const avatarUrl = validator.avatar_url || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(validator.name)}&background=6366f1&color=fff\`;
              const expertise = Array.isArray(validator.expertise) ? validator.expertise : JSON.parse(validator.expertise || '[]');
              const expertiseHTML = expertise.slice(0, 3).map(exp => 
                \`<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">\${exp}</span>\`
              ).join('');
              
              return \`<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div class="flex items-start mb-4">
                  <img src="\${avatarUrl}" class="w-16 h-16 rounded-full mr-4"/>
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 text-lg">\${validator.name}</h3>
                    <p class="text-sm text-gray-600">\${validator.title || 'Validator'}</p>
                    <div class="flex items-center mt-2">
                      <div class="flex text-yellow-400">
                        \${Array(5).fill(0).map((_, i) => \`<i class="fas fa-star\${i < Math.round(validator.rating || 0) ? '' : '-o'}"></i>\`).join('')}
                      </div>
                      <span class="text-sm text-gray-500 ml-2">(\${validator.total_validations || 0} validaciones)</span>
                    </div>
                  </div>
                </div>
                <div class="mb-4">
                  <p class="text-sm text-gray-600 line-clamp-2">\${validator.bio || 'Validator experto en startups'}</p>
                </div>
                <div class="mb-4">
                  \${expertiseHTML}
                </div>
                <div class="flex gap-2">
                  <button onclick="startChatWithValidator(\${validator.user_id})" class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                    <i class="fas fa-comment mr-2"></i>Chatear
                  </button>
                  <button onclick="viewValidatorProfile(\${validator.user_id})" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <i class="fas fa-user"></i>
                  </button>
                </div>
              </div>\`;
            }).join('');
          }
          
          return '<div class="mb-8"><h2 class="text-3xl font-bold text-gray-900">Validators</h2><p class="text-gray-600 mt-1">Conecta con expertos que pueden validar tu startup</p></div>' +
          '<div class="mb-6"><input type="text" placeholder="Buscar validators por nombre o expertise..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/></div>' +
          '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">' +
            validatorsHTML +
          '</div>';
        } catch (error) {
          console.error('Error loading validators:', error);
          return '<div class="mb-8"><h2 class="text-3xl font-bold text-gray-900">Validators</h2><p class="text-red-600 mt-1">Error cargando validators</p></div>';
        }
      }
      
      window.startChatWithValidator = async function(validatorUserId) {
        try {
          console.log('Starting chat with validator:', validatorUserId);
          // Create or get conversation
          const response = await axios.post('/api/chat/conversations', {
            other_user_id: validatorUserId
          });
          const conversationId = response.data.conversation_id;
          // Switch to inbox and load conversation
          state.currentView = 'inbox';
          render();
          setTimeout(() => {
            window.loadConversation(conversationId);
          }, 500);
        } catch (error) {
          console.error('Error starting chat:', error);
          alert('Error al iniciar conversación');
        }
      };
      
      window.viewValidatorProfile = function(validatorUserId) {
        console.log('Viewing validator profile:', validatorUserId);
        alert('Perfil de validator en desarrollo');
      };

      // Event handlers
      window.toggleChat = () => {
        state.chatExpanded = !state.chatExpanded;
        render();
        if (state.chatExpanded) {
          scrollChatToBottom();
        }
      };

      window.updateInput = (value) => {
        state.inputMessage = value;
      };

      window.handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      };

      window.sendMessage = sendMessage;

      window.clearChat = async () => {
        if (confirm('¿Limpiar el historial del chat?')) {
          try {
            await axios.delete('/api/chat-agent/history', {
              withCredentials: true
            });
            state.messages = [];
            render();
          } catch (error) {
            console.error('Error clearing chat:', error);
          }
        }
      };

      window.createGoal = () => {
        state.inputMessage = 'Quiero crear un nuevo objetivo';
        state.chatExpanded = true;
        render();
        setTimeout(() => {
          document.getElementById('chat-input')?.focus();
        }, 100);
      };

      window.switchView = (view) => {
        console.log('Switching to view:', view);
        state.currentView = view;
        // Re-render everything to update navigation highlight
        render();
        // Content will be updated by render() -> requestAnimationFrame -> updateMainContent()
      };

      // LinkedIn Connector functions
      let linkedinProfiles = [];
      let selectedProfiles = new Set();

      window.searchLinkedInProfiles = async function() {
        const query = document.getElementById('linkedinQuery').value;
        const type = document.getElementById('linkedinSearchType').value;
        
        if (!query.trim()) {
          alert('Por favor ingresa términos de búsqueda');
          return;
        }

        try {
          const token = localStorage.getItem('token');
          const response = await axios.post('/api/linkedin-connector/search', {
            type: type,
            query: query,
            maxResults: 20
          }, {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });

          if (response.data.success) {
            linkedinProfiles = response.data.profiles;
            selectedProfiles = new Set();
            renderLinkedInProfiles();
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error al buscar perfiles');
        }
      };

      function renderLinkedInProfiles() {
        const resultsDiv = document.getElementById('linkedinResults');
        const emptyDiv = document.getElementById('linkedinEmpty');
        const profilesGrid = document.getElementById('profilesGrid');
        const totalSpan = document.getElementById('totalProfiles');
        const selectedSpan = document.getElementById('selectedCount');
        const actionsDiv = document.getElementById('linkedinActions');

        if (linkedinProfiles.length === 0) {
          resultsDiv.classList.add('hidden');
          emptyDiv.classList.remove('hidden');
          return;
        }

        resultsDiv.classList.remove('hidden');
        emptyDiv.classList.add('hidden');
        totalSpan.textContent = linkedinProfiles.length;
        selectedSpan.textContent = selectedProfiles.size;
        actionsDiv.style.display = selectedProfiles.size > 0 ? 'block' : 'none';

        profilesGrid.innerHTML = linkedinProfiles.map(profile => \`
          <div class="bg-gray-800 border rounded p-4 cursor-pointer transition-all \${selectedProfiles.has(profile.id) ? 'border-blue-500 bg-gray-750' : 'border-gray-700 hover:border-gray-600'}" 
               onclick="toggleProfileSelection('\${profile.id}')">
            <div class="flex items-start space-x-3">
              <input type="checkbox" \${selectedProfiles.has(profile.id) ? 'checked' : ''} 
                     onclick="event.stopPropagation(); toggleProfileSelection('\${profile.id}')" class="mt-1"/>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-white font-semibold">\${profile.name}</h3>
                  <span class="text-xs px-2 py-1 rounded \${profile.compatibilityScore >= 90 ? 'bg-green-600' : profile.compatibilityScore >= 75 ? 'bg-blue-600' : 'bg-yellow-600'}">
                    \${profile.compatibilityScore}% match
                  </span>
                </div>
                <p class="text-gray-400 text-xs mb-2">\${profile.headline}</p>
                <div class="flex items-center text-xs text-gray-500 space-x-3">
                  <span>📍 \${profile.location}</span>
                  <span>🏢 \${profile.industry}</span>
                  \${profile.connections ? \`<span>🤝 \${profile.connections}+</span>\` : ''}
                </div>
                <div class="mt-2 text-xs">
                  \${profile.matchReasons.slice(0, 2).map(reason => \`<div class="text-green-400">✓ \${reason}</div>\`).join('')}
                </div>
              </div>
            </div>
          </div>
        \`).join('');
      }

      window.toggleProfileSelection = function(profileId) {
        if (selectedProfiles.has(profileId)) {
          selectedProfiles.delete(profileId);
        } else {
          selectedProfiles.add(profileId);
        }
        renderLinkedInProfiles();
      };

      window.generateConnectionMessages = async function() {
        if (selectedProfiles.size === 0) {
          alert('Selecciona al menos un perfil');
          return;
        }

        try {
          const token = localStorage.getItem('token');
          const type = document.getElementById('linkedinSearchType').value;
          const purpose = type === 'investor' ? 'investment' : 
                         type === 'talent' ? 'hiring' : 
                         type === 'customer' ? 'partnership' : 'partnership';

          const response = await axios.post('/api/linkedin-connector/generate-message', {
            profileIds: Array.from(selectedProfiles),
            purpose: purpose,
            senderInfo: {
              name: 'Your Name',
              company: 'Your Company',
              title: 'Your Title'
            }
          }, {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });

          if (response.data.success) {
            alert(\`✅ \${response.data.totalMessages} mensajes generados exitosamente\`);
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error al generar mensajes');
        }
      };

      window.saveSelectedConnections = async function() {
        if (selectedProfiles.size === 0) {
          alert('Selecciona al menos un perfil');
          return;
        }

        const campaignName = prompt('Nombre de la campaña:');
        if (!campaignName) return;

        try {
          const token = localStorage.getItem('token');
          const profilesArray = linkedinProfiles.filter(p => selectedProfiles.has(p.id));
          
          const response = await axios.post('/api/linkedin-connector/save-connections', {
            profiles: profilesArray,
            campaign: campaignName
          }, {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });

          if (response.data.success) {
            alert(\`✅ \${response.data.saved} conexiones guardadas en campaña: \${campaignName}\`);
            selectedProfiles = new Set();
            renderLinkedInProfiles();
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error al guardar conexiones');
        }
      };

      // Initialize
      loadGoals();
      loadChatHistory();

      // Handle hash changes
      window.addEventListener('hashchange', () => {
        const view = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
        if (['dashboard', 'traction', 'inbox', 'directory'].includes(view)) {
          window.switchView(view);
        }
      });
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('[DASHBOARD] Error rendering page:', error);
    console.error('[DASHBOARD] Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Don't redirect, show error instead
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Dashboard Error</h1>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
        <a href="/">Go back to home</a>
      </body>
      </html>
    `);
  }
});

export default app;