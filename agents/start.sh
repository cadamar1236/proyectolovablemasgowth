#!/bin/sh

# Script de inicio para Railway
# Maneja el puerto dinámicamente asignado por Railway

# Usar el puerto asignado por Railway o 8000 por defecto
PORT=${PORT:-8000}

echo "Starting server on port $PORT"

# Ejecutar uvicorn con el puerto correcto
exec uvicorn main:app --host 0.0.0.0 --port $PORT