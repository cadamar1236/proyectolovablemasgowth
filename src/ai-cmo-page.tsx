/**
 * AI CMO Page - Gestión de imágenes de marketing generadas por IA
 * Permite ver, aprobar, rechazar y descargar imágenes generadas por fal.ai
 */

export function renderAICMOPage(user: any) {
  // Make it globally available
  if (typeof window !== 'undefined') {
    (window as any).renderAICMOPage = renderAICMOPage;
  }
  
  return `
    <div class="ai-cmo-page p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">AI CMO</h1>
        <p class="text-gray-600">Gestiona el contenido de marketing generado por IA</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6 border-b border-gray-200">
        <button onclick="showAICMOSection('pending')" id="ai-cmo-pending-btn" class="px-4 py-3 text-sm font-semibold text-primary border-b-2 border-primary bg-primary/5">
          <i class="fas fa-clock mr-2"></i>
          Pendientes
        </button>
        <button onclick="showAICMOSection('approved')" id="ai-cmo-approved-btn" class="px-4 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:bg-gray-50">
          <i class="fas fa-check-circle mr-2"></i>
          Aprobadas
        </button>
        <button onclick="showAICMOSection('rejected')" id="ai-cmo-rejected-btn" class="px-4 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:bg-gray-50">
          <i class="fas fa-times-circle mr-2"></i>
          Rechazadas
        </button>
        <button onclick="showAICMOSection('history')" id="ai-cmo-history-btn" class="px-4 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:bg-gray-50">
          <i class="fas fa-history mr-2"></i>
          Historial
        </button>
      </div>

      <!-- Content Sections -->
      <div id="ai-cmo-pending-content" class="ai-cmo-section">
        <div id="pending-images-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Images will be loaded here -->
        </div>
        <div id="pending-empty" class="hidden text-center py-12 text-gray-400">
          <i class="fas fa-image text-6xl mb-4"></i>
          <p class="text-lg">No hay imágenes pendientes</p>
          <p class="text-sm mt-2">Las imágenes generadas por el AI Brand Marketing Agent aparecerán aquí</p>
        </div>
      </div>

      <div id="ai-cmo-approved-content" class="ai-cmo-section hidden">
        <div id="approved-images-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Approved images will be loaded here -->
        </div>
        <div id="approved-empty" class="hidden text-center py-12 text-gray-400">
          <i class="fas fa-check-circle text-6xl mb-4"></i>
          <p class="text-lg">No hay imágenes aprobadas</p>
        </div>
      </div>

      <div id="ai-cmo-rejected-content" class="ai-cmo-section hidden">
        <div id="rejected-images-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Rejected images will be loaded here -->
        </div>
        <div id="rejected-empty" class="hidden text-center py-12 text-gray-400">
          <i class="fas fa-times-circle text-6xl mb-4"></i>
          <p class="text-lg">No hay imágenes rechazadas</p>
        </div>
      </div>

      <div id="ai-cmo-history-content" class="ai-cmo-section hidden">
        <div id="history-list" class="space-y-4">
          <!-- History will be loaded here -->
        </div>
        <div id="history-empty" class="hidden text-center py-12 text-gray-400">
          <i class="fas fa-history text-6xl mb-4"></i>
          <p class="text-lg">No hay historial</p>
        </div>
      </div>
    </div>

    <style>
      .ai-cmo-page {
        max-width: 1400px;
        margin: 0 auto;
      }

      .image-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .image-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .image-card img {
        width: 100%;
        height: 250px;
        object-fit: cover;
      }

      .image-card-actions {
        padding: 16px;
        display: flex;
        gap: 8px;
      }

      .image-card-actions button {
        flex: 1;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-approve {
        background: #10b981;
        color: white;
      }

      .btn-approve:hover {
        background: #059669;
      }

      .btn-reject {
        background: #ef4444;
        color: white;
      }

      .btn-reject:hover {
        background: #dc2626;
      }

      .btn-download {
        background: #3b82f6;
        color: white;
      }

      .btn-download:hover {
        background: #2563eb;
      }

      .btn-regenerate {
        background: #f59e0b;
        color: white;
      }

      .btn-regenerate:hover {
        background: #d97706;
      }
    </style>

    <script>
      // AI CMO Page Logic - Make functions global immediately
      window.showAICMOSection = function(section) {
        const currentSection = section;
        
        // Update tabs
        ['pending', 'approved', 'rejected', 'history'].forEach(function(s) {
          const btn = document.getElementById('ai-cmo-' + s + '-btn');
          const content = document.getElementById('ai-cmo-' + s + '-content');
          
          if (s === section) {
            if (btn) {
              btn.classList.remove('text-gray-500', 'border-transparent');
              btn.classList.add('text-primary', 'border-primary', 'bg-primary/5');
            }
            if (content) content.classList.remove('hidden');
          } else {
            if (btn) {
              btn.classList.remove('text-primary', 'border-primary', 'bg-primary/5');
              btn.classList.add('text-gray-500', 'border-transparent');
            }
            if (content) content.classList.add('hidden');
          }
        });

        window.loadAICMOImages(section);
      };

      window.loadAICMOImages = async function(section) {
        section = section || 'pending';
        try {
          const token = document.cookie.match(/authToken=([^;]+)/);
          const authToken = token ? token[1] : localStorage.getItem('authToken');
          
          const response = await fetch('/api/ai-cmo/images', {
            headers: {
              'Authorization': 'Bearer ' + authToken
            }
          });

          if (!response.ok) throw new Error('Failed to load images');

          const data = await response.json();
          const images = data.images || [];

          // Filter by section
          const filtered = images.filter(function(img) {
            if (section === 'pending') return img.status === 'pending';
            if (section === 'approved') return img.status === 'approved';
            if (section === 'rejected') return img.status === 'rejected';
            return true; // history shows all
          });

          const gridId = section === 'history' ? 'history-list' : section + '-images-grid';
          const emptyId = section + '-empty';
          const grid = document.getElementById(gridId);
          const empty = document.getElementById(emptyId);

          if (!grid) return;

          if (filtered.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            if (empty) empty.classList.remove('hidden');
            return;
          }

          grid.classList.remove('hidden');
          if (empty) empty.classList.add('hidden');

          if (section === 'history') {
            grid.innerHTML = filtered.map(function(img) {
              var statusColors = {
                pending: 'text-yellow-600 bg-yellow-50',
                approved: 'text-green-600 bg-green-50',
                rejected: 'text-red-600 bg-red-50'
              };
              var statusText = img.status === 'pending' ? 'Pendiente' : img.status === 'approved' ? 'Aprobada' : 'Rechazada';
              return '<div class="bg-white rounded-lg p-4 flex gap-4 shadow-sm">' +
                '<img src="' + img.image_url + '" alt="Generated" class="w-24 h-24 rounded object-cover" onerror="this.src=\\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No img</text></svg>\\'" />' +
                '<div class="flex-1">' +
                '<p class="text-sm text-gray-800 mb-1">' + (img.prompt || 'Sin prompt') + '</p>' +
                '<span class="inline-block px-2 py-1 text-xs font-semibold rounded ' + (statusColors[img.status] || 'text-gray-600 bg-gray-50') + '">' + statusText + '</span>' +
                '<p class="text-xs text-gray-400 mt-2">' + new Date(img.created_at).toLocaleDateString() + '</p>' +
                '</div></div>';
            }).join('');
          } else {
            grid.innerHTML = filtered.map(function(img) {
              var actions = '';
              if (img.status === 'pending') {
                actions = '<button onclick="approveImage(\\'' + img.id + '\\')" class="btn-approve"><i class="fas fa-check mr-1"></i> Aprobar</button>' +
                          '<button onclick="rejectImage(\\'' + img.id + '\\')" class="btn-reject"><i class="fas fa-times mr-1"></i> Rechazar</button>';
              } else if (img.status === 'approved') {
                actions = '<button onclick="downloadImage(\\'' + img.image_url + '\\', \\'' + img.id + '\\')" class="btn-download"><i class="fas fa-download mr-1"></i> Descargar</button>';
              } else if (img.status === 'rejected') {
                actions = '<button onclick="regenerateImage(\\'' + img.id + '\\')" class="btn-regenerate"><i class="fas fa-redo mr-1"></i> Regenerar</button>';
              }
              return '<div class="image-card">' +
                '<img src="' + img.image_url + '" alt="' + (img.prompt || 'Generated image') + '" onerror="this.src=\\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No img</text></svg>\\'" />' +
                '<div class="image-card-actions">' + actions + '</div>' +
                '<div class="px-4 pb-4">' +
                '<p class="text-sm text-gray-600 line-clamp-2">' + (img.prompt || 'Sin prompt') + '</p>' +
                '<p class="text-xs text-gray-400 mt-2">' + new Date(img.created_at).toLocaleDateString() + '</p>' +
                '</div></div>';
            }).join('');
          }
        } catch (error) {
          console.error('Error loading AI CMO images:', error);
        }
      };

      window.approveImage = async function(imageId) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/);
          const authToken = token ? token[1] : localStorage.getItem('authToken');
          
          const response = await fetch('/api/ai-cmo/images/' + imageId + '/approve', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          if (!response.ok) throw new Error('Failed');
          window.loadAICMOImages('pending');
        } catch (error) {
          console.error('Error:', error);
          alert('Error al aprobar la imagen');
        }
      };

      window.rejectImage = async function(imageId) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/);
          const authToken = token ? token[1] : localStorage.getItem('authToken');
          
          const response = await fetch('/api/ai-cmo/images/' + imageId + '/reject', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          if (!response.ok) throw new Error('Failed');
          window.loadAICMOImages('pending');
        } catch (error) {
          console.error('Error:', error);
          alert('Error al rechazar la imagen');
        }
      };

      window.downloadImage = async function(imageUrl, imageId) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'marketing-image-' + imageId + '.png';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error('Error:', error);
          alert('Error al descargar la imagen');
        }
      };

      window.regenerateImage = async function(imageId) {
        try {
          const token = document.cookie.match(/authToken=([^;]+)/);
          const authToken = token ? token[1] : localStorage.getItem('authToken');
          
          const response = await fetch('/api/ai-cmo/images/' + imageId + '/regenerate', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          if (!response.ok) throw new Error('Failed');
          window.loadAICMOImages('pending');
        } catch (error) {
          console.error('Error:', error);
          alert('Error al regenerar la imagen');
        }
      };

      // Auto-load images when page loads
      if (document.getElementById('pending-images-grid')) {
        window.loadAICMOImages('pending');
      }
    </script>
  `;
}
