"""
Metrics Agent - Sistema de análisis de métricas para startups con Agno
======================================================================

Agente especializado en:
- Análisis de métricas de crecimiento (usuarios, revenue, etc.)
- Proyecciones y forecasting
- Generación de insights basados en datos
- Seguimiento de objetivos (goals)
- Benchmarking contra competidores

Se comunica con la base de datos D1 de Cloudflare via API HTTP.

Requiere:
pip install agno openai httpx
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools import tool
import httpx


# ============================================
# CONFIGURACIÓN
# ============================================

@dataclass
class MetricsConfig:
    """Configuration for Metrics Agent"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    astar_api_url: str = os.getenv("ASTAR_API_URL", "https://webapp-46s.pages.dev")
    
    def __post_init__(self):
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")


config = MetricsConfig()


# ============================================
# API CLIENT PARA CLOUDFLARE D1
# ============================================

class MetricsAPIClient:
    """Cliente HTTP para comunicarse con la API de métricas en Cloudflare"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or config.astar_api_url
        self.client = httpx.Client(timeout=30.0)
    
    def _get_headers(self) -> Dict[str, str]:
        """Genera headers para las requests"""
        headers = {
            "Content-Type": "application/json"
        }
        return headers
    
    def get_startup_context(self, user_id: int) -> Dict[str, Any]:
        """
        Obtiene el contexto completo de métricas y goals del usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Contexto completo con métricas, goals, etc.
        """
        try:
            response = self.client.get(
                f"{self.base_url}/api/metrics-data/context",
                headers=self._get_headers(),
                params={"userId": user_id}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}) if data.get("success") else {}
        except Exception as e:
            print(f"[METRICS-API] Error getting context: {e}")
            return {}
    
    def get_goals(self, user_id: int) -> Dict[str, Any]:
        """
        Obtiene los goals del usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Goals con summary
        """
        try:
            response = self.client.get(
                f"{self.base_url}/api/metrics-data/goals",
                headers=self._get_headers(),
                params={"userId": user_id}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error getting goals: {e}")
            return {"success": False, "error": str(e)}
    
    def get_metrics(self, user_id: int, days: int = 90) -> Dict[str, Any]:
        """
        Obtiene el historial de métricas.
        
        Args:
            user_id: ID del usuario
            days: Días de historial
            
        Returns:
            Métricas con historial y growth rates
        """
        try:
            response = self.client.get(
                f"{self.base_url}/api/metrics-data/metrics",
                headers=self._get_headers(),
                params={"userId": user_id, "days": days}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error getting metrics: {e}")
            return {"success": False, "error": str(e)}
    
    def get_benchmarks(self, industry: str = "SaaS", stage: str = "seed") -> Dict[str, Any]:
        """
        Obtiene benchmarks de la industria.
        
        Args:
            industry: Industria (SaaS, fintech, ecommerce)
            stage: Etapa (seed, series_a, series_b)
            
        Returns:
            Benchmarks para comparación
        """
        try:
            response = self.client.get(
                f"{self.base_url}/api/metrics-data/benchmarks",
                headers=self._get_headers(),
                params={"industry": industry, "stage": stage}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error getting benchmarks: {e}")
            return {"success": False, "error": str(e)}
    
    def compare_to_benchmarks(self, user_id: int, industry: str = "SaaS", stage: str = "seed") -> Dict[str, Any]:
        """
        Compara métricas del usuario con benchmarks.
        
        Args:
            user_id: ID del usuario
            industry: Industria
            stage: Etapa
            
        Returns:
            Comparación detallada
        """
        try:
            response = self.client.post(
                f"{self.base_url}/api/metrics-data/compare",
                headers=self._get_headers(),
                json={"userId": user_id, "industry": industry, "stage": stage}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error comparing metrics: {e}")
            return {"success": False, "error": str(e)}
    
    def update_goal_progress(self, user_id: int, goal_id: int, current_value: float, status: str = None) -> Dict[str, Any]:
        """
        Actualiza el progreso de un goal.
        
        Args:
            user_id: ID del usuario
            goal_id: ID del goal
            current_value: Nuevo valor actual
            status: Nuevo status (opcional)
            
        Returns:
            Resultado de la actualización
        """
        try:
            response = self.client.post(
                f"{self.base_url}/api/metrics-data/goals/{goal_id}/progress",
                headers=self._get_headers(),
                json={"userId": user_id, "currentValue": current_value, "status": status}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error updating goal: {e}")
            return {"success": False, "error": str(e)}
    
    def add_metric(self, user_id: int, metric_name: str, value: float, date: str = None) -> Dict[str, Any]:
        """
        Añade un valor de métrica.
        
        Args:
            user_id: ID del usuario
            metric_name: Nombre de la métrica
            value: Valor
            date: Fecha (opcional, default: hoy)
            
        Returns:
            Resultado
        """
        try:
            response = self.client.post(
                f"{self.base_url}/api/metrics-data/metrics/add",
                headers=self._get_headers(),
                json={"userId": user_id, "metricName": metric_name, "value": value, "date": date}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error adding metric: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_report(self, user_id: int, period: str = "weekly") -> Dict[str, Any]:
        """
        Genera un reporte de métricas.
        
        Args:
            user_id: ID del usuario
            period: Período (weekly, monthly, quarterly)
            
        Returns:
            Reporte generado
        """
        try:
            response = self.client.post(
                f"{self.base_url}/api/metrics-data/report",
                headers=self._get_headers(),
                json={"userId": user_id, "period": period}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error generating report: {e}")
            return {"success": False, "error": str(e)}
    
    def get_leaderboard(self, leaderboard_type: str = "global") -> Dict[str, Any]:
        """
        Obtiene datos del leaderboard.
        
        Args:
            leaderboard_type: Tipo (global, goals)
            
        Returns:
            Datos del leaderboard
        """
        try:
            response = self.client.get(
                f"{self.base_url}/api/metrics-data/leaderboard",
                headers=self._get_headers(),
                params={"type": leaderboard_type}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[METRICS-API] Error getting leaderboard: {e}")
            return {"success": False, "error": str(e)}


# Instancia global del cliente
api_client = MetricsAPIClient()


# ============================================
# TOOLS PARA ACCESO A BASE DE DATOS
# ============================================

@tool
def fetch_startup_metrics(user_id: int, days: int = 90) -> str:
    """
    Obtiene las métricas actuales de la startup desde la base de datos.
    
    Args:
        user_id: ID del usuario/startup
        days: Días de historial a obtener
    
    Returns:
        Métricas formateadas con datos reales
    """
    result = api_client.get_metrics(user_id, days)
    
    if not result.get("success"):
        return f"❌ Error obteniendo métricas: {result.get('error', 'Unknown error')}"
    
    metrics = result.get("metrics", {})
    current = metrics.get("current", {})
    growth = metrics.get("growth", {})
    
    output = """📊 MÉTRICAS ACTUALES DE LA STARTUP

📈 Valores Actuales:
"""
    for name, value in current.items():
        growth_val = growth.get(name, 0)
        trend = "📈" if growth_val > 0 else "📉" if growth_val < 0 else "➡️"
        output += f"- {name.title()}: {value:,.0f} ({trend} {growth_val:.1f}%)\n"
    
    output += "\n💡 Usa estas métricas para análisis más detallados."
    return output


@tool
def fetch_startup_goals(user_id: int) -> str:
    """
    Obtiene los objetivos de la startup desde la base de datos.
    
    Args:
        user_id: ID del usuario/startup
    
    Returns:
        Goals formateados con progreso
    """
    result = api_client.get_goals(user_id)
    
    if not result.get("success"):
        return f"❌ Error obteniendo goals: {result.get('error', 'Unknown error')}"
    
    goals = result.get("goals", [])
    summary = result.get("summary", {})
    
    output = f"""🎯 OBJETIVOS DE LA STARTUP

📊 Resumen:
- Total: {summary.get('total', 0)}
- Activos: {summary.get('active', 0)}
- Completados: {summary.get('completed', 0)}
- Tasa de completación: {summary.get('completionRate', 0)}%

📋 Detalle:
"""
    for goal in goals[:10]:  # Límite de 10 goals
        status_emoji = "✅" if goal.get('status') == 'completed' else "🔄" if goal.get('status') in ['active', 'in_progress'] else "⏳"
        progress = 0
        if goal.get('target_value') and goal.get('target_value') > 0:
            progress = (goal.get('current_value', 0) / goal.get('target_value')) * 100
        output += f"{status_emoji} {goal.get('description', 'Sin descripción')} - {progress:.0f}%\n"
    
    return output


@tool
def fetch_full_context(user_id: int) -> str:
    """
    Obtiene el contexto completo de la startup (métricas + goals).
    
    Args:
        user_id: ID del usuario/startup
    
    Returns:
        Contexto completo formateado
    """
    context = api_client.get_startup_context(user_id)
    
    if not context:
        return "❌ No se pudo obtener el contexto de la startup."
    
    goals_data = context.get("goals", {})
    metrics_data = context.get("metrics", {})
    
    output = f"""📊 CONTEXTO COMPLETO DE LA STARTUP

🎯 OBJETIVOS:
- Total: {goals_data.get('totalCount', 0)}
- Completados: {goals_data.get('completedCount', 0)}
- Tasa: {goals_data.get('completionRate', 0)}%

📈 MÉTRICAS ACTUALES:
"""
    current = metrics_data.get("current", {})
    for name, value in current.items():
        if value:
            output += f"- {name.title()}: {value:,.0f}\n"
    
    growth = metrics_data.get("growth", {})
    output += "\n📊 CRECIMIENTO:\n"
    for name, value in growth.items():
        if isinstance(value, (int, float)):
            trend = "📈" if value > 0 else "📉" if value < 0 else "➡️"
            output += f"- {name.title()}: {trend} {value:.1f}%\n"
    
    return output


@tool
def compare_with_benchmarks(user_id: int, industry: str = "SaaS", stage: str = "seed") -> str:
    """
    Compara las métricas de la startup con benchmarks de la industria.
    
    Args:
        user_id: ID del usuario/startup
        industry: Industria (SaaS, fintech, ecommerce)
        stage: Etapa (seed, series_a, series_b)
    
    Returns:
        Comparación detallada con benchmarks
    """
    result = api_client.compare_to_benchmarks(user_id, industry, stage)
    
    if not result.get("success"):
        return f"❌ Error comparando métricas: {result.get('error', 'Unknown error')}"
    
    comparison = result.get("comparison", {})
    overall_score = result.get("overallScore", 0)
    
    output = f"""📊 COMPARACIÓN CON BENCHMARKS ({industry.upper()} - {stage.upper()})

🏆 Score General: {overall_score}/100

"""
    for metric_name, data in comparison.items():
        status_emoji = "🟢" if data.get("status") == "above" else "🔴"
        output += f"""{status_emoji} {metric_name.upper()}:
   - Tu valor: {data.get('current', 0):.1f}
   - Benchmark: {data.get('benchmark', 0):.1f}
   - Diferencia: {data.get('difference', 0):+.1f}

"""
    
    output += """💡 Recomendaciones:
1. Enfócate en las métricas 🔴 que están por debajo del benchmark
2. Mantén las métricas 🟢 que van bien
3. Revisa semanalmente tu progreso"""
    
    return output


@tool
def update_goal(user_id: int, goal_id: int, new_value: float) -> str:
    """
    Actualiza el progreso de un objetivo en la base de datos.
    
    Args:
        user_id: ID del usuario/startup
        goal_id: ID del objetivo a actualizar
        new_value: Nuevo valor de progreso
    
    Returns:
        Confirmación de la actualización
    """
    result = api_client.update_goal_progress(user_id, goal_id, new_value)
    
    if not result.get("success"):
        return f"❌ Error actualizando goal: {result.get('error', 'Unknown error')}"
    
    new_status = result.get("status", "unknown")
    return f"""✅ OBJETIVO ACTUALIZADO

- Goal ID: {goal_id}
- Nuevo valor: {new_value}
- Status: {new_status}

{'🎉 ¡Felicidades! Has completado este objetivo!' if new_status == 'completed' else '💪 Sigue así, vas por buen camino!'}"""


@tool
def record_metric(user_id: int, metric_name: str, value: float) -> str:
    """
    Registra un nuevo valor de métrica en la base de datos.
    
    Args:
        user_id: ID del usuario/startup
        metric_name: Nombre de la métrica (users, revenue, churn, etc.)
        value: Valor a registrar
    
    Returns:
        Confirmación del registro
    """
    result = api_client.add_metric(user_id, metric_name, value)
    
    if not result.get("success"):
        return f"❌ Error registrando métrica: {result.get('error', 'Unknown error')}"
    
    metric = result.get("metric", {})
    return f"""✅ MÉTRICA REGISTRADA

- Métrica: {metric.get('name', metric_name)}
- Valor: {metric.get('value', value):,.0f}
- Fecha: {metric.get('date', 'hoy')}

💡 Tip: Registra métricas regularmente para obtener mejores análisis y proyecciones."""


@tool
def get_metrics_report(user_id: int, period: str = "weekly") -> str:
    """
    Genera un reporte de métricas para el usuario.
    
    Args:
        user_id: ID del usuario/startup
        period: Período del reporte (weekly, monthly, quarterly)
    
    Returns:
        Reporte formateado
    """
    result = api_client.generate_report(user_id, period)
    
    if not result.get("success"):
        return f"❌ Error generando reporte: {result.get('error', 'Unknown error')}"
    
    report = result.get("report", {})
    summary = report.get("summary", {})
    metrics = report.get("metrics", {})
    
    output = f"""📊 REPORTE DE MÉTRICAS ({period.upper()})
Generado: {report.get('generatedAt', 'N/A')}

🎯 OBJETIVOS:
- Total: {summary.get('totalGoals', 0)}
- Completados: {summary.get('completedGoals', 0)}
- Activos: {summary.get('activeGoals', 0)}
- Tasa: {summary.get('completionRate', 0)}%

📈 MÉTRICAS ACTUALES:
"""
    current = metrics.get("current", {})
    for name, value in current.items():
        if value:
            output += f"- {name.title()}: {value:,.0f}\n"
    
    # Highlights
    highlights = report.get("highlights", [])
    if highlights:
        output += "\n✨ HIGHLIGHTS:\n"
        for h in highlights:
            output += f"• {h}\n"
    
    # Concerns
    concerns = report.get("concerns", [])
    if concerns:
        output += "\n⚠️ ÁREAS DE ATENCIÓN:\n"
        for c in concerns:
            output += f"• {c}\n"
    
    # Recommendations
    recommendations = report.get("recommendations", [])
    if recommendations:
        output += "\n💡 RECOMENDACIONES:\n"
        for r in recommendations:
            output += f"• {r}\n"
    
    return output


@tool
def fetch_leaderboard(leaderboard_type: str = "global") -> str:
    """
    Obtiene el leaderboard de startups.
    
    Args:
        leaderboard_type: Tipo de leaderboard (global, goals)
    
    Returns:
        Leaderboard formateado
    """
    result = api_client.get_leaderboard(leaderboard_type)
    
    if not result.get("success"):
        return f"❌ Error obteniendo leaderboard: {result.get('error', 'Unknown error')}"
    
    leaderboard = result.get("leaderboard", [])
    
    if leaderboard_type == "global":
        output = "🏆 LEADERBOARD GLOBAL DE STARTUPS\n\n"
        for i, item in enumerate(leaderboard[:10], 1):
            type_emoji = "📊" if item.get('type') == 'project' else "🚀"
            output += f"{i}. {type_emoji} **{item.get('title', 'Sin nombre')}**\n"
            output += f"   Founder: {item.get('founder_name', 'N/A')}\n"
            output += f"   ⭐ Rating: {item.get('rating_average', 0):.1f} | 👥 Votos: {item.get('votes_count', 0)}\n\n"
    else:
        output = "🎯 LEADERBOARD DE OBJETIVOS\n\n"
        for i, item in enumerate(leaderboard[:10], 1):
            output += f"{i}. **{item.get('name', 'Anónimo')}**\n"
            output += f"   ✅ Completados: {item.get('completed_goals', 0)} / {item.get('total_goals', 0)}\n\n"
    
    return output


# ============================================
# TOOLS PARA MÉTRICAS (ANÁLISIS LOCAL)
# ============================================

@tool
def analyze_growth_rate(
    current_value: float,
    previous_value: float,
    metric_name: str,
    period: str = "month"
) -> str:
    """
    Analiza la tasa de crecimiento de una métrica.
    
    Args:
        current_value: Valor actual de la métrica
        previous_value: Valor del período anterior
        metric_name: Nombre de la métrica (users, revenue, etc.)
        period: Período de comparación (day, week, month)
    
    Returns:
        Análisis del crecimiento con insights
    """
    if previous_value == 0:
        growth_rate = 100 if current_value > 0 else 0
    else:
        growth_rate = ((current_value - previous_value) / previous_value) * 100
    
    # Determinar tendencia
    if growth_rate > 20:
        trend = "🚀 Crecimiento excepcional"
        assessment = "Excelente performance, mantén lo que estás haciendo"
    elif growth_rate > 10:
        trend = "📈 Crecimiento saludable"
        assessment = "Buen ritmo de crecimiento, considera escalar"
    elif growth_rate > 0:
        trend = "📊 Crecimiento moderado"
        assessment = "Hay margen de mejora, analiza qué canales funcionan mejor"
    elif growth_rate > -10:
        trend = "⚠️ Estancamiento"
        assessment = "Alerta: necesitas revisar tu estrategia"
    else:
        trend = "🔴 Decrecimiento preocupante"
        assessment = "Urgente: identifica las causas y toma acción"
    
    return f"""📊 ANÁLISIS DE {metric_name.upper()}

{trend}

📈 Datos:
- Valor actual: {current_value:,.0f}
- Valor anterior: {previous_value:,.0f}
- Crecimiento: {growth_rate:.1f}%
- Período: {period}

💡 Assessment:
{assessment}

🎯 Próximos pasos recomendados:
1. {'Documenta qué está funcionando' if growth_rate > 0 else 'Analiza los problemas principales'}
2. {'Identifica oportunidades de scaling' if growth_rate > 10 else 'Revisa tu funnel de conversión'}
3. {'Comparte los learnings con el equipo' if growth_rate > 0 else 'Considera pivotar canales de adquisición'}
"""


@tool
def calculate_runway(
    monthly_revenue: float,
    monthly_expenses: float,
    cash_in_bank: float
) -> str:
    """
    Calcula el runway de la startup.
    
    Args:
        monthly_revenue: Ingresos mensuales
        monthly_expenses: Gastos mensuales
        cash_in_bank: Efectivo disponible
    
    Returns:
        Análisis del runway con proyecciones
    """
    burn_rate = monthly_expenses - monthly_revenue
    
    if burn_rate <= 0:
        return f"""💰 ANÁLISIS DE RUNWAY

🎉 ¡Felicidades! Eres cash flow positive.

📈 Datos:
- Revenue mensual: ${monthly_revenue:,.0f}
- Gastos mensuales: ${monthly_expenses:,.0f}
- Flujo positivo: ${abs(burn_rate):,.0f}/mes
- Cash en banco: ${cash_in_bank:,.0f}

💡 Recomendaciones:
1. Considera reinvertir en crecimiento
2. Evalúa nuevos canales de adquisición
3. Piensa en expandir el equipo estratégicamente
"""
    
    runway_months = cash_in_bank / burn_rate
    runway_date = datetime.now() + timedelta(days=runway_months * 30)
    
    # Determinar urgencia
    if runway_months > 18:
        urgency = "🟢 Runway cómodo"
        action = "Enfócate en product-market fit y crecimiento"
    elif runway_months > 12:
        urgency = "🟡 Runway razonable"
        action = "Comienza a explorar opciones de funding"
    elif runway_months > 6:
        urgency = "🟠 Runway corto"
        action = "Prioriza fundraising o reducción de costos"
    else:
        urgency = "🔴 Runway crítico"
        action = "Acción urgente: fundraising o pivote inmediato"
    
    return f"""💰 ANÁLISIS DE RUNWAY

{urgency}

📊 Datos Financieros:
- Revenue mensual: ${monthly_revenue:,.0f}
- Gastos mensuales: ${monthly_expenses:,.0f}
- Burn rate: ${burn_rate:,.0f}/mes
- Cash disponible: ${cash_in_bank:,.0f}

⏰ Runway:
- Meses restantes: {runway_months:.1f}
- Fecha crítica: {runway_date.strftime('%B %Y')}

🎯 Acción recomendada:
{action}

💡 Opciones a considerar:
1. {'Acelerar revenue (ventas, pricing)' if monthly_revenue > 0 else 'Priorizar primeras ventas'}
2. {'Optimizar costos sin afectar crecimiento' if burn_rate > monthly_revenue/2 else 'Mantener estructura actual'}
3. {'Preparar materiales para investors' if runway_months < 12 else 'Seguir iterando producto'}
"""


@tool
def analyze_goals_progress(
    goals_data: str
) -> str:
    """
    Analiza el progreso de los objetivos de la startup.
    
    Args:
        goals_data: JSON string con datos de goals
    
    Returns:
        Análisis del progreso de objetivos
    """
    try:
        goals = json.loads(goals_data)
    except:
        goals = []
    
    if not goals:
        return """📋 ANÁLISIS DE OBJETIVOS

⚠️ No hay objetivos definidos.

💡 Recomendaciones:
1. Define 3-5 objetivos SMART para el próximo mes
2. Prioriza con la matriz de impacto/esfuerzo
3. Asigna responsables (DRIs) a cada objetivo
4. Establece métricas de éxito claras
"""
    
    total = len(goals)
    completed = sum(1 for g in goals if g.get('status') in ['completed', 'done'])
    in_progress = sum(1 for g in goals if g.get('status') in ['in_progress', 'wip', 'active'])
    not_started = total - completed - in_progress
    
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    # Determinar assessment
    if completion_rate >= 80:
        assessment = "🏆 Excelente ejecución"
    elif completion_rate >= 60:
        assessment = "📈 Buen progreso"
    elif completion_rate >= 40:
        assessment = "⚠️ Progreso moderado"
    else:
        assessment = "🔴 Necesitas acelerar"
    
    return f"""📋 ANÁLISIS DE OBJETIVOS

{assessment}

📊 Resumen:
- Total objetivos: {total}
- ✅ Completados: {completed}
- 🔄 En progreso: {in_progress}
- ⏳ Por iniciar: {not_started}
- Tasa de completación: {completion_rate:.0f}%

📈 Tendencia: {'Positiva' if completion_rate > 50 else 'Necesita atención'}

💡 Recomendaciones:
1. {'Celebra los logros y documenta learnings' if completed > 0 else 'Comienza con el objetivo más pequeño'}
2. {'Prioriza los objetivos en progreso' if in_progress > 0 else 'Inicia al menos un objetivo esta semana'}
3. {'Revisa si los objetivos pendientes siguen siendo relevantes' if not_started > 2 else 'Mantén el foco en los actuales'}
"""


@tool
def generate_forecast(
    historical_data: str,
    metric_name: str,
    periods_ahead: int = 3
) -> str:
    """
    Genera un forecast de métricas basado en datos históricos.
    
    Args:
        historical_data: JSON string con datos históricos [{date, value}, ...]
        metric_name: Nombre de la métrica
        periods_ahead: Períodos a proyectar
    
    Returns:
        Forecast con proyecciones y confianza
    """
    try:
        data = json.loads(historical_data)
        values = [d.get('value', 0) for d in data if d.get('value') is not None]
    except:
        values = []
    
    if len(values) < 2:
        return f"""📈 FORECAST DE {metric_name.upper()}

⚠️ Datos insuficientes para proyección.

💡 Necesitas al menos 2 puntos de datos históricos para generar un forecast.

Recomendación: Registra métricas semanalmente para obtener proyecciones más precisas.
"""
    
    # Cálculo simple de tendencia (promedio de crecimiento)
    growth_rates = [(values[i] - values[i-1]) / values[i-1] * 100 
                    if values[i-1] != 0 else 0 
                    for i in range(1, len(values))]
    
    avg_growth = sum(growth_rates) / len(growth_rates) if growth_rates else 0
    
    # Generar proyecciones
    last_value = values[-1]
    projections = []
    current = last_value
    
    for i in range(periods_ahead):
        current = current * (1 + avg_growth / 100)
        projections.append(round(current, 0))
    
    # Determinar confianza basada en volatilidad
    if len(growth_rates) > 1:
        variance = sum((g - avg_growth) ** 2 for g in growth_rates) / len(growth_rates)
        volatility = variance ** 0.5
        
        if volatility < 5:
            confidence = "🟢 Alta (baja volatilidad)"
        elif volatility < 15:
            confidence = "🟡 Media (volatilidad moderada)"
        else:
            confidence = "🔴 Baja (alta volatilidad)"
    else:
        confidence = "⚠️ No determinable (datos insuficientes)"
    
    return f"""📈 FORECAST DE {metric_name.upper()}

📊 Análisis Histórico:
- Puntos de datos: {len(values)}
- Valor actual: {last_value:,.0f}
- Crecimiento promedio: {avg_growth:.1f}%

🔮 Proyecciones:
{chr(10).join(f"• Período +{i+1}: {p:,.0f}" for i, p in enumerate(projections))}

📉 Confianza: {confidence}

⚠️ Nota: Este forecast asume que las condiciones actuales se mantienen.
Factores externos pueden afectar significativamente los resultados reales.

💡 Recomendaciones:
1. {'Mantén el momentum actual' if avg_growth > 10 else 'Busca acelerar el crecimiento'}
2. Registra métricas consistentemente para mejorar precisión
3. Revisa el forecast mensualmente
"""


@tool
def benchmark_metrics(
    metric_name: str,
    value: float,
    stage: str = "seed"
) -> str:
    """
    Compara métricas contra benchmarks de la industria.
    
    Args:
        metric_name: Nombre de la métrica (mrr, users, churn, etc.)
        value: Valor actual
        stage: Etapa de la startup (pre-seed, seed, series-a)
    
    Returns:
        Comparación con benchmarks y recomendaciones
    """
    # Benchmarks típicos por etapa
    benchmarks = {
        "seed": {
            "mrr": {"low": 5000, "median": 15000, "high": 50000},
            "users": {"low": 500, "median": 2000, "high": 10000},
            "churn": {"low": 2, "median": 5, "high": 10},
            "nps": {"low": 20, "median": 40, "high": 60},
            "cac": {"low": 50, "median": 150, "high": 500}
        },
        "series-a": {
            "mrr": {"low": 50000, "median": 150000, "high": 500000},
            "users": {"low": 5000, "median": 20000, "high": 100000},
            "churn": {"low": 1, "median": 3, "high": 7},
            "nps": {"low": 30, "median": 50, "high": 70},
            "cac": {"low": 100, "median": 300, "high": 1000}
        }
    }
    
    stage_benchmarks = benchmarks.get(stage, benchmarks["seed"])
    metric_benchmarks = stage_benchmarks.get(metric_name.lower(), None)
    
    if not metric_benchmarks:
        return f"""📊 BENCHMARK DE {metric_name.upper()}

⚠️ No hay benchmarks disponibles para esta métrica.

Métricas con benchmarks disponibles:
- MRR (Monthly Recurring Revenue)
- Users (Usuarios activos)
- Churn (Tasa de cancelación %)
- NPS (Net Promoter Score)
- CAC (Customer Acquisition Cost)
"""
    
    # Determinar posición
    if value <= metric_benchmarks["low"]:
        position = "🔴 Por debajo del percentil 25"
        action = "Urgente: necesitas mejorar esta métrica"
    elif value <= metric_benchmarks["median"]:
        position = "🟡 Entre percentil 25-50"
        action = "Hay oportunidad de mejora significativa"
    elif value <= metric_benchmarks["high"]:
        position = "🟢 Entre percentil 50-75"
        action = "Buen desempeño, sigue optimizando"
    else:
        position = "🏆 Top percentil (>75)"
        action = "Excelente! Documenta y comparte tus learnings"
    
    # Para métricas donde menos es mejor (churn, cac), invertir lógica
    if metric_name.lower() in ["churn", "cac"]:
        if value >= metric_benchmarks["high"]:
            position = "🔴 Por encima del percentil 75 (malo)"
            action = "Urgente: esta métrica necesita atención"
        elif value >= metric_benchmarks["median"]:
            position = "🟡 Entre percentil 50-75"
            action = "Hay oportunidad de mejora"
        elif value >= metric_benchmarks["low"]:
            position = "🟢 Entre percentil 25-50"
            action = "Buen desempeño"
        else:
            position = "🏆 Top percentil (<25)"
            action = "Excelente!"
    
    return f"""📊 BENCHMARK DE {metric_name.upper()}

🎯 Tu posición: {position}

📈 Comparación ({stage}):
- Tu valor: {value:,.0f}
- Percentil 25: {metric_benchmarks['low']:,.0f}
- Mediana: {metric_benchmarks['median']:,.0f}
- Percentil 75: {metric_benchmarks['high']:,.0f}

💡 Assessment:
{action}

🎯 Objetivo sugerido:
Alcanzar {metric_benchmarks['high']:,.0f} (top 25%) en los próximos 6 meses

📚 Mejores prácticas:
1. Analiza qué hacen las startups top en esta métrica
2. Implementa experimentos pequeños y mide impacto
3. Comparte resultados con tu equipo semanalmente
"""


# ============================================
# AGENTE DE MÉTRICAS PRINCIPAL
# ============================================

class MetricsAgent:
    """
    Agente especializado en análisis de métricas de startups.
    Se comunica con la base de datos D1 via API HTTP.
    """
    
    def __init__(self, user_id: int = None):
        self.config = MetricsConfig()
        self.user_id = user_id
        self.api_client = MetricsAPIClient()
        
        self.agent = Agent(
            name="Startup Metrics Analyst",
            model=OpenAIChat(api_key=self.config.openai_api_key, id=self.config.openai_model),
            tools=[
                # Tools de acceso a base de datos
                fetch_startup_metrics,
                fetch_startup_goals,
                fetch_full_context,
                compare_with_benchmarks,
                update_goal,
                record_metric,
                get_metrics_report,
                fetch_leaderboard,
                # Tools de análisis local
                analyze_growth_rate,
                calculate_runway,
                analyze_goals_progress,
                generate_forecast,
                benchmark_metrics
            ],
            instructions=[
                "Eres un analista experto en métricas de startups y growth hacking.",
                "Tu objetivo es ayudar a founders a entender y mejorar sus métricas clave.",
                "",
                "IMPORTANTE: ACCESO A BASE DE DATOS",
                "Tienes acceso directo a la base de datos de la plataforma ASTAR.",
                "Usa las tools fetch_* para obtener datos reales del usuario.",
                f"El user_id actual es: {user_id or 'no especificado'}",
                "",
                "TOOLS DE ACCESO A DATOS:",
                "- fetch_startup_metrics: Obtiene métricas actuales",
                "- fetch_startup_goals: Obtiene objetivos del usuario",
                "- fetch_full_context: Obtiene contexto completo",
                "- compare_with_benchmarks: Compara con benchmarks de industria",
                "- update_goal: Actualiza progreso de un objetivo",
                "- record_metric: Registra nueva métrica",
                "- get_metrics_report: Genera reporte de métricas",
                "- fetch_leaderboard: Obtiene ranking de startups",
                "",
                "ESPECIALIDADES:",
                "- Análisis de crecimiento (MoM, WoW, YoY)",
                "- Cálculo y optimización de runway",
                "- Tracking de objetivos y OKRs",
                "- Forecasting y proyecciones",
                "- Benchmarking contra industria",
                "",
                "PRINCIPIOS:",
                "- Siempre obtén datos reales usando las tools de fetch",
                "- Proporciona insights accionables, no solo números",
                "- Contextualiza según la etapa de la startup",
                "- Prioriza las métricas que más impactan el negocio",
                "",
                "MÉTRICAS CLAVE A MONITOREAR:",
                "- Users/Customers (activos, nuevos, churn)",
                "- Revenue (MRR, ARR, growth rate)",
                "- Unit Economics (CAC, LTV, LTV/CAC ratio)",
                "- Runway y burn rate",
                "- NPS y retention",
                "",
                "Responde en español con emojis para hacer el análisis más visual.",
                "Siempre incluye próximos pasos concretos al final de cada análisis."
            ],
            markdown=True,
            add_history_to_messages=True,
            add_datetime_to_instructions=True
        )
    
    def set_user_id(self, user_id: int):
        """Establece el user_id para las consultas"""
        self.user_id = user_id
    
    def analyze(self, query: str, context: Dict[str, Any] = None) -> str:
        """
        Analiza métricas basado en la consulta del usuario.
        
        Args:
            query: Pregunta o solicitud del usuario
            context: Contexto adicional (métricas actuales, goals, etc.)
        
        Returns:
            Análisis de métricas
        """
        prompt = query
        
        if context:
            prompt = f"""Contexto de la startup:
{json.dumps(context, indent=2, default=str)}

Consulta del usuario:
{query}

Usa las herramientas disponibles para proporcionar un análisis detallado."""
        
        response = self.agent.run(prompt)
        return response.content
    
    def get_weekly_report(self, metrics_data: Dict[str, Any]) -> str:
        """
        Genera un reporte semanal de métricas.
        
        Args:
            metrics_data: Diccionario con métricas de la semana
        
        Returns:
            Reporte semanal formateado
        """
        prompt = f"""Genera un reporte semanal ejecutivo para esta startup.

DATOS:
{json.dumps(metrics_data, indent=2, default=str)}

El reporte debe incluir:
1. 📊 Resumen ejecutivo (2-3 líneas)
2. 📈 Métricas clave y su evolución
3. ✅ Logros de la semana
4. ⚠️ Áreas de atención
5. 🎯 Prioridades para la próxima semana
6. 💡 Una recomendación estratégica

Hazlo conciso pero completo, perfecto para compartir con el equipo o investors."""
        
        response = self.agent.run(prompt)
        return response.content
    
    def get_investor_metrics_summary(self, metrics_data: Dict[str, Any], stage: str = "seed") -> str:
        """
        Genera un resumen de métricas orientado a inversores.
        
        Args:
            metrics_data: Diccionario con métricas
            stage: Etapa de la startup
        
        Returns:
            Resumen para inversores
        """
        prompt = f"""Genera un resumen de métricas orientado a inversores para una startup en etapa {stage}.

DATOS:
{json.dumps(metrics_data, indent=2, default=str)}

El resumen debe:
1. Destacar las métricas más atractivas para VCs
2. Contextualizar vs benchmarks del sector
3. Mostrar tendencias de crecimiento
4. Resaltar unit economics si son favorables
5. Ser honesto sobre áreas a mejorar
6. Proyectar potencial de crecimiento

Formato: profesional, data-driven, orientado a story de crecimiento."""
        
        response = self.agent.run(prompt)
        return response.content


# ============================================
# CLASE PRINCIPAL PARA INTEGRACIÓN CON API
# ============================================

class MetricsTeam:
    """
    Team multiagente para análisis de métricas.
    Integra con el ecosistema ASTAR y la base de datos D1.
    """
    
    def __init__(self):
        self.session_storage = {}
        self.api_client = MetricsAPIClient()
    
    def get_agent_for_user(self, user_id: int) -> MetricsAgent:
        """Crea un agente configurado para un usuario específico"""
        return MetricsAgent(user_id=user_id)
    
    def chat(self, message: str, session_id: str, user_id: int = None, user_context: Dict = None) -> Dict[str, Any]:
        """
        Procesa un mensaje de chat relacionado con métricas.
        
        Args:
            message: Mensaje del usuario
            session_id: ID de sesión para memoria
            user_id: ID del usuario para acceso a base de datos
            user_context: Contexto adicional del usuario
        
        Returns:
            Respuesta del agente
        """
        # Recuperar o crear sesión
        if session_id not in self.session_storage:
            self.session_storage[session_id] = {
                "history": [],
                "context": user_context or {},
                "user_id": user_id
            }
        
        session = self.session_storage[session_id]
        
        # Actualizar user_id si se proporciona
        if user_id:
            session["user_id"] = user_id
        
        # Actualizar contexto si se proporciona
        if user_context:
            session["context"].update(user_context)
        
        # Añadir mensaje a historial
        session["history"].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Crear agente con user_id
        agent = self.get_agent_for_user(session.get("user_id"))
        
        # Preparar contexto enriquecido
        enriched_context = session["context"].copy()
        enriched_context["user_id"] = session.get("user_id")
        
        # Si hay user_id, obtener datos frescos de la API
        if session.get("user_id"):
            try:
                api_context = self.api_client.get_startup_context(session["user_id"])
                if api_context:
                    enriched_context["live_data"] = api_context
            except Exception as e:
                print(f"[METRICS-TEAM] Error fetching live data: {e}")
        
        # Generar respuesta
        try:
            response = agent.analyze(message, enriched_context)
            
            # Guardar respuesta en historial
            session["history"].append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })
            
            return {
                "success": True,
                "response": response,
                "session_id": session_id,
                "user_id": session.get("user_id")
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id
            }
    
    def analyze_with_real_data(self, user_id: int, query: str) -> Dict[str, Any]:
        """
        Analiza métricas obteniendo datos reales de la base de datos.
        
        Args:
            user_id: ID del usuario
            query: Consulta o pregunta
        
        Returns:
            Análisis basado en datos reales
        """
        # Obtener contexto completo de la API
        context = self.api_client.get_startup_context(user_id)
        
        if not context:
            return {
                "success": False,
                "error": "No se pudo obtener el contexto del usuario"
            }
        
        # Crear agente y analizar
        agent = self.get_agent_for_user(user_id)
        
        prompt = f"""Contexto de la startup (datos reales):
{json.dumps(context, indent=2, default=str)}

Consulta del usuario:
{query}

Usa los datos proporcionados y las herramientas disponibles para dar un análisis completo."""
        
        try:
            response = agent.analyze(prompt)
            return {
                "success": True,
                "response": response,
                "context_used": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_weekly_report(self, user_id: int) -> Dict[str, Any]:
        """
        Genera un reporte semanal con datos reales.
        
        Args:
            user_id: ID del usuario
        
        Returns:
            Reporte semanal
        """
        # Obtener reporte de la API
        report_data = self.api_client.generate_report(user_id, "weekly")
        
        if not report_data.get("success"):
            return report_data
        
        # Enriquecer con análisis del agente
        agent = self.get_agent_for_user(user_id)
        
        prompt = f"""Genera un reporte semanal ejecutivo basado en estos datos:

{json.dumps(report_data.get('report', {}), indent=2, default=str)}

El reporte debe incluir:
1. 📊 Resumen ejecutivo (2-3 líneas)
2. 📈 Métricas clave y su evolución
3. ✅ Logros de la semana
4. ⚠️ Áreas de atención
5. 🎯 Prioridades para la próxima semana
6. 💡 Una recomendación estratégica

Hazlo conciso pero completo, perfecto para compartir con el equipo o investors."""
        
        try:
            enriched_report = agent.agent.run(prompt)
            return {
                "success": True,
                "report": enriched_report.content,
                "raw_data": report_data.get('report', {})
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_data": report_data.get('report', {})
            }
    
    def compare_to_industry(self, user_id: int, industry: str = "SaaS", stage: str = "seed") -> Dict[str, Any]:
        """
        Compara la startup con benchmarks de la industria.
        
        Args:
            user_id: ID del usuario
            industry: Industria
            stage: Etapa de la startup
        
        Returns:
            Comparación detallada
        """
        comparison = self.api_client.compare_to_benchmarks(user_id, industry, stage)
        
        if not comparison.get("success"):
            return comparison
        
        # Enriquecer con insights del agente
        agent = self.get_agent_for_user(user_id)
        
        prompt = f"""Analiza esta comparación con benchmarks de la industria:

Industria: {industry}
Etapa: {stage}
Score general: {comparison.get('overallScore', 0)}/100

Comparación detallada:
{json.dumps(comparison.get('comparison', {}), indent=2)}

Proporciona:
1. Interpretación de los resultados
2. Las 3 métricas más críticas a mejorar
3. Quick wins para subir el score
4. Plan de acción para los próximos 30 días"""
        
        try:
            insights = agent.agent.run(prompt)
            return {
                "success": True,
                "comparison": comparison,
                "insights": insights.content
            }
        except Exception as e:
            return {
                "success": True,
                "comparison": comparison,
                "insights": None,
                "error": str(e)
            }
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """Obtiene el historial de una sesión."""
        if session_id in self.session_storage:
            return self.session_storage[session_id]["history"]
        return []
    
    def clear_session(self, session_id: str) -> bool:
        """Limpia una sesión."""
        if session_id in self.session_storage:
            del self.session_storage[session_id]
            return True
        return False


# ============================================
# PUNTO DE ENTRADA
# ============================================

if __name__ == "__main__":
    # Test del agente
    team = MetricsTeam()
    
    # Contexto de ejemplo
    test_context = {
        "metrics": {
            "users": 1500,
            "revenue": 25000,
            "churn": 4.5
        },
        "goals": [
            {"id": 1, "description": "Alcanzar 2000 usuarios", "status": "in_progress"},
            {"id": 2, "description": "Lanzar feature X", "status": "completed"},
            {"id": 3, "description": "Reducir churn al 3%", "status": "active"}
        ]
    }
    
    # Test de conversación
    result = team.chat(
        message="Analiza mis métricas actuales y dime cómo voy",
        session_id="test_session",
        user_context=test_context
    )
    
    print("=" * 60)
    print("RESPUESTA DEL AGENTE DE MÉTRICAS")
    print("=" * 60)
    print(result.get("response", result.get("error")))
