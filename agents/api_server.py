"""
Multi-Agent API Server
Flask REST API para el sistema multi-agente (LinkedIn, Metrics, Brand Marketing)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from apify_client import ApifyClient
import openai

# Import AI agents
try:
    from ai_connector_agent import AIConnectorTeam
    ai_connector_team = AIConnectorTeam()
    print("✓ AI Connector Agent initialized")
except Exception as e:
    print(f"⚠ AI Connector Agent not available: {e}")
    ai_connector_team = None

app = Flask(__name__)
CORS(app)

# Configuration - Get from environment variables
# DO NOT hardcode API keys here. Set them in Railway/Render environment variables.
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
FAL_KEY = os.getenv("FAL_KEY")

if not APIFY_API_TOKEN:
    print("Warning: APIFY_API_TOKEN not set - LinkedIn and scraping features will be limited")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")
if not FAL_KEY:
    print("Warning: FAL_KEY not set - Image generation features will be limited")

# Initialize clients
apify_client = ApifyClient(APIFY_API_TOKEN)
openai.api_key = OPENAI_API_KEY


def search_linkedin_with_apify(query: str, max_results: int = 20) -> list:
    """
    Busca perfiles de LinkedIn usando Apify LinkedIn Profile Scraper
    """
    try:
        # LinkedIn People Search Scraper
        actor_id = "curious-coder/linkedin-people-search-scraper"
        
        run_input = {
            "searchQuery": query,
            "maxResults": max_results,
            "proxy": {
                "useApifyProxy": True,
                "apifyProxyGroups": ["RESIDENTIAL"]
            }
        }
        
        # Run the actor and wait for it to finish
        run = apify_client.actor(actor_id).call(run_input=run_input)
        
        # Fetch results from the dataset
        profiles = []
        for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
            profiles.append({
                "id": item.get("publicIdentifier", ""),
                "name": item.get("fullName", ""),
                "headline": item.get("headline", ""),
                "location": item.get("location", ""),
                "industry": item.get("industry", ""),
                "profileUrl": item.get("profileUrl", ""),
                "photoUrl": item.get("photoUrl", ""),
                "connections": item.get("connectionsCount", 0),
                "about": item.get("summary", ""),
                "experience": item.get("experience", [])[:3] if item.get("experience") else []
            })
        
        return profiles
    except Exception as e:
        print(f"Error scraping LinkedIn: {e}")
        return []


def analyze_compatibility_with_ai(profile: dict, target_criteria: str, company_description: str = "") -> dict:
    """
    Analiza la compatibilidad de un perfil usando OpenAI
    """
    try:
        prompt = f"""Analiza la compatibilidad entre este perfil de LinkedIn y los criterios de búsqueda.

Perfil:
- Nombre: {profile.get('name')}
- Headline: {profile.get('headline')}
- Ubicación: {profile.get('location')}
- Industria: {profile.get('industry')}
- About: {profile.get('about', 'N/A')}

Criterios de búsqueda: {target_criteria}
Descripción de la empresa: {company_description}

Proporciona:
1. Score de compatibilidad (0-100)
2. 3-5 razones principales de compatibilidad
3. Puntos de conversación recomendados
4. Approach recomendado

Responde en formato JSON con esta estructura:
{{
    "compatibility_score": 85,
    "match_reasons": ["razón 1", "razón 2", "razón 3"],
    "talking_points": ["punto 1", "punto 2"],
    "recommended_approach": "descripción del approach",
    "confidence": "high|medium|low"
}}
"""
        
        response = openai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Eres un experto en networking y análisis de perfiles profesionales."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(response.choices[0].message.content)
        return analysis
    except Exception as e:
        print(f"Error analyzing compatibility: {e}")
        return {
            "compatibility_score": 50,
            "match_reasons": ["Error en el análisis"],
            "talking_points": [],
            "recommended_approach": "Approach general",
            "confidence": "low"
        }


def generate_connection_message_with_ai(profile: dict, purpose: str, sender_info: dict, custom_notes: str = "") -> str:
    """
    Genera un mensaje personalizado usando OpenAI
    """
    try:
        prompt = f"""Genera un mensaje de conexión personalizado para LinkedIn.

Perfil del destinatario:
- Nombre: {profile.get('name')}
- Headline: {profile.get('headline')}
- Ubicación: {profile.get('location')}

Información del remitente:
- Nombre: {sender_info.get('name')}
- Empresa: {sender_info.get('company')}
- Título: {sender_info.get('title')}

Propósito: {purpose}
Notas adicionales: {custom_notes}

El mensaje debe:
- Ser corto (máximo 300 caracteres para LinkedIn)
- Mencionar algo específico del perfil del destinatario
- Ser profesional pero amigable
- Incluir un call-to-action claro
- NO usar placeholders como [Nombre] o [Empresa]

Responde SOLO con el mensaje, sin explicaciones adicionales.
"""
        
        response = openai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Eres un experto en escribir mensajes de networking profesionales para LinkedIn."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8
        )
        
        message = response.choices[0].message.content.strip()
        return message
    except Exception as e:
        print(f"Error generating message: {e}")
        return "Error generando mensaje personalizado"


# ==============================================
# API ENDPOINTS
# ==============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "apify_configured": bool(APIFY_API_TOKEN),
        "openai_configured": bool(OPENAI_API_KEY)
    })


@app.route('/search', methods=['POST'])
def search_profiles():
    """
    POST /search
    Body: {
        "type": "investor|talent|customer|partner",
        "query": "search terms",
        "filters": {
            "location": "optional",
            "industry": "optional"
        },
        "maxResults": 20
    }
    """
    try:
        data = request.json
        profile_type = data.get('type', 'investor')
        query = data.get('query', '')
        filters = data.get('filters', {})
        max_results = data.get('maxResults', 20)
        
        # Construir query según tipo
        type_keywords = {
            "investor": "venture capital OR angel investor OR VC",
            "founder": "founder OR CEO OR entrepreneur",
            "talent": "software engineer OR developer",
            "customer": "CTO OR VP Engineering",
            "partner": "business development OR partnerships"
        }
        
        search_query = f"{query} {type_keywords.get(profile_type, '')}"
        
        if filters.get('location'):
            search_query += f" {filters['location']}"
        if filters.get('industry'):
            search_query += f" {filters['industry']}"
        
        # Buscar perfiles con Apify
        profiles = search_linkedin_with_apify(search_query, max_results)
        
        # Analizar compatibilidad con AI
        target_criteria = f"Buscando {profile_type}: {query}"
        for profile in profiles:
            analysis = analyze_compatibility_with_ai(profile, target_criteria)
            profile['compatibilityScore'] = analysis.get('compatibility_score', 50)
            profile['matchReasons'] = analysis.get('match_reasons', [])
            profile['selected'] = False
        
        # Ordenar por score
        profiles.sort(key=lambda x: x.get('compatibilityScore', 0), reverse=True)
        
        return jsonify({
            "success": True,
            "type": profile_type,
            "query": search_query,
            "totalResults": len(profiles),
            "profiles": profiles
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/analyze', methods=['POST'])
def analyze_profile():
    """
    POST /analyze
    Body: {
        "profile": {...},
        "targetCriteria": "string",
        "companyDescription": "optional"
    }
    """
    try:
        data = request.json
        profile = data.get('profile', {})
        target_criteria = data.get('targetCriteria', '')
        company_description = data.get('companyDescription', '')
        
        analysis = analyze_compatibility_with_ai(profile, target_criteria, company_description)
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/generate-message', methods=['POST'])
def generate_message():
    """
    POST /generate-message
    Body: {
        "profiles": [...],
        "purpose": "investment|partnership|hiring|mentorship",
        "senderInfo": {
            "name": "string",
            "company": "string",
            "title": "string"
        },
        "customNotes": "optional"
    }
    """
    try:
        data = request.json
        profiles = data.get('profiles', [])
        purpose = data.get('purpose', 'investment')
        sender_info = data.get('senderInfo', {})
        custom_notes = data.get('customNotes', '')
        
        messages = []
        for profile in profiles:
            message = generate_connection_message_with_ai(
                profile, 
                purpose, 
                sender_info, 
                custom_notes
            )
            messages.append({
                "profileId": profile.get('id'),
                "profileName": profile.get('name'),
                "message": message,
                "characterCount": len(message)
            })
        
        return jsonify({
            "success": True,
            "messages": messages,
            "totalMessages": len(messages)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==============================================
# METRICS & BRAND MARKETING ENDPOINTS
# ==============================================

@app.route('/api/agents/metrics/analyze', methods=['POST'])
def analyze_startup_metrics():
    """
    POST /api/agents/metrics/analyze
    Body: {
        "user_id": number (required - for database access),
        "query": "string (optional - specific question)",
        "industry": "SaaS|fintech|ecommerce|healthtech",
        "stage": "seed|series_a|series_b|growth"
    }
    """
    try:
        from metrics_agent import MetricsTeam
        
        data = request.json
        user_id = data.get('user_id')
        query = data.get('query', 'Analiza mis métricas actuales y dame recomendaciones')
        industry = data.get('industry', 'SaaS')
        stage = data.get('stage', 'seed')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "user_id is required for database access"
            }), 400
        
        metrics_team = MetricsTeam()
        result = metrics_team.analyze_with_real_data(
            user_id=user_id,
            query=query
        )
        
        return jsonify({
            "success": result.get("success", False),
            "analysis": result.get("response"),
            "error": result.get("error"),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/metrics/chat', methods=['POST'])
def metrics_chat():
    """
    POST /api/agents/metrics/chat
    Body: {
        "user_id": number (required),
        "message": "string",
        "session_id": "string (optional)"
    }
    """
    try:
        from metrics_agent import MetricsTeam
        
        data = request.json
        user_id = data.get('user_id')
        message = data.get('message', '')
        session_id = data.get('session_id', f"session_{user_id}")
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "user_id is required"
            }), 400
        
        if not message:
            return jsonify({
                "success": False,
                "error": "message is required"
            }), 400
        
        metrics_team = MetricsTeam()
        result = metrics_team.chat(
            message=message,
            session_id=session_id,
            user_id=user_id
        )
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/metrics/report', methods=['POST'])
def generate_weekly_report():
    """
    POST /api/agents/metrics/report
    Body: {
        "user_id": number (required),
        "period": "weekly|monthly|quarterly"
    }
    """
    try:
        from metrics_agent import MetricsTeam
        
        data = request.json
        user_id = data.get('user_id')
        period = data.get('period', 'weekly')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "user_id is required"
            }), 400
        
        metrics_team = MetricsTeam()
        result = metrics_team.get_weekly_report(user_id=user_id)
        
        return jsonify({
            "success": result.get("success", False),
            "report": result.get("report"),
            "raw_data": result.get("raw_data"),
            "period": period,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/metrics/compare', methods=['POST'])
def compare_to_benchmarks():
    """
    POST /api/agents/metrics/compare
    Body: {
        "user_id": number (required),
        "industry": "SaaS|fintech|ecommerce",
        "stage": "seed|series_a|series_b"
    }
    """
    try:
        from metrics_agent import MetricsTeam
        
        data = request.json
        user_id = data.get('user_id')
        industry = data.get('industry', 'SaaS')
        stage = data.get('stage', 'seed')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "user_id is required"
            }), 400
        
        metrics_team = MetricsTeam()
        result = metrics_team.compare_to_industry(
            user_id=user_id,
            industry=industry,
            stage=stage
        )
        
        return jsonify({
            "success": result.get("success", False),
            "comparison": result.get("comparison"),
            "insights": result.get("insights"),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/brand/analyze', methods=['POST'])
def analyze_brand_identity():
    """
    POST /api/agents/brand/analyze
    Body: {
        "website_url": "string",
        "custom_prompt": "string (optional)"
    }
    """
    try:
        from brand_marketing_agent import BrandMarketingTeam
        
        data = request.json
        website_url = data.get('website_url', '')
        custom_prompt = data.get('custom_prompt', '')
        
        if not website_url:
            return jsonify({
                "success": False,
                "error": "website_url is required"
            }), 400
        
        brand_team = BrandMarketingTeam()
        
        # Si hay un custom_prompt, usar el método de chat
        if custom_prompt:
            result = brand_team.chat(
                message=f"{custom_prompt}\n\nWebsite URL: {website_url}",
                session_id=f"brand_analysis_{datetime.now().timestamp()}"
            )
            
            # Asegurar que siempre retornamos un jsonify
            if isinstance(result, dict):
                response_text = result.get('response', result.get('content', 'No response generated'))
            else:
                response_text = str(result)
            
            return jsonify({
                "success": True,
                "response": response_text,
                "timestamp": datetime.now().isoformat()
            })
        else:
            # Análisis estándar de marca
            result = brand_team.analyze_full_brand(website_url)
            
            # Convertir result a string si es necesario
            if isinstance(result, dict):
                response_text = result.get('response', result.get('content', f"Análisis de marca completado para {website_url}"))
            else:
                response_text = str(result)
            
            return jsonify({
                "success": True,
                "response": response_text,
                "timestamp": datetime.now().isoformat()
            })
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in brand analysis: {error_details}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/brand/generate-images', methods=['POST'])
def generate_marketing_images():
    """
    POST /api/agents/brand/generate-images
    Body: {
        "website_url": "string",
        "content_types": ["social_post", "banner", "story", "ad"],
        "campaign_name": "string (optional)"
    }
    """
    try:
        from brand_marketing_agent import BrandMarketingTeam
        
        data = request.json
        website_url = data.get('website_url', '')
        content_types = data.get('content_types', ['social_post'])
        campaign_name = data.get('campaign_name', f"campaign_{datetime.now().strftime('%Y%m%d')}")
        
        if not website_url:
            return jsonify({
                "success": False,
                "error": "website_url is required"
            }), 400
        
        brand_team = BrandMarketingTeam()
        result = brand_team.generate_brand_marketing(
            website_url=website_url,
            content_types=content_types,
            campaign_name=campaign_name
        )
        
        return jsonify({
            "success": True,
            "images": result.get("images", []),
            "brand_identity": result.get("brand_identity", {}),
            "campaign_name": campaign_name,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/orchestrator/analyze', methods=['POST'])
def orchestrator_full_analysis():
    """
    POST /api/agents/orchestrator/analyze
    Full startup analysis using all agent teams
    Body: {
        "startup_url": "string",
        "startup_name": "string",
        "description": "string",
        "metrics": {...} (optional),
        "generate_images": boolean (default: true)
    }
    """
    try:
        from orchestrator_agent import MultiAgentOrchestrator
        
        data = request.json
        startup_url = data.get('startup_url', '')
        startup_name = data.get('startup_name', 'Startup')
        description = data.get('description', '')
        metrics = data.get('metrics')
        generate_images = data.get('generate_images', True)
        
        if not startup_url:
            return jsonify({
                "success": False,
                "error": "startup_url is required"
            }), 400
        
        orchestrator = MultiAgentOrchestrator()
        result = orchestrator.analyze_startup(
            startup_url=startup_url,
            startup_name=startup_name,
            description=description,
            metrics=metrics,
            generate_images=generate_images
        )
        
        return jsonify({
            "success": True,
            "analysis": result,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/agents/health', methods=['GET'])
def agents_health_check():
    """Health check for all agent systems"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agents": {
            "linkedin": {
                "status": "available" if APIFY_API_TOKEN else "limited",
                "apify_configured": bool(APIFY_API_TOKEN)
            },
            "metrics": {
                "status": "available" if OPENAI_API_KEY else "unavailable",
                "openai_configured": bool(OPENAI_API_KEY)
            },
            "brand_marketing": {
                "status": "available" if (OPENAI_API_KEY and FAL_KEY) else "limited",
                "openai_configured": bool(OPENAI_API_KEY),
                "fal_configured": bool(FAL_KEY),
                "apify_configured": bool(APIFY_API_TOKEN)
            },
            "orchestrator": {
                "status": "available" if OPENAI_API_KEY else "unavailable"
            },
            "ai_connector": {
                "status": "available" if OPENAI_API_KEY else "unavailable",
                "openai_configured": bool(OPENAI_API_KEY)
            }
        }
    }
    return jsonify(health_status)


# ==============================================
# AI CONNECTOR ENDPOINTS
# ==============================================

# AI Connector session storage
ai_connector_sessions = {}

@app.route('/api/connector/chat', methods=['POST'])
def ai_connector_chat():
    """
    Chat endpoint for AI Connector
    Uses AIConnectorTeam agent to analyze profiles and suggest intelligent connections
    """
    try:
        data = request.json
        session_id = data.get('session_id', f'session_{int(datetime.now().timestamp())}')
        message = data.get('message', '')
        user_id = data.get('user_id')
        user_profile = data.get('user_profile', {})
        available_users = data.get('available_users', [])  # Get users from frontend
        
        if not message:
            return jsonify({
                "success": False,
                "error": "Message is required"
            }), 400
        
        # Use AI Connector agent if available AND we have users
        if ai_connector_team and available_users:
            try:
                print(f"🤖 Using AI Connector Agent with {len(available_users)} users")
                result = ai_connector_team.chat(
                    session_id=session_id,
                    user_message=message,
                    user_data=user_profile,
                    available_users=available_users
                )
                
                print(f"✓ AI Agent returned {len(result.get('matches', []))} matches")
                
                # Format matches to match expected frontend format
                formatted_matches = []
                for match in result.get('matches', [])[:5]:
                    formatted_matches.append({
                        "id": match.get('id'),
                        "name": match.get('name'),
                        "user_type": match.get('user_type'),
                        "industry": match.get('industry'),
                        "country": match.get('country'),
                        "stage": match.get('stage'),
                        "avatar": match.get('avatar_url'),
                        "bio": (match.get('bio') or '')[:200],
                        "score": match.get('score', 50) / 100.0,  # Convert to 0-1 range
                        "reason": match.get('reason', 'Conexión potencial interesante')
                    })
                
                return jsonify({
                    "success": True,
                    "response": result.get('message', ''),
                    "matches": formatted_matches,
                    "session_id": session_id,
                    "source": "railway_ai"
                })
                
            except Exception as agent_err:
                print(f"❌ AI Connector Agent error: {agent_err}")
                import traceback
                traceback.print_exc()
                # Fall through to fallback below
        else:
            print(f"⚠️ AI Connector not available. Agent: {ai_connector_team is not None}, Users: {len(available_users)}")
                # Fall through to fallback below
        
        # Fallback: Use simple matching
        print("Using fallback matching...")
        matches = find_connector_matches(
            message=message,
            current_user=user_profile,
            available_users=available_users
        )
        
        response_text = generate_connector_response(
            message=message,
            user_context=user_profile,
            matches=matches,
            history=[]
        )
        
        # Format matches
        formatted_matches = []
        for match in matches[:5]:
            formatted_matches.append({
                "id": match.get('id'),
                "name": match.get('name'),
                "user_type": match.get('user_type'),
                "industry": match.get('industry'),
                "country": match.get('country'),
                "stage": match.get('stage'),
                "avatar": match.get('avatar_url'),
                "bio": match.get('bio', '')[:200],
                "score": match.get('score', 50) / 100.0,
                "reason": match.get('reason', 'Conexión interesante')
            })
        
        return jsonify({
            "success": True,
            "response": response_text,
            "matches": formatted_matches,
            "session_id": session_id
        })
        
    except Exception as e:
        print(f"AI Connector endpoint error: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def get_all_users_for_matching(exclude_user_id=None):
    """
    Get all users from database for matching
    Returns list of user dictionaries
    """
    try:
        # Get database URL from environment
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print("No DATABASE_URL configured")
            return []
        
        # Make HTTP request to get users (since we're calling from Railway to Cloudflare)
        # This would need to be implemented in the main app
        # For now, return empty list - the TypeScript endpoint will handle this
        return []
        
    except Exception as e:
        print(f"Error getting users: {e}")
        return []


def find_connector_matches(
    message: str,
    current_user: dict,
    available_users: list
) -> list:
    """
    Find matching users based on the request
    """
    if not available_users:
        return []
    
    message_lower = message.lower()
    
    # Determine target type from message
    target_type = None
    if 'inversor' in message_lower or 'investor' in message_lower:
        target_type = 'investor'
    elif 'validador' in message_lower:
        target_type = 'validator'
    elif 'partner' in message_lower or 'socio' in message_lower:
        target_type = 'partner'
    elif 'mentor' in message_lower:
        target_type = 'mentor'
    elif 'emprendedor' in message_lower or 'entrepreneur' in message_lower:
        target_type = 'entrepreneur'
    
    # Extract industry keywords
    industries = ['fintech', 'healthtech', 'edtech', 'saas', 'ecommerce', 
                 'ai', 'blockchain', 'gaming', 'foodtech', 'proptech', 
                 'b2b', 'b2c', 'marketplace', 'tech']
    target_industry = None
    for ind in industries:
        if ind in message_lower:
            target_industry = ind
            break
    
    current_user_id = current_user.get('id')
    current_industry = (current_user.get('industry') or '').lower()
    current_country = current_user.get('country')
    
    matches = []
    for user in available_users:
        if user.get('id') == current_user_id:
            continue
        
        score = 30  # Base score
        reasons = []
        
        user_type = (user.get('user_type') or user.get('type') or '').lower()
        user_industry = (user.get('industry') or '').lower()
        user_country = user.get('country')
        
        # Type match
        if target_type and user_type == target_type:
            score += 30
            reasons.append(f"Es {target_type}")
        
        # Industry match
        if target_industry and target_industry in user_industry:
            score += 25
            reasons.append(f"Trabaja en {user.get('industry')}")
        elif current_industry and current_industry in user_industry:
            score += 20
            reasons.append(f"Misma industria")
        
        # Country match
        if current_country and current_country == user_country:
            score += 10
            reasons.append(f"Mismo país")
        
        # Stage match for entrepreneurs
        if user_type == 'entrepreneur':
            user_stage = (user.get('stage') or '').lower()
            current_stage = (current_user.get('stage') or '').lower()
            if user_stage and current_stage and user_stage == current_stage:
                score += 15
                reasons.append("Misma etapa de startup")
        
        if score >= 40:
            matches.append({
                "id": user.get('id'),
                "name": user.get('name') or user.get('full_name') or 'Usuario',
                "email": user.get('email'),
                "score": min(score, 100),
                "reason": ". ".join(reasons) if reasons else "Perfil interesante",
                "user_type": user.get('user_type'),
                "industry": user.get('industry'),
                "country": user.get('country'),
                "avatar_url": user.get('avatar_url'),
                "bio": user.get('bio', '')[:150] + '...' if user.get('bio') and len(user.get('bio', '')) > 150 else user.get('bio', ''),
                "startup_name": user.get('startup_name'),
                "linkedin_url": user.get('linkedin_url')
            })
    
    # Sort by score
    matches.sort(key=lambda x: x['score'], reverse=True)
    return matches[:10]


def generate_connector_response(
    message: str,
    user_context: dict,
    matches: list,
    history: list
) -> str:
    """
    Generate AI response for the connector chat
    """
    try:
        # Build context
        history_text = "\n".join([
            f"{'Usuario' if h['role'] == 'user' else 'Asistente'}: {h['content']}"
            for h in history[-5:]
        ])
        
        matches_text = ""
        if matches:
            matches_text = "\n\nCONEXIONES ENCONTRADAS:\n"
            for i, m in enumerate(matches[:5], 1):
                matches_text += f"{i}. {m['name']} ({m.get('user_type', 'usuario')}) - Score: {m['score']}% - {m['reason']}\n"
        
        prompt = f"""Eres un AI SuperConnector que ayuda a emprendedores a conectar con otras personas relevantes.

CONTEXTO DEL USUARIO:
- Nombre: {user_context.get('name', 'Usuario')}
- Tipo: {user_context.get('user_type', 'emprendedor')}
- Industria: {user_context.get('industry', 'No especificada')}

HISTORIAL RECIENTE:
{history_text}

MENSAJE ACTUAL: {message}
{matches_text}

Responde de forma amigable y profesional EN ESPAÑOL. 
Si hay conexiones, preséntalalas de forma atractiva explicando por qué son buenas opciones.
Si no hay conexiones o el usuario saluda, ofrece ayuda explicando qué tipos de conexiones puedes encontrar.
Usa emojis para hacer la conversación más amigable.
Mantén las respuestas concisas pero informativas."""

        response = openai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Eres un AI SuperConnector experto en networking empresarial. Respondes siempre en español de forma amigable y profesional."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error generating response: {e}")
        # Fallback response
        if matches:
            return f"""¡Encontré **{len(matches)} conexiones** potenciales para ti! 🎯

Basándome en tu solicitud, estas personas podrían ser un gran match:

{"".join([f"• **{m['name']}** - {m['reason']}\n" for m in matches[:3]])}

¿Te gustaría que te ayude a iniciar contacto con alguno de ellos?"""
        else:
            return """¡Hola! 👋 Soy tu AI SuperConnector.

Puedo ayudarte a encontrar:
• 🚀 **Emprendedores** en tu misma industria
• 💰 **Inversores** para tu startup
• ✅ **Validadores** para feedback
• 🤝 **Partners** para colaborar

Dime, ¿qué tipo de conexiones estás buscando?"""


@app.route('/api/connector/session/<session_id>', methods=['GET'])
def get_connector_session(session_id):
    """Get session history"""
    if session_id in ai_connector_sessions:
        session = ai_connector_sessions[session_id]
        return jsonify({
            "success": True,
            "session": {
                "history": session["history"],
                "user_context": session["user_context"],
                "created_at": session.get("created_at")
            }
        })
    return jsonify({
        "success": False,
        "error": "Session not found"
    }), 404


@app.route('/api/connector/session/<session_id>', methods=['DELETE'])
def clear_connector_session(session_id):
    """Clear a session"""
    if session_id in ai_connector_sessions:
        del ai_connector_sessions[session_id]
    return jsonify({"success": True})


# ==============================================
# MAIN ENTRY POINT
# ==============================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
