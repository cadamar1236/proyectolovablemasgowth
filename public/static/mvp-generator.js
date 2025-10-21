// MVP Generator Interface

let selectedTemplate = null;
let availableTemplates = [];

// Load templates on page load
async function loadMVPTemplates() {
  try {
    const response = await axios.get('/api/mvp/templates');
    availableTemplates = response.data.templates;
    renderTemplates();
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

// Render available templates
function renderTemplates() {
  const container = document.getElementById('mvp-templates');
  
  if (!container) return;
  
  container.innerHTML = availableTemplates.map(template => `
    <div class="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition border-2 ${
      selectedTemplate === template.id ? 'border-primary' : 'border-transparent'
    }" onclick="selectTemplate('${template.id}')">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">${template.name}</h3>
          <p class="text-gray-600 text-sm">${template.description}</p>
        </div>
        ${selectedTemplate === template.id ? '<i class="fas fa-check-circle text-primary text-2xl"></i>' : ''}
      </div>
      
      <div class="mb-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Tech Stack:</h4>
        <div class="flex flex-wrap gap-2">
          ${template.stack.map(tech => `
            <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
              ${tech}
            </span>
          `).join('')}
        </div>
      </div>
      
      <div class="text-sm text-gray-600">
        <i class="fas fa-file-code mr-2"></i>${template.files.length} archivos generados
      </div>
    </div>
  `).join('');
}

// Select template
function selectTemplate(templateId) {
  selectedTemplate = templateId;
  renderTemplates();
}

// Auto-detect best template for project
async function autoDetectTemplate(projectId) {
  const btn = document.getElementById('auto-detect-btn');
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analizando...';
    btn.disabled = true;
  }
  
  try {
    const response = await axios.post('/api/mvp/detect-template', { projectId });
    selectedTemplate = response.data.recommended_template;
    renderTemplates();
    
    // Show recommendation
    showNotification(
      `Recomendamos el template: ${response.data.template_info.name}`,
      'success'
    );
    
  } catch (error) {
    console.error('Error detecting template:', error);
    showNotification('Error al detectar template', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

// Generate full MVP
async function generateFullMVP(projectId) {
  if (!selectedTemplate) {
    showNotification('Por favor selecciona un template', 'warning');
    return;
  }
  
  const btn = document.getElementById('generate-mvp-btn');
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando MVP...';
    btn.disabled = true;
  }
  
  // Show progress modal
  showProgressModal();
  
  try {
    // Step 1: Generate code
    updateProgress(25, 'Generando código con IA...');
    const response = await axios.post('/api/mvp/generate-full', {
      projectId,
      template: selectedTemplate
    });
    
    // Step 2: Files generated
    updateProgress(50, 'Archivos generados exitosamente...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Preparing deployment
    updateProgress(75, 'Preparando estructura de deployment...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Complete
    updateProgress(100, '¡MVP generado exitosamente!');
    
    // Show results
    setTimeout(() => {
      hideProgressModal();
      showMVPResults(response.data);
    }, 1500);
    
  } catch (error) {
    console.error('Error generating MVP:', error);
    hideProgressModal();
    showNotification('Error al generar MVP', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

// Show progress modal
function showProgressModal() {
  const modal = document.createElement('div');
  modal.id = 'progress-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-code text-white text-2xl"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Generando tu MVP</h3>
        <p id="progress-text" class="text-gray-600">Iniciando generación...</p>
      </div>
      
      <div class="mb-4">
        <div class="w-full bg-gray-200 rounded-full h-4">
          <div id="progress-bar" class="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="text-center">
        <span id="progress-percent" class="text-3xl font-bold text-primary">0%</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Update progress
function updateProgress(percent, text) {
  const bar = document.getElementById('progress-bar');
  const percentEl = document.getElementById('progress-percent');
  const textEl = document.getElementById('progress-text');
  
  if (bar) bar.style.width = `${percent}%`;
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (textEl) textEl.textContent = text;
}

// Hide progress modal
function hideProgressModal() {
  const modal = document.getElementById('progress-modal');
  if (modal) modal.remove();
}

// Show MVP results
function showMVPResults(data) {
  const modal = document.createElement('div');
  modal.id = 'results-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-8 max-w-4xl w-full my-8">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h3 class="text-3xl font-bold text-gray-900 mb-2">🎉 ¡MVP Generado!</h3>
          <p class="text-gray-600">Tu MVP está listo para deployment</p>
        </div>
        <button onclick="closeResultsModal()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
        <h4 class="font-bold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-file-code text-primary mr-2"></i>
          Archivos Generados (${Object.keys(data.files).length})
        </h4>
        <div class="grid grid-cols-2 gap-2 mb-4">
          ${Object.keys(data.files).slice(0, 8).map(file => `
            <div class="bg-white rounded px-3 py-2 text-sm font-mono text-gray-700">
              <i class="fas fa-file mr-2 text-gray-400"></i>${file}
            </div>
          `).join('')}
          ${Object.keys(data.files).length > 8 ? `
            <div class="col-span-2 text-center text-gray-600 text-sm">
              + ${Object.keys(data.files).length - 8} archivos más...
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-3">Próximos Pasos:</h4>
        <div class="space-y-3">
          ${data.next_steps.map((step, i) => `
            <div class="flex items-start">
              <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                ${i + 1}
              </div>
              <p class="text-gray-700 pt-1">${step}</p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onclick="downloadMVPCode(${data.deployment.projectId || 'null'})" 
                class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold">
          <i class="fas fa-download mr-2"></i>Descargar Código
        </button>
        <button onclick="viewMVPCode()" 
                class="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition font-semibold">
          <i class="fas fa-eye mr-2"></i>Ver Código
        </button>
      </div>
      
      <div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <p class="text-sm text-yellow-800">
          <i class="fas fa-lightbulb mr-2"></i>
          <strong>Tip:</strong> Este MVP es completamente funcional y listo para deployment en Cloudflare Pages. 
          Solo necesitas crear un repositorio en GitHub y conectarlo.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Close results modal
function closeResultsModal() {
  const modal = document.getElementById('results-modal');
  if (modal) modal.remove();
}

// Download MVP code
async function downloadMVPCode(projectId) {
  try {
    const response = await axios.get(`/api/mvp/download/${projectId}`);
    
    // Create a downloadable JSON file with all code
    const dataStr = JSON.stringify(response.data.files, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mvp-code-${projectId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showNotification('Código descargado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error downloading code:', error);
    showNotification('Error al descargar código', 'error');
  }
}

// View MVP code in modal
function viewMVPCode() {
  showNotification('Visualizador de código próximamente', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('opacity-0');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMVPTemplates);
} else {
  loadMVPTemplates();
}
