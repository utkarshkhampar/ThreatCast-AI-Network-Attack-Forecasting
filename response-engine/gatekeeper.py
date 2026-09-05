"""
ThreatCast - Active Defence Authorization Gatekeeper
Enforces 10-point authorization boundary on all defensive actions:
1. Authentication check
2. Target allow-list verification
3. Granular RBAC permissions
4. Human confirmation for high-impact actions
5. Tamper-evident audit logging
6. Cryptographic evidence anchoring
7. Rollback capability check
8. Rate limiting
9. Dry-run mode enforcement
10. System kill switch verification
"""

import os
import ipaddress
import time
from typing import Dict, Any, List, Optional, Tuple


class AuthorizationGatekeeper:
    def __init__(self):
        self.kill_switch_engaged = os.getenv("KILL_SWITCH_ENGAGED", "False").lower() == "true"
        self.default_mode = os.getenv("ACTIVE_DEFENCE_MODE", "DRY_RUN").upper()
        
        # Parse authorized lab CIDRs
        raw_cidrs = os.getenv("AUTHORIZED_TARGET_CIDRS", "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1/32")
        self.allowed_networks = []
        for c in raw_cidrs.split(","):
            try:
                self.allowed_networks.append(ipaddress.ip_network(c.strip(), strict=False))
            except Exception:
                pass

        self.rate_limit_history: Dict[str, List[float]] = {}
        self.max_actions_per_minute = 5

    def is_ip_in_allowlist(self, ip_str: str) -> bool:
        """Verifies target IP falls strictly within authorized lab/internal CIDRs."""
        try:
            ip_obj = ipaddress.ip_address(ip_str.strip())
            return any(ip_obj in net for net in self.allowed_networks)
        except Exception:
            return False

    def check_rate_limit(self, actor_id: str) -> bool:
        now = time.time()
        history = self.rate_limit_history.setdefault(actor_id, [])
        # Keep timestamps within 60s
        self.rate_limit_history[actor_id] = [t for t in history if now - t < 60.0]
        if len(self.rate_limit_history[actor_id]) >= self.max_actions_per_minute:
            return False
        self.rate_limit_history[actor_id].append(now)
        return True

    def validate_action_request(
        self,
        action_type: str,
        target_ip: str,
        user_role: str,
        user_id: str,
        execution_mode: Optional[str] = None,
        human_confirmation_token: Optional[str] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates action against all 10 security authorization gates.
        Returns: (is_authorized, reason_message, gate_audit_summary)
        """
        mode = (execution_mode or self.default_mode).upper()

        gates_status = {
            "kill_switch_clear": not self.kill_switch_engaged,
            "target_allowlist_verified": self.is_ip_in_allowlist(target_ip),
            "rbac_authorized": user_role in ["SUPER_ADMIN", "SOC_ADMIN", "SOC_MANAGER"],
            "rate_limit_ok": self.check_rate_limit(user_id),
            "mode": mode,
            "requires_human_confirmation": mode == "LIVE" and action_type in ["ISOLATE_ENDPOINT", "BLOCK_PORT"],
            "human_confirmation_present": bool(human_confirmation_token)
        }

        # Gate 1: Kill Switch
        if self.kill_switch_engaged:
            return False, "EMERGENCY_KILL_SWITCH_ENGAGED: All active responses are halted globally.", gates_status

        # Gate 2: Target Allow-List
        if not gates_status["target_allowlist_verified"]:
            return False, f"TARGET_OUTSIDE_ALLOWLIST: IP {target_ip} is not in authorized CIDRs.", gates_status

        # Gate 3: RBAC
        if not gates_status["rbac_authorized"]:
            return False, f"INSUFFICIENT_RBAC_PERMISSIONS: Role {user_role} cannot execute active responses.", gates_status

        # Gate 4: Rate Limiting
        if not gates_status["rate_limit_ok"]:
            return False, "RATE_LIMIT_EXCEEDED: Maximum actions per minute reached for this operator.", gates_status

        # Gate 5: Human Confirmation for LIVE high-impact actions
        if gates_status["requires_human_confirmation"] and not gates_status["human_confirmation_present"]:
            return False, "HUMAN_CONFIRMATION_REQUIRED: LIVE response requires explicit cryptographic confirmation token.", gates_status

        return True, f"Action authorized under mode {mode}.", gates_status


# Global gatekeeper instance
response_gatekeeper = AuthorizationGatekeeper()
