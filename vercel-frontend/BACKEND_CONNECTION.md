# 🚀 ASTAR* React Frontend - Guía de Conexión con Backend

## 📋 URLs Desplegadas

### Frontend (Vercel)
- **Producción:** https://vercel-frontend-three-teal.vercel.app
- **Framework:** React + Vite + TailwindCSS

### Backend (Railway)
- **API:** https://proyectolovablemasgowth-production-813a.up.railway.app
- **Framework:** Express + PostgreSQL

---

## ✅ Rutas API Implementadas

### 🔐 Autenticación
- `POST /api/auth/login` - Login con email/password
  ```json
  { "email": "user@example.com", "password": "password123" }
  ```
- `POST /api/auth/register` - Registro de nuevo usuario
  ```json
  { "name": "John Doe", "email": "john@example.com", "password": "password123", "role": "founder" }
  ```
- `GET /api/auth/me` - Obtener usuario actual (requiere token)
- `POST /api/auth/logout` - Cerrar sesión

### 📊 Dashboard
- `GET /api/dashboard` - Datos del dashboard (requiere auth)
- `GET /api/dashboard/goals` - Listar objetivos del usuario
- `POST /api/dashboard/goals` - Crear nuevo objetivo
- `PUT /api/dashboard/goals/:id` - Actualizar objetivo
- `DELETE /api/dashboard/goals/:id` - Eliminar objetivo

### 🏪 Marketplace
- `GET /api/marketplace/projects` - Listar proyectos
  - Query params: `?category=saas&status=active&limit=50`
- `GET /api/marketplace/projects/:id` - Detalle de proyecto
- `POST /api/marketplace/projects/:id/vote` - Votar/Des-votar proyecto
- `GET /api/marketplace/directory` - Directorio de usuarios
  - Query params: `?role=founder&search=name&limit=50`

### 🏆 Competiciones
- `GET /api/competitions` - Listar competiciones
  - Query params: `?type=pitch&status=active`
- `GET /api/competitions/:id` - Detalle de competición
- `POST /api/competitions/:id/submit` - Enviar submission
  ```json
  { "project_id": 1, "submission_data": {...} }
  ```

### 📅 Eventos
- `GET /api/events` - Listar eventos
  - Query params: `?status=upcoming&featured=true`
- `GET /api/events/:id` - Detalle de evento
- `POST /api/events/:id/rsvp` - Confirmar asistencia (requiere auth)
- `POST /api/events/:id/register` - Registrarse al evento (requiere auth)
- `DELETE /api/events/:id/register` - Cancelar asistencia

### 💬 Chat
- `GET /api/chat/messages` - Obtener mensajes (requiere auth)
- `POST /api/chat/messages` - Enviar mensaje
  ```json
  { "message": "Hola, necesito ayuda con..." }
  ```

### 🔔 Notificaciones
- `GET /api/notifications` - Listar notificaciones (requiere auth)
- `PATCH /api/notifications/:id/read` - Marcar como leída

### 🏅 Leaderboard
- `GET /api/dashboard/leaderboard` - Top usuarios por puntos

### ⚕️ Health Check
- `GET /health` - Verificar estado del servidor

---

## 🔧 Configuración del Frontend

### Variables de Entorno

Archivo: `vercel-frontend/.env`
```env
VITE_API_BASE_URL=https://proyectolovablemasgowth-production-813a.up.railway.app
```

### Servicios API

Los servicios están en `src/services/`:
- `api.js` - Cliente Axios configurado
- `index.js` - Todos los servicios exportados

Ejemplo de uso:
```javascript
import { authService, dashboardService } from '@/services';

// Login
const result = await authService.login('user@example.com', 'password');

// Get goals
const goals = await dashboardService.getGoals();
```

---

## 🔒 Autenticación

### Flujo de Login

1. Usuario envía credenciales a `POST /api/auth/login`
2. Backend valida y retorna:
   ```json
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 1,
       "email": "user@example.com",
       "name": "John Doe",
       "role": "founder"
     }
   }
   ```
3. Frontend guarda token en `localStorage`:
   ```javascript
   localStorage.setItem('authToken', token);
   ```
4. Todas las requests posteriores incluyen el token:
   ```javascript
   headers: { Authorization: 'Bearer YOUR_TOKEN' }
   ```

### Rutas Protegidas

El frontend usa `<ProtectedRoute>` para proteger páginas:
```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 🧪 Probar la Conexión

### 1. Verificar Backend
```bash
curl https://proyectolovablemasgowth-production-813a.up.railway.app/health
```

### 2. Probar Login desde el Frontend
1. Ir a https://vercel-frontend-three-teal.vercel.app/login
2. Ingresar credenciales de prueba
3. Verificar en DevTools > Network > Headers que se envía el token

### 3. Probar API desde Console
```javascript
// En DevTools > Console
fetch('https://proyectolovablemasgowth-production-813a.up.railway.app/api/events')
  .then(r => r.json())
  .then(console.log);
```

---

## 🐛 Debugging

### Ver Requests en DevTools
1. Abrir DevTools (F12)
2. Tab "Network"
3. Filtrar por "Fetch/XHR"
4. Hacer login o navegar
5. Ver requests a `/api/*`

### Errores Comunes

#### 401 Unauthorized
- Token inválido o expirado
- Re-hacer login

#### 404 Not Found
- Ruta API incorrecta
- Verificar endpoint en `src/services/index.js`

#### CORS Error
- Backend no permite origen del frontend
- Verificar CORS en `railway-backend/src/server.ts`

#### Network Error
- Backend caído
- Verificar: `curl https://proyectolovablemasgowth-production-813a.up.railway.app/health`

---

## 📦 Estructura del Código

```
vercel-frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # MainLayout, Navbar, Sidebar, Chat
│   │   ├── ui/              # Componentes reutilizables
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Todas las páginas
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Marketplace.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Competitions.jsx
│   │   ├── Events.jsx
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx  # Gestión de autenticación
│   ├── services/
│   │   ├── api.js           # Cliente Axios
│   │   └── index.js         # Todos los servicios
│   ├── App.jsx              # Router principal
│   └── main.jsx             # Entry point
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

---

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd vercel-frontend
npm run build
vercel --prod
```

### Backend (Railway)
El backend se despliega automáticamente al hacer push a GitHub:
```bash
cd railway-backend
git add .
git commit -m "Update"
git push
```

Railway detecta cambios y redespliega automáticamente.

---

## 📝 Notas Importantes

1. **CORS ya está configurado** en el backend para permitir requests desde Vercel
2. **Todos los endpoints coinciden** con la aplicación Cloudflare original
3. **El token se guarda en localStorage** y expira en 7 días
4. **Las rutas protegidas** redirigen a `/login` si no hay token
5. **El chat usa mensajes mock** - puedes integrar OpenAI en el backend

---

## 🔗 Links Útiles

- **Frontend:** https://vercel-frontend-three-teal.vercel.app
- **Backend API:** https://proyectolovablemasgowth-production-813a.up.railway.app
- **Railway Dashboard:** https://railway.app
- **Vercel Dashboard:** https://vercel.com

---

¡La aplicación está lista para usar! 🎉
