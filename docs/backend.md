# ThreatCast — Backend Architecture Specification

## 1. Architectural Stack & Principles
The ThreatCast backend is an asynchronous, high-throughput REST and WebSocket server built with:
- **Framework**: FastAPI 0.115+ (Python 3.9+)
- **ASGI Server**: Uvicorn with `uvloop` event loop policy
- **ORM & Data Layer**: SQLAlchemy 2.0 (fully asynchronous with `AsyncSession`)
- **Supported Databases**: SQLite via `aiosqlite` (zero-dependency local development) and PostgreSQL 16+ via `asyncpg` (enterprise production)
- **Authentication**: OAuth2 Password Bearer flow with JWT (JSON Web Tokens) and bcrypt password hashing
- **Real-Time Engine**: WebSocket duplex streams with connection tracking and broadcast channels

---

## 2. Directory Layout & Module Organization

```
backend/app/
├── api/
│   └── v1/
│       ├── active_defence.py       # Action authorization & execution
│       ├── ai_models.py            # Latent world model & baseline benchmarks
│       ├── analytics.py            # Aggregate SOC metrics & telemetry trends
│       ├── assets.py               # Hardware & workload inventory
│       ├── audit.py                # Security event & administrative logs
│       ├── auth.py                 # OAuth2 login, registration, token refresh
│       ├── blockchain.py           # On-chain proof anchoring & ledger query
│       ├── compliance.py           # NIST, ISO, SOC2 framework statuses
│       ├── evidence.py             # Incident evidence artifacts & Merkle roots
│       ├── explainability.py       # SHAP attributions & human-readable rationale
│       ├── forecasts.py            # K-step attack trajectory predictions
│       ├── health.py               # Liveness, readiness, and subsystem probes
│       ├── incidents.py            # Incident lifecycle & ticket management
│       ├── mitre.py                # ATT&CK v14 taxonomy & detection mapping
│       ├── reports.py              # Automated SOC executive PDF/JSON reports
│       ├── simulations.py          # Counterfactual "what-if" policy sandbox
│       ├── telemetry.py            # Ingested packet and flow time-series
│       ├── threat_intelligence.py  # Malicious indicators & reputation feed
│       ├── ueba.py                 # Entity behavior profiles & z-score deviations
│       └── users.py                # User directory and RBAC permissions
├── core/
│   ├── config.py                   # Pydantic Settings & environment variables
│   ├── database.py                 # Async engine & session factory
│   └── security.py                 # JWT minting, bcrypt hashing, password verify
├── models/
│   └── all_models.py               # SQLAlchemy ORM declarative models
├── schemas/
│   └── all_schemas.py              # Pydantic v2 validation & response schemas
├── websockets/
│   └── connection_manager.py       # Full-duplex connection hub & broadcaster
└── main.py                         # FastAPI application initialization & routing
```

---

## 3. Dependency Injection & Granular RBAC
Authorization is enforced via FastAPI dependencies:

```python
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    # Decodes JWT, validates exp/sub, verifies active user in database
    ...

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return current_user
    return role_checker
```

### Supported Roles:
- `ADMIN`: Full administrative control, kill switch toggle, user provisioning.
- `SECOPS_LEAD`: Approval and live execution of active defence remediations.
- `TIER_3_ANALYST`: Incident investigation, counterfactual simulation, model tuning.
- `TIER_1_ANALYST`: Read-only telemetry inspection, alert triage.
- `AUDITOR`: Access to audit logs, compliance matrices, and blockchain evidence records.

---

## 4. Asynchronous Database Session Lifecycles
Sessions are yielded within context-managed generators to ensure connection pooling and automatic rollback on failure:

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

---

## 5. WebSocket Connection Hub
The `ConnectionManager` in `backend/app/websockets/connection_manager.py` manages active client sockets:
- Tracks connected clients per channel (`telemetry`, `alerts`, `incidents`)
- Broadcasts real-time synthetic or production telemetry events
- Gracefully handles client disconnects and network drops without resource leakage
