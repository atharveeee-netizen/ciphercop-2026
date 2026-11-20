"""
AegisDrone Security: Cryptographic Proof-of-Surveillance Audit Vault
Maintains a tamper-evident SHA-256 hash-chained ledger of all tactical incidents,
target detections, and biometric watchlist hits for indisputable judicial admissibility.
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Tuple
import hashlib
import hmac
import json
import time


@dataclass
class AuditBlock:
    """Immutable ledger record."""
    block_height: int
    timestamp_iso: str
    previous_hash: str
    event_type: str
    target_id: str
    latitude: float
    longitude: float
    details: Dict[str, Any]
    block_hash: str
    signature: str


class ProofOfSurveillanceVault:
    """
    Cryptographically sealed incident audit log.
    Every event mathematically links to all previous events.
    """

    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self, secret_key: str = "CIPHERCOP-2026-LAW-ENFORCEMENT-KEY"):
        self.secret_key = secret_key.encode("utf-8")
        self.chain: List[AuditBlock] = []
        self._init_genesis()

    def _init_genesis(self):
        """Creates block 0 (Genesis block)."""
        genesis_payload = {
            "title": "AegisDrone-GEOINT SentinelGrid-360 Genesis Block",
            "jurisdiction": "ISB CipherCop 2026 National Security Grid",
            "team": "Gradient Ascent"
        }
        b_hash, sig = self._calculate_hash_and_signature(
            0, "2026-11-20T10:00:00.000Z", self.GENESIS_HASH, "GENESIS", "SYSTEM", 0.0, 0.0, genesis_payload
        )
        genesis_block = AuditBlock(
            block_height=0,
            timestamp_iso="2026-11-20T10:00:00.000Z",
            previous_hash=self.GENESIS_HASH,
            event_type="GENESIS",
            target_id="SYSTEM",
            latitude=0.0,
            longitude=0.0,
            details=genesis_payload,
            block_hash=b_hash,
            signature=sig
        )
        self.chain.append(genesis_block)

    def _calculate_hash_and_signature(
        self,
        height: int,
        timestamp: str,
        prev_hash: str,
        event_type: str,
        target_id: str,
        lat: float,
        lon: float,
        details: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Calculates canonical SHA-256 block hash and HMAC signature."""
        details_str = json.dumps(details, sort_keys=True)
        raw_msg = f"{height}:{timestamp}:{prev_hash}:{event_type}:{target_id}:{lat:.7f}:{lon:.7f}:{details_str}"
        block_hash = hashlib.sha256(raw_msg.encode("utf-8")).hexdigest()
        signature = hmac.new(self.secret_key, block_hash.encode("utf-8"), hashlib.sha256).hexdigest()
        return block_hash, signature

    def record_incident(
        self,
        event_type: str,
        target_id: str,
        lat: float,
        lon: float,
        details: Dict[str, Any]
    ) -> AuditBlock:
        """
        Appends a new cryptographically verified block to the chain.
        """
        prev_block = self.chain[-1]
        height = len(self.chain)
        timestamp_iso = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())

        block_hash, signature = self._calculate_hash_and_signature(
            height, timestamp_iso, prev_block.block_hash, event_type, target_id, lat, lon, details
        )

        new_block = AuditBlock(
            block_height=height,
            timestamp_iso=timestamp_iso,
            previous_hash=prev_block.block_hash,
            event_type=event_type,
            target_id=target_id,
            latitude=lat,
            longitude=lon,
            details=details,
            block_hash=block_hash,
            signature=signature
        )
        self.chain.append(new_block)
        return new_block

    def verify_integrity(self) -> Tuple[bool, str]:
        """
        Validates entire blockchain from genesis to tip.
        Returns (True, 'LEDGER INTACT') or (False, error details).
        """
        if not self.chain:
            return False, "Chain is empty"

        # Verify Genesis
        if self.chain[0].previous_hash != self.GENESIS_HASH:
            return False, "Genesis block previous hash corrupted"

        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]

            # 1. Previous hash continuity
            if curr.previous_hash != prev.block_hash:
                return False, f"Broken chain link at height {i}: previous_hash mismatch"

            # 2. Re-calculate SHA-256 hash
            expected_hash, expected_sig = self._calculate_hash_and_signature(
                curr.block_height, curr.timestamp_iso, curr.previous_hash,
                curr.event_type, curr.target_id, curr.latitude, curr.longitude, curr.details
            )

            if curr.block_hash != expected_hash:
                return False, f"Hash tampered at height {i}: {curr.block_hash} vs expected {expected_hash}"

            if curr.signature != expected_sig:
                return False, f"Signature invalid at height {i}"

        return True, f"LEDGER INTACT: All {len(self.chain)} blocks cryptographically verified."

    def export_ledger_json(self) -> str:
        """Exports complete audit ledger as JSON for court evidence presentation."""
        return json.dumps([asdict(b) for b in self.chain], indent=2)
