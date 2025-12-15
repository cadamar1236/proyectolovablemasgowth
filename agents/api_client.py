"""
Cliente HTTP para comunicarse con la API de la webapp
"""
import httpx
from typing import Optional, List, Dict, Any
from config import config

class WebAppAPIClient:
    """Cliente para interactuar con la API de la webapp"""
    
    def __init__(self, base_url: str = None, auth_token: str = None):
        self.base_url = base_url or config.WEBAPP_API_URL
        self.auth_token = auth_token
        
    def _get_headers(self, token: str = None) -> Dict[str, str]:
        """Genera headers con autenticación"""
        auth = token or self.auth_token
        headers = {"Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = f"Bearer {auth}"
            headers["Cookie"] = f"authToken={auth}"
        return headers
    
    async def get_goals(self, auth_token: str) -> Dict[str, Any]:
        """Obtiene los goals del usuario"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/dashboard/goals",
                headers=self._get_headers(auth_token)
            )
            response.raise_for_status()
            return response.json()
    
    async def create_goal(self, auth_token: str, description: str) -> Dict[str, Any]:
        """Crea un nuevo goal"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/dashboard/goals",
                headers=self._get_headers(auth_token),
                json={"description": description}
            )
            response.raise_for_status()
            return response.json()
    
    async def update_goal_status(self, auth_token: str, goal_id: int, status: str) -> Dict[str, Any]:
        """Actualiza el estado de un goal"""
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/dashboard/goals/{goal_id}",
                headers=self._get_headers(auth_token),
                json={"status": status}
            )
            response.raise_for_status()
            return response.json()
    
    async def complete_goal(self, auth_token: str, goal_id: int) -> Dict[str, Any]:
        """Marca un goal como completado"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/dashboard/goals/complete",
                headers=self._get_headers(auth_token),
                json={"goalId": goal_id}
            )
            response.raise_for_status()
            return response.json()
    
    async def add_metric(self, auth_token: str, metric_name: str, metric_value: float, recorded_date: str) -> Dict[str, Any]:
        """Añade una métrica"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/dashboard/metrics",
                headers=self._get_headers(auth_token),
                json={
                    "metric_name": metric_name,
                    "metric_value": metric_value,
                    "recorded_date": recorded_date
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_metrics_history(self, auth_token: str) -> Dict[str, Any]:
        """Obtiene el historial de métricas"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/dashboard/metrics-history",
                headers=self._get_headers(auth_token)
            )
            response.raise_for_status()
            return response.json()
    
    async def add_achievement(self, auth_token: str, date: str, description: str) -> Dict[str, Any]:
        """Añade un logro"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/dashboard/achievements",
                headers=self._get_headers(auth_token),
                json={
                    "date": date,
                    "description": description
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_achievements(self, auth_token: str) -> Dict[str, Any]:
        """Obtiene los logros del usuario"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/dashboard/achievements",
                headers=self._get_headers(auth_token)
            )
            response.raise_for_status()
            return response.json()
    
    async def get_leaderboard(self, auth_token: str) -> Dict[str, Any]:
        """Obtiene el leaderboard público"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/dashboard/leaderboard",
                headers=self._get_headers(auth_token)
            )
            response.raise_for_status()
            return response.json()
    
    async def get_my_stats(self, auth_token: str) -> Dict[str, Any]:
        """Obtiene las estadísticas del usuario actual"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/dashboard/my-stats",
                headers=self._get_headers(auth_token)
            )
            response.raise_for_status()
            return response.json()
    
    async def get_internal_dashboard(self, auth_token: str) -> Dict[str, Any]:
        """Obtiene el dashboard interno para calcular leaderboard"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/dashboard/admin/internal-dashboard",
                headers=self._get_headers(auth_token)
            )
            response.raise_for_status()
            return response.json()
    
    async def check_user_exists(self, email: str) -> Optional[Dict[str, Any]]:
        """Verifica si un usuario existe y obtiene info básica"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/check-user",
                headers={"Content-Type": "application/json"},
                json={"email": email}
            )
            if response.status_code == 200:
                return response.json()
            return None
    
    async def verify_whatsapp_code(self, email: str, code: str) -> Optional[Dict[str, Any]]:
        """Verifica código temporal de WhatsApp"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/auth/verify-whatsapp-code",
                    headers={"Content-Type": "application/json"},
                    json={"email": email, "code": code}
                )
                print(f"Verify code response: {response.status_code} - {response.text}")
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception as e:
                print(f"Error verifying code: {e}")
                return None

# Instancia global del cliente
api_client = WebAppAPIClient()
