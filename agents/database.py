"""
Base de datos local para almacenar relaciones WhatsApp -> Usuario
"""
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import config

Base = declarative_base()

class WhatsAppUserDB(Base):
    """Modelo de base de datos para usuarios de WhatsApp"""
    __tablename__ = "whatsapp_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=True)  # ID del usuario en la webapp
    auth_token = Column(Text, nullable=True)  # Token de autenticación
    email = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ConversationHistoryDB(Base):
    """Historial de conversaciones"""
    __tablename__ = "conversation_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(50), nullable=False, index=True)
    message_sid = Column(String(100), nullable=True)
    direction = Column(String(10), nullable=False)  # 'inbound' or 'outbound'
    message = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PendingActionDB(Base):
    """Acciones pendientes en conversaciones"""
    __tablename__ = "pending_actions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(50), unique=True, nullable=False, index=True)
    action_type = Column(String(50), nullable=False)
    action_data = Column(Text, nullable=True)  # JSON serializado
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

# Crear engine y session
engine = create_engine(config.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

def init_db():
    """Inicializa la base de datos creando las tablas"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Obtiene una sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Funciones de utilidad
def get_whatsapp_user(phone_number: str) -> WhatsAppUserDB | None:
    """Obtiene un usuario de WhatsApp por número de teléfono"""
    db = SessionLocal()
    try:
        return db.query(WhatsAppUserDB).filter(
            WhatsAppUserDB.phone_number == phone_number
        ).first()
    finally:
        db.close()

def create_or_update_whatsapp_user(
    phone_number: str, 
    user_id: int = None, 
    auth_token: str = None,
    email: str = None,
    is_verified: bool = False
) -> WhatsAppUserDB:
    """Crea o actualiza un usuario de WhatsApp"""
    db = SessionLocal()
    try:
        user = db.query(WhatsAppUserDB).filter(
            WhatsAppUserDB.phone_number == phone_number
        ).first()
        
        if user:
            if user_id is not None:
                user.user_id = user_id
            if auth_token is not None:
                user.auth_token = auth_token
            if email is not None:
                user.email = email
            user.is_verified = is_verified
            user.updated_at = datetime.utcnow()
        else:
            user = WhatsAppUserDB(
                phone_number=phone_number,
                user_id=user_id,
                auth_token=auth_token,
                email=email,
                is_verified=is_verified
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()

def save_conversation(
    phone_number: str, 
    message: str, 
    direction: str,
    message_sid: str = None,
    intent: str = None
):
    """Guarda un mensaje en el historial"""
    db = SessionLocal()
    try:
        history = ConversationHistoryDB(
            phone_number=phone_number,
            message_sid=message_sid,
            direction=direction,
            message=message,
            intent=intent
        )
        db.add(history)
        db.commit()
    finally:
        db.close()

def get_pending_action(phone_number: str) -> PendingActionDB | None:
    """Obtiene la acción pendiente para un usuario"""
    db = SessionLocal()
    try:
        return db.query(PendingActionDB).filter(
            PendingActionDB.phone_number == phone_number
        ).first()
    finally:
        db.close()

def set_pending_action(phone_number: str, action_type: str, action_data: str = None):
    """Establece una acción pendiente"""
    db = SessionLocal()
    try:
        # Eliminar acción anterior si existe
        db.query(PendingActionDB).filter(
            PendingActionDB.phone_number == phone_number
        ).delete()
        
        action = PendingActionDB(
            phone_number=phone_number,
            action_type=action_type,
            action_data=action_data
        )
        db.add(action)
        db.commit()
    finally:
        db.close()

def clear_pending_action(phone_number: str):
    """Elimina la acción pendiente"""
    db = SessionLocal()
    try:
        db.query(PendingActionDB).filter(
            PendingActionDB.phone_number == phone_number
        ).delete()
        db.commit()
    finally:
        db.close()
