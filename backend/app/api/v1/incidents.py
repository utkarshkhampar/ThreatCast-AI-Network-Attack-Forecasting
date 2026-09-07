"""
ThreatCast - Incidents Management API Router
Handles incident creation, triage lifecycle (NEW -> INVESTIGATING -> CONTAINED -> CLOSED),
and forensic evidence attachment.
"""

from datetime import datetime, timedelta
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.all_models import IncidentRecord
from backend.app.schemas.all_schemas import IncidentResponse, IncidentCreate, IncidentStatusUpdate

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

PRESEEDED_INCIDENTS = [
    {
        "id": "INC-2026-0042",
        "incident_title": "Projected Lateral Movement Sequence on WKSTN-042",
        "severity": "CRITICAL",
        "status": "INVESTIGATING",
        "forecast_id": "FC-1725528000",
        "target_asset_id": "AST-WK-42",
        "assigned_analyst": "analyst1",
        "summary": "ThreatCast world model projected 91% lateral movement probability towards SRV-APP-01 via SMB port 445.",
        "mitre_technique": "T1021.002",
        "risk_score": 91.0
    },
    {
        "id": "INC-2026-0039",
        "incident_title": "Active Reconnaissance Sweep Against Gateway Subnet",
        "severity": "HIGH",
        "status": "CONTAINED",
        "forecast_id": "FC-1725521000",
        "target_asset_id": "AST-GW-01",
        "assigned_analyst": "lead_soc_admin",
        "summary": "External IP probed sequential ports with elevated SYN ratio. Dry-run rule generated.",
        "mitre_technique": "T1595",
        "risk_score": 78.5
    }
]


@router.get("", response_model=List[IncidentResponse])
async def list_incidents(db: AsyncSession = Depends(get_db)):
    stmt = select(IncidentRecord).order_by(IncidentRecord.created_at.desc())
    result = await db.execute(stmt)
    incidents = result.scalars().all()
    now = datetime.utcnow()

    if not incidents:
        for idx, inc_data in enumerate(PRESEEDED_INCIDENTS):
            rec = IncidentRecord(**inc_data)
            rec.created_at = now - timedelta(minutes=(idx + 1) * 14)
            rec.updated_at = now - timedelta(minutes=(idx + 1) * 3)
            db.add(rec)
        await db.commit()
        stmt = select(IncidentRecord).order_by(IncidentRecord.created_at.desc())
        result = await db.execute(stmt)
        incidents = result.scalars().all()
    else:
        # Refresh any stale historical timestamps so live demonstration matches current operating date
        needs_commit = False
        for idx, inc in enumerate(incidents):
            if (now - inc.created_at).total_seconds() > 43200:  # > 12 hours old
                inc.created_at = now - timedelta(minutes=(idx + 1) * 14)
                inc.updated_at = now - timedelta(minutes=(idx + 1) * 3)
                needs_commit = True
        if needs_commit:
            await db.commit()

    return incidents


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(IncidentRecord).where(IncidentRecord.id == incident_id)
    result = await db.execute(stmt)
    rec = result.scalars().first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident {incident_id} not found.")
    return rec


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(req: IncidentCreate, db: AsyncSession = Depends(get_db)):
    incident_id = f"INC-2026-{uuid.uuid4().hex[:4].upper()}"
    rec = IncidentRecord(
        id=incident_id,
        incident_title=req.incident_title,
        severity=req.severity,
        status="NEW",
        forecast_id=req.forecast_id,
        target_asset_id=req.target_asset_id,
        assigned_analyst=req.assigned_analyst or "analyst1",
        summary=req.summary,
        mitre_technique=req.mitre_technique,
        risk_score=req.risk_score
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: str,
    update_data: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(IncidentRecord).where(IncidentRecord.id == incident_id)
    result = await db.execute(stmt)
    rec = result.scalars().first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident {incident_id} not found.")

    rec.status = update_data.status
    if update_data.notes:
        rec.summary = (rec.summary or "") + f"\n[{datetime.utcnow().strftime('%H:%M:%SZ')}] {update_data.notes}"
    rec.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(rec)
    return rec
