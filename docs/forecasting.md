# ThreatCast — Multi-Step Attack Forecasting

## 1. Attack Forecasting Methodology
Traditional Intrusion Detection Systems (IDS) detect compromises after damage has occurred. ThreatCast's forecasting engine forecasts attack path trajectories $K$ steps forward in time:

$$\{(P(Y_{t+k}), \sigma_{t+k}, \hat{S}_{t+k})\}_{k=1}^K$$

where:
- $k \in \{1, \dots, K\}$ denotes forward prediction horizon steps (default step duration $\Delta t = 10\text{s}$, giving lead time up to 100 seconds).
- $P(Y_{t+k})$ is the probability of malicious activity at future step $t+k$.
- $\sigma_{t+k}$ is epistemic/aleatoric uncertainty computed via Monte Carlo rollout dispersion.
- $\hat{S}_{t+k}$ is the predicted attack lifecycle stage.

---

## 2. Attack Lifecycle Progression Stages

```
   Stage 0: Normal Baseline Activity
             │
             ▼
   Stage 1: Reconnaissance (T1595 - Port Scanning & Probe)
             │
             ▼
   Stage 2: Initial Access (T1190 - Web Application Exploit)
             │
             ▼
   Stage 3: Discovery (T1046 - Network Service Discovery)
             │
             ▼
   Stage 4: Lateral Movement (T1021 - SMB/RDP Remote Services)
             │
             ▼
   Stage 5: Exfiltration (T1041 - Exfiltration Over C2 Channel)
```

---

## 3. Epistemic Uncertainty Estimation
To prevent overconfident false alarms during high-uncertainty network events, ThreatCast applies Monte Carlo perturbation sampling across latent rollouts:

$$\sigma_{t+k}^2 = \frac{1}{M} \sum_{m=1}^{M} \left( \hat{p}_{t+k}^{(m)} - \bar{p}_{t+k} \right)^2$$

where $M=20$ sampled forward paths with latent Gaussian perturbations $\epsilon \sim \mathcal{N}(0, 0.05 \cdot \mathbf{I})$.
- Low uncertainty ($\sigma < 0.05$): High-confidence trajectory $\to$ Triggers automated active defence recommendation.
- High uncertainty ($\sigma \ge 0.12$): Divergent trajectories $\to$ Requires Tier-3 analyst review before intervention.
