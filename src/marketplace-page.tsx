/**
 * ASTAR* Hub - Startup Dashboard
 * Dashboard with 4 tabs: Home, Traction, Inbox, Marketplace
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export interface MarketplacePageProps {
  userName: string;
  userAvatar?: string;
  userRole?: string;
}

export function getMarketplacePage(props: MarketplacePageProps): string {
  const { userName, userAvatar, userRole } = props;

  const content = `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Welcome back, ${userName}! 👋</h1>
        <p class="text-gray-500">Manage your startup growth and connect with validators</p>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div class="flex border-b border-gray-200">
          <button onclick="switchTab('home')" id="tab-home" class="tab-btn flex-1 px-6 py-4 text-sm font-semibold text-primary border-b-2 border-primary">
            <i class="fas fa-home mr-2"></i>Home
          </button>
          <button onclick="switchTab('traction')" id="tab-traction" class="tab-btn flex-1 px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            <i class="fas fa-chart-line mr-2"></i>Traction
          </button>
          <button onclick="switchTab('inbox')" id="tab-inbox" class="tab-btn flex-1 px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            <i class="fas fa-inbox mr-2"></i>Inbox
            <span id="unread-badge" class="hidden ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">0</span>
          </button>
          <button onclick="switchTab('marketplace')" id="tab-marketplace" class="tab-btn flex-1 px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            <i class="fas fa-store mr-2"></i>Marketplace
          </button>
        </div>
      </div>

      <!-- Tab Contents -->
      
      <!-- HOME TAB -->
      <div id="content-home" class="tab-content">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Goals</p>
                <p class="text-2xl font-bold text-gray-900" id="stat-goals">-</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-bullseye text-blue-600 text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2"><span id="stat-active">-</span> active</p>
          </div>
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Completion</p>
                <p class="text-2xl font-bold text-gray-900" id="stat-completion">-</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2"><span id="stat-completed">-</span> completed</p>
          </div>
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Users</p>
                <p class="text-2xl font-bold text-gray-900" id="stat-users">-</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-users text-purple-600 text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2" id="stat-users-growth">-</p>
          </div>
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Revenue</p>
                <p class="text-2xl font-bold text-gray-900" id="stat-revenue">-</p>
              </div>
              <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-dollar-sign text-yellow-600 text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2" id="stat-revenue-growth">-</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900">Active Goals</h3>
              <button onclick="switchTab('traction')" class="text-primary text-sm font-medium hover:underline">View all →</button>
            </div>
            <div id="home-goals" class="space-y-3">
              <div class="animate-pulse"><div class="h-12 bg-gray-200 rounded"></div></div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900">Recent Messages</h3>
              <button onclick="switchTab('inbox')" class="text-primary text-sm font-medium hover:underline">View all →</button>
            </div>
            <div id="home-messages" class="space-y-3">
              <div class="animate-pulse"><div class="h-12 bg-gray-200 rounded"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- TRACTION TAB -->
      <div id="content-traction" class="tab-content hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="font-bold text-gray-900 mb-4">User Growth</h3>
            <div class="h-64"><canvas id="chart-users"></canvas></div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="font-bold text-gray-900 mb-4">Revenue Growth</h3>
            <div class="h-64"><canvas id="chart-revenue"></canvas></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 class="font-bold text-gray-900">Goals</h3>
            <button onclick="openGoalModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold"><i class="fas fa-plus mr-2"></i>New Goal</button>
          </div>
          <div class="flex border-b border-gray-200 px-6">
            <button onclick="filterGoals('all')" id="filter-all" class="filter-btn px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">All</button>
            <button onclick="filterGoals('active')" id="filter-active" class="filter-btn px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent">Active</button>
            <button onclick="filterGoals('completed')" id="filter-completed" class="filter-btn px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent">Completed</button>
          </div>
          <div id="goals-list" class="p-6"></div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="font-bold text-gray-900 mb-4">Record Metric</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select id="metric-type" class="border border-gray-300 rounded-lg px-4 py-2">
              <option value="users">Users</option>
              <option value="revenue">Revenue ($)</option>
            </select>
            <input type="number" id="metric-value" placeholder="Value" min="0" class="border border-gray-300 rounded-lg px-4 py-2">
            <input type="date" id="metric-date" class="border border-gray-300 rounded-lg px-4 py-2">
            <button onclick="addMetric()" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold"><i class="fas fa-plus mr-2"></i>Add</button>
          </div>
        </div>
      </div>

      <!-- INBOX TAB -->
      <div id="content-inbox" class="tab-content hidden">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Conversations List -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200">
              <h3 class="font-bold text-gray-900">Conversations</h3>
            </div>
            <div id="conversations-list" class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              <div class="p-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading...</p>
              </div>
            </div>
          </div>
          
          <!-- Chat Area -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style="height: 600px;">
            <div id="chat-header" class="p-4 border-b border-gray-200">
              <p class="text-gray-500">Select a conversation</p>
            </div>
            <div id="chat-messages-area" class="flex-1 overflow-y-auto p-4 space-y-3">
              <div class="text-center text-gray-400 py-12">
                <i class="fas fa-comments text-5xl mb-4"></i>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
            <div id="chat-input-area" class="p-4 border-t border-gray-200 hidden">
              <div class="flex space-x-2">
                <input type="text" id="message-input" placeholder="Type a message..." class="flex-1 border border-gray-300 rounded-lg px-4 py-2" onkeypress="if(event.key==='Enter')sendMessage()">
                <button onclick="sendMessage()" class="bg-primary text-white px-4 py-2 rounded-lg"><i class="fas fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MARKETPLACE TAB -->
      <div id="content-marketplace" class="tab-content hidden">
        <div class="flex border-b border-gray-200 mb-6">
          <button onclick="showMarketplaceSection('products')" id="mp-products-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-primary border-b-2 border-primary">Products</button>
          <button onclick="showMarketplaceSection('validators')" id="mp-validators-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent">Validators</button>
        </div>

        <!-- Products Section -->
        <div id="mp-products" class="mp-section">
          <div class="flex justify-between items-center mb-6">
            <div class="flex space-x-4">
              <select id="product-category" onchange="loadProducts()" class="border border-gray-300 rounded-lg px-4 py-2">
                <option value="">All Categories</option>
                <option value="SaaS">SaaS</option>
                <option value="Mobile">Mobile</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Fintech">Fintech</option>
                <option value="Healthcare">Healthcare</option>
              </select>
              <select id="product-stage" onchange="loadProducts()" class="border border-gray-300 rounded-lg px-4 py-2">
                <option value="">All Stages</option>
                <option value="idea">Idea</option>
                <option value="mvp">MVP</option>
                <option value="beta">Beta</option>
                <option value="launched">Launched</option>
              </select>
            </div>
            <button onclick="openProductModal()" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold"><i class="fas fa-plus mr-2"></i>Add Product</button>
          </div>
          <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Validators Section -->
        <div id="mp-validators" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" id="validator-search" placeholder="Search validators..." onkeyup="searchValidators()" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="validators-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Modal -->
    <div id="goal-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">New Goal</h3>
          <button onclick="closeGoalModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <form onsubmit="createGoal(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" id="goal-description" required placeholder="e.g., Reach 1000 users" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <input type="number" id="goal-target" value="100" min="1" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Current</label>
                <input type="number" id="goal-current" value="0" min="0" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select id="goal-category" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="growth">Growth</option>
                <option value="revenue">Revenue</option>
                <option value="product">Product</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>
          <div class="flex space-x-3 mt-6">
            <button type="button" onclick="closeGoalModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold">Cancel</button>
            <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold">Create</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Product Modal -->
    <div id="product-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">Add Product</h3>
          <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <form onsubmit="createProduct(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" id="product-title" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea id="product-description" required rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select id="product-cat" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="SaaS">SaaS</option>
                  <option value="Mobile">Mobile</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stage *</label>
                <select id="product-stage-input" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="beta">Beta</option>
                  <option value="launched">Launched</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input type="url" id="product-url" placeholder="https://" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Looking for</label>
              <input type="text" id="product-looking" placeholder="e.g., Beta testers, feedback" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
          </div>
          <div class="flex space-x-3 mt-6">
            <button type="button" onclick="closeProductModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold">Cancel</button>
            <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold">Create</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      // Handle token from URL (OAuth redirect)
      (function() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          // Save to cookie
          document.cookie = 'authToken=' + urlToken + '; path=/; max-age=' + (60 * 60 * 24 * 7) + '; SameSite=Lax';
          // Save to localStorage as backup
          localStorage.setItem('authToken', urlToken);
          // Clean URL
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      })();
      
      // Helper to get auth token
      function getAuthToken() {
        const cookieMatch = document.cookie.match(/authToken=([^;]+)/);
        return cookieMatch ? cookieMatch[1] : localStorage.getItem('authToken');
      }
      
      axios.defaults.withCredentials = true;
      
      // Add auth token interceptor
      axios.interceptors.request.use(config => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      }, error => Promise.reject(error));
      
      let allGoals = [], metricsHistory = [], conversations = [], currentConversation = null;
      let currentFilter = 'all';
      let usersChart = null, revenueChart = null;

      // Tab switching
      function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-primary', 'border-primary');
          b.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById('tab-' + tab).classList.remove('text-gray-500', 'border-transparent');
        document.getElementById('tab-' + tab).classList.add('text-primary', 'border-primary');
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById('content-' + tab).classList.remove('hidden');
        
        if (tab === 'traction') setTimeout(initCharts, 100);
        if (tab === 'inbox') loadConversations();
        if (tab === 'marketplace') { loadProducts(); loadValidators(); }
      }

      // Load dashboard data
      async function loadDashboardData() {
        try {
          const [goalsRes, metricsRes] = await Promise.all([
            axios.get('/api/dashboard/goals'),
            axios.get('/api/dashboard/metrics-history')
          ]);
          allGoals = goalsRes.data.goals || [];
          metricsHistory = metricsRes.data.metricsHistory || [];
          updateStats();
          renderGoals();
          renderHomeGoals();
          document.getElementById('metric-date').value = new Date().toISOString().split('T')[0];
        } catch (e) { console.error('Error loading data:', e); }
      }

      function updateStats() {
        const active = allGoals.filter(g => g.status === 'active' || g.status === 'in_progress');
        const completed = allGoals.filter(g => g.status === 'completed');
        document.getElementById('stat-goals').textContent = allGoals.length;
        document.getElementById('stat-active').textContent = active.length;
        document.getElementById('stat-completed').textContent = completed.length;
        document.getElementById('stat-completion').textContent = allGoals.length > 0 ? Math.round((completed.length / allGoals.length) * 100) + '%' : '0%';
        
        const userM = metricsHistory.filter(m => m.metric_name === 'users').sort((a,b) => new Date(b.recorded_date) - new Date(a.recorded_date));
        const revM = metricsHistory.filter(m => m.metric_name === 'revenue').sort((a,b) => new Date(b.recorded_date) - new Date(a.recorded_date));
        document.getElementById('stat-users').textContent = (userM[0]?.metric_value || 0).toLocaleString();
        document.getElementById('stat-revenue').textContent = '$' + (revM[0]?.metric_value || 0).toLocaleString();
        
        if (userM.length >= 2) {
          const g = ((userM[0].metric_value - userM[1].metric_value) / (userM[1].metric_value || 1) * 100).toFixed(1);
          document.getElementById('stat-users-growth').textContent = (g >= 0 ? '+' : '') + g + '%';
          document.getElementById('stat-users-growth').className = g >= 0 ? 'text-xs text-green-600 mt-2' : 'text-xs text-red-600 mt-2';
        }
        if (revM.length >= 2) {
          const g = ((revM[0].metric_value - revM[1].metric_value) / (revM[1].metric_value || 1) * 100).toFixed(1);
          document.getElementById('stat-revenue-growth').textContent = (g >= 0 ? '+' : '') + g + '%';
          document.getElementById('stat-revenue-growth').className = g >= 0 ? 'text-xs text-green-600 mt-2' : 'text-xs text-red-600 mt-2';
        }
      }

      function filterGoals(filter) {
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('text-primary', 'border-primary');
          b.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById('filter-' + filter).classList.remove('text-gray-500', 'border-transparent');
        document.getElementById('filter-' + filter).classList.add('text-primary', 'border-primary');
        renderGoals();
      }

      function renderGoals() {
        let filtered = allGoals;
        if (currentFilter === 'active') filtered = allGoals.filter(g => g.status === 'active' || g.status === 'in_progress');
        if (currentFilter === 'completed') filtered = allGoals.filter(g => g.status === 'completed');
        
        const container = document.getElementById('goals-list');
        if (!filtered.length) {
          container.innerHTML = '<div class="text-center py-12 text-gray-500"><i class="fas fa-bullseye text-4xl mb-4 text-gray-300"></i><p>No goals found</p></div>';
          return;
        }
        
        container.innerHTML = filtered.map(g => {
          const progress = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
          const done = g.status === 'completed';
          return \`
            <div class="border border-gray-200 rounded-lg p-4 mb-3 \${done ? 'bg-gray-50' : ''}">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">\${g.category || 'general'}</span>
                  \${done ? '<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-1"><i class="fas fa-check mr-1"></i>Done</span>' : ''}
                </div>
                <div class="flex gap-2">
                  \${!done ? \`<button onclick="updateGoal(\${g.id}, \${g.current_value})" class="text-gray-400 hover:text-primary"><i class="fas fa-edit"></i></button>
                  <button onclick="completeGoal(\${g.id})" class="text-gray-400 hover:text-green-600"><i class="fas fa-check-circle"></i></button>\` : ''}
                  <button onclick="deleteGoal(\${g.id})" class="text-gray-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <h4 class="font-semibold \${done ? 'text-gray-500 line-through' : 'text-gray-900'}">\${g.description}</h4>
              <div class="flex items-center gap-4 mt-2">
                <div class="flex-1">
                  <div class="flex justify-between text-xs text-gray-500 mb-1"><span>\${g.current_value}/\${g.target_value}</span><span>\${progress}%</span></div>
                  <div class="h-2 bg-gray-200 rounded-full"><div class="h-full rounded-full \${done ? 'bg-green-500' : 'bg-primary'}" style="width:\${progress}%"></div></div>
                </div>
              </div>
            </div>\`;
        }).join('');
      }

      function renderHomeGoals() {
        const active = allGoals.filter(g => g.status === 'active' || g.status === 'in_progress').slice(0, 3);
        const container = document.getElementById('home-goals');
        if (!active.length) {
          container.innerHTML = '<div class="text-center py-6 text-gray-500"><p class="text-sm">No active goals</p><button onclick="switchTab(\\'traction\\'); setTimeout(openGoalModal, 100);" class="text-primary text-sm mt-2">Create your first goal</button></div>';
          return;
        }
        container.innerHTML = active.map(g => {
          const p = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
          return \`<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><div class="flex-1"><p class="text-sm font-medium text-gray-900 truncate">\${g.description}</p><div class="flex items-center gap-2 mt-1"><div class="flex-1 h-1.5 bg-gray-200 rounded-full"><div class="h-full bg-primary rounded-full" style="width:\${p}%"></div></div><span class="text-xs text-gray-500">\${p}%</span></div></div></div>\`;
        }).join('');
      }

      function initCharts() {
        const userM = metricsHistory.filter(m => m.metric_name === 'users').sort((a,b) => new Date(a.recorded_date) - new Date(b.recorded_date)).slice(-10);
        const revM = metricsHistory.filter(m => m.metric_name === 'revenue').sort((a,b) => new Date(a.recorded_date) - new Date(b.recorded_date)).slice(-10);
        
        const ctx1 = document.getElementById('chart-users');
        if (ctx1) {
          if (usersChart) usersChart.destroy();
          usersChart = new Chart(ctx1, {
            type: 'line',
            data: { labels: userM.map(m => new Date(m.recorded_date).toLocaleDateString()), datasets: [{ label: 'Users', data: userM.map(m => m.metric_value), borderColor: '#FF6154', backgroundColor: 'rgba(255,97,84,0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
          });
        }
        const ctx2 = document.getElementById('chart-revenue');
        if (ctx2) {
          if (revenueChart) revenueChart.destroy();
          revenueChart = new Chart(ctx2, {
            type: 'bar',
            data: { labels: revM.map(m => new Date(m.recorded_date).toLocaleDateString()), datasets: [{ label: 'Revenue', data: revM.map(m => m.metric_value), backgroundColor: '#FB651E', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
          });
        }
      }

      // Goal CRUD
      function openGoalModal() { document.getElementById('goal-modal').classList.remove('hidden'); document.getElementById('goal-modal').classList.add('flex'); }
      function closeGoalModal() { document.getElementById('goal-modal').classList.add('hidden'); document.getElementById('goal-modal').classList.remove('flex'); }
      
      async function createGoal(e) {
        e.preventDefault();
        try {
          await axios.post('/api/dashboard/goals', {
            description: document.getElementById('goal-description').value,
            target_value: parseInt(document.getElementById('goal-target').value) || 100,
            current_value: parseInt(document.getElementById('goal-current').value) || 0,
            category: document.getElementById('goal-category').value
          });
          closeGoalModal();
          document.getElementById('goal-description').value = '';
          await loadDashboardData();
        } catch (e) { alert('Error creating goal'); }
      }

      async function updateGoal(id, current) {
        const val = prompt('Enter current progress:', current);
        if (val === null) return;
        try { await axios.put('/api/dashboard/goals/' + id, { current_value: parseInt(val) }); await loadDashboardData(); } catch (e) { alert('Error'); }
      }
      async function completeGoal(id) { if (!confirm('Mark as completed?')) return; try { await axios.post('/api/dashboard/goals/complete', { goalId: id }); await loadDashboardData(); } catch (e) { alert('Error'); } }
      async function deleteGoal(id) { if (!confirm('Delete this goal?')) return; try { await axios.delete('/api/dashboard/goals/' + id); await loadDashboardData(); } catch (e) { alert('Error'); } }

      async function addMetric() {
        const type = document.getElementById('metric-type').value;
        const val = parseFloat(document.getElementById('metric-value').value);
        const date = document.getElementById('metric-date').value;
        if (isNaN(val) || val < 0) { alert('Invalid value'); return; }
        try {
          await axios.post('/api/dashboard/metrics', { metric_name: type, metric_value: val, recorded_date: date });
          document.getElementById('metric-value').value = '';
          await loadDashboardData();
          initCharts();
        } catch (e) { alert('Error'); }
      }

      // Inbox - Conversations
      async function loadConversations() {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          const res = await axios.get('/api/chat/conversations', { headers: { Authorization: 'Bearer ' + token } });
          conversations = res.data.conversations || [];
          renderConversations();
          renderHomeMessages();
          
          // Update unread badge
          const unread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
          const badge = document.getElementById('unread-badge');
          if (unread > 0) { badge.textContent = unread; badge.classList.remove('hidden'); }
          else { badge.classList.add('hidden'); }
        } catch (e) { 
          console.error('Error loading conversations:', e);
          document.getElementById('conversations-list').innerHTML = '<div class="p-8 text-center text-gray-500"><p>No conversations yet</p></div>';
        }
      }

      function renderConversations() {
        const container = document.getElementById('conversations-list');
        if (!conversations.length) {
          container.innerHTML = '<div class="p-8 text-center text-gray-500"><i class="fas fa-inbox text-4xl mb-4 text-gray-300"></i><p>No conversations yet</p></div>';
          return;
        }
        container.innerHTML = conversations.map(c => \`
          <div onclick="selectConversation(\${c.id})" class="p-4 hover:bg-gray-50 cursor-pointer \${currentConversation === c.id ? 'bg-primary/10' : ''}">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">\${(c.other_user_name || 'U')[0].toUpperCase()}</div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center">
                  <p class="font-semibold text-gray-900 truncate">\${c.other_user_name || 'User'}</p>
                  \${c.unread_count > 0 ? '<span class="bg-primary text-white text-xs rounded-full px-2 py-0.5">' + c.unread_count + '</span>' : ''}
                </div>
                <p class="text-sm text-gray-500 truncate">\${c.last_message || 'No messages yet'}</p>
              </div>
            </div>
          </div>
        \`).join('');
      }

      function renderHomeMessages() {
        const container = document.getElementById('home-messages');
        if (!conversations.length) {
          container.innerHTML = '<div class="text-center py-6 text-gray-500"><p class="text-sm">No messages yet</p></div>';
          return;
        }
        container.innerHTML = conversations.slice(0, 3).map(c => \`
          <div onclick="switchTab('inbox'); setTimeout(() => selectConversation(\${c.id}), 100);" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">\${(c.other_user_name || 'U')[0].toUpperCase()}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">\${c.other_user_name || 'User'}</p>
              <p class="text-xs text-gray-500 truncate">\${c.last_message || 'No messages'}</p>
            </div>
            \${c.unread_count > 0 ? '<span class="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">' + c.unread_count + '</span>' : ''}
          </div>
        \`).join('');
      }

      async function selectConversation(id) {
        currentConversation = id;
        const conv = conversations.find(c => c.id === id);
        document.getElementById('chat-header').innerHTML = \`<p class="font-bold text-gray-900">\${conv?.other_user_name || 'User'}</p><p class="text-sm text-gray-500">\${conv?.project_title || conv?.product_title || ''}</p>\`;
        document.getElementById('chat-input-area').classList.remove('hidden');
        renderConversations();
        
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          const res = await axios.get('/api/chat/conversations/' + id + '/messages', { headers: { Authorization: 'Bearer ' + token } });
          const messages = res.data.messages || [];
          const container = document.getElementById('chat-messages-area');
          if (!messages.length) {
            container.innerHTML = '<div class="text-center text-gray-400 py-12"><p>No messages yet. Start the conversation!</p></div>';
          } else {
            container.innerHTML = messages.map(m => \`
              <div class="flex \${m.sender_id === getCurrentUserId() ? 'justify-end' : 'justify-start'}">
                <div class="\${m.sender_id === getCurrentUserId() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-4 py-2 max-w-[70%]">
                  <p class="text-sm">\${m.message}</p>
                  <p class="text-xs opacity-70 mt-1">\${new Date(m.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            \`).join('');
            container.scrollTop = container.scrollHeight;
          }
          // Mark as read
          await axios.put('/api/chat/conversations/' + id + '/read', {}, { headers: { Authorization: 'Bearer ' + token } });
          loadConversations();
        } catch (e) { console.error('Error loading messages:', e); }
      }

      async function sendMessage() {
        const input = document.getElementById('message-input');
        const msg = input.value.trim();
        if (!msg || !currentConversation) return;
        
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          await axios.post('/api/chat/conversations/' + currentConversation + '/messages', { message: msg }, { headers: { Authorization: 'Bearer ' + token } });
          input.value = '';
          selectConversation(currentConversation);
        } catch (e) { alert('Error sending message'); }
      }

      function getCurrentUserId() {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) return null;
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.userId;
        } catch (e) { return null; }
      }

      // Marketplace
      function showMarketplaceSection(section) {
        document.querySelectorAll('.mp-btn').forEach(b => {
          b.classList.remove('text-primary', 'border-primary');
          b.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById('mp-' + section + '-btn').classList.remove('text-gray-500', 'border-transparent');
        document.getElementById('mp-' + section + '-btn').classList.add('text-primary', 'border-primary');
        document.querySelectorAll('.mp-section').forEach(s => s.classList.add('hidden'));
        document.getElementById('mp-' + section).classList.remove('hidden');
      }

      async function loadProducts() {
        const category = document.getElementById('product-category').value;
        const stage = document.getElementById('product-stage').value;
        try {
          const res = await axios.get('/api/marketplace/products', { params: { category, stage, limit: 20 } });
          const products = res.data.products || [];
          const container = document.getElementById('products-grid');
          if (!products.length) {
            container.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-500"><i class="fas fa-box-open text-4xl mb-4 text-gray-300"></i><p>No products found</p></div>';
            return;
          }
          container.innerHTML = products.map(p => \`
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">\${p.category}</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">\${p.stage}</span>
              </div>
              <h3 class="font-bold text-gray-900 mb-2">\${p.title}</h3>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">\${p.description}</p>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500"><i class="fas fa-user mr-1"></i>\${p.company_name || 'Unknown'}</span>
                <span class="text-primary font-medium">\${p.rating_average ? p.rating_average.toFixed(1) + '★' : 'New'}</span>
              </div>
            </div>
          \`).join('');
        } catch (e) { console.error('Error loading products:', e); }
      }

      async function loadValidators() {
        try {
          const res = await axios.get('/api/marketplace/validators', { params: { limit: 20 } });
          const validators = res.data.validators || [];
          const container = document.getElementById('validators-grid');
          if (!validators.length) {
            container.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-500"><i class="fas fa-users text-4xl mb-4 text-gray-300"></i><p>No validators found</p></div>';
            return;
          }
          container.innerHTML = validators.map(v => \`
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold">\${(v.name || 'V')[0].toUpperCase()}</div>
                <div>
                  <h3 class="font-bold text-gray-900">\${v.name || 'Validator'}</h3>
                  <p class="text-sm text-gray-500">\${v.title || 'Expert'}</p>
                </div>
              </div>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">\${v.bio || 'No bio available'}</p>
              <div class="flex justify-between items-center text-sm">
                <span class="text-yellow-500"><i class="fas fa-star mr-1"></i>\${v.rating ? v.rating.toFixed(1) : 'New'}</span>
                <span class="text-gray-500">\${v.total_validations || 0} validations</span>
              </div>
            </div>
          \`).join('');
        } catch (e) { console.error('Error loading validators:', e); }
      }

      function searchValidators() {
        const q = document.getElementById('validator-search').value;
        // Implement search
      }

      function openProductModal() { document.getElementById('product-modal').classList.remove('hidden'); document.getElementById('product-modal').classList.add('flex'); }
      function closeProductModal() { document.getElementById('product-modal').classList.add('hidden'); document.getElementById('product-modal').classList.remove('flex'); }

      async function createProduct(e) {
        e.preventDefault();
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          await axios.post('/api/marketplace/products', {
            title: document.getElementById('product-title').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-cat').value,
            stage: document.getElementById('product-stage-input').value,
            url: document.getElementById('product-url').value,
            looking_for: document.getElementById('product-looking').value
          }, { headers: { Authorization: 'Bearer ' + token } });
          closeProductModal();
          loadProducts();
        } catch (e) { alert('Error creating product'); }
      }

      // Initialize
      window.addEventListener('load', () => {
        loadDashboardData();
        loadConversations();
      });
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'marketplace',
    userName,
    userAvatar,
    pageTitle: 'Dashboard'
  });
}
