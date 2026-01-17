/**
 * Competitions Page
 * Displays startup competitions with registration and payment
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export interface CompetitionsPageProps {
  userName: string;
  userAvatar?: string;
  userRole: string;
}

export function getCompetitionsPage(props: CompetitionsPageProps): string {
  const { userName, userAvatar, userRole } = props;

  const content = `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <i class="fas fa-trophy text-yellow-500 mr-3"></i>
          🏅 Weekly Competitions
        </h1>
        <p class="text-gray-600">Join startup competitions and showcase your progress!</p>
      </div>

      <!-- Competition Guidelines Button -->
      <div class="mb-6">
        <button onclick="showGuidelines()" class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">
          <i class="fas fa-info-circle mr-2"></i>
          Competition Guidelines
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 mb-6">
        <button onclick="showCompetitionsTab('monthly')" id="monthly-tab" class="comp-tab px-6 py-3 text-sm font-semibold border-b-2 border-primary text-primary">
          Monthly Prize Competitions
        </button>
        <button onclick="showCompetitionsTab('weekly')" id="weekly-tab" class="comp-tab px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500">
          Weekly Competitions
        </button>
      </div>

      <!-- Monthly Competitions (default visible) -->
      <div id="monthly-competitions" class="competitions-content">
        <div id="monthly-grid" class="grid grid-cols-1 gap-6">
          <!-- Loading spinner -->
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>

      <!-- Weekly Competitions -->
      <div id="weekly-competitions" class="competitions-content hidden">
        <div id="weekly-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Loading spinner -->
          <div class="col-span-2 flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>

      <!-- Monthly Competitions -->
      <div id="monthly-competitions" class="competitions-content hidden">
        <div id="monthly-grid" class="grid grid-cols-1 gap-6">
          <!-- Loading spinner -->
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competition Detail Modal -->
    <div id="competition-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center p-4 z-50" onclick="closeCompetitionModal(event)">
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div id="competition-modal-content"></div>
      </div>
    </div>

    <!-- Guidelines Modal -->
    <div id="guidelines-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center p-4 z-50" onclick="closeGuidelines(event)">
      <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i class="fas fa-trophy text-5xl mr-4"></i>
              <div>
                <h2 class="text-3xl font-bold">Competition Guidelines</h2>
                <p class="text-yellow-100">How our competitions work</p>
              </div>
            </div>
            <button onclick="closeGuidelines()" class="text-white hover:text-yellow-200 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div class="p-8 space-y-6 text-gray-800">
          <p class="text-lg leading-relaxed">
            Welcome to ASTAR*'s weekly and monthly startup competitions! Here's how it works:
          </p>

          <div class="space-y-4">
            <div class="flex items-start">
              <div class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">1</div>
              <div>
                <h3 class="font-bold text-xl mb-2">Always Competing</h3>
                <p class="text-gray-700">As soon as you join the ASTAR* community, you're automatically part of our weekly progress competitions. You don't have to sign up each time—just focus on growing your startup and we highlight best performing teams through the Leaderboard and weekly update emails.</p>
              </div>
            </div>

            <div class="flex items-start">
              <div class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">2</div>
              <div>
                <h3 class="font-bold text-xl mb-2">Weekly Progress Highlights</h3>
                <p class="text-gray-700">Every Friday at 5 PM, we highlight the top three startups that have shown the most growth based on the metrics we track. We'll feature you on our platform, share your progress, and even offer interviews and promotions.</p>
              </div>
            </div>

            <div class="flex items-start">
              <div class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">3</div>
              <div>
                <h3 class="font-bold text-xl mb-2">Monthly Pitch Event</h3>
                <p class="text-gray-700">On the last Thursday of each month, we host a special live competition where you can pitch your startup. This event does require a ticket, and the winner takes home the prize pool from those ticket sales. It's a great chance to compete for bigger stakes and gain even more visibility.</p>
              </div>
            </div>

            <div class="flex items-start">
              <div class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">4</div>
              <div>
                <h3 class="font-bold text-xl mb-2">Why We Do It</h3>
                <p class="text-gray-700">We want to celebrate real progress. Instead of focusing only on pitches, we reward the hard work you put in week after week. And as you grow, you'll have the chance to shine in front of potential investors, sponsors, and the whole ASTAR* community.</p>
              </div>
            </div>

            <div class="flex items-start">
              <div class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">5</div>
              <div>
                <h3 class="font-bold text-xl mb-2">Optional Tools and Insights</h3>
                <p class="text-gray-700">While participation is free, we also offer premium analytics tools if you want deeper insights into your performance and how you stack up.</p>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mt-8">
            <p class="text-lg font-semibold text-primary mb-2">In short:</p>
            <p class="text-gray-700">just join the community, keep building, and let the competition highlight your growth. We believe in you, good luck! 🚀</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      let currentTab = 'monthly';
      let weeklyCompetitions = [];
      let monthlyCompetitions = [];

      // Load competitions on page load
      document.addEventListener('DOMContentLoaded', () => {
        loadCompetitions();
      });

      async function loadCompetitions() {
        try {
          // Load weekly competitions
          const weeklyRes = await axios.get('/api/competitions?type=weekly');
          weeklyCompetitions = weeklyRes.data.competitions;
          renderWeeklyCompetitions();

          // Load monthly competitions
          const monthlyRes = await axios.get('/api/competitions?type=monthly');
          monthlyCompetitions = monthlyRes.data.competitions;
          renderMonthlyCompetitions();
        } catch (error) {
          console.error('Error loading competitions:', error);
        }
      }

      function renderWeeklyCompetitions() {
        const grid = document.getElementById('weekly-grid');
        
        if (weeklyCompetitions.length === 0) {
          grid.innerHTML = '<div class="col-span-2 text-center py-12 text-gray-500">No active competitions</div>';
          return;
        }

        grid.innerHTML = weeklyCompetitions.map(comp => \`
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition">
            <div class="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3 flex items-center justify-between">
              <span class="bg-white text-green-700 text-xs font-bold px-3 py-1 rounded-full">LIVE</span>
              <span class="text-white text-sm font-medium">Prize: \${comp.prize_amount}</span>
            </div>
            
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 mb-3">\${comp.title}</h3>
              <p class="text-gray-700 mb-4 line-clamp-2">\${comp.description}</p>
              
              <div class="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span><i class="far fa-calendar mr-1"></i> Closes: \${comp.deadline || 'Sunday 11:59 PM'}</span>
                <span><i class="fas fa-users mr-1"></i> Auto-tracking progress</span>
              </div>
              
              <a href="/leaderboard" class="block w-full bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition text-center">
                <i class="fas fa-trophy mr-2"></i>View Top 3 Winners
              </a>
            </div>
          </div>
        \`).join('');
      }

      function renderMonthlyCompetitions() {
        const grid = document.getElementById('monthly-grid');
        
        if (monthlyCompetitions.length === 0) {
          grid.innerHTML = '<div class="text-center py-12 text-gray-500">No upcoming events</div>';
          return;
        }

        grid.innerHTML = monthlyCompetitions.map(comp => \`
          <div class="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl shadow-2xl overflow-hidden text-white">
            <div class="flex flex-col md:flex-row">
              <!-- Event Image -->
              <div class="md:w-1/3 relative">
                <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400" alt="Event" class="w-full h-full object-cover">
                <div class="absolute top-4 left-4">
                  <div class="bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
                    \${comp.event_date ? new Date(comp.event_date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase() : 'TBA'}
                  </div>
                </div>
              </div>

              <!-- Event Details -->
              <div class="md:w-2/3 p-8">
                <div class="flex items-center mb-4">
                  <div class="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full mr-3">\${comp.event_time || ''}</div>
                </div>
                
                <h2 class="text-3xl font-bold mb-4">\${comp.title}</h2>
                
                <p class="text-purple-200 mb-4">\${comp.description}</p>
                
                <div class="flex items-center space-x-4 text-sm mb-6">
                  <span><i class="fas fa-map-marker-alt mr-2"></i>\${comp.location || 'TBA'}</span>
                  <span><i class="fas fa-ticket-alt mr-2"></i>\${comp.ticket_price ? '$' + comp.ticket_price : 'Free'}</span>
                </div>

                <div class="flex items-center space-x-4">
                  <a href="\${comp.payment_link || '#'}" target="_blank" class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition">
                    <i class="fas fa-ticket-alt mr-2"></i>Get Ticket & Register
                  </a>
                  <span class="text-purple-200 text-sm">\${comp.paid_count || 0} attending</span>
                </div>
              </div>
            </div>
          </div>
        \`).join('');
      }

      async function showCompetitionDetail(competitionId) {
        try {
          const response = await axios.get(\`/api/competitions/\${competitionId}\`);
          const { competition, participants, winners } = response.data;

          // Check if user is already registered
          const token = getAuthToken();
          let isRegistered = false;
          let userRegistration = null;
          
          if (token) {
            try {
              const regCheck = await axios.get(\`/api/competitions/\${competitionId}/check-registration\`, {
                headers: { Authorization: \`Bearer \${token}\` }
              });
              isRegistered = regCheck.data.registered;
              userRegistration = regCheck.data.registration;
            } catch (e) {}
          }

          // Load user's projects and products for the dropdown
          let userProjects = [];
          let userProducts = [];
          if (token && !isRegistered) {
            try {
              // Get current user ID from token
              const tokenPayload = JSON.parse(atob(token.split('.')[1]));
              const currentUserId = tokenPayload.userId;
              
              console.log('[COMPETITIONS] Current user ID:', currentUserId);
              
              // Load projects
              const projectsRes = await axios.get('/api/projects', {
                headers: { Authorization: \`Bearer \${token}\` }
              });
              const allProjects = projectsRes.data.projects || [];
              console.log('[COMPETITIONS] All projects:', allProjects.length);
              
              // Filter projects by current user
              userProjects = allProjects.filter(p => {
                const match = p.user_id === currentUserId;
                if (!match) console.log('[COMPETITIONS] Project', p.title, 'user_id:', p.user_id, 'does not match');
                return match;
              });
              console.log('[COMPETITIONS] User projects:', userProjects.length);

              // Load beta products
              try {
                const productsRes = await axios.get('/api/marketplace/products?limit=100', {
                  headers: { Authorization: \`Bearer \${token}\` }
                });
                const allProducts = productsRes.data.products || [];
                console.log('[COMPETITIONS] All products:', allProducts.length);
                
                // Filter products by current user
                userProducts = allProducts.filter(p => {
                  const match = p.company_user_id === currentUserId;
                  if (!match) console.log('[COMPETITIONS] Product', p.title, 'company_user_id:', p.company_user_id, 'does not match');
                  return match;
                });
                console.log('[COMPETITIONS] User products:', userProducts.length);
              } catch (e) {
                console.error('Failed to load products:', e);
              }
            } catch (e) {
              console.error('Failed to load projects:', e);
            }
          }

          const modal = document.getElementById('competition-modal');
          const content = document.getElementById('competition-modal-content');

          content.innerHTML = \`
            <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-2xl font-bold mb-2">\${competition.title}</h2>
                  <div class="flex items-center space-x-4 text-sm">
                    <span><i class="fas fa-trophy mr-1"></i> \${competition.prize_amount}</span>
                    \${competition.event_date ? \`<span><i class="far fa-calendar mr-1"></i> \${new Date(competition.event_date).toLocaleDateString()}</span>\` : ''}
                    <span><i class="fas fa-users mr-1"></i> \${participants.length} registered</span>
                  </div>
                </div>
                <button onclick="closeCompetitionModal()" class="text-white hover:text-purple-200 text-2xl">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div class="p-6 space-y-6">
              <!-- Tabs: Details | Leaderboard -->
              <div class="flex border-b border-gray-200 mb-4">
                <button onclick="showCompDetailTab('details', \${competition.id})" id="details-tab-\${competition.id}" class="comp-detail-tab px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary">
                  <i class="fas fa-info-circle mr-1"></i> Details
                </button>
                <button onclick="showCompDetailTab('leaderboard', \${competition.id})" id="leaderboard-tab-\${competition.id}" class="comp-detail-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500">
                  <i class="fas fa-trophy mr-1"></i> Live Leaderboard
                </button>
              </div>

              <!-- Details Tab -->
              <div id="details-content-\${competition.id}" class="comp-detail-content">
                <!-- Description -->
                <div>
                  <h3 class="font-bold text-gray-900 mb-2">About</h3>
                  <p class="text-gray-700">\${competition.description}</p>
                </div>

                <!-- Guidelines -->
                \${competition.guidelines ? \`
                  <div class="bg-blue-50 rounded-lg p-4">
                    <h3 class="font-bold text-gray-900 mb-2 flex items-center">
                      <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                      Guidelines
                    </h3>
                    <p class="text-gray-700">\${competition.guidelines}</p>
                  </div>
                \` : ''}

                <!-- Registration Form -->
                \${isRegistered ? \`
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                      <div>
                        <p class="font-bold text-green-900">You're registered!</p>
                        \${userRegistration?.payment_status === 'pending' && competition.ticket_required ? \`
                          <p class="text-sm text-green-700 mt-1">Payment pending. Please complete your payment.</p>
                          <a href="\${competition.payment_link}" target="_blank" class="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                            Complete Payment
                          </a>
                        \` : ''}
                      </div>
                    </div>
                  </div>
                \` : \`
                  <form id="registration-form" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Select Your Project or Product *</label>
                      <select name="project_id" id="project-select" class="w-full border border-gray-300 rounded-lg px-4 py-2" required>
                        <option value="">-- Select a project/product or enter manually --</option>
                      </select>
                      <p class="text-xs text-gray-500 mt-1">Choose from your existing projects/products or leave blank to enter details manually</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Startup Name *</label>
                      <input type="text" name="startup_name" id="startup-name" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <p class="text-xs text-gray-500 mt-1">Will auto-fill if you select a project above</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Pitch Deck URL</label>
                      <input type="url" name="pitch_deck_url" placeholder="https://" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Submission Notes</label>
                      <textarea name="submission_notes" id="submission-notes" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Tell us about your submission..."></textarea>
                      <p class="text-xs text-gray-500 mt-1">Will auto-fill with project description if you select a project</p>
                    </div>

                    \${competition.ticket_required ? \`
                      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p class="text-sm text-yellow-900">
                          <i class="fas fa-ticket-alt mr-2"></i>
                          This competition requires a ticket (\$\${competition.ticket_price}). You'll be redirected to payment after registration.
                        </p>
                      </div>
                    \` : ''}

                    <button type="submit" class="w-full bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition">
                      <i class="fas fa-rocket mr-2"></i>Register Now
                    </button>
                  </form>
                \`}

                <!-- Winners -->
                \${winners.length > 0 ? \`
                  <div>
                    <h3 class="font-bold text-gray-900 mb-3 flex items-center">
                      <i class="fas fa-crown text-yellow-500 mr-2"></i>
                      Winners
                    </h3>
                    <div class="space-y-2">
                      \${winners.map(w => \`
                        <div class="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg">
                          <div class="flex items-center">
                            <span class="text-2xl mr-3">\${w.position === 1 ? '🥇' : w.position === 2 ? '🥈' : '🥉'}</span>
                            <div>
                              <p class="font-bold text-gray-900">\${w.name}</p>
                              <p class="text-sm text-gray-600">\${w.startup_name || ''}</p>
                            </div>
                          </div>
                          <span class="font-bold text-yellow-600">\${w.prize_amount}</span>
                        </div>
                    \`).join('')}
                  </div>
                </div>
              \` : ''}
              </div>

              <!-- Leaderboard Tab -->
              <div id="leaderboard-content-\${competition.id}" class="comp-detail-content hidden">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div class="flex items-start">
                    <i class="fas fa-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
                    <div class="text-sm text-blue-900">
                      <p class="font-semibold mb-1">How Ranking Works:</p>
                      <ul class="list-disc list-inside space-y-1">
                        <li><strong>Votes:</strong> Investors' votes count 2x, Validators' votes count 1x</li>
                        <li><strong>Growth:</strong> 10 points per completed goal + completion rate bonus</li>
                        <li><strong>Total Score:</strong> Combined vote score + growth score</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div id="leaderboard-list-\${competition.id}" class="space-y-3">
                  <!-- Leaderboard will load here -->
                  <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          \`;

          // Add form submit handler
          if (!isRegistered) {
            // Populate project/product dropdown
            const projectSelect = document.getElementById('project-select');
            console.log('[COMPETITIONS] Populating dropdown - Projects:', userProjects.length, 'Products:', userProducts.length);
            
            if (projectSelect) {
              // Add optgroup for projects
              if (userProjects.length > 0) {
                console.log('[COMPETITIONS] Adding projects to dropdown:', userProjects.map(p => p.title));
                const projectsGroup = document.createElement('optgroup');
                projectsGroup.label = '📁 My Projects';
                userProjects.forEach(project => {
                  const option = document.createElement('option');
                  option.value = 'project-' + project.id;
                  option.textContent = project.title;
                  option.dataset.type = 'project';
                  option.dataset.description = project.description || '';
                  projectsGroup.appendChild(option);
                });
                projectSelect.appendChild(projectsGroup);
              }

              // Add optgroup for products
              if (userProducts.length > 0) {
                console.log('[COMPETITIONS] Adding products to dropdown:', userProducts.map(p => p.title));
                const productsGroup = document.createElement('optgroup');
                productsGroup.label = '🚀 My Beta Products';
                userProducts.forEach(product => {
                  const option = document.createElement('option');
                  option.value = 'product-' + product.id;
                  option.textContent = product.title;
                  option.dataset.type = 'product';
                  option.dataset.description = product.description || '';
                  productsGroup.appendChild(option);
                });
                projectSelect.appendChild(productsGroup);
              }

              console.log('[COMPETITIONS] Dropdown populated. Total options:', projectSelect.options.length);

              // Auto-fill form when project/product selected
              projectSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption && selectedOption.value) {
                  document.getElementById('startup-name').value = selectedOption.textContent;
                  document.getElementById('submission-notes').value = selectedOption.dataset.description || '';
                } else {
                  document.getElementById('startup-name').value = '';
                  document.getElementById('submission-notes').value = '';
                }
              });
            }

            document.getElementById('registration-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              await handleRegistration(competitionId);
            });
          }

          modal.classList.remove('hidden');
          modal.classList.add('flex');

          // Load leaderboard data
          loadCompetitionLeaderboard(competitionId);
        } catch (error) {
          console.error('Error loading competition details:', error);
          alert('Failed to load competition details');
        }
      }

      async function loadCompetitionLeaderboard(competitionId) {
        try {
          const response = await axios.get(\`/api/competitions/\${competitionId}/leaderboard-data\`);
          const participants = response.data.participants || [];

          const leaderboardList = document.getElementById(\`leaderboard-list-\${competitionId}\`);
          if (!leaderboardList) return;

          if (participants.length === 0) {
            leaderboardList.innerHTML = \`
              <div class="text-center py-8 text-gray-500">
                <i class="fas fa-users text-4xl mb-2 opacity-50"></i>
                <p>No participants yet. Be the first to join!</p>
              </div>
            \`;
            return;
          }

          leaderboardList.innerHTML = participants.map((p, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            const bgGradient = rank === 1 ? 'from-yellow-50 to-yellow-100 border-yellow-300' :
                              rank === 2 ? 'from-gray-50 to-gray-100 border-gray-300' :
                              rank === 3 ? 'from-orange-50 to-orange-100 border-orange-300' :
                              'from-white to-gray-50 border-gray-200';

            const userRole = '${userRole}';
            const canVote = userRole === 'validator' || userRole === 'investor';

            return \`
              <div class="bg-gradient-to-r \${bgGradient} border-2 rounded-xl p-4 hover:shadow-md transition">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-4 flex-1">
                    <!-- Rank -->
                    <div class="flex flex-col items-center">
                      <div class="text-3xl font-bold text-gray-800">
                        \${medal || '#' + rank}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">Rank</div>
                    </div>

                    <!-- Avatar and Info -->
                    <div class="flex-1">
                      <div class="flex items-center mb-2">
                        <img src="\${p.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.name}" 
                             alt="\${p.name}" 
                             class="w-10 h-10 rounded-full border-2 border-white shadow mr-3">
                        <div>
                          <h4 class="font-bold text-gray-900">\${p.name}</h4>
                          <p class="text-sm text-gray-600">\${p.project_title || p.startup_name || 'No project'}</p>
                        </div>
                      </div>

                      \${p.project_description ? \`
                        <p class="text-sm text-gray-700 mb-2">\${p.project_description.substring(0, 120)}...</p>
                      \` : ''}

                      <div class="flex items-center space-x-4 text-xs text-gray-600">
                        <span><i class="fas fa-calendar-check mr-1"></i>\${new Date(p.registration_date).toLocaleDateString()}</span>
                        <span><i class="fas fa-thumbs-up mr-1"></i>\${p.vote_count || 0} votes</span>
                        \${p.pitch_deck_url ? \`<a href="\${p.pitch_deck_url}" target="_blank" class="text-blue-600 hover:underline"><i class="fas fa-file-pdf mr-1"></i>Pitch Deck</a>\` : ''}
                      </div>
                    </div>

                    <!-- Scores -->
                    <div class="text-right">
                      <div class="bg-white rounded-lg p-3 shadow-sm mb-2">
                        <div class="text-2xl font-bold text-primary">\${p.total_score?.toFixed(1) || '0.0'}</div>
                        <div class="text-xs text-gray-500">Total Score</div>
                      </div>
                      <div class="text-xs space-y-1">
                        <div class="flex justify-between">
                          <span class="text-gray-600">Votes:</span>
                          <span class="font-semibold text-blue-600">\${p.vote_score?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Growth:</span>
                          <span class="font-semibold text-green-600">\${p.growth_score?.toFixed(1) || '0.0'}</span>
                        </div>
                        \${p.avg_vote_score ? \`
                          <div class="flex justify-between">
                            <span class="text-gray-600">Avg Rating:</span>
                            <span class="font-semibold text-purple-600">\${p.avg_vote_score.toFixed(1)}/10</span>
                          </div>
                        \` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vote Button (for validators and investors) -->
                \${canVote ? \`
                  <div class="mt-3 pt-3 border-t border-gray-200">
                    <button 
                      onclick="showVoteModal(\${competitionId}, \${p.id}, '\${p.name}', '\${p.project_title || p.startup_name}')"
                      class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
                      <i class="fas fa-star mr-2"></i>Vote for this startup
                    </button>
                  </div>
                \` : ''}
              </div>
            \`;
          }).join('');
        } catch (error) {
          console.error('Error loading leaderboard:', error);
          const leaderboardList = document.getElementById(\`leaderboard-list-\${competitionId}\`);
          if (leaderboardList) {
            leaderboardList.innerHTML = \`
              <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-4xl mb-2"></i>
                <p>Failed to load leaderboard</p>
              </div>
            \`;
          }
        }
      }

      function showCompDetailTab(tab, competitionId) {
        // Update tab styles
        document.querySelectorAll('.comp-detail-tab').forEach(t => {
          t.classList.remove('text-primary', 'border-primary');
          t.classList.add('text-gray-500', 'border-transparent');
        });
        const activeTab = document.getElementById(\`\${tab}-tab-\${competitionId}\`);
        if (activeTab) {
          activeTab.classList.remove('text-gray-500', 'border-transparent');
          activeTab.classList.add('text-primary', 'border-primary');
        }
        
        // Show/hide content
        document.querySelectorAll(\`.comp-detail-content\`).forEach(c => c.classList.add('hidden'));
        const activeContent = document.getElementById(\`\${tab}-content-\${competitionId}\`);
        if (activeContent) {
          activeContent.classList.remove('hidden');
        }

        // Load leaderboard data when tab is shown
        if (tab === 'leaderboard') {
          loadCompetitionLeaderboard(competitionId);
        }
      }

      async function showVoteModal(competitionId, participantId, participantName, projectTitle) {
        const score = prompt(\`Vote for \${participantName} (\${projectTitle})\\n\\nEnter your score (1-10):\`);
        if (!score) return;

        const voteScore = parseInt(score);
        if (isNaN(voteScore) || voteScore < 1 || voteScore > 10) {
          alert('Please enter a valid score between 1 and 10');
          return;
        }

        const comment = prompt(\`Optional: Add a comment about your vote:\`) || '';

        try {
          const token = getAuthToken();
          if (!token) {
            alert('Please log in to vote');
            return;
          }

          await axios.post(
            \`/api/competitions/\${competitionId}/participants/\${participantId}/vote\`,
            { vote_score: voteScore, comment },
            { headers: { Authorization: \`Bearer \${token}\` } }
          );

          alert('Vote submitted successfully!');
          
          // Reload leaderboard
          loadCompetitionLeaderboard(competitionId);
        } catch (error) {
          console.error('Error submitting vote:', error);
          alert(error.response?.data?.error || 'Failed to submit vote');
        }
      }

      async function handleRegistration(competitionId) {
        try {
          const form = document.getElementById('registration-form');
          const formData = new FormData(form);
          
          // Parse project_id which could be "project-123" or "product-456" or null
          let projectId = null;
          const selectedValue = formData.get('project_id');
          if (selectedValue && selectedValue.startsWith('project-')) {
            projectId = parseInt(selectedValue.replace('project-', ''));
          } else if (selectedValue && selectedValue.startsWith('product-')) {
            // For products, we might need to handle differently or just use the ID
            projectId = parseInt(selectedValue.replace('product-', ''));
          }
          
          const data = {
            project_id: projectId,
            startup_name: formData.get('startup_name'),
            pitch_deck_url: formData.get('pitch_deck_url'),
            submission_notes: formData.get('submission_notes')
          };

          const token = getAuthToken();
          if (!token) {
            alert('Please log in to register');
            window.location.href = '/';
            return;
          }

          const response = await axios.post(\`/api/competitions/\${competitionId}/register\`, data, {
            headers: { Authorization: \`Bearer \${token}\` }
          });

          if (response.data.success) {
            // Always redirect to Four Revenues payment link if available
            if (response.data.payment_link) {
              alert('Registration successful! Redirecting to payment...');
              window.location.href = response.data.payment_link;
            } else {
              alert('Successfully registered for the competition!');
              closeCompetitionModal();
              loadCompetitions();
            }
          }
        } catch (error) {
          console.error('Error registering:', error);
          alert(error.response?.data?.error || 'Failed to register for competition');
        }
      }

      function closeCompetitionModal(event) {
        if (event && event.target !== event.currentTarget) return;
        const modal = document.getElementById('competition-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      function showCompetitionsTab(tab) {
        currentTab = tab;
        
        // Update tab styles
        document.querySelectorAll('.comp-tab').forEach(t => {
          t.classList.remove('text-primary', 'border-primary');
          t.classList.add('text-gray-500', 'border-transparent');
        });
        document.getElementById(tab + '-tab').classList.remove('text-gray-500', 'border-transparent');
        document.getElementById(tab + '-tab').classList.add('text-primary', 'border-primary');
        
        // Show/hide content
        document.querySelectorAll('.competitions-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(tab + '-competitions').classList.remove('hidden');
      }

      function showGuidelines() {
        document.getElementById('guidelines-modal').classList.remove('hidden');
        document.getElementById('guidelines-modal').classList.add('flex');
      }

      function closeGuidelines(event) {
        if (event && event.target !== event.currentTarget) return;
        document.getElementById('guidelines-modal').classList.add('hidden');
        document.getElementById('guidelines-modal').classList.remove('flex');
      }

      function getAuthToken() {
        return localStorage.getItem('authToken');
      }
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'competitions',
    userName,
    userAvatar,
    pageTitle: 'Competitions',
    userRole
  });
}
