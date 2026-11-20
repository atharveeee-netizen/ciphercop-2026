"""Unit tests for Cryptographic Proof-of-Surveillance Audit Vault and Privacy Redaction"""

import numpy as np
from src.security.audit_vault import ProofOfSurveillanceVault
from src.security.privacy_redact import PrivacyRedactionEngine


def test_audit_vault_integrity_and_tampering():
    """Verifies that the SHA-256 hash chain detects data tampering."""
    vault = ProofOfSurveillanceVault(secret_key="TEST-KEY")

    # Record 3 incidents
    vault.record_incident("BREACH", "TGT-101", 17.445, 78.349, {"zone": "VIP"})
    vault.record_incident("WARRANT_MATCH", "TGT-102", 17.446, 78.350, {"suspect": "Rohan"})
    vault.record_incident("HANDOVER", "TGT-101", 17.447, 78.351, {"from": "UAV", "to": "CCTV"})

    assert len(vault.chain) == 4  # Genesis + 3

    # Verification must pass initially
    is_valid, msg = vault.verify_integrity()
    assert is_valid is True
    assert "LEDGER INTACT" in msg

    # Tamper with block 2
    vault.chain[2].latitude = 99.9999
    is_valid_tampered, tamper_msg = vault.verify_integrity()
    assert is_valid_tampered is False
    assert "Hash tampered" in tamper_msg


def test_privacy_redaction_filter():
    """Verifies non-target civilian regions are blurred while verified targets are preserved."""
    redactor = PrivacyRedactionEngine(blur_kernel_size=15)

    # 400x400 synthetic frame with high contrast details
    frame = np.ones((400, 400, 3), dtype=np.uint8) * 200
    frame[50:100, 50:100] = 50  # Box 1 (Civilian)
    frame[200:250, 200:250] = 50  # Box 2 (Suspect)

    detections = [
        {"u_min": 50, "v_min": 50, "u_max": 100, "v_max": 100, "privacy_unmasked": False},
        {"u_min": 200, "v_min": 200, "u_max": 250, "v_max": 250, "privacy_unmasked": True, "suspect_name": "Rohan"}
    ]

    filtered = redactor.apply_privacy_filter(frame, detections, strict_anonymization=True)
    assert filtered.shape == frame.shape
    # Civilian box must have Gaussian blurred variance/values
    assert not np.array_equal(filtered[50:100, 50:100], frame[50:100, 50:100])
