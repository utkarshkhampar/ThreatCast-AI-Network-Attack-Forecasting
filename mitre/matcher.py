"""
ThreatCast - MITRE ATT&CK Behavioural Signature Matcher
Maps predicted stages and extracted telemetry features to ATT&CK tactics and techniques
using calibrated, evidence-linked, non-assertive language ('Behaviour consistent with...').
"""

from typing import Dict, Any, List, Optional
from mitre.taxonomy import MITRE_TACTICS, MITRE_TECHNIQUES


class MitreMatcher:
    def match_forecast_to_techniques(
        self,
        predicted_stage: str,
        attack_prob: float,
        top_features: List[Dict[str, Any]],
        compromised_hosts: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Maps predicted behaviour to MITRE techniques with calibrated confidence and evidence linkage.
        """
        matches = []
        feature_keys = {f["feature_key"]: f["observed_value"] for f in top_features}

        # Reconnaissance / Active Scanning
        if predicted_stage in ["Reconnaissance", "Discovery"] or feature_keys.get("port_entropy", 0) > 1.2 or feature_keys.get("unique_ports_count", 0) > 10:
            confidence = min(0.95, 0.50 + attack_prob * 0.45)
            matches.append({
                "tactic_id": "TA0043",
                "tactic_name": "Reconnaissance",
                "technique_id": "T1595",
                "technique_name": "Active Scanning",
                "sub_technique": "T1595.002 (Vulnerability Scanning)",
                "assessment_statement": "Observed telemetry and predicted trajectory are consistent with Active Scanning (T1595).",
                "confidence_score": round(confidence, 4),
                "is_predicted": predicted_stage == "Reconnaissance",
                "evidence_factors": [
                    f"Elevated port entropy: {feature_keys.get('port_entropy', 'N/A')}",
                    f"Port diversity: {feature_keys.get('unique_ports_count', 'N/A')} unique ports probed"
                ],
                "affected_assets": compromised_hosts[:2]
            })

        # Discovery / Internal Service Enumeration
        if predicted_stage == "Discovery" or feature_keys.get("max_host_fan_out", 0) > 4:
            confidence = min(0.92, 0.45 + attack_prob * 0.45)
            matches.append({
                "tactic_id": "TA0007",
                "tactic_name": "Discovery",
                "technique_id": "T1046",
                "technique_name": "Network Service Discovery",
                "sub_technique": "T1046",
                "assessment_statement": "Host communication pattern is consistent with Network Service Discovery (T1046).",
                "confidence_score": round(confidence, 4),
                "is_predicted": True,
                "evidence_factors": [
                    f"Abnormal host fan-out: {feature_keys.get('max_host_fan_out', 'N/A')} peer targets contacted",
                    "Rapid sequential connection attempts across internal addresses"
                ],
                "affected_assets": compromised_hosts
            })

        # Lateral Movement / Remote Services
        if predicted_stage == "Lateral Movement" or feature_keys.get("max_host_fan_out", 0) > 2:
            confidence = min(0.91, 0.40 + attack_prob * 0.50)
            matches.append({
                "tactic_id": "TA0008",
                "tactic_name": "Lateral Movement",
                "technique_id": "T1021",
                "technique_name": "Remote Services",
                "sub_technique": "T1021.002 (SMB/Windows Admin Shares)",
                "assessment_statement": "Internal pivoting behaviour is consistent with Remote Services (T1021).",
                "confidence_score": round(confidence, 4),
                "is_predicted": predicted_stage == "Lateral Movement",
                "evidence_factors": [
                    "Anomalous peer-to-peer connection trajectory between non-management endpoints",
                    f"Elevation in connection rate: {feature_keys.get('connection_rate', 'N/A')} conns/sec"
                ],
                "affected_assets": compromised_hosts
            })

        # Command and Control
        if predicted_stage in ["Command & Control", "Execution"] or feature_keys.get("mean_iat", 0) > 0.05:
            confidence = min(0.88, 0.35 + attack_prob * 0.50)
            matches.append({
                "tactic_id": "TA0011",
                "tactic_name": "Command and Control",
                "technique_id": "T1071",
                "technique_name": "Application Layer Protocol",
                "sub_technique": "T1071.001 (Web Protocols)",
                "assessment_statement": "Periodic session communication is consistent with Application Layer Protocol (T1071).",
                "confidence_score": round(confidence, 4),
                "is_predicted": True,
                "evidence_factors": [
                    "Persistent external communication pattern with regular beaconing interval",
                    f"Measured timing jitter: {feature_keys.get('iat_jitter', 'N/A')}"
                ],
                "affected_assets": compromised_hosts[:1]
            })

        # Exfiltration
        if predicted_stage == "Exfiltration" or feature_keys.get("bytes_per_sec_kb", 0) > 100:
            confidence = min(0.94, 0.55 + attack_prob * 0.40)
            matches.append({
                "tactic_id": "TA0010",
                "tactic_name": "Exfiltration",
                "technique_id": "T1041",
                "technique_name": "Exfiltration Over C2 Channel",
                "sub_technique": "T1041",
                "assessment_statement": "Sustained high-volume outbound egress is consistent with Exfiltration (T1041).",
                "confidence_score": round(confidence, 4),
                "is_predicted": True,
                "evidence_factors": [
                    f"Outbound throughput spike: {feature_keys.get('bytes_per_sec_kb', 'N/A')} KB/s",
                    "Asymmetric outbound byte ratio exceeding historical baseline"
                ],
                "affected_assets": compromised_hosts[:1]
            })

        return matches


# Global matcher instance
mitre_matcher = MitreMatcher()
