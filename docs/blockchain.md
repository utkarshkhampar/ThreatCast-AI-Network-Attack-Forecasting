# ThreatCast — Blockchain Evidence & Forensic Chain-of-Custody

## 1. Forensic Evidence Integrity in Cybersecurity
In enterprise cybersecurity, forensic artifacts (packet captures, flow logs, model forecast states, active defence records) are vulnerable to tampering, insider deletion, or retrospective manipulation by sophisticated attackers. ThreatCast guarantees **cryptographic non-repudiation and immutable chain-of-custody** by anchoring all forensic evidence onto an immutable ledger.

---

## 2. Cryptographic Evidence Data Model

```
+-------------------------------------------------------------------+
|                        EVIDENCE RECORD                            |
+-------------------------------------------------------------------+
| Record ID:            EVD-2026-94821                              |
| Incident ID:          INC-2026-0042                               |
| Timestamp (UTC):      1725527180.12 (2026-09-05T09:06:20Z)        |
| Telemetry SHA-256:    a8f3b...9e10                                 |
| Forecast State Root:  4c28d...7b1a                                |
| Action Executed:      ISOLATE_ENDPOINT (Target: 10.0.0.42)        |
| Actor Public Key:     x509:CN=SecOpsLead,OU=SOC,O=Corp            |
| Merkle Block Index:   #1,482                                      |
| Merkle Block Hash:    7e91a...34df                                |
| Chain of Custody:     [Recorded -> Anchored -> Verified]          |
+-------------------------------------------------------------------+
```

---

## 3. Cryptographic Merkle Tree Ledger
For environments without a live Hyperledger Fabric peer cluster, ThreatCast provides an in-memory SHA-256 cryptographic Merkle block ledger (`blockchain/mock_ledger.py`):
1. **Transaction Hashing**: Every incident action generates an invariant SHA-256 digest:
   $$h_i = \text{SHA256}(\text{id} \,\|\, \text{action} \,\|\, \text{target} \,\|\, \text{timestamp} \,\|\, \text{actor})$$
2. **Merkle Tree Construction**: Transactions are paired recursively:
   $$h_{parent} = \text{SHA256}(h_{left} \,\|\, h_{right})$$
3. **Block Header Chaining**:
   $$\text{BlockHeader}_n = \text{SHA256}(\text{BlockHeader}_{n-1} \,\|\, \text{MerkleRoot}_n \,\|\, \text{Nonce} \,\|\, \text{Timestamp})$$

---

## 4. Verification Workflow & Compliance Standards
Any external auditor or judicial forensic team can verify evidence integrity via the API:

```bash
# Verify integrity of incident record
curl -X POST http://localhost:8000/api/v1/blockchain/verify \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"evidence_id": "EVD-2026-94821"}'
```

- Returns cryptographic proof whether recorded hash matches current block header.
- Fully compliant with **NIST SP 800-86** (*Guide to Integrating Forensic Techniques into Incident Response*) and **ISO/IEC 27037** (*Guidelines for identification, collection, acquisition and preservation of digital evidence*).
