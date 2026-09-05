# ThreatCast — Security Architecture & Threat Model

## 1. Defensive Boundary & Safety Guarantees
ThreatCast is engineered strictly as a **Defensive Cybersecurity Platform**. By policy, architectural constraint, and cryptographic enforcement:
- **No Offensive Capabilities**: ThreatCast contains zero offensive attack payloads, exploit modules, or adversarial weaponization tools.
- **CIDR Containment**: Active defense commands are structurally restricted to private subnets (RFC 1918 / Loopback). Any attempt to target public IP spaces fails at the kernel level.
- **Dry-Run Enforcement**: All remediation policies operate in passive simulation mode until approved by authorized SecOps Leads.

---

## 2. STRIDE Threat Model Analysis

| Threat (STRIDE) | Threat Scenario | ThreatCast Countermeasure |
|---|---|---|
| **Spoofing** | Attacker impersonates SOC Analyst or Gateway | OAuth2 JWT verification, MFA enforcement, Mutual TLS between microservices |
| **Tampering** | Attacker alters incident audit log or PCAP file | Forensic evidence anchored to Hyperledger Fabric Merkle ledger |
| **Repudiation** | Analyst denies executing containment action | Cryptographic X.509 signature and immutable audit log entry |
| **Info Disclosure** | Attacker intercepts network telemetry streams | TLS 1.3 in-transit, AES-256-GCM at-rest, packet payload stripping |
| **Denial of Service** | Attacker floods telemetry port or API gateway | Token-bucket rate limiting, eBPF line-rate filtering, Kafka backpressure |
| **Elevation of Priv.** | Tier-1 Analyst triggers live firewall changes | Granular RBAC, role dependencies, dual-authorization keys |

---

## 3. Cryptographic Standards
- **Password Storage**: Direct `bcrypt` with salt rounds $\ge 12$, maximum length bounded to 72 bytes.
- **Session Tokens**: HMAC-SHA256 JWT tokens with 8-hour max lifetime and short-lived refresh cycles.
- **Data In-Transit**: Strict TLS 1.3 cipher suites (`TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`).
- **Data At-Rest**: Full disk encryption via dm-crypt / LUKS and AWS KMS customer-managed keys.
