import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings } from './types';
import { jsx } from 'hono/jsx';

const app = new Hono<{ Bindings: Bindings }>();

// Dashboard page with integrated chat
app.get('/', async (c) => {
  const authToken = c.req.header('cookie')?.match(/authToken=([^;]+)/)?.[1];

  if (!authToken) {
    return c.redirect('/api/auth/google');
  }

  try {
    const payload = await verify(authToken, c.env.JWT_SECRET || 'your-secret-key-change-in-production-use-env-var') as any;

    return c.html(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ValidAI Studio</title>
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
        // Save token as cookie
        document.cookie = \`authToken=\${urlToken}; path=/; max-age=\${60 * 60 * 24 * 7}; SameSite=Lax\`;
        // Clean up URL
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      const userId = ${payload.userId};
      const userName = "${payload.userName || 'Usuario'}";
      
      // Configure axios to send cookies automatically
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      
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
      // MARKETING AGENT FUNCTIONS
      // ============================================

      async function analyzeGoals() {
        if (state.isLoading) return;

        state.isLoading = true;
        
        // Add user message
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: '🎯 Analizar mis objetivos actuales',
          timestamp: new Date()
        });
        
        render();

        try {
          const response = await axios.post('/api/chat-agent/analyze-goals', {}, {
            withCredentials: true
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.analysis,
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

        const timeframe = prompt('¿Para cuánto tiempo quieres el plan? (ej: 30 días, 1 mes, 3 meses)', '30 días');
        if (!timeframe) return;

        state.isLoading = true;
        
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: \`📋 Generar plan de marketing para \${timeframe}\`,
          timestamp: new Date()
        });
        
        render();

        try {
          const response = await axios.post('/api/chat-agent/marketing-plan', {
            timeframe
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.plan,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error generating plan:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Lo siento, ocurrió un error al generar el plan.',
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

        const platform = prompt('¿Para qué plataforma? (Instagram, LinkedIn, Twitter, TikTok, Facebook)', 'Instagram');
        if (!platform) return;

        const quantity = prompt('¿Cuántas ideas quieres?', '10');

        state.isLoading = true;
        
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: \`💡 Generar \${quantity} ideas de contenido para \${platform}\`,
          timestamp: new Date()
        });
        
        render();

        try {
          const response = await axios.post('/api/chat-agent/content-ideas', {
            platform,
            quantity: parseInt(quantity)
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.ideas,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error generating ideas:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Lo siento, ocurrió un error al generar ideas.',
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

        const industry = prompt('¿En qué industria estás?', 'Marketing Digital');
        if (!industry) return;

        const competitorsStr = prompt('¿Cuáles son tus principales competidores? (separados por comas)', '');
        const competitors = competitorsStr ? competitorsStr.split(',').map(c => c.trim()) : [];

        state.isLoading = true;
        
        state.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: \`🏆 Analizar competencia en \${industry}\${competitors.length > 0 ? \`: \${competitors.join(', ')}\` : ''}\`,
          timestamp: new Date()
        });
        
        render();

        try {
          const response = await axios.post('/api/chat-agent/competition-analysis', {
            industry,
            competitors
          }, {
            withCredentials: true
          });

          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.analysis,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error analyzing competition:', error);
          state.messages.push({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Lo siento, ocurrió un error al analizar la competencia.',
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
            <!-- Sidebar Navigation -->
            <div class="w-64 bg-white shadow-lg flex flex-col">
              <div class="p-6">
                <h1 class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ValidAI Studio
                </h1>
                <p class="text-sm text-gray-600 mt-1">${userName}</p>
              </div>
              
              <nav class="flex-1 px-3 overflow-y-auto">
                <a href="#" onclick="switchView('dashboard'); return false;" class="flex items-center px-4 py-3 \${state.currentView === 'dashboard' ? 'text-gray-700 bg-primary/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg mb-2">
                  <i class="fas fa-home mr-3"></i>
                  Home (HQ)
                </a>
                <a href="#" onclick="switchView('traction'); return false;" class="flex items-center px-4 py-3 \${state.currentView === 'traction' ? 'text-gray-700 bg-primary/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg mb-2">
                  <i class="fas fa-chart-line mr-3"></i>
                  Traction
                </a>
                <a href="#" onclick="switchView('inbox'); return false;" class="flex items-center px-4 py-3 \${state.currentView === 'inbox' ? 'text-gray-700 bg-primary/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg mb-2">
                  <i class="fas fa-inbox mr-3"></i>
                  Inbox
                </a>
                <a href="/leaderboard" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
                  <i class="fas fa-trophy mr-3"></i>
                  Leaderboard
                </a>
                <a href="/marketplace" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
                  <i class="fas fa-star mr-3"></i>
                  Marketplace
                </a>
                <a href="#planner" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
                  <i class="fas fa-calendar mr-3"></i>
                  Planner
                </a>
                <a href="#insights" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
                  <i class="fas fa-chart-bar mr-3"></i>
                  Insights
                </a>
              </nav>

              <div class="p-3 border-t">
                <a href="#settings" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
                  <i class="fas fa-cog mr-3"></i>
                  Settings
                </a>
                <a href="#help" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <i class="fas fa-question-circle mr-3"></i>
                  Help
                </a>
              </div>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 overflow-y-auto transition-all duration-300 \${chatExpanded ? 'mr-96' : 'mr-20'}">
              <div class="p-8" id="main-content">
                <!-- Content will be rendered here based on state.currentView -->
              </div>
            </div>

            <!-- Temporary hidden div to avoid breaking the rest -->
            <div style="display:none;">
              <div class="flex justify-between items-center mb-8">
                  <div>
                    <h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p class="text-gray-600 mt-1">Monitorea tu progreso y objetivos</p>
                  </div>
                  <div class="bg-white rounded-2xl shadow-lg p-6 text-center min-w-[200px]">
                    <div class="flex items-center justify-center mb-2">
                      <i class="fas fa-trophy text-red-500 text-2xl mr-2"></i>
                      <span class="text-gray-600 font-semibold">Score</span>
                    </div>
                    <div class="text-5xl font-bold text-red-500 mb-2">\${metrics.overallCompletion}.0</div>
                    <div class="flex items-center justify-center space-x-4 text-sm">
                      <span class="flex items-center text-yellow-500">
                        <i class="fas fa-star mr-1"></i> \${metrics.completedGoals}
                      </span>
                      <span class="flex items-center text-red-500">
                        <i class="fas fa-heart mr-1"></i> \${metrics.overdueGoals}
                      </span>
                      <span class="flex items-center text-blue-500">
                        <i class="fas fa-check-circle mr-1"></i> \${metrics.totalGoals}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Dashboard Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <!-- Goals Status -->
                  <div class="bg-white rounded-2xl shadow-lg p-6">
                    <div class="flex items-center mb-4">
                      <i class="fas fa-bullseye text-blue-500 text-xl mr-3"></i>
                      <h3 class="text-xl font-bold text-gray-900">Goals Status</h3>
                    </div>
                    <div class="flex items-center justify-center">
                      <div class="relative w-48 h-48">
                        <svg class="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="80" stroke="#e5e7eb" stroke-width="16" fill="none"/>
                          <circle 
                            cx="96" cy="96" r="80" 
                            stroke="#10b981" 
                            stroke-width="16" 
                            fill="none"
                            stroke-dasharray="\${(metrics.overallCompletion / 100) * 502.4} 502.4"
                            stroke-linecap="round"
                          />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div class="text-center">
                            <div class="text-4xl font-bold text-gray-900">\${metrics.overallCompletion}%</div>
                            <div class="text-sm text-gray-600">Overall</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="mt-6 grid grid-cols-3 gap-4">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">\${metrics.completedGoals}</div>
                        <div class="text-xs text-gray-600">Completed</div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">\${goals.filter(g => g.status === 'in_progress').length}</div>
                        <div class="text-xs text-gray-600">In Progress</div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-red-600">\${metrics.overdueGoals}</div>
                        <div class="text-xs text-gray-600">Overdue</div>
                      </div>
                    </div>
                  </div>

                  <!-- Goals Progress Chart -->
                  <div class="bg-white rounded-2xl shadow-lg p-6">
                    <div class="flex items-center mb-4">
                      <i class="fas fa-chart-line text-purple-500 text-xl mr-3"></i>
                      <h3 class="text-xl font-bold text-gray-900">Progress Over Time</h3>
                    </div>
                    <div class="h-64 flex items-end justify-around space-x-2">
                      \${goals.slice(0, 7).map((goal, index) => {
                        const progress = (goal.current_value / goal.target_value) * 100;
                        return \`
                          <div class="flex-1 flex flex-col items-center">
                            <div class="w-full bg-gray-200 rounded-t-lg overflow-hidden" style="height: 200px">
                              <div 
                                class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                                style="height: \${Math.min(progress, 100)}%; margin-top: \${100 - Math.min(progress, 100)}%"
                              ></div>
                            </div>
                            <div class="text-xs text-gray-600 mt-2">Day \${index + 1}</div>
                          </div>
                        \`;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <!-- Active Goals List -->
                <div class="bg-white rounded-2xl shadow-lg p-6">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                      <i class="fas fa-list text-orange-500 text-xl mr-3"></i>
                      <h3 class="text-xl font-bold text-gray-900">Active Goals</h3>
                    </div>
                    <button onclick="createGoal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                      <i class="fas fa-plus mr-2"></i>New Goal
                    </button>
                  </div>
                  <div class="space-y-3">
                    \${goals.length === 0 ? \`
                      <div class="text-center py-12 text-gray-400">
                        <i class="fas fa-inbox text-4xl mb-4"></i>
                        <p>No hay objetivos activos</p>
                        <p class="text-sm mt-2">Crea tu primer objetivo o pregunta al asistente</p>
                      </div>
                    \` : goals.slice(0, 5).map(goal => \`
                      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div class="flex-1">
                          <div class="flex items-center mb-2">
                            <span class="w-3 h-3 rounded-full mr-3 \${
                              goal.status === 'completed' ? 'bg-green-500' :
                              goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                            }"></span>
                            <h4 class="font-semibold text-gray-900">\${goal.description}</h4>
                          </div>
                          <div class="ml-6">
                            <div class="flex items-center text-sm text-gray-600 mb-2">
                              <span class="mr-4">Target: \${goal.target_value}</span>
                              <span>Current: \${goal.current_value}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                class="h-2 rounded-full \${
                                  goal.status === 'completed' ? 'bg-green-500' :
                                  goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                                }"
                                style="width: \${Math.min((goal.current_value / goal.target_value) * 100, 100)}%"
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div class="text-right ml-4">
                          <div class="text-sm text-gray-600">\${formatDate(goal.deadline)}</div>
                        </div>
                      </div>
                    \`).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Sidebar -->
            <div class="fixed right-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 \${chatExpanded ? 'w-96' : 'w-20'} shadow-2xl z-50">
              <!-- Chat Toggle -->
              <button
                onclick="toggleChat()"
                class="absolute -left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white p-3 rounded-l-lg hover:bg-gray-800 transition"
              >
                <i class="fas \${chatExpanded ? 'fa-chevron-right' : 'fa-chevron-left'}"></i>
              </button>

              \${chatExpanded ? \`
                <div class="flex flex-col h-full">
                  <!-- Chat Header -->
                  <div class="p-4 border-b border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="text-lg font-bold">AI Assistant</h3>
                      <button onclick="clearChat()" class="text-gray-400 hover:text-white" title="Nuevo chat">
                        <i class="fas fa-plus"></i>
                      </button>
                    </div>
                    <p class="text-xs text-gray-400">Gestiona tus objetivos y progreso</p>
                    
                    <!-- Marketing Agent Quick Actions -->
                    <div class="mt-4 space-y-2">
                      <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">Acciones Rápidas</p>
                      <button 
                        onclick="analyzeGoals()" 
                        class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition flex items-center justify-center"
                      >
                        <i class="fas fa-chart-line mr-2"></i>
                        Analizar Objetivos
                      </button>
                      <button 
                        onclick="generateMarketingPlan()" 
                        class="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition flex items-center justify-center"
                      >
                        <i class="fas fa-clipboard-list mr-2"></i>
                        Plan de Marketing
                      </button>
                      <button 
                        onclick="generateContentIdeas()" 
                        class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition flex items-center justify-center"
                      >
                        <i class="fas fa-lightbulb mr-2"></i>
                        Ideas de Contenido
                      </button>
                      <button 
                        onclick="analyzeCompetition()" 
                        class="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs font-medium transition flex items-center justify-center"
                      >
                        <i class="fas fa-users mr-2"></i>
                        Análisis de Competencia
                      </button>
                    </div>
                  </div>

                  <!-- Chat Messages -->
                  <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
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
                    <div class="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>Enter para enviar</span>
                      <span class="flex items-center">
                        <i class="fas fa-circle text-green-500 mr-1 text-[8px]"></i>
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              \` : \`
                <div class="flex flex-col items-center py-6 space-y-6">
                  <button onclick="toggleChat()" class="text-white hover:text-primary transition" title="Abrir chat">
                    <i class="fas fa-comments text-xl"></i>
                  </button>
                </div>
              \`}
            </div>
          </div>
        \`;
        
        // Update main content based on current view after DOM is ready
        requestAnimationFrame(() => {
          updateMainContent();
        });
      }

      // Update main content based on view
      function updateMainContent() {
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
          contentDiv.innerHTML = getInboxHTML();
        }
        console.log('Content updated');
      }
      
      function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }
      
      function getDashboardHTML(goals, metrics) {
        return '<div class="flex justify-between items-center mb-8">' +
          '<div>' +
            '<h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>' +
            '<p class="text-gray-600 mt-1">Monitorea tu progreso y objetivos</p>' +
          '</div>' +
          '<div class="bg-white rounded-2xl shadow-lg p-6 text-center min-w-[200px]">' +
            '<div class="flex items-center justify-center mb-2">' +
              '<i class="fas fa-trophy text-red-500 text-2xl mr-2"></i>' +
              '<span class="text-gray-600 font-semibold">Score</span>' +
            '</div>' +
            '<div class="text-5xl font-bold text-red-500 mb-2">' + metrics.overallCompletion + '.0</div>' +
            '<div class="flex items-center justify-center space-x-4 text-sm">' +
              '<span class="flex items-center text-yellow-500"><i class="fas fa-star mr-1"></i> ' + metrics.completedGoals + '</span>' +
              '<span class="flex items-center text-red-500"><i class="fas fa-heart mr-1"></i> ' + metrics.overdueGoals + '</span>' +
              '<span class="flex items-center text-blue-500"><i class="fas fa-check-circle mr-1"></i> ' + metrics.totalGoals + '</span>' +
            '</div>' +
          '</div>' +
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
        '<div class="bg-white rounded-2xl shadow-lg p-6">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<div class="flex items-center"><i class="fas fa-list text-orange-500 text-xl mr-3"></i><h3 class="text-xl font-bold text-gray-900">Active Goals</h3></div>' +
            '<button onclick="createGoal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"><i class="fas fa-plus mr-2"></i>New Goal</button>' +
          '</div>' +
          '<div class="space-y-3">' +
            (goals.length === 0 ? 
              '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-4"></i><p>No hay objetivos activos</p><p class="text-sm mt-2">Crea tu primer objetivo o pregunta al asistente</p></div>' :
              goals.slice(0, 5).map(goal => 
                '<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">' +
                  '<div class="flex-1"><div class="flex items-center mb-2">' +
                    '<span class="w-3 h-3 rounded-full mr-3 ' + (goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400') + '"></span>' +
                    '<h4 class="font-semibold text-gray-900">' + goal.description + '</h4>' +
                  '</div><div class="ml-6">' +
                    '<div class="flex items-center text-sm text-gray-600 mb-2"><span class="mr-4">Target: ' + goal.target_value + '</span><span>Current: ' + goal.current_value + '</span></div>' +
                    '<div class="w-full bg-gray-200 rounded-full h-2"><div class="h-2 rounded-full ' + (goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400') + '" style="width: ' + Math.min((goal.current_value / goal.target_value) * 100, 100) + '%"></div></div>' +
                  '</div></div>' +
                  '<div class="text-right ml-4"><div class="text-sm text-gray-600">' + formatDate(goal.deadline) + '</div></div>' +
                '</div>'
              ).join('')
            ) +
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
      
      function getInboxHTML() {
        return '<div class="mb-8"><h2 class="text-3xl font-bold text-gray-900">Inbox</h2><p class="text-gray-600 mt-1">Mensajes entre validadores y startups</p></div>' +
        '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">' +
          '<div class="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4">' +
            '<div class="mb-4"><input type="text" placeholder="Buscar conversaciones..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/></div>' +
            '<div class="space-y-2">' +
              '<div class="p-4 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition"><div class="flex items-center mb-2">' +
                '<img src="https://ui-avatars.com/api/?name=Beta+Validator&background=6366f1&color=fff" class="w-10 h-10 rounded-full mr-3"/>' +
                '<div class="flex-1"><div class="font-semibold text-gray-900">Beta Validator Team</div><div class="text-xs text-gray-600">hace 5 min</div></div>' +
                '<span class="bg-primary text-white text-xs px-2 py-1 rounded-full">2</span>' +
              '</div><p class="text-sm text-gray-700">¿Cuándo podemos agendar la sesión de validación?</p></div>' +
              '<div class="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"><div class="flex items-center mb-2">' +
                '<img src="https://ui-avatars.com/api/?name=Startup+Tech&background=8b5cf6&color=fff" class="w-10 h-10 rounded-full mr-3"/>' +
                '<div class="flex-1"><div class="font-semibold text-gray-900">Startup Tech Co.</div><div class="text-xs text-gray-600">hace 2 horas</div></div>' +
              '</div><p class="text-sm text-gray-600">Gracias por tu feedback detallado...</p></div>' +
              '<div class="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"><div class="flex items-center mb-2">' +
                '<img src="https://ui-avatars.com/api/?name=AI+Product&background=10b981&color=fff" class="w-10 h-10 rounded-full mr-3"/>' +
                '<div class="flex-1"><div class="font-semibold text-gray-900">AI Product Labs</div><div class="text-xs text-gray-600">ayer</div></div>' +
              '</div><p class="text-sm text-gray-600">Hemos implementado las sugerencias...</p></div>' +
            '</div>' +
          '</div>' +
          '<div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">' +
            '<div class="border-b pb-4 mb-4"><div class="flex items-center">' +
              '<img src="https://ui-avatars.com/api/?name=Beta+Validator&background=6366f1&color=fff" class="w-12 h-12 rounded-full mr-4"/>' +
              '<div><div class="font-bold text-gray-900 text-lg">Beta Validator Team</div><div class="text-sm text-green-600"><i class="fas fa-circle text-xs mr-1"></i>En línea</div></div>' +
            '</div></div>' +
            '<div class="h-96 overflow-y-auto mb-4 space-y-4">' +
              '<div class="flex"><div class="bg-gray-100 rounded-lg p-3 max-w-[70%]"><p class="text-sm text-gray-900">Hola! Vi tu producto en el marketplace y me interesa validarlo.</p><span class="text-xs text-gray-500 mt-1 block">10:30 AM</span></div></div>' +
              '<div class="flex justify-end"><div class="bg-primary text-white rounded-lg p-3 max-w-[70%]"><p class="text-sm">¡Excelente! ¿Qué aspectos te gustaría validar específicamente?</p><span class="text-xs text-white/80 mt-1 block">10:32 AM</span></div></div>' +
              '<div class="flex"><div class="bg-gray-100 rounded-lg p-3 max-w-[70%]"><p class="text-sm text-gray-900">Me gustaría enfocarme en UX/UI y el flujo de onboarding.</p><span class="text-xs text-gray-500 mt-1 block">10:35 AM</span></div></div>' +
              '<div class="flex justify-end"><div class="bg-primary text-white rounded-lg p-3 max-w-[70%]"><p class="text-sm">Perfecto. ¿Cuándo podemos agendar la sesión?</p><span class="text-xs text-white/80 mt-1 block">10:36 AM</span></div></div>' +
            '</div>' +
            '<div class="flex items-center gap-2 border-t pt-4">' +
              '<input type="text" placeholder="Escribe tu mensaje..." class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>' +
              '<button class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"><i class="fas fa-paper-plane mr-2"></i>Enviar</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }

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

      // Initialize
      loadGoals();
      loadChatHistory();

      // Handle hash changes
      window.addEventListener('hashchange', () => {
        const view = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
        if (['dashboard', 'traction', 'inbox'].includes(view)) {
          window.switchView(view);
        }
      });
    </script>
</body>
</html>
    `);
  } catch (error) {
    return c.redirect('/api/auth/google');
  }
});

export default app;