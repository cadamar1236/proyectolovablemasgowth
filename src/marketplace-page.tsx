/**
 * ASTAR* Hub - Startup Dashboard
 * Dashboard with 4 tabs: Home, Traction, Inbox, Directory
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';
import { renderAICMOPage } from './ai-cmo-page';

export interface DirectoryPageProps {
  userName: string;
  userAvatar?: string;
  userRole?: string;
}

function renderAICMOPageString() {
  // Return the AI CMO page function as a string to inject into the page
  return renderAICMOPage.toString();
}

export function getDirectoryPage(props: DirectoryPageProps): string {
  const { userName, userAvatar, userRole } = props;

  const content = `
    <style>
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    </style>
    <div class="p-4 md:p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4 md:mb-6">
        <h1 class="text-xl md:text-2xl font-bold text-gray-900">Welcome back, ${userName}! 👋</h1>
        <p class="text-sm md:text-base text-gray-500">Manage your startup growth and connect with validators</p>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div class="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
          ${userRole === 'founder' ? `
          <button onclick="switchTab('home')" id="tab-home" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-primary border-b-2 border-primary">
            <i class="fas fa-home mr-1 md:mr-2"></i><span class="hidden sm:inline">Hub</span>
          </button>
          <button onclick="switchTab('traction')" id="tab-traction" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            <i class="fas fa-chart-line mr-1 md:mr-2"></i><span class="hidden sm:inline">Traction</span>
          </button>
          ` : ''}
          <button onclick="switchTab('inbox')" id="tab-inbox" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold ${userRole === 'founder' ? 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent' : 'text-primary border-b-2 border-primary'}">
            <i class="fas fa-inbox mr-1 md:mr-2"></i><span class="hidden sm:inline">Inbox</span>
            <span id="unread-badge" class="hidden ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">0</span>
          </button>
          <button onclick="switchTab('directory')" id="tab-directory" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
            <i class="fas fa-store mr-1 md:mr-2"></i><span class="hidden sm:inline">Directory</span>
          </button>
          <button onclick="switchTab('connector')" id="tab-connector" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent bg-gradient-to-r from-purple-50 to-indigo-50">
            <i class="fas fa-network-wired mr-1 md:mr-2"></i><span class="hidden sm:inline">AI Connector</span>
          </button>
          ${userRole === 'admin' ? `
          <button onclick="window.location.href='/admin'" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent bg-gradient-to-r from-purple-50 to-blue-50">
            <i class="fas fa-shield-alt mr-1 md:mr-2"></i><span class="hidden sm:inline">Admin</span>
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Tab Contents -->
      
      ${userRole === 'founder' ? `
      <!-- HOME TAB -->
      <div id="content-home" class="tab-content">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Goals</p>
                <p class="text-xl md:text-2xl font-bold text-gray-900" id="stat-goals">-</p>
              </div>
              <div class="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-bullseye text-blue-600 text-lg md:text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2"><span id="stat-active">-</span> active</p>
          </div>
          <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Completion</p>
                <p class="text-xl md:text-2xl font-bold text-gray-900" id="stat-completion">-</p>
              </div>
              <div class="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600 text-lg md:text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2"><span id="stat-completed">-</span> completed</p>
          </div>
          <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Users</p>
                <p class="text-xl md:text-2xl font-bold text-gray-900" id="stat-users">-</p>
              </div>
              <div class="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-users text-purple-600 text-lg md:text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2" id="stat-users-growth">-</p>
          </div>
          <div class="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">Revenue</p>
                <p class="text-xl md:text-2xl font-bold text-gray-900" id="stat-revenue">-</p>
              </div>
              <div class="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-dollar-sign text-yellow-600 text-lg md:text-xl"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2" id="stat-revenue-growth">-</p>
          </div>
        </div>
        
        <!-- Goals Table Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div class="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div>
              <h3 class="font-bold text-gray-900 text-lg md:text-xl">GOAL OF THE WEEK:</h3>
              <div class="flex flex-wrap gap-2 mt-2 text-xs md:text-sm">
                <span class="px-2 md:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">P0 - Urgent</span>
                <span class="px-2 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium hidden md:inline">P1 - Urgent or important</span>
                <span class="px-2 md:px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium hidden md:inline">P2 - Urgent but not important</span>
                <span class="px-2 md:px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium hidden md:inline">P3 - Neither but cool</span>
              </div>
            </div>
            <button onclick="openGoalModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">
              <i class="fas fa-plus mr-2"></i>New Goal
            </button>
          </div>
          
          <!-- Monthly Timeline Overview (Weeks) -->
          <!-- Monthly Calendar Overview -->
          <div id="monthly-calendar-overview" class="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-purple-100">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                <i class="fas fa-calendar-alt text-purple-600"></i>
                <span id="calendar-month-title">January 2026</span>
              </h4>
              <div class="flex items-center gap-2">
                <button onclick="changeCalendarMonth(-1)" class="p-1 hover:bg-purple-100 rounded">
                  <i class="fas fa-chevron-left text-purple-600"></i>
                </button>
                <button onclick="changeCalendarMonth(1)" class="p-1 hover:bg-purple-100 rounded">
                  <i class="fas fa-chevron-right text-purple-600"></i>
                </button>
                <span id="timeline-total-tasks" class="text-sm text-gray-500 ml-2">Loading...</span>
              </div>
            </div>
            <!-- Calendar Grid -->
            <div class="grid grid-cols-7 gap-1 mb-2">
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Mon</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Tue</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Wed</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Thu</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Fri</div>
              <div class="text-center text-xs font-semibold text-gray-400 py-1">Sat</div>
              <div class="text-center text-xs font-semibold text-gray-400 py-1">Sun</div>
            </div>
            <div id="calendar-grid" class="grid grid-cols-7 gap-1">
              <!-- Calendar days will be generated dynamically -->
            </div>
            <!-- Legend -->
            <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-400 rounded"></span> Light (1-2)</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-400 rounded"></span> Medium (3-4)</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-400 rounded"></span> Heavy (5+)</span>
              </div>
              <span id="busiest-day" class="font-medium"></span>
            </div>
          </div>
          
          <!-- Goals Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <tr>
                  <th class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                  <th class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                  <th class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Task</th>
                  <th class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider">Priority</th>
                  <th class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider">Cadence</th>
                  <th class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider">DRI</th>
                  <th class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    <i class="fas fa-calendar-day mr-1"></i>Schedule
                  </th>
                  <th class="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="goals-table-body" class="divide-y divide-gray-200 bg-white">
                <tr>
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500">
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
              <button onclick="switchTab(\'inbox\')" class="text-purple-600 text-sm font-medium hover:underline">View all →</button>
            </div>
            <div id="home-messages" class="space-y-3">
              <div class="animate-pulse"><div class="h-12 bg-gray-200 rounded"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- TRACTION TAB -->
      <div id="content-traction" class="tab-content hidden">
        <!-- Team To-Do List Overview -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <i class="fas fa-tasks text-purple-600"></i>
                  Team To-Do List
                </h3>
                <p class="text-sm text-gray-500 mt-1">Based on goals - see who does what</p>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="text-2xl font-bold text-purple-600" id="overall-completion">0%</div>
                  <div class="text-xs text-gray-500">Overall completion</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Overall Progress Bar -->
          <div class="px-6 py-4 bg-gray-50 border-b">
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div id="overall-progress-bar" class="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500" style="width: 0%"></div>
                </div>
              </div>
              <div class="text-sm text-gray-600">
                <span id="completed-count" class="font-semibold text-green-600">0</span> / <span id="total-count">0</span> completed
              </div>
            </div>
          </div>
          
          <!-- Team Members Progress -->
          <div id="team-todo-list" class="divide-y divide-gray-100">
            <div class="p-8 text-center text-gray-500">
              <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
              <p>Loading team to-do list...</p>
            </div>
          </div>
        </div>
        
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
      ` : ''}

      <!-- INBOX TAB -->
      <div id="content-inbox" class="tab-content ${userRole === 'founder' ? 'hidden' : ''}">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Conversations List -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200">
              <h3 class="font-bold text-gray-900">Messages</h3>
              <div class="flex gap-2 mt-2">
                <button onclick="showInboxSection('active')" id="inbox-active-btn" class="flex-1 px-3 py-2 text-sm font-semibold text-primary border-b-2 border-primary bg-primary/5 rounded-t-lg">
                  Active Users
                </button>
                <button onclick="showInboxSection('conversations')" id="inbox-conversations-btn" class="flex-1 px-3 py-2 text-sm font-semibold text-gray-500 border-b-2 border-transparent rounded-t-lg hover:bg-gray-50">
                  Conversations
                </button>
              </div>
            </div>
            
            <!-- Active Users Section -->
            <div id="active-users-list" class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              <div class="p-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading active users...</p>
              </div>
            </div>
            
            <!-- Conversations Section -->
            <div id="conversations-list" class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto hidden">
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

      <!-- DIRECTORY TAB -->
      <div id="content-directory" class="tab-content hidden">
        <div class="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          <button onclick="showDirectorySection('products')" id="mp-products-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-primary border-b-2 border-primary whitespace-nowrap">Products</button>
          <button onclick="showDirectorySection('founders')" id="mp-founders-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Founders</button>
          <button onclick="showDirectorySection('investors')" id="mp-investors-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Investors</button>
          <button onclick="showDirectorySection('validators')" id="mp-validators-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Validators</button>
          <button onclick="showDirectorySection('scouts')" id="mp-scouts-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Scouts</button>
          <button onclick="showDirectorySection('partners')" id="mp-partners-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Partners</button>
          <button onclick="showDirectorySection('talent')" id="mp-talent-btn" class="mp-btn px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b-2 border-transparent whitespace-nowrap">Talent</button>
        </div>

        <!-- Products Section -->
        <div id="mp-products" class="mp-section">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div class="flex flex-col sm:flex-row gap-3 flex-1">
              <select id="product-category" onchange="loadProducts()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
                <option value="">All Categories</option>
                <option value="SaaS">SaaS</option>
                <option value="Mobile">Mobile</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Fintech">Fintech</option>
                <option value="Healthcare">Healthcare</option>
              </select>
              <select id="product-stage" onchange="loadProducts()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
                <option value="">All Stages</option>
                <option value="idea">Idea</option>
                <option value="mvp">MVP</option>
                <option value="beta">Beta</option>
                <option value="launched">Launched</option>
              </select>
            </div>
            <button onclick="openProductModal()" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap w-full md:w-auto"><i class="fas fa-plus mr-2"></i>Add Product</button>
          </div>
          <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Validators Section -->
        <div id="mp-validators" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" id="validator-search" placeholder="Search validators..." onkeyup="searchUsers('validators')" class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm">
          </div>
          <div id="validators-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div class="animate-pulse"><div class="h-48 bg-gray-200 rounded-xl"></div></div>
          </div>
        </div>

        <!-- Founders Section -->
        <div id="mp-founders" class="mp-section hidden">
          <div class="mb-6">
            <input type="text" placeholder="Search founders..." onkeyup="searchUsers('founders')" class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm">
          </div>
          <div id="founders-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

      <!-- AI CMO TAB -->
      <div id="content-aicmo" class="tab-content hidden">
        <!-- Content will be loaded dynamically -->
      </div>

      <!-- AI CONNECTOR TAB -->
      <div id="content-connector" class="tab-content hidden">
        <div class="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 mb-6 border border-indigo-100">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <i class="fas fa-network-wired text-white text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">AI SuperConnector</h2>
              <p class="text-sm text-gray-600">Tell me what connections you're looking for and I'll find the best matches</p>
            </div>
          </div>
          
          <!-- Chat Interface -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <!-- Chat Messages -->
            <div id="connector-chat-messages" class="h-80 overflow-y-auto p-4 space-y-4">
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                  <p class="text-sm text-gray-800">👋 Hi! I'm your AI SuperConnector. I can help you find:</p>
                  <ul class="text-sm text-gray-700 mt-2 space-y-1">
                    <li>🚀 <strong>Founders</strong> with similar challenges or complementary skills</li>
                    <li>💰 <strong>Investors</strong> interested in your industry</li>
                    <li>✅ <strong>Validators</strong> expert in your field</li>
                    <li>🤝 <strong>Partners</strong> for collaboration opportunities</li>
                    <li>👥 <strong>Talent</strong> to join your team</li>
                  </ul>
                  <p class="text-sm text-gray-700 mt-2">Just tell me what you need! For example: <em>"Find me investors interested in SaaS"</em> or <em>"Connect me with founders in fintech"</em></p>
                </div>
              </div>
            </div>
            
            <!-- Chat Input -->
            <div class="border-t border-gray-200 p-4 bg-gray-50">
              <form id="connector-chat-form" onsubmit="sendConnectorMessage(event)" class="flex gap-3">
                <input 
                  type="text" 
                  id="connector-chat-input" 
                  placeholder="Tell me what connections you're looking for..." 
                  class="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autocomplete="off"
                >
                <button type="submit" class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md">
                  <i class="fas fa-paper-plane mr-2"></i>Send
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <!-- All Saved Suggestions -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">
              <i class="fas fa-bookmark text-purple-500 mr-2"></i>All Saved Suggestions
            </h3>
            <span id="all-suggestions-count" class="text-sm text-gray-500"></span>
          </div>
          <div id="all-suggestions-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl p-6 border border-gray-200 text-center text-gray-500 col-span-full">
              <i class="fas fa-bookmark text-4xl text-gray-300 mb-3"></i>
              <p class="text-sm">Your saved connection suggestions will appear here</p>
              <p class="text-xs text-gray-400 mt-2">Use the chat above to find relevant connections</p>
            </div>
          </div>
        </div>
        
        <!-- Suggested Connections (from chat) -->
        <div id="connector-results" class="hidden mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">
              <i class="fas fa-users text-purple-500 mr-2"></i>New Suggested Connections
            </h3>
            <span id="connector-results-count" class="text-sm text-gray-500"></span>
          </div>
          <div id="connector-results-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Results will be loaded here -->
          </div>
        </div>
      </div>
    </div>

    <!-- Connector Suggestion Detail Modal -->
    <div id="suggestion-detail-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-900">Connection Details</h3>
          <button onclick="closeSuggestionDetail()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>
        <div id="suggestion-detail-content" class="p-6">
          <!-- Content will be loaded here -->
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
        <form id="goal-form" onsubmit="createGoal(event)">
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

    <!-- Goal Calendar Modal -->
    <div id="goal-calendar-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">
      <div class="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-t-2xl">
          <div class="flex justify-between items-center">
            <h3 id="goal-calendar-title" class="text-lg font-bold text-white truncate pr-4">Schedule Goal</h3>
            <button onclick="closeGoalCalendarModal()" class="text-white/70 hover:text-white"><i class="fas fa-times text-xl"></i></button>
          </div>
        </div>
        <div class="p-4">
          <!-- Month Navigation -->
          <div class="flex items-center justify-between mb-4">
            <button onclick="changeGoalCalendarMonth(-1)" class="p-2 hover:bg-gray-100 rounded-lg">
              <i class="fas fa-chevron-left text-gray-600"></i>
            </button>
            <span id="goal-calendar-month" class="font-semibold text-gray-700">January 2026</span>
            <button onclick="changeGoalCalendarMonth(1)" class="p-2 hover:bg-gray-100 rounded-lg">
              <i class="fas fa-chevron-right text-gray-600"></i>
            </button>
          </div>
          <!-- Day Headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Mon</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Tue</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Wed</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Thu</div>
            <div class="text-center text-xs font-semibold text-gray-500 py-1">Fri</div>
            <div class="text-center text-xs font-semibold text-gray-400 py-1">Sat</div>
            <div class="text-center text-xs font-semibold text-gray-400 py-1">Sun</div>
          </div>
          <!-- Calendar Grid -->
          <div id="goal-calendar-grid" class="grid grid-cols-7 gap-1">
            <!-- Days will be generated dynamically -->
          </div>
          <p class="text-xs text-gray-500 mt-4 text-center">Click on days to schedule/unschedule this task</p>
        </div>
      </div>
    </div>

    <!-- Goal Detail Modal -->
    <div id="goal-detail-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center">
      <div class="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div class="flex justify-between items-start">
            <div>
              <span id="detail-category" class="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium"></span>
              <h3 id="detail-task" class="text-xl font-bold text-white mt-2"></h3>
            </div>
            <button onclick="closeGoalDetailModal()" class="text-white/70 hover:text-white"><i class="fas fa-times text-xl"></i></button>
          </div>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs font-medium text-gray-500 uppercase">Description</label>
            <p id="detail-description" class="text-gray-800 mt-1"></p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <label class="text-xs font-medium text-gray-500 uppercase">Priority</label>
              <p id="detail-priority" class="font-semibold mt-1"></p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <label class="text-xs font-medium text-gray-500 uppercase">Status</label>
              <p id="detail-status" class="font-semibold mt-1"></p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <label class="text-xs font-medium text-gray-500 uppercase">Cadence</label>
              <p id="detail-cadence" class="font-semibold mt-1"></p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <label class="text-xs font-medium text-gray-500 uppercase">DRI</label>
              <p id="detail-dri" class="font-semibold mt-1"></p>
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 uppercase mb-2 block">Scheduled Dates</label>
            <div id="detail-schedule" class="flex flex-wrap gap-2">
            </div>
          </div>
          <div class="flex gap-3 pt-4 border-t">
            <button onclick="editGoalFromDetail()" class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
              <i class="fas fa-edit mr-2"></i>Edit Goal
            </button>
            <button onclick="closeGoalDetailModal()" class="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg">Close</button>
          </div>
        </div>
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
      let activeUsers = [];
      let currentInboxSection = 'active';

      // Tab switching
      function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-primary', 'border-primary');
          b.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById('tab-' + tab)?.classList.remove('text-gray-500', 'border-transparent');
        document.getElementById('tab-' + tab)?.classList.add('text-primary', 'border-primary');
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        const contentEl = document.getElementById('content-' + tab);
        if (contentEl) contentEl.classList.remove('hidden');
        
        if (tab === 'traction') {
          setTimeout(initCharts, 100);
          renderTeamTodoList();
        }
        if (tab === 'inbox') loadConversations();
        if (tab === 'directory') { loadProducts(); loadValidators(); }
        if (tab === 'connector') initConnector();
      }
      
      // ============== AI CONNECTOR FUNCTIONS ==============
      let connectorSessionId = null;
      let connectorMessages = [];
      
      function initConnector() {
        // Generate session ID if not exists
        if (!connectorSessionId) {
          connectorSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Load recent suggestions from database
        loadRecentSuggestions();
      }
      
      async function sendConnectorMessage(event) {
        event.preventDefault();
        const input = document.getElementById('connector-chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to chat
        addConnectorMessage(message, 'user');
        
        // Show loading indicator
        const loadingId = 'loading_' + Date.now();
        addConnectorLoadingMessage(loadingId);
        
        try {
          // Call the connector API
          const response = await axios.post('/api/connector/chat', {
            message: message,
            session_id: connectorSessionId
          });
          
          // Remove loading indicator
          removeConnectorLoadingMessage(loadingId);
          
          const data = response.data;
          
          // Add AI response
          addConnectorMessage(data.response || data.message, 'ai');
          
          // Show matches if any
          if (data.matches && data.matches.length > 0) {
            showConnectorMatches(data.matches);
          }
        } catch (error) {
          removeConnectorLoadingMessage(loadingId);
          console.error('Connector error:', error);
          addConnectorMessage('Sorry, there was an error processing your request. Please try again.', 'ai');
        }
      }
      
      function addConnectorMessage(text, sender) {
        const container = document.getElementById('connector-chat-messages');
        const isUser = sender === 'user';
        
        const messageHtml = \`
          <div class="flex gap-3 \${isUser ? 'justify-end' : ''}">
            \${!isUser ? \`
              <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-sm"></i>
              </div>
            \` : ''}
            <div class="\${isUser ? 'bg-purple-500 text-white rounded-2xl rounded-tr-none' : 'bg-gray-100 rounded-2xl rounded-tl-none'} px-4 py-3 max-w-[80%]">
              <p class="text-sm \${isUser ? 'text-white' : 'text-gray-800'}">\${text}</p>
            </div>
            \${isUser ? \`
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-gray-500 text-sm"></i>
              </div>
            \` : ''}
          </div>
        \`;
        
        container.insertAdjacentHTML('beforeend', messageHtml);
        container.scrollTop = container.scrollHeight;
      }
      
      function addConnectorLoadingMessage(id) {
        const container = document.getElementById('connector-chat-messages');
        const loadingHtml = \`
          <div id="\${id}" class="flex gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-robot text-white text-sm"></i>
            </div>
            <div class="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>
        \`;
        container.insertAdjacentHTML('beforeend', loadingHtml);
        container.scrollTop = container.scrollHeight;
      }
      
      function removeConnectorLoadingMessage(id) {
        const loadingEl = document.getElementById(id);
        if (loadingEl) loadingEl.remove();
      }
      
      function showConnectorMatches(matches) {
        const container = document.getElementById('connector-results');
        const grid = document.getElementById('connector-results-grid');
        const countEl = document.getElementById('connector-results-count');
        
        container.classList.remove('hidden');
        countEl.textContent = \`\${matches.length} match\${matches.length !== 1 ? 'es' : ''} found\`;
        
        grid.innerHTML = matches.map(match => {
          const initials = (match.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
          const colorIndex = (match.name || 'U').charCodeAt(0) % avatarColors.length;
          const userTypeLabels = {
            founder: { label: 'Founder', color: 'bg-blue-100 text-blue-700' },
            investor: { label: 'Investor', color: 'bg-green-100 text-green-700' },
            validator: { label: 'Validator', color: 'bg-purple-100 text-purple-700' },
            partner: { label: 'Partner', color: 'bg-orange-100 text-orange-700' },
            talent: { label: 'Talent', color: 'bg-pink-100 text-pink-700' },
            scout: { label: 'Scout', color: 'bg-yellow-100 text-yellow-700' }
          };
          const typeInfo = userTypeLabels[match.user_type] || { label: match.user_type || 'User', color: 'bg-gray-100 text-gray-700' };
          const score = match.score ? Math.round(match.score * 100) : null;
          
          return \`
            <div class="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all hover:border-purple-200">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-14 h-14 \${avatarColors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  \${match.avatar ? \`<img src="\${match.avatar}" class="w-14 h-14 rounded-full object-cover">\` : initials}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-gray-900 truncate">\${match.name || 'Anonymous'}</h4>
                  <span class="\${typeInfo.color} text-xs font-medium px-2 py-0.5 rounded-full">\${typeInfo.label}</span>
                  \${score ? \`<span class="ml-2 text-xs text-purple-600 font-medium">\${score}% match</span>\` : ''}
                </div>
              </div>
              <div class="space-y-2 mb-4">
                \${match.industry ? \`
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i class="fas fa-briefcase text-gray-400 w-4"></i>
                    <span>\${match.industry}</span>
                  </div>
                \` : ''}
                \${match.country ? \`
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i class="fas fa-map-marker-alt text-gray-400 w-4"></i>
                    <span>\${match.country}</span>
                  </div>
                \` : ''}
                \${match.stage ? \`
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i class="fas fa-rocket text-gray-400 w-4"></i>
                    <span>\${match.stage}</span>
                  </div>
                \` : ''}
              </div>
              \${match.reason ? \`
                <div class="bg-purple-50 rounded-lg p-3 mb-4">
                  <p class="text-xs text-purple-700"><i class="fas fa-lightbulb mr-1"></i> <strong>Why connect:</strong> \${match.reason}</p>
                </div>
              \` : ''}
              <div class="flex gap-2">
                <button onclick="startConversation(\${match.id})" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all">
                  <i class="fas fa-comment-dots mr-1"></i>Connect
                </button>
                <button onclick="viewProfile(\${match.id})" class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                  <i class="fas fa-user"></i>
                </button>
              </div>
            </div>
          \`;
        }).join('');
        
        // Also add to recent suggestions
        updateRecentSuggestions(matches);
      }
      
      function updateRecentSuggestions(matches) {
        const container = document.getElementById('recent-connections');
        if (matches.length === 0) return;
        
        // Get existing recent or start fresh
        let recent = JSON.parse(localStorage.getItem('recentConnectorSuggestions') || '[]');
        
        // Add new matches at the beginning
        matches.forEach(m => {
          // Remove duplicate if exists
          recent = recent.filter(r => r.id !== m.id);
          recent.unshift({ ...m, timestamp: Date.now() });
        });
        
        // Keep only last 9 suggestions
        recent = recent.slice(0, 9);
        localStorage.setItem('recentConnectorSuggestions', JSON.stringify(recent));
        
        renderRecentSuggestions(recent);
      }
      
      function renderRecentSuggestions(suggestions) {
        const container = document.getElementById('recent-connections');
        if (!suggestions || suggestions.length === 0) {
          container.innerHTML = \`
            <div class="bg-white rounded-xl p-4 border border-gray-200 text-center text-gray-500">
              <i class="fas fa-search text-3xl text-gray-300 mb-2"></i>
              <p class="text-sm">Your suggested connections will appear here</p>
            </div>
          \`;
          return;
        }
        
        const userTypeLabels = {
          founder: { label: 'Founder', color: 'bg-blue-100 text-blue-700' },
          investor: { label: 'Investor', color: 'bg-green-100 text-green-700' },
          validator: { label: 'Validator', color: 'bg-purple-100 text-purple-700' },
          partner: { label: 'Partner', color: 'bg-orange-100 text-orange-700' },
          talent: { label: 'Talent', color: 'bg-pink-100 text-pink-700' }
        };
        
        container.innerHTML = \`
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            \${suggestions.slice(0, 6).map(s => {
              const initials = (s.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const typeInfo = userTypeLabels[s.user_type] || { label: s.user_type || 'User', color: 'bg-gray-100 text-gray-700' };
              return \`
                <div class="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-200 transition-all cursor-pointer" onclick="viewProfile(\${s.id})">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      \${initials}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-900 text-sm truncate">\${s.name || 'Anonymous'}</p>
                      <span class="\${typeInfo.color} text-xs px-2 py-0.5 rounded-full">\${typeInfo.label}</span>
                    </div>
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        \`;
      }
      
      // Load recent suggestions on page load
      async function loadRecentSuggestions() {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) return;
          
          const res = await axios.get('/api/connector/suggestions', {
            headers: { Authorization: 'Bearer ' + token }
          });
          
          if (res.data.success && res.data.suggestions.length > 0) {
            renderAllSuggestions(res.data.suggestions);
          } else {
            renderAllSuggestions([]);
          }
        } catch (error) {
          console.error('Error loading suggestions:', error);
          renderAllSuggestions([]);
        }
      }

      // Render all saved suggestions
      function renderAllSuggestions(suggestions) {
        const container = document.getElementById('all-suggestions-list');
        const countEl = document.getElementById('all-suggestions-count');
        
        if (!suggestions || suggestions.length === 0) {
          container.innerHTML = '<div class="bg-white rounded-xl p-6 border border-gray-200 text-center text-gray-500 col-span-full">' +
            '<i class="fas fa-bookmark text-4xl text-gray-300 mb-3"></i>' +
            '<p class="text-sm">Your saved connection suggestions will appear here</p>' +
            '<p class="text-xs text-gray-400 mt-2">Use the chat above to find relevant connections</p>' +
            '</div>';
          countEl.textContent = '';
          return;
        }

        countEl.textContent = suggestions.length + ' suggestion' + (suggestions.length !== 1 ? 's' : '');
        
        container.innerHTML = suggestions.map(s => {
          const avatar = s.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name || 'User');
          const name = s.name || 'Unknown';
          const userType = s.user_type || 'founder';
          const score = s.score ? (s.score * 100).toFixed(0) : 0;
          
          let html = '<div class="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer" onclick="showSuggestionDetail(' + s.id + ')">';
          html += '<div class="flex items-start gap-3">';
          html += '<img src="' + avatar + '" alt="' + name + '" class="w-12 h-12 rounded-full object-cover flex-shrink-0">';
          html += '<div class="flex-1 min-w-0">';
          html += '<h4 class="font-semibold text-gray-900 truncate">' + name + '</h4>';
          html += '<p class="text-xs text-gray-500 capitalize">' + userType + '</p>';
          if (s.industry) html += '<p class="text-xs text-purple-600 mt-1"><i class="fas fa-briefcase mr-1"></i>' + s.industry + '</p>';
          if (s.country) html += '<p class="text-xs text-gray-500 mt-1"><i class="fas fa-map-marker-alt mr-1"></i>' + s.country + '</p>';
          html += '</div></div>';
          
          if (s.reason) {
            html += '<div class="mt-3 bg-purple-50 rounded-lg p-2">';
            html += '<p class="text-xs text-purple-700 line-clamp-2"><i class="fas fa-lightbulb mr-1"></i>' + s.reason + '</p>';
            html += '</div>';
          }
          
          if (s.score) {
            html += '<div class="mt-2 flex items-center gap-2">';
            html += '<div class="flex-1 bg-gray-200 rounded-full h-1.5">';
            html += '<div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-1.5 rounded-full" style="width: ' + score + '%"></div>';
            html += '</div><span class="text-xs font-semibold text-gray-600">' + score + '%</span></div>';
          }
          
          html += '<div class="mt-3 flex gap-2">';
          html += '<button onclick="event.stopPropagation(); startConversation(' + s.id + ')" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all">';
          html += '<i class="fas fa-comment-dots mr-1"></i>Connect</button>';
          html += '<button onclick="event.stopPropagation(); showSuggestionDetail(' + s.id + ')" class="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all">';
          html += '<i class="fas fa-eye"></i></button>';
          html += '</div></div>';
          
          return html;
        }).join('');
      }

      // Show suggestion detail modal
      async function showSuggestionDetail(userId) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          const res = await axios.get('/api/connector/suggestions', {
            headers: { Authorization: 'Bearer ' + token }
          });
          
          const suggestion = res.data.suggestions.find(s => s.id === userId);
          if (!suggestion) {
            alert('Suggestion not found');
            return;
          }

          const modal = document.getElementById('suggestion-detail-modal');
          const content = document.getElementById('suggestion-detail-content');
          
          const avatar = suggestion.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(suggestion.name || 'User');
          const name = suggestion.name || 'Unknown';
          const userType = suggestion.user_type || 'founder';
          const score = suggestion.score ? (suggestion.score * 100).toFixed(0) : 0;
          
          let html = '<div class="flex items-start gap-4 mb-6">';
          html += '<img src="' + avatar + '" alt="' + name + '" class="w-20 h-20 rounded-full object-cover">';
          html += '<div class="flex-1">';
          html += '<h4 class="text-2xl font-bold text-gray-900">' + name + '</h4>';
          html += '<p class="text-sm text-gray-500 capitalize mt-1">' + userType + '</p>';
          if (suggestion.industry) html += '<p class="text-sm text-purple-600 mt-2"><i class="fas fa-briefcase mr-2"></i>' + suggestion.industry + '</p>';
          if (suggestion.country) html += '<p class="text-sm text-gray-600 mt-1"><i class="fas fa-map-marker-alt mr-2"></i>' + suggestion.country + '</p>';
          html += '</div></div>';

          if (suggestion.score) {
            html += '<div class="mb-6">';
            html += '<div class="flex items-center justify-between mb-2">';
            html += '<span class="text-sm font-semibold text-gray-700">Match Score</span>';
            html += '<span class="text-lg font-bold text-purple-600">' + score + '%</span>';
            html += '</div>';
            html += '<div class="w-full bg-gray-200 rounded-full h-2.5">';
            html += '<div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all" style="width: ' + score + '%"></div>';
            html += '</div></div>';
          }

          if (suggestion.reason) {
            html += '<div class="mb-6">';
            html += '<h5 class="text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-lightbulb text-yellow-500 mr-2"></i>Why Connect</h5>';
            html += '<div class="bg-purple-50 rounded-lg p-4">';
            html += '<p class="text-sm text-purple-700">' + suggestion.reason + '</p>';
            html += '</div></div>';
          }

          if (suggestion.bio) {
            html += '<div class="mb-6">';
            html += '<h5 class="text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-user text-blue-500 mr-2"></i>About</h5>';
            html += '<p class="text-sm text-gray-600">' + suggestion.bio + '</p>';
            html += '</div>';
          }

          if (suggestion.created_at) {
            html += '<div class="mb-6">';
            html += '<p class="text-xs text-gray-500"><i class="fas fa-clock mr-2"></i>Suggested ' + new Date(suggestion.created_at).toLocaleDateString() + '</p>';
            html += '</div>';
          }

          html += '<div class="flex gap-3">';
          html += '<button onclick="startConversation(' + suggestion.id + '); closeSuggestionDetail();" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all">';
          html += '<i class="fas fa-comment-dots mr-2"></i>Start Conversation</button>';
          html += '<button onclick="viewProfile(' + suggestion.id + '); closeSuggestionDetail();" class="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all">';
          html += '<i class="fas fa-user mr-2"></i>View Profile</button>';
          html += '</div>';
          
          content.innerHTML = html;
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        } catch (error) {
          console.error('Error loading suggestion detail:', error);
          alert('Error loading suggestion details');
        }
      }

      // Close suggestion detail modal
      function closeSuggestionDetail() {
        const modal = document.getElementById('suggestion-detail-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      // ============== END AI CONNECTOR FUNCTIONS ==============
      
      // Function to render Team To-Do List based on goals
      function renderTeamTodoList() {
        const container = document.getElementById('team-todo-list');
        if (!container || !allGoals.length) {
          if (container) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500"><i class="fas fa-clipboard-list text-4xl mb-3 text-gray-300"></i><p>No goals yet. Create goals to see your team to-do list.</p></div>';
          }
          return;
        }
        
        // Group goals by DRI (Directly Responsible Individual)
        const byDRI = {};
        allGoals.forEach(goal => {
          const dri = goal.dri || 'Unassigned';
          if (!byDRI[dri]) byDRI[dri] = [];
          byDRI[dri].push(goal);
        });
        
        // Calculate overall stats
        const totalGoals = allGoals.length;
        const completedGoals = allGoals.filter(g => g.goal_status === 'Done').length;
        const overallPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        
        // Update overall stats
        document.getElementById('overall-completion').textContent = overallPercentage + '%';
        document.getElementById('overall-progress-bar').style.width = overallPercentage + '%';
        document.getElementById('completed-count').textContent = completedGoals;
        document.getElementById('total-count').textContent = totalGoals;
        
        // Render each DRI section
        container.innerHTML = Object.entries(byDRI).map(([dri, goals]) => {
          const completed = goals.filter(g => g.goal_status === 'Done').length;
          const total = goals.length;
          const percentage = Math.round((completed / total) * 100);
          const wip = goals.filter(g => g.goal_status === 'WIP').length;
          const toStart = goals.filter(g => g.goal_status === 'To start').length;
          
          // Get initials for avatar
          const initials = dri.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
          const colorIndex = dri.charCodeAt(0) % avatarColors.length;
          
          return \`
            <div class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-4">
                <!-- Avatar -->
                <div class="w-12 h-12 \${avatarColors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  \${initials}
                </div>
                
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="font-semibold text-gray-900 truncate">\${dri}</h4>
                    <span class="text-sm font-bold \${percentage === 100 ? 'text-green-600' : percentage >= 50 ? 'text-blue-600' : 'text-orange-600'}">
                      \${percentage}%
                    </span>
                  </div>
                  
                  <!-- Progress bar -->
                  <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div class="h-full transition-all duration-500 \${percentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}" style="width: \${percentage}%"></div>
                  </div>
                  
                  <!-- Stats -->
                  <div class="flex items-center gap-3 text-xs">
                    <span class="text-gray-500">\${total} tasks</span>
                    <span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>\${completed} done</span>
                    \${wip > 0 ? \`<span class="text-blue-600"><i class="fas fa-spinner mr-1"></i>\${wip} WIP</span>\` : ''}
                    \${toStart > 0 ? \`<span class="text-orange-600"><i class="fas fa-clock mr-1"></i>\${toStart} to start</span>\` : ''}
                  </div>
                </div>
                
                <!-- Expand button -->
                <button onclick="toggleDRITasks('\${dri}')" class="text-gray-400 hover:text-purple-600 p-2">
                  <i class="fas fa-chevron-down" id="dri-chevron-\${dri.replace(/\\s/g, '-')}"></i>
                </button>
              </div>
              
              <!-- Task list (collapsible) -->
              <div id="dri-tasks-\${dri.replace(/\\s/g, '-')}" class="hidden mt-3 ml-16 space-y-2">
                \${goals.map(goal => {
                  const statusIcon = goal.goal_status === 'Done' ? 'fa-check-circle text-green-500' 
                    : goal.goal_status === 'WIP' ? 'fa-spinner text-blue-500' 
                    : 'fa-circle text-gray-300';
                  const taskClass = goal.goal_status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700';
                  
                  return \`
                    <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer" onclick="showGoalDetail(\${goal.id})">
                      <i class="fas \${statusIcon}"></i>
                      <span class="flex-1 text-sm \${taskClass}">\${goal.task || goal.description}</span>
                      <span class="px-2 py-0.5 text-xs rounded-full \${
                        goal.priority === 'P0' ? 'bg-yellow-100 text-yellow-700' 
                        : goal.priority === 'P1' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }">\${goal.priority || 'P0'}</span>
                    </div>
                  \`;
                }).join('')}
              </div>
            </div>
          \`;
        }).join('');
      }
      
      // Toggle DRI tasks visibility
      window.toggleDRITasks = function(dri) {
        const safeDri = dri.replace(/\\s/g, '-');
        const tasksEl = document.getElementById('dri-tasks-' + safeDri);
        const chevron = document.getElementById('dri-chevron-' + safeDri);
        
        if (tasksEl) {
          tasksEl.classList.toggle('hidden');
          if (chevron) {
            chevron.classList.toggle('fa-chevron-down');
            chevron.classList.toggle('fa-chevron-up');
          }
        }
      };
      
      function loadAICMOPage() {
        const contentEl = document.getElementById('content-aicmo');
        if (contentEl) {
          contentEl.innerHTML = window.renderAICMOPage ? window.renderAICMOPage({}) : '<div class="p-8"><h2>AI CMO</h2><p>Loading...</p></div>';
          // Load images after a small delay to ensure DOM is ready
          setTimeout(function() {
            loadAICMOImages('pending');
          }, 100);
        }
      }

      // AI CMO Functions - defined globally
      window.showAICMOSection = function(section) {
        ['pending', 'approved', 'rejected', 'history'].forEach(function(s) {
          var btn = document.getElementById('ai-cmo-' + s + '-btn');
          var content = document.getElementById('ai-cmo-' + s + '-content');
          
          if (s === section) {
            if (btn) {
              btn.classList.remove('text-gray-500', 'border-transparent');
              btn.classList.add('text-primary', 'border-primary', 'bg-primary/5');
            }
            if (content) content.classList.remove('hidden');
          } else {
            if (btn) {
              btn.classList.remove('text-primary', 'border-primary', 'bg-primary/5');
              btn.classList.add('text-gray-500', 'border-transparent');
            }
            if (content) content.classList.add('hidden');
          }
        });
        loadAICMOImages(section);
      };

      window.loadAICMOImages = loadAICMOImages;
      
      async function loadAICMOImages(section) {
        section = section || 'pending';
        try {
          var token = document.cookie.match(/authToken=([^;]+)/);
          var authToken = token ? token[1] : localStorage.getItem('authToken');
          console.log('[AI-CMO] Loading images, authToken exists:', !!authToken);
          
          var response = await fetch('/api/ai-cmo/images', {
            credentials: 'include',
            headers: { 
              'Authorization': 'Bearer ' + (authToken || ''),
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) throw new Error('Failed to load images');

          var data = await response.json();
          var images = data.images || [];

          var filtered = images.filter(function(img) {
            if (section === 'pending') return img.status === 'pending';
            if (section === 'approved') return img.status === 'approved';
            if (section === 'rejected') return img.status === 'rejected';
            return true;
          });

          var gridId = section === 'history' ? 'history-list' : section + '-images-grid';
          var emptyId = section + '-empty';
          var grid = document.getElementById(gridId);
          var empty = document.getElementById(emptyId);

          if (!grid) return;

          if (filtered.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            if (empty) empty.classList.remove('hidden');
            return;
          }

          grid.classList.remove('hidden');
          if (empty) empty.classList.add('hidden');

          grid.innerHTML = filtered.map(function(img) {
            var actions = '';
            if (img.status === 'pending') {
              actions = '<button onclick="approveAICMOImage(\\'' + img.id + '\\')" class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"><i class="fas fa-check mr-1"></i> Aprobar</button>' +
                        '<button onclick="rejectAICMOImage(\\'' + img.id + '\\')" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"><i class="fas fa-times mr-1"></i> Rechazar</button>';
            } else if (img.status === 'approved') {
              actions = '<button onclick="downloadAICMOImage(\\'' + img.image_url + '\\', \\'' + img.id + '\\')" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"><i class="fas fa-download mr-1"></i> Descargar</button>';
            } else {
              actions = '<button onclick="regenerateAICMOImage(\\'' + img.id + '\\')" class="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600"><i class="fas fa-redo mr-1"></i> Regenerar</button>';
            }
            return '<div class="bg-white rounded-xl shadow-sm overflow-hidden">' +
              '<img src="' + (img.image_url || '') + '" alt="Generated" class="w-full h-48 object-cover" onerror="this.style.display=\\'none\\'" />' +
              '<div class="p-4"><div class="flex gap-2">' + actions + '</div>' +
              '<p class="text-sm text-gray-600 mt-3 line-clamp-2">' + (img.prompt || 'Sin prompt') + '</p>' +
              '<p class="text-xs text-gray-400 mt-1">' + new Date(img.created_at).toLocaleDateString() + '</p>' +
              '</div></div>';
          }).join('');
        } catch (error) {
          console.error('Error loading AI CMO images:', error);
        }
      }

      window.approveAICMOImage = async function(imageId) {
        try {
          var token = document.cookie.match(/authToken=([^;]+)/);
          var authToken = token ? token[1] : localStorage.getItem('authToken');
          await fetch('/api/ai-cmo/images/' + imageId + '/approve', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          loadAICMOImages('pending');
        } catch (e) { alert('Error al aprobar'); }
      };

      window.rejectAICMOImage = async function(imageId) {
        try {
          var token = document.cookie.match(/authToken=([^;]+)/);
          var authToken = token ? token[1] : localStorage.getItem('authToken');
          await fetch('/api/ai-cmo/images/' + imageId + '/reject', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          loadAICMOImages('pending');
        } catch (e) { alert('Error al rechazar'); }
      };

      window.downloadAICMOImage = async function(imageUrl, imageId) {
        try {
          var response = await fetch(imageUrl);
          var blob = await response.blob();
          var url = window.URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'marketing-' + imageId + '.png';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (e) { alert('Error al descargar'); }
      };

      window.regenerateAICMOImage = async function(imageId) {
        try {
          var token = document.cookie.match(/authToken=([^;]+)/);
          var authToken = token ? token[1] : localStorage.getItem('authToken');
          await fetch('/api/ai-cmo/images/' + imageId + '/regenerate', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          loadAICMOImages('pending');
        } catch (e) { alert('Error al regenerar'); }
      };

      async function generateMarketingPlan() {
        const websiteUrl = prompt('Enter website URL to analyze:');
        if (!websiteUrl) return;
        
        const chatBox = document.getElementById('chat-messages');
        if (!chatBox) return;
        
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'flex gap-3 mb-4';
        loadingMsg.innerHTML = \`
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">AI</div>
          <div class="flex-1 bg-white rounded-lg p-4 shadow-sm"><div class="animate-pulse">Analyzing brand and generating images...</div></div>
        \`;
        chatBox.appendChild(loadingMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        try {
          // Use Cloudflare proxy endpoint instead of calling Railway directly
          const response = await axios.post('/api/chat-agent/brand/generate-images', {
            website_url: websiteUrl
          });
          
          loadingMsg.remove();
          
          const aiMsg = document.createElement('div');
          aiMsg.className = 'flex gap-3 mb-4';
          const formattedResponse = formatMarkdownToHTML(response.data.analysis || 'Analysis complete!');
          const imagesInfo = response.data.images_generated ? '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"><p class="text-sm text-green-800"><i class="fas fa-check-circle mr-2"></i>' + response.data.images_generated + ' images generated! <a href="#" onclick="switchTab(String.fromCharCode(97,105,99,109,111)); return false;" class="font-semibold underline">View in AI CMO</a></p></div>' : '';
          aiMsg.innerHTML = \`
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">AI</div>
            <div class="flex-1 bg-white rounded-lg p-4 shadow-sm">\${formattedResponse}\${imagesInfo}</div>
          \`;
          chatBox.appendChild(aiMsg);
          chatBox.scrollTop = chatBox.scrollHeight;
        } catch (error) {
          loadingMsg.remove();
          const errorMsg = document.createElement('div');
          errorMsg.className = 'flex gap-3 mb-4';
          errorMsg.innerHTML = \`
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">!</div>
            <div class="flex-1 bg-red-50 rounded-lg p-4 border border-red-200"><p class="text-red-800">\${error.response?.data?.detail || error.message || 'Error generating marketing plan'}</p></div>
          \`;
          chatBox.appendChild(errorMsg);
          chatBox.scrollTop = chatBox.scrollHeight;
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
      
      // Helper function to parse scheduled_dates (handles both string and array)
      function parseScheduledDates(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }

      function renderGoalsTable() {
        const tbody = document.getElementById('goals-table-body');
        if (!allGoals.length) {
          tbody.innerHTML = \`
            <tr>
              <td colspan="15" class="px-4 py-8 text-center text-gray-500">
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
            
            // Parse scheduled dates for this goal
            let scheduledDates = parseScheduledDates(goal.scheduled_dates);
            const scheduledCount = scheduledDates.length;

            return \`
              <tr class="\${idx === 0 ? categoryColor : 'hover:bg-gray-50'} group cursor-pointer" onclick="showGoalDetail(\${goal.id})">
                <td class="px-3 py-3 text-sm font-medium text-gray-900">\${idx === 0 ? category : ''}</td>
                <td class="px-3 py-3 text-sm text-gray-700 max-w-[150px]">
                  <div class="truncate hover:whitespace-normal hover:overflow-visible" title="\${goal.description || ''}">\${goal.description || ''}</div>
                </td>
                <td class="px-3 py-3 text-sm text-gray-900 font-medium max-w-[200px]">
                  <div class="truncate hover:whitespace-normal hover:overflow-visible" title="\${goal.task || goal.description || ''}">\${goal.task || goal.description || ''}</div>
                </td>
                <td class="px-2 py-3 text-center">
                  <span class="px-2 py-1 text-xs font-medium rounded-full \${priorityColors[goal.priority] || 'bg-gray-100 text-gray-800'}">
                    \${goal.priority || 'P0'}
                  </span>
                </td>
                <td class="px-2 py-3 text-sm text-gray-600 text-center">\${goal.cadence || 'One time'}</td>
                <td class="px-2 py-3 text-sm text-gray-600 text-center">\${goal.dri || '-'}</td>
                <td class="px-2 py-3 text-center">
                  <span class="px-2 py-1 text-xs font-medium rounded-full \${statusColors[goal.goal_status] || 'bg-gray-100 text-gray-800'}">
                    \${goal.goal_status || 'To start'}
                  </span>
                </td>
                <td class="px-2 py-3 text-center" onclick="event.stopPropagation()">
                  <button 
                    onclick="openGoalCalendar(\${goal.id})" 
                    class="px-3 py-2 rounded-lg transition-all duration-200 \${
                      scheduledCount > 0 
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-500 hover:bg-purple-100 border border-gray-200'
                    }"
                    title="Schedule on calendar"
                  >
                    <i class="fas fa-calendar-day"></i>
                    \${scheduledCount > 0 ? '<span class="ml-1 text-xs">' + scheduledCount + '</span>' : ''}
                  </button>
                </td>
                <td class="px-2 py-3 text-center" onclick="event.stopPropagation()">
                  <div class="flex gap-1 justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onclick="editGoal(\${goal.id})" class="text-gray-400 hover:text-purple-600 p-1">
                      <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deleteGoal(\${goal.id})" class="text-gray-400 hover:text-red-600 p-1">
                      <i class="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            \`;
          }).join('');
        }).join('');
        
        // Update timeline overview after rendering table
        updateCalendarOverview();
      }
      
      // Calendar state
      let currentCalendarYear = new Date().getFullYear();
      let currentCalendarMonth = new Date().getMonth();
      let currentGoalIdForCalendar = null;
      
      // Function to update the monthly calendar overview visualization
      function updateCalendarOverview() {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthTitle = document.getElementById('calendar-month-title');
        if (!calendarGrid) return;
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        if (monthTitle) {
          monthTitle.textContent = monthNames[currentCalendarMonth] + ' ' + currentCalendarYear;
        }
        
        // Get first day and days in month
        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startDayOfWeek = firstDay.getDay(); // 0 = Sunday
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday = 0
        
        // Count tasks per day
        const taskCounts = {};
        allGoals.forEach(goal => {
          let dates = parseScheduledDates(goal.scheduled_dates);
          dates.forEach(dateStr => {
            if (taskCounts[dateStr]) {
              taskCounts[dateStr]++;
            } else {
              taskCounts[dateStr] = 1;
            }
          });
        });
        
        // Build calendar HTML
        let html = '';
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        // Empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
          html += '<div class="h-10"></div>';
        }
        
        // Day cells
        let totalScheduled = 0;
        let busiestDay = null;
        let busiestCount = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = currentCalendarYear + '-' + String(currentCalendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
          const count = taskCounts[dateStr] || 0;
          totalScheduled += count;
          
          if (count > busiestCount) {
            busiestCount = count;
            busiestDay = day;
          }
          
          const isToday = dateStr === todayStr;
          const isWeekend = ((startDayOfWeek + day - 1) % 7) >= 5;
          
          let bgColor = 'bg-white';
          let textColor = 'text-gray-700';
          if (count >= 5) {
            bgColor = 'bg-red-400';
            textColor = 'text-white';
          } else if (count >= 3) {
            bgColor = 'bg-yellow-400';
            textColor = 'text-white';
          } else if (count > 0) {
            bgColor = 'bg-green-400';
            textColor = 'text-white';
          } else if (isWeekend) {
            bgColor = 'bg-gray-50';
            textColor = 'text-gray-400';
          }
          
          html += \`
            <div class="h-10 \${bgColor} \${textColor} rounded-lg flex flex-col items-center justify-center text-xs font-medium relative cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all \${isToday ? 'ring-2 ring-purple-600' : ''}" 
                 onclick="showDayTasks('\${dateStr}')" title="\${count} tasks">
              <span>\${day}</span>
              \${count > 0 ? '<span class="text-[10px] opacity-80">' + count + '</span>' : ''}
            </div>
          \`;
        }
        
        calendarGrid.innerHTML = html;
        
        // Update total
        const totalEl = document.getElementById('timeline-total-tasks');
        if (totalEl) {
          totalEl.textContent = totalScheduled + ' tasks scheduled';
        }
        
        // Update busiest day
        const busiestEl = document.getElementById('busiest-day');
        if (busiestEl) {
          if (busiestDay && busiestCount > 0) {
            busiestEl.innerHTML = '<i class="fas fa-fire text-orange-500"></i> Busiest: Day ' + busiestDay + ' (' + busiestCount + ' tasks)';
          } else {
            busiestEl.textContent = 'No tasks scheduled yet';
          }
        }
      }
      
      window.changeCalendarMonth = function(delta) {
        currentCalendarMonth += delta;
        if (currentCalendarMonth < 0) {
          currentCalendarMonth = 11;
          currentCalendarYear--;
        } else if (currentCalendarMonth > 11) {
          currentCalendarMonth = 0;
          currentCalendarYear++;
        }
        updateCalendarOverview();
      };
      
      window.showDayTasks = function(dateStr) {
        // Find tasks scheduled for this day
        const tasksForDay = allGoals.filter(goal => {
          let dates = parseScheduledDates(goal.scheduled_dates);
          return dates.includes(dateStr);
        });
        
        if (tasksForDay.length === 0) {
          alert('No tasks scheduled for ' + dateStr);
          return;
        }
        
        const taskList = tasksForDay.map(g => '• ' + (g.task || g.description)).join('\\n');
        alert('Tasks for ' + dateStr + ':\\n\\n' + taskList);
      };
      
      window.openGoalCalendar = function(goalId) {
        const goal = allGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        currentGoalIdForCalendar = goalId;
        
        // Show the goal calendar modal
        const modal = document.getElementById('goal-calendar-modal');
        if (modal) {
          document.getElementById('goal-calendar-title').textContent = goal.task || goal.description || 'Schedule Goal';
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          renderGoalCalendar();
        }
      };
      
      window.closeGoalCalendarModal = function() {
        const modal = document.getElementById('goal-calendar-modal');
        if (modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
        currentGoalIdForCalendar = null;
      };
      
      function renderGoalCalendar() {
        const goal = allGoals.find(g => g.id === currentGoalIdForCalendar);
        if (!goal) return;
        
        let scheduledDates = parseScheduledDates(goal.scheduled_dates);
        
        const calendarGrid = document.getElementById('goal-calendar-grid');
        const monthTitle = document.getElementById('goal-calendar-month');
        if (!calendarGrid) return;
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        if (monthTitle) {
          monthTitle.textContent = monthNames[currentCalendarMonth] + ' ' + currentCalendarYear;
        }
        
        // Get first day and days in month
        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startDayOfWeek = firstDay.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        
        let html = '';
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        // Empty cells
        for (let i = 0; i < startDayOfWeek; i++) {
          html += '<div class="h-12"></div>';
        }
        
        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = currentCalendarYear + '-' + String(currentCalendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
          const isScheduled = scheduledDates.includes(dateStr);
          const isToday = dateStr === todayStr;
          const isWeekend = ((startDayOfWeek + day - 1) % 7) >= 5;
          
          html += \`
            <button 
              onclick="toggleGoalDate('\${dateStr}')"
              class="h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 \${
                isScheduled 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg scale-105' 
                  : isWeekend 
                    ? 'bg-gray-100 text-gray-400 hover:bg-purple-100' 
                    : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              } \${isToday ? 'ring-2 ring-purple-600' : ''}"
            >
              \${day}
              \${isScheduled ? '<i class="fas fa-check ml-1 text-xs"></i>' : ''}
            </button>
          \`;
        }
        
        calendarGrid.innerHTML = html;
      }
      
      window.toggleGoalDate = async function(dateStr) {
        const goal = allGoals.find(g => g.id === currentGoalIdForCalendar);
        if (!goal) return;
        
        let scheduledDates = parseScheduledDates(goal.scheduled_dates);
        
        const idx = scheduledDates.indexOf(dateStr);
        if (idx >= 0) {
          scheduledDates.splice(idx, 1);
        } else {
          scheduledDates.push(dateStr);
          scheduledDates.sort();
        }
        
        try {
          await axios.put('/api/dashboard/goals/' + goal.id, { scheduled_dates: scheduledDates });
          goal.scheduled_dates = JSON.stringify(scheduledDates);
          renderGoalCalendar();
          renderGoalsTable();
        } catch (e) {
          console.error('Error updating schedule:', e);
          alert('Failed to update schedule');
        }
      };
      
      window.changeGoalCalendarMonth = function(delta) {
        currentCalendarMonth += delta;
        if (currentCalendarMonth < 0) {
          currentCalendarMonth = 11;
          currentCalendarYear--;
        } else if (currentCalendarMonth > 11) {
          currentCalendarMonth = 0;
          currentCalendarYear++;
        }
        renderGoalCalendar();
      };
      
      // Goal detail modal functions
      let currentDetailGoalId = null;
      
      window.showGoalDetail = function(goalId) {
        const goal = allGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        currentDetailGoalId = goalId;
        
        // Populate modal
        document.getElementById('detail-category').textContent = goal.category || 'ASTAR';
        document.getElementById('detail-task').textContent = goal.task || goal.description || 'No task defined';
        document.getElementById('detail-description').textContent = goal.description || 'No description';
        document.getElementById('detail-priority').textContent = goal.priority || 'P0';
        document.getElementById('detail-status').textContent = goal.goal_status || 'To start';
        document.getElementById('detail-cadence').textContent = goal.cadence || 'One time';
        document.getElementById('detail-dri').textContent = goal.dri || 'Not assigned';
        
        // Populate scheduled dates
        let scheduledDates = parseScheduledDates(goal.scheduled_dates);
        
        let scheduleHtml = '';
        if (scheduledDates.length === 0) {
          scheduleHtml = '<span class="text-gray-400 text-sm">No dates scheduled</span>';
        } else {
          scheduleHtml = scheduledDates.map(dateStr => {
            const date = new Date(dateStr);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            return \`<span class="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm rounded-full">\${date.toLocaleDateString('en-US', options)}</span>\`;
          }).join('');
        }
        document.getElementById('detail-schedule').innerHTML = scheduleHtml;
        
        // Show modal
        document.getElementById('goal-detail-modal').classList.remove('hidden');
        document.getElementById('goal-detail-modal').classList.add('flex');
      };
      
      window.closeGoalDetailModal = function() {
        document.getElementById('goal-detail-modal').classList.add('hidden');
        document.getElementById('goal-detail-modal').classList.remove('flex');
        currentDetailGoalId = null;
      };
      
      window.editGoalFromDetail = function() {
        if (currentDetailGoalId) {
          closeGoalDetailModal();
          editGoal(currentDetailGoalId);
        }
      };

      window.editGoal = function(goalId) {
        const goal = allGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        // Store goal ID FIRST before opening modal
        const form = document.getElementById('goal-form');
        if (form) form.dataset.editingGoalId = goalId;
        
        // Show modal first
        document.getElementById('goal-modal').classList.remove('hidden'); 
        document.getElementById('goal-modal').classList.add('flex');
        
        // Then populate with existing goal data
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
          
          console.log('[GOAL] Saving goal:', { editingGoalId, goalData });
          
          if (editingGoalId) {
            // Update existing goal
            console.log('[GOAL] Updating goal:', editingGoalId);
            const response = await axios.put('/api/dashboard/goals/' + editingGoalId, goalData);
            console.log('[GOAL] Update response:', response.data);
          } else {
            // Create new goal
            console.log('[GOAL] Creating new goal');
            const response = await axios.post('/api/dashboard/goals', goalData);
            console.log('[GOAL] Create response:', response.data);
          }
          
          closeGoalModal();
          console.log('[GOAL] Reloading dashboard data...');
          await loadDashboardData();
          console.log('[GOAL] Dashboard data reloaded successfully');
          alert('Goal saved successfully! ✅');
        } catch (e) { 
          console.error('[GOAL] Error saving goal:', e);
          console.error('[GOAL] Error details:', e.response?.data);
          alert('Error saving goal: ' + (e.response?.data?.error || e.message)); 
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

      // Load active users
      async function loadActiveUsers() {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          // Get all users from validators and founders
          const [validatorsRes, foundersRes] = await Promise.all([
            axios.get('/api/validation/validators', { headers: { Authorization: 'Bearer ' + token } }),
            axios.get('/api/marketplace/products?limit=100', { headers: { Authorization: 'Bearer ' + token } })
          ]);
          
          const validators = validatorsRes.data || [];
          const founders = (foundersRes.data?.products || []).map(p => ({
            id: p.company_user_id || p.id,
            name: p.company_name || p.company || p.title,
            role: 'founder',
            avatar: p.company_avatar,
            title: p.title
          }));
          
          activeUsers = [
            ...validators.map(v => ({ ...v, role: 'validator' })),
            ...founders
          ];
          
          renderActiveUsers();
        } catch (e) {
          console.error('Error loading active users:', e);
          document.getElementById('active-users-list').innerHTML = '<div class="p-8 text-center text-gray-500"><p>No active users</p></div>';
        }
      }

      function renderActiveUsers() {
        const container = document.getElementById('active-users-list');
        if (!activeUsers.length) {
          container.innerHTML = '<div class="p-8 text-center text-gray-500"><i class="fas fa-users text-4xl mb-4 text-gray-300"></i><p>No active users</p></div>';
          return;
        }
        
        container.innerHTML = activeUsers.map(user => \`
          <div onclick="startConversationWith(\${user.id}, '\${(user.name || '').replace(/'/g, "\\\\'")}', '\${user.role}')" class="p-4 hover:bg-gray-50 cursor-pointer transition">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  \${user.avatar ? \`<img src="\${user.avatar}" class="w-full h-full rounded-full object-cover" />\` : (user.name || 'U')[0].toUpperCase()}
                </div>
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 truncate">\${user.name || 'User'}</p>
                <p class="text-xs text-gray-500 truncate">
                  \${user.role === 'validator' ? '✅ Validator' : '🚀 Founder'}
                  \${user.title ? ' • ' + user.title : ''}
                </p>
              </div>
              <i class="fas fa-comment-dots text-gray-400"></i>
            </div>
          </div>
        \`).join('');
      }

      function showInboxSection(section) {
        currentInboxSection = section;
        
        // Update buttons
        const activeBtn = document.getElementById('inbox-active-btn');
        const conversationsBtn = document.getElementById('inbox-conversations-btn');
        
        if (section === 'active') {
          activeBtn.classList.add('text-primary', 'border-primary', 'bg-primary/5');
          activeBtn.classList.remove('text-gray-500', 'border-transparent');
          conversationsBtn.classList.remove('text-primary', 'border-primary', 'bg-primary/5');
          conversationsBtn.classList.add('text-gray-500', 'border-transparent');
          
          document.getElementById('active-users-list').classList.remove('hidden');
          document.getElementById('conversations-list').classList.add('hidden');
        } else {
          conversationsBtn.classList.add('text-primary', 'border-primary', 'bg-primary/5');
          conversationsBtn.classList.remove('text-gray-500', 'border-transparent');
          activeBtn.classList.remove('text-primary', 'border-primary', 'bg-primary/5');
          activeBtn.classList.add('text-gray-500', 'border-transparent');
          
          document.getElementById('conversations-list').classList.remove('hidden');
          document.getElementById('active-users-list').classList.add('hidden');
        }
      }

      async function startConversationWith(userId, userName, userRole) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          // Create or get conversation with this user
          const res = await axios.post('/api/chat/conversations', {
            other_user_id: userId
          }, { headers: { Authorization: 'Bearer ' + token } });
          
          if (res.data.conversation_id) {
            selectConversation(res.data.conversation_id);
            // Switch to conversations tab to show the chat
            showInboxSection('conversations');
            // Reload conversations to update the list
            loadConversations();
          }
        } catch (e) {
          console.error('Error starting conversation:', e);
          alert('Error al iniciar conversación. Por favor intenta de nuevo.');
        }
      }

      // For Connector suggestions - just needs user ID
      async function startConversation(userId) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          // Create or get conversation with this user
          const res = await axios.post('/api/chat/conversations', {
            other_user_id: userId
          }, { headers: { Authorization: 'Bearer ' + token } });
          
          if (res.data.conversation_id) {
            selectConversation(res.data.conversation_id);
            // Switch to inbox tab and conversations section
            switchTab('inbox');
            showInboxSection('conversations');
            // Reload conversations to update the list
            loadConversations();
          }
        } catch (e) {
          console.error('Error starting conversation:', e);
          alert('Error al iniciar conversación. Por favor intenta de nuevo.');
        }
      }

      // View user profile in directory
      function viewProfile(userId) {
        // Switch to directory tab
        switchTab('directory');
        // Scroll to the user if needed
        setTimeout(() => {
          const userCard = document.querySelector(\`[data-user-id="\${userId}"]\`);
          if (userCard) {
            userCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            userCard.classList.add('ring-2', 'ring-purple-500');
            setTimeout(() => {
              userCard.classList.remove('ring-2', 'ring-purple-500');
            }, 2000);
          }
        }, 100);
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
        if (!container) return; // Element doesn't exist, skip rendering
        
        if (!conversations.length) {
          container.innerHTML = '<div class="text-center py-6 text-gray-500"><p class="text-sm">No messages yet</p></div>';
          return;
        }
        container.innerHTML = conversations.slice(0, 3).map(c => \`
          <div onclick="switchTab(\\'inbox\\'); setTimeout(() => selectConversation(\${c.id}), 100);" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
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

      // Directory
      function showDirectorySection(section) {
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
        showUserProfile(validatorUserId);
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
          
          container.innerHTML = users.map(u => {
            const avatarUrl = u.avatar_url || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(u.name || 'U')}&background=random\`;
            const roleLabels = {
              founder: '🚀 Founder',
              investor: '💰 Investor',
              scout: '🔍 Scout',
              partner: '🤝 Partner',
              job_seeker: '👨‍💻 Talent'
            };
            const roleLabel = roleLabels[role] || role;
            
            return \`
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div class="flex items-start gap-3 mb-3">
                <img src="\${avatarUrl}" class="w-14 h-14 rounded-full" alt="\${u.name}"/>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900">\${u.name || 'User'}</h3>
                  <p class="text-sm text-gray-500">\${roleLabel}</p>
                  \${u.company ? \`<p class="text-xs text-gray-400 mt-1">\${u.company}</p>\` : ''}
                </div>
              </div>
              \${u.bio ? \`<p class="text-sm text-gray-600 mb-3 line-clamp-2">\${u.bio}</p>\` : ''}
              <div class="flex gap-2">
                <button onclick="viewValidatorProfile(\${u.id})" class="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
                  <i class="fas fa-user mr-1"></i>View Profile
                </button>
                <button onclick="startChatWithValidator(\${u.id})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" title="Chat">
                  <i class="fas fa-comment"></i>
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
        showUserProfile(userId);
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

      // Show user profile with onboarding data
      async function showUserProfile(userId) {
        try {
          const token = getAuthToken();
          const response = await axios.get(\`/api/auth/user-profile/\${userId}\`);
          const profile = response.data;

          if (!profile) {
            alert('Profile not found');
            return;
          }

          // Create modal
          const modal = document.createElement('div');
          modal.id = 'user-profile-modal';
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
          modal.style.display = 'flex';

          const onboardingHTML = renderOnboardingData(profile.onboarding, profile.role);

          modal.innerHTML = \`
            <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white sticky top-0 z-10">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-4">
                    <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center text-primary text-3xl font-bold shadow-lg">
                      \${profile.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold">\${profile.name}</h2>
                      <p class="text-purple-100 text-sm mt-1">\${profile.email}</p>
                      <div class="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        \${getRoleLabel(profile.role)}
                      </div>
                    </div>
                  </div>
                  <button onclick="closeUserProfileModal()" class="text-white hover:text-purple-200 transition text-2xl">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="p-6 space-y-6">
                \${profile.bio ? \`
                  <div class="bg-gray-50 rounded-xl p-4">
                    <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                      <i class="fas fa-user text-primary mr-2"></i>
                      About
                    </h3>
                    <p class="text-gray-700">\${profile.bio}</p>
                  </div>
                \` : ''}

                \${profile.company ? \`
                  <div class="bg-gray-50 rounded-xl p-4">
                    <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                      <i class="fas fa-building text-primary mr-2"></i>
                      Company
                    </h3>
                    <p class="text-gray-700">\${profile.company}</p>
                  </div>
                \` : ''}

                \${onboardingHTML}

                \${(profile.linkedin_url || profile.twitter_url || profile.website_url) ? \`
                  <div class="bg-gray-50 rounded-xl p-4">
                    <h3 class="font-semibold text-gray-900 mb-3 flex items-center">
                      <i class="fas fa-link text-primary mr-2"></i>
                      Links
                    </h3>
                    <div class="flex flex-wrap gap-3">
                      \${profile.linkedin_url ? \`
                        <a href="\${profile.linkedin_url}" target="_blank" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2">
                          <i class="fab fa-linkedin"></i>
                          <span>LinkedIn</span>
                        </a>
                      \` : ''}
                      \${profile.twitter_url ? \`
                        <a href="\${profile.twitter_url}" target="_blank" class="bg-sky-400 text-white px-4 py-2 rounded-lg hover:bg-sky-500 transition flex items-center space-x-2">
                          <i class="fab fa-twitter"></i>
                          <span>Twitter</span>
                        </a>
                      \` : ''}
                      \${profile.website_url ? \`
                        <a href="\${profile.website_url}" target="_blank" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center space-x-2">
                          <i class="fas fa-globe"></i>
                          <span>Website</span>
                        </a>
                      \` : ''}
                    </div>
                  </div>
                \` : ''}

                <div class="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <i class="fas fa-calendar text-primary mr-1"></i>
                  Member since \${new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          \`;

          document.body.appendChild(modal);

          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              closeUserProfileModal();
            }
          });

        } catch (error) {
          console.error('Error loading user profile:', error);
          alert('Failed to load profile');
        }
      }

      function getRoleLabel(role) {
        const labels = {
          founder: '🚀 Founder',
          investor: '💰 Investor',
          validator: '✅ Validator',
          scout: '🔍 Scout',
          partner: '🤝 Partner',
          job_seeker: '👨‍💻 Job Seeker',
          other: '✨ Other'
        };
        return labels[role] || '👤 User';
      }

      function renderOnboardingData(onboarding, role) {
        if (!onboarding) return '';

        const fieldLabels = {
          founder: {
            startup_name: { icon: 'fas fa-rocket', label: 'Startup Name' },
            startup_stage: { icon: 'fas fa-chart-line', label: 'Stage' },
            industry: { icon: 'fas fa-industry', label: 'Industry' },
            funding_status: { icon: 'fas fa-money-bill-wave', label: 'Funding Status' },
            funding_goal: { icon: 'fas fa-bullseye', label: 'Funding Goal' },
            team_size: { icon: 'fas fa-users', label: 'Team Size' },
            pitch_deck_url: { icon: 'fas fa-file-powerpoint', label: 'Pitch Deck' }
          },
          investor: {
            investor_type: { icon: 'fas fa-briefcase', label: 'Investor Type' },
            investment_stage: { icon: 'fas fa-seedling', label: 'Investment Stage' },
            check_size: { icon: 'fas fa-dollar-sign', label: 'Check Size' },
            investment_focus: { icon: 'fas fa-bullseye', label: 'Investment Focus' },
            geographic_focus: { icon: 'fas fa-globe-americas', label: 'Geographic Focus' },
            notable_investments: { icon: 'fas fa-star', label: 'Notable Investments' }
          },
          validator: {
            expertise: { icon: 'fas fa-certificate', label: 'Expertise' },
            years_experience: { icon: 'fas fa-calendar-alt', label: 'Years of Experience' },
            hourly_rate: { icon: 'fas fa-dollar-sign', label: 'Hourly Rate' },
            availability: { icon: 'fas fa-clock', label: 'Availability' },
            portfolio_url: { icon: 'fas fa-briefcase', label: 'Portfolio' }
          },
          scout: {
            scout_for: { icon: 'fas fa-search', label: 'Scouting For' },
            scout_focus: { icon: 'fas fa-target', label: 'Focus Areas' },
            scout_commission: { icon: 'fas fa-percentage', label: 'Commission Structure' },
            deals_closed: { icon: 'fas fa-handshake', label: 'Deals Closed' }
          },
          partner: {
            partner_type: { icon: 'fas fa-handshake', label: 'Partner Type' },
            services_offered: { icon: 'fas fa-cogs', label: 'Services Offered' },
            target_clients: { icon: 'fas fa-users', label: 'Target Clients' },
            case_studies: { icon: 'fas fa-trophy', label: 'Case Studies' }
          },
          job_seeker: {
            job_title: { icon: 'fas fa-id-badge', label: 'Job Title' },
            experience_years: { icon: 'fas fa-calendar-check', label: 'Experience Level' },
            skills: { icon: 'fas fa-code', label: 'Skills' },
            looking_for: { icon: 'fas fa-search', label: 'Looking For' },
            portfolio_url: { icon: 'fas fa-folder-open', label: 'Portfolio' }
          }
        };

        const fields = fieldLabels[role] || {};
        const entries = Object.entries(onboarding).filter(([key]) => 
          fields[key] && onboarding[key] && onboarding[key] !== '' && key !== 'role' && key !== 'email' && key !== 'name'
        );

        if (entries.length === 0) return '';

        return \`
          <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
            <h3 class="font-bold text-gray-900 mb-4 flex items-center text-lg">
              <i class="fas fa-info-circle text-primary mr-2"></i>
              Profile Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              \${entries.map(([key, value]) => {
                const field = fields[key];
                if (!field) return '';
                
                return \`
                  <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-start space-x-3">
                      <div class="text-primary mt-1">
                        <i class="\${field.icon}"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">\${field.label}</p>
                        <p class="text-gray-900 font-medium break-words">\${String(value)}</p>
                      </div>
                    </div>
                  </div>
                \`;
              }).join('')}
            </div>
          </div>
        \`;
      }

      function closeUserProfileModal() {
        const modal = document.getElementById('user-profile-modal');
        if (modal) {
          modal.remove();
        }
      }

      // Make functions available globally
      window.showUserProfile = showUserProfile;
      window.closeUserProfileModal = closeUserProfileModal;

      // Initialize
      const currentUserRole = '${userRole || 'founder'}';
      
      window.addEventListener('load', () => {
        console.log('[MARKETPLACE-LOAD] Page loaded, checking URL params...');
        
        // Load data only for founders
        if (currentUserRole === 'founder') {
          loadDashboardData();
        }
        loadConversations();
        loadActiveUsers(); // Load active users for inbox
        
        // Check if URL has tab parameter
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const chatContext = urlParams.get('chat');
        const astarResponse = urlParams.get('astarResponse');
        
        console.log('[MARKETPLACE-LOAD] URL params:', { tabParam, chatContext, astarResponse: astarResponse ? astarResponse.substring(0, 50) + '...' : null });
        
        if (tabParam && ['home', 'traction', 'inbox', 'directory', 'aicmo'].includes(tabParam)) {
          console.log('[MARKETPLACE-LOAD] Valid tab, switching to:', tabParam);
          // Switch to the requested tab
          switchTab(tabParam);
          
          // Si viene con contexto de email Y respuesta ASTAR, procesarla
          if (chatContext && astarResponse) {
            console.log('[MARKETPLACE-LOAD] ASTAR response detected, will open chat in 500ms');
            setTimeout(function() {
              console.log('[MARKETPLACE-LOAD] Opening chat sidebar...');
              // Abrir el chat sidebar del layout
              var sidebar = document.getElementById('chat-sidebar');
              var floatingBtn = document.getElementById('chat-floating-btn');
              var isMobile = window.innerWidth <= 768;
              
              console.log('[MARKETPLACE-LOAD] Sidebar element:', sidebar);
              
              if (sidebar) {
                sidebar.style.width = isMobile ? '100%' : '400px';
                sidebar.style.maxWidth = '400px';
                sidebar.style.display = 'flex';
                if (floatingBtn) floatingBtn.style.display = 'none';
                console.log('[MARKETPLACE-LOAD] Chat sidebar opened successfully');
              } else {
                console.error('[MARKETPLACE-LOAD] ERROR: chat-sidebar element not found!');
              }
              
              // Enviar la respuesta del usuario directamente al chat
              console.log('[MARKETPLACE-LOAD] Calling processAstarResponse...');
              if (typeof window.processAstarResponse === 'function') {
                processAstarResponse(chatContext, decodeURIComponent(astarResponse));
              } else {
                console.error('[MARKETPLACE-LOAD] ERROR: processAstarResponse function not defined!');
              }
            }, 500);
          }
          // Si solo viene con contexto (sin respuesta), mostrar pregunta inicial
          else if (chatContext) {
            console.log('[INIT] Email context detected:', chatContext);
            setTimeout(function() {
              // Abrir el chat sidebar del layout
              var sidebar = document.getElementById('chat-sidebar');
              var floatingBtn = document.getElementById('chat-floating-btn');
              var isMobile = window.innerWidth <= 768;
              
              if (sidebar) {
                sidebar.style.width = isMobile ? '100%' : '400px';
                sidebar.style.maxWidth = '400px';
                sidebar.style.display = 'flex';
                if (floatingBtn) floatingBtn.style.display = 'none';
              }
              
              // Enviar mensaje inicial con el contexto de email
              sendEmailContextMessage(chatContext);
            }, 500);
          }
        } else if (currentUserRole !== 'founder') {
          // Switch to inbox tab for non-founders if no tab specified
          switchTab('inbox');
        }
        
        // Initialize AI CMO page renderer
        window.renderAICMOPage = ${renderAICMOPageString()};
        
        // Function to send email context to chat
        window.sendEmailContextMessage = async function(emailContext) {
          console.log('[EMAIL-CHAT] Sending email context:', emailContext);
          
          try {
            var chatMessages = document.getElementById('chat-messages');
            
            // Mostrar loading
            var loading = document.getElementById('chat-loading');
            if (loading) loading.classList.remove('hidden');
            
            var response = await axios.post('/api/chat-agent/message', { 
              message: '', // Empty message to trigger initial question
              emailContext: emailContext 
            }, { withCredentials: true });
            
            // Ocultar loading
            if (loading) loading.classList.add('hidden');
            
            console.log('[EMAIL-CHAT] Response:', response.data);
            
            if (response.data && response.data.message && chatMessages) {
              // Show the initial question in the chat
              var messageDiv = document.createElement('div');
              messageDiv.className = 'chat-message flex justify-start';
              messageDiv.innerHTML = '<div class="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[85%] shadow-sm"><p class="text-sm whitespace-pre-wrap">' + response.data.message.replace(/\\n/g, '<br>') + '</p></div>';
              chatMessages.appendChild(messageDiv);
              chatMessages.scrollTop = chatMessages.scrollHeight;
              
              // Store the email context in a global variable so we can send it with the next message
              window.currentEmailContext = emailContext;
            }
          } catch (error) {
            console.error('[EMAIL-CHAT] Error:', error);
            var loading = document.getElementById('chat-loading');
            if (loading) loading.classList.add('hidden');
          }
        };
        
        // Function to process ASTAR response directly
        window.processAstarResponse = async function(emailContext, userResponse) {
          console.log('[ASTAR-PROCESS] Processing:', { emailContext, userResponse });
          
          try {
            // Primero mostrar el mensaje del usuario en el chat
            var chatMessages = document.getElementById('chat-messages');
            console.log('[ASTAR-PROCESS] Chat messages container:', chatMessages);
            
            if (chatMessages) {
              // Mensaje del usuario
              var userDiv = document.createElement('div');
              userDiv.className = 'chat-message flex justify-end';
              userDiv.innerHTML = '<div class="bg-gradient-to-r from-primary to-secondary text-white rounded-lg px-4 py-2 max-w-[85%] shadow-sm"><p class="text-sm whitespace-pre-wrap">' + userResponse.replace(/\\n/g, '<br>') + '</p></div>';
              chatMessages.appendChild(userDiv);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Mostrar loading
            var loading = document.getElementById('chat-loading');
            if (loading) loading.classList.remove('hidden');
            
            // Enviar la respuesta del usuario directamente al chat con contexto
            var response = await axios.post('/api/chat-agent/message', { 
              message: userResponse,
              emailContext: emailContext 
            }, { withCredentials: true });
            
            // Ocultar loading
            if (loading) loading.classList.add('hidden');
            
            console.log('[ASTAR-PROCESS] Response:', response.data);
            
            // Mostrar respuesta del asistente
            if (chatMessages && response.data && response.data.message) {
              var assistantDiv = document.createElement('div');
              assistantDiv.className = 'chat-message flex justify-start';
              assistantDiv.innerHTML = '<div class="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[85%] shadow-sm"><p class="text-sm whitespace-pre-wrap">' + response.data.message.replace(/\\n/g, '<br>') + '</p></div>';
              chatMessages.appendChild(assistantDiv);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Limpiar URL parameters
            var newUrl = window.location.pathname + '?tab=home';
            window.history.replaceState({}, '', newUrl);
            
            // Recargar goals después de un momento
            setTimeout(function() {
              if (typeof loadDashboardData === 'function') {
                loadDashboardData();
              }
            }, 2000);
            
          } catch (error) {
            console.error('[ASTAR-PROCESS] Error:', error);
            var loading = document.getElementById('chat-loading');
            if (loading) loading.classList.add('hidden');
          }
        };
      });
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'directory',
    userName,
    userAvatar,
    pageTitle: 'Dashboard',
    userRole
  });
}
