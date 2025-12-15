@echo off
echo 🚀 Iniciando deploy a Cloudflare Pages...
echo.

echo 📦 Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo 🔨 Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en el build
    pause
    exit /b 1
)

echo 🗄️ Aplicando migraciones de base de datos...
call npx wrangler d1 migrations apply webapp-production
if %errorlevel% neq 0 (
    echo ❌ Error aplicando migraciones
    pause
    exit /b 1
)

echo 🌐 Desplegando a Cloudflare Pages...
call npx wrangler pages deploy dist --project-name webapp
if %errorlevel% neq 0 (
    echo ❌ Error en el deploy
    pause
    exit /b 1
)

echo ✅ Deploy completado exitosamente!
echo.
echo 🔗 Tu aplicación está disponible en: https://webapp.pages.dev
echo.
echo 📱 Para probar WhatsApp:
echo 1. Ve a https://webapp.pages.dev
echo 2. Inicia sesión con Google
echo 3. Ve al Dashboard
echo 4. Genera un código WhatsApp
echo 5. Envía el código por WhatsApp
echo.
pause