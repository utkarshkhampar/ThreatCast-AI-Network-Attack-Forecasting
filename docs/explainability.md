# ThreatCast — Explainable AI (XAI) Subsystem

## 1. Explainability Objectives in Cybersecurity
Black-box AI predictions are unacceptable in Tier-1/Tier-3 SOC environments where defensive interventions can sever business-critical workloads. ThreatCast guarantees explainability at every inference step:
1. **Mathematical Attribution**: Exact contribution of each telemetry metric to the forecast probability.
2. **Actionable Rationale**: Plain-language explanations readable by both junior analysts and C-suite incident responders.
3. **Calibrated Caution**: Adherence to calibrated, non-assertive intelligence standards ("Observed traffic pattern is consistent with...").

---

## 2. Shapley Feature Attribution (Kernel SHAP)
For model prediction $f(\mathbf{s})$, the marginal contribution $\phi_i$ of feature $i$ is calculated using cooperative game theory:

$$\phi_i(f, \mathbf{s}) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$

where $F = \{1, \dots, 16\}$ is the complete set of network telemetry features.

### 2.1 Top Attributed Telemetry Features
- `port_entropy`: Measures dispersion across destination ports (high during port scans).
- `syn_ratio`: Ratio of SYN packets to total packets (elevated during SYN flood / half-open scans).
- `max_host_fan_out`: Maximum distinct target hosts contacted by a single source (lateral movement).
- `bytes_per_sec`: Bandwidth spike (data exfiltration).
- `conn_rate`: Active connections per second (automated bot/scanner activity).

---

## 3. Human-Readable Translation Engine
The explainer transforms numeric SHAP vectors into structured analyst briefings:

```json
{
  "top_drivers": [
    {
      "feature": "port_entropy",
      "impact": "+0.34",
      "observed_value": "3.84",
      "baseline_mean": "0.45",
      "explanation": "Target port entropy is 8.5x higher than normal baseline, indicating sequential port discovery."
    },
    {
      "feature": "max_host_fan_out",
      "impact": "+0.28",
      "observed_value": "42 hosts",
      "baseline_mean": "3 hosts",
      "explanation": "Host 192.168.1.45 initiated parallel sessions to 42 internal endpoints within 10 seconds."
    }
  ],
  "analyst_summary": "Telemetry indicates elevated port exploration and anomalous lateral fan-out consistent with MITRE ATT&CK T1046 (Network Service Discovery)."
}
```
