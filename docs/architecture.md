# ThreatCast — System Architecture Specification

## 1. Architectural Overview & Philosophy
ThreatCast is an enterprise-grade, proactive Cyber Defence and Attack Forecasting Platform built upon a **Hierarchical Multimodal Temporal Graph World Model**. Rather than operating reactively on historical alerts or static heuristic rules, ThreatCast models the entire protected cyber environment as an evolving, attributed dynamic graph:

$$\mathcal{G}_t = (\mathcal{V}_t, \mathcal{E}_t)$$

where $\mathcal{V}_t$ represents physical and logical entities (workstations, servers, gateways, domain controllers, cloud workloads) enriched with behavioral and vulnerability embeddings, and $\mathcal{E}_t$ represents network communication flows, sessions, and protocol transactions.

By encoding graph snapshots and statistical macro-vectors into a continuous latent space:

$$\mathbf{z}_t = f_\theta(\mathcal{G}_t, \mathbf{s}_t)$$

ThreatCast learns the latent transition dynamics:

$$\mathcal{P}_\phi(\mathbf{z}_{t+1} \mid \mathbf{z}_t, \mathbf{a}_t)$$

enabling recursive forward rollouts $K$ steps into the future. This architecture enables SOC analysts to anticipate attacker lateral movements, privilege escalations, and exfiltration attempts before compromise culminates.

---

## 2. End-to-End System Topology (C4 Architecture)

```
+-----------------------------------------------------------------------------------+
|                                 PRESENTATION LAYER                                |
|  React 19 + TypeScript + Vite + Tailwind CSS + Lucide + Cytoscape + Recharts      |
|  - Real-Time Topology Canvas (Cytoscape.js WebGL/Canvas)                          |
|  - Multi-Step Forward Attack Trajectory Visualizer (t, t+1, ..., t+K)             |
|  - What-If Intervention Simulator (Counterfactual Policy Sandbox)                |
|  - Human-in-the-Loop Active Defence Authorization Modal                           |
|  - Cryptographic Evidence Ledger & Merkle Explorer                                |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
+------------------------------------------v----------------------------------------+
|                               API GATEWAY & BACKEND                               |
|  FastAPI (Python 3.9+) Async ASGI Server + Uvicorn Workers                        |
|  - OAuth2 Password Bearer / JWT / HMAC-SHA256 Token Verification                  |
|  - Granular Role-Based Access Control (Admin, SecOps, Tier3, Tier1, Auditor)      |
|  - 20 REST API Endpoints (/api/v1/*)                                              |
|  - Duplex WebSocket Ingestion & Push Notification Engine                          |
+---------------------+-------------------------------+-----------------------------+
                      |                               |
        +-------------v-------------+   +-------------v-------------+
        |   PERSISTENCE & CACHE     |   |   DISTRIBUTED STREAMING   |
        |  PostgreSQL 16 (AsyncPG)  |   |   Apache Kafka 3.6+       |
        |  SQLAlchemy 2.0 ORM       |   |   - pcap-raw-stream       |
        |  Redis 7 Cluster (Pub/Sub)|   |   - network-flows-10s     |
        |  MinIO / S3 Object Store  |   |   - state-snapshots-10s   |
        +---------------------------+   +-------------+-------------+
                                                      |
+-----------------------------------------------------v-----------------------------+
|                             ANALYTICS & INFERENCE PIPELINE                        |
|  1. Packet Parser & Flow Aggregator (Scapy / NetFlow v9 / IPFIX)                  |
|  2. 16-Dimensional Network State Vector Builder (Entropy, SYN/RST ratios)         |
|  3. Attributed Temporal Graph Engine (NetworkX / Cytoscape JSON)                  |
|  4. Latent World Model (Encoder, Transition Dynamics, Uncertainty Heads)         |
|  5. Explainable AI Engine (Kernel SHAP Feature Attributions)                      |
|  6. MITRE ATT&CK v14 Ontology Matcher (Calibrated Non-Assertive Mapping)           |
|  7. UEBA Statistical Baseline Profiler (Z-Score Peer / Port Novelty)              |
|  8. Cyber Digital Twin & Counterfactual Simulator                                 |
+-----------------------------------------------------+-----------------------------+
                                                      |
+-----------------------------------------------------v-----------------------------+
|                                  TRUST & EXECUTION                                |
|  - Active Defence Gatekeeper (10-Point Safety Gate, CIDR Allow-Listing, Rollback)  |
|  - Blockchain Audit Layer (Hyperledger Fabric v2.5 / Merkle Ledger Fallback)      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Flow Specification

1. **Ingestion**: Raw network telemetry arrives via SPAN/TAP mirror ports or eBPF probes. The `PacketParser` decodes Layer 2 through Layer 7 headers, extracting timestamp, source/destination IP, ports, protocol, payload sizes, TCP control flags, and inter-arrival times (IAT).
2. **Flow Aggregation**: The `FlowExtractor` aggregates packet records into 5-tuple bidirectional flows over 10-second sliding windows.
3. **State Engineering**: The `StateBuilder` synthesizes micro-flow metrics into a 16-dimensional canonical macro-state vector $\mathbf{s}_t$, computing Shannon port entropy, SYN/RST anomaly ratios, connection rates, and fan-out dynamics.
4. **Graph Construction**: The `TemporalGraph` engine synchronizes network entities into node records $\mathcal{V}_t$ (enriched with criticality, asset type, and UEBA anomaly scores) and communication transactions into directed edges $\mathcal{E}_t$.
5. **Latent Projection**: The World Model encoder projects $\mathbf{s}_t$ into continuous latent space $\mathbf{z}_t \in \mathbb{R}^8$.
6. **Probabilistic Forward Rollout**: The transition model computes recursive rollouts $\mathbf{z}_{t+k} = \mathbf{T}(\mathbf{z}_{t+k-1})$, deriving stage classification probabilities, uncertainty estimates (Monte Carlo variance), and blast radii.
7. **Explainability & MITRE Grounding**: SHAP feature attribution identifies top drivers of predicted escalations, mapping observable telemetry to MITRE ATT&CK v14 tactics/techniques.
8. **Intervention Simulation**: The Counterfactual Simulator tests hypothetical defender interventions (host isolation, port blocking, micro-segmentation) in the Digital Twin without physical network disruption.
9. **Controlled Response & Blockchain Audit**: Approved defensive actions pass the 10-point authorization gatekeeper, execute in dry-run or live mode against verified internal CIDRs, and cryptographically commit immutable custody records to Hyperledger Fabric.

---

## 4. Key Subsystem Boundaries

| Subsystem | Primary Responsibilities | Communication Protocols | Fault Domain |
|---|---|---|---|
| **Frontend** | Interactive visual analysis, topology inspection, simulation workbench | HTTP/1.1, HTTP/2, WSS | Client Browser Isolated |
| **API Gateway** | Authentication, rate limiting, request validation, route dispatching | REST, JSON, JWT | Stateless Cluster (HPA) |
| **Stream Ingestion** | High-throughput packet ingestion, flow assembly, state vectorization | Kafka, gRPC, TCP | Partitioned Workers |
| **Graph Engine** | Dynamic topology maintenance, adjacency tracking, hop-decay blast radius | In-memory, Redis cache | Isolated State Service |
| **AI Inference** | Latent world model rollout, Monte Carlo uncertainty, baseline benchmark | Async Python, PyTorch/NumPy | GPU/CPU compute nodes |
| **Active Defence** | Safety validation, policy evaluation, idempotent network execution | SSH, Netconf, iptables, API | Air-gapped Gatekeeper |
| **Blockchain** | Tamper-proof evidence anchoring, chain-of-custody logging | gRPC, Go Chaincode | Consensus Consortium |
