#!/usr/bin/env python3
"""
Script de prueba para el Agente Multiagente de Marketing

Ejecuta pruebas básicas del sistema de marketing con Agno.
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Añadir el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from marketing_team import MarketingTeam


def test_marketing_team():
    """Prueba básica del equipo de marketing"""

    print("🧪 PRUEBA DEL EQUIPO DE MARKETING")
    print("=" * 50)

    # Verificar configuración
    if not os.getenv("GROQ_API_KEY"):
        print("❌ Error: GROQ_API_KEY no configurada en .env")
        return

    print("✅ Configuración verificada")

    # Inicializar equipo
    try:
        marketing_team = MarketingTeam()
        print("✅ Equipo de marketing inicializado")
    except Exception as e:
        print(f"❌ Error inicializando equipo: {e}")
        return

    # Prueba 1: Análisis simple
    print("\n📊 PRUEBA 1: Análisis de estrategia básica")
    print("-" * 40)

    try:
        result = marketing_team.run_marketing_analysis(
            "Una app de fitness para millennials",
            "Aumentar descargas en 200% en 3 meses"
        )
        print("✅ Análisis completado")
        print(f"Longitud de respuesta: {len(result)} caracteres")
        print("Vista previa:")
        print(result[:300] + "...")
    except Exception as e:
        print(f"❌ Error en análisis: {e}")

    # Prueba 2: Generación de contenido
    print("\n📝 PRUEBA 2: Generación de campaña de contenido")
    print("-" * 40)

    try:
        result = marketing_team.generate_content_campaign(
            "Bienestar mental en el trabajo remoto",
            ["Instagram", "LinkedIn"]
        )
        print("✅ Campaña generada")
        print(f"Longitud de respuesta: {len(result)} caracteres")
        print("Vista previa:")
        print(result[:300] + "...")
    except Exception as e:
        print(f"❌ Error en campaña: {e}")

    # Prueba 3: Análisis competitivo
    print("\n🏆 PRUEBA 3: Análisis competitivo")
    print("-" * 40)

    try:
        result = marketing_team.analyze_competition(
            "Apps de meditación",
            ["Headspace", "Calm", "Insight Timer"]
        )
        print("✅ Análisis competitivo completado")
        print(f"Longitud de respuesta: {len(result)} caracteres")
        print("Vista previa:")
        print(result[:300] + "...")
    except Exception as e:
        print(f"❌ Error en análisis competitivo: {e}")

    print("\n🎉 PRUEBAS COMPLETADAS")
    print("\n💡 Para usar el equipo interactivamente:")
    print("from marketing_team import MarketingTeam")
    print("team = MarketingTeam()")
    print("team.run_marketing_analysis('tu negocio')")


if __name__ == "__main__":
    test_marketing_team()