#!/usr/bin/env bash
set -e

echo "================================================================================"
echo "      THREATCAST — TEMPORAL GRAPH WORLD MODEL FOR PREDICTIVE CYBER DEFENCE      "
echo "        \"Don't Just Detect the Attack. Forecast Where It's Going.\"            "
echo "================================================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "⚙️  Checking Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
    ./venv/bin/pip install greenlet
fi

echo "🌱 Seeding ThreatCast database..."
PYTHONPATH=. ./venv/bin/python3 scripts/seed_db.py

echo "📡 Ingesting synthetic multi-stage attack demonstration telemetry..."
PYTHONPATH=. ./venv/bin/python3 scripts/ingest_demo.py --steps 5

echo "🚀 Starting ThreatCast FastAPI Backend Service on port 8000..."
./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "🖥️  Starting ThreatCast React SOC Console on port 3000..."
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

echo ""
echo "================================================================================"
echo "ThreatCast Platform is running!"
echo "  SOC Frontend:   http://localhost:3000"
echo "  API Backend:    http://localhost:8000"
echo "  Interactive Docs: http://localhost:8000/docs"
echo "  Health Endpoint: http://localhost:8000/health"
echo "Press Ctrl+C to terminate services."
echo "================================================================================"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
