/**
 * Admin Dashboard Page
 * Statistics, reports, and competition management for admins
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export interface AdminDashboardProps {
  userName: string;
  userAvatar?: string;
  userRole: string;
}

export function getAdminDashboard(props: AdminDashboardProps): string {
  const { userName, userAvatar, userRole } = props;

  const content = `
    <div class="max-w-7xl mx-auto p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          <i class="fas fa-shield-alt text-primary mr-3"></i>Admin Dashboard
        </h1>
        <p class="text-gray-600">Manage competitions, view statistics, and monitor platform activity</p>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <i class="fas fa-users text-3xl opacity-80"></i>
            <span id="total-users" class="text-3xl font-bold">0</span>
          </div>
          <p class="text-blue-100">Total Users</p>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <i class="fas fa-rocket text-3xl opacity-80"></i>
            <span id="total-projects" class="text-3xl font-bold">0</span>
          </div>
          <p class="text-green-100">Total Projects</p>
        </div>

        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <i class="fas fa-trophy text-3xl opacity-80"></i>
            <span id="active-competitions" class="text-3xl font-bold">0</span>
          </div>
          <p class="text-purple-100">Active Competitions</p>
        </div>

        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <i class="fas fa-dollar-sign text-3xl opacity-80"></i>
            <span id="total-revenue" class="text-3xl font-bold">$0</span>
          </div>
          <p class="text-orange-100">Total Revenue</p>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div class="bg-white rounded-lg shadow-lg mb-6">
        <div class="border-b border-gray-200 overflow-x-auto">
          <nav class="flex space-x-2 md:space-x-8 px-3 md:px-6 min-w-max" aria-label="Tabs">
            <button onclick="showAdminTab('statistics')" id="statistics-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-primary text-primary whitespace-nowrap">
              <i class="fas fa-chart-bar mr-1 md:mr-2"></i><span class="hidden sm:inline">Statistics</span><span class="sm:hidden">Stats</span>
            </button>
            <button onclick="showAdminTab('startups')" id="startups-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-rocket mr-1 md:mr-2"></i>Startups
            </button>
            <button onclick="showAdminTab('competitions')" id="competitions-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-trophy mr-1 md:mr-2"></i><span class="hidden sm:inline">Competitions</span><span class="sm:hidden">Comp</span>
            </button>
            <button onclick="showAdminTab('users')" id="users-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-users mr-1 md:mr-2"></i>Users
            </button>
            <button onclick="showAdminTab('activity')" id="activity-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-comments mr-1 md:mr-2"></i><span class="hidden sm:inline">Activity</span><span class="sm:hidden">Chat</span>
            </button>
            <button onclick="showAdminTab('pitch-deck')" id="pitch-deck-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-chart-line mr-1 md:mr-2"></i><span class="hidden sm:inline">Pitch Deck</span><span class="sm:hidden">Pitch</span>
            </button>
            <button onclick="showAdminTab('reports')" id="reports-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-file-alt mr-1 md:mr-2"></i>Reports
            </button>
            <button onclick="showAdminTab('astro')" id="astro-tab" class="admin-tab py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
              <i class="fas fa-robot mr-1 md:mr-2"></i><span class="hidden sm:inline">⚡ Astro AI</span><span class="sm:hidden">Astro</span>
            </button>
          </nav>
        </div>

        <!-- Statistics Tab -->
        <div id="statistics-content" class="admin-tab-content p-6">
          <h2 class="text-xl font-bold mb-4">Platform Statistics</h2>
          
          <!-- Charts -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold mb-3">User Growth</h3>
              <canvas id="user-growth-chart" height="200"></canvas>
            </div>
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold mb-3">Project Categories</h3>
              <canvas id="project-categories-chart" height="200"></canvas>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Recent Activity</h3>
            <div id="recent-activity" class="space-y-2">
              <p class="text-gray-500 text-center py-4">Loading activity...</p>
            </div>
          </div>
        </div>

        <!-- Startups Tab (NEW) -->
        <div id="startups-content" class="admin-tab-content p-3 md:p-6 hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6">
            <h2 class="text-lg md:text-xl font-bold">Startups Dashboard</h2>
            <div class="flex flex-col sm:flex-row gap-2 md:gap-4">
              <input type="text" id="startup-search" placeholder="Search..." class="border rounded-lg px-3 py-2 text-sm w-full sm:w-48 md:w-64">
              <select id="startup-filter" class="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div id="startups-list" class="space-y-4">
            <p class="text-gray-500 text-center py-8">Loading startups...</p>
          </div>

          <!-- Startup Detail Modal -->
          <div id="startup-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-2 md:p-4" style="display: none;">
            <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
              <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-3 md:p-6 text-white sticky top-0 z-10">
                <div class="flex items-center justify-between">
                  <h2 class="text-base md:text-2xl font-bold" id="startup-modal-title">
                    <i class="fas fa-rocket mr-1 md:mr-2"></i>Startup Details
                  </h2>
                  <button onclick="closeStartupDetailModal()" class="text-white hover:text-purple-200 text-xl md:text-2xl">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="p-3 md:p-6" id="startup-detail-content">
                <p class="text-gray-500 text-center py-8">Loading...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Competitions Management Tab -->
        <div id="competitions-content" class="admin-tab-content p-6 hidden">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">Manage Competitions</h2>
            <button onclick="showCreateCompetitionForm()" class="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition">
              <i class="fas fa-plus mr-2"></i>Create Competition
            </button>
          </div>

          <div id="competitions-list" class="space-y-4">
            <p class="text-gray-500 text-center py-8">Loading competitions...</p>
          </div>
        </div>

        <!-- Users Tab -->
        <div id="users-content" class="admin-tab-content p-6 hidden">
          <h2 class="text-xl font-bold mb-4">User Management</h2>
          
          <!-- Search and Filter -->
          <div class="mb-4 flex gap-4">
            <input type="text" id="user-search" placeholder="Search users..." class="flex-1 border rounded-lg px-4 py-2">
            <select id="role-filter" class="border rounded-lg px-4 py-2">
              <option value="">All Roles</option>
              <option value="founder">Founders</option>
              <option value="investor">Investors</option>
              <option value="validator">Validators</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div id="users-list" class="space-y-2">
            <p class="text-gray-500 text-center py-8">Loading users...</p>
          </div>
        </div>

        <!-- Pitch Deck Responses Tab -->
        <div id="pitch-deck-content" class="admin-tab-content p-3 md:p-6 hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <h2 class="text-lg md:text-xl font-bold">🎙️ Pitch Deck Conversations & Data</h2>
            <div class="flex gap-2">
              <select id="pitch-week-filter" class="border rounded-lg px-3 py-2 text-sm">
                <option value="all">All Time</option>
                <option value="current">Current Week</option>
                <option value="last">Last Week</option>
                <option value="today">Today</option>
              </select>
              <button onclick="loadPitchDeckResponses()" class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
              <button onclick="loadConversationPitches()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                <i class="fas fa-comments mr-2"></i>Load Conversations
              </button>
              <button onclick="debugEmailRecipients()" class="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700">
                <i class="fas fa-bug mr-2"></i>Debug
              </button>
            </div>
          </div>

          <!-- Stats Overview -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-comments text-2xl opacity-80"></i>
                <span id="pitch-total-users" class="text-2xl font-bold">0</span>
              </div>
              <p class="text-sm text-purple-100 mt-1">Conversations</p>
            </div>
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-bullseye text-2xl opacity-80"></i>
                <span id="pitch-total-responses" class="text-2xl font-bold">0</span>
              </div>
              <p class="text-sm text-blue-100 mt-1">Goals Generated</p>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-chart-line text-2xl opacity-80"></i>
                <span id="pitch-avg-score" class="text-2xl font-bold">0</span>
              </div>
              <p class="text-sm text-green-100 mt-1">Metrics Saved</p>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-database text-2xl opacity-80"></i>
                <span id="pitch-top-performer" class="text-2xl font-bold">0</span>
              </div>
              <p class="text-sm text-orange-100 mt-1">Raw Data Saved</p>
            </div>
          </div>

          <!-- Email Stats -->
          <div class="bg-white border rounded-lg p-4 mb-6">
            <h3 class="font-bold text-lg mb-3 flex items-center gap-2">
              <i class="fas fa-envelope text-purple-600"></i>
              Email Statistics
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="border-l-4 border-purple-500 pl-3">
                <div class="text-xs text-gray-600">Sent Today</div>
                <div class="text-2xl font-bold text-purple-600" id="emails-today">0</div>
              </div>
              <div class="border-l-4 border-blue-500 pl-3">
                <div class="text-xs text-gray-600">Recipients Today</div>
                <div class="text-2xl font-bold text-blue-600" id="recipients-today">0</div>
              </div>
              <div class="border-l-4 border-green-500 pl-3">
                <div class="text-xs text-gray-600">Sent This Week</div>
                <div class="text-2xl font-bold text-green-600" id="emails-week">0</div>
              </div>
              <div class="border-l-4 border-orange-500 pl-3">
                <div class="text-xs text-gray-600">Total Active Users</div>
                <div class="text-2xl font-bold text-orange-600" id="potential-recipients">0</div>
              </div>
            </div>
            <div id="email-templates-today" class="mt-4 text-sm text-gray-600"></div>
          </div>

          <!-- Sub-tabs for different data views -->
          <div class="border-b border-gray-200 mb-4">
            <nav class="flex space-x-4 overflow-x-auto">
              <button onclick="showPitchSubTab('conversations')" id="conversations-subtab" class="pitch-subtab py-2 px-3 border-b-2 font-medium text-sm border-purple-600 text-purple-600 whitespace-nowrap">
                <i class="fas fa-comments mr-1"></i>Conversations
              </button>
              <button onclick="showPitchSubTab('goals')" id="goals-subtab" class="pitch-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <i class="fas fa-bullseye mr-1"></i>Auto-Goals
              </button>
              <button onclick="showPitchSubTab('metrics')" id="metrics-subtab" class="pitch-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <i class="fas fa-chart-bar mr-1"></i>Saved Metrics
              </button>
              <button onclick="showPitchSubTab('weekly')" id="weekly-subtab" class="pitch-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <i class="fas fa-calendar-week mr-1"></i>Weekly Scores
              </button>
              <button onclick="showPitchSubTab('raw-json')" id="raw-json-subtab" class="pitch-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <i class="fas fa-code mr-1"></i>Raw JSON
              </button>
              <button onclick="showPitchSubTab('legacy')" id="legacy-subtab" class="pitch-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <i class="fas fa-history mr-1"></i>Legacy
              </button>
            </nav>
          </div>

          <!-- Conversations Sub-tab -->
          <div id="conversations-pitch-content" class="pitch-subtab-content">
            <div id="conversations-list" class="space-y-4">
              <p class="text-gray-500 text-center py-8">Click "Load Conversations" to see data</p>
            </div>
          </div>

          <!-- Auto-Goals Sub-tab -->
          <div id="goals-pitch-content" class="pitch-subtab-content hidden">
            <div id="goals-list" class="space-y-3">
              <p class="text-gray-500 text-center py-8">Loading goals...</p>
            </div>
          </div>

          <!-- Saved Metrics Sub-tab -->
          <div id="metrics-pitch-content" class="pitch-subtab-content hidden">
            <div id="metrics-list" class="space-y-3">
              <p class="text-gray-500 text-center py-8">Loading metrics...</p>
            </div>
          </div>

          <!-- Weekly Scores Sub-tab -->
          <div id="weekly-pitch-content" class="pitch-subtab-content hidden">
            <div id="weekly-scores-list" class="space-y-3">
              <p class="text-gray-500 text-center py-8">Loading weekly scores...</p>
            </div>
          </div>

          <!-- Raw JSON Sub-tab -->
          <div id="raw-json-pitch-content" class="pitch-subtab-content hidden">
            <div id="raw-json-list" class="space-y-4">
              <p class="text-gray-500 text-center py-8">Loading raw data...</p>
            </div>
          </div>

          <!-- Legacy Sub-tab (old responses) -->
          <div id="legacy-pitch-content" class="pitch-subtab-content hidden">
            <div id="pitch-responses-list" class="space-y-4">
              <p class="text-gray-500 text-center py-8">Loading legacy responses...</p>
            </div>
          </div>
        </div>

        <!-- Activity Tab (Chat & AI Monitoring) -->
        <div id="activity-content" class="admin-tab-content p-3 md:p-6 hidden">
          <h2 class="text-lg md:text-xl font-bold mb-4">Chat & Activity Monitoring</h2>
          
          <!-- Chat Stats Overview -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 md:p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-comments text-xl md:text-2xl opacity-80"></i>
                <span id="total-user-chats" class="text-xl md:text-2xl font-bold">0</span>
              </div>
              <p class="text-xs md:text-sm text-blue-100 mt-1">User Conversations</p>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 md:p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-envelope text-xl md:text-2xl opacity-80"></i>
                <span id="total-messages" class="text-xl md:text-2xl font-bold">0</span>
              </div>
              <p class="text-xs md:text-sm text-green-100 mt-1">Total Messages</p>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 md:p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-robot text-xl md:text-2xl opacity-80"></i>
                <span id="total-ai-chats" class="text-xl md:text-2xl font-bold">0</span>
              </div>
              <p class="text-xs md:text-sm text-purple-100 mt-1">AI Conversations</p>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 md:p-4 text-white">
              <div class="flex items-center justify-between">
                <i class="fas fa-user-clock text-xl md:text-2xl opacity-80"></i>
                <span id="ai-unique-users" class="text-xl md:text-2xl font-bold">0</span>
              </div>
              <p class="text-xs md:text-sm text-orange-100 mt-1">AI Users</p>
            </div>
          </div>

          <!-- Engagement Chart -->
          <div class="border rounded-lg p-4 mb-6">
            <h3 class="font-semibold mb-3">Engagement Over Time (30 Days)</h3>
            <canvas id="engagement-chart" height="150"></canvas>
          </div>

          <!-- Activity Sub-tabs -->
          <div class="border-b border-gray-200 mb-4">
            <nav class="flex space-x-4">
              <button onclick="showActivitySubTab('user-chats')" id="user-chats-subtab" class="activity-subtab py-2 px-3 border-b-2 font-medium text-sm border-primary text-primary">
                <i class="fas fa-comments mr-1"></i>User Chats
              </button>
              <button onclick="showActivitySubTab('ai-chats')" id="ai-chats-subtab" class="activity-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                <i class="fas fa-robot mr-1"></i>AI Agent Chats
              </button>
              <button onclick="showActivitySubTab('active-users')" id="active-users-subtab" class="activity-subtab py-2 px-3 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                <i class="fas fa-user-clock mr-1"></i>Active Users
              </button>
            </nav>
          </div>

          <!-- User Chats Content -->
          <div id="user-chats-content" class="activity-subtab-content">
            <div id="user-conversations-list" class="space-y-3">
              <p class="text-gray-500 text-center py-8">Loading conversations...</p>
            </div>
          </div>

          <!-- AI Chats Content -->
          <div id="ai-chats-content" class="activity-subtab-content hidden">
            <div id="ai-conversations-list" class="space-y-3">
              <p class="text-gray-500 text-center py-8">Loading AI conversations...</p>
            </div>
          </div>

          <!-- Active Users Content -->
          <div id="active-users-content" class="activity-subtab-content hidden">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-semibold mb-3"><i class="fas fa-trophy text-yellow-500 mr-2"></i>Top Messagers</h4>
                <div id="top-messagers-list" class="space-y-2">
                  <p class="text-gray-500 text-center py-4">Loading...</p>
                </div>
              </div>
              <div>
                <h4 class="font-semibold mb-3"><i class="fas fa-clock text-green-500 mr-2"></i>Recently Active (7 days)</h4>
                <div id="recent-active-list" class="space-y-2">
                  <p class="text-gray-500 text-center py-4">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Conversation Messages Modal -->
        <div id="conversation-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-4 md:p-6 text-white sticky top-0 z-10">
              <div class="flex items-center justify-between">
                <h2 id="conversation-modal-title" class="text-lg md:text-xl font-bold">
                  <i class="fas fa-comments mr-2"></i>Conversation
                </h2>
                <button onclick="closeConversationModal()" class="text-white hover:text-gray-200 text-xl md:text-2xl">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div id="conversation-messages" class="p-4 md:p-6 space-y-4">
              <p class="text-gray-500 text-center py-8">Loading messages...</p>
            </div>
          </div>
        </div>

        <!-- Reports Tab -->
        <!-- ASTRO AI SESSIONS TAB -->
        <div id="astro-content" class="admin-tab-content p-4 md:p-6 hidden">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">⚡ Astro AI — Startup Profiles</h2>
              <p class="text-sm text-gray-500 mt-1">Datos recopilados por Astro a través de conversaciones con founders. Se sincronizan automáticamente con el leaderboard.</p>
            </div>
            <button onclick="loadAstroSessions()" class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
              <i class="fas fa-sync-alt"></i> Actualizar
            </button>
          </div>

          <!-- Summary cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white">
              <p class="text-xs text-purple-200 uppercase font-semibold mb-1">Sessions</p>
              <p class="text-3xl font-bold" id="astro-stat-total">—</p>
            </div>
            <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
              <p class="text-xs text-blue-200 uppercase font-semibold mb-1">Con revenue</p>
              <p class="text-3xl font-bold" id="astro-stat-revenue">—</p>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white">
              <p class="text-xs text-green-200 uppercase font-semibold mb-1">Con usuarios</p>
              <p class="text-3xl font-bold" id="astro-stat-users">—</p>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <p class="text-xs text-orange-200 uppercase font-semibold mb-1">Fundraising activo</p>
              <p class="text-3xl font-bold" id="astro-stat-fundraising">—</p>
            </div>
          </div>

          <!-- Filter bar -->
          <div class="flex flex-wrap gap-3 mb-4">
            <input id="astro-search" type="text" placeholder="Buscar startup o founder..." oninput="filterAstroTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]">
            <select id="astro-filter-stage" onchange="filterAstroTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Todas las etapas</option>
              <option value="pre-seed">Pre-seed</option>
              <option value="seed">Seed</option>
              <option value="series-a">Series A</option>
            </select>
            <select id="astro-filter-sector" onchange="filterAstroTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Todos los sectores</option>
              <option value="AI">AI</option>
              <option value="SaaS">SaaS</option>
              <option value="Marketplace">Marketplace</option>
              <option value="Fintech">Fintech</option>
              <option value="Health">Health</option>
            </select>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto rounded-xl border border-gray-200">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th class="px-4 py-3 text-left">Founder / Startup</th>
                  <th class="px-4 py-3 text-left">Sector</th>
                  <th class="px-4 py-3 text-right">MRR</th>
                  <th class="px-4 py-3 text-right">Usuarios</th>
                  <th class="px-4 py-3 text-center">Etapa</th>
                  <th class="px-4 py-3 text-center">Objetivo</th>
                  <th class="px-4 py-3 text-center">Completitud</th>
                  <th class="px-4 py-3 text-center">Msgs</th>
                  <th class="px-4 py-3 text-left">Actualizado</th>
                </tr>
              </thead>
              <tbody id="astro-tbody" class="divide-y divide-gray-100">
                <tr><td colspan="9" class="px-4 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Detail drawer -->
          <div id="astro-detail-panel" class="hidden mt-6 bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg" id="astro-detail-title">Detalle del startup</h3>
              <button onclick="document.getElementById('astro-detail-panel').classList.add('hidden')" class="text-gray-400 hover:text-gray-700">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div id="astro-detail-body" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>

            <!-- Conversation history section -->
            <div id="astro-conv-section" class="hidden mt-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-800 flex items-center gap-2">
                  <i class="fas fa-comments text-purple-500"></i> Conversación con Astro
                  <span id="astro-conv-count" class="text-xs text-gray-400 font-normal"></span>
                </h4>
                <button id="astro-conv-toggle-btn" class="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1">
                  <i class="fas fa-eye"></i> Ver conversación
                </button>
              </div>
              <div id="astro-conv-messages" class="hidden bg-white rounded-xl border border-gray-200 p-4 max-h-[520px] overflow-y-auto space-y-3"></div>
            </div>
          </div>
        </div>

        <div id="reports-content" class="admin-tab-content p-6 hidden">
          <h2 class="text-xl font-bold mb-4">Generated Reports</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button onclick="generateReport('startups')" class="border-2 border-primary text-primary px-6 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition">
              <i class="fas fa-rocket mr-2"></i>Startup Report
            </button>
            <button onclick="generateReport('competitions')" class="border-2 border-primary text-primary px-6 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition">
              <i class="fas fa-trophy mr-2"></i>Competition Report
            </button>
            <button onclick="generateReport('revenue')" class="border-2 border-primary text-primary px-6 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition">
              <i class="fas fa-dollar-sign mr-2"></i>Revenue Report
            </button>
            <button onclick="generateReport('users')" class="border-2 border-primary text-primary px-6 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition">
              <i class="fas fa-users mr-2"></i>User Report
            </button>
          </div>

          <div id="report-output" class="border rounded-lg p-6 bg-gray-50 hidden">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold">Report Output</h3>
              <button onclick="downloadReport()" class="text-primary hover:underline">
                <i class="fas fa-download mr-1"></i>Download CSV
              </button>
            </div>
            <div id="report-content"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Competition Modal -->
    <div id="create-competition-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div class="flex items-center justify-between">
            <h2 id="competition-modal-title" class="text-2xl font-bold">Create New Competition</h2>
            <button onclick="closeCreateCompetitionModal()" class="text-white hover:text-purple-200 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <form id="create-competition-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Competition Title *</label>
            <input type="text" name="title" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea name="description" required rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Competition Type *</label>
              <select name="competition_type" required class="w-full border border-gray-300 rounded-lg px-4 py-2" onchange="toggleTicketFields(this.value)">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prize Amount</label>
              <input type="text" name="prize_amount" placeholder="$10,000" class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
          </div>

          <div id="ticket-fields" class="space-y-4 hidden">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ticket Price</label>
                <input type="number" name="ticket_price" step="0.01" placeholder="25.00" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input type="date" name="event_date" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                <input type="time" name="event_time" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" placeholder="MAGERIT LAGASCA 18" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Link (Four Revenues)</label>
              <input type="url" name="payment_link" placeholder="https://4rev.com/..." class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input type="datetime-local" name="deadline" class="w-full border border-gray-300 rounded-lg px-4 py-2">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Guidelines</label>
            <textarea name="guidelines" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Rules and submission requirements..."></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="closeCreateCompetitionModal()" class="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" id="competition-submit-btn" class="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark">
              Create Competition
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Participants Modal -->
    <div id="participants-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-users mr-2"></i>Competition Participants
            </h2>
            <button onclick="closeParticipantsModal()" class="text-white hover:text-purple-200 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="p-6">
          <div id="participants-list" class="space-y-3">
            <p class="text-gray-500 text-center py-8">Loading participants...</p>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      let currentReportData = null;
      let editingCompetitionId = null;

      function getAuthToken() {
        return document.cookie.split('; ')
          .find(row => row.startsWith('authToken='))
          ?.split('=')[1];
      }

      async function loadAdminStats() {
        try {
          const token = getAuthToken();
          const headers = { Authorization: \`Bearer \${token}\` };

          const [usersRes, projectsRes, competitionsRes] = await Promise.all([
            axios.get('/api/admin/stats/users', { headers }),
            axios.get('/api/admin/stats/projects', { headers }),
            axios.get('/api/admin/stats/competitions', { headers })
          ]);

          document.getElementById('total-users').textContent = usersRes.data.total || 0;
          document.getElementById('total-projects').textContent = projectsRes.data.total || 0;
          document.getElementById('active-competitions').textContent = competitionsRes.data.active || 0;
          document.getElementById('total-revenue').textContent = '$' + (competitionsRes.data.revenue || 0);

        } catch (error) {
          console.error('Failed to load admin stats:', error);
        }
      }

      async function loadRecentActivity() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/activity', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const activityHtml = response.data.activities.map(a => \`
            <div class="flex items-center justify-between py-2 border-b">
              <div class="flex items-center">
                <i class="fas fa-\${a.icon} text-gray-400 mr-3"></i>
                <div>
                  <p class="text-sm font-medium">\${a.description}</p>
                  <p class="text-xs text-gray-500">\${new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          \`).join('');

          document.getElementById('recent-activity').innerHTML = activityHtml || '<p class="text-gray-500 text-center py-4">No recent activity</p>';
        } catch (error) {
          console.error('Failed to load activity:', error);
        }
      }

      async function loadCompetitionsList() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/competitions', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const competitionsHtml = response.data.competitions.map(c => \`
            <div class="border rounded-lg p-4 hover:shadow-md transition">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-lg">\${c.title}</h3>
                  <p class="text-sm text-gray-600 mt-1">\${c.description}</p>
                  <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span><i class="fas fa-trophy mr-1"></i>\${c.prize_amount || 'No prize'}</span>
                    <span><i class="fas fa-users mr-1"></i>\${c.participant_count || 0} participants</span>
                    <span class="px-2 py-1 rounded-full text-xs font-semibold \${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">\${c.status}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button onclick="viewLeaderboard(\${c.id})" class="text-yellow-600 hover:text-yellow-800 p-2" title="View Leaderboard">
                    <i class="fas fa-trophy"></i>
                  </button>
                  <button onclick="viewParticipants(\${c.id})" class="text-purple-600 hover:text-purple-800 p-2" title="View Participants">
                    <i class="fas fa-users"></i>
                  </button>
                  <button onclick="editCompetition(\${c.id})" class="text-blue-600 hover:text-blue-800 p-2" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="announceWinners(\${c.id})" class="text-green-600 hover:text-green-800 p-2" title="Announce Winners">
                    <i class="fas fa-trophy"></i>
                  </button>
                  <button onclick="deleteCompetition(\${c.id})" class="text-red-600 hover:text-red-800 p-2" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          \`).join('');

          document.getElementById('competitions-list').innerHTML = competitionsHtml || '<p class="text-gray-500 text-center py-8">No competitions yet</p>';
        } catch (error) {
          console.error('Failed to load competitions:', error);
        }
      }

      async function loadUsersList() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/users', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const usersHtml = response.data.users.map(u => \`
            <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div class="flex items-center">
                <img src="\${u.avatar_url || '/default-avatar.png'}" alt="\${u.name}" class="w-10 h-10 rounded-full mr-3">
                <div>
                  <p class="font-medium">\${u.name}</p>
                  <p class="text-sm text-gray-500">\${u.email}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">\${u.role}</span>
                <span class="text-xs text-gray-500">\${u.project_count || 0} projects</span>
              </div>
            </div>
          \`).join('');

          document.getElementById('users-list').innerHTML = usersHtml || '<p class="text-gray-500 text-center py-8">No users found</p>';
        } catch (error) {
          console.error('Failed to load users:', error);
        }
      }

      function showAdminTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(t => {
          t.classList.remove('text-primary', 'border-primary');
          t.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById(tab + '-tab').classList.remove('text-gray-500', 'border-transparent');
        document.getElementById(tab + '-tab').classList.add('text-primary', 'border-primary');

        // Show/hide content
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(tab + '-content').classList.remove('hidden');

        // Load data for specific tabs
        if (tab === 'competitions') {
          loadCompetitionsList();
        } else if (tab === 'users') {
          loadUsersList();
        } else if (tab === 'statistics') {
          loadRecentActivity();
        } else if (tab === 'startups') {
          loadStartupsList();
        } else if (tab === 'activity') {
          loadActivityData();
        } else if (tab === 'pitch-deck') {
          loadPitchDeckResponses();
          loadConversationPitches();
        } else if (tab === 'astro') {
          loadAstroSessions();
        }
      }

      function showCreateCompetitionForm() {
        editingCompetitionId = null;
        document.getElementById('competition-modal-title').textContent = 'Create New Competition';
        document.getElementById('competition-submit-btn').textContent = 'Create Competition';
        document.getElementById('create-competition-form').reset();
        document.getElementById('create-competition-modal').style.display = 'flex';
      }

      function closeCreateCompetitionModal() {
        editingCompetitionId = null;
        document.getElementById('create-competition-modal').style.display = 'none';
        document.getElementById('create-competition-form').reset();
      }

      async function editCompetition(id) {
        try {
          editingCompetitionId = id;
          const token = getAuthToken();
          const response = await axios.get(\`/api/competitions/\${id}\`, {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const comp = response.data.competition;
          
          document.getElementById('competition-modal-title').textContent = 'Edit Competition';
          document.getElementById('competition-submit-btn').textContent = 'Update Competition';
          
          const form = document.getElementById('create-competition-form');
          form.elements['title'].value = comp.title || '';
          form.elements['description'].value = comp.description || '';
          form.elements['competition_type'].value = comp.competition_type || 'weekly';
          form.elements['prize_amount'].value = comp.prize_amount || '';
          form.elements['deadline'].value = comp.deadline || '';
          form.elements['guidelines'].value = comp.guidelines || '';
          
          toggleTicketFields(comp.competition_type);
          
          if (comp.competition_type === 'monthly') {
            form.elements['ticket_price'].value = comp.ticket_price || '';
            form.elements['event_date'].value = comp.event_date || '';
            form.elements['event_time'].value = comp.event_time || '';
            form.elements['location'].value = comp.location || '';
            form.elements['payment_link'].value = comp.payment_link || '';
          }

          document.getElementById('create-competition-modal').style.display = 'flex';
        } catch (error) {
          alert('Failed to load competition: ' + error.message);
        }
      }

      async function viewParticipants(competitionId) {
        try {
          const token = getAuthToken();
          const response = await axios.get(\`/api/admin/competitions/\${competitionId}/participants\`, {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const participants = response.data.participants || [];
          
          const participantsHtml = participants.map(p => \`
            <div class="border rounded-lg p-4 hover:shadow-md transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3 flex-1">
                  <img src="\${p.avatar_url || '/default-avatar.png'}" alt="\${p.name}" class="w-12 h-12 rounded-full">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <h4 class="font-semibold">\${p.name}</h4>
                      <span class="text-xs px-2 py-1 rounded-full \${p.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        \${p.payment_status}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600">\${p.email}</p>
                    <p class="text-sm font-medium text-purple-600 mt-1">\${p.startup_name || p.project_title || 'No project'}</p>
                    \${p.project_description ? \`<p class="text-xs text-gray-500 mt-1">\${p.project_description.substring(0, 100)}...</p>\` : ''}
                    \${p.pitch_deck_url ? \`<a href="\${p.pitch_deck_url}" target="_blank" class="text-xs text-blue-600 hover:underline mt-1 inline-block"><i class="fas fa-link mr-1"></i>Pitch Deck</a>\` : ''}
                  </div>
                </div>
                <div class="text-right text-xs text-gray-500">
                  \${new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              \${p.submission_notes ? \`
                <div class="mt-3 pt-3 border-t">
                  <p class="text-xs text-gray-600"><strong>Notes:</strong> \${p.submission_notes}</p>
                </div>
              \` : ''}
            </div>
          \`).join('');

          document.getElementById('participants-list').innerHTML = participantsHtml || '<p class="text-gray-500 text-center py-8">No participants yet</p>';
          document.getElementById('participants-modal').style.display = 'flex';
        } catch (error) {
          alert('Failed to load participants: ' + error.message);
        }
      }

      function closeParticipantsModal() {
        document.getElementById('participants-modal').style.display = 'none';
      }

      function viewLeaderboard(competitionId) {
        // Redirect to competition leaderboard page
        window.open(\`/competitions/\${competitionId}/leaderboard\`, '_blank');
      }

      function toggleTicketFields(type) {
        const ticketFields = document.getElementById('ticket-fields');
        if (type === 'monthly') {
          ticketFields.classList.remove('hidden');
        } else {
          ticketFields.classList.add('hidden');
        }
      }

      document.getElementById('create-competition-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
          title: formData.get('title'),
          description: formData.get('description'),
          competition_type: formData.get('competition_type'),
          prize_amount: formData.get('prize_amount'),
          deadline: formData.get('deadline'),
          guidelines: formData.get('guidelines'),
          ticket_price: formData.get('ticket_price') || 0,
          event_date: formData.get('event_date'),
          event_time: formData.get('event_time'),
          location: formData.get('location'),
          payment_link: formData.get('payment_link'),
          ticket_required: formData.get('competition_type') === 'monthly'
        };

        try {
          const token = getAuthToken();
          
          if (editingCompetitionId) {
            // Update existing competition
            await axios.put(\`/api/admin/competitions/\${editingCompetitionId}\`, data, {
              headers: { Authorization: \`Bearer \${token}\` }
            });
            alert('Competition updated successfully!');
          } else {
            // Create new competition
            await axios.post('/api/admin/competitions', data, {
              headers: { Authorization: \`Bearer \${token}\` }
            });
            alert('Competition created successfully!');
          }

          closeCreateCompetitionModal();
          loadCompetitionsList();
        } catch (error) {
          alert('Failed to save competition: ' + (error.response?.data?.error || error.message));
        }
      });

      async function generateReport(type) {
        try {
          const token = getAuthToken();
          const response = await axios.get(\`/api/admin/reports/\${type}\`, {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          currentReportData = response.data;
          
          document.getElementById('report-output').classList.remove('hidden');
          document.getElementById('report-content').innerHTML = \`
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    \${Object.keys(currentReportData.data[0] || {}).map(key => \`
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">\${key}</th>
                    \`).join('')}
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  \${currentReportData.data.map(row => \`
                    <tr>
                      \${Object.values(row).map(val => \`
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${val || '-'}</td>
                      \`).join('')}
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          \`;
        } catch (error) {
          alert('Failed to generate report: ' + error.message);
        }
      }

      function downloadReport() {
        if (!currentReportData) return;

        const csv = [
          Object.keys(currentReportData.data[0]).join(','),
          ...currentReportData.data.map(row => Object.values(row).join(','))
        ].join('\\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`report-\${Date.now()}.csv\`;
        a.click();
      }

      async function announceWinners(competitionId) {
        const winners = prompt('Enter winners (format: userId1:position:prize,userId2:position:prize)');
        if (!winners) return;

        try {
          const token = getAuthToken();
          const winnersData = winners.split(',').map(w => {
            const [user_id, position, prize_amount] = w.split(':');
            return { user_id: parseInt(user_id), position: parseInt(position), prize_amount };
          });

          await axios.post(\`/api/competitions/\${competitionId}/winners\`, 
            { winners: winnersData },
            { headers: { Authorization: \`Bearer \${token}\` }}
          );

          alert('Winners announced successfully!');
          loadCompetitionsList();
        } catch (error) {
          alert('Failed to announce winners: ' + error.message);
        }
      }

      async function deleteCompetition(id) {
        if (!confirm('Are you sure you want to delete this competition?')) return;

        try {
          const token = getAuthToken();
          await axios.delete(\`/api/admin/competitions/\${id}\`, {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          alert('Competition deleted successfully!');
          loadCompetitionsList();
        } catch (error) {
          alert('Failed to delete competition: ' + error.message);
        }
      }

      // Initialize
      // ========== ASTRO AI SESSIONS TAB ==========
      let astroSessionsData = [];

      async function loadAstroSessions() {
        const tbody = document.getElementById('astro-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</td></tr>';

        try {
          const token = getAuthToken();
          const res = await fetch('/api/admin/astro-sessions', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const data = await res.json();

          if (!data.sessions || !data.sessions.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-400">No hay sesiones todavía.</td></tr>';
            return;
          }

          astroSessionsData = data.sessions;

          // Update summary stats
          const total = data.sessions.length;
          const withRevenue = data.sessions.filter(s => s.mrr > 0).length;
          const withUsers = data.sessions.filter(s => s.active_users > 0).length;
          const withFundraising = data.sessions.filter(s => s.fundraising_stage).length;
          document.getElementById('astro-stat-total').textContent = total;
          document.getElementById('astro-stat-revenue').textContent = withRevenue;
          document.getElementById('astro-stat-users').textContent = withUsers;
          document.getElementById('astro-stat-fundraising').textContent = withFundraising;

          renderAstroTable(data.sessions);
        } catch (e) {
          tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-red-400">Error cargando datos: ' + e.message + '</td></tr>';
        }
      }

      function renderAstroTable(sessions) {
        const tbody = document.getElementById('astro-tbody');
        if (!tbody) return;

        const stageColors = {
          'pre-seed': 'bg-yellow-100 text-yellow-800',
          'seed': 'bg-blue-100 text-blue-800',
          'series-a': 'bg-green-100 text-green-800',
          'series-b': 'bg-purple-100 text-purple-800'
        };

        tbody.innerHTML = sessions.map((s, i) => {
          const completeness = s.data_completeness || 0;
          const barColor = completeness >= 75 ? '#22c55e' : completeness >= 40 ? '#f59e0b' : '#ef4444';
          const stage = s.fundraising_stage || '—';
          const stageClass = stageColors[s.fundraising_stage] || 'bg-gray-100 text-gray-600';
          const updatedAt = s.updated_at ? new Date(s.updated_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short' }) : '—';

          return '<tr class="hover:bg-purple-50 cursor-pointer transition" onclick="showAstroDetail(' + i + ')">' +
            '<td class="px-4 py-3">' +
              '<div class="font-semibold text-gray-900">' + (s.startup_name || '<span class="text-gray-400 italic">Sin nombre</span>') + '</div>' +
              '<div class="text-xs text-gray-500">' + (s.founder_name || s.founder_email || 'Founder') + '</div>' +
            '</td>' +
            '<td class="px-4 py-3"><span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">' + (s.sector || '—') + '</span></td>' +
            '<td class="px-4 py-3 text-right font-mono text-sm">' + (s.mrr > 0 ? '€' + s.mrr.toLocaleString() : '<span class="text-gray-400">—</span>') + '</td>' +
            '<td class="px-4 py-3 text-right font-mono text-sm">' + (s.active_users > 0 ? s.active_users.toLocaleString() : '<span class="text-gray-400">—</span>') + '</td>' +
            '<td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + stageClass + '">' + stage + '</span></td>' +
            '<td class="px-4 py-3 text-center text-xs text-gray-600">' + (s.fundraising_goal ? s.fundraising_goal : '—') + '</td>' +
            '<td class="px-4 py-3">' +
              '<div class="flex items-center gap-2">' +
                '<div style="flex:1;height:6px;background:#e5e7eb;border-radius:3px;"><div style="width:' + completeness + '%;height:100%;background:' + barColor + ';border-radius:3px;"></div></div>' +
                '<span class="text-xs text-gray-500 w-8 text-right">' + completeness + '%</span>' +
              '</div>' +
            '</td>' +
            '<td class="px-4 py-3 text-center text-xs text-gray-500">' + (s.conversation_turns || 0) + '</td>' +
            '<td class="px-4 py-3 text-xs text-gray-400">' + updatedAt + '</td>' +
          '</tr>';
        }).join('');
      }

      function filterAstroTable() {
        const search = (document.getElementById('astro-search')?.value || '').toLowerCase();
        const stage = (document.getElementById('astro-filter-stage')?.value || '');
        const sector = (document.getElementById('astro-filter-sector')?.value || '');

        const filtered = astroSessionsData.filter(s => {
          const matchSearch = !search ||
            (s.startup_name || '').toLowerCase().includes(search) ||
            (s.founder_name || '').toLowerCase().includes(search) ||
            (s.founder_email || '').toLowerCase().includes(search);
          const matchStage = !stage || s.fundraising_stage === stage;
          const matchSector = !sector || s.sector === sector;
          return matchSearch && matchStage && matchSector;
        });

        renderAstroTable(filtered);
      }

      function showAstroDetail(index) {
        const s = astroSessionsData[index];
        if (!s) return;

        document.getElementById('astro-detail-title').textContent = (s.startup_name || 'Startup sin nombre') + ' — Perfil completo';
        document.getElementById('astro-detail-panel').classList.remove('hidden');

        const fields = [
          { label: 'Founder', value: s.founder_name || s.founder_email || '—', icon: 'fa-user' },
          { label: 'Email', value: s.founder_email || '—', icon: 'fa-envelope' },
          { label: 'Problema que resuelven', value: s.problem || '—', icon: 'fa-question-circle' },
          { label: 'Solución', value: s.solution || '—', icon: 'fa-lightbulb' },
          { label: 'Sector', value: s.sector || '—', icon: 'fa-industry' },
          { label: 'Geografía', value: s.geography || '—', icon: 'fa-globe' },
          { label: 'MRR', value: s.mrr > 0 ? '€' + s.mrr.toLocaleString() + '/mes' : 'Sin revenue todavía', icon: 'fa-dollar-sign' },
          { label: 'ARR', value: s.arr > 0 ? '€' + s.arr.toLocaleString() + '/año' : '—', icon: 'fa-chart-line' },
          { label: 'Usuarios activos', value: s.active_users > 0 ? s.active_users.toLocaleString() : 'Sin datos', icon: 'fa-users' },
          { label: 'Crecimiento', value: s.growth_rate_percent > 0 ? s.growth_rate_percent + '%' : '—', icon: 'fa-arrow-up' },
          { label: 'Tamaño equipo', value: s.team_size ? s.team_size + ' personas' : '—', icon: 'fa-sitemap' },
          { label: 'Etapa', value: s.fundraising_stage || '—', icon: 'fa-flag' },
          { label: 'Objetivo fundraising', value: s.fundraising_goal || '—', icon: 'fa-bullseye' },
          { label: 'Conversaciones', value: s.conversation_turns || 0, icon: 'fa-comments' },
          { label: 'Completitud perfil', value: (s.data_completeness || 0) + '%', icon: 'fa-tasks' },
          { label: 'VCs recomendados', value: s.vc_recommendations ? '✅ Generados' : 'Pendiente', icon: 'fa-handshake' },
        ];

        document.getElementById('astro-detail-body').innerHTML = fields.map(f =>
          '<div class="bg-white rounded-lg border border-gray-200 p-4">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<i class="fas ' + f.icon + ' text-purple-500 text-xs"></i>' +
              '<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">' + f.label + '</span>' +
            '</div>' +
            '<p class="text-sm text-gray-800 font-medium">' + f.value + '</p>' +
          '</div>'
        ).join('');

        // ── Conversation section ──────────────────────────────────────
        const convSection = document.getElementById('astro-conv-section');
        const convMessages = document.getElementById('astro-conv-messages');
        const convCount = document.getElementById('astro-conv-count');
        const convBtn = document.getElementById('astro-conv-toggle-btn');

        convSection.classList.remove('hidden');
        convMessages.classList.add('hidden');
        convMessages.innerHTML = '';
        convCount.textContent = s.conversation_turns ? '(' + s.conversation_turns + ' msgs)' : '';
        convBtn.innerHTML = '<i class="fas fa-eye"></i> Ver conversación';

        // Remove old listener by replacing the node
        const freshBtn = convBtn.cloneNode(true);
        convBtn.parentNode.replaceChild(freshBtn, convBtn);

        freshBtn.addEventListener('click', async function() {
          if (!convMessages.classList.contains('hidden')) {
            convMessages.classList.add('hidden');
            freshBtn.innerHTML = '<i class="fas fa-eye"></i> Ver conversación';
            return;
          }
          freshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
          try {
            const token = getAuthToken();
            const res = await fetch('/api/admin/astro-messages/' + s.user_id, {
              headers: { Authorization: 'Bearer ' + token }
            });
            const data = await res.json();
            const messages = data.messages || [];

            if (messages.length === 0) {
              convMessages.innerHTML =
                '<p class="text-gray-400 text-sm text-center py-6">' +
                  '<i class="fas fa-comment-slash text-2xl mb-2 block opacity-40"></i>' +
                  'No hay mensajes guardados aún.<br>' +
                  '<span class="text-xs">Los mensajes nuevos se guardarán automáticamente.</span>' +
                '</p>';
            } else {
              let currentDate = '';
              convMessages.innerHTML = messages.map(function(m) {
                let dateHtml = '';
                const msgDate = (m.session_date || (m.created_at || '').split('T')[0]);
                if (msgDate && msgDate !== currentDate) {
                  currentDate = msgDate;
                  dateHtml =
                    '<div class="text-center my-3">' +
                      '<span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">' + msgDate + '</span>' +
                    '</div>';
                }
                const isUser = m.role === 'user';
                const safeContent = m.content
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                return dateHtml +
                  '<div class="flex ' + (isUser ? 'justify-end' : 'justify-start') + '">' +
                    '<div class="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ' +
                      (isUser
                        ? 'bg-purple-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm') + '">' +
                      (!isUser
                        ? '<span class="text-xs font-bold text-purple-600 block mb-1">⚡ Astro</span>'
                        : '') +
                      '<p class="whitespace-pre-wrap break-words leading-relaxed">' + safeContent + '</p>' +
                      '<p class="text-xs opacity-50 mt-1 text-right">' +
                        (m.created_at ? new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '') +
                      '</p>' +
                    '</div>' +
                  '</div>';
              }).join('');
              // Scroll to bottom
              convMessages.scrollTop = convMessages.scrollHeight;
              convCount.textContent = '(' + messages.length + ' msgs)';
            }
            convMessages.classList.remove('hidden');
            freshBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar';
          } catch (e) {
            convMessages.innerHTML =
              '<p class="text-red-400 text-sm text-center py-4">Error cargando la conversación</p>';
            convMessages.classList.remove('hidden');
            freshBtn.innerHTML = '<i class="fas fa-eye"></i> Ver conversación';
          }
        });

        document.getElementById('astro-detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      document.addEventListener('DOMContentLoaded', () => {
        loadAdminStats();
        loadRecentActivity();
      });

      // ========== STARTUPS TAB FUNCTIONS ==========

      async function loadStartupsList() {
        try {
          const token = getAuthToken();
          console.log('Loading startups with token:', token ? 'present' : 'missing');
          
          const response = await axios.get('/api/projects/leaderboard/top', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          console.log('API Response:', response.data);
          
          // El API devuelve { leaderboard: [...], isAdmin: true } o { projects: [...] }
          const startups = response.data.leaderboard || response.data.projects || [];
          console.log('Startups found:', startups.length);
          
          const searchInput = document.getElementById('startup-search');
          const filterSelect = document.getElementById('startup-filter');

          function renderStartups(filteredStartups = startups) {
            console.log('Rendering startups:', filteredStartups.length);
            
            if (filteredStartups.length === 0) {
              document.getElementById('startups-list').innerHTML = '<p class="text-gray-500 text-center py-8">No startups found. Total projects in DB: ' + startups.length + '</p>';
              return;
            }

            const startupsHtml = filteredStartups.map(startup => \`
              <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                <div class="flex items-start justify-between">
                  <div class="flex items-center space-x-4 flex-1 cursor-pointer" onclick="viewStartupDetails(\${startup.user_id || startup.creator_id || startup.company_user_id})">
                    <img src="\${startup.creator_avatar_url || startup.avatar_url || '/default-avatar.png'}" alt="\${startup.creator_name || 'User'}" class="w-16 h-16 rounded-full border-2 border-purple-200">
                    <div class="flex-1">
                      <h3 class="text-lg font-bold text-gray-900">\${startup.title}</h3>
                      <p class="text-sm text-gray-600 mb-2"><i class="fas fa-user mr-1"></i>\${startup.creator_name} (\${startup.creator_email || 'No email'})</p>
                      <p class="text-sm text-gray-700 line-clamp-2">\${startup.description || 'No description available'}</p>
                      
                      <div class="flex items-center space-x-4 mt-3">
                        <span class="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                          <i class="fas fa-fire mr-1"></i>\${startup.votes_count || startup.votes || 0} votes
                        </span>
                        <span class="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                          <i class="fas fa-bullseye mr-1"></i>\${startup.total_goals || startup.goals_count || 0} goals
                        </span>
                        <span class="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                          <i class="fas fa-check-circle mr-1"></i>\${startup.completed_goals || 0} completed
                        </span>
                        \${startup.current_users ? \`
                          <span class="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                            <i class="fas fa-users mr-1"></i>\${startup.current_users} users
                          </span>
                        \` : ''}
                        \${startup.current_revenue ? \`
                          <span class="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            <i class="fas fa-dollar-sign mr-1"></i>$\${startup.current_revenue}
                          </span>
                        \` : ''}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 ml-4">
                    <button onclick="viewStartupDetails(\${startup.user_id || startup.creator_id || startup.company_user_id})" class="text-blue-600 hover:text-blue-800 px-3 py-2 rounded hover:bg-blue-50">
                      <i class="fas fa-arrow-right text-xl"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteStartup(\${startup.id}, '\${startup.title}')" class="text-red-600 hover:text-red-800 px-3 py-2 rounded hover:bg-red-50">
                      <i class="fas fa-trash text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            \`).join('');

            document.getElementById('startups-list').innerHTML = startupsHtml;
          }

          // Search and filter handlers (only add once)
          searchInput.onchange = null;
          searchInput.oninput = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filtered = startups.filter(s => 
              s.title.toLowerCase().includes(searchTerm) ||
              s.creator_name.toLowerCase().includes(searchTerm) ||
              (s.description && s.description.toLowerCase().includes(searchTerm))
            );
            renderStartups(filtered);
          };

          filterSelect.onchange = null;
          filterSelect.onchange = () => {
            const filterValue = filterSelect.value;
            let filtered = startups;
            
            if (filterValue === 'active') {
              filtered = startups.filter(s => (s.total_goals || s.goals_count || 0) > 0);
            } else if (filterValue === 'inactive') {
              filtered = startups.filter(s => (s.total_goals || s.goals_count || 0) === 0);
            }
            
            renderStartups(filtered);
          };

          renderStartups();
        } catch (error) {
          console.error('Failed to load startups:', error);
          document.getElementById('startups-list').innerHTML = '<p class="text-red-500 text-center py-8">Failed to load startups: ' + error.message + '</p>';
        }
      }

      async function deleteStartup(startupId, startupTitle) {
        if (!confirm('⚠️ Are you sure you want to delete "' + startupTitle + '"?\\n\\nThis action cannot be undone.')) {
          return;
        }

        try {
          const token = getAuthToken();
          const response = await axios.delete('/api/projects/' + startupId, {
            headers: { Authorization: 'Bearer ' + token }
          });

          if (response.data.success) {
            alert('✅ Startup deleted successfully!');
            // Reload startups list
            loadStartupsList();
          } else {
            alert('❌ Failed to delete startup: ' + (response.data.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('❌ Error deleting startup: ' + (error.response?.data?.error || error.message));
        }
      }

      // ============================================
      // PITCH DECK RESPONSES FUNCTIONS
      // ============================================
      
      async function loadPitchDeckResponses() {
        try {
          const token = getAuthToken();
          const weekFilter = document.getElementById('pitch-week-filter')?.value || 'current';
          
          // Load metrics
          const response = await axios.get('/api/astar-messages/admin/all-metrics', {
            headers: { Authorization: 'Bearer ' + token },
            params: { filter: weekFilter }
          });

          // Load email stats
          const emailStatsResponse = await axios.get('/api/astar-messages/admin/email-stats', {
            headers: { Authorization: 'Bearer ' + token }
          });

          const metrics = response.data.metrics || [];
          const emailStats = emailStatsResponse.data;
          
          // Update metrics stats
          document.getElementById('pitch-total-users').textContent = metrics.length;
          document.getElementById('pitch-total-responses').textContent = metrics.reduce((sum, m) => sum + (m.response_count || 0), 0);
          
          const avgScore = metrics.length > 0 
            ? Math.round(metrics.reduce((sum, m) => sum + (m.iteration_score || 0), 0) / metrics.length)
            : 0;
          document.getElementById('pitch-avg-score').textContent = avgScore;
          
          const topPerformer = metrics.length > 0 && metrics[0] 
            ? (metrics[0].startup_name || metrics[0].name || 'N/A')
            : '--';
          document.getElementById('pitch-top-performer').textContent = topPerformer.substring(0, 10);

          // Update email stats
          if (emailStats.today) {
            document.getElementById('emails-today').textContent = emailStats.today.total_sent || 0;
            document.getElementById('recipients-today').textContent = emailStats.today.unique_recipients || 0;
            
            // Show template details
            if (emailStats.today.templates && emailStats.today.templates.length > 0) {
              const templateHtml = '<div class="text-xs mt-2"><strong>Templates sent today:</strong> ' +
                emailStats.today.templates.map(t => t.subject + ' (' + t.sent_count + ' emails)').join(', ') +
                '</div>';
              document.getElementById('email-templates-today').innerHTML = templateHtml;
            } else {
              document.getElementById('email-templates-today').innerHTML = '<div class="text-xs text-gray-500 mt-2">No emails sent today yet</div>';
            }
          }
          if (emailStats.this_week) {
            document.getElementById('emails-week').textContent = emailStats.this_week.total_sent || 0;
          }
          document.getElementById('potential-recipients').textContent = emailStats.potential_recipients || 0;

          // Render list
          if (metrics.length === 0) {
            document.getElementById('pitch-responses-list').innerHTML = '<p class="text-gray-500 text-center py-8">No check-ins found for this period</p>';
            return;
          }

          const html = metrics.map(m => '<div class="bg-white border rounded-lg p-4 hover:shadow-md transition">' +
            '<div class="flex items-start justify-between mb-3">' +
              '<div class="flex-1">' +
                '<h3 class="font-bold text-lg">' + (m.startup_name || 'No startup name') + '</h3>' +
                '<p class="text-sm text-gray-600">' + m.name + ' (' + m.email + ')</p>' +
              '</div>' +
              '<div class="text-right">' +
                '<div class="text-2xl font-bold text-purple-600">' + (m.iteration_score || 0) + '</div>' +
                '<p class="text-xs text-gray-500">Score</p>' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">' +
              '<div class="bg-blue-50 rounded p-2">' +
                '<div class="text-sm text-gray-600">Users Contacted</div>' +
                '<div class="text-xl font-bold text-blue-600">' + (m.users_contacted || 0) + '</div>' +
              '</div>' +
              '<div class="bg-green-50 rounded p-2">' +
                '<div class="text-sm text-gray-600">Hypotheses</div>' +
                '<div class="text-xl font-bold text-green-600">' + (m.hypotheses_tested || 0) + '</div>' +
              '</div>' +
              '<div class="bg-purple-50 rounded p-2">' +
                '<div class="text-sm text-gray-600">Learnings</div>' +
                '<div class="text-xl font-bold text-purple-600">' + (m.learnings_count || 0) + '</div>' +
              '</div>' +
              '<div class="bg-orange-50 rounded p-2">' +
                '<div class="text-sm text-gray-600">Response Rate</div>' +
                '<div class="text-xl font-bold text-orange-600">' + Math.round((m.response_rate || 0) * 100) + '%</div>' +
              '</div>' +
            '</div>' +
            '<div class="border-t pt-3">' +
              "<button onclick='viewPitchDeckDetails(" + m.user_id + ", " + JSON.stringify(m.name || 'User') + ")' class='text-purple-600 hover:text-purple-700 text-sm font-medium'>" +
                "<i class='fas fa-eye mr-1'></i>View Full Responses" +
              "</button>" +
            '</div>' +
          '</div>').join('');

          document.getElementById('pitch-responses-list').innerHTML = html;
        } catch (error) {
          console.error('Failed to load pitch deck responses:', error);
          document.getElementById('pitch-responses-list').innerHTML = '<p class="text-red-500 text-center py-8">Error loading data</p>';
        }
      }

      async function viewPitchDeckDetails(userId, userName) {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/astar-messages/admin/user-responses/' + userId, {
            headers: { Authorization: 'Bearer ' + token }
          });

          const responses = response.data.responses || [];
          
          let html = '<div class="space-y-4">';
          html += '<h3 class="text-xl font-bold mb-4">Check-in Responses for ' + userName + '</h3>';
          
          if (responses.length === 0) {
            html += '<p class="text-gray-500 text-center py-8">No responses found</p>';
          } else {
            responses.forEach(r => {
              html += '<div class="border-l-4 border-purple-500 bg-gray-50 p-4 rounded">' +
                '<div class="flex items-center justify-between mb-2">' +
                  '<span class="font-semibold text-purple-700">' + (r.question || 'Question') + '</span>' +
                  '<span class="text-xs text-gray-500">' + new Date(r.created_at).toLocaleDateString() + '</span>' +
                '</div>' +
                '<p class="text-gray-700 whitespace-pre-wrap">' + (r.response_text || 'No response') + '</p>' +
              '</div>';
            });
          }
          
          html += '</div>';

          // Show in a simple alert or modal
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
          modal.innerHTML = '<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">' +
            '<div class="flex items-center justify-between mb-4">' +
              '<h2 class="text-2xl font-bold"><i class="fas fa-chart-line mr-2 text-purple-600"></i>Pitch Deck Details</h2>' +
              '<button onclick="this.closest(\\'.fixed\\').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">' +
                '<i class="fas fa-times"></i>' +
              '</button>' +
            '</div>' +
            html +
          '</div>';
          
          document.body.appendChild(modal);
        } catch (error) {
          console.error('Failed to load user details:', error);
          alert('Error loading user responses');
        }
      }

      async function debugEmailRecipients() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/astar-messages/admin/debug-recipients', {
            headers: { Authorization: 'Bearer ' + token }
          });

          const debug = response.data;
          
          let html = '<div class="space-y-4">';
          html += '<h3 class="text-xl font-bold mb-4">📧 Email Recipients Debug Report</h3>';
          
          // Current context
          html += '<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">' +
            '<h4 class="font-bold mb-2">Current Context</h4>' +
            '<p class="text-sm">Day of Week: ' + debug.current_context.day_of_week + '</p>' +
            '<p class="text-sm">Time of Day: ' + debug.current_context.time_of_day + '</p>' +
            '<p class="text-sm">Week Number: ' + debug.current_context.week_number + '</p>' +
            '<p class="text-sm">Template: ' + (debug.current_context.template ? debug.current_context.template.subject : 'None') + '</p>' +
          '</div>';

          // Statistics
          html += '<div class="bg-white border rounded p-4 mb-4">' +
            '<h4 class="font-bold mb-3">Statistics</h4>' +
            '<div class="grid grid-cols-2 gap-3">' +
              '<div><span class="text-gray-600">Total Founders:</span> <strong>' + debug.stats.total_founders + '</strong></div>' +
              '<div><span class="text-gray-600">Unsubscribed Founders:</span> <strong class="text-red-600">' + debug.stats.unsubscribed_founders + '</strong></div>' +
              '<div><span class="text-gray-600">IE Students in DB:</span> <strong>' + debug.stats.ie_students_in_db + '</strong></div>' +
              '<div><span class="text-gray-600">Unsubscribed IE:</span> <strong class="text-red-600">' + debug.stats.unsubscribed_ie + '</strong></div>' +
              '<div><span class="text-gray-600">Eligible Recipients:</span> <strong class="text-green-600">' + debug.stats.eligible_recipients + '</strong></div>' +
              '<div><span class="text-gray-600">Already Received:</span> <strong>' + debug.stats.already_received_this_template + '</strong></div>' +
              '<div><span class="text-gray-600">Expected to Send:</span> <strong class="text-blue-600">' + debug.stats.expected_to_send + '</strong></div>' +
              '<div><span class="text-gray-600">IE List Size:</span> <strong>' + debug.ie_student_list_size + '</strong></div>' +
            '</div>' +
          '</div>';

          // Gap analysis
          const gap = debug.ie_student_list_size - debug.stats.ie_students_in_db;
          if (gap > 0) {
            html += '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">' +
              '<h4 class="font-bold mb-2">⚠️ Gap Found!</h4>' +
              '<p class="text-sm">IE Student List Size: ' + debug.ie_student_list_size + '</p>' +
              '<p class="text-sm">IE Students in DB: ' + debug.stats.ie_students_in_db + '</p>' +
              '<p class="text-sm text-red-600 font-bold">Missing: ' + gap + ' students not created in database</p>' +
              '<p class="text-xs mt-2 text-gray-600">This means the auto-create logic in the cron job may not be working properly.</p>' +
            '</div>';
          }

          // Sample users
          html += '<div class="bg-white border rounded p-4">' +
            '<h4 class="font-bold mb-3">Sample Users (first 20)</h4>' +
            '<div class="overflow-x-auto">' +
              '<table class="w-full text-sm">' +
                '<thead><tr class="border-b"><th class="text-left p-2">ID</th><th class="text-left p-2">Email</th><th class="text-left p-2">Role</th><th class="text-left p-2">Status</th></tr></thead>' +
                '<tbody>';
          
          debug.sample_users.forEach(u => {
            const status = u.already_sent ? '<span class="text-green-600">✓ Sent</span>' : '<span class="text-red-600">✗ Not Sent</span>';
            html += '<tr class="border-b">' +
              '<td class="p-2">' + u.id + '</td>' +
              '<td class="p-2 text-xs">' + u.email + '</td>' +
              '<td class="p-2">' + u.role + '</td>' +
              '<td class="p-2">' + status + '</td>' +
            '</tr>';
          });
          
          html += '</tbody></table></div></div>';

          // Unsubscribed users
          if (debug.unsubscribed_users && debug.unsubscribed_users.length > 0) {
            html += '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">' +
              '<h4 class="font-bold mb-3">🚫 Unsubscribed Users (' + debug.unsubscribed_users.length + ')</h4>' +
              '<div class="overflow-x-auto max-h-64 overflow-y-auto">' +
                '<table class="w-full text-sm">' +
                  '<thead><tr class="border-b"><th class="text-left p-2">ID</th><th class="text-left p-2">Email</th><th class="text-left p-2">Name</th><th class="text-left p-2">Role</th></tr></thead>' +
                  '<tbody>';
            
            debug.unsubscribed_users.forEach(u => {
              html += '<tr class="border-b">' +
                '<td class="p-2">' + u.id + '</td>' +
                '<td class="p-2 text-xs">' + u.email + '</td>' +
                '<td class="p-2">' + (u.name || '-') + '</td>' +
                '<td class="p-2">' + u.role + '</td>' +
              '</tr>';
            });
            
            html += '</tbody></table></div></div>';
          }

          // Users who didn't receive
          if (debug.users_not_received && debug.users_not_received.length > 0) {
            html += '<div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mb-4">' +
              '<h4 class="font-bold mb-3">❌ Users Who Did NOT Receive (First 50)</h4>' +
              '<p class="text-xs text-gray-600 mb-3">These users are eligible but did not receive this week\\'s email.</p>' +
              '<div class="overflow-x-auto max-h-64 overflow-y-auto">' +
                '<table class="w-full text-sm">' +
                  '<thead><tr class="border-b"><th class="text-left p-2">ID</th><th class="text-left p-2">Email</th><th class="text-left p-2">Name</th><th class="text-left p-2">Role</th></tr></thead>' +
                  '<tbody>';
            
            debug.users_not_received.forEach(u => {
              html += '<tr class="border-b">' +
                '<td class="p-2">' + u.id + '</td>' +
                '<td class="p-2 text-xs">' + u.email + '</td>' +
                '<td class="p-2">' + (u.name || '-') + '</td>' +
                '<td class="p-2">' + u.role + '</td>' +
              '</tr>';
            });
            
            html += '</tbody></table></div></div>';
          }

          html += '</div>';

          // Show in modal
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
          modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
          
          const modalContent = document.createElement('div');
          modalContent.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6';
          modalContent.innerHTML = '<div class="flex items-center justify-between mb-4">' +
              '<h2 class="text-2xl font-bold"><i class="fas fa-bug mr-2 text-yellow-600"></i>Debug Report</h2>' +
              '<button class="text-gray-500 hover:text-gray-700 text-2xl" id="closeDebugModal">' +
                '<i class="fas fa-times"></i>' +
              '</button>' +
            '</div>' +
            html;
          
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          
          document.getElementById('closeDebugModal').onclick = () => modal.remove();
        } catch (error) {
          console.error('Failed to load debug info:', error);
          alert('Error loading debug information');
        }
      }


      async function viewStartupDetails(userId) {
        try {
          const token = getAuthToken();
          
          // Load user goals using the specific endpoint
          let userGoals = [];
          try {
            console.log('Fetching goals for user:', userId);
            const goalsResponse = await axios.get(\`/api/dashboard/goals/user/\${userId}\`, {
              headers: { Authorization: \`Bearer \${token}\` }
            });
            
            console.log('Goals API response for user', userId, ':', goalsResponse.data);
            userGoals = goalsResponse.data.goals || [];
            console.log('User goals found:', userGoals.length);
            if (userGoals.length > 0) {
              console.log('First goal sample:', userGoals[0]);
            }
          } catch (goalsError) {
            console.error('Error loading goals:', goalsError);
            console.error('Error details:', goalsError.response?.data);
          }
          
          console.log('About to calculate completedGoals with userGoals.length =', userGoals.length);
          
          // Load user projects
          const projectsResponse = await axios.get('/api/projects/leaderboard/top', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          console.log('Projects response:', projectsResponse.data);
          const allProjects = projectsResponse.data.leaderboard || projectsResponse.data.projects || [];
          const userProjects = allProjects.filter(p => (p.user_id == userId || p.creator_id == userId || p.company_user_id == userId));
          
          console.log('User projects found:', userProjects.length, userProjects);
          
          const userInfo = userProjects[0] || { creator_name: 'Unknown User', user_id: userId };

          // Use metrics from the project data directly (already includes current_users, current_revenue, etc.)
          const userMetrics = {
            total_users: userInfo.current_users || 0,
            users: userInfo.current_users || 0,
            total_revenue: userInfo.current_revenue || 0,
            revenue: userInfo.current_revenue || 0,
            completed_goals: userInfo.completed_goals || userGoals.filter(g => g.status === 'completed' || g.goal_status === 'completed').length,
            total_goals: userInfo.total_goals || userGoals.length,
            mrr: userInfo.mrr || 0,
            active_users: userInfo.active_users || 0,
            users_growth: userInfo.users_growth || 'N/A',
            revenue_growth: userInfo.revenue_growth || 'N/A',
            churn_rate: userInfo.churn_rate || 'N/A',
            last_updated: userInfo.updated_at || userInfo.created_at
          };
          
          console.log('User metrics:', userMetrics);

          document.getElementById('startup-modal-title').innerHTML = \`
            <i class="fas fa-rocket mr-2"></i>\${userInfo.creator_name || 'User'}'s Complete Profile
          \`;

          const completedGoals = userGoals.filter(g => g.status === 'completed' || g.goal_status === 'completed').length;
          const activeGoals = userGoals.filter(g => g.status === 'in_progress' || g.goal_status === 'in_progress').length;
          const pendingGoals = userGoals.filter(g => g.status === 'pending' || g.goal_status === 'pending' || (!g.status && !g.goal_status)).length;

          // Group goals by category/type
          const goalsByCategory = {
            'Product': userGoals.filter(g => g.category === 'product' || (g.description && g.description.toLowerCase().includes('product'))),
            'Marketing': userGoals.filter(g => g.category === 'marketing' || (g.description && g.description.toLowerCase().includes('marketing'))),
            'Sales': userGoals.filter(g => g.category === 'sales' || (g.description && (g.description.toLowerCase().includes('sales') || g.description.toLowerCase().includes('revenue')))),
            'Growth': userGoals.filter(g => g.category === 'growth' || (g.description && (g.description.toLowerCase().includes('user') || g.description.toLowerCase().includes('growth')))),
            'Other': userGoals.filter(g => !['product', 'marketing', 'sales', 'growth'].includes(g.category))
          };

          const detailHtml = \`
            <div class="space-y-6">
              <!-- User Info Header -->
              <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <img src="\${userInfo.creator_avatar_url || '/default-avatar.png'}" alt="\${userInfo.creator_name}" class="w-20 h-20 rounded-full border-4 border-white shadow">
                    <div>
                      <h3 class="text-2xl font-bold text-gray-900">\${userInfo.creator_name || 'Unknown'}</h3>
                      <p class="text-gray-600">\${userInfo.creator_email || 'No email'}</p>
                      <div class="flex items-center space-x-3 mt-2">
                        <span class="text-xs px-3 py-1 rounded-full bg-purple-600 text-white">
                          <i class="fas fa-id-badge mr-1"></i>ID: \${userId}
                        </span>
                        <span class="text-xs px-3 py-1 rounded-full bg-blue-600 text-white">
                          <i class="fas fa-user mr-1"></i>\${userInfo.creator_role || 'Founder'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Key Metrics Dashboard -->
              <div>
                <h4 class="text-lg font-bold mb-3 flex items-center">
                  <i class="fas fa-chart-line mr-2 text-green-600"></i>Key Metrics Overview
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div class="text-3xl font-bold text-blue-700">\${userProjects.length}</div>
                    <div class="text-sm text-blue-600 font-medium">Projects</div>
                  </div>
                  <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div class="text-3xl font-bold text-green-700">\${completedGoals}</div>
                    <div class="text-sm text-green-600 font-medium">Completed Goals</div>
                  </div>
                  <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                    <div class="text-3xl font-bold text-yellow-700">\${activeGoals}</div>
                    <div class="text-sm text-yellow-600 font-medium">Active Goals</div>
                  </div>
                  <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div class="text-3xl font-bold text-purple-700">\${userProjects.reduce((sum, p) => sum + (p.votes || 0), 0)}</div>
                    <div class="text-sm text-purple-600 font-medium">Total Votes</div>
                  </div>
                  <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                    <div class="text-3xl font-bold text-emerald-700">\${userMetrics.total_users || userMetrics.users || 0}</div>
                    <div class="text-sm text-emerald-600 font-medium">Users</div>
                    \${userMetrics.users_growth ? \`<div class="text-xs text-emerald-500 mt-1"><i class="fas fa-arrow-up mr-1"></i>\${userMetrics.users_growth}</div>\` : ''}
                  </div>
                  <div class="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                    <div class="text-3xl font-bold text-pink-700">$\${userMetrics.total_revenue || userMetrics.revenue || 0}</div>
                    <div class="text-sm text-pink-600 font-medium">Revenue</div>
                    \${userMetrics.revenue_growth ? \`<div class="text-xs text-pink-500 mt-1"><i class="fas fa-arrow-up mr-1"></i>\${userMetrics.revenue_growth}</div>\` : ''}
                  </div>
                  <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                    <div class="text-3xl font-bold text-indigo-700">\${pendingGoals}</div>
                    <div class="text-sm text-indigo-600 font-medium">Pending Goals</div>
                  </div>
                  <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div class="text-3xl font-bold text-orange-700">\${Math.round((completedGoals / (userGoals.length || 1)) * 100)}%</div>
                    <div class="text-sm text-orange-600 font-medium">Completion Rate</div>
                  </div>
                </div>
              </div>

              <!-- Revenue & Users History -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h5 class="font-bold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-dollar-sign mr-2 text-green-600"></i>Revenue Metrics
                  </h5>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center py-2 border-b border-green-200">
                      <span class="text-sm text-gray-600">Current MRR:</span>
                      <span class="font-bold text-green-700">$\${userMetrics.mrr || 0}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-green-200">
                      <span class="text-sm text-gray-600">Total Revenue:</span>
                      <span class="font-bold text-green-700">$\${userMetrics.total_revenue || userMetrics.revenue || 0}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-green-200">
                      <span class="text-sm text-gray-600">Growth Rate:</span>
                      <span class="font-bold text-green-700">\${userMetrics.revenue_growth || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm text-gray-600">Last Updated:</span>
                      <span class="text-xs text-gray-500">\${userMetrics.last_updated ? new Date(userMetrics.last_updated).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div class="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <h5 class="font-bold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-users mr-2 text-blue-600"></i>User Metrics
                  </h5>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center py-2 border-b border-blue-200">
                      <span class="text-sm text-gray-600">Total Users:</span>
                      <span class="font-bold text-blue-700">\${userMetrics.total_users || userMetrics.users || 0}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-blue-200">
                      <span class="text-sm text-gray-600">Active Users:</span>
                      <span class="font-bold text-blue-700">\${userMetrics.active_users || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-blue-200">
                      <span class="text-sm text-gray-600">Growth Rate:</span>
                      <span class="font-bold text-blue-700">\${userMetrics.users_growth || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm text-gray-600">Churn Rate:</span>
                      <span class="text-xs text-gray-500">\${userMetrics.churn_rate || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Projects Section -->
              <div>
                <h4 class="text-lg font-bold mb-3 flex items-center">
                  <i class="fas fa-rocket mr-2 text-purple-600"></i>Projects (\${userProjects.length})
                </h4>
                <div class="space-y-3">
                  \${userProjects.length > 0 ? userProjects.map(project => \`
                    <div class="border rounded-lg p-4 bg-white hover:shadow-md transition">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2 mb-2">
                            <h5 class="font-semibold text-gray-900 text-lg">\${project.title}</h5>
                            <span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                              <i class="fas fa-fire mr-1"></i>\${project.votes || 0} votes
                            </span>
                          </div>
                          <p class="text-sm text-gray-600 mt-1">\${project.description || 'No description'}</p>
                          <div class="flex items-center space-x-3 mt-3">
                            \${project.image_url ? \`<a href="\${project.image_url}" target="_blank" class="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"><i class="fas fa-image mr-1"></i>Image</a>\` : ''}
                            \${project.link ? \`<a href="\${project.link}" target="_blank" class="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200"><i class="fas fa-link mr-1"></i>Website</a>\` : ''}
                            <span class="text-xs text-gray-500"><i class="fas fa-calendar mr-1"></i>\${project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  \`).join('') : '<p class="text-gray-500 text-center py-4">No projects yet</p>'}
                </div>
              </div>

              <!-- Goals by Category -->
              <div>
                <h4 class="text-lg font-bold mb-3 flex items-center">
                  <i class="fas fa-bullseye mr-2 text-blue-600"></i>All Goals (\${userGoals.length}) - Organized by Category
                </h4>
                
                <!-- Goals Summary -->
                <div class="grid grid-cols-3 gap-3 mb-4">
                  <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-green-700">\${completedGoals}</div>
                    <div class="text-xs text-green-600">Completed</div>
                  </div>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-blue-700">\${activeGoals}</div>
                    <div class="text-xs text-blue-600">In Progress</div>
                  </div>
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-gray-700">\${pendingGoals}</div>
                    <div class="text-xs text-gray-600">Pending</div>
                  </div>
                </div>

                <!-- Goals by Category -->
                <div class="space-y-4">
                  \${Object.entries(goalsByCategory).map(([category, goals]) => {
                    if (goals.length === 0) return '';
                    return \`
                      <div class="border rounded-lg p-4 bg-gray-50">
                        <h5 class="font-bold text-gray-900 mb-3 flex items-center">
                          <i class="fas fa-\${
                            category === 'Product' ? 'box' :
                            category === 'Marketing' ? 'bullhorn' :
                            category === 'Sales' ? 'dollar-sign' :
                            category === 'Growth' ? 'chart-line' : 'star'
                          } mr-2"></i>\${category} Goals (\${goals.length})
                        </h5>
                        <div class="space-y-2">
                          \${goals.map(goal => \`
                            <div class="border rounded-lg p-3 bg-white hover:bg-gray-50 transition">
                              <div class="flex items-start justify-between">
                                <div class="flex-1">
                                  <div class="flex items-center space-x-2">
                                    <h6 class="font-medium text-gray-900">\${goal.task || goal.description || 'Goal'}</h6>
                                    <span class="text-xs px-2 py-1 rounded-full \${
                                      (goal.status === 'completed' || goal.goal_status === 'completed') ? 'bg-green-100 text-green-700' :
                                      (goal.status === 'in_progress' || goal.goal_status === 'in_progress') ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }">
                                      <i class="fas fa-\${(goal.status === 'completed' || goal.goal_status === 'completed') ? 'check-circle' : (goal.status === 'in_progress' || goal.goal_status === 'in_progress') ? 'spinner' : 'clock'} mr-1"></i>\${goal.goal_status || goal.status || 'pending'}
                                    </span>
                                    \${goal.priority ? \`<span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">\${goal.priority_label || 'P' + goal.priority}</span>\` : ''}
                                  </div>
                                  \${goal.description && goal.task !== goal.description ? \`<p class="text-xs text-gray-600 mt-1">\${goal.description}</p>\` : ''}
                                  <div class="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                    \${goal.deadline ? \`<span><i class="fas fa-calendar mr-1"></i>\${new Date(goal.deadline).toLocaleDateString()}</span>\` : ''}
                                    \${goal.created_at ? \`<span><i class="fas fa-clock mr-1"></i>Created: \${new Date(goal.created_at).toLocaleDateString()}</span>\` : ''}
                                    \${goal.cadence ? \`<span><i class="fas fa-repeat mr-1"></i>\${goal.cadence}</span>\` : ''}
                                    \${goal.dri ? \`<span><i class="fas fa-user mr-1"></i>DRI: \${goal.dri}</span>\` : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          \`).join('')}
                        </div>
                      </div>
                    \`;
                  }).join('')}
                </div>

                <!-- All Goals if no categorization -->
                \${userGoals.length > 0 && Object.values(goalsByCategory).every(g => g.length === 0) ? \`
                  <div class="space-y-2">
                    \${userGoals.map(goal => \`
                      <div class="border rounded-lg p-3 bg-white hover:bg-gray-50 transition">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center space-x-2">
                              <h5 class="font-medium text-gray-900">\${goal.task || goal.description || 'Goal'}</h5>
                              <span class="text-xs px-2 py-1 rounded-full \${
                                (goal.status === 'completed' || goal.goal_status === 'completed') ? 'bg-green-100 text-green-700' :
                                (goal.status === 'in_progress' || goal.goal_status === 'in_progress') ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }">
                                \${goal.goal_status || goal.status || 'pending'}
                              </span>
                            </div>
                            \${goal.description && goal.task !== goal.description ? \`<p class="text-xs text-gray-600 mt-1">\${goal.description}</p>\` : ''}
                            <div class="flex items-center space-x-2 mt-2">
                              \${goal.deadline ? \`<span class="text-xs text-gray-500"><i class="fas fa-calendar mr-1"></i>\${new Date(goal.deadline).toLocaleDateString()}</span>\` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    \`).join('')}
                  </div>
                \` : ''}

                \${userGoals.length === 0 ? '<p class="text-gray-500 text-center py-4">No goals yet</p>' : ''}
              </div>
            </div>
          \`;

          document.getElementById('startup-detail-content').innerHTML = detailHtml;
          document.getElementById('startup-detail-modal').style.display = 'flex';
        } catch (error) {
          console.error('Failed to load startup details:', error);
          alert('Failed to load startup details: ' + error.message);
        }
      }

      function closeStartupDetailModal() {
        document.getElementById('startup-detail-modal').style.display = 'none';
      }

      // =====================================================
      // ACTIVITY TAB FUNCTIONS
      // =====================================================
      
      let engagementChart = null;

      async function loadActivityData() {
        await Promise.all([
          loadChatStats(),
          loadEngagementTimeline(),
          loadUserConversations(),
          loadActiveUsers()
        ]);
      }

      async function loadChatStats() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/stats/chat', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const data = response.data;
          document.getElementById('total-user-chats').textContent = data.userChats?.totalConversations || 0;
          document.getElementById('total-messages').textContent = data.userChats?.totalMessages || 0;
          document.getElementById('total-ai-chats').textContent = data.aiChats?.totalMessages || 0;
          document.getElementById('ai-unique-users').textContent = data.aiChats?.uniqueUsers || 0;
        } catch (error) {
          console.error('Failed to load chat stats:', error);
        }
      }

      async function loadEngagementTimeline() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/stats/engagement-timeline?days=30', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const data = response.data;
          renderEngagementChart(data);
        } catch (error) {
          console.error('Failed to load engagement timeline:', error);
        }
      }

      function renderEngagementChart(data) {
        const ctx = document.getElementById('engagement-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (engagementChart) {
          engagementChart.destroy();
        }

        // Prepare data - merge dates from both sources
        const allDates = new Set();
        (data.messages || []).forEach(m => allDates.add(m.date));
        (data.aiChats || []).forEach(a => allDates.add(a.date));
        
        const sortedDates = Array.from(allDates).sort();
        
        const messagesMap = new Map((data.messages || []).map(m => [m.date, m.count]));
        const aiChatsMap = new Map((data.aiChats || []).map(a => [a.date, a.count]));

        engagementChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: sortedDates.map(d => new Date(d).toLocaleDateString('es', { month: 'short', day: 'numeric' })),
            datasets: [
              {
                label: 'User Messages',
                data: sortedDates.map(d => messagesMap.get(d) || 0),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
              },
              {
                label: 'AI Conversations',
                data: sortedDates.map(d => aiChatsMap.get(d) || 0),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }

      async function loadUserConversations() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/conversations?limit=20', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const conversations = response.data.conversations || [];
          
          if (conversations.length === 0) {
            document.getElementById('user-conversations-list').innerHTML = '<p class="text-gray-500 text-center py-8">No conversations yet</p>';
            return;
          }

          const html = conversations.map(c => \`
            <div class="border rounded-lg p-4 hover:shadow-md transition cursor-pointer" onclick="viewConversation(\${c.id}, 'user')">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="flex -space-x-2">
                    <img src="\${c.user1_avatar || '/default-avatar.png'}" alt="\${c.user1_name}" class="w-8 h-8 rounded-full border-2 border-white">
                    <img src="\${c.user2_avatar || '/default-avatar.png'}" alt="\${c.user2_name}" class="w-8 h-8 rounded-full border-2 border-white">
                  </div>
                  <div>
                    <p class="font-medium text-sm">\${c.user1_name} <i class="fas fa-exchange-alt text-gray-400 mx-1"></i> \${c.user2_name}</p>
                    <p class="text-xs text-gray-500">\${c.message_count} messages</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs px-2 py-1 rounded-full \${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">\${c.status}</span>
                  <p class="text-xs text-gray-500 mt-1">\${c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ''}</p>
                </div>
              </div>
              \${c.last_message ? \`<p class="text-xs text-gray-600 mt-2 truncate"><i class="fas fa-quote-left text-gray-300 mr-1"></i>\${c.last_message}</p>\` : ''}
            </div>
          \`).join('');

          document.getElementById('user-conversations-list').innerHTML = html;
        } catch (error) {
          console.error('Failed to load user conversations:', error);
          document.getElementById('user-conversations-list').innerHTML = '<p class="text-red-500 text-center py-8">Error loading conversations</p>';
        }
      }

      async function loadAgentConversations() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/agent-conversations?limit=20', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const conversations = response.data.conversations || [];
          
          if (conversations.length === 0) {
            document.getElementById('ai-conversations-list').innerHTML = '<p class="text-gray-500 text-center py-8">No AI conversations yet</p>';
            return;
          }

          const html = conversations.map(c => \`
            <div class="border rounded-lg p-4 hover:shadow-md transition cursor-pointer" onclick="viewConversation(\${c.user_id}, 'ai')">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <img src="\${c.user_avatar || '/default-avatar.png'}" alt="\${c.user_name}" class="w-10 h-10 rounded-full">
                  <div>
                    <p class="font-medium">\${c.user_name}</p>
                    <p class="text-xs text-gray-500">\${c.user_email}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    <i class="fas fa-robot mr-1"></i>\${c.message_count} messages
                  </span>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span><i class="fas fa-clock mr-1"></i>\${c.last_message_at ? new Date(c.last_message_at).toLocaleString() : ''}</span>
                \${c.last_message ? \`<span class="truncate max-w-xs"><i class="fas fa-quote-left text-gray-300 mr-1"></i>\${c.last_message.substring(0, 80)}...</span>\` : ''}
              </div>
            </div>
          \`).join('');

          document.getElementById('ai-conversations-list').innerHTML = html;
        } catch (error) {
          console.error('Failed to load AI conversations:', error);
          document.getElementById('ai-conversations-list').innerHTML = '<p class="text-red-500 text-center py-8">Error loading AI conversations</p>';
        }
      }

      async function loadActiveUsers() {
        try {
          const token = getAuthToken();
          const response = await axios.get('/api/admin/stats/active-users', {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          const { topMessagers, recentActive } = response.data;

          // Top messagers
          const topHtml = (topMessagers || []).map((u, i) => \`
            <div class="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-bold text-gray-400 w-5">#\${i + 1}</span>
                <img src="\${u.avatar_url || '/default-avatar.png'}" alt="\${u.name}" class="w-8 h-8 rounded-full">
                <div>
                  <p class="text-sm font-medium">\${u.name}</p>
                  <p class="text-xs text-gray-500">\${u.email}</p>
                </div>
              </div>
              <div class="text-right text-xs">
                <span class="text-blue-600">\${u.message_count} msgs</span>
                <span class="text-purple-600 ml-2">\${u.ai_chat_count} AI</span>
              </div>
            </div>
          \`).join('') || '<p class="text-gray-500 text-center py-4">No data</p>';

          // Recent active
          const recentHtml = (recentActive || []).map(u => \`
            <div class="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
              <div class="flex items-center space-x-2">
                <img src="\${u.avatar_url || '/default-avatar.png'}" alt="\${u.name}" class="w-8 h-8 rounded-full">
                <div>
                  <p class="text-sm font-medium">\${u.name}</p>
                  <p class="text-xs text-gray-500">\${u.email}</p>
                </div>
              </div>
              <span class="text-xs text-gray-500">\${u.last_activity ? new Date(u.last_activity).toLocaleString() : ''}</span>
            </div>
          \`).join('') || '<p class="text-gray-500 text-center py-4">No recent activity</p>';

          document.getElementById('top-messagers-list').innerHTML = topHtml;
          document.getElementById('recent-active-list').innerHTML = recentHtml;
        } catch (error) {
          console.error('Failed to load active users:', error);
        }
      }

      function showActivitySubTab(subtab) {
        // Update subtab buttons
        document.querySelectorAll('.activity-subtab').forEach(t => {
          t.classList.remove('text-primary', 'border-primary');
          t.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById(subtab + '-subtab').classList.remove('text-gray-500', 'border-transparent');
        document.getElementById(subtab + '-subtab').classList.add('text-primary', 'border-primary');

        // Show/hide content
        document.querySelectorAll('.activity-subtab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(subtab + '-content').classList.remove('hidden');

        // Load data
        if (subtab === 'user-chats') {
          loadUserConversations();
        } else if (subtab === 'ai-chats') {
          loadAgentConversations();
        } else if (subtab === 'active-users') {
          loadActiveUsers();
        }
      }

      async function viewConversation(id, type) {
        try {
          const token = getAuthToken();
          
          if (type === 'user') {
            const response = await axios.get(\`/api/admin/conversations/\${id}/messages\`, {
              headers: { Authorization: \`Bearer \${token}\` }
            });

            const messages = response.data.messages || [];
            
            document.getElementById('conversation-modal-title').innerHTML = '<i class="fas fa-comments mr-2"></i>User Conversation';
            
            const html = messages.map(m => \`
              <div class="flex \${m.sender_id % 2 === 0 ? 'justify-start' : 'justify-end'}">
                <div class="max-w-[80%] \${m.sender_id % 2 === 0 ? 'bg-gray-100' : 'bg-blue-100'} rounded-lg p-3">
                  <div class="flex items-center space-x-2 mb-1">
                    <img src="\${m.sender_avatar || '/default-avatar.png'}" alt="\${m.sender_name}" class="w-6 h-6 rounded-full">
                    <span class="text-xs font-medium">\${m.sender_name}</span>
                    <span class="text-xs text-gray-500">\${new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p class="text-sm">\${m.message}</p>
                </div>
              </div>
            \`).join('') || '<p class="text-gray-500 text-center py-4">No messages</p>';

            document.getElementById('conversation-messages').innerHTML = html;
          } else {
            // AI conversation - id is actually user_id
            const response = await axios.get(\`/api/admin/agent-conversations/\${id}\`, {
              headers: { Authorization: \`Bearer \${token}\` }
            });

            const conv = response.data.conversation;
            const messages = conv.messages || [];
            
            document.getElementById('conversation-modal-title').innerHTML = \`<i class="fas fa-robot mr-2"></i>AI Conversation with \${conv.user_name}\`;
            
            const html = \`
              <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm"><strong>User:</strong> \${conv.user_name} (\${conv.user_email})</p>
                <p class="text-xs text-gray-500">Total messages: \${messages.length}</p>
              </div>
              <div class="space-y-4">
                \${messages.map(m => \`
                  <div class="flex \${m.role === 'user' ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-[80%] \${m.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'} rounded-lg p-3">
                      <div class="flex items-center space-x-2 mb-1">
                        <i class="fas \${m.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs"></i>
                        <span class="text-xs font-medium capitalize">\${m.role}</span>
                        <span class="text-xs text-gray-500">\${new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p class="text-sm whitespace-pre-wrap">\${m.content || ''}</p>
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`;

            document.getElementById('conversation-messages').innerHTML = html || '<p class="text-gray-500 text-center py-4">No messages</p>';
          }

          document.getElementById('conversation-modal').style.display = 'flex';
        } catch (error) {
          console.error('Failed to load conversation:', error);
          alert('Failed to load conversation: ' + error.message);
        }
      }

      function closeConversationModal() {
        document.getElementById('conversation-modal').style.display = 'none';
      }

      // ============================================
      // PITCH DECK SUB-TABS
      // ============================================
      function showPitchSubTab(tabName) {
        document.querySelectorAll('.pitch-subtab-content').forEach(function(el) {
          el.classList.add('hidden');
        });
        document.querySelectorAll('.pitch-subtab').forEach(function(el) {
          el.classList.remove('border-purple-600', 'text-purple-600');
          el.classList.add('border-transparent', 'text-gray-500');
        });
        document.getElementById(tabName + '-pitch-content').classList.remove('hidden');
        var tab = document.getElementById(tabName + '-subtab');
        if (tab) {
          tab.classList.add('border-purple-600', 'text-purple-600');
          tab.classList.remove('border-transparent', 'text-gray-500');
        }
      }

      // ============================================
      // LOAD CONVERSATION PITCHES (NEW)
      // ============================================
      async function loadConversationPitches() {
        try {
          var token = getAuthToken();
          var weekFilter = document.getElementById('pitch-week-filter')?.value || 'all';

          var response = await axios.get('/api/admin/conversation-pitches', {
            headers: { Authorization: 'Bearer ' + token },
            params: { filter: weekFilter }
          });

          var data = response.data;
          var conversations = data.conversations || [];
          var rawConversations = data.rawConversations || [];
          var goals = data.recentGoals || [];
          var metrics = data.recentMetrics || [];
          var weeklyScores = data.weeklyScores || [];
          var legacy = data.legacySubmissions || [];
          var stats = data.stats || {};

          // Update stats cards
          document.getElementById('pitch-total-users').textContent = stats.totalConversations || 0;
          document.getElementById('pitch-total-responses').textContent = stats.totalGoalsGenerated || 0;
          document.getElementById('pitch-avg-score').textContent = stats.totalMetricsSaved || 0;
          document.getElementById('pitch-top-performer').textContent = stats.totalRawSaved || 0;

          // ---- RENDER CONVERSATIONS TAB ----
          if (conversations.length === 0) {
            document.getElementById('conversations-list').innerHTML = '<div class="text-center py-8"><p class="text-gray-500 mb-2">No conversation pitch decks found</p><p class="text-sm text-gray-400">Users need to complete a conversational pitch deck first</p></div>';
          } else {
            var convHtml = conversations.map(function(c) {
              return '<div class="bg-white border rounded-lg p-4 hover:shadow-md transition">' +
                '<div class="flex items-start justify-between mb-3">' +
                  '<div class="flex-1">' +
                    '<h3 class="font-bold text-lg">' + (c.startup_name || 'No startup') + '</h3>' +
                    '<p class="text-sm text-gray-600">' + (c.user_name || 'Unknown') + ' (' + (c.user_email || '') + ')</p>' +
                    '<p class="text-xs text-gray-400">' + new Date(c.created_at).toLocaleString() + '</p>' +
                  '</div>' +
                  '<div class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">' +
                    (c.details || 'N/A') +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('');
            document.getElementById('conversations-list').innerHTML = convHtml;
          }

          // ---- RENDER GOALS TAB ----
          if (goals.length === 0) {
            document.getElementById('goals-list').innerHTML = '<p class="text-gray-500 text-center py-8">No auto-generated goals found (last 7 days)</p>';
          } else {
            var goalsHtml = '<div class="overflow-x-auto"><table class="w-full text-sm">' +
              '<thead class="bg-gray-50"><tr>' +
                '<th class="px-3 py-2 text-left">User</th>' +
                '<th class="px-3 py-2 text-left">Category</th>' +
                '<th class="px-3 py-2 text-left">Description</th>' +
                '<th class="px-3 py-2 text-left">Task</th>' +
                '<th class="px-3 py-2 text-left">Priority</th>' +
                '<th class="px-3 py-2 text-left">Status</th>' +
                '<th class="px-3 py-2 text-left">Week</th>' +
                '<th class="px-3 py-2 text-left">Created</th>' +
              '</tr></thead><tbody>';
            goals.forEach(function(g) {
              var priorityColor = g.priority_label === 'Urgent & important' ? 'red' : g.priority_label === 'Urgent or important' ? 'orange' : 'gray';
              var categoryBadge = g.category === 'ASTAR' ? 'bg-purple-100 text-purple-700' : g.category === 'traction' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
              goalsHtml += '<tr class="border-t hover:bg-gray-50">' +
                '<td class="px-3 py-2"><div class="font-medium">' + (g.user_name || '') + '</div><div class="text-xs text-purple-600 font-semibold">' + (g.startup_name || '') + '</div><div class="text-xs text-gray-400">' + (g.user_email || '') + '</div></td>' +
                '<td class="px-3 py-2"><span class="px-2 py-1 rounded text-xs font-bold ' + categoryBadge + '">' + (g.category || 'N/A') + '</span></td>' +
                '<td class="px-3 py-2 max-w-xs truncate">' + (g.description || '') + '</td>' +
                '<td class="px-3 py-2">' + (g.task || '') + '</td>' +
                '<td class="px-3 py-2"><span class="text-xs text-' + priorityColor + '-600 font-bold">' + (g.priority_label || '') + '</span></td>' +
                '<td class="px-3 py-2"><span class="px-2 py-1 rounded text-xs bg-gray-100">' + (g.goal_status || g.status || '') + '</span></td>' +
                '<td class="px-3 py-2 text-xs">W' + (g.week_number || '') + '/' + (g.year_number || '') + '</td>' +
                '<td class="px-3 py-2 text-xs text-gray-400">' + new Date(g.created_at).toLocaleString() + '</td>' +
              '</tr>';
            });
            goalsHtml += '</tbody></table></div>';
            document.getElementById('goals-list').innerHTML = goalsHtml;
          }

          // ---- RENDER METRICS TAB ----
          if (metrics.length === 0) {
            document.getElementById('metrics-list').innerHTML = '<p class="text-gray-500 text-center py-8">No metrics saved (last 7 days)</p>';
          } else {
            var metricsHtml = '<div class="overflow-x-auto"><table class="w-full text-sm">' +
              '<thead class="bg-gray-50"><tr>' +
                '<th class="px-3 py-2 text-left">User</th>' +
                '<th class="px-3 py-2 text-left">Metric</th>' +
                '<th class="px-3 py-2 text-right">Value</th>' +
                '<th class="px-3 py-2 text-left">Date</th>' +
                '<th class="px-3 py-2 text-left">Created</th>' +
              '</tr></thead><tbody>';
            metrics.forEach(function(m) {
              var metricIcon = m.metric_name === 'revenue' ? '💰' : m.metric_name === 'users' ? '👥' : m.metric_name === 'active_users' ? '📈' : m.metric_name === 'new_users' ? '🆕' : '📊';
              metricsHtml += '<tr class="border-t hover:bg-gray-50">' +
                '<td class="px-3 py-2"><div class="font-medium">' + (m.user_name || '') + '</div><div class="text-xs text-purple-600 font-semibold">' + (m.startup_name || '') + '</div><div class="text-xs text-gray-400">' + (m.user_email || '') + '</div></td>' +
                '<td class="px-3 py-2"><span class="font-mono">' + metricIcon + ' ' + (m.metric_name || '') + '</span></td>' +
                '<td class="px-3 py-2 text-right font-bold text-lg text-green-600">' + (m.metric_value || 0) + '</td>' +
                '<td class="px-3 py-2 text-sm">' + (m.recorded_date || '') + '</td>' +
                '<td class="px-3 py-2 text-xs text-gray-400">' + new Date(m.created_at).toLocaleString() + '</td>' +
              '</tr>';
            });
            metricsHtml += '</tbody></table></div>';
            document.getElementById('metrics-list').innerHTML = metricsHtml;
          }

          // ---- RENDER WEEKLY SCORES TAB ----
          if (weeklyScores.length === 0) {
            document.getElementById('weekly-scores-list').innerHTML = '<p class="text-gray-500 text-center py-8">No weekly scores found</p>';
          } else {
            var weeklyHtml = '<div class="overflow-x-auto"><table class="w-full text-sm">' +
              '<thead class="bg-gray-50"><tr>' +
                '<th class="px-3 py-2 text-left">User</th>' +
                '<th class="px-3 py-2 text-left">Startup</th>' +
                '<th class="px-3 py-2 text-center">Week</th>' +
                '<th class="px-3 py-2 text-center">Score</th>' +
                '<th class="px-3 py-2 text-center">Users Contacted</th>' +
                '<th class="px-3 py-2 text-center">Hypotheses</th>' +
                '<th class="px-3 py-2 text-center">Learnings</th>' +
                '<th class="px-3 py-2 text-center">Response Rate</th>' +
                '<th class="px-3 py-2 text-left">Date</th>' +
              '</tr></thead><tbody>';
            weeklyScores.forEach(function(w) {
              var scoreColor = (w.iteration_score || 0) >= 70 ? 'green' : (w.iteration_score || 0) >= 40 ? 'yellow' : 'red';
              weeklyHtml += '<tr class="border-t hover:bg-gray-50">' +
                '<td class="px-3 py-2 font-medium">' + (w.user_name || '') + '</td>' +
                '<td class="px-3 py-2 text-sm text-gray-600">' + (w.startup_name || 'N/A') + '</td>' +
                '<td class="px-3 py-2 text-center">W' + (w.week_number || '') + '/' + (w.year || '') + '</td>' +
                '<td class="px-3 py-2 text-center"><span class="px-3 py-1 rounded-full text-sm font-bold bg-' + scoreColor + '-100 text-' + scoreColor + '-700">' + (w.iteration_score || 0) + '</span></td>' +
                '<td class="px-3 py-2 text-center">' + (w.users_contacted || 0) + '</td>' +
                '<td class="px-3 py-2 text-center">' + (w.hypotheses_tested || 0) + '</td>' +
                '<td class="px-3 py-2 text-center">' + (w.learnings_count || 0) + '</td>' +
                '<td class="px-3 py-2 text-center">' + (w.response_rate || 0) + '%</td>' +
                '<td class="px-3 py-2 text-xs text-gray-400">' + new Date(w.created_at).toLocaleString() + '</td>' +
              '</tr>';
            });
            weeklyHtml += '</tbody></table></div>';
            document.getElementById('weekly-scores-list').innerHTML = weeklyHtml;
          }

          // ---- RENDER RAW JSON TAB ----
          if (rawConversations.length === 0) {
            document.getElementById('raw-json-list').innerHTML = '<p class="text-gray-500 text-center py-8">No raw conversation data found</p>';
          } else {
            var rawHtml = rawConversations.map(function(r, idx) {
              var parsed = null;
              try { parsed = JSON.parse(r.details); } catch(e) { parsed = r.details; }
              
              var conversationMessages = '';
              if (parsed && parsed.conversationHistory) {
                conversationMessages = '<div class="mt-3 space-y-2 max-h-64 overflow-y-auto">';
                parsed.conversationHistory.forEach(function(msg) {
                  var isAI = msg.role === 'ai';
                  conversationMessages += '<div class="flex gap-2 ' + (isAI ? '' : 'justify-end') + '">' +
                    '<div class="max-w-xs p-2 rounded-lg text-sm ' + (isAI ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200') + '">' +
                      '<div class="text-xs font-bold ' + (isAI ? 'text-purple-600' : 'text-blue-600') + '">' + (isAI ? '🤖 AI' : '👤 User') + ' <span class="text-gray-400">(' + (msg.topic || '?') + ')</span></div>' +
                      '<p class="text-gray-700">' + (msg.content || '') + '</p>' +
                    '</div>' +
                  '</div>';
                });
                conversationMessages += '</div>';
              }

              var analysisHtml = '';
              if (parsed && parsed.analysis) {
                var a = parsed.analysis;
                analysisHtml = '<div class="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">' +
                  '<h5 class="font-bold text-green-700 mb-2">📊 AI Analysis Result</h5>' +
                  '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">' +
                    '<div><span class="text-gray-500">Score:</span> <strong>' + (a.overall_score || 'N/A') + '/100</strong></div>' +
                    '<div><span class="text-gray-500">Rating:</span> <strong>' + (a.week_rating || 'N/A') + '</strong></div>' +
                    '<div><span class="text-gray-500">Learning:</span> <strong>' + (a.velocity_of_learning || 'N/A') + '/10</strong></div>' +
                    '<div><span class="text-gray-500">Depth:</span> <strong>' + (a.depth_of_usage || 'N/A') + '/10</strong></div>' +
                  '</div>' +
                  '<p class="mt-2 text-sm text-gray-700"><strong>Summary:</strong> ' + (a.summary || 'N/A') + '</p>' +
                  '<p class="text-sm text-gray-700"><strong>Strength:</strong> ' + (a.key_strength || 'N/A') + '</p>' +
                  '<p class="text-sm text-gray-700"><strong>Challenge:</strong> ' + (a.key_challenge || 'N/A') + '</p>' +
                  '<p class="text-sm text-gray-700"><strong>Action:</strong> ' + (a.suggested_action || 'N/A') + '</p>' +
                  (a.auto_goals ? '<div class="mt-2"><strong class="text-sm">Auto-Goals:</strong><ul class="list-disc list-inside text-sm text-gray-600">' + 
                    a.auto_goals.map(function(g) { return '<li>' + g.description + ' <span class="text-xs text-gray-400">(' + g.category + ' | ' + g.priority_label + ')</span></li>'; }).join('') +
                  '</ul></div>' : '') +
                '</div>';
              }

              var topicSummaryHtml = '';
              if (parsed && parsed.extractedResponses) {
                var er = parsed.extractedResponses;
                topicSummaryHtml = '<div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">' +
                  (er.intro ? '<div class="bg-gray-50 p-2 rounded text-sm"><strong class="text-purple-600">👤 Intro:</strong> ' + er.intro.substring(0, 200) + '</div>' : '') +
                  (er.highlights ? '<div class="bg-gray-50 p-2 rounded text-sm"><strong class="text-green-600">✨ Highlights:</strong> ' + er.highlights.substring(0, 200) + '</div>' : '') +
                  (er.lowlights ? '<div class="bg-gray-50 p-2 rounded text-sm"><strong class="text-red-600">⚠️ Lowlights:</strong> ' + er.lowlights.substring(0, 200) + '</div>' : '') +
                  (er.needs ? '<div class="bg-gray-50 p-2 rounded text-sm"><strong class="text-blue-600">🤝 Needs:</strong> ' + er.needs.substring(0, 200) + '</div>' : '') +
                '</div>';
              }

              return '<div class="bg-white border rounded-lg p-4 hover:shadow-md transition">' +
                '<div class="flex items-start justify-between mb-2">' +
                  '<div>' +
                    '<h4 class="font-bold">' + (r.user_name || 'Unknown User') + '</h4>' +
                    '<p class="text-sm text-gray-500">' + (r.user_email || '') + ' · ' + (r.startup_name || 'No startup') + '</p>' +
                    '<p class="text-xs text-gray-400">' + new Date(r.created_at).toLocaleString() + '</p>' +
                  '</div>' +
                  '<button onclick="toggleRawJson(' + idx + ')" class="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-mono">{ } Toggle JSON</button>' +
                '</div>' +
                topicSummaryHtml +
                analysisHtml +
                conversationMessages +
                '<div id="raw-json-toggle-' + idx + '" class="hidden mt-3">' +
                  '<pre class="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">' + JSON.stringify(parsed, null, 2) + '</pre>' +
                '</div>' +
              '</div>';
            }).join('');
            document.getElementById('raw-json-list').innerHTML = rawHtml;
          }

          // ---- RENDER LEGACY TAB ----
          if (legacy.length === 0) {
            document.getElementById('pitch-responses-list').innerHTML = '<p class="text-gray-500 text-center py-8">No legacy submissions found</p>';
          } else {
            var legacyHtml = legacy.map(function(l) {
              return '<div class="bg-white border rounded-lg p-4">' +
                '<div class="flex items-start justify-between">' +
                  '<div>' +
                    '<h4 class="font-bold">' + (l.user_name || 'Unknown') + '</h4>' +
                    '<p class="text-sm text-gray-500">' + (l.user_email || '') + '</p>' +
                    '<p class="text-xs text-gray-400">' + new Date(l.created_at).toLocaleString() + ' · ' + (l.startup_name || '') + '</p>' +
                  '</div>' +
                  '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Legacy</span>' +
                '</div>' +
                '<p class="text-sm text-gray-700 mt-2 truncate">' + (l.details || '').substring(0, 200) + '</p>' +
              '</div>';
            }).join('');
            document.getElementById('pitch-responses-list').innerHTML = legacyHtml;
          }

        } catch (error) {
          console.error('Failed to load conversation pitches:', error);
          document.getElementById('conversations-list').innerHTML = '<p class="text-red-500 text-center py-8">Error loading data: ' + error.message + '</p>';
        }
      }

      function toggleRawJson(idx) {
        var el = document.getElementById('raw-json-toggle-' + idx);
        if (el) el.classList.toggle('hidden');
      }

      // Expose functions to window for onclick handlers
      window.showAdminTab = showAdminTab;
      window.showPitchSubTab = showPitchSubTab;
      window.loadPitchDeckResponses = loadPitchDeckResponses;
      window.loadConversationPitches = loadConversationPitches;
      window.toggleRawJson = toggleRawJson;
      window.viewPitchDeckDetails = viewPitchDeckDetails;
      window.debugEmailRecipients = debugEmailRecipients;
      window.loadStartupsList = loadStartupsList;
      window.deleteStartup = deleteStartup;
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'dashboard',
    userName,
    userAvatar,
    pageTitle: '🛡️ Admin Dashboard - ASTAR*',
    userRole
  });
}
