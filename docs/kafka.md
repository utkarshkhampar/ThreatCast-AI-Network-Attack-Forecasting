# ThreatCast — Distributed Streaming Architecture (Apache Kafka)

## 1. Event-Driven Pipeline Topology
ThreatCast utilizes Apache Kafka as the high-throughput, fault-tolerant event backbone bridging capture sensors, stream workers, AI inference, and storage subsystems.

```
+---------------+     +---------------+     +---------------+
| Sensor: SPAN  |     | Sensor: eBPF  |     | NetFlow v9    |
+-------+-------+     +-------+-------+     +-------+-------+
        |                     |                     |
        +---------------------+---------------------+
                              |
                     [Raw Event Producers]
                              |
+-----------------------------v-----------------------------+
|                     KAFKA EVENT BROKER                    |
|                                                           |
| 1. threatcast.raw.packets       (Partitions: 12, RF: 3)   |
| 2. threatcast.flows.10s         (Partitions: 8,  RF: 3)   |
| 3. threatcast.state.snapshots   (Partitions: 4,  RF: 3)   |
| 4. threatcast.ai.forecasts      (Partitions: 4,  RF: 3)   |
| 5. threatcast.active.response   (Partitions: 2,  RF: 3)   |
| 6. threatcast.evidence.ledger   (Partitions: 2,  RF: 3)   |
+-----------------------------+-----------------------------+
                              |
        +---------------------+---------------------+
        |                                           |
+-------v-------+                           +-------v-------+
| Stream Worker |                           | AI Inference  |
| Flow Assembly |                           | World Model   |
+---------------+                           +---------------+
```

---

## 2. Topic Catalog & Partitioning Keys

| Topic Name | Key Strategy | Retention | Payload Format | Consumer Group |
|---|---|---|---|---|
| `threatcast.raw.packets` | Hash of `src_ip` | 6 Hours | Protobuf / JSON | `flow-assemblers` |
| `threatcast.flows.10s` | Hash of `5-tuple` | 24 Hours | JSON / Avro | `state-builders` |
| `threatcast.state.snapshots` | Global Cluster ID | 7 Days | JSON | `ai-inference-workers` |
| `threatcast.ai.forecasts` | Target Host IP | 14 Days | JSON | `soc-alert-dispatcher` |
| `threatcast.active.response` | Action Ticket ID | 30 Days | JSON | `response-gatekeeper` |
| `threatcast.evidence.ledger` | Incident Hash | Permanent | JSON | `blockchain-anchors` |

---

## 3. Reliability & Delivery Guarantees
- **Producer Configuration**:
  - `acks=all`: Ensures broker writes to all in-sync replicas (ISR) before acknowledging.
  - `enable.idempotence=true`: Prevents message duplication upon transient network retries.
- **Consumer Commit Semantics**:
  - Manual offset commit executed only after successful state computation or DB persistence.
  - At-least-once delivery guaranteed with deduplication keys on downstream ingestion tables.
