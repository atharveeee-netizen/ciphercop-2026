"""
AegisDrone Tactical C2 Server: Asynchronous FastAPI Hub & Real-Time WebSocket Engine
Integrates 4D Ray-Cast GEOINT, Aerial Vision, Facial Super-Resolution, Crowd Anomaly,
Cross-Camera Re-ID Handover, and Cryptographic Proof-of-Surveillance.
"""

import time
import json
import asyncio
from typing import Dict, Any, List
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
import cv2
import numpy as np

# Core Engine Modules
from src.geoint.raycaster import GeoRayCastEngine, DronePose, CameraIntrinsics
from src.geoint.geofence import GeofenceManager, GeofencePolygon
from src.vision.aerial_detector import AerialDetector
from src.vision.face_recognizer import AegisFaceEngine
from src.vision.crowd_anomaly import CrowdAnomalyEngine
from src.tracking.mtmc_tracker import CrossCameraTracker
from src.security.audit_vault import ProofOfSurveillanceVault
from src.security.privacy_redact import PrivacyRedactionEngine
from src.simulation.telemetry_sim import TacticalSimulator

app = FastAPI(
    title="AegisDrone-GEOINT SentinelGrid-360",
    description="CipherCop 2026: AI for Smart Public Safety & Geospatial Intelligence",
    version="1.0.0"
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Singleton Engines
raycaster = GeoRayCastEngine()
geofence_mgr = GeofenceManager()
detector = AerialDetector()
face_engine = AegisFaceEngine()
crowd_engine = CrowdAnomalyEngine()
tracker = CrossCameraTracker()
vault = ProofOfSurveillanceVault()
redactor = PrivacyRedactionEngine()
simulator = TacticalSimulator()

# Register initial tactical geofences
geofence_mgr.register_geofence(GeofencePolygon(
    zone_id="ZONE-VIP-01",
    zone_name="VIP Enclosure & Stage Corridor",
    zone_type="RESTRICTED_ZONE",
    severity="CRITICAL",
    vertices=[
        [17.445700, 78.349750],
        [17.445750, 78.349900],
        [17.445650, 78.349950],
        [17.445600, 78.349800]
    ]
))

geofence_mgr.register_geofence(GeofencePolygon(
    zone_id="ZONE-CROWD-GATE-3",
    zone_name="North Entry Gate 3 (Bottleneck)",
    zone_type="CROWD_SURGE_ZONE",
    severity="WARNING",
    vertices=[
        [17.445800, 78.349650],
        [17.445900, 78.349800],
        [17.445820, 78.349850],
        [17.445720, 78.349700]
    ]
))


@app.get("/", response_class=HTMLResponse)
async def serve_c2_dashboard():
    """Serves the Tactical Command & Control dashboard."""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
    return HTMLResponse("<h2>AegisDrone C2 Server Initializing...</h2>")


@app.get("/api/status")
async def get_system_status():
    """Returns operational status across all 7 tactical sub-engines."""
    is_valid, msg = vault.verify_integrity()
    return {
        "status": "OPERATIONAL",
        "system": "AegisDrone-GEOINT SentinelGrid-360",
        "team": "Gradient Ascent",
        "members": ["Akshit Agarwal", "Aasutosh Dubey", "Atharve Dahima"],
        "event": "CipherCop 2026 Hackathon (ISB)",
        "track": "Track 1: AI for Smart Public Safety",
        "sub_engines": {
            "geoint_raycaster": "ACTIVE (Sub-2.5m ground accuracy)",
            "aerial_detector": "ACTIVE (SAHI Multi-Scale Slicing)",
            "face_super_resolution": "ACTIVE (ArcFace 512-D Cosine Index)",
            "crowd_anomaly_engine": "ACTIVE (Velocity Divergence Flux Monitor)",
            "cross_camera_tracker": "ACTIVE (UAV-CCTV MTMC Re-ID Handover)",
            "audit_vault": f"ACTIVE ({msg})",
            "privacy_redactor": "ACTIVE (DPDP Act Dynamic Civilian Masking)"
        },
        "active_geofences": len(geofence_mgr.geofences),
        "total_audit_blocks": len(vault.chain),
        "timestamp_epoch": time.time()
    }


@app.get("/api/audit")
async def get_audit_ledger():
    """Fetches the cryptographic Proof-of-Surveillance SHA-256 audit log."""
    is_valid, msg = vault.verify_integrity()
    return {
        "integrity_verified": is_valid,
        "verification_message": msg,
        "block_height": len(vault.chain),
        "ledger": [json.loads(json.dumps(b.__dict__)) for b in vault.chain]
    }


@app.get("/api/tracks")
async def get_active_tracks():
    """Returns all active multi-camera global tracks."""
    return {
        "active_tracks": tracker.get_active_tracks_summary()
    }


@app.get("/api/watchlist")
async def get_watchlist():
    """Returns registered criminal watchlist metadata."""
    records = []
    for s_id, r in face_engine.watchlist.items():
        records.append({
            "suspect_id": r.suspect_id,
            "name": r.name,
            "warrant_status": r.warrant_status,
            "risk_level": r.risk_level,
            "registered_at": r.registered_at_iso
        })
    return {"watchlist": records}


@app.get("/api/frame/{camera_id}")
async def get_camera_frame(camera_id: str, privacy: bool = True):
    """
    Renders and streams single annotated JPEG frame for the given camera.
    """
    elapsed = time.time() - simulator.start_time
    raw_frame, pose, sim_dets = simulator.get_simulated_scene(camera_id, elapsed)

    # 1. 4D Ray-Cast Photogrammetry
    georef_dets = []
    for d in sim_dets:
        proj = raycaster.bbox_to_ground_polygon(d["u_min"], d["v_min"], d["u_max"], d["v_max"], pose)
        if proj:
            d["latitude"] = proj["target_gps"]["latitude"]
            d["longitude"] = proj["target_gps"]["longitude"]
            d["ground_distance_m"] = proj["target_gps"]["ground_distance_m"]
        georef_dets.append(d)

    # 2. Privacy Redaction
    annotated = redactor.apply_privacy_filter(raw_frame, georef_dets, strict_anonymization=privacy)

    # Encode to JPEG
    ret, jpeg = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    return Response(content=jpeg.tobytes(), media_type="image/jpeg")


@app.websocket("/ws/tactical")
async def websocket_tactical_stream(websocket: WebSocket):
    """
    Real-time 10Hz bi-directional WebSocket streaming full tactical intelligence:
    Drone telemetry, ground target coordinates, active geofence breaches,
    crowd divergence fluxes, and cryptographic event updates.
    """
    await websocket.accept()
    active_cameras = ["UAV-ALPHA-01", "CCTV-POLE-04"]
    cam_index = 0

    try:
        while True:
            elapsed = time.time() - simulator.start_time
            cam_id = active_cameras[cam_index % len(active_cameras)]
            cam_index += 1

            raw_frame, pose, sim_dets = simulator.get_simulated_scene(cam_id, elapsed)

            # 1. 4D Ray-Casting on all detections
            processed_dets = []
            for d in sim_dets:
                proj = raycaster.bbox_to_ground_polygon(d["u_min"], d["v_min"], d["u_max"], d["v_max"], pose)
                if proj:
                    d["latitude"] = proj["target_gps"]["latitude"]
                    d["longitude"] = proj["target_gps"]["longitude"]
                    d["ground_distance_m"] = proj["target_gps"]["ground_distance_m"]
                processed_dets.append(d)

            # 2. MTMC Tracking & Cross-Camera Handover
            tracked_dets = tracker.update(cam_id, processed_dets, elapsed)

            # 3. Crowd Anomaly & Stampede Divergence Analysis
            crowd_report = crowd_engine.analyze_scene(tracked_dets, ground_area_sqm=150.0)

            # 4. Geofence Perimeter Evaluation
            breach_alerts = []
            for td in tracked_dets:
                alerts = geofence_mgr.evaluate_target(td["global_track_id"], td["latitude"], td["longitude"])
                breach_alerts.extend(alerts)

            # 5. Check for Handover or Warrant Hit Events to log in Cryptographic Vault
            for td in tracked_dets:
                if td.get("handover_event"):
                    vault.record_incident(
                        event_type="CROSS_CAMERA_HANDOVER",
                        target_id=td["global_track_id"],
                        lat=td["latitude"],
                        lon=td["longitude"],
                        details=td["handover_event"]
                    )
                if td.get("is_suspect"):
                    # Check if recently logged
                    if len(vault.chain) < 6:
                        vault.record_incident(
                            event_type="POSITIVE_WATCHLIST_MATCH",
                            target_id=td["global_track_id"],
                            lat=td["latitude"],
                            lon=td["longitude"],
                            details={
                                "suspect_name": td.get("suspect_name"),
                                "warrant": "RED_NOTICE",
                                "camera": cam_id
                            }
                        )

            # Construct Comprehensive Tactical Payload
            payload = {
                "timestamp_ms": int(time.time() * 1000),
                "elapsed_s": round(elapsed, 1),
                "current_camera": {
                    "camera_id": cam_id,
                    "latitude": pose.latitude,
                    "longitude": pose.longitude,
                    "altitude_agl_m": pose.altitude_agl_m,
                    "pitch_deg": pose.pitch_deg,
                    "yaw_deg": pose.yaw_deg
                },
                "targets": tracked_dets,
                "crowd_status": {
                    "stampede_risk": crowd_report.stampede_risk,
                    "stampede_prob": crowd_report.stampede_probability,
                    "divergence_flux": crowd_report.divergence_flux,
                    "density_pax_sqm": crowd_report.crowd_density_pax_sqm,
                    "fight_detected": crowd_report.fight_detected,
                    "active_alerts": crowd_report.active_alerts
                },
                "geofence_breaches": breach_alerts,
                "audit_block_height": len(vault.chain),
                "geofences": [
                    {
                        "zone_id": z.zone_id,
                        "zone_name": z.zone_name,
                        "zone_type": z.zone_type,
                        "severity": z.severity,
                        "vertices": z.vertices
                    }
                    for z in geofence_mgr.geofences.values()
                ]
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.1)  # 10 Hz broadcast

    except WebSocketDisconnect:
        pass
    except Exception as e:
        pass
