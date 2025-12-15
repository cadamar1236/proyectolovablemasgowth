#!/usr/bin/env python3
"""
Script de prueba para verificar la integración de WhatsApp
"""
import os
import requests
import json
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def test_railway_health():
    """Probar el health check de Railway"""
    railway_url = os.getenv("RAILWAY_URL", "https://tu-proyecto-railway.up.railway.app")

    try:
        response = requests.get(f"{railway_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Railway health check: OK")
            print(f"   Status: {data.get('status')}")
            print(f"   Twilio: {data['components'].get('twilio')}")
            print(f"   Groq: {data['components'].get('groq')}")
            return True
        else:
            print(f"❌ Railway health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando a Railway: {e}")
        return False

def test_webapp_connection():
    """Probar conexión con la app principal"""
    webapp_url = os.getenv("WEBAPP_API_URL", "https://tu-app.pages.dev/api")

    try:
        # Intentar obtener goals (sin auth por ahora)
        response = requests.get(f"{webapp_url}/goals", timeout=10)
        print(f"✅ WebApp connection: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Error conectando a WebApp: {e}")
        return False

def test_twilio_config():
    """Verificar configuración de Twilio"""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER")

    print("🔧 Twilio Configuration:")
    print(f"   Account SID: {'✅' if account_sid else '❌'}")
    print(f"   Auth Token: {'✅' if auth_token else '❌'}")
    print(f"   WhatsApp Number: {whatsapp_number or '❌'}")

    return bool(account_sid and auth_token and whatsapp_number)

def main():
    print("🧪 Probando integración de WhatsApp Agents\n")

    # Verificar configuración
    twilio_ok = test_twilio_config()
    print()

    # Probar Railway
    railway_ok = test_railway_health()
    print()

    # Probar WebApp
    webapp_ok = test_webapp_connection()
    print()

    # Resumen
    print("📊 Resumen:")
    print(f"   Twilio Config: {'✅' if twilio_ok else '❌'}")
    print(f"   Railway Service: {'✅' if railway_ok else '❌'}")
    print(f"   WebApp Connection: {'✅' if webapp_ok else '❌'}")

    if not twilio_ok:
        print("\n⚠️  Configura las variables de entorno de Twilio en Railway")
    if not railway_ok:
        print("\n⚠️  Verifica que el servicio de Railway esté corriendo")
    if not webapp_ok:
        print("\n⚠️  Verifica la URL de la WebApp")

if __name__ == "__main__":
    main()