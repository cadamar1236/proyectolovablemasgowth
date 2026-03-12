/**
 * ASTAR* Lifetime Deal Pricing Page
 * Three tiers: Solo Founder ($79), Growth Founder ($149), Scale Founder ($299)
 */

export function PricingPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing - ASTAR* Lifetime Deal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .pricing-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pricing-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .popular-badge {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  </style>
</head>
<body class="font-sans antialiased">
  
  <!-- Header -->
  <nav class="bg-white/10 backdrop-blur-md border-b border-white/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <a href="/" class="flex items-center space-x-2">
          <span class="text-2xl font-bold text-white">⭐ ASTAR*</span>
        </a>
        <div class="flex items-center space-x-4">
          <a href="/pitch-deck" class="text-white/90 hover:text-white transition">Try It Free</a>
          <a href="/dashboard" class="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">Login</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold text-white mb-4">
        🚀 Lifetime Deal Pricing
      </h1>
      <p class="text-xl text-white/90 mb-2">
        Pay once. Use forever. Build faster.
      </p>
      <p class="text-white/70 max-w-2xl mx-auto">
        Join 500+ founders who stopped wasting time and started shipping. No subscriptions, no surprises.
      </p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      <!-- Tier 1: Solo Founder -->
      <div class="pricing-card bg-white rounded-2xl p-8 shadow-xl">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Solo Founder</h3>
          <div class="flex items-baseline justify-center mb-2">
            <span class="text-5xl font-bold text-purple-600">$79</span>
            <span class="text-gray-500 ml-2">one-time</span>
          </div>
          <p class="text-sm text-gray-600">Perfect for bootstrapped solo founders</p>
        </div>

        <div class="space-y-3 mb-8">
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Unlimited daily AI check-ins</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Execution dashboard with streaks</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Goal management (up to 3 active)</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Weekly reflection AI sessions</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Founder community access</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">All future core updates</span>
          </div>
        </div>

        <div class="space-y-2 mb-6 text-sm text-gray-600">
          <div class="flex items-center">
            <i class="fas fa-minus-circle text-gray-400 mr-2"></i>
            <span>5 AI recommendations/month</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-minus-circle text-gray-400 mr-2"></i>
            <span>Solo user only</span>
          </div>
        </div>

        <button onclick="selectPlan('solo')" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          Get Solo Plan
        </button>

        <p class="text-xs text-center text-gray-500 mt-4">
          Saves $348 in Year 1 vs $29/month
        </p>
      </div>

      <!-- Tier 2: Growth Founder (POPULAR) -->
      <div class="pricing-card bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl relative transform scale-105">
        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span class="popular-badge px-6 py-2 rounded-full text-white text-sm font-bold shadow-lg">
            ⭐ RECOMMENDED
          </span>
        </div>

        <div class="text-center mb-6 mt-4">
          <h3 class="text-2xl font-bold text-white mb-2">Growth Founder</h3>
          <div class="flex items-baseline justify-center mb-2">
            <span class="text-5xl font-bold text-white">$149</span>
            <span class="text-white/70 ml-2">one-time</span>
          </div>
          <p class="text-sm text-white/80">For founders seeking traction or fundraising</p>
        </div>

        <div class="space-y-3 mb-8 text-white">
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span><strong>Everything in Solo</strong> PLUS:</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span>Unlimited active goals & projects</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span>Advanced analytics dashboard</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span>Team collaboration (up to 3)</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span>Unlimited AI strategy</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span>Priority support (24h)</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-300 mt-1 mr-3"></i>
            <span>Monthly accountability sessions</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-star text-yellow-300 mt-1 mr-3"></i>
            <span><strong>Bonus:</strong> Cofounder matching + VC competition</span>
          </div>
        </div>

        <button onclick="selectPlan('growth')" class="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg">
          Get Growth Plan
        </button>

        <p class="text-xs text-center text-white/70 mt-4">
          Saves $799 net in Year 1 vs $69/month
        </p>
      </div>

      <!-- Tier 3: Scale Founder -->
      <div class="pricing-card bg-white rounded-2xl p-8 shadow-xl">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Scale Founder</h3>
          <div class="flex items-baseline justify-center mb-2">
            <span class="text-5xl font-bold text-purple-600">$299</span>
            <span class="text-gray-500 ml-2">one-time</span>
          </div>
          <p class="text-sm text-gray-600">For teams scaling to Series A</p>
        </div>

        <div class="space-y-3 mb-8">
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700"><strong>Everything in Growth</strong> PLUS:</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Unlimited team (up to 10)</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">White-glove onboarding (1h call)</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Quarterly strategy sessions</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Custom playbooks for your stage</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">Auto-generate investor updates</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700">API access (Q3 2026)</span>
          </div>
          <div class="flex items-start">
            <i class="fas fa-star text-purple-500 mt-1 mr-3"></i>
            <span class="text-gray-700"><strong>Featured</strong> community listing</span>
          </div>
        </div>

        <button onclick="selectPlan('scale')" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          Get Scale Plan
        </button>

        <p class="text-xs text-center text-gray-500 mt-4">
          Best for 2-5 person founding teams
        </p>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="max-w-3xl mx-auto mt-20">
      <h2 class="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
      
      <div class="space-y-4">
        <details class="bg-white/10 backdrop-blur-md rounded-lg p-6 cursor-pointer">
          <summary class="text-white font-semibold text-lg">What happens after I pay?</summary>
          <p class="text-white/80 mt-4">Instant access! You'll receive login credentials via email within 60 seconds. Your plan is activated for life - no recurring charges, ever.</p>
        </details>

        <details class="bg-white/10 backdrop-blur-md rounded-lg p-6 cursor-pointer">
          <summary class="text-white font-semibold text-lg">Can I upgrade later?</summary>
          <p class="text-white/80 mt-4">Yes! You can upgrade anytime by paying the difference between tiers. For example, upgrade from Solo ($79) to Growth ($149) for just $70.</p>
        </details>

        <details class="bg-white/10 backdrop-blur-md rounded-lg p-6 cursor-pointer">
          <summary class="text-white font-semibold text-lg">Is this really lifetime access?</summary>
          <p class="text-white/80 mt-4">Absolutely. As long as ASTAR* exists, you have access. All core features and updates are included. The only exceptions are enterprise integrations or custom white-label solutions.</p>
        </details>

        <details class="bg-white/10 backdrop-blur-md rounded-lg p-6 cursor-pointer">
          <summary class="text-white font-semibold text-lg">What if I don't like it?</summary>
          <p class="text-white/80 mt-4">60-day money-back guarantee. If ASTAR* doesn't help you ship faster, we'll refund you - no questions asked.</p>
        </details>

        <details class="bg-white/10 backdrop-blur-md rounded-lg p-6 cursor-pointer">
          <summary class="text-white font-semibold text-lg">How is this different from the free trial?</summary>
          <p class="text-white/80 mt-4">The free trial gives you 7 days with unlimited access. After that, you need a paid plan to continue. LTD plans give you lifetime access with no recurring fees.</p>
        </details>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="text-center mt-20 mb-12">
      <p class="text-white/90 text-lg mb-4">
        Still unsure? <a href="/pitch-deck" class="underline font-semibold">Try it free first</a>
      </p>
      <p class="text-white/70 text-sm">
        🔒 Secure payment via Stripe • 💳 All major cards accepted
      </p>
    </div>
  </div>

  <script>
    function selectPlan(tier) {
      const plans = {
        solo: { name: 'Solo Founder', price: 79 },
        growth: { name: 'Growth Founder', price: 149 },
        scale: { name: 'Scale Founder', price: 299 }
      };
      
      const plan = plans[tier];
      
      // Store selected plan in session
      sessionStorage.setItem('selectedPlan', JSON.stringify({ tier, ...plan }));
      
      // Redirect to checkout (you'll need to implement Stripe checkout)
      window.location.href = '/checkout?plan=' + tier;
    }
  </script>
</body>
</html>
  `;
}
