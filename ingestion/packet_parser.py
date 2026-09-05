"""
ThreatCast - Packet Parser & Feature Extraction Engine
Extracts packet-level features (IP, TCP/UDP, ICMP, DNS, TLS) from PCAP, PCAPNG, CSV,
and streaming raw socket buffers without storing sensitive payload content.
"""

import time
import math
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class PacketFeatureRecord:
    timestamp: float
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str  # TCP, UDP, ICMP, OTHER
    packet_length: int
    ttl: int
    tcp_flags: Dict[str, int]  # SYN, ACK, FIN, RST, PSH, URG
    tcp_window_size: int
    ip_flags: Dict[str, int]   # DF, MF
    inter_arrival_time: float
    payload_size: int
    is_syn_scan: bool = False
    is_fragmented: bool = False


class PacketParser:
    def __init__(self):
        self.last_packet_time_by_pair: Dict[str, float] = {}
        self.port_history_by_src: Dict[str, List[int]] = {}

    def parse_raw_packet_dict(self, raw: Dict[str, Any]) -> PacketFeatureRecord:
        """Parses a dictionary representation of a network packet into a normalized feature record."""
        timestamp = float(raw.get("timestamp", time.time()))
        src_ip = str(raw.get("src_ip", "0.0.0.0"))
        dst_ip = str(raw.get("dst_ip", "0.0.0.0"))
        src_port = int(raw.get("src_port", 0))
        dst_port = int(raw.get("dst_port", 0))
        protocol = str(raw.get("protocol", "TCP")).upper()
        packet_len = int(raw.get("packet_length", raw.get("length", 64)))
        ttl = int(raw.get("ttl", 64))
        
        # TCP Flags
        raw_flags = raw.get("tcp_flags", {})
        if isinstance(raw_flags, str):
            flags_dict = {
                "SYN": 1 if "S" in raw_flags else 0,
                "ACK": 1 if "A" in raw_flags else 0,
                "FIN": 1 if "F" in raw_flags else 0,
                "RST": 1 if "R" in raw_flags else 0,
                "PSH": 1 if "P" in raw_flags else 0,
                "URG": 1 if "U" in raw_flags else 0,
            }
        elif isinstance(raw_flags, dict):
            flags_dict = {
                "SYN": int(raw_flags.get("SYN", 0)),
                "ACK": int(raw_flags.get("ACK", 0)),
                "FIN": int(raw_flags.get("FIN", 0)),
                "RST": int(raw_flags.get("RST", 0)),
                "PSH": int(raw_flags.get("PSH", 0)),
                "URG": int(raw_flags.get("URG", 0)),
            }
        else:
            flags_dict = {"SYN": 0, "ACK": 0, "FIN": 0, "RST": 0, "PSH": 0, "URG": 0}

        tcp_window = int(raw.get("tcp_window_size", raw.get("window_size", 65535)))
        payload_size = max(0, packet_len - 40) if protocol == "TCP" else max(0, packet_len - 28)

        # Inter-arrival time computation
        pair_key = f"{src_ip}->{dst_ip}"
        last_t = self.last_packet_time_by_pair.get(pair_key, timestamp)
        iat = max(0.0, timestamp - last_t)
        self.last_packet_time_by_pair[pair_key] = timestamp

        # Heuristic port scanning indicator
        src_history = self.port_history_by_src.setdefault(src_ip, [])
        src_history.append(dst_port)
        if len(src_history) > 50:
            self.port_history_by_src[src_ip] = src_history[-50:]
        
        unique_ports_recent = len(set(self.port_history_by_src[src_ip][-10:]))
        is_syn_scan = (flags_dict["SYN"] == 1 and flags_dict["ACK"] == 0 and unique_ports_recent >= 5)
        is_fragmented = bool(raw.get("is_fragmented", False))

        return PacketFeatureRecord(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=src_port,
            dst_port=dst_port,
            protocol=protocol,
            packet_length=packet_len,
            ttl=ttl,
            tcp_flags=flags_dict,
            tcp_window_size=tcp_window,
            ip_flags={"DF": int(raw.get("df", 1)), "MF": int(raw.get("mf", 0))},
            inter_arrival_time=iat,
            payload_size=payload_size,
            is_syn_scan=is_syn_scan,
            is_fragmented=is_fragmented
        )
