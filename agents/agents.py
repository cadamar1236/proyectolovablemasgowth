"""Sistema de Chat con IA Generativa usando Groq

Este módulo implementa un chatbot conversacional inteligente que usa Groq
para procesar lenguaje natural y gestionar goals/métricas/leaderboard.
"""
import json
import re
from datetime import datetime
from typing import Optional, Dict, Any
from groq import Groq

from config import config
from api_client import api_client
from database import (
    get_whatsapp_user, 
    create_or_update_whatsapp_user,
    get_pending_action,
    set_pending_action,
    clear_pending_action,
    save_conversation,
    get_recent_conversations
)

# Cliente Groq
groq_client = Groq(api_key=config.GROQ_API_KEY)


class ConversationalAgent:
    """Agente conversacional inteligente con Groq"""
    
    def __init__(self):
        self.model = config.GROQ_MODEL
        self.system_prompt = """Eres un asistente de productividad para LovableGrowth. Responde en español.

IMPORTANTE - DIFERENCIA ENTRE GOALS Y MÉTRICAS:
- GOALS = Objetivos/tareas que el usuario quiere lograr (ej: "lanzar MVP", "conseguir 10 clientes")
- MÉTRICAS = Números de seguimiento del negocio (usuarios activos, revenue/ingresos)

CUANDO EL USUARIO MENCIONA NÚMEROS + "usuarios" o "revenue" = ES UNA MÉTRICA, NO UN GOAL
Ejemplos de MÉTRICAS (usar ADD_METRIC_USERS o ADD_METRIC_REVENUE):
- "tengo 50 usuarios" → ADD_METRIC_USERS con value: 50
- "añadir 200 usuarios" → ADD_METRIC_USERS con value: 200  
- "subir usuarios a 100" → ADD_METRIC_USERS con value: 100
- "actualiza users: 200" → ADD_METRIC_USERS con value: 200
- "revenue 5000" → ADD_METRIC_REVENUE con value: 5000
- "ingresos de 1000" → ADD_METRIC_REVENUE con value: 1000

Ejemplos de GOALS (usar ADD_GOAL):
- "nuevo goal: lanzar MVP" → ADD_GOAL
- "quiero conseguir mi primer cliente" → ADD_GOAL
- "añadir objetivo: mejorar landing" → ADD_GOAL

ACCIONES DISPONIBLES:
- LIST_GOALS: ver goals del usuario
- ADD_GOAL: crear objetivo (params: {"description": "texto del goal"})
- COMPLETE_GOAL: marcar goal completado (params: {"goal_index": número})
- ADD_METRIC_USERS: registrar número de usuarios (params: {"value": número})
- ADD_METRIC_REVENUE: registrar ingresos (params: {"value": número})
- VIEW_LEADERBOARD: ver ranking
- ADD_ACHIEVEMENT: registrar logro (params: {"description": "texto"})
- VIEW_METRICS: ver historial de métricas
- CHAT: conversación general (params: {}, usa "response")

FORMATO DE RESPUESTA (siempre JSON):
{"action": "NOMBRE", "params": {...}, "response": "texto si es CHAT"}

Sé conciso y amigable. Usa emojis con moderación."""

    def _call_groq(self, messages: list) -> str:
        """Llama a Groq API"""
        try:
            response = groq_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error llamando a Groq: {e}")
            return json.dumps({
                "action": "CHAT",
                "params": {},
                "response": "Lo siento, tuve un problema procesando tu mensaje. ¿Puedes intentarlo de nuevo?"
            })
    
    def parse_intent(self, message: str, context: str = "") -> Dict[str, Any]:
        """Analiza la intención del mensaje usando Groq"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Contexto previo: {context}\n\nMensaje del usuario: {message}"}
        ]
        
        response = self._call_groq(messages)
        
        # Intentar parsear JSON
        try:
            # Limpiar respuesta si tiene markdown
            clean_response = response
            if "```json" in response:
                clean_response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                clean_response = response.split("```")[1].split("```")[0]
            
            return json.loads(clean_response.strip())
        except:
            # Si falla, retornar como chat normal
            return {
                "action": "CHAT",
                "params": {},
                "response": response
            }
    
    def generate_response(self, context: str, data: Any, action_type: str) -> str:
        """Genera una respuesta conversacional basada en los datos"""
        prompt = f"""Genera una respuesta conversacional y amigable basada en:

Acción realizada: {action_type}
Datos: {json.dumps(data, ensure_ascii=False) if data else 'Ninguno'}
Contexto: {context}

La respuesta debe ser natural, usar emojis apropiados, y motivar al usuario.
NO uses formato JSON, solo el texto de respuesta."""

        messages = [
            {"role": "system", "content": "Eres un asistente amigable de productividad. Responde de forma conversacional."},
            {"role": "user", "content": prompt}
        ]
        
        return self._call_groq(messages)


class ChatOrchestrator:
    """Orquestador del chat conversacional"""
    
    def __init__(self):
        self.agent = ConversationalAgent()
    
    async def process_message(self, phone_number: str, message: str) -> str:
        """Procesa un mensaje y genera respuesta"""
        
        # Obtener usuario
        user = get_whatsapp_user(phone_number)
        pending = get_pending_action(phone_number)
        
        # Si no autenticado, manejar auth
        if not user or not user.is_verified:
            return await self._handle_auth(phone_number, message, pending)
        
        # Guardar mensaje en conversación
        save_conversation(phone_number, message, "inbound")
        
        # Obtener contexto de conversaciones recientes
        recent = get_recent_conversations(phone_number, limit=5)
        context = "\n".join([f"{'Usuario' if c.direction == 'inbound' else 'Asistente'}: {c.message}" for c in reversed(recent)]) if recent else ""
        
        # Analizar intención con Groq
        intent = self.agent.parse_intent(message, context)
        action = intent.get("action", "CHAT")
        params = intent.get("params", {})
        
        # Ejecutar acción
        response = await self._execute_action(action, params, user.auth_token, intent)
        
        # Guardar respuesta
        save_conversation(phone_number, response, "outbound")
        
        return response
    
    async def _execute_action(self, action: str, params: dict, auth_token: str, intent: dict) -> str:
        """Ejecuta la acción detectada"""
        
        try:
            if action == "LIST_GOALS":
                result = await api_client.get_goals(auth_token)
                goals = result.get("goals", [])
                
                if not goals:
                    return "📋 No tienes goals activos todavía.\n\n¿Quieres crear tu primer goal? Solo dime qué quieres lograr 💪"
                
                active = [g for g in goals if g.get("status") == "active"]
                completed = [g for g in goals if g.get("status") == "completed"]
                
                text = "🎯 *Tus Goals:*\n\n"
                if active:
                    for i, g in enumerate(active, 1):
                        text += f"{i}. {g['description']}\n"
                
                if completed:
                    text += f"\n✅ Completados: {len(completed)}"
                
                text += "\n\n¿Quieres completar alguno o añadir uno nuevo?"
                return text
            
            elif action == "ADD_GOAL":
                desc = params.get("description", "")
                if not desc:
                    return "¿Cuál es el goal que quieres crear? Descríbemelo 📝"
                
                await api_client.create_goal(auth_token, desc)
                return f"✅ ¡Goal creado!\n\n📌 \"{desc}\"\n\n¡A por ello! 💪 Avísame cuando lo completes."
            
            elif action == "COMPLETE_GOAL":
                goal_index = params.get("goal_index")
                goal_desc = params.get("description", "")
                
                result = await api_client.get_goals(auth_token)
                active = [g for g in result.get("goals", []) if g.get("status") == "active"]
                
                if not active:
                    return "No tienes goals activos para completar. ¿Quieres crear uno nuevo?"
                
                goal_to_complete = None
                
                if goal_index and 1 <= goal_index <= len(active):
                    goal_to_complete = active[goal_index - 1]
                elif goal_desc:
                    # Buscar por descripción
                    for g in active:
                        if goal_desc.lower() in g["description"].lower():
                            goal_to_complete = g
                            break
                
                if goal_to_complete:
                    await api_client.complete_goal(auth_token, goal_to_complete["id"])
                    return f"🎉 ¡Felicidades!\n\n✅ Completaste: \"{goal_to_complete['description']}\"\n\n¡Tu ranking puede haber subido! 📈 ¿Qué más vas a conquistar?"
                else:
                    text = "¿Cuál goal completaste? Tus goals activos son:\n\n"
                    for i, g in enumerate(active, 1):
                        text += f"{i}. {g['description']}\n"
                    text += "\nDime el número o el nombre del goal."
                    return text
            
            elif action == "ADD_METRIC_USERS":
                value = params.get("value")
                if not value:
                    return "¿Cuántos usuarios tienes ahora? Dame el número 👥"
                
                today = datetime.now().strftime("%Y-%m-%d")
                await api_client.add_metric(auth_token, "users", float(value), today)
                return f"📊 ¡Registrado!\n\n👥 Usuarios: {value}\n📅 {today}\n\n¡Sigue creciendo! 🚀"
            
            elif action == "ADD_METRIC_REVENUE":
                value = params.get("value")
                if not value:
                    return "¿Cuánto revenue tienes? Dame el número 💰"
                
                today = datetime.now().strftime("%Y-%m-%d")
                await api_client.add_metric(auth_token, "revenue", float(value), today)
                return f"📊 ¡Registrado!\n\n💰 Revenue: ${value}\n📅 {today}\n\n¡El dinero está entrando! 🎉"
            
            elif action == "VIEW_LEADERBOARD":
                result = await api_client.get_leaderboard(auth_token)
                leaderboard = result.get("leaderboard", [])
                
                if not leaderboard:
                    return "🏆 El leaderboard está vacío. ¡Sé el primero en completar goals y liderar!"
                
                medals = ["🥇", "🥈", "🥉"]
                text = "🏆 *Leaderboard:*\n\n"
                
                for entry in leaderboard[:10]:
                    rank = entry.get("rank", 0)
                    medal = medals[rank - 1] if rank <= 3 else f"{rank}."
                    name = entry.get("name", "Anónimo")[:12]
                    score = entry.get("score", 0)
                    is_me = " 👈" if entry.get("is_current_user") else ""
                    text += f"{medal} {name} - {score}pts{is_me}\n"
                
                text += "\n💡 ¡Completa más goals para subir!"
                return text
            
            elif action == "ADD_ACHIEVEMENT":
                desc = params.get("description", "")
                if not desc:
                    return "🏆 ¿Qué logro conseguiste? Cuéntame 👀"
                
                today = datetime.now().strftime("%Y-%m-%d")
                await api_client.add_achievement(auth_token, today, desc)
                return f"🏆 ¡Logro registrado!\n\n\"{desc}\"\n\n¡Eres increíble! 💪"
            
            elif action == "VIEW_METRICS":
                result = await api_client.get_metrics_history(auth_token)
                history = result.get("metricsHistory", [])
                
                if not history:
                    return "📊 No tienes métricas registradas.\n\nDime cuántos usuarios o cuánto revenue tienes para empezar a trackear 📈"
                
                text = "📊 *Tus métricas recientes:*\n\n"
                for m in history[:5]:
                    emoji = "👥" if m.get("metric_name") == "users" else "💰"
                    text += f"{emoji} {m.get('metric_name')}: {m.get('metric_value')} ({m.get('recorded_date')})\n"
                
                return text
            
            elif action == "VIEW_STATUS":
                return "✅ Tu cuenta está activa y funcionando.\n\n¿En qué te puedo ayudar hoy?"
            
            else:  # CHAT
                response = intent.get("response", "")
                if response:
                    return response
                return "¡Hola! Soy tu asistente de LovableGrowth 🎯\n\nPuedo ayudarte con:\n• Ver y gestionar tus goals\n• Registrar métricas\n• Ver tu posición en el leaderboard\n\n¿Qué necesitas?"
        
        except Exception as e:
            print(f"Error ejecutando acción {action}: {e}")
            return f"Ups, tuve un problema. ¿Puedes intentarlo de nuevo? 🙏"
    
    async def _handle_auth(self, phone_number: str, message: str, pending) -> str:
        """Maneja el flujo de autenticación"""
        
        if not pending:
            set_pending_action(phone_number, "AUTH_EMAIL")
            return """🎯 *¡Hola! Soy tu asistente de LovableGrowth*

Te ayudaré a gestionar tus goals, métricas y más directamente desde WhatsApp.

Para empezar, necesito vincular tu cuenta.

📧 *¿Cuál es tu email registrado?*"""
        
        if pending.action_type == "AUTH_EMAIL":
            email = message.strip().lower()
            
            if "@" not in email or "." not in email:
                return "Hmm, eso no parece un email válido. ¿Puedes verificarlo? 📧"
            
            set_pending_action(phone_number, "AUTH_CODE", json.dumps({"email": email}))
            
            return f"""📧 Perfecto: {email}

🔐 *Necesito verificar que eres tú:*

1. Ve a *webapp.pages.dev/marketplace*
2. Inicia sesión (con Google o contraseña)
3. En *"My Dashboard"* busca *"Integración WhatsApp"*
4. Copia tu *código permanente* de 6 dígitos
5. Envíamelo aquí

💡 El código es permanente, solo lo necesitas una vez."""
        
        if pending.action_type == "AUTH_CODE":
            data = json.loads(pending.action_data) if pending.action_data else {}
            email = data.get("email", "")
            code = message.strip()
            
            # Limpiar código de espacios
            code = re.sub(r'\s+', '', code)
            
            # Verificar formato
            if not code.isdigit():
                return "El código debe ser solo números. ¿Puedes verificarlo? 🔢"
            
            if len(code) != 6:
                return f"El código debe tener 6 dígitos (enviaste {len(code)}). Inténtalo de nuevo:"
            
            # Verificar código con la API
            try:
                result = await api_client.verify_whatsapp_code(email, code)
                
                if result and result.get("token"):
                    # Éxito
                    create_or_update_whatsapp_user(
                        phone_number=phone_number,
                        user_id=result.get("user", {}).get("id"),
                        auth_token=result.get("token"),
                        email=email,
                        is_verified=True
                    )
                    clear_pending_action(phone_number)
                    
                    name = result.get("user", {}).get("name", email.split("@")[0])
                    
                    return f"""✅ *¡Bienvenido, {name}!*

Tu cuenta de WhatsApp está vinculada. 🎉

Ahora puedes hablarme naturalmente:
• "¿Cuáles son mis goals?"
• "Añade un goal: lanzar MVP"
• "Completé el goal 1"
• "Tengo 50 usuarios"
• "¿Cómo voy en el ranking?"

¿En qué te ayudo? 🚀"""
                else:
                    return "❌ El código no es válido o ya expiró.\n\nGenera uno nuevo en la app web y envíamelo."
            
            except Exception as e:
                print(f"Error verificando código: {e}")
                return "❌ Hubo un error verificando el código.\n\nGenera uno nuevo en la app web e intenta de nuevo."
        
        # Fallback
        clear_pending_action(phone_number)
        set_pending_action(phone_number, "AUTH_EMAIL")
        return "Parece que hubo un problema. Empecemos de nuevo.\n\n📧 ¿Cuál es tu email registrado?"


# Instancia global
orchestrator = ChatOrchestrator()
