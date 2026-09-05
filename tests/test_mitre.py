import pytest
from mitre.taxonomy import MITRE_TACTICS, MITRE_TECHNIQUES
from mitre.matcher import MitreMatcher

def test_mitre_taxonomy():
    assert len(MITRE_TACTICS) >= 10
    assert "TA0043" in MITRE_TACTICS
    assert "T1046" in MITRE_TECHNIQUES
    assert MITRE_TECHNIQUES["T1046"]["name"] == "Network Service Discovery"

def test_mitre_matcher():
    matcher = MitreMatcher()
    
    # Discovery stage with high port entropy
    top_features = [
        {"feature_key": "port_entropy", "observed_value": 2.5, "importance": 0.4},
        {"feature_key": "unique_ports_count", "observed_value": 45, "importance": 0.3}
    ]
    
    matches = matcher.match_forecast_to_techniques(
        predicted_stage="Discovery",
        attack_prob=0.85,
        top_features=top_features,
        compromised_hosts=["10.0.0.42"]
    )
    
    assert len(matches) > 0
    technique_ids = [m["technique_id"] for m in matches]
    assert "T1046" in technique_ids or "T1595" in technique_ids
    assert all("assessment_statement" in m for m in matches)
