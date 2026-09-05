"""
ThreatCast - Temporal State Builder & Network State Vector
Computes comprehensive 10-second temporal state snapshots S_t capturing global and
per-host macro statistics, port entropy, SYN anomaly ratios, and graph connectivity.
"""

import math
import time
from typing import Dict, Any, List, Set, Optional
from dataclasses import dataclass, asdict
from ingestion.flow_extractor import FlowRecord
from ingestion.packet_parser import PacketFeatureRecord


@dataclass
class NetworkStateSnapshot:
    timestamp: float
    window_duration: float
    active_hosts_count: int
    active_connections_count: int
    total_packets: int
    total_bytes: int
    packets_per_sec: float
    bytes_per_sec: float
    unique_ports_count: int
    port_entropy: float
    syn_ratio: float
    rst_ratio: float
    mean_flow_duration: float
    connection_rate: float
    mean_iat: float
    var_iat: float
    protocol_distribution: Dict[str, int]
    max_host_fan_out: int
    max_host_fan_in: int
    top_talking_hosts: List[str]
    state_vector: List[float]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class StateBuilder:
    def __init__(self, window_duration: float = 10.0):
        self.window_duration = window_duration

    @staticmethod
    def calculate_entropy(values: List[int]) -> float:
        if not values:
            return 0.0
        total = len(values)
        freq: Dict[int, int] = {}
        for v in values:
            freq[v] = freq.get(v, 0) + 1
        entropy = 0.0
        for count in freq.values():
            p = count / total
            if p > 0:
                entropy -= p * math.log2(p)
        return round(entropy, 4)

    def build_state(
        self,
        packets: List[PacketFeatureRecord],
        flows: List[FlowRecord],
        window_end_time: Optional[float] = None
    ) -> NetworkStateSnapshot:
        now = window_end_time or time.time()
        
        # Hosts & connectivity
        active_hosts: Set[str] = set()
        fan_out: Dict[str, Set[str]] = {}
        fan_in: Dict[str, Set[str]] = {}
        host_bytes: Dict[str, int] = {}
        dest_ports: List[int] = []
        protocols: Dict[str, int] = {"TCP": 0, "UDP": 0, "ICMP": 0, "OTHER": 0}
        
        total_packets = len(packets)
        total_bytes = 0
        syn_count = 0
        rst_count = 0
        all_iats: List[float] = []

        for p in packets:
            active_hosts.add(p.src_ip)
            active_hosts.add(p.dst_ip)
            
            fan_out.setdefault(p.src_ip, set()).add(p.dst_ip)
            fan_in.setdefault(p.dst_ip, set()).add(p.src_ip)
            
            host_bytes[p.src_ip] = host_bytes.get(p.src_ip, 0) + p.packet_length
            total_bytes += p.packet_length
            dest_ports.append(p.dst_port)
            
            proto = p.protocol if p.protocol in protocols else "OTHER"
            protocols[proto] += 1
            
            if p.tcp_flags.get("SYN", 0):
                syn_count += 1
            if p.tcp_flags.get("RST", 0):
                rst_count += 1
            if p.inter_arrival_time > 0:
                all_iats.append(p.inter_arrival_time)

        # Port entropy
        port_entropy = self.calculate_entropy(dest_ports)
        unique_ports = len(set(dest_ports))
        
        # Aggregations
        active_conns = len(flows)
        pps = total_packets / max(self.window_duration, 0.1)
        bps = total_bytes / max(self.window_duration, 0.1)
        syn_ratio = syn_count / max(total_packets, 1)
        rst_ratio = rst_count / max(total_packets, 1)
        conn_rate = active_conns / max(self.window_duration, 0.1)
        
        mean_dur = sum(f.duration for f in flows) / max(len(flows), 1)
        mean_iat = sum(all_iats) / max(len(all_iats), 1)
        var_iat = (sum((x - mean_iat) ** 2 for x in all_iats) / len(all_iats)) if len(all_iats) > 1 else 0.0

        max_fan_out = max((len(d) for d in fan_out.values()), default=0)
        max_fan_in = max((len(s) for s in fan_in.values()), default=0)
        
        # Sort top talking hosts
        top_hosts = sorted(host_bytes.keys(), key=lambda h: host_bytes[h], reverse=True)[:5]

        # Normalized feature state vector (dimension 16)
        state_vec = [
            float(len(active_hosts)),
            float(active_conns),
            float(pps),
            float(bps / 1000.0), # KB/s
            float(unique_ports),
            float(port_entropy),
            float(syn_ratio),
            float(rst_ratio),
            float(mean_dur),
            float(conn_rate),
            float(mean_iat),
            float(math.sqrt(var_iat)),
            float(protocols["TCP"] / max(total_packets, 1)),
            float(protocols["UDP"] / max(total_packets, 1)),
            float(max_fan_out),
            float(max_fan_in)
        ]

        return NetworkStateSnapshot(
            timestamp=now,
            window_duration=self.window_duration,
            active_hosts_count=len(active_hosts),
            active_connections_count=active_conns,
            total_packets=total_packets,
            total_bytes=total_bytes,
            packets_per_sec=round(pps, 2),
            bytes_per_sec=round(bps, 2),
            unique_ports_count=unique_ports,
            port_entropy=round(port_entropy, 4),
            syn_ratio=round(syn_ratio, 4),
            rst_ratio=round(rst_ratio, 4),
            mean_flow_duration=round(mean_dur, 4),
            connection_rate=round(conn_rate, 2),
            mean_iat=round(mean_iat, 6),
            var_iat=round(var_iat, 6),
            protocol_distribution=protocols,
            max_host_fan_out=max_fan_out,
            max_host_fan_in=max_fan_in,
            top_talking_hosts=top_hosts,
            state_vector=state_vec
        )
