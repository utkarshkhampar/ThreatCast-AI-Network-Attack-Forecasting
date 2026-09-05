# ThreatCast — Packet Processing & Feature Extraction

## 1. Deep Packet Feature Inspection
The packet parsing engine (`ingestion/packet_parser.py`) performs fast zero-copy header decoding across standard network layers:

| Layer | Protocol | Extracted Metadata Fields |
|---|---|---|
| **Layer 2 (Data Link)** | Ethernet II / 802.1Q | MAC Source/Destination, 802.1Q VLAN Tag |
| **Layer 3 (Network)** | IPv4 / IPv6 | Source IP, Destination IP, TTL, Header Length, Total Length, IP Flags (DF, MF) |
| **Layer 4 (Transport)** | TCP | Source Port, Destination Port, Seq/Ack Number, Window Size, Flags (SYN, ACK, FIN, RST, PSH, URG) |
| **Layer 4 (Transport)** | UDP | Source Port, Destination Port, Length, Checksum |
| **Layer 4 (Control)** | ICMP | Type, Code (Echo Request, Echo Reply, Unreachable) |
| **Layer 7 (Application)** | DNS / HTTP / TLS | SNI Server Name, Query Domain, Entropy of Payload |

---

## 2. Statistical Anomaly & Feature Indicators

### 2.1 Shannon Port Entropy
Measures dispersion of target destination ports contacted by a source host:

$$H_{ports} = -\sum_{i=1}^{M} p(port_i) \log_2 p(port_i)$$

- Normal administrative host: $H_{ports} \approx 0.1 - 0.5$ (concentrated on 80, 443, 53).
- Active horizontal port scanner: $H_{ports} > 3.0$ (uniform distribution across thousands of ports).

### 2.2 TCP Flag Anomaly Ratios
- **SYN Ratio**: $R_{SYN} = \frac{\text{Count}(SYN)}{\text{Total Packets}}$
  - Elevated $R_{SYN} > 0.60$ without matching $ACK$ signals SYN flood or stealth half-open scanning.
- **RST Ratio**: $R_{RST} = \frac{\text{Count}(RST)}{\text{Total Packets}}$
  - High $R_{RST}$ indicates rejected connections on closed ports during reconnaissance.

---

## 3. Kernel-Level eBPF/XDP Pre-filtering
For multi-gigabit environments:
- eBPF programs attached to the `xdp` or `tc` hook reject unmonitored non-IP traffic at the NIC driver layer.
- Flow statistics (packet counter, byte counter, flag bitmasks) are updated directly in eBPF BPF_MAP_TYPE_PERCPU_HASH maps and read into userspace via ring buffers, avoiding costly context switches.
