# ThreatCast — User and Entity Behaviour Analytics (UEBA)

## 1. UEBA Overview & Entity Profiling
The UEBA subsystem (`ueba/baseline_profiler.py`) continuously tracks every internal host, server, and network identity. Rather than inspecting packets in isolation, UEBA maintains historical behavioral baselines for each entity to detect subtle behavioral deviations characteristic of compromised credentials or insider threats.

---

## 2. Statistical Baseline Metrics
Each `EntityProfile` models four core operational dimensions:
1. **Typical Communication Partners**: $\mathcal{P}_{typical} \subset \{\text{IP Addresses}\}$
2. **Typical Protocol & Ports**: $\mathcal{K}_{typical} \subset \{\text{Port Numbers}\}$
3. **Bandwidth Volume Distribution**: Mean $\mu_{bytes}$ and Standard Deviation $\sigma_{bytes}$
4. **Connection Initiation Rate**: Mean $\mu_{rate}$ and Standard Deviation $\sigma_{rate}$

---

## 3. Z-Score Anomaly Scoring Algorithm
When new telemetry is observed for entity $e$, the deviation engine computes:

### 3.1 Peer Novelty Penalty
$$\Delta_{peer} = \min\left(50, \, |\{ip \in \mathcal{P}_{observed} \setminus \mathcal{P}_{typical}\}| \times 15.0\right)$$

### 3.2 Port Novelty Penalty
$$\Delta_{port} = \min\left(30, \, |\{port \in \mathcal{K}_{observed} \setminus \mathcal{K}_{typical}\}| \times 10.0\right)$$

### 3.3 Volume Deviation Z-Score
$$z_{bytes} = \max\left(0, \, \frac{bytes_{obs} - \mu_{bytes}}{\max(\sigma_{bytes}, 1.0)}\right), \quad \Delta_{vol} = \min(40, \, z_{bytes} \times 10.0)$$

### 3.4 Rate Deviation Z-Score
$$z_{rate} = \max\left(0, \, \frac{rate_{obs} - \mu_{rate}}{\max(\sigma_{rate}, 0.5)}\right), \quad \Delta_{rate} = \min(40, \, z_{rate} \times 12.0)$$

### 3.5 Compound Deviation Score
$$\text{Score}(e) = \min\left(100.0, \, \Delta_{peer} + \Delta_{port} + \Delta_{vol} + \Delta_{rate}\right)$$

---

## 4. Anomaly Classification Tiers

| Score Range | Anomaly Tier | System Action |
|---|---|---|
| **0.0 – 24.9** | `LOW` | Normal operational variance; silent baseline update. |
| **25.0 – 49.9** | `MEDIUM` | Minor behavioral drift; logged in entity audit log. |
| **50.0 – 79.9** | `HIGH` | Significant anomaly; node highlighted in Network Graph. |
| **80.0 – 100.0** | `CRITICAL` | Severe deviation; triggers automated Incident ticket creation. |
