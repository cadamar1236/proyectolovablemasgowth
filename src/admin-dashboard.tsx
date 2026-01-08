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
        <div class="border-b border-gray-200">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button onclick="showAdminTab('statistics')" id="statistics-tab" class="admin-tab py-4 px-1 border-b-2 font-medium text-sm border-primary text-primary">
              <i class="fas fa-chart-bar mr-2"></i>Statistics
            </button>
            <button onclick="showAdminTab('competitions')" id="competitions-tab" class="admin-tab py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
              <i class="fas fa-trophy mr-2"></i>Manage Competitions
            </button>
            <button onclick="showAdminTab('users')" id="users-tab" class="admin-tab py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
              <i class="fas fa-users mr-2"></i>Users
            </button>
            <button onclick="showAdminTab('reports')" id="reports-tab" class="admin-tab py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
              <i class="fas fa-file-alt mr-2"></i>Reports
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

        <!-- Reports Tab -->
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
      document.addEventListener('DOMContentLoaded', () => {
        loadAdminStats();
        loadRecentActivity();
      });
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
