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

# Install Python requirements (supports both context=backend and context=root)
COPY requirements.txt* backend/requirements.txt* /app/
RUN if [ -f /app/requirements.txt ]; then \
        pip install --no-cache-dir -r /app/requirements.txt; \
    elif [ -f /app/backend/requirements.txt ]; then \
        pip install --no-cache-dir -r /app/backend/requirements.txt; \
    fi

# Copy source code and ensure it is organized under /app/backend
COPY . /tmp/src
RUN mkdir -p /app/backend && \
    if [ -d /tmp/src/backend ]; then \
        cp -r /tmp/src/backend/* /app/backend/; \
    else \
        cp -r /tmp/src/* /app/backend/; \
    fi && \
    rm -rf /tmp/src && \
    chmod +x /app/backend/entrypoint.sh

# Expose default HTTP port
EXPOSE 8000

# Default container startup runs migrations, seed, and starts uvicorn on $PORT
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]
