# ThreatCast — Latent World Model Mathematical Formulation

## 1. World Model Cyber Formulation
In contrast to model-free threat detectors, ThreatCast builds an internal model of the network environment. Drawing inspiration from model-based reinforcement learning and deep state-space models, we adapt world modeling to discrete-time cybersecurity networks.

### Formal Tuple Definition:
A cyber environment is formalized as a continuous-space Markov Decision Process (MDP):

$$\mathcal{M} = \langle \mathcal{S}, \mathcal{A}, \mathcal{T}, \mathcal{R}, \gamma \rangle$$

- $\mathcal{S} \subset \mathbb{R}^{16}$: Continuous space of network telemetry states.
- $\mathcal{A}$: Discrete set of defender intervention actions:
  $$\mathcal{A} = \{\text{NONE}, \text{ISOLATE\_HOST}, \text{BLOCK\_PORT}, \text{SEGMENT\_SUBNET}\}$$
- $\mathcal{T}: \mathcal{S} \times \mathcal{A} \to \mathcal{S}$: Transition dynamics describing network evolution.
- $\mathcal{R}: \mathcal{S} \to [0, 1]$: Risk penalty function representing adversary compromise.

---

## 2. Latent Representation & Dynamics

Direct forward prediction in high-dimensional observation space $\mathcal{S}$ is computationally intractable and prone to sensor noise overfitting. We project $\mathcal{S}$ into an invariant latent manifold $\mathcal{Z} \subset \mathbb{R}^8$:

### 2.1 Encoder Network ($g_\theta$)
$$\mathbf{z}_t = g_\theta(\mathbf{s}_t) = \text{LayerNorm}(\sigma(\mathbf{W}_e \mathbf{s}_t + \mathbf{b}_e))$$

### 2.2 Latent Forward Dynamics ($f_\phi$)
$$\mathbf{z}_{t+1} = f_\phi(\mathbf{z}_t, \mathbf{a}_t) = \mathbf{z}_t + \Delta \mathbf{z}_t$$
$$\Delta \mathbf{z}_t = \tanh(\mathbf{W}_d [\mathbf{z}_t \,\|\, \mathbf{e}(\mathbf{a}_t)] + \mathbf{b}_d)$$

where $\mathbf{e}(\mathbf{a}_t) \in \mathbb{R}^4$ is the one-hot embedding of the defender action.

### 2.3 Recursive Rollout
For any horizon $K \ge 1$:
$$\mathbf{z}_{t+k} = f_\phi(\mathbf{z}_{t+k-1}, \mathbf{a}_{t+k-1})$$

---

## 3. Objective & Loss Functions
The model parameters $(\theta, \phi, \psi)$ are optimized end-to-end via multi-task joint objective:

$$\mathcal{L}_{total} = \mathcal{L}_{trans} + \lambda_1 \mathcal{L}_{stage} + \lambda_2 \mathcal{L}_{prob} + \lambda_3 \mathcal{L}_{reg}$$

1. **Latent Transition Loss**:
   $$\mathcal{L}_{trans} = \frac{1}{K} \sum_{k=1}^K \|\mathbf{z}_{t+k} - g_\theta(\mathbf{s}_{t+k})\|_2^2$$
2. **Stage Classification Cross-Entropy**:
   $$\mathcal{L}_{stage} = -\sum_{c=1}^C y_{t+k, c} \log \hat{y}_{t+k, c}$$
3. **Probability Brier Calibration Loss**:
   $$\mathcal{L}_{prob} = (\hat{p}_{t+k} - y_{t+k}^{binary})^2$$
4. **Weight Regularization**:
   $$\mathcal{L}_{reg} = \|\mathbf{W}\|_F^2$$
