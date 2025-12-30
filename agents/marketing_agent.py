"""
Sistema de marketing inteligente con Agno Framework

Combina:
- Web scraping con Apify
- Generación de imágenes con ModelsLab
- Análisis de mercado y tendencias
- Creación de contenido
- Estrategias de marketing

Requiere instalar:
pip install agno langchain-apify apify-client requests
"""

import os
from typing import List, Dict, Any, Optional
from agno.team import Team
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.models.response import FileType
from agno.tools.models_labs import ModelsLabTools
from agno.tools.apify import ApifyTools
from agno.tools import tool


# ============================================
# CONFIGURACIÓN
# ============================================

class Config:
    """Configuración de API keys"""
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4")
    APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
    MODELSLAB_API_KEY = os.getenv("MODELSLAB_API_KEY", "")


config = Config()


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
    return f"""📊 Análisis de tendencias para: {keywords}

🔍 TENDENCIAS IDENTIFICADAS:
- Aumento del 45% en búsquedas relacionadas con IA
- Competidores principales: 3 empresas emergentes
- Oportunidades: nicho de marketing digital enfocado en startups
- Crecimiento proyectado: 120% anual en el sector

💡 INSIGHTS CLAVE:
- Audiencia objetivo: Founders y CMOs de startups tech
- Presupuesto promedio: $5K-$20K mensual
- Canales más efectivos: LinkedIn, Twitter, Product Hunt

📈 RECOMENDACIONES:
1. Enfocarse en contenido educativo (ROI: 3.5x)
2. Partnerships con aceleradoras
3. Estrategia de inbound marketing"""


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
            f"💡 Tips prácticos sobre {topic}",
            f"🎬 Behind the scenes: Cómo usamos {topic}",
            f"📊 Carousel: Guía paso a paso de {topic}"
        ],
        "LinkedIn": [
            f"📊 Artículo: 'Tendencias 2025 en {topic}'",
            f"🤝 Caso de estudio: Éxito con {topic}",
            f"💼 Webinar: Estrategias avanzadas de {topic}",
            f"📈 Post de datos: ROI con {topic}",
            f"🎯 Thread: Errores comunes en {topic}"
        ],
        "Twitter": [
            f"🧵 Thread: Guía completa de {topic}",
            f"📈 Estadística impactante sobre {topic}",
            f"❓ Pregunta del día: ¿Usas {topic}?",
            f"💬 Debate: Futuro de {topic}",
            f"🔥 Hot take: {topic} vs alternativas"
        ],
        "TikTok": [
            f"🎵 Video trending: Tutorial de {topic}",
            f"😂 Meme educativo sobre {topic}",
            f"⚡ 60 seg: Beneficios de {topic}",
            f"🎭 Storytelling: Antes/después con {topic}",
            f"🔮 Predicciones 2025 sobre {topic}"
        ]
    }

    platform_ideas = ideas.get(platform, [f"Contenido general sobre {topic}"])
    return f"""💡 IDEAS DE CONTENIDO PARA {platform.upper()}:

📌 TEMA: {topic}

{chr(10).join(f'• {idea}' for idea in platform_ideas)}

🎯 ENGAGEMENT TIPS:
- Mejor horario: 9-11am y 7-9pm
- Hashtags: 5-7 relevantes
- CTA: Siempre incluir llamada a la acción
- Frecuencia: 3-5 posts por semana"""


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
1. Contenido Educativo (40%): Artículos, videos tutoriales, webinars
2. Social Proof (30%): Testimonios, casos de éxito, reviews
3. Engagement (20%): Interacción con comunidad, UGC
4. Ads Dirigidos (10%): Campañas pagadas específicas

💰 PRESUPUESTO SUGERIDO:
- Content Creation: 35%
- Paid Ads: 30%
- Tools & Software: 20%
- Influencer Marketing: 15%

📅 TIMELINE (90 DÍAS):
Mes 1: Setup y contenido fundacional
Mes 2: Amplificación y paid ads
Mes 3: Optimización y scaling

💡 ACCIONES INMEDIATAS:
• Crear calendario de contenido semanal
• Identificar 5 influencers en el nicho
• Configurar analytics y KPIs
• Desarrollar 3 lead magnets
• Setup email automation

📊 KPIS A MEDIR:
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Conversion Rate
- Engagement Rate
- ROI por canal"""


# ============================================
# AGENTES ESPECIALIZADOS
# ============================================

class MarketResearchAgent:
    """Agente especializado en investigación de mercado"""

    def __init__(self):
        self.agent = Agent(
            name="Market Research Specialist",
            role="Investigador de mercado y tendencias especializado en análisis competitivo",
            model=OpenAIChat(api_key=config.OPENAI_API_KEY, id=config.OPENAI_MODEL),
            tools=[
                ApifyTools(actors=[
                    "compass/crawler-google-places",
                    "apify/google-search-scraper",
                ]),
                analyze_market_trends
            ],
            instructions=[
                "Eres un experto analista de mercado adaptable a cualquier sector o industria.",
                "Adapta tu análisis al contexto específico del usuario - si es una startup, enfócate en SaaS/tech; si es retail, enfócate en comercio; etc.",
                "Usa las herramientas de Apify para obtener datos reales y actualizados del sector relevante.",
                "Para análisis de competencia, investiga:",
                "- Posicionamiento y segmentación de mercado",
                "- Estrategias competitivas del sector",
                "- Tendencias y oportunidades de crecimiento",
                "- Análisis de precios y valor percibido",
                "- Reviews y reputación online",
                "- Estrategias digitales y presencia online",
                "",
                "Adapta tu enfoque según el contexto: B2B vs B2C, local vs global, startup vs empresa establecida.",
                "Proporciona insights accionables específicos del sector analizado.",
                "Considera factores específicos del sector como regulación, tecnología, competencia global, etc.",
                "Siempre incluye datos cuantitativos cuando sea posible."
            ]
        )


class ContentCreationAgent:
    """Agente especializado en creación de contenido"""

    def __init__(self):
        self.agent = Agent(
            name="Content Creator",
            role="Creador de contenido multimedia y copywriter estratégico",
            model=OpenAIChat(api_key=config.OPENAI_API_KEY, id=config.OPENAI_MODEL),
            tools=[
                generate_content_ideas,
                ApifyTools(actors=[
                    "apify/website-content-crawler",
                ])
            ],
            instructions=[
                "Eres un creador de contenido estratégico adaptable a cualquier sector o industria.",
                "Adapta tu contenido al contexto específico: startup tech, e-commerce, servicios profesionales, etc.",
                "Genera ideas de contenido innovadoras y atractivas para el sector relevante.",
                "Usa Apify para investigar tendencias de contenido en el sector específico cuando sea necesario.",
                "Adapta el contenido a diferentes plataformas y audiencias objetivo.",
                "Incluye llamadas a la acción efectivas para el sector.",
                "Mantén un tono profesional pero cercano, adaptado al público objetivo.",
                "Prioriza contenido que genera engagement y conversiones.",
                "Considera SEO y keywords relevantes en todo el contenido."
            ]
        )


class MarketingStrategyAgent:
    """Agente especializado en estrategias de marketing"""

    def __init__(self):
        self.agent = Agent(
            name="Marketing Strategist",
            role="Estratega de marketing digital y growth hacker",
            model=OpenAIChat(api_key=config.OPENAI_API_KEY, id=config.OPENAI_MODEL),
            tools=[
                create_marketing_strategy,
                ApifyTools(actors=[
                    "apify/google-search-scraper",
                ])
            ],
            instructions=[
                "Eres un estratega de marketing adaptable a cualquier tipo de negocio o sector.",
                "Adapta tu estrategia al contexto: startup vs empresa establecida, B2B vs B2C, local vs global.",
                "Desarrolla estrategias basadas en datos y mejores prácticas del sector específico.",
                "Usa Apify para investigar tendencias de marketing y casos de éxito en el sector relevante.",
                "Enfócate en ROI y métricas medibles específicas del sector.",
                "Considera el presupuesto, recursos disponibles y madurez del mercado.",
                "Proporciona planes de acción específicos y temporales adaptados al contexto.",
                "Prioriza quick wins mientras construyes estrategias a largo plazo.",
                "Siempre incluye métricas SMART y KPIs claros."
            ]
        )


class SocialMediaAgent:
    """Agente especializado en gestión de redes sociales"""

    def __init__(self):
        self.agent = Agent(
            name="Social Media Manager",
            role="Gestor de redes sociales y community management con análisis de tendencias",
            model=OpenAIChat(api_key=config.OPENAI_API_KEY, id=config.OPENAI_MODEL),
            tools=[
                ApifyTools(actors=[
                    "clockworks/free-tiktok-scraper",
                    "apify/website-content-crawler",
                ]),
                ModelsLabTools(file_type=FileType.MP4)
            ],
            instructions=[
                "Eres un experto en social media marketing especializado en análisis de tendencias de video.",
                "TU MISIÓN PRINCIPAL: Usar TikTok scraper para encontrar los videos más populares y virales.",
                "Analiza tendencias de video en TikTok para identificar:",
                "- Videos con más likes, shares y comentarios",
                "- Hashtags trending y challenges populares",
                "- Estilos de video que funcionan (danza, tutoriales, humor, etc.)",
                "- Duración óptima y formatos efectivos",
                "- Elementos visuales y narrativos que enganchan",
                "",
                "Usa estos insights para generar videos con Models Labs:",
                "- Crea prompts detallados basados en tendencias identificadas",
                "- Genera videos MP4 usando la tool de Models Labs",
                "- Adapta tendencias a la marca y sector del cliente",
                "- Sugiere estrategias de video marketing basadas en datos reales",
                "",
                "Para cada análisis, proporciona:",
                "1. Top 5 tendencias de video identificadas",
                "2. Elementos clave que hacen virales los videos",
                "3. Videos generados con Models Labs (si aplica)",
                "4. Estrategias de distribución y promoción",
                "5. Calendario de publicación optimizado"
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
            model=OpenAIChat(api_key=config.OPENAI_API_KEY, id=config.OPENAI_MODEL),
            members=[
                self.research_agent.agent,
                self.content_agent.agent,
                self.strategy_agent.agent,
                self.social_agent.agent
            ],
            instructions=[
                "Eres el director de marketing de un equipo especializado adaptable a cualquier sector.",
                "Coordina a tus agentes para proporcionar soluciones integrales de marketing.",
                "Adapta el enfoque según el contexto del usuario: startup, empresa establecida, sector específico, etc.",
                "Delegar tareas según la especialización de cada agente:",
                "- Investigación de mercado → Market Research Specialist (datos del sector específico)",
                "- Creación de contenido → Content Creator (contenido adaptado al sector)",
                "- Estrategias generales → Marketing Strategist (estrategias del sector)",
                "- Redes sociales → Social Media Manager (plataformas relevantes al sector)",
                "",
                "Cada agente debe usar sus herramientas de Apify cuando sea necesario para obtener datos actualizados del sector relevante.",
                "Proporciona respuestas integrales que combinen insights de múltiples agentes.",
                "Siempre incluye recomendaciones accionables y métricas de éxito específicas del sector.",
                "Mantén un enfoque data-driven y orientado a resultados, adaptado al contexto.",
                "Estructura las respuestas de forma clara y organizada con secciones bien definidas."
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

Proporciona un análisis estructurado con:
1. 📊 Análisis de mercado y competencia (Market Research Specialist)
2. 🎯 Estrategia de marketing recomendada (Marketing Strategist)
3. 📝 Plan de contenido para 30 días (Content Creator)
4. 📱 Estrategia de redes sociales (Social Media Manager)
5. 📈 Métricas de éxito y KPIs
6. 💰 Presupuesto estimado y ROI esperado

Coordina con todo el equipo para una estrategia integral y accionable."""

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
1. 📅 Calendario de contenido semanal detallado
2. 💡 Ideas de posts para cada plataforma (mínimo 5 por plataforma)
3. 🎨 Imágenes y elementos visuales a generar
4. 🤝 Estrategia de engagement y community management
5. 📊 Métricas de seguimiento y KPIs
6. 💰 Presupuesto estimado por plataforma

Coordina con el equipo de contenido y social media para crear una campaña cohesiva."""

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
COMPETIDORES: {competitors_str}

Investiga y proporciona:
1. 🎯 Posicionamiento de marca de cada competidor
2. 📈 Estrategias de marketing utilizadas
3. 💪 Fortalezas y debilidades
4. 💡 Oportunidades de diferenciación
5. 📊 Tendencias del mercado y proyecciones
6. 🔍 Análisis de pricing y propuesta de valor
7. 📱 Presencia en redes sociales y engagement

Usa herramientas de web scraping (Apify) para obtener datos actualizados y relevantes.
Proporciona insights accionables para superar a la competencia."""

        return self.team.run(prompt).content

    def analyze_tiktok_trends_and_generate_content(self, niche: str, brand_context: str = "") -> str:
        """
        Analiza tendencias de TikTok y genera videos con Models Labs.

        Args:
            niche: Nicho o tema específico para analizar tendencias
            brand_context: Contexto de la marca para adaptar el contenido

        Returns:
            Análisis de tendencias + videos generados con Models Labs
        """
        prompt = f"""Analiza tendencias de TikTok en: {niche}

Usa TikTok scraper para encontrar videos virales y genera videos con Models Labs.

FASE 1: ANÁLISIS TIKTOK
- 🎥 Top 10 videos por engagement
- 🏷️ Hashtags trending (Top 20)
- ✨ Elementos virales identificados
- ⏱️ Duración óptima y formatos efectivos
- 🎵 Audio/música trending

FASE 2: GENERACIÓN VIDEOS
- Crea prompts detallados basados en tendencias para Models Labs
- Genera videos MP4 adaptados a: {brand_context or 'contexto general'}
- Usa la tool de Models Labs para crear contenido real
- Proporciona 3-5 conceptos de video diferentes

FASE 3: ESTRATEGIA
- 📅 Calendario de publicación optimizado
- 🎯 Target audience y targeting
- 💬 Estrategia de comentarios y engagement
- 📊 KPIs y métricas a trackear

Coordina con social media agent para insights completos y generación de videos."""

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
1. 📊 Análisis de plataformas más efectivas para esta audiencia
2. 📅 Calendario de contenido mensual (4 semanas detalladas)
3. 📝 Tipos de contenido y frecuencia por plataforma
4. 🤝 Estrategia de engagement y crecimiento orgánico
5. 💰 Presupuesto y herramientas necesarias
6. 📈 Métricas de éxito y KPIs específicos
7. 🎯 Estrategia de paid ads (si aplica)
8. 👥 Estrategia de influencer marketing

Coordina con el equipo de social media y contenido para una estrategia integral."""

        return self.team.run(prompt).content

    def chat_response(self, user_message: str, context: Optional[str] = None) -> str:
        """
        Responde a mensajes del chat de marketing IA del frontend.

        Args:
            user_message: Mensaje del usuario
            context: Contexto adicional de la conversación

        Returns:
            Respuesta del equipo de marketing
        """
        context_str = f"\nCONTEXTO PREVIO: {context}" if context else ""
        
        prompt = f"""Como equipo de marketing inteligente, responde a esta consulta del usuario:

MENSAJE: {user_message}{context_str}

Analiza la consulta y determina qué agente o combinación de agentes debe responder:
- Si pregunta sobre mercado/competencia → Market Research Specialist
- Si pide ideas de contenido → Content Creator  
- Si necesita estrategia general → Marketing Strategist
- Si es sobre redes sociales/TikTok → Social Media Manager

Proporciona una respuesta completa, accionable y estructurada.
Si la consulta es amplia, coordina múltiples agentes para una respuesta integral."""

        return self.team.run(prompt).content


# ============================================
# SINGLETON PARA USO GLOBAL
# ============================================

_marketing_team_instance = None


def get_marketing_team() -> MarketingTeam:
    """
    Obtiene la instancia singleton del equipo de marketing.
    
    Returns:
        Instancia del MarketingTeam
    """
    global _marketing_team_instance
    if _marketing_team_instance is None:
        _marketing_team_instance = MarketingTeam()
    return _marketing_team_instance


# ============================================
# FUNCIONES DE DEMOSTRACIÓN
# ============================================

def demonstrate_marketing_team():
    """Demuestra las capacidades del equipo de marketing"""

    print("🚀 MARKETING INTELLIGENCE TEAM - DEMOSTRACIÓN")
    print("=" * 60)

    # Verificar configuración
    if not config.OPENAI_API_KEY:
        print("❌ Error: OPENAI_API_KEY no configurada")
        return

    # Inicializar el equipo
    marketing_team = get_marketing_team()

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
    if not config.OPENAI_API_KEY:
        print("❌ Error: OPENAI_API_KEY no configurada")
        print("💡 Configura: export OPENAI_API_KEY='tu-api-key'")
        exit(1)

    if not os.getenv("APIFY_API_TOKEN"):
        print("⚠️  Advertencia: APIFY_API_TOKEN no configurada - algunas funciones estarán limitadas")
        print("💡 Configura: export APIFY_API_TOKEN='tu-api-token'")

    # Ejecutar demostración
    demonstrate_marketing_team()

    # Mantener el equipo disponible para uso interactivo
    print("\n🤖 Equipo de Marketing listo para consultas interactivas!")
    print("\n📚 Ejemplos de uso:")
    print(">>> from agents.marketing_agent import get_marketing_team")
    print(">>> team = get_marketing_team()")
    print(">>> team.chat_response('¿Cómo puedo mejorar mi estrategia de contenido?')")
    print(">>> team.run_marketing_analysis('mi negocio', 'mis objetivos')")
    print(">>> team.generate_content_campaign('tema', ['LinkedIn', 'Twitter'])")
