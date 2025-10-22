#!/bin/bash

# 🚀 Script de Deployment Automático para Cloudflare Pages
# ValidAI Studio - Deployment Helper

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════"
echo "🚀 ValidAI Studio - Cloudflare Pages Deployment"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project name
PROJECT_NAME="validai-studio"

# Step 1: Check authentication
echo -e "${BLUE}[1/6]${NC} Verificando autenticación con Cloudflare..."
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  No estás autenticado con Cloudflare${NC}"
    echo ""
    echo "Por favor ejecuta primero:"
    echo "  wrangler login"
    echo ""
    echo "O si estás en un entorno sin navegador:"
    echo "  wrangler login --browser=false"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Autenticado correctamente${NC}"
echo ""

# Step 2: Check if D1 database exists
echo -e "${BLUE}[2/6]${NC} Verificando base de datos D1..."
if wrangler d1 list | grep -q "webapp-production"; then
    echo -e "${GREEN}✅ Base de datos encontrada${NC}"
else
    echo -e "${YELLOW}⚠️  Base de datos no encontrada${NC}"
    echo ""
    echo "Creando base de datos D1..."
    wrangler d1 create webapp-production
    echo ""
    echo -e "${RED}⚠️  IMPORTANTE:${NC} Copia el 'database_id' que aparece arriba"
    echo "   y actualízalo en wrangler.jsonc"
    echo ""
    read -p "Presiona ENTER después de actualizar wrangler.jsonc..."
fi
echo ""

# Step 3: Apply migrations
echo -e "${BLUE}[3/6]${NC} Aplicando migraciones a producción..."
if wrangler d1 migrations apply webapp-production --remote; then
    echo -e "${GREEN}✅ Migraciones aplicadas correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Algunas migraciones ya estaban aplicadas${NC}"
fi
echo ""

# Step 4: Load seed data
echo -e "${BLUE}[4/6]${NC} ¿Deseas cargar datos de ejemplo?"
read -p "Cargar seed data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cargando datos de ejemplo..."
    wrangler d1 execute webapp-production --remote --file=./seed.sql
    echo -e "${GREEN}✅ Datos de ejemplo cargados${NC}"
fi
echo ""

# Step 5: Build application
echo -e "${BLUE}[5/6]${NC} Construyendo aplicación..."
npm run build
echo -e "${GREEN}✅ Build completado${NC}"
echo ""

# Step 6: Deploy to Cloudflare Pages
echo -e "${BLUE}[6/6]${NC} Desplegando a Cloudflare Pages..."
wrangler pages deploy dist --project-name=$PROJECT_NAME
echo ""

# Success message
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 ¡Deployment exitoso!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Tu aplicación está disponible en:"
echo -e "${BLUE}https://$PROJECT_NAME.pages.dev${NC}"
echo ""
echo "📊 Ver logs en tiempo real:"
echo "   wrangler pages deployment tail --project-name=$PROJECT_NAME"
echo ""
echo "🔧 Ver deployments:"
echo "   wrangler pages deployment list --project-name=$PROJECT_NAME"
echo ""
echo "🌐 Dashboard:"
echo "   https://dash.cloudflare.com"
echo ""
