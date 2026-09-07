"""
ThreatCast - Active Session & Client Device Telemetry Manager
Tracks live operator connections, device IPs, browser/OS fingerprints, and session termination.
"""

import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional


def parse_device_info(user_agent: Optional[str]) -> str:
    """Parses a User-Agent string into a concise, human-readable device/OS/browser string."""
    if not user_agent or user_agent == "Unknown":
        return "Local Workstation (Direct SOC)"
    
    ua = user_agent.lower()
    
    # OS
    if "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "windows" in ua:
        os_name = "Windows"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "SOC Terminal"
        
    # Browser
    if "edg" in ua:
        browser = "Edge"
    elif "chrome" in ua and "safari" in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"
    elif "curl" in ua or "python" in ua or "testclient" in ua:
        browser = "API Client"
    else:
        browser = "Web Client"
        
    return f"{os_name} · {browser}"


class SessionTracker:
    """In-memory active session tracker with thread-safe dictionary operations."""
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        # Pre-seed active admin clearance session
        self._seed_default_admin_session()

    def _seed_default_admin_session(self):
        sess_id = f"tc_sess_admin_{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat() + "Z"
        self._sessions[sess_id] = {
            "session_id": sess_id,
            "user_id": 1,
            "username": "admin",
            "email": "admin@threatcast.soc",
            "role": "SUPER_ADMIN",
            "ip_address": "127.0.0.1",
            "device": "macOS · SOC Console (Live)",
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "login_time": now,
            "last_activity": now,
            "status": "ONLINE"
        }

    def register_session(
        self,
        user_id: int,
        username: str,
        email: str,
        role: str,
        ip_address: str,
        user_agent: str
    ) -> str:
        sess_id = f"tc_sess_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat() + "Z"
        device = parse_device_info(user_agent)
        
        # Clean IP if needed (e.g. localhost ::1 to 127.0.0.1)
        clean_ip = "127.0.0.1" if ip_address in ["::1", "localhost", "testclient"] else ip_address

        self._sessions[sess_id] = {
            "session_id": sess_id,
            "user_id": user_id,
            "username": username,
            "email": email,
            "role": role,
            "ip_address": clean_ip,
            "device": device,
            "user_agent": user_agent or "SOC Console",
            "login_time": now,
            "last_activity": now,
            "status": "ONLINE"
        }
        return sess_id

    def update_heartbeat(self, username: str):
        now = datetime.utcnow().isoformat() + "Z"
        for s in self._sessions.values():
            if s["username"] == username and s["status"] == "ONLINE":
                s["last_activity"] = now

    def list_sessions(self) -> List[Dict[str, Any]]:
        sessions = list(self._sessions.values())
        sessions.sort(key=lambda x: x.get("last_activity", ""), reverse=True)
        return sessions

    def terminate_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            self._sessions[session_id]["status"] = "REVOKED"
            return True
        return False

    def get_online_count(self) -> int:
        return sum(1 for s in self._sessions.values() if s.get("status") == "ONLINE")


session_tracker = SessionTracker()
