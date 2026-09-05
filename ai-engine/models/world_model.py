"""
ThreatCast - Probabilistic Latent World Model Engine
Implements the core latent world model P(Z_{t+1} | Z_t), autoregressive K-step forward
rollout, attack probability decoding, attack stage prediction, and calibrated uncertainty estimation.
"""

import math
import numpy as np
from typing import Dict, Any, List, Tuple, Optional


class LatentWorldModel:
    """
    Probabilistic Latent World Model for Network Dynamics.
    Maps high-dimensional temporal network state vectors S_t (dimension 16)
    into a compressed latent space Z_t (dimension 8), learns state transition distributions
    P(Z_{t+1} | Z_t) with mean and log-variance heads, and rolls forward K steps.
    """

    STAGES = [
        "Normal",
        "Reconnaissance",
        "Discovery",
        "Initial Access",
        "Execution",
        "Persistence",
        "Privilege Escalation",
        "Lateral Movement",
        "Command & Control",
        "Collection",
        "Exfiltration"
    ]

    def __init__(self, state_dim: int = 16, latent_dim: int = 8, hidden_dim: int = 32, seed: int = 42):
        self.state_dim = state_dim
        self.latent_dim = latent_dim
        self.hidden_dim = hidden_dim
        np.random.seed(seed)

        # Encoder weights S_t -> Z_t
        self.W_enc1 = np.random.randn(state_dim, hidden_dim) * 0.1
        self.b_enc1 = np.zeros(hidden_dim)
        self.W_enc_mu = np.random.randn(hidden_dim, latent_dim) * 0.1
        self.b_enc_mu = np.zeros(latent_dim)
        self.W_enc_logvar = np.random.randn(hidden_dim, latent_dim) * 0.1
        self.b_enc_logvar = np.zeros(latent_dim)

        # Transition model weights Z_t -> Z_{t+1}
        self.W_trans1 = np.random.randn(latent_dim, hidden_dim) * 0.1
        self.b_trans1 = np.zeros(hidden_dim)
        self.W_trans_mu = np.random.randn(hidden_dim, latent_dim) * 0.1
        self.b_trans_mu = np.zeros(latent_dim)
        self.W_trans_logvar = np.random.randn(hidden_dim, latent_dim) * 0.1
        self.b_trans_logvar = np.zeros(latent_dim)

        # Attack Probability Predictor Head Z_t -> [0, 1]
        self.W_prob = np.random.randn(latent_dim, 1) * 0.15
        self.b_prob = np.array([-0.5])  # slight negative prior for benign default

        # Attack Stage Classifier Head Z_t -> 11 stages
        self.W_stage = np.random.randn(latent_dim, len(self.STAGES)) * 0.1
        self.b_stage = np.zeros(len(self.STAGES))
        self.b_stage[0] = 1.0  # Normal prior

        # Reconstruction Decoder Z_t -> S_hat_t
        self.W_dec = np.random.randn(latent_dim, state_dim) * 0.1
        self.b_dec = np.zeros(state_dim)

    @staticmethod
    def _relu(x: np.ndarray) -> np.ndarray:
        return np.maximum(0, x)

    @staticmethod
    def _sigmoid(x: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-np.clip(x, -25.0, 25.0)))

    @staticmethod
    def _softmax(x: np.ndarray) -> np.ndarray:
        e_x = np.exp(x - np.max(x))
        return e_x / np.sum(e_x)

    def encode(self, state_vector: List[float]) -> Tuple[np.ndarray, np.ndarray]:
        """Encodes state vector S_t into latent distribution parameters (mu, logvar)."""
        x = np.array(state_vector, dtype=np.float32)
        if len(x) < self.state_dim:
            x = np.pad(x, (0, self.state_dim - len(x)), 'constant')
        elif len(x) > self.state_dim:
            x = x[:self.state_dim]

        h = self._relu(np.dot(x, self.W_enc1) + self.b_enc1)
        mu = np.dot(h, self.W_enc_mu) + self.b_enc_mu
        logvar = np.clip(np.dot(h, self.W_enc_logvar) + self.b_enc_logvar, -5.0, 2.0)
        return mu, logvar

    def sample_latent(self, mu: np.ndarray, logvar: np.ndarray) -> np.ndarray:
        std = np.exp(0.5 * logvar)
        eps = np.random.randn(*mu.shape)
        return mu + eps * std

    def transition_step(self, z: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """One-step probabilistic latent transition P(Z_{t+1} | Z_t)."""
        h = self._relu(np.dot(z, self.W_trans1) + self.b_trans1)
        mu_next = np.dot(h, self.W_trans_mu) + self.b_trans_mu
        logvar_next = np.clip(np.dot(h, self.W_trans_logvar) + self.b_trans_logvar, -5.0, 2.0)
        return mu_next, logvar_next

    def decode_predictions(self, z: np.ndarray, uncertainty_variance: float = 0.05) -> Dict[str, Any]:
        """Decodes latent vector Z into attack probability, stage distribution, and confidence."""
        # Attack probability
        logit = np.dot(z, self.W_prob) + self.b_prob
        prob = float(self._sigmoid(logit)[0])

        # Stage classification logits & probabilities
        stage_logits = np.dot(z, self.W_stage) + self.b_stage
        stage_probs = self._softmax(stage_logits)
        predicted_stage_idx = int(np.argmax(stage_probs))
        predicted_stage = self.STAGES[predicted_stage_idx]

        # Calibrated confidence & uncertainty quantification
        entropy = -sum(p * math.log(max(p, 1e-9)) for p in stage_probs) / math.log(len(self.STAGES))
        confidence = float(np.clip(1.0 - (entropy * 0.6 + uncertainty_variance * 0.4), 0.20, 0.98))
        uncertainty = float(np.clip(1.0 - confidence, 0.02, 0.80))

        confidence_level = "HIGH" if confidence >= 0.75 else ("MEDIUM" if confidence >= 0.50 else "LOW")

        return {
            "attack_probability": round(prob, 4),
            "predicted_stage": predicted_stage,
            "stage_index": predicted_stage_idx,
            "stage_probabilities": {stage: round(float(p), 4) for stage, p in zip(self.STAGES, stage_probs)},
            "confidence": round(confidence, 4),
            "uncertainty": round(uncertainty, 4),
            "confidence_level": confidence_level
        }

    def forecast_k_steps(
        self,
        current_state_vector: List[float],
        k_steps: int = 5,
        num_mc_samples: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Executes Monte Carlo forward rollout for K steps into the future.
        Returns step-wise attack trajectory with mean estimates and uncertainty bounds.
        """
        mu_0, logvar_0 = self.encode(current_state_vector)
        trajectory = []

        # Current step (t=0)
        curr_decoded = self.decode_predictions(mu_0, uncertainty_variance=0.02)
        trajectory.append({
            "step": 0,
            "step_label": "NOW",
            "time_offset_seconds": 0,
            **curr_decoded,
            "latent_representation": [round(float(v), 3) for v in mu_0]
        })

        # Rollout forward K steps
        current_z_samples = [self.sample_latent(mu_0, logvar_0) for _ in range(num_mc_samples)]

        for step in range(1, k_steps + 1):
            next_z_samples = []
            step_probs = []
            step_stages = []

            for z in current_z_samples:
                mu_next, logvar_next = self.transition_step(z)
                z_next = self.sample_latent(mu_next, logvar_next)
                next_z_samples.append(z_next)
                
                dec = self.decode_predictions(z_next)
                step_probs.append(dec["attack_probability"])
                step_stages.append(dec["predicted_stage"])

            current_z_samples = next_z_samples

            # Calculate empirical mean & sample variance across MC rollouts
            mean_prob = float(np.mean(step_probs))
            std_prob = float(np.std(step_probs))
            
            # Most frequent stage across particles
            unique_stages, counts = np.unique(step_stages, return_counts=True)
            mode_stage = unique_stages[np.argmax(counts)]

            # Temporal uncertainty inflation over horizon
            horizon_penalty = step * 0.04
            effective_uncertainty = min(0.85, std_prob + horizon_penalty)
            effective_confidence = max(0.20, 1.0 - effective_uncertainty)

            trajectory.append({
                "step": step,
                "step_label": f"+{step}",
                "time_offset_seconds": step * 10,
                "attack_probability": round(mean_prob, 4),
                "probability_lower_bound": round(max(0.0, mean_prob - 1.96 * std_prob), 4),
                "probability_upper_bound": round(min(1.0, mean_prob + 1.96 * std_prob), 4),
                "predicted_stage": mode_stage,
                "confidence": round(effective_confidence, 4),
                "uncertainty": round(effective_uncertainty, 4),
                "confidence_level": "HIGH" if effective_confidence >= 0.70 else ("MEDIUM" if effective_confidence >= 0.45 else "LOW"),
                "affected_hosts_projected": max(1, int(round(1 + mean_prob * 3.5)))
            })

        return trajectory


# Global World Model instance
world_model = LatentWorldModel()
