/**
 * Leaderboard Page
 * Shows startup rankings with consistent layout
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export interface LeaderboardPageProps {
  userName: string;
  userAvatar?: string;
  userRole: string;
}

export function getLeaderboardPage(props: LeaderboardPageProps): string {
  const { userName, userAvatar, userRole } = props;

  const content = `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          ASTAR LABS BETA
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <i class="fas fa-trophy text-yellow-500 mr-3"></i>
          🏆 Discover Innovative Startups
        </h1>
        <p class="text-gray-600">Vote for your favorite startups, validate ideas, and watch them rise to the leaderboard</p>
      </div>

      <!-- Category Filter -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-2">
          <button onclick="filterByCategory('all')" class="category-btn active px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-sm">
            All Startups
          </button>
          <button onclick="filterByCategory('SaaS')" class="category-btn px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm">
            💻 SaaS
          </button>
          <button onclick="filterByCategory('Mobile')" class="category-btn px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm">
            📱 Mobile
          </button>
          <button onclick="filterByCategory('Web3')" class="category-btn px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm">
            🔗 Web3
          </button>
          <button onclick="filterByCategory('Healthcare')" class="category-btn px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm">
            🏥 Healthcare
          </button>
          <button onclick="filterByCategory('Fintech')" class="category-btn px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm">
            💰 Fintech
          </button>
        </div>
      </div>

      <!-- Leaderboard Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">🏆 Startup Rankings</h2>
            <p class="text-purple-200 text-sm">Scored like a VC would evaluate</p>
          </div>
          <div class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
            Live
          </div>
        </div>

        <!-- Scoring Legend -->
        <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
          <div class="flex flex-wrap gap-4">
            <span><strong>Score =</strong></span>
            <span>🚀 Growth (35%)</span>
            <span>📈 Traction (25%)</span>
            <span>⭐ Stars (20%)</span>
            <span>✅ Execution (15%)</span>
            <span>💬 Engagement (5%)</span>
          </div>
        </div>

        <div id="leaderboard-loading" class="p-12 text-center">
          <div class="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600 font-medium">Loading leaderboard...</p>
        </div>

        <div id="leaderboard-content" class="hidden overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Startup</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">VC Score</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Growth</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Stars</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Active Users</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">New/Churned</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Execution</th>
              </tr>
            </thead>
            <tbody id="leaderboard-tbody" class="divide-y divide-gray-200">
              <!-- Startups will be loaded here -->
            </tbody>
          </table>
        </div>

        <div id="leaderboard-empty" class="hidden p-12 text-center">
          <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-600 mb-2">No startups in this category</h3>
          <p class="text-gray-500">Be the first to publish a startup in this category.</p>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      let currentCategory = 'all';
      let leaderboardData = [];

      // Initialize
      document.addEventListener('DOMContentLoaded', () => {
        loadLeaderboard();
      });

      // Load leaderboard data
      async function loadLeaderboard() {
        try {
          showLoading();
          const response = await fetch('/api/projects/leaderboard/top?limit=50');
          const data = await response.json();
          
          if (data.leaderboard) {
            leaderboardData = data.leaderboard;
            renderLeaderboard();
          } else {
            showEmpty();
          }
        } catch (error) {
          console.error('Error loading leaderboard:', error);
          showEmpty();
        }
      }

      // Filter by category
      function filterByCategory(category) {
        currentCategory = category;
        
        // Update button styles
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('active', 'bg-purple-600', 'text-white');
          btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        event.target.classList.add('active', 'bg-purple-600', 'text-white');
        event.target.classList.remove('bg-gray-200', 'text-gray-700');
        
        renderLeaderboard();
      }

      // Render leaderboard
      function renderLeaderboard() {
        const tbody = document.getElementById('leaderboard-tbody');
        const filteredData = currentCategory === 'all' 
          ? leaderboardData 
          : leaderboardData.filter(project => project.category === currentCategory);
        
        if (filteredData.length === 0) {
          showEmpty();
          return;
        }
        
        tbody.innerHTML = filteredData.map((project, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1);
          const score = project.leaderboard_score || 0;
          const vcScore = project.vc_score || 'C';
          const completedGoals = project.completed_goals || 0;
          const totalGoals = project.total_goals || 0;
          const goalsPercent = totalGoals > 0 ? (completedGoals / totalGoals * 100) : 0;
          const category = formatCategory(project.category || 'Other');
          
          // Growth indicators - prefer traction data if available
          const tractionData = project.tractionData || {};
          let userGrowthWoW = 0;
          let revenueGrowthWoW = 0;
          
          // Use traction data growth if available (more accurate)
          if (tractionData.userWoWGrowth !== undefined && tractionData.userWoWGrowth !== 0) {
            userGrowthWoW = tractionData.userWoWGrowth;
          } else if (project.growth_wow?.users) {
            userGrowthWoW = project.growth_wow.users;
          }
          
          if (tractionData.revenueWoWGrowth !== undefined && tractionData.revenueWoWGrowth !== 0) {
            revenueGrowthWoW = tractionData.revenueWoWGrowth;
          } else if (project.growth_wow?.revenue) {
            revenueGrowthWoW = project.growth_wow.revenue;
          }
          
          const avgGrowth = (userGrowthWoW + revenueGrowthWoW) / 2;
          const growthColor = avgGrowth > 10 ? 'text-green-600' : avgGrowth > 0 ? 'text-blue-600' : avgGrowth < 0 ? 'text-red-600' : 'text-gray-500';
          const growthIcon = avgGrowth > 0 ? '↑' : avgGrowth < 0 ? '↓' : '→';
          
          // For display
          const growthWoW = { users: userGrowthWoW, revenue: revenueGrowthWoW };
          
          // VC Score color
          const vcColors = {
            'A+': 'bg-green-500 text-white',
            'A': 'bg-green-400 text-white',
            'B+': 'bg-blue-500 text-white',
            'B': 'bg-blue-400 text-white',
            'C+': 'bg-yellow-500 text-white',
            'C': 'bg-yellow-400 text-gray-800',
            'D': 'bg-red-400 text-white'
          };
          const vcColor = vcColors[vcScore] || 'bg-gray-400 text-white';
          
          // Traction tracking indicator
          const isTrackingTraction = tractionData.reportingWeeks >= 2;
          const tractionBadge = isTrackingTraction 
            ? \`<span class="ml-2 px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full font-semibold" title="Actively tracking weekly traction">📊 Tracking</span>\`
            : '';
          
          return \`
            <tr class="hover:bg-gray-50 transition cursor-pointer" onclick="viewStartupDetail(\${project.id})">
              <td class="px-4 py-4">
                <span class="text-2xl font-bold">\${medal}</span>
              </td>
              <td class="px-4 py-4">
                <div>
                  <div class="font-bold text-gray-900 flex items-center">
                    \${project.title}
                    \${tractionBadge}
                  </div>
                  <div class="text-sm text-gray-500">\${category}</div>
                  <div class="text-xs text-gray-400">by \${project.creator_name || 'Anonymous'}</div>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="px-2 py-1 rounded text-xs font-bold \${vcColor}">\${vcScore}</span>
                  <span class="text-lg font-black text-purple-600 mt-1">\${score.toFixed(1)}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="\${growthColor} font-bold">\${growthIcon} \${Math.abs(avgGrowth).toFixed(1)}%</span>
                  <span class="text-xs text-gray-400">WoW</span>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex items-center justify-center">
                  <span class="text-yellow-500 mr-1">★</span>
                  <span class="font-semibold">\${(project.rating_average || 0).toFixed(1)}</span>
                  <span class="text-gray-400 text-sm ml-1">(\${project.votes_count || 0})</span>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-purple-600">\${formatNumber(tractionData.avgActive4w || project.current_users || 0)}</span>
                  \${growthWoW.users !== 0 ? \`<span class="text-xs \${growthWoW.users > 0 ? 'text-green-500' : 'text-red-500'}">\${growthWoW.users > 0 ? '+' : ''}\${growthWoW.users.toFixed(1)}%</span>\` : '<span class="text-xs text-gray-400">-</span>'}
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center gap-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-green-600 font-semibold" title="New users (4w)">
                      <i class="fas fa-user-plus text-xs"></i> +\${tractionData.newUsers4w || 0}
                    </span>
                    <span class="text-xs text-red-500 font-semibold" title="Churned users">
                      <i class="fas fa-user-minus text-xs"></i> -\${project.traction_churned_4w || 0}
                    </span>
                  </div>
                  <span class="text-xs text-gray-400">Last 4 weeks</span>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-green-600">€\${formatNumber(tractionData.revenue4w || project.current_revenue || 0)}</span>
                  \${growthWoW.revenue !== 0 ? \`<span class="text-xs \${growthWoW.revenue > 0 ? 'text-green-500' : 'text-red-500'}">\${growthWoW.revenue > 0 ? '+' : ''}\${growthWoW.revenue.toFixed(1)}%</span>\` : '<span class="text-xs text-gray-400">-</span>'}
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center">
                  <div class="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div class="bg-purple-600 h-2 rounded-full" style="width: \${goalsPercent}%"></div>
                  </div>
                  <span class="text-xs text-gray-500">\${completedGoals}/\${totalGoals}</span>
                </div>
              </td>
            </tr>
          \`;
        }).join('');
        
        showContent();
      }

      function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
      }

      function formatCategory(category) {
        if (!category) return 'Other';
        return category.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }

      function viewStartupDetail(id) {
        window.location.href = '/marketplace?product=' + id;
      }

      function showLoading() {
        document.getElementById('leaderboard-loading').classList.remove('hidden');
        document.getElementById('leaderboard-content').classList.add('hidden');
        document.getElementById('leaderboard-empty').classList.add('hidden');
      }

      function showContent() {
        document.getElementById('leaderboard-loading').classList.add('hidden');
        document.getElementById('leaderboard-content').classList.remove('hidden');
        document.getElementById('leaderboard-empty').classList.add('hidden');
      }

      function showEmpty() {
        document.getElementById('leaderboard-loading').classList.add('hidden');
        document.getElementById('leaderboard-content').classList.add('hidden');
        document.getElementById('leaderboard-empty').classList.remove('hidden');
      }
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    userName,
    userAvatar,
    userRole,
    currentPage: 'leaderboard'
  });
}
