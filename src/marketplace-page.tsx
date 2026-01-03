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
        
        <!-- Goals Table Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 class="font-bold text-gray-900 text-xl">GOAL OF THE WEEK:</h3>
              <div class="flex gap-2 mt-2 text-sm">
                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">P0 - Urgent & important</span>
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">P1 - Urgent or important</span>
                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">P2 - Urgent but not important</span>
                <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">P3 - Neither but cool</span>
              </div>
            </div>
            <button onclick="openGoalModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              <i class="fas fa-plus mr-2"></i>New Goal
            </button>
          </div>
          
          <!-- Goals Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Task</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Priority</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Cadence</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">DRI</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" colspan="3">December 30</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
                <tr class="bg-purple-500">
                  <th colspan="7"></th>
                  <th class="px-2 py-2 text-center text-xs font-medium">MON</th>
                  <th class="px-2 py-2 text-center text-xs font-medium">TUE</th>
                  <th class="px-2 py-2 text-center text-xs font-medium">WED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="goals-table-body" class="divide-y divide-gray-200 bg-white">
                <tr>
                  <td colspan="11" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Loading goals...</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900">Quick Stats</h3>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span class="text-sm text-gray-700">Total Goals</span>
                <span id="quick-total-goals" class="font-bold text-purple-600">0</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span class="text-sm text-gray-700">Completed This Week</span>
                <span id="quick-completed-goals" class="font-bold text-green-600">0</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span class="text-sm text-gray-700">In Progress</span>
                <span id="quick-wip-goals" class="font-bold text-yellow-600">0</span>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900">Recent Messages</h3>
              <button onclick="switchTab('inbox')" class="text-purple-600 text-sm font-medium hover:underline">View all →</button>
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
        <div class="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button onclick="showMarketplaceSection('products')" id="mp-products-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-primary border-b-2 border-primary whitespace-nowrap">Products</button>
          <button onclick="showMarketplaceSection('founders')" id="mp-founders-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Founders</button>
          <button onclick="showMarketplaceSection('investors')" id="mp-investors-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Investors</button>
          <button onclick="showMarketplaceSection('validators')" id="mp-validators-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Validators</button>
          <button onclick="showMarketplaceSection('scouts')" id="mp-scouts-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Scouts</button>
          <button onclick="showMarketplaceSection('partners')" id="mp-partners-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Partners</button>
          <button onclick="showMarketplaceSection('talent')" id="mp-talent-btn" class="mp-btn px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Talent</button>
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
            <input type="text" id="validator-search" placeholder="Search validators..." onkeyup="searchUsers('validators')" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="validators-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Founders Section -->
        <div id="mp-founders" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" placeholder="Search founders..." onkeyup="searchUsers('founders')" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="founders-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Investors Section -->
        <div id="mp-investors" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" placeholder="Search investors..." onkeyup="searchUsers('investors')" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="investors-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Scouts Section -->
        <div id="mp-scouts" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" placeholder="Search scouts..." onkeyup="searchUsers('scouts')" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="scouts-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Partners Section -->
        <div id="mp-partners" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" placeholder="Search partners..." onkeyup="searchUsers('partners')" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="partners-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Talent Section -->
        <div id="mp-talent" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" placeholder="Search talent..." onkeyup="searchUsers('talent')" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div id="talent-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Modal -->
    <div id="goal-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">
      <div class="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900">New Goal</h3>
          <button onclick="closeGoalModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <form onsubmit="createGoal(event)">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select id="goal-category" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="ASTAR">ASTAR</option>
                  <option value="MAGCIENT">MAGCIENT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select id="goal-priority" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="P0">P0 - Urgent & important</option>
                  <option value="P1">P1 - Urgent or important</option>
                  <option value="P2">P2 - Urgent but not important</option>
                  <option value="P3">P3 - Neither but cool</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input type="text" id="goal-description" required placeholder="e.g., Product Design Roadmap for Cerios" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Task *</label>
              <input type="text" id="goal-task" required placeholder="e.g., Create Marketing Plan Structure" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cadence</label>
                <select id="goal-cadence" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="One time">One time</option>
                  <option value="Recurrent">Recurrent</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">DRI</label>
                <input type="text" id="goal-dri" required placeholder="Responsible person" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="goal-status" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="To start">To start</option>
                  <option value="WIP">WIP</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Week Of</label>
              <input type="text" id="goal-week" placeholder="e.g., December 30" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
          </div>
          <div class="flex space-x-3 mt-6">
            <button type="button" onclick="closeGoalModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">Create Goal</button>
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
        
        // Render goals table
        renderGoalsTable();
        
        // Update quick stats
        const completed = allGoals.filter(g => g.goal_status === 'Done' || g.status === 'completed');
        const wip = allGoals.filter(g => g.goal_status === 'WIP');
        document.getElementById('quick-total-goals').textContent = allGoals.length;
        document.getElementById('quick-completed-goals').textContent = completed.length;
        document.getElementById('quick-wip-goals').textContent = wip.length;
        
        const container = document.getElementById('home-messages');
        if (!active.length) {
          container.innerHTML = '<div class="text-center py-6 text-gray-500"><p class="text-sm">No active goals</p><button onclick="switchTab(\\'traction\\'); setTimeout(openGoalModal, 100);" class="text-purple-600 text-sm mt-2">Create your first goal</button></div>';
          return;
        }
        container.innerHTML = '<div class="text-center py-6 text-gray-400"><i class="fas fa-inbox text-3xl mb-2"></i><p class="text-sm">No messages yet</p></div>';
      }

      function renderGoalsTable() {
        const tbody = document.getElementById('goals-table-body');
        if (!allGoals.length) {
          tbody.innerHTML = \`
            <tr>
              <td colspan="11" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-bullseye text-4xl mb-2 text-gray-300"></i>
                <p>No goals yet</p>
                <button onclick="openGoalModal()" class="text-purple-600 text-sm mt-2 hover:underline">Create your first goal</button>
              </td>
            </tr>
          \`;
          return;
        }

        // Group goals by category
        const categories = {};
        allGoals.forEach(goal => {
          const cat = goal.category || 'ASTAR';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(goal);
        });

        tbody.innerHTML = Object.entries(categories).map(([category, goals]) => {
          const categoryColor = category === 'ASTAR' ? 'bg-blue-50' : category === 'MAGCIENT' ? 'bg-red-50' : 'bg-gray-50';
          const categoryRows = goals.sort((a, b) => {
            const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
            return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99) || (a.order_index || 0) - (b.order_index || 0);
          });

          return categoryRows.map((goal, idx) => {
            const priorityColors = {
              'P0': 'bg-yellow-100 text-yellow-800',
              'P1': 'bg-blue-100 text-blue-800',
              'P2': 'bg-green-100 text-green-800',
              'P3': 'bg-gray-100 text-gray-800'
            };
            const statusColors = {
              'WIP': 'bg-blue-100 text-blue-800',
              'To start': 'bg-yellow-100 text-yellow-800',
              'On Hold': 'bg-orange-100 text-orange-800',
              'Delayed': 'bg-red-100 text-red-800',
              'Blocked': 'bg-red-200 text-red-900',
              'Done': 'bg-green-100 text-green-800'
            };

            return \`
              <tr class="\${idx === 0 ? categoryColor : 'hover:bg-gray-50'}">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">\${idx === 0 ? category : ''}</td>
                <td class="px-4 py-3 text-sm text-gray-700">\${goal.description || ''}</td>
                <td class="px-4 py-3 text-sm text-gray-900 font-medium">\${goal.task || goal.description || ''}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs font-medium rounded-full \${priorityColors[goal.priority] || 'bg-gray-100 text-gray-800'}">
                    \${goal.priority || 'P0'}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">\${goal.cadence || 'One time'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">\${goal.dri || 'Giorgio'}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs font-medium rounded-full \${statusColors[goal.goal_status] || 'bg-gray-100 text-gray-800'}">
                    \${goal.goal_status || 'To start'}
                  </span>
                </td>
                <td class="px-2 py-3 text-center">
                  <button onclick="toggleDay(\${goal.id}, 'day_mon')" class="w-8 h-8 rounded \${goal.day_mon ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} hover:opacity-80">
                    \${goal.day_mon || 0}
                  </button>
                </td>
                <td class="px-2 py-3 text-center">
                  <button onclick="toggleDay(\${goal.id}, 'day_tue')" class="w-8 h-8 rounded \${goal.day_tue ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} hover:opacity-80">
                    \${goal.day_tue || 0}
                  </button>
                </td>
                <td class="px-2 py-3 text-center">
                  <button onclick="toggleDay(\${goal.id}, 'day_wed')" class="w-8 h-8 rounded \${goal.day_wed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} hover:opacity-80">
                    \${goal.day_wed || 0}
                  </button>
                </td>
                <td class="px-2 py-3 text-center">
                  <div class="flex gap-1 justify-center">
                    <button onclick="editGoal(\${goal.id})" class="text-gray-400 hover:text-purple-600">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGoal(\${goal.id})" class="text-gray-400 hover:text-red-600">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            \`;
          }).join('');
        }).join('');
      }

      window.toggleDay = async function(goalId, dayField) {
        try {
          const goal = allGoals.find(g => g.id === goalId);
          if (!goal) return;
          
          const newValue = goal[dayField] ? 0 : 1;
          await axios.put(\`/api/dashboard/goals/\${goalId}\`, { [dayField]: newValue });
          goal[dayField] = newValue;
          renderGoalsTable();
        } catch (e) {
          console.error('Error toggling day:', e);
          alert('Failed to update goal');
        }
      };

      window.editGoal = function(goalId) {
        const goal = allGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        // Populate modal with existing goal data
        document.getElementById('goal-description').value = goal.description || '';
        document.getElementById('goal-task').value = goal.task || '';
        document.getElementById('goal-category').value = goal.category || 'OTHER';
        document.getElementById('goal-priority').value = goal.priority || 'P2';
        document.getElementById('goal-cadence').value = goal.cadence || 'One time';
        document.getElementById('goal-dri').value = goal.dri || '';
        document.getElementById('goal-status').value = goal.goal_status || 'To start';
        document.getElementById('goal-week').value = goal.week_of || '';
        
        // Change modal title and button text
        const modalTitle = document.querySelector('#goal-modal h3');
        if (modalTitle) modalTitle.textContent = 'Edit Goal';
        
        const submitBtn = document.querySelector('#goal-modal button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Goal';
        
        // Store goal ID for update
        const form = document.getElementById('goal-form');
        form.dataset.editingGoalId = goalId;
        
        // Open modal
        openGoalModal();
      };

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
      function openGoalModal() { 
        // Reset modal to create mode
        const modalTitle = document.querySelector('#goal-modal h3');
        if (modalTitle) modalTitle.textContent = 'Create New Goal';
        
        const submitBtn = document.querySelector('#goal-modal button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create Goal';
        
        const form = document.getElementById('goal-form');
        delete form.dataset.editingGoalId;
        form.reset();
        
        document.getElementById('goal-modal').classList.remove('hidden'); 
        document.getElementById('goal-modal').classList.add('flex'); 
      }
      
      function closeGoalModal() { 
        const form = document.getElementById('goal-form');
        delete form.dataset.editingGoalId;
        form.reset();
        
        document.getElementById('goal-modal').classList.add('hidden'); 
        document.getElementById('goal-modal').classList.remove('flex'); 
      }
      
      async function createGoal(e) {
        e.preventDefault();
        try {
          const priority = document.getElementById('goal-priority').value;
          const priorityLabels = {
            'P0': 'Urgent & important',
            'P1': 'Urgent or important',
            'P2': 'Urgent but not important',
            'P3': 'Neither but cool'
          };
          
          const goalData = {
            description: document.getElementById('goal-description').value,
            task: document.getElementById('goal-task').value,
            category: document.getElementById('goal-category').value,
            priority: priority,
            priority_label: priorityLabels[priority],
            cadence: document.getElementById('goal-cadence').value,
            dri: document.getElementById('goal-dri').value,
            goal_status: document.getElementById('goal-status').value,
            week_of: document.getElementById('goal-week').value || null,
            target_value: 100,
            current_value: 0
          };
          
          // Check if editing existing goal
          const form = document.getElementById('goal-form');
          const editingGoalId = form ? form.dataset.editingGoalId : null;
          
          if (editingGoalId) {
            // Update existing goal
            await axios.put('/api/dashboard/goals/' + editingGoalId, goalData);
          } else {
            // Create new goal
            await axios.post('/api/dashboard/goals', goalData);
          }
          
          closeGoalModal();
          await loadDashboardData();
        } catch (e) { 
          console.error('Error saving goal:', e);
          alert('Error saving goal'); 
        }
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
        
        // If conversation not found in list (new conversation), fetch it directly
        if (!conv) {
          console.log('Conversation not in list, fetching directly:', id);
          try {
            const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
            const res = await axios.get('/api/chat/conversations/' + id, { headers: { Authorization: 'Bearer ' + token } });
            if (res.data) {
              document.getElementById('chat-header').innerHTML = \`<p class="font-bold text-gray-900">\${res.data.other_user_name || 'User'}</p><p class="text-sm text-gray-500">New conversation</p>\`;
            }
          } catch (e) {
            console.error('Error fetching conversation:', e);
            document.getElementById('chat-header').innerHTML = \`<p class="font-bold text-gray-900">Chat</p>\`;
          }
        } else {
          document.getElementById('chat-header').innerHTML = \`<p class="font-bold text-gray-900">\${conv?.other_user_name || 'User'}</p><p class="text-sm text-gray-500">\${conv?.project_title || conv?.product_title || ''}</p>\`;
        }
        
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

      // Alias for compatibility
      function loadConversation(id) {
        return selectConversation(id);
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
        
        // Load data for the section
        if (section === 'validators') loadValidators();
        else if (section === 'founders') loadUsersByRole('founder', 'founders-grid');
        else if (section === 'investors') loadUsersByRole('investor', 'investors-grid');
        else if (section === 'scouts') loadUsersByRole('scout', 'scouts-grid');
        else if (section === 'partners') loadUsersByRole('partner', 'partners-grid');
        else if (section === 'talent') loadUsersByRole('job_seeker', 'talent-grid');
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
              <div class="flex items-center justify-between mb-3">
                <span class="text-gray-500 text-sm"><i class="fas fa-user mr-1"></i>\${p.company_name || 'Unknown'}</span>
                <div class="flex items-center gap-1">
                  <span class="text-yellow-500 font-bold">\${p.rating_average ? p.rating_average.toFixed(1) : '0.0'}</span>
                  <i class="fas fa-star text-yellow-500"></i>
                  <span class="text-gray-400 text-sm">(\${p.votes_count || 0})</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button onclick="viewProductDetail(\${p.id})" class="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
                  <i class="fas fa-eye mr-1"></i>Ver detalle
                </button>
                <button onclick="voteProduct(\${p.id})" class="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition" title="Votar">
                  <i class="fas fa-star"></i>
                </button>
              </div>
            </div>
          \`).join('');
        } catch (e) { console.error('Error loading products:', e); }
      }

      async function loadValidators() {
        try {
          const res = await axios.get('/api/validation/validators');
          const validators = res.data || [];
          const container = document.getElementById('validators-grid');
          if (!validators.length) {
            container.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-500"><i class="fas fa-users text-4xl mb-4 text-gray-300"></i><p>No validators available</p></div>';
            return;
          }
          container.innerHTML = validators.map(v => {
            const avatarUrl = v.avatar_url || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(v.name || 'V')}&background=6366f1&color=fff\`;
            const expertise = Array.isArray(v.expertise) ? v.expertise : JSON.parse(v.expertise || '[]');
            const expertiseTags = expertise.slice(0, 3).map(exp => 
              \`<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">\${exp}</span>\`
            ).join('');
            
            return \`
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div class="flex items-start gap-3 mb-3">
                <img src="\${avatarUrl}" class="w-14 h-14 rounded-full" alt="\${v.name}"/>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900">\${v.name || 'Validator'}</h3>
                  <p class="text-sm text-gray-500">\${v.title || 'Expert Validator'}</p>
                  <div class="flex items-center mt-1 text-sm">
                    <div class="flex text-yellow-400 mr-2">
                      \${Array(5).fill(0).map((_, i) => \`<i class="fas fa-star\${i < Math.round(v.rating || 0) ? '' : '-o'} text-xs"></i>\`).join('')}
                    </div>
                    <span class="text-gray-500 text-xs">(\${v.total_validations || 0})</span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">\${v.bio || 'Expert validator ready to help your startup'}</p>
              <div class="mb-3">
                \${expertiseTags}
              </div>
              <div class="flex gap-2">
                <button onclick="startChatWithValidator(\${v.user_id})" class="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
                  <i class="fas fa-comment mr-1"></i>Chat
                </button>
                <button onclick="viewValidatorProfile(\${v.user_id})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <i class="fas fa-user"></i>
                </button>
              </div>
            </div>
          \`;
          }).join('');
        } catch (e) { 
          console.error('Error loading validators:', e);
          document.getElementById('validators-grid').innerHTML = '<div class="col-span-3 text-center py-12 text-red-500"><i class="fas fa-exclamation-triangle text-4xl mb-4"></i><p>Error loading validators</p></div>';
        }
      }

      async function startChatWithValidator(validatorUserId) {
        try {
          console.log('Starting chat with validator:', validatorUserId);
          const token = getAuthToken();
          const response = await axios.post('/api/chat/conversations', {
            other_user_id: validatorUserId
          }, {
            headers: { Authorization: 'Bearer ' + token }
          });
          const conversationId = response.data.conversation_id;
          
          // Switch to inbox tab
          switchTab('inbox');
          
          // Wait a moment for tab to switch, then reload conversations and select the new one
          setTimeout(async () => {
            await loadConversations(); // Reload conversations list to include the new one
            setTimeout(() => {
              selectConversation(conversationId); // Now select it
            }, 200);
          }, 300);
        } catch (error) {
          console.error('Error starting chat:', error);
          alert('Error starting conversation. Please try again.');
        }
      }

      function viewValidatorProfile(validatorUserId) {
        console.log('Viewing validator profile:', validatorUserId);
        alert('Validator profile coming soon');
      }

      // Load users by role
      async function loadUsersByRole(role, gridId) {
        try {
          const res = await axios.get('/api/auth/users-by-role', { params: { role } });
          const users = res.data || [];
          const container = document.getElementById(gridId);
          
          if (!users.length) {
            container.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-500"><i class="fas fa-users text-4xl mb-4 text-gray-300"></i><p>No users found</p></div>';
            return;
          }
          
          const roleIcons = {
            founder: 'fa-rocket',
            investor: 'fa-hand-holding-usd',
            scout: 'fa-search',
            partner: 'fa-handshake',
            job_seeker: 'fa-briefcase'
          };
          
          const roleLabels = {
            founder: 'Founder',
            investor: 'Investor',
            scout: 'Scout',
            partner: 'Partner',
            job_seeker: 'Looking for opportunities'
          };
          
          container.innerHTML = users.map(u => {
            const avatarUrl = u.avatar_url || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(u.name || 'U')}&background=random&color=fff\`;
            const skills = u.skills ? (Array.isArray(u.skills) ? u.skills : JSON.parse(u.skills || '[]')) : [];
            const skillsTags = skills.slice(0, 3).map(skill => 
              \`<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-1">\${skill}</span>\`
            ).join('');
            
            return \`
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div class="flex items-start gap-3 mb-3">
                <img src="\${avatarUrl}" class="w-14 h-14 rounded-full" alt="\${u.name}"/>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900">\${u.name || 'User'}</h3>
                  <p class="text-sm text-gray-500 flex items-center">
                    <i class="fas \${roleIcons[role] || 'fa-user'} mr-1"></i>
                    \${u.company || roleLabels[role] || 'User'}
                  </p>
                  \${u.location ? \`<p class="text-xs text-gray-400 mt-1"><i class="fas fa-map-marker-alt mr-1"></i>\${u.location}</p>\` : ''}
                </div>
              </div>
              \${u.looking_for ? \`<p class="text-sm text-gray-600 mb-3 line-clamp-2"><strong>Looking for:</strong> \${u.looking_for}</p>\` : ''}
              \${u.investment_range && role === 'investor' ? \`<p class="text-sm text-gray-600 mb-3"><strong>Range:</strong> \${u.investment_range}</p>\` : ''}
              <div class="mb-3">
                \${skillsTags}
              </div>
              <div class="flex gap-2">
                <button onclick="startChatWithUser(\${u.id})" class="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
                  <i class="fas fa-comment mr-1"></i>Chat
                </button>
                <button onclick="viewUserProfile(\${u.id})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <i class="fas fa-user"></i>
                </button>
              </div>
            </div>
          \`;
          }).join('');
        } catch (e) { 
          console.error('Error loading users:', e);
          document.getElementById(gridId).innerHTML = '<div class="col-span-3 text-center py-12 text-red-500"><i class="fas fa-exclamation-triangle text-4xl mb-4"></i><p>Error loading users</p></div>';
        }
      }

      async function startChatWithUser(userId) {
        try {
          console.log('Starting chat with user:', userId);
          const token = getAuthToken();
          const response = await axios.post('/api/chat/conversations', {
            other_user_id: userId
          }, {
            headers: { Authorization: 'Bearer ' + token }
          });
          const conversationId = response.data.conversation_id;
          
          // Switch to inbox tab
          switchTab('inbox');
          
          // Wait a moment for tab to switch, then reload conversations and select the new one
          setTimeout(async () => {
            await loadConversations(); // Reload conversations list to include the new one
            setTimeout(() => {
              selectConversation(conversationId); // Now select it
            }, 200);
          }, 300);
        } catch (error) {
          console.error('Error starting chat:', error);
          alert('Error starting conversation. Please try again.');
        }
      }

      function viewUserProfile(userId) {
        console.log('Viewing user profile:', userId);
        alert('User profile coming soon');
      }

      function searchUsers(type) {
        // TODO: Implement search
        console.log('Searching users:', type);
      }

      function searchValidators() {
        const q = document.getElementById('validator-search').value;
        // Implement search
      }

      function openProductModal() { document.getElementById('product-modal').classList.remove('hidden'); document.getElementById('product-modal').classList.add('flex'); }
      function closeProductModal() { document.getElementById('product-modal').classList.add('hidden'); document.getElementById('product-modal').classList.remove('flex'); }

      // View product detail
      async function viewProductDetail(productId) {
        try {
          const res = await axios.get(\`/api/marketplace/products/\${productId}\`);
          const product = res.data;
          
          // Create modal with product details
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
          modal.innerHTML = \`
            <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">\${product.category}</span>
                    <span class="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">\${product.stage}</span>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900">\${product.title}</h2>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div class="mb-4">
                <div class="flex items-center gap-3 mb-3">
                  <img src="\${product.company_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(product.company_name || 'C')}" 
                       class="w-12 h-12 rounded-full" alt="Company">
                  <div>
                    <p class="font-semibold text-gray-900">\${product.company_name || 'Unknown Company'}</p>
                    <p class="text-sm text-gray-500">\${product.company || ''}</p>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                  <div class="flex items-center">
                    <span class="text-3xl font-bold text-yellow-500">\${product.rating_average ? product.rating_average.toFixed(1) : '0.0'}</span>
                    <i class="fas fa-star text-yellow-500 ml-1 text-xl"></i>
                  </div>
                  <span class="text-gray-500">(\${product.votes_count || 0} votos)</span>
                </div>
                <button onclick="voteProduct(\${productId}); this.closest('.fixed').remove();" 
                        class="ml-auto bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">
                  <i class="fas fa-star mr-2"></i>Votar ahora
                </button>
              </div>

              <div class="space-y-4">
                <div>
                  <h3 class="font-bold text-gray-900 mb-2">Descripción</h3>
                  <p class="text-gray-600">\${product.description}</p>
                </div>

                <div>
                  <h3 class="font-bold text-gray-900 mb-2">Información</h3>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="bg-gray-50 p-3 rounded-lg">
                      <p class="text-gray-500 mb-1">Categoría</p>
                      <p class="font-semibold">\${product.category}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg">
                      <p class="text-gray-500 mb-1">Etapa</p>
                      <p class="font-semibold">\${product.stage}</p>
                    </div>
                    \${product.url ? \`
                    <div class="bg-gray-50 p-3 rounded-lg col-span-2">
                      <p class="text-gray-500 mb-1">URL</p>
                      <a href="\${product.url}" target="_blank" class="text-primary hover:underline">\${product.url}</a>
                    </div>
                    \` : ''}
                  </div>
                </div>

                \${product.looking_for ? \`
                <div>
                  <h3 class="font-bold text-gray-900 mb-2">Buscando</h3>
                  <p class="text-gray-600">\${product.looking_for}</p>
                </div>
                \` : ''}

                \${product.reviews && product.reviews.length > 0 ? \`
                <div>
                  <h3 class="font-bold text-gray-900 mb-2">Reseñas</h3>
                  <div class="space-y-2">
                    \${product.reviews.map(r => \`
                      <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="flex items-center justify-between mb-1">
                          <p class="font-semibold text-sm">\${r.reviewer_name}</p>
                          <div class="flex text-yellow-400">
                            \${Array(5).fill(0).map((_, i) => \`<i class="fas fa-star\${i < r.rating ? '' : '-o'} text-xs"></i>\`).join('')}
                          </div>
                        </div>
                        <p class="text-sm text-gray-600">\${r.comment || ''}</p>
                      </div>
                    \`).join('')}
                  </div>
                </div>
                \` : ''}
              </div>
            </div>
          \`;
          
          document.body.appendChild(modal);
        } catch (error) {
          console.error('Error loading product details:', error);
          alert('Error al cargar los detalles del producto');
        }
      }

      // Vote for product
      async function voteProduct(productId) {
        const rating = prompt('Califica este producto (1-5 estrellas):', '5');
        if (!rating || rating < 1 || rating > 5) {
          alert('Por favor ingresa un valor entre 1 y 5');
          return;
        }

        try {
          const token = getAuthToken();
          
          // Vote directly on the product
          await axios.post(\`/api/marketplace/products/\${productId}/vote\`, 
            { rating: parseInt(rating) },
            { headers: { Authorization: 'Bearer ' + token } }
          );
          
          alert('✅ Voto registrado exitosamente');
          loadProducts(); // Reload to show updated rating
        } catch (error) {
          console.error('Error voting:', error);
          if (error.response?.status === 429) {
            alert(error.response.data.error || 'Espera unos segundos antes de votar nuevamente');
          } else {
            alert('Error al votar. Por favor intenta nuevamente.');
          }
        }
      }

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
