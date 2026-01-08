"""
Brand Marketing Agent - Generación de imágenes de marketing con fal.ai
======================================================================

Agente especializado en:
- Scraping de páginas web de startups para extraer brand identity
- Análisis de colores, tipografía y estilo visual
- Generación de imágenes de marketing con fal.ai
- Creación de banners, posts para redes sociales, ads

Requiere:
pip install agno openai httpx beautifulsoup4 fal-client apify-client Pillow
"""

import os
import json
import re
import base64
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
from io import BytesIO

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools import tool
from agno.tools.apify import ApifyTools
import httpx

# Try to import fal for image generation
try:
    import fal_client
    FAL_AVAILABLE = True
except ImportError:
    FAL_AVAILABLE = False
    print("Warning: fal_client not installed. Install with: pip install fal-client")

# Try to import BeautifulSoup for HTML parsing
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    print("Warning: beautifulsoup4 not installed. Install with: pip install beautifulsoup4")


# ============================================
# CONFIGURACIÓN
# ============================================

@dataclass
class BrandMarketingConfig:
    """Configuration for Brand Marketing Agent"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    fal_api_key: str = os.getenv("FAL_KEY", "")
    apify_api_token: str = os.getenv("APIFY_API_TOKEN", "")
    
    def __post_init__(self):
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")
        if self.fal_api_key and FAL_AVAILABLE:
            os.environ["FAL_KEY"] = self.fal_api_key


config = BrandMarketingConfig()


# ============================================
# HERRAMIENTAS DE SCRAPING Y ANÁLISIS
# ============================================

@tool
def scrape_startup_website(url: str) -> str:
    """
    Hace scraping de la página web de una startup para extraer información de marca.
    
    Args:
        url: URL de la página web de la startup
    
    Returns:
        Información extraída de la marca (colores, textos, estilo)
    """
    if not BS4_AVAILABLE:
        return "Error: beautifulsoup4 no está instalado. Ejecuta: pip install beautifulsoup4"
    
    try:
        # Hacer request a la página
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extraer información
        brand_info = {
            "url": url,
            "title": "",
            "description": "",
            "tagline": "",
            "colors": [],
            "fonts": [],
            "images": [],
            "key_words": [],
            "style_hints": []
        }
        
        # Título
        if soup.title:
            brand_info["title"] = soup.title.string or ""
        
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            brand_info["description"] = meta_desc.get('content', '')
        
        # OG description como fallback
        og_desc = soup.find('meta', property='og:description')
        if og_desc and not brand_info["description"]:
            brand_info["description"] = og_desc.get('content', '')
        
        # Extraer colores del CSS inline y style tags
        colors = set()
        
        # Buscar en style tags
        for style in soup.find_all('style'):
            text = style.string or ""
            # Buscar colores hex
            hex_colors = re.findall(r'#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}', text)
            colors.update(hex_colors)
            # Buscar rgb/rgba
            rgb_colors = re.findall(r'rgb\([^)]+\)', text)
            colors.update(rgb_colors)
        
        # Buscar en atributos style
        for tag in soup.find_all(style=True):
            style_attr = tag.get('style', '')
            hex_colors = re.findall(r'#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}', style_attr)
            colors.update(hex_colors)
        
        # Filtrar colores comunes (blanco, negro)
        filtered_colors = [c for c in colors if c.lower() not in ['#fff', '#ffffff', '#000', '#000000', '#333', '#333333']]
        brand_info["colors"] = list(filtered_colors)[:10]
        
        # Extraer textos destacados (h1, h2, hero text)
        headings = []
        for tag in ['h1', 'h2']:
            for h in soup.find_all(tag):
                text = h.get_text(strip=True)
                if text and len(text) > 5:
                    headings.append(text)
        
        brand_info["tagline"] = headings[0] if headings else ""
        brand_info["key_words"] = headings[:5]
        
        # Extraer logos e imágenes principales
        images = []
        for img in soup.find_all('img'):
            src = img.get('src', '')
            alt = img.get('alt', '')
            if src and ('logo' in src.lower() or 'logo' in alt.lower() or 'brand' in src.lower()):
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = url.rstrip('/') + src
                images.append({"src": src, "alt": alt, "type": "logo"})
        
        brand_info["images"] = images[:5]
        
        # Detectar estilo general
        style_hints = []
        body_classes = soup.body.get('class', []) if soup.body else []
        
        # Buscar indicadores de estilo
        page_text = soup.get_text().lower()
        if 'modern' in page_text or 'innovative' in page_text:
            style_hints.append("modern/innovative")
        if 'minimal' in page_text or 'simple' in page_text:
            style_hints.append("minimalist")
        if 'professional' in page_text or 'enterprise' in page_text:
            style_hints.append("professional/corporate")
        if 'creative' in page_text or 'design' in page_text:
            style_hints.append("creative/artistic")
        if 'tech' in page_text or 'technology' in page_text:
            style_hints.append("tech-focused")
        if 'startup' in page_text or 'grow' in page_text:
            style_hints.append("startup/growth")
        
        brand_info["style_hints"] = style_hints if style_hints else ["professional"]
        
        return f"""🎨 ANÁLISIS DE MARCA EXTRAÍDO

🌐 URL: {brand_info['url']}
📌 Título: {brand_info['title']}
📝 Descripción: {brand_info['description'][:200]}...

💬 Tagline/Mensaje principal:
{brand_info['tagline']}

🎨 Colores identificados:
{', '.join(brand_info['colors']) if brand_info['colors'] else 'No se encontraron colores específicos'}

🖼️ Logos/Imágenes de marca:
{json.dumps(brand_info['images'], indent=2) if brand_info['images'] else 'No se encontraron logos'}

📊 Palabras clave:
{', '.join(brand_info['key_words'])}

🎯 Estilo detectado:
{', '.join(brand_info['style_hints'])}

📋 DATOS JSON PARA GENERACIÓN:
```json
{json.dumps(brand_info, indent=2)}
```
"""
        
    except Exception as e:
        return f"""❌ Error al hacer scraping de {url}:
{str(e)}

💡 Posibles causas:
- URL incorrecta o sitio no accesible
- El sitio bloquea scraping
- Timeout de conexión

Intenta proporcionar la información de marca manualmente."""


@tool
def analyze_brand_identity(brand_info_json: str) -> str:
    """
    Analiza la información de marca y genera recomendaciones de estilo visual.
    
    Args:
        brand_info_json: JSON con información de la marca extraída
    
    Returns:
        Análisis y recomendaciones de estilo visual
    """
    try:
        brand_info = json.loads(brand_info_json)
    except:
        return "Error: JSON de información de marca inválido"
    
    colors = brand_info.get('colors', [])
    style_hints = brand_info.get('style_hints', ['professional'])
    description = brand_info.get('description', '')
    tagline = brand_info.get('tagline', '')
    
    # Determinar paleta de colores
    primary_color = colors[0] if colors else "#6366f1"  # Default: Indigo
    secondary_color = colors[1] if len(colors) > 1 else "#8b5cf6"  # Default: Purple
    accent_color = colors[2] if len(colors) > 2 else "#22d3ee"  # Default: Cyan
    
    # Determinar estilo visual basado en hints
    if 'tech-focused' in style_hints or 'startup/growth' in style_hints:
        visual_style = "futuristic tech"
        mood = "innovative, cutting-edge, professional"
        elements = "geometric shapes, gradients, abstract tech elements, clean lines"
    elif 'minimalist' in style_hints:
        visual_style = "clean minimalist"
        mood = "elegant, simple, sophisticated"
        elements = "lots of white space, simple icons, subtle gradients"
    elif 'creative/artistic' in style_hints:
        visual_style = "bold creative"
        mood = "vibrant, artistic, expressive"
        elements = "bold colors, dynamic compositions, artistic brushstrokes"
    else:
        visual_style = "modern professional"
        mood = "trustworthy, professional, approachable"
        elements = "clean layouts, professional imagery, balanced compositions"
    
    return f"""🎨 ANÁLISIS DE IDENTIDAD DE MARCA

📊 PALETA DE COLORES:
- Color primario: {primary_color}
- Color secundario: {secondary_color}
- Color de acento: {accent_color}

🎭 ESTILO VISUAL: {visual_style.upper()}
- Mood: {mood}
- Elementos clave: {elements}

📝 MENSAJE DE MARCA:
"{tagline or description[:100]}"

🖼️ RECOMENDACIONES PARA IMÁGENES:

1. BANNERS DE REDES SOCIALES:
   - Estilo: {visual_style}
   - Incluir: logo/nombre, tagline, colores de marca
   - Formato: 1200x628 (Facebook/LinkedIn), 1080x1080 (Instagram)

2. ADS DIGITALES:
   - Estilo: llamativo pero coherente con marca
   - CTA claro y visible
   - Formato: 1200x628 (horizontal), 1080x1920 (stories)

3. THUMBNAILS/ICONOS:
   - Estilo: simplificado, reconocible
   - Colores: usar paleta primaria
   - Formato: 400x400 o cuadrado

4. HERO IMAGES:
   - Estilo: impactante, profesional
   - Incluir: elementos que reflejen el producto/servicio
   - Formato: 1920x1080 o 2400x1200

💡 PROMPTS SUGERIDOS PARA FAL.AI:
```
1. Banner profesional:
"A professional marketing banner in {visual_style} style, with {elements}, using colors {primary_color} and {secondary_color}, {mood} atmosphere, for a tech startup, high quality, 4k"

2. Social media post:
"Modern social media post design, {visual_style}, vibrant {primary_color} accents, abstract {elements}, professional look, suitable for tech company, instagram square format"

3. Hero image:
"Stunning hero image for a startup website, {visual_style} aesthetic, {mood}, featuring {elements}, gradient from {primary_color} to {secondary_color}, professional photography style, 16:9 aspect ratio"
```
"""


@tool
def generate_marketing_image(
    prompt: str,
    style: str = "professional",
    aspect_ratio: str = "landscape",
    brand_colors: str = ""
) -> str:
    """
    Genera una imagen de marketing usando fal.ai.
    
    Args:
        prompt: Descripción de la imagen a generar
        style: Estilo visual (professional, creative, minimalist, tech)
        aspect_ratio: Relación de aspecto (landscape, portrait, square)
        brand_colors: Colores de marca a incluir (hex, separados por coma)
    
    Returns:
        URL de la imagen generada o error
    """
    if not FAL_AVAILABLE:
        return "Error: fal_client no está instalado. Ejecuta: pip install fal-client"
    
    if not config.fal_api_key:
        return "Error: FAL_KEY no está configurado. Añade FAL_KEY a las variables de entorno."
    
    # Configurar dimensiones según aspect ratio
    # GPT-Image-1.5 solo acepta: 1024x1024, 1536x1024, 1024x1536
    dimensions = {
        "landscape": {"width": 1536, "height": 1024},  # horizontal
        "portrait": {"width": 1024, "height": 1536},   # vertical
        "square": {"width": 1024, "height": 1024},
        "banner": {"width": 1536, "height": 1024},     # horizontal para banners
        "story": {"width": 1024, "height": 1536},      # vertical para stories
        "post": {"width": 1024, "height": 1024}        # cuadrado para posts
    }
    
    # Mapping para GPT-Image-1.5 (solo acepta estos valores exactos)
    size_mapping = {
        "landscape": "1536x1024",
        "portrait": "1024x1536",
        "square": "1024x1024",
        "banner": "1536x1024",
        "story": "1024x1536",
        "post": "1024x1024"
    }
    
    dim = dimensions.get(aspect_ratio, dimensions["landscape"])
    image_size_enum = size_mapping.get(aspect_ratio, "1024x1024")
    
    # Mejorar el prompt con estilos
    style_modifiers = {
        "professional": "professional, corporate, clean design, modern, high quality, 4k",
        "creative": "creative, artistic, vibrant colors, dynamic composition, eye-catching",
        "minimalist": "minimalist, clean, lots of white space, elegant, sophisticated",
        "tech": "futuristic, tech-inspired, geometric shapes, digital, innovative, neon accents"
    }
    
    style_suffix = style_modifiers.get(style, style_modifiers["professional"])
    
    # Añadir colores si se proporcionan
    color_suffix = ""
    if brand_colors:
        color_suffix = f", featuring brand colors {brand_colors}, color harmony"
    
    enhanced_prompt = f"{prompt}, {style_suffix}{color_suffix}"
    
    # Traducir prompt a inglés si parece estar en español
    # Los modelos de imagen funcionan mejor con prompts en inglés
    translation_hints = {
        "profesional": "professional",
        "creativo": "creative",
        "minimalista": "minimalist",
        "moderno": "modern",
        "elegante": "elegant",
        "startup": "startup",
        "tecnología": "technology",
        "negocio": "business",
        "marca": "brand",
        "marketing": "marketing",
        "redes sociales": "social media",
        "publicidad": "advertising",
        "banner": "banner",
        "imagen": "image",
        "diseño": "design"
    }
    
    for es, en in translation_hints.items():
        enhanced_prompt = enhanced_prompt.replace(es, en)
    
    try:
        # Usar fal.ai para generar la imagen
        # Modelo: fal-ai/gpt-image-1.5 (GPT Image 1.5 - mejor comprensión de prompts)
        # Solo acepta image_size: 1024x1024, 1536x1024, 1024x1536
        print(f"[FAL] Generando imagen con GPT-Image-1.5...")
        print(f"[FAL] Prompt: {enhanced_prompt[:100]}...")
        print(f"[FAL] Size: {image_size_enum}")
        
        result = fal_client.subscribe(
            "fal-ai/gpt-image-1.5",
            arguments={
                "prompt": enhanced_prompt,
                "image_size": image_size_enum,
                "num_images": 1,
                "quality": "high",
                "output_format": "png"
            }
        )
        
        print(f"[FAL] Resultado: {result}")
        
        if result and 'images' in result and len(result['images']) > 0:
            image_url = result['images'][0].get('url', '')
            
            return f"""✅ IMAGEN GENERADA EXITOSAMENTE

🖼️ URL: {image_url}

📊 Detalles:
- Prompt: {enhanced_prompt[:100]}...
- Estilo: {style}
- Dimensiones: {dim['width']}x{dim['height']}
- Aspect ratio: {aspect_ratio}

💡 Sugerencias de uso:
- Descargar en alta resolución
- Añadir logo/texto con editor de imagen
- Optimizar tamaño para web (<500KB)

🔗 Link directo: {image_url}
"""
        else:
            return f"Error: No se pudo generar la imagen. Respuesta: {result}"
            
    except Exception as e:
        return f"""❌ Error al generar imagen con fal.ai:
{str(e)}

💡 Posibles soluciones:
- Verificar que FAL_KEY esté configurado correctamente
- Revisar el prompt (evitar contenido prohibido)
- Intentar con un prompt más simple"""


@tool
def generate_social_media_pack(
    brand_name: str,
    tagline: str,
    primary_color: str,
    style: str = "professional"
) -> str:
    """
    Genera un pack de imágenes para redes sociales.
    
    Args:
        brand_name: Nombre de la marca/startup
        tagline: Eslogan o mensaje principal
        primary_color: Color principal de la marca (hex)
        style: Estilo visual (professional, creative, minimalist, tech)
    
    Returns:
        URLs de las imágenes generadas
    """
    if not FAL_AVAILABLE or not config.fal_api_key:
        return "Error: fal.ai no está configurado correctamente"
    
    results = []
    
    # Definir los formatos a generar
    formats = [
        {
            "name": "Instagram Square",
            "prompt": f"Instagram social media post for {brand_name}, {tagline}, modern design, clean layout, featuring {primary_color} color accents",
            "aspect_ratio": "square"
        },
        {
            "name": "LinkedIn Banner",
            "prompt": f"Professional LinkedIn company banner for {brand_name}, {tagline}, corporate style, sleek design, {primary_color} gradient",
            "aspect_ratio": "banner"
        },
        {
            "name": "Instagram Story",
            "prompt": f"Engaging Instagram story for {brand_name}, {tagline}, vertical layout, eye-catching, {primary_color} highlights",
            "aspect_ratio": "story"
        }
    ]
    
    for fmt in formats:
        try:
            # Usar GPT-Image-1.5 para mejor calidad
            # Solo acepta: 1024x1024, 1536x1024, 1024x1536
            size_mapping = {
                "square": "1024x1024",
                "banner": "1536x1024",  # horizontal
                "story": "1024x1536"    # vertical
            }
            
            result = fal_client.subscribe(
                "fal-ai/gpt-image-1.5",
                arguments={
                    "prompt": f"{fmt['prompt']}, {style} style, high quality, 4k, professional marketing image",
                    "image_size": size_mapping.get(fmt["aspect_ratio"], "1024x1024"),
                    "num_images": 1,
                    "quality": "high"
                }
            )
            
            if result and 'images' in result:
                image_url = result['images'][0].get('url', '')
                results.append({
                    "name": fmt["name"],
                    "url": image_url,
                    "success": True
                })
            else:
                results.append({
                    "name": fmt["name"],
                    "error": "No se pudo generar",
                    "success": False
                })
                
        except Exception as e:
            results.append({
                "name": fmt["name"],
                "error": str(e),
                "success": False
            })
    
    # Formatear respuesta
    output = f"""📦 PACK DE REDES SOCIALES PARA {brand_name.upper()}

🎨 Estilo: {style}
🎯 Mensaje: {tagline}
🎨 Color principal: {primary_color}

📸 IMÁGENES GENERADAS:
"""
    
    for r in results:
        if r["success"]:
            output += f"""
✅ {r['name']}:
   🔗 {r['url']}
"""
        else:
            output += f"""
❌ {r['name']}: Error - {r.get('error', 'Desconocido')}
"""
    
    output += """
💡 PRÓXIMOS PASOS:
1. Descargar las imágenes
2. Añadir logo y textos finales en Canva/Figma
3. Optimizar tamaños para cada plataforma
4. Programar publicaciones
"""
    
    return output


# ============================================
# AGENTE DE BRAND MARKETING PRINCIPAL
# ============================================

class BrandMarketingAgent:
    """
    Agente especializado en análisis de marca y generación de contenido visual
    """
    
    def __init__(self):
        self.config = BrandMarketingConfig()
        
        tools = [
            scrape_startup_website,
            analyze_brand_identity,
            generate_marketing_image,
            generate_social_media_pack
        ]
        
        # Añadir Apify tools si está configurado
        if self.config.apify_api_token:
            try:
                apify_tools = ApifyTools(
                    actors=["apify/website-content-crawler"],
                    apify_api_token=self.config.apify_api_token
                )
                tools.append(apify_tools)
            except:
                pass
        
        self.agent = Agent(
            name="Brand Marketing Specialist",
            model=OpenAIChat(api_key=self.config.openai_api_key, id=self.config.openai_model),
            tools=tools,
            instructions=[
                "Eres un experto en branding y marketing visual para startups.",
                "Tu objetivo es ayudar a startups a crear contenido visual de alta calidad.",
                "",
                "FLUJO DE TRABAJO TÍPICO:",
                "1. Hacer scraping de la web de la startup para extraer brand identity",
                "2. Analizar colores, estilo y mensaje de marca",
                "3. Generar imágenes de marketing coherentes con la marca",
                "4. Proporcionar recomendaciones de uso",
                "",
                "CAPACIDADES:",
                "- Web scraping para análisis de marca",
                "- Extracción de paleta de colores",
                "- Identificación de estilo visual",
                "- Generación de imágenes con fal.ai",
                "- Creación de packs de redes sociales",
                "",
                "TIPOS DE CONTENIDO QUE PUEDES GENERAR:",
                "- Banners para redes sociales (LinkedIn, Facebook, Twitter)",
                "- Posts de Instagram (cuadrados)",
                "- Stories (Instagram, Facebook, TikTok)",
                "- Ads digitales",
                "- Hero images para landing pages",
                "- Thumbnails y miniaturas",
                "",
                "PRINCIPIOS DE DISEÑO:",
                "- Mantener coherencia con la identidad de marca",
                "- Usar colores de marca de forma estratégica",
                "- Crear composiciones equilibradas y profesionales",
                "- Optimizar para cada plataforma específica",
                "",
                "Responde en español y sé proactivo sugiriendo mejoras.",
                "Siempre proporciona URLs directas de las imágenes generadas."
            ],
            markdown=True,
            add_history_to_context=True
        )
    
    def analyze_and_generate(self, website_url: str, content_types: List[str] = None) -> str:
        """
        Analiza una web y genera contenido visual.
        
        Args:
            website_url: URL de la startup
            content_types: Tipos de contenido a generar
        
        Returns:
            Análisis y URLs de imágenes generadas
        """
        if content_types is None:
            content_types = ["instagram_square", "linkedin_banner"]
        
        prompt = f"""Analiza la página web {website_url} y genera contenido de marketing:

1. Primero, usa scrape_startup_website para extraer la identidad de marca
2. Luego, usa analyze_brand_identity para entender el estilo visual
3. Finalmente, genera imágenes de marketing para: {', '.join(content_types)}

Proporciona un informe completo con:
- Análisis de marca
- Recomendaciones de estilo
- URLs de las imágenes generadas
"""
        
        response = self.agent.run(prompt)
        return response.content
    
    def generate_campaign_images(
        self,
        brand_name: str,
        description: str,
        colors: List[str],
        campaign_theme: str
    ) -> str:
        """
        Genera imágenes para una campaña de marketing.
        
        Args:
            brand_name: Nombre de la marca
            description: Descripción de la campaña
            colors: Lista de colores de marca (hex)
            campaign_theme: Tema de la campaña
        
        Returns:
            URLs de las imágenes generadas
        """
        prompt = f"""Genera imágenes de marketing para la siguiente campaña:

MARCA: {brand_name}
DESCRIPCIÓN: {description}
COLORES: {', '.join(colors)}
TEMA: {campaign_theme}

Genera:
1. Un banner principal para la campaña (landscape)
2. Un post de Instagram (square)
3. Una story (portrait)

Para cada imagen, proporciona:
- El prompt usado
- La URL de la imagen
- Sugerencias de uso"""
        
        response = self.agent.run(prompt)
        return response.content


# ============================================
# TEAM DE BRAND MARKETING
# ============================================

class BrandMarketingTeam:
    """
    Team multiagente para marketing visual y branding
    """
    
    def __init__(self):
        self.brand_agent = BrandMarketingAgent()
        self.session_storage = {}
    
    def chat(self, message: str, session_id: str, context: Dict = None) -> Dict[str, Any]:
        """
        Procesa un mensaje de chat relacionado con marketing visual.
        
        Args:
            message: Mensaje del usuario
            session_id: ID de sesión
            context: Contexto adicional
        
        Returns:
            Respuesta del agente
        """
        if session_id not in self.session_storage:
            self.session_storage[session_id] = {
                "history": [],
                "brand_info": context or {}
            }
        
        session = self.session_storage[session_id]
        
        if context:
            session["brand_info"].update(context)
        
        session["history"].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        
        try:
            # Añadir contexto al mensaje si existe
            if session["brand_info"]:
                full_message = f"""Contexto de marca:
{json.dumps(session['brand_info'], indent=2)}

Solicitud:
{message}"""
            else:
                full_message = message
            
            response = self.brand_agent.agent.run(full_message)
            
            session["history"].append({
                "role": "assistant",
                "content": response.content,
                "timestamp": datetime.now().isoformat()
            })
            
            return {
                "success": True,
                "response": response.content,
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id
            }
    
    def quick_generate(self, website_url: str) -> Dict[str, Any]:
        """
        Genera rápidamente contenido de marketing desde una URL.
        
        Args:
            website_url: URL de la startup
        
        Returns:
            Imágenes generadas y análisis
        """
        try:
            result = self.brand_agent.analyze_and_generate(website_url)
            return {
                "success": True,
                "result": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# ============================================
# PUNTO DE ENTRADA
# ============================================

if __name__ == "__main__":
    # Test del agente
    team = BrandMarketingTeam()
    
    # Test de chat
    result = team.chat(
        message="Analiza la marca de https://stripe.com y genera un banner de LinkedIn",
        session_id="test_session"
    )
    
    print("=" * 60)
    print("RESPUESTA DEL AGENTE DE BRAND MARKETING")
    print("=" * 60)
    print(result.get("response", result.get("error")))
