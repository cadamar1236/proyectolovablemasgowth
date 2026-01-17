"""
AI Connector Agent - SuperConector de Emprendedores
====================================================

Agente inteligente que conecta:
- Emprendedores entre sí (misma industria, mismo stage, intereses comunes)
- Emprendedores con inversores
- Emprendedores con validadores
- Emprendedores con partners
- Cualquier tipo de usuario con otros según sus intereses

Analiza perfiles, intereses y necesidades para sugerir conexiones relevantes.
"""

import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

# Agno Framework
from agno.agent import Agent
from agno.tools import tool

# OpenAI
import openai


@dataclass
class AIConnectorConfig:
    """Configuration for AI Connector Agent"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    def __post_init__(self):
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")


class AIConnectorTeam:
    """
    Sistema de IA para conectar usuarios de la plataforma
    """
    
    def __init__(self):
        self.config = AIConnectorConfig()
        openai.api_key = self.config.openai_api_key
        
        # Session storage for conversation memory
        self.session_storage = {}
        
        # Main conversational agent
        self.main_agent = Agent(
            name="AI SuperConnector",
            model="openai:gpt-4o-mini",
            description="AI assistant that helps connect entrepreneurs, investors, validators, and partners",
            instructions=[
                "You are an AI SuperConnector specialized in creating meaningful business connections",
                "Help users find relevant connections within the ASTAR ecosystem",
                "You can connect users with:",
                "  - Other entrepreneurs in similar industries or stages",
                "  - Investors looking for specific types of startups",
                "  - Validators who can provide feedback",
                "  - Partners for collaborations",
                "Ask clarifying questions to understand what kind of connections they need",
                "Be conversational, friendly, and professional in Spanish",
                "Remember previous context in the conversation",
                "When suggesting connections, explain WHY each person is a good match",
                "Always prioritize quality over quantity in suggestions",
                "Consider: industry, stage, location, interests, goals",
                "Format your responses with clear sections and emojis for readability"
            ],
            markdown=True,
            add_history_to_context=True,
            add_datetime_to_instructions=True
        )
    
    def get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        """Get or create a session for conversation memory"""
        if session_id not in self.session_storage:
            self.session_storage[session_id] = {
                "history": [],
                "user_context": {},
                "search_preferences": {},
                "suggested_connections": [],
                "created_at": datetime.now().isoformat()
            }
        return self.session_storage[session_id]
    
    def analyze_user_for_matching(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a user profile to extract matching criteria
        """
        analysis = {
            "user_type": user_data.get("user_type", "entrepreneur"),
            "industry": user_data.get("industry", ""),
            "stage": user_data.get("stage", ""),
            "interests": user_data.get("interests", []),
            "location": user_data.get("country", ""),
            "looking_for": user_data.get("looking_for", []),
            "can_offer": user_data.get("can_offer", [])
        }
        return analysis
    
    def find_matches(
        self,
        current_user: Dict[str, Any],
        potential_matches: List[Dict[str, Any]],
        search_criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Find the best matches for a user based on criteria
        Uses AI to score and explain matches
        """
        if not potential_matches:
            return []
        
        # Build prompt for AI matching
        prompt = f"""
Analyze these potential connections for the current user and rank them by relevance.

CURRENT USER:
- Type: {current_user.get('user_type', 'entrepreneur')}
- Industry: {current_user.get('industry', 'Not specified')}
- Stage: {current_user.get('stage', 'Not specified')}
- Location: {current_user.get('country', 'Not specified')}
- Interests: {current_user.get('interests', [])}

SEARCH CRITERIA:
{json.dumps(search_criteria, indent=2)}

POTENTIAL MATCHES:
{json.dumps(potential_matches[:20], indent=2, default=str)}

For each match, provide:
1. A relevance score (0-100)
2. A brief explanation of why they're a good match (in Spanish)
3. Suggested conversation starters

Return as JSON array with fields: id, name, score, reason, conversation_starters
Only include matches with score >= 50.
Sort by score descending.
"""
        
        try:
            response = openai.chat.completions.create(
                model=self.config.openai_model,
                messages=[
                    {"role": "system", "content": "You are a networking expert. Analyze profiles and find the best matches. Respond in JSON format only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content
            # Parse JSON from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            matches = json.loads(result_text.strip())
            return matches
            
        except Exception as e:
            print(f"Error finding matches: {e}")
            # Fallback: simple matching by industry
            return self._simple_matching(current_user, potential_matches, search_criteria)
    
    def _simple_matching(
        self,
        current_user: Dict[str, Any],
        potential_matches: List[Dict[str, Any]],
        search_criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Simple fallback matching based on basic criteria
        """
        matches = []
        user_industry = current_user.get('industry', '').lower()
        user_type = search_criteria.get('target_type', 'entrepreneur')
        
        for match in potential_matches[:10]:
            if match.get('id') == current_user.get('id'):
                continue
            
            score = 50  # Base score
            reasons = []
            
            # Industry match
            match_industry = (match.get('industry') or '').lower()
            if user_industry and match_industry and user_industry in match_industry:
                score += 25
                reasons.append(f"Misma industria: {match.get('industry')}")
            
            # Type match
            if match.get('user_type', '').lower() == user_type.lower():
                score += 15
                reasons.append(f"Es {user_type}")
            
            # Location match
            if current_user.get('country') == match.get('country'):
                score += 10
                reasons.append(f"Mismo país: {match.get('country')}")
            
            if score >= 50:
                matches.append({
                    "id": match.get('id'),
                    "name": match.get('name') or match.get('full_name') or 'Usuario',
                    "score": score,
                    "reason": ". ".join(reasons) if reasons else "Perfil interesante para conectar",
                    "conversation_starters": ["¡Hola! Vi tu perfil y me gustaría conectar contigo."],
                    "user_type": match.get('user_type'),
                    "industry": match.get('industry'),
                    "avatar_url": match.get('avatar_url')
                })
        
        return sorted(matches, key=lambda x: x['score'], reverse=True)
    
    def chat(
        self,
        session_id: str,
        user_message: str,
        user_data: Optional[Dict[str, Any]] = None,
        available_users: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and return response with potential matches
        """
        session = self.get_or_create_session(session_id)
        
        # Add user data to context
        if user_data:
            session["user_context"] = user_data
        
        # Add message to history
        session["history"].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Build context for the agent
        context = f"""
CONTEXTO DEL USUARIO:
{json.dumps(session.get('user_context', {}), indent=2, default=str)}

HISTORIAL DE CONVERSACIÓN:
{self._format_history(session['history'][-10:])}

MENSAJE ACTUAL: {user_message}
"""
        
        # Check if user is asking for connections
        search_keywords = ['conectar', 'buscar', 'encontrar', 'match', 'conexión', 
                          'emprendedor', 'inversor', 'validador', 'partner', 'mentor']
        is_search_request = any(kw in user_message.lower() for kw in search_keywords)
        
        matches = []
        if is_search_request and available_users:
            # Extract search criteria from the message
            search_criteria = self._extract_search_criteria(user_message)
            session["search_preferences"].update(search_criteria)
            
            # Find matches
            matches = self.find_matches(
                current_user=session.get("user_context", {}),
                potential_matches=available_users,
                search_criteria=search_criteria
            )
            session["suggested_connections"] = matches
        
        # Get AI response
        try:
            response = self.main_agent.run(context)
            ai_message = response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            print(f"Agent error: {e}")
            ai_message = self._generate_fallback_response(user_message, matches)
        
        # Add response to history
        session["history"].append({
            "role": "assistant",
            "content": ai_message,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "message": ai_message,
            "matches": matches[:5],  # Top 5 matches
            "session_id": session_id,
            "has_matches": len(matches) > 0
        }
    
    def _format_history(self, history: List[Dict]) -> str:
        """Format conversation history for context"""
        formatted = []
        for msg in history:
            role = "Usuario" if msg["role"] == "user" else "Asistente"
            formatted.append(f"{role}: {msg['content']}")
        return "\n".join(formatted)
    
    def _extract_search_criteria(self, message: str) -> Dict[str, Any]:
        """Extract search criteria from user message"""
        criteria = {}
        message_lower = message.lower()
        
        # Target type
        if 'inversor' in message_lower or 'investor' in message_lower:
            criteria['target_type'] = 'investor'
        elif 'validador' in message_lower:
            criteria['target_type'] = 'validator'
        elif 'partner' in message_lower or 'socio' in message_lower:
            criteria['target_type'] = 'partner'
        elif 'mentor' in message_lower:
            criteria['target_type'] = 'mentor'
        else:
            criteria['target_type'] = 'entrepreneur'
        
        # Industry keywords
        industries = ['fintech', 'healthtech', 'edtech', 'saas', 'ecommerce', 
                     'ai', 'blockchain', 'gaming', 'foodtech', 'proptech']
        for ind in industries:
            if ind in message_lower:
                criteria['industry'] = ind
                break
        
        return criteria
    
    def _generate_fallback_response(self, user_message: str, matches: List) -> str:
        """Generate a fallback response if AI fails"""
        if matches:
            return f"""¡He encontrado **{len(matches)} conexiones** potenciales para ti! 🎯

Aquí están las mejores coincidencias basadas en tu solicitud. 
Revisa los perfiles sugeridos y si alguno te interesa, puedo ayudarte a iniciar la conversación.

¿Te gustaría que busque conexiones más específicas o tienes alguna preferencia adicional?"""
        else:
            return """¡Hola! 👋 Soy tu AI SuperConnector.

Puedo ayudarte a encontrar:
• 🚀 **Emprendedores** en tu misma industria o etapa
• 💰 **Inversores** interesados en tu sector
• ✅ **Validadores** para feedback de tu producto
• 🤝 **Partners** para colaboraciones estratégicas

¿Qué tipo de conexiones estás buscando?"""


# Factory function
def create_ai_connector() -> AIConnectorTeam:
    """Create and return an AI Connector instance"""
    return AIConnectorTeam()


# Testing
if __name__ == "__main__":
    connector = create_ai_connector()
    
    # Test chat
    result = connector.chat(
        session_id="test-123",
        user_message="Quiero conectar con emprendedores de fintech",
        user_data={
            "id": 1,
            "name": "Test User",
            "user_type": "entrepreneur",
            "industry": "fintech",
            "stage": "seed"
        },
        available_users=[
            {"id": 2, "name": "María García", "user_type": "entrepreneur", "industry": "fintech", "country": "Spain"},
            {"id": 3, "name": "Carlos López", "user_type": "investor", "industry": "fintech", "country": "Mexico"},
            {"id": 4, "name": "Ana Martín", "user_type": "entrepreneur", "industry": "healthtech", "country": "Spain"}
        ]
    )
    
    print("Response:", result["message"])
    print("Matches:", result["matches"])
