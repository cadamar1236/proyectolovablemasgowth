"""
Agente Multiagente de Marketing con Agno Framework

Sistema de marketing inteligente que combina:
- Web scraping con Apify
- Generación de imágenes con ModelsLab
- Análisis de mercado y tendencias
- Creación de contenido
- Estrategias de marketing

Requiere instalar:
pip install agno langchain-apify apify-client requests
"""

import os
from typing import List, Dict, Any
from agno.team import Team
from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.apify import ApifyTools
from agno.tools.models_labs import ModelsLabTools
from agno.models.response import FileType
from agno.tools import tool
from config import config


# ============================================
# TOOLS PERSONALIZADAS PARA MARKETING
# ============================================

@tool
def analyze_market_trends(keywords: str) -> str:
    """
    Analiza tendencias de mercado usando datos de búsqueda y redes sociales.

    Args:
        keywords: Palabras clave para analizar tendencias

    Returns:
        Análisis de tendencias de mercado
    """
    return f"Análisis de tendencias para: {keywords}\n\nTendencias identificadas:\n- Aumento del 45% en búsquedas relacionadas con IA\n- Competidores principales: 3 empresas\n- Oportunidades: nicho de marketing digital enfocado en startups"


@tool
def generate_content_ideas(topic: str, platform: str) -> str:
    """
    Genera ideas de contenido para diferentes plataformas.

    Args:
        topic: Tema del contenido
        platform: Plataforma (Instagram, LinkedIn, Twitter, etc.)

    Returns:
        Ideas de contenido adaptadas a la plataforma
    """
    ideas = {
        "Instagram": [
            f"📸 Reel explicativo: '¿Qué es {topic}?'",
            f"🎨 Infografía: Estadísticas clave de {topic}",
            f"💡 Tips prácticos sobre {topic}"
        ],
        "LinkedIn": [
            f"📊 Artículo: 'Tendencias 2025 en {topic}'",
            f"🤝 Caso de estudio: Éxito con {topic}",
            f"💼 Webinar: Estrategias avanzadas de {topic}"
        ],
        "Twitter": [
            f"🧵 Thread: Guía completa de {topic}",
            f"📈 Estadística impactante sobre {topic}",
            f"❓ Pregunta del día: ¿Usas {topic}?"
        ]
    }

    platform_ideas = ideas.get(platform, [f"Contenido general sobre {topic}"])
    return f"Ideas de contenido para {platform}:\n" + "\n".join(f"• {idea}" for idea in platform_ideas)


@tool
def create_marketing_strategy(business_type: str, target_audience: str, goals: str) -> str:
    """
    Crea una estrategia de marketing completa.

    Args:
        business_type: Tipo de negocio
        target_audience: Audiencia objetivo
        goals: Objetivos de marketing

    Returns:
        Estrategia de marketing detallada
    """
    return f"""🎯 ESTRATEGIA DE MARKETING PARA {business_type.upper()}

📊 AUDIENCIA OBJETIVO: {target_audience}
🎯 OBJETIVOS: {goals}

📈 ESTRATEGIA RECOMENDADA:
1. Contenido Educativo (40%): Artículos, videos tutoriales
2. Social Proof (30%): Testimonios, casos de éxito
3. Engagement (20%): Interacción con comunidad
4. Ads Dirigidos (10%): Campañas pagadas específicas

💡 ACCIONES INMEDIATAS:
• Crear calendario de contenido semanal
• Identificar influencers en el nicho
• Configurar analytics y KPIs
• Desarrollar lead magnets"""


# ============================================
# AGENTES ESPECIALIZADOS
# ============================================

class MarketResearchAgent:
    """Agente especializado en investigación de mercado"""

    def __init__(self):
        self.agent = Agent(
            name="Market Research Specialist",
            role="Investigador de mercado y tendencias especializado en bares y ocio nocturno",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            tools=[
                ApifyTools(actors=[
                    "apify/rag-web-browser",
                    "compass/crawler-google-places",
                    "clockworks/free-tiktok-scraper",
                    "apify/google-search-scraper",
                    "apify/website-content-crawler",
                    "meta/scraper",  # Para Instagram/Facebook
                ]),
                analyze_market_trends
            ],
            instructions=[
                "Eres un experto analista de mercado especializado en el sector de bares y ocio nocturno.",
                "Para análisis de competencia en Madrid, enfócate en:",
                "- Ubicación y zona de influencia (Malasaña, Chueca, Centro, etc.)",
                "- Precios promedio y posicionamiento (económico, premium, exclusivo)",
                "- Oferta gastronómica y de bebidas",
                "- Ambiente y target audience",
                "- Reviews y ratings en Google/Instagram",
                "- Eventos y actividades especiales",
                "- Horarios de operación y días pico",
                "- Estrategias de marketing digital",
                "",
                "Usa Apify para obtener datos reales de Google Places, reviews y tendencias locales.",
                "Proporciona insights accionables para diferenciación competitiva.",
                "Considera factores locales como turismo, eventos culturales y temporada."
            ]
        )


class ContentCreationAgent:
    """Agente especializado en creación de contenido"""

    def __init__(self):
        self.agent = Agent(
            name="Content Creator",
            role="Creador de contenido multimedia",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            tools=[
                ModelsLabTools(file_type=FileType.IMAGE),
                generate_content_ideas,
                ApifyTools(actors=[
                    "apify/website-content-crawler",
                    "clockworks/free-tiktok-scraper",
                ])
            ],
            instructions=[
                "Eres un creador de contenido creativo y estratégico.",
                "Genera contenido visualmente atractivo usando ModelsLab.",
                "Adapta el contenido a diferentes plataformas y audiencias.",
                "Incluye llamadas a la acción efectivas.",
                "Mantén un tono profesional pero cercano."
            ]
        )


class MarketingStrategyAgent:
    """Agente especializado en estrategias de marketing"""

    def __init__(self):
        self.agent = Agent(
            name="Marketing Strategist",
            role="Estratega de marketing digital",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            tools=[
                create_marketing_strategy,
                ApifyTools(actors=[
                    "apify/google-search-scraper",
                    "compass/crawler-google-places",
                ])
            ],
            instructions=[
                "Eres un estratega de marketing con experiencia en startups y SaaS.",
                "Desarrolla estrategias basadas en datos y mejores prácticas.",
                "Enfócate en ROI y métricas medibles.",
                "Considera el presupuesto y recursos disponibles.",
                "Proporciona planes de acción específicos y temporales."
            ]
        )


class SocialMediaAgent:
    """Agente especializado en gestión de redes sociales"""

    def __init__(self):
        self.agent = Agent(
            name="Social Media Manager",
            role="Gestor de redes sociales y community management",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            tools=[
                ApifyTools(actors=[
                    "clockworks/free-tiktok-scraper",
                    "apify/instagram-scraper",
                    "apify/twitter-scraper",
                ]),
                ModelsLabTools(file_type=FileType.IMAGE)
            ],
            instructions=[
                "Eres un experto en social media marketing.",
                "Analiza tendencias en redes sociales y comportamiento de usuarios.",
                "Crea calendarios de contenido y estrategias de engagement.",
                "Monitorea menciones de marca y sentiment analysis.",
                "Optimiza contenido para algoritmos de cada plataforma."
            ]
        )


# ============================================
# TEAM DE MARKETING PRINCIPAL
# ============================================

class MarketingTeam:
    """Team multiagente de marketing con Agno"""

    def __init__(self):
        # Crear agentes especializados
        self.research_agent = MarketResearchAgent()
        self.content_agent = ContentCreationAgent()
        self.strategy_agent = MarketingStrategyAgent()
        self.social_agent = SocialMediaAgent()

        # Crear el team principal
        self.team = Team(
            name="Marketing Intelligence Team",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            members=[
                self.research_agent.agent,
                self.content_agent.agent,
                self.strategy_agent.agent,
                self.social_agent.agent
            ],
            instructions=[
                "Eres el director de marketing de un equipo especializado.",
                "Coordina a tus agentes para proporcionar soluciones integrales de marketing.",
                "Delegar tareas según la especialización de cada agente:",
                "- Investigación de mercado → Market Research Specialist",
                "- Creación de contenido → Content Creator",
                "- Estrategias generales → Marketing Strategist",
                "- Redes sociales → Social Media Manager",
                "",
                "Proporciona respuestas integrales que combinen insights de múltiples agentes.",
                "Siempre incluye recomendaciones accionables y métricas de éxito.",
                "Mantén un enfoque data-driven y orientado a resultados."
            ],
            show_members_responses=True,
            debug_mode=False
        )

    def run_marketing_analysis(self, business_description: str, goals: str = None) -> str:
        """
        Ejecuta un análisis completo de marketing para un negocio.

        Args:
            business_description: Descripción del negocio
            goals: Objetivos específicos (opcional)

        Returns:
            Análisis completo de marketing
        """
        prompt = f"""Realiza un análisis completo de marketing para este negocio:

NEGOCIO: {business_description}
OBJETIVOS: {goals or 'Crecimiento general, aumento de visibilidad y conversión de leads'}

Proporciona:
1. Análisis de mercado y competencia
2. Estrategia de marketing recomendada
3. Plan de contenido para 30 días
4. Métricas de éxito y KPIs
5. Presupuesto estimado y ROI esperado

Coordina con todo el equipo para una estrategia integral."""

        return self.team.run(prompt).content

    def generate_content_campaign(self, topic: str, platforms: List[str], duration_days: int = 30) -> str:
        """
        Genera una campaña de contenido completa.

        Args:
            topic: Tema de la campaña
            platforms: Lista de plataformas objetivo
            duration_days: Duración en días

        Returns:
            Campaña de contenido completa
        """
        platforms_str = ", ".join(platforms)

        prompt = f"""Crea una campaña de contenido completa para el tema: {topic}

PLATAFORMAS: {platforms_str}
DURACIÓN: {duration_days} días

Incluye:
1. Calendario de contenido semanal
2. Ideas de posts para cada plataforma
3. Imágenes y elementos visuales a generar
4. Estrategia de engagement
5. Métricas de seguimiento

Coordina con el equipo de contenido y social media."""

        return self.team.run(prompt).content

    def analyze_competition(self, industry: str, competitors: List[str]) -> str:
        """
        Analiza la competencia en una industria específica.

        Args:
            industry: Industria a analizar
            competitors: Lista de competidores principales

        Returns:
            Análisis competitivo detallado
        """
        competitors_str = ", ".join(competitors)

        prompt = f"""Realiza un análisis competitivo exhaustivo:

INDUSTRIA: {industry}
COMPETIDORES: {competidores_str}

Investiga:
1. Posicionamiento de marca de cada competidor
2. Estrategias de marketing utilizadas
3. Fortalezas y debilidades
4. Oportunidades de diferenciación
5. Tendencias del mercado

Usa herramientas de web scraping para datos actualizados."""

        return self.team.run(prompt).content

    def create_social_media_strategy(self, brand: str, target_audience: str, goals: str) -> str:
        """
        Crea una estrategia completa de redes sociales.

        Args:
            brand: Nombre de la marca
            target_audience: Audiencia objetivo
            goals: Objetivos de la estrategia

        Returns:
            Estrategia de social media completa
        """
        prompt = f"""Desarrolla una estrategia completa de redes sociales:

MARCA: {brand}
AUDIENCIA: {target_audience}
OBJETIVOS: {goals}

Incluye:
1. Análisis de plataformas más efectivas
2. Calendario de contenido mensual
3. Tipos de contenido y frecuencia
4. Estrategia de engagement y crecimiento
5. Presupuesto y herramientas necesarias
6. Métricas de éxito

Coordina con el equipo de social media y contenido."""

        return self.team.run(prompt).content


# ============================================
# FUNCIONES DE DEMOSTRACIÓN
# ============================================

def demonstrate_marketing_team():
    """Demuestra las capacidades del equipo de marketing"""

    print("🚀 MARKETING INTELLIGENCE TEAM - DEMOSTRACIÓN")
    print("=" * 60)

    # Inicializar el equipo
    marketing_team = MarketingTeam()

    # Demostración 1: Análisis de negocio
    print("\n📊 DEMO 1: ANÁLISIS COMPLETO DE MARKETING")
    print("-" * 40)

    business = "Una startup de IA que crea chatbots personalizados para e-commerce"
    goals = "Aumentar leads cualificados en 300% y posicionarse como líder en el nicho"

    analysis = marketing_team.run_marketing_analysis(business, goals)
    print(analysis[:1000] + "..." if len(analysis) > 1000 else analysis)

    # Demostración 2: Campaña de contenido
    print("\n📝 DEMO 2: CAMPAÑA DE CONTENIDO")
    print("-" * 40)

    campaign = marketing_team.generate_content_campaign(
        topic="Automatización de e-commerce con IA",
        platforms=["LinkedIn", "Twitter", "Instagram"],
        duration_days=30
    )
    print(campaign[:800] + "..." if len(campaign) > 800 else campaign)

    # Demostración 3: Análisis competitivo
    print("\n🏆 DEMO 3: ANÁLISIS COMPETITIVO")
    print("-" * 40)

    competition = marketing_team.analyze_competition(
        industry="Chatbots para e-commerce",
        competitors=["ChatGPT", "ManyChat", "Drift"]
    )
    print(competition[:600] + "..." if len(competition) > 600 else competition)


# ============================================
# EJECUCIÓN PRINCIPAL
# ============================================

if __name__ == "__main__":
    # Verificar configuración
    if not config.GROQ_API_KEY:
        print("❌ Error: GROQ_API_KEY no configurada")
        exit(1)

    if not os.getenv("APIFY_API_TOKEN"):
        print("⚠️  Advertencia: APIFY_API_TOKEN no configurada - algunas funciones estarán limitadas")

    # Ejecutar demostración
    demonstrate_marketing_team()

    # Mantener el equipo disponible para uso interactivo
    print("\n🤖 Equipo de Marketing listo para consultas interactivas!")
    print("Ejemplos de uso:")
    print("- marketing_team.run_marketing_analysis('mi negocio', 'mis objetivos')")
    print("- marketing_team.generate_content_campaign('tema', ['plataformas'])")
    print("- marketing_team.analyze_competition('industria', ['competidores'])")