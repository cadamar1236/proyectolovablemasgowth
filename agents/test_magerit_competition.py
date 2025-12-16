#!/usr/bin/env python3
"""
Prueba específica: Análisis competitivo de Magerit Bar de Ocio en Madrid

Esta prueba demuestra las capacidades del agente de marketing para:
1. Investigación de mercado local
2. Análisis competitivo de bares y ocio nocturno
3. Uso de herramientas Apify para datos reales
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Añadir el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from marketing_team import MarketingTeam


def test_magerit_competition():
    """Prueba específica de análisis competitivo para Magerit Bar"""

    print("🍸 ANÁLISIS COMPETITIVO: MAGERIT BAR DE OCIO - MADRID")
    print("=" * 60)

    # Verificar configuración
    if not os.getenv("GROQ_API_KEY"):
        print("❌ Error: GROQ_API_KEY no configurada en .env")
        return

    if not os.getenv("APIFY_API_TOKEN"):
        print("⚠️  Advertencia: APIFY_API_TOKEN no configurada - análisis limitado")

    print("✅ Configuración verificada")

    # Inicializar equipo
    try:
        marketing_team = MarketingTeam()
        print("✅ Equipo de marketing inicializado")
    except Exception as e:
        print(f"❌ Error inicializando equipo: {e}")
        return

    # Análisis competitivo de Magerit Bar
    print("\n🏙️ ANALIZANDO COMPETENCIA EN MADRID")
    print("-" * 40)

    business_description = """
    Magerit Bar de Ocio es un bar moderno y exclusivo ubicado en el corazón de Madrid.
    Ofrece una experiencia premium de ocio nocturno con:
    - Cócteles artesanales y carta de vinos selectos
    - Ambiente elegante con música en vivo
    - Zona VIP y eventos privados
    - Ubicación céntrica en Malasaña/Chueca
    - Público objetivo: 25-45 años, profesionales urbanos
    """

    competitors = [
        "Del Diego Bar (Malasaña)",
        "La Latina Gastrobar",
        "El Imperfecto Bar",
        "Casa Pueblo Madrid",
        "La Via Lactea Bar",
        "El Jardín Secreto",
        "Bar Cock (Chueca)",
        "Museo Chicote"
    ]

    print(f"🎯 Analizando competencia para: Magerit Bar de Ocio")
    print(f"📍 Ubicación: Madrid Centro (Malasaña/Chueca)")
    print(f"🏆 Competidores identificados: {len(competitors)}")

    try:
        # Ejecutar análisis competitivo
        analysis = marketing_team.analyze_competition(
            industry="Bares de ocio nocturno premium en Madrid",
            competitors=competitors
        )

        print("\n📊 RESULTADOS DEL ANÁLISIS COMPETITIVO")
        print("-" * 40)
        print(analysis)

        # Análisis adicional: Estrategia de marketing
        print("\n🎯 GENERANDO ESTRATEGIA DE MARKETING")
        print("-" * 40)

        strategy = marketing_team.run_marketing_analysis(
            business_description.strip(),
            "Posicionarse como el bar de referencia en Madrid, aumentar reservas VIP en 150%, crear comunidad exclusiva de 5000+ seguidores"
        )

        print("📈 ESTRATEGIA RECOMENDADA:")
        print("-" * 40)
        print(strategy)

        # Campaña de contenido específica
        print("\n📱 CAMPAÑA DE CONTENIDO PARA REDES")
        print("-" * 40)

        content_campaign = marketing_team.generate_content_campaign(
            topic="Experiencia premium de ocio nocturno en Madrid",
            platforms=["Instagram", "TikTok", "Google Maps"],
            duration_days=30
        )

        print("🎨 CAMPAÑA GENERADA:")
        print("-" * 40)
        print(content_campaign)

    except Exception as e:
        print(f"❌ Error en el análisis: {e}")
        print("\n🔧 Posibles soluciones:")
        print("1. Verifica que GROQ_API_KEY esté configurada")
        print("2. Si usas Apify, configura APIFY_API_TOKEN")
        print("3. Revisa la conexión a internet")
        return

    print("\n🎉 ANÁLISIS COMPLETADO EXITOSAMENTE")
    print("\n💡 Insights clave generados:")
    print("• Análisis de competencia local")
    print("• Estrategia de posicionamiento")
    print("• Campaña de contenido específica")
    print("• Recomendaciones de marketing digital")

    print("\n📞 Para consultas adicionales:")
    print("• marketing_team.analyze_competition('tu_industria', ['competidores'])")
    print("• marketing_team.run_marketing_analysis('tu_negocio', 'tus_objetivos')")


if __name__ == "__main__":
    test_magerit_competition()