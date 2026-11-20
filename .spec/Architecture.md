# System Architecture & Topology
## AegisDrone-GEOINT: Unified Aerial-Ground Tactical Surveillance Grid (SentinelGrid-360)
**CipherCop 2026 Hackathon** | **Track 1** | **Team Gradient Ascent**

---

### 1. High-Level Distributed Topology

```mermaid
graph TD
    subgraph "Aerial Tier (UAV Fleets)"
        UAV1["Drone 1 (Alpha) <br/> 4K Gimbal + PX4 MAVLink"]
        UAV2["Drone 2 (Bravo) <br/> Thermal + Optical RTSP"]
    end

    subgraph "Ground Tier (Fixed Infrastructure)"
        CCTV1["CCTV Pole 04 <br/> Junction 4A RTSP"]
        CCTV2["CCTV Pole 09 <br/> Main Gate RTSP"]
    end

    subgraph "Edge Ingestion & Telemetry Sync"
        INGEST["Zero-Copy Frame Grabber <br/> & Microsecond MAVLink Synchronizer"]
    end

    subgraph "Core AI & GEOINT Analytics Engine"
        RAYCAST["4D Ray-Cast Photogrammetry <br/> (Pixel-to-WGS84 GPS Engine)"]
        DETECTOR["Adaptive Aerial Vision <br/> (Multi-Scale Slicing SAHI)"]
        FACENET["Oblique Face Super-Resolution <br/> & 512-D ArcFace Matcher"]
        CROWD["Spatio-Temporal GNN <br/> (Stampede Divergence & Fight Detection)"]
        MTMC["Cross-Camera Re-ID Handover <br/> (Topology-Constrained Graph Tracker)"]
    end

    subgraph "Security, Privacy & Legal Trust"
        REDACT["Dynamic Civilian Redaction <br/> (DPDP Compliant Blur Engine)"]
        VAULT["Proof-of-Surveillance <br/> (SHA-256 Tamper-Evident Ledger)"]
    end

    subgraph "Command, Control & Dispatch (C2)"
        C2_SERVER["FastAPI Async WebSocket Hub <br/> & Spatial State Engine"]
        DASHBOARD["Tactical C2 Dashboard <br/> (WebGL 3D Map, GPS Heatmap, Alert Dispatch)"]
        POLICE_CAD["First-Responder CAD Dispatch <br/> (GPS Vector Intercept Feed)"]
    end

    UAV1 --> INGEST
    UAV2 --> INGEST
    CCTV1 --> INGEST
    CCTV2 --> INGEST

    INGEST --> RAYCAST
    INGEST --> DETECTOR

    DETECTOR --> FACENET
    DETECTOR --> CROWD
    DETECTOR --> MTMC

    RAYCAST --> MTMC
    RAYCAST --> C2_SERVER

    FACENET --> REDACT
    DETECTOR --> REDACT

    FACENET --> VAULT
    CROWD --> VAULT

    REDACT --> C2_SERVER
    MTMC --> C2_SERVER
    VAULT --> C2_SERVER

    C2_SERVER --> DASHBOARD
    C2_SERVER --> POLICE_CAD
```

---

### 2. Micro-Engine Component Breakdown

1. **`src/geoint/raycaster.py` (`GeoRayCastEngine`):**
   - Inputs: 2D bounding boxes $(u_{min}, v_{min}, u_{max}, v_{max})$, drone altitude $z_d$, drone GPS $(lat_d, lon_d)$, gimbal angles $(\theta, \phi, \psi)$, camera matrix $K$.
   - Output: Real-world ground polygon, ground target GPS $(lat_t, lon_t)$, ground footprint area $(m^2)$, and ground speed $(km/h)$.

2. **`src/vision/aerial_detector.py` (`AerialVisionEngine`):**
   - Inputs: Video frames (1080p / 4K).
   - Execution: SAHI-style multi-scale tile processing with non-maximum suppression; detects small objects (pedestrians, vehicles, weapons) down to 12x12 pixels.
   - Output: Class labels, confidence scores, pixel coordinates.

3. **`src/vision/face_recognizer.py` (`AegisFaceEngine`):**
   - Inputs: Cropped face regions from aerial drone feeds.
   - Execution: Perspective unwarping $\to$ High-frequency detail super-resolution $\to$ 512-D L2-normalized ArcFace embedding $\to$ Cosine similarity query against registered criminal gallery.
   - Output: Suspect identification, match confidence, active warrants.

4. **`src/vision/crowd_anomaly.py` (`CrowdAnomalyEngine`):**
   - Inputs: Optical flow fields and tracked person bounding box trajectories.
   - Execution: Spatio-temporal divergence flux calculation ($\nabla \cdot \vec{v}$) and skeletal altercation kinetics.
   - Output: Stampede risk level (LOW/MED/CRITICAL), violent fight detection alerts.

5. **`src/tracking/mtmc_tracker.py` (`CrossPlatformTracker`):**
   - Inputs: Detections and 4D coordinates across multiple camera nodes (UAV 1, UAV 2, CCTV 1, CCTV 2).
   - Execution: Spatio-temporal topological graph association using Kalman velocity forecasting and deep appearance Re-ID.
   - Output: Unified Global Track ID (`GT-XXXX`) persisting across camera boundaries.

6. **`src/security/audit_vault.py` (`ProofOfSurveillanceVault`):**
   - Inputs: Incident events (target matches, geofence breaches, fight alerts).
   - Execution: Cryptographic SHA-256 hash chaining with sequential nonce and HMAC signature.
   - Output: Cryptographic audit report and verification proof for judicial submission.

7. **`src/security/privacy_redact.py` (`PrivacyRedactionEngine`):**
   - Inputs: Raw video frame + detected face bounding boxes + watchlist match flags.
   - Execution: Automatically applies Gaussian feather blurring to all non-watchlist faces; unmasks only confirmed suspects.
   - Output: Privacy-compliant video stream for civilian monitoring compliance.

8. **`src/server/app.py` & Tactical C2 Console:**
   - Full asynchronous FastAPI backend with WebSocket streaming at 30 updates/sec.
   - Interactive Leaflet/WebGL map plotting live drone positions, target paths, heatmaps, and one-click dispatch.
