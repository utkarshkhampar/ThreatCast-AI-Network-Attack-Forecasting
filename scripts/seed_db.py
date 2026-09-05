"""
ThreatCast - Database Seed Script
Populates initial administrative users, assets, baseline profiles, and compliance frameworks.
"""

import asyncio
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.core.security import get_password_hash
from backend.app.models.all_models import User, Asset, ComplianceControlRecord, IncidentRecord


async def seed():
    print("🌱 Initializing ThreatCast database tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        print("👤 Seeding default administrative & analyst accounts...")
        # Admin User
        admin_user = User(
            username="admin",
            email="admin@threatcast.soc",
            hashed_password=get_password_hash("threatcast123"),
            full_name="Lead SOC Administrator",
            role="SUPER_ADMIN",
            is_active=True,
            mfa_enabled=False
        )
        analyst_user = User(
            username="analyst1",
            email="analyst@threatcast.soc",
            hashed_password=get_password_hash("threatcast123"),
            full_name="Senior Incident Responder",
            role="SOC_ADMIN",
            is_active=True,
            mfa_enabled=False
        )
        session.add_all([admin_user, analyst_user])

        print("🖥️  Seeding monitored enterprise assets...")
        assets = [
            Asset(id="AST-GW-01", name="GW-EDGE-01", ip_address="192.168.1.1", asset_type="GATEWAY", criticality="CRITICAL", risk_score=15.0, is_allowlisted=True),
            Asset(id="AST-DC-01", name="DC-CORP-01", ip_address="10.0.0.5", asset_type="SERVER", criticality="CRITICAL", risk_score=22.0, is_allowlisted=True),
            Asset(id="AST-SRV-APP", name="SRV-APP-01", ip_address="10.0.0.10", asset_type="SERVER", criticality="HIGH", risk_score=35.0, is_allowlisted=True),
            Asset(id="AST-SRV-DB", name="SRV-DB-01", ip_address="10.0.0.20", asset_type="SERVER", criticality="CRITICAL", risk_score=18.0, is_allowlisted=True),
            Asset(id="AST-WK-42", name="WKSTN-042", ip_address="192.168.1.45", asset_type="WORKSTATION", criticality="MEDIUM", risk_score=88.5, is_allowlisted=True, ueba_deviation=82.4),
            Asset(id="AST-WK-88", name="WKSTN-088", ip_address="192.168.1.88", asset_type="WORKSTATION", criticality="LOW", risk_score=12.0, is_allowlisted=True)
        ]
        session.add_all(assets)

        print("⚖️  Seeding compliance governance framework controls...")
        controls = [
            ComplianceControlRecord(framework="NIST_CSF", control_id="DE.CM-01", title="Network Traffic Monitoring", status="COMPLIANT"),
            ComplianceControlRecord(framework="NIST_CSF", control_id="RS.AN-03", title="Adverse Progression Forecasting", status="COMPLIANT"),
            ComplianceControlRecord(framework="ISO_27001", control_id="A.8.16", title="Network Activity Monitoring", status="COMPLIANT"),
            ComplianceControlRecord(framework="SOC_2", control_id="CC7.2", title="Anomaly Detection & Evidence Log", status="COMPLIANT")
        ]
        session.add_all(controls)

        await session.commit()
        print("✅ Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
