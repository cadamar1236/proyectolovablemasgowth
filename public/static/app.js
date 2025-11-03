// Global state
let currentUser = { id: 1, name: 'Juan Founder', plan: 'pro' };
let projects = [];
let betaUsers = [];
let authToken = null;

// Load current user
async function loadCurrentUser() {
  try {
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    currentUser = response.data.user;
    
  } catch (error) {
    console.error('Failed to load user:', error);
    authToken = null;
    localStorage.removeItem('authToken');
  }
}

// Initialize app only if we're on the main app page (not marketplace)
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the marketplace page
  if (window.location.pathname.startsWith('/marketplace')) {
    return; // Don't initialize app.js on marketplace
  }
  
  // Check for existing auth token
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    loadCurrentUser();
  }
  
  loadProjects();
  loadBetaUsers();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const form = document.getElementById('validation-form');
  if (form) {
    form.addEventListener('submit', handleValidationSubmit);
  }
}

// Show/hide validation form
function showValidationForm() {
  // Check if user is authenticated first
  if (!isAuthenticated()) {
    showAuthModal('validation');
    return;
  }
  
  // Mostrar directamente el formulario de validación para modo gratuito
  const formSection = document.getElementById('validation-form-section');
  const projectsSection = document.getElementById('projects-section');

  formSection.classList.remove('hidden');
  projectsSection.classList.add('hidden');

  // Scroll to form
  scrollToSection('validation-form-section');
}

function hideValidationForm() {
  const formSection = document.getElementById('validation-form-section');
  const projectsSection = document.getElementById('projects-section');
  
  formSection.classList.add('hidden');
  projectsSection.classList.remove('hidden');
}

// Show authentication modal
function showAuthModal(redirectTo = null) {
  let modal = document.getElementById('auth-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-t-2xl">
        <h2 class="text-2xl font-bold text-center">Únete a ValidAI Studio</h2>
        <p class="text-center text-purple-100 mt-2">Regístrate gratis y valida tu idea</p>
      </div>
      
      <!-- Form -->
      <div class="p-6">
        <form id="auth-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" id="auth-name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="auth-email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" id="auth-password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
          
          <button type="submit" class="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
            Crear cuenta gratis
          </button>
        </form>
        
        <div class="mt-4 text-center">
          <p class="text-gray-600">¿Ya tienes cuenta? 
            <button onclick="switchToLogin()" class="text-primary hover:underline font-medium">Inicia sesión</button>
          </p>
        </div>
      </div>
      
      <!-- Close button -->
      <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-white hover:text-gray-200">
        <i class="fas fa-times text-xl"></i>
      </button>
    </div>
  `;
  
  // Store redirect destination
  modal.dataset.redirectTo = redirectTo;
  
  // Setup form submission
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  
  modal.style.display = 'flex';
}

// Close authentication modal
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Switch to login mode
function switchToLogin() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  
  const form = modal.querySelector('#auth-form');
  const title = modal.querySelector('h2');
  const subtitle = modal.querySelector('p');
  const submitBtn = modal.querySelector('button[type="submit"]');
  const switchText = modal.querySelector('.text-center p');
  
  // Change to login form
  title.textContent = 'Inicia sesión';
  subtitle.textContent = 'Accede a tu cuenta de ValidAI Studio';
  submitBtn.textContent = 'Iniciar sesión';
  
  // Hide name field for login
  const nameField = modal.querySelector('#auth-name').parentElement;
  nameField.style.display = 'none';
  
  // Change switch text
  switchText.innerHTML = '¿No tienes cuenta? <button onclick="switchToRegister()" class="text-primary hover:underline font-medium">Regístrate</button>';
  
  // Update form mode
  form.dataset.mode = 'login';
}

// Switch to register mode
function switchToRegister() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  
  const form = modal.querySelector('#auth-form');
  const title = modal.querySelector('h2');
  const subtitle = modal.querySelector('p');
  const submitBtn = modal.querySelector('button[type="submit"]');
  const switchText = modal.querySelector('.text-center p');
  
  // Change to register form
  title.textContent = 'Únete a ValidAI Studio';
  subtitle.textContent = 'Regístrate gratis y valida tu idea';
  submitBtn.textContent = 'Crear cuenta gratis';
  
  // Show name field for register
  const nameField = modal.querySelector('#auth-name').parentElement;
  nameField.style.display = 'block';
  
  // Change switch text
  switchText.innerHTML = '¿Ya tienes cuenta? <button onclick="switchToLogin()" class="text-primary hover:underline font-medium">Inicia sesión</button>';
  
  // Update form mode
  form.dataset.mode = 'register';
}

// Handle authentication form submission
async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const mode = form.dataset.mode || 'register';
  const name = document.getElementById('auth-name').value;
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  
  try {
    let response;
    if (mode === 'register') {
      response = await axios.post('/api/auth/register', { name, email, password });
    } else {
      response = await axios.post('/api/auth/login', { email, password });
    }
    
    // Store auth token
    authToken = response.data.token;
    localStorage.setItem('authToken', authToken);
    
    // Load user data
    await loadCurrentUser();
    
    // Close modal
    closeAuthModal();
    
    // Redirect based on stored destination
    const modal = document.getElementById('auth-modal');
    const redirectTo = modal?.dataset.redirectTo;
    
    if (redirectTo === 'validation') {
      showValidationForm();
    } else {
      // Default redirect to dashboard or home
      window.location.reload();
    }
    
  } catch (error) {
    console.error('Auth error:', error);
    alert('Error: ' + (error.response?.data?.error || 'Error de autenticación'));
  }
}

// Check if user is authenticated (simple check for now)
function isAuthenticated() {
  return authToken !== null;
}

// Scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============================================
// PLAN SELECTION MODAL (Pre-MVP)
// ============================================

function showPlanSelectionModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('plan-selection-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'plan-selection-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary to-secondary text-white p-8 rounded-t-2xl">
        <button onclick="closePlanSelectionModal()" class="float-right text-white hover:text-gray-200 text-2xl">
          <i class="fas fa-times"></i>
        </button>
        <div class="text-center">
          <h2 class="text-4xl font-bold mb-4">🚀 Elige tu Plan para Comenzar</h2>
          <p class="text-xl opacity-90">Selecciona el plan perfecto para validar tu idea</p>
        </div>
      </div>
      
      <!-- Billing Toggle -->
      <div class="flex justify-center py-6 bg-gray-50">
        <div class="bg-white rounded-lg shadow-md p-2 inline-flex">
          <button id="modal-monthly-btn" onclick="switchModalBilling('monthly')" class="px-6 py-2 rounded-md font-semibold transition bg-primary text-white">
            Mensual
          </button>
          <button id="modal-yearly-btn" onclick="switchModalBilling('yearly')" class="px-6 py-2 rounded-md font-semibold transition text-gray-700 hover:bg-gray-100">
            Anual <span class="text-green-600 text-xs ml-1">(Ahorra 20%)</span>
          </button>
        </div>
      </div>
      
      <!-- Plans Grid -->
      <div id="modal-plans-grid" class="px-8 pb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Plans will be loaded here -->
          <div class="col-span-3 text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-600">Cargando planes...</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-8 py-6 rounded-b-2xl border-t">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            <i class="fas fa-shield-alt text-green-500 mr-2"></i>
            Prueba gratis por 14 días • Cancela cuando quieras
          </p>
          <button onclick="closePlanSelectionModal()" class="text-gray-600 hover:text-gray-800 font-semibold">
            Continuar sin plan →
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  
  // Load plans into modal
  loadPlansIntoModal();
}

function closePlanSelectionModal() {
  const modal = document.getElementById('plan-selection-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

let modalBillingCycle = 'monthly';

function switchModalBilling(cycle) {
  modalBillingCycle = cycle;
  
  const monthlyBtn = document.getElementById('modal-monthly-btn');
  const yearlyBtn = document.getElementById('modal-yearly-btn');
  
  if (cycle === 'monthly') {
    monthlyBtn.classList.add('bg-primary', 'text-white');
    monthlyBtn.classList.remove('text-gray-700', 'hover:bg-gray-100');
    
    yearlyBtn.classList.remove('bg-primary', 'text-white');
    yearlyBtn.classList.add('text-gray-700', 'hover:bg-gray-100');
  } else {
    yearlyBtn.classList.add('bg-primary', 'text-white');
    yearlyBtn.classList.remove('text-gray-700', 'hover:bg-gray-100');
    
    monthlyBtn.classList.remove('bg-primary', 'text-white');
    monthlyBtn.classList.add('text-gray-700', 'hover:bg-gray-100');
  }
  
  loadPlansIntoModal();
}

async function loadPlansIntoModal() {
  const grid = document.getElementById('modal-plans-grid');
  if (!grid) return;
  
  try {
    const response = await fetch('/api/plans');
    const data = await response.json();
    // Filtrar solo planes de plataforma completa (no marketplace-only)
    const plans = (data.plans || []).filter(p => p.plan_type === 'full');
    
    grid.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${plans.map((plan, index) => {
          const price = modalBillingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const features = JSON.parse(plan.features || '[]');
          const isMostPopular = index === 1 && plans.length === 3;
          
          const requestsText = plan.validators_limit === -1 ? 'Solicitudes ilimitadas' : `${plan.validators_limit} solicitudes`;
          const productsText = plan.products_limit === -1 ? 'Productos ilimitados' : `${plan.products_limit} producto${plan.products_limit > 1 ? 's' : ''}`;
          
          if (isMostPopular) {
            return `
              <div class="bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl p-6 text-white relative transform scale-105 border-4 border-yellow-400">
                <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span class="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Más Popular
                  </span>
                </div>
                <div class="text-center mb-6 mt-4">
                  <h3 class="text-2xl font-bold mb-3">${escapeHtml(plan.display_name)}</h3>
                  <div class="text-5xl font-bold mb-3">
                    $${price}
                  </div>
                  <p class="text-lg opacity-90">/${modalBillingCycle === 'monthly' ? 'mes' : 'año'}</p>
                  <p class="opacity-90 mt-2">${escapeHtml(plan.description)}</p>
                </div>
                <ul class="space-y-3 mb-6">
                  <li class="flex items-start">
                    <i class="fas fa-check-circle mt-1 mr-3 text-xl"></i>
                    <span class="font-semibold">${productsText}</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check-circle mt-1 mr-3 text-xl"></i>
                    <span class="font-semibold">${requestsText}</span>
                  </li>
                  ${features.slice(0, 4).map(f => `
                    <li class="flex items-start">
                      <i class="fas fa-check-circle mt-1 mr-3"></i>
                      <span>${escapeHtml(f)}</span>
                    </li>
                  `).join('')}
                </ul>
                <button onclick="selectPlanAndContinue(${plan.id}, '${escapeHtml(plan.name)}')" 
                        class="w-full bg-white text-primary px-6 py-4 rounded-xl hover:bg-gray-100 transition font-bold text-lg shadow-lg">
                  🚀 Empezar Ahora
                </button>
              </div>
            `;
          }
          
          return `
            <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-primary transition">
              <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-gray-900 mb-3">${escapeHtml(plan.display_name)}</h3>
                <div class="text-4xl font-bold text-primary mb-3">
                  $${price}
                </div>
                <p class="text-lg text-gray-600">/${modalBillingCycle === 'monthly' ? 'mes' : 'año'}</p>
                <p class="text-gray-600 mt-2">${escapeHtml(plan.description)}</p>
              </div>
              <ul class="space-y-3 mb-6">
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700 font-semibold">${productsText}</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700 font-semibold">${requestsText}</span>
                </li>
                ${features.slice(0, 4).map(f => `
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                    <span class="text-gray-700">${escapeHtml(f)}</span>
                  </li>
                `).join('')}
              </ul>
              <button onclick="selectPlanAndContinue(${plan.id}, '${escapeHtml(plan.name)}')" 
                      class="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold">
                ${index === plans.length - 1 ? 'Contactar Ventas' : 'Comenzar Ahora'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading plans into modal:', error);
    grid.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar planes</p>
      </div>
    `;
  }
}

function selectPlanAndContinue(planId, planName) {
  // Store selected plan in localStorage
  localStorage.setItem('selectedPlanId', planId);
  localStorage.setItem('selectedPlanName', planName);
  localStorage.setItem('selectedBillingCycle', modalBillingCycle);
  
  // Close modal
  closePlanSelectionModal();
  
  // Show auth modal with register mode and plan info
  showAuthModalWithPlan('register', planName);
}

function showAuthModalWithPlan(mode, planName) {
  // This function will be called from the existing showAuthModal
  // We'll enhance it to show the selected plan
  const modal = document.getElementById('auth-modal');
  if (!modal) {
    // Create a simple notification for now
    alert(`Has seleccionado el plan: ${planName}\n\nPor favor regístrate para continuar con la validación de tu idea.`);
    
    // Show standard auth modal
    if (typeof showAuthModal === 'function') {
      showAuthModal(mode);
    }
    return;
  }
  
  showAuthModal(mode);
  
  // Add plan badge to auth modal
  setTimeout(() => {
    const authContent = document.getElementById('auth-modal-content');
    if (authContent && planName) {
      const planBadge = document.createElement('div');
      planBadge.className = 'bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-lg mb-4 text-center';
      planBadge.innerHTML = `
        <i class="fas fa-star mr-2"></i>
        <strong>Plan seleccionado:</strong> ${escapeHtml(planName)}
      `;
      authContent.insertBefore(planBadge, authContent.firstChild);
    }
  }, 100);
}

// Scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Handle validation form submission
async function handleValidationSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const target_market = document.getElementById('target_market').value;
  const value_proposition = document.getElementById('value_proposition').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando proyecto...';
  submitBtn.disabled = true;
  
  try {
    // Create project
    const response = await axios.post('/api/projects', {
      title,
      description,
      target_market,
      value_proposition
    });
    
    const projectId = response.data.id;
    
    // Start analysis
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analizando mercado con IA...';
    await axios.post('/api/validation/analyze', { projectId });
    
    // Generate MVP
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando prototipo MVP...';
    await axios.post('/api/validation/generate-mvp', { projectId });
    
    // Generate growth strategies
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando estrategias de crecimiento...';
    await axios.post('/api/validation/generate-growth', { projectId });
    
    // Show success message
    alert('¡Validación completada! Redirigiendo al proyecto...');
    
    // Redirect to project page
    window.location.href = `/project/${projectId}`;
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al crear el proyecto. Por favor intenta de nuevo.');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Load projects
async function loadProjects() {
  try {
    const response = await axios.get('/api/projects');
    projects = response.data.projects || [];
    renderProjects();
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Render projects
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  
  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-lightbulb text-6xl text-gray-300 mb-4"></i>
        <p class="text-xl text-gray-600 mb-4">No tienes proyectos todavía</p>
        <button onclick="showValidationForm()" class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition">
          <i class="fas fa-plus mr-2"></i>Crear tu primer proyecto
        </button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = projects.map(project => `
    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-gray-900">${escapeHtml(project.title)}</h3>
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}">
          ${getStatusText(project.status)}
        </span>
      </div>
      <p class="text-gray-600 mb-4 line-clamp-2">${escapeHtml(project.description)}</p>
      <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span><i class="far fa-calendar mr-2"></i>${formatDate(project.created_at)}</span>
        <div class="flex items-center">
          ${project.rating_average ? `<span class="text-yellow-500 mr-2"><i class="fas fa-star"></i> ${project.rating_average.toFixed(1)}</span>` : ''}
          ${project.votes_count ? `<span class="text-gray-500">(${project.votes_count} votos)</span>` : ''}
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-primary hover:text-primary/80 cursor-pointer" onclick="window.location.href='/project/${project.id}'">Ver detalles <i class="fas fa-arrow-right ml-1"></i></span>
        ${generateProjectVoteButtons(project.id)}
      </div>
    </div>
  `).join('');
}

// Load beta users
async function loadBetaUsers() {
  try {
    const response = await axios.get('/api/beta-users');
    betaUsers = response.data.betaUsers || [];
    renderBetaUsers();
  } catch (error) {
    console.error('Error loading beta users:', error);
  }
}

// Render beta users
function renderBetaUsers() {
  const grid = document.getElementById('beta-users-grid');
  
  if (betaUsers.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-600">No hay usuarios beta disponibles en este momento.</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = betaUsers.slice(0, 9).map(user => `
    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div class="flex items-start mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
          ${user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-900">${escapeHtml(user.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(user.role)}</p>
        </div>
        <div class="flex items-center">
          <i class="fas fa-star text-yellow-400 mr-1"></i>
          <span class="font-semibold">${user.rating.toFixed(1)}</span>
        </div>
      </div>
      <div class="space-y-2 text-sm text-gray-600 mb-4">
        <div><i class="fas fa-briefcase w-5 text-primary"></i>${escapeHtml(user.industry)}</div>
        <div><i class="fas fa-user w-5 text-primary"></i>${user.age} años</div>
      </div>
      <p class="text-sm text-gray-700 mb-4 line-clamp-2">${escapeHtml(user.bio)}</p>
      <button class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm">
        <i class="fas fa-plus mr-2"></i>Agregar al panel
      </button>
    </div>
  `).join('');
}

// Helper functions
function getStatusColor(status) {
  const colors = {
    'draft': 'bg-gray-200 text-gray-800',
    'analyzing': 'bg-blue-200 text-blue-800',
    'validated': 'bg-green-200 text-green-800',
    'failed': 'bg-red-200 text-red-800'
  };
  return colors[status] || colors['draft'];
}

function getStatusText(status) {
  const texts = {
    'draft': 'Borrador',
    'analyzing': 'Analizando',
    'validated': 'Validado',
    'failed': 'Fallido'
  };
  return texts[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// PRICING PLANS
// ============================================

let currentBillingCycle = 'monthly';
let currentPlanType = 'platform'; // 'platform' or 'marketplace'
let pricingPlans = [];
let allPlans = [];

async function loadPricingPlans() {
  try {
    console.log('🔍 [DEBUG] Loading pricing plans...');
    const response = await fetch('/api/plans');
    console.log('📡 [DEBUG] Response status:', response.status);
    const data = await response.json();
    console.log('📦 [DEBUG] Data received:', data);
    
    allPlans = data.plans;
    console.log('✅ [DEBUG] allPlans loaded:', allPlans ? allPlans.length : 0, 'plans');
    // Filter plans based on current type
    filterAndRenderPlans();
    
  } catch (error) {
    console.error('Error loading pricing plans:', error);
    const grid = document.getElementById('pricing-plans-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-3 text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p class="text-gray-600">Error al cargar planes</p>
        </div>
      `;
    }
  }
}

function switchPlanType(type) {
  currentPlanType = type;
  
  // Update button states
  const platformBtn = document.getElementById('platform-plans-btn');
  const marketplaceBtn = document.getElementById('marketplace-plans-btn');
  const platformDesc = document.getElementById('platform-description');
  const marketplaceDesc = document.getElementById('marketplace-description');
  
  if (type === 'platform') {
    platformBtn.classList.add('bg-white', 'text-primary');
    platformBtn.classList.remove('text-white', 'hover:bg-white/10');
    
    marketplaceBtn.classList.remove('bg-white', 'text-primary');
    marketplaceBtn.classList.add('text-white', 'hover:bg-white/10');
    
    platformDesc.classList.remove('hidden');
    marketplaceDesc.classList.add('hidden');
  } else {
    marketplaceBtn.classList.add('bg-white', 'text-primary');
    marketplaceBtn.classList.remove('text-white', 'hover:bg-white/10');
    
    platformBtn.classList.remove('bg-white', 'text-primary');
    platformBtn.classList.add('text-white', 'hover:bg-white/10');
    
    marketplaceDesc.classList.remove('hidden');
    platformDesc.classList.add('hidden');
  }
  
  filterAndRenderPlans();
}

function filterAndRenderPlans() {
  console.log('🔍 [DEBUG] filterAndRenderPlans called');
  console.log('📋 [DEBUG] allPlans:', allPlans);
  console.log('🎯 [DEBUG] currentPlanType:', currentPlanType);
  
  const grid = document.getElementById('pricing-plans-grid');
  console.log('🎨 [DEBUG] Grid element:', grid);
  
  // Show loading if no plans yet
  if (!allPlans || allPlans.length === 0) {
    console.log('⚠️ [DEBUG] No plans available yet, showing loading...');
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-3 text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p class="text-gray-600">Cargando planes...</p>
        </div>
      `;
    }
    return;
  }
  
  // Filter plans based on type
  if (currentPlanType === 'platform') {
    pricingPlans = allPlans.filter(p => p.category === 'platform');
  } else {
    pricingPlans = allPlans.filter(p => p.category === 'marketplace');
  }
  
  console.log('✅ [DEBUG] Filtered plans:', pricingPlans.length, 'plans');
  console.log('📦 [DEBUG] pricingPlans:', pricingPlans);
  
  // If no plans in this category, show message
  if (pricingPlans.length === 0) {
    console.log('⚠️ [DEBUG] No plans in this category');
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-3 text-center py-12">
          <i class="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">No hay planes disponibles en esta categoría</p>
        </div>
      `;
    }
    return;
  }
  
  console.log('🚀 [DEBUG] Calling renderPricingPlans()...');
  renderPricingPlans();
}

function switchBillingCycle(cycle) {
  currentBillingCycle = cycle;
  
  // Update button states
  const monthlyBtn = document.getElementById('monthly-billing-btn');
  const yearlyBtn = document.getElementById('yearly-billing-btn');
  
  if (cycle === 'monthly') {
    monthlyBtn.classList.add('bg-primary', 'text-white');
    monthlyBtn.classList.remove('text-gray-700', 'hover:bg-gray-100');
    
    yearlyBtn.classList.remove('bg-primary', 'text-white');
    yearlyBtn.classList.add('text-gray-700', 'hover:bg-gray-100');
  } else {
    yearlyBtn.classList.add('bg-primary', 'text-white');
    yearlyBtn.classList.remove('text-gray-700', 'hover:bg-gray-100');
    
    monthlyBtn.classList.remove('bg-primary', 'text-white');
    monthlyBtn.classList.add('text-gray-700', 'hover:bg-gray-100');
  }
  
  renderPricingPlans();
}

function renderPricingPlans() {
  const grid = document.getElementById('pricing-plans-grid');
  if (!grid) return;
  
  if (!pricingPlans || pricingPlans.length === 0) {
    grid.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <i class="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-600">No hay planes disponibles para esta categoría</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = pricingPlans.map((plan, index) => {
    const price = currentBillingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const features = JSON.parse(plan.features || '[]');
    
    // Determine if this is the most popular plan
    let isMostPopular = false;
    if (currentPlanType === 'platform' && plan.name === 'pro') {
      isMostPopular = true;
    } else if (currentPlanType === 'marketplace' && plan.name === 'marketplace_pro') {
      isMostPopular = true;
    }
    
    // Get limits text - AHORA DICE "SOLICITUDES" en lugar de "VALIDADORES"
    const requestsText = plan.validators_limit === -1 ? 'Solicitudes ilimitadas' : `${plan.validators_limit} solicitudes`;
    const productsText = plan.products_limit === -1 ? 'Productos ilimitados' : `${plan.products_limit} producto${plan.products_limit > 1 ? 's' : ''}`;
    
    if (isMostPopular) {
      return `
        <div class="bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl p-8 text-white relative transform scale-105">
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span class="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
              ⭐ Más Popular
            </span>
          </div>
          <div class="text-center mb-6 mt-4">
            <h3 class="text-2xl font-bold mb-2">${escapeHtml(plan.display_name)}</h3>
            <div class="text-5xl font-bold mb-2">
              $${price}
            </div>
            <p class="text-lg opacity-90">/${currentBillingCycle === 'monthly' ? 'mes' : 'año'}</p>
            <p class="opacity-90 mt-2">${escapeHtml(plan.description)}</p>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-start">
              <i class="fas fa-check-circle mt-1 mr-3 text-xl"></i>
              <span class="font-semibold">${requestsText}</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle mt-1 mr-3 text-xl"></i>
              <span class="font-semibold">${productsText}</span>
            </li>
            ${features.slice(0, 6).map(f => `
              <li class="flex items-start">
                <i class="fas fa-check-circle mt-1 mr-3"></i>
                <span>${escapeHtml(f)}</span>
              </li>
            `).join('')}
          </ul>
          <button onclick="selectPlan(${plan.id}, '${escapeHtml(plan.name)}')" 
                  class="w-full bg-white text-primary px-6 py-4 rounded-xl hover:bg-gray-100 transition font-bold text-lg shadow-lg">
            🚀 Empezar Ahora
          </button>
        </div>
      `;
    }
    
    return `
      <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary transition">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">${escapeHtml(plan.display_name)}</h3>
          <div class="text-4xl font-bold text-primary mb-2">
            $${price}
          </div>
          <p class="text-lg text-gray-600">/${currentBillingCycle === 'monthly' ? 'mes' : 'año'}</p>
          <p class="text-gray-600 mt-2">${escapeHtml(plan.description)}</p>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700 font-semibold">${requestsText}</span>
          </li>
          <li class="flex items-start">
            <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
            <span class="text-gray-700 font-semibold">${productsText}</span>
          </li>
          ${features.slice(0, 6).map(f => `
            <li class="flex items-start">
              <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
              <span class="text-gray-700">${escapeHtml(f)}</span>
            </li>
          `).join('')}
        </ul>
        <button onclick="selectPlan(${plan.id}, '${escapeHtml(plan.name)}')" 
                class="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold">
          ${plan.price_monthly === 0 ? 'Comenzar Gratis' : (index === pricingPlans.length - 1 ? 'Contactar Ventas' : 'Comenzar Ahora')}
        </button>
      </div>
    `;
  }).join('');
}

function selectPlan(planId, planName) {
  console.log(`Selected plan: ${planName} (ID: ${planId})`);
  
  // Store selected plan
  localStorage.setItem('selectedPlanId', planId);
  localStorage.setItem('selectedPlanName', planName);
  localStorage.setItem('selectedBillingCycle', currentBillingCycle);
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Show auth modal with plan info
    showAuthModalWithPlan('register', planName);
  } else {
    // User is authenticated, show success and option to upgrade
    alert(`✅ Plan ${planName} seleccionado.\n\nPuedes continuar a validar tu idea o gestionar tu suscripción desde tu dashboard.`);
    scrollToSection('validation-form-section');
    showValidationForm();
  }
}

// Load pricing plans on page load
if (document.getElementById('pricing-plans-grid')) {
  loadPricingPlans();
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function showAuthModal(mode) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showAuthModal(mode));
    return;
  }

  const modal = document.getElementById('auth-modal');
  const content = document.getElementById('auth-modal-content');
  
  if (!modal || !content) {
    console.error('Auth modal elements not found');
    return;
  }
  
  modal.classList.remove('hidden');

  if (mode === 'login') {
    content.innerHTML = `
      <div class="text-center">
        <i class="fas fa-sign-in-alt text-5xl mb-4" style="background: linear-gradient(45deg, #FF6154, #FB651E); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
        <h2 class="text-3xl font-black text-gray-900 mb-2">Sign In</h2>
        <p class="text-gray-600 mb-6 font-medium">Access your ValidAI Studio account</p>
        <button onclick="showRoleSelection(\\'login\\')" class="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3 mb-6">
          <i class="fab fa-google text-2xl"></i>
          <span class="text-lg">Continue with Google</span>
        </button>
        <p class="text-sm text-gray-600 mt-4">
          Don\\'t have an account? <a href="#" onclick="showAuthModal(\\'register\\'); return false;" class="text-primary hover:underline font-bold">Sign Up</a>
        </p>
      </div>
    `;
  } else if (mode === 'register') {
    content.innerHTML = `
      <div class="text-center">
        <i class="fas fa-user-plus text-5xl mb-4" style="background: linear-gradient(45deg, #FF6154, #FB651E); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
        <h2 class="text-3xl font-black text-gray-900 mb-2">Get Started</h2>
        <p class="text-gray-600 mb-8 font-medium">Choose your role to register</p>
        <div class="space-y-4">
          <button onclick="loginAsFounder()" class="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">
            <i class="fas fa-lightbulb text-2xl"></i>
            <span class="text-lg">Founder - Create & Validate</span>
          </button>
          <button onclick="loginAsValidator()" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">
            <i class="fas fa-star text-2xl"></i>
            <span class="text-lg">Validator - Vote & Rate</span>
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-6">
          Already have an account? <a href="#" onclick="showAuthModal(\\'login\\'); return false;" class="text-primary hover:underline font-bold">Sign In</a>
        </p>
      </div>
    `;
  }
}

function showRoleSelection(action) {
  const modal = document.getElementById('auth-modal');
  const content = document.getElementById('auth-modal-content');

  if (!modal || !content) return;

  modal.classList.remove('hidden');

  const title = action === 'login' ? 'Sign In with Google' : 'Sign Up with Google';
  const description = action === 'login' ? 'Choose your role to continue' : 'Choose your role to register';

  content.innerHTML = `
    <div class="text-center">
      <i class="fab fa-google text-5xl mb-4" style="background: linear-gradient(45deg, #FF6154, #FB651E); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
      <h2 class="text-3xl font-black text-gray-900 mb-2">${title}</h2>
      <p class="text-gray-600 mb-8 font-medium">${description}</p>
      <div class="space-y-4">
        <button onclick="loginAsFounder()" class="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">
          <i class="fas fa-lightbulb text-2xl"></i>
          <span class="text-lg">Founder - Create & Validate Projects</span>
        </button>
        <button onclick="loginAsValidator()" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3">
          <i class="fas fa-star text-2xl"></i>
          <span class="text-lg">Validator - Vote & Rate Projects</span>
        </button>
      </div>
      <button onclick="closeAuthModal()" class="mt-6 text-gray-600 hover:text-primary font-semibold">
        ← Back
      </button>
    </div>
  `;
}

function loginAsFounder() {
  loginWithGoogle('founder');
}

function loginAsValidator() {
  loginWithGoogle('validator');
}

function loginWithGoogle(role) {
  window.location.href = '/api/auth/google?role=' + role;
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

async function loadCurrentUser() {
  try {
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    currentUser = response.data.user;
    updateAuthUI();
    
  } catch (error) {
    console.error('Failed to load user:', error);
    authToken = null;
    localStorage.removeItem('authToken');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    
    authToken = response.data.token;
    currentUser = response.data.user;
    localStorage.setItem('authToken', authToken);
    
    closeAuthModal();
    updateAuthUI();
    
    alert('¡Bienvenido de nuevo!');
    
  } catch (error) {
    alert('Error: ' + (error.response?.data?.error || 'Login falló'));
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  
  try {
    const response = await axios.post('/api/auth/register', { name, email, password, role });
    
    authToken = response.data.token;
    currentUser = response.data.user;
    localStorage.setItem('authToken', authToken);
    
    closeAuthModal();
    updateAuthUI();
    
    alert('¡Cuenta creada exitosamente!');
    
  } catch (error) {
    alert('Error: ' + (error.response?.data?.error || 'Registro falló'));
  }
}

function updateAuthUI() {
  const loginBtn = document.querySelector('button[onclick="showAuthModal(\'login\')"]');
  const registerBtn = document.querySelector('button[onclick="showAuthModal(\'register\')"]');
  
  if (currentUser) {
    // User is logged in - hide login/register buttons and show user info
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) {
      registerBtn.outerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-gray-700">Hola, ${currentUser.name}</span>
          <button onclick="logout()" class="text-red-600 hover:text-red-800 transition">
            <i class="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      `;
    }
  }
}

function logout() {
  if (confirm('¿Seguro que quieres cerrar sesión?')) {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    location.reload();
  }
}

// Create auth modal if it doesn't exist
function createAuthModalIfNeeded(mode) {
  // Check if modal already exists
  if (document.getElementById('auth-modal')) {
    return;
  }

  // Create modal HTML
  const modalHTML = `
    <div id="auth-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-md w-full p-8 relative">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div id="auth-modal-content">
                <!-- Auth form will be inserted here -->
            </div>
        </div>
    </div>
  `;

  // Append to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Now try to show the modal again
  setTimeout(() => showAuthModal(mode), 100);
}

// Generate vote buttons for projects (only for validators)
function generateProjectVoteButtons(projectId) {
  if (!authToken || !currentUser || currentUser.role !== 'validator') {
    return '';
  }

  return `
    <div class="flex items-center space-x-1">
      ${[1, 2, 3, 4, 5].map(star => `
        <button onclick="event.stopPropagation(); voteForProject(${projectId}, ${star})"
                class="text-gray-300 hover:text-yellow-400 transition-colors text-sm"
                title="Votar ${star} estrella${star > 1 ? 's' : ''}">
          <i class="fas fa-star"></i>
        </button>
      `).join('')}
    </div>
  `;
}

// Vote for a project
async function voteForProject(projectId, rating) {
  if (!authToken) {
    // Show login modal or something
    return;
  }

  try {
    const response = await axios.post(`/api/projects/${projectId}/vote`, {
      rating: rating
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 200) {
      // Reload projects to show updated ratings
      await loadProjects();
    }
  } catch (error) {
    console.error('Error voting for project:', error);
  }
}
