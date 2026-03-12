/**
 * ASTAR* Pitch Deck - Weekly Check-in Page
 * Matches the leaderboard page aesthetic from astarlabshub
 * Uses the shared layout with sidebar navigation
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export function getPitchDeckPage(opts: {
  userName: string;
  userAvatar?: string;
  userRole?: string;
  isGuest?: boolean;
}): string {
  const { userName, userAvatar, userRole, isGuest } = opts;
  const isLoggedIn = !isGuest;

  const content = `
    <style>
      .score-ring { 
        width: 100px; height: 100px; border-radius: 50%;
        background: conic-gradient(from 0deg, #9333ea var(--score-pct, 0%), #e5e7eb var(--score-pct, 0%));
        display: flex; align-items: center; justify-content: center;
      }
      .score-ring-inner { width: 82px; height: 82px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; flex-direction: column; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      .fade-up { animation: fadeUp 0.5s ease-out forwards; }
      .fade-up-delay-1 { animation-delay: 0.1s; opacity: 0; }
      .fade-up-delay-2 { animation-delay: 0.2s; opacity: 0; }
      .fade-up-delay-3 { animation-delay: 0.3s; opacity: 0; }
    </style>

    <div class="p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          ASTAR LABS BETA
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <i class="fas fa-microphone-alt text-purple-500 mr-3"></i>
          🎯 Weekly Pitch Deck
        </h1>
        <p class="text-gray-600">Have a natural conversation with AI about your week · 4 topics · Real-time insights</p>
      </div>

      <!-- Main Content Area -->
      <div id="main-content">

        <!-- Hero Card -->
        <div id="hero-section" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 fade-up">
          <div class="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold">🎯 Start Your Weekly Check-in</h2>
                <p class="text-purple-200 text-sm">Answer 18 questions across 5 categories</p>
              </div>
              <div class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                ~10 min
              </div>
            </div>
          </div>
          <div class="p-6 text-center">

            <!-- Section Preview -->
            <div class="flex flex-wrap justify-center gap-2 mb-6 fade-up fade-up-delay-1">
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">👤 Who are you</span>
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✨ Highlights</span>
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">⚠️ Lowlights</span>
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">🤝 What you need</span>
            </div>

            <!-- Language Toggle -->
            <div class="flex justify-center gap-2 mb-6 fade-up fade-up-delay-2">
              <button id="lang-en" onclick="setVoiceLanguage('en-US')" class="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm shadow-sm">🇬🇧 English</button>
              <button id="lang-es" onclick="setVoiceLanguage('es-ES')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium">🇪🇸 Español</button>
            </div>

            <!-- Start Button -->
            <button id="start-btn" onclick="${isLoggedIn ? 'startCheckin()' : 'showAuthModal()'}" class="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
              ${isLoggedIn ? '� Start Conversation →' : '🔐 Log in to Start'}
            </button>

            <p class="text-gray-400 text-xs mt-4">${isLoggedIn ? 'Natural AI conversation · Voice supported · ~5 minutes' : 'Sign in with Google to start your weekly check-in'}</p>
          </div>
        </div>

        <!-- My Evolution (logged in users) -->
        ${isLoggedIn ? `
        <div id="evolution-section" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 fade-up fade-up-delay-2">
          <div class="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <h2 class="text-lg font-bold">📈 Your Evolution</h2>
            <p class="text-green-200 text-sm">Track your weekly progress</p>
          </div>
          <div class="p-6">
            <div id="evolution-content">
              <div class="text-center py-4 text-gray-400 text-sm">
                <div class="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading your progress...
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Startup Leaderboard (Table like leaderboard page) -->
        <div id="leaderboard-section" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden fade-up fade-up-delay-3">
          <div class="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold">🏆 Startup Rankings</h2>
              <p class="text-purple-200 text-sm">See how founders rank this week</p>
            </div>
            <div id="leaderboard-week" class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Execution</th>
                </tr>
              </thead>
              <tbody id="leaderboard-tbody" class="divide-y divide-gray-200">
              </tbody>
            </table>
          </div>

          <div id="leaderboard-empty" class="hidden p-12 text-center">
            <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">No rankings yet</h3>
            <p class="text-gray-500">Be the first to complete a pitch deck!</p>
          </div>

          ${isLoggedIn ? '<div id="my-rank" class="px-6 py-4 border-t border-gray-200 bg-purple-50 hidden"></div>' : ''}
        </div>
      </div>

      <!-- Pitch Deck Conversation Flow (hidden initially) -->
      <div id="pitch-flow" class="hidden">
        
        <!-- Progress Header -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <span id="topic-label" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">💬 Weekly Check-in</span>
            <span class="text-sm text-gray-500 font-semibold">Topic <span id="topic-num">1</span>/4</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div id="progress-bar" class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full h-2.5 transition-all duration-500" style="width:0%"></div>
          </div>
        </div>

        <!-- Chat Messages Container -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5 max-h-[500px] overflow-y-auto" id="chat-container">
          <div id="chat-messages" class="space-y-4">
            <!-- Messages will be appended here -->
          </div>
        </div>

        <!-- Input Area -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
          <div id="voice-status" class="flex items-center justify-center gap-3 mb-3 min-h-[30px]"></div>
          <textarea id="answer-input" placeholder="Type your response or use voice..." 
            class="w-full rounded-xl px-5 py-4 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none text-lg leading-relaxed" 
            rows="3"></textarea>
          
          <!-- Action Buttons -->
          <div class="flex gap-3 mt-3">
            <button onclick="sendMessage()" class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all text-base">
              Send →
            </button>
            <button onclick="toggleVoice()" id="voice-btn" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-base font-medium">
              🎤 Voice
            </button>
          </div>
        </div>
      </div>

      <!-- Analysis Loading (hidden) -->
      <div id="analysis-loading" class="hidden text-center py-12">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div class="text-6xl mb-4 animate-pulse">🤖</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Analyzing with 6 AI Agents...</h3>
          <p class="text-gray-400 text-sm mb-6">This takes about 15 seconds</p>
          <div class="flex flex-wrap justify-center gap-2 mb-6">
            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">👤 Intro</span>
            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 animate-pulse" style="animation-delay:0.2s">✨ Highlights</span>
            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse" style="animation-delay:0.4s">⚠️ Lowlights</span>
            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse" style="animation-delay:0.6s">🤝 Needs</span>
          </div>
        </div>
      </div>

      <!-- Results (hidden) -->
      <div id="results-section" class="hidden"></div>
    </div>

    <!-- Auth Modal -->
    <div id="auth-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full relative overflow-hidden">
        <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition text-xl">&times;</button>
        <div class="p-8 text-center">
          <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span class="text-white text-2xl font-black">A*</span>
          </div>
          <h2 class="text-2xl font-black text-gray-900 mb-2">Join the ASTAR* ecosystem</h2>
          <p class="text-gray-500 text-sm mb-8">Choose your role to get started 🚀</p>
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button onclick="loginWithGoogle('founder')" class="group rounded-xl p-5 transition-all hover:scale-105 cursor-pointer border border-gray-200 hover:border-purple-500 hover:shadow-md bg-purple-50">
              <div class="text-3xl mb-2">🚀</div>
              <div class="text-sm font-bold text-gray-900">Founder</div>
              <div class="text-xs text-gray-500">Building the next big thing</div>
            </button>
            <button onclick="loginWithGoogle('investor')" class="group rounded-xl p-5 transition-all hover:scale-105 cursor-pointer border border-gray-200 hover:border-cyan-500 hover:shadow-md bg-cyan-50">
              <div class="text-3xl mb-2">💎</div>
              <div class="text-sm font-bold text-gray-900">Investor</div>
              <div class="text-xs text-gray-500">Fueling stellar growth</div>
            </button>
            <button onclick="loginWithGoogle('scout')" class="group rounded-xl p-5 transition-all hover:scale-105 cursor-pointer border border-gray-200 hover:border-violet-500 hover:shadow-md bg-violet-50">
              <div class="text-3xl mb-2">🔭</div>
              <div class="text-sm font-bold text-gray-900">Scout</div>
              <div class="text-xs text-gray-500">Finding hidden gems</div>
            </button>
            <button onclick="loginWithGoogle('job_seeker')" class="group rounded-xl p-5 transition-all hover:scale-105 cursor-pointer border border-gray-200 hover:border-amber-500 hover:shadow-md bg-amber-50">
              <div class="text-3xl mb-2">💼</div>
              <div class="text-sm font-bold text-gray-900">Job Seeker</div>
              <div class="text-xs text-gray-500">Join a startup team</div>
            </button>
          </div>
          <div class="flex items-center gap-3 mb-5">
            <div class="flex-1 h-px bg-gray-200"></div>
            <span class="text-xs text-gray-400">Powered by Google</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>
          <p class="text-gray-400 text-xs">By signing in you agree to ASTAR* Terms of Service</p>
        </div>
      </div>
    </div>

    <script>
      // ============================================
      // AUTH
      // ============================================
      var IS_LOGGED_IN = ${isLoggedIn};
      var userName = '${userName}';

      window.showAuthModal = function() {
        document.getElementById('auth-modal').classList.remove('hidden');
      };

      window.closeAuthModal = function() {
        document.getElementById('auth-modal').classList.add('hidden');
      };

      window.loginWithGoogle = function(role) {
        window.location.href = '/api/auth/google?role=' + role + '&redirect=/pitch';
      };

      window.setVoiceLanguage = function(lang) {
        currentLang = lang;
        CONVERSATION = lang === 'es-ES' ? CONVERSATION_STRUCTURE_ES : CONVERSATION_STRUCTURE_EN;
        document.getElementById('lang-en').className = lang === 'en-US'
          ? 'px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm shadow-sm'
          : 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium';
        document.getElementById('lang-es').className = lang === 'es-ES'
          ? 'px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm shadow-sm'
          : 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium';
      };

      window.startCheckin = async function() {
        try {
          var token = document.cookie.match(/authToken=([^;]+)/);
          token = token ? token[1] : null;
          if (token) {
            var res = await fetch('/api/users/profile', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              var profile = await res.json();
              if (!profile.startup_name || profile.startup_name.trim() === '') {
                if (confirm('Please set up your startup profile first.\\n\\nYou will be redirected to the dashboard to complete your information.')) {
                  window.location.href = '/dashboard';
                  return;
                }
                return;
              }
            }
          }
        } catch (e) {
          console.log('Profile check error:', e);
        }

        currentTopic = 0;
        conversationHistory = [];
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('pitch-flow').classList.remove('hidden');
        startConversation();
      };

      var authModal = document.getElementById('auth-modal');
      if (authModal) {
        authModal.addEventListener('click', function(e) {
          if (e.target === authModal) closeAuthModal();
        });
      }

      // ============================================
      // STATE
      // ============================================
      var currentTopic = 0;
      var conversationHistory = [];
      var isListening = false;
      var isSpeaking = false;
      var recognition = null;
      var currentLang = 'en-US';
      var analysis = null;
      var aiTyping = false;

      // Conversational AI structure - 4 core topics (MÁS DIRECTOS Y CONCISOS)
      var CONVERSATION_STRUCTURE_EN = {
        greeting: "Hey! Quick 2-minute check-in on your week. Ready?",
        topics: [
          { 
            id: 'intro', 
            initial: "What's your startup called and what problem do you solve in one sentence?"
          },
          { 
            id: 'highlights', 
            initial: "What was your biggest win this week? Give me a number (users, revenue, conversions, etc)."
          },
          { 
            id: 'lowlights', 
            initial: "What's your biggest blocker right now?"
          },
          { 
            id: 'needs', 
            initial: "What ONE thing do you need to unlock your next milestone? (intro, resource, advice)"
          }
        ],
        closing: "Perfect! Analyzing your week..."
      };

      var CONVERSATION_STRUCTURE_ES = {
        greeting: "¡Hola! Check-in rápido de 2 minutos. ¿Listo?",
        topics: [
          { 
            id: 'intro', 
            initial: "¿Cómo se llama tu startup y qué problema resuelves en una frase?"
          },
          { 
            id: 'highlights', 
            initial: "¿Cuál fue tu mayor logro esta semana? Dame un número (usuarios, revenue, conversiones, etc)."
          },
          { 
            id: 'lowlights', 
            initial: "¿Cuál es tu mayor bloqueo ahora mismo?"
          },
          { 
            id: 'needs', 
            initial: "¿Qué UNA cosa necesitas para desbloquear tu siguiente hito? (intro, recurso, consejo)"
          }
        ],
        closing: "¡Perfecto! Analizando tu semana..."
      };

      var CONVERSATION = CONVERSATION_STRUCTURE_EN;

      // ============================================
      // LEADERBOARD (Table format matching leaderboard page)
      // ============================================
      async function loadLeaderboard() {
        try {
          var tokenMatch = document.cookie.match(/authToken=([^;]+)/);
          var token = tokenMatch ? tokenMatch[1] : null;
          var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
          var res = await fetch('/api/projects/leaderboard/top?limit=50', { headers: headers });
          
          if (!res.ok) throw new Error('Failed');
          var data = await res.json();
          
          var rankings = data.leaderboard || [];
          
          if (rankings.length === 0) {
            document.getElementById('leaderboard-loading').classList.add('hidden');
            document.getElementById('leaderboard-empty').classList.remove('hidden');
            return;
          }

          var tbody = document.getElementById('leaderboard-tbody');
          tbody.innerHTML = rankings.map(function(r, i) {
            var rank = i + 1;
            var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
            var startupName = r.title || 'Unnamed Startup';
            var founderName = r.creator_name || 'Anonymous';
            var score = r.leaderboard_score || 0;
            var vcScore = r.vc_score || 'C';
            var completedGoals = r.completed_goals || 0;
            var totalGoals = r.total_goals || 0;
            var goalsPercent = totalGoals > 0 ? (completedGoals / totalGoals * 100) : 0;
            var category = formatCategory(r.category || 'Other');

            var tractionData = r.tractionData || {};
            var userGrowthWoW = tractionData.userWoWGrowth || (r.growth_wow ? r.growth_wow.users : 0) || 0;
            var revenueGrowthWoW = tractionData.revenueWoWGrowth || (r.growth_wow ? r.growth_wow.revenue : 0) || 0;
            var avgGrowth = (userGrowthWoW + revenueGrowthWoW) / 2;
            var growthColor = avgGrowth > 10 ? 'text-green-600' : avgGrowth > 0 ? 'text-blue-600' : avgGrowth < 0 ? 'text-red-600' : 'text-gray-500';
            var growthIcon = avgGrowth > 0 ? '↑' : avgGrowth < 0 ? '↓' : '→';

            var vcColors = { 'A+':'bg-green-500 text-white', 'A':'bg-green-400 text-white', 'B+':'bg-blue-500 text-white', 'B':'bg-blue-400 text-white', 'C+':'bg-yellow-500 text-white', 'C':'bg-yellow-400 text-gray-800', 'D':'bg-red-400 text-white' };
            var vcColor = vcColors[vcScore] || 'bg-gray-400 text-white';

            return '<tr class="hover:bg-gray-50 transition cursor-pointer" onclick="window.location.href=\\'/vote/' + r.id + '\\'">' +
              '<td class="px-4 py-4"><span class="text-2xl font-bold">' + medal + '</span></td>' +
              '<td class="px-4 py-4"><div><div class="font-bold text-gray-900">' + startupName + '</div><div class="text-sm text-gray-500">' + category + '</div><div class="text-xs text-gray-400">by ' + founderName + '</div></div></td>' +
              '<td class="px-4 py-4 text-center"><div class="flex flex-col items-center"><span class="px-2 py-1 rounded text-xs font-bold ' + vcColor + '">' + vcScore + '</span><span class="text-lg font-black text-purple-600 mt-1">' + score.toFixed(1) + '</span></div></td>' +
              '<td class="px-4 py-4 text-center"><div class="flex flex-col items-center"><span class="' + growthColor + ' font-bold">' + growthIcon + ' ' + Math.abs(avgGrowth).toFixed(1) + '%</span><span class="text-xs text-gray-400">WoW</span></div></td>' +
              '<td class="px-4 py-4 text-center"><div class="flex items-center justify-center"><span class="text-yellow-500 mr-1">★</span><span class="font-semibold">' + (r.rating_average || 0).toFixed(1) + '</span><span class="text-gray-400 text-sm ml-1">(' + (r.votes_count || 0) + ')</span></div></td>' +
              '<td class="px-4 py-4 text-center"><span class="font-semibold text-purple-600">' + formatNumber(tractionData.avgActive4w || r.current_users || 0) + '</span></td>' +
              '<td class="px-4 py-4 text-center"><span class="font-semibold text-green-600">€' + formatNumber(tractionData.revenue4w || r.current_revenue || 0) + '</span></td>' +
              '<td class="px-4 py-4 text-center"><div class="flex flex-col items-center"><div class="w-16 bg-gray-200 rounded-full h-2 mb-1"><div class="bg-purple-600 h-2 rounded-full" style="width:' + goalsPercent + '%"></div></div><span class="text-xs text-gray-500">' + completedGoals + '/' + totalGoals + '</span></div></td>' +
            '</tr>';
          }).join('');

          document.getElementById('leaderboard-loading').classList.add('hidden');
          document.getElementById('leaderboard-content').classList.remove('hidden');

          loadPersonalEvolution();

        } catch(e) {
          console.log('Leaderboard error:', e);
          document.getElementById('leaderboard-loading').classList.add('hidden');
          document.getElementById('leaderboard-empty').classList.remove('hidden');
        }
      }

      function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
      }

      function formatCategory(category) {
        if (!category) return 'Other';
        return category.replace(/-/g, ' ').split(' ').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
      }

      async function loadPersonalEvolution() {
        var evolutionEl = document.getElementById('evolution-content');
        if (!evolutionEl) return;

        try {
          var tokenMatch = document.cookie.match(/authToken=([^;]+)/);
          var token = tokenMatch ? tokenMatch[1] : null;
          if (!token) {
            evolutionEl.innerHTML = '<div class="text-center py-6"><div class="text-3xl mb-2">🔒</div><p class="text-gray-500 text-sm">Log in to track your weekly progress</p></div>';
            return;
          }

          var headers = { 'Authorization': 'Bearer ' + token };
          var res = await fetch('/api/astar-messages/ranking/all-time', { headers: headers });
          
          if (!res.ok) throw new Error('Failed');
          var data = await res.json();
          
          var evolution = data.my_evolution || [];
          
          if (evolution.length === 0) {
            evolutionEl.innerHTML = '<div class="text-center py-6"><div class="text-3xl mb-2">🌱</div><p class="text-gray-500 text-sm">Complete your first pitch deck to start tracking progress</p></div>';
            return;
          }

          var sorted = evolution.slice().reverse();
          var scores = sorted.map(function(w) { return w.iteration_score || 0; });
          var maxS = Math.max.apply(null, scores.concat([1]));
          var latest = sorted[sorted.length - 1];
          var prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
          var diff = prev ? (latest.iteration_score || 0) - (prev.iteration_score || 0) : 0;
          var diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500';
          var diffArrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';

          var html = '<div class="grid grid-cols-3 gap-4 mb-6">';
          html += '<div class="text-center bg-purple-50 rounded-xl p-4 border border-purple-200"><div class="text-3xl font-black text-purple-600">' + (latest.iteration_score || 0) + '</div><div class="text-xs text-gray-500 font-semibold mt-1">Score</div></div>';
          html += '<div class="text-center bg-gray-50 rounded-xl p-4 border border-gray-200"><div class="text-3xl font-black ' + diffColor + '">' + diffArrow + ' ' + Math.abs(diff) + '</div><div class="text-xs text-gray-500 font-semibold mt-1">vs Last Week</div></div>';
          html += '<div class="text-center bg-indigo-50 rounded-xl p-4 border border-indigo-200"><div class="text-3xl font-black text-indigo-600">#' + (latest.rank || '?') + '</div><div class="text-xs text-gray-500 font-semibold mt-1">Rank</div></div>';
          html += '</div>';

          // Bar chart
          html += '<div class="flex items-end gap-2 bg-gray-50 rounded-xl p-4 border border-gray-200" style="height:140px;">';
          sorted.forEach(function(w, i) {
            var score = w.iteration_score || 0;
            var h = Math.max(8, (score / maxS) * 90);
            var isLast = i === sorted.length - 1;
            var barColor = isLast ? 'from-purple-500 to-indigo-500' : 'from-gray-300 to-gray-400';
            html += '<div class="flex-1 flex flex-col items-center gap-1">' +
              '<span class="text-xs font-bold ' + (isLast ? 'text-purple-600' : 'text-gray-400') + '">' + score + '</span>' +
              '<div class="w-full bg-gradient-to-t ' + barColor + ' rounded-t-lg transition-all" style="height:' + h + 'px;' + (isLast ? 'box-shadow:0 2px 8px rgba(147,51,234,0.3);' : '') + '"></div>' +
              '<span class="text-xs text-gray-400">W' + w.week_number + '</span>' +
            '</div>';
          });
          html += '</div>';

          // Streak
          var weeksActive = sorted.length;
          html += '<div class="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">';
          html += '<div class="text-xs text-gray-500 font-semibold">🔥 ' + weeksActive + ' week' + (weeksActive !== 1 ? 's' : '') + ' active</div>';
          if (diff > 0) html += '<div class="text-xs text-green-600 font-semibold">📈 Improving!</div>';
          else if (diff < 0) html += '<div class="text-xs text-orange-600 font-semibold">💪 Keep pushing!</div>';
          else html += '<div class="text-xs text-gray-500">→ Steady</div>';
          html += '</div>';

          evolutionEl.innerHTML = html;

        } catch(e) {
          console.log('Evolution error:', e);
          evolutionEl.innerHTML = '<div class="text-center py-6"><div class="text-3xl mb-2">🌱</div><p class="text-gray-500 text-sm">Complete your first pitch deck to start tracking progress</p></div>';
        }
      }

      // ============================================
      // CONVERSATIONAL FLOW
      // ============================================
      async function startConversation() {
        var container = document.getElementById('chat-messages');
        container.innerHTML = '';
        await addAIMessage(CONVERSATION.greeting);
        await addAIMessage(CONVERSATION.topics[0].initial);
      }

      async function addAIMessage(text) {
        var container = document.getElementById('chat-messages');
        var msgDiv = document.createElement('div');
        msgDiv.className = 'flex gap-3 items-start fade-up';
        msgDiv.innerHTML = '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">A*</div>' +
          '<div class="flex-1 bg-purple-50 rounded-2xl rounded-tl-none p-4 border border-purple-100">' +
            '<p class="text-gray-800 leading-relaxed">' + text + '</p>' +
          '</div>';
        container.appendChild(msgDiv);
        scrollToBottom();
        await speak(text);
      }

      function addUserMessage(text) {
        var container = document.getElementById('chat-messages');
        var msgDiv = document.createElement('div');
        msgDiv.className = 'flex gap-3 items-start justify-end fade-up';
        msgDiv.innerHTML = '<div class="flex-1 bg-gray-100 rounded-2xl rounded-tr-none p-4 border border-gray-200">' +
            '<p class="text-gray-800 leading-relaxed">' + text + '</p>' +
          '</div>' +
          '<div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold flex-shrink-0">' + userName.charAt(0).toUpperCase() + '</div>';
        container.appendChild(msgDiv);
        scrollToBottom();
      }

      function scrollToBottom() {
        var container = document.getElementById('chat-container');
        container.scrollTop = container.scrollHeight;
      }

      async function sendMessage() {
        var input = document.getElementById('answer-input');
        var message = input.value.trim();
        if (!message || aiTyping) return;

        addUserMessage(message);
        input.value = '';
        stopListening();

        conversationHistory.push({
          role: 'user',
          content: message,
          topic: CONVERSATION.topics[currentTopic].id
        });

        await getAIResponse(message);
      }

      async function getAIResponse(userMessage) {
        if (!IS_LOGGED_IN) {
          addAIMessage('Please log in to continue the conversation.');
          return;
        }

        aiTyping = true;
        showTypingIndicator();

        try {
          var tokenMatch = document.cookie.match(/authToken=([^;]+)/);
          var token = tokenMatch ? tokenMatch[1] : null;
          if (!token) throw new Error('Not authenticated');

          var context = {
            currentTopic: CONVERSATION.topics[currentTopic],
            conversationHistory: conversationHistory,
            language: currentLang
          };

          var res = await fetch('/api/chat-agent/conversation-pitch', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ 
              message: userMessage,
              context: context
            })
          });

          hideTypingIndicator();

          if (!res.ok) throw new Error('AI response failed');
          var data = await res.json();
          
          var aiResponse = data.response || 'I understand. Tell me more.';
          addAIMessage(aiResponse);

          if (data.shouldMoveTopic || conversationHistory.filter(function(h) { return h.topic === CONVERSATION.topics[currentTopic].id; }).length >= 3) {
            moveToNextTopic();
          }

        } catch(e) {
          console.error('AI error:', e);
          hideTypingIndicator();
          var fallbackResponse = getFallbackResponse();
          addAIMessage(fallbackResponse);
          
          if (conversationHistory.filter(function(h) { return h.topic === CONVERSATION.topics[currentTopic].id; }).length >= 2) {
            moveToNextTopic();
          }
        } finally {
          aiTyping = false;
        }
      }

      function getFallbackResponse() {
        var topic = CONVERSATION.topics[currentTopic];
        var messageCount = conversationHistory.filter(function(h) { return h.topic === topic.id; }).length;
        if (messageCount < topic.followups.length) {
          return topic.followups[messageCount];
        }
        return currentLang === 'es-ES' ? 'Interesante. ¿Algo más?' : 'Interesting. Anything else?';
      }

      function showTypingIndicator() {
        var container = document.getElementById('chat-messages');
        var typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex gap-3 items-start';
        typingDiv.innerHTML = '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">A*</div>' +
          '<div class="bg-purple-50 rounded-2xl rounded-tl-none p-4 border border-purple-100">' +
            '<div class="flex gap-2">' +
              '<div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay:0s"></div>' +
              '<div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay:0.2s"></div>' +
              '<div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay:0.4s"></div>' +
            '</div>' +
          '</div>';
        container.appendChild(typingDiv);
        scrollToBottom();
      }

      function hideTypingIndicator() {
        var indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
      }

      function moveToNextTopic() {
        currentTopic++;
        
        var progress = (currentTopic / CONVERSATION.topics.length) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        document.getElementById('topic-num').textContent = currentTopic + 1;

        if (currentTopic >= CONVERSATION.topics.length) {
          completeConversation();
          return;
        }

        setTimeout(async function() {
          await addAIMessage(CONVERSATION.topics[currentTopic].initial);
        }, 1500);
      }

      async function completeConversation() {
        addAIMessage(CONVERSATION.closing);
        document.getElementById('answer-input').disabled = true;
        document.getElementById('pitch-flow').classList.add('hidden');
        document.getElementById('analysis-loading').classList.remove('hidden');

        speak(currentLang === 'es-ES'
          ? 'Analizando tu conversación con nuestros 6 agentes de IA...'
          : 'Analyzing your conversation with our 6 AI agents...');

        try {
          var tokenMatch = document.cookie.match(/authToken=([^;]+)/);
          var token = tokenMatch ? tokenMatch[1] : null;
          if (!token) throw new Error('Not authenticated');

          var res = await fetch('/api/chat-agent/analyze-conversation', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ 
              conversationHistory: conversationHistory,
              language: currentLang,
              week: new Date().toISOString().split('T')[0]
            })
          });

          if (!res.ok) throw new Error('Analysis failed');
          analysis = await res.json();
          
          var scoreVal = analysis.overall_score || 0;
          speak(currentLang === 'es-ES'
            ? 'Tu puntuación es ' + scoreVal + ' de 100.'
            : 'Your score is ' + scoreVal + ' out of 100.');

        } catch(e) {
          console.error('Analysis error:', e);
          analysis = null;
        }

        document.getElementById('analysis-loading').classList.add('hidden');
        showResults();
      }

      window.sendMessage = sendMessage;

      window.toggleVoice = function() {
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      };

      document.addEventListener('keydown', function(e) {
        var pitchFlow = document.getElementById('pitch-flow');
        if (e.key === 'Enter' && !e.shiftKey && pitchFlow && !pitchFlow.classList.contains('hidden')) {
          e.preventDefault();
          sendMessage();
        }
      });

      // ============================================
      // AI ANALYSIS (removed - now part of completeConversation)
      // ============================================

      // ============================================
      // RESULTS
      // ============================================
      function showResults() {
        var r = document.getElementById('results-section');
        r.classList.remove('hidden');

        // Support both flat response and nested analysis.analysis format
        var a = analysis || {};
        if (a.analysis) a = a.analysis; // legacy format
        var score = a.overall_score || 0;
        var rating = a.week_rating || 'N/A';
        var summary = a.summary || a.weekly_summary || '';
        var strength = a.key_strength || a.top_strength || '';
        var risk = a.key_challenge || a.top_risk || '';
        var goalsCount = a.goals_created || analysis?.goals_created || 0;
        var metricsCount = a.metrics_saved || analysis?.metrics_saved || 0;
        var agents = a.agents || {};
        var autoGoals = a.auto_goals || analysis?.auto_goals || [];
        var velOfLearning = a.velocity_of_learning || 0;
        var depthOfUsage = a.depth_of_usage || 0;
        var organicPull = a.organic_pull || 0;

        var scoreColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';
        var scorePct = Math.min(100, score);

        var agentList = [
          { k:'hypothesis', icon:'🧪', label:'Hypothesis' },
          { k:'build', icon:'🛠️', label:'Build' },
          { k:'users', icon:'💬', label:'Users' },
          { k:'metrics', icon:'📊', label:'Metrics' },
          { k:'traction', icon:'🚀', label:'Traction' }
        ];

        var agentHtml = agentList.map(function(ag) {
          var d = agents[ag.k];
          if (!d) return '';
          var fb = typeof d === 'string' ? d : (d.feedback || d.analysis || d.summary || JSON.stringify(d));
          var sc = d.quality_score || d.productivity_score || d.engagement_score || d.depth_score || d.traction_score || '';
          return '<details class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">' +
            '<summary class="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700">' +
              '<span>' + ag.icon + '</span> ' + ag.label +
              (sc ? ' <span class="ml-auto text-xs font-bold text-purple-600">' + sc + '/10</span>' : '') +
            '</summary>' +
            '<div class="px-4 py-3 border-t border-gray-100 text-sm text-gray-600 leading-relaxed bg-gray-50">' + fb + '</div>' +
          '</details>';
        }).join('');

        var goalsHtml = autoGoals.map(function(g) {
          return '<li class="text-sm text-green-800 flex items-start gap-2"><span class="text-green-500 font-bold">•</span><span>' + (g.description || g.task || g) + '</span></li>';
        }).join('');

        r.innerHTML = '' +
          '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 text-center fade-up">' +
            '<div class="score-ring mx-auto mb-4" style="--score-pct:' + scorePct + '%">' +
              '<div class="score-ring-inner">' +
                '<div class="text-3xl font-black ' + scoreColor + '">' + score + '</div>' +
                '<div class="text-xs text-gray-400">/100</div>' +
              '</div>' +
            '</div>' +
            '<div class="text-lg font-bold text-gray-800 mb-1">' + rating + '</div>' +
            (summary ? '<p class="text-sm text-gray-500 max-w-md mx-auto">' + summary + '</p>' : '') +
          '</div>' +

          '<div class="grid grid-cols-3 gap-4 mb-6 fade-up fade-up-delay-1">' +
            '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center"><div class="text-2xl font-bold text-green-600">' + goalsCount + '</div><div class="text-xs text-gray-500 font-semibold">Goals</div></div>' +
            '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center"><div class="text-2xl font-bold text-blue-600">' + metricsCount + '</div><div class="text-xs text-gray-500 font-semibold">Metrics</div></div>' +
            '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center"><div class="text-2xl font-bold text-purple-600">4</div><div class="text-xs text-gray-500 font-semibold">Topics</div></div>' +
          '</div>' +

          (strength || risk ? '<div class="grid grid-cols-2 gap-4 mb-6 fade-up fade-up-delay-2">' +
            (strength ? '<div class="bg-green-50 rounded-xl border border-green-200 p-4"><div class="text-xs font-semibold text-green-700 mb-1">💪 Strength</div><div class="text-sm text-green-800">' + strength + '</div></div>' : '') +
            (risk ? '<div class="bg-red-50 rounded-xl border border-red-200 p-4"><div class="text-xs font-semibold text-red-700 mb-1">⚠️ Risk</div><div class="text-sm text-red-800">' + risk + '</div></div>' : '') +
          '</div>' : '') +

          (velOfLearning || depthOfUsage || organicPull ? '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 fade-up fade-up-delay-2">' +
            '<h4 class="text-sm font-semibold text-gray-700 mb-3">📊 ASTAR Weekly Scores</h4>' +
            '<div class="grid grid-cols-2 gap-3 text-sm">' +
              '<div class="flex justify-between bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-600">Velocity of Learning</span><span class="font-bold text-purple-600">' + velOfLearning + '</span></div>' +
              '<div class="flex justify-between bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-600">Depth of Usage</span><span class="font-bold text-purple-600">' + depthOfUsage + '</span></div>' +
              '<div class="flex justify-between bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-600">Organic Pull</span><span class="font-bold text-purple-600">' + organicPull + '</span></div>' +
              '<div class="flex justify-between bg-purple-50 rounded-lg px-3 py-2 border border-purple-200"><span class="font-semibold text-purple-800">Overall</span><span class="font-black text-purple-800">' + score + '/100</span></div>' +
            '</div>' +
          '</div>' : '') +

          '<div class="space-y-2 mb-6 fade-up fade-up-delay-3">' +
            '<h4 class="text-sm font-semibold text-gray-700 mb-2">🤖 Agent Reports</h4>' +
            agentHtml +
          '</div>' +

          (autoGoals.length ? '<div class="bg-green-50 rounded-xl border border-green-200 p-6 mb-6">' +
            '<h4 class="text-sm font-semibold text-green-700 mb-3">✅ Auto-Created Goals (' + autoGoals.length + ')</h4>' +
            '<ul class="space-y-2">' + goalsHtml + '</ul>' +
          '</div>' : '') +

          '<div class="flex gap-3">' +
            '<button onclick="restart()" class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all">' +
              '← Back to Home' +
            '</button>' +
          '</div>';

        loadLeaderboard();
      }

      window.restart = function() {
        document.getElementById('results-section').classList.add('hidden');
        document.getElementById('results-section').innerHTML = '';
        document.getElementById('main-content').classList.remove('hidden');
        loadLeaderboard();
      };

      // ============================================
      // SPEECH (TTS + STT) - Queue System
      // ============================================
      var speechQueue = [];
      var isSpeechProcessing = false;

      function speak(text) {
        return new Promise(function(resolve) {
          if (!('speechSynthesis' in window)) { resolve(); return; }
          speechQueue.push({ text: text, resolve: resolve });
          if (!isSpeechProcessing) {
            processSpeechQueue();
          }
        });
      }

      function processSpeechQueue() {
        if (speechQueue.length === 0) {
          isSpeechProcessing = false;
          isSpeaking = false;
          updateStatus();
          return;
        }
        isSpeechProcessing = true;
        isSpeaking = true;
        updateStatus();
        var item = speechQueue.shift();
        var u = new SpeechSynthesisUtterance(item.text);
        u.lang = currentLang;
        u.rate = 1.0;
        u.onend = function() {
          item.resolve();
          setTimeout(function() { processSpeechQueue(); }, 500);
        };
        u.onerror = function() {
          item.resolve();
          setTimeout(function() { processSpeechQueue(); }, 200);
        };
        window.speechSynthesis.speak(u);
      }

      function startListening() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        recognition = new SR();
        recognition.lang = currentLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        isListening = true;
        updateStatus();
        var finalText = '';
        var timer = null;
        recognition.onresult = function(e) {
          var interim = '';
          for (var i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
            else interim += e.results[i][0].transcript;
          }
          document.getElementById('answer-input').value = (finalText + interim).trim();
          if (timer) clearTimeout(timer);
          timer = setTimeout(function() { if (finalText.trim() || interim.trim()) stopListening(); }, 2000);
        };
        recognition.onerror = function() { isListening = false; updateStatus(); };
        recognition.onend = function() { isListening = false; updateStatus(); };
        recognition.start();
      }

      function stopListening() {
        if (recognition) recognition.stop();
        isListening = false;
        updateStatus();
      }

      function updateStatus() {
        var s = document.getElementById('voice-status');
        if (!s) return;
        if (isSpeaking) s.innerHTML = '<div class="flex items-center gap-2 text-purple-600"><div class="animate-pulse text-2xl">🔊</div><span class="text-sm font-semibold">Speaking...</span></div>';
        else if (isListening) s.innerHTML = '<div class="flex items-center gap-3 text-green-600"><div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div><span class="text-sm font-semibold">🎤 Listening... speak now</span></div>';
        else s.innerHTML = '';
      }

      // ============================================
      // INIT
      // ============================================
      loadLeaderboard();
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'leaderboard',
    userName,
    userAvatar: userAvatar || '',
    pageTitle: '🎯 Weekly Pitch Deck - ASTAR*',
    userRole
  });
}
