# 🤖 Agente Multiagente de Marketing con Agno

Sistema inteligente de marketing que combina investigación de mercado, creación de contenido, estrategias digitales y análisis competitivo usando el framework Agno.

## ✨ Características

- **🔍 Investigación de Mercado**: Análisis de tendencias, competencia y oportunidades usando Apify
- **🎨 Creación de Contenido**: Generación de imágenes y contenido multimedia con ModelsLab
- **📊 Estrategias de Marketing**: Planes integrales basados en datos y mejores prácticas
- **📱 Social Media Management**: Gestión de redes sociales y community management
- **🤖 IA Conversacional**: Interfaz natural en español para consultas de marketing

## 🛠️ Tecnologías

- **Agno Framework**: Sistema multiagente con delegación inteligente
- **Apify**: Web scraping y extracción de datos (4000+ herramientas)
- **ModelsLab**: Generación de imágenes y contenido multimedia
- **Groq**: Modelo de IA rápido y eficiente (Llama 3)
- **SQLAlchemy**: Base de datos local para persistencia

## 📦 Instalación

1. **Instalar dependencias**:
```bash
pip install -r requirements.txt
```

2. **Configurar APIs**:
```bash
cp .env.example .env
# Edita .env con tus claves API
```

3. **Variables de entorno requeridas**:
```env
GROQ_API_KEY=tu_clave_groq
APIFY_API_TOKEN=tu_token_apify  # Opcional
```

## 🚀 Uso

### Uso Básico

```python
from agents.marketing_team import MarketingTeam

# Inicializar equipo
team = MarketingTeam()

# Análisis completo de marketing
analysis = team.run_marketing_analysis(
    "Mi startup de e-commerce",
    "Aumentar ventas en 300%"
)

# Generar campaña de contenido
campaign = team.generate_content_campaign(
    "Marketing digital para startups",
    ["LinkedIn", "Instagram", "Twitter"]
)

# Análisis competitivo
competition = team.analyze_competition(
    "SaaS para restaurantes",
    ["Uber Eats", "DoorDash", "Grubhub"]
)
```

### Funciones Disponibles

#### `run_marketing_analysis(business, goals)`
Análisis completo de marketing para un negocio específico.

#### `generate_content_campaign(topic, platforms, duration_days=30)`
Crea una campaña de contenido completa con calendario y estrategias.

#### `analyze_competition(industry, competitors)`
Análisis competitivo detallado con insights accionables.

#### `create_social_media_strategy(brand, audience, goals)`
Estrategia completa de redes sociales.

## 🧪 Pruebas

Ejecuta las pruebas básicas:

```bash
cd agents
python test_marketing.py
```

## 📋 Estructura del Equipo

```
Marketing Intelligence Team
├── 📊 Market Research Specialist
│   ├── Apify Web Browser
│   ├── Google Places Crawler
│   └── TikTok Scraper
├── 🎨 Content Creator
│   ├── ModelsLab Image Generation
│   ├── Content Ideas Generator
│   └── Website Content Crawler
├── 🎯 Marketing Strategist
│   ├── Strategy Creator
│   ├── Google Search Scraper
│   └── Places Analysis
└── 📱 Social Media Manager
    ├── TikTok/Instagram/Twitter Scrapers
    └── Image Generation Tools
```

## 🔧 Configuración Avanzada

### Agentes Especializados

Cada agente tiene herramientas específicas:

- **Market Research**: Enfocado en datos cuantitativos y tendencias
- **Content Creator**: Creatividad y adaptación a plataformas
- **Marketing Strategist**: ROI y métricas medibles
- **Social Media**: Engagement y algoritmos de plataformas

### Personalización

Modifica los prompts en `marketing_team.py` para adaptar el comportamiento:

```python
instructions=[
    "Eres un estratega de marketing especializado en...",
    # Añade instrucciones específicas
]
```

## 📊 APIs Requeridas

### Obligatorias
- **Groq API**: Para el procesamiento de lenguaje natural

### Opcionales (mejoran funcionalidad)
- **Apify API**: Web scraping avanzado
- **ModelsLab API**: Generación de imágenes

## 🎯 Casos de Uso

- **Startups**: Estrategias de lanzamiento y growth hacking
- **E-commerce**: Optimización de conversión y marketing de producto
- **SaaS**: Lead generation y customer acquisition
- **Consultoras**: Análisis de mercado y posicionamiento
- **Agencias**: Creación de campañas integrales

## 🔄 Integración con WhatsApp

Este agente puede integrarse con el sistema de WhatsApp existente para consultas de marketing en tiempo real.

## 📈 Métricas de Éxito

- ROI de campañas generado
- Leads cualificados generados
- Engagement en redes sociales
- Posicionamiento SEO mejorado
- Conversion rates optimizados

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Añade tests para nuevas funcionalidades
4. Envía un pull request

## 📄 Licencia

Este proyecto es parte de LovableGrowth - Todos los derechos reservados.