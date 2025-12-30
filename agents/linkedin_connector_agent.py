"""
LinkedIn Connector Agent - Versión Simplificada para Agno 2.3+
================================================================

Agente que conecta startups con inversores, talento, clientes y partners vía LinkedIn.
Usa Apify para scraping y OpenAI para análisis.
"""

import os
import json
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

# Agno Framework (versión moderna)
from agno.agent import Agent

# Apify para web scraping
from apify_client import ApifyClient

# OpenAI para análisis
import openai


@dataclass
class LinkedInConnectorConfig:
    """Configuration for LinkedIn Connector Agent"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    apify_api_token: str = os.getenv("APIFY_API_TOKEN", "")
    
    def __post_init__(self):
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")
        if not self.apify_api_token:
            raise ValueError("APIFY_API_TOKEN is required")


class LinkedInConnectorTeam:
    """
    Sistema multiagente conversacional para LinkedIn Connector
    """
    
    def __init__(self):
        self.config = LinkedInConnectorConfig()
        
        # Initialize OpenAI client
        openai.api_key = self.config.openai_api_key
        self.apify_client = ApifyClient(self.config.apify_api_token)
        
        # Initialize main conversational agent
        self.main_agent = Agent(
            name="LinkedIn Connector Assistant",
            model="openai:gpt-4o-mini",
            description="AI assistant that helps connect startups with investors, talent, customers, and partners via LinkedIn",
            instructions=[
                "You are a helpful AI assistant specialized in LinkedIn networking and business connections",
                "Help users find investors, talent, customers, or strategic partners",
                "Ask clarifying questions to understand their needs",
                "Provide personalized recommendations and connection strategies",
                "Be conversational, friendly, and professional",
                "When users ask to search for connections, gather these details:",
                "  - Type: investor, talent, customer, or partner",
                "  - Industry or sector",
                "  - Location (optional)",
                "  - Specific requirements or preferences",
                "Always explain your reasoning and provide actionable insights"
            ],
            markdown=True,
            add_history_to_context=True
        )
        
        # Specialized agents for specific tasks
        self.investor_agent = Agent(
            name="Investor Matching Agent",
            model="openai:gpt-4o-mini",
            description="Expert in startup fundraising and investor relations",
            instructions=[
                "Find the most relevant investors for startups",
                "Analyze investor profiles for stage focus and industry expertise"
            ]
        )
        
        self.talent_agent = Agent(
            name="Talent Acquisition Agent",
            model="openai:gpt-4o-mini",
            description="Expert technical recruiter",
            instructions=[
                "Find exceptional talent for startups",
                "Analyze profiles for skills and experience"
            ]
        )
        
        self.customer_agent = Agent(
            name="Customer Discovery Agent",
            model="openai:gpt-4o-mini",
            description="Expert in B2B sales",
            instructions=[
                "Identify ideal customer profiles",
                "Connect with decision makers"
            ]
        )
        
        self.partnership_agent = Agent(
            name="Partnership Agent",
            model="openai:gpt-4o-mini",
            description="Expert in business development",
            instructions=[
                "Find strategic partnership opportunities",
                "Evaluate complementary businesses"
            ]
        )
        
        print(f"✅ LinkedIn Connector Team initialized with {self.config.openai_model}")
    
    def chat(
        self,
        message: str,
        session_id: str = "default",
        user_id: str = "user"
    ) -> Dict[str, Any]:
        """
        Chat conversacional con el agente de LinkedIn
        
        Args:
            message: Mensaje del usuario
            session_id: ID de sesión para mantener contexto
            user_id: ID del usuario
            
        Returns:
            Respuesta del agente con contenido y metadata
        """
        try:
            response = self.main_agent.run(
                message,
                session_id=session_id,
                user_id=user_id,
                stream=False
            )
            
            return {
                "success": True,
                "response": response.content if hasattr(response, 'content') else str(response),
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
    
    def find_investors(
        self,
        startup_description: str,
        funding_stage: str,
        industry: str,
        location: str = "",
        max_results: int = 20
    ) -> Dict[str, Any]:
        """Encuentra inversores relevantes"""
        print(f"\n🔍 Buscando inversores para: {industry} | {funding_stage}")
        
        response = self.investor_agent.run(
            f"Find {max_results} relevant investors for a {industry} startup at {funding_stage} stage. "
            f"Startup: {startup_description}. Location: {location or 'Global'}. "
            f"Return a ranked list with compatibility scores."
        )
        
        return {
            "task": "investor_search",
            "results": response.content if hasattr(response, 'content') else str(response),
            "timestamp": datetime.now().isoformat()
        }
    
    def find_talent(
        self,
        role_description: str,
        required_skills: List[str],
        company_description: str,
        location: str = "",
        max_results: int = 20
    ) -> Dict[str, Any]:
        """Encuentra talento para una posición"""
        print(f"\n🔍 Buscando talento: {role_description}")
        
        response = self.talent_agent.run(
            f"Find {max_results} candidates for: {role_description}. "
            f"Required skills: {', '.join(required_skills)}. "
            f"Company: {company_description}. Location: {location or 'Remote'}."
        )
        
        return {
            "task": "talent_search",
            "results": response.content if hasattr(response, 'content') else str(response),
            "timestamp": datetime.now().isoformat()
        }
    
    def find_customers(
        self,
        product_description: str,
        target_persona: str,
        industry: str,
        company_size: str = "",
        max_results: int = 20
    ) -> Dict[str, Any]:
        """Encuentra clientes potenciales"""
        print(f"\n🔍 Buscando clientes: {target_persona} en {industry}")
        
        response = self.customer_agent.run(
            f"Find {max_results} potential customers for: {product_description}. "
            f"Target: {target_persona} in {industry}. "
            f"Company size: {company_size or 'Any'}."
        )
        
        return {
            "task": "customer_discovery",
            "results": response.content if hasattr(response, 'content') else str(response),
            "timestamp": datetime.now().isoformat()
        }
    
    def find_partners(
        self,
        company_description: str,
        partnership_type: str,
        target_industry: str,
        max_results: int = 20
    ) -> Dict[str, Any]:
        """Encuentra socios estratégicos"""
        print(f"\n🔍 Buscando partners: {partnership_type} en {target_industry}")
        
        response = self.partnership_agent.run(
            f"Find {max_results} strategic partners for: {company_description}. "
            f"Partnership type: {partnership_type}. Industry: {target_industry}."
        )
        
        return {
            "task": "partnership_search",
            "results": response.content if hasattr(response, 'content') else str(response),
            "timestamp": datetime.now().isoformat()
        }


# Singleton instance
_linkedin_team_instance = None

def get_linkedin_connector_team() -> LinkedInConnectorTeam:
    """Get or create singleton instance"""
    global _linkedin_team_instance
    if _linkedin_team_instance is None:
        _linkedin_team_instance = LinkedInConnectorTeam()
    return _linkedin_team_instance


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 LINKEDIN CONNECTOR AGENT - SIMPLIFIED")
    print("=" * 60)
    
    team = get_linkedin_connector_team()
    print("\n✅ Team initialized successfully")
