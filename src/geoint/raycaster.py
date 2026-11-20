"""
AegisDrone-GEOINT: 4D Photogrammetric Optical-Axis Ray-Casting Engine
Transforms 2D sensor pixel detections (u, v) into WGS84 ground coordinates (lat, lon, elevation)
using instantaneous drone pose, gimbal kinematics, and camera intrinsic calibration.
"""

import math
from dataclasses import dataclass
from typing import Tuple, Dict, Any, List, Optional
import numpy as np

# WGS84 Ellipsoid constants
WGS84_A = 6378137.0  # semi-major axis (meters)
WGS84_F = 1 / 298.257223563  # flattening
WGS84_B = WGS84_A * (1 - WGS84_F)  # semi-minor axis


@dataclass
class CameraIntrinsics:
    """Camera intrinsic optical parameters."""
    image_width: int = 1920
    image_height: int = 1080
    fx: float = 1440.0  # Focal length in pixels x
    fy: float = 1440.0  # Focal length in pixels y
    cx: float = 960.0   # Optical center x
    cy: float = 540.0   # Optical center y
    hfov_deg: float = 67.4  # Horizontal Field of View (degrees)
    vfov_deg: float = 41.1  # Vertical Field of View (degrees)


@dataclass
class DronePose:
    """Instantaneous UAV state from MAVLink telemetry."""
    latitude: float         # WGS84 degrees
    longitude: float        # WGS84 degrees
    altitude_agl_m: float   # Above Ground Level altitude in meters
    pitch_deg: float        # Gimbal/drone pitch (-90 is nadir/downward, 0 is horizontal)
    roll_deg: float         # Drone roll (bank angle)
    yaw_deg: float          # Drone heading (0=North, 90=East, 180=South, 270=West)
    timestamp_ms: int = 0


class GeoRayCastEngine:
    """
    Closed-form 4D photogrammetric raycaster.
    Maps pixel (u, v) on camera sensor directly to real-world WGS84 coordinates.
    Uses North-East-Down (NED) aeronautical reference frames.
    """

    def __init__(self, intrinsics: Optional[CameraIntrinsics] = None):
        self.intrinsics = intrinsics or CameraIntrinsics()

    def pixel_to_ground_coord(
        self,
        u: float,
        v: float,
        pose: DronePose,
        ground_elevation_m: float = 0.0
    ) -> Optional[Dict[str, Any]]:
        """
        Projects single pixel coordinate (u, v) to ground coordinate (lat, lon).
        Returns None if the ray points above the horizon (no ground intersection).
        """
        K = self.intrinsics

        # 1. Normalized ray in camera coordinate system:
        # X_cam: right, Y_cam: down, Z_cam: optical axis forward
        xc = (u - K.cx) / K.fx
        yc = (v - K.cy) / K.fy
        zc = 1.0

        r_cam = np.array([xc, yc, zc], dtype=np.float64)
        r_cam /= np.linalg.norm(r_cam)

        # 2. Camera to Aircraft Body Frame (NED: X forward, Y right, Z down):
        # Forward (X_body) = Z_cam
        # Right (Y_body) = X_cam
        # Down (Z_body) = Y_cam
        r_body = np.array([r_cam[2], r_cam[0], r_cam[1]], dtype=np.float64)

        # 3. Aircraft Body Frame to World Reference Frame (NED):
        # Standard aeronautical Euler rotations:
        # Yaw (psi) about +Z (Down)
        # Pitch (theta) about +Y (East/Right). Pitch < 0 means looking downward towards ground.
        # Roll (phi) about +X (North/Forward)
        phi = math.radians(pose.roll_deg)
        theta = math.radians(pose.pitch_deg)
        psi = math.radians(pose.yaw_deg)

        Rx = np.array([
            [1.0, 0.0, 0.0],
            [0.0, math.cos(phi), -math.sin(phi)],
            [0.0, math.sin(phi), math.cos(phi)]
        ], dtype=np.float64)

        Ry = np.array([
            [math.cos(theta), 0.0, math.sin(theta)],
            [0.0, 1.0, 0.0],
            [-math.sin(theta), 0.0, math.cos(theta)]
        ], dtype=np.float64)

        Rz = np.array([
            [math.cos(psi), -math.sin(psi), 0.0],
            [math.sin(psi), math.cos(psi), 0.0],
            [0.0, 0.0, 1.0]
        ], dtype=np.float64)

        # R_ned = Rz * Ry * Rx
        R_ned = Rz @ Ry @ Rx
        r_ned = R_ned @ r_body

        r_north, r_east, r_down = r_ned[0], r_ned[1], r_ned[2]

        # For ground intersection, ray must have a positive downward component
        if r_down <= 1e-4:
            # Ray points horizontal or up towards sky
            return None

        # 4. Ray-Plane intersection:
        # Distance t along ray to intersect ground plane:
        delta_h = max(0.1, pose.altitude_agl_m - ground_elevation_m)
        t = delta_h / r_down

        offset_north = r_north * t
        offset_east = r_east * t
        ground_slant_range = math.sqrt(offset_north**2 + offset_east**2 + delta_h**2)
        ground_distance = math.hypot(offset_north, offset_east)

        # 5. Geodetic transformation (Tangent Plane offsets to WGS84 Lat/Lon)
        lat_rad = math.radians(pose.latitude)
        meters_per_deg_lat = 111132.954 - 559.822 * math.cos(2 * lat_rad) + 1.175 * math.cos(4 * lat_rad)
        meters_per_deg_lon = (math.pi / 180.0) * WGS84_A * math.cos(lat_rad) / math.sqrt(1.0 - (WGS84_F * (2 - WGS84_F) * (math.sin(lat_rad)**2)))

        target_lat = pose.latitude + (offset_north / meters_per_deg_lat)
        target_lon = pose.longitude + (offset_east / meters_per_deg_lon)

        return {
            "latitude": round(target_lat, 7),
            "longitude": round(target_lon, 7),
            "elevation_m": round(ground_elevation_m, 2),
            "offset_north_m": round(float(offset_north), 2),
            "offset_east_m": round(float(offset_east), 2),
            "slant_range_m": round(float(ground_slant_range), 2),
            "ground_distance_m": round(float(ground_distance), 2)
        }

    def bbox_to_ground_polygon(
        self,
        u_min: float,
        v_min: float,
        u_max: float,
        v_max: float,
        pose: DronePose,
        ground_elevation_m: float = 0.0
    ) -> Optional[Dict[str, Any]]:
        """
        Projects 4 corners of 2D bounding box and centroid to ground coordinates.
        Computes real-world ground footprint area (m^2).
        """
        u_mid = (u_min + u_max) / 2.0
        v_bottom = v_max  # Ground contact point is bottom of bounding box

        centroid = self.pixel_to_ground_coord(u_mid, v_bottom, pose, ground_elevation_m)
        if not centroid:
            return None

        # Project 4 corners
        corners = [
            self.pixel_to_ground_coord(u_min, v_min, pose, ground_elevation_m),
            self.pixel_to_ground_coord(u_max, v_min, pose, ground_elevation_m),
            self.pixel_to_ground_coord(u_max, v_max, pose, ground_elevation_m),
            self.pixel_to_ground_coord(u_min, v_max, pose, ground_elevation_m),
        ]

        if any(c is None for c in corners):
            polygon_coords = []
        else:
            polygon_coords = [[c["latitude"], c["longitude"]] for c in corners]

        return {
            "target_gps": {
                "latitude": centroid["latitude"],
                "longitude": centroid["longitude"],
                "ground_distance_m": centroid["ground_distance_m"],
                "slant_range_m": centroid["slant_range_m"],
            },
            "ground_polygon": polygon_coords,
        }

    @staticmethod
    def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance in meters between two WGS84 points."""
        R = 6371000.0  # Earth radius in meters
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @staticmethod
    def calculate_ground_velocity_kmh(
        prev_lat: float, prev_lon: float, prev_time_s: float,
        curr_lat: float, curr_lon: float, curr_time_s: float
    ) -> Tuple[float, float]:
        """
        Computes ground speed (km/h) and heading direction (degrees) between two observations.
        """
        dt = curr_time_s - prev_time_s
        if dt <= 1e-3:
            return 0.0, 0.0

        dist_m = GeoRayCastEngine.haversine_distance_m(prev_lat, prev_lon, curr_lat, curr_lon)
        speed_mps = dist_m / dt
        speed_kmh = speed_mps * 3.6

        # Bearing
        lat1 = math.radians(prev_lat)
        lat2 = math.radians(curr_lat)
        dlon = math.radians(curr_lon - prev_lon)
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        heading_deg = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0

        return round(speed_kmh, 2), round(heading_deg, 1)
