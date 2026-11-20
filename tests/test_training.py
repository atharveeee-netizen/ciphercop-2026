"""Unit tests for Dataset Manager and Training Suite"""

from src.training.dataset_manager import DatasetManager
from src.training.train_aerial_detector import AerialDetectorTrainer
from src.training.train_face_restoration import ArcFaceLossTrainer
from src.training.train_crowd_divergence import CrowdAnomalyCalibrator


def test_dataset_manager_manifests():
    """Verifies that all 7 benchmark datasets are registered with valid mirrors."""
    mgr = DatasetManager()
    assert len(mgr.BENCHMARKS) >= 7
    assert "visdrone_det" in mgr.BENCHMARKS
    assert "dronesurf" in mgr.BENCHMARKS
    assert "rwf_2000" in mgr.BENCHMARKS
    assert "cityflow" in mgr.BENCHMARKS

    manifest_json = mgr.export_manifest_json()
    assert "VisDrone2021-DET" in manifest_json


def test_aerial_detector_training_step():
    """Verifies loss decrease over training epochs."""
    trainer = AerialDetectorTrainer(dataset_name="visdrone_det", epochs=2)
    s1 = trainer.run_training_epoch(0)
    s2 = trainer.run_training_epoch(1)
    assert s2["total_loss"] < s1["total_loss"]
    assert s2["mAP_50"] > s1["mAP_50"]


def test_crowd_anomaly_calibration():
    """Verifies calibration yields positive divergence and fight velocity thresholds."""
    calibrator = CrowdAnomalyCalibrator(target_fpr=0.05)
    res = calibrator.calibrate()
    assert res["optimal_divergence_threshold"] > 0.0
    assert res["stampede_recall"] > 0.90
    assert res["optimal_fight_threshold"] > 0.0
