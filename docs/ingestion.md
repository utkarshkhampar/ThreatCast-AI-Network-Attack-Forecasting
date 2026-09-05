# ThreatCast — Network Telemetry Ingestion Pipeline

## 1. Ingestion Subsystem Architecture
The ThreatCast ingestion subsystem converts unformatted Layer 2–7 raw network traffic into structured, bidirectional flows and sliding temporal snapshots.

```
+-------------------------------------------------------------------+
|                        TELEMETRY INGESTION                        |
|                                                                   |
| [Physical SPAN]  [eBPF Kernel Probes]  [NetFlow / IPFIX]  [PCAP]  |
+---------+------------------+-------------------+------------+----+
          |                  |                   |            |
          +------------------+---------+---------+------------+
                                       |
                             +---------v---------+
                             |   Packet Parser   |
                             |  Feature Extract  |
                             +---------+---------+
                                       |
                                       v
                             +-------------------+
                             |   Flow Extractor  |
                             |  10-Second Window |
                             +---------+---------+
                                       |
                                       v
                             +-------------------+
                             |   State Builder   |
                             |  16-D Macro Vector|
                             +-------------------+
```

---

## 2. Ingestion Modes

### 2.1 Live Network Capture (eBPF / AF_PACKET)
- Direct kernel-space packet ring buffer (`TPACKET_V3`) minimizing userspace copy overhead.
- Ingests headers without payload data to maintain zero-trust data privacy compliance.

### 2.2 Standard PCAP / PCAPNG Ingestion
- Ingests offline capture files for forensic re-play and model validation.
- Implemented in `ingestion/packet_parser.py` using Scapy-compatible layer extraction.

### 2.3 Synthetic Multi-Stage Attack Replay
- Implemented in `ingestion/synthetic_replay.py` for reproducible evaluation and CI/CD demonstration.
- Replays a realistic 5-stage APT attack scenario:
  1. **Stage 1 (Reconnaissance)**: Port scan across internal subnets (T1595).
  2. **Stage 2 (Initial Access)**: Exploitation attempts against vulnerable web services (T1190).
  3. **Stage 3 (Discovery)**: Internal host and service enumeration (T1046).
  4. **Stage 4 (Lateral Movement)**: SMB/RDP credential abuse and pivoting (T1021).
  5. **Stage 5 (Exfiltration)**: High-bandwidth outbound exfiltration to external C2 (T1041).

---

## 3. Sliding Window Flow Aggregation
Packets sharing the same bidirectional 5-tuple:

$$(IP_{src}, IP_{dst}, Port_{src}, Port_{dst}, Protocol)$$

are merged over $T_{window} = 10\text{s}$ intervals. The flow extractor computes:
- Forward & backward packet counts
- Forward & backward byte volumes
- TCP flag distributions (SYN, ACK, RST, FIN, PSH)
- Mean and variance of inter-arrival time (IAT)
- Duration and session termination states
