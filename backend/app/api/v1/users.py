"""
ThreatCast - Users & Role Management API Router
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.all_models import User
from backend.app.schemas.all_schemas import UserResponse

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    stmt = select(User)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users
