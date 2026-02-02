// ASTAR* Platform - Frontend para Vercel + Railway Backend
// API Base URL - apunta al backend de Railway
const API_BASE_URL = 'https://proyectolovablemasgowth-production-813a.up.railway.app';

// Global state
let currentUser = { id: 1, name: 'Juan Founder', plan: 'pro' };
let projects = [];
let betaUsers = [];
let authToken = null;

// Initialize authToken from localStorage or cookie
function initAuthToken() {
  // Try localStorage first
  authToken = localStorage.getItem('authToken');
  
  // If not in localStorage, check cookie
  if (!authToken) {
    const cookieMatch = document.cookie.match(/authToken=([^;]+)/);
    if (cookieMatch) {
      authToken = cookieMatch[1];
      // Sync to localStorage
      localStorage.setItem('authToken', authToken);
    }
  }
  
  return authToken;
}

// Load current user
async function loadCurrentUser() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    currentUser = response.data.user;
    
  } catch (error) {
    console.error('Failed to load user:', error);
    authToken = null;
    localStorage.removeItem('authToken');
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the marketplace page
  if (window.location.pathname.startsWith('/marketplace')) {
    return; // Don't initialize app.js on marketplace
  }
  
  // Initialize auth token
  initAuthToken();
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
  
  const formSection = document.getElementById('validation-form-section');
  const projectsSection = document.getElementById('projects-section');

  formSection.classList.remove('hidden');
  projectsSection.classList.add('hidden');

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
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
        <h2 class="text-2xl font-bold text-center">Únete a ASTAR*</h2>
        <p class="text-center text-purple-100 mt-2">Regístrate gratis y valida tu idea</p>
      </div>
      
      <!-- Form -->
      <div class="p-6">
        <form id="auth-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" id="auth-name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="auth-email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" id="auth-password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
          </div>
          
          <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
            Crear cuenta gratis
          </button>
        </form>
        
        <div class="mt-4 text-center">
          <p class="text-gray-600">¿Ya tienes cuenta? 
            <button onclick="switchToLogin()" class="text-purple-600 hover:underline font-medium">Inicia sesión</button>
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
  
  title.textContent = 'Inicia sesión';
  subtitle.textContent = 'Accede a tu cuenta de ASTAR*';
  submitBtn.textContent = 'Iniciar sesión';
  
  const nameField = modal.querySelector('#auth-name').parentElement;
  nameField.style.display = 'none';
  
  switchText.innerHTML = '¿No tienes cuenta? <button onclick="switchToRegister()" class="text-purple-600 hover:underline font-medium">Regístrate</button>';
  
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
  
  title.textContent = 'Únete a ASTAR*';
  subtitle.textContent = 'Regístrate gratis y valida tu idea';
  submitBtn.textContent = 'Crear cuenta gratis';
  
  const nameField = modal.querySelector('#auth-name').parentElement;
  nameField.style.display = 'block';
  
  switchText.innerHTML = '¿Ya tienes cuenta? <button onclick="switchToLogin()" class="text-purple-600 hover:underline font-medium">Inicia sesión</button>';
  
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
      response = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password });
    } else {
      response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
    }
    
    authToken = response.data.token;
    localStorage.setItem('authToken', authToken);
    
    await loadCurrentUser();
    
    closeAuthModal();
    
    const modal = document.getElementById('auth-modal');
    const redirectTo = modal?.dataset.redirectTo;
    
    if (redirectTo === 'validation') {
      showValidationForm();
    } else {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('Auth error:', error);
    alert('Error: ' + (error.response?.data?.error || 'Error de autenticación'));
  }
}

// Check if user is authenticated
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
    const response = await axios.post(`${API_BASE_URL}/api/projects`, {
      title,
      description,
      target_market,
      value_proposition
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const projectId = response.data.id;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analizando mercado con IA...';
    await axios.post(`${API_BASE_URL}/api/validation/analyze`, { projectId }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando prototipo MVP...';
    await axios.post(`${API_BASE_URL}/api/validation/generate-mvp`, { projectId }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando estrategias de crecimiento...';
    await axios.post(`${API_BASE_URL}/api/validation/generate-growth`, { projectId }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    alert('¡Validación completada! Redirigiendo al proyecto...');
    
    window.location.href = `/project.html?id=${projectId}`;
    
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
    const response = await axios.get(`${API_BASE_URL}/api/projects`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
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
        <button onclick="showValidationForm()" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
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
        <span class="text-purple-600 hover:text-purple-800 cursor-pointer" onclick="window.location.href='/project.html?id=${project.id}'">Ver detalles <i class="fas fa-arrow-right ml-1"></i></span>
      </div>
    </div>
  `).join('');
}

// Load beta users
async function loadBetaUsers() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/beta-users`);
    betaUsers = response.data.betaUsers || [];
    renderBetaUsers();
  } catch (error) {
    console.error('Error loading beta users:', error);
  }
}

// Render beta users
function renderBetaUsers() {
  const grid = document.getElementById('beta-users-grid');
  
  if (!grid) return;
  
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
        <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
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
        <div><i class="fas fa-briefcase w-5 text-purple-600"></i>${escapeHtml(user.industry)}</div>
        <div><i class="fas fa-user w-5 text-purple-600"></i>${user.age} años</div>
      </div>
      <p class="text-sm text-gray-700 mb-4 line-clamp-2">${escapeHtml(user.bio)}</p>
      <button class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm">
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

function logout() {
  if (confirm('¿Seguro que quieres cerrar sesión?')) {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    location.reload();
  }
}

// Show notification toast
function showNotification(message, type = 'success') {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 max-w-md ${
    type === 'success' 
      ? 'bg-green-500 text-white' 
      : 'bg-red-500 text-white'
  }`;
  toast.style.transform = 'translateX(400px)';
  toast.innerHTML = `
    <div class="flex items-center space-x-3">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl"></i>
      <span class="font-medium">${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
