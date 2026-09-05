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
            "ALTER TABLE users ADD COLUMN otp_expires_at DATETIME"
        ]:
            try:
                await conn.execute(text(col_def))
            except Exception:
                pass
