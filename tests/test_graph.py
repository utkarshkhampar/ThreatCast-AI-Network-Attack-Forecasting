import pytest
from graph_engine.temporal_graph import TemporalGraph

def test_temporal_graph_construction():
    graph = TemporalGraph()
    graph.add_or_update_node(ip="10.0.0.1", hostname="gw-01", asset_type="GATEWAY", criticality="CRITICAL")
    graph.add_or_update_node(ip="10.0.0.10", hostname="srv-db", asset_type="SERVER", criticality="HIGH")
    graph.add_or_update_edge(
        src_ip="10.0.0.1",
        dst_ip="10.0.0.10",
        protocol="TCP",
        port=5432,
        bytes_count=12000,
        packets_count=45
    )
    
    assert len(graph.nodes) == 2
    assert len(graph.edges) == 1
    
    cyto = graph.to_cytoscape_elements()
    assert len(cyto) == 3
    node_elements = [e for e in cyto if "source" not in e["data"]]
    edge_elements = [e for e in cyto if "source" in e["data"]]
    assert len(node_elements) == 2
    assert len(edge_elements) == 1

def test_blast_radius_computation():
    graph = TemporalGraph()
    graph.add_or_update_node(ip="10.0.0.1", hostname="gateway", asset_type="GATEWAY", criticality="CRITICAL")
    graph.add_or_update_node(ip="10.0.0.2", hostname="api-srv", asset_type="SERVER", criticality="MEDIUM")
    graph.add_or_update_node(ip="10.0.0.3", hostname="db-srv", asset_type="SERVER", criticality="CRITICAL")
    
    graph.add_or_update_edge(src_ip="10.0.0.1", dst_ip="10.0.0.2", protocol="TCP", port=443, bytes_count=1000, packets_count=10)
    graph.add_or_update_edge(src_ip="10.0.0.2", dst_ip="10.0.0.3", protocol="TCP", port=5432, bytes_count=2000, packets_count=20)
    
    blast = graph.calculate_blast_radius(compromised_ip="10.0.0.1", max_depth=2)
    assert blast["compromised_node"] == "10.0.0.1"
    assert blast["affected_node_count"] == 2
    assert blast["blast_score"] > 0
