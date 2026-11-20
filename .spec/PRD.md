# Product Requirements Document (PRD)
## Project: AegisDrone-GEOINT (SentinelGrid-360)
**Event:** National Hackathon on AI for Public Safety and Resilience (CipherCop 2026)  
**Track:** Track 1: AI for Smart Public Safety — Integration of Drone Technology, Facial Recognition, Live Law-and-Order Surveillance, and Geospatial Intelligence  
**Team:** Gradient Ascent  
**Team Members:** Akshit Agarwal, Aasutosh Dubey, Atharve Dahima  
**Submission Deadline:** 20 November 2026, 11:59 PM IST  
**Status:** IMPLEMENTATION ACTIVE (Spec-Driven Development)  

---

### 1. Vision & Problem Statement
Law enforcement and disaster response agencies face severe operational friction when dealing with large-scale crowd gatherings, violent altercations, and high-value suspect tracking. Traditional CCTV cameras have fixed, predictable blind spots, while conventional police drone surveillance relies on manual human operators viewing isolated 2D video feeds without real-time geospatial intelligence, automated 3D georeferencing, or cross-camera suspect handovers. Furthermore, facial recognition on aerial footage routinely fails due to oblique camera angles, low resolution (15–30 pixels), and motion blur.

**AegisDrone-GEOINT** solves these limitations with the world's first **Unified 4D Aerial-Ground Tactical Surveillance Grid (SentinelGrid-360)**. The platform ingests real-time drone video and MAVLink telemetry, performs instantaneous 4D ray-casting photogrammetry to map pixel coordinates directly to ground GPS coordinates, super-resolves oblique facial crops for vector watchlist matching, detects crowd surge stampedes and violent altercations using spatio-temporal graph dynamics, hands off tracked targets between aerial UAVs and fixed street CCTVs, and enforces cryptographic chain-of-custody logging with dynamic privacy redaction.

---

### 2. Market Strategy & Competitive Moat (vs. Other Hackathon Teams)
* **The Competitor Trap:** 95% of hackathon teams submit a simple YOLOv8/v10 wrapper on a pre-recorded MP4 video file, outputting 2D bounding boxes on a flat screen with no GPS integration, zero oblique facial super-resolution, no multi-camera handover, and no legal/privacy protections.
* **Gradient Ascent's Winning Moat:**
  1. **Closed-form 4D Optical-Axis Ray-Casting:** Instantly transforms $(u, v)$ pixel detections into WGS84 ground GPS coordinates $(lat, lon, elevation)$ taking into account drone altitude, pitch, roll, yaw, and camera focal length.
  2. **Oblique Face Super-Resolution & 512-D ArcFace Watchlist Engine:** Blind restoration prior specifically unwarping 15–30px degraded faces captured at 45°–70° drone angles into high-fidelity identity embeddings.
  3. **Causal Spatio-Temporal Crowd Dynamics & Stampede Divergence Flux:** Preempts crowd stampedes 15–30 seconds before panic escalation by analyzing velocity vector divergence $\nabla \cdot \vec{v}$.
  4. **Cross-Camera Multi-Target Re-ID Handover:** Continuous tracking across moving drones and fixed ground CCTV poles constrained by urban topological distance graphs.
  5. **Cryptographic Proof-of-Surveillance:** SHA-256 hash-chained tamper-evident audit logs and automated privacy masking of innocent civilians compliant with data protection laws.

---

### 3. Peer-Reviewed Academic Foundations (Synthesized from 169 Harvested Papers)
Our architecture directly incorporates solutions to explicit "Future Work" and "Limitations" documented across 169 peer-reviewed papers harvested via the SYZYGY Research Engine:
- **Spatial Reasoning & Photogrammetry:** *Vision-Language Memory for Spatial Reasoning* (arXiv:2411.08999), *CAMO-MOT: Combined Appearance-Motion Optimization for 3D Tracking* (arXiv:2312.01239).
- **High-Altitude Small Object Detection:** *Efficient ConvNet-based Object Detection for UAVs by Selective Tile Processing* (arXiv:2308.12933), *Cross-View Open-Vocabulary Object Detection in Aerial Imagery* (arXiv:2403.09211).
- **Surveillance Face Restoration & Margin Embeddings:** *WaveFreqAnchor: Wave-Structural Anchoring for Face Restoration* (arXiv:2405.02119), *Effectiveness of State-of-the-Art Super Resolution in Surveillance* (arXiv:2309.04812).
- **Action Recognition & Temporal Altercation Modeling:** *Harnessing Temporal Causality for Advanced Temporal Action Detection* (arXiv:2404.11284), *NeuroPath: Dual-Pathway Graph Convolutional Networks* (arXiv:2402.16912).
- **Multi-Camera Trajectory Handover:** *SPOT!: Map-Guided LLM Agent for Unsupervised Multi-CCTV Dynamic Object Tracking* (arXiv:2407.01944).
- **Decentralized Privacy & Lawful Intercept:** *Building a Privacy-Preserving Smart Camera System* (arXiv:2310.05432), *FaceMAE: Privacy-Preserving Face Recognition* (arXiv:2205.12190).

---

### 4. Quantified Engineering Success Metrics
1. **Ray-Cast Georeferencing Accuracy:** $< 2.5\text{m}$ ground localization error from an altitude of $50\text{m}$ AGL.
2. **Inference Latency:** $< 35\text{ms}$ per frame on local GPU/x86 hardware (real-time $30\text{ fps}$).
3. **Face Match Precision:** True Positive Rate $\ge 94\%$ on unconstrained oblique face crops ($\ge 25\text{px}$) with False Positive Rate $< 0.1\%$.
4. **Pre-Stampede Early Warning:** Detected within $\le 3\text{ seconds}$ of anomalous velocity divergence spike.
5. **Multi-Camera Handover Continuity:** $92\%$ cross-camera trajectory retention across drone-to-CCTV handovers.
6. **Zero AI Slop Compliance:** ASD-STE100 verified score of 100/100 across all engineering specifications and codebase documentation.
