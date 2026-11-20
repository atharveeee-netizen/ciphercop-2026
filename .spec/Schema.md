# Data & Protocol Schemas
## AegisDrone-GEOINT: Unified Aerial-Ground Tactical Surveillance Grid
**CipherCop 2026** | **Team Gradient Ascent**

---

### 1. MAVLink Ingestion Schema (`DroneTelemetryPacket`)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DroneTelemetryPacket",
  "type": "object",
  "properties": {
    "drone_id": { "type": "string", "example": "UAV-ALPHA-01" },
    "timestamp_ms": { "type": "integer", "example": 1732103400120 },
    "latitude": { "type": "number", "minimum": -90.0, "maximum": 90.0, "example": 17.445620 },
    "longitude": { "type": "number", "minimum": -180.0, "maximum": 180.0, "example": 78.349810 },
    "altitude_agl_m": { "type": "number", "minimum": 0.0, "example": 55.4 },
    "gimbal_pitch_deg": { "type": "number", "minimum": -90.0, "maximum": 30.0, "example": -45.0 },
    "gimbal_roll_deg": { "type": "number", "example": 0.0 },
    "gimbal_yaw_deg": { "type": "number", "minimum": 0.0, "maximum": 360.0, "example": 135.2 },
    "ground_speed_mps": { "type": "number", "example": 8.5 },
    "battery_pct": { "type": "integer", "minimum": 0, "maximum": 100, "example": 84 }
  },
  "required": ["drone_id", "timestamp_ms", "latitude", "longitude", "altitude_agl_m", "gimbal_pitch_deg", "gimbal_yaw_deg"]
}
```

---

### 2. 4D Georeferenced Target Detection Schema (`Target4D`)
```json
{
  "target_id": "TGT-8492",
  "global_track_id": "GT-104",
  "camera_source": "UAV-ALPHA-01",
  "timestamp_iso": "2026-11-20T17:45:00.120Z",
  "class_name": "person",
  "confidence": 0.94,
  "pixel_bbox": {
    "u_min": 540,
    "v_min": 320,
    "u_max": 590,
    "v_max": 410
  },
  "geospatial": {
    "latitude": 17.445892,
    "longitude": 78.350114,
    "estimated_elevation_m": 0.0,
    "ground_distance_m": 62.4,
    "ground_speed_kmh": 4.8,
    "heading_deg": 128.5
  },
  "biometric": {
    "face_detected": true,
    "matched_watchlist": true,
    "suspect_id": "SUSPECT-WARRANT-441",
    "suspect_name": "Rohan Sharma",
    "match_confidence": 0.892,
    "warrant_type": "RED_NOTICE_FUGITIVE",
    "privacy_unmasked": true
  }
}
```

---

### 3. Spatio-Temporal Crowd Anomaly Alert Schema (`CrowdAlert`)
```json
{
  "alert_id": "ALERT-CROWD-9912",
  "timestamp_iso": "2026-11-20T17:45:02.000Z",
  "source_node": "UAV-ALPHA-01",
  "alert_type": "PRE_STAMPEDE_DIVERGENCE_SURGE",
  "severity": "CRITICAL",
  "metrics": {
    "crowd_headcount": 480,
    "density_pax_sqm": 4.2,
    "velocity_divergence_flux": 2.84,
    "velocity_variance": 1.45
  },
  "geocenter": {
    "latitude": 17.445910,
    "longitude": 78.350180,
    "radius_m": 35.0
  },
  "recommended_action": "DISPATCH_FIRST_RESPONDERS_TO_GATE_3B_HOLD_PERIMETER"
}
```

---

### 4. Cryptographic Proof-of-Surveillance Ledger Entry (`AuditBlock`)
```json
{
  "block_height": 142,
  "previous_hash": "a8f3b9c011e4e3...3d9",
  "timestamp_iso": "2026-11-20T17:45:00.125Z",
  "operator_id": "OFFICER-ATHARVE-99",
  "incident_type": "POSITIVE_WATCHLIST_IDENTIFICATION",
  "target_id": "TGT-8492",
  "ground_coordinates": { "lat": 17.445892, "lon": 78.350114 },
  "telemetry_digest": "4c98f8...91a",
  "block_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "signature_hmac": "7b8893d...ef10"
}
```
