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
            markdown=True
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
    
    def _analyze_user_type_with_ai(self, user: Dict[str, Any]) -> str:
        """
        Use AI to analyze user profile and determine their REAL type
        based on name, bio, company, interests, etc.
        """
        try:
            prompt = f"""
Analyze this user profile and determine if they are an INVESTOR or ENTREPRENEUR/FOUNDER.

User Profile:
- Name: {user.get('name', '')}
- Company: {user.get('industry', '')}
- Bio: {user.get('bio', '')}
- Interests: {user.get('interests', '')}
- Looking for: {user.get('looking_for', '')}
- Stage: {user.get('stage', '')}

Rules:
1. If name/company contains words like: VC, Ventures, Capital, Investment, Fund, Angel → INVESTOR
2. If bio/interests mention: investing, funding, capital, portfolio → INVESTOR  
3. If they are looking for "investment opportunities" or "startups to fund" → INVESTOR
4. Otherwise → ENTREPRENEUR

Respond with ONLY one word: INVESTOR or ENTREPRENEUR
"""
            
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=10
            )
            
            result = response.choices[0].message.content.strip().upper()
            detected = 'investor' if 'INVESTOR' in result else 'entrepreneur'
            print(f"  🤖 AI analyzed '{user.get('name')}': {detected}")
            return detected
            
        except Exception as e:
            print(f"Error analyzing user type with AI: {e}")
            return user.get('user_type', 'entrepreneur').lower()
    
    def _simple_matching(
        self,
        current_user: Dict[str, Any],
        potential_matches: List[Dict[str, Any]],
        search_criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Enhanced matching with AI-powered user type detection for investors
        """
        # DEBUG: Log ALL user types from database with names
        print(f"\n📊 DATABASE USERS RECEIVED ({len(potential_matches)} total):")
        user_types_count = {}
        for u in potential_matches:
            utype = (u.get('user_type') or 'unknown').lower()
            user_types_count[utype] = user_types_count.get(utype, 0) + 1
            print(f"  - {u.get('name')}: role='{utype}'")
        print(f"🔍 Summary by type: {user_types_count}")
        
        matches = []
        user_industry = (current_user.get('industry') or '').lower()
        user_stage = (current_user.get('stage') or '').lower()
        user_location = (current_user.get('country') or '').lower()
        target_type = (search_criteria.get('target_type') or 'entrepreneur').lower()
        
        print(f"🎯 Looking for: {target_type}")
        
        # Normalize target type
        type_mappings = {
            'founder': 'entrepreneur',
            'startup founder': 'entrepreneur',
            'emprendedor': 'entrepreneur',
            'investors': 'investor',
            'inversores': 'investor',
            'investor': 'investor',
            'mentor': 'mentor',
            'mentores': 'mentor',
            'validator': 'validator',
            'validadores': 'validator',
            'partner': 'partner',
            'partners': 'partner'
        }
        normalized_target = type_mappings.get(target_type, target_type)
        
        # CRITICAL: Filter to ONLY users of requested type
        filtered_by_type = []
        for u in potential_matches:
            if u.get('id') == current_user.get('id'):
                continue
            
            utype = (u.get('user_type') or '').lower()
            original_type = utype  # Keep original for logging
            
            # Normalize user type for comparison
            if utype in ['founder', 'startup founder']:
                utype = 'entrepreneur'
            
            print(f"  🔍 Checking user {u.get('name')}: DB role='{original_type}' normalized='{utype}' target='{normalized_target}'")
            
            # Direct match with database role
            if utype == normalized_target or original_type == normalized_target:
                filtered_by_type.append(u)
                print(f"    ✅ MATCH: Added {u.get('name')} (type={original_type})")
            # For investors specifically, also check with AI if role is ambiguous
            elif normalized_target == 'investor' and utype in ['entrepreneur', 'founder']:
                print(f"    🤖 Analyzing {u.get('name')} with AI (ambiguous founder)...")
                detected_type = self._analyze_user_type_with_ai(u)
                if detected_type == 'investor':
                    u['user_type'] = 'investor'
                    u['ai_detected'] = True
                    filtered_by_type.append(u)
                    print(f"    ✅ AI DETECTED as investor")
                else:
                    print(f"    ❌ AI confirmed as entrepreneur")
            else:
                print(f"    ❌ SKIP: Not a match")
        
        print(f"✓ Found {len(filtered_by_type)} users of type '{normalized_target}' (from {len(potential_matches)} total)")
        
        # If no users of requested type, return empty immediately
        if len(filtered_by_type) == 0:
            print(f"❌ No users with type '{normalized_target}' found in database")
            return []
        
        search_industry = search_criteria.get('industry', '').lower()
        search_stage = search_criteria.get('stage', '').lower()
        search_location = search_criteria.get('location', '').lower()
        keywords = search_criteria.get('keywords', [])
        
        for match in filtered_by_type:
            match_type = (match.get('user_type') or '').lower()
            # Normalize for display
            if match_type in ['founder', 'startup founder']:
                match_type = 'entrepreneur'
            
            # DEBUG: Log match that passes filter
            print(f"  ✓ Processing match: {match.get('name')} is {match_type}")
            
            score = 0
            reasons = []
            match_name = match.get('name') or match.get('full_name') or 'Usuario'
            
            # User type match (35 points - already matched above)
            score += 35
            type_labels = {
                'entrepreneur': 'emprendedor',
                'investor': 'inversor',
                'validator': 'validador',
                'partner': 'partner',
                'mentor': 'mentor'
            }
            reasons.append(f"✓ Es {type_labels.get(match_type, match_type)}")
            
            # Industry match (30 points max)
            match_industry = (match.get('industry') or '').lower()
            if search_industry and match_industry:
                if search_industry in match_industry or match_industry in search_industry:
                    score += 30
                    reasons.append(f"🎯 Industria: {match.get('industry')}")
                elif user_industry and (user_industry in match_industry or match_industry in user_industry):
                    score += 20
                    reasons.append(f"📊 Similar industria: {match.get('industry')}")
            elif user_industry and match_industry and (user_industry in match_industry or match_industry in user_industry):
                score += 25
                reasons.append(f"📊 Misma industria: {match.get('industry')}")
            
            # Stage match (15 points max)
            match_stage = (match.get('stage') or '').lower()
            if search_stage and match_stage:
                if search_stage == match_stage:
                    score += 15
                    reasons.append(f"🚀 Etapa: {match.get('stage')}")
                elif abs(self._stage_value(search_stage) - self._stage_value(match_stage)) <= 1:
                    score += 10
                    reasons.append(f"📈 Etapa similar: {match.get('stage')}")
            elif user_stage and match_stage and user_stage == match_stage:
                score += 12
                reasons.append(f"🚀 Misma etapa: {match.get('stage')}")
            
            # Location match (10 points max)
            match_location = (match.get('country') or '').lower()
            if search_location and match_location:
                if search_location in match_location or match_location in search_location:
                    score += 10
                    reasons.append(f"🌍 Ubicación: {match.get('country')}")
            elif user_location and match_location and user_location == match_location:
                score += 8
                reasons.append(f"📍 Mismo país: {match.get('country')}")
            
            # Keyword matching in profile (10 points max)
            if keywords:
                match_text = f"{match_name} {match_industry} {match_stage} {match.get('bio', '')} {match.get('interests', '')}".lower()
                keyword_matches = [kw for kw in keywords if kw in match_text]
                if keyword_matches:
                    score += min(10, len(keyword_matches) * 3)
                    reasons.append(f"🔍 Keywords: {', '.join(keyword_matches[:3])}")
            
            # Looking for / Can offer match (bonus 10 points)
            looking_for = search_criteria.get('looking_for', '')
            if looking_for:
                can_offer = (match.get('can_offer') or '').lower()
                if looking_for in can_offer:
                    score += 10
                    reasons.append(f"💡 Puede ofrecer: {looking_for}")
            
            # Apply minimum threshold
            # Higher threshold when searching for specific non-entrepreneur types
            min_threshold = 35 if target_type in ['investor', 'validator', 'mentor', 'partner'] else 40
            
            if score >= min_threshold:
                matches.append({
                    "id": match.get('id'),
                    "name": match_name,
                    "score": min(100, score),  # Cap at 100
                    "reason": " • ".join(reasons) if reasons else "Perfil relevante para conectar",
                    "conversation_starters": self._generate_conversation_starters(match, current_user, search_criteria),
                    "user_type": match.get('user_type'),
                    "industry": match.get('industry'),
                    "stage": match.get('stage'),
                    "country": match.get('country'),
                    "avatar_url": match.get('avatar_url'),
                    "bio": match.get('bio', '')
                })
        
        return sorted(matches, key=lambda x: x['score'], reverse=True)
    
    def _stage_value(self, stage: str) -> int:
        """Convert stage to numeric value for comparison"""
        stages = {
            'idea': 0,
            'mvp': 1,
            'seed': 2,
            'pre-seed': 2,
            'series_a': 3,
            'series a': 3,
            'series_b': 4,
            'series b': 4,
            'growth': 5,
            'scale': 6
        }
        return stages.get(stage.lower(), 2)
    
    def _generate_conversation_starters(
        self, 
        match: Dict[str, Any], 
        current_user: Dict[str, Any],
        search_criteria: Dict[str, Any]
    ) -> List[str]:
        """Generate personalized conversation starters"""
        starters = []
        match_name = match.get('name', 'Usuario').split()[0]
        
        # Based on industry
        if match.get('industry'):
            starters.append(f"Hola {match_name}! Vi que trabajas en {match.get('industry')}, me gustaría conocer más sobre tu proyecto.")
        
        # Based on stage
        if match.get('stage'):
            starters.append(f"Hola! Veo que estás en etapa {match.get('stage')}. ¿Cómo va el desarrollo?")
        
        # Based on search intent
        looking_for = search_criteria.get('looking_for')
        if looking_for == 'funding':
            starters.append(f"Hola {match_name}! Estoy buscando financiación. ¿Tienes experiencia levantando capital?")
        elif looking_for == 'validation':
            starters.append(f"Hola! ¿Estarías interesado en dar feedback sobre mi producto?")
        elif looking_for == 'partner':
            starters.append(f"Hola {match_name}! Creo que podríamos colaborar. ¿Te interesaría explorar sinergias?")
        
        # Generic fallback
        if not starters:
            starters.append(f"Hola {match_name}! Vi tu perfil en ASTAR y me gustaría conectar contigo.")
        
        return starters[:3]  # Max 3 starters
    
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
        
        # ALWAYS find matches if users are available
        matches = []
        if available_users:
            # Extract search criteria from the message
            search_criteria = self._extract_search_criteria(user_message)
            session["search_preferences"].update(search_criteria)
            
            print(f"🔍 Searching for matches with criteria: {search_criteria}")
            
            # Find matches using real database users
            matches = self.find_matches(
                current_user=session.get("user_context", {}),
                potential_matches=available_users,
                search_criteria=search_criteria
            )
            session["suggested_connections"] = matches
            
            print(f"✓ Found {len(matches)} real matches from database")
        
        # Generate SHORT response presenting the real matches
        if matches:
            # Build detailed list of real matches to show
            top_matches = matches[:5]
            matches_list = []
            
            for i, m in enumerate(top_matches, 1):
                user_type_display = m.get('user_type', 'usuario')
                if user_type_display.lower() in ['founder', 'startup founder']:
                    user_type_display = 'entrepreneur'
                type_labels = {
                    'entrepreneur': 'Emprendedor',
                    'investor': 'Inversor',
                    'validator': 'Validador',
                    'partner': 'Partner',
                    'mentor': 'Mentor'
                }
                type_display = type_labels.get(user_type_display.lower(), user_type_display.title())
                
                # Add AI badge if detected by AI
                ai_badge = " 🤖" if m.get('ai_detected') else ""
                
                # Simplified format - just name, type, key info
                parts = [f"{i}. **{m.get('name', 'Usuario')}** ({type_display}{ai_badge})"]
                
                if m.get('industry'):
                    parts.append(f"- {m.get('industry')}")
                if m.get('country'):
                    parts.append(f"- {m.get('country')}")
                
                matches_list.append(" ".join(parts))
            
            matches_text = "\n".join(matches_list)
            
            # Create simple criteria text
            type_labels_plural = {
                'entrepreneur': 'emprendedores',
                'investor': 'inversores',
                'validator': 'validadores',
                'partner': 'partners',
                'mentor': 'mentores'
            }
            target_label = type_labels_plural.get(search_criteria.get('target_type', 'entrepreneur'), 'usuarios')
            
            ai_message = f"""🎯 **{len(matches)} {target_label} encontrados:**

{matches_text}

✨ Puedes conectar con ellos desde la plataforma."""
        else:
            # Special message for investors if none found
            if search_criteria.get('target_type') and 'invest' in search_criteria.get('target_type', '').lower():
                ai_message = """❌ **No hay inversores registrados** en la plataforma todavía.

💡 **Sugerencias:**
• Invita a inversores a unirse a ASTAR Labs
• Busca mentores o validadores que puedan darte feedback
• Conecta con emprendedores en tu industria para compartir experiencias

🚀 ¿Quieres que busque emprendedores, mentores o validadores en su lugar?"""
            else:
                # Build helpful no-results message with statistics
                criteria_parts = []
                if search_criteria.get('target_type'):
                    type_labels = {
                        'entrepreneur': 'emprendedores',
                        'investor': 'inversores',
                        'validator': 'validadores',
                        'partner': 'partners',
                        'mentor': 'mentores'
                    }
                    criteria_parts.append(type_labels.get(search_criteria['target_type'], 'usuarios'))
                if search_criteria.get('industry'):
                    criteria_parts.append(f"en {search_criteria['industry']}")
                
                criteria_text = " ".join(criteria_parts) if criteria_parts else "con esos criterios exactos"
                
                ai_message = f"""🔍 No encontré {criteria_text} en este momento.

💡 **Sugerencias:**
• Intenta buscar con criterios más amplios
• Busca usuarios en otras industrias o países
• Comparte tu perfil para atraer conexiones relevantes

🚀 ¿Quieres que busque con otros criterios?"""
        
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
        """Extract search criteria from user message using AI"""
        message_lower = message.lower()
        
        # Use OpenAI to better understand the search intent
        try:
            response = openai.chat.completions.create(
                model=self.config.openai_model,
                messages=[
                    {
                        "role": "system", 
                        "content": """Eres un experto en analizar búsquedas de networking. 
Extrae criterios de búsqueda de mensajes de usuarios.
Responde SOLO con JSON válido, sin explicaciones.
Campos: target_type (entrepreneur/investor/validator/partner/mentor), 
industry (fintech/healthtech/edtech/saas/ecommerce/ai/blockchain/gaming/foodtech/proptech/agritech/cleantech/biotech/legaltech/hrtech/martech), 
stage (idea/mvp/seed/series_a/series_b/growth/scale),
location (país o región),
keywords (array de palabras clave relevantes),
looking_for (qué busca: funding/cofounder/validation/customers/talent/partner/mentor)"""
                    },
                    {"role": "user", "content": f"Mensaje del usuario: '{message}'"}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            result_text = response.choices[0].message.content
            # Parse JSON from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            criteria = json.loads(result_text.strip())
            print(f"✓ AI extracted criteria: {criteria}")
            return criteria
            
        except Exception as e:
            print(f"⚠️ AI extraction failed, using fallback: {e}")
            # Fallback to keyword matching
            return self._extract_criteria_fallback(message_lower)
    
    def _extract_criteria_fallback(self, message_lower: str) -> Dict[str, Any]:
        """Fallback keyword-based criteria extraction"""
        criteria = {
            "keywords": []
        }
        
        # Target type
        type_keywords = {
            'investor': ['inversor', 'investor', 'inversión', 'capital', 'funding'],
            'validator': ['validador', 'validator', 'feedback', 'validación'],
            'partner': ['partner', 'socio', 'colaboración', 'colaborador', 'alianza'],
            'mentor': ['mentor', 'mentora', 'asesor', 'consejero'],
            'entrepreneur': ['emprendedor', 'founder', 'startup', 'empresa']
        }
        
        for type_key, keywords in type_keywords.items():
            if any(kw in message_lower for kw in keywords):
                criteria['target_type'] = type_key
                break
        
        if 'target_type' not in criteria:
            criteria['target_type'] = 'entrepreneur'
        
        # Industry keywords (expanded list)
        industries = {
            'fintech': ['fintech', 'financiero', 'banco', 'pagos', 'cripto', 'blockchain'],
            'healthtech': ['healthtech', 'salud', 'médico', 'hospital', 'telemedicina'],
            'edtech': ['edtech', 'educación', 'aprendizaje', 'e-learning', 'cursos'],
            'saas': ['saas', 'software', 'cloud', 'plataforma'],
            'ecommerce': ['ecommerce', 'e-commerce', 'tienda', 'marketplace', 'retail'],
            'ai': ['inteligencia artificial', 'ai', 'machine learning', 'ml', 'deep learning'],
            'blockchain': ['blockchain', 'crypto', 'web3', 'nft', 'defi'],
            'gaming': ['gaming', 'juegos', 'videojuegos', 'esports'],
            'foodtech': ['foodtech', 'comida', 'restaurante', 'delivery'],
            'proptech': ['proptech', 'inmobiliario', 'bienes raíces', 'vivienda'],
            'agritech': ['agritech', 'agricultura', 'farming', 'agrícola'],
            'cleantech': ['cleantech', 'energía', 'sostenible', 'renovable', 'verde'],
            'biotech': ['biotech', 'biotecnología', 'biología', 'farmacéutico'],
            'legaltech': ['legaltech', 'legal', 'abogado', 'jurídico'],
            'hrtech': ['hrtech', 'recursos humanos', 'rrhh', 'talento', 'reclutamiento'],
            'martech': ['martech', 'marketing', 'publicidad', 'ads']
        }
        
        for ind, keywords in industries.items():
            if any(kw in message_lower for kw in keywords):
                criteria['industry'] = ind
                criteria['keywords'].extend([kw for kw in keywords if kw in message_lower])
                break
        
        # Stage keywords
        stages = {
            'idea': ['idea', 'concepto', 'empezando'],
            'mvp': ['mvp', 'prototipo', 'beta'],
            'seed': ['seed', 'semilla', 'pre-seed'],
            'series_a': ['series a', 'serie a', 'ronda a'],
            'growth': ['crecimiento', 'growth', 'escalando', 'scale']
        }
        
        for stage, keywords in stages.items():
            if any(kw in message_lower for kw in keywords):
                criteria['stage'] = stage
                break
        
        # Looking for
        looking_keywords = {
            'funding': ['financiación', 'inversión', 'capital', 'funding'],
            'cofounder': ['cofundador', 'cofounder', 'socio fundador'],
            'validation': ['validación', 'feedback', 'testear', 'probar'],
            'customers': ['clientes', 'customers', 'usuarios', 'ventas'],
            'talent': ['talento', 'equipo', 'contratar', 'team'],
            'partner': ['partner', 'alianza', 'colaboración'],
            'mentor': ['mentor', 'asesoría', 'consejo']
        }
        
        for looking, keywords in looking_keywords.items():
            if any(kw in message_lower for kw in keywords):
                criteria['looking_for'] = looking
                criteria['keywords'].extend([kw for kw in keywords if kw in message_lower])
                break
        
        # Extract location if mentioned
        countries = ['españa', 'mexico', 'colombia', 'argentina', 'chile', 'peru', 
                    'spain', 'usa', 'uk', 'brazil', 'france', 'germany']
        for country in countries:
            if country in message_lower:
                criteria['location'] = country
                criteria['keywords'].append(country)
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
