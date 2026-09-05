# ThreatCast — Testing Strategy & Verification Suite

## 1. Quality Assurance & Testing Hierarchy
The ThreatCast verification architecture spans four rigorous testing tiers to guarantee that the platform is robust, safe, and accurate:

```
+-------------------------------------------------------------------+
|                        TESTING HIERARCHY                          |
|                                                                   |
| [Tier 4] End-to-End Synthetic Attack Replay (scripts/ingest_demo) |
|          Validates complete 5-stage attack lifecycle              |
|                                                                   |
| [Tier 3] API & WebSocket Integration Tests (test_api_endpoints)   |
|          Validates FastAPI routes, auth, and database sessions    |
|                                                                   |
| [Tier 2] Subsystem Domain Tests (Active Defence, Blockchain, etc) |
|          Validates 10-point gates, Merkle trees, UEBA, MITRE      |
|                                                                   |
| [Tier 1] Unit Tests & Mathematical Invariants (World Model)       |
|          Validates tensor dimensions, rollout convergence         |
+-------------------------------------------------------------------+
```

---

## 2. Test Suite Catalog (23 Automated Pytest Cases)

| Test Module | Coverage Area | Key Assertions Verified |
|---|---|---|
| `test_active_defence.py` | Response Gatekeeper & Safety | Allow-listed CIDRs pass, public IPs rejected, dry-run safety verified, rollback recipe synthesized. |
| `test_api_endpoints.py` | FastAPI REST Endpoints | Auth login returns valid JWT, forecast endpoint returns trajectories, benchmark endpoint evaluates models. |
| `test_blockchain.py` | Forensic Evidence Ledger | SHA-256 block hashing, Merkle root consistency, chain-of-custody updates, tamper detection. |
| `test_graph.py` | Temporal Graph Engine | Node and edge attribution, Cytoscape element serialization, 2-hop blast radius calculation. |
| `test_mitre.py` | MITRE ATT&CK Matcher | T1595 and T1046 detection mapping, calibrated confidence scores, non-assertive phrasing. |
| `test_simulation.py` | Counterfactual Sandbox | Parallel rollout of 4 intervention scenarios, risk reduction percentage, optimal policy selection. |
| `test_ueba.py` | Entity Profiling Engine | Baseline drift, peer novelty penalties, port novelty penalties, compound anomaly scoring. |
| `test_world_model.py` | AI Latent World Model | State vector dimension check (16-D), latent projection (8-D), $K$-step forward rollout consistency. |

---

## 3. Running the Verification Suite
Execute all tests within the active virtual environment:

```bash
# Run complete test suite
./venv/bin/pytest tests/ -v

# Run with coverage report
./venv/bin/pytest tests/ --cov=backend --cov=ai_engine --cov=response_engine
```

All 23 automated tests pass cleanly with zero failures.
