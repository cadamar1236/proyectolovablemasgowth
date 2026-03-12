# ===================================================
# 🚀 Script de Migración de Base de Datos
# Ejecuta la migración 0030_oauth_guest_support.sql
# ===================================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ASTAR* Database Migration" -ForegroundColor Cyan
Write-Host "  OAuth + Guest Mode Support" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Variables de conexión (ajustar según tu configuración)
$DB_HOST = "autorack.proxy.rlwy.net"  # Cambiar por tu host de Railway
$DB_PORT = "12345"                     # Cambiar por tu puerto
$DB_NAME = "railway"                   # Cambiar por tu database name
$DB_USER = "postgres"                  # Cambiar por tu usuario
$DB_PASSWORD = ""                      # Cambiar por tu password

# Archivo de migración
$MIGRATION_FILE = "migrations/0030_oauth_guest_support.sql"

# Verificar que el archivo existe
if (-Not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Error: No se encuentra el archivo $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo de migración: $MIGRATION_FILE" -ForegroundColor Green
Write-Host "🗄️  Base de datos: $DB_NAME@$DB_HOST:$DB_PORT" -ForegroundColor Green
Write-Host ""

# Confirmar antes de ejecutar
$confirmation = Read-Host "¿Ejecutar migración? (s/n)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "❌ Migración cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Ejecutando migración..." -ForegroundColor Yellow

# Opción 1: Usando psql (si está instalado)
Write-Host ""
Write-Host "Opción 1: Usar psql (recomendado)" -ForegroundColor Cyan
Write-Host "Ejecuta este comando en tu terminal:" -ForegroundColor White
Write-Host ""
Write-Host "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE" -ForegroundColor Yellow
Write-Host ""

# Opción 2: Mostrar instrucciones para pgAdmin
Write-Host "Opción 2: Usar pgAdmin" -ForegroundColor Cyan
Write-Host "1. Abre pgAdmin" -ForegroundColor White
Write-Host "2. Conecta a tu servidor PostgreSQL" -ForegroundColor White
Write-Host "3. Selecciona la base de datos '$DB_NAME'" -ForegroundColor White
Write-Host "4. Abre Query Tool (Tools > Query Tool)" -ForegroundColor White
Write-Host "5. Abre el archivo: $MIGRATION_FILE" -ForegroundColor White
Write-Host "6. Ejecuta el script (F5)" -ForegroundColor White
Write-Host ""

# Opción 3: Railway CLI
Write-Host "Opción 3: Usar Railway CLI" -ForegroundColor Cyan
Write-Host "1. Instala Railway CLI: npm i -g @railway/cli" -ForegroundColor White
Write-Host "2. Login: railway login" -ForegroundColor White
Write-Host "3. Link proyecto: railway link" -ForegroundColor White
Write-Host "4. Ejecuta migración:" -ForegroundColor White
Write-Host "   railway run psql -f $MIGRATION_FILE" -ForegroundColor Yellow
Write-Host ""

# Opción 4: DBeaver
Write-Host "Opción 4: Usar DBeaver (GUI)" -ForegroundColor Cyan
Write-Host "1. Descarga DBeaver: https://dbeaver.io/download/" -ForegroundColor White
Write-Host "2. Conecta a PostgreSQL con los datos de Railway" -ForegroundColor White
Write-Host "3. Click derecho en la base de datos > SQL Editor > Execute SQL Script" -ForegroundColor White
Write-Host "4. Selecciona el archivo: $MIGRATION_FILE" -ForegroundColor White
Write-Host "5. Ejecuta el script" -ForegroundColor White
Write-Host ""

# Mostrar contenido del archivo
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📋 Preview del script de migración:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Get-Content $MIGRATION_FILE | Select-Object -First 50
Write-Host ""
Write-Host "... (ver archivo completo en $MIGRATION_FILE)" -ForegroundColor Gray
Write-Host ""

# Verificación post-migración
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Verificación post-migración" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Después de ejecutar la migración, ejecuta estos queries para verificar:" -ForegroundColor White
Write-Host ""
Write-Host "-- Verificar columnas nuevas" -ForegroundColor Gray
Write-Host "SELECT column_name, data_type, is_nullable" -ForegroundColor Yellow
Write-Host "FROM information_schema.columns" -ForegroundColor Yellow
Write-Host "WHERE table_name = 'users'" -ForegroundColor Yellow
Write-Host "  AND column_name IN ('google_id', 'provider', 'avatar_url', 'is_guest');" -ForegroundColor Yellow
Write-Host ""
Write-Host "-- Contar usuarios por tipo" -ForegroundColor Gray
Write-Host "SELECT provider, is_guest, COUNT(*) as total" -ForegroundColor Yellow
Write-Host "FROM users GROUP BY provider, is_guest;" -ForegroundColor Yellow
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Listo! Sigue las instrucciones arriba" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
