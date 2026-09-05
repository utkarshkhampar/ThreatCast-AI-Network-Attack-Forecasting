# ThreatCast — Observability, Metrics & Telemetry Monitoring

## 1. Observability Stack
ThreatCast provides deep telemetry into both infrastructure health and cybersecurity analytics using the standard cloud-native triumvirate:
- **Metrics**: Prometheus scraper pulling from `/metrics` endpoints.
- **Visual Dashboards**: Grafana pre-provisioned dashboards for SOC operations and ML model tracking.
- **Tracing & Logs**: OpenTelemetry instrumentation with structured JSON log output.

---

## 2. Core Prometheus Metrics Catalog

### 2.1 Ingestion Pipeline Metrics
- `threatcast_packets_ingested_total{interface="eth0"}`: Counter of raw packets processed.
- `threatcast_bytes_ingested_total`: Counter of bytes ingested across capture points.
- `threatcast_flows_active_count`: Gauge of currently active bidirectional flows in the sliding window.

### 2.2 AI & World Model Metrics
- `threatcast_forecast_latency_seconds`: Histogram measuring end-to-end forward rollout latency.
- `threatcast_attack_probability{target_ip="10.0.0.42"}`: Gauge tracking latest predicted attack risk.
- `threatcast_model_uncertainty_sigma`: Gauge tracking Monte Carlo rollout dispersion.
- `threatcast_active_stage_count{stage="Lateral Movement"}`: Counter of hosts currently predicted in each stage.

### 2.3 Active Defence & Safety Metrics
- `threatcast_active_actions_total{status="SUCCESS", mode="DRY_RUN"}`: Counter of defensive actions executed.
- `threatcast_kill_switch_state`: Binary gauge ($0 = \text{Normal}, 1 = \text{Kill Switch Triggered}$).
- `threatcast_rollbacks_executed_total`: Counter of automated or manual remediation rollbacks.

---

## 3. Pre-Provisioned Grafana Dashboards
ThreatCast includes two production Grafana dashboards:
1. **Executive SOC Command Dashboard**: Real-time fleet health, active attack horizon alerts, MITRE coverage heatmap.
2. **AI Inference & Data Quality Dashboard**: Model latency histograms, drift detection, Brier calibration curves.
