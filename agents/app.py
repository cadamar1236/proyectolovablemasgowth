"""
LinkedIn Connector API - Railway Deployment
FastAPI REST API para scraping y análisis de LinkedIn
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
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

# Request Models
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
                max_results=request.maxResults
            )
        elif request.type == "talent":
            result = linkedin_team.find_talent(
                role_description=request.query,
                required_skills=request.filters.get("skills", []),
                company_description=request.filters.get("company", ""),
                location=request.filters.get("location", ""),
                max_results=request.maxResults
            )
        elif request.type == "customer":
            result = linkedin_team.find_customers(
                product_description=request.query,
                target_persona=request.filters.get("persona", "Decision Maker"),
                industry=request.filters.get("industry", "Technology"),
                company_size=request.filters.get("size", ""),
                max_results=request.maxResults
            )
        elif request.type == "partner":
            result = linkedin_team.find_partners(
                company_description=request.query,
                partnership_type=request.filters.get("partnership_type", "integration"),
                target_industry=request.filters.get("industry", "Technology"),
                max_results=request.maxResults
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

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "message": "The requested endpoint does not exist",
        "available_endpoints": ["/api/search", "/api/analyze", "/api/generate-message"]
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
