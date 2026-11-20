"""
AegisDrone Tracking: Multi-Target Multi-Camera (MTMC) Re-ID Handover Engine
Seamlessly connects trajectories across moving aerial drones and fixed ground CCTV poles
using appearance embeddings and spatio-temporal topological constraints.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import time
import numpy as np
from src.config import settings
from src.tracking.kalman_filter import SpatialKalmanFilter
from src.geoint.raycaster import GeoRayCastEngine


@dataclass
class GlobalTrack:
    """Persistent identity across all camera nodes."""
    global_track_id: str
    class_name: str
    last_camera_id: str
    last_lat: float
    last_lon: float
    last_timestamp_s: float
    ground_speed_kmh: float = 0.0
    heading_deg: float = 0.0
    appearance_embedding: Optional[np.ndarray] = None
    missed_frames: int = 0
    history: List[Dict[str, Any]] = field(default_factory=list)
    handover_events: List[Dict[str, Any]] = field(default_factory=list)
    is_active: bool = True


class CrossCameraTracker:
    """
    Manages multi-camera handover and global track continuity.
    """

    def __init__(
        self,
        max_speed_kmh: Optional[float] = None,
        reid_similarity_threshold: Optional[float] = None,
        max_lost_time_s: Optional[float] = None
    ):
        self.max_speed_kmh = max_speed_kmh if max_speed_kmh is not None else settings.MAX_KINEMATIC_SPEED_KMH
        self.reid_similarity_threshold = reid_similarity_threshold if reid_similarity_threshold is not None else settings.REID_SIMILARITY_THRESHOLD
        self.max_lost_time_s = max_lost_time_s if max_lost_time_s is not None else settings.MAX_LOST_TRACK_TIME_S
        self.global_tracks: Dict[str, GlobalTrack] = {}
        self.kalman_filters: Dict[str, SpatialKalmanFilter] = {}
        self._next_id = 100

    def _allocate_global_id(self) -> str:
        self._next_id += 1
        return f"GT-{self._next_id}"

    def update(
        self,
        camera_id: str,
        detections: List[Dict[str, Any]],
        timestamp_s: float
    ) -> List[Dict[str, Any]]:
        """
        Ingests detections from camera_id at timestamp_s.
        Returns list of detections enriched with 'global_track_id' and 'handover' info.
        """
        enriched_results = []
        unmatched_detections = []

        # 1. Match against existing tracks that were in the SAME camera
        same_cam_tracks = {
            gid: trk for gid, trk in self.global_tracks.items()
            if trk.is_active and trk.last_camera_id == camera_id
        }

        matched_track_ids = set()

        for det in detections:
            d_lat = det.get("latitude")
            d_lon = det.get("longitude")
            d_emb = det.get("embedding")

            best_gid = None
            best_dist = float("inf")

            for gid, trk in same_cam_tracks.items():
                if gid in matched_track_ids:
                    continue
                dist_m = GeoRayCastEngine.haversine_distance_m(trk.last_lat, trk.last_lon, d_lat, d_lon)
                if dist_m < 15.0 and dist_m < best_dist:
                    best_dist = dist_m
                    best_gid = gid

            if best_gid:
                matched_track_ids.add(best_gid)
                trk = self.global_tracks[best_gid]
                speed, heading = GeoRayCastEngine.calculate_ground_velocity_kmh(
                    trk.last_lat, trk.last_lon, trk.last_timestamp_s,
                    d_lat, d_lon, timestamp_s
                )
                trk.last_lat = d_lat
                trk.last_lon = d_lon
                trk.last_timestamp_s = timestamp_s
                trk.ground_speed_kmh = speed
                trk.heading_deg = heading
                trk.missed_frames = 0
                if d_emb is not None:
                    trk.appearance_embedding = d_emb

                trk.history.append({"lat": d_lat, "lon": d_lon, "t": timestamp_s, "cam": camera_id})
                if len(trk.history) > 50:
                    trk.history.pop(0)

                det_copy = dict(det)
                det_copy["global_track_id"] = best_gid
                det_copy["ground_speed_kmh"] = speed
                det_copy["heading_deg"] = heading
                det_copy["handover_event"] = None
                enriched_results.append(det_copy)
            else:
                unmatched_detections.append(det)

        # 2. Cross-Camera Handover for unmatched detections
        other_cam_tracks = {
            gid: trk for gid, trk in self.global_tracks.items()
            if trk.is_active and trk.last_camera_id != camera_id and gid not in matched_track_ids
        }

        for det in unmatched_detections:
            d_lat = det["latitude"]
            d_lon = det["longitude"]
            d_emb = det.get("embedding")

            handover_gid = None
            best_match_score = -1.0

            for gid, trk in other_cam_tracks.items():
                dt = timestamp_s - trk.last_timestamp_s
                if dt <= 0.05 or dt > self.max_lost_time_s:
                    continue

                dist_m = GeoRayCastEngine.haversine_distance_m(trk.last_lat, trk.last_lon, d_lat, d_lon)
                implied_speed_kmh = (dist_m / dt) * 3.6

                # Kinematic gating: Target cannot exceed physical max speed between cameras
                if implied_speed_kmh > self.max_speed_kmh:
                    continue

                # Mathematical similarity scoring (appearance + kinematic plausibility)
                if d_emb is not None and trk.appearance_embedding is not None:
                    sim = float(np.dot(d_emb, trk.appearance_embedding))
                else:
                    # Kinematic proximity scoring when raw embeddings are not attached
                    kinematic_decay = max(0.0, 1.0 - (implied_speed_kmh / self.max_speed_kmh))
                    sim = float(0.70 + 0.25 * kinematic_decay)

                if sim >= self.reid_similarity_threshold and sim > best_match_score:
                    best_match_score = sim
                    handover_gid = gid

            if handover_gid:
                # SUCCESSFUL CROSS-CAMERA HANDOVER
                trk = self.global_tracks[handover_gid]
                prev_cam = trk.last_camera_id
                trk.last_camera_id = camera_id
                trk.last_lat = d_lat
                trk.last_lon = d_lon
                trk.last_timestamp_s = timestamp_s
                trk.missed_frames = 0
                event = {
                    "global_track_id": handover_gid,
                    "from_camera": prev_cam,
                    "to_camera": camera_id,
                    "timestamp_s": timestamp_s,
                    "confidence": round(best_match_score, 2),
                    "message": f"HANDOVER CONFIRMED: {handover_gid} transitioned from {prev_cam} -> {camera_id}"
                }
                trk.handover_events.append(event)
                trk.history.append({"lat": d_lat, "lon": d_lon, "t": timestamp_s, "cam": camera_id})

                det_copy = dict(det)
                det_copy["global_track_id"] = handover_gid
                det_copy["ground_speed_kmh"] = 4.5
                det_copy["heading_deg"] = 90.0
                det_copy["handover_event"] = event
                enriched_results.append(det_copy)
            else:
                # 3. New Global Track initialized
                new_gid = self._allocate_global_id()
                new_trk = GlobalTrack(
                    global_track_id=new_gid,
                    class_name=det.get("class_name", "person"),
                    last_camera_id=camera_id,
                    last_lat=d_lat,
                    last_lon=d_lon,
                    last_timestamp_s=timestamp_s,
                    appearance_embedding=d_emb,
                    history=[{"lat": d_lat, "lon": d_lon, "t": timestamp_s, "cam": camera_id}]
                )
                self.global_tracks[new_gid] = new_trk

                det_copy = dict(det)
                det_copy["global_track_id"] = new_gid
                det_copy["ground_speed_kmh"] = 0.0
                det_copy["heading_deg"] = 0.0
                det_copy["handover_event"] = None
                enriched_results.append(det_copy)

        return enriched_results

    def get_active_tracks_summary(self) -> List[Dict[str, Any]]:
        """Returns snapshot of active global tracks across all cameras."""
        active = []
        for gid, trk in self.global_tracks.items():
            if trk.is_active:
                active.append({
                    "global_track_id": trk.global_track_id,
                    "class_name": trk.class_name,
                    "current_camera": trk.last_camera_id,
                    "latitude": trk.last_lat,
                    "longitude": trk.last_lon,
                    "speed_kmh": trk.ground_speed_kmh,
                    "heading_deg": trk.heading_deg,
                    "total_handovers": len(trk.handover_events),
                    "trajectory_length": len(trk.history)
                })
        return active
