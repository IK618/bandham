# syntax=docker/dockerfile:1
FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app:/app/backend

WORKDIR /app

# Install system dependencies (build-essential, libpq for PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source under /app/backend
COPY . /app/backend
RUN chmod +x /app/backend/entrypoint.sh

# Expose default HTTP port
EXPOSE 8000

# Default container startup runs migrations, seed, and starts uvicorn on $PORT
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]
