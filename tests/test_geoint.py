"""Unit tests for 4D Ray-Cast Photogrammetric Georeferencing & Geofencing"""

import pytest
import numpy as np
from src.geoint.raycaster import GeoRayCastEngine, DronePose, CameraIntrinsics
from src.geoint.geofence import GeofenceManager, GeofencePolygon


def test_raycaster_nadir_projection():
    """Nadir (-90 deg pitch) pointing straight down should intersect ground directly under drone."""
    intrinsics = CameraIntrinsics()
    engine = GeoRayCastEngine(intrinsics)

    pose = DronePose(
        latitude=17.445620,
        longitude=78.349810,
        altitude_agl_m=50.0,
        pitch_deg=-90.0,  # Straight down
        roll_deg=0.0,
        yaw_deg=0.0
    )

    # Center pixel (cx, cy)
    result = engine.pixel_to_ground_coord(intrinsics.cx, intrinsics.cy, pose)
    assert result is not None
    # At nadir, target lat/lon should match drone lat/lon within sub-meter precision
    assert abs(result["latitude"] - pose.latitude) < 1e-5
    assert abs(result["longitude"] - pose.longitude) < 1e-5
    assert result["ground_distance_m"] < 1.0


def test_raycaster_oblique_projection():
    """Oblique angle (-45 deg pitch) with heading North (yaw=0) should project North."""
    intrinsics = CameraIntrinsics()
    engine = GeoRayCastEngine(intrinsics)

    pose = DronePose(
        latitude=17.445620,
        longitude=78.349810,
        altitude_agl_m=50.0,
        pitch_deg=-45.0,  # 45 degrees downward
        roll_deg=0.0,
        yaw_deg=0.0       # Heading North
    )

    result = engine.pixel_to_ground_coord(intrinsics.cx, intrinsics.cy, pose)
    assert result is not None
    # For 50m altitude at 45 deg, ground distance is ~50m North
    assert result["offset_north_m"] > 35.0
    assert result["latitude"] > pose.latitude
    assert result["ground_distance_m"] > 40.0


def test_geofence_breach_detection():
    """Verifies polygon inclusion ray-casting algorithm."""
    mgr = GeofenceManager()
    zone = GeofencePolygon(
        zone_id="TEST-RESTRICTED",
        zone_name="Restricted Runway",
        zone_type="RESTRICTED_ZONE",
        severity="CRITICAL",
        vertices=[
            [10.0, 10.0],
            [10.0, 20.0],
            [20.0, 20.0],
            [20.0, 10.0]
        ]
    )
    mgr.register_geofence(zone)

    # Point inside
    alerts_inside = mgr.evaluate_target("TGT-1", 15.0, 15.0)
    assert len(alerts_inside) == 1
    assert alerts_inside[0]["severity"] == "CRITICAL"

    # Point outside
    alerts_outside = mgr.evaluate_target("TGT-2", 25.0, 25.0)
    assert len(alerts_outside) == 0
