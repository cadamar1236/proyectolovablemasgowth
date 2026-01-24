/**
 * Layout Component with Left Navigation Sidebar and Right Chat Sidebar
 * Used across Dashboard, Directory, and other authenticated pages
 */

export interface LayoutProps {
  content: string;
  currentPage: 'dashboard' | 'directory' | 'leaderboard' | 'planner' | 'inbox' | 'aicmo' | 'notifications' | 'competitions' | 'team';
  userName: string;
  userAvatar?: string;
  pageTitle: string;
  userRole?: string;
}

export function createLayoutWithSidebars(props: LayoutProps): string {
  const { content, currentPage, userName, userAvatar, pageTitle, userRole } = props;

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
      // Chat bootstrap: ensure handlers exist even if later scripts fail.
      (function() {
        console.log('[Chat Bootstrap] Initializing...');
        
        function safeGet(id) {
          return document.getElementById(id);
        }
        
        // Define toggleChatSidebar IMMEDIATELY in bootstrap
        window.toggleChatSidebar = function() {
            console.log('[CHAT-TOGGLE-BOOTSTRAP] Function called from bootstrap');
            var sidebar = safeGet('chat-sidebar');
            var floatingBtn = safeGet('chat-floating-btn');
            var chatOverlay = safeGet('chat-overlay');
            var isMobile = window.innerWidth <= 768;
            
            console.log('[CHAT-TOGGLE-BOOTSTRAP] Elements found:', {
                sidebar: !!sidebar,
                floatingBtn: !!floatingBtn,
                chatOverlay: !!chatOverlay,
                isMobile: isMobile
            });
            
            if (!sidebar) {
                console.error('[CHAT-TOGGLE-BOOTSTRAP] Sidebar not found!');
                return;
            }
            
            // Toggle state
            var isCurrentlyOpen = sidebar.style.display !== 'none' && sidebar.style.width !== '0px';
            console.log('[CHAT-TOGGLE-BOOTSTRAP] Current state:', isCurrentlyOpen ? 'OPEN' : 'CLOSED');
            
            if (isCurrentlyOpen) {
                // Close sidebar
                sidebar.style.width = '0px';
                sidebar.style.display = 'none';
                if (floatingBtn) floatingBtn.style.display = 'flex';
                if (chatOverlay) chatOverlay.classList.add('hidden');
                console.log('[CHAT-TOGGLE-BOOTSTRAP] Closed sidebar');
            } else {
                // Open sidebar
                sidebar.style.width = isMobile ? '100%' : '400px';
                sidebar.style.maxWidth = '400px';
                sidebar.style.display = 'flex';
                if (floatingBtn) floatingBtn.style.display = 'none';
                if (isMobile && chatOverlay) chatOverlay.classList.remove('hidden');
                console.log('[CHAT-TOGGLE-BOOTSTRAP] Opened sidebar');
            }
        };
        
        console.log('[Chat Bootstrap] toggleChatSidebar defined');

        function bootstrapAddMessageToChat(role, content) {
          var messagesContainer = safeGet('chat-messages');
          if (!messagesContainer) return;

          var messageDiv = document.createElement('div');
          messageDiv.className = 'chat-message flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

          var bubbleClass = role === 'user'
            ? 'bg-gradient-to-r from-primary to-secondary text-white'
            : 'bg-gray-100 text-gray-800';

          messageDiv.innerHTML =
            '<div class="' + bubbleClass + ' rounded-lg px-4 py-2 max-w-[85%] shadow-sm">' +
              '<p class="text-sm whitespace-pre-wrap"></p>' +
            '</div>';

          var p = messageDiv.querySelector('p');
          if (p) p.textContent = String(content || '');

          messagesContainer.appendChild(messageDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Goal questions for bootstrap flow handling
        var bootstrapGoalQuestions = [
            { field: 'category', question: 'What category does this goal belong to?', options: ['ASTAR', 'MAGCIENT', 'OTHER'] },
            { field: 'description', question: 'Describe the goal briefly (What do you want to achieve?)', type: 'text' },
            { field: 'task', question: 'What is the specific task to achieve this goal? (Optional - press Enter to skip)', type: 'text', optional: true },
            { field: 'priority', question: 'What priority does this goal have?', options: ['P0', 'P1', 'P2', 'P3'] },
            { field: 'cadence', question: 'Is this a one-time or recurring goal?', options: ['One time', 'Recurrent'] },
            { field: 'dri', question: 'Who is the Directly Responsible Individual (DRI)? (Optional - press Enter to skip)', type: 'text', optional: true },
            { field: 'goal_status', question: 'What is the current status of this goal?', options: ['To start', 'WIP', 'On Hold', 'Delayed', 'Blocked', 'Done'] },
            { field: 'week_of', question: 'For which week is this goal? (Optional - Example: "January 6")', type: 'text', optional: true }
        ];

        // Initialize goalCreationFlow immediately in bootstrap
        (function initGoalFlow() {
          try {
            var savedFlow = localStorage.getItem('goalCreationFlow');
            if (savedFlow) {
              window.goalCreationFlow = JSON.parse(savedFlow);
              console.log('[BOOTSTRAP] Restored flow from localStorage:', window.goalCreationFlow);
            } else {
              window.goalCreationFlow = { active: false, step: 0, data: {}, editingGoalId: null };
              console.log('[BOOTSTRAP] Initialized new goalCreationFlow');
            }
          } catch(e) {
            window.goalCreationFlow = { active: false, step: 0, data: {}, editingGoalId: null };
            console.log('[BOOTSTRAP] Error parsing localStorage, initialized fresh flow');
          }
        })();

        // Helper to get auth token from cookie or localStorage
        function bootstrapGetAuthToken() {
          var cookieMatch = document.cookie.match(/authToken=([^;]+)/);
          return cookieMatch ? cookieMatch[1] : localStorage.getItem('authToken');
        }

        function bootstrapShowQuickOptions(options) {
          var messagesContainer = safeGet('chat-messages');
          if (!messagesContainer) return;
          
          // Remove existing options first
          var existing = document.getElementById('quick-reply-buttons');
          if (existing) existing.remove();
          
          var optionsDiv = document.createElement('div');
          optionsDiv.className = 'quick-reply-options flex flex-wrap gap-2 mb-4';
          optionsDiv.id = 'quick-reply-buttons';
          
          options.forEach(function(option) {
            var btn = document.createElement('button');
            btn.className = 'px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition';
            btn.textContent = option;
            btn.onclick = function() { bootstrapHandleFlowAnswer(option); };
            optionsDiv.appendChild(btn);
          });
          
          messagesContainer.appendChild(optionsDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function bootstrapSaveFlowState() {
          if (window.goalCreationFlow) {
            try {
              localStorage.setItem('goalCreationFlow', JSON.stringify(window.goalCreationFlow));
              console.log('[BOOTSTRAP] Flow state saved:', JSON.stringify(window.goalCreationFlow));
            } catch(e) {
              console.error('[BOOTSTRAP] Error saving flow state:', e);
            }
          }
        }

        function bootstrapHandleFlowAnswer(answer) {
          // Ensure goalCreationFlow exists
          if (!window.goalCreationFlow) {
            window.goalCreationFlow = { active: true, step: 0, data: {}, editingGoalId: null };
          }
          
          console.log('[BOOTSTRAP] handleFlowAnswer:', answer, 'step:', window.goalCreationFlow.step);
          
          // Remove quick reply buttons
          var buttons = document.getElementById('quick-reply-buttons');
          if (buttons) buttons.remove();
          
          // Show user's answer
          bootstrapAddMessageToChat('user', answer);
          
          // Get current question and save answer
          var currentStep = window.goalCreationFlow.step;
          var currentQuestion = bootstrapGoalQuestions[currentStep];
          
          if (currentQuestion) {
            window.goalCreationFlow.data[currentQuestion.field] = answer;
          }
          
          // Move to next step
          window.goalCreationFlow.step++;
          bootstrapSaveFlowState();
          
          // Check if more questions
          if (window.goalCreationFlow.step < bootstrapGoalQuestions.length) {
            var nextQuestion = bootstrapGoalQuestions[window.goalCreationFlow.step];
            bootstrapAddMessageToChat('assistant', nextQuestion.question);
            
            if (nextQuestion.options) {
              bootstrapShowQuickOptions(nextQuestion.options);
            }
          } else {
            // All questions answered - submit goal
            bootstrapCompleteGoalCreation();
          }
        }

        function bootstrapCompleteGoalCreation() {
          console.log('[BOOTSTRAP] Completing goal creation with data:', JSON.stringify(window.goalCreationFlow.data));
          
          bootstrapAddMessageToChat('assistant', 'Creating your goal...');
          
          var goalData = window.goalCreationFlow.data;
          var authToken = bootstrapGetAuthToken();
          
          var headers = { 'Content-Type': 'application/json' };
          if (authToken) {
            headers['Authorization'] = 'Bearer ' + authToken;
          }
          
          fetch('/api/dashboard/goals', {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify({
              category: goalData.category || 'OTHER',
              description: goalData.description || '',
              task: goalData.task || '',
              priority: goalData.priority || 'P2',
              cadence: goalData.cadence || 'One time',
              dri: goalData.dri || '',
              goal_status: goalData.goal_status || 'To start',
              week_of: goalData.week_of || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
            })
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            // Clear flow state
            window.goalCreationFlow.active = false;
            window.goalCreationFlow.step = 0;
            window.goalCreationFlow.data = {};
            localStorage.removeItem('goalCreationFlow');
            
            if (data.goal || data.success) {
              bootstrapAddMessageToChat('assistant', 'SUCCESS! Goal created successfully! -- ' + goalData.description + ' -- Category: ' + goalData.category + ' -- Priority: ' + goalData.priority);
            } else {
              bootstrapAddMessageToChat('assistant', 'ERROR: Error creating goal: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(function(e) {
            window.goalCreationFlow.active = false;
            window.goalCreationFlow.step = 0;
            window.goalCreationFlow.data = {};
            localStorage.removeItem('goalCreationFlow');
            bootstrapAddMessageToChat('assistant', 'ERROR: Error creating goal. Please try again.');
          });
        }

        function bootstrapSendChatMessage() {
          var input = safeGet('chat-input');
          if (!input) return;
          var message = input.value ? String(input.value).trim() : '';
          if (!message) return;

          // ========== CHECK IF FLOW IS ACTIVE - PROCESS LOCALLY ==========
          if (window.goalCreationFlow && window.goalCreationFlow.active) {
            console.log('[BOOTSTRAP] Flow is active, processing answer locally');
            input.value = '';
            bootstrapHandleFlowAnswer(message);
            return;
          }
          // ========== END FLOW CHECK ==========

          // ========== GOAL KEYWORD DETECTION IN BOOTSTRAP ==========
          var goalKeywords = [
            'crear goal', 'create goal', 'nuevo goal', 'new goal', 'anadir goal',
            'crear objetivo', 'nuevo objetivo', 'anadir objetivo', 'agregar objetivo',
            'quiero crear', 'necesito crear', 'me gustaria crear',
            'agregar goal', 'hacer un goal', 'hacer un objetivo', 'crea un goal',
            'registrar goal', 'definir objetivo', 'establecer goal', 'poner un objetivo'
          ];
          var msgLower = message.toLowerCase();
          var hasGoalKeyword = goalKeywords.some(function(kw) { return msgLower.indexOf(kw) !== -1; });
          
          // Check if goalCreationFlow exists and start flow directly
          if (hasGoalKeyword && window.goalCreationFlow && !window.goalCreationFlow.active) {
            console.log('[BOOTSTRAP] Goal keyword detected! Starting flow...');
            bootstrapAddMessageToChat('user', message);
            input.value = '';
            // Use real function if available, otherwise bootstrap version
            if (typeof window.startGoalCreation === 'function' && window.startGoalCreation !== bootstrapStartGoalCreation) {
              window.startGoalCreation();
            } else {
              bootstrapStartGoalCreation();
            }
            return;
          }
          // ========== END GOAL KEYWORD DETECTION ==========

          bootstrapAddMessageToChat('user', message);
          input.value = '';

          var loading = safeGet('chat-loading');
          if (loading) loading.classList.remove('hidden');

          fetch('/api/chat-agent/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ message: message })
          })
          .then(function(res) {
            return res.json().then(function(data) {
              if (loading) loading.classList.add('hidden');
              if (res.ok && data) {
                // Check for goal flow trigger from backend - but only if flow not already active
                if (data.triggerGoalFlow === true && window.goalCreationFlow && !window.goalCreationFlow.active) {
                  console.log('[BOOTSTRAP] Backend triggered goal flow!');
                  if (typeof window.startGoalCreation === 'function' && window.startGoalCreation !== bootstrapStartGoalCreation) {
                    window.startGoalCreation();
                  } else {
                    bootstrapStartGoalCreation();
                  }
                  return; // Don't show the message
                }
                if (data.message) {
                  bootstrapAddMessageToChat('assistant', data.message);
                }
              } else {
                bootstrapAddMessageToChat('assistant', 'Sorry, there was an error. Please try again.');
              }
            });
          })
          .catch(function(e) {
            if (loading) loading.classList.add('hidden');
            bootstrapAddMessageToChat('assistant', 'Sorry, there was an error. Please try again.');
          });
        }

        function bootstrapHandleChatKeydown(event) {
          if (event && event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            bootstrapSendChatMessage();
          }
        }

        function bootstrapLogout() {
          document.cookie = 'authToken=; Max-Age=0; path=/;';
          window.location.href = '/';
        }

        function bootstrapToggleLeftSidebar() {
          var sidebar = document.querySelector('.left-sidebar');
          var overlay = safeGet('mobile-overlay');
          if (sidebar) sidebar.classList.toggle('open');
          if (overlay) overlay.classList.toggle('hidden');
        }

        function bootstrapToggleChatSidebar() {
          var sidebar = safeGet('chat-sidebar');
          if (sidebar) sidebar.classList.toggle('translate-x-full');
        }

        function bootstrapStartGoalCreation() {
          console.log('[Bootstrap] startGoalCreation called');
          
          // Check if goalCreationFlow exists and use the real implementation
          if (window.goalCreationFlow) {
            // Mark flow as active to prevent loops
            if (window.goalCreationFlow.active) {
              console.log('[Bootstrap] Flow already active, skipping');
              return;
            }
            window.goalCreationFlow.active = true;
            window.goalCreationFlow.step = 0;
            window.goalCreationFlow.data = {};
            bootstrapSaveFlowState();
          }
          
          // Show the first question directly with quick reply buttons
          bootstrapAddMessageToChat('assistant', 'Perfect! I will help you create a new goal. I will ask you 8 quick questions. --- What category does this goal belong to?');
          bootstrapShowQuickOptions(['ASTAR', 'MAGCIENT', 'OTHER']);
        }

        function bootstrapAnalyzeGoals() {
          console.log('[Bootstrap] analyzeGoals called');
          var input = safeGet('chat-input');
          if (input) {
            input.value = 'Analyze my current goals';
            bootstrapSendChatMessage();
          }
        }

        function bootstrapGenerateMarketingPlan() {
          console.log('[Bootstrap] generateMarketingPlan called');
          var input = safeGet('chat-input');
          if (input) {
            input.value = 'Generate a marketing plan for my product';
            bootstrapSendChatMessage();
          }
        }

        function bootstrapGenerateContentIdeas() {
          console.log('[Bootstrap] generateContentIdeas called');
          var input = safeGet('chat-input');
          if (input) {
            input.value = 'Give me content ideas for my social media';
            bootstrapSendChatMessage();
          }
        }

        function bootstrapUpdateUsers() {
          console.log('[Bootstrap] updateUsers called');
          var input = safeGet('chat-input');
          if (input) {
            var newValue = prompt('How many users do you currently have?');
            if (newValue) {
              input.value = 'Update users to ' + newValue;
              bootstrapSendChatMessage();
            }
          }
        }

        function bootstrapUpdateRevenue() {
          console.log('[Bootstrap] updateRevenue called');
          var input = safeGet('chat-input');
          if (input) {
            var newValue = prompt('What is your current revenue? (in dollars)');
            if (newValue) {
              input.value = 'Update revenue to $' + newValue;
              bootstrapSendChatMessage();
            }
          }
        }

        function bootstrapClearChatHistory() {
          var messagesContainer = safeGet('chat-messages');
          if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="text-center text-gray-500 text-sm"><span class="text-3xl mb-2 block">🌟</span><p class="font-semibold">Start chatting with your ASTAR Agent</p><p class="text-xs mt-1">Ask about your goals, metrics, or growth strategies</p></div>';
          }
        }

        function bootstrapSwitchTab(tab) {
          console.log('[Bootstrap] switchTab:', tab);
        }

        // Set global functions
        window.addMessageToChat = bootstrapAddMessageToChat;
        window.sendChatMessage = bootstrapSendChatMessage;
        window.handleChatKeydown = bootstrapHandleChatKeydown;
        window.logout = bootstrapLogout;
        window.toggleLeftSidebar = bootstrapToggleLeftSidebar;
        window.toggleChatSidebar = bootstrapToggleChatSidebar;
        window.startGoalCreation = bootstrapStartGoalCreation;
        window.analyzeGoals = bootstrapAnalyzeGoals;
        window.generateMarketingPlan = bootstrapGenerateMarketingPlan;
        window.generateContentIdeas = bootstrapGenerateContentIdeas;
        window.updateUsers = bootstrapUpdateUsers;
        window.updateRevenue = bootstrapUpdateRevenue;
        window.clearChatHistory = bootstrapClearChatHistory;
        window.switchTab = bootstrapSwitchTab;
        
        console.log('[Chat Bootstrap] All functions assigned:', {
          sendChatMessage: typeof window.sendChatMessage,
          handleChatKeydown: typeof window.handleChatKeydown,
          logout: typeof window.logout,
          startGoalCreation: typeof window.startGoalCreation,
          analyzeGoals: typeof window.analyzeGoals,
          generateMarketingPlan: typeof window.generateMarketingPlan,
          generateContentIdeas: typeof window.generateContentIdeas
        });
      })();
    </script>
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
          display: flex !important; /* Always render, just hide with transform */
        }

        .left-sidebar.open {
          transform: translateX(0);
        }
        
        /* Ensure content doesn't overflow on mobile */
        .main-content {
          width: 100%;
          margin-left: 0;
        }
        
        /* Chat sidebar as overlay on mobile */
        #chat-sidebar {
          position: fixed !important;
          right: 0;
          top: 48px;
          bottom: 0;
          z-index: 60;
          width: 100% !important;
          max-width: 400px;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
        }
        
        /* Floating button positioning for mobile */
        #chat-floating-btn {
          bottom: 80px !important;
          right: 16px !important;
          z-index: 45 !important;
        }
        
        #mobile-menu-btn {
          bottom: 16px !important;
          right: 16px !important;
          z-index: 45 !important;
        }
        
        #chat-overlay {
          z-index: 55 !important;
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
                        <span class="hidden md:inline">Home</span>
                    </a>
                    <a href="/dashboard" class="text-purple-400 hover:text-purple-300 text-sm flex items-center space-x-1 transition font-semibold">
                        <span>🚀</span>
                        <span class="hidden md:inline">Hub</span>
                    </a>
                    <a href="/competitions" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>🏅</span>
                        <span class="hidden md:inline">Competitions</span>
                    </a>
                    <a href="/leaderboard" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>🏆</span>
                        <span class="hidden md:inline">Leaderboard</span>
                    </a>
                    ${userRole === 'founder' ? `
                    <a href="/team" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>👥</span>
                        <span>Team</span>
                    </a>
                    ` : ''}
                    <a href="/dashboard?tab=directory" class="text-gray-300 hover:text-white text-sm flex items-center space-x-1 transition">
                        <span>🔥</span>
                        <span class="hidden md:inline">Trending</span>
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
        
        <!-- Left Sidebar - Navigation Menu (Hidden) -->
        <aside id="left-sidebar" class="left-sidebar w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 hidden flex-col fixed md:static inset-y-0 left-0 z-40" style="display: none;">
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
                ${userRole === 'founder' ? `
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
                ` : ''}

                <a href="#" onclick="switchTab('inbox'); return false;" class="nav-item sidebar-nav-inbox flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-inbox mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Inbox</span>
                </a>

                <a href="#" onclick="switchTab('aicmo'); return false;" class="nav-item sidebar-nav-aicmo flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-magic mr-3 text-lg w-5"></i>
                    <span class="font-semibold">AI CMO</span>
                </a>

                <a href="/leaderboard" class="nav-item ${currentPage === 'leaderboard' ? 'active' : ''} flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-trophy mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Leaderboard</span>
                </a>

                <a href="/competitions" class="nav-item ${currentPage === 'competitions' ? 'active' : ''} flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-medal mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Competitions</span>
                </a>

                ${userRole === 'founder' ? `
                <a href="/team" class="nav-item ${currentPage === 'team' ? 'active' : ''} flex items-center px-4 py-3 text-gray-300 hover:text-white rounded-lg mb-2">
                    <i class="fas fa-users mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Team</span>
                </a>
                ` : ''}

                ${userRole === 'admin' ? `
                <a href="/admin" class="nav-item flex items-center px-4 py-3 text-yellow-400 hover:text-yellow-300 rounded-lg mb-2 border border-yellow-400">
                    <i class="fas fa-shield-alt mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Admin</span>
                </a>
                ` : ''}

                <a href="#" onclick="switchTab('directory'); return false;" class="nav-item sidebar-nav-directory flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-store mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Directory</span>
                </a>

                <a href="#" onclick="switchTab('directory'); return false;" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-fire mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Trending Products</span>
                </a>

                ${userRole === 'founder' ? `
                <a href="#" onclick="switchTab('home'); return false;" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:text-primary rounded-lg mb-2">
                    <i class="fas fa-calendar-alt mr-3 text-lg w-5"></i>
                    <span class="font-semibold">Planner</span>
                </a>
                ` : ''}
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
        <button id="mobile-menu-btn" class="md:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all">
            <i class="fas fa-bars text-white text-xl"></i>
        </button>

        <!-- Mobile Overlay -->
        <div id="mobile-overlay" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 hidden" onclick="window.toggleLeftSidebar()"></div>
        
        <!-- Chat Overlay for mobile -->
        <div id="chat-overlay" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 hidden" onclick="
            var sidebar = document.getElementById('chat-sidebar');
            var btn = document.getElementById('chat-floating-btn');
            var overlay = document.getElementById('chat-overlay');
            if (sidebar) {
                sidebar.style.width = '0px';
                sidebar.style.display = 'none';
                btn.style.display = 'flex';
                overlay.classList.add('hidden');
            }
        "></div>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto">
            ${content}
        </main>

        <!-- Floating Chat Button (visible when chat is hidden) -->
        ${userRole !== 'guest' ? `
        <button 
            id="chat-floating-btn" 
            onclick="
                console.log('[BTN] Click event fired'); 
                var sidebar = document.getElementById('chat-sidebar');
                var btn = document.getElementById('chat-floating-btn');
                var overlay = document.getElementById('chat-overlay');
                var isMobile = window.innerWidth <= 768;
                console.log('[BTN] Found elements:', {sidebar: !!sidebar, btn: !!btn, overlay: !!overlay});
                if (sidebar) {
                    sidebar.style.width = isMobile ? '100%' : '400px';
                    sidebar.style.maxWidth = '400px';
                    sidebar.style.display = 'flex';
                    btn.style.display = 'none';
                    if (isMobile && overlay) overlay.classList.remove('hidden');
                    console.log('[BTN] Chat opened');
                }
            " 
            class="fixed right-4 bottom-20 md:bottom-4 z-[999] w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-white/30" 
            style="pointer-events: auto; touch-action: manipulation; cursor: pointer;">
            <div class="flex flex-col items-center justify-center">
                <span class="text-xl">*</span>
            </div>
        </button>
        ` : ''}

        <!-- Right Sidebar - ASTAR Agent Chat -->
        ${userRole !== 'guest' ? `
        <aside id="chat-sidebar" class="bg-white border-l border-gray-200 transition-all duration-300 ease-in-out flex flex-col overflow-hidden" style="width: 0px; display: none;">
            <!-- Chat Header -->
            <div id="chat-header" class="p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                            <span class="text-2xl">*</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-white">ASTAR Agent</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="
                            var sidebar = document.getElementById('chat-sidebar');
                            var btn = document.getElementById('chat-floating-btn');
                            var overlay = document.getElementById('chat-overlay');
                            if (sidebar && btn) {
                                sidebar.style.width = '0px';
                                sidebar.style.display = 'none';
                                btn.style.display = 'flex';
                                if (overlay) overlay.classList.add('hidden');
                                console.log('[CHAT] Closed from header button');
                            }
                        " id="chat-toggle-btn" title="Close chat" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div id="quick-actions" class="p-4 border-b border-gray-100 bg-gray-50">
                <p class="text-xs font-bold text-gray-600 mb-3 uppercase">Quick Actions</p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="window.startGoalCreation()" id="btn-create-goal" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center">
                        <i class="fas fa-plus-circle mr-1.5"></i>
                        Create Goal
                    </button>
                    <button onclick="window.updateUsers()" id="btn-update-users" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center">
                        <i class="fas fa-users mr-1.5"></i>
                        Update Users
                    </button>
                    <button onclick="window.updateRevenue()" id="btn-update-revenue" class="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center">
                        <i class="fas fa-dollar-sign mr-1.5"></i>
                        Update Revenue
                    </button>
                    <button onclick="window.analyzeGoals()" id="btn-analyze-goals" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-chart-bar mr-1.5"></i>
                        Analyze Goals
                    </button>
                    <button onclick="window.generateMarketingPlan()" id="btn-marketing-plan" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-lightbulb mr-1.5"></i>
                        Marketing Plan
                    </button>
                    <button onclick="window.generateContentIdeas()" id="btn-content-ideas" class="bg-white border border-gray-200 hover:border-primary hover:shadow-md px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-primary transition flex items-center justify-center">
                        <i class="fas fa-pencil-alt mr-1.5"></i>
                        Content Ideas
                    </button>
                </div>
            </div>

            <!-- Chat Messages -->
            <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
                <div class="text-center text-gray-500 text-sm">
                    <span class="text-3xl mb-2 block">🌟</span>
                    <p class="font-semibold">Start chatting with your ASTAR Agent</p>
                    <p class="text-xs mt-1">Ask about your goals, metrics, or growth strategies</p>
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
            <div id="chat-input-container" class="p-4 border-t border-gray-200 bg-white">
                <div class="flex items-end space-x-2">
                    <textarea 
                        id="chat-input" 
                        placeholder="Ask about marketing strategies..." 
                        rows="2"
                        class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        onkeydown="window.handleChatKeydown(event)"
                    ></textarea>
                    <button 
                        onclick="window.sendChatMessage()" 
                        class="bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-lg hover:shadow-lg transition flex-shrink-0"
                    >
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="mt-2 flex justify-between items-center text-xs text-gray-500">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <button onclick="window.clearChatHistory()" class="text-red-500 hover:text-red-700 font-semibold">
                        <i class="fas fa-trash-alt mr-1"></i>Clear
                    </button>
                </div>
            </div>
        </aside>
        ` : ''}
    </div>

    <script>
        console.log('[SCRIPT START] Loading layout script');
        
        // ============================================
        // DEFINE ALL PLACEHOLDER FUNCTIONS FIRST
        // These prevent "not defined" errors and will be replaced with actual implementations below
        // ============================================
        window.sendChatMessage = window.sendChatMessage || function() { console.log('[PLACEHOLDER] sendChatMessage'); };
        window.handleChatKeydown = window.handleChatKeydown || function() { console.log('[PLACEHOLDER] handleChatKeydown'); };
        window.addMessageToChat = window.addMessageToChat || function() { console.log('[PLACEHOLDER] addMessageToChat'); };
        window.logout = window.logout || function() { console.log('[PLACEHOLDER] logout'); document.cookie = 'authToken=; Max-Age=0; path=/;'; window.location.href = '/'; };
        window.toggleLeftSidebar = window.toggleLeftSidebar || function() { console.log('[PLACEHOLDER] toggleLeftSidebar'); };
        // toggleChatSidebar is already defined in the bootstrap in <head>, don't redefine it here
        console.log('[SCRIPT] toggleChatSidebar already defined:', typeof window.toggleChatSidebar);
        window.startGoalCreation = window.startGoalCreation || function() { console.log('[PLACEHOLDER] startGoalCreation'); };
        window.analyzeGoals = window.analyzeGoals || function() { console.log('[PLACEHOLDER] analyzeGoals'); };
        window.generateMarketingPlan = window.generateMarketingPlan || function() { console.log('[PLACEHOLDER] generateMarketingPlan'); };
        window.generateContentIdeas = window.generateContentIdeas || function() { console.log('[PLACEHOLDER] generateContentIdeas'); };
        window.updateUsers = window.updateUsers || function() { console.log('[PLACEHOLDER] updateUsers'); };
        window.updateRevenue = window.updateRevenue || function() { console.log('[PLACEHOLDER] updateRevenue'); };
        window.clearChatHistory = window.clearChatHistory || function() { console.log('[PLACEHOLDER] clearChatHistory'); };
        window.switchTab = window.switchTab || function(tab) { console.log('[PLACEHOLDER] switchTab:', tab); };
        
        console.log('[INIT] All placeholder functions defined');
        
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
                config.headers.Authorization = 'Bearer ' + token;
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
        let chatSidebarOpen = false; // Start with chat CLOSED by default
        let chatContentVisible = true;
        
        // Initialize chat state on page load
        function initializeChatState() {
            const sidebar = document.getElementById('chat-sidebar');
            const floatingBtn = document.getElementById('chat-floating-btn');
            
            if (sidebar && floatingBtn) {
                // Start with chat closed
                sidebar.style.width = '0px';
                sidebar.style.display = 'none';
                floatingBtn.style.display = 'flex';
                console.log('[INIT] Chat initialized as closed, floating button visible');
            }
        }
        
        // Run initialization when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeChatState);
        } else {
            initializeChatState();
        }

        function toggleChatVisibility() {
            const quickActions = document.getElementById('quick-actions');
            const chatMessages = document.getElementById('chat-messages');
            const chatInput = document.getElementById('chat-input-container');
            const chatLoading = document.getElementById('chat-loading');
            const visibilityBtn = document.getElementById('chat-visibility-btn');
            const icon = visibilityBtn?.querySelector('i');
            
            chatContentVisible = !chatContentVisible;
            
            if (chatContentVisible) {
                quickActions?.classList.remove('hidden');
                chatMessages?.classList.remove('hidden');
                chatInput?.classList.remove('hidden');
                chatLoading?.classList.remove('hidden');
                icon?.classList.replace('fa-eye-slash', 'fa-eye');
                visibilityBtn?.setAttribute('title', 'Hide chat');
            } else {
                quickActions?.classList.add('hidden');
                chatMessages?.classList.add('hidden');
                chatInput?.classList.add('hidden');
                chatLoading?.classList.add('hidden');
                icon?.classList.replace('fa-eye', 'fa-eye-slash');
                visibilityBtn?.setAttribute('title', 'Show chat');
            }
        }

        // toggleChatSidebar is already defined in bootstrap (in <head>), no need to redefine
        // Just keep toggleChatVisibility available
        window.toggleChatVisibility = toggleChatVisibility;

        // Left Sidebar Toggle (Mobile)
        function toggleLeftSidebar() {
            const sidebar = document.getElementById('left-sidebar');
            const overlay = document.getElementById('mobile-overlay');
            
            sidebar.classList.toggle('open');
            overlay.classList.toggle('hidden');
        }

        // Mobile menu button
        document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleLeftSidebar);

        // ========== GOAL CREATION FLOW - DEFINED EARLY ==========
        // Must be defined before sendChatMessage so it's available
        // Try to restore from localStorage in case of page reload
        let savedFlow = null;
        try {
            savedFlow = JSON.parse(localStorage.getItem('goalCreationFlow') || 'null');
        } catch(e) { savedFlow = null; }
        
        let goalCreationFlow = savedFlow || {
            active: false,
            step: 0,
            data: {},
            editingGoalId: null
        };
        
        // Function to save flow state
        function saveFlowState() {
            try {
                localStorage.setItem('goalCreationFlow', JSON.stringify(goalCreationFlow));
            } catch(e) { console.error('[FLOW] Error saving state:', e); }
        }
        
        // Function to clear flow state
        function clearFlowState() {
            goalCreationFlow.active = false;
            goalCreationFlow.step = 0;
            goalCreationFlow.data = {};
            goalCreationFlow.editingGoalId = null;
            try {
                localStorage.removeItem('goalCreationFlow');
            } catch(e) {}
        }
        
        // Make it global so all functions can access it
        window.goalCreationFlow = goalCreationFlow;
        window.saveFlowState = saveFlowState;
        window.clearFlowState = clearFlowState;
        
        // If flow was active on reload, resume it after DOM is ready
        if (goalCreationFlow.active) {
            console.log('[FLOW] Restored active flow from localStorage, step:', goalCreationFlow.step);
            // Wait for goalQuestions to be defined and DOM to be ready
            setTimeout(() => {
                if (typeof goalQuestions !== 'undefined' && goalCreationFlow.active) {
                    const currentQuestion = goalQuestions[goalCreationFlow.step];
                    if (currentQuestion) {
                        addMessageToChat('assistant', 'Continuing with goal creation... --- ' + currentQuestion.question);
                        if (currentQuestion.options && typeof showQuickReplyOptions === 'function') {
                            showQuickReplyOptions(currentQuestion.options);
                        }
                    }
                }
            }, 1000);
        }
        // ========== END GOAL CREATION FLOW DEFINITION ==========

        // Chat Functions
        async function sendChatMessage() {
            const input = document.getElementById('chat-input');
            if (!input) return; // No chat for guests
            
            // Check if this is an ASTAR trigger message
            var messageToSend = input.value.trim();
            if (window.astarTriggerMessage) {
                messageToSend = window.astarTriggerMessage;
                window.astarTriggerMessage = null; // Clear it
            }
            
            const message = messageToSend;
            
            if (!message) return;
            
            // ========== GOAL KEYWORD DETECTION - FIRST PRIORITY ==========
            const goalKeywords = [
                'crear goal', 'create goal', 'nuevo goal', 'new goal', 'anadir goal', 'add goal',
                'crear objetivo', 'nuevo objetivo', 'anadir objetivo', 'agregar objetivo',
                'quiero crear', 'necesito crear', 'me gustaria crear',
                'registrar goal', 'definir objetivo', 'establecer goal', 'poner un objetivo',
                'agregar goal', 'hacer un goal', 'hacer un objetivo', 'crea un goal', 'crea un objetivo'
            ];
            
            const messageClean = message.toLowerCase().trim();
            const hasGoalKeyword = goalKeywords.some(keyword => messageClean.includes(keyword));
            
            console.log('[CHAT] Message:', message);
            console.log('[CHAT] Has goal keyword:', hasGoalKeyword);
            console.log('[CHAT] Goal flow active:', typeof goalCreationFlow !== 'undefined' ? goalCreationFlow.active : 'undefined');
            
            // If goal keywords detected AND flow not active, start flow directly (no backend call!)
            if (hasGoalKeyword && typeof goalCreationFlow !== 'undefined' && !goalCreationFlow.active) {
                console.log('[CHAT] [OK] Goal keyword detected! Starting flow directly...');
                addMessageToChat('user', message);
                input.value = '';
                startGoalCreation();
                return;
            }
            // ========== END GOAL KEYWORD DETECTION ==========

            // Add user message to chat
            addMessageToChat('user', message);
            input.value = '';
            
            // Show loading
            const loading = document.getElementById('chat-loading');
            if (loading) loading.classList.remove('hidden');

            try {
                const response = await axios.post('/api/chat-agent/message', {
                    message: message
                }, {
                    withCredentials: true
                });

                // Hide loading
                if (loading) loading.classList.add('hidden');

                // Add assistant response
                if (response.data) {
                    console.log('[CHAT] ========== AI RESPONSE RECEIVED ==========');
                    console.log('[CHAT] Response data:', JSON.stringify(response.data));
                    
                    // Check for goal flow trigger FIRST (flag-based detection)
                    if (response.data.triggerGoalFlow === true) {
                        console.log('[CHAT] [OK] GOAL FLOW TRIGGER detected! Starting goal creation...');
                        // NO mostrar nada adicional, el mensaje del usuario ya se mostró antes
                        // Iniciar el flujo directamente
                        startGoalCreation();
                        return;
                    }
                    
                    const aiMessage = response.data.message;
                    console.log('[CHAT] AI Message:', aiMessage);
                    
                    // Fallback: Also check for text-based TRIGGER (legacy)
                    if (aiMessage && aiMessage.includes('TRIGGER:START_GOAL_FLOW')) {
                        console.log('[CHAT] [OK] Legacy TRIGGER detected! Starting goal creation flow...');
                        startGoalCreation();
                        return;
                    } 
                    // Check if AI wants to trigger goal edit flow
                    else if (aiMessage.includes('TRIGGER:EDIT_GOAL_FLOW|')) {
                        const goalId = aiMessage.split('TRIGGER:EDIT_GOAL_FLOW|')[1].split('\n')[0].trim();
                        console.log('[CHAT] [OK] EDIT TRIGGER detected! Starting edit flow for goal:', goalId);
                        startGoalCreation(parseInt(goalId));
                        // NO mostrar el mensaje TRIGGER en el chat
                        return;
                    } 
                    else {
                        console.log('[CHAT] Normal message, adding to chat');
                        addMessageToChat('assistant', aiMessage);
                    }
                } else {
                    addMessageToChat('assistant', 'I received your message but could not generate a response.');
                }
            } catch (error) {
                if (loading) loading.classList.add('hidden');
                console.error('Chat error:', error);
                
                // More detailed error message
                let errorMessage = 'Sorry, there was an error. Please try again.';
                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = 'Your session has expired. Please reload the page.';
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
            messageDiv.className = 'chat-message flex ' + (role === 'user' ? 'justify-end' : 'justify-start');
            
            const bubbleClass = role === 'user' 
                ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                : 'bg-gray-100 text-gray-800';
            
            messageDiv.innerHTML = 
                '<div class="' + bubbleClass + ' rounded-lg px-4 py-2 max-w-[85%] shadow-sm">' +
                    '<p class="text-sm whitespace-pre-wrap">' + content + '</p>' +
                '</div>';
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function handleChatKeydown(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendChatMessage();
            }
        }
        
        // Expose chat functions globally (initial assignment - will be enhanced later)
        // NOTE: This is intentionally set here so functions work immediately,
        // but the enhanced version with goal detection is set later
        window.sendChatMessage = sendChatMessage;
        window.handleChatKeydown = handleChatKeydown;
        window.addMessageToChat = addMessageToChat;

        async function analyzeGoals() {
            addMessageToChat('user', 'Analyze my goals and give me marketing recommendations');
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const response = await axios.post('/api/chat-agent/analyze-goals', {}, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                addMessageToChat('assistant', response.data.analysis || 'Analisis completado.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error analyzing goals:', error);
                addMessageToChat('assistant', 'Error analyzing goals. Please try again.');
            }
        }

        async function generateMarketingPlan() {
            const websiteUrl = prompt('What is your website? (to analyze your brand)', '');
            if (!websiteUrl) return;
            
            const userId = localStorage.getItem('userId') || '1';
            
            addMessageToChat('user', 'Generate brand analysis, marketing plan and images for ' + websiteUrl);
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                // Llamar al endpoint que genera imágenes automáticamente
                const response = await axios.post('/api/agents/brand/generate-images', {
                    website_url: websiteUrl,
                    user_id: parseInt(userId),
                    cloudflare_api_url: window.location.origin,
                    image_types: ['banner', 'post', 'story']
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                
                if (response.data.success) {
                    const formatted = formatMarkdownToHTML(response.data.response || 'Analysis completed');
                    addMessageToChat('assistant', formatted);
                    
                    if (response.data.images_saved > 0) {
                        const successMsg = '<div class=\"mt-4 p-4 bg-green-50 border border-green-200 rounded-lg\">' +
                            '<i class=\"fas fa-check-circle text-green-600 mr-2\"></i>' +
                            '<strong>' + response.data.images_saved + ' images generated!</strong><br>' +
                            '<a href="#" onclick="switchTab(\'aicmo\'); return false;" class="text-primary hover:underline mt-2 inline-block">' +
                            'View images in AI CMO →</a></div>';
                        addMessageToChat('assistant', successMsg);
                    }
                } else {
                    addMessageToChat('assistant', '<div class=\"p-4 bg-red-50 border border-red-200 rounded-lg text-red-800\">' +
                        '<i class=\"fas fa-exclamation-triangle mr-2\"></i>' + 
                        (response.data.error || 'Unknown error') + '</div>');
                }
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error generating plan:', error);
                const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
                addMessageToChat('assistant', '<div class=\"p-4 bg-red-50 border border-red-200 rounded-lg text-red-800\">' +
                    '<i class=\"fas fa-times-circle mr-2\"></i>Error generating: ' + errorMsg + '</div>');
            }
        }
        
        function formatMarkdownToHTML(text) {
            if (!text) return '';
            var backtick = String.fromCharCode(96);
            var backtickRegex = new RegExp(backtick + '([^' + backtick + ']+)' + backtick, 'g');
            
            let formatted = text
                .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h3>')
                .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold mt-4 mb-2 text-gray-700">$1</h4>')
                .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
                .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-6 text-gray-900">$1</h1>')
                .replace(/[*][*](.+?)[*][*]/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                .replace(/[*](.+?)[*]/g, '<em>$1</em>')
                .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc">$1</li>')
                .replace(backtickRegex, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-purple-600">$1</code>');
            
            return '<div class="prose max-w-none">' + formatted + '</div>';
        }

        async function generateContentIdeas() {
            const websiteUrl = prompt('What is your website? (to understand your brand)', '');
            if (!websiteUrl) return;
            
            const platform = prompt('For which platform? (Instagram, LinkedIn, Twitter, TikTok, Blog)', 'Instagram');
            if (!platform) return;
            
            addMessageToChat('user', 'Generate content ideas for ' + platform);
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const response = await axios.post('/api/chat-agent/message', {
                    message: 'Based on the brand from ' + websiteUrl + ', generate 10 creative content ideas for ' + platform + '. Include catchy titles, suggested formats and why each idea would work.',
                    useBrandAgent: true,
                    websiteUrl: websiteUrl
                }, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                addMessageToChat('assistant', response.data.message || 'Ideas generated.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error generating content ideas:', error);
                addMessageToChat('assistant', 'Error generating ideas. Please try again.');
            }
        }

        async function updateUsers() {
            console.log('[METRICS] updateUsers called');
            const newValue = prompt('How many users do you currently have?');
            if (!newValue || isNaN(newValue)) {
                console.log('[METRICS] Invalid or cancelled input');
                return;
            }
            
            addMessageToChat('user', 'Update users to ' + newValue);
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                console.log('[METRICS] Sending ADD_METRIC action for users:', newValue);
                const response = await axios.post('/api/chat-agent/message', {
                    message: 'ACTION:ADD_METRIC|users|' + newValue
                }, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                console.log('[METRICS] Response:', response.data);
                addMessageToChat('assistant', '[OK] Users metric updated: ' + newValue + ' users. This information will help improve recommendations.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('[METRICS] Error updating users:', error);
                addMessageToChat('assistant', 'Error updating users. Please try again.');
            }
        }

        async function updateRevenue() {
            console.log('[METRICS] updateRevenue called');
            const newValue = prompt('What is your current revenue? (just the number, no symbols)');
            if (!newValue || isNaN(newValue)) {
                console.log('[METRICS] Invalid or cancelled input');
                return;
            }
            
            addMessageToChat('user', 'Update revenue to $' + newValue);
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                console.log('[METRICS] Sending ADD_METRIC action for revenue:', newValue);
                const response = await axios.post('/api/chat-agent/message', {
                    message: 'ACTION:ADD_METRIC|revenue|' + newValue
                }, {
                    withCredentials: true
                });
                
                document.getElementById('chat-loading').classList.add('hidden');
                console.log('[METRICS] Response:', response.data);
                addMessageToChat('assistant', '[OK] Revenue metric updated: $' + newValue + '. This information will help track your growth.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('[METRICS] Error updating revenue:', error);
                addMessageToChat('assistant', 'Error updating revenue. Please try again.');
            }
        }

        // Goal Creation/Edit Flow - use the global one defined earlier
        // (goalCreationFlow is already defined at the top of the script)

        const goalQuestions = [
            { 
                field: 'category', 
                question: 'What category does this goal belong to? (ASTAR: Blockchain/ASTAR related projects | MAGCIENT: AI/Machine Learning projects | OTHER: Other projects)', 
                options: ['ASTAR', 'MAGCIENT', 'OTHER'] 
            },
            { 
                field: 'description', 
                question: 'What is the goal description? (Describe what you want to achieve)', 
                type: 'text' 
            },
            { 
                field: 'task', 
                question: 'What is the specific task to achieve this goal? (Concrete action to take)', 
                type: 'text',
                optional: true 
            },
            { 
                field: 'priority', 
                question: 'What priority does this goal have? (P0: Urgent and important | P1: Urgent or important | P2: Urgent but not important | P3: Neither urgent nor important)', 
                options: ['P0', 'P1', 'P2', 'P3'] 
            },
            { 
                field: 'cadence', 
                question: 'Is this a one-time or recurring goal? (One time: Completed once | Recurrent: Repeats periodically)', 
                options: ['One time', 'Recurrent'] 
            },
            { 
                field: 'dri', 
                question: 'Who is the Directly Responsible Individual (DRI)? Enter the name of the responsible person.', 
                type: 'text',
                optional: true 
            },
            { 
                field: 'goal_status', 
                question: 'What is the current status of this goal? (To start | WIP | On Hold | Delayed | Blocked | Done)', 
                options: ['To start', 'WIP', 'On Hold', 'Delayed', 'Blocked', 'Done'] 
            },
            { 
                field: 'week_of', 
                question: 'For which week is this goal? (Example: December 30, January 6, or leave blank)', 
                type: 'text', 
                optional: true 
            }
        ];

        function startGoalCreation(goalId = null) {
            console.log('[GOAL-FLOW] ========== START GOAL CREATION ==========');
            console.log('[GOAL-FLOW] Starting goal creation flow, goalId:', goalId);
            goalCreationFlow.active = true;
            goalCreationFlow.step = 0;
            goalCreationFlow.data = {};
            goalCreationFlow.editingGoalId = goalId;
            saveFlowState(); // Persist to localStorage
            console.log('[GOAL-FLOW] Flow initialized and saved:', JSON.stringify(goalCreationFlow));
            
            const actionText = goalId ? 'edit this goal' : 'create a new goal';
            const firstQuestion = goalQuestions[0];
            console.log('[GOAL-FLOW] First question:', firstQuestion.question);
            
            addMessageToChat('assistant', 'Perfect! I will help you ' + actionText + '. I will ask you ' + goalQuestions.length + ' questions. --- ' + firstQuestion.question);
            
            if (firstQuestion.options) {
                console.log('[GOAL-FLOW] Showing quick reply options:', firstQuestion.options);
                showQuickReplyOptions(firstQuestion.options);
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
            console.log('[GOAL-FLOW] ========== HANDLE QUICK REPLY ==========');
            console.log('[GOAL-FLOW] Quick reply value:', value);
            console.log('[GOAL-FLOW] Flow active:', goalCreationFlow.active);
            console.log('[GOAL-FLOW] Current step:', goalCreationFlow.step);
            
            if (!goalCreationFlow.active) {
                console.log('[GOAL-FLOW] Flow not active, returning');
                return;
            }
            
            removeQuickReplyOptions();
            addMessageToChat('user', value);
            
            const currentQuestion = goalQuestions[goalCreationFlow.step];
            console.log('[GOAL-FLOW] Current question field:', currentQuestion.field);
            goalCreationFlow.data[currentQuestion.field] = value;
            console.log('[GOAL-FLOW] Updated data:', JSON.stringify(goalCreationFlow.data));
            
            goalCreationFlow.step++;
            saveFlowState(); // Persist after each step
            console.log('[GOAL-FLOW] Moving to step:', goalCreationFlow.step);
            
            if (goalCreationFlow.step < goalQuestions.length) {
                const nextQuestion = goalQuestions[goalCreationFlow.step];
                console.log('[GOAL-FLOW] Next question:', nextQuestion.question);
                addMessageToChat('assistant', nextQuestion.question);
                
                if (nextQuestion.options) {
                    console.log('[GOAL-FLOW] Showing options:', nextQuestion.options);
                    showQuickReplyOptions(nextQuestion.options);
                }
            } else {
                console.log('[GOAL-FLOW] All questions answered, completing goal creation');
                await completeGoalCreation();
            }
        }

        // Create a function to override SendChatMessage
        // We define it separately to keep the logic clear
        function setupEnhancedSendChatMessage() {
            // Store the original function if it's the first time
            if (!window.originalSendChatMessage) {
                window.originalSendChatMessage = window.sendChatMessage;
            }
            
            // Override with enhanced version
            window.sendChatMessage = async function() {
                const input = document.getElementById('chat-input');
                if (!input) return;
                const message = input.value.trim();
                
                if (!message) return;

                console.log('[CHAT] ========== SEND CHAT MESSAGE ==========');
                console.log('[CHAT] Message:', message);
                console.log('[CHAT] Goal flow active:', goalCreationFlow.active);

                // Expanded keywords to detect goal creation intent - ALWAYS trigger flow
                const goalKeywords = [
                    'crear goal', 'create goal', 'nuevo goal', 'new goal', 'anadir goal', 'add goal',
                    'crear objetivo', 'create objective', 'nuevo objetivo', 'new objective', 'anadir objetivo', 'add objective',
                    'quiero crear', 'want to create', 'necesito crear', 'need to create',
                    'agregar goal', 'agregar objetivo', 'hacer un goal', 'hacer un objetivo',
                    'registrar goal', 'registrar objetivo', 'definir objetivo', 'definir goal',
                    'establecer objetivo', 'establecer goal', 'poner un objetivo', 'poner un goal'
                ];
                
                const messageClean = message.toLowerCase().trim();
                const hasGoalKeyword = goalKeywords.some(keyword => messageClean.includes(keyword));
                
                console.log('[CHAT] Has goal keyword:', hasGoalKeyword);
                
                // ALWAYS start goal creation flow if keywords detected and flow is not active
                if (!goalCreationFlow.active && hasGoalKeyword) {
                    console.log('[CHAT] [OK] Goal creation keyword detected! Starting flow...');
                    input.value = '';
                    addMessageToChat('user', message);
                    startGoalCreation();
                    return;
                }

                // If flow is active, continue with it
                if (goalCreationFlow.active) {
                    console.log('[CHAT] Flow active, processing answer for step:', goalCreationFlow.step);
                    removeQuickReplyOptions();
                    addMessageToChat('user', message);
                    input.value = '';
                    
                    const currentQuestion = goalQuestions[goalCreationFlow.step];
                    goalCreationFlow.data[currentQuestion.field] = message;
                    console.log('[CHAT] Saved answer for field:', currentQuestion.field);
                    
                    goalCreationFlow.step++;
                    saveFlowState(); // Persist after each step
                    
                    if (goalCreationFlow.step < goalQuestions.length) {
                        const nextQuestion = goalQuestions[goalCreationFlow.step];
                        console.log('[CHAT] Asking next question for field:', nextQuestion.field);
                        addMessageToChat('assistant', nextQuestion.question);
                        
                        if (nextQuestion.options) {
                            showQuickReplyOptions(nextQuestion.options);
                        }
                    } else {
                        console.log('[CHAT] All questions answered, completing...');
                        await completeGoalCreation();
                    }
                    return;
                }

                console.log('[CHAT] Normal chat message, sending to AI...');
                
                // Handle the chat directly - don't rely on original function
                addMessageToChat('user', message);
                input.value = '';
                
                const loading = document.getElementById('chat-loading');
                if (loading) loading.classList.remove('hidden');
                
                try {
                    // Check if there's an email context active
                    const emailContext = window.currentEmailContext || null;
                    
                    const response = await axios.post('/api/chat-agent/message', { 
                      message,
                      emailContext: emailContext
                    }, { withCredentials: true });
                    
                    // Clear the email context after first user response
                    if (emailContext) {
                      console.log('[CHAT] Clearing email context after user response');
                      window.currentEmailContext = null;
                    }
                    
                    if (loading) loading.classList.add('hidden');
                    
                    if (response.data) {
                        console.log('[CHAT] [RESPONSE] Response received:', JSON.stringify(response.data));
                        
                        // Check for goal flow trigger FIRST (highest priority)
                        // BUT ignore if it's from an ASTAR response
                        if ((response.data.triggerGoalFlow === true || response.data.message === '__START_GOAL_FLOW__') && !window.isAstarResponse) {
                            console.log('[CHAT] [OK] GOAL FLOW TRIGGER detected! Starting flow...');
                            startGoalCreation();
                            return; // Don't show anything in chat
                        } else if (window.isAstarResponse) {
                            console.log('[CHAT] Ignoring goal flow trigger - this is an ASTAR response');
                        }
                        
                        const aiMessage = response.data.message;
                        
                        // Fallback: text-based TRIGGER detection (legacy)
                        if (aiMessage && aiMessage.includes('TRIGGER:START_GOAL_FLOW') && !window.isAstarResponse) {
                            console.log('[CHAT] [OK] Legacy TRIGGER detected!');
                            startGoalCreation();
                            return;
                        }
                        
                        // Normal message - display it
                        if (aiMessage) {
                            addMessageToChat('assistant', aiMessage);
                        }
                    }
                } catch (e) {
                    if (loading) loading.classList.add('hidden');
                    console.error('[CHAT] Error:', e);
                    addMessageToChat('assistant', 'Sorry, there was an error. Please try again.');
                }
            };
        }
        
        // Call the setup function immediately
        setupEnhancedSendChatMessage();

        async function completeGoalCreation() {
            console.log('[GOAL-FLOW] ========== COMPLETE GOAL CREATION ==========');
            console.log('[GOAL-FLOW] Final data collected:', JSON.stringify(goalCreationFlow.data));
            
            goalCreationFlow.active = false;
            clearFlowState(); // Clear localStorage
            document.getElementById('chat-loading').classList.remove('hidden');
            
            try {
                const priorityLabels = {
                    'P0': 'Urgent & important',
                    'P1': 'Urgent or important',
                    'P2': 'Urgent but not important',
                    'P3': 'Neither but cool'
                };
                
                console.log('[GOAL-FLOW] Using category from user selection:', goalCreationFlow.data.category);
                
                const goalData = {
                    category: goalCreationFlow.data.category || 'ASTAR',
                    description: goalCreationFlow.data.description,
                    task: goalCreationFlow.data.task || null,
                    priority: goalCreationFlow.data.priority,
                    priority_label: priorityLabels[goalCreationFlow.data.priority],
                    cadence: goalCreationFlow.data.cadence,
                    dri: goalCreationFlow.data.dri || null,
                    goal_status: goalCreationFlow.data.goal_status,
                    week_of: goalCreationFlow.data.week_of || null
                };
                
                console.log('[GOAL-FLOW] Prepared goalData for backend:', JSON.stringify(goalData));
                
                const isEditing = goalCreationFlow.editingGoalId !== null;
                console.log('[GOAL-FLOW] Is editing:', isEditing, 'Goal ID:', goalCreationFlow.editingGoalId);
                
                if (isEditing) {
                    console.log('[GOAL-FLOW] Updating existing goal via PUT');
                    // Update existing goal
                    const response = await axios.put('/api/dashboard/goals/' + goalCreationFlow.editingGoalId, goalData, {
                        withCredentials: true
                    });
                    console.log('[GOAL-FLOW] PUT response:', response.data);
                    
                    document.getElementById('chat-loading').classList.add('hidden');
                    
                    if (response.data.success || response.status === 200) {
                        addMessageToChat('assistant', '[OK] Goal updated successfully! | [GOAL] **' + goalData.description + '** | [TASK] ' + (goalData.task || 'N/A') + ' | [CATEGORY] ' + goalData.category + ' | [PRIORITY] ' + goalData.priority + ' - ' + goalData.priority_label + ' | [CADENCE] ' + goalData.cadence + ' | [DRI] ' + (goalData.dri || 'Not assigned') + ' | [STATUS] ' + goalData.goal_status + ' | [WEEK] ' + (goalData.week_of || 'Not specified') + ' | The goal is now available in your Founder Hub!');
                        
                        console.log('[GOAL-FLOW] Reloading dashboard data in 2 seconds...');
                        setTimeout(() => {
                            if (typeof loadDashboardData === 'function') {
                                console.log('[GOAL-FLOW] Calling loadDashboardData()');
                                loadDashboardData();
                            } else {
                                console.log('[GOAL-FLOW] loadDashboardData not found, reloading page');
                                window.location.reload();
                            }
                        }, 2000);
                    } else {
                        console.error('[GOAL-FLOW] Unexpected response:', response);
                        addMessageToChat('assistant', '[ERROR] There was an error updating the goal. Please try again.');
                    }
                } else {
                    console.log('[GOAL-FLOW] Creating new goal - sending to chat-agent');
                    // Enviar al chat-agent para que maneje la creación localmente
                    // Construir mensaje con todos los datos en el formato que espera el backend
                    const createMessage = 'Create goal with the following data: Category: ' + goalData.category + ' | Description: ' + goalData.description + ' | Task: ' + (goalData.task || 'N/A') + ' | Priority: ' + goalData.priority + ' | Cadence: ' + goalData.cadence + ' | DRI: ' + (goalData.dri || 'Not assigned') + ' | Status: ' + goalData.goal_status + ' | Week: ' + (goalData.week_of || 'Not specified');
                    
                    console.log('[GOAL-FLOW] Sending creation request to chat-agent:', createMessage);
                    
                    const response = await axios.post('/api/chat-agent/message', { 
                        message: createMessage,
                        goalData: goalData  // Enviar los datos estructurados también
                    }, {
                        withCredentials: true
                    });
                    
                    console.log('[GOAL-FLOW] Chat-agent response:', response.data);
                    
                    document.getElementById('chat-loading').classList.add('hidden');
                    
                    if (response.data && response.data.message) {
                        addMessageToChat('assistant', response.data.message);
                        
                        console.log('[GOAL-FLOW] Reloading dashboard data in 2 seconds...');
                        setTimeout(() => {
                            if (typeof loadDashboardData === 'function') {
                                console.log('[GOAL-FLOW] Calling loadDashboardData()');
                                loadDashboardData();
                            } else {
                                console.log('[GOAL-FLOW] loadDashboardData not found, reloading page');
                                window.location.reload();
                            }
                        }, 2000);
                    } else {
                        addMessageToChat('assistant', '[ERROR] There was an error creating the goal. Please try again.');
                    }
                }
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error creating goal:', error);
                addMessageToChat('assistant', '[ERROR] Error creating the goal. Please try again or use the "New Goal" button in the Hub.');
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
                addMessageToChat('assistant', response.data.analysis || 'Analisis completado.');
            } catch (error) {
                document.getElementById('chat-loading').classList.add('hidden');
                console.error('Error analyzing competition:', error);
                addMessageToChat('assistant', 'Error analyzing competition. Please try again.');
            }
        }

        async function clearChatHistory() {
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) return; // No chat for guests
            
            if (!confirm('Estas seguro de que quieres limpiar el historial del chat?')) return;
            
            try {
                await axios.delete('/api/chat-agent/history', {
                    withCredentials: true
                });
                
                document.getElementById('chat-messages').innerHTML = 
                    '<div class="text-center text-gray-500 text-sm py-8">' +
                        '<span class="text-3xl mb-2 block">🌟</span>' +
                        '<p class="font-semibold">Start chatting with your ASTAR Agent</p>' +
                        '<p class="text-xs mt-1">Ask about your goals, metrics, or growth strategies</p>' +
                    '</div>';
            } catch (error) {
                console.error('Error clearing chat:', error);
                alert('Error clearing chat history.');
            }
        }

        function getCookie(name) {
            const value = '; ' + document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
        }

        function logout() {
            document.cookie = 'authToken=; Max-Age=0; path=/;';
            window.location.href = '/';
        }
        
        // ============================================
        // EXPOSE ALL FUNCTIONS TO WINDOW IMMEDIATELY
        // ============================================
        window.logout = logout;
        window.getCookie = getCookie;
        window.clearChatHistory = clearChatHistory;
        window.toggleLeftSidebar = toggleLeftSidebar;
        window.toggleChatSidebar = toggleChatSidebar;
        window.toggleChatVisibility = toggleChatVisibility;
        window.startGoalCreation = startGoalCreation;
        window.analyzeGoals = analyzeGoals;
        window.generateMarketingPlan = generateMarketingPlan;
        window.generateContentIdeas = generateContentIdeas;
        window.updateUsers = updateUsers;
        window.updateRevenue = updateRevenue;
        // NOTE: window.sendChatMessage is set in the enhanced version above (line ~1116)
        // Do NOT overwrite it here or the goal detection will break!
        window.handleChatKeydown = handleChatKeydown;
        window.addMessageToChat = addMessageToChat;
        
        console.log('[INIT] All functions exposed to window');

        // Attach event listeners when DOM is ready
        function attachButtonListeners() {
            console.log('[INIT] attachButtonListeners called');
            
            // Attach event listeners to buttons
            const btnCreateGoal = document.getElementById('btn-create-goal');
            const btnAnalyzeGoals = document.getElementById('btn-analyze-goals');
            const btnMarketingPlan = document.getElementById('btn-marketing-plan');
            const btnContentIdeas = document.getElementById('btn-content-ideas');
            
            console.log('[INIT] Buttons found:', {
                createGoal: !!btnCreateGoal,
                analyzeGoals: !!btnAnalyzeGoals,
                marketingPlan: !!btnMarketingPlan,
                contentIdeas: !!btnContentIdeas
            });
            
            if (btnCreateGoal) {
                console.log('[INIT] Attaching Create Goal listener');
                btnCreateGoal.onclick = function(e) {
                    console.log('[BTN] Create Goal clicked');
                    e.preventDefault();
                    startGoalCreation();
                };
            } else {
                console.error('[INIT] btn-create-goal NOT FOUND');
            }
            
            if (btnAnalyzeGoals) {
                console.log('[INIT] Attaching Analyze Goals listener');
                btnAnalyzeGoals.onclick = function(e) {
                    console.log('[BTN] Analyze Goals clicked');
                    e.preventDefault();
                    analyzeGoals();
                };
            } else {
                console.error('[INIT] btn-analyze-goals NOT FOUND');
            }
            
            if (btnMarketingPlan) {
                console.log('[INIT] Attaching Marketing Plan listener');
                btnMarketingPlan.onclick = function(e) {
                    console.log('[BTN] Marketing Plan clicked');
                    e.preventDefault();
                    generateMarketingPlan();
                };
            } else {
                console.error('[INIT] btn-marketing-plan NOT FOUND');
            }
            
            if (btnContentIdeas) {
                console.log('[INIT] Attaching Content Ideas listener');
                btnContentIdeas.onclick = function(e) {
                    console.log('[BTN] Content Ideas clicked');
                    e.preventDefault();
                    generateContentIdeas();
                };
            } else {
                console.error('[INIT] btn-content-ideas NOT FOUND');
            }
        }
        
        // Try multiple times to attach listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachButtonListeners);
        } else {
            // DOM already loaded, try immediately
            attachButtonListeners();
        }
        
        // Also try after a short delay as fallback
        setTimeout(attachButtonListeners, 100);
        setTimeout(attachButtonListeners, 500);
        
        // Load chat history after page fully loads
        async function loadChatHistory() {
            console.log('[CHAT-HISTORY] Loading chat history...');
            
            try {
                const response = await axios.get('/api/chat-agent/history', {
                    withCredentials: true
                });
                
                console.log('[CHAT-HISTORY] Response:', response.data);
                
                if (response.data.messages && response.data.messages.length > 0) {
                    console.log('[CHAT-HISTORY] Found', response.data.messages.length, 'messages');
                    const messagesContainer = document.getElementById('chat-messages');
                    if (!messagesContainer) {
                        console.error('[CHAT-HISTORY] Messages container not found!');
                        return;
                    }
                    
                    messagesContainer.innerHTML = '';
                    
                    // Messages are already in correct order from API
                    response.data.messages.forEach(msg => {
                        addMessageToChat(msg.role, msg.content);
                    });
                    console.log('[CHAT-HISTORY] Chat history loaded successfully');
                } else {
                    console.log('[CHAT-HISTORY] No previous messages found');
                }
            } catch (error) {
                console.error('[CHAT-HISTORY] Error loading chat history:', error);
                // Show default message on error
                const messagesContainer = document.getElementById('chat-messages');
                if (messagesContainer && messagesContainer.children.length === 0) {
                    messagesContainer.innerHTML = '<div class="text-center text-gray-500 text-sm py-8">' +
                        '<span class="text-3xl mb-2 block">🌟</span>' +
                        '<p class="font-semibold">Start chatting with your ASTAR Agent</p>' +
                        '<p class="text-xs mt-1">Ask about your goals, metrics, or growth strategies</p>' +
                        '</div>';
                }
            }
        }
        
        // Load history when page loads
        window.addEventListener('load', loadChatHistory);
        
        // Also expose function so we can reload history when needed
        window.loadChatHistory = loadChatHistory;
    </script>
    
    <!-- ASTAR Weekly Messages Notifications -->
    <script>
    // Función de utilidad global
    function escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    window.escapeHtml = escapeHtml;
    
    (function() {
      console.log('[ASTAR] Initializing notifications system...');
      
      function getAuthToken() {
        var cookieMatch = document.cookie.match(/authToken=([^;]+)/);
        return cookieMatch ? cookieMatch[1] : localStorage.getItem('authToken');
      }
      
      async function loadAstarNotifications() {
        var token = getAuthToken();
        if (!token) {
          console.log('[ASTAR] No auth token found');
          return;
        }
        
        try {
          console.log('[ASTAR] Fetching pending messages...');
          var response = await fetch('/api/astar-messages/pending', {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log('[ASTAR] Response status:', response.status);
          
          if (!response.ok) {
            console.error('[ASTAR] Failed to fetch:', response.statusText);
            return;
          }
          
          var data = await response.json();
          console.log('[ASTAR] Data received:', data);
          
          if (data.pending && data.pending.length > 0) {
            console.log('[ASTAR] Showing', data.pending.length, 'notifications');
            showAstarBanner(data.pending);
          } else {
            console.log('[ASTAR] No pending messages');
          }
        } catch (error) {
          console.error('[ASTAR] Error:', error);
        }
      }
      
      function showAstarBanner(messages) {
        var existing = document.getElementById('astar-notification-banner');
        if (existing) existing.remove();
        
        var banner = document.createElement('div');
        banner.id = 'astar-notification-banner';
        banner.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;width:90%;max-width:800px;';
        
        var messagesHtml = messages.map(function(msg) {
          var escapedSubject = escapeHtml(msg.subject);
          var escapedPrompt = escapeHtml(msg.response_prompt);
          
          return '<div style="background:rgba(15,23,42,0.9);padding:16px;border-radius:8px;margin-bottom:12px;border-left:4px solid #8b5cf6;">' +
            '<div style="color:white;margin-bottom:12px;">' +
              '<div style="font-size:18px;font-weight:bold;margin-bottom:8px;">' + escapedSubject + '<\/div>' +
              '<div style="font-size:14px;color:#cbd5e1;margin-bottom:12px;">' + escapedPrompt + '<\/div>' +
            '<\/div>' +
            '<textarea id="astar-response-' + msg.sent_message_id + '" placeholder="Write your response" ' +
              'style="width:100%;min-height:80px;padding:12px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:white;font-size:14px;resize:vertical;margin-bottom:12px;"><\/textarea>' +
            '<button onclick="window.submitAstarResponse(' + msg.sent_message_id + ')" ' +
              'style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:10px 20px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">' +
              'Send Response<\/button>' +
          '<\/div>';
        }).join('');
        
        var messageCount = messages.length;
        var messageText = messageCount === 1 ? 'message' : 'messages';
        
        banner.innerHTML = '<div style="background:linear-gradient(135deg,#581c87,#312e81);border-radius:12px;padding:20px;border:2px solid #8b5cf6;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="font-size:28px;">*<\/span>' +
              '<h2 style="color:white;font-size:20px;font-weight:bold;margin:0;">ASTAR has a question<\/h2>' +
              '<span style="background:#8b5cf6;color:white;padding:4px 12px;border-radius:20px;font-size:14px;font-weight:bold;">' + messageCount + ' ' + messageText + '<\/span>' +
            '<\/div>' +
            '<button onclick="document.getElementById(' + String.fromCharCode(39) + 'astar-notification-banner' + String.fromCharCode(39) + ').remove()" style="background:transparent;border:none;color:#9ca3af;font-size:24px;cursor:pointer;">X<\/button>' +
          '<\/div>' +
          messagesHtml +
        '<\/div>';
        
        document.body.appendChild(banner);
        console.log('[ASTAR] Banner displayed');
      }
      
      window.submitAstarResponse = async function(messageId) {
        console.log('[ASTAR-SUBMIT] Function called with messageId:', messageId);
        
        var textarea = document.getElementById('astar-response-' + messageId);
        console.log('[ASTAR-SUBMIT] Textarea found:', !!textarea);
        
        var response = textarea ? textarea.value.trim() : '';
        console.log('[ASTAR-SUBMIT] Response text:', response);
        
        if (!response) {
          alert('Please write a response');
          return;
        }
        
        var token = getAuthToken();
        if (!token) {
          alert('Session expired');
          return;
        }
        
        // Mostrar indicador de carga
        var btn = event.target;
        var originalText = btn.innerHTML;
        btn.innerHTML = 'Saving...';
        btn.disabled = true;
        
        try {
          console.log('[ASTAR-SUBMIT] Sending to API...');
          var res = await fetch('/api/astar-messages/respond', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sent_message_id: messageId,
              response_text: response
            })
          });
          
          console.log('[ASTAR-SUBMIT] API response status:', res.status);
          
          if (res.ok) {
            var data = await res.json();
            console.log('[ASTAR-SUBMIT] Response saved, data:', data);
            
            // Cerrar el banner
            var banner = document.getElementById('astar-notification-banner');
            if (banner) {
              banner.remove();
              console.log('[ASTAR-SUBMIT] Banner removed');
            }
            
            // Guardar datos para el chat
            window.astarResponseData = data;
            console.log('[ASTAR-SUBMIT] Data saved to window.astarResponseData');
            
            // Redirigir directamente al chat
            console.log('[ASTAR-SUBMIT] Calling openAstarChat...');
            if (typeof window.openAstarChat === 'function') {
              window.openAstarChat();
            } else {
              console.error('[ASTAR-SUBMIT] openAstarChat function not found!');
            }
            
          } else {
            var err = await res.json();
            console.error('[ASTAR-SUBMIT] API error:', err);
            alert('Error: ' + (err.error || 'No se pudo enviar'));
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        } catch (error) {
          console.error('[ASTAR-SUBMIT] Error submitting:', error);
          alert('Error al enviar respuesta');
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      };
      
      window.openAstarChat = function() {
        // Close modal if exists
        var modal = document.getElementById('astar-success-modal');
        if (modal) modal.remove();
        
        // Cerrar el banner de notificación
        var banner = document.getElementById('astar-notification-banner');
        if (banner) banner.remove();
        
        // Get response data
        var data = window.astarResponseData || {};
        
        console.log('[ASTAR-OPEN-CHAT] Opening chat sidebar with response:', data);
        console.log('[ASTAR-OPEN-CHAT] Has response_text:', !!data.response_text);
        console.log('[ASTAR-OPEN-CHAT] Response text:', data.response_text);
        
        // Abrir el chat sidebar directamente
        var sidebar = document.getElementById('chat-sidebar');
        var floatingBtn = document.getElementById('chat-floating-btn');
        var overlay = document.getElementById('chat-overlay');
        var isMobile = window.innerWidth <= 768;
        
        if (sidebar) {
          sidebar.style.width = isMobile ? '100%' : '400px';
          sidebar.style.maxWidth = '400px';
          sidebar.style.display = 'flex';
          if (floatingBtn) floatingBtn.style.display = 'none';
          if (isMobile && overlay) overlay.classList.remove('hidden');
          console.log('[ASTAR-OPEN-CHAT] Chat sidebar opened');
        } else {
          console.error('[ASTAR-OPEN-CHAT] Sidebar element not found!');
        }
        
        // Añadir mensaje del usuario al chat
        var chatMessages = document.getElementById('chat-messages');
        console.log('[ASTAR-OPEN-CHAT] Chat messages element:', !!chatMessages);
        
        if (!chatMessages) {
          console.error('[ASTAR-OPEN-CHAT] Chat messages container not found!');
          return;
        }
        
        if (!data.response_text) {
          console.error('[ASTAR-OPEN-CHAT] No response text in data!');
          return;
        }
        
        // Enviar al backend con contexto ASTAR
        console.log('[ASTAR-OPEN-CHAT] Sending to API...');
        console.log('[ASTAR-OPEN-CHAT] Full data object:', data);
        
        // Crear mensaje contextual basado en la categoria
        var contextualMessage = data.response_text;
        var category = data.category || 'general';
        var originalQuestion = data.response_prompt || '';
        
        console.log('[ASTAR-OPEN-CHAT] Category:', category);
        console.log('[ASTAR-OPEN-CHAT] Original question from data.response_prompt:', originalQuestion);
        
        // Mostrar la pregunta original de ASTAR en el chat si existe
        console.log('[ASTAR-OPEN-CHAT] Original question:', originalQuestion);
        if (originalQuestion && originalQuestion.trim()) {
          var questionDiv = document.createElement('div');
          questionDiv.className = 'flex justify-start mb-3';
          questionDiv.innerHTML = '<div class="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 max-w-[85%] shadow-sm border border-blue-200"><p class="text-sm font-medium mb-1">📊 ASTAR Question:</p><p class="text-sm">' + escapeHtml(originalQuestion) + '<\/p><\/div>';
          chatMessages.appendChild(questionDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          console.log('[ASTAR-OPEN-CHAT] Original ASTAR question displayed in chat');
        }
        
        // Mostrar la respuesta del usuario
        console.log('[ASTAR-OPEN-CHAT] Adding user message to chat...');
        var userDiv = document.createElement('div');
        userDiv.className = 'flex justify-end mb-3';
        userDiv.innerHTML = '<div class="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-[85%] shadow-sm"><p class="text-sm whitespace-pre-wrap">' + escapeHtml(data.response_text) + '<\/p><\/div>';
        chatMessages.appendChild(userDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        console.log('[ASTAR-OPEN-CHAT] User message added');
        
        // Mostrar loading
        var loading = document.getElementById('chat-loading');
        if (loading) {
          loading.classList.remove('hidden');
          console.log('[ASTAR-OPEN-CHAT] Loading indicator shown');
        }
        
        // Incluir la pregunta original y la respuesta para dar contexto completo
        var fullContextMessage = '';
        
        if (originalQuestion) {
          fullContextMessage = '[ASTAR] Question: "' + originalQuestion + '" --- ';
          fullContextMessage += '[MY RESPONSE] ' + data.response_text + ' --- ';
        } else {
          fullContextMessage = '[MY RESPONSE] ' + data.response_text + ' --- ';
        }
        
        // Add MANDATORY ACTION instructions based on category - must result in concrete action
        if (category.includes('measure') || category.includes('metricas') || category.includes('resultados')) {
          fullContextMessage += 'MANDATORY ACTION: Based on my response, you MUST either: 1) Update my metrics (users, revenue, etc.) if I provided numbers, OR 2) Create a goal to track these metrics. Start the appropriate flow immediately without asking - analyze my response and execute the action.';
        } else if (category.includes('ideas') || category.includes('hipotesis')) {
          fullContextMessage += 'MANDATORY ACTION: Based on my hypothesis/idea, you MUST create a goal to test it. Use TRIGGER:START_GOAL_FLOW to start the goal creation flow immediately. Do not just give recommendations - create the goal now.';
        } else if (category.includes('build') || category.includes('construccion')) {
          fullContextMessage += 'MANDATORY ACTION: Based on what I am building, you MUST create a goal with the next concrete steps. Use TRIGGER:START_GOAL_FLOW to start the goal creation flow immediately.';
        } else if (category.includes('reflect') || category.includes('reflexion')) {
          fullContextMessage += 'MANDATORY ACTION: Based on my reflection, you MUST create a goal with my key learnings and next steps. Use TRIGGER:START_GOAL_FLOW to start the goal creation flow immediately.';
        } else {
          fullContextMessage += 'MANDATORY ACTION: Based on my response, you MUST take one concrete action: either create a goal (use TRIGGER:START_GOAL_FLOW) or update metrics. Do not just give recommendations - execute an action now.';
        }
        
        console.log('[ASTAR-OPEN-CHAT] Full context message:', fullContextMessage);
        
        // Marcar que es una respuesta ASTAR para evitar triggers automáticos
        window.isAstarResponse = true;
        
        fetch('/api/chat-agent/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            message: fullContextMessage
          })
        })
        .then(function(res) { 
          console.log('[ASTAR-OPEN-CHAT] API response status:', res.status);
          return res.json(); 
        })
        .then(function(responseData) {
          console.log('[ASTAR-OPEN-CHAT] API response data:', responseData);
          if (loading) loading.classList.add('hidden');
          
          // Limpiar la marca de respuesta ASTAR
          window.isAstarResponse = false;
          
          if (responseData && responseData.message && responseData.message.trim()) {
            var aiMessage = responseData.message.trim();
            
            // Detectar triggers en la respuesta
            if (aiMessage.includes('TRIGGER:START_GOAL_FLOW')) {
              console.log('[ASTAR-OPEN-CHAT] Goal creation trigger detected, starting goal flow');
              // Reset goal flow state to avoid "already active" blocking
              if (window.goalCreationFlow) {
                window.goalCreationFlow.active = false;
                window.goalCreationFlow.step = 0;
                window.goalCreationFlow.data = {};
                console.log('[ASTAR-OPEN-CHAT] Reset goal flow state');
              }
              startGoalCreation();
              return; // No mostrar el mensaje del trigger
            } else if (aiMessage.includes('TRIGGER:EDIT_GOAL_FLOW|')) {
              try {
                var parts = aiMessage.split('TRIGGER:EDIT_GOAL_FLOW|');
                if (parts.length > 1) {
                  var goalId = parts[1].split(' ')[0].split('|')[0].trim();
                  console.log('[ASTAR-OPEN-CHAT] Goal edit trigger detected for goal:', goalId);
                  startGoalCreation(goalId);
                  return; // No mostrar el mensaje del trigger
                }
              } catch (e) {
                console.error('[ASTAR-OPEN-CHAT] Error parsing goal ID:', e);
              }
            }
            
            // Mostrar mensaje normal del asistente
            var assistantDiv = document.createElement('div');
            assistantDiv.className = 'flex justify-start mb-3';
            var msgText = String(aiMessage).split(String.fromCharCode(92) + 'n').join('<br>').split(String.fromCharCode(10)).join('<br>');
            assistantDiv.innerHTML = '<div class="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[85%] shadow-sm"><p class="text-sm whitespace-pre-wrap">' + msgText + '<\/p><\/div>';
            chatMessages.appendChild(assistantDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            console.log('[ASTAR-OPEN-CHAT] Assistant message added');
          } else {
            console.warn('[ASTAR-OPEN-CHAT] Empty response, message was not generated by AI');
            
            // Show friendly error message
            var errorDiv = document.createElement('div');
            errorDiv.className = 'flex justify-start mb-3';
            errorDiv.innerHTML = '<div class="bg-yellow-100 text-yellow-800 rounded-lg px-4 py-2 max-w-[85%] shadow-sm"><p class="text-sm">[!] Could not process your response. Please write your question directly in the chat.<\/p><\/div>';
            chatMessages.appendChild(errorDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        })
        .catch(function(error) {
          console.error('[ASTAR-OPEN-CHAT] Error:', error);
          if (loading) loading.classList.add('hidden');
        });
      };
      
      // Load notifications after page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAstarNotifications);
      } else {
        setTimeout(loadAstarNotifications, 500);
      }
    })();
    </script>
</body>
</html>
  `;
}
