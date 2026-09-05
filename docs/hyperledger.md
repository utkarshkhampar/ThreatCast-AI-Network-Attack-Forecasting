# ThreatCast — Hyperledger Fabric Smart Contract & Consortium Architecture

## 1. Enterprise Consortium Architecture
ThreatCast is architected to run across private permissioned consortia using **Hyperledger Fabric v2.5+**:
- **Consortium Members**: Enterprise SOC, Managed Security Service Provider (MSSP), Regulatory Compliance Authority, Cloud Provider.
- **Consensus Mechanism**: Crash Fault Tolerant (CFT) Raft Ordering Service with multi-node ordering clusters.
- **Confidentiality**: Fabric Private Data Collections (PDC) ensure sensitive internal IP topology details remain encrypted while proof hashes are distributed across consortium peers.

```
+-------------------------------------------------------------------+
|               HYPERLEDGER FABRIC CONSORTIUM TOPOLOGY              |
|                                                                   |
| [Org1: Enterprise SOC]           [Org2: Regulatory Auditor]       |
|  ├─ Peer0.org1 (Endorser)         ├─ Peer0.org2 (Committer)       |
|  └─ CA.org1 (X.509 MSP)           └─ CA.org2 (X.509 MSP)          |
|              \                     /                              |
|               \                   /                               |
|          +-----v-----------------v-----+                          |
|          |     RAFT ORDERING SERVICE   |                          |
|          |    Orderer0, 1, 2 (CFT)     |                          |
|          +--------------+--------------+                          |
|                         |                                         |
|            [Channel: threatcast-audit]                            |
|        Smart Contract: ThreatCastEvidenceContract                 |
+-------------------------------------------------------------------+
```

---

## 2. Chaincode Specification (Go)
The smart contract (`blockchain/chaincode/threatcast_evidence.go`) implements the `ThreatCastEvidenceContract`:

### 2.1 `CreateEvidenceRecord`
Invoked upon incident triage or active defence execution:
- Takes `recordID`, `incidentID`, `sha256Hash`, `evidenceType`, `actorIdentity`.
- Validates submitting peer's MSP identity.
- Stores immutable JSON payload into the Ledger State (`PutState`).

### 2.2 `UpdateChainOfCustody`
Records custody transitions (e.g., evidence exported to law enforcement or transferred to legal counsel):
- Appends custodial entry containing timestamp, receiver public key, and transfer authorization signature.

### 2.3 `VerifyIntegrity`
Calculates real-time SHA-256 digest of stored state and verifies that ledger history has suffered zero off-chain or bit-rot tampering.
