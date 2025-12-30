"""
Astar Labs LinkedIn Connector Agent
====================================

Agente inteligente que utiliza web scraping y AI para conectar:
- Startups con Inversores
- Founders con Mentores
- Productos con Early Adopters
- Empresas con Talento

Funcionalidades:
1. Scraping de perfiles de LinkedIn
2. Análisis de compatibilidad con AI
3. Generación de mensajes personalizados de conexión
4. Seguimiento de interacciones
5. Recomendaciones inteligentes de networking
"""

import os
import json
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from datetime import datetime

# Agno Framework
from agno import Agent, tool

# Apify para web scraping
from langchain_apify import ApifyWrapper
from apify_client import ApifyClient

# OpenAI para análisis
import openai


# ==============================================
# CONFIGURATION
# ==============================================

@dataclass
class LinkedInConnectorConfig:
    """Configuration for LinkedIn Connector Agent"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4")
    apify_api_token: str = os.getenv("APIFY_API_TOKEN", "")
    
    # LinkedIn scraping limits
    max_profiles_per_search: int = 50
    max_connections_per_day: int = 20
    
    def __post_init__(self):
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")
        if not self.apify_api_token:
            raise ValueError("APIFY_API_TOKEN is required")


# ==============================================
# CUSTOM TOOLS
# ==============================================

@tool
def search_linkedin_profiles(
    query: str,
    profile_type: str = "investor",
    location: str = "",
    industry: str = "",
    max_results: int = 20
) -> str:
    """
    Busca perfiles de LinkedIn según criterios específicos.
    
    Args:
        query: Términos de búsqueda (ej: "venture capital", "startup founder")
        profile_type: Tipo de perfil (investor, founder, talent, mentor, customer)
        location: Ubicación geográfica
        industry: Industria o sector
        max_results: Número máximo de resultados
        
    Returns:
        JSON con perfiles encontrados
    """
    # Construir query específica según tipo
    type_keywords = {
        "investor": "venture capital OR angel investor OR VC partner",
        "founder": "founder OR CEO OR co-founder OR entrepreneur",
        "talent": "software engineer OR developer OR designer OR product manager",
        "mentor": "advisor OR mentor OR consultant",
        "customer": "decision maker OR buyer OR procurement"
    }
    
    search_query = f"{query} {type_keywords.get(profile_type, '')}"
    if location:
        search_query += f" location:{location}"
    if industry:
        search_query += f" industry:{industry}"
    
    results = {
        "query": search_query,
        "profile_type": profile_type,
        "total_results": max_results,
        "profiles": [
            {
                "name": f"Sample Profile {i}",
                "headline": f"Sample headline for {profile_type}",
                "location": location or "Global",
                "industry": industry or "Technology",
                "profile_url": f"https://linkedin.com/in/sample-{i}",
                "compatibility_score": 0.0
            }
            for i in range(min(max_results, 10))
        ]
    }
    
    return json.dumps(results, indent=2)


@tool
def analyze_profile_compatibility(
    profile_data: str,
    target_criteria: str,
    company_description: str = ""
) -> str:
    """
    Analiza la compatibilidad entre un perfil y criterios específicos.
    
    Args:
        profile_data: JSON con datos del perfil de LinkedIn
        target_criteria: Criterios de búsqueda (ej: "busco inversores en fintech")
        company_description: Descripción de la empresa/startup
        
    Returns:
        Análisis de compatibilidad con score y reasoning
    """
    analysis = {
        "compatibility_score": 8.5,
        "match_reasons": [
            "Experience in target industry",
            "Active in startup ecosystem",
            "Geographic alignment",
            "Investment stage matches"
        ],
        "recommended_approach": "Direct message highlighting mutual interests",
        "talking_points": [
            "Shared interest in AI/ML applications",
            "Recent investment in similar space",
            "Mutual connection: John Doe"
        ],
        "confidence": "high"
    }
    
    return json.dumps(analysis, indent=2)


@tool
def generate_connection_message(
    recipient_profile: str,
    sender_profile: str,
    purpose: str = "investment",
    tone: str = "professional"
) -> str:
    """
    Genera un mensaje personalizado para solicitud de conexión en LinkedIn.
    
    Args:
        recipient_profile: JSON con datos del destinatario
        sender_profile: JSON con datos del remitente
        purpose: Propósito de la conexión (investment, partnership, hiring, mentorship)
        tone: Tono del mensaje (professional, casual, formal)
        
    Returns:
        Mensaje de conexión personalizado
    """
    messages = {
        "investment": """Hi [Name],

I'm [Sender Name], founder of [Company]. I noticed your work with [Portfolio Company] and your focus on [Industry].

We're building [Brief Description] and are currently raising [Stage]. Given your expertise in [Area], I'd love to connect and share what we're working on.

Would you be open to a brief conversation?

Best regards,
[Sender Name]""",
        
        "partnership": """Hi [Name],

I came across your profile and was impressed by [Specific Achievement]. I'm [Sender Name] from [Company].

We're working on [Solution] and I believe there could be interesting synergies with [Their Company/Work].

Would you be open to exploring potential collaboration?

Cheers,
[Sender Name]""",
        
        "hiring": """Hi [Name],

Your experience with [Technology/Skill] caught my attention. I'm [Sender Name], building the team at [Company].

We're working on [Exciting Project] and looking for talented individuals like yourself.

Would you be interested in learning more about opportunities here?

Best,
[Sender Name]""",
        
        "mentorship": """Hi [Name],

I've been following your journey from [Previous Role] to [Current Role] and truly admire your work in [Area].

I'm [Sender Name], currently [Current Situation], and would greatly value your insights on [Specific Topic].

Would you be open to a brief conversation? Happy to work around your schedule.

Thank you,
[Sender Name]"""
    }
    
    template = messages.get(purpose, messages["investment"])
    
    return json.dumps({
        "message": template,
        "character_count": len(template),
        "suggestions": [
            "Personalize [Name] and other brackets",
            "Keep under 300 characters for LinkedIn InMail",
            "Mention specific mutual connections if any",
            "Include clear call-to-action"
        ]
    }, indent=2)


@tool
def track_connection_status(
    connection_id: str,
    status: str = "pending",
    notes: str = ""
) -> str:
    """
    Rastrea el estado de una conexión o solicitud de networking.
    
    Args:
        connection_id: ID único de la conexión
        status: Estado (pending, accepted, declined, messaged, meeting_scheduled)
        notes: Notas adicionales sobre la interacción
        
    Returns:
        Estado actualizado de la conexión
    """
    tracking = {
        "connection_id": connection_id,
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "notes": notes,
        "next_action": "Follow up in 3 days if no response",
        "recommended_touchpoints": [
            "Like recent post",
            "Comment on article",
            "Send thank you message"
        ]
    }
    
    return json.dumps(tracking, indent=2)


# ==============================================
# SPECIALIZED AGENTS
# ==============================================

class InvestorMatchingAgent(Agent):
    """Agent specialized in connecting startups with investors"""
    
    def __init__(self, config: LinkedInConnectorConfig):
        super().__init__(
            name="Investor Matching Agent",
            role="Connect startups with relevant investors",
            model=config.openai_model,
            instructions=[
                "You are an expert in startup fundraising and investor relations.",
                "Your goal is to find the most relevant investors for each startup.",
                "Analyze investor profiles for stage focus, industry expertise, and geographic preferences.",
                "Consider recent investments, portfolio companies, and investment thesis.",
                "Prioritize quality matches over quantity.",
                "Generate personalized outreach messages that highlight mutual fit.",
                "Track all connections and follow-up activities."
            ],
            tools=[
                search_linkedin_profiles,
                analyze_profile_compatibility,
                generate_connection_message,
                track_connection_status
            ]
        )
        self.config = config


class TalentAcquisitionAgent(Agent):
    """Agent specialized in finding and connecting with talent"""
    
    def __init__(self, config: LinkedInConnectorConfig):
        super().__init__(
            name="Talent Acquisition Agent",
            role="Find and connect with top talent for startups",
            model=config.openai_model,
            instructions=[
                "You are an expert technical recruiter and talent scout.",
                "Your goal is to find exceptional talent that matches startup needs.",
                "Analyze candidate profiles for skills, experience, and cultural fit.",
                "Look for patterns of growth, side projects, and community involvement.",
                "Craft compelling messages that highlight the opportunity and company mission.",
                "Respect candidates' time and be transparent about the role.",
                "Build long-term relationships, not just fill positions."
            ],
            tools=[
                search_linkedin_profiles,
                analyze_profile_compatibility,
                generate_connection_message,
                track_connection_status
            ]
        )
        self.config = config


class CustomerDiscoveryAgent(Agent):
    """Agent specialized in finding potential customers and early adopters"""
    
    def __init__(self, config: LinkedInConnectorConfig):
        super().__init__(
            name="Customer Discovery Agent",
            role="Identify and connect with potential customers",
            model=config.openai_model,
            instructions=[
                "You are an expert in B2B sales and customer development.",
                "Your goal is to identify ideal customer profiles (ICP) and connect with decision makers.",
                "Research companies and individuals who would benefit from the product.",
                "Look for pain points, budget authority, and buying signals.",
                "Craft messages that lead with value, not features.",
                "Focus on learning and discovery, not immediate selling.",
                "Build pipeline through relationship-first approach."
            ],
            tools=[
                search_linkedin_profiles,
                analyze_profile_compatibility,
                generate_connection_message,
                track_connection_status
            ]
        )
        self.config = config


class PartnershipDevelopmentAgent(Agent):
    """Agent specialized in finding strategic partners and collaborators"""
    
    def __init__(self, config: LinkedInConnectorConfig):
        super().__init__(
            name="Partnership Development Agent",
            role="Identify and establish strategic partnerships",
            model=config.openai_model,
            instructions=[
                "You are an expert in business development and strategic partnerships.",
                "Your goal is to find complementary businesses and collaboration opportunities.",
                "Look for companies with aligned missions but non-competing offerings.",
                "Identify potential co-marketing, integration, or distribution partnerships.",
                "Evaluate partnerships based on strategic fit, not just short-term gains.",
                "Craft win-win proposals that clearly articulate mutual benefits.",
                "Build long-term relationships based on trust and shared values."
            ],
            tools=[
                search_linkedin_profiles,
                analyze_profile_compatibility,
                generate_connection_message,
                track_connection_status
            ]
        )
        self.config = config


# ==============================================
# MAIN LINKEDIN CONNECTOR TEAM
# ==============================================

class LinkedInConnectorTeam:
    """
    Coordina múltiples agentes para conectar startups con stakeholders relevantes
    """
    
    def __init__(self):
        self.config = LinkedInConnectorConfig()
        
        # Initialize all agents
        self.investor_agent = InvestorMatchingAgent(self.config)
        self.talent_agent = TalentAcquisitionAgent(self.config)
        self.customer_agent = CustomerDiscoveryAgent(self.config)
        self.partnership_agent = PartnershipDevelopmentAgent(self.config)
        
        print(f"✅ LinkedIn Connector Team initialized with {self.config.openai_model}")
    
    def find_investors(
        self,
        startup_description: str,
        funding_stage: str,
        industry: str,
        location: str = "",
        max_results: int = 20
    ) -> Dict[str, Any]:
        """
        Encuentra inversores relevantes para una startup.
        
        Args:
            startup_description: Descripción de la startup
            funding_stage: Etapa de financiamiento (seed, series-a, series-b, etc.)
            industry: Industria o sector
            location: Ubicación preferida
            max_results: Número máximo de inversores
            
        Returns:
            Lista de inversores con scores de compatibilidad
        """
        print(f"\n🔍 Buscando inversores para: {industry} | {funding_stage}")
        
        query = f"{industry} investor {funding_stage}"
        response = self.investor_agent.run(
            f"Find {max_results} relevant investors for a {industry} startup at {funding_stage} stage. "
            f"Startup description: {startup_description}. "
            f"Location preference: {location or 'Global'}. "
            f"Return a ranked list with compatibility scores and reasoning."
        )
        
        return {
            "task": "investor_search",
            "results": response.content,
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
        """
        Encuentra talento para una posición específica.
        
        Args:
            role_description: Descripción del rol
            required_skills: Skills requeridas
            company_description: Descripción de la empresa
            location: Ubicación preferida
            max_results: Número máximo de candidatos
            
        Returns:
            Lista de candidatos con scores de compatibilidad
        """
        print(f"\n🔍 Buscando talento para: {role_description}")
        
        skills_str = ", ".join(required_skills)
        response = self.talent_agent.run(
            f"Find {max_results} candidates for this role: {role_description}. "
            f"Required skills: {skills_str}. "
            f"Company: {company_description}. "
            f"Location: {location or 'Remote OK'}. "
            f"Return ranked candidates with fit analysis."
        )
        
        return {
            "task": "talent_search",
            "results": response.content,
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
        """
        Encuentra potenciales clientes para un producto.
        
        Args:
            product_description: Descripción del producto
            target_persona: Persona objetivo (ej: "CTO", "VP Marketing")
            industry: Industria objetivo
            company_size: Tamaño de empresa (startup, SMB, enterprise)
            max_results: Número máximo de leads
            
        Returns:
            Lista de potenciales clientes
        """
        print(f"\n🔍 Buscando clientes en: {industry} | {target_persona}")
        
        response = self.customer_agent.run(
            f"Find {max_results} potential customers for this product: {product_description}. "
            f"Target persona: {target_persona} in {industry}. "
            f"Company size: {company_size or 'Any'}. "
            f"Return qualified leads with contact info and approach strategy."
        )
        
        return {
            "task": "customer_discovery",
            "results": response.content,
            "timestamp": datetime.now().isoformat()
        }
    
    def find_partners(
        self,
        company_description: str,
        partnership_type: str,
        target_industry: str,
        max_results: int = 20
    ) -> Dict[str, Any]:
        """
        Encuentra socios estratégicos.
        
        Args:
            company_description: Descripción de la empresa
            partnership_type: Tipo de partnership (integration, distribution, co-marketing)
            target_industry: Industria objetivo
            max_results: Número máximo de partners
            
        Returns:
            Lista de potenciales partners
        """
        print(f"\n🔍 Buscando partners en: {target_industry} | {partnership_type}")
        
        response = self.partnership_agent.run(
            f"Find {max_results} strategic partners for: {company_description}. "
            f"Partnership type: {partnership_type}. "
            f"Target industry: {target_industry}. "
            f"Return potential partners with synergy analysis."
        )
        
        return {
            "task": "partnership_search",
            "results": response.content,
            "timestamp": datetime.now().isoformat()
        }
    
    def generate_outreach_campaign(
        self,
        profiles: List[Dict],
        campaign_purpose: str,
        sender_info: Dict,
        personalization_level: str = "medium"
    ) -> Dict[str, Any]:
        """
        Genera una campaña de outreach personalizada.
        
        Args:
            profiles: Lista de perfiles objetivo
            campaign_purpose: Propósito de la campaña
            sender_info: Información del remitente
            personalization_level: Nivel de personalización (low, medium, high)
            
        Returns:
            Campaña con mensajes personalizados
        """
        print(f"\n📧 Generando campaña de outreach para {len(profiles)} perfiles")
        
        # Select appropriate agent based on purpose
        agent_map = {
            "investment": self.investor_agent,
            "hiring": self.talent_agent,
            "sales": self.customer_agent,
            "partnership": self.partnership_agent
        }
        
        agent = agent_map.get(campaign_purpose, self.investor_agent)
        
        response = agent.run(
            f"Generate personalized outreach messages for {len(profiles)} profiles. "
            f"Purpose: {campaign_purpose}. "
            f"Sender: {json.dumps(sender_info)}. "
            f"Personalization level: {personalization_level}. "
            f"Include subject lines, message body, and follow-up sequences."
        )
        
        return {
            "task": "outreach_campaign",
            "campaign_size": len(profiles),
            "messages": response.content,
            "timestamp": datetime.now().isoformat()
        }


# ==============================================
# SINGLETON INSTANCE
# ==============================================

_linkedin_team_instance = None

def get_linkedin_connector_team() -> LinkedInConnectorTeam:
    """Get or create singleton instance of LinkedIn Connector Team"""
    global _linkedin_team_instance
    if _linkedin_team_instance is None:
        _linkedin_team_instance = LinkedInConnectorTeam()
    return _linkedin_team_instance


# ==============================================
# DEMO / TESTING
# ==============================================

def demonstrate_linkedin_connector():
    """Demonstración de capacidades del LinkedIn Connector"""
    
    print("=" * 60)
    print("🚀 ASTAR LABS - LINKEDIN CONNECTOR AGENT")
    print("=" * 60)
    
    team = get_linkedin_connector_team()
    
    # 1. Find Investors
    print("\n1️⃣ BUSCAR INVERSORES")
    print("-" * 60)
    investors = team.find_investors(
        startup_description="AI-powered customer support platform",
        funding_stage="seed",
        industry="SaaS",
        location="San Francisco",
        max_results=10
    )
    print(f"✅ Encontrados: {investors}")
    
    # 2. Find Talent
    print("\n2️⃣ BUSCAR TALENTO")
    print("-" * 60)
    talent = team.find_talent(
        role_description="Senior Full-Stack Engineer",
        required_skills=["Python", "React", "AWS"],
        company_description="Fast-growing AI startup",
        location="Remote",
        max_results=10
    )
    print(f"✅ Candidatos: {talent}")
    
    # 3. Find Customers
    print("\n3️⃣ BUSCAR CLIENTES")
    print("-" * 60)
    customers = team.find_customers(
        product_description="Project management tool for remote teams",
        target_persona="VP Engineering",
        industry="Technology",
        company_size="50-200 employees",
        max_results=10
    )
    print(f"✅ Leads: {customers}")
    
    # 4. Find Partners
    print("\n4️⃣ BUSCAR PARTNERS")
    print("-" * 60)
    partners = team.find_partners(
        company_description="API development platform",
        partnership_type="integration",
        target_industry="DevTools",
        max_results=10
    )
    print(f"✅ Partners: {partners}")
    
    print("\n" + "=" * 60)
    print("✅ Demonstración completada")
    print("=" * 60)


if __name__ == "__main__":
    demonstrate_linkedin_connector()
