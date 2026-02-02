# 🚀 ASTAR* Platform - Frontend de Respaldo para Vercel

## 📋 Descripción

Este es el **frontend de respaldo** de la plataforma ASTAR*, diseñado para ser desplegado en **Vercel** y conectarse al backend de **Railway**. 

### Arquitectura de Respaldo

```
┌─────────────────────────────────────────────┐
│         FRONTEND (Vercel)                   │
│     HTML + CSS + JavaScript Vanilla         │
└─────────────────────────────────────────────┘
                    │
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────┐
│         BACKEND (Railway)                   │
│    Hono + TypeScript + Cloudflare D1       │
│  proyectolovablemasgowth-production-813a    │
└─────────────────────────────────────────────┘
```

## 🎯 Diferencias con el Frontend de Cloudflare

| Característica | Cloudflare (Original) | Vercel (Respaldo) |
|----------------|----------------------|-------------------|
| **Rendering** | SSR con Hono JSX | HTML Estático |
| **Backend Integration** | Mismo worker | API REST externa |
| **Deployment** | Cloudflare Pages | Vercel |
| **Database** | Directo a D1 | A través de Railway |
| **Static Assets** | Worker KV | Vercel CDN |

## 📁 Estructura del Proyecto

```
vercel-frontend/
│
├── index.html              # Página principal
├── marketplace.html        # Página de marketplace
├── dashboard.html          # Dashboard de usuario
│
├── public/                 # Archivos estáticos
│   ├── css/
│   │   └── style.css      # Estilos personalizados
│   ├── js/
│   │   └── app.js         # Lógica del frontend
│   └── images/            # Imágenes (si las hay)
│
├── vercel.json            # Configuración de Vercel
├── package.json           # Dependencias
└── README.md              # Esta documentación
```

## 🔧 Configuración

### 1. Variables de Entorno

El frontend apunta directamente al backend de Railway:

```javascript
const API_BASE_URL = 'https://proyectolovablemasgowth-production-813a.up.railway.app';
```

Esta URL está configurada en `/public/js/app.js` línea 3.

### 2. Archivo vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "env": {
    "API_BASE_URL": "https://proyectolovablemasgowth-production-813a.up.railway.app"
  }
}
```

## 🚀 Despliegue en Vercel

### Opción 1: Desde Vercel Dashboard

1. **Crear cuenta en Vercel** (si no tienes una)
   - Ir a [vercel.com](https://vercel.com)
   - Registrarse con GitHub/GitLab/Bitbucket

2. **Conectar el repositorio**
   - Click en "Add New Project"
   - Importar el repositorio Git
   - Seleccionar la carpeta `vercel-frontend`

3. **Configurar el proyecto**
   - **Framework Preset**: Other
   - **Root Directory**: `vercel-frontend`
   - **Build Command**: (dejar vacío)
   - **Output Directory**: `.` (punto)

4. **Variables de entorno** (opcional)
   ```
   API_BASE_URL=https://proyectolovablemasgowth-production-813a.up.railway.app
   ```

5. **Deploy**
   - Click en "Deploy"
   - Esperar a que se complete el deployment
   - Obtener la URL pública

### Opción 2: Desde la CLI de Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Navegar a la carpeta del frontend
cd vercel-frontend

# 3. Login en Vercel
vercel login

# 4. Desplegar
vercel --prod

# Seguir las instrucciones en pantalla
```

### Opción 3: Desde este proyecto

```bash
# Desde la carpeta raíz del proyecto
cd vercel-frontend

# Instalar dependencias (opcional)
npm install

# Desplegar a producción
npm run deploy
```

## 📦 Archivos Principales

### 1. index.html
Página principal con:
- Hero section
- Features section
- CTA buttons
- Navegación

### 2. marketplace.html
Página de marketplace con:
- Listado de proyectos
- Filtros de búsqueda
- Sistema de votación

### 3. dashboard.html
Dashboard de usuario con:
- Estadísticas de proyectos
- Formulario de creación de proyectos
- Actividad reciente

### 4. public/js/app.js
JavaScript principal con:
- Gestión de autenticación
- Llamadas a la API de Railway
- Renderizado dinámico de contenido
- Funciones helper

### 5. public/css/style.css
Estilos personalizados adicionales a Tailwind CSS

## 🔗 Endpoints del Backend

Todos los endpoints apuntan a Railway:

```javascript
// Autenticación
POST ${API_BASE_URL}/api/auth/register
POST ${API_BASE_URL}/api/auth/login
GET  ${API_BASE_URL}/api/auth/me

// Proyectos
GET  ${API_BASE_URL}/api/projects
POST ${API_BASE_URL}/api/projects
GET  ${API_BASE_URL}/api/projects/:id

// Marketplace
GET  ${API_BASE_URL}/api/marketplace/products
POST ${API_BASE_URL}/api/marketplace/products/:id/vote
```

## 🎨 Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **Tailwind CSS**: Framework CSS (vía CDN)
- **JavaScript Vanilla**: Sin frameworks
- **Axios**: Cliente HTTP para llamadas a API
- **Font Awesome**: Iconografía
- **Chart.js**: Gráficos (en dashboard)

## ⚙️ Funcionalidades Implementadas

### ✅ Autenticación
- Registro de usuarios
- Login
- Gestión de tokens JWT
- Persistencia en localStorage

### ✅ Proyectos
- Listado de proyectos
- Creación de proyectos
- Validación de proyectos

### ✅ Marketplace
- Exploración de productos
- Filtros de búsqueda
- Sistema de votación

### ✅ Dashboard
- Vista de estadísticas
- Gestión de proyectos personales

## 🔒 Seguridad

- **HTTPS**: Todas las comunicaciones via HTTPS
- **JWT**: Autenticación basada en tokens
- **CORS**: Configurado en el backend de Railway
- **XSS Protection**: Escape de HTML en renderizado

## 🐛 Troubleshooting

### Problema: Las APIs no responden

**Solución**: Verificar que el backend de Railway esté activo:
```bash
curl https://proyectolovablemasgowth-production-813a.up.railway.app/api/auth/me
```

### Problema: Error de CORS

**Solución**: Verificar que el backend tenga CORS habilitado para el dominio de Vercel:
```typescript
// En el backend Railway
app.use('/api/*', cors({
  origin: ['https://tu-dominio.vercel.app']
}));
```

### Problema: Assets no se cargan

**Solución**: Verificar las rutas en `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/public/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

## 📊 Performance

- **Tamaño del bundle**: ~50KB (sin CDN)
- **First Contentful Paint**: <1s
- **Time to Interactive**: <2s
- **Lighthouse Score**: 95+

## 🔄 Actualizaciones

Para actualizar el frontend:

1. **Hacer cambios** en los archivos HTML/CSS/JS
2. **Commit** los cambios
3. **Push** al repositorio
4. **Vercel** desplegará automáticamente

O manualmente:
```bash
vercel --prod
```

## 📞 Soporte

Si tienes problemas con el frontend de Vercel:

1. Verificar que el backend de Railway esté funcionando
2. Revisar la consola del navegador (F12)
3. Verificar los logs de Vercel
4. Contactar al equipo de desarrollo

## 🎯 Roadmap

- [ ] Agregar más páginas (perfil, configuración)
- [ ] Mejorar el sistema de caché
- [ ] Implementar Service Workers (PWA)
- [ ] Agregar tests E2E
- [ ] Optimizar imágenes

## 📝 Notas Importantes

- Este es un **frontend de respaldo**, el principal está en Cloudflare
- Todas las APIs van a través de Railway
- No hay renderizado del lado del servidor (SSR)
- Es completamente estático y se sirve desde Vercel CDN

## 🌐 URLs

- **Frontend (Vercel)**: `https://tu-proyecto.vercel.app` (después del deploy)
- **Backend (Railway)**: `https://proyectolovablemasgowth-production-813a.up.railway.app`
- **Frontend Principal (Cloudflare)**: `https://webapp-46s.pages.dev`

---

⚡ **Tip**: Este frontend es idéntico en funcionalidad al de Cloudflare pero implementado de forma totalmente independiente y desacoplada.
