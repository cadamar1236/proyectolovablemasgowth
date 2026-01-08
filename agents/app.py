"""
LinkedIn Connector API - Railway Deployment
FastAPI REST API para scraping y análisis de LinkedIn
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
from linkedin_connector_agent import (
    LinkedInConnectorTeam,
    get_linkedin_connector_team
)

# Initialize FastAPI
app = FastAPI(
    title="LinkedIn Connector API",
    description="API para conectar startups con inversores, talento, clientes y partners vía LinkedIn",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica tus dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LinkedIn Connector Team
linkedin_team = None

@app.on_event("startup")
async def startup_event():
    """Initialize LinkedIn Connector on startup"""
    global linkedin_team
    try:
        linkedin_team = get_linkedin_connector_team()
        print("✅ LinkedIn Connector Team initialized successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize LinkedIn Team: {e}")
        print("API will continue with limited functionality")

# Request Models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    user_id: Optional[str] = "user"

class SearchRequest(BaseModel):
    type: str  # investor, talent, customer, partner
    query: str
    filters: Optional[Dict[str, Any]] = {}
    maxResults: Optional[int] = 20

class AnalyzeRequest(BaseModel):
    profileData: Dict[str, Any]
    targetCriteria: str
    companyDescription: Optional[str] = ""

class GenerateMessageRequest(BaseModel):
    recipientProfile: Dict[str, Any]
    senderProfile: Dict[str, Any]
    purpose: str  # investment, partnership, hiring, mentorship
    tone: Optional[str] = "professional"


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "LinkedIn Connector API",
        "version": "1.0.0",
        "endpoints": {
            "search": "/api/search",
            "analyze": "/api/analyze",
            "generate-message": "/api/generate-message"
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "linkedin_team": "initialized" if linkedin_team else "not_initialized",
        "environment": {
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "apify_configured": bool(os.getenv("APIFY_API_TOKEN"))
        }
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat conversacional con el LinkedIn Connector Agent
    
    - **message**: Mensaje del usuario
    - **session_id**: ID de sesión para mantener contexto
    - **user_id**: ID del usuario
    """
    try:
        if not linkedin_team:
            raise HTTPException(status_code=503, detail="LinkedIn Connector not initialized")
        
        response = linkedin_team.chat(
            message=request.message,
            session_id=request.session_id,
            user_id=request.user_id
        )
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search_profiles(request: SearchRequest):
    """
    Busca perfiles de LinkedIn según tipo y criterios
    
    - **type**: investor, talent, customer, partner
    - **query**: Términos de búsqueda
    - **filters**: Filtros adicionales (location, industry, etc.)
    - **maxResults**: Número máximo de resultados
    """
    try:
        if not linkedin_team:
            raise HTTPException(status_code=503, detail="LinkedIn Connector not initialized")
        
        # Map request type to agent method
        if request.type == "investor":
            result = linkedin_team.find_investors(
                startup_description=request.query,
                funding_stage=request.filters.get("stage", "seed"),
                industry=request.filters.get("industry", "Technology"),
                location=request.filters.get("location", ""),
                max_results=request.maxResults or 20
            )
        elif request.type == "talent":
            result = linkedin_team.find_talent(
                role_description=request.query,
                required_skills=request.filters.get("skills", []),
                company_description=request.filters.get("company", ""),
                location=request.filters.get("location", ""),
                max_results=request.maxResults or 20
            )
        elif request.type == "customer":
            result = linkedin_team.find_customers(
                product_description=request.query,
                target_persona=request.filters.get("persona", "Decision Maker"),
                industry=request.filters.get("industry", "Technology"),
                company_size=request.filters.get("size", ""),
                max_results=request.maxResults or 20
            )
        elif request.type == "partner":
            result = linkedin_team.find_partners(
                company_description=request.query,
                partnership_type=request.filters.get("partnership_type", "integration"),
                target_industry=request.filters.get("industry", "Technology"),
                max_results=request.maxResults or 20
            )
        else:
            raise HTTPException(status_code=400, detail=f"Invalid type: {request.type}")
        
        return {
            "success": True,
            "type": request.type,
            "query": request.query,
            "results": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_compatibility(request: AnalyzeRequest):
    """
    Analiza la compatibilidad entre un perfil y criterios específicos
    """
    try:
        if not linkedin_team:
            raise HTTPException(status_code=503, detail="LinkedIn Connector not initialized")
        
        # Use appropriate agent based on context
        agent = linkedin_team.investor_agent
        
        response = agent.run(
            f"Analyze compatibility for this profile: {request.profileData}. "
            f"Target criteria: {request.targetCriteria}. "
            f"Company: {request.companyDescription}. "
            f"Provide compatibility score (0-100) and detailed reasoning."
        )
        
        return {
            "success": True,
            "analysis": response.content
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-message")
async def generate_message(request: GenerateMessageRequest):
    """
    Genera un mensaje personalizado para conexión en LinkedIn
    """
    try:
        if not linkedin_team:
            raise HTTPException(status_code=503, detail="LinkedIn Connector not initialized")
        
        # Select agent based on purpose
        agent_map = {
            "investment": linkedin_team.investor_agent,
            "hiring": linkedin_team.talent_agent,
            "partnership": linkedin_team.partnership_agent
        }
        
        agent = agent_map.get(request.purpose, linkedin_team.investor_agent)
        
        response = agent.run(
            f"Generate a {request.tone} connection message for LinkedIn. "
            f"Recipient: {request.recipientProfile}. "
            f"Sender: {request.senderProfile}. "
            f"Purpose: {request.purpose}. "
            f"Keep it under 300 characters and personalized."
        )
        
        return {
            "success": True,
            "message": response.content,
            "characterCount": len(response.content),
            "purpose": request.purpose
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Brand Marketing Agent Endpoint
class BrandAnalysisRequest(BaseModel):
    website_url: str
    custom_prompt: Optional[str] = ""

@app.post("/api/agents/brand/analyze")
async def analyze_brand_identity(request: BrandAnalysisRequest):
    """
    Analiza la identidad de marca usando BrandMarketingTeam
    """
    try:
        from brand_marketing_agent import BrandMarketingTeam
        from datetime import datetime
        
        if not request.website_url:
            raise HTTPException(status_code=400, detail="website_url is required")
        
        brand_team = BrandMarketingTeam()
        
        # Construir mensaje para el análisis
        if request.custom_prompt:
            message = f"{request.custom_prompt}\n\nWebsite URL: {request.website_url}"
        else:
            message = f"Analiza la marca del sitio web {request.website_url} y genera un plan de marketing completo. Incluye análisis de colores, tipografía, estilo visual, y proporciona prompts para generar imágenes de marketing profesionales."
        
        # Usar el método chat para el análisis
        result = brand_team.chat(
            message=message,
            session_id=f"brand_analysis_{datetime.now().timestamp()}"
        )
        
        # Asegurar que siempre retornamos un dict válido
        if isinstance(result, dict):
            response_text = result.get('response', result.get('content', 'No response generated'))
        else:
            response_text = str(result)
        
        return {
            "success": True,
            "response": response_text,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in brand analysis: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

# Brand Marketing - Generate and Store Images
class BrandGenerateImagesRequest(BaseModel):
    website_url: str
    user_id: int
    cloudflare_api_url: str = "https://webapp-46s.pages.dev"
    image_types: Optional[List[str]] = ["banner", "post", "story"]
    custom_prompt: Optional[str] = None  # Allow custom prompts from chat

@app.post("/api/agents/brand/generate-images")
async def generate_brand_images(request: BrandGenerateImagesRequest):
    """
    Genera imágenes de marketing INTELIGENTES:
    1. Obtiene contexto de la startup (scraping o DB)
    2. Usa IA para crear prompt específico
    3. Genera imagen con fal.ai GPT-Image-1.5
    """
    try:
        import fal_client
        from datetime import datetime
        import httpx
        import os
        import openai
        
        # Verificar que FAL_KEY está configurado
        fal_key = os.getenv("FAL_KEY")
        if not fal_key:
            raise HTTPException(status_code=500, detail="FAL_KEY not configured")
        
        os.environ["FAL_KEY"] = fal_key
        
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if not request.website_url and not request.custom_prompt:
            raise HTTPException(status_code=400, detail="website_url or custom_prompt is required")
        
        # ============ PASO 1: OBTENER CONTEXTO DE LA STARTUP ============
        startup_context = ""
        brand_colors = "#6366f1"  # Default purple
        
        # Intentar obtener contexto de Cloudflare (datos del usuario)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Obtener producto/startup del usuario
                user_data_response = await client.get(
                    f"{request.cloudflare_api_url}/api/beta-users/{request.user_id}",
                    headers={"Content-Type": "application/json"}
                )
                if user_data_response.status_code == 200:
                    user_data = user_data_response.json()
                    if user_data:
                        startup_context = f"""
Startup Info:
- Name: {user_data.get('company_name', user_data.get('name', 'Startup'))}
- Description: {user_data.get('product_description', user_data.get('description', ''))}
- Industry: {user_data.get('industry', 'Technology')}
- Stage: {user_data.get('stage', 'Early stage')}
- Website: {request.website_url}
"""
                        print(f"[BRAND] Got user context from DB")
        except Exception as ctx_error:
            print(f"[BRAND] Could not get user context: {ctx_error}")
        
        # Si tenemos URL pero no contexto, hacer scraping básico
        if request.website_url and request.website_url != 'general' and not startup_context:
            try:
                from brand_marketing_agent import scrape_startup_website
                scrape_result = scrape_startup_website(request.website_url)
                if scrape_result and not scrape_result.startswith("Error"):
                    startup_context = f"Website Analysis:\n{scrape_result[:1500]}"
                    print(f"[BRAND] Got context from scraping")
            except Exception as scrape_error:
                print(f"[BRAND] Scraping failed: {scrape_error}")
        
        # ============ PASO 2: USAR IA PARA CREAR PROMPT DE IMAGEN ============
        custom_prompt = request.custom_prompt or ""
        prompt_lower = custom_prompt.lower()
        
        # Detectar formato deseado
        if "instagram" in prompt_lower or "cuadrad" in prompt_lower or "square" in prompt_lower or "post" in prompt_lower:
            image_size = "1024x1024"
            image_type = "post"
            format_hint = "square format for Instagram/social media post"
        elif "story" in prompt_lower or "vertical" in prompt_lower or "stories" in prompt_lower:
            image_size = "1024x1536"
            image_type = "story"
            format_hint = "vertical format for Instagram/TikTok story"
        elif "banner" in prompt_lower or "horizontal" in prompt_lower or "linkedin" in prompt_lower or "twitter" in prompt_lower or "header" in prompt_lower:
            image_size = "1536x1024"
            image_type = "banner"
            format_hint = "horizontal banner format for LinkedIn/Twitter header"
        else:
            image_size = "1024x1024"
            image_type = "post"
            format_hint = "square format for general social media"
        
        # Crear prompt inteligente con OpenAI
        if openai_key and (startup_context or custom_prompt):
            try:
                client = openai.OpenAI(api_key=openai_key)
                
                system_prompt = """You are an expert marketing designer. Create a detailed image generation prompt in English for a professional marketing image.

The prompt should:
1. Be specific and descriptive (50-100 words)
2. Include visual elements, colors, composition
3. Match the startup's brand and industry
4. Be suitable for the specified format
5. NOT include any text/typography in the image (just visual elements)
6. Focus on abstract/conceptual imagery that represents the brand

Output ONLY the image prompt, nothing else."""

                user_message = f"""Create an image prompt for this startup:

{startup_context if startup_context else f"A tech startup with website {request.website_url}"}

User's request: {custom_prompt if custom_prompt else "Generate a professional marketing image"}

Format: {format_hint}

Generate a detailed, creative prompt for the image:"""

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=200,
                    temperature=0.7
                )
                
                enhanced_prompt = response.choices[0].message.content.strip()
                print(f"[BRAND] AI-generated prompt: {enhanced_prompt[:200]}...")
                
            except Exception as ai_error:
                print(f"[BRAND] AI prompt generation failed: {ai_error}")
                # Fallback a prompt básico
                enhanced_prompt = f"Professional marketing image for a modern tech startup, clean design, gradient colors, abstract geometric shapes, high quality, 4k, {format_hint}"
        else:
            # Sin OpenAI, crear prompt básico pero mejorado
            if custom_prompt:
                # Traducir y mejorar el prompt del usuario
                enhanced_prompt = custom_prompt
                translations = {
                    "genera una imagen": "create a professional image",
                    "para mi startup": "for a modern tech startup",
                    "de tecnología": "technology company",
                    "redes sociales": "social media marketing",
                    "profesional": "professional, high quality",
                    "moderno": "modern, sleek design",
                    "innovación": "innovation, cutting-edge",
                    "competencia": "competition, dynamic"
                }
                for es, en in translations.items():
                    enhanced_prompt = enhanced_prompt.lower().replace(es, en)
                enhanced_prompt += ", clean layout, vibrant colors, 4k quality, professional marketing"
            else:
                enhanced_prompt = f"Professional marketing image for a modern tech startup, abstract design, gradient colors from purple to blue, geometric shapes, clean minimalist style, high quality, 4k, {format_hint}"
        
        print(f"[FAL] Final prompt: {enhanced_prompt[:300]}...")
        print(f"[FAL] Size: {image_size}")
        
        # ============ PASO 3: GENERAR IMAGEN CON FAL.AI ============
        result = fal_client.subscribe(
            "fal-ai/gpt-image-1.5",
            arguments={
                "prompt": enhanced_prompt,
                "image_size": image_size,
                "num_images": 1,
                "quality": "high",
                "output_format": "png"
            }
        )
        
        print(f"[FAL] Result received")
        
        # Extraer URLs de imágenes
        image_urls = []
        if result and 'images' in result:
            for img in result['images']:
                if 'url' in img:
                    image_urls.append(img['url'])
        
        if not image_urls:
            return {
                "success": False,
                "error": "No images generated",
                "response": "No se pudieron generar imágenes. Por favor intenta de nuevo.",
                "images_generated": 0,
                "images_saved": 0,
                "saved_images": []
            }
        
        # ============ PASO 4: GUARDAR EN CLOUDFLARE ============
        saved_images = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for idx, image_url in enumerate(image_urls):
                try:
                    save_response = await client.post(
                        f"{request.cloudflare_api_url}/api/ai-cmo/images/from-agent",
                        json={
                            "user_id": request.user_id,
                            "image_url": image_url,
                            "prompt": enhanced_prompt[:500],
                            "image_type": image_type,
                            "metadata": {
                                "website": request.website_url,
                                "original_prompt": custom_prompt,
                                "startup_context": startup_context[:500] if startup_context else None,
                                "generated_at": datetime.now().isoformat(),
                                "model": "gpt-image-1.5",
                                "size": image_size
                            }
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if save_response.status_code == 200:
                        save_data = save_response.json()
                        saved_images.append({
                            "image_id": save_data.get("imageId"),
                            "url": image_url,
                            "type": image_type
                        })
                        print(f"[FAL] Image saved to Cloudflare: {image_url[:50]}...")
                except Exception as img_error:
                    print(f"[FAL] Error saving image {image_url}: {img_error}")
                    # Aún así incluir la imagen aunque no se haya guardado en D1
                    saved_images.append({
                        "image_id": None,
                        "url": image_url,
                        "type": image_type
                    })
        
        response_text = f"""✅ **¡Imagen generada exitosamente!**

🖼️ **URL:** {image_urls[0]}

📊 **Detalles:**
- Tipo: {image_type}
- Tamaño: {image_size}
- Modelo: GPT-Image-1.5

💡 Puedes ver y aprobar la imagen en la sección **AI CMO**."""
        
        return {
            "success": True,
            "response": response_text,
            "images_generated": len(image_urls),
            "images_saved": len(saved_images),
            "saved_images": saved_images,
            "image_urls": image_urls,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[FAL] Error generating images: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

# Metrics Agent Endpoints
class MetricsChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    context: Optional[Dict[str, Any]] = {}

class MetricsAnalyzeRequest(BaseModel):
    user_id: int
    query: str

class MetricsCompareRequest(BaseModel):
    user_id: int
    competitor_ids: List[int]

class MetricsReportRequest(BaseModel):
    user_id: int
    report_type: str  # weekly, investor, etc.

@app.post("/api/agents/metrics/chat")
async def metrics_chat(request: MetricsChatRequest):
    """
    Chat con el Metrics Agent
    """
    try:
        from metrics_agent import MetricsAgent
        
        metrics_agent = MetricsAgent(user_id=request.user_id)
        result = metrics_agent.analyze(
            query=request.message,
            context=request.context
        )
        
        return {
            "success": True,
            "response": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in metrics chat: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/metrics/analyze")
async def metrics_analyze(request: MetricsAnalyzeRequest):
    """
    Análisis de métricas para un usuario
    """
    try:
        from metrics_agent import MetricsAgent
        
        metrics_agent = MetricsAgent(user_id=request.user_id)
        result = metrics_agent.analyze(request.query)
        
        return {
            "success": True,
            "analysis": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in metrics analysis: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/metrics/report")
async def metrics_report(request: MetricsReportRequest):
    """
    Genera un reporte de métricas
    """
    try:
        from metrics_agent import MetricsAgent
        
        metrics_agent = MetricsAgent(user_id=request.user_id)
        
        # Obtener métricas actuales (esto lo haría mediante tools)
        metrics_data = {}  # En realidad debería obtener datos reales
        
        if request.report_type == "weekly":
            result = metrics_agent.get_weekly_report(metrics_data)
        elif request.report_type == "investor":
            result = metrics_agent.get_investor_metrics_summary(metrics_data)
        else:
            result = metrics_agent.analyze(f"Genera un reporte tipo {request.report_type}")
        
        return {
            "success": True,
            "report": result,
            "report_type": request.report_type,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in metrics report: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/metrics/compare")
async def metrics_compare(request: MetricsCompareRequest):
    """
    Compara métricas con competidores
    """
    try:
        from metrics_agent import MetricsAgent
        
        metrics_agent = MetricsAgent(user_id=request.user_id)
        result = metrics_agent.analyze(
            f"Compara mis métricas con los competidores: {request.competitor_ids}"
        )
        
        return {
            "success": True,
            "comparison": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in metrics comparison: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "message": "The requested endpoint does not exist",
        "available_endpoints": [
            "/api/search", 
            "/api/analyze", 
            "/api/generate-message", 
            "/api/agents/brand/analyze",
            "/api/agents/metrics/chat",
            "/api/agents/metrics/analyze",
            "/api/agents/metrics/report",
            "/api/agents/metrics/compare"
        ]
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "Internal server error",
        "message": str(exc)
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
