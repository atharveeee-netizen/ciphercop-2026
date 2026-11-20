"""
AegisDrone Training Suite: Dataset Manager & Benchmark Loader
Provides automated manifests, verified academic download mirrors,
and synthetic training split generators for VisDrone, SODA-A, DroneSURF, RWF-2000, and CityFlow.
"""

import os
import json
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional
from pathlib import Path
import numpy as np
import cv2


@dataclass
class DatasetBenchmark:
    """Benchmark metadata specification."""
    name: str
    category: str  # DETECTION, BIOMETRIC, ANOMALY, TRACKING
    description: str
    size_stats: str
    official_url: str
    mirror_url: str
    license: str
    classes: List[str]


class DatasetManager:
    """
    Central registry and dataset loader for training AegisDrone-GEOINT models.
    """

    BENCHMARKS: Dict[str, DatasetBenchmark] = {
        "visdrone_det": DatasetBenchmark(
            name="VisDrone2021-DET",
            category="DETECTION",
            description="Aerial drone object detection across 14 cities from 10m to 120m AGL altitudes.",
            size_stats="10,209 high-resolution images, 540k annotations",
            official_url="http://aiskyeye.com/",
            mirror_url="https://github.com/VisDrone/VisDrone-Dataset",
            license="Academic Non-Commercial (CC BY-NC-SA 4.0)",
            classes=["pedestrian", "person", "bicycle", "car", "van", "truck", "tricycle", "motor"]
        ),
        "soda_a": DatasetBenchmark(
            name="SODA-A (Small Object Detection in Aerial Imagery)",
            category="DETECTION",
            description="Benchmark focused specifically on tiny aerial objects with areas below 16x16 pixels.",
            size_stats="2,513 ultra-high-res images (4740x2784), 872k instances",
            official_url="https://github.com/shaunyuan22/SODA",
            mirror_url="https://pan.baidu.com/s/1WXZ4w",
            license="Research Use Only",
            classes=["small-vehicle", "large-vehicle", "pedestrian", "ship", "storage-tank"]
        ),
        "dronesurf": DatasetBenchmark(
            name="DroneSURF (Drone Surveillance & Face Recognition)",
            category="BIOMETRIC",
            description="Dedicated UAV facial recognition dataset captured from 1.5m to 20m at 0° to 60° pitch.",
            size_stats="58 video sequences, 200 identities, 786k face frames",
            official_url="https://github.com/dronesurf/DroneSURF",
            mirror_url="https://iab-rubric.org/resources/dronesurf.html",
            license="Research Evaluation",
            classes=["face_oblique", "face_frontal", "face_profile"]
        ),
        "tinyface": DatasetBenchmark(
            name="TinyFace Benchmark",
            category="BIOMETRIC",
            description="Low-resolution surveillance face recognition benchmark (average 20x16 pixels).",
            size_stats="5,139 identities, 15,972 low-res face crops",
            official_url="https://qmul-tinyface.github.io/",
            mirror_url="https://github.com/daodaofr/TinyFace",
            license="Academic Research",
            classes=["low_res_face"]
        ),
        "rwf_2000": DatasetBenchmark(
            name="RWF-2000 (Real-World Fight Dataset)",
            category="ANOMALY",
            description="Video benchmark of real-world violent brawls vs normal surveillance crowd behaviors.",
            size_stats="2,000 video clips (1,000 violent, 1,000 normal)",
            official_url="https://github.com/tiansang-bingtian/RWF2000-Dataset",
            mirror_url="https://doi.org/10.1109/ICPR48806.2021.9412197",
            license="Academic",
            classes=["fight", "non_fight"]
        ),
        "drone_crowd": DatasetBenchmark(
            name="Drone-Crowd (Dense Crowd Dynamics)",
            category="ANOMALY",
            description="Drone video benchmark for dense crowd counting and stampede velocity modeling.",
            size_stats="112 video clips, 33,600 frames, 4.8 million person annotations",
            official_url="https://github.com/VisDrone/DroneCrowd",
            mirror_url="http://aiskyeye.com/views/dronecrowd",
            license="Academic Non-Commercial",
            classes=["crowd_pedestrian", "cyclist"]
        ),
        "cityflow": DatasetBenchmark(
            name="CityFlow MTMC Benchmark",
            category="TRACKING",
            description="Multi-Target Multi-Camera vehicle & pedestrian tracking across urban intersections.",
            size_stats="3.25 hours video, 40 cameras at 10 intersections, 229k bounding boxes",
            official_url="https://www.aicitychallenge.org/",
            mirror_url="https://github.com/CityFlow-Benchmark/CityFlowNL",
            license="AI City Challenge Terms",
            classes=["vehicle", "pedestrian"]
        )
    }

    def __init__(self, data_root: str = "./data"):
        self.data_root = Path(data_root)
        self.data_root.mkdir(parents=True, exist_ok=True)

    def export_manifest_json(self) -> str:
        """Exports all registered benchmark metadata into structured JSON."""
        return json.dumps({k: asdict(v) for k, v in self.BENCHMARKS.items()}, indent=2)

    def generate_synthetic_training_splits(
        self,
        num_samples: int = 100,
        output_dir: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Synthesizes a lightweight local calibration training set for rapid offline verification:
        Generates sample aerial pedestrian tiles (1280x720) and oblique face crops (24x24 px).
        """
        dest = Path(output_dir) if output_dir else self.data_root / "synthetic_calibration"
        dest_images = dest / "images"
        dest_labels = dest / "labels"
        dest_faces = dest / "faces"
        dest_images.mkdir(parents=True, exist_ok=True)
        dest_labels.mkdir(parents=True, exist_ok=True)
        dest_faces.mkdir(parents=True, exist_ok=True)

        rng = np.random.RandomState(42)

        for i in range(num_samples):
            # Synthetic aerial frame with multiple small targets
            frame = np.full((720, 1280, 3), 32, dtype=np.uint8)
            # Add grid background
            for x in range(0, 1280, 80):
                cv2.line(frame, (x, 0), (x, 720), (45, 50, 60), 1)

            num_targets = rng.randint(4, 15)
            label_lines = []

            for t in range(num_targets):
                cx = rng.randint(60, 1220)
                cy = rng.randint(60, 660)
                bw = rng.randint(14, 28)
                bh = rng.randint(28, 64)

                # Draw small target
                color = (rng.randint(180, 255), rng.randint(180, 255), rng.randint(180, 255))
                cv2.rectangle(frame, (cx - bw // 2, cy - bh // 2), (cx + bw // 2, cy + bh // 2), color, -1)

                # Normalized YOLO format: class cx cy w h
                label_lines.append(f"0 {cx/1280.0:.6f} {cy/720.0:.6f} {bw/1280.0:.6f} {bh/720.0:.6f}")

                # Save a 24x24 oblique face sample
                if t == 0:
                    face_crop = frame[max(0, cy - bh // 2):cy - bh // 2 + 24, max(0, cx - bw // 2):cx - bw // 2 + 24]
                    if face_crop.shape[0] == 24 and face_crop.shape[1] == 24:
                        cv2.imwrite(str(dest_faces / f"face_{i:04d}.jpg"), face_crop)

            # Write image and label
            cv2.imwrite(str(dest_images / f"aerial_{i:04d}.jpg"), frame)
            (dest_labels / f"aerial_{i:04d}.txt").write_text("\n".join(label_lines), encoding="utf-8")

        return {
            "synthetic_aerial_images": num_samples,
            "synthetic_face_crops": len(list(dest_faces.glob("*.jpg"))),
            "directory": str(dest)
        }
