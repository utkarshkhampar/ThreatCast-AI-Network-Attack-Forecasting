"""
ThreatCast - Real-Time WebSocket Streaming Connection Manager
Streams live telemetry, network graph modifications, attack forecasts, and incident alerts.
"""

import json
import logging
from typing import List, Dict, Any, Set
from fastapi import WebSocket

logger = logging.getLogger("threatcast.websockets")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("Client connected to WebSocket stream. Total active: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info("Client disconnected from WebSocket stream. Remaining: %d", len(self.active_connections))

    async def broadcast_json(self, data: Dict[str, Any]):
        """Broadcasts structured event to all active WebSocket clients."""
        if not self.active_connections:
            return

        dead_connections = []
        payload_str = json.dumps(data)

        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.warning("Error sending WebSocket message to client: %s", e)
                dead_connections.append(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)

    async def broadcast_telemetry(self, flow_dict: Dict[str, Any]):
        await self.broadcast_json({
            "event_type": "TELEMETRY_FLOW",
            "topic": "network.flow",
            "data": flow_dict
        })

    async def broadcast_forecast(self, forecast_dict: Dict[str, Any]):
        await self.broadcast_json({
            "event_type": "ATTACK_FORECAST_UPDATE",
            "topic": "attack.forecasts",
            "data": forecast_dict
        })

    async def broadcast_alert(self, alert_dict: Dict[str, Any]):
        await self.broadcast_json({
            "event_type": "THREAT_ALERT",
            "topic": "threat.events",
            "data": alert_dict
        })


# Global WebSocket connection manager
ws_manager = ConnectionManager()
