/**
 * Competition Leaderboard Page
 * Shows ranking of participants in a specific competition
 */

export interface CompetitionLeaderboardProps {
  competitionId: string;
  competitionTitle: string;
  competitionDescription: string;
  prizeAmount: string;
  participants: any[];
}

export function getCompetitionLeaderboard(props: CompetitionLeaderboardProps): string {
  const { competitionId, competitionTitle, competitionDescription, prizeAmount, participants } = props;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏆 ${competitionTitle} - Leaderboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#8B5CF6',
              secondary: '#A78BFA',
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .text-gradient {
        background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
      }
      
      .nav-blur {
        backdrop-filter: blur(12px);
        background-color: rgba(0, 0, 0, 0.9);
      }

      .rank-1 { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); }
      .rank-2 { background: linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%); }
      .rank-3 { background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%); }
    </style>
</head>
<body class="bg-black min-h-screen">
    <!-- Navigation -->
    <nav class="nav-blur sticky top-0 z-50 border-b border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-black text-gradient">
                        <i class="fas fa-rocket mr-2"></i>ASTAR*
                    </a>
                </div>
                
                <div class="flex items-center space-x-4">
                    <a href="/competitions" class="text-gray-300 hover:text-white transition font-semibold">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Competitions
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-5xl font-black mb-4">
                🏆 ${competitionTitle}
            </h1>
            <p class="text-xl opacity-90 mb-4">${competitionDescription}</p>
            ${prizeAmount ? `<div class="inline-block bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-lg">
                Prize: ${prizeAmount}
            </div>` : ''}
        </div>
    </div>

    <!-- Leaderboard -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        ${participants.length === 0 ? `
            <div class="text-center py-20">
                <i class="fas fa-users text-6xl text-gray-600 mb-4"></i>
                <h2 class="text-2xl font-bold text-white mb-2">No Participants Yet</h2>
                <p class="text-gray-400">Be the first to join this competition!</p>
            </div>
        ` : `
            <div class="space-y-4">
                ${participants.map((p, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'bg-gray-800';
                  
                  return `
                    <div class="card-hover ${rankClass} rounded-lg p-6 ${isTopThree ? 'border-2 border-yellow-400' : ''}">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4 flex-1">
                          <div class="text-4xl font-black ${isTopThree ? 'text-white' : 'text-purple-400'}">
                            ${medal || `#${rank}`}
                          </div>
                          
                          <div class="flex items-center space-x-3 flex-1">
                            <img src="${p.avatar_url || '/default-avatar.png'}" alt="${p.name}" 
                                 class="w-16 h-16 rounded-full border-4 ${isTopThree ? 'border-white' : 'border-purple-500'}">
                            <div class="flex-1">
                              <h3 class="text-xl font-bold ${isTopThree ? 'text-white' : 'text-white'}">${p.name}</h3>
                              <p class="text-sm ${isTopThree ? 'text-white opacity-90' : 'text-gray-400'}">${p.startup_name || p.project_title || 'Startup'}</p>
                              ${p.project_description ? `
                                <p class="text-xs ${isTopThree ? 'text-white opacity-80' : 'text-gray-500'} mt-1 line-clamp-2">
                                  ${p.project_description.substring(0, 150)}...
                                </p>
                              ` : ''}
                            </div>
                          </div>
                        </div>

                        <div class="flex flex-col items-end space-y-2">
                          ${p.payment_status === 'completed' ? `
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${isTopThree ? 'bg-white text-black' : 'bg-green-500 text-white'}">
                              <i class="fas fa-check-circle mr-1"></i>Verified
                            </span>
                          ` : ''}
                          ${p.pitch_deck_url ? `
                            <a href="${p.pitch_deck_url}" target="_blank" 
                               class="px-3 py-1 rounded-lg text-xs font-semibold ${isTopThree ? 'bg-white text-black' : 'bg-purple-600 text-white'} hover:opacity-80 transition">
                              <i class="fas fa-link mr-1"></i>Pitch Deck
                            </a>
                          ` : ''}
                          <span class="text-xs ${isTopThree ? 'text-white opacity-70' : 'text-gray-500'}">
                            ${new Date(p.registration_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      ${p.submission_notes ? `
                        <div class="mt-4 pt-4 border-t ${isTopThree ? 'border-white border-opacity-30' : 'border-gray-700'}">
                          <p class="text-sm ${isTopThree ? 'text-white opacity-90' : 'text-gray-300'} italic">
                            "${p.submission_notes}"
                          </p>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
            </div>
        `}
    </div>

    <!-- Footer -->
    <div class="bg-gray-900 py-8 mt-20">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-gray-400">
                Powered by <span class="text-gradient font-bold">ASTAR*</span>
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
