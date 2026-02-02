# 🚀 Guía Rápida de Despliegue - ASTAR* Frontend en Vercel

## ⚡ Despliegue en 5 Minutos

### Paso 1: Acceder a Vercel
```
1. Ir a: https://vercel.com
2. Hacer clic en "Sign Up" o "Log In"
3. Conectar con tu cuenta de GitHub/GitLab
```

### Paso 2: Importar Proyecto
```
1. Click en "Add New..." → "Project"
2. Seleccionar el repositorio del proyecto
3. Si no aparece, click en "Adjust GitHub App Permissions"
```

### Paso 3: Configurar Deployment
```
Framework Preset:     Other
Root Directory:       vercel-frontend
Build Command:        (dejar vacío)
Output Directory:     .
Install Command:      (dejar vacío)
```

### Paso 4: Variables de Entorno (Opcional)
```
Agregar esta variable:
API_BASE_URL = https://proyectolovablemasgowth-production-813a.up.railway.app
```

### Paso 5: Deploy
```
1. Click en "Deploy"
2. Esperar 30-60 segundos
3. ¡Listo! Obtendrás una URL como: https://tu-proyecto.vercel.app
```

---

## 📋 Checklist Pre-Despliegue

- [ ] Backend de Railway está funcionando
- [ ] El archivo `vercel-frontend/public/js/app.js` tiene la URL correcta
- [ ] Los archivos HTML están en la raíz de `vercel-frontend/`
- [ ] El archivo `vercel.json` está configurado
- [ ] El repositorio está sincronizado con GitHub/GitLab

---

## 🔍 Verificación Post-Despliegue

### 1. Verificar que el sitio carga
```bash
curl -I https://tu-proyecto.vercel.app
# Debe retornar: HTTP/2 200
```

### 2. Verificar conexión con Railway
```bash
# Abrir la consola del navegador (F12)
# Ir a la pestaña Network
# Debería ver peticiones a: proyectolovablemasgowth-production-813a.up.railway.app
```

### 3. Probar funcionalidades
- [ ] La página principal carga correctamente
- [ ] Los botones de navegación funcionan
- [ ] El modal de auth se abre
- [ ] Las llamadas a la API funcionan

---

## 🆘 Solución de Problemas Comunes

### Error: "Cannot find module"
**Causa**: Falta algún archivo
**Solución**: 
```bash
cd vercel-frontend
git status  # Verificar que todos los archivos estén
git add .
git commit -m "fix: Agregar archivos faltantes"
git push
```

### Error: "404 Not Found" en assets
**Causa**: Rutas incorrectas en HTML
**Solución**: Verificar que las rutas en HTML sean:
- `/public/css/style.css` ✅
- `public/css/style.css` ❌ (sin slash inicial)

### Error: "CORS Policy"
**Causa**: Backend no permite peticiones desde Vercel
**Solución**: En el backend Railway, agregar el dominio de Vercel a CORS:
```typescript
app.use('/api/*', cors({
  origin: ['https://tu-proyecto.vercel.app']
}));
```

### Error: APIs no responden
**Causa**: Backend de Railway caído o URL incorrecta
**Solución**:
```bash
# 1. Verificar que Railway esté activo
curl https://proyectolovablemasgowth-production-813a.up.railway.app/api/auth/me

# 2. Si no funciona, verificar la URL en app.js
```

---

## 🔄 Actualizar el Frontend

### Método 1: Automático (Recomendado)
```bash
# Hacer cambios en los archivos
# Commit y push
git add .
git commit -m "feat: Actualización del frontend"
git push

# Vercel detectará el push y desplegará automáticamente
```

### Método 2: Manual con CLI
```bash
cd vercel-frontend
vercel --prod
```

---

## 🌐 Dominios Personalizados

### Agregar dominio propio en Vercel

1. **Ir a Settings del proyecto**
2. **Click en "Domains"**
3. **Agregar tu dominio**: `tudominio.com`
4. **Configurar DNS**:
   ```
   Tipo: CNAME
   Nombre: @
   Valor: cname.vercel-dns.com
   ```
5. **Esperar propagación DNS** (5-60 minutos)

---

## 📊 Monitoreo

### Ver Logs en Vercel
```
1. Ir al proyecto en Vercel Dashboard
2. Click en "Deployments"
3. Seleccionar el deployment
4. Ver logs y errores
```

### Ver Analytics
```
1. Click en "Analytics" en el proyecto
2. Ver métricas de:
   - Visitas
   - Performance
   - Errores
```

---

## 🎯 Comandos Útiles

```bash
# Ver versión de Vercel CLI
vercel --version

# Login en Vercel
vercel login

# Ver lista de proyectos
vercel ls

# Ver información del proyecto
vercel inspect

# Eliminar deployment
vercel remove [deployment-url]

# Ver logs en tiempo real
vercel logs [deployment-url] --follow
```

---

## 💡 Mejores Prácticas

1. **Usar Git Tags** para releases
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Configurar Production y Preview**
   - Production: rama `main`
   - Preview: otras ramas

3. **Habilitar HTTPS** (automático en Vercel)

4. **Configurar Redirects** en `vercel.json` si es necesario

5. **Usar Environment Variables** para diferentes ambientes

---

## 📞 Soporte

- **Documentación Vercel**: https://vercel.com/docs
- **Vercel Status**: https://vercel-status.com
- **GitHub Issues**: [Tu repositorio]

---

## ✅ Checklist Final

- [ ] Frontend desplegado en Vercel
- [ ] URL pública funcionando
- [ ] Conexión con Railway OK
- [ ] Autenticación funcionando
- [ ] Marketplace carga correctamente
- [ ] Dashboard accesible
- [ ] Sin errores en consola
- [ ] Performance aceptable (Lighthouse > 90)

---

¡Listo! Tu frontend de respaldo está funcionando en Vercel 🎉
