"""Unit tests for Aerial Detector, Face Super-Resolution, and Crowd Anomaly Engine"""

import numpy as np
import cv2
from src.vision.aerial_detector import AerialDetector, DetectionBox
from src.vision.face_recognizer import AegisFaceEngine
from src.vision.crowd_anomaly import CrowdAnomalyEngine


def test_aerial_detector_sahi_tiles():
    """Verifies tile generation covers the entire frame dimensions."""
    detector = AerialDetector(tile_size=640, overlap_ratio=0.20)
    tiles = detector.generate_tiles(height=1080, width=1920)
    assert len(tiles) >= 6
    # Each tile must be 640x640 within boundary
    for x1, y1, x2, y2 in tiles:
        assert (x2 - x1) <= 640
        assert (y2 - y1) <= 640


def test_face_engine_restoration_and_embedding():
    """Tests oblique unwarping, super-resolution enlargement, and 512-D L2 normalization."""
    engine = AegisFaceEngine(match_threshold=0.75)

    # Synthetic degraded face crop (24x24 px)
    crop = np.random.randint(50, 200, (24, 24, 3), dtype=np.uint8)

    unwarped = engine.unwarp_oblique_face(crop, gimbal_pitch_deg=-45.0)
    assert unwarped.shape[0] >= crop.shape[0]

    restored = engine.super_resolve_face(unwarped, target_dim=112)
    assert restored.shape == (112, 112, 3)

    embedding = engine.extract_embedding(restored)
    assert embedding.shape == (512,)
    # Must be unit hypersphere (norm ~ 1.0)
    norm = np.linalg.norm(embedding)
    assert abs(norm - 1.0) < 1e-4


def test_crowd_divergence_flux():
    """Verifies that explosive outward velocity triggers positive divergence."""
    engine = CrowdAnomalyEngine(divergence_threshold=1.5)

    # Simulate 8 people moving radially outwards from center (100, 100)
    center = (100.0, 100.0)
    for i in range(8):
        angle = (2 * np.pi * i) / 8.0
        # t0
        r0 = 10.0
        x0 = center[0] + r0 * np.cos(angle)
        y0 = center[1] + r0 * np.sin(angle)
        engine.update_trajectories(f"P-{i}", x0, y0, timestamp_s=0.0)

        # t1 (moved outwards to r1 = 15.0)
        r1 = 15.0
        x1 = center[0] + r1 * np.cos(angle)
        y1 = center[1] + r1 * np.sin(angle)
        engine.update_trajectories(f"P-{i}", x1, y1, timestamp_s=1.0)

    velocities = engine.calculate_velocity_field()
    flux = engine.compute_divergence_flux(velocities)
    # Radial expansion must yield strong positive divergence
    assert flux > 3.0
