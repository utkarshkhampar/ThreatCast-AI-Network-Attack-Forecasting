"""
ThreatCast - Users & Role Management API Router
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.core.database import get_db
from backend.app.models.all_models import (
    User, Asset, IncidentRecord, EvidenceRecordModel, AuditLogRecord, ForecastRecord
)
from backend.app.schemas.all_schemas import UserResponse

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/stats")
async def get_user_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns high-level statistics on registered operators and clearance states."""
    stmt = select(User)
    result = await db.execute(stmt)
    users = result.scalars().all()

    total = len(users)
    verified = sum(1 for u in users if u.is_verified)
    unverified = total - verified
    roles: Dict[str, int] = {}
    for u in users:
        roles[u.role] = roles.get(u.role, 0) + 1

    return {
        "total_users": total,
        "verified_users": verified,
        "pending_verification": unverified,
        "role_breakdown": roles,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }


@router.get("/database-overview")
async def get_database_overview(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns row counts across all primary database tables."""
    u_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    a_count = (await db.execute(select(func.count(Asset.id)))).scalar() or 0
    i_count = (await db.execute(select(func.count(IncidentRecord.id)))).scalar() or 0
    e_count = (await db.execute(select(func.count(EvidenceRecordModel.id)))).scalar() or 0
    f_count = (await db.execute(select(func.count(ForecastRecord.id)))).scalar() or 0
    audit_count = (await db.execute(select(func.count(AuditLogRecord.id)))).scalar() or 0

    return {
        "status": "HEALTHY",
        "tables": {
            "users": u_count,
            "assets": a_count,
            "incidents": i_count,
            "evidence_records": e_count,
            "forecasts": f_count,
            "audit_logs": audit_count,
        }
    }


@router.get("", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Lists all registered users in the database."""
    stmt = select(User)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users

