import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "services"))

from fastapi.testclient import TestClient
from trust_api import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    print(f"Health check status: {response.status_code}")
    print(f"Health check body: {response.json()}")

if __name__ == "__main__":
    try:
        test_health()
        print("Backend validation successful!")
    except Exception as e:
        print(f"Backend validation failed: {e}")
        sys.exit(1)
