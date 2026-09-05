import pytest
from ueba.baseline_profiler import UEBAProfiler, EntityProfile

def test_entity_profile_deviation():
    profile = EntityProfile("ENT-01", "192.168.1.50", "WORKSTATION")
    profile.typical_peer_ips = {"10.0.0.1", "10.0.0.5"}
    profile.typical_ports = {80, 443}
    
    # Normal activity
    normal_score = profile.update_observation(
        target_ips=["10.0.0.1"],
        ports_contacted=[443],
        bytes_observed=16000,
        current_conn_rate=2.1
    )
    assert normal_score < 30.0
    
    # Anomalous activity (contacting 10 new IPs, unusual ports, huge data surge)
    novel_peers = [f"10.0.0.{i}" for i in range(10, 25)]
    novel_ports = [445, 139, 3389, 22, 8080]
    anomaly_score = profile.update_observation(
        target_ips=novel_peers,
        ports_contacted=novel_ports,
        bytes_observed=500000,
        current_conn_rate=25.0
    )
    assert anomaly_score > 60.0

def test_ueba_profiler_engine():
    engine = UEBAProfiler()
    profiles = engine.get_all_profiles()
    assert len(profiles) >= 6
    
    score = engine.score_host("192.168.1.45", ["10.0.0.50"], [445], 80000, 15.0)
    assert score > 0.0
