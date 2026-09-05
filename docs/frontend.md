# ThreatCast — Frontend Architecture & UI Design System

## 1. Architectural Stack Overview
The ThreatCast frontend is an enterprise-grade Security Operations Center (SOC) single-page application engineered with:
- **Framework**: React 19 (TypeScript 5.x)
- **Bundler & Tooling**: Vite 6.x with hot-module reloading and optimized production tree-shaking
- **Styling & Layout**: Tailwind CSS 3.4 with custom glassmorphic CSS variables and animations
- **Graph & Topology Canvas**: Cytoscape.js (WebGL & 2D canvas) for dynamic network visualization
- **Time-Series & Analytical Charts**: Recharts 2.x responsive SVG visualization library
- **Iconography**: Lucide-React (unified cybersecurity iconography)
- **Streaming & Real-Time Comms**: Native WebSocket API with automatic exponential-backoff reconnection

---

## 2. Design System: Dark Glassmorphism
The visual design language is tailored for high-tempo SOC environments operating in low-ambient lighting conditions:

### 2.1 Core Color Palette & Design Tokens
```css
:root {
  --bg-primary: #030712;         /* Deep slate/black canvas */
  --bg-surface: rgba(15, 23, 42, 0.75); /* Translucent glass card */
  --bg-surface-elevated: rgba(30, 41, 59, 0.85);
  
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-neon-cyan: rgba(6, 182, 212, 0.5);
  --border-neon-red: rgba(239, 68, 68, 0.5);
  
  --accent-cyan: #06b6d4;        /* Telemetry & normal network flows */
  --accent-indigo: #6366f1;      /* System state & AI World Model */
  --accent-amber: #f59e0b;       /* Warning & anomalous UEBA dev */
  --accent-rose: #f43f5e;        /* Critical attack trajectory / MITRE alert */
  --accent-emerald: #10b981;     /* Verified blockchain consensus */
}
```

### 2.2 Glassmorphic Component Classes
- `.glass-card`: `backdrop-blur-md bg-slate-900/60 border border-white/10 rounded-xl shadow-2xl`
- `.glow-cyan`: `box-shadow: 0 0 20px -5px rgba(6, 182, 212, 0.3)`
- `.glow-rose`: `box-shadow: 0 0 20px -5px rgba(244, 63, 94, 0.4)`

---

## 3. Page Hierarchy & Functional Catalog

| Route / View | Component File | Description & Core Features |
|---|---|---|
| `/` | `Landing.tsx` | High-impact product hero, value proposition, technical specifications, and auth gateway. |
| `/login` | `Login.tsx` | Secure login view with OAuth2 bearer token authentication and demo credential autofill. |
| `/dashboard` | `Dashboard.tsx` | Executive SOC overview: fleet health, active attack horizon gauge, MITRE heat breakdown. |
| `/monitoring` | `LiveMonitoring.tsx` | Streaming telemetry stream: packet rates, PPS/BPS charts, protocol distributions. |
| `/forecast` | `AttackForecast.tsx` | $K$-step forward attack trajectory rollout, stage transition probabilities, uncertainty bounds. |
| `/graph` | `NetworkGraph.tsx` | Interactive host topology, directional flow arcs, blast radius highlighting. |
| `/incidents` | `Incidents.tsx` | Triage workbench with severity filtering, incident timelines, and remediation shortcuts. |
| `/xai` | `ExplainableAI.tsx` | SHAP waterfall and force plots, feature contribution scores, plain-language summaries. |
| `/mitre` | `MitreMatrix.tsx` | ATT&CK v14 interactive matrix with active detections, confidence, and technique cards. |
| `/ueba` | `Ueba.tsx` | Entity behavioral baselines, peer group novelty scores, volume and rate anomalies. |
| `/threat-intel` | `ThreatIntel.tsx` | Real-time threat feed, malicious IP IOCs, reputation scores, and dark-web indicators. |
| `/simulation` | `CounterfactualSimulation.tsx` | Cyber Digital Twin workbench: parallel scenario evaluation (isolate, block, segment). |
| `/active-defence` | `ActiveDefence.tsx` | 10-point authorization execution dashboard, dry-run safety toggle, emergency kill switch. |
| `/evidence` | `EvidenceLedger.tsx` | Cryptographic Merkle tree explorer, Hyperledger Fabric chain-of-custody audit log. |
| `/assets` | `Assets.tsx` | Inventory management for servers, workstations, cloud instances, and edge gateways. |
| `/analytics` | `Analytics.tsx` | Long-term attack trends, MTTR/MTTD analytics, model calibration curves. |
| `/compliance` | `Compliance.tsx` | ISO 27001, SOC 2 Type II, and NIST CSF 2.0 mapping and control enforcement status. |
| `/ai-models` | `AiModels.tsx` | Model registry: World Model vs. Baselines (LR, Random Forest, LSTM) benchmarks. |
| `/audit` | `AuditLogs.tsx` | Immutable admin and analyst operational action logs with search and export. |
| `/settings` | `Settings.tsx` | Global SOC thresholds, retention policies, API token keys, and notification webhooks. |

---

## 4. Real-Time Streaming & WebSocket Architecture
The frontend maintains a resilient WebSocket connection to `ws://localhost:8000/api/v1/ws/telemetry`.

```typescript
// Reconnection & Telemetry Listener Pattern
export function useTelemetryStream(url: string) {
  const [telemetry, setTelemetry] = useState<TelemetryUpdate | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(url);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        setTelemetry(payload);
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 3000); // 3s exponential fallback
      };
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [url]);

  return { telemetry, connected };
}
```

---

## 5. Command Palette (Cmd+K / Ctrl+K)
An omnibar is accessible anywhere via keyboard shortcut (`Cmd+K` on macOS, `Ctrl+K` on Linux/Windows). It supports:
- Instant page navigation across all 20 views
- Direct host lookup by IP (`10.0.0.42`)
- Incident filtering by ID (`INC-9042`)
- Emergency response trigger (`Kill Switch`, `Isolate Endpoint`)
