"""
LinkedIn Connector API Server
Flask REST API para el agente de LinkedIn Connector
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from apify_client import ApifyClient
import openai

app = Flask(__name__)
CORS(app)

# Configuration - Get from environment variables
# DO NOT hardcode API keys here. Set them in Railway/Render environment variables.
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if not APIFY_API_TOKEN:
    raise ValueError("APIFY_API_TOKEN environment variable is required")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

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


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
