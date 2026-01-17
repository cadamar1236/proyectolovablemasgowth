import { createLayoutWithSidebars } from './layout-with-sidebars';

export function renderTeamManagementPage(user: any) {
  const content = `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Team Management</h1>
              <p class="text-gray-600 mt-1">Manage co-founders and share your goals dashboard</p>
            </div>
            <a href="/dashboard" class="text-primary hover:text-secondary font-semibold flex items-center">
              <i class="fas fa-arrow-left mr-2"></i> Back to Dashboard
            </a>
          </div>
        </div>

        <!-- Pending Invitations -->
        <div id="pending-invitations-container"></div>

        <!-- Team Info Card -->
        <div id="team-info" class="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">Your Startup Team</h2>
            <button onclick="window.editTeamName()" class="text-primary hover:text-secondary text-sm font-semibold">
              <i class="fas fa-edit mr-1"></i> Edit Name
            </button>
          </div>
          <div id="team-name-display" class="text-2xl font-bold text-primary mb-2">Loading...</div>
          <div id="team-member-count" class="text-sm text-gray-600">Loading members...</div>
        </div>

        <!-- Add Founder Section -->
        <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-user-plus mr-2"></i> Add Co-founder
          </h2>
          <p class="text-white/90 mb-4 text-sm">
            Invite team members by email to share the goals dashboard. They'll be able to see and track all team goals.
          </p>
          <div class="flex gap-3">
            <input 
              type="email" 
              id="founder-email" 
              placeholder="founder@example.com" 
              class="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <input 
              type="text" 
              id="founder-role" 
              placeholder="Role (e.g., CTO)" 
              class="w-40 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              onclick="window.addFounder()" 
              class="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition flex items-center whitespace-nowrap"
            >
              <i class="fas fa-plus mr-2"></i> Add
            </button>
          </div>
          <div id="add-founder-message" class="mt-3 text-sm"></div>
        </div>

        <!-- Team Members List -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">
            <i class="fas fa-users mr-2"></i> Team Members
          </h2>
          <div id="team-members-list" class="space-y-3">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
              <p>Loading team members...</p>
            </div>
          </div>
        </div>

        <!-- Shared Goals Info -->
        <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mt-6">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-blue-500 text-xl mr-3 mt-1"></i>
            <div>
              <h3 class="font-bold text-blue-900 mb-1">About Shared Goals</h3>
              <p class="text-blue-800 text-sm">
                All team members can view the same goals dashboard. Each goal shows who created it, 
                making it easy to track progress across the entire startup team. Goals remain editable 
                only by their creator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      let currentTeam = null;

      async function loadTeamData() {
        try {
          const response = await axios.get('/api/team/my-team');
          if (response.data.success) {
            currentTeam = response.data.team;
            displayTeamInfo();
            displayTeamMembers();
          }
        } catch (error) {
          console.error('Error loading team:', error);
          document.getElementById('team-info').innerHTML = 
            '<div class="text-red-500">Error loading team data. Please refresh the page.</div>';
        }
        
        // Load pending invitations
        await loadPendingInvitations();
      }

      async function loadPendingInvitations() {
        try {
          const response = await axios.get('/api/team/my-invitations');
          if (response.data.success && response.data.invitations.length > 0) {
            displayPendingInvitations(response.data.invitations);
          }
        } catch (error) {
          console.error('Error loading invitations:', error);
        }
      }

      function displayPendingInvitations(invitations) {
        const container = document.getElementById('pending-invitations-container');
        container.innerHTML = invitations.map(inv => \`
          <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <i class="fas fa-envelope text-2xl mr-3"></i>
                  <h3 class="text-xl font-bold">Team Invitation</h3>
                </div>
                <p class="text-white/90 mb-2">
                  <strong>\${inv.invited_by_name || inv.invited_by_email}</strong> invited you to join 
                  <strong>"\${inv.team_name}"</strong> as <strong>\${inv.role}</strong>
                </p>
                \${inv.invitation_type === 'transfer' ? \`
                  <div class="bg-white/20 rounded-lg p-3 mb-3">
                    <p class="text-sm flex items-start">
                      <i class="fas fa-exclamation-triangle mr-2 mt-0.5"></i>
                      <span>You will be moved from your current team "<strong>\${inv.current_team_name}</strong>" to this new team. All your goals will be transferred.</span>
                    </p>
                  </div>
                \` : ''}
                <p class="text-xs text-white/70">
                  Invited on \${new Date(inv.invited_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div class="flex gap-3 mt-4">
              <button 
                onclick="window.respondToInvitation(\${inv.id}, 'accept')" 
                class="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                <i class="fas fa-check mr-2"></i> Accept
              </button>
              <button 
                onclick="window.respondToInvitation(\${inv.id}, 'reject')" 
                class="flex-1 bg-white/20 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition"
              >
                <i class="fas fa-times mr-2"></i> Decline
              </button>
            </div>
          </div>
        \`).join('');
      }

      window.respondToInvitation = async function(invitationId, action) {
        try {
          const response = await axios.post(\`/api/team/invitations/\${invitationId}/\${action}\`);
          if (response.data.success) {
            alert(response.data.message);
            location.reload(); // Refresh to show updated team
          } else {
            alert('Error: ' + response.data.error);
          }
        } catch (error) {
          console.error('Error responding to invitation:', error);
          alert('Failed to process invitation');
        }
      }

      function displayTeamInfo() {
        document.getElementById('team-name-display').textContent = currentTeam.name;
        document.getElementById('team-member-count').textContent = 
          \`\${currentTeam.member_count} \${currentTeam.member_count === 1 ? 'member' : 'members'}\`;
      }

      function displayTeamMembers() {
        const container = document.getElementById('team-members-list');
        if (!currentTeam.members || currentTeam.members.length === 0) {
          container.innerHTML = '<div class="text-gray-500 text-center py-4">No team members yet</div>';
          return;
        }

        container.innerHTML = currentTeam.members.map(member => \`
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                \${member.avatar_url ? 
                  \`<img src="\${member.avatar_url}" class="w-12 h-12 rounded-full" />\` :
                  member.name?.charAt(0).toUpperCase() || '?'
                }
              </div>
              <div>
                <div class="font-semibold text-gray-900">
                  \${member.name || 'Unknown'}
                  \${member.is_creator ? '<span class="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">Creator</span>' : ''}
                </div>
                <div class="text-sm text-gray-600">\${member.email || 'No email'}</div>
                <div class="text-xs text-gray-500 mt-1">\${member.role || 'Team Member'}</div>
              </div>
            </div>
            <div>
              \${!member.is_creator ? \`
                <button 
                  onclick="window.removeFounder(\${member.id}, '\${member.name}')" 
                  class="text-red-500 hover:text-red-700 font-semibold text-sm"
                >
                  <i class="fas fa-trash-alt mr-1"></i> Remove
                </button>
              \` : \`
                <span class="text-gray-400 text-sm">
                  <i class="fas fa-crown mr-1"></i> Owner
                </span>
              \`}
            </div>
          </div>
        \`).join('');
      }

      window.addFounder = async function() {
        const email = document.getElementById('founder-email').value.trim();
        const role = document.getElementById('founder-role').value.trim();
        const messageEl = document.getElementById('add-founder-message');

        if (!email) {
          messageEl.innerHTML = '<span class="text-yellow-200"><i class="fas fa-exclamation-triangle mr-1"></i> Please enter an email</span>';
          return;
        }

        try {
          messageEl.innerHTML = '<span class="text-white"><i class="fas fa-spinner fa-spin mr-1"></i> Adding founder...</span>';
          
          const response = await axios.post('/api/team/add-founder', { email, role: role || 'Co-founder' });
          
          if (response.data.success) {
            messageEl.innerHTML = '<span class="text-green-200"><i class="fas fa-check-circle mr-1"></i> Founder added successfully!</span>';
            document.getElementById('founder-email').value = '';
            document.getElementById('founder-role').value = '';
            
            setTimeout(() => {
              messageEl.innerHTML = '';
              loadTeamData(); // Reload team data
            }, 2000);
          }
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Failed to add founder';
          messageEl.innerHTML = \`<span class="text-red-200"><i class="fas fa-times-circle mr-1"></i> \${errorMsg}</span>\`;
        }
      }

      window.removeFounder = async function(memberId, memberName) {
        if (!confirm(\`Are you sure you want to remove \${memberName} from the team?\`)) {
          return;
        }

        try {
          const response = await axios.delete(\`/api/team/remove-founder/\${memberId}\`);
          
          if (response.data.success) {
            loadTeamData(); // Reload team data
          }
        } catch (error) {
          alert('Error removing founder: ' + (error.response?.data?.error || 'Unknown error'));
        }
      }

      window.editTeamName = async function() {
        const newName = prompt('Enter new team name:', currentTeam.name);
        if (!newName || newName.trim() === '' || newName === currentTeam.name) {
          return;
        }

        try {
          const response = await axios.put('/api/team/update-name', { name: newName.trim() });
          
          if (response.data.success) {
            currentTeam.name = newName.trim();
            displayTeamInfo();
          }
        } catch (error) {
          alert('Error updating team name: ' + (error.response?.data?.error || 'Unknown error'));
        }
      }

      // Load team data on page load
      loadTeamData();
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'team',
    userName: user.name || user.email || 'User',
    userAvatar: user.avatar_url,
    pageTitle: 'Team Management',
    userRole: user.role || 'founder'
  });
}
