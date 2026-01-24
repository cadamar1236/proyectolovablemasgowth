/**
 * Onboarding Chat Page
 * Interactive chatbot to collect user profile information based on role
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export interface OnboardingPageProps {
  userName: string;
  userEmail: string;
  userRole: string;
  userId: number;
  token: string;
}

export function getOnboardingPage(props: OnboardingPageProps): string {
  const { userName, userEmail, userRole, userId, token } = props;

  const content = `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">👋 Welcome, ${userName}!</h1>
          <p class="text-lg text-gray-600">Let's get to know you better</p>
        </div>

        <!-- Chat Container -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <!-- Chat Header -->
          <div class="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 px-6 py-5">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
                <span class="text-3xl">⭐</span>
              </div>
              <div>
                <h3 class="text-white font-bold text-lg">ASTAR* Assistant</h3>
                <p class="text-purple-100 text-sm">Your personal onboarding guide</p>
              </div>
              <div class="ml-auto">
                <div id="onboardingProgress" class="text-white text-sm font-semibold bg-white/20 px-4 py-2 rounded-full">
                  Step 1/5
                </div>
              </div>
            </div>
          </div>
          
          <!-- Chat Messages -->
          <div id="onboardingChatMessages" class="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            <!-- Initial message will be added by JavaScript -->
          </div>
          
          <!-- Chat Input -->
          <div class="border-t border-gray-200 p-6 bg-white">
            <div class="space-y-3">
              <!-- Quick Reply Buttons (shown for multiple choice) -->
              <div id="quickReplyButtons" class="hidden flex flex-wrap gap-2 mb-3"></div>
              
              <!-- Text Input -->
              <div class="flex items-center space-x-3">
                <input 
                  type="text" 
                  id="onboardingChatInput" 
                  placeholder="Type your answer..."
                  class="flex-1 px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  onkeypress="if(event.key==='Enter' && !event.shiftKey) { event.preventDefault(); sendOnboardingMessage(); }"
                />
                <button 
                  onclick="sendOnboardingMessage()" 
                  id="sendButton"
                  class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <span class="flex items-center space-x-2">
                    <span>Send</span>
                    <span>📤</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Onboarding state
      let currentStep = 0;
      let onboardingData = {
        role: '${userRole}',
        email: '${userEmail}',
        name: '${userName}'
      };
      let isTyping = false;
      let sessionId = 'onboarding_${userId}_' + Date.now();

      // Question flows based on role
      const onboardingFlows = {
        founder: [
          {
            question: "Great to have you here! 🚀 Let's start with your startup. What's the name of your company?",
            field: 'startup_name',
            type: 'text'
          },
          {
            question: "Awesome! What stage is {startup_name} currently at?",
            field: 'startup_stage',
            type: 'choice',
            options: [
              { label: '💡 Just an idea', value: 'idea' },
              { label: '🛠️ Building MVP', value: 'mvp' },
              { label: '💰 Early revenue', value: 'early_revenue' },
              { label: '📈 Scaling', value: 'scaling' },
              { label: '🏢 Established', value: 'established' }
            ]
          },
          {
            question: "What industry or sector does {startup_name} operate in?",
            field: 'industry',
            type: 'text',
            placeholder: 'e.g., FinTech, HealthTech, E-commerce, SaaS...'
          },
          {
            question: "What's your current funding status?",
            field: 'funding_status',
            type: 'choice',
            options: [
              { label: '🏠 Bootstrapped', value: 'bootstrapped' },
              { label: '🌱 Pre-seed', value: 'pre_seed' },
              { label: '🌿 Seed', value: 'seed' },
              { label: '🚀 Series A', value: 'series_a' },
              { label: '💫 Series B+', value: 'series_b_plus' }
            ]
          },
          {
            question: "How much funding are you looking to raise?",
            field: 'funding_goal',
            type: 'choice',
            options: [
              { label: 'Under $100K', value: 'under_100k' },
              { label: '$100K - $500K', value: '100k_500k' },
              { label: '$500K - $2M', value: '500k_2m' },
              { label: '$2M - $5M', value: '2m_5m' },
              { label: '$5M+', value: '5m_plus' },
              { label: 'Not fundraising', value: 'not_fundraising' }
            ]
          },
          {
            question: "Tell me about your team! How many people are working on {startup_name}?",
            field: 'team_size',
            type: 'choice',
            options: [
              { label: 'Just me (solo founder)', value: 'solo' },
              { label: '2-5 people', value: '2_5' },
              { label: '6-10 people', value: '6_10' },
              { label: '11-25 people', value: '11_25' },
              { label: '25+ people', value: '25_plus' }
            ]
          },
          {
            question: "Finally, where can I find your pitch deck? (Share a link or type 'none' if you don't have one yet)",
            field: 'pitch_deck_url',
            type: 'text',
            placeholder: 'https://...',
            optional: true
          }
        ],
        investor: [
          {
            question: "Excited to have an investor onboard! 💰 What type of investor are you?",
            field: 'investor_type',
            type: 'choice',
            options: [
              { label: '👼 Angel Investor', value: 'angel' },
              { label: '🏢 VC Fund', value: 'vc' },
              { label: '🏭 Corporate VC', value: 'corporate' },
              { label: '👨‍👩‍👧‍👦 Family Office', value: 'family_office' }
            ]
          },
          {
            question: "What stage of startups do you typically invest in?",
            field: 'investment_stage',
            type: 'choice',
            multiple: true,
            options: [
              { label: '🌱 Pre-seed', value: 'pre_seed' },
              { label: '🌿 Seed', value: 'seed' },
              { label: '🚀 Series A', value: 'series_a' },
              { label: '💫 Series B+', value: 'series_b_plus' }
            ]
          },
          {
            question: "What's your typical check size?",
            field: 'check_size',
            type: 'choice',
            options: [
              { label: '$10K - $50K', value: '10k_50k' },
              { label: '$50K - $250K', value: '50k_250k' },
              { label: '$250K - $1M', value: '250k_1m' },
              { label: '$1M - $5M', value: '1m_5m' },
              { label: '$5M+', value: '5m_plus' }
            ]
          },
          {
            question: "What industries or sectors are you most interested in? (comma-separated)",
            field: 'investment_focus',
            type: 'text',
            placeholder: 'e.g., FinTech, AI/ML, HealthTech, SaaS, Climate...'
          },
          {
            question: "What geographic regions do you focus on? (comma-separated)",
            field: 'geographic_focus',
            type: 'text',
            placeholder: 'e.g., North America, Europe, Latin America, Asia...'
          },
          {
            question: "Share some of your notable investments or portfolio companies (comma-separated, or 'none' if just starting)",
            field: 'notable_investments',
            type: 'text',
            placeholder: 'e.g., Company A, Company B, Company C...',
            optional: true
          }
        ],
        scout: [
          {
            question: "Welcome, talent scout! 🔍 Which VC firm or angel group are you scouting for?",
            field: 'scout_for',
            type: 'text'
          },
          {
            question: "What types of startups or founders are you looking for? (comma-separated)",
            field: 'scout_focus',
            type: 'text',
            placeholder: 'e.g., AI startups, technical founders, B2B SaaS...'
          },
          {
            question: "What's your commission structure?",
            field: 'scout_commission',
            type: 'choice',
            options: [
              { label: 'Equity in deals', value: 'equity' },
              { label: 'Cash commission', value: 'cash' },
              { label: 'Hybrid (equity + cash)', value: 'hybrid' },
              { label: 'Prefer not to say', value: 'not_specified' }
            ]
          },
          {
            question: "How many deals have you closed so far?",
            field: 'deals_closed',
            type: 'choice',
            options: [
              { label: 'Just starting out', value: '0' },
              { label: '1-5 deals', value: '1_5' },
              { label: '6-15 deals', value: '6_15' },
              { label: '15+ deals', value: '15_plus' }
            ]
          }
        ],
        partner: [
          {
            question: "Great to have a partner here! 🤝 What type of partner are you?",
            field: 'partner_type',
            type: 'choice',
            options: [
              { label: '💼 Service Provider', value: 'service_provider' },
              { label: '📦 Distributor', value: 'distributor' },
              { label: '⚡ Technology Partner', value: 'technology' },
              { label: '🎯 Strategic Partner', value: 'strategic' }
            ]
          },
          {
            question: "What services or capabilities do you offer? (comma-separated)",
            field: 'services_offered',
            type: 'text',
            placeholder: 'e.g., Legal, Marketing, Development, Cloud Infrastructure...'
          },
          {
            question: "Who are your ideal clients?",
            field: 'target_clients',
            type: 'choice',
            options: [
              { label: '🚀 Startups', value: 'startups' },
              { label: '🏢 Enterprises', value: 'enterprises' },
              { label: '🌐 Both', value: 'both' }
            ]
          },
          {
            question: "Share any case studies or success stories (or type 'building portfolio')",
            field: 'case_studies',
            type: 'text',
            placeholder: 'Describe 1-2 successful projects...',
            optional: true
          }
        ],
        job_seeker: [
          {
            question: "Awesome to have you! 👨‍💻 What's your current or desired job title?",
            field: 'job_title',
            type: 'text',
            placeholder: 'e.g., Full Stack Developer, Product Manager, Growth Marketer...'
          },
          {
            question: "How many years of experience do you have?",
            field: 'experience_years',
            type: 'choice',
            options: [
              { label: '< 1 year', value: 'entry' },
              { label: '1-3 years', value: 'junior' },
              { label: '3-5 years', value: 'mid' },
              { label: '5-10 years', value: 'senior' },
              { label: '10+ years', value: 'expert' }
            ]
          },
          {
            question: "What are your key skills? (comma-separated)",
            field: 'skills',
            type: 'text',
            placeholder: 'e.g., React, Python, Product Strategy, SEO, Sales...'
          },
          {
            question: "What type of role are you looking for?",
            field: 'looking_for',
            type: 'choice',
            multiple: true,
            options: [
              { label: '💼 Full-time', value: 'full_time' },
              { label: '⏰ Part-time', value: 'part_time' },
              { label: '📄 Contract', value: 'contract' },
              { label: '🎯 Advisory', value: 'advisory' }
            ]
          },
          {
            question: "Share your portfolio, GitHub, or resume link (optional)",
            field: 'portfolio_url',
            type: 'text',
            placeholder: 'https://...',
            optional: true
          }
        ],
        other: [
          {
            question: "Welcome! Tell me a bit about what brings you to ASTAR*?",
            field: 'bio',
            type: 'text',
            placeholder: 'Share your interests, goals, or what you hope to find here...'
          },
          {
            question: "What industry or field are you interested in?",
            field: 'industry',
            type: 'text',
            placeholder: 'e.g., Technology, Healthcare, Finance, Education...'
          },
          {
            question: "What's your current role or profession?",
            field: 'company',
            type: 'text',
            placeholder: 'e.g., Student, Consultant, Entrepreneur...'
          }
        ]
      };

      // Get current question flow
      const questions = onboardingFlows[onboardingData.role] || onboardingFlows.other;
      const totalSteps = questions.length;

      // Initialize onboarding
      window.addEventListener('load', () => {
        showNextQuestion();
      });

      function showNextQuestion() {
        if (currentStep >= questions.length) {
          completeOnboarding();
          return;
        }

        const question = questions[currentStep];
        let questionText = question.question;

        // Replace placeholders with actual data
        Object.keys(onboardingData).forEach(key => {
          questionText = questionText.replace(\`{\${key}}\`, onboardingData[key]);
        });

        // Update progress
        document.getElementById('onboardingProgress').textContent = \`Step \${currentStep + 1}/\${totalSteps}\`;

        // Add bot message
        setTimeout(() => {
          addOnboardingMessage('assistant', questionText);

          // Show quick reply buttons for choice questions
          if (question.type === 'choice') {
            showQuickReplyButtons(question.options, question.multiple);
          } else {
            hideQuickReplyButtons();
            document.getElementById('onboardingChatInput').placeholder = question.placeholder || 'Type your answer...';
          }
        }, 500);
      }

      function showQuickReplyButtons(options, multiple = false) {
        const container = document.getElementById('quickReplyButtons');
        container.classList.remove('hidden');
        container.innerHTML = options.map((opt, idx) => \`
          <button 
            data-quick-reply-index="\${idx}"
            class="quick-reply-btn px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-lg font-medium transition-all border border-purple-200 hover:border-purple-300"
          >
            \${opt.label}
          </button>
        \`).join('');
        
        // Add click event listeners to buttons
        container.querySelectorAll('.quick-reply-btn').forEach((btn, idx) => {
          btn.addEventListener('click', () => {
            handleQuickReply(options[idx].value, options[idx].label, multiple);
          });
        });
        
        // Hide text input for single choice
        if (!multiple) {
          document.getElementById('onboardingChatInput').style.display = 'none';
          document.getElementById('sendButton').style.display = 'none';
        }
      }

      function hideQuickReplyButtons() {
        const container = document.getElementById('quickReplyButtons');
        container.classList.add('hidden');
        container.innerHTML = '';
        document.getElementById('onboardingChatInput').style.display = 'block';
        document.getElementById('sendButton').style.display = 'block';
      }

      function handleQuickReply(value, label, multiple) {
        if (multiple) {
          // For multiple choice, allow selecting multiple then pressing send
          // TODO: implement multi-select logic
          return;
        }

        // For single choice, immediately proceed
        const question = questions[currentStep];
        onboardingData[question.field] = value;
        
        addOnboardingMessage('user', label);
        hideQuickReplyButtons();
        
        currentStep++;
        setTimeout(() => showNextQuestion(), 800);
      };

      window.sendOnboardingMessage = async function() {
        const input = document.getElementById('onboardingChatInput');
        const message = input.value.trim();
        
        if (!message || isTyping) return;
        
        const question = questions[currentStep];
        
        // Validate required fields
        if (!question.optional && message.toLowerCase() === 'skip') {
          addOnboardingMessage('error', 'This field is required. Please provide an answer.');
          return;
        }

        // Store answer
        if (question.field) {
          // Parse comma-separated values for array fields
          if (['investment_focus', 'geographic_focus', 'notable_investments', 'scout_focus', 'services_offered', 'case_studies', 'skills'].includes(question.field)) {
            onboardingData[question.field] = message.split(',').map(s => s.trim()).filter(Boolean);
          } else {
            onboardingData[question.field] = message;
          }
        }

        // Add user message
        addOnboardingMessage('user', message);
        input.value = '';
        
        currentStep++;
        setTimeout(() => showNextQuestion(), 800);
      };

      function addOnboardingMessage(type, content) {
        const messagesDiv = document.getElementById('onboardingChatMessages');
        const timestamp = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'user') {
          const messageHtml = \`
            <div class="flex items-start space-x-3 justify-end animate-fade-in">
              <div class="flex-1 max-w-lg">
                <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg p-4">
                  <p class="whitespace-pre-wrap">\${content}</p>
                </div>
                <div class="text-xs text-gray-400 mt-1 text-right">\${timestamp}</div>
              </div>
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0 shadow-md">
                <span class="text-white text-lg">👤</span>
              </div>
            </div>
          \`;
          messagesDiv.insertAdjacentHTML('beforeend', messageHtml);
        } else if (type === 'assistant') {
          const messageHtml = \`
            <div class="flex items-start space-x-3 animate-fade-in">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <span class="text-white text-lg">⭐</span>
              </div>
              <div class="flex-1">
                <div class="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                  <p class="text-gray-800 whitespace-pre-wrap">\${content}</p>
                </div>
                <div class="text-xs text-gray-400 mt-1">\${timestamp}</div>
              </div>
            </div>
          \`;
          messagesDiv.insertAdjacentHTML('beforeend', messageHtml);
        } else if (type === 'error') {
          const messageHtml = \`
            <div class="flex items-center justify-center">
              <div class="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm border border-red-200">
                ⚠️ \${content}
              </div>
            </div>
          \`;
          messagesDiv.insertAdjacentHTML('beforeend', messageHtml);
        }
        
        // Auto-scroll
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }

      async function completeOnboarding() {
        addOnboardingMessage('assistant', \`🎉 Perfect! Thanks for sharing all that information. I'm setting up your personalized experience now...\`);
        
        try {
          const response = await fetch('/api/auth/complete-onboarding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${token}'
            },
            body: JSON.stringify(onboardingData)
          });

          const result = await response.json();
          
          if (result.success) {
            setTimeout(() => {
              addOnboardingMessage('assistant', \`✅ All set! Redirecting you to your dashboard...\`);
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
            }, 1000);
          } else {
            addOnboardingMessage('error', 'There was an error saving your profile. Redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          }
        } catch (error) {
          console.error('Error completing onboarding:', error);
          addOnboardingMessage('error', 'There was an error. Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        }
      }
    </script>

    <style>
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    </style>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome - ASTAR* Onboarding</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}
