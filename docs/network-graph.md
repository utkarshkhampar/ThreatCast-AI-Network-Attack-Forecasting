# ThreatCast — Dynamic Temporal Graph Engine

## 1. Mathematical Graph Formulation
Network interactions at discrete time window $t$ are modeled as an attributed, directed temporal multigraph:

$$\mathcal{G}_t = (\mathcal{V}_t, \mathcal{E}_t)$$

where:
- $\mathcal{V}_t = \{v_i\}$ is the set of network entities observed up to time $t$.
- $\mathcal{E}_t = \{e_{ij} = (v_i, v_j, p, k)\}$ represents directed communication flows from host $v_i$ to host $v_j$ over protocol $p$ on destination port $k$.

---

## 2. Attributed Node & Edge Schema

### 2.1 Node Attributes ($\mathbf{x}_{v}$)
Each node $v \in \mathcal{V}_t$ maintains a multi-dimensional state vector:
- **Identity**: IP address, FQDN hostname, asset classification (`GATEWAY`, `SERVER`, `WORKSTATION`, `CLOUD`, `EXTERNAL`).
- **Criticality Tier**: `CRITICAL` (DC/Database), `HIGH` (Core API/App Server), `MEDIUM` (General Workstations), `LOW` (IoT/Guest).
- **Graph Topology**: Degree $d(v)$, In-degree (fan-in), Out-degree (fan-out).
- **Traffic Volume**: Cumulative bytes, packet volume, flow counts.
- **Risk Metrics**: Anomaly score $[0, 1]$, UEBA deviation $[0, 100]$, compound risk score $[0, 100]$.

### 2.2 Edge Attributes ($\mathbf{e}_{ij}$)
Each edge $e \in \mathcal{E}_t$ contains:
- Layer 4 Protocol (`TCP`, `UDP`, `ICMP`) and Destination Port.
- Forward and backward byte volume and packet counter.
- SYN flag count and half-open connection ratio.
- Threat score and edge anomaly probability.

---

## 3. Lateral Blast Radius Algorithm
When a host $v_{root}$ is suspected or flagged as compromised, ThreatCast computes its projected multi-hop blast radius using a distance-decayed breadth-first graph traversal:

```python
def calculate_blast_radius(graph, root_node, max_hops=2):
    visited = {root_node}
    current_frontier = {root_node}
    cumulative_risk = 0.0
    impacted_nodes = []

    for hop in range(1, max_hops + 1):
        next_frontier = set()
        for u in current_frontier:
            for v in graph.adjacency.get(u, set()):
                if v not in visited:
                    visited.add(v)
                    next_frontier.add(v)
                    crit_weight = get_criticality_weight(v.criticality)
                    decay = 1.0 / hop
                    risk_contrib = crit_weight * 25.0 * decay
                    cumulative_risk += risk_contrib
                    impacted_nodes.append((v, hop, risk_contrib))
        current_frontier = next_frontier

    return {
        "blast_score": min(100.0, cumulative_risk),
        "impacted_nodes": impacted_nodes
    }
```

Criticality weighting:
- `CRITICAL`: $3.0\times$
- `HIGH`: $2.0\times$
- `MEDIUM`: $1.0\times$
- `LOW`: $0.5\times$

---

## 4. Cytoscape.js Frontend Serialization
Graphs serialize to standard Cytoscape elements via `to_cytoscape_elements()`, rendering nodes styled by asset type and criticality color, with edge thickness scaled to communication volume and colorized by threat score.
