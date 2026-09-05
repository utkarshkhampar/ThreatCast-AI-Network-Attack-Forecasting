"""
ThreatCast - Synthetic Multi-Stage Network Attack Generator
Replays realistic packet & flow event sequences across 5 progressive attack stages:
Normal -> Reconnaissance -> Discovery -> Lateral Movement -> C2 / Exfiltration
Strictly labelled as DEMO TELEMETRY for defender evaluation and model validation.
"""

import time
import random
from typing import Dict, Any, List, Generator


class SyntheticAttackGenerator:
    def __init__(self):
        self.internal_subnet = "192.168.1."
        self.server_subnet = "10.0.0."
        self.victim_workstation = "192.168.1.45"
        self.app_server = "10.0.0.10"
        self.db_server = "10.0.0.20"
        self.c2_server = "198.51.100.42"

    def generate_normal_traffic(self, count: int = 15) -> List[Dict[str, Any]]:
        """Benign background web browsing, DNS queries, and background sync."""
        packets = []
        now = time.time()
        for i in range(count):
            proto = random.choice(["TCP", "UDP"])
            if proto == "UDP":
                dst_port = 53
                dst_ip = "192.168.1.1"
                pkt_len = random.randint(64, 180)
                flags = {}
            else:
                dst_port = random.choice([80, 443])
                dst_ip = random.choice(["10.0.0.10", "142.250.190.46", "151.101.1.140"])
                pkt_len = random.randint(120, 1460)
                flags = {"SYN": 0, "ACK": 1, "FIN": 0, "RST": 0, "PSH": random.choice([0, 1])}

            packets.append({
                "timestamp": now + (i * 0.05),
                "src_ip": f"192.168.1.{random.choice([25, 45, 88, 102])}",
                "dst_ip": dst_ip,
                "src_port": random.randint(49152, 65535),
                "dst_port": dst_port,
                "protocol": proto,
                "packet_length": pkt_len,
                "ttl": 64,
                "tcp_flags": flags,
                "window_size": 65535,
                "stage_label": "Normal Baseline Traffic"
            })
        return packets

    def generate_reconnaissance(self, count: int = 25) -> List[Dict[str, Any]]:
        """Port scanning: high port diversity, high SYN ratio, no ACK."""
        packets = []
        target_ports = [21, 22, 23, 25, 80, 110, 139, 443, 445, 1433, 3306, 3389, 5432, 8080, 8443]
        now = time.time()
        for i in range(count):
            port = random.choice(target_ports)
            packets.append({
                "timestamp": now + (i * 0.02),
                "src_ip": self.victim_workstation,
                "dst_ip": self.app_server,
                "src_port": random.randint(50000, 60000),
                "dst_port": port,
                "protocol": "TCP",
                "packet_length": 60,
                "ttl": 58,
                "tcp_flags": {"SYN": 1, "ACK": 0, "FIN": 0, "RST": 0, "PSH": 0},
                "window_size": 1024,
                "stage_label": "Reconnaissance (Active Port Sweep)"
            })
        return packets

    def generate_discovery(self, count: int = 20) -> List[Dict[str, Any]]:
        """Subnet sweep: large fan-out across multiple internal hosts."""
        packets = []
        now = time.time()
        for i in range(count):
            target_host = f"10.0.0.{random.randint(2, 30)}"
            packets.append({
                "timestamp": now + (i * 0.03),
                "src_ip": self.victim_workstation,
                "dst_ip": target_host,
                "src_port": random.randint(51000, 61000),
                "dst_port": 445,  # SMB enumeration
                "protocol": "TCP",
                "packet_length": 64,
                "ttl": 60,
                "tcp_flags": {"SYN": 1, "ACK": 0, "FIN": 0, "RST": 0, "PSH": 0},
                "window_size": 2048,
                "stage_label": "Discovery (Internal SMB Fan-Out)"
            })
        return packets

    def generate_lateral_movement(self, count: int = 30) -> List[Dict[str, Any]]:
        """Lateral pivoting: SMB/RDP session established, high payload bursts."""
        packets = []
        now = time.time()
        for i in range(count):
            packets.append({
                "timestamp": now + (i * 0.01),
                "src_ip": self.victim_workstation,
                "dst_ip": self.app_server,
                "src_port": 54220,
                "dst_port": 445,
                "protocol": "TCP",
                "packet_length": random.randint(800, 1460),
                "ttl": 64,
                "tcp_flags": {"SYN": 0, "ACK": 1, "FIN": 0, "RST": 0, "PSH": 1},
                "window_size": 65535,
                "stage_label": "Lateral Movement (SMB Admin Share Staging)"
            })
        return packets

    def generate_c2_exfiltration(self, count: int = 25) -> List[Dict[str, Any]]:
        """Command & Control beaconing and outbound high-volume data exfiltration."""
        packets = []
        now = time.time()
        for i in range(count):
            packets.append({
                "timestamp": now + (i * 0.04),
                "src_ip": self.victim_workstation,
                "dst_ip": self.c2_server,
                "src_port": 49822,
                "dst_port": 443,
                "protocol": "TCP",
                "packet_length": random.randint(1200, 1500),
                "ttl": 52,
                "tcp_flags": {"SYN": 0, "ACK": 1, "FIN": 0, "RST": 0, "PSH": 1},
                "window_size": 32768,
                "stage_label": "Command & Control / Exfiltration"
            })
        return packets


# Global generator instance
synthetic_generator = SyntheticAttackGenerator()
