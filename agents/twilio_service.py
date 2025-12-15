"""
Servicio de Twilio WhatsApp para enviar y recibir mensajes
"""
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from config import config
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class TwilioWhatsAppService:
    """Servicio para manejar mensajes de WhatsApp vía Twilio"""
    
    def __init__(self):
        self.client = Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
        self.validator = RequestValidator(config.TWILIO_AUTH_TOKEN)
        self.from_number = config.TWILIO_WHATSAPP_NUMBER
    
    async def send_message(self, to_number: str, message: str) -> Optional[str]:
        """
        Envía un mensaje de WhatsApp
        
        Args:
            to_number: Número de destino (formato: whatsapp:+123456789)
            message: Mensaje a enviar
            
        Returns:
            Message SID si fue exitoso, None si hubo error
        """
        try:
            # Asegurar formato correcto
            if not to_number.startswith("whatsapp:"):
                to_number = f"whatsapp:{to_number}"
            
            response = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"Mensaje enviado a {to_number}: {response.sid}")
            return response.sid
            
        except Exception as e:
            logger.error(f"Error enviando mensaje a {to_number}: {str(e)}")
            return None
    
    def validate_request(self, url: str, params: dict, signature: str) -> bool:
        """
        Valida que la petición viene de Twilio
        
        Args:
            url: URL del webhook
            params: Parámetros de la petición
            signature: Firma X-Twilio-Signature
            
        Returns:
            True si es válida, False si no
        """
        return self.validator.validate(url, params, signature)
    
    async def send_template_message(self, to_number: str, template_name: str, **kwargs) -> Optional[str]:
        """
        Envía un mensaje usando una plantilla predefinida
        """
        templates = {
            "welcome": "🎯 ¡Bienvenido a LovableGrowth!\n\nSoy tu asistente de goals. Puedo ayudarte a:\n\n📋 Ver tus goals: 'mis goals'\n✅ Completar goal: 'completar [número]'\n➕ Añadir goal: 'nuevo goal [descripción]'\n📊 Ver métricas: 'mis métricas'\n🏆 Ver leaderboard: 'leaderboard'\n\n¿En qué te puedo ayudar?",
            
            "auth_required": "🔐 Para continuar, necesito verificar tu cuenta.\n\nPor favor, envía tu email registrado en LovableGrowth:",
            
            "auth_password": "📧 Email recibido: {email}\n\nAhora envía tu contraseña:",
            
            "auth_success": "✅ ¡Autenticación exitosa!\n\nHola {name}, ahora puedes gestionar tus goals desde WhatsApp.\n\n¿Qué te gustaría hacer?",
            
            "auth_failed": "❌ No se pudo verificar tu cuenta. Por favor verifica tus credenciales e intenta de nuevo.\n\nEnvía 'login' para reintentar.",
            
            "goals_list": "📋 *Tus Goals Actuales:*\n\n{goals_text}\n\n✅ Para completar: 'completar [número]'\n➕ Para añadir: 'nuevo goal [descripción]'",
            
            "goal_added": "✅ Goal añadido correctamente:\n\n📌 \"{description}\"\n\n¡Sigue así! 💪",
            
            "goal_completed": "🎉 ¡Felicitaciones!\n\nHas completado el goal:\n📌 \"{description}\"\n\n¡Tu posición en el leaderboard puede haber cambiado! Envía 'leaderboard' para ver.",
            
            "metrics_added": "📊 Métrica registrada:\n\n{metric_name}: {metric_value}\nFecha: {date}\n\n¡Sigue creciendo! 📈",
            
            "leaderboard": "🏆 *LEADERBOARD*\n\n{leaderboard_text}\n\n¡Sigue completando goals para subir! 💪",
            
            "error": "❌ Hubo un error procesando tu solicitud. Por favor intenta de nuevo.\n\nSi el problema persiste, contacta soporte.",
            
            "unknown_command": "🤔 No entendí tu mensaje.\n\nPuedes usar:\n• 'mis goals' - ver goals\n• 'completar [#]' - completar goal\n• 'nuevo goal [desc]' - crear goal\n• 'mis métricas' - ver métricas\n• 'leaderboard' - ver ranking\n• 'ayuda' - ver opciones",
            
            "help": "📚 *COMANDOS DISPONIBLES:*\n\n📋 *Goals:*\n• mis goals - ver tus goals\n• nuevo goal [descripción] - crear goal\n• completar [número] - marcar como completado\n\n📊 *Métricas:*\n• mis métricas - ver historial\n• usuarios [número] - registrar usuarios\n• revenue [número] - registrar ingresos\n\n🏆 *Ranking:*\n• leaderboard - ver posiciones\n\n⚙️ *Cuenta:*\n• login - iniciar sesión\n• estado - ver tu estado\n• ayuda - ver este mensaje"
        }
        
        template = templates.get(template_name, templates["error"])
        message = template.format(**kwargs) if kwargs else template
        
        return await self.send_message(to_number, message)

# Instancia global
twilio_service = TwilioWhatsAppService()
