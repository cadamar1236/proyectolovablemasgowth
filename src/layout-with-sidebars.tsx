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
              primary: '#FF6154',
              secondary: '#FB651E',
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
        background-color: rgba(255, 97, 84, 0.1);
        transform: translateX(4px);
      }

      .nav-item.active {
        background-color: rgba(255, 97, 84, 0.15);
        border-left: 4px solid #FF6154;
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
    <!-- Layout Container -->
    <div class="flex h-screen overflow-hidden">
        
        <!-- Left Sidebar - Navigation Menu -->
        <aside id="left-sidebar" class="left-sidebar w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col fixed md:static inset-y-0 left-0 z-40">
            <!-- Logo/Brand -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                        <i class="fas fa-rocket text-white text-lg"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-gray-900">ASTAR<span class="text-primary">*</span> Hub</h2>
                    </div>
                </div>
            </div>

            <!-- User Profile Section -->
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        ${userAvatar ? `<img src="${userAvatar}" alt="${userName}" class="w-full h-full object-cover" />` : userName.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-gray-900 truncate">${userName}</p>
                        <button class="text-xs text-gray-500 hover:text-primary flex items-center mt-0.5">
                            <span>Profile</span>
                            <i class="fas fa-chevron-down ml-1 text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Navigation Links -->
            <nav class="flex-1 p-4 overflow-y-auto">
                <a href="/dashboard" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''} flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-home mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Home (HQ)</span>
                </a>

                <a href="#notifications" class="nav-item ${currentPage === 'notifications' ? 'active' : ''} flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-bell mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Notifications</span>
                    <span class="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
                </a>

                <a href="/dashboard#traction" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-chart-line mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Traction</span>
                </a>

                <a href="/dashboard#inbox" class="nav-item ${currentPage === 'inbox' ? 'active' : ''} flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-inbox mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Inbox</span>
                </a>

                <a href="/leaderboard" class="nav-item ${currentPage === 'leaderboard' ? 'active' : ''} flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-trophy mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Leaderboard</span>
                </a>

                <a href="/marketplace" class="nav-item ${currentPage === 'marketplace' ? 'active' : ''} flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-store mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Marketplace</span>
                </a>

                <a href="#trending" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-fire mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Trending Products</span>
                </a>

                <a href="/planner" class="nav-item ${currentPage === 'planner' ? 'active' : ''} flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
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
                            <i class="fas fa-robot text-primary text-lg"></i>
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
                    <button onclick="analyzeCompetition()" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-crosshairs mr-1.5"></i>
                        Competition
                    </button>
                </div>
            </div>

            <!-- Chat Messages -->
            <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
                <div class="text-center text-gray-500 text-sm">
                    <i class="fas fa-robot text-3xl text-gray-300 mb-2"></i>
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
                addMessageToChat('assistant', 'Error al generar ideas de contenido. Por favor intenta de nuevo.');
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
                    <div class="text-center text-gray-500 text-sm">
                        <i class="fas fa-robot text-3xl text-gray-300 mb-2"></i>
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
                        <div class="text-center text-gray-500 text-sm">
                            <i class="fas fa-robot text-3xl text-gray-300 mb-2"></i>
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
