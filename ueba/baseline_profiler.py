"""
ThreatCast - User and Entity Behaviour Analytics (UEBA) Engine
Builds statistical host baselines, tracks communication partners and activity profiles,
and computes per-entity deviation and risk anomaly scores.
"""

import time
import math
from typing import Dict, Any, List, Set, Optional


class EntityProfile:
    def __init__(self, entity_id: str, ip: str, role: str = "WORKSTATION"):
        self.entity_id = entity_id
        self.ip = ip
        self.role = role
        self.typical_peer_ips: Set[str] = set()
        self.typical_ports: Set[int] = {80, 443, 53}
        self.baseline_bytes_mean: float = 15000.0
        self.baseline_bytes_std: float = 5000.0
        self.baseline_conn_rate_mean: float = 2.0
        self.baseline_conn_rate_std: float = 1.0
        self.current_deviation_score: float = 0.0
        self.last_updated: float = time.time()

    def update_observation(
        self,
        target_ips: List[str],
        ports_contacted: List[int],
        bytes_observed: int,
        current_conn_rate: float
    ) -> float:
        """Computes statistical z-score deviation against baseline profile."""
        now = time.time()
        self.last_updated = now

        # Peer novelty score
        new_peers = [ip for ip in target_ips if ip not in self.typical_peer_ips]
        peer_novelty_penalty = min(50.0, len(new_peers) * 15.0)

        # Port novelty score
        new_ports = [p for p in ports_contacted if p not in self.typical_ports]
        port_novelty_penalty = min(30.0, len(new_ports) * 10.0)

        # Volume z-score
        z_bytes = max(0.0, (bytes_observed - self.baseline_bytes_mean) / max(self.baseline_bytes_std, 1.0))
        volume_penalty = min(40.0, z_bytes * 10.0)

        # Rate z-score
        z_rate = max(0.0, (current_conn_rate - self.baseline_conn_rate_mean) / max(self.baseline_conn_rate_std, 0.5))
        rate_penalty = min(40.0, z_rate * 12.0)

        # Cumulative deviation score [0.0 - 100.0]
        total_deviation = min(100.0, peer_novelty_penalty + port_novelty_penalty + volume_penalty + rate_penalty)
        self.current_deviation_score = round(total_deviation, 2)
        return self.current_deviation_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_id": self.entity_id,
            "ip": self.ip,
            "role": self.role,
            "typical_peers_count": len(self.typical_peer_ips),
            "typical_ports": list(self.typical_ports),
            "current_deviation_score": self.current_deviation_score,
            "anomaly_level": "CRITICAL" if self.current_deviation_score >= 80 else ("HIGH" if self.current_deviation_score >= 50 else ("MEDIUM" if self.current_deviation_score >= 25 else "LOW")),
            "last_updated": self.last_updated
        }


class UEBAProfiler:
    def __init__(self):
        self.profiles: Dict[str, EntityProfile] = {}
        # Pre-seed common internal lab entities
        self._seed_default_profiles()

    def _seed_default_profiles(self):
        hosts = [
            ("WKSTN-042", "192.168.1.45", "WORKSTATION"),
            ("WKSTN-088", "192.168.1.88", "WORKSTATION"),
            ("SRV-APP-01", "10.0.0.10", "SERVER"),
            ("SRV-DB-01", "10.0.0.20", "DATABASE"),
            ("DC-CORP-01", "10.0.0.5", "DOMAIN_CONTROLLER"),
            ("GW-EDGE-01", "192.168.1.1", "GATEWAY")
        ]
        for name, ip, role in hosts:
            prof = EntityProfile(name, ip, role)
            prof.typical_peer_ips = {"10.0.0.5", "10.0.0.10", "192.168.1.1"}
            if role == "SERVER":
                prof.typical_ports = {80, 443, 8080}
            elif role == "DATABASE":
                prof.typical_ports = {5432, 3306}
            self.profiles[ip] = prof

    def get_or_create_profile(self, ip: str, role: str = "WORKSTATION") -> EntityProfile:
        if ip not in self.profiles:
            self.profiles[ip] = EntityProfile(f"ENT-{ip.replace('.', '-')}", ip, role)
        return self.profiles[ip]

    def score_host(self, ip: str, target_ips: List[str], ports: List[int], bytes_count: int, conn_rate: float) -> float:
        prof = self.get_or_create_profile(ip)
        return prof.update_observation(target_ips, ports, bytes_count, conn_rate)

    def get_all_profiles(self) -> List[Dict[str, Any]]:
        return [p.to_dict() for p in self.profiles.values()]


# Global UEBA profiler instance
ueba_engine = UEBAProfiler()
