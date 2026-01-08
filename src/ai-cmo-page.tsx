/**
 * AI CMO Page - Gestión de imágenes de marketing generadas por IA
 * Permite ver, aprobar, rechazar y descargar imágenes generadas por fal.ai
 */

export function renderAICMOPage(user: any) {
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
      // AI CMO Page Logic
      (function() {
        let currentSection = 'pending';
        let generatedImages = [];

        // Load images on page load
        loadAICMOImages();

        window.showAICMOSection = function(section) {
          currentSection = section;
          
          // Update tabs
          ['pending', 'approved', 'rejected', 'history'].forEach(s => {
            const btn = document.getElementById(\`ai-cmo-\${s}-btn\`);
            const content = document.getElementById(\`ai-cmo-\${s}-content\`);
            
            if (s === section) {
              btn?.classList.remove('text-gray-500', 'border-transparent');
              btn?.classList.add('text-primary', 'border-primary', 'bg-primary/5');
              content?.classList.remove('hidden');
            } else {
              btn?.classList.remove('text-primary', 'border-primary', 'bg-primary/5');
              btn?.classList.add('text-gray-500', 'border-transparent');
              content?.classList.add('hidden');
            }
          });

          loadAICMOImages();
        };

        async function loadAICMOImages() {
          try {
            const response = await fetch('/api/ai-cmo/images', {
              headers: {
                'Authorization': \`Bearer \${localStorage.getItem('token')}\`
              }
            });

            if (!response.ok) throw new Error('Failed to load images');

            const data = await response.json();
            generatedImages = data.images || [];

            renderImages();
          } catch (error) {
            console.error('Error loading AI CMO images:', error);
            showEmptyState();
          }
        }

        function renderImages() {
          const filtered = generatedImages.filter(img => {
            if (currentSection === 'pending') return img.status === 'pending';
            if (currentSection === 'approved') return img.status === 'approved';
            if (currentSection === 'rejected') return img.status === 'rejected';
            return true; // history shows all
          });

          const gridId = currentSection === 'history' ? 'history-list' : \`\${currentSection}-images-grid\`;
          const emptyId = \`\${currentSection}-empty\`;
          const grid = document.getElementById(gridId);
          const empty = document.getElementById(emptyId);

          if (!grid) return;

          if (filtered.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            empty?.classList.remove('hidden');
            return;
          }

          grid.classList.remove('hidden');
          empty?.classList.add('hidden');

          if (currentSection === 'history') {
            grid.innerHTML = filtered.map(img => renderHistoryItem(img)).join('');
          } else {
            grid.innerHTML = filtered.map(img => renderImageCard(img)).join('');
          }
        }

        function renderImageCard(image) {
          return \`
            <div class="image-card">
              <img src="\${image.url}" alt="\${image.prompt || 'Generated image'}" />
              <div class="image-card-actions">
                \${image.status === 'pending' ? \`
                  <button onclick="approveImage('\${image.id}')" class="btn-approve">
                    <i class="fas fa-check mr-1"></i> Aprobar
                  </button>
                  <button onclick="rejectImage('\${image.id}')" class="btn-reject">
                    <i class="fas fa-times mr-1"></i> Rechazar
                  </button>
                \` : ''}
                \${image.status === 'approved' ? \`
                  <button onclick="downloadImage('\${image.url}', '\${image.id}')" class="btn-download">
                    <i class="fas fa-download mr-1"></i> Descargar
                  </button>
                \` : ''}
                \${image.status === 'rejected' ? \`
                  <button onclick="regenerateImage('\${image.id}')" class="btn-regenerate">
                    <i class="fas fa-redo mr-1"></i> Regenerar
                  </button>
                \` : ''}
              </div>
              <div class="px-4 pb-4">
                <p class="text-sm text-gray-600 line-clamp-2">\${image.prompt || 'Sin prompt'}</p>
                <p class="text-xs text-gray-400 mt-2">\${new Date(image.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          \`;
        }

        function renderHistoryItem(image) {
          const statusColors = {
            pending: 'text-yellow-600 bg-yellow-50',
            approved: 'text-green-600 bg-green-50',
            rejected: 'text-red-600 bg-red-50'
          };

          return \`
            <div class="bg-white rounded-lg p-4 flex gap-4 shadow-sm">
              <img src="\${image.url}" alt="Generated" class="w-24 h-24 rounded object-cover" />
              <div class="flex-1">
                <p class="text-sm text-gray-800 mb-1">\${image.prompt || 'Sin prompt'}</p>
                <span class="inline-block px-2 py-1 text-xs font-semibold rounded \${statusColors[image.status] || 'text-gray-600 bg-gray-50'}">
                  \${image.status === 'pending' ? 'Pendiente' : image.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                </span>
                <p class="text-xs text-gray-400 mt-2">\${new Date(image.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          \`;
        }

        function showEmptyState() {
          const emptyId = \`\${currentSection}-empty\`;
          const gridId = currentSection === 'history' ? 'history-list' : \`\${currentSection}-images-grid\`;
          
          document.getElementById(gridId)?.classList.add('hidden');
          document.getElementById(emptyId)?.classList.remove('hidden');
        }

        window.approveImage = async function(imageId) {
          try {
            const response = await fetch(\`/api/ai-cmo/images/\${imageId}/approve\`, {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${localStorage.getItem('token')}\`
              }
            });

            if (!response.ok) throw new Error('Failed to approve image');

            await loadAICMOImages();
          } catch (error) {
            console.error('Error approving image:', error);
            alert('Error al aprobar la imagen');
          }
        };

        window.rejectImage = async function(imageId) {
          try {
            const response = await fetch(\`/api/ai-cmo/images/\${imageId}/reject\`, {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${localStorage.getItem('token')}\`
              }
            });

            if (!response.ok) throw new Error('Failed to reject image');

            await loadAICMOImages();
          } catch (error) {
            console.error('Error rejecting image:', error);
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
            a.download = \`marketing-image-\${imageId}.png\`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (error) {
            console.error('Error downloading image:', error);
            alert('Error al descargar la imagen');
          }
        };

        window.regenerateImage = async function(imageId) {
          try {
            const response = await fetch(\`/api/ai-cmo/images/\${imageId}/regenerate\`, {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${localStorage.getItem('token')}\`
              }
            });

            if (!response.ok) throw new Error('Failed to regenerate image');

            await loadAICMOImages();
            showAICMOSection('pending');
          } catch (error) {
            console.error('Error regenerating image:', error);
            alert('Error al regenerar la imagen');
          }
        };
      })();
    </script>
  `;
}
