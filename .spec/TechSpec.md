# Technical Specification (TechSpec)
## Project: AegisDrone-GEOINT (SentinelGrid-360)
**Track:** Track 1: AI for Smart Public Safety (CipherCop 2026)  
**Team:** Gradient Ascent (Akshit Agarwal, Aasutosh Dubey, Atharve Dahima)  

---

### 1. Mathematical Formulations & Core Algorithms

#### 1.1 4D Optical-Axis Photogrammetric Ray-Casting (`GeoRayCast`)
To convert pixel coordinates $(u, v)$ on a camera sensor to WGS84 ground coordinates $(lat, lon, elevation)$:

Given:
* Camera intrinsic matrix:
  $$K = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}$$
* Normalized camera ray in camera reference frame:
  $$\vec{r}_c = K^{-1} \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \begin{bmatrix} (u - c_x)/f_x \\ (v - c_y)/f_y \\ 1 \end{bmatrix}$$
* Drone 3D world position $\vec{P}_{drone} = [x_d, y_d, z_d]^T$ where $z_d$ is the altitude above ground level (AGL).
* Drone Euler orientation: Roll $\phi$, Pitch $\theta$, Yaw $\psi$.
* 3D Rotation Matrix $R = R_z(\psi) R_y(\theta) R_x(\phi)$:
  $$R_x(\phi) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\phi & -\sin\phi \\ 0 & \sin\phi & \cos\phi \end{bmatrix}, \quad R_y(\theta) = \begin{bmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{bmatrix}, \quad R_z(\psi) = \begin{bmatrix} \cos\psi & -\sin\psi & 0 \\ \sin\psi & \cos\psi & 0 \\ 0 & 0 & 1 \end{bmatrix}$$
* World ray direction:
  $$\vec{r}_w = R \cdot \vec{r}_c = [r_{wx}, r_{wy}, r_{wz}]^T$$
* Intersection parameter with ground plane $z = 0$ (or Digital Elevation Model $z = h_{ground}$):
  $$t = \frac{h_{ground} - z_d}{r_{wz}}$$
* Ground intersection coordinates in local tangent plane (East, North, Up):
  $$x_{ground} = x_d + t \cdot r_{wx}, \quad y_{ground} = y_d + t \cdot r_{wy}$$
* Transformation to WGS84 Geodetic Coordinates:
  $$lat = lat_{drone} + \frac{y_{ground}}{R_{earth}}, \quad lon = lon_{drone} + \frac{x_{ground}}{R_{earth} \cos(lat_{drone})}$$
  where $R_{earth} \approx 6,378,137\text{ meters}$.

#### 1.2 Spatio-Temporal Crowd Velocity Divergence Flux
Given tracked crowd bounding box centroids $(x_i(t), y_i(t))$ with instantaneous optical velocities $\vec{v}_i = [v_{xi}, v_{yi}]^T$:
$$\text{Divergence Flux } \mathcal{D}(x, y, t) = \nabla \cdot \vec{v} = \frac{\partial v_x}{\partial x} + \frac{\partial v_y}{\partial y}$$
* **Panic / Stampede Warning Condition:**
  $$\mathcal{D}(t) > \tau_{div} \quad \text{AND} \quad \text{Var}(\|\vec{v}_i\|) > \sigma^2_{threshold}$$
  This captures sudden explosive outward surges of fleeing pedestrians while filtering out uniform orderly movements.

#### 1.3 Oblique Face Super-Resolution & 512-D Angular Margin Metric
* Detected face crop $I_{crop} \in \mathbb{R}^{H \times W \times 3}$.
* Affine perspective rectification using detected 5-point facial landmarks (eyes, nose, mouth corners) to cancel drone pitch angle $\theta$:
  $$I_{rect} = \mathcal{W}(I_{crop}, M_{affine})$$
* Restoration prior super-resolves $I_{rect}$ to standard $112 \times 112$ canonical space:
  $$\hat{I} = \mathcal{G}_{restore}(I_{rect})$$
* Feature extraction into 512-D unit hypersphere:
  $$\vec{e} = \frac{\mathcal{F}(\hat{I})}{\|\mathcal{F}(\hat{I})\|_2} \in \mathbb{S}^{511}$$
* Watchlist similarity score against criminal gallery $\{\vec{g}_k\}$:
  $$\text{Sim}(\vec{e}, \vec{g}_k) = \vec{e}^T \vec{g}_k = \cos(\theta_k)$$
* Target match trigger: $\cos(\theta_k) \ge \tau_{match} = 0.82$.

#### 1.4 Cryptographic Proof-of-Surveillance Hash Chain
Every verified incident $E_i$ produces a tamper-evident audit record:
$$H_i = \text{SHA-256}(H_{i-1} \parallel \text{Timestamp} \parallel \text{Lat,Lon} \parallel \text{TargetID} \parallel \text{Confidence} \parallel \text{TelemetryHash})$$
Guarantees mathematical non-repudiation for courtroom admissibility.

---

### 2. Runtime Stack & Infrastructure
* **Backend Framework:** FastAPI / Uvicorn (Asynchronous REST + WebSocket daemon)
* **Computer Vision Engine:** OpenCV (cv2) + PyTorch + NumPy vectorized spatial tensor ops
* **Spatial & Geometry:** NumPy + SciPy Spatial KDTree (sub-millisecond spatial queries)
* **Cryptographic Engine:** SHA-256 hash chains + HMAC-SHA256 signature verification
* **Frontend Tactical C2 Console:** Modern WebGL / Leaflet.js interactive dark-theme C2 dashboard with real-time WebSocket telemetry ingestion (sub-30ms latency)
* **Telemetry Protocol:** MAVLink 2.0 compatible packet framing (`GLOBAL_POSITION_INT`, `ATTITUDE`, `VFR_HUD`)

---

### 3. API & WebSocket Interface Specifications

| Endpoint | Protocol | Purpose | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | System health & agent readiness check | Returns status of all 7 core micro-engines |
| `/api/telemetry/inject` | POST | Ingests live MAVLink drone telemetry packet | `{drone_id, lat, lon, alt_agl, pitch, roll, yaw, battery, speed}` |
| `/api/detection/frame` | POST | Process frame with 4D raycasting & detection | Multi-part video frame + drone telemetry header |
| `/api/watchlist/query` | POST | 1:N biometric watchlist vector query | Returns matched suspect ID, name, warrant status, and confidence |
| `/api/watchlist/register`| POST | Register new person of interest to watchlist | `{person_id, name, criminal_record, face_image_b64}` |
| `/api/audit/chain` | GET | Fetch cryptographic proof-of-surveillance log | Returns full SHA-256 tamper-evident verification ledger |
| `/ws/c2-stream` | WebSocket| Real-time live bi-directional tactical telemetry | Emits 30Hz target GPS, drone positions, crowd heatmaps, & active alerts |
