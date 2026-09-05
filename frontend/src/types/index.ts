export interface ForecastStep {
  step_number: number;
  step_label: string;
  time_offset_seconds: number;
  attack_probability: number;
  prob_lower?: number;
  prob_upper?: number;
  predicted_stage: string;
  confidence: number;
  uncertainty: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  affected_hosts_projected: number;
}

export interface ForecastData {
  forecast_id: string;
  timestamp: number;
  horizon_steps: number;
  current_stage: string;
  predicted_stage: string;
  attack_probability: number;
  confidence_score: number;
  uncertainty_score: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  early_warning_lead_time_min: number;
  target_asset_id: string;
  steps: ForecastStep[];
}

export interface XaiAttributionFactor {
  feature_key: string;
  feature_name: string;
  attribution_weight: number;
  importance_percentage: number;
  observed_value: number;
  baseline_value: number;
  direction: string;
}

export interface ExplainabilityData {
  forecast_id: string;
  predicted_stage: string;
  attack_probability: number;
  plain_language_summary: string;
  top_contributing_factors: XaiAttributionFactor[];
  model_explainability_method: string;
}

export interface MitreTechniqueMatch {
  tactic_id: string;
  tactic_name: string;
  technique_id: string;
  technique_name: string;
  sub_technique: string;
  assessment_statement: string;
  confidence_score: number;
  is_predicted: boolean;
  evidence_factors: string[];
  affected_assets: string[];
}

export interface Asset {
  id: string;
  name: string;
  ip_address: string;
  mac_address?: string;
  asset_type: 'GATEWAY' | 'SERVER' | 'WORKSTATION' | 'EXTERNAL' | 'DATABASE';
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  is_monitored: boolean;
  is_allowlisted: boolean;
  risk_score: number;
  ueba_deviation: number;
  created_at: string;
}

export interface Incident {
  id: string;
  incident_title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NEW' | 'INVESTIGATING' | 'CONTAINED' | 'CLOSED';
  forecast_id?: string;
  target_asset_id?: string;
  assigned_analyst: string;
  summary: string;
  mitre_technique: string;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface CounterfactualScenario {
  scenario_id: string;
  title: string;
  action_type: string;
  initial_attack_probability: number;
  projected_attack_probability: number;
  projected_attack_stage: string;
  risk_reduction_percentage: number;
  operational_impact: string;
  recommendation_rank: number;
  trajectory: ForecastStep[];
}

export interface DefensiveActionRecord {
  action_id: string;
  action_type: string;
  target_ip: string;
  status: string;
  execution_mode: string;
  reason: string;
  actor_id: string;
  timestamp: string;
  output_message: string;
  rollback_available: boolean;
}

export interface BlockchainBlock {
  block_number: number;
  block_hash: string;
  previous_hash: string;
  merkle_root: string;
  timestamp: number;
  transaction_count: number;
  transactions: any[];
}

export interface TelemetryStats {
  total_packets_ingested: number;
  total_flows_active: number;
  pps: number;
  bps: number;
  port_entropy: number;
  syn_ratio: number;
  active_hosts: number;
  status: string;
}

export interface FlowRecord {
  src_ip: string;
  dst_ip: string;
  protocol: string;
  dst_port: number;
  bytes: number;
  timestamp: number;
  is_syn_scan?: boolean;
}
