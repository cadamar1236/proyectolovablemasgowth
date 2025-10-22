# 🛍️ Guía de Desarrollo del Marketplace

## 📋 Índice
1. [Inicialización del Proyecto](#inicialización)
2. [Estructura del Marketplace](#estructura)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Comandos Útiles](#comandos-útiles)
5. [Mejoras Sugeridas](#mejoras-sugeridas)
6. [API Reference](#api-reference)

---

## 🚀 Inicialización

### 1. Primera Vez (Setup Completo)

```powershell
# Navegar al proyecto
cd c:\Users\User\Desktop\marketplacesaasbeta\proyectolovablemasgowth

# Instalar dependencias
npm install

# Crear y migrar base de datos local
npm run db:migrate:local

# Cargar datos de ejemplo (incluye 10 validadores y 5 productos)
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

### 2. Desarrollo Diario

```powershell
# Opción A: Desarrollo rápido con hot-reload
npm run dev
# Abre: http://localhost:5173

# Opción B: Modo sandbox (simula producción)
npm run build
npm run dev:sandbox
# Abre: http://localhost:3000
```

---

## 🏗️ Estructura del Marketplace

### Backend (`src/api/marketplace.ts`)

```
/api/marketplace
│
├── /validators                    # Listar todos los validadores (público)
├── /validators/:id                # Ver perfil de validador (público)
├── /validators/profile [PUT]      # Actualizar perfil (autenticado)
│
├── /products                      # Listar productos (público)
├── /products/:id                  # Ver detalles de producto (público)
├── /products [POST]               # Crear producto (founder)
├── /products/:id [PUT]            # Actualizar producto (founder)
│
├── /applications [POST]           # Aplicar a producto (validator)
├── /applications/product/:id      # Ver aplicaciones (founder)
├── /applications/:id/approve      # Aprobar aplicación (founder)
├── /applications/:id/reject       # Rechazar aplicación (founder)
│
├── /contracts                     # Ver mis contratos (autenticado)
├── /contracts/:id                 # Detalles de contrato
├── /contracts/:id/complete        # Completar trabajo (validator)
│
├── /reviews [POST]                # Dejar review
└── /my-dashboard                  # Dashboard personal
```

### Frontend (`public/static/marketplace.js`)

Componentes principales:
- **Tab Navigation**: Productos, Validadores, Mi Dashboard
- **Product Cards**: Visualización de productos con aplicación
- **Validator Cards**: Perfiles con expertise y ratings
- **Application Flow**: Formulario de aplicación
- **Dashboard**: Gestión de contratos y productos

### Base de Datos (D1)

Tablas del marketplace:
```sql
validators              -- Perfiles de validadores profesionales
validator_certifications -- Certificaciones (Google UX, etc.)
beta_products           -- Productos para validar
applications            -- Aplicaciones de validadores a productos
contracts               -- Contratos activos
reviews                 -- Sistema de ratings y feedback
```

---

## 🔄 Flujo de Trabajo

### Para Founders (Dueños de Productos)

1. **Registrarse** → Rol automático: `founder`
2. **Crear producto**:
   ```javascript
   POST /api/marketplace/products
   {
     "title": "Mi SaaS",
     "description": "...",
     "category": "SaaS",
     "stage": "prototype",
     "compensation": 500,
     "requirements": ["UX Design", "SaaS"]
   }
   ```
3. **Recibir aplicaciones** de validadores
4. **Aprobar/Rechazar** aplicaciones
5. **Recibir feedback** cuando el validador complete

### Para Validators (Beta Testers)

1. **Registrarse** → Cambiar rol a `validator`
2. **Completar perfil**:
   ```javascript
   PUT /api/marketplace/validators/profile
   {
     "title": "Senior UX Designer",
     "expertise": ["SaaS", "Mobile", "UX"],
     "experience_years": 5,
     "hourly_rate": 50
   }
   ```
3. **Explorar productos** disponibles
4. **Aplicar** a productos que coincidan con expertise
5. **Trabajar** en el producto cuando se apruebe
6. **Completar contrato** y recibir pago

---

## 🛠️ Comandos Útiles

### Base de Datos

```powershell
# Resetear base de datos completamente
npm run db:reset

# Aplicar migraciones manualmente
npm run db:migrate:local

# Cargar datos de prueba
npm run db:seed

# Consultar base de datos directamente
wrangler d1 execute webapp-production --local --command="SELECT * FROM validators LIMIT 5"

# Ver tablas
wrangler d1 execute webapp-production --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Desarrollo

```powershell
# Limpiar puerto 3000 si está ocupado
npm run clean-port

# Build para producción
npm run build

# Preview local del build
npm run preview

# Test básico
npm run test
```

### Git

```powershell
# Commit rápido
npm run git:commit "mensaje del commit"

# Equivalente a:
git add .
git commit -m "mensaje"
```

---

## 💡 Mejoras Sugeridas para el Marketplace

### 1. **Búsqueda y Filtros Avanzados**

**Problema**: Los filtros actuales son básicos
**Solución**: Agregar búsqueda full-text y filtros combinados

```typescript
// En src/api/marketplace.ts
marketplace.get('/products/search', async (c) => {
  const { q, category, min_budget, max_budget, tags } = c.req.query();
  
  let query = `
    SELECT * FROM beta_products 
    WHERE status = 'active'
    AND (title LIKE ? OR description LIKE ?)
  `;
  
  const params = [`%${q}%`, `%${q}%`];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  if (min_budget) {
    query += ` AND compensation >= ?`;
    params.push(parseFloat(min_budget));
  }
  
  // ... más filtros
});
```

### 2. **Sistema de Notificaciones**

**Problema**: No hay notificaciones en tiempo real
**Solución**: Agregar tabla de notificaciones

```sql
-- Agregar en nueva migración
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'new_application', 'application_approved', 'contract_completed'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. **Chat Entre Founder y Validator**

**Problema**: No hay comunicación directa
**Solución**: Sistema de mensajería simple

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### 4. **Dashboard con Métricas**

**Problema**: Dashboard muy básico
**Solución**: Agregar analytics

```javascript
// En marketplace.js
async function loadDashboardMetrics() {
  const response = await axios.get('/api/marketplace/metrics', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const { total_earnings, avg_rating, active_contracts } = response.data;
  
  // Mostrar métricas con gráficos (Chart.js)
}
```

### 5. **Sistema de Pagos (Stripe)**

**Problema**: Pagos simulados
**Solución**: Integrar Stripe Connect

```typescript
// En src/api/marketplace.ts
marketplace.post('/contracts/:id/payout', requireAuth, async (c) => {
  const contractId = c.req.param('id');
  
  // Verificar que el contrato está completado
  // Procesar pago con Stripe
  // Actualizar estado del contrato
});
```

### 6. **Galería de Portfolios**

**Problema**: Perfiles sin ejemplos de trabajo
**Solución**: Agregar galería de proyectos

```sql
CREATE TABLE portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  tags TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (validator_id) REFERENCES validators(id)
);
```

### 7. **Matching Automático con IA**

**Problema**: Matching manual
**Solución**: Usar IA para sugerir matches

```typescript
marketplace.get('/products/:id/suggested-validators', async (c) => {
  const productId = c.req.param('id');
  
  // Obtener producto
  const product = await getProduct(productId);
  
  // Usar Groq AI para encontrar mejores matches
  const prompt = `
    Given this product:
    - Title: ${product.title}
    - Category: ${product.category}
    - Requirements: ${product.requirements}
    
    Rank these validators by fit (1-10):
    ${validators.map(v => `${v.name}: ${v.expertise}`).join('\n')}
  `;
  
  // Procesar respuesta y retornar top 5
});
```

---

## 📚 API Reference

### Autenticación

Todas las rutas protegidas requieren:
```
Authorization: Bearer <token>
```

### Modelos de Datos

#### Validator
```typescript
{
  id: number
  user_id: number
  title: string
  expertise: string[] // JSON array
  experience_years: number
  hourly_rate: number
  availability: 'available' | 'busy' | 'unavailable'
  languages: string[] // JSON array
  portfolio_url: string
  linkedin_url: string
  rating: number
  total_validations: number
  success_rate: number
  verified: boolean
}
```

#### Beta Product
```typescript
{
  id: number
  company_user_id: number
  title: string
  description: string
  category: 'SaaS' | 'Fintech' | 'E-commerce' | ...
  stage: 'idea' | 'prototype' | 'mvp' | 'beta'
  requirements: string[] // JSON array
  compensation: number
  timeline_days: number
  status: 'active' | 'paused' | 'completed'
  featured: boolean
}
```

#### Application
```typescript
{
  id: number
  product_id: number
  validator_id: number
  message: string
  proposed_rate: number
  estimated_hours: number
  status: 'pending' | 'approved' | 'rejected'
}
```

#### Contract
```typescript
{
  id: number
  application_id: number
  product_id: number
  validator_id: number
  start_date: string
  end_date: string
  rate: number
  total_amount: number
  status: 'active' | 'completed' | 'cancelled'
}
```

---

## 🐛 Debugging

### Ver logs en tiempo real

```powershell
# En el terminal donde corre el servidor
# Los logs aparecerán automáticamente
```

### Consultar base de datos

```powershell
# Ver todos los validadores
wrangler d1 execute webapp-production --local --command="SELECT * FROM validators"

# Ver productos activos
wrangler d1 execute webapp-production --local --command="SELECT * FROM beta_products WHERE status='active'"

# Ver aplicaciones pendientes
wrangler d1 execute webapp-production --local --command="SELECT * FROM applications WHERE status='pending'"
```

### Probar endpoints con curl

```powershell
# Registrar usuario
curl -X POST http://localhost:5173/api/auth/register -H "Content-Type: application/json" -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}'

# Login
curl -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'

# Listar productos
curl http://localhost:5173/api/marketplace/products

# Listar validadores
curl http://localhost:5173/api/marketplace/validators
```

---

## 🚀 Deploy a Producción

### 1. Preparar base de datos de producción

```powershell
# Aplicar migraciones a producción
npm run db:migrate:prod
```

### 2. Deploy a Cloudflare Pages

```powershell
# Deploy completo
npm run deploy

# O deploy a proyecto específico
npm run deploy:prod
```

### 3. Configurar secretos

```powershell
# Agregar secreto de Groq AI
wrangler secret put GROQ_API_KEY
```

---

## 📝 Checklist de Mejoras Prioritarias

### ⚡ Quick Wins (1-2 horas)

- [ ] Agregar búsqueda de texto en productos
- [ ] Filtros por múltiples categorías
- [ ] Paginación en listas largas
- [ ] Loading states en botones
- [ ] Validación de formularios mejorada

### 🎯 Features Importantes (3-5 horas)

- [ ] Sistema de notificaciones
- [ ] Dashboard con métricas reales
- [ ] Galería de portfolio para validadores
- [ ] Sistema de favoritos/bookmarks
- [ ] Exportar datos a CSV

### 🚀 Features Avanzadas (1-2 días)

- [ ] Chat entre founder y validator
- [ ] Matching automático con IA
- [ ] Sistema de pagos con Stripe
- [ ] Calendar para scheduling
- [ ] Video calls integration

### 💎 Premium Features (1 semana+)

- [ ] Sistema de reputación gamificado
- [ ] Marketplace analytics dashboard
- [ ] Programa de afiliados
- [ ] API pública para integraciones
- [ ] Mobile app

---

## 🤝 Contribuir

1. Crear branch para feature: `git checkout -b feature/nombre`
2. Hacer cambios y commit: `npm run git:commit "descripción"`
3. Push: `git push origin feature/nombre`
4. Crear Pull Request

---

## 📞 Recursos

- **Documentación Hono**: https://hono.dev
- **Cloudflare D1**: https://developers.cloudflare.com/d1
- **Groq AI**: https://groq.com/docs
- **Tailwind CSS**: https://tailwindcss.com

---

¡Listo para mejorar el marketplace! 🚀
