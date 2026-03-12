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
          <button onclick="switchTab('inbox')" id="tab-inbox" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold ${userRole === 'founder' ? 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent' : 'text-primary border-b-2 border-primary'}" style="display:none">
            <i class="fas fa-inbox mr-1 md:mr-2"></i><span class="hidden sm:inline">Inbox</span>
            <span id="unread-badge" class="hidden ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">0</span>
          </button>
          <button onclick="switchTab('directory')" id="tab-directory" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent" style="display:none">
            <i class="fas fa-store mr-1 md:mr-2"></i><span class="hidden sm:inline">Directory</span>
          </button>
          <button onclick="switchTab('connector')" id="tab-connector" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent bg-gradient-to-r from-purple-50 to-indigo-50" style="display:none">
            <i class="fas fa-network-wired mr-1 md:mr-2"></i><span class="hidden sm:inline">AI Connector</span>
          </button>
          <button onclick="switchTab('crm')" id="tab-crm" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent bg-gradient-to-r from-emerald-50 to-teal-50" style="display:none">
            <i class="fas fa-users-cog mr-1 md:mr-2"></i><span class="hidden sm:inline">AI CRM</span>
          </button>
          <button onclick="openVoiceCheckin()" id="tab-voice" class="tab-btn flex-shrink-0 px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 hover:text-gray-700 border-b-2 border-transparent bg-gradient-to-r from-purple-50 to-pink-50" style="display:none">
            <i class="fas fa-microphone mr-1 md:mr-2"></i><span class="hidden sm:inline">🎯 Pitch Deck</span>
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
      <!-- HOME TAB - ASTRO AI COFOUNDER CHAT -->
      <div id="content-home" class="tab-content">

        <!-- Astro Chat Interface -->
        <div id="astro-chat-container" style="height: calc(100vh - 180px); min-height: 500px; background: #0d0d0d; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(139,92,246,0.2); box-shadow: 0 0 40px rgba(139,92,246,0.08);">
          
          <!-- Astro Header -->
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 12px; background: rgba(139,92,246,0.06);">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">⚡</div>
            <div>
              <div style="font-weight: 700; color: #f0f0f0; font-size: 15px;">Astro</div>
              <div style="font-size: 12px; color: #a78bfa;">AI Cofounder · Sales, Marketing & Fundraising</div>
            </div>
            <div style="margin-left: auto; display: flex; align-items: center; gap-6px;">
              <span id="astro-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
              <span style="font-size: 12px; color: #6b7280; margin-left: 6px;">Online</span>
            </div>
          </div>

          <!-- Messages Area -->
          <div id="astro-messages" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth;">
            <!-- Messages injected by JS -->
            <div id="astro-loading" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; max-width: 80%; background: rgba(255,255,255,0.05); border-radius: 16px; border-bottom-left-radius: 4px;">
              <span style="color: #a78bfa; font-size: 14px;">Astro está escribiendo</span>
              <span class="astro-typing-dots">
                <span style="display: inline-block; width: 5px; height: 5px; background: #a78bfa; border-radius: 50%; animation: astroTyping 1.2s infinite;"></span>
                <span style="display: inline-block; width: 5px; height: 5px; background: #a78bfa; border-radius: 50%; animation: astroTyping 1.2s infinite 0.4s; margin: 0 3px;"></span>
                <span style="display: inline-block; width: 5px; height: 5px; background: #a78bfa; border-radius: 50%; animation: astroTyping 1.2s infinite 0.8s;"></span>
              </span>
            </div>
          </div>

          <!-- Voice Recording Overlay (hidden by default) -->
          <div id="astro-voice-overlay" style="display:none; padding: 20px; border-top: 1px solid rgba(139,92,246,0.3); background: rgba(17,0,34,0.95); flex-direction: column; align-items: center; gap: 12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div id="astro-voice-pulse" style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:22px; animation: voicePulse 1.2s ease-in-out infinite;">🎙️</div>
              <div>
                <div style="font-weight:700; color:#f0f0f0; font-size:14px;">Astro is listening...</div>
                <div style="font-size:12px; color:#a78bfa;">Tell me about your week — I'll transcribe and analyse it</div>
              </div>
              <div id="astro-voice-countdown" style="margin-left:auto; font-size:28px; font-weight:800; color:#a78bfa; min-width:40px; text-align:right;">60</div>
            </div>
            <!-- Waveform bars (animated) -->
            <div style="display:flex; align-items:center; gap:3px; height:32px;" id="astro-waveform">
              ${Array.from({length:24}).map((_,i) => `<div style="width:3px; border-radius:2px; background:rgba(139,92,246,0.6); height:${8+Math.floor(Math.random()*20)}px; animation:waveBar 0.8s ease-in-out infinite; animation-delay:${(i*0.05).toFixed(2)}s;"></div>`).join('')}
            </div>
            <div style="display:flex; gap:10px;">
              <button onclick="stopAstroVoiceRecording(true)" style="padding:10px 24px; border-radius:24px; background:linear-gradient(135deg,#7c3aed,#a855f7); border:none; color:white; font-weight:700; font-size:13px; cursor:pointer;">⚡ Send to Astro</button>
              <button onclick="stopAstroVoiceRecording(false)" style="padding:10px 18px; border-radius:24px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#9ca3af; font-size:13px; cursor:pointer;">Cancel</button>
            </div>
          </div>

          <!-- Input Area -->
          <div style="padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.07); background: rgba(0,0,0,0.3);">
            <div style="display: flex; gap: 10px; align-items: flex-end;">
              <!-- Voice button -->
              <button id="astro-voice-btn" onclick="startAstroVoiceRecording()"
                title="Tell Astro about your week by voice (60s)"
                style="width:44px; height:44px; border-radius:50%; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.3); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; font-size:18px;"
                onmouseover="this.style.background='rgba(139,92,246,0.25)'"
                onmouseout="this.style.background='rgba(139,92,246,0.12)'">🎙️</button>
              <textarea id="astro-input" placeholder="Type a message or use 🎙️ to tell Astro about your week..." rows="1"
                style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: #f0f0f0; font-size: 14px; resize: none; outline: none; font-family: inherit; line-height: 1.5; max-height: 120px; overflow-y: auto;"
                onkeydown="astroHandleKeydown(event)"
                oninput="this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
              <button onclick="sendAstroMessage()" 
                style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.15s, box-shadow 0.15s;"
                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(124,58,237,0.5)'"
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            <p style="font-size: 11px; color: #4b5563; margin-top: 8px; text-align: center;">Astro collects your metrics to connect you with the right VCs · <a href="/pitch" style="color: #7c3aed; text-decoration: none;">See full pitch deck →</a></p>
          </div>
        </div>

        <style>
          @keyframes astroTyping { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
          @keyframes voicePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); } 50% { box-shadow: 0 0 0 14px rgba(139,92,246,0); } }
          @keyframes waveBar { 0%,100% { transform: scaleY(0.4); opacity:0.5; } 50% { transform: scaleY(1.3); opacity:1; } }
          #astro-messages::-webkit-scrollbar { width: 6px; }
          #astro-messages::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 4px; }
          #astro-messages::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.45); border-radius: 4px; }
          #astro-messages::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.7); }
          #astro-messages { scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.45) rgba(255,255,255,0.04); }
          #astro-input::placeholder { color: #4b5563; }
          #astro-input:focus { border-color: rgba(139,92,246,0.5) !important; }
          .astro-msg-astro { display: flex; align-items: flex-start; gap: 10px; animation: astroBubbleIn 0.3s ease; }
          .astro-msg-user { display: flex; justify-content: flex-end; animation: astroBubbleIn 0.3s ease; }
          @keyframes astroBubbleIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          .astro-bubble-astro { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2); color: #e5e7eb; padding: 12px 16px; border-radius: 16px; border-bottom-left-radius: 4px; max-width: 85%; font-size: 14px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
          .astro-bubble-user { background: rgba(255,255,255,0.08); color: #e5e7eb; padding: 12px 16px; border-radius: 16px; border-bottom-right-radius: 4px; max-width: 85%; font-size: 14px; line-height: 1.7; word-break: break-word; }
          .astro-avatar-sm { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#7c3aed,#a855f7); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; margin-top: 2px; }
          .astro-vc-card { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); border-radius: 10px; padding: 10px 14px; margin: 6px 0; }
        </style>

      </div><!-- end content-home -->

      <!-- TRACTION TAB -->
      <div id="content-traction" class="tab-content hidden">

        <!-- Goals Hub -->
        <div class="flex items-center gap-3 mb-4">
          <div class="h-px flex-1 bg-gray-200"></div>
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest">⚡ Goals Hub</span>
          <div class="h-px flex-1 bg-gray-200"></div>
        </div>
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
                <span class="px-2 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">🔨 Build</span>
                <span class="px-2 md:px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium hidden md:inline">🧪 Test</span>
                <span class="px-2 md:px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium hidden md:inline">📈 Traction</span>
              </div>
            </div>
            <button onclick="openGoalModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">
              <i class="fas fa-plus mr-2"></i>New Goal
            </button>
          </div>
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
            <div class="grid grid-cols-7 gap-1 mb-2">
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Mon</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Tue</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Wed</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Thu</div>
              <div class="text-center text-xs font-semibold text-gray-500 py-1">Fri</div>
              <div class="text-center text-xs font-semibold text-gray-400 py-1">Sat</div>
              <div class="text-center text-xs font-semibold text-gray-400 py-1">Sun</div>
            </div>
            <div id="calendar-grid" class="grid grid-cols-7 gap-1"></div>
            <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-400 rounded"></span> Light (1-2)</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-400 rounded"></span> Medium (3-4)</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-400 rounded"></span> Heavy (5+)</span>
              </div>
              <span id="busiest-day" class="font-medium"></span>
            </div>
          </div>
          <!-- Goals Filters -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div class="flex flex-wrap gap-3 items-center">
              <div class="flex-1 min-w-[200px]">
                <input type="text" id="goals-search" placeholder="Search goals..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" onkeyup="filterGoalsTable()">
              </div>
              <select id="goals-filter-category" onchange="filterGoalsTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All Categories</option>
                <option value="ASTAR">ASTAR</option>
                <option value="MAGCIENT">MAGCIENT</option>
                <option value="Personal">Personal</option>
              </select>
              <select id="goals-filter-priority" onchange="filterGoalsTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All Priorities</option>
                <option value="P0">P0 - Critical</option>
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Medium</option>
                <option value="P3">P3 - Low</option>
              </select>
              <select id="goals-filter-status" onchange="filterGoalsTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All Status</option>
                <option value="WIP">WIP</option>
                <option value="To start">To start</option>
                <option value="On Hold">On Hold</option>
                <option value="Delayed">Delayed</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </select>
              <select id="goals-filter-dri" onchange="filterGoalsTable()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All DRIs</option>
              </select>
              <button onclick="clearGoalsFilters()" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
                <i class="fas fa-times mr-1"></i>Clear
              </button>
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

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
        
        <!-- Weekly Traction Metrics Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div class="p-6 border-b border-gray-200">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <i class="fas fa-rocket text-pink-600"></i>
              Weekly Traction Metrics
            </h3>
            <p class="text-sm text-gray-500 mt-1">Track your user types and revenue over time</p>
          </div>
          
          <!-- Traction Summary Cards -->
          <div class="p-6 grid grid-cols-2 md:grid-cols-5 gap-4 bg-gradient-to-br from-pink-50 to-purple-50">
            <div class="bg-white p-4 rounded-lg border border-pink-100 text-center">
              <p class="text-xs text-gray-500 uppercase mb-1">Revenue (4w)</p>
              <p id="traction-summary-revenue" class="text-2xl font-bold text-pink-600">€0</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-100 text-center">
              <p class="text-xs text-gray-500 uppercase mb-1">New Users (4w)</p>
              <p id="traction-summary-new" class="text-2xl font-bold text-green-600">0</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-100 text-center">
              <p class="text-xs text-gray-500 uppercase mb-1">Active Users</p>
              <p id="traction-summary-active" class="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-red-100 text-center">
              <p class="text-xs text-gray-500 uppercase mb-1">Churned (4w)</p>
              <p id="traction-summary-churned" class="text-2xl font-bold text-red-500">0</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-purple-100 text-center">
              <p class="text-xs text-gray-500 uppercase mb-1">Net Growth</p>
              <p id="traction-summary-net" class="text-2xl font-bold text-purple-600">0</p>
            </div>
          </div>
          
          <!-- Traction Charts -->
          <div class="p-6 space-y-6">
            <!-- User Types Chart -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="fas fa-users"></i> User Types Breakdown (Last 12 Weeks)
                <span class="ml-auto flex items-center gap-3 text-xs">
                  <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded-full"></span> New</span>
                  <span class="flex items-center gap-1"><span class="w-3 h-3 bg-blue-500 rounded-full"></span> Active</span>
                  <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded-full"></span> Churned</span>
                </span>
              </h4>
              <div style="height: 280px; position: relative;">
                <canvas id="dashboard-user-types-chart"></canvas>
              </div>
            </div>
            
            <!-- Net Growth & Revenue -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i class="fas fa-chart-bar"></i> Net User Growth (New - Churned)
                </h4>
                <div style="height: 220px; position: relative;">
                  <canvas id="dashboard-net-growth-chart"></canvas>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i class="fas fa-euro-sign"></i> Revenue Trend
                </h4>
                <div style="height: 220px; position: relative;">
                  <canvas id="dashboard-revenue-trend-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="font-bold text-gray-900 mb-4">User Growth (Global)</h3>
            <div class="h-64"><canvas id="chart-users"></canvas></div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="font-bold text-gray-900 mb-4">Revenue Growth (Global)</h3>
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
                  <span class="text-lg">🌟</span>
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

      <!-- AI CRM TAB -->
      <div id="content-crm" class="tab-content hidden">
        <div class="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-emerald-100">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <i class="fas fa-users-cog text-white text-xl"></i>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900">AI CRM</h2>
                <p class="text-sm text-gray-600">Manage your contacts and relationships with AI assistance</p>
              </div>
            </div>
            <button onclick="openAddCRMContactModal()" class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md">
              <i class="fas fa-plus mr-2"></i>Add Contact
            </button>
          </div>
          
          <!-- CRM Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p class="text-xs text-gray-500 uppercase">Total</p>
              <p class="text-xl font-bold text-gray-900" id="crm-stat-total">0</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p class="text-xs text-gray-500 uppercase">New</p>
              <p class="text-xl font-bold text-emerald-600" id="crm-stat-new">0</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p class="text-xs text-gray-500 uppercase">Contacted</p>
              <p class="text-xl font-bold text-blue-600" id="crm-stat-contacted">0</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p class="text-xs text-gray-500 uppercase">Qualified</p>
              <p class="text-xl font-bold text-purple-600" id="crm-stat-qualified">0</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p class="text-xs text-gray-500 uppercase">Won</p>
              <p class="text-xl font-bold text-green-600" id="crm-stat-won">0</p>
            </div>
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p class="text-xs text-gray-500 uppercase">From AI</p>
              <p class="text-xl font-bold text-indigo-600" id="crm-stat-ai">0</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap gap-3 mb-4">
            <select id="crm-filter-status" onchange="filterCRMContacts('status', this.value)" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <select id="crm-filter-type" onchange="filterCRMContacts('type', this.value)" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All Types</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="investor">Investor</option>
              <option value="founder">Founder</option>
            </select>
            <select id="crm-filter-source" onchange="filterCRMContacts('source', this.value)" class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All Sources</option>
              <option value="ai_connector">AI Connector</option>
              <option value="manual">Manual</option>
              <option value="import">Import</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <div class="flex-1 min-w-[200px]">
              <input type="text" id="crm-search" placeholder="Search contacts..." onkeyup="debounceCRMSearch()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>
        </div>

        <!-- Contacts List -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div id="crm-contacts-list" class="divide-y divide-gray-100">
            <div class="p-8 text-center text-gray-500">
              <i class="fas fa-users text-4xl text-gray-300 mb-3"></i>
              <p>No contacts yet. Add your first contact or use AI Connector to find suggestions!</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="mt-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            <i class="fas fa-history text-emerald-500 mr-2"></i>Recent Activity
          </h3>
          <div id="crm-recent-activities" class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-gray-500 text-sm text-center">No recent activities</p>
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

    <!-- CRM Add/Edit Contact Modal -->
    <div id="crm-contact-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-900" id="crm-modal-title">Add Contact</h3>
          <button onclick="closeCRMContactModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form id="crm-contact-form" onsubmit="saveCRMContact(event)" class="p-6">
          <input type="hidden" id="crm-contact-id">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" id="crm-contact-name" required class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Contact name">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="crm-contact-email" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="email@example.com">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input type="text" id="crm-contact-company" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Company name">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input type="text" id="crm-contact-position" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Job title">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" id="crm-contact-phone" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="+1 234 567 890">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input type="url" id="crm-contact-linkedin" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://linkedin.com/in/...">
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select id="crm-contact-type" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                  <option value="partner">Partner</option>
                  <option value="investor">Investor</option>
                  <option value="validator">Validator</option>
                  <option value="founder">Founder</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="crm-contact-status" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select id="crm-contact-priority" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="crm-contact-notes" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Add notes about this contact..."></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
                <input type="date" id="crm-contact-followup" class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
                <input type="number" id="crm-contact-value" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="0">
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button type="button" onclick="closeCRMContactModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700">
              <i class="fas fa-save mr-2"></i>Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- CRM Contact Detail Modal -->
    <div id="crm-detail-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-900">Contact Details</h3>
          <button onclick="closeCRMDetailModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div id="crm-detail-content" class="p-6">
          <!-- Content loaded dynamically -->
        </div>
      </div>
    </div>

    <!-- CRM Add Activity Modal -->
    <div id="crm-activity-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div class="border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-900">Log Activity</h3>
          <button onclick="closeCRMActivityModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form id="crm-activity-form" onsubmit="saveCRMActivity(event)" class="p-6">
          <input type="hidden" id="crm-activity-contact-id">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
              <select id="crm-activity-type" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="call">Phone Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="message">Message</option>
                <option value="linkedin">LinkedIn</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input type="text" id="crm-activity-subject" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Brief summary">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="crm-activity-description" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Details..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select id="crm-activity-outcome" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Select outcome</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" onclick="closeCRMActivityModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" class="bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-600">
              <i class="fas fa-plus mr-2"></i>Log Activity
            </button>
          </div>
        </form>
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
                  <option value="Build">🔨 Build</option>
                  <option value="Test">🧪 Test</option>
                  <option value="Traction">📈 Traction</option>
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select id="goal-assigned-to" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Unassigned</option>
                  <!-- Team members will be loaded dynamically -->
                </select>
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
    <div id="goal-detail-modal" class="fixed inset-0 bg-black/50 z-[60] hidden items-center justify-center">
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
          
          <!-- Hypothesis-specific fields - only shown for hypothesis category -->
          <div id="hypothesis-details" class="hidden space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
            <h4 class="font-semibold text-purple-800 flex items-center gap-2">
              <i class="fas fa-flask"></i> Hypothesis Details
            </h4>
            <div class="grid grid-cols-1 gap-4">
              <div class="bg-white p-3 rounded-lg border border-purple-100">
                <label class="text-xs font-medium text-purple-600 uppercase flex items-center gap-1">
                  <i class="fas fa-chart-line text-xs"></i> Expected Behavior
                </label>
                <p id="detail-expected-behavior" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-purple-100">
                <label class="text-xs font-medium text-purple-600 uppercase flex items-center gap-1">
                  <i class="fas fa-check-circle text-xs"></i> Validation Signal
                </label>
                <p id="detail-validation-signal" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="flex items-center gap-4">
                <div class="bg-white px-4 py-2 rounded-lg border border-purple-100 flex items-center gap-2">
                  <label class="text-xs font-medium text-purple-600 uppercase">Status</label>
                  <span id="detail-hypothesis-status" class="px-2 py-1 text-xs font-medium rounded-full"></span>
                </div>
                <div class="bg-white px-4 py-2 rounded-lg border border-purple-100 flex items-center gap-2">
                  <label class="text-xs font-medium text-purple-600 uppercase">Week</label>
                  <span id="detail-week-number" class="font-semibold text-sm"></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Build-specific fields - only shown for build category -->
          <div id="build-details" class="hidden space-y-4 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
            <h4 class="font-semibold text-blue-800 flex items-center gap-2">
              <i class="fas fa-hammer"></i> Build Details
            </h4>
            <div class="grid grid-cols-1 gap-4">
              <div class="bg-white p-3 rounded-lg border border-blue-100">
                <label class="text-xs font-medium text-blue-600 uppercase flex items-center gap-1">
                  <i class="fas fa-code text-xs"></i> Tech Stack
                </label>
                <p id="detail-tech-stack" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-3 rounded-lg border border-blue-100">
                  <label class="text-xs font-medium text-blue-600 uppercase flex items-center gap-1">
                    <i class="fas fa-clock text-xs"></i> Hours Spent
                  </label>
                  <p id="detail-hours-spent" class="text-gray-800 mt-1 text-sm font-semibold"></p>
                </div>
                <div class="bg-white p-3 rounded-lg border border-blue-100">
                  <label class="text-xs font-medium text-blue-600 uppercase flex items-center gap-1">
                    <i class="fas fa-flask text-xs"></i> Related Hypothesis
                  </label>
                  <p id="detail-hypothesis-link" class="text-gray-800 mt-1 text-sm"></p>
                </div>
              </div>
              <div class="bg-white px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                <label class="text-xs font-medium text-blue-600 uppercase">Week</label>
                <span id="detail-build-week-number" class="font-semibold text-sm"></span>
              </div>
            </div>
          </div>
          
          <!-- User Learning-specific fields - Wednesday -->
          <div id="user-learning-details" class="hidden space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <h4 class="font-semibold text-green-800 flex items-center gap-2">
              <i class="fas fa-users"></i> User Conversations Details
            </h4>
            <div class="grid grid-cols-1 gap-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-3 rounded-lg border border-green-100">
                  <label class="text-xs font-medium text-green-600 uppercase flex items-center gap-1">
                    <i class="fas fa-comments text-xs"></i> Users Spoken To
                  </label>
                  <p id="detail-users-spoken" class="text-gray-800 mt-1 text-2xl font-bold"></p>
                </div>
                <div class="bg-white p-3 rounded-lg border border-green-100">
                  <label class="text-xs font-medium text-green-600 uppercase flex items-center gap-1">
                    <i class="fas fa-user-check text-xs"></i> Users Who Used Product
                  </label>
                  <p id="detail-users-used" class="text-gray-800 mt-1 text-2xl font-bold"></p>
                </div>
              </div>
              <div class="bg-white p-3 rounded-lg border border-green-100">
                <label class="text-xs font-medium text-green-600 uppercase flex items-center gap-1">
                  <i class="fas fa-info-circle text-xs"></i> Details
                </label>
                <p id="detail-users-details" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-green-100">
                <label class="text-xs font-medium text-green-600 uppercase flex items-center gap-1">
                  <i class="fas fa-lightbulb text-xs"></i> Key Learning
                </label>
                <p id="detail-key-learning" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="bg-white px-4 py-2 rounded-lg border border-green-100 flex items-center gap-2">
                <label class="text-xs font-medium text-green-600 uppercase">Week</label>
                <span id="detail-user-week-number" class="font-semibold text-sm"></span>
              </div>
            </div>
          </div>
          
          <!-- Insight-specific fields - Thursday -->
          <div id="insight-details" class="hidden space-y-4 bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
            <h4 class="font-semibold text-orange-800 flex items-center gap-2">
              <i class="fas fa-chart-pie"></i> User Behavior Insights
            </h4>
            <div class="grid grid-cols-1 gap-4">
              <div class="bg-white p-3 rounded-lg border border-orange-100">
                <label class="text-xs font-medium text-orange-600 uppercase flex items-center gap-1">
                  <i class="fas fa-users text-xs"></i> Users Interacted
                </label>
                <p id="detail-users-interacted" class="text-gray-800 mt-1 text-2xl font-bold"></p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-orange-100">
                <label class="text-xs font-medium text-orange-600 uppercase flex items-center gap-1">
                  <i class="fas fa-redo text-xs"></i> Repeated Actions
                </label>
                <p id="detail-repeated-actions" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-orange-100">
                <label class="text-xs font-medium text-orange-600 uppercase flex items-center gap-1">
                  <i class="fas fa-sign-out-alt text-xs"></i> Drop-off Points
                </label>
                <p id="detail-drop-off-points" class="text-gray-800 mt-1 text-sm"></p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-orange-100">
                <label class="text-xs font-medium text-orange-600 uppercase flex items-center gap-1">
                  <i class="fas fa-brain text-xs"></i> Key Insight
                </label>
                <p id="detail-key-insight" class="text-gray-800 mt-1 text-sm font-medium"></p>
              </div>
              <div class="bg-white px-4 py-2 rounded-lg border border-orange-100 flex items-center gap-2">
                <label class="text-xs font-medium text-orange-600 uppercase">Week</label>
                <span id="detail-insight-week-number" class="font-semibold text-sm"></span>
              </div>
            </div>
          </div>
          
          <!-- Traction-specific fields - Friday -->
          <div id="traction-details" class="hidden space-y-4 bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200">
            <h4 class="font-semibold text-pink-800 flex items-center gap-2">
              <i class="fas fa-rocket"></i> Weekly Traction Metrics
            </h4>
            <div class="grid grid-cols-1 gap-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white p-3 rounded-lg border border-pink-100">
                  <label class="text-xs font-medium text-pink-600 uppercase flex items-center gap-1">
                    <i class="fas fa-dollar-sign text-xs"></i> Revenue
                  </label>
                  <p id="detail-revenue" class="text-gray-800 mt-1 text-2xl font-bold"></p>
                </div>
                <div class="bg-white p-3 rounded-lg border border-pink-100">
                  <label class="text-xs font-medium text-pink-600 uppercase flex items-center gap-1">
                    <i class="fas fa-user-plus text-xs"></i> New Users
                  </label>
                  <p id="detail-new-users" class="text-gray-800 mt-1 text-2xl font-bold"></p>
                </div>
                <div class="bg-white p-3 rounded-lg border border-pink-100">
                  <label class="text-xs font-medium text-pink-600 uppercase flex items-center gap-1">
                    <i class="fas fa-users text-xs"></i> Active
                  </label>
                  <p id="detail-active-users" class="text-gray-800 mt-1 text-2xl font-bold"></p>
                </div>
                <div class="bg-white p-3 rounded-lg border border-pink-100">
                  <label class="text-xs font-medium text-pink-600 uppercase flex items-center gap-1">
                    <i class="fas fa-user-minus text-xs"></i> Churned
                  </label>
                  <p id="detail-churned" class="text-gray-800 mt-1 text-2xl font-bold"></p>
                </div>
              </div>
              
              <!-- Traction Trend Charts -->
              <div id="traction-charts-container" class="space-y-4">
                <!-- User Types Overview Chart -->
                <div class="bg-white p-4 rounded-lg border border-pink-100">
                  <h5 class="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-users"></i> User Types Breakdown (Last 12 Weeks)
                  </h5>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <span class="w-3 h-3 bg-green-500 rounded-full inline-block"></span> New Users
                        <span class="w-3 h-3 bg-blue-500 rounded-full inline-block ml-2"></span> Active
                        <span class="w-3 h-3 bg-red-500 rounded-full inline-block ml-2"></span> Churned
                      </p>
                      <div style="height: 220px; position: relative;">
                        <canvas id="traction-user-types-chart"></canvas>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 mb-2">Net User Growth</p>
                      <div style="height: 220px; position: relative;">
                        <canvas id="traction-net-growth-chart"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Revenue Trend -->
                <div class="bg-white p-4 rounded-lg border border-pink-100">
                  <h5 class="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-chart-line"></i> Revenue Trend (Last 12 Weeks)
                  </h5>
                  <div style="height: 200px; position: relative;">
                    <canvas id="traction-revenue-chart"></canvas>
                  </div>
                </div>
                
                <!-- Detailed User Metrics -->
                <div class="bg-white p-4 rounded-lg border border-pink-100">
                  <h5 class="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-chart-bar"></i> Weekly User Metrics Comparison
                  </h5>
                  <div style="height: 220px; position: relative;">
                    <canvas id="traction-acquisition-chart"></canvas>
                  </div>
                </div>
              </div>
              
              <div class="bg-white p-3 rounded-lg border border-pink-100">
                <label class="text-xs font-medium text-pink-600 uppercase flex items-center gap-1">
                  <i class="fas fa-bolt text-xs"></i> Strongest Traction Signal
                </label>
                <p id="detail-traction-signal" class="text-gray-800 mt-1 text-sm font-medium"></p>
              </div>
              <div class="bg-white px-4 py-2 rounded-lg border border-pink-100 flex items-center gap-2">
                <label class="text-xs font-medium text-pink-600 uppercase">Week</label>
                <span id="detail-traction-week-number" class="font-semibold text-sm"></span>
              </div>
            </div>
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
        
        if (tab === 'home') initAstroChat();
        if (tab === 'traction') {
          setTimeout(initCharts, 100);
          renderTeamTodoList();
          loadDashboardTractionCharts();
        }
        if (tab === 'inbox') loadConversations();
        if (tab === 'directory') { loadProducts(); loadValidators(); }
        if (tab === 'connector') initConnector();
        if (tab === 'crm') initCRM();
      }

      // ============================================================
      // ASTRO CHAT - AI Cofounder
      // ============================================================
      let astroHistory = [];
      let astroCollectedData = {};
      let astroInitialized = false;
      let astroThinking = false;
      let astroIsWeeklyCheckin = false;  // persists across all turns of a weekly check-in session

      function getAuthToken() {
        return document.cookie.match(/authToken=([^;]+)/)?.[1] || '';
      }

      async function initAstroChat() {
        if (astroInitialized) return;
        astroInitialized = true;

        // Try to load prior session from DB before showing greeting
        let priorSession = null;
        let daysSinceLastSeen = 0;
        const token = getAuthToken();

        if (token) {
          try {
            const profileRes = await fetch('/api/chat-agent/astro-profile', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.session) {
                priorSession = profileData.session;
                // Store pending goals in global scope for greeting context
                if (profileData.pendingGoals && profileData.pendingGoals.length > 0) {
                  priorSession._pendingGoals = profileData.pendingGoals;
                }
                // Pre-fill collected data from prior session
                const s = priorSession;
                if (s.startup_name) astroCollectedData.startup_name = s.startup_name;
                if (s.problem) astroCollectedData.problem = s.problem;
                if (s.solution) astroCollectedData.solution = s.solution;
                if (s.sector) astroCollectedData.sector = s.sector;
                if (s.geography) astroCollectedData.geography = s.geography;
                if (s.mrr > 0) astroCollectedData.mrr = s.mrr;
                if (s.arr > 0) astroCollectedData.arr = s.arr;
                if (s.active_users > 0) astroCollectedData.active_users = s.active_users;
                if (s.team_size > 1) astroCollectedData.team_size = s.team_size;
                if (s.fundraising_stage) astroCollectedData.fundraising_stage = s.fundraising_stage;
                if (s.fundraising_goal) astroCollectedData.fundraising_goal = s.fundraising_goal;

                // Calculate days since last seen
                if (s.last_seen_at) {
                  daysSinceLastSeen = Math.floor((Date.now() - new Date(s.last_seen_at).getTime()) / 86400000);
                  astroIsWeeklyCheckin = daysSinceLastSeen >= 6;
                }

                // Days since last seen already calculated above

              }
            }
          } catch {}
        }

        await requestAstroGreeting(priorSession, daysSinceLastSeen);
      }

      async function requestAstroGreeting(priorSession = null, daysSinceLastSeen = 0) {
        try {
          const token = getAuthToken();
          const isReturning = priorSession !== null;
          const priorActionItems = priorSession?.action_items
            ? (() => { try { return JSON.parse(priorSession.action_items); } catch { return []; } })()
            : [];
          const pendingGoals = priorSession?._pendingGoals || [];

          const res = await fetch('/api/chat-agent/astro-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({
              message: null,
              conversationHistory: [],
              collectedData: astroCollectedData,
              isReturning,
              daysSinceLastSeen,
              priorActionItems,
              pendingGoals
            })
          });
          const data = await res.json();
          // Remove loading indicator
          const loadingEl = document.getElementById('astro-loading');
          if (loadingEl) loadingEl.remove();
          // Add Astro greeting
          addAstroMessage(data.response, 'astro');
          astroHistory.push({ role: 'astro', content: data.response });
        } catch (e) {
          const loadingEl = document.getElementById('astro-loading');
          if (loadingEl) loadingEl.remove();
          const greeting = astroCollectedData.startup_name
            ? "Hey, welcome back! ⚡ Take a minute — tell me how the week went for " + astroCollectedData.startup_name + ": what moved, what didn't, and what's the one thing you need help with right now."
            : "Hey! I'm Astro ⚡, your AI Cofounder at ASTAR*. Before we dive in — take a minute and tell me how your week went. What did you build or ship? How are your key metrics moving? And what's the one thing blocking you right now?";
          addAstroMessage(greeting, 'astro');
          astroHistory.push({ role: 'astro', content: greeting });
        }
      }

      function addAstroMessage(content, role) {
        const messagesEl = document.getElementById('astro-messages');
        if (!messagesEl) return;
        const div = document.createElement('div');
        div.className = role === 'astro' ? 'astro-msg-astro' : 'astro-msg-user';
        if (role === 'astro') {
          div.innerHTML = '<div class="astro-avatar-sm">⚡</div><div class="astro-bubble-astro">' + escapeAstroHtml(content) + '</div>';
        } else {
          div.innerHTML = '<div class="astro-bubble-user">' + escapeAstroHtml(content) + '</div>';
        }
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function showAstroTyping() {
        const messagesEl = document.getElementById('astro-messages');
        if (!messagesEl) return;
        const div = document.createElement('div');
        div.id = 'astro-typing-indicator';
        div.className = 'astro-msg-astro';
        div.innerHTML = '<div class="astro-avatar-sm">⚡</div><div class="astro-bubble-astro" style="padding: 10px 16px;"><span style="display:inline-block;width:5px;height:5px;background:#a78bfa;border-radius:50%;animation:astroTyping 1.2s infinite;"></span><span style="display:inline-block;width:5px;height:5px;background:#a78bfa;border-radius:50%;animation:astroTyping 1.2s infinite 0.4s;margin:0 3px;"></span><span style="display:inline-block;width:5px;height:5px;background:#a78bfa;border-radius:50%;animation:astroTyping 1.2s infinite 0.8s;"></span></div>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function hideAstroTyping() {
        const el = document.getElementById('astro-typing-indicator');
        if (el) el.remove();
      }

      function escapeAstroHtml(text) {
        // Strip markdown tables (lines that start with | ... |)
        text = text.replace(/^\\|.*\\|\\s*$/gm, '');
        // Remove separator lines like |---|---|
        text = text.replace(/^\\|[-:\\s|]+\\|\\s*$/gm, '');
        // Remove excess blank lines left by table removal
        text = text.replace(/\\n{3,}/g, '\\n\\n');
        // Escape HTML entities first
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Bold: **text** or __text__
        text = text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
        // Italic: *text* or _text_
        text = text.replace(/\\*([^*]+?)\\*/g, '<em>$1</em>');
        // Convert markdown headers (## ...) to bold lines
        text = text.replace(/^#{1,3}\\s+(.+)$/gm, '<strong>$1</strong>');
        // Convert markdown bullet lines to •
        text = text.replace(/^[\\-\\*]\\s+/gm, '• ');
        // Numbered lists — keep as-is
        // Newlines to <br>
        text = text.replace(/\\n/g, '<br>');
        return text;
      }

      function astroHandleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendAstroMessage();
        }
      }

      // ── Voice Recording ──────────────────────────────────────────────
      let astroMediaRecorder = null;
      let astroAudioChunks = [];
      let astroVoiceCountdownInterval = null;
      let astroVoiceSecondsLeft = 60;

      async function startAstroVoiceRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('Your browser does not support microphone access. Try Chrome or Edge.');
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          astroAudioChunks = [];
          astroVoiceSecondsLeft = 60;

          // Pick the best supported MIME type
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';

          astroMediaRecorder = new MediaRecorder(stream, { mimeType });
          astroMediaRecorder.ondataavailable = e => { if (e.data.size > 0) astroAudioChunks.push(e.data); };
          astroMediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            // Only send if user clicked Send (not Cancel)
            if (astroMediaRecorder._shouldSend) {
              await transcribeAndSendToAstro(new Blob(astroAudioChunks, { type: mimeType }), mimeType);
            }
          };

          astroMediaRecorder.start(250); // collect in 250ms chunks

          // Show overlay
          const overlay = document.getElementById('astro-voice-overlay');
          overlay.style.display = 'flex';

          // Countdown
          document.getElementById('astro-voice-countdown').textContent = '60';
          astroVoiceCountdownInterval = setInterval(() => {
            astroVoiceSecondsLeft--;
            document.getElementById('astro-voice-countdown').textContent = astroVoiceSecondsLeft;
            if (astroVoiceSecondsLeft <= 0) stopAstroVoiceRecording(true);
          }, 1000);

        } catch (err) {
          console.error('Mic error:', err);
          alert('Could not access microphone. Please allow microphone permission and try again.');
        }
      }

      function stopAstroVoiceRecording(send) {
        clearInterval(astroVoiceCountdownInterval);
        document.getElementById('astro-voice-overlay').style.display = 'none';
        if (astroMediaRecorder && astroMediaRecorder.state !== 'inactive') {
          astroMediaRecorder._shouldSend = send;
          astroMediaRecorder.stop();
        }
      }

      async function transcribeAndSendToAstro(audioBlob, mimeType) {
        // Show transcribing state in chat
        const transcribingId = 'astro-transcribing-' + Date.now();
        const messagesEl = document.getElementById('astro-messages');
        const transcribingEl = document.createElement('div');
        transcribingEl.id = transcribingId;
        transcribingEl.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 16px;max-width:80%;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:16px;border-bottom-left-radius:4px;';
        transcribingEl.innerHTML = '<span style="font-size:18px;">🎙️</span><span style="color:#a78bfa;font-size:14px;">Transcribing your voice note...</span>';
        messagesEl.appendChild(transcribingEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
          const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.' + ext);

          const token = getAuthToken();
          const res = await fetch('/api/chat-agent/transcribe', {
            method: 'POST',
            headers: token ? { 'Authorization': 'Bearer ' + token } : {},
            body: formData
          });

          const data = await res.json();
          transcribingEl.remove();

          if (!res.ok || !data.transcription) {
            addAstroMessage('⚠️ Could not transcribe the audio. Please try typing your message.', 'astro');
            return;
          }

          const transcription = data.transcription.trim();

          // Show user bubble with the transcription
          addAstroMessage('🎙️ ' + transcription, 'user');
          astroHistory.push({ role: 'user', content: '🎙️ ' + transcription });

          // Send to Astro with [VOICE_TRANSCRIPT] prefix for special handling
          astroThinking = true;
          showAstroTyping();

          const chatToken = getAuthToken();
          const chatRes = await fetch('/api/chat-agent/astro-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(chatToken ? { 'Authorization': 'Bearer ' + chatToken } : {})
            },
            body: JSON.stringify({
              message: '[VOICE_TRANSCRIPT] ' + transcription,
              conversationHistory: astroHistory.slice(-20),
              collectedData: astroCollectedData,
              isWeeklyCheckin: true
            })
          });

          const chatData = await chatRes.json();
          hideAstroTyping();
          astroThinking = false;

          if (chatData.extractedData) {
            Object.entries(chatData.extractedData).forEach(([k,v]) => { if (v != null) astroCollectedData[k] = v; });
          }
          if (chatData.isVCRecommendation) {
            showAstroVCCards(chatData.recommendedVCCards || []);
            if (chatData.response) setTimeout(() => { addAstroMessage(chatData.response, 'astro'); astroHistory.push({ role: 'astro', content: chatData.response }); }, 400);
          } else {
            addAstroMessage(chatData.response, 'astro');
            astroHistory.push({ role: 'astro', content: chatData.response });
          }
          if (chatData.dataSaved) showAstroProfileCard(astroCollectedData);
          if (chatData.actionItems && chatData.actionItems.length > 0) showAstroActionItems(chatData.actionItems, false);
          if (chatData.createdGoals && chatData.createdGoals.length > 0) showAstroCreatedGoals(chatData.createdGoals, 'en');

        } catch (err) {
          console.error('Voice transcription error:', err);
          transcribingEl.remove();
          astroThinking = false;
          hideAstroTyping();
          addAstroMessage('⚠️ Something went wrong with the voice note. Try typing instead.', 'astro');
        }
      }

      async function sendAstroMessage() {
        if (astroThinking) return;
        const input = document.getElementById('astro-input');
        const message = input ? input.value.trim() : '';
        if (!message) return;

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        // Add user message to UI
        addAstroMessage(message, 'user');
        astroHistory.push({ role: 'user', content: message });

        // Show typing indicator
        astroThinking = true;
        showAstroTyping();

        try {
          const token = getAuthToken();
          const res = await fetch('/api/chat-agent/astro-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({
              message,
              conversationHistory: astroHistory.slice(-20), // Last 20 messages for context
              collectedData: astroCollectedData,
              isWeeklyCheckin: astroIsWeeklyCheckin
            })
          });

          const data = await res.json();
          hideAstroTyping();

          // Merge extracted data into our local store first
          if (data.extractedData && typeof data.extractedData === 'object') {
            Object.entries(data.extractedData).forEach(([k, v]) => {
              if (v !== null && v !== undefined) astroCollectedData[k] = v;
            });
          }

          // If VC recommendations received, show cards first, then the conversational follow-up
          if (data.isVCRecommendation) {
            showAstroVCCards(data.recommendedVCCards || []);
            if (data.response) {
              // Small delay so cards render first, then follow-up bubble appears
              setTimeout(function() {
                addAstroMessage(data.response, 'astro');
                astroHistory.push({ role: 'astro', content: data.response });
              }, 400);
            }
          } else {
            addAstroMessage(data.response, 'astro');
            astroHistory.push({ role: 'astro', content: data.response });
          }

          // Show saved profile card if data was persisted
          if (data.dataSaved) {
            showAstroProfileCard(astroCollectedData);
          }

          // Show action items card if received
          if (data.actionItems && data.actionItems.length > 0) {
            showAstroActionItems(data.actionItems, false);
          }

          // Show auto-created goals confirmation if backend created goals
          if (data.createdGoals && data.createdGoals.length > 0) {
            var lang = (astroCollectedData.lang || navigator.language || 'es').startsWith('en') ? 'en' : 'es';
            showAstroCreatedGoals(data.createdGoals, lang);
          }

          // Show metric update card if metrics were updated during weekly check-in
          if (data.updatedMetrics && Object.keys(data.updatedMetrics).length > 0) {
            showAstroMetricsUpdated(data.updatedMetrics);
          }
        } catch (e) {
          hideAstroTyping();
          addAstroMessage('Ups, hubo un problema de conexión. ¿Puedes intentarlo de nuevo?', 'astro');
        }

        astroThinking = false;
      }

      var astroGoalIcons = ['🎯','📈','🚀','💡','🤝','💰','📣','🛠️'];
      var astroGoalColors = [
        { bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.3)', badge:'rgba(139,92,246,0.2)', badgeText:'#c4b5fd' },
        { bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.3)',  badge:'rgba(16,185,129,0.2)',  badgeText:'#6ee7b7' },
        { bg:'rgba(236,72,153,0.1)', border:'rgba(236,72,153,0.3)',  badge:'rgba(236,72,153,0.2)',  badgeText:'#f9a8d4' },
        { bg:'rgba(251,191,36,0.08)',border:'rgba(251,191,36,0.25)', badge:'rgba(251,191,36,0.15)', badgeText:'#fcd34d' },
        { bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.3)',  badge:'rgba(59,130,246,0.2)',  badgeText:'#93c5fd' },
      ];

      function showAstroActionItems(items, isPrior) {
        var messagesEl = document.getElementById('astro-messages');
        if (!messagesEl || !items || items.length === 0) return;

        // Remove any previous action items block
        var prev = document.getElementById('astro-action-items');
        if (prev) prev.remove();

        var wrapper = document.createElement('div');
        wrapper.id = 'astro-action-items';
        wrapper.style.cssText = 'margin: 8px 0 16px 0; animation: astroBubbleIn 0.4s ease;';

        // Header
        var header = document.createElement('div');
        header.style.cssText = 'font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;padding:0 2px;margin-bottom:10px;display:flex;align-items:center;gap:8px;';
        header.innerHTML = '🎯 <span>Goals creados automáticamente en tu Hub</span>';
        wrapper.appendChild(header);

        // Cards grid
        var grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        items.forEach(function(item, i) {
          var col = astroGoalColors[i % astroGoalColors.length];
          var icon = astroGoalIcons[i % astroGoalIcons.length];

          var card = document.createElement('div');
          card.style.cssText = 'background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:border-color 0.2s;';
          card.onmouseover = function(){ this.style.borderColor = col.badgeText; };
          card.onmouseout  = function(){ this.style.borderColor = col.border; };

          // Icon circle
          var num = document.createElement('div');
          num.style.cssText = 'min-width:28px;height:28px;background:' + col.badge + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;';
          num.textContent = icon;
          card.appendChild(num);

          // Text
          var text = document.createElement('div');
          text.style.cssText = 'flex:1;font-size:13px;color:#e2e8f0;line-height:1.5;';
          text.textContent = item;
          card.appendChild(text);

          // Auto-created badge
          var badge = document.createElement('span');
          badge.style.cssText = 'flex-shrink:0;background:' + col.badge + ';border:1px solid ' + col.border + ';color:' + col.badgeText + ';padding:4px 10px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;';
          badge.textContent = '✓ Goal';
          card.appendChild(badge);

          grid.appendChild(card);
        });

        wrapper.appendChild(grid);

        // Link to hub
        var hubLink = document.createElement('div');
        hubLink.style.cssText = 'font-size:11px;color:#6b7280;margin-top:8px;padding-left:4px;cursor:pointer;';
        hubLink.innerHTML = '📌 Ver todos los goals en <span style="color:#a78bfa;text-decoration:underline;">tu Hub</span>';
        hubLink.onclick = function() { switchTab('home'); };
        wrapper.appendChild(hubLink);

        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function showAstroCreatedGoals(goals, lang) {
        var messagesEl = document.getElementById('astro-messages');
        if (!messagesEl || !goals || goals.length === 0) return;

        var prev = document.getElementById('astro-goals-created');
        if (prev) prev.remove();

        var card = document.createElement('div');
        card.id = 'astro-goals-created';
        card.style.cssText = 'margin: 8px 0 16px 0; animation: astroBubbleIn 0.4s ease;';

        var isEs = lang !== 'en';
        var headerText = isEs
          ? '\u2705 ' + goals.length + ' goal' + (goals.length > 1 ? 's' : '') + ' creado' + (goals.length > 1 ? 's' : '') + ' autom\u00e1ticamente en tu Hub'
          : '\u2705 ' + goals.length + ' goal' + (goals.length > 1 ? 's' : '') + ' auto-created in your Hub';
        var subText = isEs
          ? 'Los puedes ver y actualizar en la pesta\u00f1a <strong>\u2302 Hub</strong> \u2192 Goals.'
          : 'You can track and update them in the <strong>\u2302 Hub</strong> tab \u2192 Goals.';
        var btnLabel = isEs ? '\ud83c\udfaf Ver mis Goals' : '\ud83c\udfaf View my Goals';

        var inner = document.createElement('div');
        inner.style.cssText = 'background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06));border:1px solid rgba(16,185,129,0.35);border-radius:14px;padding:14px 16px;';

        var hdr = document.createElement('div');
        hdr.style.cssText = 'font-size:13px;font-weight:700;color:#4ade80;margin-bottom:6px;';
        hdr.textContent = headerText;
        inner.appendChild(hdr);

        var sub = document.createElement('div');
        sub.style.cssText = 'font-size:12px;color:#9ca3af;margin-bottom:10px;';
        sub.innerHTML = subText;
        inner.appendChild(sub);

        var list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:12px;';
        goals.forEach(function(g) {
          var row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:#d1d5db;';
          row.innerHTML = '<span style="color:#4ade80;font-weight:700;">\u2022</span> ' + (g.description || '');
          list.appendChild(row);
        });
        inner.appendChild(list);

        var hubBtn = document.createElement('button');
        hubBtn.style.cssText = 'background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#4ade80;padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.15s;';
        hubBtn.textContent = btnLabel;
        hubBtn.onclick = function() { switchTab('home'); };
        inner.appendChild(hubBtn);

        card.appendChild(inner);
        messagesEl.appendChild(card);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function showAstroMetricsUpdated(updatedMetrics) {
        var messagesEl = document.getElementById('astro-messages');
        if (!messagesEl || !updatedMetrics || Object.keys(updatedMetrics).length === 0) return;

        var prev = document.getElementById('astro-metrics-updated');
        if (prev) prev.remove();

        var card = document.createElement('div');
        card.id = 'astro-metrics-updated';
        card.style.cssText = 'margin: 8px 0 16px 0; animation: astroBubbleIn 0.4s ease;';

        var inner = document.createElement('div');
        inner.style.cssText = 'background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.06));border:1px solid rgba(59,130,246,0.35);border-radius:14px;padding:14px 16px;';

        var hdr = document.createElement('div');
        hdr.style.cssText = 'font-size:13px;font-weight:700;color:#60a5fa;margin-bottom:8px;';
        hdr.textContent = '📊 Métricas actualizadas en tu perfil';
        inner.appendChild(hdr);

        var list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:5px;';
        var labelMap = { mrr:'MRR', arr:'ARR', active_users:'Usuarios activos', growth_rate_percent:'Crecimiento mensual', team_size:'Equipo' };
        Object.entries(updatedMetrics).forEach(function(entry) {
          var key = entry[0]; var val = entry[1];
          var row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;';
          var label = labelMap[key] || key;
          var prevHtml = val.prev ? '<span style="color:#6b7280;text-decoration:line-through;">' + val.prev + '</span> → ' : '';
          row.innerHTML = '<span style="color:#93c5fd;font-weight:600;min-width:120px;">' + label + '</span>' + prevHtml + '<span style="color:#bfdbfe;font-weight:700;">' + val.next + '</span>';
          list.appendChild(row);
        });
        inner.appendChild(list);

        var sub = document.createElement('div');
        sub.style.cssText = 'font-size:11px;color:#6b7280;margin-top:8px;';
        sub.textContent = 'Guardado en tu sesión de Astro y sincronizado con tu Hub.';
        inner.appendChild(sub);

        card.appendChild(inner);
        messagesEl.appendChild(card);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      async function astroCreateGoalFromItem(description, btn) {
        var token = getAuthToken();
        if (!token) { alert('Inicia sesión para guardar goals.'); return; }
        var original = btn.textContent;
        btn.textContent = '...';
        btn.disabled = true;
        try {
          var res = await fetch('/api/dashboard/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            credentials: 'include',
            body: JSON.stringify({
              category: 'Traction',
              description: description,
              task: description,
              priority: 'P1',
              cadence: 'One time',
              goal_status: 'To start',
              week_of: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
            })
          });
          var data = await res.json();
          if (data.goal || data.success) {
            btn.textContent = '✓ Añadido';
            btn.style.opacity = '0.6';
          } else {
            btn.textContent = original;
            btn.disabled = false;
            alert('Error al crear el goal: ' + (data.error || 'Inténtalo de nuevo'));
          }
        } catch(e) {
          btn.textContent = original;
          btn.disabled = false;
          alert('Error de conexión. Inténtalo de nuevo.');
        }
      }

      function showAstroVCCards(vcCards) {
        const messagesEl = document.getElementById('astro-messages');
        if (!messagesEl) return;

        // Remove previous VC cards block if any
        const prev = document.getElementById('astro-vc-cards');
        if (prev) prev.remove();

        const wrapper = document.createElement('div');
        wrapper.id = 'astro-vc-cards';
        wrapper.style.cssText = 'display:flex; flex-direction:column; gap:10px; padding: 6px 0 12px 0; animation: astroBubbleIn 0.4s ease;';

        if (vcCards && vcCards.length > 0) {

          vcCards.forEach(vc => {
            const ticketStr = vc.min_ticket_usd > 0
              ? '$' + (vc.min_ticket_usd/1000) + 'K – $' + (vc.max_ticket_usd/1000000).toFixed(1) + 'M'
              : 'Variable';
            const card = document.createElement('div');
            card.style.cssText = 'background:linear-gradient(135deg,rgba(109,40,217,0.12) 0%,rgba(30,27,75,0.25) 100%);border:1px solid rgba(139,92,246,0.25);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;transition:border-color 0.2s;';
            card.onmouseover = function(){ this.style.borderColor='rgba(139,92,246,0.55)'; };
            card.onmouseout  = function(){ this.style.borderColor='rgba(139,92,246,0.25)'; };
            card.innerHTML = [
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">',
                '<div style="display:flex;align-items:center;gap:8px;">',
                  '<div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">💼</div>',
                  '<div>',
                    '<div style="color:#e9d5ff;font-weight:700;font-size:14px;">' + escapeAstroHtml(vc.name) + '</div>',
                    '<div style="color:#9ca3af;font-size:11px;">' + escapeAstroHtml(vc.country || '') + (vc.geography ? ' · ' + escapeAstroHtml(vc.geography) : '') + '</div>',
                  '</div>',
                '</div>',
                vc.website ? '<a href="' + escapeAstroHtml(vc.website) + '" target="_blank" rel="noopener" style="font-size:11px;color:#a78bfa;text-decoration:none;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);padding:4px 10px;border-radius:6px;white-space:nowrap;flex-shrink:0;">Visitar →</a>' : '',
              '</div>',
              '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;">',
                '<span style="font-size:11px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.25);color:#c4b5fd;padding:2px 8px;border-radius:20px;">🎯 ' + escapeAstroHtml(vc.stage || '') + '</span>',
                '<span style="font-size:11px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);color:#6ee7b7;padding:2px 8px;border-radius:20px;">💰 ' + ticketStr + '</span>',
                vc.typical_equity_pct > 0 ? '<span style="font-size:11px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);color:#fcd34d;padding:2px 8px;border-radius:20px;">% ' + vc.typical_equity_pct + '% equity</span>' : '',
              '</div>',
              vc.description ? '<div style="font-size:12px;color:#d1d5db;line-height:1.5;margin-top:2px;">' + escapeAstroHtml(vc.description) + '</div>' : '',
              vc.portfolio_examples ? '<div style="font-size:11px;color:#6b7280;margin-top:1px;">📦 Portfolio: ' + escapeAstroHtml(vc.portfolio_examples) + '</div>' : '',
            ].join('');
            wrapper.appendChild(card);
          });
        }

        // Action buttons below VC cards
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;padding:4px 0;';
        const pitchBtn = document.createElement('button');
        pitchBtn.textContent = '📝 Preparar pitch deck';
        pitchBtn.style.cssText = 'background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.4);color:#a78bfa;padding:9px 18px;border-radius:9px;font-size:13px;cursor:pointer;font-family:inherit;transition:background 0.2s;';
        pitchBtn.onmouseover = function(){ this.style.background='rgba(139,92,246,0.28)'; };
        pitchBtn.onmouseout  = function(){ this.style.background='rgba(139,92,246,0.15)'; };
        pitchBtn.onclick = function(){ switchTab('pitch'); };
        const leaderboardLink = document.createElement('a');
        leaderboardLink.href = '/leaderboard';
        leaderboardLink.textContent = '🏆 Ver leaderboard';
        leaderboardLink.style.cssText = 'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#4ade80;padding:9px 18px;border-radius:9px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:background 0.2s;';
        leaderboardLink.onmouseover = function(){ this.style.background='rgba(34,197,94,0.2)'; };
        leaderboardLink.onmouseout  = function(){ this.style.background='rgba(34,197,94,0.1)'; };
        actions.appendChild(pitchBtn);
        actions.appendChild(leaderboardLink);
        wrapper.appendChild(actions);

        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function showAstroProfileCard(data) {
        const messagesEl = document.getElementById('astro-messages');
        if (!messagesEl) return;

        // Need at least one meaningful piece of data
        const hasData = data.startup_name || data.active_users || data.mrr || data.fundraising_stage || data.sector;
        if (!hasData) return;

        // Remove previous saved profile card (update in-place)
        const prev = document.getElementById('astro-profile-card');
        if (prev) prev.remove();

        // Calculate rough completeness from collected data
        const fields = ['startup_name','problem','solution','sector','mrr','active_users','team_size','fundraising_stage'];
        const filled = fields.filter(f => data[f] && data[f] !== '0').length;
        const pct = Math.round((filled / fields.length) * 100);
        const barColor = pct < 40 ? '#f59e0b' : pct < 70 ? '#8b5cf6' : '#10b981';

        const parts = [];
        if (data.active_users) parts.push({ icon: '👥', val: data.active_users + ' usuarios' });
        if (data.mrr) parts.push({ icon: '💰', val: '$' + data.mrr + '/mes MRR' });
        if (data.arr) parts.push({ icon: '📊', val: '$' + data.arr + ' ARR' });
        if (data.team_size) parts.push({ icon: '🧑‍💻', val: 'Equipo de ' + data.team_size });
        if (data.fundraising_stage) parts.push({ icon: '🚀', val: data.fundraising_stage });
        if (data.sector) parts.push({ icon: '🏭', val: data.sector });
        if (data.geography) parts.push({ icon: '🌍', val: data.geography });

        const pillsHtml = parts.map(p =>
          '<span style="font-size:11px;background:rgba(109,40,217,0.15);border:1px solid rgba(139,92,246,0.25);color:#c4b5fd;padding:3px 9px;border-radius:20px;white-space:nowrap;">' + p.icon + ' ' + escapeAstroHtml(String(p.val)) + '</span>'
        ).join('');

        const card = document.createElement('div');
        card.id = 'astro-profile-card';
        card.style.cssText = 'background:linear-gradient(135deg,rgba(30,27,75,0.6) 0%,rgba(17,24,39,0.8) 100%);border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:14px 16px;margin:4px 0;animation:astroBubbleIn 0.35s ease;';
        card.innerHTML = [
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">',
            '<div style="display:flex;align-items:center;gap:8px;">',
              '<div style="width:32px;height:32px;background:linear-gradient(135deg,#6d28d9,#a855f7);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;">⚡</div>',
              '<div>',
                '<div style="color:#e9d5ff;font-weight:700;font-size:14px;">' + escapeAstroHtml(data.startup_name || 'Tu startup') + '</div>',
                '<div style="color:#9ca3af;font-size:11px;">Perfil guardado en ASTAR*</div>',
              '</div>',
            '</div>',
            '<div style="text-align:right;">',
              '<div style="font-size:18px;font-weight:700;color:' + barColor + ';">' + pct + '%</div>',
              '<div style="font-size:10px;color:#6b7280;">completo</div>',
            '</div>',
          '</div>',
          '<div style="width:100%;height:5px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:10px;">',
            '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + barColor + ',#a855f7);border-radius:99px;transition:width 0.8s ease;"></div>',
          '</div>',
          parts.length > 0 ? '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">' + pillsHtml + '</div>' : '',
          '<div style="display:flex;justify-content:space-between;align-items:center;">',
            '<span style="font-size:11px;color:#4ade80;display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block;"></span>Datos guardados</span>',
            '<a href="/leaderboard" style="font-size:11px;color:#a78bfa;text-decoration:none;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);padding:4px 10px;border-radius:6px;">Ver leaderboard →</a>',
          '</div>',
        ].join('');

        messagesEl.appendChild(card);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      // Legacy alias
      function showAstroSavedIndicator(data) { showAstroProfileCard(data); }

      // Auto-init Astro when page loads (home tab is default)
      document.addEventListener('DOMContentLoaded', function() {
        initAstroChat();
      });

      
      // ============== AI CONNECTOR FUNCTIONS ==============
      let connectorSessionId = null;
      let connectorMessages = [];
      let allConnectorSuggestions = [];
      
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
                <span class="text-lg">🌟</span>
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
              <span class="text-lg">🌟</span>
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
        
        // Store matches for later use (e.g., adding to CRM)
        allConnectorSuggestions = matches;
        
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
                <button onclick="startConversation(\${match.id})" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm">
                  <i class="fas fa-comment-dots mr-2"></i>Chat
                </button>
                <button onclick="addSuggestionToCRM(\${match.id})" class="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-all" title="Add to CRM">
                  <i class="fas fa-user-plus"></i>
                </button>
                <button onclick="viewProfile(\${match.id})" class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all" title="View Profile">
                  <i class="fas fa-eye"></i>
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
        if (!container) {
          console.warn('recent-connections element not found');
          return;
        }
        
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
        
        if (!container) {
          console.warn('all-suggestions-list element not found');
          return;
        }
        if (!countEl) {
          console.warn('all-suggestions-count element not found');
          return;
        }
        
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
          const score = s.score ? Math.round(s.score) : 0;
          
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
          html += '<button onclick="event.stopPropagation(); startConversation(' + s.id + ')" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm">';
          html += '<i class="fas fa-comment-dots mr-1"></i>Chat</button>';
          html += '<button onclick="event.stopPropagation(); addSuggestionToCRM(' + s.id + ')" class="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all" title="Add to CRM">';
          html += '<i class="fas fa-user-plus"></i></button>';
          html += '<button onclick="event.stopPropagation(); showSuggestionDetail(' + s.id + ')" class="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all" title="View Details">';
          html += '<i class="fas fa-info-circle"></i></button>';
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
          const score = suggestion.score ? Math.round(suggestion.score) : 0;
          
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
          html += '<button onclick="startConversation(' + suggestion.id + '); closeSuggestionDetail();" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md">';
          html += '<i class="fas fa-comment-dots mr-2"></i>Start Chat</button>';
          html += '<button onclick="addSuggestionToCRM(' + suggestion.id + '); closeSuggestionDetail();" class="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-100 transition-all">';
          html += '<i class="fas fa-user-plus mr-2"></i>Add to CRM</button>';
          html += '<button onclick="viewProfile(' + suggestion.id + '); closeSuggestionDetail();" class="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all">';
          html += '<i class="fas fa-eye mr-2"></i>Profile</button>';
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

      // ============== AI CRM FUNCTIONS ==============
      let crmContacts = [];
      let crmStats = {};
      let currentCRMFilters = { status: '', type: '', source: '' };
      let crmSearchTimeout = null;

      async function initCRM() {
        await Promise.all([loadCRMContacts(), loadCRMStats()]);
      }

      async function loadCRMContacts() {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) return;
          
          let url = '/api/crm/contacts?';
          if (currentCRMFilters.status) url += 'status=' + currentCRMFilters.status + '&';
          if (currentCRMFilters.type) url += 'contact_type=' + currentCRMFilters.type + '&';
          if (currentCRMFilters.source) url += 'source=' + currentCRMFilters.source + '&';
          
          const searchInput = document.getElementById('crm-search');
          if (searchInput && searchInput.value) url += 'search=' + encodeURIComponent(searchInput.value) + '&';
          
          const res = await axios.get(url, {
            headers: { Authorization: 'Bearer ' + token }
          });
          
          crmContacts = res.data.contacts || [];
          renderCRMContacts();
        } catch (error) {
          console.error('Error loading CRM contacts:', error);
        }
      }

      async function loadCRMStats() {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) return;
          
          const res = await axios.get('/api/crm/stats', {
            headers: { Authorization: 'Bearer ' + token }
          });
          
          crmStats = res.data;
          updateCRMStatsUI();
        } catch (error) {
          console.error('Error loading CRM stats:', error);
        }
      }

      function updateCRMStatsUI() {
        const elements = {
          'crm-stat-total': crmStats.total || 0,
          'crm-stat-new': crmStats.by_status?.new || 0,
          'crm-stat-contacted': crmStats.by_status?.contacted || 0,
          'crm-stat-qualified': crmStats.by_status?.qualified || 0,
          'crm-stat-won': crmStats.by_status?.won || 0,
          'crm-stat-ai': crmStats.from_ai_connector || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = value;
        });
      }

      function renderCRMContacts() {
        const container = document.getElementById('crm-contacts-list');
        if (!container) return;
        
        if (!crmContacts || crmContacts.length === 0) {
          container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 col-span-full">' +
            '<i class="fas fa-address-book text-5xl text-gray-300 mb-4"></i>' +
            '<p class="font-medium">No contacts found</p>' +
            '<p class="text-sm mt-2">Add your first contact or use AI Connector to find suggestions!</p>' +
            '</div>';
          return;
        }
        
        container.innerHTML = crmContacts.map(contact => {
          const initials = (contact.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const avatarColors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
          const colorIndex = (contact.name || 'U').charCodeAt(0) % avatarColors.length;
          
          const statusColors = {
            'new': 'bg-blue-100 text-blue-700',
            'contacted': 'bg-yellow-100 text-yellow-700',
            'qualified': 'bg-purple-100 text-purple-700',
            'negotiation': 'bg-orange-100 text-orange-700',
            'won': 'bg-green-100 text-green-700',
            'lost': 'bg-red-100 text-red-700'
          };
          
          const typeColors = {
            'lead': 'bg-gray-100 text-gray-700',
            'prospect': 'bg-blue-100 text-blue-700',
            'customer': 'bg-green-100 text-green-700',
            'partner': 'bg-orange-100 text-orange-700',
            'investor': 'bg-purple-100 text-purple-700',
            'validator': 'bg-pink-100 text-pink-700',
            'founder': 'bg-indigo-100 text-indigo-700'
          };
          
          const statusClass = statusColors[contact.status] || 'bg-gray-100 text-gray-700';
          const typeClass = typeColors[contact.contact_type] || 'bg-gray-100 text-gray-700';
          
          let html = '<div class="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer" onclick="openCRMContactDetail(' + contact.id + ')">';
          html += '<div class="flex items-start gap-3 mb-3">';
          html += '<div class="w-12 h-12 ' + avatarColors[colorIndex] + ' rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">' + initials + '</div>';
          html += '<div class="flex-1 min-w-0">';
          html += '<h4 class="font-semibold text-gray-900 truncate">' + (contact.name || 'Unknown') + '</h4>';
          if (contact.company) html += '<p class="text-sm text-gray-600 truncate">' + contact.company + '</p>';
          if (contact.position) html += '<p class="text-xs text-gray-500 truncate">' + contact.position + '</p>';
          html += '</div></div>';
          
          html += '<div class="flex flex-wrap gap-1 mb-3">';
          html += '<span class="px-2 py-0.5 text-xs font-medium rounded-full ' + statusClass + '">' + (contact.status || 'new') + '</span>';
          html += '<span class="px-2 py-0.5 text-xs font-medium rounded-full ' + typeClass + '">' + (contact.contact_type || 'lead') + '</span>';
          if (contact.source === 'ai_connector') html += '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700"><i class="fas fa-robot mr-1"></i>AI</span>';
          html += '</div>';
          
          if (contact.email || contact.phone) {
            html += '<div class="space-y-1 mb-3 text-xs text-gray-600">';
            if (contact.email) html += '<p class="truncate"><i class="fas fa-envelope mr-2 text-gray-400"></i>' + contact.email + '</p>';
            if (contact.phone) html += '<p><i class="fas fa-phone mr-2 text-gray-400"></i>' + contact.phone + '</p>';
            html += '</div>';
          }
          
          if (contact.next_follow_up) {
            const followupDate = new Date(contact.next_follow_up);
            const isOverdue = followupDate < new Date();
            html += '<div class="bg-' + (isOverdue ? 'red' : 'emerald') + '-50 rounded-lg p-2 mb-3">';
            html += '<p class="text-xs text-' + (isOverdue ? 'red' : 'emerald') + '-700"><i class="fas fa-calendar mr-1"></i> Follow-up: ' + followupDate.toLocaleDateString() + '</p>';
            html += '</div>';
          }
          
          html += '<div class="flex gap-2">';
          html += '<button onclick="event.stopPropagation(); openCRMActivityModal(' + contact.id + ')" class="flex-1 bg-emerald-50 text-emerald-700 py-2 px-3 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all"><i class="fas fa-plus mr-1"></i>Log Activity</button>';
          html += '<button onclick="event.stopPropagation(); editCRMContact(' + contact.id + ')" class="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"><i class="fas fa-edit"></i></button>';
          html += '</div></div>';
          
          return html;
        }).join('');
      }

      function openAddCRMContactModal() {
        document.getElementById('crm-modal-title').textContent = 'Add Contact';
        document.getElementById('crm-contact-form').reset();
        document.getElementById('crm-contact-id').value = '';
        const modal = document.getElementById('crm-contact-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function closeCRMContactModal() {
        const modal = document.getElementById('crm-contact-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      async function editCRMContact(contactId) {
        const contact = crmContacts.find(c => c.id === contactId);
        if (!contact) return;
        
        document.getElementById('crm-modal-title').textContent = 'Edit Contact';
        document.getElementById('crm-contact-id').value = contact.id;
        document.getElementById('crm-contact-name').value = contact.name || '';
        document.getElementById('crm-contact-email').value = contact.email || '';
        document.getElementById('crm-contact-company').value = contact.company || '';
        document.getElementById('crm-contact-position').value = contact.position || '';
        document.getElementById('crm-contact-phone').value = contact.phone || '';
        document.getElementById('crm-contact-linkedin').value = contact.linkedin_url || '';
        document.getElementById('crm-contact-type').value = contact.contact_type || 'lead';
        document.getElementById('crm-contact-status').value = contact.status || 'new';
        document.getElementById('crm-contact-priority').value = contact.priority || 'medium';
        document.getElementById('crm-contact-notes').value = contact.notes || '';
        document.getElementById('crm-contact-followup').value = contact.next_follow_up ? contact.next_follow_up.split('T')[0] : '';
        document.getElementById('crm-contact-value').value = contact.deal_value || '';
        
        const modal = document.getElementById('crm-contact-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      async function saveCRMContact(event) {
        event.preventDefault();
        
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) {
            console.error('[CRM] No auth token found');
            return;
          }
          
          const contactId = document.getElementById('crm-contact-id').value;
          console.log('[CRM] Saving contact:', contactId ? 'Update ID=' + contactId : 'New');
          
          const contactData = {
            name: document.getElementById('crm-contact-name').value,
            email: document.getElementById('crm-contact-email').value || null,
            company: document.getElementById('crm-contact-company').value || null,
            position: document.getElementById('crm-contact-position').value || null,
            phone: document.getElementById('crm-contact-phone').value || null,
            linkedin_url: document.getElementById('crm-contact-linkedin').value || null,
            contact_type: document.getElementById('crm-contact-type').value,
            status: document.getElementById('crm-contact-status').value,
            priority: document.getElementById('crm-contact-priority').value,
            notes: document.getElementById('crm-contact-notes').value || null,
            next_follow_up: document.getElementById('crm-contact-followup').value || null,
            deal_value: document.getElementById('crm-contact-value').value ? parseFloat(document.getElementById('crm-contact-value').value) : null
          };
          
          const url = contactId ? '/api/crm/contacts/' + contactId : '/api/crm/contacts';
          const method = contactId ? 'PUT' : 'POST';
          
          console.log('[CRM] Sending request:', method, url, contactData);
          const response = await axios({ method, url, data: contactData, headers: { Authorization: 'Bearer ' + token } });
          console.log('[CRM] Contact saved successfully:', response.data);
          
          closeCRMContactModal();
          await Promise.all([loadCRMContacts(), loadCRMStats()]);
        } catch (error) {
          console.error('[CRM] Error saving contact:', error);
          console.error('[CRM] Error details:', error.response?.data);
          alert('Error saving contact: ' + (error.response?.data?.error || error.message));
        }
      }

      async function openCRMContactDetail(contactId) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) return;
          
          const contact = crmContacts.find(c => c.id === contactId);
          if (!contact) return;
          
          // Fetch activities for this contact
          const activitiesRes = await axios.get('/api/crm/contacts/' + contactId + '/activities', {
            headers: { Authorization: 'Bearer ' + token }
          });
          const activities = activitiesRes.data.activities || [];
          
          const modal = document.getElementById('crm-detail-modal');
          const content = document.getElementById('crm-detail-content');
          
          const initials = (contact.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          
          let html = '<div class="flex items-start gap-4 mb-6">';
          html += '<div class="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">' + initials + '</div>';
          html += '<div class="flex-1">';
          html += '<h3 class="text-2xl font-bold text-gray-900">' + (contact.name || 'Unknown') + '</h3>';
          if (contact.position && contact.company) html += '<p class="text-gray-600">' + contact.position + ' at ' + contact.company + '</p>';
          else if (contact.company) html += '<p class="text-gray-600">' + contact.company + '</p>';
          html += '<div class="flex gap-2 mt-2">';
          html += '<span class="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">' + (contact.status || 'new') + '</span>';
          html += '<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">' + (contact.contact_type || 'lead') + '</span>';
          html += '</div></div>';
          html += '<button onclick="editCRMContact(' + contact.id + '); closeCRMDetailModal();" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><i class="fas fa-edit mr-2"></i>Edit</button>';
          html += '</div>';
          
          // Contact info grid
          html += '<div class="grid grid-cols-2 gap-4 mb-6">';
          if (contact.email) html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500 mb-1">Email</p><a href="mailto:' + contact.email + '" class="text-sm text-emerald-600 hover:underline">' + contact.email + '</a></div>';
          if (contact.phone) html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500 mb-1">Phone</p><a href="tel:' + contact.phone + '" class="text-sm text-emerald-600 hover:underline">' + contact.phone + '</a></div>';
          if (contact.linkedin_url) html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500 mb-1">LinkedIn</p><a href="' + contact.linkedin_url + '" target="_blank" class="text-sm text-blue-600 hover:underline">View Profile</a></div>';
          if (contact.deal_value) html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500 mb-1">Deal Value</p><p class="text-sm font-semibold text-green-600">$' + contact.deal_value.toLocaleString() + '</p></div>';
          if (contact.next_follow_up) html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-500 mb-1">Next Follow-up</p><p class="text-sm text-gray-900">' + new Date(contact.next_follow_up).toLocaleDateString() + '</p></div>';
          html += '</div>';
          
          if (contact.notes) {
            html += '<div class="mb-6"><h4 class="text-sm font-semibold text-gray-700 mb-2">Notes</h4>';
            html += '<div class="bg-gray-50 rounded-lg p-3"><p class="text-sm text-gray-600 whitespace-pre-wrap">' + contact.notes + '</p></div></div>';
          }
          
          // Activities
          html += '<div class="mb-4"><div class="flex items-center justify-between mb-3">';
          html += '<h4 class="text-sm font-semibold text-gray-700">Activity Log</h4>';
          html += '<button onclick="openCRMActivityModal(' + contact.id + ')" class="text-sm text-emerald-600 hover:text-emerald-700"><i class="fas fa-plus mr-1"></i>Add Activity</button>';
          html += '</div>';
          
          if (activities.length === 0) {
            html += '<div class="bg-gray-50 rounded-lg p-4 text-center text-gray-500"><i class="fas fa-history text-2xl mb-2"></i><p class="text-sm">No activities logged yet</p></div>';
          } else {
            html += '<div class="space-y-3 max-h-60 overflow-y-auto">';
            activities.forEach(act => {
              const actIcons = { call: 'fa-phone', email: 'fa-envelope', meeting: 'fa-users', message: 'fa-comment', linkedin: 'fa-linkedin', note: 'fa-sticky-note' };
              const actIcon = actIcons[act.activity_type] || 'fa-circle';
              html += '<div class="flex gap-3 p-3 bg-gray-50 rounded-lg">';
              html += '<div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0"><i class="fas ' + actIcon + ' text-emerald-600 text-sm"></i></div>';
              html += '<div class="flex-1 min-w-0">';
              html += '<p class="text-sm font-medium text-gray-900">' + (act.subject || act.activity_type) + '</p>';
              if (act.description) html += '<p class="text-xs text-gray-600 mt-1">' + act.description + '</p>';
              html += '<p class="text-xs text-gray-400 mt-1">' + new Date(act.created_at).toLocaleString() + '</p>';
              html += '</div></div>';
            });
            html += '</div>';
          }
          html += '</div>';
          
          // Actions
          html += '<div class="flex gap-3 pt-4 border-t border-gray-200">';
          html += '<button onclick="openCRMActivityModal(' + contact.id + ')" class="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700"><i class="fas fa-plus mr-2"></i>Log Activity</button>';
          if (contact.email) html += '<a href="mailto:' + contact.email + '" class="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"><i class="fas fa-envelope"></i></a>';
          if (contact.phone) html += '<a href="tel:' + contact.phone + '" class="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"><i class="fas fa-phone"></i></a>';
          html += '</div>';
          
          content.innerHTML = html;
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        } catch (error) {
          console.error('Error loading contact detail:', error);
        }
      }

      function closeCRMDetailModal() {
        const modal = document.getElementById('crm-detail-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      function openCRMActivityModal(contactId) {
        document.getElementById('crm-activity-form').reset();
        document.getElementById('crm-activity-contact-id').value = contactId;
        const modal = document.getElementById('crm-activity-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function closeCRMActivityModal() {
        const modal = document.getElementById('crm-activity-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      async function saveCRMActivity(event) {
        event.preventDefault();
        
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) {
            console.error('[CRM] No auth token found');
            return;
          }
          
          const contactId = document.getElementById('crm-activity-contact-id').value;
          console.log('[CRM] Saving activity for contact:', contactId);
          
          const activityData = {
            activity_type: document.getElementById('crm-activity-type').value,
            subject: document.getElementById('crm-activity-subject').value || null,
            description: document.getElementById('crm-activity-description').value || null,
            outcome: document.getElementById('crm-activity-outcome').value || null
          };
          
          console.log('[CRM] Activity data:', activityData);
          const response = await axios.post('/api/crm/contacts/' + contactId + '/activities', activityData, {
            headers: { Authorization: 'Bearer ' + token }
          });
          console.log('[CRM] Activity saved successfully:', response.data);
          
          closeCRMActivityModal();
          // Refresh detail modal if open
          const detailModal = document.getElementById('crm-detail-modal');
          if (!detailModal.classList.contains('hidden')) {
            await openCRMContactDetail(parseInt(contactId));
          }
        } catch (error) {
          console.error('[CRM] Error saving activity:', error);
          console.error('[CRM] Error details:', error.response?.data);
          alert('Error saving activity: ' + (error.response?.data?.error || error.message));
        }
      }

      function filterCRMContacts(filterType, value) {
        console.log('[CRM] Applying filter:', filterType, '=', value);
        if (value === '' || value === 'all') {
          delete currentCRMFilters[filterType];
        } else {
          currentCRMFilters[filterType] = value;
        }
        console.log('[CRM] Current filters:', currentCRMFilters);
        loadCRMContacts();
      }

      function debounceCRMSearch() {
        clearTimeout(crmSearchTimeout);
        crmSearchTimeout = setTimeout(loadCRMContacts, 300);
      }

      // Add contact from AI Connector suggestion
      // userId = The suggested user's ID (from matches or saved suggestions)
      async function addSuggestionToCRM(userId, suggestionData) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          if (!token) return;
          
          // If no suggestionData provided, fetch it first
          let data = suggestionData;
          if (!data) {
            // Find in allConnectorSuggestions (fresh matches from AI)
            data = allConnectorSuggestions.find(s => s.id === userId);
            if (!data) {
              // Try to get from saved suggestions
              const savedRes = await axios.get('/api/connector/suggestions', {
                headers: { Authorization: 'Bearer ' + token }
              });
              const saved = savedRes.data.suggestions || [];
              data = saved.find(s => s.id === userId || s.suggested_user_id === userId);
            }
          }
          
          // Build request with all available data
          // Note: userId is the suggested user's ID, suggestion_id is the DB record ID (if saved)
          const requestBody = {
            suggestion_id: data?.suggestion_id || null,
            suggested_user_id: userId,
            name: data?.name || 'Unknown Contact',
            email: data?.email || null,
            company: data?.industry || data?.company || null,
            reason: data?.reason || null,
            avatar_url: data?.avatar || data?.avatar_url || null
          };
          
          console.log('[CRM] Adding contact from connector:', requestBody);
          
          const res = await axios.post('/api/crm/from-connector', requestBody, {
            headers: { Authorization: 'Bearer ' + token }
          });
          
          if (res.data.success) {
            const msg = res.data.already_exists ? 'Contact already in CRM!' : 'Contact added to CRM!';
            alert(msg);
            // If CRM tab is active, refresh
            if (!document.getElementById('content-crm').classList.contains('hidden')) {
              await Promise.all([loadCRMContacts(), loadCRMStats()]);
            }
          }
        } catch (error) {
          console.error('Error adding to CRM:', error);
          alert('Error adding to CRM: ' + (error.response?.data?.error || error.message));
        }
      }

      // Expose CRM functions globally
      window.openAddCRMContactModal = openAddCRMContactModal;
      window.closeCRMContactModal = closeCRMContactModal;
      window.saveCRMContact = saveCRMContact;
      window.editCRMContact = editCRMContact;
      window.openCRMContactDetail = openCRMContactDetail;
      window.closeCRMDetailModal = closeCRMDetailModal;
      window.openCRMActivityModal = openCRMActivityModal;
      window.closeCRMActivityModal = closeCRMActivityModal;
      window.saveCRMActivity = saveCRMActivity;
      window.filterCRMContacts = filterCRMContacts;
      window.debounceCRMSearch = debounceCRMSearch;
      window.addSuggestionToCRM = addSuggestionToCRM;
      // ============== END AI CRM FUNCTIONS ==============
      
      // Expose Goals filter functions globally
      window.filterGoalsTable = filterGoalsTable;
      window.clearGoalsFilters = clearGoalsFilters;
      
      // Function to render Team To-Do List based on goals
      function renderTeamTodoList() {
        const container = document.getElementById('team-todo-list');
        if (!container || !allGoals.length) {
          if (container) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500"><i class="fas fa-clipboard-list text-4xl mb-3 text-gray-300"></i><p>No goals yet. Create goals to see your team to-do list.</p></div>';
          }
          return;
        }
        
        // Group goals by assigned user
        const byDRI = {};
        allGoals.forEach(goal => {
          const dri = goal.assigned_user_name || goal.dri || goal.creator_name || goal.user_name || 'Yo';
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
        
        // Apply filters
        let filteredGoals = filterGoalsList();
        
        if (!filteredGoals.length) {
          tbody.innerHTML = \`
            <tr>
              <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-bullseye text-4xl mb-2 text-gray-300"></i>
                <p>No goals found matching filters</p>
                <button onclick="clearGoalsFilters()" class="text-purple-600 text-sm mt-2 hover:underline">Clear filters</button>
              </td>
            </tr>
          \`;
          return;
        }

        // Populate DRI filter with unique DRIs
        const driSet = new Set();
        allGoals.forEach(g => {
          if (g.dri && g.dri !== '-') driSet.add(g.dri);
        });
        const driFilter = document.getElementById('goals-filter-dri');
        if (driFilter) {
          const currentValue = driFilter.value;
          driFilter.innerHTML = '<option value="">All DRIs</option>' + 
            Array.from(driSet).sort().map(dri => 
              '<option value="' + dri + '" ' + (dri === currentValue ? 'selected' : '') + '>' + dri + '</option>'
            ).join('');
        }

        // Group goals by category and sort by priority
        const categories = {};
        filteredGoals.forEach(goal => {
          const cat = goal.category || 'Build';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(goal);
        });

        tbody.innerHTML = Object.entries(categories).map(([category, goals]) => {
          const categoryColor = category === 'Build' ? 'bg-blue-50' : category === 'Test' ? 'bg-purple-50' : 'bg-green-50';
          
          // Sort by priority (P0 > P1 > P2 > P3) then by order_index
          const categoryRows = goals.sort((a, b) => {
            const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
            return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99) || (a.order_index || 0) - (b.order_index || 0);
          });

          return categoryRows.map((goal, idx) => {
            const categoryEmojis = {
              'Build': '🔨',
              'Test': '🧪',
              'Traction': '📈'
            };
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
                <td class="px-3 py-3 text-sm font-medium text-gray-900">\${idx === 0 ? (categoryEmojis[category] || '') + ' ' + category : ''}</td>
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
                <td class="px-2 py-3 text-sm text-gray-600 text-center">\${goal.assigned_user_name || goal.dri || '-'}</td>
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
      
      // Goals filtering functions
      function filterGoalsList() {
        const searchTerm = document.getElementById('goals-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('goals-filter-category')?.value || '';
        const priorityFilter = document.getElementById('goals-filter-priority')?.value || '';
        const statusFilter = document.getElementById('goals-filter-status')?.value || '';
        const driFilter = document.getElementById('goals-filter-dri')?.value || '';
        
        return allGoals.filter(goal => {
          // Search filter
          if (searchTerm) {
            const searchable = (goal.description || '') + ' ' + (goal.task || '') + ' ' + (goal.assigned_user_name || goal.dri || '');
            if (!searchable.toLowerCase().includes(searchTerm)) return false;
          }
          
          // Category filter
          if (categoryFilter && goal.category !== categoryFilter) return false;
          
          // Priority filter
          if (priorityFilter && goal.priority !== priorityFilter) return false;
          
          // Status filter
          if (statusFilter && goal.goal_status !== statusFilter) return false;
          
          // DRI filter
          if (driFilter && (goal.assigned_user_name || goal.dri) !== driFilter) return false;
          
          return true;
        });
      }
      
      function filterGoalsTable() {
        renderGoalsTable();
      }
      
      function clearGoalsFilters() {
        document.getElementById('goals-search').value = '';
        document.getElementById('goals-filter-category').value = '';
        document.getElementById('goals-filter-priority').value = '';
        document.getElementById('goals-filter-status').value = '';
        document.getElementById('goals-filter-dri').value = '';
        renderGoalsTable();
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
        let tasksForDay = allGoals.filter(goal => {
          let dates = parseScheduledDates(goal.scheduled_dates);
          return dates.includes(dateStr);
        });
        
        if (tasksForDay.length === 0) {
          alert('No tasks scheduled for ' + dateStr);
          return;
        }
        
        // Sort by priority_order number (1, 2, 3...)
        tasksForDay.sort((a, b) => {
          const orderA = a.priority_order ?? 999;
          const orderB = b.priority_order ?? 999;
          return orderA - orderB;
        });
        
        // Create modal content
        const formatDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const taskListHTML = tasksForDay.map((g, index) => {
          const isDone = g.goal_status === 'Done';
          const isWIP = g.goal_status === 'WIP';
          const currentOrder = g.priority_order ?? (index + 1);
          
          // Calculate day progress for multi-day tasks
          let scheduledDates = parseScheduledDates(g.scheduled_dates);
          const totalDays = scheduledDates.length;
          const currentDayIndex = scheduledDates.indexOf(dateStr) + 1;
          const dayProgress = totalDays > 1 ? \`\${currentDayIndex}/\${totalDays}\` : '';
          
          return \`
            <div class="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all">
              <div class="flex items-start gap-3">
                <!-- Priority number input with label -->
                <div class="flex flex-col items-center">
                  <label class="text-[10px] text-purple-600 font-semibold mb-1">Priority</label>
                  <input type="number" 
                         value="\${currentOrder}"
                         onchange="updateGoalPriorityOrder(\${g.id}, this.value, '\${dateStr}')"
                         onclick="event.stopPropagation()"
                         class="w-14 h-10 text-center border-2 border-purple-300 rounded-lg font-bold text-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                         min="1"
                         title="Priority order (lower = higher priority)">
                </div>
                
                <input type="checkbox" 
                       id="task-check-\${g.id}" 
                       \${isDone ? 'checked' : ''} 
                       onclick="event.stopPropagation()"
                       onchange="toggleTaskStatus(\${g.id}, this.checked)" 
                       class="mt-2 w-5 h-5 text-purple-600 rounded focus:ring-purple-500">
                
                <div class="flex-1 cursor-pointer" onclick="showGoalDetail(\${g.id})">
                  <!-- Full description FIRST -->
                  \${g.description && g.task !== g.description ? \`
                    <p class="text-sm text-gray-600 mb-2 font-medium">\${g.description}</p>
                  \` : ''}
                  
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-semibold \${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}">\${g.task || g.description}</span>
                    \${isDone ? '<span class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">✓ Done</span>' : ''}
                    \${isWIP ? '<span class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">⚡ WIP</span>' : ''}
                    \${dayProgress && isDone ? '<span class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">📅 Day ' + dayProgress + '</span>' : ''}
                    <i class="fas fa-arrow-right text-xs text-purple-400 ml-auto"></i>
                  </div>
                  
                  <!-- Meta info -->
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    \${g.priority ? '<span class="px-2 py-0.5 rounded-full bg-gray-100">' + g.priority + '</span>' : ''}
                    \${g.dri ? '<span><i class="fas fa-user-circle"></i> ' + g.dri + '</span>' : ''}
                    \${g.deadline ? '<span><i class="fas fa-calendar"></i> ' + new Date(g.deadline).toLocaleDateString() + '</span>' : ''}
                  </div>
                </div>
              </div>
            </div>
          \`;
        }).join('');
        
        // Show modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center';
        modal.innerHTML = \`
          <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 class="font-bold text-lg">Tasks for \${formatDate}</h3>
                <p class="text-sm text-purple-100">\${tasksForDay.length} task\${tasksForDay.length !== 1 ? 's' : ''} scheduled • Sorted by priority</p>
              </div>
              <button onclick="this.closest('.fixed').remove()" class="text-white/70 hover:text-white transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div class="space-y-2">
                \${taskListHTML}
              </div>
            </div>
            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-all">
                Close
              </button>
            </div>
          </div>
        \`;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.remove();
        });
      };
      
      window.updateGoalPriorityOrder = async function(goalId, orderValue, dateStr) {
        try {
          const order = parseInt(orderValue);
          if (isNaN(order) || order < 1) {
            alert('Please enter a valid priority number (1 or higher)');
            return;
          }
          
          // Check if this priority number is already used by another task on this day
          const tasksForDay = allGoals.filter(goal => {
            let dates = parseScheduledDates(goal.scheduled_dates);
            return dates.includes(dateStr) && goal.id !== goalId;
          });
          
          const isDuplicate = tasksForDay.some(task => task.priority_order === order);
          if (isDuplicate) {
            alert('Priority number ' + order + ' is already used by another task on this day. Please choose a different number.');
            return;
          }
          
          await axios.put('/api/dashboard/goals/' + goalId, { priority_order: order });
          
          // Update in local array
          const goal = allGoals.find(g => g.id === goalId);
          if (goal) {
            goal.priority_order = order;
          }
          
          // Update UI
          renderGoalsTable();
          updateCalendarOverview();
          
          console.log('[GOAL] Priority order updated:', { goalId, order });
        } catch (e) {
          console.error('Error updating priority order:', e);
          alert('Failed to update priority order');
        }
      };
      
      window.toggleTaskStatus = async function(goalId, isChecked) {
        try {
          const newStatus = isChecked ? 'Done' : 'WIP';
          await axios.put('/api/dashboard/goals/' + goalId, { goal_status: newStatus });
          
          // Update in local array
          const goal = allGoals.find(g => g.id === goalId);
          if (goal) {
            goal.goal_status = newStatus;
          }
          
          // Update UI
          renderGoalsTable();
          updateCalendarOverview();
          
          console.log('[GOAL] Status updated:', { goalId, newStatus });
        } catch (e) {
          console.error('Error updating task status:', e);
          alert('Failed to update task status');
        }
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
        document.getElementById('detail-dri').textContent = goal.assigned_user_name || goal.dri || goal.creator_name || goal.user_name || 'Yo';
        
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
        
        // Handle category-specific fields
        const hypothesisDetails = document.getElementById('hypothesis-details');
        const buildDetails = document.getElementById('build-details');
        const userLearningDetails = document.getElementById('user-learning-details');
        const insightDetails = document.getElementById('insight-details');
        const tractionDetails = document.getElementById('traction-details');
        
        // Hide all detail sections first
        hypothesisDetails.classList.add('hidden');
        buildDetails.classList.add('hidden');
        userLearningDetails.classList.add('hidden');
        insightDetails.classList.add('hidden');
        tractionDetails.classList.add('hidden');
        
        if (goal.category === 'hypothesis') {
          hypothesisDetails.classList.remove('hidden');
          
          document.getElementById('detail-expected-behavior').textContent = goal.hypothesis_expected_behavior || 'Not specified';
          document.getElementById('detail-validation-signal').textContent = goal.hypothesis_validation_signal || 'Not specified';
          
          // Hypothesis status badge
          const statusColors = {
            'testing': 'bg-yellow-100 text-yellow-800',
            'validated': 'bg-green-100 text-green-800',
            'invalidated': 'bg-red-100 text-red-800',
            'paused': 'bg-gray-100 text-gray-600'
          };
          const statusEl = document.getElementById('detail-hypothesis-status');
          statusEl.textContent = goal.hypothesis_status || 'testing';
          statusEl.className = 'px-2 py-1 text-xs font-medium rounded-full ' + (statusColors[goal.hypothesis_status] || statusColors['testing']);
          
          document.getElementById('detail-week-number').textContent = goal.week_number ? 'Week ' + goal.week_number + ' / ' + goal.year_number : 'N/A';
        } else if (goal.category === 'build') {
          buildDetails.classList.remove('hidden');
          
          document.getElementById('detail-tech-stack').textContent = goal.build_tech_stack || 'Not specified';
          document.getElementById('detail-hours-spent').textContent = goal.build_hours_spent ? goal.build_hours_spent + ' hours' : 'Not specified';
          
          // Link to hypothesis if exists
          if (goal.build_hypothesis_id) {
            const linkedHypothesis = allGoals.find(g => g.id === goal.build_hypothesis_id);
            if (linkedHypothesis) {
              document.getElementById('detail-hypothesis-link').innerHTML = \`<a href="#" onclick="event.preventDefault(); showGoalDetail(\${linkedHypothesis.id})" class="text-blue-600 hover:underline">#\${linkedHypothesis.id} - \${linkedHypothesis.description?.substring(0, 40) || 'View hypothesis'}...</a>\`;
            } else {
              document.getElementById('detail-hypothesis-link').textContent = 'Hypothesis #' + goal.build_hypothesis_id;
            }
          } else {
            document.getElementById('detail-hypothesis-link').textContent = 'Not linked';
          }
          
          document.getElementById('detail-build-week-number').textContent = goal.week_number ? 'Week ' + goal.week_number + ' / ' + goal.year_number : 'N/A';
        } else if (goal.category === 'user_learning') {
          userLearningDetails.classList.remove('hidden');
          
          document.getElementById('detail-users-spoken').textContent = goal.users_spoken || '0';
          document.getElementById('detail-users-used').textContent = goal.users_used_product || '0';
          document.getElementById('detail-users-details').textContent = goal.task || 'No details provided';
          document.getElementById('detail-key-learning').textContent = goal.key_learning || 'Not specified';
          document.getElementById('detail-user-week-number').textContent = goal.week_number ? 'Week ' + goal.week_number + ' / ' + goal.year_number : 'N/A';
        } else if (goal.category === 'insight') {
          insightDetails.classList.remove('hidden');
          
          document.getElementById('detail-users-interacted').textContent = goal.users_interacted || '0';
          document.getElementById('detail-repeated-actions').textContent = goal.repeated_actions || 'Not specified';
          document.getElementById('detail-drop-off-points').textContent = goal.drop_off_points || 'Not specified';
          document.getElementById('detail-key-insight').textContent = goal.key_insight || 'Not specified';
          document.getElementById('detail-insight-week-number').textContent = goal.week_number ? 'Week ' + goal.week_number + ' / ' + goal.year_number : 'N/A';
        } else if (goal.category === 'traction') {
          tractionDetails.classList.remove('hidden');
          
          // Display traction data - these come from goal_weekly_traction table via API join
          document.getElementById('detail-revenue').textContent = goal.traction_revenue ? '€' + goal.traction_revenue : '€0';
          document.getElementById('detail-new-users').textContent = goal.traction_new_users || '0';
          document.getElementById('detail-active-users').textContent = goal.traction_active_users || '0';
          document.getElementById('detail-churned').textContent = goal.traction_churned || '0';
          document.getElementById('detail-traction-signal').textContent = goal.traction_signal || goal.description || 'No signal specified';
          document.getElementById('detail-traction-week-number').textContent = goal.week_number ? 'Week ' + goal.week_number + ' / ' + goal.year_number : 'N/A';
          
          // Load historical traction data and render charts
          loadTractionCharts(goal.user_id);
        }
        
        // Show modal
        document.getElementById('goal-detail-modal').classList.remove('hidden');
        document.getElementById('goal-detail-modal').classList.add('flex');
      };
      
      // Traction charts instances
      let tractionRevenueChart = null;
      let tractionUserTypesChart = null;
      let tractionNetGrowthChart = null;
      let tractionAcquisitionChart = null;
      
      async function loadTractionCharts(userId) {
        try {
          const response = await fetch('/api/traction/metrics/' + userId + '?limit=12');
          const data = await response.json();
          
          if (!data.metrics || data.metrics.length === 0) {
            console.log('No traction data available for charts');
            document.getElementById('traction-charts-container').innerHTML = '<div class="bg-gray-50 p-6 rounded-lg text-center text-gray-500"><i class="fas fa-chart-line text-3xl mb-2"></i><p>No historical data yet. Track your weekly traction to see trends!</p></div>';
            return;
          }
          
          // Sort by week (oldest first for charts)
          const metrics = data.metrics.reverse();
          
          // Prepare data
          const labels = metrics.map(m => \`W\${m.week_number}\`);
          const revenueData = metrics.map(m => m.revenue_amount || 0);
          const activeUsersData = metrics.map(m => m.active_users || 0);
          const newUsersData = metrics.map(m => m.new_users || 0);
          const churnedData = metrics.map(m => m.churned_users || 0);
          const netGrowthData = metrics.map(m => (m.new_users || 0) - (m.churned_users || 0));
          
          // Destroy existing charts if they exist
          if (tractionRevenueChart) tractionRevenueChart.destroy();
          if (tractionUserTypesChart) tractionUserTypesChart.destroy();
          if (tractionNetGrowthChart) tractionNetGrowthChart.destroy();
          if (tractionAcquisitionChart) tractionAcquisitionChart.destroy();
          
          // 1. User Types Chart - Line chart with all 3 user types
          const userTypesCtx = document.getElementById('traction-user-types-chart');
          if (userTypesCtx) {
            tractionUserTypesChart = new Chart(userTypesCtx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [
                  {
                    label: 'New Users',
                    data: newUsersData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#10b981'
                  },
                  {
                    label: 'Active Users',
                    data: activeUsersData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3b82f6'
                  },
                  {
                    label: 'Churned',
                    data: churnedData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#ef4444'
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: { 
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15 }
                  }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }
            });
          }
          
          // 2. Net Growth Chart - Bar chart showing net user change
          const netGrowthCtx = document.getElementById('traction-net-growth-chart');
          if (netGrowthCtx) {
            tractionNetGrowthChart = new Chart(netGrowthCtx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Net Growth (New - Churned)',
                  data: netGrowthData,
                  backgroundColor: netGrowthData.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                  borderColor: netGrowthData.map(v => v >= 0 ? '#10b981' : '#ef4444'),
                  borderWidth: 2,
                  borderRadius: 6
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const v = context.parsed.y;
                        return v >= 0 ? '+' + v + ' users' : v + ' users';
                      }
                    }
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                  }
                }
              }
            });
          }
          
          // 3. Revenue Chart
          const revenueCtx = document.getElementById('traction-revenue-chart');
          if (revenueCtx) {
            tractionRevenueChart = new Chart(revenueCtx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Revenue (€)',
                  data: revenueData,
                  borderColor: '#ec4899',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  fill: true,
                  tension: 0.4,
                  borderWidth: 3,
                  pointRadius: 5,
                  pointHoverRadius: 8,
                  pointBackgroundColor: '#ec4899'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return '€' + context.parsed.y.toLocaleString();
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '€' + value;
                      }
                    }
                  }
                }
              }
            });
          }
          
          // 4. Weekly User Metrics Comparison (Grouped Bar)
          const acquisitionCtx = document.getElementById('traction-acquisition-chart');
          if (acquisitionCtx) {
            tractionAcquisitionChart = new Chart(acquisitionCtx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [
                  {
                    label: '👥 New Users',
                    data: newUsersData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                  },
                  {
                    label: '📱 Active Users',
                    data: activeUsersData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 4
                  },
                  {
                    label: '📉 Churned',
                    data: churnedData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: true,
                    position: 'top',
                    labels: { padding: 15 }
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                  },
                  x: {
                    grid: { display: false }
                  }
                }
              }
            });
          }
          
        } catch (error) {
          console.error('Error loading traction charts:', error);
        }
      }
      
      window.closeGoalDetailModal = function() {
        document.getElementById('goal-detail-modal').classList.add('hidden');
        document.getElementById('goal-detail-modal').classList.remove('flex');
        currentDetailGoalId = null;
        
        // Destroy charts when closing modal to prevent memory leaks
        if (tractionRevenueChart) {
          tractionRevenueChart.destroy();
          tractionRevenueChart = null;
        }
        if (tractionUserTypesChart) {
          tractionUserTypesChart.destroy();
          tractionUserTypesChart = null;
        }
        if (tractionNetGrowthChart) {
          tractionNetGrowthChart.destroy();
          tractionNetGrowthChart = null;
        }
        if (tractionAcquisitionChart) {
          tractionAcquisitionChart.destroy();
          tractionAcquisitionChart = null;
        }
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
        
        // Load team members and then populate form
        loadTeamMembers().then(() => {
          // Then populate with existing goal data
          document.getElementById('goal-description').value = goal.description || '';
          document.getElementById('goal-task').value = goal.task || '';
          document.getElementById('goal-category').value = goal.category || 'OTHER';
          document.getElementById('goal-priority').value = goal.priority || 'P2';
          document.getElementById('goal-cadence').value = goal.cadence || 'One time';
          document.getElementById('goal-status').value = goal.goal_status || 'To start';
          document.getElementById('goal-week').value = goal.week_of || '';
          
          // Set assigned user
          const assignedToSelect = document.getElementById('goal-assigned-to');
          if (assignedToSelect && goal.assigned_to_user_id) {
            assignedToSelect.value = goal.assigned_to_user_id;
          }
        });
        
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

      // Dashboard Traction Charts
      let dashboardUserTypesChart = null;
      let dashboardNetGrowthChart = null;
      let dashboardRevenueTrendChart = null;
      
      async function loadDashboardTractionCharts() {
        try {
          const currentUserId = getCurrentUserId();
          if (!currentUserId) {
            console.log('No user logged in for traction charts');
            return;
          }
          const response = await fetch('/api/traction/metrics/' + currentUserId + '?limit=12');
          const data = await response.json();
          
          // Update summary cards with totals
          if (data.metrics && data.metrics.length > 0) {
            const metrics = data.metrics;
            const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue_amount || 0), 0);
            const totalNew = metrics.reduce((sum, m) => sum + (m.new_users || 0), 0);
            const totalChurned = metrics.reduce((sum, m) => sum + (m.churned_users || 0), 0);
            const latestActive = metrics[0]?.active_users || 0;
            const netGrowth = totalNew - totalChurned;
            
            document.getElementById('traction-summary-revenue').textContent = '€' + totalRevenue.toLocaleString();
            document.getElementById('traction-summary-new').textContent = totalNew.toLocaleString();
            document.getElementById('traction-summary-active').textContent = latestActive.toLocaleString();
            document.getElementById('traction-summary-churned').textContent = totalChurned.toLocaleString();
            document.getElementById('traction-summary-net').textContent = (netGrowth >= 0 ? '+' : '') + netGrowth.toLocaleString();
            document.getElementById('traction-summary-net').className = 'text-2xl font-bold ' + (netGrowth >= 0 ? 'text-green-600' : 'text-red-600');
          }
          
          if (!data.metrics || data.metrics.length === 0) {
            // Show empty state
            const chartContainers = ['dashboard-user-types-chart', 'dashboard-net-growth-chart', 'dashboard-revenue-trend-chart'];
            chartContainers.forEach(id => {
              const container = document.getElementById(id)?.parentElement;
              if (container) {
                container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><div class="text-center"><i class="fas fa-chart-line text-4xl mb-2"></i><p class="text-sm">No traction data yet</p><p class="text-xs">Track your weekly metrics to see trends</p></div></div>';
              }
            });
            return;
          }
          
          // Sort oldest first for charts
          const metrics = data.metrics.reverse();
          const labels = metrics.map(m => 'W' + m.week_number);
          const newUsersData = metrics.map(m => m.new_users || 0);
          const activeUsersData = metrics.map(m => m.active_users || 0);
          const churnedData = metrics.map(m => m.churned_users || 0);
          const revenueData = metrics.map(m => m.revenue_amount || 0);
          const netGrowthData = metrics.map(m => (m.new_users || 0) - (m.churned_users || 0));
          
          // Destroy existing charts
          if (dashboardUserTypesChart) dashboardUserTypesChart.destroy();
          if (dashboardNetGrowthChart) dashboardNetGrowthChart.destroy();
          if (dashboardRevenueTrendChart) dashboardRevenueTrendChart.destroy();
          
          // 1. User Types Chart
          const userTypesCtx = document.getElementById('dashboard-user-types-chart');
          if (userTypesCtx) {
            dashboardUserTypesChart = new Chart(userTypesCtx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [
                  { label: 'New Users', data: newUsersData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: false, tension: 0.4, borderWidth: 3, pointRadius: 5 },
                  { label: 'Active Users', data: activeUsersData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: false, tension: 0.4, borderWidth: 3, pointRadius: 5 },
                  { label: 'Churned', data: churnedData, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: false, tension: 0.4, borderWidth: 3, pointRadius: 5 }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 15 } } },
                scales: { y: { beginAtZero: true } }
              }
            });
          }
          
          // 2. Net Growth Chart
          const netGrowthCtx = document.getElementById('dashboard-net-growth-chart');
          if (netGrowthCtx) {
            dashboardNetGrowthChart = new Chart(netGrowthCtx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Net Growth',
                  data: netGrowthData,
                  backgroundColor: netGrowthData.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                  borderColor: netGrowthData.map(v => v >= 0 ? '#10b981' : '#ef4444'),
                  borderWidth: 2,
                  borderRadius: 6
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
              }
            });
          }
          
          // 3. Revenue Trend Chart
          const revenueCtx = document.getElementById('dashboard-revenue-trend-chart');
          if (revenueCtx) {
            dashboardRevenueTrendChart = new Chart(revenueCtx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Revenue (€)',
                  data: revenueData,
                  borderColor: '#ec4899',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  fill: true,
                  tension: 0.4,
                  borderWidth: 3,
                  pointRadius: 5
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '€' + ctx.parsed.y.toLocaleString() } } },
                scales: { y: { beginAtZero: true, ticks: { callback: v => '€' + v } } }
              }
            });
          }
          
        } catch (error) {
          console.error('Error loading dashboard traction charts:', error);
        }
      }

      // Global variable to store team members
      let teamMembers = [];

      // Load team members for goal assignment
      async function loadTeamMembers() {
        try {
          const response = await axios.get('/api/dashboard/team-members');
          teamMembers = response.data.teamMembers || [];
          
          // Populate the dropdown
          const select = document.getElementById('goal-assigned-to');
          if (select) {
            select.innerHTML = '<option value="">Unassigned</option>';
            teamMembers.forEach(member => {
              const option = document.createElement('option');
              option.value = member.id;
              option.textContent = member.name || member.email;
              select.appendChild(option);
            });
          }
        } catch (error) {
          console.error('Error loading team members:', error);
          teamMembers = [];
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
        
        // Load team members
        loadTeamMembers();
        
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
          
          const assignedToUserId = document.getElementById('goal-assigned-to').value;
          
          const goalData = {
            description: document.getElementById('goal-description').value,
            task: document.getElementById('goal-task').value,
            category: document.getElementById('goal-category').value,
            priority: priority,
            priority_label: priorityLabels[priority],
            cadence: document.getElementById('goal-cadence').value,
            assigned_to_user_id: assignedToUserId ? parseInt(assignedToUserId) : null,
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

    <!-- Voice Weekly Check-in Modal -->
    <div id="voice-checkin-modal" class="hidden fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
      <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-2xl font-bold text-white mb-1">� AI Pitch Deck Check-in</h3>
              <p class="text-purple-100 text-sm">18 questions · 5 sections · 6 AI agents analyzing your week</p>
            </div>
            <button onclick="closeVoiceCheckin()" class="text-white/70 hover:text-white transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Language Selector -->
          <div class="flex items-center gap-3">
            <label class="text-white text-sm font-medium">Language:</label>
            <div class="flex gap-2">
              <button 
                onclick="setVoiceLanguage('en-US')" 
                id="lang-en"
                class="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm font-medium"
              >
                🇺🇸 English
              </button>
              <button 
                onclick="setVoiceLanguage('es-ES')" 
                id="lang-es"
                class="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm font-medium"
              >
                🇪🇸 Español
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="text-center mb-6">
            <div class="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i class="fas fa-robot text-purple-600 text-4xl"></i>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-2">Ready for your Pitch Deck?</h4>
            <p class="text-gray-600 mb-2">18 questions across 5 startup categories, analyzed by 6 specialized AI agents.</p>
            <div class="flex flex-wrap justify-center gap-2 mb-4">
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">🟡 Hypotheses</span>
              <span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">🟠 Build</span>
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">🔵 Users</span>
              <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">🟣 Metrics</span>
              <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">🟢 Traction</span>
            </div>
            <p class="text-gray-500 text-sm">Answer by voice or typing. AI auto-creates goals & extracts metrics.</p>
            
            <!-- Browser compatibility check -->
            <div id="voice-support-check" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p class="text-sm text-blue-800">
                <i class="fas fa-info-circle mr-2"></i>
                Checking browser compatibility...
              </p>
            </div>

            <button 
              onclick="startVoiceCheckin()"
              id="start-voice-btn"
              class="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-play mr-2"></i>
              Start Check-in
            </button>
          </div>

          <!-- Voice Agent Container (populated dynamically) -->
          <div id="voice-agent-container"></div>
        </div>
      </div>
    </div>

    <script>
      // Voice Weekly Check-in Functions
      let currentQuestionIndex = 0;
      let responses = {};
      let isListening = false;
      let isSpeaking = false;
      let recognition = null;
      let currentLanguage = 'en-US'; // Default language

      const WEEKLY_QUESTIONS_EN = [
        // === SECTION 1: HYPOTHESES (Monday) ===
        {
          id: 'hypotheses',
          question: "Welcome to your weekly Pitch Deck! Let's start with hypotheses. What are the 1 to 3 hypotheses you're testing this week?",
          category: '🟡 Hypotheses',
          section: 'hypothesis',
          sectionColor: 'yellow'
        },
        {
          id: 'expected_behavior',
          question: "What user behavior do you expect to see if your hypothesis is correct?",
          category: '🟡 Hypotheses',
          section: 'hypothesis',
          sectionColor: 'yellow'
        },
        {
          id: 'validation_signal',
          question: "How will you know a hypothesis is validated? What's the concrete signal?",
          category: '🟡 Hypotheses',
          section: 'hypothesis',
          sectionColor: 'yellow'
        },
        // === SECTION 2: BUILD (Tuesday) ===
        {
          id: 'build_progress',
          question: "Now about building. What part of the product did you build this week?",
          category: '🟠 Build',
          section: 'build',
          sectionColor: 'orange'
        },
        {
          id: 'tech_stack',
          question: "What tech stack or tools did you use?",
          category: '🟠 Build',
          section: 'build',
          sectionColor: 'orange'
        },
        {
          id: 'build_hours',
          question: "How many hours did you spend building this week?",
          category: '🟠 Build',
          section: 'build',
          sectionColor: 'orange'
        },
        // === SECTION 3: USERS (Wednesday) ===
        {
          id: 'users_talked',
          question: "Let's talk about users. How many users did you talk to this week?",
          category: '🔵 Users',
          section: 'users',
          sectionColor: 'blue'
        },
        {
          id: 'users_used_product',
          question: "How many actually used your product?",
          category: '🔵 Users',
          section: 'users',
          sectionColor: 'blue'
        },
        {
          id: 'key_learning',
          question: "What was the most important learning from users? One sentence.",
          category: '🔵 Users',
          section: 'users',
          sectionColor: 'blue'
        },
        // === SECTION 4: METRICS (Thursday) ===
        {
          id: 'daily_active_users',
          question: "Now metrics. How many users interacted with your product this week?",
          category: '🟣 Metrics',
          section: 'metrics',
          sectionColor: 'purple'
        },
        {
          id: 'repeated_actions',
          question: "What actions did users repeat most often?",
          category: '🟣 Metrics',
          section: 'metrics',
          sectionColor: 'purple'
        },
        {
          id: 'drop_off_points',
          question: "Where did users get stuck or drop off?",
          category: '🟣 Metrics',
          section: 'metrics',
          sectionColor: 'purple'
        },
        {
          id: 'product_insight',
          question: "What insight does this reveal about your product?",
          category: '🟣 Metrics',
          section: 'metrics',
          sectionColor: 'purple'
        },
        // === SECTION 5: TRACTION (Friday) ===
        {
          id: 'revenue',
          question: "Last section, traction! How much revenue did you generate this week?",
          category: '🟢 Traction',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'new_users',
          question: "How many new users did you acquire?",
          category: '🟢 Traction',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'active_users',
          question: "How many users were active this week?",
          category: '🟢 Traction',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'churned_users',
          question: "How many users churned?",
          category: '🟢 Traction',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'traction_signal',
          question: "What was the strongest traction signal this week?",
          category: '🟢 Traction',
          section: 'traction',
          sectionColor: 'green'
        }
      ];

      const WEEKLY_QUESTIONS_ES = [
        // === SECCIÓN 1: HIPÓTESIS (Lunes) ===
        {
          id: 'hypotheses',
          question: "¡Bienvenido a tu Pitch Deck semanal! Empecemos con hipótesis. ¿Cuáles son las 1 a 3 hipótesis que estás probando esta semana?",
          category: '🟡 Hipótesis',
          section: 'hypothesis',
          sectionColor: 'yellow'
        },
        {
          id: 'expected_behavior',
          question: "¿Qué comportamiento de usuario esperas ver si tu hipótesis es correcta?",
          category: '🟡 Hipótesis',
          section: 'hypothesis',
          sectionColor: 'yellow'
        },
        {
          id: 'validation_signal',
          question: "¿Cómo sabrás que una hipótesis está validada? ¿Cuál es la señal concreta?",
          category: '🟡 Hipótesis',
          section: 'hypothesis',
          sectionColor: 'yellow'
        },
        // === SECCIÓN 2: CONSTRUCCIÓN (Martes) ===
        {
          id: 'build_progress',
          question: "Ahora sobre construcción. ¿Qué parte del producto construiste esta semana?",
          category: '🟠 Construcción',
          section: 'build',
          sectionColor: 'orange'
        },
        {
          id: 'tech_stack',
          question: "¿Qué tecnologías o herramientas usaste?",
          category: '🟠 Construcción',
          section: 'build',
          sectionColor: 'orange'
        },
        {
          id: 'build_hours',
          question: "¿Cuántas horas dedicaste a construir esta semana?",
          category: '🟠 Construcción',
          section: 'build',
          sectionColor: 'orange'
        },
        // === SECCIÓN 3: USUARIOS (Miércoles) ===
        {
          id: 'users_talked',
          question: "Hablemos de usuarios. ¿Con cuántos usuarios hablaste esta semana?",
          category: '🔵 Usuarios',
          section: 'users',
          sectionColor: 'blue'
        },
        {
          id: 'users_used_product',
          question: "¿Cuántos usaron tu producto?",
          category: '🔵 Usuarios',
          section: 'users',
          sectionColor: 'blue'
        },
        {
          id: 'key_learning',
          question: "¿Cuál fue el aprendizaje más importante de los usuarios? En una frase.",
          category: '🔵 Usuarios',
          section: 'users',
          sectionColor: 'blue'
        },
        // === SECCIÓN 4: MÉTRICAS (Jueves) ===
        {
          id: 'daily_active_users',
          question: "Ahora métricas. ¿Cuántos usuarios interactuaron con tu producto esta semana?",
          category: '🟣 Métricas',
          section: 'metrics',
          sectionColor: 'purple'
        },
        {
          id: 'repeated_actions',
          question: "¿Qué acciones repitieron más los usuarios?",
          category: '🟣 Métricas',
          section: 'metrics',
          sectionColor: 'purple'
        },
        {
          id: 'drop_off_points',
          question: "¿Dónde se quedaron atascados o abandonaron los usuarios?",
          category: '🟣 Métricas',
          section: 'metrics',
          sectionColor: 'purple'
        },
        {
          id: 'product_insight',
          question: "¿Qué insight revela esto sobre tu producto?",
          category: '🟣 Métricas',
          section: 'metrics',
          sectionColor: 'purple'
        },
        // === SECCIÓN 5: TRACCIÓN (Viernes) ===
        {
          id: 'revenue',
          question: "¡Última sección, tracción! ¿Cuánto revenue generaste esta semana?",
          category: '🟢 Tracción',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'new_users',
          question: "¿Cuántos usuarios nuevos adquiriste?",
          category: '🟢 Tracción',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'active_users',
          question: "¿Cuántos usuarios estuvieron activos esta semana?",
          category: '🟢 Tracción',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'churned_users',
          question: "¿Cuántos usuarios se fueron (churned)?",
          category: '🟢 Tracción',
          section: 'traction',
          sectionColor: 'green'
        },
        {
          id: 'traction_signal',
          question: "¿Cuál fue la señal de tracción más fuerte esta semana?",
          category: '🟢 Tracción',
          section: 'traction',
          sectionColor: 'green'
        }
      ];

      let WEEKLY_QUESTIONS = WEEKLY_QUESTIONS_EN; // Default to English

      function setVoiceLanguage(lang) {
        currentLanguage = lang;
        WEEKLY_QUESTIONS = lang === 'es-ES' ? WEEKLY_QUESTIONS_ES : WEEKLY_QUESTIONS_EN;
        
        // Update UI
        document.getElementById('lang-en').className = lang === 'en-US' 
          ? 'px-4 py-2 bg-white text-purple-600 rounded-lg font-medium text-sm shadow-lg'
          : 'px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm font-medium';
        
        document.getElementById('lang-es').className = lang === 'es-ES'
          ? 'px-4 py-2 bg-white text-purple-600 rounded-lg font-medium text-sm shadow-lg'
          : 'px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm font-medium';
        
        console.log('[VOICE] Language set to:', lang);
      }

      function openVoiceCheckin() {
        document.getElementById('voice-checkin-modal').classList.remove('hidden');
        checkVoiceSupport();
      }

      function closeVoiceCheckin() {
        document.getElementById('voice-checkin-modal').classList.add('hidden');
        stopVoiceCheckin();
      }

      function checkVoiceSupport() {
        const supportCheck = document.getElementById('voice-support-check');
        const startBtn = document.getElementById('start-voice-btn');

        const hasSpeedSynthesis = 'speechSynthesis' in window;
        const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

        if (hasSpeedSynthesis && hasRecognition) {
          supportCheck.innerHTML = '<p class="text-sm text-green-800"><i class="fas fa-check-circle mr-2"></i>✅ Your browser supports voice features!</p>';
          supportCheck.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-4';
          startBtn.disabled = false;
        } else {
          supportCheck.innerHTML = '<p class="text-sm text-red-800"><i class="fas fa-exclamation-triangle mr-2"></i>⚠️ Voice features not supported. Please use Chrome, Edge, or Safari. You can still type your answers.</p>';
          supportCheck.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mb-4';
          startBtn.disabled = false; // Allow typing even without voice
        }
      }

      async function startVoiceCheckin() {
        currentQuestionIndex = 0;
        responses = {};
        
        const container = document.getElementById('voice-agent-container');
        container.innerHTML = \`
          <div class="border-t border-gray-200 pt-6">
            <div class="mb-6">
              <!-- Section indicators -->
              <div class="flex justify-center gap-2 mb-3">
                <span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">🟡 Hypotheses</span>
                <span class="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">🟠 Build</span>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">🔵 Users</span>
                <span class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">🟣 Metrics</span>
                <span class="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">🟢 Traction</span>
              </div>
              <!-- Progress bar -->
              <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div id="voice-progress-bar" class="bg-purple-600 rounded-full h-2 transition-all duration-500" style="width: 0%"></div>
              </div>
              <p class="text-sm text-gray-600 text-center">Question <span id="question-number">1</span> of \${WEEKLY_QUESTIONS.length} · Pitch Deck Mode 🎯</p>
            </div>

            <!-- Question Display -->
            <div id="voice-question-display" class="mb-6"></div>

            <!-- Voice Status -->
            <div id="voice-status" class="flex items-center justify-center gap-4 mb-6"></div>

            <!-- Manual Input -->
            <form onsubmit="submitVoiceAnswer(event)" class="space-y-4">
              <textarea 
                id="voice-answer-input"
                placeholder="Type your answer or click the microphone to speak..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows="3"
              ></textarea>
              <div class="flex gap-2">
                <button type="submit" class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
                  Next Question →
                </button>
                <button type="button" onclick="skipVoiceQuestion()" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Skip
                </button>
              </div>
            </form>
          </div>
        \`;

        askQuestion(0);
      }

      async function askQuestion(index) {
        console.log('[VOICE-ASK] Asking question index:', index);
        console.log('[VOICE-ASK] Current responses:', JSON.stringify(responses));
        
        if (index >= WEEKLY_QUESTIONS.length) {
          console.log('[VOICE-ASK] All questions done, calling completeVoiceCheckin');
          console.log('[VOICE-ASK] Final responses before complete:', JSON.stringify(responses));
          await completeVoiceCheckin();
          return;
        }

        currentQuestionIndex = index;
        const question = WEEKLY_QUESTIONS[index];
        
        // Update progress
        const progress = ((index / WEEKLY_QUESTIONS.length) * 100);
        document.getElementById('voice-progress-bar').style.width = progress + '%';
        document.getElementById('question-number').textContent = (index + 1);

        // Check if we're entering a new section
        const prevQuestion = index > 0 ? WEEKLY_QUESTIONS[index - 1] : null;
        const isNewSection = !prevQuestion || prevQuestion.section !== question.section;

        // Section color mapping
        const sectionColors = {
          yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
          orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
          blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
          purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
          green: 'from-green-500/20 to-green-600/10 border-green-500/30'
        };
        const sectionStyle = sectionColors[question.sectionColor] || sectionColors.purple;

        // Section badge for progress
        const sections = ['hypothesis', 'build', 'users', 'metrics', 'traction'];
        const sectionIndex = sections.indexOf(question.section);
        const sectionProgress = ((sectionIndex / sections.length) * 100);

        // Display question with optional section header
        const display = document.getElementById('voice-question-display');
        display.innerHTML = \`
          \${isNewSection ? \`
            <div class="mb-4 bg-gradient-to-r \${sectionStyle} border rounded-xl p-3 text-center animate-fade-in">
              <span class="text-lg font-bold">\${question.category}</span>
              <span class="text-xs ml-2 opacity-70">Section \${sectionIndex + 1}/5</span>
            </div>
          \` : ''}
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-robot text-purple-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <div class="bg-gray-50 rounded-2xl rounded-tl-none p-4">
                <span class="text-xs font-semibold text-purple-500 uppercase tracking-wide">\${question.category}</span>
                <p class="text-gray-800 font-medium mt-1">\${question.question}</p>
              </div>
            </div>
          </div>
        \`;

        // Speak question if supported
        if ('speechSynthesis' in window) {
          await speakText(question.question);
          
          // Auto-start listening after speaking (the speakText already has 3-second delay)
          if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            startListening();
          }
        } else {
          // If speech synthesis not supported, still allow voice input
          if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            setTimeout(() => startListening(), 500);
          }
        }
      }

      function speakText(text) {
        return new Promise((resolve) => {
          if (!('speechSynthesis' in window)) {
            resolve();
            return;
          }

          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = currentLanguage; // Use selected language
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          isSpeaking = true;
          updateVoiceStatus();

          utterance.onend = () => {
            isSpeaking = false;
            updateVoiceStatus();
            
            // Wait 3 seconds before resolving
            setTimeout(() => {
              resolve();
            }, 3000);
          };

          utterance.onerror = () => {
            isSpeaking = false;
            updateVoiceStatus();
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        });
      }

      function startListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) return;

        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage; // Use selected language
        recognition.continuous = true; // Keep listening continuously
        recognition.interimResults = true; // Show interim results
        recognition.maxAlternatives = 1;

        isListening = true;
        updateVoiceStatus();

        let finalTranscript = '';
        let silenceTimer = null;

        recognition.onresult = (event) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update input with current transcript
          document.getElementById('voice-answer-input').value = (finalTranscript + interimTranscript).trim();

          // Clear previous silence timer
          if (silenceTimer) clearTimeout(silenceTimer);

          // Set new silence timer (2 seconds of silence = done talking)
          silenceTimer = setTimeout(() => {
            if (finalTranscript.trim() || interimTranscript.trim()) {
              stopListening();
            }
          }, 2000);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          isListening = false;
          updateVoiceStatus();
        };

        recognition.onend = () => {
          isListening = false;
          updateVoiceStatus();
        };

        recognition.start();
      }

      function updateVoiceStatus() {
        const status = document.getElementById('voice-status');
        
        if (isSpeaking) {
          status.innerHTML = '<div class="flex items-center gap-2 text-purple-600"><div class="animate-pulse">🔊</div><span class="text-sm font-medium">Agent speaking...</span></div>';
        } else if (isListening) {
          status.innerHTML = \`
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-green-600">
                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-sm font-semibold">🎤 Listening... (speak now, pause when done)</span>
              </div>
              <button onclick="stopListening()" class="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Done Speaking</button>
            </div>
          \`;
        } else {
          status.innerHTML = '<div class="flex items-center gap-2 text-gray-500"><i class="fas fa-clock"></i><span class="text-sm">Waiting...</span></div>';
        }
      }

      function stopListening() {
        if (recognition) {
          recognition.stop();
        }
        isListening = false;
        updateVoiceStatus();
      }

      function submitVoiceAnswer(e) {
        e.preventDefault();
        const answer = document.getElementById('voice-answer-input').value.trim();
        
        if (!answer) {
          alert('Please provide an answer');
          return;
        }

        const question = WEEKLY_QUESTIONS[currentQuestionIndex];
        console.log('[VOICE-SUBMIT] Saving answer for question:', question.id);
        console.log('[VOICE-SUBMIT] Answer:', answer);
        responses[question.id] = answer;
        console.log('[VOICE-SUBMIT] Responses after save:', JSON.stringify(responses));
        console.log('[VOICE-SUBMIT] Responses keys:', Object.keys(responses));

        // Clear input
        document.getElementById('voice-answer-input').value = '';

        // Next question
        askQuestion(currentQuestionIndex + 1);
      }

      function skipVoiceQuestion() {
        const question = WEEKLY_QUESTIONS[currentQuestionIndex];
        console.log('[VOICE-SKIP] Skipping question:', question.id);
        responses[question.id] = '(skipped)';
        console.log('[VOICE-SKIP] Responses after skip:', JSON.stringify(responses));
        askQuestion(currentQuestionIndex + 1);
      }

      let pitchDeckAnalysis = null; // Store AI analysis results

      async function completeVoiceCheckin() {
        // Show analyzing state
        const container = document.getElementById('voice-agent-container');
        container.innerHTML = \`
          <div class="text-center py-8">
            <div class="text-5xl mb-4 animate-pulse">🤖</div>
            <h3 class="text-xl font-bold mb-2">Analyzing with AI Agents...</h3>
            <p class="text-gray-600 mb-4">6 specialized agents are reviewing your answers</p>
            <div class="flex justify-center gap-3 mb-6">
              <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium animate-pulse">🟡 Hypothesis Agent</span>
              <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium animate-pulse" style="animation-delay: 0.2s">🟠 Build Agent</span>
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium animate-pulse" style="animation-delay: 0.4s">🔵 User Learning Agent</span>
            </div>
            <div class="flex justify-center gap-3">
              <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium animate-pulse" style="animation-delay: 0.6s">🟣 Metrics Agent</span>
              <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium animate-pulse" style="animation-delay: 0.8s">🟢 Traction Agent</span>
              <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium animate-pulse" style="animation-delay: 1s">🧠 Orchestrator</span>
            </div>
          </div>
        \`;

        // Speak completion message
        const completionMessage = currentLanguage === 'es-ES'
          ? "Perfecto. Ahora nuestros 6 agentes de inteligencia artificial están analizando tus respuestas. Dame un momento."
          : "Perfect. Now our 6 AI agents are analyzing your responses. Give me a moment.";
        
        speakText(completionMessage); // Don't await, let it speak while we fetch

        // Save responses via multiagent endpoint
        try {
          const token = document.cookie.match(/authToken=([^;]+)/)?.[1];
          
          if (!token) {
            throw new Error('No authentication token found');
          }

          console.log('[PITCH-DECK] Preparing to send to multiagent system');
          console.log('[PITCH-DECK] Responses object:', responses);
          console.log('[PITCH-DECK] Response keys:', Object.keys(responses));

          const response = await fetch('/api/chat-agent/voice-pitch-deck', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              responses,
              language: currentLanguage,
              week: new Date().toISOString().split('T')[0]
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('[PITCH-DECK] Analysis complete:', result);
            pitchDeckAnalysis = result;
            
            // Refresh goals list to show auto-created goals
            if (typeof loadDashboardData === 'function') {
              console.log('[PITCH-DECK] Refreshing dashboard data...');
              await loadDashboardData();
            }
            
            // Speak the weekly summary
            const summaryMsg = currentLanguage === 'es-ES'
              ? \`Análisis completo. Tu puntuación semanal es \${result.analysis?.overall_score || 'pendiente'} de 100. Calificación: \${result.analysis?.week_rating || 'pendiente'}. \${result.analysis?.weekly_summary || 'Buen trabajo esta semana.'}\`
              : \`Analysis complete. Your weekly score is \${result.analysis?.overall_score || 'pending'} out of 100. Rating: \${result.analysis?.week_rating || 'pending'}. \${result.analysis?.weekly_summary || 'Great work this week.'}\`;
            
            await speakText(summaryMsg);
            
            // Show rich summary
            showVoiceSummary();
          } else {
            const errorData = await response.json();
            console.error('[PITCH-DECK] Server error:', errorData);
            throw new Error('Analysis failed: ' + (errorData.error || response.statusText));
          }
        } catch (error) {
          console.error('[PITCH-DECK] Error:', error);
          // Fallback: show basic summary even if AI fails
          pitchDeckAnalysis = null;
          showVoiceSummary();
        }
      }

      function showVoiceSummary() {
        const container = document.getElementById('voice-agent-container');
        const analysis = pitchDeckAnalysis?.analysis;
        const agents = analysis?.agents || {};
        const goalsCreated = pitchDeckAnalysis?.goalsCreated || 0;
        const metricsExtracted = pitchDeckAnalysis?.metricsSaved || 0;
        const weeklyScore = analysis?.overall_score || '—';
        const weekRating = analysis?.week_rating || 'N/A';
        const weeklySummary = analysis?.weekly_summary || '';
        const topStrength = analysis?.top_strength || '';
        const topRisk = analysis?.top_risk || '';

        // Color for score
        const scoreNum = parseFloat(weeklyScore) || 0;
        const scoreColor = scoreNum >= 70 ? 'text-green-400' : scoreNum >= 40 ? 'text-yellow-400' : 'text-red-400';
        const scoreGlow = scoreNum >= 70 ? 'shadow-green-500/50' : scoreNum >= 40 ? 'shadow-yellow-500/50' : 'shadow-red-500/50';

        // Agent analysis sections
        const agentSections = [
          { key: 'hypothesis', icon: '🟡', label: 'Hypothesis Agent', color: 'yellow' },
          { key: 'build', icon: '🟠', label: 'Build Agent', color: 'orange' },
          { key: 'users', icon: '🔵', label: 'User Learning Agent', color: 'blue' },
          { key: 'metrics', icon: '🟣', label: 'Metrics Agent', color: 'purple' },
          { key: 'traction', icon: '🟢', label: 'Traction Agent', color: 'green' }
        ];

        container.innerHTML = \`
          <div class="py-4">
            <!-- Header with Score -->
            <div class="text-center mb-6">
              <div class="inline-block bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 rounded-2xl p-6 shadow-lg \${scoreGlow}">
                <div class="text-6xl font-black \${scoreColor} mb-1">\${weeklyScore}<span class="text-2xl opacity-60">/10</span></div>
                <div class="text-sm font-semibold text-purple-300 uppercase tracking-wider">\${weekRating}</div>
              </div>
              <h3 class="text-xl font-bold mt-4 mb-1">🎯 Pitch Deck Analysis Complete</h3>
              \${weeklySummary ? \`<p class="text-gray-600 text-sm max-w-lg mx-auto">\${weeklySummary}</p>\` : ''}
            </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-3 gap-3 mb-6">
              <div class="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 text-center">
                <div class="text-2xl font-bold text-green-400">\${goalsCreated}</div>
                <div class="text-xs text-green-300/80">Goals Created</div>
              </div>
              <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3 text-center">
                <div class="text-2xl font-bold text-blue-400">\${metricsExtracted}</div>
                <div class="text-xs text-blue-300/80">Metrics Saved</div>
              </div>
              <div class="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-3 text-center">
                <div class="text-2xl font-bold text-purple-400">5</div>
                <div class="text-xs text-purple-300/80">AI Agents Used</div>
              </div>
            </div>

            <!-- Top Strength / Risk -->
            \${topStrength || topRisk ? \`
              <div class="grid grid-cols-2 gap-3 mb-6">
                \${topStrength ? \`
                  <div class="bg-green-50 rounded-xl p-3 border border-green-200">
                    <div class="text-xs font-semibold text-green-700 mb-1">💪 Top Strength</div>
                    <div class="text-xs text-green-600">\${topStrength}</div>
                  </div>
                \` : ''}
                \${topRisk ? \`
                  <div class="bg-red-50 rounded-xl p-3 border border-red-200">
                    <div class="text-xs font-semibold text-red-700 mb-1">⚠️ Top Risk</div>
                    <div class="text-xs text-red-600">\${topRisk}</div>
                  </div>
                \` : ''}
              </div>
            \` : ''}

            <!-- ASTAR Scores -->
            \${pitchDeckAnalysis?.weekly_scores ? \`
              <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <h4 class="font-semibold text-sm text-gray-700 mb-3">📊 ASTAR Weekly Scores</h4>
                <div class="grid grid-cols-2 gap-2">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Velocity of Learning</span>
                    <span class="font-bold text-sm text-purple-600">\${pitchDeckAnalysis.weekly_scores.velocity_of_learning || 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Depth of Usage</span>
                    <span class="font-bold text-sm text-purple-600">\${pitchDeckAnalysis.weekly_scores.depth_of_usage || 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Organic Pull</span>
                    <span class="font-bold text-sm text-purple-600">\${pitchDeckAnalysis.weekly_scores.organic_pull || 0}</span>
                  </div>
                  <div class="flex justify-between items-center bg-purple-50 rounded-lg px-2 py-1">
                    <span class="text-xs font-semibold text-purple-700">Overall Score</span>
                    <span class="font-black text-sm text-purple-700">\${pitchDeckAnalysis.weekly_scores.total_score || 0}/100</span>
                  </div>
                </div>
              </div>
            \` : ''}

            <!-- Agent Analysis Accordion -->
            <div class="space-y-2 mb-6">
              <h4 class="font-semibold text-sm text-gray-700 mb-2">🤖 Agent Reports</h4>
              \${agentSections.map(agent => {
                const agentData = agents[agent.key];
                if (!agentData) return '';
                const feedback = typeof agentData === 'string' ? agentData : (agentData.feedback || agentData.analysis || agentData.summary || JSON.stringify(agentData));
                const score = agentData.quality_score || agentData.productivity_score || agentData.engagement_score || agentData.depth_score || agentData.traction_score || '';
                return \`
                  <details class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <summary class="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>\${agent.icon}</span> \${agent.label} \${score ? \`<span class="ml-auto text-xs font-bold text-purple-600">\${score}/10</span>\` : ''}
                    </summary>
                    <div class="px-4 py-3 border-t border-gray-200 text-xs text-gray-600 leading-relaxed">
                      \${feedback}
                    </div>
                  </details>
                \`;
              }).join('')}
            </div>

            <!-- Auto-Created Goals -->
            \${pitchDeckAnalysis?.auto_goals?.length ? \`
              <div class="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
                <h4 class="font-semibold text-sm text-green-800 mb-2">✅ Auto-Created Goals (\${pitchDeckAnalysis.auto_goals.length})</h4>
                <ul class="space-y-1">
                  \${pitchDeckAnalysis.auto_goals.map(g => \`
                    <li class="text-xs text-green-700 flex items-start gap-2">
                      <span class="text-green-500 mt-0.5">•</span>
                      <span><strong>\${g.description || g.task || g}</strong> \${g.priority_label ? '— ' + g.priority_label : ''}</span>
                    </li>
                  \`).join('')}
                </ul>
              </div>
            \` : ''}

            <!-- Your Responses (collapsed by default) -->
            <details class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <summary class="font-semibold text-sm text-gray-700 cursor-pointer hover:text-purple-600">📝 Your Responses (click to expand)</summary>
              <div class="space-y-2 mt-3">
                \${WEEKLY_QUESTIONS.map((q, i) => \`
                  <div class="text-sm">
                    <span class="text-purple-600 font-medium text-xs">\${q.category} — \${q.id}:</span>
                    <p class="text-gray-700 ml-3 text-xs">\${responses[q.id] || '(no response)'}</p>
                  </div>
                \`).join('')}
              </div>
            </details>

            <button onclick="closeVoiceCheckin()" class="w-full px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-lg shadow-purple-500/30">
              Done — Back to Dashboard
            </button>
          </div>
        \`;
      }

      function stopVoiceCheckin() {
        if (recognition) {
          recognition.stop();
        }
        window.speechSynthesis.cancel();
        currentQuestionIndex = 0;
        responses = {};
        isListening = false;
        isSpeaking = false;
      }
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
