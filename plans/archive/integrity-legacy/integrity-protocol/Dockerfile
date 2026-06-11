# Xibalba Solutions: Integrity Protocol - Unified Dockerfile
# Built from repo root with backend/ context for Render deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code
COPY backend/services/ ./services/
# Set environment variables for Python paths
ENV PYTHONPATH=/app/services

# Default command: Run the Trust Oracle API
CMD ["sh", "-c", "uvicorn services.trust_api:app --host 0.0.0.0 --port ${PORT:-8001}"]
