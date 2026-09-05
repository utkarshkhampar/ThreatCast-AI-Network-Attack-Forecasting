"""
ThreatCast - Flow Extractor & Flow Statistics Engine
Aggregates packet streams into bidirectional NetFlow-like flow records with statistical features.
"""

import math
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from ingestion.packet_parser import PacketFeatureRecord


@dataclass
class FlowRecord:
    flow_id: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    start_time: float
    last_seen: float
    duration: float = 0.0
    total_fwd_packets: int = 0
    total_bwd_packets: int = 0
    total_fwd_bytes: int = 0
    total_bwd_bytes: int = 0
    fwd_iats: List[float] = field(default_factory=list)
    bwd_iats: List[float] = field(default_factory=list)
    syn_count: int = 0
    ack_count: int = 0
    fin_count: int = 0
    rst_count: int = 0
    psh_count: int = 0
    urg_count: int = 0

    @property
    def total_packets(self) -> int:
        return self.total_fwd_packets + self.total_bwd_packets

    @property
    def total_bytes(self) -> int:
        return self.total_fwd_bytes + self.total_bwd_bytes

    @property
    def packets_per_second(self) -> float:
        return self.total_packets / max(self.duration, 0.001)

    @property
    def bytes_per_second(self) -> float:
        return self.total_bytes / max(self.duration, 0.001)

    @property
    def fwd_bwd_ratio(self) -> float:
        return self.total_fwd_bytes / max(self.total_bwd_bytes, 1)

    @property
    def syn_ratio(self) -> float:
        return self.syn_count / max(self.total_packets, 1)

    @property
    def mean_iat(self) -> float:
        all_iats = self.fwd_iats + self.bwd_iats
        return sum(all_iats) / max(len(all_iats), 1)

    @property
    def var_iat(self) -> float:
        all_iats = self.fwd_iats + self.bwd_iats
        if len(all_iats) <= 1:
            return 0.0
        m = self.mean_iat
        return sum((x - m) ** 2 for x in all_iats) / len(all_iats)

    def to_feature_vector(self) -> Dict[str, Any]:
        return {
            "flow_id": self.flow_id,
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "src_port": self.src_port,
            "dst_port": self.dst_port,
            "protocol": self.protocol,
            "duration": round(self.duration, 4),
            "total_packets": self.total_packets,
            "total_bytes": self.total_bytes,
            "packets_per_second": round(self.packets_per_second, 2),
            "bytes_per_second": round(self.bytes_per_second, 2),
            "fwd_bwd_ratio": round(self.fwd_bwd_ratio, 4),
            "syn_ratio": round(self.syn_ratio, 4),
            "mean_iat": round(self.mean_iat, 6),
            "var_iat": round(self.var_iat, 6),
            "syn_count": self.syn_count,
            "rst_count": self.rst_count,
            "fin_count": self.fin_count
        }


class FlowAggregator:
    def __init__(self, idle_timeout: float = 15.0):
        self.active_flows: Dict[str, FlowRecord] = {}
        self.idle_timeout = idle_timeout

    def _get_flow_key(self, pkt: PacketFeatureRecord) -> str:
        # Standard 5-tuple canonical flow key
        if (pkt.src_ip, pkt.src_port) <= (pkt.dst_ip, pkt.dst_port):
            return f"{pkt.src_ip}:{pkt.src_port}<->{pkt.dst_ip}:{pkt.dst_port}:{pkt.protocol}"
        else:
            return f"{pkt.dst_ip}:{pkt.dst_port}<->{pkt.src_ip}:{pkt.src_port}:{pkt.protocol}"

    def process_packet(self, pkt: PacketFeatureRecord) -> Optional[FlowRecord]:
        flow_key = self._get_flow_key(pkt)
        now = pkt.timestamp
        is_forward = (pkt.src_ip, pkt.src_port) <= (pkt.dst_ip, pkt.dst_port)

        flow = self.active_flows.get(flow_key)
        if not flow:
            flow = FlowRecord(
                flow_id=flow_key,
                src_ip=pkt.src_ip,
                dst_ip=pkt.dst_ip,
                src_port=pkt.src_port,
                dst_port=pkt.dst_port,
                protocol=pkt.protocol,
                start_time=now,
                last_seen=now
            )
            self.active_flows[flow_key] = flow

        # Update metrics
        flow.duration = max(0.0, now - flow.start_time)
        flow.last_seen = now

        if is_forward:
            flow.total_fwd_packets += 1
            flow.total_fwd_bytes += pkt.packet_length
            if pkt.inter_arrival_time > 0:
                flow.fwd_iats.append(pkt.inter_arrival_time)
        else:
            flow.total_bwd_packets += 1
            flow.total_bwd_bytes += pkt.packet_length
            if pkt.inter_arrival_time > 0:
                flow.bwd_iats.append(pkt.inter_arrival_time)

        # Flags
        flags = pkt.tcp_flags
        flow.syn_count += flags.get("SYN", 0)
        flow.ack_count += flags.get("ACK", 0)
        flow.fin_count += flags.get("FIN", 0)
        flow.rst_count += flags.get("RST", 0)
        flow.psh_count += flags.get("PSH", 0)
        flow.urg_count += flags.get("URG", 0)

        # Emit completed flow if TCP FIN or RST seen
        if flags.get("FIN", 0) or flags.get("RST", 0):
            completed_flow = self.active_flows.pop(flow_key, None)
            return completed_flow

        return None

    def flush_expired_flows(self, current_time: float) -> List[FlowRecord]:
        expired = []
        for k, flow in list(self.active_flows.items()):
            if current_time - flow.last_seen >= self.idle_timeout:
                expired.append(flow)
                del self.active_flows[k]
        return expired

    def get_active_flow_records(self) -> List[FlowRecord]:
        return list(self.active_flows.values())
