"""
ThreatCast - Response Policy Engine
Evaluates risk thresholds, asset criticalities, and response policies to generate
authorized recommendations for SOC analysts.
"""

from typing import Dict, Any, List, Optional


class ResponsePolicyEngine:
    def __init__(self):
        self.default_policies = [
            {
                "policy_id": "POL-01",
                "name": "Critical Asset Lateral Movement Containment",
                "condition": "risk_score >= 80 and asset_criticality in ['CRITICAL', 'HIGH']",
                "recommended_action": "ISOLATE_ENDPOINT",
                "required_role": "SOC_ADMIN",
                "requires_human_approval": True,
                "default_mode": "DRY_RUN",
                "cooldown_seconds": 300
            },
            {
                "policy_id": "POL-02",
                "name": "High-Volume Scanning Port Block",
                "condition": "predicted_stage == 'Reconnaissance' and port_entropy >= 1.5",
                "recommended_action": "BLOCK_PORT",
                "required_role": "SOC_ADMIN",
                "requires_human_approval": True,
                "default_mode": "DRY_RUN",
                "cooldown_seconds": 180
            },
            {
                "policy_id": "POL-03",
                "name": "Early Warning Telemetry Escalation",
                "condition": "attack_probability >= 0.60 and attack_probability < 0.80",
                "recommended_action": "INCREASE_LOGGING",
                "required_role": "ANALYST",
                "requires_human_approval": False,
                "default_mode": "DRY_RUN",
                "cooldown_seconds": 60
            }
        ]

    def evaluate_forecast(
        self,
        target_ip: str,
        asset_criticality: str,
        risk_score: float,
        attack_prob: float,
        predicted_stage: str,
        port_entropy: float = 0.8
    ) -> List[Dict[str, Any]]:
        """Evaluates policies and produces ranked defensive recommendations."""
        recommendations = []

        if risk_score >= 80 or (attack_prob >= 0.85 and asset_criticality in ["CRITICAL", "HIGH"]):
            recommendations.append({
                "policy_id": "POL-01",
                "action_type": "ISOLATE_ENDPOINT",
                "title": f"Isolate Host {target_ip}",
                "description": f"Predicted trajectory indicates imminent lateral movement. Sever host {target_ip} from internal VLAN.",
                "target_ip": target_ip,
                "urgency": "CRITICAL",
                "estimated_risk_reduction": "74%",
                "requires_human_approval": True,
                "recommended_mode": "DRY_RUN",
                "compliance_tag": "NIST-CSF-RS.MI-1"
            })

        if predicted_stage in ["Reconnaissance", "Discovery"] or port_entropy >= 1.2:
            recommendations.append({
                "policy_id": "POL-02",
                "action_type": "BLOCK_PORT",
                "title": "Block Discovery Probes on Ports 445 / 3389",
                "description": "Block incoming probe attempts on administrative ports targeting internal subnets.",
                "target_ip": target_ip,
                "urgency": "HIGH",
                "estimated_risk_reduction": "45%",
                "requires_human_approval": True,
                "recommended_mode": "DRY_RUN",
                "compliance_tag": "NIST-CSF-PR.PT-4"
            })

        if attack_prob >= 0.50:
            recommendations.append({
                "policy_id": "POL-03",
                "action_type": "INCREASE_LOGGING",
                "title": f"Escalate NetFlow & PCAP Capture on {target_ip}",
                "description": "Increase temporal window sampling from 10s to 1s resolution for full packet forensics.",
                "target_ip": target_ip,
                "urgency": "MEDIUM",
                "estimated_risk_reduction": "15%",
                "requires_human_approval": False,
                "recommended_mode": "DRY_RUN",
                "compliance_tag": "NIST-CSF-DE.CM-1"
            })

        return recommendations


# Global policy engine instance
policy_engine = ResponsePolicyEngine()
