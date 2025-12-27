import { createLayoutWithSidebars } from './layout-with-sidebars';

export function getMarketplacePage(userName: string, userAvatar?: string, userRole?: string): string {
  // If user is a startup/founder, show the ASTAR Hub dashboard
  const isStartup = userRole === 'founder' || userRole === 'startup';
  
  const marketplaceContent = `
    <!-- ASTAR* Hub Dashboard for Startups -->
    <div class="p-6">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-black text-gray-900">Welcome to ASTAR<span class="text-primary">*</span> Hub</h1>
        <p class="text-gray-600 mt-2">Your startup command center - Track traction, manage goals, and connect with validators</p>
      </div>

      <!-- Dashboard Tabs -->
      <div class="border-b mb-6">
        <div class="flex space-x-6">
          <button onclick="showDashboardTab('home')" class="dashboard-tab dashboard-tab-active pb-3 px-2 font-bold transition border-b-2 border-primary text-primary" id="home-tab">
            <i class="fas fa-home mr-2"></i>Home
          </button>
          <button onclick="showDashboardTab('traction')" class="dashboard-tab pb-3 px-2 text-gray-600 hover:text-primary transition border-b-2 border-transparent font-bold" id="traction-tab">
            <i class="fas fa-chart-line mr-2"></i>Traction
          </button>
          <button onclick="showDashboardTab('inbox')" class="dashboard-tab pb-3 px-2 text-gray-600 hover:text-primary transition border-b-2 border-transparent font-bold" id="inbox-tab">
            <i class="fas fa-inbox mr-2"></i>Inbox
            <span id="inbox-badge" class="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center font-bold hidden">0</span>
          </button>
        </div>
      </div>

      <!-- HOME Tab Content -->
      <div id="home-content" class="dashboard-tab-content">
        <!-- Welcome Card & Quick Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Welcome Card -->
          <div class="lg:col-span-2 bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-black mb-2">Hello, ${userName}! 👋</h2>
                <p class="text-white/90 mb-4">Ready to grow your startup? Check your traction metrics and connect with validators.</p>
                <div class="flex space-x-3">
                  <button onclick="showDashboardTab('traction')" class="bg-white text-primary px-4 py-2 rounded-lg font-bold hover:shadow-lg transition">
                    <i class="fas fa-chart-line mr-2"></i>View Traction
                  </button>
                  <button onclick="showDashboardTab('inbox')" class="bg-white/20 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition">
                    <i class="fas fa-envelope mr-2"></i>Messages
                  </button>
                </div>
              </div>
              <div class="hidden md:block">
                <div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="fas fa-rocket text-4xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Score Card -->
          <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div class="flex items-center justify-center mb-2">
              <i class="fas fa-trophy text-yellow-500 text-2xl mr-2"></i>
              <span class="text-gray-600 font-semibold">Startup Score</span>
            </div>
            <div id="startup-score" class="text-5xl font-black text-gradient mb-2">--</div>
            <div class="flex items-center justify-center space-x-4 text-sm">
              <span class="flex items-center text-green-600">
                <i class="fas fa-check-circle mr-1"></i> <span id="completed-count">0</span> Done
              </span>
              <span class="flex items-center text-blue-600">
                <i class="fas fa-spinner mr-1"></i> <span id="active-count">0</span> Active
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-bullseye text-blue-600"></i>
              </div>
              <div>
                <p class="text-2xl font-black text-gray-900" id="total-goals">0</p>
                <p class="text-xs text-gray-600">Total Goals</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-users text-green-600"></i>
              </div>
              <div>
                <p class="text-2xl font-black text-gray-900" id="validator-count">0</p>
                <p class="text-xs text-gray-600">Validators</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-thumbs-up text-purple-600"></i>
              </div>
              <div>
                <p class="text-2xl font-black text-gray-900" id="feedback-count">0</p>
                <p class="text-xs text-gray-600">Feedbacks</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-fire text-orange-600"></i>
              </div>
              <div>
                <p class="text-2xl font-black text-gray-900" id="completion-rate">0%</p>
                <p class="text-xs text-gray-600">Completion</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity & Goals Preview -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Goals -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">
                <i class="fas fa-bullseye text-primary mr-2"></i>Recent Goals
              </h3>
              <button onclick="showDashboardTab('traction')" class="text-primary text-sm font-semibold hover:underline">
                View All <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            <div id="recent-goals-list" class="space-y-3">
              <div class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading goals...</p>
              </div>
            </div>
          </div>

          <!-- Recent Messages -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">
                <i class="fas fa-comments text-primary mr-2"></i>Recent Messages
              </h3>
              <button onclick="showDashboardTab('inbox')" class="text-primary text-sm font-semibold hover:underline">
                View All <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            <div id="recent-messages-list" class="space-y-3">
              <div class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading messages...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TRACTION Tab Content -->
      <div id="traction-content" class="dashboard-tab-content hidden">
        <!-- Traction Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Traction & Analytics</h2>
            <p class="text-gray-600">Track your startup growth and goal completion</p>
          </div>
          <button onclick="openCreateGoalModal()" class="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-bold hover:shadow-lg transition">
            <i class="fas fa-plus mr-2"></i>New Goal
          </button>
        </div>

        <!-- Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-bullseye text-blue-500 text-3xl"></i>
              <span class="text-xs text-green-600 font-semibold">↗ Progress</span>
            </div>
            <div class="text-3xl font-black text-gray-900 mb-1" id="traction-completion">0%</div>
            <div class="text-sm text-gray-600">Goal Completion</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-check-circle text-green-500 text-3xl"></i>
              <span class="text-xs text-green-600 font-semibold">✓ Done</span>
            </div>
            <div class="text-3xl font-black text-gray-900 mb-1" id="traction-completed">0</div>
            <div class="text-sm text-gray-600">Completed Goals</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-tasks text-purple-500 text-3xl"></i>
              <span class="text-xs text-blue-600 font-semibold">⚡ Active</span>
            </div>
            <div class="text-3xl font-black text-gray-900 mb-1" id="traction-active">0</div>
            <div class="text-sm text-gray-600">In Progress</div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
              <span class="text-xs text-red-600 font-semibold">⚠ Urgent</span>
            </div>
            <div class="text-3xl font-black text-gray-900 mb-1" id="traction-overdue">0</div>
            <div class="text-sm text-gray-600">Overdue</div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Goals Status Donut Chart -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <div class="flex items-center mb-4">
              <i class="fas fa-chart-pie text-blue-500 text-xl mr-3"></i>
              <h3 class="text-xl font-bold text-gray-900">Goals Status</h3>
            </div>
            <div class="flex items-center justify-center">
              <div class="relative w-48 h-48">
                <svg class="w-full h-full transform -rotate-90" id="goals-donut-chart">
                  <circle cx="96" cy="96" r="80" stroke="#e5e7eb" stroke-width="16" fill="none"/>
                  <circle 
                    id="donut-progress"
                    cx="96" cy="96" r="80" 
                    stroke="#10b981" 
                    stroke-width="16" 
                    fill="none"
                    stroke-dasharray="0 502.4"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-4xl font-black text-gray-900" id="donut-percentage">0%</div>
                    <div class="text-sm text-gray-600">Complete</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6 grid grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600" id="chart-completed">0</div>
                <div class="text-xs text-gray-600">Completed</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600" id="chart-in-progress">0</div>
                <div class="text-xs text-gray-600">In Progress</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600" id="chart-overdue">0</div>
                <div class="text-xs text-gray-600">Overdue</div>
              </div>
            </div>
          </div>

          <!-- Progress Over Time Bar Chart -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <div class="flex items-center mb-4">
              <i class="fas fa-chart-bar text-purple-500 text-xl mr-3"></i>
              <h3 class="text-xl font-bold text-gray-900">Progress Overview</h3>
            </div>
            <div id="progress-bar-chart" class="h-64 flex items-end justify-around space-x-2">
              <!-- Bars will be generated dynamically -->
              <div class="text-center py-12 text-gray-400 w-full">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading chart...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Goals List -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">
              <i class="fas fa-list-check text-primary mr-2"></i>All Goals
            </h3>
            <div class="flex space-x-2">
              <select id="goals-filter" onchange="filterGoals(this.value)" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="all">All Goals</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div id="goals-list" class="space-y-3">
            <div class="text-center py-12 text-gray-400">
              <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
              <p>Loading goals...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- INBOX Tab Content -->
      <div id="inbox-content" class="dashboard-tab-content hidden">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Conversations List -->
          <div class="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4">
            <div class="mb-4">
              <h3 class="text-lg font-bold text-gray-900 mb-3">
                <i class="fas fa-comments text-primary mr-2"></i>Conversations
              </h3>
              <input 
                type="text" 
                id="conversation-search"
                placeholder="Search conversations..." 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                onkeyup="searchConversations(this.value)"
              />
            </div>
            <div id="conversations-list" class="space-y-2 max-h-[500px] overflow-y-auto">
              <div class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading conversations...</p>
              </div>
            </div>
          </div>

          <!-- Active Conversation -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col" style="min-height: 600px;">
            <!-- Conversation Header -->
            <div id="conversation-header" class="p-4 border-b border-gray-200">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                  <i class="fas fa-user text-gray-400"></i>
                </div>
                <div>
                  <div class="font-bold text-gray-900 text-lg" id="conversation-name">Select a conversation</div>
                  <div class="text-sm text-gray-500" id="conversation-status">No conversation selected</div>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div id="messages-area" class="flex-1 overflow-y-auto p-4 space-y-4">
              <div class="text-center py-16 text-gray-400">
                <i class="fas fa-comments text-4xl mb-4"></i>
                <p class="font-semibold">Select a conversation to view messages</p>
                <p class="text-sm mt-2">Connect with validators and get feedback on your startup</p>
              </div>
            </div>

            <!-- Message Input -->
            <div class="p-4 border-t border-gray-200">
              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  id="message-input"
                  placeholder="Type your message..." 
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  onkeypress="if(event.key === 'Enter') sendMessage()"
                  disabled
                />
                <button 
                  id="send-message-btn"
                  onclick="sendMessage()" 
                  class="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
                  disabled
                >
                  <i class="fas fa-paper-plane mr-2"></i>Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Goal Modal -->
    <div id="create-goal-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">
              <i class="fas fa-bullseye text-primary mr-2"></i>Create New Goal
            </h3>
            <button onclick="closeCreateGoalModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form id="create-goal-form" onsubmit="submitGoal(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Goal Description *</label>
                <input 
                  type="text" 
                  id="goal-description" 
                  required
                  placeholder="e.g., Reach 1000 users"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Target Value *</label>
                  <input 
                    type="number" 
                    id="goal-target" 
                    required
                    placeholder="1000"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Current Value</label>
                  <input 
                    type="number" 
                    id="goal-current" 
                    value="0"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Deadline *</label>
                <input 
                  type="date" 
                  id="goal-deadline" 
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select id="goal-category" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="growth">Growth</option>
                  <option value="revenue">Revenue</option>
                  <option value="users">Users</option>
                  <option value="marketing">Marketing</option>
                  <option value="product">Product</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button type="button" onclick="closeCreateGoalModal()" class="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-bold hover:shadow-lg transition">
                <i class="fas fa-plus mr-2"></i>Create Goal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
      // Configure axios
      axios.defaults.withCredentials = true;

      // State
      let dashboardState = {
        goals: [],
        conversations: [],
        currentConversation: null,
        metrics: {
          total: 0,
          completed: 0,
          active: 0,
          overdue: 0,
          completion: 0
        }
      };

      // Tab switching
      function showDashboardTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.dashboard-tab-content').forEach(content => {
          content.classList.add('hidden');
        });

        // Remove active state from all tabs
        document.querySelectorAll('.dashboard-tab').forEach(btn => {
          btn.classList.remove('dashboard-tab-active', 'border-primary', 'text-primary');
          btn.classList.add('border-transparent', 'text-gray-600');
        });

        // Show selected tab content
        document.getElementById(tabName + '-content').classList.remove('hidden');

        // Add active state to selected tab
        const activeBtn = document.getElementById(tabName + '-tab');
        activeBtn.classList.add('dashboard-tab-active', 'border-primary', 'text-primary');
        activeBtn.classList.remove('border-transparent', 'text-gray-600');

        // Load data for the tab
        if (tabName === 'traction') {
          loadGoals();
        } else if (tabName === 'inbox') {
          loadConversations();
        } else if (tabName === 'home') {
          loadDashboardData();
        }
      }

      // Load dashboard home data
      async function loadDashboardData() {
        try {
          await loadGoals();
          await loadRecentMessages();
          updateHomeStats();
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        }
      }

      // Load goals
      async function loadGoals() {
        try {
          const response = await axios.get('/api/dashboard/goals');
          dashboardState.goals = response.data.goals || [];
          calculateMetrics();
          renderGoals();
          updateCharts();
          updateRecentGoals();
        } catch (error) {
          console.error('Error loading goals:', error);
          document.getElementById('goals-list').innerHTML = \`
            <div class="text-center py-12 text-gray-400">
              <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
              <p>Failed to load goals</p>
              <button onclick="loadGoals()" class="mt-2 text-primary hover:underline">Try again</button>
            </div>
          \`;
        }
      }

      // Calculate metrics from goals
      function calculateMetrics() {
        const goals = dashboardState.goals;
        const now = new Date();
        
        const completed = goals.filter(g => g.status === 'completed').length;
        const active = goals.filter(g => g.status === 'in_progress' || g.status === 'active').length;
        const overdue = goals.filter(g => 
          g.status !== 'completed' && new Date(g.deadline) < now
        ).length;
        const total = goals.length;
        const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

        dashboardState.metrics = { total, completed, active, overdue, completion };
      }

      // Update home stats
      function updateHomeStats() {
        const { total, completed, active, completion } = dashboardState.metrics;
        
        document.getElementById('startup-score').textContent = completion;
        document.getElementById('completed-count').textContent = completed;
        document.getElementById('active-count').textContent = active;
        document.getElementById('total-goals').textContent = total;
        document.getElementById('completion-rate').textContent = completion + '%';
        document.getElementById('validator-count').textContent = dashboardState.conversations.length || 0;
      }

      // Update recent goals on home
      function updateRecentGoals() {
        const container = document.getElementById('recent-goals-list');
        const recentGoals = dashboardState.goals.slice(0, 3);

        if (recentGoals.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-bullseye text-2xl mb-2"></i>
              <p>No goals yet</p>
              <button onclick="openCreateGoalModal()" class="mt-2 text-primary hover:underline font-semibold">Create your first goal</button>
            </div>
          \`;
          return;
        }

        container.innerHTML = recentGoals.map(goal => {
          const progress = goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
          const statusClass = goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400';
          
          return \`
            <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span class="w-3 h-3 rounded-full \${statusClass} mr-3"></span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate">\${goal.description}</p>
                <div class="flex items-center text-xs text-gray-600">
                  <span>\${goal.current_value}/\${goal.target_value}</span>
                  <span class="mx-2">•</span>
                  <span>\${progress}%</span>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      }

      // Render goals list
      function renderGoals(filter = 'all') {
        const container = document.getElementById('goals-list');
        let goals = dashboardState.goals;

        // Apply filter
        if (filter === 'active') {
          goals = goals.filter(g => g.status === 'in_progress' || g.status === 'active');
        } else if (filter === 'completed') {
          goals = goals.filter(g => g.status === 'completed');
        } else if (filter === 'overdue') {
          const now = new Date();
          goals = goals.filter(g => g.status !== 'completed' && new Date(g.deadline) < now);
        }

        if (goals.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-12 text-gray-400">
              <i class="fas fa-inbox text-4xl mb-4"></i>
              <p>No goals found</p>
              <button onclick="openCreateGoalModal()" class="mt-2 text-primary hover:underline font-semibold">Create a new goal</button>
            </div>
          \`;
          return;
        }

        container.innerHTML = goals.map(goal => {
          const progress = goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
          const statusClass = goal.status === 'completed' ? 'bg-green-500' : goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400';
          const statusBadge = goal.status === 'completed' ? 'bg-green-100 text-green-800' : goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
          const statusText = goal.status === 'completed' ? 'Completed' : goal.status === 'in_progress' ? 'In Progress' : 'Pending';
          
          return \`
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <span class="w-3 h-3 rounded-full \${statusClass} mr-3"></span>
                  <h4 class="font-semibold text-gray-900">\${goal.description}</h4>
                  <span class="ml-2 px-2 py-1 text-xs font-bold rounded \${statusBadge}">\${statusText}</span>
                </div>
                <div class="ml-6">
                  <div class="flex items-center text-sm text-gray-600 mb-2">
                    <span class="mr-4">Target: \${goal.target_value}</span>
                    <span>Current: \${goal.current_value}</span>
                    <span class="ml-4 text-primary font-semibold">\${progress}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full \${statusClass}" style="width: \${Math.min(progress, 100)}%"></div>
                  </div>
                </div>
              </div>
              <div class="text-right ml-4">
                <div class="text-sm font-semibold text-gray-900">\${formatDate(goal.deadline)}</div>
                <div class="text-xs text-gray-500 mt-1">Deadline</div>
              </div>
            </div>
          \`;
        }).join('');
      }

      // Filter goals
      function filterGoals(filter) {
        renderGoals(filter);
      }

      // Update charts
      function updateCharts() {
        const { completed, active, overdue, completion } = dashboardState.metrics;

        // Update traction metrics
        document.getElementById('traction-completion').textContent = completion + '%';
        document.getElementById('traction-completed').textContent = completed;
        document.getElementById('traction-active').textContent = active;
        document.getElementById('traction-overdue').textContent = overdue;

        // Update donut chart
        const circumference = 502.4;
        const dashArray = (completion / 100) * circumference;
        document.getElementById('donut-progress').setAttribute('stroke-dasharray', dashArray + ' ' + circumference);
        document.getElementById('donut-percentage').textContent = completion + '%';
        document.getElementById('chart-completed').textContent = completed;
        document.getElementById('chart-in-progress').textContent = active;
        document.getElementById('chart-overdue').textContent = overdue;

        // Update progress bar chart
        renderProgressBarChart();
      }

      // Render progress bar chart
      function renderProgressBarChart() {
        const container = document.getElementById('progress-bar-chart');
        const goals = dashboardState.goals.slice(0, 7);

        if (goals.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-12 text-gray-400 w-full">
              <i class="fas fa-chart-bar text-4xl mb-2"></i>
              <p>No data to display</p>
            </div>
          \`;
          return;
        }

        container.innerHTML = goals.map((goal, index) => {
          const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
          return \`
            <div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-gray-200 rounded-t-lg overflow-hidden" style="height: 200px">
                <div 
                  class="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all"
                  style="height: \${progress}%; margin-top: \${100 - progress}%"
                ></div>
              </div>
              <div class="text-xs text-gray-600 mt-2">G\${index + 1}</div>
            </div>
          \`;
        }).join('');
      }

      // Load conversations for inbox
      async function loadConversations() {
        try {
          const response = await axios.get('/api/chat/conversations');
          dashboardState.conversations = response.data.conversations || [];
          renderConversations();
        } catch (error) {
          console.error('Error loading conversations:', error);
          // Show sample conversations for demo
          dashboardState.conversations = [
            { id: 1, name: 'Beta Validator Team', lastMessage: 'When can we schedule the validation session?', time: '5 min ago', unread: 2, avatar: 'B' },
            { id: 2, name: 'Startup Tech Co.', lastMessage: 'Thanks for your detailed feedback...', time: '2 hours ago', unread: 0, avatar: 'S' },
            { id: 3, name: 'AI Product Labs', lastMessage: 'We have implemented the suggestions...', time: 'yesterday', unread: 0, avatar: 'A' }
          ];
          renderConversations();
        }
      }

      // Render conversations
      function renderConversations() {
        const container = document.getElementById('conversations-list');
        const conversations = dashboardState.conversations;

        if (conversations.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-inbox text-2xl mb-2"></i>
              <p>No conversations yet</p>
            </div>
          \`;
          return;
        }

        container.innerHTML = conversations.map(conv => \`
          <div 
            class="p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition \${dashboardState.currentConversation?.id === conv.id ? 'bg-primary/10' : ''}"
            onclick="selectConversation(\${conv.id})"
          >
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">
                \${conv.avatar || conv.name.charAt(0)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-gray-900 truncate">\${conv.name}</div>
                <div class="text-xs text-gray-600">\${conv.time}</div>
              </div>
              \${conv.unread > 0 ? \`<span class="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">\${conv.unread}</span>\` : ''}
            </div>
            <p class="text-sm text-gray-600 truncate">\${conv.lastMessage}</p>
          </div>
        \`).join('');

        // Update inbox badge
        const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
        const badge = document.getElementById('inbox-badge');
        if (totalUnread > 0) {
          badge.textContent = totalUnread;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      // Select conversation
      function selectConversation(conversationId) {
        const conversation = dashboardState.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        dashboardState.currentConversation = conversation;
        
        // Update header
        document.getElementById('conversation-name').textContent = conversation.name;
        document.getElementById('conversation-status').innerHTML = '<i class="fas fa-circle text-green-500 text-xs mr-1"></i>Online';
        
        // Enable input
        document.getElementById('message-input').disabled = false;
        document.getElementById('send-message-btn').disabled = false;

        // Load messages (demo)
        loadMessages(conversationId);

        // Re-render conversations to show active state
        renderConversations();
      }

      // Load messages for a conversation
      async function loadMessages(conversationId) {
        const container = document.getElementById('messages-area');
        
        // Demo messages
        container.innerHTML = \`
          <div class="flex">
            <div class="bg-gray-100 rounded-lg p-3 max-w-[70%]">
              <p class="text-sm text-gray-900">Hi! I saw your product in the marketplace and I'm interested in validating it.</p>
              <span class="text-xs text-gray-500 mt-1 block">10:30 AM</span>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-3 max-w-[70%]">
              <p class="text-sm">Excellent! What aspects would you like to validate specifically?</p>
              <span class="text-xs text-white/80 mt-1 block">10:32 AM</span>
            </div>
          </div>
          <div class="flex">
            <div class="bg-gray-100 rounded-lg p-3 max-w-[70%]">
              <p class="text-sm text-gray-900">I'd like to focus on UX/UI and the onboarding flow.</p>
              <span class="text-xs text-gray-500 mt-1 block">10:35 AM</span>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-3 max-w-[70%]">
              <p class="text-sm">Perfect. When can we schedule the session?</p>
              <span class="text-xs text-white/80 mt-1 block">10:36 AM</span>
            </div>
          </div>
        \`;

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
      }

      // Load recent messages for home
      async function loadRecentMessages() {
        const container = document.getElementById('recent-messages-list');
        
        try {
          // Try to load from API
          const response = await axios.get('/api/chat/conversations');
          const conversations = response.data.conversations || [];
          
          if (conversations.length === 0) {
            container.innerHTML = \`
              <div class="text-center py-8 text-gray-400">
                <i class="fas fa-comments text-2xl mb-2"></i>
                <p>No messages yet</p>
              </div>
            \`;
            return;
          }

          container.innerHTML = conversations.slice(0, 3).map(conv => \`
            <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="showDashboardTab('inbox')">
              <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">
                \${conv.avatar || conv.name.charAt(0)}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate">\${conv.name}</p>
                <p class="text-sm text-gray-600 truncate">\${conv.lastMessage}</p>
              </div>
            </div>
          \`).join('');
        } catch (error) {
          // Show demo messages
          container.innerHTML = \`
            <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="showDashboardTab('inbox')">
              <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">B</div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate">Beta Validator Team</p>
                <p class="text-sm text-gray-600 truncate">When can we schedule?</p>
              </div>
            </div>
            <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="showDashboardTab('inbox')">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">S</div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate">Startup Tech Co.</p>
                <p class="text-sm text-gray-600 truncate">Thanks for the feedback!</p>
              </div>
            </div>
          \`;
        }
      }

      // Search conversations
      function searchConversations(query) {
        // Simple client-side search
        const filtered = dashboardState.conversations.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(query.toLowerCase())
        );
        
        const container = document.getElementById('conversations-list');
        if (filtered.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-search text-2xl mb-2"></i>
              <p>No results found</p>
            </div>
          \`;
          return;
        }

        container.innerHTML = filtered.map(conv => \`
          <div 
            class="p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition"
            onclick="selectConversation(\${conv.id})"
          >
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">
                \${conv.avatar || conv.name.charAt(0)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-gray-900 truncate">\${conv.name}</div>
                <div class="text-xs text-gray-600">\${conv.time}</div>
              </div>
            </div>
            <p class="text-sm text-gray-600 truncate">\${conv.lastMessage}</p>
          </div>
        \`).join('');
      }

      // Send message
      async function sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || !dashboardState.currentConversation) return;

        // Add message to UI
        const container = document.getElementById('messages-area');
        container.innerHTML += \`
          <div class="flex justify-end">
            <div class="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-3 max-w-[70%]">
              <p class="text-sm">\${message}</p>
              <span class="text-xs text-white/80 mt-1 block">\${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        \`;

        // Clear input
        input.value = '';

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Send to API (if available)
        try {
          await axios.post('/api/chat/send', {
            conversationId: dashboardState.currentConversation.id,
            message
          });
        } catch (error) {
          console.log('Message sent (demo mode)');
        }
      }

      // Goal Modal functions
      function openCreateGoalModal() {
        document.getElementById('create-goal-modal').classList.remove('hidden');
        // Set default deadline to 30 days from now
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        document.getElementById('goal-deadline').value = deadline.toISOString().split('T')[0];
      }

      function closeCreateGoalModal() {
        document.getElementById('create-goal-modal').classList.add('hidden');
        document.getElementById('create-goal-form').reset();
      }

      async function submitGoal(event) {
        event.preventDefault();
        
        const description = document.getElementById('goal-description').value;
        const targetValue = parseInt(document.getElementById('goal-target').value);
        const currentValue = parseInt(document.getElementById('goal-current').value) || 0;
        const deadline = document.getElementById('goal-deadline').value;
        const category = document.getElementById('goal-category').value;

        try {
          await axios.post('/api/dashboard/goals', {
            description,
            target_value: targetValue,
            current_value: currentValue,
            deadline,
            category
          });

          closeCreateGoalModal();
          loadGoals();
          alert('Goal created successfully!');
        } catch (error) {
          console.error('Error creating goal:', error);
          alert('Failed to create goal. Please try again.');
        }
      }

      // Helper function
      function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      // Initialize on page load
      window.addEventListener('load', () => {
        loadDashboardData();
      });
    </script>
  `;

  return createLayoutWithSidebars({
    content: marketplaceContent,
    currentPage: 'marketplace',
    userName: userName,
    userAvatar: userAvatar,
    pageTitle: 'ASTAR Hub'
  });
}
