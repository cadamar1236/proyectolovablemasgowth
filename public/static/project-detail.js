// Load project details
async function loadProjectDetails() {
  try {
    const response = await axios.get(`/api/projects/${projectId}`);
    const data = response.data;
    
    renderProjectDetails(data);
  } catch (error) {
    console.error('Error loading project:', error);
    document.getElementById('project-details').innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-600">Error al cargar el proyecto</p>
      </div>
    `;
  }
}

// Render project details
function renderProjectDetails(data) {
  const { project, marketAnalysis, mvpPrototype, testResults, growthStrategies, metrics } = data;
  
  const container = document.getElementById('project-details');
  
  container.innerHTML = `
    <!-- Project Header -->
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">${escapeHtml(project.title)}</h1>
          <span class="px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(project.status)}">
            ${getStatusText(project.status)}
          </span>
        </div>
        <button onclick="window.print()" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
          <i class="fas fa-download mr-2"></i>Exportar Reporte
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Descripción</h3>
          <p class="text-gray-600">${escapeHtml(project.description)}</p>
        </div>
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Mercado Objetivo</h3>
          <p class="text-gray-600">${escapeHtml(project.target_market)}</p>
        </div>
        <div class="md:col-span-2">
          <h3 class="font-semibold text-gray-700 mb-2">Propuesta de Valor</h3>
          <p class="text-gray-600">${escapeHtml(project.value_proposition)}</p>
        </div>
      </div>
    </div>

    <!-- Metrics Dashboard -->
    ${metrics && metrics.length > 0 ? `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      ${renderMetricCard('Interés Validado', metrics.find(m => m.metric_type === 'interest')?.value || 0, '%', 'text-green-600', 'fas fa-heart')}
      ${renderMetricCard('Retención Usuarios', metrics.find(m => m.metric_type === 'retention')?.value || 0, '%', 'text-blue-600', 'fas fa-users')}
      ${renderMetricCard('CAC', metrics.find(m => m.metric_type === 'cac')?.value || 0, '$', 'text-purple-600', 'fas fa-dollar-sign')}
      ${renderMetricCard('Probabilidad de Éxito', metrics.find(m => m.metric_type === 'success_probability')?.value || 0, '%', 'text-yellow-600', 'fas fa-chart-line')}
    </div>
    ` : ''}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Market Analysis -->
      ${marketAnalysis ? `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center mb-6">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-chart-bar text-primary text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Análisis de Mercado</h2>
            <p class="text-sm text-gray-600">Powered by Cloudflare AI</p>
          </div>
        </div>
        
        <div class="space-y-6">
          <div>
            <h3 class="font-semibold text-gray-700 mb-2">Tamaño de Mercado</h3>
            <p class="text-2xl font-bold text-primary">${escapeHtml(marketAnalysis.market_size)}</p>
            <p class="text-sm text-gray-600">Crecimiento: ${escapeHtml(marketAnalysis.growth_rate)}</p>
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-700 mb-2">Probabilidad de Éxito</h3>
            <div class="flex items-center">
              <div class="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                <div class="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full" 
                     style="width: ${marketAnalysis.success_probability * 100}%"></div>
              </div>
              <span class="text-2xl font-bold text-green-600">${(marketAnalysis.success_probability * 100).toFixed(0)}%</span>
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Competidores Principales</h3>
            <div class="flex flex-wrap gap-2">
              ${marketAnalysis.competitors.map(comp => `
                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">${escapeHtml(comp)}</span>
              `).join('')}
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Tendencias de Mercado</h3>
            <ul class="space-y-2">
              ${marketAnalysis.market_trends.slice(0, 5).map(trend => `
                <li class="flex items-start">
                  <i class="fas fa-arrow-trend-up text-green-500 mt-1 mr-2"></i>
                  <span class="text-gray-700 text-sm">${escapeHtml(trend)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold text-green-600 mb-3">Oportunidades</h3>
              <ul class="space-y-2">
                ${marketAnalysis.opportunities.slice(0, 3).map(opp => `
                  <li class="text-sm text-gray-700 flex items-start">
                    <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    ${escapeHtml(opp)}
                  </li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-red-600 mb-3">Amenazas</h3>
              <ul class="space-y-2">
                ${marketAnalysis.threats.slice(0, 3).map(threat => `
                  <li class="text-sm text-gray-700 flex items-start">
                    <i class="fas fa-exclamation-triangle text-red-500 mt-1 mr-2"></i>
                    ${escapeHtml(threat)}
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
      ` : '<div class="bg-gray-100 rounded-xl p-8 text-center text-gray-600">Análisis de mercado no disponible</div>'}

      <!-- MVP Prototype -->
      ${mvpPrototype ? `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center mb-6">
          <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-code text-secondary text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Prototipo MVP</h2>
            <p class="text-sm text-gray-600">${escapeHtml(mvpPrototype.name)}</p>
          </div>
        </div>
        
        <div class="space-y-6">
          <div>
            <h3 class="font-semibold text-gray-700 mb-2">Descripción</h3>
            <p class="text-gray-600">${escapeHtml(mvpPrototype.description)}</p>
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Funcionalidades Core</h3>
            <ul class="space-y-2">
              ${mvpPrototype.features.map(feature => `
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                  <span class="text-gray-700 text-sm">${escapeHtml(feature)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Tech Stack Recomendado</h3>
            <div class="flex flex-wrap gap-2">
              ${mvpPrototype.tech_stack.map(tech => `
                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  ${escapeHtml(tech)}
                </span>
              `).join('')}
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <h3 class="font-semibold text-gray-700 mb-2">Tiempo Estimado</h3>
              <p class="text-xl font-bold text-primary">${escapeHtml(mvpPrototype.estimated_time)}</p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-700 mb-2">Costo Estimado</h3>
              <p class="text-xl font-bold text-secondary">${escapeHtml(mvpPrototype.estimated_cost)}</p>
            </div>
          </div>
          
          <button class="w-full bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-semibold">
            <i class="fas fa-rocket mr-2"></i>Solicitar Desarrollo
          </button>
        </div>
      </div>
      ` : '<div class="bg-gray-100 rounded-xl p-8 text-center text-gray-600">Prototipo MVP no disponible</div>'}
    </div>

    <!-- Test Results -->
    ${testResults && testResults.length > 0 ? `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div class="flex items-center mb-6">
        <div class="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mr-4">
          <i class="fas fa-user-check text-green-600 text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Resultados de Testing</h2>
          <p class="text-sm text-gray-600">${testResults.length} usuarios beta probaron tu producto</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${renderTestMetric('Rating Promedio', (testResults.reduce((sum, t) => sum + t.rating, 0) / testResults.length).toFixed(1), 'fas fa-star', 'text-yellow-600')}
        ${renderTestMetric('Pagarían', testResults.filter(t => t.would_pay).length, 'fas fa-dollar-sign', 'text-green-600')}
        ${renderTestMetric('Precio Sugerido', '$' + Math.round(testResults.reduce((sum, t) => sum + (t.suggested_price || 0), 0) / testResults.length), 'fas fa-tag', 'text-purple-600')}
        ${renderTestMetric('Total Feedback', testResults.length, 'fas fa-comments', 'text-blue-600')}
      </div>
      
      <div class="space-y-4">
        ${testResults.map(result => `
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3">
                  ${result.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">${escapeHtml(result.user_name)}</h4>
                  <p class="text-sm text-gray-600">${escapeHtml(result.user_role)}</p>
                </div>
              </div>
              <div class="flex items-center">
                ${Array(5).fill(0).map((_, i) => `
                  <i class="fas fa-star ${i < result.rating ? 'text-yellow-400' : 'text-gray-300'} text-sm"></i>
                `).join('')}
              </div>
            </div>
            <p class="text-gray-700 mb-2">${escapeHtml(result.feedback)}</p>
            <div class="flex items-center text-sm">
              <span class="px-2 py-1 rounded ${result.would_pay ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} mr-2">
                ${result.would_pay ? '✓ Pagaría' : '✗ No pagaría'}
              </span>
              ${result.suggested_price ? `<span class="text-gray-600">Precio sugerido: $${result.suggested_price}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Growth Strategies -->
    ${growthStrategies && growthStrategies.length > 0 ? `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div class="flex items-center mb-6">
        <div class="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mr-4">
          <i class="fas fa-chart-line text-purple-600 text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Estrategias de Crecimiento</h2>
          <p class="text-sm text-gray-600">Framework AARRR completo</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${growthStrategies.map(strategy => `
          <div class="border-2 ${getPriorityBorder(strategy.priority)} rounded-lg p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-2 inline-block">
                  ${escapeHtml(strategy.strategy_type)}
                </span>
                <h3 class="text-lg font-bold text-gray-900">${escapeHtml(strategy.title)}</h3>
              </div>
              <span class="px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(strategy.priority)}">
                ${strategy.priority.toUpperCase()}
              </span>
            </div>
            <p class="text-gray-600 mb-4 text-sm">${escapeHtml(strategy.description)}</p>
            
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Canales</h4>
              <div class="flex flex-wrap gap-2">
                ${strategy.channels.map(channel => `
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">${escapeHtml(channel)}</span>
                `).join('')}
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p class="text-xs text-gray-600 mb-1">CAC Estimado</p>
                <p class="font-bold text-primary">${escapeHtml(strategy.estimated_cac)}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600 mb-1">LTV Estimado</p>
                <p class="font-bold text-green-600">${escapeHtml(strategy.estimated_ltv)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="mt-6 text-center">
        <button class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:opacity-90 transition font-semibold">
          <i class="fas fa-rocket mr-2"></i>Implementar Estrategias de Growth
        </button>
      </div>
    </div>
    ` : ''}

    <!-- MVP Generator Section -->
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div class="flex items-center mb-6">
        <div class="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mr-4">
          <i class="fas fa-magic text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Generador Automático de MVPs</h2>
          <p class="text-sm text-gray-600">Genera código real y funcional con IA open source</p>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <h3 class="font-bold text-gray-900 mb-3">¿Qué obtendrás?</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start">
            <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
            <div>
              <p class="font-semibold text-gray-900">Código fuente completo</p>
              <p class="text-sm text-gray-600">Frontend + Backend listo para deployment</p>
            </div>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
            <div>
              <p class="font-semibold text-gray-900">Base de datos configurada</p>
              <p class="text-sm text-gray-600">Migraciones y modelos incluidos</p>
            </div>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
            <div>
              <p class="font-semibold text-gray-900">Deploy automático</p>
              <p class="text-sm text-gray-600">Listo para Cloudflare Pages</p>
            </div>
          </div>
          <div class="flex items-start">
            <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
            <div>
              <p class="font-semibold text-gray-900">Documentación completa</p>
              <p class="text-sm text-gray-600">README e instrucciones de setup</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-900">Selecciona un Template</h3>
          <button id="auto-detect-btn" onclick="autoDetectTemplate(${project.id})" 
                  class="text-primary hover:text-primary/80 text-sm font-semibold">
            <i class="fas fa-wand-magic mr-1"></i>Auto-detectar
          </button>
        </div>
        <div id="mvp-templates" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Templates will be loaded here -->
          <div class="text-center py-8 col-span-full">
            <i class="fas fa-spinner fa-spin text-primary text-2xl mb-2"></i>
            <p class="text-gray-600">Cargando templates...</p>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4">
        <button id="generate-mvp-btn" onclick="generateFullMVP(${project.id})" 
                class="flex-1 bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-lg hover:opacity-90 transition font-semibold text-lg">
          <i class="fas fa-rocket mr-2"></i>Generar MVP Completo
        </button>
        <button onclick="viewMVPDocs()" 
                class="bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 transition">
          <i class="fas fa-book mr-2"></i>Ver Docs
        </button>
      </div>
      
      <div class="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
        <p class="text-sm text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Nota:</strong> El generador usa modelos de IA open source (Llama 3.1) y plantillas optimizadas 
          para crear MVPs funcionales en minutos. El código generado es 100% tuyo.
        </p>
      </div>
    </div>

    <!-- Next Steps -->
    <div class="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg p-8 text-white">
      <h2 class="text-3xl font-bold mb-4">Próximos Pasos</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div class="text-4xl mb-3">🚀</div>
          <h3 class="text-xl font-bold mb-2">Desarrollar MVP</h3>
          <p class="text-purple-100">Solicita desarrollo del prototipo validado</p>
        </div>
        <div>
          <div class="text-4xl mb-3">📈</div>
          <h3 class="text-xl font-bold mb-2">Implementar Growth</h3>
          <p class="text-purple-100">Ejecuta estrategias de crecimiento</p>
        </div>
        <div>
          <div class="text-4xl mb-3">💰</div>
          <h3 class="text-xl font-bold mb-2">Buscar Funding</h3>
          <p class="text-purple-100">Presenta tu validación a inversores</p>
        </div>
      </div>
    </div>
  `;
}

// Helper function to render metric cards
function renderMetricCard(label, value, suffix, colorClass, icon) {
  return `
    <div class="bg-white rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-600 text-sm font-medium">${label}</span>
        <i class="${icon} ${colorClass}"></i>
      </div>
      <div class="text-3xl font-bold ${colorClass}">${value}${suffix}</div>
    </div>
  `;
}

// Helper function to render test metrics
function renderTestMetric(label, value, icon, colorClass) {
  return `
    <div class="bg-gray-50 rounded-lg p-4 text-center">
      <i class="${icon} ${colorClass} text-2xl mb-2"></i>
      <div class="text-2xl font-bold text-gray-900">${value}</div>
      <div class="text-sm text-gray-600">${label}</div>
    </div>
  `;
}

// Helper functions
function getPriorityColor(priority) {
  const colors = {
    'high': 'bg-red-100 text-red-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'low': 'bg-gray-100 text-gray-700'
  };
  return colors[priority] || colors['medium'];
}

function getPriorityBorder(priority) {
  const borders = {
    'high': 'border-red-300',
    'medium': 'border-yellow-300',
    'low': 'border-gray-300'
  };
  return borders[priority] || borders['medium'];
}

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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
loadProjectDetails();
