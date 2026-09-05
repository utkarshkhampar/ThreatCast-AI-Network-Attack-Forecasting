"""
ThreatCast - Offline MITRE ATT&CK v14 Taxonomy Database
Structured registry of adversary tactics and techniques observable via network telemetry.
"""

from typing import Dict, Any, List

MITRE_TACTICS = {
    "TA0043": {"name": "Reconnaissance", "description": "Adversary is trying to gather information they can use to plan future operations."},
    "TA0001": {"name": "Initial Access", "description": "Adversary is trying to get into your network."},
    "TA0002": {"name": "Execution", "description": "Adversary is trying to run malicious code."},
    "TA0003": {"name": "Persistence", "description": "Adversary is trying to maintain their foothold."},
    "TA0004": {"name": "Privilege Escalation", "description": "Adversary is trying to gain higher-level permissions."},
    "TA0005": {"name": "Defense Evasion", "description": "Adversary is trying to avoid being detected."},
    "TA0006": {"name": "Credential Access", "description": "Adversary is trying to steal account names and passwords."},
    "TA0007": {"name": "Discovery", "description": "Adversary is trying to figure out your environment."},
    "TA0008": {"name": "Lateral Movement", "description": "Adversary is trying to move through your environment."},
    "TA0009": {"name": "Collection", "description": "Adversary is trying to gather data of interest to their goal."},
    "TA0011": {"name": "Command and Control", "description": "Adversary is trying to communicate with compromised systems to control them."},
    "TA0010": {"name": "Exfiltration", "description": "Adversary is trying to steal data."}
}

MITRE_TECHNIQUES = {
    "T1595": {
        "tactic": "TA0043",
        "name": "Active Scanning",
        "sub_techniques": ["T1595.001 (Scanning IP Blocks)", "T1595.002 (Vulnerability Scanning)"],
        "description": "Scanning network targets to identify active hosts, open ports, and vulnerable services.",
        "observable_indicators": ["high destination port diversity", "SYN packet bursts without ACK", "broad IP fan-out"]
    },
    "T1046": {
        "tactic": "TA0007",
        "name": "Network Service Discovery",
        "sub_techniques": ["T1046 (Network Service Discovery)"],
        "description": "Adversary attempts to list services running on remote hosts across internal subnets.",
        "observable_indicators": ["sequential internal port sweep", "rapid TCP SYN probes to port 445/139/3389/22"]
    },
    "T1190": {
        "tactic": "TA0001",
        "name": "Exploit Public-Facing Application",
        "sub_techniques": ["T1190 (Exploit Public-Facing Application)"],
        "description": "Adversary uses software vulnerabilities in Internet-facing hosts to gain initial network access.",
        "observable_indicators": ["anomalous HTTP/HTTPS POST payloads", "unexpected protocol transitions", "inbound spikes"]
    },
    "T1021": {
        "tactic": "TA0008",
        "name": "Remote Services",
        "sub_techniques": ["T1021.001 (Remote Desktop Protocol)", "T1021.002 (SMB/Windows Admin Shares)"],
        "description": "Adversary logs into remote services to pivot laterally between internal workstations.",
        "observable_indicators": ["new internal SMB/RDP connections between non-admin hosts", "sudden degree jump"]
    },
    "T1071": {
        "tactic": "TA0011",
        "name": "Application Layer Protocol",
        "sub_techniques": ["T1071.001 (Web Protocols)", "T1071.004 (DNS Beaconing)"],
        "description": "Adversary communicates with external infrastructure using common application protocols.",
        "observable_indicators": ["periodic low-jitter beaconing", "high-entropy DNS query domains", "persistent external IP session"]
    },
    "T1041": {
        "tactic": "TA0010",
        "name": "Exfiltration Over C2 Channel",
        "sub_techniques": ["T1041 (Exfiltration Over C2 Channel)"],
        "description": "Adversary steals sensitive internal files by sending data through existing command channels.",
        "observable_indicators": ["asymmetric forward/backward byte ratio", "sustained outbound upload volume", "off-hours surge"]
    }
}
