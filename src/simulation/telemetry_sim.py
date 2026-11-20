"""
AegisDrone Simulation: Multi-UAV Patrol & Urban Telemetry Simulator
Generates synchronized MAVLink drone telemetry, synthetic surveillance frames,
pedestrian trajectories, and tactical security scenarios for CipherCop 2026.
"""

import math
import time
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import cv2
from src.config import settings
from src.geoint.raycaster import DronePose, CameraIntrinsics
from src.vision.face_recognizer import generate_synthetic_face_chip


class TacticalSimulator:
    """
    Simulates multi-drone patrol orbits, ground CCTV viewpoints,
    and realistic tactical incidents (suspect breach, crowd surge, handover).
    """

    def __init__(
        self,
        base_lat: Optional[float] = None,
        base_lon: Optional[float] = None,
        base_alt_m: Optional[float] = None
    ):
        self.base_lat = base_lat if base_lat is not None else settings.BASE_LATITUDE
        self.base_lon = base_lon if base_lon is not None else settings.BASE_LONGITUDE
        self.base_alt_m = base_alt_m if base_alt_m is not None else settings.BASE_ALTITUDE_AGL_M
        self.intrinsics = CameraIntrinsics(image_width=1280, image_height=720)
        self.start_time = time.time()

        # Simulated entities moving in the urban environment with distinct biometric identity seeds
        self.pedestrians = [
            {"id": "PED-01", "name": "Civilian A", "radius": 45.0, "speed": 1.2, "phase": 0.0, "is_suspect": False, "seed": 101},
            {"id": "PED-02", "name": "Civilian B", "radius": 60.0, "speed": -1.0, "phase": 1.2, "is_suspect": False, "seed": 102},
            {"id": "PED-03", "name": "Civilian C", "radius": 30.0, "speed": 1.5, "phase": 2.5, "is_suspect": False, "seed": 103},
            {"id": "PED-04", "name": "Civilian D", "radius": 50.0, "speed": -0.8, "phase": 3.8, "is_suspect": False, "seed": 104},
            {
                "id": "TGT-FUGITIVE",
                "name": "Rohan Sharma",
                "radius": 40.0,
                "speed": 2.2,
                "phase": 0.5,
                "is_suspect": True,
                "seed": 42,  # Enrolled identity seed in Watchlist for Rohan Sharma
                "warrant": "RED_NOTICE_FUGITIVE"
            },
        ]

    def get_drone_pose(self, drone_id: str, elapsed_s: float) -> DronePose:
        """Computes orbital patrol telemetry for a given drone."""
        if drone_id == "UAV-ALPHA-01":
            # Circular patrol orbit (radius ~ 80m, period ~ 60s)
            omega = (2 * math.pi) / 60.0
            angle = omega * elapsed_s
            radius_deg_lat = 80.0 / 111139.0
            radius_deg_lon = 80.0 / (111139.0 * math.cos(math.radians(self.base_lat)))

            lat = self.base_lat + radius_deg_lat * math.sin(angle)
            lon = self.base_lon + radius_deg_lon * math.cos(angle)
            yaw = (math.degrees(angle) + 90.0) % 360.0
            pitch = -45.0 + 5.0 * math.sin(angle * 2)
            roll = 2.0 * math.cos(angle)

            return DronePose(
                latitude=lat,
                longitude=lon,
                altitude_agl_m=self.base_alt_m + 5.0 * math.sin(angle),
                pitch_deg=pitch,
                roll_deg=roll,
                yaw_deg=yaw,
                timestamp_ms=int(time.time() * 1000)
            )
        else:
            # UAV-BRAVO-02: Stationary high-altitude surveillance vantage (75m AGL)
            return DronePose(
                latitude=self.base_lat + 0.0003,
                longitude=self.base_lon + 0.0003,
                altitude_agl_m=75.0,
                pitch_deg=-60.0,
                roll_deg=0.0,
                yaw_deg=220.0,
                timestamp_ms=int(time.time() * 1000)
            )

    def get_ground_cctv_pose(self, cctv_id: str) -> DronePose:
        """Fixed ground pole camera (emulated as low altitude camera pose)."""
        if cctv_id == "CCTV-POLE-04":
            return DronePose(
                latitude=self.base_lat + 0.00015,
                longitude=self.base_lon + 0.00020,
                altitude_agl_m=6.5,  # 6.5m lamp post
                pitch_deg=-15.0,     # Low angle depression
                roll_deg=0.0,
                yaw_deg=180.0,
                timestamp_ms=int(time.time() * 1000)
            )
        else:
            return DronePose(
                latitude=self.base_lat - 0.00020,
                longitude=self.base_lon - 0.00015,
                altitude_agl_m=7.0,
                pitch_deg=-20.0,
                roll_deg=0.0,
                yaw_deg=45.0,
                timestamp_ms=int(time.time() * 1000)
            )

    def get_simulated_scene(
        self,
        camera_id: str,
        elapsed_s: float
    ) -> Tuple[np.ndarray, DronePose, List[Dict[str, Any]]]:
        """
        Synthesizes a visual frame (1280x720) and ground-truth target bounding boxes
        for the given camera.
        """
        w, h = self.intrinsics.image_width, self.intrinsics.image_height
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Tactical dark slate background
        frame[:] = (24, 28, 34)
        for x in range(0, w, 80):
            cv2.line(frame, (x, 0), (x, h), (35, 40, 48), 1)
        for y in range(0, h, 80):
            cv2.line(frame, (0, y), (w, y), (35, 40, 48), 1)

        # Get camera pose
        if "UAV" in camera_id:
            pose = self.get_drone_pose(camera_id, elapsed_s)
        else:
            pose = self.get_ground_cctv_pose(camera_id)

        # Draw HUD overlays
        cv2.putText(
            frame, f"CAM: {camera_id} | ALT: {pose.altitude_agl_m:.1f}m | PITCH: {pose.pitch_deg:.1f}deg",
            (25, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 200), 2, cv2.LINE_AA
        )
        cv2.putText(
            frame, f"LAT: {pose.latitude:.6f} | LON: {pose.longitude:.6f} | YAW: {pose.yaw_deg:.1f}deg",
            (25, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (160, 200, 220), 1, cv2.LINE_AA
        )

        detections = []

        # Project entities into camera sensor view
        for idx, ped in enumerate(self.pedestrians):
            omega = (2 * math.pi * ped["speed"]) / 80.0
            current_angle = ped["phase"] + omega * elapsed_s
            p_east = ped["radius"] * math.cos(current_angle)
            p_north = ped["radius"] * math.sin(current_angle)

            # Convert to target GPS
            lat_offset = p_north / 111139.0
            lon_offset = p_east / (111139.0 * math.cos(math.radians(self.base_lat)))
            t_lat = self.base_lat + lat_offset
            t_lon = self.base_lon + lon_offset

            # Sensor perspective mapping
            base_u = int(w / 2 + (p_east * 8.0) * math.cos(math.radians(pose.yaw_deg)) - (p_north * 8.0) * math.sin(math.radians(pose.yaw_deg)))
            base_v = int(h / 2 + (p_north * 6.0) * math.cos(math.radians(pose.yaw_deg)) + (p_east * 6.0) * math.sin(math.radians(pose.yaw_deg)))

            u = max(60, min(w - 100, base_u))
            v = max(90, min(h - 120, base_v))

            box_w = int(28.0 * (60.0 / max(10.0, pose.altitude_agl_m)))
            box_h = int(65.0 * (60.0 / max(10.0, pose.altitude_agl_m)))

            u_min, v_min = u - box_w // 2, v - box_h // 2
            u_max, v_max = u + box_w // 2, v + box_h // 2

            # Render synthetic pedestrian figure
            color = (0, 0, 255) if ped["is_suspect"] else (200, 200, 200)
            cv2.rectangle(frame, (u_min, v_min), (u_max, v_max), color, 2)

            # Stamp identity face chip with perspective scaling in the face region
            head_h = max(18, box_h // 3)
            face_chip = generate_synthetic_face_chip(seed=ped["seed"], size=112)
            face_resized = cv2.resize(face_chip, (box_w, head_h))

            # Blend into frame face box with boundary clamping
            v_start = max(0, v_min)
            u_start = max(0, u_min)
            v_end = max(0, min(h, v_min + head_h))
            u_end = max(0, min(w, u_min + box_w))

            h_slice = v_end - v_start
            w_slice = u_end - u_start
            if h_slice > 0 and w_slice > 0:
                frame[v_start:v_end, u_start:u_end] = face_resized[:h_slice, :w_slice]

            detections.append({
                "target_id": ped["id"],
                "class_name": "person",
                "u_min": float(u_min),
                "v_min": float(v_min),
                "u_max": float(u_max),
                "v_max": float(v_max),
                "latitude": round(t_lat, 7),
                "longitude": round(t_lon, 7),
                "is_suspect": ped["is_suspect"],
                "suspect_name": ped["name"] if ped["is_suspect"] else None,
                "privacy_unmasked": ped["is_suspect"]
            })

        return frame, pose, detections
