# ThreatCast — Controlled Active Defence Response Engine

## 1. Safety-First Philosophy & Guardrails
Active defence without strict safety boundaries poses severe operational risks (e.g., self-inflicted Denial of Service, isolating core domain controllers, or accidental outbound disruption). ThreatCast enforces a multi-layered, fail-safe defense boundary:
- **Default Mode**: `DRY_RUN` is strictly enforced unless explicitly toggled to `LIVE` with high-tier credentials.
- **Strict Defensive Scope**: Active actions are cryptographically blocked from executing against any public Internet CIDR; they operate exclusively within verified RFC 1918 private subnets.
- **Emergency Kill Switch**: A global hardware/software dead-man switch instantly revokes all active containment policies.

---

## 2. The 10-Point Authorization Gatekeeper

Every proposed action must satisfy 10 sequential safety checks before execution:

```
[Defensive Action Request]
          │
          ▼
 1. [Target IP RFC 1918 / Loopback Allow-List Check]  ──Fail──> [ABORT: Out-of-Bounds Target]
          │ Pass
 2. [Global Kill Switch Inactive Check]              ──Fail──> [ABORT: Kill Switch Active]
          │ Pass
 3. [Execution Mode Validation (DRY_RUN by default)] ──Fail──> [ABORT: Invalid Mode]
          │ Pass
 4. [Granular RBAC Check (ADMIN / SECOPS_LEAD)]       ──Fail──> [ABORT: Unauthorized Role]
          │ Pass
 5. [Critical Infrastructure Safeguard (DC / GW)]    ──Fail──> [ABORT: Requires Dual-Key Approval]
          │ Pass
 6. [Anti-Flapping Rate Limiter (< 5 actions/min)]   ──Fail──> [ABORT: Rate Limit Exceeded]
          │ Pass
 7. [Idempotency & Duplicate State Check]            ──Fail──> [ABORT: Rule Already Active]
          │ Pass
 8. [Action Justification Ticket Provided]           ──Fail──> [ABORT: Missing SOC Ticket ID]
          │ Pass
 9. [Automated Rollback Recipe Synthesized]          ──Fail──> [ABORT: Rollback Generation Failed]
          │ Pass
10. [Pre-Execution Merkle Proof Committed]           ──Fail──> [ABORT: Blockchain Logging Failed]
          │ Pass
          ▼
   [DISPATCH TO EXECUTOR]
```

---

## 3. Execution Modules & Rollback

### 3.1 Supported Executors
- `DryRunExecutor`: Simulates rule application, calculates synthetic packet drop counters, logs zero-impact audit trails.
- `LinuxIptablesExecutor`: Idempotently applies Linux `iptables` / `nftables` isolation rules on target endpoints via secure agent.
- `NetworkSwitchExecutor`: Dispatches Netconf / OpenFlow commands to edge switches to reassign switchport VLANs into isolated quarantine segments.

### 3.2 Automated One-Click Rollback
Every execution produces a cryptographic inverse recipe. Reversing a quarantine action executes the exact inverse command with identical safety verification:

```bash
# Forward Action
iptables -I FORWARD -s 192.168.1.45 -j DROP

# Inverse Rollback Recipe
iptables -D FORWARD -s 192.168.1.45 -j DROP
```
