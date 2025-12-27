"""
Configuración centralizada para el sistema multiagente
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Twilio
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+13158601046")
    TWILIO_SANDBOX_CODE = os.getenv("TWILIO_SANDBOX_CODE", "")  # ej: "join hungry-wolf"
    
    # API WebApp (tu aplicación de Cloudflare Workers)
    WEBAPP_API_URL = os.getenv("WEBAPP_API_URL", "https://webapp.pages.dev/api")
    WEBAPP_API_TOKEN = os.getenv("WEBAPP_API_TOKEN")  # Token JWT para autenticación
    
    # OpenAI (LLM Provider - GPT-4o)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # Modelo económico y eficiente
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    
    # Database (SQLite local para caché de conversaciones)
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agents.db")
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

config = Config()
