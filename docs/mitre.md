# ThreatCast — MITRE ATT&CK v14 Taxonomy & Detection Mapping

## 1. Threat Taxonomy Standard
ThreatCast integrates an offline, zero-dependency embedded database of the **MITRE ATT&CK Enterprise Matrix (v14)**. Rather than relying on rigid static signatures, ThreatCast correlates multi-dimensional network features and predicted attack stages with ATT&CK tactics and techniques.

---

## 2. Supported Tactics & Primary Mappings

| Tactic ID | Tactic Name | Technique ID | Technique Name | Network Observable Indicator |
|---|---|---|---|---|
| **TA0043** | Reconnaissance | **T1595** | Active Scanning | Port entropy $>2.5$, high SYN/ACK ratio |
| **TA0001** | Initial Access | **T1190** | Exploit Public App | Unusual payload entropy, HTTP/HTTPS POST spikes |
| **TA0007** | Discovery | **T1046** | Network Service Discovery | Sequential internal port sweeps (445, 139, 3389, 22) |
| **TA0008** | Lateral Movement | **T1021** | Remote Services | New internal SMB/RDP flows between workstations |
| **TA0011** | Command & Control | **T1071** | App Layer Protocol | Low-jitter periodic beaconing to untrusted external IP |
| **TA0010** | Exfiltration | **T1041** | Exfiltration Over C2 | Asymmetric outbound byte ratio, sustained high volume |

---

## 3. Calibrated Non-Assertive Confidence Scoring
In compliance with intelligence standards (ODNI ICD 203), ThreatCast generates evidence-linked assessments with calibrated confidence:

$$\text{Confidence} = \min\left(0.95, \, 0.50 + \text{attack\_prob} \times 0.45\right)$$

### Output Schema:
```json
{
  "tactic_id": "TA0008",
  "tactic_name": "Lateral Movement",
  "technique_id": "T1021.002",
  "technique_name": "Remote Services: SMB/Windows Admin Shares",
  "confidence_score": 0.88,
  "assessment_statement": "Observed internal telemetry is consistent with Remote Services (T1021.002).",
  "evidence_factors": [
    "New SMB port 445 connection from non-admin workstation 192.168.1.45 to database server 10.0.0.20",
    "Predicted trajectory indicates 91% probability of lateral movement continuation"
  ]
}
```
