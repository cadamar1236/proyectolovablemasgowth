# Script de Inicialización Rápida - ValidAI Studio Marketplace
# PowerShell Script para Windows

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   ValidAI Studio - Marketplace Initialization   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$projectPath = "c:\Users\User\Desktop\marketplacesaasbeta\proyectolovablemasgowth"
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: No se encuentra el proyecto en $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath

# Función para mostrar menú
function Show-Menu {
    Write-Host ""
    Write-Host "Selecciona una opción:" -ForegroundColor Yellow
    Write-Host "1. Instalación completa (primera vez)" -ForegroundColor Green
    Write-Host "2. Iniciar servidor de desarrollo (dev rápido)" -ForegroundColor Green
    Write-Host "3. Iniciar en modo sandbox (simula producción)" -ForegroundColor Green
    Write-Host "4. Resetear base de datos" -ForegroundColor Yellow
    Write-Host "5. Ver base de datos (tablas)" -ForegroundColor Cyan
    Write-Host "6. Ver validadores en DB" -ForegroundColor Cyan
    Write-Host "7. Ver productos en DB" -ForegroundColor Cyan
    Write-Host "8. Build para producción" -ForegroundColor Magenta
    Write-Host "9. Salir" -ForegroundColor Red
    Write-Host ""
}

function Install-Complete {
    Write-Host ""
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    
    Write-Host ""
    Write-Host "🗄️  Configurando base de datos local..." -ForegroundColor Yellow
    npm run db:migrate:local
    
    Write-Host ""
    Write-Host "🌱 Cargando datos de ejemplo..." -ForegroundColor Yellow
    npm run db:seed
    
    Write-Host ""
    Write-Host "✅ Instalación completa!" -ForegroundColor Green
    Write-Host "Puedes ahora iniciar el servidor con la opción 2" -ForegroundColor Cyan
}

function Start-DevServer {
    Write-Host ""
    Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
    Write-Host "El servidor estará disponible en: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
    Write-Host ""
    npm run dev
}

function Start-Sandbox {
    Write-Host ""
    Write-Host "📦 Construyendo aplicación..." -ForegroundColor Yellow
    npm run build
    
    Write-Host ""
    Write-Host "🚀 Iniciando servidor sandbox..." -ForegroundColor Yellow
    Write-Host "El servidor estará disponible en: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
    Write-Host ""
    npm run dev:sandbox
}

function Reset-Database {
    Write-Host ""
    Write-Host "⚠️  ADVERTENCIA: Esto eliminará todos los datos!" -ForegroundColor Red
    $confirm = Read-Host "¿Estás seguro? (s/n)"
    
    if ($confirm -eq 's' -or $confirm -eq 'S') {
        Write-Host "🗑️  Reseteando base de datos..." -ForegroundColor Yellow
        npm run db:reset
        Write-Host "✅ Base de datos reseteada!" -ForegroundColor Green
    } else {
        Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
    }
}

function Show-Tables {
    Write-Host ""
    Write-Host "📊 Tablas en la base de datos:" -ForegroundColor Yellow
    wrangler d1 execute webapp-production --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
}

function Show-Validators {
    Write-Host ""
    Write-Host "👥 Validadores en la base de datos:" -ForegroundColor Yellow
    wrangler d1 execute webapp-production --local --command="SELECT v.id, u.name, v.title, v.rating, v.total_validations FROM validators v JOIN users u ON v.user_id = u.id LIMIT 10"
}

function Show-Products {
    Write-Host ""
    Write-Host "📦 Productos en la base de datos:" -ForegroundColor Yellow
    wrangler d1 execute webapp-production --local --command="SELECT id, title, category, stage, status, compensation FROM beta_products LIMIT 10"
}

function Build-Production {
    Write-Host ""
    Write-Host "🏗️  Construyendo para producción..." -ForegroundColor Yellow
    npm run build
    Write-Host ""
    Write-Host "✅ Build completo! Los archivos están en ./dist" -ForegroundColor Green
    Write-Host "Para deployar: npm run deploy" -ForegroundColor Cyan
}

# Bucle principal
do {
    Show-Menu
    $selection = Read-Host "Opción"
    
    switch ($selection) {
        '1' { Install-Complete }
        '2' { Start-DevServer }
        '3' { Start-Sandbox }
        '4' { Reset-Database }
        '5' { Show-Tables }
        '6' { Show-Validators }
        '7' { Show-Products }
        '8' { Build-Production }
        '9' { 
            Write-Host ""
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Cyan
            return
        }
        default {
            Write-Host "Opción inválida. Por favor selecciona 1-9." -ForegroundColor Red
        }
    }
    
    if ($selection -ne '2' -and $selection -ne '3') {
        Write-Host ""
        Write-Host "Presiona Enter para continuar..." -ForegroundColor Gray
        Read-Host
    }
    
} while ($selection -ne '9')
