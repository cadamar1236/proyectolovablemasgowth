
"""Sistema Multiagente con Agno Framework

Este módulo define los agentes especializados que manejan diferentes aspectos
de la gestión de goals y métricas a través de WhatsApp.
"""
from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools import tool
from typing import Optional, Dict, Any, List
import json
import re
from datetime import datetime

from config import config
from api_client import api_client
from database import (
    get_whatsapp_user, 
    create_or_update_whatsapp_user,
    get_pending_action,
    set_pending_action,
    clear_pending_action,
    save_conversation
)
from models import MessageType

# ============================================
# HERRAMIENTAS (TOOLS) PARA LOS AGENTES
# ============================================

@tool
def get_user_goals(auth_token: str) -> str:
    """
    Obtiene la lista de goals del usuario.
    
    Args:
        auth_token: Token de autenticación del usuario
        
    Returns:
        JSON string con los goals del usuario
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(api_client.get_goals(auth_token))
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def create_new_goal(auth_token: str, description: str) -> str:
    """
    Crea un nuevo goal para el usuario.
    
    Args:
        auth_token: Token de autenticación
        description: Descripción del nuevo goal
        
    Returns:
        JSON string con el goal creado
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(api_client.create_goal(auth_token, description))
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def complete_goal(auth_token: str, goal_id: int) -> str:
    """
    Marca un goal como completado.
    
    Args:
        auth_token: Token de autenticación
        goal_id: ID del goal a completar
        
    Returns:
        JSON string con el resultado
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(api_client.complete_goal(auth_token, goal_id))
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def add_user_metric(auth_token: str, metric_name: str, metric_value: float, recorded_date: str) -> str:
    """
    Añade una métrica (usuarios o revenue).
    
    Args:
        auth_token: Token de autenticación
        metric_name: Nombre de la métrica ('users' o 'revenue')
        metric_value: Valor de la métrica
        recorded_date: Fecha en formato YYYY-MM-DD
        
    Returns:
        JSON string con el resultado
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(
            api_client.add_metric(auth_token, metric_name, metric_value, recorded_date)
        )
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def get_metrics_history(auth_token: str) -> str:
    """
    Obtiene el historial de métricas del usuario.
    
    Args:
        auth_token: Token de autenticación
        
    Returns:
        JSON string con el historial de métricas
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(api_client.get_metrics_history(auth_token))
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool
def add_achievement(auth_token: str, date: str, description: str) -> str:
    """
    Añade un logro/achievement.
    
    Args:
        auth_token: Token de autenticación
        date: Fecha del logro en formato YYYY-MM-DD
        description: Descripción del logro
        
    Returns:
        JSON string con el resultado
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(api_client.add_achievement(auth_token, date, description))
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)})

# ============================================
# AGENTE CLASIFICADOR DE INTENCIONES
# ============================================

class IntentClassifierAgent:
    """Agente que clasifica la intención del mensaje del usuario"""
    
    def __init__(self):
        self.agent = Agent(
            name="IntentClassifier",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            description="Clasificador de intenciones de mensajes de usuarios",
            instructions=[
                "Eres un clasificador de intenciones para un sistema de gestión de goals.",
                "Debes identificar qué quiere hacer el usuario basándote en su mensaje.",
                "Las intenciones posibles son:",
                "- LIST_GOALS: ver goals (palabras clave: mis goals, ver goals, goals, objetivos)",
                "- ADD_GOAL: crear nuevo goal (palabras clave: nuevo goal, crear goal, añadir goal, agregar)",
                "- UPDATE_GOAL: completar/actualizar goal (palabras clave: completar, terminar, hecho, completé)",
                "- ADD_METRIC: registrar métrica (palabras clave: usuarios, revenue, ingresos, métrica)",
                "- VIEW_LEADERBOARD: ver ranking (palabras clave: leaderboard, ranking, posición, top)",
                "- ADD_ACHIEVEMENT: añadir logro (palabras clave: logro, achievement, conseguí)",
                "- HELP: ayuda (palabras clave: ayuda, help, comandos)",
                "- LOGIN: autenticarse (palabras clave: login, iniciar sesión, entrar)",
                "- STATUS: ver estado (palabras clave: estado, status, mi cuenta)",
                "- UNKNOWN: si no está claro",
                "Responde SOLO con el nombre de la intención en mayúsculas."
            ],
            markdown=False
        )
    
    def classify(self, message: str) -> MessageType:
        """Clasifica la intención del mensaje"""
        # Primero intentamos con reglas simples para mayor velocidad
        message_lower = message.lower().strip()
        
        # Patrones de regex para clasificación rápida
        patterns = {
            MessageType.LIST_GOALS: r"(mis\s+goals?|ver\s+goals?|lista\s+goals?|objetivos|^goals?$)",
            MessageType.ADD_GOAL: r"(nuevo\s+goal|crear\s+goal|añadir\s+goal|agregar\s+goal)",
            MessageType.UPDATE_GOAL: r"(completar|terminar|hecho|completé|marcar)\s*(\d+)?",
            MessageType.ADD_METRIC: r"(usuarios?\s+\d+|revenue\s+\d+|ingresos?\s+\d+|métrica)",
            MessageType.VIEW_LEADERBOARD: r"(leaderboard|ranking|posici[oó]n|top\s*\d*)",
            MessageType.ADD_ACHIEVEMENT: r"(logro|achievement|conseguí|hice)",
        }
        
        for intent, pattern in patterns.items():
            if re.search(pattern, message_lower):
                return intent
        
        # Comandos exactos
        exact_commands = {
            "ayuda": MessageType.UNKNOWN,  # Tratamos ayuda especialmente
            "help": MessageType.UNKNOWN,
            "login": MessageType.UNKNOWN,
            "estado": MessageType.UNKNOWN,
            "status": MessageType.UNKNOWN,
        }
        
        if message_lower in exact_commands:
            return exact_commands[message_lower]
        
        # Si no hay match claro, usar el LLM
        try:
            response = self.agent.run(message)
            intent_str = response.content.strip().upper()
            
            intent_map = {
                "LIST_GOALS": MessageType.LIST_GOALS,
                "ADD_GOAL": MessageType.ADD_GOAL,
                "UPDATE_GOAL": MessageType.UPDATE_GOAL,
                "ADD_METRIC": MessageType.ADD_METRIC,
                "VIEW_LEADERBOARD": MessageType.VIEW_LEADERBOARD,
                "ADD_ACHIEVEMENT": MessageType.ADD_ACHIEVEMENT,
            }
            
            return intent_map.get(intent_str, MessageType.UNKNOWN)
        except:
            return MessageType.UNKNOWN

# ============================================
# AGENTE DE GESTIÓN DE GOALS
# ============================================

class GoalsManagerAgent:
    """Agente especializado en gestión de goals"""
    
    def __init__(self):
        self.agent = Agent(
            name="GoalsManager",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            description="Gestor de goals y objetivos",
            tools=[get_user_goals, create_new_goal, complete_goal],
            instructions=[
                "Eres un asistente de gestión de goals.",
                "Ayudas a los usuarios a ver, crear y completar sus goals.",
                "Siempre responde de forma amigable y motivadora.",
                "Usa emojis para hacer los mensajes más visuales.",
                "Formatea las listas de goals de forma clara con números."
            ],
            markdown=False
        )
    
    async def list_goals(self, auth_token: str) -> str:
        """Lista los goals del usuario"""
        try:
            result = await api_client.get_goals(auth_token)
            goals = result.get("goals", [])
            
            if not goals:
                return "📋 No tienes goals activos.\n\n➕ Crea uno con: 'nuevo goal [descripción]'"
            
            # Separar activos y completados
            active = [g for g in goals if g.get("status") == "active"]
            completed = [g for g in goals if g.get("status") == "completed"]
            
            text = "📋 *TUS GOALS:*\n\n"
            
            if active:
                text += "🎯 *Activos:*\n"
                for i, goal in enumerate(active, 1):
                    text += f"{i}. {goal['description']}\n"
                text += "\n"
            
            if completed:
                text += f"✅ *Completados:* {len(completed)}\n"
            
            text += "\n💡 Usa 'completar [número]' para marcar como hecho"
            
            return text
        except Exception as e:
            return f"❌ Error al obtener goals: {str(e)}"
    
    async def add_goal(self, auth_token: str, description: str) -> str:
        """Añade un nuevo goal"""
        try:
            result = await api_client.create_goal(auth_token, description)
            return f"✅ Goal añadido:\n\n📌 \"{description}\"\n\n¡A por ello! 💪"
        except Exception as e:
            return f"❌ Error al crear goal: {str(e)}"
    
    async def complete_goal_by_index(self, auth_token: str, index: int) -> str:
        """Completa un goal por su índice en la lista"""
        try:
            # Obtener goals para encontrar el ID real
            result = await api_client.get_goals(auth_token)
            goals = result.get("goals", [])
            active_goals = [g for g in goals if g.get("status") == "active"]
            
            if not active_goals:
                return "📋 No tienes goals activos para completar."
            
            if index < 1 or index > len(active_goals):
                return f"❌ Número inválido. Tienes {len(active_goals)} goals activos."
            
            goal = active_goals[index - 1]
            await api_client.complete_goal(auth_token, goal["id"])
            
            return f"🎉 ¡Felicitaciones!\n\nCompletaste: \"{goal['description']}\"\n\n¡Tu ranking puede haber mejorado! 📈"
        except Exception as e:
            return f"❌ Error al completar goal: {str(e)}"

# ============================================
# AGENTE DE MÉTRICAS
# ============================================

class MetricsAgent:
    """Agente especializado en métricas"""
    
    def __init__(self):
        self.agent = Agent(
            name="MetricsManager",
            model=Groq(id=config.GROQ_MODEL, api_key=config.GROQ_API_KEY),
            description="Gestor de métricas de negocio",
            tools=[add_user_metric, get_metrics_history],
            instructions=[
                "Eres un asistente de métricas de negocio.",
                "Ayudas a registrar y consultar métricas de usuarios y revenue.",
                "Siempre confirma los datos registrados.",
                "Proporciona contexto sobre el progreso."
            ],
            markdown=False
        )
    
    async def add_metric(self, auth_token: str, metric_name: str, value: float) -> str:
        """Registra una métrica"""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            await api_client.add_metric(auth_token, metric_name, value, today)
            
            emoji = "👥" if metric_name == "users" else "💰"
            label = "Usuarios" if metric_name == "users" else "Revenue"
            
            return f"📊 Métrica registrada:\n\n{emoji} {label}: {value}\n📅 Fecha: {today}\n\n¡Sigue creciendo! 📈"
        except Exception as e:
            return f"❌ Error al registrar métrica: {str(e)}"
    
    async def get_history(self, auth_token: str) -> str:
        """Obtiene historial de métricas"""
        try:
            result = await api_client.get_metrics_history(auth_token)
            history = result.get("metricsHistory", [])
            
            if not history:
                return "📊 No tienes métricas registradas.\n\nRegistra con:\n• 'usuarios [número]'\n• 'revenue [número]'"
            
            text = "📊 *TUS MÉTRICAS:*\n\n"
            
            # Agrupar por fecha y mostrar últimas 5
            seen_dates = set()
            count = 0
            for m in history:
                if count >= 5:
                    break
                date = m.get("recorded_date", "")
                if date not in seen_dates:
                    seen_dates.add(date)
                    text += f"📅 {date}\n"
                
                emoji = "👥" if m.get("metric_name") == "users" else "💰"
                text += f"   {emoji} {m.get('metric_name')}: {m.get('metric_value')}\n"
                count += 1
            
            return text
        except Exception as e:
            return f"❌ Error al obtener métricas: {str(e)}"

# ============================================
# AGENTE DE LEADERBOARD
# ============================================

class LeaderboardAgent:
    """Agente para consultas de leaderboard"""
    
    async def get_leaderboard(self, auth_token: str, current_user_id: int = None) -> str:
        """Obtiene el leaderboard"""
        try:
            result = await api_client.get_leaderboard(auth_token)
            leaderboard = result.get("leaderboard", [])
            current_user = result.get("current_user")
            
            if not leaderboard:
                return "🏆 No hay datos de leaderboard disponibles."
            
            text = "🏆 *LEADERBOARD*\n\n"
            medals = ["🥇", "🥈", "🥉"]
            
            for entry in leaderboard[:10]:
                rank = entry.get("rank", 0)
                medal = medals[rank - 1] if rank <= 3 else f"{rank}."
                name = entry.get("name", "Anónimo")[:15]
                score = entry.get("score", 0)
                completed = entry.get("completed_goals", 0)
                total = entry.get("total_goals", 0)
                is_me = "👈" if entry.get("is_current_user") else ""
                text += f"{medal} {name} - {score}pts ({completed}/{total} goals) {is_me}\n"
            
            # Si el usuario actual no está en top 10, mostrar su posición
            if current_user and current_user.get("rank", 0) > 10:
                text += f"\n...\n{current_user['rank']}. Tú - {current_user['score']}pts 👈"
            
            text += "\n\n💡 Completa goals para subir posiciones!"
            
            return text
        except Exception as e:
            # Fallback message
            return "🏆 *LEADERBOARD*\n\n¡Completa goals para mejorar tu posición!\n\n📊 Cada goal completado = +10 pts\n📋 Cada goal creado = +2 pts\n🏆 Cada logro = +5 pts"

# ============================================
# ORQUESTADOR PRINCIPAL
# ============================================

class AgentOrchestrator:
    """Orquestador que coordina todos los agentes"""
    
    def __init__(self):
        self.intent_classifier = IntentClassifierAgent()
        self.goals_agent = GoalsManagerAgent()
        self.metrics_agent = MetricsAgent()
        self.leaderboard_agent = LeaderboardAgent()
    
    async def process_message(self, phone_number: str, message: str) -> str:
        """
        Procesa un mensaje entrante y devuelve la respuesta apropiada
        
        Args:
            phone_number: Número de WhatsApp del usuario
            message: Mensaje recibido
            
        Returns:
            Mensaje de respuesta
        """
        # Obtener usuario de la base de datos
        user = get_whatsapp_user(phone_number)
        
        # Verificar si hay una acción pendiente
        pending = get_pending_action(phone_number)
        
        # Si no está autenticado, manejar flujo de auth
        if not user or not user.is_verified:
            return await self._handle_auth_flow(phone_number, message, pending)
        
        # Si hay acción pendiente, procesarla
        if pending:
            return await self._handle_pending_action(phone_number, message, pending, user.auth_token)
        
        # Clasificar intención
        message_lower = message.lower().strip()
        
        # Comandos especiales
        if message_lower in ["ayuda", "help", "?"]:
            return self._get_help_message()
        
        if message_lower in ["login", "entrar", "iniciar sesión"]:
            set_pending_action(phone_number, "AUTH_EMAIL")
            return "🔐 Para iniciar sesión, envía tu email registrado en LovableGrowth:"
        
        if message_lower in ["estado", "status", "mi cuenta"]:
            return f"✅ Sesión activa\n📧 {user.email}\n\n¿Qué deseas hacer?"
        
        # Clasificar intención
        intent = self.intent_classifier.classify(message)
        
        # Ejecutar acción según intención
        if intent == MessageType.LIST_GOALS:
            return await self.goals_agent.list_goals(user.auth_token)
        
        elif intent == MessageType.ADD_GOAL:
            # Extraer descripción del goal
            match = re.search(r"(?:nuevo\s+goal|crear\s+goal|añadir\s+goal|agregar\s+goal)\s+(.+)", message_lower)
            if match:
                description = match.group(1).strip()
                return await self.goals_agent.add_goal(user.auth_token, description)
            else:
                set_pending_action(phone_number, "ADD_GOAL")
                return "📝 ¿Cuál es la descripción de tu nuevo goal?"
        
        elif intent == MessageType.UPDATE_GOAL:
            # Extraer número del goal
            match = re.search(r"(\d+)", message)
            if match:
                index = int(match.group(1))
                return await self.goals_agent.complete_goal_by_index(user.auth_token, index)
            else:
                set_pending_action(phone_number, "COMPLETE_GOAL")
                return "🎯 ¿Cuál es el número del goal que completaste?\n\nEnvía 'mis goals' para ver la lista."
        
        elif intent == MessageType.ADD_METRIC:
            # Extraer métrica
            users_match = re.search(r"usuarios?\s+(\d+(?:\.\d+)?)", message_lower)
            revenue_match = re.search(r"(?:revenue|ingresos?)\s+(\d+(?:\.\d+)?)", message_lower)
            
            if users_match:
                value = float(users_match.group(1))
                return await self.metrics_agent.add_metric(user.auth_token, "users", value)
            elif revenue_match:
                value = float(revenue_match.group(1))
                return await self.metrics_agent.add_metric(user.auth_token, "revenue", value)
            else:
                # Mostrar historial
                return await self.metrics_agent.get_history(user.auth_token)
        
        elif intent == MessageType.VIEW_LEADERBOARD:
            return await self.leaderboard_agent.get_leaderboard(user.auth_token, user.user_id)
        
        elif intent == MessageType.ADD_ACHIEVEMENT:
            set_pending_action(phone_number, "ADD_ACHIEVEMENT")
            return "🏆 ¿Qué logro quieres registrar?\n\nDescribe brevemente tu achievement:"
        
        else:
            return self._get_unknown_command_message()
    
    async def _handle_auth_flow(self, phone_number: str, message: str, pending) -> str:
        """Maneja el flujo de autenticación"""
        
        if not pending:
            # Primer mensaje, dar bienvenida e iniciar flujo de auth
            set_pending_action(phone_number, "AUTH_EMAIL")
            return """🎯 *¡Bienvenido a LovableGrowth!*

Soy tu asistente de productividad. Te ayudaré a:
• 📋 Gestionar tus goals
• 📊 Registrar métricas
• 🏆 Competir en el leaderboard

Para comenzar, necesito vincular tu cuenta.

📧 *Envía tu email* registrado en LovableGrowth:"""
        
        if pending.action_type == "AUTH_EMAIL":
            # Guardar email y pedir password
            email = message.strip()
            if "@" not in email:
                return "❌ Por favor envía un email válido:"
            
            set_pending_action(phone_number, "AUTH_PASSWORD", json.dumps({"email": email}))
            return f"📧 Email: {email}\n\n🔑 Ahora envía tu contraseña:"
        
        if pending.action_type == "AUTH_PASSWORD":
            # Verificar credenciales
            data = json.loads(pending.action_data) if pending.action_data else {}
            email = data.get("email", "")
            password = message.strip()
            
            try:
                result = await api_client.verify_user(email, password)
                if result and result.get("token"):
                    # Autenticación exitosa
                    create_or_update_whatsapp_user(
                        phone_number=phone_number,
                        user_id=result.get("user", {}).get("id"),
                        auth_token=result.get("token"),
                        email=email,
                        is_verified=True
                    )
                    clear_pending_action(phone_number)
                    
                    name = result.get("user", {}).get("name", email.split("@")[0])
                    return f"✅ ¡Autenticación exitosa!\n\nHola {name} 👋\n\nAhora puedes:\n• 'mis goals' - ver goals\n• 'nuevo goal [desc]' - crear goal\n• 'leaderboard' - ver ranking\n• 'ayuda' - ver comandos"
                else:
                    clear_pending_action(phone_number)
                    return "❌ Credenciales incorrectas.\n\nEnvía 'login' para intentar de nuevo."
            except Exception as e:
                clear_pending_action(phone_number)
                return f"❌ Error de autenticación.\n\nEnvía 'login' para intentar de nuevo."
        
        return "🔐 Envía 'login' para iniciar sesión."
    
    async def _handle_pending_action(self, phone_number: str, message: str, pending, auth_token: str) -> str:
        """Maneja acciones pendientes"""
        
        if pending.action_type == "ADD_GOAL":
            clear_pending_action(phone_number)
            return await self.goals_agent.add_goal(auth_token, message.strip())
        
        if pending.action_type == "COMPLETE_GOAL":
            clear_pending_action(phone_number)
            try:
                index = int(message.strip())
                return await self.goals_agent.complete_goal_by_index(auth_token, index)
            except ValueError:
                return "❌ Por favor envía solo el número del goal."
        
        if pending.action_type == "ADD_ACHIEVEMENT":
            clear_pending_action(phone_number)
            try:
                today = datetime.now().strftime("%Y-%m-%d")
                await api_client.add_achievement(auth_token, today, message.strip())
                return f"🏆 ¡Logro registrado!\n\n\"{message.strip()}\"\n\n¡Sigue así! 💪"
            except Exception as e:
                return f"❌ Error al registrar logro: {str(e)}"
        
        clear_pending_action(phone_number)
        return "Acción cancelada. ¿En qué te puedo ayudar?"
    
    def _get_help_message(self) -> str:
        return """📚 *COMANDOS DISPONIBLES:*

📋 *Goals:*
• mis goals - ver tus goals
• nuevo goal [descripción] - crear goal
• completar [número] - marcar completado

📊 *Métricas:*
• mis métricas - ver historial
• usuarios [número] - registrar usuarios
• revenue [número] - registrar ingresos

🏆 *Ranking:*
• leaderboard - ver posiciones

⚙️ *Cuenta:*
• estado - ver tu estado
• ayuda - ver este mensaje"""
    
    def _get_unknown_command_message(self) -> str:
        return """🤔 No entendí tu mensaje.

Prueba con:
• 'mis goals' - ver goals
• 'completar [#]' - completar goal
• 'nuevo goal [desc]' - crear goal
• 'leaderboard' - ver ranking
• 'ayuda' - ver opciones"""

# Instancia global del orquestador
orchestrator = AgentOrchestrator()
