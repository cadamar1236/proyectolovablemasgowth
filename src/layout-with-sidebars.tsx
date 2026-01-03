/**
 * Layout Component with Left Navigation Sidebar and Right Chat Sidebar
 * Used across Dashboard, Marketplace, and other authenticated pages
 */

export interface LayoutProps {
  content: string;
  currentPage: 'dashboard' | 'marketplace' | 'leaderboard' | 'planner' | 'inbox' | 'notifications';
  userName: string;
  userAvatar?: string;
  pageTitle: string;
}

export function createLayoutWithSidebars(props: LayoutProps): string {
  const { content, currentPage, userName, userAvatar, pageTitle } = props;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} - ValidAI Studio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#8B5CF6',
              secondary: '#A78BFA',
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }

      .text-gradient {
        background: linear-gradient(135deg, #FF6154 0%, #FB651E 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* Chat Animation */
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .chat-message {
        animation: slideIn 0.3s ease-out;
      }

      /* Left Sidebar Styles */
      .nav-item {
        transition: all 0.2s ease;
      }

      .nav-item:hover {
        background-color: rgba(139, 92, 246, 0.1);
        transform: translateX(4px);
      }

      .nav-item.active {
        background-color: rgba(139, 92, 246, 0.15);
        border-left: 4px solid #8B5CF6;
        font-weight: 700;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .left-sidebar {
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .left-sidebar.open {
          transform: translateX(0);
        }
      }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Top Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 bg-black bg-opacity-90 backdrop-blur-sm border-b border-gray-800">
        <div class="max-w-full mx-auto px-6 py-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <span class="text-xl font-bold text-white">ASTAR*</span>
                    <span class="text-gray-400 text-xs hidden sm:inline">Hub</span>
                </div>
                
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>🏠</span>
                        <span class="hidden sm:inline">Home</span>
                    </a>
                    <a href="/dashboard" class="text-purple-400 hover:text-purple-300 text-sm flex items-center space-x-1 transition font-semibold">
                        <span>🚀</span>
                        <span class="hidden sm:inline">Hub</span>
                    </a>
                    <a href="/leaderboard" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>🏆</span>
                        <span class="hidden sm:inline">Leaderboard</span>
                    </a>
                    <a href="/marketplace" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>🔥</span>
                        <span class="hidden sm:inline">Trending</span>
                    </a>
                    <button onclick="logout()" class="text-gray-400 hover:text-white text-sm transition">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Layout Container -->
    <div class="flex h-screen overflow-hidden pt-12">
        
        <!-- Left Sidebar - Navigation Menu -->
        <aside id="left-sidebar" class="left-sidebar w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 hidden md:flex flex-col fixed md:static inset-y-0 left-0 z-40">
            <!-- Logo/Brand -->
            <div class="p-6 border-b border-gray-800">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center">
                        <i class="fas fa-rocket text-white text-lg"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-white">ASTAR<span class="text-purple-400">*</span> Hub</h2>
                    </div>
                </div>
            </div>

            <!-- User Profile Section -->
            <div class="p-4 border-b border-gray-800">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold">
                        ${userAvatar ? `<img src="${userAvatar}" alt="${userName}" class="w-full h-full object-cover" />` : userName.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-white truncate">${userName}</p>
                        <button class="text-xs text-gray-400 hover:text-purple-400 flex items-center mt-0.5">
                            <span>Profile</span>
                            <i class="fas fa-chevron-down ml-1 text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Navigation Links -->
            <nav class="flex-1 p-4 overflow-y-auto">
                <a href="#" onclick="switchTab('home'); return false;" class="nav-item sidebar-nav-home flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-home mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Home (HQ)</span>
                </a>

                <a href="#" onclick="switchTab('home'); return false;" class="nav-item flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-bell mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Notifications</span>
                    <span class="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
                </a>

                <a href="#" onclick="switchTab('traction'); return false;" class="nav-item sidebar-nav-traction flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-chart-line mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Traction</span>
                </a>

                <a href="#" onclick="switchTab('inbox'); return false;" class="nav-item sidebar-nav-inbox flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-inbox mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Inbox</span>
                </a>

                <a href="/leaderboard" class="nav-item ${currentPage === 'leaderboard' ? 'active' : ''} flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-trophy mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Leaderboard</span>
                </a>

                <a href="#" onclick="switchTab('marketplace'); return false;" class="nav-item sidebar-nav-marketplace flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-store mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Marketplace</span>
                </a>

                <a href="#" onclick="switchTab('marketplace'); return false;" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-fire mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Trending Products</span>
                </a>

                <a href="#" onclick="switchTab('home'); return false;" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-calendar-alt mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Planner</span>
                </a>
            </nav>

            <!-- Bottom Actions -->
            <div class="p-4 border-t border-gray-200">
                <button onclick="logout()" class="w-full flex items-center justify-center px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    <span class="font-semibold">Logout</span>
                </button>
            </div>
        </aside>

        <!-- Mobile Menu Button -->
        <button id="mobile-menu-btn" class="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg">
            <i class="fas fa-bars text-primary text-xl"></i>
        </button>

        <!-- Mobile Overlay -->
        <div id="mobile-overlay" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 hidden" onclick="toggleLeftSidebar()"></div>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto">
            ${content}
        </main>

        <!-- Right Sidebar - Marketing Agent Chat -->
        <aside id="chat-sidebar" class="bg-white border-l border-gray-200 transition-all duration-300 ease-in-out flex flex-col" style="width: 400px;">
            <!-- Chat Header -->
            <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <span class="text-2xl">⭐</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-white">Marketing Agent</h3>
                            <p class="text-xs text-white/80">Powered by Groq AI</p>
                        </div>
                    </div>
                    <button onclick="toggleChatSidebar()" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
                        <i class="fas fa-chevron-right text-sm"></i>
                    </button>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="p-4 border-b border-gray-100 bg-gray-50">
                <p class="text-xs font-bold text-gray-600 mb-3 uppercase">Quick Actions</p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="startGoalCreation()" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center">
                        <i class="fas fa-plus-circle mr-1.5"></i>
                        Create Goal
                    </button>
                    <button onclick="analyzeGoals()" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-chart-bar mr-1.5"></i>
                        Analyze Goals
                    </button>
                    <button onclick="generateMarketingPlan()" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-lightbulb mr-1.5"></i>
                        Marketing Plan
                    </button>
                    <button onclick="generateContentIdeas()" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-pencil-alt mr-1.5"></i>
                        Content Ideas
                    </button>
                </div>
            </div>

            <!-- Chat Messages -->
            <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
                <div class="text-center text-gray-500 text-sm">
                    <span class="text-3xl mb-2 block">⭐</span>
                    <p class="font-semibold">Start chatting with your Marketing Agent</p>
                    <p class="text-xs mt-1">Ask about marketing strategies, content ideas, or competitor analysis</p>
                </div>
            </div>

            <!-- Loading Indicator -->
            <div id="chat-loading" class="hidden px-4 py-2">
                <div class="flex items-center space-x-2 text-gray-500">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></div>
                        <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                    <span class="text-sm font-medium">Agent thinking...</span>
                </div>
            </div>

            <!-- Chat Input -->
            <div class="p-4 border-t border-gray-200 bg-white">
                <div class="flex items-end space-x-2">
                    <textarea 
                        id="chat-input" 
                        placeholder="Ask about marketing strategies..." 
                        rows="2"
                        class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        onkeydown="handleChatKeydown(event)"
                    ></textarea>
                    <button 
                        onclick="sendChatMessage()" 
                        class="bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-lg hover:shadow-lg transition flex-shrink-0"
                    >
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="mt-2 flex justify-between items-center text-xs text-gray-500">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <button onclick="clearChatHistory()" class="text-red-500 hover:text-red-700 font-semibold">
                        <i class="fas fa-trash-alt mr-1"></i>Clear
                    </button>
                </div>
            </div>
        </aside>
    </div>

    <script>
        // Configure axios to send cookies
        axios.defaults.withCredentials = true;
        
        // Helper to get auth token from cookie or localStorage
        function getAuthToken() {
            const cookieMatch = document.cookie.match(/authToken=([^;]+)/);
            return cookieMatch ? cookieMatch[1] : localStorage.getItem('authToken');
        }
        
        // Add auth token to all axios requests
        axios.interceptors.request.use(config => {
            const token = getAuthToken();
            if (token) {
                config.headers.Authorization = \`Bearer \${token}\`;
            }
            return config;
        }, error => Promise.reject(error));

        // Update sidebar active state when tab changes
        function updateSidebarActiveState(tab) {
            // Remove active from all sidebar nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            // Add active to the corresponding sidebar item
            const sidebarItem = document.querySelector('.sidebar-nav-' + tab);
            if (sidebarItem) {
                sidebarItem.classList.add('active');
            }
        }
        
        // Override switchTab to also update sidebar
        const originalSwitchTab = window.switchTab;
        window.switchTab = function(tab) {
            if (typeof originalSwitchTab === 'function') {
                originalSwitchTab(tab);
            }
            updateSidebarActiveState(tab);
        };

        // Chat Sidebar Toggle
        let chatSidebarOpen = true;

        function toggleChatSidebar() {
            const sidebar = document.getElementById('chat-sidebar');
            chatSidebarOpen = !chatSidebarOpen;
            
            if (chatSidebarOpen) {
                sidebar.style.width = '400px';
                sidebar.querySelector('.fa-chevron-right')?.classList.replace('fa-chevron-left', 'fa-chevron-right');
            } else {
                sidebar.style.width = '60px';
                sidebar.querySelector('.fa-chevron-right')?.classList.replace('fa-chevron-right', 'fa-chevron-left');
            }
        }

        // Left Sidebar Toggle (Mobile)
        function toggleLeftSidebar() {
            const sidebar = document.getElementById('left-sidebar');
            const overlay = document.getElementById('mobile-overlay');
            
            sidebar.classList.toggle('open');
            overlay.classList.toggle('hidden');
        }

        // Mobile menu button
        document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleLeftSidebar);

        // Chat Functions
        async function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;

            // Add user message to chat
            addMessageToChat('user', message);
            input.value = '';
            
            // Show loading
            document.getElementById('chat-loading').classList.remove('hidden');

            try {
                const response = await axios.post('/api/chat-agent/message', {
                    message: message
                }, {
                    withCredentials: true
                });

                // Hide loading
                document.getElementById('chat-loading').classList.add('hidden');

                // Add assistant response
                if (response.data && response.data.message) {
                    addMessageToChat('assistant', response.data.message);
                } else {
                    addMessageToChat('assistant', 'Recibí tu mensaje pero no pude generar una respuesta.');
                }
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Chat error:', error);
                
                // More detailed error message
                let errorMessage = 'Lo siento, hubo un error. Por favor intenta de nuevo.';
                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = 'Tu sesión ha expirado. Por favor recarga la página.';
                    } else if (error.response.data && error.response.data.error) {
                        errorMessage = 'Error: ' + error.response.data.error;
                    }
                }
                addMessageToChat('assistant', errorMessage);
            }
        }

        function addMessageToChat(role, content) {
            const messagesContainer = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`chat-message flex \${role === 'user' ? 'justify-end' : 'justify-start'}\`;
            
            const bubbleClass = role === 'user' 
                ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                : 'bg-gray-100 text-gray-800';
            
            messageDiv.innerHTML = \`
                <div class="\${bubbleClass} rounded-lg px-4 py-2 max-w-[85%] shadow-sm">
                    <p class="text-sm whitespace-pre-wrap">\${content}</p>
                </div>
            \`;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function handleChatKeydown(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendChatMessage();
            }
        }

        async function analyzeGoals() {
            addMessageToChat('user', 'Analiza mis objetivos y dame recomendaciones de marketing');
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const response = await axios.post('/api/chat-agent/analyze-goals', {}, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                addMessageToChat('assistant', response.data.analysis || 'Análisis completado.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error analyzing goals:', error);
                addMessageToChat('assistant', 'Error al analizar objetivos. Por favor intenta de nuevo.');
            }
        }

        async function generateMarketingPlan() {
            addMessageToChat('user', 'Genera un plan de marketing para los próximos 30 días');
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const response = await axios.post('/api/chat-agent/marketing-plan', {
                    timeframe: '30 días'
                }, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                addMessageToChat('assistant', response.data.plan || 'Plan generado.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error generating plan:', error);
                addMessageToChat('assistant', 'Error al generar plan de marketing. Por favor intenta de nuevo.');
            }
        }

        async function generateContentIdeas() {
            addMessageToChat('user', 'Dame 10 ideas de contenido para redes sociales');
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const response = await axios.post('/api/chat-agent/content-ideas', {
                    platform: 'redes sociales',
                    quantity: 10
                }, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                addMessageToChat('assistant', response.data.ideas || 'Ideas generadas.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error generating content ideas:', error);
                addMessageToChat('assistant', 'Error al analizar competencia. Por favor intenta de nuevo.');
            }
        }

        // Goal Creation Flow
        let goalCreationFlow = {
            active: false,
            step: 0,
            data: {}
        };

        const goalQuestions = [
            { field: 'category', question: '¿En qué categoría está este goal? (ASTAR / MAGCIENT / OTHER)', options: ['ASTAR', 'MAGCIENT', 'OTHER'] },
            { field: 'description', question: '¿Cuál es la descripción del goal?', type: 'text' },
            { field: 'task', question: '¿Cuál es la tarea específica?', type: 'text' },
            { field: 'priority', question: '¿Qué prioridad tiene?\\n- P0: Urgent & important\\n- P1: Urgent or important\\n- P2: Urgent but not important\\n- P3: Neither but cool', options: ['P0', 'P1', 'P2', 'P3'] },
            { field: 'cadence', question: '¿Es una tarea única o recurrente? (One time / Recurrent)', options: ['One time', 'Recurrent'] },
            { field: 'dri', question: '¿Quién es el responsable directo (DRI)?', type: 'text' },
            { field: 'goal_status', question: '¿Cuál es el estado actual?\\n- To start\\n- WIP\\n- On Hold\\n- Delayed\\n- Blocked\\n- Done', options: ['To start', 'WIP', 'On Hold', 'Delayed', 'Blocked', 'Done'] },
            { field: 'week_of', question: '¿Para qué semana es este goal? (ej: "December 30")', type: 'text', optional: true }
        ];

        function startGoalCreation() {
            goalCreationFlow.active = true;
            goalCreationFlow.step = 0;
            goalCreationFlow.data = {};
            
            addMessageToChat('assistant', '✨ ¡Perfecto! Voy a ayudarte a crear un nuevo goal. Te haré algunas preguntas para completar toda la información necesaria.\\n\\n' + goalQuestions[0].question);
            
            if (goalQuestions[0].options) {
                showQuickReplyOptions(goalQuestions[0].options);
            }
        }

        function showQuickReplyOptions(options) {
            const messagesContainer = document.getElementById('chat-messages');
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quick-reply-options flex flex-wrap gap-2 mb-4';
            optionsDiv.id = 'quick-reply-buttons';
            
            options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition';
                btn.textContent = option;
                btn.onclick = () => handleQuickReply(option);
                optionsDiv.appendChild(btn);
            });
            
            messagesContainer.appendChild(optionsDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function removeQuickReplyOptions() {
            const buttons = document.getElementById('quick-reply-buttons');
            if (buttons) buttons.remove();
        }

        async function handleQuickReply(value) {
            if (!goalCreationFlow.active) return;
            
            removeQuickReplyOptions();
            addMessageToChat('user', value);
            
            const currentQuestion = goalQuestions[goalCreationFlow.step];
            goalCreationFlow.data[currentQuestion.field] = value;
            
            goalCreationFlow.step++;
            
            if (goalCreationFlow.step < goalQuestions.length) {
                const nextQuestion = goalQuestions[goalCreationFlow.step];
                addMessageToChat('assistant', nextQuestion.question);
                
                if (nextQuestion.options) {
                    showQuickReplyOptions(nextQuestion.options);
                }
            } else {
                await completeGoalCreation();
            }
        }

        // Modify sendChatMessage to handle goal creation flow
        const originalSendChatMessage = sendChatMessage;
        sendChatMessage = async function() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;

            if (goalCreationFlow.active) {
                removeQuickReplyOptions();
                addMessageToChat('user', message);
                input.value = '';
                
                const currentQuestion = goalQuestions[goalCreationFlow.step];
                goalCreationFlow.data[currentQuestion.field] = message;
                
                goalCreationFlow.step++;
                
                if (goalCreationFlow.step < goalQuestions.length) {
                    const nextQuestion = goalQuestions[goalCreationFlow.step];
                    addMessageToChat('assistant', nextQuestion.question);
                    
                    if (nextQuestion.options) {
                        showQuickReplyOptions(nextQuestion.options);
                    }
                } else {
                    await completeGoalCreation();
                }
                return;
            }

            // Original behavior for normal chat
            await originalSendChatMessage();
        };

        async function completeGoalCreation() {
            goalCreationFlow.active = false;
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const priorityLabels = {
                    'P0': 'Urgent & important',
                    'P1': 'Urgent or important',
                    'P2': 'Urgent but not important',
                    'P3': 'Neither but cool'
                };
                
                const goalData = {
                    ...goalCreationFlow.data,
                    priority_label: priorityLabels[goalCreationFlow.data.priority]
                };
                
                const response = await axios.post('/api/marketing-ai/create-goal', goalData, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                
                if (response.data.success) {
                    addMessageToChat('assistant', \`✅ ¡Goal creado exitosamente!\\n\\n📋 **\${goalData.task}**\\n🏷️ Categoría: \${goalData.category}\\n⚡ Prioridad: \${goalData.priority}\\n👤 Responsable: \${goalData.dri}\\n📊 Estado: \${goalData.goal_status}\\n\\n¡El goal ya está disponible en tu Founder Hub!\`);
                    
                    // Refresh the page to show new goal
                    setTimeout(() => {
                        if (typeof loadDashboardData === 'function') {
                            loadDashboardData();
                        } else {
                            window.location.reload();
                        }
                    }, 2000);
                } else {
                    addMessageToChat('assistant', '❌ Hubo un error al crear el goal. Por favor intenta de nuevo.');
                }
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error creating goal:', error);
                addMessageToChat('assistant', '❌ Error al crear el goal. Por favor intenta de nuevo o usa el botón "New Goal" en el Hub.');
            }
        }

        async function analyzeCompetition() {
            addMessageToChat('user', 'Analiza la competencia en mi industria');
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const response = await axios.post('/api/chat-agent/competition-analysis', {
                    competitors: [],
                    industry: ''
                }, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                addMessageToChat('assistant', response.data.analysis || 'Análisis completado.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error analyzing competition:', error);
                addMessageToChat('assistant', 'Error al analizar competencia. Por favor intenta de nuevo.');
            }
        }

        async function clearChatHistory() {
            if (!confirm('¿Estás seguro de que quieres limpiar el historial del chat?')) return;
            
            try {
                await axios.delete('/api/chat-agent/history', {
                    withCredentials: true
                });
                
                document.getElementById('chat-messages').innerHTML = \`
                    <div class="text-center text-gray-500 text-sm py-8">
                        <span class="text-3xl mb-2 block">⭐</span>
                        <p class="font-semibold">Start chatting with your Marketing Agent</p>
                        <p class="text-xs mt-1">Ask about marketing strategies, content ideas, or competitor analysis</p>
                    </div>
                \`;
            } catch (error) {
                console.error('Error clearing chat:', error);
                alert('Error al limpiar el historial del chat.');
            }
        }

        function getCookie(name) {
            const value = \`; \${document.cookie}\`;
            const parts = value.split(\`; \${name}=\`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        }

        function logout() {
            document.cookie = 'authToken=; Max-Age=0; path=/;';
            window.location.href = '/';
        }

        // Load chat history on page load
        window.addEventListener('load', async function() {
            try {
                const response = await axios.get('/api/chat-agent/history', {
                    withCredentials: true
                });
                
                if (response.data.messages && response.data.messages.length > 0) {
                    const messagesContainer = document.getElementById('chat-messages');
                    messagesContainer.innerHTML = '';
                    
                    // Messages are already in correct order from API
                    response.data.messages.forEach(msg => {
                        addMessageToChat(msg.role, msg.content);
                    });
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
                // Show default message on error
                const messagesContainer = document.getElementById('chat-messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = \`
                        <div class="text-center text-gray-500 text-sm py-8">
                            <span class="text-3xl mb-2 block">⭐</span>
                            <p class="font-semibold">Start chatting with your Marketing Agent</p>
                            <p class="text-xs mt-1">Ask about marketing strategies, content ideas, or competitor analysis</p>
                        </div>
                    \`;
                }
            }
        });
    </script>
</body>
</html>
  `;
}
