// Marketplace Frontend JavaScript

// Global state
let currentUser = null;
let authToken = null;
// products ya está declarado arriba
let validators = [];
let unreadNotifications = 0;
let notificationsInterval = null;

// Utility function to escape HTML
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Generate star display for product rating
// Version: 1.2 - Added debug logging
function generateProductStars(rating) {
  console.log('generateProductStars called with rating:', rating);
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-yellow-400 text-sm"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt text-yellow-400 text-sm"></i>';
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-gray-300 text-sm"></i>';
  }

  console.log('generateProductStars returning:', stars);
  return stars;
}

// Generate product vote buttons
function generateProductVoteButtons(item) {
  const productId = item.id;
  if (!currentUser) {
    return '<p class="text-sm text-gray-500">Inicia sesión para votar</p>';
  }

  // Check if user is a validator
  const isValidator = currentUser.validator_id !== null && currentUser.validator_id !== undefined;

  if (isValidator) {
    // For validators: show apply button instead of vote buttons
    return `
      <div class="flex items-center justify-between">
        <button onclick="event.stopPropagation(); applyToProduct(${productId})" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-semibold flex items-center">
          <i class="fas fa-plus mr-2"></i>Aplicar para validar
        </button>
        <div class="text-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${window.location.origin}/marketplace?product=${productId}`)}" alt="QR para compartir producto" class="inline-block">
          <p class="text-xs text-gray-500">Comparte este producto</p>
        </div>
      </div>
    `;
  }

  const voteUrl = `${window.location.origin}/marketplace?product=${productId}`;
  if (item.user_vote) {
    // Already voted, show their vote
    return `
      <div class="flex items-center space-x-2">
        <div class="text-sm text-green-600">Tu voto: ${item.user_vote} estrella${item.user_vote > 1 ? 's' : ''}</div>
        <div class="flex space-x-1">
          ${[1,2,3,4,5].map(r => `
            <span class="${r <= item.user_vote ? 'text-yellow-400' : 'text-gray-300'} text-lg">★</span>
          `).join('')}
        </div>
        <div class="text-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(voteUrl)}" alt="QR para compartir producto" class="inline-block">
          <p class="text-xs text-gray-500">Comparte este producto</p>
        </div>
      </div>
    `;
  } else {
    // Hasn't voted, show stars to vote
    return `
      <div class="flex items-center space-x-2">
        <div class="flex space-x-1">
          ${[1,2,3,4,5].map(rating => `
            <span onclick="event.stopPropagation(); voteForProduct(${productId}, ${rating})" class="cursor-pointer text-gray-300 hover:text-yellow-400 text-lg" title="Votar ${rating} estrella${rating > 1 ? 's' : ''}">
              ★
            </span>
          `).join('')}
        </div>
        <div class="text-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(voteUrl)}" alt="QR para compartir producto" class="inline-block">
          <p class="text-xs text-gray-500">Comparte este producto</p>
        </div>
      </div>
    `;
  }
}

// Vote for product function
async function voteForProduct(productId, rating = 1) {
  try {
    const response = await axios.post(`/api/marketplace/products/${productId}/vote`, { rating }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    // Reload marketplace items to update vote counts
    loadMarketplaceItems();
  } catch (error) {
    console.error('Failed to vote for product:', error);
  }
}

// Apply to validate product function
async function applyToProduct(productId) {
  if (!currentUser || !currentUser.validator_id) {
    showToast('Solo validadores pueden aplicar a productos', 'error');
    return;
  }

  try {
    const response = await axios.post(`/api/marketplace/products/${productId}/apply`, {
      message: 'Estoy interesado en validar este producto.'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    showToast('¡Aplicación enviada exitosamente! El fundador revisará tu solicitud.', 'success');
    // Reload marketplace items to update UI if needed
    loadMarketplaceItems();
  } catch (error) {
    console.error('Failed to apply to product:', error);
    const errorMessage = error.response?.data?.error || 'Error al aplicar al producto';
    showToast(errorMessage, 'error');
  }
}

// Show vote modal for QR voting
async function showVoteModal(productId) {
  try {
    const response = await axios.get(`/api/marketplace/products/${productId}`);
    const product = response.data;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 class="text-xl font-bold mb-4">Votar por ${escapeHtml(product.title)}</h2>
        <p class="mb-4">${escapeHtml(product.description)}</p>
        ${!currentUser ? '<p class="text-red-500 mb-4">Debes iniciar sesión para votar.</p>' : `
          <div class="mb-4">
            <p class="mb-2">Selecciona tu calificación:</p>
            <div class="flex space-x-1" id="star-rating">
              ${[1,2,3,4,5].map(r => `
                <span onclick="setRating(${r})" class="cursor-pointer text-2xl ${r <= 5 ? 'text-yellow-400' : 'text-gray-300'}" id="star-${r}">★</span>
              `).join('')}
            </div>
          </div>
        `}
        <div class="flex justify-end space-x-2">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-500 text-white rounded">Cancelar</button>
          ${currentUser ? `<button onclick="voteForProduct(${productId}, getSelectedRating()); this.closest('.fixed').remove()" class="px-4 py-2 bg-blue-500 text-white rounded">Votar</button>` : `<button onclick="showLoginModal(); this.closest('.fixed').remove()" class="px-4 py-2 bg-blue-500 text-white rounded">Iniciar Sesión</button>`}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Set initial rating to 5
    setRating(5);
  } catch (error) {
    console.error('Failed to load product for voting:', error);
  }
}

// Set rating in modal
function setRating(rating) {
  for (let i = 1; i <= 5; i++) {
    const star = document.getElementById(`star-${i}`);
    if (star) {
      star.className = `cursor-pointer text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`;
    }
  }
  // Store selected rating
  const modal = document.querySelector('.fixed');
  if (modal) modal.dataset.selectedRating = rating;
}

// Get selected rating
function getSelectedRating() {
  const modal = document.querySelector('.fixed');
  return modal ? parseInt(modal.dataset.selectedRating) || 5 : 5;
}

// Handle hash changes for voting and product detail
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  const voteMatch = hash.match(/^#vote-(\d+)$/);
  if (voteMatch) {
    const productId = parseInt(voteMatch[1]);
    showVoteModal(productId);
    // Clear hash after showing modal
    history.replaceState(null, null, ' ');
  }
  const productMatch = hash.match(/^#product-(\d+)$/);
  if (productMatch) {
    const productId = parseInt(productMatch[1]);
    showTab('product-detail');
    loadProductDetail(productId);
    // Clear hash after loading
    history.replaceState(null, null, ' ');
  }
});

// Load product detail
async function loadProductDetail(productId) {
  try {
    const response = await axios.get(`/api/marketplace/products/${productId}`);
    const product = response.data;

    // Get user vote if logged in
    let user_vote = null;
    if (currentUser) {
      try {
        const voteRes = await axios.get(`/api/marketplace/products/${productId}/vote`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        user_vote = voteRes.data.vote;
      } catch (e) {
        // No vote
      }
    }

    const item = { ...product, user_vote };

    const container = document.getElementById('product-detail-container');
    container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <button onclick="showTab('products')" class="text-primary hover:text-primary/80 font-medium">
            <i class="fas fa-arrow-left mr-2"></i>Volver al Marketplace
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="p-6 sm:p-8">
            <div class="flex flex-col lg:flex-row gap-6">
              <div class="flex-1">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">${escapeHtml(product.title)}</h1>
                
                <div class="flex items-center mb-4">
                  <span class="text-sm text-gray-600 mr-4">Por ${escapeHtml(product.company_name)}</span>
                  <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">${escapeHtml(product.category)}</span>
                </div>

                ${product.rating_average > 0 ? `
                  <div class="flex items-center mb-6">
                    ${generateProductStars(product.rating_average)}
                    <span class="ml-2 text-lg font-semibold text-gray-900">${product.rating_average.toFixed(1)}</span>
                    <span class="ml-2 text-sm text-gray-600">(${product.votes_count || 0} votos)</span>
                  </div>
                ` : ''}

                <!-- Product Details Form -->
                <div class="space-y-6">
                  <!-- Description -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(product.description || 'No especificada')}</p>
                    </div>
                  </div>

                  <!-- Category & Stage -->
                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <div class="bg-gray-50 px-4 py-2 rounded-lg">
                        <span class="text-gray-900">${escapeHtml(product.category || 'No especificada')}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Etapa
                      </label>
                      <div class="bg-gray-50 px-4 py-2 rounded-lg">
                        <span class="text-gray-900">${escapeHtml(product.stage || 'No especificada')}</span>
                      </div>
                    </div>
                  </div>

                  <!-- URL -->
                  ${product.url ? `
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        URL del Producto
                      </label>
                      <div class="bg-gray-50 px-4 py-2 rounded-lg">
                        <a href="${escapeHtml(product.url)}" target="_blank" class="text-primary hover:text-primary/80 underline">
                          ${escapeHtml(product.url)}
                        </a>
                      </div>
                    </div>
                  ` : ''}

                  <!-- Compensation -->
                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Compensación
                      </label>
                      <div class="bg-gray-50 px-4 py-2 rounded-lg">
                        <span class="text-gray-900">${escapeHtml(product.compensation_type || 'No especificada')}</span>
                        ${product.compensation_amount ? ` - $${product.compensation_amount}` : ''}
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Duración (días)
                      </label>
                      <div class="bg-gray-50 px-4 py-2 rounded-lg">
                        <span class="text-gray-900">${product.duration_days || 'No especificada'}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Validators Needed -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Validadores Necesarios
                    </label>
                    <div class="bg-gray-50 px-4 py-2 rounded-lg">
                      <span class="text-gray-900">${product.validators_needed || 'No especificada'}</span>
                    </div>
                  </div>

                  <!-- Requirements -->
                  ${product.requirements ? `
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Requisitos para Validadores
                      </label>
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(product.requirements)}</p>
                      </div>
                    </div>
                  ` : ''}

                  <!-- Looking For -->
                  ${product.looking_for ? `
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        ¿Qué buscas específicamente?
                      </label>
                      <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(product.looking_for)}</p>
                      </div>
                    </div>
                  ` : ''}
                </div>

                <!-- QR Code -->
                <div class="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">Comparte este producto</h3>
                  <div class="flex justify-center">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/marketplace?product=' + productId)}" alt="Código QR para compartir el producto" class="inline-block">
                  </div>
                  <p class="text-sm text-gray-600 text-center mt-4">Escanea el QR para ver el perfil completo del producto</p>
                </div>
              </div>

              <div class="lg:w-80">
                <div class="bg-gray-50 p-6 rounded-lg">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Votar por este producto</h3>
                  ${generateProductVoteButtons(item)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load product detail:', error);
    const container = document.getElementById('product-detail-container');
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar el producto</p>
        <button onclick="showTab('products')" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
          Volver al Marketplace
        </button>
      </div>
    `;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function checkProductHash() {
  // Check for product parameter in URL query
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  
  if (productId && /^\d+$/.test(productId)) {
    showTab('product-detail');
    loadProductDetail(parseInt(productId));
    // Clean up the URL
    history.replaceState(null, null, window.location.pathname);
  }
}

// Listen for browser navigation changes
window.addEventListener('popstate', checkProductHash);

// Mobile menu toggle
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  
  if (mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.remove('hidden');
    mobileMenuButton.innerHTML = '<i class="fas fa-times text-xl"></i>';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  } else {
    mobileMenu.classList.add('hidden');
    mobileMenuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  
  if (!mobileMenu?.contains(e.target) && !mobileMenuButton?.contains(e.target)) {
    mobileMenu?.classList.add('hidden');
    if (mobileMenuButton) {
      mobileMenuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    }
  }
});

// Check authentication on load
document.addEventListener('DOMContentLoaded', async () => {
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    loadCurrentUser();
    startNotificationsPolling();
  }
  
  // Check for product parameter immediately
  checkProductHash();
  
  // Load initial data
  await loadMarketplaceItems();
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
  const mobileAuthNav = document.getElementById('mobile-auth-nav');
  const createProductBtn = document.getElementById('create-product-btn');
  const myDashboardTab = document.getElementById('my-dashboard-tab');
  const productsTab = document.getElementById('products-tab');
  const validatorsTab = document.getElementById('validators-tab');
  const internalDashboardTab = document.getElementById('internal-dashboard-tab');
  const internalDashboardContent = document.getElementById('internal-dashboard-content');
  
  if (currentUser) {
    // Desktop auth nav
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
    
    // Mobile auth nav
    mobileAuthNav.innerHTML = `
      <button onclick="logout()" class="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 transition">
        <i class="fas fa-sign-out-alt mr-2"></i>Salir (${currentUser.name})
      </button>
    `;
    
    // Show dashboard tab for all authenticated users
    myDashboardTab.classList.remove('hidden');
    
    // Role-based tab visibility
    const isValidator = currentUser.validator_id !== null && currentUser.validator_id !== undefined;
    
    if (isValidator) {
      // Validators can see: Products and Dashboard
      productsTab.classList.remove('hidden');
      validatorsTab.classList.add('hidden');
    } else if (currentUser.role === 'founder') {
      // Founders can see: Products, Validators, and Dashboard
      productsTab.classList.remove('hidden');
      validatorsTab.classList.remove('hidden');
    } else {
      // Other roles: show all tabs
      productsTab.classList.remove('hidden');
      validatorsTab.classList.remove('hidden');
    }
    
    // Show create product button for founders
    if (currentUser.role === 'founder') {
      createProductBtn.classList.remove('hidden');
    }
  } else {
    // Not authenticated: show all tabs
    authNav.innerHTML = `
      <button onclick="showAuthModal('login')" class="text-gray-700 hover:text-primary transition mr-4">
        Iniciar Sesión
      </button>
      <button onclick="showAuthModal('register')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
        Registrarse
      </button>
    `;
    
    mobileAuthNav.innerHTML = `
      <button onclick="showAuthModal('login')" class="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary transition">
        <i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión
      </button>
      <button onclick="showAuthModal('register')" class="block w-full text-left px-3 py-2 mt-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
        <i class="fas fa-user-plus mr-2"></i>Registrarse
      </button>
    `;
    
    myDashboardTab.classList.add('hidden');
    createProductBtn.classList.add('hidden');
    productsTab.classList.remove('hidden');
    validatorsTab.classList.remove('hidden');
  }
  
  // Check if user is admin and update internal dashboard visibility
  if (currentUser && (currentUser.role === 'admin' || currentUser.email === 'cadamar1236@gmail.com')) {
    internalDashboardTab.classList.remove('hidden');
    loadInternalDashboard();
  } else {
    internalDashboardTab.classList.add('hidden');
    internalDashboardContent.innerHTML = '';
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
  const tabElement = document.getElementById(tabName + '-tab');
  
  // Check if tab is hidden (not accessible for this user role)
  if (tabElement && tabElement.classList.contains('hidden')) {
    // If trying to show a hidden tab, redirect to appropriate default tab
    if (currentUser && currentUser.validator_id) {
      // Validators: redirect to products
      showTab('products');
    } else {
      // Others: redirect to products
      showTab('products');
    }
    return;
  }
  
  // Update tab buttons only if tabElement exists
  if (tabElement) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('tab-active', 'text-primary');
      tab.classList.add('text-gray-600');
    });
    tabElement.classList.add('tab-active');
  }
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById(tabName + '-content').classList.remove('hidden');
  
  // Load data and render filters if needed
  if (tabName === 'products') {
    renderProductFilters();
    if (products.length === 0) {
      loadMarketplaceItems();
    }
  } else if (tabName === 'validators') {
    renderValidatorFilters();
    if (validators.length === 0) {
      loadValidators();
    }
  } else if (tabName === 'my-dashboard' && currentUser) {
    loadMyDashboard();
  } else if (tabName === 'internal-dashboard' && currentUser) {
    loadInternalDashboard();
  }
}

// ============================================
// PRODUCTS
// ============================================


let products = [];
let projects = [];

async function loadMarketplaceItems() {
  try {
    // Cargar productos del marketplace
    const productsRes = await axios.get('/api/marketplace/products');
    products = productsRes.data.products || [];
    console.log('Loaded products:', products.length, products.map(p => ({ id: p.id, title: p.title })));

    // No cargar proyectos - solo mostrar productos en el leaderboard
    projects = [];
    console.log('Projects disabled - only showing products');

    renderProductFilters();
    renderMarketplaceItems();
  } catch (error) {
    console.error('Failed to load marketplace items:', error);
    document.getElementById('products-grid').innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar productos</p>
      </div>
    `;
  }
}

function renderMarketplaceItems() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Solo mostrar productos - no hay proyectos que filtrar
  console.log('Rendering products only - no projects loaded');

  const allItems = products.map(p => ({
    ...p,
    type: 'product',
    votes: p.votes_count || 0,
    rating: p.rating_average || 0,
    company_name: p.company_name || '',
    url: p.url || `/product/${p.id}`,
    company_user_id: p.company_user_id
  }));

  console.log('Final allItems count:', allItems.length, 'Products only');

  // Ordenar por votos y rating
  allItems.sort((a, b) => (b.votes - a.votes) || (b.rating - a.rating));

  if (allItems.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 text-lg">No hay productos ni proyectos disponibles</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = allItems.map(item => `
    <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95 transform" onclick="${item.type === 'product' ? `showTab('product-detail'); loadProductDetail(${item.id})` : `window.location.href='${item.url}'`}">
      <div class="flex items-center justify-between mb-2">
        <span class="badge ${item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} text-xs font-semibold px-3 py-1">
          ${item.type === 'product' ? '<i class=\"fas fa-box\"></i> Producto' : '<i class=\"fas fa-lightbulb\"></i> Proyecto'}
        </span>
        ${item.type === 'product' && item.featured ? '<span class="badge bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1"><i class="fas fa-star mr-1"></i>Destacado</span>' : ''}
      </div>
      <div class="px-4 sm:px-6 pb-4 sm:pb-6">
        <div class="flex items-start justify-between mb-3 sm:mb-4">
          <div class="flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">${escapeHtml(item.title)}</h3>
            <p class="text-xs sm:text-sm text-gray-600 truncate">${escapeHtml(item.company_name)}</p>
          </div>
        </div>
        <p class="text-gray-700 mb-3 sm:mb-4 line-clamp-2 text-sm leading-relaxed">${escapeHtml(item.description)}</p>
        <div class="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
          ${item.category ? `<span class="badge bg-primary/10 text-primary text-xs px-2 py-1">${escapeHtml(item.category)}</span>` : ''}
          ${item.stage ? `<span class="badge bg-purple-100 text-purple-800 text-xs px-2 py-1">${escapeHtml(item.stage)}</span>` : ''}
          ${item.compensation_type === 'paid' ? `<span class="badge bg-green-100 text-green-800 text-xs px-2 py-1"><i class="fas fa-dollar-sign mr-1"></i>$${item.compensation_amount}</span>` : ''}
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          ${item.duration_days ? `<span class="flex items-center"><i class="far fa-calendar mr-1"></i>${item.duration_days} días</span>` : ''}
          <div class="flex items-center gap-2">
            <span class="text-primary font-semibold cursor-pointer hover:underline truncate min-h-[24px] flex items-center" onclick="event.stopPropagation(); ${item.type === 'product' ? `showTab('product-detail'); loadProductDetail(${item.id})` : `window.open('${escapeHtml(item.url)}', '_blank')`}">Ver detalles <i class="fas fa-arrow-right ml-1"></i></span>
            ${item.type === 'product' && currentUser && currentUser.id === item.company_user_id ? `
              <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" onclick="event.stopPropagation(); editProduct(${item.id})">
                <i class="fas fa-edit mr-1"></i>Editar
              </button>
              <button class="text-red-600 hover:text-red-800 text-xs font-medium" onclick="event.stopPropagation(); deleteProduct(${item.id})">
                <i class="fas fa-trash mr-1"></i>Borrar
              </button>
            ` : ''}
          </div>
        </div>
        ${item.rating > 0 ? `
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4 pt-2 sm:pt-3 border-t border-gray-100">
            <div class="flex items-center">
              ${generateProductStars(item.rating)}
              <span class="ml-2 text-sm font-semibold text-gray-700">${item.rating_average ? item.rating_average.toFixed(1) : item.rating.toFixed(1)}</span>
            </div>
            <span class="text-xs text-gray-500">${item.votes_count || 0} votos</span>
          </div>
        ` : ''}
        
        <div class="mt-3 sm:mt-4">
          ${generateProductVoteButtons(item)}
        </div>
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
      <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 transform">
        <div class="p-4 sm:p-6">
          <div class="flex items-start mb-4">
            <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg sm:text-2xl font-bold mr-3 sm:mr-4 flex-shrink-0">
              ${validator.name?.charAt(0) || 'V'}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-900 truncate text-base sm:text-lg">${escapeHtml(validator.name)}</h3>
              <p class="text-xs sm:text-sm text-gray-600 truncate mb-2">${escapeHtml(validator.title)}</p>
              <div class="flex items-center mb-2">
                <span class="text-yellow-500 text-sm">★</span>
                <span class="text-sm font-semibold ml-1">${validator.rating.toFixed(1)}</span>
                <span class="text-xs text-gray-500 ml-2">(${validator.total_validations} validaciones)</span>
              </div>
            </div>
          </div>
          
          ${validator.bio ? `<p class="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">${escapeHtml(validator.bio)}</p>` : ''}
          
          <div class="flex flex-wrap gap-1.5 mb-4">
            ${expertise.slice(0, 3).map(exp => `<span class="badge bg-blue-100 text-blue-800 text-xs px-2 py-1">${escapeHtml(exp)}</span>`).join('')}
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span class="text-xs sm:text-sm text-gray-600 font-medium">${validator.hourly_rate ? `$${validator.hourly_rate}/h` : 'Gratis'}</span>
            <div class="flex flex-wrap gap-2 items-center justify-end">
              ${authToken && currentUser?.role === 'founder' ? `
                <button onclick="event.stopPropagation(); openSelectProductModal(${validator.id}, '${escapeHtml(validator.name)}')" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition min-h-[44px] flex items-center justify-center">
                  <i class="fas fa-plus mr-1"></i>
                  <span class="hidden sm:inline">Añadir</span>
                  <span class="sm:hidden">Añadir</span>
                </button>
              ` : ''}
              <div class="flex gap-2">
                ${authToken ? `
                  <button onclick="event.stopPropagation(); openChatWithValidator(${validator.id}, '${escapeHtml(validator.name)}')" class="text-primary hover:text-primary/80 transition p-3 rounded-lg hover:bg-primary/5 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Enviar mensaje">
                    <i class="fas fa-comment-dots text-lg"></i>
                  </button>
                ` : ''}
                <button onclick="showValidatorProfile(${validator.id})" class="text-primary font-semibold text-sm hover:underline px-4 py-2 rounded-lg hover:bg-primary/5 transition min-h-[44px] flex items-center justify-center flex-1 sm:flex-none">
                  <i class="fas fa-user text-sm sm:mr-1"></i>
                  <span class="hidden sm:inline">Ver perfil</span>
                  <span class="sm:hidden">Perfil</span>
                </button>
              </div>
            </div>
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

// Reset product filters
function resetProductFilters() {
  document.getElementById('category-filter').value = '';
  document.getElementById('stage-filter').value = '';
  document.getElementById('compensation-filter').value = '';
  document.getElementById('featured-filter').checked = false;
  loadMarketplaceItems();
}

// Reset validator filters
function resetValidatorFilters() {
  document.getElementById('expertise-filter').value = '';
  document.getElementById('rating-filter').value = '';
  document.getElementById('availability-filter').value = '';
  loadValidators();
}
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
  loadMarketplaceItems();
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
// Check network connectivity
async function checkConnectivity() {
  try {
    // Try to fetch a small resource from the same domain
    const response = await fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Enhanced loadNotifications with connectivity check
async function loadNotifications() {
  if (!authToken) return;
  
  // Check connectivity first
  const isOnline = await checkConnectivity();
  if (!isOnline) {
    console.warn('No internet connection - skipping notification load');
    return;
  }
  
  try {
    const response = await axios.get('/api/marketplace/notifications/unread-count', {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000 // 5 second timeout
    });
    
    unreadNotifications = response.data.unread_count || 0;
    updateNotificationBell();
    
  } catch (error) {
    console.error('Failed to load notifications:', error);
    
    // Handle different error types
    if (error.code === 'ERR_INTERNET_DISCONNECTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.warn('Network connectivity issue - notifications will retry automatically');
      // Don't show user error for network issues, just retry later
    } else if (error.response?.status === 401) {
      console.warn('Authentication error - user may need to re-login');
      // Could show a login prompt here if needed
    } else {
      console.error('Unexpected error loading notifications:', error.message);
    }
    
    // Set to 0 on error to avoid showing stale data
    unreadNotifications = 0;
    updateNotificationBell();
  }
}

// Update notification bell UI
function updateNotificationBell() {
  const bell = document.getElementById('notification-bell');
  if (!bell) return;
  
  // Check if we have network issues (unreadNotifications is 0 due to error)
  const hasNetworkIssues = unreadNotifications === 0 && authToken; // Only show if user is logged in
  
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
      <div class="relative cursor-pointer hover:opacity-80 transition" onclick="showNotificationsModal()">
        <i class="fas fa-bell text-2xl ${hasNetworkIssues ? 'text-gray-400' : 'text-gray-400'}"></i>
        ${hasNetworkIssues ? '<span class="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Problemas de conexión"></span>' : ''}
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
// INTERNAL DASHBOARD
// ============================================

// Load internal dashboard data
async function loadInternalDashboard() {
  try {
    const response = await axios.get('/api/dashboard/admin/internal-dashboard', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const { dashboards } = response.data;
    const internalDashboardContainer = document.getElementById('internal-dashboard-container');

    if (dashboards.length === 0) {
      internalDashboardContainer.innerHTML = '<p class="text-gray-600">No hay dashboards disponibles</p>';
      return;
    }

    // Create navigation and content
    let currentIndex = 0;

    function renderDashboard(index) {
      const dashboard = dashboards[index];
      const user = dashboard.user;

      internalDashboardContainer.innerHTML = `
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Dashboard Interno - ${escapeHtml(user.email)}</h2>

          <!-- Navigation -->
          <div class="flex justify-between items-center mb-6">
            <button onclick="navigateDashboard(${index - 1})" ${index === 0 ? 'disabled class="opacity-50 cursor-not-allowed"' : 'class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"'} id="prev-btn">
              <i class="fas fa-chevron-left mr-2"></i>Anterior
            </button>
            <span class="text-sm text-gray-600">Usuario ${index + 1} de ${dashboards.length}</span>
            <button onclick="navigateDashboard(${index + 1})" ${index === dashboards.length - 1 ? 'disabled class="opacity-50 cursor-not-allowed"' : 'class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"'} id="next-btn">
              Siguiente<i class="fas fa-chevron-right ml-2"></i>
            </button>
          </div>

          <!-- User Info -->
          <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h3 class="text-xl font-semibold mb-4">Información del Usuario</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><strong>Email:</strong> ${escapeHtml(user.email)}</div>
              <div><strong>Rol:</strong> ${escapeHtml(user.role)}</div>
              <div><strong>ID:</strong> ${user.id}</div>
            </div>
          </div>

          <!-- Goals Section -->
          <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h3 class="text-xl font-semibold mb-4">Metas (${dashboard.goals.length})</h3>
            ${dashboard.goals.length > 0 ? `
              <div class="space-y-3">
                ${dashboard.goals.map(goal => `
                  <div class="border rounded p-3">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="font-medium">${escapeHtml(goal.description)}</p>
                        <p class="text-sm text-gray-600">Estado: ${escapeHtml(goal.status)}</p>
                      </div>
                      <span class="text-xs text-gray-500">${new Date(goal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500">No hay metas registradas</p>'}
          </div>

          <!-- Primary Metrics Section -->
          <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h3 class="text-xl font-semibold mb-4">Métricas Principales</h3>
            ${dashboard.primaryMetrics ? `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-blue-50 rounded">
                  <div class="text-2xl font-bold text-blue-600">${dashboard.primaryMetrics.users || 0}</div>
                  <div class="text-sm text-gray-600">Usuarios</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded">
                  <div class="text-2xl font-bold text-green-600">${dashboard.primaryMetrics.revenue || 0}</div>
                  <div class="text-sm text-gray-600">Ingresos</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded">
                  <div class="text-2xl font-bold text-purple-600">${dashboard.primaryMetrics.conversion || 0}%</div>
                  <div class="text-sm text-gray-600">Conversión</div>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded">
                  <div class="text-2xl font-bold text-orange-600">${dashboard.primaryMetrics.growth || 0}%</div>
                  <div class="text-sm text-gray-600">Crecimiento</div>
                </div>
              </div>
            ` : '<p class="text-gray-500">No hay métricas principales registradas</p>'}
          </div>

          <!-- Metrics History Section -->
          <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h3 class="text-xl font-semibold mb-4">Historial de Métricas (${dashboard.metricsHistory.length})</h3>
            ${dashboard.metricsHistory.length > 0 ? `
              <div class="overflow-x-auto">
                <table class="min-w-full table-auto">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-4 py-2 text-left">Fecha</th>
                      <th class="px-4 py-2 text-left">Usuarios</th>
                      <th class="px-4 py-2 text-left">Ingresos</th>
                      <th class="px-4 py-2 text-left">Conversión</th>
                      <th class="px-4 py-2 text-left">Crecimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dashboard.metricsHistory.map(metric => `
                      <tr class="border-t">
                        <td class="px-4 py-2">${new Date(metric.created_at).toLocaleDateString()}</td>
                        <td class="px-4 py-2">${metric.users || 0}</td>
                        <td class="px-4 py-2">${metric.revenue || 0}</td>
                        <td class="px-4 py-2">${metric.conversion || 0}%</td>
                        <td class="px-4 py-2">${metric.growth || 0}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<p class="text-gray-500">No hay historial de métricas</p>'}
          </div>

          <!-- Weekly Updates Section -->
          <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h3 class="text-xl font-semibold mb-4">Actualizaciones Semanales (${dashboard.weeklyUpdates.length})</h3>
            ${dashboard.weeklyUpdates.length > 0 ? `
              <div class="space-y-4">
                ${dashboard.weeklyUpdates.map(update => `
                  <div class="border rounded p-4">
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium">Semana ${update.week}</h4>
                      <span class="text-xs text-gray-500">${new Date(update.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="text-sm text-gray-600">Estado de metas: ${update.goal_statuses ? 'Actualizado' : 'Pendiente'}</p>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500">No hay actualizaciones semanales</p>'}
          </div>

          <!-- Achievements Section -->
          <div class="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h3 class="text-xl font-semibold mb-4">Logros (${dashboard.achievements.length})</h3>
            ${dashboard.achievements.length > 0 ? `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${dashboard.achievements.map(achievement => `
                  <div class="border rounded p-4">
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium">${escapeHtml(achievement.description)}</h4>
                      <span class="text-xs text-gray-500">${new Date(achievement.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500">No hay logros registrados</p>'}
          </div>

          <!-- User Metrics Section -->
          <div class="bg-white p-6 rounded-lg shadow-md border">
            <h3 class="text-xl font-semibold mb-4">Métricas Personalizadas (${dashboard.userMetrics.length})</h3>
            ${dashboard.userMetrics.length > 0 ? `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${dashboard.userMetrics.map(metric => `
                  <div class="border rounded p-3">
                    <div class="font-medium">${escapeHtml(metric.metric_name)}</div>
                    <div class="text-2xl font-bold text-blue-600">${metric.metric_value}</div>
                    <div class="text-xs text-gray-500">${new Date(metric.recorded_date).toLocaleDateString()}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500">No hay métricas personalizadas</p>'}
          </div>
        </div>
      `;
    }

    // Initial render
    renderDashboard(currentIndex);

    // Make navigateDashboard function global
    window.navigateDashboard = function(newIndex) {
      if (newIndex >= 0 && newIndex < dashboards.length) {
        currentIndex = newIndex;
        renderDashboard(currentIndex);
      }
    };

  } catch (error) {
    console.error('Failed to load internal dashboard data:', error);
    const internalDashboardContainer = document.getElementById('internal-dashboard-container');
    internalDashboardContainer.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Internal Dashboard</h2>
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error loading internal dashboard data</p>
        <p class="text-sm text-gray-500 mt-2">${error.response?.data?.error || 'Unknown error'}</p>
      </div>
    `;
  }
}

// ============================================
// MY DASHBOARD
// ============================================

async function loadMyDashboard() {
  const dashboardContent = document.getElementById('dashboard-content');
  
  if (!currentUser) {
    dashboardContent.innerHTML = '<p class="text-gray-600">Debes iniciar sesión para ver tu dashboard</p>';
    return;
  }
  
  dashboardContent.innerHTML = '<p class="text-gray-600 flex items-center"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando métricas...</p>';
  
  console.log('Loading dashboard, authToken:', authToken);
  console.log('Current user:', currentUser);
  
  if (!authToken) {
    dashboardContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Sesión expirada. Por favor, inicia sesión nuevamente.</p>
        <button onclick="showAuthModal('login')" class="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">
          Iniciar Sesión
        </button>
      </div>
    `;
    return;
  }
  
  // First test authentication with debug endpoint
  try {
    console.log('Testing authentication with debug endpoint...');
    const debugResponse = await axios.get('/api/marketplace/dashboard/debug', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Debug response:', debugResponse.data);
  } catch (debugError) {
    console.error('Debug endpoint failed:', debugError.response?.data);
    // Continue anyway - debug endpoint might not exist
  }
  
  try {
    // Always render goals dashboard for all authenticated users
    renderGoalsDashboard();
    
    // Check if user is admin (cadamar1236@gmail.com) and show internal dashboard
    if (currentUser && currentUser.email === 'cadamar1236@gmail.com') {
      await renderInternalDashboard();
    }
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    console.error('Error response:', error.response);
    dashboardContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar dashboard</p>
        <p class="text-sm text-gray-500 mt-2">${error.response?.data?.error || 'Error desconocido'}</p>
      </div>
    `;
  }
}

// Render internal dashboard for admin users
async function renderInternalDashboard() {
  try {
    const response = await axios.get('/api/dashboard/admin/internal-dashboard', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const { dashboards } = response.data;
    const dashboardContent = document.getElementById('dashboard-content');

    // Find the admin dashboard (cadamar1236@gmail.com)
    const adminDashboard = dashboards.find(d => d.user.email === 'cadamar1236@gmail.com');

    if (adminDashboard) {
      const internalSection = `
        <div class="mt-8 border-t pt-8">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Dashboard Interno (Vista Rápida)</h3>
          <p class="text-lg mb-4">Total Usuarios: ${dashboards.length}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${dashboards.slice(0, 6).map(dashboard => `
              <div class="bg-gray-50 p-4 rounded-lg border cursor-pointer hover:bg-gray-100 transition" onclick="viewFullDashboard('${dashboard.user.email}')">
                <h4 class="font-semibold text-gray-900">${escapeHtml(dashboard.user.email)}</h4>
                <p class="text-sm text-gray-600">Rol: ${escapeHtml(dashboard.user.role)}</p>
                <p class="text-sm text-gray-600">Metas: ${dashboard.goals.length}</p>
                <p class="text-sm text-gray-600">Logros: ${dashboard.achievements.length}</p>
              </div>
            `).join('')}
          </div>
          ${dashboards.length > 6 ? `<p class="text-sm text-gray-500 mt-4">Y ${dashboards.length - 6} usuarios más...</p>` : ''}
        </div>
      `;

      dashboardContent.innerHTML += internalSection;

      // Make viewFullDashboard function global
      window.viewFullDashboard = function(email) {
        // Switch to internal dashboard tab and navigate to specific user
        showTab('internal-dashboard');
        // This will be handled by the loadInternalDashboard function
      };
    }
  } catch (error) {
    console.error('Failed to render internal dashboard:', error);
  }
}


// Render goals dashboard for entrepreneurs
async function renderGoalsDashboard(metrics) {
  console.log('Rendering goals dashboard');
  const dashboardContent = document.getElementById('dashboard-content');

  // Initialize state
  let goals = [];
  let weeklyUpdates = [];
  let achievements = [];
  let primaryMetrics = { metric1_name: 'users', metric2_name: 'revenue' };
  let metricsHistory = [];
  let loading = true;

  // API functions
  async function fetchGoals() {
    try {
      const response = await axios.get('/api/dashboard/goals', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      goals = response.data.goals || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  }

  async function fetchWeeklyUpdates() {
    try {
      const response = await axios.get('/api/dashboard/weekly-updates', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      weeklyUpdates = response.data.weeklyUpdates || [];
    } catch (error) {
      console.error('Error fetching weekly updates:', error);
    }
  }

  async function fetchAchievements() {
    try {
      const response = await axios.get('/api/dashboard/achievements', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      achievements = response.data.achievements || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }

  async function fetchPrimaryMetricsData() {
    primaryMetrics = await fetchPrimaryMetrics();
    metricsHistory = await fetchMetricsHistory();
  }

  async function addGoal(description) {
    try {
      await axios.post('/api/dashboard/goals', { description }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      await fetchGoals();
      renderDashboard();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  }

  async function markGoalCompleted(goalId) {
    try {
      const response = await axios.post('/api/dashboard/goals/complete', { goalId }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 200) {
        // Refresh data and re-render everything including charts
        await Promise.all([fetchGoals(), fetchWeeklyUpdates(), fetchAchievements(), fetchPrimaryMetrics(), fetchMetricsHistory()]);
        renderDashboard();

        // Re-render charts after a short delay to ensure DOM is updated
        setTimeout(() => {
          renderChart();
        }, 200);
      }
    } catch (error) {
      console.error('Error marking goal as completed:', error);
      alert('Error al marcar la meta como completada. Inténtalo de nuevo.');
    }
  }

  async function submitWeeklyUpdate(week, goalStatuses) {
    try {
      await axios.post('/api/dashboard/weekly-updates', { week, goalStatuses }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      await fetchWeeklyUpdates();
      renderDashboard();
    } catch (error) {
      console.error('Error adding weekly update:', error);
    }
  }

  async function fetchPrimaryMetrics() {
    try {
      const response = await axios.get('/api/dashboard/primary-metrics', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      primaryMetrics = response.data.primaryMetrics || { metric1_name: 'users', metric2_name: 'revenue' };
      return primaryMetrics;
    } catch (error) {
      console.error('Error fetching primary metrics:', error);
      primaryMetrics = { metric1_name: 'users', metric2_name: 'revenue' };
      return primaryMetrics;
    }
  }

  async function updatePrimaryMetrics(metric1_name, metric2_name) {
    try {
      await axios.put('/api/dashboard/primary-metrics', { metric1_name, metric2_name }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return true;
    } catch (error) {
      console.error('Error updating primary metrics:', error);
      return false;
    }
  }

  async function fetchMetricsHistory() {
    try {
      const response = await axios.get('/api/dashboard/metrics-history', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      metricsHistory = response.data.metricsHistory || [];
      return metricsHistory;
    } catch (error) {
      console.error('Error fetching metrics history:', error);
      metricsHistory = [];
      return metricsHistory;
    }
  }

  async function addMetricValue(metric_name, metric_value, recorded_date) {
    try {
      await axios.post('/api/dashboard/metrics', { metric_name, metric_value, recorded_date }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return true;
    } catch (error) {
      console.error('Error adding metric value:', error);
      return false;
    }
  }

  function prepareChartData() {
    const weeks = weeklyUpdates.map(u => u.week).reverse();
    const goalCompletionData = goals.map(goal => {
      const data = weeks.map(week => {
        const update = weeklyUpdates.find(u => u.week === week);
        return update?.goal_statuses ? (JSON.parse(update.goal_statuses)[goal.id] ? 1 : 0) : 0;
      });
      return {
        label: goal.description.length > 20 ? goal.description.substring(0, 20) + '...' : goal.description,
        data,
        borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        fill: false,
      };
    });

    return {
      labels: weeks,
      datasets: goalCompletionData,
    };
  }

  async function exportInvestorReport() {
    // jsPDF is now loaded globally from the HTML
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      console.error('jsPDF not loaded');
      alert('Error: jsPDF library not available. Please refresh the page.');
      return;
    }

    // Try different ways jsPDF might be exposed
    let jsPDFConstructor = window.jsPDF || window.jspdf?.jsPDF;
    if (!jsPDFConstructor) {
      console.error('jsPDF constructor not found');
      alert('Error: jsPDF constructor not found. Please refresh the page.');
      return;
    }

    const pdf = new jsPDFConstructor();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Título
    pdf.setFontSize(20);
    pdf.text('Reporte de Progreso - Emprendedor', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Fecha del reporte
    pdf.setFontSize(12);
    pdf.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition);
    yPosition += 15;

    // Estadísticas generales
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalUpdates = weeklyUpdates.length;
    const totalAchievements = achievements.length;

    pdf.setFontSize(14);
    pdf.text('Estadísticas Generales:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.text(`Total de metas: ${totalGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Metas completadas: ${completedGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Actualizaciones semanales: ${totalUpdates}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Logros registrados: ${totalAchievements}`, 30, yPosition);
    yPosition += 20;

    // Lista de metas
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Metas Actuales:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    goals.forEach((goal, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      const status = goal.status === 'completed' ? '✓ Completada' : '○ Activa';
      pdf.text(`${index + 1}. ${goal.description} - ${status}`, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    // Logros
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Logros Destacados:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    achievements.slice(0, 10).forEach((achievement, index) => {
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${achievement.date}: ${achievement.description}`, 25, yPosition);
      yPosition += 8;
    });

    // Pie de página
    pdf.setFontSize(8);
    pdf.text('Reporte generado automáticamente por el sistema de seguimiento de metas', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Descargar PDF
    pdf.save(`reporte-progreso-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  function exportDataToJSON() {
    const data = {
      exportDate: new Date().toISOString(),
      goals,
      weeklyUpdates,
      achievements,
      statistics: {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        totalUpdates: weeklyUpdates.length,
        totalAchievements: achievements.length,
      }
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `datos-progreso-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  function renderDashboard() {
    const chartData = prepareChartData();

    dashboardContent.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <!-- Header Section -->
        <div class="max-w-7xl mx-auto mb-8">
          <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-4xl font-bold mb-2 flex items-center">
                  <i class="fas fa-rocket mr-3 text-yellow-300"></i>
                  Registro de Logros y Metas
                </h1>
                <p class="text-blue-100 text-lg">Sistema de seguimiento para emprendedores visionarios</p>
              </div>
              <div class="hidden md:block">
                <i class="fas fa-chart-line text-6xl text-white/20"></i>
              </div>
            </div>
          </div>
        <!-- Goals Checklist Section - Prominent -->
        <div class="max-w-7xl mx-auto mb-8">
          <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 shadow-2xl border-4 border-white/20">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-white mb-2 flex items-center justify-center">
                <i class="fas fa-clipboard-check mr-3 text-yellow-300"></i>
                Checklist de Metas Diarias
              </h2>
              <p class="text-emerald-100 text-lg">Marca tus metas completadas con un solo click</p>
            </div>

            <!-- Quick Stats Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">${goals.length}</div>
                <div class="text-emerald-100 text-sm">Total Metas</div>
              </div>
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">${goals.filter(g => g.status === 'completed').length}</div>
                <div class="text-emerald-100 text-sm">Completadas</div>
              </div>
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">${goals.filter(g => g.status === 'active').length}</div>
                <div class="text-emerald-100 text-sm">Pendientes</div>
              </div>
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">${goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}%</div>
                <div class="text-emerald-100 text-sm">Éxito</div>
              </div>
            </div>

            ${goals.filter(g => g.status === 'active').length === 0 ?
              `<div class="text-center py-12 bg-white/10 rounded-xl backdrop-blur-sm">
                <i class="fas fa-plus-circle text-6xl mb-4 text-white/70"></i>
                <h3 class="text-xl font-bold text-white mb-2">¡Agrega tu primera meta!</h3>
                <p class="text-emerald-100">Comienza creando metas para poder marcar tu progreso diario</p>
              </div>` :
              `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${goals.filter(g => g.status === 'active').map((goal, index) => `
                  <div class="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-white/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 checklist-item" data-goal-id="${goal.id}">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center flex-1">
                        <div class="relative">
                          <input
                            type="checkbox"
                            id="checklist-${goal.id}"
                            class="goal-checkbox w-8 h-8 text-emerald-600 bg-white border-3 border-emerald-300 rounded-lg focus:ring-emerald-500 focus:ring-4 cursor-pointer"
                            ${goal.status === 'completed' ? 'checked' : ''}
                          />
                          <label for="checklist-${goal.id}" class="absolute inset-0 cursor-pointer"></label>
                        </div>
                        <div class="ml-4 flex-1">
                          <h3 class="font-bold text-gray-800 text-lg leading-tight">${goal.description}</h3>
                          <div class="flex items-center mt-2">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              goal.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }">
                              <i class="fas ${goal.status === 'completed' ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
                              ${goal.status === 'completed' ? 'Completada' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="text-2xl">
                        <i class="fas fa-bullseye text-emerald-500"></i>
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="text-sm text-gray-600">
                        <i class="fas fa-calendar-alt mr-1"></i>
                        Meta activa
                      </div>
                      <button
                        onclick="markGoalCompleted(${goal.id})"
                        class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                      >
                        <i class="fas fa-check mr-1"></i>Marcar Lista
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>`
            }

            ${goals.filter(g => g.status === 'active').length > 0 ? `
              <div class="mt-8 text-center">
                <div class="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                  <i class="fas fa-chart-line text-white mr-2"></i>
                  <span class="text-white font-semibold">
                    ${goals.filter(g => g.status === 'completed').length} de ${goals.length} metas completadas
                  </span>
                  <div class="ml-4 w-24 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                      style="width: ${(goals.filter(g => g.status === 'completed').length / goals.length) * 100}%"
                    ></div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-8">

            <!-- Goals Section -->
            <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                  <i class="fas fa-bullseye text-white text-xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Mis Metas</h2>
              </div>

              <!-- Add Goal Form -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div class="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    id="new-goal-input"
                    placeholder="¿Cuál es tu próxima meta? 🚀"
                    class="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-700"
                  />
                  <button
                    id="add-goal-btn"
                    class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <i class="fas fa-plus mr-2"></i>Agregar Meta
                  </button>
                </div>
              </div>

              <!-- Goals List -->
              <div id="goals-list" class="space-y-4">
                ${goals.length === 0 ?
                  `<div class="text-center py-12 text-gray-500">
                    <i class="fas fa-lightbulb text-4xl mb-4 text-yellow-400"></i>
                    <p class="text-lg">¡Comienza agregando tu primera meta!</p>
                    <p class="text-sm">Las metas son el primer paso hacia el éxito</p>
                  </div>` :
                  goals.map(goal => `
                    <div class="bg-gradient-to-r ${goal.status === 'completed' ? 'from-green-50 to-emerald-50 border-green-200' : 'from-gray-50 to-blue-50 border-gray-200'} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <div class="w-10 h-10 ${goal.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'} rounded-full flex items-center justify-center mr-4">
                            <i class="fas ${goal.status === 'completed' ? 'fa-check' : 'fa-target'} text-white"></i>
                          </div>
                          <div>
                            <h3 class="font-semibold text-gray-800 ${goal.status === 'completed' ? 'line-through text-gray-600' : ''}">${goal.description}</h3>
                            <span class="text-sm ${goal.status === 'completed' ? 'text-green-600' : 'text-blue-600'} font-medium">
                              ${goal.status === 'completed' ? '✅ Completada' : '🎯 Activa'}
                            </span>
                          </div>
                        </div>
                        ${goal.status === 'active' ?
                          `<button
                            onclick="markGoalCompleted(${goal.id})"
                            class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <i class="fas fa-check mr-1"></i>Marcar Completada
                          </button>` : ''
                        }
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>

            <!-- Weekly Updates Section -->
            <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                  <i class="fas fa-calendar-week text-white text-xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Actualización Semanal</h2>
              </div>

              <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                <div class="mb-4">
                  <input
                    type="text"
                    id="week-input"
                    placeholder="Ej: Semana 1 - Oct 2025 📅"
                    class="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-700"
                  />
                </div>

                <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
                  <i class="fas fa-tasks mr-2 text-purple-500"></i>
                  Marcar cumplimiento de metas:
                </h3>

                <div id="goal-statuses" class="space-y-3">
                  ${goals.filter(g => g.status === 'active').length === 0 ?
                    `<p class="text-gray-500 italic">Agrega metas activas para poder marcar su cumplimiento semanal</p>` :
                    goals.filter(g => g.status === 'active').map(goal => `
                      <div class="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                        <input
                          type="checkbox"
                          data-goal-id="${goal.id}"
                          class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <label class="ml-3 text-gray-700 font-medium cursor-pointer flex-1">
                          ${goal.description}
                        </label>
                      </div>
                    `).join('')
                  }
                </div>

                <button
                  id="submit-weekly-btn"
                  class="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i class="fas fa-paper-plane mr-2"></i>Enviar Actualización Semanal
                </button>
              </div>
            </div>

          </div>

          <!-- Right Column -->
          <div class="space-y-8">

            <!-- Charts Section -->
            <div class="space-y-6">
              <!-- Goals Overview Charts -->
              <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-chart-pie text-white text-xl"></i>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-800">Estado de Metas</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Pie Chart -->
                  <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">Cumplimiento General</h3>
                    <div style="height: 250px;">
                      <canvas id="goals-pie-chart"></canvas>
                    </div>
                  </div>

                  <!-- Stats Cards -->
                  <div class="space-y-4">
                    <div class="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm text-gray-600">Total de Metas</p>
                          <p class="text-2xl font-bold text-gray-800">${goals.length}</p>
                        </div>
                        <div class="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                          <i class="fas fa-bullseye text-white text-xl"></i>
                        </div>
                      </div>
                    </div>

                    <div class="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm text-gray-600">Metas Completadas</p>
                          <p class="text-2xl font-bold text-gray-800">${goals.filter(g => g.status === 'completed').length}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <i class="fas fa-check-circle text-white text-xl"></i>
                        </div>
                      </div>
                    </div>

                    <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm text-gray-600">Tasa de Éxito</p>
                          <p class="text-2xl font-bold text-gray-800">${goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}%</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                          <i class="fas fa-percentage text-white text-xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Weekly Progress Chart -->
              <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-800">Progreso Semanal</h2>
                </div>

                ${weeklyUpdates.length > 0 && goals.length > 0 ? `
                  <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6">
                    <div style="height: 350px;">
                      <canvas id="progress-chart"></canvas>
                    </div>
                  </div>
                ` : `
                  <div class="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
                    <i class="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
                    <p class="text-gray-600 font-medium">No hay datos suficientes</p>
                    <p class="text-sm text-gray-500">Agrega metas y actualizaciones semanales para ver tu progreso</p>
                  </div>
                `}
              </div>

              <!-- Weekly Bar Chart -->
              <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-chart-bar text-white text-xl"></i>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-800">Cumplimiento por Semana</h2>
                </div>

                <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                  <div style="height: 300px;">
                    <canvas id="weekly-bar-chart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- Achievements Section -->
            <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                  <i class="fas fa-trophy text-white text-xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Logros</h2>
              </div>

              <!-- Add Achievement Form -->
              <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
                <div class="flex flex-col gap-4">
                  <input
                    type="text"
                    id="new-achievement-input"
                    placeholder="¡Celebra tu logro! 🏆"
                    class="px-4 py-3 border-2 border-yellow-200 rounded-xl focus:border-yellow-500 focus:outline-none transition-colors text-gray-700"
                  />
                  <button
                    id="add-achievement-btn"
                    class="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <i class="fas fa-plus mr-2"></i>Agregar Logro
                  </button>
                </div>
              </div>

              <!-- Achievements List -->
              <div class="space-y-4 max-h-96 overflow-y-auto">
                ${achievements.length === 0 ?
                  `<div class="text-center py-8 text-gray-500">
                    <i class="fas fa-star text-3xl mb-3 text-yellow-400"></i>
                    <p class="font-medium">¡Tu primer logro te espera!</p>
                    <p class="text-sm">Registra tus victorias y celebraciones</p>
                  </div>` :
                  achievements.map(achievement => `
                    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div class="flex items-start">
                        <div class="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3 mt-1">
                          <i class="fas fa-star text-white text-xs"></i>
                        </div>
                        <div class="flex-1">
                          <p class="text-gray-800 font-medium">${achievement.description}</p>
                          <p class="text-sm text-gray-500">${achievement.date}</p>
                        </div>
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>

            <!-- Weekly History -->
            <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                  <i class="fas fa-history text-white text-xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Historial Semanal</h2>
              </div>

              <div class="space-y-4 max-h-80 overflow-y-auto">
                ${weeklyUpdates.length === 0 ?
                  `<div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-alt text-3xl mb-3 text-teal-400"></i>
                    <p class="font-medium">Sin actualizaciones aún</p>
                    <p class="text-sm">Comienza tu seguimiento semanal</p>
                  </div>` :
                  weeklyUpdates.map((update, index) => `
                    <div class="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
                      <h3 class="font-semibold text-teal-800 mb-3 flex items-center">
                        <i class="fas fa-calendar-week mr-2"></i>${update.week}
                      </h3>
                      <div class="space-y-2">
                        ${Object.entries(JSON.parse(update.goal_statuses)).map(([goalId, completed]) => {
                          const goal = goals.find(g => g.id == goalId);
                          return `
                            <div class="flex items-center text-sm">
                              <i class="fas ${completed ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} mr-2"></i>
                              <span class="${completed ? 'text-green-700' : 'text-red-700'}">
                                ${goal?.description}: ${completed ? 'Cumplida' : 'No cumplida'}
                              </span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>

          </div>
        </div>

        <!-- Export Section -->
        <div class="max-w-7xl mx-auto mt-8">
          <div class="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-2xl p-8 text-white shadow-2xl border border-gray-700">
            <div class="text-center">
              <h2 class="text-3xl font-bold mb-4 flex items-center justify-center">
                <i class="fas fa-file-export mr-3 text-blue-400"></i>
                Exportar Reporte para Inversores
              </h2>
              <p class="text-gray-300 mb-8 text-lg">Genera reportes profesionales para compartir tu progreso con potenciales inversores</p>

              <div class="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                <button
                  id="export-pdf-btn"
                  class="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                >
                  <i class="fas fa-file-pdf mr-3 text-xl"></i>Generar PDF Profesional
                </button>
                <button
                  id="export-json-btn"
                  class="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                >
                  <i class="fas fa-database mr-3 text-xl"></i>Exportar Datos JSON
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div class="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 class="font-bold text-green-400 mb-3 flex items-center">
                    <i class="fas fa-file-pdf mr-2"></i>PDF Profesional incluye:
                  </h3>
                  <ul class="text-gray-300 space-y-1 text-sm">
                    <li>• Estadísticas completas del progreso</li>
                    <li>• Lista detallada de todas las metas</li>
                    <li>• Gráfico de progreso visual</li>
                    <li>• Historial de logros destacados</li>
                    <li>• Formato listo para inversores</li>
                  </ul>
                </div>
                <div class="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 class="font-bold text-blue-400 mb-3 flex items-center">
                    <i class="fas fa-database mr-2"></i>JSON incluye:
                  </h3>
                  <ul class="text-gray-300 space-y-1 text-sm">
                    <li>• Todos los datos crudos</li>
                    <li>• Métricas calculadas automáticamente</li>
                    <li>• Historial completo de actualizaciones</li>
                    <li>• Compatible con herramientas de análisis</li>
                    <li>• Formato estructurado para developers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Primary Metrics Section -->
        <div class="max-w-7xl mx-auto mt-8">
          <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 shadow-2xl border-4 border-white/20">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-white mb-2 flex items-center justify-center">
                <i class="fas fa-chart-line mr-3 text-yellow-300"></i>
                Métricas Principales de Negocio
              </h2>
              <p class="text-purple-100 text-lg">Seguimiento de tus indicadores clave de rendimiento</p>
            </div>

            <!-- Primary Metrics Selection -->
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                <i class="fas fa-cog mr-2"></i>
                Configurar Métricas Principales
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white/20 rounded-lg p-4">
                  <label class="block text-white font-semibold mb-2">Métrica Principal 1:</label>
                  <select id="metric1-select" class="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none">
                    <option value="users" ${primaryMetrics.metric1_name === 'users' ? 'selected' : ''}>👥 Número de Usuarios</option>
                    <option value="revenue" ${primaryMetrics.metric1_name === 'revenue' ? 'selected' : ''}>💰 Ingresos</option>
                  </select>
                </div>

                <div class="bg-white/20 rounded-lg p-4">
                  <label class="block text-white font-semibold mb-2">Métrica Principal 2:</label>
                  <select id="metric2-select" class="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none">
                    <option value="users" ${primaryMetrics.metric2_name === 'users' ? 'selected' : ''}>👥 Número de Usuarios</option>
                    <option value="revenue" ${primaryMetrics.metric2_name === 'revenue' ? 'selected' : ''}>💰 Ingresos</option>
                  </select>
                </div>
              </div>

              <div class="text-center mt-6">
                <button
                  id="update-metrics-btn"
                  class="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i class="fas fa-save mr-2"></i>Actualizar Métricas
                </button>
              </div>
            </div>

            <!-- Add Metric Value Form -->
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                <i class="fas fa-plus-circle mr-2"></i>
                Registrar Nuevo Valor
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-white font-semibold mb-2">Métrica:</label>
                  <select id="new-metric-name" class="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none">
                    <option value="users">👥 Número de Usuarios</option>
                    <option value="revenue">💰 Ingresos</option>
                  </select>
                </div>

                <div>
                  <label class="block text-white font-semibold mb-2">Valor:</label>
                  <input
                    type="number"
                    id="new-metric-value"
                    placeholder="Ej: 150"
                    class="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block text-white font-semibold mb-2">Fecha:</label>
                  <input
                    type="date"
                    id="new-metric-date"
                    value="${new Date().toISOString().split('T')[0]}"
                    class="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div class="text-center mt-6">
                <button
                  id="add-metric-btn"
                  class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i class="fas fa-plus mr-2"></i>Agregar Valor
                </button>
              </div>
            </div>

            <!-- Metrics Evolution Chart -->
            <div class="bg-white rounded-xl shadow-xl p-6 mb-8">
              <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-chart-line mr-2 text-blue-500"></i>
                Evolución Diaria de Métricas
              </h3>

              ${metricsHistory.length === 0 ?
                `<div class="text-center py-12 text-gray-500">
                  <i class="fas fa-chart-line text-4xl mb-4 text-gray-400"></i>
                  <p class="text-lg">No hay datos suficientes para mostrar la evolución</p>
                  <p class="text-sm">Registra métricas durante varios días para ver la gráfica</p>
                </div>` :
                `<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div style="height: 400px;">
                    <canvas id="metrics-evolution-chart"></canvas>
                  </div>
                </div>`
              }
            </div>

            <!-- Metrics History Table -->
            <div class="bg-white rounded-xl shadow-xl p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-table mr-2 text-purple-500"></i>
                Historial de Métricas
              </h3>

              ${metricsHistory.length === 0 ?
                `<div class="text-center py-12 text-gray-500">
                  <i class="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
                  <p class="text-lg">No hay datos de métricas aún</p>
                  <p class="text-sm">Comienza registrando tus primeras métricas</p>
                </div>` :
                `<div class="overflow-x-auto">
                  <table class="w-full table-auto">
                    <thead>
                      <tr class="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <th class="px-4 py-3 text-left font-semibold">Fecha</th>
                        <th class="px-4 py-3 text-left font-semibold">Métrica</th>
                        <th class="px-4 py-3 text-right font-semibold">Valor</th>
                        <th class="px-4 py-3 text-center font-semibold">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      ${metricsHistory.slice(0, 20).map((metric, index) => {
                        const prevMetric = metricsHistory[index + 1];
                        const trend = prevMetric ?
                          (metric.metric_value > prevMetric.metric_value ? 'up' : metric.metric_value < prevMetric.metric_value ? 'down' : 'same') : 'same';

                        return `
                          <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3 text-gray-800 font-medium">${new Date(metric.recorded_date).toLocaleDateString('es-ES')}</td>
                            <td class="px-4 py-3 text-gray-800">
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                metric.metric_name === 'users'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }">
                                <i class="fas ${metric.metric_name === 'users' ? 'fa-users' : 'fa-dollar-sign'} mr-1"></i>
                                ${metric.metric_name === 'users' ? 'Usuarios' : 'Ingresos'}
                              </span>
                            </td>
                            <td class="px-4 py-3 text-gray-800 font-bold text-right">
                              ${metric.metric_name === 'revenue' ? '$' : ''}${metric.metric_value.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-center">
                              ${trend === 'up' ?
                                '<i class="fas fa-arrow-up text-green-500"></i>' :
                                trend === 'down' ?
                                '<i class="fas fa-arrow-down text-red-500"></i>' :
                                '<i class="fas fa-minus text-gray-400"></i>'
                              }
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>`
              }
            </div>
          </div>
        </div>

      </div>
    `;

    // Add event listeners
    document.getElementById('add-goal-btn').addEventListener('click', () => {
      const input = document.getElementById('new-goal-input');
      if (input.value.trim()) {
        addGoal(input.value);
        input.value = '';
      }
    });

    document.getElementById('submit-weekly-btn').addEventListener('click', () => {
      const weekInput = document.getElementById('week-input');
      const checkboxes = document.querySelectorAll('#goal-statuses input[type="checkbox"]');
      const goalStatuses = {};
      checkboxes.forEach((checkbox) => {
        goalStatuses[checkbox.dataset.goalId] = checkbox.checked;
      });
      if (weekInput.value.trim()) {
        submitWeeklyUpdate(weekInput.value, goalStatuses);
        weekInput.value = '';
        checkboxes.forEach((checkbox) => checkbox.checked = false);
      }
    });

    document.getElementById('add-achievement-btn').addEventListener('click', () => {
      const input = document.getElementById('new-achievement-input');
      if (input.value.trim()) {
        addAchievement(new Date().toISOString().split('T')[0], input.value);
        input.value = '';
      }
    });

    document.getElementById('export-pdf-btn').addEventListener('click', exportInvestorReport);
    document.getElementById('export-json-btn').addEventListener('click', exportDataToJSON);

    // Metrics functionality
    document.getElementById('update-metrics-btn').addEventListener('click', async () => {
      const metric1 = document.getElementById('metric1-select').value;
      const metric2 = document.getElementById('metric2-select').value;

      if (metric1 === metric2) {
        alert('Las dos métricas principales deben ser diferentes');
        return;
      }

      const success = await updatePrimaryMetrics(metric1, metric2);
      if (success) {
        alert('Métricas principales actualizadas correctamente');
        // Refresh the dashboard to show updated metrics
        await fetchPrimaryMetrics();
        renderDashboard();
      } else {
        alert('Error al actualizar las métricas principales');
      }
    });

    document.getElementById('add-metric-btn').addEventListener('click', async () => {
      const metricName = document.getElementById('new-metric-name').value;
      const metricValue = parseFloat(document.getElementById('new-metric-value').value);
      const recordedDate = document.getElementById('new-metric-date').value;

      if (!metricValue || metricValue < 0) {
        alert('Por favor ingresa un valor válido mayor o igual a 0');
        return;
      }

      if (!recordedDate) {
        alert('Por favor selecciona una fecha');
        return;
      }

      const success = await addMetricValue(metricName, metricValue, recordedDate);
      if (success) {
        alert('Valor de métrica agregado correctamente');
        // Clear form
        document.getElementById('new-metric-value').value = '';
        document.getElementById('new-metric-date').value = new Date().toISOString().split('T')[0];
        // Refresh metrics data
        await fetchMetricsHistory();
        renderDashboard();
      } else {
        alert('Error al agregar el valor de métrica');
      }
    });

    // Checklist functionality
    document.querySelectorAll('.goal-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const goalId = parseInt(e.target.id.replace('checklist-', ''));
        const checklistItem = e.target.closest('.checklist-item');

        // Add visual feedback
        checklistItem.classList.add('animate-pulse');

        if (e.target.checked) {
          // Mark as completed
          await markGoalCompleted(goalId);
          checklistItem.classList.add('completed-animation');
          setTimeout(() => {
            checklistItem.classList.remove('completed-animation', 'animate-pulse');
          }, 1000);
        } else {
          // This shouldn't happen since we only show active goals, but just in case
          checklistItem.classList.remove('animate-pulse');
        }
      });
    });

    // Make markGoalCompleted available globally
    window.markGoalCompleted = markGoalCompleted;

    // Render chart if data available
    if (goals.length > 0) {
      setTimeout(() => {
        renderChart();
      }, 100);
    }
  }

  function renderChart() {
    // Render Pie Chart for Goals Overview
    const pieCtx = document.getElementById('goals-pie-chart');
    if (pieCtx && window.Chart) {
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const activeGoals = goals.filter(g => g.status === 'active').length;

      new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completadas', 'Pendientes'],
          datasets: [{
            data: [completedGoals, activeGoals],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgba(34, 197, 94, 1)',
              'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 3,
            hoverBackgroundColor: [
              'rgba(34, 197, 94, 0.9)',
              'rgba(239, 68, 68, 0.9)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 14,
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 2000,
            easing: 'easeInOutQuart'
          }
        }
      });
    }

    // Render Weekly Bar Chart
    const barCtx = document.getElementById('weekly-bar-chart');
    if (barCtx && window.Chart && weeklyUpdates.length > 0) {
      const weeks = weeklyUpdates.map(u => u.week).slice(-8); // Last 8 weeks
      const completionRates = weeks.map(week => {
        const update = weeklyUpdates.find(u => u.week === week);
        if (!update) return 0;

        const statuses = JSON.parse(update.goal_statuses);
        const totalGoals = Object.keys(statuses).length;
        const completedGoals = Object.values(statuses).filter(status => status).length;
        return totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
      });

      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: weeks,
          datasets: [{
            label: 'Tasa de Cumplimiento (%)',
            data: completionRates,
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgba(249, 115, 22, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: 'rgba(249, 115, 22, 0.9)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              callbacks: {
                label: function(context) {
                  return `Cumplimiento: ${context.parsed.y.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart',
            delay: function(context) {
              return context.dataIndex * 200;
            }
          }
        }
      });
    }

    // Render Line Chart for Progress (existing functionality)
    const ctx = document.getElementById('progress-chart');
    if (ctx && window.Chart && weeklyUpdates.length > 0 && goals.length > 0) {
      const gradientGreen = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradientGreen.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
      gradientGreen.addColorStop(1, 'rgba(34, 197, 94, 0.1)');

      const gradientBlue = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradientBlue.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradientBlue.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

      const gradientPurple = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradientPurple.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
      gradientPurple.addColorStop(1, 'rgba(147, 51, 234, 0.1)');

      const gradientOrange = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradientOrange.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
      gradientOrange.addColorStop(1, 'rgba(249, 115, 22, 0.1)');

      const gradients = [gradientGreen, gradientBlue, gradientPurple, gradientOrange];

      const chartData = prepareChartData();
      const enhancedData = {
        ...chartData,
        datasets: chartData.datasets.map((dataset, index) => ({
          ...dataset,
          borderColor: [
            '#22c55e', // green
            '#3b82f6', // blue
            '#9333ea', // purple
            '#f97316', // orange
            '#ec4899', // pink
            '#06b6d4', // cyan
          ][index % 6],
          backgroundColor: gradients[index % gradients.length],
          borderWidth: 3,
          pointBackgroundColor: [
            '#22c55e',
            '#3b82f6',
            '#9333ea',
            '#f97316',
            '#ec4899',
            '#06b6d4',
          ][index % 6],
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4,
        }))
      };

      new Chart(ctx, {
        type: 'line',
        data: enhancedData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y === 1 ? '✅ Cumplida' : '❌ No cumplida'}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            },
            y: {
              beginAtZero: true,
              max: 1,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return value === 1 ? 'Cumplida' : 'No cumplida';
                },
                font: {
                  size: 11
                }
              }
            }
          },
          elements: {
            point: {
              hoverBorderWidth: 3
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          }
        }
      });
    }

    // Render Metrics Evolution Chart
    const evolutionCtx = document.getElementById('metrics-evolution-chart');
    if (evolutionCtx && window.Chart && metricsHistory.length > 0) {
      // Group metrics by date
      const metricsByDate = {};
      metricsHistory.forEach(metric => {
        if (!metricsByDate[metric.recorded_date]) {
          metricsByDate[metric.recorded_date] = { users: null, revenue: null };
        }
        metricsByDate[metric.recorded_date][metric.metric_name] = metric.metric_value;
      });

      // Sort dates
      const sortedDates = Object.keys(metricsByDate).sort();

      // Prepare data for Chart.js
      const labels = sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      });

      const usersData = sortedDates.map(date => metricsByDate[date].users);
      const revenueData = sortedDates.map(date => metricsByDate[date].revenue);

      // Create gradients
      const gradientUsers = evolutionCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradientUsers.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradientUsers.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

      const gradientRevenue = evolutionCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradientRevenue.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
      gradientRevenue.addColorStop(1, 'rgba(34, 197, 94, 0.1)');

      new Chart(evolutionCtx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Usuarios',
              data: usersData,
              borderColor: '#3b82f6',
              backgroundColor: gradientUsers,
              borderWidth: 3,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.4,
              spanGaps: true
            },
            {
              label: 'Ingresos',
              data: revenueData,
              borderColor: '#22c55e',
              backgroundColor: gradientRevenue,
              borderWidth: 3,
              pointBackgroundColor: '#22c55e',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.4,
              spanGaps: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.datasetIndex === 0) { // Users
                    label += context.parsed.y !== null ? context.parsed.y : 'Sin datos';
                  } else { // Revenue
                    label += context.parsed.y !== null ? '$' + context.parsed.y.toLocaleString() : 'Sin datos';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                font: {
                  size: 11
                },
                callback: function(value, index, values) {
                  if (value >= 1000) {
                    return (value / 1000).toFixed(1) + 'k';
                  }
                  return value;
                }
              }
            }
          },
          elements: {
            point: {
              hoverBorderWidth: 3
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          }
        }
      });
    }
  }

  // Load data and render
  console.log('About to start Promise.all for loading data');
  console.log('Starting to load dashboard data...');
  dashboardContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i><p class="text-gray-600">Cargando datos del dashboard...</p></div>';
  
  try {
    await Promise.all([fetchGoals(), fetchWeeklyUpdates()]);
    console.log('All dashboard data loaded successfully');        
    loading = false;
    renderDashboard();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    dashboardContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar los datos del dashboard</p>
        <p class="text-sm text-gray-500 mt-2">${error.message}</p>
      </div>
    `;
    return;
  }
} // Close renderGoalsDashboard function

// Make functions available globally
window.markGoalCompleted = function(goalId) {
  console.log('Mark goal completed:', goalId);
};

// Beta products to leaderboard sync is handled server-side
// Remove the undefined function call
// if (authToken) {
//   syncBetaProductsToLeaderboard();
// }

// Expose generateProductStars globally
window.generateProductStars = generateProductStars;

// Function to edit a product
async function editProduct(productId) {
  if (!authToken || !currentUser) {
    showToast('Debes iniciar sesión para editar productos', 'error');
    return;
  }

  try {
    // Find the product in the current products array
    const product = products.find(p => p.id === productId);
    if (!product) {
      showToast('Producto no encontrado', 'error');
      return;
    }

    // Check if user owns this product
    if (product.company_user_id !== currentUser.id) {
      showToast('No tienes permisos para editar este producto', 'error');
      return;
    }

    // Show create product modal and populate with existing data
    showCreateProductModal();

    // After modal is shown, populate the form
    setTimeout(() => {
      const form = document.getElementById('create-product-form');
      if (form) {
        form.title.value = product.title || '';
        form.description.value = product.description || '';
        form.category.value = product.category || '';
        form.stage.value = product.stage || 'idea';
        form.url.value = product.url || '';
        form.compensation_type.value = product.compensation_type || 'free';
        form.compensation_amount.value = product.compensation_amount || '';
        form.max_validators.value = product.max_validators || 3;
        form.duration_days.value = product.duration_days || '';

        // Update modal title and submit button
        document.getElementById('create-product-modal-title').textContent = 'Editar Producto';
        document.getElementById('create-product-submit').textContent = 'Actualizar Producto';

        // Store product ID for update
        form.dataset.productId = productId;

        // Show/hide compensation amount based on type
        toggleCompensationAmount(form.compensation_type.value);
      }
    }, 100);

  } catch (error) {
    console.error('Error loading product for edit:', error);
    showToast('Error al cargar el producto para editar', 'error');
  }
}

// Function to delete a product
async function deleteProduct(productId) {
  console.log('deleteProduct called with productId:', productId);
  console.log('currentUser:', currentUser);
  console.log('authToken:', authToken ? 'present' : 'missing');

  if (!authToken || !currentUser) {
    showToast('Debes iniciar sesión para borrar productos', 'error');
    return;
  }

  // Confirm deletion
  if (!confirm('¿Estás seguro de que quieres borrar este producto? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    // Find the product to check ownership
    const product = products.find(p => p.id === productId);
    console.log('Found product:', product);

    if (!product) {
      showToast('Producto no encontrado', 'error');
      return;
    }

    // Check if user owns this product
    console.log('Product company_user_id:', product.company_user_id, 'type:', typeof product.company_user_id);
    console.log('Current user id:', currentUser.id, 'type:', typeof currentUser.id);
    console.log('Comparison:', product.company_user_id, '!==', currentUser.id, '=', product.company_user_id !== currentUser.id);
    console.log('String comparison:', String(product.company_user_id), '!==', String(currentUser.id), '=', String(product.company_user_id) !== String(currentUser.id));
    
    if (String(product.company_user_id) !== String(currentUser.id)) {
      showToast('No tienes permisos para borrar este producto', 'error');
      return;
    }

    console.log('Making DELETE request to:', `/api/marketplace/products/${productId}`);
    console.log('With auth header:', `Bearer ${authToken.substring(0, 20)}...`);

    // Delete the product
    const response = await axios.delete(`/api/marketplace/products/${productId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('Delete response:', response);

    if (response.status === 200) {
      showToast('Producto borrado exitosamente', 'success');
      // Reload marketplace items
      loadMarketplaceItems();
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    showToast('Error al borrar el producto', 'error');
  }
}

// Function to show create product modal
function showCreateProductModal() {
  if (!authToken || !currentUser) {
    showToast('Debes iniciar sesión para crear productos', 'error');
    return;
  }

  // Check if user is founder
  if (currentUser.role !== 'founder') {
    showToast('Solo los fundadores pueden crear productos', 'error');
    return;
  }

  // Create or get modal
  let modal = document.getElementById('create-product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'create-product-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-xl font-bold text-gray-900" id="create-product-modal-title">Crear Nuevo Producto</h2>
          <button onclick="closeCreateProductModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form id="create-product-form" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea name="description" rows="3" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input type="text" name="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select name="stage" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="idea">Idea</option>
                <option value="mvp">MVP</option>
                <option value="beta">Beta</option>
                <option value="launch">Lanzamiento</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL del Producto</label>
            <input type="url" name="url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Compensación</label>
              <select name="compensation_type" onchange="toggleCompensationAmount(this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="free">Gratuito</option>
                <option value="paid">Pago</option>
              </select>
            </div>
            <div id="compensation-amount-container" style="display: none;">
              <label class="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
              <input type="number" name="compensation_amount" min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Máximo Validadores</label>
              <input type="number" name="max_validators" value="3" min="1" max="10" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Días de Duración</label>
              <input type="number" name="duration_days" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="closeCreateProductModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit" id="create-product-submit" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              Crear Producto
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    // Add form submit handler
    document.getElementById('create-product-form').addEventListener('submit', handleCreateProduct);
  }

  // Reset form
  const form = document.getElementById('create-product-form');
  if (form) {
    form.reset();
    form.removeAttribute('data-product-id');
    document.getElementById('create-product-modal-title').textContent = 'Crear Nuevo Producto';
    document.getElementById('create-product-submit').textContent = 'Crear Producto';
    document.getElementById('compensation-amount-container').style.display = 'none';
  }

  modal.classList.remove('hidden');
}

// Function to handle create/edit product form submission
async function handleCreateProduct(e) {
  e.preventDefault();

  if (!authToken || !currentUser) {
    showToast('Debes iniciar sesión', 'error');
    return;
  }

  const form = e.target;
  const formData = new FormData(form);
  const productData = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    stage: formData.get('stage'),
    url: formData.get('url'),
    compensation_type: formData.get('compensation_type'),
    compensation_amount: formData.get('compensation_amount') ? parseFloat(formData.get('compensation_amount')) : null,
    max_validators: formData.get('max_validators') ? parseInt(formData.get('max_validators')) : 3,
    duration_days: formData.get('duration_days') ? parseInt(formData.get('duration_days')) : null
  };

  try {
    const productId = form.dataset.productId;
    let response;

    if (productId) {
      // Update existing product
      response = await axios.put(`/api/marketplace/products/${productId}`, productData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      showToast('Producto actualizado exitosamente', 'success');
    } else {
      // Create new product
      response = await axios.post('/api/marketplace/products', productData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      showToast('Producto creado exitosamente', 'success');
    }

    // Close modal and reload products
    closeCreateProductModal();
    loadMarketplaceItems();

  } catch (error) {
    console.error('Error saving product:', error);
    const errorMsg = error.response?.data?.error || 'Error al guardar el producto';
    showToast(errorMsg, 'error');
  }
}

// Function to toggle compensation amount field
function toggleCompensationAmount(type) {
  const container = document.getElementById('compensation-amount-container');
  if (container) {
    container.style.display = type === 'paid' ? 'block' : 'none';
  }
}

// Function to close create product modal
function closeCreateProductModal() {
  const modal = document.getElementById('create-product-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Function to open select product modal for validator
function openSelectProductModal(validatorId, validatorName) {
  if (!authToken || !currentUser) {
    showToast('Debes iniciar sesión como founder', 'error');
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'select-product-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-paper-plane text-primary mr-2"></i>
            Solicitar Opinión de ${escapeHtml(validatorName)}
          </h2>
          <button onclick="closeSelectProductModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form id="request-validator-form" class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Tu Producto (opcional)
            </label>
            <select id="request-product-id" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
              <option value="">Sin producto específico</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Mensaje al validador *
            </label>
            <textarea 
              id="request-message" 
              required 
              rows="5"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Hola, me gustaría obtener tu opinión sobre mi idea...

¿Qué opinas del potencial de mercado?
¿Qué cambiarías?

¡Gracias!"
            ></textarea>
          </div>
          
          <div class="flex space-x-4">
            <button 
              type="submit" 
              class="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
            >
              <i class="fas fa-paper-plane mr-2"></i>Enviar Solicitud
            </button>
            <button 
              type="button" 
              onclick="closeSelectProductModal()" 
              class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  loadUserProductsForRequest(validatorId);
  
  document.getElementById('request-validator-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendValidatorRequest(validatorId);
  });
}

// Function to load user's products for request
async function loadUserProductsForRequest(validatorId) {
  try {
    const response = await axios.get('/api/marketplace/products/my', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const select = document.getElementById('request-product-id');
    if (select && response.data.products) {
      // Clear existing options except first
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Add user's products
      response.data.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.title;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Function to handle sending validator request
async function handleSendValidatorRequest(validatorId) {
  const productId = document.getElementById('request-product-id').value;
  const message = document.getElementById('request-message').value;
  
  try {
    const response = await axios.post('/api/validator-requests/send', {
      validatorId: validatorId,
      projectId: productId || null,
      message: message
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    showToast('¡Solicitud enviada exitosamente!', 'success');
    closeSelectProductModal();
  } catch (error) {
    console.error('Error sending request:', error);
    const errorMsg = error.response?.data?.error || 'Error al enviar la solicitud';
    showToast(errorMsg, 'error');
  }
}

// Function to close select product modal
function closeSelectProductModal() {
  const modal = document.getElementById('select-product-modal');
  if (modal) {
    modal.remove();
  }
}

// Function to open chat with validator
function openChatWithValidator(validatorId, validatorName) {
  showToast('Para chatear, primero envía una solicitud al validador', 'info');
  // Redirect to send request
  openSelectProductModal(validatorId, validatorName);
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.showCreateProductModal = showCreateProductModal;
window.closeCreateProductModal = closeCreateProductModal;
window.handleCreateProduct = handleCreateProduct;
window.toggleCompensationAmount = toggleCompensationAmount;
window.openSelectProductModal = openSelectProductModal;
window.closeSelectProductModal = closeSelectProductModal;
window.openChatWithValidator = openChatWithValidator;
