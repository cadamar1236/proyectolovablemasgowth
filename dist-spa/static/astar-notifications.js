// ASTAR Notifications Banner
(function() {
  console.log('[ASTAR] Initializing notifications system...');
  
  // Get auth token
  function getAuthToken() {
    const cookieMatch = document.cookie.match(/authToken=([^;]+)/);
    return cookieMatch ? cookieMatch[1] : localStorage.getItem('authToken');
  }
  
  // Load pending ASTAR messages
  async function loadAstarNotifications() {
    const token = getAuthToken();
    if (!token) {
      console.log('[ASTAR] No auth token found, skipping notifications');
      return;
    }
    
    try {
      console.log('[ASTAR] Fetching pending messages...');
      const response = await fetch('/api/astar-messages/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('[ASTAR] Response status:', response.status);
      
      if (!response.ok) {
        console.error('[ASTAR] Failed to fetch messages:', response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('[ASTAR] Messages received:', data);
      
      if (data.pending && data.pending.length > 0) {
        console.log('[ASTAR] Showing', data.pending.length, 'notifications');
        showNotificationBanner(data.pending);
      } else {
        console.log('[ASTAR] No pending messages');
      }
    } catch (error) {
      console.error('[ASTAR] Error loading notifications:', error);
    }
  }
  
  // Show notification banner
  function showNotificationBanner(messages) {
    // Find the main content area
    const mainContent = document.querySelector('main') || document.querySelector('.max-w-7xl') || document.body;
    
    if (!mainContent) {
      console.error('[ASTAR] Could not find main content area');
      return;
    }
    
    // Create banner HTML
    const banner = document.createElement('div');
    banner.id = 'astar-notification-banner';
    banner.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4';
    banner.innerHTML = `
      <div class="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl shadow-2xl p-6 border-2 border-purple-500">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">🌟</span>
            <h2 class="text-white text-xl font-bold">ASTAR te pregunta...</h2>
            <span class="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              ${messages.length} mensaje${messages.length > 1 ? 's' : ''}
            </span>
          </div>
          <button onclick="document.getElementById('astar-notification-banner').remove()" class="text-gray-300 hover:text-white text-xl">
            ✕
          </button>
        </div>
        ${messages.map(msg => `
          <div class="bg-gray-900 bg-opacity-50 rounded-lg p-4 mb-4 border-l-4 border-purple-500">
            <div class="text-white mb-3">
              <div class="text-lg font-bold mb-2">${escapeHtml(msg.subject)}</div>
              <div class="text-sm text-gray-300 mb-3">
                ${new Date(msg.sent_at).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div class="text-base text-gray-200 mb-4">${escapeHtml(msg.response_prompt)}</div>
            </div>
            <textarea 
              id="astar-response-${msg.sent_message_id}" 
              placeholder="Escribe tu respuesta aquí..." 
              class="w-full min-h-[100px] p-3 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm resize-vertical mb-3"
            ></textarea>
            <button 
              onclick="window.submitAstarResponse(${msg.sent_message_id})" 
              class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition shadow-lg"
            >
              📤 Enviar Respuesta
            </button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Insert banner
    document.body.appendChild(banner);
    console.log('[ASTAR] Banner displayed');
  }
  
  // Submit response
  window.submitAstarResponse = async function(messageId) {
    const textarea = document.getElementById(`astar-response-${messageId}`);
    const response = textarea ? textarea.value.trim() : '';
    
    if (!response) {
      alert('Por favor escribe una respuesta');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      alert('Sesión expirada. Por favor recarga la página.');
      return;
    }
    
    try {
      console.log('[ASTAR] Submitting response for message', messageId);
      const res = await fetch('/api/astar-messages/respond', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          sent_message_id: messageId,
          response_text: response
        })
      });
      
      if (res.ok) {
        alert('¡Respuesta enviada! 🎉');
        document.getElementById('astar-notification-banner')?.remove();
        // Reload to refresh any goals that were created
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await res.json();
        alert('Error: ' + (error.error || 'No se pudo enviar la respuesta'));
      }
    } catch (error) {
      console.error('[ASTAR] Error submitting response:', error);
      alert('Error al enviar respuesta');
    }
  };

  // Trigger test message
  window.requestAstarTest = async function() {
    try {
      console.log('[ASTAR] Requesting test message...');
      const response = await fetch('/api/astar-messages/cron/test-email', {
        method: 'POST'
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log('[ASTAR] Test message sent:', data);
        alert('Mensaje de prueba enviado. Recargando para ver la notificación...');
        loadAstarNotifications(); // Reload notifications directly
      } else {
        console.error('[ASTAR] Failed to send test message:', data);
        alert('Error al enviar mensaje de prueba: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[ASTAR] Error requesting test message:', error);
    }
  };
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Initialize when DOM is ready
  function init() {
    // Check for test param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('test_astar')) {
      window.requestAstarTest();
    }
    loadAstarNotifications();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
