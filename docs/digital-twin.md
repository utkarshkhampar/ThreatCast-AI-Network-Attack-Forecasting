# ThreatCast — Cyber Digital Twin Architecture

## 1. Digital Twin Overview
The ThreatCast Cyber Digital Twin is an in-memory, real-time mirror of the protected organization's network topology, communication states, and security posture. It maintains continuous state synchronization with physical and virtual infrastructure while providing an isolated sandbox for testing defender countermeasures.

```
+--------------------------+          +--------------------------+
|  PHYSICAL INFRASTRUCTURE |          |    CYBER DIGITAL TWIN    |
|                          |          |                          |
| [Core Routers & Switches]|          | [In-Memory Graph G_t]    |
| [Workstations & Servers] | ──Mirror─> [Entity Baselines & UEBA]|
| [Cloud Kubernetes Nodes] |          | [Latent World Model Z_t] |
+--------------------------+          +------------+-------------+
                                                   |
                                       +-----------v-----------+
                                       | Counterfactual Policy |
                                       |       Sandbox         |
                                       +-----------------------+
```

---

## 2. State Synchronization & Fidelity Bounds
- **Temporal Resolution**: State updates are committed every $\Delta t = 10\text{s}$ sliding window.
- **Topology Tracking**: Dynamic graph updates node connectivity and flow bandwidth at millisecond granularity.
- **State Fidelity Metric**: Quantifies alignment between physical telemetry and twin representation:
  $$\mathcal{F}(t) = 1 - \frac{\|\mathbf{s}_{physical}(t) - \mathbf{s}_{twin}(t)\|_2}{\|\mathbf{s}_{physical}(t)\|_2 + \epsilon}$$
  ThreatCast maintains $\mathcal{F}(t) > 0.98$ under standard operational traffic loads.

---

## 3. Sandboxed Policy Interventions
The Digital Twin decouples evaluation from operational reality:
1. When an active defence intervention is considered (e.g., isolating a domain controller), the intervention is applied strictly inside the twin graph.
2. The Latent World Model is rolled forward $K$ steps to predict downstream impacts (e.g., whether benign services like DNS or Active Directory authentication would be impaired).
3. Operational impact scores (`LOW`, `MEDIUM`, `HIGH`) and risk reduction percentages are presented to the SecOps lead before any live firewall or switch rule is executed.
