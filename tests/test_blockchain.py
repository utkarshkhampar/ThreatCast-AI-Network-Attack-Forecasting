"""
Unit tests for ThreatCast Blockchain Evidence Layer and Tamper Detection.
"""

import pytest
from blockchain.mock_ledger import MockFabricLedger
from blockchain.client import BlockchainEvidenceClient


def test_blockchain_ledger_genesis():
    ledger = MockFabricLedger()
    assert len(ledger.chain) >= 1
    genesis = ledger.chain[0]
    assert genesis.block_number == 0
    assert genesis.previous_hash == "0" * 64
    assert len(genesis.block_hash) == 64


def test_anchor_and_verify_evidence():
    client = BlockchainEvidenceClient()
    payload = {"packet_count": 145, "attacker_ip": "192.168.1.45", "stage": "Lateral Movement"}
    evidence_hash = client.hash_payload(payload)
    evidence_id = "EVID-TEST-001"

    receipt = client.anchor_evidence(
        evidence_id=evidence_id,
        forecast_id="FC-TEST-001",
        evidence_hash=evidence_hash,
        collector_id="TEST_COLLECTOR",
        target_asset_id="192.168.1.45",
        mitre_technique="T1021",
        risk_score=90.0,
        confidence_score=0.92,
        off_chain_uri="s3://evidence/test-001.json"
    )
    assert receipt["status"] == "COMMITTED"
    assert receipt["evidence_id"] == evidence_id

    # Verify integrity with matching hash
    verify_res = client.verify_evidence(evidence_id, evidence_hash)
    assert verify_res["match"] is True
    assert verify_res["tamper_detected"] is False
    assert verify_res["status"] == "VALID"


def test_tamper_detection_on_adversarial_modification():
    client = BlockchainEvidenceClient()
    original_payload = {"clean_data": "legitimate network snapshot"}
    tampered_payload = {"clean_data": "adversarially altered telemetry"}
    
    orig_hash = client.hash_payload(original_payload)
    tampered_hash = client.hash_payload(tampered_payload)
    evidence_id = "EVID-TAMPER-TEST"

    client.anchor_evidence(
        evidence_id=evidence_id,
        forecast_id="FC-TAMPER",
        evidence_hash=orig_hash,
        collector_id="TEST",
        target_asset_id="192.168.1.88",
        mitre_technique="T1046",
        risk_score=50.0,
        confidence_score=0.8,
        off_chain_uri="s3://evidence/tamper.json"
    )

    # Verifying with the tampered payload's hash must detect tampering
    verify_res = client.verify_evidence(evidence_id, tampered_hash)
    assert verify_res["match"] is False
    assert verify_res["tamper_detected"] is True
    assert verify_res["status"] == "TAMPER_DETECTED"
