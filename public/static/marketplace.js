// Marketplace Frontend JavaScript

// Global state
let currentUser = null;
let authToken = null;
let products = [];
let validators = [];

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    loadCurrentUser();
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
  
  // Load data if needed
  if (tabName === 'products' && products.length === 0) {
    loadProducts();
  } else if (tabName === 'validators' && validators.length === 0) {
    loadValidators();
  } else if (tabName === 'my-dashboard' && currentUser) {
    loadMyDashboard();
  }
}

// ============================================
// PRODUCTS
// ============================================

async function loadProducts() {
  try {
    const category = document.getElementById('category-filter')?.value || '';
    const stage = document.getElementById('stage-filter')?.value || '';
    const featured = document.getElementById('featured-filter')?.checked || false;
    
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (stage) params.append('stage', stage);
    if (featured) params.append('featured', '1');
    
    const response = await axios.get(`/api/marketplace/products?${params.toString()}`);
    products = response.data.products;
    
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
    const expertise = document.getElementById('expertise-filter')?.value || '';
    const min_rating = document.getElementById('rating-filter')?.value || '';
    const availability = document.getElementById('availability-filter')?.value || '';
    
    const params = new URLSearchParams();
    if (expertise) params.append('expertise', expertise);
    if (min_rating) params.append('min_rating', min_rating);
    if (availability) params.append('availability', availability);
    
    const response = await axios.get(`/api/marketplace/validators?${params.toString()}`);
    validators = response.data.validators;
    
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
          <button onclick="showValidatorProfile(${validator.id})" class="text-primary font-semibold text-sm hover:underline">
            Ver perfil <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
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
  
  dashboardContent.innerHTML = '<p class="text-gray-600">Cargando...</p>';
  // TODO: Load dashboard data
}

console.log('🎯 Marketplace loaded successfully');
