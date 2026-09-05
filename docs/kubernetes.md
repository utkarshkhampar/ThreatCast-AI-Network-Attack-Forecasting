# ThreatCast — Kubernetes Architecture & Orchestration

## 1. Kubernetes Cluster Architecture
ThreatCast deploys into the isolated `threatcast` namespace using declarative cloud-native manifests:

```
+-------------------------------------------------------------------+
|                     NAMESPACE: threatcast                         |
|                                                                   |
| [Ingress Controller (NGINX / ALB)] ──TLS Termination (Port 443)   |
|         │                                                         |
|         ├── /api ──> [threatcast-backend Service]                 |
|         │             ├─ Pod replica 1 (HPA 2-10)                 |
|         │             └─ Pod replica 2                            |
|         │                                                         |
|         └── / ────> [threatcast-frontend Service]                |
|                       └─ Pod replica 1, 2 (Nginx SPA)             |
|                                                                   |
| [threatcast-ai-engine] <── Internal ClusterIP (Port 8001)         |
| [PostgreSQL StatefulSet] + [Redis Cluster]                        |
+-------------------------------------------------------------------+
```

---

## 2. Zero-Trust NetworkPolicy Enforcement
Strict `NetworkPolicy` rules prevent lateral pod-to-pod movement:
- Frontend pods can only communicate with the Backend Service on port 8000.
- Backend pods can access PostgreSQL (5432), Redis (6379), and Kafka (9092).
- AI Engine pods only accept gRPC/HTTP traffic from authorized Backend Service pods.
- No pod except the authorized active defence controller has egress access to internal network switches or host NICs.

---

## 3. Horizontal Pod Autoscaling (HPA)
Autoscaling ensures resilience during sudden traffic surges:
- **Backend**: Scales on CPU ($>70\%$) and active HTTP request rate.
- **AI Inference Engine**: Scales based on Kafka lag on `threatcast.state.snapshots`.
- **Stream Ingestion Workers**: Scale with packet ingestion rate.
