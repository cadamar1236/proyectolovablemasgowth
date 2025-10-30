# 🎨 Guía de Implementación Frontend - Sistema de Solicitudes y Chat

**Fecha**: 29 de Octubre, 2025  
**Backend Status**: ✅ **COMPLETO** - Todas las APIs funcionando  
**Frontend Status**: 🔨 **PENDIENTE** - Necesita implementación UI

---

## 📋 RESUMEN DE LO QUE FUNCIONA (Backend)

### ✅ APIs Completadas:

1. **Solicitudes de Validadores** (`/api/validator-requests`)
2. **Sistema de Chat** (`/api/chat`)
3. **Notificaciones** (`/api/notifications`)
4. **Base de Datos** (5 tablas nuevas con índices optimizados)

---

## 🎯 ELEMENTOS UI A IMPLEMENTAR

### 1. **Perfil de Validator - Botón "Solicitar Opinión"**

#### Ubicación:
`/marketplace` → Vista de validador individual

#### Componente:
```javascript
// En el card de cada validator, agregar:
<button 
  onclick="requestValidatorOpinion(${validatorId})" 
  class="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
>
  <i class="fas fa-paper-plane mr-2"></i>Solicitar Opinión
</button>
```

#### Función JavaScript:
```javascript
async function requestValidatorOpinion(validatorId) {
  // Check if user is logged in
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    showAuthModal('login');
    return;
  }
  
  // Show modal to select project and write message
  const modal = document.getElementById('request-validator-modal');
  modal.classList.remove('hidden');
  
  // Load user's projects for dropdown
  loadUserProjectsForRequest(validatorId);
}
```

---

### 2. **Modal "Solicitar Opinión a Validador"**

#### HTML Structure:
```html
<div id="request-validator-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">
          <i class="fas fa-paper-plane text-primary mr-2"></i>
          Solicitar Opinión de Validador
        </h2>
        <button onclick="closeRequestModal()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <form id="request-validator-form" class="space-y-6">
        <!-- Project Selection -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Proyecto (opcional)
          </label>
          <select id="request-project-id" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
            <option value="">Sin proyecto específico</option>
            <!-- Projects will be loaded here -->
          </select>
        </div>
        
        <!-- Message -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Mensaje para el validador *
          </label>
          <textarea 
            id="request-message" 
            required 
            rows="5"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="Hola, me gustaría conocer tu opinión sobre mi idea de...&#10;&#10;¿Crees que tiene potencial en el mercado?&#10;¿Qué cambiarías?&#10;&#10;Gracias!"
          ></textarea>
          <p class="text-sm text-gray-500 mt-2">
            <i class="fas fa-info-circle mr-1"></i>
            Sé específico sobre qué feedback necesitas
          </p>
        </div>
        
        <!-- Actions -->
        <div class="flex space-x-4">
          <button 
            type="submit" 
            class="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
          >
            <i class="fas fa-paper-plane mr-2"></i>Enviar Solicitud
          </button>
          <button 
            type="button" 
            onclick="closeRequestModal()" 
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
```

#### JavaScript Functions:
```javascript
let currentValidatorId = null;

async function loadUserProjectsForRequest(validatorId) {
  currentValidatorId = validatorId;
  
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const select = document.getElementById('request-project-id');
    
    // Clear existing options except first
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Add projects as options
    data.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.title;
      select.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

async function handleRequestValidatorSubmit(event) {
  event.preventDefault();
  
  const projectId = document.getElementById('request-project-id').value;
  const message = document.getElementById('request-message').value;
  const authToken = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('/api/validator-requests/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        validatorId: currentValidatorId,
        projectId: projectId || null,
        message: message
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Solicitud enviada exitosamente. Serás notificado cuando el validador responda.');
      closeRequestModal();
      
      // Reload validator stats if on dashboard
      if (typeof loadValidatorStats === 'function') {
        loadValidatorStats();
      }
    } else {
      alert('❌ Error: ' + (data.error || 'No se pudo enviar la solicitud'));
    }
    
  } catch (error) {
    console.error('Error sending request:', error);
    alert('❌ Error al enviar la solicitud. Inténtalo de nuevo.');
  }
}

function closeRequestModal() {
  document.getElementById('request-validator-modal').classList.add('hidden');
  document.getElementById('request-validator-form').reset();
  currentValidatorId = null;
}

// Bind form submit
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('request-validator-form');
  if (form) {
    form.addEventListener('submit', handleRequestValidatorSubmit);
  }
});
```

---

### 3. **Dashboard Founder - Estadísticas de Validadores Contactados**

#### Ubicación:
`/marketplace?tab=my-dashboard` (para founders)

#### HTML:
```html
<div id="founder-validator-stats" class="bg-white rounded-xl shadow-lg p-6 mb-6">
  <h3 class="text-xl font-bold text-gray-900 mb-4">
    <i class="fas fa-chart-line text-primary mr-2"></i>
    Validadores Contactados
  </h3>
  
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
    <div class="text-center">
      <div id="validators-contacted" class="text-3xl font-bold text-primary">0</div>
      <div class="text-sm text-gray-600 mt-1">Contactados</div>
    </div>
    <div class="text-center">
      <div id="requests-pending" class="text-3xl font-bold text-yellow-600">0</div>
      <div class="text-sm text-gray-600 mt-1">Pendientes</div>
    </div>
    <div class="text-center">
      <div id="requests-accepted" class="text-3xl font-bold text-green-600">0</div>
      <div class="text-sm text-gray-600 mt-1">Aceptadas</div>
    </div>
    <div class="text-center">
      <div id="requests-rejected" class="text-3xl font-bold text-red-600">0</div>
      <div class="text-sm text-gray-600 mt-1">Rechazadas</div>
    </div>
    <div class="text-center">
      <div id="total-requests" class="text-3xl font-bold text-gray-900">0</div>
      <div class="text-sm text-gray-600 mt-1">Total</div>
    </div>
  </div>
</div>
```

#### JavaScript:
```javascript
async function loadValidatorStats() {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch('/api/validator-requests/stats', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const stats = data.stats;
    
    document.getElementById('validators-contacted').textContent = stats.validators_contacted || 0;
    document.getElementById('requests-pending').textContent = stats.pending || 0;
    document.getElementById('requests-accepted').textContent = stats.accepted || 0;
    document.getElementById('requests-rejected').textContent = stats.rejected || 0;
    document.getElementById('total-requests').textContent = stats.total_requests || 0;
    
  } catch (error) {
    console.error('Error loading validator stats:', error);
  }
}
```

---

### 4. **Dashboard Validator - Solicitudes Pendientes**

#### Ubicación:
`/marketplace?tab=my-dashboard` (para validators)

#### HTML:
```html
<div id="validator-pending-requests" class="bg-white rounded-xl shadow-lg p-6 mb-6">
  <h3 class="text-xl font-bold text-gray-900 mb-4">
    <i class="fas fa-inbox text-primary mr-2"></i>
    Solicitudes Pendientes
    <span id="pending-requests-count" class="ml-2 bg-red-500 text-white text-sm px-3 py-1 rounded-full">0</span>
  </h3>
  
  <div id="pending-requests-list" class="space-y-4">
    <!-- Requests will be loaded here -->
  </div>
</div>
```

#### JavaScript:
```javascript
async function loadPendingRequests() {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch('/api/validator-requests/pending', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const requests = data.requests || [];
    
    document.getElementById('pending-requests-count').textContent = requests.length;
    
    const container = document.getElementById('pending-requests-list');
    
    if (requests.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-3"></i>
          <p>No hay solicitudes pendientes</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = requests.map(request => `
      <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div class="flex items-start space-x-4">
          <img 
            src="${request.founder_avatar || '/static/default-avatar.png'}" 
            alt="${request.founder_name}"
            class="w-12 h-12 rounded-full"
          />
          <div class="flex-1">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="font-semibold text-gray-900">${request.founder_name}</h4>
                <p class="text-sm text-gray-600">${request.founder_email}</p>
              </div>
              <span class="text-xs text-gray-500">
                ${new Date(request.created_at).toLocaleDateString()}
              </span>
            </div>
            
            ${request.project_title ? `
              <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                <p class="text-sm font-medium text-blue-900">
                  <i class="fas fa-project-diagram mr-1"></i>
                  Proyecto: ${request.project_title}
                </p>
              </div>
            ` : ''}
            
            <p class="text-gray-700 mb-4 whitespace-pre-wrap">${request.message}</p>
            
            <div class="flex space-x-3">
              <button 
                onclick="acceptRequest(${request.id})" 
                class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                <i class="fas fa-check mr-2"></i>Aceptar
              </button>
              <button 
                onclick="rejectRequest(${request.id})" 
                class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
              >
                <i class="fas fa-times mr-2"></i>Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading pending requests:', error);
  }
}

async function acceptRequest(requestId) {
  if (!confirm('¿Estás seguro de que quieres aceptar esta solicitud? Se abrirá un chat con el founder.')) {
    return;
  }
  
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`/api/validator-requests/${requestId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Solicitud aceptada. El chat está ahora activo.');
      loadPendingRequests();
      loadConversations(); // Refresh conversations list
    } else {
      alert('❌ Error: ' + (data.error || 'No se pudo aceptar la solicitud'));
    }
    
  } catch (error) {
    console.error('Error accepting request:', error);
    alert('❌ Error al aceptar la solicitud.');
  }
}

async function rejectRequest(requestId) {
  if (!confirm('¿Estás seguro de que quieres rechazar esta solicitud?')) {
    return;
  }
  
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`/api/validator-requests/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Solicitud rechazada.');
      loadPendingRequests();
    } else {
      alert('❌ Error: ' + (data.error || 'No se pudo rechazar la solicitud'));
    }
    
  } catch (error) {
    console.error('Error rejecting request:', error);
    alert('❌ Error al rechazar la solicitud.');
  }
}
```

---

### 5. **Interfaz de Chat**

#### HTML Structure:
```html
<!-- Chat Sidebar -->
<div id="chat-sidebar" class="bg-white rounded-xl shadow-lg p-4 h-[600px] flex flex-col">
  <h3 class="text-xl font-bold text-gray-900 mb-4">
    <i class="fas fa-comments text-primary mr-2"></i>
    Conversaciones
    <span id="unread-messages-count" class="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">0</span>
  </h3>
  
  <div id="conversations-list" class="flex-1 overflow-y-auto space-y-2">
    <!-- Conversations will be loaded here -->
  </div>
</div>

<!-- Chat Window -->
<div id="chat-window" class="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
  <!-- Chat Header -->
  <div id="chat-header" class="border-b px-6 py-4 flex justify-between items-center">
    <div class="flex items-center space-x-3">
      <img id="chat-other-user-avatar" src="" alt="" class="w-10 h-10 rounded-full" />
      <div>
        <h4 id="chat-other-user-name" class="font-semibold text-gray-900"></h4>
        <p id="chat-project-title" class="text-sm text-gray-600"></p>
      </div>
    </div>
    <button onclick="closeConversation()" class="text-gray-400 hover:text-gray-600">
      <i class="fas fa-times"></i>
    </button>
  </div>
  
  <!-- Messages Area -->
  <div id="chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4">
    <!-- Messages will be loaded here -->
  </div>
  
  <!-- Message Input -->
  <div class="border-t px-6 py-4">
    <form id="chat-message-form" class="flex space-x-3">
      <input 
        type="text" 
        id="chat-message-input" 
        required
        placeholder="Escribe tu mensaje..."
        class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
      />
      <button 
        type="submit" 
        class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </form>
  </div>
</div>
```

#### JavaScript:
```javascript
let currentConversationId = null;
let chatPollInterval = null;

async function loadConversations() {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch('/api/chat/conversations', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const conversations = data.conversations || [];
    
    const container = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500 text-sm">
          <i class="fas fa-comments text-3xl mb-2"></i>
          <p>No hay conversaciones activas</p>
        </div>
      `;
      return;
    }
    
    // Calculate total unread
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    document.getElementById('unread-messages-count').textContent = totalUnread;
    
    container.innerHTML = conversations.map(conv => `
      <div 
        onclick="openConversation(${conv.id})" 
        class="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition ${conv.id === currentConversationId ? 'bg-primary/10' : ''}"
      >
        <div class="flex items-center space-x-3">
          <img src="${conv.other_user_avatar || '/static/default-avatar.png'}" alt="" class="w-10 h-10 rounded-full" />
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <p class="font-semibold text-gray-900 truncate">${conv.other_user_name}</p>
              ${conv.unread_count > 0 ? `
                <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">${conv.unread_count}</span>
              ` : ''}
            </div>
            <p class="text-sm text-gray-600 truncate">${conv.last_message || 'Sin mensajes'}</p>
            ${conv.project_title ? `
              <p class="text-xs text-primary truncate mt-1">
                <i class="fas fa-project-diagram"></i> ${conv.project_title}
              </p>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

async function openConversation(conversationId) {
  currentConversationId = conversationId;
  
  // Stop previous polling
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
  }
  
  // Load conversation details and messages
  await loadConversationMessages(conversationId);
  
  // Refresh conversations list (to update unread count)
  loadConversations();
  
  // Poll for new messages every 5 seconds
  chatPollInterval = setInterval(() => {
    loadConversationMessages(conversationId, false);
  }, 5000);
}

async function loadConversationMessages(conversationId, scrollToBottom = true) {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const messages = data.messages || [];
    const userId = getCurrentUserId(); // You need to implement this
    
    const container = document.getElementById('chat-messages');
    
    container.innerHTML = messages.map(msg => {
      const isOwnMessage = msg.sender_id === userId;
      
      return `
        <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[70%]">
            ${!isOwnMessage ? `
              <div class="flex items-center space-x-2 mb-1">
                <img src="${msg.sender_avatar || '/static/default-avatar.png'}" alt="" class="w-6 h-6 rounded-full" />
                <span class="text-xs font-medium text-gray-700">${msg.sender_name}</span>
              </div>
            ` : ''}
            <div class="${isOwnMessage ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-3">
              <p class="whitespace-pre-wrap">${msg.message}</p>
            </div>
            <p class="text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}">
              ${new Date(msg.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      `;
    }).join('');
    
    if (scrollToBottom) {
      container.scrollTop = container.scrollHeight;
    }
    
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

async function sendMessage(event) {
  event.preventDefault();
  
  const input = document.getElementById('chat-message-input');
  const message = input.value.trim();
  
  if (!message || !currentConversationId) return;
  
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`/api/chat/conversations/${currentConversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ message })
    });
    
    if (response.ok) {
      input.value = '';
      await loadConversationMessages(currentConversationId, true);
      loadConversations(); // Refresh conversations list
    } else {
      const data = await response.json();
      alert('Error: ' + (data.error || 'No se pudo enviar el mensaje'));
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error al enviar el mensaje');
  }
}

function closeConversation() {
  currentConversationId = null;
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }
  document.getElementById('chat-messages').innerHTML = '';
}

// Helper function to get current user ID from JWT
function getCurrentUserId() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch (e) {
    return null;
  }
}

// Bind form submit
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-message-form');
  if (form) {
    form.addEventListener('submit', sendMessage);
  }
  
  // Load conversations on page load if user is authenticated
  if (localStorage.getItem('authToken')) {
    loadConversations();
  }
});
```

---

### 6. **Notificaciones Badge en Navbar**

#### HTML:
```html
<!-- Agregar en el navbar -->
<button onclick="toggleNotifications()" class="relative text-gray-700 hover:text-primary transition">
  <i class="fas fa-bell text-xl"></i>
  <span id="notifications-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hidden">
    0
  </span>
</button>
```

#### JavaScript:
```javascript
async function loadNotificationsCount() {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    const response = await fetch('/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const count = data.unreadCount || 0;
    
    const badge = document.getElementById('notifications-badge');
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('Error loading notifications count:', error);
  }
}

// Poll notifications every 30 seconds
setInterval(loadNotificationsCount, 30000);
loadNotificationsCount(); // Initial load
```

---

## 🚀 PASOS PARA IMPLEMENTAR

### Paso 1: Aplicar Migración de Base de Datos ✅
```bash
cd /home/user/webapp
npx wrangler d1 execute DB --local --file=./migrations/0002_validator_requests_and_chat.sql
npx wrangler d1 execute DB --remote --file=./migrations/0002_validator_requests_and_chat.sql
```

### Paso 2: Agregar HTML al Marketplace
- Editar `/public/static/marketplace.js`
- Agregar modales y secciones de chat

### Paso 3: Agregar Funciones JavaScript
- Copiar funciones de este documento
- Integrar en archivos existentes

### Paso 4: Testing
- Crear 2 usuarios (1 founder, 1 validator)
- Founder solicita opinión
- Validator acepta
- Probar chat

### Paso 5: Deploy
```bash
npm run build
git add .
git commit -m "feat: Frontend completo para solicitudes y chat"
git push origin main
```

---

## 📊 ESTADO ACTUAL

✅ **Backend**: 100% funcional  
🔨 **Frontend**: 0% implementado (necesita UI)  
📝 **Documentación**: Completa  
🎯 **Next Step**: Implementar UI según esta guía

---

**¿Necesitas ayuda implementando alguna parte específica?** 🚀
