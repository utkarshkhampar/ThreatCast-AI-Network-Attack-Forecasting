package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// EvidenceContract provides functions for managing cryptographic evidence records
type EvidenceContract struct {
	contractapi.Contract
}

// CustodyEvent represents a single chain-of-custody transfer or audit review
type CustodyEvent struct {
	EventID   string `json:"eventId"`
	Timestamp string `json:"timestamp"`
	ActorID   string `json:"actorId"`
	Action    string `json:"action"` // e.g. "CREATED", "REVIEWED", "ESCALATED", "VERIFIED"
	Notes     string `json:"notes"`
	Signature string `json:"signature"`
}

// EvidenceRecord represents a tamper-evident cybersecurity forecast/incident record
type EvidenceRecord struct {
	EvidenceID       string         `json:"evidenceId"`
	ForecastID       string         `json:"forecastId"`
	IncidentID       string         `json:"incidentId,omitempty"`
	EvidenceHash     string         `json:"evidenceHash"`     // SHA-256 of raw telemetry/forecast payload
	PreviousHash     string         `json:"previousHash"`     // Hash of preceding evidence item (chain)
	CollectorID      string         `json:"collectorId"`
	TargetAssetID    string         `json:"targetAssetId"`
	MITRETechnique   string         `json:"mitreTechnique"`
	RiskScore        float64        `json:"riskScore"`
	ConfidenceScore  float64        `json:"confidenceScore"`
	CreatedAt        string         `json:"createdAt"`
	OffChainURI      string         `json:"offChainUri"`      // MinIO / S3 URI to immutable raw payload
	CustodyLog       []CustodyEvent `json:"custodyLog"`
	IntegrityStatus  string         `json:"integrityStatus"`  // "VALID", "REVOKED", "SUPERSEDED"
}

// VerificationResult holds the verification verdict
type VerificationResult struct {
	EvidenceID    string `json:"evidenceId"`
	AnchoredHash  string `json:"anchoredHash"`
	SuppliedHash  string `json:"suppliedHash"`
	Match         bool   `json:"match"`
	VerifiedAt    string `json:"verifiedAt"`
	VerifierID    string `json:"verifierId"`
	TamperDetected bool  `json:"tamperDetected"`
}

// InitLedger initializes the chaincode with genesis metadata
func (c *EvidenceContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	genesis := EvidenceRecord{
		EvidenceID:      "EVID-GENESIS-0000",
		ForecastID:      "FC-0000",
		EvidenceHash:    "0000000000000000000000000000000000000000000000000000000000000000",
		PreviousHash:    "GENESIS",
		CollectorID:     "SYSTEM_GENESIS",
		TargetAssetID:   "ALL",
		MITRETechnique:  "NONE",
		RiskScore:       0.0,
		ConfidenceScore: 1.0,
		CreatedAt:       time.Now().UTC().Format(time.RFC3339),
		OffChainURI:     "urn:threatcast:genesis",
		IntegrityStatus: "VALID",
		CustodyLog: []CustodyEvent{
			{
				EventID:   "CUST-0000",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				ActorID:   "SYSTEM",
				Action:    "GENESIS_INITIALIZED",
				Notes:     "ThreatCast Evidence Ledger Genesis Initialized",
			},
		},
	}
	genesisBytes, err := json.Marshal(genesis)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(genesis.EvidenceID, genesisBytes)
}

// CreateEvidenceRecord registers a new evidence bundle hash into the immutable ledger
func (c *EvidenceContract) CreateEvidenceRecord(
	ctx contractapi.TransactionContextInterface,
	evidenceID string,
	forecastID string,
	incidentID string,
	evidenceHash string,
	previousHash string,
	collectorID string,
	targetAssetID string,
	mitreTechnique string,
	riskScore float64,
	confidenceScore float64,
	offChainURI string,
) error {
	exists, err := c.RecordExists(ctx, evidenceID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("evidence record %s already exists on ledger", evidenceID)
	}

	callerID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		callerID = collectorID
	}

	record := EvidenceRecord{
		EvidenceID:      evidenceID,
		ForecastID:      forecastID,
		IncidentID:      incidentID,
		EvidenceHash:    evidenceHash,
		PreviousHash:    previousHash,
		CollectorID:     collectorID,
		TargetAssetID:   targetAssetID,
		MITRETechnique:  mitreTechnique,
		RiskScore:       riskScore,
		ConfidenceScore: confidenceScore,
		CreatedAt:       time.Now().UTC().Format(time.RFC3339),
		OffChainURI:     offChainURI,
		IntegrityStatus: "VALID",
		CustodyLog: []CustodyEvent{
			{
				EventID:   fmt.Sprintf("CUST-%d", time.Now().UnixNano()),
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				ActorID:   callerID,
				Action:    "CREATED",
				Notes:     fmt.Sprintf("Anchored by collector %s for asset %s", collectorID, targetAssetID),
			},
		},
	}

	recordBytes, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(evidenceID, recordBytes)
}

// UpdateChainOfCustody records a state transition or analyst review
func (c *EvidenceContract) UpdateChainOfCustody(
	ctx contractapi.TransactionContextInterface,
	evidenceID string,
	actorID string,
	action string,
	notes string,
) error {
	recordBytes, err := ctx.GetStub().GetState(evidenceID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordBytes == nil {
		return fmt.Errorf("evidence record %s does not exist", evidenceID)
	}

	var record EvidenceRecord
	if err := json.Unmarshal(recordBytes, &record); err != nil {
		return err
	}

	event := CustodyEvent{
		EventID:   fmt.Sprintf("CUST-%d", time.Now().UnixNano()),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		ActorID:   actorID,
		Action:    action,
		Notes:     notes,
	}
	record.CustodyLog = append(record.CustodyLog, event)

	updatedBytes, err := json.Marshal(record)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(evidenceID, updatedBytes)
}

// QueryEvidence retrieves an evidence record with full provenance
func (c *EvidenceContract) QueryEvidence(
	ctx contractapi.TransactionContextInterface,
	evidenceID string,
) (*EvidenceRecord, error) {
	recordBytes, err := ctx.GetStub().GetState(evidenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordBytes == nil {
		return nil, fmt.Errorf("evidence record %s does not exist", evidenceID)
	}

	var record EvidenceRecord
	if err := json.Unmarshal(recordBytes, &record); err != nil {
		return nil, err
	}
	return &record, nil
}

// VerifyIntegrity compares a freshly calculated SHA-256 hash against the anchored value
func (c *EvidenceContract) VerifyIntegrity(
	ctx contractapi.TransactionContextInterface,
	evidenceID string,
	suppliedHash string,
	verifierID string,
) (*VerificationResult, error) {
	record, err := c.QueryEvidence(ctx, evidenceID)
	if err != nil {
		return nil, err
	}

	match := (record.EvidenceHash == suppliedHash)
	result := VerificationResult{
		EvidenceID:     evidenceID,
		AnchoredHash:   record.EvidenceHash,
		SuppliedHash:   suppliedHash,
		Match:          match,
		VerifiedAt:     time.Now().UTC().Format(time.RFC3339),
		VerifierID:     verifierID,
		TamperDetected: !match,
	}

	// Append verification to custody log
	_ = c.UpdateChainOfCustody(
		ctx,
		evidenceID,
		verifierID,
		"INTEGRITY_VERIFIED",
		fmt.Sprintf("Hash match verdict: %v (supplied: %s)", match, suppliedHash),
	)

	return &result, nil
}

// RecordExists checks if a record exists
func (c *EvidenceContract) RecordExists(
	ctx contractapi.TransactionContextInterface,
	evidenceID string,
) (bool, error) {
	recordBytes, err := ctx.GetStub().GetState(evidenceID)
	if err != nil {
		return false, err
	}
	return recordBytes != nil, nil
}

// CalculateSHA256 helper
func CalculateSHA256(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func main() {
	cc, err := contractapi.NewChaincode(&EvidenceContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating ThreatCast evidence chaincode: %v", err))
	}
	if err := cc.Start(); err != nil {
		panic(fmt.Sprintf("Error starting ThreatCast evidence chaincode: %v", err))
	}
}
