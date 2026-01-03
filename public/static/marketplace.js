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
    return `<button onclick="event.stopPropagation(); showAuthModal('login')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm">Login to vote</button>`;
  }

  // Check if user is a validator
  const isValidator = currentUser.validator_id !== null && currentUser.validator_id !== undefined;

  // For validators and regular users: show vote buttons (validators can vote too)
  const voteUrl = `${window.location.origin}/marketplace?product=${productId}`;
  if (item.user_vote) {
    // Already voted, show their vote
    return `
      <div class="flex items-center space-x-2">
        <div class="text-sm text-green-600">Your vote: ${item.user_vote} star${item.user_vote > 1 ? 's' : ''}</div>
        <div class="flex space-x-1">
          ${[1,2,3,4,5].map(r => `
            <span class="${r <= item.user_vote ? 'text-yellow-400' : 'text-gray-300'} text-lg">★</span>
          `).join('')}
        </div>
        <div class="text-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(voteUrl)}" alt="QR to share product" class="inline-block">
          <p class="text-xs text-gray-500">Share this product</p>
        </div>
      </div>
    `;
  } else {
    // Hasn't voted, show stars to vote
    return `
      <div class="flex items-center space-x-2">
        <div class="flex space-x-1">
          ${[1,2,3,4,5].map(rating => `
            <span onclick="event.stopPropagation(); voteForProduct(${productId}, ${rating})" class="cursor-pointer text-gray-300 hover:text-yellow-400 text-lg" title="Vote ${rating} star${rating > 1 ? 's' : ''}">
              ★
            </span>
          `).join('')}
        </div>
        <div class="text-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(voteUrl)}" alt="QR to share product" class="inline-block">
          <p class="text-xs text-gray-500">Share this product</p>
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
    // Show success notification
    showToast(`✅ You just voted! You rated this product ${rating} star${rating !== 1 ? 's' : ''}`, 'success');
    // Reload marketplace items to update vote counts
    loadMarketplaceItems();
  } catch (error) {
    console.error('Failed to vote for product:', error);
    showToast('❌ Error voting for product. Please try again.', 'error');
  }
}

// Apply to validate product function
async function applyToProduct(productId) {
  if (!currentUser || !currentUser.validator_id) {
    showToast('Only validators can apply to products', 'error');
    return;
  }

  try {
    const response = await axios.post(`/api/marketplace/products/${productId}/apply`, {
      message: 'I am interested in validating this product.'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    showToast('✅ Application sent successfully! The founder will review your request.', 'success');
    // Reload marketplace items to update UI if needed
    loadMarketplaceItems();
  } catch (error) {
    console.error('Failed to apply to product:', error);
    const errorMessage = error.response?.data?.error || 'Error applying to product';
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
        <h2 class="text-xl font-bold mb-4">Vote for ${escapeHtml(product.title)}</h2>
        <p class="mb-4">${escapeHtml(product.description)}</p>
        ${!currentUser ? '<p class="text-red-500 mb-4">You must login to vote.</p>' : `
          <div class="mb-4">
            <p class="mb-2">Select your rating:</p>
            <div class="flex space-x-1" id="star-rating">
              ${[1,2,3,4,5].map(r => `
                <span onclick="setRating(${r})" class="cursor-pointer text-2xl ${r <= 5 ? 'text-yellow-400' : 'text-gray-300'}" id="star-${r}">★</span>
              `).join('')}
            </div>
          </div>
        `}
        <div class="flex justify-end space-x-2">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
          ${currentUser ? `<button onclick="voteForProduct(${productId}, getSelectedRating()); this.closest('.fixed').remove()" class="px-4 py-2 bg-blue-500 text-white rounded">Vote</button>` : `<button onclick="showLoginModal(); this.closest('.fixed').remove()" class="px-4 py-2 bg-blue-500 text-white rounded">Login</button>`}
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
  currentProductId = productId;
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
            <i class="fas fa-arrow-left mr-2"></i>Back to Marketplace
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
        <p class="text-gray-600">Error loading product</p>
        <button onclick="showTab('products')" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
          Back to Marketplace
        </button>
      </div>
    `;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function checkProductHash() {
  // Check for hash navigation (signup, login, etc.) - but NOT my-dashboard (handled after auth)
  const hash = window.location.hash.substring(1); // Remove the #
  
  if (hash === 'signup' || hash === 'login') {
    // Show appropriate auth modal
    setTimeout(() => {
      if (hash === 'signup') {
        showSignupModal();
      } else {
        showLoginModal();
      }
      // Clear hash after showing modal
      history.replaceState(null, null, window.location.pathname);
    }, 300);
    return;
  }
  
  // Check for product parameter in URL query
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  
  if (productId && /^\d+$/.test(productId)) {
    if (currentUser) {
      // User is logged in, show product detail
      showTab('product-detail');
      loadProductDetail(parseInt(productId));
      // Clean up the URL
      history.replaceState(null, null, window.location.pathname);
    } else {
      // User not logged in, show login prompt in product detail tab
      showTab('product-detail');
      loadProductDetail(parseInt(productId));
      // Keep the URL parameter for post-login redirect
    }
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
  // Handle OAuth callback token first
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const role = urlParams.get('role');
  const newUser = urlParams.get('new_user');
  
  if (token) {
    // Store the token
    authToken = token;
    localStorage.setItem('authToken', token);
    
    // Clean URL by removing the token parameters
    const newUrl = window.location.pathname + (urlParams.get('product') ? `?product=${urlParams.get('product')}` : '');
    window.history.replaceState({}, document.title, newUrl);
    
    // Show success message for new users
    if (newUser === 'true') {
      setTimeout(() => {
        alert('¡Bienvenido! Tu cuenta ha sido creada exitosamente.');
      }, 500);
    }
    
    // Load user data
    loadCurrentUser();
    startNotificationsPolling();
  } else {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
      loadCurrentUser();
      startNotificationsPolling();
    }
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
    
    // After loading user, check if there's a hash to navigate to
    const hash = window.location.hash.substring(1);
    if (hash === 'my-dashboard') {
      // Reload marketplace items first to show newly created products
      await loadMarketplaceItems();
      
      // Navigate to my dashboard
      setTimeout(() => {
        showTab('my-dashboard');
        // Clear hash after navigation
        history.replaceState(null, null, window.location.pathname);
      }, 100);
    }
    
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
        <select onchange="changeUserRole(this.value)" class="text-sm border border-gray-300 rounded px-2 py-1">
          <option value="founder" ${currentUser.role === 'founder' ? 'selected' : ''}>Founder</option>
          <option value="validator" ${currentUser.role === 'validator' ? 'selected' : ''}>Validator</option>
        </select>
        <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition">
          <i class="fas fa-sign-out-alt mr-1"></i>Logout
        </button>
      </div>
    `;
    
    // Mobile auth nav
    mobileAuthNav.innerHTML = `
      <button onclick="logout()" class="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 transition">
        <i class="fas fa-sign-out-alt mr-2"></i>Logout (${currentUser.name})
      </button>
    `;
    
    // Show dashboard tab for all authenticated users
    myDashboardTab.classList.remove('hidden');
    
    // Role-based tab visibility
    if (currentUser.role === 'validator') {
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
        Login
      </button>
      <button onclick="showAuthModal('register')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
        Sign Up
      </button>
    `;
    
    mobileAuthNav.innerHTML = `
      <button onclick="showAuthModal('login')" class="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary transition">
        <i class="fas fa-sign-in-alt mr-2"></i>Login
      </button>
      <button onclick="showAuthModal('register')" class="block w-full text-left px-3 py-2 mt-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
        <i class="fas fa-user-plus mr-2"></i>Sign Up
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
      
      <!-- Google Login Options -->
      <div class="space-y-3 mb-6">
        <button onclick="loginWithGoogle('founder')" class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
          <i class="fab fa-google text-red-600 mr-3"></i>
          <span>Continuar como Founder</span>
        </button>
        <button onclick="loginWithGoogle('validator')" class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
          <i class="fab fa-google text-blue-600 mr-3"></i>
          <span>Continuar como Validador</span>
        </button>
      </div>
      
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">O con email</span>
        </div>
      </div>
      
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
    
    // Check if there was a product parameter to redirect to
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId && /^\d+$/.test(productId)) {
      showTab('product-detail');
      loadProductDetail(parseInt(productId));
      // Clean up the URL
      history.replaceState(null, null, window.location.pathname);
    } else if (document.getElementById('product-detail-content').classList.contains('hidden') === false && currentProductId) {
      // If already on product detail page, reload it to show voting options
      loadProductDetail(currentProductId);
    }
    
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
  if (confirm('Are you sure you want to log out?')) {
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
  } else if (tabName === 'chat') {
    if (currentUser) {
      loadChatInterface();
    } else {
      // Show loading message while waiting for user to load
      const chatContent = document.getElementById('chat-content');
      if (chatContent) {
        chatContent.innerHTML = `
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-gray-600">Loading chat...</p>
            </div>
          </div>
        `;
      }
      // Wait for user to load, then initialize chat
      const checkUserAndLoadChat = () => {
        if (currentUser) {
          loadChatInterface();
        } else {
          setTimeout(checkUserAndLoadChat, 100);
        }
      };
      checkUserAndLoadChat();
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
let currentProductId = null;

async function loadMarketplaceItems() {
  try {
    // Cargar productos del marketplace con cache busting
    const productsRes = await axios.get('/api/marketplace/products', {
      headers: { 'Cache-Control': 'no-cache' },
      params: { _t: Date.now() } // Agregar timestamp para evitar cache
    });
    products = productsRes.data.products || [];
    console.log('✅ Loaded products:', products.length);
    console.log('📦 Product details:', products.map(p => ({ 
      id: p.id, 
      title: p.title, 
      votes: p.votes_count,
      rating: p.rating_average 
    })));

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
        <p class="text-gray-600">Error loading products</p>
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

  grid.innerHTML = allItems.map(item => {
    // Helper function to get pricing model label and color
    const getPricingBadge = (pricingModel) => {
      const badges = {
        'free': { label: 'Free', color: 'bg-green-100 text-green-800', icon: 'fa-gift' },
        'freemium': { label: 'Freemium', color: 'bg-teal-100 text-teal-800', icon: 'fa-layer-group' },
        'one_time': { label: 'One-Time', color: 'bg-blue-100 text-blue-800', icon: 'fa-shopping-cart' },
        'subscription_monthly': { label: 'Monthly', color: 'bg-purple-100 text-purple-800', icon: 'fa-calendar' },
        'subscription_yearly': { label: 'Yearly', color: 'bg-indigo-100 text-indigo-800', icon: 'fa-calendar-check' },
        'usage_based': { label: 'Usage', color: 'bg-orange-100 text-orange-800', icon: 'fa-chart-line' },
        'enterprise': { label: 'Enterprise', color: 'bg-gray-100 text-gray-800', icon: 'fa-building' }
      };
      const badge = badges[pricingModel] || badges['subscription_monthly'];
      return `<span class="badge ${badge.color} text-xs px-2 py-1"><i class="fas ${badge.icon} mr-1"></i>${badge.label}</span>`;
    };

    return `
    <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95 transform" onclick="${item.type === 'product' ? `showTab('product-detail'); loadProductDetail(${item.id})` : `window.location.href='${item.url}'`}">
      <div class="flex items-center justify-between mb-2">
        <span class="badge ${item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} text-xs font-semibold px-3 py-1">
          ${item.type === 'product' ? '<i class=\"fas fa-box\"></i> Product' : '<i class=\"fas fa-lightbulb\"></i> Project'}
        </span>
        ${item.type === 'product' && item.featured ? '<span class="badge bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1"><i class="fas fa-star mr-1"></i>Featured</span>' : ''}
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
          ${item.pricing_model ? getPricingBadge(item.pricing_model) : ''}
          ${item.compensation_type === 'paid' ? `<span class="badge bg-green-100 text-green-800 text-xs px-2 py-1"><i class="fas fa-dollar-sign mr-1"></i>$${item.compensation_amount}</span>` : ''}
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          ${item.duration_days ? `<span class="flex items-center"><i class="far fa-calendar mr-1"></i>${item.duration_days} days</span>` : ''}
          <div class="flex items-center gap-2">
            <span class="text-primary font-semibold cursor-pointer hover:underline truncate min-h-[24px] flex items-center" onclick="event.stopPropagation(); ${item.type === 'product' ? `showTab('product-detail'); loadProductDetail(${item.id})` : `window.open('${escapeHtml(item.url)}', '_blank')`}">View details <i class="fas fa-arrow-right ml-1"></i></span>
            ${item.type === 'product' && currentUser && currentUser.id === item.company_user_id ? `
              <button class="text-blue-600 hover:text-blue-800 text-xs font-medium" onclick="event.stopPropagation(); editProduct(${item.id})">
                <i class="fas fa-edit mr-1"></i>Edit
              </button>
              <button class="text-red-600 hover:text-red-800 text-xs font-medium" onclick="event.stopPropagation(); deleteProduct(${item.id})">
                <i class="fas fa-trash mr-1"></i>Delete
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
            <span class="text-xs text-gray-500">${item.votes_count || 0} votes</span>
          </div>
        ` : ''}
        
        <div class="mt-3 sm:mt-4">
          ${generateProductVoteButtons(item)}
        </div>
      </div>
    </div>
    `;
  }).join('');
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
            placeholder="Search products by title, description..."
            value="${currentFilters.products.q}"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
        </div>
      </div>
      
      <!-- Filters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <!-- Category -->
        <select id="filter-product-category" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">All categories</option>
          <option value="SaaS" ${currentFilters.products.category === 'SaaS' ? 'selected' : ''}>SaaS</option>
          <option value="Fintech" ${currentFilters.products.category === 'Fintech' ? 'selected' : ''}>Fintech</option>
          <option value="E-commerce" ${currentFilters.products.category === 'E-commerce' ? 'selected' : ''}>E-commerce</option>
          <option value="Mobile" ${currentFilters.products.category === 'Mobile' ? 'selected' : ''}>Mobile</option>
          <option value="Healthcare" ${currentFilters.products.category === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
          <option value="EdTech" ${currentFilters.products.category === 'EdTech' ? 'selected' : ''}>EdTech</option>
        </select>
        
        <!-- Stage -->
        <select id="filter-product-stage" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">All stages</option>
          <option value="idea" ${currentFilters.products.stage === 'idea' ? 'selected' : ''}>Idea</option>
          <option value="prototype" ${currentFilters.products.stage === 'prototype' ? 'selected' : ''}>Prototype</option>
          <option value="mvp" ${currentFilters.products.stage === 'mvp' ? 'selected' : ''}>MVP</option>
          <option value="beta" ${currentFilters.products.stage === 'beta' ? 'selected' : ''}>Beta</option>
        </select>
        
        <!-- Pricing Model -->
        <select id="filter-product-pricing" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">All pricing models</option>
          <option value="free" ${currentFilters.products.pricing === 'free' ? 'selected' : ''}>Free</option>
          <option value="freemium" ${currentFilters.products.pricing === 'freemium' ? 'selected' : ''}>Freemium</option>
          <option value="one_time" ${currentFilters.products.pricing === 'one_time' ? 'selected' : ''}>One-Time</option>
          <option value="subscription_monthly" ${currentFilters.products.pricing === 'subscription_monthly' ? 'selected' : ''}>Monthly Sub</option>
          <option value="subscription_yearly" ${currentFilters.products.pricing === 'subscription_yearly' ? 'selected' : ''}>Yearly Sub</option>
          <option value="usage_based" ${currentFilters.products.pricing === 'usage_based' ? 'selected' : ''}>Usage-Based</option>
          <option value="enterprise" ${currentFilters.products.pricing === 'enterprise' ? 'selected' : ''}>Enterprise</option>
        </select>
        
        <!-- Budget Range -->
        <select id="filter-product-budget" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="">Any budget</option>
          <option value="0-500">$0 - $500</option>
          <option value="500-1000">$500 - $1,000</option>
          <option value="1000-2500">$1,000 - $2,500</option>
          <option value="2500-5000">$2,500 - $5,000</option>
          <option value="5000+">$5,000+</option>
        </select>
        
        <!-- Sort -->
        <select id="filter-product-sort" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option value="recent" ${currentFilters.products.sort === 'recent' ? 'selected' : ''}>Most recent</option>
          <option value="budget_high" ${currentFilters.products.sort === 'budget_high' ? 'selected' : ''}>Highest budget</option>
          <option value="budget_low" ${currentFilters.products.sort === 'budget_low' ? 'selected' : ''}>Lowest budget</option>
          <option value="popular" ${currentFilters.products.sort === 'popular' ? 'selected' : ''}>Most popular</option>
          <option value="featured" ${currentFilters.products.sort === 'featured' ? 'selected' : ''}>Featured</option>
        </select>
        
        <!-- Clear Button -->
        <button onclick="clearProductFilters()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          <i class="fas fa-times mr-2"></i>Clear
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
  document.getElementById('filter-product-pricing').addEventListener('change', applyProductFilters);
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
  const pricing = document.getElementById('filter-product-pricing')?.value || '';
  const budget = document.getElementById('filter-product-budget')?.value || '';
  const sort = document.getElementById('filter-product-sort')?.value || 'recent';
  
  // Update current filters
  currentFilters.products = { q: searchTerm, category, stage, pricing, sort };
  
  // Build query params
  const params = new URLSearchParams();
  if (searchTerm) params.append('q', searchTerm);
  if (category) params.append('category', category);
  if (stage) params.append('stage', stage);
  if (pricing) params.append('pricing_model', pricing);
  if (sort) params.append('sort', sort);
  
  if (budget) {
    const [min, max] = budget.split('-');
    if (min) params.append('min_budget', min);
    if (max && max !== '+') params.append('max_budget', max);
  }
  
  try {
    const endpoint = searchTerm || category || stage || pricing || budget || sort !== 'recent' 
      ? `/api/marketplace/products/search?${params}` 
      : '/api/marketplace/products';
    
    const response = await axios.get(endpoint);
    products = response.data.products || [];
    
    // Update UI
    renderProducts();
    
    // Show results count
    const resultsCount = document.getElementById('product-results-count');
    if (resultsCount) {
      resultsCount.textContent = `Found ${products.length} product${products.length !== 1 ? 's' : ''}`;
    }
    
  } catch (error) {
    console.error('Error applying product filters:', error);
    showToast('Error applying filters', 'error');
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
    showToast('Error applying filters', 'error');
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
    // Try to ping the API instead of looking for favicon
    const response = await fetch('/api/marketplace/products?limit=1', { 
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
    showToast('Error loading notifications', 'error');
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
    showToast('Error marking notification', 'error');
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
    showToast('Error marking notifications', 'error');
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
    showToast('Error deleting notification', 'error');
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

// Prevent multiple simultaneous dashboard loads
let isDashboardLoading = false;

async function loadMyDashboard() {
  // Prevent multiple simultaneous loads
  if (isDashboardLoading) {
    console.log('⚠️ Dashboard already loading, skipping duplicate call');
    return;
  }
  
  isDashboardLoading = true;
  
  const dashboardContent = document.getElementById('dashboard-content');
  
  if (!currentUser) {
    dashboardContent.innerHTML = '<p class="text-gray-600">Debes iniciar sesión para ver tu dashboard</p>';
    isDashboardLoading = false;
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
    isDashboardLoading = false;
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
    // Load chat data first
    const chatRequestsData = await loadChatRequests();
    const conversationsData = await loadConversations();

    // Render chat sections at the top of dashboard
    let chatSectionsHTML = '';
    
    // For validators: show pending chat requests
    if (currentUser.role === 'validator' && chatRequestsData.requests.length > 0) {
      chatSectionsHTML += renderChatRequestsSection(chatRequestsData.requests);
    }

    // For everyone: show active conversations
    if (conversationsData.conversations.length > 0) {
      chatSectionsHTML += renderConversationsSection(conversationsData.conversations);
    }

    // If there are chat sections, prepend them to dashboard
    if (chatSectionsHTML) {
      dashboardContent.innerHTML = chatSectionsHTML;
    }
    
    // Always render goals dashboard for all authenticated users
    await renderGoalsDashboard();
    
    // Check if user is admin (cadamar1236@gmail.com) and show internal dashboard
    if (currentUser && currentUser.email === 'cadamar1236@gmail.com') {
      await renderInternalDashboard();
    }
    
    // Mark loading as complete
    isDashboardLoading = false;
    
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
    isDashboardLoading = false;
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

  // Setup event delegation ONCE on the parent container that never gets destroyed
  // This ensures listeners work even after innerHTML replacements
  if (!dashboardContent.hasAttribute('data-listeners-setup')) {
    console.log('🎯 Setting up event delegation on dashboard container');
    dashboardContent.setAttribute('data-listeners-setup', 'true');
    
    dashboardContent.addEventListener('click', async (e) => {
      // Add Goal button
      if (e.target.id === 'add-goal-btn' || e.target.closest('#add-goal-btn')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Add Goal clicked via delegation');
        
        const input = document.getElementById('new-goal-input');
        const value = input?.value.trim();
        
        if (value) {
          const btn = e.target.closest('#add-goal-btn') || e.target;
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Adding...';
          await addGoal(value);
        } else {
          alert('Por favor ingresa un goal');
        }
        return;
      }
      
      // Add Metric button
      if (e.target.id === 'add-metric-btn' || e.target.closest('#add-metric-btn')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Add Metric clicked via delegation');
        
        const metricName = document.getElementById('new-metric-name')?.value;
        const metricValueInput = document.getElementById('new-metric-value')?.value;
        const recordedDate = document.getElementById('new-metric-date')?.value;
        const metricValue = parseFloat(metricValueInput);

        if (isNaN(metricValue) || metricValue < 0) {
          alert('Por favor ingresa un valor válido mayor o igual a 0');
          return;
        }

        if (!recordedDate) {
          alert('Por favor selecciona una fecha');
          return;
        }

        const btn = e.target.closest('#add-metric-btn') || e.target;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Adding...';
        await addMetricValue(metricName, metricValue, recordedDate);
        return;
      }
      
      // Update Primary Metrics button
      if (e.target.id === 'update-metrics-btn' || e.target.closest('#update-metrics-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const metric1 = document.getElementById('metric1-select')?.value;
        const metric2 = document.getElementById('metric2-select')?.value;

        if (metric1 === metric2) {
          alert('Las dos métricas principales deben ser diferentes');
          return;
        }

        const success = await updatePrimaryMetrics(metric1, metric2);
        if (success) {
          alert('Métricas principales actualizadas correctamente');
          // Refresh and re-render without reload
          await fetchPrimaryMetrics();
          await fetchMetricsHistory();
          renderDashboard();
          setTimeout(() => {
            renderMetricsEvolutionChart(currentPeriod || '1m');
          }, 300);
        } else {
          alert('Error al actualizar las métricas principales');
        }
        return;
      }
      
      // Export buttons
      if (e.target.id === 'export-pdf-btn' || e.target.closest('#export-pdf-btn')) {
        e.preventDefault();
        exportInvestorReport();
        return;
      }
      
      if (e.target.id === 'export-json-btn' || e.target.closest('#export-json-btn')) {
        e.preventDefault();
        exportDataToJSON();
        return;
      }
      
      // WhatsApp code generation button
      if (e.target.id === 'generate-whatsapp-code-btn' || e.target.closest('#generate-whatsapp-code-btn')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Generate WhatsApp code clicked');
        await generateWhatsAppCode();
        return;
      }
    });
    
    console.log('✅ Event delegation setup complete');
  }

  // Initialize state
  let goals = [];
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

  async function fetchPrimaryMetricsData() {
    primaryMetrics = await fetchPrimaryMetrics();
    metricsHistory = await fetchMetricsHistory();
  }

  async function addGoal(description) {
    try {
      console.log('Adding goal:', description);
      const response = await axios.post('/api/dashboard/goals', { description }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Goal added successfully:', response.data);
      
      alert('Goal agregado correctamente');
      
      // Refresh goals data first
      await fetchGoals();
      console.log('Goals refreshed, total:', goals.length);
      
      // Re-render dashboard
      renderDashboard();
      
      // Wait a bit longer before rendering charts to ensure DOM is ready
      setTimeout(() => {
        console.log('Rendering charts after add goal...');
        renderChart();
      }, 500);
      
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Error al agregar el goal. Por favor intenta de nuevo.');
    }
  }

  async function markGoalCompleted(goalId) {
    try {
      const response = await axios.post('/api/dashboard/goals/complete', { goalId }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 200) {
        console.log('Goal marked as completed');
        
        // Refresh goals data
        await fetchGoals();
        console.log('Goals refreshed after completion, total:', goals.length);
        
        // Re-render dashboard
        renderDashboard();
        
        // Wait before rendering charts
        setTimeout(() => {
          console.log('Rendering charts after mark completed...');
          renderChart();
        }, 500);
      }
    } catch (error) {
      console.error('Error marking goal as completed:', error);
      alert('Error al marcar la meta como completada. Inténtalo de nuevo.');
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
      console.log('Adding metric value:', { metric_name, metric_value, recorded_date });
      const response = await axios.post('/api/dashboard/metrics', { metric_name, metric_value, recorded_date }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Metric value added successfully:', response.data);
      alert('Valor de métrica agregado correctamente');
      
      // Refresh and update metrics chart without reload
      await fetchMetricsHistory();
      setTimeout(() => {
        renderMetricsEvolutionChart(currentPeriod || '1m');
      }, 300);
      
      return true;
    } catch (error) {
      console.error('Error adding metric value:', error);
      console.error('Error details:', error.response?.data || error.message);
      return false;
    }
  }

  // WhatsApp code generation function
  async function generateWhatsAppCode() {
    const container = document.getElementById('whatsapp-code-container');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
      <div class="flex items-center justify-center text-green-100">
        <i class="fas fa-spinner fa-spin mr-2 text-xl"></i>
        Generando código...
      </div>
    `;
    
    try {
      const response = await axios.post('/api/auth/generate-whatsapp-code', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data && response.data.code) {
        container.innerHTML = `
          <div class="bg-white rounded-xl p-6 text-center">
            <h4 class="font-bold text-green-700 mb-3 text-lg">✅ Tu Código Permanente</h4>
            <div class="bg-green-50 border-2 border-dashed border-green-400 rounded-lg p-4 mb-4">
              <p class="text-4xl font-mono font-bold text-green-600 tracking-widest">${response.data.code}</p>
            </div>
            <p class="text-green-600 text-sm mb-4">
              <i class="fas fa-infinity mr-1"></i>Este código es permanente - solo úsalo una vez
            </p>
            <p class="text-gray-600 text-sm mb-4">Envía este código por WhatsApp cuando te lo pida el bot</p>
            <button
              onclick="navigator.clipboard.writeText('${response.data.code}'); this.innerHTML='<i class=\\'fas fa-check mr-1\\'></i>Copiado!';"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <i class="fas fa-copy mr-1"></i>Copiar código
            </button>
          </div>
        `;
      } else {
        throw new Error('No code received');
      }
    } catch (error) {
      console.error('Error generating WhatsApp code:', error);
      container.innerHTML = `
        <div class="text-center">
          <p class="text-red-300 mb-4"><i class="fas fa-exclamation-triangle mr-2"></i>Error al generar el código</p>
          <button
            id="generate-whatsapp-code-btn"
            class="px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all duration-200 font-bold text-lg shadow-lg flex items-center justify-center mx-auto"
          >
            <i class="fas fa-redo mr-3"></i>Intentar de nuevo
          </button>
        </div>
      `;
    }
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
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const totalMetrics = metricsHistory.length;

    pdf.setFontSize(14);
    pdf.text('Estadísticas Generales:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.text(`Total de metas: ${totalGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Metas completadas: ${completedGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Metas activas: ${activeGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Métricas registradas: ${totalMetrics}`, 30, yPosition);
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

    // Business Metrics
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Métricas de Negocio:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    
    // Get latest metrics
    const latestUserMetric = metricsHistory.filter(m => m.metric_name === 'users').sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))[0];
    const latestRevenueMetric = metricsHistory.filter(m => m.metric_name === 'revenue').sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))[0];
    
    if (latestUserMetric) {
      pdf.text(`Usuarios actuales: ${latestUserMetric.metric_value}`, 25, yPosition);
      yPosition += 8;
    }
    if (latestRevenueMetric) {
      pdf.text(`Ingresos actuales: $${latestRevenueMetric.metric_value.toLocaleString()}`, 25, yPosition);
      yPosition += 8;
    }

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
      metricsHistory,
      primaryMetrics,
      statistics: {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        totalMetrics: metricsHistory.length,
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

  // Prevent multiple simultaneous renders
  let isRenderingDashboard = false;

  async function renderDashboard() {
    // --- Dashboard Questions State ---
    let dashboardQuestions = null;

    async function fetchDashboardQuestions() {
      try {
        const response = await axios.get('/api/dashboard/questions', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        dashboardQuestions = response.data.questions || null;
      } catch (error) {
        console.error('Error fetching dashboard questions:', error);
        dashboardQuestions = null;
      }
    }

    async function saveDashboardQuestions(answers) {
      try {
        await axios.post('/api/dashboard/questions', answers, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        // Update local state after successful save
        dashboardQuestions = answers;
        alert('Progress answers saved!');
      } catch (error) {
        console.error('Error saving dashboard questions:', error);
        alert('Error saving answers');
      }
    }

    // Function to update form values after save
    function updateFormValues() {
      const launchedToggle = document.getElementById('launched-toggle');
      const weeksToLaunch = document.getElementById('weeks-to-launch');
      const usersTalked = document.getElementById('users-talked');
      const usersLearned = document.getElementById('users-learned');
      const morale = document.getElementById('morale');
      const primaryMetricImproved = document.getElementById('primary-metric-improved');
      const biggestObstacle = document.getElementById('biggest-obstacle');

      if (launchedToggle) launchedToggle.checked = dashboardQuestions?.launched || false;
      if (weeksToLaunch) weeksToLaunch.value = dashboardQuestions?.weeksToLaunch || '';
      if (usersTalked) usersTalked.value = dashboardQuestions?.usersTalked || '';
      if (usersLearned) usersLearned.value = dashboardQuestions?.usersLearned || '';
      if (morale) morale.value = dashboardQuestions?.morale || '';
      if (primaryMetricImproved) primaryMetricImproved.value = dashboardQuestions?.primaryMetricImproved || '';
      if (biggestObstacle) biggestObstacle.value = dashboardQuestions?.biggestObstacle || '';
    }

  // Fetch questions before rendering
  await fetchDashboardQuestions();
    if (isRenderingDashboard) {
      console.log('⚠️ Dashboard already rendering, skipping duplicate call');
      return;
    }
    
    isRenderingDashboard = true;
    console.log('🔄 Starting dashboard render');
    
    dashboardContent.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <!-- Header Section -->
        <div class="max-w-7xl mx-auto mb-8">
          <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-4xl font-bold mb-2 flex items-center">
                  <i class="fas fa-rocket mr-3 text-yellow-300"></i>
                  Goals & Achievements Log
                </h1>
                <p class="text-blue-100 text-lg">Tracking system for visionary entrepreneurs</p>
              </div>
              <div class="hidden md:block">
                <i class="fas fa-chart-line text-6xl text-white/20"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Questions Section -->
        <div class="max-w-7xl mx-auto mb-8">
          <div class="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
            <!-- Background decoration -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full -ml-12 -mb-12 opacity-30"></div>

            <div class="relative z-10">
              <style>
                .toggle-checkbox {
                  appearance: none;
                  background-color: #e5e7eb;
                  border-radius: 9999px;
                  position: relative;
                  transition: background-color 0.2s ease;
                }
                .toggle-checkbox:checked {
                  background-color: #6366f1;
                }
                .toggle-checkbox:checked::after {
                  content: '';
                  position: absolute;
                  top: 2px;
                  left: 18px;
                  width: 16px;
                  height: 16px;
                  background-color: white;
                  border-radius: 50%;
                  transition: left 0.2s ease;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .toggle-checkbox::after {
                  content: '';
                  position: absolute;
                  top: 2px;
                  left: 2px;
                  width: 16px;
                  height: 16px;
                  background-color: white;
                  border-radius: 50%;
                  transition: left 0.2s ease;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
              </style>

              <h2 class="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <i class="fas fa-clipboard-check mr-4 text-indigo-500 text-4xl"></i>
                Startup Progress Tracker
              </h2>
              <p class="text-gray-600 mb-6 text-lg">Track your entrepreneurial journey with real-time progress saving</p>

              <!-- Progress indicator -->
              <div class="mb-8 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div id="progress-bar" class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
              </div>

              <form id="dashboard-questions-form" class="space-y-8">
                <!-- Launch Section -->
                <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                  <h3 class="text-xl font-bold text-indigo-800 mb-4 flex items-center">
                    <i class="fas fa-rocket mr-3 text-indigo-600"></i>
                    Launch Status
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                      <label class="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" id="launched-toggle" class="toggle-checkbox h-6 w-6 text-indigo-600 rounded focus:ring-indigo-500" ${dashboardQuestions?.launched ? 'checked' : ''} />
                        <span class="text-gray-700 font-medium group-hover:text-indigo-700 transition-colors">Are you launched?</span>
                      </label>
                      <p class="text-sm text-gray-500 ml-9">Check this when your product goes live!</p>
                    </div>
                    <div class="space-y-2">
                      <label for="weeks-to-launch" class="block text-gray-700 font-semibold">Weeks to launch <span class="text-red-500">*</span></label>
                      <input type="number" id="weeks-to-launch" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-lg" min="0" value="${dashboardQuestions?.weeksToLaunch ?? ''}" placeholder="e.g. 4" />
                      <p class="text-sm text-indigo-600 font-medium">⏰ Almost there, looking forward to your launch!</p>
                    </div>
                  </div>
                </div>

                <!-- Users Section -->
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h3 class="text-xl font-bold text-green-800 mb-4 flex items-center">
                    <i class="fas fa-users mr-3 text-green-600"></i>
                    User Discovery
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label for="users-talked" class="block text-gray-700 font-semibold">Users talked to this week <span class="text-red-500">*</span></label>
                      <input type="number" id="users-talked" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-lg" min="0" value="${dashboardQuestions?.usersTalked ?? ''}" placeholder="e.g. 12" />
                      <p class="text-sm text-green-600 font-medium">🎯 Keep the conversation going!</p>
                    </div>
                    <div class="space-y-2">
                      <label for="users-learned" class="block text-gray-700 font-semibold">Key learnings from users</label>
                      <textarea id="users-learned" rows="3" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none" placeholder="What insights have you gained?">${dashboardQuestions?.usersLearned ?? ''}</textarea>
                      <p class="text-sm text-green-600 font-medium">💡 Every conversation is valuable data</p>
                    </div>
                  </div>
                </div>

                <!-- Goals & Morale Section -->
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h3 class="text-xl font-bold text-purple-800 mb-4 flex items-center">
                    <i class="fas fa-bullseye mr-3 text-purple-600"></i>
                    Goals & Motivation
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label for="morale" class="block text-gray-700 font-semibold">Current morale (1-10) <span class="text-red-500">*</span></label>
                      <select id="morale" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg">
                        <option value="" ${!dashboardQuestions?.morale ? 'selected' : ''}>Select your morale...</option>
                        ${[...Array(10).keys()].map(i => `<option value="${i+1}" ${dashboardQuestions?.morale == (i+1) ? 'selected' : ''}>${i+1} ${i+1 <= 3 ? '😞' : i+1 <= 6 ? '😐' : '😊'}</option>`).join('')}
                      </select>
                      <p class="text-sm text-purple-600 font-medium">⚡ Stay motivated, you're building something amazing!</p>
                    </div>
                    <div class="space-y-2">
                      <label for="primary-metric-improved" class="block text-gray-700 font-semibold">What improved your primary metric?</label>
                      <input type="text" id="primary-metric-improved" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg" value="${dashboardQuestions?.primaryMetricImproved ?? ''}" placeholder="e.g. Better onboarding flow" />
                      <p class="text-sm text-purple-600 font-medium">📈 Every improvement counts</p>
                    </div>
                  </div>
                  <div class="mt-6 space-y-2">
                    <label for="biggest-obstacle" class="block text-gray-700 font-semibold">Biggest obstacle right now</label>
                    <textarea id="biggest-obstacle" rows="2" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none" placeholder="What's blocking your progress?">${dashboardQuestions?.biggestObstacle ?? ''}</textarea>
                    <p class="text-sm text-purple-600 font-medium">🛠️ Every challenge is an opportunity to grow</p>
                  </div>
                </div>

                <!-- Save Button & Status -->
                <div class="text-center space-y-4">
                  <button type="submit" class="px-12 py-4 text-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105">
                    <i class="fas fa-save mr-3"></i>Save Progress
                  </button>
                  <div id="save-status" class="text-sm"></div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- PRIMARY METRICS SECTION - MOVED TO TOP -->
        <div class="max-w-7xl mx-auto mb-8">
          <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-10 shadow-2xl border-4 border-white/20">
            <div class="text-center mb-10">
              <h2 class="text-4xl font-bold text-white mb-3 flex items-center justify-center">
                <i class="fas fa-chart-line mr-4 text-yellow-300 text-5xl"></i>
                Business Key Metrics
              </h2>
              <p class="text-purple-100 text-xl">Track your key performance indicators evolution</p>
            </div>

            <!-- Primary Metrics Selection -->
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-10">
              <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                <i class="fas fa-cog mr-3 text-xl"></i>
                Configure Primary Metrics
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white/20 rounded-lg p-6">
                  <label class="block text-white font-semibold mb-3 text-lg">Primary Metric 1:</label>
                  <select id="metric1-select" class="w-full px-5 py-3 text-lg bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none">
                    <option value="users" ${primaryMetrics.metric1_name === 'users' ? 'selected' : ''}>👥 Number of Users</option>
                    <option value="revenue" ${primaryMetrics.metric1_name === 'revenue' ? 'selected' : ''}>💰 Revenue</option>
                  </select>
                </div>

                <div class="bg-white/20 rounded-lg p-6">
                  <label class="block text-white font-semibold mb-3 text-lg">Primary Metric 2:</label>
                  <select id="metric2-select" class="w-full px-5 py-3 text-lg bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none">
                    <option value="users" ${primaryMetrics.metric2_name === 'users' ? 'selected' : ''}>👥 Number of Users</option>
                    <option value="revenue" ${primaryMetrics.metric2_name === 'revenue' ? 'selected' : ''}>💰 Revenue</option>
                  </select>
                </div>
              </div>

              <div class="text-center mt-8">
                <button
                  id="update-metrics-btn"
                  class="px-8 py-4 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i class="fas fa-save mr-2"></i>Update Metrics
                </button>
              </div>
            </div>

            <!-- Add Metric Value Form -->
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-10">
              <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                <i class="fas fa-plus-circle mr-3 text-xl"></i>
                Register New Value
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-white font-semibold mb-3 text-lg">Metric:</label>
                  <select id="new-metric-name" class="w-full px-5 py-3 text-lg bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none">
                    <option value="users">👥 Number of Users</option>
                    <option value="revenue">💰 Revenue</option>
                  </select>
                </div>

                <div>
                  <label class="block text-white font-semibold mb-3 text-lg">Value:</label>
                  <input
                    type="number"
                    id="new-metric-value"
                    placeholder="e.g. 150"
                    class="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-white/30 focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block text-white font-semibold mb-2">Date:</label>
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
                  <i class="fas fa-plus mr-2"></i>Add Value
                </button>
              </div>
            </div>

            <!-- Metrics Evolution Chart - ALWAYS SHOW -->
            <div class="bg-white rounded-xl shadow-xl p-8 mb-10">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-3xl font-bold text-gray-800 flex items-center">
                  <i class="fas fa-chart-line mr-3 text-blue-500 text-4xl"></i>
                  User Growth Evolution
                </h3>
                
                <!-- Time Period Selector -->
                <div class="flex gap-3">
                  <button
                    data-period="1m"
                    class="period-btn px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 bg-blue-500 text-white"
                  >
                    1 Month
                  </button>
                  <button
                    data-period="3m"
                    class="period-btn px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    3 Months
                  </button>
                  <button
                    data-period="1y"
                    class="period-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    1 Year
                  </button>
                  <button
                    data-period="all"
                    class="period-btn px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    All Time
                  </button>
                </div>
              </div>

              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8" style="max-height: 600px;">
                <div style="height: 550px; max-height: 550px; width: 100%; position: relative;">
                  <canvas id="metrics-evolution-chart"></canvas>
                </div>
              </div>
            </div>

            <!-- Metrics History Table -->
            <div class="bg-white rounded-xl shadow-xl p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-table mr-2 text-purple-500"></i>
                Metrics History
              </h3>

              ${metricsHistory.length === 0 ?
                `<div class="text-center py-12 text-gray-500">
                  <i class="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
                  <p class="text-lg">No metrics data yet</p>
                  <p class="text-sm">Start by registering your first metrics above</p>
                </div>` :
                `<div class="overflow-x-auto">
                  <table class="w-full table-auto">
                    <thead>
                      <tr class="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <th class="px-4 py-3 text-left font-semibold">Date</th>
                        <th class="px-4 py-3 text-left font-semibold">Metric</th>
                        <th class="px-4 py-3 text-right font-semibold">Value</th>
                        <th class="px-4 py-3 text-center font-semibold">Trend</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      ${metricsHistory.slice(0, 20).map((metric, index) => {
                        const prevMetric = metricsHistory[index + 1];
                        const trend = prevMetric ?
                          (metric.metric_value > prevMetric.metric_value ? 'up' : metric.metric_value < prevMetric.metric_value ? 'down' : 'same') : 'same';

                        return `
                          <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3 text-gray-800 font-medium">${new Date(metric.recorded_date).toLocaleDateString('en-US')}</td>
                            <td class="px-4 py-3 text-gray-800">
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                metric.metric_name === 'users'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }">
                                <i class="fas ${metric.metric_name === 'users' ? 'fa-users' : 'fa-dollar-sign'} mr-1"></i>
                                ${metric.metric_name === 'users' ? 'Users' : 'Revenue'}
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

        <!-- Goals Checklist Section - NOW BELOW METRICS -->
        <div class="max-w-7xl mx-auto mb-8">
          <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 shadow-2xl border-4 border-white/20">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-white mb-2 flex items-center justify-center">
                <i class="fas fa-clipboard-check mr-3 text-yellow-300"></i>
                Daily Goals Checklist
              </h2>
              <p class="text-emerald-100 text-lg">Mark your completed goals with one click</p>
            </div>

            <!-- Quick Stats Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">${goals.length}</div>
                <div class="text-emerald-100 text-sm">Total Goals</div>
              </div>
              <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-white">${goals.filter(g => g.status === 'completed').length}</div>
                <div class="text-emerald-100 text-sm">Completed</div>
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
                <h2 class="text-2xl font-bold text-gray-800">My Goals</h2>
              </div>

              <!-- Add Goal Form -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div class="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    id="new-goal-input"
                    placeholder="What's your next goal? 🚀"
                    class="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-700"
                  />
                  <button
                    id="add-goal-btn"
                    class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <i class="fas fa-plus mr-2"></i>Add Goal
                  </button>
                </div>
              </div>

              <!-- Goals List -->
              <div id="goals-list" class="space-y-4">
                ${goals.length === 0 ?
                  `<div class="text-center py-12 text-gray-500">
                    <i class="fas fa-lightbulb text-4xl mb-4 text-yellow-400"></i>
                    <p class="text-lg">Start by adding your first goal!</p>
                    <p class="text-sm">Goals are the first step towards success</p>
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
                              ${goal.status === 'completed' ? '✅ Completed' : '🎯 Active'}
                            </span>
                          </div>
                        </div>
                        ${goal.status === 'active' ?
                          `<button
                            onclick="markGoalCompleted(${goal.id})"
                            class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <i class="fas fa-check mr-1"></i>Mark as Completed
                          </button>` : ''
                        }
                      </div>
                    </div>
                  `).join('')
                }
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
                  <h2 class="text-2xl font-bold text-gray-800">Goals Status</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Pie Chart -->
                  <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6" style="max-height: 350px;">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">Overall Completion</h3>
                    <div style="height: 250px; max-height: 250px; position: relative;">
                      <canvas id="goals-pie-chart"></canvas>
                    </div>
                  </div>

                  <!-- Stats Cards -->
                  <div class="space-y-4">
                    <div class="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-sm text-gray-600">Total Goals</p>
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
                          <p class="text-sm text-gray-600">Completed Goals</p>
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
                          <p class="text-sm text-gray-600">Success Rate</p>
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
                  <h2 class="text-2xl font-bold text-gray-800">Goals Progress Over Time</h2>
                </div>

                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6" style="max-height: 400px;">
                  <div style="height: 350px; max-height: 350px; position: relative;">
                    <canvas id="progress-chart"></canvas>
                  </div>
                </div>
              </div>

              <!-- Weekly Bar Chart -->
              <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-chart-bar text-white text-xl"></i>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-800">Goals Completed Per Week</h2>
                </div>

                <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6" style="max-height: 350px;">
                  <div style="height: 300px; max-height: 300px; position: relative;">
                    <canvas id="weekly-bar-chart"></canvas>
                  </div>
                </div>
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

        <!-- WhatsApp Integration Section -->
        <div class="max-w-7xl mx-auto mt-8">
          <div class="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl p-8 text-white shadow-2xl border border-green-500">
            <div class="text-center">
              <h2 class="text-3xl font-bold mb-4 flex items-center justify-center">
                <i class="fab fa-whatsapp mr-3 text-green-300 text-4xl"></i>
                Integración WhatsApp
              </h2>
              <p class="text-green-100 mb-8 text-lg">Conecta tu WhatsApp para gestionar tus goals y ver el leaderboard desde tu teléfono</p>

              <div class="bg-white/10 rounded-xl p-6 backdrop-blur-sm mb-6">
                <h3 class="font-bold text-green-300 mb-4 flex items-center justify-center">
                  <i class="fas fa-key mr-2"></i>Vincular tu cuenta
                </h3>
                <p class="text-green-100 mb-4 text-sm">Genera un código temporal de 6 dígitos para vincular tu WhatsApp</p>
                
                <div id="whatsapp-code-container">
                  <button
                    id="generate-whatsapp-code-btn"
                    class="px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center mx-auto"
                  >
                    <i class="fab fa-whatsapp mr-3 text-xl"></i>Generar Código WhatsApp
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div class="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 class="font-bold text-green-300 mb-3 flex items-center">
                    <i class="fas fa-comments mr-2"></i>Comandos disponibles:
                  </h3>
                  <ul class="text-green-100 space-y-2 text-sm">
                    <li class="flex items-center"><code class="bg-green-900/50 px-2 py-1 rounded mr-2">"mis goals"</code> Ver tus goals activos</li>
                    <li class="flex items-center"><code class="bg-green-900/50 px-2 py-1 rounded mr-2">"nuevo goal [desc]"</code> Crear un goal</li>
                    <li class="flex items-center"><code class="bg-green-900/50 px-2 py-1 rounded mr-2">"leaderboard"</code> Ver ranking</li>
                    <li class="flex items-center"><code class="bg-green-900/50 px-2 py-1 rounded mr-2">"ayuda"</code> Ver todos los comandos</li>
                  </ul>
                </div>
                <div class="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 class="font-bold text-green-300 mb-3 flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>Instrucciones:
                  </h3>
                  <ol class="text-green-100 space-y-2 text-sm list-decimal list-inside">
                    <li>Haz clic en "Generar Código WhatsApp"</li>
                    <li>Copia el código de 6 dígitos</li>
                    <li>Envía el código por WhatsApp al sandbox</li>
                    <li>Recibirás confirmación de vinculación</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Add form submit handler after rendering
    setTimeout(() => {
      const form = document.getElementById('dashboard-questions-form');
      if (form) {
        // Auto-save functionality
        let autoSaveTimeout;
        let isAutoSaving = false;

        async function autoSaveDashboardQuestions() {
          if (isAutoSaving) return;
          isAutoSaving = true;

          try {
            const answers = {
              launched: document.getElementById('launched-toggle').checked,
              weeksToLaunch: parseInt(document.getElementById('weeks-to-launch').value) || 0,
              usersTalked: parseInt(document.getElementById('users-talked').value) || 0,
              usersLearned: document.getElementById('users-learned').value,
              morale: parseInt(document.getElementById('morale').value) || 1,
              primaryMetricImproved: document.getElementById('primary-metric-improved').value,
              biggestObstacle: document.getElementById('biggest-obstacle').value
            };

            await axios.post('/api/dashboard/questions', answers, {
              headers: { Authorization: `Bearer ${authToken}` }
            });

            // Update local state after successful save
            dashboardQuestions = answers;

            // Update save status indicator with better styling
            const saveStatus = document.getElementById('save-status');
            if (saveStatus) {
              saveStatus.innerHTML = '<div class="flex items-center justify-center text-green-600 font-semibold animate-bounce"><i class="fas fa-cloud-upload-alt mr-2 text-lg"></i>Auto-saved!</div>';
              saveStatus.className = 'text-center mt-4 p-3 bg-green-50 rounded-lg border border-green-200 transition-all duration-300';
              setTimeout(() => {
                saveStatus.innerHTML = '';
                saveStatus.className = 'text-sm mt-2';
              }, 2500);
            }

            console.log('✅ Auto-saved dashboard questions');
          } catch (error) {
            console.error('Error auto-saving dashboard questions:', error);
            const saveStatus = document.getElementById('save-status');
            if (saveStatus) {
              saveStatus.innerHTML = '<div class="flex items-center justify-center text-red-600 font-semibold"><i class="fas fa-exclamation-triangle mr-2 text-lg"></i>Auto-save failed - will retry</div>';
              saveStatus.className = 'text-center mt-4 p-3 bg-red-50 rounded-lg border border-red-200 transition-all duration-300';
              setTimeout(() => {
                saveStatus.innerHTML = '';
                saveStatus.className = 'text-sm mt-2';
              }, 3500);
            }
          } finally {
            isAutoSaving = false;
          }
        }

        // Function to trigger auto-save with debounce
        function triggerAutoSave() {
          clearTimeout(autoSaveTimeout);
          autoSaveTimeout = setTimeout(autoSaveDashboardQuestions, 1000); // Save after 1 second of inactivity

          // Show saving indicator immediately
          const saveStatus = document.getElementById('save-status');
          if (saveStatus) {
            saveStatus.innerHTML = '<div class="flex items-center justify-center text-blue-600 font-semibold"><i class="fas fa-sync-alt fa-spin mr-2 text-lg"></i>Saving changes...</div>';
            saveStatus.className = 'text-center mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300';
          }

          // Update progress immediately
          updateProgress();
        }

        // Function to calculate and update progress
        function updateProgress() {
          const fields = [
            'weeks-to-launch',
            'users-talked',
            'morale'
          ];

          let completed = 0;
          fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && element.value && element.value.trim() !== '') {
              completed++;
            }
          });

          // Check checkbox separately
          const checkbox = document.getElementById('launched-toggle');
          if (checkbox && checkbox.checked) {
            completed++;
          }

          const progressPercentage = (completed / 4) * 100;
          const progressBar = document.getElementById('progress-bar');
          if (progressBar) {
            progressBar.style.width = progressPercentage + '%';
          }
        }

        // Add event listeners to all form fields for progress tracking
        const progressFields = [
          'launched-toggle',
          'weeks-to-launch',
          'users-talked',
          'users-learned',
          'morale',
          'primary-metric-improved',
          'biggest-obstacle'
        ];

        progressFields.forEach(fieldId => {
          const element = document.getElementById(fieldId);
          if (element) {
            if (element.type === 'checkbox') {
              element.addEventListener('change', updateProgress);
            } else {
              element.addEventListener('input', updateProgress);
              element.addEventListener('change', updateProgress);
            }
          }
        });

        // Initial progress calculation
        setTimeout(updateProgress, 100);

        // Manual save on form submit
        form.onsubmit = async function(e) {
          e.preventDefault();
          clearTimeout(autoSaveTimeout); // Cancel any pending auto-save

          // Disable the button and show loading state
          const submitButton = form.querySelector('button[type="submit"]');
          const originalButtonText = submitButton.innerHTML;
          submitButton.disabled = true;
          submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

          const answers = {
            launched: document.getElementById('launched-toggle').checked,
            weeksToLaunch: parseInt(document.getElementById('weeks-to-launch').value) || 0,
            usersTalked: parseInt(document.getElementById('users-talked').value) || 0,
            usersLearned: document.getElementById('users-learned').value,
            morale: parseInt(document.getElementById('morale').value) || 1,
            primaryMetricImproved: document.getElementById('primary-metric-improved').value,
            biggestObstacle: document.getElementById('biggest-obstacle').value
          };

          try {
            await axios.post('/api/dashboard/questions', answers, {
              headers: { Authorization: `Bearer ${authToken}` }
            });

            // Update local state after successful save
            dashboardQuestions = answers;

            // Show success animation
            submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
            submitButton.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'hover:from-indigo-600', 'hover:to-purple-600');
            submitButton.classList.add('bg-green-500', 'hover:bg-green-600');

            // Add success message
            const saveStatus = document.getElementById('save-status');
            if (saveStatus) {
              saveStatus.innerHTML = '<div class="flex items-center justify-center text-green-600 font-semibold"><i class="fas fa-check-circle mr-2"></i>All answers saved successfully!</div>';
              saveStatus.classList.add('animate-pulse');
            }

            // Reset button after 2 seconds
            setTimeout(() => {
              submitButton.disabled = false;
              submitButton.innerHTML = originalButtonText;
              submitButton.classList.remove('bg-green-500', 'hover:bg-green-600');
              submitButton.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'hover:from-indigo-600', 'hover:to-purple-600');

              if (saveStatus) {
                saveStatus.innerHTML = '';
                saveStatus.classList.remove('animate-pulse');
              }
            }, 2000);

          } catch (error) {
            console.error('Error saving dashboard questions:', error);

            // Show error state
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Try Again';
            submitButton.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'hover:from-indigo-600', 'hover:to-purple-600');
            submitButton.classList.add('bg-red-500', 'hover:bg-red-600');

            // Add error message
            const saveStatus = document.getElementById('save-status');
            if (saveStatus) {
              saveStatus.innerHTML = '<div class="flex items-center justify-center text-red-600 font-semibold"><i class="fas fa-exclamation-circle mr-2"></i>Failed to save. Please check your connection and try again.</div>';
            }

            // Reset button after 3 seconds
            setTimeout(() => {
              submitButton.innerHTML = originalButtonText;
              submitButton.classList.remove('bg-red-500', 'hover:bg-red-600');
              submitButton.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'hover:from-indigo-600', 'hover:to-purple-600');

              if (saveStatus) {
                saveStatus.innerHTML = '';
              }
            }, 3000);
          }
        };
      }
    }, 100);

    // Event listeners are now handled by delegation at the top of renderGoalsDashboard
    // No need to attach them here anymore
    console.log('✅ Dashboard HTML rendered, event delegation already active');

    // Period selector buttons for metrics evolution chart
    let currentPeriod = '1m';
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active button style
        document.querySelectorAll('.period-btn').forEach(b => {
          b.classList.remove('bg-blue-500', 'text-white');
          b.classList.add('bg-gray-200', 'text-gray-700');
        });
        this.classList.remove('bg-gray-200', 'text-gray-700');
        this.classList.add('bg-blue-500', 'text-white');
        
        // Update chart with new period
        currentPeriod = this.getAttribute('data-period');
        renderMetricsEvolutionChart(currentPeriod);
      });
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

    // Render chart if data available - ONLY ONCE with longer delay for Chrome
    if (goals.length > 0) {
      // Clear any existing timeout
      if (window.chartRenderTimeout) clearTimeout(window.chartRenderTimeout);
      
      window.chartRenderTimeout = setTimeout(() => {
        console.log('Starting delayed chart render...');
        renderChart();
        window.chartRenderTimeout = null;
      }, 300); // Increased from 100ms to 300ms for Chrome compatibility
    }
    
    // Mark render as complete
    isRenderingDashboard = false;
    console.log('✅ Dashboard render completed');
  }

  // Track if chart is currently rendering to prevent multiple calls
  let isRenderingChart = false;

  function renderChart() {
    if (isRenderingChart) {
      console.log('⚠️ Chart rendering already in progress, skipping...');
      return;
    }
    
    isRenderingChart = true;
    console.log('renderChart called with goals:', goals.length);
    
    // Use try-finally to ensure flag is always reset
    try {
      if (!window.Chart) {
        console.error('Chart.js not loaded');
        return;
      }
      
      // Verify all canvas elements exist before rendering
      const pieCtx = document.getElementById('goals-pie-chart');
      const barCtx = document.getElementById('weekly-bar-chart');
      const lineCtx = document.getElementById('progress-chart');
      
      if (!pieCtx || !barCtx || !lineCtx) {
        console.error('⚠️ One or more canvas elements not found:', { 
          pie: !!pieCtx, 
          bar: !!barCtx, 
          line: !!lineCtx 
        });
        return;
      }
      
      console.log('✅ All canvas elements found, proceeding with render');

      // 1. PIE CHART - Goals Status Overview
      if (pieCtx) {
        const existingChart = Chart.getChart(pieCtx);
        if (existingChart) existingChart.destroy();
      
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const activeGoals = goals.filter(g => g.status === 'active').length;
      const totalGoals = goals.length;
      
      console.log('Pie chart - Total goals:', totalGoals, 'Completed:', completedGoals, 'Active:', activeGoals);

      // Si no hay goals, mostrar datos mínimos para que el gráfico se vea
      let displayCompleted = totalGoals > 0 ? completedGoals : 0;
      let displayActive = totalGoals > 0 ? activeGoals : 1; // Al menos 1 para que se vea el gráfico

      // Sanitize numbers AGGRESSIVELY (avoid NaN / Infinity / negative)
      displayCompleted = Math.max(0, Math.floor(Number(displayCompleted) || 0));
      displayActive = Math.max(0, Math.floor(Number(displayActive) || 0));

      // Prevent extreme values
      if (displayCompleted > 10000) displayCompleted = 10000;
      if (displayActive > 10000) displayActive = 10000;

      // If both zero, force a visible pending slice
      if (displayCompleted === 0 && displayActive === 0) displayActive = 1;

      const pieData = [displayCompleted, displayActive];

      console.log('Pie chart final data:', pieData);

      try {
        new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
              data: pieData,
              backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 0 // Disable animation to prevent infinite loop issues
            },
            plugins: {
              legend: {
                display: true,
                position: 'bottom'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const total = pieData.reduce((a,b) => a + b, 0);
                    const value = Math.floor(Number(context.parsed) || 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return context.label + ': ' + value + ' (' + percentage + '%)';
                  }
                }
              }
            }
          }
        });

        if (totalGoals > 0) {
          console.log('✓ Goals status pie chart rendered with real data');
        } else {
          console.log('⚠️ Goals status pie chart rendered with placeholder data (no goals yet)');
        }
      } catch(e) {
        console.error('Goals status pie chart error:', e);
      }
    }

    // 2. BAR CHART - Goals Completed Per Week (DATOS REALES)
    if (barCtx) {
      const existingChart = Chart.getChart(barCtx);
      if (existingChart) existingChart.destroy();

      // Calcular goals completados por semana (últimas 8 semanas)
      const now = new Date();
      const weeks = [];
      const goalsCompletedPerWeek = [];

      console.log('Total goals available:', goals.length);
      console.log('Goals data:', goals.map(g => ({ id: g.id, status: g.status, created_at: g.created_at, updated_at: g.updated_at })));

      // Generar últimas 8 semanas
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekLabel = `W${8-i}`;
        weeks.push(weekLabel);

        // Contar goals completados en esta semana específica
        const goalsCompletedInWeek = goals.filter(goal => {
          if (goal.status !== 'completed') return false;
          const completedDate = new Date(goal.updated_at);
          return completedDate >= weekStart && completedDate <= weekEnd;
        }).length;

        goalsCompletedPerWeek.push(goalsCompletedInWeek);

        console.log(`Week ${weekLabel} (${weekStart.toDateString()} - ${weekEnd.toDateString()}): ${goalsCompletedInWeek} goals completed`);
      }

      console.log('Bar chart - Goals completed per week:', goalsCompletedPerWeek);

      // Sanitize values AGGRESSIVELY (ensure finite positive integers)
      const sanitizedGoalsPerWeek = goalsCompletedPerWeek.map(v => {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 10000) return 0;
        return Math.floor(n);
      });

      const maxY = Math.max(...sanitizedGoalsPerWeek, 1);
      const safeMaxY = Math.min(maxY + 1, 10000); // Cap at 10k

      console.log('Bar chart sanitized data:', sanitizedGoalsPerWeek, 'Max Y:', safeMaxY);

      try {
        new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: weeks,
            datasets: [{
              label: 'Goals Completed Per Week',
              data: sanitizedGoalsPerWeek,
              backgroundColor: 'rgba(249, 115, 22, 0.8)',
              borderColor: 'rgba(249, 115, 22, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 0 // Disable animation
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const val = Math.floor(Number(context.parsed.y) || 0);
                    return context.dataset.label + ': ' + val + ' goals';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
                max: safeMaxY,
                ticks: {
                  stepSize: Math.max(1, Math.ceil(safeMaxY / 10)),
                  callback: function(value) {
                    const val = Math.floor(Number(value) || 0);
                    if (!Number.isFinite(val)) return '0';
                    return val;
                  }
                }
              }
            }
          }
        });
        console.log('✓ Weekly goals completed chart rendered with real data');
      } catch(e) {
        console.error('Weekly goals completed chart error:', e);
      }
    }

    // 3. LINE CHART - Goals Progress Over Time (DATOS REALES)
    if (lineCtx) {
      const existingChart = Chart.getChart(lineCtx);
      if (existingChart) existingChart.destroy();

      // Calcular progreso acumulado real de goals por semana
      const now = new Date();
      const weeks = [];
      const totalGoalsData = [];
      const completedGoalsData = [];

      console.log('Progress chart - Total goals available:', goals.length);
      console.log('Progress chart - Goals data sample:', goals.slice(0, 3).map(g => ({
        id: g.id,
        status: g.status,
        created_at: g.created_at,
        updated_at: g.updated_at
      })));

      // Generar últimas 8 semanas
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));

        const weekLabel = `W${8-i}`;
        weeks.push(weekLabel);

        // Contar goals creados hasta esta semana (acumulado)
        const goalsCreatedByWeek = goals.filter(goal => {
          const createdDate = new Date(goal.created_at);
          return createdDate <= weekEnd;
        }).length;

        // Contar goals completados hasta esta semana (acumulado)
        const goalsCompletedByWeek = goals.filter(goal => {
          if (goal.status !== 'completed') return false;
          const updatedDate = new Date(goal.updated_at);
          return updatedDate <= weekEnd;
        }).length;

        totalGoalsData.push(goalsCreatedByWeek);
        completedGoalsData.push(goalsCompletedByWeek);

        console.log(`Progress chart - ${weekLabel} (until ${weekEnd.toDateString()}): ${goalsCreatedByWeek} created, ${goalsCompletedByWeek} completed`);
      }

      console.log('Progress chart - Total goals by week:', totalGoalsData);
      console.log('Progress chart - Completed goals by week:', completedGoalsData);

      // Sanitize arrays AGGRESSIVELY
      const sanitizedTotal = totalGoalsData.map(v => {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 100000) return 0;
        return Math.floor(n);
      });
      const sanitizedCompleted = completedGoalsData.map(v => {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 100000) return 0;
        return Math.floor(n);
      });

      const maxY = Math.max(...sanitizedTotal, ...sanitizedCompleted, 1);
      const safeMaxY = Math.min(maxY + 1, 100000); // Cap at reasonable max
      const step = Math.max(1, Math.ceil(safeMaxY / 10));

      console.log('Progress chart sanitized - Total:', sanitizedTotal, 'Completed:', sanitizedCompleted, 'Max Y:', safeMaxY);

      // Si no hay datos, mostrar advertencia en logs
      const hasData = sanitizedTotal.some(v => v > 0) || sanitizedCompleted.some(v => v > 0);

      try {
        new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: weeks,
            datasets: [
              {
                label: 'Total Goals Created (Cumulative)',
                data: sanitizedTotal,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
              },
              {
                label: 'Goals Completed (Cumulative)',
                data: sanitizedCompleted,
                borderColor: 'rgba(34, 197, 94, 1)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 0 // Disable animation to prevent infinite loop
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const val = Math.floor(Number(context.parsed.y) || 0);
                    return context.dataset.label + ': ' + val + ' goals';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
                max: safeMaxY,
                ticks: {
                  stepSize: step,
                  callback: function(value) {
                    const val = Math.floor(Number(value) || 0);
                    if (!Number.isFinite(val)) return '0';
                    return val;
                  }
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });

        if (hasData) {
          console.log('✓ Goals progress chart rendered with real data');
        } else {
          console.log('⚠️ Goals progress chart rendered but no data available yet');
        }
      } catch(e) {
        console.error('Goals progress chart error:', e);
      }
    }
    
    } catch (error) {
      console.error('Error in renderChart:', error);
    } finally {
      // Always reset the flag
      isRenderingChart = false;
    }
  }  
  
  // Track if metrics chart is rendering
  let isRenderingMetricsChart = false;
  
  // Function to render metrics evolution chart with time period filter
  function renderMetricsEvolutionChart(period = '1m') {
    if (isRenderingMetricsChart) {
      console.log('⚠️ Metrics chart rendering already in progress, skipping...');
      return;
    }
    
    isRenderingMetricsChart = true;
    
    try {
      const evolutionCtx = document.getElementById('metrics-evolution-chart');
      if (!evolutionCtx || !window.Chart) {
        console.log('Cannot render metrics chart - canvas or Chart.js not available');
        return;
      }

      console.log('Rendering metrics evolution chart with period:', period);
      console.log('Metrics history data:', metricsHistory.length, 'records');

      // Destroy existing chart
      const existingChart = Chart.getChart(evolutionCtx);
      if (existingChart) {
        existingChart.destroy();
      }

      // If no data, show message
    if (metricsHistory.length === 0) {
      console.log('No metrics history data available');
      // Chart.js cannot display a message, so we'll just skip rendering
      return;
    }

    // Filter data by period
    const now = new Date();
    let startDate;
    
    switch(period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Filter metrics by date range
    const filteredMetrics = metricsHistory.filter(metric => {
      const metricDate = new Date(metric.recorded_date);
      return metricDate >= startDate;
    });

    console.log('Filtered metrics:', filteredMetrics.length, 'records for period', period);
    console.log('Start date:', startDate);
    console.log('Sample metric dates:', metricsHistory.slice(0, 3).map(m => m.recorded_date));

    // If no data in range, show message
    if (filteredMetrics.length === 0) {
      console.log('No data in selected time range');
      return;
    }

    // Group metrics by date
    const metricsByDate = {};
    filteredMetrics.forEach(metric => {
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
      // Format based on period
      if (period === '1m') {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period === '3m') {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period === '1y') {
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    });

    const usersData = sortedDates.map(date => metricsByDate[date].users);
    const revenueData = sortedDates.map(date => metricsByDate[date].revenue);

    console.log('Chart labels:', labels);
    console.log('Users data:', usersData);
    console.log('Revenue data:', revenueData);

    new Chart(evolutionCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Users',
            data: usersData,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Revenue',
            data: revenueData,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(34, 197, 94, 1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.datasetIndex === 0) { // Users
                  label += context.parsed.y !== null ? context.parsed.y.toLocaleString() : 'No data';
                } else { // Revenue
                  label += context.parsed.y !== null ? '$' + context.parsed.y.toLocaleString() : 'No data';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + 'k';
                }
                return value;
              }
            }
          }
        }
      }
    });
    
    console.log('Metrics evolution chart rendered successfully');
    
    } catch (error) {
      console.error('Error in renderMetricsEvolutionChart:', error);
    } finally {
      // Always reset the flag
      isRenderingMetricsChart = false;
    }
  }

  // Load data and render
  console.log('About to start Promise.all for loading data');
  console.log('Starting to load dashboard data...');
  dashboardContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i><p class="text-gray-600">Cargando datos del dashboard...</p></div>';
  
  try {
    await Promise.all([fetchGoals(), fetchPrimaryMetrics(), fetchMetricsHistory()]);
    console.log('All dashboard data loaded successfully');
    console.log('Metrics history loaded:', metricsHistory.length, 'records');
    console.log('Goals loaded:', goals.length, 'goals');
    loading = false;
    renderDashboard();
    
    // Wait for Chart.js to be available
    const waitForChart = () => {
      return new Promise((resolve) => {
        if (window.Chart) {
          console.log('Chart.js is available');
          resolve();
        } else {
          console.log('Waiting for Chart.js...');
          setTimeout(() => waitForChart().then(resolve), 100);
        }
      });
    };
    
    await waitForChart();
    
    // Render charts after a short delay to ensure DOM is updated
    setTimeout(() => {
      console.log('Starting chart rendering...');
      try {
        renderChart();
        console.log('renderChart completed');
      } catch (error) {
        console.error('Error rendering charts:', error);
      }
      
      // Render metrics evolution chart separately with additional delay
      setTimeout(() => {
        console.log('Starting metrics evolution chart rendering...');
        try {
          renderMetricsEvolutionChart('1m');
          console.log('renderMetricsEvolutionChart completed');
        } catch (error) {
          console.error('Error rendering metrics evolution chart:', error);
        }
      }, 300);
    }, 300);
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
        form.pricing_model.value = product.pricing_model || 'subscription_monthly';
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">💰 Modelo de Pricing del Producto *</label>
            <select name="pricing_model" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">Selecciona modelo de pricing...</option>
              <option value="free">Gratis</option>
              <option value="freemium">Freemium (Gratis + Planes de pago)</option>
              <option value="one_time">Pago único</option>
              <option value="subscription_monthly">Suscripción Mensual</option>
              <option value="subscription_yearly">Suscripción Anual</option>
              <option value="usage_based">Basado en uso / Pay-as-you-go</option>
              <option value="enterprise">Enterprise / Pricing personalizado</option>
            </select>
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
    pricing_model: formData.get('pricing_model'),
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
    // Use existing products endpoint and filter by current user
    const response = await axios.get('/api/marketplace/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const select = document.getElementById('request-product-id');
    if (select && response.data.products) {
      // Clear existing options except first
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Filter products to only show those owned by current user
      const userProducts = response.data.products.filter(product => 
        product.company_user_id === currentUser.id
      );
      
      console.log('User products found:', userProducts.length, 'for user:', currentUser.id);
      
      // Add user's products
      userProducts.forEach(product => {
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
      projectId: productId, // Send the selected product ID
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

// ============================================
// CHAT SYSTEM
// ============================================

// Global chat state
let unreadChatMessages = 0;
let chatPollingInterval = null;
let currentConversationId = null;
let chatMessages = [];

// Function to open chat with validator
async function openChatWithValidator(validatorId, validatorName) {
  if (!authToken || !currentUser) {
    showAuthModal('login');
    return;
  }

  // Check if there's an existing conversation
  try {
    const response = await axios.get('/api/chat/conversations', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const conversations = response.data.conversations || [];
    const existingConv = conversations.find(conv => 
      conv.validator_id == validatorId || conv.other_user_name === validatorName
    );

    if (existingConv) {
      // Open existing conversation
      openChatModal(existingConv.id, validatorName);
    } else {
      // Show request modal
      showChatRequestModal(validatorId, validatorName);
    }
  } catch (error) {
    console.error('Error checking conversations:', error);
    showChatRequestModal(validatorId, validatorName);
  }
}

// Show modal to send chat request
function showChatRequestModal(validatorId, validatorName) {
  const modal = document.createElement('div');
  modal.id = 'chat-request-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  modal.onclick = (e) => {
    if (e.target === modal) closeChatRequestModal();
  };

  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-bold mb-4 text-gray-900">
        <i class="fas fa-comment-dots text-primary mr-2"></i>
        Solicitar Chat con ${escapeHtml(validatorName)}
      </h2>
      <p class="text-gray-600 mb-4">
        Envía una solicitud de chat a este validador. Podrás chatear una vez que acepte tu solicitud.
      </p>
      <form id="chat-request-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Mensaje (opcional)</label>
          <textarea id="chat-request-message" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Hola, me gustaría hablar contigo sobre..."></textarea>
        </div>
        <div class="flex space-x-3">
          <button type="button" onclick="closeChatRequestModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
            <i class="fas fa-paper-plane mr-2"></i>Enviar Solicitud
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('chat-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await sendChatRequest(validatorId, validatorName);
  });
}

function closeChatRequestModal() {
  const modal = document.getElementById('chat-request-modal');
  if (modal) modal.remove();
}

// Send chat request
async function sendChatRequest(validatorId, validatorName) {
  const message = document.getElementById('chat-request-message').value || 'Hola, me gustaría chatear contigo.';

  try {
    const response = await axios.post('/api/validator-requests/send', {
      validatorId: validatorId,
      message: message,
      projectId: null // No project-specific, just general chat request
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    showToast('¡Solicitud enviada! Te notificaremos cuando el validador responda.', 'success');
    closeChatRequestModal();
  } catch (error) {
    console.error('Error sending chat request:', error);
    const errorMsg = error.response?.data?.error || 'Error al enviar solicitud';
    showToast(errorMsg, 'error');
  }
}

// Open chat modal with conversation
async function openChatModal(conversationId, otherUserName) {
  currentConversationId = conversationId;

  const modal = document.createElement('div');
  modal.id = 'chat-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  modal.onclick = (e) => {
    if (e.target === modal) closeChatModal();
  };

  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col" onclick="event.stopPropagation()">
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary to-secondary p-4 text-white rounded-t-xl flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-comment-dots text-2xl mr-3"></i>
          <div>
            <h3 class="font-bold text-lg">${escapeHtml(otherUserName)}</h3>
            <p class="text-sm text-blue-100">Online</p>
          </div>
        </div>
        <button onclick="closeChatModal()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Messages -->
      <div id="chat-messages-container" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
          <p class="text-gray-500 mt-2">Cargando mensajes...</p>
        </div>
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <form id="chat-send-form" class="flex space-x-2">
          <input 
            type="text" 
            id="chat-message-input" 
            placeholder="Escribe un mensaje..." 
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
          <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition font-semibold">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Load messages
  await loadChatMessages(conversationId);

  // Setup send form
  document.getElementById('chat-send-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await sendChatMessage(conversationId);
  });

  // Start polling for new messages
  startChatPolling(conversationId);
}

function closeChatModal() {
  const modal = document.getElementById('chat-modal');
  if (modal) modal.remove();
  currentConversationId = null;
  stopChatPolling();
}

// Load chat messages
async function loadChatMessages(conversationId) {
  if (!authToken) {
    console.warn('Cannot load chat messages: no auth token');
    return;
  }
  
  try {
    const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    chatMessages = response.data.messages || [];
    renderChatMessages();
  } catch (error) {
    console.error('Error loading chat messages:', error);
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          <p class="text-gray-600 mt-2">Error al cargar mensajes</p>
        </div>
      `;
    }
  }
}

// Render chat messages
function renderChatMessages() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  if (chatMessages.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-comments text-4xl text-gray-300 mb-3"></i>
        <p class="text-gray-500">No hay mensajes aún. ¡Empieza la conversación!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = chatMessages.map(msg => {
    const isOwn = msg.sender_id === currentUser.id;
    return `
      <div class="flex ${isOwn ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[70%]">
          ${!isOwn ? `<p class="text-xs text-gray-500 mb-1 ml-1">${escapeHtml(msg.sender_name)}</p>` : ''}
          <div class="${isOwn ? 'bg-primary text-white' : 'bg-white text-gray-900 border border-gray-200'} rounded-lg px-4 py-2 shadow-sm">
            <p class="text-sm">${escapeHtml(msg.message)}</p>
          </div>
          <p class="text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'} px-1">
            ${formatMessageTime(msg.created_at)}
          </p>
        </div>
      </div>
    `;
  }).join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Send chat message
async function sendChatMessage(conversationId) {
  if (!authToken) {
    console.warn('Cannot send message: no auth token');
    return;
  }
  
  const input = document.getElementById('chat-message-input');
  const message = input.value.trim();

  if (!message) return;

  try {
    await axios.post(`/api/chat/conversations/${conversationId}/messages`, {
      message: message
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    input.value = '';
    await loadChatMessages(conversationId);
  } catch (error) {
    console.error('Error sending message:', error);
    showToast('Error al enviar mensaje', 'error');
  }
}

// Format message time
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

// Start chat polling
function startChatPolling(conversationId) {
  stopChatPolling();
  chatPollingInterval = setInterval(() => {
    if (currentConversationId === conversationId) {
      loadChatMessages(conversationId);
    }
  }, 5000); // Poll every 5 seconds
}

// Stop chat polling
function stopChatPolling() {
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}

// Load unread chat count
async function loadUnreadChatCount() {
  if (!authToken) return;

  try {
    const response = await axios.get('/api/chat/unread-count', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    unreadChatMessages = response.data.unreadCount || 0;
    updateChatIcons();
  } catch (error) {
    console.error('Error loading unread chat count:', error);
  }
}

// Update chat icons with badge
function updateChatIcons() {
  // This will be called after rendering validators/products
  // to update any chat icons with unread badge
}

// ============================================
// DASHBOARD CHAT SECTIONS
// ============================================

// Load chat requests for validators
async function loadChatRequests() {
  if (!authToken || !currentUser || currentUser.role !== 'validator') return { requests: [] };

  try {
    const response = await axios.get('/api/validator-requests/pending', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    return { requests: response.data.requests || [] };
  } catch (error) {
    console.error('Error loading chat requests:', error);
    return { requests: [] };
  }
}

// Accept chat request
async function acceptChatRequest(requestId) {
  try {
    const response = await axios.post(`/api/validator-requests/${requestId}/accept`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    showToast('¡Solicitud aceptada! Ya puedes chatear con el founder.', 'success');
    
    // Open the new conversation
    if (response.data.conversationId) {
      // Reload dashboard to update UI
      loadMyDashboard();
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    showToast(error.response?.data?.error || 'Error al aceptar solicitud', 'error');
  }
}

// Reject chat request
async function rejectChatRequest(requestId) {
  try {
    await axios.post(`/api/validator-requests/${requestId}/reject`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    showToast('Solicitud rechazada', 'info');
    loadMyDashboard(); // Reload dashboard
  } catch (error) {
    console.error('Error rejecting request:', error);
    showToast('Error al rechazar solicitud', 'error');
  }
}

// Load conversations
async function loadConversations() {
  if (!authToken || !currentUser) return { conversations: [] };

  try {
    const response = await axios.get('/api/chat/conversations', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    return { conversations: response.data.conversations || [] };
  } catch (error) {
    console.error('Error loading conversations:', error);
    return { conversations: [] };
  }
}

// Render chat requests section (for validators)
function renderChatRequestsSection(requests) {
  if (requests.length === 0) {
    return `
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-inbox text-primary mr-3"></i>
          Solicitudes de Chat
        </h3>
        <div class="text-center py-8">
          <i class="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500">No tienes solicitudes pendientes</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <i class="fas fa-inbox text-primary mr-3"></i>
        Solicitudes de Chat
        <span class="ml-3 bg-primary text-white text-sm px-3 py-1 rounded-full">${requests.length}</span>
      </h3>
      <div class="space-y-3">
        ${requests.map(req => `
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold mr-3">
                    ${req.founder_name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">${escapeHtml(req.founder_name)}</h4>
                    <p class="text-xs text-gray-500">${escapeHtml(req.founder_email)}</p>
                  </div>
                </div>
                <p class="text-sm text-gray-700 mb-2">${escapeHtml(req.message)}</p>
                ${req.project_title ? `
                  <p class="text-xs text-gray-500">
                    <i class="fas fa-project-diagram mr-1"></i>
                    Proyecto: ${escapeHtml(req.project_title)}
                  </p>
                ` : ''}
                <p class="text-xs text-gray-400 mt-2">
                  ${formatMessageTime(req.created_at)}
                </p>
              </div>
              <div class="flex flex-col space-y-2 ml-4">
                <button onclick="acceptChatRequest(${req.id})" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm font-semibold whitespace-nowrap">
                  <i class="fas fa-check mr-1"></i>Aceptar
                </button>
                <button onclick="rejectChatRequest(${req.id})" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold whitespace-nowrap">
                  <i class="fas fa-times mr-1"></i>Rechazar
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render conversations section
function renderConversationsSection(conversations) {
  if (conversations.length === 0) {
    return `
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-comments text-primary mr-3"></i>
          Mis Conversaciones
        </h3>
        <div class="text-center py-8">
          <i class="fas fa-comments text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500">No tienes conversaciones activas</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <i class="fas fa-comments text-primary mr-3"></i>
        Mis Conversaciones
        ${conversations.filter(c => c.unread_count > 0).length > 0 ? `
          <span class="ml-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
            ${conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)} nuevos
          </span>
        ` : ''}
      </h3>
      <div class="space-y-3">
        ${conversations.map(conv => `
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer ${conv.unread_count > 0 ? 'bg-blue-50 border-primary' : ''}" onclick="openChatModal(${conv.id}, '${escapeHtml(conv.other_user_name)}')">
            <div class="flex items-start justify-between">
              <div class="flex items-center flex-1">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold mr-3">
                  ${conv.other_user_name?.charAt(0) || 'U'}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="font-semibold text-gray-900 truncate">${escapeHtml(conv.other_user_name)}</h4>
                    ${conv.unread_count > 0 ? `
                      <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        ${conv.unread_count}
                      </span>
                    ` : ''}
                  </div>
                  ${conv.validator_title ? `<p class="text-xs text-gray-500 mb-1">${escapeHtml(conv.validator_title)}</p>` : ''}
                  ${conv.project_title ? `
                    <p class="text-xs text-gray-500 mb-2">
                      <i class="fas fa-project-diagram mr-1"></i>
                      ${escapeHtml(conv.project_title)}
                    </p>
                  ` : ''}
                  ${conv.last_message ? `
                    <p class="text-sm text-gray-600 truncate">${escapeHtml(conv.last_message)}</p>
                  ` : '<p class="text-sm text-gray-400 italic">Sin mensajes aún</p>'}
                  <p class="text-xs text-gray-400 mt-1">
                    ${formatMessageTime(conv.last_message_at || conv.created_at)}
                  </p>
                </div>
              </div>
              <i class="fas fa-chevron-right text-gray-400 ml-3"></i>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Helper function to escape HTML
// Function to change user role
async function changeUserRole(newRole) {
  if (!authToken) {
    showAuthModal('login');
    return;
  }
  
  try {
    const response = await axios.put('/api/auth/role', 
      { newRole }, 
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    // Update token and user data
    authToken = response.data.token;
    currentUser = response.data.user;
    localStorage.setItem('authToken', authToken);
    
    // Update UI
    updateAuthUI();
    
    // Reload the page to show the new dashboard
    window.location.reload();
    
  } catch (error) {
    console.error('Error changing role:', error);
    alert('Error: ' + (error.response?.data?.error || 'No se pudo cambiar el rol'));
  }
}

// Function to update marketplace-specific authentication UI
function updateMarketplaceAuthUI() {
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
        <select onchange="changeUserRole(this.value)" class="text-sm border border-gray-300 rounded px-2 py-1">
          <option value="founder" ${currentUser.role === 'founder' ? 'selected' : ''}>Founder</option>
          <option value="validator" ${currentUser.role === 'validator' ? 'selected' : ''}>Validator</option>
        </select>
        <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition">
          <i class="fas fa-sign-out-alt mr-1"></i>Logout
        </button>
      </div>
    `;
    
    // Mobile auth nav
    mobileAuthNav.innerHTML = `
      <button onclick="logout()" class="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 transition">
        <i class="fas fa-sign-out-alt mr-2"></i>Logout (${currentUser.name})
      </button>
    `;
    
    // Show dashboard tab for all authenticated users
    myDashboardTab.classList.remove('hidden');
    
    // Role-based tab visibility
    if (currentUser.role === 'validator') {
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
        Login
      </button>
      <button onclick="showAuthModal('register')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
        Sign Up
      </button>
    `;
    
    mobileAuthNav.innerHTML = `
      <button onclick="showAuthModal('login')" class="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary transition">
        <i class="fas fa-sign-in-alt mr-2"></i>Login
      </button>
      <button onclick="showAuthModal('register')" class="block w-full text-left px-3 py-2 mt-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
        <i class="fas fa-user-plus mr-2"></i>Sign Up
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
window.changeUserRole = changeUserRole;
window.updateAuthUI = updateAuthUI;
window.updateMarketplaceAuthUI = updateMarketplaceAuthUI;
window.closeChatRequestModal = closeChatRequestModal;
window.closeChatModal = closeChatModal;
window.showChatRequestModal = showChatRequestModal;
window.openChatModal = openChatModal;
window.acceptChatRequest = acceptChatRequest;
window.rejectChatRequest = rejectChatRequest;
window.loadChatRequests = loadChatRequests;

// Login with Google OAuth
function loginWithGoogle(role) {
  console.log('🚀 loginWithGoogle called with role:', role);
  
  // Show loading state
  const modal = document.getElementById('auth-modal');
  const content = document.getElementById('auth-modal-content');
  content.innerHTML = `
    <div class="text-center py-8">
      <i class="fab fa-google text-4xl text-red-600 mb-4"></i>
      <h2 class="text-xl font-bold mb-2">Connecting with Google...</h2>
      <p class="text-gray-600">Redirecting to Google...</p>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mt-4"></div>
    </div>
  `;
  
  // Build redirect URL with current product if on product page
  let redirectUrl = `/api/auth/google?role=${role}`;
  if (currentProductId) {
    redirectUrl += `&redirect=/marketplace?product=${currentProductId}`;
  }
  
  // Redirect to Google OAuth
  console.log('🌐 Redirecting to:', redirectUrl);
  window.location.href = redirectUrl;
}

// ============================================
// CHAT INTERFACE FOR MARKETPLACE TAB
// ============================================

// Global variables for chat interface

async function loadChatInterface() {
  if (!currentUser) {
    console.warn('Cannot load chat interface: user not loaded yet');
    return;
  }
  
  try {
    // Load conversations
    await loadConversationsList();
    
    // Load pending requests if user is validator
    if (currentUser.role === 'validator') {
      await loadPendingRequests();
    }
    
    // Update notification badge
    updateChatNotificationBadge();
    
  } catch (error) {
    console.error('Error loading chat interface:', error);
    showError('Error loading chat interface');
  }
}

async function loadConversationsList() {
  if (!authToken) {
    console.warn('Cannot load conversations: no auth token');
    return;
  }
  
  try {
    const response = await axios.get('/api/chat/conversations', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const conversations = response.data.conversations || [];
    renderConversationsList(conversations);
    
  } catch (error) {
    console.error('Error loading conversations:', error);
    document.getElementById('conversations-list').innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
        <p>Error loading conversations</p>
      </div>
    `;
  }
}

function renderConversationsList(conversations) {
  const container = document.getElementById('conversations-list');
  
  if (conversations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-comments text-3xl mb-2"></i>
        <p>You don't have active conversations</p>
        <p class="text-sm mt-2">Conversations will appear here when you contact validators</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = conversations.map(conv => `
    <div onclick="selectConversation('${conv.id}', '${escapeHtml(conv.other_user_name)}', '${escapeHtml(conv.project_title || 'Sin proyecto')}', '${conv.other_user_avatar || ''}')"
         class="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition ${currentConversationId === conv.id ? 'bg-primary/10 border-primary' : 'border-gray-200'}">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
          ${conv.other_user_avatar ? `<img src="${conv.other_user_avatar}" class="w-10 h-10 rounded-full object-cover" alt="${conv.other_user_name}">` : conv.other_user_name.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-900 truncate">${escapeHtml(conv.other_user_name)}</h4>
            ${conv.unread_count > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">${conv.unread_count}</span>` : ''}
          </div>
          <p class="text-sm text-gray-600 truncate">${escapeHtml(conv.project_title || 'No project')}</p>
          ${conv.last_message ? `<p class="text-xs text-gray-500 truncate mt-1">${escapeHtml(conv.last_message)}</p>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function selectConversation(conversationId, partnerName, projectTitle, partnerAvatar) {
  currentConversationId = conversationId;
  
  // Update UI
  document.getElementById('chat-partner-name').textContent = partnerName;
  document.getElementById('chat-partner-info').textContent = `Proyecto: ${projectTitle}`;
  
  // Show chat areas
  document.getElementById('chat-header').classList.remove('hidden');
  document.getElementById('chat-messages').classList.remove('hidden');
  document.getElementById('chat-input-area').classList.remove('hidden');
  document.getElementById('chat-empty-state').classList.add('hidden');
  
  // Load messages
  loadConversationMessages(conversationId);
  
  // Update conversations list styling
  renderConversationsListStyle();
}

function renderConversationsListStyle() {
  const conversations = document.querySelectorAll('#conversations-list > div');
  conversations.forEach(conv => {
    const convId = conv.getAttribute('onclick').match(/'([^']+)'/)[1];
    if (convId === currentConversationId) {
      conv.classList.add('bg-primary/10', 'border-primary');
      conv.classList.remove('border-gray-200');
    } else {
      conv.classList.remove('bg-primary/10', 'border-primary');
      conv.classList.add('border-gray-200');
    }
  });
}

async function loadConversationMessages(conversationId) {
  if (!authToken) {
    console.warn('Cannot load conversation messages: no auth token');
    return;
  }
  
  try {
    const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const messages = response.data.messages || [];
    renderConversationMessages(messages);
    
    // Mark messages as read
    await markMessagesAsRead(conversationId);
    
    // Update notification badge
    updateChatNotificationBadge();
    
  } catch (error) {
    console.error('Error loading messages:', error);
    document.getElementById('chat-messages').innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
        <p>Error loading messages</p>
      </div>
    `;
  }
}

function renderConversationMessages(messages) {
  const container = document.getElementById('chat-messages');
  
  if (messages.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-comments text-3xl mb-2"></i>
        <p>No messages in this conversation</p>
        <p class="text-sm mt-2">Send the first message to start</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = messages.map(msg => {
    const isOwnMessage = msg.sender_id === currentUser.id;
    return `
      <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3">
        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-primary text-white' 
            : 'bg-white border border-gray-200 text-gray-900'
        }">
          <p class="text-sm">${escapeHtml(msg.message)}</p>
          <p class="text-xs ${isOwnMessage ? 'text-primary-100' : 'text-gray-500'} mt-1">
            ${new Date(msg.created_at).toLocaleString('es-ES')}
          </p>
        </div>
      </div>
    `;
  }).join('');
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

async function sendCurrentChatMessage() {
  if (!authToken) {
    console.warn('Cannot send message: no auth token');
    return;
  }
  
  const input = document.getElementById('chat-message-input');
  const message = input.value.trim();
  
  if (!message || !currentConversationId) return;
  
  try {
    await axios.post(`/api/chat/conversations/${currentConversationId}/messages`, {
      message: message
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Clear input
    input.value = '';
    
    // Reload messages
    await loadConversationMessages(currentConversationId);
    
  } catch (error) {
    console.error('Error sending message:', error);
    showError('Error sending message');
  }
}

async function markMessagesAsRead(conversationId) {
  if (!authToken) {
    console.warn('Cannot mark messages as read: no auth token');
    return;
  }
  
  try {
    await axios.put(`/api/chat/conversations/${conversationId}/read`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

async function loadPendingRequests() {
  try {
    const chatRequestsData = await loadChatRequests();
    const requests = chatRequestsData.requests || [];
    
    if (requests.length > 0) {
      document.getElementById('chat-requests-section').classList.remove('hidden');
      renderPendingRequests(requests);
    } else {
      document.getElementById('chat-requests-section').classList.add('hidden');
    }
    
  } catch (error) {
    console.error('Error loading pending requests:', error);
  }
}

function renderPendingRequests(requests) {
  const container = document.getElementById('pending-requests-list');
  
  container.innerHTML = requests.map(request => `
    <div class="border border-gray-200 rounded-lg p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-medium text-gray-900">${escapeHtml(request.founder_name)}</h4>
          <p class="text-sm text-gray-600 mt-1">${escapeHtml(request.message)}</p>
          <p class="text-xs text-gray-500 mt-2">
            Project: ${escapeHtml(request.project_title)}
          </p>
          <p class="text-xs text-gray-500">
            ${new Date(request.created_at).toLocaleString('es-ES')}
          </p>
        </div>
        <div class="flex space-x-2 ml-4">
          <button onclick="acceptChatRequest('${request.id}')" 
                  class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition">
            Accept
          </button>
          <button onclick="rejectChatRequest('${request.id}')" 
                  class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition">
            Reject
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function updateChatNotificationBadge() {
  loadUnreadChatCount().then(count => {
    const badge = document.getElementById('chat-notification-badge');
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });
}

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', function() {
  const chatInput = document.getElementById('chat-message-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendCurrentChatMessage();
      }
    });
  }
});

// ============================================
// USER PROFILE MODAL
// ============================================

async function showValidatorProfile(userId) {
  if (!userId) {
    console.error('User ID is required');
    return;
  }

  try {
    // Fetch user profile with onboarding data
    const response = await axios.get(`/api/auth/user-profile/${userId}`);
    const profile = response.data;

    if (!profile) {
      showError('Profile not found');
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.style.display = 'flex';

    const onboardingHTML = renderOnboardingData(profile.onboarding, profile.role);

    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white sticky top-0 z-10">
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
              <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center text-primary text-3xl font-bold shadow-lg">
                ${profile.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 class="text-2xl font-bold">${escapeHtml(profile.name)}</h2>
                <p class="text-purple-100 text-sm mt-1">${escapeHtml(profile.email)}</p>
                <div class="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  ${getRoleLabel(profile.role)}
                </div>
              </div>
            </div>
            <button onclick="closeUserProfileModal()" class="text-white hover:text-purple-200 transition text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Basic Info -->
          ${profile.bio ? `
            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-user text-primary mr-2"></i>
                About
              </h3>
              <p class="text-gray-700">${escapeHtml(profile.bio)}</p>
            </div>
          ` : ''}

          ${profile.company ? `
            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-building text-primary mr-2"></i>
                Company
              </h3>
              <p class="text-gray-700">${escapeHtml(profile.company)}</p>
            </div>
          ` : ''}

          <!-- Onboarding Data -->
          ${onboardingHTML}

          <!-- Links -->
          ${(profile.linkedin_url || profile.twitter_url || profile.website_url) ? `
            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center">
                <i class="fas fa-link text-primary mr-2"></i>
                Links
              </h3>
              <div class="flex flex-wrap gap-3">
                ${profile.linkedin_url ? `
                  <a href="${escapeHtml(profile.linkedin_url)}" target="_blank" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2">
                    <i class="fab fa-linkedin"></i>
                    <span>LinkedIn</span>
                  </a>
                ` : ''}
                ${profile.twitter_url ? `
                  <a href="${escapeHtml(profile.twitter_url)}" target="_blank" class="bg-sky-400 text-white px-4 py-2 rounded-lg hover:bg-sky-500 transition flex items-center space-x-2">
                    <i class="fab fa-twitter"></i>
                    <span>Twitter</span>
                  </a>
                ` : ''}
                ${profile.website_url ? `
                  <a href="${escapeHtml(profile.website_url)}" target="_blank" class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center space-x-2">
                    <i class="fas fa-globe"></i>
                    <span>Website</span>
                  </a>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Member Since -->
          <div class="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            <i class="fas fa-calendar text-primary mr-1"></i>
            Member since ${new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeUserProfileModal();
      }
    });

  } catch (error) {
    console.error('Error loading user profile:', error);
    showError('Failed to load profile');
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
  if (!onboarding) {
    return '';
  }

  // Define field labels based on role
  const fieldLabels = {
    founder: {
      startup_name: { icon: 'fas fa-rocket', label: 'Startup Name' },
      startup_stage: { icon: 'fas fa-chart-line', label: 'Stage', formatter: formatStage },
      industry: { icon: 'fas fa-industry', label: 'Industry' },
      funding_status: { icon: 'fas fa-money-bill-wave', label: 'Funding Status', formatter: formatFundingStatus },
      funding_goal: { icon: 'fas fa-bullseye', label: 'Funding Goal', formatter: formatFundingGoal },
      team_size: { icon: 'fas fa-users', label: 'Team Size', formatter: formatTeamSize },
      pitch_deck_url: { icon: 'fas fa-file-powerpoint', label: 'Pitch Deck', formatter: formatURL }
    },
    investor: {
      investor_type: { icon: 'fas fa-briefcase', label: 'Investor Type', formatter: formatInvestorType },
      investment_stage: { icon: 'fas fa-seedling', label: 'Investment Stage', formatter: formatArray },
      check_size: { icon: 'fas fa-dollar-sign', label: 'Check Size', formatter: formatCheckSize },
      investment_focus: { icon: 'fas fa-bullseye', label: 'Investment Focus' },
      geographic_focus: { icon: 'fas fa-globe-americas', label: 'Geographic Focus' },
      notable_investments: { icon: 'fas fa-star', label: 'Notable Investments' }
    },
    validator: {
      expertise: { icon: 'fas fa-certificate', label: 'Expertise' },
      years_experience: { icon: 'fas fa-calendar-alt', label: 'Years of Experience' },
      hourly_rate: { icon: 'fas fa-dollar-sign', label: 'Hourly Rate', formatter: formatRate },
      availability: { icon: 'fas fa-clock', label: 'Availability', formatter: formatAvailability },
      portfolio_url: { icon: 'fas fa-briefcase', label: 'Portfolio', formatter: formatURL }
    },
    scout: {
      scout_for: { icon: 'fas fa-search', label: 'Scouting For' },
      scout_focus: { icon: 'fas fa-target', label: 'Focus Areas' },
      scout_commission: { icon: 'fas fa-percentage', label: 'Commission Structure', formatter: formatCommission },
      deals_closed: { icon: 'fas fa-handshake', label: 'Deals Closed', formatter: formatDeals }
    },
    partner: {
      partner_type: { icon: 'fas fa-handshake', label: 'Partner Type', formatter: formatPartnerType },
      services_offered: { icon: 'fas fa-cogs', label: 'Services Offered' },
      target_clients: { icon: 'fas fa-users', label: 'Target Clients', formatter: formatTargetClients },
      case_studies: { icon: 'fas fa-trophy', label: 'Case Studies' }
    },
    job_seeker: {
      job_title: { icon: 'fas fa-id-badge', label: 'Job Title' },
      experience_years: { icon: 'fas fa-calendar-check', label: 'Experience Level', formatter: formatExperience },
      skills: { icon: 'fas fa-code', label: 'Skills' },
      looking_for: { icon: 'fas fa-search', label: 'Looking For', formatter: formatArray },
      portfolio_url: { icon: 'fas fa-folder-open', label: 'Portfolio', formatter: formatURL }
    },
    other: {
      interests: { icon: 'fas fa-heart', label: 'Interests' },
      looking_for: { icon: 'fas fa-search', label: 'Looking For' },
      skills: { icon: 'fas fa-tools', label: 'Skills' }
    }
  };

  const fields = fieldLabels[role] || fieldLabels.other;
  const entries = Object.entries(onboarding).filter(([key]) => 
    fields[key] && onboarding[key] && onboarding[key] !== '' && key !== 'role' && key !== 'email' && key !== 'name'
  );

  if (entries.length === 0) {
    return '';
  }

  return `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
      <h3 class="font-bold text-gray-900 mb-4 flex items-center text-lg">
        <i class="fas fa-info-circle text-primary mr-2"></i>
        Profile Details
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${entries.map(([key, value]) => {
          const field = fields[key];
          if (!field) return '';
          
          const formattedValue = field.formatter 
            ? field.formatter(value) 
            : escapeHtml(String(value));
          
          return `
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="flex items-start space-x-3">
                <div class="text-primary mt-1">
                  <i class="${field.icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">${field.label}</p>
                  <p class="text-gray-900 font-medium break-words">${formattedValue}</p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Formatters for different field types
function formatStage(value) {
  const stages = {
    idea: '💡 Just an idea',
    mvp: '🛠️ Building MVP',
    early_revenue: '💰 Early revenue',
    scaling: '📈 Scaling',
    established: '🏢 Established'
  };
  return stages[value] || escapeHtml(value);
}

function formatFundingStatus(value) {
  const statuses = {
    bootstrapped: '🏠 Bootstrapped',
    pre_seed: '🌱 Pre-seed',
    seed: '🌿 Seed',
    series_a: '🚀 Series A',
    series_b_plus: '💫 Series B+'
  };
  return statuses[value] || escapeHtml(value);
}

function formatFundingGoal(value) {
  const goals = {
    under_100k: 'Under $100K',
    '100k_500k': '$100K - $500K',
    '500k_2m': '$500K - $2M',
    '2m_5m': '$2M - $5M',
    '5m_plus': '$5M+',
    not_fundraising: 'Not fundraising'
  };
  return goals[value] || escapeHtml(value);
}

function formatTeamSize(value) {
  const sizes = {
    solo: 'Just me (solo founder)',
    '2_5': '2-5 people',
    '6_10': '6-10 people',
    '11_25': '11-25 people',
    '25_plus': '25+ people'
  };
  return sizes[value] || escapeHtml(value);
}

function formatInvestorType(value) {
  const types = {
    angel: '👼 Angel Investor',
    vc: '🏢 VC Fund',
    corporate: '🏭 Corporate VC',
    family_office: '👨‍👩‍👧‍👦 Family Office'
  };
  return types[value] || escapeHtml(value);
}

function formatCheckSize(value) {
  const sizes = {
    '10k_50k': '$10K - $50K',
    '50k_250k': '$50K - $250K',
    '250k_1m': '$250K - $1M',
    '1m_5m': '$1M - $5M',
    '5m_plus': '$5M+'
  };
  return sizes[value] || escapeHtml(value);
}

function formatRate(value) {
  return value ? `$${value}/hour` : 'Free';
}

function formatAvailability(value) {
  const availabilities = {
    full_time: '⏰ Full-time',
    part_time: '⌚ Part-time',
    weekends: '📅 Weekends only',
    flexible: '🔄 Flexible'
  };
  return availabilities[value] || escapeHtml(value);
}

function formatCommission(value) {
  const types = {
    equity: 'Equity in deals',
    cash: 'Cash commission',
    hybrid: 'Hybrid (equity + cash)',
    not_specified: 'Prefer not to say'
  };
  return types[value] || escapeHtml(value);
}

function formatDeals(value) {
  const ranges = {
    '0': 'Just starting out',
    '1_5': '1-5 deals',
    '6_15': '6-15 deals',
    '15_plus': '15+ deals'
  };
  return ranges[value] || escapeHtml(value);
}

function formatPartnerType(value) {
  const types = {
    service_provider: '💼 Service Provider',
    distributor: '📦 Distributor',
    technology: '⚡ Technology Partner',
    strategic: '🎯 Strategic Partner'
  };
  return types[value] || escapeHtml(value);
}

function formatTargetClients(value) {
  const clients = {
    startups: '🚀 Startups',
    enterprises: '🏢 Enterprises',
    both: '🌐 Both'
  };
  return clients[value] || escapeHtml(value);
}

function formatExperience(value) {
  const levels = {
    entry: '< 1 year',
    junior: '1-3 years',
    mid: '3-5 years',
    senior: '5-10 years',
    expert: '10+ years'
  };
  return levels[value] || escapeHtml(value);
}

function formatArray(value) {
  if (Array.isArray(value)) {
    return value.map(v => `<span class="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-sm mr-1 mb-1">${escapeHtml(v)}</span>`).join('');
  }
  return escapeHtml(String(value));
}

function formatURL(value) {
  if (!value || value === 'none') return 'Not provided';
  return `<a href="${escapeHtml(value)}" target="_blank" class="text-primary hover:underline break-all">${escapeHtml(value)}</a>`;
}

function closeUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  if (modal) {
    modal.remove();
  }
}

// Export functions to window
window.loadChatInterface = loadChatInterface;
window.selectConversation = selectConversation;
window.sendChatMessage = sendCurrentChatMessage;
window.loadConversations = loadConversations;
window.showTab = showTab;
window.loginWithGoogle = loginWithGoogle;
window.showValidatorProfile = showValidatorProfile;
window.closeUserProfileModal = closeUserProfileModal;
