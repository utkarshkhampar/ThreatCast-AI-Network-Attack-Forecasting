"""
ThreatCast - Async Database Engine & Session Management
Provides SQLAlchemy 2.0 async sessions, connection pooling, and table creation.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings

# Configure engine with connection pooling
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from sqlalchemy import text


async def init_db():
    """Initializes all database tables on application startup and ensures schema alignment."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Seamless SQLite schema migrations for new columns
        for col_def in [
            "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN otp_code VARCHAR(16)",
            "ALTER TABLE users ADD COLUMN otp_expires_at DATETIME",
            "ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(64)",
            "ALTER TABLE users ADD COLUMN last_login_device VARCHAR(256)",
            "ALTER TABLE users ADD COLUMN last_active_at DATETIME"
        ]:
            try:
                await conn.execute(text(col_def))
            except Exception:
                pass

    # Ensure root admin user is seeded with SUPER_ADMIN clearance
    try:
        from datetime import datetime
        from backend.app.core.security import get_password_hash
        from backend.app.models.all_models import User
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            stmt = select(User).where((User.username == "admin") | (User.email == "admin@threatcast.soc"))
            res = await session.execute(stmt)
            admin_user = res.scalars().first()
            if not admin_user:
                admin_user = User(
                    username="admin",
                    email="admin@threatcast.soc",
                    hashed_password=get_password_hash("threatcast123"),
                    full_name="Lead SOC Administrator",
                    role="SUPER_ADMIN",
                    is_active=True,
                    is_verified=True,
                    last_login_ip="127.0.0.1",
                    last_login_device="SOC Terminal",
                    last_active_at=datetime.utcnow()
                )
                session.add(admin_user)
                await session.commit()
    except Exception:
        pass
