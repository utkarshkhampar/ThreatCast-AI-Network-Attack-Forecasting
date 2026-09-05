"""
ThreatCast - Synthetic Attack Ingestion Demo Script
Replays a realistic 5-stage cyber attack scenario:
Normal -> Reconnaissance -> Discovery -> Lateral Movement -> C2 / Exfiltration
Demonstrates the full operating loop:
Observe -> Understand -> Predict -> Explain -> Simulate -> Defend
"""

import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.synthetic_replay import synthetic_generator
from ingestion.packet_parser import PacketParser
from ingestion.flow_extractor import FlowAggregator
from feature_engineering.state_builder import StateBuilder
from graph_engine.temporal_graph import TemporalGraph
from ai_engine.models.world_model import world_model
from explainability.shap_explainer import xai_explainer
from mitre.matcher import mitre_matcher
from simulation.counterfactual import cf_simulator
from response_engine.policy_engine import policy_engine
from blockchain.client import blockchain_client


def run_demo(steps: int = 5, delay: float = 0.5):
    print("=" * 80)
    print("THREATCAST — AI-BASED NETWORK ATTACK FORECASTING DEMO")
    print("Primary Tagline: \"Don't Just Detect the Attack. Forecast Where It's Going.\"")
    print("Loop: Observe → Understand → Predict → Explain → Simulate → Defend")
    print("=" * 80)

    parser = PacketParser()
    flow_agg = FlowAggregator()
    builder = StateBuilder(window_duration=10.0)
    graph = TemporalGraph()

    stages = [
        ("STAGE 0: NORMAL BENIGN TRAFFIC", synthetic_generator.generate_normal_traffic(15)),
        ("STAGE 1: RECONNAISSANCE (PORT SWEEPS)", synthetic_generator.generate_reconnaissance(25)),
        ("STAGE 2: DISCOVERY (INTERNAL SUBNET SWEEP)", synthetic_generator.generate_discovery(20)),
        ("STAGE 3: LATERAL MOVEMENT (INTERNAL PIVOT)", synthetic_generator.generate_lateral_movement(30)),
        ("STAGE 4: COMMAND & CONTROL / EXFILTRATION", synthetic_generator.generate_c2_exfiltration(25))
    ]

    for stage_idx, (stage_title, raw_packets) in enumerate(stages[:steps]):
        print(f"\n📡 [{stage_title}]")
        print("-" * 70)
        
        parsed_packets = []
        for raw in raw_packets:
            pkt = parser.parse_raw_packet_dict(raw)
            parsed_packets.append(pkt)
            flow = flow_agg.process_packet(pkt)
            graph.add_or_update_edge(
                src_ip=pkt.src_ip,
                dst_ip=pkt.dst_ip,
                protocol=pkt.protocol,
                port=pkt.dst_port,
                bytes_count=pkt.packet_length,
                packets_count=1,
                syn_count=pkt.tcp_flags.get("SYN", 0)
            )

        # 1. Understand (State & Graph)
        active_flows = flow_agg.get_active_flow_records()
        state = builder.build_state(parsed_packets, active_flows)
        print(f"👁️  OBSERVED: Packets={state.total_packets}, PPS={state.packets_per_sec}, Port Entropy={state.port_entropy}, SYN Ratio={state.syn_ratio}")
        print(f"🕸️  GRAPH G_t: Nodes={len(graph.nodes)}, Edges={len(graph.edges)}")

        # 2. Predict (World Model Rollout)
        trajectory = world_model.forecast_k_steps(state.state_vector, k_steps=5)
        now_step = trajectory[0]
        future_step = trajectory[-1]
        print(f"🔮 PREDICTION: Current Stage='{now_step['predicted_stage']}' -> Predicted Stage='{future_step['predicted_stage']}'")
        print(f"   Attack Probability={int(future_step['attack_probability']*100)}% | Confidence={int(future_step['confidence']*100)}% ({future_step['confidence_level']}) | Uncertainty={int(future_step['uncertainty']*100)}%")

        # 3. Explain (XAI)
        explanation = xai_explainer.explain_state(state.state_vector, future_step['attack_probability'], future_step['predicted_stage'])
        top_factor = explanation["top_contributing_factors"][0]
        print(f"💡 EXPLANATION: {explanation['plain_language_summary']}")
        print(f"   Top Driver: {top_factor['feature_name']} (Weight={top_factor['attribution_weight']}, Value={top_factor['observed_value']})")

        # 4. MITRE ATT&CK Mapping
        mitre_items = mitre_matcher.match_forecast_to_techniques(
            predicted_stage=future_step['predicted_stage'],
            attack_prob=future_step['attack_probability'],
            top_features=explanation["top_contributing_factors"],
            compromised_hosts=[synthetic_generator.victim_workstation]
        )
        if mitre_items:
            m = mitre_items[0]
            print(f"🎯 MITRE ATT&CK: [{m['technique_id']}: {m['technique_name']}] ({m['assessment_statement']})")

        # 5. Simulate (Counterfactual What-If)
        if future_step['attack_probability'] >= 0.70:
            cf = cf_simulator.simulate_interventions(state.state_vector, synthetic_generator.victim_workstation)
            iso = next((s for s in cf["scenarios"] if s["scenario_id"] == "B_ISOLATE_HOST"), None)
            if iso:
                print(f"🧪 COUNTERFACTUAL WHAT-IF: If host {synthetic_generator.victim_workstation} is isolated -> Risk drops from {int(iso['initial_attack_probability']*100)}% to {int(iso['projected_attack_probability']*100)}% (Risk Reduction: {iso['risk_reduction_percentage']}%)")

        # 6. Defend (Policy Engine Recommendation)
        recs = policy_engine.evaluate_forecast(
            target_ip=synthetic_generator.victim_workstation,
            asset_criticality="MEDIUM",
            risk_score=future_step['attack_probability'] * 100.0,
            attack_prob=future_step['attack_probability'],
            predicted_stage=future_step['predicted_stage'],
            port_entropy=state.port_entropy
        )
        if recs:
            top_rec = recs[0]
            print(f"🛡️  RESPONSE POLICY: Recommended Action=[{top_rec['action_type']}] Mode=[{top_rec['recommended_mode']}] Urgency=[{top_rec['urgency']}]")

        # 7. Evidence & Blockchain Anchoring
        ev_id = f"EVID-DEMO-S{stage_idx}"
        payload = {"stage": stage_title, "state_vec": state.state_vector[:4], "prob": future_step['attack_probability']}
        p_hash = blockchain_client.hash_payload(payload)
        blockchain_client.anchor_evidence(
            evidence_id=ev_id,
            forecast_id=f"FC-S{stage_idx}",
            evidence_hash=p_hash,
            collector_id="DEMO_REPLAY",
            target_asset_id=synthetic_generator.victim_workstation,
            mitre_technique="T1595" if stage_idx <= 1 else "T1021",
            risk_score=future_step['attack_probability'] * 100.0,
            confidence_score=future_step['confidence'],
            off_chain_uri=f"s3://threatcast-demo/{ev_id}.json"
        )
        print(f"⛓️  BLOCKCHAIN INTEGRITY: Hash {p_hash[:16]}... anchored on Hyperledger Fabric mock channel")

        if delay > 0:
            time.sleep(delay)

    print("\n" + "=" * 80)
    print("✅ DEMO REPLAY COMPLETE: All 5 attack stages processed through the full ThreatCast loop.")
    print("=" * 80)


if __name__ == "__main__":
    run_demo(steps=5, delay=0.1)
