# 🛍️ Roadmap de Mejoras para el Marketplace

## 📊 Estado Actual del Marketplace

### ✅ Lo que ya funciona:
- Sistema de autenticación (JWT)
- Perfiles de validadores con expertise
- Listado de productos beta
- Sistema de aplicaciones (validators aplican a productos)
- Contratos básicos
- Sistema de reviews

### ⚠️ Lo que falta o se puede mejorar:
- Búsqueda y filtros avanzados
- Notificaciones en tiempo real
- Chat/mensajería entre partes
- Sistema de pagos real (Stripe)
- Dashboard con métricas visuales
- Matching automático con IA
- Portfolio/galería de trabajos previos

---

## 🎯 Mejoras Priorizadas

### 🔥 PRIORIDAD ALTA (Implementar Primero)

#### 1. **Búsqueda y Filtros Avanzados**
**Problema**: Filtros muy básicos, sin búsqueda de texto  
**Impacto**: Alto - Los usuarios no pueden encontrar lo que buscan  
**Tiempo estimado**: 3-4 horas

**Implementación**:

```typescript
// En src/api/marketplace.ts

// Endpoint mejorado para productos
marketplace.get('/products/search', async (c) => {
  const {
    q,           // Búsqueda de texto
    category,    // Filtro por categoría
    stage,       // Filtro por etapa
    min_budget,  // Budget mínimo
    max_budget,  // Budget máximo
    tags,        // Tags separados por coma
    sort = 'recent' // recent, budget_high, budget_low, popular
  } = c.req.query();
  
  let query = `
    SELECT 
      p.*,
      u.name as company_name,
      u.avatar_url as company_avatar,
      COUNT(a.id) as application_count
    FROM beta_products p
    JOIN users u ON p.company_user_id = u.id
    LEFT JOIN applications a ON p.id = a.product_id
    WHERE p.status = 'active'
  `;
  
  const params: any[] = [];
  
  // Búsqueda full-text
  if (q) {
    query += ` AND (
      p.title LIKE ? OR 
      p.description LIKE ? OR 
      p.requirements LIKE ?
    )`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  // Filtros
  if (category) {
    query += ` AND p.category = ?`;
    params.push(category);
  }
  
  if (stage) {
    query += ` AND p.stage = ?`;
    params.push(stage);
  }
  
  if (min_budget) {
    query += ` AND p.compensation >= ?`;
    params.push(parseFloat(min_budget));
  }
  
  if (max_budget) {
    query += ` AND p.compensation <= ?`;
    params.push(parseFloat(max_budget));
  }
  
  // Agrupar para el COUNT
  query += ` GROUP BY p.id`;
  
  // Ordenamiento
  switch (sort) {
    case 'budget_high':
      query += ` ORDER BY p.compensation DESC`;
      break;
    case 'budget_low':
      query += ` ORDER BY p.compensation ASC`;
      break;
    case 'popular':
      query += ` ORDER BY application_count DESC, p.created_at DESC`;
      break;
    default:
      query += ` ORDER BY p.created_at DESC`;
  }
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({
    products: results,
    total: results.length,
    filters: { q, category, stage, min_budget, max_budget, sort }
  });
});

// Lo mismo para validadores
marketplace.get('/validators/search', async (c) => {
  const {
    q,
    expertise,
    min_rating,
    max_rate,
    availability,
    languages,
    verified_only,
    sort = 'rating'
  } = c.req.query();
  
  let query = `
    SELECT 
      v.*,
      u.name, u.email, u.avatar_url, u.bio, u.company,
      COUNT(c.id) as completed_contracts
    FROM validators v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN contracts c ON v.id = c.validator_id AND c.status = 'completed'
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (q) {
    query += ` AND (
      u.name LIKE ? OR 
      v.title LIKE ? OR 
      v.expertise LIKE ?
    )`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (expertise) {
    query += ` AND v.expertise LIKE ?`;
    params.push(`%${expertise}%`);
  }
  
  if (min_rating) {
    query += ` AND v.rating >= ?`;
    params.push(parseFloat(min_rating));
  }
  
  if (max_rate) {
    query += ` AND v.hourly_rate <= ?`;
    params.push(parseFloat(max_rate));
  }
  
  if (availability) {
    query += ` AND v.availability = ?`;
    params.push(availability);
  }
  
  if (languages) {
    query += ` AND v.languages LIKE ?`;
    params.push(`%${languages}%`);
  }
  
  if (verified_only === 'true') {
    query += ` AND v.verified = 1`;
  }
  
  query += ` GROUP BY v.id`;
  
  switch (sort) {
    case 'rate_low':
      query += ` ORDER BY v.hourly_rate ASC`;
      break;
    case 'rate_high':
      query += ` ORDER BY v.hourly_rate DESC`;
      break;
    case 'experience':
      query += ` ORDER BY v.experience_years DESC`;
      break;
    case 'popular':
      query += ` ORDER BY completed_contracts DESC`;
      break;
    default:
      query += ` ORDER BY v.rating DESC, v.total_validations DESC`;
  }
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ validators: results, total: results.length });
});
```

**Frontend actualizado**:

```javascript
// En public/static/marketplace.js

// Agregar barra de búsqueda y filtros avanzados
function renderSearchAndFilters() {
  const container = document.getElementById('search-filters');
  
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <!-- Búsqueda -->
      <div class="mb-4">
        <input 
          type="text" 
          id="search-input"
          placeholder="Buscar productos, validadores..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        >
      </div>
      
      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Categoría -->
        <select id="filter-category" class="px-4 py-2 border rounded-lg">
          <option value="">Todas las categorías</option>
          <option value="SaaS">SaaS</option>
          <option value="Fintech">Fintech</option>
          <option value="E-commerce">E-commerce</option>
          <option value="Mobile">Mobile</option>
        </select>
        
        <!-- Etapa -->
        <select id="filter-stage" class="px-4 py-2 border rounded-lg">
          <option value="">Todas las etapas</option>
          <option value="idea">Idea</option>
          <option value="prototype">Prototipo</option>
          <option value="mvp">MVP</option>
          <option value="beta">Beta</option>
        </select>
        
        <!-- Budget -->
        <select id="filter-budget" class="px-4 py-2 border rounded-lg">
          <option value="">Cualquier presupuesto</option>
          <option value="0-500">$0 - $500</option>
          <option value="500-1000">$500 - $1,000</option>
          <option value="1000-2500">$1,000 - $2,500</option>
          <option value="2500+">$2,500+</option>
        </select>
        
        <!-- Ordenar -->
        <select id="filter-sort" class="px-4 py-2 border rounded-lg">
          <option value="recent">Más recientes</option>
          <option value="budget_high">Mayor presupuesto</option>
          <option value="budget_low">Menor presupuesto</option>
          <option value="popular">Más populares</option>
        </select>
      </div>
      
      <!-- Botones -->
      <div class="mt-4 flex justify-end space-x-2">
        <button onclick="clearFilters()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
          Limpiar filtros
        </button>
        <button onclick="applyFilters()" class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          Aplicar filtros
        </button>
      </div>
    </div>
  `;
}

// Función para aplicar filtros
async function applyFilters() {
  const searchTerm = document.getElementById('search-input').value;
  const category = document.getElementById('filter-category').value;
  const stage = document.getElementById('filter-stage').value;
  const budget = document.getElementById('filter-budget').value;
  const sort = document.getElementById('filter-sort').value;
  
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
    const response = await axios.get(`/api/marketplace/products/search?${params}`);
    products = response.data.products;
    renderProducts();
    
    // Mostrar resultados
    showNotification(`Se encontraron ${products.length} productos`, 'success');
    
  } catch (error) {
    console.error('Error applying filters:', error);
    showNotification('Error al aplicar filtros', 'error');
  }
}

// Auto-búsqueda mientras escribes
document.getElementById('search-input')?.addEventListener('input', debounce(applyFilters, 500));
```

---

#### 2. **Sistema de Notificaciones**
**Problema**: No hay forma de saber cuando hay nuevas aplicaciones, mensajes, etc.  
**Impacto**: Alto - Los usuarios pierden oportunidades  
**Tiempo estimado**: 4-5 horas

**Migración de base de datos**:

```sql
-- Crear archivo: migrations/0004_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'new_application', 'application_approved', 'application_rejected', 'contract_created', 'contract_completed', 'new_review'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL para hacer click
  metadata TEXT, -- JSON con datos adicionales
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read);

-- Agregar trigger para crear notificación cuando se crea una aplicación
CREATE TRIGGER notify_new_application
AFTER INSERT ON applications
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    bp.company_user_id,
    'new_application',
    'Nueva aplicación recibida',
    'Un validador ha aplicado a tu producto: ' || bp.title,
    '/marketplace?tab=dashboard&product=' || NEW.product_id,
    json_object('application_id', NEW.id, 'product_id', NEW.product_id)
  FROM beta_products bp
  WHERE bp.id = NEW.product_id;
END;

-- Trigger para cuando se aprueba una aplicación
CREATE TRIGGER notify_application_approved
AFTER UPDATE OF status ON applications
WHEN NEW.status = 'approved'
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    v.user_id,
    'application_approved',
    '¡Tu aplicación fue aprobada!',
    'Tu aplicación para ' || bp.title || ' ha sido aprobada',
    '/marketplace?tab=dashboard',
    json_object('application_id', NEW.id, 'product_id', NEW.product_id)
  FROM validators v
  JOIN beta_products bp ON bp.id = NEW.product_id
  WHERE v.id = NEW.validator_id;
END;
```

**API**:

```typescript
// En src/api/marketplace.ts

// Obtener notificaciones del usuario
marketplace.get('/notifications', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { unread_only, limit = '20' } = c.req.query();
  
  let query = `
    SELECT * FROM notifications 
    WHERE user_id = ?
  `;
  
  const params: any[] = [userId];
  
  if (unread_only === 'true') {
    query += ` AND read = 0`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Contar no leídas
  const unread = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
  ).bind(userId).first() as any;
  
  return c.json({
    notifications: results,
    unread_count: unread.count
  });
});

// Marcar como leída
marketplace.put('/notifications/:id/read', requireAuth, async (c) => {
  const userId = c.get('userId');
  const notifId = c.req.param('id');
  
  await c.env.DB.prepare(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?'
  ).bind(notifId, userId).run();
  
  return c.json({ message: 'Marked as read' });
});

// Marcar todas como leídas
marketplace.put('/notifications/read-all', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  await c.env.DB.prepare(
    'UPDATE notifications SET read = 1 WHERE user_id = ?'
  ).bind(userId).run();
  
  return c.json({ message: 'All notifications marked as read' });
});
```

**Frontend - Bell Icon con contador**:

```javascript
// En public/static/marketplace.js

let unreadNotifications = 0;

// Cargar notificaciones cada 30 segundos
setInterval(loadNotifications, 30000);

async function loadNotifications() {
  if (!authToken) return;
  
  try {
    const response = await axios.get('/api/marketplace/notifications', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    unreadNotifications = response.data.unread_count;
    updateNotificationBell();
    
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

function updateNotificationBell() {
  const bell = document.getElementById('notification-bell');
  
  if (unreadNotifications > 0) {
    bell.innerHTML = `
      <div class="relative cursor-pointer" onclick="showNotificationsModal()">
        <i class="fas fa-bell text-2xl text-primary"></i>
        <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          ${unreadNotifications > 9 ? '9+' : unreadNotifications}
        </span>
      </div>
    `;
  } else {
    bell.innerHTML = `
      <div class="cursor-pointer" onclick="showNotificationsModal()">
        <i class="fas fa-bell text-2xl text-gray-400"></i>
      </div>
    `;
  }
}

function showNotificationsModal() {
  // Mostrar modal con lista de notificaciones
  // ...
}
```

---

#### 3. **Dashboard con Métricas Visuales**
**Problema**: Dashboard muy básico, solo texto  
**Impacto**: Medio - Ayuda a usuarios a tomar decisiones  
**Tiempo estimado**: 3-4 horas

**Usar Chart.js para gráficos**:

```html
<!-- Agregar en el HTML -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

```javascript
// En marketplace.js

async function renderDashboardMetrics() {
  const response = await axios.get('/api/marketplace/my-dashboard', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const { stats } = response.data;
  
  // Gráfico de ingresos por mes
  const earningsCtx = document.getElementById('earnings-chart').getContext('2d');
  new Chart(earningsCtx, {
    type: 'line',
    data: {
      labels: stats.monthly_earnings.map(m => m.month),
      datasets: [{
        label: 'Ingresos ($)',
        data: stats.monthly_earnings.map(m => m.amount),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Ingresos por Mes'
        }
      }
    }
  });
  
  // Gráfico de aplicaciones por estado
  const applicationsCtx = document.getElementById('applications-chart').getContext('2d');
  new Chart(applicationsCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
      datasets: [{
        data: [
          stats.applications_pending,
          stats.applications_approved,
          stats.applications_rejected
        ],
        backgroundColor: [
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ]
      }]
    }
  });
}
```

---

### 🎯 PRIORIDAD MEDIA (Después de las anteriores)

#### 4. **Chat/Mensajería Básica**
**Tiempo estimado**: 6-8 horas

```sql
-- migrations/0005_messaging.sql

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE INDEX idx_messages_contract ON messages(contract_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, read);
```

#### 5. **Portfolio de Validadores**
**Tiempo estimado**: 4-5 horas

#### 6. **Matching Automático con IA**
**Tiempo estimado**: 5-6 horas

---

### 🚀 PRIORIDAD BAJA (Features Premium)

#### 7. **Sistema de Pagos con Stripe**
**Tiempo estimado**: 2-3 días

#### 8. **Video Calls Integration**
**Tiempo estimado**: 1-2 días

#### 9. **Mobile App**
**Tiempo estimado**: 2-3 semanas

---

## 📋 Plan de Implementación Sugerido

### Semana 1: Quick Wins
- [ ] Búsqueda y filtros avanzados
- [ ] Sistema de notificaciones
- [ ] Loading states y validaciones

### Semana 2: Dashboard y Métricas
- [ ] Dashboard con Chart.js
- [ ] Exportar datos a CSV
- [ ] Perfil de validador mejorado

### Semana 3: Comunicación
- [ ] Chat/mensajería básica
- [ ] Email notifications
- [ ] Portfolio de trabajos

### Semana 4: Matching y Pagos
- [ ] Matching automático con IA
- [ ] Integración de Stripe (básica)
- [ ] Sistema de reviews mejorado

---

## 🎨 Mejoras de UX/UI

### Componentes a agregar:

1. **Loading Skeletons**
```javascript
function renderLoadingSkeleton() {
  return `
    <div class="animate-pulse">
      <div class="h-48 bg-gray-200 rounded-xl mb-4"></div>
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  `;
}
```

2. **Toast Notifications**
```javascript
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  } text-white z-50 animate-slide-in`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
```

3. **Empty States**
```javascript
function renderEmptyState(message, icon = 'inbox') {
  return `
    <div class="text-center py-12">
      <i class="fas fa-${icon} text-6xl text-gray-300 mb-4"></i>
      <p class="text-xl text-gray-600">${message}</p>
    </div>
  `;
}
```

---

## 📊 Métricas a Trackear

Para medir el éxito del marketplace:

1. **Métricas de Actividad**
   - Productos publicados por día/semana
   - Aplicaciones por producto (promedio)
   - Tasa de aprobación de aplicaciones
   - Tiempo promedio de respuesta

2. **Métricas de Calidad**
   - Rating promedio de validadores
   - Rating promedio de productos/founders
   - Tasa de completación de contratos
   - Recompras/trabajos repetidos

3. **Métricas de Ingresos** (si tomas comisión)
   - GMV (Gross Merchandise Value)
   - Comisión ganada
   - Ticket promedio
   - LTV del usuario

---

¿Por dónde quieres empezar? Te recomiendo:
1. Búsqueda y filtros avanzados (mejora inmediata la UX)
2. Sistema de notificaciones (engagement)
3. Dashboard con métricas (profesionaliza la plataforma)
