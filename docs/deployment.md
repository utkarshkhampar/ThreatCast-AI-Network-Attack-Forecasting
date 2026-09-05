# ThreatCast — Production Deployment & Sizing Guide

## 1. Deployment Topologies

ThreatCast supports two primary production deployment architectures:
1. **Single-Node Appliance (Docker Compose)**: For branch offices, isolated testbeds, and air-gapped lab networks (up to 2,500 events/sec).
2. **Cloud-Native Clustered (Kubernetes / EKS / GKE)**: For enterprise SOC environments processing 10,000 to 100,000+ packets/sec with multi-AZ high availability.

---

## 2. Infrastructure Sizing Matrix

| Deployment Tier | Events / Sec (EPS) | CPU Cores | Memory (RAM) | Storage (NVMe) | High Availability |
|---|---|---|---|---|---|
| **Tier 1: Lab / Pilot** | $< 1,000$ | 8 Cores | 16 GB | 250 GB | Standalone Docker |
| **Tier 2: Enterprise Branch** | $1,000 - 10,000$ | 16 Cores | 64 GB | 1 TB | Active-Passive Replica |
| **Tier 3: Global Enterprise** | $> 100,000$ | 64+ Cores | 256 GB | 10+ TB (Tiered) | Multi-AZ K8s Cluster |

---

## 3. Single-Node Quickstart (Docker Compose)
Deploy the full stack with zero external dependencies:

```bash
# Clone repository
git clone https://github.com/utkarshkhampar/ThreatCast-AI-Network-Attack-Forecasting.git
cd ThreatCast-AI-Network-Attack-Forecasting

# Copy and configure environment variables
cp .env.example .env

# Launch all 8 container services in background
docker compose up -d

# Verify service health
docker compose ps
```

### Exposed Endpoints:
- **Web Frontend**: `http://localhost:3000`
- **Backend REST & Docs**: `http://localhost:8000/docs`
- **AI Inference Engine**: `http://localhost:8001/health`
- **Prometheus Metrics**: `http://localhost:9090`
- **Grafana Dashboards**: `http://localhost:3001` (admin / admin)
- **MinIO Object Console**: `http://localhost:9001`
