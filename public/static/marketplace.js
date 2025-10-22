// Marketplace Frontend JavaScript

// Global state
let currentUser = null;
let authToken = null;
let products = [];
let validators = [];
let unreadNotifications = 0;
let notificationsInterval = null;

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    loadCurrentUser();
    startNotificationsPolling();
  }
  
  // Load initial data
  loadProducts();
  loadValidators();
});

// ============================================
// AUTHENTICATION
// ============================================

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

function updateAuthUI() {
  const authNav = document.getElementById('auth-nav');
  const createProductBtn = document.getElementById('create-product-btn');
  const myDashboardTab = document.getElementById('my-dashboard-tab');
  
  if (currentUser) {
    authNav.innerHTML = `
      <div class="flex items-center space-x-4">
        <span class="text-gray-700">
          <i class="fas fa-user-circle mr-1"></i>${currentUser.name}
        </span>
        <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition">
          <i class="fas fa-sign-out-alt mr-1"></i>Salir
        </button>
      </div>
    `;
    
    // Show dashboard tab
    myDashboardTab.classList.remove('hidden');
    
    // Show create product button for founders
    if (currentUser.role === 'founder') {
      createProductBtn.classList.remove('hidden');
    }
  }
}

function showAuthModal(mode) {
  const modal = document.getElementById('auth-modal');
  const content = document.getElementById('auth-modal-content');
  
  if (mode === 'login') {
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-6">Iniciar Sesión</h2>
      <form id="login-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="login-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input type="password" id="login-password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
        </div>
        <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold">
          <i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión
        </button>
        <p class="text-center text-sm text-gray-600">
          ¿No tienes cuenta? <button type="button" onclick="showAuthModal('register')" class="text-primary hover:underline">Regístrate</button>
        </p>
      </form>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
  } else {
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-6">Crear Cuenta</h2>
      <form id="register-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input type="text" id="register-name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="register-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input type="password" id="register-password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select id="register-role" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
            <option value="">Selecciona tu rol</option>
            <option value="founder">Founder (Busco validadores)</option>
            <option value="validator">Validador (Quiero validar productos)</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold">
          <i class="fas fa-user-plus mr-2"></i>Crear Cuenta
        </button>
        <p class="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta? <button type="button" onclick="showAuthModal('login')" class="text-primary hover:underline">Inicia sesión</button>
        </p>
      </form>
    `;
    
    document.getElementById('register-form').addEventListener('submit', handleRegister);
  }
  
  modal.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
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

function logout() {
  if (confirm('¿Seguro que quieres cerrar sesión?')) {
    stopNotificationsPolling();
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    location.reload();
  }
}

// ============================================
// TABS
// ============================================

function showTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('tab-active', 'text-primary');
    tab.classList.add('text-gray-600');
  });
  document.getElementById(tabName + '-tab').classList.add('tab-active');
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById(tabName + '-content').classList.remove('hidden');
  
  // Load data and render filters if needed
  if (tabName === 'products') {
    renderProductFilters();
    if (products.length === 0) {
      loadProducts();
    }
  } else if (tabName === 'validators') {
    renderValidatorFilters();
    if (validators.length === 0) {
      loadValidators();
    }
  } else if (tabName === 'my-dashboard' && currentUser) {
    loadMyDashboard();
  }
}

// ============================================
// PRODUCTS
// ============================================

async function loadProducts() {
  try {
    const response = await axios.get('/api/marketplace/products');
    products = response.data.products;
    
    renderProductFilters();
    renderProducts();
    
  } catch (error) {
    console.error('Failed to load products:', error);
    document.getElementById('products-grid').innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar productos</p>
      </div>
    `;
  }
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  
  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 text-lg mb-4">No hay productos disponibles</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = products.map(product => `
    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" onclick="showProductDetail(${product.id})">
      ${product.featured ? '<div class="flex items-center mb-3"><span class="badge bg-yellow-100 text-yellow-800"><i class="fas fa-star mr-1"></i>Destacado</span></div>' : ''}
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-1">${escapeHtml(product.title)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(product.company_name)}</p>
        </div>
      </div>
      <p class="text-gray-700 mb-4 line-clamp-2">${escapeHtml(product.description)}</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <span class="badge bg-primary/10 text-primary">${escapeHtml(product.category)}</span>
        <span class="badge bg-purple-100 text-purple-800">${escapeHtml(product.stage)}</span>
        ${product.compensation_type === 'paid' ? `<span class="badge bg-green-100 text-green-800"><i class="fas fa-dollar-sign mr-1"></i>$${product.compensation_amount}</span>` : ''}
      </div>
      <div class="flex items-center justify-between text-sm text-gray-600">
        <span><i class="far fa-calendar mr-1"></i>${product.duration_days} días</span>
        <span class="text-primary font-semibold">Ver detalles <i class="fas fa-arrow-right ml-1"></i></span>
      </div>
    </div>
  `).join('');
}

// ============================================
// VALIDATORS
// ============================================

async function loadValidators() {
  try {
    const response = await axios.get('/api/marketplace/validators');
    validators = response.data.validators;
    
    renderValidatorFilters();
    renderValidators();
    
  } catch (error) {
    console.error('Failed to load validators:', error);
  }
}

function renderValidators() {
  const grid = document.getElementById('validators-grid');
  
  if (validators.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 text-lg">No hay validadores disponibles</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = validators.map(validator => {
    const expertise = JSON.parse(validator.expertise || '[]');
    return `
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
        <div class="flex items-start mb-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold mr-4">
            ${validator.name?.charAt(0) || 'V'}
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">${escapeHtml(validator.name)}</h3>
            <p class="text-sm text-gray-600">${escapeHtml(validator.title)}</p>
            <div class="flex items-center mt-1">
              <span class="text-yellow-500">★</span>
              <span class="text-sm font-semibold ml-1">${validator.rating.toFixed(1)}</span>
              <span class="text-xs text-gray-500 ml-2">(${validator.total_validations} validaciones)</span>
            </div>
          </div>
        </div>
        ${validator.bio ? `<p class="text-gray-700 text-sm mb-4 line-clamp-2">${escapeHtml(validator.bio)}</p>` : ''}
        <div class="flex flex-wrap gap-2 mb-4">
          ${expertise.slice(0, 3).map(exp => `<span class="badge bg-blue-100 text-blue-800">${escapeHtml(exp)}</span>`).join('')}
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">${validator.hourly_rate ? `$${validator.hourly_rate}/h` : 'Gratis'}</span>
          <div class="flex gap-2 items-center">
            ${authToken && currentUser?.role === 'founder' ? `
              <button onclick="event.stopPropagation(); openSelectProductModal(${validator.id}, '${escapeHtml(validator.name)}')" class="bg-primary text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-primary/90 transition" title="Añadir a producto">
                <i class="fas fa-plus mr-1"></i>Añadir
              </button>
            ` : ''}
            ${authToken ? `
              <button onclick="event.stopPropagation(); openChatWithValidator(${validator.id}, '${escapeHtml(validator.name)}')" class="text-primary hover:text-primary/80 transition" title="Enviar mensaje">
                <i class="fas fa-comment-dots text-lg"></i>
              </button>
            ` : ''}
            <button onclick="showValidatorProfile(${validator.id})" class="text-primary font-semibold text-sm hover:underline">
              Ver perfil <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// SEARCH AND FILTERS
// ============================================

// Global filter state
let currentFilters = {
  products: {
    q: '',
    category: '',
    stage: '',
    min_budget: '',
    max_budget: '',
    sort: 'recent'
  },
  validators: {
    q: '',
    expertise: '',
    min_rating: '',
    max_rate: '',
    availability: '',
    sort: 'rating'
  }
};

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Render search and filters for products
function renderProductFilters() {
  const container = document.getElementById('products-filters');
  if (!container) return;
  
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            id="product-search-input"
            placeholder="Buscar productos por título, descripción..."
            value="${currentFilters.products.q}"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
        </div>
      </div>
      
      <!-- Filters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Category -->
        <select id="filter-product-category" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Todas las categorías</option>
          <option value="SaaS" ${currentFilters.products.category === 'SaaS' ? 'selected' : ''}>SaaS</option>
          <option value="Fintech" ${currentFilters.products.category === 'Fintech' ? 'selected' : ''}>Fintech</option>
          <option value="E-commerce" ${currentFilters.products.category === 'E-commerce' ? 'selected' : ''}>E-commerce</option>
          <option value="Mobile" ${currentFilters.products.category === 'Mobile' ? 'selected' : ''}>Mobile</option>
          <option value="Healthcare" ${currentFilters.products.category === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
          <option value="EdTech" ${currentFilters.products.category === 'EdTech' ? 'selected' : ''}>EdTech</option>
        </select>
        
        <!-- Stage -->
        <select id="filter-product-stage" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Todas las etapas</option>
          <option value="idea" ${currentFilters.products.stage === 'idea' ? 'selected' : ''}>Idea</option>
          <option value="prototype" ${currentFilters.products.stage === 'prototype' ? 'selected' : ''}>Prototipo</option>
          <option value="mvp" ${currentFilters.products.stage === 'mvp' ? 'selected' : ''}>MVP</option>
          <option value="beta" ${currentFilters.products.stage === 'beta' ? 'selected' : ''}>Beta</option>
        </select>
        
        <!-- Budget Range -->
        <select id="filter-product-budget" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Cualquier presupuesto</option>
          <option value="0-500">$0 - $500</option>
          <option value="500-1000">$500 - $1,000</option>
          <option value="1000-2500">$1,000 - $2,500</option>
          <option value="2500-5000">$2,500 - $5,000</option>
          <option value="5000+">$5,000+</option>
        </select>
        
        <!-- Sort -->
        <select id="filter-product-sort" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="recent" ${currentFilters.products.sort === 'recent' ? 'selected' : ''}>Más recientes</option>
          <option value="budget_high" ${currentFilters.products.sort === 'budget_high' ? 'selected' : ''}>Mayor presupuesto</option>
          <option value="budget_low" ${currentFilters.products.sort === 'budget_low' ? 'selected' : ''}>Menor presupuesto</option>
          <option value="popular" ${currentFilters.products.sort === 'popular' ? 'selected' : ''}>Más populares</option>
          <option value="featured" ${currentFilters.products.sort === 'featured' ? 'selected' : ''}>Destacados</option>
        </select>
        
        <!-- Clear Button -->
        <button onclick="clearProductFilters()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          <i class="fas fa-times mr-2"></i>Limpiar
        </button>
      </div>
      
      <!-- Results Count -->
      <div id="product-results-count" class="mt-4 text-sm text-gray-600"></div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('product-search-input').addEventListener('input', debounce(applyProductFilters, 500));
  document.getElementById('filter-product-category').addEventListener('change', applyProductFilters);
  document.getElementById('filter-product-stage').addEventListener('change', applyProductFilters);
  document.getElementById('filter-product-budget').addEventListener('change', applyProductFilters);
  document.getElementById('filter-product-sort').addEventListener('change', applyProductFilters);
}

// Render search and filters for validators
function renderValidatorFilters() {
  const container = document.getElementById('validators-filters');
  if (!container) return;
  
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            id="validator-search-input"
            placeholder="Buscar validadores por nombre, expertise..."
            value="${currentFilters.validators.q}"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
        </div>
      </div>
      
      <!-- Filters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Expertise -->
        <select id="filter-validator-expertise" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Todas las especialidades</option>
          <option value="SaaS" ${currentFilters.validators.expertise === 'SaaS' ? 'selected' : ''}>SaaS</option>
          <option value="UX" ${currentFilters.validators.expertise === 'UX' ? 'selected' : ''}>UX/UI Design</option>
          <option value="Mobile" ${currentFilters.validators.expertise === 'Mobile' ? 'selected' : ''}>Mobile</option>
          <option value="Backend" ${currentFilters.validators.expertise === 'Backend' ? 'selected' : ''}>Backend</option>
          <option value="Frontend" ${currentFilters.validators.expertise === 'Frontend' ? 'selected' : ''}>Frontend</option>
          <option value="Marketing" ${currentFilters.validators.expertise === 'Marketing' ? 'selected' : ''}>Marketing</option>
        </select>
        
        <!-- Rating -->
        <select id="filter-validator-rating" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Cualquier rating</option>
          <option value="4.5">4.5+ estrellas</option>
          <option value="4.0">4.0+ estrellas</option>
          <option value="3.5">3.5+ estrellas</option>
          <option value="3.0">3.0+ estrellas</option>
        </select>
        
        <!-- Max Rate -->
        <select id="filter-validator-rate" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Cualquier tarifa</option>
          <option value="25">Hasta $25/h</option>
          <option value="50">Hasta $50/h</option>
          <option value="100">Hasta $100/h</option>
          <option value="150">Hasta $150/h</option>
        </select>
        
        <!-- Sort -->
        <select id="filter-validator-sort" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="rating" ${currentFilters.validators.sort === 'rating' ? 'selected' : ''}>Mejor valorados</option>
          <option value="rate_low" ${currentFilters.validators.sort === 'rate_low' ? 'selected' : ''}>Menor tarifa</option>
          <option value="rate_high" ${currentFilters.validators.sort === 'rate_high' ? 'selected' : ''}>Mayor tarifa</option>
          <option value="experience" ${currentFilters.validators.sort === 'experience' ? 'selected' : ''}>Más experiencia</option>
          <option value="popular" ${currentFilters.validators.sort === 'popular' ? 'selected' : ''}>Más populares</option>
        </select>
        
        <!-- Clear Button -->
        <button onclick="clearValidatorFilters()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          <i class="fas fa-times mr-2"></i>Limpiar
        </button>
      </div>
      
      <!-- Results Count -->
      <div id="validator-results-count" class="mt-4 text-sm text-gray-600"></div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('validator-search-input').addEventListener('input', debounce(applyValidatorFilters, 500));
  document.getElementById('filter-validator-expertise').addEventListener('change', applyValidatorFilters);
  document.getElementById('filter-validator-rating').addEventListener('change', applyValidatorFilters);
  document.getElementById('filter-validator-rate').addEventListener('change', applyValidatorFilters);
  document.getElementById('filter-validator-sort').addEventListener('change', applyValidatorFilters);
}

// Apply product filters
async function applyProductFilters() {
  const searchTerm = document.getElementById('product-search-input')?.value || '';
  const category = document.getElementById('filter-product-category')?.value || '';
  const stage = document.getElementById('filter-product-stage')?.value || '';
  const budget = document.getElementById('filter-product-budget')?.value || '';
  const sort = document.getElementById('filter-product-sort')?.value || 'recent';
  
  // Update current filters
  currentFilters.products = { q: searchTerm, category, stage, sort };
  
  // Build query params
  const params = new URLSearchParams();
  if (searchTerm) params.append('q', searchTerm);
  if (category) params.append('category', category);
  if (stage) params.append('stage', stage);
  if (sort) params.append('sort', sort);
  
  if (budget) {
    const [min, max] = budget.split('-');
    if (min) params.append('min_budget', min);
    if (max && max !== '+') params.append('max_budget', max);
  }
  
  try {
    const endpoint = searchTerm || category || stage || budget || sort !== 'recent' 
      ? `/api/marketplace/products/search?${params}` 
      : '/api/marketplace/products';
    
    const response = await axios.get(endpoint);
    products = response.data.products || [];
    
    // Update UI
    renderProducts();
    
    // Show results count
    const resultsCount = document.getElementById('product-results-count');
    if (resultsCount) {
      resultsCount.textContent = `Se encontraron ${products.length} producto${products.length !== 1 ? 's' : ''}`;
    }
    
  } catch (error) {
    console.error('Error applying product filters:', error);
    showToast('Error al aplicar filtros', 'error');
  }
}

// Apply validator filters
async function applyValidatorFilters() {
  const searchTerm = document.getElementById('validator-search-input')?.value || '';
  const expertise = document.getElementById('filter-validator-expertise')?.value || '';
  const minRating = document.getElementById('filter-validator-rating')?.value || '';
  const maxRate = document.getElementById('filter-validator-rate')?.value || '';
  const sort = document.getElementById('filter-validator-sort')?.value || 'rating';
  
  // Update current filters
  currentFilters.validators = { q: searchTerm, expertise, min_rating: minRating, max_rate: maxRate, sort };
  
  // Build query params
  const params = new URLSearchParams();
  if (searchTerm) params.append('q', searchTerm);
  if (expertise) params.append('expertise', expertise);
  if (minRating) params.append('min_rating', minRating);
  if (maxRate) params.append('max_rate', maxRate);
  if (sort) params.append('sort', sort);
  
  try {
    const endpoint = searchTerm || expertise || minRating || maxRate || sort !== 'rating'
      ? `/api/marketplace/validators/search?${params}`
      : '/api/marketplace/validators';
    
    const response = await axios.get(endpoint);
    validators = response.data.validators || [];
    
    // Update UI
    renderValidators();
    
    // Show results count
    const resultsCount = document.getElementById('validator-results-count');
    if (resultsCount) {
      resultsCount.textContent = `Se encontraron ${validators.length} validador${validators.length !== 1 ? 'es' : ''}`;
    }
    
  } catch (error) {
    console.error('Error applying validator filters:', error);
    showToast('Error al aplicar filtros', 'error');
  }
}

// Clear product filters
function clearProductFilters() {
  currentFilters.products = {
    q: '',
    category: '',
    stage: '',
    min_budget: '',
    max_budget: '',
    sort: 'recent'
  };
  
  renderProductFilters();
  loadProducts();
}

// Clear validator filters
function clearValidatorFilters() {
  currentFilters.validators = {
    q: '',
    expertise: '',
    min_rating: '',
    max_rate: '',
    availability: '',
    sort: 'rating'
  };
  
  renderValidatorFilters();
  loadValidators();
}

// Toast notification function
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : 
                  type === 'error' ? 'bg-red-500' : 
                  type === 'warning' ? 'bg-yellow-500' : 
                  'bg-blue-500';
  
  toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg ${bgColor} text-white z-50 transform transition-all duration-300 translate-x-0`;
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// NOTIFICATIONS SYSTEM
// ============================================

// Start polling for notifications
function startNotificationsPolling() {
  if (!authToken) return;
  
  // Load immediately
  loadNotifications();
  
  // Poll every 30 seconds
  notificationsInterval = setInterval(loadNotifications, 30000);
}

// Stop polling
function stopNotificationsPolling() {
  if (notificationsInterval) {
    clearInterval(notificationsInterval);
    notificationsInterval = null;
  }
}

// Load notifications and update bell icon
async function loadNotifications() {
  if (!authToken) return;
  
  try {
    const response = await axios.get('/api/marketplace/notifications/unread-count', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    unreadNotifications = response.data.unread_count || 0;
    updateNotificationBell();
    
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

// Update notification bell UI
function updateNotificationBell() {
  const bell = document.getElementById('notification-bell');
  if (!bell) return;
  
  if (unreadNotifications > 0) {
    bell.innerHTML = `
      <div class="relative cursor-pointer hover:opacity-80 transition" onclick="showNotificationsModal()">
        <i class="fas fa-bell text-2xl text-primary"></i>
        <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
          ${unreadNotifications > 9 ? '9+' : unreadNotifications}
        </span>
      </div>
    `;
  } else {
    bell.innerHTML = `
      <div class="cursor-pointer hover:opacity-80 transition" onclick="showNotificationsModal()">
        <i class="fas fa-bell text-2xl text-gray-400"></i>
      </div>
    `;
  }
}

// Show notifications modal
async function showNotificationsModal() {
  if (!authToken) {
    showAuthModal('login');
    return;
  }
  
  try {
    const response = await axios.get('/api/marketplace/notifications?limit=50', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const notifications = response.data.notifications || [];
    
    const modal = document.createElement('div');
    modal.id = 'notifications-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 px-4';
    modal.onclick = (e) => {
      if (e.target === modal) closeNotificationsModal();
    };
    
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold flex items-center">
              <i class="fas fa-bell mr-3"></i>
              Notificaciones
              ${unreadNotifications > 0 ? `<span class="ml-3 bg-white text-primary text-sm px-3 py-1 rounded-full">${unreadNotifications} nuevas</span>` : ''}
            </h2>
            <button onclick="closeNotificationsModal()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition">
              <i class="fas fa-times"></i>
            </button>
          </div>
          ${notifications.length > 0 ? `
            <div class="mt-4 flex space-x-3">
              <button onclick="markAllAsRead()" class="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition">
                <i class="fas fa-check-double mr-2"></i>Marcar todas como leídas
              </button>
            </div>
          ` : ''}
        </div>
        
        <!-- Notifications List -->
        <div class="overflow-y-auto max-h-[60vh]">
          ${notifications.length === 0 ? `
            <div class="text-center py-12">
              <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-600 text-lg">No tienes notificaciones</p>
            </div>
          ` : notifications.map(notif => `
            <div class="border-b border-gray-200 p-4 hover:bg-gray-50 transition ${notif.read === 0 ? 'bg-blue-50' : ''}">
              <div class="flex items-start space-x-3">
                <!-- Icon -->
                <div class="flex-shrink-0 w-10 h-10 rounded-full ${getNotificationColor(notif.type)} flex items-center justify-center">
                  <i class="fas fa-${getNotificationIcon(notif.type)} text-white"></i>
                </div>
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900 ${notif.read === 0 ? 'text-primary' : ''}">
                        ${notif.read === 0 ? '<i class="fas fa-circle text-xs mr-2"></i>' : ''}
                        ${escapeHtml(notif.title)}
                      </h4>
                      <p class="text-gray-600 text-sm mt-1">${escapeHtml(notif.message)}</p>
                      <p class="text-gray-400 text-xs mt-2">
                        <i class="far fa-clock mr-1"></i>${formatNotificationTime(notif.created_at)}
                      </p>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex items-center space-x-2 ml-3">
                      ${notif.read === 0 ? `
                        <button onclick="markAsRead(${notif.id})" class="text-gray-400 hover:text-primary text-sm" title="Marcar como leída">
                          <i class="fas fa-check"></i>
                        </button>
                      ` : ''}
                      <button onclick="deleteNotification(${notif.id})" class="text-gray-400 hover:text-red-600 text-sm" title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  ${notif.link ? `
                    <button onclick="handleNotificationClick(${notif.id}, '${notif.link}')" class="mt-3 text-primary text-sm font-semibold hover:underline">
                      Ver detalles <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('Failed to load notifications:', error);
    showToast('Error al cargar notificaciones', 'error');
  }
}

// Close notifications modal
function closeNotificationsModal() {
  const modal = document.getElementById('notifications-modal');
  if (modal) {
    modal.remove();
  }
}

// Mark notification as read
async function markAsRead(notifId) {
  try {
    await axios.put(`/api/marketplace/notifications/${notifId}/read`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    unreadNotifications = Math.max(0, unreadNotifications - 1);
    updateNotificationBell();
    
    // Refresh modal
    closeNotificationsModal();
    showNotificationsModal();
    
  } catch (error) {
    console.error('Failed to mark as read:', error);
    showToast('Error al marcar notificación', 'error');
  }
}

// Mark all as read
async function markAllAsRead() {
  try {
    await axios.put('/api/marketplace/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    unreadNotifications = 0;
    updateNotificationBell();
    
    // Refresh modal
    closeNotificationsModal();
    showNotificationsModal();
    
    showToast('Todas las notificaciones marcadas como leídas', 'success');
    
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    showToast('Error al marcar notificaciones', 'error');
  }
}

// Delete notification
async function deleteNotification(notifId) {
  if (!confirm('¿Eliminar esta notificación?')) return;
  
  try {
    await axios.delete(`/api/marketplace/notifications/${notifId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Refresh modal
    closeNotificationsModal();
    showNotificationsModal();
    loadNotifications(); // Update count
    
    showToast('Notificación eliminada', 'success');
    
  } catch (error) {
    console.error('Failed to delete notification:', error);
    showToast('Error al eliminar notificación', 'error');
  }
}

// Handle notification click (navigate and mark as read)
async function handleNotificationClick(notifId, link) {
  await markAsRead(notifId);
  closeNotificationsModal();
  window.location.href = link;
}

// Get notification icon based on type
function getNotificationIcon(type) {
  const icons = {
    'new_application': 'paper-plane',
    'application_approved': 'check-circle',
    'application_rejected': 'times-circle',
    'contract_created': 'file-contract',
    'contract_completed': 'flag-checkered',
    'new_review': 'star',
    'new_message': 'comment'
  };
  return icons[type] || 'bell';
}

// Get notification color based on type
function getNotificationColor(type) {
  const colors = {
    'new_application': 'bg-blue-500',
    'application_approved': 'bg-green-500',
    'application_rejected': 'bg-red-500',
    'contract_created': 'bg-purple-500',
    'contract_completed': 'bg-indigo-500',
    'new_review': 'bg-yellow-500',
    'new_message': 'bg-pink-500'
  };
  return colors[type] || 'bg-gray-500';
}

// Format notification time (relative)
function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId + '-content');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    showTab(sectionId);
  }
}

function showProductDetail(productId) {
  window.location.href = `/marketplace/product/${productId}`;
}

function showValidatorProfile(validatorId) {
  window.location.href = `/marketplace/validator/${validatorId}`;
}

function showCreateProductModal() {
  if (!currentUser) {
    showAuthModal('login');
    return;
  }
  
  alert('Funcionalidad de crear producto próximamente...');
}

async function loadMyDashboard() {
  const dashboardContent = document.getElementById('dashboard-content');
  
  if (!currentUser) {
    dashboardContent.innerHTML = '<p class="text-gray-600">Debes iniciar sesión para ver tu dashboard</p>';
    return;
  }
  
  dashboardContent.innerHTML = '<p class="text-gray-600 flex items-center"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando métricas...</p>';
  
  try {
    const response = await axios.get('/api/marketplace/dashboard/metrics', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const metrics = response.data;
    
    if (metrics.role === 'validator') {
      renderValidatorDashboard(metrics);
    } else {
      renderFounderDashboard(metrics);
    }
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    dashboardContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar dashboard</p>
      </div>
    `;
  }
}

// Render validator dashboard
function renderValidatorDashboard(metrics) {
  const dashboardContent = document.getElementById('dashboard-content');
  
  dashboardContent.innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white mb-6">
      <h2 class="text-3xl font-bold mb-2">Mi Dashboard de Validador</h2>
      <p class="text-purple-100">Resumen de tu actividad y ganancias</p>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Ganancias Totales</p>
            <h3 class="text-3xl font-bold text-green-600">$${metrics.total_earnings.toFixed(2)}</h3>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-dollar-sign text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Rating</p>
            <h3 class="text-3xl font-bold text-yellow-600">${metrics.rating.toFixed(1)}</h3>
            <div class="flex items-center mt-1">
              ${Array(5).fill(0).map((_, i) => `
                <i class="fas fa-star text-yellow-400 text-sm ${i < Math.floor(metrics.rating) ? '' : 'opacity-30'}"></i>
              `).join('')}
            </div>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <i class="fas fa-star text-yellow-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Contratos Activos</p>
            <h3 class="text-3xl font-bold text-blue-600">${metrics.active_sessions || 0}</h3>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-briefcase text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Total Validaciones</p>
            <h3 class="text-3xl font-bold text-purple-600">${metrics.total_validations}</h3>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-check-circle text-purple-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Charts Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Earnings Chart -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-chart-line text-green-600 mr-2"></i>
          Ganancias por Mes
        </h3>
        <canvas id="earnings-chart" height="250"></canvas>
      </div>
      
      <!-- Applications Chart -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-chart-pie text-blue-600 mr-2"></i>
          Estado de Aplicaciones
        </h3>
        <canvas id="applications-chart" height="250"></canvas>
      </div>
    </div>
    
    <!-- Applications Stats -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Aplicaciones</h3>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <p class="text-yellow-600 text-sm font-semibold">Pendientes</p>
          <p class="text-3xl font-bold text-yellow-600 mt-2">${metrics.applications.pending}</p>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <p class="text-green-600 text-sm font-semibold">Aprobadas</p>
          <p class="text-3xl font-bold text-green-600 mt-2">${metrics.applications.approved}</p>
        </div>
        <div class="text-center p-4 bg-red-50 rounded-lg">
          <p class="text-red-600 text-sm font-semibold">Rechazadas</p>
          <p class="text-3xl font-bold text-red-600 mt-2">${metrics.applications.rejected}</p>
        </div>
      </div>
    </div>
  `;
  
  // Create charts
  createEarningsChart(metrics.monthly_earnings);
  createApplicationsChart(metrics.applications);
}

// Render founder dashboard
function renderFounderDashboard(metrics) {
  const dashboardContent = document.getElementById('dashboard-content');
  
  dashboardContent.innerHTML = `
    <!-- Header -->
    <div class="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white mb-6">
      <h2 class="text-3xl font-bold mb-2">Mi Dashboard de Founder</h2>
      <p class="text-purple-100">Gestiona tus productos y validadores</p>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Total Productos</p>
            <h3 class="text-3xl font-bold text-primary">${metrics.total_products}</h3>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-box text-primary text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Productos Activos</p>
            <h3 class="text-3xl font-bold text-green-600">${metrics.active_products}</h3>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Contratos Activos</p>
            <h3 class="text-3xl font-bold text-blue-600">${metrics.active_sessions || 0}</h3>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-briefcase text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Completados</p>
            <h3 class="text-3xl font-bold text-indigo-600">${metrics.completed_sessions || 0}</h3>
          </div>
          <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <i class="fas fa-flag-checkered text-indigo-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Charts Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Products Chart -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-chart-bar text-primary mr-2"></i>
          Productos Creados por Mes
        </h3>
        <canvas id="products-chart" height="250"></canvas>
      </div>
      
      <!-- Applications Received Chart -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-chart-pie text-blue-600 mr-2"></i>
          Aplicaciones Recibidas
        </h3>
        <canvas id="applications-received-chart" height="250"></canvas>
      </div>
    </div>
    
    <!-- Applications Stats -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Aplicaciones Recibidas</h3>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <p class="text-yellow-600 text-sm font-semibold">Pendientes</p>
          <p class="text-3xl font-bold text-yellow-600 mt-2">${metrics.applications.pending}</p>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <p class="text-green-600 text-sm font-semibold">Aprobadas</p>
          <p class="text-3xl font-bold text-green-600 mt-2">${metrics.applications.approved}</p>
        </div>
        <div class="text-center p-4 bg-red-50 rounded-lg">
          <p class="text-red-600 text-sm font-semibold">Rechazadas</p>
          <p class="text-3xl font-bold text-red-600 mt-2">${metrics.applications.rejected}</p>
        </div>
      </div>
    </div>
  `;
  
  // Create charts
  createProductsChart(metrics.monthly_products);
  createApplicationsReceivedChart(metrics.applications);
}

// Create earnings line chart
function createEarningsChart(data) {
  const ctx = document.getElementById('earnings-chart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => {
        const [year, month] = d.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }).reverse(),
      datasets: [{
        label: 'Ingresos ($)',
        data: data.map(d => d.amount).reverse(),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

// Create applications pie chart
function createApplicationsChart(applications) {
  const ctx = document.getElementById('applications-chart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
      datasets: [{
        data: [
          applications.pending,
          applications.approved,
          applications.rejected
        ],
        backgroundColor: [
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Create products bar chart
function createProductsChart(data) {
  const ctx = document.getElementById('products-chart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => {
        const [year, month] = d.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }).reverse(),
      datasets: [{
        label: 'Productos',
        data: data.map(d => d.count).reverse(),
        backgroundColor: 'rgb(99, 102, 241)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// Create applications received pie chart
function createApplicationsReceivedChart(applications) {
  const ctx = document.getElementById('applications-received-chart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
      datasets: [{
        data: [
          applications.pending,
          applications.approved,
          applications.rejected
        ],
        backgroundColor: [
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// ============================================
// MESSAGING SYSTEM
// ============================================

function openChatWithValidator(validatorId, validatorName) {
  if (!authToken) {
    showAuthModal('login');
    return;
  }
  
  // Show chat modal
  const modal = document.getElementById('chat-modal') || createChatModal();
  const modalTitle = document.getElementById('chat-modal-title');
  const messagesContainer = document.getElementById('chat-messages');
  const messageForm = document.getElementById('chat-message-form');
  
  modalTitle.textContent = `Chat con ${validatorName}`;
  messagesContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Cargando mensajes...</p>';
  
  modal.classList.remove('hidden');
  
  // Store current chat info
  window.currentChat = {
    validatorId,
    validatorName,
    sessionId: null // Will be set when we have an active session
  };
  
  // Load messages (if there's an active session)
  loadChatMessages(validatorId);
  
  // Setup form handler
  messageForm.onsubmit = (e) => {
    e.preventDefault();
    sendChatMessage();
  };
}

function createChatModal() {
  const modal = document.createElement('div');
  modal.id = 'chat-modal';
  modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 id="chat-modal-title" class="text-xl font-bold text-gray-900">Chat</h3>
        <button onclick="closeChatModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Messages Container -->
      <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3" style="min-height: 300px; max-height: 500px;">
        <!-- Messages will be loaded here -->
      </div>
      
      <!-- Input Form -->
      <form id="chat-message-form" class="border-t p-4">
        <div class="flex gap-2">
          <input 
            type="text" 
            id="chat-message-input" 
            placeholder="Escribe tu mensaje..." 
            required
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
          <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition font-semibold">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          <i class="fas fa-info-circle"></i> Los mensajes se enviarán cuando tengas una sesión de validación activa con este validador.
        </p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function closeChatModal() {
  const modal = document.getElementById('chat-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  window.currentChat = null;
}

async function loadChatMessages(validatorId) {
  const messagesContainer = document.getElementById('chat-messages');
  
  try {
    // First, check if there's an active session with this validator
    const response = await axios.get(`/api/marketplace/sessions/validator/${validatorId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.data.session) {
      messagesContainer.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-comments text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-600 mb-2">Aún no tienes una sesión activa con este validador</p>
          <p class="text-sm text-gray-500">Primero debes aplicar a uno de sus productos y ser aceptado</p>
        </div>
      `;
      return;
    }
    
    const sessionId = response.data.session.id;
    window.currentChat.sessionId = sessionId;
    
    // Load messages for this session
    const messagesResponse = await axios.get(`/api/marketplace/sessions/${sessionId}/messages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const messages = messagesResponse.data.messages || [];
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-comment-dots text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-600">No hay mensajes aún</p>
          <p class="text-sm text-gray-500">¡Envía el primer mensaje!</p>
        </div>
      `;
    } else {
      renderChatMessages(messages);
    }
    
  } catch (error) {
    console.error('Error loading messages:', error);
    messagesContainer.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-circle text-4xl text-red-300 mb-3"></i>
        <p class="text-gray-600">No se pudieron cargar los mensajes</p>
        <p class="text-sm text-gray-500">${error.response?.data?.error || 'Error desconocido'}</p>
      </div>
    `;
  }
}

function renderChatMessages(messages) {
  const messagesContainer = document.getElementById('chat-messages');
  
  messagesContainer.innerHTML = messages.map(msg => {
    const isOwnMessage = msg.sender_id === currentUser?.id;
    return `
      <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
        <div class="${isOwnMessage ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 max-w-[70%]">
          <p class="text-sm">${escapeHtml(msg.message)}</p>
          <span class="text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mt-1 block">
            ${new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    `;
  }).join('');
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-message-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  if (!window.currentChat?.sessionId) {
    showToast('No hay una sesión activa para enviar mensajes', 'error');
    return;
  }
  
  try {
    await axios.post(`/api/marketplace/sessions/${window.currentChat.sessionId}/messages`, {
      message
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    input.value = '';
    
    // Reload messages
    loadChatMessages(window.currentChat.validatorId);
    
    showToast('Mensaje enviado', 'success');
    
  } catch (error) {
    console.error('Error sending message:', error);
    showToast('Error al enviar mensaje: ' + (error.response?.data?.error || 'Error desconocido'), 'error');
  }
}

// ============================================
// ADD VALIDATOR TO PRODUCT
// ============================================

async function openSelectProductModal(validatorId, validatorName) {
  if (!authToken || currentUser?.role !== 'founder') {
    showToast('Solo founders pueden añadir validadores a productos', 'error');
    return;
  }
  
  // Load founder's products
  try {
    const response = await axios.get('/api/marketplace/my-products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const myProducts = response.data.products || [];
    
    if (myProducts.length === 0) {
      showToast('Primero debes crear un producto', 'error');
      return;
    }
    
    // Create or get modal
    const modal = document.getElementById('select-product-modal') || createSelectProductModal();
    const modalTitle = document.getElementById('select-product-modal-title');
    const productsContainer = document.getElementById('select-product-list');
    
    modalTitle.textContent = `Añadir ${validatorName} a producto`;
    
    // Render products
    productsContainer.innerHTML = myProducts.map(product => {
      // Get current validators count for this product
      return `
        <div class="border border-gray-200 rounded-lg p-4 hover:border-primary transition cursor-pointer" onclick="addValidatorToProduct(${validatorId}, ${product.id}, '${escapeHtml(validatorName)}')">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-bold text-gray-900 mb-1">${escapeHtml(product.title)}</h4>
              <p class="text-sm text-gray-600 mb-2 line-clamp-1">${escapeHtml(product.description)}</p>
              <div class="flex gap-2 items-center text-xs">
                <span class="badge bg-primary/10 text-primary">${escapeHtml(product.category)}</span>
                <span class="badge bg-purple-100 text-purple-800">${escapeHtml(product.stage)}</span>
                <span class="text-gray-500">
                  <i class="fas fa-users mr-1"></i>
                  ${product.validators_count || 0}/${product.max_validators || 3} validadores
                </span>
              </div>
            </div>
            <i class="fas fa-arrow-right text-primary text-xl ml-4"></i>
          </div>
        </div>
      `;
    }).join('');
    
    modal.classList.remove('hidden');
    
    // Store current validator info
    window.currentValidatorSelection = { validatorId, validatorName };
    
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Error al cargar tus productos', 'error');
  }
}

function createSelectProductModal() {
  const modal = document.createElement('div');
  modal.id = 'select-product-modal';
  modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h3 id="select-product-modal-title" class="text-xl font-bold text-gray-900">Seleccionar Producto</h3>
        <button onclick="closeSelectProductModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Products List -->
      <div id="select-product-list" class="flex-1 overflow-y-auto p-6 space-y-3">
        <!-- Products will be loaded here -->
      </div>
      
      <!-- Footer -->
      <div class="border-t p-4 bg-gray-50">
        <p class="text-sm text-gray-600">
          <i class="fas fa-info-circle mr-1"></i>
          Selecciona el producto al que quieres invitar a este validador. El validador recibirá una invitación.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function closeSelectProductModal() {
  const modal = document.getElementById('select-product-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  window.currentValidatorSelection = null;
}

async function addValidatorToProduct(validatorId, productId, validatorName) {
  if (!authToken) return;
  
  try {
    // Create an invitation (or direct application)
    const response = await axios.post(`/api/marketplace/products/${productId}/invite-validator`, {
      validator_id: validatorId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    closeSelectProductModal();
    showToast(`✅ ${validatorName} ha sido invitado al producto`, 'success');
    
  } catch (error) {
    console.error('Error inviting validator:', error);
    const errorMsg = error.response?.data?.error || 'Error al invitar validador';
    
    if (errorMsg.includes('limit')) {
      showToast('⚠️ Has alcanzado el límite de validadores para este producto', 'error');
    } else if (errorMsg.includes('already')) {
      showToast('ℹ️ Este validador ya fue invitado a este producto', 'error');
    } else {
      showToast('Error: ' + errorMsg, 'error');
    }
  }
}

// ============================================
// CREATE PRODUCT
// ============================================

async function showCreateProductModal() {
  if (!authToken || currentUser?.role !== 'founder') {
    showToast('Solo founders pueden crear productos', 'error');
    return;
  }
  
  // Create or get modal
  const modal = document.getElementById('create-product-modal') || createProductModal();
  const form = document.getElementById('create-product-form');
  
  // Reset form
  form.reset();
  
  // Load user's plan limits
  try {
    const response = await axios.get('/api/plans/my/current', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const { user_plan, usage } = response.data;
    
    // Update plan info in modal
    const planLimitText = document.getElementById('plan-product-limit');
    if (planLimitText) {
      const limit = usage.products.is_unlimited ? '∞ (ilimitados)' : usage.products.limit;
      planLimitText.textContent = limit;
      
      // Show warning if close to limit
      const infoBox = planLimitText.closest('.bg-blue-50');
      if (!usage.products.is_unlimited && usage.products.percentage >= 80) {
        infoBox.classList.remove('bg-blue-50', 'border-blue-200');
        infoBox.classList.add('bg-orange-50', 'border-orange-200');
        infoBox.querySelector('.text-blue-800').classList.remove('text-blue-800');
        infoBox.querySelector('p').classList.add('text-orange-800');
        infoBox.querySelector('p').innerHTML = `
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <strong>Atención:</strong> Has usado ${usage.products.used} de ${usage.products.limit} productos (${usage.products.percentage}%). 
          <a href="#" onclick="showUpgradeModal(); return false;" class="underline font-semibold">Actualizar plan</a>
        `;
      }
    }
    
  } catch (error) {
    console.error('Error loading plan limits:', error);
  }
  
  modal.classList.remove('hidden');
}

function createProductModal() {
  const modal = document.createElement('div');
  modal.id = 'create-product-modal';
  modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="text-2xl font-bold text-gray-900">
          <i class="fas fa-rocket text-primary mr-2"></i>
          Publicar Producto Beta
        </h3>
        <button onclick="closeCreateProductModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Form -->
      <form id="create-product-form" class="p-6 space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Título del Producto <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="title" 
            required 
            placeholder="Ej: HealthTrack AI - App de Salud Personal"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
        </div>
        
        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Descripción <span class="text-red-500">*</span>
          </label>
          <textarea 
            name="description" 
            required 
            rows="4"
            placeholder="Describe tu producto, características principales y qué problema resuelve..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          ></textarea>
        </div>
        
        <!-- Category & Stage -->
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span class="text-red-500">*</span>
            </label>
            <select 
              name="category" 
              required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona categoría</option>
              <option value="SaaS">SaaS</option>
              <option value="Mobile App">Mobile App</option>
              <option value="Web App">Web App</option>
              <option value="E-commerce">E-commerce</option>
              <option value="FinTech">FinTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="EdTech">EdTech</option>
              <option value="AI/ML">AI/ML</option>
              <option value="IoT">IoT</option>
              <option value="Blockchain">Blockchain</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Etapa <span class="text-red-500">*</span>
            </label>
            <select 
              name="stage" 
              required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona etapa</option>
              <option value="idea">Idea</option>
              <option value="prototype">Prototipo</option>
              <option value="mvp">MVP</option>
              <option value="beta">Beta</option>
              <option value="launched">Lanzado</option>
            </select>
          </div>
        </div>
        
        <!-- URL (optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            URL del Producto (opcional)
          </label>
          <input 
            type="url" 
            name="url" 
            placeholder="https://miproducto.com"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
        </div>
        
        <!-- Compensation -->
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Compensación <span class="text-red-500">*</span>
            </label>
            <select 
              name="compensation_type" 
              required 
              onchange="toggleCompensationAmount(this.value)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Tipo de compensación</option>
              <option value="free">Gratis</option>
              <option value="paid">Pago</option>
              <option value="equity">Equity</option>
            </select>
          </div>
          
          <div id="compensation-amount-field" class="hidden">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Monto ($)
            </label>
            <input 
              type="number" 
              name="compensation_amount" 
              min="0"
              placeholder="500"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
          </div>
        </div>
        
        <!-- Duration & Validators -->
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Duración (días) <span class="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              name="duration_days" 
              required 
              min="1"
              placeholder="30"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Validadores Necesarios <span class="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              name="validators_needed" 
              required 
              min="1"
              max="10"
              placeholder="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
          </div>
        </div>
        
        <!-- Requirements -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Requisitos para Validadores
          </label>
          <textarea 
            name="requirements" 
            rows="3"
            placeholder="Ej: Experiencia en desarrollo mobile, conocimiento de healthcare, inglés nivel medio..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          ></textarea>
        </div>
        
        <!-- Looking For -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ¿Qué buscas específicamente?
          </label>
          <input 
            type="text" 
            name="looking_for" 
            placeholder="Ej: Feedback sobre UX, testing de bugs, validación de mercado..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
        </div>
        
        <!-- Submit Button -->
        <div class="flex gap-3 pt-4">
          <button 
            type="submit" 
            class="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
          >
            <i class="fas fa-rocket mr-2"></i>
            Publicar Producto
          </button>
          <button 
            type="button" 
            onclick="closeCreateProductModal()" 
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Cancelar
          </button>
        </div>
      </form>
      
      <!-- Plan Limits Info -->
      <div class="px-6 pb-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>Tu Plan:</strong> Puedes crear hasta <strong id="plan-product-limit">--</strong> productos activos.
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add form submit handler
  document.getElementById('create-product-form').addEventListener('submit', handleCreateProduct);
  
  return modal;
}

function closeCreateProductModal() {
  const modal = document.getElementById('create-product-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function toggleCompensationAmount(type) {
  const amountField = document.getElementById('compensation-amount-field');
  if (type === 'paid') {
    amountField.classList.remove('hidden');
  } else {
    amountField.classList.add('hidden');
  }
}

async function handleCreateProduct(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const productData = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    stage: formData.get('stage'),
    url: formData.get('url') || null,
    compensation_type: formData.get('compensation_type'),
    compensation_amount: formData.get('compensation_amount') ? parseFloat(formData.get('compensation_amount')) : 0,
    duration_days: parseInt(formData.get('duration_days')),
    validators_needed: parseInt(formData.get('validators_needed')),
    requirements: formData.get('requirements') || null,
    looking_for: formData.get('looking_for') || null
  };
  
  try {
    const response = await axios.post('/api/marketplace/products', productData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    closeCreateProductModal();
    showToast('✅ Producto publicado exitosamente', 'success');
    
    // Reload products
    await loadProducts();
    
    // Switch to products tab
    showTab('products');
    
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMsg = error.response?.data?.error || 'Error al crear producto';
    
    if (errorMsg.includes('limit')) {
      showToast('⚠️ Has alcanzado el límite de productos de tu plan', 'error');
    } else {
      showToast('Error: ' + errorMsg, 'error');
    }
  }
}

console.log('🎯 Marketplace loaded successfully');
