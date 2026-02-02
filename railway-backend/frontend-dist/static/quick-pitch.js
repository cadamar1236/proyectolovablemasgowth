// Quick Pitch - Simplified Customer Journey
// User flow: Pitch Idea → AI Analysis → Auto-create in Marketplace → Redirect to Dashboard

let isSubmitting = false;

// Initialize Quick Pitch Modal
function initQuickPitchModal() {
  const modal = document.getElementById('quick-pitch-modal');
  const btn = document.getElementById('quick-pitch-btn');
  const closeBtn = modal?.querySelector('.close-modal');

  if (btn) {
    btn.addEventListener('click', () => {
      openQuickPitchModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeQuickPitchModal();
    });
  }

  // Close on outside click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeQuickPitchModal();
    }
  });
}

function openQuickPitchModal() {
  const modal = document.getElementById('quick-pitch-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeQuickPitchModal() {
  const modal = document.getElementById('quick-pitch-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
    // Reset form
    document.getElementById('quick-pitch-form')?.reset();
    hideAllSteps();
    showStep(1);
  }
}

function showStep(step) {
  // Hide all steps
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (stepEl) {
      stepEl.classList.add('hidden');
    }
  }
  
  // Show current step
  const currentStep = document.getElementById(`step-${step}`);
  if (currentStep) {
    currentStep.classList.remove('hidden');
  }

  // Update progress bar
  updateProgressBar(step);
}

function hideAllSteps() {
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (stepEl) {
      stepEl.classList.add('hidden');
    }
  }
}

function updateProgressBar(step) {
  const progress = (step / 4) * 100;
  const progressBar = document.getElementById('pitch-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`progress-step-${i}`);
    if (indicator) {
      if (i < step) {
        indicator.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white font-bold';
        indicator.innerHTML = '<i class="fas fa-check text-sm"></i>';
      } else if (i === step) {
        indicator.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold';
        indicator.textContent = i;
      } else {
        indicator.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold';
        indicator.textContent = i;
      }
    }
  }
}

// Submit Quick Pitch
async function submitQuickPitch() {
  if (isSubmitting) return;

  const idea = document.getElementById('pitch-idea')?.value?.trim();
  const problem = document.getElementById('pitch-problem')?.value?.trim();
  const market = document.getElementById('pitch-market')?.value?.trim();

  if (!idea || !problem || !market) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  isSubmitting = true;
  showStep(2); // Show analyzing step

  try {
    const response = await axios.post('/api/quick-pitch/submit', {
      idea,
      problemSolving: problem,
      targetMarket: market,
      userId: currentUser?.id || null,
      email: currentUser?.email || null
    });

    if (response.data.success) {
      // Show success step
      displayAnalysisResults(response.data.analysis);
      showStep(3);

      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
        showStep(4);
        setTimeout(() => {
          closeQuickPitchModal();
          // Navigate to dashboard
          navigateToDashboard();
        }, 2000);
      }, 3000);
    } else {
      throw new Error(response.data.error || 'Failed to submit pitch');
    }
  } catch (error) {
    console.error('Error submitting pitch:', error);
    showToast('Error analyzing your idea. Please try again.', 'error');
    showStep(1); // Go back to form
  } finally {
    isSubmitting = false;
  }
}

function displayAnalysisResults(analysis) {
  const container = document.getElementById('analysis-results');
  if (!container || !analysis) return;

  const scoreColor = analysis.ai_score >= 80 ? 'text-green-600' : 
                     analysis.ai_score >= 60 ? 'text-blue-600' : 'text-orange-600';

  container.innerHTML = `
    <div class="space-y-6">
      <!-- AI Score -->
      <div class="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <div class="text-6xl font-bold ${scoreColor} mb-2">${analysis.ai_score}/100</div>
        <p class="text-gray-600 font-medium">AI Viability Score</p>
      </div>

      <!-- Title & Description -->
      <div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(analysis.title)}</h3>
        <p class="text-gray-600 leading-relaxed">${escapeHtml(analysis.description)}</p>
      </div>

      <!-- Value Proposition -->
      <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
        <p class="font-semibold text-purple-900 mb-1">💎 Value Proposition</p>
        <p class="text-purple-700">${escapeHtml(analysis.value_proposition)}</p>
      </div>

      <!-- Strengths -->
      ${analysis.strengths && analysis.strengths.length > 0 ? `
        <div>
          <p class="font-semibold text-gray-900 mb-2 flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            Strengths
          </p>
          <ul class="space-y-2">
            ${analysis.strengths.map(s => `
              <li class="flex items-start">
                <i class="fas fa-star text-yellow-500 mr-2 mt-1"></i>
                <span class="text-gray-700">${escapeHtml(s)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Opportunities -->
      ${analysis.opportunities && analysis.opportunities.length > 0 ? `
        <div>
          <p class="font-semibold text-gray-900 mb-2 flex items-center">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            Opportunities
          </p>
          <ul class="space-y-2">
            ${analysis.opportunities.map(o => `
              <li class="flex items-start">
                <i class="fas fa-arrow-right text-blue-500 mr-2 mt-1"></i>
                <span class="text-gray-700">${escapeHtml(o)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Category -->
      <div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
        <i class="fas fa-tag mr-2"></i>
        ${analysis.category || 'General'}
      </div>
    </div>
  `;
}

function navigateToDashboard() {
  // Switch to dashboard view
  const dashboardNav = document.querySelector('[onclick*="dashboard"]');
  if (dashboardNav) {
    dashboardNav.click();
  } else {
    // Fallback: reload with hash
    window.location.hash = 'dashboard';
    window.location.reload();
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initQuickPitchModal();
});
