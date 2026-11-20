"""
AegisDrone-GEOINT: Centralized Configuration & Environment Settings
Eliminates hardcoded values across the entire codebase.
All settings can be dynamically overridden via environment variables or .env files.
"""

import os
from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class SystemSettings:
    """Production runtime settings with dynamic environment resolution."""

    # Server & Networking
    HOST: str = field(default_factory=lambda: os.getenv("AEGIS_HOST", "0.0.0.0"))
    PORT: int = field(default_factory=lambda: int(os.getenv("AEGIS_PORT", "8000")))
    DEBUG: bool = field(default_factory=lambda: os.getenv("AEGIS_DEBUG", "false").lower() == "true")

    # Cryptographic & Security Vault
    SECRET_KEY: str = field(default_factory=lambda: os.getenv("AEGIS_SECRET_KEY", "CIPHERCOP-2026-LAW-ENFORCEMENT-ED25519-VAULT"))
    OPERATOR_ID: str = field(default_factory=lambda: os.getenv("AEGIS_OPERATOR_ID", "COMMANDER-ATHARVE-DAHIMA"))

    # Geographic Deployment Center (Default: ISB Cyberabad Campus / Hyderabad)
    BASE_LATITUDE: float = field(default_factory=lambda: float(os.getenv("AEGIS_BASE_LAT", "17.445620")))
    BASE_LONGITUDE: float = field(default_factory=lambda: float(os.getenv("AEGIS_BASE_LON", "78.349810")))
    BASE_ALTITUDE_AGL_M: float = field(default_factory=lambda: float(os.getenv("AEGIS_BASE_ALT_M", "55.0")))

    # Computer Vision & Biometrics Thresholds
    ARCFACE_MATCH_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("AEGIS_ARCFACE_THRESH", "0.78")))
    DETECTION_CONF_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("AEGIS_DETECTION_CONF", "0.40")))
    SAHI_TILE_SIZE: int = field(default_factory=lambda: int(os.getenv("AEGIS_TILE_SIZE", "640")))
    SAHI_OVERLAP_RATIO: float = field(default_factory=lambda: float(os.getenv("AEGIS_TILE_OVERLAP", "0.25")))

    # Crowd Anomaly & Stampede Early Warning Thresholds
    DIVERGENCE_FLUX_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("AEGIS_DIV_FLUX_THRESH", "1.80")))
    DENSITY_CRITICAL_PAX_SQM: float = field(default_factory=lambda: float(os.getenv("AEGIS_DENSITY_CRITICAL", "4.0")))
    FIGHT_VELOCITY_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("AEGIS_FIGHT_VEL_THRESH", "2.5")))

    # Multi-Camera Re-ID Handover Thresholds
    MAX_KINEMATIC_SPEED_KMH: float = field(default_factory=lambda: float(os.getenv("AEGIS_MAX_SPEED_KMH", "35.0")))
    REID_SIMILARITY_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("AEGIS_REID_THRESH", "0.72")))
    MAX_LOST_TRACK_TIME_S: float = field(default_factory=lambda: float(os.getenv("AEGIS_MAX_LOST_TIME", "45.0")))

    # Active Surveillance Nodes
    DEFAULT_UAV_NODES: List[str] = field(default_factory=lambda: os.getenv("AEGIS_UAV_NODES", "UAV-ALPHA-01,UAV-BRAVO-02").split(","))
    DEFAULT_CCTV_NODES: List[str] = field(default_factory=lambda: os.getenv("AEGIS_CCTV_NODES", "CCTV-POLE-04,CCTV-POLE-09").split(","))


settings = SystemSettings()
