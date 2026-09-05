# ThreatCast — Counterfactual "What-If" Simulation Engine

## 1. Counterfactual Analysis in Cybersecurity
When an adversary compromises an internal machine, security operators face critical trade-offs:
- *Immediate host isolation* halts malware spread but may sever executive communications or transactional databases.
- *Passive monitoring* preserves uptime but risks enterprise-wide ransomware encryption.

ThreatCast resolves this dilemma via **Parallel Counterfactual Rollouts** in the Cyber Digital Twin, mathematically evaluating what would happen if different defender policies were applied.

---

## 2. Supported Intervention Scenarios

```
                       ┌───────────────────────┐
                       │  Current State S_t    │
                       └───────────┬───────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
   [Scenario A]              [Scenario B]              [Scenario C]
   No Intervention           Isolate Endpoint          Block Port (445)
   P(Attack) = 0.94          P(Attack) = 0.12          P(Attack) = 0.45
   Risk Reduction = 0%       Risk Reduction = 87.2%    Risk Reduction = 52.1%
   Op Impact = NONE          Op Impact = LOW           Op Impact = MEDIUM
```

### 2.1 Mathematical State Alteration Functions
1. **Host Isolation ($\mathbf{a}_{iso}$)**:
   Drops target host connection rate by 80%, sets active fan-out to 0, and eliminates SYN probing.
2. **Port Block ($\mathbf{a}_{port}$)**:
   Filters traffic on sensitive ports (445, 3389), reducing port diversity and port entropy by 50–60%.
3. **Subnet Micro-Segmentation ($\mathbf{a}_{seg}$)**:
   Restricts inter-VLAN routing, bounding maximum fan-out strictly to authorized gateway IP.

---

## 3. Risk Reduction & Recommendation Ranking
For each candidate scenario $s$, the simulation engine computes:

$$\text{RiskReduction}(s) = \max\left(0, \, \frac{P_{baseline}(t+K) - P_s(t+K)}{P_{baseline}(t+K)} \times 100\%\right)$$

The engine ranks candidate policies based on maximal risk reduction balanced against operational disruption score:

$$\text{Utility}(s) = \text{RiskReduction}(s) - \lambda_{impact} \cdot \text{DisruptionPenalty}(s)$$
