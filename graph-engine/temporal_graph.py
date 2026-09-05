"""
ThreatCast - Temporal Graph Engine G_t = (V_t, E_t)
Builds dynamic, attributed host communication graphs with structural features,
topology changes, degree dynamics, and blast radius calculation.
"""

import time
from typing import Dict, Any, List, Set, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class GraphNode:
    node_id: str
    ip: str
    hostname: str
    asset_type: str  # GATEWAY, SERVER, WORKSTATION, EXTERNAL, CLOUD
    criticality: str  # CRITICAL, HIGH, MEDIUM, LOW
    risk_score: float = 0.0
    degree: int = 0
    fan_in: int = 0
    fan_out: int = 0
    total_bytes: int = 0
    total_packets: int = 0
    anomaly_score: float = 0.0
    ueba_deviation: float = 0.0
    embedding: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.node_id,
            "ip": self.ip,
            "hostname": self.hostname,
            "asset_type": self.asset_type,
            "criticality": self.criticality,
            "risk_score": round(self.risk_score, 2),
            "degree": self.degree,
            "fan_in": self.fan_in,
            "fan_out": self.fan_out,
            "total_bytes": self.total_bytes,
            "total_packets": self.total_packets,
            "anomaly_score": round(self.anomaly_score, 4),
            "ueba_deviation": round(self.ueba_deviation, 2),
            "embedding": self.embedding
        }


@dataclass
class GraphEdge:
    edge_id: str
    source: str
    target: str
    protocol: str
    port: int
    bytes: int
    packets: int
    syn_count: int = 0
    anomaly_score: float = 0.0
    threat_score: float = 0.0
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.edge_id,
            "source": self.source,
            "target": self.target,
            "protocol": self.protocol,
            "port": self.port,
            "bytes": self.bytes,
            "packets": self.packets,
            "syn_count": self.syn_count,
            "anomaly_score": round(self.anomaly_score, 4),
            "threat_score": round(self.threat_score, 2),
            "timestamp": self.timestamp
        }


class TemporalGraph:
    def __init__(self, timestamp: Optional[float] = None):
        self.timestamp = timestamp or time.time()
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: Dict[str, GraphEdge] = {}
        self.adjacency: Dict[str, Set[str]] = {}

    def add_or_update_node(
        self,
        ip: str,
        hostname: Optional[str] = None,
        asset_type: str = "WORKSTATION",
        criticality: str = "MEDIUM",
        risk_score: float = 0.0,
        ueba_deviation: float = 0.0
    ) -> GraphNode:
        node_id = ip
        if node_id not in self.nodes:
            if ip.startswith("10.0.0.1") or ip.startswith("192.168.1.1"):
                asset_type = "GATEWAY"
                criticality = "CRITICAL"
            elif ip.startswith("10.0.0.10") or ip.endswith(".10"):
                asset_type = "SERVER"
                criticality = "HIGH"
            elif not (ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172.16.")):
                asset_type = "EXTERNAL"
                criticality = "MEDIUM"

            self.nodes[node_id] = GraphNode(
                node_id=node_id,
                ip=ip,
                hostname=hostname or f"host-{ip.replace('.', '-')}",
                asset_type=asset_type,
                criticality=criticality,
                risk_score=risk_score,
                ueba_deviation=ueba_deviation
            )
            self.adjacency[node_id] = set()
        else:
            if risk_score > self.nodes[node_id].risk_score:
                self.nodes[node_id].risk_score = risk_score
            if ueba_deviation > 0:
                self.nodes[node_id].ueba_deviation = ueba_deviation

        return self.nodes[node_id]

    def add_or_update_edge(
        self,
        src_ip: str,
        dst_ip: str,
        protocol: str,
        port: int,
        bytes_count: int,
        packets_count: int,
        syn_count: int = 0,
        anomaly_score: float = 0.0,
        threat_score: float = 0.0
    ) -> GraphEdge:
        src_node = self.add_or_update_node(src_ip)
        dst_node = self.add_or_update_node(dst_ip)

        edge_id = f"{src_ip}->{dst_ip}:{port}:{protocol}"
        if edge_id in self.edges:
            e = self.edges[edge_id]
            e.bytes += bytes_count
            e.packets += packets_count
            e.syn_count += syn_count
            e.anomaly_score = max(e.anomaly_score, anomaly_score)
            e.threat_score = max(e.threat_score, threat_score)
            e.timestamp = time.time()
        else:
            e = GraphEdge(
                edge_id=edge_id,
                source=src_ip,
                target=dst_ip,
                protocol=protocol,
                port=port,
                bytes=bytes_count,
                packets=packets_count,
                syn_count=syn_count,
                anomaly_score=anomaly_score,
                threat_score=threat_score,
                timestamp=time.time()
            )
            self.edges[edge_id] = e

        # Update node degrees and volumes
        self.adjacency[src_ip].add(dst_ip)
        src_node.fan_out = len(self.adjacency[src_ip])
        src_node.degree = src_node.fan_out + src_node.fan_in
        src_node.total_bytes += bytes_count
        src_node.total_packets += packets_count

        dst_node.fan_in += 1
        dst_node.degree = dst_node.fan_out + dst_node.fan_in
        dst_node.total_bytes += bytes_count
        dst_node.total_packets += packets_count

        return e

    def calculate_blast_radius(self, compromised_ip: str, max_depth: int = 2) -> Dict[str, Any]:
        """Calculates 1-hop and 2-hop potential lateral blast radius from a compromised node."""
        if compromised_ip not in self.nodes:
            return {"compromised_node": compromised_ip, "affected_nodes": [], "blast_score": 0.0}

        visited: Set[str] = {compromised_ip}
        current_layer: Set[str] = {compromised_ip}
        affected: List[Dict[str, Any]] = []
        cumulative_risk = 0.0

        for hop in range(1, max_depth + 1):
            next_layer: Set[str] = set()
            for node in current_layer:
                neighbors = self.adjacency.get(node, set())
                for neighbor in neighbors:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        next_layer.add(neighbor)
                        n_node = self.nodes.get(neighbor)
                        crit_weight = {"CRITICAL": 3.0, "HIGH": 2.0, "MEDIUM": 1.0, "LOW": 0.5}.get(
                            n_node.criticality if n_node else "MEDIUM", 1.0
                        )
                        decay = 1.0 / hop
                        risk_contrib = crit_weight * 25.0 * decay
                        cumulative_risk += risk_contrib
                        if n_node:
                            affected.append({
                                "node_id": neighbor,
                                "ip": n_node.ip,
                                "hostname": n_node.hostname,
                                "asset_type": n_node.asset_type,
                                "criticality": n_node.criticality,
                                "hop_distance": hop,
                                "risk_contribution": round(risk_contrib, 2)
                            })
            current_layer = next_layer

        blast_score = min(100.0, round(cumulative_risk, 2))
        return {
            "compromised_node": compromised_ip,
            "blast_score": blast_score,
            "affected_node_count": len(affected),
            "affected_nodes": affected
        }

    def to_cytoscape_elements(self) -> List[Dict[str, Any]]:
        """Formats graph for Cytoscape.js frontend visualization."""
        elements = []
        for node in self.nodes.values():
            elements.append({
                "data": {
                    "id": node.node_id,
                    "label": f"{node.hostname}\n({node.ip})",
                    "ip": node.ip,
                    "type": node.asset_type,
                    "criticality": node.criticality,
                    "risk": node.risk_score,
                    "degree": node.degree,
                    "anomaly": node.anomaly_score
                }
            })
        for edge in self.edges.values():
            elements.append({
                "data": {
                    "id": edge.edge_id,
                    "source": edge.source,
                    "target": edge.target,
                    "label": f"{edge.protocol}:{edge.port}",
                    "protocol": edge.protocol,
                    "port": edge.port,
                    "bytes": edge.bytes,
                    "threat": edge.threat_score
                }
            })
        return elements

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "node_count": len(self.nodes),
            "edge_count": len(self.edges),
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": [e.to_dict() for e in self.edges.values()]
        }
