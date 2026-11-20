"""
AegisDrone Vision: Spatio-Temporal Crowd Dynamics & Violence Altercation Detector
Analyzes crowd velocity divergence flux (div v) for early stampede surge warning
and kinetic interaction graphs for real-time fight and brawl detection.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Tuple
import math
import numpy as np


@dataclass
class CrowdAnomalyReport:
    """Consolidated assessment of crowd safety status."""
    stampede_risk: str         # LOW, ELEVATED, CRITICAL
    stampede_probability: float
    divergence_flux: float
    crowd_density_pax_sqm: float
    fight_detected: bool
    fight_confidence: float
    fight_locations: List[Dict[str, float]]
    active_alerts: List[str]


class CrowdAnomalyEngine:
    """
    Spatio-temporal crowd safety & physical altercation detector.
    """

    def __init__(
        self,
        divergence_threshold: float = 1.80,
        density_critical_pax_sqm: float = 4.0,
        fight_velocity_threshold: float = 2.5
    ):
        self.divergence_threshold = divergence_threshold
        self.density_critical_pax_sqm = density_critical_pax_sqm
        self.fight_velocity_threshold = fight_velocity_threshold
        self.history_trajectories: Dict[str, List[Tuple[float, float, float]]] = {}

    def update_trajectories(self, target_id: str, x: float, y: float, timestamp_s: float):
        """Maintains sliding window of target positions (x, y, t)."""
        if target_id not in self.history_trajectories:
            self.history_trajectories[target_id] = []
        self.history_trajectories[target_id].append((x, y, timestamp_s))

        # Keep last 15 observations
        if len(self.history_trajectories[target_id]) > 15:
            self.history_trajectories[target_id].pop(0)

    def calculate_velocity_field(self) -> List[Tuple[float, float, float, float]]:
        """
        Computes instantaneous velocity vector (x, y, vx, vy) for each tracked pedestrian.
        """
        velocity_field = []
        for tid, pts in self.history_trajectories.items():
            if len(pts) >= 2:
                x0, y0, t0 = pts[-2]
                x1, y1, t1 = pts[-1]
                dt = t1 - t0
                if dt > 1e-3:
                    vx = (x1 - x0) / dt
                    vy = (y1 - y0) / dt
                    velocity_field.append((x1, y1, vx, vy))
        return velocity_field

    def compute_divergence_flux(self, velocities: List[Tuple[float, float, float, float]]) -> float:
        """
        Estimates the divergence of the velocity field div(v) = dvx/dx + dvy/dy.
        High positive divergence indicates explosive outward dispersal (panic flee).
        High negative divergence indicates crushing inward funneling (bottleneck choke).
        """
        if len(velocities) < 4:
            return 0.0

        # Mean center of crowd
        cx = sum(v[0] for v in velocities) / len(velocities)
        cy = sum(v[1] for v in velocities) / len(velocities)

        radial_divergence_sum = 0.0
        for x, y, vx, vy in velocities:
            # Vector from center to person
            dx = x - cx
            dy = y - cy
            dist = math.hypot(dx, dy)
            if dist > 1.0:
                # Dot product of velocity with outward radial unit vector
                radial_flux = (vx * dx + vy * dy) / dist
                radial_divergence_sum += radial_flux

        avg_divergence = radial_divergence_sum / len(velocities)
        return float(avg_divergence)

    def detect_fights_and_altercations(
        self,
        person_boxes: List[Dict[str, Any]]
    ) -> Tuple[bool, float, List[Dict[str, float]]]:
        """
        Identifies physical brawls:
        Occurs when two or more person bounding boxes show severe spatial proximity (< 1.5m),
        high mutual relative velocity oscillations, and high kinetic energy.
        """
        fight_detected = False
        max_conf = 0.0
        fight_locs = []

        n = len(person_boxes)
        for i in range(n):
            for j in range(i + 1, n):
                b1 = person_boxes[i]
                b2 = person_boxes[j]

                # Center distance
                c1_x = (b1["u_min"] + b1["u_max"]) / 2.0
                c1_y = (b1["v_min"] + b1["v_max"]) / 2.0
                c2_x = (b2["u_min"] + b2["u_max"]) / 2.0
                c2_y = (b2["v_min"] + b2["v_max"]) / 2.0

                pixel_dist = math.hypot(c1_x - c2_x, c1_y - c2_y)

                # If pedestrians are tangled (close contact)
                avg_width = ((b1["u_max"] - b1["u_min"]) + (b2["u_max"] - b2["u_min"])) / 2.0
                if pixel_dist < avg_width * 1.6:
                    # Check velocity magnitude if available
                    v1_mag = b1.get("speed_kmh", 0.0)
                    v2_mag = b2.get("speed_kmh", 0.0)

                    # Sudden erratic movements or grapple speeds
                    rel_speed = abs(v1_mag - v2_mag)
                    if rel_speed > self.fight_velocity_threshold or (v1_mag > 6.0 and v2_mag > 6.0):
                        conf = min(0.95, 0.65 + (rel_speed / 10.0) * 0.3)
                        fight_detected = True
                        max_conf = max(max_conf, conf)
                        fight_locs.append({
                            "u": (c1_x + c2_x) / 2.0,
                            "v": (c1_y + c2_y) / 2.0,
                            "lat": b1.get("latitude", 0.0),
                            "lon": b1.get("longitude", 0.0)
                        })

        return fight_detected, round(max_conf, 2), fight_locs

    def analyze_scene(
        self,
        person_detections: List[Dict[str, Any]],
        ground_area_sqm: float = 120.0
    ) -> CrowdAnomalyReport:
        """
        Consolidated crowd analysis pass.
        Returns safety assessment, stampede divergence index, and altercation alerts.
        """
        headcount = len(person_detections)
        density = headcount / max(1.0, ground_area_sqm)

        velocities = self.calculate_velocity_field()
        divergence = self.compute_divergence_flux(velocities)

        # Stampede risk assessment
        alerts = []
        if divergence > self.divergence_threshold and density > 2.0:
            stampede_risk = "CRITICAL"
            prob = 0.94
            alerts.append(f"PRE-STAMPEDE WARNING: Explosive crowd divergence ({divergence:.2f} m/s) with high density ({density:.1f} pax/m²)")
        elif divergence > self.divergence_threshold * 0.6 or density > self.density_critical_pax_sqm:
            stampede_risk = "ELEVATED"
            prob = 0.68
            alerts.append(f"CROWD DENSITY SURGE: Monitoring bottleneck ({density:.1f} pax/m²)")
        else:
            stampede_risk = "LOW"
            prob = 0.08

        # Altercation / Fight detection
        fight_flag, fight_conf, fight_locs = self.detect_fights_and_altercations(person_detections)
        if fight_flag:
            alerts.append(f"VIOLENT ALTERCATION DETECTED: Physical grapple in sector (conf: {fight_conf})")

        return CrowdAnomalyReport(
            stampede_risk=stampede_risk,
            stampede_probability=round(prob, 2),
            divergence_flux=round(divergence, 2),
            crowd_density_pax_sqm=round(density, 2),
            fight_detected=fight_flag,
            fight_confidence=fight_conf,
            fight_locations=fight_locs,
            active_alerts=alerts
        )
