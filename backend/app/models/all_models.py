"""
ThreatCast - Core Database Models (SQLAlchemy ORM)
Enterprise schema for users, assets, telemetry, forecasts, incidents, evidence, and audit trails.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=True)
    role = Column(String(32), default="ANALYST", nullable=False)  # SUPER_ADMIN, SOC_ADMIN, ANALYST, etc.
    is_active = Column(Boolean, default=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    ip_address = Column(String(45), unique=True, index=True, nullable=False)
    mac_address = Column(String(32), nullable=True)
    asset_type = Column(String(32), default="WORKSTATION")  # SERVER, GATEWAY, WORKSTATION, DB, EXTERNAL
    criticality = Column(String(16), default="MEDIUM")       # CRITICAL, HIGH, MEDIUM, LOW
    is_monitored = Column(Boolean, default=True)
    is_allowlisted = Column(Boolean, default=True)
    risk_score = Column(Float, default=0.0)
    ueba_deviation = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NetworkStateSnapshotRecord(Base):
    __tablename__ = "network_states"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(Float, index=True, nullable=False)
    window_duration = Column(Float, default=10.0)
    active_hosts_count = Column(Integer, default=0)
    active_connections_count = Column(Integer, default=0)
    total_packets = Column(Integer, default=0)
    total_bytes = Column(Integer, default=0)
    packets_per_sec = Column(Float, default=0.0)
    bytes_per_sec = Column(Float, default=0.0)
    unique_ports_count = Column(Integer, default=0)
    port_entropy = Column(Float, default=0.0)
    syn_ratio = Column(Float, default=0.0)
    rst_ratio = Column(Float, default=0.0)
    max_host_fan_out = Column(Integer, default=0)
    state_vector_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ForecastRecord(Base):
    __tablename__ = "forecasts"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(Float, index=True, nullable=False)
    horizon_steps = Column(Integer, default=5)
    current_stage = Column(String(64), default="Normal")
    predicted_stage = Column(String(64), default="Reconnaissance")
    attack_probability = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    uncertainty_score = Column(Float, default=0.0)
    confidence_level = Column(String(16), default="MEDIUM")
    early_warning_seconds = Column(Float, default=252.0)
    target_asset_id = Column(String(64), ForeignKey("assets.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    steps = relationship("ForecastStepRecord", back_populates="forecast", cascade="all, delete-orphan")


class ForecastStepRecord(Base):
    __tablename__ = "forecast_steps"

    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(String(64), ForeignKey("forecasts.id"), index=True, nullable=False)
    step_number = Column(Integer, nullable=False)
    step_label = Column(String(16), nullable=False)
    time_offset_seconds = Column(Integer, default=0)
    attack_probability = Column(Float, default=0.0)
    prob_lower = Column(Float, default=0.0)
    prob_upper = Column(Float, default=0.0)
    predicted_stage = Column(String(64), default="Normal")
    confidence = Column(Float, default=0.0)
    uncertainty = Column(Float, default=0.0)
    confidence_level = Column(String(16), default="MEDIUM")
    affected_hosts_projected = Column(Integer, default=1)

    forecast = relationship("ForecastRecord", back_populates="steps")


class IncidentRecord(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)
    incident_title = Column(String(256), nullable=False)
    severity = Column(String(16), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(32), default="NEW")     # NEW, INVESTIGATING, CONTAINED, CLOSED
    forecast_id = Column(String(64), nullable=True)
    target_asset_id = Column(String(64), ForeignKey("assets.id"), nullable=True)
    assigned_analyst = Column(String(64), default="Unassigned")
    summary = Column(Text, nullable=True)
    mitre_technique = Column(String(64), default="T1046")
    risk_score = Column(Float, default=75.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EvidenceRecordModel(Base):
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), unique=True, index=True, nullable=False)
    forecast_id = Column(String(64), nullable=False)
    incident_id = Column(String(64), nullable=True)
    target_asset_id = Column(String(64), nullable=False)
    evidence_hash = Column(String(64), nullable=False)
    previous_hash = Column(String(64), nullable=False)
    collector_id = Column(String(64), nullable=False)
    mitre_technique = Column(String(64), nullable=False)
    risk_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    off_chain_uri = Column(String(256), nullable=False)
    blockchain_block_number = Column(Integer, default=1)
    blockchain_status = Column(String(32), default="COMMITTED")
    integrity_status = Column(String(32), default="VALID")
    created_at = Column(DateTime, default=datetime.utcnow)


class ResponseActionRecord(Base):
    __tablename__ = "response_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(64), unique=True, index=True, nullable=False)
    action_type = Column(String(64), nullable=False)
    target_ip = Column(String(45), nullable=False)
    execution_mode = Column(String(16), default="DRY_RUN")
    status = Column(String(32), default="DRY_RUN_SIMULATED")
    reason = Column(Text, nullable=False)
    actor_id = Column(String(64), nullable=False)
    output_message = Column(Text, nullable=True)
    rollback_payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)
    target = Column(String(128), nullable=False)
    outcome = Column(String(32), default="SUCCESS")
    correlation_id = Column(String(64), nullable=False)
    details_json = Column(Text, nullable=True)


class ComplianceControlRecord(Base):
    __tablename__ = "compliance_controls"

    id = Column(Integer, primary_key=True, index=True)
    framework = Column(String(32), nullable=False)  # NIST_CSF, ISO_27001, SOC_2, PCI_DSS
    control_id = Column(String(32), nullable=False)
    title = Column(String(256), nullable=False)
    status = Column(String(32), default="COMPLIANT")
    linked_evidence_id = Column(String(64), nullable=True)
    last_verified = Column(DateTime, default=datetime.utcnow)
