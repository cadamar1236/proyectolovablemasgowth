# Dockerfile para desplegar agentes Python en Railway/Render

FROM python:3.11-slim

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero (para cache de Docker)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Puerto que expone la aplicación
EXPOSE 8000

# Script de inicio que maneja el puerto dinámicamente
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
