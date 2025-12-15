"""
Servidor FastAPI principal para el sistema multiagente de WhatsApp

Este servidor expone endpoints para:
1. Webhook de Twilio para recibir mensajes de WhatsApp
2. API de administración para gestionar usuarios
3. Health checks
"""
from fastapi import FastAPI, Request, HTTPException, Form, BackgroundTasks
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from config import config
from database import init_db, save_conversation
from twilio_service import twilio_service
from agents import orchestrator

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifecycle manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización y limpieza de la aplicación"""
    # Startup
    logger.info("🚀 Iniciando servidor de agentes WhatsApp...")
    init_db()
    logger.info("✅ Base de datos inicializada")
    yield
    # Shutdown
    logger.info("👋 Servidor detenido")

# Crear aplicación FastAPI
app = FastAPI(
    title="LovableGrowth WhatsApp Agents",
    description="Sistema multiagente para gestión de goals vía WhatsApp",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check básico"""
    return {
        "status": "ok",
        "service": "LovableGrowth WhatsApp Agents",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check detallado"""
    return {
        "status": "healthy",
        "components": {
            "database": "ok",
            "twilio": "configured" if config.TWILIO_ACCOUNT_SID else "not_configured",
            "groq": "configured" if config.GROQ_API_KEY else "not_configured",
            "webapp_api": config.WEBAPP_API_URL
        }
    }

@app.get("/connect")
async def get_connection_info():
    """
    Obtiene la información de conexión para WhatsApp.
    Devuelve el link directo y el código de sandbox si está configurado.
    """
    # Extraer número del formato whatsapp:+1234567890
    phone = config.TWILIO_WHATSAPP_NUMBER.replace("whatsapp:", "").replace("+", "")
    
    # Construir link de WhatsApp
    if config.TWILIO_SANDBOX_CODE:
        # Modo sandbox - necesita código de unión
        sandbox_code = config.TWILIO_SANDBOX_CODE.replace(" ", "%20")
        whatsapp_link = f"https://wa.me/{phone}?text={sandbox_code}"
        instructions = f"1. Haz clic en el link o escanea el QR\n2. Envía el mensaje '{config.TWILIO_SANDBOX_CODE}'\n3. Una vez conectado, envía 'hola' para comenzar"
    else:
        # Modo producción - conexión directa
        whatsapp_link = f"https://wa.me/{phone}?text=Hola"
        instructions = "1. Haz clic en el link o escanea el QR\n2. Envía 'Hola' para comenzar\n3. Vincula tu cuenta de LovableGrowth"
    
    return {
        "whatsapp_link": whatsapp_link,
        "phone_number": f"+{phone}",
        "sandbox_code": config.TWILIO_SANDBOX_CODE or None,
        "is_sandbox": bool(config.TWILIO_SANDBOX_CODE),
        "instructions": instructions,
        "qr_code_url": f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={whatsapp_link}"
    }

@app.get("/connect/qr")
async def get_qr_code():
    """
    Devuelve una página HTML con el QR code para conectarse.
    Útil para compartir con usuarios.
    """
    info = await get_connection_info()
    
    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conectar a LovableGrowth WhatsApp</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .container {{
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
            }}
            h1 {{
                color: #333;
                margin-bottom: 10px;
            }}
            p {{
                color: #666;
                margin-bottom: 20px;
            }}
            .qr-container {{
                background: #f5f5f5;
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
            }}
            .qr-container img {{
                border-radius: 10px;
            }}
            .instructions {{
                text-align: left;
                background: #f0f7ff;
                padding: 15px 20px;
                border-radius: 10px;
                color: #333;
                font-size: 14px;
                white-space: pre-line;
            }}
            .btn {{
                display: inline-block;
                background: #25D366;
                color: white;
                padding: 15px 30px;
                border-radius: 30px;
                text-decoration: none;
                font-weight: bold;
                margin-top: 20px;
                transition: transform 0.2s;
            }}
            .btn:hover {{
                transform: scale(1.05);
            }}
            .phone {{
                color: #999;
                font-size: 12px;
                margin-top: 10px;
            }}
            .badge {{
                display: inline-block;
                background: {"#ffc107" if info["is_sandbox"] else "#28a745"};
                color: {"#333" if info["is_sandbox"] else "white"};
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                margin-bottom: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 LovableGrowth</h1>
            <span class="badge">{"🧪 Modo Sandbox" if info["is_sandbox"] else "✅ Producción"}</span>
            <p>Gestiona tus goals desde WhatsApp</p>
            
            <div class="qr-container">
                <img src="{info["qr_code_url"]}" alt="QR Code" width="200" height="200">
            </div>
            
            <div class="instructions">{info["instructions"]}</div>
            
            <a href="{info["whatsapp_link"]}" class="btn" target="_blank">
                📱 Abrir WhatsApp
            </a>
            
            <p class="phone">Número: {info["phone_number"]}</p>
        </div>
    </body>
    </html>
    """
    
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)

@app.post("/webhook/twilio")
async def twilio_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(...),
    MessageSid: str = Form(default=""),
    AccountSid: str = Form(default=""),
    NumMedia: str = Form(default="0"),
    ProfileName: str = Form(default="")
):
    """
    Webhook para recibir mensajes de Twilio WhatsApp
    
    Twilio envía POST con form-data cuando llega un mensaje
    """
    logger.info(f"📨 Mensaje recibido de {From}: {Body}")
    
    # Validar firma de Twilio (opcional en desarrollo)
    # signature = request.headers.get("X-Twilio-Signature", "")
    # if not twilio_service.validate_request(str(request.url), dict(request.query_params), signature):
    #     raise HTTPException(status_code=403, detail="Invalid Twilio signature")
    
    # Guardar mensaje entrante
    save_conversation(
        phone_number=From,
        message=Body,
        direction="inbound",
        message_sid=MessageSid
    )
    
    try:
        # Procesar mensaje con el orquestador de agentes
        response_message = await orchestrator.process_message(From, Body)
        
        # Guardar respuesta
        save_conversation(
            phone_number=From,
            message=response_message,
            direction="outbound"
        )
        
        # Enviar respuesta por WhatsApp en background
        background_tasks.add_task(
            twilio_service.send_message,
            From,
            response_message
        )
        
        # Responder a Twilio con TwiML vacío
        # (la respuesta se envía de forma asíncrona)
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        return Response(content=twiml, media_type="application/xml")
        
    except Exception as e:
        logger.error(f"❌ Error procesando mensaje: {str(e)}")
        
        # Enviar mensaje de error al usuario
        error_message = "❌ Hubo un error procesando tu mensaje. Por favor intenta de nuevo."
        background_tasks.add_task(
            twilio_service.send_message,
            From,
            error_message
        )
        
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        return Response(content=twiml, media_type="application/xml")

@app.post("/webhook/twilio/status")
async def twilio_status_callback(request: Request):
    """
    Callback para actualizaciones de estado de mensajes
    """
    form_data = await request.form()
    logger.info(f"📊 Status update: {dict(form_data)}")
    return {"status": "received"}

# ============================================
# API DE ADMINISTRACIÓN
# ============================================

@app.get("/api/users")
async def list_users():
    """Lista usuarios de WhatsApp registrados"""
    from database import SessionLocal, WhatsAppUserDB
    
    db = SessionLocal()
    try:
        users = db.query(WhatsAppUserDB).all()
        return {
            "users": [
                {
                    "phone_number": u.phone_number,
                    "email": u.email,
                    "user_id": u.user_id,
                    "is_verified": u.is_verified,
                    "created_at": str(u.created_at) if u.created_at else None
                }
                for u in users
            ]
        }
    finally:
        db.close()

@app.get("/api/conversations/{phone_number}")
async def get_conversation_history(phone_number: str):
    """Obtiene historial de conversación de un usuario"""
    from database import SessionLocal, ConversationHistoryDB
    
    # Formatear número si es necesario
    if not phone_number.startswith("whatsapp:"):
        phone_number = f"whatsapp:{phone_number}"
    
    db = SessionLocal()
    try:
        history = db.query(ConversationHistoryDB).filter(
            ConversationHistoryDB.phone_number == phone_number
        ).order_by(ConversationHistoryDB.created_at.desc()).limit(50).all()
        
        return {
            "phone_number": phone_number,
            "messages": [
                {
                    "direction": h.direction,
                    "message": h.message,
                    "intent": h.intent,
                    "created_at": str(h.created_at) if h.created_at else None
                }
                for h in reversed(history)
            ]
        }
    finally:
        db.close()

@app.post("/api/send-message")
async def send_message_api(
    phone_number: str,
    message: str,
    background_tasks: BackgroundTasks
):
    """Envía un mensaje proactivo a un usuario"""
    # Formatear número
    if not phone_number.startswith("whatsapp:"):
        phone_number = f"whatsapp:+{phone_number}" if not phone_number.startswith("+") else f"whatsapp:{phone_number}"
    
    background_tasks.add_task(
        twilio_service.send_message,
        phone_number,
        message
    )
    
    save_conversation(
        phone_number=phone_number,
        message=message,
        direction="outbound"
    )
    
    return {"status": "queued", "phone_number": phone_number}

@app.post("/api/broadcast")
async def broadcast_message(
    message: str,
    background_tasks: BackgroundTasks
):
    """Envía un mensaje a todos los usuarios verificados"""
    from database import SessionLocal, WhatsAppUserDB
    
    db = SessionLocal()
    try:
        users = db.query(WhatsAppUserDB).filter(
            WhatsAppUserDB.is_verified == True
        ).all()
        
        for user in users:
            background_tasks.add_task(
                twilio_service.send_message,
                user.phone_number,
                message
            )
            save_conversation(
                phone_number=user.phone_number,
                message=message,
                direction="outbound"
            )
        
        return {"status": "queued", "recipients": len(users)}
    finally:
        db.close()

# ============================================
# PUNTO DE ENTRADA
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
        log_level="info"
    )
