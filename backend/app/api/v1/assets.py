"""
ThreatCast - Assets & Host Inventory API Router
Manages monitored endpoints, allow-listed CIDRs, criticality tiers, and host baseline states.
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.all_models import Asset
from backend.app.schemas.all_schemas import AssetResponse, AssetCreate

router = APIRouter(prefix="/assets", tags=["Asset Inventory & Discovery"])

PRESEEDED_ASSETS = [
    {"id": "AST-GW-01", "name": "GW-EDGE-01", "ip_address": "192.168.1.1", "asset_type": "GATEWAY", "criticality": "CRITICAL", "risk_score": 15.0, "is_allowlisted": True},
    {"id": "AST-DC-01", "name": "DC-CORP-01", "ip_address": "10.0.0.5", "asset_type": "SERVER", "criticality": "CRITICAL", "risk_score": 22.0, "is_allowlisted": True},
    {"id": "AST-SRV-APP", "name": "SRV-APP-01", "ip_address": "10.0.0.10", "asset_type": "SERVER", "criticality": "HIGH", "risk_score": 35.0, "is_allowlisted": True},
    {"id": "AST-SRV-DB", "name": "SRV-DB-01", "ip_address": "10.0.0.20", "asset_type": "SERVER", "criticality": "CRITICAL", "risk_score": 18.0, "is_allowlisted": True},
    {"id": "AST-WK-42", "name": "WKSTN-042", "ip_address": "192.168.1.45", "asset_type": "WORKSTATION", "criticality": "MEDIUM", "risk_score": 88.5, "is_allowlisted": True},
    {"id": "AST-WK-88", "name": "WKSTN-088", "ip_address": "192.168.1.88", "asset_type": "WORKSTATION", "criticality": "LOW", "risk_score": 12.0, "is_allowlisted": True},
    {"id": "AST-EXT-C2", "name": "EXT-MALICIOUS-C2", "ip_address": "198.51.100.42", "asset_type": "EXTERNAL", "criticality": "HIGH", "risk_score": 96.0, "is_allowlisted": False},
]


@router.get("", response_model=List[AssetResponse])
async def list_assets(db: AsyncSession = Depends(get_db)):
    stmt = select(Asset)
    result = await db.execute(stmt)
    assets = result.scalars().all()

    if not assets:
        # Preseed default assets if database is newly initialized
        for a_data in PRESEEDED_ASSETS:
            asset = Asset(
                id=a_data["id"],
                name=a_data["name"],
                ip_address=a_data["ip_address"],
                asset_type=a_data["asset_type"],
                criticality=a_data["criticality"],
                risk_score=a_data["risk_score"],
                is_allowlisted=a_data["is_allowlisted"],
                is_monitored=True,
                ueba_deviation=15.0 if a_data["risk_score"] < 50 else 78.0
            )
            db.add(asset)
        await db.commit()
        stmt = select(Asset)
        result = await db.execute(stmt)
        assets = result.scalars().all()

    return assets


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Asset).where(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Asset {asset_id} not found.")
    return asset


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def register_asset(req: AssetCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Asset).where(Asset.id == req.id)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Asset {req.id} already exists.")

    asset = Asset(
        id=req.id,
        name=req.name,
        ip_address=req.ip_address,
        mac_address=req.mac_address,
        asset_type=req.asset_type,
        criticality=req.criticality,
        is_allowlisted=req.is_allowlisted,
        is_monitored=True,
        risk_score=0.0,
        ueba_deviation=0.0
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset
