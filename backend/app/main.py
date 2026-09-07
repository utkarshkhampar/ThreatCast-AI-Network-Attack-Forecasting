"""
ThreatCast - Main FastAPI Application
Temporal Graph World Model for Predictive Cyber Defence
"""

import asyncio
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.websockets.connection_manager import ws_manager

# API Routers
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.assets import router as assets_router
from backend.app.api.v1.telemetry import router as telemetry_router
from backend.app.api.v1.forecasts import router as forecasts_router
from backend.app.api.v1.ai import router as ai_router
from backend.app.api.v1.explainability import router as explainability_router
from backend.app.api.v1.mitre import router as mitre_router
from backend.app.api.v1.ueba import router as ueba_router
from backend.app.api.v1.threat_intelligence import router as threat_intel_router
from backend.app.api.v1.incidents import router as incidents_router
from backend.app.api.v1.simulations import router as simulations_router
from backend.app.api.v1.response import router as response_router
from backend.app.api.v1.evidence import router as evidence_router
from backend.app.api.v1.blockchain import router as blockchain_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.v1.compliance import router as compliance_router
from backend.app.api.v1.audit import router as audit_router
from backend.app.api.v1.health import router as health_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("threatcast.main")


async def _live_heartbeat_worker():
    """Continuous 1-second background worker generating live packet flows across campus topology."""
    while True:
        try:
            from backend.app.api.v1.telemetry import generate_heartbeat_tick
            await generate_heartbeat_tick()
        except asyncio.CancelledError:
            break
        except Exception:
            pass
        await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ThreatCast AI Network Attack Forecasting Platform...")
    try:
        await init_db()
        logger.info("Database schemas initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", e)

    worker_task = asyncio.create_task(_live_heartbeat_worker())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass
    logger.info("Shutting down ThreatCast Platform.")


app = FastAPI(
    title="ThreatCast API",
    description=(
        "Temporal Graph World Model for Predictive Cyber Defence. "
        "Transforms network intrusion detection from reactive classification into forward-looking forecasting."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Health router at root level
app.include_router(health_router)

# Mount all V1 routers under /api/v1
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(users_router, prefix=api_v1)
app.include_router(assets_router, prefix=api_v1)
app.include_router(telemetry_router, prefix=api_v1)
app.include_router(forecasts_router, prefix=api_v1)
app.include_router(ai_router, prefix=api_v1)
app.include_router(explainability_router, prefix=api_v1)
app.include_router(mitre_router, prefix=api_v1)
app.include_router(ueba_router, prefix=api_v1)
app.include_router(threat_intel_router, prefix=api_v1)
app.include_router(incidents_router, prefix=api_v1)
app.include_router(simulations_router, prefix=api_v1)
app.include_router(response_router, prefix=api_v1)
app.include_router(evidence_router, prefix=api_v1)
app.include_router(blockchain_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)
app.include_router(analytics_router, prefix=api_v1)
app.include_router(compliance_router, prefix=api_v1)
app.include_router(audit_router, prefix=api_v1)


@app.websocket("/ws/v1/stream")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time full-duplex WebSocket streaming for SOC dashboards."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Echo or process incoming client commands (e.g. heartbeat ping)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"event_type": "PONG"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning("WebSocket connection exception: %s", e)
        ws_manager.disconnect(websocket)


@app.get("/")
async def root_overview():
    return {
        "platform": "ThreatCast",
        "tagline": "Don't Just Detect the Attack. Forecast Where It's Going.",
        "operating_loop": "Observe → Understand → Predict → Explain → Simulate → Defend",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
        "health": "/health",
        "version": settings.APP_VERSION
    }
