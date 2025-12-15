"""
Modelos de datos para el sistema multiagente
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"

class MessageType(str, Enum):
    UPDATE_GOAL = "update_goal"
    ADD_GOAL = "add_goal"
    LIST_GOALS = "list_goals"
    ADD_METRIC = "add_metric"
    VIEW_LEADERBOARD = "view_leaderboard"
    ADD_ACHIEVEMENT = "add_achievement"
    UNKNOWN = "unknown"

# Modelos de Goal
class Goal(BaseModel):
    id: Optional[int] = None
    user_id: int
    description: str
    status: GoalStatus = GoalStatus.ACTIVE
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class GoalCreate(BaseModel):
    description: str

class GoalUpdate(BaseModel):
    status: GoalStatus

# Modelos de Métricas
class MetricCreate(BaseModel):
    metric_name: str = Field(..., pattern="^(users|revenue)$")
    metric_value: float = Field(..., ge=0)
    recorded_date: str  # YYYY-MM-DD

# Modelos de Achievement
class AchievementCreate(BaseModel):
    date: str  # YYYY-MM-DD
    description: str

# Modelos de Weekly Update
class WeeklyUpdateCreate(BaseModel):
    week: str
    goal_statuses: Dict[str, bool]

# Modelo de Usuario WhatsApp
class WhatsAppUser(BaseModel):
    phone_number: str
    user_id: Optional[int] = None
    auth_token: Optional[str] = None
    is_verified: bool = False
    created_at: Optional[datetime] = None

# Modelo de Mensaje Entrante de Twilio
class TwilioIncomingMessage(BaseModel):
    From: str  # WhatsApp number: whatsapp:+123456789
    To: str
    Body: str
    MessageSid: str
    AccountSid: str
    NumMedia: Optional[str] = "0"
    ProfileName: Optional[str] = None

# Modelo de Respuesta del Agente
class AgentResponse(BaseModel):
    message: str
    action_taken: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

# Modelo para el Leaderboard
class LeaderboardEntry(BaseModel):
    user_id: int
    email: str
    total_goals: int
    completed_goals: int
    completion_rate: float
    total_users: float = 0
    total_revenue: float = 0
    achievements_count: int = 0
    score: float = 0

# Modelo para el contexto de conversación
class ConversationContext(BaseModel):
    phone_number: str
    user_id: Optional[int] = None
    last_intent: Optional[MessageType] = None
    pending_action: Optional[Dict[str, Any]] = None
    last_message_time: Optional[datetime] = None
