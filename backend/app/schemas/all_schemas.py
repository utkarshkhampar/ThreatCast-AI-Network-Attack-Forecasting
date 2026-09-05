"""
ThreatCast - Pydantic Request & Response Schemas
Provides strict validation, serialization, and OpenAPI documentation types.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    role: str
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str
    mfa_code: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "ANALYST"


class RegisterResponse(BaseModel):
    message: str
    email: str
    username: str
    is_verified: bool
    dev_otp: Optional[str] = None


class SendOtpRequest(BaseModel):
    email: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp_code: str


class VerifyOtpResponse(BaseModel):
    message: str
    is_verified: bool
    token: Optional[Token] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool = False
    mfa_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Asset Schemas
class AssetCreate(BaseModel):
    id: str
    name: str
    ip_address: str
    mac_address: Optional[str] = None
    asset_type: str = "WORKSTATION"
    criticality: str = "MEDIUM"
    is_allowlisted: bool = True


class AssetResponse(BaseModel):
    id: str
    name: str
    ip_address: str
    mac_address: Optional[str] = None
    asset_type: str
    criticality: str
    is_monitored: bool
    is_allowlisted: bool
    risk_score: float
    ueba_deviation: float
    created_at: datetime

    class Config:
        from_attributes = True


# Telemetry Schemas
class TelemetryPacketInput(BaseModel):
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str = "TCP"
    packet_length: int = 64
    ttl: int = 64
    tcp_flags: Dict[str, int] = Field(default_factory=dict)
    window_size: int = 65535


class TelemetryStatsResponse(BaseModel):
    total_packets_ingested: int
    total_flows_active: int
    pps: float
    bps: float
    port_entropy: float
    syn_ratio: float
    active_hosts: int
    status: str


# Forecast & AI Schemas
class ForecastStepSchema(BaseModel):
    step_number: int
    step_label: str
    time_offset_seconds: int
    attack_probability: float
    prob_lower: Optional[float] = None
    prob_upper: Optional[float] = None
    predicted_stage: str
    confidence: float
    uncertainty: float
    confidence_level: str
    affected_hosts_projected: int


class ForecastResponse(BaseModel):
    forecast_id: str
    timestamp: float
    horizon_steps: int
    current_stage: str
    predicted_stage: str
    attack_probability: float
    confidence_score: float
    uncertainty_score: float
    confidence_level: str
    early_warning_lead_time_min: float
    target_asset_id: Optional[str] = None
    steps: List[ForecastStepSchema]


class XaiAttributionFactor(BaseModel):
    feature_key: str
    feature_name: str
    attribution_weight: float
    importance_percentage: float
    observed_value: float
    baseline_value: float
    direction: str


class ExplainabilityResponse(BaseModel):
    forecast_id: str
    predicted_stage: str
    attack_probability: float
    plain_language_summary: str
    top_contributing_factors: List[XaiAttributionFactor]
    model_explainability_method: str


class MitreMappingItem(BaseModel):
    tactic_id: str
    tactic_name: str
    technique_id: str
    technique_name: str
    sub_technique: str
    assessment_statement: str
    confidence_score: float
    is_predicted: bool
    evidence_factors: List[str]
    affected_assets: List[str]


# Incidents
class IncidentCreate(BaseModel):
    incident_title: str
    severity: str = "HIGH"
    forecast_id: Optional[str] = None
    target_asset_id: str
    assigned_analyst: Optional[str] = "analyst1"
    summary: str
    mitre_technique: str = "T1046"
    risk_score: float = 75.0


class IncidentResponse(BaseModel):
    id: str
    incident_title: str
    severity: str
    status: str
    forecast_id: Optional[str]
    target_asset_id: Optional[str]
    assigned_analyst: str
    summary: Optional[str]
    mitre_technique: str
    risk_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# Simulation & Counterfactual
class SimulationRequest(BaseModel):
    target_ip: str
    horizon_steps: int = 5
    interventions: Optional[List[str]] = None


class CounterfactualScenarioItem(BaseModel):
    scenario_id: str
    title: str
    action_type: str
    initial_attack_probability: float
    projected_attack_probability: float
    projected_attack_stage: str
    risk_reduction_percentage: float
    operational_impact: str
    recommendation_rank: int
    trajectory: List[Dict[str, Any]]


class SimulationResponse(BaseModel):
    target_ip: str
    horizon_steps: int
    scenarios: List[CounterfactualScenarioItem]
    best_recommended_intervention: str
    simulation_mode: str


# Active Defence & Response
class DefensiveActionRequest(BaseModel):
    action_type: str  # ISOLATE_ENDPOINT, BLOCK_PORT, REVOKE_SESSION, INCREASE_LOGGING
    target_ip: str
    reason: str
    execution_mode: Optional[str] = "DRY_RUN"  # DRY_RUN, SIMULATION, LIVE
    human_confirmation_token: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class DefensiveActionResponse(BaseModel):
    action_id: str
    action_type: str
    target_ip: str
    status: str
    execution_mode: str
    reason: str
    actor_id: str
    timestamp: str
    output_message: str
    rollback_available: bool = True


# Evidence & Blockchain
class EvidenceCreateRequest(BaseModel):
    forecast_id: str
    target_asset_id: str
    mitre_technique: str
    risk_score: float
    confidence_score: float
    raw_payload: Dict[str, Any]
    incident_id: Optional[str] = None


class EvidenceResponse(BaseModel):
    evidence_id: str
    forecast_id: str
    incident_id: Optional[str] = None
    target_asset_id: str
    evidence_hash: str
    previous_hash: str
    collector_id: str
    mitre_technique: str
    risk_score: float
    confidence_score: float
    off_chain_uri: str
    created_at: str
    integrity_status: str
    custody_log: List[Dict[str, Any]]


class VerifyEvidenceRequest(BaseModel):
    evidence_id: str
    supplied_payload: Optional[Dict[str, Any]] = None
    supplied_hash: Optional[str] = None


class VerifyEvidenceResponse(BaseModel):
    evidence_id: str
    found: bool
    anchored_hash: str
    supplied_hash: str
    match: bool
    verified_at: str
    verifier_id: str
    tamper_detected: bool
    status: str


# System Health & Audit
class SystemHealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    components: Dict[str, Dict[str, Any]]


class AuditLogEntry(BaseModel):
    id: int
    timestamp: datetime
    user_id: str
    action: str
    target: str
    outcome: str
    correlation_id: str
    details: Optional[str] = None

    class Config:
        from_attributes = True
