"""
Multi-Agent Orchestrator
Coordina todos los agentes del sistema para proporcionar análisis integral de startups
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from agno.agent import Agent
from agno.tools import tool
from agno.team import Team
from agno.models.openai import OpenAIChat

# Import de los equipos de agentes
from metrics_agent import MetricsTeam
from brand_marketing_agent import BrandMarketingTeam
from marketing_agent import MarketingTeam


# ==============================================
# CONFIGURACIÓN
# ==============================================

class OrchestratorConfig:
    """Configuración centralizada para el orquestador"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.apify_token = os.getenv("APIFY_API_TOKEN")
        self.fal_key = os.getenv("FAL_KEY")
        
    def validate(self) -> bool:
        """Valida que las configuraciones mínimas estén presentes"""
        return bool(self.openai_api_key)


# ==============================================
# HERRAMIENTAS DEL ORQUESTADOR
# ==============================================

@tool
def delegate_to_metrics_team(
    startup_url: str,
    metrics_data: Optional[Dict[str, Any]] = None,
    goals: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Delega análisis de métricas al equipo de métricas.
    
    Args:
        startup_url: URL de la startup a analizar
        metrics_data: Datos de métricas actuales (opcional)
        goals: Lista de objetivos a evaluar (opcional)
        
    Returns:
        Análisis completo de métricas
    """
    try:
        metrics_team = MetricsTeam()
        
        # Preparar datos de métricas si no se proporcionan
        if not metrics_data:
            metrics_data = {
                "monthly_users": 0,
                "revenue": 0,
                "growth_rate": 0,
                "churn_rate": 0,
                "cac": 0,
                "ltv": 0,
                "url": startup_url
            }
        
        # Análisis completo
        result = metrics_team.analyze_startup_metrics(
            startup_url=startup_url,
            current_metrics=metrics_data,
            industry="SaaS",  # Default
            stage="seed"  # Default
        )
        
        # Si hay goals, también evaluar progreso
        if goals:
            goal_progress = metrics_team.track_goal_progress(goals)
            result["goal_progress"] = goal_progress
        
        return {
            "success": True,
            "team": "metrics",
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "team": "metrics",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@tool
def delegate_to_brand_team(
    startup_url: str,
    content_types: Optional[List[str]] = None,
    campaign_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Delega generación de marketing visual al equipo de brand.
    
    Args:
        startup_url: URL de la startup para extraer identidad de marca
        content_types: Tipos de contenido a generar (social_post, banner, story, ad)
        campaign_name: Nombre de la campaña (opcional)
        
    Returns:
        Imágenes de marketing generadas
    """
    try:
        brand_team = BrandMarketingTeam()
        
        # Tipos de contenido por defecto
        if not content_types:
            content_types = ["social_post", "story"]
        
        # Nombre de campaña por defecto
        if not campaign_name:
            campaign_name = f"campaign_{datetime.now().strftime('%Y%m%d')}"
        
        # Generar contenido visual
        result = brand_team.generate_brand_marketing(
            website_url=startup_url,
            content_types=content_types,
            campaign_name=campaign_name
        )
        
        return {
            "success": True,
            "team": "brand_marketing",
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "team": "brand_marketing",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@tool
def delegate_to_marketing_team(
    startup_info: Dict[str, Any],
    marketing_task: str
) -> Dict[str, Any]:
    """
    Delega tareas de marketing al equipo de marketing.
    
    Args:
        startup_info: Información de la startup (nombre, descripción, producto, etc.)
        marketing_task: Tipo de tarea (market_research, content_creation, ad_campaign, social_media)
        
    Returns:
        Resultado del equipo de marketing
    """
    try:
        marketing_team = MarketingTeam()
        
        # Delegar según el tipo de tarea
        if marketing_task == "market_research":
            result = marketing_team.conduct_market_research(
                startup_name=startup_info.get("name", "Startup"),
                product_description=startup_info.get("product", ""),
                target_market=startup_info.get("target_market", "general")
            )
        elif marketing_task == "content_creation":
            result = marketing_team.create_content_strategy(
                startup_info=startup_info,
                content_goals=startup_info.get("content_goals", ["awareness", "engagement"])
            )
        elif marketing_task == "ad_campaign":
            result = marketing_team.design_ad_campaign(
                startup_info=startup_info,
                budget=startup_info.get("budget", 1000),
                channels=startup_info.get("channels", ["social", "search"])
            )
        else:
            result = {
                "message": f"Task '{marketing_task}' delegated to marketing team",
                "startup": startup_info.get("name")
            }
        
        return {
            "success": True,
            "team": "marketing",
            "task": marketing_task,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "team": "marketing",
            "task": marketing_task,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@tool
def generate_comprehensive_analysis(
    startup_url: str,
    startup_info: Dict[str, Any],
    metrics_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Genera un análisis integral de la startup usando todos los equipos.
    
    Args:
        startup_url: URL de la startup
        startup_info: Información general de la startup
        metrics_data: Datos de métricas (opcional)
        
    Returns:
        Análisis comprehensivo de todos los equipos
    """
    results = {
        "startup": startup_info.get("name", "Unknown"),
        "url": startup_url,
        "timestamp": datetime.now().isoformat(),
        "analyses": {}
    }
    
    # 1. Análisis de métricas
    try:
        metrics_result = delegate_to_metrics_team(startup_url, metrics_data)
        results["analyses"]["metrics"] = metrics_result
    except Exception as e:
        results["analyses"]["metrics"] = {"error": str(e)}
    
    # 2. Análisis de marca
    try:
        brand_result = delegate_to_brand_team(startup_url, ["social_post"])
        results["analyses"]["brand"] = brand_result
    except Exception as e:
        results["analyses"]["brand"] = {"error": str(e)}
    
    # 3. Análisis de marketing
    try:
        marketing_result = delegate_to_marketing_team(startup_info, "market_research")
        results["analyses"]["marketing"] = marketing_result
    except Exception as e:
        results["analyses"]["marketing"] = {"error": str(e)}
    
    # Calcular score general
    scores = []
    if results["analyses"].get("metrics", {}).get("success"):
        metrics_score = results["analyses"]["metrics"].get("result", {}).get("overall_score", 50)
        scores.append(metrics_score)
    
    results["overall_score"] = sum(scores) / len(scores) if scores else 50
    results["success"] = True
    
    return results


# ==============================================
# AGENTES ESPECIALIZADOS DEL ORQUESTADOR
# ==============================================

class TaskRouterAgent:
    """Agente que determina qué equipo debe manejar cada tarea"""
    
    def __init__(self, config: OrchestratorConfig):
        self.config = config
        self.agent = Agent(
            name="TaskRouter",
            role="Task Routing Specialist",
            model=OpenAIChat(
                id=config.openai_model,
                api_key=config.openai_api_key
            ),
            instructions=[
                "Analiza las solicitudes entrantes y determina qué equipo debe manejarlas",
                "Considera las capacidades de cada equipo:",
                "- MetricsTeam: Análisis de KPIs, benchmarking, tracking de objetivos",
                "- BrandMarketingTeam: Scraping web, identidad de marca, generación de imágenes",
                "- MarketingTeam: Investigación de mercado, contenido, campañas publicitarias",
                "Prioriza eficiencia y calidad en las delegaciones"
            ],
            markdown=True
        )
    
    def route_task(self, task_description: str) -> Dict[str, Any]:
        """Determina a qué equipo enviar la tarea"""
        routing_prompt = f"""
        Analiza esta tarea y determina qué equipo(s) deben manejarla:
        
        Tarea: {task_description}
        
        Equipos disponibles:
        1. metrics - Para análisis de métricas, KPIs, benchmarking
        2. brand_marketing - Para identidad de marca, generación de imágenes con IA
        3. marketing - Para investigación de mercado, contenido, campañas
        
        Responde en formato JSON:
        {{
            "primary_team": "nombre_equipo",
            "secondary_teams": ["equipo1", "equipo2"],
            "reasoning": "explicación breve",
            "priority": "high|medium|low"
        }}
        """
        
        response = self.agent.run(routing_prompt)
        return {
            "routing": response.content,
            "task": task_description
        }


class ResultAggregatorAgent:
    """Agente que consolida y resume resultados de múltiples equipos"""
    
    def __init__(self, config: OrchestratorConfig):
        self.config = config
        self.agent = Agent(
            name="ResultAggregator",
            role="Results Consolidation Specialist",
            model=OpenAIChat(
                id=config.openai_model,
                api_key=config.openai_api_key
            ),
            instructions=[
                "Consolida resultados de múltiples equipos en un reporte unificado",
                "Identifica insights clave y patrones cruzados",
                "Genera recomendaciones priorizadas",
                "Presenta la información de forma clara y accionable"
            ],
            markdown=True
        )
    
    def aggregate_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Agrega y resume resultados de múltiples equipos"""
        prompt = f"""
        Consolida estos resultados de análisis en un reporte ejecutivo:
        
        {results}
        
        Genera un resumen que incluya:
        1. Hallazgos principales (3-5 puntos)
        2. Fortalezas identificadas
        3. Áreas de mejora
        4. Recomendaciones priorizadas (con impacto estimado)
        5. Próximos pasos sugeridos
        """
        
        response = self.agent.run(prompt)
        return {
            "summary": response.content,
            "original_results": results
        }


# ==============================================
# ORQUESTADOR PRINCIPAL
# ==============================================

class MultiAgentOrchestrator:
    """
    Orquestador principal que coordina todos los equipos de agentes.
    Proporciona una interfaz unificada para análisis integral de startups.
    """
    
    def __init__(self):
        self.config = OrchestratorConfig()
        if not self.config.validate():
            raise ValueError("Missing required configuration (OPENAI_API_KEY)")
        
        # Inicializar agentes internos
        self.task_router = TaskRouterAgent(self.config)
        self.result_aggregator = ResultAggregatorAgent(self.config)
        
        # Equipos disponibles
        self.teams = {
            "metrics": MetricsTeam(),
            "brand_marketing": BrandMarketingTeam(),
            "marketing": MarketingTeam()
        }
        
        # Crear el Team orquestador principal
        self.orchestrator = Team(
            name="StartupAnalysisOrchestrator",
            mode="coordinate",
            model=OpenAIChat(
                id=self.config.openai_model,
                api_key=self.config.openai_api_key
            ),
            members=[
                self.task_router.agent,
                self.result_aggregator.agent
            ],
            tools=[
                delegate_to_metrics_team,
                delegate_to_brand_team,
                delegate_to_marketing_team,
                generate_comprehensive_analysis
            ],
            instructions=[
                "Eres el orquestador principal del sistema multi-agente de análisis de startups",
                "Tu rol es coordinar los diferentes equipos para proporcionar análisis integrales",
                "Delega tareas al equipo más apropiado según la naturaleza de la solicitud",
                "Consolida resultados para generar insights accionables",
                "Prioriza la eficiencia y la calidad del análisis"
            ],
            markdown=True,
            show_members_responses=True
        )
    
    def analyze_startup(
        self,
        startup_url: str,
        startup_name: str,
        description: str,
        metrics: Optional[Dict[str, Any]] = None,
        goals: Optional[List[Dict[str, Any]]] = None,
        generate_images: bool = True
    ) -> Dict[str, Any]:
        """
        Análisis integral de una startup usando todos los equipos.
        
        Args:
            startup_url: URL de la startup
            startup_name: Nombre de la startup
            description: Descripción del producto/servicio
            metrics: Datos de métricas actuales (opcional)
            goals: Objetivos a evaluar (opcional)
            generate_images: Si generar imágenes de marketing (default: True)
            
        Returns:
            Análisis completo consolidado
        """
        startup_info = {
            "name": startup_name,
            "url": startup_url,
            "product": description,
            "description": description
        }
        
        results = {
            "startup": startup_name,
            "url": startup_url,
            "timestamp": datetime.now().isoformat(),
            "analyses": {}
        }
        
        # 1. Análisis de métricas
        try:
            metrics_result = self.teams["metrics"].analyze_startup_metrics(
                startup_url=startup_url,
                current_metrics=metrics or {},
                industry="SaaS",
                stage="seed"
            )
            results["analyses"]["metrics"] = {
                "success": True,
                "data": metrics_result
            }
        except Exception as e:
            results["analyses"]["metrics"] = {
                "success": False,
                "error": str(e)
            }
        
        # 2. Generación de imágenes de marketing (si se solicita)
        if generate_images:
            try:
                brand_result = self.teams["brand_marketing"].generate_brand_marketing(
                    website_url=startup_url,
                    content_types=["social_post", "story"],
                    campaign_name=f"{startup_name}_launch"
                )
                results["analyses"]["brand"] = {
                    "success": True,
                    "data": brand_result
                }
            except Exception as e:
                results["analyses"]["brand"] = {
                    "success": False,
                    "error": str(e)
                }
        
        # 3. Investigación de marketing
        try:
            marketing_result = self.teams["marketing"].conduct_market_research(
                startup_name=startup_name,
                product_description=description,
                target_market="general"
            )
            results["analyses"]["marketing"] = {
                "success": True,
                "data": marketing_result
            }
        except Exception as e:
            results["analyses"]["marketing"] = {
                "success": False,
                "error": str(e)
            }
        
        # 4. Consolidar resultados
        consolidated = self.result_aggregator.aggregate_results(results["analyses"])
        results["executive_summary"] = consolidated["summary"]
        
        return results
    
    def generate_marketing_images(
        self,
        startup_url: str,
        content_types: List[str] = None,
        campaign_name: str = None
    ) -> Dict[str, Any]:
        """
        Genera imágenes de marketing para una startup.
        
        Args:
            startup_url: URL para extraer identidad de marca
            content_types: Tipos de contenido (social_post, banner, story, ad)
            campaign_name: Nombre de la campaña
            
        Returns:
            Imágenes generadas con metadatos
        """
        if not content_types:
            content_types = ["social_post", "story", "banner"]
        
        if not campaign_name:
            campaign_name = f"campaign_{datetime.now().strftime('%Y%m%d_%H%M')}"
        
        return self.teams["brand_marketing"].generate_brand_marketing(
            website_url=startup_url,
            content_types=content_types,
            campaign_name=campaign_name
        )
    
    def analyze_metrics(
        self,
        startup_url: str,
        metrics: Dict[str, Any],
        industry: str = "SaaS",
        stage: str = "seed"
    ) -> Dict[str, Any]:
        """
        Analiza métricas de una startup con benchmarking.
        
        Args:
            startup_url: URL de la startup
            metrics: Diccionario con métricas actuales
            industry: Industria para benchmarking
            stage: Etapa de la startup (seed, series_a, etc.)
            
        Returns:
            Análisis de métricas con recomendaciones
        """
        return self.teams["metrics"].analyze_startup_metrics(
            startup_url=startup_url,
            current_metrics=metrics,
            industry=industry,
            stage=stage
        )
    
    def track_goals(self, goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evalúa el progreso hacia objetivos.
        
        Args:
            goals: Lista de objetivos con current_value, target_value, etc.
            
        Returns:
            Análisis de progreso y recomendaciones
        """
        return self.teams["metrics"].track_goal_progress(goals)
    
    def route_request(self, request_description: str) -> Dict[str, Any]:
        """
        Enruta una solicitud al equipo apropiado.
        
        Args:
            request_description: Descripción de lo que se necesita
            
        Returns:
            Información de routing con equipo recomendado
        """
        return self.task_router.route_task(request_description)


# ==============================================
# FUNCIONES DE UTILIDAD
# ==============================================

def create_orchestrator() -> MultiAgentOrchestrator:
    """Factory function para crear el orquestador"""
    return MultiAgentOrchestrator()


def quick_analyze(startup_url: str, startup_name: str, description: str) -> Dict[str, Any]:
    """
    Función de conveniencia para análisis rápido.
    
    Args:
        startup_url: URL de la startup
        startup_name: Nombre de la startup
        description: Descripción breve
        
    Returns:
        Análisis completo
    """
    orchestrator = create_orchestrator()
    return orchestrator.analyze_startup(
        startup_url=startup_url,
        startup_name=startup_name,
        description=description,
        generate_images=False  # Más rápido sin imágenes
    )


# ==============================================
# MAIN (para pruebas)
# ==============================================

if __name__ == "__main__":
    # Test básico del orquestador
    print("Testing Multi-Agent Orchestrator...")
    
    try:
        orchestrator = create_orchestrator()
        print("✓ Orchestrator created successfully")
        
        # Test routing
        routing = orchestrator.route_request(
            "Necesito analizar las métricas de mi startup y generar imágenes para redes sociales"
        )
        print(f"✓ Routing test: {routing}")
        
        print("\n✓ All tests passed!")
    except Exception as e:
        print(f"✗ Error: {e}")
