// Global state
let currentUser = { id: 1, name: 'Juan Founder', plan: 'pro' };
let projects = [];
let betaUsers = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
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
  const formSection = document.getElementById('validation-form-section');
  const projectsSection = document.getElementById('projects-section');
  
  formSection.classList.remove('hidden');
  projectsSection.classList.add('hidden');
  
  // Scroll to form
  formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideValidationForm() {
  const formSection = document.getElementById('validation-form-section');
  const projectsSection = document.getElementById('projects-section');
  
  formSection.classList.add('hidden');
  projectsSection.classList.remove('hidden');
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
    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer" 
         onclick="window.location.href='/project/${project.id}'">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-gray-900">${escapeHtml(project.title)}</h3>
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}">
          ${getStatusText(project.status)}
        </span>
      </div>
      <p class="text-gray-600 mb-4 line-clamp-2">${escapeHtml(project.description)}</p>
      <div class="flex items-center justify-between text-sm text-gray-500">
        <span><i class="far fa-calendar mr-2"></i>${formatDate(project.created_at)}</span>
        <span class="text-primary hover:text-primary/80">Ver detalles <i class="fas fa-arrow-right ml-1"></i></span>
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
