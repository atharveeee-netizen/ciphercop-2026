"""
AegisDrone Tracking: 3D Spatial Kalman Filter
Maintains state estimates (x, y, z, vx, vy, vz) for moving targets across drone and CCTV viewpoints.
"""

import numpy as np


class SpatialKalmanFilter:
    """
    Linear Kalman Filter for 3D state tracking:
    State: [x, y, z, vx, vy, vz]^T
    Measurement: [x, y, z]^T
    """

    def __init__(self, init_x: float, init_y: float, init_z: float = 0.0):
        # State vector: [x, y, z, vx, vy, vz]
        self.x = np.array([init_x, init_y, init_z, 0.0, 0.0, 0.0], dtype=np.float64)

        # State covariance matrix P
        self.P = np.eye(6, dtype=np.float64) * 10.0
        self.P[3:, 3:] *= 100.0  # High initial velocity uncertainty

        # Measurement matrix H (we measure x, y, z)
        self.H = np.zeros((3, 6), dtype=np.float64)
        self.H[0, 0] = 1.0
        self.H[1, 1] = 1.0
        self.H[2, 2] = 1.0

        # Measurement noise R
        self.R = np.eye(3, dtype=np.float64) * 2.0

        # Process noise Q
        self.Q = np.eye(6, dtype=np.float64) * 0.1
        self.Q[3:, 3:] *= 0.5

    def predict(self, dt: float) -> np.ndarray:
        """Propagates state forward by time step dt."""
        # State transition matrix F
        F = np.eye(6, dtype=np.float64)
        F[0, 3] = dt
        F[1, 4] = dt
        F[2, 5] = dt

        self.x = F @ self.x
        self.P = F @ self.P @ F.T + self.Q
        return self.x[:3]

    def update(self, meas_x: float, meas_y: float, meas_z: float = 0.0) -> np.ndarray:
        """Updates state with new measurement [x, y, z]."""
        z = np.array([meas_x, meas_y, meas_z], dtype=np.float64)
        y = z - self.H @ self.x  # Innovation

        S = self.H @ self.P @ self.H.T + self.R  # Innovation covariance
        K = self.P @ self.H.T @ np.linalg.inv(S)  # Kalman gain

        self.x = self.x + K @ y
        I = np.eye(6, dtype=np.float64)
        self.P = (I - K @ self.H) @ self.P
        return self.x[:3]

    @property
    def position(self) -> np.ndarray:
        return self.x[:3]

    @property
    def velocity(self) -> np.ndarray:
        return self.x[3:]
