"""
ThreatCast - Core Application Configuration
Loads environment variables, defines defaults, and handles settings validation.
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "ThreatCast"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security & Tokens
    SECRET_KEY: str = "threatcast-super-secret-production-quality-hex-key-replace-in-prod-0928340192384"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for dev convenience
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email & OTP Settings
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "auth@threatcast.soc")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "ThreatCast SOC Security")
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
    ALLOW_TEST_OTP_ECHO: bool = os.getenv("ALLOW_TEST_OTP_ECHO", "true").lower() == "true"

    # Database
    # Use SQLite async by default for seamless single-command zero-config local run,
    # or PostgreSQL when DATABASE_URL is set in .env
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./threatcast.db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Kafka
    KAFKA_BROKERS: str = os.getenv("KAFKA_BROKERS", "localhost:9092")

    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")

    # Active Defence Guardrails
    ACTIVE_DEFENCE_ENABLED: bool = True
    ACTIVE_DEFENCE_MODE: str = os.getenv("ACTIVE_DEFENCE_MODE", "DRY_RUN")
    KILL_SWITCH_ENGAGED: bool = False
    AUTHORIZED_TARGET_CIDRS: str = os.getenv(
        "AUTHORIZED_TARGET_CIDRS",
        "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1/32"
    )

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
