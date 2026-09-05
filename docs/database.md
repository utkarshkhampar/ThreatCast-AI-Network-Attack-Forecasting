# ThreatCast — Database Architecture & Schema Design

## 1. Storage Engine Architecture
ThreatCast supports a tiered, polyglot storage architecture:
- **Relational Metadata Store**: PostgreSQL 16 (production) / SQLite (zero-dependency local development via `aiosqlite`).
- **Distributed In-Memory Cache**: Redis 7 Cluster (transient session states, active WebSocket subscriptions, rate limits).
- **Time-Series / Object Store**: MinIO / S3 (raw PCAP captures, flow archives, ML checkpoints).

---

## 2. Relational Schema & Entity-Relationship Model

```
               +-------------------+
               |       users       |
               +-------------------+
               | id (PK)           |
               | email (UQ)        |
               | role              |
               +---------+---------+
                         | 1
                         |
                         | N
+-------------------+    |    +-------------------+
|      assets       |    |    |     audit_logs    |
+-------------------+    |    +-------------------+
| id (PK)           |    |    | id (PK)           |
| ip_address (UQ)   |    |    | actor_user_id(FK) |
| hostname          |    |    | action_type       |
| criticality       |    |    | timestamp (IDX)   |
| risk_score        |    |    +-------------------+
+---------+---------+    |
          | 1            |
          |              |
          | N            | N
+---------v---------+    |    +-------------------+
|     incidents     |<---+----+  response_actions |
+-------------------+         +-------------------+
| id (PK)           |         | id (PK)           |
| asset_id (FK)     |         | incident_id (FK)  |
| severity          |         | action_type       |
| predicted_stage   |         | execution_mode    |
| attack_prob       |         | status            |
+---------+---------+         +---------+---------+
          | 1                           | 1
          |                             |
          | N                           | 1
+---------v---------+         +---------v---------+
| evidence_records  |         |  blockchain_txs   |
+-------------------+         +-------------------+
| id (PK)           |         | id (PK)           |
| incident_id (FK)  |         | evidence_hash(UQ) |
| sha256_hash       |         | block_number      |
| merkle_root       |         | transaction_id    |
+-------------------+         +-------------------+
```

---

## 3. High-Performance Indexing Strategy
To support sub-millisecond query latencies in high-event SOC environments:
1. **Time-Series Lookups**: `CREATE INDEX idx_incidents_created_at ON incidents (created_at DESC);`
2. **Entity Traversal**: `CREATE INDEX idx_assets_ip_criticality ON assets (ip_address, criticality);`
3. **Audit Trail**: `CREATE INDEX idx_audit_user_time ON audit_logs (actor_user_id, timestamp DESC);`
4. **Evidence Chain Integrity**: `CREATE UNIQUE INDEX idx_evidence_hash ON evidence_records (sha256_hash);`

---

## 4. Partitioning & Retention Strategy
For high-volume production deployments:
- **Telemetry Snapshots**: Partitioned by week (`PARTITION BY RANGE (timestamp)`).
- **Data Retention**:
  - Hot tier (PostgreSQL/SSD): 90 days of granular flows and state vectors.
  - Warm tier (Compressed Parquet / S3): 1 year of aggregated hourly states.
  - Cold tier (Immutable WORM S3): 7 years of blockchain-anchored evidence hashes for compliance (SOC 2, ISO 27001).
