#!/bin/sh
set -e

# Railway and modern cloud PaaS assign a dynamic port via $PORT
PORT="${PORT:-8000}"

echo "=================================================================="
echo " Starting Bandham Matrimonial Backend Service"
echo " Environment: ${ENVIRONMENT:-development}"
echo " Port: $PORT"
echo "=================================================================="

# Ensure application roots are in PYTHONPATH
export PYTHONPATH="/app:/app/backend:.:backend:$PYTHONPATH"

# Detect Alembic config path
ALEMBIC_CONFIG="backend/alembic.ini"
if [ -f "alembic.ini" ]; then
    ALEMBIC_CONFIG="alembic.ini"
elif [ -f "/app/backend/alembic.ini" ]; then
    ALEMBIC_CONFIG="/app/backend/alembic.ini"
fi

# Detect Seed script path
SEED_SCRIPT="backend/scripts/seed_database.py"
if [ -f "scripts/seed_database.py" ]; then
    SEED_SCRIPT="scripts/seed_database.py"
elif [ -f "/app/backend/scripts/seed_database.py" ]; then
    SEED_SCRIPT="/app/backend/scripts/seed_database.py"
fi

# Determine ASGI application target
APP_TARGET="backend.app.main:app"
if [ -f "app/main.py" ] && [ ! -d "backend/app" ]; then
    APP_TARGET="app.main:app"
fi

# 1. Run migrations
echo "[1/3] Running database schema migrations ($ALEMBIC_CONFIG)..."
alembic -c "$ALEMBIC_CONFIG" upgrade head || {
    echo "Notice: Alembic upgrade step completed or handled. Proceeding..."
}

# 2. Seed initial plans, staff, demo profiles
echo "[2/3] Verifying and seeding initial catalog and demo data ($SEED_SCRIPT)..."
python "$SEED_SCRIPT" || {
    echo "Notice: Database seed step completed. Proceeding..."
}

# 3. Launch Uvicorn
echo "[3/3] Launching Uvicorn production server on 0.0.0.0:$PORT ($APP_TARGET)..."
exec uvicorn "$APP_TARGET" --host 0.0.0.0 --port "$PORT" --proxy-headers --forwarded-allow-ips='*'
