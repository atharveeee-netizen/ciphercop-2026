# OpenDesign Contract: AegisDrone Tactical Avionic C2 Console (Design.md)
## Brand: DEFENSE-TACTICAL | Project: AegisDrone-GEOINT SentinelGrid-360
### Reference Implementation: halilxibrahim/uav-telemetry-dashboard (MIT)

---

### 1. Visual Tokens & Dark Avionic Theme
- **Base Canvas:** `#0a0e17` (Deep Tactical Obsidian)
- **Panel Surface:** `rgba(17, 24, 39, 0.88)` (Translucent Slate 900 with 12px Backdrop Blur)
- **Panel Border:** `rgba(30, 41, 59, 0.70)` (Slate 800)
- **Panel Border Hover:** `rgba(0, 229, 255, 0.35)` (Avionic Cyan Glow)
- **Accent Tactical Cyan:** `#00e5ff` (Primary Instruments, Reticles, Mission Active Nodes)
- **Accent Law Enforcement Green:** `#22c55e` (Normal Sensor Status, DPDP Privacy Active)
- **Accent Warning Amber:** `#f59e0b` (Elevated Crowd Density, Aircraft Reference Wings)
- **Accent Tactical Red:** `#ef4444` (Geofence Breach, Red Notice Fugitive, Critical Surge)
- **Text Primary:** `#e2e8f0` (Slate 200)
- **Text Secondary:** `#94a3b8` (Slate 400)
- **Text Muted:** `#64748b` (Slate 500)

---

### 2. Typography Hierarchy & Numerals
- **Headings & Branding:** `Space Grotesk`, sans-serif (Weights: 600, 700, letter-spacing: 1.2px)
- **Avionic Telemetry & Readouts:** `JetBrains Mono`, monospace (Weights: 400, 600, 700)
- **Tabular Numerals:** `font-variant-numeric: tabular-nums` to prevent layout jitter during 10Hz streaming updates
- **General UI Labels:** `Inter`, sans-serif (Weights: 400, 500)

---

### 3. Cockpit 3-Column Layout Architecture
- **Top Header Bar:** Brand icon, system subtitle, connection beacon (`WS CONNECTED`), flight timer, DPDP privacy toggle, UTC clock, and Emergency Dispatch CTA.
- **Mission Stepper Bar:** 6-stage operational progression (`PRE-FLIGHT` ➔ `TAKEOFF` ➔ `EN ROUTE` ➔ `ON STATION` ➔ `RTL` ➔ `LANDING`) with active pulsing glow and percentage tracker.
- **Left Column (38%):**
  - 4D WGS84 Leaflet Tactical GIS Map with CartoDB Dark Matter tiles, UAV marker, raycasted ground target pins, and geofence polygons.
  - Dual-Camera Video HUD (UAV 4K optical/thermal vs CCTV 1080P) with DPDP Act 2023 privacy filter, reticle, and telemetry banner.
- **Middle Column (34%):**
  - Instrument Gauges: Heading (rotating SVG compass needle & cardinal direction), Altitude (vertical progress bar), Speed (horizontal bar), Battery (level bar & nominal voltage).
  - HTML5 Canvas Artificial Horizon (Attitude Indicator): Pitch ladder (-40° to +40°), roll indicator arc, triangle pointer, yellow aircraft wings, clipped sky/ground gradients running at 60fps.
  - Environmental Sensor Matrix: `TEMP`, `PRES`, `WIND`, `SATS`, `HDOP`, `RSSI` with real-time operational status badges.
- **Right Column (28%):**
  - Intelligent Multi-Level Alert Stream (`CRITICAL`, `WARNING`, `INFO`).
  - Crowd Panic & Stampede Early Warning Barometer with velocity divergence flux ($\nabla \cdot \vec{v}$).
  - Biometric Watchlist Hit Card (ArcFace 512-D match confidence, fugitive warrant, Intercept Dispatch CTA).
  - Cryptographic Proof-of-Surveillance SHA-256 Blockchain Ledger.

---

### 4. Motion, Physics & Lerp
- **Artificial Horizon Smoothing:** Linear interpolation (Lerp $\alpha = 0.15$) on pitch, roll, and yaw updates for smooth avionic response.
- **Pulse Indicators:** 1.6s ease-in-out breathing keyframe animation on active alerts and geofence breach perimeters.
