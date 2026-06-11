import requests
from typing import Any, Dict, Optional, Union
from .config import get_config_value

class IntegrityClient:
    def __init__(self):
        self.base_url = get_config_value("ORACLE_URL").rstrip("/")
        self.token = get_config_value("AUTH_TOKEN")

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        try:
            response.raise_for_status()
            if response.status_code == 204:
                return {}
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Try to extract error message from JSON response
            try:
                error_data = response.json()
                detail = error_data.get("detail", str(e))
                raise Exception(f"API Error: {detail}") from e
            except:
                raise Exception(f"API Error: {response.status_code} {response.reason}") from e
        except Exception as e:
            raise Exception(f"Connection Error: {str(e)}") from e

    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = requests.get(url, headers=self._headers(), params=params)
        return self._handle_response(response)

    def post(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = requests.post(url, headers=self._headers(), json=json_data)
        return self._handle_response(response)
