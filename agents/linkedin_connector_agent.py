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
        
        # Session storage for conversation memory
        self.session_storage = {}
        
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
                "Be conversational, friendly, and professional in Spanish",
                "Remember previous context in the conversation",
                "When users ask to search for connections, gather these details:",
                "  - Type: investor, talent, customer, or partner",
                "  - Industry or sector",
                "  - Location (optional)",
                "  - Specific requirements or preferences",
                "Always explain your reasoning and provide actionable insights",
                "When you have enough details, confirm with the user before searching"
            ],
            markdown=True,
            add_history_to_context=True,
            add_datetime_to_instructions=True
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
            # Get or create session storage
            if session_id not in self.session_storage:
                self.session_storage[session_id] = {
                    "messages": [],
                    "context": {}
                }
            
            session = self.session_storage[session_id]
            
            # Add user message to history
            session["messages"].append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Build conversation context
            conversation_history = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in session["messages"][-10:]  # Last 10 messages
            ])
            
            # Run agent with context
            response = self.main_agent.run(
                f"Conversation history:\n{conversation_history}\n\nUser: {message}",
                stream=False
            )
            
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Add assistant response to history
            session["messages"].append({
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.now().isoformat()
            })
            
            # Check if user wants to search - trigger Apify search
            if any(keyword in message.lower() for keyword in ["busca", "encuentra", "search", "find", "quiero", "necesito"]):
                if any(keyword in message.lower() for keyword in ["inversor", "investor", "inversionista", "capital", "funding"]):
                    # Extract search intent and trigger Apify search
                    search_results = self._search_linkedin_with_apify(message, "investor")
                    if search_results:
                        response_text += f"\n\n🔍 **Perfiles encontrados en LinkedIn:**\n{search_results}"
            
            return {
                "success": True,
                "response": response_text,
                "session_id": session_id,
                "message_count": len(session["messages"]),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"❌ Error in chat: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
    
    def _search_linkedin_with_apify(self, query: str, search_type: str = "investor") -> str:
        """
        Busca perfiles en LinkedIn usando Apify
        
        Args:
            query: Query de búsqueda
            search_type: Tipo de búsqueda (investor, talent, customer, partner)
            
        Returns:
            String con resultados formateados
        """
        try:
            print(f"🔍 Searching LinkedIn with Apify: {query} (type: {search_type})")
            
            # Configure search based on type
            search_queries = {
                "investor": ["venture capital", "seed investor", "angel investor", "VC partner"],
                "talent": ["software engineer", "developer", "CTO", "tech lead"],
                "customer": ["founder", "CEO", "decision maker"],
                "partner": ["business development", "partnerships", "strategic alliances"]
            }
            
            keywords = search_queries.get(search_type, ["professional"])
            search_query = f"{query} {' OR '.join(keywords[:2])}"
            
            # Run Apify LinkedIn scraper
            run_input = {
                "searchUrls": [
                    f"https://www.linkedin.com/search/results/people/?keywords={search_query.replace(' ', '%20')}"
                ],
                "maxResults": 10,
                "minDelay": 2,
                "maxDelay": 4
            }
            
            # Start actor run
            run = self.apify_client.actor("apify/linkedin-profile-scraper").call(run_input=run_input)
            
            # Get results
            results = []
            for item in self.apify_client.dataset(run["defaultDatasetId"]).iterate_items():
                results.append({
                    "name": item.get("fullName", "Unknown"),
                    "headline": item.get("headline", ""),
                    "location": item.get("location", ""),
                    "profile_url": item.get("url", ""),
                    "connections": item.get("connectionsCount", 0)
                })
            
            # Format results
            if results:
                formatted = "\n\n".join([
                    f"**{r['name']}**\n"
                    f"📋 {r['headline']}\n"
                    f"📍 {r['location']}\n"
                    f"🤝 {r['connections']}+ conexiones\n"
                    f"🔗 [Ver perfil]({r['profile_url']})"
                    for r in results[:5]  # Top 5
                ])
                return formatted
            else:
                return "No se encontraron perfiles con esos criterios."
                
        except Exception as e:
            print(f"❌ Error searching with Apify: {str(e)}")
            return f"⚠️ Error al buscar en LinkedIn: {str(e)}"
    
    def find_investors(
        self,
        startup_description: str,
        funding_stage: str,
        industry: str,
        location: str = "",
        max_results: int = 20
    ) -> Dict[str, Any]:
        """Encuentra inversores relevantes usando Apify"""
        print(f"\n🔍 Buscando inversores para: {industry} | {funding_stage}")
        
        try:
            # Build LinkedIn search query
            search_keywords = f"{industry} {funding_stage} venture capital investor"
            if location:
                search_keywords += f" {location}"
            
            # Run Apify LinkedIn scraper
            run_input = {
                "searchUrls": [
                    f"https://www.linkedin.com/search/results/people/?keywords={search_keywords.replace(' ', '%20')}"
                ],
                "maxResults": max_results,
                "minDelay": 2,
                "maxDelay": 5
            }
            
            print(f"🚀 Launching Apify actor with query: {search_keywords}")
            run = self.apify_client.actor("apify/linkedin-profile-scraper").call(run_input=run_input)
            
            # Collect results
            profiles = []
            for item in self.apify_client.dataset(run["defaultDatasetId"]).iterate_items():
                profiles.append({
                    "name": item.get("fullName", "Unknown"),
                    "headline": item.get("headline", ""),
                    "location": item.get("location", ""),
                    "industry": item.get("industry", ""),
                    "profile_url": item.get("url", ""),
                    "connections": item.get("connectionsCount", 0),
                    "description": item.get("summary", "")
                })
            
            # Use AI agent to analyze and rank profiles
            analysis_prompt = (
                f"Analyze these {len(profiles)} investor profiles for a {industry} startup at {funding_stage} stage.\n"
                f"Startup: {startup_description}\n\n"
                f"Profiles:\n{json.dumps(profiles, indent=2)}\n\n"
                f"Rank them by relevance and provide compatibility scores (0-100)."
            )
            
            analysis = self.investor_agent.run(analysis_prompt)
            
            return {
                "task": "investor_search",
                "profiles": profiles,
                "analysis": analysis.content if hasattr(analysis, 'content') else str(analysis),
                "total_found": len(profiles),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"❌ Error finding investors: {str(e)}")
            return {
                "task": "investor_search",
                "error": str(e),
                "profiles": [],
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
